# Finn runtime boundary — what Finn owns and what it does not

> Status: Phase 10. **Pre-integration handoff packet, in
> `loa-straylight` only.** This document defines the boundary
> between Hounfour's class lane, Straylight's wedge, and Finn's
> runtime gate. **It is not Finn integration.** Nothing here
> imports from `loa-finn`, edits any sibling repo, adds a Finn
> dependency, or changes Phase 0–9 runtime behavior.

## The three lanes

| Lane | Owner | Responsibility |
|---|---|---|
| **Class lane** | `loa-hounfour` (post-Phase 9). Until Hounfour ships, `loa-straylight` owns it. | Canonical schema / class-validation vocabulary. *"Is this object structurally legible?"* |
| **Primitive lane** | `loa-straylight` permanently. | Primitive semantics, local wedge behavior, fail-closed defaults, deterministic content addressing, and the public API surface that downstream consumers import. |
| **Runtime lane** | `loa-finn` after consuming stable contracts. | Per-call admission, per-tool recall gating, per-transition policy evaluation, signer competence, transition execution, receipt emission, audit-chain persistence, and recall-request execution boundaries — under fail-closed semantics. |

The lanes are **separable in code, in test, and in test fixture**.
Collapsing any two of them re-creates a known failure mode (see
[`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)).

## What Finn should eventually own

Finn's runtime-enforcement module (`loa-finn/src/straylight/`,
proposed in
[`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
§6.2.3) is the runtime gate that sits in front of every governed
call.

### Runtime policy decisions

Finn evaluates `policyForAdmitAssertion`, `policyForTransition`,
and `policyForRecallRequest` on every governed call and treats the
returned `PolicyDecision` as binding. `allow_with_redaction` is
not the same as `allow`; `allow_marked_only` is not the same as
`allow`; `needs_review` holds the transition until a competent
human signer signs.

The policy lane lives in code at `src/straylight/policy.ts` today.
Finn's runtime module imports those entry points (or their
post-extraction successor) directly — Finn does not re-implement
them.

### Signer competence checks

Finn evaluates `evaluateCompetence` for every signer involved in
every governed call. The competence check is independent of
signature verification: a signature whose envelope is
self-consistent (`verifyEnvelopeSelfConsistency` passes) is **not**
proof of competence. Both gates clear, in that order, before any
transition is admitted.

Finn's runtime module wires production signature material
(ed25519 / secp256k1 / HMAC over real key material) but invokes
the wedge's competence evaluator on the resulting envelope.

### Transition gating and execution

Finn applies transitions through the wedge's `EstateStore`
(or its post-extraction successor), never by writing directly to
storage. Every applied transition produces a `TransitionReceipt`
(`admission` / `challenge` / `revocation` / `forget` / `denied`)
and a chained `AuditEvent`. Bypassing `EstateStore` skips the
receipt and the audit chain — Finn must not.

### Receipt emission

For every served recall, Finn emits a `RecallReceipt` whose
`pack_hash` and `receipt_hash` are content-addressed and whose
`detail_level` is applied **after** the pack is built. Serving a
recall without a receipt is a runtime bug.

For every applied / denied transition, Finn emits a
`TransitionReceipt`. The receipt is the audit artifact that ties
the move to the moving signer.

### Audit-chain persistence

Finn persists every `AuditEvent` durably (Postgres / WAL /
equivalent — not in-process memory). Each event's `audit_hash`
covers the prior event's hash per estate (the wedge's
`AuditLog.append` discipline). Finn provides
`verifyChain(estate_id)` and runs it after every recovery and
migration.

### Recall-request execution

Finn runs `executeRecall` (or its post-extraction successor) and
respects the `included` / `marked` / `redacted` discipline.
Retrievers (vector / keyword / graph) plug in *behind* the
prefilter, never above. The pack's `pack_hash` reproduces
deterministically.

## What Finn must not own

The list below is the inverse of "what Finn owns." Each item
maps to a no-go boundary that must hold even when Finn is
heavily invested in the runtime gate.

### Finn must not define canonical schema semantics alone

**Why.** The class lane lives in Hounfour (post-Phase 9). The
canonical shape of an `Assertion`, `RecallRequest`,
`RecallReceipt`, `AuditEvent`, `CommitmentRoot`, and every enum
is published once, by Hounfour, and consumed by every downstream
runtime. If Finn unilaterally defines a new `AssertionClass`
member or renames a `TransitionType`, two consumers (Finn and a
non-Finn caller) will disagree on shape, and the audit chain
across the boundary becomes unverifiable.

**How to apply.** Finn imports the schema. Finn does not
republish it. New enum members go through Hounfour. Until
Hounfour ships, Finn imports `types.ts` from
`loa-straylight` directly and the same constraint applies (no
Finn-side re-author).

### Finn must not treat model output as authority

**Why.** Model output is provenance, not signing material. A
candidate whose only `provenance[]` is `model_output` and whose
`assertion_class` is `identity` / `permission` / `commitment`
already routes to `needs_review` per
`policy.ts.needsReviewForModelOutput`. Treating model output as
authority re-creates the inference-as-fact failure mode the
wedge exists to prevent.

**How to apply.** When Finn signs an observation derived from a
model trace, the signed `provenance[]` carries `model_output`.
The runtime gate routes that candidate through the policy lane;
the policy lane decides. Finn does not short-circuit.

### Finn must not treat valid JSON as authorized transition

**Why.** Class validation answers structural legibility. Policy
validation answers authorization. Both lanes run, in that order,
for every governed call. A `RecallRequest` may class-validate
cleanly and still be policy-denied; an `Assertion` may
class-validate cleanly and still be denied admission by an
incompetent signer.

**How to apply.** Finn's runtime gate runs class →
policy → competence → transition / recall, always in that
order. A class pass is necessary but never sufficient.

### Finn must not bypass keyring / signer competence

**Why.** A signature whose envelope is self-consistent
(`verifyEnvelopeSelfConsistency` returns true) is **not** proof
the signer is competent for the requested transition. The
competence check (role match, quorum, timelock, human-review,
revocation status) is an independent gate.

**How to apply.** Finn's runtime gate calls
`evaluateCompetence` (or its post-extraction successor) for
every transition and respects the resulting reason
(`unknown_signer:<id>`, `signer_not_currently_valid`,
`signer_role_forbidden:<role>`,
`no_competence_rule_for_transition`). A `forbid_signer_roles`
match still denies even if the signer is otherwise valid.

### Finn must not perform recall without receipt output

**Why.** A recall response without a receipt is ungoverned RAG.
The receipt is the audit artifact that ties the served pack to
the request and the request to its caller; without it, the audit
chain cannot show *what was served*. The wedge's discipline is
"every served pack has a receipt"; a runtime that breaks that
invariant is not a Straylight runtime.

**How to apply.** Finn's recall path computes the
`RecallReceipt` deterministically, persists it durably, and
makes it retrievable by `receipt_id`. A pack assembled but not
receipted is rolled back (or, equivalently, refused).

### Finn must not execute action / commitment transitions without policy validation

**Why.** The promotion chain
`memory → belief → instruction → plan → permission → action →
commitment → permanence` is governed; each step requires its
own competent signer and its own policy decision. Skipping
policy validation on the action / commitment legs collapses the
chain into raw memory-as-action — exactly what Straylight exists
to prevent.

**How to apply.** For every action and commitment transition,
Finn runs `policyForTransition` with the current keyring and
`now`. The decision is binding. `needs_review` holds the
transition; no fallback to `allow` is permitted.

## Boundary violations and what they look like

The table below names the most likely failure modes and ties
each one to the wedge test (or threat-model row) that pins the
boundary today. Finn's runtime module MUST reproduce the
equivalent pin in its own test suite.

| Violation | Boundary breached | Wedge test that pins it |
|---|---|---|
| Finn promotes a model-output reflection into a `claim` without reviewer co-sign | `model output is not authority` | `tests/class-vs-policy-validation.test.ts` (reflection promotion needs reviewer); `policy.ts.needsReviewForModelOutput` |
| Finn admits a `RecallRequest` that class-validates but lacks a competent caller | `valid JSON is not authorized action` | `tests/class-vs-policy-validation.test.ts`; `tests/signer-fail-closed.test.ts` |
| Finn admits an `identity` assertion signed only by a runtime | `valid signature is not signer competence` | `tests/signer-fail-closed.test.ts` (runtime cannot admit identity); `tests/quorum-and-timelock.test.ts` |
| Finn returns a `RecallPack` without persisting a `RecallReceipt` | `recall must produce a receipt` | `tests/transition-receipts.test.ts`; `tests/audit-and-receipt.test.ts` |
| Finn includes a `revoked` assertion as `usable` in any frame | `revoked is excluded outside audit_review` | `tests/recall-exclusion.test.ts`; `tests/phase-5-hardening.test.ts` (T3) |
| Finn includes a `forgotten_from_recall` assertion as `usable` in any frame | `forgotten is excluded outside audit_review` | `tests/forget-flow.test.ts`; `tests/phase-5-hardening.test.ts` (T4) |
| Finn includes a `contested` assertion as `usable` in any frame | `contested is always marked, never usable` | `tests/recall-contested-marking.test.ts`; `tests/phase-5-hardening.test.ts` (T11) |
| Finn writes an `AuditEvent` whose `audit_hash` does not chain to the prior event | `audit log is append-only and chained` | `tests/audit-and-receipt.test.ts`; `tests/phase-5-hardening.test.ts` (T9) |
| Finn defaults to `allow` when no competence rule matches | `missing policy fails closed` | `tests/policy-unavailable.test.ts`; `tests/phase-5-hardening.test.ts` (T8) |
| Finn anchors a commitment whose `root_hash` cannot be reproduced | `commitment over substituted estate fails` | `tests/audit-and-receipt.test.ts`; `tests/phase-5-hardening.test.ts` (T12) |

## Why this boundary matters

The wedge is small and in-process by design. Its small size is
the source of its trust: every primitive can be read, every test
can be run locally, every receipt can be reproduced. When Finn
takes over the runtime lane, the trust property must travel with
the primitives — not stay behind in the wedge.

Two failure modes show up if the boundary is not held:

1. **Drift.** Finn re-implements a primitive (a competence
   evaluator, a disposition matrix, a commitment hasher) and
   the two implementations diverge. Now the wedge and Finn
   disagree on whether a transition is allowed; the audit
   chain across the boundary is unverifiable.
2. **Authority creep.** Finn invents a new
   `EnvironmentFrame` or `AssertionClass` to serve a runtime
   need. Hounfour does not know about it; Dixie does not know
   about it; the eval harness flags every new value as an
   unknown enum member. The schema lane is no longer a single
   source of truth.

The boundary doc here exists so Finn's PR-A reviewer can refuse
both at the gate.

## Reference: the wedge's stable public surface

Finn's runtime module imports from
[`src/straylight/index.ts`](../../src/straylight/index.ts) only.
Anything not re-exported there is internal to the wedge and may
change without notice. The public surface, in summary:

| Group | Symbols |
|---|---|
| Types | All primitive types per `package-boundary.md` §1 |
| IDs / canonical | `canonicalize`, `sha256`, `shortHash`, `contentId`, `payloadHash`, `makeIdSource` |
| Signatures (dev) | `devSign`, `devSignatureFor`, `verifyDevSignature`, `verifyEnvelopeSelfConsistency`, `assertionSignedPayload`, `recallSignedPayload`, `DEV_SIGNATURE_PREFIX` |
| Class validation | `validateCandidateAssertion`, `validateRecallRequest` |
| Keyring / competence | `resolveSigner`, `isSignerCurrentlyValid`, `evaluateCompetence`, `listActiveSignerRoles` |
| Policy | `policyForAdmitAssertion`, `policyForTransition`, `policyForRecallRequest`, `dispositionFor`, `PolicyEngineError`, `DEFAULT_POLICY_ID`, `DEFAULT_POLICY_VERSION` |
| Audit | `AuditLog` |
| Estate / transitions | `EstateStore` (and its `admit` / `challenge` / `revoke` / `forget` methods) |
| Recall | `executeRecall` |
| Commitment | `computeCommitmentRoot`, `commitmentForRecallReceipt` |
| Storage | `InMemoryStorage`, `JsonlStorage`, `loadBundle`, `saveBundle`, `StorageAdapter`, `EstateBundle` |

Finn's production runtime swaps the storage adapter for a
Postgres / WAL implementation that satisfies
`tests/storage-conformance.test.ts`, replaces `dev_signature` with
real signature material, and otherwise calls the wedge's public
API as published.

## Cross-references

- [`docs/handoffs/finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md)
  — Phase 10 issue handoff for `loa-finn`.
- [`docs/handoffs/finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
  — Phase 10 mapping table from Straylight transitions to Finn
  enforcement points.
- [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — Phase 9 issue handoff for `loa-hounfour` (class lane).
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.3, §22.4, §23.2 — architectural decisions that motivate
  the Finn runtime module.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  fail-closed defenses Finn's runtime gate must preserve.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant. The runtime gate
  enforces the policy lane; it does not collapse the boundary.
- [`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/)
  — nine current-shape JSON examples (Finn PR-A test inputs).
