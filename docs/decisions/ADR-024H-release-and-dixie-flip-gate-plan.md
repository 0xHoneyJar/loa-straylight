# ADR-024H — Release and Dixie dependency-flip gate plan (Phase 24I opening)

## Status

Accepted-for-Phase-24I.

This ADR is the **Phase 24I opening decision-lock**. It is a
**docs-only gate plan**. It enumerates the remaining gates that
must be satisfied before any sibling-repo (specifically
`loa-dixie`) may flip its dependency consumption from local type
mirrors to `import type { ... } from '@loa/straylight/host'`, and
records the refusal rules that govern a future Dixie-side
dependency-flip PR.

Phase 24I does **not** select any of the gates. Phase 24I does
**not** cut a release tag. Phase 24I does **not** publish the
package. Phase 24I does **not** edit any prior ADR, any prior
handoff (other than the README index entry authored alongside
this ADR), any sibling repo, any source under
[`../../src/`](../../src/), any test under
[`../../tests/`](../../tests/), any file under
[`../../scripts/`](../../scripts/) or
[`../../fixtures/`](../../fixtures/), any committed declaration
under [`../../dist-types/`](../../dist-types/), any package /
build / resolver configuration
([`../../package.json`](../../package.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../tsconfig.json`](../../tsconfig.json),
[`../../tsconfig.build.json`](../../tsconfig.build.json),
[`../../vitest.config.ts`](../../vitest.config.ts),
[`../../.npmrc`](../../.npmrc),
[`../../.gitignore`](../../.gitignore)), or the Phase 5 stable
public surface
([`../mvp/package-boundary.md`](../mvp/package-boundary.md)).
Phase 24I does **not** bump, downgrade, or reconcile the
Hounfour dependency range. Phase 24I does **not** consume
Hounfour `main`, any unpublished commit, or any commit-SHA pin.
Phase 24I does **not** import the Hounfour `#116` five-step
conformance corpus, adopt the `0xhoneyjar:straylight:*`
audit-event prefix family into the Straylight public surface,
adopt the `recall-wedge` Hounfour conformance category into the
Straylight test suite, advance any ADR-022E gate, publish a
public commitment root, file or edit any GitHub issue / comment /
PR, or touch [`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/).

No Flatline / Bridgebuilder / red-team review is requested or
run by Phase 24I, because Phase 24I makes **no** package-surface
or source change.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24I.

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
  ([`./ADR-024G-host-package-subpath-implementation.md`](./ADR-024G-host-package-subpath-implementation.md)).

ADR-024H is **additive** to ADR-024G. ADR-024G executed the
declaration-only / type-only package-surface widening that made
`@loa/straylight/host` type-consumable. ADR-024H records the gates
that **still** stand between that type-consumability and a
sibling-repo dependency flip.

## Context

Phase 24H (ADR-024G + the Phase 24H handoff, merged on `main` via
PR #34) made the Straylight package surface **package-surface-ready
for type-only consumption**. Concretely, the post-Phase-24H package
state is:

- `name`: `@loa/straylight`.
- `version`: `0.0.1`.
- `private`: `true` (preserved).
- `exports` map: type-only, exactly two subpaths (`"."` and
  `"./host"`), exactly one condition per entry (`"types"`).
- No `"default"` / `"import"` / `"require"` / `"node"` /
  `"browser"` condition appears under any `exports` entry.
- No `main` field. No runtime entrypoint.
- No `dist/` directory. No JS emission. No runtime widening.
- Committed `dist-types/` declaration emit, reproducible from
  source via `npm run clean:types && npm run build`.
- TypeScript `>= 5.4` REQUIRED (pinned via `devDependencies`,
  asserted in the Phase 24H consumption test).
- Supported `moduleResolution` modes: **exactly `"Bundler"` and
  `"NodeNext"`**. Legacy / non-export-aware modes (`"node"`,
  `"classic"`, `"node10"`, `"node16"`) are unsupported and pinned
  as expected-to-fail by the Phase 24H consumption test.
- Runtime / value imports
  (`await import('@loa/straylight/host')`,
  `require('@loa/straylight/host')`, value imports of any symbol)
  are **unsupported by design**; failure to resolve with
  `ERR_PACKAGE_PATH_NOT_EXPORTED` is the intended Phase 24H
  posture, not a defect.
- Hounfour dependency: `@0xhoneyjar/loa-hounfour@^8.6.0`,
  unchanged.

Phase 24H **did not** authorize a Dixie dependency flip.
Phase 24H **did not** cut a release tag. Phase 24H **did not**
publish the package. Phase 24H **did not** resolve the Hounfour
version skew between Straylight's `^8.6.0` floor and Dixie's
older pin. Dixie PR #96 remains the correct transitional seam: a
local adapter-boundary PR, not a real `@loa/straylight`
dependency-flip PR.

Three independently-load-bearing gates therefore still stand
between the post-Phase-24H state and a sibling-repo dependency
flip. Phase 24I records those gates and the refusal rules that
follow from them. Phase 24I does **not** resolve any of the
gates; gate resolution is the responsibility of later phases
under separate review.

## Decision

Phase 24I records the following gate plan. The plan is binding on
any later phase that claims to satisfy a gate, and on any future
Dixie-side dependency-flip PR that cites `@loa/straylight/host`
consumption.

### 1. Three remaining gates

A future Dixie dependency-flip PR is **conforming** only if all
three gates below are independently satisfied. The gates are
**conjunctive**: satisfying one or two of them is **not**
sufficient.

- **Gate 1 — Publish posture.** Straylight must select and
  implement one of the two ADR-024F §"Recommended future
  implementation posture" §6 postures (see §2 below).
- **Gate 2 — Release / tag consumption point.** A reviewed
  Straylight release / tag event must exist that satisfies the
  consumption-discipline rules in §3 below; the Dixie flip PR
  must cite the exact event.
- **Gate 3 — Hounfour version-skew resolution.** A reviewed
  posture must be selected and either implemented (Straylight
  side or Dixie side) or explicitly isolated under one of the
  three postures in §4 below.

Gate resolution order is **not fixed**. Hounfour-skew resolution
may resolve before or after the release/tag event; the
publish-posture choice may resolve before or after the
Hounfour-skew posture. The binding rule is the **conjunction**,
not the temporal sequence.

### 2. Gate 1 — Publish posture (deferred; refusal rules pinned)

Phase 24I enumerates, but does **not** select, the publish-
posture postures already named in ADR-024F §"Recommended future
implementation posture" §6:

- **Posture 1a — `private` + tag-pinned git-source consumption.**
  Preserve `"private": true`. No `npm publish`. No GitHub
  Packages adoption. Sibling repos consume Straylight via a
  tag-pinned git source (e.g.
  `"@loa/straylight": "github:0xHoneyJar/loa-straylight#vX.Y.Z"`).
  Tradeoffs to be assessed by the selecting ADR:

  - Registry authentication: not required for git source;
    sibling repos with read access to the GitHub repository can
    install without registry credentials.
  - Package visibility: scoped by GitHub repository read access;
    no public-registry exposure.
  - Version semantics: tags are advisory; npm `semver` ranges
    against git sources behave differently from registry-resolved
    ranges, with documented sharp edges.
  - CI / publish discipline: no publish step; CI must enforce
    that `dist-types/` is reproducible from source and that the
    tag commit matches the tagged tree.
  - Tag / release discipline: tags must be immutable; force-pushed
    tags are non-conforming.

- **Posture 1b — un-`private` + GitHub Packages publishing.**
  Set `"private": false`. Publish to GitHub Packages under the
  `@loa` (or successor) scope. Sibling repos consume Straylight
  via a published version range. Tradeoffs to be assessed by the
  selecting ADR:

  - Registry authentication: GitHub Packages token required for
    consumers; `.npmrc` configuration must be documented and
    distributed.
  - Package visibility: scoped per GitHub Packages registry
    permissions.
  - Version semantics: standard npm `semver` resolution; release
    cadence and version bumps follow npm conventions.
  - CI / publish discipline: a `publish` step is added under a
    separately-reviewed posture (manual gate, OIDC-bound, or
    tag-triggered workflow); credentials handling is part of the
    selecting ADR.
  - Tag / release discipline: published versions are immutable
    by registry policy; tag/release events must remain aligned
    with published versions.

**Hybrid posture is refused** unless a later ADR explicitly
reopens this rule. A change that simultaneously preserves
`"private": true` (Posture 1a) and adds a `publish` script
(Posture 1b) is non-conforming on its face; the load-bearing
decision is **which posture**, and the package configuration must
unambiguously reflect the choice.

Phase 24I does **not** modify `"private": true`. Phase 24I does
**not** publish. Phase 24I does **not** change the package scope
or registry configuration. Phase 24I does **not** pre-authorize
either posture. The selecting ADR must reason explicitly about
the five tradeoff axes listed under each posture before any
package-level change lands.

### 3. Gate 2 — Release / tag consumption point (deferred; refusal rules pinned)

Phase 24I does **not** cut a tag, does **not** create a GitHub
Release, and does **not** publish the package.

A future release / tag execution phase **must** verify, before
the tag / release event is created, that all of the following
validation commands pass against the tagged tree:

```bash
npm run typecheck
npm run build
npm test
npm pack --dry-run --json
```

The release / tag execution phase **must additionally** verify:

- The committed `dist-types/**` artifact matches the
  source-generated output produced by
  `npm run clean:types && npm run build` from the tagged tree.
- The package artifact produced by `npm pack --dry-run --json`
  contains **only** the files allowed by the Phase 24H `files`
  field (`dist-types/`, `README.md`, `package.json`) and the
  Phase 24H package-exports test's allowed-paths invariant.
- No `.js` runtime emission, no `.ts` source, and no
  configuration payload (`tsconfig*.json`, `vitest.config.ts`,
  `.npmrc`, `.gitignore`, `package-lock.json`) ships under the
  packaged tarball.

A future Dixie dependency-flip PR **must** cite the **exact**
Straylight release / tag event that satisfies this gate. A flip
PR that cannot name the tag, that names a tag that does not pass
the verification commands above, or that names an event whose
verification predates the verifying commit, is non-conforming.

The release / tag consumption point **explicitly refuses**:

- **`main`-HEAD consumption.** A Dixie `package.json` entry
  pointing at `loa-straylight` via `#main` (or any other
  non-tag git reference) is non-conforming.
- **Raw commit-SHA dependency flip.** A Dixie `package.json`
  entry pointing at `loa-straylight` via a commit SHA against
  an unpublished tree is non-conforming. Commit SHAs are not
  release events.
- **Unpublished working-tree dependency flip.** A Dixie
  `package.json` entry pointing at a developer's local
  `loa-straylight` clone is non-conforming as a production
  posture (it remains acceptable as an ephemeral local-only
  development link, never on `main`).
- **Workspace-path dependency flip as a production posture.** A
  Dixie `package.json` entry using `"file:../loa-straylight"`,
  `"link:..."`, an npm workspace path, or any other
  filesystem-anchored consumption mode as the merged `main`
  production posture is non-conforming.

### 4. Gate 3 — Hounfour version-skew resolution (deferred; hard gate)

Straylight's Hounfour range is `^8.6.0` (post-Phase-24H,
unchanged). Dixie has an older / non-matching Hounfour posture
that must be resolved or isolated before any Dixie-side
dependency flip lands. Phase 24I does **not** authoritatively
restate Dixie's exact Hounfour version; that fact is
**Dixie-side state** that must be directly verified in Dixie at
the phase that selects and implements one of the postures
below.

Phase 24I enumerates, but does **not** select, three acceptable
postures:

- **Posture 3a — Dixie bumps to a compatible Hounfour line under
  Dixie-side review.** A Dixie-side PR raises Dixie's Hounfour
  dependency range to a line that overlaps Straylight's `^8.6.0`
  floor, with a Dixie-side review that confirms the bump does
  not break Dixie's existing consumption paths.

- **Posture 3b — Straylight changes Hounfour posture under
  ADR-024C-style discipline.** A Straylight-side ADR reasons
  about whether to lower the floor, change the range, or split
  the dependency, under the package-release ambiguity discipline
  pinned by ADR-024C (only published GitHub Packages releases of
  `@0xhoneyjar/loa-hounfour` are consumable; Hounfour `main`,
  commit-SHA pins, git-source dependencies, and Hounfour
  `dist/`-only-on-`main` paths are refused).

- **Posture 3c — Duplicate-Hounfour isolation is explicitly
  designed and reviewed.** Both sides hold their existing
  Hounfour ranges; the resulting duplicate-Hounfour dependency
  graph is explicitly designed (which side owns which Hounfour
  primitives at runtime; how class-vs-policy invariants are
  preserved across two Hounfour instances; how receipt /
  audit-chain semantics remain coherent when two Hounfour
  versions co-exist in the same dependency tree) and reviewed
  before the Dixie flip lands.

The Hounfour version-skew resolution **explicitly refuses**:

- **Hounfour `main` / unpublished consumption.** Either side
  consuming `@0xhoneyjar/loa-hounfour` via `main`, a non-release
  branch, or a non-tagged commit is non-conforming. This rule
  inherits directly from ADR-024C.
- **Hounfour commit-SHA as a silent fix.** A commit-SHA pin
  inserted to make a typecheck pass, without a corresponding ADR
  selecting Posture 3a / 3b / 3c and reasoning about the
  semantic effect, is non-conforming.
- **Implicit acceptance of duplicate or conflicting Hounfour
  semantics.** A Dixie flip that introduces a duplicate Hounfour
  in the dependency tree without an explicit Posture 3c design
  is non-conforming. "It compiles" is not a substitute for an
  explicit isolation design.

Gate 3 is a **hard gate**, not optional follow-up. It applies
**independently** of Gate 1 and Gate 2.

### 5. Gate-of-gates rule

A future Dixie dependency-flip PR is **conforming** only if all
three of the following are simultaneously true at the time of
the PR:

1. **Gate 1 selected and implemented.** A reviewed Straylight-
   side ADR selects either Posture 1a (private + tag-pinned
   git-source consumption) or Posture 1b (un-private + GitHub
   Packages publishing). The package configuration on `main`
   reflects the selected posture unambiguously. Hybrid
   configurations are refused unless a later ADR explicitly
   reopens §2 above.
2. **Gate 2 tag / release event exists.** A reviewed Straylight
   release / tag event has been created and verified per the
   commands and constraints in §3 above. The Dixie flip PR
   cites the exact event.
3. **Gate 3 Hounfour-skew posture selected and action complete
   or explicitly isolated.** A reviewed posture from §4 (3a,
   3b, or 3c) is selected. Either the resolving action has
   landed (Posture 3a: Dixie bump merged; Posture 3b:
   Straylight Hounfour change merged) or the isolation design
   (Posture 3c) is reviewed and on file before the flip PR
   opens.

A flip PR that satisfies one or two of these conditions but not
all three is **non-conforming**. Reviewers may cite this ADR to
refuse the PR until the missing gate is resolved.

Gate resolution order is **not fixed**. The rule is a
**conjunction**, not a temporal sequence. Possible orderings
that all satisfy the gate-of-gates rule:

- Gate 1 → Gate 2 → Gate 3 → Dixie flip PR.
- Gate 3 → Gate 1 → Gate 2 → Dixie flip PR.
- Gate 1 → Gate 3 → Gate 2 → Dixie flip PR.
- Concurrent: Gate 1 and Gate 3 selected and implemented in
  parallel under separate review, then Gate 2 tag cuts, then
  Dixie flip PR.

The reviewing teammate decides the ordering at each phase
boundary; the binding constraint is that **the flip PR cites
all three gates and the citations are all valid at the time
the flip PR opens**.

### 6. Dixie flip protocol

The actual Dixie dependency flip is a **future Dixie-side PR**.
It is **not** authored by, bundled with, or merged as part of
any Straylight-side release / tag / publish phase. The
Dixie-side PR is reviewed under Dixie-side review process; the
Straylight side reviews only its own gate-satisfaction phases.

The future Dixie-side flip PR **must**:

- Cite ADR-024H by name and reference each of the three gate
  citations described in §5 above.
- Remain **type-only**. The flip replaces Dixie's local type
  mirrors with `import type { ... } from '@loa/straylight/host'`
  (and / or `import type { ... } from '@loa/straylight'`). It
  does **not** add value imports, runtime imports, dynamic
  `import()` calls, or `require()` calls against
  `@loa/straylight*`. Runtime widening requires a separate
  Straylight-side ADR per ADR-024G Decision rule §2.
- **Not** bundle endpoint changes, runtime route changes, new
  rendering surfaces, vector 9 / 10 / 11 widening, Hounfour
  `#116` adoption, `0xhoneyjar:straylight:*` adoption, public
  commitment-root behavior, or any runtime Straylight import
  into Dixie. Each of those is a separate change under separate
  review.

The Dixie-side flip PR **may**:

- Only replace Dixie local type mirrors with the approved
  type-only package consumption, after all three gates are
  satisfied.

A Dixie-side flip PR that bundles **any** of the refused changes,
or that opens before all three gates are satisfied, is
**non-conforming**. Reviewers may cite this ADR to refuse it.

### 7. Explicit non-scope

Phase 24I is **docs-only**. It does **not**:

- Modify [`../../package.json`](../../package.json).
- Modify [`../../package-lock.json`](../../package-lock.json).
- Modify [`../../tsconfig.json`](../../tsconfig.json) or
  [`../../tsconfig.build.json`](../../tsconfig.build.json).
- Modify any file under [`../../src/`](../../src/) (no edit to
  the wedge public surface; no edit to the host barrel; no
  re-export of the host barrel through the wedge public API).
- Modify any file under [`../../tests/`](../../tests/).
- Modify any file under [`../../dist-types/`](../../dist-types/).
- Modify any file under [`../../scripts/`](../../scripts/) or
  [`../../fixtures/`](../../fixtures/).
- Modify the Phase 5 stable public surface
  ([`../mvp/package-boundary.md`](../mvp/package-boundary.md)).
- Edit any prior ADR.
- Edit any prior handoff (other than the README index entry
  authored alongside this ADR).
- Edit any sibling repo (`loa-dixie`, `loa-finn`, `loa-freeside`,
  `loa-hounfour`).
- Create a release tag.
- Publish the package to any registry.
- Run `npm install` / `npm update` / `npm ci` / `npm publish`,
  or any other package-manager mutation command.
- Bump, downgrade, or reconcile the Hounfour dependency range.
- Consume Hounfour `main`, any unpublished commit, or any
  commit-SHA pin.
- File or edit any GitHub issue / comment / PR. No
  sibling-repo issue or PR action is taken.
- Request or run Flatline / Bridgebuilder / red-team review.
  Phase 24I makes no package-surface or source change; no
  multi-model adversarial review is warranted.
- Advance any ADR-022E gate, the Phase 19A pending feedback
  gate on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70),
  or any other deferred gate from the ADR-020 / ADR-022 / ADR-024
  series.
- Touch [`../../.loa`](../../.loa),
  [`../../.loa.config.yaml`](../../.loa.config.yaml),
  [`../../.claude/`](../../.claude/),
  [`../../.beads/`](../../.beads/),
  [`../../.run/`](../../.run/),
  [`../../.github/`](../../.github/),
  [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
  `node_modules/`.

### 8. Future-phase entry conditions

ADR-024H pins entry conditions for three future phases. Each
future phase **must** cite ADR-024H by name if it claims to
satisfy a gate.

**Release / tag execution phase entry conditions:**

1. ADR-024H merged on `main` under teammate review.
2. Phase 24I handoff merged on `main` under teammate review.
3. A Straylight-side opening ADR for the release / tag phase
   that **explicitly selects Posture 1a or Posture 1b** from §2
   above, and reasons about the five tradeoff axes named there,
   merged on `main` under teammate review before any
   package-level change lands.
4. The release / tag phase's implementation PR cites ADR-024H
   §3 and demonstrates that the verification commands and
   constraints there pass against the tagged tree.
5. No sibling-repo wiring in the same PR. A Dixie-side
   dependency flip, if it eventually happens, is a separate
   Dixie-side PR.

**Hounfour skew decision phase entry conditions:**

1. ADR-024H merged on `main` under teammate review.
2. Phase 24I handoff merged on `main` under teammate review.
3. A Straylight-side opening ADR (if Posture 3b is selected) or
   a Dixie-side opening doc (if Posture 3a is selected) or a
   joint design doc (if Posture 3c is selected) that
   **explicitly selects one of Posture 3a / 3b / 3c** from §4
   above, with reasoning on file before any code change lands.
4. The Hounfour skew decision phase's implementation PR cites
   ADR-024H §4 and demonstrates that the selected posture's
   refusal rules are honored (no Hounfour `main` /
   unpublished consumption; no commit-SHA silent fix; no
   implicit duplicate-Hounfour acceptance).
5. The phase may run in either repository depending on the
   selected posture; cross-repo coordination is documented in
   the opening doc.

**Dixie dependency flip phase entry conditions:**

1. ADR-024H merged on `main` under teammate review.
2. Phase 24I handoff merged on `main` under teammate review.
3. **Gate 1 satisfied:** the Straylight-side
   publish-posture-selecting ADR is merged on `main`, and the
   package configuration on `main` unambiguously reflects the
   selected posture.
4. **Gate 2 satisfied:** a Straylight release / tag event
   exists, has been verified per §3 above, and the Dixie flip
   PR cites the exact event.
5. **Gate 3 satisfied:** the Hounfour skew posture is selected
   and either implemented or explicitly isolated per §4 above.
6. The Dixie-side flip PR is opened in `loa-dixie`, cites
   ADR-024H by name, cites each of the three gate-satisfying
   events / ADRs, replaces Dixie local type mirrors with
   `import type` consumption only, and does **not** bundle any
   of the refused changes listed in §6 above.
7. Dixie-side review approves the flip PR independently of any
   Straylight-side review. Straylight reviewers do not
   pre-approve the flip; they only confirm the cited gate
   evidence is valid.

## Consequences

- **The remaining gates before a Dixie dependency flip are now
  enumerated and reviewable.** The flip is no longer "blocked on
  three deferred blockers" in vague form; the gates and their
  refusal rules are pinned by this ADR and may be cited by
  reviewers.
- **A future Dixie flip PR has a concrete conformance check.**
  Reviewers (Dixie-side or Straylight-side observers) can cite
  ADR-024H §5 and ask "which release/tag event satisfies Gate
  2? which publish-posture ADR satisfies Gate 1? which Hounfour
  skew posture satisfies Gate 3?" — a flip PR that cannot answer
  all three is refused on its face.
- **Gate resolution order is not pre-committed.** The next
  Straylight-side or Dixie-side phase may legitimately resolve
  any of the three gates first. The binding rule is the
  conjunction at flip time, not the temporal sequence.
- **Dixie PR #96 remains the correct transitional seam.**
  Phase 24I does not flip Dixie's dependency. The local
  adapter mirrors stay correct as the pre-consumption boundary,
  subject to the upstream-side discussion discipline already
  pinned by ADR-024F §"Decision" rule §3.
- **Phase 24H type-consumability remains intact.**
  `@loa/straylight/host` is consumable for type-only imports
  by an in-repo or out-of-repo consumer that respects the
  Phase 24H supported-consumer envelope (TypeScript >= 5.4;
  `moduleResolution: "Bundler"` or `"NodeNext"`; `import type`
  only; tag- / release-pinned git source). Phase 24I does not
  widen, narrow, or otherwise alter that envelope.
- **No silent gate satisfaction.** A future phase that lands a
  release tag without an ADR selecting Posture 1a or 1b
  satisfies neither Gate 1 nor Gate 2. A future phase that bumps
  the Hounfour range without selecting Posture 3a / 3b / 3c
  satisfies neither Gate 3 nor any other gate. The ADR is the
  load-bearing artifact, not the code change.
- **ADR-024H is additive to ADR-024G.** It does not supersede
  ADR-024G; it records the gates that still stand after
  ADR-024G executed the declaration-only / type-only widening.
  Reopening ADR-024G reopens this ADR; reopening ADR-024F
  reopens both.

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
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (read-only — Phase 24I does not edit it)
- [`../handoffs/phase-24h-host-package-subpath-implementation.md`](../handoffs/phase-24h-host-package-subpath-implementation.md) (read-only — Phase 24I does not edit it)
- [`../handoffs/phase-24g-host-package-consumption-readiness-plan.md`](../handoffs/phase-24g-host-package-consumption-readiness-plan.md) (read-only — Phase 24I does not edit it)
- [`../handoffs/phase-24f-dixie-host-issue-draft.md`](../handoffs/phase-24f-dixie-host-issue-draft.md) (read-only — Phase 24I does not edit it)
- [`../handoffs/phase-24e-dixie-host-handoff-packet.md`](../handoffs/phase-24e-dixie-host-handoff-packet.md) (read-only — Phase 24I does not edit it)
- [`../handoffs/phase-24d-host-scaffold-hardening.md`](../handoffs/phase-24d-host-scaffold-hardening.md) (read-only — Phase 24I does not edit it)
- [`../handoffs/phase-24c-dixie-recall-host-scaffold.md`](../handoffs/phase-24c-dixie-recall-host-scaffold.md) (read-only — Phase 24I does not edit it)
- [`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md) (read-only — Phase 24I does not edit it)
- [`../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md`](../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md) (read-only — Phase 24I does not edit it)
- [`../../package.json`](../../package.json) (read-only — Phase 24I does not edit it)
- [`../../tsconfig.json`](../../tsconfig.json) (read-only — Phase 24I does not edit it)
- [`../../tsconfig.build.json`](../../tsconfig.build.json) (read-only — Phase 24I does not edit it)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (read-only — wedge public surface, unchanged by Phase 24I)
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) (read-only — host barrel, unchanged by Phase 24I)
- [`../../dist-types/`](../../dist-types/) (read-only — committed declaration emit, unchanged by Phase 24I)
