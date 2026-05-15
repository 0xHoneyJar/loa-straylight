# Hounfour PR #116 merge intake (Phase 24A)

> Status: Phase 24A. **Docs-only per-component intake of an
> upstream Hounfour event, in `loa-straylight`.** This document
> records the merge of
> [`0xHoneyJar/loa-hounfour#116`](https://github.com/0xHoneyJar/loa-hounfour/pull/116)
> to Hounfour `main`, summarizes what #116 added on the Hounfour
> side, preserves the Hounfour boundary note (#116 is schema /
> protocol / conformance only — no Straylight runtime behavior,
> no endpoints, no Dixie / Finn / Freeside wiring, no package /
> version changes, no Hounfour exports), updates the Hounfour
> dependency / status ledger, and records the package-release
> ambiguity (Hounfour `main` may include #116 before a GitHub
> Packages release exists that publishes the #116 outputs).
>
> Phase 24A is **not** Hounfour integration. It does **not** flip
> any wedge import, change `package.json` / `package-lock.json`,
> change the Hounfour dependency range or resolved patch, modify
> [`../../src/straylight/`](../../src/straylight/), modify
> [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify
> [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> modify any script under [`../../scripts/`](../../scripts/), wire
> Finn / Dixie / Freeside runtime, add a Dixie endpoint, add a
> Finn endpoint, edit any sibling repo, implement `Challenge`
> locally, implement `EstateTransition` locally, reach into
> unexported Hounfour internals, add a `safeCanonicalize` subpath
> import, publish a public commitment root, add a network
> surface, change persistence, add or modify any test, add or
> modify any fixture, author any TypeBox / JSON Schema, **file**
> any GitHub issue or comment, or touch
> `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`. It
> does **not** commit and does **not** open a PR. The actual
> Phase 24A PR is a separate, future event under teammate review.
>
> Companion docs (the Phase 24A summary handoff that builds on
> this intake, the four Phase 24A ADRs the intake feeds, and the
> prior Hounfour-intake precedents):
> [`phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md),
> [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md),
> [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md),
> [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md),
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md),
> [`hounfour-response-intake.md`](./hounfour-response-intake.md),
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
> [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md),
> [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md),
> [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md),
> [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt),
> [`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md),
> [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md),
> [`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md),
> [`phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md).

## Event

Hounfour pull request
[`0xHoneyJar/loa-hounfour#116`](https://github.com/0xHoneyJar/loa-hounfour/pull/116)
merged to `loa-hounfour` `main`. The merge is an **upstream
substrate event**: Hounfour shipped the conformance / contract
substrate that lets Hounfour-side validators recognize the
Straylight Recall Wedge audit-event prefix family and conformance
category, plus a conformance corpus and vector tests that
exercise the recognition.

The merge is **not** a Straylight-side event. It does not import
into `loa-straylight`. It does not add a Straylight runtime
endpoint. It does not flip the wedge import. It does not modify
any sibling-repo runtime. It does not bump a package version. It
does not adopt any Hounfour symbol into the Straylight public
surface.

The merge is **not** a GitHub Packages release. The #116 outputs
exist on Hounfour `main` and may or may not have been published
under any release tag at the time Phase 24A intakes the event.
The package-release ambiguity this creates is recorded under
"Package-release ambiguity" below and disciplined under ADR-024C
([`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md)).

## What #116 added (per-component)

The six components #116 added on the Hounfour side, each restated
narrowly so a Straylight reviewer can verify the intake without
re-reading the Hounfour PR:

### 1. Registered `0xhoneyjar:straylight:*` audit-event prefix family

#116 registered the `0xhoneyjar:straylight:*` audit-event prefix
family on the Hounfour side. The prefix family names the
Straylight semantic class. Registering it upstream enables
Hounfour-side validators to recognize the prefix; it does **not**
transfer ownership of the prefix's semantics to Hounfour. Per
ADR-024A, the prefix is Straylight-owned even though it is
registered upstream.

Straylight-side implication: **none in Phase 24A**. No
Straylight-side adoption is performed. No `loa-straylight` source
/ test / fixture / script change. The prefix continues to be
defined by Straylight as a semantic class.

### 2. Registered `recall-wedge` as a conformance category

#116 registered `recall-wedge` as a conformance category on the
Hounfour side. The category names the Straylight Recall Wedge
MVP conformance map. Registering the category upstream creates
a slot Hounfour can validate *against* the Straylight definition;
it does **not** transfer authorship of the category's lane
structure (`class_validation` / `policy_validation` /
`audit_validation` / `keyring_validation`), per-object minimum
required fields, or per-vector expected outcomes to Hounfour.
Per ADR-024A and the Phase 23A schema-contract draft
([`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md))
and conformance-vector matrix
([`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)),
the wedge MVP defines the lanes and the per-object / per-vector
contract; Hounfour validates against the Straylight contract.

Straylight-side implication: **none in Phase 24A**. The Phase 23A
eleven-vector matrix remains the load-bearing Straylight-side
conformance map. No category adoption into the Straylight test
suite. No new `loa-straylight` test / fixture.

### 3. Added `docs/architecture/recall-wedge-composition.md` upstream

#116 added a new architecture document on the Hounfour side under
`docs/architecture/recall-wedge-composition.md` that describes
the Hounfour-side composition of the recall-wedge conformance
category — i.e. how Hounfour's validators compose to recognize
the `0xhoneyjar:straylight:*` prefix family and the recall-wedge
conformance category. The document is Hounfour-side architecture
about Hounfour-side validators; it is **not** a Straylight
architecture document.

Straylight-side implication: **none in Phase 24A**. The
Straylight architecture document
([`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md))
is unchanged and remains the Straylight-side semantic / product
architecture home per ADR 0001 / ADR-020A / ADR-022A / ADR-024A.
The Hounfour-side composition doc is read-only reference
material; Phase 24A does not import from it, copy from it, or
adopt it.

### 4. Added the five-step recall-wedge conformance corpus

#116 added a five-step conformance corpus on the Hounfour side
that exercises the registered `recall-wedge` conformance
category. The corpus runs inside Hounfour's test suite,
regenerates Hounfour's `schema/dist/release-integrity` outputs,
and proves the Hounfour validators behave consistently against
the corpus.

The corpus is **upstream test substrate**. It is **not**
Straylight runtime substrate. The Phase 23A eleven-vector
Straylight-side conformance matrix is the Straylight-side
companion; the two are coordinate (each lives in its own repo,
each is validated against in its own repo), not subordinate
(Phase 24A does not promote one to the other's authority).

Straylight-side implication: **none in Phase 24A**. The Phase 23A
matrix continues to enumerate the Straylight-side vectors. No
import from the Hounfour-side corpus. No copy. No adoption.

### 5. Added the recall-wedge vector tests

#116 added vector tests on the Hounfour side that exercise the
five-step conformance corpus against the Hounfour-side
validators. The tests are part of the Hounfour test suite; they
are not part of the Straylight test suite.

Straylight-side implication: **none in Phase 24A**. The
Straylight test suite under
[`../../tests/`](../../tests/) is unchanged. No new
`loa-straylight` test imports from the Hounfour-side vector
tests. No Straylight-side test file is renamed, removed, or
edited.

### 6. Regenerated `schema/dist/release-integrity` outputs

#116 regenerated the Hounfour-side `schema/dist/release-integrity`
outputs to incorporate the registered prefix family, the
registered conformance category, and the conformance-corpus
outputs. The regenerated outputs are the Hounfour-side `dist/`
artifacts that a published Hounfour release would carry — but
they are regenerated **on Hounfour `main`**, not on a published
release.

The package-release ambiguity this creates is the load-bearing
intake delta of Phase 24A. It is recorded below under
"Package-release ambiguity".

Straylight-side implication: **none in Phase 24A**. Straylight
does not reach into Hounfour `dist/` paths on `main`; no
`loa-straylight` import targets a Hounfour-side `dist/` path that
only exists on `main`. Per Phase 17B / 18 / 21A / 21B, reaching
into unexported Hounfour internals is forbidden; that constraint
is reaffirmed by ADR-024A and extended to "internals that only
exist on `main`" by ADR-024C.

## Hounfour boundary preservation (#116 explicit non-scope)

Per the Hounfour-side scope of #116:

- **No Straylight runtime behavior implemented upstream.** #116
  does not author any Straylight runtime, does not add any
  Straylight endpoint, does not wire Dixie / Finn / Freeside.
- **No Hounfour `exports` map change to declare `Straylight`
  primitives.** The Straylight primitives (`Actor`, `Estate`,
  `Assertion`, `Keyring`, `Policy`, `Transition`,
  `RecallRequest`, `RecallPack`, `RecallReceipt`, `Challenge`,
  `Revocation`, `Commitment`, `AuditEvent`) are unchanged in
  ownership; Hounfour does not add a Straylight-named export.
- **No Hounfour package / version change inside `loa-straylight`.**
  Phase 24A does not bump the dependency range or resolved patch.
- **No `EstateTransition` schema** authored upstream. ADR-022E
  gate #1 unchanged.
- **No `safeCanonicalize` exported subpath** declared upstream.
  ADR-022E gate #2 unchanged.
- **No `AuditEvent` schema under that name** authored upstream.
  ADR-022E gate #5 unchanged.
- **No Straylight-side adoption** triggered by upstream
  registration. The audit-event prefix family is registered
  upstream; the wedge does not adopt it into its public surface.
  The conformance category is registered upstream; the wedge
  does not adopt it into its test suite.

#116 is therefore a **substrate** event on the Hounfour side
only. Treat it as merged substrate, **not** finished MVP.

## Hounfour dependency / status ledger (updated)

The single in-repo ledger of the Hounfour dependency and the
Hounfour-side substrate status, updated for Phase 24A:

| # | Item | Phase 23A state | Phase 24A state (after #116 merge) |
|---|---|---|---|
| 1 | `package.json` dependency declaration | `@0xhoneyjar/loa-hounfour@^8.6.0` | `@0xhoneyjar/loa-hounfour@^8.6.0` *(unchanged)* |
| 2 | `package-lock.json` resolved patch | `8.6.0` | `8.6.0` *(unchanged)* |
| 3 | Hounfour `main` includes #116 | No | **Yes** *(#116 merged)* |
| 4 | A GitHub Packages release exists that publishes #116 outputs | N/A | **Unknown / not yet observed** *(see "Package-release ambiguity" below)* |
| 5 | `Challenge` schema upstream | Shipped at v8.6.0; not adopted | Shipped at v8.6.0; not adopted *(unchanged)* |
| 6 | `EstateTransition` schema upstream (delta #8) | Absent | Absent *(unchanged; not authored by #116)* |
| 7 | `safeCanonicalize` exported subpath upstream | Undeclared | Undeclared *(unchanged; not declared by #116)* |
| 8 | `audit-event` schema upstream (under that name) | Absent | Absent *(unchanged; not authored by #116)* |
| 9 | `0xhoneyjar:straylight:*` audit-event prefix family registered upstream | No | **Yes** *(registered by #116; Straylight-owned per ADR-024A)* |
| 10 | `recall-wedge` conformance category registered upstream | No | **Yes** *(registered by #116; Straylight-defined per ADR-024A)* |
| 11 | Hounfour-side recall-wedge composition doc exists | No | **Yes** *(at `docs/architecture/recall-wedge-composition.md` upstream)* |
| 12 | Hounfour-side five-step recall-wedge conformance corpus exists | No | **Yes** *(upstream test substrate; not consumed by Straylight)* |
| 13 | Hounfour-side recall-wedge vector tests exist | No | **Yes** *(upstream test asset; not imported by Straylight)* |
| 14 | Hounfour-side `schema/dist/release-integrity` regenerated | At v8.6.0 baseline | **Regenerated on `main`** *(not yet published under a release tag; gated by ADR-024C)* |
| 15 | Phase 19A pending feedback gate on issue #70 | Pending; status comment filed by user before Phase 23A | Pending; no substantive answer received *(unchanged by #116)* |
| 16 | ADR-022E gate #1 (`EstateTransition`) | In force | In force *(unchanged)* |
| 17 | ADR-022E gate #2 (`safeCanonicalize`) | In force | In force *(unchanged)* |
| 18 | ADR-022E gate #4 (`Challenge` adoption) | In force | In force *(unchanged)* |
| 19 | ADR-022E gate #5 (`AuditEvent` rename) | In force | In force *(unchanged)* |
| 20 | MVP endpoint host placement | Unselected (ADR-022B preferred Dixie, fallback Finn — not placed) | **Selected: Dixie-first (recall-pack-inspection)** *per ADR-024B* |
| 21 | Phase 24B implementation-branch scope | Not defined | Defined under ADR-024D — local additive scaffolding only |

The single intake delta is therefore: **Hounfour shipped a
Hounfour-side substrate event (#116) that registered the
`0xhoneyjar:straylight:*` audit-event prefix family and the
`recall-wedge` conformance category upstream, together with a
composition doc, a five-step conformance corpus, vector tests,
and regenerated dist outputs — all on Hounfour `main`, none yet
known to be published under a GitHub Packages release tag, and
none adopted by Straylight in Phase 24A.**

## Package-release ambiguity

Hounfour `main` may include #116 before a GitHub Packages release
exists that publishes the #116 outputs. This creates a
package-release ambiguity that Phase 24A intakes (here) and
disciplines (under ADR-024C
([`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md))).

The ambiguity has three concrete shapes a downstream consumer
might naively use to "close the gap":

1. Pin to Hounfour `main` (e.g.
   `@0xhoneyjar/loa-hounfour@github:0xHoneyJar/loa-hounfour#main`).
2. Pin to an unpublished commit SHA.
3. Reach into Hounfour `dist/` paths that only exist on `main`.

Phase 24A explicitly **refuses all three**. The Straylight
dependency consumption rule is and remains: **only published
GitHub Packages releases of `@0xhoneyjar/loa-hounfour`**. The
currently-pinned range stays `^8.6.0`; the currently-resolved
patch stays `8.6.0`. No `package.json` change, no
`package-lock.json` change, no `npm install` invocation, no
`.npmrc` change, no script that fetches Hounfour from anywhere
other than the configured registry.

ADR-024C pins the rule. Adopting the #116 outputs requires three
independent events (each downstream of Phase 24A):

- **Event A:** Hounfour publishes a release that includes the
  #116 outputs (e.g. an `8.6.x` patch, `8.7.0` minor, or higher),
  observable as a tag on `loa-hounfour`, a GitHub Packages
  publish event, and a `dist/` that includes the registered
  audit-event prefix family + conformance category outputs.
- **Event B:** a Straylight ADR explicitly adopts the new
  release range, citing the release tag, the published `$id`s,
  and the boundary preservation tests it preserves.
- **Event C:** a Phase-24B-or-later shadow-integration check
  against the new release (in the style of Phase 17B /
  Phase 21A) inspects the actually-shipped surface and records
  findings before any wedge import flip.

Each event is necessary; none is sufficient. Phase 24A
pre-authorizes none of them.

Phase 24A explicitly does **not** draft or file a Hounfour-side
coordination signal asking for a release. Whether to file such a
signal is a future, separate, human-reviewed event under Eileen
/ teammate review.

## Anti-collapse rules preserved

Per ADR-024A, the following anti-collapse rules are preserved
through the #116 intake:

- **Class-vs-policy boundary** unchanged. A class-valid carrier
  (assertion, recall request, receipt) is **not** a
  policy-allowed carrier. #116 did not move the boundary.
- **Receipt-or-audit completeness** unchanged. The six receipt
  categories (`included` / `excluded` / `redacted` /
  `challenged` / `revoked` / `blocked-by-policy`) and the
  audit-chain invariants pinned in
  [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
  are unchanged.
- **Hounfour `$id` substrate, not Straylight semantic owner.**
  Per ADR-020C / ADR-022C, schema *shape* ownership migrates by
  adoption, not by rename. The `0xhoneyjar:straylight:*` prefix
  family registered upstream is **substrate** — its semantics
  are owned by Straylight.
- **`PolicyDecision` wedge-only.** Per ADR-020A / ADR-022A /
  ADR-022D. #116 did not produce a Hounfour-side
  `PolicyDecision`.
- **No reach into unexported Hounfour internals.** Per
  Phase 17B / 18 / 21A / 21B / ADR-024A / ADR-024C; extended to
  cover "internals that only exist on `main`".
- **No silent adoption.** Hounfour-side registration of the
  audit-event prefix family or the `recall-wedge` conformance
  category does **not** imply Straylight-side adoption. Adoption
  requires a separate ADR per ADR-020C / ADR-022C / ADR-024A.

## What this intake does *not* claim

For symmetry with the Phase 16 / 17B / 21A / 22A / 23A non-claims
lists and so a reviewer cannot misread the #116 intake as
authorization for Phase 24+ runtime / endpoint / schema-authoring
wiring, the intake explicitly does **not** claim:

- **Not** "Hounfour #116 satisfies the Phase 19A pending feedback
  gate on issue #70." The gate is pending. The status comment
  filed by the user before Phase 23A asked for status on
  residual gates (`EstateTransition` schema; `safeCanonicalize`
  exported subpath); #116 ships neither.
- **Not** "Hounfour owns the `0xhoneyjar:straylight:*` audit-event
  prefix family." The family is registered upstream; the
  semantics are Straylight-owned per ADR-020A / ADR-022A /
  ADR-024A.
- **Not** "Hounfour owns `recall-wedge` as a conformance
  category." The category is registered upstream; the lane
  structure and per-object / per-vector contract are
  Straylight-defined per ADR-020A / ADR-022A / ADR-024A and the
  Phase 23A spec docs.
- **Not** "the Hounfour five-step conformance corpus has been
  adopted into the Straylight test suite." No Phase 24A
  adoption. The Phase 23A eleven-vector Straylight-side matrix
  remains the load-bearing Straylight-side conformance map.
- **Not** "the Hounfour-side composition doc has been adopted
  into the Straylight architecture spec." No Phase 24A
  adoption.
- **Not** "the Hounfour `dist/` outputs regenerated on `main`
  are now consumable by `loa-straylight`." Per ADR-024C, they
  are not. Consumption requires Event A + Event B + Event C
  above.
- **Not** "the Hounfour dependency range may now be bumped." Per
  ADR-024C, no bump on the strength of `main`-only outputs.
- **Not** "`Challenge` is adopted." Gate #4 unchanged.
- **Not** "`EstateTransition` is unblocked." Gate #1 unchanged.
- **Not** "`safeCanonicalize` is unblocked." Gate #2 unchanged.
- **Not** "an `AuditEvent` schema is now available upstream."
  Gate #5 unchanged.
- **Not** "the MVP endpoint host has been wired." Per
  ADR-024B, Dixie is the **placement**; no endpoint is wired.
- **Not** "any sibling-repo PR has been opened." None has.
- **Not** "any GitHub-side action has been taken against any
  sibling repo by Phase 24A." Phase 24A files nothing.

## Validation evidence

```bash
npm run typecheck
npm test
```

Phase 24A adds no source / test / fixture / script / package
change, so `phase-4-demo.test.ts`, `phase-5-hardening.test.ts`,
`hounfour-shadow-integration.test.ts` (pinned to v8.6.0),
`cross-repo-handoff-index.test.ts`, and all other existing
handoff-doc validation tests are unaffected by this intake.

## Cross-references

- [`phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary handoff.
- [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
  — substrate intake / semantic-owner reaffirmation.
- [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md)
  — Dixie-first host placement.
- [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md)
  — package-release discipline.
- [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — Phase 24B implementation-branch scope.
- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — Phase 16 precedent for intake docs.
- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — Phase 16 per-delta accepted-with-adaptation table.
- [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  — Phase 16 readiness-evidence + Phase 17 dependency-flip
  checklist.
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  — Phase 17 shadow-integration findings.
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet (the load-bearing pending
  feedback gate).
- [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)
  — Phase 21A v8.6.x shadow-inspection output.
- [`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md)
  — Phase 22A drafted Hounfour status comment (filed by user
  before Phase 23A as a separate sibling-repo event).
- [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md)
  — Phase 21B schema-readiness lock.
- [`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md)
  — Phase 22A MVP decision-lock packet.
- [`phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md)
  — Phase 23A MVP schema-contract draft.
- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md)
  — Phase 23A per-object MVP schema-contract draft (the
  Straylight-side companion to the Hounfour-side `recall-wedge`
  conformance category #116 registered upstream).
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)
  — Phase 23A eleven-vector MVP conformance matrix (the
  Straylight-side companion to the Hounfour-side five-step
  conformance corpus #116 added upstream).
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index (unchanged by Phase 24A;
  #116 does not file a new sibling-repo issue or PR).
- [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order.
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding; #116 does not relax
  any no-go rule).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 24A to link this intake doc, the Phase 24A summary
  handoff, and the four Phase 24A ADRs.
- `package.json` (unchanged by Phase 24A; Hounfour range stays
  `^8.6.0`).
- `package-lock.json` (unchanged by Phase 24A; Hounfour resolved
  patch stays `8.6.0`).
