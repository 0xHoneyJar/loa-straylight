# ADR-024E — Dixie host MVP wire-shape lock (decision-lock for Phase 24B)

## Status

Accepted-for-Phase-24B.

This ADR is a Phase 24B docs-only decision-lock. It sits on top of
the Phase 24A ADR series (ADR-024A
([`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)),
ADR-024B
([`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md)),
ADR-024C
([`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)),
ADR-024D
([`./ADR-024D-phase-24b-implementation-branch.md`](./ADR-024D-phase-24b-implementation-branch.md)))
and locks the **Straylight↔Dixie wire-shape** the recall-pack-
inspection MVP host targets, the **Dixie↔Finn boundary** for this
slice, the **package-release gate** that keeps Hounfour #116-derived
contracts out of the wedge public surface, and the **next
implementation branch** entry/non-go conditions.

This ADR does **not** open a `phase-24c-*` branch, does **not**
author any schema, does **not** flip a wedge import, does **not**
change `package.json` / `package-lock.json`, does **not** add a
`loa-dixie` / `loa-finn` / `loa-freeside` dependency, does **not**
wire a Dixie endpoint, does **not** edit any sibling repo, does
**not** file or edit any GitHub issue / comment / PR, and does
**not** touch `src/`, `tests/`, `fixtures/`, `scripts/`, `.loa/`,
`.claude/`, `.beads/`, `.run/`, or `.github/`. Phase 24B is
docs/spec-only per ADR-024D §3.d–e.

## Context

ADR-024B placed the next MVP host on **Dixie (recall-pack-
inspection-first)** under shape (b) of ADR-022B criterion #2 —
the host inspects a precomputed `RecallPack` + `RecallReceipt`
emitted by the wedge; the host does not run `executeRecall` ahead
of policy validation. ADR-024D narrowed the next implementation
branch (`phase-24b-*`) to **local additive scaffolding inside
`loa-straylight` only**, and explicitly allowed an additive
Phase 24B docs/spec packet (the present packet).

The Phase 12 Dixie packet
([`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md),
[`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md),
[`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md))
staged the four-lane model (class / primitive / runtime /
governed-recall-BFF) and enumerated the Dixie operator-facing
surfaces. The Phase 23A schema-contract draft
([`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md),
[`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md))
enumerated fourteen MVP objects and an eleven-vector conformance
matrix.

The Phase 24A ADR series adds three load-bearing constraints on
top of those packets:

1. **Hounfour #116 outputs are upstream substrate, not Straylight
   runtime substrate, until a release publishes them.** Per
   ADR-024C. The `0xhoneyjar:straylight:*` audit-event prefix
   family and the `recall-wedge` conformance category are
   *registered* upstream but **not adopted** into the Straylight
   public surface or test suite on the strength of #116 alone.
2. **Loa-Straylight remains the semantic / control-plane owner.**
   Per ADR-024A. The wedge owns every primitive the Dixie host
   inspects until that host's sibling-repo PR lands under teammate
   review.
3. **`phase-24b-*` is local additive scaffolding only.** Per
   ADR-024D §3 / §4. No sibling-repo wiring; no schema authoring;
   no `package.json` dependency on `loa-dixie`; no endpoint code.

This ADR pins the Phase 24B docs-side **wire-shape contract** the
recall-pack-inspection MVP host targets — the exact surfaces, the
exact wedge primitives each surface inspects, the exact
fail-closed semantics inherited from the wedge — so the eventual
implementation phase (`phase-24c-dixie-recall-host-scaffold`, per
§5 below) has a docs-locked target it can scaffold against without
re-litigating the host shape.

## Decision

1. **The Phase 24B MVP host plan is Dixie-first, recall-pack-
   inspection-first.** The host shape that the next implementation
   sub-phase targets is **shape (b) under ADR-022B criterion #2**:
   a precomputed `RecallPack` + `RecallReceipt` (emitted by the
   wedge) is inspected by Dixie. No `executeRecall` runs at the
   host. No Hounfour-side `RecallRequest` is materialized at the
   host. No Finn-side enforcement runs at the host.

2. **The minimal MVP slice is recall-pack inspection / provenance
   walk / receipt display — *not* generic retrieval.** The host
   does not become a key-value store over wedge state; it
   inspects, relays, and renders the wedge's existing recall
   output under the wedge's existing fail-closed discipline. The
   six in-slice host surfaces are (and only are):

   1. **Recall intake & response** — Dixie validates a
      `RecallRequest` (via the wedge's `validateRecallRequest`
      shape), hands it to the runtime gate, and renders the
      returned `RecallPack` + `RecallReceipt`. Dixie does **not**
      produce a `RecallPack`; Dixie does **not** produce a
      `RecallReceipt`.
   2. **Receipt retrieval & display** — Dixie exposes a lookup
      keyed by `receipt_id` and renders the persisted
      `RecallReceipt`. Dixie respects the requested `detail_level`
      (`minimal` / `standard` / `debug`) but does not invent
      detail-level redaction.
   3. **Excluded-assertion reason display** — Dixie renders the
      `excluded_summary[]` and (where present) `redacted[]` walks.
      Reasons are derived from the wedge's `dispositionFor` /
      `privacyDispositionForFrame`; Dixie does not invent reasons.
   4. **Provenance inspection** — Dixie exposes a per-assertion
      `Assertion.provenance[]` walk under the parent assertion's
      `privacy_scope`. `actor_private` provenance does **not**
      travel to `public_discord`.
   5. **Audit-chain lookup** — Dixie exposes a per-estate
      `AuditEvent[]` lookup plus a `verifyChain` result. On break,
      Dixie surfaces the break index and reason.
   6. **Estate summary** — Dixie exposes per-estate counts by
      class / status / privacy scope / risk level under the same
      privacy and risk discipline the wedge already applies.

   The per-surface MVP wire-shape — request and response — is
   docs-locked in
   [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md).
   The per-vector validation matrix the host must distinguish is
   docs-locked in
   [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md).

3. **The exact Straylight primitives in-slice are wedge-owned and
   already shipped.** The Phase 24B host plan depends on, and only
   on, the following wedge primitives — each owned by
   [`../../src/straylight/`](../../src/straylight/) and re-exported
   through [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   per the [package boundary](../mvp/package-boundary.md):

   - `Actor`, `Estate`, `ActorEstate` — actor and estate identity
     (consumed read-only).
   - `Assertion`, `AssertionStatus` — class-validated carrier and
     its status (consumed read-only); `provenance[]` walks live
     here.
   - `Keyring`, `SignatureEnvelope` — signer competence (consumed
     read-only).
   - `Policy`, `PolicyDecision` — wedge-only policy lane;
     `PolicyDecision` remains wedge-owned per ADR-022D / ADR-024A.
   - `Revocation` — consumed read-only.
   - `RecallRequest` — input shape; validated by the wedge before
     reaching the runtime gate.
   - `RecallPack` — recall output (the host inspects).
   - `RecallReceipt` — receipt output (the host inspects, keyed by
     `receipt_id`).
   - `AuditEvent` — wedge-private; lookup and `verifyChain` go
     through the wedge's stable public API surface, not through a
     Hounfour-side adjacent name.

   Explicitly **out-of-slice** primitives (each pinned to its
   ADR-022E gate):

   - `Challenge` — ADR-022E gate #4 unchanged; not re-exported by
     the wedge public surface; the host does not consume it.
   - `EstateTransition` — ADR-022E gate #1 unchanged; no
     transition envelope on the wire.
   - `safeCanonicalize` — ADR-022E gate #2 unchanged; the local
     canonicalizer ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
     feeds the pack before the host serves it; no Hounfour subpath
     import.
   - `Commitment` / `CommitmentRoot` publication — ADR-020E
     unchanged; no public anchor.
   - The `audit-trail-entry` / `domain-event` Hounfour-side
     adjacent names — ADR-022E gate #5 unchanged; no rename into
     `AuditEvent`.

4. **The Straylight↔Dixie boundary is "wedge produces, host
   inspects".** Restated for Phase 24B from the Phase 12
   four-lane model
   ([`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)):

   | Side | Owns | Examples |
   |---|---|---|
   | Straylight (wedge) | Primitive semantics; recall execution; receipt emission; audit-chain persistence; fail-closed defaults; deterministic content-addressing; local canonicalization; the stable public API. | `executeRecall`; `RecallPack` / `RecallReceipt` emission; `dispositionFor`; `verifyChain`; `computeCommitmentRoot`. |
   | Dixie (host) | Operator-facing intake, relay, render. Receipt retrieval keyed by `receipt_id`. `excluded_summary[]` / `redacted[]` walks. `Assertion.provenance[]` walks under `privacy_scope`. Per-estate audit-chain lookup. Per-estate summary counts. Cross-tenant boundary at intake. | The six surfaces in §2.1–2.6. |

   The host does **not** produce a `RecallPack`. The host does
   **not** produce a `RecallReceipt`. The host does **not**
   compute `dispositionFor`. The host does **not** publish a
   commitment root. The host does **not** invent privacy-scope
   semantics; it relays the wedge's.

5. **The Dixie↔Finn boundary keeps Finn out of this slice.**
   Finn is the **later runtime / enforcement collaborator**, not
   the Phase 24B host. Finn re-enters the picture only when
   recall output is fed into model / tool execution — a *later*
   slice that requires a separate host-placement ADR (most
   plausibly an ADR-024F or later that places a runtime-tool-call
   host on Finn under shape (a) of ADR-022B criterion #2). For
   Phase 24B:

   - Finn is **not** wired by `phase-24b-*` (per ADR-024D §4).
   - Finn is **not** wired by the eventual
     `phase-24c-dixie-recall-host-scaffold` branch (per §5 below).
   - Finn does **not** appear in the Phase 24B MVP host contract
     spec request/response shapes.
   - The Finn-side packet
     ([`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md),
     [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md),
     [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md))
     remains the in-repo contract for the later runtime slice; it
     is **not** refreshed by Phase 24B and is **not** advanced by
     Phase 24B.

6. **Freeside remains the later app / community surface
   consumer.** Per ADR-024B and the no-go sequence
   ([`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)).
   Freeside consumes governed recall **after** Dixie / Finn
   settle. Freeside is **not** in this slice. Freeside-side
   handoff packets
   ([`../handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md))
   are not refreshed by Phase 24B.

7. **Hounfour remains schema / protocol / conformance substrate
   only.** Per ADR-020C / ADR-022A / ADR-022C / ADR-024A. The
   Phase 24B host plan does **not** make Hounfour a host
   candidate. The plan does **not** import from a Hounfour
   working-tree path, does **not** adopt the
   `0xhoneyjar:straylight:*` prefix family into the Straylight
   public surface, and does **not** adopt the `recall-wedge`
   conformance category into the Straylight test suite — none of
   that is unblocked by #116's upstream registration.

8. **The package-release gate for Hounfour #116-derived contracts
   is the ADR-024C three-event rule, restated in-context.** Phase
   24B-or-later host consumption of any #116-derived output
   requires:

   - **Event A** — Hounfour publishes a GitHub Packages release
     whose `dist/` includes the #116 outputs (registered
     `0xhoneyjar:straylight:*` prefix family, registered
     `recall-wedge` category, five-step conformance corpus, vector
     tests).
   - **Event B** — a Straylight ADR explicitly adopts the new
     release range (e.g. an ADR-024C-supersede or an ADR that
     bumps `^8.6.0` to `^8.6.x` / `^8.7.0` and cites the release
     tag, the published `$id`s, and the boundary preservation
     tests it preserves).
   - **Event C** — a Phase-24+ shadow-integration check (in the
     Phase 17B / 21A style) inspects the actually-shipped surface
     and records findings before any wedge import flip.

   Each event is necessary; none is sufficient. Phase 24B does
   **not** trigger any of the three. The Hounfour dependency stays
   `@0xhoneyjar/loa-hounfour@^8.6.0`, resolved patch `8.6.0`. The
   `package.json` and `package-lock.json` are unchanged by
   Phase 24B.

## The next implementation branch

1. **The next implementation branch after Phase 24B is named
   `phase-24c-dixie-recall-host-scaffold`.** The descriptor is
   chosen so a reviewer can verify at branch-name level that the
   work is (a) Dixie-first, (b) recall-host-shaped, (c) scaffold-
   scoped. A `phase-24b-*` author / reviewer **may** choose a
   narrower or broader descriptor under teammate review, provided
   the scope below is preserved. This ADR locks the descriptor as
   the default; a stronger descriptor must be justified in the
   `phase-24c-*` opening doc.

2. **`phase-24c-dixie-recall-host-scaffold`'s allowable scope** —
   the union of ADR-024D §3 (local additive scaffolding inside
   `loa-straylight` only) and the Phase 24B docs-locked wire-
   shape:

   - Local TypeScript additions to
     [`../../src/straylight/`](../../src/straylight/) that
     express the **six MVP host surfaces** in §2.1–2.6 against
     the wedge primitives in §3, preserving the Phase 5 "MVP host
     contract" invariants
     ([`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts))
     and the six-receipt-category pin
     ([`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)).
   - Additive tests under
     [`../../tests/`](../../tests/) that exercise the Phase 24B
     validation-vector matrix (Phase 23A vectors 1–8 reframed at
     the host inspection layer), against locally-owned shapes,
     under the wedge runtime. Vectors 10 and 11 remain gates,
     **not** exercised.
   - Additive fixtures under
     [`../../fixtures/`](../../fixtures/) that back the additive
     tests. No rename or move of existing fixtures.
   - Additive docs (a Phase 24C summary handoff; an optional
     ADR-024F if a new decision-lock is required).

3. **`phase-24c-dixie-recall-host-scaffold`'s hard non-scope** —
   inherits ADR-024D §4 in full and adds these Phase 24B-specific
   refusals:

   - No production of a `RecallPack` outside the wedge runtime.
   - No production of a `RecallReceipt` outside the wedge runtime.
   - No host-side `dispositionFor` re-implementation.
   - No host-side `privacy_scope` reinterpretation.
   - No `executeRecall` ahead of policy validation.
   - No adoption of the `0xhoneyjar:straylight:*` prefix family
     into the Straylight public surface.
   - No adoption of the `recall-wedge` conformance category into
     the Straylight test suite.
   - No import of the Hounfour five-step conformance corpus.
   - No `package.json` change. No `loa-dixie` / `loa-finn` /
     `loa-freeside` dependency. No Hounfour range bump.
   - No `Challenge` / `EstateTransition` / `safeCanonicalize` /
     `AuditEvent`-rename adoption.
   - No public commitment-root publication.
   - No sibling-repo edits. No `loa-dixie` PR opened. No
     `loa-finn` PR opened. No `loa-freeside` PR opened.

4. **`phase-24c-dixie-recall-host-scaffold` entry conditions** —
   before the branch may open:

   - ADR-024A / ADR-024B / ADR-024C / ADR-024D / ADR-024E have
     all merged to `main` under teammate review.
   - The Phase 24B docs/spec packet has merged
     ([`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md),
     the two new specs
     ([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
     [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)),
     and the three refreshed Dixie handoffs).
   - No Hounfour-side release event has invalidated ADR-024C's
     `^8.6.0` pin in a way that would require rebase. If a
     release publishes the #116 outputs while
     `phase-24c-dixie-recall-host-scaffold` is in flight, a
     separate ADR-024C-supersede event handles the range bump;
     the scaffold branch does not bump.
   - The Phase 19A pending feedback gate on issue #70 either
     remains pending (and `phase-24c-*` proceeds under the
     "local additive scaffolding only" rule), **or** a substantive
     answer arrives and is intaken in a separate doc / ADR
     **before** `phase-24c-*` opens.

5. **`phase-24c-dixie-recall-host-scaffold` non-go conditions** —
   the branch must **not** open or, if open, must halt, if:

   - Any of ADR-024A / ADR-024B / ADR-024C / ADR-024D / ADR-024E
     have been reopened, reverted, or withdrawn by teammate
     review.
   - The proposed work would touch any of the hard non-scope items
     in §3 of this section.
   - The proposed work would file or edit any GitHub issue /
     comment / PR against a sibling repo.
   - The proposed work would adopt a Hounfour symbol into the
     Straylight public surface without a separate adoption ADR.
   - The proposed work would consume Hounfour `main` or any
     unpublished commit.

## Consequences

- Reviewers of any future `phase-24c-*` PR may cite this ADR to
  refuse scope creep. Specifically: any diff that violates §3
  (hard non-scope) of "The next implementation branch" should be
  requested-changes on cite.
- ADR-024B's host placement is binding for the recall-pack-
  inspection slice. A later runtime-tool-call slice may select a
  different host (most plausibly Finn) under a separate ADR
  (ADR-024F or later). ADR-024E does not pre-authorize a Finn
  host placement.
- Reviewers should reject any Phase 24+ PR that:
  - Promotes Finn from later-runtime-collaborator to MVP host
    on the strength of Phase 24B's docs/spec packet alone.
  - Adds an HTTP / NATS / Discord / Telegram surface in
    `loa-straylight`.
  - Adds `loa-dixie` / `loa-finn` / `loa-freeside` as a
    `package.json` dependency.
  - Cites Hounfour #116 to flip a wedge import.
  - Cites the Phase 24B docs/spec packet to skip Event A / B / C
    for #116-derived adoption.
- ADR-024E supersedes nothing. It is additive to ADR-024B and
  ADR-024D and rests on ADR-024A and ADR-024C; reopening any of
  those four reopens this one.

## Non-scope (Phase 24B)

- This ADR does **not** open `phase-24c-dixie-recall-host-scaffold`.
- This ADR does **not** author any TypeBox / JSON Schema. No
  `$id` declared. No validator generated.
- This ADR does **not** flip a wedge import. The wedge's stable
  public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged.
- This ADR does **not** authorize a `package.json` dependency
  range change. Hounfour stays `^8.6.0`, resolved patch `8.6.0`.
- This ADR does **not** wire a Dixie endpoint in `loa-straylight`.
  No HTTP / REST / NATS / Discord / Telegram surface added.
- This ADR does **not** wire a Finn endpoint.
- This ADR does **not** wire a Freeside endpoint.
- This ADR does **not** edit any sibling repo.
- This ADR does **not** file or edit any GitHub issue / comment /
  PR.
- This ADR does **not** advance ADR-022E gate #1
  (`EstateTransition`), gate #2 (`safeCanonicalize`), gate #4
  (`Challenge`), or gate #5 (`AuditEvent`).
- This ADR does **not** advance ADR-020E (public commitment
  root).
- This ADR does **not** adopt the `0xhoneyjar:straylight:*`
  audit-event prefix family into the Straylight public surface.
- This ADR does **not** adopt the `recall-wedge` conformance
  category into the Straylight test suite.
- This ADR does **not** import the Hounfour five-step conformance
  corpus from a Hounfour-side working-tree path.
- This ADR does **not** consume Hounfour `main` or any
  unpublished commit.
- No `src/` / `tests/` / `scripts/` / `fixtures/` changes.
- No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` /
  `.gitignore` / `.gitmodules` / `.npmrc` edits.
- No commit, no push, no PR.

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
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)
- [`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md)
- [`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)
- [`./ADR-024D-phase-24b-implementation-branch.md`](./ADR-024D-phase-24b-implementation-branch.md)
- [`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §1.4, §6.2.4, §22.5
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
- [`../mvp/threat-model.md`](../mvp/threat-model.md)
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
- [`../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md`](../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (public surface, unchanged by Phase 24B)
- [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts) (recall pipeline, unchanged by Phase 24B)
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts) (local canonicalizer, unchanged by Phase 24B)
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts) (audit-chain / receipt invariants, unchanged by Phase 24B)
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts) (six-receipt-category pin, unchanged by Phase 24B)
