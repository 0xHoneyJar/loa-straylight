# Phase 29B — Dixie-first Recall Wedge contract pack

> **Status:** Operator-oriented implementation handoff. **Code-bearing.**
> Phase 29B ships the Straylight-side Recall Wedge **host
> contract** (types + pure helpers + executable contract tests)
> that the future Dixie-first recall-inspection / BFF path will
> consume. It is **not** an endpoint, **not** a runtime, **not**
> a policy evaluator, **not** a signature verifier, **not** a
> signer-competence implementation, **not** a storage adapter,
> **not** an audit-chain executor, and **not** a sibling-repo
> edit. Canonical record:
> [`../decisions/ADR-029B-dixie-first-recall-wedge-contract.md`](../decisions/ADR-029B-dixie-first-recall-wedge-contract.md).

## TL;DR (≤ 1 minute)

- Phase 29B authors the **Straylight-side host contract** the
  Dixie-first MVP recall-inspection / BFF path will consume.
  It is type-only / pure-helper, runtime-isolated, and
  read-only against the wedge.
- Adds one source file
  ([`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts))
  and one test file
  ([`../../tests/phase-29b-recall-wedge-contract.test.ts`](../../tests/phase-29b-recall-wedge-contract.test.ts)).
- Pins the contract version literal
  `'phase-29b.recall-wedge-contract.v0'`, the Dixie-first
  default host kind, the Hounfour substrate package literals
  (`@0xhoneyjar/loa-hounfour`@`8.7.0`,
  `recall-wedge-conformance-vectors`,
  `/loa-hounfour/8.7.0/`), and the five-owner boundary table
  (Hounfour / Straylight / Dixie / Finn / Loa).
- **Not endpoint-wired**, **not runtime-wired**, **not policy
  / signature / signer-competence / audit / storage**, **not
  Dixie/Finn/Hounfour repo-editing**, **no `package.json`
  export change**, **no new public type re-export from the
  wedge public API**, **no vendoring**, **no tag / release /
  publish**.
- Phase 29B is the §3-class **first-class implementation slice**
  under
  [ADR-026A0 §"Decision" §3](../decisions/ADR-026A0-operator-authority-flatline-rule.md).
  Because Phase 29B is code-bearing, it inherits **its own**
  §4.d real 3-model Flatline + Bridgebuilder pre-merge
  requirement. ADR-027B-Track1-code-candidate-scope (Phase
  28E) and the merged Phase 29A PR do **not** satisfy / waive /
  pre-satisfy §4.d for Phase 29B.
- ADR-022E gates #1, #2, #3, #4, #5, #9, #17, #18 all remain
  **HELD**. The class-vs-policy boundary is preserved.

## 1. Summary

Phase 29A proved that the Hounfour-published recall-wedge
conformance-vector corpus is reachable from the installed
`@0xhoneyjar/loa-hounfour@8.7.0` package via registry
resolution, with no vendoring. That proof is **substrate-only**:
it does not name what an inspection request looks like, who
owns refusal/authorization semantics, what an inspection
receipt is, or which host the MVP recall-inspection path lives
on.

Phase 29B fills exactly that gap and stops there. It ships:

1. A type-only / pure-helper module
   [`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts)
   that pins the **host-facing contract surface** the future
   Dixie-first recall-inspection / BFF path will consume.
2. An executable contract test
   [`../../tests/phase-29b-recall-wedge-contract.test.ts`](../../tests/phase-29b-recall-wedge-contract.test.ts)
   that proves the contract version, the Hounfour-substrate
   pinning, the Dixie-first default + Finn-as-boundary-only
   posture, the per-decision derivation, and the
   forbidden-import boundary (the contract module imports
   nothing from any other Straylight module; the test imports
   no Straylight runtime / policy / storage / audit / signer
   behavior).
3. A canonical decision record
   [`../decisions/ADR-029B-dixie-first-recall-wedge-contract.md`](../decisions/ADR-029B-dixie-first-recall-wedge-contract.md)
   that pins the boundary table, the Dixie-first selection,
   the Finn boundary-marker posture, the ADR-022E gate
   disposition, and the §4.d posture.
4. A minimal legacy-test update to
   [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts)
   required by the new host-directory file (see §2 below).

Phase 29B does **not** add a new wedge public-API export. The
host barrel
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
and the wedge public surface
[`../../src/straylight/index.ts`](../../src/straylight/index.ts)
are intentionally unchanged: the contract module is a private
host-side artifact at
`src/straylight/host/recall-wedge-contract.ts`, not a public
surface.

## 2. Files changed

| # | File | Why |
|---|---|---|
| 2.a | [`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts) | New. Type-only / pure-helper module pinning the Phase 29B host-facing contract surface (contract version, host-kind union, boundary-owner union, source-corpus ref, actor-scope, environment frame, inspection request / item / receipt / result, derived summary, contract boundary constant + assertion, three pure helpers). Imports nothing from any other Straylight module. |
| 2.b | [`../../tests/phase-29b-recall-wedge-contract.test.ts`](../../tests/phase-29b-recall-wedge-contract.test.ts) | New. Executable contract test (60 cases). Pins the contract version literal; pins the Hounfour substrate (`@0xhoneyjar/loa-hounfour@8.7.0`, `recall-wedge-conformance-vectors`, `/loa-hounfour/8.7.0/`); proves the seven recall-wedge composition-substrate paths are reachable through the installed package (substrate sanity check, **not** runtime); proves the per-decision count derivation; pins the Dixie-first default + Finn-as-boundary-only posture; pins the read-only boundary assertion; pins the contract source file imports nothing from forbidden modules; pins the test file imports no Straylight runtime / policy / storage / audit / signer behavior; pins the package export posture (no new export added). |
| 2.c | [`../decisions/ADR-029B-dixie-first-recall-wedge-contract.md`](../decisions/ADR-029B-dixie-first-recall-wedge-contract.md) | New. Canonical Phase 29B decision record. Pins Dixie-first selection, Straylight-as-semantic-owner, Hounfour-as-substrate-owner, Finn-as-boundary-marker, the six-item authorized file set, the five-row boundary table, the non-goals list, the successor-phase plan (29C handoff/test, 30A endpoint candidate), the ADR-022E gate disposition (all HELD), the class-vs-policy preservation, and the §4.d posture. |
| 2.d | [`./phase-29b-dixie-first-recall-wedge-contract.md`](./phase-29b-dixie-first-recall-wedge-contract.md) | New. This handoff. |
| 2.e | [`./README.md`](./README.md) | Append-only Phase 29B index entry. Discoverability only. |
| 2.f | [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md) | Append-only Phase 29B pointer (in-repo only; no Dixie/Finn/Hounfour code edited). |
| 2.g | [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts) | Minimal legacy-test update required by the new host file. (i) Adds `'recall-wedge-contract.ts'` to the host-directory manifest (now 11 files). (ii) Tightens the Hounfour forbidden-import regex from a bare-string match to import-syntax matching: `from '…'`, side-effect `import '…'`, dynamic `import('…')`, and `require('…')` forms — each with an optional subpath (`@0xhoneyjar/loa-hounfour(/…)?`). The contract module's type-only metadata literal `packageName: '@0xhoneyjar/loa-hounfour'` is permitted while actual root- and subpath-imports of the package from any host file are still forbidden. Adds explicit guard-behavior tests (allowed metadata literal cases vs. forbidden root/subpath import forms vs. live-source check on `recall-wedge-contract.ts`). The Phase 24C intent — no Hounfour import at the host surface — is preserved verbatim. |
| 2.h | [`../../dist-types/src/straylight/host/recall-wedge-contract.d.ts`](../../dist-types/src/straylight/host/recall-wedge-contract.d.ts) | New, generated, reproducible declaration emit for the new contract module, produced by `npm run build` (`clean:types && clean:dist && tsc -p tsconfig.build.json && tsc -p tsconfig.runtime.json && node scripts/prune-dist-runtime.mjs`). Required by the committed-declaration policy recorded by [ADR-024G §"Decision" §4 / §"Consequences"](../decisions/ADR-024G-host-package-subpath-implementation.md) ("`dist-types/` is committed AND reproducible"). This is the **only** authorized `dist-types/` change in Phase 29B; every other `dist-types/` path remains forbidden, and `dist/` (runtime JS) remains forbidden in full. |

[`../../package.json`](../../package.json) and
[`../../package-lock.json`](../../package-lock.json) are
**unchanged**. No `npm install`, no dependency change, no
export change. Phase 29A's `8.7.0` pin is consumed verbatim by
the Phase 29B contract metadata literals.

[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
and
[`../../src/straylight/index.ts`](../../src/straylight/index.ts)
are **unchanged**: the Phase 29B contract module is an
intentional non-export at the host surface and at the wedge
public API.

## 3. Exact contract surface (what the file ships)

The full file lives at
[`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts).
Its public exports, grouped:

### 3.1 Pinned literals

| Export | Value |
|---|---|
| `STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION` | `'phase-29b.recall-wedge-contract.v0'` (`as const`) |
| `RECALL_WEDGE_ACTIVE_HOST_KINDS` | `['dixie-first-inspection-bff'] as const satisfies ReadonlyArray<RecallWedgeHostKind>` |
| `DEFAULT_RECALL_WEDGE_HOST_KIND` | `'dixie-first-inspection-bff'` (`RecallWedgeHostKind`) |
| `RECALL_WEDGE_CONTRACT_BOUNDARY` | `as const` object with `contract_version`, the five-owner `owners` table (Hounfour, Straylight, Dixie, Finn, Loa), and `active_host_kinds` |

### 3.2 Type unions

| Export | Members |
|---|---|
| `StraylightRecallWedgeContractVersion` | `typeof STRAYLIGHT_RECALL_WEDGE_CONTRACT_VERSION` |
| `RecallWedgeHostKind` | `'dixie-first-inspection-bff' \| 'finn-runtime-enforcement-later' \| 'test'` |
| `RecallWedgeBoundaryOwner` | `'straylight' \| 'hounfour' \| 'dixie' \| 'finn' \| 'loa'` |
| `RecallWedgeRiskLevel` | `'low' \| 'standard' \| 'high' \| 'restricted'` |
| `RecallWedgeEnvironmentSurface` | `'operator' \| 'dixie-bff' \| 'finn-runtime' \| 'test'` |
| `RecallWedgeInclusionDecision` | `'include' \| 'exclude' \| 'redact' \| 'refuse'` |

### 3.3 Interfaces

| Export | Shape |
|---|---|
| `RecallWedgeSourceCorpusRef` | `{ packageName: '@0xhoneyjar/loa-hounfour'; packageVersion: '8.7.0'; corpus: 'recall-wedge-conformance-vectors'; pathPrefix: '/loa-hounfour/8.7.0/'; integrity?: string }` |
| `RecallWedgeActorScope` | `{ actor_id: string; estate_id: string; tenant_id?: string; environment_id?: string }` |
| `RecallWedgeEnvironmentFrame` | `{ purpose: string; surface: RecallWedgeEnvironmentSurface; risk_level?: RecallWedgeRiskLevel }` |
| `RecallWedgeInspectionRequest` | `{ request_id; actor_scope; environment; requested_classes?; requested_statuses?; include_challenged: boolean; include_revoked: boolean; include_forgotten: boolean; source_corpus }` |
| `RecallWedgeInspectionItem` | `{ assertion_id?; vector_id?; decision: RecallWedgeInclusionDecision; reason: string; source_ref: RecallWedgeSourceCorpusRef; use_instruction? }` |
| `RecallWedgeInspectionReceipt` | `{ receipt_id; request_id; contract_version; host_kind; boundary_summary; included_count; excluded_count; redacted_count; refused_count; source_corpus; generated_at? }` |
| `RecallWedgeInspectionResult` | `{ request; items; receipt }` |
| `RecallWedgeInspectionSummary` | `{ included_count; excluded_count; redacted_count; refused_count }` |
| `RecallWedgeContractBoundary` | `typeof RECALL_WEDGE_CONTRACT_BOUNDARY` |

### 3.4 Pure helpers

| Export | Behavior |
|---|---|
| `createRecallWedgeSourceCorpusRef(init?: { integrity?: string })` | Returns the pinned `{ packageName, packageVersion, corpus, pathPrefix }` ref. Optional `integrity` is metadata only. No I/O, no hashing, no verification. |
| `summarizeRecallWedgeInspection(items)` | Counts items per decision into `RecallWedgeInspectionSummary`. Pure; sums to `items.length`. |
| `createRecallWedgeInspectionReceipt(input)` | Composes a `RecallWedgeInspectionReceipt` from `{ receipt_id, request, items, host_kind?, boundary_summary?, generated_at? }`. Defaults `host_kind` to `'dixie-first-inspection-bff'` and `boundary_summary` to a one-sentence boundary line. Pure; no I/O. |
| `assertRecallWedgeContractReadOnlyBoundary(value?)` | Asserts the contract-version match, the five required boundary owners, that `'dixie-first-inspection-bff'` is listed as active, and that `'finn-runtime-enforcement-later'` is **not** listed as active. Throws on drift. No I/O. |

The file imports from no other Straylight module. The contract
boundary is preserved structurally (the test pins it).

## 4. What the tests prove

[`../../tests/phase-29b-recall-wedge-contract.test.ts`](../../tests/phase-29b-recall-wedge-contract.test.ts)
ships **60 contract cases** grouped:

| Group | What it proves |
|---|---|
| Contract-version literal exact | The pinned version literal has not drifted from `'phase-29b.recall-wedge-contract.v0'`. |
| Source-corpus pins installed package | The `RecallWedgeSourceCorpusRef` constants pin `@0xhoneyjar/loa-hounfour` at `8.7.0`, the `recall-wedge-conformance-vectors` corpus name, and the `/loa-hounfour/8.7.0/` prefix. The installed package's `package.json` reports the same version (registry-resolution sanity, **not** signature verification). |
| Phase 29A corpus reachable through the installed package | Resolves the package via `createRequire(import.meta.url).resolve('@0xhoneyjar/loa-hounfour/schemas/conformance-vector.schema.json')`, walks to the package root, and reads the five recall-wedge vectors (`assertion-admitted.json`, `commitment-root.json`, `recall-pack.json`, `recall-receipt.json`, `recall-request.json`), the recall-wedge `README.md`, and `schemas/conformance-vector.schema.json`. Substrate sanity only — no runtime / policy / signature behavior is exercised. |
| No vendoring under `fixtures/` | The Straylight tree contains **no** vendored copy of the recall-wedge vector JSON, the recall-wedge `README.md`, or the envelope schema. |
| Helper-derived counts | `summarizeRecallWedgeInspection` and `createRecallWedgeInspectionReceipt` derive the four per-decision counters and they sum to the inspected-item length across `'include' / 'exclude' / 'redact' / 'refuse'`. |
| Dixie-first default + Finn-as-boundary-only | `DEFAULT_RECALL_WEDGE_HOST_KIND === 'dixie-first-inspection-bff'`; `RECALL_WEDGE_ACTIVE_HOST_KINDS` does **not** list `'finn-runtime-enforcement-later'`; `assertRecallWedgeContractReadOnlyBoundary` throws if Finn is widened in or if Dixie is widened out. |
| Read-only boundary assertion | The `RECALL_WEDGE_CONTRACT_BOUNDARY` constant carries every required owner (Hounfour / Straylight / Dixie / Finn / Loa) with non-empty descriptions, and the contract version matches the pinned literal. |
| Contract source file does **not** import forbidden modules | The host contract module text contains no import of `src/straylight/runtime/**`, `src/straylight/policy`, `src/straylight/storage/**`, `src/straylight/audit`, `src/straylight/crypto/signature`, `src/straylight/signer`, `signatures`, `keyring`, `recall`, `host/intake`, `host/receipt`, or `host/index`. The Hounfour-package literal is pinned as type-only metadata; the contract file imports **nothing** from `@0xhoneyjar/loa-hounfour`. |
| Test file does **not** import wedge runtime / policy / storage / audit / signer behavior | The Phase 29B test imports only `'../src/straylight/host/recall-wedge-contract.js'`, `'node:fs'`, `'node:module'`, `'node:path'`, `'node:url'`, and `'vitest'`. |
| Package export posture preserved | `package.json` continues to declare exactly three exports (`'.'`, `'./host'`, `'./runtime/recall-intake'`) and the host barrel does **not** re-export the new contract module. |

## 5. What is intentionally not implemented

The Phase 29B contract is the **shape** the future Dixie-first
recall-inspection / BFF path will consume. It is not the path
itself. Phase 29B authorizes none of the following — every one
of them is a separate future first-class proposal subject to
its own §4.d gate:

- **No endpoint.** No HTTP route, no NATS subject, no
  in-process handler, no `app.post(...)`.
- **No runtime recall.** No call into
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)'s
  `executeRecall` / `validateRecallRequest` / policy
  evaluator. The contract surface is read-only against the
  wedge.
- **No policy evaluator.** `RecallWedgeInclusionDecision` is a
  shape. The decision-producing logic (governance, refusal,
  authorization, signer-competence enforcement) is not Phase
  29B's lane.
- **No signature verification.** `RecallWedgeSourceCorpusRef`
  carries an optional `integrity` field that is **metadata
  only**. No `Ed25519Verifier`, no `SHA-256` enforcement, no
  package-lock integrity gate.
- **No signer-competence implementation.** The contract names
  the boundary; it does not enforce it.
- **No storage adapter.** No new `InMemoryStorage` /
  `JsonlStorage` consumer, no migration, no read-from-disk
  helper.
- **No audit-chain execution.** No `AuditLog` write, no chain
  verification, no commitment-root recomputation.
- **No Dixie repo edit.** `loa-dixie` is unedited. PR #102 is
  not re-opened. No second Dixie endpoint, no second runtime
  subpath, no sibling-issue file.
- **No Finn repo edit.** `loa-finn` is unedited. Finn appears
  in the Phase 29B contract **only** as a boundary marker
  (`'finn-runtime-enforcement-later'` in the host-kind union;
  `'finn-runtime'` in the environment-surface union). Neither
  is an active host under Phase 29B.
- **No Hounfour repo edit.** `loa-hounfour` is unedited.
  Phase 29B consumes the Phase 29A-shipped `8.7.0` corpus
  verbatim through registry resolution.
- **No Freeside repo edit.** `loa-freeside` is unedited.
- **No `package.json` change.** No new export, no widening of
  `exports`, no new dependency, no version bump.
- **No new wedge public-API export.** The wedge public surface
  in
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  is unchanged. The host barrel
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  is unchanged.
- **No vendoring.** No vector JSON, no recall-wedge `README.md`,
  no envelope schema is copied into the Straylight tree.
- **No tag, release, or publish.**
- **No ADR-022E gate firing.** Gates #1, #2, #3, #4, #5, #9,
  #17, #18 all remain **HELD**.

## 6. Dixie next-step handoff (what Phase 29C / 30A may consume)

Phase 29B is the **contract source file Dixie will later
consume**. It is intentionally upstream of Dixie, not inside
it. The next-step posture, recorded for the operator:

- The contract module
  [`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts)
  is a stable, type-only / pure-helper read against the wedge.
  Dixie can import its types and helpers under a future
  proposal **without** widening the wedge public API.
- A future Phase 29C handoff packet may stage the Dixie-side
  consumer contract (issue draft + integration map) **without
  editing `loa-dixie`** — same pattern as Phase 24F vs Phase
  24G (handoff-only first; sibling-repo PR is a separate
  event under teammate review).
- A future Phase 30A endpoint-candidate proposal may pin the
  Dixie-hosted recall-inspection / BFF endpoint shape **on top
  of** the Phase 29B contract. Phase 30A would inherit its own
  §4.d gate; Phase 29B is **not** authority for it.
- Dixie's consumer-side §4.d posture is its own. Phase 29B
  does not satisfy / waive / pre-satisfy any Dixie-side gate.
- The wedge public API surface is **not** the Dixie-consumer
  surface. If Dixie needs a public type re-export, the
  re-export must come through a separate first-class proposal
  with its own ADR-022E #18 evaluation. Phase 29B does not
  re-export through
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).

## 7. Finn later-return-gate note

Finn is represented in the Phase 29B contract **only as a
boundary marker**. Two surfaces name it:

- `RecallWedgeHostKind` includes `'finn-runtime-enforcement-later'`
  — present in the type union so the contract can describe the
  boundary, but **not** listed in
  `RECALL_WEDGE_ACTIVE_HOST_KINDS`. The
  `assertRecallWedgeContractReadOnlyBoundary` helper throws if a
  candidate boundary widens Finn into the active set.
- `RecallWedgeEnvironmentSurface` includes `'finn-runtime'` —
  identical posture: it lets a request describe the
  environment label, not authorize a Finn host.

Phase 29B does **not** edit `loa-finn`, does **not** wire any
Finn runtime / audit-return / enforcement seam, does **not**
trigger ADR-022E gate #9, and does **not** discharge any
[ADR-027C-finn-return-gate-readiness](../decisions/ADR-027C-finn-return-gate-readiness.md)
gating obligation. Finn integration remains a separate future
first-class proposal under its own §4.d gate, governed by
ADR-027C.

## 8. ADR-022E gate posture

| Gate | Trigger (verbatim spirit) | Phase 29B posture | Disposition |
|---|---|---|---|
| #1 | Canonical `estate-transition.schema.json` + adopting ADR | Not adopted; not authored. The wedge's existing estate-transition primitives are unchanged. | **HELD** |
| #2 | Local `EstateTransition` type / schema / fixture | Not authorized. Phase 29B names estate transitions as a boundary label only via the `boundary_summary` text and the ADR's owners table; it does not author a type. | **HELD** |
| #3 | New JS subpath (`./canonicalize` / `./utilities`) | Not consumed. Phase 29B consumes only the Phase 29A-resolved `'./schemas/conformance-vector.schema.json'` declared export of the installed package. | **HELD** |
| #4 | `Challenge` adopted into wedge public surface | Not authorized. Phase 29B does not re-export anything through the wedge public API. | **HELD** |
| #5 | `AuditEvent` adopted from Hounfour candidate | Not authorized. Phase 29B does not name `AuditEvent` and does not import from any audit module. | **HELD** |
| #9 | Finn runtime / audit-return integration | Not authorized. Finn appears as a boundary marker only. | **HELD** |
| #17 | New Hounfour subpath consumption with separate ADR | Not consumed. Phase 29B consumes the Phase 29A subpath posture verbatim. | **HELD** |
| #18 | Hounfour-named symbol on wedge public surface | Not authorized. The host contract module is intentionally not re-exported through `src/straylight/index.ts` or `src/straylight/host/index.ts`. | **HELD** |

The class-vs-policy boundary is preserved. **Hounfour
provides** class / schema / conformance-vector substrate.
**Straylight still owns** policy validation, signer competence,
signature verification, audit-chain execution, estate
transitions, recall runtime, authorization, and runtime refusal
behavior. Phase 29B's contract surface names ownership; it does
not transfer any primitive across the boundary.

## 9. §4.d posture

Phase 29B is **code-bearing**. Per
[ADR-026A0 §"Decision" §3 / §5](../decisions/ADR-026A0-operator-authority-flatline-rule.md),
Phase 29B inherits **its own** §4.d real 3-model Flatline +
Bridgebuilder pre-merge requirement.

- Phase 28E / ADR-027B-Track1-code-candidate-scope and the
  merged Phase 29A PR (#57; squash SHA `db22d2b`) do **not**
  satisfy / waive / pre-satisfy §4.d for Phase 29B.
- Phase 29B's §4.d is **independently unsatisfied** until a
  real 3-model Flatline + Bridgebuilder run is executed
  against the Phase 29B scope/PR.
- Phase 28C/D's local review-substrate smoke-test results are
  **not** §4.d evidence for Phase 29B; they establish that the
  machinery is **usable**, a necessary precondition for Phase
  29B's §4.d run.
- The fact that Phase 29B is a small, type-only / pure-helper
  diff is **not** a §4.d substitute. Code-bearing PRs require
  §4.d evidence regardless of size.

## 10. Validation checklist

Run before review:

```bash
# Reproduces the authorized dist-types declaration emit
# (committed-declaration policy from ADR-024G).
npm run build

npm run typecheck

# Phase 29B targeted contract test + Phase 29A vector-access test +
# Hounfour shadow integration test (smoke) + Phase 24C host-
# surface-shape pin (regex tightening).
npm test -- \
  tests/phase-29b-recall-wedge-contract.test.ts \
  tests/phase-29a-hounfour-vector-access.test.ts \
  tests/hounfour-shadow-integration.test.ts \
  tests/phase-24c-host-surface-shape.test.ts

# Full suite including the Phase 24C host-surface-shape pin
# (which now includes the recall-wedge-contract.ts file in the
# 11-file directory manifest).
npm test

# Whitespace + boundary check.
git diff --check

# Forbidden-path guard. Should return no entries. Note that
# `dist-types` is intentionally NOT in this list — Phase 29B
# authorizes exactly one regenerated declaration emit
# (`dist-types/src/straylight/host/recall-wedge-contract.d.ts`)
# under the ADR-024G committed-declaration policy. The narrowed
# dist-types check below pins that single-file authorization.
git status --short -- \
  dist fixtures \
  .github .claude .loa .run grimoires \
  package.json package-lock.json \
  src/straylight/index.ts src/straylight/host/index.ts

# Narrowed dist-types check — the only authorized
# dist-types/ change in Phase 29B.
git status --short -- dist-types
```

Phase 29B's review should also verify:

- No new export added to
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  or
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
- No vendored vector JSON, recall-wedge `README.md`, or
  envelope schema under `fixtures/` or anywhere else in the
  Straylight tree.
- No `loa-dixie` / `loa-finn` / `loa-hounfour` / `loa-freeside`
  sibling-repo edit shipped with the Phase 29B PR.
- No `package.json` / `package-lock.json` change shipped with
  the Phase 29B PR.
- **No `dist/` (runtime JS) change shipped with the Phase 29B
  PR. `dist/` is forbidden in full.**
- The **only** `dist-types/` path that appears in the Phase
  29B PR is
  `dist-types/src/straylight/host/recall-wedge-contract.d.ts`,
  which is the regenerated, reproducible declaration emit
  required by the
  [ADR-024G](../decisions/ADR-024G-host-package-subpath-implementation.md)
  committed-declaration policy. Every other `dist-types/`
  path remains forbidden by Phase 29B.

## 11. Codex / Flatline / Bridgebuilder review requirement

Because Phase 29B is **code-bearing**, the Phase 29B PR
requires:

1. **Codex audit** against the Phase 29B scope/PR. This is
   not optional.
2. **Real 3-model Flatline run** against the Phase 29B
   scope/PR (per
   [ADR-026A0 §"Decision" §3 / §5](../decisions/ADR-026A0-operator-authority-flatline-rule.md)).
3. **Bridgebuilder run** against the Phase 29B scope/PR.

§4.d evidence MUST be attached to the Phase 29B PR before
merge. ADR-027B-Track1-code-candidate-scope and the merged
Phase 29A PR are **not** §4.d evidence for Phase 29B and may
not be cited as such.

## Citations

- [`../decisions/ADR-029B-dixie-first-recall-wedge-contract.md`](../decisions/ADR-029B-dixie-first-recall-wedge-contract.md)
  — canonical Phase 29B decision/scope record (this handoff's
  authorizing in-repo doc).
- [`../decisions/ADR-027B-Track1-code-candidate-scope.md`](../decisions/ADR-027B-Track1-code-candidate-scope.md)
  — Phase 28E pinned the Phase 29A scope; Phase 29B is the
  successor implementation slice.
- [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
  §"Decision" §3 / §5 / §6.Forbidden — first-class
  implementation slice classification, §4.d pre-merge
  requirement, the not-authority list.
- [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — gate inventory; none fired by Phase 29B.
- [`../decisions/ADR-027C-finn-return-gate-readiness.md`](../decisions/ADR-027C-finn-return-gate-readiness.md)
  — Finn return-gate readiness governance; Finn integration
  remains gated by ADR-027C, not Phase 29B.
- [`../decisions/ADR-027B-Fire-hounfour-composition-contracts.md`](../decisions/ADR-027B-Fire-hounfour-composition-contracts.md)
  §"Decision" §2 / §3 — Phase 28A composition-contract
  evidence lock; class-vs-policy boundary preserved here.
- [`./phase-28e-track1-code-candidate-scope.md`](./phase-28e-track1-code-candidate-scope.md)
  — Phase 28E operator-oriented planning handoff (Phase 29A
  scope).
- [`./phase-28d-hounfour-v870-release-evidence.md`](./phase-28d-hounfour-v870-release-evidence.md)
  — Phase 28D release-evidence handoff that unblocked Phase
  29A and (transitively) Phase 29B's substrate.
- [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order; Phase 29B
  edits no sibling repo.
