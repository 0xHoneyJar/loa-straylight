// Type surface for tests/tooling. Runtime source of truth: collection.mjs
//
// Watchdog dual-collection evidence: staged S0→S6 derivations (issue
// slots from enumeration ONLY — the schema has no PR field; PR slots only
// after issue/comment evidence + reconstruction; seal re-derives and
// verifies every ledger claim), per-collection re-verification, canonical
// planning projection, and the A/B equivalence gate with specific
// refusal codes.

export declare const ISSUE_SLOTS_SCHEMA: "straylight.collection-issue-slots.v1";
export declare const PR_SLOTS_SCHEMA: "straylight.collection-pr-slots.v1";
export declare const MANIFEST_SCHEMA: "straylight.collection-manifest.v1";
export declare const COLLECTION_IDS: readonly ["A", "B"];

export interface CollectionFailure {
  ok: false;
  reason: string;
  detail?: string;
}

export interface IssueSlotsDocument {
  schema: typeof ISSUE_SLOTS_SCHEMA;
  collection_id: "A" | "B";
  nonce: string;
  enumeration_sha256: string;
  /** Sorted, unique; NO other fields — structurally cannot carry PR slots. */
  issue_slots: number[];
}

export interface PrSlot {
  issue_number: number;
  pr_number: number;
}

export interface PrSlotsDocument {
  schema: typeof PR_SLOTS_SCHEMA;
  collection_id: "A" | "B";
  nonce: string;
  enumeration_sha256: string;
  pr_slots: PrSlot[];
}

export interface LedgerRow {
  nonce: string;
  collection_id: "A" | "B";
  resource: "enumeration" | "issue" | "comments" | "pr";
  issue_number?: number;
  pr_number?: number;
  /** false is ONLY legal for pr rows — an explicit durable failure fact. */
  fetched: boolean;
  path?: string;
  sha256?: string;
}

export interface CollectionManifest {
  schema: typeof MANIFEST_SCHEMA;
  collection_id: "A" | "B";
  nonce: string;
  enumeration_sha256: string;
  issue_slots: number[];
  pr_slots: PrSlot[];
  resources: Array<Omit<LedgerRow, "nonce" | "collection_id">>;
}

export interface LaneProjection {
  issue_number: number;
  lane_id: string;
  reconstructed: Record<string, unknown>;
  comment_evidence_digest: string;
  issue_updated_at: string;
}

export interface PlanningProjection {
  issue_slots: number[];
  unreadable: Array<{ number: number; reason: string }>;
  excluded_prs: number[];
  lanes: LaneProjection[];
  /** Per-issue evidence digests for EVERY enumerated slot (lane or not). */
  issue_evidence: Record<string, { comment_evidence_digest: string; updated_at: string }>;
  pr_slots: PrSlot[];
  pr_outcomes: Record<
    string,
    { metadata: Record<string, unknown>; head_sha: string } | { failed: true }
  >;
}

export declare function sha256OfBytes(bytes: Buffer | string): string;

export declare function deriveIssueSlots(
  enumerationBytes: Buffer,
  identity: { collection_id: string; nonce: string; repository: string }
): { ok: true; document: IssueSlotsDocument } | CollectionFailure;

export declare function validateIssueSlotsDocument(
  doc: unknown
): { ok: true } | CollectionFailure;

export declare function reconstructCollectionLanes(
  enumerationBytes: Buffer,
  issueEvidence: Map<number, { issueBytes?: Buffer; commentBytes?: Buffer }>,
  options: { repository: string; policy: unknown; now: string }
):
  | {
      ok: true;
      lanes: unknown[];
      issues: unknown[];
      /** Parsed issue + comment evidence for EVERY enumerated slot. */
      issueRecords: Map<number, { issue: unknown; comments: unknown[] }>;
      unreadable: unknown[];
      excluded_prs: number[];
    }
  | CollectionFailure;

export declare function derivePrSlots(
  enumerationBytes: Buffer,
  issueEvidence: Map<number, { issueBytes?: Buffer; commentBytes?: Buffer }>,
  options: { collection_id: string; nonce: string; repository: string; policy: unknown; now: string }
): { ok: true; document: PrSlotsDocument } | CollectionFailure;

export declare function parseLedger(
  text: string,
  identity: { collection_id: string; nonce: string }
): { ok: true; rows: LedgerRow[] } | CollectionFailure;

export declare function sealCollection(options: {
  ledgerText: string;
  readFile: (path: string) => Buffer | null;
  collection_id: string;
  nonce: string;
  repository: string;
  policy: unknown;
  now: string;
  issueSlotsDocument: unknown;
  prSlotsDocument?: unknown;
}): { ok: true; manifest: CollectionManifest } | CollectionFailure;

export declare function verifyAndProjectCollection(options: {
  ledgerText: string;
  manifestText: string;
  readFile: (path: string) => Buffer | null;
  collection_id: string;
  nonce: string;
  repository: string;
  policy: unknown;
  now: string;
}):
  | { ok: true; projection: PlanningProjection; projection_digest: string; world: unknown }
  | CollectionFailure;

/**
 * The A/B equivalence gate: refusal codes ab-issue-set-difference,
 * ab-lane-set-difference, ab-lane-mapping-difference,
 * ab-reconstruction-difference, ab-comment-evidence-difference,
 * ab-pr-slot-difference, ab-pr-metadata-difference,
 * ab-head-sha-difference, ab-fetch-outcome-difference, and the catch-all
 * ab-canonical-digest-difference. Equivalent explicit PR failures in
 * both collections do NOT refuse.
 */
export declare function compareProjections(
  a: PlanningProjection,
  b: PlanningProjection
): { ok: true } | CollectionFailure;
