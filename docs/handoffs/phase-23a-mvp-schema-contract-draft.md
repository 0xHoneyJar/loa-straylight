# Phase 23A — MVP schema-contract draft (local only)

> Status: Phase 23A. **Docs-only schema-contract draft packet, in
> `loa-straylight`.** This document records the Phase 23A
> deliverable — a per-object MVP schema-contract draft and an
> eleven-vector conformance matrix — and pins the Phase 23A
> discipline before any Phase 23B implementation branch opens.
> Phase 23A is **not endpoint-wired**, **not runtime-wired**,
> **not the full Recall Wedge**, **not governed recall in Finn /
> Dixie / Freeside runtime**, and **not Hounfour-side schema
> work**. **No endpoint / runtime integration is authorized by
> this packet.** Phase 23A is **Phase 23A only** — it does not
> advance any Phase 20A / 20B / 20C / 20D / 20E / 21A / 21B /
> 22A deferral.
>
> Phase 23A does **not** flip any wedge import, change `package.json`
> / `package-lock.json`, change the Hounfour dependency range or
> resolved patch, modify
> [`../../src/straylight/`](../../src/straylight/), modify
> [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> modify any script under
> [`../../scripts/`](../../scripts/), wire Finn / Dixie / Freeside
> runtime, add a Dixie endpoint, add a Finn endpoint, edit any
> sibling repo, implement `Challenge` locally, implement
> `EstateTransition` locally, reach into unexported Hounfour
> internals, add a `safeCanonicalize` subpath import, publish a
> public commitment root, add a network surface, change persistence,
> add or modify any test, add or modify any fixture, author any
> TypeBox / JSON Schema, **file** any GitHub issue or comment, or
> touch `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`. It
> does **not** commit and does **not** open a PR. The actual
> Phase 23A PR is a separate, future event under teammate review.
>
> Companion docs (the spec docs Phase 23A produces, the Phase 22A
> decision lock this draft builds on, the Phase 21B readiness lock
> the decision lock builds on, the Phase 19A pending feedback gate
> none of these packets satisfies, and the Phase 20A decision-lock
> series the prior packets succeed):
> [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md),
> [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md),
> [`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md),
> [`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md),
> [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md),
> [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt),
> [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md),
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
> [`hounfour-response-intake.md`](./hounfour-response-intake.md),
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
> [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md).

## Executive summary

Phase 22A locked five MVP decisions before any Phase 22
implementation branch could open: Loa-Straylight remains the
semantic / control-plane home post-v8.6.0; Dixie is the preferred
MVP endpoint host with Finn as fallback; the schema dependency
graph is acyclic (Hounfour substrate → Loa-Straylight contract →
Finn / Dixie consume → Freeside consumes); Loa-Straylight owns
persistence + audit + receipt shape with Phase 5 hardening
invariants elevated to MVP host contract; and a twenty-row
deferred-features list (ADR-022E) is the gate every Phase 22 /
Phase 23 reviewer cites when refusing scope creep. Phase 22A
also drafted a Hounfour status comment for
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
asking for status on the residual gates (`EstateTransition`
schema, `safeCanonicalize` exported subpath); the comment was
**filed on issue #70 before Phase 23A began**, by the user, as a
separate sibling-repo human-reviewed event:
<https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4413876047>.
The comment is a status request — it does **not** constitute an
answer.

Phase 23A is the **MVP schema-contract draft packet** that
converts the Phase 22A decision-locks plus the Phase 21B v8.6.0
substrate map into a per-object MVP schema-contract draft and an
eleven-vector conformance matrix — **without authoring any
schema**. It produces two new spec docs under
[`../specs/`](../specs/):

- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md)
  — fourteen MVP objects, each with purpose, minimum required
  fields, class-validation role, policy-validation
  relationship, signer/keyring relationship, recall/audit
  relationship, current status (shipped upstream / safe draft /
  blocked / deferred / discovery note), and likely future
  Hounfour `$id` *or* Straylight-local contract name.
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)
  — the eleven MVP conformance vectors the Recall Wedge MVP
  must distinguish, each pinned to its named lane
  (`class_validation` / `policy_validation` / `audit_validation`
  / `keyring_validation`), expected outcome, schema(s)
  exercised, ADR / Phase-21B / Phase-22A pin, and Phase 23A
  status.

Phase 23A also produces this summary handoff and an updated
[`README.md`](./README.md) index entry. It produces no new ADR.
It produces no fixture changes, no runtime changes, no script
changes, no test additions, no package changes, no new
sibling-repo handoff packets, and no GitHub-side action.

## v8.6 inherited state (recap, plus comment-filed delta)

Restated narrowly so a reviewer can rely on this list without
re-reading the four-phase Phase 20 lane or the Phase 16 / 17B /
18 / 19A / 21A / 21B / 22A intake:

- `@0xhoneyjar/loa-hounfour@^8.6.0` is consumed successfully
  (Phase 21A; commit `4f31b14`). Resolved to `8.6.0`. Phase 21B
  / 22A preserved this state unchanged. Phase 23A preserves it
  unchanged.
- Schema `$id`s under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`.
- `Challenge` shipped at v8.6.0 as `./schemas/challenge.schema.json`
  (Phase 16 delta #7 schema-level closure). **Adoption** into
  the wedge public surface remains gated by ADR-022E gate #4;
  Phase 23A does not adopt it.
- `EstateTransition` schema absent in v8.6.x (Phase 16 delta #8
  still queued). The status comment for issue #70 has been
  filed and asks for status; no answer has been received as of
  Phase 23A entry.
- `safeCanonicalize` exported subpath remains deferred under
  gate `no-confirmed-subpath`. The v8.6.0 `exports` map declares
  no `./canonicalize` and no `./utilities` subpath. The status
  comment also asks for status on this gate; no answer has been
  received as of Phase 23A entry.
- `audit-event-transition` is `DISCOVERY_NOTE`; v8.6.x ships
  `./schemas/audit-trail-entry.schema.json` and
  `./schemas/domain-event.schema.json` but no
  `audit-event.schema.json`. ADR-022D continues to treat
  `AuditEvent` as Straylight-owned and not adopted at MVP.
- `policy-decision-denied` candidate remains `DEFERRED`.
- The wedge's stable public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged.
- The private alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is unchanged.
- The Phase 19A pending feedback gate on issue #70 remains
  pending; the v8.6.0 release plus the filed status comment
  are partial fulfillment, not the issue-#70 response.

The single delta from Phase 22A's "drafted but not filed" state
is that the comment **has now been filed on issue #70** by the
user (a separate, sibling-repo, human-reviewed event). Phase 23A
treats that act as an *open status request*, not as an answer.

## Minimum MVP object contract list (one-line summary per object)

The full per-object contract is in
[`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md).
Restated here as a one-line summary so a reviewer can verify the
Phase 23A object set without opening the spec:

| # | Object | Status | Hounfour `$id` (8.6.0) *or* Straylight-local |
|---|---|---|---|
| 1 | Actor | shipped upstream | `agent-identity` (alias rename) |
| 2 | ActorEstate | shipped upstream | `agent-estate` (EXTEND) |
| 3 | Assertion | shipped upstream | `assertion` |
| 4 | SignatureEnvelope | safe draft | *(Straylight-local)* |
| 5 | Keyring | shipped upstream | `keyring` |
| 6 | PolicyDecision | safe draft | *(Straylight-local; never produced upstream)* |
| 7 | EstateTransition | blocked / deferred | *(absent in v8.6.x; delta #8 queued)* |
| 8 | Challenge | shipped upstream *(adoption gated)* | `challenge` |
| 9 | Revocation | safe draft | *(carried by `assertion` MATCH)* |
| 10 | RecallRequest | shipped upstream | `recall-request` |
| 11 | RecallPack | shipped upstream | `recall-pack` |
| 12 | RecallReceipt | shipped upstream | `recall-receipt` |
| 13 | AuditEvent | discovery note | *(absent under that name; adjacent: `audit-trail-entry`, `domain-event`)* |
| 14 | CommitmentRoot *(optional)* | shipped upstream *(shape)* / deferred *(public anchor)* | `commitment-root` |

The lane assignment summary (also restated from the spec):

- **`class-validation`** lane: Actor, ActorEstate, Assertion,
  SignatureEnvelope, Keyring, EstateTransition (shape part),
  Challenge, Revocation, RecallRequest, RecallPack (shape
  part), RecallReceipt (shape part), AuditEvent (shape part),
  CommitmentRoot (shape part).
- **`policy-validation`** lane: PolicyDecision (the only
  decision artifact; wedge-only producer).
- **`audit/receipt`** lane (immutability + chain integrity):
  EstateTransition, RecallPack, RecallReceipt, AuditEvent,
  CommitmentRoot.
- **`keyring-validation`** lane (signer competence): every
  signer-bearing carrier — Assertion, Challenge, Revocation,
  RecallRequest, EstateTransition.

The lanes never collapse. Per
[`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md),
self-consistent `SignatureEnvelope` is **not** signer
competence; class-valid carrier is **not** policy-allowed;
class-valid `AuditEvent` is **not** chain-valid.

## Conformance-vector matrix (one-line summary per vector)

The full eleven-vector matrix is in
[`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md).
Restated here as a one-line summary:

| # | Vector | Lane(s) | Phase 23A status |
|---|---|---|---|
| 1 | Valid observation admission | `class` → `keyring` → `policy` → `audit` | safe draft |
| 2 | Invalid missing provenance | `class` | safe draft |
| 3 | Valid reflection but not identity promotion | `class` → `policy` | safe draft |
| 4 | Revoked assertion excluded from recall | `class` → `policy` → `audit` | safe draft |
| 5 | Private assertion excluded from public Discord recall | `class` → `policy` | safe draft |
| 6 | Contested assertion marked or excluded by policy | `class` → `policy` | safe draft |
| 7 | Unknown signer denied | `class` → `keyring` → `policy` | safe draft |
| 8 | Valid signer but not competent denied | `class` → `keyring` → `policy` | safe draft |
| 9 | `Challenge` accepted from Hounfour v8.6 shipped schema | `class` → `keyring` → `policy` | shipped upstream *(shape; adoption gated)* |
| 10 | `EstateTransition` deferred | (gate, not exercised) | blocked / deferred |
| 11 | `safeCanonicalize` absent exported subpath | (gate, not exercised) | blocked / deferred |

Vectors 1–8 exercise the existing wedge runtime via locally-owned
shapes (per the `safe draft` rule of the schema-contract spec).
Vector 9 demonstrates that the upstream `challenge.schema.json`
shipped at v8.6.0 *can* describe a wedge `Challenge` —
**adoption** of the upstream schema into the wedge public surface
is **not** required for the vector and remains an ADR-022E gate
#4 event. Vectors 10 and 11 are explicitly **gated**, not
exercised: their conformance bar is the *deferral* itself —
**no MVP integration silently uses a Hounfour shape that does
not exist** (vector 10) and **no MVP integration silently
reaches into unexported Hounfour internals** (vector 11).

## Blockers vs non-blockers

The Phase 21B Q4 classification carried into Phase 22A is
preserved; Phase 23A adds the Phase 23B-specific implications.

### Runtime-integration blockers (any Phase 23B work that touches these is gated)

| # | Blocker | Why blocking | Trigger to unblock |
|---|---|---|---|
| 1 | `EstateTransition` schema absence (Hounfour delta #8) | A Phase 23B branch that puts an `EstateTransition` on a cross-repo wire would silently invent a Hounfour shape that does not exist. | Hounfour ships `estate-transition.schema.json` (or equivalently named) under a v8.6.x or v8.7.x line **and** a separate ADR adopts it under ADR-020C / ADR-022C. ADR-022E gate #1. |
| 2 | `safeCanonicalize` exported subpath absence (gate `no-confirmed-subpath`) | A Phase 23B branch that imports a Hounfour `safeCanonicalize` would either reach into unexported internals (forbidden by Phase 17B / 18 / 21A) or import from package root (forbidden by Phase 16 delta #9). | Hounfour declares `./canonicalize` (or `./utilities`) in the `exports` map **and** a separate ADR adopts it. ADR-022E gate #2. |
| 3 | Phase 19A pending feedback on issue #70 not yet received | The MVP integration boundary cannot be reaffirmed without upstream feedback on the v8.6.0 substrate. The status comment was filed before Phase 23A; an answer has not arrived. | Jani / teammate response on issue #70 is received **or** a teammate review on this repo explicitly approves proceeding without it. |
| 4 | ADR-022B endpoint-host placement still unselected | A Phase 23B branch that wires Dixie or Finn would silently lock the host before its placement criteria have been reviewed. | A separate ADR selects the MVP endpoint host (Dixie preferred / Finn fallback) per the seven ADR-022B criteria. |
| 5 | ADR-022A semantic-ownership reaffirmation missing for Phase 23 entry | Without an explicit Phase 23 entry restatement, a Phase 23B branch could silently flip ownership on the strength of v8.6.0 substrate availability. | A Phase 23 entry packet restates ADR-022A semantic-home ownership (Loa-Straylight remains semantic owner; Hounfour remains substrate; adoption is by separate ADR). |

### Non-blocking discovery notes (Phase 23B may proceed without unblocking these)

| # | Discovery note | Why non-blocking | Phase 23A handling |
|---|---|---|---|
| 1 | `AuditEvent` not exported under that name; adjacent `audit-trail-entry.schema.json` / `domain-event.schema.json` exist | ADR-022D treats `AuditEvent` as Straylight-owned and not adopted at MVP; the audit lane is wedge-private and stays so. | Recorded as **discovery note** in the schema-contract spec. **Adjacent schemas must not be renamed into `AuditEvent` without confirmation.** ADR-022E gate #5 governs any future adoption. |
| 2 | `policy-decision-denied` candidate is `DEFERRED` | `PolicyDecision` is wedge-only by design (ADR-020A / ADR-022A / ADR-022D); a Hounfour-side denial-shape candidate is informational, not load-bearing. | Recorded; not exercised. ADR-022E gate #6. |
| 3 | Eleven exported-but-unconsumed Hounfour JS subpaths | Their presence is informational. Phase 23A consumes none. | No-op. |
| 4 | Cosmetic alias decisions (e.g. wedge `Actor` ↔ Hounfour `agent-identity`) | Renames are established v8.5.x; Phase 23A does not re-litigate. | Recorded; deferred to a future adoption ADR per ADR-020C. |

## Next-phase recommendation

Per the task and the Phase 22 / Phase 23 entry conditions Phase
22A pinned, two scenarios govern Phase 23B's allowable shape.

### Scenario A — Hounfour answer arrives before Phase 23B implementation

If Jani / teammate posts a substantive response on
[issue #70](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
before Phase 23B opens — covering the residual gates the filed
status comment requested status on (`EstateTransition` schema,
`safeCanonicalize` exported subpath) — **wait** for that
response and then write a Phase 23B *entry packet* that:

1. Records what the response said (without acting on it).
2. Decides whether the response unblocks ADR-022E gate #1 (and
   if so, drafts the ADR-020C / ADR-022C adoption ADR Phase 22A
   Q5 requires).
3. Decides whether the response unblocks ADR-022E gate #2 (and
   if so, drafts the corresponding adoption ADR for the
   `safeCanonicalize` subpath).
4. Reaffirms ADR-022A and ADR-022B for Phase 23 entry.
5. Selects the MVP endpoint host per ADR-022B's seven criteria
   (or formally defers).

The entry packet is **docs-only**, like Phase 23A. The actual
schema authoring / fixture authoring / test authoring is **a
separate Phase 23C+ branch** under teammate review.

### Scenario B — No Hounfour answer; teammate review approves proceeding

If the answer does **not** arrive in a reviewer-acceptable window
and a teammate review on this repo explicitly approves proceeding
**without** an answer, Phase 23B may continue with **local
semantic-contract scaffolding only** that:

1. Keeps `EstateTransition` deferred (ADR-022E gate #1
   unchanged). No Hounfour-shaped `EstateTransition` envelope
   is added; no sibling endpoint accepts a wedge-local shape as
   canonical.
2. Keeps `safeCanonicalize` deferred (ADR-022E gate #2
   unchanged). No `./canonicalize` / `./utilities` subpath
   import. No reach into unexported Hounfour internals. The
   wedge continues to canonicalize via
   [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts).
3. Keeps `Challenge` adoption gated (ADR-022E gate #4
   unchanged). The spec describes the upstream
   `challenge.schema.json` as available substrate; the wedge's
   public surface does **not** re-export it.
4. Keeps `AuditEvent` Straylight-owned (ADR-022E gate #5
   unchanged). No rename of `audit-trail-entry` /
   `domain-event` into `AuditEvent`.
5. Keeps `PolicyDecision` wedge-only (ADR-020A / ADR-022A /
   ADR-022D unchanged). No upstream production.
6. Touches no sibling repo. Adds no Dixie / Finn / Freeside
   endpoint. Files no GitHub issue or comment.

The "scaffolding" in Scenario B is the Phase 23A spec docs
*plus* the ADR-022B endpoint-host placement decision and a
restatement of ADR-022A for Phase 23 entry — **not** schema
authoring, fixture authoring, or test authoring. Schema /
fixture / test authoring still requires a future ADR adopting
the upstream substrate (per ADR-020C / ADR-022A / ADR-022C),
which Phase 23B-as-Scenario-B explicitly does not write.

### Default if neither scenario fires

If neither scenario fires (no answer; no teammate approval to
proceed without one), Phase 23B does not open. Phase 23A's spec
docs remain the in-repo reference until a triggering event
occurs.

## Phase 23 entry conditions (forward-looking; non-binding on Phase 23A)

ADR-022B / ADR-022D / ADR-022E together specify the entry
conditions a future Phase 23B implementation branch must satisfy
before any work that would touch
[`../../src/straylight/`](../../src/straylight/),
[`../../scripts/`](../../scripts/),
[`../../tests/`](../../tests/),
[`../../fixtures/`](../../fixtures/), `package.json`, or any
sibling repo. Restated for the reviewer:

- Phase 19A pending feedback for issue #70 received **or** a
  teammate review on this repo explicitly approves proceeding
  (Scenario A vs Scenario B above).
- ADR-022B-criteria-driven placement ADR selects Dixie or Finn
  (or formally defers). Phase 22A's Dixie-preferred / Finn-fallback
  recommendation remains the framing.
- ADR-022A semantic-home boundary restated for Phase 23 entry.
- ADR-022D receipt / audit-chain invariants preserved by the
  proposed wiring (the Phase 5 hardening "MVP host contract"
  applies).
- Whichever ADR-022E gates the proposed feature unblocks have
  their triggers satisfied.

Phase 23A does **not** open Phase 23B implementation; restatement
of these entry conditions is a Phase 23B entry-packet
responsibility.

## Phase 23 non-go conditions

A Phase 23B implementation branch must **not** open if any of
the following holds:

- Phase 19A pending feedback still pending **and** no teammate
  review approves proceeding → do not begin implementation.
- ADR-022B placement still unselected → do not wire Dixie or
  Finn.
- ADR-022A semantic-ownership boundary still unrestated for
  Phase 23 entry → do not flip imports.
- Any ADR-022E trigger required for the proposed feature is
  unsatisfied → do not advance the feature.
- The proposed work would put `EstateTransition` on the wire
  while delta #8 remains queued → do not put it on the wire.
- The proposed work would import `safeCanonicalize` while gate
  `no-confirmed-subpath` is in force → do not import.
- The proposed work would adopt `challenge.schema.json` into
  the wedge public surface without a separate ADR → do not
  adopt.
- The proposed work would rename `audit-trail-entry` or
  `domain-event` into `AuditEvent` without a separate ADR → do
  not rename.
- The proposed work would file or edit any GitHub issue,
  comment, or PR from this branch → do not file.
- The proposed work edits any sibling repo from this branch →
  do not edit.

## Explicit non-scope (Phase 23A)

Phase 23A is **MVP schema-contract draft only**. It performs no
implementation work. The following are out-of-scope and remain
in the same state Phase 22A left them:

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
  are unchanged from Phase 21A / 21B / 22A. The Hounfour
  dependency (`@0xhoneyjar/loa-hounfour@^8.6.0`) range and
  resolved patch (`8.6.0`) are unchanged.
- **No schemas authored.** No TypeBox schema, no JSON Schema, no
  `$id` declared, no validator generated. The minimum-required
  -fields lists in the schema-contract spec are field-set
  commitments, not schemas.
- **No Dixie endpoint.** ADR-022B's preferred host is unchanged
  and unwired.
- **No Finn endpoint.** ADR-022B's fallback host is unchanged
  and unwired.
- **No Freeside integration.** No bot / admin / community /
  Discord / Telegram / REST / NATS surface is added.
- **No Hounfour schema work.** No new schema file authored. No
  Hounfour-side schema edit. No GitHub issue / comment / PR
  filed against any sibling repo by Phase 23A. (The status
  comment for issue #70 was filed before Phase 23A by the user;
  Phase 23A files nothing.)
- **No `Challenge` adoption.** Although `challenge.schema.json`
  is shipped at v8.6.0, no `Challenge` re-export is added to
  the wedge public surface, no local `Challenge` schema /
  fixture / verb is added, and no import is flipped.
- **No `EstateTransition` implementation.** Deferred per
  ADR-020C / ADR-022C / ADR-022E and Phase 16 delta #8.
- **No `safeCanonicalize` work.** Gate `no-confirmed-subpath`
  unchanged. The local canonicalizer
  ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
  remains the canonicalization implementation. No reach into
  unexported Hounfour internals.
- **No `AuditEvent` rename.** Adjacent schemas
  (`audit-trail-entry`, `domain-event`) are not renamed into
  `AuditEvent`. ADR-022E gate #5 unchanged.
- **No public anchors.** Per ADR-020E.
- **No persistence wiring.** Per ADR-020D / ADR-022D.
- **No new HTTP / NATS / REST / Discord / Telegram surface.**
- **No sibling repo edits.** Not `loa-hounfour`, not
  `loa-finn`, not `loa-dixie`, not `loa-freeside`. No clone, no
  fork, no patch, no comment **filed** against any sibling
  repo by Phase 23A.
- **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` /
  `.gitignore` / `.gitmodules` / `.npmrc` edits.**
- **No commit, no push, no PR.**

## What this packet does *not* claim

For symmetry with the Phase 22A non-claims and so a reviewer
cannot misread Phase 23A as authorization for Phase 23B
runtime / endpoint / schema-authoring wiring, Phase 23A
explicitly does **not** claim:

- **Not** "the filed Hounfour status comment satisfies the
  Phase 19A pending feedback gate." It is a status request;
  the answer remains pending.
- **Not** "Hounfour owns Straylight schemas." Per ADR-020A /
  ADR-022A and ADR-020C / ADR-022C, Loa-Straylight remains the
  semantic owner. Hounfour remains the canonical schema
  *candidate*. Adoption is by separate ADR.
- **Not** "any Hounfour schema is adopted." Including
  `challenge.schema.json` (gate #4), the eleven shipped-but
  -unconsumed JS subpaths, `audit-trail-entry.schema.json` /
  `domain-event.schema.json` (gate #5), and `commitment-root.schema.json`
  (public anchoring gate #7).
- **Not** "`EstateTransition` is unblocked." Schema absence in
  v8.6.x continues to gate any runtime path that would require
  it. ADR-022E gate #1 unchanged.
- **Not** "`safeCanonicalize` subpath is unblocked." Gate
  `no-confirmed-subpath` unchanged. ADR-022E gate #2
  unchanged.
- **Not** "any of the eleven conformance vectors are
  exercised as fixtures or tests." Phase 23A authors no fixture
  and no test.
- **Not** "Phase 23B is authorized to author schemas, fixtures,
  or tests." Authorization for that work requires the
  Scenario A / Scenario B path described under "Next-phase
  recommendation," neither of which is granted by Phase 23A.
- **Not** "a Dixie endpoint exists." ADR-022B preference is a
  *recommendation*; no `loa-dixie` PR has been opened.
- **Not** "a Finn endpoint exists." ADR-022B fallback is a
  *recommendation*; no `loa-finn` PR has been opened.
- **Not** "Phase 23B is authorized to begin Finn or Dixie
  boundary prep." Phase 21B Q5 / ADR-022B remain binding.
- **Not** "Phase 23B is authorized to flip any wedge import."
- **Not** "any sibling-repo issue, comment, or PR has been
  filed by Phase 23A." Phase 23A files nothing.
- **Not** "any new HTTP / NATS / REST / Discord / Telegram
  surface exists." None.

This is **MVP schema-contract draft**. The output is **local
documentation** — two new spec docs under
[`../specs/`](../specs/), this summary, and an updated handoffs
README index — that prepares the Recall Wedge MVP schema work
without implementing schemas yet. The Recall Wedge is **not
runtime-wired**, **not endpoint-wired**, and **not schema-authored**
by Phase 23A. This is **Phase 23A only**.

## Validation evidence

```bash
npm run typecheck
npm test
```

`npm run typecheck` and `npm test` are expected to remain clean
on the `phase-23a-mvp-schema-contract-draft` branch: Phase 23A
adds no new test, modifies no source file, and modifies no
script, fixture, or package file, so the existing Phase 4 demo
test, the Phase 5 hardening tests, the Phase 17B / 18 / 21A
shadow-integration pin, the Phase 19A review-packet pin, the
Phase 20B local-scaffold pin, the Phase 20C demo-shape pin, and
the existing handoff-doc validation tests are unaffected.

## Cross-references

- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md)
  — Phase 23A per-object MVP schema-contract draft (the primary
  Phase 23A deliverable).
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)
  — Phase 23A eleven-vector MVP conformance matrix (the
  companion Phase 23A deliverable).
- [`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md)
  — Phase 22A MVP decision-lock (the load-bearing five
  ADR-022-series decisions Phase 23A reads from).
- [`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md)
  — Hounfour status comment for issue #70 (drafted in
  Phase 22A; **filed by the user before Phase 23A began** at
  <https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4413876047>).
- [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md)
  — Phase 21B v8.6 schema-readiness lock (the substrate map
  Phase 23A's per-object spec aligns to).
- [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)
  — Phase 21A v8.6.x shadow inspection output (the source of
  the per-object MATCH / EXTEND / DISCOVERY_NOTE / DEFERRED
  dispositions).
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet (the load-bearing pending
  feedback gate this packet does not satisfy).
- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — Phase 16 per-delta accepted-with-adaptation table (delta
  numbering used throughout, including delta #7 schema-level
  closure and delta #8 still queued).
- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — Phase 16 disposition-counts intake doc.
- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
  [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
  [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
  [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
  [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md),
  [`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md)
  — Phase 20 lane.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index.
- [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order.
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 23A to link this doc and the two new spec docs.
- [`../decisions/0001-repo-purpose.md`](../decisions/0001-repo-purpose.md)
  — repo-purpose declaration.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
  [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
  [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
  [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
  [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — Phase 20A decision-lock series.
- [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md),
  [`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md),
  [`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md),
  [`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md),
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — Phase 22A decision-lock series (the load-bearing
  authorization gates Phase 23A reads from).
- [`../schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md)
  — Phase 6 per-candidate inventory (the schema-candidate-layer
  precursor to the Phase 23A per-object MVP contract).
- [`../schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
  — Phase 8 schema-candidate-layer conformance vectors (the
  precursor at the schema layer to Phase 23A's MVP-layer
  vectors).
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — the load-bearing class-vs-policy invariant.
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge's stable public API surface (unchanged by Phase 23A).
- [`../../src/straylight/types.ts`](../../src/straylight/types.ts)
  — current Straylight type definitions (unchanged by Phase 23A).
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  — private Hounfour alias module (unchanged by Phase 23A).
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  — local canonicalizer (unchanged by Phase 23A; gate
  `no-confirmed-subpath` unchanged).
- [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts)
  — local estate / transition application (unchanged by
  Phase 23A; `EstateTransition` deferral unchanged).
- [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts)
  — local recall execution (unchanged by Phase 23A).
- [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  — local commitment-root helper (unchanged by Phase 23A;
  ADR-020E unchanged).
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
  — fail-closed receipt + audit-chain invariants (the
  load-bearing "MVP host contract" pin per ADR-022D §4 that
  the Phase 23A vectors reference; unchanged by Phase 23A).
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — six-receipt-category pin per ADR-020D §6 that the Phase
  23A vectors reference; unchanged by Phase 23A.
