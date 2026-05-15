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
