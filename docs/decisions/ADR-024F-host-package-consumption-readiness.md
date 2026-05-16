# ADR-024F — Host package-consumption readiness (decision-lock for Phase 24G)

## Status

Accepted-for-Phase-24G.

This ADR is a **Phase 24G docs-only decision-lock and readiness
plan**. It records the package-consumption blockers that currently
prevent `loa-dixie` (and any other consumer) from replacing a
local mirror of the Straylight host scaffold with a real
`import type { ... } from '@loa/straylight/host'` (or
`import { ... } from '@loa/straylight/host'`), pins a policy frame
for exposing `./host` as a future Straylight package subpath, and
defines the entry / non-go conditions for a later implementation
phase that may add the minimum package / build / export surface
required to make `@loa/straylight/host` actually consumable.

This ADR sits on top of:

- ADR-024A
  ([`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)),
- ADR-024B
  ([`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md)),
- ADR-024C
  ([`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)),
- ADR-024D
  ([`./ADR-024D-phase-24b-implementation-branch.md`](./ADR-024D-phase-24b-implementation-branch.md)),
- ADR-024E
  ([`./ADR-024E-dixie-host-mvp-wire-shape.md`](./ADR-024E-dixie-host-mvp-wire-shape.md)).

This ADR is **docs-only**. It does **not** open a follow-up
implementation branch; does **not** edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc); does **not** touch
[`../../src/`](../../src/) / [`../../tests/`](../../tests/) /
[`../../fixtures/`](../../fixtures/) /
[`../../scripts/`](../../scripts/); does **not** edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md); does
**not** edit any prior ADR or prior handoff (other than the
README index entry authored alongside this ADR); does **not** edit
any sibling repo; does **not** file or edit any GitHub issue /
comment / PR; does **not** publish the package; does **not** bump,
downgrade, or reconcile the Hounfour dependency range; does **not**
import the Hounfour `#116` five-step conformance corpus; does
**not** adopt the `0xhoneyjar:straylight:*` audit-event prefix
family or the `recall-wedge` Hounfour conformance category into
the Straylight public surface; does **not** advance any ADR-022E
gate; does **not** publish a public commitment root; and does
**not** request or run Flatline / Bridgebuilder / red-team review.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24G.

## Context

Phase 24C
([`../handoffs/phase-24c-dixie-recall-host-scaffold.md`](../handoffs/phase-24c-dixie-recall-host-scaffold.md))
added a six-surface local TypeScript host scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) and a
local barrel at
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
Phase 24D
([`../handoffs/phase-24d-host-scaffold-hardening.md`](../handoffs/phase-24d-host-scaffold-hardening.md))
hardened that scaffold against six review concerns without
changing any shape. Phase 24E
([`../handoffs/phase-24e-dixie-host-handoff-packet.md`](../handoffs/phase-24e-dixie-host-handoff-packet.md))
translated the scaffold into an in-repo Dixie-side reading.
Phase 24F
([`../handoffs/phase-24f-dixie-host-issue-draft.md`](../handoffs/phase-24f-dixie-host-issue-draft.md))
produced a narrow, paste-ready Dixie-side issue / first-PR draft.
Per ADR-024E §"The next implementation branch", the host barrel
is **intentionally not re-exported** through the wedge public API
at [`../../src/straylight/index.ts`](../../src/straylight/index.ts);
the wedge public surface remains byte-identical to its pre-
Phase-24C state, and consumers — Dixie included — are expected to
import the host barrel directly under a future package boundary.

Dixie PR #96 (sibling repo) landed a **local adapter boundary**
inside `loa-dixie` — a small Dixie-side mirror of the host scaffold
types and handler signatures — rather than real `@loa/straylight`
consumption. The Dixie PR's authors observed (correctly) that
`@loa/straylight/host` is **not currently consumable** from
`loa-dixie` as a package import, and reached for a local mirror as
a deliberate pre-consumption seam rather than coupling Dixie to an
in-repo working-tree path.

The reason `@loa/straylight/host` is not currently consumable is
**not** a bug in the host scaffold and **not** a bug in Dixie. It
is a **public-surface / package-boundary decision** that
`loa-straylight` has not yet made. Concretely, the Straylight
package today:

1. is `"private": true` in
   [`../../package.json`](../../package.json) and is not published
   to any registry;
2. ships **no `exports` map** in `package.json`;
3. ships **no `./host` subpath** (a Dixie-side
   `import { ... } from '@loa/straylight/host'` cannot resolve
   under the current `package.json`);
4. has `"main": "src/straylight/index.ts"` — `main` points at a
   **TypeScript source file**, not at a build artifact;
5. declares **no `types` / `typings` field**;
6. has `"declaration": false` and `"noEmit": true` in
   [`../../tsconfig.json`](../../tsconfig.json) — the TypeScript
   compiler is configured for typecheck-only, not for `.d.ts`
   emission;
7. ships **no `build` script** in `package.json` (only `typecheck`,
   `test`, several `vite-node` script entries, and the demo /
   handoff exporters);
8. ships **no `dist/` directory** in the working tree and no
   convention for one;
9. has **no release tag** that an external consumer could pin
   (the `version` is `"0.0.1"` and the package is private);
10. has [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    pinning only
    [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
    as stable — the host barrel under
    [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
    is **not** described as part of the stable public surface in
    that document; and
11. carries an unresolved **Hounfour version skew** between
    `loa-straylight` (which declares
    `"@0xhoneyjar/loa-hounfour": "^8.6.0"`) and `loa-dixie` (which
    currently pins an older Hounfour ref) — even if the package /
    export / build issues were resolved tomorrow, Dixie would
    inherit Straylight's Hounfour resolution at install time and
    a flip without an explicit skew decision risks duplicate or
    conflicting Hounfour semantics in the Dixie build.

Each of these eleven facts is independently load-bearing. Any
single one of them, on its own, is sufficient to prevent
`import type { ... } from '@loa/straylight/host'` from
working in Dixie. Phase 24G records them as a decision-lock so a
future implementation phase has an enumerated, reviewable target.

This ADR is **not a bugfix**. The host scaffold is correct as
local in-repo TypeScript; the wedge public surface is correct as
locked; the host barrel's exclusion from the wedge public surface
is correct under ADR-024E §"The next implementation branch". The
question Phase 24G answers is the **package-boundary policy**
question: should `./host` become a *distinct, publicly-consumable
subpath of `@loa/straylight`* at all, and if so, under what
constraints?

The answer this ADR records is: **yes, but only under a deliberate
follow-up implementation phase that locks the package, export, and
build surface explicitly, preserves the one-way wedge↔host
dependency, decides the Hounfour-skew posture before any sibling-
repo dependency flip, and is reviewed as a public-surface widening
event rather than as incidental cleanup**.

## Decision

1. **Do not implement package consumption in Phase 24G.**
   Phase 24G is docs-only readiness. The eleven blockers in
   §"Context" above are recorded, not resolved. No edit to
   `package.json` / `package-lock.json` / `tsconfig.json` /
   `vitest.config.ts` / `.npmrc` is authorized by this ADR. No
   edit to [`../../src/`](../../src/), [`../../tests/`](../../tests/),
   [`../../fixtures/`](../../fixtures/), or
   [`../../scripts/`](../../scripts/) is authorized by this ADR.

2. **Treat `./host` exposure as a public-surface widening
   decision, not as incidental cleanup.** The local host scaffold
   under [`../../src/straylight/host/`](../../src/straylight/host/)
   is in-repo source; it is **not** part of the documented stable
   public surface in
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md). A
   future implementation phase that adds an `exports` map, a
   `./host` subpath, declaration output, and / or a build artifact
   is widening the package's public surface. It must be reviewed
   under the same care as the original Phase 5 boundary freeze —
   not as a tooling clean-up.

3. **Require a follow-up implementation phase before Dixie (or
   any consumer) can `import type { ... } from
   '@loa/straylight/host'`.** Until that phase merges, the
   correct posture for a sibling repo is the **local-adapter-
   mirror** posture Dixie PR #96 already adopted. The local
   adapter is transitional; it is **not** authorized to drift in
   shape from the upstream host barrel without an upstream-side
   discussion.

4. **Keep the wedge public entrypoint and the host entrypoint
   separate, with a strictly one-way dependency.** Concretely:

   - [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
     remains the **stable wedge surface** documented in
     [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
     Its symbol set is unchanged by Phase 24G.
   - [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
     remains a **local barrel** under Phase 24C / 24D / 24E / 24F
     discipline. A future implementation phase **may** promote it
     to a distinct `./host` subpath of `@loa/straylight`. If and
     when that happens, the host subpath is a **distinct public
     surface**, not a re-export through the wedge barrel.
   - The **wedge entrypoint must not import the host barrel**.
     The host scaffold imports from the wedge public API; the
     wedge public API does not import from the host scaffold. A
     future implementation phase that violates this one-way
     dependency is a non-conforming widening.

5. **Future consumption must be tag-pinned or release-pinned, not
   based on unpublished working-tree state.** A sibling repo
   pointing at `loa-straylight` via a git-source dependency on
   `main` HEAD, a commit-SHA pin against an unpublished tree, or
   a workspace-path link to a developer's local clone is **not**
   the consumption discipline this ADR authorizes. The follow-up
   implementation phase must decide whether Straylight stays
   private (consumed via tag-pinned git source) or moves to
   GitHub Packages (consumed via published `^x.y.z` ranges), but
   either way the consumption surface must be **named and
   stable**.

6. **Do not resolve Dixie / Hounfour version skew by downgrading
   Straylight or by consuming Hounfour `main`.** Straylight
   currently expects `@0xhoneyjar/loa-hounfour@^8.6.0`. The
   reconciliation path for the skew is a deliberate,
   ADR-024C-style three-event sequence (release → ADR adoption →
   shadow-integration check) executed on the Straylight side, or
   a deliberate Dixie-side bump under separate Dixie review — not
   a Straylight-side downgrade and not Hounfour `main`
   consumption. Either direction is non-conforming.

7. **Do not adopt Hounfour `#116`, `0xhoneyjar:straylight:*`, or
   the Hounfour `recall-wedge` conformance category as part of
   package-readiness.** The follow-up implementation phase
   inherits ADR-024A / ADR-024B / ADR-024C / ADR-024D / ADR-024E
   non-scope wholesale. Package-readiness is **not** an occasion
   to widen the wedge public surface to include `#116`-derived
   contracts. Adoption follows ADR-024C's Event A + Event B +
   Event C discipline independently.

## Recommended future implementation posture

This section is **advisory**, not binding. It is what the ADR
author currently considers the most plausible shape of the
follow-up implementation phase. A future implementation-phase ADR
(or RFC) may pin a different shape under teammate review,
provided it preserves the seven Decision rules above.

1. **The follow-up implementation phase is referred to in this
   ADR as "Phase 24H or later".** Phase 24G does **not** open the
   branch; Phase 24G does **not** name the branch beyond
   "Phase 24H-style". The next implementer may pick a narrower or
   broader descriptor under their own opening doc — the load-
   bearing condition is that the entry conditions in §"Future
   Phase 24H entry conditions" below are all satisfied.

2. **Prefer ESM-only.** The package is already `"type":
   "module"` in
   [`../../package.json`](../../package.json) and `"module":
   "ESNext"` / `"moduleResolution": "Bundler"` in
   [`../../tsconfig.json`](../../tsconfig.json). A future
   implementation phase **should** stay ESM-only; CommonJS
   compatibility shims are out of scope unless a specific
   consumer explicitly requires them, and any such requirement
   should be re-examined before being accommodated.

3. **Prefer declaration-only emission sufficient for type-only
   `@loa/straylight/host` consumption, if that satisfies the
   consumer's needs.** Dixie PR #96 used `import type { ... }`
   only. If the follow-up implementation phase's first consumer
   needs only type imports, the minimum emission is:

   - `tsc --emitDeclarationOnly` with `"declaration": true` and a
     `"declarationDir"` (e.g. `dist-types/`);
   - an `exports` map entry whose `./host` key points at the
     emitted `.d.ts` under a `"types"` condition, plus a source
     fallback under a `"default"` (or `"import"`) condition for
     in-repo testing.

   This **minimizes runtime widening**: the package's runtime
   import surface stays at
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   (or its emitted ESM equivalent); only type-shape consumption
   moves to `./host`.

4. **Keep runtime import implications explicit and reviewed.**
   If the first consumer's need is value-import (i.e. actually
   invoking host handlers from outside `loa-straylight`), not
   just type-shape, then declaration-only emission is
   insufficient and the follow-up implementation phase MUST also
   emit JS, populate `dist/` (or equivalent), and add a `files`
   field to `package.json`. That is a strictly larger widening
   and MUST be reviewed as such — not folded into a
   "declaration-output cleanup" PR.

5. **If package changes require JS emission, `dist/`, an
   `exports` map with a `"default"` / `"import"` runtime
   condition, or a `files` field, they must be reviewed as
   package-boundary changes, not as incidental cleanup.** The
   follow-up implementation phase's PR description MUST cite this
   ADR section and call out which of the eleven blockers in
   §"Context" the PR resolves and which it explicitly defers.

6. **Either preserve `"private": true` (with tag-pinned git-source
   consumption) or remove it (with GitHub Packages publishing).
   Do not adopt a hybrid posture.** A hybrid posture (e.g. a
   private package consumed via `npm pack` artifacts shared
   out-of-band) is rejected as a maintenance hazard. The
   follow-up implementation phase MUST pick a side and document
   it in its opening doc.

7. **Preserve the one-way wedge↔host dependency invariant in any
   automation that gates the implementation phase.** A test or
   lint that catches a future `src/straylight/index.ts` importing
   from `src/straylight/host/` is the cleanest expression of
   Decision rule §4. The follow-up implementation phase **should**
   add such a guard alongside any package / export / build change.

## Hounfour version-skew stance

1. **Straylight currently expects `@0xhoneyjar/loa-hounfour@^8.6.0`
   in [`../../package.json`](../../package.json).** This range
   has been stable since the post-Phase-17 / Phase-21B dependency
   posture. Phase 24G does not bump, downgrade, or reconcile this
   range.

2. **Dixie currently pins an older Hounfour ref.** The exact
   Dixie-side pin is a Dixie-repo fact and is **not** restated
   here as authoritative; the load-bearing observation for this
   ADR is only that the pins **differ** today, and that a Dixie
   build resolving `@loa/straylight` as a real dependency would
   inherit Straylight's `^8.6.0` resolution at install time.

3. **Phase 24G does not bump, downgrade, or reconcile Hounfour.**
   No `package.json` change. No `package-lock.json` change. No
   adoption of any Hounfour release that has shipped since the
   `^8.6.0` floor. No adoption of Hounfour `main`. No adoption of
   a commit-SHA pin.

4. **The follow-up implementation phase MUST explicitly decide
   how Dixie handles the skew before any real dependency
   wiring.** Three plausible postures, each acceptable under
   separate review, none authorized by this ADR alone:

   - **(a) Dixie bumps to match.** Dixie raises its Hounfour
     range to a Straylight-compatible floor under a separate
     Dixie-side decision. Straylight does nothing. This is the
     posture most aligned with the existing Phase 24 lineage.
   - **(b) Straylight raises its floor under ADR-024C
     discipline.** A separate Straylight-side ADR adopts a newer
     Hounfour range tag after Event A + Event B + Event C; the
     bump is reviewed on its own merits and Dixie inherits the
     new floor. This posture is only available **after** a
     Hounfour release that meets the ADR-024C criteria.
   - **(c) Both sides hold under explicit duplicate-Hounfour
     isolation.** If neither side can move and the install layout
     produces duplicate Hounfour instances, the follow-up
     implementation phase MUST document the isolation strategy
     (deduplication, peer dependency, runtime check) **before**
     dependency flip. Silent duplicate Hounfour resolution is
     non-conforming.

5. **This ADR must not imply that Dixie may silently accept
   duplicate or conflicting Hounfour semantics.** A Dixie build
   that ends up with two Hounfour versions at install time
   without an explicit skew-handling decision is a non-conforming
   integration. Reviewers MAY cite this stance to refuse a Dixie-
   side dependency flip PR that does not address the skew
   explicitly.

## Future Phase 24H entry conditions

The follow-up implementation phase (referred to as "Phase 24H or
later" in §"Recommended future implementation posture") may open
**only if** every condition below is satisfied:

1. **ADR-024F merged.** This ADR is on `main` under teammate
   review.
2. **Phase 24G handoff merged.** The Phase 24G summary handoff at
   [`../handoffs/phase-24g-host-package-consumption-readiness-plan.md`](../handoffs/phase-24g-host-package-consumption-readiness-plan.md)
   is on `main` under teammate review.
3. **Package / export / build scope explicitly approved.** The
   follow-up implementation phase opens with a docs / opening-
   doc commit that enumerates which of the eleven blockers in
   §"Context" it resolves and which it explicitly defers, and
   that opening doc is reviewed before any `package.json` /
   `tsconfig.json` / build-script edit lands.
4. **No sibling-repo wiring in the same PR as the package /
   export / build change.** The implementation phase's first PR
   stays inside `loa-straylight`. A Dixie-side dependency flip,
   if any, is a **separate** Dixie-side PR under separate Dixie-
   side review.
5. **No Dixie dependency flip until Straylight package output is
   testable.** "Testable" means: the follow-up implementation
   phase's PR includes at least one local validation (a test, a
   script, or an explicit doc command) that exercises the new
   `./host` subpath end-to-end (i.e. an in-repo import that
   resolves through the package's `exports` map, not via a
   relative path), and that validation passes locally before the
   flip is considered.

## Future Phase 24H non-goals

The follow-up implementation phase, when it opens, inherits every
non-goal from ADR-024A / ADR-024B / ADR-024C / ADR-024D /
ADR-024E wholesale, and adds these Phase 24G-specific refusals:

1. **No Dixie / Finn / Freeside / Hounfour edits in the same
   PR.** All four sibling repos remain outside the scope of the
   Straylight-side package / export / build PR.
2. **No Hounfour dependency-range bump.** The `^8.6.0` floor
   stays unless a separate Straylight-side ADR adopts a newer
   range under ADR-024C's three-event discipline.
3. **No Hounfour `main` / unpublished-commit consumption.** Same
   refusal as ADR-024C / ADR-024D / ADR-024E.
4. **No Hounfour `#116` corpus import.** The five-step
   conformance corpus stays out of the Straylight test suite.
5. **No adoption of the `0xhoneyjar:straylight:*` audit-event
   prefix family** into the Straylight public surface, even
   though a future `./host` subpath touches public surface in
   spirit.
6. **No adoption of the Hounfour `recall-wedge` conformance
   category** into the Straylight test suite.
7. **No vector 9 widening.** Phase 24B vectors 1–8 remain the
   host-inspection-layer test slice. `signer_not_competent`
   stays a cross-reference test in the wedge suite at
   [`../../tests/signer-fail-closed.test.ts`](../../tests/signer-fail-closed.test.ts).
8. **No vectors 10–11 widening.** `EstateTransition` and
   `safeCanonicalize` remain ADR-022E gates #1 and #2,
   unchanged.
9. **No public commitment-root behavior.** ADR-020E unchanged.
10. **No HTTP / NATS / RPC / BFF / Discord / Telegram / GraphQL
    endpoint** in `loa-straylight`. The follow-up implementation
    phase is a package-surface change, not a runtime-wiring
    change.
11. **No runtime Dixie wiring.** Dixie does not get wired as a
    `package.json` dependency of `loa-straylight`. The
    consumption direction stays `loa-dixie` → `@loa/straylight/host`,
    not the reverse.

## Consequences

- **Dixie's PR #96 local mirrors remain transitional.** They are
  the correct seam under the current package-readiness state,
  not a permanent ownership of the host scaffold's types.
  Reviewers (Dixie-side and Straylight-side) MAY cite this ADR
  to refuse a Dixie-side proposal that promotes the local mirror
  to a long-lived duplicate of the upstream host barrel.

- **`@loa/straylight/host` remains unavailable until a package-
  readiness implementation phase lands.** No Phase 24G work
  changes that. A consumer that needs typed host shapes today
  must either use a local mirror (Dixie PR #96 posture) or
  vendor the upstream host barrel via an explicit, documented
  copy under that consumer's own review discipline.

- **Package-readiness is now explicit and reviewable rather than
  implicit.** A future implementation-phase PR has an
  enumerated, cite-able target. A reviewer scanning a follow-up
  PR can verify, blocker-by-blocker, which of the eleven items
  in §"Context" is resolved by the diff. The package-boundary
  document at
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
  **not** edited by Phase 24G; a future implementation-phase PR
  that adds `./host` to the documented stable surface is the
  correct vehicle for that doc change, under its own teammate
  review.

- **The wedge public surface is unchanged by Phase 24G.**
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  is byte-identical to its pre-Phase-24G state. Future package /
  export / build changes that nominally widen the package's
  public surface MUST be evaluated against the existing
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  contract; this ADR does not pre-authorize the documentation
  update.

- **ADR-024F supersedes nothing.** It is additive to ADR-024E
  and rests on ADR-024A / ADR-024B / ADR-024C / ADR-024D;
  reopening any of those five reopens this one.

## Non-scope (Phase 24G)

- This ADR does **not** open a follow-up implementation phase or
  branch.
- This ADR does **not** author any TypeBox / JSON Schema. No
  `$id` declared. No validator generated.
- This ADR does **not** edit
  [`../../package.json`](../../package.json) /
  [`../../package-lock.json`](../../package-lock.json) /
  [`../../tsconfig.json`](../../tsconfig.json) /
  [`../../vitest.config.ts`](../../vitest.config.ts) /
  [`../../.npmrc`](../../.npmrc).
- This ADR does **not** add an `exports` map, a `./host`
  subpath, a `types` / `typings` field, a `files` field, or a
  `build` script.
- This ADR does **not** flip `"declaration": false` →
  `"declaration": true` or `"noEmit": true` → `"noEmit":
  false`.
- This ADR does **not** emit declarations, JS, or a `dist/`
  directory.
- This ADR does **not** un-`"private"` the package and does
  **not** publish to any registry.
- This ADR does **not** create a release tag.
- This ADR does **not** edit
  [`../../src/`](../../src/),
  [`../../tests/`](../../tests/),
  [`../../fixtures/`](../../fixtures/), or
  [`../../scripts/`](../../scripts/).
- This ADR does **not** edit
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- This ADR does **not** edit any prior ADR or any prior handoff
  (other than the README index entry authored alongside this
  ADR).
- This ADR does **not** edit any sibling repo. No `loa-dixie`
  change. No `loa-finn` change. No `loa-freeside` change. No
  `loa-hounfour` change.
- This ADR does **not** file or edit any GitHub issue / comment /
  PR.
- This ADR does **not** bump, downgrade, or reconcile the
  Hounfour dependency range. The `^8.6.0` floor and the
  resolved patch in
  [`../../package-lock.json`](../../package-lock.json) are
  unchanged.
- This ADR does **not** consume Hounfour `main` or any
  unpublished commit.
- This ADR does **not** import the Hounfour `#116` five-step
  conformance corpus.
- This ADR does **not** adopt the `0xhoneyjar:straylight:*`
  audit-event prefix family into the Straylight public surface.
- This ADR does **not** adopt the `recall-wedge` Hounfour
  conformance category into the Straylight test suite.
- This ADR does **not** advance ADR-022E gate #1
  (`EstateTransition`), gate #2 (`safeCanonicalize`), gate #4
  (`Challenge`), or gate #5 (`AuditEvent`).
- This ADR does **not** advance ADR-020E (public commitment
  root).
- This ADR does **not** advance the Phase 19A pending feedback
  gate on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
- This ADR does **not** touch
  [`../../.loa`](../../.loa),
  [`../../.loa.config.yaml`](../../.loa.config.yaml),
  [`../../.claude/`](../../.claude/),
  [`../../.beads/`](../../.beads/),
  [`../../.run/`](../../.run/),
  [`../../.github/`](../../.github/),
  [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
  `node_modules/`.
- This ADR does **not** request or run Flatline / Bridgebuilder
  / red-team review.
- No commit, no push, no PR.

## Source files inspected

- [`./0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020B-recall-wedge-endpoint-host.md`](./ADR-020B-recall-wedge-endpoint-host.md)
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md)
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
- [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)
- [`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md)
- [`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)
- [`./ADR-024D-phase-24b-implementation-branch.md`](./ADR-024D-phase-24b-implementation-branch.md)
- [`./ADR-024E-dixie-host-mvp-wire-shape.md`](./ADR-024E-dixie-host-mvp-wire-shape.md)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md`](../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md)
- [`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md)
- [`../handoffs/phase-24c-dixie-recall-host-scaffold.md`](../handoffs/phase-24c-dixie-recall-host-scaffold.md)
- [`../handoffs/phase-24d-host-scaffold-hardening.md`](../handoffs/phase-24d-host-scaffold-hardening.md)
- [`../handoffs/phase-24e-dixie-host-handoff-packet.md`](../handoffs/phase-24e-dixie-host-handoff-packet.md)
- [`../handoffs/phase-24f-dixie-host-issue-draft.md`](../handoffs/phase-24f-dixie-host-issue-draft.md)
- [`../../package.json`](../../package.json) (read-only — Phase 24G touches no package config)
- [`../../tsconfig.json`](../../tsconfig.json) (read-only — Phase 24G touches no TS config)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (read-only — wedge public surface, unchanged by Phase 24G)
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) (read-only — local host barrel, unchanged by Phase 24G; intentionally not re-exported through the wedge public API per ADR-024E)
