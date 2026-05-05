// Policy validation (§9.2) — fail-closed.
//
// Policy answers: "is this structurally valid move allowed under current
// estate state?" It composes:
//   1. signature self-consistency (signatures.ts)
//   2. signer competence (keyring.ts) — including quorum/timelock/review
//   3. recall-time scope rules for environment frame + privacy + status
// Class validation must already have passed before policy runs.
//
// Phase 3 additions:
//   * PolicyEngineError + safe wrappers — any throw inside the engine
//     becomes a deny+`policy_engine_error` decision (§19.3 default-deny).
//   * `requires_review` from competence is honored: competence-true +
//     review-required → `needs_review`, never silent allow.
//   * Policy-unavailable surface: when no competence rule matches, we return
//     a deny with explicit `policy_unavailable_for_transition` reason so
//     the operator can distinguish "no rule loaded" from "rule denied you".

import { verifyEnvelopeSelfConsistency } from './signatures.js';
import { evaluateCompetence } from './keyring.js';
import type {
  Assertion,
  AssertionStatus,
  CandidateAssertion,
  ClassValidationResult,
  EnvironmentFrame,
  EstateTransition,
  Keyring,
  PolicyDecision,
  PolicyDecisionOutcome,
  PrivacyScope,
  RecallRequest,
  RiskLevel,
  SignatureEnvelope,
  SignerCompetenceResult,
} from './types.js';

export const DEFAULT_POLICY_ID = 'straylight.default-agent-estate.v0';
export const DEFAULT_POLICY_VERSION = '0.1.0';

export class PolicyEngineError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'PolicyEngineError';
    this.code = code;
  }
}

// ─── Admit-assertion policy ───────────────────────────────────────────────────

export interface AdmitPolicyInput {
  candidate: CandidateAssertion;
  class_validation: ClassValidationResult;
  keyring: Keyring;
  now: string;
}

export function policyForAdmitAssertion(input: AdmitPolicyInput): PolicyDecision {
  return safeRun(input.now, () => admitInner(input));
}

function admitInner(input: AdmitPolicyInput): PolicyDecision {
  if (!input.class_validation.valid) {
    return deny(
      ['class_validation_failed', ...input.class_validation.errors.map((e) => `class:${e.code}:${e.path}`)],
      { allowed: false, reason: 'class_validation_failed' },
      input.now,
    );
  }

  const sigCheck = verifyAllSignatures(input.candidate.signatures);
  if (!sigCheck.ok) {
    const reason = sigCheck.reason ?? 'signature_invalid';
    return deny([`signature_invalid:${reason}`], { allowed: false, reason }, input.now);
  }

  const competence = evaluateCompetence(input.keyring, {
    transition_type: 'admit_assertion',
    signatures: input.candidate.signatures,
    assertion_class: input.candidate.assertion_class,
    risk_level: input.candidate.risk_level,
    now: input.now,
  });

  return projectCompetence({
    competence,
    now: input.now,
    contextLabel: `admit_${input.candidate.assertion_class}`,
    extraNeedsReview: needsReviewForModelOutput(input.candidate),
  });
}

// ─── Generic transition policy (challenge / revoke / forget / demote) ────────

export interface TransitionPolicyInput {
  transition_type: EstateTransition['transition_type'];
  signatures: SignatureEnvelope[];
  keyring: Keyring;
  target_class?: Assertion['assertion_class'];
  risk_level?: RiskLevel;
  environment_frame?: EnvironmentFrame;
  now: string;
}

export function policyForTransition(input: TransitionPolicyInput): PolicyDecision {
  return safeRun(input.now, () => transitionInner(input));
}

function transitionInner(input: TransitionPolicyInput): PolicyDecision {
  const sigCheck = verifyAllSignatures(input.signatures);
  if (!sigCheck.ok) {
    const reason = sigCheck.reason ?? 'signature_invalid';
    return deny([`signature_invalid:${reason}`], { allowed: false, reason }, input.now);
  }

  const competence = evaluateCompetence(input.keyring, {
    transition_type: input.transition_type,
    signatures: input.signatures,
    target_class: input.target_class,
    risk_level: input.risk_level,
    environment_frame: input.environment_frame,
    now: input.now,
  });

  return projectCompetence({
    competence,
    now: input.now,
    contextLabel: input.transition_type,
  });
}

// ─── Recall policy ────────────────────────────────────────────────────────────

export interface RecallPolicyInput {
  request: RecallRequest;
  keyring: Keyring;
  now: string;
}

export function policyForRecallRequest(input: RecallPolicyInput): PolicyDecision {
  return safeRun(input.now, () => recallInner(input));
}

function recallInner(input: RecallPolicyInput): PolicyDecision {
  const sig = input.request.signature;
  const sigCheck = verifyEnvelopeSelfConsistency(sig);
  if (!sigCheck.valid) {
    const reason = sigCheck.reason ?? 'sig_invalid';
    return deny([`signature_invalid:${reason}`], { allowed: false, reason }, input.now);
  }

  const competence = evaluateCompetence(input.keyring, {
    transition_type: 'recall_estate_context',
    signatures: [sig],
    environment_frame: input.request.environment_frame,
    risk_level: input.request.risk_profile,
    now: input.now,
  });

  // Public frame + high/critical risk requires reviewer co-sign — fall back
  // to needs_review rather than silently allowing.
  const isPublicFrame =
    input.request.environment_frame === 'public_discord' ||
    input.request.environment_frame === 'public_telegram';
  const publicHighRiskNeedsReview =
    isPublicFrame && (input.request.risk_profile === 'high' || input.request.risk_profile === 'critical');

  return projectCompetence({
    competence,
    now: input.now,
    contextLabel: `recall_${input.request.environment_frame}`,
    extraNeedsReview: publicHighRiskNeedsReview
      ? { reason: 'public_frame_high_risk_recall_requires_review', next: ['reviewer_co_sign'] }
      : undefined,
  });
}

// ─── Recall scope filters (per §11.5) — unchanged from Phase 1 ────────────────

export type RecallDisposition =
  | { kind: 'include' }
  | { kind: 'mark'; reason: string }
  | { kind: 'redact'; reason: string }
  | { kind: 'exclude'; reason: string };

export function dispositionFor(
  assertion: Assertion,
  request: RecallRequest,
): RecallDisposition {
  if (request.exclude_statuses?.includes(assertion.status)) {
    return { kind: 'exclude', reason: `status_${assertion.status}` };
  }
  if (assertion.status === 'revoked' || assertion.status === 'forgotten_from_recall') {
    if (request.environment_frame !== 'audit_review') {
      return { kind: 'exclude', reason: `status_${assertion.status}` };
    }
  }
  if (assertion.status === 'sealed' && request.environment_frame !== 'audit_review') {
    return { kind: 'exclude', reason: 'status_sealed' };
  }
  if (request.requested_classes && request.requested_classes.length > 0) {
    if (!request.requested_classes.includes(assertion.assertion_class)) {
      return { kind: 'exclude', reason: `class_not_requested:${assertion.assertion_class}` };
    }
  }
  if (request.excluded_classes?.includes(assertion.assertion_class)) {
    return { kind: 'exclude', reason: `class_excluded:${assertion.assertion_class}` };
  }
  const privacy = assertion.privacy_scope ?? 'tenant';
  const privacyExclusion = privacyDispositionForFrame(privacy, request.environment_frame);
  if (privacyExclusion) return privacyExclusion;
  if (
    (request.risk_profile === 'high' || request.risk_profile === 'critical') &&
    !hasNonModelOutputProvenance(assertion)
  ) {
    return { kind: 'exclude', reason: 'provenance_insufficient_for_high_risk' };
  }
  if (assertion.status === 'contested') {
    return { kind: 'mark', reason: 'status_contested' };
  }
  if (assertion.status === 'demoted') {
    if (request.mark_statuses?.includes('demoted')) {
      return { kind: 'mark', reason: 'status_demoted' };
    }
    return { kind: 'exclude', reason: 'status_demoted' };
  }
  if (request.mark_statuses?.includes(assertion.status)) {
    return { kind: 'mark', reason: `status_${assertion.status}` };
  }
  if (assertion.status === 'active' || assertion.status === 'proposed') {
    return { kind: 'include' };
  }
  if (assertion.status === 'superseded') {
    if (request.include_statuses?.includes('superseded')) {
      return { kind: 'mark', reason: 'status_superseded' };
    }
    return { kind: 'exclude', reason: 'status_superseded' };
  }
  return { kind: 'exclude', reason: `status_unhandled:${assertion.status}` };
}

function privacyDispositionForFrame(
  privacy: PrivacyScope,
  frame: EnvironmentFrame,
): RecallDisposition | undefined {
  const isPublic = frame === 'public_discord' || frame === 'public_telegram';
  const isAudit = frame === 'audit_review';
  if (privacy === 'sealed') {
    if (isAudit) return { kind: 'redact', reason: 'privacy_sealed_audit_redacted' };
    return { kind: 'exclude', reason: 'privacy_sealed' };
  }
  if (privacy === 'actor_private') {
    if (isPublic) return { kind: 'exclude', reason: 'privacy_actor_private_in_public_frame' };
    if (frame === 'private_chat') return { kind: 'exclude', reason: 'privacy_actor_private_in_chat_frame' };
  }
  if (privacy === 'tenant' && isPublic) {
    return { kind: 'redact', reason: 'privacy_tenant_in_public_frame' };
  }
  return undefined;
}

function hasNonModelOutputProvenance(a: Assertion): boolean {
  return a.provenance.some((p) => p.source_type !== 'model_output');
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface ProjectInput {
  competence: SignerCompetenceResult;
  now: string;
  contextLabel: string;
  extraNeedsReview?: { reason: string; next?: string[] };
}

function projectCompetence(input: ProjectInput): PolicyDecision {
  const c = input.competence;

  if (!c.allowed) {
    // Distinguish "no rule" (= policy unavailable for this transition) from
    // "rule denied you" so operators can tell the failure modes apart.
    const isPolicyUnavailable = c.reason === 'no_competence_rule_for_transition';
    const reason = isPolicyUnavailable
      ? 'policy_unavailable_for_transition'
      : `competence:${c.reason}`;
    return deny([reason], c, input.now);
  }

  if (c.requires_review) {
    return {
      decision: 'needs_review',
      policy_id: DEFAULT_POLICY_ID,
      policy_version: DEFAULT_POLICY_VERSION,
      signer_competence_result: c,
      reasons: [`requires_human_review:${input.contextLabel}`],
      required_next_actions: ['reviewer_co_sign'],
      decided_at: input.now,
    };
  }

  if (input.extraNeedsReview) {
    return {
      decision: 'needs_review',
      policy_id: DEFAULT_POLICY_ID,
      policy_version: DEFAULT_POLICY_VERSION,
      signer_competence_result: c,
      reasons: [input.extraNeedsReview.reason],
      required_next_actions: input.extraNeedsReview.next,
      decided_at: input.now,
    };
  }

  return {
    decision: 'allow',
    policy_id: DEFAULT_POLICY_ID,
    policy_version: DEFAULT_POLICY_VERSION,
    signer_competence_result: c,
    reasons: [`signer_${c.signer_role}_competent_for_${input.contextLabel}`],
    decided_at: input.now,
  };
}

function needsReviewForModelOutput(c: CandidateAssertion): { reason: string; next?: string[] } | undefined {
  if (
    c.provenance.length > 0 &&
    c.provenance.every((p) => p.source_type === 'model_output') &&
    ['identity', 'permission', 'commitment'].includes(c.assertion_class)
  ) {
    return {
      reason: 'model_output_only_provenance_cannot_authorize_identity_or_permission',
      next: ['attach_human_or_runtime_provenance', 'reviewer_signature'],
    };
  }
  return undefined;
}

function safeRun(now: string, fn: () => PolicyDecision): PolicyDecision {
  try {
    return fn();
  } catch (err) {
    const code = err instanceof PolicyEngineError ? err.code : 'unexpected_error';
    const message = err instanceof Error ? err.message : String(err);
    return {
      decision: 'deny',
      policy_id: DEFAULT_POLICY_ID,
      policy_version: DEFAULT_POLICY_VERSION,
      signer_competence_result: { allowed: false, reason: `policy_engine_error:${code}` },
      reasons: ['policy_engine_error', `${code}:${message}`],
      decided_at: now,
    };
  }
}

function verifyAllSignatures(envs: SignatureEnvelope[]): { ok: boolean; reason?: string } {
  for (const e of envs) {
    const r = verifyEnvelopeSelfConsistency(e);
    if (!r.valid) return { ok: false, reason: r.reason ?? 'signature_invalid' };
  }
  return { ok: true };
}

function deny(
  reasons: string[],
  competence: SignerCompetenceResult,
  now: string,
  decision: PolicyDecisionOutcome = 'deny',
): PolicyDecision {
  return {
    decision,
    policy_id: DEFAULT_POLICY_ID,
    policy_version: DEFAULT_POLICY_VERSION,
    signer_competence_result: competence,
    reasons,
    decided_at: now,
  };
}
