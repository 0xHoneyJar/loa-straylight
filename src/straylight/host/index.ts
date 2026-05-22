// Phase 24C — Dixie recall-host MVP scaffold: local barrel.
//
// This barrel is INTENTIONALLY NOT re-exported through
// `src/straylight/index.ts` (the wedge's stable public API). Per
// adjustment §2 of the Phase 24C constraints:
//   * "Do not re-export `src/straylight/host/*` through
//     `src/straylight/index.ts`."
//   * "Keep `src/straylight/host/index.ts` as the local barrel only."
//   * "The host scaffold may import the existing wedge public API,
//     but the wedge public API should not import the host scaffold."
//
// Consumers of the host (tests, future Dixie BFF) import from
// `@straylight/host` / `src/straylight/host/index.js` directly.
//
// Phase 30 — host-consumable Recall Wedge contract seam.
//
// The Phase 29B Recall Wedge host contract (authored under
// `src/straylight/host/recall-wedge-contract.ts`) is exposed
// through THIS host barrel so a future Dixie BFF / inspection
// consumer may import it from the existing `@loa/straylight/host`
// package surface (the `./host` export is `types`-only per
// `package.json`; Dixie consumes the contract at the TYPE level
// only — no runtime/policy/storage/audit/signature/signer wiring
// is added by Phase 30). The contract module imports nothing from
// any other Straylight module; pulling its exports through this
// barrel does NOT widen the runtime surface of the host scaffold.

export * from './types.js';

export { checkSameTenant } from './tenancy.js';
export type { TenantCheckResult, TenantResolver } from './tenancy.js';

export { createInMemoryIntakeDenyLog } from './intake-log.js';
export type { IntakeDenyEntry, IntakeDenyLog } from './intake-log.js';

export { handleRecallIntake } from './intake.js';
export type { IntakeDeps } from './intake.js';

export { handleReceiptRetrieval } from './receipt.js';
export type { ReceiptDeps } from './receipt.js';

export { handleExclusionDisplay } from './exclusion.js';

export { handleProvenanceWalk } from './provenance.js';
export type { ProvenanceDeps } from './provenance.js';

export { handleAuditChainLookup } from './audit-lookup.js';
export type { AuditLookupDeps } from './audit-lookup.js';

export { handleEstateSummary } from './estate-summary.js';
export type { EstateSummaryDeps } from './estate-summary.js';

// ── Phase 30 — Recall Wedge host contract (Dixie-first MVP) ─────────────────
//
// Re-exports the Phase 29B contract surface so a host consumer
// (Dixie-first inspection / BFF path) may import the contract
// from `@loa/straylight/host` instead of reaching into the
// in-tree `host/recall-wedge-contract.js` path.
//
// The contract module is the type / pure-helper authority; this
// barrel adds no behavior on top of it. The Phase 30 export is
// shape-only — no endpoint, no runtime recall, no policy, no
// signature verification, no signer-competence enforcement, no
// storage adapter, no audit-chain executor.

export {
  DEFAULT_RECALL_WEDGE_HOST_KIND,
  RECALL_WEDGE_ACTIVE_HOST_KINDS,
  RECALL_WEDGE_CONTRACT_BOUNDARY,
  STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION,
  assertRecallWedgeContractReadOnlyBoundary,
  createRecallWedgeInspectionReceipt,
  createRecallWedgeSourceCorpusRef,
  summarizeRecallWedgeInspection,
} from './recall-wedge-contract.js';
export type {
  RecallWedgeActorScope,
  RecallWedgeBoundaryOwner,
  RecallWedgeContractBoundary,
  RecallWedgeEnvironmentFrame,
  RecallWedgeEnvironmentSurface,
  RecallWedgeHostKind,
  RecallWedgeInclusionDecision,
  RecallWedgeInspectionItem,
  RecallWedgeInspectionReceipt,
  RecallWedgeInspectionRequest,
  RecallWedgeInspectionResult,
  RecallWedgeInspectionSummary,
  RecallWedgeRiskLevel,
  RecallWedgeSourceCorpusRef,
  StraylightRecallWedgeContractVersion,
} from './recall-wedge-contract.js';
