# Finn runtime enforcement — issue handoff

> Status: Phase 10. **Pre-integration handoff packet, in
> `loa-straylight` only.** This file is written so it can be filed
> verbatim (or with minor edits) as a GitHub issue against
> [`0xHoneyJar/loa-finn`](https://github.com/0xHoneyJar/loa-finn) when
> that repo is ready to host the Straylight runtime-enforcement
> module called out in the architecture spec. **Filing the issue is
> not part of Phase 10.** Nothing in this handoff imports from
> `loa-finn`, edits any sibling repo, adds a Finn dependency, performs
> Finn integration, or changes Phase 0–9 runtime behavior. This is
> handoff prep, not Finn integration.

## Title

> Adopt Straylight Recall Wedge primitives as `loa-finn` runtime
> enforcement surface

## Summary

`loa-straylight` Phase 5 froze the Recall Wedge's public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)). Phase 6,
7, 8, and 9 staged the schema-extraction handoff that should move
Straylight's class-validation vocabulary to `loa-hounfour`. Phase 10
(this issue) stages the **runtime-enforcement** handoff that should
land in `loa-finn` *after* Hounfour ships a stable schema surface.

This issue requests that `loa-finn` eventually ships:

1. A runtime-enforcement module (`loa-finn/src/straylight/`) that
   consumes the wedge's public API and applies it as a *runtime gate*
   in front of Finn's tool / model / action surfaces.
2. Per-call admission, per-tool recall gating, per-transition policy
   evaluation, per-signer competence checks, and per-receipt audit
   emission, with **fail-closed semantics** when any layer is
   unavailable.
3. A neutral place to host the runtime contract that other Loa
   components (Dixie BFF, Freeside community surfaces, eval harness)
   can call without re-implementing Straylight semantics.
4. Finn-side conformance tests grounded by the local fixture pack at
   [`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/),
   adopted verbatim or imported as a fixture package once the wedge
   and Hounfour are pinned.

The companion boundary doc is at
[`docs/handoffs/finn-runtime-boundary.md`](./finn-runtime-boundary.md).
The mapping table from Straylight transitions to proposed Finn
enforcement points is at
[`docs/handoffs/finn-enforcement-mapping.md`](./finn-enforcement-mapping.md).

## Background

The Straylight Recall Wedge ships a thin control plane over a
governed actor estate. Today, every primitive the wedge produces
(`Assertion`, `Keyring`, `EstateTransition`, `Challenge`,
`Revocation`, `ForgetRecord`, `RecallRequest`, `RecallPack`,
`RecallReceipt`, `AuditEvent`, `CommitmentRoot`) is enforced
**inside the wedge** through `EstateStore`, `policyForX(...)`,
`evaluateCompetence`, `executeRecall`, and `AuditLog`. That works
for an in-process, single-actor MVP. It does not work for a
multi-actor production runtime where:

- model and tool calls must be gated *before* they execute, not
  after;
- recall requests must be served *with a receipt*, not as
  ungoverned context retrieval;
- transitions (admit / classify / link / challenge / demote /
  revoke / forget) must run through a single audited gate;
- the audit chain must persist across processes, not just within a
  single test run;
- receipts must reach external auditors and (eventually) onchain
  anchors without leaking hidden estate.

The architecture spec calls this out explicitly:

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.3 — "Add `loa-finn/src/straylight/` module for: policy
  evaluation execution; keyring/signer competence checks;
  transition enforcement; recall invocation and trace preservation;
  memory mutation as high-risk action; action gateway integration;
  audit receipt emission; model/tool/provider trace capture;
  optional commitment-root computation or handoff to commitment
  adapter."
- §6.2.3 — "Finn should fail closed when class validation or policy
  validation cannot be completed."
- §22.4 — Epic D ("Finn runtime enforcement") with task-level
  acceptance criteria.
- §23.2 — proposed `loa-finn/src/straylight/` directory layout.

Phase 10 (this issue) consumes those architectural decisions and
turns them into a Finn-shaped handoff. It does not start the work;
it specifies what the work needs to consume, fail-close on, and
emit when the work is done.

## Why this belongs in Finn

The runtime lane is downstream of behavior. Every Loa component
that wants to act on an assertion needs the same gate to decide
whether the action is admitted, denied, marked, or held for review.
Hounfour (the class lane) cannot make that decision because it
must remain runtime-free. Straylight (the wedge) cannot make it
across processes because it is in-process by design. Finn already
hosts the substrate that runtime enforcement needs:

1. **Action / tool / model gateway.** Finn's existing tool-call,
   model-routing, and gateway routes are the natural place to put
   the per-call admission and per-tool recall-gating hooks.
2. **WAL / audit / event-stream substrate.** Finn already runs an
   append-only event-stream; persisting Straylight's hash-chained
   `AuditEvent` records is a substrate match, not a green-field
   build.
3. **Auth / signer material.** Finn already holds JWT / HMAC /
   signer machinery; it is the natural host for production
   signature material that replaces the wedge's `dev_signature`
   HMAC.
4. **Budget / rate-limit / circuit-breaker primitives.** Finn
   already has the failure-mode primitives needed to make
   Straylight runtime enforcement *fail-closed* under load.

What Finn gets is the **runtime lane only**. The class-vs-policy
boundary in
[`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
remains load-bearing here: Hounfour ships shape, the wedge
produces decisions in-process, Finn enforces decisions across
processes.

## Explicit non-goals

Finn is **not** asked to ship any of the following. Each item maps
to a responsibility that stays in `loa-straylight` (or a sibling)
permanently:

- **No canonical schema semantics.** Finn MUST NOT define the
  canonical shape of any Straylight primitive. It MUST consume
  Hounfour-published schemas (or, until Hounfour ships, the wedge's
  re-exported `types.ts`) and MUST treat re-shape decisions as
  out-of-scope. The class lane lives in Hounfour, not Finn.
- **No model-output-as-authority.** Finn MUST NOT treat any model
  output as authority over estate state. A model response is
  provenance, not signing material. Even when Finn signs an
  observation derived from a model trace, the signed `provenance[]`
  carries `model_output` and the policy lane handles it as such
  (see `policy.ts.needsReviewForModelOutput`). Finn MUST NOT bypass
  this.
- **No "valid JSON is authorized transition" collapse.** Finn MUST
  NOT skip policy validation just because a candidate
  class-validates. Class validation answers structural legibility;
  policy validation answers authorization. Both run, in that order,
  for every transition (per §22.4.D2 / §6.3.1).
- **No keyring / signer-competence bypass.** Finn MUST NOT short-circuit
  `evaluateCompetence` for any transition. Even when Finn holds the
  signer's private material, the competence rule, quorum, timelock,
  and human-review checks all run before the transition is admitted
  (per §22.4.D1).
- **No recall without receipt.** Finn MUST NOT serve a recall
  response without emitting a `RecallReceipt`. The receipt is the
  audit artifact that ties the served pack to the request; serving
  context without a receipt would re-create the ungoverned-RAG
  failure mode the wedge exists to prevent.
- **No action / commitment transition without policy validation.**
  Finn MUST NOT execute action / commitment transitions on the
  basis of a memory or belief alone. The promotion chain
  (`memory → belief → instruction → plan → permission → action →
  commitment → permanence`, per `README.md`) is governed; each step
  requires its own competent signer.
- **No new schema authority.** Finn MUST NOT promote new
  `AssertionClass`, `AssertionStatus`, `EnvironmentFrame`,
  `TransitionType`, `AuditEventType`, or `CommitmentType` values
  unilaterally. Additions are a Hounfour change; Finn consumes the
  enum, it does not own it.
- **No reverse imports.** Finn MUST NOT publish a package that
  `loa-straylight`, `loa-hounfour`, `loa-dixie`, or any other
  Straylight consumer is expected to import. The runtime gate is
  *downstream*, not a peer dependency of the wedge.
- **No production signature material in the handoff packet.** The
  fixtures under
  [`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/)
  carry `dev_signature` envelopes for shape illustration only; Finn
  MUST replace `dev_signature` with real signature material
  (ed25519 / secp256k1 / production HMAC over real key material)
  before any runtime decision is treated as binding.
- **No Discord / Freeside / Dixie / Hounfour integration in the
  same change.** This issue is the Finn-side runtime gate; sibling
  integrations are separately tracked epics (per §22.5–§22.7).
- **No PRD / SDD / sprint planning artifact** is requested by this
  issue. Finn's process for adopting these primitives is Finn's
  choice.

## Runtime responsibilities Finn should eventually own

The runtime responsibilities below are derivable from the
architecture spec (§6.2.3, §22.4) and from the wedge's stable
public surface (`src/straylight/index.ts`). Each one carries a
**fail-closed condition**: if Finn cannot complete the
responsibility, the runtime denies — never admits, never serves a
recall, never emits a "best-effort" receipt.

### R1. Per-call admission gate

For every external event / operator input / runtime observation /
feedback signal that enters the runtime, Finn MUST:

1. Build a `CandidateAssertion` per the wedge's
   `validateCandidateAssertion` shape.
2. Run class validation; on failure, deny with the validator's
   `code` reason and emit a `transition_denied` audit event.
3. Run `policyForAdmitAssertion`; on `decision !== 'allow'`, deny
   and emit the audit event with the policy's `reasons[]`.
4. Run `evaluateCompetence` for every signer in the candidate's
   `signatures[]`; on any signer failing, deny.
5. On all gates clearing, persist the assertion and emit
   `assertion_admitted` to the audit log.

Fail-closed condition: any gate failure denies. Engine errors
become `deny` with `policy_engine_error:<code>` (the wedge's
`safeRun` discipline; Finn MUST preserve it).

### R2. Per-transition policy evaluation

For every transition the runtime applies (`admit_assertion`,
`classify_assertion`, `link_assertions`, `challenge_assertion`,
`demote_assertion`, `revoke_assertion`,
`forget_assertion_from_recall`, et al.), Finn MUST:

1. Run `policyForTransition` with the current keyring and `now`.
2. Treat the resulting `PolicyDecision` as binding —
   `allow_with_redaction` and `allow_marked_only` are not the same
   as `allow`, and `needs_review` MUST hold the transition until a
   human signer signs.
3. Persist the `TransitionReceipt` (per `EstateStore.persistReceipt`)
   alongside the audit event.

Fail-closed condition: missing rule → `deny` with
`policy_unavailable_for_transition`. Quorum or timelock unmet →
`needs_review`, never `allow`.

### R3. Per-signer competence check

For every signer Finn evaluates (assertion signer, transition
signer, recall caller), Finn MUST:

1. Resolve the signer through `resolveSigner(keyring, signer_id)`.
2. Verify the signer is currently valid via
   `isSignerCurrentlyValid(keyring, entry, now)`.
3. Verify the signer's role is in the matched competence rule's
   `required_signer_roles` and not in `forbid_signer_roles` via
   `evaluateCompetence`.
4. On any check failing, deny with the matching reason
   (`unknown_signer:<id>`, `signer_not_currently_valid`,
   `signer_role_forbidden:<role>`, `no_competence_rule_for_transition`).

Fail-closed condition: a signature whose envelope is
self-consistent (passes `verifyEnvelopeSelfConsistency`) is **not**
a competent signer. The competence check is independent of
signature verification; both must clear.

### R4. Recall request execution gate

For every recall request, Finn MUST:

1. Class-validate via `validateRecallRequest`.
2. Policy-evaluate via `policyForRecallRequest` with the request's
   `environment_frame` and `risk_profile`.
3. Run candidate retrieval *behind* the prefilter (vector / keyword
   / graph retrievers plug in below the prefilter, never above).
4. Apply `dispositionFor` per candidate; respect the
   `included` / `marked` / `redacted` discipline.
5. Assemble the `RecallPack` deterministically (the wedge's
   content-addressed `pack_hash` MUST reproduce).
6. Emit a `RecallReceipt` with the matching `pack_hash`,
   `receipt_hash`, and `detail_level`.

Fail-closed condition: any layer failure denies the recall and
emits a `recall_denied` audit event. A recall that produces a pack
without a receipt is a runtime bug.

### R5. Recall receipt emission

For every served recall, Finn MUST:

1. Compute the receipt deterministically from the pack content
   (`pack_hash`, `receipt_hash` content-addressed).
2. Apply the request's `include_receipt_detail`
   (`minimal` / `standard` / `debug`) **after** the pack is
   built (so callers cannot probe via detail differences — the
   wedge's discipline; Finn MUST preserve it).
3. Persist the receipt alongside the audit event.
4. Make the receipt retrievable by `receipt_id` for downstream
   inspection (operator console, eval harness, anchor adapter).

Fail-closed condition: a recall response without a persisted
receipt is treated as a denied recall, regardless of pack
correctness.

### R6. Audit chain persistence and verification

For every admitted transition / served recall / denied move, Finn
MUST:

1. Append an `AuditEvent` whose `audit_hash` covers the prior
   event's `audit_hash` per estate (the wedge's
   `AuditLog.append` discipline).
2. Persist the event durably (Postgres / WAL / equivalent — not
   in-process memory).
3. Provide a `verifyChain(estate_id)` surface that walks the chain
   and returns `{ ok, broken_at?, reason? }`.
4. Run `verifyChain` after every recovery, migration, and (per
   deployment policy) on a scheduled cadence.

Fail-closed condition: a broken chain blocks new transitions on
the affected estate until an operator reconciles. The wedge's
position is "make tampering visible"; Finn's position MUST be
"make tampering refuse new admissions until reconciled."

### R7. Commitment root generation

For every checkpointed estate / served high-stakes recall / signed
revocation batch (per deployment policy), Finn MAY (not MUST)
compute a `CommitmentRoot` via `computeCommitmentRoot` or
`commitmentForRecallReceipt` and:

1. Anchor the root in Finn's audit substrate.
2. Hand the root off to a commitment adapter (the eventual
   onchain seam is reserved future work in `loa-straylight`,
   per §6.2.3 and `package-boundary.md` §10).

Fail-closed condition: a commitment whose `root_hash` cannot be
recomputed from the canonical projection is not anchored. Real
signature material (not `dev_signature`) MUST back any commitment
that escapes Finn's process.

## Runtime responsibilities Finn should not own

The list below is the inverse of the responsibilities Finn does
own. Each one belongs to a sibling repo or to the wedge itself.
Repeating them here so the PR reviewer cannot accidentally promote
Finn into a class-lane or schema-lane authority.

- **Class validation vocabulary.** Owned by Hounfour
  (post-Phase 9). Until Hounfour ships, `loa-straylight` owns the
  TypeScript declarations. Finn consumes; Finn does not author.
- **Schema enum membership.** `AssertionClass`, `AssertionStatus`,
  `EnvironmentFrame`, `TransitionType`, `AuditEventType`,
  `CommitmentType`, `PrivacyScope`, `RiskLevel`,
  `ProvenanceSourceType`, `ChallengeType`,
  `ChallengeRequestedEffect`, `RecallUseInstruction`,
  `ReceiptDetailLevel`, `SignerType`, `SignatureType`,
  `SignerStatus`, `PolicyDecisionOutcome`,
  `TransitionReceiptKind`, `EstateStatus`, `ActorType`,
  `ActorStatus` — all owned by Hounfour after Phase 9. Finn does
  not extend these unilaterally.
- **Local wedge primitives** (`EstateStore`, `buildTransition`,
  `persistReceipt`, the `dispositionFor` matrix, the
  `summaryFor` / `useInstructionForMark` / `redactReceipt`
  helpers). Owned by `loa-straylight` permanently. Finn calls the
  wedge's public API (or its successor); Finn does not duplicate
  the matrix.
- **Storage adapter implementations.** `InMemoryStorage` and
  `JsonlStorage` are wedge-only fixtures. The Postgres / real-WAL
  adapter that production Finn will swap in MUST satisfy
  `tests/storage-conformance.test.ts`; the *implementation* is
  Finn / Dixie's responsibility, but the *interface* is wedge-owned.
- **Onchain anchor adapters.** Reserved future work in
  `loa-straylight`. Finn MAY hand a commitment root off to a
  separate adapter, but Finn MUST NOT host the chain client
  itself.
- **Operator-facing recall surface.** Owned by Dixie (per §6.2.4 /
  §22.5). Finn enforces; Dixie exposes.
- **Community / bot adapters.** Owned by Freeside (per §6.2.5 /
  §22.7). Finn enforces; Freeside maps platform events into
  candidate assertions.

## Proposed enforcement points

The points below map to Finn's existing runtime substrate. Each
one is the natural place to insert a Straylight gate; PR-A's
author may relocate them, but the *gate* must remain.

| Finn substrate | Enforcement point | Wedge primitive invoked |
|---|---|---|
| Action / tool / model gateway | Pre-call admission check | `validateCandidateAssertion` + `policyForAdmitAssertion` + `evaluateCompetence` |
| Action / tool / model gateway | Pre-tool recall gate | `validateRecallRequest` + `policyForRecallRequest` + `executeRecall` |
| Transition executor (post-extraction module) | Per-transition policy check | `policyForTransition` + `evaluateCompetence` |
| Transition executor | Receipt persistence | `persistReceipt` (via `EstateStore` adapter) |
| WAL / audit substrate | Audit-event append | `AuditLog.append` |
| WAL / audit substrate | Chain verification | `AuditLog.verifyChain` |
| Auth / signer material substrate | Signer resolution | `resolveSigner` + `isSignerCurrentlyValid` |
| Optional anchor adapter | Commitment-root computation | `computeCommitmentRoot` / `commitmentForRecallReceipt` |

## Proposed audit / receipt points

Finn's runtime gate emits two distinct kinds of audit artifact:
**transition receipts** (per applied transition) and **recall
receipts** (per served recall). Both feed the same hash-chained
audit log, but they are not interchangeable.

| Event | Type | Wedge primitive |
|---|---|---|
| Assertion admitted | `assertion_admitted` audit event + `admission` transition receipt | `EstateStore.admit` |
| Assertion classified / linked | `assertion_classified` / `assertions_linked` audit event + matching transition receipt | (via post-extraction transition module) |
| Assertion challenged | `assertion_challenged` audit event + `challenge` transition receipt | `EstateStore.challenge` |
| Assertion demoted | `assertion_demoted` audit event + matching transition receipt | (challenge with `requested_effect: demote`) |
| Assertion revoked | `assertion_revoked` audit event + `revocation` transition receipt | `EstateStore.revoke` |
| Assertion forgotten from recall | `assertion_forgotten` audit event + `forget` transition receipt | `EstateStore.forget` |
| Recall request denied | `recall_denied` audit event | `policyForRecallRequest` deny path |
| Recall served | `recall_served` audit event + `RecallReceipt` | `executeRecall` allow path |
| Transition denied | `transition_denied` audit event + `denied` transition receipt | (any policy deny path) |
| Audit chain verified | `audit_chain_verified` audit event | `AuditLog.verifyChain` |
| Audit chain broken | `audit_chain_broken` audit event (operator-visible) | `AuditLog.verifyChain` failure path |
| Commitment root generated | `commitment_generated` audit event + `CommitmentRoot` | `computeCommitmentRoot` |

## Proposed fail-closed behavior

Fail-closed is the load-bearing property of the runtime gate.
Every layer denies on uncertainty; no layer admits on uncertainty.

1. **Class validation unavailable** → `deny`, reason
   `class_validation_unavailable`. (The wedge's class validator
   is pure; if the schema source is unreachable in Finn — e.g.
   Hounfour package not installed — Finn denies rather than
   guessing.)
2. **Policy unavailable** → `deny`, reason
   `policy_unavailable_for_transition`. (Per `policy.ts`: missing
   rule → deny. Finn MUST NOT default to allow.)
3. **Keyring unavailable / signer unknown** → `deny`, reason
   `unknown_signer:<id>` or `signer_not_currently_valid`.
4. **Signer competent but quorum / timelock / human-review
   unmet** → `needs_review`, never `allow`. The transition holds
   until the missing condition is met.
5. **Audit chain broken** → block new transitions on the affected
   estate until operator reconciles. (Per R6.)
6. **Engine error inside policy / recall / transition module** →
   `deny`, reason `policy_engine_error:<code>`. Preserve the
   wedge's `safeRun` discipline.
7. **Recall pack assembled but receipt cannot be persisted** →
   treat the recall as denied. Roll back the pack (or, equivalently,
   refuse to return it).
8. **Commitment root cannot be reproduced from canonical
   projection** → do not anchor. Emit
   `commitment_generation_failed` and hold for operator review.

## Proposed tests

Finn's runtime-enforcement module MUST ship a conformance test
pack that covers every responsibility above. The fixtures at
[`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/)
are *current-shape examples* that PR-A can adopt or import as
inputs. They are **not** the official Finn fixtures yet; they are
the deterministic local prep the wedge ships so PR-A does not
start from scratch.

The minimum test list:

1. **Allowed transition.** A candidate observation signed by a
   competent runtime is admitted; the audit event and transition
   receipt match the fixture.
2. **Denied transition — unknown signer.** A candidate signed by
   an unknown signer is denied; the reason is
   `unknown_signer:<id>`.
3. **Denied transition — incompetent signer.** A candidate signed
   by a known but role-incompetent signer (e.g. runtime trying to
   admit `identity`) is denied; the reason is
   `signer_role_forbidden:<role>` and the matched rule id is
   surfaced.
4. **Denied recall — private to public.** A recall in
   `public_discord` frame must exclude `actor_private` /
   `sealed` material; the fixture pins both the exclusion summary
   and the absence of leakage in `included[]`.
5. **Denied recall — revoked assertion.** A recall in
   `public_discord` frame must exclude `revoked` material;
   `audit_review` may surface it as `marked`, never `included`,
   never `usable`.
6. **Allowed recall — contested marked.** A recall in
   `public_discord` frame includes a `contested` assertion only as
   `marked` (use_instruction `mark_as_contested`), never as
   `usable`. The fixture pins the `marked[]` shape.
7. **Audit receipt required.** A served recall without a persisted
   receipt is a runtime bug; the fixture pins the
   receipt's `pack_hash` / `receipt_hash` / `detail_level`.
8. **Audit chain tamper detected.** Mutating an `audit_hash` in
   storage MUST cause `verifyChain` to return
   `{ ok: false, broken_at, reason: 'previous_audit_hash_mismatch' }`.
   The fixture pins the broken-at index and the reason string.
9. **Commitment root reproducibility.** A `CommitmentRoot` whose
   inputs reproduce produces the same `root_hash`; mutating any
   ref or summary changes the root.

The handoff fixtures cover all nine cases. Filenames listed in
[§Validation commands](#validation-commands).

## Acceptance criteria

PR-A is acceptable when **every** item below is satisfied. Until
all are satisfied, `loa-straylight` keeps its locally-owned
runtime semantics and does not delegate to a partial Finn
implementation.

### Structural

- [ ] **F1.** `loa-finn/src/straylight/` exists with the
  subdirectory layout proposed in
  [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §23.2 (`policy/`, `transitions/`, `recall/`, `audit/`,
  `storage/`).
- [ ] **F2.** Finn imports the wedge's public surface (or its
  Hounfour-extracted successor) only through the documented
  package entrypoint. No deep imports.
- [ ] **F3.** Finn's package depends on Hounfour for class-shape
  types where they exist; otherwise on `@loa/straylight` for
  everything not yet extracted. No reverse import: the wedge does
  not depend on Finn.
- [ ] **F4.** Finn's runtime gate runs class validation → policy
  validation → competence check → transition apply / recall
  execute → receipt → audit, in that order, for every governed
  call.
- [ ] **F5.** Production signer material (ed25519 / secp256k1 /
  HMAC over real key material) replaces `dev_signature`. The
  wedge's `dev_signature` envelope shape is consumed for
  deserialization; Finn's *production* envelopes use real keys.

### Behavioral non-shipment

- [ ] **F6.** Finn does not host canonical class schemas. Any
  schema-shape change goes through Hounfour (post-Phase 9).
- [ ] **F7.** Finn does not treat model output as authority.
  Model output is `provenance.source: 'model_output'`; the
  policy lane handles it.
- [ ] **F8.** Finn does not bypass `evaluateCompetence`. Every
  transition runs the competence check.
- [ ] **F9.** Finn does not serve recalls without receipts.
- [ ] **F10.** Finn does not promote action / commitment
  transitions on the basis of memory or belief alone.
- [ ] **F11.** Finn's runtime errors deny, never admit. The
  `policy_engine_error:<code>` discipline is preserved.

### Conformance

- [ ] **F12.** All nine fixtures in
  [`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/)
  ship in Finn's test inputs (verbatim, or imported as a fixture
  package).
- [ ] **F13.** For each fixture, Finn's runtime gate produces a
  decision that matches the fixture's `expected_allowed`,
  `expected_output`, and `reason`. Class shape comes from
  Hounfour; the *decision* is Finn's.
- [ ] **F14.** Audit chain verification is reproducible across
  process restarts. The hash chain Finn writes MUST replay under
  `AuditLog.verifyChain` (or its production successor).
- [ ] **F15.** Receipts produced by Finn validate against the
  wedge's `RecallReceipt` shape (and against Hounfour's
  `straylight.recall_receipt.v0` once Hounfour ships).

## Validation commands

The handoff is reproducible from `loa-straylight` today. PR-A
should be able to consume the artifacts these commands produce:

```bash
# Type-check the wedge.
npm run typecheck

# Run all wedge tests (Phase 0–10 inclusive).
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
```

`fixtures/finn-runtime-enforcement/` holds the nine current-shape
examples PR-A should adopt as test inputs. The directory is
deterministic; running the helper twice produces byte-identical
files.

The fixtures cover:

- `allowed-transition.json`
- `denied-transition-unknown-signer.json`
- `denied-transition-incompetent-signer.json`
- `denied-recall-private-to-public.json`
- `denied-recall-revoked-assertion.json`
- `allowed-recall-contested-marked.json`
- `audit-receipt-required.json`
- `audit-chain-tamper-detected.json`
- `commitment-root-changed.json`

## Risks and open questions

These are the things PR-A's author should think about before
starting. None of them block filing this issue.

- **Hounfour adoption ordering.** Phase 9's Hounfour PR-A is a
  prerequisite for Phase 10's Finn PR-A in spirit, not in letter.
  Finn can begin by importing the wedge's `types.ts` directly and
  swap to Hounfour once the schema PR ships. The two PRs are
  independent in time but should not contradict each other in
  shape.
- **Production signature material.** `dev_signature` is HMAC
  keyed by `key_ref`; it is **not** a production primitive.
  Finn's first move is to wire a real signer (ed25519 in the
  default case; HSM-backed for high-stakes). Until that lands,
  Finn's runtime gate is a pre-production gate.
- **Storage adapter choice.** The wedge's
  `tests/storage-conformance.test.ts` is the contract; Finn's
  Postgres / WAL adapter is the implementation. Choosing
  Postgres vs an existing Finn-native event-stream is a Finn-side
  call.
- **Audit chain partitioning.** The wedge chains per estate. A
  multi-actor production runtime needs many estates; the chain is
  per estate, not global. PR-A author should pin the partitioning
  decision early (per-estate is recommended; cross-estate global
  chain would re-create the cross-tenant leakage threat T6).
- **Commitment cadence.** Local commitment roots compute
  determinisitically. Anchoring cadence (per receipt? per
  checkpoint? operator-triggered?) is a deployment policy. The
  wedge does not pin it; Finn picks.
- **Failure-mode budgets.** Finn's circuit-breaker / rate-limit
  primitives are good; they MUST be wired so that "fail to verify
  signature" is a circuit-open event, not a quiet retry. The wedge
  is unopinionated about this; PR-A author picks.
- **Operator-facing surface.** Finn enforces; Dixie exposes.
  PR-A must coordinate the operator console seam with Dixie's
  Phase 22.5 epic. The fixtures here are runtime-test inputs;
  operator-UI fixtures are a separate concern.
- **No PRD / SDD / sprint planning artifact** is requested by
  this handoff. Finn's process for adopting these primitives is
  Finn's choice.

## Cross-references

- [`docs/handoffs/finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  — companion runtime-boundary doc (what Finn owns vs what it
  must not own).
- [`docs/handoffs/finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
  — mapping table from Straylight transitions / primitives to
  proposed Finn enforcement points.
- [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — Phase 9 Hounfour issue handoff (class lane).
- [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  — Phase 9 Hounfour PR checklist (class lane).
- [`docs/handoffs/hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
  — Phase 9 Hounfour mapping (class lane).
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.3, §22.4, §23.2 — architectural recommendations for the
  Finn runtime module.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  wedge's fail-closed defenses, which Finn's runtime gate MUST
  preserve.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant. Finn enforces the
  policy lane; it does not collapse the boundary.
- [`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/)
  — nine current-shape JSON examples (Finn PR-A test inputs).
