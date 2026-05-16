# Phase 24J — Release posture selection (docs-only)

> Status: Phase 24J **docs-only release-posture selection
> handoff**. Companion ADR:
> [`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md).
>
> Phase 24J selects **Gate 1** from ADR-024H §"Decision" §2 as
> **Posture 1a** (private + tag-pinned git-source consumption).
> Phase 24J **prepares Gate 2** by pinning the tag-readiness
> checklist that a future release / tag execution phase must
> run against any tagged tree; Phase 24J does **not satisfy**
> Gate 2 because Phase 24J cuts no tag. Phase 24J does **not
> satisfy** Gate 3; the Hounfour version-skew posture remains
> unresolved and continues to independently block any Dixie
> dependency-flip PR.
>
> Phase 24J cuts no tag, publishes no package, edits no
> [`../../package.json`](../../package.json) /
> [`../../package-lock.json`](../../package-lock.json) /
> [`../../.npmrc`](../../.npmrc) /
> [`../../.gitignore`](../../.gitignore) /
> [`../../tsconfig.json`](../../tsconfig.json) /
> [`../../tsconfig.build.json`](../../tsconfig.build.json) /
> [`../../vitest.config.ts`](../../vitest.config.ts), edits no
> file under [`../../src/`](../../src/) /
> [`../../tests/`](../../tests/) /
> [`../../scripts/`](../../scripts/) /
> [`../../fixtures/`](../../fixtures/) /
> [`../../dist-types/`](../../dist-types/), edits no
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md),
> edits no prior ADR, edits no prior handoff (other than the
> README index entry authored alongside this handoff), edits no
> sibling repo (`loa-dixie`, `loa-finn`, `loa-freeside`,
> `loa-hounfour`), files no GitHub issue / comment / PR, bumps
> no Hounfour dependency range, runs no Flatline /
> Bridgebuilder / red-team review, and does not touch
> [`../../.loa`](../../.loa) /
> [`../../.loa.config.yaml`](../../.loa.config.yaml) /
> [`../../.claude/`](../../.claude/) /
> [`../../.beads/`](../../.beads/) /
> [`../../.run/`](../../.run/) /
> [`../../.github/`](../../.github/) /
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) or
> `node_modules/`.
>
> No Flatline pass is required because Phase 24J makes no
> package-surface or source change.
>
> The Phase 19A pending feedback gate on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> remains pending and is **not** advanced by Phase 24J.

## Executive summary

Phase 24J selects **private + tag-pinned git-source
consumption** (Posture 1a from ADR-024H §"Decision" §2) as the
first Straylight release posture. Sibling-repo consumers of
`@loa/straylight` (chiefly `loa-dixie`, eventually) will consume
the package via a **reviewed, immutable Straylight tag** —
`"@loa/straylight":
"github:0xHoneyJar/loa-straylight#v<X.Y.Z>"` — rather than via a
published registry release. The `"private": true` flag is
preserved verbatim. No `npm publish` step is added. No GitHub
Packages publish workflow is added. No `@loa` scope is mapped to
any registry.

Phase 24J **does not cut the tag**: the actual release / tag
event is a separate, later, reviewed change with its own opening
ADR. Phase 24J **does not publish**. Phase 24J **does not change
package metadata** (`package.json`, `package-lock.json`,
`.npmrc`, `.github/workflows/`, `tsconfig*.json`,
`vitest.config.ts`, `.gitignore`). Phase 24J **does not change
Hounfour**; the `@0xhoneyjar/loa-hounfour@^8.6.0` range is
preserved verbatim. Phase 24J **does not edit any sibling
repo**. Phase 24J **does not authorize Dixie** to flip its
`@loa/straylight` dependency consumption; the Dixie flip remains
non-conforming until all three of ADR-024H's gates are
independently satisfied.

The companion ADR
([`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md))
carries the full constraint set: the Posture 1a / 1b refusal
rules, the tag-readiness checklist that a future release / tag
execution phase must run, the refused consumption shortcuts, the
Dixie flip rule after Phase 24J, the explicit non-scope, and the
future-phase entry conditions for the release / tag execution
phase, the Hounfour-skew decision phase, and the Dixie
dependency-flip phase. This handoff is the operator-facing
summary.

### Phase 24H + Phase 24I recap (what Phase 24J does not redo)

Phase 24H made the type-only package surface **real**: a
type-only `exports` map with two subpaths (`"."`, `"./host"`),
each with exactly one `"types"` condition; committed
`dist-types/` declaration emit reproducible from source; no
`main`; no runtime conditions; `"private": true` preserved;
Hounfour declared at `@0xhoneyjar/loa-hounfour@^8.6.0`,
unchanged; no tag; no publish.

Phase 24I enumerated three conjunctive gates between the
post-Phase-24H type-consumable surface and a future Dixie
dependency flip — Gate 1 publish posture, Gate 2 release / tag
consumption point, Gate 3 Hounfour version-skew resolution —
but selected **none** of them, cut no tag, published nothing,
made no Hounfour change, and edited no sibling repo. ADR-024H
§1 confirmed that gate resolution order is **not fixed**; the
binding rule is the conjunction at flip time, not the temporal
sequence.

Phase 24J selects Gate 1 (as Posture 1a) and prepares Gate 2.
Gate 3 remains independent and unresolved.

## Current package baseline (post-Phase-24I)

The package configuration on `main` after PR #35 merged is
**byte-identical** to the post-Phase-24H baseline. Phase 24J
selects Posture 1a against this observed state and makes no
edit to it:

| Fact | Value | Source |
|---|---|---|
| Package name | `@loa/straylight` | [`../../package.json`](../../package.json) `name` |
| Version | `0.0.1` | [`../../package.json`](../../package.json) `version` |
| `private` | `true` | [`../../package.json`](../../package.json) `private` |
| Module type | ESM (`"module"`) | [`../../package.json`](../../package.json) `type` |
| Type-only exports | `"."` and `"./host"`, each with exactly one `"types"` condition | [`../../package.json`](../../package.json) `exports` |
| Runtime conditions under `exports` | **None.** No `"default"`, no `"import"`, no `"require"`, no `"node"`, no `"browser"` | [`../../package.json`](../../package.json) `exports` |
| `main` field | **Absent** | [`../../package.json`](../../package.json) |
| `types` field | `./dist-types/src/straylight/index.d.ts` | [`../../package.json`](../../package.json) `types` |
| `files` field | `["dist-types/", "README.md", "package.json"]` | [`../../package.json`](../../package.json) `files` |
| `build` script | `npm run clean:types && tsc -p tsconfig.build.json` | [`../../package.json`](../../package.json) `scripts.build` |
| `prepare` script | `npm run build` (development convenience) | [`../../package.json`](../../package.json) `scripts.prepare` |
| `publish` script | **Absent.** No `prepublishOnly`, no `prepack`, no `postpublish` either | [`../../package.json`](../../package.json) `scripts` |
| Declaration emit directory | [`../../dist-types/`](../../dist-types/) (committed, authoritative for tag / release consumers) | [`../../tsconfig.build.json`](../../tsconfig.build.json), [`../../.gitignore`](../../.gitignore) |
| Runtime JS emission | **None.** No `dist/` directory. No `.js` in the package tarball. | Phase 24H package-exports test invariants |
| Hounfour dependency | `@0xhoneyjar/loa-hounfour@^8.6.0` | [`../../package.json`](../../package.json) `dependencies` |
| `@loa` registry mapping | **None.** [`../../.npmrc`](../../.npmrc) declares `@0xhoneyjar:registry=...` only | [`../../.npmrc`](../../.npmrc) |
| Publish workflow for `@loa/straylight` | **None.** [`../../.github/workflows/post-merge.yml`](../../.github/workflows/post-merge.yml) performs tag creation under Loa-framework discipline but contains no `npm publish` step and no GitHub Packages publish job | [`../../.github/workflows/`](../../.github/workflows/) |
| Release tag | **None.** `git tag --list` is empty. No GitHub Release exists. | repository state |
| Publish | **None.** Not on any registry. | `"private": true` preserved |

This baseline is **byte-identical** to the post-PR-#35 state.
Phase 24J edits none of it.

## Posture selection

| Posture | Phase 24J disposition | Notes |
|---|---|---|
| **Posture 1a — private + tag-pinned git-source consumption** | **SELECTED** | Preserve `"private": true`; no `npm publish`; no GitHub Packages adoption; no `@loa` registry setup; sibling-repo consumption via tag-pinned git source (`"@loa/straylight": "github:0xHoneyJar/loa-straylight#v<X.Y.Z>"`); committed `dist-types/**` is the authoritative type-only package artifact. Current `package.json` / `.npmrc` / `.github/workflows/` configuration already reflects this posture unambiguously; no edit required. |
| **Posture 1b — un-private + GitHub Packages publishing** | **REJECTED FOR NOW** | Requires: lifting `"private": true`; adding a `publish` step under separately-reviewed posture (manual gate, OIDC-bound, or tag-triggered workflow); mapping the `@loa` scope in `.npmrc`; configuring publish credentials; deciding package visibility; deciding versioning cadence. None of that infrastructure exists today. A future ADR may reopen this rejection under its own teammate review. |
| **Hybrid posture** | **REFUSED** | Per ADR-024H §2. A change that simultaneously preserves `"private": true` and adds a `publish` script (or un-`private`s while leaving `prepare` unchanged) is non-conforming on its face. Phase 24J does not reopen the hybrid refusal; a later ADR must explicitly reopen it. |

The rationale lives in
[`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md)
§"Rationale". The short form:

- No `@loa` registry mapping exists.
- No publishing workflow exists for `@loa/straylight`.
- GitHub Packages publishing would require registry auth,
  versioning, workflow, visibility, and package-management
  decisions — each substantial, each warranting its own ADR.
- Phase 24H already made tag-pinned source consumption viable
  by committing `dist-types/**` as the authoritative artifact.
- Posture 1a is the lowest-blast-radius path.

## Tag-readiness checklist (preparing Gate 2)

The full normative checklist lives in ADR-024I §"Tag-readiness
checklist for a future release / tag execution phase". This
handoff restates the operator-facing summary; the load-bearing
artifact is the ADR.

The future release / tag execution phase **must** run every
item below against the tagged tree (a clean checkout of the
commit that will receive the tag) and record exit status,
stdout, and stderr in the phase's handoff:

### 1. Pre-tag verification commands

- `npm run typecheck` — exit 0; no type errors.
- `npm run build` — exit 0; regenerates `dist-types/**` from
  source.
- `npm test` — exit 0; full vitest suite passes, including
  [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts)
  and
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts).
- `npm pack --dry-run --json` — exit 0; tarball preview
  satisfies the allow / deny invariants in §3 below.

### 2. Declaration entrypoint existence

After `npm run build` against the tagged tree, both
declaration entrypoints must exist on disk:

- [`../../dist-types/src/straylight/index.d.ts`](../../dist-types/src/straylight/index.d.ts)
- [`../../dist-types/src/straylight/host/index.d.ts`](../../dist-types/src/straylight/host/index.d.ts)

### 3. Committed `dist-types/**` matches source-generated output

`npm run clean:types && npm run build` from the tagged tree
must reproduce the committed `dist-types/**` byte-for-byte. Any
drift halts the release.

### 4. Package artifact contents (allow / deny)

**Allow-list — the tarball MUST contain ONLY:**

- `README.md`
- `package.json`
- `dist-types/**/*.d.ts` (and `*.d.ts.map` siblings if any)

**Deny-list — the tarball MUST NOT contain:**

- `src/**`, `tests/**`, `scripts/**`, `fixtures/**`, `docs/**`,
  `node_modules/**`.
- Local / system artifacts (`.run/**`, `.claude/**`, `.loa/**`,
  `.beads/**`, `.github/**`, `grimoires/**`).
- `package-lock.json`, `.npmrc`, `.gitignore`, any
  `tsconfig*.json`, `vitest.config.ts`.
- Any `.js`, `.ts` (non-declaration), or `.json` (non-package)
  file under `dist-types/`.

### 5. Forbidden-path diff (empty)

```bash
git diff -- src/ tests/ fixtures/ scripts/ \
  package.json package-lock.json \
  tsconfig.json tsconfig.build.json vitest.config.ts \
  .npmrc .gitignore \
  dist-types/ docs/mvp/package-boundary.md
```

must produce **empty** output for the tag candidate.

### 6. Tag immutability

- Tags **must not** be force-pushed.
- Retagging is **non-conforming**.
- If a tag is wrong, **cut a new tag** at a new version label;
  the wrong tag remains in history, annotated as superseded in
  the release phase's handoff.

### 7. Reproducibility check

```bash
git checkout <tag>
npm run clean:types
npm run build
git diff -- dist-types/
```

The final `git diff -- dist-types/` must be **empty**.

## Gate status table

After Phase 24J merges:

| Gate | Status | Resolving / pending artifact |
|---|---|---|
| **Gate 1 — Publish posture** | **SELECTED by Phase 24J** | ADR-024I selects Posture 1a; current `package.json` / `.npmrc` / `.github/workflows/` configuration on `main` already reflects Posture 1a unambiguously (no edit required) |
| **Gate 2 — Release / tag consumption point** | **PREPARED, not satisfied** | Tag-readiness checklist pinned by ADR-024I §"Tag-readiness checklist"; future release / tag execution phase must cut a reviewed, immutable Straylight tag against the checklist |
| **Gate 3 — Hounfour version-skew resolution** | **UNRESOLVED, still blocking** | A future Hounfour-skew decision phase must select Posture 3a (Dixie bumps), 3b (Straylight changes Hounfour posture under ADR-024C discipline), or 3c (duplicate-Hounfour isolation explicitly designed) per ADR-024H §4 |

A future Dixie dependency-flip PR remains **non-conforming**
until all three gates are independently satisfied at the time
the flip PR opens.

## Future Dixie flip implications

Phase 24J **alone does not authorize** any Dixie dependency
flip. A future Dixie-side flip PR is conforming **only if** all
three of the following are simultaneously true at the time the
flip PR opens (per ADR-024H §5 + ADR-024I §"Dixie flip rule
after Phase 24J"):

1. **Gate 1 satisfied by ADR-024I.** The flip PR cites
   ADR-024I and confirms that the Straylight package
   configuration on `main` continues to reflect Posture 1a
   unambiguously (`"private": true`; no `publish` script; no
   `@loa:registry=` mapping; no GitHub Packages publish
   workflow).
2. **Gate 2 satisfied by a future release / tag execution
   phase.** The flip PR cites the exact Straylight tag and the
   release / tag execution phase's ADR / handoff. The tag must
   have passed the tag-readiness checklist above.
3. **Gate 3 satisfied by a future Hounfour-skew decision
   phase.** The flip PR cites Posture 3a's Dixie-side bump PR,
   Posture 3b's Straylight-side Hounfour ADR, or Posture 3c's
   isolation design doc.

Hounfour skew is **independently load-bearing**. A Dixie flip
PR that lands after Phase 24J + a future release / tag
execution phase but before Gate 3 is satisfied is
**non-conforming on its face**. Reviewers (Dixie-side or
Straylight-side observers) may cite ADR-024H §5 + ADR-024I to
refuse it.

The Dixie-side flip PR is reviewed under Dixie-side review
process; Straylight-side does not pre-approve the flip itself,
only the gate-satisfying events on the Straylight side.

A conforming Dixie flip PR **must**:

- Cite ADR-024H + ADR-024I + the Gate-2 release / tag event
  + the Gate-3 resolving artifact.
- Remain **type-only**: replace Dixie's local type mirrors
  with `import type { ... } from '@loa/straylight/host'` (and /
  or `import type { ... } from '@loa/straylight'`).
- Honor the Phase 24H supported-consumer envelope (TypeScript
  >= 5.4; `moduleResolution: "Bundler"` or `"NodeNext"`;
  `import type` only).

A conforming Dixie flip PR **must not**:

- Add value imports, runtime imports, dynamic `import()`
  calls, or `require()` calls against `@loa/straylight*`.
- Bundle endpoint changes, runtime route changes, new
  rendering surfaces, vector 9 / 10 / 11 widening, Hounfour
  `#116` adoption, `0xhoneyjar:straylight:*` adoption,
  `recall-wedge` adoption, public commitment-root behavior, or
  any runtime Straylight import into Dixie.

Until all three gates are present, **a Dixie dependency flip
is non-conforming**.

## Explicit non-scope

Phase 24J mirrors ADR-024I §"Explicit non-scope" wholesale.
The short form:

1. **No tag.** No `git tag`. No GitHub Release.
2. **No publish.** No `npm publish`. No GitHub Packages
   publish. `"private": true` preserved.
3. **No `package.json` edit.** Current configuration already
   reflects Posture 1a.
4. **No `package-lock.json` edit.** No dependency change.
5. **No `.npmrc` edit.** No `@loa` registry mapping added.
6. **No `.github/workflows/` edit.** No publish workflow
   added.
7. **No `tsconfig.json` / `tsconfig.build.json` edit.**
8. **No `vitest.config.ts` / `.gitignore` edit.**
9. **No source edit** (`src/**` byte-identical).
10. **No test edit** (`tests/**` byte-identical).
11. **No `dist-types/` edit.**
12. **No script edit** (`scripts/**` byte-identical).
13. **No fixture edit** (`fixtures/**` byte-identical).
14. **No
    [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    edit.**
15. **No Hounfour bump / change.** `^8.6.0` preserved verbatim.
16. **No sibling repo edit** (`loa-dixie`, `loa-finn`,
    `loa-freeside`, `loa-hounfour`).
17. **No Dixie dependency flip.**
18. **No Flatline / Bridgebuilder / red-team request.**
19. **No prior-ADR edit.** ADR-024A through ADR-024H preserved
    verbatim.
20. **No prior-handoff edit.** Only the new Phase 24J handoff
    and the README index entry are new artifacts.
21. **No ADR-022E gate advance.** No Phase 19A pending
    feedback advance. No commitment-root publication. No
    endpoint.
22. **No `npm install` / `npm update` / `npm ci` / `npm
    publish` / `npm version` / package-manager mutation
    command.** `npm pack --dry-run` is allowed in validation
    (read-only).
23. **No GitHub issue / comment / PR action.**
24. **No touch of
    [`../../.loa`](../../.loa),
    [`../../.loa.config.yaml`](../../.loa.config.yaml),
    [`../../.claude/`](../../.claude/),
    [`../../.beads/`](../../.beads/),
    [`../../.run/`](../../.run/),
    [`../../.github/`](../../.github/),
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
    `node_modules/`.**

## Validation

Phase 24J is **docs-only**. The package surface, source,
declarations, tests, and configuration are byte-identical to
the post-PR-#35 (Phase 24I) state. Validation is limited to
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

- `npm run typecheck` — clean. (No source edit;
  `tsconfig.json` unchanged.)
- `npm test` — passes. (No test added; no test edited; the
  two Phase 24H tests
  [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts)
  and
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
  continue to pass against the unchanged package state.)
- `npm run build` — clean. Emits
  `dist-types/src/straylight/index.d.ts` and
  `dist-types/src/straylight/host/index.d.ts`. The rebuilt
  artifact is byte-identical to the committed
  `dist-types/**`.
- `ls dist-types/src/straylight/index.d.ts
  dist-types/src/straylight/host/index.d.ts` — both files
  exist.
- `npm pack --dry-run` — tarball preview is identical in shape
  to the Phase 24H baseline (only `dist-types/**`,
  `README.md`, and `package.json` ship; no `tsconfig*.json`,
  no `vitest.config.ts`, no `.npmrc`, no `.gitignore`, no
  `package-lock.json`, no `src/`, no `tests/`, no `scripts/`,
  no `fixtures/`, no `docs/`).
- Forbidden-path diff is **empty**: `git diff -- src/ tests/
  fixtures/ scripts/ package.json package-lock.json
  tsconfig.json tsconfig.build.json vitest.config.ts .npmrc
  .gitignore dist-types/ docs/mvp/package-boundary.md`
  produces no output.
- `git diff --stat` — shows only the three Phase 24J docs
  (this handoff, the companion ADR-024I, and the README index
  append).
- `git status --short` — shows only the three Phase 24J docs
  plus any pre-existing local dirt (the
  [`../../.loa`](../../.loa) /
  [`../../.loa.config.yaml`](../../.loa.config.yaml)
  modified state, and the untracked `.claude/...` /
  `grimoires/loa/a2a/` paths visible in the pre-task
  `git status` snapshot are pre-existing and not introduced by
  Phase 24J).

**No new tests.** Phase 24J does not author or modify any
test.

**No package mutation.** Phase 24J does not run `npm install`,
`npm update`, `npm ci`, `npm publish`, `npm version`, or any
package-manager mutation command. No tag is created. No
release is cut.

## Open questions / follow-ups

1. **Tag-naming / version label remains deferred.** The future
   release / tag execution phase decides the exact version
   label (`v0.0.1`, `v0.1.0`, `v1.0.0`, or another choice).
   Phase 24J does **not** pre-authorize a label. Reasoning
   about the label is the release / tag execution phase's
   opening ADR's responsibility under Posture 1a's "version
   semantics" tradeoff axis from ADR-024H §2.
2. **Future release / tag execution phase remains deferred.**
   The phase opens with its own opening ADR that cites
   ADR-024I §"Tag-readiness checklist" by name, reasons about
   the verification approach for "committed `dist-types/**`
   matches source-generated output", and demonstrates that
   every item in the tag-readiness checklist passes against
   the tagged tree. Entry conditions are pinned by ADR-024I
   §"Future release / tag execution phase entry conditions".
3. **Future Hounfour-skew decision phase remains deferred.**
   The phase opens with an opening doc (Straylight-side ADR
   for Posture 3b; Dixie-side opening doc for Posture 3a;
   joint design doc for Posture 3c) that explicitly selects
   one of the three postures per ADR-024H §4. Entry
   conditions are pinned by ADR-024I §"Future Hounfour-skew
   decision phase entry conditions". Gate 3 is independent
   of Gate 1; the phase may resolve before or after the
   future release / tag execution phase.
4. **Future Dixie dependency-flip PR remains deferred.** The
   Dixie-side PR opens only after all three gates are
   satisfied. Entry conditions are pinned by ADR-024I
   §"Future Dixie dependency-flip phase entry conditions".
5. **Optional future GitHub Packages posture (Posture 1b)
   remains available only under a new ADR.** Phase 24J
   refuses Posture 1b for now but does **not** refuse it
   permanently. A future ADR may reopen the refusal under
   its own teammate review, reasoning through the five
   tradeoff axes from ADR-024H §2.
6. **Runtime widening (separate from Gate 1 / 2 / 3) remains
   deferred.** Per ADR-024G "Decision" rule §2, runtime /
   value imports against `@loa/straylight*` are unsupported
   by design in Phase 24H and remain unsupported through any
   combination of Gate 1 / Gate 2 / Gate 3 resolution. A
   future runtime-widening ADR is required before any
   consumer may add value / runtime imports. Phase 24J does
   not authorize runtime widening.
7. **Hounfour `#70` pending feedback gate.** Phase 19A
   feedback on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
   remains pending and is **not** advanced by Phase 24J.

## Cross-references

- Companion ADR:
  [`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md).
- Direct predecessor (gate plan):
  [`./phase-24i-release-and-dixie-flip-gate-plan.md`](./phase-24i-release-and-dixie-flip-gate-plan.md).
- Gate-plan decision-lock:
  [`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md).
- Implementation predecessor:
  [`./phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md).
- Implementation decision-lock:
  [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md).
- Readiness-plan predecessor:
  [`./phase-24g-host-package-consumption-readiness-plan.md`](./phase-24g-host-package-consumption-readiness-plan.md).
- Readiness-plan decision-lock:
  [`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md).
- Package-release ambiguity discipline (Gate 3 refusal rules
  inherit):
  [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md).
- Phase 5 stable-surface freeze (read-only; not edited by
  Phase 24J):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Phase 24H package-shape invariants (mirrored by the
  tag-readiness checklist §4):
  [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts).
- Phase 24H supported-consumer envelope (inherited by the
  future release / tag execution phase):
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts).
- Host barrel (unchanged):
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
- Wedge public surface (unchanged):
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
- Committed declaration emit (unchanged):
  [`../../dist-types/`](../../dist-types/).
