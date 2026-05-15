# ADR-024A — Hounfour #116 substrate intake (decision-lock for Phase 24A)

## Status

Accepted-for-Phase-24A.

This ADR is a Phase 24A docs-only decision-lock. It is the
post-Hounfour-#116 reaffirmation of ADR-020A and ADR-022A — the
Phase 24-entry restatement of Straylight semantic ownership and
the anti-collapse invariants the wedge relies on — against the
upstream merge event Phase 24A intakes. It does **not** change
Phase 0–23A runtime behavior, does **not** wire any sibling repo,
does **not** adopt any Hounfour symbol into the Straylight public
surface, and does **not** redefine any primitive. It records the
semantic-ownership position so Phase 24 (and any later
implementation phase) cannot silently drift the boundary on the
back of Hounfour PR #116's merge.

## Context

[`0xHoneyJar/loa-hounfour#116`](https://github.com/0xHoneyJar/loa-hounfour/pull/116)
merged to Hounfour `main` and added the **Hounfour-side**
Straylight Recall Wedge conformance / contract substrate:

- registered the `0xhoneyjar:straylight:*` audit-event prefix
  family upstream;
- registered `recall-wedge` as a conformance category upstream;
- added `docs/architecture/recall-wedge-composition.md` upstream;
- added the five-step recall-wedge conformance corpus upstream;
- added the recall-wedge vector tests upstream;
- regenerated the upstream `schema/dist/release-integrity`
  outputs;
- preserved the Hounfour boundary explicitly — schema, protocol,
  and conformance only.

The full per-component intake is recorded in
[`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md).

ADR 0001 ([`./0001-repo-purpose.md`](./0001-repo-purpose.md))
declares `loa-straylight` as the semantic and product architecture
home for Straylight. ADR-020A
([`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md))
locked that boundary against the v8.5.x line. ADR-022A
([`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md))
reaffirmed it post-v8.6.0. ADR-024A is the Phase 24-entry
restatement that the v8.6.0-plus-#116 substrate event requires.

Two adjacent facts shape this reaffirmation:

1. **Hounfour PR #116 is an upstream substrate event, not a
   transfer of ownership.** It registers a prefix family Straylight
   names (`0xhoneyjar:straylight:*`) and a conformance category
   Straylight defines (`recall-wedge`), but does so on the Hounfour
   side as substrate available for *adoption*, not as a Straylight
   public surface flip. Per ADR-020C / ADR-022C, schema *shape*
   ownership migrates by **adoption**, not by **rename**.
2. **Hounfour #116 is not yet a consumable package.** Per
   ADR-024C ([`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)),
   Straylight consumes only published GitHub Packages releases.
   Until a release tag publishes `dist/` outputs that include the
   #116 outputs, the recall-wedge conformance corpus is **upstream
   test substrate**, not **Straylight runtime substrate**.

Two prior gates remain unsatisfied and are not advanced by #116
or by Phase 24A:

- Phase 19A pending feedback for
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  remains pending. The Phase 22A-drafted status comment was filed
  before Phase 23A by the user (a separate human-reviewed event);
  no substantive answer has been received.
- ADR-022E gate #1 (`EstateTransition` schema absence; delta #8
  still queued) and gate #2 (`safeCanonicalize` exported subpath
  absent; gate `no-confirmed-subpath` unchanged) are unchanged by
  #116. #116 did not author or ship either schema or subpath; it
  shipped a conformance corpus and an audit-event prefix family.

## Decision

1. **Loa-Straylight remains the semantic / control-plane home for
   Straylight, post-Hounfour-#116.** The primitive list pinned in
   ADR 0001 — `Actor`, `Estate`, `Assertion`, `AssertionStatus`,
   `Keyring`, `Policy`, `Transition`, `RecallRequest`,
   `RecallPack`, `RecallReceipt`, `Challenge`, `Revocation`,
   `Commitment`, `AuditEvent` — continues to be owned by
   `loa-straylight`. Local source of truth is
   [`../../src/straylight/`](../../src/straylight/), re-exported
   through
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   per the [package boundary](../mvp/package-boundary.md). No
   sibling repo re-defines any of these primitives by Phase 24A.

2. **The `0xhoneyjar:straylight:*` audit-event prefix family is
   Straylight-owned, even though it is registered upstream.** Per
   ADR-020A / ADR-022A, the prefix names a Straylight semantic
   class. Hounfour #116 registering the family upstream is a
   *substrate* event — the upstream registration enables Hounfour
   validators to recognize the prefix, but the **meaning** of any
   event under that prefix is fixed by Straylight, not by
   Hounfour. Renaming the prefix's home registry does not transfer
   ownership of its semantics.

3. **The `recall-wedge` conformance category is Straylight-defined,
   even though it is registered upstream.** Per the Phase 23A
   schema-contract draft
   ([`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md))
   and the Phase 23A eleven-vector conformance matrix
   ([`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)),
   the wedge MVP defines the lanes (`class_validation` /
   `policy_validation` / `audit_validation` / `keyring_validation`),
   the per-object minimum required fields, and the per-vector
   expected outcomes. Hounfour #116 registering `recall-wedge` as
   a *category* upstream does not transfer category authorship to
   Hounfour; it registers a slot Hounfour can validate *against*
   the Straylight definition.

4. **The five-step recall-wedge conformance corpus is upstream
   test substrate, not Straylight runtime substrate.** It runs
   inside Hounfour's test suite, regenerates Hounfour's
   `schema/dist/release-integrity` outputs, and proves the
   Hounfour validators behave consistently against the corpus.
   It does **not** author any Straylight runtime, does **not**
   import from
   [`../../src/straylight/`](../../src/straylight/), and is **not**
   adopted by Phase 24A into any Straylight test, fixture, or
   source file. The Phase 23A eleven-vector matrix is the
   Straylight-side conformance map; the #116 five-step corpus is
   the Hounfour-side validator-conformance map. The two are
   coordinate, not subordinate.

5. **No anti-collapse rule weakens because of #116.** Specifically:
   - Class-vs-policy
     ([`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md))
     is unchanged. A class-valid carrier (assertion, recall
     request, receipt) is **not** a policy-allowed carrier; #116
     does not move the boundary.
   - Receipt-or-audit completeness
     ([`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md),
     [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md))
     is unchanged. The wedge owns the six receipt categories
     (`included` / `excluded` / `redacted` / `challenged` /
     `revoked` / `blocked-by-policy`) and the audit-chain
     invariants pinned in
     [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts).
     #116 ships none of these on the wire.
   - `AuditEvent` (Straylight-owned) is **not** renamed to any
     Hounfour-side adjacent name (`audit-trail-entry` /
     `domain-event`). ADR-022E gate #5 is unchanged.
   - `Challenge` adoption (ADR-022E gate #4) is **not** advanced.
     The `challenge.schema.json` shipped at v8.6.0 remains
     substrate; the wedge public surface still does not re-export
     it.
   - `EstateTransition` (ADR-022E gate #1) is **not** unblocked
     by #116; no schema was shipped.
   - `safeCanonicalize` (ADR-022E gate #2) is **not** unblocked
     by #116; no exported subpath was declared. Reaching into
     unexported Hounfour internals remains forbidden per
     Phase 17B / 18 / 21A / 21B.
   - Public commitment-root anchoring (ADR-020E) is **not**
     unblocked by #116.
   - `PolicyDecision` remains wedge-only per ADR-020A / ADR-022A
     / ADR-022D. #116 does not produce a Hounfour-side
     `PolicyDecision`.

6. **The wedge owns every primitive the staged handoff packets
   describe until a sibling-repo PR lands under teammate review.**
   #116 is a Hounfour-side PR that shipped conformance / audit-
   prefix substrate; it is not a Finn, Dixie, or Freeside
   sibling-repo wiring PR. The Phase 9 / 10 / 12 / 14 handoff
   packets and the Phase 20D Phase 23A spec docs remain the
   in-repo contract.

7. **Phase 24A is a docs-only decision-lock.** No sibling-repo
   work is authorized. No code is written outside the
   `docs/decisions/` and `docs/handoffs/` paths. No `src/`,
   `tests/`, `scripts/`, `fixtures/`, `package.json`, or
   `package-lock.json` change is made.

## Consequences

- Any future migration of a primitive's semantic ownership remains
  a **separate** ADR that must cite the upstream Hounfour schema,
  the boundary preservation test(s), and the corresponding
  sibling-repo PR under teammate review.
- Reviewers should reject any Phase 24+ PR that:
  - Introduces a Hounfour-named symbol into the public surface
    on the strength of #116 alone.
  - Claims `recall-wedge` is now Hounfour-authored because
    #116 registered the category upstream.
  - Claims the `0xhoneyjar:straylight:*` prefix is now
    Hounfour-owned because #116 registered the family upstream.
  - Promotes the Hounfour five-step conformance corpus to a
    Straylight-side test asset by import or by adoption.
  - Adopts `Challenge`, `EstateTransition`, `safeCanonicalize`,
    or any `AuditEvent` candidate as a consequence of #116.
- ADR-024B (MVP host selection — Dixie-first), ADR-024C
  (package-release ambiguity discipline), and ADR-024D (Phase 24B
  implementation-branch scope) all rest on this reaffirmation.
  If this ADR is reopened, those ADRs reopen with it.

## Non-scope (Phase 24A)

- No Finn runtime wiring. No Finn boundary preparation work in
  `loa-finn`.
- No Dixie runtime wiring. No Dixie boundary preparation work in
  `loa-dixie` (Phase 24B-scope decisions are in ADR-024B /
  ADR-024D, not here).
- No Freeside runtime wiring. No Freeside-side work.
- No edits to any sibling repo.
- No new Hounfour schemas authored.
- No `Challenge` re-export, adoption, or import into the
  Straylight public surface.
- No `EstateTransition` implementation.
- No `safeCanonicalize` subpath import. Gate
  `no-confirmed-subpath` unchanged.
- No reach into unexported Hounfour internals.
- No `audit-trail-entry` / `domain-event` rename into `AuditEvent`.
- No public anchor / commitment-root publication.
- No `package.json` / `package-lock.json` changes. Hounfour
  dependency range remains `^8.6.0`, resolved patch `8.6.0`.
- No consumption from Hounfour `main` or any unpublished commit.
  Per ADR-024C, Straylight consumes only published GitHub
  Packages releases.
- No `src/` / `tests/` / `scripts/` / `fixtures/` changes.
- No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` /
  `.gitignore` / `.gitmodules` / `.npmrc` edits.
- No commit, no push, no PR. No GitHub-side action against any
  sibling repo.

## Source files inspected

- [`./0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020B-recall-wedge-endpoint-host.md`](./ADR-020B-recall-wedge-endpoint-host.md)
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md)
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
- [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §1.4, §1.5, §2, §3
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md)
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)
- [`../handoffs/README.md`](../handoffs/README.md)
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
- [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md)
- [`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md)
- [`../handoffs/hounfour-116-merge-intake.md`](../handoffs/hounfour-116-merge-intake.md) (Phase 24A intake doc)
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (public surface, unchanged by Phase 24A)
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts) (private alias, unchanged by Phase 24A)
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts) (audit-chain / receipt invariants, unchanged by Phase 24A)
