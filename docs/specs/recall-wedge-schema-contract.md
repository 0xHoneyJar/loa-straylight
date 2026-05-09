# Recall Wedge MVP — schema-contract draft

> Status: Phase 23A. **Docs-only schema-contract draft, in
> `loa-straylight`.** This document does **not** author any
> schema, edit any source file, run any code path, or change any
> sibling repo. It enumerates the minimum MVP object set the
> Recall Wedge requires and, for each object, records purpose,
> minimum required fields, class-validation role, policy-validation
> relationship, signer/keyring relationship, recall/audit
> relationship, current status against Hounfour v8.6.0, and the
> likely future Hounfour schema name *or* the Straylight-local
> contract name. It is the schema-side input that a future Phase
> 23B (or later) implementation branch would scaffold against —
> not the scaffold itself.
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
> Companion docs: [`recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md),
> [`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md),
> [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md),
> [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md),
> [`../handoffs/hounfour-v86-shadow-inspection-output.txt`](../handoffs/hounfour-v86-shadow-inspection-output.txt),
> [`../handoffs/hounfour-v86-status-comment-draft.md`](../handoffs/hounfour-v86-status-comment-draft.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md),
> [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md),
> [`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md),
> [`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md),
> [`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md),
> [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md),
> [`../schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md),
> [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md).

## Status taxonomy

Every object below is tagged with one of the following statuses.
Phase 23A pins the taxonomy so the Phase 23A handoff and the
companion conformance-vector spec can use the same words without
re-litigating them.

| Status | Meaning |
|---|---|
| **shipped upstream** | A Hounfour v8.6.0 schema under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/<name>` is confirmed exported (per Phase 21B Q1 and the Phase 21A v8.6.x shadow inspection output). The schema *shape* is upstream substrate; **adoption** into the wedge's public surface is still gated by ADR-022E gate #4 (separate ADR per ADR-020C / ADR-022A / ADR-022C). Phase 23A does **not** adopt any. |
| **safe draft** | Straylight-owned shape with a stable local contract that Phase 23B (or later) can scaffold against without flipping a Hounfour import. Includes objects whose canonical *type* may eventually move to Hounfour but whose *production* remains wedge-owned per ADR-020A / ADR-022A / ADR-020D / ADR-022D. |
| **blocked** | A Hounfour gate must fire before this object can move to the wire. Used for runtime paths that would require either `EstateTransition` on the wire (delta #8 still queued) or `safeCanonicalize` on the wire (gate `no-confirmed-subpath`). |
| **deferred** | An explicit ADR-022E gate. The object is **not** unblocked by Phase 23A and **not** scheduled by Phase 23B. The trigger to unblock is recorded in ADR-022E. |
| **discovery note** | A v8.6.x export exists with a name that is *adjacent* but not the canonical name the Straylight contract uses. The resolution path (rename, request a Hounfour-side schema under the canonical name, or re-classify against the adjacent shape) is a later-phase decision per Phase 21B Q4. **Adjacent schemas must not be renamed into the Straylight-local name without confirmation.** |

The taxonomy intentionally separates **shape availability**
(upstream substrate exists) from **adoption authorization**
(wedge public surface re-exports it). Per ADR-020C and the
posted Hounfour status comment for issue #70, even a
*shipped-upstream* object is **not** auto-adopted into the public
surface; adoption is a separate, ADR-gated event.

## How to read each object row

For each object Phase 23A records:

- **Purpose** — one sentence on what the object means.
- **Minimum required fields** — the smallest field set the Recall
  Wedge MVP needs the object to carry to be useful at the
  semantic / class-validation / receipt layer. **This is not a
  schema; it is the field-set commitment Phase 23B implementation
  would have to honor.** Field names are taken from
  [`../../src/straylight/types.ts`](../../src/straylight/types.ts)
  where the wedge already names them, or proposed where it does
  not.
- **Class-validation role** — does the object carry a structural
  shape that a class-validation lane (`validateCandidateAssertion`
  / `validateRecallRequest` / equivalent) admits or rejects? If
  yes, the role is `class-validation`. If the object is *only* a
  decision artifact, the role is `policy-validation`. If the
  object is *only* an immutable record of what happened, the role
  is `audit/receipt`. (Per
  [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md),
  these lanes never collapse.)
- **Policy-validation relationship** — what does the policy
  engine do *with* this object (consume it, produce it, gate
  another object on it)? `PolicyDecision` is **always** produced
  by the wedge per ADR-020A / ADR-022A — never by Hounfour, never
  by Finn, never by Dixie, never by Freeside. The policy lane
  reads inputs and emits a `PolicyDecision`; consumers may then
  apply or surface it but must never re-mint one.
- **Signer / keyring relationship** — does the object require a
  `SignatureEnvelope`? Is it scoped by a `Keyring` entry? Does
  competence evaluation gate its acceptance? "Required signature"
  means a `SignatureEnvelope` *of* the object is necessary for
  admission; "scoped by keyring" means a `Keyring` entry must
  resolve before the policy lane can decide on it.
- **Recall / audit relationship** — does the object enter a
  `RecallPack`? Does its admission, exclusion, redaction,
  challenge, or revocation produce a `RecallReceipt` row? Does
  it generate an `AuditEvent` chain entry? Does it appear in the
  Phase 5 hardening receipt-or-audit completeness contract?
- **Current status** — one of `shipped upstream` / `safe draft` /
  `blocked` / `deferred` / `discovery note`.
- **Likely future Hounfour schema name** *or* **Straylight-local
  contract name** — the upstream `$id` shape (under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/<name>`)
  when a v8.6.x export confirms it; otherwise the
  Straylight-local export name from
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  / [`../../src/straylight/types.ts`](../../src/straylight/types.ts).

## The 14 MVP objects

The MVP object set Phase 22A pinned (ADR-022D §3 receipt-and-audit
shape ownership) plus the bridge primitives the Phase 5 hardening
invariants require:

```
Actor → ActorEstate → Assertion → SignatureEnvelope → Keyring →
PolicyDecision → EstateTransition → Challenge → Revocation →
RecallRequest → RecallPack → RecallReceipt → AuditEvent →
(optional) CommitmentRoot
```

`PolicyDecision` is wedge-owned and never produced by a sibling
or by Hounfour. `EstateTransition` is **blocked** (Hounfour
delta #8). `safeCanonicalize` is **not** an MVP object — it is a
Hounfour utility subpath this contract is **gated against** (see
the conformance-vectors spec for the matching vector).

### 1. Actor

| Field | Value |
|---|---|
| Purpose | Identity record for an estate-owning entity (agent, user, community, repo assistant, demo dNFT actor). |
| Minimum required fields | `actor_id` (stable identifier); `actor_type` (enum from `ActorType`); `actor_status` (enum from `ActorStatus`); `created_at`. |
| Class-validation role | `class-validation`. The shape is consumed by the admission lane to bind an `Assertion` / `RecallRequest` / `Challenge` to a known actor; an unknown `actor_id` denies before the policy lane runs. |
| Policy-validation relationship | Read-only input. `policyForRecallRequest` and `policyForAdmitAssertion` resolve the actor before deciding. Never produced by the policy lane. |
| Signer / keyring relationship | An `Actor` carries no signature itself, but every `Keyring` is scoped to one `actor_id`; every `SignatureEnvelope` ultimately resolves to an `Actor` via the `Keyring`'s signer entries. |
| Recall / audit relationship | The `actor_id` on a `RecallRequest` is matched against the requesting actor; an unknown / inactive actor short-circuits with `denied_unknown_actor` before pack assembly. The actor does **not** appear directly in `AuditEvent` payloads (the `EstateTransition` / `RecallReceipt` they produce do). |
| Current status | **shipped upstream** (alias rename established v8.5.x). |
| Likely future Hounfour schema name | `agent-identity` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/agent-identity`). Adoption into the wedge public surface as `Actor` is a separate ADR per ADR-020C (alias / re-export, not rename). |

### 2. ActorEstate

| Field | Value |
|---|---|
| Purpose | Persistent state-of-record container for an actor: status, keyring ref, policy ref, audit-log ref, optional state root, optional public-anchor ref. |
| Minimum required fields | `estate_id`; `actor_id`; `estate_status` (enum from `EstateStatus`); `keyring_ref`; `policy_ref`; `audit_log_ref`; `created_at`; optional `state_root_ref`. |
| Class-validation role | `class-validation`. The estate is the boundary the wedge admits assertions / recalls *into*. An invalid or missing `estate_id` denies before the policy lane runs. |
| Policy-validation relationship | Read-only input. `policyForTransition` reads the estate's status (e.g. an `archived` estate cannot admit new active assertions). Never produced by the policy lane. |
| Signer / keyring relationship | The estate's `keyring_ref` resolves to the `Keyring` that scopes signer competence for every transition that targets this estate. |
| Recall / audit relationship | Every `EstateTransition` and every `RecallReceipt` carries the `estate_id`. `AuditEvent` chain integrity (`previous_audit_hash` → `audit_hash`) is **per estate**. |
| Current status | **shipped upstream** (EXTEND established v8.5.x). |
| Likely future Hounfour schema name | `agent-estate` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/agent-estate`). Adoption into the wedge public surface as `ActorEstate` is a separate ADR per ADR-020C. |

### 3. Assertion

| Field | Value |
|---|---|
| Purpose | A signed, typed statement about the estate. Carries body, hash, provenance, status, signatures. |
| Minimum required fields | `assertion_id`; `estate_id`; `assertion_class` (enum from `AssertionClass`); `assertion_status` (enum from `AssertionStatus`); `body`; `body_hash`; `provenance` (sub-record with at least `source_type`, `source_ref`, `created_at`); `signatures` (array of `SignatureEnvelope`); `privacy_scope`; `risk_level`. |
| Class-validation role | `class-validation`. `validateCandidateAssertion` is the admission gate; missing `provenance` or unknown `assertion_class` rejects on shape, not policy. |
| Policy-validation relationship | The policy lane decides admission via `policyForAdmitAssertion`. It reads the candidate plus the resolved keyring competence, then emits a `PolicyDecision`. Status mutations (`admitted` → `contested` → `revoked` → `forgotten_from_recall`) are policy-lane outputs applied through transitions, **never** writer-set on the candidate. |
| Signer / keyring relationship | `signatures` is required; each `SignatureEnvelope` resolves through the estate's `Keyring`, and competence (`evaluateCompetence`) is checked per the matched rule (`required_signer_roles`). |
| Recall / audit relationship | Admitted assertions are eligible for inclusion in `RecallPack` items; status transitions are recorded in `EstateTransition` (which produces `AuditEvent` rows). `revoked` and `forgotten_from_recall` assertions are excluded from recall and recorded as exclusions in `RecallReceipt`. |
| Current status | **shipped upstream** (MATCH). |
| Likely future Hounfour schema name | `assertion` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/assertion`). Adoption is a separate ADR per ADR-020C. |

### 4. SignatureEnvelope

| Field | Value |
|---|---|
| Purpose | Signature-bearing record carried on every estate-writing artifact: signer id, signer type, signature type, payload hash, signature string, timestamp, key ref. |
| Minimum required fields | `signer_id`; `signer_type` (enum); `signature_type` (enum); `payload_hash`; `signature`; `signed_at`; `key_ref`. |
| Class-validation role | `class-validation`. `validateSignatureEnvelope` checks shape and self-consistency (`payload_hash` matches the carrier's body hash; `signature` is well-formed for the named `signature_type`). |
| Policy-validation relationship | Self-consistent shape is **not** authorization. The policy lane separately consults the `Keyring` to confirm the signer is on-keyring and the signer's role is competent for the transition. The conformance-vectors spec pins this separation. |
| Signer / keyring relationship | The envelope's `signer_id` and `key_ref` are looked up in the estate's `Keyring`; the lookup result is what the policy lane consumes. |
| Recall / audit relationship | A missing or self-inconsistent envelope on an `Assertion` / `Challenge` / `Revocation` / `RecallRequest` rejects on class-validation; a self-consistent envelope from an unknown / incompetent signer rejects on policy-validation; either rejection produces a denial trace in `AuditEvent` and (for `RecallRequest`) an exclusion summary in `RecallReceipt`. |
| Current status | **safe draft** (Straylight-owned; verification logic is wedge-private per ADR-020A and the Phase 6 candidate inventory). |
| Likely future Hounfour schema name *or* Straylight-local | Straylight-local: `SignatureEnvelope` from [`../../src/straylight/index.ts`](../../src/straylight/index.ts). No v8.6.0 `signature-envelope.schema.json` is exported in the Phase 21A shadow inspection output. The HMAC-SHA256 development implementation in [`../../src/straylight/signatures.ts`](../../src/straylight/signatures.ts) stays wedge-private; only shape would migrate, by future separate ADR. |

### 5. Keyring

| Field | Value |
|---|---|
| Purpose | Per-estate registry of signer entries plus rules describing which roles are competent for which transitions, with optional quorum / timelock / human-review constraints. |
| Minimum required fields | `keyring_id`; `estate_id`; `signer_entries` (array of `SignerEntry` with at least `signer_id`, `signer_role`, `key_ref`, `valid_from`, optional `valid_until`); `competence_rules` (array of `SignerCompetenceRule` with at least `transition_type` matcher, `required_signer_roles`, optional `quorum_n`, `timelock_seconds`, `requires_human_review`). |
| Class-validation role | `class-validation`. The shape of the registry is structurally validated; rule evaluation is runtime / policy-side. |
| Policy-validation relationship | The policy lane consumes the keyring through `evaluateCompetence`, `resolveSigner`, `isSignerCurrentlyValid`. Rule-matching specificity is **wedge runtime** per the Phase 6 / 7 inventory — Hounfour ships the shape, not the evaluator. The evaluator never moves to Hounfour. |
| Signer / keyring relationship | This is the keyring. `SignatureEnvelope` resolution pivots on it. |
| Recall / audit relationship | Keyring lookups appear inline in `PolicyDecision.signer_competence_result` traces; the keyring itself does not enter `RecallPack` items. Keyring updates (rotate / revoke / extend) are themselves transitions that produce `EstateTransition` + `AuditEvent` rows. |
| Current status | **shipped upstream** (MATCH). |
| Likely future Hounfour schema name | `keyring` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/keyring`). Adoption into the wedge public surface as `Keyring` is a separate ADR per ADR-020C. The evaluator and rule-matching specificity heuristic remain Straylight-private per ADR-020A / ADR-022A. |

### 6. PolicyDecision

| Field | Value |
|---|---|
| Purpose | Output of policy validation: outcome, policy id + version, signer-competence trace, reasons, optional next actions. |
| Minimum required fields | `decision_id`; `outcome` (enum from `PolicyDecisionOutcome`: `allow` / `deny` / `needs_review` / `allow_with_redaction` / `allow_marked_only`); `policy_id`; `policy_version`; `signer_competence_result`; `reasons` (array); `decided_at`; optional `next_actions`. |
| Class-validation role | `policy-validation`. The shape is *carried* across surfaces but **never** mistaken for a class-shape candidate. The conformance-vectors spec pins this collapse refusal: a `PolicyDecision` payload must not carry top-level `assertion_id` / `body` / `body_hash` / `pack_hash` / `receipt_hash` / `audit_hash`. |
| Policy-validation relationship | This is the produced output. **Loa-Straylight is the sole producer** per ADR-020A / ADR-022A / [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md). Hounfour does not produce; Finn / Dixie / Freeside *consume* and *surface*, never re-mint. |
| Signer / keyring relationship | The decision's `signer_competence_result` is the keyring evaluator's verdict for the transition under review; this trace is the auditable record of *why* the decision came out as it did. |
| Recall / audit relationship | A `RecallPack`'s policy decision is recorded in the `RecallReceipt`; an admission `PolicyDecision` is recorded on the resulting `EstateTransition`. Every `PolicyDecision` is reachable by id from an `AuditEvent`. |
| Current status | **safe draft** (Straylight-owned; never produced upstream). The *type* is in scope for an eventual Hounfour shape so cross-repo readers can deserialize one — but production stays in the wedge per ADR-022D. |
| Likely future Hounfour schema name *or* Straylight-local | Straylight-local: `PolicyDecision` from [`../../src/straylight/index.ts`](../../src/straylight/index.ts). A future Hounfour `policy-decision` schema is **not** in v8.6.0; the deferred candidate `policy-decision-denied` is `DEFERRED` per Phase 21B Q3 / ADR-022E gate #6. |

### 7. EstateTransition

| Field | Value |
|---|---|
| Purpose | Append-only record of an attempted estate move: type, target refs, class-validation result, policy decision, signatures, audit-event ref. |
| Minimum required fields | `transition_id`; `estate_id`; `transition_type` (enum); `target_refs`; `class_validation_result`; `policy_decision_id`; `signatures` (array of `SignatureEnvelope`); `audit_event_ref`; `applied_at`. |
| Class-validation role | `class-validation` for shape; `audit/receipt` for the immutability contract. |
| Policy-validation relationship | A transition's `policy_decision_id` references the producing `PolicyDecision`. A transition is only persisted when the decision is `allow` / `allow_with_redaction` / `allow_marked_only`; `deny` and `needs_review` outcomes do not produce a transition (they produce an `AuditEvent` denial entry only). |
| Signer / keyring relationship | Every transition carries `signatures`; the producing `PolicyDecision` records the keyring-competence trace. |
| Recall / audit relationship | A successful transition produces exactly one `AuditEvent` row in the estate's chain. The Phase 5 hardening receipt-or-audit completeness contract requires that every transition is reachable from at least one of `TransitionReceipt` / `AuditEvent`. |
| Current status | **blocked** *(for runtime use on the wire)* / **deferred** *(for Hounfour adoption)*. Hounfour delta #8 (`estate-transition.schema.json`) remains queued in v8.6.x. ADR-022E gate #1 unblocks only when Hounfour ships the schema **and** a separate ADR adopts it under ADR-020C / ADR-022C. The posted Hounfour status comment for issue #70 asks for status; Phase 23A does **not** assume an answer. |
| Likely future Hounfour schema name *or* Straylight-local | Straylight-local for now: `EstateTransition` from [`../../src/straylight/index.ts`](../../src/straylight/index.ts). Likely future Hounfour name (per Phase 16 delta #8 and Phase 21B Q4): `estate-transition` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.x/estate-transition`). **Not** authored by Phase 23A; **not** scaffolded by Phase 23B until the gate fires. |

### 8. Challenge

| Field | Value |
|---|---|
| Purpose | A signed contestation of an existing assertion, naming a `challenge_type` and a `requested_effect` (`mark_contested` / `demote` / `revoke` / `forget_from_recall` / `seal` / `human_review`). |
| Minimum required fields | `challenge_id`; `target_assertion_id`; `challenge_type` (enum); `requested_effect` (enum); `body`; `body_hash`; `provenance`; `signatures` (array of `SignatureEnvelope`); `created_at`. |
| Class-validation role | `class-validation`. The challenge is admitted by structural validation independent of whether the policy lane will *grant* the requested effect. |
| Policy-validation relationship | The policy lane decides whether to apply the requested effect (mutate the target assertion's status, link `challenged_by_refs`, escalate to human review). The wedge owns the effect-application logic per the Phase 6 candidate inventory; the schema *shape* is upstream substrate. |
| Signer / keyring relationship | Every challenge carries `signatures`; signer competence is evaluated against the keyring's rule for `challenge` transitions. An incompetent challenger fails the policy lane regardless of class-validation success. |
| Recall / audit relationship | A challenge's accepted effect can flip the target assertion to `contested` (excluded-or-marked in recall per the wedge's `dispositionFor` rule), `demoted`, `revoked`, or `forgotten_from_recall`. Each accepted effect produces an `EstateTransition` and an `AuditEvent` row. The challenge itself is *also* an entity the receipt can reference as the cause of a marked / excluded item. |
| Current status | **shipped upstream** (newly resolved at v8.6.0; Phase 16 delta #7 schema-level closure). **Adoption** into the wedge's public surface is **not** authorized — ADR-022E gate #4 still gates the re-export, so Phase 23A treats the schema as available substrate but does not adopt it. |
| Likely future Hounfour schema name | `challenge` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/challenge`). Adoption is a separate ADR per ADR-020C / ADR-022A. The wedge's effect-application logic stays Straylight-owned. |

### 9. Revocation

| Field | Value |
|---|---|
| Purpose | A signed direct-revocation record: target assertion id + reason + signatures. Distinct from a `Challenge` with `requested_effect: revoke` because the revoker has unilateral revocation authority for the target class. |
| Minimum required fields | `revocation_id`; `target_assertion_id`; `reason`; `signatures` (array of `SignatureEnvelope`); `created_at`. |
| Class-validation role | `class-validation`. Structural validation is independent of policy. |
| Policy-validation relationship | The policy lane confirms the revoker is on-keyring and is role-competent for unilateral revocation of the target class; if not, the revocation is denied (it does **not** silently reduce to a `Challenge`). |
| Signer / keyring relationship | Required signature; required competence per the keyring's revocation rule. Quorum / timelock / human-review constraints from the keyring may apply. |
| Recall / audit relationship | An accepted revocation flips the target to `revoked`, links `revoked_by_ref`, produces an `EstateTransition` and an `AuditEvent` row, and excludes the target from future `RecallPack` items (recorded as an exclusion in `RecallReceipt`). |
| Current status | **safe draft** (covered by the Hounfour `assertion` schema's MATCH disposition for `assertion-revoked`; no separate `revocation.schema.json` is exported in v8.6.x). |
| Likely future Hounfour schema name *or* Straylight-local | Straylight-local: `Revocation` from [`../../src/straylight/index.ts`](../../src/straylight/index.ts). The cross-repo *shape* of a revocation is carried by the Hounfour `assertion` schema with `assertion_status: revoked`; Straylight retains the standalone `Revocation` envelope so revocation-as-an-act is distinguishable from assertion-as-a-thing-with-status. |

### 10. RecallRequest

| Field | Value |
|---|---|
| Purpose | Signed request for governed recall: actor + estate + task + frame + risk + filters + receipt detail level. |
| Minimum required fields | `request_id`; `actor_id`; `estate_id`; `task_intent`; `environment_frame` (enum from `EnvironmentFrame`); `requested_classes`; `risk_level` (enum from `RiskLevel`); `receipt_detail_level` (enum from `ReceiptDetailLevel`); `signatures` (array of `SignatureEnvelope`); `requested_at`. |
| Class-validation role | `class-validation`. `validateRecallRequest` admits / rejects on shape — missing `actor_id`, missing `environment_frame`, unknown `assertion_class` in the requested-classes filter all fail before policy. |
| Policy-validation relationship | `policyForRecallRequest` decides whether the request is allowed, allowed-with-redaction, allowed-marked-only, denied, or needs-review based on actor / estate / frame / risk. Per-frame policy lifts (e.g. `needs_review` for public-frame high-risk recalls) live in the wedge. |
| Signer / keyring relationship | Required signature; required competence per the keyring's `recall_request` rule. An anonymous or unknown-signer request fails the policy lane on `signer_unknown` / `signer_incompetent` regardless of class-validation success. |
| Recall / audit relationship | A successful request produces exactly one `RecallPack` and exactly one `RecallReceipt`. A denied request produces a `RecallReceipt` with no included items and an `AuditEvent` denial row (the Phase 5 hardening "structural validity is not authorization" pin). |
| Current status | **shipped upstream** (MATCH; net-new at v8.5.0, still present in v8.6.x). |
| Likely future Hounfour schema name | `recall-request` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/recall-request`). Adoption into the wedge public surface is a separate ADR per ADR-020C. |

### 11. RecallPack

| Field | Value |
|---|---|
| Purpose | The output of governed recall: included items + marked items + redaction summary + exclusion summary + the policy decision + a content-addressed `pack_hash`. |
| Minimum required fields | `pack_id`; `request_id`; `estate_id`; `included_items` (array of `RecallItem`); `marked_items` (array of `RecallItem` with `RecallUseInstruction`); `redaction_summary` (counts by reason); `exclusion_summary` (counts by reason); `policy_decision_id`; `pack_hash`; `assembled_at`. |
| Class-validation role | `class-validation` for shape; `audit/receipt` for the immutability contract. The pack assembly order (prefilter → retrieval → postfilter → assembly) is wedge runtime, not Hounfour. |
| Policy-validation relationship | The pack carries (by id) the `PolicyDecision` that authorized assembly. Inclusion-vs-mark-vs-exclusion-vs-redaction per item is the wedge's `dispositionFor` runtime; consumers must surface what the wedge decided, not re-decide. |
| Signer / keyring relationship | The pack itself is not signer-bound; its constituent `RecallItem`s reference assertions whose admission was signer-bound. |
| Recall / audit relationship | This is *the* recall artifact. The pack ↔ receipt linkage (every receipt's `pack_hash` matches exactly one pack) is the load-bearing pin from the Phase 20C demo and the Phase 5 hardening tests. |
| Current status | **shipped upstream** (MATCH). |
| Likely future Hounfour schema name | `recall-pack` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/recall-pack`). |

### 12. RecallReceipt

| Field | Value |
|---|---|
| Purpose | The audit artifact for a recall: filters applied, included / marked id lists, redaction counts, exclusion counts by reason, pack hash, receipt hash, detail level. |
| Minimum required fields | `receipt_id`; `request_id`; `pack_hash`; `receipt_hash`; `detail_level` (enum from `ReceiptDetailLevel`); `filters_applied`; `included_ids` (subject to `detail_level`); `marked_ids` (subject to `detail_level`); `redaction_counts`; `exclusion_counts_by_reason`; `policy_decision_id`; `issued_at`. |
| Class-validation role | `class-validation` for shape; `audit/receipt` for the immutability contract. Detail-level redaction (`minimal` strips ids; `standard` and `debug` differ in inclusion) is wedge runtime. |
| Policy-validation relationship | A receipt records the `policy_decision_id` and the per-item disposition counts; a denied request still produces a receipt (with no included items) — the Phase 5 hardening "structural validity is not authorization" pin requires that a denied recall is reflected as a receipt, not as a missing artifact. |
| Signer / keyring relationship | The receipt itself is not signer-bound; consumers cannot re-mint it (the Phase 5 hardening invariants forbid host re-minting per ADR-022D §4). |
| Recall / audit relationship | Six receipt categories from ADR-020D — **included / excluded / redacted / challenged / revoked / blocked-by-policy** — are preserved unchanged. The receipt is the audit-side projection of the pack; the audit chain references the receipt by id. |
| Current status | **shipped upstream** (MATCH). |
| Likely future Hounfour schema name | `recall-receipt` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/recall-receipt`). |

### 13. AuditEvent

| Field | Value |
|---|---|
| Purpose | Append-only, hash-chained audit-log entry per estate. Carries `previous_audit_hash` + `audit_hash` for integrity verification (`verifyChain`). |
| Minimum required fields | `audit_event_id`; `estate_id`; `event_type` (enum from `AuditEventType`); `subject_ref` (the transition / receipt / decision being recorded); `previous_audit_hash`; `audit_hash`; `recorded_at`. |
| Class-validation role | `audit/receipt`. Class-validation pins shape (`audit_hash` is `sha256:`-prefixed; `previous_audit_hash` matches the prior tail); chain validation pins integrity (`audit_hash` recomputes from the canonical payload + `previous_audit_hash`). |
| Policy-validation relationship | The policy lane never produces an `AuditEvent`; it produces `PolicyDecision` rows that are then *recorded* by the audit lane. The audit lane is independent: a chain-tamper failure rejects on `audit_validation`, **not** on `class_validation` (the conformance-vectors spec pins this separation). |
| Signer / keyring relationship | Audit chain entries carry no signature themselves; their integrity is the chained hash. |
| Recall / audit relationship | This **is** the audit relationship. Every `EstateTransition` and every `RecallReceipt` (including denied / excluded / redacted / challenged / revoked / blocked-by-policy categories per ADR-020D) is reachable from an `AuditEvent` by id. The Phase 5 hardening receipt-or-audit completeness contract requires this. |
| Current status | **discovery note** *(at the canonical name)*. v8.6.x ships `audit-trail-entry.schema.json` and `domain-event.schema.json` but **no** `audit-event.schema.json`. The Straylight candidate `audit-event-transition.json` is `DISCOVERY_NOTE`, not `MATCH` / `EXTEND`. ADR-022D treats `AuditEvent` as **Straylight-owned and not adopted** at MVP; ADR-022E gate #5 unblocks adoption only when a separate ADR explicitly adopts one of the v8.6.x candidates **as** the canonical `AuditEvent` shape *or* Hounfour ships a schema under that name. **Adjacent schemas must not be renamed into `AuditEvent` without that confirmation.** |
| Likely future Hounfour schema name *or* Straylight-local | Straylight-local: `AuditEvent` from [`../../src/straylight/index.ts`](../../src/straylight/index.ts). Candidate Hounfour resolution paths (later-phase decision): adopt `audit-trail-entry`; adopt `domain-event`; or request a Hounfour-side `audit-event` schema. The chained-hash semantics (`AuditLog.append`, `AuditLog.verifyChain`) stay wedge-private regardless. |

### 14. CommitmentRoot *(optional)*

| Field | Value |
|---|---|
| Purpose | Local-only deterministic root over a set of estate refs + payload summaries, signed by `created_by`. The seam for a future onchain-anchor adapter — **not** a public-anchor adapter at MVP. |
| Minimum required fields | `commitment_id`; `estate_id`; `commitment_type` (enum from `CommitmentType`); `root_hash`; `member_refs` (array); `created_by`; `created_at`; optional `public_anchor_ref` (deferred; not populated at MVP). |
| Class-validation role | `class-validation` for shape; `audit/receipt` for the immutability contract. |
| Policy-validation relationship | The wedge produces a commitment as a deterministic helper over already-decided artifacts; it does **not** re-decide. The producer is `computeCommitmentRoot` / `commitmentForRecallReceipt`. |
| Signer / keyring relationship | The `created_by` field references the producing actor (signer of the commitment), but at MVP no public-anchor signature is added — public anchoring remains deferred per ADR-020E. |
| Recall / audit relationship | A `CommitmentRoot` over a set of `RecallReceipt`s lets external readers verify pack ↔ receipt linkage without re-running the pipeline. At MVP it is **optional** — pack ↔ receipt linkage is already pinned by `pack_hash` / `receipt_hash`; commitment is the roll-up. |
| Current status | **shipped upstream** *(shape)* / **deferred** *(public anchoring)*. v8.6.x ships `commitment-root.schema.json` and `commitment-type.schema.json`. ADR-020E defers the public-anchor adapter; ADR-022E gate #7 keeps it deferred until a separate ADR opens the public surface. |
| Likely future Hounfour schema name | `commitment-root` (`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/commitment-root`). Adoption into the wedge public surface is a separate ADR. The local hashing strategy stays wedge-private. |

## Summary tables

### One-line per object (semantic owner / status / Hounfour name)

| Object | Semantic owner | Phase 23A status | Hounfour `$id` (if any) under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/` |
|---|---|---|---|
| Actor | Loa-Straylight | shipped upstream | `agent-identity` (alias rename) |
| ActorEstate | Loa-Straylight | shipped upstream | `agent-estate` (EXTEND) |
| Assertion | Loa-Straylight | shipped upstream | `assertion` |
| SignatureEnvelope | Loa-Straylight | safe draft | *(Straylight-local)* |
| Keyring | Loa-Straylight | shipped upstream | `keyring` |
| PolicyDecision | Loa-Straylight | safe draft | *(Straylight-local; never produced upstream)* |
| EstateTransition | Loa-Straylight | blocked / deferred | *(absent in v8.6.x; delta #8 queued)* |
| Challenge | Loa-Straylight | shipped upstream *(adoption gated)* | `challenge` |
| Revocation | Loa-Straylight | safe draft | *(carried by `assertion` MATCH)* |
| RecallRequest | Loa-Straylight | shipped upstream | `recall-request` |
| RecallPack | Loa-Straylight | shipped upstream | `recall-pack` |
| RecallReceipt | Loa-Straylight | shipped upstream | `recall-receipt` |
| AuditEvent | Loa-Straylight | discovery note | *(absent under that name; adjacent: `audit-trail-entry`, `domain-event`)* |
| CommitmentRoot *(optional)* | Loa-Straylight | shipped upstream *(shape)* / deferred *(public anchor)* | `commitment-root` |

### Class-validation vs policy-validation lane assignment

| Lane | Objects |
|---|---|
| `class-validation` | Actor, ActorEstate, Assertion, SignatureEnvelope, Keyring, EstateTransition (shape part), Challenge, Revocation, RecallRequest, RecallPack (shape part), RecallReceipt (shape part), AuditEvent (shape part), CommitmentRoot (shape part) |
| `policy-validation` | PolicyDecision (the **only** decision artifact; never produced by Hounfour / Finn / Dixie / Freeside) |
| `audit/receipt` (immutability + chain integrity) | EstateTransition, RecallPack, RecallReceipt, AuditEvent, CommitmentRoot |
| `keyring-validation` (signer competence) | All signer-bearing carriers — Assertion, Challenge, Revocation, RecallRequest, EstateTransition |

The lanes never collapse. A self-consistent `SignatureEnvelope`
is **not** signer competence. A class-valid `Assertion` /
`RecallRequest` is **not** policy-allowed. A class-valid
`AuditEvent` is **not** chain-valid. The conformance-vectors
spec pins each separation explicitly.

## What this contract does *not* claim

For symmetry with the Phase 22A non-claims and so a reviewer
cannot misread Phase 23A as authorization for Phase 23B
implementation, this contract explicitly does **not** claim:

- **Not** "any schema is authored." Phase 23A authors no
  TypeBox / JSON Schema. The minimum-required-fields lists
  above are field-set commitments, not schemas.
- **Not** "any Hounfour schema is adopted into the wedge public
  surface." Adoption is a separate ADR per ADR-020C / ADR-022A.
  `Challenge` shipping at v8.6.0 does **not** trigger adoption.
- **Not** "EstateTransition is unblocked." Hounfour delta #8
  remains queued. The posted Hounfour status comment for
  issue #70 has been filed; Phase 23A does **not** assume an
  answer.
- **Not** "safeCanonicalize is in scope as an MVP object." It
  is a Hounfour utility subpath (`./canonicalize` /
  `./utilities`), not a Recall Wedge primitive. The matching
  conformance vector is the *gate*, not the *object*.
- **Not** "AuditEvent has a confirmed Hounfour name." The
  v8.6.x adjacent schemas (`audit-trail-entry`,
  `domain-event`) are informational; renaming either into
  `AuditEvent` requires a separate ADR.
- **Not** "PolicyDecision will eventually be produced upstream."
  Per ADR-020A / ADR-022A and
  [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md),
  Hounfour may eventually host the *type*; production stays in
  the wedge permanently.
- **Not** "Phase 23B is authorized to flip a Hounfour import."
  Phase 23B's allowable shape (local semantic-contract
  scaffolding *or* deferral pending Hounfour answer) is the
  next-phase recommendation in the Phase 23A handoff packet,
  not authorization.
- **Not** "any Finn / Dixie / Freeside endpoint exists." The
  endpoint-host decision is ADR-022B; no host is wired.
- **Not** "any sibling repo has been edited or any GitHub
  issue / comment has been filed." The Hounfour status comment
  for issue #70 was posted in a prior step (Phase 22A drafted
  it; the user filed it before invoking Phase 23A); Phase 23A
  itself files nothing.

## Cross-references

- [`recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md)
  — the eleven MVP conformance vectors that exercise the
  per-lane separations pinned by this contract.
- [`../handoffs/phase-23a-mvp-schema-contract-draft.md`](../handoffs/phase-23a-mvp-schema-contract-draft.md)
  — Phase 23A summary handoff (blockers / non-blockers /
  next-phase recommendation).
- [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md)
  — Phase 22A MVP decision-lock (the five ADR-022 series this
  contract reads from).
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
  — Phase 21B v8.6 schema-readiness lock (the upstream
  substrate map this contract aligns to).
- [`../handoffs/hounfour-v86-shadow-inspection-output.txt`](../handoffs/hounfour-v86-shadow-inspection-output.txt)
  — Phase 21A v8.6.x shadow inspection (the source of the
  per-object MATCH / EXTEND / DISCOVERY_NOTE / DEFERRED
  dispositions).
- [`../handoffs/hounfour-v86-status-comment-draft.md`](../handoffs/hounfour-v86-status-comment-draft.md)
  — drafted-and-filed Hounfour status comment for issue #70.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
  [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
  [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
  [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — Phase 20A decision-lock series.
- [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md),
  [`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md),
  [`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md),
  [`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md),
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — Phase 22A decision-lock series (the load-bearing
  authorization gates this contract reads from).
- [`../schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md)
  — Phase 6 per-candidate inventory (the precursor to this
  contract).
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — the load-bearing class-vs-policy invariant.
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge's stable public API surface (unchanged by Phase 23A).
- [`../../src/straylight/types.ts`](../../src/straylight/types.ts)
  — current Straylight type definitions (unchanged by Phase 23A).
