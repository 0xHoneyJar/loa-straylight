# Phase 24B — Dixie recall-host plan packet (local only)

> Status: Phase 24B. **Docs/spec-only host-plan packet, in
> `loa-straylight`.** This document records the Phase 24B
> deliverable — the Dixie-first Straylight Recall Wedge MVP host
> plan, the per-surface MVP contract, the per-vector validation
> matrix, the Straylight↔Dixie boundary, the Dixie↔Finn
> boundary, the package-release gate for Hounfour #116-derived
> contracts, the validation/demo plan, and the next
> implementation branch — and pins the Phase 24B discipline
> before any Phase 24C implementation branch opens. Phase 24B is
> **not endpoint-wired**, **not runtime-wired**, **not the full
> Recall Wedge**, **not governed recall in Finn / Dixie /
> Freeside runtime**, **not Hounfour-side schema work**, and
> **not Hounfour-package consumption beyond the existing
> `^8.6.0` published range**. **No endpoint / runtime
> integration is authorized by this packet, no schema is
> authored, no test is added, no fixture is added, and no
> Hounfour dependency-range bump is performed.** Phase 24B is
> **Phase 24B only** — it does not advance any Phase 20A / 20B /
> 20C / 20D / 20E / 21A / 21B / 22A / 23A / 24A deferral.
>
> Phase 24B does **not** flip any wedge import, change
> `package.json` / `package-lock.json`, change the Hounfour
> dependency range or resolved patch, consume Hounfour `main` or
> any unpublished commit, modify
> [`../../src/straylight/`](../../src/straylight/), modify
> [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify
> [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> modify any script under [`../../scripts/`](../../scripts/),
> wire Finn / Dixie / Freeside runtime, add a Dixie endpoint,
> add a Finn endpoint, edit any sibling repo, implement
> `Challenge` locally, implement `EstateTransition` locally,
> reach into unexported Hounfour internals, add a
> `safeCanonicalize` subpath import, publish a public commitment
> root, add a network surface, change persistence, add or modify
> any test, add or modify any fixture, author any TypeBox / JSON
> Schema, **file** any GitHub issue or comment, or touch
> `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`. It
> does **not** commit and does **not** open a PR. The actual
> Phase 24B PR is a separate, future event under teammate
> review.
>
> Companion docs (the Phase 24B ADR this handoff sits on top of,
> the two new specs Phase 24B produces, the three refreshed
> Dixie handoffs, and the Phase 24A / 23A / 22A / 21B / 20A
> series Phase 24B inherits):
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md),
> [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
> [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md),
> [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
> [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
> [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md),
> [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md),
> [`./hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md),
> [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md),
> [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md),
> [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md),
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md),
> [`./phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md),
> [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md),
> [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md),
> [`./phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md),
> [`./phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md),
> [`./hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md),
> [`./phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`./phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
> [`./phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
> [`./phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
> [`./phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md),
> [`./phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md),
> [`../decisions/0001-repo-purpose.md`](../decisions/0001-repo-purpose.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md),
> [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md),
> [`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md),
> [`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md),
> [`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md),
> [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md).

## Executive summary

Phase 24A intaked Hounfour PR #116 as upstream substrate, placed
the next MVP host on **Dixie (recall-pack-inspection-first)** per
ADR-024B, pinned the package-release ambiguity discipline per
ADR-024C, and scoped the next implementation branch
(`phase-24b-*`) to **local additive scaffolding inside
`loa-straylight` only** per ADR-024D §3 / §4. Phase 24A did not
author any schema, did not wire any endpoint, did not edit any
sibling repo, and did not open `phase-24b-*`. The Phase 19A
pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending; ADR-024D explicitly allows `phase-24b-*` to
proceed without it under the "local additive scaffolding only"
rule.

Phase 24B is the **Dixie recall-host docs/spec packet**. It
produces the docs-side target that a future
`phase-24c-dixie-recall-host-scaffold` branch (per ADR-024E §"The
next implementation branch") will scaffold against. The
Phase 24B deliverables are:

- **A new ADR** —
  [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — locking the Straylight↔Dixie wire-shape (shape (b) of
  ADR-022B criterion #2: precomputed `RecallPack` +
  `RecallReceipt` inspected by Dixie; no `executeRecall` at the
  host), the Straylight↔Dixie boundary (wedge produces, host
  inspects), the Dixie↔Finn boundary (Finn out of this slice),
  the Hounfour-#116 package-release gate (re-anchored to
  ADR-024C: Event A + Event B + Event C, each necessary, none
  sufficient), and the next implementation branch
  (`phase-24c-dixie-recall-host-scaffold`) entry and non-go
  conditions.
- **Two new specs** under [`../specs/`](../specs/):
  - [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
    — per-Dixie-surface MVP host contract for six in-slice
    surfaces (recall intake & response; receipt retrieval &
    display; excluded-assertion reason display; provenance
    inspection; audit-chain lookup; estate summary). Each
    surface names the wedge primitive(s) it inspects, the
    TypeScript-style request and response shape, the fail-closed
    posture inherited from the wedge, and the Phase 24A
    non-scope it preserves. The exact Straylight primitives in
    scope are appended.
  - [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
    — per-vector validation matrix for the host inspection
    layer, reframing Phase 23A vectors 1–8 (vector 9 —
    `keyring_validation`-lane signer competence — is **not in
    slice** per ADR-024D §3.b and is listed in the matrix for
    cross-reference only; vectors 10 and 11
    explicitly remain gates, not exercised). A demo plan
    subsection commits to no new tests / no new fixtures /
    demo evidence produced in a later phase.
- **Three additive refreshes** to the Phase 12 Dixie handoffs —
  append-only Phase 24B sections in
  [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
  [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
  and [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md).
  No edits to the existing Phase 12 prose.
- **This summary handoff** and an updated
  [`./README.md`](./README.md) index entry. **No new fixture, no
  new test, no Hounfour-side schema work, no GitHub-side
  action.**

The Dixie host plan is **Dixie-first** (per ADR-024B), the
minimum slice is **recall-pack inspection / provenance / receipt
display** (not generic retrieval), Straylight remains the
semantic / control-plane owner (per ADR-024A / ADR-022A /
ADR-020A / ADR 0001), Finn stays out of this slice (later
runtime / enforcement collaborator), Freeside stays out of this
slice (later app / community surface consumer), and Hounfour
stays schema / protocol / conformance substrate only (per
ADR-020C / ADR-022C / ADR-024A). Hounfour-#116-derived package
consumption remains gated on a published GitHub Packages release
(ADR-024C, Event A + B + C).

## v8.6 + #116 + Phase 24A inherited state (recap)

Restated narrowly so a reviewer can rely on this list without
re-reading the four-phase Phase 20 lane, the Phase 16 / 17B /
18 / 19A / 21A / 21B / 22A / 23A / 24A intake, the four
Phase 24A ADRs, and the Phase 24A intake doc:

- `@0xhoneyjar/loa-hounfour@^8.6.0` is consumed successfully
  (Phase 21A; commit `4f31b14`). Resolved to `8.6.0`. The
  currently-published `8.6.0` release does **not** include the
  #116 outputs. Phase 24B preserves this unchanged.
- Schema `$id`s under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`.
- `Challenge` shipped at v8.6.0; adoption gated by ADR-022E
  gate #4. Phase 24B does not adopt.
- `EstateTransition` schema absent in v8.6.x; #116 did not ship
  it. ADR-022E gate #1 unchanged. Phase 24B does not advance.
- `safeCanonicalize` exported subpath remains deferred under
  gate `no-confirmed-subpath`; #116 did not declare a subpath.
  ADR-022E gate #2 unchanged.
- `AuditEvent` not exported under that canonical name in
  v8.6.x; adjacent `audit-trail-entry.schema.json` /
  `domain-event.schema.json` exist. ADR-022E gate #5 unchanged.
- `policy-decision-denied` candidate remains `DEFERRED`;
  `PolicyDecision` remains wedge-only per ADR-024A / ADR-022A /
  ADR-022D.
- The wedge's stable public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged. Private alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is unchanged.
- Hounfour #116 merged to `main`: `0xhoneyjar:straylight:*`
  audit-event prefix family registered upstream; `recall-wedge`
  conformance category registered upstream; five-step recall-
  wedge conformance corpus + vector tests exist upstream;
  Hounfour `schema/dist/release-integrity` regenerated on
  `main`. **No GitHub Packages release publishes these outputs
  yet** — ADR-024C, Event A pending.
- MVP host placement: **Dixie-first (recall-pack-inspection)**
  per ADR-024B.
- `phase-24b-*` scope: **local additive scaffolding inside
  `loa-straylight` only** per ADR-024D.

Phase 24B deltas from the Phase 24A inherited state:

- **Wire-shape lock for the Dixie host.** ADR-024E pins the
  shape (b) recall-pack-inspection MVP host contract; the
  Straylight↔Dixie boundary (wedge produces, host inspects);
  the Dixie↔Finn boundary (Finn out of this slice); the
  next-branch entry/non-go conditions
  (`phase-24c-dixie-recall-host-scaffold`).
- **Per-surface MVP host contract spec.** Six in-slice surfaces
  with TypeScript-style request/response shapes and fail-closed
  posture per surface.
- **Per-vector validation matrix.** Phase 23A vectors 1–8
  reframed at the host inspection layer; vector 9
  (`keyring_validation`-lane signer competence) is **not in
  slice** per ADR-024D §3.b and listed for cross-reference only;
  vectors 10 and 11 remain gates, not exercised.
- **Three additive Phase 24B sections** appended to the Phase 12
  Dixie handoffs. Existing Phase 12 prose unchanged.

## The eight required definitional points

This packet defines each point exactly once, in the owner doc
named below. The handoff cross-references each owner doc.

| # | Required point | Primary owner (this packet) | Secondary owner |
|---|---|---|---|
| 1 | Dixie-first governed recall host plan | this handoff (Executive summary; §"The Dixie host plan" below) | [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md) §"Decision" 1–2 |
| 2 | Minimal MVP slice | [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"What this spec is" + §"Surface 1–6" | this handoff §"The Dixie host plan" |
| 3 | Exact Straylight primitives involved | [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Appendix A" | [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md) §"Decision" 3 |
| 4 | Straylight ↔ Dixie boundary | [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md) (Phase 24B refresh) | [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md) §"Decision" 4 |
| 5 | Dixie ↔ Finn boundary | [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md) §"Decision" 5 | [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md) (Phase 24B refresh) |
| 6 | Package-release gate for #116-derived contracts | [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md) §"Decision" 8 (re-anchored to ADR-024C) | this handoff §"Package-release gate" |
| 7 | Validation / demo plan | [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md) §"Vector matrix" + §"Demo plan" | this handoff §"Validation / demo plan" |
| 8 | Next implementation branch after Phase 24B | [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md) §"The next implementation branch" | this handoff §"Next implementation branch" |

## The Dixie host plan

Per ADR-024B (Dixie-first placement) and ADR-024E §"Decision" 1,
the Phase 24B MVP host plan is:

- **Host**: Dixie (`loa-dixie`, governed recall / BFF /
  provenance lane).
- **Shape**: shape (b) of ADR-022B criterion #2 — a precomputed
  `RecallPack` + `RecallReceipt` (emitted by the wedge) is
  inspected by Dixie.
- **Minimum slice**: recall-pack inspection / provenance walk /
  receipt display, **not** generic retrieval.
- **Six in-slice host surfaces**: recall intake & response;
  receipt retrieval & display; excluded-assertion reason
  display; provenance inspection; audit-chain lookup; estate
  summary. Surfaces 1–6 of
  [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md).
- **Out-of-slice**: assertion-status per-assertion inspection
  (covered at summary granularity by Surface 6); governance-
  record awareness; environment-frame routing; high-risk review-
  queue management surface; cross-tenant prevention (cross-
  cutting, not a standalone surface).
- **Wedge primitives in-slice** (all wedge-owned and already
  shipped under
  [`../../src/straylight/`](../../src/straylight/)): `Actor`,
  `Estate`, `ActorEstate`, `Assertion`, `AssertionStatus`,
  `Keyring`, `SignatureEnvelope`, `Policy`, `PolicyDecision`,
  `Revocation`, `RecallRequest`, `RecallPack`, `RecallReceipt`,
  `AuditEvent` (wedge-private), `dispositionFor`,
  `privacyDispositionForFrame`, `verifyChain`, `StorageAdapter`.
  See [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  §"Appendix A".
- **Out-of-slice primitives**: `Challenge` (ADR-022E gate #4),
  `EstateTransition` (gate #1), `safeCanonicalize` (gate #2),
  `AuditEvent` rename (gate #5), `Commitment` /
  `CommitmentRoot` publication (ADR-020E),
  `0xhoneyjar:straylight:*` prefix family adoption (ADR-024A /
  ADR-024C), `recall-wedge` conformance category adoption
  (ADR-024A / ADR-024C), Hounfour five-step corpus import
  (ADR-024A / ADR-024C). See
  [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  §"Appendix B".

## Straylight ↔ Dixie boundary

Restated narrowly (the long form lives in ADR-024E §"Decision" 4
and in the Phase 24B refresh of
[`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)):

| Side | Owns | Examples |
|---|---|---|
| Straylight (wedge) | Primitive semantics; recall execution; receipt emission; audit-chain persistence; fail-closed defaults; deterministic content-addressing; local canonicalization; the stable public API surface. | `executeRecall`; `RecallPack` / `RecallReceipt` emission; `dispositionFor`; `verifyChain`; `computeCommitmentRoot`. |
| Dixie (host) | Operator-facing intake, relay, render. Receipt retrieval keyed by `receipt_id`. `excluded_summary[]` / `redacted[]` walks. `Assertion.provenance[]` walks under `privacy_scope`. Per-estate audit-chain lookup. Per-estate summary counts. Cross-tenant boundary at intake. | The six surfaces. |

**The host does not produce a `RecallPack`. The host does not
produce a `RecallReceipt`. The host does not compute
`dispositionFor`. The host does not publish a commitment root.
The host does not invent privacy-scope semantics.** Per ADR-024E.

## Dixie ↔ Finn boundary

Per ADR-024E §"Decision" 5: **Finn is out of this slice.** Finn
re-enters only when recall output is fed into model / tool
execution — a *later* slice requiring a separate host-placement
ADR (most plausibly an ADR-024F or later that places a runtime-
tool-call host on Finn under shape (a) of ADR-022B criterion #2).

For Phase 24B and for `phase-24c-dixie-recall-host-scaffold`:

- Finn is **not** wired by `phase-24b-*` (per ADR-024D §4) and
  **not** wired by `phase-24c-*` (per ADR-024E).
- Finn does **not** appear in the Phase 24B MVP host contract
  request / response shapes.
- The Finn-side packet
  ([`./finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md),
  [`./finn-runtime-boundary.md`](./finn-runtime-boundary.md),
  [`./finn-enforcement-mapping.md`](./finn-enforcement-mapping.md))
  remains the in-repo contract for the later runtime slice; it
  is **not** refreshed by Phase 24B.

## Freeside boundary

Per ADR-024B and ADR-024E §"Decision" 6: **Freeside is out of
this slice.** Freeside consumes governed recall **after** Dixie /
Finn settle. The Freeside packet
([`./freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md),
[`./freeside-community-surface-issue.md`](./freeside-community-surface-issue.md),
[`./freeside-surface-mapping.md`](./freeside-surface-mapping.md))
remains the in-repo contract for the later consumer slice; it is
**not** refreshed by Phase 24B.

## Hounfour boundary (substrate only)

Per ADR-020C / ADR-022A / ADR-022C / ADR-024A and re-anchored by
ADR-024E §"Decision" 7: **Hounfour remains schema / protocol /
conformance substrate only.** Phase 24B does **not** make
Hounfour a host candidate. Phase 24B does **not** adopt the
`0xhoneyjar:straylight:*` audit-event prefix family into the
Straylight public surface, does **not** adopt the `recall-wedge`
conformance category into the Straylight test suite, and does
**not** import the Hounfour five-step conformance corpus from a
working-tree path.

## Package-release gate

Hounfour-#116-derived package consumption remains gated on a
published GitHub Packages release. Per ADR-024C and ADR-024E
§"Decision" 8, three events are each necessary; none is
sufficient:

- **Event A — Hounfour publishes a GitHub Packages release**
  whose `dist/` includes the #116 outputs (registered
  `0xhoneyjar:straylight:*` prefix family, registered
  `recall-wedge` category, five-step conformance corpus, vector
  tests).
- **Event B — a Straylight ADR explicitly adopts the new release
  range** (e.g. an ADR-024C-supersede or an ADR that bumps
  `^8.6.0` to `^8.6.x` / `^8.7.0`, citing the release tag, the
  published `$id`s, and the boundary preservation tests it
  preserves).
- **Event C — a Phase-24+ shadow-integration check** (in the
  Phase 17B / 21A style) inspects the actually-shipped surface
  and records findings before any wedge import flip.

Phase 24B does **not** trigger any of the three. The Hounfour
dependency stays `@0xhoneyjar/loa-hounfour@^8.6.0`, resolved
patch `8.6.0`. The `package.json` and `package-lock.json` are
unchanged by Phase 24B.

## Validation / demo plan

Per [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md):

- The Phase 24B host-inspection-layer matrix reframes Phase 23A
  vectors 1–8 at the host layer. Vector 9 (`keyring_validation`-
  lane signer competence) is **not in slice** per ADR-024D §3.b
  and is listed in the matrix for cross-reference only.
  Vectors 10 and 11 remain gates, **not** exercised by Phase 24B
  or by `phase-24c-dixie-recall-host-scaffold`.
- The demo plan **commits to**:
  - No new tests in Phase 24B.
  - No new fixtures in Phase 24B.
  - The demo evidence packet for the host is produced **in a
    later phase** — by `phase-24c-dixie-recall-host-scaffold`
    (additive demo evidence under ADR-024D §3.a–c) or by a
    successor demo-evidence phase. Phase 24B locks the *plan*
    for that packet; it does not produce the packet.
- Validation commands for Phase 24B itself (this docs/spec
  packet):

```bash
npm run typecheck
npm test
```

`npm run typecheck` and `npm test` are expected to remain clean
on a `phase-24b-dixie-recall-host-plan` branch: Phase 24B adds
no new test, modifies no source file, modifies no script,
fixture, or package file, so the Phase 4 demo, Phase 5
hardening, Phase 17B / 18 / 21A shadow-integration pin,
Phase 19A review-packet pin, Phase 20B local-scaffold pin,
Phase 20C demo-shape pin, dixie-governed-recall handoff test,
storage-conformance test, and existing handoff-doc validation
tests are unaffected.

## Next implementation branch

Per ADR-024E §"The next implementation branch":

- **Name**: `phase-24c-dixie-recall-host-scaffold`. The
  descriptor is chosen so a reviewer can verify at branch-name
  level that the work is (a) Dixie-first, (b) recall-host-
  shaped, (c) scaffold-scoped. A `phase-24b-*` author /
  reviewer **may** choose a narrower or broader descriptor under
  teammate review, provided the scope is preserved. ADR-024E
  locks the descriptor as the default; a stronger descriptor
  must be justified in the `phase-24c-*` opening doc.
- **Allowable scope**: union of ADR-024D §3 (local additive
  scaffolding inside `loa-straylight` only) and the Phase 24B
  docs-locked wire-shape — additive TypeScript host surfaces,
  additive tests against Phase 24B vectors 1–8, additive
  fixtures backing the additive tests, additive docs. See
  ADR-024E §"The next implementation branch" §2.
- **Hard non-scope**: inherits ADR-024D §4 in full and adds the
  Phase 24B-specific refusals in ADR-024E §"The next
  implementation branch" §3 (no `RecallPack` / `RecallReceipt`
  production outside the wedge runtime; no host-side
  `dispositionFor`; no `executeRecall` ahead of policy; no
  Hounfour #116 adoption; no sibling-repo wiring; no
  `package.json` change).
- **Entry conditions**: ADR-024A / ADR-024B / ADR-024C /
  ADR-024D / ADR-024E and the Phase 24B docs/spec packet (this
  handoff + the two specs + the three refreshed handoffs +
  README) merged to `main` under teammate review. No Hounfour-
  side release event has invalidated the `^8.6.0` pin in a way
  that would require rebase. The Phase 19A pending feedback
  gate either remains pending (and `phase-24c-*` proceeds under
  ADR-024D's local-additive-scaffolding-only rule) or a
  substantive answer arrives and is intaken in a separate doc /
  ADR before `phase-24c-*` opens.
- **Non-go conditions**: any of ADR-024A–E reopened / reverted /
  withdrawn; proposed work touches ADR-024E's hard non-scope;
  proposed work files or edits a sibling-repo issue / comment /
  PR; proposed work adopts a Hounfour symbol without a separate
  adoption ADR; proposed work consumes Hounfour `main` or an
  unpublished commit. See ADR-024E §"The next implementation
  branch" §5.

## Blockers vs non-blockers (re-pinned from Phase 24A)

### Runtime-integration blockers (Phase 24C work that touches these is gated)

| # | Blocker | Why blocking | Trigger to unblock |
|---|---|---|---|
| 1 | `EstateTransition` schema absence (Hounfour delta #8) | A `phase-24c-*` branch that puts an `EstateTransition` on a cross-repo wire would silently invent a Hounfour shape that does not exist. | Hounfour ships `estate-transition.schema.json` under a v8.6.x or higher line **and** a separate ADR adopts it. ADR-022E gate #1. |
| 2 | `safeCanonicalize` exported subpath absence (gate `no-confirmed-subpath`) | A `phase-24c-*` branch that imports a Hounfour `safeCanonicalize` would either reach into unexported internals or import from package root (forbidden). | Hounfour declares `./canonicalize` (or `./utilities`) in the `exports` map **and** a separate ADR adopts it. ADR-022E gate #2. |
| 3 | Phase 19A pending feedback on issue #70 not yet received | The MVP integration boundary cannot be reaffirmed without upstream feedback on the v8.6.0 substrate. #116 is substrate, not an answer. | Jani / teammate response on issue #70 is received **or** a teammate review explicitly approves proceeding without it. ADR-024D scopes `phase-24c-*` such that this gate does not block local additive scaffolding. |
| 4 | Hounfour package-release ambiguity (ADR-024C) | A `phase-24c-*` branch that consumes Hounfour `main` or pins to a commit SHA would bypass the published-release contract. | Event A + Event B + Event C. ADR-024C / ADR-024E §"Decision" 8. |

### Non-blocking discovery notes (Phase 24C may proceed without unblocking these)

| # | Discovery note | Why non-blocking | Phase 24B handling |
|---|---|---|---|
| 1 | `0xhoneyjar:straylight:*` audit-event prefix family registered upstream by #116 | Registration is substrate; semantics are Straylight-owned per ADR-024A. | Recorded as **substrate event**. Not adopted. |
| 2 | `recall-wedge` conformance category registered upstream by #116 | Registration is substrate; lane structure and per-object / per-vector contract are Straylight-defined per ADR-024A and the Phase 23A spec docs. | Recorded as **substrate event**. Not adopted into the Straylight test suite. |
| 3 | Hounfour-side five-step recall-wedge conformance corpus | Upstream test substrate, not Straylight runtime substrate. Coordinate with the Phase 23A and Phase 24B Straylight-side matrices, not subordinate. | Not imported; not adopted. |
| 4 | `AuditEvent` not exported under that name; adjacent `audit-trail-entry.schema.json` / `domain-event.schema.json` exist | ADR-022D / ADR-024A / ADR-024E treat `AuditEvent` as wedge-owned. The audit lane is wedge-private. | Recorded as **discovery note** (unchanged from Phase 23A / 24A). |
| 5 | `policy-decision-denied` candidate is `DEFERRED` | `PolicyDecision` is wedge-only by design. Hounfour-side denial-shape candidate is informational. | Recorded; not exercised. |
| 6 | Cosmetic alias decisions (e.g. wedge `Actor` ↔ Hounfour `agent-identity`) | Renames are established v8.5.x; Phase 24B does not re-litigate. | Recorded; deferred to a future adoption ADR. |

## Phase 24C entry conditions (forward-looking; non-binding on Phase 24B)

ADR-024A / ADR-024B / ADR-024C / ADR-024D / ADR-024E together
specify the entry conditions any future `phase-24c-*`
implementation branch must satisfy. Restated for the reviewer:

- ADR-024A, ADR-024B, ADR-024C, ADR-024D, and ADR-024E have all
  merged to `main` under teammate review.
- ADR-024B's Dixie-first placement is preserved (no teammate
  review has withdrawn it).
- ADR-024C's `^8.6.0` range pin is preserved (no Hounfour-side
  release event has required a superseding ADR).
- The Phase 24B docs/spec packet has merged (this handoff + the
  two specs + the three refreshed handoffs + the README index
  entry).
- The proposed `phase-24c-*` work stays within ADR-024D §3
  (allowable scope) and ADR-024E §"The next implementation
  branch" §2 (Phase 24B-specific allowable scope) and away from
  ADR-024D §4 / ADR-024E §3 (hard non-scope).
- Phase 19A pending feedback for issue #70 received **or** a
  teammate review explicitly approves proceeding under the
  "local additive scaffolding only" rule.

## Phase 24C non-go conditions

A `phase-24c-*` implementation branch must **not** open if any
of the following holds:

- Any of ADR-024A–E have been reopened, reverted, or withdrawn
  by teammate review.
- The proposed work would consume Hounfour `main`, a commit
  SHA, or a git-source pin.
- The proposed work would bump the Hounfour dependency range or
  resolved patch without a separate ADR-024C-supersede event.
- The proposed work would touch any of the hard non-scope items
  in ADR-024D §4 or ADR-024E §"The next implementation branch"
  §3.
- The proposed work would file or edit any GitHub issue,
  comment, or PR against a sibling repo.
- The proposed work would adopt the `0xhoneyjar:straylight:*`
  audit-event prefix family or the `recall-wedge` conformance
  category into the Straylight public surface or test suite on
  the strength of #116 alone.
- The proposed work would import the Hounfour five-step
  conformance corpus from a Hounfour-side working-tree path.
- The proposed work would put `EstateTransition` on the wire
  while delta #8 remains queued.
- The proposed work would import `safeCanonicalize` while gate
  `no-confirmed-subpath` is in force.
- The proposed work would adopt `challenge.schema.json` into
  the wedge public surface without a separate ADR.
- The proposed work would rename `audit-trail-entry` or
  `domain-event` into `AuditEvent` without a separate ADR.
- The proposed work would select Freeside or Hounfour as the
  MVP endpoint host.
- The proposed work would promote Finn from later-runtime-
  collaborator to MVP host on the strength of #116 or of the
  Phase 24B packet alone.

## Explicit non-scope (Phase 24B)

Phase 24B is **docs/spec only**. It performs no implementation
work. The following are out-of-scope and remain in the same
state Phase 24A left them:

- **No `src/` changes.** The wedge's stable public API surface
  is unchanged. The private alias module is unchanged. No
  re-export is added or removed. No internal module is edited.
- **No tests.** No new test file. No edit to any existing test
  file.
- **No scripts.** No edit to any script under
  [`../../scripts/`](../../scripts/).
- **No fixtures.** No new fixture file. No edit to any existing
  fixture file under [`../../fixtures/`](../../fixtures/).
- **No package changes.** `package.json` and `package-lock.json`
  are unchanged from Phase 21A / 21B / 22A / 23A / 24A. The
  Hounfour dependency stays `^8.6.0`, resolved patch `8.6.0`.
- **No Hounfour `main` consumption.** No commit-SHA pin. No
  git-source dependency. No script that fetches Hounfour from
  anywhere other than the configured registry. No import of a
  Hounfour `dist/` path that only exists on `main`.
- **No schemas authored.** No TypeBox schema, no JSON Schema,
  no `$id` declared, no validator generated.
- **No new fixture, no new test.** The validation matrix and
  demo plan reference existing fixtures and existing tests only.
- **No adoption of the `0xhoneyjar:straylight:*` prefix family**
  into the Straylight public surface.
- **No adoption of the `recall-wedge` conformance category**
  into the Straylight test suite.
- **No import of the Hounfour five-step conformance corpus**
  from a Hounfour-side working-tree path.
- **No Dixie endpoint.** ADR-024B places the host; ADR-024D
  scopes the implementation branch; ADR-024E pins the wire
  shape. Phase 24B wires nothing.
- **No Finn endpoint.** Finn remains a later runtime
  collaborator.
- **No Freeside integration.** No bot / admin / community /
  Discord / Telegram / REST / NATS surface added.
- **No Hounfour schema work.** No new schema file authored. No
  Hounfour-side schema edit. No GitHub issue / comment / PR
  filed against any sibling repo by Phase 24B.
- **No `Challenge` adoption.** Gate #4 unchanged.
- **No `EstateTransition` implementation.** Gate #1 unchanged.
- **No `safeCanonicalize` work.** Gate #2 unchanged.
- **No `AuditEvent` rename.** Gate #5 unchanged.
- **No public anchors.** Per ADR-020E.
- **No persistence wiring.** Per ADR-020D / ADR-022D.
- **No new HTTP / NATS / REST / Discord / Telegram surface.**
- **No sibling repo edits.** Not `loa-hounfour`, not
  `loa-finn`, not `loa-dixie`, not `loa-freeside`.
- **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` /
  `.gitignore` / `.gitmodules` / `.npmrc` edits.**
- **No commit, no push, no PR.**

## What this packet does *not* claim

For symmetry with the Phase 22A / 23A / 24A non-claims lists,
Phase 24B explicitly does **not** claim:

- **Not** "Hounfour #116's merge has been adopted into the
  Straylight public surface." It has not.
- **Not** "Hounfour now owns the Straylight audit-event prefix
  family." The `0xhoneyjar:straylight:*` family is registered
  upstream; semantics are Straylight-owned per ADR-024A.
- **Not** "Hounfour now owns the `recall-wedge` conformance
  category." Registered upstream; Straylight-defined per
  ADR-024A.
- **Not** "the Phase 24B per-vector matrix replaces the
  Phase 23A or Phase 8 matrices." It does not; the three layers
  are coordinate, not subordinate.
- **Not** "the Phase 24B host plan authorizes a Dixie endpoint
  in `loa-straylight`." It does not.
- **Not** "Phase 24B opens `phase-24c-dixie-recall-host-scaffold`."
  It does not; that is a future, separate, human-reviewed
  event.
- **Not** "any Hounfour schema is adopted." Including
  `challenge.schema.json` (gate #4), any candidate for
  `AuditEvent` (gate #5), or `commitment-root.schema.json` (gate
  #7).
- **Not** "`EstateTransition` is unblocked." Gate #1 unchanged.
- **Not** "`safeCanonicalize` is unblocked." Gate #2 unchanged.
- **Not** "the Hounfour dependency range can be bumped." Per
  ADR-024C, no bump on the strength of `main`-only outputs.
- **Not** "Phase 24B has filed any sibling-repo issue,
  comment, or PR." It has not. The Phase 19A pending feedback
  gate on issue #70 remains pending.
- **Not** "Finn is now the MVP host." Finn remains a later
  runtime / enforcement collaborator.
- **Not** "Freeside is now wired." Freeside remains a later
  app / community consumer.
- **Not** "any new HTTP / NATS / REST / Discord / Telegram
  surface exists." None.
- **Not** "the Phase 19A pending feedback gate has been
  satisfied." It has not.

This is **the Dixie recall-host docs/spec packet**. The output
is **local documentation** — the new ADR (ADR-024E), the two new
specs (host MVP contract + validation vectors), this summary
handoff, the three additive Phase 24B sections appended to the
Phase 12 Dixie handoffs, and an updated handoffs README index —
that prepares `phase-24c-dixie-recall-host-scaffold` without
implementing it. The Recall Wedge is **not runtime-wired**,
**not endpoint-wired**, **not schema-authored**, and the host is
**not coded** by Phase 24B. This is **Phase 24B only**.

## Validation evidence

```bash
npm run typecheck
npm test
```

Expected to remain clean: Phase 24B adds no new test, modifies
no source file, modifies no script / fixture / package file, so
the existing Phase 4 demo test, Phase 5 hardening tests,
Phase 17B / 18 / 21A shadow-integration pin, Phase 19A
review-packet pin, Phase 20B local-scaffold pin, Phase 20C
demo-shape pin, dixie-governed-recall handoff test,
storage-conformance test, and existing handoff-doc validation
tests are unaffected.

## Cross-references

- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — the Phase 24B decision-lock this handoff sits on top of.
- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — Phase 24B per-Dixie-surface MVP host contract.
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — Phase 24B per-vector validation matrix at the host
  inspection layer.
- [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  — Phase 12 Dixie issue handoff (refreshed under Phase 24B,
  append-only).
- [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  — Phase 12 Dixie boundary doc (refreshed under Phase 24B,
  append-only).
- [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md)
  — Phase 12 Dixie mapping doc (refreshed under Phase 24B,
  append-only).
- [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary handoff (the packet Phase 24B builds on).
- [`./hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md)
  — Phase 24A per-component intake of Hounfour PR #116.
- [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
  — Phase 24A substrate-intake decision-lock.
- [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md)
  — Phase 24A host placement (Dixie-first).
- [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md)
  — Phase 24A package-release ambiguity discipline.
- [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — Phase 24A `phase-24b-*` allowable scope.
- [`./phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md)
  — Phase 23A MVP schema-contract draft.
- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md)
  — Phase 23A per-object MVP schema-contract draft.
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)
  — Phase 23A eleven-vector MVP conformance matrix.
- [`./phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md)
  — Phase 22A MVP decision-lock series.
- [`./hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md)
  — Hounfour status comment for issue #70 (drafted in
  Phase 22A; filed by the user before Phase 23A; pending answer
  remains pending).
- [`./phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md)
  — Phase 21B v8.6 schema-readiness lock.
- [`./phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md)
  — Phase 20D recall-wedge endpoint-boundary planning packet
  (the earlier shape Phase 24B host plan refines).
- [`./phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)
  — the wedge-runtime demo-evidence shape Phase 24B's host
  demo plan models against (host demo evidence to be produced
  in a later phase).
- [`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index (unchanged by Phase 24B).
- [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order.
- [`./cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`./README.md`](./README.md) — per-packet handoff index,
  updated in Phase 24B to link this doc, the new ADR, the two
  new specs, and the three refreshed Dixie handoffs.
- [`../decisions/0001-repo-purpose.md`](../decisions/0001-repo-purpose.md)
  — repo-purpose declaration.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  through
  [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — Phase 20A decision-lock series.
- [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md)
  through
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — Phase 22A decision-lock series.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  — the wedge's stable public API surface.
- [`../mvp/threat-model.md`](../mvp/threat-model.md)
  — fail-closed defenses the host inherits.
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — class-vs-policy invariant.
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge's stable public API surface (unchanged by Phase 24B).
- [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts)
  — local recall execution (unchanged by Phase 24B).
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  — local canonicalizer (unchanged by Phase 24B).
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  — private Hounfour alias module (unchanged by Phase 24B).
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
  — fail-closed receipt + audit-chain invariants the host
  inherits (unchanged by Phase 24B).
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — six-receipt-category pin (unchanged by Phase 24B).
- [`../../tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts)
  — storage-adapter contract (unchanged by Phase 24B).
- [`../../fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  — ten Phase 12 reference fixtures (unchanged by Phase 24B).
- `package.json` (unchanged by Phase 24B; Hounfour range stays
  `^8.6.0`).
- `package-lock.json` (unchanged by Phase 24B; Hounfour
  resolved patch stays `8.6.0`).
