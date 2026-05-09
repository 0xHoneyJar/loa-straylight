# Recall Wedge MVP — conformance-vector matrix

> Status: Phase 23A. **Docs-only conformance-vector matrix, in
> `loa-straylight`.** This document does **not** author any
> schema, fixture, or test. It enumerates the eleven MVP
> conformance vectors the Recall Wedge MVP must distinguish — at
> the lane on which each vector is meant to be decided — and
> records, per vector, the schema(s) it exercises, the expected
> outcome, the matching ADR / Phase-21B / Phase-22A pin, and the
> Phase 23A status. It is the conformance-side input that a
> future Phase 23B (or later) implementation branch would
> scaffold against — not the scaffold itself.
>
> Phase 23A does **not** flip any wedge import, change `package.json`
> / `package-lock.json`, change the Hounfour dependency range or
> resolved patch, modify
> [`../../src/straylight/`](../../src/straylight/), modify any
> script under [`../../scripts/`](../../scripts/), wire Finn /
> Dixie / Freeside runtime, add a Dixie endpoint, add a Finn
> endpoint, edit any sibling repo, implement `Challenge` locally,
> implement `EstateTransition` locally, reach into unexported
> Hounfour internals, add a `safeCanonicalize` subpath import,
> publish a public commitment root, add a network surface, change
> persistence, add or modify any test, add or modify any fixture,
> author any TypeBox / JSON Schema, **file** any GitHub issue or
> comment, or touch `.loa/` / `.claude/` / `.beads/` / `.run/` /
> `.github/`. It does **not** commit and does **not** open a PR.
>
> Companion docs: [`recall-wedge-schema-contract.md`](./recall-wedge-schema-contract.md),
> [`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md),
> [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md),
> [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md),
> [`../schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
> (the Phase 8 precursor at the schema-candidate layer; this
> Phase 23A doc is the MVP-level companion at the wedge
> contract layer),
> [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md).

## What this matrix is

Phase 8 staged twelve **schema-candidate-layer** conformance
vectors at
[`../schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
under
[`../../fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/).
Those vectors target **future Hounfour validators** at the four
lanes (`class_validation` / `policy_validation` /
`audit_validation` / `keyring_validation`) and remain the
load-bearing input for an eventual Hounfour-side adoption PR.

Phase 23A's conformance vectors are at a **different layer**:
they target the **wedge MVP contract** as a whole. Each vector
names the schema(s) it exercises, the lane(s) on which the
decision must be made, the expected outcome at the wedge level,
and (for runtime-blocked vectors) the Hounfour gate it currently
sits behind. They are the eleven scenarios the Recall Wedge MVP
must distinguish before any Phase 23B implementation branch
opens — the same set the Phase 23A handoff packet summarizes.

The MVP-level vectors do **not** replace the Phase 8 vectors.
They sit on top of them: a Phase 23B (or later) implementation
that scaffolds the schema-side contract still owes the Phase 8
schema-candidate fixtures their existing per-lane separation
(see "Layer separation" below).

## Status taxonomy (re-pinned from the schema-contract spec)

Identical to
[`recall-wedge-schema-contract.md`](./recall-wedge-schema-contract.md)
§ "Status taxonomy", restated here so this doc is readable
standalone:

| Status | Meaning |
|---|---|
| **shipped upstream** | The vector exercises a Hounfour v8.6.0 schema confirmed exported under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/<name>`. The wedge can describe the vector's schema-side input as upstream substrate; **adoption** of the schema into the wedge public surface remains gated by ADR-022E gate #4. |
| **safe draft** | The vector exercises a Straylight-owned shape with a stable local contract that Phase 23B (or later) can scaffold against. |
| **blocked** | The vector requires either `EstateTransition` on the wire (Hounfour delta #8 still queued) or `safeCanonicalize` on the wire (gate `no-confirmed-subpath`). The vector is described in this matrix but cannot be exercised at the wire level until the gate fires. |
| **deferred** | The vector is an explicit ADR-022E gate; not unblocked by Phase 23A and not scheduled by Phase 23B. |
| **discovery note** | The vector exercises a primitive (notably `AuditEvent`) whose canonical name is **not** confirmed in v8.6.x; an *adjacent* upstream shape exists but **must not be renamed** into the canonical name without confirmation. |

## Layer separation (re-pinned from the class-vs-policy boundary)

Per [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
and the Phase 8 vector pack, every vector is decided on **one**
named lane. The lanes never collapse:

| Lane | Decides |
|---|---|
| `class_validation` | Structural shape of an artifact entering the estate. *"Is this object legible?"* |
| `policy_validation` | Decision artifact produced by the policy engine over an already-class-valid input. *"Was this move allowed now?"* Always emitted by `loa-straylight`, never by Hounfour / Finn / Dixie / Freeside. |
| `audit_validation` | Chain integrity of the audit log. *"Does this `audit_hash` recompute?"* Independent of class shape. |
| `keyring_validation` | Signer competence. *"Is this signer on-keyring **and** role-competent for this transition?"* Independent of signature self-consistency. |

A vector's expected outcome is the answer **the named lane**
gives. A vector that is class-valid and policy-denied resolves
on `policy_validation` — recording it as a `class_validation`
failure would flatten a layer.

## The eleven MVP conformance vectors

Each row below records the vector's intended scenario, the
schema(s) it exercises, the lane(s) on which the decision is
made, the expected outcome at the wedge MVP, the matching ADR /
Phase-21B / Phase-22A pin, and the Phase 23A status.

| # | Vector | Schemas exercised | Lane(s) | Expected outcome at wedge MVP | Pin | Phase 23A status |
|---|---|---|---|---|---|---|
| 1 | Valid observation admission | `Assertion`, `SignatureEnvelope`, `Keyring`, `PolicyDecision`, `AuditEvent`, `EstateTransition` | `class_validation` → `keyring_validation` → `policy_validation` → `audit_validation` | Class-valid; signer on-keyring and competent; `policyForAdmitAssertion` returns `allow`; admission produces an `EstateTransition` and an `AuditEvent` chain entry; the resulting `Assertion` is eligible for inclusion in subsequent `RecallPack`s. | ADR-020A; ADR-022A; ADR-020D §6 (six receipt categories — *included*); Phase 8 `valid-assertion.json`. | safe draft *(observation admission is local; class shape MATCH against Hounfour `assertion`)* |
| 2 | Invalid missing provenance | `Assertion`, `SignatureEnvelope` | `class_validation` | Class-invalid: `provenance` is missing or its required sub-fields are absent. The admission lane rejects on shape **before** the policy / keyring / audit lanes run. No `EstateTransition` is produced; an `AuditEvent` denial entry records the class-validation failure with the per-field reason. | ADR-022D §6 (Phase 5 hardening "structural validity is not authorization"); Phase 8 `invalid-assertion-*.json` family. | safe draft |
| 3 | Valid reflection but not identity promotion | `Assertion` (with `assertion_class: reflection`), `PolicyDecision` | `class_validation` → `policy_validation` | Class-valid reflection. The policy lane admits it as a reflection but **does not promote it to identity** — `assertion_class: reflection` cannot, in the same admission, be re-classified as `assertion_class: identity_claim`. The decision is `allow` for admission *as-reflection*; identity-promotion would require a separate `EstateTransition` with its own competence trace. | ADR-020A (semantic owner); ADR-022A; the Phase 6 `AssertionClass` enum freeze in [`../schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md); the assertion-status transition matrix in [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts) (read-only). | safe draft |
| 4 | Revoked assertion excluded from recall | `RecallRequest`, `RecallPack`, `RecallReceipt`, `Assertion` *(target with `assertion_status: revoked`)*, `AuditEvent` | `class_validation` → `policy_validation` → `audit_validation` | The `RecallRequest` is class-valid and policy-allowed; the target assertion is revoked. The pack assembly's `dispositionFor` routes the target to *exclusion*, not inclusion. The `RecallReceipt` records the exclusion with reason `revoked` (one of the six ADR-020D receipt categories). The audit chain records the recall and the exclusion. The pack `pack_hash` matches the receipt `pack_hash`. | ADR-020D §6 (*excluded* category, reason `revoked`); the Phase 20B per-category receipt-pin test in [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts) (read-only); the Phase 5 hardening receipt-or-audit completeness contract in [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts) (read-only). | safe draft |
| 5 | Private assertion excluded from public Discord recall | `RecallRequest` *(with `environment_frame: public_discord`)*, `RecallPack`, `RecallReceipt`, `Assertion` *(target with `privacy_scope: private`)*, `PolicyDecision` | `class_validation` → `policy_validation` | The `RecallRequest` is class-valid; the policy lane consults `privacyDispositionForFrame` and routes the private-scope target to *exclusion* in the public_discord frame (or, depending on the per-frame lift, marks-only with redaction). The receipt records the exclusion / redaction with reason `private_scope_in_public_frame`. No private body content reaches the public-frame pack. | ADR-020D §6 (*excluded* / *redacted* categories); the per-frame policy lift in [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts) `dispositionFor` / `privacyDispositionForFrame` (read-only); ADR-022B §3 (public-channel exposure as MVP-host criterion). | safe draft |
| 6 | Contested assertion marked or excluded by policy | `RecallRequest`, `RecallPack`, `RecallReceipt`, `Assertion` *(target with `assertion_status: contested`)*, `Challenge`, `PolicyDecision` | `class_validation` → `policy_validation` | The class-valid recall against an estate that contains a contested assertion routes the target to either *marked* (with a `RecallUseInstruction` the consumer must surface) or *excluded* depending on `risk_level` and `environment_frame`. The receipt records the disposition with reason `contested`. The `Challenge` that produced the `contested` status is reachable from the audit chain. | ADR-020D §6 (*challenged* category — wedge MVP shape pin); the contested-status transition matrix in [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts) (read-only). | safe draft |
| 7 | Unknown signer denied | `Assertion` *(or any signer-bearing carrier)*, `SignatureEnvelope`, `Keyring` | `class_validation` → `keyring_validation` → `policy_validation` | The class-validation lane accepts the carrier and the envelope (shape is well-formed; `payload_hash` matches; `signature` is well-formed for the named `signature_type`). The keyring lane rejects: `signer_id` is **not** in the estate's `Keyring` `signer_entries`. The policy lane records `signer_unknown` and the decision is `deny`. No `EstateTransition` is produced; an `AuditEvent` denial entry records the lane on which the rejection occurred. | [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md) §2 (the *"valid signature is signer competence"* conflation refusal); Phase 8 `keyring-signer-competent.json` *(the positive sibling)*. | safe draft |
| 8 | Valid signer but not competent denied | `Assertion` *(or any signer-bearing carrier)*, `SignatureEnvelope`, `Keyring` *(with the rule that does **not** include the signer's role in `required_signer_roles`)* | `class_validation` → `keyring_validation` → `policy_validation` | Class-validation accepts. The keyring lane resolves `signer_id` to a known `SignerEntry`, but `evaluateCompetence` returns *not competent* — the matched `SignerCompetenceRule.required_signer_roles` does **not** include the signer's role for this transition type. The policy lane records `signer_incompetent` and the decision is `deny`. No `EstateTransition` is produced; the audit chain records the per-lane denial. | [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md) §2; Phase 8 `keyring-signer-incompetent.json`. | safe draft |
| 9 | `Challenge` accepted from Hounfour v8.6 shipped schema | `Challenge`, `Assertion` *(target)*, `SignatureEnvelope`, `Keyring`, `PolicyDecision`, `EstateTransition` *(or denial path)*, `AuditEvent` | `class_validation` → `keyring_validation` → `policy_validation` | A class-valid `Challenge` whose **shape is described by the upstream `challenge.schema.json`** (newly resolved at v8.6.0; Phase 16 delta #7 closed) is admitted at the structural lane. The keyring lane checks competence for the `challenge` transition type. The policy lane decides whether to apply the `requested_effect`. **Adoption of `challenge.schema.json` into the wedge public surface is *not* required for this vector** — the vector pins that the upstream shape *can* describe a structurally valid wedge `Challenge`, not that the wedge re-exports the Hounfour symbol. Adoption remains an ADR-022E gate #4 event. | Phase 21B Q1 (newly resolved MATCH at v8.6.0; `challenge.schema.json` shipped); ADR-022E gate #4; ADR-020C / ADR-022A (adoption-not-rename). | shipped upstream *(shape; adoption gated)* |
| 10 | `EstateTransition` deferred | `EstateTransition` | (none — vector is **gated**, not exercised) | The wedge MVP cannot put an `EstateTransition` on a cross-repo wire because Hounfour delta #8 (`estate-transition.schema.json`) remains queued in v8.6.x. Locally, the wedge continues to author `EstateTransition` rows from [`../../src/straylight/types.ts`](../../src/straylight/types.ts) (read-only at Phase 23A); no Hounfour-shaped envelope is added; no sibling endpoint accepts the local shape as canonical. The matching gate is the *deferral* itself: the conformance bar is that **no MVP integration silently uses a Hounfour shape that does not exist**. | Phase 21B Q4 (runtime-integration blocker); ADR-022B §4 (a wiring requiring `EstateTransition` on the wire must not proceed until delta #8 fires); ADR-022E gate #1; the posted Hounfour status comment for issue #70. | blocked / deferred |
| 11 | `safeCanonicalize` absent exported subpath | *(none — the gate is on a Hounfour utility, not a Recall Wedge primitive)* | (none — vector is **gated**, not exercised) | The wedge MVP cannot import a Hounfour `safeCanonicalize` because the v8.6.0 `exports` map declares no `./canonicalize` and no `./utilities` subpath. Importing from package root is forbidden (Phase 16 delta #9), and reaching into unexported internals (`dist/utilities/`) is forbidden by the user-facing Phase 17B / 18 / 21A constraint. Locally, the wedge continues to canonicalize via [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts) (read-only at Phase 23A). The matching gate is the *deferral* itself: **no MVP integration silently reaches into unexported Hounfour internals**. | Phase 21B Q4 (runtime-integration blocker; gate `no-confirmed-subpath`); ADR-022B §5 (a wiring requiring `safeCanonicalize` on the wire must not proceed until a confirmed exported subpath ships); ADR-022E gate #2; the posted Hounfour status comment for issue #70. | blocked / deferred |

## Per-vector schema cross-reference

For convenience: which v8.6.0-confirmed Hounfour schema (if any)
is *available as upstream substrate* for each vector. **Substrate
availability does not imply adoption** — see the schema-contract
spec § "Status taxonomy".

| Vector | Hounfour schema(s) available as substrate (8.6.0 `$id`s) | Notes |
|---|---|---|
| 1 — valid observation admission | `assertion`, `agent-identity`, `agent-estate`, `keyring` | `PolicyDecision` is wedge-only by design. `EstateTransition` is unavailable (delta #8). `AuditEvent` is wedge-local (DISCOVERY_NOTE at the canonical name). |
| 2 — invalid missing provenance | `assertion` | Pure shape failure; lane is `class_validation`. |
| 3 — valid reflection, not identity promotion | `assertion` *(MATCH for both `assertion_class: reflection` and `assertion_class: identity_claim` shapes)* | Class promotion is a wedge runtime decision; substrate is the same shape. |
| 4 — revoked assertion excluded from recall | `assertion` *(target as `assertion-revoked` MATCH)*, `recall-request`, `recall-pack`, `recall-receipt` | Wedge-side `dispositionFor` is what excludes; substrate covers shape. |
| 5 — private assertion excluded from public_discord recall | `assertion`, `recall-request`, `recall-pack`, `recall-receipt`, `privacy-scope`, `surface-context` | Per-frame policy lift is wedge-side. |
| 6 — contested assertion marked or excluded | `assertion`, `challenge`, `recall-request`, `recall-pack`, `recall-receipt` | `challenge` substrate is newly v8.6.0-resolved; adoption is gated. |
| 7 — unknown signer denied | `assertion`, `keyring` | Signer self-consistency is shape (class); signer presence is keyring. |
| 8 — valid signer but not competent denied | `assertion`, `keyring` | Same substrate as vector 7; the difference is the rule match. |
| 9 — `Challenge` accepted from v8.6 shipped schema | `challenge` *(newly resolved at v8.6.0)*, `assertion` *(target)*, `keyring` | Substrate available; adoption gated by ADR-022E gate #4. |
| 10 — `EstateTransition` deferred | *(none)* | Substrate **absent** (delta #8 queued). Vector is the gate. |
| 11 — `safeCanonicalize` absent exported subpath | *(none — the gate is on a Hounfour JS utility subpath, not a schema)* | The v8.6.0 `exports` map declares no `./canonicalize` / `./utilities`. Vector is the gate. |

## What this matrix does *not* claim

For symmetry with the Phase 22A non-claims and so a reviewer
cannot misread Phase 23A as authorization for Phase 23B
implementation, this matrix explicitly does **not** claim:

- **Not** "any vector is implemented as a fixture or test."
  Phase 23A authors no JSON file under
  [`../../fixtures/`](../../fixtures/) and no test file under
  [`../../tests/`](../../tests/).
- **Not** "any vector justifies adopting a Hounfour schema."
  Vector 9 in particular demonstrates that the *upstream
  shape* exists; **adoption is a separate ADR** per
  ADR-022E gate #4.
- **Not** "vectors 10 and 11 are unblocked by the posted
  Hounfour status comment." The comment was posted before
  Phase 23A as a status request; it does **not** constitute
  an answer.
- **Not** "the four wedge lanes can be collapsed for
  convenience." The
  [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  pin remains binding: each vector is decided on its named
  lane.
- **Not** "Phase 23B is authorized to scaffold any of these
  vectors as runtime tests." Phase 23B's allowable shape is
  the next-phase recommendation in the Phase 23A handoff
  packet, not authorization.
- **Not** "any sibling endpoint accepts any of these vectors."
  No Finn / Dixie / Freeside endpoint exists per ADR-022B.

## Cross-references

- [`recall-wedge-schema-contract.md`](./recall-wedge-schema-contract.md)
  — the per-object MVP schema contract this matrix exercises.
- [`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md)
  — Phase 23A summary handoff (blockers / non-blockers /
  next-phase recommendation).
- [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md)
  — Phase 22A MVP decision-lock.
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
  — Phase 21B v8.6 schema-readiness lock (Q1 / Q2 / Q4 used
  throughout).
- [`../handoffs/hounfour-v86-shadow-inspection-output.txt`](../handoffs/hounfour-v86-shadow-inspection-output.txt)
  — Phase 21A v8.6.x shadow inspection output.
- [`../handoffs/hounfour-v86-status-comment-draft.md`](../handoffs/hounfour-v86-status-comment-draft.md)
  — Hounfour status comment for issue #70 (drafted in
  Phase 22A; posted before Phase 23A).
- [`../schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
  — Phase 8 schema-candidate-layer conformance vectors (the
  load-bearing precursor pack at the schema layer).
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — the load-bearing class-vs-policy invariant.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
  [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  — Phase 20A semantic-owner and six-receipt-category locks.
- [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md),
  [`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md),
  [`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md),
  [`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md),
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — Phase 22A decision-lock series (gates #1 / #2 / #4 / #5
  used throughout).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
  [`../../src/straylight/types.ts`](../../src/straylight/types.ts),
  [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts),
  [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts),
  [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  — wedge implementation (read-only at Phase 23A).
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts),
  [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — existing wedge tests (read-only at Phase 23A; the
  receipt-or-audit completeness and per-category receipt
  pins this matrix references).
