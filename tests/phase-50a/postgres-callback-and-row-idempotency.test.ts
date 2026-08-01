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
//
// Patch cycle 2 added the single-read `then` capture regression (audit comment
// 5136408097, finding 1). Patch cycle 3 adds the fail-closed regression for a
// `then` getter that THROWS on that one access (audit comment 5147131563,
// concern 1): the previous correction caught the exception and returned `null`,
// so the value was treated as a synchronous result and COMMITTED. Both are in
// the Promise-like suite below.

import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

/** Repository root, for the structural shared-column-set guard (R2). */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

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

  // ── patch cycle 3, concern 1 — a THROWING `then` getter FAILS CLOSED ────
  //
  // The defect Codex found by direct probe at the exact head: `captureThen`
  // caught the first `then` access's exception and returned `null`, which
  // `withEstateSession` read as "not a thenable". The refused-value branch was
  // therefore skipped entirely and the ordinary synchronous path ran: the
  // session closed, its delta persisted, and the transaction COMMITTED. The
  // probe observed one getter access, `committed: true`, and one durable actor
  // row — so a callback could reach COMMIT precisely by making the store's
  // inspection FAIL.
  //
  // The correction distinguishes "proven non-thenable" from "could not be
  // determined" (`ThenReadOutcome`) and refuses the latter, on the same path
  // and at the same point as a thenable: before `session.close()`, before
  // `persistDelta`, and before COMMIT.

  it('a `then` GETTER that throws on its FIRST access FAILS CLOSED: refused, rolled back, zero durable rows', async () => {
    let accesses = 0;
    const getterError = new Error('getter throws immediately');
    const hostile = {
      get then() {
        accesses += 1;
        throw getterError;
      },
    };

    let caught: unknown;
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        // A real mutation, so "nothing became durable" is a claim with teeth:
        // under the defect this row committed.
        storage.upsertActor(loadActor());
        return hostile;
      });
    } catch (err) {
      caught = err;
    }

    // (a) A BOUNDED refusal of the store's own class and reason — NOT the
    // getter's error object. A hostile getter must not be able to choose the
    // error class the caller sees, and callers keep one reason to match on.
    expect(caught, 'the operation must be refused, not resolved').toBeInstanceOf(
      PostgresUnavailableError,
    );
    expect(caught).toMatchObject({ reason: 'async_callback_unsupported' });
    expect(caught).not.toBe(getterError);
    // (a2) REDACTION. The getter's exception does not cross the public error
    // boundary at all: not its message, not its stack, not its cause, not its
    // identity. The previous expectation here REQUIRED the message to survive
    // as "bounded detail", which is precisely the leak this remediation closes
    // — caller-supplied error text was published through the store's own error.
    // See `assertBoundedGetterRefusal` for the full assertion.
    assertBoundedGetterRefusal(caught, getterError, 'getter throws immediately');

    // (b) EXACTLY ONE getter access. The refusal path must not re-read the
    // property — a second access is the patch-cycle-2 defect, and here it would
    // also throw again.
    expect(accesses, 'the `then` getter must be read exactly once').toBe(1);

    // (c) ZERO durable rows: the refusal happened before close/persist/COMMIT
    // and the transaction rolled back. Read through a FRESH connection.
    await drainMicrotasks();
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);

    // (d) No unhandled rejection. Nothing was captured, so nothing was ever
    // scheduled to settle — the absence must be real, not incidental.
    expect(unhandled).toEqual([]);
  });

  // ── rejection-remediation R1 — the bounded public error boundary ────────
  //
  // The rejected implementation formatted the getter's exception into the
  // public `PostgresUnavailableError` via `describe()`. Two defects followed:
  //
  //   (1) LEAK — an ordinary Error's message (caller-supplied text, and with
  //       it anything the caller chose to put there) was published through the
  //       store's own error surface.
  //   (2) ESCAPE — `describe()` calls `String(err)` for a non-Error, so a value
  //       whose conversion-to-string itself THROWS made `describe()` throw at
  //       the refusal site. `classify()` then called `describe()` again on that
  //       exception, and the ORIGINAL object reached the caller in place of the
  //       bounded refusal (Codex: caughtIsGetterException=true,
  //       caughtIsBoundedError=false).
  //
  // The correction carries nothing out of the failed read at all. These tests
  // pin BOTH the behavioural guarantees (single read, rollback, invalidation,
  // no unhandled rejection) and the redaction.

  it('R1: a getter exception whose STRINGIFICATION throws still yields the bounded error', async () => {
    // The exact escape shape. `String(value)` throws for this object, so any
    // implementation that formats the caught exception fails INSIDE its own
    // refusal path — and the original object escapes instead of the bounded
    // error. Nothing may be stringified, so nothing can throw.
    let accesses = 0;
    let toStringCalls = 0;
    const unstringifiable = {
      get message(): string {
        throw new Error('message getter also throws');
      },
      toString(): string {
        toStringCalls += 1;
        throw new Error('toString throws');
      },
      [Symbol.toPrimitive](): string {
        toStringCalls += 1;
        throw new Error('toPrimitive throws');
      },
    };
    const hostile = {
      get then(): never {
        accesses += 1;
        throw unstringifiable;
      },
    };

    let caught: unknown;
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.upsertActor(loadActor());
        return hostile;
      });
    } catch (err) {
      caught = err;
    }

    // The BOUNDED error, not the unstringifiable object.
    expect(caught, 'the original exception must not escape').not.toBe(unstringifiable);
    expect(caught).toBeInstanceOf(PostgresUnavailableError);
    expect(caught).toMatchObject({ reason: 'async_callback_unsupported' });
    // The store never attempted to convert the value to a string.
    expect(toStringCalls, 'the refusal must not stringify the caught value').toBe(0);
    expect(accesses).toBe(1);

    // Behavioural guarantees unchanged: rollback, nothing durable, no
    // unhandled rejection.
    await drainMicrotasks();
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('R1: the getter error’s message, stack, and cause are all absent from the public error', async () => {
    const probeText = 'CALLBACK-INTERNAL-DETAIL-c0ffee';
    const inner = new Error('inner cause detail');
    const getterError = new Error(probeText, { cause: inner });
    let accesses = 0;

    let caught: unknown;
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.upsertActor(loadActor());
        return {
          get then(): never {
            accesses += 1;
            throw getterError;
          },
        };
      });
    } catch (err) {
      caught = err;
    }

    assertBoundedGetterRefusal(caught, getterError, probeText);
    // The nested cause's text must not appear either.
    const err = caught as Error;
    expect(`${err.message}${err.stack ?? ''}`).not.toContain('inner cause detail');
    expect(accesses).toBe(1);

    await drainMicrotasks();
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('R1: a getter throwing a non-Error (string, symbol-bearing object) is refused without leaking it', async () => {
    // `describe()` fell back to `String(err)` for non-Errors, so a primitive
    // payload was published verbatim. Nothing is reported now, for any shape.
    for (const payload of ['RAW-STRING-LEAK-abc123', 12345, { marker: 'OBJ-LEAK-xyz789' }]) {
      const fresh = await openScratchDatabase(sourceHost(), 'r1-nonerror');
      try {
        let caught: unknown;
        try {
          await fresh.host.withEstateSession(ESTATE_ID, (storage) => {
            storage.upsertActor(loadActor());
            return {
              get then(): never {
                throw payload;
              },
            };
          });
        } catch (err) {
          caught = err;
        }
        expect(caught).toBeInstanceOf(PostgresUnavailableError);
        expect(caught).toMatchObject({ reason: 'async_callback_unsupported' });
        expect(caught).not.toBe(payload);
        const text = `${(caught as Error).message}${(caught as Error).stack ?? ''}`;
        for (const fragment of ['RAW-STRING-LEAK-abc123', 'OBJ-LEAK-xyz789', '12345']) {
          expect(text).not.toContain(fragment);
        }
        expect(await durableCounts(fresh)).toEqual(ZERO_ROWS);
      } finally {
        await fresh.dispose();
      }
    }
    await drainMicrotasks();
    expect(unhandled).toEqual([]);
  });

  it('R1: the refusal happens BEFORE close, persistence, and COMMIT — proven by ordering', async () => {
    // The refusal point is a behavioural claim, not a code-reading claim: if it
    // happened after `session.close()` the escaped session's failure mode would
    // differ, and if it happened after `persistDelta` a row would be durable.
    // Assert the observable consequences of the ordering.
    const escaped: { storage?: StorageAdapter } = {};
    let caught: unknown;
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        escaped.storage = storage;
        storage.upsertActor(loadActor());
        storage.upsertEstate(loadEstate());
        return {
          get then(): never {
            throw new Error('ordering probe');
          },
        };
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toMatchObject({ reason: 'async_callback_unsupported' });
    // Nothing persisted: the refusal preceded persistDelta and COMMIT.
    await drainMicrotasks();
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    // The session was INVALIDATED (abandon), so it reports the closed reason
    // rather than having produced a delta through `close()`.
    let readErr: unknown;
    try {
      escaped.storage?.getActor(loadActor().actor_id);
    } catch (err) {
      readErr = err;
    }
    expect(readErr).toMatchObject({ reason: 'session_closed' });
    expect(unhandled).toEqual([]);
  });

  it('the session escaped from a throwing-getter callback is UNUSABLE afterwards', async () => {
    // The companion guarantee to (c): the session is invalidated, so a callback
    // that squirreled the reference away cannot write into a decided
    // transaction — for reads or writes.
    const escaped: { storage?: StorageAdapter } = {};
    let accesses = 0;

    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        escaped.storage = storage;
        storage.upsertActor(loadActor());
        return {
          get then() {
            accesses += 1;
            throw new Error('undecidable thenability');
          },
        };
      }),
    ).rejects.toMatchObject({
      name: 'PostgresUnavailableError',
      reason: 'async_callback_unsupported',
    });

    expect(accesses).toBe(1);
    expect(escaped.storage, 'the callback must actually have received a session').toBeDefined();

    // Writes and reads both refuse with `session_closed`.
    expect(() => escaped.storage?.upsertActor(loadActor())).toThrow(PostgresUnavailableError);
    let readErr: unknown;
    try {
      escaped.storage?.getActor(loadActor().actor_id);
    } catch (err) {
      readErr = err;
    }
    expect(readErr).toMatchObject({ reason: 'session_closed' });

    await drainMicrotasks();
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('a getter that throws is refused even when the callback mutated NOTHING', async () => {
    // Narrowness check: the refusal is a property of the return value, not a
    // consequence of pending writes. An empty delta must not commit either.
    await expect(
      db.host.withEstateSession(ESTATE_ID, () => ({
        get then(): never {
          throw new Error('undecidable, empty delta');
        },
      })),
    ).rejects.toMatchObject({ reason: 'async_callback_unsupported' });

    await drainMicrotasks();
    expect(await durableCounts(db)).toEqual(ZERO_ROWS);
    expect(unhandled).toEqual([]);
  });

  it('a NON-throwing `then` getter returning a NON-function still commits — the refusal is narrow', async () => {
    // The boundary next to the refusal: the property was READ successfully and
    // is provably not callable, so the value is provably NOT thenable and the
    // ordinary synchronous path must still apply. This is what keeps the
    // fail-closed correction from swallowing legitimate return values that
    // merely happen to own a `then` property.
    let accesses = 0;
    const notThenable = {
      get then() {
        accesses += 1;
        return 'not a function';
      },
    };

    const out = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      storage.upsertActor(loadActor());
      return notThenable;
    });

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

  // ── rejection-remediation R2 — the loaded-prefix classifier ─────────────
  //
  // The rejected implementation's `classifyExistingAppend` compared ONLY
  // `canonicalPayload`. It ran before any position was claimed and had no
  // notion of the position the append would occupy, so a row in the LOADED
  // PREFIX carrying the same immutable id and the same payload was counted
  // idempotent regardless of its promoted `append_position`. Codex's exact
  // observation: a dense prefix with a filler at position 1 and the target
  // id/payload at position 2 returned `committed: true` with
  // `{inserted: 0, idempotent: 1}` — convergence claimed on a row that is not
  // the row the caller offered, contradicting the complete-durable-row equality
  // contract the proof document states (§5).
  //
  // The correction compares the COMPLETE durable row, including the append
  // position the offer claims. `persist.ts` already did this against the LIVE
  // database row; the two classifiers now agree on what makes two rows the same
  // row, and the structural test below pins that agreement.

  it('R2: DENSE-PREFIX position mismatch is a conflict, not idempotency (exact Codex case)', async () => {
    // Two distinct admissions. The FILLER occupies position 1; the TARGET's
    // id/payload is planted at position 2. The prefix is DENSE, so the
    // load-time guard passes and the classifier is genuinely reached — this is
    // what distinguishes the defect from the already-proven prefix-movement
    // case.
    const target = captureAdmitRecords('r2 dense prefix target');
    const filler = captureAdmitRecords('r2 dense prefix filler');
    expect(target.transition.transition_id).not.toBe(filler.transition.transition_id);

    const probe = await openScratchDatabase(sourceHost(), 'r2-dense-prefix');
    try {
      await probe.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, 1, $3::jsonb)`,
          [filler.transition.transition_id, ESTATE_ID, canonicalPayload(filler.transition)],
        );
        await client.query(
          `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, 2, $3::jsonb)`,
          [target.transition.transition_id, ESTATE_ID, canonicalPayload(target.transition)],
        );
      });

      // Offering the TARGET first makes it the 1st append of this session while
      // the durable row sits at position 2. Under the defect this reported
      // committed=true, {inserted:0, idempotent:1}.
      let caught: unknown;
      let outcome: unknown;
      try {
        outcome = await probe.host.withEstateSession(ESTATE_ID, (storage) => {
          storage.appendTransition(target.transition);
          return 'offered';
        });
      } catch (err) {
        caught = err;
      }

      expect(outcome, 'the mismatched offer must NOT be reported as committed').toBeUndefined();
      expect(caught).toBeInstanceOf(PostgresIntegrityError);
      expect(caught).toMatchObject({ reason: 'immutable_id_conflict' });
      // The refusal names the PROMOTED column that differs — the payload is
      // byte-identical here, so a payload-only comparison could not have found
      // anything to report.
      expect(String((caught as Error).message)).toContain('append_position');

      // ZERO partial durability: both planted rows unchanged, nothing added,
      // and nothing else from the refused session persisted.
      const after = await probe.host.withClient(async (client) => {
        const rows = await client.query<{ transition_id: string; p: string }>(
          `SELECT transition_id, append_position::text AS p
             FROM estate_transitions ORDER BY append_position ASC`,
        );
        const others = await client.query<{ audits: string; assertions: string; receipts: string }>(
          `SELECT (SELECT count(*)::text FROM audit_events)        AS audits,
                  (SELECT count(*)::text FROM estate_assertions)   AS assertions,
                  (SELECT count(*)::text FROM transition_receipts) AS receipts`,
        );
        return { rows: rows.rows, others: others.rows[0] };
      });
      expect(after.rows).toEqual([
        { transition_id: filler.transition.transition_id, p: '1' },
        { transition_id: target.transition.transition_id, p: '2' },
      ]);
      expect(after.others).toEqual({ audits: '0', assertions: '0', receipts: '0' });
    } finally {
      await probe.dispose();
    }
  });

  it('R2: a FAITHFUL replay of a dense prefix still converges (the correction is not a blanket refusal)', async () => {
    // The companion boundary. Re-offering the SAME records in the SAME order
    // meets each durable row at the position it claims, so every append
    // converges. Without this, "compare the position too" would break every
    // legitimate retry — which is exactly what a too-strict reading does.
    const first = captureAdmitRecords('r2 faithful replay one');
    const probe = await openScratchDatabase(sourceHost(), 'r2-faithful');
    try {
      const a = await probe.host.withEstateSession(ESTATE_ID, (storage) => {
        replayAdmitRecords(storage, first);
      });
      expect(a.committed).toBe(true);
      expect(a.persisted.inserted).toBeGreaterThan(0);

      const b = await probe.host.withEstateSession(ESTATE_ID, (storage) => {
        replayAdmitRecords(storage, first);
      });
      expect(b.committed).toBe(true);
      expect(b.persisted.inserted).toBe(0);
      expect(b.persisted.idempotent).toBe(a.persisted.inserted);

      // Still exactly one durable row of each append-only kind.
      const counts = await probe.host.withClient(async (client) => {
        const r = await client.query<{ t: string; au: string; tr: string }>(
          `SELECT (SELECT count(*)::text FROM estate_transitions)  AS t,
                  (SELECT count(*)::text FROM audit_events)        AS au,
                  (SELECT count(*)::text FROM transition_receipts) AS tr`,
        );
        return r.rows[0];
      });
      expect(counts).toEqual({ t: '1', au: '1', tr: '1' });
    } finally {
      await probe.dispose();
    }
  });

  it('R2: the session classifier and persist.ts compare the SAME durable column set', async () => {
    // A STRUCTURAL guard, because the two classifiers cannot share code: only
    // `session.ts` is in this remediation's authorized scope, and `persist.ts`
    // is byte-unchanged. The defect was precisely that the two disagreed about
    // what makes two rows the same row — the live one compared the complete row
    // while the in-session one compared the payload alone. This test fails if
    // either side's column set changes without the other.
    const sessionSrc = readFileSync(
      resolve(REPO_ROOT, 'src/straylight/storage/postgres/session.ts'),
      'utf8',
    );
    const persistSrc = readFileSync(
      resolve(REPO_ROOT, 'src/straylight/storage/postgres/persist.ts'),
      'utf8',
    );

    // Every promoted column persist.ts binds for the audit-event INSERT (its
    // widest row) must appear in the session's comparison basis.
    for (const column of [
      'estate_id',
      'append_position',
      'audit_hash',
      'previous_audit_hash',
      'previous_audit_hash_key',
      'payload',
    ]) {
      expect(persistSrc, `persist.ts must bind ${column}`).toContain(`${column}:`);
      expect(sessionSrc, `session.ts must compare ${column}`).toContain(column);
    }

    // The session classifier must NOT reach its decision by comparing the two
    // canonical payloads DIRECTLY, under any spelling. Banning one `if (...)`
    // shape is not enough — the rejected comparison can be rewritten as a
    // ternary, a variable, or an early return. What is checked is that the two
    // payloads are never compared to each other anywhere in the file.
    expect(
      sessionSrc,
      'the classifier must not decide on a direct payload-to-payload comparison',
    ).not.toMatch(
      /canonicalPayload\([^)]*\)\s*(?:===|!==|==|!=)\s*canonicalPayload\(/,
    );

    // The classification must be DERIVED from the complete-row comparison. The
    // body of `classifyExistingAppend` is extracted and inspected, so a helper
    // that merely exists elsewhere in the file cannot satisfy this.
    const body = extractFunctionBody(sessionSrc, 'classifyExistingAppend');
    expect(body, 'classifyExistingAppend must build the existing durable row').toMatch(
      /durableRowOf\(\s*row\.estate_id\s*,\s*row\.append_position\s*,\s*row\.record\s*\)/,
    );
    expect(body, 'classifyExistingAppend must build the offered durable row').toMatch(
      /durableRowOf\(\s*estate_id\s*,\s*offeredPosition\s*,\s*incoming\s*\)/,
    );
    expect(body, 'the decision must come from the complete-row mismatch').toMatch(
      /firstDurableMismatch\(/,
    );
    // The idempotent branch must be gated on "no mismatch", not on anything
    // weaker.
    expect(body).toMatch(/mismatch\s*===\s*null/);
    // Every caller must supply a real offered position, not a constant. Four
    // append-only writers exist, and each must pass an `offerPosition(...)`
    // call — a hardcoded literal would make the position check vacuous.
    const offers = [...sessionSrc.matchAll(/this\.offerPosition\(\s*this\.offered\w+\s*,/g)];
    expect(offers, 'every append-only writer must offer a counted position').toHaveLength(4);
    // And the comparison must include the position column itself.
    const rowBuilder = extractFunctionBody(sessionSrc, 'durableRowOf');
    for (const column of ['estate_id', 'append_position', 'payload']) {
      expect(rowBuilder, `durableRowOf must promote ${column}`).toContain(column);
    }
    expect(rowBuilder, 'durableRowOf must promote the audit chain columns').toMatch(
      /previous_audit_hash_key/,
    );

    // Behavioural half of the same claim: the two classifiers agree that a
    // same-payload row under a DIFFERENT estate is a conflict. (The live
    // classifier's path — the planted row is invisible to this estate's
    // snapshot, so the collision surfaces at INSERT time.)
    const captured = captureAdmitRecords('r2 shared basis');
    const probe = await openScratchDatabase(sourceHost(), 'r2-shared-basis');
    try {
      await probe.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
           VALUES ($1, $2, 1, $3::jsonb)`,
          [captured.transition.transition_id, OTHER_ESTATE_ID, canonicalPayload(captured.transition)],
        );
      });
      await expect(
        probe.host.withEstateSession(ESTATE_ID, (storage) => {
          replayAdmitRecords(storage, captured);
        }),
      ).rejects.toMatchObject({ reason: 'immutable_id_conflict' });
    } finally {
      await probe.dispose();
    }
  });

  it('R2: an audit event whose PROMOTED CHAIN columns differ is a conflict, not idempotency', async () => {
    // The audit table is the widest durable row: identity, placement, and the
    // chain columns. A same-id, same-payload row whose normalized parent key
    // differs is a different durable row. Planted under a different estate so
    // the collision reaches the classifier rather than the load-time guard.
    const captured = captureAdmitRecords('r2 chain columns');
    const event = captured.auditEvents[0];
    expect(event, 'the capture must contain an audit event').toBeDefined();

    const probe = await openScratchDatabase(sourceHost(), 'r2-chain-cols');
    try {
      await probe.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO audit_events
             (audit_event_id, estate_id, append_position, audit_hash,
              previous_audit_hash, previous_audit_hash_key, payload)
           VALUES ($1, $2, 1, $3, $4, $5, $6::jsonb)`,
          [
            event!.audit_event_id,
            OTHER_ESTATE_ID,
            event!.audit_hash,
            null,
            '',
            canonicalPayload(event),
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

      // Nothing from the refused session is durable.
      const after = await probe.host.withClient(async (client) => {
        const r = await client.query<{ audits: string; transitions: string }>(
          `SELECT (SELECT count(*)::text FROM audit_events)       AS audits,
                  (SELECT count(*)::text FROM estate_transitions) AS transitions`,
        );
        return r.rows[0];
      });
      expect(after).toEqual({ audits: '1', transitions: '0' });
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

// ── rejection-remediation R4 — the exhaustiveness barrier ──────────────
//
// The rejected implementation dispatched `ThenReadOutcome` through two
// independent `if` statements and treated every remaining variant as
// "not-thenable". Adding a fourth variant therefore passed `npm run typecheck`
// and could fall through to `session.close()`, `persistDelta`, and COMMIT — so
// the implementation report's claim of a compile-time barrier was unsupported.
//
// This suite is UNGATED (no database) and proves the barrier MECHANICALLY: it
// copies the source tree to a temporary directory, adds a fourth variant, and
// runs the real compiler. A documented intention would not survive a
// refactor; a failing typecheck does.

describe('Phase 50A remediation R4 — the callback-inspection union has a REAL typecheck barrier', () => {
  /**
   * Typecheck a mutated copy of the repository's source tree.
   *
   * The copy is made outside the repository (`mkdtempSync` under the OS temp
   * directory) so no mutation can ever be observed by another suite, by the
   * package contract checks, or by git. `tsc` runs with the project's own
   * strictness flags — a barrier that only holds under different settings would
   * not be the barrier `npm run typecheck` enforces.
   */
  function typecheckWithMutatedHost(mutate: (source: string) => string): {
    ok: boolean;
    output: string;
  } {
    // The copy lives in a uniquely-named directory INSIDE the repository, and
    // is removed in `finally`. Inside is required, not incidental: ordinary
    // Node module resolution walks upward to find `node_modules`, so a copy
    // under the OS temp directory cannot resolve `pg` or the private
    // `@0xhoneyjar/loa-hounfour` dependency and every mutation would appear to
    // "fail typecheck" for the wrong reason. `mkdtempSync` guarantees the name
    // is unique, the directory is git-ignored by its prefix being untracked and
    // removed, and the `no-leak` tree-root scan does not see it because it
    // exists only for the duration of one test.
    const dir = mkdtempSync(join(REPO_ROOT, '.r4-typecheck-probe-'));
    try {
      cpSync(resolve(REPO_ROOT, 'src'), join(dir, 'src'), { recursive: true });
      const hostPath = join(dir, 'src/straylight/storage/postgres/host.ts');
      const original = readFileSync(hostPath, 'utf8');
      const mutated = mutate(original);
      expect(mutated, 'the mutation must actually change the source').not.toBe(original);
      writeFileSync(hostPath, mutated);

      // Same compiler options as `npm run typecheck`, minus the test/script
      // includes (only `src` is copied).
      writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            lib: ['ES2022'],
            types: ['node'],
            strict: true,
            noImplicitOverride: true,
            noUncheckedIndexedAccess: true,
            exactOptionalPropertyTypes: false,
            noFallthroughCasesInSwitch: true,
            noImplicitReturns: true,
            isolatedModules: true,
            esModuleInterop: true,
            resolveJsonModule: true,
            skipLibCheck: true,
            noEmit: true,
            // Bare specifiers (`pg`, the private `@0xhoneyjar/loa-hounfour`)
            // resolve by ordinary upward `node_modules` lookup from the probe
            // directory, which is why it lives inside the repository. The
            // baseline test above proves that resolution genuinely works —
            // without it every mutation would "fail typecheck" for the wrong
            // reason and the barrier would be unproven.
            baseUrl: '.',
            paths: { '@straylight/*': ['src/straylight/*'] },
          },
          include: ['src/**/*.ts'],
        }),
      );

      const run = spawnSync(
        process.execPath,
        [resolve(REPO_ROOT, 'node_modules/typescript/bin/tsc'), '-p', join(dir, 'tsconfig.json')],
        { encoding: 'utf8', cwd: dir },
      );
      return {
        ok: run.status === 0,
        output: `${run.stdout ?? ''}${run.stderr ?? ''}`,
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  /** Sanity: the UNMUTATED tree typechecks, so a failure below means something. */
  it('the unmutated source typechecks (the harness is not failing for its own reasons)', () => {
    const result = typecheckWithMutatedHost((source) =>
      // A no-op-but-different mutation: a comment. Proves the copy + compiler
      // harness is sound before any real mutation is trusted.
      `${source}\n// r4 harness sanity probe\n`,
    );
    expect(result.ok, `baseline typecheck must succeed:\n${result.output}`).toBe(true);
  }, 120_000);

  it('R4: adding an UNHANDLED fourth variant FAILS typecheck', () => {
    const result = typecheckWithMutatedHost((source) => {
      const anchor = "  | { kind: 'unreadable' };";
      expect(source, 'the union must be declared in its expected shape').toContain(anchor);
      return source.replace(
        anchor,
        "  | { kind: 'unreadable' }\n  | { kind: 'r4-probe-unhandled-variant' };",
      );
    });
    expect(
      result.ok,
      'a fourth ThenReadOutcome variant must FAIL typecheck; it compiled instead',
    ).toBe(false);
    // And it must fail AT THE BARRIER, naming the never-assignment — not for an
    // incidental unrelated reason.
    expect(result.output).toMatch(/not assignable to parameter of type 'never'/);
    expect(result.output).toContain('r4-probe-unhandled-variant');
  }, 120_000);

  it('R4: the barrier is what fails — removing the assertNever default makes the same mutation COMPILE', () => {
    // The positive control that makes the previous test meaningful. If the
    // fourth variant failed for some reason other than the exhaustiveness
    // barrier, it would still fail with the barrier removed. It must not.
    const result = typecheckWithMutatedHost((source) => {
      const withVariant = source.replace(
        "  | { kind: 'unreadable' };",
        "  | { kind: 'unreadable' }\n  | { kind: 'r4-probe-unhandled-variant' };",
      );
      // Replace the total switch dispatch with the REJECTED two-if shape.
      const start = withVariant.indexOf('      switch (outcome.kind) {');
      const end = withVariant.indexOf('      const delta = session.close();');
      expect(start, 'the switch dispatch must be present').toBeGreaterThan(-1);
      expect(end).toBeGreaterThan(start);
      const rejectedShape =
        "      if (outcome.kind === 'thenable') {\n" +
        '        session.abandon();\n' +
        '        session = undefined;\n' +
        '        absorbSettlement(outcome.captured);\n' +
        "        throw new PostgresUnavailableError('async_callback_unsupported', 'thenable');\n" +
        '      }\n' +
        "      if (outcome.kind === 'unreadable') {\n" +
        '        session.abandon();\n' +
        '        session = undefined;\n' +
        "        throw new PostgresUnavailableError('async_callback_unsupported', 'unreadable');\n" +
        '      }\n\n';
      return withVariant.slice(0, start) + rejectedShape + withVariant.slice(end);
    });
    expect(
      result.ok,
      'the REJECTED two-if shape must accept a fourth variant — that is the defect R4 closes:\n' +
        result.output,
    ).toBe(true);
  }, 120_000);

  it('R4: no callback-inspection variant can reach the commit path without an explicit arm', () => {
    // Structural companion to the compiler proof: the dispatch must be a total
    // `switch` guarded by `assertNever`, and `assertNever`'s parameter must be
    // `never` (an `unknown` parameter would compile with any variant and be no
    // barrier at all).
    const source = readFileSync(
      resolve(REPO_ROOT, 'src/straylight/storage/postgres/host.ts'),
      'utf8',
    );
    expect(source).toMatch(/switch\s*\(\s*outcome\.kind\s*\)/);
    expect(source).toMatch(/default:\s*(?:\/\/[^\n]*\n\s*)*return assertNever\(outcome\)/);
    expect(source).toMatch(/function assertNever\(\s*value:\s*never\s*\)\s*:\s*never/);
    // The union's three arms are each handled explicitly.
    for (const arm of ["case 'thenable'", "case 'unreadable'", "case 'not-thenable'"]) {
      expect(source, `${arm} must be handled explicitly`).toContain(arm);
    }
    // And only the proven-non-thenable arm continues; the others throw.
    const dispatch = source.slice(
      source.indexOf('switch (outcome.kind) {'),
      source.indexOf('const delta = session.close();'),
    );
    expect(dispatch).toContain("case 'not-thenable':\n          break;");
    expect((dispatch.match(/throw new PostgresUnavailableError\(/g) ?? []).length).toBe(2);
  });
});

// ── structural helpers ─────────────────────────────────────────────────

/**
 * The body of one named function/method, by brace matching from its signature.
 *
 * Structural assertions must inspect the code that actually MAKES a decision,
 * not merely the file that contains a helper of the right name. Brace matching
 * (rather than a line window) means a body cannot slip out of the inspected
 * region by growing.
 */
function extractFunctionBody(source: string, name: string): string {
  // Match the DECLARATION, not a call site: a top-level `function name(` or a
  // class member (`private name<T>(`, `name(`) at the start of a line. Anchoring
  // to line start excludes `this.name(` and `= name(` uses, which would
  // otherwise make the extraction inspect the wrong region entirely.
  const signature = new RegExp(
    `^\\s*(?:export\\s+)?(?:function\\s+${name}\\b|` +
      `(?:private\\s+|public\\s+|protected\\s+|readonly\\s+|static\\s+)*${name}\\s*(?:<[^>]*>)?\\s*\\()`,
    'm',
  );
  const found = signature.exec(source);
  if (found === null) throw new Error(`function ${name} not declared (it must not be renamed)`);
  const at = found.index;
  const open = source.indexOf('{', at);
  if (open === -1) throw new Error(`function ${name} has no body`);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`function ${name} body is unterminated`);
}

// ── R1 redaction assertion ─────────────────────────────────────────────

/**
 * The complete bounded-error contract for a refused `then` read.
 *
 * The refusal must be the store's OWN error, and NOTHING of the caller's
 * exception may cross the boundary: not the object, not its message, not its
 * stack, not its cause, and not any nested `cause` chain. Asserted as one
 * helper because every getter-refusal test owes the same guarantee, and a
 * per-test spot check is how the previous cycle came to assert the opposite
 * (that the getter's message was preserved).
 */
function assertBoundedGetterRefusal(
  caught: unknown,
  original: unknown,
  secret: string,
): void {
  expect(caught).toBeInstanceOf(PostgresUnavailableError);
  expect(caught).toMatchObject({ reason: 'async_callback_unsupported' });
  // Not the original object, and not merely a copy of it.
  expect(caught).not.toBe(original);
  const err = caught as Error & { cause?: unknown; detail?: string };
  // No `cause` chain smuggling the original through.
  expect(err.cause, 'the refusal must not carry the original error as `cause`').toBeUndefined();
  // The secret text appears NOWHERE in the public surface: message, detail,
  // stack, or any enumerable own property.
  const surfaces = [
    err.message,
    err.detail ?? '',
    err.stack ?? '',
    JSON.stringify(Object.getOwnPropertyNames(err).map((k) => String((err as never)[k]))),
  ];
  for (const surface of surfaces) {
    expect(surface, 'the getter error must not leak through the public boundary').not.toContain(
      secret,
    );
  }
  // And the refusal states the fixed reason a caller matches on.
  expect(err.message).toContain('async_callback_unsupported');
}

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
