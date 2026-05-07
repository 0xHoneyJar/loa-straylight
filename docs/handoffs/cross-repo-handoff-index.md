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
  100 KB cap).
- **Upstream status (Phase 16, post-intake update):**
  **v8.5.0-rc.1 fired** at squash SHA `c94bcd22` and **v8.5.0
  final has shipped** as `@0xhoneyjar/loa-hounfour@8.5.0` (tag
  `v8.5.0`, `main` HEAD `ea98924d`, all 234 published `$id`s
  resolving under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`). The
  pending-rc.1 wait is over; the rc.1 gate from the original
  shadow-integration checklist is **satisfied**. The v8.6.0
  forward pointer carries `Challenge`, `EstateTransition`, and
  related cycle-005 follow-on work.
- **Dependency-flip status (Phase 16 / Phase 17 split):** the
  wedge dependency flip to `@0xhoneyjar/loa-hounfour@^8.5.0` is
  now **eligible for a separate follow-up PR (Phase 17)** on
  Straylight's timeline. **This Phase 16 PR does not flip the
  import, does not add `@0xhoneyjar/loa-hounfour` to
  `package.json`, and does not change Phase 0–15 runtime
  behavior.** See:
  - [`docs/handoffs/hounfour-response-intake.md`](./hounfour-response-intake.md)
    — disposition counts, "accepted-with-adaptation" framing,
    and the post-intake upstream update.
  - [`docs/handoffs/hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
    — per-delta accepted-with-adaptation table updated for
    v8.5.0 final.
  - [`docs/handoffs/hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
    — readiness evidence + Phase 17 dependency-flip checklist
    (rc.1 / v8.5.0 final gates marked satisfied).
- **Local handoff packet (Phase 9):**
  - [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  - [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  - [`docs/handoffs/hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
- **Response-intake / rc-readiness packet (Phase 16):**
  - [`docs/handoffs/hounfour-response-intake.md`](./hounfour-response-intake.md)
  - [`docs/handoffs/hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  - [`docs/handoffs/hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
- **Shadow-integration / dependency-flip findings (Phase 17, in
  progress on a separate branch — not on `main`):**
  - [`docs/handoffs/hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
    — working-tree access-probe outcome, expected
    schema-availability comparison table, boundary-preservation
    note, `Challenge` / `EstateTransition` deferral re-affirmed,
    next-step gate (GitHub Packages auth provisioning for the
    `@0xhoneyjar` scope). The follow-up Phase 17 attempt updates
    this doc in place with the inspector's actual output once
    the package installs.
- **Upstream-review packet (Phase 19A, docs / coordination only —
  not on `main` as integration):**
  - [`docs/handoffs/hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
    — narrow upstream-review packet that summarizes the Phase 17B
    + Phase 18 shadow-inspection findings into seven load-bearing
    facts (package consumption works; resolves within `^8.5.0`;
    the 15 net-new v8.5.x schemas are present; `Challenge` and
    `EstateTransition` deferred to v8.6.0; `audit-event-transition`
    is `DISCOVERY_NOTE`, not blocker; `safeCanonicalize` subpath
    remains deferred under gate `no-confirmed-subpath`) and
    carries a copy-ready GitHub comment for issue #70. Phase 19A
    does not flip imports, change `package.json` /
    `package-lock.json`, change the Hounfour dependency, modify
    `src/straylight/hounfour-alias.ts` or
    `src/straylight/index.ts`, wire Finn / Dixie / Freeside, edit
    any sibling repo, or file the upstream comment on its own.
- **Local fixture directories:**
  - [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
  - [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
- **Local validate command:** `npm run hounfour:handoff` /
  `npm run hounfour:conformance` /
  `npm run hounfour:rc-readiness` (Phase 16, optional helper).
  The Phase 17 inspector (`npm run hounfour:shadow-inspect`) is
  added by the follow-up Phase 17 attempt only when the
  dependency installs.

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

## Phase 20A — Recall Wedge decision-lock packet (in-repo, not a sibling issue)

Phase 20A is a **narrow, in-repo decision-lock packet** staged
inside `loa-straylight` while the team waits for Jani / teammate
response on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
It is **not** a filed sibling issue, **not** Hounfour
integration, **not** Finn / Dixie / Freeside runtime wiring,
**not** sibling-repo coordination beyond an in-repo restatement,
and **not** authorization to begin Phase 20B work. It is docs /
coordination only.

The Phase 20A packet does **not** flip any wedge import, change
`package.json` / `package-lock.json`, change the Hounfour
dependency range or resolved patch, modify
[`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
edit any sibling repo, implement `Challenge` or
`EstateTransition`, reach into unexported Hounfour internals, or
touch `.loa/` / `.claude/`. It does **not** commit and does
**not** open a PR. The actual Phase 20B PR is a separate, future
event under teammate review.

The Phase 20A artifacts (all in-repo):

- [`docs/handoffs/phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
  — executive summary, decisions locked (the five ADR-020 series),
  decisions deferred (`Challenge`, `EstateTransition`,
  `safeCanonicalize` subpath, `audit-event-transition`, public
  anchoring, runtime persistence), implementation blockers
  removed (coordination-level ambiguities), implementation
  blockers remaining (awaiting issue #70, Hounfour v8.6.0,
  sibling-repo PRs), what Phase 20A explicitly did *not* do, and
  the ready/not-ready verdict for Phase 20B.
- [`docs/handoffs/phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)
  — Phase 20B candidate scope: branch (`phase-20b-recall-wedge-local-scaffold`),
  goal (library-shaped local scaffold), allowed scope (`src/straylight/`,
  `tests/`, demo, docs — *additive* only), explicit non-scope
  (no Finn / Dixie / Freeside wiring, no sibling-repo edits, no
  Hounfour schema authoring, no Hounfour dependency change, no
  `Challenge` / `EstateTransition`, no `safeCanonicalize`
  subpath, no public anchoring, no new HTTP surface, no
  `package.json` deps).

The five Phase 20A ADRs under
[`../decisions/`](../decisions/):

- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  — Loa-Straylight remains the semantic owner. Hounfour / Finn /
  Dixie / Freeside are *candidates* for their respective roles;
  none has yet implemented the staged contract.
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
  — Default candidate: Dixie-hosted recall inspection surface.
  Fallback: Finn-hosted endpoint. Phase 20A wires neither.
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
  — Future Straylight namespace / package surface; Hounfour
  remains the canonical schema candidate. `Challenge`,
  `EstateTransition`, and `safeCanonicalize` exported subpath
  are explicitly deferred.
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  — MVP receipt semantics owned by Loa-Straylight. Finn / Dixie
  / Freeside are *future* persistence / exposure candidates.
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — Local commitment-root helper unchanged. No public anchoring,
  no onchain integration. Future-requirement gates recorded for
  any later wiring ADR.

The Phase 20A packet introduces no new sibling issues, no new
sibling-repo handoff packets, no new fixture directories, no new
runtime imports, and no new validate command. It is purely a
docs / coordination decision-lock prepared while the team waits
for Jani / teammate response. The four filed sibling-repo issue
rows above (Hounfour / Finn / Dixie / Freeside) are unchanged by
Phase 20A.

## Phase 20B — Recall Wedge local scaffold (in-repo, not a sibling issue)

Phase 20B is a **narrow, in-repo local scaffold** staged on the
`phase-20b-recall-wedge-local-scaffold` branch inside
`loa-straylight` after the Phase 20A decision-lock packet was
merged. It is the first implementation-facing branch after
Phase 20A, but it remains **local**: it pins local recall
semantics on the existing `executeRecall` pipeline and does
**not** wire Finn, Dixie, Freeside, or Hounfour runtime
behavior. It is **not** a filed sibling issue, **not** Hounfour
integration, **not** Finn / Dixie / Freeside runtime wiring,
**not** sibling-repo coordination beyond an in-repo restatement,
and **not** the full Recall Wedge.

The Phase 20B packet does **not** flip any wedge import, change
`package.json` / `package-lock.json`, change the Hounfour
dependency range or resolved patch, modify
[`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
edit any other `src/` file, edit any sibling repo, add a Dixie
endpoint, implement `Challenge` or `EstateTransition`, reach
into unexported Hounfour internals, add a `safeCanonicalize`
subpath import, publish a public commitment root, or touch
`.loa/` / `.claude/`. It does **not** commit and does **not**
open a PR.

The Phase 20B artifact (in-repo):

- [`docs/handoffs/phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
  — Phase 20B local-scaffold summary: what was added (one
  additive test file plus three doc files), behaviors pinned
  (ADR-020D's six receipt categories — *included*, *excluded*,
  *redacted*, *challenged*, *revoked*, *blocked-by-policy* — on
  the existing `executeRecall` pipeline, plus the "structural
  validity is not authorization" invariant and a
  receipt-or-audit completeness pin), validation evidence
  (`npm run typecheck`, `npm test`), what Phase 20B explicitly
  did *not* do, what remains deferred, and what Phase 20B does
  *not* claim.

The Phase 20B test pin lives at
[`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts).
It uses only the existing public surface
([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
and the existing fixture builders
([`../../fixtures/index.ts`](../../fixtures/index.ts)); no new
fixture JSON files were added.

The Phase 20B packet introduces no new sibling issues, no new
sibling-repo handoff packets, no new fixture directories, no new
runtime imports, no new public-surface re-exports, no new
typed helpers under `src/straylight/`, and no new validate
command. The four filed sibling-repo issue rows above (Hounfour
/ Finn / Dixie / Freeside) are unchanged by Phase 20B.

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
- **Not** Recall Wedge implementation. The Phase 20A
  decision-lock packet linked above is docs / coordination only;
  it does not flip imports, change packages, wire any sibling
  repo, or scaffold any Phase 20B code on its own. The actual
  Phase 20B PR is a separate, future event under teammate
  review. **Phase 20B**
  ([`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md))
  is a **local scaffold only** — it pins ADR-020D's six receipt
  categories on the existing `executeRecall` pipeline inside
  `loa-straylight`. It is not runtime-wired, not Hounfour
  integration, not Finn / Dixie / Freeside wiring, not a Dixie
  endpoint, not a `Challenge` or `EstateTransition`
  implementation, and not the full Recall Wedge.

## Cross-references

- [`docs/handoffs/README.md`](./README.md) — the per-packet
  handoff index (Phases 9 / 10 / 12 / 14).
- [`docs/handoffs/phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
  — Phase 20A decision-lock readiness packet.
- [`docs/handoffs/phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)
  — Phase 20A-staged Phase 20B candidate scope.
- [`docs/handoffs/phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
  — Phase 20B local-scaffold summary (ADR-020D receipt categories
  pinned on the existing `executeRecall` pipeline; not
  runtime-wired).
- [`docs/decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  — semantic-owner decision-lock.
- [`docs/decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
  — MVP endpoint-host recommendation + fallback.
- [`docs/decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
  — schema-namespace strategy + Phase 20A deferrals.
- [`docs/decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  — receipt-ownership + persistence-deferral decision-lock.
- [`docs/decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — commitment-root / public-anchor deferral.
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
