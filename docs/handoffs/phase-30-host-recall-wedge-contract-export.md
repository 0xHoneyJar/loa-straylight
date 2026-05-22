# Phase 30 — Host-consumable Recall Wedge contract export (Dixie consumer handoff)

> **Status:** Operator-oriented implementation handoff. **Code-bearing.**
> Phase 30 makes the Phase 29B Straylight-side Recall Wedge
> **host contract** consumable from the existing
> `@loa/straylight/host` package surface. It is **not** an
> endpoint, **not** a runtime, **not** a policy evaluator,
> **not** a signature verifier, **not** a signer-competence
> implementation, **not** a storage adapter, **not** an
> audit-chain executor, and **not** a sibling-repo edit.
> Canonical record:
> [`../decisions/ADR-030-host-recall-wedge-contract-export.md`](../decisions/ADR-030-host-recall-wedge-contract-export.md).

## TL;DR (≤ 1 minute)

- Phase 29B authored the Straylight-side Recall Wedge host
  contract under `src/straylight/host/recall-wedge-contract.ts`
  and intentionally did **not** widen the host barrel to
  re-export it. Phase 30 closes that gap at the source-barrel
  level **and** at the package type-surface level.
- Adds a host-barrel re-export
  ([`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts))
  and a Phase 30 executable contract export test
  ([`../../tests/phase-30-host-recall-wedge-contract-export.test.ts`](../../tests/phase-30-host-recall-wedge-contract-export.test.ts)).
- In Phase 30, a future Dixie consumer can **type-check**
  against the Recall Wedge host contract from
  `@loa/straylight/host`. The `./host` export remains
  `types`-only per package.json — Dixie **must not**
  runtime-import or call helpers from `@loa/straylight/host`.
  The callable helpers re-exported through the host barrel are
  **in-repo / source-level contract helpers only** in Phase 30
  and are **not a package runtime surface**. A future phase
  may add a runtime host export or a Dixie-side runtime adapter
  if explicitly authorized; Phase 30 does not. **No new
  package.json export key is added.**
- Pinned posture preserved verbatim from Phase 29B: contract
  version literal `'phase-29b.recall-wedge-contract.v0'`;
  Dixie is the default and only active host kind; Hounfour
  remains class / schema / conformance-vector substrate;
  Straylight remains the semantic owner; Finn remains a
  boundary marker only.
- **Not endpoint-wired**, **not runtime-wired**, **not policy
  / signature / signer-competence / audit / storage**, **not
  Dixie/Finn/Hounfour repo-editing**, **no `package.json`
  export change**, **no new wedge public-API export**, **no
  vendoring**, **no tag / release / publish**.
- Phase 30 is a §3-class **first-class implementation slice**
  under
  [ADR-026A0 §"Decision" §3](../decisions/ADR-026A0-operator-authority-flatline-rule.md).
  It inherits **its own** §4.d real 3-model Flatline +
  Bridgebuilder pre-merge requirement. The Phase 29B PR (#58;
  squash SHA `5b713bd`) does **not** satisfy / waive /
  pre-satisfy §4.d for Phase 30.
- ADR-022E gates #1, #2, #3, #4, #5, #9, #17, #18 all remain
  **HELD**. The class-vs-policy boundary is preserved.

## 1. Summary

Phase 29B left an unbridged seam: the Straylight-side Recall
Wedge contract module
[`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts)
exists, is type-only / pure-helper, and imports from no other
Straylight module — but the host barrel
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
was intentionally not widened to re-export it. A future Dixie
BFF / inspection consumer would need to either reach into a
deep import path (which the `./host` export does not declare)
or wait for a successor phase to widen the barrel.

Phase 30 widens the host barrel. The contract is now
consumable from the existing `@loa/straylight/host` package
export. Phase 30 stops there. It does **not** author a Dixie
endpoint, does **not** wire any runtime, does **not** evaluate
policy, does **not** verify signatures, does **not** enforce
signer competence, does **not** persist storage, does **not**
execute an audit chain, and does **not** edit any sibling
repo.

The seam is proven by an executable contract export test
[`../../tests/phase-30-host-recall-wedge-contract-export.test.ts`](../../tests/phase-30-host-recall-wedge-contract-export.test.ts)
that imports from **only** `'../src/straylight/host/index.js'`
+ `node:*` + `'vitest'`. That import discipline is the
guarantee — a host consumer can reach the contract via the
public host surface alone.

## 2. Files changed

| # | File | Why |
|---|---|---|
| 2.a | [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) | Modified. Re-exports the Phase 29B contract module's named values and types under the existing host barrel. Pre-existing Phase 24C exports (handlers, dep types, intake-log helpers, tenancy helpers) are preserved verbatim. No runtime / policy / storage / audit / signature / signer code is added. |
| 2.b | [`../../tests/phase-30-host-recall-wedge-contract-export.test.ts`](../../tests/phase-30-host-recall-wedge-contract-export.test.ts) | New. Executable contract export test (61 cases) proving: a host consumer can import the contract from `@loa/straylight/host`; the version literal is `'phase-29b.recall-wedge-contract.v0'`; Dixie is the default and only active host kind; Hounfour remains substrate-only metadata; Finn remains a boundary marker (the boundary assertion throws on Finn-widening drift); the host export does not transitively import runtime / policy / storage / audit / signature / signer implementation; the package surface is ready for Dixie consumption. |
| 2.c | [`../../tests/phase-29b-recall-wedge-contract.test.ts`](../../tests/phase-29b-recall-wedge-contract.test.ts) | Modified. The "host barrel does NOT re-export the contract" pin (Phase 29B posture) is updated to "host barrel re-exports the contract module under the Phase 30 host-consumable seam" (Phase 30 posture). The "package.json declares the existing three exports keys" pin is preserved verbatim. |
| 2.d | [`../decisions/ADR-030-host-recall-wedge-contract-export.md`](../decisions/ADR-030-host-recall-wedge-contract-export.md) | New. Canonical Phase 30 decision record. |
| 2.e | [`./phase-30-host-recall-wedge-contract-export.md`](./phase-30-host-recall-wedge-contract-export.md) | New. This handoff. |
| 2.f | [`./README.md`](./README.md) | Append-only Phase 30 index entry. |
| 2.g | [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md) | Append-only Phase 30 navigation pointer. |
| 2.h | [`../../dist-types/src/straylight/host/index.d.ts`](../../dist-types/src/straylight/host/index.d.ts) | Regenerated. The host barrel declaration emit picks up the Phase 29B contract re-exports. Reproducible from `npm run build`. This is the **only** authorized `dist-types/` change in Phase 30; every other `dist-types/` path remains forbidden, and `dist/` (runtime JS) remains forbidden in full. |

[`../../package.json`](../../package.json) and
[`../../package-lock.json`](../../package-lock.json) are
**unchanged**. No `npm install`, no dependency change, no
export-key change. The existing three-key `exports` map (`"."`,
`"./host"`, `"./runtime/recall-intake"`) is preserved verbatim;
the `./host` export remains `types`-only.

[`../../src/straylight/index.ts`](../../src/straylight/index.ts)
(the wedge public API surface) is **unchanged**. Phase 30 does
**not** widen the wedge public surface; the host barrel is the
only seam touched.

[`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts)
is **unchanged**. Phase 30 only re-exports its existing
surface.

## 3. Dixie consumer handoff (the operator-facing answer)

This section is the canonical answer to "what can Dixie do
now, and how?" for the future Phase 30B / 30C / 31 consumer
PR. It is intentionally narrow: Phase 30 does **not** author a
Dixie endpoint and does **not** edit `loa-dixie`.

### 3.1 What Dixie can consume now

A future `loa-dixie`-side PR may, under its own §4.d gate:

- Add `@loa/straylight` as a dependency (or workspace link).
- **Type-check** against the Phase 29B Recall Wedge host
  contract through the existing `@loa/straylight/host`
  package type-surface. Because the `./host` export is
  `types`-only per `package.json`, every import below MUST
  use `import type` (or `import type * as ... + typeof`).
  Dixie **must not** runtime-import from
  `@loa/straylight/host`, and **must not** call the helpers
  re-exported through the host barrel as if they were a
  package runtime surface — they are in-repo / source-level
  contract helpers only in Phase 30:
  ```ts
  // ✅ Type-only consumption — supported in Phase 30.
  import type {
    StraylightRecallWedgeContractVersion,
    RecallWedgeActorScope,
    RecallWedgeBoundaryOwner,
    RecallWedgeContractBoundary,
    RecallWedgeEnvironmentFrame,
    RecallWedgeEnvironmentSurface,
    RecallWedgeHostKind,
    RecallWedgeInclusionDecision,
    RecallWedgeInspectionItem,
    RecallWedgeInspectionReceipt,
    RecallWedgeInspectionRequest,
    RecallWedgeInspectionResult,
    RecallWedgeInspectionSummary,
    RecallWedgeRiskLevel,
    RecallWedgeSourceCorpusRef,
  } from '@loa/straylight/host';

  // ✅ Helper SIGNATURES via `import type * as` + `typeof` —
  //    still pure type-space; no runtime import.
  import type * as Host from '@loa/straylight/host';
  type SummarizeFn = typeof Host.summarizeRecallWedgeInspection;
  type ReceiptFn = typeof Host.createRecallWedgeInspectionReceipt;
  type CorpusFn = typeof Host.createRecallWedgeSourceCorpusRef;
  type AssertFn = typeof Host.assertRecallWedgeContractReadOnlyBoundary;

  // ❌ Forbidden in Phase 30 — value imports / dynamic imports /
  //    require() of `@loa/straylight/host` are NOT supported
  //    because the `./host` export is types-only.
  // import {
  //   summarizeRecallWedgeInspection,
  // } from '@loa/straylight/host';
  // const mod = await import('@loa/straylight/host');
  // const mod = require('@loa/straylight/host');
  ```
- Use the contract types as the **wire shape** Dixie's eventual
  inspection / BFF endpoint accepts and returns.
- The four pure helpers (`createRecallWedgeSourceCorpusRef`,
  `summarizeRecallWedgeInspection`,
  `createRecallWedgeInspectionReceipt`,
  `assertRecallWedgeContractReadOnlyBoundary`) exist on the
  in-repo host barrel and are referenceable by their TYPE
  signature only from the Phase 30 package surface (via
  `typeof` on a type-only namespace import). Dixie **must not**
  call them at runtime through `@loa/straylight/host` in
  Phase 30. A future phase may add a runtime host export
  authorizing such calls; until then, Dixie either re-implements
  the equivalent count/shape derivation locally against the
  contract types, or waits for the runtime host export to be
  authorized.
- Pin Dixie's host kind to `'dixie-first-inspection-bff'` (the
  default). The active set is exactly that one kind under the
  Phase 30 contract.

### 3.2 What Dixie must NOT own

Phase 30 makes the contract type-checkable through the
`@loa/straylight/host` package type-surface; it does **not**
flip ownership and does **not** authorize runtime / callable
consumption of the package surface. The Dixie consumer PR — when
it lands — must **not** own and must **not** do:

- **Runtime import / value import / dynamic `import()` /
  `require()` of `@loa/straylight/host`.** The `./host`
  package export is `types`-only; runtime resolution will
  fail. The Phase 30 boundaries are kept:
  - **No Dixie endpoint in Phase 30.**
  - **No runtime recall in Phase 30.**
  - **No policy evaluator in Phase 30.**
  - **No signature verifier in Phase 30.**
  - **No signer-competence implementation in Phase 30.**
  - **No storage adapter in Phase 30.**
  - **No audit-chain executor in Phase 30.**
  - **Hounfour remains substrate-only.**
  - **Finn remains boundary-only.**
  - **Straylight remains the semantic owner.**
- **Calling helpers from `@loa/straylight/host`.** The four
  callable helpers (`createRecallWedgeSourceCorpusRef`,
  `summarizeRecallWedgeInspection`,
  `createRecallWedgeInspectionReceipt`,
  `assertRecallWedgeContractReadOnlyBoundary`) live on the
  in-repo host barrel for source-level / contract-test use
  only in Phase 30. They are NOT a package runtime surface.
  A future phase may add a runtime host export or a
  Dixie-side runtime adapter if explicitly authorized.

- **Policy validation.** `RecallWedgeInclusionDecision`
  (`'include' | 'exclude' | 'redact' | 'refuse'`) is a wire
  shape. The decision-producing logic — admission, refusal,
  authorization, signer-competence enforcement — lives on the
  Straylight side and is **not** transferred by Phase 30.
- **Signer competence.** Signer competence remains a
  Straylight-owned policy primitive.
- **Signature verification.** The optional `integrity` field
  on `RecallWedgeSourceCorpusRef` is **metadata only**; Dixie
  must not promote it into a verification gate. Cryptographic
  enforcement, when added, will be a separate first-class
  proposal under its own §4.d gate.
- **Storage.** Dixie does not persist `RecallPack`,
  `RecallReceipt`, audit chains, or estate state. The wedge's
  `EstateStore` / `JsonlStorage` / `InMemoryStorage` adapters
  are not part of the Phase 30 host export.
- **Audit-chain execution.** Dixie does not order, hash, or
  verify audit events. The `0xhoneyjar:straylight:`
  soft-audit-prefix policy remains Straylight-owned.
- **Recall runtime.** Dixie does not call the wedge's
  `executeRecall` / `validateRecallRequest` / policy evaluator
  through the Phase 30 host export. The host export is
  type-only / pure-helper; the wedge runtime surface is
  unchanged.
- **Schema authority.** Hounfour ships
  `@0xhoneyjar/loa-hounfour@8.7.0` and the
  `recall-wedge-conformance-vectors` corpus. Dixie does not
  redefine, fork, or vendor any Hounfour schema.
- **Boundary widening.** Dixie must not list
  `'finn-runtime-enforcement-later'` as an active host kind,
  add a new active host kind, or rename
  `'dixie-first-inspection-bff'`. The
  `assertRecallWedgeContractReadOnlyBoundary` helper throws
Dixie-side CI may type-check this helper signature through `import type` from `@loa/straylight/host`; runtime invocation of `assertRecallWedgeContractReadOnlyBoundary` is deferred until a later phase explicitly authorizes a runtime host export or Dixie-side adapter.

### 3.3 Exact import path / export name Dixie should target

| What | Path |
|---|---|
| Package | `@loa/straylight` |
| Export key | `./host` (types-only; the existing key, unchanged by Phase 30) |
| Specifier | `@loa/straylight/host` (consumed via `import type` only in Phase 30) |
| Type-source target file | `dist-types/src/straylight/host/index.d.ts` (regenerated by Phase 30) |
| In-tree source (NOT a Dixie consumption target) | [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) |
| Phase 29B contract module (NOT a deep import target) | [`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts) |

Dixie SHOULD reach the contract type-surface through the
`@loa/straylight/host` specifier only, and only via
`import type` (or `import type * as ... + typeof` for helper
signatures). The Phase 30 export test forbids reaching past the
barrel into the contract module's deep path. **Runtime import /
callable helper consumption from `@loa/straylight/host` is
deferred** — Phase 30 does not authorize it; a future phase may.

### 3.4 Expected request / response / error contract boundaries (contract-level only)

Phase 30 does NOT author a Dixie endpoint. The contract level
shape Dixie should use as a starting point — under its own
§4.d evaluation — is:

- **Request shape** (Dixie's eventual inspection endpoint
  body) maps onto `RecallWedgeInspectionRequest`. Dixie SHOULD
  accept a request whose JSON projection assigns:
  - `request_id: string`
  - `actor_scope: { actor_id, estate_id, tenant_id?, environment_id? }`
  - `environment: { purpose: string, surface: 'operator' | 'dixie-bff' | 'finn-runtime' | 'test', risk_level? }`
  - explicit boolean knobs `include_challenged`,
    `include_revoked`, `include_forgotten` (no defaulting on
    the wire — every flag must be stated)
  - `source_corpus: RecallWedgeSourceCorpusRef`
- **Item shape** (per-decision row in the response) maps onto
  `RecallWedgeInspectionItem`. Each item carries
  `assertion_id?` / `vector_id?`, the
  `'include' | 'exclude' | 'redact' | 'refuse'` decision, a
  `reason: string`, the `source_ref` (echoed corpus ref), and
  an optional `use_instruction`.
- **Response shape** (Dixie's eventual inspection endpoint
  response) maps onto `RecallWedgeInspectionResult` —
  `{ request, items, receipt }`. The receipt
  (`RecallWedgeInspectionReceipt`) carries the four
  per-decision counts, the contract version literal, the host
  kind (defaulting to `'dixie-first-inspection-bff'`), the
  source corpus, and an optional ISO-8601 timestamp.
- **Error shape** is **not** authored by Phase 30. The Dixie
  consumer PR must define how it surfaces a refusal / error
  envelope. The contract type for `decision === 'refuse'` is
  the canonical wire-level refusal; transport-level error
  envelopes (HTTP status, NATS status, etc.) live in the
  Dixie consumer PR's scope under its own §4.d evaluation.

The four pure helpers — especially
`createRecallWedgeInspectionReceipt` — produce a canonical
receipt from `(request, items[])`. They live on the in-repo
host barrel and are referenceable from `@loa/straylight/host`
**only by their TYPE signature** in Phase 30 (via
`import type * as Host` + `typeof Host.helperName`). Phase 30
does **not** authorize Dixie to call these helpers at runtime
through `@loa/straylight/host`. A future phase may add a
runtime host export that Dixie can call; until then, Dixie
either re-derives the per-decision counts locally against the
`RecallWedgeInclusionDecision` union or waits for that runtime
export to be authorized.

### 3.5 What this PR does NOT do (Dixie consumer PR boundary)

- **This PR does not implement a Dixie endpoint.** No HTTP
  route, no NATS subject, no in-process handler. The Phase 30
  PR ships only the host-consumable seam (host-barrel
  re-export + executable export test + ADR + handoff).
- **This PR adds no runtime / policy / storage / audit /
  signature / signer implementation.** The host export
  remains types-only / pure-helper. No wedge runtime, no
  policy evaluator, no signature verifier, no signer-
  competence implementation, no storage adapter, no audit-
  chain executor is added.
- **Hounfour remains class / schema / conformance substrate
  only.** The Phase 29A `8.7.0` pin is consumed verbatim
  through registry resolution. No vendoring; no schema
  authority transfer; no new Hounfour subpath consumption;
  no new wedge public-API export under the Hounfour name.
- **Straylight remains the semantic owner.** The wedge owns
  policy validation, signer competence, signature
  verification, audit-chain execution, estate transitions,
  recall runtime, authorization, and runtime refusal
  behavior. The host barrel re-export does not transfer any
  of those across the seam.
- **No sibling-repo edit.** `loa-dixie`, `loa-finn`,
  `loa-hounfour`, and `loa-freeside` are unedited by Phase
  30.

## 4. What the Phase 30 export test proves

[`../../tests/phase-30-host-recall-wedge-contract-export.test.ts`](../../tests/phase-30-host-recall-wedge-contract-export.test.ts)
ships contract export cases grouped:

| Group | What it proves |
|---|---|
| In-repo host barrel re-exports the Phase 29B contract | Reading the in-repo source barrel (`'../src/straylight/host/index.js'`) exposes the eight named contract values + every contract type. The host barrel source contains a `from './recall-wedge-contract.js'` re-export specifier. **This proves the in-repo host barrel SHAPE; it does not prove runtime package consumption** (the package's `./host` export is types-only). |
| Contract version literal preserved through the host seam | `STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION === 'phase-29b.recall-wedge-contract.v0'` (read via the host barrel). The boundary constant carries the same literal. The type alias matches the const literal at compile time. |
| Dixie-first default + Finn-as-boundary-only via host barrel | `DEFAULT_RECALL_WEDGE_HOST_KIND === 'dixie-first-inspection-bff'`. `RECALL_WEDGE_ACTIVE_HOST_KINDS` lists exactly the Dixie-first kind. Finn's lane description names it as "not an active host". `assertRecallWedgeContractReadOnlyBoundary` accepts the canonical boundary. |
| Hounfour substrate-only via host barrel | The Hounfour boundary description names "substrate" and does NOT name policy / signer / signature / audit / runtime ownership. The Straylight description names the semantic ownership lane. `createRecallWedgeSourceCorpusRef()` pins `@0xhoneyjar/loa-hounfour@8.7.0` + `recall-wedge-conformance-vectors` + `/loa-hounfour/8.7.0/`; `integrity` defaults to `undefined`. |
| Finn boundary-only via host barrel | Every required boundary owner (Hounfour / Straylight / Dixie / Finn / Loa) has a non-empty description. The boundary assertion throws when a candidate widens Finn into the active set, and throws when the contract version drifts off the Phase 29B literal. |
| Receipt composition wired end-to-end | A summarize → receipt round-trip via the **in-repo host barrel** produces the canonical Dixie-first receipt with the right per-decision counts. Every `RecallWedgeInclusionDecision` value round-trips. Every `RecallWedgeEnvironmentSurface` and every `RecallWedgeRiskLevel` literal is part of the contract type accepted by the request shape. |
| Host export does NOT add runtime/policy/storage/audit/signature/signer implementation (with hardened relative-import scan) | The contract module's source — scanned by parsing every import / `export ... from` / dynamic `import()` / `require()` SPECIFIER — contains no specifier that resolves into `src/straylight/runtime/**`, `policy`, `storage/**`, `audit`, `signatures`, `signature` (or `crypto/signature`), `keyring`, `signer`, or `recall`. Both the package-style absolute form (`@straylight/runtime/...`, `straylight/runtime/...`) AND any relative variant (`'../runtime/...'`, `'../signer'`, `'../../straylight/audit.js'`) are flagged. The Hounfour package is not imported. The wedge public surface (`@loa/straylight` or `'../index.js'`) is not imported. The contract module is allowed to remain standalone (no imports at all). |
| Phase 30 test imports only from the in-repo host barrel + node:* + vitest | The Phase 30 test file imports exclusively from `'../src/straylight/host/index.js'`, `'node:child_process'`, `'node:fs'`, `'node:os'`, `'node:path'`, `'node:url'`, and `'vitest'`. The same hardened forbidden-area scan is applied to this test file's import lines: no wedge public API import; no runtime import; no policy import; no storage import; no audit import; no signatures import; no keyring import; no recall import; no host-handler import; no deep `host/recall-wedge-contract` import; no Hounfour package reference; no sibling-repo working-tree path. |
| Package surface ready for Dixie consumption (types-only) | `package.json` `./host` export remains `types`-only (no `import` / `require` / `default` field). `package.json` declares exactly the existing three export keys. The host barrel exposes the contract symbols a future Dixie BFF consumer will type-check against. |
| Type-only `@loa/straylight/host` consumer proof (`tsc --noEmit`) | A deterministic temp consumer fixture is written to a fresh `mkdtempSync` directory and compiled with the in-repo `tsc --noEmit`. The fixture imports from `@loa/straylight/host` using `import type` only (and `import type * as Host` + `typeof Host.helperName` for helper signatures), with the specifier resolved through a tsconfig `paths` entry pointing at `dist-types/src/straylight/host/index.d.ts` — i.e. the exact file `package.json`'s `./host` export's `types` key resolves to. The fixture is checked offline, sibling-repo-free, network-free, and does **not** use `npm pack`. The case also asserts the fixture contains zero runtime imports of `@loa/straylight/host` (no value import, no dynamic `import()`, no `require()`). |

## 5. What is intentionally not implemented

Phase 30 makes the Phase 29B contract host-consumable. It is
not the Dixie endpoint, the wedge runtime, or any of the
related primitives. Phase 30 authorizes none of the following
— every one of them is a separate future first-class proposal
subject to its own §4.d gate:

- **No Dixie endpoint.** No HTTP route, no NATS subject, no
  in-process handler, no `app.post(...)`, no Dixie repo edit.
- **No runtime recall.** No call into the wedge's
  `executeRecall` / `validateRecallRequest` / policy evaluator
  is added at the seam.
- **No policy evaluator.** The decision-producing logic
  (governance, refusal, authorization, signer-competence
  enforcement) is not Phase 30's lane.
- **No signature verification.** `RecallWedgeSourceCorpusRef`
  carries an optional `integrity` field that is **metadata
  only**.
- **No signer-competence implementation.**
- **No storage adapter.**
- **No audit-chain execution.**
- **No Dixie / Finn / Hounfour / Freeside repo edit.**
- **No `package.json` change.** No new export key, no
  widening of `exports`, no new dependency, no version bump.
  The `./host` export remains `types`-only; the runtime
  allowlist is unchanged.
- **No new wedge public-API export.** The wedge public surface
  in
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  is unchanged.
- **No vendoring.** No vector JSON, no recall-wedge `README.md`,
  no envelope schema is copied into the Straylight tree.
- **No tag, release, or publish.**
- **No ADR-022E gate firing.** Gates #1, #2, #3, #4, #5, #9,
  #17, #18 all remain **HELD**.

## 6. Successor phase plan

- **Phase 30B / 30C / 31** is the next first-class step
  after Phase 30. It SHOULD be the **Dixie-side consumer
  wiring** (a `loa-dixie`-side PR that imports the Phase 30
  contract from `@loa/straylight/host` and adds an inspection
  / BFF endpoint). Phase 30B is a **separate first-class
  proposal** with its own §4.d evidence; Phase 30 is **not**
  authority for it.
- **Finn integration** remains gated by
  [ADR-027C](../decisions/ADR-027C-finn-return-gate-readiness.md).
  Phase 30 represents Finn only as a boundary marker; it does
  not edit `loa-finn`.
- **Hounfour shape adoption** beyond the Phase 29A
  composition / vector-access evidence remains gated by
  ADR-022E gates #1 / #2 / #3 / #5 / #17 / #18, all of which
  remain HELD.

## 7. ADR-022E gate posture

| Gate | Trigger (verbatim spirit) | Phase 30 posture | Disposition |
|---|---|---|---|
| #1 | Canonical `estate-transition.schema.json` + adopting ADR | Not adopted; not authored. | **HELD** |
| #2 | Local `EstateTransition` type / schema / fixture | Not authorized. | **HELD** |
| #3 | New JS subpath (`./canonicalize` / `./utilities`) | Not consumed. | **HELD** |
| #4 | `Challenge` adopted into wedge public surface | Not authorized. The host barrel widening does NOT cross the wedge public surface. | **HELD** |
| #5 | `AuditEvent` adopted from Hounfour candidate | Not authorized. | **HELD** |
| #9 | Finn runtime / audit-return integration | Not authorized. Finn appears as a boundary marker only. | **HELD** |
| #17 | New Hounfour subpath consumption with separate ADR | Not consumed. | **HELD** |
| #18 | Hounfour-named symbol on wedge public surface | Not authorized. The host barrel widening does NOT cross the wedge public surface. | **HELD** |

The class-vs-policy boundary is preserved. **Hounfour
provides** class / schema / conformance-vector substrate.
**Straylight still owns** policy validation, signer competence,
signature verification, audit-chain execution, estate
transitions, recall runtime, authorization, and runtime
refusal behavior. Phase 30's host-barrel widening exposes the
Phase 29B contract surface; it does not transfer any primitive
across the boundary.

## 8. §4.d posture

Phase 30 is **code-bearing**. Per
[ADR-026A0 §"Decision" §3 / §5](../decisions/ADR-026A0-operator-authority-flatline-rule.md),
Phase 30 inherits **its own** §4.d real 3-model Flatline +
Bridgebuilder pre-merge requirement.

- ADR-029B / Phase 29B PR (#58; squash SHA `5b713bd`) does
  **not** satisfy / waive / pre-satisfy §4.d for Phase 30.
- Phase 30's §4.d is **independently unsatisfied** until a
  real 3-model Flatline + Bridgebuilder run is executed
  against the Phase 30 scope/PR.
- The fact that Phase 30 is a small, additive host-barrel
  widening + executable export test is **not** a §4.d
  substitute. Code-bearing PRs require §4.d evidence
  regardless of size.

## 9. Validation checklist

Run before review:

```bash
# Reproduces the authorized dist-types declaration emit
# (committed-declaration policy from ADR-024G).
npm run build

npm run typecheck

# Phase 30 targeted contract export test + Phase 29B contract
# test (export-posture pin updated by Phase 30) + Phase 24C
# host-surface-shape pin (carries the Phase 29B regex
# tightening; unchanged by Phase 30).
npm test -- \
  tests/phase-30-host-recall-wedge-contract-export.test.ts \
  tests/phase-29b-recall-wedge-contract.test.ts \
  tests/phase-24c-host-surface-shape.test.ts

# Full suite.
npm test

# Whitespace + boundary check.
git diff --check

# Forbidden-path guard. Should return no entries.
git status --short -- \
  dist fixtures \
  .github .claude .loa .run grimoires \
  package.json package-lock.json \
  src/straylight/index.ts

# Narrowed dist-types check — the only authorized
# `dist-types/` change in Phase 30.
git status --short -- dist-types
```

Phase 30's review should also verify:

- No new export key added to
  [`../../package.json`](../../package.json)
  `exports`.
- No new export added to the wedge public surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts)).
- The host-barrel widening adds **only** the Phase 29B
  contract re-exports — no runtime / policy / storage /
  audit / signature / signer code is added.
- No vendored vector JSON, recall-wedge `README.md`, or
  envelope schema under `fixtures/` or anywhere else in the
  Straylight tree.
- No `loa-dixie` / `loa-finn` / `loa-hounfour` / `loa-freeside`
  sibling-repo edit shipped with the Phase 30 PR.
- No `package.json` / `package-lock.json` change.
- **No `dist/` (runtime JS) change.** `dist/` remains
  forbidden by Phase 30 in full.
- The **only** `dist-types/` path that appears in the Phase
  30 PR is `dist-types/src/straylight/host/index.d.ts`, which
  is the regenerated, reproducible declaration emit required
  by the
  [ADR-024G](../decisions/ADR-024G-host-package-subpath-implementation.md)
  committed-declaration policy.

## 10. Codex / Flatline / Bridgebuilder review requirement

Because Phase 30 is **code-bearing**, the Phase 30 PR
requires:

1. **Codex audit** against the Phase 30 scope/PR. This is not
   optional.
2. **Real 3-model Flatline run** against the Phase 30 scope/PR
   (per
   [ADR-026A0 §"Decision" §3 / §5](../decisions/ADR-026A0-operator-authority-flatline-rule.md)).
3. **Bridgebuilder run** against the Phase 30 scope/PR.

§4.d evidence MUST be attached to the Phase 30 PR before
merge. Phase 29B's §4.d evidence is **not** §4.d evidence for
Phase 30 and may not be cited as such.

## Citations

- [`../decisions/ADR-030-host-recall-wedge-contract-export.md`](../decisions/ADR-030-host-recall-wedge-contract-export.md)
  — canonical Phase 30 decision/scope record (this handoff's
  authorizing in-repo doc).
- [`../decisions/ADR-029B-dixie-first-recall-wedge-contract.md`](../decisions/ADR-029B-dixie-first-recall-wedge-contract.md)
  — Phase 29B contract module + executable contract test;
  Phase 30 widens the host barrel without altering the
  contract module.
- [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
  §"Decision" §3 / §5 / §6.Forbidden — first-class
  implementation slice classification, §4.d pre-merge
  requirement, the not-authority list.
- [`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md)
  — `./host` types-only invariant; runtime allowlist (Phase
  30 leaves both untouched).
- [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md)
  — committed-declaration policy ("`dist-types/` is committed
  AND reproducible").
- [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — gate inventory; none fired by Phase 30.
- [`../decisions/ADR-027C-finn-return-gate-readiness.md`](../decisions/ADR-027C-finn-return-gate-readiness.md)
  — Finn return-gate readiness governance; Finn integration
  remains gated by ADR-027C, not Phase 30.
- [`../decisions/ADR-027B-Fire-hounfour-composition-contracts.md`](../decisions/ADR-027B-Fire-hounfour-composition-contracts.md)
  §"Decision" §2 / §3 — Phase 28A composition-contract
  evidence lock; class-vs-policy boundary preserved here.
- [`./phase-29b-dixie-first-recall-wedge-contract.md`](./phase-29b-dixie-first-recall-wedge-contract.md)
  — Phase 29B operator-oriented handoff (the contract this
  Phase 30 seam exposes).
- [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order; Phase 30
  edits no sibling repo.
