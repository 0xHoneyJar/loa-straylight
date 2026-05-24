// Governed recall (§11) — produce a RecallPack + RecallReceipt for a request.
//
// Order is fixed by §11.6:
//   policy/class/status/provenance prefilter
//   → candidate retrieval (here: full estate scan; vector layer plugs in later)
//   → postfilter
//   → pack assembly
//   → receipt

import { sha256 } from './canonical.js';
import { contentId } from './ids.js';
import { dispositionFor, policyForRecallRequest } from './policy.js';
import { validateRecallRequest } from './validators/class-validator.js';
import type { EstateStore } from './estate.js';
import type {
  Assertion,
  ClassValidationResult,
  ExclusionSummary,
  PolicyDecision,
  RecallItem,
  RecallPack,
  RecallReceipt,
  RecallRequest,
  RecallUseInstruction,
  RedactionSummary,
} from './types.js';

export interface RecallOutcome {
  ok: boolean;
  request: RecallRequest;
  class_validation: ClassValidationResult;
  policy_decision: PolicyDecision;
  pack?: RecallPack;
  receipt?: RecallReceipt;
  audit_event_id?: string;
}

export function executeRecall(store: EstateStore, request: RecallRequest, now: string): RecallOutcome {
  const class_validation = validateRecallRequest(request);
  if (!class_validation.valid) {
    const fail = recordRecallDeny(store, request, now, {
      decision: 'deny',
      policy_id: 'straylight.default-agent-estate.v0',
      policy_version: '0.1.0',
      signer_competence_result: { allowed: false, reason: 'class_validation_failed' },
      reasons: class_validation.errors.map((e) => `class:${e.code}:${e.path}`),
      decided_at: now,
    });
    return { ok: false, request, class_validation, policy_decision: fail.policy_decision, audit_event_id: fail.audit_event_id };
  }

  const policy_decision = policyForRecallRequest({
    request,
    keyring: store.getKeyring(),
    now,
  });

  if (policy_decision.decision === 'deny' || policy_decision.decision === 'needs_review') {
    const fail = recordRecallDeny(store, request, now, policy_decision);
    return { ok: false, request, class_validation, policy_decision, audit_event_id: fail.audit_event_id };
  }

  // Candidate retrieval: full scan of the estate. Vector / keyword retrievers
  // would slot in here BEHIND the prefilter, never above it.
  const candidates = store.listAssertions().filter((a) => a.estate_id === request.estate_id);

  const included: RecallItem[] = [];
  const marked: RecallItem[] = [];
  const redacted: RedactionSummary[] = [];
  const excludedCounts = new Map<string, number>();

  const redactionOf = (reason: string) => {
    const existing = redacted.find((r) => r.reason === reason);
    if (existing) existing.count += 1;
    else redacted.push({ reason, count: 1 });
  };
  const bumpExclusion = (reason: string) => {
    excludedCounts.set(reason, (excludedCounts.get(reason) ?? 0) + 1);
  };

  // Stable ordering for deterministic pack hashes (sort by created_at then id).
  candidates.sort((a, b) => {
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
    return a.assertion_id < b.assertion_id ? -1 : 1;
  });

  for (const a of candidates) {
    const disp = dispositionFor(a, request);
    switch (disp.kind) {
      case 'include':
        included.push(buildRecallItem(a, 'usable', request.include_provenance ?? false));
        break;
      case 'mark':
        marked.push(
          buildRecallItem(
            a,
            useInstructionForMark(disp.reason),
            request.include_provenance ?? false,
          ),
        );
        break;
      case 'redact':
        redactionOf(disp.reason);
        break;
      case 'exclude':
        bumpExclusion(disp.reason);
        break;
    }
  }

  // max_items truncation: applies to included; marked items remain to surface
  // contestation regardless of cap.
  if (request.max_items !== undefined && included.length > request.max_items) {
    const dropped = included.length - request.max_items;
    included.length = request.max_items;
    bumpExclusion(`max_items_truncation:${dropped}`);
  }

  const excluded_summary: ExclusionSummary[] = [...excludedCounts.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([reason, count]) => ({ reason, count }));

  const recall_pack_id = contentId({ request_id: request.recall_request_id, now }, { prefix: 'rpack' });
  const receipt_id = contentId({ recall_pack_id, now }, { prefix: 'rcpt' });

  const pack_hash = sha256({
    recall_pack_id,
    recall_request_id: request.recall_request_id,
    included: included.map((i) => ({ id: i.assertion_id, status: i.status, use: i.use_instruction })),
    marked: marked.map((i) => ({ id: i.assertion_id, status: i.status, use: i.use_instruction })),
    redacted,
    excluded_summary,
    policy_decision,
  });

  const filters_applied: string[] = [
    `environment_frame:${request.environment_frame}`,
    `risk_profile:${request.risk_profile}`,
    ...(request.requested_classes ? [`requested_classes:${request.requested_classes.join(',')}`] : []),
    ...(request.excluded_classes ? [`excluded_classes:${request.excluded_classes.join(',')}`] : []),
    ...(request.exclude_statuses ? [`exclude_statuses:${request.exclude_statuses.join(',')}`] : []),
    ...(request.mark_statuses ? [`mark_statuses:${request.mark_statuses.join(',')}`] : []),
    ...(request.include_statuses ? [`include_statuses:${request.include_statuses.join(',')}`] : []),
  ];

  // Audit event for the recall.
  const audit_event = store.auditLog.append({
    event_type: 'recall_pack_emitted',
    actor_id: request.actor_id,
    estate_id: request.estate_id,
    request_hash: sha256(request),
    result_hash: pack_hash,
    signer_refs: [request.signature.signer_id],
    policy_decision_ref: policy_decision.policy_id,
    payload: {
      included_count: included.length,
      marked_count: marked.length,
      excluded_summary,
      redacted,
      detail: request.include_receipt_detail,
    },
    created_at: now,
  });

  const pack: RecallPack = {
    recall_pack_id,
    recall_request_id: request.recall_request_id,
    actor_id: request.actor_id,
    estate_id: request.estate_id,
    included,
    marked,
    redacted,
    excluded_summary,
    policy_decision,
    receipt_id,
    pack_hash,
    created_at: now,
  };

  const receipt = redactReceipt(
    {
      receipt_id,
      recall_request_id: request.recall_request_id,
      recall_pack_id,
      actor_id: request.actor_id,
      estate_id: request.estate_id,
      filters_applied,
      included_assertion_ids: included.map((i) => i.assertion_id),
      marked_assertion_ids: marked.map((i) => i.assertion_id),
      redacted_count: redacted.reduce((acc, r) => acc + r.count, 0),
      redacted_counts_by_reason: redacted.map((r) => ({ reason: r.reason, count: r.count })),
      excluded_counts_by_reason: Object.fromEntries(excludedCounts),
      policy_decision_ref: policy_decision.policy_id,
      requester_signature_ref: request.signature.signature_id,
      pack_hash,
      receipt_hash: '',
      created_at: now,
      detail_level: request.include_receipt_detail,
    },
  );

  store.storage.upsertRecallReceipt(receipt);

  return {
    ok: true,
    request,
    class_validation,
    policy_decision,
    pack,
    receipt,
    audit_event_id: audit_event.audit_event_id,
  };
}

function buildRecallItem(
  a: Assertion,
  use_instruction: RecallUseInstruction,
  include_provenance: boolean,
): RecallItem {
  return {
    assertion_id: a.assertion_id,
    assertion_class: a.assertion_class,
    status: a.status,
    summary: summaryFor(a),
    body_ref: `assertion:${a.assertion_id}`,
    provenance_refs: include_provenance ? a.provenance.map((p) => p.provenance_id) : [],
    confidence: a.confidence,
    use_instruction,
  };
}

function summaryFor(a: Assertion): string {
  const text = (a.body as { text?: unknown }).text;
  if (typeof text === 'string') return text;
  return `${a.assertion_class}:${a.assertion_id}`;
}

function useInstructionForMark(reason: string): RecallUseInstruction {
  if (reason.startsWith('status_contested')) return 'mark_as_contested';
  if (reason.startsWith('status_demoted')) return 'use_as_background_only';
  if (reason.startsWith('status_superseded')) return 'use_as_background_only';
  return 'do_not_use_for_action';
}

function recordRecallDeny(
  store: EstateStore,
  request: RecallRequest,
  now: string,
  policy_decision: PolicyDecision,
): { audit_event_id: string; policy_decision: PolicyDecision } {
  const audit_event = store.auditLog.append({
    event_type: 'transition_denied',
    actor_id: request.actor_id,
    estate_id: request.estate_id,
    request_hash: sha256(request),
    signer_refs: [request.signature.signer_id],
    policy_decision_ref: policy_decision.policy_id,
    payload: {
      kind: 'recall_denied',
      decision: policy_decision.decision,
      reasons: policy_decision.reasons,
    },
    created_at: now,
  });
  return { audit_event_id: audit_event.audit_event_id, policy_decision };
}

// Redaction by detail level: receipts exposed at lower trust must not leak
// included/marked assertion IDs beyond what the level allows.
function redactReceipt(r: RecallReceipt): RecallReceipt {
  const computeHash = (toHash: RecallReceipt) =>
    sha256({
      receipt_id: toHash.receipt_id,
      recall_request_id: toHash.recall_request_id,
      recall_pack_id: toHash.recall_pack_id,
      actor_id: toHash.actor_id,
      estate_id: toHash.estate_id,
      filters_applied: toHash.filters_applied,
      included_assertion_ids: toHash.included_assertion_ids,
      marked_assertion_ids: toHash.marked_assertion_ids,
      redacted_count: toHash.redacted_count,
      redacted_counts_by_reason: toHash.redacted_counts_by_reason,
      excluded_counts_by_reason: toHash.excluded_counts_by_reason,
      pack_hash: toHash.pack_hash,
      detail_level: toHash.detail_level,
    });

  if (r.detail_level === 'minimal') {
    const minimal: RecallReceipt = {
      ...r,
      included_assertion_ids: [],
      marked_assertion_ids: [],
      filters_applied: r.filters_applied.filter((f) => f.startsWith('environment_frame:') || f.startsWith('risk_profile:')),
    };
    minimal.receipt_hash = computeHash(minimal);
    return minimal;
  }

  r.receipt_hash = computeHash(r);
  return r;
}
