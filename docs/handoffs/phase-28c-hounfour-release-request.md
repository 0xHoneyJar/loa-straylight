# Phase 28C — Hounfour release request (draft)

> **Status:** Draft only. **Not** filed by Phase 28C. Paste-ready
> for a future operator-driven filing event on `loa-hounfour`
> (issue / PR / release discussion thread of the maintainer's
> choosing). Phase 28C creates this draft as a docs-only
> artifact alongside
> [`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md).
> Phase 28C **does not authorize** any Straylight code change,
> any Hounfour dependency bump, any vendoring of the Hounfour
> `recall-wedge` vector corpus into the Straylight tree, any
> ADR-022E gate firing, any sibling-repo edit, or any tag /
> release / publish.

## Summary

The Loa-Straylight wedge has a planned, **bounded** Track 1
follow-up (one new Vitest file under `tests/`, optionally one
new fixture pointer file under `fixtures/hounfour-conformance/`,
no public-surface change, no allowlist delta, no `$id` adoption,
no Hounfour dependency bump beyond an exact-tag pin) that would
consume the five `recall-wedge` conformance-vector JSON files
shipped by Hounfour PR #116 as Vitest test inputs. The Track 1
PR is sketched in
[`../decisions/ADR-027B-PrivateAlias-successor-plan.md`](../decisions/ADR-027B-PrivateAlias-successor-plan.md)
§"Decision" §3 and bounded by §"Decision" §8.

The Track 1 PR is currently **blocked**: the five vectors (and
the rest of the composition-contract artifacts shipped by
Hounfour PR #116) exist on `loa-hounfour` `origin/main` /
`c06ef1ba` only, and are **not** present in any published,
tagged, resolvable `@0xhoneyjar/loa-hounfour` release available
to Straylight today.

This draft requests that a future Hounfour-side maintainer-
driven release publish a tagged `@0xhoneyjar/loa-hounfour`
release whose tarball contains the Recall Wedge composition-
contract artifacts at paths the published package's own
`exports` map or shipped on-disk layout makes available.

This draft requests **only** a release of artifacts already
merged to `loa-hounfour` `origin/main` via PR #116. It does
**not** request any new shape, any new domain `$id`, any new
JS subpath, any new TS public symbol, any runtime
implementation, any Finn-side change, any Dixie-side change,
or any Straylight code.

## Why this matters for Straylight

Per
[`../decisions/ADR-027B-PrivateAlias-successor-plan.md`](../decisions/ADR-027B-PrivateAlias-successor-plan.md)
§"Decision" §8.b, the future Track 1 code PR's dependency
posture row admits exactly two release-side outcomes:

- (i) A published, tagged, resolvable
  `@0xhoneyjar/loa-hounfour` release that contains the vectors
  at a path the published package's own `exports` map or
  shipped on-disk layout makes available, after which the
  future PR may pin to that **exact tag** (no range widening;
  exact tag only); **or**
- (ii) A separate first-class successor ADR that authorizes
  vendoring the vector JSON contents into the Straylight tree
  under its own §4.d evidence.

Phase 28C's
[`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md)
**explicitly does not propose vendoring** and does **not**
pre-approve a vendoring ADR. Outcome (i) is therefore the
required path forward, and this release request is the
Hounfour-side ask that would make outcome (i) achievable.

## What the release evidence inventory looks like today (as of Phase 28C)

| # | Probe | Result |
|---|---|---|
| A | `loa-hounfour` `origin/main` HEAD | `c06ef1ba` (Hounfour PR #116 merge — "Add Straylight Recall Wedge composition contracts"). |
| B | Local `v8.7.x` tag inventory on `loa-hounfour` | None present. |
| C | `npm view @0xhoneyjar/loa-hounfour versions --registry=https://npm.pkg.github.com` | `[ '8.4.0', '8.5.0', '8.5.1', '8.5.2', '8.6.0' ]`. |
| D | `npm view @0xhoneyjar/loa-hounfour@8.7.0 dist.tarball --registry=https://npm.pkg.github.com` | 404 / "no match found". |
| E | Recall Wedge composition-contract artifacts in resolved `@0xhoneyjar/loa-hounfour@8.6.0` package | Not present (introduced in PR #116, after the `8.6.0` cut). |

Hounfour `origin/main` / `c06ef1ba` is **not** ADR-027A
§"Decision" §4.a release evidence. A `package.json` `version`
field on an untagged commit is **not** a registry-published tag.
The Straylight Track 1 PR cannot pin to an unpublished
`@0xhoneyjar/loa-hounfour@8.7.0`.

## What is requested

A future Hounfour-side maintainer-driven release that satisfies
the following — at the Hounfour maintainer's discretion as to
the exact tag value, release notes, semver classification, and
release process — **and** the Hounfour maintainer's confirmation
that the published tarball contains each of the listed paths.

Phase 28C has no opinion on the Hounfour-side release process,
release-tagging convention, semver bump, branch strategy,
release-notes style, or whether the release rolls additional
unrelated Hounfour fixes; it asks only that the artifacts
already merged via Hounfour PR #116 become **resolvable** from
the GitHub Packages registry.

### Required tarball contents (please confirm presence at these paths)

The published tarball, when extracted under the standard npm
install layout (`node_modules/@0xhoneyjar/loa-hounfour/`),
should contain each of the following at the indicated path:

- `vectors/conformance/recall-wedge/README.md`
- `vectors/conformance/recall-wedge/assertion-admitted.json`
- `vectors/conformance/recall-wedge/recall-request.json`
- `vectors/conformance/recall-wedge/recall-pack.json`
- `vectors/conformance/recall-wedge/recall-receipt.json`
- `vectors/conformance/recall-wedge/commitment-root.json`
- `schemas/conformance-vector.schema.json` (the envelope schema
  for conformance vectors themselves, generated as part of
  Hounfour PR #116)
- `docs/architecture/recall-wedge-composition.md` **only if**
  Hounfour's release convention includes architecture docs in
  the published tarball. If Hounfour's release convention
  excludes `docs/` from tarballs, this doc is acceptable
  in-repo only on the tagged commit, and Straylight does not
  require its presence inside the tarball.
- Any release-integrity / `dist/` / stub / parity artifacts
  that Hounfour's normal release convention produces for a
  release of this class (e.g., the `npm run check:release-
  integrity-parity` lane noted by the Phase 28A in-repo audit
  evidence in
  [`../decisions/ADR-027B-Fire-hounfour-composition-contracts.md`](../decisions/ADR-027B-Fire-hounfour-composition-contracts.md)
  §"Decision" §5). Phase 28C does not redefine Hounfour's
  release convention; it asks only that whatever convention
  Hounfour normally applies has been applied.

The maintainer's confirmation (a comment, a release-note line,
a checked-in artifact, or an `npm pack --dry-run` listing — at
the maintainer's discretion) that each of the above paths is
present in the published tarball is the evidence the future
Straylight Track 1 PR needs to cite per
[`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md)
§"Decision" §5.c.

### Required registry resolvability

After publish, the following commands (run from the Straylight
working tree's npm registry posture) should both succeed and
return the new tag:

```bash
npm view @0xhoneyjar/loa-hounfour versions \
  --registry=https://npm.pkg.github.com
# expected: the previous list plus the new tag

npm view @0xhoneyjar/loa-hounfour@<new-tag> dist.tarball \
  --registry=https://npm.pkg.github.com
# expected: a non-404 tarball URL
```

If the Hounfour release convention publishes to additional
registries (e.g., the public npm registry), Straylight has no
opinion; Straylight resolves through GitHub Packages today, and
GitHub Packages resolvability is the load-bearing requirement.

### What this request is NOT

Reviewers may cite this section verbatim to refuse a
Hounfour-side PR or release that treats this request as
authority for any of the following:

- **Not** a request for any new Hounfour-published canonical
  shape (no new `$id`, no new JS subpath, no new TS public
  symbol). The release request is **composition-substrate-
  only** — i.e., it requests resolvability for the artifacts
  ADR-027B-Fire §"Decision" §2 already classified as
  composition substrate, **not** as shape adoption.
- **Not** a request for runtime implementation, signature
  verification, hash verification, audit-chain enforcement,
  policy execution, storage adapter, recall execution, or
  any new endpoint on either side.
- **Not** a request for any Finn-side change (Finn enforcement
  remains gated by ADR-027C; Straylight Phase 28C does not
  authorize Finn work).
- **Not** a request for any Dixie-side change. No re-open of
  `loa-dixie` PR #102, no second Dixie endpoint, no second
  runtime subpath.
- **Not** a request for Straylight code. The Straylight Track 1
  follow-up PR remains separately gated by §4.d (pre-merge
  real 3-model Flatline + Bridgebuilder) per ADR-027B-
  PrivateAlias-successor-plan §"Decision" §6 and is independent
  of this release request.
- **Not** a request for vendoring. Vendoring requires a
  separate first-class successor ADR with its own §4.d
  evidence; Phase 28C does not propose one and does not
  pre-approve one.
- **Not** a request that fires any ADR-022E gate (#1, #2, #3,
  #4, #5, #17, #18 all remain **HELD** under Phase 28C; the
  composition-substrate release does not satisfy any gate's
  trigger conjunction by itself).
- **Not** an authorization for a new `@0xhoneyjar/loa-hounfour`
  range in [`../../package.json`](../../package.json). After
  the release lands, the future Straylight Track 1 PR may pin
  to the **exact tag** under a separate first-class authorizing
  event (the Track 1 PR itself, with its own §4.d). No range
  widening is permitted (per ADR-027B-PrivateAlias-successor-
  plan §"Decision" §8.d).

### What Straylight will do once the release lands

Straylight will treat the published tag and tarball as the
ADR-027A §"Decision" §4.a release evidence required by
[`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md)
§"Decision" §5. The release alone does **not** open the future
Track 1 code PR; opening that PR requires the Loa control-plane
substrate to be sufficiently restored to run the §4.d gate
(real 3-model Flatline + Bridgebuilder) on:

1. ADR-027B-PrivateAlias-successor-plan's own merger (its §4.d
   row remains currently unsatisfied per Phase 28B); **and**
2. The future Track 1 code PR's own merger (its §4.d row is
   independently inherited under
   [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
   §"Decision" §3).

Until both gates are satisfied, the future Track 1 code PR
remains blocked even after the release evidence lands.

## Citations

- [`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md)
  — Phase 28C release / vector-access gate (this draft's
  authorizing in-repo doc).
- [`../decisions/ADR-027B-PrivateAlias-successor-plan.md`](../decisions/ADR-027B-PrivateAlias-successor-plan.md)
  §"Decision" §3 / §8 / §10.a — the future Track 1 code PR's
  shape, dependency posture, and vector-accessibility audit.
- [`../decisions/ADR-027B-Fire-hounfour-composition-contracts.md`](../decisions/ADR-027B-Fire-hounfour-composition-contracts.md)
  §"Decision" §2 / §5 — Phase 28A in-repo audit evidence for
  Hounfour PR #116 / origin/main `c06ef1ba`; the canonical list
  of composition-contract artifacts.
- [`../decisions/ADR-027A-post-dixie-return-gate.md`](../decisions/ADR-027A-post-dixie-return-gate.md)
  §"Decision" §4.a — the release-evidence posture
  ("published, tagged, resolvable").
- [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
  §"Decision" §3 / §6.Forbidden — first-class vs second-class
  doc classes; the not-authority list.
- [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — gate inventory; none fired by Phase 28C.

## Filing posture

This draft is **not** filed by Phase 28C. Filing the request as
a `loa-hounfour` issue / PR comment / release discussion
thread is a separate operator-driven event under the operator's
own read-only / discretion posture, after the operator decides
the time is right and the substrate state allows them to weigh
the maintainer response as audit evidence. Phase 28C's role is
to produce the paste-ready text and the in-repo evidence
record; it does not edit the sibling repo, file an issue, open
a PR, or post a comment.
