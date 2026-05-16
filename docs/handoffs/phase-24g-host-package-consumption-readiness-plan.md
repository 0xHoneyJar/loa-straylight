# Phase 24G — Host package-consumption readiness plan (docs-only)

> Status: Phase 24G **docs-only readiness handoff**. **No source /
> package / test / sibling-repo / fixture / script changes.**
> Companion ADR:
> [`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md).
>
> Phase 24G does **not** flip a wedge import; does **not** edit
> [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
> or any module under
> [`../../src/straylight/`](../../src/straylight/) (including the
> Phase 24C / 24D host scaffold under
> [`../../src/straylight/host/`](../../src/straylight/host/));
> does **not** re-export the host barrel through the wedge public
> API; does **not** edit
> [`../../package.json`](../../package.json) /
> [`../../package-lock.json`](../../package-lock.json) /
> [`../../tsconfig.json`](../../tsconfig.json) /
> [`../../vitest.config.ts`](../../vitest.config.ts) /
> [`../../.npmrc`](../../.npmrc); does **not** add an `exports`
> map, a `./host` subpath, a `types` / `typings` field, a `files`
> field, or a `build` script; does **not** emit declarations or JS
> or a `dist/` directory; does **not** un-`"private"` the package;
> does **not** publish to any registry; does **not** consume
> Hounfour `main` or any unpublished commit; does **not** import
> the Hounfour `#116` five-step conformance corpus; does **not**
> adopt the `0xhoneyjar:straylight:*` audit-event prefix family
> into the Straylight public surface; does **not** adopt the
> `recall-wedge` Hounfour conformance category into the
> Straylight test suite; does **not** edit
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md); does
> **not** edit any prior ADR or any prior handoff (other than the
> README index entry authored alongside this handoff); does **not**
> edit any sibling repo; does **not** file or edit any GitHub
> issue / comment / PR; does **not** bump, downgrade, or
> reconcile the Hounfour dependency range; does **not** publish a
> public commitment root; does **not** advance any ADR-022E gate;
> does **not** request or run Flatline / Bridgebuilder / red-team
> review; and does **not** touch
> [`../../.loa`](../../.loa),
> [`../../.loa.config.yaml`](../../.loa.config.yaml),
> [`../../.claude/`](../../.claude/),
> [`../../.beads/`](../../.beads/),
> [`../../.run/`](../../.run/),
> [`../../.github/`](../../.github/),
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
> `node_modules/`. It does **not** commit and does **not** open
> a PR.
>
> The Phase 19A pending feedback gate on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> remains pending and is **not** advanced by Phase 24G.

## Executive summary

Phase 24G records the **package-consumption blockers** that
currently prevent `loa-dixie` (and any other consumer) from
replacing its local adapter mirror with a real
`import type { ... } from '@loa/straylight/host'` (or a value
import from the same subpath), pins a **policy frame** for
exposing `./host` as a future Straylight package subpath, and
defines the **entry / non-go conditions** for a later
implementation phase that may add the minimum package / build /
export surface required to make `@loa/straylight/host` actually
consumable.

Dixie PR #96 (sibling repo) landed a **local adapter boundary**
inside `loa-dixie` rather than real `@loa/straylight` consumption.
Phase 24G accepts that posture as **correct under the current
package-readiness state**: `@loa/straylight/host` is not currently
consumable, so the local-mirror seam is a deliberate pre-
consumption choice, not a coupling defect. Phase 24G does **not**
file or modify any Dixie-side artifact and does **not** propose a
Dixie-side flip; the Dixie-side follow-up is a separate, sibling-
repo event under separate Dixie-side review.

The package-consumption blockers are **not bugs** in the host
scaffold and **not bugs** in Dixie. They are the consequence of
deliberate prior decisions (the package is `"private": true`; the
wedge public surface is documentation-frozen to
[`../../src/straylight/index.ts`](../../src/straylight/index.ts);
the host barrel is intentionally **not** re-exported through the
wedge public API per ADR-024E §"The next implementation branch")
plus a set of tooling defaults that have not yet been
re-evaluated for cross-repo consumption (`main` pointing at TS
source; no `exports` map; no declaration emission; no build
script; no `dist/`; no release tag; no `types` field). Phase 24G
treats the next step — exposing `./host` as a *deliberate, named
public subpath* of `@loa/straylight` — as a **public-surface
widening decision**, not as incidental cleanup, and records the
ADR that locks the policy frame so a later implementation phase
has a reviewable target.

Phase 24G is **docs-only**. It authors three files (this packet,
the companion ADR-024F, and an append to the handoffs README
index) and edits nothing else.

## Current package / export / build state

The facts below are as observed in the working tree at the head
of branch
`phase-24g-host-package-consumption-readiness-plan`. They are
recorded here so a future implementer can verify which of them
still hold at the time of the follow-up phase, and so a reviewer
of this packet can verify the blocker list in §"Dixie import
blocker checklist" below is grounded in current repo state.

### `package.json` facts

The package
([`../../package.json`](../../package.json)):

- **`"name"`** is `"@loa/straylight"`. (Stable since Phase 5.)
- **`"version"`** is `"0.0.1"`. (No release tag.)
- **`"private"`** is `true`. (Package is not published.)
- **`"type"`** is `"module"`. (ESM.)
- **`"main"`** is `"src/straylight/index.ts"` — `main` points at
  a **TypeScript source file**, not at a build artifact.
- **No `"exports"` map.** A consumer's
  `import { ... } from '@loa/straylight/host'` cannot be
  resolved by Node's package-exports machinery under the current
  `package.json`.
- **No `"types"` / `"typings"` field.** A TypeScript consumer
  importing `'@loa/straylight'` has no canonical declaration
  pointer.
- **No `"files"` field.** A future `npm pack` (if `"private":
  true` were lifted) would include the default set, which
  includes `src/` and other working-tree files.
- **No `"build"` script.** The `scripts` map contains:
  `"typecheck": "tsc --noEmit"`, `"test": "vitest run"`,
  `"test:watch": "vitest"`, and several `vite-node`-driven
  exporter / demo scripts (`demo:recall`, `demo:recall:json`,
  `schema:candidates`, `hounfour:conformance`,
  `hounfour:handoff`, `finn:enforcement`, `dixie:recall`,
  `freeside:surface`, `handoffs:index`,
  `hounfour:rc-readiness`, `hounfour:shadow-inspect`). None of
  these emits a `dist/` or a `.d.ts`.
- **`"engines"`** pins `"node": ">=20"`.
- **`"devDependencies"`** declares `@types/node@^20.11.0`,
  `typescript@^5.4.0`, `vitest@^1.6.0`. No build-tool
  dependency (rollup, tsup, esbuild, swc) is declared.
- **`"dependencies"`** declares
  `"@0xhoneyjar/loa-hounfour": "^8.6.0"`. (The Hounfour skew
  with Dixie's older pin is one of the eleven blockers below.)

### `tsconfig.json` facts

The TypeScript compiler is configured
([`../../tsconfig.json`](../../tsconfig.json)):

- **`"target": "ES2022"`**.
- **`"module": "ESNext"`**, **`"moduleResolution": "Bundler"`**.
- **`"strict": true`**, **`"noImplicitOverride": true`**,
  **`"noUncheckedIndexedAccess": true`**,
  **`"exactOptionalPropertyTypes": false`**,
  **`"noFallthroughCasesInSwitch": true`**,
  **`"noImplicitReturns": true`**.
- **`"isolatedModules": true`**.
- **`"declaration": false`** — no `.d.ts` emission.
- **`"noEmit": true`** — no JS emission. The compiler is
  configured for typecheck-only.
- **`"rootDir": "."`**, **`"baseUrl": "."`**, paths
  `"@straylight/*": ["src/straylight/*"]`.
- **`"include"`** is `["src/**/*.ts", "tests/**/*.ts",
  "scripts/**/*.ts", "fixtures/**/*.json"]`.
- **`"exclude"`** is `["node_modules", ".loa",
  ".loa-state"]`.

The compiler currently neither emits declarations nor emits JS.
No `dist/` is populated by any local command. A consumer relying
on TypeScript's declaration files cannot find one in the
package's working tree, in `node_modules/@loa/straylight/` (the
package is not published), or in any release artifact (there is
no release).

### Source layout facts

The local TypeScript host scaffold lives under
[`../../src/straylight/host/`](../../src/straylight/host/) with
the local barrel at
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
The wedge public surface lives at
[`../../src/straylight/index.ts`](../../src/straylight/index.ts).
The two entrypoints are **separate**, and the host barrel is
**intentionally not re-exported** through the wedge public API
per ADR-024E §"The next implementation branch" — the comment at
the head of
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
restates the rule inline:

> // This barrel is INTENTIONALLY NOT re-exported through
> // `src/straylight/index.ts` (the wedge's stable public API).
> // Consumers of the host (tests, future Dixie BFF) import from
> // `@straylight/host` / `src/straylight/host/index.js`
> // directly.

The host scaffold imports from the wedge public API; the wedge
public API does not import from the host scaffold. This one-way
dependency is load-bearing under ADR-024F Decision §4.

### Package-boundary doc facts

The current
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) (Phase
5, with Phase 6 schema-extraction-prep appendix) names only
[`../../src/straylight/index.ts`](../../src/straylight/index.ts)
as the single stable import path. It explicitly states:

> Anything not re-exported by `src/straylight/index.ts` is
> internal. Importing from a file under
> `src/straylight/<module>.ts` directly is unsupported and will
> break across phases without notice.

The host barrel under
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
is **not described** as part of the stable public surface by
that document. Phase 24G does **not** edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md); a
future implementation phase that adds `./host` to the documented
stable surface is the correct vehicle for that doc change.

## Dixie import blocker checklist

Every row below is **one independently-load-bearing reason** a
Dixie-side `import type { ... } from '@loa/straylight/host'`
fails today. Any single row, on its own, is sufficient to
prevent the import. Phase 24G resolves **none** of them; it
records them, scopes which one a future implementation phase
must address first, and pins which ones are deliberately out of
scope for that phase.

### Blocker 1 — Missing `exports` map

- **Current state.** [`../../package.json`](../../package.json)
  has no `"exports"` field. Node's package-resolution algorithm
  has no entry to map `'@loa/straylight/host'` against. A
  Dixie-side `import` of the subpath returns
  `ERR_PACKAGE_PATH_NOT_EXPORTED` (or equivalent under the
  bundler).
- **Why it blocks Dixie.** Without an `exports` map there is
  no way for a consumer to address `./host` as a subpath of
  `@loa/straylight` at all. Even if the package were published,
  the subpath would not exist.
- **Required future state.** A future implementation phase adds
  an `"exports"` map with at minimum a `"."` entry (the wedge
  public surface) and a `"./host"` entry (the host barrel,
  treated as a distinct public surface per ADR-024F Decision
  §2).
- **Phase 24G posture.** **Deferred** to the follow-up
  implementation phase.

### Blocker 2 — Missing `./host` subpath

- **Current state.** Even if an `"exports"` map were added with
  only a `"."` key, there would still be no `"./host"` key.
  `import { ... } from '@loa/straylight/host'` would still fail.
- **Why it blocks Dixie.** Dixie PR #96's intended consumption
  shape is the subpath import, deliberately distinct from the
  wedge public surface; Dixie does not want to import the host
  scaffold *through* the wedge barrel and does not want the
  host barrel re-exported through the wedge barrel.
- **Required future state.** The `"exports"` map's `"./host"`
  key points at the host barrel's emitted declarations (and,
  if value-imports are in scope for the follow-up phase, its
  emitted JS).
- **Phase 24G posture.** **Deferred** to the follow-up
  implementation phase. This blocker MUST be resolved in the
  same PR as Blocker 1 — adding an `exports` map without the
  `./host` subpath does not unblock Dixie.

### Blocker 3 — No declaration output

- **Current state.**
  [`../../tsconfig.json`](../../tsconfig.json) has
  `"declaration": false` and `"noEmit": true`. No `.d.ts` files
  are emitted anywhere.
- **Why it blocks Dixie.** A TypeScript consumer doing
  `import type { ... } from '@loa/straylight/host'` resolves
  against `.d.ts` files (under the `"types"` condition of an
  `exports` map, or via the `"types"` / `"typings"` field).
  Without declaration output the type-only import has no shape
  to bind to.
- **Required future state.** The follow-up implementation phase
  adds a declaration-emission path. The minimum shape is
  `tsc --emitDeclarationOnly` with `"declaration": true` and a
  `"declarationDir"` (e.g. `dist-types/`). ADR-024F
  §"Recommended future implementation posture" §3 prefers
  declaration-only emission if the first consumer's need is
  type-only.
- **Phase 24G posture.** **Deferred** to the follow-up
  implementation phase.

### Blocker 4 — No JS output / no `dist/`

- **Current state.** No JS is emitted. No `dist/` directory
  exists in the working tree. No `"build"` script populates one.
- **Why it blocks Dixie.** If the Dixie-side consumption shape
  ever needs to be **value-import** (actually invoking a host
  handler from outside `loa-straylight`), then declaration
  output alone is insufficient. Node's ESM resolver needs an
  actual `.js` (or `.mjs`) file to import at runtime.
- **Required future state.** If and only if the first
  consumer's need is value-import, the follow-up implementation
  phase emits JS to `dist/` (or equivalent), adds a `"files"`
  field to `package.json`, and points the `"./host"` exports
  entry's runtime condition at the emitted JS. ADR-024F
  §"Recommended future implementation posture" §4 calls this
  out as **a strictly larger widening** that must be reviewed
  as such.
- **Phase 24G posture.** **Deferred** to the follow-up
  implementation phase. Phase 24G does **not** pre-authorize
  the choice between type-only emission and full JS emission;
  that is a follow-up-phase decision.

### Blocker 5 — Source-only package entry (`main` points at TS source)

- **Current state.** `"main": "src/straylight/index.ts"`.
  `main` points at a `.ts` file rather than at a build artifact.
- **Why it blocks Dixie.** Even a consumer that consults the
  classic `main` field (rather than the `exports` map) gets a
  TS source path. A bundler-driven Dixie build can sometimes
  resolve this, but Node's runtime resolver cannot, and the
  declared type contract is undefined.
- **Required future state.** `main` either (a) points at the
  emitted JS / declaration entry under `dist/`, or (b) is
  superseded entirely by the `exports` map and removed.
- **Phase 24G posture.** **Deferred** to the follow-up
  implementation phase.

### Blocker 6 — Private package / no publish discipline

- **Current state.** `"private": true`. The package is not
  published to npm and is not published to GitHub Packages.
  There is no registry entry for `@loa/straylight`.
- **Why it blocks Dixie.** Dixie cannot `npm install
  @loa/straylight`. The only consumption shapes available are
  (a) a workspace-path link to a developer's local clone, (b)
  a `file:`-protocol dependency, (c) a git-source dependency
  resolving against `loa-straylight`'s GitHub repository, or
  (d) a published-package consumption (which currently doesn't
  exist).
- **Required future state.** The follow-up implementation phase
  picks one of the two side-stances pinned in ADR-024F
  §"Recommended future implementation posture" §6:
  - **(a)** preserve `"private": true` and document tag-pinned
    git-source consumption as the canonical posture; or
  - **(b)** lift `"private": true` and publish to GitHub
    Packages (or npm) with a documented release / version
    discipline.
  ADR-024F refuses a hybrid posture.
- **Phase 24G posture.** **Deferred** to the follow-up
  implementation phase. Phase 24G does **not** pre-authorize
  either side-stance.

### Blocker 7 — No tag/release consumption rule

- **Current state.** No release tag exists. The
  `"version"` is `"0.0.1"` (effectively a placeholder). There
  is no documented rule for how an external consumer should
  pin a version.
- **Why it blocks Dixie.** Even under the tag-pinned-git-source
  posture (Blocker 6 side-stance (a)), a Dixie-side dependency
  on `loa-straylight` requires a stable pin. Pinning against
  `main` HEAD would couple Dixie's build to unpublished
  working-tree state, which ADR-024F Decision §5 explicitly
  refuses.
- **Required future state.** The follow-up implementation phase
  documents the tag / version pin shape (e.g. annotated git
  tags like `straylight-host-0.1.0`, or a semver published to
  GitHub Packages), and the first Dixie-side consumption PR
  uses that pin.
- **Phase 24G posture.** **Deferred** to the follow-up
  implementation phase.

### Blocker 8 — Public-surface widening decision

- **Current state.**
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  pins only
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  as stable. The host barrel under
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  is **not** described as part of the stable public surface.
- **Why it blocks Dixie.** Independently of any tooling
  blocker, exposing `./host` as a publicly-consumable subpath
  of `@loa/straylight` is a **policy** widening of the package's
  public surface. The host scaffold's shape has been moving
  fast across Phase 24C / 24D / 24E / 24F; a Dixie-side import
  against an undocumented, in-flight public surface is a
  coupling hazard.
- **Required future state.** The follow-up implementation phase
  edits
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md) to
  add `./host` as a distinct documented stable surface (with
  its own symbol-table section), preserving the existing wedge
  public-surface section unchanged. The doc edit, the
  `exports` map edit, and the declaration / JS emission edits
  are reviewed together as a single public-surface widening
  event.
- **Phase 24G posture.** **Decided in principle**, **deferred
  in implementation**. ADR-024F Decision §2 locks the policy
  frame: `./host` exposure is a public-surface widening, not
  incidental cleanup. The doc edit itself is deferred to the
  follow-up implementation phase.

### Blocker 9 — Hounfour version skew

- **Current state.** `loa-straylight` declares
  `"@0xhoneyjar/loa-hounfour": "^8.6.0"` in
  [`../../package.json`](../../package.json). `loa-dixie`
  currently pins an older Hounfour ref.
- **Why it blocks Dixie.** Even if every other blocker were
  resolved tomorrow, a Dixie build resolving `@loa/straylight`
  as a real dependency would inherit Straylight's `^8.6.0`
  resolution at install time. Without an explicit skew
  decision, the Dixie build risks duplicate Hounfour instances
  in `node_modules` or a hard install-time conflict, depending
  on the resolver's de-duplication behavior.
- **Required future state.** The follow-up implementation phase
  decides — explicitly, in its opening doc — how the skew is
  handled before any Dixie-side dependency flip. ADR-024F
  §"Hounfour version-skew stance" §4 enumerates the three
  acceptable postures (Dixie bumps to match; Straylight raises
  its floor under ADR-024C discipline; or both sides hold
  under explicit duplicate-Hounfour isolation). Silent
  duplicate Hounfour resolution is non-conforming.
- **Phase 24G posture.** **Deferred** to the follow-up
  implementation phase. Phase 24G does **not** bump,
  downgrade, or reconcile the Hounfour range. The `^8.6.0`
  floor and the resolved patch in
  [`../../package-lock.json`](../../package-lock.json) are
  unchanged.

### Blocker summary table

| # | Blocker | Current state | Phase 24G resolves? | Phase 24G defers? |
|---|---|---|---|---|
| 1 | Missing `exports` map | No `"exports"` field in `package.json` | No | Yes |
| 2 | Missing `./host` subpath | No subpath even if `exports` existed | No | Yes |
| 3 | No declaration output | `"declaration": false`, `"noEmit": true` | No | Yes |
| 4 | No JS output / no `dist/` | No build script; no `dist/` | No | Yes |
| 5 | Source-only package entry | `"main"` points at TS source | No | Yes |
| 6 | Private package / no publish discipline | `"private": true`; no registry entry | No | Yes |
| 7 | No tag/release consumption rule | No release tag; placeholder `"version"` | No | Yes |
| 8 | Public-surface widening decision | Host barrel not in `package-boundary.md` stable surface | **Policy decided** by ADR-024F Decision §2; doc edit deferred | Doc edit deferred |
| 9 | Hounfour version skew | Straylight `^8.6.0` vs Dixie older pin | No | Yes; ADR-024F §"Hounfour version-skew stance" pins the three acceptable postures |

## Package-boundary implications

Phase 24G's package-boundary implications are deliberately
narrow. The wedge public API is **unchanged** by this phase. The
host scaffold's local-barrel status is **unchanged**. What
changes is only the **policy frame** under which a future
implementation phase may widen the package's public surface.

1. **`./host` must not be snuck into the public surface as a
   convenience.** A future PR that adds an `exports` map without
   updating
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md),
   that re-exports the host barrel through the wedge barrel as
   a "shortcut," or that folds the host barrel into the wedge
   public surface to avoid having to add a distinct subpath, is
   non-conforming under ADR-024F Decision §2 and §4. Reviewers
   MAY cite this section verbatim against such a PR.

2. **The host subpath is a deliberate future surface, not an
   incidental tooling artifact.** Even type-only `./host`
   exposure is a public-surface widening. The follow-up
   implementation phase's PR description MUST call out that
   widening, name the consumer it unblocks (the first Dixie PR
   that replaces local mirrors), and cite ADR-024F.

3. **The wedge public API remains unchanged in Phase 24G.**
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   is byte-identical to its pre-Phase-24G state. The Phase 5
   stable-surface freeze documented in
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
   preserved.

4. **Any future package implementation must preserve the one-way
   wedge↔host dependency.** The host scaffold may import from
   the wedge public API; the wedge public API must not import
   from the host scaffold. ADR-024F Decision §4 pins this rule;
   ADR-024F §"Recommended future implementation posture" §7
   suggests the follow-up phase **should** add an automated
   guard (a test, a lint, or a doc-checked grep) that catches
   future
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   imports from
   [`../../src/straylight/host/`](../../src/straylight/host/).

## Dixie follow-up implication

1. **Dixie PR #96 remains correct as a pre-consumption adapter
   boundary.** The local mirrors landed by Dixie PR #96 are the
   right seam under the current Straylight package-readiness
   state. Phase 24G does not propose a Dixie-side change.
   Reviewers (Dixie-side or Straylight-side) MAY cite ADR-024F
   §"Consequences" §1 to refuse a Dixie-side proposal that
   promotes the local mirror to a long-lived duplicate of the
   upstream host barrel.

2. **A future Dixie PR may replace local mirrors only after a
   Phase 24H-like package-readiness implementation phase
   lands.** The replacement PR is sibling-repo work, not
   Straylight-side work; Phase 24G does not pre-authorize the
   filing channel, the PR author, or the timing. Per ADR-024F
   §"Future Phase 24H entry conditions" §4 and §5, the
   Straylight-side package / export / build PR and the Dixie-
   side dependency-flip PR are **distinct PRs under distinct
   review** — they may not be bundled.

3. **Dixie Issue #95 remains partially satisfied, not fully
   completed, until actual dependency wiring happens.** Dixie
   Issue #95 (the parent issue Dixie PR #96 addresses) tracks
   real `@loa/straylight` consumption as the long-arc goal.
   Phase 24G does not close that issue and does not request
   that it be closed. The local-adapter-mirror posture is a
   partial discharge; the remaining discharge (replacing the
   mirror with the package import) requires the follow-up
   Straylight-side implementation phase plus a separate Dixie-
   side flip PR.

## Validation baseline

Phase 24G is docs-only. Validation expectations are
correspondingly narrow:

```bash
npm run typecheck
npm test
git status --short
git diff --stat
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json vitest.config.ts .npmrc
```

Expected:

- `npm run typecheck` clean — Phase 24G touches no TypeScript
  source, so `tsc --noEmit` is expected to produce identical
  output to the Phase 24F post-merge baseline.
- `npm test` unchanged from the Phase 24F post-merge baseline —
  Phase 24G touches no test, no fixture, no source.
- `git status --short` shows only the three Phase 24G files
  (this packet, the companion ADR-024F, and the README index
  append), plus any pre-existing local dirt already present
  before the phase (e.g. modifications under
  [`../../.loa`](../../.loa) /
  [`../../.loa.config.yaml`](../../.loa.config.yaml) and
  untracked entries under
  [`../../.claude/`](../../.claude/) or
  [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/)
  pre-existing the phase).
- `git diff --stat` shows only the three Phase 24G files.
- `git diff -- src/ tests/ fixtures/ scripts/ package.json
  package-lock.json tsconfig.json vitest.config.ts .npmrc` is
  **empty**.

The `validate-forbidden-paths` posture (no edit to package
config, no edit to TS config, no edit to source, no edit to
tests, no edit to fixtures, no edit to scripts, no edit to
`.npmrc`) is itself the load-bearing validation for Phase 24G.

## Explicit non-scope (Phase 24G)

Phase 24G **does not**:

- edit
  [`../../package.json`](../../package.json) or
  [`../../package-lock.json`](../../package-lock.json);
- edit [`../../tsconfig.json`](../../tsconfig.json);
- edit [`../../vitest.config.ts`](../../vitest.config.ts);
- edit [`../../.npmrc`](../../.npmrc);
- edit any source under
  [`../../src/`](../../src/) (no edit to the wedge surface; no
  edit to the host scaffold; no re-export of the host barrel
  through the wedge public API);
- edit any test under [`../../tests/`](../../tests/) (no new
  test; no modification to any existing test);
- edit any fixture under
  [`../../fixtures/`](../../fixtures/);
- edit any script under
  [`../../scripts/`](../../scripts/);
- edit
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md);
- edit any prior ADR under
  [`../decisions/`](../decisions/) (other than authoring
  ADR-024F itself, the companion to this packet);
- edit any prior handoff under
  [`./`](./) (other than the README index append authored
  alongside this packet);
- edit any spec under [`../specs/`](../specs/);
- author any new spec under [`../specs/`](../specs/);
- edit any sibling repo (no `loa-dixie` change; no `loa-finn`
  change; no `loa-freeside` change; no `loa-hounfour` change);
- file a GitHub issue, open a PR, post a comment, or assign a
  reviewer at any sibling repo;
- run `npm install`, `npm update`, `npm ci`, `npm publish`,
  `npm pack`, or any package-manager mutation command;
- publish the package to npm or GitHub Packages;
- create a release tag;
- bump, downgrade, or reconcile the Hounfour dependency range
  (`^8.6.0` floor unchanged; resolved patch in
  [`../../package-lock.json`](../../package-lock.json)
  unchanged);
- consume Hounfour `main` or any unpublished commit;
- import the Hounfour `#116` five-step conformance corpus;
- adopt the `0xhoneyjar:straylight:*` audit-event prefix family
  into the Straylight public surface;
- adopt the Hounfour `recall-wedge` conformance category into
  the Straylight test suite;
- author or wire any HTTP / NATS / RPC / BFF / Discord /
  Telegram / GraphQL endpoint;
- declare any wire-transport route shape as binding;
- publish a public commitment root (ADR-020E unchanged);
- advance any ADR-022E gate (#1 `EstateTransition`; #2
  `safeCanonicalize`; #4 `Challenge` re-export; #5
  `AuditEvent` rename — all unchanged);
- advance vector 9 / 10 / 11 widening anywhere (Phase 24B
  vectors 1–8 remain the host-inspection-layer test slice);
- author operator-facing rendering anywhere;
- advance the Phase 19A pending feedback gate on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  (remains pending);
- request or run Flatline / Bridgebuilder / red-team review on
  this packet;
- touch [`../../.loa`](../../.loa),
  [`../../.loa.config.yaml`](../../.loa.config.yaml),
  [`../../.claude/`](../../.claude/),
  [`../../.beads/`](../../.beads/),
  [`../../.run/`](../../.run/),
  [`../../.github/`](../../.github/),
  [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
  `node_modules/`;
- commit, push, or open any PR on `loa-straylight` itself.

## Open questions / follow-ups (not blocking Phase 24G)

1. **Exact Phase 24H implementation branch name.** Phase 24G
   intentionally does **not** pin the branch name. The
   follow-up implementer may pick a narrower or broader
   descriptor under their own opening doc (e.g.
   `phase-24h-host-package-export-scaffold`,
   `phase-24h-straylight-host-subpath`,
   `phase-25-straylight-package-readiness`). The load-bearing
   condition is that the entry conditions in ADR-024F §"Future
   Phase 24H entry conditions" are all satisfied; the
   descriptor is a reviewer's first-line check, not the
   decision-lock itself.

2. **Whether to emit declarations only or declarations plus
   JS.** ADR-024F §"Recommended future implementation posture"
   §3 prefers declaration-only emission if the first
   consumer's need is type-only (which matches Dixie PR #96's
   `import type` posture). §4 calls out the strictly larger
   widening that JS emission represents. The follow-up
   implementation phase's opening doc must pick a side and
   cite the consumer requirement that drives the choice.

3. **Whether the package stays private with git-ref / tag
   consumption or later gets GitHub Packages publishing.**
   ADR-024F §"Recommended future implementation posture" §6
   refuses a hybrid posture. The follow-up implementation
   phase's opening doc must pick a side and document it.

4. **How Dixie / Hounfour skew is resolved before the
   dependency flip.** ADR-024F §"Hounfour version-skew stance"
   §4 enumerates three acceptable postures (Dixie bumps to
   match; Straylight raises its floor under ADR-024C
   discipline; both sides hold under explicit duplicate-Hounfour
   isolation). The follow-up implementation phase's opening
   doc must pick a posture and document it; the Dixie-side
   flip PR cites that decision.

5. **Whether
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
   needs a future update once `./host` becomes public.**
   Phase 24G does **not** edit that doc. ADR-024F Decision §2
   and Blocker 8 of §"Dixie import blocker checklist" above
   both imply that the follow-up implementation phase's PR
   **should** add `./host` as a distinct documented stable
   surface in
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
   The exact section shape (a new top-level section with its
   own symbol table; an appendix to the existing section; a
   companion `package-boundary-host.md` next to the wedge doc)
   is a follow-up-phase choice; Phase 24G does not pre-pin it.

6. **Whether the follow-up implementation phase adds a guard
   against future
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   imports from
   [`../../src/straylight/host/`](../../src/straylight/host/).**
   ADR-024F §"Recommended future implementation posture" §7
   suggests this **should** happen alongside the package /
   export / build change, as the cleanest expression of the
   one-way wedge↔host dependency invariant (ADR-024F Decision
   §4). The implementation shape (a vitest test; a custom
   linter rule; a `grep` in a CI check; a documented review
   step) is a follow-up-phase choice; Phase 24G does not
   pre-pin it.

7. **Hounfour `#70` / Phase 19A feedback gate.** Remains
   **pending** and is **not** advanced by Phase 24G. ADR-024D
   §3.b explicitly allows Phase 24B / 24C / 24D / 24E / 24F /
   24G to proceed under the "local additive scaffolding only"
   rule without satisfying the gate; advancing the gate is a
   separate, sibling-repo, human-reviewed event.

## Cross-references

- [`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md)
  — companion decision-lock authored alongside this packet.
- [`./phase-24f-dixie-host-issue-draft.md`](./phase-24f-dixie-host-issue-draft.md)
  — Phase 24F paste-ready Dixie-side issue / first-PR draft
  (handoff prep only; not filed). Phase 24G inherits Phase 24F's
  non-scope wholesale and adds the package-readiness
  blocker enumeration.
- [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)
  — Phase 24E per-surface Dixie reading (authoritative for
  per-surface behavior).
- [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)
  — Phase 24D summary handoff (six hardening concerns pinned).
- [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)
  — Phase 24C summary handoff (six local host surfaces +
  tenant-resolver contract + intake-deny log).
- [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)
  — Phase 24B summary handoff.
- [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary handoff.
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — Phase 24B decision-lock (host scaffold is local; barrel
  not re-exported through wedge public API).
- [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
  through
  [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — Phase 24A decision-lock series.
- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — Phase 24B MVP host contract.
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — Phase 24B per-vector validation matrix.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) —
  Phase 5 stable-surface freeze. **Not edited by Phase 24G.**
  A future implementation phase MAY add `./host` as a distinct
  documented stable surface under its own PR.
- [`../../package.json`](../../package.json) — current package
  config; the eleven blockers in §"Dixie import blocker
  checklist" reference this file's current state. **Not edited
  by Phase 24G.**
- [`../../tsconfig.json`](../../tsconfig.json) — current
  TypeScript config; Blocker 3 references this file's
  `"declaration": false` / `"noEmit": true` state. **Not
  edited by Phase 24G.**
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge public surface (unchanged by Phase 24G).
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  — local host barrel (unchanged by Phase 24G; intentionally
  not re-exported through the wedge public API per
  ADR-024E).
