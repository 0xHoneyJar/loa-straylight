// Phase 50A R2 — the outcome matrix and order-independence proof for the
// CORRECTED append-only classification model.
//
// The independent MUTATION MATRIX over this model lives in
// `postgres-r2-mutation-matrix.test.ts`, deliberately in a separate file: its
// harness runs vitest against a mutated copy of the tree with `-t <test name>`,
// and a harness that lived alongside the tests it targets would match its own
// cases inside the copy and recurse.
//
// The durable REJECT at lane sequence 27 reopened R2 and found the previous
// abstraction unsound at the root. `StorageAdapter.appendTransition`,
// `upsertTransitionReceipt`, `upsertRecallReceipt` and `appendAuditEvent` supply
// NO append position, so no caller-supplied append position exists and none may
// be invented; a session-local ordinal that restarts at 1 in every transaction
// cannot establish a historical durable position. Comparing it against a stored
// position FALSELY REFUSED a byte-identical replay of an independently committed
// operation, and checking promoted estate equality against the RECORD's
// self-report let cross-estate replays commit as convergences.
//
// The closed design separates three things the rejected code conflated:
//
//   (1) CALLER-CONTROLLED IMMUTABLE EQUALITY — one shared declaration in
//       `rows.ts` (`CALLER_CONTROLLED_COLUMNS` / `callerControlledRow` /
//       `firstCallerControlledMismatch`): canonical payload (which carries the
//       record's own id), record estate, and for audit events the chain fields
//       including the normalized parent key. `append_position` is NOT in it.
//       Both classifiers — the in-snapshot one in `session.ts` and the live-row
//       one in `persist.ts` — consume that one declaration.
//
//   (2) SESSION-ESTATE BINDING — each session is constructed bound to the estate
//       the host LOCKED and LOADED. Estate authority is the session's, not the
//       record's: a record naming any other estate is refused with
//       `estate_authority_violation`, the transaction rolls back, and nothing is
//       durable. Never idempotent, never committed.
//
//   (3) STORE-ASSIGNED PLACEMENT INTEGRITY — placement is validated against the
//       store's own invariants (per-estate dense-prefix plus the shipped
//       constraints), never against a caller claim. Only a FRESH immutable id
//       receives the next store-assigned position; a converging existing id
//       consumes none.
//
// Every assertion below reads DURABLE state back through a fresh connection, so
// no result can come from in-session bookkeeping.

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  EstateStore,
  InMemoryStorage,
  executeRecall,
  type StorageAdapter,
} from '../../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../../fixtures/index.js';
import {
  PostgresIntegrityError,
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
/** A second estate id, for the cross-estate authority cases. */
const OTHER_ESTATE_ID = 'estate:r2-other-estate';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

phase50aGateReport('postgres-r2-outcome-matrix');

const maybe = phase50aEnabled() ? describe : describe.skip;

/** The four append-only tables, with the writer each is reached through. */
interface AppendTable {
  /** The database table name. */
  table: string;
  /** Human label used in test names. */
  label: string;
  /** Offer one captured record of this kind through the adapter. */
  offer: (storage: StorageAdapter, captured: CapturedRecords) => void;
  /** The record this table's write carries, for direct-SQL planting. */
  recordOf: (captured: CapturedRecords) => Record<string, unknown>;
  /** That record's immutable primary id. */
  idOf: (captured: CapturedRecords) => string;
  /** The primary-key column name. */
  idColumn: string;
}

/**
 * Every append-only table, each asserted INDEPENDENTLY and BY NAME. A single
 * representative table would leave three writers unproven.
 *
 * Audit events additionally carry the promoted chain columns, so their planting
 * needs those values; the shape is handled per-case where it matters.
 */
const APPEND_TABLES: readonly AppendTable[] = [
  {
    table: 'estate_transitions',
    label: 'estate transitions',
    offer: (storage, c) => storage.appendTransition(c.transition),
    recordOf: (c) => c.transition as unknown as Record<string, unknown>,
    idOf: (c) => c.transition.transition_id,
    idColumn: 'transition_id',
  },
  {
    table: 'transition_receipts',
    label: 'transition receipts',
    offer: (storage, c) => storage.upsertTransitionReceipt(c.transitionReceipt),
    recordOf: (c) => c.transitionReceipt as unknown as Record<string, unknown>,
    idOf: (c) => c.transitionReceipt.receipt_id,
    idColumn: 'receipt_id',
  },
  {
    table: 'recall_receipts',
    label: 'recall receipts',
    offer: (storage, c) => {
      if (c.recallReceipt !== undefined) storage.upsertRecallReceipt(c.recallReceipt as never);
    },
    recordOf: (c) => c.recallReceipt as unknown as Record<string, unknown>,
    idOf: (c) => {
      const receipt = c.recallReceipt;
      expect(receipt, 'this case requires a base-estate capture').toBeDefined();
      return receipt!.receipt_id;
    },
    idColumn: 'receipt_id',
  },
  {
    table: 'audit_events',
    label: 'audit events',
    offer: (storage, c) => {
      for (const event of c.auditEvents) storage.appendAuditEvent(event);
    },
    recordOf: (c) => c.auditEvents[0] as unknown as Record<string, unknown>,
    idOf: (c) => c.auditEvents[0]!.audit_event_id,
    idColumn: 'audit_event_id',
  },
];

// ── (A) the OUTCOME MATRIX, per table, in the IN-SNAPSHOT path ──────────

maybe('Phase 50A R2 — outcome matrix: full and partial operation retries', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  beforeEach(async () => {
    db = await openScratchDatabase(sourceHost(), 'r2-matrix-retry');
  }, 60_000);

  afterEach(async () => {
    await db.dispose();
  });

  it('a FULL faithful operation retry converges with zero duplicates and zero new positions', async () => {
    const captured = captureAdmitRecords('r2 full retry');

    const first = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, captured);
    });
    expect(first.committed).toBe(true);
    // The operation's append-only writes: its audit events, the transition, the
    // transition receipt, and the recall receipt. Derived from the capture rather
    // than hardcoded, so the assertion cannot drift from what was offered.
    const writes = appendWriteCount(captured);
    expect(writes, 'the capture must offer every append-only table').toBeGreaterThanOrEqual(4);
    expect(first.persisted.inserted).toBe(writes);
    expect(first.persisted.idempotent).toBe(0);

    const before = await durableAppendRows(db);

    const retry = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, captured);
    });
    expect(retry.committed).toBe(true);
    expect(retry.persisted.inserted, 'a faithful retry inserts nothing').toBe(0);
    expect(retry.persisted.idempotent, 'and every write converges OBSERVABLY').toBe(writes);

    // Zero duplicates and zero new positions: the durable rows are byte-for-byte
    // what the first operation left.
    expect(await durableAppendRows(db)).toEqual(before);
  });

  it('a PARTIAL operation retry converges on exactly the records it offers, without re-offering history', async () => {
    // Operation-level idempotency must NOT be redefined as whole-estate-prefix
    // replay. Per-record convergence is the adapter contract: a retry that
    // re-offers only a SUBSET of an earlier history's records must converge on
    // exactly that subset, and must not be required to re-offer the rest.
    //
    // This is the case the rejected ordinal broke. TWO operations are committed
    // first, so the SECOND operation's records are durable at position 2 (and the
    // audit rows beyond). Re-offering only the second operation makes each of its
    // records the FIRST offer of its session — meeting a session-local ordinal of
    // 1 against a stored position of 2 or more. Under the rejected ordinal that
    // was refused as `immutable_id_conflict`; it is a faithful retry.
    //
    // Committing two operations is what makes this discriminating: with a single
    // operation every stored position is 1, so an ordinal of 1 would coincide and
    // the defect would hide.
    const [first, second] = captureOperationSequence(ESTATE_ID, [
      'r2 partial retry one',
      'r2 partial retry two',
    ]);

    const full = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, first!);
      replayAll(storage, second!);
    });
    expect(full.persisted.inserted).toBe(
      appendWriteCount(first!) + appendWriteCount(second!),
    );
    const before = await durableAppendRows(db);

    // Every record of the SECOND operation is durable beyond position 1.
    const positions = await positionsByTable(db, ESTATE_ID);
    for (const spec of APPEND_TABLES) {
      expect(
        positions[spec.table]!.length,
        `${spec.table} must hold rows from BOTH operations, so the retry meets a later position`,
      ).toBeGreaterThan(1);
    }

    // Re-offer ONLY the second operation's transition — durable at position 2,
    // offered as the first (and only) offer of its session.
    const partial = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      storage.appendTransition(second!.transition);
    });
    expect(partial.committed).toBe(true);
    expect(partial.persisted.inserted).toBe(0);
    expect(partial.persisted.idempotent, 'exactly the one offered record converges').toBe(1);

    // Re-offer ONLY the second operation's recall receipt — likewise durable
    // beyond position 1 and offered alone.
    const receipt = second!.recallReceipt;
    expect(receipt, 'the base-estate capture must include a governed recall receipt').toBeDefined();
    const partial2 = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      storage.upsertRecallReceipt(receipt! as never);
    });
    expect(partial2.persisted.inserted).toBe(0);
    expect(partial2.persisted.idempotent).toBe(1);

    // And ONLY the second operation's audit events — the widest row, and the one
    // whose declared parent is NOT the genesis link.
    const partial3 = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      for (const event of second!.auditEvents) storage.appendAuditEvent(event);
    });
    expect(partial3.persisted.inserted).toBe(0);
    expect(partial3.persisted.idempotent).toBe(second!.auditEvents.length);

    // Nothing moved, nothing was added, nothing was required to be re-offered.
    expect(await durableAppendRows(db)).toEqual(before);
  });

  for (const spec of APPEND_TABLES) {
    it(`${spec.label}: a single-record retry converges independently of the other tables`, async () => {
      const captured = captureAdmitRecords(`r2 single ${spec.table}`);
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        replayAll(storage, captured);
      });
      const before = await durableAppendRows(db);

      const retry = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        spec.offer(storage, captured);
      });
      expect(retry.committed).toBe(true);
      expect(retry.persisted.inserted, `${spec.table} must insert nothing on retry`).toBe(0);
      expect(
        retry.persisted.idempotent,
        `${spec.table} must report its convergence observably`,
      ).toBeGreaterThan(0);
      expect(await durableAppendRows(db)).toEqual(before);
    });
  }

  it('a FRESH id receives exactly the next dense position for its estate', async () => {
    // The other half of the separation: only a fresh immutable id consumes a
    // store-assigned position, and it is the loaded dense maximum plus one.
    const [first, second] = captureOperationSequence(ESTATE_ID, [
      'r2 fresh position one',
      'r2 fresh position two',
    ]);
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, first!);
    });
    // One operation: each table holds a dense prefix of exactly the rows that
    // operation offered it (the audit table receives more than one).
    const afterFirst = await positionsByTable(db, ESTATE_ID);
    for (const spec of APPEND_TABLES) {
      expect(
        afterFirst[spec.table],
        `${spec.table} must be a dense prefix after one operation`,
      ).toEqual(densePrefix(rowsOffered(first!, spec)));
    }

    // A second, genuinely different operation, offered AFTER a converging retry
    // of the first. Each fresh id takes the next position; the convergence takes
    // none.
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, first!); // converges — consumes NO position
      replayAll(storage, second!); // fresh — consumes the next
    });
    const afterSecond = await positionsByTable(db, ESTATE_ID);
    for (const spec of APPEND_TABLES) {
      const expected = densePrefix(rowsOffered(first!, spec) + rowsOffered(second!, spec));
      expect(
        afterSecond[spec.table],
        `${spec.table} must be a dense prefix — the convergence consumed no position`,
      ).toEqual(expected);
    }
  });
});

// ── (B) ORDER INDEPENDENCE, proven mechanically over permutations ────────

maybe('Phase 50A R2 — order independence over every permutation of offer order', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  afterEach(async () => {
    await db?.dispose();
  });

  /**
   * The four append-only offers of one admission, as independent closures. Audit
   * events must precede the transition in a FRESH write (the chain tail check),
   * so permutations are exercised on a RETRY, where every record is already
   * durable and the classification is pure.
   */
  function offersOf(captured: CapturedRecords): Array<(s: StorageAdapter) => void> {
    const receipt = captured.recallReceipt;
    expect(receipt, 'permutations are exercised on a base-estate capture').toBeDefined();
    return [
      (s) => {
        for (const e of captured.auditEvents) s.appendAuditEvent(e);
      },
      (s) => s.appendTransition(captured.transition),
      (s) => s.upsertTransitionReceipt(captured.transitionReceipt),
      (s) => s.upsertRecallReceipt(receipt! as never),
    ];
  }

  it('every permutation of a faithful retry produces identical classification, counts, rows, and positions', async () => {
    db = await openScratchDatabase(sourceHost(), 'r2-permutations');
    const captured = captureAdmitRecords('r2 permutation');

    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, captured);
    });
    const baselineRows = await durableAppendRows(db);

    const offers = offersOf(captured);
    const perms = permutations([0, 1, 2, 3]);
    // 4! = 24 orders, all of them, not a sample.
    expect(perms).toHaveLength(24);

    const results: Array<{ inserted: number; idempotent: number }> = [];
    for (const order of perms) {
      const outcome = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        for (const index of order) offers[index]!(storage);
      });
      expect(outcome.committed, `order ${order.join('')} must commit`).toBe(true);
      results.push({
        inserted: outcome.persisted.inserted,
        idempotent: outcome.persisted.idempotent,
      });
      // IDENTICAL durable rows and positions after EVERY permutation.
      expect(
        await durableAppendRows(db),
        `order ${order.join('')} must leave the durable rows unchanged`,
      ).toEqual(baselineRows);
    }

    // IDENTICAL classification counts for every permutation — asserted as one
    // set, so a single divergent order fails.
    const distinct = [...new Set(results.map((r) => `${r.inserted}/${r.idempotent}`))];
    expect(distinct, 'every offer order must classify identically').toEqual([
      `0/${appendWriteCount(captured)}`,
    ]);
  }, 180_000);

  it('DUPLICATED offers within one session converge identically, and consume no extra position', async () => {
    db = await openScratchDatabase(sourceHost(), 'r2-duplicated');
    const captured = captureAdmitRecords('r2 duplicated');

    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, captured);
    });
    const before = await durableAppendRows(db);

    // The same records offered THREE times in one session.
    const outcome = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, captured);
      replayAll(storage, captured);
      replayAll(storage, captured);
    });
    expect(outcome.committed).toBe(true);
    expect(outcome.persisted.inserted).toBe(0);
    expect(outcome.persisted.idempotent, 'each offer converges observably').toBe(
      3 * appendWriteCount(captured),
    );
    expect(await durableAppendRows(db)).toEqual(before);
  }, 120_000);

  it('a converging offer does not renumber a FRESH one made later in the same session', async () => {
    // The specific cascade the rejected ordinal caused: advancing a counter on a
    // convergence renumbered every later offer. With no counter, a fresh record
    // offered AFTER any number of convergences still lands at the next dense
    // position.
    db = await openScratchDatabase(sourceHost(), 'r2-no-renumber');
    const [first, second] = captureOperationSequence(ESTATE_ID, [
      'r2 renumber one',
      'r2 renumber two',
    ]);
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, first!);
    });

    const outcome = await db.host.withEstateSession(ESTATE_ID, (storage) => {
      // Five convergences first...
      for (let i = 0; i < 5; i++) replayAll(storage, first!);
      // ...then a genuinely fresh operation.
      replayAll(storage, second!);
    });
    expect(outcome.persisted.inserted).toBe(appendWriteCount(second!));
    expect(outcome.persisted.idempotent).toBe(5 * appendWriteCount(first!));

    const positions = await positionsByTable(db, ESTATE_ID);
    for (const spec of APPEND_TABLES) {
      expect(
        positions[spec.table],
        `${spec.table}: the fresh rows must continue the dense prefix despite five convergences`,
      ).toEqual(densePrefix(rowsOffered(first!, spec) + rowsOffered(second!, spec)));
    }
  }, 120_000);
});

// ── (C) SESSION-ESTATE BINDING and cross-estate refusal, per table ───────

maybe('Phase 50A R2 — session-estate binding refuses every cross-estate write', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  beforeEach(async () => {
    db = await openScratchDatabase(sourceHost(), 'r2-estate-binding');
  }, 60_000);

  afterEach(async () => {
    await db.dispose();
  });

  for (const spec of APPEND_TABLES) {
    it(`${spec.label}: a record naming another estate is REFUSED with a distinct reason and rolls back`, async () => {
      const captured = captureAdmitRecords(`r2 cross estate ${spec.table}`);

      // A session bound to OTHER_ESTATE_ID, offered records that name ESTATE_ID.
      // Under the rejected code this committed with `inserted: 0, idempotent: n`
      // because promoted estate equality was checked against the RECORD.
      let caught: unknown;
      let outcome: unknown;
      try {
        outcome = await db.host.withEstateSession(OTHER_ESTATE_ID, (storage) => {
          spec.offer(storage, captured);
          return 'offered';
        });
      } catch (err) {
        caught = err;
      }
      expect(outcome, 'a cross-estate write must NOT be reported as committed').toBeUndefined();
      expect(caught).toBeInstanceOf(PostgresIntegrityError);
      expect(caught, 'the refusal must carry the DISTINCT bounded reason').toMatchObject({
        reason: 'estate_authority_violation',
      });
      // The reason names both estates, so an operator can see the mismatch.
      const message = String((caught as Error).message);
      expect(message).toContain(spec.table);
      expect(message).toContain(OTHER_ESTATE_ID);
      expect(message).toContain(ESTATE_ID);

      // ZERO partial durability across EVERY table.
      const counts = await appendCounts(db);
      for (const [table, n] of Object.entries(counts)) {
        expect(n, `${table} must hold no row from the refused operation`).toBe(0);
      }
    });
  }

  it('a record whose id exists only under ANOTHER estate is never treated as convergence', async () => {
    const captured = captureAdmitRecords('r2 other-estate id');
    // Plant the transition under OTHER_ESTATE_ID by direct SQL, at a sound
    // position, with a byte-identical payload.
    await db.host.withClient(async (client) => {
      await client.query(
        `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
         VALUES ($1, $2, 1, $3::jsonb)`,
        [captured.transition.transition_id, OTHER_ESTATE_ID, canonicalPayload(captured.transition)],
      );
    });

    // Writing it under ESTATE_ID must be refused — the id is durably taken by a
    // row belonging to a different estate, which is conflicting reuse, not
    // convergence. The planted row is invisible to this estate's snapshot, so the
    // LIVE classifier decides.
    let caught: unknown;
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.appendTransition(captured.transition);
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(PostgresIntegrityError);
    expect(caught).toMatchObject({ reason: 'immutable_id_conflict' });
    expect(String((caught as Error).message)).toContain('estate_id');

    // Only the planted row survives.
    const rows = await db.host.withClient(async (client) => {
      const r = await client.query<{ estate_id: string; p: string }>(
        `SELECT estate_id, append_position::text AS p FROM estate_transitions`,
      );
      return r.rows;
    });
    expect(rows).toEqual([{ estate_id: OTHER_ESTATE_ID, p: '1' }]);
  });

  it('concurrent operations on DIFFERENT estates neither leak nor cross-contaminate', async () => {
    // Two estates, written through genuinely overlapping sessions. Each session
    // is bound to its own estate, so neither can see or write the other's rows.
    const a = captureAdmitRecords('r2 estate a');
    const b = captureAdmitRecordsFor(OTHER_ESTATE_ID, 'r2 estate b');

    const [ra, rb] = await Promise.all([
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        replayAll(storage, a);
        return 'a';
      }),
      db.host.withEstateSession(OTHER_ESTATE_ID, (storage) => {
        replayAllFor(storage, b);
        return 'b';
      }),
    ]);
    expect(ra.committed).toBe(true);
    expect(rb.committed).toBe(true);

    // Each estate holds exactly its own dense prefix; no row crossed over.
    for (const [estate, captured] of [
      [ESTATE_ID, a],
      [OTHER_ESTATE_ID, b],
    ] as const) {
      const positions = await positionsByTable(db, estate);
      for (const spec of APPEND_TABLES) {
        expect(
          positions[spec.table],
          `${estate}/${spec.table} must be its own dense prefix`,
        ).toEqual(densePrefix(rowsOffered(captured, spec)));
      }
    }
  }, 120_000);
});

// ── (D) caller-controlled field mismatches, each INDIVIDUALLY ────────────

maybe('Phase 50A R2 — each caller-controlled field mismatch raises the conflict and rolls back', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  beforeEach(async () => {
    db = await openScratchDatabase(sourceHost(), 'r2-field-mismatch');
  }, 60_000);

  afterEach(async () => {
    await db.dispose();
  });

  it('PAYLOAD mismatch on an existing id is refused (in-snapshot path)', async () => {
    const captured = captureAdmitRecords('r2 field payload');
    await db.host.withClient(async (client) => {
      await client.query(
        `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
         VALUES ($1, $2, 1, $3::jsonb)`,
        [
          captured.transition.transition_id,
          ESTATE_ID,
          JSON.stringify({ ...(captured.transition as object), tampered: true }),
        ],
      );
    });
    await expectRefusal(db, captured, 'immutable_id_conflict', 'payload');
  });

  it('ESTATE mismatch on an existing id is refused (live-row path)', async () => {
    const captured = captureAdmitRecords('r2 field estate');
    await db.host.withClient(async (client) => {
      await client.query(
        `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
         VALUES ($1, $2, 1, $3::jsonb)`,
        [captured.transition.transition_id, OTHER_ESTATE_ID, canonicalPayload(captured.transition)],
      );
    });
    await expectRefusal(db, captured, 'immutable_id_conflict', 'estate_id');
  });

  const auditFieldCases: ReadonlyArray<{
    field: string;
    column: string;
    plant: (event: Record<string, unknown>) => {
      audit_hash: string;
      previous_audit_hash: string | null;
      previous_audit_hash_key: string;
      payload: string;
    };
  }> = [
    {
      field: 'audit_hash',
      column: 'audit_hash',
      // The promoted hash column differs from the incoming record's. The row
      // codec requires column and payload to agree, so the payload moves with
      // it — which makes `payload` the first caller-controlled difference found.
      // Either way it is a caller-controlled refusal, and the assertion names
      // both acceptable columns.
      plant: (event) => {
        const hash = `${String(event['audit_hash']).slice(0, -4)}dead`;
        return {
          audit_hash: hash,
          previous_audit_hash: null,
          previous_audit_hash_key: '',
          payload: JSON.stringify({ ...event, audit_hash: hash }),
        };
      },
    },
    {
      field: 'previous_audit_hash and its normalized key',
      column: 'previous_audit_hash',
      // A planted parent, written consistently across both enforcement columns
      // and the payload (the schema CHECK requires the pair to agree).
      plant: (event) => {
        const parent = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
        return {
          audit_hash: String(event['audit_hash']),
          previous_audit_hash: parent,
          previous_audit_hash_key: parent,
          payload: JSON.stringify({ ...event, previous_audit_hash: parent }),
        };
      },
    },
  ];

  for (const testCase of auditFieldCases) {
    it(`audit ${testCase.field} mismatch on an existing id is refused`, async () => {
      const captured = captureAdmitRecords(`r2 field ${testCase.column}`);
      const event = captured.auditEvents[0] as unknown as Record<string, unknown>;
      const planted = testCase.plant(event);

      // Planted under the OTHER estate so the collision reaches the classifier
      // rather than the load-time guard, and at position 1 so its own placement
      // is sound (a planted parent at position 1 needs the genesis CHECK
      // satisfied — hence position 2 when a parent is present).
      const position = planted.previous_audit_hash === null ? 1 : 2;
      await db.host.withClient(async (client) => {
        if (position === 2) {
          // Position 2 requires a genesis row at 1 for that estate's dense
          // prefix; plant an unrelated genesis first.
          const other = captureAdmitRecordsFor(OTHER_ESTATE_ID, 'r2 audit filler');
          const genesis = other.auditEvents[0] as unknown as Record<string, unknown>;
          await client.query(
            `INSERT INTO audit_events (audit_event_id, estate_id, append_position, audit_hash,
                                       previous_audit_hash, previous_audit_hash_key, payload)
             VALUES ($1, $2, 1, $3, NULL, '', $4::jsonb)`,
            [
              String(genesis['audit_event_id']),
              OTHER_ESTATE_ID,
              String(genesis['audit_hash']),
              JSON.stringify(genesis),
            ],
          );
        }
        await client.query(
          `INSERT INTO audit_events (audit_event_id, estate_id, append_position, audit_hash,
                                     previous_audit_hash, previous_audit_hash_key, payload)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
          [
            String(event['audit_event_id']),
            OTHER_ESTATE_ID,
            position,
            planted.audit_hash,
            planted.previous_audit_hash,
            planted.previous_audit_hash_key,
            planted.payload,
          ],
        );
      });

      let caught: unknown;
      try {
        await db.host.withEstateSession(ESTATE_ID, (storage) => {
          replayAll(storage, captured);
        });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(PostgresIntegrityError);
      expect(caught).toMatchObject({ reason: 'immutable_id_conflict' });
      // A CALLER-CONTROLLED column is named — never `append_position`.
      const message = String((caught as Error).message);
      expect(message).toMatch(/payload|estate_id|audit_hash|previous_audit_hash/);
      expect(
        message,
        'append_position must never be reported as a caller-controlled difference',
      ).not.toMatch(/\(append_position:/);

      // Nothing from the refused session is durable for ESTATE_ID.
      const positions = await positionsByTable(db, ESTATE_ID);
      for (const spec of APPEND_TABLES) {
        expect(positions[spec.table], `${spec.table} must hold nothing for ${ESTATE_ID}`).toEqual(
          [],
        );
      }
    });
  }

  it("the normalized key '' is never conflated with NULL by the shared comparator", async () => {
    const { firstCallerControlledMismatch } = await import(
      '../../src/straylight/storage/postgres/rows.js'
    );
    // Genesis (NULL parent, '' key) against a claimed-'' parent: a difference.
    expect(
      firstCallerControlledMismatch(
        { payload: 'p', estate_id: ESTATE_ID, previous_audit_hash: null, previous_audit_hash_key: '' },
        { payload: 'p', estate_id: ESTATE_ID, previous_audit_hash: '', previous_audit_hash_key: '' },
      ),
    ).toMatchObject({ column: 'previous_audit_hash', existing: 'NULL', incoming: '' });
    // And identical genesis rows match.
    expect(
      firstCallerControlledMismatch(
        { payload: 'p', estate_id: ESTATE_ID, previous_audit_hash: null, previous_audit_hash_key: '' },
        { payload: 'p', estate_id: ESTATE_ID, previous_audit_hash: null, previous_audit_hash_key: '' },
      ),
    ).toBeNull();
  });
});

// ── (E) SPARSE / gapped history is refused at load and quarantined ───────

maybe('Phase 50A R2 — stored placement is validated against the store\'s own invariants', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  beforeEach(async () => {
    db = await openScratchDatabase(sourceHost(), 'r2-placement');
  }, 60_000);

  afterEach(async () => {
    await db.dispose();
  });

  it('a SPARSE (gapped) per-estate history is refused at LOAD and never served', async () => {
    const captured = captureAdmitRecords('r2 sparse');
    // A single row at position 3 — a gapped history for this estate.
    await db.host.withClient(async (client) => {
      await client.query(
        `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
         VALUES ($1, $2, 3, $3::jsonb)`,
        [captured.transition.transition_id, ESTATE_ID, canonicalPayload(captured.transition)],
      );
    });

    // Any session on this estate is refused BEFORE the callback can observe the
    // snapshot: a quarantined estate is not served.
    let caught: unknown;
    let observed = false;
    try {
      await db.host.withEstateSession(ESTATE_ID, () => {
        observed = true;
      });
    } catch (err) {
      caught = err;
    }
    expect(observed, 'the callback must never see a sparse snapshot').toBe(false);
    expect(caught).toBeInstanceOf(PostgresIntegrityError);
    expect(caught).toMatchObject({ reason: 'append_prefix_mutated' });
  });

  it('the placement validator refuses a non-dense prefix, an out-of-range position, and a non-integral one', async () => {
    const { storedPlacementViolation } = await import(
      '../../src/straylight/storage/postgres/rows.js'
    );
    // Sound: a dense 1..3 prefix with the row inside it.
    expect(storedPlacementViolation([1, 2, 3], 2)).toBeNull();
    // Order-insensitive: the validator sorts before checking density.
    expect(storedPlacementViolation([3, 1, 2], 3)).toBeNull();
    // Gapped.
    expect(storedPlacementViolation([1, 3], 1)).toMatch(/dense/);
    // Duplicated.
    expect(storedPlacementViolation([1, 1, 2], 1)).toMatch(/dense/);
    // Outside the prefix.
    expect(storedPlacementViolation([1, 2], 3)).toMatch(/outside/);
    // Below the shipped CHECK (append_position >= 1).
    expect(storedPlacementViolation([1], 0)).toMatch(/positive safe integer/);
    expect(storedPlacementViolation([1], -1)).toMatch(/positive safe integer/);
    // Unreadable (NaN from an undecodable bigint) fails closed.
    expect(storedPlacementViolation([1], Number.NaN)).toMatch(/positive safe integer/);
    expect(storedPlacementViolation([1], 1.5)).toMatch(/positive safe integer/);
  });

  it('the shipped database constraints still refuse a direct non-positive or duplicate position', async () => {
    // Placement integrity rests on the ALREADY-SHIPPED constraints, not on new
    // SQL. Prove they are present and enforcing.
    const captured = captureAdmitRecords('r2 constraints');
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, captured);
    });

    // CHECK (append_position >= 1)
    await expect(
      db.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
           VALUES ('transition:r2-zero', $1, 0, '{}'::jsonb)`,
          [ESTATE_ID],
        );
      }),
    ).rejects.toThrow();

    // UNIQUE (estate_id, append_position)
    await expect(
      db.host.withClient(async (client) => {
        await client.query(
          `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
           VALUES ('transition:r2-dup', $1, 1, '{}'::jsonb)`,
          [ESTATE_ID],
        );
      }),
    ).rejects.toThrow();
  });
});

// ── (G) zero partial durability under a forced failure ──────────────────

maybe('Phase 50A R2 — zero partial durability is absolute', () => {
  let db: ScratchDatabase;

  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  beforeEach(async () => {
    db = await openScratchDatabase(sourceHost(), 'r2-zero-partial');
  }, 60_000);

  afterEach(async () => {
    await db.dispose();
  });

  it('a refusal raised AFTER several successful appends leaves NO row from the operation', async () => {
    // Two CHAINED operations, so replaying both into one estate is a legitimate
    // sequence. The second's transition id is durably taken by a row belonging to
    // ANOTHER estate, so the last write of the session is refused as conflicting
    // reuse — after several writes have already succeeded in-session.
    const [good, bad] = captureOperationSequence(ESTATE_ID, [
      'r2 partial good',
      'r2 partial bad',
    ]);

    await db.host.withClient(async (client) => {
      await client.query(
        `INSERT INTO estate_transitions (transition_id, estate_id, append_position, payload)
         VALUES ($1, $2, 1, $3::jsonb)`,
        [
          bad!.transition.transition_id,
          OTHER_ESTATE_ID,
          canonicalPayload(bad!.transition),
        ],
      );
    });

    let caught: unknown;
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        // Several successful appends first...
        replayAll(storage, good!);
        // ...then the conflicting one.
        for (const e of bad!.auditEvents) storage.appendAuditEvent(e);
        storage.appendTransition(bad!.transition);
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(PostgresIntegrityError);

    // NOTHING from the attempted operation is durable for ESTATE_ID — not even
    // the writes that individually succeeded.
    const positions = await positionsByTable(db, ESTATE_ID);
    for (const spec of APPEND_TABLES) {
      expect(
        positions[spec.table],
        `${spec.table} must hold nothing for ${ESTATE_ID} after the refusal`,
      ).toEqual([]);
    }
    // The planted row is untouched.
    const planted = await db.host.withClient(async (client) => {
      const r = await client.query<{ n: string }>(
        'SELECT count(*)::text AS n FROM estate_transitions',
      );
      return r.rows[0]?.n;
    });
    expect(planted).toBe('1');
  });

  it('success is reported only after COMMIT — a callback that throws leaves nothing', async () => {
    const captured = captureAdmitRecords('r2 throw rollback');
    await expect(
      db.host.withEstateSession(ESTATE_ID, (storage) => {
        replayAll(storage, captured);
        throw new Error('r2: forced callback failure');
      }),
    ).rejects.toThrow(/forced callback failure/);

    const counts = await appendCounts(db);
    for (const [table, n] of Object.entries(counts)) {
      expect(n, `${table} must be empty after the forced failure`).toBe(0);
    }
  });
});

// ── helpers ─────────────────────────────────────────────────────────────

/**
 * How many rows one captured operation offers to ONE append-only table.
 *
 * Derived from the capture rather than hardcoded, because the audit table
 * receives more than one row per operation (the admission event and the recall
 * emission event). A hardcoded count would silently drift from what the capture
 * actually offers.
 */
function rowsOffered(captured: CapturedRecords, spec: AppendTable): number {
  if (spec.table === 'audit_events') return captured.auditEvents.length;
  if (spec.table === 'recall_receipts') return captured.recallReceipt === undefined ? 0 : 1;
  return 1;
}

/** Total append-only writes one captured operation offers, across all tables. */
function appendWriteCount(captured: CapturedRecords): number {
  return APPEND_TABLES.reduce((sum, spec) => sum + rowsOffered(captured, spec), 0);
}

/** The dense position sequence `1..n`, the store's per-estate invariant. */
function densePrefix(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}

/** Every append-only row in the store, ordered — the durable-equality basis. */
async function durableAppendRows(
  db: ScratchDatabase,
): Promise<Record<string, Array<{ id: string; estate_id: string; p: string; payload: string }>>> {
  return db.host.withClient(async (client) => {
    const out: Record<
      string,
      Array<{ id: string; estate_id: string; p: string; payload: string }>
    > = {};
    for (const spec of APPEND_TABLES) {
      const r = await client.query<{
        id: string;
        estate_id: string;
        p: string;
        payload: unknown;
      }>(
        `SELECT ${spec.idColumn} AS id, estate_id, append_position::text AS p, payload
           FROM ${spec.table} ORDER BY estate_id ASC, append_position ASC`,
      );
      out[spec.table] = r.rows.map((row) => ({
        id: row.id,
        estate_id: row.estate_id,
        p: row.p,
        payload: canonicalPayload(row.payload),
      }));
    }
    return out;
  });
}

/** Per-table append positions for one estate, ascending. */
async function positionsByTable(
  db: ScratchDatabase,
  estate_id: string,
): Promise<Record<string, number[]>> {
  return db.host.withClient(async (client) => {
    const out: Record<string, number[]> = {};
    for (const spec of APPEND_TABLES) {
      const r = await client.query<{ p: string }>(
        `SELECT append_position::text AS p FROM ${spec.table}
          WHERE estate_id = $1 ORDER BY append_position ASC`,
        [estate_id],
      );
      out[spec.table] = r.rows.map((row) => Number(row.p));
    }
    return out;
  });
}

/** Row counts of every append-only table, across all estates. */
async function appendCounts(db: ScratchDatabase): Promise<Record<string, number>> {
  return db.host.withClient(async (client) => {
    const out: Record<string, number> = {};
    for (const spec of APPEND_TABLES) {
      const r = await client.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM ${spec.table}`,
      );
      out[spec.table] = Number(r.rows[0]?.n ?? '-1');
    }
    return out;
  });
}

/**
 * Offer the whole captured operation, require a specific refusal, and prove ZERO
 * PARTIAL DURABILITY.
 *
 * Zero partial durability is asserted as "the durable rows are UNCHANGED from
 * before the refused session", not as "the tables are empty": a planted row that
 * pre-existed the session legitimately survives its rollback. Comparing against
 * the pre-session snapshot is the exact claim — nothing the refused operation
 * attempted became durable, and nothing that was already durable was disturbed.
 */
async function expectRefusal(
  db: ScratchDatabase,
  captured: CapturedRecords,
  reason: string,
  column: string,
): Promise<void> {
  const before = await durableAppendRows(db);
  let caught: unknown;
  try {
    await db.host.withEstateSession(ESTATE_ID, (storage) => {
      replayAll(storage, captured);
    });
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(PostgresIntegrityError);
  expect(caught).toMatchObject({ reason });
  expect(String((caught as Error).message)).toContain(column);
  expect(
    await durableAppendRows(db),
    'no row from the refused operation may be durable, and no pre-existing row may change',
  ).toEqual(before);
}

/** Every permutation of a small index array. */
function permutations(items: number[]): number[][] {
  if (items.length <= 1) return [items];
  const out: number[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) out.push([items[i]!, ...tail]);
  }
  return out;
}

// ── capture / replay ────────────────────────────────────────────────────

/**
 * The exact canonical records ONE admission plus ONE governed recall produce,
 * captured from an in-memory run so they can be replayed byte-identically.
 *
 * Capturing (rather than re-executing `admit`) is what makes a retry a real
 * retry: re-executing against a store that already holds the first attempt
 * derives the same content-addressed ids but a different audit reference,
 * because the chain tail moved — that is conflicting reuse, proven to fail
 * closed elsewhere. Same rationale and shape as
 * `postgres-callback-and-row-idempotency.test.ts`.
 *
 * A RECALL RECEIPT is included so all FOUR append-only tables are exercised;
 * the sibling suite covers only three.
 */
interface CapturedRecords {
  actor: ReturnType<typeof loadActor>;
  estate: ReturnType<typeof loadEstate>;
  keyring: ReturnType<typeof loadKeyring>;
  assertion: NonNullable<ReturnType<EstateStore['admit']>['assertion']>;
  transition: ReturnType<EstateStore['admit']>['transition'];
  transitionReceipt: ReturnType<EstateStore['admit']>['receipt'];
  /**
   * Present only for the BASE estate — see `captureOperationSequence`. A
   * non-base estate's recall receipt cannot be produced through its real
   * producer without editing the forbidden `fixtures/` path, so it is absent
   * rather than fabricated.
   */
  recallReceipt: ({ receipt_id: string; estate_id: string } & Record<string, unknown>) | undefined;
  auditEvents: ReturnType<StorageAdapter['listAuditEvents']>;
}

function captureAdmitRecords(text: string): CapturedRecords {
  const [only] = captureOperationSequence(ESTATE_ID, [text]);
  return only!;
}

function captureAdmitRecordsFor(estate_id: string, text: string): CapturedRecords {
  const [only] = captureOperationSequence(estate_id, [text]);
  return only!;
}

/**
 * Capture a SEQUENCE of operations against ONE in-memory store, and return one
 * record set per operation.
 *
 * A sequence rather than independent captures, for two reasons that are both
 * properties of the domain rather than of this suite:
 *
 *   * the audit chain is per-estate, so only the FIRST operation's event is the
 *     genesis link. Two independently-captured operations would each produce a
 *     genesis event, and replaying both into one estate is a genuine
 *     `audit_chain_broken` refusal — correct behaviour, but not what the
 *     multi-operation cases mean to exercise.
 *   * the recall receipt is content-addressed on its REQUEST, so two operations
 *     must issue distinguishable requests to produce distinct receipt ids.
 *
 * A GOVERNED RECALL is executed alongside each admission so all FOUR append-only
 * tables are exercised through their real producers — the sibling suite covers
 * only three. Nothing is hand-built: the recall receipt comes from
 * `executeRecall`, exactly as `postgres-conformance.test.ts` captures it.
 *
 * Capturing (rather than re-executing) is what makes a retry a REAL retry:
 * re-executing against a store that already holds the first attempt derives the
 * same content-addressed ids but a different audit reference, because the chain
 * tail moved — that is conflicting reuse, proven to fail closed elsewhere.
 *
 * The estate id is substituted into the estate the store is built over, so a
 * second estate's records are structurally identical apart from the estate they
 * declare — which is what makes the cross-estate cases test the BINDING rather
 * than an incidental difference in content.
 */
function captureOperationSequence(estate_id: string, labels: readonly string[]): CapturedRecords[] {
  const storage = new InMemoryStorage();
  const baseEstate = loadEstate();
  const estate = estate_id === baseEstate.estate_id ? baseEstate : { ...baseEstate, estate_id };
  const store = new EstateStore({
    actor: loadActor(),
    estate,
    keyring: loadKeyring(),
    storage,
  });

  // A GOVERNED RECALL is captured only for the BASE estate. `buildRecallRequest`
  // in `fixtures/` hardcodes the estate it names, and `fixtures/` is a forbidden
  // path for this packet, so a second estate's recall receipt cannot be produced
  // through its real producer. Rather than hand-forge one — which would make the
  // fourth table's row a fabrication rather than a real record — a non-base
  // estate's capture simply omits it, and `rowsOffered` accounts for that. Every
  // per-table assertion still covers all four tables via the base estate.
  const canRecall = estate_id === baseEstate.estate_id;

  const out: CapturedRecords[] = [];
  for (const [index, label] of labels.entries()) {
    const before = storage.listAuditEvents(estate_id).length;
    const admit = store.admit(observation(label), NOW);
    expect(admit.ok, `capture "${label}" for ${estate_id} must admit`).toBe(true);
    let recallReceipt: CapturedRecords['recallReceipt'] | undefined;
    if (canRecall) {
      const recall = executeRecall(store, recallRequest(index), NOW);
      expect(recall.ok, `capture "${label}" for ${estate_id} must recall`).toBe(true);
      recallReceipt = recall.receipt! as unknown as CapturedRecords['recallReceipt'];
    }
    out.push({
      actor: loadActor(),
      estate,
      keyring: loadKeyring(),
      assertion: admit.assertion!,
      transition: admit.transition,
      transitionReceipt: admit.receipt,
      recallReceipt,
      // EVERY audit event this operation produced (the admission and the recall
      // emission), in chain order, and NONE from an earlier operation. Taking
      // the whole slice matters: the per-estate chain is contiguous, so replaying
      // a subset of one operation's events would leave the next operation's
      // declared parent absent and raise a legitimate `audit_chain_broken`.
      auditEvents: storage.listAuditEvents(estate_id).slice(before),
    });
  }
  return out;
}

/**
 * A governed recall request, distinguishable per operation in a sequence.
 *
 * `request_id` is set EXPLICITLY rather than left to derive from the task text:
 * the fixture builder slices the task to 32 characters, so two operations with
 * similar labels would derive the SAME request id and therefore the same
 * content-addressed receipt id with different contents — a genuine
 * `immutable_id_conflict`, but an artefact of the fixture rather than the
 * property under test.
 */
function recallRequest(index: number) {
  return buildRecallRequest({
    request_id: `rreq_r2_op_${index}`,
    task: `public discord op ${index}`,
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    signer: SIGNERS.operator,
  });
}

/** Write exactly the captured records through the adapter, in order. */
function replayAll(storage: StorageAdapter, captured: CapturedRecords): void {
  replayAllFor(storage, captured);
}

function replayAllFor(storage: StorageAdapter, captured: CapturedRecords): void {
  storage.upsertActor(captured.actor);
  storage.upsertKeyring(captured.keyring);
  storage.upsertEstate(captured.estate);
  storage.upsertAssertion(captured.assertion);
  for (const event of captured.auditEvents) {
    storage.appendAuditEvent(event);
  }
  storage.appendTransition(captured.transition);
  storage.upsertTransitionReceipt(captured.transitionReceipt);
  if (captured.recallReceipt !== undefined) {
    storage.upsertRecallReceipt(captured.recallReceipt as never);
  }
}

function observation(text: string) {
  return buildCandidate({
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}
