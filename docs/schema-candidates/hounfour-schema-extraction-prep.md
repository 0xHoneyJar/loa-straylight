# Hounfour schema extraction prep — candidate inventory

> Status: Phase 6. Pre-extraction prep, in-repo only. None of these
> entries are canonical Hounfour schemas; see
> [`README.md`](./README.md) for what this directory is and is not.

This document inventories every Straylight Recall Wedge primitive that
is a candidate for future extraction into `loa-hounfour` as a canonical
class-validation schema. For each candidate it records:

- **current source file** — where the type lives in this repo today
- **purpose** — one sentence on what the type means
- **stability** — Phase 5 freeze status (`stable shape`, `additive only`,
  `internal-receipt`, `runtime-only`)
- **kind** — which validation lane the type belongs to
  (`class-validation`, `policy-validation`, `audit/receipt`,
  `runtime-only`, `composite`)
- **eventually moves to Hounfour** — yes / no / partial
- **stays in loa-straylight** — what (if anything) the wedge keeps after
  extraction

The architecture spec that motivates this inventory is
[`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
§6.2.2 (Hounfour Straylight schema namespace).

## How to read the kind column

| Kind | Meaning |
|---|---|
| `class-validation` | Structural shape of an artifact entering or living in the estate. "Is this object legible?" Hounfour-owned candidate. |
| `policy-validation` | Decision artifact produced by the policy engine. "Was this move allowed now?" Stays in loa-straylight. |
| `audit/receipt` | Immutable, content-addressed record of *what happened*. Schema can move to Hounfour; the chained log behavior stays in the wedge. |
| `runtime-only` | Implementation detail (seam, helper, internal config). Does not need a canonical schema. Stays in loa-straylight. |
| `composite` | Mixes class fields and policy/audit fields; extraction requires splitting the type into a class part and a runtime part. |

## Candidates

### Actor

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `Actor` |
| Purpose | Identity record for an estate-owning entity (agent, user, community, repo assistant, demo dNFT actor). |
| Stability | Stable shape since Phase 1; `actor_type` enum is additive. |
| Kind | `class-validation` |
| Moves to Hounfour | Yes — full type, including `ActorType` and `ActorStatus` enums. |
| Stays in loa-straylight | Nothing. The wedge re-imports from Hounfour after extraction. |

### ActorEstate

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `ActorEstate` |
| Purpose | Persistent state-of-record container for an actor: status, keyring ref, policy ref, audit log ref, optional state root + public anchor refs. |
| Stability | Stable shape since Phase 1; `EstateStatus` enum is additive. |
| Kind | `class-validation` |
| Moves to Hounfour | Yes — full type, including `EstateStatus` enum. |
| Stays in loa-straylight | Nothing structural. Storage adapter behavior over `ActorEstate` rows stays here. |

### Assertion

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `Assertion`; class-shape rules in [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) `validateCandidateAssertion` + `classSpecificChecks`. |
| Purpose | A signed, typed statement about the estate. Carries body, hash, provenance, status, and signatures. |
| Stability | Stable since Phase 1. `AssertionClass`, `AssertionStatus`, `PrivacyScope`, `RiskLevel` enums are additive only. |
| Kind | `class-validation` (Assertion shape) and `composite` (the `status` field is set by transitions, not by the writer). |
| Moves to Hounfour | Yes — full structural type, plus `CandidateAssertion` (the pre-admission shape). |
| Stays in loa-straylight | Status-mutation rules (admit / challenge / revoke / forget effects on `status`) live in [`src/straylight/estate.ts`](../../src/straylight/estate.ts) and stay here. |

### AssertionStatus

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `AssertionStatus`. Enum membership is checked in [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) `ASSERTION_STATUSES`. |
| Purpose | Lifecycle state of an Assertion: `proposed` / `active` / `contested` / `demoted` / `revoked` / `forgotten_from_recall` / `superseded` / `sealed`. |
| Stability | Additive only. Removing a status is a breaking change. |
| Kind | `class-validation` (the enum shape) — but only state transitions in [`src/straylight/estate.ts`](../../src/straylight/estate.ts) and [`src/straylight/policy.ts`](../../src/straylight/policy.ts) are allowed to change a status. |
| Moves to Hounfour | Yes — the enum. |
| Stays in loa-straylight | The transition matrix (which transitions can produce which next status) stays runtime, in `EstateStore`. |

### SignatureEnvelope

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `SignatureEnvelope`. Class-validator pinning in [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) `validateSignatureEnvelope`. |
| Purpose | Signature-bearing record: signer id, signer type, signature type, payload hash, signature string, timestamp, key ref. Required on every estate-writing artifact. |
| Stability | Stable since Phase 1; `SignatureType` enum is additive. The `dev_signature` member is **explicitly development-only** (see [`src/straylight/signatures.ts`](../../src/straylight/signatures.ts)). |
| Kind | `class-validation` |
| Moves to Hounfour | Yes — the shape and the `SignerType` / `SignatureType` enums. |
| Stays in loa-straylight | Verification logic (`verifyDevSignature`, `verifyEnvelopeSelfConsistency`, the HMAC-SHA256 dev implementation) stays here. Hounfour ships only the shape. |

### Keyring

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `Keyring`, `SignerEntry`, `SignerCompetenceRule`. Competence evaluation in [`src/straylight/keyring.ts`](../../src/straylight/keyring.ts). |
| Purpose | Per-estate registry of signers + rules describing which roles are competent for which transitions, with optional quorum / timelock / human-review constraints. |
| Stability | Shape stable since Phase 3 (when quorum/timelock/review fields landed). The competence evaluator is policy-side and not part of the candidate. |
| Kind | `class-validation` (Keyring shape) + `runtime-only` (evaluator). |
| Moves to Hounfour | Partial — `Keyring`, `SignerEntry`, `SignerCompetenceRule` data types move; `evaluateCompetence` does not. |
| Stays in loa-straylight | `evaluateCompetence`, `resolveSigner`, `isSignerCurrentlyValid`, and any rule-matching specificity heuristic stay in the wedge. |

### PolicyDecision

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `PolicyDecision`, `PolicyDecisionOutcome`, `SignerCompetenceResult`. Producers in [`src/straylight/policy.ts`](../../src/straylight/policy.ts). |
| Purpose | Output of policy validation: outcome (`allow` / `deny` / `needs_review` / `allow_with_redaction` / `allow_marked_only`), policy id + version, signer competence trace, reasons, optional next actions. |
| Stability | Stable shape since Phase 3. New decision outcomes are additive. |
| Kind | `policy-validation` (decision artifact); the *shape* could be re-used cross-repo, but the **production** of these decisions is the wedge's responsibility. |
| Moves to Hounfour | Partial — Hounfour may host the *type* so cross-repo consumers can read decisions; the wedge keeps the producers. |
| Stays in loa-straylight | All `policyForX(...)` functions and the `safeRun` fail-closed wrapper stay. **Hounfour must never produce a `PolicyDecision`.** |

### EstateTransition

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `EstateTransition`. Producers in [`src/straylight/estate.ts`](../../src/straylight/estate.ts) `buildTransition`. |
| Purpose | Append-only record of an attempted estate move: type, target refs, class-validation result, policy decision, signatures, audit-event ref. |
| Stability | Stable since Phase 3. `transition_type` enum is additive. |
| Kind | `audit/receipt` (immutable record of what happened). |
| Moves to Hounfour | Yes — the structural type. The wedge keeps writing transitions; Hounfour standardizes the wire shape. |
| Stays in loa-straylight | Authoring and append-only semantics stay in `EstateStore`. |

### Challenge

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `Challenge`, `ChallengeType`, `ChallengeRequestedEffect`. Authoring in [`src/straylight/estate.ts`](../../src/straylight/estate.ts) `EstateStore.challenge`. |
| Purpose | A signed contestation of an existing assertion, naming a `challenge_type` and a `requested_effect` (`mark_contested` / `demote` / `revoke` / `forget_from_recall` / `seal` / `human_review`). |
| Stability | Stable since Phase 1. Both enums are additive. |
| Kind | `class-validation` |
| Moves to Hounfour | Yes — full type and both enums. |
| Stays in loa-straylight | The effect-application logic on the target assertion (`status` mutation, `challenged_by_refs` linking) stays here. |

### Revocation

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `Revocation`. Authoring in [`src/straylight/estate.ts`](../../src/straylight/estate.ts) `EstateStore.revoke`. |
| Purpose | A signed direct-revocation record: target assertion id + reason + signatures. Distinct from a challenge with `requested_effect: revoke`. |
| Stability | Stable since Phase 3 (forget vs revoke split). |
| Kind | `class-validation` |
| Moves to Hounfour | Yes — full type. |
| Stays in loa-straylight | The status-flip + `revoked_by_ref` linking stay here. |

### RecallRequest

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `RecallRequest`, plus enums `EnvironmentFrame`, `ReceiptDetailLevel`, `RiskLevel`. Class-validator in [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) `validateRecallRequest`. |
| Purpose | Signed request for governed recall: actor + estate + task + frame + risk + filters + receipt detail level. |
| Stability | Stable shape since Phase 1. New filter fields are additive. |
| Kind | `class-validation` |
| Moves to Hounfour | Yes — full type plus `EnvironmentFrame` and `ReceiptDetailLevel` enums. |
| Stays in loa-straylight | Recall execution (`executeRecall`), disposition rules (`dispositionFor`, `privacyDispositionForFrame`), and per-frame policy lifts (`needs_review` for public-frame high-risk recalls) stay here. |

### RecallPack

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `RecallPack`, `RecallItem`, `RecallUseInstruction`, `RedactionSummary`, `ExclusionSummary`. Producer in [`src/straylight/recall.ts`](../../src/straylight/recall.ts) `executeRecall`. |
| Purpose | The output of governed recall: included items + marked items + redaction + exclusion summaries + the policy decision + a content-addressed `pack_hash`. |
| Stability | Stable since Phase 1. `RecallUseInstruction` enum is additive. |
| Kind | `audit/receipt` (immutable artifact). |
| Moves to Hounfour | Yes — full type. |
| Stays in loa-straylight | Pack assembly order (§11.6: prefilter → retrieval → postfilter → assembly) is the wedge's responsibility, not Hounfour's. |

### RecallReceipt

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `RecallReceipt`. Producer in [`src/straylight/recall.ts`](../../src/straylight/recall.ts) `executeRecall` + `redactReceipt`. |
| Purpose | The audit artifact for a recall: filters applied, included/marked id lists, redaction counts, exclusion counts by reason, pack hash, receipt hash, detail level. |
| Stability | Stable since Phase 1. |
| Kind | `audit/receipt` |
| Moves to Hounfour | Yes — full type. |
| Stays in loa-straylight | Detail-level redaction (`minimal` strips ids; `standard` and `debug` differ in inclusion) stays here. The wedge owns *how* the receipt is built; Hounfour owns *what* it looks like. |

### AuditEvent

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `AuditEvent`, `AuditEventType`. Producer in [`src/straylight/audit.ts`](../../src/straylight/audit.ts) `AuditLog.append`. |
| Purpose | Append-only, hash-chained audit-log entry per estate. Carries `previous_audit_hash` + `audit_hash` for integrity verification (`verifyChain`). |
| Stability | Stable since Phase 1. `AuditEventType` enum is additive. |
| Kind | `audit/receipt` |
| Moves to Hounfour | Partial — the type and event-type enum can move. The chained-hash semantics are runtime-only. |
| Stays in loa-straylight | `AuditLog.append`, `getAuditTail`, `verifyChain` are wedge-owned. Hounfour cannot produce or rewrite audit events. |

### CommitmentRoot

| Field | Value |
|---|---|
| Current source | [`src/straylight/types.ts`](../../src/straylight/types.ts) `CommitmentRoot`. Producer in [`src/straylight/commitment.ts`](../../src/straylight/commitment.ts) `computeCommitmentRoot` + `commitmentForRecallReceipt`. |
| Purpose | Local-only deterministic root over a set of estate refs + payload summaries, signed by `created_by`. The seam for a future onchain anchor adapter. |
| Stability | Stable since Phase 1. `commitment_type` enum is additive. |
| Kind | `audit/receipt` (immutable) — and `runtime-only` for the publishing path (which does not exist yet). |
| Moves to Hounfour | Yes — the structural type. |
| Stays in loa-straylight | `computeCommitmentRoot` and the local hashing strategy stay. **Onchain publishing is reserved future work and is explicitly NOT part of Phase 6.** |

## Out-of-scope for Phase 6

The following primitives are mentioned in the architecture spec
(§6.2.2) but are **not** Phase 6 candidates because they have no
runtime presence in the wedge yet:

- `PublicAnchorRecord` — no public-anchor adapter exists; nothing to
  freeze.
- `FeedbackSignal` and `EvaluationResult` — present as
  `AssertionClass` enum members and `ProvenanceSourceType` enum
  members, but there is no dedicated artifact type yet. Candidate for
  later phase, not Phase 6.
- `Demotion` — handled today as a `Challenge` with
  `requested_effect: demote`. There is no standalone `Demotion`
  type. Candidate for later phase if a standalone type is introduced.
- `ForgetRecord` — already exists in [`src/straylight/types.ts`](../../src/straylight/types.ts);
  it parallels `Revocation`. Treated as covered by the `Challenge`
  inventory entry above (it can be admitted via challenge with
  `forget_from_recall` effect or directly via `EstateStore.forget`).
  When forget gets its own canonical schema, append a row above.

When Hounfour extraction actually ships, this section gets re-litigated
in the same change as the schema move — not in the wedge.

## Stability & change discipline

Until extraction:

- **Additive enum changes** (new `AssertionClass`, new
  `EnvironmentFrame`, new `AuditEventType`, etc.) are fine.
- **Removing or renaming** a field, an enum member, or a top-level
  type listed above is a *breaking* change; it requires a wedge phase
  bump and an explicit note here.
- **Class-validator-side drift** (changes to
  `validateCandidateAssertion` or `validateRecallRequest`) must be
  reflected in the corresponding fixture under
  [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/) so
  the fixture remains a faithful current-shape example.
