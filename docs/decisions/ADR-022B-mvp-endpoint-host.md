# ADR-022B — MVP endpoint host: Dixie vs Finn (decision-lock for Phase 22A)

## Status

Accepted-for-Phase-22A.

This ADR is a Phase 22A MVP decision-lock. It tightens ADR-020B's
*recommendation* (Dixie default; Finn fallback) into a **decision
criterion** for the first MVP Recall Wedge endpoint, against the
post-v8.6.0 substrate Phase 21B mapped. **Phase 22A wires no
endpoint, adds no network surface, adds no `package.json`
dependency on Dixie or Finn, and does not edit any sibling repo.**
Neither the preferred host nor the fallback host exists in
runtime today.

## Context

ADR-020B recommended Dixie as the default candidate for the first
MVP recall-inspection endpoint, with Finn as the fallback if
runtime / model-context assembly forces the issue. It deliberately
declined to *select* the host because:

- The wedge had no network surface.
- `Challenge` and `EstateTransition` were both deferred to v8.6.0.
- Issue #70 feedback was pending.

Phase 21B narrowed the picture:

- **`Challenge` shipped at v8.6.0** as
  `./schemas/challenge.schema.json` (Phase 16 delta #7 schema-level
  closure). Adoption into the Straylight public surface remains
  deferred per ADR-020A / ADR-020C / ADR-022A.
- **`EstateTransition` is still queued** (delta #8). Any runtime
  path that emits, validates, or persists an `EstateTransition`
  envelope by reference to a canonical Hounfour schema cannot do
  so today.
- **`safeCanonicalize` JS subpath remains undeclared.** The v8.6.0
  `exports` map declares no `./canonicalize` and no `./utilities`
  subpath. Importing from package root is forbidden (delta #9).
  Reaching into `dist/utilities/` is forbidden by the Phase 17B /
  18 / 21A / 21B user-facing constraint. Gate
  `no-confirmed-subpath` is unchanged.
- **Phase 19A pending feedback gate is unsatisfied.** The v8.6.0
  release is partial fulfillment, not the issue-#70 response.

ADR-022A reaffirmed Loa-Straylight as the semantic / control-plane
home post-v8.6.0. The primitives the future endpoint would
inspect, expose, or wrap remain Straylight-owned.

The wedge today is still a TypeScript library
([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
plus a local CLI demo (`npm run demo:recall:json`,
[`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)),
with no HTTP / API / Discord / Telegram / NATS surface. That is
unchanged by Phase 22A.

## Decision criteria for the MVP endpoint host

The MVP endpoint is the *first* sibling-repo runtime that exposes
a `RecallRequest` → `RecallPack` + `RecallReceipt` flow against an
estate the wedge owns. The host is selected by the following
ordered criteria:

| # | Criterion | Why it matters |
|---|---|---|
| 1 | The host's primary role in the architecture spec §1.4. | Recall-inspection-first MVPs match Dixie's *recall / BFF / provenance* candidate role; runtime-context-assembly-first MVPs match Finn's *runtime / model-routing / action-gateway* candidate role. The mismatch is a No-Go per [`cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md). |
| 2 | Whether the endpoint must execute a `RecallRequest` inside a runtime tool call (Finn-shaped) or inspect a precomputed `RecallPack` + `RecallReceipt` (Dixie-shaped). | The two shapes have different fail-closed boundaries. ADR-020D pins the receipt contract; the host must preserve it without re-minting receipts. |
| 3 | Whether the endpoint must run `executeRecall` ahead of policy validation. | Finn enforces policy; Dixie inspects without enforcing. A Dixie host that ran `executeRecall` ahead of Finn would collapse class-vs-policy ([`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)). |
| 4 | Whether the endpoint requires `EstateTransition` semantics. | If yes, the host is **blocked at v8.6.x** because Hounfour delta #8 has not shipped. Phase 21B Q4 names this a runtime-integration blocker. |
| 5 | Whether the endpoint requires `safeCanonicalize` over the wire. | If yes, the host is **blocked at v8.6.x** because the JS subpath is undeclared. Phase 21B Q4 names this a runtime-integration blocker. |
| 6 | Whether the endpoint is exposed to a public / cross-tenant surface. | If yes, Freeside is a *consumer* per the Phase 14 boundary, **not** a candidate host. A community-surface-first MVP is forbidden by [`cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md). |
| 7 | Whether the host's sibling-repo PR has landed under teammate review. | Per ADR-020A and ADR-022A, the wedge owns every primitive a host would expose until that PR lands. Selecting a host that has not yet shipped its handoff PR remains a *recommendation*, not a *placement*. |

## Decision

1. **Preferred MVP endpoint host: Dixie (recall-inspection-first).**
   For an MVP whose first endpoint inspects a precomputed
   `RecallPack` + `RecallReceipt` (i.e. shape (b) under criterion
   #2), `loa-dixie` is the preferred host. Rationale:

   - Criterion #1: Dixie's *recall / BFF / provenance* candidate
     role in the architecture spec §1.4 is the lowest-coupling
     fit.
   - Criterion #2: Dixie hosts the `RecallPack` /
     `RecallReceipt` *output*, not the `RecallRequest`
     *execution*. The Phase 20D endpoint-boundary planning
     packet
     ([`../handoffs/phase-20d-recall-wedge-endpoint-boundary.md`](../handoffs/phase-20d-recall-wedge-endpoint-boundary.md))
     already nominates the existing
     `RecallRequest` / `RecallPack` / `RecallReceipt` /
     `audit_review` / `audit_chain_verification` shape as the
     **candidate** Dixie surface contract.
   - Criterion #3: Dixie inspects *output*; it does not run
     `executeRecall` ahead of policy validation. Finn (or the
     wedge) emits the receipt; Dixie surfaces it.
   - Criterion #4: A recall-inspection endpoint over a
     precomputed pack does not require `EstateTransition` on the
     wire; the underlying transition machinery stays local.
   - Criterion #5: A recall-inspection endpoint over a
     precomputed pack does not require `safeCanonicalize` on the
     wire; the local canonicalizer continues to feed the pack
     before the host serves it.
   - Criterion #6: Dixie is a control-plane / BFF surface, not a
     public-channel community surface. Freeside remains a later
     consumer.

2. **Fallback MVP endpoint host: Finn (runtime-enforcement-first).**
   For an MVP whose first endpoint must execute a `RecallRequest`
   inside a runtime tool call — i.e. the runtime needs the recall
   pack to feed model-context, action-gateway, or
   transition-validation paths (shape (a) under criterion #2) —
   `loa-finn` is the fallback host. Rationale:

   - Criterion #1: Finn's *runtime / model-routing /
     action-gateway / audit* candidate role is the natural fit
     when the recall is part of a runtime tool call.
   - Criterion #2: Finn executes the request; it owns the
     policy-validated, signer-competent, receipt-emitting
     boundary per
     [`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md)
     and the Phase 20D Finn-fallback nomination.
   - Criterion #3: Finn enforces policy by definition; running
     `executeRecall` ahead of policy is impossible by Finn's
     mandate, not by accident.
   - Criterion #4 / #5: A runtime-enforcement-first MVP that
     also requires `EstateTransition` on the wire **or**
     `safeCanonicalize` on the wire is blocked at v8.6.x. Finn
     can host the runtime path *only* for shapes that do not
     require those gates today.
   - Criterion #6: Finn is a runtime gate, not a public-channel
     community surface. Freeside remains a later consumer.

3. **Freeside is not a candidate MVP endpoint host.** Per the
   Phase 14 packet
   ([`../handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md))
   and the no-go sequence
   ([`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)),
   Freeside *consumes* governed recall once Dixie / Finn
   settle. A community-surface-first MVP is rejected by ADR-022B.

4. **Phase 22A wires neither host.** No HTTP / API code is
   added. No `package.json` dependency on `loa-dixie` or
   `loa-finn` is added. No fixture / migration / script change.
   No edit to any sibling repo. The host preference is a Phase
   22A *decision criterion*, not a Phase 22A *implementation*.

5. **Phase 22 boundary-preparation work in `loa-finn` /
   `loa-dixie` is not authorized.** Per Phase 21B Q5, Finn
   boundary prep and Dixie boundary prep are explicitly **not
   authorized** while:
   - Phase 19A pending feedback for issue #70 remains pending,
     **and**
   - The actual host has not been selected by a separate ADR
     under teammate review against a real recall-shape requirement.

   ADR-022B states the *criteria* and the *preferences*; it does
   **not** itself open Phase 22 sibling-runtime work. Phase 22A
   is docs-only.

## Why no endpoint wiring happens in Phase 22A

- The Phase 19A pending feedback gate on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  remains binding (Phase 21B Q4). The v8.6.0 release is partial
  fulfillment, not the issue-#70 response.
- `EstateTransition` schema absence (delta #8 queued) is a
  runtime-integration blocker for any host whose MVP shape
  requires it (Phase 21B Q4).
- `safeCanonicalize` subpath absence (gate
  `no-confirmed-subpath`) is a runtime-integration blocker for
  any host whose MVP shape requires it (Phase 21B Q4).
- Selecting a host runtime ahead of those gates would commit
  Straylight to a network seam and a sibling-runtime dependency
  whose contract Hounfour has not finished shipping.
- Per ADR-022A, the wedge owns every primitive a host would
  expose until that host's PR lands under teammate review.

## Consequences

- A Phase 22 implementation branch that begins endpoint wiring
  must (a) cite ADR-022B's criteria, (b) state which shape
  ((a) Finn-shaped or (b) Dixie-shaped) the MVP requires, and
  (c) confirm criteria #4 and #5 are satisfied (`EstateTransition`
  and `safeCanonicalize` on the wire) **or** explicitly scope the
  endpoint to a shape that does not require them.
- The first sibling-repo PR that hosts this endpoint must be
  reviewed under teammate review per
  [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md);
  the host preference itself does not bypass that review.
- A later ADR will lock the *actual* host once a sibling-repo PR
  is opened. ADR-022B is the *criteria*, not the *placement*.
- Reviewers should reject any Phase 22 PR that:
  - Adds an HTTP / NATS / Discord / Telegram surface.
  - Adds `loa-dixie` or `loa-finn` as a `package.json`
    dependency.
  - Begins Finn-side or Dixie-side boundary preparation work in
    those sibling repos.
  - Selects Freeside as the MVP endpoint host.
  - Cites the v8.6.0 `Challenge` shipping event as authority to
    flip a host.

## Non-scope (Phase 22A)

- No HTTP / API code added.
- No transport adapter (Discord, Telegram, REST, NATS) wired.
- No `loa-dixie` or `loa-finn` `package.json` dependency added.
- No sibling-repo edits.
- No fixture changes.
- No `src/` / `tests/` / `scripts/` runtime changes.
- No `.loa/` / `.claude/` edits.
- No commit, no push, no PR.

## Source files inspected

- [`./0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020B-recall-wedge-endpoint-host.md`](./ADR-020B-recall-wedge-endpoint-host.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §1.4
- [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (Network adversary, Cryptographic forgery: out-of-scope)
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
- [`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md)
- [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
- [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
- [`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md)
- [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)
- [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md)
- [`../handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`../handoffs/phase-20d-recall-wedge-endpoint-boundary.md`](../handoffs/phase-20d-recall-wedge-endpoint-boundary.md)
- [`../handoffs/phase-20e-recall-wedge-closeout.md`](../handoffs/phase-20e-recall-wedge-closeout.md)
- [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
- [`../../package.json`](../../package.json)
