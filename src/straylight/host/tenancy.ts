// Phase 24C — host-side cross-tenant primitive.
//
// The wedge does NOT model `tenant_id` as a first-class field on Actor /
// Estate (see docs/handoffs/phase-24c-dixie-recall-host-scaffold.md
// §"Open questions"). The host must derive tenant identity from caller-
// supplied context — and MUST fail closed when it cannot. This module
// makes the tenant resolution dependency EXPLICIT: every host surface that
// makes a cross-tenant decision requires a `TenantResolver` injected by
// the caller. There is no production default resolver; passing one is the
// caller's responsibility.
//
// Per adjustment §1 (Tenant boundary) of the Phase 24C constraints:
//   * "production exported host functions must not silently infer tenant
//     from ID substrings unless the caller explicitly supplies that
//     resolver"
//   * "Cross-tenant ambiguity must fail closed."

/**
 * Maps an actor_id / estate_id / receipt_id-derived actor_id to a tenant
 * slug. Returns `undefined` when the id cannot be resolved — callers MUST
 * treat `undefined` as ambiguous and refuse (`tenant_unresolved`). The
 * function MUST be pure for a given id over the lifetime of one host
 * invocation.
 */
export type TenantResolver = (id: string) => string | undefined;

export interface TenantCheckResult {
  ok: boolean;
  /** Set when `ok === false`. */
  reason?: 'cross_tenant' | 'tenant_unresolved';
}

/**
 * Verify that `targetId` resolves into `callerTenant`. Returns ok=true only
 * when the resolver returns a non-undefined slug equal to callerTenant.
 *
 * This function does NOT take a default resolver. If you want lenient
 * production behaviour, write that resolver yourself; the host helpers
 * always pass through whatever resolver they were given.
 */
export function checkSameTenant(
  callerTenant: string,
  targetId: string,
  resolver: TenantResolver,
): TenantCheckResult {
  const resolved = resolver(targetId);
  if (resolved === undefined) return { ok: false, reason: 'tenant_unresolved' };
  if (resolved !== callerTenant) return { ok: false, reason: 'cross_tenant' };
  return { ok: true };
}
