// Phase 24D — host scaffold hardening test pins.
//
// These tests cover the six non-blocking review concerns surfaced by the
// Phase 24C read-only review:
//
//   1. `checkSameTenant` rejects an empty `callerTenant`.
//   2. `checkSameTenant` rejects an empty resolver result.
//   3. Surface 4 refuses tenant-scoped parent provenance walks under
//      `public_discord` with `privacy_scope_refusal` (matching the
//      wedge's `privacy_tenant_in_public_frame` redaction discipline).
//   4. Surface 4 permits the same tenant-scoped parent walk under
//      `actor_private` where the walk would otherwise be valid.
//   5. Surface 6 appends an intake-deny log entry on cross-tenant target
//      refusal when an `intakeLog` dependency is provided.
//   6. Surface 6 remains backward compatible when no `intakeLog` is
//      supplied (Phase 24C call shape).
//   7. Unknown wedge exclusion reasons map to `excluded` as the
//      intentional safe default in Surface 3.
//
// Phase 24D adds NO new fixture, NO new wedge primitive, and edits NO
// existing Phase 24C source outside the six pinpointed concerns. It
// preserves the Phase 24C boundary (host barrel NOT re-exported through
// the wedge public API).

import { describe, expect, it } from 'vitest';

import { EstateStore } from '../src/straylight/index.js';
import {
  checkSameTenant,
  createInMemoryIntakeDenyLog,
  handleEstateSummary,
  handleExclusionDisplay,
  handleProvenanceWalk,
  type TenantResolver,
} from '../src/straylight/host/index.js';
import type { RecallPack } from '../src/straylight/index.js';
import {
  SIGNERS,
  buildSeededAssertion,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-15T12:00:00Z';

const tenantResolver: TenantResolver = (id) => {
  if (id.includes('satoshi-demo')) return 'satoshi-tenant';
  if (id.includes('alice')) return 'alice-tenant';
  return undefined;
};

const caller = {
  tenant_id: 'satoshi-tenant',
  actor_id: 'agent:satoshi-demo',
  session_id: 'sess:phase-24d',
};

function makeStore(): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
}

describe('phase-24d concern 1 — checkSameTenant rejects empty callerTenant', () => {
  it('returns tenant_unresolved when callerTenant is empty even if resolver matches', () => {
    // Resolver returns empty too — the caller-side empty must fail closed
    // BEFORE the resolver is consulted; the result must not collapse two
    // empties into a "match".
    const resolverReturningEmpty: TenantResolver = () => '';
    const r = checkSameTenant('', 'agent:anything', resolverReturningEmpty);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('tenant_unresolved');
  });

  it('returns tenant_unresolved when callerTenant is empty and resolver returns a real slug', () => {
    const r = checkSameTenant('', 'agent:satoshi-demo', tenantResolver);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('tenant_unresolved');
  });
});

describe('phase-24d concern 2 — checkSameTenant rejects empty resolver result', () => {
  it('returns tenant_unresolved when resolver returns the empty string', () => {
    const resolverReturningEmpty: TenantResolver = () => '';
    const r = checkSameTenant('satoshi-tenant', 'agent:satoshi-demo', resolverReturningEmpty);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('tenant_unresolved');
  });
});

describe('phase-24d concern 3 — Surface 4 refuses tenant-scoped parent under public_discord', () => {
  it('returns privacy_scope_refusal when parent is privacy_scope=tenant and caller frame is public_discord', () => {
    const store = makeStore();
    const tenantAssertion = buildSeededAssertion({
      status: 'active',
      assertion_class: 'observation',
      body: { text: 'phase-24d: tenant-scoped parent' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    });
    store.seedAssertion(tenantAssertion);

    const r = handleProvenanceWalk(
      store.storage,
      {
        assertion_id: tenantAssertion.assertion_id,
        detail_level: 'standard',
        caller: { ...caller, frame: 'public_discord' },
      },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('privacy_scope_refusal');
  });
});

describe('phase-24d concern 4 — Surface 4 permits tenant-scoped parent under actor_private', () => {
  it('walks the same tenant-scoped parent under caller frame=actor_private', () => {
    const store = makeStore();
    const tenantAssertion = buildSeededAssertion({
      status: 'active',
      assertion_class: 'observation',
      body: { text: 'phase-24d: tenant-scoped parent (actor_private frame)' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    });
    store.seedAssertion(tenantAssertion);

    const r = handleProvenanceWalk(
      store.storage,
      {
        assertion_id: tenantAssertion.assertion_id,
        detail_level: 'standard',
        caller: { ...caller, frame: 'actor_private' },
      },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('walked');
    if (r.outcome !== 'walked') return;
    expect(r.provenance.length).toBeGreaterThanOrEqual(1);
  });
});

describe('phase-24d concern 5 — Surface 6 appends intake-deny on cross-tenant refusal when intakeLog provided', () => {
  it('writes an entry on the CALLER tenant with reason cross_tenant_estate_summary', () => {
    const store = makeStore();
    const intakeLog = createInMemoryIntakeDenyLog();
    const callerFromAlice = {
      tenant_id: 'alice-tenant',
      actor_id: 'agent:alice-prod',
      session_id: 'sess:phase-24d-s6-log',
    };
    const r = handleEstateSummary(
      store.storage,
      {
        estate_id: store.getEstate().estate_id,
        detail_level: 'standard',
        caller: { ...callerFromAlice, frame: 'actor_private' },
      },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('cross_tenant_refused');

    const aliceEntries = intakeLog.listForTenant('alice-tenant');
    const satoshiEntries = intakeLog.listForTenant('satoshi-tenant');
    expect(aliceEntries.length).toBe(1);
    expect(satoshiEntries.length).toBe(0);
    expect(aliceEntries[0]!.reason).toBe('cross_tenant_estate_summary');
    expect(aliceEntries[0]!.target_estate_id).toBe(store.getEstate().estate_id);
    expect(aliceEntries[0]!.target_actor_id).toBe(store.getEstate().actor_id);
  });
});

describe('phase-24d concern 6 — Surface 6 remains backward compatible without intakeLog', () => {
  it('refuses cross-tenant without throwing and without an intake-deny entry', () => {
    const store = makeStore();
    const callerFromAlice = {
      tenant_id: 'alice-tenant',
      actor_id: 'agent:alice-prod',
      session_id: 'sess:phase-24d-s6-nolog',
    };
    // No `intakeLog` provided — Phase 24C call shape preserved.
    const r = handleEstateSummary(
      store.storage,
      {
        estate_id: store.getEstate().estate_id,
        detail_level: 'standard',
        caller: { ...callerFromAlice, frame: 'actor_private' },
      },
      { tenantResolver, now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('cross_tenant_refused');
  });
});

describe('phase-24d concern 7 — unknown wedge exclusion reason maps to excluded as safe default', () => {
  it('classifies a synthetic unknown wedge reason into category=excluded with raw_reason preserved', () => {
    // Build a hand-rolled minimal RecallPack whose excluded_summary carries
    // a reason the host classifier has never seen. The host MUST NOT
    // re-classify it into a narrower bucket; it MUST surface category
    // `excluded` and preserve the raw reason verbatim for trace.
    const pack: RecallPack = {
      recall_pack_id: 'rpack_phase-24d-synth',
      recall_request_id: 'rreq_phase-24d-synth',
      actor_id: 'agent:satoshi-demo',
      estate_id: 'estate:satoshi-demo',
      created_at: NOW,
      included: [],
      excluded_summary: [
        { reason: 'phase-24d-synthetic-unknown-wedge-reason', count: 1 },
      ],
      redacted: [],
      marked: [],
      receipt_id: 'rcpt_phase-24d-synth',
      pack_hash: 'sha256:phase-24d-synth-pack',
      policy_decision: {
        decision: 'allow',
        policy_id: 'pol_phase-24d-synth',
        policy_version: '0.0.0',
        signer_competence_result: {
          allowed: true,
          reason: 'phase-24d-synth',
        },
        reasons: [],
        decided_at: NOW,
      },
    };

    const r = handleExclusionDisplay({
      pack,
      detail_level: 'standard',
      caller,
    });
    expect(r.excluded_aggregates.length).toBe(1);
    expect(r.excluded_aggregates[0]!.category).toBe('excluded');
    expect(r.excluded_aggregates[0]!.raw_reason).toBe(
      'phase-24d-synthetic-unknown-wedge-reason',
    );
    expect(r.excluded_aggregates[0]!.count).toBe(1);
  });
});
