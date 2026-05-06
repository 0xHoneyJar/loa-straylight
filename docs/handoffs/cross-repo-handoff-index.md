# Cross-repo handoff index

> Status: Phase 16. **Coordination artifact only, in
> `loa-straylight`.** This document is the in-repo index of the four
> sibling-repo handoff packets staged by Phases 9 / 10 / 12 / 14, plus
> the Phase 16 Hounfour response-intake / rc-readiness packet. It is
> **not** cross-repo implementation. It is **not** Hounfour
> integration. Filing, opening, reviewing, or merging the sibling-
> repo PRs is out of scope for this index and must happen in the
> sibling repo, under teammate review.
>
> Nothing in this document imports from `loa-hounfour`, `loa-finn`,
> `loa-dixie`, `loa-freeside`, `.loa/`, or `.claude/` framework
> internals. Nothing here adds dependencies, edits sibling repos,
> or changes Phase 0–15 behavior.

## Purpose

Phases 9, 10, 12, and 14 each staged a self-contained handoff
packet (issue draft + boundary doc + mapping table + deterministic
fixture pack) for a different sibling repo. Each packet is locally
consistent and independently validated by `npm test`, but the
packets do not, on their own, tell a reader:

- which sibling-repo issues already exist;
- which local Straylight handoff doc backs each filed issue;
- which local fixture directory each filed issue points at;
- and that **no sibling-repo PR may merge without teammate review**.

This index supplies that coordination view. It is the single page
to read first when the work moves out of `loa-straylight` and into
the sibling repos.

## Filed sibling issues

The four filed sibling issues, the local Straylight handoff packet
that backs each one, and the local fixture directory each one
references:

### Hounfour — schema / class-validation extraction

- **Filed sibling issue:**
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
- **Response status (Phase 16):** *accepted-with-adaptation*. Jani
  responded on the Hounfour side with a per-primitive disposition
  (9 REUSE / 4 EXTEND / ~21 ADD-NEW / 6 DEFER to cycle-005 / 1 FOLD
  of `CandidateAssertion` into `Assertion` with `status: "candidate"`)
  and an adaptation plan covering package version target, `$id`
  naming, `CapabilityScope` harmonization, the 4-variant
  `ForgetRecord` model, and `safeCanonicalize` (NFC + RFC 8785 +
  100 KB cap). Hounfour integration is **pending v8.5.0-rc.1**:
  Straylight will not flip imports until the rc.1 tag exists and
  has been validated through the shadow-integration checklist
  below. See:
  - [`docs/handoffs/hounfour-response-intake.md`](./hounfour-response-intake.md)
    — disposition counts and "accepted-with-adaptation" framing.
  - [`docs/handoffs/hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
    — per-delta accepted-with-adaptation table.
  - [`docs/handoffs/hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
    — future v8.5.0-rc.1 shadow-integration window plan.
- **Local handoff packet (Phase 9):**
  - [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  - [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  - [`docs/handoffs/hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
- **Response-intake / rc-readiness packet (Phase 16):**
  - [`docs/handoffs/hounfour-response-intake.md`](./hounfour-response-intake.md)
  - [`docs/handoffs/hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  - [`docs/handoffs/hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
- **Local fixture directories:**
  - [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
  - [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
- **Local validate command:** `npm run hounfour:handoff` /
  `npm run hounfour:conformance` /
  `npm run hounfour:rc-readiness` (Phase 16, optional helper)

### Finn — runtime enforcement boundary

- **Filed sibling issue:**
  [`0xHoneyJar/loa-finn#159`](https://github.com/0xHoneyJar/loa-finn/issues/159)
- **Local handoff packet (Phase 10):**
  - [`docs/handoffs/finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md)
  - [`docs/handoffs/finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  - [`docs/handoffs/finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
- **Local fixture directory:**
  [`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/)
- **Local validate command:** `npm run finn:enforcement`

### Dixie — governed recall / BFF boundary

- **Filed sibling issue:**
  [`0xHoneyJar/loa-dixie#92`](https://github.com/0xHoneyJar/loa-dixie/issues/92)
- **Local handoff packet (Phase 12):**
  - [`docs/handoffs/dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  - [`docs/handoffs/dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  - [`docs/handoffs/dixie-recall-mapping.md`](./dixie-recall-mapping.md)
- **Local fixture directory:**
  [`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
- **Local validate command:** `npm run dixie:recall`

### Freeside — community / app surface boundary

- **Filed sibling issue:**
  [`0xHoneyJar/loa-freeside#203`](https://github.com/0xHoneyJar/loa-freeside/issues/203)
- **Local handoff packet (Phase 14):**
  - [`docs/handoffs/freeside-community-surface-issue.md`](./freeside-community-surface-issue.md)
  - [`docs/handoffs/freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md)
  - [`docs/handoffs/freeside-surface-mapping.md`](./freeside-surface-mapping.md)
- **Local fixture directory:**
  [`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/)
- **Local validate command:** `npm run freeside:surface`

## Recommended next steps

1. Read [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
   before starting any sibling-repo PR. It explains why Hounfour
   leads, why Finn cannot wire ahead of Hounfour without explicit
   stubs, why Dixie depends on Finn, and why Freeside is last.
2. Read [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
   before opening a sibling-repo PR. It lists the rules that the
   sibling-repo PRs must not violate.
3. Use the per-packet handoff documents listed above as the
   authoritative input to the sibling-repo PR. Do not paraphrase
   the handoff in the sibling repo — link back to the canonical
   in-repo packet.

## Sibling-repo PRs require teammate review before merge

**Sibling-repo PRs require teammate review before merge.** This
applies to every sibling repo on this index — `loa-hounfour`,
`loa-finn`, `loa-dixie`, and `loa-freeside`. No author may
self-approve a PR that consumes one of these handoff packets, even
when the PR appears to be a pure mechanical extraction of the
canonical primitive.

Reasoning:

- Each handoff packet pins a primitive whose semantics live in
  `loa-straylight`. A teammate reviewer is the only practical
  defense against the sibling repo silently re-defining a primitive
  the wedge owns.
- Each handoff packet also pins explicit non-goals. A teammate
  reviewer is the only practical defense against scope creep at
  the gate.
- The four packets are interdependent (Hounfour → Finn → Dixie →
  Freeside). A teammate reviewer is the only practical defense
  against an out-of-order merge that breaks a downstream packet's
  assumptions.

If a sibling-repo PR is merged without teammate review, the merge
is treated as a violation of this index regardless of the diff's
content.

## What this index is *not*

- **Not** a license to begin sibling-repo work without reading the
  per-packet handoff documents.
- **Not** a substitute for `cross-repo-implementation-order.md` or
  `cross-repo-no-go-sequence.md`. The order doc and the no-go doc
  are required reading before opening a sibling-repo PR.
- **Not** a runtime cross-repo dependency. This index is docs +
  fixture-pack pointers. It introduces no imports from sibling
  repos, no NPM dependencies, and no behavior changes inside
  `loa-straylight`.
- **Not** a record of merged sibling-repo PRs. The four issue URLs
  above are the *filed* issues, not merged PRs. Merging the
  sibling-repo PR is a separate, future, sibling-repo event under
  teammate review.

## Cross-references

- [`docs/handoffs/README.md`](./README.md) — the per-packet
  handoff index (Phases 9 / 10 / 12 / 14).
- [`docs/handoffs/cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order and dependency
  rationale.
- [`docs/handoffs/cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — the no-go rules that every sibling-repo PR must respect.
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.2 (Hounfour), §6.2.3 (Finn), §6.2.4 (Dixie), §6.2.5
  (Freeside).
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface that all four packets
  reference.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  fail-closed defenses all four packets pin against.
