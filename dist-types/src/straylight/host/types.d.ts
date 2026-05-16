import type { AssertionClass, AssertionStatus, AuditEvent, PrivacyScope, ProvenanceSourceType, RecallPack, RecallReceipt, RecallRequest, ReceiptDetailLevel, RiskLevel } from '../types.js';
/**
 * Host-facing environment frame. Narrower than the wedge's `EnvironmentFrame`
 * by design — the host surfaces in-slice are scoped to two frames per
 * docs/specs/dixie-recall-host-mvp-contract.md Surfaces 4 & 6. Any other
 * frame value MUST be refused at the host layer (`frame_unsupported`).
 */
export type HostFrame = 'actor_private' | 'public_discord';
export interface HostCaller {
    tenant_id: string;
    actor_id: string;
    session_id?: string;
    /** Required for Surfaces 4 and 6; optional/unused for Surfaces 1, 2, 3, 5. */
    frame?: HostFrame;
}
/** Six-category receipt vocabulary pinned by ADR-020D §6 + spec §"Status taxonomy". */
export type ExclusionReason = 'included' | 'excluded' | 'redacted' | 'challenged' | 'revoked' | 'blocked-by-policy';
/**
 * Closed enum of denial reasons surfaced on Surface 1. Every value is derived
 * from a wedge outcome (class_validation, policy_decision, recall denial) or
 * a host-layer intake refusal (cross-tenant, frame_unsupported). The host
 * never invents a denial reason that does not map back to one of these.
 */
export type DeniedReason = 'class_validation_failed' | 'policy_unavailable' | 'signer_not_competent' | 'cross_tenant_recall_refused' | 'storage_unavailable' | 'blocked_by_policy' | 'privacy_scope_refusal' | 'frame_unsupported' | 'tenant_resolution_failed';
export interface RecallIntakeRequest {
    request: RecallRequest;
    detail_level: ReceiptDetailLevel;
    caller: HostCaller;
}
export type RecallIntakeResponse = {
    outcome: 'served';
    pack: RecallPack;
    receipt: RecallReceipt;
    audit_event_id?: string;
} | {
    outcome: 'denied';
    reason: DeniedReason;
    raw_reasons: string[];
    audit_event_id?: string;
    intake_log_entry_id?: string;
} | {
    outcome: 'needs_review';
    review_queue_id: string;
    raw_reasons: string[];
    audit_event_id?: string;
};
export interface ReceiptRetrievalRequest {
    receipt_id: string;
    detail_level: ReceiptDetailLevel;
    caller: HostCaller;
}
export type ReceiptRetrievalResponse = {
    outcome: 'found';
    receipt: RecallReceipt;
} | {
    outcome: 'not_found';
    reason: 'unknown_receipt_id' | 'cross_tenant_refused' | 'storage_unavailable' | 'tenant_resolution_failed';
};
export interface ExclusionDisplayRequest {
    pack: RecallPack;
    detail_level: ReceiptDetailLevel;
    caller: HostCaller;
}
export interface ExclusionAggregate {
    category: ExclusionReason;
    raw_reason: string;
    count: number;
}
export interface RedactionAggregate {
    category: 'redacted';
    raw_reason: string;
    count: number;
}
export interface MarkedItemDisplay {
    assertion_id: string;
    assertion_class: AssertionClass;
    status: AssertionStatus;
    category: ExclusionReason;
    raw_reason: string;
}
export interface ExclusionDisplayResponse {
    excluded_aggregates: ExclusionAggregate[];
    redacted_aggregates: RedactionAggregate[];
    marked: MarkedItemDisplay[];
}
export interface ProvenanceWalkRequest {
    assertion_id: string;
    detail_level: ReceiptDetailLevel;
    caller: HostCaller & {
        frame: HostFrame;
    };
}
export interface ProvenanceEntry {
    actor_id: string;
    ts: string;
    kind: ProvenanceSourceType;
    evidence_ref?: string;
}
export type ProvenanceWalkResponse = {
    outcome: 'walked';
    provenance: ProvenanceEntry[];
} | {
    outcome: 'refused';
    reason: 'privacy_scope_refusal' | 'cross_tenant_refused' | 'unknown_assertion' | 'storage_unavailable' | 'tenant_resolution_failed' | 'frame_unsupported';
};
export interface AuditChainLookupRequest {
    estate_id: string;
    detail_level: ReceiptDetailLevel;
    caller: HostCaller;
}
export type AuditChainLookupResponse = {
    outcome: 'verified';
    events: AuditEvent[];
    chain_status: 'ok';
} | {
    outcome: 'broken';
    events: AuditEvent[];
    chain_status: 'broken';
    break_index: number;
    break_reason: string;
} | {
    outcome: 'refused';
    reason: 'cross_tenant_refused' | 'unknown_estate' | 'storage_unavailable' | 'tenant_resolution_failed';
};
export interface EstateSummaryRequest {
    estate_id: string;
    detail_level: ReceiptDetailLevel;
    caller: HostCaller & {
        frame: HostFrame;
    };
}
export interface EstateSummaryCounts {
    by_class: Record<string, number>;
    by_status: Record<AssertionStatus, number>;
    /**
     * Spec 2-key shape. Frame discipline applied: when caller.frame is
     * `public_discord`, the `actor_private` count is zeroed out (the
     * widened map below still surfaces the raw counts for traceability).
     */
    by_privacy_scope: {
        actor_private: number;
        public_discord: number;
    };
    by_risk_level: Record<RiskLevel, number>;
    /**
     * Widened 4-key map mirroring the wedge's `PrivacyScope` enum. Frame
     * discipline does NOT apply here; this is the raw bucket count and
     * exists for trace/debug only. Host consumers MUST prefer
     * `by_privacy_scope` for operator-facing render.
     */
    _widened_privacy_scope: Record<PrivacyScope, number>;
}
export type EstateSummaryResponse = {
    outcome: 'summarized';
    actor_id: string;
    estate_id: string;
    counts: EstateSummaryCounts;
} | {
    outcome: 'refused';
    reason: 'cross_tenant_refused' | 'unknown_estate' | 'privacy_scope_refusal' | 'storage_unavailable' | 'tenant_resolution_failed' | 'frame_unsupported';
};
