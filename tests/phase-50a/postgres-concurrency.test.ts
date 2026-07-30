// Phase 50A — concurrency and isolation.
//
// ADR-049Q §13.1(h); P-12. The JSONL adapter records "Multi-process safety:
// NOT GUARANTEED. The MVP assumes a single writer"
// (`src/straylight/storage/jsonl.ts:15`-`:20`). P-12 forbids inheriting that
// as an assumption: single-writer-equivalent ordering must be RE-ESTABLISHED
// on the new host, and proven, without altering P-3 semantics.
//
// Every test here runs GENUINELY CONCURRENT operations (started together, not
// awaited in sequence) and then proves the durable outcome:
//
//   * no lost update — every accepted operation is present;
//   * no duplicate append position — positions stay a dense sequence;
//   * no chain fork — one child per chain tail, chain verifies;
//   * no silent drop — a refused operation FAILED LOUDLY, it did not vanish;
//   * different estates never contend and never leak into each other.

import { beforeAll, describe, expect, it } from 'vitest';

import { EstateStore, type StorageAdapter } from '../../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../../fixtures/index.js';
import { PostgresIntegrityError } from '../../src/straylight/storage/postgres/index.js';
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
const OTHER_ESTATE_ID = 'estate:phase-50a-second';

phase50aGateReport('postgres-concurrency');

const maybe = phase50aEnabled() ? describe : describe.skip;

maybe('Phase 50A concurrency — same-estate operations serialize', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  it('two concurrent same-estate admits both land, with no lost update, duplicate position, or fork', async () => {
    const db = await openScratchDatabase(sourceHost(), 'concurrent-admits');
    try {
      // Bootstrap the estate row so both racers contend on the SAME row lock.
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage);
      });

      // Started together: the second `withEstateSession` begins before the
      // first resolves, so they genuinely overlap and the store — not the test
      // — must impose an order.
      const [a, b] = await Promise.all([
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          const out = newStore(storage).admit(observation('racer A'), NOW);
          return out.assertion!.assertion_id;
        }),
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          const out = newStore(storage).admit(observation('racer B'), NOW);
          return out.assertion!.assertion_id;
        }),
      ]);
      expect(a.committed).toBe(true);
      expect(b.committed).toBe(true);
      expect(a.value).not.toBe(b.value);

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
        return {
          assertionIds: storage.listAssertions(ESTATE_ID).map((x) => x.assertion_id).sort(),
          transitions: storage.listTransitions(ESTATE_ID).length,
          receipts: storage.listTransitionReceipts(ESTATE_ID).length,
          audit: storage.listAuditEvents(ESTATE_ID),
          chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
        };
      });

      // No lost update: BOTH admits are durable.
      expect(read.value.assertionIds).toEqual([a.value, b.value].sort());
      expect(read.value.transitions).toBe(2);
      expect(read.value.receipts).toBe(2);
      // Single-writer-equivalent ordering: the chain is a straight line of
      // exactly two links, each pointing at its predecessor.
      expect(read.value.audit).toHaveLength(2);
      expect(read.value.audit[0]?.previous_audit_hash).toBeUndefined();
      expect(read.value.audit[1]?.previous_audit_hash).toBe(read.value.audit[0]?.audit_hash);
      expect(read.value.chainOk).toBe(true);

      // No duplicate append position anywhere.
      await expectDensePositions(db, ESTATE_ID, {
        estate_transitions: 2,
        transition_receipts: 2,
        audit_events: 2,
      });
    } finally {
      await db.dispose();
    }
  });

  it('eight concurrent same-estate admits produce a dense, forkless chain of eight', async () => {
    const db = await openScratchDatabase(sourceHost(), 'concurrent-eight');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage);
      });

      const count = 8;
      const results = await Promise.all(
        Array.from({ length: count }, (_unused, i) =>
          db.host.withEstateSession(ESTATE_ID, (storage) => {
            const out = newStore(storage).admit(observation(`racer ${i}`), NOW);
            return out.assertion!.assertion_id;
          }),
        ),
      );
      // Every operation committed; none was silently dropped.
      expect(results).toHaveLength(count);
      for (const r of results) expect(r.committed).toBe(true);
      const ids = new Set(results.map((r) => r.value));
      expect(ids.size).toBe(count);

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
        const audit = storage.listAuditEvents(ESTATE_ID);
        return {
          assertions: storage.listAssertions(ESTATE_ID).length,
          transitions: storage.listTransitions(ESTATE_ID).length,
          audit,
          chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
          parents: audit.map((e) => e.previous_audit_hash ?? null),
        };
      });
      expect(read.value.assertions).toBe(count);
      expect(read.value.transitions).toBe(count);
      expect(read.value.audit).toHaveLength(count);
      expect(read.value.chainOk).toBe(true);
      // No fork: every parent link is distinct, and the chain is a line.
      expect(new Set(read.value.parents).size).toBe(count);
      for (let i = 1; i < read.value.audit.length; i++) {
        expect(read.value.audit[i]?.previous_audit_hash).toBe(
          read.value.audit[i - 1]?.audit_hash,
        );
      }

      await expectDensePositions(db, ESTATE_ID, {
        estate_transitions: count,
        transition_receipts: count,
        audit_events: count,
      });
    } finally {
      await db.dispose();
    }
  });

  it('concurrent bootstrap of the SAME new estate serializes (advisory lock, no estate row yet)', async () => {
    const db = await openScratchDatabase(sourceHost(), 'concurrent-bootstrap');
    try {
      // No estate row exists, so there is nothing to lock FOR UPDATE. The
      // advisory lock is what serializes these; without it both would load an
      // empty snapshot and both would write a genesis audit link, forking the
      // chain at position 1.
      const results = await Promise.all(
        Array.from({ length: 4 }, (_unused, i) =>
          db.host.withEstateSession(ESTATE_ID, (storage) => {
            const out = newStore(storage).admit(observation(`bootstrap ${i}`), NOW);
            return out.assertion!.assertion_id;
          }),
        ),
      );
      for (const r of results) expect(r.committed).toBe(true);

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
        const audit = storage.listAuditEvents(ESTATE_ID);
        return {
          audit: audit.length,
          genesisLinks: audit.filter((e) => e.previous_audit_hash === undefined).length,
          chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
        };
      });
      expect(read.value.audit).toBe(4);
      // EXACTLY ONE genesis link. Two would be the fork the advisory lock
      // exists to prevent.
      expect(read.value.genesisLinks).toBe(1);
      expect(read.value.chainOk).toBe(true);
    } finally {
      await db.dispose();
    }
  });

  it('a stale snapshot cannot append onto a moved prefix: it fails loudly, never silently', async () => {
    const db = await openScratchDatabase(sourceHost(), 'stale-prefix');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('first'), NOW);
      });

      // Capture a transition built against the CURRENT tail, then advance the
      // chain, then try to write the stale record. Its previous_audit_hash no
      // longer matches the tail, so it must be refused rather than appended in
      // a way that silently forks or overwrites.
      const stale = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const events = storage.listAuditEvents(ESTATE_ID);
        return events[events.length - 1]!;
      });

      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('second'), NOW);
      });

      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          storage.appendAuditEvent({
            ...stale.value,
            audit_event_id: 'aud_stale_child',
            audit_hash: 'sha256:stale-child',
            previous_audit_hash: stale.value.audit_hash,
          });
        }),
      ).rejects.toBeInstanceOf(PostgresIntegrityError);

      // The refusal was loud AND left the store exactly as it was.
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
        return {
          audit: storage.listAuditEvents(ESTATE_ID).length,
          chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
        };
      });
      expect(read.value.audit).toBe(2);
      expect(read.value.chainOk).toBe(true);
    } finally {
      await db.dispose();
    }
  });
});

maybe('Phase 50A isolation — different estates do not contend or leak', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  it('concurrent operations on different estates do not cross-contaminate state', async () => {
    const db = await openScratchDatabase(sourceHost(), 'cross-estate');
    try {
      const [a, b] = await Promise.all([
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          const out = newStore(storage).admit(observation('estate one'), NOW);
          return out.assertion!.assertion_id;
        }),
        db.host.withEstateSession(OTHER_ESTATE_ID, (storage) => {
          const out = newOtherStore(storage).admit(otherObservation('estate two'), NOW);
          return out.assertion!.assertion_id;
        }),
      ]);
      expect(a.committed).toBe(true);
      expect(b.committed).toBe(true);

      // Each estate sees ONLY its own rows — the snapshot is estate-scoped, so
      // even the global `listAuditEvents()` form cannot reach across.
      const first = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        assertions: storage.listAssertions(ESTATE_ID).map((x) => x.assertion_id),
        foreignAssertions: storage.listAssertions(OTHER_ESTATE_ID),
        audit: storage.listAuditEvents(ESTATE_ID).length,
        globalAudit: storage.listAuditEvents().length,
        foreignEstate: storage.getEstate(OTHER_ESTATE_ID),
      }));
      expect(first.value.assertions).toEqual([a.value]);
      expect(first.value.foreignAssertions).toEqual([]);
      expect(first.value.audit).toBe(1);
      expect(first.value.globalAudit).toBe(1);
      expect(first.value.foreignEstate).toBeUndefined();

      const second = await db.host.withEstateSession(OTHER_ESTATE_ID, (storage) => ({
        assertions: storage.listAssertions(OTHER_ESTATE_ID).map((x) => x.assertion_id),
        foreignAssertions: storage.listAssertions(ESTATE_ID),
        audit: storage.listAuditEvents(OTHER_ESTATE_ID).length,
        globalAudit: storage.listAuditEvents().length,
        foreignEstate: storage.getEstate(ESTATE_ID),
      }));
      expect(second.value.assertions).toEqual([b.value]);
      expect(second.value.foreignAssertions).toEqual([]);
      expect(second.value.audit).toBe(1);
      expect(second.value.globalAudit).toBe(1);
      expect(second.value.foreignEstate).toBeUndefined();
    } finally {
      await db.dispose();
    }
  });

  it('each estate keeps its OWN independent chain and append positions', async () => {
    const db = await openScratchDatabase(sourceHost(), 'independent-chains');
    try {
      // Interleave writes across two estates so their positions would collide
      // if positions were global rather than per-estate.
      for (let i = 0; i < 3; i++) {
        await Promise.all([
          db.host.withEstateSession(ESTATE_ID, (storage) => {
            newStore(storage).admit(observation(`one-${i}`), NOW);
          }),
          db.host.withEstateSession(OTHER_ESTATE_ID, (storage) => {
            newOtherStore(storage).admit(otherObservation(`two-${i}`), NOW);
          }),
        ]);
      }

      for (const estate of [ESTATE_ID, OTHER_ESTATE_ID]) {
        const read = await db.host.withEstateSession(estate, (storage) => {
          const store = EstateStore.fromStorage(storage, estate)!;
          return {
            audit: storage.listAuditEvents(estate).length,
            chainOk: store.auditLog.verifyChain(estate).ok,
          };
        });
        expect(read.value.audit, `${estate} audit length`).toBe(3);
        expect(read.value.chainOk, `${estate} chain`).toBe(true);
        // Both estates independently start at position 1 and run to 3.
        await expectDensePositions(db, estate, {
          estate_transitions: 3,
          transition_receipts: 3,
          audit_events: 3,
        });
      }
    } finally {
      await db.dispose();
    }
  });
});

// ── helpers ─────────────────────────────────────────────────────────────

/**
 * Assert each named table holds exactly `expected` rows for the estate, at
 * positions 1..expected with no gap and no duplicate. Reads the raw columns,
 * so it checks the DURABLE positions rather than the adapter's view of them.
 */
async function expectDensePositions(
  db: ScratchDatabase,
  estate_id: string,
  expected: Record<string, number>,
): Promise<void> {
  const observed = await db.host.withClient(async (client) => {
    const out: Record<string, number[]> = {};
    for (const table of Object.keys(expected)) {
      const r = await client.query<{ append_position: string }>(
        `SELECT append_position FROM ${table} WHERE estate_id = $1 ORDER BY append_position ASC`,
        [estate_id],
      );
      out[table] = r.rows.map((row) => Number(row.append_position));
    }
    return out;
  });
  for (const [table, count] of Object.entries(expected)) {
    const positions = observed[table] ?? [];
    expect(positions, `${table} positions for ${estate_id}`).toEqual(
      Array.from({ length: count }, (_unused, i) => i + 1),
    );
  }
}

function newStore(storage: StorageAdapter): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    storage,
  });
}

/**
 * A second, genuinely distinct estate. Only the estate/actor/keyring identity
 * changes — no semantics are altered, so the isolation proof compares like
 * with like.
 */
function newOtherStore(storage: StorageAdapter): EstateStore {
  const actor = { ...loadActor(), actor_id: 'actor:phase-50a-second', estate_id: OTHER_ESTATE_ID, keyring_id: 'keyring:phase-50a-second' };
  const keyring = { ...loadKeyring(), keyring_id: 'keyring:phase-50a-second', actor_id: actor.actor_id, estate_id: OTHER_ESTATE_ID };
  const estate = {
    ...loadEstate(),
    estate_id: OTHER_ESTATE_ID,
    actor_id: actor.actor_id,
    keyring_id: keyring.keyring_id,
  };
  return new EstateStore({ actor, estate, keyring, storage });
}

function observation(text: string) {
  return buildCandidate({
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}

function otherObservation(text: string) {
  return buildCandidate({
    estate_id: OTHER_ESTATE_ID,
    actor_id: 'actor:phase-50a-second',
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}
