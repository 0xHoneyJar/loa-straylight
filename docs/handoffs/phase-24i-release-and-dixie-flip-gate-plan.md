# Phase 24I — Release and Dixie dependency-flip gate plan (docs-only)

> Status: Phase 24I **docs-only gate-plan handoff**. Companion ADR:
> [`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md).
>
> Phase 24I records the gates that still stand between the post-
> Phase-24H type-consumable package surface and a sibling-repo
> dependency flip. It selects no gate, cuts no tag, publishes no
> package, edits no source, edits no test, edits no fixture,
> edits no script, edits no `package.json` / `package-lock.json`
> / `tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts`
> / `.npmrc` / `.gitignore`, edits no committed declaration under
> [`../../dist-types/`](../../dist-types/), edits no
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md),
> edits no prior ADR, edits no prior handoff (other than this
> README index append), edits no sibling repo, files no GitHub
> issue / comment / PR, runs no Flatline / Bridgebuilder / red-
> team review, does not bump / downgrade / reconcile the
> Hounfour dependency range, does not consume Hounfour `main`
> or any unpublished commit, does not import the Hounfour `#116`
> five-step conformance corpus, does not adopt the
> `0xhoneyjar:straylight:*` audit-event prefix family into the
> Straylight public surface, does not adopt the `recall-wedge`
> Hounfour conformance category into the Straylight test suite,
> does not advance any ADR-022E gate, does not publish a public
> commitment root, and does not touch
> [`../../.loa`](../../.loa),
> [`../../.loa.config.yaml`](../../.loa.config.yaml),
> [`../../.claude/`](../../.claude/),
> [`../../.beads/`](../../.beads/),
> [`../../.run/`](../../.run/),
> [`../../.github/`](../../.github/),
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
> `node_modules/`.
>
> No Flatline pass is required because Phase 24I makes no
> package-surface or source change.
>
> The Phase 19A pending feedback gate on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> remains pending and is **not** advanced by Phase 24I.

## Executive summary

Phase 24H (ADR-024G + the Phase 24H summary handoff, merged via
PR #34) made the Straylight package surface **type-only
consumable** for any consumer in the supported envelope
(TypeScript >= 5.4; `moduleResolution: "Bundler"` or
`"NodeNext"`; `import type` only; tag- / release-pinned git
source). Eight of the eleven ADR-024F-enumerated blockers were
resolved by Phase 24H. **Three blockers remain explicitly
deferred**, and those three deferred blockers form the gate set
Phase 24I records.

Three gates therefore still stand between the post-Phase-24H
state and a future `loa-dixie` dependency flip from local type
mirrors to `import type { ... } from '@loa/straylight/host'`:

1. **Gate 1 — Publish posture.** Either preserve `"private":
   true` with a tag-pinned git-source consumption rule, or
   un-`"private"` and adopt GitHub Packages publishing. Hybrid
   is refused.
2. **Gate 2 — Release / tag consumption point.** A reviewed
   Straylight release / tag event must exist, must verify the
   `dist-types/` / `npm pack --dry-run` / typecheck / build /
   test invariants against the tagged tree, and must be cited
   by the future Dixie flip PR.
3. **Gate 3 — Hounfour version-skew resolution.** Either Dixie
   bumps to a compatible Hounfour line, Straylight changes its
   Hounfour posture under ADR-024C-style discipline, or
   duplicate-Hounfour isolation is explicitly designed and
   reviewed.

Phase 24I **selects none of the gates**. Phase 24I **refuses
premature flips**. A future Dixie dependency-flip PR is
conforming only if **all three gates** are independently
satisfied and cited at the time the flip PR opens; satisfying
one or two gates is not enough. Gate resolution order is **not
fixed** — the gate-of-gates rule is a conjunction, not a
temporal sequence.

The full constraint set, refusal rules, and future-phase entry
conditions live in the companion ADR
([`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md)).
This handoff is the operator-facing summary.

### Phase 24H recap (what Phase 24I does NOT redo)

Phase 24H made the type-only package surface **real**:

- `@loa/straylight` ships type-only exports for `"."` and
  `"./host"` via the `package.json` `exports` map.
- No runtime export condition exists (no `"default"`, no
  `"import"`, no `"require"`, no `"node"`, no `"browser"`).
- No `main` field. No runtime JS. No `dist/` directory.
- Committed [`../../dist-types/`](../../dist-types/) declaration
  emit, reproducible from source via `npm run clean:types &&
  npm run build`.
- TypeScript `>= 5.4` REQUIRED, pinned via `devDependencies`,
  asserted by the Phase 24H consumption test.
- Supported `moduleResolution` modes: exactly `"Bundler"` and
  `"NodeNext"`. Legacy modes (`"node"`, `"classic"`, `"node10"`,
  `"node16"`) are pinned as expected-to-fail.
- Runtime / value imports are unsupported by design and pinned
  as expected-to-fail by the consumption test. Failure to
  resolve with `ERR_PACKAGE_PATH_NOT_EXPORTED` is the intended
  posture, not a defect.
- `"private": true` preserved.
- Hounfour declared at `@0xhoneyjar/loa-hounfour@^8.6.0`,
  unchanged.
- No tag, no release, no publish.

Phase 24I changes none of the above. The package state inherited
from Phase 24H is the baseline against which the gate plan is
written.

## Current package state recap (post-Phase-24H baseline)

| Fact | Value | Source |
|---|---|---|
| Package name | `@loa/straylight` | [`../../package.json`](../../package.json) `name` |
| Version | `0.0.1` | [`../../package.json`](../../package.json) `version` |
| `private` | `true` | [`../../package.json`](../../package.json) `private` |
| Module type | ESM (`"module"`) | [`../../package.json`](../../package.json) `type` |
| Type-only exports | `"."` and `"./host"`, each with exactly one `"types"` condition | [`../../package.json`](../../package.json) `exports` |
| Runtime conditions under `exports` | **None.** No `"default"`, no `"import"`, no `"require"`, no `"node"`, no `"browser"` | [`../../package.json`](../../package.json) `exports` (Phase 24H test asserts) |
| `main` field | **Absent** | [`../../package.json`](../../package.json) |
| `types` field | `./dist-types/src/straylight/index.d.ts` | [`../../package.json`](../../package.json) `types` |
| `files` field | `["dist-types/", "README.md", "package.json"]` | [`../../package.json`](../../package.json) `files` |
| `build` script | `npm run clean:types && tsc -p tsconfig.build.json` | [`../../package.json`](../../package.json) `scripts.build` |
| `prepare` script | `npm run build` (development convenience) | [`../../package.json`](../../package.json) `scripts.prepare` |
| Declaration emit directory | [`../../dist-types/`](../../dist-types/) (committed, authoritative for tag/release consumers) | [`../../tsconfig.build.json`](../../tsconfig.build.json), [`../../.gitignore`](../../.gitignore) |
| Runtime JS emission | **None.** No `dist/` directory. No `.js` in the package tarball. | Phase 24H package-exports test invariants |
| Supported TypeScript | `>= 5.4`, pinned via `devDependencies` and asserted by Phase 24H consumption test | [`../../package.json`](../../package.json) `devDependencies.typescript` |
| Supported `moduleResolution` modes | `"Bundler"` and `"NodeNext"` only | Phase 24H consumption test |
| Runtime / value imports | Unsupported by design; expected to fail with `ERR_PACKAGE_PATH_NOT_EXPORTED` | Phase 24H consumption test |
| Hounfour dependency | `@0xhoneyjar/loa-hounfour@^8.6.0` | [`../../package.json`](../../package.json) `dependencies` |
| Release tag | **None.** No `git tag` created. No GitHub Release exists. | repository state |
| Publish | **None.** Not on any registry. | `"private": true` preserved |

This baseline is **byte-identical** to the post-PR-#34 state.
Phase 24I edits none of it.

## Three-gate table

| # | Gate | Current state | Why it blocks Dixie | Allowed resolution postures | Forbidden shortcuts | Required evidence in the future Dixie flip PR |
|---|---|---|---|---|---|---|
| 1 | **Publish posture** | `"private": true` preserved by Phase 24H. No publish step exists. No GitHub Packages adoption. | A Dixie `package.json` entry pointing at `@loa/straylight` cannot resolve via any registry because the package is not on a registry, and the consumption mechanism (git source vs. registry) is not selected. The selecting ADR must pin tradeoffs across registry auth, package visibility, version semantics, CI/publish discipline, and tag/release discipline. | (a) preserve `"private": true` + tag-pinned git-source consumption; (b) un-`"private"` + GitHub Packages publishing. Each requires a Straylight-side ADR that reasons about the five tradeoff axes (registry auth; package visibility; version semantics; CI/publish discipline; tag/release discipline). | Hybrid posture is refused (e.g. `"private": true` AND a `publish` step). Publishing without ADR-selecting Posture 1b is refused. Un-`"private"`-ing without ADR-selecting Posture 1b is refused. Adopting a third posture not enumerated in ADR-024H §2 without a later ADR re-opening §2 is refused. | The Dixie flip PR cites the Straylight-side publish-posture-selecting ADR by name, and the `loa-straylight` package configuration on `main` unambiguously reflects the selected posture. |
| 2 | **Release / tag consumption point** | No `git tag` exists for a Phase-24H-aware Straylight tree. No GitHub Release exists. | A sibling-repo consumer cannot point at a non-existent release event. The package's `dist-types/` are committed and reproducible, but no immutable reference (tag or published version) exists for a sibling-repo dependency entry to cite. | Cut a reviewed Straylight tag / release event under whichever publish posture Gate 1 selects. The release / tag execution phase must verify `npm run typecheck`, `npm run build`, `npm test`, and `npm pack --dry-run --json` against the tagged tree; must verify the committed `dist-types/**` matches source-generated output; and must verify the packaged artifact contains only allowed files. | `main`-HEAD consumption is refused (`"#main"` or any non-tag git reference). Raw commit-SHA dependency flip is refused (commit SHAs are not release events). Unpublished working-tree dependency flip is refused as a production posture (acceptable only as ephemeral local-only dev link, never on `main`). Workspace-path dependency flip is refused as a production posture. | The Dixie flip PR cites the **exact** Straylight tag / release event; the cited event's verification commands have passed against the tagged tree; the cited event predates the Dixie flip PR. |
| 3 | **Hounfour version-skew resolution** | Straylight declares `@0xhoneyjar/loa-hounfour@^8.6.0`. Dixie has an older / non-matching Hounfour posture (the exact Dixie-side version is Dixie-side state and must be directly verified in Dixie at the resolving phase; Phase 24I does not authoritatively restate it). The two posture sets must be reconciled or explicitly isolated. | A Dixie dependency flip that brings `@loa/straylight` into Dixie's tree drags `@0xhoneyjar/loa-hounfour@^8.6.0` as a transitive requirement; an unreconciled Dixie Hounfour pin against `^8.6.0` produces either a silent duplicate Hounfour, a `peerDependencies` warning, or a hard install failure depending on resolver. Without an explicit posture, "it compiles" is not evidence that class-vs-policy / receipt-or-audit / audit-chain semantics are preserved across two Hounfour instances. | (3a) Dixie bumps to a compatible Hounfour line under Dixie-side review; (3b) Straylight changes Hounfour posture under ADR-024C-style discipline; (3c) duplicate-Hounfour isolation is explicitly designed and reviewed (which side owns which Hounfour primitives at runtime; how invariants are preserved across two Hounfour instances). | Hounfour `main` / unpublished consumption is refused (inherits ADR-024C). Hounfour commit-SHA as a silent fix is refused (commit-SHA pins inserted to make a typecheck pass without an ADR are non-conforming). Implicit acceptance of duplicate or conflicting Hounfour semantics is refused ("it compiles" is not sufficient). | The Dixie flip PR cites the Hounfour skew posture decision (Posture 3a Dixie-side bump PR; Posture 3b Straylight-side Hounfour ADR; Posture 3c isolation design doc), and demonstrates that the selected posture's refusal rules are honored. |

## Gate-of-gates examples

Two ordering examples are below. These are **examples**, not
prescriptions; gate resolution order is not fixed by Phase 24I.
Any ordering of Gate 1 / Gate 2 / Gate 3 that ends with all
three independently satisfied at the time the Dixie flip PR
opens is conforming.

### Example A — Gate 3 (Hounfour) resolves first

1. **Phase 24J (hypothetical) — Hounfour skew resolution.**
   Dixie-side review approves a Dixie `package.json` bump to a
   Hounfour line that overlaps Straylight's `^8.6.0` floor
   (Posture 3a). The bump PR cites ADR-024H §4. Gate 3 is now
   satisfied.

   - **Gate 3 ✅. Gate 1 ❌. Gate 2 ❌.**
   - A Dixie dependency-flip PR opened now would be
     **non-conforming**: Gate 1 and Gate 2 are unsatisfied.
     Hounfour-skew resolution alone does **not** authorize a
     Dixie flip.

2. **Phase 24K (hypothetical) — Publish-posture selection.**
   Straylight-side ADR-024I (hypothetical numbering) is merged.
   It selects Posture 1a (`"private": true` + tag-pinned
   git-source consumption) and reasons through the five
   tradeoff axes. The package configuration on `main`
   unambiguously reflects Posture 1a (no `publish` step added;
   `"private": true` preserved). Gate 1 is now satisfied.

   - **Gate 3 ✅. Gate 1 ✅. Gate 2 ❌.**
   - A Dixie dependency-flip PR opened now would still be
     **non-conforming**: no tag exists for Dixie to cite.

3. **Phase 24L (hypothetical) — Release / tag execution.**
   A Straylight release / tag event is cut against a verified
   `main`. `npm run typecheck`, `npm run build`, `npm test`,
   and `npm pack --dry-run --json` all pass against the tagged
   tree. The committed `dist-types/**` matches source-generated
   output. The packaged artifact contains only allowed files.
   Gate 2 is now satisfied.

   - **Gate 3 ✅. Gate 1 ✅. Gate 2 ✅.**

4. **Dixie-side dependency-flip PR (in `loa-dixie`).** Cites
   ADR-024H, cites the Phase-24J Hounfour bump PR (Gate 3
   evidence), cites the Phase-24K publish-posture ADR (Gate 1
   evidence), cites the Phase-24L tag event (Gate 2 evidence).
   Replaces Dixie's local type mirrors with `import type { ... }
   from '@loa/straylight/host'`. Does **not** add value imports,
   runtime imports, endpoint changes, or any of the other
   refused changes from ADR-024H §6. Dixie-side review approves.

### Example B — Gate 2 (release / tag) resolves before Gate 3 (Hounfour)

1. **Phase 24J (hypothetical) — Publish-posture selection.**
   Straylight-side ADR-024I selects Posture 1b (un-`"private"` +
   GitHub Packages publishing) and reasons through the five
   tradeoff axes. The package configuration on `main` reflects
   Posture 1b (a `publish` step added under a separately-reviewed
   posture; `"private": false`). Gate 1 is now satisfied.

   - **Gate 1 ✅. Gate 2 ❌. Gate 3 ❌.**

2. **Phase 24K (hypothetical) — Release / tag execution.** A
   `v0.1.0` (illustrative) release is cut under Posture 1b. The
   verification commands all pass. A GitHub Packages publish
   step (separately reviewed) lands the package on the GitHub
   Packages registry. Gate 2 is now satisfied.

   - **Gate 1 ✅. Gate 2 ✅. Gate 3 ❌.**
   - A Dixie dependency-flip PR opened now would still be
     **non-conforming**: Hounfour skew is unresolved. Release /
     tag readiness alone does **not** authorize a Dixie flip.

3. **Phase 24L (hypothetical) — Hounfour skew resolution.**
   Straylight-side ADR (Posture 3b) changes the Hounfour posture
   under ADR-024C discipline. Either the Straylight `^8.6.0`
   floor is raised to match Dixie's pin, or both sides hold and
   a Posture 3c isolation design is reviewed. Gate 3 is now
   satisfied.

   - **Gate 1 ✅. Gate 2 ✅. Gate 3 ✅.**

4. **Dixie-side dependency-flip PR (in `loa-dixie`).** Cites
   ADR-024H and all three gate-satisfying events. Approved
   Dixie-side.

### Common thread

Across both examples:

- The Dixie flip PR **must cite ADR-024H** by name.
- The Dixie flip PR **must cite each of the three gates** by
  pointing at the resolving event (Straylight ADR, tag / release,
  Dixie-side bump PR, or isolation design doc).
- A Dixie flip PR that cites Phase 24H alone — without citing
  later resolving events for Gate 1, Gate 2, and Gate 3 — is
  **non-conforming on its face**.

## Dixie dependency flip protocol

The actual Dixie dependency flip is a **future Dixie-side PR**.
It is reviewed under Dixie-side review process. Straylight-side
review is limited to the publish-posture ADR (Gate 1) and the
release / tag phase (Gate 2); Straylight does not pre-approve
the Dixie flip itself.

The future Dixie-side flip PR **must**:

- Cite ADR-024H by name.
- Cite the resolving event for each of the three gates (Gate 1
  Straylight-side ADR; Gate 2 Straylight tag / release event;
  Gate 3 Dixie-side bump PR, Straylight-side Hounfour ADR, or
  isolation design doc — whichever was selected).
- Remain **type-only**: replace Dixie's local type mirrors with
  `import type { ... } from '@loa/straylight/host'` (and / or
  `import type { ... } from '@loa/straylight'`).
- Honor the Phase 24H supported-consumer envelope (TypeScript
  >= 5.4; `moduleResolution: "Bundler"` or `"NodeNext"`; `import
  type` only).

The future Dixie-side flip PR **must not**:

- Add value imports, runtime imports, dynamic `import()` calls,
  or `require()` calls against `@loa/straylight*`. Runtime
  widening requires a separate Straylight-side ADR per ADR-024G
  Decision rule §2.
- Bundle endpoint changes, runtime route changes, new rendering
  surfaces, vector 9 / 10 / 11 widening, Hounfour `#116`
  adoption, `0xhoneyjar:straylight:*` adoption, public
  commitment-root behavior, or any runtime Straylight import
  into Dixie.

A future Dixie-side flip PR that opens before any gate is
satisfied, that cannot name the resolving event for each gate,
or that bundles refused changes, is **non-conforming on its
face**. Reviewers (Dixie-side or Straylight-side observers) may
cite ADR-024H §5 / §6 to refuse it.

## Validation

Phase 24I is **docs-only**. The package surface, source,
declarations, tests, and configuration are byte-identical to
the post-PR-#34 (Phase 24H) state. Validation is limited to
asserting that:

- the package state still builds;
- the test suite still passes;
- the declaration entrypoints still exist;
- `npm pack --dry-run` is still shaped the same as Phase 24H;
- the forbidden-path diff is empty.

### Validation commands

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
```

### Expected outcomes

- `npm run typecheck` — clean. (No source edit; `tsconfig.json`
  unchanged.)
- `npm test` — passes. (No test added; no test edited; the two
  Phase 24H tests
  [`phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts)
  and
  [`phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
  continue to pass against the unchanged package state.)
- `npm run build` — clean. Emits
  `dist-types/src/straylight/index.d.ts` and
  `dist-types/src/straylight/host/index.d.ts`. (No source / type
  surface edit; the rebuilt artifact is byte-identical to the
  committed `dist-types/**`.)
- `ls dist-types/src/straylight/index.d.ts
  dist-types/src/straylight/host/index.d.ts` — both files exist.
- `npm pack --dry-run` — tarball preview is identical in shape
  to the Phase 24H baseline (only `dist-types/**`, `README.md`,
  and `package.json` ship; no `tsconfig*.json`, no
  `vitest.config.ts`, no `.npmrc`, no `.gitignore`, no
  `package-lock.json`, no `src/`, no `tests/`, no `scripts/`,
  no `fixtures/`, no `docs/`).
- Forbidden-path diff is **empty**: `git diff -- src/ tests/
  fixtures/ scripts/ package.json package-lock.json
  tsconfig.json tsconfig.build.json vitest.config.ts .npmrc
  .gitignore dist-types/ docs/mvp/package-boundary.md` produces
  no output.
- `git diff --stat` — shows only the three Phase 24I docs.
- `git status --short` — shows only the three Phase 24I docs
  plus any pre-existing local dirt (the
  [`../../.loa`](../../.loa) /
  [`../../.loa.config.yaml`](../../.loa.config.yaml) modified
  state, and the untracked `.claude/...` / `grimoires/loa/a2a/`
  paths visible in the pre-task `git status` snapshot are
  pre-existing and not introduced by Phase 24I).

**No new tests.** Phase 24I does not author or modify any test.

**No package mutation.** Phase 24I does not run `npm install`,
`npm update`, `npm ci`, `npm publish`, or any package-manager
mutation command. No tag is created. No release is cut.

## Explicit non-scope

Phase 24I inherits every non-goal from ADR-024A / ADR-024B /
ADR-024C / ADR-024D / ADR-024E / ADR-024F / ADR-024G wholesale,
and adds these Phase 24I-specific refusals (mirroring ADR-024H
§7):

1. **No `package.json` edit.** The package surface defined by
   Phase 24H is preserved verbatim.
2. **No `package-lock.json` edit.** No dependency change.
3. **No `tsconfig.json` / `tsconfig.build.json` edit.** Build
   configuration unchanged.
4. **No source edit.** No file under
   [`../../src/`](../../src/) is touched. The wedge public
   surface and the host barrel are byte-identical to their
   post-Phase-24H state.
5. **No test edit.** No file under
   [`../../tests/`](../../tests/) is touched. The Phase 24H
   tests continue to pass against the unchanged state.
6. **No dist-types/ edit.** No file under
   [`../../dist-types/`](../../dist-types/) is touched. The
   committed Phase 24H declaration emit is preserved.
7. **No script edit.** No file under
   [`../../scripts/`](../../scripts/) is touched.
8. **No fixture edit.** No file under
   [`../../fixtures/`](../../fixtures/) is touched.
9. **No `vitest.config.ts` / `.npmrc` / `.gitignore` edit.**
10. **No package-boundary edit.**
    [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    is read-only.
11. **No prior-ADR edit.** ADR-024H is additive; ADR-024A
    through ADR-024G are preserved verbatim.
12. **No prior-handoff edit.** Only this new handoff is created
    under [`./`](./); the README index entry authored alongside
    is the only other handoff-directory change.
13. **No release tag.** No `git tag`. No GitHub Release.
14. **No publish.** No `npm publish`. No GitHub Packages
    adoption. `"private": true` preserved.
15. **No `npm install` / `npm update` / `npm ci` /
    `npm publish` / `npm pack` (as a publish step).** Validation
    `npm pack --dry-run` is allowed (it is read-only).
16. **No Hounfour bump.** `@0xhoneyjar/loa-hounfour@^8.6.0`
    preserved verbatim.
17. **No Hounfour `#116` corpus import.** No
    `0xhoneyjar:straylight:*` adoption. No `recall-wedge`
    Hounfour conformance category adoption.
18. **No sibling-repo edit.** No edit to `loa-dixie`,
    `loa-finn`, `loa-freeside`, or `loa-hounfour`.
19. **No GitHub issue / comment / PR action.** No filing, no
    editing, no commenting on any GitHub issue or PR.
20. **No Flatline / Bridgebuilder / red-team review.** Phase 24I
    makes no package-surface or source change; multi-model
    adversarial review is not warranted.
21. **No ADR-022E gate advance.** No Phase 19A pending feedback
    advance. No commitment-root publication.

## Open questions / follow-ups

1. **Publish posture selection (Gate 1) remains deferred.** A
   future Straylight-side ADR must select Posture 1a (private +
   tag-pinned git-source consumption) or Posture 1b (un-private
   + GitHub Packages publishing), and reason through the five
   tradeoff axes (registry auth; package visibility; version
   semantics; CI/publish discipline; tag/release discipline).
   Hybrid posture is refused unless a later ADR explicitly
   reopens ADR-024H §2.
2. **Exact release / tag event (Gate 2) remains deferred.** The
   release / tag execution phase is a separate, later, reviewed
   change. It must verify `npm run typecheck`, `npm run build`,
   `npm test`, `npm pack --dry-run --json`, the committed
   `dist-types/**` matching source-generated output, and the
   packaged artifact containing only allowed files. The exact
   version label (`v0.0.1`, `v0.1.0`, `v1.0.0`, or another
   choice) is not pre-authorized by Phase 24I.
3. **Hounfour skew posture (Gate 3) remains deferred.** A
   future opening doc must select Posture 3a (Dixie bumps to
   compatible Hounfour line), Posture 3b (Straylight changes
   Hounfour posture under ADR-024C-style discipline), or
   Posture 3c (duplicate-Hounfour isolation explicitly designed
   and reviewed). The exact Dixie-side Hounfour pin is
   Dixie-side state and must be directly verified in Dixie at
   that resolving phase; Phase 24I does not authoritatively
   restate it.
4. **Future Dixie dependency flip PR (in `loa-dixie`).** A
   Dixie-side PR that replaces Dixie's local type mirrors with
   `import type { ... } from '@loa/straylight/host'`. It opens
   only after all three gates are satisfied and cites ADR-024H
   plus each gate's resolving event. It is reviewed Dixie-side;
   Straylight-side does not pre-approve.
5. **Optional future Dixie flip acceptance packet (if needed).**
   A Straylight-side handoff that records the Dixie flip PR
   landing and acknowledges the cross-repo state transition.
   Not authored by Phase 24I; not pre-authorized by Phase 24I.
   May or may not be necessary depending on how Dixie-side
   review documents the flip.
6. **Runtime widening (separate from Gate 1 / 2 / 3) remains
   deferred.** Per ADR-024G Decision rule §2, runtime / value
   imports against `@loa/straylight*` are unsupported by design
   in Phase 24H, and remain unsupported through any combination
   of Gate 1 / Gate 2 / Gate 3 resolution. A future runtime-
   widening ADR (Phase 24J or later in some lineage; numbering
   not pre-committed) is required before Dixie or any other
   consumer may add value / runtime imports. Phase 24I does not
   authorize runtime widening.
7. **Hounfour `#70` pending feedback gate.** Phase 19A
   feedback on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
   remains pending and is **not** advanced by Phase 24I.

## Cross-references

- Companion ADR:
  [`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md).
- Direct predecessor (implementation):
  [`./phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md).
- Direct predecessor (decision-lock):
  [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md).
- Readiness-plan predecessor:
  [`./phase-24g-host-package-consumption-readiness-plan.md`](./phase-24g-host-package-consumption-readiness-plan.md).
- Readiness-plan decision-lock:
  [`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md).
- Package-release ambiguity discipline (Gate 3 refusal rules
  inherit):
  [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md).
- Phase 5 stable-surface freeze (read-only; not edited by Phase
  24I): [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Phase 24F Dixie-side handoff draft (read-only):
  [`./phase-24f-dixie-host-issue-draft.md`](./phase-24f-dixie-host-issue-draft.md).
- Phase 24E Dixie host handoff packet (read-only):
  [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md).
- Phase 24D Dixie host scaffold hardening (read-only):
  [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md).
- Phase 24C Dixie host scaffold (read-only):
  [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md).
- Phase 24B Dixie recall-host plan (read-only):
  [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md).
- Phase 24A Hounfour #116 intake + host decision (read-only):
  [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md).
- Host barrel (unchanged):
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
- Wedge public surface (unchanged):
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
- Committed declaration emit (unchanged):
  [`../../dist-types/`](../../dist-types/).
