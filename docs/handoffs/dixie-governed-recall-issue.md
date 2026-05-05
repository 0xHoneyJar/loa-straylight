# Dixie governed recall / BFF — issue handoff

> Status: Phase 12. **Pre-integration handoff packet, in
> `loa-straylight` only.** This file is written so it can be filed
> verbatim (or with minor edits) as a GitHub issue against
> [`0xHoneyJar/loa-dixie`](https://github.com/0xHoneyJar/loa-dixie)
> when that repo is ready to host the operator-facing /
> developer-facing surfaces around the Straylight Recall Wedge.
> **Filing the issue is not part of Phase 12.** Nothing in this
> handoff imports from `loa-dixie`, edits any sibling repo, adds a
> Dixie dependency, performs Dixie integration, or changes Phase
> 0–11 runtime behavior. This is handoff prep, not Dixie
> integration.

## Title

> Adopt Straylight Recall Wedge primitives as `loa-dixie` governed
> recall / BFF / provenance / inspection surface

## Summary

`loa-straylight` Phase 5 froze the Recall Wedge's public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)). Phase 6,
7, 8, and 9 staged the schema-extraction handoff that should move
the wedge's class-validation vocabulary to `loa-hounfour`. Phase 10
staged the runtime-enforcement handoff that should land in
`loa-finn` *after* Hounfour ships a stable schema surface. Phase 12
(this issue) stages the **governed-recall / BFF / provenance /
inspection** handoff that should land in `loa-dixie` *after*
Hounfour ships shape and Finn ships a runtime gate.

This issue requests that `loa-dixie` eventually ships:

1. A governed-recall / BFF module (e.g. `loa-dixie/src/straylight/`)
   that consumes the wedge's stable public API (or its
   Hounfour-extracted successor) and Finn's runtime gate (or its
   pre-Finn equivalent), and exposes operator-facing /
   developer-facing surfaces over the resulting recall packs,
   receipts, audit events, and estate summaries.
2. **Recall intake** (build a `RecallRequest`, validate, hand to
   the runtime gate), **recall-response surface** (return the
   served `RecallPack` + `RecallReceipt`), **excluded-assertion
   reason display**, **provenance inspection**, **audit-chain
   lookup**, **estate summary**, **assertion-status inspection**,
   **challenge / revocation / forgotten awareness**,
   **public/private environment-frame handling**, **high-risk
   recall handling**, and **cross-tenant recall prevention** — all
   under fail-closed semantics inherited from Finn / the wedge.
3. A neutral place to host the operator-facing recall, audit, and
   estate-inspection surfaces that other Loa components (eval
   harness, Freeside community surfaces, future onchain anchor
   adapter) can call without re-implementing Straylight semantics
   and without bypassing recall receipts.
4. Dixie-side conformance tests grounded by the local fixture pack
   at
   [`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/),
   adopted verbatim or imported as a fixture package once the
   wedge, Hounfour, and Finn are pinned.

The companion boundary doc is at
[`docs/handoffs/dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md).
The mapping table from Straylight primitives to proposed Dixie
BFF / API surfaces is at
[`docs/handoffs/dixie-recall-mapping.md`](./dixie-recall-mapping.md).

## Background

The Straylight Recall Wedge ships a thin control plane over a
governed actor estate. The wedge's primitives — `Assertion`,
`Keyring`, `EstateTransition`, `Challenge`, `Revocation`,
`ForgetRecord`, `RecallRequest`, `RecallPack`, `RecallReceipt`,
`AuditEvent`, `CommitmentRoot` — are produced today inside the
wedge and exercised through `EstateStore`, `executeRecall`,
`AuditLog`, and `policyForX(...)`. That works for an in-process,
single-actor MVP.

It does not, on its own, give operators / developers / auditors a
way to:

- file a recall request from a UI / API / CLI / bot without
  re-authoring the request envelope by hand;
- read back the served `RecallPack` plus its `RecallReceipt` in a
  shape that respects the `included` / `marked` / `redacted`
  discipline;
- explain *why* an excluded assertion was excluded
  (`actor_private` in `public_discord` frame, `revoked`,
  `forgotten_from_recall`, `sealed`, …);
- inspect the provenance of an assertion that landed in a pack
  (`provenance_id`, `source_type`, `captured_by`,
  `evidence_summary`);
- walk the per-estate audit chain and surface a `verifyChain`
  result for operator review;
- summarize an actor's estate (counts by class / status /
  privacy scope / risk level, current keyring head) without
  serving raw assertion bodies;
- see whether an assertion is currently `active` / `contested` /
  `demoted` / `revoked` / `forgotten_from_recall` / `sealed`,
  and (for `contested`) which `Challenge` records reference it;
- recognize and refuse a recall whose caller's `actor_id` does
  not match the target estate's `actor_id` (cross-tenant
  prevention).

The architecture spec calls this out:

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.4 — Dixie hosts operator-facing recall, audit, and
  estate-inspection surfaces, **without** re-implementing wedge
  semantics or bypassing receipts.
- §22.5 — Epic E (Dixie governed recall / BFF) with
  task-level acceptance criteria.

Phase 12 (this issue) consumes those architectural decisions and
turns them into a Dixie-shaped handoff. It does not start the
work; it specifies what the work needs to consume, fail-close on,
and emit when the work is done.

## Why this belongs in Dixie

The operator / developer / auditor surface is downstream of both
shape (Hounfour) and runtime (Finn). Every Loa component that
wants to *show* an assertion, *display* a recall, *explain* an
exclusion, or *inspect* an audit chain needs the same shapes and
the same fail-closed defaults. Hounfour cannot host the BFF
because it must remain runtime-free. Finn cannot host the
operator UI because it is a runtime gate, not a presentation
layer. Straylight (the wedge) cannot host either because it is
in-process by design. Dixie is the natural seam:

1. **Operator console / BFF substrate.** Dixie already hosts the
   developer-facing UI / API substrate; recall intake, recall
   response, excluded-reason display, provenance inspection,
   audit-chain lookup, and estate summary are a presentation-layer
   match.
2. **Read-mostly surface.** Dixie is read-mostly relative to the
   wedge's transition lane. The BFF *requests* recall packs and
   *displays* receipts; it does **not** mutate estate state on its
   own. That keeps the class / policy / runtime gates upstream of
   Dixie, where they belong.
3. **Multi-tenant boundary.** Dixie already exposes a per-actor /
   per-tenant boundary in its addressing model; cross-tenant
   recall prevention is naturally enforced at the BFF layer (with
   the wedge / Finn as the second line of defense).
4. **Auditor-friendly format.** Dixie can render `RecallReceipt`,
   `AuditEvent`, and exclusion summaries in a shape that auditors
   actually use. The wedge produces JSON; Dixie produces operator
   views over that JSON.

What Dixie gets is the **governed-recall / BFF / inspection lane
only**. The class-vs-policy boundary in
[`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
remains load-bearing here: Hounfour ships shape, the wedge
produces decisions in-process, Finn enforces decisions across
processes, **Dixie exposes those decisions to humans without
collapsing the boundary**.

## Explicit non-goals

Dixie is **not** asked to ship any of the following. Each item
maps to a responsibility that stays in `loa-straylight`,
`loa-hounfour`, or `loa-finn` (or a sibling) permanently:

- **No canonical schema authority.** Dixie MUST NOT define the
  canonical shape of any Straylight primitive. It MUST consume
  Hounfour-published schemas (or, until Hounfour ships, the
  wedge's re-exported `types.ts`) and MUST treat re-shape
  decisions as out-of-scope. The class lane lives in Hounfour,
  not Dixie.
- **No runtime policy enforcement that bypasses Finn / the
  wedge.** Dixie MUST NOT decide on its own whether a transition
  is admitted, denied, marked, or held for review. The runtime
  gate lives in Finn (post-Phase 10) — or, until Finn ships, in
  the wedge — and Dixie consumes the resulting `PolicyDecision`
  / `RecallReceipt` / `AuditEvent`. Dixie MUST NOT produce a
  `PolicyDecision` of its own.
- **No "generic retrieval is governed recall" collapse.** Dixie
  MUST NOT serve vector / keyword / graph / RAG retrieval
  results to a caller as a `RecallPack`. A `RecallPack` only
  exists if the request ran through the runtime gate, the
  policy lane returned a non-deny decision, the disposition
  matrix was applied, and a `RecallReceipt` was emitted and
  persisted. Anything else is "context retrieval" and MUST be
  presented as such, not as a governed recall.
- **No recall without receipt.** Dixie MUST NOT display, return,
  cache, or relay a recall response without a matching
  `RecallReceipt`. A pack without a receipt is treated as a
  denied recall; the BFF surface either returns the deny reason
  or refuses to render. The wedge's "every served pack has a
  receipt" discipline is load-bearing through Dixie.
- **No leakage of private estate material in unauthorized
  contexts.** Dixie MUST NOT expose `actor_private` or `sealed`
  material in any environment frame other than `audit_review`
  (and only to a competent auditor signer). The wedge's
  `privacyDispositionForFrame` discipline must be respected by
  the BFF presentation layer too — exclusion summaries are fine,
  but the underlying body MUST NOT travel.
- **No surfacing of challenged / revoked / forgotten material as
  ordinary active context.** Dixie MUST NOT render a `revoked`
  or `forgotten_from_recall` assertion as `usable` in any frame
  (the wedge already excludes them outside `audit_review`; Dixie
  MUST NOT undo that). A `contested` assertion MUST always be
  presented as `marked`, never as silently included context.
  The recall pack's `marked[]` and `excluded_summary[]` are the
  load-bearing surfaces; Dixie MUST preserve them.
- **No model-summary-as-canonical-truth.** Dixie MAY render a
  model-generated *summary* of a recall pack or estate (e.g.
  "this estate has 3 active observations and 1 contested
  reflection") but MUST tag the rendered text as a model
  summary, never as canonical estate truth. The canonical truth
  is the JSON; the summary is provenance, not authority.
- **No new schema authority.** Dixie MUST NOT promote new
  `AssertionClass`, `AssertionStatus`, `EnvironmentFrame`,
  `TransitionType`, `AuditEventType`, `CommitmentType`,
  `PrivacyScope`, `RiskLevel`, `ProvenanceSourceType`,
  `ChallengeType`, `ChallengeRequestedEffect`,
  `RecallUseInstruction`, `ReceiptDetailLevel`, `SignerType`,
  `SignatureType`, `SignerStatus`, `PolicyDecisionOutcome`,
  `TransitionReceiptKind`, `EstateStatus`, `ActorType`, or
  `ActorStatus` values unilaterally. Additions are a Hounfour
  change; Dixie consumes the enum, it does not own it.
- **No reverse imports.** Dixie MUST NOT publish a package that
  `loa-straylight`, `loa-hounfour`, `loa-finn`, or any other
  Straylight consumer is expected to import. The BFF / inspection
  surface is *downstream*, not a peer dependency of the wedge.
- **No cross-tenant recall.** Dixie MUST NOT serve a recall
  whose request signer / requested actor does not match the
  target estate's tenant. Cross-tenant prevention is a
  Dixie-layer responsibility (with the wedge / Finn as the
  second line of defense — both layers must refuse).
- **No production signature material in the handoff packet.**
  The fixtures under
  [`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  carry `dev_signature` envelopes for shape illustration only;
  Dixie MUST consume real signature material once Finn wires
  production signers. The BFF MUST NOT treat `dev_signature` as
  a binding signing primitive.
- **No Discord / Freeside / Finn / Hounfour integration in the
  same change.** This issue is the Dixie-side BFF / inspection
  gate; sibling integrations are separately tracked epics (per
  §22.4 / §22.6 / §22.7).
- **No production database integration in the same change.**
  Dixie's storage adapter is downstream of the wedge's
  `StorageAdapter` contract; production database choice
  (Postgres / WAL / equivalent) is a Finn / Dixie deployment
  decision and MUST satisfy
  [`tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts).
- **No onchain publishing.** The commitment-anchor seam stays in
  `loa-straylight` (per §6.2.3 and `package-boundary.md` §10).
  Dixie MAY display a `CommitmentRoot` once anchored, but Dixie
  MUST NOT host the chain client itself.
- **No PRD / SDD / sprint planning artifact** is requested by
  this issue. Dixie's process for adopting these primitives is
  Dixie's choice.

## Dixie responsibilities it should eventually own

The responsibilities below are derivable from the architecture
spec (§6.2.4, §22.5) and from the wedge's stable public surface
(`src/straylight/index.ts`). Each one carries a **fail-closed
condition**: if Dixie cannot complete the responsibility, the BFF
denies / refuses to render / surfaces the deny reason — never
fabricates a pack, never serves a stale receipt, never collapses
a `marked` item into `included`.

### D1. Recall request intake

For every external operator / developer / auditor action that
files a recall, Dixie MUST:

1. Build a `RecallRequest` per the wedge's
   `validateRecallRequest` shape (`recall_request_id`,
   `actor_id`, `estate_id`, `task`, `environment_frame`,
   `risk_profile`, scope filters, signer envelope).
2. Refuse to file a request whose caller's `actor_id` /
   tenant does not match the target estate's tenant
   (cross-tenant prevention).
3. Hand the request to the runtime gate (Finn, post-Phase 10;
   or the wedge's `executeRecall` until Finn ships) without
   short-circuiting class / policy / competence layers.
4. Surface the resulting decision (`allow`, `deny`,
   `needs_review`, `allow_with_redaction`, `allow_marked_only`)
   to the caller.

Fail-closed condition: any layer error denies the intake; engine
errors become `deny` with `policy_engine_error:<code>`. The
wedge's `safeRun` discipline travels through the BFF.

### D2. Recall pack generation request

For every accepted recall request, Dixie MUST:

1. Pass the request into the runtime gate's recall executor.
2. Wait for the executor to return a `RecallPack` *and* a
   `RecallReceipt`.
3. Refuse to render the pack if the matching receipt is missing,
   stale, or whose `pack_hash` does not match the served pack.
4. Preserve the `included` / `marked` / `redacted` discipline
   in the rendered output.

Fail-closed condition: a pack without a matching receipt is a
runtime bug; Dixie returns the deny reason and refuses to render.

### D3. Recall receipt retrieval

Dixie MUST expose a receipt-retrieval surface keyed by
`receipt_id` that:

1. Returns the persisted `RecallReceipt` (with its
   `pack_hash`, `receipt_hash`, `detail_level`,
   `policy_decision`, signer envelope, and
   `commitment_ref` if present).
2. Refuses to materialize a receipt that does not exist
   (does not synthesize a placeholder).
3. Respects the requested `detail_level`
   (`minimal` / `standard` / `debug`); applying detail-level
   redaction is the wedge / Finn's job, but Dixie MUST NOT
   bypass the requested level.

Fail-closed condition: receipt missing → 404 / not-found; never
fabricate.

### D4. Excluded-assertion reason display

For every served pack, Dixie MUST render the
`excluded_summary[]` (and, where present, `redacted[]`) in a
shape that explains *why* each excluded class was excluded
(e.g. `private_excluded_from_public_frame`,
`revoked_excluded_outside_audit_review`,
`forgotten_excluded_outside_audit_review`,
`sealed_excluded_outside_audit_review`).

Fail-closed condition: if the wedge's exclusion summary is
empty when it shouldn't be (e.g. an `actor_private` assertion
exists but doesn't appear in the summary), Dixie surfaces a
"unexplained-exclusion" warning rather than rendering as if
nothing was excluded.

### D5. Provenance inspection

Dixie MUST expose a provenance-inspection surface keyed by
`assertion_id` that:

1. Returns the assertion's `provenance[]` records
   (`provenance_id`, `source_type`, `observed_at`,
   `captured_by`, `evidence_summary`).
2. Tags each record's `source_type` so the operator can see
   whether the input is `operator_input`, `model_output`,
   `runtime_observation`, `delegation_record`, etc.
3. Respects the privacy scope of the parent assertion — a
   provenance record on an `actor_private` assertion is **not**
   exposed in `public_discord` frame.

Fail-closed condition: privacy-scope leak → refuse to render
the provenance record; surface the exclusion as a warning.

### D6. Audit chain lookup

Dixie MUST expose an audit-chain lookup surface keyed by
`estate_id` that:

1. Returns the per-estate `AuditEvent[]` in chain order.
2. Surfaces a `verifyChain` result (`{ ok: true }` or
   `{ ok: false, broken_at, reason }`).
3. Refuses to render if the chain is broken — instead
   surfaces the `audit_chain_broken` indicator so the
   operator can reconcile.

Fail-closed condition: broken chain → display the breakage,
do **not** suppress.

### D7. Actor estate summary

Dixie MUST expose an estate-summary surface keyed by
`actor_id` / `estate_id` that:

1. Returns the actor / estate / keyring meta (without
   exposing keyring private material).
2. Surfaces counts by `assertion_class`, by
   `assertion_status`, by `privacy_scope`, and by
   `risk_level`.
3. Respects privacy-scope boundaries — `actor_private` and
   `sealed` counts are visible only in `audit_review` /
   `tenant_dashboard` frames, not in `public_discord`.

Fail-closed condition: counts cannot be computed (e.g.
estate not found) → 404 / not-found, never fabricate zeros.

### D8. Assertion status inspection

Dixie MUST expose an assertion-status surface keyed by
`assertion_id` that:

1. Returns the current `AssertionStatus` (`active` /
   `contested` / `demoted` / `revoked` /
   `forgotten_from_recall` / `sealed` / …).
2. Surfaces the assertion's `challenged_by_refs` and
   `revoked_by_ref` (when present).
3. Tags whether the assertion is currently quotable in
   recall (`active`, `marked`, or `excluded`) for the
   environment frame the caller is in.

Fail-closed condition: status change in flight → return the
last persisted status; do **not** speculate on the next state.

### D9. Challenge / revocation / forget awareness

For every assertion Dixie surfaces, the BFF MUST consult the
wedge's `Challenge` / `Revocation` / `ForgetRecord` records
and refuse to render the assertion as `active` if any of:

- a `Challenge` exists with `requested_effect: revoke` that
  has been admitted;
- a `Revocation` record exists for the assertion;
- a `ForgetRecord` exists for the assertion.

Instead, Dixie surfaces the challenge / revocation / forget
record (with its signer, reason, and timestamp).

Fail-closed condition: challenge / revocation / forget record
unparseable → render the assertion as `excluded` with reason
"unparseable_governance_record"; never as `active`.

### D10. Public / private environment-frame handling

Dixie MUST attach the caller's `environment_frame`
(`public_discord`, `private_dm`, `tenant_dashboard`,
`audit_review`, `cli`, …) to every recall request the BFF
files. The wedge's `privacyDispositionForFrame` (and Finn's
runtime equivalent) decide what the frame is allowed to see.
Dixie MUST NOT override the frame to "see more" than the
wedge / Finn allows.

Fail-closed condition: caller's frame is unknown / spoofed →
deny intake with reason `unknown_environment_frame`.

### D11. High-risk recall handling

For high / critical-risk recalls in public frames, the wedge's
`policyForRecallRequest` lifts to `needs_review`. Dixie MUST:

1. Surface the `needs_review` decision to the caller (do not
   serve a partial pack).
2. Hold the request in a review queue keyed by a competent
   reviewer signer.
3. Allow the reviewer to sign off (or refuse), and replay the
   request through the runtime gate with the reviewer's
   signer envelope.

Fail-closed condition: review queue unavailable → keep the
request in `needs_review`; never auto-promote to `allow`.

### D12. Cross-tenant recall prevention

Dixie MUST refuse a recall whose:

- caller's tenant boundary does not match the target
  estate's tenant boundary;
- caller's `actor_id` does not match the target estate's
  controlling actor (unless an explicit
  `cross-actor delegation` is on the keyring); or
- the request's `estate_id` is not on the BFF's allow-list
  for the caller's session.

Fail-closed condition: any tenant-boundary check failure →
deny with `cross_tenant_recall_refused`; emit a Dixie-side
audit log entry referencing the wedge's `recall_denied`.

## Dixie responsibilities it should not own

The list below is the inverse of the responsibilities Dixie does
own. Each one belongs to a sibling repo or to the wedge itself.
Repeating them here so the PR reviewer cannot accidentally promote
Dixie into a class-lane, runtime-lane, or schema-lane authority.

- **Class validation vocabulary.** Owned by Hounfour
  (post-Phase 9). Until Hounfour ships, `loa-straylight` owns
  the TypeScript declarations. Dixie consumes; Dixie does not
  author.
- **Runtime policy enforcement.** Owned by Finn (post-Phase 10).
  Until Finn ships, the wedge owns it in-process. Dixie does not
  re-implement `policyForAdmitAssertion`,
  `policyForTransition`, `policyForRecallRequest`,
  `evaluateCompetence`, or any other decision producer.
- **Local wedge primitives** (`EstateStore`, `executeRecall`,
  `dispositionFor`, `summaryFor`, `useInstructionForMark`,
  `redactReceipt`, `AuditLog.append`,
  `AuditLog.verifyChain`). Owned by `loa-straylight`
  permanently.
- **Storage adapter implementations.** `InMemoryStorage` and
  `JsonlStorage` are wedge-only fixtures. The Postgres / real-WAL
  adapter that production Dixie consumes from MUST satisfy
  [`tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts);
  the *implementation* is Finn / Dixie's responsibility, but the
  *interface* is wedge-owned.
- **Onchain anchor adapters.** Reserved future work in
  `loa-straylight`. Dixie MAY display an anchored
  `CommitmentRoot`, but Dixie MUST NOT host the chain client.
- **Generic RAG / vector / keyword / graph retrieval.** Owned by
  the runtime gate's retrievers (Finn-side) or by adapter modules
  outside Dixie. Retrievers plug in *behind* the wedge's
  prefilter, never above. Dixie does not bolt a vector index onto
  the recall surface and call the result a `RecallPack`.

## Proposed recall / BFF surfaces

Each surface below is a candidate route / endpoint / view in
Dixie. PR-A's author may relocate them; the *surface* must
remain.

| Surface | Method (illustrative) | Wedge primitive consumed | Output |
|---|---|---|---|
| Recall intake | `POST /recall` | `validateRecallRequest` + `policyForRecallRequest` (via runtime gate) | `RecallRequest` accepted (or denied) |
| Recall response | `GET /recall/:request_id` | `executeRecall` outcome | `RecallPack` + `RecallReceipt` (or deny reason) |
| Receipt retrieval | `GET /receipt/:receipt_id` | persisted `RecallReceipt` | `RecallReceipt` (with `detail_level`) |
| Excluded-reason display | `GET /recall/:request_id/excluded` | `RecallPack.excluded_summary[]` + `redacted[]` | exclusion reasons + counts |
| Provenance inspection | `GET /assertion/:assertion_id/provenance` | `Assertion.provenance[]` | provenance records (privacy-scope-respecting) |
| Audit chain lookup | `GET /estate/:estate_id/audit` | `AuditLog.list` + `AuditLog.verifyChain` | `AuditEvent[]` + verify result |
| Estate summary | `GET /estate/:estate_id/summary` | `Actor`, `ActorEstate`, `Keyring` (meta only), assertion counts | summary view |
| Assertion status | `GET /assertion/:assertion_id` | `Assertion` + `Challenge` / `Revocation` / `ForgetRecord` | status + governance-record refs |
| Challenge / revocation awareness | `GET /assertion/:assertion_id/governance` | governance records | challenge / revocation / forget timeline |
| High-risk review queue | `GET /review`, `POST /review/:request_id/sign` | `needs_review` decisions | reviewer queue + sign-off |
| Cross-tenant guard | (middleware) | tenant boundary check | accept / deny intake |

## Proposed provenance and inspection surfaces

The provenance / inspection surface is the read-only
counterpart of the recall surface. It is what an auditor uses
to trace a served pack back to the assertions it referenced and
the provenance behind those assertions. The surfaces are:

| Surface | Wedge primitive consumed | Notes |
|---|---|---|
| Per-assertion provenance | `Assertion.provenance[]` | Privacy-scope-respecting; `actor_private` provenance never travels to `public_discord`. |
| Per-pack provenance | `RecallPack.included[].provenance_refs` | Walks the included items' provenance refs. |
| Per-receipt provenance | `RecallReceipt.policy_decision`, signer envelope, `pack_hash`, `commitment_ref` | The receipt is itself an audit artifact. |
| Per-audit-event provenance | `AuditEvent.signed_by`, `assertion_refs`, `transition_id`, `recall_request_id` | Walks the audit chain to surface what produced an event. |
| Per-keyring provenance | `Keyring.signer_entries[]`, `competence_rules[]` | Shows which signer is competent for which transition. |

Fail-closed condition: provenance walk fails → return the
walked-so-far view + a "walk-incomplete" warning; never
fabricate a provenance ref.

## Proposed receipt / audit display surfaces

Receipts and audit events are the *durable* artifacts of the
governed-recall flow. Dixie's display layer MUST render both
in a shape that auditors can replay.

| Display surface | Wedge primitive consumed | Output |
|---|---|---|
| Receipt detail view | `RecallReceipt` (`pack_hash`, `receipt_hash`, `detail_level`, `policy_decision`, signer, `commitment_ref`) | full receipt |
| Receipt minimal view | `RecallReceipt` (with `detail_level: 'minimal'`) | redacted receipt |
| Audit event row | `AuditEvent` (`event_type`, `audit_hash`, `previous_audit_hash`, `assertion_refs`, `transition_id`, `recall_request_id`, signer) | one row per event |
| Audit chain head | `AuditLog.list` + `verifyChain` | chain head + verify result |
| Chain-broken indicator | `AuditLog.verifyChain` failure path | break index + reason |
| Commitment root display | `CommitmentRoot` (when present) | `root_hash` + `commitment_type` + signer |

Fail-closed condition: a display request that would have to
synthesize a missing field (e.g. a missing `audit_hash`) →
return a "field-missing" surface, not a fabricated value.

## Proposed fail-closed behavior

Fail-closed is the load-bearing property of the BFF surface.
Every layer denies / refuses to render on uncertainty; no
layer fabricates, summarizes-as-truth, or auto-promotes a
`marked` item to `included`.

1. **Recall intake** with unknown frame, unknown caller, or
   cross-tenant boundary mismatch → `deny`, reason
   `cross_tenant_recall_refused` /
   `unknown_environment_frame`.
2. **Recall response without receipt** → refuse to render
   the pack; surface the deny reason. The wedge's discipline
   ("every served pack has a receipt") travels through Dixie.
3. **Receipt retrieval** for a non-existent receipt → 404 /
   not-found; never synthesize.
4. **Excluded-assertion reason display** with empty
   `excluded_summary` when an exclusion was expected →
   surface "unexplained-exclusion" warning.
5. **Provenance inspection** that would leak `actor_private`
   provenance into `public_discord` → refuse the leak; surface
   exclusion warning.
6. **Audit chain lookup** with `verifyChain.ok === false` →
   render the break index + reason; never suppress.
7. **Estate summary** for a non-existent estate → 404 /
   not-found.
8. **Assertion status** for a `revoked` /
   `forgotten_from_recall` assertion → render as `excluded`
   in non-`audit_review` frames; render as `marked` in
   `audit_review`.
9. **Challenge / revocation / forget record** unparseable →
   render the assertion as `excluded` with reason
   "unparseable_governance_record".
10. **High-risk recall** that the runtime gate lifted to
    `needs_review` → hold in review queue; never
    auto-promote.
11. **Cross-tenant recall** → deny intake; emit a Dixie-side
    audit log entry referencing the wedge's `recall_denied`.
12. **Engine error inside the BFF** (renderer, retriever, or
    proxy) → return the error envelope; do **not** fabricate
    a partial pack / receipt.

## Proposed tests

Dixie's BFF / inspection module MUST ship a conformance test
pack that covers every responsibility above. The fixtures at
[`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
are *current-shape examples* that PR-A can adopt or import as
inputs. They are **not** the official Dixie fixtures yet; they
are the deterministic local prep the wedge ships so PR-A does
not start from scratch.

The minimum test list:

1. **Recall request — public Discord intake.** A correctly
   shaped `RecallRequest` for `public_discord` is accepted by
   the BFF, validated, and forwarded to the runtime gate; the
   fixture pins the request envelope shape.
2. **Recall response — pack + receipt.** A served recall
   round-trips through the BFF with both the `RecallPack` and
   the matching `RecallReceipt`. The fixture pins the
   `pack_hash` / `receipt_hash` correspondence.
3. **Denied recall — private assertion in public context.** A
   recall in `public_discord` MUST exclude `actor_private`
   material; the BFF surfaces the exclusion summary, never
   the body.
4. **Denied cross-tenant recall.** A recall whose caller's
   tenant does not match the target estate's tenant is
   refused at intake; the BFF emits a Dixie-side audit log
   entry referencing the wedge's `recall_denied`.
5. **Revoked assertion excluded.** A recall in
   `public_discord` excludes `revoked` material; the BFF
   surfaces the exclusion summary; the audit chain still
   shows the revocation.
6. **Forgotten assertion excluded but auditable.** A recall
   in `public_discord` excludes `forgotten_from_recall`
   material; an `audit_review` recall surfaces it as
   `marked` with `use_instruction: 'do_not_use_quote_only'`
   (or the wedge's equivalent).
7. **Contested assertion marked.** A recall in
   `public_discord` includes a `contested` assertion only as
   `marked` (use_instruction `mark_as_contested`); the BFF
   renders it in a "contested" UI affordance, never as
   silently included context.
8. **Provenance inspection — privacy-scope respecting.** A
   provenance walk on an `actor_private` assertion's
   provenance refs returns the records to an
   `audit_review`-frame caller and refuses them to a
   `public_discord`-frame caller.
9. **Audit chain lookup — verify result.** An audit chain
   lookup returns the events plus a `verifyChain` result.
   When the chain is broken, the BFF surfaces the break
   index and reason instead of suppressing.
10. **Actor estate summary — counts by class / status.** An
    estate-summary call returns assertion counts by class
    and by status; counts respect privacy-scope (the
    `public_discord` view does not expose `actor_private`
    counts).

The handoff fixtures cover all ten cases. Filenames listed in
[§Validation commands](#validation-commands).

## Acceptance criteria

PR-A is acceptable when **every** item below is satisfied. Until
all are satisfied, `loa-straylight` keeps its locally-owned
recall / inspection semantics and does not delegate to a partial
Dixie implementation.

### Structural

- [ ] **DX1.** `loa-dixie/src/straylight/` (or the equivalent
  Dixie module path) exists with the BFF / inspection layout
  proposed in
  [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.4 / §22.5.
- [ ] **DX2.** Dixie imports the wedge's public surface (or
  its Hounfour-extracted successor) only through the documented
  package entrypoint. No deep imports.
- [ ] **DX3.** Dixie imports Finn's runtime-gate surface (or
  its pre-Finn equivalent) only through the documented
  package entrypoint.
- [ ] **DX4.** Dixie's BFF runs intake → tenant guard →
  forward to runtime gate → render pack + receipt, in that
  order, for every governed recall.
- [ ] **DX5.** Dixie does not produce a `PolicyDecision` of
  its own. The decision is upstream.

### Behavioral non-shipment

- [ ] **DX6.** Dixie does not host canonical class schemas.
  Any schema-shape change goes through Hounfour
  (post-Phase 9).
- [ ] **DX7.** Dixie does not perform runtime policy
  enforcement. Any decision goes through Finn / the wedge.
- [ ] **DX8.** Dixie does not collapse generic retrieval into
  governed recall. A `RecallPack` only exists when the runtime
  gate served it, with a matching `RecallReceipt`.
- [ ] **DX9.** Dixie does not serve / display / cache /
  relay a recall response without a matching `RecallReceipt`.
- [ ] **DX10.** Dixie does not expose `actor_private` /
  `sealed` material in any frame other than `audit_review`.
- [ ] **DX11.** Dixie does not surface
  `revoked` / `forgotten_from_recall` / `contested` material
  as ordinary active context.
- [ ] **DX12.** Dixie does not treat a model-generated summary
  of an estate / pack as canonical truth. The canonical truth
  is the JSON; the summary is provenance.

### Conformance

- [ ] **DX13.** All ten fixtures in
  [`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  ship in Dixie's test inputs (verbatim, or imported as a
  fixture package).
- [ ] **DX14.** For each fixture, Dixie's BFF surface
  produces a render that matches the fixture's
  `expected_allowed`, `expected_output`, and `reason`. Class
  shape comes from Hounfour; runtime decisions come from Finn /
  the wedge; the *render* is Dixie's.
- [ ] **DX15.** Receipts retrieved through Dixie validate
  against the wedge's `RecallReceipt` shape (and against
  Hounfour's `straylight.recall_receipt.v0` once Hounfour
  ships).
- [ ] **DX16.** Audit chain lookups returned through Dixie
  validate against the wedge's `AuditEvent` shape (and against
  Hounfour's `straylight.audit_event.v0` once Hounfour ships)
  and replay under `AuditLog.verifyChain` (or its production
  successor).

## Validation commands

The handoff is reproducible from `loa-straylight` today. PR-A
should be able to consume the artifacts these commands produce:

```bash
# Type-check the wedge.
npm run typecheck

# Run all wedge tests (Phase 0–12 inclusive).
npm test

# Run the recall demo (sanity check the wedge still works).
npm run demo:recall

# Run the recall demo and dump JSON output for inspection.
npm run demo:recall:json

# Re-emit Phase 6 schema-candidate fixtures.
npm run schema:candidates

# Re-emit Phase 8 Hounfour conformance vectors.
npm run hounfour:conformance

# Print the Phase 9 Hounfour handoff packet summary.
npm run hounfour:handoff

# Re-emit Phase 10 Finn runtime-enforcement fixtures.
npm run finn:enforcement

# Re-emit Phase 12 Dixie governed-recall fixtures.
npm run dixie:recall
```

`fixtures/dixie-governed-recall/` holds the ten current-shape
examples PR-A should adopt as test inputs. The directory is
deterministic; running the helper twice produces byte-identical
files.

The fixtures cover:

- `recall-request-public-discord.json`
- `recall-response-with-receipt.json`
- `denied-private-assertion-public-context.json`
- `denied-cross-tenant-recall.json`
- `revoked-assertion-excluded.json`
- `forgotten-assertion-excluded-but-auditable.json`
- `contested-assertion-marked.json`
- `provenance-inspection-response.json`
- `audit-chain-lookup-response.json`
- `estate-summary-response.json`

## Risks and open questions

These are the things PR-A's author should think about before
starting. None of them block filing this issue.

- **Hounfour adoption ordering.** Phase 9's Hounfour PR-A is a
  prerequisite for Phase 12's Dixie PR-A in spirit, not in
  letter. Dixie can begin by importing the wedge's `types.ts`
  directly and swap to Hounfour once the schema PR ships.
- **Finn adoption ordering.** Phase 10's Finn PR-A is a
  prerequisite for Phase 12's Dixie PR-A in spirit, not in
  letter. Dixie can begin by calling the wedge's `executeRecall`
  directly (in a single-process deployment) and swap to Finn's
  runtime gate once the runtime PR ships. The two PRs are
  independent in time but should not contradict each other in
  decision shape.
- **Tenant boundary model.** Cross-tenant recall prevention is
  a Dixie-layer responsibility. The exact shape of the tenant
  boundary (Dixie-native session model? per-actor allow-list?
  controller-key-derived boundary?) is a Dixie deployment
  decision; the wedge / Finn provide the second line of defense.
- **Review-queue persistence.** `needs_review` decisions need
  to live somewhere durable. Options: a Dixie-native review
  queue table, or a Finn-side review queue surface that Dixie
  presents. Either choice is acceptable; the *load-bearing*
  property is "do not auto-promote `needs_review` to
  `allow`."
- **Receipt cache invalidation.** Receipts are immutable once
  emitted. Dixie MAY cache them aggressively. Cache
  invalidation is therefore not a problem; the *correctness*
  problem is making sure a cached receipt's `pack_hash` still
  matches the served pack.
- **Privacy-scope rendering.** The wedge's
  `privacyDispositionForFrame` is the source of truth for
  what each frame is allowed to see. Dixie's renderer MUST
  not derive its own privacy decisions; it consumes the
  wedge / Finn output and renders accordingly.
- **Operator UI vs developer API.** Dixie may expose multiple
  surfaces (web UI, JSON API, CLI). The fixtures here are
  *response-shape* fixtures, not *UI-pixel* fixtures. The
  rendering layer (HTML / Markdown / JSON) is a Dixie-side
  call; the *response shape* is the load-bearing contract.
- **No PRD / SDD / sprint planning artifact** is requested by
  this handoff. Dixie's process for adopting these primitives
  is Dixie's choice.

## Cross-references

- [`docs/handoffs/dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  — companion boundary doc (what Dixie owns vs what it must
  not own).
- [`docs/handoffs/dixie-recall-mapping.md`](./dixie-recall-mapping.md)
  — mapping table from Straylight primitives / operations to
  proposed Dixie BFF / API / service surfaces.
- [`docs/handoffs/finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md)
  — Phase 10 Finn issue handoff (runtime lane).
- [`docs/handoffs/finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  — Phase 10 Finn boundary doc.
- [`docs/handoffs/finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
  — Phase 10 Finn mapping (runtime lane).
- [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — Phase 9 Hounfour issue handoff (class lane).
- [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  — Phase 9 Hounfour PR checklist (class lane).
- [`docs/handoffs/hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
  — Phase 9 Hounfour mapping (class lane).
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.4, §22.5 — architectural recommendations for the Dixie
  BFF / inspection module.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  wedge's fail-closed defenses, which Dixie's BFF MUST
  preserve.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant. Dixie surfaces the
  policy-lane output; it does not collapse the boundary.
- [`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  — ten current-shape JSON examples (Dixie PR-A test inputs).
