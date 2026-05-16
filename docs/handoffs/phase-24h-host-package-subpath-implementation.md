# Phase 24H — Host package subpath implementation (type-only, declaration-only)

> Status: Phase 24H **implementation handoff**. Companion ADR:
> [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md).
>
> Phase 24H executes the **declaration-only subset** of the Phase 24G
> recommended posture (ADR-024F §"Recommended future implementation
> posture" §3). It adds a type-only `@loa/straylight/host` package
> subpath, a declaration-only `tsconfig.build.json`, an `exports`
> map with no runtime conditions, and two new tests pinning the
> shape. It does **not** edit
> [`../../tsconfig.json`](../../tsconfig.json) /
> [`../../package-lock.json`](../../package-lock.json) /
> [`../../.npmrc`](../../.npmrc); does **not** edit any file under
> [`../../src/`](../../src/); does **not** edit any file under
> [`../../scripts/`](../../scripts/); does **not** edit any file
> under [`../../fixtures/`](../../fixtures/); does **not** edit any
> existing test under [`../../tests/`](../../tests/); does **not**
> emit runtime JS or a `dist/` directory; does **not** add a
> `"default"` / `"import"` / `"require"` / `"node"` / `"browser"`
> condition under `exports`; does **not** add a TypeScript source
> fallback; does **not** un-`"private"` the package; does **not**
> publish to any registry; does **not** create a release tag; does
> **not** edit any prior ADR or any prior handoff (other than the
> README index entry authored alongside this handoff); does **not**
> edit any sibling repo; does **not** file or edit any GitHub
> issue / comment / PR; does **not** bump, downgrade, or reconcile
> the Hounfour dependency range; does **not** consume Hounfour
> `main` or any unpublished commit; does **not** import the
> Hounfour `#116` five-step conformance corpus; does **not** adopt
> the `0xhoneyjar:straylight:*` audit-event prefix family into the
> Straylight public surface; does **not** adopt the `recall-wedge`
> Hounfour conformance category into the Straylight test suite;
> does **not** publish a public commitment root; does **not**
> advance any ADR-022E gate; and does **not** touch
> [`../../.loa`](../../.loa),
> [`../../.loa.config.yaml`](../../.loa.config.yaml),
> [`../../.claude/`](../../.claude/),
> [`../../.beads/`](../../.beads/),
> [`../../.run/`](../../.run/),
> [`../../.github/`](../../.github/),
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
> `node_modules/`.
>
> A 3-model Flatline pass is expected **before merge** because
> Phase 24H widens the public package surface; it is **not** part
> of the same commit as this handoff.
>
> The Phase 19A pending feedback gate on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> remains pending and is **not** advanced by Phase 24H.

## Executive summary

Phase 24H is the **first Straylight-side implementation phase** that
widens the package's public surface for cross-repo consumption. It
implements the **minimum viable** widening: declaration-only emission
to `dist-types/`, a type-only `exports` map with two subpaths (`"."`
and `"./host"`), and no runtime condition of any kind.

The widening is deliberately narrow:

- A consumer can write `import type { ... } from '@loa/straylight'` or
  `import type { ... } from '@loa/straylight/host'` and resolve the
  emitted `.d.ts` through the `exports` map.
- A consumer attempting `import { handleRecallIntake } from
  '@loa/straylight/host'` (value import), `await
  import('@loa/straylight/host')` (dynamic runtime import), or
  `require('@loa/straylight/host')` (CommonJS) does **not** resolve
  — and that failure is the intended, documented posture, not a
  defect. Consumers MUST use `import type`. Runtime support is a
  future, separate widening (a hypothetical Phase 24I or later) and
  is **not** authorized by Phase 24H. The Phase 24H package-exports
  test asserts that no runtime / value-import condition appears
  under any `exports` entry.

### Supported consumer assumptions

The Phase 24H consumption contract is narrow. A consumer outside
the envelope below will see resolution failures; **those failures
are the intended posture, not defects**.

- **TypeScript >= 5.4 is REQUIRED.** Pinned via `devDependencies`;
  asserted in the consumption test. Older TypeScript versions are
  unsupported.
- **`moduleResolution`: `"Bundler"` or `"NodeNext"` only.** These
  two modes are exercised end-to-end by the consumption test.
  Older / default / non-export-aware modes (`"node"`, `"classic"`,
  `"node10"`, `"node16"`) are **unsupported** in Phase 24H; the
  legacy node resolver does not honor the package's `exports`
  map and will fail to find `@loa/straylight/host`. The
  consumption test pins this failure under `moduleResolution:
  "node"` (`Phase 24H — unsupported resolver mode does not
  resolve ./host (SKP-001)`).
- **`import type` only is REQUIRED; runtime/value imports are
  UNSUPPORTED and expected to fail.** A consumer attempting a
  value import, `await import('@loa/straylight/host')`, or
  `require('@loa/straylight/host')` (or the same patterns
  against the root subpath `@loa/straylight`) will fail to
  resolve with `ERR_PACKAGE_PATH_NOT_EXPORTED`. The consumption
  test pins this failure mode without requiring `npm install`
  or network access (`Phase 24H — runtime/value imports are
  unsupported by design (SKP-001)`).
- **Tag- / release-pinned git source.** Workspace links,
  `main`-HEAD git dependencies, and commit-SHA pins against
  unpublished trees are **unsupported**. Because `dist-types/`
  is now committed, a tag-pinned consumer resolves declarations
  directly from the tagged tree without depending on `prepare`.

The widening resolves eight of the eleven ADR-024F blockers:

- Blocker 2 (no `exports` map) → **resolved** by the new type-only
  `exports` map.
- Blocker 3 (no `./host` subpath) → **resolved** by the `./host`
  key under `exports`.
- Blocker 4 (`main` points at TS source) → **resolved** by removing
  the `main` field; `types` field added instead.
- Blocker 5 (no `types` / `typings` field) → **resolved** by adding
  `"types": "./dist-types/src/straylight/index.d.ts"`.
- Blocker 6 (`declaration: false`, `noEmit: true`) → **resolved
  additively** by a new `tsconfig.build.json` that extends
  `tsconfig.json`; `tsconfig.json` itself is unchanged.
- Blocker 7 (no `build` script) → **resolved** by adding
  `"build": "tsc -p tsconfig.build.json"` (wired via `"prepare"`).
- Blocker 8 (no `dist/` directory / convention) → **resolved** by
  the `dist-types/` convention. The directory is **committed** as
  the authoritative Phase 24H type-only package artifact for
  tag/release consumers, and reproducible from source via
  `npm run clean:types && npm run build`. `prepare` is kept as a
  development convenience that regenerates declarations on
  `npm install`, but the committed artifact is the authoritative
  path. No `dist/` (runtime JS) is added.
- Blocker 10 (`package-boundary.md` does not name the host barrel)
  → **resolved** by an additive section.

Three of the eleven blockers remain **explicitly deferred**:

- Blocker 1 (`"private": true`, not published).
- Blocker 9 (no release tag).
- Blocker 11 (Hounfour version skew).

These three deferred blockers are the load-bearing reasons a
sibling-repo dependency flip remains **out of scope**. `loa-dixie`
continues to consume the local adapter mirrors landed in Dixie
PR #96; a Dixie-side flip is blocked on (a) a Straylight tag /
release event under a separately reviewed publish-posture decision,
and (b) a Hounfour-skew resolution.

## Blocker resolution table

| # | ADR-024F blocker | Phase 24H posture | Resolution / deferral |
|---|---|---|---|
| 1 | `"private": true`, not published | **Deferred** | `private` preserved; no publish; no GitHub Packages adoption |
| 2 | No `exports` map | **Resolved** | Type-only `exports` map with `"."` and `"./host"` |
| 3 | No `./host` subpath | **Resolved** | `"./host"` added under `exports`, pointing at `.d.ts` |
| 4 | `main` points at TS source | **Resolved** | `"main"` removed; no runtime entrypoint in Phase 24H |
| 5 | No `types` / `typings` field | **Resolved** | `"types": "./dist-types/src/straylight/index.d.ts"` added |
| 6 | `declaration: false`, `noEmit: true` | **Resolved additively** | `tsconfig.json` unchanged; new `tsconfig.build.json` overrides |
| 7 | No `build` script | **Resolved** | `"build": "tsc -p tsconfig.build.json"`; wired via `"prepare"` |
| 8 | No `dist/` directory | **Resolved** | `dist-types/` produced by `npm run build` **and committed** as the authoritative Phase 24H type-only package artifact; reproducible from source via `clean:types && build`. |
| 9 | No release tag | **Deferred** | No tag created by Phase 24H |
| 10 | `package-boundary.md` does not name host barrel | **Resolved** | Additive section added; wedge sections 1–11 preserved |
| 11 | Hounfour version skew | **Deferred** | `^8.6.0` floor unchanged; `package-lock.json` unchanged |

## Files changed by Phase 24H

### Created

| Path | Purpose |
|---|---|
| [`../../tsconfig.build.json`](../../tsconfig.build.json) | Declaration-only build config; extends `tsconfig.json`; pins `rootDir: "."` so emit lands under `dist-types/src/straylight/...` matching `package.json` exports. |
| [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md) | Phase 24H opening ADR. Records type-only `./host` subpath implementation, the eight resolved blockers, the three deferred blockers, and the non-goals. |
| [`./phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md) | This handoff. |
| [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts) | Pin the `package.json` shape: `exports` keys, single `types` condition per entry, no runtime conditions, `files` includes `dist-types/`, `prepare` equals `npm run build`, no `main` field. |
| [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts) | Exercise type-only consumption end-to-end. Builds declarations if missing; creates a temp consumer fixture; symlinks `node_modules/@loa/straylight`; runs `tsc --noEmit` against `import type` consumption under `moduleResolution: "Bundler"` and `"NodeNext"`. |

### Modified

| Path | Change |
|---|---|
| [`../../package.json`](../../package.json) | `main` removed; `types` added; `exports` added (type-only, two subpaths); `files` added; `build` script added; `prepare` script added; all other scripts preserved; `private`, Hounfour `^8.6.0`, `engines`, `devDependencies` preserved. |
| [`../../.gitignore`](../../.gitignore) | `dist-types/` is **not** ignored — committed as the authoritative Phase 24H package artifact. Explanatory comment added. |
| [`../../dist-types/`](../../dist-types/) | **New, committed** declaration emit (created by `npm run build`). Authoritative type-only package artifact for tag/release consumers. Reproducible from source via `clean:types && build`. Treat future diffs as generated-artifact diffs caused by source/type-surface changes. |
| [`../../vitest.config.ts`](../../vitest.config.ts) | `dist-types/**` added to excludes. |
| [`../mvp/package-boundary.md`](../mvp/package-boundary.md) | Additive section documents `./host` subpath as type-only stable public API: six handler exports, helper / type exports, injected-dependency contract, type-only surface, no runtime import path in Phase 24H, no source fallback, one-way wedge↔host dependency invariant. Existing sections 1–11 preserved verbatim except for an additive cross-reference. |
| [`./README.md`](./README.md) | Phase 24H entry appended to the handoff index. Prior rows unchanged. |

### Unchanged (verified)

| Path | Reason |
|---|---|
| [`../../tsconfig.json`](../../tsconfig.json) | Project tsconfig remains `noEmit: true`, `declaration: false`. Declaration emission is opt-in via `tsconfig.build.json`. |
| [`../../package-lock.json`](../../package-lock.json) | No dependency add. No `npm install`. The new `build` script uses the existing TypeScript devDependency. |
| [`../../.npmrc`](../../.npmrc) | Registry configuration unchanged. |
| [`../../src/`](../../src/) | No source edit. The wedge public surface and the host barrel are byte-identical to their pre-Phase-24H state. |
| [`../../scripts/`](../../scripts/) | No script edit. The new `build` and `prepare` entries are `package.json` script keys, not new files under `scripts/`. |
| [`../../fixtures/`](../../fixtures/) | No fixture edit. |
| Existing tests under [`../../tests/`](../../tests/) | No edit to any pre-Phase-24H test. Only the two new Phase 24H test files are added. |
| Prior ADRs ([`../decisions/`](../decisions/)) | No edit to any pre-Phase-24H ADR. |
| Prior handoffs under [`.`](.) | No edit to any pre-Phase-24H handoff. |
| Sibling repos (`loa-dixie`, `loa-finn`, `loa-freeside`, `loa-hounfour`) | No edit. Dixie PR #96 remains transitional. |
| [`../../.loa`](../../.loa), [`../../.loa.config.yaml`](../../.loa.config.yaml), [`../../.claude/`](../../.claude/), [`../../.beads/`](../../.beads/), [`../../.run/`](../../.run/), [`../../.github/`](../../.github/), [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) | Out of scope. |

## Validation evidence

The validation commands and expected outcomes are:

```bash
npm run typecheck
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm test
npm pack --dry-run
git diff -- src/ scripts/ fixtures/ package-lock.json .npmrc
git diff -- tsconfig.json
git diff --stat
git status --short
```

Expected outcomes:

- `npm run typecheck` — clean (no source edits; tsconfig.json
  unchanged).
- `npm run build` — first runs `npm run clean:types` (a
  cross-platform Node `fs.rmSync` command that removes any
  stale `dist-types/` from a prior build, preventing stale-output
  false-confidence), then invokes `tsc -p tsconfig.build.json`.
  Emits declarations under
  `dist-types/src/straylight/index.d.ts` and
  `dist-types/src/straylight/host/index.d.ts`. The `rootDir: "."`
  setting is load-bearing: without it TypeScript would infer
  `rootDir` as `src/` and emit under `dist-types/straylight/...`,
  breaking the planned `package.json` exports paths.
- `ls` — both declaration files exist.
- `npm test` — passes. Two new Phase 24H test files exercise the
  package surface, declaration emit, npm-pack contents, the
  one-way wedge↔host import-direction delegation, and the
  type-only consumption end-to-end under Bundler and NodeNext.
  No existing test is edited.
- `npm pack --dry-run` — tarball preview includes ONLY
  `dist-types/**`, `README.md`, and `package.json`; respects the
  new `files` field. The Phase 24H package-exports test parses
  `npm pack --dry-run --json` and asserts (IMP-004):
  - the tarball contains the two named declaration files plus
    `package.json` + `README.md`;
  - every shipped path is either `package.json`, `README.md`, or
    under `dist-types/`;
  - no path under `src/`, `tests/`, `scripts/`, `fixtures/`,
    `docs/`, `node_modules/`, `.run/`, `.claude/`, `.loa/`,
    `.beads/`, `.github/`, or `grimoires/` appears;
  - no `tsconfig*.json`, `vitest.config.ts`, `.npmrc`,
    `.gitignore`, or `package-lock.json` ships;
  - every `dist-types/` entry is a `.d.ts` (or `.d.ts.map`)
    declaration file — no `.js`, no `.ts` source, no `.json`
    payload.
  No publish occurs.
- `git diff -- src/ scripts/ fixtures/ package-lock.json .npmrc` —
  empty.
- `git diff -- tsconfig.json` — empty.
- `git status --short` — `dist-types/` **is** present as a new
  committed-artifact directory (no longer gitignored). The Phase
  24H `.gitignore` edit removes `dist-types/` from the ignore
  list and adds an explanatory comment.

## Package surface shape (Phase 24H)

The new `exports` map in [`../../package.json`](../../package.json):

```json
{
  ".": {
    "types": "./dist-types/src/straylight/index.d.ts"
  },
  "./host": {
    "types": "./dist-types/src/straylight/host/index.d.ts"
  }
}
```

Load-bearing observations:

1. **Exactly one condition per entry: `"types"`.** No `"default"`,
   `"import"`, `"require"`, `"node"`, or `"browser"` condition. A
   runtime import does not resolve.
2. **Exactly two subpaths.** No `"./*"` glob. No re-export of any
   internal module. The wedge stable surface and the host barrel
   are the only two named public entrypoints.
3. **No TypeScript source fallback.** The `exports` map points
   exclusively at the `.d.ts` files emitted to `dist-types/`. A
   consumer cannot resolve through to `src/straylight/host/index.ts`
   via the package import.
4. **No `main` field.** A consumer that requires a runtime
   resolution path will fail to import. This is the intended Phase
   24H posture.

## Explicit non-scope (Phase 24H)

Phase 24H inherits every non-goal from ADR-024A / ADR-024B /
ADR-024C / ADR-024D / ADR-024E / ADR-024F wholesale, and adds:

1. **No JS / runtime emission.** No `dist/`; only `dist-types/`.
   No `"default"` / `"import"` / `"require"` / `"node"` /
   `"browser"` condition under `exports`.
2. **No TypeScript source fallback under `exports`.** The
   declaration emission is the only consumption path.
3. **No publish.** `npm pack --dry-run` is validation-only; no
   tarball is published. `"private": true` is preserved.
4. **No release tag.** A future sibling-repo dependency flip
   remains blocked on a separately reviewed tag / release event.
5. **No commit-SHA / `main` / git-HEAD consumption posture.** A
   sibling-repo dependency on `loa-straylight` via a commit-SHA
   pin against an unpublished tree, a `main`-HEAD git dependency,
   or a workspace-path link is non-conforming. Phase 24H does
   not authorize it.
6. **No actual Dixie dependency flip.** No edit to any sibling
   repo. No `loa-dixie` `package.json` change.
7. **Hounfour skew remains unresolved.** No `^8.6.0` bump. No
   `package-lock.json` change. None of the ADR-024F §"Hounfour
   version-skew stance" §4 postures selected.
8. **No Hounfour `#116` corpus import.** No five-step
   conformance corpus adopted.
9. **No `0xhoneyjar:straylight:*` audit-event prefix family
   adopted.** No `recall-wedge` Hounfour conformance category
   adopted.
10. **No vector 9 / 10 / 11 widening.** Phase 24B vectors 1–8
    remain the host-inspection test slice.
11. **No endpoint.** No HTTP / NATS / RPC / BFF / Discord /
    Telegram / GraphQL surface in `loa-straylight`.
12. **No public commitment-root behavior.** ADR-020E unchanged.
13. **No source edits.** No file under
    [`../../src/`](../../src/) is touched.
14. **No `tsconfig.json` edit.** The project tsconfig is
    byte-identical to its pre-Phase-24H state.
15. **No `package-lock.json` edit.** No dependency add.
16. **No `.npmrc` edit.** Registry configuration unchanged.
17. **No script edits.** No file under
    [`../../scripts/`](../../scripts/) is touched.
18. **No existing-test edits.** Only the two new Phase 24H test
    files are added.
19. **No prior-ADR or prior-handoff edits.** No edit to any file
    under [`../decisions/`](../decisions/) other than the new
    Phase 24H ADR. No edit to any file under [`./`](.) other
    than this new handoff and the README index entry authored
    alongside it.
20. **No Flatline / Bridgebuilder / red-team in the same
    commit.** A 3-model Flatline pass is expected **before
    merge**.

## Dixie posture (post-Phase-24H)

Dixie PR #96 remains the correct transitional seam. Phase 24H
does **not** flip Dixie's dependency. Specifically:

- Dixie's local adapter mirrors remain **correct** as a pre-
  consumption boundary. They are **transitional**, not a
  permanent ownership of the host scaffold's types.
- A future Dixie-side dependency flip remains **blocked** on:
  - **Blocker 1 (publish posture):** a Straylight-side decision
    to either preserve `"private": true` with a tag-pinned
    git-source consumption rule, or to un-`"private"` and adopt
    GitHub Packages. Neither posture is selected by Phase 24H.
  - **Blocker 9 (release tag):** a Straylight release tag /
    GitHub Release event under whichever publish posture is
    selected. No tag is created by Phase 24H.
  - **Blocker 11 (Hounfour skew):** a deliberate resolution of
    the version skew between Straylight's `^8.6.0` floor and
    Dixie's older pin, under one of the three ADR-024F
    §"Hounfour version-skew stance" §4 postures (Dixie bumps;
    Straylight raises floor under ADR-024C discipline; both
    sides hold under explicit duplicate-Hounfour isolation).
    None of the three postures is selected by Phase 24H.

A Dixie-side dependency flip PR that lands before all three of
those blockers are resolved is **non-conforming**. Reviewers may
cite this handoff and ADR-024G to refuse a premature flip.

### Hounfour-skew gate (SKP-007)

Phase 24H **does not** resolve the Hounfour version skew between
Straylight's `^8.6.0` floor and Dixie's older pin. The
`@0xhoneyjar/loa-hounfour` range is unchanged. No `npm install`
ran; `package-lock.json` is unchanged. None of the three
ADR-024F §"Hounfour version-skew stance" §4 postures is
selected.

The next integration phase in this lineage **must** be one of:

1. **A Hounfour-skew resolution phase.** A Straylight-side ADR /
   opening doc that explicitly selects one of the three ADR-024F
   §"Hounfour version-skew stance" §4 postures, with reasoning
   for the selection on file before any code change lands; OR
2. **A later phase whose opening doc explicitly selects one of
   the three postures.** If a future phase opens that touches
   `@loa/straylight/host` consumption discipline at all, its
   opening doc **must** name the selected posture; absence of
   that selection is a non-conforming opening.

**No Dixie dependency flip may proceed solely on the grounds
that `@loa/straylight/host` is now type-consumable.** Type-
consumability and Hounfour-skew resolution are **independent
gates**. Satisfying the type-consumability gate (which Phase 24H
satisfies) does not satisfy the Hounfour-skew gate (which Phase
24H explicitly defers). A Dixie-side dependency flip PR that
treats Phase 24H as authorization for the flip is non-conforming
on its face.

## Open questions / follow-ups

1. **Publish posture choice (Blocker 1) remains deferred.**
   The follow-up phase (Phase 24I or later) must choose between
   (a) preserve `"private": true` with tag-pinned git-source
   consumption, or (b) un-`"private"` and adopt GitHub Packages
   publishing. The choice is not pre-authorized by Phase 24H.
2. **Release-tag event (Blocker 9) remains deferred.** Whichever
   publish posture is selected, the actual tag / release event
   is a separate, later, reviewed change.
3. **Hounfour skew (Blocker 11) remains deferred.** None of the
   three ADR-024F §"Hounfour version-skew stance" §4 postures
   is selected. A Dixie-side flip cannot land until this is
   resolved.
4. **Runtime widening (Phase 24I or later) is deferred.** If a
   future consumer needs value-imports (not just type-imports),
   Phase 24I or later must emit JS, populate `dist/` (or
   equivalent), and add runtime conditions under `exports`. That
   is a strictly larger widening that must be reviewed
   separately under ADR-024F §"Recommended future implementation
   posture" §4.
5. **One-way wedge↔host dependency guard is automated now
   (SKP-006).** The invariant ("the host scaffold may import
   wedge primitives; the wedge public API must not import the
   host scaffold") is enforced by an existing automated test:
   [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts),
   describe block `phase-24c host — wedge does not depend on
   host`. Two test cases assert that
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   does not import from `./host/`, and that every wedge module
   source file under [`../../src/straylight/`](../../src/straylight/)
   does not import from `./host/`. The Phase 24H package-exports
   test records this delegation so a future test-file move is
   forced to update both pointers. A stronger import-graph tool
   (e.g. dependency-cruiser, madge) may be added in a future
   phase, but is **not** required: the invariant is **automated
   as of Phase 24H**, not deferred.
6. **`package-boundary.md` future updates.** Phase 24H adds an
   additive section for `./host`. Future package-surface changes
   (runtime widening, new subpaths, new conditions) require
   their own additive sections under their own teammate review.
7. **Hounfour `#70` pending feedback gate.** Phase 19A feedback
   on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
   remains pending and is **not** advanced by Phase 24H.

## Cross-references

- Companion ADR:
  [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md).
- Direct predecessor (decision-lock):
  [`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md).
- Phase 24G handoff:
  [`./phase-24g-host-package-consumption-readiness-plan.md`](./phase-24g-host-package-consumption-readiness-plan.md).
- Phase 24F handoff:
  [`./phase-24f-dixie-host-issue-draft.md`](./phase-24f-dixie-host-issue-draft.md).
- Phase 24E handoff:
  [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md).
- Phase 24D handoff:
  [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md).
- Phase 24C handoff:
  [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md).
- Phase 24B handoff:
  [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md).
- Phase 24A handoff:
  [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md).
- Phase 5 stable-surface freeze (additively widened by Phase 24H):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Host barrel (unchanged):
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
- Wedge public surface (unchanged):
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
