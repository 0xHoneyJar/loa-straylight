# ADR-024B — MVP host selection: Dixie-first (decision-lock for Phase 24A)

## Status

Accepted-for-Phase-24A.

This ADR is a Phase 24A docs-only decision-lock. It tightens
ADR-022B
([`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md))
from a *criteria + preference* (Dixie default, Finn fallback) into
a **placement**: the next MVP host for the Straylight Recall
Wedge is **Dixie (governed recall / BFF / provenance)**.

The selection records a host choice; it does **not** wire an
endpoint, does **not** add a `package.json` dependency on
`loa-dixie`, does **not** open a Dixie-side PR, and does **not**
authorize endpoint code in any branch. Phase 24A is docs-only.
The corresponding implementation branch scope is defined in
ADR-024D ([`./ADR-024D-phase-24b-implementation-branch.md`](./ADR-024D-phase-24b-implementation-branch.md));
neither Dixie nor Finn is wired by Phase 24A.

## Context

ADR-022B locked seven decision criteria for the MVP endpoint host
and pinned a Dixie-preferred / Finn-fallback recommendation
without selecting a host. The criteria were:

1. The host's primary role in the architecture spec §1.4.
2. Whether the endpoint executes a `RecallRequest` (Finn-shaped)
   or inspects a precomputed `RecallPack` + `RecallReceipt`
   (Dixie-shaped).
3. Whether the endpoint must run `executeRecall` ahead of policy
   validation.
4. Whether the endpoint requires `EstateTransition` semantics on
   the wire (gate: ADR-022E gate #1).
5. Whether the endpoint requires `safeCanonicalize` on the wire
   (gate: ADR-022E gate #2).
6. Whether the endpoint is exposed to a public / cross-tenant
   surface (Freeside-shaped) — disqualifying.
7. Whether the host's sibling-repo PR has landed under teammate
   review.

Phase 22A explicitly declined to *place* the host. ADR-022B's
"why no endpoint wiring happens in Phase 22A" list named four
gates that, together, blocked placement: the Phase 19A pending
feedback for issue #70, ADR-022E gate #1 (`EstateTransition`
schema absence), ADR-022E gate #2 (`safeCanonicalize` subpath
absence), and the absence of an ADR explicitly selecting the
host against a real recall-shape requirement.

Phase 23A
([`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md))
produced a per-object MVP schema-contract draft and an eleven-
vector MVP conformance matrix. Vectors 1–8 cover safe-draft
scenarios that exercise the existing wedge runtime via
locally-owned shapes — i.e. shapes the wedge already implements,
none of which require `EstateTransition` on the wire or
`safeCanonicalize` on the wire.

Hounfour PR #116
([`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md))
merged a Hounfour-side substrate event that:

- registered the `0xhoneyjar:straylight:*` audit-event prefix
  family upstream;
- registered `recall-wedge` as a conformance category upstream;
- shipped the five-step recall-wedge conformance corpus upstream;
- shipped the recall-wedge vector tests upstream;
- regenerated the upstream `schema/dist/release-integrity`
  outputs.

The substrate advances readiness on the **conformance / audit-
prefix** side without unblocking ADR-022E gates #1 or #2 (no
`EstateTransition` schema authored; no `safeCanonicalize`
subpath declared).

The combined picture at Phase 24A entry:

- The wedge has a working `RecallRequest` → `RecallPack` +
  `RecallReceipt` pipeline locally
  ([`../../src/straylight/recall.ts`](../../src/straylight/recall.ts)).
- The Phase 23A schema-contract draft enumerates the MVP object
  set without authoring schemas; vectors 1–8 are exercisable on
  the existing wedge runtime without on-the-wire
  `EstateTransition` and without on-the-wire `safeCanonicalize`.
- The next Straylight slice — per the user's framing of the
  Phase 24A decision — is **governed recall / recall pack
  inspection / provenance / receipt** behavior, **not runtime
  action enforcement**.
- The recall-pack-inspection MVP shape is **shape (b)** under
  ADR-022B criterion #2: a precomputed `RecallPack` +
  `RecallReceipt` is inspected by the host. No `executeRecall`
  inside a runtime tool call.

That shape's per-criterion evaluation:

| # | ADR-022B criterion | Recall-pack-inspection MVP | Implication |
|---|---|---|---|
| 1 | Primary architecture role | Dixie's *recall / BFF / provenance* candidate role | Match — Dixie |
| 2 | Execute vs inspect | Inspect a precomputed `RecallPack` + `RecallReceipt` | Match — Dixie shape |
| 3 | `executeRecall` ahead of policy | No; Dixie surfaces output, does not run the request | Match — Dixie |
| 4 | Requires `EstateTransition` on the wire | No; recall-pack inspection does not need transition envelopes | Not blocked by ADR-022E gate #1 |
| 5 | Requires `safeCanonicalize` on the wire | No; local canonicalizer feeds the pack before the host serves it | Not blocked by ADR-022E gate #2 |
| 6 | Public / cross-tenant surface | No; Dixie is a control-plane / BFF surface, not a community surface | Match — Dixie |
| 7 | Sibling-repo PR landed | Not yet | Placement, not wiring |

Per ADR-024A
([`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)),
Loa-Straylight remains the semantic / control-plane home and the
wedge owns every primitive a host would expose until that host's
sibling-repo PR lands under teammate review.

## Decision

1. **The next MVP endpoint host for the Straylight Recall Wedge
   is Dixie (governed recall / BFF / provenance — recall-pack-
   inspection-first).** `loa-dixie` is the host the next phase
   targets. Rationale (per the criteria table above):

   - Criterion #1: Dixie's *recall / BFF / provenance* candidate
     role in the architecture spec §1.4 is the lowest-coupling
     fit for the recall-pack-inspection MVP.
   - Criterion #2: The MVP shape is **(b) inspect a precomputed
     `RecallPack` + `RecallReceipt`** — Dixie-shaped. The
     Phase 20D endpoint-boundary planning packet
     ([`../handoffs/phase-20d-recall-wedge-endpoint-boundary.md`](../handoffs/phase-20d-recall-wedge-endpoint-boundary.md))
     already nominates the existing `RecallRequest` /
     `RecallPack` / `RecallReceipt` / `audit_review` /
     `audit_chain_verification` shape as the candidate Dixie
     surface contract.
   - Criterion #3: Dixie inspects *output*; it does not run
     `executeRecall` ahead of policy validation. The wedge (or
     Finn, in a future runtime slice) emits the receipt; Dixie
     surfaces it.
   - Criterion #4: A recall-pack-inspection MVP does **not**
     require `EstateTransition` on the wire. The transition
     machinery stays local. ADR-022E gate #1 remains in force —
     this MVP does not trigger it.
   - Criterion #5: A recall-pack-inspection MVP does **not**
     require `safeCanonicalize` on the wire. The local
     canonicalizer
     ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
     continues to feed the pack before the host serves it.
     ADR-022E gate #2 remains in force — this MVP does not
     trigger it.
   - Criterion #6: Dixie is a control-plane / BFF surface, not a
     public-channel community surface. Freeside remains a later
     consumer.

2. **Rationale (semantic):** the next Straylight slice is
   **governed recall, recall pack inspection, provenance, and
   receipt behavior** — not runtime action enforcement. The wedge
   pipeline that produces packs and receipts is shipped under
   ADR-020D / ADR-022D. Dixie's role is to *surface* that output
   under fail-closed semantics inherited from the wedge, not to
   *produce* it. That is the smallest non-trivial slice that
   exercises the MVP host contract end-to-end without flipping
   any of the still-deferred features in ADR-022E.

3. **Finn remains the enforcement collaborator / later runtime
   boundary.** Finn (per ADR-020A / ADR-022A / ADR-022B / the
   Phase 10 handoff packet
   ([`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md),
   [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md),
   [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md)))
   is the runtime / model-routing / action-gateway candidate. The
   later runtime slice — when recall output is fed into model /
   tool execution — is Finn's. ADR-024B does not advance that
   slice. Finn is **not** the Phase 24B host; it remains a
   candidate for a *later* host placement ADR once a runtime tool-
   call recall shape is required.

4. **Freeside remains the later application / community surface
   consumer.** Per the Phase 14 packet
   ([`../handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md))
   and the no-go sequence
   ([`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)),
   Freeside consumes governed recall once Dixie / Finn settle.
   Freeside is **not** the MVP endpoint host.

5. **Hounfour remains schema / protocol / conformance substrate
   only.** Per ADR-020C / ADR-022A / ADR-022C and ADR-024A,
   Hounfour does **not** become a Straylight host. Hounfour #116
   shipped substrate (audit-event prefix family, `recall-wedge`
   conformance category, five-step corpus, vector tests,
   regenerated dist) — it did **not** make Hounfour a runtime
   host candidate.

6. **Phase 24A wires no endpoint.** No HTTP / API code is added.
   No `package.json` dependency on `loa-dixie` is added. No
   fixture / migration / script change. No edit to any sibling
   repo. No Dixie-side PR is opened by Phase 24A. The host
   placement is a Phase 24A *decision*; the *implementation* is
   a future, separate event scoped by ADR-024D.

7. **Phase 24A does not consume Hounfour `main` or any
   unpublished commit.** Per ADR-024C
   ([`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)),
   Straylight consumes only published GitHub Packages releases.
   The Hounfour dependency remains `@0xhoneyjar/loa-hounfour@^8.6.0`,
   resolved patch `8.6.0`.

## Consequences

- The next implementation branch (Phase 24B, per ADR-024D) targets
  a Dixie-shaped recall-pack-inspection slice. Its allowable scope
  is local additive scaffolding (additive types, additive
  fixtures, additive tests) **and / or** a Dixie-side handoff
  packet refresh — never schema authoring, never `package.json`
  dependency on `loa-dixie`, never an actual Dixie endpoint.
- A future ADR-024B-supersede-event would be the placement of a
  *later* host once the recall slice's runtime-tool-call shape
  becomes the MVP shape. ADR-024B is the host placement for the
  recall-pack-inspection slice; it is **not** binding on later
  slices.
- Reviewers should reject any Phase 24+ PR that:
  - Adds an HTTP / NATS / Discord / Telegram surface in
    `loa-straylight`.
  - Adds `loa-dixie` or `loa-finn` as a `package.json`
    dependency.
  - Selects Freeside or Hounfour as the MVP host.
  - Wires `executeRecall` ahead of policy validation at the host.
  - Promotes Finn from later-runtime-collaborator to MVP host
    on the strength of #116 alone.
  - Cites Hounfour #116 as authority to flip the wedge import.
  - Begins Dixie-side boundary preparation work in `loa-dixie`
    on the strength of ADR-024B alone — that authorization is
    ADR-024D's responsibility, and ADR-024D does not authorize
    sibling-repo edits in Phase 24B.
- ADR-024D scopes the Phase 24B implementation branch. ADR-024C
  pins the package-release discipline. ADR-024A reaffirms the
  semantic-owner boundary. All three rest on ADR-024A; reopening
  ADR-024A reopens ADR-024B as well.

## Why this is a placement, not a deferral

Phase 22A locked criteria; Phase 23A enumerated the MVP object
set and conformance vectors; Phase 24A intakes the Hounfour-side
substrate advance from #116. The recall-pack-inspection MVP shape
satisfies the seven ADR-022B criteria as the lowest-coupling slice
that exercises the host contract end-to-end without flipping
ADR-022E gates #1 or #2. Continuing to defer would only be
justified if no shape satisfied the criteria; the recall-pack-
inspection shape does. ADR-024B places the host accordingly.

The placement is **independent of** the Phase 19A pending feedback
gate on issue #70. The status comment filed by the user before
Phase 23A remains unanswered. ADR-024B does **not** claim it has
been answered. The placement is a Straylight-side decision against
the Straylight-side primitive set; it does not assert any new
Hounfour-side adoption.

## Non-scope (Phase 24A)

- No Dixie endpoint, no Dixie-side PR, no Dixie-side runtime
  preparation in `loa-dixie`.
- No `package.json` dependency on `loa-dixie`.
- No Finn endpoint, no Finn-side PR, no Finn-side runtime
  preparation in `loa-finn`.
- No `package.json` dependency on `loa-finn`.
- No Freeside endpoint, no Freeside-side PR.
- No HTTP / NATS / REST / Discord / Telegram surface added in
  `loa-straylight`.
- No new `src/straylight/` file. No edit to the existing
  `src/straylight/` files.
- No new test file. No edit to existing tests.
- No new fixture. No edit to existing fixtures.
- No `Challenge` adoption. ADR-022E gate #4 unchanged.
- No `EstateTransition` implementation. ADR-022E gate #1
  unchanged.
- No `safeCanonicalize` subpath import. ADR-022E gate #2
  unchanged.
- No `AuditEvent` rename from `audit-trail-entry` / `domain-event`.
  ADR-022E gate #5 unchanged.
- No public commitment-root publication. ADR-020E unchanged.
- No Hounfour dependency-range bump. Per ADR-024C, range stays
  `^8.6.0`, resolved patch `8.6.0`.
- No consumption from Hounfour `main` or any unpublished commit.
- No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
  edits.
- No commit, no push, no PR.

## Source files inspected

- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020B-recall-wedge-endpoint-host.md`](./ADR-020B-recall-wedge-endpoint-host.md)
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md)
- [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)
- [`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §1.4, §1.5, §2
- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md)
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)
- [`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md)
- [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
- [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
- [`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md)
- [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)
- [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md)
- [`../handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`../handoffs/phase-20d-recall-wedge-endpoint-boundary.md`](../handoffs/phase-20d-recall-wedge-endpoint-boundary.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
- [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md)
- [`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md)
- [`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md)
- [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts) (existing recall pipeline, unchanged by Phase 24A)
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts) (local canonicalizer, unchanged by Phase 24A)
