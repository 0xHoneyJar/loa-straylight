// Phase 50A patch cycle 1 — focused regressions for the two durability
// defects Codex found by direct probe (audit comment 5135002802, findings 2
// and 3).
//
// Finding 2 — Promise-like callback commit race
//   `withEstateSession` committed immediately after `body(session)` without
//   inspecting the returned value. A callback that returned a Promise had its
//   writes committed (`committed: true`, one durable actor row) and only THEN
//   rejected, so callback-error rollback and commit-before-success were both
//   violated. The correction REFUSES a Promise-like return value — it does not
//   make asynchronous callbacks a feature.
//
// Finding 3 — payload-only idempotency
//   The unique-violation path classified an existing immutable id by canonical
//   payload alone. A direct-SQL row with the same id and payload but a
//   different promoted `estate_id` was therefore counted as an idempotent
//   convergence: the session reported `committed: true` with
//   `{inserted: 0, idempotent: 1}` while ZERO rows were visible to the estate
//   it was writing. The correction compares the COMPLETE durable row.
//
// Both suites assert on DURABLE state read back through a fresh connection, so
// a passing result cannot come from in-session bookkeeping.

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { EstateStore, InMemoryStorage, type StorageAdapter } from '../../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../../fixtures/index.js';
import {
  PostgresIntegrityError,
  PostgresUnavailableError,
  canonicalPayload,
} from '../../src/straylight/storage/postgres/index.js';
import {
  openScratchDatabase,
  phase50aEnabled,
  phase50aGateReport,
  requireReachable,
  sourceHost,
  type ScratchDatabase,
} from './_support.js';

const NOW = '2026-05-05T12:00:00Z';
const ESTATE_ID = loadEstate().estate_id;
const OTHER_ESTATE_ID = 'estate:wrong-promoted-column';

phase50aGateReport('postgres-callback-and-row-idempotency');

const maybe = phase50aEnabled() ? describe : describe.skip;

// ── Finding 2 — Promise-like callbacks are refused, nothing commits ─────

maybe('Phase 50A patch — a Promise-like callback is refused before any durable write', () => {
  let db: ScratchDatabase;
  /** Unhandled rejections observed for the duration of one test. */
  let unhandled: unknown[];
  let onUnhandled: (reason: unknown) => void;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  beforeEach(async () => {
    db = await openScratchDatabase(sourceHost(), 'async-callback');
    unhandled = [];
    onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);
  }, 60_000);

  afterEach(async () => {
    process.off('unhandledRejection', onUnhandled);
    await db.dispose();
  });

  /**
   * Every durable row count in the database, read through a FRESH session.
   * "Nothing became durable" is asserted against this, never against the
   * refused session's own view.
   */
  async function durableCounts(target: ScratchDatabase): Promise<Record<string, number>> {
    return target.host.withClient(async (client) => {
      const tables = [
        'actors',
        'actor_estates',
        'keyrings',
        'estate_assertions',
        'estate_transitions',
        'transition_receipts',
        'recall_receipts',
        'audit_events',
      ] as const;
      const out: Record<string, number> = {};
      for (const table of tables) {
        const r = await client.query<{ n: string }>(`SELECT count(*)::text AS n FROM ${table}`);
        out[table] = Number(r.rows[0]?.n ?? '-1');
      }
      return out;
    });
  }

  const ZERO_ROWS = {
    actors: 0,
    actor_estates: 0,
    keyrings: 0,
    estate_assertions: 0,
    estate_transitions: 0,
    transition_receipts: 0,
    recall_receipts: 0,
    audit_events: 0,
  };

  /** Let any microtask/timer-scheduled rejection surface before asserting. */
  async function drainMicrotasks(): Promise<void> {
    await new Promise((r) => setTimeout(r, 50));
  }

  it('an ALREADY-REJECTED Promise is refused: no commit, zero durable rows, no unhandled rejection', async () => {
    // The exact probe shape from the audit: the callback writes through the
    // session AND returns an already-rejected Promise.
    //
    // The Promise is constructed INSIDE the callback, which is both faithful to
    // the probe and necessary for the assertion to mean anything: a rejected
    // Promise created before `withEstateSession` would sit unattached across
    // every `await` the host performs before reaching the callback, and Node
    // would report an unhandled rejection for the TEST's own construction
    // rather than for anything the host did.
    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.upsertActor(loadActor());
        return Promise.reject(new Error('late async callback failure'));
      }),
    ).rejects.toMatchObject({
      name: 'PostgresUnavailableError',
      reason: 'async_callback_unsupported',
    });

    await drainMicrotasks();
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('a Promise that rejects LATER is refused at return time, and its rejection is absorbed', async () => {
    let rejectLater: ((err: Error) => void) | undefined;
    const pending = new Promise<string>((_resolve, reject) => {
      rejectLater = reject;
    });

    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.upsertActor(loadActor());
        storage.upsertEstate(loadEstate());
        return pending;
      }),
    ).rejects.toMatchObject({ reason: 'async_callback_unsupported' });

    // The refusal already happened. Rejecting now must not produce an
    // unhandled rejection, and must not resurrect the transaction.
    rejectLater?.(new Error('rejected after the refusal'));
    await drainMicrotasks();

    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('a Promise that RESOLVES later is still refused — async callbacks are not a feature', async () => {
    let resolveLater: ((value: string) => void) | undefined;
    const pending = new Promise<string>((resolve) => {
      resolveLater = resolve;
    });

    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('must not be durable'), NOW);
        return pending;
      }),
    ).rejects.toMatchObject({ reason: 'async_callback_unsupported' });

    // A successful eventual resolution does not retroactively make the refused
    // operation succeed: the transaction is already rolled back.
    resolveLater?.('resolved after the refusal');
    await drainMicrotasks();

    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('code resuming AFTER an await cannot mutate the session: it is already closed', async () => {
    // The callback captures the session, returns a Promise, and then — after an
    // await, i.e. after the host has already refused and rolled back — tries to
    // write. That write must throw `session_closed`, not mutate a decided
    // transaction.
    let postAwaitError: unknown;
    let postAwaitAttempted = false;

    const escaped: { storage?: StorageAdapter } = {};

    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        escaped.storage = storage;
        return (async () => {
          await Promise.resolve();
          postAwaitAttempted = true;
          try {
            storage.upsertActor(loadActor());
          } catch (err) {
            postAwaitError = err;
          }
          return 'unreachable-as-a-result';
        })();
      }),
    ).rejects.toMatchObject({ reason: 'async_callback_unsupported' });

    await drainMicrotasks();

    expect(postAwaitAttempted, 'the post-await body must actually have run').toBe(true);
    expect(postAwaitError).toBeInstanceOf(PostgresUnavailableError);
    expect(postAwaitError).toMatchObject({ reason: 'session_closed' });

    // The escaped reference is inert for reads too.
    expect(() => escaped.storage?.getActor(loadActor().actor_id)).toThrow(
      PostgresUnavailableError,
    );

    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('a non-Promise THENABLE is refused too (the check is thenable-shaped, not instanceof Promise)', async () => {
    let thenCalls = 0;
    const thenable = {
      then(onFulfilled: (v: string) => void) {
        thenCalls += 1;
        onFulfilled('thenable value');
      },
    };

    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.upsertActor(loadActor());
        return thenable;
      }),
    ).rejects.toMatchObject({ reason: 'async_callback_unsupported' });

    await drainMicrotasks();
    expect(thenCalls, 'the thenable must have been settled/absorbed exactly once').toBe(1);
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  // ── patch cycle 2, finding 1 — `then` is read EXACTLY ONCE ─────────────
  //
  // The defect Codex found by direct probe: the refusal read `then` TWICE — once
  // in the shape check and again in the absorber — despite the comment claiming
  // the first read was reused. A stateful getter whose first access returned a
  // bound `then` for a delayed-rejecting Promise and whose second access threw
  // therefore saw two accesses, and the second access's throw meant the
  // settlement was never absorbed: the delayed rejection escaped as an
  // `unhandledRejection`.
  //
  // The correction captures the callable `then` once (`captureThen`) and invokes
  // THAT captured function, with the original value as its receiver.

  it('a STATEFUL `then` getter is accessed exactly ONCE, and its delayed rejection is absorbed', async () => {
    let accesses = 0;
    /** Receivers `then` was invoked with — must be the original object only. */
    const receivers: unknown[] = [];
    let rejectLater: ((err: Error) => void) | undefined;
    const pending = new Promise<string>((_resolve, reject) => {
      rejectLater = reject;
    });

    // The exact adversarial shape from the audit: access #1 hands back a
    // working `then` whose Promise rejects LATER; access #2 throws. Under the
    // defect the second access happened and threw, so nothing absorbed the
    // rejection.
    const hostile = {
      get then() {
        accesses += 1;
        if (accesses > 1) {
          throw new Error(`hostile then getter: unexpected access #${accesses}`);
        }
        return function then(
          this: unknown,
          onFulfilled: (v: unknown) => void,
          onRejected: (e: unknown) => void,
        ) {
          receivers.push(this);
          return pending.then(onFulfilled, onRejected);
        };
      },
    };

    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.upsertActor(loadActor());
        return hostile;
      }),
    ).rejects.toMatchObject({
      name: 'PostgresUnavailableError',
      reason: 'async_callback_unsupported',
    });

    // EXACTLY ONE access. Two would mean the getter could observe — or poison —
    // the refusal a second time, which is the defect.
    expect(accesses, 'the `then` getter must be read exactly once').toBe(1);

    // The captured `then` was invoked with the ORIGINAL value as its receiver.
    // A detached call would pass undefined and would break a native Promise's
    // `then`, which reads internal slots from its receiver.
    expect(receivers).toHaveLength(1);
    expect(receivers[0]).toBe(hostile);

    // Now settle the underlying Promise. The refusal already happened; this must
    // be absorbed through the captured `then`, NOT surface as an unhandled
    // rejection.
    rejectLater?.(new Error('delayed rejection after the refusal'));
    await drainMicrotasks();

    // Still exactly one access after settlement — the absorber never re-reads.
    expect(accesses).toBe(1);
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled, 'a delayed rejection must not escape as unhandledRejection').toEqual([]);
  });

  it('a `then` GETTER that throws on its FIRST access does not displace the outcome', async () => {
    // Nothing can be captured and nothing was ever scheduled, so there is no
    // settlement to absorb. The value is treated as an ordinary return rather
    // than the getter's throw replacing the operation's own outcome.
    let accesses = 0;
    const hostile = {
      get then() {
        accesses += 1;
        throw new Error('getter throws immediately');
      },
    };

    const out = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      storage.upsertActor(loadActor());
      return hostile;
    });

    // Not a thenable as far as the store can tell, so the ordinary synchronous
    // path applies: it commits, and the getter's error is not raised.
    expect(out.committed).toBe(true);
    expect(accesses).toBe(1);
    expect((await durableCounts(db))['actors']).toBe(1);
    expect(unhandled).toEqual([]);
  });

  it('a NATIVE Promise is absorbed through its own `then`, with itself as receiver', async () => {
    // The receiver matters most for a native Promise: `Promise.prototype.then`
    // reads internal slots, so invoking a detached copy would throw instead of
    // absorbing. This is the regression guarding the `Reflect.apply` receiver.
    let rejectLater: ((err: Error) => void) | undefined;

    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.upsertActor(loadActor());
        return new Promise<string>((_resolve, reject) => {
          rejectLater = reject;
        });
      }),
    ).rejects.toMatchObject({ reason: 'async_callback_unsupported' });

    rejectLater?.(new Error('native promise rejecting after the refusal'));
    await drainMicrotasks();

    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('a thenable whose `then` THROWS synchronously still yields the refusal, not its own error', async () => {
    const hostile = {
      then() {
        throw new Error('hostile then');
      },
    };

    await expect(
      db.host.withEstateSession(ESTATE_ID, () => hostile),
    ).rejects.toMatchObject({ reason: 'async_callback_unsupported' });

    await drainMicrotasks();
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('the ordinary SYNCHRONOUS callback still commits — the refusal is narrow', async () => {
    const out = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      const result = newStore(storage).admit(observation('synchronous and durable'), NOW);
      return result.ok;
    });
    expect(out.value).toBe(true);
    expect(out.committed).toBe(true);

    const counts = await durableCounts(db);
    expect(counts['estate_assertions']).toBe(1);
    expect(counts['audit_events']).toBe(1);
    expect(unhandled).toEqual([]);
  });

  it('a callback returning undefined/null/0/"" is NOT mistaken for a thenable', async () => {
    for (const value of [undefined, null, 0, '', false] as const) {
      const fresh = await openScratchDatabase(sourceHost(), 'falsy-return');
      try {
        const out = await fresh.host.withEstateSession(ESTATE_ID, (storage) => {
          storage.upsertActor(loadActor());
          return value;
        });
        expect(out.committed).toBe(true);
        expect(out.value).toBe(value);
        expect((await durableCounts(fresh))['actors']).toBe(1);
      } finally {
        await fresh.dispose();
      }
    }
    expect(unhandled).toEqual([]);
  });
});

// ── Finding 3 — idempotency requires COMPLETE-ROW equality ─────────────

maybe('Phase 50A patch — immutable-record idempotency compares the complete durable row', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  beforeEach(async () => {
    db = await openScratchDatabase(sourceHost(), 'complete-row-idem');
  }, 60_000);

  afterEach(async () => {
    await db.dispose();
  });

  /**
   * Produce one committed transition + audit event for ESTATE_ID, and return
   * the exact durable rows so a probe can replay them with one column altered.
   *
   * The records are CAPTURED from an in-memory run and replayed, matching the
   * real retry shape (`postgres-conformance.test.ts`): re-executing `admit`
   * against a store that already holds the first attempt derives the same
   * content-addressed transition id but a DIFFERENT audit reference, which is
   * conflicting reuse rather than a retry.
   */
  async function seedOneAdmission(): Promise<{
    captured: CapturedRecords;
    transition: DurableTransition;
    audit: DurableAudit;
  }> {
    const captured = captureAdmitRecords('seed');
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAdmitRecords(storage, captured);
    });
    const rows = await db.host.withClient(async (client) => {
      const t = await client.query<DurableTransition>(
        `SELECT transition_id, estate_id, append_position::text AS append_position, payload
           FROM estate_transitions ORDER BY append_position ASC LIMIT 1`,
      );
      const a = await client.query<DurableAudit>(
        `SELECT audit_event_id, estate_id, append_position::text AS append_position,
                audit_hash, previous_audit_hash, previous_audit_hash_key, payload
           FROM audit_events ORDER BY append_position ASC LIMIT 1`,
      );
      const transition = t.rows[0];
      const audit = a.rows[0];
      if (transition === undefined || audit === undefined) {
        throw new Error('seedOneAdmission: expected one transition and one audit event');
      }
      return { transition, audit };
    });
    return { captured, ...rows };
  }

  /**
   * The EXACT retry must STAY idempotent. This is the behaviour the
   * complete-row comparison must not break: every promoted column of the
   * replayed record matches the durable row, so it converges.
   */
  it('an EXACT retry of an already-durable record is still idempotent', async () => {
    const captured = captureAdmitRecords('exact retry');

    // Three append-only rows: the audit event, the transition, and the
    // transition receipt. (Upserted rows — actor, estate, keyring, assertion —
    // are not counted here; only append-only inserts are classified.)
    const first = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAdmitRecords(storage, captured);
    });
    expect(first.committed).toBe(true);
    expect(first.persisted.inserted).toBe(3);
    expect(first.persisted.idempotent).toBe(0);

    // Replaying the IDENTICAL captured records converges on every append-only
    // row rather than duplicating or conflicting.
    const second = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAdmitRecords(storage, captured);
    });
    expect(second.committed).toBe(true);
    expect(second.persisted.inserted).toBe(0);
    expect(second.persisted.idempotent).toBe(3);

    // And exactly one durable row of each kind exists.
    const counts = await db.host.withClient(async (client) => {
      const r = await client.query<{ transitions: string; audits: string; receipts: string }>(
        `SELECT (SELECT count(*)::text FROM estate_transitions)  AS transitions,
                (SELECT count(*)::text FROM audit_events)        AS audits,
                (SELECT count(*)::text FROM transition_receipts) AS receipts`,
      );
      return r.rows[0];
    });
    expect(counts).toEqual({ transitions: '1', audits: '1', receipts: '1' });
  });

  /**
   * The adversarial shape, one column at a time. Each case inserts — by DIRECT
   * SQL, bypassing the adapter entirely — a row carrying the SAME immutable id
   * and the SAME canonical payload as the record the session is about to write,
   * but with ONE promoted durable column deliberately wrong. Every one must be
   * refused as an integrity conflict and roll the whole transaction back; none
   * may be counted as idempotent.
   */
  const transitionCases: Array<{
    name: string;
    /**
     * The reason the store must refuse with. Both values are fail-closed
     * integrity refusals; which one fires depends on WHERE the wrongness
     * becomes visible.
     */
    reason: 'immutable_id_conflict' | 'append_prefix_mutated';
    mutate: (row: DurableTransition) => DurableTransition;
  }> = [
    {
      // The planted row belongs to a DIFFERENT estate, so it is invisible to
      // this estate's snapshot and to its prefix fingerprint. The collision is
      // only discovered when the INSERT hits the primary key — which is exactly
      // the path that used to compare the payload alone and answer "idempotent".
      name: 'wrong promoted estate_id',
      reason: 'immutable_id_conflict',
      mutate: (row) => ({ ...row, estate_id: OTHER_ESTATE_ID }),
    },
    {
      // The planted row belongs to THIS estate at a bogus position, so it IS in
      // the snapshot — and the load-time dense-position guard refuses it before
      // the session ever writes. That is the stronger outcome (refused earlier),
      // and asserting the specific reason proves the refusal is the positional
      // guarantee rather than an incidental error.
      name: 'wrong promoted append_position',
      reason: 'append_prefix_mutated',
      mutate: (row) => ({ ...row, append_position: String(Number(row.append_position) + 41) }),
    },
  ];

  for (const testCase of transitionCases) {
    it(`estate_transitions: same id and payload with ${testCase.name} is REFUSED, not idempotent`, async () => {
      const { captured, transition } = await seedOneAdmission();

      // A fresh database that does NOT hold the record, seeded by direct SQL
      // with the deliberately-wrong row.
      const probe = await openScratchDatabase(sourceHost(), 'probe-transition');
      try {
        const planted = testCase.mutate(transition);
        await probe.host.withClient(async (client) => {
          await client.query(
            `INSERT INTO estate_transitions
               (transition_id, estate_id, append_position, payload)
             VALUES ($1, $2, $3, $4::jsonb)`,
            [
              planted.transition_id,
              planted.estate_id,
              planted.append_position,
              JSON.stringify(planted.payload),
            ],
          );
        });

        // Now write the CANONICAL record through the adapter. It must be
        // REFUSED — never counted as an idempotent convergence.
        await expect(
          probe.host.withEstateSession(ESTATE_ID, (storage) => {
            replayAdmitRecords(storage, captured);
            return true;
          }),
        ).rejects.toMatchObject({
          name: 'PostgresIntegrityError',
          reason: testCase.reason,
        });

        // The whole transaction rolled back: the planted row is untouched and
        // NOTHING the session attempted became durable. In particular no audit
        // event and no assertion exists.
        const after = await probe.host.withClient(async (client) => {
          const t = await client.query<{ n: string }>(
            'SELECT count(*)::text AS n FROM estate_transitions',
          );
          const a = await client.query<{ n: string }>(
            'SELECT count(*)::text AS n FROM audit_events',
          );
          const s = await client.query<{ n: string }>(
            'SELECT count(*)::text AS n FROM estate_assertions',
          );
          const kept = await client.query<{ estate_id: string; append_position: string }>(
            `SELECT estate_id, append_position::text AS append_position
               FROM estate_transitions WHERE transition_id = $1`,
            [planted.transition_id],
          );
          return {
            transitions: t.rows[0]?.n,
            audits: a.rows[0]?.n,
            assertions: s.rows[0]?.n,
            kept: kept.rows[0],
          };
        });
        expect(after.transitions).toBe('1');
        expect(after.audits).toBe('0');
        expect(after.assertions).toBe('0');
        expect(after.kept).toEqual({
          estate_id: planted.estate_id,
          append_position: planted.append_position,
        });
      } finally {
        await probe.dispose();
      }
    });
  }

  const auditCases: Array<{
    name: string;
    mutate: (row: DurableAudit) => DurableAudit;
  }> = [
    {
      name: 'wrong promoted estate_id',
      mutate: (row) => ({ ...row, estate_id: OTHER_ESTATE_ID }),
    },
    {
      name: 'wrong promoted audit_hash',
      // The column disagrees with the payload's own audit_hash. Complete-row
      // comparison must catch it on the promoted column.
      mutate: (row) => ({ ...row, audit_hash: `${row.audit_hash.slice(0, -4)}dead` }),
    },
    {
      name: 'wrong promoted previous_audit_hash and normalized key',
      // Genesis has no parent (NULL / ''). Planting a parent makes both the
      // nullable column and its normalized projection differ. They must be
      // written consistently or the schema CHECK rejects the row outright, so
      // this case exercises the pair as the enforcement unit it is.
      mutate: (row) => ({
        ...row,
        previous_audit_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        previous_audit_hash_key:
          'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      }),
    },
    {
      name: 'wrong normalized previous-hash key alone',
      // The nullable column stays NULL while the normalized key claims a
      // parent. The schema's `previous_audit_hash_key = COALESCE(...)` CHECK
      // refuses this pair, so the DATABASE is what fails closed here — which is
      // the guarantee: an inconsistent enforcement pair cannot exist to be
      // compared against in the first place.
      mutate: (row) => ({ ...row, previous_audit_hash_key: 'sha256:forged-key' }),
    },
  ];

  for (const testCase of auditCases) {
    it(`audit_events: same id and payload with ${testCase.name} is REFUSED, not idempotent`, async () => {
      const { captured, audit } = await seedOneAdmission();
      const probe = await openScratchDatabase(sourceHost(), 'probe-audit');
      try {
        const planted = testCase.mutate(audit);

        // `append_position = 1` with a non-empty parent key violates the
        // genesis-shape CHECK, so a planted parent must also move the position.
        // Keeping the position at 1 would make the DATABASE refuse the plant
        // rather than the adapter refuse the write, which proves a different
        // (also correct) guarantee. Record which side refused.
        let plantRefused: unknown;
        try {
          await probe.host.withClient(async (client) => {
            await client.query(
              `INSERT INTO audit_events
                 (audit_event_id, estate_id, append_position, audit_hash,
                  previous_audit_hash, previous_audit_hash_key, payload)
               VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
              [
                planted.audit_event_id,
                planted.estate_id,
                planted.append_position,
                planted.audit_hash,
                planted.previous_audit_hash,
                planted.previous_audit_hash_key,
                JSON.stringify(planted.payload),
              ],
            );
          });
        } catch (err) {
          plantRefused = err;
        }

        if (plantRefused !== undefined) {
          // The database itself refused the inconsistent row. That IS the
          // fail-closed outcome for this shape: the forged row cannot become
          // durable, so it can never be mistaken for an idempotent match.
          expect(String(plantRefused)).toMatch(/audit_events|check|constraint|integrity/i);
          const remaining = await probe.host.withClient(async (client) => {
            const r = await client.query<{ n: string }>(
              'SELECT count(*)::text AS n FROM audit_events',
            );
            return r.rows[0]?.n;
          });
          expect(remaining).toBe('0');
          return;
        }

        // The plant is durable. Writing the canonical record must now be
        // refused by complete-row comparison.
        await expect(
          probe.host.withEstateSession(ESTATE_ID, (storage) => {
            replayAdmitRecords(storage, captured);
            return true;
          }),
        ).rejects.toMatchObject({ name: 'PostgresIntegrityError' });

        const after = await probe.host.withClient(async (client) => {
          const a = await client.query<{ n: string }>(
            'SELECT count(*)::text AS n FROM audit_events',
          );
          const s = await client.query<{ n: string }>(
            'SELECT count(*)::text AS n FROM estate_assertions',
          );
          const t = await client.query<{ n: string }>(
            'SELECT count(*)::text AS n FROM estate_transitions',
          );
          return { audits: a.rows[0]?.n, assertions: s.rows[0]?.n, transitions: t.rows[0]?.n };
        });
        // Only the planted audit row survives; nothing the refused session
        // attempted is durable.
        expect(after.audits).toBe('1');
        expect(after.assertions).toBe('0');
        expect(after.transitions).toBe('0');
      } finally {
        await probe.dispose();
      }
    });
  }

  it('append_position reaches the CLASSIFIER too: same id and payload, right estate is unchanged, position wrong', async () => {
    // The load-time dense-position guard fires when the bad row is in THIS
    // estate's snapshot. To exercise the unique-violation classifier on
    // `append_position` specifically, the planted row must be invisible to the
    // snapshot yet still collide on the primary key — so plant it under a
    // different estate AND at a wrong position, then confirm the reported
    // mismatch names a promoted column rather than the payload.
    const { captured, transition } = await seedOneAdmission();
    const probe = await openScratchDatabase(sourceHost(), 'probe-position');
    try {
      await probe.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO estate_transitions
             (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [
            transition.transition_id,
            OTHER_ESTATE_ID,
            String(Number(transition.append_position) + 41),
            JSON.stringify(transition.payload),
          ],
        );
      });

      let caught: unknown;
      try {
        await probe.host.withEstateSession(ESTATE_ID, (storage) => {
          replayAdmitRecords(storage, captured);
        });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(PostgresIntegrityError);
      expect(caught).toMatchObject({ reason: 'immutable_id_conflict' });
      // The classifier compared PROMOTED columns, not the payload: the payload
      // is byte-identical here, so a payload-only comparison would have
      // answered "idempotent" and committed.
      const message = String((caught as Error).message);
      expect(message).toMatch(/estate_id|append_position/);

      // Nothing durable from the refused session.
      const after = await probe.host.withClient(async (client) => {
        const a = await client.query<{ n: string }>(
          'SELECT count(*)::text AS n FROM audit_events',
        );
        const t = await client.query<{ n: string }>(
          'SELECT count(*)::text AS n FROM estate_transitions',
        );
        return { audits: a.rows[0]?.n, transitions: t.rows[0]?.n };
      });
      expect(after).toEqual({ audits: '0', transitions: '1' });
    } finally {
      await probe.dispose();
    }
  });

  it('the canonical payload the probe replays really is byte-identical, so the tests are not vacuous', async () => {
    // If the planted payload differed from the incoming one, every refusal
    // above would pass for the wrong reason (payload mismatch rather than
    // promoted-column mismatch). Assert the payload equality the cases rely on.
    const { captured, transition } = await seedOneAdmission();
    const probe = await openScratchDatabase(sourceHost(), 'probe-vacuity');
    try {
      await probe.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO estate_transitions
             (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [
            transition.transition_id,
            OTHER_ESTATE_ID,
            transition.append_position,
            JSON.stringify(transition.payload),
          ],
        );
      });

      // Re-derive the record the adapter would write and compare canonical
      // payloads against the planted row's payload.
      let incomingCanonical = '';
      await expect(
        probe.host.withEstateSession(ESTATE_ID, (storage) => {
          replayAdmitRecords(storage, captured);
          incomingCanonical = canonicalPayload(captured.transition);
          return true;
        }),
      ).rejects.toMatchObject({ reason: 'immutable_id_conflict' });

      const plantedCanonical = await probe.host.withClient(async (client) => {
        const r = await client.query<{ payload: unknown }>(
          'SELECT payload FROM estate_transitions WHERE transition_id = $1',
          [transition.transition_id],
        );
        return canonicalPayload(r.rows[0]?.payload);
      });

      expect(incomingCanonical.length).toBeGreaterThan(0);
      expect(plantedCanonical).toBe(incomingCanonical);
    } finally {
      await probe.dispose();
    }
  });

  it('an existing row with the same id but a DIFFERENT payload is still refused (unchanged behaviour)', async () => {
    const { captured, transition } = await seedOneAdmission();
    const probe = await openScratchDatabase(sourceHost(), 'probe-payload');
    try {
      await probe.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO estate_transitions
             (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [
            transition.transition_id,
            transition.estate_id,
            transition.append_position,
            JSON.stringify({ ...(transition.payload as object), tampered: true }),
          ],
        );
      });
      await expect(
        probe.host.withEstateSession(ESTATE_ID, (storage) => {
          replayAdmitRecords(storage, captured);
          return true;
        }),
      ).rejects.toMatchObject({ reason: 'immutable_id_conflict' });
    } finally {
      await probe.dispose();
    }
  });

  it('PostgresIntegrityError is the class raised, so callers can distinguish it from unavailability', async () => {
    const { captured, transition } = await seedOneAdmission();
    const probe = await openScratchDatabase(sourceHost(), 'probe-class');
    try {
      await probe.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO estate_transitions
             (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [
            transition.transition_id,
            OTHER_ESTATE_ID,
            transition.append_position,
            JSON.stringify(transition.payload),
          ],
        );
      });
      let caught: unknown;
      try {
        await probe.host.withEstateSession(ESTATE_ID, (storage) => {
          replayAdmitRecords(storage, captured);
        });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(PostgresIntegrityError);
      expect(caught).not.toBeInstanceOf(PostgresUnavailableError);
      // The message names the offending column, so an operator can see WHY.
      expect(String((caught as Error).message)).toContain('estate_id');
    } finally {
      await probe.dispose();
    }
  });
});

// ── row shapes ─────────────────────────────────────────────────────────

interface DurableTransition {
  transition_id: string;
  estate_id: string;
  /** Selected as text: bigint would otherwise arrive as a string anyway. */
  append_position: string;
  payload: unknown;
}

interface DurableAudit {
  audit_event_id: string;
  estate_id: string;
  append_position: string;
  audit_hash: string;
  previous_audit_hash: string | null;
  previous_audit_hash_key: string;
  payload: unknown;
}

// ── helpers ─────────────────────────────────────────────────────────────

/**
 * The exact canonical records ONE admission produces, captured from an
 * in-memory run so they can be replayed byte-identically.
 *
 * Capturing (rather than re-executing `admit`) is what makes a retry a real
 * retry: re-executing against a store that already holds the first attempt
 * derives the same content-addressed `transition_id` but a DIFFERENT audit
 * reference, because the chain tail moved — that is conflicting reuse, and it
 * is proven to fail closed elsewhere. Same rationale and shape as
 * `postgres-conformance.test.ts`.
 */
interface CapturedRecords {
  actor: ReturnType<typeof loadActor>;
  estate: ReturnType<typeof loadEstate>;
  keyring: ReturnType<typeof loadKeyring>;
  assertion: NonNullable<ReturnType<EstateStore['admit']>['assertion']>;
  transition: ReturnType<EstateStore['admit']>['transition'];
  transitionReceipt: ReturnType<EstateStore['admit']>['receipt'];
  auditEvents: ReturnType<StorageAdapter['listAuditEvents']>;
}

function captureAdmitRecords(text: string): CapturedRecords {
  const storage = new InMemoryStorage();
  const store = newStore(storage);
  const admit = store.admit(observation(text), NOW);
  expect(admit.ok).toBe(true);
  return {
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    assertion: admit.assertion!,
    transition: admit.transition,
    transitionReceipt: admit.receipt,
    auditEvents: storage
      .listAuditEvents(ESTATE_ID)
      .filter((e) => e.event_type === 'assertion_admitted'),
  };
}

/** Write exactly the captured records through the adapter, in order. */
function replayAdmitRecords(storage: StorageAdapter, captured: CapturedRecords): void {
  storage.upsertActor(captured.actor);
  storage.upsertKeyring(captured.keyring);
  storage.upsertEstate(captured.estate);
  storage.upsertAssertion(captured.assertion);
  for (const event of captured.auditEvents) {
    storage.appendAuditEvent(event);
  }
  storage.appendTransition(captured.transition);
  storage.upsertTransitionReceipt(captured.transitionReceipt);
}

function newStore(storage: StorageAdapter): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    storage,
  });
}

function observation(text: string) {
  return buildCandidate({
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}
