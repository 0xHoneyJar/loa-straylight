# Phase 20E — Recall Wedge closeout packet (local only)

> Status: Phase 20E. **Closeout packet only, in `loa-straylight`.**
> This document closes the Phase 20 Recall Wedge **pre-integration**
> lane by summarizing what Phases 20A, 20B, 20C, and 20D established
> locally, what remains unimplemented, and what must be true before
> Phase 21 endpoint / runtime integration begins. Phase 20E is
> **closeout only** — it is **not endpoint-wired**, **not
> runtime-wired**, **not the full Recall Wedge**, **not governed
> recall in Finn / Dixie / Freeside runtime**, and **not Hounfour-side
> schema work**. Phase 20E is **Phase 20E only** — it does not
> advance any Phase 20A / Phase 20B / Phase 20C / Phase 20D deferral.
>
> Phase 20E does **not** flip any wedge import, change `package.json`
> / `package-lock.json`, change the Hounfour dependency range or
> resolved patch, modify
> [`../../src/straylight/`](../../src/straylight/), modify
> [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> modify [`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
> or [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts),
> wire Finn / Dixie / Freeside runtime, add a Dixie endpoint, add a
> Finn endpoint, edit any sibling repo, implement `Challenge` or
> `EstateTransition`, reach into unexported Hounfour internals, add a
> `safeCanonicalize` subpath import, publish a public commitment root,
> add a network surface, change persistence, add or modify any test,
> add or modify any fixture, or touch `.loa/` / `.claude/`. It does
> **not** commit and does **not** open a PR. The actual Phase 20E PR
> is a separate, future event under teammate review.
>
> Companion docs (the Phase 20A decision-locks and the Phase 20B /
> 20C / 20D evidence Phase 20E closes out):
> [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
> [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
> [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
> [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md).

## Executive summary

Phase 20E is **closeout only**. The Phase 20 local Recall Wedge
**pre-integration** prep is complete: ADR-020A through ADR-020E are
locked, the local `executeRecall` behavior is test-pinned, the local
demo / evidence output shape is test-pinned, and the future
endpoint-host integration boundary is documented. **No
endpoint / runtime integration is authorized by this packet.**

Phase 20E adds zero new behavior. It records, in one in-repo packet,
what the Phase 20A / 20B / 20C / 20D lane produced as **local
evidence**, what it deliberately did not produce, and what must be
true before Phase 21 may begin endpoint / runtime wiring. The
wedge's stable public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)) is
unchanged. The Hounfour dependency
(`@0xhoneyjar/loa-hounfour@^8.5.0`) is unchanged. The private alias
module
([`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
is unchanged.

The Phase 20 lane closes here. Phase 21 is gated on the entry
conditions in this packet; the non-go conditions in this packet
remain binding.

## Phase 20 recap

The Phase 20 lane was a **pre-integration** lane staged entirely
inside `loa-straylight`. It produced four merged in-repo packets
(plus their five companion ADRs), in this order:

| Phase | Branch | What it established |
|---|---|---|
| **20A** decision-lock | `phase-20a-recall-wedge-decision-lock` | Locked the five Phase 20 decisions: ADR-020A semantic owner (Loa-Straylight), ADR-020B endpoint-host recommendation (Dixie default, Finn fallback; neither wired), ADR-020C schema namespace strategy (`Challenge` / `EstateTransition` / `safeCanonicalize` subpath deferred; no reach into unexported Hounfour internals), ADR-020D persistence and receipts (local receipt semantics owned by Loa-Straylight; six receipt categories), ADR-020E commitment-root deferral (no public anchoring; no onchain integration). Wired no sibling repo and added no behavior. |
| **20B** local scaffold | `phase-20b-recall-wedge-local-scaffold` | Pinned **local `executeRecall` behavior** by adding one additive test file ([`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)) that exercises the existing `RecallRequest → RecallPack + RecallReceipt` pipeline against the six ADR-020D §4 receipt categories — *included*, *excluded*, *redacted*, *challenged*, *revoked*, *blocked-by-policy* — plus the load-bearing "structural validity is not authorization" invariant and a receipt-or-audit completeness pin. Modified no source file, fixture, script, or package file. |
| **20C** demo / evidence | `phase-20c-recall-wedge-demo-evidence` | Pinned the **local demo / evidence output shape** by adding one additive test file ([`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts)) that asserts the five top-level JSON keys (`recall_request`, `recall_pack`, `recall_receipt`, `audit_review`, `audit_chain_verification`) emitted by `npm run demo:recall:json` over the existing `runDemo()` / `toDemoJson()` library entrypoints, plus the `recall_pack` ↔ `recall_receipt` linkage on both the public and audit-review frames and the `audit_chain_verification.ok` invariant. Modified no source file, fixture, demo script, or package file. The demo's output path (`.run/recall-demo.json`) remains gitignored per existing repo convention. |
| **20D** endpoint-host boundary | `phase-20d-recall-wedge-endpoint-host-boundary` | Documented the **endpoint-host integration boundary** for a future Dixie-hosted recall-inspection candidate and a Finn-hosted runtime-context fallback candidate, using only the Straylight-local objects already proved by Phase 20B / 20C (`RecallRequest`, `RecallPack`, `RecallReceipt`, plus the `audit_review` and `audit_chain_verification` projections). Restated, per ADR-020B, that the boundary is a *candidate* — not a finalized cross-repo API schema — and that the actual endpoint host and wire shape are locked by a later ADR once a sibling-repo PR is opened under teammate review. Wired no endpoint, edited no sibling repo, added no fixture / test / script / `src/` change. |

The Phase 20 lane is **pre-integration**. It does not deliver
governed recall in Finn, Dixie, or Freeside runtime; it does not
deliver a Dixie endpoint or a Finn endpoint; and it does not deliver
Hounfour-side schema work. Each of those remains a future,
separate, sibling-repo event under teammate review per
[`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).

## What is locally proven

Restated narrowly so a reviewer can rely on the bullet list without
re-reading the four prior packets:

- **Local `RecallRequest` / `RecallPack` / `RecallReceipt` /
  `audit_review` / `audit_chain_verification` shape is
  evidence-backed.** The five top-level objects nominated by the
  Phase 20D candidate boundary
  ([`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md)
  "Boundary model — current evidence-backed contract candidates")
  are the same five objects the Phase 20B per-category tests and
  the Phase 20C demo-shape test exercise end-to-end on the existing
  `executeRecall()` pipeline. Their local sources of truth are
  [`src/straylight/types.ts`](../../src/straylight/types.ts),
  [`src/straylight/recall.ts`](../../src/straylight/recall.ts), and
  the [`AuditLog.verifyChain()`](../../src/straylight/audit.ts)
  projection.
- **Local recall behavior is pinned by tests.** The Phase 20B
  test pin
  ([`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts))
  enforces all six ADR-020D §4 receipt categories — *included*,
  *excluded*, *redacted*, *challenged*, *revoked*,
  *blocked-by-policy* — on the existing pipeline, plus the
  "structural validity is not authorization" invariant
  (off-keyring signer / missing competence rule both deny) and a
  receipt-or-audit completeness invariant. The Phase 5 hardening
  test
  ([`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts))
  remains the load-bearing fail-closed invariant pin.
- **Local demo evidence is reproducible.** The Phase 20C handoff
  doc
  ([`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)
  "Command to run the local recall demo") names exactly three
  invocations (`npm run demo:recall:json`, `npm run demo:recall --
  --json`, `npm run demo:recall`) and one output path
  (`.run/recall-demo.json`, gitignored). The Phase 20C test pin
  ([`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts))
  asserts the five top-level keys plus the pack ↔ receipt linkage
  and the clean audit-chain projection. A reviewer regenerates the
  artifact on their own machine; no committed snapshot exists in
  the repo.
- **Endpoint-host candidates and integration boundary are
  documented.** The Phase 20D handoff doc
  ([`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md))
  records, in one in-repo packet, what a future Dixie-hosted
  recall-inspection endpoint or Finn-hosted runtime-context
  endpoint *would* be responsible for at the boundary, what each
  candidate must not own (no Straylight semantic redefinition; no
  recall without receipt; no class-vs-policy collapse), and what
  ownership remains where (Straylight owns semantics; Hounfour
  *may later* own schema / protocol exports; Dixie *may later*
  host inspection; Finn *may later* host runtime; Freeside
  consumes). Per ADR-020B, the boundary is a *candidate*, not a
  finalized cross-repo API schema.

That is the whole local-evidence set Phase 20 produced. It is
**local evidence**, not runtime-wired evidence and not
endpoint-wired evidence.

## What is not proven

Phase 20E records, equally narrowly, what the Phase 20 lane did
**not** prove, so a reviewer cannot misread the evidence above as
proof of something it does not show:

- **No Dixie endpoint exists.** ADR-020B's default endpoint-host
  candidate is a *recommendation*, not an implementation. No
  `loa-dixie` PR has been opened; no Dixie HTTP / NATS / REST
  surface exists in any runtime. Phase 20D is endpoint-boundary
  *planning*, not endpoint *wiring*.
- **No Finn runtime integration exists.** ADR-020B's fallback
  endpoint-host candidate is a *recommendation*, not an
  implementation. No `loa-finn` PR has been opened; no Finn
  runtime endpoint, no Finn-side audit substrate, and no Finn
  recall execution path exists today. The Phase 10 packet
  ([`finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md))
  remains *staged*, not *implemented*.
- **No Freeside integration exists.** No `loa-freeside` PR has
  been opened; no bot / admin / community surface consumes
  governed recall today. The Phase 14 packet
  ([`freeside-community-surface-issue.md`](./freeside-community-surface-issue.md))
  remains *staged*, not *implemented*. Per
  [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md),
  Freeside cannot land before Dixie / Finn settle.
- **No Hounfour Straylight schemas exist.** Hounfour does not yet
  ship Straylight-specific canonical schemas. The Phase 16 / 17B /
  18 / 19A lane records the v8.5.x state and the `Challenge` /
  `EstateTransition` / `safeCanonicalize`-subpath deferrals; the
  Phase 19A packet
  ([`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md))
  is awaiting Jani / teammate response on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
  No Hounfour-side schema work has begun.
- **No `Challenge` implementation exists.** Per ADR-020C and the
  Phase 16 delta #7, `Challenge` remains deferred to Hounfour
  v8.6.0 / cycle-005. The Straylight-local `challenge` verb that
  participates in the Phase 4 demo's transition sequence is **not**
  a `Challenge` schema and does not anticipate one. No new
  `Challenge` schema, type, fixture, or verb wiring was added by
  any Phase 20 sub-phase.
- **No `EstateTransition` implementation exists.** Per ADR-020C
  and the Phase 16 delta #8, `EstateTransition` remains deferred
  to Hounfour v8.6.0 / cycle-005. The Straylight-local
  transition-application code path in
  [`src/straylight/estate.ts`](../../src/straylight/estate.ts) is
  **not** an `EstateTransition` schema and does not anticipate
  one.
- **No public anchor / commitment-root implementation exists.**
  Per ADR-020E, the local commitment-root helper at
  [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  is unchanged and unpublished. No publishing surface, chain
  client, wallet, contract ABI, indexer, or webhook participates
  in any Phase 20 artifact. The seven future-requirement gates in
  ADR-020E remain unsatisfied.
- **No production persistence is wired.** Per ADR-020D, the
  existing `InMemoryStorage` and `JsonlStorage` adapters are
  unchanged. No Postgres adapter, Finn / Dixie / Freeside storage
  shim, migration, or schema-versioned table participates in any
  Phase 20 artifact. "Production database" remains explicitly
  out-of-scope per
  [`docs/mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md).
- **No governed recall exists in sibling-runtime production
  surfaces.** Restated narrowly: governed recall — a runtime path
  that executes a `RecallRequest` under signer-competent,
  policy-validated, receipt-emitting, audit-chain-persisted
  semantics inside a sibling repo's runtime — is not present in
  Finn, Dixie, or Freeside today. The Phase 20 lane is the
  pre-integration lane that prepares Straylight for a future
  sibling-repo PR; it is not the integration itself.

This is **pre-integration**. The Recall Wedge is **not
runtime-wired** and **not endpoint-wired** by Phase 20.

## Phase 21 entry conditions

Phase 21 is the **endpoint / runtime integration** lane. Phase 21
may begin only when **all** of the following are true. None is
satisfied by Phase 20E itself.

1. **Hounfour / Jani feedback is received, or teammate review
   explicitly approves proceeding.** The Phase 19A packet
   ([`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md))
   is on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
   Phase 21 is unblocked when *either* (a) Jani / a Hounfour-side
   teammate has responded to the Phase 19A packet on issue #70,
   *or* (b) a Loa teammate review on this repo explicitly approves
   proceeding without that response, citing this packet and the
   Phase 19A packet. A response on a different Hounfour thread, an
   inferred response, or an unrelated Hounfour release is **not**
   a substitute.
2. **Endpoint host is selected for the next branch.** ADR-020B
   recommends Dixie as default and Finn as fallback. Phase 21 must
   pick one (or explicitly defer the choice with a separate ADR
   under teammate review). The choice locks which sibling repo
   the next branch's PR is opened in; it does not by itself
   authorize wiring on this repo.
3. **Schema ownership boundary is reaffirmed.** Per ADR-020A and
   ADR-020C, Loa-Straylight remains the semantic owner of the
   primitive set
   ([`ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
   §1 list); Hounfour remains the canonical schema *candidate*.
   Phase 21 must restate this boundary at entry — neither
   migrating ownership silently nor adopting a Hounfour-named
   primitive into the Straylight public surface without a separate
   ADR. Adoption is by a future ADR, not by rename.
4. **Runtime persistence / audit owner is reaffirmed.** Per
   ADR-020D, MVP receipt semantics remain owned by Loa-Straylight
   until runtime persistence is chosen; Finn / Dixie / Freeside
   are *future* persistence / exposure candidates. Phase 21 must
   restate which sibling repo (if any) takes over which substrate
   responsibility, citing ADR-020D and the relevant sibling-repo
   handoff packet (Phase 10 / 12 / 14). The receipt shape is not
   re-minted on the wire.
5. **Non-scope remains explicit.** Phase 21's entry packet must
   restate, in its own non-scope list, that `Challenge`,
   `EstateTransition`, `safeCanonicalize` exported subpath, public
   anchors, onchain integration, and threat-model widening
   (network adversary, real cryptography) remain deferred unless
   a separate ADR explicitly moves one of them in scope.

If any of the five conditions above is not met, Phase 21 must not
begin endpoint / runtime wiring. The non-go conditions in the next
section remain binding.

## Phase 21 non-go conditions

Phase 21 is forbidden from beginning endpoint / runtime wiring
when **any** of the following holds. These are restatements of the
Phase 20A / 20B / 20C / 20D non-scope discipline; they are not
new constraints, and they do not expire on their own.

- **Hounfour feedback is still pending and no teammate review
  approves proceeding.** If neither (a) Jani / a Hounfour-side
  teammate has responded on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  nor (b) a Loa teammate review on this repo explicitly approves
  proceeding without that response, **do not begin endpoint /
  runtime wiring**. This is the load-bearing implementation
  blocker named by every Phase 20 packet
  ([`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
  "Implementation blockers remaining";
  [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
  "What remains deferred";
  [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)
  "What remains deferred";
  [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md)
  "Implementation blockers — what Phase 20D does not remove").
- **Endpoint host is still ambiguous.** If Phase 21 has not, by a
  separate ADR or teammate-reviewed planning packet, picked Dixie
  *or* Finn (or explicitly deferred the choice), **do not wire
  Dixie or Finn**. ADR-020B's default-vs-fallback recommendation
  is not by itself the placement decision; the placement is locked
  by a later ADR once a sibling-repo PR is opened under teammate
  review.
- **Schema ownership is still ambiguous.** If Phase 21 has not
  reaffirmed the ADR-020A semantic-owner boundary and the
  ADR-020C schema-namespace strategy at entry, **do not add
  Hounfour schemas**. Hounfour does not yet own Straylight
  schemas; adoption is by a future ADR and a teammate-reviewed
  sibling-repo PR, not by rename.
- **Challenge / EstateTransition are still deferred.** If
  Hounfour v8.6.0 / cycle-005 has not shipped canonical
  `Challenge` / `EstateTransition` schemas and a Loa-side ADR has
  not adopted them, **do not implement `Challenge` or
  `EstateTransition` locally**. Both remain deferred per
  ADR-020C and the Phase 16 delta #7 / #8.

A Phase 21 entry packet that triggers any of the four non-go
conditions above must be rejected at teammate review. The non-go
sequence in
[`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
remains binding.

## Explicit non-scope (Phase 20E)

Phase 20E is **closeout only**. It performs no implementation
work. The following are out-of-scope and remain in the same state
Phase 20D left them:

- **No `src/` changes.** The wedge's stable public API surface
  ([`src/straylight/index.ts`](../../src/straylight/index.ts)) is
  unchanged. No re-export is added. No re-export is removed. No
  internal module is edited.
- **No tests.** No new test file. No edit to any existing test
  file. The Phase 20B per-category receipt pins
  ([`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts))
  and the Phase 20C demo-shape pin
  ([`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts))
  already cover the local evidence this closeout narrates.
- **No scripts.** Neither the demo CLI in
  [`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
  nor the demo library in
  [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts)
  is modified. No new fixture-export script is added.
- **No package changes.** `package.json` and `package-lock.json`
  are unchanged. The Hounfour dependency
  (`@0xhoneyjar/loa-hounfour@^8.5.0`) range and resolved patch are
  unchanged.
- **No Dixie endpoint.** ADR-020B's default endpoint-host
  recommendation is unchanged and unwired. No HTTP / NATS / REST
  / Discord / Telegram surface is added. No `loa-dixie` import is
  added. No Dixie-side fixture is consumed.
- **No Finn endpoint.** ADR-020B's fallback endpoint-host
  recommendation is unchanged and unwired. No HTTP / NATS / REST
  / Discord / Telegram surface is added. No `loa-finn` import is
  added. No Finn-side fixture is consumed.
- **No Freeside integration.** No bot / admin / community surface
  is added. No `loa-freeside` import is added.
- **No Hounfour schemas.** No new schema files authored. No
  Hounfour-side schema work begun. Hounfour-side work remains
  gated by [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
- **No `Challenge`.** Deferred to Hounfour v8.6.0 / cycle-005 per
  ADR-020C and the Phase 16 delta #7.
- **No `EstateTransition`.** Deferred to Hounfour v8.6.0 /
  cycle-005 per ADR-020C and the Phase 16 delta #8.
- **No `safeCanonicalize` work.** The `no-confirmed-subpath` gate
  (Phase 18) is unchanged. The Straylight-local canonicalizer
  ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
  remains the canonicalization implementation. No reach into
  unexported Hounfour internals.
- **No public anchors.** Per ADR-020E. The local commitment-root
  helper at
  [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  is unchanged. No publishing surface, chain client, wallet,
  contract ABI, indexer, or webhook is added.
- **No persistence wiring.** Per ADR-020D. No new `StorageAdapter`
  implementation, no Postgres / Finn / Dixie / Freeside storage
  shim, no migration, no schema-versioned table.
- **No sibling repo edits.** Not `loa-hounfour`, not `loa-finn`,
  not `loa-dixie`, not `loa-freeside`. No clone, no fork, no
  patch, no comment filed against any sibling repo by Phase 20E.
- **No new HTTP / network surface.** The threat model in
  [`../mvp/threat-model.md`](../mvp/threat-model.md) lists
  network adversary as out-of-scope; Phase 20E does not move it
  in-scope.
- **No `.loa/` / `.claude/` edits.**
- **No auth token printing or writing.** The user-scoped
  `~/.npmrc` Hounfour auth (Phase 17B) remains out-of-band; the
  project `.npmrc` remains registry-only.
- **No commit, no push, no PR.**

## What this packet does *not* claim

For symmetry with the recap and entry-condition lists above, and
so a reviewer cannot misread Phase 20E as authorization for
Phase 21 wiring, Phase 20E explicitly does **not** claim:

- **Not** "the full Recall Wedge is implemented." Phase 20E is
  the closeout of the **pre-integration** lane. It is **not
  runtime-wired** and **not endpoint-wired**.
- **Not** "governed recall exists in Finn / Dixie / Freeside
  runtime." None of the sibling-repo handoff packets has been
  merged in its target repo. The wedge is a local TypeScript
  library + a local CLI demo; it is not a runtime-wired
  governed-recall surface.
- **Not** "a Dixie endpoint exists." ADR-020B's default
  endpoint-host candidate is a *recommendation*. It is not wired
  in any runtime. No `loa-dixie` PR has been opened.
- **Not** "a Finn endpoint exists." ADR-020B's fallback
  endpoint-host candidate is a *recommendation*. It is not wired
  in any runtime. No `loa-finn` PR has been opened.
- **Not** "Hounfour owns Straylight schemas." Per ADR-020A and
  ADR-020C, Loa-Straylight remains the semantic owner of every
  Recall Wedge primitive. Hounfour remains the canonical schema
  *candidate*, gated by issue #70.
- **Not** "`Challenge` exists." Deferred to Hounfour v8.6.0 /
  cycle-005.
- **Not** "`EstateTransition` exists." Deferred to Hounfour
  v8.6.0 / cycle-005.
- **Not** "public anchoring exists." Per ADR-020E, the local
  commitment-root helper is unchanged and unpublished.
- **Not** "Phase 21 is authorized to begin." Phase 21 is gated on
  the entry conditions above; the non-go conditions above remain
  binding.

This is **closeout**. The output is **local evidence** for a
**pre-integration** lane. The Recall Wedge is **not
runtime-wired** and **not endpoint-wired** by Phase 20E. This is
**Phase 20E only**.

## Validation evidence

```bash
npm run typecheck
npm test
```

`npm run typecheck` and `npm test` are expected to remain clean on
the `phase-20e-recall-wedge-closeout` branch: Phase 20E adds no
new test, modifies no source file, and modifies no demo script,
fixture, or package file, so the existing Phase 4 demo test, the
Phase 5 hardening tests, the Phase 17B / 18 shadow-integration
pins, the Phase 19A review-packet pin, the Phase 20B local-scaffold
pin, the Phase 20C demo-shape pin, and the existing handoff-doc
validation tests are unaffected.

## Cross-references

- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
  — Phase 20A decision-lock readiness packet.
- [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)
  — Phase 20A-staged Phase 20B candidate scope.
- [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
  — Phase 20B local-scaffold summary.
- [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)
  — Phase 20C demo / evidence summary.
- [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md)
  — Phase 20D endpoint-boundary planning summary.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  — semantic-owner decision-lock.
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
  — MVP endpoint-host recommendation + fallback.
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
  — schema-namespace strategy + Phase 20A deferrals.
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  — receipt-ownership + persistence-deferral decision-lock.
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — commitment-root / public-anchor deferral.
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet (the load-bearing pending
  feedback for Phase 21 entry).
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  — Phase 17B / 18 shadow-integration findings.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index (updated in Phase 20E to link
  this doc).
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 20E to link this doc.
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — Phase 20B per-category receipt pins (unchanged by Phase 20E).
- [`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts)
  — Phase 20C demo-shape pin (unchanged by Phase 20E).
- [`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts),
  [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts)
  — demo CLI + library (unchanged by Phase 20E).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge's stable public API surface (unchanged by Phase 20E).
