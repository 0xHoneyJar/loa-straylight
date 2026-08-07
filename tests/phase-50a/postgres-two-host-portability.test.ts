// Phase 50A — export, restore into a SECOND host, and provider replacement.
//
// ADR-049Q §13.1(e), (i); §11.4, §11.7; P-4, P-6, P-7, P-8.
//
// The proof shape:
//
//   1. populate the SOURCE host with a real governed flow;
//   2. prove source and replacement are genuinely DIFFERENT PostgreSQL server
//      instances (distinct cluster system identifiers);
//   3. export with ordinary `pg_dump` (plain SQL, no bespoke format);
//   4. restore into the REPLACEMENT host with ordinary `psql`;
//   5. compare canonical state byte-for-byte;
//   6. verify every per-estate audit chain IDENTICALLY on the replacement;
//   7. cold-load the estate on the replacement and execute a governed recall;
//   8. continue writing on the replacement — the chain extends from the
//      restored tail, which is what makes replacement a live capability rather
//      than a read-only archive.

import { beforeAll, describe, expect, it } from 'vitest';

import {
  EstateStore,
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
  assertEstateServiceable,
  assertRestoreServiceable,
  compareSnapshots,
  readStoreSnapshot,
  snapshotDigest,
  verifyChains,
} from '../../src/straylight/storage/postgres/index.js';
import {
  clusterSystemIdentifier,
  pgDump,
  psqlRestore,
  type PgToolTarget,
} from '../../scripts/phase-50a/pg-tools.js';
import {
  assertDistinctHosts,
  databaseNameOf,
  openScratchDatabase,
  openUnmigratedDatabase,
  phase50aEnabled,
  phase50aGateReport,
  replacementHost,
  requireReachable,
  sourceHost,
} from './_support.js';
// `toolTargetOf` comes straight from the descriptor module: `_support.ts` is
// outside this packet's allowed paths, so it cannot re-export it, and importing
// it here keeps the SINGLE SOURCE of container/user/database intact (F-10).
import {
  declareScratchDatabase,
  toolTargetOf,
  type ProofHost,
} from '../../scripts/phase-50a/hosts.js';
import {
  provedNoDestructiveSql,
  recordedStatements,
  recordedStatementsAreReadOnly,
  resetRecordedStatements,
  verifyExistingRestore,
} from '../../scripts/phase-50a/verify-existing-restore.js';

const NOW = '2026-05-05T12:00:00Z';
const ESTATE_ID = loadEstate().estate_id;

/**
 * The tool target for one of THIS suite's scratch databases.
 *
 * ── THE GATED ISSUANCE ROUTE (sequence-89 audit, F-10) ────────────────────
 *
 * `toolTargetOf(host, name)` used to accept any name and register it as an
 * ISSUED (therefore authorized) target, so an arbitrary database could reach
 * `pg_dump`, `psql` and the destructive paths. A database other than the
 * descriptor's own must now be MINTED for that descriptor first.
 *
 * These scratch databases are legitimately ours — `_support.ts#openScratchDatabase`
 * created them inside the fixed instance, with its own `p50a_` naming — so this
 * helper declares the name against the same descriptor and then issues the
 * target from it. Container and user still come only from the descriptor.
 */
function scratchToolTarget(host: ProofHost, connectionString: string): PgToolTarget {
  const database = declareScratchDatabase(host, databaseNameOf(connectionString));
  return toolTargetOf(host, database);
}

phase50aGateReport('postgres-two-host-portability');

const maybe = phase50aEnabled() ? describe : describe.skip;

maybe('Phase 50A portability — export from source, restore into a different host', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
    await requireReachable(replacementHost());
    assertDistinctHosts(sourceHost(), replacementHost());
  }, 90_000);

  it('source and replacement are genuinely different PostgreSQL server instances', () => {
    // Distinct cluster system identifiers: two separately initialized servers.
    // One server addressed twice — or one database renamed — would produce the
    // same identifier, and the packet forbids substituting that for the proof.
    // Targets DERIVED from the shared fixed descriptors, never restated: the
    // container, user and database all come from `hosts.ts` (F-10).
    const sourceId = clusterSystemIdentifier(toolTargetOf(sourceHost()));
    const replacementId = clusterSystemIdentifier(toolTargetOf(replacementHost()));
    expect(sourceId).toMatch(/^\d+$/);
    expect(replacementId).toMatch(/^\d+$/);
    expect(sourceId).not.toBe(replacementId);
  });

  it(
    'a populated estate exports, restores into the replacement host, compares equal, verifies identically, cold-loads, recalls, and keeps writing',
    async () => {
      const source = await openScratchDatabase(sourceHost(), 'portability-src');
      // The restore target must NOT be pre-migrated: the dump carries the
      // schema, which is what proves the export is self-sufficient.
      const target = await openUnmigratedDatabase(replacementHost(), 'portability-dst');
      try {
        // ── 1. populate the source with a real governed flow ──────────────
        const seeded = await source.host.withEstateSession(ESTATE_ID, (storage) => {
          const store = newStore(storage);
          const first = store.admit(observation('portable one'), NOW);
          const second = store.admit(observation('portable two'), NOW);
          const recall = executeRecall(store, publicRecallRequest(), NOW);
          expect(first.ok).toBe(true);
          expect(second.ok).toBe(true);
          expect(recall.ok).toBe(true);
          return {
            assertionIds: [first.assertion!.assertion_id, second.assertion!.assertion_id],
            recallReceiptId: recall.receipt!.receipt_id,
            tail: storage.getAuditTail(ESTATE_ID),
            // Observed, not assumed: two admits plus a governed recall emit
            // more than three audit events (the recall records its own), so the
            // continuity assertions below are anchored to what the flow
            // actually produced rather than to a hand-counted guess.
            auditLength: storage.listAuditEvents(ESTATE_ID).length,
          };
        });
        expect(seeded.committed).toBe(true);
        expect(seeded.value.tail).toBeDefined();
        expect(seeded.value.auditLength).toBeGreaterThanOrEqual(3);

        // Same fixed descriptors, scoped to this test's scratch databases
        // INSIDE those same instances. Container and user are never restated.
        const sourceTarget: PgToolTarget = scratchToolTarget(
          sourceHost(),
          source.connectionString,
        );
        const replacementTarget: PgToolTarget = scratchToolTarget(
          replacementHost(),
          target.connectionString,
        );

        // ── 2. ordinary export ────────────────────────────────────────────
        const dump = pgDump(sourceTarget);
        expect(dump.sql.length).toBeGreaterThan(0);
        // A plain-SQL dump: readable, tool-agnostic, no proprietary container.
        expect(dump.sql).toContain('CREATE TABLE');
        expect(dump.sql).toContain('audit_events');
        // And it carries no provider-specific concept.
        expect(/CREATE\s+EXTENSION/i.test(dump.sql)).toBe(false);

        // ── 3. ordinary restore into the OTHER host ───────────────────────
        psqlRestore(replacementTarget, dump.sql);

        // ── 4. canonical state compares EQUAL ─────────────────────────────
        const sourceSnapshot = await source.host.withClient(readStoreSnapshot);
        const targetSnapshot = await target.host.withClient(readStoreSnapshot);
        const comparison = compareSnapshots(sourceSnapshot, targetSnapshot);
        expect(comparison.differences).toEqual([]);
        expect(comparison.equal).toBe(true);
        expect(snapshotDigest(targetSnapshot)).toBe(snapshotDigest(sourceSnapshot));

        // ── 5. the chain verifies IDENTICALLY on the replacement ──────────
        const sourceChains = verifyChains(sourceSnapshot);
        const targetChains = verifyChains(targetSnapshot);
        expect(targetChains).toEqual(sourceChains);
        expect(targetChains.every((c) => c.ok)).toBe(true);
        expect(targetChains.find((c) => c.estate_id === ESTATE_ID)?.tail).toBe(
          seeded.value.tail,
        );
        // The restore is serviceable, by the fail-closed gate.
        const verification = assertRestoreServiceable(sourceSnapshot, targetSnapshot);
        expect(verification.ok).toBe(true);
        expect(verification.quarantinedEstates).toEqual([]);
        expect(() => assertEstateServiceable(targetSnapshot, ESTATE_ID)).not.toThrow();

        // ── 6. cold-load on the replacement and execute a governed recall ──
        const restored = await target.host.withEstateSession(ESTATE_ID, (storage) => {
          const store = EstateStore.fromStorage(storage, ESTATE_ID);
          expect(store).toBeDefined();
          const recall = executeRecall(store!, publicRecallRequest(), NOW);
          return {
            recallOk: recall.ok,
            included: recall.pack?.included.length ?? 0,
            chainOk: store!.auditLog.verifyChain(ESTATE_ID).ok,
            assertionIds: storage.listAssertions(ESTATE_ID).map((a) => a.assertion_id).sort(),
            transitions: storage.listTransitions(ESTATE_ID).length,
            transitionReceipts: storage.listTransitionReceipts(ESTATE_ID).length,
            recallReceipt: storage.getRecallReceipt(seeded.value.recallReceiptId),
            tail: storage.getAuditTail(ESTATE_ID),
            // The governed recall above is itself a durable write on the
            // REPLACEMENT host, so it is the first new link after the restore.
            // Capturing the whole chain lets the next assertion prove that new
            // link attaches to the RESTORED tail — continuity of custody across
            // the host move (P-4), demonstrated by the first post-restore write
            // rather than asserted.
            auditEvents: storage.listAuditEvents(ESTATE_ID),
          };
        });
        expect(restored.value.recallOk).toBe(true);
        expect(restored.value.included).toBe(2);
        expect(restored.value.chainOk).toBe(true);
        expect(restored.value.assertionIds).toEqual([...seeded.value.assertionIds].sort());
        expect(restored.value.transitions).toBe(2);
        expect(restored.value.transitionReceipts).toBe(2);
        expect(restored.value.recallReceipt).toBeDefined();
        // Semantics unchanged: the restored recall receipt is byte-identical.
        expect(restored.value.recallReceipt?.receipt_id).toBe(seeded.value.recallReceiptId);

        // The restored prefix is EXACTLY the source's chain, and the recall's
        // own audit link is appended onto the restored tail. This is the
        // continuity-of-custody proof (P-4): the first write after a host move
        // attaches to the tail that moved.
        const restoredChain = restored.value.auditEvents;
        expect(restoredChain.length).toBe(seeded.value.auditLength + 1);
        expect(restoredChain[seeded.value.auditLength - 1]?.audit_hash).toBe(seeded.value.tail);
        expect(restoredChain[seeded.value.auditLength]?.previous_audit_hash).toBe(
          seeded.value.tail,
        );

        // ── 7. replacement stays LIVE: writes keep extending the chain, so the
        //       new host is a working store, not a read-only archive ─────────
        const continued = await target.host.withEstateSession(ESTATE_ID, (storage) => {
          const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
          const out = store.admit(observation('written on the replacement'), NOW);
          expect(out.ok).toBe(true);
          const audit = storage.listAuditEvents(ESTATE_ID);
          return {
            length: audit.length,
            newestParent: audit[audit.length - 1]?.previous_audit_hash,
            chainOk: store.auditLog.verifyChain(ESTATE_ID).ok,
          };
        });
        expect(continued.committed).toBe(true);
        // One more link than the post-restore state (which already included the
        // recall's link), attaching to the tail that state ended on.
        expect(continued.value.length).toBe(restoredChain.length + 1);
        expect(continued.value.newestParent).toBe(restored.value.tail);
        expect(continued.value.chainOk).toBe(true);

        // The source is untouched by the replacement's write: the two hosts are
        // genuinely independent.
        const sourceAfter = await source.host.withEstateSession(ESTATE_ID, (storage) => ({
          audit: storage.listAuditEvents(ESTATE_ID).length,
          tail: storage.getAuditTail(ESTATE_ID),
        }));
        expect(sourceAfter.value.audit).toBe(seeded.value.auditLength);
        expect(sourceAfter.value.tail).toBe(seeded.value.tail);
      } finally {
        await target.dispose();
        await source.dispose();
      }
    },
    120_000,
  );

  it(
    'F-14: the NON-DESTRUCTIVE verifier reports agreement, detects a real divergence, and erases nothing',
    async () => {
      // The F-14 proof against LIVE data. `safety-authority-closure.test.ts`
      // proves the verifier issues no destructive statement and that its
      // comparison is not vacuous; this proves the same properties end to end on
      // two real estates — including that the ROW COUNTS ARE UNCHANGED after
      // verification, which is the only way to show nothing was erased.
      const source = await openScratchDatabase(sourceHost(), 'verify-src');
      const target = await openUnmigratedDatabase(replacementHost(), 'verify-dst');
      try {
        await source.host.withEstateSession(ESTATE_ID, (storage) => {
          const store = newStore(storage);
          expect(store.admit(observation('verify one'), NOW).ok).toBe(true);
          expect(store.admit(observation('verify two'), NOW).ok).toBe(true);
        });

        const dump = pgDump(scratchToolTarget(sourceHost(), source.connectionString));
        psqlRestore(
          scratchToolTarget(replacementHost(), target.connectionString),
          dump.sql,
        );

        // ── AGREEING CASE ────────────────────────────────────────────────
        resetRecordedStatements();
        const agreeing = await verifyExistingRestore(
          source.connectionString,
          target.connectionString,
        );
        expect(agreeing.differences).toEqual([]);
        expect(agreeing.brokenChains).toEqual([]);
        expect(agreeing.ok).toBe(true);
        // Redacted target descriptions — the harness password must not appear in
        // a report an operator is invited to paste into an escalation.
        expect(agreeing.source.target).toContain('<redacted>');
        expect(agreeing.target.target).toContain('<redacted>');
        // OBSERVED AT EXECUTION: the record comes from the wrapped
        // `client.query`, so these are statements the verifier ACTUALLY issued
        // — not a description it wrote about itself (sequence-89 F-14).
        const agreeingStatements = recordedStatements();
        expect(agreeingStatements.length).toBeGreaterThan(0);
        expect(recordedStatementsAreReadOnly(), `recorded: ${agreeingStatements.join(' | ')}`).toBe(
          true,
        );
        // The NON-VACUOUS proof: evidence exists AND none of it is destructive.
        // An empty record would fail this, which is the whole point.
        expect(provedNoDestructiveSql(), `recorded: ${agreeingStatements.join(' | ')}`).toBe(true);
        // Every observed statement is a real SQL text, and they are SELECTs.
        for (const statement of agreeingStatements) {
          expect(typeof statement).toBe('string');
          expect(statement).not.toContain('UNRECOGNIZED QUERY SHAPE');
        }
        expect(
          agreeingStatements.some((s) => /\bSELECT\b/i.test(s)),
          'no observed statement was a SELECT — the seam did not observe the reads',
        ).toBe(true);

        // NOTHING WAS ERASED: both estates still hold what they held.
        const countsAfter = await source.host.withEstateSession(ESTATE_ID, (storage) => ({
          assertions: storage.listAssertions(ESTATE_ID).length,
          audit: storage.listAuditEvents(ESTATE_ID).length,
        }));
        expect(countsAfter.value.assertions).toBe(2);
        expect(agreeing.source.counts['assertions']).toBe(2);
        expect(agreeing.target.counts['assertions']).toBe(2);

        // ── MISMATCHING CASE ─────────────────────────────────────────────
        // The target diverges by a genuine write, so the verifier must REPORT a
        // mismatch rather than pass. (Written through the store, not by erasing
        // anything: divergence is created by ADDING, never by deleting.)
        await target.host.withEstateSession(ESTATE_ID, (storage) => {
          const store = EstateStore.fromStorage(storage, ESTATE_ID)!;
          expect(store.admit(observation('divergence on the target only'), NOW).ok).toBe(true);
        });

        resetRecordedStatements();
        const mismatching = await verifyExistingRestore(
          source.connectionString,
          target.connectionString,
        );
        expect(mismatching.ok, 'a divergent target must NOT be reported as agreement').toBe(false);
        expect(mismatching.differences.length).toBeGreaterThan(0);
        expect(mismatching.differences.join(' ')).toMatch(/digest|assertions|audit/i);
        // A divergence is not a BROKEN chain — both chains still verify — so the
        // two verdicts stay distinguishable.
        expect(mismatching.brokenChains).toEqual([]);
        // OBSERVED: still only reads, on the mismatching path too — and proven
        // non-vacuously, from statements the verifier actually issued.
        expect(recordedStatementsAreReadOnly()).toBe(true);
        expect(
          provedNoDestructiveSql(),
          `mismatch path recorded: ${recordedStatements().join(' | ')}`,
        ).toBe(true);

        // And STILL nothing erased: the source is exactly as it was.
        const sourceUntouched = await source.host.withEstateSession(ESTATE_ID, (storage) => ({
          assertions: storage.listAssertions(ESTATE_ID).length,
        }));
        expect(sourceUntouched.value.assertions).toBe(2);
      } finally {
        await target.dispose();
        await source.dispose();
      }
    },
    120_000,
  );

  it('a multi-estate store restores with every chain intact and no cross-estate leakage', async () => {
    const source = await openScratchDatabase(sourceHost(), 'portability-multi-src');
    const target = await openUnmigratedDatabase(replacementHost(), 'portability-multi-dst');
    try {
      const estates = ['estate:p50a-alpha', 'estate:p50a-beta', 'estate:p50a-gamma'];
      const tails: Record<string, string | undefined> = {};
      for (const [index, estate] of estates.entries()) {
        const written = await source.host.withEstateSession(estate, (storage) => {
          const store = storeFor(storage, estate, index);
          for (let n = 0; n <= index; n++) {
            const out = store.admit(observationFor(estate, index, `item ${n}`), NOW);
            expect(out.ok).toBe(true);
          }
          return storage.getAuditTail(estate);
        });
        tails[estate] = written.value;
      }

      const dump = pgDump(scratchToolTarget(sourceHost(), source.connectionString));
      psqlRestore(
        scratchToolTarget(replacementHost(), target.connectionString),
        dump.sql,
      );

      const sourceSnapshot = await source.host.withClient(readStoreSnapshot);
      const targetSnapshot = await target.host.withClient(readStoreSnapshot);
      expect(compareSnapshots(sourceSnapshot, targetSnapshot).equal).toBe(true);

      const chains = verifyChains(targetSnapshot);
      expect(chains.map((c) => c.estate_id)).toEqual([...estates].sort());
      expect(chains.every((c) => c.ok)).toBe(true);
      // Chain LENGTHS are preserved per estate: 1, 2, 3.
      for (const [index, estate] of estates.entries()) {
        const chain = chains.find((c) => c.estate_id === estate);
        expect(chain?.length, `${estate} chain length`).toBe(index + 1);
        expect(chain?.tail, `${estate} tail`).toBe(tails[estate]);
      }

      // Each restored estate is independently serviceable and sees only itself.
      for (const estate of estates) {
        expect(() => assertEstateServiceable(targetSnapshot, estate)).not.toThrow();
        const read = await target.host.withEstateSession(estate, (storage) => ({
          own: storage.listAssertions(estate).length,
          others: estates
            .filter((e) => e !== estate)
            .map((e) => storage.listAssertions(e).length),
          globalAudit: storage.listAuditEvents().length,
          scopedAudit: storage.listAuditEvents(estate).length,
        }));
        expect(read.value.others.every((n) => n === 0), `${estate} sees no foreign rows`).toBe(
          true,
        );
        expect(read.value.globalAudit).toBe(read.value.scopedAudit);
      }
    } finally {
      await target.dispose();
      await source.dispose();
    }
  }, 120_000);

  it('the restored replacement enforces immutability just as the source does', async () => {
    const source = await openScratchDatabase(sourceHost(), 'portability-immut-src');
    const target = await openUnmigratedDatabase(replacementHost(), 'portability-immut-dst');
    try {
      await source.host.withEstateSession(ESTATE_ID, (storage) => {
        newStore(storage).admit(observation('immutable after restore'), NOW);
      });
      const dump = pgDump(scratchToolTarget(sourceHost(), source.connectionString));
      psqlRestore(
        scratchToolTarget(replacementHost(), target.connectionString),
        dump.sql,
      );

      // The dump carries the triggers, so append-only enforcement survives the
      // move. Without this, a restored store would silently lose the strongest
      // guarantee it had.
      await expect(
        target.host.withClient(async (client) => {
          await client.query(`UPDATE audit_events SET audit_hash = 'sha256:tampered'`);
        }),
      ).rejects.toThrow(/append-only table/);
      await expect(
        target.host.withClient(async (client) => {
          await client.query('DELETE FROM estate_transitions');
        }),
      ).rejects.toThrow(/append-only table/);

      const read = await target.host.withEstateSession(ESTATE_ID, (storage) => ({
        audit: storage.listAuditEvents(ESTATE_ID).length,
        chainOk: EstateStore.fromStorage(storage, ESTATE_ID)!.auditLog.verifyChain(ESTATE_ID).ok,
      }));
      expect(read.value).toEqual({ audit: 1, chainOk: true });
    } finally {
      await target.dispose();
      await source.dispose();
    }
  }, 120_000);
});

// ── helpers ─────────────────────────────────────────────────────────────

function newStore(storage: StorageAdapter): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    storage,
  });
}

function storeFor(storage: StorageAdapter, estate_id: string, index: number): EstateStore {
  const actor = {
    ...loadActor(),
    actor_id: `actor:p50a-${index}`,
    estate_id,
    keyring_id: `keyring:p50a-${index}`,
  };
  const keyring = {
    ...loadKeyring(),
    keyring_id: actor.keyring_id,
    actor_id: actor.actor_id,
    estate_id,
  };
  const estate = {
    ...loadEstate(),
    estate_id,
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

function observationFor(estate_id: string, index: number, text: string) {
  return buildCandidate({
    estate_id,
    actor_id: `actor:p50a-${index}`,
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
