// Phase 24C — host-layer fail-closed invariants.
//
// Per docs/specs/dixie-recall-host-mvp-contract.md §"Host invariants" and
// §Surface 1–6 fail-closed postures, plus Phase 24C adjustment §7. The
// host MUST fail closed on:
//   * unknown receipt
//   * unknown estate
//   * unknown assertion
//   * storage exception (host catches and surfaces typed reason)
//   * tenant unresolved (resolver returns undefined)
//   * frame outside the host's 2-value enum (Surfaces 4, 6)
//   * private parent + public_discord caller frame (Surface 4)
//   * audit-chain break (Surface 5 — surfaces break index + reason)
//   * host never synthesizes RecallPack / RecallReceipt / provenance /
//     audit-event / assertion content.

import { describe, expect, it } from 'vitest';

import { AuditLog, EstateStore } from '../src/straylight/index.js';
import type { AuditEvent } from '../src/straylight/index.js';
import type { StorageAdapter } from '../src/straylight/storage/types.js';
import {
  createInMemoryIntakeDenyLog,
  handleAuditChainLookup,
  handleEstateSummary,
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

describe('phase-24c fail-closed — unknown ids', () => {
  it('Surface 2 returns unknown_receipt_id for a missing receipt', () => {
    const store = makeStore();
    const r = handleReceiptRetrieval(
      store.storage,
      { receipt_id: 'rcpt_does-not-exist', detail_level: 'standard', caller },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('not_found');
    if (r.outcome !== 'not_found') return;
    expect(r.reason).toBe('unknown_receipt_id');
  });

  it('Surface 4 returns unknown_assertion for a missing assertion', () => {
    const store = makeStore();
    const r = handleProvenanceWalk(
      store.storage,
      {
        assertion_id: 'asrt_does-not-exist',
        detail_level: 'standard',
        caller: { ...caller, frame: 'actor_private' },
      },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('unknown_assertion');
  });

  it('Surface 5 returns unknown_estate for a missing estate', () => {
    const store = makeStore();
    const r = handleAuditChainLookup(
      store.auditLog,
      store.storage,
      { estate_id: 'estate:does-not-exist', detail_level: 'standard', caller },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('unknown_estate');
  });

  it('Surface 6 returns unknown_estate for a missing estate', () => {
    const store = makeStore();
    const r = handleEstateSummary(
      store.storage,
      {
        estate_id: 'estate:does-not-exist',
        detail_level: 'standard',
        caller: { ...caller, frame: 'actor_private' },
      },
      { tenantResolver, now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('unknown_estate');
  });
});

describe('phase-24c fail-closed — tenant resolution failures', () => {
  // Resolver that always returns undefined → tenant_resolution_failed everywhere.
  const unresolvedResolver: TenantResolver = () => undefined;

  it('Surface 1 denies with tenant_resolution_failed and writes intake-deny entry', () => {
    const store = makeStore();
    const request = buildRecallRequest({
      task: 'fail-closed-tenant',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      signer: SIGNERS.operator,
    });
    const intakeLog = createInMemoryIntakeDenyLog();
    const r = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver: unresolvedResolver, intakeLog, now: NOW },
    );
    expect(r.outcome).toBe('denied');
    if (r.outcome !== 'denied') return;
    expect(r.reason).toBe('tenant_resolution_failed');
    expect(intakeLog.list().length).toBe(1);
  });

  it('Surface 5 refuses with tenant_resolution_failed', () => {
    const store = makeStore();
    const r = handleAuditChainLookup(
      store.auditLog,
      store.storage,
      { estate_id: store.getEstate().estate_id, detail_level: 'standard', caller },
      { tenantResolver: unresolvedResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('tenant_resolution_failed');
  });
});

describe('phase-24c fail-closed — frame_unsupported on Surfaces 4 and 6', () => {
  it('Surface 4 refuses an out-of-enum frame', () => {
    const store = makeStore();
    const a = buildSeededAssertion({
      status: 'active',
      assertion_class: 'observation',
      body: { text: 'fail-closed: frame' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    });
    store.seedAssertion(a);
    const r = handleProvenanceWalk(
      store.storage,
      {
        assertion_id: a.assertion_id,
        detail_level: 'standard',
        // Out-of-enum frame; cast simulates a misuse from a future BFF.
        caller: { ...caller, frame: 'audit_review' as unknown as 'actor_private' },
      },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('frame_unsupported');
  });

  it('Surface 6 refuses an out-of-enum frame', () => {
    const store = makeStore();
    const r = handleEstateSummary(
      store.storage,
      {
        estate_id: store.getEstate().estate_id,
        detail_level: 'standard',
        caller: { ...caller, frame: 'public_telegram' as unknown as 'actor_private' },
      },
      { tenantResolver, now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('frame_unsupported');
  });
});

describe('phase-24c fail-closed — sealed parent never surfaces provenance', () => {
  it('Surface 4 refuses a sealed parent regardless of caller.frame', () => {
    const store = makeStore();
    const sealed = buildSeededAssertion({
      status: 'active',
      assertion_class: 'observation',
      body: { text: 'fail-closed: sealed' },
      privacy_scope: 'sealed',
      risk_level: 'low',
      signer: SIGNERS.operator,
    });
    store.seedAssertion(sealed);
    const r = handleProvenanceWalk(
      store.storage,
      {
        assertion_id: sealed.assertion_id,
        detail_level: 'standard',
        caller: { ...caller, frame: 'actor_private' },
      },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('privacy_scope_refusal');
  });
});

describe('phase-24c fail-closed — storage exception surfaces typed reason', () => {
  function makeThrowingStorage(): StorageAdapter {
    const real = makeStore().storage;
    return new Proxy(real, {
      get(target, prop) {
        const v = (target as unknown as Record<string, unknown>)[prop as string];
        if (typeof v === 'function') {
          return () => {
            throw new Error('storage offline');
          };
        }
        return v;
      },
    }) as StorageAdapter;
  }

  it('Surface 2 returns storage_unavailable on storage exception', () => {
    const r = handleReceiptRetrieval(
      makeThrowingStorage(),
      { receipt_id: 'rcpt_anything', detail_level: 'standard', caller },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('not_found');
    if (r.outcome !== 'not_found') return;
    expect(r.reason).toBe('storage_unavailable');
  });

  it('Surface 4 returns storage_unavailable on storage exception', () => {
    const r = handleProvenanceWalk(
      makeThrowingStorage(),
      {
        assertion_id: 'asrt_any',
        detail_level: 'standard',
        caller: { ...caller, frame: 'actor_private' },
      },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('refused');
    if (r.outcome !== 'refused') return;
    expect(r.reason).toBe('storage_unavailable');
  });
});

describe('phase-24c fail-closed — broken audit chain surfaces break index + reason', () => {
  it('Surface 5 returns outcome=broken with index and reason on chain tamper', () => {
    const store = makeStore();
    // Seed two events through the wedge to grow the chain.
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'observation',
        body: { text: 'chain-pin: seed 1' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );
    store.auditLog.append({
      event_type: 'recall_pack_emitted',
      actor_id: store.getActor().actor_id,
      estate_id: store.getEstate().estate_id,
      signer_refs: [SIGNERS.operator.signer_id],
      created_at: NOW,
    });
    store.auditLog.append({
      event_type: 'recall_pack_emitted',
      actor_id: store.getActor().actor_id,
      estate_id: store.getEstate().estate_id,
      signer_refs: [SIGNERS.operator.signer_id],
      created_at: NOW,
    });

    // Tamper: mutate the stored chain to break the previous_audit_hash link.
    // We do this by appending a forged event with a wrong previous link.
    const stored = store.storage.listAuditEvents(store.getEstate().estate_id);
    expect(stored.length).toBeGreaterThanOrEqual(2);
    const forged: AuditEvent = {
      ...stored[stored.length - 1]!,
      audit_event_id: 'aud_forged-1',
      previous_audit_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
      audit_hash: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
      created_at: NOW,
    };
    store.storage.appendAuditEvent(forged);

    const auditLog = new AuditLog(store.storage);
    const r = handleAuditChainLookup(
      auditLog,
      store.storage,
      { estate_id: store.getEstate().estate_id, detail_level: 'standard', caller },
      { tenantResolver, intakeLog: createInMemoryIntakeDenyLog(), now: NOW },
    );
    expect(r.outcome).toBe('broken');
    if (r.outcome !== 'broken') return;
    expect(r.chain_status).toBe('broken');
    expect(r.break_index).toBeGreaterThanOrEqual(1);
    expect(r.break_reason).toBe('previous_audit_hash_mismatch');
    // The host returns events up to (but not including) the break, never hides
    // the break.
    expect(r.events.length).toBe(r.break_index);
  });
});

describe('phase-24c fail-closed — host never synthesizes', () => {
  it('Surface 1 denied path never contains pack/receipt fields', () => {
    const store = makeStore();
    const request = buildRecallRequest({
      task: 'fail-closed-no-synth',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      // unknown signer — wedge will refuse on competence.
      signer: SIGNERS.unknown,
    });
    const intakeLog = createInMemoryIntakeDenyLog();
    const r = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r.outcome).toBe('denied');
    if (r.outcome !== 'denied') return;
    expect(r).not.toHaveProperty('pack');
    expect(r).not.toHaveProperty('receipt');
    expect(r.audit_event_id).toBeDefined();
    expect(r.reason).toBe('signer_not_competent');
  });
});
