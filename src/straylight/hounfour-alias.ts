// Phase 17B -- Hounfour v8.5.x alias / re-export boundary module.
//
// This module is the ONLY place inside the Straylight wedge where
// names from @0xhoneyjar/loa-hounfour appear at the JS module
// boundary. It is NOT re-exported from src/straylight/index.ts:
// the wedge's stable public surface (per
// docs/mvp/package-boundary.md, the only import path future
// sibling repos are expected to use) does not change in Phase 17B.
//
// Phase 17B does NOT wire any wedge call site to consume this
// alias. It is a forward-looking boundary pin. The wedge's local
// types in src/straylight/types.ts remain the runtime source of
// truth; the alias here only stages the Hounfour-side names a
// future migration phase will consume once it is ready.
//
// Constraints (see docs/handoffs/hounfour-adaptation-delta.md):
//
//   * delta #3  -- Straylight-side alias / re-export. This file IS
//                 that layer.
//   * delta #9  -- Subpath imports only. Imports go through
//                 @0xhoneyjar/loa-hounfour/core (a confirmed named
//                 export of the v8.5.x package). Never the package
//                 root.
//   * delta #10 -- Alias AgentIdentity as Actor at the boundary, to
//                 prevent transitive cross-version drift through a
//                 nominally-shared identity type.
//   * delta #4  -- CapabilityScope is the harmonized discriminator
//                 from Hounfour's core surface; staged here for a
//                 future shadow-integration test to compare against
//                 the wedge's per-primitive capability fields.
//   * delta #7  -- Challenge stays local (src/straylight/types.ts)
//                 until Hounfour cycle-005 / v8.6.0 ships it. This
//                 module does NOT import or re-export Challenge.
//   * delta #8  -- EstateTransition stays local until Hounfour
//                 cycle-005 / v8.6.0 ships it. This module does
//                 NOT import or re-export EstateTransition.
//
// Out of scope for Phase 17B:
//
//   * Importing safeCanonicalize. v8.5.x does not export a
//     ./canonicalize or ./utilities subpath; selecting a subpath
//     for safeCanonicalize is deferred until a later phase confirms
//     an explicit exported path or files a Hounfour blocker.
//   * Importing schema bytes through this module. Phase 17B's
//     inspector reads schema bytes via node:fs from the installed
//     package directory; that is a filesystem read, not a JS
//     package import, and it does not weaken the subpath discipline
//     at the JS module boundary.
//   * Re-exporting this module from src/straylight/index.ts. The
//     wedge's public surface is unchanged in Phase 17B.

// Subpath import only -- never from '@0xhoneyjar/loa-hounfour' root.
import type {
  AgentIdentity,
  CapabilityScope as HounfourCapabilityScope,
} from '@0xhoneyjar/loa-hounfour/core';

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
