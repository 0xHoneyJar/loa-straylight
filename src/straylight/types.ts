// Straylight Recall Wedge MVP — primitive type definitions.
//
// Source: docs/architecture/loa-straylight-product-system-architecture-spec.md §7–§14.
// These types are NOT runtime authority. Class validation lives in validators/,
// policy validation lives in policy.ts, signer competence lives in keyring.ts.

export type ISO8601 = string;
export type Hash = string; // "sha256:<hex>"
export type ID = string;

// ──────────────────────────────────────────────────────────────────────────────
// Actor + Estate (§7.2 §7.3)
// ──────────────────────────────────────────────────────────────────────────────

export type ActorType =
  | 'agent'
  | 'user'
  | 'community'
  | 'repo_assistant'
  | 'demo_dNFT_actor';

export type ActorStatus =
  | 'proposed'
  | 'active'
  | 'suspended'
  | 'revoked'
  | 'archived';

export interface Actor {
  actor_id: ID;
  actor_type: ActorType;
  estate_id: ID;
  keyring_id: ID;
  status: ActorStatus;
  controller_refs: string[];
  schema_version: string;
  created_at: ISO8601;
  updated_at: ISO8601;
  provenance_ref?: string;
}

export type EstateStatus =
  | 'initialized'
  | 'active'
  | 'contested'
  | 'partially_revoked'
  | 'archived';

export interface ActorEstate {
  estate_id: ID;
  actor_id: ID;
  schema_version: string;
  status: EstateStatus;
  assertion_index_ref: string;
  keyring_id: ID;
  policy_id: ID;
  state_root?: Hash;
  audit_log_ref: string;
  public_anchor_refs?: string[];
  created_at: ISO8601;
  updated_at: ISO8601;
}

// ──────────────────────────────────────────────────────────────────────────────
// Assertion (§7.4 §7.5)
// ──────────────────────────────────────────────────────────────────────────────

export type AssertionClass =
  | 'observation'
  | 'event'
  | 'claim'
  | 'assumption'
  | 'preference'
  | 'reflection'
  | 'identity'
  | 'relationship'
  | 'permission'
  | 'plan'
  | 'action_trace'
  | 'feedback_signal'
  | 'evaluation_result'
  | 'challenge'
  | 'revocation'
  | 'commitment';

export type AssertionStatus =
  | 'proposed'
  | 'active'
  | 'contested'
  | 'demoted'
  | 'revoked'
  | 'forgotten_from_recall'
  | 'superseded'
  | 'sealed';

export type PrivacyScope = 'public' | 'tenant' | 'actor_private' | 'sealed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ProvenanceSourceType =
  | 'operator_input'
  | 'runtime_observation'
  | 'tool_result'
  | 'model_output'
  | 'discord_event'
  | 'telegram_event'
  | 'repo_artifact'
  | 'onchain_event'
  | 'feedback_signal'
  | 'evaluation_result'
  | 'manual_review';

export interface ProvenanceRef {
  provenance_id: ID;
  source_type: ProvenanceSourceType;
  source_uri?: string;
  source_hash?: Hash;
  observed_at: ISO8601;
  captured_by: string;
  evidence_summary?: string;
}

export type SignerType =
  | 'actor_controller'
  | 'operator'
  | 'runtime'
  | 'reviewer'
  | 'policy_service'
  | 'admin'
  | 'wallet'
  | 'service_key';

export type SignatureType = 'ed25519' | 'secp256k1' | 'hmac' | 'dev_signature';

export interface SignatureEnvelope {
  signature_id: ID;
  signer_id: ID;
  signer_type: SignerType;
  signature_type: SignatureType;
  signed_payload_hash: Hash;
  signature: string;
  signed_at: ISO8601;
  key_ref: string;
}

export interface Assertion {
  assertion_id: ID;
  estate_id: ID;
  actor_id: ID;
  assertion_class: AssertionClass;
  status: AssertionStatus;
  body: Record<string, unknown>;
  body_hash: Hash;
  schema_version: string;
  provenance: ProvenanceRef[];
  subject_refs?: string[];
  linked_assertion_refs?: string[];
  supersedes_refs?: string[];
  challenged_by_refs?: string[];
  revoked_by_ref?: ID;
  confidence?: number;
  risk_level?: RiskLevel;
  privacy_scope?: PrivacyScope;
  recall_scope?: string[];
  signatures: SignatureEnvelope[];
  created_at: ISO8601;
  updated_at: ISO8601;
}

// ──────────────────────────────────────────────────────────────────────────────
// Keyring + Competence (§10)
// ──────────────────────────────────────────────────────────────────────────────

export type SignerStatus = 'active' | 'suspended' | 'revoked';

export interface SignerEntry {
  signer_id: ID;
  signer_type: SignerType;
  key_ref: string;
  status: SignerStatus;
  valid_from: ISO8601;
  valid_until?: ISO8601;
  scopes: string[];
}

export interface SignerCompetenceRule {
  rule_id: ID;
  transition_type: EstateTransition['transition_type'];
  assertion_class?: AssertionClass;
  target_class?: AssertionClass;
  risk_level?: RiskLevel;
  environment_frame?: EnvironmentFrame;
  required_signer_roles: SignerType[];
  forbid_signer_roles?: SignerType[];
  quorum?: number;
  timelock_seconds?: number;
  requires_human_review?: boolean;
}

export interface Keyring {
  keyring_id: ID;
  actor_id: ID;
  estate_id: ID;
  version: string;
  signer_entries: SignerEntry[];
  competence_rules: SignerCompetenceRule[];
  revoked_key_refs: string[];
  created_at: ISO8601;
  updated_at: ISO8601;
}

// ──────────────────────────────────────────────────────────────────────────────
// Class validation + Policy (§9)
// ──────────────────────────────────────────────────────────────────────────────

export interface ValidationError {
  path: string;
  code:
    | 'missing_field'
    | 'invalid_type'
    | 'invalid_enum'
    | 'invalid_format'
    | 'integrity_mismatch'
    | 'class_specific';
  message: string;
}

export interface ClassValidationResult {
  valid: boolean;
  schema_id: string;
  schema_version: string;
  errors: ValidationError[];
}

export interface SignerCompetenceResult {
  allowed: boolean;
  reason: string;
  matched_rule_id?: ID;
  signer_id?: ID;
  signer_role?: SignerType;
  signature_id?: ID;
  // Phase 3 — quorum / timelock / human-review fields. All optional so
  // Phase 1 callers and existing competence rules keep working unchanged.
  competent_signer_ids?: ID[];
  quorum_required?: number;
  quorum_present?: number;
  timelock_seconds_required?: number;
  timelock_seconds_elapsed?: number;
  requires_review?: boolean;
}

export type PolicyDecisionOutcome =
  | 'allow'
  | 'deny'
  | 'needs_review'
  | 'allow_with_redaction'
  | 'allow_marked_only';

export interface PolicyDecision {
  decision: PolicyDecisionOutcome;
  policy_id: ID;
  policy_version: string;
  signer_competence_result: SignerCompetenceResult;
  reasons: string[];
  required_next_actions?: string[];
  decided_at: ISO8601;
}

// ──────────────────────────────────────────────────────────────────────────────
// Estate transitions (§7.7)
// ──────────────────────────────────────────────────────────────────────────────

export interface EstateTransition {
  transition_id: ID;
  estate_id: ID;
  actor_id: ID;
  transition_type:
    | 'create_estate'
    | 'admit_assertion'
    | 'classify_assertion'
    | 'link_assertions'
    | 'challenge_assertion'
    | 'demote_assertion'
    | 'revoke_assertion'
    | 'forget_assertion_from_recall'
    | 'inherit_assertion'
    | 'recall_estate_context'
    | 'emit_receipt'
    | 'commit_root_optional'
    | 'record_feedback_signal'
    | 'record_evaluation_result';
  target_refs: string[];
  pre_state_root?: Hash;
  post_state_root?: Hash;
  requested_by: ID;
  class_validation: ClassValidationResult;
  policy_decision: PolicyDecision;
  signatures: SignatureEnvelope[];
  audit_event_ref: ID;
  created_at: ISO8601;
}

// ──────────────────────────────────────────────────────────────────────────────
// Challenge / Revocation (§12)
// ──────────────────────────────────────────────────────────────────────────────

export type ChallengeType =
  | 'incorrect'
  | 'unsupported'
  | 'outdated'
  | 'privacy_violation'
  | 'cross_tenant_leakage'
  | 'identity_drift'
  | 'policy_violation'
  | 'poisoned_memory'
  | 'unsafe_tool_output';

export type ChallengeRequestedEffect =
  | 'mark_contested'
  | 'demote'
  | 'revoke'
  | 'forget_from_recall'
  | 'seal'
  | 'human_review';

export interface Challenge {
  challenge_id: ID;
  estate_id: ID;
  actor_id: ID;
  target_assertion_id: ID;
  challenge_type: ChallengeType;
  requested_effect: ChallengeRequestedEffect;
  evidence_refs: ProvenanceRef[];
  explanation: string;
  signatures: SignatureEnvelope[];
  created_at: ISO8601;
}

export interface Revocation {
  revocation_id: ID;
  estate_id: ID;
  actor_id: ID;
  target_assertion_id: ID;
  reason: string;
  signatures: SignatureEnvelope[];
  created_at: ISO8601;
}

export interface ForgetRecord {
  forget_id: ID;
  estate_id: ID;
  actor_id: ID;
  target_assertion_id: ID;
  reason: string;
  signatures: SignatureEnvelope[];
  created_at: ISO8601;
}

// Phase 3 — structured receipts for every transition. Distinct from the
// audit event (which is a chained log entry). Receipts are first-class
// artifacts that downstream commitment / inspection / appeal flows consume.
// One discriminated type covers AdmissionReceipt, DeniedTransitionReceipt,
// ChallengeReceipt, RevocationReceipt, ForgetReceipt (§14.3).

export type TransitionReceiptKind =
  | 'admission'
  | 'denied'
  | 'challenge'
  | 'revocation'
  | 'forget';

export interface TransitionReceipt {
  receipt_id: ID;
  kind: TransitionReceiptKind;
  transition_id: ID;
  transition_type: EstateTransition['transition_type'];
  estate_id: ID;
  actor_id: ID;
  target_refs: ID[];
  decision: PolicyDecisionOutcome;
  policy_decision: PolicyDecision;
  signer_refs: ID[];
  audit_event_ref: ID;
  reasons: string[];
  required_next_actions?: string[];
  metadata?: Record<string, unknown>;
  receipt_hash: Hash;
  created_at: ISO8601;
}

// ──────────────────────────────────────────────────────────────────────────────
// Recall (§11)
// ──────────────────────────────────────────────────────────────────────────────

export type EnvironmentFrame =
  | 'private_operator'
  | 'private_chat'
  | 'public_discord'
  | 'public_telegram'
  | 'repo_workflow'
  | 'tool_action_precheck'
  | 'audit_review';

export type ReceiptDetailLevel = 'minimal' | 'standard' | 'debug';

export interface RecallRequest {
  recall_request_id: ID;
  actor_id: ID;
  estate_id: ID;
  requested_by: ID;
  task: string;
  intent?: string;
  environment_frame: EnvironmentFrame;
  risk_profile: RiskLevel;
  requested_classes?: AssertionClass[];
  excluded_classes?: AssertionClass[];
  include_statuses?: AssertionStatus[];
  mark_statuses?: AssertionStatus[];
  exclude_statuses?: AssertionStatus[];
  max_items?: number;
  freshness_window?: string;
  include_provenance?: boolean;
  include_receipt_detail: ReceiptDetailLevel;
  signature: SignatureEnvelope;
  created_at: ISO8601;
}

export type RecallUseInstruction =
  | 'usable'
  | 'mark_as_contested'
  | 'use_as_background_only'
  | 'do_not_use_for_action';

export interface RecallItem {
  assertion_id: ID;
  assertion_class: AssertionClass;
  status: AssertionStatus;
  summary: string;
  body_ref?: string;
  provenance_refs: string[];
  confidence?: number;
  use_instruction: RecallUseInstruction;
}

export interface RedactionSummary {
  reason: string;
  count: number;
}

export interface ExclusionSummary {
  reason: string;
  count: number;
}

export interface RecallPack {
  recall_pack_id: ID;
  recall_request_id: ID;
  actor_id: ID;
  estate_id: ID;
  included: RecallItem[];
  marked: RecallItem[];
  redacted: RedactionSummary[];
  excluded_summary: ExclusionSummary[];
  policy_decision: PolicyDecision;
  receipt_id: ID;
  pack_hash: Hash;
  created_at: ISO8601;
}

export interface RecallReceipt {
  receipt_id: ID;
  recall_request_id: ID;
  recall_pack_id: ID;
  actor_id: ID;
  estate_id: ID;
  filters_applied: string[];
  included_assertion_ids: ID[];
  marked_assertion_ids: ID[];
  redacted_count: number;
  excluded_counts_by_reason: Record<string, number>;
  policy_decision_ref: string;
  requester_signature_ref: string;
  runtime_signature_ref?: string;
  pack_hash: Hash;
  receipt_hash: Hash;
  commitment_ref?: string;
  created_at: ISO8601;
  detail_level: ReceiptDetailLevel;
}

// ──────────────────────────────────────────────────────────────────────────────
// Audit + commitment (§13 §14)
// ──────────────────────────────────────────────────────────────────────────────

export type AuditEventType =
  | 'class_validation'
  | 'policy_validation'
  | 'transition_requested'
  | 'transition_allowed'
  | 'transition_denied'
  | 'assertion_admitted'
  | 'assertion_classified'
  | 'assertion_linked'
  | 'assertion_challenged'
  | 'assertion_demoted'
  | 'assertion_revoked'
  | 'assertion_forgotten_from_recall'
  | 'recall_requested'
  | 'recall_pack_emitted'
  | 'commitment_created'
  | 'feedback_recorded'
  | 'evaluation_recorded';

export interface AuditEvent {
  audit_event_id: ID;
  event_type: AuditEventType;
  actor_id: ID;
  estate_id: ID;
  transition_id?: ID;
  assertion_refs?: ID[];
  request_hash?: Hash;
  result_hash?: Hash;
  signer_refs: ID[];
  policy_decision_ref?: string;
  previous_audit_hash?: Hash;
  audit_hash: Hash;
  created_at: ISO8601;
  payload?: Record<string, unknown>;
}

export interface CommitmentRoot {
  commitment_id: ID;
  actor_id: ID;
  estate_id: ID;
  commitment_type:
    | 'estate_checkpoint'
    | 'recall_receipt'
    | 'transition_bundle'
    | 'revocation_checkpoint';
  root_hash: Hash;
  included_refs: ID[];
  schema_version: string;
  created_by: ID;
  signature: SignatureEnvelope;
  created_at: ISO8601;
  public_anchor_ref?: string;
}

// Candidate object types — what enters the system before admission.

export interface CandidateAssertion {
  estate_id: ID;
  actor_id: ID;
  assertion_class: AssertionClass;
  body: Record<string, unknown>;
  schema_version?: string;
  provenance: ProvenanceRef[];
  privacy_scope?: PrivacyScope;
  risk_level?: RiskLevel;
  recall_scope?: string[];
  confidence?: number;
  subject_refs?: string[];
  linked_assertion_refs?: string[];
  signatures: SignatureEnvelope[];
}
