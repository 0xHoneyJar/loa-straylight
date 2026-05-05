# Class validation vs policy validation — boundary contract

> Status: Phase 6. Pre-extraction prep. The wedge already enforces this
> boundary at runtime; this document pins it in writing so future
> Hounfour extraction does not blur the line.

The Straylight Recall Wedge keeps two validation lanes strictly
separate:

- **Class validation** answers a single question:
  > Is this object structurally valid?
- **Policy validation** answers a single question:
  > Is this actor / signer / transition allowed *now*?

These two questions look similar from a distance and become identical
in worse memory systems. The wedge keeps them apart because **collapse
of class into policy, or policy into class, is the failure mode that
makes "valid input" indistinguishable from "authorized action."** The
Hounfour extraction targets the class lane only; the policy lane stays
in `loa-straylight` permanently.

## Where the lanes live in the code

| Lane | Code | Inputs | Outputs |
|---|---|---|---|
| Class validation | [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) (`validateCandidateAssertion`, `validateRecallRequest`) | The candidate object **only**. Never the keyring, never the estate, never `now`. | `ClassValidationResult` — `{ valid, schema_id, schema_version, errors[] }`. |
| Policy validation | [`src/straylight/policy.ts`](../../src/straylight/policy.ts) (`policyForAdmitAssertion`, `policyForTransition`, `policyForRecallRequest`); [`src/straylight/keyring.ts`](../../src/straylight/keyring.ts) (`evaluateCompetence`); [`src/straylight/recall.ts`](../../src/straylight/recall.ts) (`dispositionFor`) | Class-validated candidate **plus** keyring, estate state, `now`, and signature material. | `PolicyDecision` — `{ decision, signer_competence_result, reasons[], required_next_actions?, decided_at }`. |

The wedge enforces the lane in two ways at runtime:

1. **Order.** [`src/straylight/policy.ts`](../../src/straylight/policy.ts)
   `admitInner` short-circuits on
   `!input.class_validation.valid` — policy never re-checks structure.
   `executeRecall` calls `validateRecallRequest` first and refuses to
   run policy if class validation fails.
2. **Inputs.** Class validators close over the candidate only; they
   take no `Keyring`, no `now`, no estate handle. Try to add one and
   the type signature changes, which is the seam this document
   defends.

## The four "no-go" conflations

These are the four ways class and policy collapse into one another in
worse systems. The wedge rejects each one in code and in test.

### 1. Valid JSON is not authorized action

**Wrong.** "If the request parses, do the thing."

**Right.** A `RecallRequest` with `actor_id`, `estate_id`,
`environment_frame: 'public_discord'`, `risk_profile: 'critical'`, and
a syntactically perfect `signature` envelope is **structurally valid**
and **policy-denied** in the wedge. The class validator returns
`{ valid: true }`; `policyForRecallRequest` returns
`needs_review` because public-frame high-risk recalls require a
reviewer co-sign (see [`src/straylight/policy.ts`](../../src/straylight/policy.ts)
`recallInner`'s `publicHighRiskNeedsReview` branch).

**Test pin.** [`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
asserts that recall requests missing `actor_id` / `estate_id` fail
class validation. [`tests/policy-unavailable.test.ts`](../../tests/policy-unavailable.test.ts)
asserts that requests with no matching competence rule deny with
`policy_unavailable_for_transition`.

### 2. Valid signature is not signer competence

**Wrong.** "Signature verifies → caller is authorized."

**Right.** A `dev_signature` envelope can verify against its own
`key_ref + signed_payload_hash` (`verifyEnvelopeSelfConsistency`
returns `{ valid: true }`) and still be denied because:

- The signer is not on the keyring → `unknown_signer:<id>`.
- The signer is on the keyring but `status: 'revoked'` →
  `signer_status_revoked`.
- The signer is valid but the role is not in the matched rule's
  `required_signer_roles` → `signer_role_not_competent:<role>`.
- The signer is valid and the role is competent, but the rule has
  `quorum: 2` and only one matching signature is present →
  `quorum_not_met:2:1`.
- The signer is valid, the role is competent, but the rule has
  `requires_human_review: true` and no `reviewer` co-signed →
  `requires_human_review:<context>` (decision = `needs_review`).

These all live in [`src/straylight/keyring.ts`](../../src/straylight/keyring.ts)
`evaluateCompetence`, which runs **after** signature self-consistency
has already passed.

**Test pin.** [`tests/signer-fail-closed.test.ts`](../../tests/signer-fail-closed.test.ts)
covers unknown signer / revoked key / role-not-competent.
[`tests/quorum-and-timelock.test.ts`](../../tests/quorum-and-timelock.test.ts)
covers quorum and timelock denials. [`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
asserts unknown-signer fails competence even when the envelope is
internally consistent.

### 3. Structurally valid recall request is not automatically allowed recall

**Wrong.** "Recall request parses → return everything that matches the
filters."

**Right.** Even after class validation passes and signer competence
clears, the wedge applies `dispositionFor` to **every candidate
assertion** before placing it in the pack. Disposition rules in
[`src/straylight/policy.ts`](../../src/straylight/policy.ts)
short-circuit with no override available to the caller:

- `revoked` and `forgotten_from_recall` are excluded outside
  `audit_review`. Inside `audit_review` they surface as `marked` only,
  with `use_instruction !== 'usable'`.
- `sealed` is excluded outside `audit_review`; inside it, redacted.
- `actor_private` is excluded from `public_discord` /
  `public_telegram` / `private_chat` frames.
- `tenant` is `redact`-ed in public frames.
- `contested` is **always** marked, regardless of whether
  `contested ∈ mark_statuses`. The caller cannot turn this off.
- High / critical risk profile excludes assertions whose only
  provenance is `model_output` (`provenance_insufficient_for_high_risk`).

A class-valid `RecallRequest` whose filters match a thousand
assertions can therefore return zero `included` items. That is the
correct behavior, not a bug.

**Test pin.** [`tests/recall-exclusion.test.ts`](../../tests/recall-exclusion.test.ts),
[`tests/recall-contested-marking.test.ts`](../../tests/recall-contested-marking.test.ts),
[`tests/forget-flow.test.ts`](../../tests/forget-flow.test.ts), and
[`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
all pin status- and privacy-driven exclusion / marking even on
class-valid requests.

### 4. Structurally valid assertion is not automatically active truth

**Wrong.** "Admit a class-valid `claim` → recall treats it as fact."

**Right.** Class validation accepts an `Assertion` body shape; that
does not make the assertion `active`. The wedge enforces:

- `runtime`-signed `identity` admissions deny via
  `rule:admit-identity-reviewer-only` (and `forbid_signer_roles:
  ['runtime']`). The class validator says the body is fine; policy
  rejects on competence.
- A candidate whose **only** provenance is `model_output` and whose
  class is `identity` / `permission` / `commitment` returns
  `needs_review` (`needsReviewForModelOutput` in
  [`src/straylight/policy.ts`](../../src/straylight/policy.ts)).
  Inference is not fact.
- A successfully admitted assertion that is later challenged with
  `mark_contested` flips to `status: 'contested'`. The body is
  unchanged and structurally identical, but the recall layer now marks
  it `mark_as_contested` per `useInstructionForMark`. Same shape, no
  longer "active truth."
- A successfully admitted assertion that is revoked has its `status`
  flipped to `revoked` and is excluded from every frame except
  `audit_review` (and even there, marked-only).

The shape is unchanged across these states. The *authority* of the
assertion is set by transitions, not by the writer.

**Test pin.** [`tests/class-vs-policy-validation.test.ts`](../../tests/class-vs-policy-validation.test.ts)
is the explicit acceptance test: it asserts that class validation
passes on objects that policy then denies, and that policy never
re-runs structural checks. [`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
adds the unknown-class / unknown-signer fail-closed pair.

## What this means for Hounfour extraction

When the schema-extraction work later moves the candidates listed in
[`hounfour-schema-extraction-prep.md`](./hounfour-schema-extraction-prep.md)
into `loa-hounfour`, **Hounfour gets the class lane and only the
class lane**:

- Hounfour owns the *structural* shape of `Actor`, `ActorEstate`,
  `Assertion`, `Keyring`, `SignatureEnvelope`, `Challenge`,
  `Revocation`, `RecallRequest`, `RecallPack`, `RecallReceipt`,
  `EstateTransition`, `AuditEvent`, `CommitmentRoot`.
- Hounfour **must not** ship `evaluateCompetence`, `policyForX`,
  `dispositionFor`, `verifyEnvelopeSelfConsistency`,
  `AuditLog.verifyChain`, `EstateStore` transition logic, or any
  per-environment-frame rule.
- Hounfour **must not** produce a `PolicyDecision`. It may host the
  *type* so cross-repo readers can deserialize a wedge-produced
  decision, but the engine that *makes* decisions stays in
  `loa-straylight`.
- A change to a class shape in Hounfour is an *additive enum
  change* or a *new optional field* by default. Removals or renames
  require a wedge change in the same wave.

The architecture spec calls this out at
[§6.2.2](../architecture/loa-straylight-product-system-architecture-spec.md):
> Hounfour should own class validation and schema conformance. It
> should not own runtime policy enforcement by itself.

This document is the local rendering of that constraint, kept next to
the inventory it pins.
