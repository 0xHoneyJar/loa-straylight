# Hounfour schema extraction — issue handoff

> Status: Phase 9. **Pre-extraction handoff packet, in `loa-straylight`
> only.** This file is written so it can be filed verbatim (or with
> minor edits) as a GitHub issue against
> [`0xHoneyJar/loa-hounfour`](https://github.com/0xHoneyJar/loa-hounfour)
> when that repo is ready to receive Straylight's class-validation
> schemas. **Filing the issue is not part of Phase 9.** Nothing in this
> handoff imports from `loa-hounfour`, edits any sibling repo, adds a
> Hounfour dependency, or changes Phase 0–8 runtime behavior.

## Title

> Adopt Straylight class-validation schemas as `loa-hounfour` v0 surface

## Summary

`loa-straylight` Phase 6, 7, and 8 staged a complete pre-extraction
handoff for the Straylight class-validation primitives. The schemas,
the class-vs-policy boundary, the per-candidate inventory, the
extraction plan, and 12 deterministic conformance vectors all live
in-repo today. They are explicitly *not* canonical Hounfour
artifacts; they are the inputs a `loa-hounfour` PR-A is supposed to
consume.

This issue requests that `loa-hounfour` ships:

1. TypeBox / JSON Schema definitions for every `move_to_hounfour`
   candidate listed in [§Schema candidates to extract](#schema-candidates-to-extract).
2. A reproducible JSON Schema generator (TypeBox → JSON Schema is the
   recommended path; see [§Proposed generated JSON Schema outputs](#proposed-generated-json-schema-outputs)).
3. The 12 conformance vectors from [§Proposed conformance vectors](#proposed-conformance-vectors)
   imported as test inputs, with each vector's
   `expected_valid` outcome enforced by the corresponding validator.
4. A package surface that `loa-straylight` can pin (`@loa/hounfour@0.x`)
   and re-export from `src/straylight/types.ts`.

The companion PR checklist is at
[`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md).
The mapping table from Straylight primitives to proposed Hounfour
schema names is at
[`docs/handoffs/hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md).

## Background

The Straylight Recall Wedge ships a thin control plane over a
governed actor estate. Every artifact entering the estate is a
signed, typed object: `Actor`, `ActorEstate`, `Assertion`, `Keyring`,
`SignatureEnvelope`, `EstateTransition`, `Challenge`, `Revocation`,
`ForgetRecord`, `RecallRequest`, `RecallPack`, `RecallReceipt`,
`AuditEvent`, `CommitmentRoot`. These are currently declared in
[`src/straylight/types.ts`](../../src/straylight/types.ts) and
class-validated in
[`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts).

That works for the wedge, but it blocks cross-repo reuse. Other Loa
components (Finn, Dixie, Freeside, eval harnesses, future onchain
anchors) need to read these shapes without depending on the wedge's
runtime. The architecture spec calls this out explicitly:

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.2 — "Hounfour should own class validation and schema
  conformance. It should not own runtime policy enforcement by
  itself."

Phase 6 inventoried the candidates. Phase 7 classified each as
`move_to_hounfour` or `stay_in_straylight` and pinned the conformance
bar Hounfour must clear. Phase 8 produced 12 deterministic JSON
vectors covering the four validation layers (`class_validation`,
`policy_validation`, `audit_validation`, `keyring_validation`).
Phase 9 (this issue) hands those artifacts off as the input pack for
PR-A.

## Why this belongs in Hounfour

The class lane is upstream of behavior. Every Loa component that
reads or writes a Straylight artifact needs to agree on shape. The
runtime that enforces *policy* is wedge-specific (it owns the
keyring, the policy engine, the audit chain, the recall executor),
but the *shape* is shared.

Three forces drive the move:

1. **Cross-repo reuse without runtime coupling.** Finn, Dixie, and
   Freeside should be able to deserialize a wedge-produced
   `RecallReceipt`, `AuditEvent`, or `CommitmentRoot` without
   importing the wedge.
2. **Schema source of truth.** Today, the wedge is the source of
   truth for shape. Anything that wants to validate a Straylight
   artifact has to read TypeScript. A Hounfour-published JSON Schema
   removes that constraint.
3. **A neutral place to pin enums.** `AssertionClass`,
   `EnvironmentFrame`, `AuditEventType`, `ChallengeType`,
   `ProvenanceSourceType`, and friends are stable across consumers.
   Pinning them in Hounfour is a precondition for cross-repo testing
   that doesn't drift.

What Hounfour gets is the *class lane only*. The class-vs-policy
boundary in
[`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
is load-bearing here and is reproduced in §[Class validation vs
policy validation boundary](#class-validation-vs-policy-validation-boundary).

## Explicit non-goals

Hounfour is **not** asked to ship any of the following. Each item
maps to a runtime decision that stays in `loa-straylight`
permanently:

- **No runtime policy decisions.** Hounfour MUST NOT export
  `policyForAdmitAssertion`, `policyForTransition`,
  `policyForRecallRequest`, `dispositionFor`, or any function that
  *produces* a `PolicyDecision`. The `PolicyDecision` *type* is
  hosted so cross-repo readers can deserialize a wedge-produced
  decision; the engine that *makes* decisions never leaves the
  wedge. Per
  [`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
  §2.6, §5.2 H8.
- **No signer competence evaluation.** Hounfour MUST NOT export
  `evaluateCompetence`, `resolveSigner`, `isSignerCurrentlyValid`,
  the rule-matching specificity heuristic, or any quorum / timelock /
  human-review resolution. Per §2.4, §5.2 H7.
- **No signature verification.** Hounfour MUST NOT export
  `verifyDevSignature`, `verifyEnvelopeSelfConsistency`, or any HMAC
  / ed25519 / secp256k1 verifier. The `SignatureEnvelope` *type* and
  the `SignatureType` enum (which includes `dev_signature`) are
  hosted; verifiers stay in the wedge. Per §2.3, §5.2 H7.
- **No audit-chain code.** Hounfour MUST NOT compute
  `previous_audit_hash` / `audit_hash`, append to an audit log, or
  verify a chain. The `AuditEvent` *type* and `AuditEventType` enum
  are hosted; the chain is wedge-owned. Per §2.10, §5.2 H9.
- **No transition application.** Hounfour MUST NOT apply
  `EstateTransition`s. The shape is hosted; only the wedge's
  `EstateStore` mutates state. Per §2.7, §5.2 H10.
- **No storage adapters.** Hounfour MUST NOT ship `InMemoryStorage`,
  `JsonlStorage`, `loadBundle`, `saveBundle`, or any
  `StorageAdapter` implementation. Storage execution is wedge-owned.
- **No recall execution.** Hounfour MUST NOT ship `executeRecall`,
  the per-frame `needs_review` lifts, the `provenance_insufficient_for_high_risk`
  lift, or pack assembly. The `RecallRequest`, `RecallPack`, and
  `RecallReceipt` *types* are hosted; recall execution stays
  wedge-owned. Per §2.9.
- **No commitment publishing.** Hounfour MUST NOT ship
  `computeCommitmentRoot` or any onchain anchor adapter. Onchain
  publishing is reserved future work in `loa-straylight`. Per §2.11.
- **No reverse imports.** Hounfour MUST NOT import from
  `@loa/straylight`, the `loa-straylight` repo, or any sibling repo
  that depends on the wedge. Per §5.2 H11.
- **No production signature material in v0.** The `dev_signature`
  enum member is present in shape (it appears in fixtures); the
  Hounfour schema MUST NOT *require* `signature_type === 'dev_signature'`.
  Production ed25519 / secp256k1 / real HMAC support is reserved
  future work in `loa-straylight`, not Hounfour. Per §2.3, §5.1 H6.
- **No Discord, Freeside, Finn, or Dixie integration.** Out of
  scope for v0.
- **No PRD/SDD/sprint planning artifact** is requested by this
  issue. Hounfour's process for adopting these schemas is
  Hounfour's choice.

## Schema candidates to extract

Every candidate below is classified `move_to_hounfour` in
[`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
§2. Each name maps to one or more current TypeScript declarations
in [`src/straylight/types.ts`](../../src/straylight/types.ts).

### Identity

- `Actor` — interface; `ActorType` enum (5 members); `ActorStatus`
  enum (5 members); optional `provenance_ref`.
- `ActorEstate` — interface; `EstateStatus` enum (5 members);
  optional `state_root`; optional `public_anchor_refs`.

### Assertions

- `Assertion` — interface (full, including `body_hash`,
  `provenance[]`, `signatures[]`, the optional `subject_refs` /
  `linked_assertion_refs` / `supersedes_refs` /
  `challenged_by_refs` / `revoked_by_ref` / `confidence` /
  `risk_level` / `privacy_scope` / `recall_scope`).
- `CandidateAssertion` — pre-admission shape.
- `AssertionClass` — enum (16 members).
- `AssertionStatus` — enum (8 members).
- `PrivacyScope` — enum (4 members).
- `RiskLevel` — enum (4 members).
- `ProvenanceRef` — interface; `ProvenanceSourceType` enum
  (11 members).

### Signatures

- `SignatureEnvelope` — interface.
- `SignerType` — enum (8 members).
- `SignatureType` — enum (4 members, including `dev_signature`).

### Keyring

- `Keyring` — interface.
- `SignerEntry` — interface.
- `SignerCompetenceRule` — interface.
- `SignerStatus` — enum (3 members).

### Validation results

- `ValidationError` — interface; `ValidationError.code` enum.
- `ClassValidationResult` — interface.

### Policy decisions (type only)

- `PolicyDecision` — interface (Hounfour hosts the type so
  cross-repo readers can deserialize one; Hounfour MUST NOT produce
  one).
- `SignerCompetenceResult` — interface.
- `PolicyDecisionOutcome` — enum (5 members: `allow` / `deny` /
  `needs_review` / `allow_with_redaction` / `allow_marked_only`).

### Estate transitions

- `EstateTransition` — interface; `transition_type` enum
  (14 members).
- `TransitionReceipt` — interface; `TransitionReceiptKind` enum
  (5 members).

### Challenges and revocations

- `Challenge` — interface; `ChallengeType` enum (9 members);
  `ChallengeRequestedEffect` enum (6 members).
- `Revocation` — interface.
- `ForgetRecord` — interface.

### Recall

- `RecallRequest` — interface; `EnvironmentFrame` enum (7 members);
  `ReceiptDetailLevel` enum (3 members: `minimal` / `standard` /
  `debug`).
- `RecallItem` — interface; `RecallUseInstruction` enum (4 members).
- `RedactionSummary` — interface.
- `ExclusionSummary` — interface.
- `RecallPack` — interface (full, including the content-addressed
  `pack_hash`).
- `RecallReceipt` — interface (full, including the `detail_level`
  discipline).

### Audit

- `AuditEvent` — interface; `AuditEventType` enum (17 members).

### Commitment

- `CommitmentRoot` — interface; `commitment_type` enum (4 members:
  `estate_checkpoint` / `recall_receipt` / `transition_bundle` /
  `revocation_checkpoint`).

### Stays in `loa-straylight`

- `ID`, `Hash`, `ISO8601` — language-level type aliases over
  `string`. JSON Schema already has the equivalents (`string`,
  `pattern: ^sha256:[0-9a-f]+$`, `format: date-time`); no schema
  power is gained by promoting them. Per
  [`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
  §2.12.

## Proposed TypeBox schema surfaces

TypeBox is the recommended path because it produces both a
TypeScript type and a JSON Schema from a single declaration.
Equivalent paths (Zod with `zod-to-json-schema`, JSON Schema
authored directly with `Static<typeof T>` patterns, or hand-written
JSON Schema with type definitions alongside) are acceptable provided
the **type identity** in the wedge does not drift.

A sketch of the surface — concrete authoring is up to PR-A:

```ts
// src/schemas/actor.ts (in loa-hounfour)
import { Type, Static } from '@sinclair/typebox';

export const ActorType = Type.Union([
  Type.Literal('agent'),
  Type.Literal('user'),
  Type.Literal('community'),
  Type.Literal('repo_assistant'),
  Type.Literal('demo_dnft'),
], { $id: 'straylight.actor_type.v0' });

export const ActorStatus = Type.Union([
  Type.Literal('active'),
  Type.Literal('suspended'),
  Type.Literal('retired'),
  Type.Literal('demo'),
  Type.Literal('archived'),
], { $id: 'straylight.actor_status.v0' });

export const Actor = Type.Object({
  actor_id: Type.String(),
  actor_type: Type.Ref(ActorType),
  estate_id: Type.String(),
  keyring_id: Type.String(),
  status: Type.Ref(ActorStatus),
  controller_refs: Type.Array(Type.String()),
  provenance_ref: Type.Optional(Type.String()),
  schema_version: Type.String(),
  created_at: Type.String({ format: 'date-time' }),
  updated_at: Type.String({ format: 'date-time' }),
}, { $id: 'straylight.actor.v0' });

export type Actor = Static<typeof Actor>;
```

The same shape applies to every `move_to_hounfour` candidate. Schema
ids should be prefixed `straylight.<type>.v0` to match the wedge's
existing `straylight.assertion.v0` /
`straylight.recall_request.v0` ids in
[`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts).

## Proposed generated JSON Schema outputs

PR-A should publish a directory of generated JSON Schema documents
(e.g. `schemas/json/v0/`) corresponding to each TypeBox schema:

- `straylight.actor.v0.json`
- `straylight.actor_estate.v0.json`
- `straylight.assertion.v0.json`
- `straylight.candidate_assertion.v0.json`
- `straylight.assertion_class.v0.json`
- `straylight.assertion_status.v0.json`
- `straylight.privacy_scope.v0.json`
- `straylight.risk_level.v0.json`
- `straylight.provenance_ref.v0.json`
- `straylight.provenance_source_type.v0.json`
- `straylight.signature_envelope.v0.json`
- `straylight.signer_type.v0.json`
- `straylight.signature_type.v0.json`
- `straylight.keyring.v0.json`
- `straylight.signer_entry.v0.json`
- `straylight.signer_competence_rule.v0.json`
- `straylight.signer_status.v0.json`
- `straylight.validation_error.v0.json`
- `straylight.class_validation_result.v0.json`
- `straylight.policy_decision.v0.json`
- `straylight.policy_decision_outcome.v0.json`
- `straylight.signer_competence_result.v0.json`
- `straylight.estate_transition.v0.json`
- `straylight.transition_receipt.v0.json`
- `straylight.transition_receipt_kind.v0.json`
- `straylight.challenge.v0.json`
- `straylight.challenge_type.v0.json`
- `straylight.challenge_requested_effect.v0.json`
- `straylight.revocation.v0.json`
- `straylight.forget_record.v0.json`
- `straylight.recall_request.v0.json`
- `straylight.environment_frame.v0.json`
- `straylight.receipt_detail_level.v0.json`
- `straylight.recall_item.v0.json`
- `straylight.recall_use_instruction.v0.json`
- `straylight.redaction_summary.v0.json`
- `straylight.exclusion_summary.v0.json`
- `straylight.recall_pack.v0.json`
- `straylight.recall_receipt.v0.json`
- `straylight.audit_event.v0.json`
- `straylight.audit_event_type.v0.json`
- `straylight.commitment_root.v0.json`
- `straylight.commitment_type.v0.json`

Each JSON Schema document should:

- Use Draft 2020-12 or Draft 07 (PR-A's choice; pin one).
- Carry `$id: straylight.<type>.v0`.
- Use `pattern: ^sha256:[0-9a-f]+$` wherever a `Hash` appears
  (`body_hash`, `audit_hash`, `pack_hash`, `receipt_hash`,
  `root_hash`, `signed_payload_hash`, etc.) — per
  [`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
  §5.1 H4.
- Use `format: date-time` wherever an `ISO8601` appears — per H5.
- Reproduce the wedge's optional / required field discipline
  exactly. Adding new optional fields is allowed; adding new
  required fields breaks the wedge — per H1, H16.
- Not require `signature_type === 'dev_signature'` — per H6.

## Proposed conformance vectors

Phase 8 produced 12 deterministic JSON vectors covering the four
validation layers. They live at
[`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
and are re-emittable via `npm run hounfour:conformance`. Each
vector is a self-describing object with `case_name`,
`expected_valid`, `validation_layer`, `reason`, `subject`, and
`payload`.

| File | `validation_layer` | `expected_valid` | What it pins |
|---|---|---|---|
| `valid-assertion.json` | `class_validation` | `true` | A structurally legible observation. |
| `invalid-assertion-unknown-class.json` | `class_validation` | `false` | `assertion_class` outside the `AssertionClass` enum. |
| `valid-recall-request.json` | `class_validation` | `true` | A structurally legible recall request (public_discord, medium risk). |
| `invalid-recall-request-missing-actor-id.json` | `class_validation` | `false` | A recall request without `actor_id` — the only structural fault. |
| `valid-recall-receipt.json` | `class_validation` | `true` | A receipt with `pack_hash`, `receipt_hash`, `detail_level`. |
| `invalid-recall-receipt-missing-receipt-hash.json` | `class_validation` | `false` | A receipt with `pack_hash` but no `receipt_hash`. |
| `valid-audit-event.json` | `audit_validation` | `true` | An audit event whose `audit_hash` reproduces under recomputation. |
| `invalid-audit-event-tampered-hash.json` | `audit_validation` | `false` | An audit event whose `audit_hash` has been zeroed out — only the chain check fails; class shape is intact. |
| `policy-decision-allowed.json` | `policy_validation` | `true` | A `PolicyDecision` of `allow` for a runtime-signed observation. |
| `policy-decision-denied.json` | `policy_validation` | `false` | A `PolicyDecision` of `deny` for an unknown signer. |
| `keyring-signer-competent.json` | `keyring_validation` | `true` | A self-consistent signature whose signer is on-keyring and role-competent for the matched rule. |
| `keyring-signer-incompetent.json` | `keyring_validation` | `false` | A self-consistent signature whose signer's role is **not** in the matched rule's `required_signer_roles`. |

PR-A should:

1. Copy these 12 files into Hounfour's test inputs directory
   verbatim (or import them as a git submodule / package fixture).
2. For each vector, implement a runner that asserts:
   - For `class_validation` vectors — Hounfour's TypeBox / JSON
     Schema validator agrees with `expected_valid`.
   - For `audit_validation` and `keyring_validation` and
     `policy_validation` — Hounfour's behavior must be **read-only**.
     The validator may *parse* the payload to verify shape; it MUST
     NOT recompute the audit hash, evaluate competence, or produce a
     policy decision. Hounfour's job is shape; the wedge's job is
     authority. The vectors are inputs that prove the boundary.
3. Refuse two collapses explicitly:
   - **No `class → policy` collapse.** Class-validation vectors
     MUST NOT carry `decision` or `policy_decision` on their face.
   - **No `policy → class` collapse.** Policy-validation vectors
     MUST NOT carry `assertion_id`, `body`, `body_hash`,
     `assertion_class`, `provenance`, `pack_hash`, `receipt_hash`,
     or `audit_hash` as top-level fields.

The conformance vectors are described in full at
[`docs/schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md).

## Class validation vs policy validation boundary

The four "no-go" conflations from
[`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
must remain verifiable after the schema move:

1. **Valid JSON is not authorized action.** A `RecallRequest` may
   class-validate cleanly and still be policy-denied. Hounfour
   ships shape; the wedge produces decisions.
2. **Valid signature is not signer competence.** A
   `dev_signature` envelope may verify against its own
   `key_ref + signed_payload_hash` and still be denied by
   `evaluateCompetence` because the signer is unknown / revoked /
   not role-competent / fails quorum / requires human review.
   Hounfour ships the envelope shape; the wedge runs the keyring
   evaluator.
3. **Structurally valid recall request is not automatically allowed
   recall.** Even after class validation passes and signer
   competence clears, the wedge applies `dispositionFor` per
   candidate before placing it in the pack. Hounfour ships the
   request and pack shapes; the wedge runs disposition.
4. **Structurally valid assertion is not automatically active
   truth.** Class validation accepts a body shape; the *authority*
   of an assertion is set by transitions in `EstateStore`. Hounfour
   ships the assertion and transition shapes; the wedge owns the
   transitions.

Hounfour gets the **class lane only**. Class validation answers *is
this object structurally legible?*; policy validation answers *is
this actor / signer / transition allowed now?*. The two questions
must remain separable in code, in test, and in test fixture.

## No-go boundaries

These are the things this issue is **not** asking Hounfour to do.
Repeating the relevant subset of [§Explicit non-goals](#explicit-non-goals)
as load-bearing reminders for the PR reviewer:

- Do not ship `evaluateCompetence`, `resolveSigner`,
  `isSignerCurrentlyValid`, `policyForX(...)`, `dispositionFor`,
  `verifyEnvelopeSelfConsistency`, `verifyDevSignature`,
  `AuditLog.verifyChain`, `EstateStore`, or `executeRecall`. These
  are wedge-owned permanently.
- Do not produce a `PolicyDecision`. The type is exported so
  cross-repo readers can deserialize one; the engine never leaves
  the wedge.
- Do not require `dev_signature`. The enum member is present;
  presence is development-only and the schema must not constrain
  consumers to it.
- Do not import from `@loa/straylight`, the `loa-straylight` repo,
  or any sibling that depends on the wedge.
- Do not add storage adapters, recall execution, audit-chain code,
  transition application, or commitment publishing. Each of those
  is named in [§Explicit non-goals](#explicit-non-goals) with the
  matching extraction-plan citation.
- Do not add Discord, Freeside, Finn, Dixie, or any external
  integration. v0 is schema only.
- Do not add a runtime database or onchain anchor. Both are
  reserved future work in `loa-straylight`.

## Acceptance criteria

PR-A is acceptable when **every** item below is satisfied. Until
all are satisfied, `loa-straylight` keeps its locally-owned shapes
and does not adopt a partial Hounfour. (Each criterion maps back to
the conformance bar in
[`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
§5.)

### Structural

- [ ] **A1 (H1).** For every type listed in [§Schema candidates to
  extract](#schema-candidates-to-extract), Hounfour ships a schema
  artifact whose field-name set, optional/required discipline, and
  field-type annotations match the wedge's current TypeScript
  interface in [`src/straylight/types.ts`](../../src/straylight/types.ts).
- [ ] **A2 (H2).** For every enum listed, every current member is
  present in Hounfour's enum. No member is renamed. Removing a
  member fails the gate.
- [ ] **A3 (H3).** Schema ids are prefixed `straylight.<type>.v0`.
  Initial published version is `0.1.0` (or matches the current
  `schema_version` in the wedge for the corresponding type).
- [ ] **A4 (H4).** Every `Hash` field uses
  `pattern: ^sha256:[0-9a-f]+$` (or equivalent).
- [ ] **A5 (H5).** Every `ISO8601` field uses `format: date-time`.
- [ ] **A6 (H6).** Nothing in Hounfour's schemas *requires*
  `signature_type === 'dev_signature'`.

### Behavioral non-shipment

- [ ] **A7 (H7).** No runtime evaluators ship. (See §Explicit
  non-goals for the full list.)
- [ ] **A8 (H8).** No code in Hounfour produces a `PolicyDecision`.
- [ ] **A9 (H9).** No audit-chain code ships.
- [ ] **A10 (H10).** No transition application ships.
- [ ] **A11 (H11).** No reverse imports from `@loa/straylight` or
  any sibling.

### Consumability

- [ ] **A12 (H12).** Every JSON file currently in
  [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
  validates without modification against the corresponding
  Hounfour schema.
- [ ] **A13 (H13).** Wedge-emitted artifacts (from
  `npm run schema:candidates` or its post-extraction successor)
  validate against Hounfour with no errors. This is the round-trip
  pin.
- [ ] **A14 (H14).** All 12 conformance vectors from
  [§Proposed conformance vectors](#proposed-conformance-vectors)
  ship in Hounfour's test suite, and each vector's
  `expected_valid` outcome is enforced by the corresponding
  validator.
- [ ] **A15 (H15).** Determinism preserved: the schema-candidates
  conformance test in the wedge
  ([`tests/schema-candidates.test.ts`](../../tests/schema-candidates.test.ts))
  passes after the wedge's types are swapped for Hounfour
  re-exports. Content-addressed ids stay stable across
  invocations.
- [ ] **A16 (H16).** No new required field is added to a Hounfour
  schema for a type that already has Phase 6 fixtures.
- [ ] **A17 (H17).** After the future PR-B in `loa-straylight`
  replaces local declarations with `export * from '@loa/hounfour'`
  for `move_to_hounfour` candidates, every test currently green
  under `npm test` stays green. The full list is enumerated in
  [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md).

## Validation commands

The handoff is reproducible from `loa-straylight` today. PR-A
should be able to consume the artifacts these commands produce:

```bash
# Type-check the wedge.
npm run typecheck

# Run all wedge tests (Phase 0–9 inclusive).
npm test

# Run the recall demo (sanity check that the wedge still works).
npm run demo:recall

# Run the recall demo and dump JSON output for inspection.
npm run demo:recall:json

# Re-emit Phase 6 schema-candidate fixtures.
npm run schema:candidates

# Re-emit Phase 8 Hounfour conformance vectors.
npm run hounfour:conformance

# Print the Phase 9 handoff packet summary.
npm run hounfour:handoff
```

`fixtures/schema-candidates/` (12 files) and
`fixtures/hounfour-conformance/` (12 files) are the input pack for
PR-A. Both directories are deterministic; running the helpers twice
produces byte-identical files.

## Risks and open questions

These are the things PR-A's author should think about before
starting. None of them block filing this issue.

- **JSON Schema dialect.** Draft 2020-12 vs Draft 07 vs OpenAPI
  3.1. Draft 2020-12 is recommended (better `pattern` and `$ref`
  semantics) but PR-A may pin a different draft if it has good
  reason. Whatever is chosen MUST be uniform across all schemas.
- **Enum closure.** Enums are *closed* in the wedge today
  (unknown values are class-validation errors). The conformance
  test depends on this. Hounfour must keep enums closed; turning
  them into open string sets would silently weaken H2.
- **Optional vs nullable.** The wedge uses TypeScript's
  `field?: T` discipline (field absent vs explicitly `undefined`).
  JSON Schema typically expresses this as `"required": [...]`
  excluding the field. Hounfour must not introduce `null` as an
  alternative to "absent" for any current optional field.
- **Discriminated unions.** Several types (e.g. `Challenge` by
  `challenge_type`, `EstateTransition` by `transition_type`,
  `CommitmentRoot` by `commitment_type`) are de-facto
  discriminated. The wedge's TypeScript interfaces don't pin the
  discriminator at the type level today; Hounfour may choose to.
  If it does, the discriminator field name and possible values
  MUST match the wedge.
- **Versioning policy.** This issue assumes a `0.x` initial
  surface with no v1 commitment. The wedge's stable API surface
  is documented in
  [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md);
  PR-A should adopt a comparable policy.
- **Conformance vector authorship.** The 12 vectors are emitted
  from current wedge output. If a vector ever diverges from
  current wedge runtime semantics — e.g. because the wedge changes
  what counts as a class-validation error — PR-A's adoption of
  the vector must be re-verified. The export script
  ([`scripts/export-hounfour-conformance.ts`](../../scripts/export-hounfour-conformance.ts))
  is the canonical regenerator.
- **Reference validators in Hounfour.** §5.2 H7 forbids runtime
  evaluators. A *reference class validator* that produces a
  `ClassValidationResult` is permitted (it's pure shape). Whether
  to ship one is up to PR-A.
- **Scope of `ForgetRecord` and `Demotion`.** `ForgetRecord` is
  in scope (see [§Schema candidates to extract](#schema-candidates-to-extract)).
  `Demotion` is not — it is handled today as a `Challenge` with
  `requested_effect: demote` and has no standalone type. Per
  [`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
  §2.13.
- **No PRD/SDD/sprint planning artifact** is requested by this
  handoff. Hounfour's process for adopting these schemas is up to
  Hounfour.

## Cross-references

- [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  — companion PR review checklist.
- [`docs/handoffs/hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
  — mapping from Straylight primitives to proposed Hounfour
  schema names and file paths.
- [`docs/schema-candidates/README.md`](../schema-candidates/README.md)
  — directory overview (Phase 6 / 7 / 8).
- [`docs/schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md)
  — Phase 6 per-candidate inventory.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant.
- [`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
  — Phase 7 extraction plan with classification and conformance
  bar.
- [`docs/schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
  — Phase 8 conformance-vector pack documentation.
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.2 — architectural recommendation that motivates the
  extraction.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface.
- [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
  — 12 current-shape JSON examples (PR-A test inputs).
- [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
  — 12 conformance vectors (PR-A test inputs).
