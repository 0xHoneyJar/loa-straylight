// Phase 24C — Surface 4: Provenance inspection.
//
// Per docs/specs/dixie-recall-host-mvp-contract.md §Surface 4. The host
// walks `Assertion.provenance[]` under the parent assertion's
// `privacy_scope`. `actor_private` provenance does NOT travel to
// `public_discord`. `sealed` provenance never surfaces through this BFF.
//
// The host does NOT synthesize provenance, and NEVER returns
// provenance for an unknown assertion.

import type { StorageAdapter } from '../storage/types.js';
import { checkSameTenant, type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type {
  ProvenanceEntry,
  ProvenanceWalkRequest,
  ProvenanceWalkResponse,
} from './types.js';

export interface ProvenanceDeps {
  tenantResolver: TenantResolver;
  intakeLog: IntakeDenyLog;
  now: string;
}

export function handleProvenanceWalk(
  storage: StorageAdapter,
  req: ProvenanceWalkRequest,
  deps: ProvenanceDeps,
): ProvenanceWalkResponse {
  // 1. Frame discipline — refuse any frame outside the host's 2-value enum.
  if (req.caller.frame !== 'actor_private' && req.caller.frame !== 'public_discord') {
    return { outcome: 'refused', reason: 'frame_unsupported' };
  }

  // 2. Caller tenant resolution.
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

  // 3. Assertion lookup — storage faults fail closed.
  let assertion;
  try {
    assertion = storage.getAssertion(req.assertion_id);
  } catch {
    return { outcome: 'refused', reason: 'storage_unavailable' };
  }
  if (!assertion) return { outcome: 'refused', reason: 'unknown_assertion' };

  // 4. Tenant of target assertion.
  const targetCheck = checkSameTenant(req.caller.tenant_id, assertion.actor_id, deps.tenantResolver);
  if (!targetCheck.ok) {
    deps.intakeLog.append({
      caller_tenant: req.caller.tenant_id,
      caller_actor_id: req.caller.actor_id,
      target_assertion_id: req.assertion_id,
      target_actor_id: assertion.actor_id,
      reason:
        targetCheck.reason === 'tenant_unresolved'
          ? 'tenant_resolution_failed'
          : 'cross_tenant_provenance_walk',
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

  // 5. Privacy-scope discipline.
  //    - `actor_private` parent + `public_discord` caller frame → refused.
  //    - `sealed` parent → refused regardless of frame (Surface 4 is not the
  //      audit_review surface; sealed bodies never travel through it).
  const parentScope = assertion.privacy_scope ?? 'tenant';
  if (parentScope === 'sealed') {
    return { outcome: 'refused', reason: 'privacy_scope_refusal' };
  }
  if (parentScope === 'actor_private' && req.caller.frame === 'public_discord') {
    return { outcome: 'refused', reason: 'privacy_scope_refusal' };
  }

  // 6. Walk provenance verbatim. The wedge's `ProvenanceRef` carries
  //    `provenance_id`, `source_type`, `source_uri?`, `source_hash?`,
  //    `observed_at`, `captured_by`, `evidence_summary?`. The host maps
  //    each into the spec's `ProvenanceEntry` shape — no synthesis.
  const provenance: ProvenanceEntry[] = assertion.provenance.map((p) => ({
    actor_id: p.captured_by,
    ts: p.observed_at,
    kind: p.source_type,
    evidence_ref: p.source_uri ?? p.source_hash,
  }));
  return { outcome: 'walked', provenance };
}
