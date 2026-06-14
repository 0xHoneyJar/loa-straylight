# Hermes ↔ Loa-Straylight — Type-Only Adapter Sketch

> **Type-only design artifact.** This document narrows the Layer A type-contract
> surface introduced by the merged fixture-only contract (PR #66). It resolves
> the previously-unread Straylight type shapes and sketches a type-only adapter
> mapping. No code in this document is compiled, imported, or run.

---

## Status

- **docs-only** — a design artifact, not code.
- **type-only** — concerns `import type` / declaration shapes only.
- **design-only** — no implementation.
- **no implementation** — no functions/classes created.
- **no runtime import** — no `import` of any `@loa/straylight` runtime JS or `src/*` module.
- **no execution** — nothing is compiled or run; the pseudocode does not typecheck here.
- **no package export change** — the package surface is untouched.
- **no live/deployed claim** — Loa-Straylight is not deployed; nothing here implies a live service.

**Target claim (operator-adjudicated this slice):**
> Hermes↔Loa-Straylight has a documented type-only adapter sketch grounded in observed Loa-Straylight type shapes.

**Forbidden claims:** Hermes consumes Straylight at runtime · Hermes is backed by live Straylight · Hermes can call root package runtime APIs · Hermes can use `handleRecallIntake` as its adapter boundary · the adapter is implemented · the type sketch compiles or runs · source-local harness correctness is verified.

---

## Relationship to PR #66

- **PR #66** (`docs/HERMES-STRAYLIGHT-LOCAL-ADAPTER-CONTRACT.md`, merged as `5c78adf`) established the **fixture-only boundary contract** and the three-layer distinction (A package/type-contract · B Dixie-gated packaged runtime · C source-local harness).
- **This document** narrows the **Layer A** type-contract shape: it resolves exact type definitions and expresses the envelope/recall mappings as type-only pseudocode.
- It does **not** move into Layer B (Dixie-gated runtime) or Layer C (source-local harness). No runtime call, no `src/` import, no executable harness.

---

## Resolved type shapes (observed `[E]`)

All shapes below are defined in `dist-types/src/straylight/types.d.ts`. Line refs are at HEAD `5c78adf`.

### `PrivacyScope` `[E]`
`types.d.ts:35`
```ts
export type PrivacyScope = 'public' | 'tenant' | 'actor_private' | 'sealed';
```

### `RiskLevel` `[E]`
`types.d.ts:36`
```ts
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
```
> ⚠️ **Disambiguation `[E]`:** a *different* type `RecallWedgeRiskLevel = 'low'|'standard'|'high'|'restricted'` exists at `host/recall-wedge-contract.d.ts:105` (re-exported via `host/index.d.ts:18`). It is the **host-contract** risk type and is **not** the same as the core `RiskLevel`. The adapter uses the core `RiskLevel` (`types.d.ts:36`); do not conflate them.

### `ClassValidationResult` `[E]`
`types.d.ts:121–126`
```ts
export interface ClassValidationResult {
    valid: boolean;
    schema_id: string;
    schema_version: string;
    errors: ValidationError[];   // ValidationError: { ... message: string } (types.d.ts ~:117–120)
}
```

### `ProvenanceRef` `[E]`
`types.d.ts:38–46`
```ts
export interface ProvenanceRef {
    provenance_id: ID;
    source_type: ProvenanceSourceType;   // incl. 'telegram_event' | 'tool_result' | 'model_output' | 'repo_artifact' | 'manual_review' (types.d.ts:37)
    source_uri?: string;
    source_hash?: Hash;
    observed_at: ISO8601;
    captured_by: string;
    evidence_summary?: string;
}
```

### `SignatureEnvelope` `[E]`
`types.d.ts:49–58`
```ts
export interface SignatureEnvelope {
    signature_id: ID;
    signer_id: ID;
    signer_type: SignerType;          // 'actor_controller'|'operator'|'runtime'|'reviewer'|'policy_service'|'admin'|'wallet'|'service_key' (:47)
    signature_type: SignatureType;    // 'ed25519'|'secp256k1'|'hmac'|'dev_signature' (:48)
    signed_payload_hash: Hash;
    signature: string;
    signed_at: ISO8601;
    key_ref: string;
}
```

### `CandidateAssertion` `[E]`
`types.d.ts:324–338`
```ts
export interface CandidateAssertion {
    estate_id: ID;
    actor_id: ID;
    assertion_class: AssertionClass;   // 16-value enum (:33)
    body: Record<string, unknown>;
    schema_version?: string;
    provenance: ProvenanceRef[];
    privacy_scope?: PrivacyScope;
    risk_level?: RiskLevel;
    recall_scope?: string[];
    confidence?: number;
    subject_refs?: string[];
    linked_assertion_refs?: string[];
    signatures: SignatureEnvelope[];
}
```

### `RecallRequest` (full) `[E]`
`types.d.ts:219–239`
```ts
export interface RecallRequest {
    recall_request_id: ID;
    actor_id: ID;
    estate_id: ID;
    requested_by: ID;
    task: string;
    intent?: string;
    environment_frame: EnvironmentFrame;      // defined in types.d.ts
    risk_profile: RiskLevel;
    requested_classes?: AssertionClass[];
    excluded_classes?: AssertionClass[];
    include_statuses?: AssertionStatus[];
    mark_statuses?: AssertionStatus[];
    exclude_statuses?: AssertionStatus[];
    max_items?: number;
    freshness_window?: string;
    include_provenance?: boolean;
    include_receipt_detail: ReceiptDetailLevel;
    signature: SignatureEnvelope;
    created_at: ISO8601;
}
```

---

## Package-root export availability

The package root `@loa/straylight` is `types`-only (no `import`/`require`); its declaration entry `dist-types/src/straylight/index.d.ts:1` is:
```ts
export * from './types.js';
```
This **wildcard re-export** means every type defined in `types.d.ts` — `PrivacyScope`, `RiskLevel`, `ClassValidationResult`, `RecallRequest`, `CandidateAssertion`, `ProvenanceRef`, `SignatureEnvelope`, and their referenced enums/aliases — **is reachable from the package root as a TYPE** `[E]`.

| Type | Defined at | Root-exported as type? |
|---|---|---|
| `PrivacyScope` | `types.d.ts:35` | ✅ via `export *` |
| `RiskLevel` | `types.d.ts:36` | ✅ via `export *` |
| `ClassValidationResult` | `types.d.ts:121` | ✅ via `export *` |
| `RecallRequest` | `types.d.ts:219` | ✅ via `export *` |
| `CandidateAssertion` | `types.d.ts:324` | ✅ via `export *` |
| `ProvenanceRef` | `types.d.ts:38` | ✅ via `export *` |
| `SignatureEnvelope` | `types.d.ts:49` | ✅ via `export *` |
| `RecallWedgeRiskLevel` (distinct) | `host/recall-wedge-contract.d.ts:105` | only via `@loa/straylight/host`, **not** root |
| **runtime functions** (`validateCandidateAssertion`, `executeRecall`, `EstateStore`, …) | `index.d.ts` named exports | **type-declared only** — root carries no runtime JS, so these are **NOT callable** from the built package |

**Key distinction `[E]`:** the *type names* `validateCandidateAssertion`/`executeRecall`/`EstateStore` appear in the root `.d.ts`, but root `.` has **no runtime export condition** — so they are usable for *typing* only, **never as callable runtime APIs** from the package. Calling them is Layer C (source-local) or a future export.

---

## Type-only import posture (illustrative, non-executed)

A future type-only sketch would import **types only** — never runtime values:
```ts
// ILLUSTRATIVE — not compiled, not run.
import type {
  CandidateAssertion,
  ProvenanceRef,
  SignatureEnvelope,
  PrivacyScope,
  RiskLevel,
  AssertionClass,
  ClassValidationResult,
  RecallRequest,
} from '@loa/straylight';   // root is types-only; `import type` erases at emit — no runtime dependency
```
`RecallWedgeRiskLevel` (if ever needed) would come from `@loa/straylight/host`, **not** the root — and is not used here. No runtime symbol (`validateCandidateAssertion`, `executeRecall`, `EstateStore`) is imported, because the built package exposes no callable runtime at the root.

---

## Hermes source object (local design, zero authority)

```ts
// ILLUSTRATIVE local Hermes shape — source material only, NOT authority.
interface HermesDiarySourceRecord {
  journal_path: string;        // e.g. ~/.hermes/journal/2026/06/...md
  entry_id: string;            // line/message anchor
  observed_at: string;         // ISO8601
  captured_by: string;         // 'hermes' | operator id
  source_kind:                 // → maps to ProvenanceSourceType
    | 'telegram_event' | 'tool_result' | 'model_output'
    | 'repo_artifact' | 'manual_review';
  text: string;                // raw diary/journal text
  evidence_refs?: string[];    // paths/cmds/lines/PRs if any
}
```
**Discipline:** this record has **zero standing**. Writing, recalling, summarizing, or counting it confers no authority. It is the *input* to a gated translation, not an assertion.

---

## Candidate envelope sketch (mapping, non-executed)

```ts
// ILLUSTRATIVE mapping HermesDiarySourceRecord -> CandidateAssertion shape.
// Type-only; no function runs.
const candidate: CandidateAssertion = {
  estate_id,                                   // supplied by operator context
  actor_id,                                    // the actor the claim is about
  assertion_class: 'observation',              // default for diary-origin (AssertionClass)
  body: { text: src.text },                    // Record<string, unknown>
  schema_version,                              // optional
  provenance: [{
    provenance_id,
    source_type: src.source_kind,              // ProvenanceSourceType
    source_uri: src.journal_path,
    observed_at: src.observed_at,
    captured_by: src.captured_by,
    evidence_summary,                          // optional, from evidence_refs
  }],                                          // ProvenanceRef[]
  privacy_scope: 'actor_private',              // PrivacyScope — fail closed if unclear
  risk_level: 'low',                           // RiskLevel — core type, not RecallWedgeRiskLevel
  recall_scope,                                // optional string[]
  confidence,                                  // optional number
  subject_refs, linked_assertion_refs,         // optional, only when justified
  signatures: [/* SignatureEnvelope — dev_signature only in any local design */],
};
```
Optional fields are included only where an observed `CandidateAssertion` field justifies them. `signatures` is required by the shape; any local design could only produce `dev_signature` envelopes (non-production).

---

## Status-label mapping

| Hermes label | Meaning | Where it lives |
|---|---|---|
| `[?]` | candidate / hypothesis / unverified | Hermes-side metadata on the envelope; default. Does **not** map to a Straylight "verified" state. |
| `[E]` | evidence located | maps to a populated `ProvenanceRef` (`source_uri`/`source_hash`/`evidence_summary`). |
| `[V]` | adjudicated verification | Hermes-side; corresponds to admission only **after** validation + policy + operator authorization. Never adapter-minted. |
| `[A]` | authorized action | Hermes-side operator permission; never written into a Straylight field by the adapter. |

`[?]`/`[V]`/`[A]` are **Hermes metadata**; only `[E]` has a natural Straylight projection (provenance). Straylight's own `AssertionStatus` (`proposed|active|contested|…`) is set by *its* admission/transition logic, not by a Hermes label.

---

## Class-validation boundary

`ClassValidationResult` (`types.d.ts:121`) can express: `valid: boolean`, `schema_id`, `schema_version`, and an `errors: ValidationError[]` list. It is the **shape** a validation would return.

**Explicitly:** no validation function is called in this slice. `validateCandidateAssertion` is declared in the root `.d.ts` but is **not** a callable runtime API from the built package (root is types-only). Running it would require Layer C (source-local) or a future runtime export — neither is in scope here.

---

## Recall-request sketch (mapping, non-executed)

```ts
// ILLUSTRATIVE RecallRequest shape — type-only, executeRecall NOT called.
const req: RecallRequest = {
  recall_request_id, actor_id, estate_id, requested_by,
  task: 'recall context for <hermes task>',
  environment_frame,                       // EnvironmentFrame
  risk_profile: 'low',                     // RiskLevel
  requested_classes: ['observation'],      // AssertionClass[]
  include_receipt_detail,                  // ReceiptDetailLevel (required)
  signature: {/* SignatureEnvelope */},    // required
  created_at,                              // ISO8601
};
```
**Discipline:** recall output is **context**, not automatic authority. A recalled item (`RecallItem`, `types.d.ts:241–250`) carries `provenance_refs: string[]` — **provenance *references*, not full provenance** — plus a `use_instruction` (`usable|mark_as_contested|use_as_background_only|do_not_use_for_action`, `types.d.ts:240`). Those references are **conditional on `include_provenance: true`** on the `RecallRequest`; the example request above **omits** `include_provenance`, so under current behavior `provenance_refs` would be an **empty array**. If `include_provenance` is omitted or `false`, consumers MUST treat provenance references as **absent/empty** and **fail closed** for any authority-sensitive use that requires provenance. Hermes consuming a recalled item does not make it a Hermes fact without separate adjudication. `executeRecall` is **not** called here.

---

## Fail-closed cases

| Condition | Behavior |
|---|---|
| Type not root-exported | Do not claim it importable from `@loa/straylight`; reach via `@loa/straylight/host` only if it is a host type (e.g. `RecallWedgeRiskLevel`), else stop. |
| Missing evidence | No `ProvenanceRef` → candidate stays `[?]`; not admittable. |
| Ambiguous diary source | Refuse to map; require disambiguation. |
| Unsupported assertion class | Not in `AssertionClass` enum → reject (would fail class validation). |
| Unclear privacy scope | Fail closed — treat as most-restrictive / refuse recall. |
| Unacceptable risk level | `risk_level`/`risk_profile` outside policy tolerance → refuse. |
| Attempted self-promotion | `[V]`/`[A]` require operator; adapter cannot mint them. |
| No adjudication | No operator `[A]` → no admission. |
| Attempt to call root runtime API | Refuse — root is types-only; no callable runtime exists. |
| Attempt to use Dixie-gated runtime seam | `handleRecallIntake` is Layer B, Dixie-gated, not Hermes-facing → refuse. |
| Live deployment requested but unavailable | Refuse — Straylight is not deployed; no endpoint exists. |

---

## Non-goals

no runtime adapter · no source-local harness · no implementation · no tests · no build · no package export change · no `handleRecallIntake` · no `npm pack`/`publish` · no live endpoint · no real Dixie/Finn/Freeside/Hounfour runtime verification.

---

## Next possible slices (future options — each requires separate `[A]`)

- **Source-local harness proposal** — proposal only; enumerate which `src/straylight/` imports would be needed and why that is Layer C, not package-consumer behavior.
- **Future package runtime export ADR** — a Straylight-side decision to widen a root/host export beyond `types`, if Straylight chooses to support a runtime package API.
- **Typecheck-only sketch file** — an actual `.ts` that is type-checked (not run) against the package types; would itself need a separate `[A]` because it adds a real source file.
- **Live deployment lane** — only after Loa-Straylight is actually deployed.

---

*End of sketch. Type-only; no runtime behavior is defined or invoked; nothing here is compiled or executed.*
