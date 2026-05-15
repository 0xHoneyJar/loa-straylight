# ADR-024C — Package-release ambiguity discipline (decision-lock for Phase 24A)

## Status

Accepted-for-Phase-24A.

This ADR is a Phase 24A docs-only decision-lock. It records the
**package-release ambiguity** introduced by Hounfour PR #116 —
`main` may include #116 before a GitHub Packages release exists
that publishes the #116 outputs — and pins the discipline that
governs how Straylight consumes Hounfour across that gap. It does
**not** change `package.json` or `package-lock.json`, does **not**
flip any import, does **not** add a Hounfour git-source or
unpublished-commit dependency, and does **not** authorize
consumption from Hounfour `main`.

## Context

Hounfour PR #116
([`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md))
merged to Hounfour `main` and added Hounfour-side substrate
(registered `0xhoneyjar:straylight:*` audit-event prefix family;
registered `recall-wedge` as a conformance category; added
`docs/architecture/recall-wedge-composition.md` upstream; added
the five-step recall-wedge conformance corpus; added the recall-
wedge vector tests; regenerated the upstream `schema/dist/release-
integrity` outputs). The merge is upstream substrate; the package-
release event is a **separate**, downstream gate.

At Phase 24A entry:

- Straylight consumes
  `@0xhoneyjar/loa-hounfour@^8.6.0`, resolved patch `8.6.0`
  (Phase 21A; commit `4f31b14`; preserved by Phase 21B / 22A /
  23A).
- The published release `8.6.0` does **not** include the #116
  outputs. The #116 outputs (registered prefix family, registered
  conformance category, five-step corpus, vector tests,
  regenerated dist) exist on Hounfour `main` but have not been
  published to GitHub Packages under any release tag.
- No release notes / changelog entry / package version has been
  published that names #116. No tag has been observed cutting a
  release whose `dist/` includes the #116 outputs.

Three downstream-consumption patterns could in principle close
the gap, and Phase 24A explicitly refuses all three:

1. **Pinning to Hounfour `main`** (e.g.
   `@0xhoneyjar/loa-hounfour@github:0xHoneyJar/loa-hounfour#main`)
   — refused. The contract Straylight relies on is the *published
   release*. `main` is mutable and bypasses the npm publish step
   that produces the auditable `dist/`.
2. **Pinning to an unpublished commit SHA** (e.g.
   `@0xhoneyjar/loa-hounfour@github:0xHoneyJar/loa-hounfour#<sha>`)
   — refused. Same reasoning: the audit surface is the published
   release, not a commit reference.
3. **Reaching into Hounfour `dist/` paths that only exist on
   `main`** (or running Hounfour build outputs that exist only in
   a working tree) — refused. Phase 17B / 18 / 21A / 21B forbid
   reaching into unexported Hounfour internals; that constraint is
   reaffirmed for Phase 24A and applied to "internals that only
   exist on `main`" as well.

The discipline this ADR pins is the single rule that closes all
three off: **Straylight consumes only published GitHub Packages
releases of `@0xhoneyjar/loa-hounfour`.**

Two related deferrals carry forward:

- ADR-022E gate #1 (`EstateTransition` schema absence; delta #8
  still queued) — unchanged by #116; #116 ships no
  `EstateTransition` schema.
- ADR-022E gate #2 (`safeCanonicalize` exported subpath absent;
  gate `no-confirmed-subpath`) — unchanged by #116; #116
  declares no new `./canonicalize` / `./utilities` subpath.

## Decision

1. **Straylight consumes only published GitHub Packages releases
   of `@0xhoneyjar/loa-hounfour`.** The `package.json` dependency
   declaration is the only authoritative consumption path. The
   currently-pinned range is `^8.6.0`; the currently-resolved
   patch is `8.6.0`.

2. **Hounfour `main` is not a consumable artifact.** No
   `package.json` change pins `main`. No `npm install` invocation
   targets `main` or any commit SHA. No script reaches into a
   Hounfour-side working-tree path that only exists on `main`.

3. **No git-source or unpublished-commit dependency is
   permitted.** `@0xhoneyjar/loa-hounfour@github:...` /
   `@0xhoneyjar/loa-hounfour@git+https://...` / any other
   non-npm-registry dependency form is rejected. The published
   `@0xhoneyjar/loa-hounfour@<semver>` is the only authoritative
   pin.

4. **Hounfour #116 outputs are upstream substrate, not Straylight
   runtime substrate, until a release publishes them.** Per
   ADR-024A
   ([`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)),
   the registered `0xhoneyjar:straylight:*` prefix family, the
   registered `recall-wedge` conformance category, the five-step
   conformance corpus, and the vector tests are *substrate
   available for adoption*. They become *consumable* when a
   published release of `@0xhoneyjar/loa-hounfour` carries them
   in `dist/`.

5. **Adopting the #116 outputs requires three independent
   events.** All three are downstream of Phase 24A and out of
   scope here:

   - **Event A: Hounfour publishes a release** that includes the
     #116 outputs (e.g. `8.6.x` patch, `8.7.0` minor, or higher),
     observable as a tag on `loa-hounfour`, a GitHub Packages
     publish event, and a `dist/` that includes the registered
     audit-event prefix family + conformance category outputs.
   - **Event B: a Straylight ADR** explicitly adopts the new
     release range (e.g. an ADR that supersedes ADR-024C and
     authorizes bumping the `package.json` dependency from
     `^8.6.0` to `^8.7.0` or to a patched `^8.6.x`). The ADR
     must cite the release tag, the published `$id`s, and the
     boundary preservation tests it preserves.
   - **Event C: a Phase-24B-or-later shadow-integration check**
     against the new release (in the style of Phase 17B /
     Phase 21A) inspects the actually-shipped surface and
     records findings before any wedge import flip.

   Each event is necessary; none is sufficient. ADR-024C does
   not pre-authorize any of them.

6. **Phase 24A authors no Hounfour-side change.** Phase 24A does
   not file a Hounfour-side issue or PR asking for a release.
   Phase 24A does not file a status comment on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
   or on any other Hounfour-side issue. Whether to file a
   coordination signal asking when (or whether) the #116 outputs
   will be released is a **future, separate, human-reviewed
   event** under Eileen / teammate review; Phase 24A does not
   draft or file such a signal.

7. **Phase 24A leaves the dependency range unchanged.** The
   `package.json` declaration `@0xhoneyjar/loa-hounfour@^8.6.0`
   stays in place. The `package-lock.json` `resolved` patch
   `8.6.0` stays in place. No `npm install`, no `npm update`, no
   manual edit to either file.

## Consequences

- Any Phase 24B+ branch that proposes to bump the Hounfour
  dependency range must cite (Event A) the release tag, (Event B)
  a superseding ADR, and (Event C) a shadow-integration check.
  No bump on the strength of "the outputs exist on `main`" alone.
- Reviewers should reject any PR that:
  - Pins `@0xhoneyjar/loa-hounfour` to a `main` branch, a commit
    SHA, a git-source URL, or any non-npm-registry form.
  - Imports a Hounfour `dist/` path that only exists on `main`
    or in a working-tree build.
  - Adds a new `npm` script that fetches Hounfour from anywhere
    other than the configured registry.
  - Adopts the `0xhoneyjar:straylight:*` prefix family into the
    Straylight public surface on the strength of #116's upstream
    registration alone.
  - Adopts the `recall-wedge` conformance category into the
    Straylight test suite on the strength of #116's upstream
    registration alone.
  - Imports the five-step conformance corpus from a Hounfour
    working-tree path.
  - Cites #116 to justify any of the above.
- The discipline preserves the existing audit surface (Phase 16
  shadow-integration framework; Phase 21A v8.6.0 intake; Phase 23A
  schema-contract draft) unchanged. No part of that surface needs
  to be re-derived against Hounfour `main`.
- ADR-024D
  ([`./ADR-024D-phase-24b-implementation-branch.md`](./ADR-024D-phase-24b-implementation-branch.md))
  inherits this discipline and applies it to the Phase 24B
  implementation branch's allowable scope. ADR-024B
  ([`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md))
  pins the Dixie-first host placement that ADR-024D scopes.

## Why this is "release-only", not "release-preferred"

A "release-preferred" rule (with `main` as a fallback "if
release lags") would silently legitimize pinning to `main` under
schedule pressure. The audit surface Straylight maintains —
Phase 16 / 17B / 18 / 21A shadow-integration evidence, Phase 22A /
23A / 24A decision-lock packets — assumes the upstream contract
is the published `$id`s under
`https://schemas.0xhoneyjar.com/loa-hounfour/<version>/` and the
published `exports` map. `main` does not produce a `$id` namespace
or a stable `exports` map; consuming it inverts the substrate
relationship ADR-020C / ADR-022C pin.

The release-only rule is therefore non-negotiable. It is
preserved through ADR-024C even at the cost of waiting for a
Hounfour release after #116 merged.

## Non-scope (Phase 24A)

- No `package.json` change. The Hounfour dependency range stays
  `^8.6.0`.
- No `package-lock.json` change. The Hounfour resolved patch
  stays `8.6.0`.
- No `npm install`, `npm update`, `npm ci`, or
  `npm config set` invocation.
- No `.npmrc` change.
- No Hounfour `main` consumption. No commit SHA pin. No git-
  source dependency. No Hounfour `dist/` path import that only
  exists on `main`.
- No Hounfour-side issue / comment / PR filed by Phase 24A.
- No coordination signal drafted asking for a Hounfour release.
- No adoption of the `0xhoneyjar:straylight:*` prefix family
  into the Straylight public surface.
- No adoption of the `recall-wedge` conformance category into
  the Straylight test suite.
- No import of the Hounfour five-step conformance corpus from a
  working-tree path.
- No edit to any sibling repo.
- No `src/` / `tests/` / `scripts/` / `fixtures/` changes.
- No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
  edits.
- No commit, no push, no PR.

## Source files inspected

- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)
- [`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md)
- [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md)
- [`../handoffs/hounfour-adaptation-delta.md`](../handoffs/hounfour-adaptation-delta.md)
- [`../handoffs/hounfour-rc-shadow-integration-checklist.md`](../handoffs/hounfour-rc-shadow-integration-checklist.md)
- [`../handoffs/hounfour-shadow-integration-findings.md`](../handoffs/hounfour-shadow-integration-findings.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
- [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md)
- [`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md)
- [`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md)
- `package.json` (unchanged by Phase 24A; range `^8.6.0`)
- `package-lock.json` (unchanged by Phase 24A; resolved `8.6.0`)
