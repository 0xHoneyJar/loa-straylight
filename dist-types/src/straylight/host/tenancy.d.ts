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
export declare function checkSameTenant(callerTenant: string, targetId: string, resolver: TenantResolver): TenantCheckResult;
