# ADR-020B — MVP Recall Wedge endpoint-host recommendation (decision-lock for Phase 20A)

## Status

Accepted-for-Phase-20A.

This ADR is a Phase 20A decision-lock. It records a *recommendation*
for which sibling repo would host the first MVP Recall Wedge
inspection endpoint, and a *fallback*, so Phase 20B can scope a
local scaffold against a known target. **Phase 20A wires no
endpoint and adds no network surface.** Neither the default
candidate nor the fallback exists in runtime today.

## Context

The architecture spec
([`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
§1.4) classifies Dixie as the *recall / control-plane / BFF /
provenance candidate* and Finn as the *runtime / model-routing /
action-gateway / audit candidate*. The Phase 12 handoff packet
([`docs/handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md),
[`dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md),
[`dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md))
already stages a Dixie-side recall-intake / recall-response /
receipt-retrieval / excluded-assertion-reason / provenance-inspection
surface for a future PR. The Phase 10 Finn handoff packet
([`docs/handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md))
stages runtime enforcement, including recall-request execution
boundaries, but is not framed as a recall *inspection* surface.

The wedge today is a TypeScript library
([`src/straylight/index.ts`](../../src/straylight/index.ts)) and a
local CLI demo (`npm run demo:recall`,
[`scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)).
There is no HTTP / API surface, no Discord surface, and no Finn /
Dixie / Freeside cross-repo wiring per
[`docs/mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
("What's deliberately missing").

The Phase 19A packet
([`docs/handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md))
also restates that the Phase 10 / 12 / 14 sibling-repo packets
remain docs-only.

Phase 20A locks a recommendation so Phase 20B can scope a local
scaffold against a coherent target without committing to any
runtime placement.

## Decision

1. **Default MVP endpoint-host candidate: Dixie.** The first MVP
   recall-inspection surface — read-only inspection of governed
   recall packs, recall receipts, exclusion reasons, redaction
   summaries, and provenance — is recommended to be hosted by
   `loa-dixie`. Dixie's *recall / BFF / provenance* candidate role
   in the architecture spec, and the already-staged Phase 12 packet,
   make it the lowest-risk first endpoint host: it can present
   recall outputs without owning runtime enforcement.

2. **Fallback: Finn-hosted endpoint.** If Phase 20B (or any later
   phase) requires immediate runtime / model-context assembly — i.e.
   the endpoint must execute a `RecallRequest` inside a runtime tool
   call rather than inspect a precomputed `RecallPack` —
   `loa-finn` is the recommended fallback host. Finn's *runtime /
   action-gateway* candidate role makes it the natural place to
   execute the request inside a policy-validated, signer-competent,
   receipt-emitting boundary, per
   [`docs/handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md).

3. **Phase 20A wires neither endpoint.** No HTTP / API code is
   added in Phase 20A. No `package.json` dependency on Dixie or
   Finn is added. No fixture or fixture-export script is changed.
   No sibling repo is edited. The endpoint host is a Phase 20A
   *recommendation*, not a Phase 20A *implementation*.

4. **Cross-tenant / community surfacing is not the MVP host.**
   Freeside (Discord / Telegram / REST / NATS / community / bot /
   admin) is **not** the MVP endpoint host candidate. Per the
   Phase 14 handoff
   ([`docs/handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md))
   Freeside consumes Dixie-style governed recall, it does not
   replace it. A community surface ahead of Dixie / Finn settling
   would violate the no-go sequence in
   [`docs/handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md).

## Why no endpoint wiring happens in Phase 20A

- The default candidate (Dixie) and the fallback (Finn) are both
  candidate roles. Neither sibling repo has yet implemented the
  Phase 12 / Phase 10 contracts; per ADR-020A the wedge owns every
  primitive those packets describe until a sibling-repo PR lands
  under teammate review.
- The wedge has no network surface today, by design
  ([`docs/mvp/threat-model.md`](../mvp/threat-model.md) "Out-of-scope
  (this phase) — Network adversary"). Adding one in Phase 20A
  would put a transport-layer threat surface in front of code
  whose threat model still assumes single-process locality.
- Hounfour v8.6.0 (cycle-005) carries `Challenge` and
  `EstateTransition`. Wiring an endpoint that exposes recall now
  would freeze a contract before the schemas it depends on are
  canonical.
- We are still waiting for Jani / teammate response on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
  Picking a runtime host before that response would commit
  Straylight to a network seam ahead of the canonical-schema
  question it depends on.

## Consequences

- Phase 20B may design a local scaffold whose **library shape**
  matches a future Dixie-hosted inspection surface (read-only
  recall inspection over a precomputed `RecallPack` + `RecallReceipt`),
  with the explicit option to re-aim at a Finn-hosted runtime
  endpoint if context-assembly requirements force the issue.
- The first sibling-repo PR that hosts this endpoint must be
  reviewed under teammate review per
  [`cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md);
  the host choice itself does not bypass that review.
- A later ADR will lock the *actual* host once a sibling-repo PR
  is opened. ADR-020B is the recommendation, not the placement.

## Non-scope (Phase 20A)

- No HTTP / API code added.
- No transport adapter (Discord, Telegram, REST, NATS) wired.
- No Dixie or Finn dependency added to `package.json`.
- No sibling-repo edits.
- No fixture changes.
- No `src/` runtime changes.
- No commit, no push, no PR.

## Source files inspected

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §1.4
- [`docs/mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) (in/out of scope)
- [`docs/handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md)
- [`docs/handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
- [`docs/handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
- [`docs/handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md)
- [`docs/handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)
- [`docs/handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md)
- [`docs/handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`docs/handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`docs/handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)
- [`package.json`](../../package.json)
