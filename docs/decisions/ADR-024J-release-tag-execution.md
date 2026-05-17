# ADR-024J — Release / tag execution plan (Phase 24K-opening)

## Status

Accepted-for-Phase-24K-opening.

This ADR is the **Phase 24K-opening decision-lock**. It is a
**docs-only release / tag execution plan**. It selects the exact
version label (`v0.0.1`) and the verification approach that a
future operator action will run against the tagged tree to
satisfy ADR-024H §3 / ADR-024I §"Tag-readiness checklist"
(Gate 2). Phase 24K-opening **does not create the tag**, **does
not push the tag**, **does not satisfy Gate 2**, and **does not
authorize a Dixie dependency flip**. The tag is cut by a later
operator action after this docs-only PR merges.

Phase 24K-opening **selects Gate 2's execution parameters only**.
Phase 24K-opening does **not** satisfy Gate 2; the annotated tag
must actually be created and pushed in a later operator action
for Gate 2 to flip from "prepared" to "satisfied". Phase 24K-
opening does **not** satisfy Gate 3; the Hounfour version-skew
posture remains unresolved and continues to independently block
any Dixie dependency-flip PR per ADR-024H §5's conjunctive
gate-of-gates rule. Phase 24K-opening does **not** select any
Posture 3a / 3b / 3c.

Phase 24K-opening does **not** edit
[`../../package.json`](../../package.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../tsconfig.json`](../../tsconfig.json),
[`../../tsconfig.build.json`](../../tsconfig.build.json),
[`../../vitest.config.ts`](../../vitest.config.ts),
[`../../.npmrc`](../../.npmrc),
[`../../.gitignore`](../../.gitignore), any file under
[`../../src/`](../../src/), any file under
[`../../tests/`](../../tests/), any file under
[`../../scripts/`](../../scripts/), any file under
[`../../fixtures/`](../../fixtures/), any committed declaration
under [`../../dist-types/`](../../dist-types/), or the Phase 5
stable public surface
([`../mvp/package-boundary.md`](../mvp/package-boundary.md)).
Phase 24K-opening does **not** edit any prior ADR, any prior
handoff (other than the README index entry authored alongside
this ADR), or any sibling repo (`loa-dixie`, `loa-finn`,
`loa-freeside`, `loa-hounfour`). Phase 24K-opening does **not**
create a release tag, does **not** push a tag, does **not**
publish the package, does **not** create a GitHub Release, does
**not** bump the Hounfour dependency range, does **not** consume
Hounfour `main` or any unpublished commit, does **not** import
the Hounfour `#116` five-step conformance corpus, does **not**
adopt the `0xhoneyjar:straylight:*` audit-event prefix family
into the Straylight public surface, does **not** adopt the
`recall-wedge` Hounfour conformance category into the Straylight
test suite, does **not** advance any ADR-022E gate, does **not**
publish a public commitment root, does **not** file or edit any
GitHub issue / comment / PR, and does **not** touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`.

No Flatline / Bridgebuilder / red-team review is requested or
run by Phase 24K-opening, because Phase 24K-opening makes **no**
package-surface or source change. The tag itself, when later
cut, will cite a commit whose package surface is byte-identical
to the post-Phase-24J `main` — i.e., still no package-surface
change. The tag-readiness checklist is verification of the
existing tree, not a surface widening.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24K-opening.

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
  ([`./ADR-024E-dixie-host-mvp-wire-shape.md`](./ADR-024E-dixie-host-mvp-wire-shape.md)),
- ADR-024F
  ([`./ADR-024F-host-package-consumption-readiness.md`](./ADR-024F-host-package-consumption-readiness.md)),
- ADR-024G
  ([`./ADR-024G-host-package-subpath-implementation.md`](./ADR-024G-host-package-subpath-implementation.md)),
- ADR-024H
  ([`./ADR-024H-release-and-dixie-flip-gate-plan.md`](./ADR-024H-release-and-dixie-flip-gate-plan.md)),
- ADR-024I
  ([`./ADR-024I-release-posture-selection.md`](./ADR-024I-release-posture-selection.md)).

ADR-024J is **additive** to ADR-024I. ADR-024H enumerated the
three conjunctive gates. ADR-024I selected Gate 1 as Posture 1a
and prepared Gate 2 by pinning the seven-section tag-readiness
checklist. ADR-024J selects the execution parameters Gate 2's
later satisfaction will use (version label, tag type, target
commit, verification approach for the checklist's §3) so that a
later operator action that actually cuts the tag has an
unambiguous spec to run against. ADR-024J does **not** reopen
ADR-024I §"Decision" §1 (Posture 1a remains selected), does
**not** reopen ADR-024I §"Decision" §2 (Posture 1b remains
refused for now), and does **not** reopen ADR-024I §"Decision"
§3 (hybrid posture remains refused).

## Context

### Phase 24H / 24I / 24J recap

Phase 24H (ADR-024G + the Phase 24H handoff, merged via PR #34)
made the Straylight package surface **type-only consumable**: a
type-only `exports` map with two subpaths (`"."` and `"./host"`),
each with exactly one `"types"` condition; committed
`dist-types/` declaration emit reproducible from source via
`npm run clean:types && npm run build`; no `main` field; no
runtime export conditions; `"private": true` preserved; Hounfour
declared at `@0xhoneyjar/loa-hounfour@^8.6.0`, unchanged; no
tag; no publish.

Phase 24I (ADR-024H + the Phase 24I gate-plan handoff, merged
via PR #35) enumerated three conjunctive gates between the
post-Phase-24H type-consumable surface and a future Dixie
dependency flip: Gate 1 publish posture, Gate 2 release / tag
consumption point, Gate 3 Hounfour version-skew resolution.
Phase 24I selected none of the three.

Phase 24J (ADR-024I + the Phase 24J release-posture-selection
handoff, merged via PR #36) selected Gate 1 as **Posture 1a**
(private + tag-pinned git-source consumption) and **prepared
Gate 2** by pinning the seven-section tag-readiness checklist
(ADR-024I §"Tag-readiness checklist"). Phase 24J cut no tag,
published nothing, made no Hounfour change, and edited no
sibling repo.

### Current package state recap (post-Phase-24J baseline)

The package configuration on `main` after PR #36 merged is
**byte-identical** to the post-Phase-24H baseline. The current
state is:

| Fact | Value |
|---|---|
| Package name | `@loa/straylight` |
| Version | `0.0.1` |
| `private` | `true` |
| Module type | ESM (`"module"`) |
| Type-only exports | `"."` and `"./host"`, each with exactly one `"types"` condition |
| Runtime conditions under `exports` | **None** |
| `main` field | **Absent** |
| `types` field | `./dist-types/src/straylight/index.d.ts` |
| `files` | `["dist-types/", "README.md", "package.json"]` |
| `build` script | `npm run clean:types && tsc -p tsconfig.build.json` |
| `prepare` script | `npm run build` (development convenience) |
| `publish` / `prepublishOnly` / `prepack` / `postpublish` script | **Absent** |
| Hounfour dependency | `@0xhoneyjar/loa-hounfour@^8.6.0` |
| `@loa` registry mapping in [`../../.npmrc`](../../.npmrc) | **None** |
| Publish workflow for `@loa/straylight` in [`../../.github/workflows/`](../../.github/workflows/) | **None** |
| Local `git tag --list` | **Empty** |
| Remote `git ls-remote --tags origin` | **Empty** |
| GitHub Releases | **0** |
| Forbidden-path `git diff` (ADR-024I §5 file list) | **Empty** against `main` |

### Gate status going into Phase 24K-opening

| Gate | Status entering Phase 24K-opening |
|---|---|
| Gate 1 — Publish posture | **Satisfied** by Phase 24J (Posture 1a; ADR-024I §"Decision" §1) |
| Gate 2 — Release / tag consumption point | **Prepared, not satisfied** (ADR-024I §"Tag-readiness checklist" pinned by Phase 24J; no tag exists) |
| Gate 3 — Hounfour version-skew resolution | **Unresolved, still blocking** (no Posture 3a / 3b / 3c selected) |

Phase 24K-opening exists to pin the parameters Gate 2's later
execution will use. It does not flip Gate 2's status; the actual
tag creation + push is a later operator action.

## Decision

### 1. Select version label `v0.0.1`

The future operator action that satisfies Gate 2 **must** create
the annotated tag at version label `v0.0.1`.

- The label is **exactly** `v0.0.1` (lowercase `v` prefix; no
  `V`; no semver pre-release / build-metadata suffix; no
  `release/` prefix; no `straylight-` prefix; no other
  decoration).
- The `v` prefix matches the Posture 1a consumption template
  pinned by ADR-024I §"Decision" §1: `"@loa/straylight":
  "github:0xHoneyJar/loa-straylight#v<X.Y.Z>"`. Sibling repos
  resolving the tagged git source expect `v<X.Y.Z>`.
- The label is **byte-identical** to the current `package.json`
  `version` field (`0.0.1`). No `package.json` edit is required
  to create this tag; no `package-lock.json` churn results; no
  `npm version` invocation is run.

### 2. Annotated tag, not lightweight

The future operator action **must** create the tag as an
**annotated** tag (`git tag -a`), not a lightweight tag.

- Annotated tags are git objects with their own SHA, a tagger
  identity, a timestamp, and a tag message. They are the
  audit-trail substrate Posture 1a's "tag / release discipline"
  tradeoff axis depends on (ADR-024H §2).
- Lightweight tags are mutable refs with no provenance and no
  metadata; they do not carry tagger identity or message; they
  are not suitable for the immutable release-event semantics
  pinned by ADR-024I §6.
- An annotated tag is reachable through `git cat-file -t v0.0.1`
  → `tag` (not `commit`). Reviewers of the later operator
  action's verification record may rely on this distinction.

### 3. Tag target is the verified post-Phase-24K-opening `main` commit

The future operator action **must** cut the tag against the
specific `main` commit that the pre-tag verification checklist
(see §4 below) was run against. Concretely:

- The operator runs the pre-tag checklist against a clean
  checkout of `main` at the verifying commit; records the
  results in the Phase 24K handoff (see companion handoff
  [`../handoffs/phase-24k-release-tag-execution.md`](../handoffs/phase-24k-release-tag-execution.md));
  then runs `git tag -a v0.0.1` from that same commit.
- The verifying commit is whatever `main` HEAD is **after this
  Phase 24K-opening PR merges and after no subsequent merge has
  changed the package surface**. If a later non-Phase-24K-opening
  merge (e.g., a docs-only change to an unrelated handoff) lands
  on `main` before the operator action runs, the operator action
  **must** re-run the entire pre-tag verification checklist
  against the new `main` HEAD; the operator action **must not**
  cut the tag against a stale commit that has not been verified.
- The tag **must not** be cut against any branch other than
  `main`. The tag **must not** be cut against an unmerged
  Phase 24K branch.

### 4. Verification approach for ADR-024I §"Tag-readiness checklist" §3

ADR-024I §"Tag-readiness checklist" §3 named two acceptable
approaches for verifying that the committed `dist-types/**`
matches the source-generated output. Phase 24K **selects the
first approach**:

> **In-tree clean-rebuild + `git diff -- dist-types/`.** The
> operator action runs `npm run clean:types` followed by
> `npm run build` from a clean checkout of the tag candidate;
> the resulting `git diff -- dist-types/` **must** be empty.

The second approach (rebuild into a separate scratch directory
and byte-compare against `git show <tag>:dist-types/**`) is
**not selected** by Phase 24K for these reasons:

- The first approach is **simpler**: it uses only `git`, `npm`,
  and the project's existing `clean:types` + `build` scripts; no
  scratch-directory bookkeeping; no `git show` invocation; no
  separate byte-compare tool.
- The first approach **mirrors the Phase 24H validation flow**
  already used by the merged Phase 24H + 24I + 24J validation
  evidence (`npm run clean:types && npm run build && git diff
  -- dist-types/`). Operators familiar with prior phases will
  recognize the command sequence.
- The first approach makes drift **trivially diagnosable**: a
  non-empty `git diff -- dist-types/` after a clean rebuild
  reveals the exact byte differences in-tree, without requiring
  a scratch directory comparison.
- The second approach is **available as a fallback** if a later
  phase needs a stronger verification posture (e.g., to defend
  against an in-tree post-build mutation). A future ADR may
  reopen this choice if the fallback is needed.

A later operator action may **add** the second approach as an
additional check (running both is permitted); a later operator
action **must not** substitute the second approach for the first
without a successor ADR reopening this decision.

### 5. No GitHub Release under Posture 1a

The future operator action **must not** create a GitHub Release
when cutting `v0.0.1` under Phase 24K's execution.

- Posture 1a (ADR-024I §"Decision" §1) selects tag-pinned git
  source consumption: sibling repos resolve `"@loa/straylight":
  "github:0xHoneyJar/loa-straylight#v0.0.1"` against the git
  tag, not against a Release artifact.
- A GitHub Release adds discoverability + release-notes browsing
  but does not change consumption mechanics under Posture 1a.
  Creating a Release would introduce a second authoritative
  surface (Release vs tag) without changing what consumers do.
- ADR-024I §"Decision" §2 refuses Posture 1b for the duration
  covered by ADR-024I. A GitHub Release is part of the publish
  posture-1b discoverability surface; introducing it for
  `v0.0.1` would re-open the Posture 1b refusal without a
  successor ADR.
- A future ADR may explicitly reopen this refusal under its own
  teammate review (e.g., as part of a future Phase 24L that
  reopens Posture 1b).

### 6. No publish

The future operator action **must not** invoke `npm publish`,
`gh release create`, GitHub Packages publish, npm-registry
publish, alternate-registry publish, or any other publish-
mutation command when cutting `v0.0.1`.

- `"private": true` is preserved verbatim.
- `npm publish` against a `"private": true` package fails fast;
  invoking it would surface an error, not silently publish.
- The `@loa` scope is not mapped to any registry; no auth token
  for the `@loa` scope is configured; publishing would not have
  a registry to publish to.

### 7. No package version change

The future operator action **must not** edit the `version` field
of [`../../package.json`](../../package.json) to or from `0.0.1`
when cutting the tag.

- The tag label `v0.0.1` already matches the existing `version`
  field byte-for-byte; no edit is required.
- A `version` edit would produce a `package.json` diff inside
  the operator action, which **must** be reflected in the
  forbidden-path diff (ADR-024I §5) — and the forbidden-path
  diff **must** be empty per §4 of ADR-024I §"Tag-readiness
  checklist".
- `npm version` is therefore **not** invoked by the operator
  action.

### 8. No package metadata change

The future operator action **must not** edit
[`../../package.json`](../../package.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../.npmrc`](../../.npmrc),
[`../../.gitignore`](../../.gitignore),
[`../../tsconfig.json`](../../tsconfig.json),
[`../../tsconfig.build.json`](../../tsconfig.build.json),
[`../../vitest.config.ts`](../../vitest.config.ts), any file
under [`../../src/`](../../src/), any file under
[`../../tests/`](../../tests/), any file under
[`../../scripts/`](../../scripts/), any file under
[`../../fixtures/`](../../fixtures/), any committed declaration
under [`../../dist-types/`](../../dist-types/), or
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) when
cutting the tag.

- The forbidden-path diff (ADR-024I §"Tag-readiness checklist"
  §5) **must** be empty before the tag is cut.
- Any in-place edit to the listed paths would either (a) fail
  the forbidden-path diff (halting the release per ADR-024I §5),
  or (b) require a separate, reviewed PR landing on `main`
  before the operator action re-runs the checklist.

### 9. Tag immutability (re-pin from ADR-024I §6)

Phase 24K inherits ADR-024I §6 tag-immutability rules verbatim:

- Tags **must not** be force-pushed
  (`git push --force origin v0.0.1` and `git push
  --force-with-lease origin v0.0.1` are non-conforming).
- Retagging is **non-conforming**. Moving an existing
  `v0.0.1` tag from one commit to another (whether by
  delete-and-recreate, `--force`, or any other mechanism) is
  non-conforming.
- If `v0.0.1` is wrong after push — e.g., the tagged tree fails
  any item in the tag-readiness checklist that was missed during
  pre-tag verification, or the tag cites the wrong commit — the
  resolving action is **cut a new tag at a new version label**
  (e.g., `v0.0.2`). The wrong `v0.0.1` tag remains in history,
  annotated as superseded by `v0.0.2` in the resolving phase's
  handoff.
- A future Dixie dependency-flip PR (whenever it eventually
  opens) cites the **exact** tag selected by its reviewer; the
  citation is binding.

## Version-label rationale

ADR-024I §"Open questions / follow-ups" §1 left version-label
selection to the future release / tag execution phase. Phase 24K
considers three candidates and selects `v0.0.1`.

### Candidate `v0.0.1` (SELECTED)

- **Matches the `package.json` `version` field byte-for-byte.**
  No `package.json` edit is required; no `package-lock.json`
  churn results; no `npm version` invocation; no surface widening
  of any kind.
- **Lowest-blast-radius label.** The tag claims nothing about
  stability beyond what `package.json` already declares.
- **Honors Posture 1a's "version semantics" tradeoff axis**
  (ADR-024H §2). Tags are advisory under Posture 1a; pretending
  to a higher stability tier than the package itself claims
  would mislead sibling-repo reviewers.
- **Preserves room to bump on real change.** Future package-
  surface widening (runtime emission, new subpaths, new
  conditions) can cleanly bump to `v0.0.2` / `v0.1.0` /
  `v1.0.0` under their own ADRs, each with reasoning on file.

### Candidate `v0.1.0` (REJECTED for Phase 24K)

- **No `package.json` field has changed since `0.0.1` was first
  set.** A `v0.1.0` tag against the same package state would
  claim a minor semver bump that no review has authorized.
- **No reviewed minor-bump cadence exists.** Posture 1a's
  "version semantics" tradeoff axis specifically warns about
  the sharp edges of npm `semver` ranges against git sources;
  introducing a minor bump without a documented cadence would
  mislead the future Dixie-side reviewer about what `0.1.x`
  vs `0.0.x` means.
- A future ADR may explicitly bump to `v0.1.0` once a real
  surface widening warrants it. Phase 24K refuses the bump on
  the strength of a tag-cut alone.

### Candidate `v1.0.0` (REJECTED for Phase 24K)

- **Overclaims stability.** The package is still `"private":
  true`, has no runtime exports, has no `main` field, has
  exactly one supported consumer envelope (TypeScript >= 5.4
  with `moduleResolution: "Bundler"` or `"NodeNext"`,
  `import type` only, tag-pinned git source), and has three
  outstanding gates (Gate 1 selected, Gate 2 prepared,
  Gate 3 unresolved). A `1.0.0` tag would imply a stability
  contract the package does not yet meet.
- **Premature semver-major commitment.** A `v1.0.0` tag commits
  the project to semver-major discipline going forward; future
  breaking changes would require `v2.0.0` etc., and the cadence
  for those decisions has not been reviewed.
- A future ADR may explicitly bump to `v1.0.0` once the package
  reaches a reviewed stability tier (runtime widening landed,
  Posture 1b adopted, Gate 3 resolved, sibling-repo consumption
  flowing). Phase 24K refuses the bump on the strength of a
  tag-cut alone.

### Why not `v0.0.1-rc.1` / `v0.0.1-pre` / `v0.0.1+build.N`?

Pre-release and build-metadata suffixes are **not selected**
because Posture 1a's consumption template
(`"github:0xHoneyJar/loa-straylight#v<X.Y.Z>"`) does not use
them, sibling-repo reviewers would have to interpret what
`-rc.1` means in this project's release cadence (which is not
documented), and the tag would not unambiguously satisfy
ADR-024H §3's "reviewed Straylight release / tag event"
language. `v0.0.1` plain is the unambiguous choice.

## Verification method

The future operator action **must** run the following commands
in sequence against a clean checkout of the tag-candidate
commit (i.e., `main` HEAD after this Phase 24K-opening PR merges
and after no subsequent merge has changed the package surface).
The operator action **must** record exit status, stdout, and
stderr of each command in the Phase 24K handoff
([`../handoffs/phase-24k-release-tag-execution.md`](../handoffs/phase-24k-release-tag-execution.md))
before the tag is cut.

### Pre-tag validation checklist (run by the operator, not by this PR)

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
# source-generated output (Phase 24K selects the in-tree
# clean-rebuild + `git diff -- dist-types/` approach per
# §"Decision" §4 above).
npm run clean:types
npm run build
git diff -- dist-types/
```

### Acceptance

The operator action **must** verify, before cutting the tag,
that **every one** of the following is true:

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
- The Phase 24K handoff records the parsed `files` array
  verbatim alongside each command's exit status.

If any acceptance criterion fails, the operator action **must
not** cut the tag. The resolving action is to investigate the
failure on a separate branch under separate teammate review,
land a fix on `main`, and re-run the entire pre-tag checklist
against the new `main` HEAD.

## Tag command (to be run later by the operator, NOT in this PR)

The operator action **runs the command below only after** the
pre-tag validation checklist's acceptance criteria are all met
and recorded in the Phase 24K handoff. **This Phase 24K-opening
PR does NOT run this command.**

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

## Post-tag verification commands (to be run by the operator after `git push origin v0.0.1`)

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
- `git cat-file -t v0.0.1` prints `tag` (confirms annotated, not
  lightweight).
- `git show v0.0.1 --stat --no-patch` shows tagger identity,
  date, and the tag message (no patch body).
- `git ls-remote --tags origin v0.0.1` prints the remote ref
  with a SHA matching `git rev-parse v0.0.1`.

The operator action **must** record each of these outputs in
the Phase 24K handoff before declaring Gate 2 satisfied.

If any post-tag verification fails (e.g., the remote tag does
not appear after push, or `cat-file -t` returns `commit`
instead of `tag`), Gate 2 is **not** satisfied. The resolving
action is to investigate, fix on `main` if a code-side fix is
required, and cut a new tag at a new version label per
§"Decision" §9.

## Gate status

After Phase 24K-opening merges (this PR):

| Gate | Status |
|---|---|
| Gate 1 — Publish posture | **Satisfied** (by Phase 24J / ADR-024I §"Decision" §1) |
| Gate 2 — Release / tag consumption point | **Prepared, not satisfied** (this ADR pins execution parameters; tag not yet cut) |
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

## Explicit non-scope

Phase 24K-opening inherits every non-goal from ADR-024A through
ADR-024I wholesale, and adds these Phase 24K-opening-specific
refusals:

1. **No file changes outside the three approved docs.** The
   only files changed by Phase 24K-opening are this ADR, the
   companion handoff, and the README index append.
2. **No `package.json` edit.** No `version` field change. No
   script edit. No `private` change. No `exports` / `files` /
   `dependencies` / `devDependencies` / `engines` edit.
3. **No `package-lock.json` edit.** No dependency change.
4. **No `.npmrc` edit.** No `@loa:registry=` mapping added.
5. **No `.gitignore` edit.** `dist-types/` remains committed.
6. **No `tsconfig.json` / `tsconfig.build.json` edit.** Build
   configuration unchanged.
7. **No `vitest.config.ts` edit.**
8. **No source edit.** No file under
   [`../../src/`](../../src/) is touched.
9. **No test edit.** No file under
   [`../../tests/`](../../tests/) is touched. No new test file
   is created.
10. **No `dist-types/` edit.** No file under
    [`../../dist-types/`](../../dist-types/) is touched.
11. **No script edit.** No file under
    [`../../scripts/`](../../scripts/) is touched.
12. **No fixture edit.** No file under
    [`../../fixtures/`](../../fixtures/) is touched.
13. **No `package-boundary.md` edit.**
    [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    is read-only for Phase 24K-opening.
14. **No tag creation in this PR.** No `git tag`. No
    `git push origin <tag>`. No annotated tag, no lightweight
    tag, no signed tag.
15. **No tag push in this PR.**
16. **No GitHub Release.** No `gh release create`. No release
    notes published.
17. **No publish.** No `npm publish`. No GitHub Packages
    publish. No npm-registry publish. No alternate-registry
    publish. `"private": true` preserved verbatim.
18. **No Hounfour bump / change.**
    `@0xhoneyjar/loa-hounfour@^8.6.0` preserved verbatim. No
    Hounfour `main` consumption. No commit-SHA pin. No `#116`
    corpus import. No `0xhoneyjar:straylight:*` adoption. No
    `recall-wedge` adoption.
19. **No sibling-repo edit.** No edit to `loa-dixie`,
    `loa-finn`, `loa-freeside`, or `loa-hounfour`.
20. **No Dixie dependency flip.** Phase 24K-opening does not
    authorize, pre-authorize, or implement any Dixie-side
    dependency flip. The flip is a future Dixie-side PR under
    separate Dixie-side review, after **all three** ADR-024H
    gates are independently satisfied.
21. **No Flatline / Bridgebuilder / red-team request.** Phase
    24K-opening makes no package-surface or source change.
22. **No prior-ADR edit.** ADR-024I §"Decision" is preserved
    verbatim; ADR-024A through ADR-024I are byte-identical to
    their pre-Phase-24K-opening state.
23. **No prior-handoff edit.** Only the new Phase 24K handoff
    and the README index entry authored alongside this ADR are
    new artifacts; all prior handoffs are byte-identical.
24. **No ADR-022E gate advance.** No Phase 19A pending feedback
    advance on
    [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
    No commitment-root publication. No endpoint. No runtime
    Straylight import into any sibling repo.
25. **No `npm install` / `npm update` / `npm ci` / `npm publish`
    / `npm version` / `npm pack` (as a publish step) /
    package-manager mutation command.** `npm pack --dry-run` is
    allowed in validation (it is read-only).
26. **No GitHub issue / comment / PR action.** No filing, no
    editing, no commenting on any GitHub issue or PR.
27. **No touch of
    [`../../.loa`](../../.loa),
    [`../../.loa.config.yaml`](../../.loa.config.yaml),
    [`../../.claude/`](../../.claude/),
    [`../../.beads/`](../../.beads/),
    [`../../.run/`](../../.run/),
    [`../../.github/`](../../.github/),
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
    `node_modules/`.**

## Consequences

- **Gate 2 has an unambiguous execution spec.** A future
  operator action that claims to satisfy Gate 2 has a concrete
  set of parameters to run against (version label `v0.0.1`,
  annotated tag, tag target = verified post-Phase-24K-opening
  `main` commit, verification approach = in-tree clean-rebuild
  + `git diff -- dist-types/`, no Release, no publish, no
  package metadata change). Reviewers of that operator action's
  handoff may cite §"Decision" §§1–9 to refuse any deviation.
- **Gate 2 is not satisfied yet.** Until the operator action
  actually creates and pushes the annotated `v0.0.1` tag,
  Gate 2 remains "prepared". A Dixie dependency-flip PR that
  cites only ADR-024I + ADR-024J (without citing the existence
  of the pushed `v0.0.1` tag) is non-conforming.
- **The tag is reusable across all three Gate-3 outcomes.**
  Cutting `v0.0.1` does not pre-commit any Posture 3a / 3b / 3c
  choice. Whether Gate 3 eventually lands as 3a (Dixie bumps),
  3b (Straylight changes Hounfour posture), or 3c (duplicate-
  Hounfour isolation), the `v0.0.1` tag remains a valid Gate-2
  citation. A future Dixie flip PR cites all three gate-
  satisfying events; ADR-024J does not constrain Gate 3.
- **Tag immutability is pinned at decision time.** §"Decision"
  §9 forbids force-pushed tags, retagging, and tag-relocation
  for `v0.0.1` specifically. If `v0.0.1` is wrong after push,
  the resolving action is a new tag at a new label, not a
  retag.
- **No GitHub Release.** §"Decision" §5 refuses creating a
  GitHub Release as part of the future operator action. A
  future ADR may reopen this refusal under its own teammate
  review. Reviewers may cite §"Decision" §5 to refuse an
  unauthorized Release.
- **The verification approach is pinned.** §"Decision" §4
  selects the in-tree clean-rebuild + `git diff -- dist-types/`
  approach for ADR-024I §"Tag-readiness checklist" §3. A later
  phase that needs the scratch-directory fallback must reopen
  this choice under its own ADR.
- **Phase 24K-opening makes no package-surface or source
  change.** The committed package surface on `main` after this
  PR merges is byte-identical to its pre-Phase-24K-opening
  state. No Flatline review is warranted.
- **ADR-024J is additive to ADR-024I.** It does not supersede
  ADR-024I; it pins the execution parameters that ADR-024I
  §"Future release / tag execution phase entry conditions" §4
  requires the release / tag execution phase to pin. Reopening
  ADR-024I reopens this ADR; reopening ADR-024H reopens both.

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
- [`./ADR-024F-host-package-consumption-readiness.md`](./ADR-024F-host-package-consumption-readiness.md)
- [`./ADR-024G-host-package-subpath-implementation.md`](./ADR-024G-host-package-subpath-implementation.md)
- [`./ADR-024H-release-and-dixie-flip-gate-plan.md`](./ADR-024H-release-and-dixie-flip-gate-plan.md)
- [`./ADR-024I-release-posture-selection.md`](./ADR-024I-release-posture-selection.md)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (read-only — Phase 24K-opening does not edit it)
- [`../handoffs/phase-24j-release-posture-selection.md`](../handoffs/phase-24j-release-posture-selection.md) (read-only — Phase 24K-opening does not edit it)
- [`../handoffs/phase-24i-release-and-dixie-flip-gate-plan.md`](../handoffs/phase-24i-release-and-dixie-flip-gate-plan.md) (read-only — Phase 24K-opening does not edit it)
- [`../handoffs/phase-24h-host-package-subpath-implementation.md`](../handoffs/phase-24h-host-package-subpath-implementation.md) (read-only — Phase 24K-opening does not edit it)
- [`../../package.json`](../../package.json) (read-only — Phase 24K-opening does not edit it; `version` is `0.0.1` byte-identical to the proposed tag label)
- [`../../package-lock.json`](../../package-lock.json) (read-only — Phase 24K-opening does not edit it)
- [`../../tsconfig.json`](../../tsconfig.json) (read-only — Phase 24K-opening does not edit it)
- [`../../tsconfig.build.json`](../../tsconfig.build.json) (read-only — Phase 24K-opening does not edit it)
- [`../../.npmrc`](../../.npmrc) (read-only — Phase 24K-opening does not edit it; no `@loa` registry mapping exists)
- [`../../.gitignore`](../../.gitignore) (read-only — Phase 24K-opening does not edit it)
- [`../../vitest.config.ts`](../../vitest.config.ts) (read-only — Phase 24K-opening does not edit it)
- [`../../.github/workflows/post-merge.yml`](../../.github/workflows/post-merge.yml) (read-only — confirmed no `npm publish` step, no GitHub Packages publish job, no `@loa` registry auth)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (read-only — wedge public surface, unchanged by Phase 24K-opening)
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) (read-only — host barrel, unchanged by Phase 24K-opening)
- [`../../dist-types/`](../../dist-types/) (read-only — committed declaration emit, unchanged by Phase 24K-opening)
- [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts) (read-only — pins the artifact-shape invariants the tag-readiness checklist §4 mirrors)
- [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts) (read-only — pins the type-only consumption envelope a future Dixie flip inherits)
