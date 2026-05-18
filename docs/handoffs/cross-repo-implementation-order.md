# Cross-repo implementation order

> Status: Phase 16. **Coordination artifact only, in
> `loa-straylight`.** This document recommends the order in which
> the four sibling-repo PRs (Hounfour, Finn, Dixie, Freeside)
> should be opened, reviewed, and merged. It is **not** cross-repo
> implementation. It is **not** Hounfour integration. Filing or
> merging the sibling-repo PRs is out of scope and must happen in
> the sibling repo, under teammate review.
>
> Phase 16 update: the Hounfour extraction landed in Hounfour
> cycle-004, accepted-with-adaptation per Jani's response on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
> **v8.5.0-rc.1** has fired (squash SHA `c94bcd22`) and **v8.5.0
> final** has shipped (`@0xhoneyjar/loa-hounfour@8.5.0`, tag
> `v8.5.0`, `main` HEAD `ea98924d`, `$id`s under
> `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`). Straylight
> should not flip any import to `@0xhoneyjar/loa-hounfour` inside
> this Phase 16 PR. The dependency flip is authorized for a
> separate follow-up PR — **Phase 17** — on Straylight's
> timeline. See
> [`hounfour-response-intake.md`](./hounfour-response-intake.md),
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
> and
> [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md).
>
> Companion docs:
> [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
> (which sibling issues exist and what they back) and
> [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
> (the rules every sibling-repo PR must respect).

## Recommended order

The recommended sibling-repo implementation order is:

1. **Hounfour** — schema / class-validation extraction
   ([`loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70))
2. **Finn** — runtime enforcement boundary
   ([`loa-finn#159`](https://github.com/0xHoneyJar/loa-finn/issues/159))
3. **Dixie** — governed recall / BFF boundary
   ([`loa-dixie#92`](https://github.com/0xHoneyJar/loa-dixie/issues/92))
4. **Freeside** — community / app surface boundary
   ([`loa-freeside#203`](https://github.com/0xHoneyJar/loa-freeside/issues/203))

Each step depends on the previous step in a specific, narrow way.
The dependencies are documented below so a future sibling-repo
reviewer can confirm that the upstream contract is in place before
they merge a downstream PR — and so a future sibling-repo author
can know exactly which upstream surface they are allowed to
depend on (and which they are not).

## Dependency rationale

### Why Hounfour goes first

Hounfour owns the **class lane**: the canonical schema /
class-validation vocabulary that every other lane references.

The wedge's primitives — `Assertion`, `Keyring`, `EstateTransition`,
`Challenge`, `Revocation`, `ForgetRecord`, `RecallRequest`,
`RecallPack`, `RecallReceipt`, `AuditEvent`, `CommitmentRoot` —
all have a *shape*. That shape is what Hounfour eventually pins
as canonical schemas (TypeBox / JSON Schema / equivalent), per
the Phase 9 handoff packet at
[`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md).

If Hounfour does not go first, every downstream sibling has to
either:

- import the wedge's *current-shape* helpers (which are explicitly
  not canonical schemas — see Phase 6 / 7 / 8), and risk freezing
  the wrong shape into the sibling repo; or
- invent its own ad-hoc shape, which collapses the class-vs-policy
  boundary the wedge depends on (see
  [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)).

Both paths are observable failure modes. Shipping Hounfour first
keeps shape in the class lane where it belongs.

#### Phase 16 update: Hounfour extraction landed in cycle-004; v8.5.0-rc.1 fired and v8.5.0 final shipped

Jani's response on issue #70 placed the Hounfour extraction in
**Hounfour cycle-004**, with the canonical surface targeting the
`@0xhoneyjar/loa-hounfour@^8.5.0` line. Since the original
intake was staged, the upstream cuts have landed:

- **v8.5.0-rc.1** fired at squash SHA `c94bcd22` on
  `loa-hounfour`. The shadow-integration window opened.
- **v8.5.0 final** shipped as `@0xhoneyjar/loa-hounfour@8.5.0`
  (tag `v8.5.0`, `main` HEAD `ea98924d`, all 234 published
  `$id`s resolving under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`).
- v8.6.0 carries the `Challenge` layer and the rest of the
  cycle-005 follow-on work.

See
[`hounfour-response-intake.md`](./hounfour-response-intake.md)
and
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
for the recorded deltas.

This does not change the cross-repo implementation order —
Hounfour still goes first — but it tightens what "first" means
for Straylight:

- Straylight **should not** flip any import to
  `@0xhoneyjar/loa-hounfour` inside this Phase 16 PR, even on a
  feature branch. Phase 16 is docs / readiness only.
- The dependency flip to `@0xhoneyjar/loa-hounfour@^8.5.0` is
  now eligible (the rc.1 wait gate is satisfied; v8.5.0 final has
  shipped) and is authorized for a **separate follow-up PR —
  Phase 17 — on Straylight's timeline**. Phase 17 is the PR that
  lands the alias / re-export module, applies the subpath import
  discipline, and validates against the now-shipped Hounfour
  validators per
  [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md).
- The downstream lanes (Finn, Dixie, Freeside) consume the same
  v8.5.0 line once Phase 17 lands. Finn / Dixie / Freeside
  implementation work that is gated on a stable Hounfour line is
  now unblocked at the upstream side, but the per-lane
  implementation work itself (in their respective sibling repos)
  remains under each repo's own teammate-review schedule.

The intent is the same as Phase 15: keep shape in the class lane,
keep the wedge as the source of truth until the dependency flip
in Phase 17 lands. The Phase 16 update only clarifies *which*
Hounfour line / tag triggers the import flip on the Straylight
side, and that the flip itself is Phase 17's job — not this PR's.

#### Next step: Phase 17 = Hounfour v8.5.0 dependency flip / shadow integration

The recommended next step on the Straylight side is **Phase 17**:
the dependency-flip / shadow-integration PR for
`@0xhoneyjar/loa-hounfour@^8.5.0`. Phase 17 is **separate from
Phase 16**:

- **Phase 16 (this PR)** ships docs and a readiness printer only:
  the response-intake, the adaptation delta updated for v8.5.0
  final, and the rc-shadow-integration checklist reframed as
  readiness evidence + the Phase 17 checklist. Phase 16 does not
  add any Hounfour dependency.
- **Phase 17 (separate follow-up PR)** adds
  `@0xhoneyjar/loa-hounfour` to `package.json`, lands the alias /
  re-export module described in delta #3 of
  [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
  applies the subpath import discipline (delta #9), and runs the
  shadow-integration steps in
  [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  against the live `@0xhoneyjar/loa-hounfour@8.5.0` validators.

Phase 17 must not be folded into Phase 16. Bundling the dep flip
into the response-intake PR would silently widen the Phase 16
scope past docs / readiness, defeat the "accepted-with-
adaptation, not direct import" framing, and bypass the separation
that
[`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
relies on for sibling-repo teammate review. Phase 17 is its own
PR, on Straylight's timeline, with its own review.

### Why Finn goes second (and not before Hounfour)

Finn owns the **runtime lane**: per-call admission, per-tool
recall gating, per-transition policy evaluation, signer competence,
transition execution, receipt emission, audit-chain persistence,
and recall-request execution boundaries — all under fail-closed
semantics, per the Phase 10 handoff packet at
[`finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md).

Finn's runtime gate evaluates *typed* assertions, transitions, and
recall requests. If Finn ships before Hounfour:

- Finn's runtime module will end up importing wedge-internal
  current-shape types as if they were canonical schemas, which
  creates a hard backwards-compatibility liability the moment
  Hounfour pins canonical shapes;
- or Finn will silently re-define the shape inside its own runtime
  module, which collapses the class lane into the runtime lane and
  re-creates the failure mode the boundary doc forbids
  ([`finn-runtime-boundary.md`](./finn-runtime-boundary.md));
- or Finn will couple to the wedge directly with no shape contract
  at all, in which case any future Hounfour extraction becomes a
  cross-repo break.

Finn may go second only after Hounfour ships canonical schemas
**or** the team agrees in writing to ship Finn against an
explicitly-stubbed Hounfour surface (i.e. Finn imports a typed
shim that mirrors the future Hounfour API, with the stub removed
in a follow-up PR after Hounfour lands). The stub path is
acceptable, but it is a *commitment to land Hounfour next*, not a
license to skip Hounfour.

### Why Dixie goes third (and not before Finn)

Dixie owns the **governed-recall / BFF / inspection lane**:
operator-facing / developer-facing recall, audit, provenance,
estate-summary, and assertion-status surfaces, per the Phase 12
handoff packet at
[`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md).

Dixie's BFF surfaces *call into* the runtime gate to serve recall
packs, return receipts, surface audit events, and route high-risk
recalls to review queues. If Dixie ships before Finn:

- Dixie has no runtime gate to call, so Dixie would have to
  re-implement runtime policy enforcement inside the BFF — which
  is the exact failure mode the Dixie boundary doc forbids
  ([`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md));
- or Dixie would have to call directly into the wedge in-process,
  which works for an MVP but does not survive the runtime-gate
  extraction (every Dixie call site would need to be rewritten);
- or Dixie's BFF would expose recall as generic retrieval to fill
  the gap, which is the most dangerous failure: it surfaces
  recall-shaped responses without recall receipts.

Dixie may go third only after Finn's runtime gate ships **or**
the team agrees in writing to ship Dixie against an
explicitly-mocked Finn surface for the duration of a single
follow-up PR.

### Why Freeside goes last (and must not go first)

Freeside owns the **community / app surface lane**: Discord /
Telegram / REST / NATS bot recall, public-channel redaction,
tenant-scoped recall, community-scoped recall, environment-frame
routing, feedback-signal capture, admin capability grants, bot
actions with receipt, and tenant-admin estate inspection, per the
Phase 14 handoff packet at
[`freeside-community-surface-issue.md`](./freeside-community-surface-issue.md).

Freeside is the most *visible* lane (it is what end users see in
Discord / Telegram / web) and so it has the highest blast radius
when it gets the boundaries wrong. Freeside is also the lane that
depends on the most upstream contracts at once: it depends on
Hounfour shape (to know what an `Assertion` is), on Finn runtime
enforcement (to know whether an action is allowed), on Dixie BFF
(to actually serve recall packs to bot consumers), and on the
wedge's privacy / public-channel rules (to know what may surface
in a public Discord channel).

If Freeside goes first:

- Freeside ends up serving bot recall directly out of the wedge,
  with no runtime gate and no BFF, which collapses every lane at
  once — and does it under the most user-visible surface.
- Freeside ends up treating bot conversation buffers as governed
  recall, which is the failure mode the Freeside boundary doc
  forbids
  ([`freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md)).
- Freeside ends up exposing private estate material in public
  Discord / Telegram channels (because there is no Dixie redaction
  surface to call), which is the highest-blast-radius privacy
  failure on the index.
- Every later sibling PR (Hounfour, Finn, Dixie) becomes a
  cross-repo breaking change for Freeside, because Freeside
  already shipped against the wedge directly.

Freeside MUST go last. The Hounfour / Finn / Dixie boundaries must
either be settled or explicitly mocked behind a typed shim before
Freeside opens its sibling-repo PR. The mocked path is acceptable
only if the team agrees in writing that Freeside will rewire to
the real upstream surfaces in a follow-up PR before any user-
facing rollout.

## What can run in parallel safely

The four sibling-repo PRs are not strictly serialized. The
following parallelism is safe:

- **Hounfour PR drafting in parallel with Finn / Dixie / Freeside
  handoff review.** Reviewing the in-repo Phase 10 / 12 / 14
  handoff packets does not require Hounfour to be open. Reviewers
  can read
  [`finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md),
  [`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
  and
  [`freeside-community-surface-issue.md`](./freeside-community-surface-issue.md)
  while Hounfour PR-A is being drafted.
- **Finn boundary-doc and mapping-table review in parallel with
  Hounfour PR-A code review.** The Finn handoff packet's mapping
  table (`finn-enforcement-mapping.md`) cross-references Hounfour
  schema candidates by name, which is reviewable without the
  Hounfour PR being merged.
- **Dixie BFF surface enumeration in parallel with Finn PR
  drafting.** Dixie's
  [`dixie-recall-mapping.md`](./dixie-recall-mapping.md) is a
  mapping from primitives to BFF surfaces; it does not need Finn
  to be merged.
- **Freeside mapping review in parallel with Dixie PR drafting.**
  Freeside's
  [`freeside-surface-mapping.md`](./freeside-surface-mapping.md)
  cross-references Dixie BFF surfaces by name; it is reviewable
  before Dixie merges.
- **In-repo (loa-straylight) work in parallel with all of the
  above.** None of the sibling-repo PRs blocks `loa-straylight`
  from continuing to validate the wedge in-process. The wedge
  remains the source of truth for primitive semantics until the
  sibling-repo PRs land.

The following parallelism is **not** safe and must not be
attempted (see
[`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)):

- **Finn PR merging in parallel with Hounfour PR-A merging,
  without an explicit shape stub.** The contract Finn imports must
  exist (canonical or stub) at the moment Finn merges.
- **Dixie BFF wiring in parallel with Finn merge, without an
  explicit Finn mock.** The runtime gate Dixie calls must exist
  (real or mocked) at the moment Dixie merges.
- **Freeside community / bot surface rollout in parallel with any
  of Hounfour / Finn / Dixie, without explicit mocks for all three
  and a written commitment to rewire.** Freeside's blast radius is
  too high to rely on implicit upstream timing.
- **Two sibling-repo PRs merging in the same review window without
  teammate review on each.** Self-approval is forbidden — see
  [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).

## Phase 26A-2 narrowing — MVP-slice Dixie-first recall-intake exception

> Status: append-only cross-reference recorded by Phase 26A-2.
> Bounded to the single `handleRecallIntake` handler. **No
> general reorder of the Hounfour → Finn → Dixie → Freeside
> sequence above.**

[`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md)
authorizes — but does not implement — exactly **one** future
Straylight runtime subpath at
`@loa/straylight/runtime/recall-intake`, exposing exactly the
handler set Dixie needs at MVP, gated to Dixie-only consumption,
marked experimental, with a recorded migration / retirement path
back to Finn when ADR-022E gate #9 fires. The companion handoff
is
[`./phase-26a2-runtime-recall-intake-subpath-authorization.md`](./phase-26a2-runtime-recall-intake-subpath-authorization.md).

This authorization narrows the recommended Phase 15
implementation order **only for this MVP slice**:

- A **future Straylight-only runtime recall-intake subpath**
  (`@loa/straylight/runtime/recall-intake`) MAY land **before
  Finn** under ADR-026A. The subpath ships in a later
  Straylight implementation PR; ADR-026A authorizes the scope,
  not the merge.
- Consumption is **Dixie-only** at MVP. The later
  implementation PR MUST define and test a concrete non-Dixie
  refusal mechanism per ADR-026A §"Decision" §7; if it cannot
  provide a credible mechanism, the implementation PR is
  blocked.
- **No Dixie endpoint is authorized** by ADR-026A or by this
  narrowing. The Dixie recall-intake endpoint requires its own
  later sibling-repo PR satisfying Phase 26A-1 T13–T18 in full
  and ADR-022E gate #10. See
  [`./phase-26a1-threat-model-dixie-endpoint.md`](./phase-26a1-threat-model-dixie-endpoint.md)
  +
  [`../mvp/threat-model.md`](../mvp/threat-model.md) (T13–T18 +
  T9 amendment).
- **No general reorder** of the Hounfour → Finn → Dixie →
  Freeside sequence above. The MVP-slice narrowing is bounded
  to the single `handleRecallIntake` handler and does not
  authorize Dixie ahead of Finn for any other handler.
- **No Hounfour adoption** by this narrowing. ADR-022E gates
  #1–#5, #17, #18 remain held.
- **No Finn wiring** by this narrowing. ADR-022E gate #9
  remains held.
- **No Freeside wiring** by this narrowing. ADR-022E gate #11
  remains held.
- **No Loa framework edits** by this narrowing. Per Phase
  26A-0 §"Decision" §7, framework edits are not authorized by
  Phase 26A-0 alone and not pre-approved by ADR-026A.
- **Finn remains the eventual runtime-enforcement owner** per
  ADR-022B and ADR-022E gate #9. The Straylight runtime
  subpath is a **pre-Finn MVP exception, not a permanent lane
  transfer**. When gate #9 fires, a future ADR (provisionally
  ADR-026B or successor) must move runtime enforcement to
  Finn, deprecate `@loa/straylight/runtime/recall-intake` with
  a documented deprecation window, retire the subpath, and
  restore Straylight to its full type-only posture per
  ADR-026A §"Decision" §8.
- **Straylight remains the semantic wedge owner.** Dixie does
  **not** become a semantic / runtime authority under this
  narrowing.

Reviewers may cite this section verbatim to refuse a citation of
ADR-026A / Phase 26A-2 as authorization for: a second runtime
subpath; runtime conditions on root `.` or `./host`; runtime
exports beyond the ADR-026A §"Decision" §3 allowlist; the Dixie
endpoint; Hounfour / Finn / Freeside wiring; Loa framework
edits; sibling-repo edits other than the narrowly-scoped later
Straylight implementation PR; tag / release creation; or any
general reorder of Phase 15.

## Phase 26D narrowing — single Dixie recall-intake endpoint PR authorization

> Status: append-only cross-reference recorded by Phase 26D.
> Bounded to **one** sibling-repo PR in `loa-dixie` adding **one**
> recall-intake endpoint/adapter consuming
> `@loa/straylight/runtime/recall-intake`. **No general reorder
> of the Hounfour → Finn → Dixie → Freeside sequence above.**
> **No other Dixie work is opened by this narrowing.**

[`../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md`](../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md)
authorizes — but does not itself implement — exactly **one**
future sibling-repo PR in
[`loa-dixie`](https://github.com/0xHoneyJar/loa-dixie). That
PR may add **one** recall-intake endpoint/adapter that consumes
`@loa/straylight/runtime/recall-intake` from the published
Straylight package surface, uses `createDixieCapability` and
`handleRecallIntake`, binds `STRAYLIGHT_RUNTIME_DIXIE_KEY` in
the deployment process environment, honors ADR-026C §3
obligations 3.1–3.8 in full, and resolves the Phase 26A-1
endpoint prerequisites (T13–T18 + the T9 persistence-posture
amendment) under ADR-026D §"Decision" §3 acceptance criteria.
The companion handoff is
[`./phase-26d-dixie-recall-intake-endpoint-authorization.md`](./phase-26d-dixie-recall-intake-endpoint-authorization.md).

This authorization narrows the recommended Phase 15
implementation order **only for this single endpoint slice**:

- The **single future Dixie recall-intake endpoint PR** in
  `loa-dixie` is now authorized under ADR-026D. The PR may
  open and merge ahead of any Hounfour adoption flip in
  `loa-straylight`, ahead of Finn wiring, and ahead of any
  other Dixie surface, **for this slice only**, because the
  Straylight runtime subpath authorized by ADR-026A and
  implemented by Phase 26B is the consumer surface the
  endpoint depends on, and the Phase 26A-1 threat-model
  prerequisites are now resolved or gated by ADR-026D §3.
- **No other Dixie work is authorized** by ADR-026D. The
  Phase 24E S2–S6 surfaces (receipt retrieval, exclusion
  display, provenance walk, audit-chain lookup, estate
  summary), the review-queue management surface, the
  governance timeline surface, any BFF rebuild, any operator
  console, and any Discord / Telegram / NATS / REST surface
  remain **unauthorized**. Each requires its own ADR.
- **No general reorder** of the Hounfour → Finn → Dixie →
  Freeside sequence above. The Phase 26D narrowing is bounded
  to the single recall-intake endpoint/adapter and does not
  authorize Dixie ahead of Finn for any other handler or
  surface.
- **No Hounfour adoption** by this narrowing. ADR-022E gates
  #1–#5, #17, #18 remain held.
- **No Finn wiring** by this narrowing. ADR-022E gate #9
  remains held. **Finn remains the eventual runtime-
  enforcement owner** per ADR-022B / ADR-022E gate #9; the
  Straylight runtime subpath is a pre-Finn MVP exception, not
  a permanent lane transfer.
- **No Freeside wiring** by this narrowing. ADR-022E gate #11
  remains held.
- **No production storage migration** by this narrowing.
  ADR-022E gate #8 remains held; the per-tenant memory cap
  and bounded estate-storage posture authorized under
  ADR-026D §3.a (iii) is the endpoint's own guardrail and
  does not authorize a production persistence adapter.
- **No Loa framework edits** by this narrowing. Per Phase
  26A-0 §"Decision" §7, framework edits remain
  separately-authorized.
- **No tag / release / package publish** by this narrowing.
- **No Straylight package-surface change** by this narrowing.
  The runtime allowlist is unchanged; no new runtime subpath
  is opened.
- **Straylight remains the semantic wedge owner.** Dixie does
  **not** become a semantic / runtime authority under this
  narrowing.
- **Sibling-repo PR review remains in `loa-dixie`** under
  teammate review. The PR MUST pass a real 3-model Flatline
  pass AND a real Bridgebuilder review pre-merge per
  ADR-026A0 §"Decision" §5.

Reviewers may cite this section verbatim to refuse a citation
of ADR-026D as authorization for: a second Dixie endpoint
beyond recall-intake; any Phase 24E S2–S6 surface; any review-
queue / governance / BFF / operator-console / Discord /
Telegram / NATS / REST surface; broader Dixie integration;
sibling-repo edits in any repo other than `loa-dixie`;
Straylight package-surface or runtime-source changes; Finn /
Hounfour / Freeside wiring; production storage migration
beyond the §3.a (iii) endpoint guardrail; Loa framework
edits; tag / release / package publishing; broad autonomy /
action execution; any general reorder of Phase 15; or any
successor-ADR pre-approval.

## Cross-references

- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — the index of filed sibling issues and the local handoff packet
  each one consumes.
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — the no-go rules that every sibling-repo PR must respect.
- [`docs/handoffs/README.md`](./README.md) — the per-packet
  handoff index (Phases 9 / 10 / 12 / 14).
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.2 (Hounfour), §6.2.3 (Finn), §6.2.4 (Dixie), §6.2.5
  (Freeside).
