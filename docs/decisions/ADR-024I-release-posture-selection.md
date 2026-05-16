# ADR-024I — Release posture selection (Phase 24J opening)

## Status

Accepted-for-Phase-24J.

This ADR is the **Phase 24J opening decision-lock**. It is a
**docs-only release-posture selection**. It selects Gate 1 from
ADR-024H §"Decision" §2 (publish posture) as **Posture 1a**
(private + tag-pinned git-source consumption), pins the
tag-readiness checklist that a future release / tag execution
phase must run against any tagged tree, and confirms that the
post-Phase-24H package configuration on `main` already
unambiguously reflects Posture 1a so **no `package.json` edit is
required to "implement" the selection**.

Phase 24J **selects Gate 1 only**. Phase 24J **prepares Gate 2**
by pinning the tag-readiness checklist; Phase 24J does **not
satisfy Gate 2** because Phase 24J cuts no tag. Phase 24J does
**not satisfy Gate 3**; the Hounfour version-skew posture
selection remains deferred to a separate, later, reviewed phase.

Phase 24J does **not** edit
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
Phase 24J does **not** edit any prior ADR, any prior handoff
(other than the README index entry authored alongside this
ADR), or any sibling repo (`loa-dixie`, `loa-finn`,
`loa-freeside`, `loa-hounfour`). Phase 24J does **not** create a
release tag, does **not** publish the package, does **not** bump
the Hounfour dependency range, does **not** consume Hounfour
`main` or any unpublished commit, does **not** import the
Hounfour `#116` five-step conformance corpus, does **not** adopt
the `0xhoneyjar:straylight:*` audit-event prefix family into the
Straylight public surface, does **not** adopt the `recall-wedge`
Hounfour conformance category into the Straylight test suite,
does **not** advance any ADR-022E gate, does **not** publish a
public commitment root, does **not** file or edit any GitHub
issue / comment / PR, and does **not** touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`.

No Flatline / Bridgebuilder / red-team review is requested or
run by Phase 24J, because Phase 24J makes **no** package-surface
or source change.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24J.

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
  ([`./ADR-024H-release-and-dixie-flip-gate-plan.md`](./ADR-024H-release-and-dixie-flip-gate-plan.md)).

ADR-024I is **additive** to ADR-024H. ADR-024H enumerated three
conjunctive gates (publish posture, release / tag consumption
point, Hounfour version-skew resolution) without selecting any.
ADR-024I selects Gate 1 (publish posture) under ADR-024H §2 as
Posture 1a, and prepares Gate 2 (release / tag consumption point)
by pinning the verification checklist that ADR-024H §3 requires.
ADR-024I does **not** reopen ADR-024H §1's conjunctive
gate-of-gates rule: a future Dixie dependency-flip PR remains
conforming only if **all three** gates are independently
satisfied at the time the flip PR opens.

## Context

### Phase 24H + Phase 24I recap

Phase 24H (ADR-024G + the Phase 24H summary handoff, merged via
PR #34) made the Straylight package surface **type-only
consumable**: a type-only `exports` map with two subpaths
(`"."` and `"./host"`), each with exactly one `"types"`
condition; committed `dist-types/` declaration emit reproducible
from source via `npm run clean:types && npm run build`; no `main`
field; no runtime export conditions; `"private": true` preserved;
Hounfour declared at `@0xhoneyjar/loa-hounfour@^8.6.0`,
unchanged; no tag; no publish.

Phase 24I (ADR-024H + the Phase 24I gate-plan handoff, merged via
PR #35) recorded three independently-load-bearing gates between
the post-Phase-24H type-consumable surface and a future Dixie
dependency flip:

- **Gate 1 — Publish posture.** Either preserve `"private":
  true` with a tag-pinned git-source consumption rule
  (Posture 1a), or un-`"private"` and adopt GitHub Packages
  publishing (Posture 1b). Hybrid posture is refused.
- **Gate 2 — Release / tag consumption point.** A reviewed
  Straylight release / tag event must exist that verifies
  `npm run typecheck`, `npm run build`, `npm test`, and
  `npm pack --dry-run --json` against the tagged tree;
  verifies that committed `dist-types/**` matches
  source-generated output; and verifies that the package artifact
  contains only allowed files.
- **Gate 3 — Hounfour version-skew resolution.** Either Dixie
  bumps to a compatible Hounfour line (Posture 3a), Straylight
  changes Hounfour posture under ADR-024C-style discipline
  (Posture 3b), or duplicate-Hounfour isolation is explicitly
  designed and reviewed (Posture 3c).

Phase 24I selected **none** of the three gates. Phase 24I cut no
tag, published nothing, made no Hounfour change, and edited no
sibling repo. ADR-024H §1 confirmed that gate resolution order
is **not fixed**; the binding rule is the conjunction, not the
temporal sequence.

### Current package state (post-Phase-24I baseline)

The package configuration on `main` after PR #35 merged is
**byte-identical** to the post-Phase-24H baseline. ADR-024I
selects Gate 1 against the following observed state:

- `name`: `@loa/straylight`.
- `version`: `0.0.1`.
- `private`: `true`.
- `type`: `module`.
- `exports`: type-only, exactly two subpaths (`"."`,
  `"./host"`), each with exactly one `"types"` condition. No
  `"default"`, `"import"`, `"require"`, `"node"`, `"browser"`
  condition under any entry.
- `main`: **absent**.
- `types`: `./dist-types/src/straylight/index.d.ts`.
- `files`: `["dist-types/", "README.md", "package.json"]`.
- `scripts.build`: `npm run clean:types && tsc -p tsconfig.build.json`.
- `scripts.prepare`: `npm run build`.
- `scripts.publish`: **absent**. No `prepublishOnly`, no
  `prepack`, no `postpublish` script of any kind.
- `dependencies`: `@0xhoneyjar/loa-hounfour@^8.6.0`.
- Committed `dist-types/**` declaration emit; reproducible from
  source via `npm run clean:types && npm run build`.
- [`../../.npmrc`](../../.npmrc) declares
  `@0xhoneyjar:registry=https://npm.pkg.github.com` only; it
  carries **no** `@loa:registry=` mapping, **no**
  `//npm.pkg.github.com/:_authToken=` placeholder, and **no**
  publish-auth configuration of any kind for the `@loa` scope.
- No `git tag` exists. `git tag --list` is empty.
- No GitHub Release exists.
- No `.github/workflows/` job publishes `@loa/straylight` to any
  registry. The repository's `post-merge.yml` workflow performs
  tag creation under Loa-framework discipline but contains **no**
  `npm publish` step, **no** GitHub Packages publish job, and
  **no** registry-auth wiring for the `@loa` scope.

### Three remaining gates from ADR-024H

ADR-024I selects Gate 1 and prepares Gate 2. Gate 3 remains
**unresolved**. ADR-024I does **not** reopen ADR-024H §1's
conjunctive gate-of-gates rule; the three gates remain
independently load-bearing:

- **Gate 1 — Publish posture.** Selected by Phase 24J as
  Posture 1a (see §"Decision" §1 below).
- **Gate 2 — Release / tag consumption point.** Prepared by
  Phase 24J (see §"Tag-readiness checklist for a future
  release / tag execution phase" below); not satisfied because
  Phase 24J cuts no tag.
- **Gate 3 — Hounfour version-skew resolution.** Unresolved.
  Phase 24J selects no Posture 3a / 3b / 3c. Gate 3 continues to
  independently block any Dixie dependency-flip PR.

## Decision

### 1. Select Posture 1a (private + tag-pinned git-source consumption)

Phase 24J selects **Posture 1a** from ADR-024H §"Decision" §2:

- The package remains `"private": true`. Phase 24J does **not**
  un-`private` the package. No follow-up phase may un-`private`
  the package without an explicit ADR reopening this decision.
- The package is **not** published to any registry. No
  `npm publish`. No GitHub Packages publish. No npm registry
  publish. No private registry publish. No alternate-registry
  publish.
- The `@loa` scope is **not** mapped to any registry in
  [`../../.npmrc`](../../.npmrc). Phase 24J does **not** add a
  `@loa:registry=` line. Phase 24J does **not** add any
  publish-auth token configuration.
- No `publish` / `prepublishOnly` / `prepack` / `postpublish`
  npm-script is added. The `prepare` script remains a
  development convenience (regenerates declarations from source
  on a fresh `npm install`); the committed `dist-types/**` remains
  the authoritative type-only package artifact for tag-pinned
  consumers per ADR-024G "Consequences".
- Future sibling-repo consumption of `@loa/straylight` proceeds
  via a **tag-pinned git source**, e.g.
  `"@loa/straylight": "github:0xHoneyJar/loa-straylight#v<X.Y.Z>"`
  against a reviewed, immutable Straylight tag. The exact
  version label is **not** pre-authorized by Phase 24J; the
  future release / tag execution phase decides.
- The committed `dist-types/**` artifact is the authoritative
  Phase 24H type-only package output that a tag-pinned consumer
  resolves declarations against, without depending on the
  `prepare` script running deterministically before TypeScript
  resolves the package.

The current `package.json` on `main` **already** unambiguously
reflects Posture 1a: `"private": true` is set, no `publish`
script exists, no registry mapping for `@loa` exists, and no
publish workflow exists. Phase 24J therefore makes **no
`package.json` edit**, **no `.npmrc` edit**, and **no
`.github/workflows/` edit** to "implement" Posture 1a. The
implementation is the existing configuration; the decision lock
is this ADR.

### 2. Refuse Posture 1b (un-private + GitHub Packages publishing) for now

Phase 24J **refuses** Posture 1b for the duration covered by
this ADR. Concretely, Phase 24J refuses:

- Setting `"private": false` in
  [`../../package.json`](../../package.json).
- Adding a `publish`, `prepublishOnly`, `prepack`, or
  `postpublish` script.
- Adding `@loa:registry=https://npm.pkg.github.com` (or any other
  registry mapping for the `@loa` scope) to
  [`../../.npmrc`](../../.npmrc).
- Adding a GitHub Packages publish workflow to
  [`../../.github/workflows/`](../../.github/workflows/).
- Adding any `//npm.pkg.github.com/:_authToken=` configuration
  for the `@loa` scope.
- Adopting any OIDC-bound, manual-gate, or tag-triggered publish
  workflow for `@loa/straylight`.

A future ADR may reopen this refusal under its own teammate
review. Reopening must reason through the five tradeoff axes
pinned by ADR-024H §2 (registry authentication; package
visibility; version semantics; CI / publish discipline; tag /
release discipline) before any package-level change lands.

### 3. Refuse hybrid posture

Phase 24J **refuses** hybrid posture per ADR-024H §2. A change
that simultaneously preserves `"private": true` (Posture 1a) and
adds a `publish` script or a GitHub Packages publish workflow
(Posture 1b) is **non-conforming on its face**. The load-bearing
decision is **which posture**, and the package configuration
must unambiguously reflect the choice.

Phase 24J does **not** reopen ADR-024H §2 to permit hybrid
posture. A later ADR may explicitly reopen it; until then,
hybrid posture is refused.

## Rationale

### Posture 1a is the lowest-blast-radius selection

- **No `@loa` registry mapping exists.** Mapping the `@loa`
  scope to GitHub Packages (or to any registry) would require an
  `.npmrc` edit, distribution of an authentication token for
  consumers, and a documented installation path for sibling
  repos. None of that exists today.
- **No publishing workflow exists for `@loa/straylight`.**
  Adopting Posture 1b would require: a publish job in
  `.github/workflows/`, OIDC or PAT credential configuration,
  package-visibility choices (public vs internal vs private
  under GitHub Packages permissions), a versioning cadence
  decision (when does `0.0.1` become `0.1.0` vs `1.0.0`), and a
  separately reviewed workflow-security posture. Each of those
  is a load-bearing decision that warrants its own ADR; bundling
  them with Gate 1 selection would dilute the review.
- **Posture 1a is repo-aligned.** ADR-024G "Consequences" already
  committed `dist-types/**` "as the authoritative Phase 24H
  type-only package artifact for tag-pinned consumers." That
  decision was made precisely so a tag-pinned git-source
  consumer resolves declarations from the tagged tree without
  depending on `prepare` running at install time. Posture 1a is
  the natural Gate-1 closure of that earlier decision.
- **ADR-024G §"Supported consumer assumptions" rule §4 and
  ADR-024H §3 both already pin "tag- / release-pinned git
  source" as the supported consumption mode.** Posture 1a is the
  unambiguous, low-blast-radius, repo-aligned choice that
  inherits the supported-consumer envelope verbatim.
- **No package metadata change is required.** Phase 24J's
  selection of Posture 1a is implemented by the existing
  `package.json` / `.npmrc` / `.github/workflows/` configuration.
  Phase 24J is therefore a pure decision-lock; no source,
  package, test, or workflow surface change is made.

### Why Posture 1b is rejected for now

Posture 1b is **not** refused permanently. It is refused **for
the duration covered by this ADR**, because:

- The setup cost (registry mapping, credential handling,
  publish-workflow review, package-visibility decision,
  versioning cadence decision) is substantial.
- The user-visible benefit of Posture 1b over Posture 1a — i.e.,
  what sibling repos can do under Posture 1b that they cannot
  do under Posture 1a — is **standard npm `semver` resolution
  against a published registry** rather than tag-pinned git-source
  install. That benefit is real but not load-bearing for the
  near-term cross-repo plan: a Dixie dependency flip under
  Posture 1a is conforming (per ADR-024H §6) provided it cites
  an immutable tag.
- A future ADR may reopen Posture 1b under a separate
  larger-blast-radius review. Phase 24J explicitly preserves
  that option.

### Why Posture 3a / 3b / 3c is not selected by Phase 24J

Gate 3 (Hounfour version-skew resolution) is independently
load-bearing per ADR-024H §1. Phase 24J's scope is deliberately
narrow: select Gate 1, prepare Gate 2. Selecting Gate 3 inside
Phase 24J would (a) inflate the review surface, (b) couple
otherwise-independent decisions, and (c) potentially constrain
the Hounfour-skew posture choice by the Gate-1 / Gate-2 framing.
Phase 24J defers Gate 3 to a separate later phase under separate
review. The deferral preserves ADR-024H §1's
gate-resolution-order rule (not fixed; conjunctive at flip
time).

## Gate status

After Phase 24J merges, the gate status is:

| Gate | Status | Resolving artifact (now / future) |
|---|---|---|
| Gate 1 — Publish posture | **Selected** by Phase 24J | This ADR (ADR-024I); existing `package.json` / `.npmrc` / `.github/workflows/` configuration on `main` already reflects Posture 1a unambiguously |
| Gate 2 — Release / tag consumption point | **Prepared, not satisfied** | Tag-readiness checklist below; a future release / tag execution phase must cut a reviewed, immutable Straylight tag against the checklist |
| Gate 3 — Hounfour version-skew resolution | **Unresolved, still blocking** | A future Hounfour-skew decision phase must select Posture 3a / 3b / 3c per ADR-024H §4 |

A future Dixie dependency-flip PR remains **non-conforming**
until all three gates are independently satisfied per ADR-024H
§5's conjunctive gate-of-gates rule.

## Tag-readiness checklist for a future release / tag execution phase

Phase 24J **prepares** Gate 2 by pinning the following checklist.
The future release / tag execution phase **must** run every item
below against the tagged tree and record the result before
creating the tag, and **must** cite this ADR by name in its
opening ADR / handoff.

Phase 24J itself **does not run this checklist as a release
gate**, and **does not cut a tag**. The Phase 24J validation
suite (see §"Explicit non-scope" below) re-runs a subset of the
commands purely to confirm the post-Phase-24I baseline is
unperturbed by Phase 24J's docs-only changes.

### 1. Pre-tag verification commands

The future release / tag execution phase must run each command
below against the tagged tree (i.e., a clean checkout of the
commit that will receive the tag) and record exit status,
stdout, and stderr in the phase's handoff:

- `npm run typecheck` — must exit 0; no output indicating type
  errors.
- `npm run build` — must exit 0; must regenerate
  `dist-types/**` from source. The `clean:types` prelude must
  remove any prior `dist-types/` content; the rebuilt artifact
  must match the committed `dist-types/**` byte-for-byte (see
  §3 below).
- `npm test` — must exit 0; must run the full vitest suite,
  including
  [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts)
  and
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts).
- `npm pack --dry-run --json` — must exit 0; the produced
  tarball preview must satisfy the artifact-shape allow/deny
  invariants pinned in §4 below.

### 2. Declaration entrypoint existence

After `npm run build` against the tagged tree, both declaration
entrypoints must exist on disk:

- [`../../dist-types/src/straylight/index.d.ts`](../../dist-types/src/straylight/index.d.ts)
- [`../../dist-types/src/straylight/host/index.d.ts`](../../dist-types/src/straylight/host/index.d.ts)

A missing entrypoint indicates a regression in
[`../../tsconfig.build.json`](../../tsconfig.build.json) (most
likely a change to `rootDir`, `declarationDir`, `declaration`,
`emitDeclarationOnly`, `noEmit`, or `include`) and **must** halt
the release.

### 3. Committed `dist-types/**` matches source-generated output

The future release / tag execution phase **must** verify that
the committed `dist-types/**` artifact matches the
source-generated output produced by `npm run clean:types &&
npm run build` from the tagged tree. Verification approach (the
release phase's opening ADR may choose either, or another
equivalent approach, and must document the choice):

- diff the working-tree `dist-types/**` against `git show
  <tag>:dist-types/**` after building from the clean checkout;
- or rebuild into a separate scratch directory and compare
  byte-for-byte.

Any drift between committed `dist-types/**` and source-generated
output indicates either (a) a source change that was not
followed by a `dist-types/` regeneration, or (b) a
`dist-types/` edit with no matching source change — both of
which are non-conforming per ADR-024G "Consequences" and **must**
halt the release.

### 4. Package artifact contents (allow-list and deny-list)

The `npm pack --dry-run --json` output must satisfy both an
allow-list and a deny-list. These mirror the invariants already
pinned by
[`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts)
under `describe('Phase 24H — npm pack contents (IMP-004 /
IMP-009)')`; the release / tag execution phase must verify them
against the tagged tree.

**Allow-list — the tarball MUST contain ONLY:**

- `README.md`
- `package.json`
- `dist-types/**/*.d.ts` (and `*.d.ts.map` siblings if any
  declaration-map output is produced)

**Deny-list — the tarball MUST NOT contain ANY of:**

- `src/**` (TypeScript source).
- `tests/**` (vitest test files).
- `scripts/**` (build / demo / handoff scripts).
- `fixtures/**` (test fixtures).
- `docs/**` (this ADR included).
- `node_modules/**`.
- Local / system artifacts (`.run/**`, `.claude/**`, `.loa/**`,
  `.beads/**`, `.github/**`, `grimoires/**`).
- `package-lock.json`.
- `.npmrc`.
- `.gitignore`.
- Any `tsconfig*.json` (including `tsconfig.json`,
  `tsconfig.build.json`, or any future tsconfig sibling).
- `vitest.config.ts`.
- Any `.js`, `.ts` (non-declaration), or `.json` (non-package)
  file under `dist-types/`.

### 5. Forbidden-path diff

The future release / tag execution phase **must** verify, before
the tag is created, that:

```bash
git diff -- src/ tests/ fixtures/ scripts/ \
  package.json package-lock.json \
  tsconfig.json tsconfig.build.json vitest.config.ts \
  .npmrc .gitignore \
  dist-types/ docs/mvp/package-boundary.md
```

produces **empty** output (no diff) for the tag candidate.
Source / package / test / config diffs at tag time indicate
either (a) an unreviewed change slipped into the tag candidate,
or (b) a `dist-types/` regeneration that did not match source —
both non-conforming.

### 6. Tag immutability

The Straylight tag created by the future release / tag execution
phase **must** be immutable:

- Tags **must not** be force-pushed. A `git push --force` or
  `git push --force-with-lease` against a Straylight release tag
  is non-conforming.
- Retagging is **non-conforming**. Moving an existing tag from
  one commit to another (whether by delete-and-recreate, by
  `--force`, or by any other mechanism) is non-conforming.
- If a tag is wrong — e.g., the tagged tree fails any item in
  §1–§5 above, or the tag cites the wrong commit — the
  resolving action is **cut a new tag** at a new version label
  (per the version-label discipline the release phase's opening
  ADR pins). The wrong tag remains in the history, annotated as
  superseded by the new tag in the release phase's handoff.
- The Dixie dependency-flip PR (whenever it eventually opens)
  cites the **exact** tag selected by its reviewer; the
  citation is binding. If a cited tag turns out to be wrong, the
  Dixie flip PR is itself non-conforming and must be reopened
  citing the new tag.

### 7. Reproducibility

The future release / tag execution phase **must** record, in its
handoff, the command sequence that proves the tagged tree is
reproducibly buildable from source. At minimum:

```bash
git checkout <tag>
npm run clean:types
npm run build
git diff -- dist-types/
```

The final `git diff -- dist-types/` must be **empty**.

## Refused consumption shortcuts

Phase 24J reaffirms (inheriting from ADR-024H §3) that a future
Dixie dependency-flip PR's package-entry **must not** use any
of the following consumption modes. Each is **refused** as a
production posture; any flip PR using one is non-conforming on
its face. Reviewers (Dixie-side or Straylight-side observers)
may cite this ADR to refuse it.

- **`main`-HEAD dependency.** A Dixie `package.json` entry
  pointing at `loa-straylight` via `#main` (or any other
  non-tag branch reference) is non-conforming.
- **Raw commit-SHA dependency flip.** A Dixie `package.json`
  entry pointing at `loa-straylight` via a commit SHA against an
  unpublished tree is non-conforming. Commit SHAs are not
  release events.
- **Unpublished working-tree dependency flip.** A Dixie
  `package.json` entry pointing at a developer's local
  `loa-straylight` clone is non-conforming as a production
  posture. It remains acceptable only as an ephemeral local-only
  development link, never on `main`.
- **Workspace-path dependency flip as production posture.** A
  Dixie `package.json` entry using `"file:../loa-straylight"`,
  `"link:..."`, an npm workspace path, or any other
  filesystem-anchored consumption mode as the merged `main`
  production posture is non-conforming.
- **Dixie dependency flip without all three gates.** A Dixie
  dependency-flip PR that opens before all three of ADR-024H's
  gates are satisfied is non-conforming per ADR-024H §5's
  conjunctive gate-of-gates rule. Phase 24J satisfies Gate 1
  alone; it does **not** authorize Dixie to flip.

## Dixie flip rule after Phase 24J

Phase 24J **alone does not authorize** any Dixie dependency
flip. The post-Phase-24J Dixie-side flip protocol is:

1. **Phase 24J satisfies Gate 1.** A Dixie flip PR that cites
   only ADR-024I (and nothing for Gate 2 / Gate 3) is
   non-conforming.
2. **A future release / tag execution phase satisfies Gate 2.**
   The release / tag execution phase runs the tag-readiness
   checklist above against the tagged tree, cuts an immutable
   tag (per §"Tag-readiness checklist" §6), and lands its own
   ADR + handoff under teammate review. The Dixie flip PR cites
   the exact tag.
3. **A future Hounfour-skew decision phase satisfies Gate 3.**
   That phase selects Posture 3a / 3b / 3c per ADR-024H §4,
   under separate teammate review, and the Dixie flip PR cites
   its resolving artifact (Dixie-side bump PR for 3a;
   Straylight-side Hounfour ADR for 3b; isolation design doc
   for 3c).
4. **The Dixie-side flip PR opens in `loa-dixie`.** It cites
   ADR-024H + ADR-024I + the Gate-2 release / tag event +
   the Gate-3 resolving artifact. It replaces Dixie's local
   type mirrors with `import type { ... } from
   '@loa/straylight/host'` (and / or `import type { ... } from
   '@loa/straylight'`). It does **not** add value imports,
   runtime imports, dynamic `import()` calls, `require()` calls,
   endpoint changes, rendering changes, vector 9 / 10 / 11
   widening, Hounfour `#116` adoption, `0xhoneyjar:straylight:*`
   adoption, `recall-wedge` adoption, public commitment-root
   behavior, or any runtime Straylight import. The Dixie-side
   flip PR is reviewed under Dixie-side review process;
   Straylight-side does not pre-approve the Dixie flip itself,
   only the gate-satisfying events on the Straylight side.

A Dixie-side flip PR opened before any of Gate 2 / Gate 3 are
satisfied is non-conforming on its face. Reviewers may cite
ADR-024H §5 and ADR-024I §"Dixie flip rule after Phase 24J" to
refuse it. **Until all three gates are present, a Dixie
dependency flip is non-conforming.**

## Explicit non-scope

Phase 24J inherits every non-goal from ADR-024A / ADR-024B /
ADR-024C / ADR-024D / ADR-024E / ADR-024F / ADR-024G / ADR-024H
wholesale, and adds these Phase 24J-specific refusals:

1. **No tag.** No `git tag`. No GitHub Release. No annotated
   tag, no lightweight tag, no signed tag. The future release /
   tag execution phase cuts the tag, not Phase 24J.
2. **No publish.** No `npm publish`. No GitHub Packages publish.
   No npm-registry publish. No alternate-registry publish.
   `"private": true` is preserved verbatim.
3. **No `package.json` edit.** The package configuration
   already reflects Posture 1a unambiguously; Phase 24J makes no
   edit to confirm that.
4. **No `package-lock.json` edit.** No dependency change.
5. **No `.npmrc` edit.** Registry configuration unchanged. No
   `@loa:registry=` mapping is added.
6. **No `.github/workflows/` edit.** No publish workflow is
   added. The existing
   [`../../.github/workflows/post-merge.yml`](../../.github/workflows/post-merge.yml)
   tag-creation discipline is **not** invoked by Phase 24J to
   cut a Straylight tag.
7. **No `tsconfig.json` / `tsconfig.build.json` edit.** Build
   configuration unchanged.
8. **No `vitest.config.ts` / `.gitignore` edit.**
9. **No source edit.** No file under
   [`../../src/`](../../src/) is touched. The wedge public
   surface and the host barrel are byte-identical to their
   post-Phase-24I state.
10. **No test edit.** No file under
    [`../../tests/`](../../tests/) is touched. The Phase 24H
    tests continue to pass against the unchanged state.
11. **No `dist-types/` edit.** No file under
    [`../../dist-types/`](../../dist-types/) is touched. The
    committed Phase 24H declaration emit is preserved.
12. **No script edit.** No file under
    [`../../scripts/`](../../scripts/) is touched.
13. **No fixture edit.** No file under
    [`../../fixtures/`](../../fixtures/) is touched.
14. **No `package-boundary.md` edit.**
    [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    is read-only for Phase 24J.
15. **No Hounfour bump / change.** The
    `@0xhoneyjar/loa-hounfour@^8.6.0` range is preserved
    verbatim. No Hounfour `main` consumption. No commit-SHA pin.
    No `#116` corpus import. No `0xhoneyjar:straylight:*`
    adoption. No `recall-wedge` adoption.
16. **No sibling repo edit.** No edit to `loa-dixie`,
    `loa-finn`, `loa-freeside`, or `loa-hounfour`.
17. **No Dixie dependency flip.** Phase 24J does not authorize,
    pre-authorize, or implement any Dixie-side dependency flip.
    The flip is a future Dixie-side PR under separate
    Dixie-side review.
18. **No Flatline / Bridgebuilder / red-team request.** Phase
    24J makes no package-surface or source change; multi-model
    adversarial review is not warranted.
19. **No prior-ADR edit.** ADR-024I is additive; ADR-024A
    through ADR-024H are preserved verbatim.
20. **No prior-handoff edit.** Only the new Phase 24J handoff
    and the README index entry authored alongside this ADR are
    new artifacts; all prior handoffs are byte-identical.
21. **No ADR-022E gate advance.** No Phase 19A pending feedback
    advance on
    [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
    No commitment-root publication. No endpoint. No runtime
    Straylight import into any sibling repo.
22. **No `npm install` / `npm update` / `npm ci` / `npm
    publish` / `npm pack` (as a publish step) / `npm version` /
    package-manager mutation command.** `npm pack --dry-run` is
    allowed in validation (it is read-only).
23. **No GitHub issue / comment / PR action.** No filing, no
    editing, no commenting on any GitHub issue or PR.
24. **No touch of
    [`../../.loa`](../../.loa),
    [`../../.loa.config.yaml`](../../.loa.config.yaml),
    [`../../.claude/`](../../.claude/),
    [`../../.beads/`](../../.beads/),
    [`../../.run/`](../../.run/),
    [`../../.github/`](../../.github/),
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
    `node_modules/`.**

## Future-phase entry conditions

ADR-024I pins entry conditions for three future phases. Each
future phase **must** cite ADR-024I (and ADR-024H) by name if it
claims to satisfy a gate.

### Future release / tag execution phase entry conditions

1. ADR-024H merged on `main` under teammate review.
2. Phase 24I handoff merged on `main` under teammate review.
3. **ADR-024I merged on `main` under teammate review.** This
   ADR's selection of Posture 1a is the load-bearing publish
   posture for the release / tag execution phase; the phase
   must cite ADR-024I §"Decision" §1 by name.
4. The release / tag execution phase opens with its own opening
   ADR that cites ADR-024I §"Tag-readiness checklist" by name,
   reasons about the exact version label, and pins the
   verification approach for §3 ("committed dist-types/**
   matches source-generated output") it will use against the
   tagged tree.
5. The release / tag execution phase's implementation PR
   demonstrates that every item in §1–§7 of the tag-readiness
   checklist passes against the tagged tree, with the command
   output recorded in the phase's handoff.
6. No sibling-repo wiring in the same PR. A Dixie-side
   dependency flip, if it eventually happens, is a separate
   Dixie-side PR.

### Future Hounfour-skew decision phase entry conditions

1. ADR-024H merged on `main` under teammate review.
2. Phase 24I handoff merged on `main` under teammate review.
3. The Hounfour-skew decision phase opens with an opening doc
   (Straylight-side ADR for Posture 3b; Dixie-side opening doc
   for Posture 3a; joint design doc for Posture 3c) that
   **explicitly selects** one of Posture 3a / 3b / 3c from
   ADR-024H §4, with reasoning on file before any code change
   lands.
4. The implementation PR cites ADR-024H §4 and demonstrates
   that the selected posture's refusal rules are honored (no
   Hounfour `main` / unpublished consumption; no commit-SHA
   silent fix; no implicit duplicate-Hounfour acceptance).
5. The phase may run in either repository depending on the
   selected posture; cross-repo coordination is documented in
   the opening doc.
6. ADR-024I is **not** a prerequisite for the Hounfour-skew
   decision phase. Gate 3 is independent of Gate 1. The phase
   may resolve before or after the future release / tag
   execution phase.

### Future Dixie dependency-flip phase entry conditions

1. ADR-024H merged on `main` under teammate review.
2. Phase 24I handoff merged on `main` under teammate review.
3. **Gate 1 satisfied:** ADR-024I merged on `main`. The
   package configuration on `main` continues to reflect
   Posture 1a unambiguously (`"private": true`; no `publish`
   script; no `@loa:registry=` mapping; no GitHub Packages
   publish workflow).
4. **Gate 2 satisfied:** the future release / tag execution
   phase has cut an immutable Straylight tag verified per
   ADR-024I §"Tag-readiness checklist", and the Dixie flip PR
   cites the exact tag.
5. **Gate 3 satisfied:** the future Hounfour-skew decision
   phase has selected Posture 3a / 3b / 3c per ADR-024H §4 and
   the resolving action has landed (or the isolation design is
   on file for Posture 3c), and the Dixie flip PR cites it.
6. The Dixie-side flip PR is opened in `loa-dixie`, cites
   ADR-024H + ADR-024I + the Gate-2 release / tag event + the
   Gate-3 resolving artifact, replaces Dixie's local type
   mirrors with `import type` consumption only, and does
   **not** bundle any of the refused changes listed in §"Dixie
   flip rule after Phase 24J" above or in ADR-024H §6.
7. Dixie-side review approves the flip PR independently of any
   Straylight-side review. Straylight reviewers do not
   pre-approve the flip; they only confirm that the cited
   gate-satisfying events are valid.

## Consequences

- **Gate 1 is selected and reviewable.** The Straylight-side
  publish posture is no longer a deferred decision; it is
  Posture 1a, pinned by this ADR. Reviewers (Dixie-side or
  Straylight-side observers) may cite ADR-024I §"Decision" §1
  to refuse any future change that adds a `publish` step or
  un-`private`s the package without a successor ADR.
- **Gate 2 is prepared and reviewable.** The tag-readiness
  checklist is concrete: a future release / tag execution phase
  has an unambiguous specification of what it must verify
  against the tagged tree, and an unambiguous specification of
  what it must record in its handoff. Reviewers may cite
  ADR-024I §"Tag-readiness checklist" to refuse a tag that has
  not been verified.
- **No `package.json` / `.npmrc` / `.github/workflows/` change
  required.** The existing configuration on `main` already
  reflects Posture 1a. Phase 24J is a pure decision-lock with no
  source / package / test / workflow surface change.
- **Tag immutability is pinned at decision time.** ADR-024I §6
  forbids force-pushed tags, retagging, and tag-relocation.
  Future Dixie-side reviewers may rely on this rule when
  reviewing flip PRs that cite tags.
- **Gate 3 remains independently load-bearing.** Phase 24J does
  not resolve Gate 3; it does not pre-commit any Hounfour-skew
  posture. A Dixie flip PR that lands after Phase 24J + a
  future release / tag execution phase but before Gate 3 is
  satisfied is **non-conforming**.
- **Hybrid posture remains refused.** ADR-024I §"Decision" §3
  restates the refusal. A future PR that adds a `publish`
  script while preserving `"private": true`, or that un-`private`s
  the package while leaving the `prepare` script unchanged, is
  non-conforming on its face.
- **Dixie PR #96 remains the correct transitional seam.**
  Phase 24J does not flip Dixie's dependency. The local
  adapter mirrors stay correct as the pre-consumption boundary
  per ADR-024H §"Consequences".
- **Phase 24H type-consumability remains intact.**
  `@loa/straylight/host` is consumable for type-only imports
  by any consumer in the Phase 24H supported envelope
  (TypeScript >= 5.4; `moduleResolution: "Bundler"` or
  `"NodeNext"`; `import type` only; tag- / release-pinned git
  source). Phase 24J does not widen, narrow, or otherwise alter
  that envelope.
- **No silent gate satisfaction.** A future PR that adds a
  `publish` step without a successor ADR reopening §"Decision"
  §2 satisfies neither Gate 1 nor any other gate. A future PR
  that cuts a tag without running the tag-readiness checklist
  satisfies neither Gate 2 nor any other gate. The ADR is the
  load-bearing artifact, not the code change.
- **ADR-024I is additive to ADR-024H.** It does not supersede
  ADR-024H; it selects Gate 1 under ADR-024H §2 and prepares
  Gate 2 under ADR-024H §3. Reopening ADR-024H reopens this
  ADR; reopening ADR-024G reopens both.

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
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24i-release-and-dixie-flip-gate-plan.md`](../handoffs/phase-24i-release-and-dixie-flip-gate-plan.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24h-host-package-subpath-implementation.md`](../handoffs/phase-24h-host-package-subpath-implementation.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24g-host-package-consumption-readiness-plan.md`](../handoffs/phase-24g-host-package-consumption-readiness-plan.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24f-dixie-host-issue-draft.md`](../handoffs/phase-24f-dixie-host-issue-draft.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24e-dixie-host-handoff-packet.md`](../handoffs/phase-24e-dixie-host-handoff-packet.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24d-host-scaffold-hardening.md`](../handoffs/phase-24d-host-scaffold-hardening.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24c-dixie-recall-host-scaffold.md`](../handoffs/phase-24c-dixie-recall-host-scaffold.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md) (read-only — Phase 24J does not edit it)
- [`../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md`](../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md) (read-only — Phase 24J does not edit it)
- [`../../package.json`](../../package.json) (read-only — Phase 24J does not edit it; current configuration already reflects Posture 1a)
- [`../../package-lock.json`](../../package-lock.json) (read-only — Phase 24J does not edit it)
- [`../../tsconfig.json`](../../tsconfig.json) (read-only — Phase 24J does not edit it)
- [`../../tsconfig.build.json`](../../tsconfig.build.json) (read-only — Phase 24J does not edit it)
- [`../../.npmrc`](../../.npmrc) (read-only — Phase 24J does not edit it; no `@loa` registry mapping exists)
- [`../../.gitignore`](../../.gitignore) (read-only — Phase 24J does not edit it)
- [`../../vitest.config.ts`](../../vitest.config.ts) (read-only — Phase 24J does not edit it)
- [`../../.github/workflows/post-merge.yml`](../../.github/workflows/post-merge.yml) (read-only — confirmed no `npm publish` step, no GitHub Packages publish job, no `@loa` registry auth)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (read-only — wedge public surface, unchanged by Phase 24J)
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) (read-only — host barrel, unchanged by Phase 24J)
- [`../../dist-types/`](../../dist-types/) (read-only — committed declaration emit, unchanged by Phase 24J)
- [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts) (read-only — pins the artifact-shape invariants the tag-readiness checklist §4 mirrors)
- [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts) (read-only — pins the type-only consumption envelope the future release / tag execution phase inherits)
