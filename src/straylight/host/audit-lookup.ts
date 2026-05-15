// Phase 24C — Surface 5: Audit-chain lookup.
//
// Per docs/specs/dixie-recall-host-mvp-contract.md §Surface 5. The host
// surfaces the per-estate AuditEvent[] and the wedge's verifyChain
// result. On break, the break index and reason are surfaced; the host
// NEVER hides a break and NEVER synthesizes an audit event.
//
// The host uses the wedge's stable `AuditLog` and `StorageAdapter`
// public-API surfaces. ADR-022E gate #5 unchanged — the host does NOT
// rename `AuditEvent` to a Hounfour-side adjacent name.

import type { AuditLog } from '../audit.js';
import type { StorageAdapter } from '../storage/types.js';
import { checkSameTenant, type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type {
  AuditChainLookupRequest,
  AuditChainLookupResponse,
} from './types.js';

export interface AuditLookupDeps {
  tenantResolver: TenantResolver;
  intakeLog: IntakeDenyLog;
  now: string;
}

export function handleAuditChainLookup(
  auditLog: AuditLog,
  storage: StorageAdapter,
  req: AuditChainLookupRequest,
  deps: AuditLookupDeps,
): AuditChainLookupResponse {
  // 1. Caller tenant resolution.
  const callerCheck = checkSameTenant(req.caller.tenant_id, req.caller.actor_id, deps.tenantResolver);
  if (!callerCheck.ok) {
    return {
      outcome: 'refused',
      reason:
        callerCheck.reason === 'tenant_unresolved'
          ? 'tenant_resolution_failed'
          : 'cross_tenant_refused',
    };
  }

  // 2. Estate lookup — unknown / storage-fault fail closed.
  let estate;
  try {
    estate = storage.getEstate(req.estate_id);
  } catch {
    return { outcome: 'refused', reason: 'storage_unavailable' };
  }
  if (!estate) return { outcome: 'refused', reason: 'unknown_estate' };

  // 3. Tenant of the estate's owning actor.
  const targetCheck = checkSameTenant(req.caller.tenant_id, estate.actor_id, deps.tenantResolver);
  if (!targetCheck.ok) {
    deps.intakeLog.append({
      caller_tenant: req.caller.tenant_id,
      caller_actor_id: req.caller.actor_id,
      target_estate_id: req.estate_id,
      target_actor_id: estate.actor_id,
      reason:
        targetCheck.reason === 'tenant_unresolved'
          ? 'tenant_resolution_failed'
          : 'cross_tenant_audit_lookup',
      ts: deps.now,
    });
    return {
      outcome: 'refused',
      reason:
        targetCheck.reason === 'tenant_unresolved'
          ? 'tenant_resolution_failed'
          : 'cross_tenant_refused',
    };
  }

  // 4. Chain listing + verification. Storage faults fail closed.
  let events;
  try {
    events = auditLog.listFor(req.estate_id);
  } catch {
    return { outcome: 'refused', reason: 'storage_unavailable' };
  }

  const verify = auditLog.verifyChain(req.estate_id);
  if (verify.ok) {
    return { outcome: 'verified', events, chain_status: 'ok' };
  }
  return {
    outcome: 'broken',
    events: events.slice(0, verify.broken_at),
    chain_status: 'broken',
    break_index: verify.broken_at,
    break_reason: verify.reason,
  };
}
