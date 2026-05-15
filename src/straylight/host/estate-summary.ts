// Phase 24C — Surface 6: Estate summary.
//
// Per docs/specs/dixie-recall-host-mvp-contract.md §Surface 6. The host
// returns per-estate counts by class / status / privacy-scope / risk-level.
//
// Privacy-scope mapping: the wedge has 4 values (public / tenant /
// actor_private / sealed); the spec response shape has 2 keys
// (`actor_private` / `public_discord`). The host projects:
//   - public, tenant     → `public_discord` bucket
//   - actor_private, sealed → `actor_private` bucket
// AND ALSO surfaces the raw 4-key `_widened_privacy_scope` map for trace.
//
// Frame discipline: when caller.frame is `public_discord`, the 2-key
// `actor_private` bucket is zeroed (the wedge's privacy discipline must
// not leak through the host summary). The widened map is unaffected and
// remains available for trace/debug only.

import type { StorageAdapter } from '../storage/types.js';
import { checkSameTenant, type TenantResolver } from './tenancy.js';
import type {
  EstateSummaryCounts,
  EstateSummaryRequest,
  EstateSummaryResponse,
} from './types.js';
import type {
  AssertionStatus,
  PrivacyScope,
  RiskLevel,
} from '../types.js';

export interface EstateSummaryDeps {
  tenantResolver: TenantResolver;
  now: string;
}

const ALL_STATUSES: readonly AssertionStatus[] = [
  'proposed',
  'active',
  'contested',
  'demoted',
  'revoked',
  'forgotten_from_recall',
  'superseded',
  'sealed',
];
const ALL_RISK_LEVELS: readonly RiskLevel[] = ['low', 'medium', 'high', 'critical'];
const ALL_PRIVACY_SCOPES: readonly PrivacyScope[] = [
  'public',
  'tenant',
  'actor_private',
  'sealed',
];

export function handleEstateSummary(
  storage: StorageAdapter,
  req: EstateSummaryRequest,
  deps: EstateSummaryDeps,
): EstateSummaryResponse {
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

  // 3. Estate lookup — storage faults fail closed.
  let estate;
  try {
    estate = storage.getEstate(req.estate_id);
  } catch {
    return { outcome: 'refused', reason: 'storage_unavailable' };
  }
  if (!estate) return { outcome: 'refused', reason: 'unknown_estate' };

  // 4. Estate tenant.
  const targetCheck = checkSameTenant(req.caller.tenant_id, estate.actor_id, deps.tenantResolver);
  if (!targetCheck.ok) {
    return {
      outcome: 'refused',
      reason:
        targetCheck.reason === 'tenant_unresolved'
          ? 'tenant_resolution_failed'
          : 'cross_tenant_refused',
    };
  }

  // 5. Assertions listing.
  let assertions;
  try {
    assertions = storage.listAssertions(req.estate_id);
  } catch {
    return { outcome: 'refused', reason: 'storage_unavailable' };
  }

  // 6. Build counts.
  const by_class: Record<string, number> = {};
  const by_status: Record<AssertionStatus, number> = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, 0]),
  ) as Record<AssertionStatus, number>;
  const by_risk_level: Record<RiskLevel, number> = Object.fromEntries(
    ALL_RISK_LEVELS.map((r) => [r, 0]),
  ) as Record<RiskLevel, number>;
  const _widened_privacy_scope: Record<PrivacyScope, number> = Object.fromEntries(
    ALL_PRIVACY_SCOPES.map((p) => [p, 0]),
  ) as Record<PrivacyScope, number>;

  for (const a of assertions) {
    by_class[a.assertion_class] = (by_class[a.assertion_class] ?? 0) + 1;
    by_status[a.status] = (by_status[a.status] ?? 0) + 1;
    const risk: RiskLevel = a.risk_level ?? 'low';
    by_risk_level[risk] = (by_risk_level[risk] ?? 0) + 1;
    const scope: PrivacyScope = a.privacy_scope ?? 'tenant';
    _widened_privacy_scope[scope] = (_widened_privacy_scope[scope] ?? 0) + 1;
  }

  // 7. Project widened map → spec 2-key shape.
  let actor_private_count = _widened_privacy_scope.actor_private + _widened_privacy_scope.sealed;
  const public_count = _widened_privacy_scope.public + _widened_privacy_scope.tenant;

  // 8. Frame discipline: omit actor_private under public_discord.
  if (req.caller.frame === 'public_discord') {
    actor_private_count = 0;
  }

  const counts: EstateSummaryCounts = {
    by_class,
    by_status,
    by_privacy_scope: { actor_private: actor_private_count, public_discord: public_count },
    by_risk_level,
    _widened_privacy_scope,
  };

  return {
    outcome: 'summarized',
    actor_id: estate.actor_id,
    estate_id: estate.estate_id,
    counts,
  };
}
