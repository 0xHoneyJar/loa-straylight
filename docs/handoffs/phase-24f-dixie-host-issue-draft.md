# Phase 24F — Dixie host issue / PR handoff draft (docs-only)

> Status: Phase 24F. **Handoff prep only, in `loa-straylight`.** This
> packet authors a narrow, paste-ready Dixie-side GitHub-issue / first-
> PR draft inside `loa-straylight`. **The draft has not been filed
> against `loa-dixie`.** Filing the issue / opening the PR / merging
> the integration is a future, separate, sibling-repo event under
> teammate review. Phase 24F adds **no source**, **no test**, **no
> fixture**, **no script**, **no `package.json`** / **no
> `package-lock.json`** change, **no schema**, **no ADR**, **no new
> spec**, **no demo / evidence artifact**, **no edit to any sibling
> repo**, **no GitHub issue / comment / PR**, and **no flatline /
> bridgebuilder review request**.
>
> Phase 24F does **not** flip a wedge import; does **not** edit
> [`../../src/straylight/index.ts`](../../src/straylight/index.ts) or
> any module under
> [`../../src/straylight/`](../../src/straylight/) (including the
> Phase 24C/24D host scaffold under
> [`../../src/straylight/host/`](../../src/straylight/host/)); does
> **not** re-export the host barrel through the wedge public API;
> does **not** consume Hounfour `main` or any unpublished commit;
> does **not** import the Hounfour `#116` five-step conformance
> corpus; does **not** adopt the `0xhoneyjar:straylight:*` audit-
> event prefix family into the Straylight public surface; does
> **not** adopt the `recall-wedge` Hounfour conformance category
> into the Straylight test suite; does **not** wire `loa-dixie` /
> `loa-finn` / `loa-freeside`; does **not** add an HTTP / NATS /
> RPC / BFF / Discord / Telegram surface; does **not** declare any
> Dixie endpoint route as binding; does **not** publish a public
> commitment root; does **not** advance any ADR-022E gate; and
> does **not** touch `.loa/` / `.loa.config.yaml` / `.claude/` /
> `.beads/` / `.run/` / `.github/` / `grimoires/loa/a2a/`. It does
> **not** commit and does **not** open a PR. The Phase 19A pending
> feedback gate on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> remains pending and is **not** advanced by Phase 24F.
>
> Companion docs:
> [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)
> (the broader per-surface Dixie reading; Phase 24F cites this as
> the authoritative source for per-surface behavior),
> [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md),
> [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md),
> [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md),
> [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md),
> [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
> [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md),
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md),
> [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
> (Phase 24E refresh appended; this draft is narrower and does not
> rewrite it),
> [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
> (Phase 24E refresh appended),
> [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md)
> (Phase 24E refresh appended).

## Executive summary

Phase 24F creates a **paste-ready Dixie-side GitHub-issue / first-PR
handoff draft** inside `loa-straylight`. The draft specifies the
*first* future `loa-dixie` PR that consumes the Phase 24C/24D
TypeScript host scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) — and only
that first PR. The first-PR scope is **scaffold-consumption-only**:
the future Dixie PR imports the six host handler contracts as its
source of truth, wires explicit injected dependencies
(`TenantResolver` required; `IntakeDenyLog` optional), surfaces typed
refusals verbatim, and preserves the Phase 24C/24D host semantics —
**without** authoring any operator-facing rendering, **without**
declaring any HTTP / NATS / RPC / BFF route shape as binding, and
**without** widening vector scope beyond Phase 24B's vectors 1–8.

Phase 24F is **narrower** than Phase 24E. Phase 24E is the broader
per-surface Dixie reading (inspect / relay / render / must-not-invent
/ typed refusals / receipt-category vocabulary for each of the six
surfaces) and remains the authoritative source for per-surface
behavior. Phase 24F cites Phase 24E as that authoritative source and
focuses on what *one specific future Dixie PR* must consume, must
wire, and must refuse — packaged so a future Dixie-side reviewer can
read a small, focused first-PR scope statement without re-deriving it
from the 796-line Phase 24E packet or the broader Phase 12 issue.

The packet has four load-bearing properties under review:

1. **Handoff prep only; not filed.** The paste-ready issue body
   below is in-repo text. It has not been filed against
   [`0xHoneyJar/loa-dixie`](https://github.com/0xHoneyJar/loa-dixie),
   has not been posted as a comment, has not been opened as a PR,
   and is not authorized to be filed by Phase 24F itself.
2. **Scaffold-consumption-only first-PR cut.** The first future
   Dixie PR adopts the six handler contracts as a dependency-
   stand-in seam — it imports the handler signatures, wires
   injected deps, and round-trips typed refusals — but it does
   **not** yet ship operator-facing rendering, does **not** wire a
   transport, and does **not** decide a route shape.
3. **Transport-neutral.** No HTTP / NATS / RPC / BFF / Discord /
   Telegram surface is declared binding by this draft. Any
   transport example is illustrative only and is explicitly
   labelled future / non-binding / out of scope for the first PR.
4. **Phase 24A/24B/24C/24D/24E non-scope is fully preserved.** No
   Hounfour `#116` adoption; no `0xhoneyjar:straylight:*`
   adoption; no `recall-wedge` category adoption; no Hounfour
   `main` consumption; no `Challenge` / `EstateTransition` /
   `safeCanonicalize` / `AuditEvent`-rename adoption; no public
   commitment root; no sibling-repo wiring; no Straylight-side
   endpoint; no vector 9 / 10 / 11 widening.

## Background / lineage

| Phase | What landed | Status |
|---|---|---|
| **Phase 24A** | Hounfour `#116` intake + Dixie-first host decision (ADR-024A–D) | Merged |
| **Phase 24B** | Dixie recall-host plan: ADR-024E + two specs + summary handoff + Phase 12 refreshes | Merged |
| **Phase 24C** (PR #29) | Local TypeScript host scaffold under `src/straylight/host/`: six handler exports + tenant-resolver contract + in-memory intake-deny log + local barrel | Merged |
| **Phase 24D** (PR #30) | Local host-scaffold hardening: six non-blocking review concerns pinned into the existing surfaces without shape change | Merged |
| **Phase 24E** (PR #31) | Docs-only Dixie host handoff packet: six per-surface Dixie readings + per-surface handler-mapping table + dependency-injection contract + restated Phase 24C deviations + restated Phase 24D hardening implications + vector mapping + Dixie-side supplemental acceptance criteria | Merged |
| **Phase 24F** *(this packet)* | Paste-ready, narrowly-scoped first-PR Dixie-side issue draft (handoff prep only; not filed) | This packet |

Hounfour `#116` outputs remain **upstream substrate only** and are
**not adopted** into the Straylight runtime or public surface on
the strength of `#116` alone. Adoption follows ADR-024C's Event A +
Event B + Event C discipline (Hounfour publishes a release that
includes the `#116` outputs; a separate ADR adopts the new range; a
shadow-integration check validates the adoption) and a separate
Dixie-side ADR; each is necessary, none is sufficient on its own.
Phase 24F pre-authorises none of them.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24F. ADR-024D §3.b
explicitly allows Phase 24B / 24C / 24D / 24E / 24F to proceed
under the "local additive scaffolding only" rule without satisfying
the gate; advancing the gate is a separate, sibling-repo, human-
reviewed event.

## Paste-ready issue body (for future filing against `loa-dixie`)

The block between the BEGIN and END markers below is the **paste-
ready GitHub-issue body** for a future, separately-authored,
human-reviewed filing against
[`0xHoneyJar/loa-dixie`](https://github.com/0xHoneyJar/loa-dixie).
It is **not** filed by Phase 24F. The block is in-repo text only.
A future filer SHOULD copy the block verbatim (or with minor edits)
into the eventual GitHub issue body; the surrounding sections of
this document are not for paste.

<!-- BEGIN paste-ready issue body — do not file as part of Phase 24F -->

### Title

> Adopt the Straylight Recall Wedge host scaffold as the first
> `loa-dixie` integration seam (scaffold-consumption-only;
> transport-neutral)

### Summary

`loa-straylight` PR #29 (Phase 24C) and PR #30 (Phase 24D) landed a
six-surface TypeScript host scaffold under
`loa-straylight/src/straylight/host/` expressing the recall-pack-
inspection MVP host (ADR-024E). PR #31 (Phase 24E) staged the
in-repo Dixie-side reading for that scaffold. This issue requests
that `loa-dixie` opens a **first PR** that consumes the host
scaffold as Dixie's source of truth for recall-pack-inspection
behavior, wires the explicit injected dependencies the host
requires, and surfaces typed refusals verbatim — under a
**scaffold-consumption-only**, **transport-neutral** scope.

The first PR is intentionally narrow:

- It **consumes** the six host handler contracts.
- It **wires** the `TenantResolver` (required) and `IntakeDenyLog`
  (optional) injected dependencies behind small Dixie-side
  adapters.
- It **round-trips** typed refusals verbatim.
- It **preserves** the Phase 24C/24D host semantics (wedge
  produces, host inspects, fail-closed everywhere).
- It does **not** ship operator-facing rendering yet.
- It does **not** declare any HTTP / NATS / RPC / BFF route
  shape as binding.
- It does **not** widen vector scope beyond Phase 24B's vectors
  1–8.

Operator-facing rendering, transport-layer wiring, the review-
queue management surface, and any vector-9 / 10 / 11 widening are
out of scope for this first PR and are reserved for one or more
follow-up PRs each gated by a separate Dixie-side ADR or
implementation plan.

The authoritative per-surface behavior pin is the Phase 24E packet
at `loa-straylight/docs/handoffs/phase-24e-dixie-host-handoff-
packet.md`. The authoritative MVP host contract is at
`loa-straylight/docs/specs/dixie-recall-host-mvp-contract.md`.
The authoritative validation-vector matrix is at
`loa-straylight/docs/specs/dixie-recall-host-validation-
vectors.md`. This issue does not restate them; it scopes the
first Dixie-side PR that adopts them.

### Background

The Straylight Recall Wedge ships a thin control plane over a
governed actor estate. The wedge's primitives — `Assertion`,
`Keyring`, `EstateTransition`, `Challenge`, `Revocation`,
`ForgetRecord`, `RecallRequest`, `RecallPack`, `RecallReceipt`,
`AuditEvent`, `CommitmentRoot` — are produced inside the wedge
and exercised through `EstateStore`, `executeRecall`, `AuditLog`,
and `policyForX(...)`.

PR #29 / Phase 24C added six TypeScript host-surface modules
under `loa-straylight/src/straylight/host/` that express the
recall-pack-inspection MVP host shape — they inspect / walk /
render the wedge's existing recall, receipt, exclusion,
provenance, audit-chain, and estate-summary output. They do
**not** produce new estate truth, do **not** compute
`dispositionFor`, do **not** reinterpret `privacy_scope`, do
**not** run `verifyChain` as their own source of truth, and do
**not** publish a commitment root.

PR #30 / Phase 24D tightened six non-blocking review concerns
into the existing scaffold without changing any response shape
(empty-tenant fail-closed; tenant-scoped parent under
`public_discord` refused; optional Surface 6 intake-deny log;
inline documentation pinning `needs_review` ≠ denial; inline
documentation pinning unknown wedge exclusion reason →
safe-default `excluded` with verbatim `raw_reason`; tightened
Surface 2 receipt-not-found assertion).

PR #31 / Phase 24E produced the in-repo Dixie-side reading of
that scaffold — what Dixie must inspect, relay, render, and not
invent for each of the six surfaces, plus the dependency-
injection contract and the supplemental Dixie-side acceptance
criteria.

The host barrel at
`loa-straylight/src/straylight/host/index.ts` is **intentionally
NOT re-exported** through the wedge public API at
`loa-straylight/src/straylight/index.ts`. Consumers — this future
Dixie PR included — import the host barrel directly. The wedge
public surface remains byte-identical to its pre-Phase-24C
state.

### First PR scope

The first `loa-dixie` PR adopting the host scaffold MUST be
**scaffold-consumption-only**. Concretely, the first PR:

1. **Adds Loa-Straylight as a Dixie-side dependency** under whatever
   range and resolution mechanism `loa-dixie` already uses for
   internal Loa packages. The exact dependency declaration shape is
   Dixie-side; this issue does not specify it.
2. **Imports the six host handler contracts** from the local
   Straylight host barrel: `handleRecallIntake`,
   `handleReceiptRetrieval`, `handleExclusionDisplay`,
   `handleProvenanceWalk`, `handleAuditChainLookup`,
   `handleEstateSummary` (plus their `IntakeDeps` / `ReceiptDeps` /
   `ProvenanceDeps` / `AuditLookupDeps` / `EstateSummaryDeps`
   dependency types).
3. **Wires `TenantResolver` as a required injected dependency** with
   a Dixie-side adapter that derives tenant from authenticated
   session context (not from request body content, not from a
   "default tenant" fallback). An empty `callerTenant`, an empty
   resolver result, or an `undefined` resolver result MUST be
   treated identically and MUST surface `tenant_resolution_failed`
   verbatim (no permissive default; no silent fallback).
4. **Wires `IntakeDenyLog` as an optional injected dependency** with
   a Dixie-side adapter the first PR MAY ship as an in-memory or
   trivially-persisted log (durability semantics are a follow-up
   PR). When wired, the same `IntakeDenyLog` instance SHOULD be
   injected into Surfaces 1, 2, 4, and 6, so an auditor can
   correlate refusals per tenant across all four refusing surfaces.
5. **Surfaces typed refusals verbatim** at the Dixie boundary — a
   `RecallIntakeResponse` with `outcome: 'denied'` and classified
   `DeniedReason`, or a `ReceiptRetrievalResponse` with `outcome:
   'not_found'` and typed reason, or a `ProvenanceWalkResponse`
   with `outcome: 'refused'` and typed reason, etc. — without
   rewriting any refusal as a soft warning, without inventing
   permissive defaults, and without inferring tenant identity from
   a missing record.
6. **Preserves Phase 24C/24D host semantics** — wedge produces, host
   inspects, fail-closed everywhere — by not interposing any Dixie-
   side logic between the handler return value and the Dixie
   surface output other than the explicit dependency wiring.
7. **Adds Dixie-side tests** that exercise the six surfaces against
   the wedge's existing primitives through the host handler entry
   points. The tests MUST exercise vectors 1–8 of the Phase 24B
   matrix and MUST NOT exercise vector 9 / 10 / 11. The tests MAY
   import the Straylight host barrel directly; the tests MUST NOT
   re-implement wedge primitives Dixie-side.
8. Does **not** ship operator-facing rendering.
9. Does **not** declare any HTTP / NATS / RPC / BFF route shape as
   binding.
10. Does **not** widen the host's two-value `HostFrame`
    (`actor_private` / `public_discord`) into the wedge's seven-
    value `EnvironmentFrame`, and does **not** add a new caller-
    frame value.
11. Does **not** import Hounfour `#116` outputs directly, does
    **not** adopt the `0xhoneyjar:straylight:*` prefix family,
    does **not** adopt the `recall-wedge` conformance category,
    and does **not** consume Hounfour `main` / commit-SHA / git-
    source.
12. Does **not** publish a public commitment root.

### Six surface contracts

For each surface, the first Dixie PR MAY consume the listed handler
contract, MAY relay the wedge's verbatim output, MAY surface typed
refusals verbatim, and MUST NOT produce or reinterpret the listed
wedge concepts. Operator-facing rendering is **deferred to a
follow-up PR** and is out of scope for the first PR. The
authoritative per-surface behavior pin is Phase 24E §"Six per-
surface Dixie readings".

#### Surface 1 — Recall intake / response

- **Consume.** `handleRecallIntake(input, deps)` → discriminated
  union: `{ outcome: 'served', recall_pack, recall_receipt }` |
  `{ outcome: 'denied', audit_event_id, denied_reason, raw_reasons
  }` | `{ outcome: 'needs_review', review_queue_id, audit_event_id
  }`. `IntakeDeps` requires `TenantResolver` + `IntakeDenyLog` +
  wedge `EstateStore` / `AuditLog` / `StorageAdapter`.
- **Relay.** Wedge-emitted `RecallPack` + `RecallReceipt` verbatim
  on `served`; `audit_event_id` + classified `DeniedReason` +
  verbatim `raw_reasons[]` on `denied`; deterministic
  `review_queue_id` handle + wedge `audit_event_id` on
  `needs_review`.
- **Render (deferred).** Operator-friendly views of the served
  pack, the denial classification, or the review-queue handle are
  follow-up-PR scope.
- **Must not produce / reinterpret.** Dixie MUST NOT instantiate
  `RecallPack` or `RecallReceipt`; MUST NOT synthesise a receipt on
  `denied` or `needs_review`; MUST NOT run `executeRecall` ahead of
  the wedge; MUST NOT re-classify a `DeniedReason`; MUST NOT
  promote `needs_review` into a denial or vice versa.
- **Typed refusals surfaced verbatim.**
  `cross_tenant_recall_refused`, `policy_unavailable`,
  `signer_not_competent`, `storage_unavailable`,
  `blocked_by_policy`, `privacy_scope_refusal`, `frame_unsupported`,
  `tenant_resolution_failed`, `class_validation_failed`.
- **Transport.** Out of scope for the first PR. Any transport
  example is illustrative only and is non-binding.

#### Surface 2 — Receipt retrieval / display

- **Consume.** `handleReceiptRetrieval(input, deps)` → `{ outcome:
  'found', receipt }` | `{ outcome: 'not_found', reason }`.
  `ReceiptDeps` requires `TenantResolver` + `IntakeDenyLog` +
  wedge `StorageAdapter` / `AuditLog`.
- **Relay.** Wedge-persisted `RecallReceipt` verbatim under the
  requested `detail_level`; typed `not_found` reason verbatim.
- **Render (deferred).** Operator views of `pack_hash`,
  `receipt_hash`, signer envelope summary, `policy_decision`
  summary, and `commitment_ref` (if present) are follow-up-PR
  scope.
- **Must not produce / reinterpret.** Dixie MUST NOT synthesise a
  receipt for an unknown `receipt_id`; MUST NOT infer tenant
  identity from a missing record (Phase 24D concern 6); MUST NOT
  downgrade `debug` to `standard` on its own.
- **Typed refusals surfaced verbatim.** `unknown_receipt_id`,
  `cross_tenant_refused`, `tenant_resolution_failed`.
- **Transport.** Out of scope for the first PR.

#### Surface 3 — Excluded-assertion reason display

- **Consume.** `handleExclusionDisplay(input, deps)` → pure render
  over the wedge-served `RecallPack.excluded_summary[]` /
  `redacted[]` / `marked[]`, surfaced as `excluded_aggregates[]` /
  `redacted_aggregates[]` (aggregate by reason; Phase 24C
  deviation #2) / `marked[]` (per-assertion).
- **Relay.** Each `excluded_aggregates[]` entry's `category` (one
  of the six receipt categories), wedge-derived `raw_reason`, and
  `count`; each `marked[]` entry per-assertion including
  `category` + `raw_reason`. Unknown wedge reasons surface with
  `category: 'excluded'` (safe default per Phase 24D concern 5)
  and the verbatim wedge string preserved in `raw_reason`.
- **Render (deferred).** Operator-friendly reason text keyed to
  the `category` enum is follow-up-PR scope.
- **Must not produce / reinterpret.** Dixie MUST NOT invent a
  reason not in the pack; MUST NOT promote an unrecognised wedge
  reason into a narrower category (`revoked` / `challenged`); MUST
  NOT recompute `dispositionFor`; MUST NOT synthesise per-
  assertion granularity on aggregates.
- **Typed refusals.** None at Surface 3 itself — Surface 3 is a
  pure render; the upstream pack already encodes the wedge's fail-
  closed posture.
- **Transport.** Out of scope for the first PR.

#### Surface 4 — Provenance inspection

- **Consume.** `handleProvenanceWalk(input, deps)` → `{ outcome:
  'walked', provenance }` | `{ outcome: 'refused', reason }`.
  `ProvenanceDeps` requires `TenantResolver` + `IntakeDenyLog` +
  wedge `EstateStore`. The walk enforces the wedge's privacy-scope
  discipline against the caller's `HostFrame`.
- **Relay.** Each provenance record's `actor_id`, `ts`, `kind`,
  and (where present) `evidence_ref` verbatim; the typed refusal
  reason verbatim on `refused`.
- **Render (deferred).** Chronological-order operator view of the
  walk is follow-up-PR scope. A `tenant`-scoped parent under a
  `public_discord` caller frame MUST surface as
  `privacy_scope_refusal` (Phase 24D concern 2), not a redacted
  walk; under an `actor_private` caller frame, the same parent
  walks normally.
- **Must not produce / reinterpret.** Dixie MUST NOT synthesise a
  provenance record for an unknown assertion; MUST NOT widen the
  host's two-value `HostFrame` into the wedge's seven-value
  `EnvironmentFrame`; MUST NOT promote a refused walk into a
  permissive walk under a different caller identity at render
  time.
- **Typed refusals surfaced verbatim.** `privacy_scope_refusal`,
  `cross_tenant_refused`, `unknown_assertion`,
  `tenant_resolution_failed`, `frame_unsupported`.
- **Transport.** Out of scope for the first PR.

#### Surface 5 — Audit-chain lookup

- **Consume.** `handleAuditChainLookup(input, deps)` → `{ outcome:
  'verified', events, chain_status: 'ok' }` | `{ outcome: 'broken',
  events, break_index, break_reason }` | `{ outcome: 'refused',
  reason }`. `AuditLookupDeps` requires `TenantResolver` + wedge
  `AuditLog` / `EstateStore`.
- **Relay.** Wedge-emitted `AuditEvent[]` verbatim; `break_index`
  and `break_reason` verbatim on a broken chain. Dixie NEVER hides
  a chain break.
- **Render (deferred).** Per-estate chain in order, with the break
  index and reason rendered prominently, is follow-up-PR scope.
- **Must not produce / reinterpret.** Dixie MUST NOT run
  `verifyChain` itself as its own source of truth; MUST NOT hide a
  chain break; MUST NOT synthesise missing events; MUST NOT rename
  `AuditEvent` to a Hounfour-side adjacent name (`audit-trail-
  entry` / `domain-event`) — ADR-022E gate #5 unchanged.
- **Typed refusals surfaced verbatim.** `cross_tenant_refused`,
  `unknown_estate`, `tenant_resolution_failed`.
- **Transport.** Out of scope for the first PR.

#### Surface 6 — Estate summary display

- **Consume.** `handleEstateSummary(input, deps)` → `{ outcome:
  'summarized', actor_id, estate_id, counts }` | `{ outcome:
  'refused', reason }`. `EstateSummaryDeps` requires
  `TenantResolver` + wedge `EstateStore`; Phase 24D added an
  optional `intakeLog?: IntakeDenyLog`.
- **Relay.** `by_class`, `by_status`, `by_privacy_scope` (the
  2-key spec shape with frame discipline applied — zero
  `actor_private` under `public_discord` caller frame),
  `by_risk_level`, and `_widened_privacy_scope` (the raw 4-key
  trace map; no frame discipline) verbatim.
- **Render (deferred).** Operator-facing summary using the 2-key
  `by_privacy_scope`, with the 4-key map surfaced only under a
  debug detail level or correlation tool, is follow-up-PR scope.
- **Must not produce / reinterpret.** Dixie MUST NOT collapse the
  4-key map back into the 2-key shape with its own projection (the
  host's projection is authoritative); MUST NOT surface
  `actor_private` counts in `by_privacy_scope` under
  `public_discord` caller frame; MUST NOT widen the 2-key shape
  into the 4-key shape for an operator render.
- **Typed refusals surfaced verbatim.** `cross_tenant_refused`,
  `unknown_estate`, `privacy_scope_refusal`,
  `tenant_resolution_failed`.
- **Transport.** Out of scope for the first PR.

### Required injected dependencies

The first PR MUST inject the following dependencies explicitly.
The host scaffold ships **no production defaults** for the
contracts that govern cross-tenant decisions.

#### `TenantResolver` (required, no production default)

Defined at `loa-straylight/src/straylight/host/tenancy.ts`. Every
surface that makes a cross-tenant decision (S1, S2, S4, S5, S6)
requires a caller-supplied resolver. The first Dixie PR MUST
inject a resolver that derives tenant from **authenticated
session context** — NOT from request body content, NOT from a
hard-coded default, NOT from a `""` sentinel. Per Phase 24D
concern 1:

- An empty `callerTenant` is refused **before** the resolver is
  consulted.
- An empty resolver result is treated identically to `undefined`.
- Both paths emit `tenant_unresolved` (surfaced at the host as
  `tenant_resolution_failed`).

A Dixie resolver that ships a "default tenant" fallback or that
returns `""` as a sentinel is a **non-conforming integration**.

#### `IntakeDenyLog` (optional injected dependency, recommended)

Defined at `loa-straylight/src/straylight/host/intake-log.ts`.
Surfaces 1, 2, and 4 always append a host-side intake-deny entry
on cross-tenant refusal (scoped to the caller's tenant per host
invariant #5; cross-tenant chain links forbidden). Surface 6
gained an optional `intakeLog?: IntakeDenyLog` dependency in
Phase 24D (concern 3); when provided, S6 matches the S1 / S2 / S4
audit-trail discipline.

The first Dixie PR SHOULD inject the same `IntakeDenyLog`
instance across S1 / S2 / S4 / S6 so an auditor can correlate
refusals per tenant. The first PR MAY ship a Dixie-side in-memory
or trivially-persisted adapter; durability semantics
(append-only, hash-chained, recovery, multi-process) are out of
scope for the first PR.

#### `AuditLog` / `EstateStore` / `StorageAdapter` (wedge public surface — read by host, not redefined by Dixie)

Exported from
`loa-straylight/src/straylight/index.ts`. The first Dixie PR
passes the wedge's `AuditLog` / `EstateStore` / `StorageAdapter`
references through to the host handlers via the
`AuditLookupDeps` / `IntakeDeps` / `ReceiptDeps` / etc. structs.
Dixie does **not** instantiate its own audit log, estate store,
or storage adapter and does **not** run `verifyChain` directly.

### Acceptance criteria

The first `loa-dixie` PR adopting the host scaffold is conforming
when **every** criterion below is satisfied. Reviewers MAY cite
this list verbatim against a PR diff.

1. **Dixie does not produce `RecallPack`.** Every served pack at
   the Dixie boundary is the verbatim wedge-emitted pack relayed
   through `handleRecallIntake`.
2. **Dixie does not produce `RecallReceipt`.** Every receipt
   surfaced at the Dixie boundary is the verbatim wedge-persisted
   receipt relayed through `handleRecallIntake` or
   `handleReceiptRetrieval`.
3. **Dixie does not compute `dispositionFor`.** The wedge's
   `dispositionFor` / `privacyDispositionForFrame` output flows
   through the pack and through Surface 3's classification.
4. **Dixie does not reinterpret `privacy_scope`.** The wedge's
   four-value `PrivacyScope` enum is authoritative. Surface 6's
   projection to the spec 2-key shape is host-applied; Dixie's
   relayed output uses the host's projection unchanged.
5. **Dixie does not run `verifyChain` as its own source of
   truth.** Surface 5's `handleAuditChainLookup` invokes the
   wedge's `verifyChain` through `AuditLookupDeps`; Dixie relays
   the outcome. Dixie does not re-verify and does not hide a
   break.
6. **Dixie injects tenant resolution explicitly.** A
   `TenantResolver` adapter that derives tenant from
   authenticated session context is wired into every cross-tenant-
   deciding surface (S1, S2, S4, S5, S6).
7. **Dixie does not infer production tenant scope silently.** A
   resolver returning `undefined` or `""` MUST surface
   `tenant_resolution_failed` verbatim — no permissive default,
   no silent fallback.
8. **Dixie surfaces typed refusals verbatim.** Every typed
   refusal the host emits (`cross_tenant_recall_refused`,
   `privacy_scope_refusal`, `tenant_resolution_failed`,
   `frame_unsupported`, `storage_unavailable`,
   `unknown_receipt_id`, `unknown_assertion`, `unknown_estate`,
   `outcome: 'broken'` with `break_index`) is surfaced by Dixie
   verbatim — no rewriting as soft warnings; no permissive
   defaults; no inferring tenant identity from missing records.
9. **Dixie preserves vector scope: vectors 1–8 only.** The first
   PR's tests MUST exercise vectors 1–8 at the host inspection
   layer (the same vector slice the Phase 24C/24D tests cover)
   and MUST NOT widen scope.
10. **Vector 9 (`signer_not_competent`) is cross-reference only /
    not in slice.** A Dixie-side test that exercises vector 9 at
    the host inspection layer is a non-conforming integration
    under ADR-024E §"The next implementation branch" §5 and
    MUST be refused on cite by reviewers.
11. **Vectors 10–11 remain gates.** A Dixie-side feature or test
    that exercises vector 10 (`EstateTransition` on the wire) or
    vector 11 (`safeCanonicalize` on the wire) is a non-
    conforming integration under ADR-022E gates #1 / #2 and
    MUST be refused on cite by reviewers.
12. **Dixie does not adopt Hounfour `#116` directly.** No five-
    step conformance corpus import; no Hounfour `main` /
    commit-SHA / git-source consumption; no Hounfour dependency-
    range bump on the strength of `#116` alone.
13. **Dixie does not adopt `0xhoneyjar:straylight:*`.** The
    audit-event prefix family is registered upstream but NOT
    adopted into Dixie's audit-event surface on the strength of
    `#116` alone.
14. **Dixie does not adopt the Hounfour `recall-wedge`
    conformance category.** The conformance category is
    registered upstream but NOT adopted into Dixie's test suite
    on the strength of `#116` alone.
15. **Dixie does not add public commitment-root behavior.**
    ADR-020E unchanged. The first PR does NOT publish a
    `CommitmentRoot` and does NOT add an anchoring surface.

### Validation expectations

The first `loa-dixie` PR is expected to validate locally with the
following posture (concrete commands are Dixie-side and depend on
the `loa-dixie` build / test scripts; the **classes** of check
below are what reviewers expect):

- **Typecheck clean.** Dixie's typecheck step passes against the
  Straylight host barrel as a dependency.
- **Dixie-side test suite passes** including new tests that
  exercise vectors 1–8 at the host inspection layer through the
  six handlers.
- **Vector 9 / 10 / 11 are NOT exercised.** A reviewer
  cross-checking the new tests against the Phase 24B validation-
  vector matrix at
  `loa-straylight/docs/specs/dixie-recall-host-validation-
  vectors.md` MUST be able to confirm vector 9 / 10 / 11 are not
  exercised at the host inspection layer.
- **No HTTP / NATS / RPC / BFF route is wired binding.** A
  reviewer scanning the diff for handler / route / endpoint /
  controller files MUST find that any such file is explicitly
  labelled as scaffolding / future / non-binding (or, preferably,
  absent from the first PR).
- **No `RecallPack` / `RecallReceipt` construction in Dixie
  code.** A reviewer searching for `new RecallPack` / `new
  RecallReceipt` / object-literal constructions of those shapes
  in Dixie code MUST find none.
- **No `dispositionFor` / `verifyChain` invocation in Dixie
  code.** A reviewer searching for these wedge function names in
  Dixie code MUST find none.

### Explicit non-goals (first PR)

- **No operator-facing rendering.** No JSX / template / view /
  serializer / formatter / response-shaper that produces operator-
  visible output. Rendering is a follow-up PR.
- **No HTTP endpoint.** No `app.post('/recall', ...)` /
  `app.get('/receipt/:id', ...)` / etc. wired as a binding route.
- **No NATS / RPC / BFF surface.** No NATS subject subscription /
  RPC method registration / BFF route handler wired binding.
- **No Discord / Telegram bot surface.** No bot command / event
  handler / webhook receiver wired binding.
- **No transport-layer schema authoring.** The first PR does not
  author OpenAPI / GraphQL / JSON-Schema / TypeBox for any
  externally-exposed surface.
- **No Hounfour `#116` adoption.** Five-step corpus import,
  `0xhoneyjar:straylight:*` adoption, `recall-wedge` category
  adoption all out of scope.
- **No Hounfour dependency bump.** The dependency range and
  resolved patch on `@0xhoneyjar/loa-hounfour` stay where the
  Phase 24C/24D scaffold runs them (Straylight side: `^8.6.0`,
  resolved `8.6.0`).
- **No public commitment root.** No `CommitmentRoot` publication
  surface, no anchoring adapter.
- **No vector 9 / 10 / 11 widening.** Out of slice; gates
  unchanged.
- **No review-queue management surface.** The `needs_review`
  outcome from S1 surfaces a deterministic `review_queue_id`
  handle plus the wedge's `audit_event_id`; the actual review-
  queue management surface (operator inbox, approval action,
  denial action, escalation policy) is **future work**, and the
  first PR MUST NOT ship it.
- **No `HostFrame` widening.** The host's two-value `HostFrame`
  (`actor_private` / `public_discord`) is narrower than the
  wedge's seven-value `EnvironmentFrame`. A Dixie-side widening
  proposal needs a separate spec; the first PR uses the narrower
  enum unchanged.

### References

- `loa-straylight/docs/handoffs/phase-24e-dixie-host-handoff-
  packet.md` — authoritative per-surface Dixie reading (inspect /
  relay / render / must-not-invent / typed refusals / receipt-
  category vocabulary).
- `loa-straylight/docs/handoffs/phase-24d-host-scaffold-
  hardening.md` — Phase 24D summary handoff (six hardening
  concerns pinned).
- `loa-straylight/docs/handoffs/phase-24c-dixie-recall-host-
  scaffold.md` — Phase 24C summary handoff (six local host
  surfaces + tenant-resolver contract + intake-deny log).
- `loa-straylight/docs/handoffs/dixie-governed-recall-issue.md` —
  Phase 12 broader Dixie issue handoff (with Phase 24B + Phase 24E
  refresh appended). The current draft is narrower; this Phase 12
  issue remains the broader-scope canonical handoff.
- `loa-straylight/docs/handoffs/dixie-governed-recall-
  boundary.md` — Phase 12 boundary doc (with Phase 24B + Phase
  24E refresh appended).
- `loa-straylight/docs/handoffs/dixie-recall-mapping.md` —
  Phase 12 mapping doc (with Phase 24B + Phase 24E refresh
  appended).
- `loa-straylight/docs/specs/dixie-recall-host-mvp-contract.md` —
  Phase 24B per-surface MVP host contract.
- `loa-straylight/docs/specs/dixie-recall-host-validation-
  vectors.md` — Phase 24B per-vector validation matrix at the
  host inspection layer.
- `loa-straylight/docs/decisions/ADR-024E-dixie-host-mvp-wire-
  shape.md` — Phase 24B decision-lock pinning the Straylight ↔
  Dixie wire shape, the minimum MVP slice, and the next
  implementation branch entry / non-go conditions.
- `loa-straylight/src/straylight/host/index.ts` — canonical host
  barrel (post-PR-30 snapshot; **not** re-exported through the
  wedge public API at `loa-straylight/src/straylight/index.ts`).

<!-- END paste-ready issue body — do not file as part of Phase 24F -->

## Transport neutrality (Phase 24F discipline)

The paste-ready issue body above does **not** declare any wire
transport as binding. This is a load-bearing property of the first-
PR scope. Concretely:

- **No HTTP route shape is declared binding.** The paste-ready
  body does not specify a `POST /recall` / `GET /receipt/:id` /
  `GET /estate/:id/audit` / etc. route as a contract Dixie must
  honor in the first PR. Any HTTP example in any companion
  document (Phase 12 `dixie-recall-mapping.md`, Phase 24E packet,
  Phase 24B specs) is illustrative only at the first-PR layer.
- **No NATS subject is declared binding.** No
  `straylight.recall.intake` / `straylight.recall.receipt.get` /
  etc. is wired as a contract Dixie must honor in the first PR.
- **No RPC method is declared binding.** No
  `RecallService.Intake` / `RecallService.Receipt.Get` / etc. is
  wired as a contract Dixie must honor in the first PR.
- **No BFF / GraphQL / OpenAPI surface is declared binding.** The
  first PR does not author a `schema.graphql`, an
  `openapi.yaml`, or a BFF route handler bound to any
  externally-exposed surface.
- **No Discord / Telegram bot surface is declared binding.** No
  bot command map / event handler / webhook receiver is wired
  binding.

A **future, separate** Dixie-side ADR (or an implementation-plan
document under whatever `loa-dixie`'s docs convention is) is the
correct vehicle for transport decisions. That ADR is **not**
authored by Phase 24F, **not** authored by the first Dixie PR, and
**not** authored by `loa-straylight` at all — transport ownership
sits with the Dixie repo. Any transport example a future filer
includes in the issue body MUST be clearly labelled
**illustrative / future / non-binding / out of scope for the first
PR**.

The paste-ready body deliberately omits transport examples to
prevent illustrative-becomes-binding drift. A reviewer who notices
a transport example sneaking into the first PR (an
`app.post('/recall', ...)` wired binding, a NATS subscription, a
GraphQL resolver) SHOULD cite this section verbatim.

## Six-surface contract requirements (Phase 24F mirror)

This section restates the six per-surface contracts in the paste-
ready body above using the standard five-part shape (consume /
relay / render-later / must-not-produce-or-reinterpret / typed-
refusals-verbatim + transport-out-of-scope). Phase 24E §"Six per-
surface Dixie readings" remains the authoritative source of
per-surface behavior; this section is a mirror keyed to the first-
PR scope.

| Surface | Future Dixie may CONSUME | Future Dixie may RELAY | Future Dixie may RENDER LATER (out of first-PR scope) | Future Dixie MUST NOT produce / reinterpret | Typed refusals surfaced VERBATIM | Transport |
|---|---|---|---|---|---|---|
| S1 — Recall intake / response | `handleRecallIntake(input, deps)` discriminated outcome | Wedge `RecallPack` + `RecallReceipt` (on `served`); `audit_event_id` + classified `DeniedReason` + verbatim `raw_reasons[]` (on `denied`); `review_queue_id` + `audit_event_id` (on `needs_review`) | Operator render of pack / denial / queue handle | `RecallPack`, `RecallReceipt`, synthesised receipt on deny / needs_review, re-classified `DeniedReason`, promotion of `needs_review` ↔ denial | `cross_tenant_recall_refused`, `policy_unavailable`, `signer_not_competent`, `storage_unavailable`, `blocked_by_policy`, `privacy_scope_refusal`, `frame_unsupported`, `tenant_resolution_failed`, `class_validation_failed` | **Out of scope for first PR.** |
| S2 — Receipt retrieval / display | `handleReceiptRetrieval(input, deps)` discriminated outcome | Wedge `RecallReceipt` verbatim under requested `detail_level`; typed `not_found` reason verbatim | Operator render of receipt summary fields | Synthesised receipt for unknown `receipt_id`, inferred tenant from missing record, self-downgrade of `debug` → `standard` | `unknown_receipt_id`, `cross_tenant_refused`, `tenant_resolution_failed` | **Out of scope for first PR.** |
| S3 — Excluded-assertion reason display | `handleExclusionDisplay(input, deps)` pure render | `excluded_aggregates[]` / `redacted_aggregates[]` / `marked[]` from the wedge pack; unknown reason → `category: 'excluded'` + verbatim `raw_reason` | Operator render of category + reason text | Reasons not in the pack, promotion of unknown wedge reason to narrower category, recomputed `dispositionFor`, synthesised per-assertion granularity on aggregates | None at S3 itself (pure render; pack already fail-closed upstream) | **Out of scope for first PR.** |
| S4 — Provenance inspection | `handleProvenanceWalk(input, deps)` discriminated outcome | Each provenance record's `actor_id`, `ts`, `kind`, `evidence_ref` verbatim; typed refusal reason verbatim on `refused` | Chronological operator view of the walk | Synthesised provenance for unknown assertion, widening of `HostFrame` to `EnvironmentFrame`, promotion of refused walk to permissive walk | `privacy_scope_refusal`, `cross_tenant_refused`, `unknown_assertion`, `tenant_resolution_failed`, `frame_unsupported` | **Out of scope for first PR.** |
| S5 — Audit-chain lookup | `handleAuditChainLookup(input, deps)` discriminated outcome | Wedge `AuditEvent[]` verbatim; `break_index` + `break_reason` verbatim on a broken chain | Per-estate chain in order; prominent break index / reason rendering | Self-run `verifyChain` as source of truth, hidden chain break, synthesised missing events, renamed `AuditEvent` to a Hounfour-adjacent name | `cross_tenant_refused`, `unknown_estate`, `tenant_resolution_failed` | **Out of scope for first PR.** |
| S6 — Estate summary display | `handleEstateSummary(input, deps)` discriminated outcome | `by_class`, `by_status`, `by_privacy_scope` (2-key spec shape), `by_risk_level`, `_widened_privacy_scope` (4-key raw trace map) verbatim | Operator render of 2-key shape; 4-key trace map under debug only | Collapsed 4-key map with Dixie's own projection, `actor_private` counts in 2-key under `public_discord`, widened 2-key shape to 4-key shape in operator render | `cross_tenant_refused`, `unknown_estate`, `privacy_scope_refusal`, `tenant_resolution_failed` | **Out of scope for first PR.** |

Per-surface handler module paths (for the future Dixie PR's
import statements; Phase 24E §"Per-surface handler mapping"
remains canonical):

| Surface | Handler export | Module path | Dependency interface |
|---|---|---|---|
| S1 | `handleRecallIntake` | [`../../src/straylight/host/intake.ts`](../../src/straylight/host/intake.ts) | `IntakeDeps` |
| S2 | `handleReceiptRetrieval` | [`../../src/straylight/host/receipt.ts`](../../src/straylight/host/receipt.ts) | `ReceiptDeps` |
| S3 | `handleExclusionDisplay` | [`../../src/straylight/host/exclusion.ts`](../../src/straylight/host/exclusion.ts) | *(pure render; no dep struct)* |
| S4 | `handleProvenanceWalk` | [`../../src/straylight/host/provenance.ts`](../../src/straylight/host/provenance.ts) | `ProvenanceDeps` |
| S5 | `handleAuditChainLookup` | [`../../src/straylight/host/audit-lookup.ts`](../../src/straylight/host/audit-lookup.ts) | `AuditLookupDeps` |
| S6 | `handleEstateSummary` | [`../../src/straylight/host/estate-summary.ts`](../../src/straylight/host/estate-summary.ts) | `EstateSummaryDeps` (Phase 24D adds optional `intakeLog?: IntakeDenyLog`) |

All six handlers and their dep types are exported from the local
host barrel at
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
The barrel is **NOT** re-exported through the wedge public API at
[`../../src/straylight/index.ts`](../../src/straylight/index.ts);
the future Dixie PR imports the host barrel directly. The wedge
does not import the host scaffold (one-way dependency).

## Acceptance criteria (Phase 24F restatement)

The first-PR acceptance criteria list also appears in the paste-
ready body above. It is restated here so a Phase 24F reviewer can
cite the criteria without having to enter the paste block.

1. Dixie does not produce `RecallPack`.
2. Dixie does not produce `RecallReceipt`.
3. Dixie does not compute `dispositionFor`.
4. Dixie does not reinterpret `privacy_scope`.
5. Dixie does not run `verifyChain` as its own source of truth.
6. Dixie injects tenant resolution explicitly.
7. Dixie does not infer production tenant scope silently.
8. Dixie surfaces typed refusals verbatim.
9. Dixie preserves vector scope: vectors 1–8 only.
10. Vector 9 cross-reference only / not in slice.
11. Vectors 10–11 remain gates.
12. Dixie does not adopt Hounfour `#116` directly.
13. Dixie does not adopt `0xhoneyjar:straylight:*`.
14. Dixie does not adopt the Hounfour `recall-wedge` conformance
    category.
15. Dixie does not add public commitment-root behavior.

This list extends — does **not** rewrite — the Phase 12
`dixie-governed-recall-issue.md` §"Acceptance criteria" list and
the Phase 24E §"Dixie-side supplemental acceptance criteria"
list. A Phase 24F reviewer cross-checking against the broader
Phase 12 list MUST cite both lists together.

## Explicit non-goals (Phase 24F)

The Phase 24F packet itself does **not**:

- edit `loa-dixie` (no Dixie-side source / test / config / lock
  change);
- file a GitHub issue, open a PR, post a comment, or assign a
  reviewer at `loa-dixie` or any other sibling repo;
- author or wire any HTTP / NATS / RPC / BFF / Discord / Telegram
  endpoint;
- declare any route shape as binding;
- adopt Hounfour `#116` outputs (no five-step corpus import; no
  `0xhoneyjar:straylight:*` adoption; no `recall-wedge` category
  adoption);
- change `package.json` / `package-lock.json` (no Hounfour
  dependency-range bump; no new dependency; no new dev
  dependency; no new package script);
- change any source under
  [`../../src/straylight/`](../../src/straylight/) (no edit to
  the wedge surface; no edit to the host scaffold; no re-export
  of the host barrel through the wedge public API);
- change any test under [`../../tests/`](../../tests/) (no new
  test; no modification to any existing test);
- change any fixture under
  [`../../fixtures/`](../../fixtures/);
- change any script under [`../../scripts/`](../../scripts/);
- author any spec under [`../specs/`](../specs/);
- author any ADR under [`../decisions/`](../decisions/);
- author any demo / evidence artifact (no JSON capture; no
  vitest snapshot; no demo-walkthrough run);
- request or run Flatline / Bridgebuilder / red-team review on
  this draft;
- publish a public commitment root (ADR-020E unchanged);
- advance any ADR-022E gate (#1 `EstateTransition`; #2
  `safeCanonicalize`; #4 `Challenge` re-export; #5 `AuditEvent`
  rename — all unchanged);
- advance the Phase 19A pending feedback gate on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  (remains pending);
- author vector 9 / 10 / 11 widening anywhere (the paste-ready
  body explicitly refuses widening; this packet does not author
  it either);
- author operator-facing rendering anywhere (the paste-ready
  body defers rendering to a future PR; this packet does not
  author it either);
- touch `.loa/`, `.loa.config.yaml`, `.claude/`, `.run/`,
  `.beads/`, `grimoires/loa/a2a/`, or `.github/`;
- commit, push, or open any PR on `loa-straylight` itself.

## Open questions / follow-ups (not blocking Phase 24F)

1. **Filing posture.** Phase 24F authors the paste-ready body
   but does not file it. The eventual filing is a separate,
   human-reviewed event under whatever sibling-repo coordination
   discipline applies. Phase 24F does not pre-authorise the
   filer's identity, the filing channel, or the filing timing.
2. **Follow-up PR plan.** The first PR is scaffold-consumption-
   only. The natural follow-up PRs — (i) operator-facing
   rendering for one or more surfaces, (ii) a transport-layer
   ADR, (iii) a review-queue management surface for the
   `needs_review` outcome, (iv) `IntakeDenyLog` durability — are
   each independent and each gated by a separate Dixie-side
   decision. Phase 24F does not pin a sequence and does not
   pre-authorise any follow-up PR.
3. **Vector 9 cross-reference test in Dixie.** Phase 24B and
   Phase 24E both pin vector 9 (`signer_not_competent`) as
   cross-reference only / not in slice at the host inspection
   layer. The wedge already exercises it via
   [`../../tests/signer-fail-closed.test.ts`](../../tests/signer-fail-closed.test.ts).
   The first Dixie PR's test suite does NOT add a vector-9 host
   test. A future PR MAY widen scope under a separate ADR; Phase
   24F does not pre-authorise that widening.
4. **`HostFrame` widening.** Phase 24E §"Open questions" §3
   anticipates a future widening of the host's two-value
   `HostFrame` to track wedge-side privacy-frame additions. The
   first Dixie PR uses the narrower enum unchanged. Phase 24F
   does not pre-authorise the widening.
5. **No Phase 24F demo-evidence packet.** Phase 24E §"Open
   questions" §1 noted that a Phase 24F demo-evidence packet was
   anticipated. Phase 24F deliberately is **not** that packet:
   the 63 Phase 24C/24D host tests already exercise vectors 1–8
   at the host inspection layer, and authoring an additional
   evidence artifact would either restate the tests in prose
   (paperwork) or require new source/scripts (out of scope). A
   future phase MAY author a demo-evidence packet under a
   separate decision; Phase 24F does not.
6. **Hounfour `#70` / Phase 19A feedback gate.** Remains
   **pending** and is **not** advanced by Phase 24F. ADR-024D
   §3.b explicitly allows Phase 24B / 24C / 24D / 24E / 24F to
   proceed under the "local additive scaffolding only" rule
   without satisfying the gate; advancing the gate is a
   separate, sibling-repo, human-reviewed event.

## Validation evidence

```bash
npm run typecheck    # expected clean (no source change vs Phase 24E)
npm test             # expected unchanged from Phase 24E baseline
git status --short
git diff --stat
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json
```

Phase 24F adds **no source**, **no test**, **no fixture**, **no
script**, **no package change**, **no ADR**, **no spec**, **no
demo / evidence artifact**, and **no schema**. The
`npm run typecheck` and `npm test` commands above are expected to
produce identical output to the Phase 24E post-merge baseline by
construction. The five-path `git diff` is expected to be empty.

## Cross-references

- [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)
  — authoritative per-surface Dixie reading. Phase 24F cites this
  packet rather than restating its content.
- [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)
  — Phase 24D summary handoff.
- [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)
  — Phase 24C summary handoff.
- [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)
  — Phase 24B summary handoff.
- [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary handoff.
- [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  — Phase 12 broader Dixie issue (with Phase 24B + Phase 24E
  refresh appended). Phase 24F does **not** append a refresh
  here; the present packet is the narrower first-PR draft.
- [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  — Phase 12 boundary doc.
- [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md) —
  Phase 12 mapping doc.
- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — Phase 24B MVP host contract.
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — Phase 24B per-vector validation matrix.
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — Phase 24B decision-lock.
- [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
  through
  [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — Phase 24A decision-lock series.
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  — canonical host barrel (post-PR-30 snapshot; **not** re-
  exported through the wedge public API).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge public surface (unchanged by Phase 24C / 24D / 24E /
  24F).
