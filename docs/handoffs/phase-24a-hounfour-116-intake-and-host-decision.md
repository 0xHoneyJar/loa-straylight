# Phase 24A — Hounfour #116 intake + next-host decision packet (local only)

> Status: Phase 24A. **Docs-only intake + decision-lock packet,
> in `loa-straylight`.** This document records the Phase 24A
> deliverable — the in-repo intake of the Hounfour PR #116 merge
> and the four Phase 24A decision-locks (ADR-024A through
> ADR-024D) that frame the next implementation branch — and pins
> the Phase 24A discipline before any Phase 24 implementation
> branch opens. Phase 24A is **not endpoint-wired**, **not
> runtime-wired**, **not the full Recall Wedge**, **not governed
> recall in Finn / Dixie / Freeside runtime**, **not Hounfour-side
> schema work**, and **not Hounfour-package consumption beyond
> the existing `^8.6.0` published range**. **No endpoint /
> runtime integration is authorized by this packet, no schema is
> authored, and no Hounfour dependency-range bump is performed.**
> Phase 24A is **Phase 24A only** — it does not advance any
> Phase 20A / 20B / 20C / 20D / 20E / 21A / 21B / 22A / 23A
> deferral.
>
> Phase 24A does **not** flip any wedge import, change
> `package.json` / `package-lock.json`, change the Hounfour
> dependency range or resolved patch, consume Hounfour `main` or
> any unpublished commit, modify
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
> Companion docs (the Phase 24A intake doc and four ADRs this
> handoff sits on top of; the Phase 23A schema-contract draft,
> Phase 22A decision-lock, Phase 21B readiness lock, Phase 19A
> pending feedback gate, Phase 20A decision-lock series, and the
> Phase 16 / 17B / 21A intake precedents Phase 24A inherits):
> [`hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md),
> [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md),
> [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md),
> [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md),
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md),
> [`phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md),
> [`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md),
> [`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md),
> [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md),
> [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt),
> [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md),
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
> [`hounfour-response-intake.md`](./hounfour-response-intake.md),
> [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md),
> [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md),
> [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
> [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
> [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
> [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md),
> [`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md),
> [`../decisions/0001-repo-purpose.md`](../decisions/0001-repo-purpose.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md),
> [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md),
> [`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md),
> [`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md),
> [`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md),
> [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md),
> [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md),
> [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md).

## Executive summary

Phase 23A produced the Phase 23A MVP schema-contract draft and
the Phase 23A eleven-vector MVP conformance-vector matrix on top
of the Phase 22A decision-locks (ADR-022A–E) and the Phase 21B
readiness lock. Phase 23A did not author any schema, did not
wire any endpoint, did not edit any sibling repo, and did not
open Phase 23B. The Hounfour status comment for issue #70 (drafted
in Phase 22A) was filed before Phase 23A by the user as a
separate sibling-repo human-reviewed event; no substantive answer
has been received.

Phase 24A is the **Hounfour #116 intake + next-host decision
packet**. It intakes the upstream Hounfour PR
[`0xHoneyJar/loa-hounfour#116`](https://github.com/0xHoneyJar/loa-hounfour/pull/116)
merge event (Hounfour-side conformance / contract substrate;
schema / protocol / conformance only — preserved Hounfour
boundary), pins the resulting package-release ambiguity, places
the next MVP host, and scopes the next implementation branch.
The Phase 24A deliverables are:

- **Per-component intake** of #116
  ([`hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md))
  — what #116 added Hounfour-side; the Hounfour dependency /
  status ledger updated; the package-release ambiguity recorded.
- **Substrate-intake decision-lock** (ADR-024A
  ([`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)))
  — Loa-Straylight remains semantic / control-plane owner
  post-#116; the `0xhoneyjar:straylight:*` audit-event prefix
  family and the `recall-wedge` conformance category are
  Straylight-defined even though registered upstream; the
  Hounfour five-step conformance corpus is upstream test
  substrate, not Straylight runtime substrate; the
  anti-collapse rules (class-vs-policy, receipt-or-audit,
  Hounfour-substrate-not-owner, `PolicyDecision`-wedge-only,
  no-reach-into-unexported-internals, no-silent-adoption) are
  preserved.
- **MVP host selection** (ADR-024B
  ([`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md)))
  — **Dixie-first (recall-pack-inspection-first)** is the next
  MVP host. Rationale: the next Straylight slice is governed
  recall / recall-pack inspection / provenance / receipt
  behavior, not runtime action enforcement. Finn remains the
  later runtime collaborator / enforcement boundary once recall
  output is fed into model / tool execution. Freeside remains
  the later community / app surface consumer. Hounfour remains
  schema / protocol / conformance substrate only.
- **Package-release ambiguity discipline** (ADR-024C
  ([`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md)))
  — Straylight consumes only published GitHub Packages releases.
  Hounfour `main`, commit-SHA pins, git-source dependencies, and
  Hounfour `dist/` paths that only exist on `main` are all
  refused. The currently-pinned range `^8.6.0` and resolved
  patch `8.6.0` stay in place. Adopting #116's outputs requires
  Event A (Hounfour publishes a release) + Event B (superseding
  ADR) + Event C (shadow-integration check) — each necessary,
  none sufficient.
- **Phase 24B implementation-branch scope** (ADR-024D
  ([`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)))
  — the next branch (`phase-24b-*`) is **local additive
  scaffolding inside `loa-straylight` only**: additive types,
  additive tests, additive fixtures, additive docs, and / or a
  Dixie-side handoff-packet refresh — never schema authoring,
  never `package.json` dependency on `loa-dixie` / `loa-finn` /
  `loa-freeside`, never an actual endpoint in `loa-straylight`,
  never sibling-repo edits, never consumption from Hounfour
  `main`. All ADR-022E gates (#1 `EstateTransition`, #2
  `safeCanonicalize`, #4 `Challenge`, #5 `AuditEvent`) remain
  in force.

Phase 24A also produces this summary handoff and an updated
[`README.md`](./README.md) index entry. It produces **no new
spec doc**, **no new fixture**, **no new test**, **no new
sibling-repo handoff packet**, and **no GitHub-side action**.

## v8.6 + #116 inherited state (recap)

Restated narrowly so a reviewer can rely on this list without
re-reading the four-phase Phase 20 lane, the Phase 16 / 17B / 18 /
19A / 21A / 21B / 22A / 23A intake, and the Phase 24A intake doc:

- `@0xhoneyjar/loa-hounfour@^8.6.0` is consumed successfully
  (Phase 21A; commit `4f31b14`). Resolved to `8.6.0`. Phase 21B
  / 22A / 23A preserved this state unchanged. Phase 24A
  preserves it unchanged. The currently-published `8.6.0`
  release does **not** include the #116 outputs.
- Schema `$id`s under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`.
- `Challenge` shipped at v8.6.0 as
  `./schemas/challenge.schema.json` (Phase 16 delta #7
  schema-level closure). Adoption into the wedge public surface
  remains gated by ADR-022E gate #4; Phase 24A does not adopt
  it.
- `EstateTransition` schema absent in v8.6.x (Phase 16 delta #8
  still queued). #116 did **not** author this schema. ADR-022E
  gate #1 unchanged.
- `safeCanonicalize` exported subpath remains deferred under
  gate `no-confirmed-subpath`. The v8.6.0 `exports` map declares
  no `./canonicalize` and no `./utilities` subpath. #116 did
  **not** declare either. ADR-022E gate #2 unchanged.
- `audit-event-transition` is `DISCOVERY_NOTE`; v8.6.x ships
  `audit-trail-entry.schema.json` and `domain-event.schema.json`
  but no `audit-event.schema.json`. #116 did **not** ship an
  `audit-event.schema.json`. ADR-022D continues to treat
  `AuditEvent` as Straylight-owned and not adopted at MVP.
  ADR-022E gate #5 unchanged.
- `policy-decision-denied` candidate remains `DEFERRED`.
- The wedge's stable public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged.
- The private alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is unchanged.
- The Phase 19A pending feedback gate on issue #70 remains
  pending; the v8.6.0 release, the filed status comment, and
  #116's merge are partial substrate fulfillment, not the
  issue-#70 response.

The Phase 24A deltas from the Phase 23A inherited state:

- **Hounfour #116 has merged to `main`.** The `0xhoneyjar:straylight:*`
  audit-event prefix family is registered upstream; the
  `recall-wedge` conformance category is registered upstream;
  the Hounfour-side composition doc
  (`docs/architecture/recall-wedge-composition.md`) exists
  upstream; the five-step recall-wedge conformance corpus exists
  upstream as test substrate; the recall-wedge vector tests
  exist upstream as Hounfour-side test asset; the Hounfour-side
  `schema/dist/release-integrity` outputs have been regenerated.
- **No GitHub Packages release has been observed publishing the
  #116 outputs.** The package-release ambiguity is now
  load-bearing and is disciplined under ADR-024C.
- **MVP host placement: Dixie-first.** ADR-024B places the host
  on the recall-pack-inspection slice. Finn remains a candidate
  for a later runtime-tool-call slice; Freeside remains a later
  consumer; Hounfour remains substrate.
- **Phase 24B implementation-branch scope is defined** under
  ADR-024D: local additive scaffolding only.

## Hounfour dependency / status ledger (one-line view)

The full ledger is in
[`hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md)
(21-row table). Restated here as a one-line view so a reviewer
can verify the Phase 24A state without opening the intake doc:

| # | Item | Phase 24A state |
|---|---|---|
| 1 | Hounfour `package.json` range | `@0xhoneyjar/loa-hounfour@^8.6.0` *(unchanged)* |
| 2 | Hounfour `package-lock.json` resolved patch | `8.6.0` *(unchanged)* |
| 3 | Hounfour `main` includes #116 | **Yes** |
| 4 | GitHub Packages release publishing #116 outputs | **Not yet observed** *(ADR-024C-gated)* |
| 5 | `0xhoneyjar:straylight:*` audit-event prefix family upstream-registered | **Yes** *(Straylight-owned)* |
| 6 | `recall-wedge` conformance category upstream-registered | **Yes** *(Straylight-defined)* |
| 7 | Hounfour-side recall-wedge composition doc | Exists upstream *(not adopted)* |
| 8 | Hounfour-side five-step conformance corpus | Exists upstream *(not adopted)* |
| 9 | Hounfour-side recall-wedge vector tests | Exists upstream *(not imported)* |
| 10 | Hounfour `dist/release-integrity` regenerated on `main` | Yes *(not consumable until release)* |
| 11 | Phase 19A pending feedback gate on issue #70 | Pending *(unchanged)* |
| 12 | ADR-022E gate #1 (`EstateTransition`) | In force *(unchanged)* |
| 13 | ADR-022E gate #2 (`safeCanonicalize`) | In force *(unchanged)* |
| 14 | ADR-022E gate #4 (`Challenge` adoption) | In force *(unchanged)* |
| 15 | ADR-022E gate #5 (`AuditEvent` rename) | In force *(unchanged)* |
| 16 | MVP endpoint host placement | **Dixie-first (recall-pack-inspection)** *per ADR-024B* |
| 17 | Phase 24B implementation-branch scope | Defined per ADR-024D — local additive scaffolding only |

## Blockers vs non-blockers

### Runtime-integration blockers (Phase 24B work that touches these is gated)

| # | Blocker | Why blocking | Trigger to unblock |
|---|---|---|---|
| 1 | `EstateTransition` schema absence (Hounfour delta #8) | A Phase 24B branch that puts an `EstateTransition` on a cross-repo wire would silently invent a Hounfour shape that does not exist. #116 did not ship the schema. | Hounfour ships `estate-transition.schema.json` (or equivalently named) under a v8.6.x or higher line **and** a separate ADR adopts it under ADR-020C / ADR-022C. ADR-022E gate #1. |
| 2 | `safeCanonicalize` exported subpath absence (gate `no-confirmed-subpath`) | A Phase 24B branch that imports a Hounfour `safeCanonicalize` would either reach into unexported internals (forbidden by Phase 17B / 18 / 21A / 21B / ADR-024A / ADR-024C) or import from package root (forbidden by Phase 16 delta #9). #116 did not declare the subpath. | Hounfour declares `./canonicalize` (or `./utilities`) in the `exports` map **and** a separate ADR adopts it. ADR-022E gate #2. |
| 3 | Phase 19A pending feedback on issue #70 not yet received | The MVP integration boundary cannot be reaffirmed without upstream feedback on the v8.6.0 substrate. The status comment was filed before Phase 23A; an answer has not arrived. #116 is substrate, not an answer. | Jani / teammate response on issue #70 is received **or** a teammate review on this repo explicitly approves proceeding without it. ADR-024D scopes Phase 24B such that this gate does not block local additive scaffolding. |
| 4 | Hounfour package-release ambiguity (ADR-024C) | A Phase 24B branch that consumes Hounfour `main` or pins to a commit SHA would bypass the published-release contract Phase 16 / 17B / 18 / 21A / 21B / 22A / 23A all rest on. | Event A (Hounfour publishes a release including #116 outputs) **and** Event B (separate ADR adopts the new range) **and** Event C (shadow-integration check). ADR-024C. |

### Non-blocking discovery notes (Phase 24B may proceed without unblocking these)

| # | Discovery note | Why non-blocking | Phase 24A handling |
|---|---|---|---|
| 1 | `0xhoneyjar:straylight:*` audit-event prefix family registered upstream by #116 | Registration is substrate; semantics are Straylight-owned per ADR-024A. No adoption performed. | Recorded as **substrate event**. Adoption into the wedge public surface requires a separate ADR. |
| 2 | `recall-wedge` conformance category registered upstream by #116 | Registration is substrate; lane structure and per-object / per-vector contract are Straylight-defined per ADR-024A and the Phase 23A spec docs. | Recorded as **substrate event**. Adoption into the Straylight test suite requires a separate ADR. |
| 3 | Hounfour-side five-step recall-wedge conformance corpus | Upstream test substrate, not Straylight runtime substrate. Coordinate with the Phase 23A eleven-vector Straylight-side matrix, not subordinate. | Not imported; not adopted. The Phase 23A matrix remains the load-bearing Straylight-side conformance map. |
| 4 | `AuditEvent` not exported under that name; adjacent `audit-trail-entry.schema.json` / `domain-event.schema.json` exist | ADR-022D / ADR-024A treat `AuditEvent` as Straylight-owned and not adopted at MVP; the audit lane is wedge-private and stays so. | Recorded as **discovery note** (unchanged from Phase 23A). Adjacent schemas must not be renamed into `AuditEvent` without a separate ADR. |
| 5 | `policy-decision-denied` candidate is `DEFERRED` | `PolicyDecision` is wedge-only by design. Hounfour-side denial-shape candidate is informational. | Recorded; not exercised. |
| 6 | Cosmetic alias decisions (e.g. wedge `Actor` ↔ Hounfour `agent-identity`) | Renames are established v8.5.x; Phase 24A does not re-litigate. | Recorded; deferred to a future adoption ADR per ADR-020C. |

## Next-phase recommendation

The next phase is **Phase 24B**, scoped by ADR-024D. Phase 24A is
docs-only; Phase 24B is the **local additive scaffolding**
implementation branch the next slice opens. Its candidate branch
name is `phase-24b-<descriptor>` (representative descriptor:
`phase-24b-recall-pack-inspection-scaffold` — the actual
descriptor is a `phase-24b-*` author / reviewer responsibility
under teammate review).

Phase 24B's allowable scope (per ADR-024D §3):

1. Local TypeScript additions to
   [`../../src/straylight/`](../../src/straylight/) that express
   the recall-pack-inspection MVP host contract, preserving the
   Phase 5 audit-chain / receipt-shape invariants.
2. Additive tests under
   [`../../tests/`](../../tests/) that exercise vectors 1–8 of
   the Phase 23A eleven-vector matrix against the wedge runtime
   via locally-owned shapes. Vectors 10 and 11 remain gates, not
   exercised. No test depends on `EstateTransition` or
   `safeCanonicalize` on the wire.
3. Additive fixtures under
   [`../../fixtures/`](../../fixtures/) that back the additive
   tests.
4. Additive docs under `docs/handoffs/`, `docs/specs/`, or
   `docs/decisions/` that record the Phase 24B implementation.
5. A Dixie-side handoff packet refresh
   ([`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
   [`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
   [`dixie-recall-mapping.md`](./dixie-recall-mapping.md))
   pinning the recall-pack-inspection MVP contract Phase 24A
   placed against — **in-repo only**, no sibling-repo issue /
   comment / PR filed.

Phase 24B's hard non-scope (per ADR-024D §4):

- No `package.json` / `package-lock.json` change.
- No Hounfour `main` / commit-SHA / git-source consumption.
- No Dixie / Finn / Freeside endpoint in `loa-straylight`.
- No sibling-repo edits.
- No schema authoring.
- No `Challenge` / `EstateTransition` / `safeCanonicalize` /
  `AuditEvent`-rename adoption.
- No public commitment-root publication.
- No persistence wiring beyond the existing MVP adapters.
- No adoption of the `0xhoneyjar:straylight:*` prefix family or
  the `recall-wedge` conformance category on the strength of
  #116 alone.
- No import of the Hounfour five-step conformance corpus.
- No reach into unexported Hounfour internals (including
  internals that only exist on `main`).
- No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
  edits.
- No GitHub-side action against any sibling repo.

### If a Hounfour release publishes #116 outputs while Phase 24B is in flight

A separate ADR-024C-supersede event handles the range bump.
Phase 24B does **not** bump on its own; a Phase 24C entry packet
(or an ADR-024C-supersede ADR plus a `phase-24b-*` rebase under
teammate review) is the correct path. ADR-024C pins this.

### If the Phase 19A pending feedback for issue #70 arrives

The answer is intaken in a separate doc / ADR before Phase 24B
makes any sibling-repo-adjacent move. ADR-024D scopes Phase 24B
to **local additive scaffolding only**, so the pending feedback
does not block Phase 24B's allowable scope — but it remains
load-bearing for any sibling-repo wiring Phase 24B explicitly
does not perform.

## Phase 24 entry conditions (forward-looking; non-binding on Phase 24A)

ADR-024A / ADR-024B / ADR-024C / ADR-024D together specify the
entry conditions any future Phase 24+ implementation branch must
satisfy. Restated for the reviewer:

- ADR-024A, ADR-024B, ADR-024C, and ADR-024D have all merged to
  `main` under teammate review.
- ADR-024B's Dixie-first placement is preserved (no teammate
  review has withdrawn it).
- ADR-024C's `^8.6.0` range pin is preserved (no Hounfour-side
  release event has required a superseding ADR).
- The proposed `phase-24b-*` work stays within ADR-024D §3
  (allowable scope) and away from ADR-024D §4 (hard non-scope).
- Phase 19A pending feedback for issue #70 received **or** a
  teammate review explicitly approves proceeding under the
  "local additive scaffolding only" rule of ADR-024D.

## Phase 24 non-go conditions

A Phase 24B implementation branch must **not** open if any of
the following holds:

- Any of ADR-024A / ADR-024B / ADR-024C / ADR-024D have been
  reopened, reverted, or withdrawn by teammate review.
- The proposed work would consume Hounfour `main`, a commit
  SHA, or a git-source pin.
- The proposed work would bump the Hounfour dependency range or
  resolved patch without a separate ADR-024C-supersede event.
- The proposed work would touch any of the hard non-scope items
  in ADR-024D §4.
- The proposed work would file or edit any GitHub issue,
  comment, or PR against a sibling repo.
- The proposed work would adopt the `0xhoneyjar:straylight:*`
  audit-event prefix family or the `recall-wedge` conformance
  category into the Straylight public surface or test suite on
  the strength of #116 alone.
- The proposed work would import the Hounfour five-step
  conformance corpus from a Hounfour-side working-tree path.
- The proposed work would put `EstateTransition` on the wire
  while delta #8 remains queued.
- The proposed work would import `safeCanonicalize` while gate
  `no-confirmed-subpath` is in force.
- The proposed work would adopt `challenge.schema.json` into
  the wedge public surface without a separate ADR.
- The proposed work would rename `audit-trail-entry` or
  `domain-event` into `AuditEvent` without a separate ADR.
- The proposed work would select Freeside or Hounfour as the
  MVP endpoint host.
- The proposed work would promote Finn from later-runtime-
  collaborator to MVP host on the strength of #116 alone.

## Explicit non-scope (Phase 24A)

Phase 24A is **intake + decision-lock only**. It performs no
implementation work. The following are out-of-scope and remain
in the same state Phase 23A left them:

- **No `src/` changes.** The wedge's stable public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged. The private alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is unchanged. No re-export is added or removed. No internal
  module is edited.
- **No tests.** No new test file. No edit to any existing test
  file.
- **No scripts.** No edit to any script under
  [`../../scripts/`](../../scripts/).
- **No fixtures.** No new fixture file. No edit to any existing
  fixture file under
  [`../../fixtures/`](../../fixtures/).
- **No package changes.** `package.json` and `package-lock.json`
  are unchanged from Phase 21A / 21B / 22A / 23A. The Hounfour
  dependency (`@0xhoneyjar/loa-hounfour@^8.6.0`) range and
  resolved patch (`8.6.0`) are unchanged.
- **No Hounfour `main` consumption.** No commit-SHA pin. No
  git-source dependency. No script that fetches Hounfour from
  anywhere other than the configured registry. No import of a
  Hounfour `dist/` path that only exists on `main`.
- **No schemas authored.** No TypeBox schema, no JSON Schema, no
  `$id` declared, no validator generated.
- **No new spec doc.** The Phase 23A spec docs
  ([`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md),
  [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md))
  are unchanged.
- **No adoption of the `0xhoneyjar:straylight:*` prefix family**
  into the Straylight public surface.
- **No adoption of the `recall-wedge` conformance category** into
  the Straylight test suite.
- **No import of the Hounfour five-step conformance corpus** from
  a Hounfour-side working-tree path.
- **No Dixie endpoint.** ADR-024B places the host; ADR-024D
  scopes the implementation branch. Phase 24A wires nothing.
- **No Finn endpoint.** Finn remains a later runtime
  collaborator per ADR-024B.
- **No Freeside integration.** No bot / admin / community /
  Discord / Telegram / REST / NATS surface added.
- **No Hounfour schema work.** No new schema file authored. No
  Hounfour-side schema edit. No GitHub issue / comment / PR
  filed against any sibling repo by Phase 24A.
- **No `Challenge` adoption.** Gate #4 unchanged.
- **No `EstateTransition` implementation.** Gate #1 unchanged.
- **No `safeCanonicalize` work.** Gate #2 unchanged.
- **No `AuditEvent` rename.** Gate #5 unchanged.
- **No public anchors.** Per ADR-020E.
- **No persistence wiring.** Per ADR-020D / ADR-022D.
- **No new HTTP / NATS / REST / Discord / Telegram surface.**
- **No sibling repo edits.** Not `loa-hounfour`, not
  `loa-finn`, not `loa-dixie`, not `loa-freeside`. No clone, no
  fork, no patch, no comment **filed** against any sibling
  repo by Phase 24A.
- **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` /
  `.gitignore` / `.gitmodules` / `.npmrc` edits.**
- **No commit, no push, no PR.**

## What this packet does *not* claim

For symmetry with the Phase 22A / 23A non-claims lists and so a
reviewer cannot misread Phase 24A as authorization for Phase 24+
runtime / endpoint / schema-authoring / package-bump wiring,
Phase 24A explicitly does **not** claim:

- **Not** "Hounfour #116's merge satisfies the Phase 19A pending
  feedback gate." The gate is pending. #116 is substrate; it
  did not answer issue #70.
- **Not** "Hounfour now owns the Straylight audit-event prefix
  family." The `0xhoneyjar:straylight:*` family is registered
  upstream; semantics are Straylight-owned per ADR-020A /
  ADR-022A / ADR-024A.
- **Not** "Hounfour now owns the `recall-wedge` conformance
  category." The category is registered upstream; the lane
  structure and per-object / per-vector contract are
  Straylight-defined per ADR-024A and the Phase 23A spec docs.
- **Not** "the Hounfour five-step conformance corpus has been
  adopted into the Straylight test suite." The Phase 23A
  eleven-vector Straylight-side matrix remains the load-bearing
  conformance map. No adoption.
- **Not** "any Hounfour schema is adopted." Including the
  `challenge.schema.json` shipped at v8.6.0 (gate #4), any
  candidate for `AuditEvent` (gate #5), or `commitment-root.schema.json`
  (gate #7).
- **Not** "`EstateTransition` is unblocked." Gate #1 unchanged.
- **Not** "`safeCanonicalize` is unblocked." Gate #2 unchanged.
- **Not** "the Hounfour dependency range can be bumped." Per
  ADR-024C, no bump on the strength of `main`-only outputs.
- **Not** "Phase 24B is authorized to author schemas, fixtures,
  or tests beyond the Phase 23A vectors 1–8 envelope." Phase 24B
  scaffolding stays within the wedge runtime's existing
  locally-owned shapes per ADR-024D.
- **Not** "Phase 24B is authorized to file or edit any GitHub
  issue / comment / PR against any sibling repo." It is not.
- **Not** "a Dixie endpoint exists." ADR-024B places the host;
  no `loa-dixie` PR has been opened.
- **Not** "a Finn endpoint exists." Finn is a later runtime
  collaborator, not the MVP host.
- **Not** "any sibling-repo issue, comment, or PR has been
  filed by Phase 24A." Phase 24A files nothing.
- **Not** "any new HTTP / NATS / REST / Discord / Telegram
  surface exists." None.

This is **Hounfour #116 intake + next-host decision-lock**. The
output is **local documentation** — the intake doc, the four
Phase 24A ADRs (ADR-024A–D), this summary handoff, and an
updated handoffs README index — that prepares the Phase 24B
local additive scaffolding without implementing it. The Recall
Wedge is **not runtime-wired**, **not endpoint-wired**, and
**not schema-authored** by Phase 24A. This is **Phase 24A only**.

## Validation evidence

```bash
npm run typecheck
npm test
```

`npm run typecheck` and `npm test` are expected to remain clean
on the `phase-24a-hounfour-recall-wedge-intake` branch: Phase 24A
adds no new test, modifies no source file, and modifies no
script, fixture, or package file, so the existing Phase 4 demo
test, the Phase 5 hardening tests, the Phase 17B / 18 / 21A
shadow-integration pin, the Phase 19A review-packet pin, the
Phase 20B local-scaffold pin, the Phase 20C demo-shape pin, and
the existing handoff-doc validation tests are unaffected.

## Cross-references

- [`hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md)
  — Phase 24A per-component intake doc (the load-bearing intake
  this summary handoff sits on top of).
- [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
  — Phase 24A substrate-intake decision-lock.
- [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md)
  — Phase 24A MVP host selection (Dixie-first).
- [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md)
  — Phase 24A package-release ambiguity discipline.
- [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — Phase 24A Phase 24B implementation-branch scope.
- [`phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md)
  — Phase 23A MVP schema-contract draft (the Straylight-side
  schema-contract draft Phase 24A intakes on top of).
- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md)
  — Phase 23A per-object MVP schema-contract draft.
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)
  — Phase 23A eleven-vector MVP conformance matrix.
- [`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md)
  — Phase 22A MVP decision-lock (the load-bearing five
  ADR-022-series decisions Phase 24A reads from).
- [`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md)
  — Hounfour status comment for issue #70 (drafted in Phase 22A;
  filed by the user before Phase 23A as a separate sibling-repo
  human-reviewed event; remains an open status request, not an
  answer).
- [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md)
  — Phase 21B v8.6 schema-readiness lock (the substrate map
  Phase 24A's intake aligns to).
- [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)
  — Phase 21A v8.6.x shadow-inspection output (the source of
  the per-object MATCH / EXTEND / DISCOVERY_NOTE / DEFERRED
  dispositions Phase 24A preserves).
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet (the load-bearing pending
  feedback gate this packet does not satisfy).
- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — Phase 16 per-delta accepted-with-adaptation table.
- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — Phase 16 disposition-counts intake doc.
- [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  — Phase 16 readiness-evidence checklist (rc.1 / v8.5.0 final
  gates marked satisfied).
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  — Phase 17 shadow-integration findings (the integration
  precedent Phase 24A inherits the boundary discipline from).
- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
  [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
  [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
  [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
  [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md),
  [`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md)
  — Phase 20 lane.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index (unchanged by Phase 24A;
  #116 does not file a new sibling-repo issue or PR).
- [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order.
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 24A to link this doc, the intake doc, and the four
  Phase 24A ADRs.
- [`../decisions/0001-repo-purpose.md`](../decisions/0001-repo-purpose.md)
  — repo-purpose declaration.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  through
  [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — Phase 20A decision-lock series.
- [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md)
  through
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — Phase 22A decision-lock series.
- [`../schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md)
  — Phase 6 per-candidate inventory.
- [`../schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
  — Phase 8 schema-candidate-layer conformance vectors.
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — the load-bearing class-vs-policy invariant.
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge's stable public API surface (unchanged by Phase 24A).
- [`../../src/straylight/types.ts`](../../src/straylight/types.ts)
  — current Straylight type definitions (unchanged by
  Phase 24A).
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  — private Hounfour alias module (unchanged by Phase 24A).
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  — local canonicalizer (unchanged by Phase 24A; gate
  `no-confirmed-subpath` unchanged).
- [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts)
  — local estate / transition application (unchanged by
  Phase 24A; `EstateTransition` deferral unchanged).
- [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts)
  — local recall execution (unchanged by Phase 24A).
- [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  — local commitment-root helper (unchanged by Phase 24A;
  ADR-020E unchanged).
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
  — fail-closed receipt + audit-chain invariants (the
  load-bearing "MVP host contract" pin per ADR-022D §4 that the
  Phase 23A vectors reference and Phase 24A preserves; unchanged
  by Phase 24A).
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — six-receipt-category pin per ADR-020D §6 that Phase 24A
  preserves; unchanged by Phase 24A.
- `package.json` (unchanged by Phase 24A; Hounfour range stays
  `^8.6.0`).
- `package-lock.json` (unchanged by Phase 24A; Hounfour resolved
  patch stays `8.6.0`).
