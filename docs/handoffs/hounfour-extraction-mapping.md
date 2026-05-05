# Hounfour extraction — mapping table

> Status: Phase 9. **Pre-extraction handoff packet, in `loa-straylight`
> only.** This table maps each Straylight primitive to its proposed
> `loa-hounfour` schema name, file path, classification, validation
> layer, and conformance fixture. **Filing this against
> `loa-hounfour` is not part of Phase 9.** Nothing in this mapping
> imports from `loa-hounfour`, edits any sibling repo, or changes
> Phase 0–8 runtime behavior.

## How to read this table

| Column | Meaning |
|---|---|
| **Straylight primitive** | The TypeScript declaration name in `src/straylight/types.ts` (or, for runtime symbols that stay, the function/class name in the appropriate module). |
| **Current Straylight source / fixture** | The file path where the declaration lives today, plus the JSON fixture(s) that exemplify its current shape. |
| **Proposed Hounfour schema name** | The `straylight.<type>.v0` id the PR-A schema should publish. `—` for primitives that stay in `loa-straylight`. |
| **Proposed Hounfour file path** | The recommended file path inside `loa-hounfour` (PR-A author may relocate; the id is what's load-bearing). `—` for primitives that stay. |
| **Classification** | One of: `move_to_hounfour`, `shared_contract`, `stay_in_straylight`, `runtime_only`, `fixture_only`. |
| **Validation layer** | One of: `class_validation`, `policy_validation`, `audit_validation`, `keyring_validation`, `none`. The layer the primitive belongs to in the four-lane class-vs-policy boundary. |
| **Conformance fixture** | The file in [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/) that pins this primitive's behavior, where applicable. `—` if no Phase 8 vector covers it directly. |
| **Notes** | Constraints, extraction-plan citations, and "stays in Straylight" runtime references. |

## Classification legend

| Classification | Meaning |
|---|---|
| `move_to_hounfour` | The structural shape becomes Hounfour-owned after extraction; the wedge re-imports it and removes its local copy. Per [`hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md) §1. |
| `shared_contract` | The *type* moves to Hounfour for cross-repo deserialization, but the *production* of values of this type stays in `loa-straylight`. The most important example is `PolicyDecision`: Hounfour hosts the type, the wedge alone produces decisions. |
| `stay_in_straylight` | The structural shape stays locally-owned in `loa-straylight` permanently. Hounfour does not get a copy. |
| `runtime_only` | Behavior, not shape. Stays in `loa-straylight` as a function / class / module. Listed here for completeness so reviewers can see what is intentionally **not** moving. |
| `fixture_only` | Lives in [`fixtures/`](../../fixtures/), not in [`src/`](../../src/). Used to ground tests and demos; not a TypeScript declaration to extract. |

## Validation layer legend

| Layer | Meaning |
|---|---|
| `class_validation` | Structural shape of an artifact entering or living in the estate. Hounfour-owned candidate after extraction. |
| `policy_validation` | Decision artifact produced by the policy engine. Wedge-owned production; Hounfour may host the *type*. |
| `audit_validation` | Append-only, hash-chained record. Wedge-owned chain semantics; Hounfour may host the *type*. |
| `keyring_validation` | Signer competence / quorum / timelock / human-review evaluation. Wedge-owned evaluator; Hounfour may host the *signer-side* shape but never the evaluator. |
| `none` | Type alias or runtime-only symbol with no validation lane. |

## Mapping

### Identity primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `Actor` | [`src/straylight/types.ts`](../../src/straylight/types.ts); [`fixtures/actor.json`](../../fixtures/actor.json), [`fixtures/schema-candidates/actor.json`](../../fixtures/schema-candidates/actor.json) | `straylight.actor.v0` | `src/schemas/actor.ts` | `move_to_hounfour` | `class_validation` | — | Full interface plus `ActorType` and `ActorStatus` enums move. Wedge re-imports. Per [`hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md) §2.1. |
| `ActorType` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.actor_type.v0` | `src/schemas/actor.ts` | `move_to_hounfour` | `class_validation` | — | 5-member enum (`agent` / `user` / `community` / `repo_assistant` / `demo_dnft`). Closed; additive only. Per §2.1, §5.1 H2. |
| `ActorStatus` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.actor_status.v0` | `src/schemas/actor.ts` | `move_to_hounfour` | `class_validation` | — | 5-member enum (`active` / `suspended` / `retired` / `demo` / `archived`). Closed; additive only. Per §2.1. |
| `ActorEstate` | [`src/straylight/types.ts`](../../src/straylight/types.ts); [`fixtures/estate.json`](../../fixtures/estate.json), [`fixtures/schema-candidates/estate.json`](../../fixtures/schema-candidates/estate.json) | `straylight.actor_estate.v0` | `src/schemas/actor_estate.ts` | `move_to_hounfour` | `class_validation` | — | Full interface plus `EstateStatus` enum. Storage adapters stay in wedge. Per §2.1. |
| `EstateStatus` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.estate_status.v0` | `src/schemas/actor_estate.ts` | `move_to_hounfour` | `class_validation` | — | 5-member enum. Closed; additive only. Per §2.1. |

### Assertion primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `Assertion` | [`src/straylight/types.ts`](../../src/straylight/types.ts); [`fixtures/schema-candidates/assertion-observation.json`](../../fixtures/schema-candidates/assertion-observation.json), [`fixtures/schema-candidates/assertion-reflection-contested.json`](../../fixtures/schema-candidates/assertion-reflection-contested.json), [`fixtures/schema-candidates/assertion-revoked.json`](../../fixtures/schema-candidates/assertion-revoked.json) | `straylight.assertion.v0` | `src/schemas/assertion.ts` | `move_to_hounfour` | `class_validation` | [`fixtures/hounfour-conformance/valid-assertion.json`](../../fixtures/hounfour-conformance/valid-assertion.json), [`fixtures/hounfour-conformance/invalid-assertion-unknown-class.json`](../../fixtures/hounfour-conformance/invalid-assertion-unknown-class.json) | Full interface (every field, all optionals). Authority (admit / challenge / revoke / forget) stays in `EstateStore`. Per §2.2. |
| `CandidateAssertion` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.candidate_assertion.v0` | `src/schemas/assertion.ts` | `move_to_hounfour` | `class_validation` | — | Pre-admission shape. Class validation is the only check that runs against this. Per §2.2. |
| `AssertionClass` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) | `straylight.assertion_class.v0` | `src/schemas/assertion.ts` | `move_to_hounfour` | `class_validation` | [`fixtures/hounfour-conformance/invalid-assertion-unknown-class.json`](../../fixtures/hounfour-conformance/invalid-assertion-unknown-class.json) | 16-member enum + `ASSERTION_CLASSES` membership constant. Per-class admission rules stay in default keyring. Per §2.2. |
| `AssertionStatus` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.assertion_status.v0` | `src/schemas/assertion.ts` | `move_to_hounfour` | `class_validation` | — | 8-member enum. Transition matrix (which transitions reach which status) stays in `EstateStore`. Per §2.2. |
| `PrivacyScope` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.privacy_scope.v0` | `src/schemas/assertion.ts` | `move_to_hounfour` | `class_validation` | — | 4-member enum. `privacyDispositionForFrame` stays in `recall.ts` / `policy.ts`. Per §2.2. |
| `RiskLevel` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.risk_level.v0` | `src/schemas/assertion.ts` | `move_to_hounfour` | `class_validation` | — | 4-member enum. High/critical-risk lifts (`provenance_insufficient_for_high_risk`, public-frame `needs_review`) stay in wedge. Per §2.2. |
| `ProvenanceRef` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.provenance_ref.v0` | `src/schemas/provenance.ts` | `move_to_hounfour` | `class_validation` | — | Pure shape. Per §2.2. |
| `ProvenanceSourceType` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.provenance_source_type.v0` | `src/schemas/provenance.ts` | `move_to_hounfour` | `class_validation` | — | 11-member enum + `PROVENANCE_SOURCE_TYPES` membership constant. Per §2.2. |

### Signature primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `SignatureEnvelope` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) | `straylight.signature_envelope.v0` | `src/schemas/signature.ts` | `move_to_hounfour` | `class_validation` | [`fixtures/hounfour-conformance/keyring-signer-competent.json`](../../fixtures/hounfour-conformance/keyring-signer-competent.json), [`fixtures/hounfour-conformance/keyring-signer-incompetent.json`](../../fixtures/hounfour-conformance/keyring-signer-incompetent.json) (envelope appears nested in payload) | Verifiers stay in wedge. `dev_signature` is dev-only; production signature material is reserved future work in `loa-straylight`. Per §2.3, §5.1 H6. |
| `SignerType` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.signer_type.v0` | `src/schemas/signature.ts` | `move_to_hounfour` | `class_validation` | — | 8-member enum. Per §2.3. |
| `SignatureType` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.signature_type.v0` | `src/schemas/signature.ts` | `move_to_hounfour` | `class_validation` | — | 4-member enum, including `dev_signature`. Schema MUST NOT *require* `dev_signature`. Per §2.3, §5.1 H6. |

### Keyring primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `Keyring` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/keyring.ts`](../../src/straylight/keyring.ts); [`fixtures/keyring.json`](../../fixtures/keyring.json), [`fixtures/schema-candidates/keyring.json`](../../fixtures/schema-candidates/keyring.json) | `straylight.keyring.v0` | `src/schemas/keyring.ts` | `move_to_hounfour` | `keyring_validation` | [`fixtures/hounfour-conformance/keyring-signer-competent.json`](../../fixtures/hounfour-conformance/keyring-signer-competent.json), [`fixtures/hounfour-conformance/keyring-signer-incompetent.json`](../../fixtures/hounfour-conformance/keyring-signer-incompetent.json) | Shape only. `evaluateCompetence` MUST NOT ship from Hounfour. Per §2.4, §5.2 H7. |
| `SignerEntry` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.signer_entry.v0` | `src/schemas/keyring.ts` | `move_to_hounfour` | `keyring_validation` | — | Per-signer registry entry. Shape only. Per §2.4. |
| `SignerStatus` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.signer_status.v0` | `src/schemas/keyring.ts` | `move_to_hounfour` | `keyring_validation` | — | 3-member enum. Per §2.4. |
| `SignerCompetenceRule` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.signer_competence_rule.v0` | `src/schemas/keyring.ts` | `move_to_hounfour` | `keyring_validation` | — | Shape only. Quorum / timelock / human-review evaluation stays in wedge. Per §2.4. |
| `evaluateCompetence` | [`src/straylight/keyring.ts`](../../src/straylight/keyring.ts) | — | — | `runtime_only` | `keyring_validation` | [`fixtures/hounfour-conformance/keyring-signer-competent.json`](../../fixtures/hounfour-conformance/keyring-signer-competent.json), [`fixtures/hounfour-conformance/keyring-signer-incompetent.json`](../../fixtures/hounfour-conformance/keyring-signer-incompetent.json) | Listed for completeness. **Stays in `loa-straylight` permanently.** Per §2.4, §5.2 H7. |
| `resolveSigner`, `isSignerCurrentlyValid`, rule-matching specificity heuristic | [`src/straylight/keyring.ts`](../../src/straylight/keyring.ts) | — | — | `runtime_only` | `keyring_validation` | — | **Stays in `loa-straylight` permanently.** Per §2.4, §5.2 H7. |

### Validation result primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `ValidationError` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) | `straylight.validation_error.v0` | `src/schemas/validation.ts` | `move_to_hounfour` | `class_validation` | — | Result-shape only. The `code` enum moves; the validators that produce them stay in wedge. Per §2.5. |
| `ClassValidationResult` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.class_validation_result.v0` | `src/schemas/validation.ts` | `move_to_hounfour` | `class_validation` | — | Result-shape only. Hounfour may ship a reference validator alongside; the wedge calls its own. Per §2.5. |
| `validateCandidateAssertion`, `validateRecallRequest`, `classSpecificChecks` | [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) | — | — | `runtime_only` | `class_validation` | [`fixtures/hounfour-conformance/valid-assertion.json`](../../fixtures/hounfour-conformance/valid-assertion.json), [`fixtures/hounfour-conformance/invalid-assertion-unknown-class.json`](../../fixtures/hounfour-conformance/invalid-assertion-unknown-class.json), [`fixtures/hounfour-conformance/valid-recall-request.json`](../../fixtures/hounfour-conformance/valid-recall-request.json), [`fixtures/hounfour-conformance/invalid-recall-request-missing-actor-id.json`](../../fixtures/hounfour-conformance/invalid-recall-request-missing-actor-id.json) | Listed for completeness. **Stays in `loa-straylight` alongside any Hounfour reference validator.** Both must agree on result shape. Per §2.5. |

### Policy primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `PolicyDecision` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/policy.ts`](../../src/straylight/policy.ts); [`fixtures/schema-candidates/policy-decision-denied.json`](../../fixtures/schema-candidates/policy-decision-denied.json) | `straylight.policy_decision.v0` | `src/schemas/policy.ts` | `shared_contract` | `policy_validation` | [`fixtures/hounfour-conformance/policy-decision-allowed.json`](../../fixtures/hounfour-conformance/policy-decision-allowed.json), [`fixtures/hounfour-conformance/policy-decision-denied.json`](../../fixtures/hounfour-conformance/policy-decision-denied.json) | **Type only.** Hounfour hosts so cross-repo readers can deserialize. **Hounfour MUST NOT produce a `PolicyDecision`.** Per §2.6, §5.2 H8. |
| `PolicyDecisionOutcome` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.policy_decision_outcome.v0` | `src/schemas/policy.ts` | `move_to_hounfour` | `policy_validation` | — | 5-member enum (`allow` / `deny` / `needs_review` / `allow_with_redaction` / `allow_marked_only`). Per §2.6. |
| `SignerCompetenceResult` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.signer_competence_result.v0` | `src/schemas/policy.ts` | `shared_contract` | `keyring_validation` | [`fixtures/hounfour-conformance/keyring-signer-competent.json`](../../fixtures/hounfour-conformance/keyring-signer-competent.json), [`fixtures/hounfour-conformance/keyring-signer-incompetent.json`](../../fixtures/hounfour-conformance/keyring-signer-incompetent.json) | **Type only.** Hounfour hosts the result shape; the wedge produces results via `evaluateCompetence`. Per §2.6. |
| `policyForAdmitAssertion`, `policyForTransition`, `policyForRecallRequest`, `dispositionFor`, `safeRun`, `PolicyEngineError`, `DEFAULT_POLICY_ID`, `DEFAULT_POLICY_VERSION` | [`src/straylight/policy.ts`](../../src/straylight/policy.ts) | — | — | `runtime_only` | `policy_validation` | [`fixtures/hounfour-conformance/policy-decision-allowed.json`](../../fixtures/hounfour-conformance/policy-decision-allowed.json), [`fixtures/hounfour-conformance/policy-decision-denied.json`](../../fixtures/hounfour-conformance/policy-decision-denied.json) | Listed for completeness. **Stays in `loa-straylight` permanently.** Hounfour MUST NOT produce a decision. Per §2.6, §5.2 H8. |

### Estate transition primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `EstateTransition` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/estate.ts`](../../src/straylight/estate.ts) | `straylight.estate_transition.v0` | `src/schemas/transition.ts` | `move_to_hounfour` | `audit_validation` | — | 14-member `transition_type` enum. Authoring (`buildTransition`), append-only semantics, `EstateStore` stay in wedge. Per §2.7. |
| `TransitionReceipt` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.transition_receipt.v0` | `src/schemas/transition.ts` | `move_to_hounfour` | `audit_validation` | — | Receipt persistence (`persistReceipt`) and receipt-vs-audit-event distinction stay in wedge. Per §2.7. |
| `TransitionReceiptKind` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.transition_receipt_kind.v0` | `src/schemas/transition.ts` | `move_to_hounfour` | `audit_validation` | — | 5-member enum. Per §2.7. |
| `EstateStore`, `buildTransition`, `persistReceipt` | [`src/straylight/estate.ts`](../../src/straylight/estate.ts) | — | — | `runtime_only` | `audit_validation` | — | Listed for completeness. **Stays in `loa-straylight` permanently.** Per §2.7, §5.2 H10. |

### Challenge / revocation / forget primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `Challenge` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/estate.ts`](../../src/straylight/estate.ts) | `straylight.challenge.v0` | `src/schemas/challenge.ts` | `move_to_hounfour` | `class_validation` | — | Effect-application logic (status mutation, `challenged_by_refs` linking) stays in `EstateStore.challenge`. Per §2.8. |
| `ChallengeType` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.challenge_type.v0` | `src/schemas/challenge.ts` | `move_to_hounfour` | `class_validation` | — | 9-member enum. Per §2.8. |
| `ChallengeRequestedEffect` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.challenge_requested_effect.v0` | `src/schemas/challenge.ts` | `move_to_hounfour` | `class_validation` | — | 6-member enum. Per §2.8. |
| `Revocation` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/estate.ts`](../../src/straylight/estate.ts) | `straylight.revocation.v0` | `src/schemas/revocation.ts` | `move_to_hounfour` | `class_validation` | — | Status flip + `revoked_by_ref` linking stay in `EstateStore.revoke`. Per §2.8. |
| `ForgetRecord` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/estate.ts`](../../src/straylight/estate.ts) | `straylight.forget_record.v0` | `src/schemas/forget.ts` | `move_to_hounfour` | `class_validation` | — | `EstateStore.forget`, recall-side exclusion of `forgotten_from_recall` outside `audit_review`, and `mark_as_contested`-style use-instruction tagging stay in wedge. Per §2.8. |

### Recall primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `RecallRequest` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts); [`fixtures/schema-candidates/recall-request-public-discord.json`](../../fixtures/schema-candidates/recall-request-public-discord.json) | `straylight.recall_request.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | [`fixtures/hounfour-conformance/valid-recall-request.json`](../../fixtures/hounfour-conformance/valid-recall-request.json), [`fixtures/hounfour-conformance/invalid-recall-request-missing-actor-id.json`](../../fixtures/hounfour-conformance/invalid-recall-request-missing-actor-id.json) | `executeRecall`, dispositions, per-frame `needs_review` lifts stay in wedge. Per §2.9. |
| `EnvironmentFrame` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.environment_frame.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | — | 7-member enum. Per §2.9. |
| `ReceiptDetailLevel` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.receipt_detail_level.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | — | 3-member enum (`minimal` / `standard` / `debug`). Per §2.9. |
| `RecallItem` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.recall_item.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | — | `useInstructionForMark` and per-item assembly stay in wedge. Per §2.9. |
| `RecallUseInstruction` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.recall_use_instruction.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | — | 4-member enum. Per §2.9. |
| `RedactionSummary` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.redaction_summary.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | — | `summaryFor` stays in wedge. Per §2.9. |
| `ExclusionSummary` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.exclusion_summary.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | — | Per §2.9. |
| `RecallPack` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/recall.ts`](../../src/straylight/recall.ts); [`fixtures/schema-candidates/recall-pack-public-discord.json`](../../fixtures/schema-candidates/recall-pack-public-discord.json) | `straylight.recall_pack.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | — | Pack assembly + `pack_hash` stay in wedge. Per §2.9. |
| `RecallReceipt` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/recall.ts`](../../src/straylight/recall.ts); [`fixtures/schema-candidates/recall-receipt-public-discord.json`](../../fixtures/schema-candidates/recall-receipt-public-discord.json) | `straylight.recall_receipt.v0` | `src/schemas/recall.ts` | `move_to_hounfour` | `class_validation` | [`fixtures/hounfour-conformance/valid-recall-receipt.json`](../../fixtures/hounfour-conformance/valid-recall-receipt.json), [`fixtures/hounfour-conformance/invalid-recall-receipt-missing-receipt-hash.json`](../../fixtures/hounfour-conformance/invalid-recall-receipt-missing-receipt-hash.json) | Detail-level redaction matrix and `commitment_ref` seam stay in wedge. Per §2.9. |
| `executeRecall`, `redactReceipt`, `dispositionFor`, `privacyDispositionForFrame`, `useInstructionForMark`, `summaryFor` | [`src/straylight/recall.ts`](../../src/straylight/recall.ts), [`src/straylight/policy.ts`](../../src/straylight/policy.ts) | — | — | `runtime_only` | `policy_validation` | — | Listed for completeness. **Stays in `loa-straylight` permanently.** Per §2.9. |

### Audit chain primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `AuditEvent` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/audit.ts`](../../src/straylight/audit.ts); [`fixtures/schema-candidates/audit-event-transition.json`](../../fixtures/schema-candidates/audit-event-transition.json) | `straylight.audit_event.v0` | `src/schemas/audit.ts` | `move_to_hounfour` | `audit_validation` | [`fixtures/hounfour-conformance/valid-audit-event.json`](../../fixtures/hounfour-conformance/valid-audit-event.json), [`fixtures/hounfour-conformance/invalid-audit-event-tampered-hash.json`](../../fixtures/hounfour-conformance/invalid-audit-event-tampered-hash.json) | **All chained-hash semantics stay in wedge.** Hounfour MUST NOT compute `previous_audit_hash` / `audit_hash`, append, or verify. Per §2.10, §5.2 H9. |
| `AuditEventType` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.audit_event_type.v0` | `src/schemas/audit.ts` | `move_to_hounfour` | `audit_validation` | — | 17-member enum. Per §2.10. |
| `AuditLog.append`, `AuditLog.getAuditTail`, `AuditLog.verifyChain` | [`src/straylight/audit.ts`](../../src/straylight/audit.ts) | — | — | `runtime_only` | `audit_validation` | [`fixtures/hounfour-conformance/valid-audit-event.json`](../../fixtures/hounfour-conformance/valid-audit-event.json), [`fixtures/hounfour-conformance/invalid-audit-event-tampered-hash.json`](../../fixtures/hounfour-conformance/invalid-audit-event-tampered-hash.json) | Listed for completeness. **Stays in `loa-straylight` permanently.** The audit-tamper vector pins this boundary. Per §2.10, §5.2 H9. |

### Commitment primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `CommitmentRoot` | [`src/straylight/types.ts`](../../src/straylight/types.ts), [`src/straylight/commitment.ts`](../../src/straylight/commitment.ts); [`fixtures/schema-candidates/commitment-root.json`](../../fixtures/schema-candidates/commitment-root.json) | `straylight.commitment_root.v0` | `src/schemas/commitment.ts` | `move_to_hounfour` | `audit_validation` | — | 4-member `commitment_type` enum (`estate_checkpoint` / `recall_receipt` / `transition_bundle` / `revocation_checkpoint`). `computeCommitmentRoot`, local hashing, and the reserved onchain seam stay in wedge. **Onchain publishing is reserved future work and is NOT part of any extraction.** Per §2.11. |
| `commitment_type` enum | [`src/straylight/types.ts`](../../src/straylight/types.ts) | `straylight.commitment_type.v0` | `src/schemas/commitment.ts` | `move_to_hounfour` | `audit_validation` | — | Per §2.11. |
| `computeCommitmentRoot`, `commitmentForRecallReceipt` | [`src/straylight/commitment.ts`](../../src/straylight/commitment.ts) | — | — | `runtime_only` | `audit_validation` | — | Listed for completeness. **Stays in `loa-straylight` permanently.** Per §2.11. |

### Stay-in-Straylight primitives

| Straylight primitive | Current Straylight source / fixture | Proposed Hounfour schema name | Proposed Hounfour file path | Classification | Validation layer | Conformance fixture | Notes |
|---|---|---|---|---|---|---|---|
| `ID` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | — | — | `stay_in_straylight` | `none` | — | Language-level alias over `string`. JSON Schema expresses as `string` directly; no schema power gained. Per §2.12. |
| `Hash` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | — | — | `stay_in_straylight` | `none` | — | Convention `sha256:<hex>` is permanently pinned; expressed in Hounfour as `pattern: ^sha256:[0-9a-f]+$` per §5.1 H4. Per §2.12. |
| `ISO8601` | [`src/straylight/types.ts`](../../src/straylight/types.ts) | — | — | `stay_in_straylight` | `none` | — | Expressed in Hounfour as `format: date-time` per §5.1 H5. Per §2.12. |

### Out-of-scope primitives

The architecture spec at §6.2.2 mentions a few primitives that are
**not** part of this extraction because they have no runtime
presence in the wedge yet. Listed here so reviewers don't assume
they were missed.

| Primitive | Current Straylight source | Classification | Notes |
|---|---|---|---|
| `PublicAnchorRecord` | — (no adapter exists) | `stay_in_straylight` | No public-anchor adapter exists; nothing to freeze. Per `hounfour-extraction-plan.md` §2.13. |
| `FeedbackSignal` | — (only as `AssertionClass` enum member) | `stay_in_straylight` | No dedicated artifact type. Candidate for later phase. Per §2.13. |
| `EvaluationResult` | — (only as `ProvenanceSourceType` enum member) | `stay_in_straylight` | No dedicated artifact type. Candidate for later phase. Per §2.13. |
| `Demotion` | — (handled as `Challenge` with `requested_effect: demote`) | `stay_in_straylight` | No standalone type. Per §2.13. |
| `SignedAssertion` | — (`Assertion` with non-empty `signatures[]`) | `stay_in_straylight` | No separate type; the wedge expresses this via `Assertion`. Per §2.13. |

### Fixture-only artifacts

These exist as `fixtures/*.json` files and are not TypeScript
declarations. Listed so the mapping stays exhaustive.

| Fixture | Path | Classification | Notes |
|---|---|---|---|
| Default actor | [`fixtures/actor.json`](../../fixtures/actor.json) | `fixture_only` | Used by demos and tests. Validates against `straylight.actor.v0`. |
| Default estate | [`fixtures/estate.json`](../../fixtures/estate.json) | `fixture_only` | Used by demos and tests. Validates against `straylight.actor_estate.v0`. |
| Default keyring | [`fixtures/keyring.json`](../../fixtures/keyring.json) | `fixture_only` | Used by demos and tests. Validates against `straylight.keyring.v0`. |
| Phase 6 schema-candidate examples | [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/) (12 files) | `fixture_only` | Listed as PR-A test inputs in [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md). |
| Phase 8 conformance vectors | [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/) (12 files) | `fixture_only` | Listed as PR-A test inputs in [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md). Each pins one validation layer. |

## Cross-references

- [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — issue handoff packet that consumes this mapping.
- [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  — companion PR review checklist.
- [`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
  — Phase 7 extraction plan with the canonical classifications and
  conformance bar.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant.
- [`docs/schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
  — Phase 8 conformance vector pack documentation.
- [`docs/schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md)
  — Phase 6 per-candidate inventory with field-level detail.
