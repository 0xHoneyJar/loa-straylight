// Phase 29B — Straylight Recall Wedge host contract (Dixie-first MVP).
//
// LOCAL ADDITIVE, TYPE-ONLY / PURE-HELPER MODULE. NOT RUNTIME-WIRED.
//
// This module pins the Straylight-side host-facing contract that the
// Phase 29B Dixie-first recall-inspection / BFF path will eventually
// consume. It is the *contract* surface, not the runtime: it carries
// no storage, no network, no endpoint, no signature verification, no
// signer-competence enforcement, no policy evaluator, no audit-chain
// execution, and no recall-runtime behavior.
//
// Boundary owners (canonical, per ADR-029B-dixie-first-recall-wedge-contract.md):
//   * Hounfour      ships class / schema / conformance-vector substrate
//                   (the @0xhoneyjar/loa-hounfour@8.7.0 package, fixed
//                   at registry resolution per Phase 29A).
//   * Straylight    owns semantic meaning of the recall wedge: policy
//                   / runtime boundary, refusal / authorization
//                   semantics, signer-competence boundary, estate-
//                   transition meaning, recall semantics. This file
//                   is *Straylight's* contract, not Hounfour's.
//   * Dixie         is the first MVP recall inspection / BFF path.
//                   Dixie is NOT yet Straylight; Phase 29B defines the
//                   contract Dixie will later consume.
//   * Finn          is the later runtime-enforcement / audit-return
//                   boundary. It is represented here ONLY as a
//                   boundary marker, NOT as an active host kind.
//   * Loa           is the framework / control-plane boundary outside
//                   the wedge.
//
// Forbidden imports (enforced by tests/phase-29b-recall-wedge-contract.test.ts):
//   * src/straylight/runtime/**
//   * src/straylight/policy
//   * src/straylight/storage/**
//   * src/straylight/audit
//   * src/straylight/crypto/signature  (no Straylight crypto/signature module exists today; the
//                                       guard is held against any future appearance under the
//                                       same canonical path.)
//   * src/straylight/signer            (likewise — pinned guard against the canonical name.)
//
// This module is intentionally standalone: it imports from no other
// Straylight module. That preserves the read-only contract boundary
// (no transitive pull on runtime, policy, storage, audit, crypto, or
// signer code via any neighbouring host file).

// ──────────────────────────────────────────────────────────────────────────────
// Contract version
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Exact contract-version literal pinned by Phase 29B.
 *
 * Future revisions of the Straylight-side recall-wedge host contract
 * MUST bump this literal in lockstep with a successor ADR (e.g.,
 * ADR-029C, ADR-030A). Reviewers may cite this constant verbatim to
 * refuse a Phase 29B candidate that ships a different version.
 */
export const STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION =
  'phase-29b.recall-wedge-contract.v0' as const;

export type StraylightRecallWedgeContractVersion =
  typeof STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION;

// ──────────────────────────────────────────────────────────────────────────────
// Host kind + boundary owners
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Host kinds the Phase 29B contract recognises.
 *
 *   * `'dixie-first-inspection-bff'` — the active MVP host, the
 *     recall inspection / BFF path Dixie will consume.
 *   * `'finn-runtime-enforcement-later'` — a boundary marker for the
 *     later runtime-enforcement / audit-return host. Phase 29B does
 *     NOT authorize this kind as an active host; it appears in the
 *     type union ONLY so that downstream consumers may reference the
 *     boundary in handoff documentation and tests without inventing
 *     a new ad-hoc string.
 *   * `'test'` — an explicit test-frame value so the contract may be
 *     exercised in Vitest without claiming Dixie or Finn semantics.
 */
export type RecallWedgeHostKind =
  | 'dixie-first-inspection-bff'
  | 'finn-runtime-enforcement-later'
  | 'test';

/**
 * The active Phase 29B MVP host kind.
 *
 * Only `'dixie-first-inspection-bff'` is an active host under the
 * Phase 29B contract. Finn appears in {@link RecallWedgeHostKind}
 * only as a boundary marker, not as an active host.
 */
export const RECALL_WEDGE_ACTIVE_HOST_KINDS = [
  'dixie-first-inspection-bff',
] as const satisfies ReadonlyArray<RecallWedgeHostKind>;

/**
 * The Phase 29B default host kind. Dixie-first by ADR-029B selection.
 */
export const DEFAULT_RECALL_WEDGE_HOST_KIND: RecallWedgeHostKind =
  'dixie-first-inspection-bff';

/**
 * Boundary owners across the recall-wedge contract surface. Each
 * owner is responsible for a specific lane; ownership is enumerated
 * (not derived) so reviewers may cite the union verbatim.
 */
export type RecallWedgeBoundaryOwner =
  | 'straylight'
  | 'hounfour'
  | 'dixie'
  | 'finn'
  | 'loa';

// ──────────────────────────────────────────────────────────────────────────────
// Source corpus reference (Hounfour-shipped substrate)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Stable identifier for the published Hounfour package that ships the
 * recall-wedge conformance-vector corpus consumed by Straylight as
 * test substrate. Pinned by Phase 29A.
 *
 * The literals below are the type-level metadata only. The Phase
 * 24C "no Hounfour import in the host directory" forbidden-import
 * guard (now tightened to import-syntax matching) is preserved
 * verbatim across Phase 29B; this module imports nothing from
 * Hounfour and only names the package via these constants.
 */
const HOUNFOUR_PACKAGE_NAME_LITERAL = '@0xhoneyjar/loa-hounfour' as const;
const HOUNFOUR_PACKAGE_VERSION_LITERAL = '8.7.0' as const;
const HOUNFOUR_RECALL_WEDGE_CORPUS_NAME =
  'recall-wedge-conformance-vectors' as const;
const HOUNFOUR_RECALL_WEDGE_PATH_PREFIX = '/loa-hounfour/8.7.0/' as const;

/**
 * Reference to the Hounfour-shipped recall-wedge conformance-vector
 * corpus. The reference is *type-only metadata*: it does not load,
 * verify, hash, or validate the corpus. Verification of vector
 * accessibility lives in `tests/phase-29a-hounfour-vector-access.test.ts`.
 */
export interface RecallWedgeSourceCorpusRef {
  /** Always `'@0xhoneyjar/loa-hounfour'`. */
  packageName: typeof HOUNFOUR_PACKAGE_NAME_LITERAL;
  /** Always `'8.7.0'` for the Phase 29B contract version. */
  packageVersion: typeof HOUNFOUR_PACKAGE_VERSION_LITERAL;
  /** Always `'recall-wedge-conformance-vectors'`. */
  corpus: typeof HOUNFOUR_RECALL_WEDGE_CORPUS_NAME;
  /**
   * Stable schema-`$id` / on-disk path prefix that downstream
   * consumers may use as a string-only routing key. Phase 29A proved
   * the corpus ships under this prefix; Phase 29B records the prefix
   * as metadata only (no path is dereferenced from this module).
   */
  pathPrefix: typeof HOUNFOUR_RECALL_WEDGE_PATH_PREFIX;
  /**
   * Optional package-lock integrity hash (e.g., `'sha512-…'`). When
   * present this is metadata only — it is NOT cryptographic
   * enforcement. Phase 29B authorizes no signature verification.
   */
  integrity?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Actor scope + environment frame
// ──────────────────────────────────────────────────────────────────────────────

/**
 * The actor / estate scope a recall-inspection request is bound to.
 * Tenancy and environment dimensions are optional so the contract
 * can describe single-tenant, multi-tenant, and environment-scoped
 * recall surfaces without forcing a default.
 */
export interface RecallWedgeActorScope {
  actor_id: string;
  estate_id: string;
  tenant_id?: string;
  environment_id?: string;
}

/**
 * Coarse risk-level union surfaced as metadata on environment
 * frames. The wedge defines a similar `RiskLevel` over its own
 * `Assertion` shape; the Phase 29B contract restates the surface
 * here as a string union so the contract remains independent of
 * runtime types.
 */
export type RecallWedgeRiskLevel =
  | 'low'
  | 'standard'
  | 'high'
  | 'restricted';

/**
 * Surface label naming the consumer the request originates from.
 *
 *   * `'operator'`     — direct operator inspection (privileged).
 *   * `'dixie-bff'`    — the Phase 29B Dixie-first BFF path.
 *   * `'finn-runtime'` — boundary marker for the later Finn runtime
 *                        host. Phase 29B does NOT authorize this
 *                        surface as active; it exists ONLY so the
 *                        type can describe the boundary.
 *   * `'test'`         — Vitest-only surface for executable contract
 *                        tests (this Phase 29B test file).
 */
export type RecallWedgeEnvironmentSurface =
  | 'operator'
  | 'dixie-bff'
  | 'finn-runtime'
  | 'test';

/**
 * Environment frame attached to a recall-inspection request.
 * `risk_level` is optional; consumers that want a risk-aware
 * request shape provide it, others omit it.
 */
export interface RecallWedgeEnvironmentFrame {
  purpose: string;
  surface: RecallWedgeEnvironmentSurface;
  risk_level?: RecallWedgeRiskLevel;
}

// ──────────────────────────────────────────────────────────────────────────────
// Inspection request / decision / item / receipt
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Recall-inspection request the Dixie-first host will consume.
 * `requested_classes` and `requested_statuses` are optional string
 * filters. The three boolean knobs (`include_challenged`,
 * `include_revoked`, `include_forgotten`) are explicit so the host
 * cannot silently widen the recall surface — every flag must be
 * stated.
 */
export interface RecallWedgeInspectionRequest {
  request_id: string;
  actor_scope: RecallWedgeActorScope;
  environment: RecallWedgeEnvironmentFrame;
  requested_classes?: ReadonlyArray<string>;
  requested_statuses?: ReadonlyArray<string>;
  include_challenged: boolean;
  include_revoked: boolean;
  include_forgotten: boolean;
  source_corpus: RecallWedgeSourceCorpusRef;
}

/**
 * Inclusion decision for a single inspected assertion. The four
 * outcomes are total: every inspected item resolves to exactly one.
 */
export type RecallWedgeInclusionDecision =
  | 'include'
  | 'exclude'
  | 'redact'
  | 'refuse';

/**
 * One inspected assertion or vector under the Phase 29B contract.
 * `assertion_id` and `vector_id` are both surfaced because Phase 29A
 * exposed conformance vectors as the test substrate; downstream
 * Dixie integration may inspect either an Assertion or a vector.
 */
export interface RecallWedgeInspectionItem {
  assertion_id?: string;
  vector_id?: string;
  decision: RecallWedgeInclusionDecision;
  reason: string;
  source_ref: RecallWedgeSourceCorpusRef;
  /**
   * Optional human-facing note describing how the item should be
   * used (e.g., `'render redacted'`, `'omit from active context'`).
   */
  use_instruction?: string;
}

/**
 * Receipt summarising the outcome of a single inspection request.
 * The four counters are derived from {@link RecallWedgeInclusionDecision}
 * and MUST sum to the inspected-item count.
 */
export interface RecallWedgeInspectionReceipt {
  receipt_id: string;
  request_id: string;
  contract_version: StraylightRecallWedgeContractVersion;
  host_kind: RecallWedgeHostKind;
  /**
   * Compact human-facing boundary-owner sentence. Phase 29B does
   * not constrain wording; downstream Dixie integration may render
   * it directly to operators.
   */
  boundary_summary: string;
  included_count: number;
  excluded_count: number;
  redacted_count: number;
  refused_count: number;
  source_corpus: RecallWedgeSourceCorpusRef;
  /** Optional ISO-8601 timestamp the receipt was created at. */
  generated_at?: string;
}

/**
 * Full inspection result: request, per-item decisions, and the
 * derived receipt. Consumers wire all three together; the contract
 * does NOT compute the items, it only describes their shape.
 */
export interface RecallWedgeInspectionResult {
  request: RecallWedgeInspectionRequest;
  items: ReadonlyArray<RecallWedgeInspectionItem>;
  receipt: RecallWedgeInspectionReceipt;
}

// ──────────────────────────────────────────────────────────────────────────────
// Read-only boundary marker
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Constant boundary object naming each owner under the Phase 29B
 * contract. Reviewers may cite this object verbatim to refuse a
 * Phase 29B candidate that asserts a different ownership lane.
 */
export const RECALL_WEDGE_CONTRACT_BOUNDARY = {
  contract_version: STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION,
  owners: {
    hounfour:
      'class / schema / conformance-vector substrate (Phase 29A package).',
    straylight:
      'semantic meaning, policy / runtime boundary, refusal / authorization, signer competence boundary, estate transitions, recall semantics.',
    dixie:
      'first MVP recall inspection / BFF path; consumes the Phase 29B contract. Not yet Straylight.',
    finn:
      'later runtime-enforcement / audit-return boundary. Not an active host under Phase 29B.',
    loa: 'framework / control-plane boundary outside the wedge.',
  },
  active_host_kinds: RECALL_WEDGE_ACTIVE_HOST_KINDS,
} as const;

/**
 * Type of the {@link RECALL_WEDGE_CONTRACT_BOUNDARY} constant.
 */
export type RecallWedgeContractBoundary =
  typeof RECALL_WEDGE_CONTRACT_BOUNDARY;

/**
 * Asserts that a candidate value still satisfies the Phase 29B
 * read-only boundary. The function performs no I/O, no network, no
 * storage, and no policy evaluation; it is a structural type-and-
 * shape gate that throws on drift.
 */
export function assertRecallWedgeContractReadOnlyBoundary(
  value?: RecallWedgeContractBoundary,
): asserts value is RecallWedgeContractBoundary {
  const candidate = value ?? RECALL_WEDGE_CONTRACT_BOUNDARY;
  if (
    candidate.contract_version !== STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION
  ) {
    throw new Error(
      `Recall-wedge contract boundary version mismatch: expected ${STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION}, got ${String(
        candidate.contract_version,
      )}`,
    );
  }
  const requiredOwners: ReadonlyArray<RecallWedgeBoundaryOwner> = [
    'hounfour',
    'straylight',
    'dixie',
    'finn',
    'loa',
  ];
  for (const owner of requiredOwners) {
    const desc = candidate.owners[owner];
    if (typeof desc !== 'string' || desc.length === 0) {
      throw new Error(
        `Recall-wedge contract boundary missing description for owner: ${owner}`,
      );
    }
  }
  if (
    !candidate.active_host_kinds.includes('dixie-first-inspection-bff')
  ) {
    throw new Error(
      "Recall-wedge contract boundary must list 'dixie-first-inspection-bff' as an active host kind under Phase 29B.",
    );
  }
  const widenedActive: ReadonlyArray<RecallWedgeHostKind> =
    candidate.active_host_kinds;
  if (widenedActive.includes('finn-runtime-enforcement-later')) {
    throw new Error(
      "Recall-wedge contract boundary must NOT list 'finn-runtime-enforcement-later' as an active host kind under Phase 29B.",
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Build a {@link RecallWedgeSourceCorpusRef}. Optional `integrity`
 * is metadata only; Phase 29B authorizes no cryptographic
 * enforcement.
 */
export function createRecallWedgeSourceCorpusRef(
  init: { integrity?: string } = {},
): RecallWedgeSourceCorpusRef {
  const ref: RecallWedgeSourceCorpusRef = {
    packageName: HOUNFOUR_PACKAGE_NAME_LITERAL,
    packageVersion: HOUNFOUR_PACKAGE_VERSION_LITERAL,
    corpus: HOUNFOUR_RECALL_WEDGE_CORPUS_NAME,
    pathPrefix: HOUNFOUR_RECALL_WEDGE_PATH_PREFIX,
  };
  if (typeof init.integrity === 'string' && init.integrity.length > 0) {
    ref.integrity = init.integrity;
  }
  return ref;
}

/**
 * Per-decision counters used by {@link summarizeRecallWedgeInspection}
 * and {@link createRecallWedgeInspectionReceipt}. Sums to the
 * inspected-item count.
 */
export interface RecallWedgeInspectionSummary {
  included_count: number;
  excluded_count: number;
  redacted_count: number;
  refused_count: number;
}

/**
 * Count items per decision. Pure: no I/O, no allocation beyond the
 * returned object.
 */
export function summarizeRecallWedgeInspection(
  items: ReadonlyArray<RecallWedgeInspectionItem>,
): RecallWedgeInspectionSummary {
  const summary: RecallWedgeInspectionSummary = {
    included_count: 0,
    excluded_count: 0,
    redacted_count: 0,
    refused_count: 0,
  };
  for (const item of items) {
    switch (item.decision) {
      case 'include':
        summary.included_count += 1;
        break;
      case 'exclude':
        summary.excluded_count += 1;
        break;
      case 'redact':
        summary.redacted_count += 1;
        break;
      case 'refuse':
        summary.refused_count += 1;
        break;
    }
  }
  return summary;
}

/**
 * Compose a {@link RecallWedgeInspectionReceipt} from a request,
 * an inspected-item array, and an explicit receipt id. The function
 * is pure — it allocates nothing outside the returned receipt and
 * performs no I/O.
 */
export function createRecallWedgeInspectionReceipt(input: {
  receipt_id: string;
  request: RecallWedgeInspectionRequest;
  items: ReadonlyArray<RecallWedgeInspectionItem>;
  host_kind?: RecallWedgeHostKind;
  boundary_summary?: string;
  generated_at?: string;
}): RecallWedgeInspectionReceipt {
  const summary = summarizeRecallWedgeInspection(input.items);
  const hostKind = input.host_kind ?? DEFAULT_RECALL_WEDGE_HOST_KIND;
  const boundarySummary =
    input.boundary_summary ??
    'Hounfour ships substrate; Straylight owns semantics; Dixie consumes the Phase 29B contract; Finn is later enforcement; Loa is framework-side.';
  const receipt: RecallWedgeInspectionReceipt = {
    receipt_id: input.receipt_id,
    request_id: input.request.request_id,
    contract_version: STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION,
    host_kind: hostKind,
    boundary_summary: boundarySummary,
    included_count: summary.included_count,
    excluded_count: summary.excluded_count,
    redacted_count: summary.redacted_count,
    refused_count: summary.refused_count,
    source_corpus: input.request.source_corpus,
  };
  if (typeof input.generated_at === 'string' && input.generated_at.length > 0) {
    receipt.generated_at = input.generated_at;
  }
  return receipt;
}
