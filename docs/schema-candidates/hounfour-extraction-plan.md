# Hounfour extraction plan — engineering handoff

> Status: Phase 7. **Pre-extraction handoff, in-repo only.** This
> document defines exactly what should eventually move from
> `loa-straylight` schema candidates into `loa-hounfour`, what must
> stay in `loa-straylight` permanently, and what conformance tests
> Hounfour must satisfy before `loa-straylight` will consume it.
>
> **This document does not perform the extraction.** It does not
> add a Hounfour dependency, does not import from any sibling repo,
> does not edit `loa-hounfour` (or any sibling), and does not change
> Phase 0–6 runtime behavior. It is the spec for a *future* PR pair
> (one against `loa-hounfour`, one against `loa-straylight`) that
> together complete the schema move.

## How this document relates to Phase 6

Phase 6 produced two pinning documents and a fixture set:

- [`hounfour-schema-extraction-prep.md`](./hounfour-schema-extraction-prep.md) — the
  per-candidate inventory, with current source files, purpose,
  stability, and kind.
- [`class-vs-policy-boundary.md`](./class-vs-policy-boundary.md) — the
  written contract pinning the class lane (Hounfour-bound) against
  the policy lane (Straylight-only).
- [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/) —
  representative current-shape JSON examples per candidate.

Phase 7 (this document) consumes those three artifacts and turns
them into an ordered handoff: a binary classification per candidate,
the conformance bar Hounfour must clear, and the future-PR sequence.
Nothing here contradicts Phase 6; it commits the Phase 6 inventory to
a specific extraction shape.

## Hard scope: what Phase 7 is and is not

**Phase 7 is** a single in-repo document that pins:

1. For every Phase 6 candidate, a binary classification of its
   *structural shape* — `move_to_hounfour` or `stay_in_straylight` —
   plus an explicit list of which related runtime behavior stays in
   `loa-straylight`.
2. The conformance bar `loa-hounfour` must satisfy before
   `loa-straylight` will replace its locally-owned shapes with
   re-exports from `@loa/hounfour` (or equivalent).
3. The future-PR sequence that completes the move.

**Phase 7 is not:**

- not a cross-repo change. No edit lands in `loa-hounfour`,
  `loa-finn`, `loa-dixie`, `loa-freeside`, `loa-eval`, or any other
  sibling.
- not a dependency change. `package.json` does not gain `@loa/hounfour`
  or any sibling-repo entry. The wedge stays in-process and
  deterministic.
- not a runtime change. `src/straylight/` is untouched; existing
  tests (`npm test`) continue to pass with the same semantics.
- not a schema-generation pipeline. Phase 7 does not introduce
  TypeBox, Zod, JSON Schema generators, or any cross-repo build
  step. The helper at
  [`scripts/export-schema-candidates.ts`](../../scripts/export-schema-candidates.ts)
  remains the only fixture emitter and is still local-only.
- not a PRD, SDD, sprint plan, or Loa workflow artifact. The Loa
  framework is the orchestrator for *how* engineering work gets done
  here; this document is the *content* of one specific future change.
- not a license to begin Hounfour integration ahead of the work.
  Until Hounfour ships the conformance bar in §5, the wedge owns
  every shape listed below.

## 1. Classification rules

Every Phase 6 candidate is classified as exactly one of:

| Classification | Meaning |
|---|---|
| `move_to_hounfour` | The **structural shape** of the type (TypeScript interface, enum members, optional/required field discipline) becomes Hounfour-owned after extraction. The wedge re-imports it and removes its local copy. |
| `stay_in_straylight` | The **structural shape** stays locally-owned in `loa-straylight` permanently. Hounfour does not get a copy. |

A type whose data-shape moves but whose runtime behavior is wedge-only
is still classified `move_to_hounfour`. The runtime behavior
(verifiers, evaluators, transition logic, policy producers, audit
chain, recall executor) is captured under each entry's
**Stays in `loa-straylight`** subsection. There is no third bucket;
the binary classification is on the *type*, not the *module*.

The class-vs-policy boundary (`class-validation` lanes vs
`policy-validation` lanes) is the load-bearing axis. Every type that
answers *"is this object structurally legible?"* moves; every type
that answers *"is this actor authorized **now**?"* either stays or has
its production seam stay.

## 2. Per-candidate classification

The list below is exhaustive over Phase 6 candidates. Field-level
detail (purpose, stability, current source file) lives in
[`hounfour-schema-extraction-prep.md`](./hounfour-schema-extraction-prep.md);
this section commits each candidate to a classification.

### 2.1 Identity

#### Actor

- **Classification:** `move_to_hounfour`
- **What moves:** `Actor` interface; `ActorType` enum (5 members);
  `ActorStatus` enum (5 members); the optional `provenance_ref`
  field discipline.
- **Stays in `loa-straylight`:** nothing. The wedge re-imports the
  type after extraction.

#### ActorEstate

- **Classification:** `move_to_hounfour`
- **What moves:** `ActorEstate` interface; `EstateStatus` enum
  (5 members); the optional `state_root` and `public_anchor_refs`
  field discipline.
- **Stays in `loa-straylight`:** the storage adapter behavior over
  `ActorEstate` rows (`InMemoryStorage`, `JsonlStorage`,
  `loadBundle`, `saveBundle`, the `StorageAdapter` interface and
  its conformance test).

### 2.2 Assertions

#### Assertion

- **Classification:** `move_to_hounfour`
- **What moves:** `Assertion` interface (every field, including
  `body_hash`, `provenance[]`, `signatures[]`, the optional
  `subject_refs` / `linked_assertion_refs` / `supersedes_refs` /
  `challenged_by_refs` / `revoked_by_ref` / `confidence` /
  `risk_level` / `privacy_scope` / `recall_scope`); plus
  `CandidateAssertion` (the pre-admission shape).
- **Stays in `loa-straylight`:** the *authority* of an assertion.
  `EstateStore.admit` / `.challenge` / `.revoke` / `.forget` and the
  status mutations they produce remain wedge-owned. Hounfour
  describes the shape; only the wedge can move an assertion through
  its lifecycle.

#### AssertionClass

- **Classification:** `move_to_hounfour`
- **What moves:** the `AssertionClass` enum (16 members) and the
  membership constant `ASSERTION_CLASSES` in
  `validators/class-validator.ts`.
- **Stays in `loa-straylight`:** per-class admission rules in the
  default keyring (`rule:admit-identity-reviewer-only`,
  `rule:admit-permission-reviewer-only`,
  `rule:admit-claim-operator`, etc.) and the
  `needsReviewForModelOutput` lift in `policy.ts`.

#### AssertionStatus

- **Classification:** `move_to_hounfour`
- **What moves:** the `AssertionStatus` enum (8 members) and the
  membership constant.
- **Stays in `loa-straylight`:** the **transition matrix** — which
  status flips are reachable from which prior status, and through
  which transitions. This is enforced by `EstateStore` and is not a
  schema concern. Hounfour never mutates a status.

#### PrivacyScope

- **Classification:** `move_to_hounfour`
- **What moves:** the `PrivacyScope` enum (4 members).
- **Stays in `loa-straylight`:** the per-frame disposition logic
  (`privacyDispositionForFrame`) and frame-specific exclusion rules
  in `recall.ts` / `policy.ts`.

#### RiskLevel

- **Classification:** `move_to_hounfour`
- **What moves:** the `RiskLevel` enum (4 members).
- **Stays in `loa-straylight`:** the high/critical-risk lifts
  (`provenance_insufficient_for_high_risk`, public-frame
  `needs_review` for high-risk recalls).

#### ProvenanceRef + ProvenanceSourceType

- **Classification:** `move_to_hounfour`
- **What moves:** `ProvenanceRef` interface; `ProvenanceSourceType`
  enum (11 members); the membership constant
  `PROVENANCE_SOURCE_TYPES`.
- **Stays in `loa-straylight`:** nothing. Provenance is pure shape.

### 2.3 Signatures

#### SignatureEnvelope + SignerType + SignatureType

- **Classification:** `move_to_hounfour`
- **What moves:** `SignatureEnvelope` interface; `SignerType` enum
  (8 members); `SignatureType` enum (4 members, including
  `dev_signature`).
- **Stays in `loa-straylight`:** *every* verifier and signer.
  `devSign`, `devSignatureFor`, `verifyDevSignature`,
  `verifyEnvelopeSelfConsistency`, `assertionSignedPayload`,
  `recallSignedPayload`, `DEV_SIGNATURE_PREFIX`, and the
  HMAC-SHA256 dev implementation. Hounfour ships shape-only.
  **`dev_signature` remains development-only**; production
  signature material (ed25519 / secp256k1 / real HMAC over real
  key material) is reserved future work in `loa-straylight`, not
  Hounfour.

### 2.4 Keyring

#### Keyring + SignerEntry + SignerStatus + SignerCompetenceRule

- **Classification:** `move_to_hounfour`
- **What moves:** `Keyring`, `SignerEntry`, `SignerCompetenceRule`
  interfaces; `SignerStatus` enum (3 members).
- **Stays in `loa-straylight`:** the *evaluator*. `evaluateCompetence`,
  `resolveSigner`, `isSignerCurrentlyValid`, `listActiveSignerRoles`,
  the rule-matching specificity heuristic
  (`findCompetenceRule`), and quorum / timelock / human-review
  resolution. Hounfour MUST NOT ship any of these.

### 2.5 Validation results

#### ValidationError + ClassValidationResult

- **Classification:** `move_to_hounfour`
- **What moves:** the result-shape interfaces and the
  `ValidationError.code` enum.
- **Stays in `loa-straylight`:** the *validators that produce them*
  (`validateCandidateAssertion`, `validateRecallRequest`, the
  per-class checks in `classSpecificChecks`). Hounfour may ship
  reference validators alongside its schemas, but the wedge calls
  its own. The two must agree on result shape.

### 2.6 Policy

#### PolicyDecision + PolicyDecisionOutcome + SignerCompetenceResult

- **Classification:** `move_to_hounfour` (type only)
- **What moves:** `PolicyDecision` and `SignerCompetenceResult`
  interfaces; `PolicyDecisionOutcome` enum (5 members:
  `allow` / `deny` / `needs_review` / `allow_with_redaction` /
  `allow_marked_only`).
- **Stays in `loa-straylight`:** **all production** of policy
  decisions. `policyForAdmitAssertion`, `policyForTransition`,
  `policyForRecallRequest`, `dispositionFor`, the `safeRun`
  fail-closed wrapper, `PolicyEngineError`, `DEFAULT_POLICY_ID`,
  `DEFAULT_POLICY_VERSION`. **Hounfour MUST NOT produce a
  `PolicyDecision`.** Hounfour hosts the type so cross-repo readers
  can deserialize a wedge-produced decision; the engine that *makes*
  decisions never leaves `loa-straylight`. (See [`class-vs-policy-boundary.md`](./class-vs-policy-boundary.md) §
  *What this means for Hounfour extraction*.)

### 2.7 Estate transitions

#### EstateTransition

- **Classification:** `move_to_hounfour`
- **What moves:** the `EstateTransition` interface and the
  `transition_type` enum (14 members).
- **Stays in `loa-straylight`:** authoring (`buildTransition`),
  append-only semantics, the `EstateStore` façade, and the
  per-transition tests in
  [`tests/transition-receipts.test.ts`](../../tests/transition-receipts.test.ts).

#### TransitionReceipt + TransitionReceiptKind

- **Classification:** `move_to_hounfour`
- **What moves:** the `TransitionReceipt` interface and the
  `TransitionReceiptKind` enum (5 members).
- **Stays in `loa-straylight`:** receipt persistence
  (`persistReceipt`), the receipt-vs-audit-event distinction, and
  receipt-emitting transitions.

### 2.8 Challenges and revocations

#### Challenge + ChallengeType + ChallengeRequestedEffect

- **Classification:** `move_to_hounfour`
- **What moves:** the `Challenge` interface and both enums
  (9 `ChallengeType` members; 6 `ChallengeRequestedEffect` members).
- **Stays in `loa-straylight`:** the effect-application logic on the
  target assertion (`status` mutation, `challenged_by_refs`
  linking) inside `EstateStore.challenge`.

#### Revocation

- **Classification:** `move_to_hounfour`
- **What moves:** the `Revocation` interface (full).
- **Stays in `loa-straylight`:** the status-flip + `revoked_by_ref`
  linking inside `EstateStore.revoke`.

#### ForgetRecord

- **Classification:** `move_to_hounfour`
- **What moves:** the `ForgetRecord` interface (full). Parallels
  `Revocation`; included here as an explicit Phase 7 row even
  though Phase 6 grouped it under `Challenge`.
- **Stays in `loa-straylight`:** `EstateStore.forget`, the
  recall-side exclusion of `forgotten_from_recall` outside
  `audit_review`, and the `mark_as_contested`-style use-instruction
  tagging.

### 2.9 Recall

#### RecallRequest + EnvironmentFrame + ReceiptDetailLevel

- **Classification:** `move_to_hounfour`
- **What moves:** the `RecallRequest` interface;
  `EnvironmentFrame` enum (7 members); `ReceiptDetailLevel` enum
  (3 members: `minimal` / `standard` / `debug`).
- **Stays in `loa-straylight`:** every step of recall execution.
  `executeRecall`, `dispositionFor`, `privacyDispositionForFrame`,
  the per-frame `needs_review` lifts, the contested-marking
  guarantee, the `provenance_insufficient_for_high_risk` lift,
  pack-assembly order (§11.6: prefilter → retrieval → postfilter →
  assembly), and the `redactReceipt` detail-level redactor.

#### RecallItem + RecallUseInstruction + RedactionSummary + ExclusionSummary

- **Classification:** `move_to_hounfour`
- **What moves:** the `RecallItem` interface; the
  `RecallUseInstruction` enum (4 members); the `RedactionSummary`
  and `ExclusionSummary` interfaces.
- **Stays in `loa-straylight`:** `useInstructionForMark`,
  `summaryFor`, and per-item assembly inside the recall executor.

#### RecallPack

- **Classification:** `move_to_hounfour`
- **What moves:** the `RecallPack` interface (full), including the
  content-addressed `pack_hash`.
- **Stays in `loa-straylight`:** pack assembly, hashing, and the
  ordering guarantee.

#### RecallReceipt

- **Classification:** `move_to_hounfour`
- **What moves:** the `RecallReceipt` interface (full), including
  the `detail_level` discipline.
- **Stays in `loa-straylight`:** receipt construction, the
  `minimal` / `standard` / `debug` redaction matrix, and the
  receipt's relationship to the `commitment_ref` seam (which is
  itself wedge-owned — see §2.11).

### 2.10 Audit chain

#### AuditEvent + AuditEventType

- **Classification:** `move_to_hounfour`
- **What moves:** the `AuditEvent` interface and the
  `AuditEventType` enum (17 members).
- **Stays in `loa-straylight`:** **all** chained-hash semantics.
  `AuditLog.append`, `AuditLog.getAuditTail`, `AuditLog.verifyChain`,
  the `previous_audit_hash` → `audit_hash` chain construction, and
  the chain-verification tests. **Hounfour cannot produce, rewrite,
  or re-anchor audit events.**

### 2.11 Commitment

#### CommitmentRoot

- **Classification:** `move_to_hounfour`
- **What moves:** the `CommitmentRoot` interface and the
  `commitment_type` enum (4 members:
  `estate_checkpoint` / `recall_receipt` / `transition_bundle` /
  `revocation_checkpoint`).
- **Stays in `loa-straylight`:** `computeCommitmentRoot`,
  `commitmentForRecallReceipt`, the local hashing strategy, and the
  reserved-future seam for an onchain anchor adapter. **Onchain
  publishing is reserved future work and is explicitly NOT part of
  Phase 7.** Hounfour ships shape-only.

### 2.12 Primitives

#### ID + Hash + ISO8601

- **Classification:** `stay_in_straylight`
- **Why:** these are language-level type aliases over `string`. They
  are not schema artifacts; downstream consumers re-derive them
  trivially from JSON-Schema types (`string` with optional
  format/pattern). Promoting them to Hounfour adds noise without
  adding schema power.
- **Stays in `loa-straylight`:** all three aliases stay in
  `src/straylight/types.ts`. Hounfour schemas should use
  JSON-Schema's native `string` + `format: date-time` (for
  `ISO8601`) and `pattern: ^sha256:` (for `Hash`) and require
  no TypeScript-side alias.

### 2.13 Out-of-scope (Phase 7 and Phase 6 alike)

The following primitives are mentioned in
[architecture spec §6.2.2](../architecture/loa-straylight-product-system-architecture-spec.md)
but are **not** Phase 7 candidates because they have no runtime
presence in the wedge yet (matching Phase 6's out-of-scope list):

- `PublicAnchorRecord` — no public-anchor adapter exists.
- `FeedbackSignal` and `EvaluationResult` — present only as
  `AssertionClass` enum members and `ProvenanceSourceType` enum
  members; no dedicated artifact type.
- `Demotion` — handled today as a `Challenge` with
  `requested_effect: demote`; no standalone type.
- `SignedAssertion` — the wedge expresses this as `Assertion` with
  non-empty `signatures[]`; no separate type is needed.

When any of these grows a runtime presence in a later wedge phase,
this section gets revisited *before* the Hounfour extraction PR
ships.

## 3. Summary table

| Candidate | Classification | Critical "stays" |
|---|---|---|
| `Actor`, `ActorType`, `ActorStatus` | `move_to_hounfour` | — |
| `ActorEstate`, `EstateStatus` | `move_to_hounfour` | Storage adapters, conformance test |
| `Assertion`, `CandidateAssertion` | `move_to_hounfour` | `EstateStore` lifecycle and status mutations |
| `AssertionClass` (enum) | `move_to_hounfour` | Per-class admission rules in default keyring |
| `AssertionStatus` (enum) | `move_to_hounfour` | Transition matrix in `EstateStore` |
| `PrivacyScope` (enum) | `move_to_hounfour` | `privacyDispositionForFrame` |
| `RiskLevel` (enum) | `move_to_hounfour` | High/critical-risk lifts |
| `ProvenanceRef`, `ProvenanceSourceType` | `move_to_hounfour` | — |
| `SignatureEnvelope`, `SignerType`, `SignatureType` | `move_to_hounfour` | All verifiers; `dev_signature` impl |
| `Keyring`, `SignerEntry`, `SignerStatus`, `SignerCompetenceRule` | `move_to_hounfour` | `evaluateCompetence`, `resolveSigner`, rule-matching |
| `ValidationError`, `ClassValidationResult` | `move_to_hounfour` | `validateCandidateAssertion`, `validateRecallRequest` |
| `PolicyDecision`, `PolicyDecisionOutcome`, `SignerCompetenceResult` | `move_to_hounfour` (type only) | **All** policy production; Hounfour MUST NOT produce |
| `EstateTransition` | `move_to_hounfour` | `buildTransition`, append-only, `EstateStore` |
| `TransitionReceipt`, `TransitionReceiptKind` | `move_to_hounfour` | `persistReceipt`, receipt-vs-audit distinction |
| `Challenge`, `ChallengeType`, `ChallengeRequestedEffect` | `move_to_hounfour` | Effect application in `EstateStore.challenge` |
| `Revocation` | `move_to_hounfour` | Status flip + `revoked_by_ref` linking |
| `ForgetRecord` | `move_to_hounfour` | `EstateStore.forget`, recall-side exclusion |
| `RecallRequest`, `EnvironmentFrame`, `ReceiptDetailLevel` | `move_to_hounfour` | `executeRecall`, dispositions, per-frame lifts |
| `RecallItem`, `RecallUseInstruction`, `RedactionSummary`, `ExclusionSummary` | `move_to_hounfour` | Per-item assembly |
| `RecallPack` | `move_to_hounfour` | Pack assembly + `pack_hash` |
| `RecallReceipt` | `move_to_hounfour` | Detail-level redaction matrix |
| `AuditEvent`, `AuditEventType` | `move_to_hounfour` | **All** chained-hash semantics; `verifyChain` |
| `CommitmentRoot` | `move_to_hounfour` | `computeCommitmentRoot`; onchain seam |
| `ID`, `Hash`, `ISO8601` | `stay_in_straylight` | Trivially expressed as JSON-Schema strings; no schema power gained |

## 4. The class-vs-policy invariant under extraction

The class-vs-policy boundary pinned in
[`class-vs-policy-boundary.md`](./class-vs-policy-boundary.md) is
load-bearing under extraction. The four no-go conflations from that
document — *valid JSON ≠ authorized action*, *valid signature ≠ signer
competence*, *valid recall request ≠ allowed recall*, *valid assertion
≠ active truth* — must remain verifiable in the wedge after the
schema move. Concretely:

- After extraction, `validateCandidateAssertion(c)` and
  `validateRecallRequest(r)` still close over the candidate object
  only. They do not gain a `Keyring`, `now`, or estate-handle
  parameter. Hounfour's reference validators (if it ships any) MUST
  follow the same input discipline.
- `executeRecall` still calls class validation first, then policy,
  then candidate retrieval, then disposition, then assembly, then
  receipt — in that order — with no way for a class-valid request
  to bypass policy or disposition.
- `policy.ts` still short-circuits on
  `!input.class_validation.valid` and never re-checks structure.
- Hounfour-imported types appear only as type annotations and as
  schema-validation inputs. They never become runtime authority.

The Phase 6 conformance test
([`tests/schema-candidates.test.ts`](../../tests/schema-candidates.test.ts))
already pins the class-vs-policy separation at the fixture level
(assertion fixtures don't carry `policy_decision`; the
policy-decision fixture doesn't carry assertion fields; the recall
request carries no decision). The wedge's behavior tests
([`tests/class-vs-policy-validation.test.ts`](../../tests/class-vs-policy-validation.test.ts),
[`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts),
[`tests/policy-unavailable.test.ts`](../../tests/policy-unavailable.test.ts),
[`tests/signer-fail-closed.test.ts`](../../tests/signer-fail-closed.test.ts))
pin it at the runtime level. Both must continue to pass under
Hounfour-imported types unchanged.

## 5. Conformance bar — what Hounfour must satisfy

Until `loa-hounfour` satisfies **every** item below, `loa-straylight`
keeps its locally-owned shapes. The wedge does not adopt a partial
Hounfour. The conformance bar is split into structural,
behavioral-non-shipment, and consumability gates.

### 5.1 Structural gates

H1. **Shape identity.** For every type classified
    `move_to_hounfour` in §2, Hounfour ships a schema artifact whose
    field-name set, optional/required discipline, and field-type
    annotations are *identical* to the current TypeScript interface
    in `src/straylight/types.ts`. New optional fields are allowed
    (additive); new required fields are not.

H2. **Enum identity.** For every enum classified
    `move_to_hounfour`, every current member is present in
    Hounfour's enum. No member is renamed. Removing a member is a
    breaking change and disqualifies the build.

H3. **Schema id and version pinning.** Hounfour publishes stable
    schema ids prefixed `straylight.<type>.v0` (matching the wedge's
    existing `straylight.assertion.v0` /
    `straylight.recall_request.v0` ids in
    `validators/class-validator.ts`). The initial published version
    is `0.1.0` for shapes already at `0.1.0` in the wedge; otherwise
    it matches the current `schema_version` in
    `src/straylight/types.ts` for the relevant type.

H4. **Hash-format pin.** Wherever `Hash` appears (e.g. `body_hash`,
    `audit_hash`, `pack_hash`, `receipt_hash`, `root_hash`,
    `signed_payload_hash`), Hounfour's schema requires the prefix
    `sha256:` (`pattern: ^sha256:[0-9a-f]+$` or equivalent).

H5. **Timestamp-format pin.** Wherever `ISO8601` appears, Hounfour's
    schema enforces RFC 3339 / ISO-8601 (`format: date-time`).

H6. **No required `dev_signature`.** Nothing in Hounfour's schemas
    *requires* `signature_type === 'dev_signature'`. The enum
    member is present (it appears in fixtures); its presence is
    development-only and the schema should not constrain consumers
    to it.

### 5.2 Behavioral non-shipment gates

H7. **No runtime evaluators.** Hounfour MUST NOT export
    `evaluateCompetence`, `resolveSigner`, `isSignerCurrentlyValid`,
    `policyForAdmitAssertion`, `policyForTransition`,
    `policyForRecallRequest`, `dispositionFor`,
    `verifyEnvelopeSelfConsistency`, `verifyDevSignature`,
    `AuditLog.verifyChain`, `EstateStore`, `executeRecall`, or any
    semantic-equivalent symbol. A reference validator that produces
    a `ClassValidationResult` is allowed; everything else is
    out-of-scope.

H8. **No `PolicyDecision` production.** Hounfour MUST NOT contain
    code that *produces* a `PolicyDecision`. The type is exported
    so cross-repo readers can deserialize one; the engine that
    makes decisions stays in `loa-straylight` permanently. A
    Hounfour test that calls a policy producer fails the gate.

H9. **No audit-chain code.** Hounfour MUST NOT compute
    `previous_audit_hash` / `audit_hash`, append to an audit log,
    or verify an audit chain. The `AuditEvent` shape is exported;
    the chain is wedge-owned.

H10. **No transition application.** Hounfour MUST NOT apply
     `EstateTransition`s. The shape is exported; only the wedge's
     `EstateStore` mutates state.

H11. **No reverse imports.** Hounfour MUST NOT import from
     `@loa/straylight`, the `loa-straylight` repo, or any sibling
     repo that depends on the wedge. Schemas are upstream of
     behavior.

### 5.3 Consumability gates

H12. **Phase 6 fixtures validate.** Every JSON file currently in
     [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
     validates without modification against the corresponding
     Hounfour schema. The list is fixed at extraction time:
     `actor.json`, `estate.json`, `keyring.json`,
     `assertion-observation.json`,
     `assertion-reflection-contested.json`,
     `assertion-revoked.json`,
     `recall-request-public-discord.json`,
     `recall-pack-public-discord.json`,
     `recall-receipt-public-discord.json`,
     `audit-event-transition.json`,
     `policy-decision-denied.json`, `commitment-root.json`.

H13. **Wedge-emitted artifacts validate.** Running
     `npm run schema:candidates` (or its post-extraction successor)
     against current `EstateStore` / `executeRecall` /
     `computeCommitmentRoot` outputs and validating them against
     Hounfour returns no errors. This is the round-trip pin: if the
     wedge emits an artifact and Hounfour rejects it, the gate
     fails.

H14. **Conformance vector pack.** Hounfour ships at least the
     conformance vectors named in the architecture spec
     ([§17.4](../architecture/loa-straylight-product-system-architecture-spec.md)):
     valid observation admission; invalid missing provenance; valid
     reflection but not identity promotion; revoked assertion
     excluded from recall; private assertion excluded from public
     recall; contested assertion marked; unknown signer denied;
     signer valid but not competent denied. Each vector either
     reuses or extends the Phase 6 fixtures.

H15. **Determinism preserved.** The schema-candidates conformance
     test
     ([`tests/schema-candidates.test.ts`](../../tests/schema-candidates.test.ts))
     `buildCandidates() runs deterministically and returns every
     candidate type` continues to pass after the wedge's types are
     swapped for Hounfour re-exports. Content-addressed ids
     (`assertion_id`, `pack_hash`, `receipt_hash`, `root_hash`)
     remain stable across `buildCandidates()` invocations.

H16. **No new required fields on existing fixtures.** Adding a
     new required field to a Hounfour schema for a type that
     already has Phase 6 fixtures fails H12 / H13 by definition;
     the gate exists explicitly to forbid silent additions that
     break wedge data on import.

H17. **Wedge tests pass under re-export.** After
     `src/straylight/types.ts` is replaced (in the future
     `loa-straylight` PR) with `export * from '@loa/hounfour';`
     for the candidate types, every test currently green under
     `npm test` stays green. The full list:

- `tests/audit-and-receipt.test.ts`
- `tests/class-vs-policy-validation.test.ts`
- `tests/demo-flow.test.ts`
- `tests/forget-flow.test.ts`
- `tests/jsonl-durability.test.ts`
- `tests/phase-4-demo.test.ts`
- `tests/phase-5-hardening.test.ts`
- `tests/policy-unavailable.test.ts`
- `tests/quorum-and-timelock.test.ts`
- `tests/recall-contested-marking.test.ts`
- `tests/recall-exclusion.test.ts`
- `tests/schema-candidates.test.ts`
- `tests/signer-fail-closed.test.ts`
- `tests/storage-conformance.test.ts`
- `tests/transition-receipts.test.ts`

If any one of those fails, the conformance bar is not cleared and
the swap PR (§6 step 2) does not land.

## 6. Future-PR sequence

This is the sketch of work that lands the move *after* Phase 7 ships.
It is descriptive, not a sprint plan; the exact authoring path is up
to whoever does the work. Phase 7 itself does **not** start it.

**PR-A (against `loa-hounfour`):**

1. Add `src/straylight/` (or equivalent) namespace with one schema
   per `move_to_hounfour` candidate from §2.
2. Reproduce Phase 6 fixture set (or a deterministic regenerator).
3. Add the conformance-vector pack from H14.
4. Add the structural / non-shipment / consumability tests that
   pin H1–H16 against Hounfour itself.
5. Publish at version `0.x.0` (matches the wedge's "0.x" public
   surface as documented in
   [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)
   §Versioning). No v1 commitment yet.

**PR-B (against `loa-straylight`, after PR-A merges):**

1. Add `@loa/hounfour` (or equivalent) as a `dependencies` entry in
   `package.json`. Pin the version that satisfied H1–H16.
2. Replace local declarations in `src/straylight/types.ts` for
   `move_to_hounfour` candidates with `export * from
   '@loa/hounfour'` (or per-type `export type { Actor } from
   '@loa/hounfour';` etc.). Keep the `ID` / `Hash` / `ISO8601`
   aliases local (per §2.12).
3. Keep every wedge-side runtime symbol exactly where it is.
   `policy.ts`, `keyring.ts`, `recall.ts`, `audit.ts`, `estate.ts`,
   `commitment.ts`, `validators/class-validator.ts`,
   `signatures.ts`, and the storage adapters do not move.
4. Replace `fixtures/schema-candidates/` with a thin pointer to
   Hounfour's vectors *or* delete it if the conformance is fully
   delegated. Either way, the README transitions to a
   "post-extraction" status.
5. Update `docs/mvp/package-boundary.md` §6.2.2 / §"Future
   integration notes — loa-hounfour" / Phase 6 note to reflect
   the new source of truth.
6. Run `npm test` and `npm run demo:recall` to confirm H17.
7. Run `npm run schema:candidates` (or its successor) to confirm
   H13.

**PR-C (against `loa-straylight`, optional cleanup):**

- If H12 / H13 / H14 are wholly satisfied by Hounfour vectors,
  retire `scripts/export-schema-candidates.ts` and the local
  fixture set. The schema-candidates conformance test either
  reduces to a re-export check or moves to Hounfour entirely.
- This PR is reserved for *after* PR-B has been live long enough
  to confirm the wedge works against Hounfour without local
  fallback. It is not part of the extraction itself.

No PR in this sequence touches `loa-finn`, `loa-dixie`,
`loa-freeside`, `loa-eval`, `.loa/`, or `.claude/`. Those
integrations remain reserved future work as described in
[`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)
§"Future integration notes (reserved, NOT IMPLEMENTED)".

## 7. Stability and change discipline (between Phase 7 and PR-A)

While the wedge owns the shapes:

- **Additive enum changes** (new `AssertionClass`, new
  `EnvironmentFrame`, new `AuditEventType`, etc.) are fine. They
  must be reflected in
  [`hounfour-schema-extraction-prep.md`](./hounfour-schema-extraction-prep.md)
  in the same change.
- **New optional fields** on a `move_to_hounfour` interface are
  fine. New required fields require a wedge phase bump and an
  explicit row in this document's stability log (none today).
- **Removing or renaming** a field, an enum member, or a top-level
  type listed in §2 is a *breaking* change. Until extraction, it
  also requires updating the matching fixture in
  [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/).
- **`stay_in_straylight` aliases** (`ID`, `Hash`, `ISO8601`) are
  internal and may change at any commit without notice, with one
  caveat: the `Hash` string convention `sha256:<hex>` is pinned
  permanently (see H4) and may not change without a coordinated
  Hounfour update.

After PR-A ships, this section is rewritten in the same change as
PR-B: at that point, additive changes flow through Hounfour and the
wedge's role is to *consume* schema updates, not author them.

## 8. Cross-references

- [`README.md`](./README.md) — directory overview.
- [`hounfour-schema-extraction-prep.md`](./hounfour-schema-extraction-prep.md) — Phase 6
  per-candidate inventory.
- [`class-vs-policy-boundary.md`](./class-vs-policy-boundary.md) — the load-bearing
  invariant that Hounfour extraction must preserve.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  §"Future integration notes — loa-hounfour" describes the
  long-running integration intent that this Phase 7 plan refines.
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.2 — the architectural recommendation Phase 7 implements as
  an extraction handoff.
- [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/) —
  the current-shape JSON examples that PR-A must validate against.
- [`tests/schema-candidates.test.ts`](../../tests/schema-candidates.test.ts) — the
  in-repo conformance test that PR-B must keep green under
  Hounfour-imported types.
