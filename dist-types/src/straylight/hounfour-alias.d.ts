import type { AgentIdentity, CapabilityScope as HounfourCapabilityScope } from '@0xhoneyjar/loa-hounfour/core';
/**
 * Phase 17B alias: Hounfour `AgentIdentity` => `Actor` (delta #10).
 *
 * The wedge's existing `Actor` type (defined in
 * `src/straylight/types.ts`) is the wedge-side runtime truth. This
 * alias names the Hounfour `AgentIdentity` type as `Actor` at the
 * alias-module boundary so that a future shadow-integration test
 * can compare them side-by-side without two transitively-imported
 * `AgentIdentity` types silently merging into a single nominal
 * type at the wedge.
 *
 * Phase 17B does not yet wire any wedge call site to this alias.
 */
export type Actor = AgentIdentity;
/**
 * Phase 17B alias: Hounfour `CapabilityScope` (delta #4).
 *
 * Re-exported as a type so a future shadow-integration test can
 * assert the wedge's per-primitive capability fields map onto the
 * harmonized scope discriminator without forcing a runtime
 * migration in this PR.
 */
export type CapabilityScope = HounfourCapabilityScope;
