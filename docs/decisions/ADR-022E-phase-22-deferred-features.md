# ADR-022E — Phase 22 deferred features (decision-lock for Phase 22A)

## Status

Accepted-for-Phase-22A.

This ADR is a Phase 22A MVP decision-lock. It enumerates the
features Phase 22 (and any later phase) **must not silently
advance** on the strength of the v8.6.0 schema-shipping event,
restated narrowly so a reviewer can refuse scope creep at the
gate. **Phase 22A authors no feature; this ADR is a deferral
ledger, not an implementation plan.**

## Context

Phase 21B's schema-readiness lock
([`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md))
records `Challenge` as newly upstream-shipped at v8.6.0 and
classifies the remaining gaps. Phase 21B Q5 explicitly constrains
Phase 22 to one of:

- Local schema/readiness work that does not change `src/straylight/`
  or sibling-repo state.
- A drafted-not-filed Hounfour status comment for issue #70.
- (Allowable but not preferred:) no code work.

ADR-022A reaffirmed Loa-Straylight as the semantic home post-v8.6.0.
ADR-022B locked the MVP endpoint host criteria (Dixie preferred;
Finn fallback; no wiring). ADR-022C locked the schema dependency
direction (Hounfour substrate; Straylight semantic owner;
Finn / Dixie / Freeside as consumers). ADR-022D locked the
receipt / audit ownership boundary at MVP (Straylight; persistence
deferred).

ADR-022E closes the decision-lock packet by listing, in one place,
**every feature Phase 22 must not silently begin**, with the gate
that holds it back and the trigger that would unblock it.

## Decision

The following features are deferred for Phase 22 and beyond. Each
row is a **gate**: Phase 22 must not advance the feature unless
the trigger is satisfied **and** a separate ADR (or sibling-repo
PR under teammate review per
[`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md))
explicitly cites the trigger.

| # | Deferred feature | Current gate | Trigger to unblock |
|---|---|---|---|
| 1 | `EstateTransition` schema (canonical) and on-the-wire envelope | Hounfour delta #8 still queued; no schema in v8.6.x. | Hounfour ships an `estate-transition.schema.json` (or equivalently named) under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.x/`, **and** a separate ADR adopts it under ADR-020C / ADR-022C. |
| 2 | `EstateTransition` local implementation | The Straylight-side primitive stays local in [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts) per ADR-020C / ADR-022A. | Either gate #1 unblocks (then adopt by alias), **or** a separate ADR explicitly authorizes a local `EstateTransition` type / schema / fixture (currently neither path is open). |
| 3 | `safeCanonicalize` JS-subpath adoption | v8.6.0 `exports` map declares no `./canonicalize` and no `./utilities` subpath. Gate `no-confirmed-subpath` unchanged. Reaching into `dist/utilities/` is forbidden by the Phase 17B / 18 / 21A / 21B user-facing constraint. | Hounfour ships a declared `./canonicalize` (or `./utilities`) subpath whose JS module exports `safeCanonicalize`, **and** a separate ADR adopts the subpath. |
| 4 | `Challenge` adoption into the wedge's public surface | Schema shipped at v8.6.0 (`./schemas/challenge.schema.json`); wedge has not adopted it. ADR-020A / ADR-020C / ADR-022A / ADR-022C all require a separate adoption ADR. | A separate ADR cites the v8.6.0 `$id`, specifies the alias / re-export path, and pins a boundary preservation test. ADR-022E does **not** itself authorize adoption. |
| 5 | `AuditEvent` adoption from a Hounfour candidate | v8.6.x ships `audit-trail-entry.schema.json` and `domain-event.schema.json` but no `audit-event.schema.json`. The Straylight candidate `audit-event-transition.json` is `DISCOVERY_NOTE`. | A separate ADR explicitly adopts one of the v8.6.x candidates as the canonical `AuditEvent` shape (or Hounfour ships an `AuditEvent` schema under that name). |
| 6 | `policy-decision-denied` schema-candidate | DEFERRED disposition in Phase 21B Q3. No Hounfour-side mapping today; not a wedge runtime primitive. | A separate ADR or schema-candidate refresh decides classification. Non-blocking; informational. |
| 7 | Public commitment-root anchor / on-chain integration | ADR-020E unchanged. The seven future-requirement gates (real signature substrate, determinism, receipt linkage, privacy preservation, revocability without rewrite, threat-model expansion, cross-tenant integrity) remain unsatisfied. | A separate ADR satisfies (or formally addresses) the seven gates and explicitly proposes wiring. |
| 8 | Production database / persistence substrate | ADR-020D / ADR-022D unchanged. `InMemoryStorage` and `JsonlStorage` are the MVP adapters. | A separate ADR proposes the production adapter, cites the relevant sibling-repo handoff packet, and preserves the ADR-022D receipt and audit-chain invariants. |
| 9 | Finn runtime wiring (Phase 10 contract execution in `loa-finn`) | Phase 21B Q5 explicitly does not authorize Finn boundary prep. ADR-022B endpoint-host placement unselected. ADR-022A reaffirms Finn is a runtime *candidate*, not the primitive owner. | (a) Phase 19A pending feedback for issue #70 received **or** a teammate review on this repo explicitly approves proceeding; (b) ADR-022B-criteria-driven placement ADR selects Finn; (c) the corresponding `loa-finn` PR opens under teammate review. |
| 10 | Dixie boundary wiring (Phase 12 contract execution in `loa-dixie`) | Symmetric to #9. Phase 21B Q5 explicitly does not authorize Dixie boundary prep. The Phase 20D endpoint-boundary planning packet is the only Dixie-side document allowed. | (a) Phase 19A pending feedback received or teammate-review approval; (b) placement ADR selects Dixie; (c) the corresponding `loa-dixie` PR opens under teammate review. |
| 11 | Freeside community / app / bot surface (Phase 14 contract execution in `loa-freeside`) | Per ADR-022B decision #3 and the no-go sequence, Freeside is **not** a candidate MVP endpoint host. Freeside consumes governed recall after Dixie / Finn settle. | (a) MVP endpoint host wired and stable; (b) Phase 14 packet executes in `loa-freeside` under teammate review; (c) ADR explicitly authorizes Freeside as a consumer (not as a host). |
| 12 | New HTTP / NATS / REST / Discord / Telegram surface | The wedge has no network surface today, by design ([`../mvp/threat-model.md`](../mvp/threat-model.md) "Network adversary" out-of-scope). | An MVP endpoint host wiring (gate #9 or #10) brings the network surface; the threat model must be updated *before* that wiring lands. |
| 13 | Reach into unexported Hounfour internals (`dist/utilities/`, `dist/...`) | Forbidden by the Phase 17B / 18 / 21A / 21B user-facing constraint and by subpath-import discipline (delta #9). | **Never.** No future ADR may grant this; the only way to consume a Hounfour utility is a declared subpath in the `exports` map. |
| 14 | New `package.json` / `package-lock.json` dependencies (`loa-finn`, `loa-dixie`, `loa-freeside`, network adapter, on-chain client, etc.) | None of these are MVP. Phase 22A is docs-only. | The corresponding feature gate (#9 / #10 / #11 / #12) unblocks **and** the dependency is added by the implementation phase that wires the feature, not by Phase 22A or any later docs-only phase. |
| 15 | Sibling-repo edits (any of `loa-hounfour`, `loa-finn`, `loa-dixie`, `loa-freeside`) | Phase 22A is in-repo only. The Phase 9 / 10 / 12 / 14 packets are *staged*, not *implemented*. | Sibling-repo work happens in the sibling repo under teammate review, not in `loa-straylight`. |
| 16 | Hounfour status comment **filing** on issue #70 | Per Phase 19A / Phase 21B, filing is a separate, sibling-repo, human-reviewed event. Phase 22A may *draft* in-repo. | A teammate / Eileen reviews the drafted comment and files it on `0xHoneyJar/loa-hounfour#70` outside Phase 22A. |
| 17 | The eleven exported-but-unconsumed Hounfour JS subpaths (`./core`, `./economy`, `./model`, `./governance`, `./constraints`, `./integrity`, `./graph`, `./composition`, `./commons`, `./vectors`) | Their presence is informational; their absence from the wedge's import surface is the Phase 17B / 18 / 21A subpath-discipline default. | A documented, evidence-backed Straylight need + a separate ADR + a future implementation phase that explicitly cites the authorization. |
| 18 | Adoption of a Hounfour-named symbol into the wedge's *public* surface | Per ADR-020C / ADR-022A / ADR-022C, the Hounfour alias module is private and the public surface is Straylight-named. | A separate ADR explicitly authorizes a public re-export and pins a boundary preservation test. The shipping of `Challenge` upstream does not, by itself, qualify. |
| 19 | Phase 22 implementation work without a separate authorizing ADR | Per Phase 21B Q5 and ADR-022A–D, Phase 22 implementation work is constrained to the allowable shapes. | A separate ADR (under teammate review) explicitly opens the Phase 22 implementation lane and cites which gates it unblocks. |
| 20 | Threat-model widening (network adversary, cryptographic forgery, on-chain integrity) | Both adversary classes are out-of-scope at MVP per [`../mvp/threat-model.md`](../mvp/threat-model.md). | Wiring an MVP endpoint host (gate #9 or #10) or wiring a public anchor (gate #7) requires updating the threat model **before** the wiring ADR is accepted. |

## Consequences

- A Phase 22 PR that advances any deferred feature without
  satisfying its trigger is rejected on this ADR.
- Reviewers should refuse scope creep at the gate. ADR-022E is
  the single doc to cite when refusing a Phase 22 implementation
  PR that:
  - Implements `Challenge` locally, re-exports `Challenge` from
    the public surface, or claims `Challenge` is "adopted"
    because v8.6.0 shipped the schema (gate #4).
  - Implements `EstateTransition` locally or adopts a
    `safeCanonicalize` subpath that has not been declared
    (gates #2 and #3).
  - Wires Finn / Dixie / Freeside (gates #9, #10, #11).
  - Adds an HTTP / NATS / Discord / Telegram surface (gate #12).
  - Reaches into unexported Hounfour internals (gate #13).
  - Adds a sibling-repo dependency without an implementation
    phase wiring it (gate #14).
  - Files a Hounfour comment from this repo (gate #16).
- Each row's *trigger* is the **only** path that unblocks the
  feature. Adding a feature on a different basis reopens this
  ADR.

## Non-scope (Phase 22A)

- No feature is implemented.
- No deferred feature is unblocked.
- No `src/` / `tests/` / `scripts/` / `fixtures/` changes.
- No `package.json` / `package-lock.json` changes.
- No sibling-repo edits.
- No `.loa/` / `.claude/` edits.
- No commit, no push, no PR.

## Source files inspected

- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020B-recall-wedge-endpoint-host.md`](./ADR-020B-recall-wedge-endpoint-host.md)
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md)
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
- [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md)
- [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../mvp/threat-model.md`](../mvp/threat-model.md)
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
- [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)
- [`../handoffs/phase-20e-recall-wedge-closeout.md`](../handoffs/phase-20e-recall-wedge-closeout.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)

---

## Later status — Phase 49Q (annotation; original rows above unchanged)

Every row above is preserved as originally written and remains the binding gate
inventory. This annotation records only a later status for one gate, and takes
effect **only if** `operator:eileen` authorizes the merge of
[`ADR-049Q`](./ADR-049Q-railway-postgresql-canonical-store-host-acceptance-and-implementation-authorization.md).

- **Gate #8** (row `./ADR-022E-phase-22-deferred-features.md:57`) — on that merge, gate #8 is **DISCHARGED for two
  bounded purposes only**: the canonical-store physical-host selection (Railway
  PostgreSQL, bounded and reversible) and the opening of the provider-neutral
  durable-storage implementation lane. It **remains held** for production
  admission, production writes, production migration execution, rollout,
  cutover, production credentials, production auth/consent/signer
  implementation, living-estate admission, and MVP-2 closure. See ADR-049Q §6.3
  and §8.
- **Gates #9 and #10** (rows `./ADR-022E-phase-22-deferred-features.md:58`, `./ADR-022E-phase-22-deferred-features.md:59`) — **unchanged and still HELD** at
  `PARTIAL_RECORDED`. ADR-049Q satisfies none of their trigger conjuncts and does
  not widen the narrow ADR-026D Dixie recall-intake slice (ADR-049Q §6.6, §7.2).
- **All other rows** — unchanged. ADR-049Q unblocks none of them.

Until that merge, gate #8 remains **OPEN / HELD** exactly as row
`./ADR-022E-phase-22-deferred-features.md:57` records.
