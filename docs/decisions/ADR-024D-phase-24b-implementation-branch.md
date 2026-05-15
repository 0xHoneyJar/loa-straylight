# ADR-024D — Phase 24B implementation-branch scope (decision-lock for Phase 24A)

## Status

Accepted-for-Phase-24A.

This ADR is a Phase 24A docs-only decision-lock. It defines the
next implementation branch after Phase 24A — `phase-24b-*` — and
scopes what that branch is and is not allowed to do, given the
Dixie-first host placement ADR-024B locked, the substrate intake
ADR-024A reaffirmed, and the package-release discipline ADR-024C
pinned. It does **not** open `phase-24b-*` itself, does **not**
authorize any source / test / fixture / package / sibling-repo
edit, and does **not** wire any endpoint. The actual `phase-24b-*`
branch is a future, separate event under teammate review.

## Context

Phase 24A is docs-only. It produced four ADRs:

- ADR-024A
  ([`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md))
  — substrate intake; semantic-owner reaffirmation post-#116.
- ADR-024B
  ([`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md))
  — MVP host placement: Dixie-first (recall-pack-inspection-first).
- ADR-024C
  ([`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md))
  — package-release discipline: consume only published releases.
- ADR-024D — this ADR.

Plus two handoff documents:

- [`../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md`](../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary handoff.
- [`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md)
  — per-component intake of Hounfour PR #116.

The combined Phase 24A picture:

- Dixie is selected as the next MVP host (recall-pack-inspection
  slice; shape (b) under ADR-022B criterion #2).
- The wedge owns every primitive the host would expose.
- The Hounfour dependency range stays `^8.6.0`, resolved `8.6.0`.
- No Hounfour `main` consumption; no git-source pin.
- ADR-022E gates #1 (`EstateTransition` schema), #2
  (`safeCanonicalize` subpath), #4 (`Challenge` adoption), and
  #5 (`AuditEvent` rename) remain in force.
- The Phase 19A pending feedback gate on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  remains pending.

The natural next implementation branch is `phase-24b-*`. Its
shape must follow ADR-022B's "Phase 22 boundary-preparation work
in `loa-finn` / `loa-dixie` is not authorized" rule, narrowed to
Phase 24's specifics: ADR-024B places Dixie, but placement is not
sibling-repo authorization. Phase 24B is therefore **local
additive scaffolding only**, under the recall-pack-inspection MVP
shape, with all ADR-022E gates and the ADR-024C package-release
discipline preserved.

## Decision

1. **The next implementation branch after Phase 24A is named
   `phase-24b-<descriptor>`.** A representative descriptor is
   `phase-24b-recall-pack-inspection-scaffold` (the descriptor is
   not binding — the actual branch may select a narrower or
   broader descriptor under teammate review, provided the scope
   below is preserved). Phase 24A does **not** open the branch.

2. **Phase 24B is local additive scaffolding inside `loa-straylight`
   only.** Phase 24B does **not** touch any sibling repo. The
   Dixie-first placement ADR-024B locked is the **host target**
   the scaffold is shaped against — not a sibling-repo wiring
   authorization.

3. **Phase 24B's allowable scope is narrow.** Permitted, when
   strictly additive and inside `loa-straylight`:

   - **Local TypeScript additions to
     [`../../src/straylight/`](../../src/straylight/) that
     express the recall-pack-inspection MVP host contract**
     (e.g. an additive type / interface that pins the shape Dixie
     would receive from the wedge, named under the existing
     [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
     public surface convention). Additions must preserve the
     Phase 5 "MVP host contract" invariants — the audit-chain
     and receipt-shape invariants pinned in
     [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts).
   - **Additive tests** under
     [`../../tests/`](../../tests/) that exercise vectors 1–8 of
     the Phase 23A eleven-vector matrix
     ([`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md))
     against the wedge runtime via locally-owned shapes. No new
     test depends on `EstateTransition` on the wire (vector 10
     remains a gate, not exercised). No new test depends on
     `safeCanonicalize` on the wire (vector 11 remains a gate,
     not exercised). No new test imports from a Hounfour-side
     working-tree path.
   - **Additive fixtures** under
     [`../../fixtures/`](../../fixtures/) that back the additive
     tests. No fixture renames an existing fixture or moves an
     existing fixture path.
   - **Additive docs** under `docs/handoffs/`, `docs/specs/`, or
     `docs/decisions/` that record the Phase 24B implementation.
     If a Phase 24B ADR is needed (e.g. ADR-024E for a future
     concern), it is authored separately.
   - **A Dixie-side handoff packet refresh** — additive updates
     to
     [`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md),
     [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md),
     and / or
     [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
     that pin the recall-pack-inspection MVP contract Phase 24A
     placed against. The handoff packet refresh is **in-repo
     only**; it does not file a sibling-repo issue, comment, or
     PR.

4. **Phase 24B's hard non-scope** — forbidden in `phase-24b-*`:

   - **No `package.json` / `package-lock.json` change.** The
     Hounfour dependency range stays `^8.6.0`, resolved `8.6.0`,
     per ADR-024C. No `loa-dixie` / `loa-finn` / `loa-freeside`
     / `loa-hounfour` range bump. No new dependency.
   - **No consumption from Hounfour `main` or any unpublished
     commit.** Per ADR-024C.
   - **No Dixie endpoint in `loa-straylight`.** No HTTP / REST /
     NATS / Discord / Telegram surface added to the wedge.
     ADR-022D pins the wedge as MVP audit / receipt owner; the
     wedge does not become the host itself.
   - **No Finn endpoint.** No runtime tool-call recall slice.
     Finn remains the later-runtime-collaborator per ADR-024B.
   - **No Freeside endpoint.** Per ADR-024B and the no-go
     sequence
     ([`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)).
   - **No edits to any sibling repo.** `loa-hounfour`,
     `loa-finn`, `loa-dixie`, and `loa-freeside` are untouched
     by `phase-24b-*`. Filing / opening / merging any sibling-
     repo issue, comment, or PR is a separate, future, human-
     reviewed event.
   - **No schema authoring.** No TypeBox schema, no JSON Schema,
     no `$id` declared in `loa-straylight`. Per ADR-020C /
     ADR-022C, schema authorship is upstream when adopted —
     and `phase-24b-*` does not adopt.
   - **No `Challenge` adoption.** ADR-022E gate #4 unchanged.
   - **No `EstateTransition` implementation.** ADR-022E gate #1
     unchanged.
   - **No `safeCanonicalize` subpath import.** ADR-022E gate #2
     unchanged. The local canonicalizer
     ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
     remains.
   - **No `AuditEvent` rename.** ADR-022E gate #5 unchanged.
   - **No public commitment-root publication.** ADR-020E
     unchanged.
   - **No persistence wiring** beyond the existing
     `InMemoryStorage` / `JsonlStorage` MVP adapters per
     ADR-020D / ADR-022D.
   - **No adoption of the `0xhoneyjar:straylight:*` prefix
     family into the Straylight public surface** on the strength
     of Hounfour #116 alone.
   - **No adoption of the `recall-wedge` conformance category
     into the Straylight test suite** on the strength of
     Hounfour #116 alone.
   - **No import of the Hounfour five-step conformance corpus**
     from a Hounfour-side working-tree path.
   - **No reach into unexported Hounfour internals.** Per
     Phase 17B / 18 / 21A / 21B / ADR-024A / ADR-024C.
   - **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
     / `.gitignore` / `.gitmodules` / `.npmrc` edits.**
   - **No GitHub-side action against any sibling repo.** No
     `gh` / `curl` / API call. No issue / comment / PR filed.

5. **Phase 24B entry conditions.** Before `phase-24b-*` may
   open:

   - ADR-024A, ADR-024B, ADR-024C, and ADR-024D have all merged
     to `main` under teammate review.
   - The Phase 24A summary handoff
     ([`../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md`](../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md))
     and the per-component intake
     ([`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md))
     have merged.
   - No Hounfour-side release event has invalidated ADR-024C's
     `^8.6.0` pin in a way that would require a Phase 24B
     rebase. (If a new release publishes the #116 outputs while
     `phase-24b-*` is open, a separate ADR-024C-supersede or a
     Phase 24C entry packet handles the range bump; Phase 24B
     does not bump.)
   - The Phase 19A pending feedback gate on issue #70 either
     remains pending (and `phase-24b-*` proceeds under the
     "local additive scaffolding only" rule of this ADR), **or**
     a substantive answer arrives (in which case the answer is
     intaken in a separate doc / ADR before `phase-24b-*`
     opens). ADR-024D does not gate `phase-24b-*` on receiving
     the answer; the gate has been load-bearing since Phase 19A
     and stays load-bearing for the sibling-repo wiring that
     `phase-24b-*` does *not* perform.

6. **Phase 24B non-go conditions.** `phase-24b-*` must **not**
   open or, if open, must halt, if:

   - Any of the four ADR-024A–D have been reopened or reverted.
   - A teammate review has withdrawn the Dixie-first placement.
   - A Hounfour-side event has invalidated ADR-024C's range
     pin and no superseding ADR has been merged.
   - The proposed work would touch any of the hard non-scope
     items in §4 above.
   - The proposed work would file or edit any GitHub issue,
     comment, or PR against a sibling repo.
   - The proposed work would adopt a Hounfour symbol into the
     Straylight public surface without a separate adoption ADR.

7. **Phase 24A does not open `phase-24b-*`.** This ADR scopes the
   branch; it does not author the branch. Opening, naming, and
   beginning work on `phase-24b-*` is a future, separate,
   human-reviewed event under teammate review.

## Consequences

- Reviewers of any `phase-24b-*` PR may cite this ADR to refuse
  scope creep. Specifically: any diff that violates §4 (hard
  non-scope) should be requested-changes on cite.
- The actual implementation work the recall-pack-inspection MVP
  needs (additive types, additive tests, additive fixtures,
  additive docs, Dixie-side handoff-packet refresh) all remains
  available to `phase-24b-*` without requiring any of the gated
  features in §4.
- If `phase-24b-*` finds it cannot accomplish a meaningful
  recall-pack-inspection slice within §3 (allowable scope), the
  correct response is to author a new Phase 24C entry packet
  that documents the obstacle — **not** to expand §3 by
  amendment. The §3 / §4 boundary is the load-bearing scope
  rule; expanding it requires a superseding ADR.
- ADR-024B's host placement is binding for the recall-pack-
  inspection slice. A later runtime-tool-call slice may select a
  different host (most plausibly Finn) under a separate ADR.
  ADR-024D does not pre-authorize a Finn host placement.

## Why "local additive scaffolding only" rather than sibling-repo wiring

ADR-022B's Phase 21B Q5 rationale carries forward: until the
Phase 19A pending feedback gate on issue #70 is answered, no
sibling-repo boundary preparation work in `loa-dixie` /
`loa-finn` / `loa-freeside` is authorized. ADR-024B places the
host; it does not unblock sibling-repo work. The Phase 19A gate
is the load-bearing gate; the Dixie-first placement is the
load-bearing scope shape; ADR-024D is the load-bearing scope
*rule* that ties the two together for `phase-24b-*`.

This shape lets `phase-24b-*` make real, reviewable,
test-covered progress on the wedge side of the recall-pack-
inspection MVP — additive types, additive tests, additive
fixtures, a Dixie-side handoff-packet refresh — without
crossing any sibling-repo boundary or any deferred-feature gate.

## Non-scope (Phase 24A)

- This ADR does **not** open `phase-24b-*`.
- This ADR does **not** authorize sibling-repo edits in
  `phase-24b-*` or in any later phase.
- This ADR does **not** name specific source / test / fixture
  files for `phase-24b-*` to add. Naming the additive files is a
  `phase-24b-*` author / reviewer responsibility, subject to the
  scope this ADR pins.
- This ADR does **not** authorize a `package.json` dependency
  range change.
- This ADR does **not** authorize endpoint code in `loa-straylight`.
- This ADR does **not** authorize the adoption of any Hounfour
  symbol into the Straylight public surface.
- No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
  edits.
- No commit, no push, no PR.

## Source files inspected

- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md)
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
- [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)
- [`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md)
- [`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)
- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md)
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md)
- [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
- [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
- [`../handoffs/phase-20d-recall-wedge-endpoint-boundary.md`](../handoffs/phase-20d-recall-wedge-endpoint-boundary.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
- [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md)
- [`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md)
- [`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md)
- [`../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md`](../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (public surface, unchanged by Phase 24A)
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts) (unchanged by Phase 24A)
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts) (unchanged by Phase 24A)
