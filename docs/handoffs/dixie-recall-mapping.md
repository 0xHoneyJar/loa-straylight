# Dixie recall / BFF mapping — Straylight primitives to Dixie surfaces

> Status: Phase 12. **Pre-integration handoff packet, in
> `loa-straylight` only.** This table maps each Straylight
> primitive / operation to the proposed Dixie BFF / API / service
> surface, the required input, the required output, the
> fail-closed condition, the receipt / provenance requirement,
> the related Hounfour schema candidate, the related Finn
> enforcement point, and the notes that pin the boundary.
> **Filing this against `loa-dixie` is not part of Phase 12.**
> Nothing here imports from `loa-dixie`, edits any sibling repo,
> or changes Phase 0–11 runtime behavior.

## How to read this table

| Column | Meaning |
|---|---|
| **Straylight primitive / operation** | The wedge primitive (or the BFF-level operation built over it) the row covers. |
| **Current Straylight local source** | Where the wedge implements this primitive today. |
| **Future Dixie BFF / API / service surface** | The Dixie-side surface that should expose this primitive after consuming stable contracts. |
| **Required input** | The shape Dixie must accept and pass to the wedge / Finn. |
| **Required output** | The shape Dixie must produce on success (display payload, render shape, list response). |
| **Fail-closed condition** | What Dixie must do when the surface cannot complete the operation, the receipt is missing, the chain is broken, or the privacy / tenant boundary is violated. |
| **Receipt / provenance requirement** | The receipt(s) Dixie MUST surface alongside the rendered output, and the provenance refs the BFF MUST honor. |
| **Related Hounfour schema candidate** | The schema id Dixie consumes for the shape. `—` if no Hounfour schema is the load-bearing input. |
| **Related Finn enforcement point** | The Finn runtime gate that Dixie's BFF sits in front of. `—` if Dixie consumes the wedge directly (in single-process deployments). |
| **Notes** | Constraints, architecture-spec citations, and "stays in Straylight / Finn" runtime references. |

## Mapping

### Recall intake and response

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `recall_request` intake | [`src/straylight/validators/class-validator.ts`](../../src/straylight/validators/class-validator.ts) (`validateRecallRequest`) + [`src/straylight/policy.ts`](../../src/straylight/policy.ts) (`policyForRecallRequest`) | `POST /recall` BFF route. Dixie builds a `RecallRequest` envelope from caller input, runs tenant-boundary checks, and forwards to the runtime gate. | Caller-supplied `task`, `environment_frame`, `risk_profile`, scope filters, signer envelope, target `actor_id` / `estate_id`. | A `RecallRequest` envelope (per the wedge's `validateRecallRequest` shape) plus an intake decision (`accepted` / `denied_intake`). | Class validation fails, signer envelope malformed, `environment_frame` unknown, or tenant-boundary check fails → deny intake; emit Dixie-side audit log entry; never forward to runtime gate. | Intake response carries the request envelope (no receipt yet). The receipt is emitted by the runtime gate on `recall_pack_generation`. | `straylight.recall_request.v0`, `straylight.environment_frame.v0`, `straylight.risk_level.v0` | Pre-tool recall gate (per [`finn-enforcement-mapping.md`](./finn-enforcement-mapping.md) `recall_request` row). | Per [arch spec §22.5.E2](../architecture/loa-straylight-product-system-architecture-spec.md). Cross-tenant prevention is a Dixie-layer responsibility (first line of defense); the wedge / Finn are the second line. |
| `recall_pack_generation` request | [`src/straylight/recall.ts`](../../src/straylight/recall.ts) (`executeRecall` interior) | `GET /recall/:request_id` BFF route. Dixie returns the served `RecallPack` once the runtime gate has assembled it; refuses to render without the matching receipt. | `recall_request_id` (from intake). | A served `RecallPack` (with `included` / `marked` / `redacted` discipline) plus the matching `RecallReceipt`. | Receipt missing, stale, or `pack_hash` does not match the served pack → refuse to render; surface deny reason. A pack without a receipt is treated as a denied recall. | The `RecallPack` MUST be paired with its `RecallReceipt`; the BFF MUST NOT render the pack alone. Provenance refs travel via `included[].provenance_refs`. | `straylight.recall_pack.v0`, `straylight.recall_item.v0`, `straylight.recall_use_instruction.v0`, `straylight.redaction_summary.v0`, `straylight.exclusion_summary.v0` | `recall_pack_generation` (per Finn mapping). | Per [arch spec §22.5.E2](../architecture/loa-straylight-product-system-architecture-spec.md). The `included` / `marked` / `redacted` discipline is load-bearing — `marked` items are never quotable as fact. |
| `recall_receipt` retrieval | [`src/straylight/recall.ts`](../../src/straylight/recall.ts) (`executeRecall` tail) | `GET /receipt/:receipt_id` BFF route. Dixie returns the persisted `RecallReceipt` keyed by `receipt_id`. | `receipt_id`. | A `RecallReceipt` (with the requested `detail_level`, `pack_hash`, `receipt_hash`, `policy_decision`, signer envelope, `commitment_ref` if present). | Receipt does not exist → 404 / not-found. Detail-level mismatch → return the wedge / Finn's persisted detail-level; never fabricate. | The receipt is the audit artifact; Dixie surfaces it intact. Provenance flows via the receipt's `pack_hash` reference back to the served pack. | `straylight.recall_receipt.v0`, `straylight.receipt_detail_level.v0` | `recall_receipt_emission` (per Finn mapping). | Per [arch spec §22.5.E3](../architecture/loa-straylight-product-system-architecture-spec.md). Detail-level redaction is applied **after** the pack is built (wedge / Finn discipline); Dixie consumes the result. |

### Excluded-assertion reason display

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `excluded_assertion_reason_display` | [`src/straylight/recall.ts`](../../src/straylight/recall.ts) (`dispositionFor`, `privacyDispositionForFrame`); [`src/straylight/policy.ts`](../../src/straylight/policy.ts) (recall policy) | `GET /recall/:request_id/excluded` BFF route. Dixie renders the served pack's `excluded_summary[]` and `redacted[]` in operator-friendly form. | `recall_request_id`. | A list of exclusion entries: `{ reason, count }` plus, where the wedge / Finn provided it, sample `assertion_class` / `privacy_scope` aggregations. | Pack served but `excluded_summary` empty when an exclusion was expected (e.g. an `actor_private` body exists but doesn't appear in summary) → surface "unexplained-exclusion" warning. | The exclusion summary is rendered alongside the served pack's receipt; provenance refs are NOT travelled into the summary (the BFF surfaces aggregate counts, not the excluded bodies). | `straylight.exclusion_summary.v0`, `straylight.redaction_summary.v0` | `recall_pack_generation` (the runtime gate's `dispositionFor` step). | Per [arch spec §22.5.E2](../architecture/loa-straylight-product-system-architecture-spec.md). Reasons must come from the wedge's vocabulary (`private_excluded_from_public_frame`, `revoked_excluded_outside_audit_review`, `forgotten_excluded_outside_audit_review`, `sealed_excluded_outside_audit_review`); Dixie does not invent new reasons. |

### Provenance inspection

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `provenance_inspection` | [`src/straylight/types.ts`](../../src/straylight/types.ts) (`Assertion.provenance[]`); [`src/straylight/estate.ts`](../../src/straylight/estate.ts) (admit-time provenance capture) | `GET /assertion/:assertion_id/provenance` BFF route. Dixie returns the assertion's provenance records, respecting privacy scope. | `assertion_id`, caller's `environment_frame`. | A list of `ProvenanceRef` records (`provenance_id`, `source_type`, `observed_at`, `captured_by`, `evidence_summary`). | Privacy-scope leak — caller's frame would expose `actor_private` / `sealed` provenance → refuse the leak; surface "exclusion" entry with reason `private_provenance_excluded_from_<frame>`. | Provenance is the audit-side trace of *why* an assertion entered the estate. The BFF MUST NOT synthesize provenance; it walks `Assertion.provenance[]` only. | `straylight.provenance_ref.v0`, `straylight.provenance_source_type.v0` | `recall_pack_generation` (provenance refs travel through pack assembly). | Per [arch spec §22.5.E4](../architecture/loa-straylight-product-system-architecture-spec.md). The privacy scope of the *parent assertion* gates whether its provenance is exposed; provenance does not leak when the parent does not. |

### Audit-chain lookup

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `audit_chain_lookup` | [`src/straylight/audit.ts`](../../src/straylight/audit.ts) (`AuditLog.list`, `AuditLog.listFor`, `AuditLog.verifyChain`) | `GET /estate/:estate_id/audit` BFF route. Dixie returns the per-estate audit chain plus a `verifyChain` result. | `estate_id`, optional pagination cursor. | A list of `AuditEvent[]` (in chain order) plus a `{ ok, broken_at?, reason? }` verify result. | `verifyChain.ok === false` → render the break index + reason; never suppress. Chain unreadable (storage refuses) → 503 / unavailable; never fabricate events. | Each `AuditEvent` carries its own `audit_hash` / `previous_audit_hash`; the chain is the receipt for the chain. | `straylight.audit_event.v0`, `straylight.audit_event_type.v0` | `audit_chain_verification` (per Finn mapping). | Per [arch spec §22.5.E5](../architecture/loa-straylight-product-system-architecture-spec.md), [`threat-model.md`](../mvp/threat-model.md) T9. Chain semantics (per-estate, append-only, hash-linked) stay in the wedge; Finn provides the storage backbone; Dixie surfaces the read view. |

### Actor estate summary

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `actor_estate_summary` | [`src/straylight/types.ts`](../../src/straylight/types.ts) (`Actor`, `ActorEstate`, `Keyring`); [`src/straylight/estate.ts`](../../src/straylight/estate.ts) (`EstateStore.listAssertions`) | `GET /estate/:estate_id/summary` BFF route. Dixie returns the actor / estate / keyring meta + assertion counts. | `estate_id`, caller's `environment_frame`. | A summary view: actor (`actor_id`, `actor_type`, `actor_status`), estate (`estate_id`, `status`), keyring meta (`keyring_id`, signer-role list, **no** private material), counts by `assertion_class` / `assertion_status` / `privacy_scope` / `risk_level`. | Estate not found → 404 / not-found. Counts cannot be computed (storage refuses) → 503 / unavailable; never fabricate zeros. | Summary view is read-only; no receipt is emitted on a summary call. The view itself is provenance for the operator console. | `straylight.actor.v0`, `straylight.actor_estate.v0`, `straylight.keyring.v0`, `straylight.assertion_class.v0`, `straylight.assertion_status.v0`, `straylight.privacy_scope.v0`, `straylight.risk_level.v0` | `create_estate` / state-of-record read (per Finn mapping). | Per [arch spec §22.5.E6](../architecture/loa-straylight-product-system-architecture-spec.md). Counts respect privacy scope: the `public_discord` view does not expose `actor_private` counts. Keyring private material (signer-private envelopes) NEVER travels through the summary. |

### Assertion status inspection

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `assertion_status_inspection` | [`src/straylight/types.ts`](../../src/straylight/types.ts) (`Assertion.status`, `challenged_by_refs`, `revoked_by_ref`); [`src/straylight/estate.ts`](../../src/straylight/estate.ts) | `GET /assertion/:assertion_id` BFF route. Dixie returns the assertion's current status, governance refs, and quotability for the caller's frame. | `assertion_id`, caller's `environment_frame`. | A status view: `assertion_class`, `status`, `challenged_by_refs[]`, `revoked_by_ref` (when present), `quotable_in_frame` flag (`active` / `marked` / `excluded`), `use_instruction` (when marked). | Status change in flight (storage version skew) → return the last persisted status; do not speculate. Privacy scope leak → refuse the body, surface metadata only. | Status view does not emit a new receipt; it surfaces the existing transition receipts the wedge / Finn already wrote. | `straylight.assertion.v0`, `straylight.assertion_status.v0`, `straylight.recall_use_instruction.v0` | `classify_assertion` / `challenge_assertion` / `revoke_assertion` / `forget_assertion_from_recall` (per Finn mapping). | Per [arch spec §22.5.E7](../architecture/loa-straylight-product-system-architecture-spec.md). Quotability flag mirrors the wedge's `dispositionFor` output for the caller's frame; Dixie does not invent quotability rules. |

### Challenge / revocation / forget awareness

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `challenge_revocation_awareness` | [`src/straylight/types.ts`](../../src/straylight/types.ts) (`Challenge`, `Revocation`, `ForgetRecord`); [`src/straylight/estate.ts`](../../src/straylight/estate.ts) (`EstateStore.challenge`, `EstateStore.revoke`, `EstateStore.forget`) | `GET /assertion/:assertion_id/governance` BFF route. Dixie surfaces the challenge / revocation / forget timeline for an assertion. | `assertion_id`, caller's `environment_frame`. | A timeline of governance records: `Challenge` (with `challenge_type`, `requested_effect`, signer, evidence refs), `Revocation` (with reason, signer), `ForgetRecord` (with reason, signer). | Governance record unparseable → render the assertion as `excluded` with reason `unparseable_governance_record`; never as `active`. | Each governance record's signer envelope and reason are surfaced; the BFF does not re-derive these. | `straylight.challenge.v0`, `straylight.challenge_type.v0`, `straylight.challenge_requested_effect.v0`, `straylight.revocation.v0`, `straylight.forget_record.v0` | `challenge_assertion` / `revoke_assertion` / `forget_assertion_from_recall` (per Finn mapping). | Per [arch spec §22.5.E7](../architecture/loa-straylight-product-system-architecture-spec.md). The wedge's discipline is "challenge / revocation / forget do not erase"; the BFF preserves that — the timeline is always renderable, even when the assertion itself is `excluded`. |

### `forgotten_from_recall` handling

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `forgotten_from_recall_handling` | [`src/straylight/recall.ts`](../../src/straylight/recall.ts) (`dispositionFor`); [`src/straylight/estate.ts`](../../src/straylight/estate.ts) (`EstateStore.forget`) | Cross-cutting: `GET /assertion/:assertion_id`, `GET /recall/:request_id`, `GET /recall/:request_id/excluded`, and `GET /estate/:estate_id/audit` MUST surface forgotten material consistently — excluded outside `audit_review`, `marked` in `audit_review`, always present in the audit chain. | `assertion_id` / `recall_request_id` / `estate_id`, caller's `environment_frame`. | Outside `audit_review`: assertion rendered as `excluded`; recall pack contains exclusion-summary entry; audit chain shows the `assertion_forgotten` event. Inside `audit_review`: assertion rendered as `marked` with use_instruction. | Forget record exists but exclusion summary missing → "unexplained-exclusion" warning. Forget record exists but audit chain missing the `assertion_forgotten` event → render as `excluded` and surface chain-incomplete warning. | The forget transition receipt is the audit artifact; the BFF surfaces it intact. The body of the forgotten assertion does not travel outside `audit_review`. | `straylight.forget_record.v0`, `straylight.assertion_status.v0`, `straylight.audit_event.v0` | `forget_assertion_from_recall` (per Finn mapping). | Per [arch spec §22.5.E7](../architecture/loa-straylight-product-system-architecture-spec.md), [`threat-model.md`](../mvp/threat-model.md) T4. Forget is "unavailable to ordinary recall," not "erased." The BFF preserves both halves of that. |

### Public / private environment-frame handling

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `public_private_environment_frame_handling` | [`src/straylight/recall.ts`](../../src/straylight/recall.ts) (`privacyDispositionForFrame`); [`src/straylight/policy.ts`](../../src/straylight/policy.ts) (`policyForRecallRequest`) | Cross-cutting: every BFF route that accepts a recall request, an inspection lookup, or a status query MUST attach the caller's `environment_frame` (`public_discord`, `private_dm`, `tenant_dashboard`, `audit_review`, `cli`, …) to the upstream call. | Caller session / route prefix indicating the frame; the wedge / Finn output for that frame. | The BFF's response is filtered for the caller's frame as the wedge / Finn returned it. The frame is not rewritten by Dixie. | Caller frame unknown / spoofed → deny intake with reason `unknown_environment_frame`. Frame attempts to "see more" than the wedge / Finn allows → render the wedge / Finn output unchanged; do not override. | The frame travels with every recall request and every inspection lookup; the wedge / Finn return frame-appropriate output. The BFF surfaces it. | `straylight.environment_frame.v0` | `recall_request` (per Finn mapping); also flows into every inspection surface that gates by frame. | Per [arch spec §22.5.E2 / E7](../architecture/loa-straylight-product-system-architecture-spec.md). The wedge's `privacyDispositionForFrame` is the source of truth for frame visibility; Dixie's renderer does not derive its own frame visibility. |

### High-risk recall handling

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `high_risk_recall_handling` | [`src/straylight/policy.ts`](../../src/straylight/policy.ts) (high/critical-risk lift to `needs_review` in public frames); [`src/straylight/recall.ts`](../../src/straylight/recall.ts) | `POST /recall` (intake) + `GET /review` (review queue) + `POST /review/:request_id/sign` (reviewer sign-off). Dixie holds `needs_review` requests in a review queue keyed by a competent reviewer signer. | High / critical-risk recall request; reviewer signer envelope. | A `needs_review` decision surfaced to the caller; a queued entry visible to the reviewer; on sign-off, a replayed recall through the runtime gate with the reviewer envelope. | Review queue unavailable (storage refuses) → keep the request in `needs_review`; never auto-promote to `allow`. Reviewer signer not competent → reject sign-off with `signer_not_competent_for_review`. | Each review-queue action emits a Dixie-side audit log entry referencing the wedge's `recall_denied` / `recall_served` event. | `straylight.recall_request.v0`, `straylight.policy_decision.v0`, `straylight.signer_competence_result.v0` | `recall_request` (the wedge / Finn lift to `needs_review`; Dixie hosts the review queue). | Per [arch spec §22.5.E2](../architecture/loa-straylight-product-system-architecture-spec.md). Auto-promotion is forbidden — the load-bearing property is "do not collapse `needs_review` into `allow` without a competent reviewer's sign-off." |

### Cross-tenant recall prevention

| Straylight primitive / operation | Current Straylight local source | Future Dixie BFF / API / service surface | Required input | Required output | Fail-closed condition | Receipt / provenance requirement | Related Hounfour schema candidate | Related Finn enforcement point | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `cross_tenant_recall_prevention` | [`src/straylight/policy.ts`](../../src/straylight/policy.ts) (signer-competence + estate scoping); [`src/straylight/audit.ts`](../../src/straylight/audit.ts) (per-estate chain — cross-estate links forbidden) | Middleware on every BFF route. Dixie enforces tenant boundary at intake; the wedge / Finn enforce at runtime as the second line of defense. | Caller session (tenant id), target `actor_id` / `estate_id`, requested operation. | Accept (forward to runtime gate) or deny (`cross_tenant_recall_refused`). | Tenant boundary check fails → deny intake; emit Dixie-side audit log entry referencing the wedge's `recall_denied`. Tenant boundary undefined → deny intake; never default-allow. | The intake-deny audit log entry references the wedge / Finn's `recall_denied` event for chain-of-custody. | `straylight.actor.v0`, `straylight.actor_estate.v0` | All tenant-scoped Finn enforcement points (every row in `finn-enforcement-mapping.md` that operates on an estate). | Per [arch spec §22.5.E2 / E6](../architecture/loa-straylight-product-system-architecture-spec.md), [`threat-model.md`](../mvp/threat-model.md) T6. Cross-tenant chain links are forbidden — the audit chain is per-estate. The BFF is the *first* line of defense; the wedge / Finn are the second line. Both must refuse. |

## Cross-references

- [`docs/handoffs/dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  — Phase 12 issue handoff that consumes this mapping.
- [`docs/handoffs/dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  — companion boundary doc (what Dixie owns vs what it must not
  own).
- [`docs/handoffs/finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
  — Phase 10 mapping from Straylight transitions to Finn runtime
  enforcement points (runtime lane).
- [`docs/handoffs/hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
  — Phase 9 mapping from Straylight primitives to Hounfour schema
  candidates (class lane).
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.4, §22.5 — architectural decisions.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  fail-closed defenses the BFF must preserve.
- [`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  — ten current-shape JSON examples (Dixie PR-A test inputs).

---

## Phase 24B refresh — per-surface mapping to the MVP host contract

> Status: Phase 24B (append-only). This section is the **Phase 24B
> refresh** to this Phase 12 mapping doc. It does **not** edit
> any Phase 12 prose above. It links each Phase 12 mapping row
> to the corresponding row in the Phase 24B per-surface MVP host
> contract spec
> ([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)),
> so a future `phase-24c-dixie-recall-host-scaffold` reviewer can
> verify scope alignment at glance.
>
> Companion docs:
> [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
> [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md),
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md),
> [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md),
> [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
> (Phase 24B refresh),
> [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
> (Phase 12 issue handoff; Phase 24B refresh appended).

### Phase 24B in-slice surfaces (six)

Each Phase 24B in-slice surface maps to its Phase 12 row in this
doc:

| Phase 24B host surface | Phase 12 mapping row (above) | Spec section | Receipt categories surfaced |
|---|---|---|---|
| Surface 1 — Recall intake & response | "Recall intake and response" mapping row | [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Surface 1" | `included`, `excluded`, `redacted`, `challenged`, `revoked`, `blocked-by-policy` (the full ADR-020D §6 set, surfaced via `RecallReceipt`) |
| Surface 2 — Receipt retrieval & display | "Receipt retrieval and display" mapping row | [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Surface 2" | (retrieves any persisted receipt by `receipt_id`) |
| Surface 3 — Excluded-assertion reason display | "Excluded-assertion reason display" mapping row | [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Surface 3" | `excluded`, `redacted`, `challenged`, `revoked`, `blocked-by-policy` |
| Surface 4 — Provenance inspection | "Provenance inspection" mapping row | [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Surface 4" | (walks `Assertion.provenance[]` under `privacy_scope`; refuses on `actor_private` × `public_discord`) |
| Surface 5 — Audit-chain lookup | "Audit-chain lookup" mapping row | [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Surface 5" | (surfaces wedge-private `AuditEvent[]` + `verifyChain` result; break index on chain break) |
| Surface 6 — Estate summary | "Estate summary" mapping row | [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Surface 6" | (counts by class / status / privacy scope / risk level; respects privacy frame) |

### Phase 12 surfaces explicitly out of slice for Phase 24B MVP

The Phase 12 mapping above proposes additional Dixie surfaces.
Phase 24B **narrows** the MVP slice to the six surfaces in the
table above. The remaining Phase 12 surfaces are **not removed**
from the Phase 12 packet — they remain in this doc as the
in-repo contract for **a later slice** — but they are
**explicitly out of scope for the Phase 24B MVP host plan**:

| Phase 12 surface (above) | Phase 24B disposition |
|---|---|
| Assertion-status inspection | Out of slice for Phase 24B MVP. Covered at the summary granularity by Surface 6 (counts by status). Per-assertion inspection is deferred to a later slice. |
| Governance-record awareness | Out of slice for Phase 24B MVP. Deferred. |
| Environment-frame routing | Out of slice for Phase 24B MVP. The host accepts a `frame` on the caller envelope (Surfaces 4 and 6) but does not run routing logic. |
| High-risk recall handling (review queue) | Out of slice for the docs/spec lock. Surface 1 surfaces `needs_review` outcomes (and emits a `review_queue_id` handle) but the review-queue management surface (intake/list/sign-off) is deferred to a later slice. |
| Cross-tenant recall prevention | Cross-cutting; not a standalone Phase 24B surface. Enforced at every Phase 24B surface's intake under the host invariant set ([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Host invariants" invariant 5). |

### Per-surface validation-vector mapping

Each Phase 24B in-slice surface is exercised by a subset of the
Phase 24B per-vector validation matrix
([`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md) §"Vector matrix"):

| Vector # | Surfaces exercised | Receipt category surfaced |
|---|---|---|
| 1 — Class-valid carrier, policy-allowed, included | Surfaces 1, 2, 3 | `included` |
| 2 — Class-valid carrier, policy-excluded | Surfaces 1, 3 | `excluded` |
| 3 — Class-valid carrier, privacy-redacted | Surfaces 1, 3, 4 | `redacted` |
| 4 — Contested assertion marked | Surfaces 1, 3 | `challenged` |
| 5 — Revoked assertion excluded | Surfaces 1, 3 | `revoked` |
| 6 — Forgotten assertion excluded but auditable | Surfaces 1, 3, 5 | `excluded` (+ audit event) |
| 7 — Cross-tenant recall refused | Surfaces 1, 2, 4, 5, 6 | `blocked-by-policy` |
| 8 — Denied private-in-public | Surfaces 1, 3, 4 | `blocked-by-policy` or `redacted` |
| 9 — Signer not competent for `RecallRequest` envelope | — (not in slice; `keyring_validation` lane; not exercised by Phase 24B per ADR-024D §3.b) | — |
| 10 — `EstateTransition` on the wire | — (gate; not exercised) | — |
| 11 — `safeCanonicalize` on the wire | — (gate; not exercised) | — |

### Phase 24B refresh non-scope

- **No edits to the existing Phase 12 mapping rows above.**
  Append-only.
- **No additional Phase 12 surfaces added or removed.** Phase 24B
  narrows the MVP slice via this mapping; the Phase 12 packet's
  full surface set remains in this doc for a later slice.
- **No schema authoring.**
- **No `package.json` change.**
- **No sibling-repo edits.**
- **No GitHub issue / comment / PR.**
- **No `Challenge` / `EstateTransition` / `safeCanonicalize` /
  `AuditEvent`-rename adoption.**
- **No `0xhoneyjar:straylight:*` prefix family adoption** or
  `recall-wedge` conformance category adoption.
- **No Hounfour five-step corpus import.**
- **No Hounfour `main` / commit-SHA / git-source consumption.**
- **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
  edits.**
- **No commit, no push, no PR.**

### Phase 24B refresh cross-references

- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
- [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md)
- [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
- [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)
- [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  (Phase 24B refresh appended)
- [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  (Phase 24B refresh appended)
- [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
- [`./hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md)

## Phase 24E refresh — per-surface host-handler binding

> Status: Phase 24E (append-only). This section is the **Phase 24E
> refresh** of this Phase 12 mapping doc. It binds each Phase 24B
> in-slice surface (S1–S6) to its Phase 24C handler export, the
> handler's module path, the handler's dependency-interface name,
> the receipt-category and typed-refusal vocabulary the rendered
> output carries, and the post-PR-30 render expectation Dixie's
> eventual sibling-repo PR must satisfy. The mapping is a
> **post-PR-30 snapshot**; the canonical host barrel is
> [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
> Existing Phase 12 mapping rows and the Phase 24B refresh
> section above are unchanged.
>
> Companion docs (Phase 24E):
> [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)
> (Phase 24E summary handoff),
> [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
> (Phase 24E refresh appended),
> [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
> (Phase 24E refresh appended),
> [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md),
> [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md).

### Per-surface handler binding (post-PR-30 snapshot)

The table below binds each Phase 24B in-slice surface to its
Phase 24C / 24D handler. Dixie's render layer takes the
handler's return value as input; Dixie does not redefine the
handler shape, does not synthesise a return value, and does not
bypass the handler.

| # | Surface | Handler export | Module path | Dependency interface | Typed refusal reasons surfaced | Render expectation |
|---|---|---|---|---|---|---|
| S1 | Recall intake / response | `handleRecallIntake` | [`../../src/straylight/host/intake.ts`](../../src/straylight/host/intake.ts) | `IntakeDeps` | `cross_tenant_recall_refused`, `policy_unavailable`, `signer_not_competent`, `storage_unavailable`, `blocked_by_policy`, `privacy_scope_refusal`, `frame_unsupported`, `tenant_resolution_failed`, `class_validation_failed` | Render `served` pack + receipt verbatim; render `denied` with `audit_event_id` + classified `DeniedReason` + verbatim `raw_reasons[]` (no synthesised receipt per Phase 24C deviation #1); render `needs_review` with `review_queue_id` + wedge's `audit_event_id` (queue mgmt = future work). |
| S2 | Receipt retrieval / display | `handleReceiptRetrieval` | [`../../src/straylight/host/receipt.ts`](../../src/straylight/host/receipt.ts) | `ReceiptDeps` | `unknown_receipt_id` (Phase 24D-tightened — exact under clean tenant resolve), `cross_tenant_refused`, `tenant_resolution_failed` | Render the wedge's persisted `RecallReceipt` verbatim under the requested `detail_level`. Do not infer tenant identity from a missing record. |
| S3 | Excluded-assertion reason display | `handleExclusionDisplay` | [`../../src/straylight/host/exclusion.ts`](../../src/straylight/host/exclusion.ts) | (pure render — no dep struct) | None at S3; upstream pack encodes wedge's fail-closed posture | Render aggregate-by-reason `excluded_aggregates[]` / `redacted_aggregates[]` (per Phase 24C deviation #2) + per-assertion `marked[]`. Honor Phase 24D concern 5 safe-default: unknown wedge reason → `category: 'excluded'` with verbatim `raw_reason`. |
| S4 | Provenance inspection | `handleProvenanceWalk` | [`../../src/straylight/host/provenance.ts`](../../src/straylight/host/provenance.ts) | `ProvenanceDeps` | `privacy_scope_refusal` (incl. Phase 24D concern 2: `tenant`-scoped parent under `public_discord`), `cross_tenant_refused`, `unknown_assertion`, `tenant_resolution_failed`, `frame_unsupported` | Render `walked` provenance records in chronological order under the parent's `privacy_scope`; render `refused` with the typed reason. Same `tenant`-scoped parent under `actor_private` caller frame walks normally. |
| S5 | Audit-chain lookup | `handleAuditChainLookup` | [`../../src/straylight/host/audit-lookup.ts`](../../src/straylight/host/audit-lookup.ts) | `AuditLookupDeps` | `cross_tenant_refused`, `unknown_estate`, `tenant_resolution_failed` | Render `verified` events in order; render `broken` events up to the break with prominent `break_index` + `break_reason`; never hide a break; never re-run `verifyChain`. |
| S6 | Estate summary display | `handleEstateSummary` | [`../../src/straylight/host/estate-summary.ts`](../../src/straylight/host/estate-summary.ts) | `EstateSummaryDeps` (Phase 24D: optional `intakeLog?: IntakeDenyLog`) | `cross_tenant_refused`, `unknown_estate`, `privacy_scope_refusal`, `tenant_resolution_failed` | Render `summarized` counts using 2-key `by_privacy_scope` (host-applied frame discipline — zero `actor_private` under `public_discord`); keep 4-key `_widened_privacy_scope` (per Phase 24C deviation #3) as trace data only. When `intakeLog` is injected, cross-tenant target refusals append a caller-tenant intake-deny entry. |

### Canonical host barrel

All six handlers are exported from
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
The barrel is intentionally **NOT** re-exported through
[`../../src/straylight/index.ts`](../../src/straylight/index.ts);
Dixie consumers import the host barrel directly. The wedge does
not import the host scaffold (one-way dependency). Helper
exports also surfaced through the barrel:

- `checkSameTenant` + types `TenantCheckResult`, `TenantResolver`
  ([`../../src/straylight/host/tenancy.ts`](../../src/straylight/host/tenancy.ts))
  — required injection for cross-tenant gating on S1 / S2 / S4 /
  S5 / S6; **no production default**.
- `createInMemoryIntakeDenyLog` + types `IntakeDenyEntry`,
  `IntakeDenyLog`
  ([`../../src/straylight/host/intake-log.ts`](../../src/straylight/host/intake-log.ts))
  — required on S1 / S2 / S4; optional on S6 (Phase 24D concern 3).

### Phase 24E receipt-category and `DeniedReason` vocabularies

Dixie renders using the closed enums the host scaffold exports
from [`../../src/straylight/host/types.ts`](../../src/straylight/host/types.ts):

- **`ExclusionReason`** (S1 / S3 / S6 indirectly): `included` /
  `excluded` / `redacted` / `challenged` / `revoked` /
  `blocked-by-policy`. Six categories pinned by ADR-020D §6;
  unchanged by Phase 24C / 24D / 24E.
- **`DeniedReason`** (S1): `class_validation_failed` /
  `policy_unavailable` / `signer_not_competent` /
  `cross_tenant_recall_refused` / `storage_unavailable` /
  `blocked_by_policy` / `privacy_scope_refusal` /
  `frame_unsupported` / `tenant_resolution_failed`. Pinned by
  Phase 24C; the host never invents a value outside this set.

### Phase 24E refresh non-scope

- **No edit to the Phase 12 mapping rows above.**
- **No edit to the Phase 24B refresh section above.**
- **No additional Phase 12 surfaces added or removed.**
- **No source / test / fixture / script / package change.**
- **No new endpoint / runtime / Hounfour adoption.**
- **No sibling-repo edit, no GitHub-side action.**
- **No commit, no push, no PR by Phase 24E itself.**

### Phase 24E refresh cross-references

- [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)
  — Phase 24E summary handoff (this section's owning doc).
- [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)
  — Phase 24D summary handoff (hardening concerns referenced
  above).
- [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)
  — Phase 24C summary handoff (handler exports defined there).
- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — per-surface MVP host contract.
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — vector matrix at the host inspection layer.
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — Phase 24B decision-lock Phase 24E operates under.
- [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  (Phase 24E refresh appended).
- [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  (Phase 24E refresh appended).
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  — canonical host barrel (post-PR-30 snapshot).
- [`../../src/straylight/host/types.ts`](../../src/straylight/host/types.ts)
  — per-surface request/response shapes + `HostFrame` /
  `HostCaller` / `DeniedReason` / `ExclusionReason` enums.
