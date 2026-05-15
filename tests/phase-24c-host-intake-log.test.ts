// Phase 24C — host intake-deny log pins.
//
// Per docs/specs/dixie-recall-host-validation-vectors.md §"Per-vector
// audit-chain expectation":
//   "For vectors 7 (cross-tenant refused) and 8 (denied private-in-public),
//    the host emits an additional intake-deny audit log entry that
//    references the wedge's `recall_denied` event for chain-of-custody.
//    The host's own intake-deny entry is per-tenant; cross-estate /
//    cross-tenant chain links remain forbidden."
//
// This file pins:
//   * the intake-deny log is per-tenant (listForTenant scopes correctly);
//   * vector-7 cross-tenant intake produces an entry on the CALLER's tenant
//     (not the target's);
//   * a denied recall (signer not competent) carries the wedge's
//     `recall_denied` audit_event_id in `wedge_audit_event_ref`;
//   * intake-deny entries are content-addressed and stable.

import { describe, expect, it } from 'vitest';

import { EstateStore } from '../src/straylight/index.js';
import {
  createInMemoryIntakeDenyLog,
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
  if (id.includes('alice')) return 'alice-tenant';
  return undefined;
};

function makeStore(): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
}

describe('phase-24c intake-log — per-tenant scoping', () => {
  it('listForTenant only returns entries for the caller tenant', () => {
    const intakeLog = createInMemoryIntakeDenyLog();
    intakeLog.append({
      caller_tenant: 'alice-tenant',
      caller_actor_id: 'agent:alice-prod',
      reason: 'cross_tenant_recall_refused',
      ts: NOW,
    });
    intakeLog.append({
      caller_tenant: 'satoshi-tenant',
      caller_actor_id: 'agent:satoshi-demo',
      reason: 'signer_not_competent',
      ts: NOW,
    });
    expect(intakeLog.listForTenant('alice-tenant').length).toBe(1);
    expect(intakeLog.listForTenant('satoshi-tenant').length).toBe(1);
    expect(intakeLog.listForTenant('mallory-tenant').length).toBe(0);
    expect(intakeLog.list().length).toBe(2);
  });

  it('content-addressed entry ids are deterministic for distinct payloads', () => {
    const a = createInMemoryIntakeDenyLog();
    const e1 = a.append({
      caller_tenant: 't',
      caller_actor_id: 'agent:t',
      reason: 'reason-1',
      ts: NOW,
    });
    const e2 = a.append({
      caller_tenant: 't',
      caller_actor_id: 'agent:t',
      reason: 'reason-2',
      ts: NOW,
    });
    expect(e1.intake_log_entry_id).not.toEqual(e2.intake_log_entry_id);
    expect(e1.intake_log_entry_id.startsWith('idlog')).toBe(true);
  });
});

describe('phase-24c intake-log — vector-7 cross-tenant entry written on caller tenant', () => {
  it('cross-tenant intake produces an entry on the CALLER tenant only', () => {
    const store = makeStore();
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'observation',
        body: { text: 'intake-log v7' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
    );
    const intakeLog = createInMemoryIntakeDenyLog();
    const callerFromAlice = {
      tenant_id: 'alice-tenant',
      actor_id: 'agent:alice-prod',
      session_id: 'sess:cross-tenant-log',
    };
    const request = buildRecallRequest({
      task: 'intake-log-v7',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      signer: SIGNERS.operator,
    });
    const r = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller: callerFromAlice },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r.outcome).toBe('denied');
    if (r.outcome !== 'denied') return;
    expect(r.reason).toBe('cross_tenant_recall_refused');

    const aliceEntries = intakeLog.listForTenant('alice-tenant');
    const satoshiEntries = intakeLog.listForTenant('satoshi-tenant');
    expect(aliceEntries.length).toBe(1);
    expect(satoshiEntries.length).toBe(0);
    expect(aliceEntries[0]!.reason).toBe('cross_tenant_recall_refused');
    expect(aliceEntries[0]!.target_actor_id).toBe(request.actor_id);
    // wedge_audit_event_ref is undefined here — the wedge never ran because
    // the host refused at intake before delegating.
    expect(aliceEntries[0]!.wedge_audit_event_ref).toBeUndefined();
  });
});

describe('phase-24c intake-log — wedge audit event ref carried on wedge-side deny', () => {
  it('signer-not-competent deny carries the wedge recall_denied audit_event_id', () => {
    const store = makeStore();
    const caller = {
      tenant_id: 'satoshi-tenant',
      actor_id: 'agent:satoshi-demo',
      session_id: 'sess:intake-log-wedge',
    };
    const request = buildRecallRequest({
      task: 'intake-log-wedge-deny',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      signer: SIGNERS.unknown, // not on keyring → wedge denies
    });
    const intakeLog = createInMemoryIntakeDenyLog();
    const r = handleRecallIntake(
      store,
      { request, detail_level: 'standard', caller },
      { tenantResolver, intakeLog, now: NOW },
    );
    expect(r.outcome).toBe('denied');
    if (r.outcome !== 'denied') return;
    expect(r.reason).toBe('signer_not_competent');
    expect(r.audit_event_id).toBeDefined();

    const entries = intakeLog.listForTenant('satoshi-tenant');
    expect(entries.length).toBe(1);
    expect(entries[0]!.wedge_audit_event_ref).toBe(r.audit_event_id);
    expect(entries[0]!.reason).toBe('signer_not_competent');
  });
});
