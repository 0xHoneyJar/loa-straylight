// Phase 50A — StorageAdapter conformance against a real PostgreSQL host.
//
// ADR-049Q §13.1(a), (d), (g); P-3, P-11.
//
// The scenarios here mirror `tests/storage-conformance.test.ts` — the SAME
// contract, the SAME assertions — run against a transaction-scoped
// PostgreSQL-backed adapter session. That file is untouched: its
// InMemoryStorage and JsonlStorage cases are not weakened, reduced, or
// reparameterized by this work.
//
// Each scenario runs inside ONE `withEstateSession` call, so it exercises the
// real boundary: transaction open → per-estate lock → snapshot load → the
// synchronous adapter → prefix re-verification → delta persist → COMMIT.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
import { PostgresEstateHost } from '../../src/straylight/storage/postgres/index.js';
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

phase50aGateReport('postgres-conformance');

const maybe = phase50aEnabled() ? describe : describe.skip;

maybe('Phase 50A — StorageAdapter conformance: PostgresAdapterSession', () => {
  let scratch: ScratchDatabase;
  let host: PostgresEstateHost;

  beforeAll(async () => {
    await requireReachable(sourceHost());
    scratch = await openScratchDatabase(sourceHost(), 'conformance');
    host = scratch.host;
  }, 60_000);

  afterAll(async () => {
    await scratch?.dispose();
  });

  it('returns undefined / [] for unknown ids (never throws)', async () => {
    const result = await host.withEstateSession('estate:absent', (storage) => {
      return {
        actor: storage.getActor('nope'),
        estate: storage.getEstate('nope'),
        keyring: storage.getKeyring('nope'),
        assertion: storage.getAssertion('nope'),
        recallReceipt: storage.getRecallReceipt('nope'),
        transitionReceipt: storage.getTransitionReceipt('nope'),
        assertions: storage.listAssertions('nope'),
        transitions: storage.listTransitions('nope'),
        transitionReceipts: storage.listTransitionReceipts('nope'),
        scopedAudit: storage.listAuditEvents('nope'),
        globalAudit: storage.listAuditEvents(),
        tail: storage.getAuditTail('nope'),
      };
    });
    expect(result.committed).toBe(true);
    const v = result.value;
    expect(v.actor).toBeUndefined();
    expect(v.estate).toBeUndefined();
    expect(v.keyring).toBeUndefined();
    expect(v.assertion).toBeUndefined();
    expect(v.recallReceipt).toBeUndefined();
    expect(v.transitionReceipt).toBeUndefined();
    expect(v.assertions).toEqual([]);
    expect(v.transitions).toEqual([]);
    expect(v.transitionReceipts).toEqual([]);
    expect(v.scopedAudit).toEqual([]);
    expect(v.globalAudit).toEqual([]);
    expect(v.tail).toBeUndefined();
  });

  it('upsert keeps the latest canonical version by primary id, durably across sessions', async () => {
    const actor = loadActor();
    const estate = loadEstate();
    const keyring = loadKeyring();

    // Session 1 writes the initial versions.
    await host.withEstateSession(estate.estate_id, (storage) => {
      storage.upsertActor(actor);
      storage.upsertEstate(estate);
      storage.upsertKeyring(keyring);
    });

    // Session 2 writes newer versions of the same ids.
    await host.withEstateSession(estate.estate_id, (storage) => {
      storage.upsertActor({ ...actor, status: 'suspended' });
      storage.upsertEstate({ ...estate, status: 'archived' });
      storage.upsertKeyring({ ...keyring, version: '0.2.0' });
    });

    // Session 3 is a COLD read: a fresh transaction, a fresh snapshot.
    const read = await host.withEstateSession(estate.estate_id, (storage) => ({
      actorStatus: storage.getActor(actor.actor_id)?.status,
      estateStatus: storage.getEstate(estate.estate_id)?.status,
      keyringVersion: storage.getKeyring(keyring.keyring_id)?.version,
    }));
    expect(read.value.actorStatus).toBe('suspended');
    expect(read.value.estateStatus).toBe('archived');
    expect(read.value.keyringVersion).toBe('0.2.0');
  });

  it('assertion upsert keeps the latest version and lists by estate', async () => {
    const db = await openScratchDatabase(sourceHost(), 'assertion-upsert');
    try {
      const admitted = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = newStore(storage);
        const out = store.admit(publicObservation('upsert-target'), NOW);
        expect(out.ok).toBe(true);
        return out.assertion!;
      });

      // Mutate the status through a second session and re-read cold.
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        storage.upsertAssertion({ ...admitted.value, status: 'demoted' });
      });

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        status: storage.getAssertion(admitted.value.assertion_id)?.status,
        listed: storage.listAssertions(ESTATE_ID).length,
      }));
      expect(read.value.status).toBe('demoted');
      expect(read.value.listed).toBe(1);
    } finally {
      await db.dispose();
    }
  });

  it('captures a full admit + recall flow and exposes it through the adapter', async () => {
    const db = await openScratchDatabase(sourceHost(), 'admit-recall');
    try {
      const written = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = newStore(storage);
        const admit = store.admit(publicObservation('public obs'), NOW);
        expect(admit.ok).toBe(true);
        const out = executeRecall(store, publicRecallRequest(), NOW);
        expect(out.ok).toBe(true);
        return {
          assertion_id: admit.assertion!.assertion_id,
          receipt_id: out.receipt!.receipt_id,
          pack_hash: out.receipt!.pack_hash,
        };
      });
      expect(written.committed).toBe(true);

      // Cold read in a NEW transaction: everything the flow produced is
      // durable, and it became durable only because the commit succeeded.
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        assertions: storage.listAssertions(ESTATE_ID),
        transitions: storage.listTransitions(ESTATE_ID),
        transitionReceipts: storage.listTransitionReceipts(ESTATE_ID),
        audit: storage.listAuditEvents(ESTATE_ID),
        persistedReceipt: storage.getRecallReceipt(written.value.receipt_id),
      }));
      expect(read.value.assertions).toHaveLength(1);
      expect(read.value.assertions[0]?.assertion_id).toBe(written.value.assertion_id);
      expect(read.value.transitions).toHaveLength(1);
      expect(read.value.transitions[0]?.transition_type).toBe('admit_assertion');
      expect(read.value.transitionReceipts).toHaveLength(1);
      expect(read.value.audit.some((e) => e.event_type === 'assertion_admitted')).toBe(true);
      expect(read.value.persistedReceipt?.pack_hash).toBe(written.value.pack_hash);
    } finally {
      await db.dispose();
    }
  });

  it('audit chain links: previous_audit_hash points at the prior tail; the tail advances per write', async () => {
    const db = await openScratchDatabase(sourceHost(), 'chain-links');
    try {
      const before = await db.host.withEstateSession(ESTATE_ID, (storage) =>
        storage.getAuditTail(ESTATE_ID),
      );
      expect(before.value).toBeUndefined();

      const first = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(publicObservation('first'), NOW);
        return storage.getAuditTail(ESTATE_ID);
      });
      expect(first.value).toBeDefined();

      const second = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(publicObservation('second'), NOW);
        return storage.getAuditTail(ESTATE_ID);
      });
      expect(second.value).toBeDefined();
      expect(second.value).not.toBe(first.value);

      // The existing verifier accepts the durable chain, and every link
      // points at its predecessor's hash.
      const verified = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID);
        expect(store).toBeDefined();
        const chain = storage.listAuditEvents(ESTATE_ID);
        return {
          ok: store!.auditLog.verifyChain(ESTATE_ID).ok,
          links: chain.map((e) => e.previous_audit_hash ?? null),
          hashes: chain.map((e) => e.audit_hash),
        };
      });
      expect(verified.value.ok).toBe(true);
      expect(verified.value.links[0]).toBeNull();
      for (let i = 1; i < verified.value.hashes.length; i++) {
        expect(verified.value.links[i]).toBe(verified.value.hashes[i - 1]);
      }
    } finally {
      await db.dispose();
    }
  });

  it('listAuditEvents filters by estate_id; the global form returns everything', async () => {
    const db = await openScratchDatabase(sourceHost(), 'audit-filter');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(publicObservation('evt'), NOW);
      });
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        all: storage.listAuditEvents(),
        scoped: storage.listAuditEvents(ESTATE_ID),
      }));
      expect(read.value.scoped.length).toBeGreaterThan(0);
      // The session snapshot is estate-scoped, so the global form returns
      // exactly this estate's events — the cross-estate isolation property.
      expect(read.value.all.length).toBe(read.value.scoped.length);
      expect(read.value.scoped.every((e) => e.estate_id === ESTATE_ID)).toBe(true);
    } finally {
      await db.dispose();
    }
  });

  it('transitions and audit events are returned in append order after a cold reload', async () => {
    const db = await openScratchDatabase(sourceHost(), 'append-order');
    try {
      const bodies = ['one', 'two', 'three', 'four'];
      for (const body of bodies) {
        await db.host.withEstateSession(ESTATE_ID, (storage) => {
          newStore(storage).admit(publicObservation(body), NOW);
        });
      }
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        transitions: storage.listTransitions(ESTATE_ID).length,
        audit: storage.listAuditEvents(ESTATE_ID),
        receipts: storage.listTransitionReceipts(ESTATE_ID).length,
      }));
      expect(read.value.transitions).toBe(bodies.length);
      expect(read.value.receipts).toBe(bodies.length);
      // Append order is proven by the chain: each event's declared parent is
      // its predecessor's hash, in the order returned.
      const audit = read.value.audit;
      expect(audit).toHaveLength(bodies.length);
      for (let i = 1; i < audit.length; i++) {
        expect(audit[i]?.previous_audit_hash).toBe(audit[i - 1]?.audit_hash);
      }
    } finally {
      await db.dispose();
    }
  });

  it('cold reload via EstateStore.fromStorage restores a working store and governed recall', async () => {
    const db = await openScratchDatabase(sourceHost(), 'cold-reload');
    try {
      await db.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(publicObservation('cold obs'), NOW);
      });
      // A brand-new process-equivalent: a fresh transaction, a fresh snapshot,
      // and NO in-memory carry-over. fromStorage must rebuild everything from
      // the durable rows alone.
      const reloaded = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const store = EstateStore.fromStorage(storage, ESTATE_ID);
        expect(store).toBeDefined();
        const out = executeRecall(store!, publicRecallRequest(), NOW);
        return {
          ok: out.ok,
          included: out.pack?.included.length ?? 0,
          chainOk: store!.auditLog.verifyChain(ESTATE_ID).ok,
        };
      });
      expect(reloaded.value.ok).toBe(true);
      expect(reloaded.value.included).toBe(1);
      expect(reloaded.value.chainOk).toBe(true);
    } finally {
      await db.dispose();
    }
  });

  it('an identical retry is idempotent: no duplicate immutable record is created', async () => {
    const db = await openScratchDatabase(sourceHost(), 'idempotent-retry');
    try {
      // The retry shape this proves is the real one: a caller whose commit
      // outcome was UNCERTAIN retries the SAME canonical records. Capture the
      // records once, then persist them twice.
      //
      // Capturing (rather than re-executing `admit`) is what makes the payload
      // genuinely identical. Re-executing `admit` against a store that already
      // holds the first attempt derives the same content-addressed
      // `transition_id` but a DIFFERENT `audit_event_ref` — the chain tail
      // moved — which is conflicting reuse, not a retry. That case is proven
      // to fail closed in the test below and in the negative suite.
      const captured = captureAdmitRecords('retry me');

      const first = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        replayAdmitRecords(storage, captured);
      });
      const second = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        replayAdmitRecords(storage, captured);
      });

      // First attempt wrote every append-only record; the retry wrote none and
      // converged on all four.
      expect(first.persisted.inserted).toBe(4);
      expect(first.persisted.idempotent).toBe(0);
      expect(second.persisted.inserted).toBe(0);
      expect(second.persisted.idempotent).toBe(4);

      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        assertions: storage.listAssertions(ESTATE_ID).length,
        transitions: storage.listTransitions(ESTATE_ID).length,
        receipts: storage.listTransitionReceipts(ESTATE_ID).length,
        recallReceipts: storage.getRecallReceipt(captured.recallReceipt.receipt_id) ? 1 : 0,
        audit: storage.listAuditEvents(ESTATE_ID).length,
        chainOk: EstateStore.fromStorage(storage, ESTATE_ID)!.auditLog.verifyChain(ESTATE_ID).ok,
      }));
      expect(read.value).toEqual({
        assertions: 1,
        transitions: 1,
        receipts: 1,
        recallReceipts: 1,
        audit: 1,
        chainOk: true,
      });
    } finally {
      await db.dispose();
    }
  });

  it('re-executing an admit over an existing chain is CONFLICTING reuse: it fails and rolls back', async () => {
    const db = await openScratchDatabase(sourceHost(), 'conflicting-reexec');
    try {
      const first = await db.host.withEstateSession(ESTATE_ID, (storage) => {
        const out = newStore(storage).admit(publicObservation('re-exec'), NOW);
        return {
          transition_id: out.transition.transition_id,
          audit_event_ref: out.transition.audit_event_ref,
        };
      });

      // Re-executing the SAME admit now derives the same transition_id (it is
      // content-addressed over the candidate and `now`, which are unchanged)
      // but a different audit_event_ref, because the chain tail advanced. That
      // is an immutable id carrying different content, so the store must
      // refuse it rather than update, duplicate, or silently repair.
      await expect(
        db.host.withEstateSession(ESTATE_ID, (storage) => {
          newStore(storage).admit(publicObservation('re-exec'), NOW);
        }),
      ).rejects.toMatchObject({
        name: 'PostgresIntegrityError',
        reason: 'immutable_id_conflict',
      });

      // The refused attempt left NOTHING behind: the estate still holds
      // exactly the first admit, and its chain still verifies.
      const read = await db.host.withEstateSession(ESTATE_ID, (storage) => ({
        transitions: storage.listTransitions(ESTATE_ID),
        audit: storage.listAuditEvents(ESTATE_ID).length,
        receipts: storage.listTransitionReceipts(ESTATE_ID).length,
        chainOk: EstateStore.fromStorage(storage, ESTATE_ID)!.auditLog.verifyChain(ESTATE_ID).ok,
      }));
      expect(read.value.transitions).toHaveLength(1);
      expect(read.value.transitions[0]?.transition_id).toBe(first.value.transition_id);
      expect(read.value.transitions[0]?.audit_event_ref).toBe(first.value.audit_event_ref);
      expect(read.value.audit).toBe(1);
      expect(read.value.receipts).toBe(1);
      expect(read.value.chainOk).toBe(true);
    } finally {
      await db.dispose();
    }
  });

  it('the adapter session satisfies the StorageAdapter type without any signature change', async () => {
    // A compile-time and run-time statement of the seam: the session is
    // assignable to StorageAdapter, and every method is synchronous (returns a
    // non-Promise). If a method had been made async to "make PostgreSQL
    // easier", this fails.
    await host.withEstateSession('estate:shape-probe', (storage: StorageAdapter) => {
      const results: unknown[] = [
        storage.getActor('x'),
        storage.getEstate('x'),
        storage.getKeyring('x'),
        storage.getAssertion('x'),
        storage.listAssertions('x'),
        storage.listTransitions('x'),
        storage.getRecallReceipt('x'),
        storage.getTransitionReceipt('x'),
        storage.listTransitionReceipts('x'),
        storage.listAuditEvents('x'),
        storage.listAuditEvents(),
        storage.getAuditTail('x'),
      ];
      for (const r of results) {
        expect(r).not.toBeInstanceOf(Promise);
      }
    });
  });
});

// ── helpers ─────────────────────────────────────────────────────────────

/**
 * The exact canonical records one admit + recall flow produces, captured from
 * an in-memory run. Replaying these is a byte-identical retry of the SAME
 * operation, which is what idempotency is actually about — as distinct from
 * re-executing the operation against changed state.
 */
interface CapturedRecords {
  actor: ReturnType<typeof loadActor>;
  estate: ReturnType<typeof loadEstate>;
  keyring: ReturnType<typeof loadKeyring>;
  assertion: NonNullable<ReturnType<EstateStore['admit']>['assertion']>;
  transition: ReturnType<EstateStore['admit']>['transition'];
  transitionReceipt: ReturnType<EstateStore['admit']>['receipt'];
  auditEvents: ReturnType<StorageAdapter['listAuditEvents']>;
  recallReceipt: { receipt_id: string; estate_id: string; pack_hash: string } & Record<
    string,
    unknown
  >;
}

function captureAdmitRecords(text: string): CapturedRecords {
  const storage = new InMemoryStorage();
  const store = newStore(storage);
  const admit = store.admit(publicObservation(text), NOW);
  expect(admit.ok).toBe(true);
  const recall = executeRecall(store, publicRecallRequest(), NOW);
  expect(recall.ok).toBe(true);
  return {
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    assertion: admit.assertion!,
    transition: admit.transition,
    transitionReceipt: admit.receipt,
    // Only the admit's own audit event is replayed; the recall deny/emit events
    // are not part of this record set.
    auditEvents: storage.listAuditEvents(ESTATE_ID).filter((e) => e.event_type === 'assertion_admitted'),
    recallReceipt: recall.receipt! as unknown as CapturedRecords['recallReceipt'],
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
  storage.upsertRecallReceipt(captured.recallReceipt as never);
}

function newStore(storage: StorageAdapter): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    storage,
  });
}

function publicObservation(text: string) {
  return buildCandidate({
    assertion_class: 'observation',
    body: { text },
    privacy_scope: 'public',
    signer: SIGNERS.operator,
  });
}

function publicRecallRequest() {
  return buildRecallRequest({
    task: 'public discord',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    signer: SIGNERS.operator,
  });
}
