# Phase 20D — Recall Wedge endpoint-host boundary packet (local only)

> Status: Phase 20D. **Endpoint-boundary planning packet only, in
> `loa-straylight`.** This document converts the Phase 20B / Phase 20C
> local Recall Wedge evidence into a **future integration boundary**
> for a Dixie-hosted recall-inspection candidate and a Finn-hosted
> runtime-context fallback candidate, **without implementing either
> endpoint**. Phase 20D is **endpoint-boundary planning only**: it is
> **not endpoint-wired**, **not runtime-wired**, **not the full
> Recall Wedge**, **not governed recall in Finn / Dixie / Freeside
> runtime**, and **not Hounfour-side schema work**. Phase 20D is
> **Phase 20D only** — it does not advance any Phase 20A / Phase 20B
> / Phase 20C deferral.
>
> Phase 20D does **not** flip any wedge import, change `package.json`
> / `package-lock.json`, change the Hounfour dependency range or
> resolved patch, modify
> [`../../src/straylight/`](../../src/straylight/), modify
> [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> modify [`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
> or [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts),
> wire Finn / Dixie / Freeside runtime, add a Dixie endpoint, add a
> Finn endpoint, edit any sibling repo, implement `Challenge` or
> `EstateTransition`, reach into unexported Hounfour internals, add a
> `safeCanonicalize` subpath import, publish a public commitment root,
> add a network surface, change persistence, or touch `.loa/` /
> `.claude/`. It does **not** commit and does **not** open a PR. The
> actual Phase 20D PR is a separate, future event under teammate
> review.
>
> Companion docs (the Phase 20A decision-locks and Phase 20B / 20C
> evidence Phase 20D respects):
> [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
> [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
> [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md).

## Executive summary

Phase 20D is **endpoint-boundary planning only**. It writes down,
in one in-repo packet, what the *future* request/response boundary
between `loa-straylight` and a future Dixie-hosted recall-inspection
endpoint or Finn-hosted runtime-context endpoint *would* look like,
using only the Straylight-local objects already proved by Phase 20B
and Phase 20C (`RecallRequest`, `RecallPack`, `RecallReceipt`, plus
the audit-review pack/receipt pair and `audit_chain_verification`
shape that the Phase 20C demo emits).

**No endpoint is implemented.** **No sibling repo is edited.**
**No runtime wiring occurs.** Phase 20D introduces no new
dependency, no new HTTP / NATS / Discord / REST / Telegram surface,
no new `src/` module, no new `scripts/` module, no new fixture
directory, and no new public-surface re-export. The wedge's stable
public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)) is
unchanged. The Hounfour dependency
(`@0xhoneyjar/loa-hounfour@^8.5.0`) is unchanged. The private alias
module
([`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
is unchanged.

The boundary in this packet is **a candidate**, not a finalized
cross-repo API schema. Per ADR-020B, the *actual* endpoint host and
the *actual* request/response schema are locked by a later ADR once
a sibling-repo PR is opened under teammate review. Phase 20D
narrates the candidate boundary so a future PR (in Dixie or Finn)
can be written against a coherent target without re-deriving the
boundary from scratch.

## Boundary model — current evidence-backed contract candidates

The Phase 20B local-scaffold pin
([`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts))
and the Phase 20C demo-evidence pin
([`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts))
have already exercised the following local objects end-to-end on
the existing `executeRecall()` pipeline. Phase 20D nominates them
as the **current evidence-backed contract candidates** for any
future Dixie / Finn endpoint:

| Object | Local source of truth | Role in the candidate boundary |
|---|---|---|
| `RecallRequest` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | Candidate **input** envelope: actor / estate context, intent, environment frame, requested classes / scopes, signer / authority context. |
| `RecallPack` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | Candidate **output** body: `included`, `marked`, `redacted`, `excluded_summary` — the "what was made available, what was withheld, and why" projection over a single `RecallRequest`. |
| `RecallReceipt` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | Candidate **provenance** body: links a `RecallPack` to its policy decision, signer reference, included / marked assertion ids, redacted-count summary, and excluded-reason counts. The receipt's `pack_hash` matches the pack's `pack_hash`. |
| `audit_review` projection | [`scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts) — `DemoJsonOutput.audit_review` | Candidate **second pass** body: a `{ request, pack, receipt }` triple over the same estate in the `audit_review` frame. Surfaces revoked / forgotten / contested material as auditable, never as ordinary `usable` answers. |
| `audit_chain_verification` projection | [`scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts) — `DemoJsonOutput.audit_chain_verification` + [`AuditLog.verifyChain()`](../../src/straylight/audit.ts) | Candidate **integrity** body: `{ ok: true } \| { ok: false, broken_at, reason }` over the estate's per-estate hash chain after the transition + recall sequence. |

These objects are the same five top-level keys the Phase 20C
handoff doc names
([`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)
"Expected top-level JSON keys") and the same six receipt-content
categories the Phase 20B test pin enforces
([`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
"ADR-020D §4 — six receipt categories").

**These are candidates, not finalized cross-repo API schemas.** A
future Dixie or Finn endpoint may serialize them differently
(different JSON casing, different envelope, different content
negotiation, different paging), drop optional fields, or carry an
additional outer transport envelope (cursor, request-id, tenant
header, auth header). The local objects are what the *semantic*
contract pins; the *wire* contract is gated on the actual sibling-
repo PR per ADR-020B.

## Dixie-hosted recall-inspection candidate — responsibilities

ADR-020B nominates `loa-dixie` as the **default** MVP endpoint-host
candidate (recall / BFF / provenance candidate role per the
architecture spec §1.4 and the Phase 12 packet). Phase 20D restates
what that candidate *would* be responsible for at the boundary,
using only the local objects above.

**Good for, in a future integration:**

- **Operator / admin inspection.** A Dixie-hosted endpoint is
  well-shaped for a read-only inspection surface that lets an
  operator (admin, governance reviewer, audit-trail consumer)
  retrieve a precomputed `RecallPack` + `RecallReceipt` for a given
  `RecallRequest`, plus the corresponding `audit_review` projection
  and `audit_chain_verification` status, by pack id, receipt id, or
  request id.
- **Exposing or inspecting local recall evidence.** The
  Phase 20C demo's `.run/recall-demo.json` projection
  ([`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)
  "Expected output location") is a one-shot local artifact today;
  a Dixie-hosted candidate can serve the equivalent material across
  many requests / many estates without re-running the demo on the
  caller's machine, while still treating the local pack/receipt
  pair as the source of truth.
- **Surfacing the six ADR-020D receipt categories**
  ([`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  §4): *included*, *excluded*, *redacted*, *challenged*,
  *revoked*, *blocked-by-policy*. A Dixie-hosted candidate must
  preserve every category as the local pipeline emits it. Marked
  items are never `usable`. Excluded items always carry a named
  reason from the
  [`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  enumeration.

**Should NOT, in any future integration:**

- **Should not become the semantic owner of Straylight primitives.**
  Per ADR-020A
  ([`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)),
  Loa-Straylight remains the semantic owner of `Actor`, `Estate`,
  `Assertion`, `AssertionStatus`, `Keyring`, `Policy`, `Transition`,
  `RecallRequest`, `RecallPack`, `RecallReceipt`, `Challenge`,
  `Revocation`, `Commitment`, and `AuditEvent`. A Dixie-hosted
  endpoint reads / surfaces these primitives. It does **not**
  redefine them. It does **not** rename them on the wire in a way
  that hides the Straylight shape. Renaming the repo a primitive
  lives in does not transfer ownership.
- **Should not mutate estate state unless a later transition path
  is explicitly designed.** `loa-straylight`'s
  [`EstateStore`](../../src/straylight/estate.ts) is the
  transition executor; `admit` / `challenge` / `revoke` / `forget`
  emit `TransitionReceipt` + `AuditEvent`. A Dixie-hosted
  inspection endpoint reads packs / receipts; it does not, in this
  boundary, drive an `admit` / `challenge` / `revoke` / `forget`
  call. If a future ADR proposes a Dixie-hosted *mutation* path
  (governance-record write-back, redaction acknowledgement, etc.)
  that ADR is a separate decision and inherits the `policyForTransition`
  fail-closed boundary
  ([`finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  "Boundaries Finn must not own" — runtime enforcement remains a
  Finn candidate role, not a Dixie one).

The Dixie boundary at the
[`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
*owns vs must not own* table is the canonical statement for the
Phase 12 packet. Phase 20D narrows it to the inspection-surface
candidate role; Phase 20D does not widen it.

## Finn-hosted runtime-context fallback candidate — responsibilities

ADR-020B nominates `loa-finn` as the **fallback** endpoint-host
candidate, "if Phase 20B (or any later phase) requires immediate
runtime / model-context assembly — i.e. the endpoint must execute a
`RecallRequest` inside a runtime tool call rather than inspect a
precomputed `RecallPack`." Phase 20D restates what that candidate
*would* be responsible for at the boundary, using only the local
objects above.

**Good for, in a future integration:**

- **Immediate model-context assembly.** A Finn-hosted endpoint is
  well-shaped for the case where the next phase needs to *execute*
  a `RecallRequest` synchronously inside a runtime tool call — for
  instance, when a model-routing layer must build a context window
  from active assertions before issuing the next agent action.
- **Enforcing runtime policy and audit if/when integrated.** The
  Phase 10 packet
  ([`finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md),
  [`finn-runtime-boundary.md`](./finn-runtime-boundary.md),
  [`finn-enforcement-mapping.md`](./finn-enforcement-mapping.md))
  already stages Finn as the runtime / action-gateway / audit
  candidate. A Finn-hosted endpoint that executes a recall MUST
  validate the request against the same fail-closed semantics the
  local pipeline already pins
  ([`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)),
  emit a `RecallReceipt`, and persist the corresponding
  `recall_pack_emitted` audit row. Receipt-or-audit completeness
  is a Phase 20B-pinned invariant
  ([`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
  "Receipt-or-audit completeness") and is non-negotiable.

**Should NOT, in any future integration:**

- **Should not define canonical Straylight semantics.** Per
  ADR-020A and ADR-020C, Straylight remains the semantic owner;
  Hounfour remains the canonical schema *candidate*. A Finn-hosted
  endpoint executes a `RecallRequest` shape that Straylight
  defines; it does not author a new shape, rename a primitive on
  the wire, or fold class validation into policy
  ([`finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  "no class-vs-policy collapse").
- **Should not bypass local receipt semantics.** A Finn-hosted
  endpoint may not return a context-window payload "derived from"
  a recall without also producing the matching `RecallPack` +
  `RecallReceipt` pair the local pipeline produces. "No recall
  without receipt" is pinned by the Phase 10 boundary doc; Phase
  20D restates it as a candidate-boundary invariant. Per
  ADR-020D
  ([`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)),
  the receipt shape is unchanged from the local pipeline; Finn
  may persist or surface it, never re-mint or re-shape it.

## Shared future contract candidate

Pulling the Dixie-candidate and Finn-candidate boundaries together,
the *shared* shape a future endpoint would expose at the wire
boundary, using only local Straylight objects:

### Input candidate — `RecallRequest`-equivalent payload

The candidate input carries, in the local `RecallRequest` shape
([`src/straylight/types.ts`](../../src/straylight/types.ts)):

- **actor / estate context.** Which `Actor` / `ActorEstate` the
  recall is for, including any tenant-scoping the call requires.
- **task / intent.** What the caller is trying to do — the
  high-level intent that motivates the recall, expressed in a
  way that policy can route on without re-classifying the assertion
  shapes.
- **environment frame.** One of the `EnvironmentFrame` values
  defined locally
  ([`src/straylight/types.ts`](../../src/straylight/types.ts) —
  `public_*` / `tenant_*` / `audit_review` / etc.). Frame governs
  redaction and excluded-reason routing in the local pipeline; the
  candidate boundary preserves that mapping.
- **requested classes / scopes.** Which `AssertionClass` values
  and which `PrivacyScope` values the caller is requesting. The
  candidate boundary preserves "structural validity is not
  authorization"
  ([`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)):
  shape passes class validation; only policy + signer competence
  authorize.
- **caller / authority context.** The signing / authority context
  for the caller (signer reference, competence rule reference,
  authority chain). The keyring discipline at
  [`src/straylight/keyring.ts`](../../src/straylight/keyring.ts)
  is the local source of truth and remains so at the candidate
  boundary.

### Output candidate — body

The candidate output carries, in the local objects:

- **recall pack.** The `RecallPack` projection: `included`,
  `marked`, `redacted`, `excluded_summary`. Marked items are never
  `usable`; excluded items always carry a named reason.
- **receipt.** The `RecallReceipt` projection: included assertion
  ids, marked assertion ids, redacted count, excluded-reason
  counts, policy decision reference, signer reference,
  `pack_hash`, `receipt_hash`.
- **audit review.** The `audit_review` `{ request, pack, receipt }`
  triple — proves revoked / forgotten / contested material is
  *auditable* under elevated review without leaking back into
  ordinary `usable` answers.
- **exclusion / redaction / challenge / revocation summaries.**
  The named-reason enumerations the local pipeline already emits
  (`status_revoked`, `status_forgotten_from_recall`,
  `privacy_actor_private_in_public_frame`,
  `privacy_tenant_in_public_frame`, `class_not_requested:<class>`,
  etc.).
- **audit chain verification.** The
  `{ ok: true } \| { ok: false, broken_at, reason }` projection
  from `AuditLog.verifyChain()`.

### Errors / denials — candidate

The candidate boundary surfaces denials via the same fail-closed
states the local pipeline already emits:

- **policy denied.** `policy_decision.decision === 'deny'` with a
  reason from the local enumeration (e.g. `unknown_signer`,
  `policy_unavailable_for_transition`,
  `competence_rule_missing`). `pack` and `receipt` may be
  undefined; the audit log carries a `transition_denied` event.
- **invalid request.** Class validation fails
  (`validateRecallRequest(req).valid === false`). The candidate
  endpoint MUST surface the local validation errors, not invent
  new ones.
- **unavailable transition.** A request type the runtime cannot
  satisfy in the current frame (e.g. `audit_review`-only material
  requested in a `public_*` frame, or a transition that has not
  been admitted into the wedge yet). The local
  `dispositionFor()` and `policyForRecallRequest()` paths in
  [`src/straylight/policy.ts`](../../src/straylight/policy.ts)
  are the source of truth.
- **missing competence.** The signer is on the keyring but lacks
  a competence rule for the requested transition class. The
  candidate boundary inherits this from
  [`evaluateCompetence`](../../src/straylight/keyring.ts).
- **unsupported runtime host.** A request shape that demands a
  runtime-only path (e.g. immediate model-context assembly) on a
  Dixie-hosted (inspection-only) candidate, or vice versa. The
  candidate boundary MUST refuse rather than silently degrade,
  per ADR-020B's host-choice gating.

The candidate enumeration is **not exhaustive** and **not
finalized**. Real wire serialization (status codes, error envelope
shape, retry semantics) is gated on the actual sibling-repo PR
under teammate review.

## Ownership boundaries — who owns what at this boundary

| Repo | Owns / may own at the candidate boundary | Phase 20D status |
|---|---|---|
| `loa-straylight` | **Owns Straylight semantics.** The primitive set named by ADR-020A: `Actor`, `Estate`, `Assertion`, `AssertionStatus`, `Keyring`, `Policy`, `Transition`, `RecallRequest`, `RecallPack`, `RecallReceipt`, `Challenge`, `Revocation`, `Commitment`, `AuditEvent`. The local source of truth is `src/straylight/`, re-exported through [`src/straylight/index.ts`](../../src/straylight/index.ts) per the [package boundary](../mvp/package-boundary.md). | **Confirmed for Phase 20D.** Unchanged from ADR-020A. |
| `loa-hounfour` | **May later own schema / protocol exports.** Per ADR-020C, Hounfour remains the canonical schema *candidate*. When (and only when) a sibling-repo PR ships canonical shapes for primitives Straylight already owns, schema *shape* ownership migrates to Hounfour by adoption — never by silent semantic redefinition. | **Candidate, not yet wired.** Awaiting Jani / teammate response on [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70). `Challenge` and `EstateTransition` remain deferred to v8.6.0 / cycle-005. `safeCanonicalize` exported subpath remains deferred under gate `no-confirmed-subpath` (Phase 18). |
| `loa-dixie` | **May later host the recall-inspection endpoint.** Per ADR-020B, default endpoint-host candidate; per Phase 12, recall / BFF / provenance candidate role. Surfaces local recall evidence; does not redefine Straylight primitives; does not own runtime enforcement. | **Candidate, not yet wired.** No `loa-dixie` PR has been opened. No Dixie endpoint exists in runtime today. |
| `loa-finn` | **May later host the runtime / context-assembly endpoint.** Per ADR-020B, fallback endpoint-host candidate; per Phase 10, runtime / action-gateway / audit candidate role. Executes `RecallRequest` inside a policy-validated, signer-competent, receipt-emitting boundary. | **Candidate, not yet wired.** No `loa-finn` PR has been opened. No Finn runtime endpoint exists today. |
| `loa-freeside` | **May later consume app / community surfaces.** Per Phase 14, community / bot / admin / tenant surface candidate. Consumes Dixie / Finn receipts; never re-mints them; never replaces Dixie / Finn for governed recall. | **Candidate, not yet wired.** Per [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md), Freeside cannot land before Dixie / Finn settle. |
| **No sibling repo** | **Owns Phase 20D output.** Phase 20D is in-repo planning; no sibling repo has visibility into, dependency on, or ownership over this packet's content beyond the cross-repo handoff index that links it. | Confirmed for Phase 20D. |

## Implementation blockers — what Phase 20D does not remove

Phase 20D, like Phase 20A / 20B / 20C, leaves every load-bearing
implementation blocker in place:

- **Awaiting Jani / teammate response** on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
  No Hounfour-side schema work or Hounfour dependency change
  begins until that response is in.
- **Hounfour v8.6.0 / cycle-005** has not shipped. `Challenge`
  and `EstateTransition` adoption remain deferred until it does.
- **`safeCanonicalize` exported subpath** has not been confirmed.
  No subpath import is permitted until the v8.5.x exports map
  declares one (or a Hounfour-side blocker is opened and
  resolved).
- **Sibling-repo PRs are unmerged.** Until a Finn / Dixie /
  Freeside PR lands under teammate review, the wedge owns every
  primitive those packets describe (per ADR-020A).
- **No Dixie endpoint exists.** ADR-020B's default endpoint-host
  recommendation is a *recommendation*. The endpoint does not
  exist in runtime today.
- **No Finn endpoint exists.** ADR-020B's fallback endpoint-host
  recommendation is a *recommendation*. The endpoint does not
  exist in runtime today.
- **Threat-model expansion is gated.** Any phase that adds a
  network surface, real cryptography, or onchain publication must
  update [`docs/mvp/threat-model.md`](../mvp/threat-model.md)
  before shipping.

## What Phase 20D explicitly did *not* do

Phase 20D inherits every Phase 20A / Phase 20B / Phase 20C
non-scope item, plus the following:

- **No Dixie endpoint.** No HTTP / NATS / REST / Discord /
  Telegram surface is added. No `loa-dixie` import is added. No
  Dixie-side fixture is consumed.
- **No Finn endpoint.** No HTTP / NATS / REST / Discord / Telegram
  surface is added. No `loa-finn` import is added. No Finn-side
  fixture is consumed.
- **No Freeside integration.** No bot / admin / community surface
  is added. No Discord / Telegram / REST / NATS surface. No
  tenant-context shim. No `loa-freeside` import.
- **No Hounfour schemas.** No new schema files authored. No
  Hounfour-side schema work begun. Hounfour-side work remains
  gated by [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
- **No `Challenge` implementation.** Deferred to Hounfour v8.6.0 /
  cycle-005 per ADR-020C and the Phase 16 delta.
- **No `EstateTransition` implementation.** Deferred to Hounfour
  v8.6.0 / cycle-005 per ADR-020C and the Phase 16 delta.
- **No `safeCanonicalize` subpath work.** The
  `no-confirmed-subpath` gate (Phase 18) is unchanged. The
  Straylight-local canonicalizer
  ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
  remains the canonicalization implementation.
- **No reach into unexported Hounfour internals.** The alias
  module continues to use only declared subpaths.
- **No public anchors.** Per ADR-020E. The local helper at
  [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  is unchanged. No publishing surface is added. No onchain
  integration is added.
- **No persistence wiring.** Per ADR-020D. No new `StorageAdapter`
  implementation, no Postgres / Finn / Dixie / Freeside storage
  shim. The existing `InMemoryStorage` and `JsonlStorage` adapters
  are unchanged.
- **No `package.json` / `package-lock.json` changes.** The Hounfour
  dependency range and resolved patch are unchanged.
- **No `src/` changes.** The wedge's stable public API surface
  ([`src/straylight/index.ts`](../../src/straylight/index.ts)) is
  unchanged. No re-export is added. No re-export is removed. No
  internal module is edited.
- **No `scripts/` changes.** The demo CLI in
  [`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
  and the demo library in
  [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts)
  are unchanged.
- **No fixture changes.** The fixtures under
  [`../../fixtures/`](../../fixtures/) are unchanged.
- **No new tests.** Phase 20D, like Phase 20A, is a docs-only
  decision-/-boundary packet; the Phase 20B per-category receipt
  pins and the Phase 20C demo-shape pin already cover the local
  evidence this packet narrates.
- **No re-export of
  [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  from `index.ts`.** The alias module remains private per
  Phase 17B / 19A.
- **No new HTTP / network surface.** The threat model in
  [`../mvp/threat-model.md`](../mvp/threat-model.md) lists network
  adversary as out-of-scope; Phase 20D does not move it in-scope.
- **No new dependencies in `package.json`.**
- **No `.loa/` / `.claude/` edits.**
- **No auth token printing or writing.** The user-scoped
  `~/.npmrc` Hounfour auth (Phase 17B) remains out-of-band; the
  project `.npmrc` remains registry-only.
- **No commit, no push, no PR.**

## What this packet does *not* claim

For symmetry with the boundary model above, and so a reviewer
cannot misread the candidate boundary as proof of something it
does not show, Phase 20D explicitly does **not** claim:

- **Not** "a Dixie endpoint exists." ADR-020B's default
  endpoint-host candidate is a *recommendation*. It is not wired
  in any runtime. No `loa-dixie` PR has been opened. Phase 20D is
  endpoint-boundary planning only — **not endpoint-wired**.
- **Not** "a Finn endpoint exists." ADR-020B's fallback
  endpoint-host candidate is a *recommendation*. It is not wired
  in any runtime. No `loa-finn` PR has been opened. Phase 20D is
  endpoint-boundary planning only — **not endpoint-wired** and
  **not runtime-wired**.
- **Not** "governed recall exists in runtime." None of the
  sibling-repo handoff packets has been merged. The wedge is a
  local TypeScript library + a local CLI demo; it is not a
  runtime-wired governed-recall surface.
- **Not** "Hounfour owns Straylight schemas." Per ADR-020A and
  ADR-020C, Loa-Straylight remains the semantic owner of every
  Recall Wedge primitive. Hounfour remains the canonical schema
  *candidate*, gated by issue #70.
- **Not** "the full Recall Wedge is implemented." Phase 20D is
  the **endpoint-boundary** planning packet that follows Phase 20C.
  The full Recall Wedge (governed recall in Finn / Dixie /
  Freeside runtime, with sibling-repo PRs merged under teammate
  review) is **not** delivered by Phase 20D.
- **Not** "`Challenge` exists." Deferred to Hounfour v8.6.0 /
  cycle-005.
- **Not** "`EstateTransition` exists." Deferred to Hounfour
  v8.6.0 / cycle-005.
- **Not** "public anchoring exists." Per ADR-020E, the local
  commitment-root helper is unchanged and unpublished.
- **Not** "the wedge has a network surface." Per the threat model,
  network adversary remains out-of-scope.

This is **endpoint-boundary planning only**. The boundary is a
**candidate**, not a finalized cross-repo API schema. The Recall
Wedge is **not endpoint-wired** and **not runtime-wired** by
Phase 20D. This is **Phase 20D only** — a **future integration**
target, not a delivered integration.

## What remains deferred

Phase 20D does not move any of the Phase 20A / Phase 20B /
Phase 20C deferrals forward. The following remain explicitly
deferred and are recorded here so a reviewer can confirm Phase 20D
did not silently advance them:

- **Sibling-repo runtime wiring** (Finn / Dixie / Freeside).
  Each remains a future, separate, sibling-repo PR under teammate
  review per
  [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).
- **Actual endpoint host placement.** ADR-020B's *recommendation*
  (Dixie default, Finn fallback) is unchanged. The *placement* is
  locked by a later ADR once a sibling-repo PR is opened.
- **Wire-shape finalization.** The candidate boundary above is
  semantic; the wire shape (status codes, error envelope, paging,
  authentication, transport) is gated on the sibling-repo PR.
- **`Challenge` and `EstateTransition` schema adoption.** Both
  remain on the Hounfour v8.6.0 / cycle-005 trajectory.
- **`safeCanonicalize` subpath migration.** Deferred under gate
  `no-confirmed-subpath` (Phase 18).
- **`audit-event-transition` resolution path.** Recorded as
  `DISCOVERY_NOTE` (Phase 18); resolution is a deliberate
  later-phase decision.
- **Public anchor / commitment-root publication.** Gated on the
  seven future-requirement bullets in ADR-020E.
- **Production database / persistence substrate.** Gated on
  ADR-020D + the relevant sibling-repo handoff packet.
- **Hounfour-side response on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).**
  No Hounfour-side schema work, Hounfour dependency change, or
  public-surface namespace flip happens in Phase 20D.

## Cross-references

- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
  — Phase 20A decision-lock readiness packet.
- [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)
  — Phase 20A-staged Phase 20B candidate scope.
- [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
  — Phase 20B local-scaffold summary; the per-category receipt
  pins this packet's candidate boundary references.
- [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)
  — Phase 20C demo / evidence summary; the five top-level JSON
  keys this packet's candidate boundary references.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  — semantic-owner decision-lock.
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
  — MVP endpoint-host recommendation + fallback (the load-bearing
  decision Phase 20D narrates against).
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
  — schema-namespace strategy + Phase 20A deferrals.
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  — receipt-ownership + persistence-deferral decision-lock.
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — commitment-root / public-anchor deferral.
- [`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
  [`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
  [`dixie-recall-mapping.md`](./dixie-recall-mapping.md)
  — Phase 12 Dixie packet (the boundary the Dixie-hosted
  inspection candidate would consume).
- [`finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md),
  [`finn-runtime-boundary.md`](./finn-runtime-boundary.md),
  [`finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
  — Phase 10 Finn packet (the boundary the Finn-hosted
  runtime-context candidate would consume).
- [`freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md)
  — Phase 14 Freeside boundary (consumes Dixie / Finn; not a
  Phase 20D candidate host).
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet.
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  — Phase 17B / 18 shadow-integration findings.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index (updated in Phase 20D to link
  this doc).
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 20D to link this doc.
- [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts)
  — demo library that defines `runDemo()`, `toDemoJson()`, and the
  `DemoJsonOutput` shape this packet's boundary model references
  (unchanged by Phase 20D).
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — Phase 20B per-category receipt pins (unchanged by Phase 20D).
- [`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts)
  — Phase 20C demo-shape pin (unchanged by Phase 20D).
