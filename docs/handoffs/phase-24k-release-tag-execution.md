# Phase 24K — Release / tag execution plan (docs-only opening)

> Status: Phase 24K-opening **docs-only release / tag execution
> plan handoff**. Companion ADR:
> [`../decisions/ADR-024J-release-tag-execution.md`](../decisions/ADR-024J-release-tag-execution.md).
>
> Phase 24K-opening selects the exact tag label (`v0.0.1`,
> annotated) and the verification approach (in-tree clean-
> rebuild + `git diff -- dist-types/`) that a future operator
> action will use to satisfy ADR-024H §3 / ADR-024I §"Tag-
> readiness checklist" (Gate 2). Phase 24K-opening **does not
> create the tag**, **does not push the tag**, **does not
> satisfy Gate 2**, **does not satisfy Gate 3**, and **does not
> authorize a Dixie dependency flip**.
>
> Phase 24K-opening cuts no tag, pushes no tag, publishes no
> package, creates no GitHub Release, runs no
> `npm install` / `npm update` / `npm ci` / `npm publish` /
> `npm version` / `git tag` / `git push --tags` / `gh release
> create` command, edits no
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
> No Flatline pass is required because Phase 24K-opening makes
> no package-surface or source change. The tag itself, when
> later cut by a separate operator action, will cite a commit
> whose package surface is byte-identical to the post-Phase-24J
> `main` — i.e., still no package-surface change. The tag-
> readiness checklist is verification of the existing tree, not
> a surface widening.
>
> The Phase 19A pending feedback gate on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> remains pending and is **not** advanced by Phase 24K-opening.

## Executive summary

Phase 24K-opening prepares the no-file operator action that will
later cut and push an immutable annotated `v0.0.1` git tag to
satisfy ADR-024H §3 / ADR-024I §"Tag-readiness checklist"
(Gate 2). Phase 24K-opening:

- **Selects** the tag label `v0.0.1` (lowercase `v` prefix; no
  pre-release / build-metadata suffix; matches `package.json`
  `version` byte-for-byte).
- **Selects** the annotated-tag posture (`git tag -a`, not
  lightweight) so that tagger identity, timestamp, and message
  are first-class git-object metadata.
- **Selects** the tag target as the verified post-Phase-24K-
  opening `main` commit (whatever `main` HEAD is after this PR
  merges and after no subsequent merge has changed the package
  surface).
- **Selects** the verification approach for ADR-024I §"Tag-
  readiness checklist" §3 as **in-tree clean-rebuild +
  `git diff -- dist-types/`** (not the scratch-directory
  byte-compare fallback).
- **Refuses** a GitHub Release under Posture 1a.
- **Refuses** any `npm publish` / GitHub Packages publish.
- **Refuses** any package metadata edit (no `version` change,
  no `package.json` / `.npmrc` / `tsconfig*.json` /
  `vitest.config.ts` / `.gitignore` / `src/` / `tests/` /
  `dist-types/` edit during the operator action).
- **Defines** the pre-tag validation checklist verbatim.
- **Defines** the tag command verbatim, clearly marked as
  "operator action after this PR merges" — **not** to be run
  inside this PR.
- **Defines** the post-tag verification commands verbatim.

Phase 24K-opening **does not execute the tag**. Gate 2 remains
**prepared, not satisfied**. The actual tag creation + push is a
later operator action whose own handoff must record the
checklist outputs against the verifying commit.

The full constraint set, refusal rules, and rationale live in
the companion ADR
([`../decisions/ADR-024J-release-tag-execution.md`](../decisions/ADR-024J-release-tag-execution.md)).
This handoff is the operator-facing summary.

### Phase 24H / 24I / 24J recap (what Phase 24K-opening does not redo)

Phase 24H made the type-only package surface real: a type-only
`exports` map with `"."` and `"./host"`, committed `dist-types/`,
no `main` field, no runtime conditions, `"private": true`
preserved, Hounfour at `^8.6.0`, no tag, no publish.

Phase 24I enumerated three conjunctive gates (publish posture,
release / tag consumption point, Hounfour version-skew
resolution) between the post-Phase-24H surface and a future
Dixie dependency flip. Phase 24I selected none of the three.

Phase 24J selected Gate 1 as **Posture 1a** (private + tag-
pinned git source consumption) and prepared Gate 2 by pinning
the seven-section tag-readiness checklist (ADR-024I §"Tag-
readiness checklist"). Phase 24J cut no tag.

Phase 24K-opening selects Gate 2's execution parameters
(version label, tag type, target commit, verification approach,
publish / Release refusals). The actual tag creation + push is a
later operator action.

## Current state

| Fact | Value |
|---|---|
| Branch (this PR) | `phase-24k-release-tag-execution-plan` (docs-only) |
| `main` HEAD (verifying baseline) | post-PR #36 (Phase 24J merged) |
| Local `git tag --list` | **empty** |
| Remote `git ls-remote --tags origin` | **empty** |
| GitHub Releases | **0** |
| Package `name` / `version` / `private` | `@loa/straylight` / `0.0.1` / `true` |
| `package.json` `publish` / `prepublishOnly` / `prepack` / `postpublish` script | **absent** |
| `.npmrc` `@loa:registry` mapping | **absent** |
| `.github/workflows/` publish workflow for `@loa/straylight` | **absent** |
| `dist-types/src/straylight/index.d.ts` | present (committed) |
| `dist-types/src/straylight/host/index.d.ts` | present (committed) |
| Forbidden-path `git diff` (ADR-024I §5 file list) | **empty** against `main` |
| Hounfour pin | `@0xhoneyjar/loa-hounfour@^8.6.0` (unchanged since Phase 24H) |
| Posture 1a configuration | satisfied unambiguously by current `main` |
| Posture 1b adoption | refused (per ADR-024I §"Decision" §2) |
| Hybrid posture | refused (per ADR-024I §"Decision" §3) |

## Tag plan

| Parameter | Selected value | Source |
|---|---|---|
| Tag name | `v0.0.1` (exactly; lowercase `v`; no suffix) | ADR-024J §"Decision" §1 |
| Tag type | **Annotated** (`git tag -a`) — not lightweight | ADR-024J §"Decision" §2 |
| Tag target | Verified post-Phase-24K-opening `main` commit | ADR-024J §"Decision" §3 |
| Verification approach for ADR-024I §"Tag-readiness checklist" §3 | **In-tree clean-rebuild + `git diff -- dist-types/`** | ADR-024J §"Decision" §4 |
| GitHub Release | **None** (refused under Posture 1a) | ADR-024J §"Decision" §5 |
| `npm publish` / GitHub Packages publish | **None** (`"private": true` preserved) | ADR-024J §"Decision" §6 |
| `package.json` `version` edit | **None** | ADR-024J §"Decision" §7 |
| Any other package metadata edit | **None** | ADR-024J §"Decision" §8 |
| Retag / force-push of `v0.0.1` | **Forbidden**; cut a new tag at a new label if `v0.0.1` is wrong | ADR-024J §"Decision" §9; inherits ADR-024I §6 |

Version-label rationale: see ADR-024J §"Version-label rationale".
`v0.0.1` is the lowest-blast-radius label, matches `package.json`
byte-for-byte, requires no `package.json` edit, requires no
`package-lock.json` churn, makes no overclaim of stability
(`v1.0.0` would), and makes no undocumented minor bump
(`v0.1.0` would).

## Pre-tag checklist

> **Operator action after this PR merges. Do NOT run inside
> this PR.**

The operator runs every command below in sequence against a
clean checkout of the verifying `main` HEAD (i.e., `main` HEAD
after this Phase 24K-opening PR merges and after no subsequent
merge has changed the package surface). The operator records
exit status, stdout, and stderr for each command in the
operator action's own handoff before cutting the tag.

```bash
# Sync to the verifying tip of main.
git fetch origin --tags
git switch main
git pull --ff-only

# §5 forbidden-path diff — must be empty BEFORE building.
git diff -- src/ tests/ fixtures/ scripts/ \
  package.json package-lock.json \
  tsconfig.json tsconfig.build.json vitest.config.ts \
  .npmrc .gitignore \
  dist-types/ docs/mvp/package-boundary.md

# §1 pre-tag verification commands.
npm run typecheck
npm run build
npm test
npm pack --dry-run --json > /tmp/phase-24k-pack.json

# §2 declaration entrypoints exist on disk.
ls dist-types/src/straylight/index.d.ts \
   dist-types/src/straylight/host/index.d.ts

# §3 + §7 reproducibility — committed dist-types/** matches
# source-generated output (Phase 24K-selected approach:
# in-tree clean-rebuild + `git diff -- dist-types/`).
npm run clean:types
npm run build
git diff -- dist-types/
```

### Acceptance

Every one of the following **must** be true before the tag is
cut:

- Every numbered command above exited 0 (success).
- The forbidden-path `git diff` produced **empty** output.
- Both `dist-types/src/straylight/index.d.ts` and
  `dist-types/src/straylight/host/index.d.ts` exist on disk
  after `npm run build`.
- The final `git diff -- dist-types/` (after `clean:types` +
  `build`) produced **empty** output.
- `/tmp/phase-24k-pack.json` (the parsed
  `npm pack --dry-run --json` output) contains a `files` array
  whose entries are **only**:
  - `README.md`
  - `package.json`
  - `dist-types/**/*.d.ts` (and any `*.d.ts.map` siblings if
    declaration-map output is ever produced)
- The `files` array contains **no** path under `src/`,
  `tests/`, `scripts/`, `fixtures/`, `docs/`, `node_modules/`,
  `.run/`, `.claude/`, `.loa/`, `.beads/`, `.github/`,
  `grimoires/`, and **no** `package-lock.json`, `.npmrc`,
  `.gitignore`, `tsconfig*.json`, or `vitest.config.ts`.

If any acceptance criterion fails, the operator action **must
not** cut the tag. The resolving action is to investigate on a
separate branch under separate teammate review, land a fix on
`main` if a code-side fix is required, and re-run the entire
pre-tag checklist against the new `main` HEAD.

## Tag command

> **Operator action after this PR merges. Do NOT run inside
> this PR.**

The operator runs the command below **only after** every
acceptance criterion in §"Pre-tag checklist" §"Acceptance" is
met and recorded in the operator action's handoff:

```bash
git tag -a v0.0.1 \
  -m "Phase 24K — Straylight v0.0.1

First reviewed, immutable Straylight tag.
Posture 1a: private + tag-pinned git source consumption per ADR-024I.
Type-only package surface; no runtime exports.

Does NOT authorize a Dixie dependency flip.
Gate 3, Hounfour version-skew resolution, remains unresolved per ADR-024H."

git push origin v0.0.1
```

The two commands above are **one operator action**: cut the tag
locally, then push it to `origin`. Cutting without pushing
leaves Gate 2 unsatisfied (sibling repos cannot resolve a
local-only tag); pushing without cutting is impossible. The
operator action **must** complete both steps for Gate 2 to flip
from "prepared" to "satisfied".

The tag **must** be cut from the same clean checkout that ran
the pre-tag validation checklist. The operator **must not**
re-run any package-mutation command between the checklist and
the tag command; if a re-run is needed, the entire checklist
must be re-run first.

## Post-tag verification

> **Operator action after `git push origin v0.0.1` succeeds.
> Do NOT run inside this PR.**

```bash
# Tag exists locally and points at the verified commit.
git tag --list v0.0.1
git rev-parse v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
git show v0.0.1 --stat --no-patch
git ls-remote --tags origin v0.0.1
```

Acceptance:

- `git tag --list v0.0.1` prints `v0.0.1` (exactly one line).
- `git rev-parse v0.0.1` prints the annotated tag's object SHA.
- `git rev-parse v0.0.1^{commit}` prints the commit SHA the tag
  points at, which **must** equal the commit the pre-tag
  checklist ran against.
- `git cat-file -t v0.0.1` prints `tag` (confirms annotated,
  not lightweight).
- `git show v0.0.1 --stat --no-patch` shows tagger identity,
  date, and the tag message (no patch body).
- `git ls-remote --tags origin v0.0.1` prints the remote ref
  with a SHA matching `git rev-parse v0.0.1`.

The operator action **must** record each of these outputs in
its handoff before declaring Gate 2 satisfied.

If any post-tag verification fails (e.g., the remote tag does
not appear after push, or `cat-file -t` returns `commit`
instead of `tag`), Gate 2 is **not** satisfied. The resolving
action is to investigate, fix on `main` if a code-side fix is
required, and cut a new tag at a new version label per
ADR-024J §"Decision" §9.

## Gate status

After Phase 24K-opening merges (this PR):

| Gate | Status |
|---|---|
| Gate 1 — Publish posture | **Satisfied** (by Phase 24J / ADR-024I §"Decision" §1) |
| Gate 2 — Release / tag consumption point | **Prepared, not satisfied** (ADR-024J pins execution parameters; tag not yet cut) |
| Gate 3 — Hounfour version-skew resolution | **Unresolved, still blocking** (no Posture 3a / 3b / 3c selected) |

After the future operator action successfully cuts and pushes
`v0.0.1`:

| Gate | Status |
|---|---|
| Gate 1 — Publish posture | **Satisfied** (unchanged) |
| Gate 2 — Release / tag consumption point | **Satisfied** (by `v0.0.1`) |
| Gate 3 — Hounfour version-skew resolution | **Unresolved, still blocking** (unchanged) |

A Dixie dependency-flip PR remains **non-conforming** until
**all three** gates are independently satisfied. Cutting
`v0.0.1` satisfies Gate 2 only; it does **not** satisfy Gate 3.

## Dixie warning

`v0.0.1` alone does **not** authorize a Dixie dependency flip.
A future Dixie-side flip PR is conforming **only if** all three
of the following are simultaneously true at the time the flip
PR opens (per ADR-024H §5 + ADR-024I §"Dixie flip rule after
Phase 24J" + ADR-024J §"Consequences"):

1. **Gate 1 satisfied by ADR-024I.** The flip PR cites
   ADR-024I and confirms that the Straylight package
   configuration on `main` continues to reflect Posture 1a
   unambiguously (`"private": true`; no `publish` script; no
   `@loa:registry=` mapping; no GitHub Packages publish
   workflow).
2. **Gate 2 satisfied by the future operator action.** The
   flip PR cites the exact `v0.0.1` tag (cut + pushed by the
   later operator action that ran the pre-tag checklist
   against the verifying commit and recorded the results).
3. **Gate 3 satisfied by a future Hounfour-skew decision
   phase.** The flip PR cites Posture 3a's Dixie-side bump PR,
   Posture 3b's Straylight-side Hounfour ADR, or Posture 3c's
   isolation design doc.

Hounfour skew is **independently load-bearing**. A Dixie flip
PR that lands after `v0.0.1` is cut but before Gate 3 is
satisfied is **non-conforming on its face**. Reviewers (Dixie-
side or Straylight-side observers) may cite ADR-024H §5 +
ADR-024I + ADR-024J to refuse it.

The Dixie-side flip PR is reviewed under Dixie-side review
process; Straylight-side does not pre-approve the flip itself,
only the gate-satisfying events on the Straylight side.

A conforming Dixie flip PR **must**:

- Cite ADR-024H + ADR-024I + ADR-024J + the cut `v0.0.1` tag +
  the Gate-3 resolving artifact.
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

Phase 24K-opening mirrors ADR-024J §"Explicit non-scope"
wholesale. The short form:

1. **No file changes outside the three approved docs.** Only
   this handoff, the companion ADR-024J, and the README index
   append are new.
2. **No `package.json` edit.** No `version` field change. No
   script edit.
3. **No `package-lock.json` edit.**
4. **No `.npmrc` edit.**
5. **No `.gitignore` edit.**
6. **No `tsconfig.json` / `tsconfig.build.json` edit.**
7. **No `vitest.config.ts` edit.**
8. **No source edit** (`src/**` byte-identical).
9. **No test edit** (`tests/**` byte-identical; no new test
   file).
10. **No `dist-types/` edit.**
11. **No script edit** (`scripts/**` byte-identical).
12. **No fixture edit** (`fixtures/**` byte-identical).
13. **No
    [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    edit.**
14. **No tag creation in this PR.** No `git tag`.
15. **No tag push in this PR.** No `git push --tags`.
16. **No GitHub Release.** No `gh release create`.
17. **No publish.** No `npm publish`. No GitHub Packages
    publish. `"private": true` preserved.
18. **No Hounfour bump / change.** `^8.6.0` preserved verbatim.
19. **No sibling repo edit** (`loa-dixie`, `loa-finn`,
    `loa-freeside`, `loa-hounfour`).
20. **No Dixie dependency flip.**
21. **No Flatline / Bridgebuilder / red-team request.**
22. **No prior-ADR edit.** ADR-024A through ADR-024I preserved
    verbatim.
23. **No prior-handoff edit.** Only the new Phase 24K-opening
    handoff and the README index entry are new artifacts.
24. **No ADR-022E gate advance.** No Phase 19A pending
    feedback advance. No commitment-root publication. No
    endpoint.
25. **No `npm install` / `npm update` / `npm ci` /
    `npm publish` / `npm version` / package-manager mutation
    command.** `npm pack --dry-run` is allowed in validation
    (read-only).
26. **No GitHub issue / comment / PR action.**
27. **No touch of
    [`../../.loa`](../../.loa),
    [`../../.loa.config.yaml`](../../.loa.config.yaml),
    [`../../.claude/`](../../.claude/),
    [`../../.beads/`](../../.beads/),
    [`../../.run/`](../../.run/),
    [`../../.github/`](../../.github/),
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
    `node_modules/`.**

## Validation

Phase 24K-opening is **docs-only**. The package surface,
source, declarations, tests, and configuration are byte-
identical to the post-PR-#36 (Phase 24J) state. Validation is
limited to asserting that:

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
- `npm test` — passes identically to the Phase 24J post-merge
  baseline. (No test added; no test edited; the two Phase 24H
  tests
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
  to the Phase 24H / 24I / 24J baselines (only `dist-types/**`,
  `README.md`, and `package.json` ship; no `tsconfig*.json`,
  no `vitest.config.ts`, no `.npmrc`, no `.gitignore`, no
  `package-lock.json`, no `src/`, no `tests/`, no `scripts/`,
  no `fixtures/`, no `docs/`).
- Forbidden-path diff is **empty**: `git diff -- src/ tests/
  fixtures/ scripts/ package.json package-lock.json
  tsconfig.json tsconfig.build.json vitest.config.ts .npmrc
  .gitignore dist-types/ docs/mvp/package-boundary.md`
  produces no output.
- `git diff --stat` — shows only the three Phase 24K-opening
  docs (this handoff, the companion ADR-024J, and the README
  index append).
- `git status --short` — shows only the three Phase 24K-opening
  docs plus any pre-existing local dirt (the
  [`../../.loa`](../../.loa) /
  [`../../.loa.config.yaml`](../../.loa.config.yaml) modified
  state, and the untracked `.claude/...` / `grimoires/loa/a2a/`
  paths visible in the pre-task `git status` snapshot are
  pre-existing and not introduced by Phase 24K-opening).

**No new tests.** Phase 24K-opening does not author or modify
any test.

**No package mutation.** Phase 24K-opening does not run
`npm install`, `npm update`, `npm ci`, `npm publish`,
`npm version`, `git tag`, `git push --tags`, `gh release
create`, or any other package-manager / git-mutation command.
No tag is created. No tag is pushed. No release is cut. No
GitHub Release is created.

## Open follow-ups

1. **Run the pre-tag validation checklist.** A future operator
   action runs every command in §"Pre-tag checklist" against
   the verifying `main` HEAD and records the results in its
   own handoff. Entry conditions for that operator action are
   pinned by ADR-024J §"Verification method".
2. **Create and push `v0.0.1`.** After the pre-tag checklist's
   acceptance criteria are all met and recorded, the operator
   action runs the §"Tag command" sequence (`git tag -a v0.0.1
   ... && git push origin v0.0.1`).
3. **Run the post-tag verification commands.** The operator
   action runs every command in §"Post-tag verification" and
   records each output in its own handoff. Only after all
   post-tag acceptance criteria are met may the operator
   action declare Gate 2 satisfied.
4. **Verify the remote tag.** `git ls-remote --tags origin
   v0.0.1` must list the tag with a SHA matching `git
   rev-parse v0.0.1`. Until the remote tag is reachable by
   sibling repos, Gate 2 is **not** satisfied.
5. **Separately resolve Gate 3.** A future Hounfour-skew
   decision phase selects Posture 3a (Dixie bumps to compatible
   Hounfour line), Posture 3b (Straylight changes Hounfour
   posture under ADR-024C-style discipline), or Posture 3c
   (duplicate-Hounfour isolation explicitly designed) per
   ADR-024H §4. Gate 3 is **independent** of Gate 2; it may
   resolve before or after `v0.0.1` is cut. ADR-024J does not
   constrain Gate 3.
6. **Only after Gate 3, consider a Dixie dependency flip.**
   The Dixie-side flip PR opens only after all three of
   ADR-024H's gates are independently satisfied. It cites
   ADR-024H + ADR-024I + ADR-024J + the cut `v0.0.1` tag + the
   Gate-3 resolving artifact. It is reviewed Dixie-side;
   Straylight-side does not pre-approve.
7. **Tag-naming for future bumps.** If a future package-surface
   change warrants a bump, the next tag is `v0.0.2` (patch
   bump under tag-immutability discipline) or a higher label
   under its own ADR. ADR-024J does not pre-authorize future
   labels.
8. **Optional future GitHub Packages posture (Posture 1b)
   remains available only under a new ADR.** ADR-024J refuses
   Posture 1b for the duration of Phase 24K but does not refuse
   it permanently. A future ADR may reopen the refusal under
   its own teammate review.
9. **Runtime widening (separate from Gate 1 / 2 / 3) remains
   deferred.** Per ADR-024G §"Decision" §2, runtime / value
   imports against `@loa/straylight*` are unsupported by
   design in Phase 24H and remain unsupported through any
   combination of Gate 1 / Gate 2 / Gate 3 resolution. A
   future runtime-widening ADR is required before any consumer
   may add value / runtime imports. ADR-024J does not
   authorize runtime widening.
10. **Hounfour `#70` pending feedback gate.** Phase 19A
    feedback on
    [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
    remains pending and is **not** advanced by Phase 24K-
    opening.

## Cross-references

- Companion ADR:
  [`../decisions/ADR-024J-release-tag-execution.md`](../decisions/ADR-024J-release-tag-execution.md).
- Direct predecessor (release posture selection):
  [`./phase-24j-release-posture-selection.md`](./phase-24j-release-posture-selection.md).
- Release-posture decision-lock:
  [`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md).
- Gate-plan predecessor:
  [`./phase-24i-release-and-dixie-flip-gate-plan.md`](./phase-24i-release-and-dixie-flip-gate-plan.md).
- Gate-plan decision-lock:
  [`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md).
- Implementation predecessor:
  [`./phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md).
- Implementation decision-lock:
  [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md).
- Package-release ambiguity discipline (Gate 3 refusal rules
  inherit):
  [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md).
- Phase 5 stable-surface freeze (read-only; not edited by
  Phase 24K-opening):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Phase 24H package-shape invariants (mirrored by the
  pre-tag checklist):
  [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts).
- Phase 24H supported-consumer envelope (inherited by the
  future operator action):
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts).
- Host barrel (unchanged):
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
- Wedge public surface (unchanged):
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
- Committed declaration emit (unchanged):
  [`../../dist-types/`](../../dist-types/).
