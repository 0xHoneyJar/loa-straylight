// Phase 24C — host validation vectors 4, 5, 6.
//
//   Vector 4 — Contested assertion marked. Wedge marks; host renders marked
//              under category=`challenged`.
//   Vector 5 — Revoked assertion excluded. Wedge excludes with reason
//              `status_revoked`; host classifies as category=`revoked`.
//   Vector 6 — Forgotten assertion excluded but auditable. Wedge excludes
//              (outside audit_review frame); audit chain records the forget
//              event; Surface 5 surfaces it under verifyChain=ok.

import { describe, expect, it } from 'vitest';

import { EstateStore } from '../src/straylight/index.js';
import {
  createInMemoryIntakeDenyLog,
  handleAuditChainLookup,
  handleExclusionDisplay,
  handleRecallIntake,
  type TenantResolver,
} from '../src/straylight/host/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  buildSeededAssertion,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-15T12:00:00Z';

const tenantResolver: TenantResolver = (id) => {
  if (id.includes('satoshi-demo')) return 'satoshi-tenant';
  return undefined;
};

const caller = {
  tenant_id: 'satoshi-tenant',
  actor_id: 'agent:satoshi-demo',
  session_id: 'sess:test',
};

function makeStore(): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
}

describe('phase-24c vector 4 — contested assertion marked', () => {
  it('Surface 1 served; Surface 3 marked[] surfaces category=challenged', () => {
    const store = makeStore();
    store.seedAssertion(
      buildSeededAssertion({
        status: 'contested',
        assertion_class: 'observation',
        body: { text: 'vector-4: contested observation' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );

    const request = buildRecallRequest({
      task: 'vector-4-intake',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      requested_classes: ['observation'],
      include_statuses: ['active', 'contested'],
      signer: SIGNERS.operator,
    });

    const r1 = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r1.outcome).toBe('served');
    if (r1.outcome !== 'served') return;
    expect(r1.pack.marked.length).toBeGreaterThanOrEqual(1);

    const r3 = handleExclusionDisplay({
      pack: r1.pack,
      detail_level: 'standard',
      caller,
    });
    expect(r3.marked.length).toBeGreaterThanOrEqual(1);
    const challenged = r3.marked.find((m) => m.category === 'challenged');
    expect(challenged).toBeDefined();
    expect(challenged?.status).toBe('contested');
  });
});

describe('phase-24c vector 5 — revoked assertion excluded', () => {
  it('Surface 3 surfaces exclusion category=revoked', () => {
    const store = makeStore();
    store.seedAssertion(
      buildSeededAssertion({
        status: 'revoked',
        assertion_class: 'observation',
        body: { text: 'vector-5: revoked observation' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );
    // Keep one active so the pack is served (recall over an empty estate
    // still works, but vector 5 is about an exclusion entry, not a
    // wholesale denial).
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'preference',
        body: { text: 'vector-5: active preference' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );

    const request = buildRecallRequest({
      task: 'vector-5-intake',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      signer: SIGNERS.operator,
    });

    const r1 = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r1.outcome).toBe('served');
    if (r1.outcome !== 'served') return;

    const r3 = handleExclusionDisplay({
      pack: r1.pack,
      detail_level: 'standard',
      caller,
    });
    const revokedAggregate = r3.excluded_aggregates.find((a) => a.category === 'revoked');
    expect(revokedAggregate).toBeDefined();
    expect(revokedAggregate?.raw_reason).toBe('status_revoked');
    expect(revokedAggregate?.count).toBeGreaterThanOrEqual(1);
  });
});

describe('phase-24c vector 6 — forgotten assertion excluded but auditable', () => {
  it('Surface 3 excludes; Surface 5 verifies chain and surfaces the forget audit event', () => {
    const store = makeStore();

    // Admit an assertion, then forget it. Both transitions write audit
    // events that we later inspect via Surface 5.
    const admit = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'vector-6: will be forgotten' },
        privacy_scope: 'tenant',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(admit.ok).toBe(true);

    const forget = store.forget({
      target_assertion_id: admit.assertion!.assertion_id,
      reason: 'vector-6 operator request',
      signatures: [
        buildCandidate({
          assertion_class: 'observation',
          body: { text: 'forget request' },
          signer: SIGNERS.reviewer,
        }).signatures[0]!,
      ],
      now: NOW,
    });
    expect(forget.ok).toBe(true);

    // Ordinary (non-audit_review) recall excludes the forgotten assertion.
    const request = buildRecallRequest({
      task: 'vector-6-intake',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      requested_classes: ['observation'],
      signer: SIGNERS.operator,
    });
    const r1 = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r1.outcome).toBe('served');
    if (r1.outcome !== 'served') return;

    const r3 = handleExclusionDisplay({
      pack: r1.pack,
      detail_level: 'standard',
      caller,
    });
    const forgottenAggregate = r3.excluded_aggregates.find(
      (a) => a.raw_reason === 'status_forgotten_from_recall',
    );
    expect(forgottenAggregate).toBeDefined();
    expect(forgottenAggregate?.category).toBe('excluded');

    // Surface 5 — audit chain verifies clean and contains the forget event.
    const r5 = handleAuditChainLookup(
      store.auditLog,
      store.storage,
      { estate_id: store.getEstate().estate_id, detail_level: 'standard', caller },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r5.outcome).toBe('verified');
    if (r5.outcome !== 'verified') return;
    const eventTypes = r5.events.map((e) => e.event_type);
    expect(eventTypes).toContain('assertion_forgotten_from_recall');
    expect(eventTypes).toContain('recall_pack_emitted');
    expect(r5.chain_status).toBe('ok');
  });
});
