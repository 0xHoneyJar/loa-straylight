// Phase 24C — Surface 1: Recall intake & response.
//
// Per docs/specs/dixie-recall-host-mvp-contract.md §Surface 1. The host
// performs a cross-tenant intake check, delegates to the wedge's
// `executeRecall`, and maps the wedge's `RecallOutcome` to a closed-enum
// host response. The host NEVER produces a RecallPack, NEVER produces a
// RecallReceipt, and NEVER bypasses policy validation.

import { contentId } from '../ids.js';
import { executeRecall } from '../recall.js';
import type { EstateStore } from '../estate.js';
import { checkSameTenant, type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type {
  DeniedReason,
  RecallIntakeRequest,
  RecallIntakeResponse,
} from './types.js';

export interface IntakeDeps {
  /** REQUIRED. No silent default. See ./tenancy.ts for the contract. */
  tenantResolver: TenantResolver;
  /** REQUIRED. Vectors 7/8 require intake-deny log entries on refusal. */
  intakeLog: IntakeDenyLog;
  /** Logical "now" timestamp (ISO 8601). */
  now: string;
}

export function handleRecallIntake(
  store: EstateStore,
  req: RecallIntakeRequest,
  deps: IntakeDeps,
): RecallIntakeResponse {
  // ── 1. Cross-tenant intake guard ───────────────────────────────────────────
  const callerCheck = checkSameTenant(req.caller.tenant_id, req.caller.actor_id, deps.tenantResolver);
  const targetCheck = checkSameTenant(
    req.caller.tenant_id,
    req.request.actor_id,
    deps.tenantResolver,
  );
  if (!callerCheck.ok || !targetCheck.ok) {
    const unresolved =
      callerCheck.reason === 'tenant_unresolved' || targetCheck.reason === 'tenant_unresolved';
    const reason: DeniedReason = unresolved ? 'tenant_resolution_failed' : 'cross_tenant_recall_refused';
    const raw_reasons = [
      callerCheck.reason ? `caller:${callerCheck.reason}` : undefined,
      targetCheck.reason ? `target:${targetCheck.reason}` : undefined,
    ].filter((r): r is string => typeof r === 'string');
    const entry = deps.intakeLog.append({
      caller_tenant: req.caller.tenant_id,
      caller_actor_id: req.caller.actor_id,
      target_actor_id: req.request.actor_id,
      reason,
      ts: deps.now,
    });
    return {
      outcome: 'denied',
      reason,
      raw_reasons,
      intake_log_entry_id: entry.intake_log_entry_id,
    };
  }

  // ── 2. Delegate to wedge runtime ───────────────────────────────────────────
  let outcome;
  try {
    outcome = executeRecall(store, req.request, deps.now);
  } catch (err) {
    const entry = deps.intakeLog.append({
      caller_tenant: req.caller.tenant_id,
      caller_actor_id: req.caller.actor_id,
      target_actor_id: req.request.actor_id,
      reason: 'storage_unavailable',
      ts: deps.now,
    });
    return {
      outcome: 'denied',
      reason: 'storage_unavailable',
      raw_reasons: [err instanceof Error ? err.message : String(err)],
      intake_log_entry_id: entry.intake_log_entry_id,
    };
  }

  // ── 3. Served happy path ───────────────────────────────────────────────────
  if (outcome.ok && outcome.pack && outcome.receipt) {
    return {
      outcome: 'served',
      pack: outcome.pack,
      receipt: outcome.receipt,
      audit_event_id: outcome.audit_event_id,
    };
  }

  // ── 4. needs_review path — host issues a deterministic queue handle ────────
  // No real queue is wired (host is local additive scaffolding; no runtime
  // surface). The handle is content-addressed from the request id + now so
  // tests can pin it deterministically.
  //
  // `needs_review` is INTENTIONALLY NOT a denial. The wedge has neither
  // denied nor served the request — it has routed it to a review queue.
  // Per Phase 24C invariants the intake-deny log is reserved for refusals
  // (cross-tenant, frame, storage, wedge-side deny). A `needs_review`
  // outcome therefore writes NO intake-deny entry. If the human reviewer
  // later denies the queued request, the denial event lives in the wedge's
  // own audit chain — not in this host's intake-deny log.
  if (outcome.policy_decision.decision === 'needs_review') {
    const handle = contentId(
      { recall_request_id: req.request.recall_request_id, now: deps.now },
      { prefix: 'rqueue' },
    );
    return {
      outcome: 'needs_review',
      review_queue_id: handle,
      raw_reasons: outcome.policy_decision.reasons,
      audit_event_id: outcome.audit_event_id,
    };
  }

  // ── 5. Denial path — classify wedge reasons into closed DeniedReason enum ──
  const reason = classifyWedgeDeny(
    outcome.policy_decision.reasons,
    outcome.class_validation.valid,
    outcome.policy_decision.signer_competence_result.reason,
  );
  const entry = deps.intakeLog.append({
    caller_tenant: req.caller.tenant_id,
    caller_actor_id: req.caller.actor_id,
    target_actor_id: req.request.actor_id,
    reason,
    wedge_audit_event_ref: outcome.audit_event_id,
    ts: deps.now,
  });
  return {
    outcome: 'denied',
    reason,
    raw_reasons: outcome.policy_decision.reasons,
    audit_event_id: outcome.audit_event_id,
    intake_log_entry_id: entry.intake_log_entry_id,
  };
}

function classifyWedgeDeny(
  reasons: readonly string[],
  classValid: boolean,
  competenceReason: string | undefined,
): DeniedReason {
  if (!classValid) return 'class_validation_failed';
  for (const r of reasons) {
    if (r === 'policy_unavailable_for_transition') return 'policy_unavailable';
    if (r.startsWith('signature_invalid:')) return 'signer_not_competent';
    if (r.startsWith('competence:')) return 'signer_not_competent';
  }
  if (competenceReason === 'no_competence_rule_for_transition') return 'policy_unavailable';
  if (competenceReason && competenceReason.length > 0 && competenceReason !== 'class_validation_failed') {
    // any other competence failure (signer not on keyring, key revoked,
    // etc.) maps to signer_not_competent per spec §Surface 1 fail-closed.
    return 'signer_not_competent';
  }
  return 'blocked_by_policy';
}
