// Phase 24C — host validation vectors 1, 2, 3.
//
// Per docs/specs/dixie-recall-host-validation-vectors.md §"Vector matrix":
//
//   Vector 1 — Class-valid carrier, policy-allowed, included. Surface 1 served
//              + Surface 2 receipt retrieval + Surface 3 no exclusion.
//   Vector 2 — Class-valid carrier, policy-excluded. Surface 1 served (pack
//              has exclusion entry) + Surface 3 surfaces the exclusion under
//              the `excluded` category.
//   Vector 3 — Class-valid carrier, privacy-redacted in served frame.
//              actor_private parent + public_discord request frame →
//              wedge excludes; host surfaces the exclusion. Surface 4 with
//              caller.frame=public_discord refuses with privacy_scope_refusal.

import { describe, expect, it } from 'vitest';

import { EstateStore } from '../src/straylight/index.js';
import {
  createInMemoryIntakeDenyLog,
  handleExclusionDisplay,
  handleProvenanceWalk,
  handleReceiptRetrieval,
  handleRecallIntake,
  type TenantResolver,
} from '../src/straylight/host/index.js';
import {
  SIGNERS,
  buildRecallRequest,
  buildSeededAssertion,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-15T12:00:00Z';

// Explicit test resolver: maps ids containing `satoshi-demo` (the default
// fixture estate / actor) to `satoshi-tenant`. Unknown ids resolve to
// `undefined` so the host fails closed under ambiguity.
const tenantResolver: TenantResolver = (id) => {
  if (id.includes('satoshi-demo')) return 'satoshi-tenant';
  if (id.includes('alice')) return 'alice-tenant';
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

describe('phase-24c vector 1 — class-valid, policy-allowed, included', () => {
  it('Surface 1 serves the pack; Surface 2 finds the receipt; Surface 3 has no exclusion', () => {
    const store = makeStore();
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'observation',
        body: { text: 'vector-1: public observation' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );

    const request = buildRecallRequest({
      task: 'vector-1-intake',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      requested_classes: ['observation'],
      signer: SIGNERS.operator,
    });

    const intakeLog = createInMemoryIntakeDenyLog();
    const r1 = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver, intakeLog, now: NOW },
    );

    expect(r1.outcome).toBe('served');
    if (r1.outcome !== 'served') return;
    expect(r1.pack.included.length).toBeGreaterThanOrEqual(1);
    expect(r1.receipt.receipt_id).toBeDefined();
    expect(r1.receipt.detail_level).toBe('standard');

    // Surface 2 — receipt retrieval over the wedge's persisted receipt.
    const r2 = handleReceiptRetrieval(
      store.storage,
      { receipt_id: r1.receipt.receipt_id, detail_level: 'standard', caller },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r2.outcome).toBe('found');
    if (r2.outcome !== 'found') return;
    expect(r2.receipt.receipt_id).toBe(r1.receipt.receipt_id);

    // Surface 3 — exclusion display on the served pack.
    const r3 = handleExclusionDisplay({
      pack: r1.pack,
      detail_level: 'standard',
      caller,
    });
    expect(r3.excluded_aggregates).toEqual([]);
    expect(r3.redacted_aggregates).toEqual([]);
    expect(r3.marked).toEqual([]);

    // No intake-deny entry emitted on the happy path.
    expect(intakeLog.list()).toEqual([]);
  });
});

describe('phase-24c vector 2 — class-valid, policy-excluded', () => {
  it('Surface 1 served; Surface 3 surfaces exclusion category=excluded', () => {
    const store = makeStore();
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'observation',
        body: { text: 'vector-2: public observation excluded by class filter' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );
    // Also seed a different-class assertion so the pack is not empty by
    // pure class filtering — vector 2 is about an exclusion entry, not a
    // wholesale denial.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'preference',
        body: { text: 'vector-2: preference included' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );

    const request = buildRecallRequest({
      task: 'vector-2-intake',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      // Exclude observations — the wedge's dispositionFor will record an
      // entry under reason `class_excluded:observation`.
      excluded_classes: ['observation'],
      signer: SIGNERS.operator,
    });

    const intakeLog = createInMemoryIntakeDenyLog();
    const r1 = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r1.outcome).toBe('served');
    if (r1.outcome !== 'served') return;

    const r3 = handleExclusionDisplay({
      pack: r1.pack,
      detail_level: 'standard',
      caller,
    });
    const excludedReasons = r3.excluded_aggregates.map((a) => a.raw_reason);
    expect(excludedReasons).toContain('class_excluded:observation');
    const categories = r3.excluded_aggregates.map((a) => a.category);
    expect(categories).toContain('excluded');
  });
});

describe('phase-24c vector 3 — privacy-redacted/excluded in served frame', () => {
  it('actor_private parent excluded from public_discord; Surface 4 refuses provenance walk', () => {
    const store = makeStore();
    const seeded = buildSeededAssertion({
      status: 'active',
      assertion_class: 'relationship',
      body: { subject: 'user:bob', relation: 'vector-3: private fact' },
      privacy_scope: 'actor_private',
      risk_level: 'low',
      signer: SIGNERS.operator,
    });
    store.seedAssertion(seeded);
    // Tenant-scoped assertion so we also exercise the wedge's
    // "redact in public frame" path.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'observation',
        body: { text: 'vector-3: tenant observation' },
        privacy_scope: 'tenant',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );

    const request = buildRecallRequest({
      task: 'vector-3-intake',
      environment_frame: 'public_discord',
      risk_profile: 'low',
      signer: SIGNERS.operator,
    });

    const intakeLog = createInMemoryIntakeDenyLog();
    const r1 = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r1.outcome).toBe('served');
    if (r1.outcome !== 'served') return;

    const r3 = handleExclusionDisplay({
      pack: r1.pack,
      detail_level: 'standard',
      caller,
    });
    const excludedRaw = r3.excluded_aggregates.map((a) => a.raw_reason);
    expect(excludedRaw).toContain('privacy_actor_private_in_public_frame');
    const redactedRaw = r3.redacted_aggregates.map((a) => a.raw_reason);
    expect(redactedRaw).toContain('privacy_tenant_in_public_frame');

    // Surface 4 — provenance walk with caller.frame=public_discord on an
    // actor_private parent refuses.
    const r4 = handleProvenanceWalk(
      store.storage,
      {
        assertion_id: store.listAssertions().find((a) => a.privacy_scope === 'actor_private')!.assertion_id,
        detail_level: 'standard',
        caller: { ...caller, frame: 'public_discord' },
      },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r4.outcome).toBe('refused');
    if (r4.outcome !== 'refused') return;
    expect(r4.reason).toBe('privacy_scope_refusal');

    // Surface 4 — actor_private parent + caller.frame=actor_private is permitted.
    const r4b = handleProvenanceWalk(
      store.storage,
      {
        assertion_id: store.listAssertions().find((a) => a.privacy_scope === 'actor_private')!.assertion_id,
        detail_level: 'standard',
        caller: { ...caller, frame: 'actor_private' },
      },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r4b.outcome).toBe('walked');
  });
});
