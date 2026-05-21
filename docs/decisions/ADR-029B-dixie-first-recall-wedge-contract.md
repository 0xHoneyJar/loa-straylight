# ADR-029B-dixie-first-recall-wedge-contract — Phase 29B Recall Wedge host contract (Dixie-first MVP)

## Status

Accepted-for-Phase-29B as a **first-class implementation slice
limited to type-only contract + executable contract tests + a
docs-only ADR/handoff bundle**.

ADR-029B is the **Phase 29B** successor to:

- [ADR-027B-Track1-code-candidate-scope](./ADR-027B-Track1-code-candidate-scope.md)
  (Phase 28E) — pinned the next implementation PR's name and scope
  (Phase 29A — Hounfour v8.7.0 vector-access Track 1
  implementation).
- The merged Phase 29A PR (#57; squash SHA `db22d2b`) — proved
  the recall-wedge conformance-vector corpus is reachable from
  the installed `@0xhoneyjar/loa-hounfour@8.7.0` package
  (registry-resolution only) without vendoring.

ADR-029B is **code-bearing** (it ships the Phase 29B
`src/straylight/host/recall-wedge-contract.ts` module + its
executable contract test). It is **not** an endpoint, **not** a
runtime, **not** a policy evaluator, **not** a signature
verifier, **not** a signer-competence implementation, **not** a
storage adapter, **not** an audit-chain executor, and **not** a
sibling-repo edit. It does not flip imports of the wedge public
API, does not add a new package export, and does not vendor any
Hounfour artifact.

ADR-029B is a **§3-class first-class doc** under
[ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md).
Because Phase 29B is code-bearing it inherits the full §4.d
real 3-model Flatline + Bridgebuilder pre-merge requirement on
its own scope/PR. ADR-027B-Track1-code-candidate-scope (Phase
28E) and the Phase 29A merger do **not** satisfy, waive, or
pre-satisfy §4.d for Phase 29B.

## Context

### Phase 29A proved package/vector access

Phase 29A pinned `@0xhoneyjar/loa-hounfour` at exactly `8.7.0`
in `package.json`/`package-lock.json` (registry-resolution only
against `https://npm.pkg.github.com`) and added a Vitest
contract proving the seven recall-wedge composition-substrate
paths (`recall-request.json`, `recall-pack.json`,
`recall-receipt.json`, `assertion-admitted.json`,
`commitment-root.json`, the recall-wedge `README.md`, and
`schemas/conformance-vector.schema.json`) are reachable through
the installed package. That proof is the Phase 29B substrate.
No Hounfour vector JSON is vendored; the access path resolves
through `import.meta.resolve()` of the package's declared
`./schemas/*` export and walks package-shipped sibling
directories the package's own `files:` field declares as
shipped.

### Next MVP step is host contract, not endpoint

The MVP target is the **Straylight Recall Wedge: governed
recall over a signed actor estate**. Without a written
host-facing contract, every successor proposal — Dixie-facing
endpoint, Finn enforcement seam, Freeside community surface —
risks collapsing the wedge into RAG, vector memory, long
context, reflection, planning, or chatbot memory. None of those
are the wedge.

Phase 29B authors the contract surface — types + pure helpers
+ executable tests — that pins what the wedge is, who owns
which lane, and what an inspection request/receipt looks like
under the Dixie-first MVP. It deliberately stops short of an
endpoint, runtime, policy evaluator, signature verifier,
signer-competence implementation, storage adapter, or
audit-chain execution: those are later first-class proposals
with their own §4.d gates.

### What Phase 29B is *not* authority for

Pinned per [ADR-026A0 §"Decision" §6.Forbidden](./ADR-026A0-operator-authority-flatline-rule.md):

- The fact that Phase 29A landed is **not** authority for
  Phase 29B to ship a runtime, an endpoint, a policy evaluator,
  a signature verifier, a signer-competence implementation, a
  storage adapter, or an audit-chain executor. Phase 29A
  proved package/vector access; it did not flip any wedge
  semantics.
- The fact that ADR-029B pins types and helpers is **not**
  authority for any sibling-repo PR (Dixie/Finn/Hounfour) under
  cover of Phase 29B. Sibling-repo work remains a separate
  future event under teammate review.
- Codex output, ChatGPT advisory output, headless generative
  review, prior Flatline multi-model verdicts on unrelated
  phases, prior Bridgebuilder reviews on unrelated phases,
  Cheval delegation outputs, and persisted agent memory are
  **audit evidence**, not authority for Phase 29B.

## Decision

### 1. Dixie-first recall inspection / BFF path

Phase 29B selects **Dixie** as the first MVP recall
inspection / BFF host. The Phase 29B contract names this kind
explicitly as `'dixie-first-inspection-bff'` and exposes it as
the **default and only active host kind** under the Phase 29B
contract. Dixie is **not yet Straylight**: Phase 29B defines
the contract Dixie will later consume; it does not edit
`loa-dixie`, does not file a sibling-repo issue, does not
re-open `loa-dixie` PR #102, and does not add a second Dixie
endpoint.

### 2. Straylight owns the semantic contract

Straylight owns **semantic meaning** of the recall wedge:
policy / runtime boundary, refusal / authorization semantics,
signer-competence boundary, estate-transition meaning, and
recall semantics. Phase 29B keeps every Straylight semantic
primitive on the Straylight side. It does **not** move
Straylight runtime semantics into Hounfour.

### 3. Hounfour owns schema / class validation / conformance-vector substrate

Hounfour ships the class artifacts: schemas, conformance
vectors, and the `conformance-vector.schema.json` envelope.
Phase 29B references the corpus as type-only metadata via the
`RecallWedgeSourceCorpusRef` type and the
`createRecallWedgeSourceCorpusRef()` helper; it does not load,
hash, sign, verify, or evaluate the corpus inside the contract
module.

### 4. Finn is later runtime enforcement / audit return gate

Finn appears in the Phase 29B contract **only** as a boundary
marker (the `'finn-runtime-enforcement-later'` host kind). It
is **not** an active host under Phase 29B. The
`RECALL_WEDGE_ACTIVE_HOST_KINDS` tuple lists exactly the
Dixie-first kind; the executable contract test pins this. ADR-022E
gate #9 (Finn governed by [ADR-027C](./ADR-027C-finn-return-gate-readiness.md))
remains **HELD** across Phase 29B.

### 5. Phase 29B authorizes contract / types / tests only

Phase 29B authorizes:

- **New:** [`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts)
  — type-only / pure-helper module: contract version constant,
  host-kind union, boundary-owner union, source-corpus reference,
  actor scope, environment frame, inspection request / decision /
  item / receipt / result types, plus four pure helpers
  (`createRecallWedgeSourceCorpusRef`,
  `summarizeRecallWedgeInspection`,
  `createRecallWedgeInspectionReceipt`,
  `assertRecallWedgeContractReadOnlyBoundary`) and a constant
  boundary object (`RECALL_WEDGE_CONTRACT_BOUNDARY`). The module
  imports from no other Straylight module — no runtime, no policy,
  no storage, no audit, no signer, no crypto/signature, no wedge
  public API, no Hounfour package.
- **New:** [`../../tests/phase-29b-recall-wedge-contract.test.ts`](../../tests/phase-29b-recall-wedge-contract.test.ts)
  — executable contract test pinning: exact contract version
  literal; source corpus = installed
  `@0xhoneyjar/loa-hounfour@8.7.0`; the Phase 29A corpus
  (recall-request, recall-pack, recall-receipt,
  assertion-admitted, commitment-root, recall-wedge `README.md`,
  `conformance-vector.schema.json`) is reachable via the
  installed package; no vector JSON is vendored under
  `fixtures/`; helper-derived include/exclude/redact/refuse
  counts; default Dixie-first host kind; Finn-as-boundary-only;
  the contract source file does not import forbidden runtime
  modules; the test file does not import wedge runtime / policy
  / storage / audit / signer behavior; package.json `exports`
  remains the existing three-keys posture (no new Phase 29B
  subpath).
- **New:** this ADR
  ([`./ADR-029B-dixie-first-recall-wedge-contract.md`](./ADR-029B-dixie-first-recall-wedge-contract.md)).
- **New:** [`../handoffs/phase-29b-dixie-first-recall-wedge-contract.md`](../handoffs/phase-29b-dixie-first-recall-wedge-contract.md)
  — operator-oriented Phase 29B handoff packet.
- **Append-only:** [`../handoffs/README.md`](../handoffs/README.md)
  — Phase 29B index entry, in chronological order, after the
  Phase 28E entry.
- **Append-only:** [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — Phase 29B navigation pointer appended after the Phase 28E
  pointer.
- **Tightened (legacy):** [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts)
  — adds `recall-wedge-contract.ts` to the host-directory
  manifest and tightens the Hounfour forbidden-imports guard
  from a bare-string match to an import-syntax match. The
  Phase 24C invariant (no Hounfour import inside
  `src/straylight/host/`) is preserved verbatim; the Phase 29B
  contract module names the package only as type-level metadata
  and imports nothing from it.
- **New (generated, reproducible):** [`../../dist-types/src/straylight/host/recall-wedge-contract.d.ts`](../../dist-types/src/straylight/host/recall-wedge-contract.d.ts)
  — declaration-only emit for the new contract module,
  produced by `npm run build` (`clean:types && clean:dist &&
  tsc -p tsconfig.build.json && tsc -p tsconfig.runtime.json
  && node scripts/prune-dist-runtime.mjs`). This is the
  **only** authorized `dist-types/` change in Phase 29B and is
  required by the committed-declaration policy recorded by
  [ADR-024G §"Decision" §4 / §"Consequences"](./ADR-024G-host-package-subpath-implementation.md)
  ("`dist-types/` is committed AND reproducible"). All other
  `dist-types/` paths remain forbidden by Phase 29B; `dist/`
  (runtime JS) remains forbidden by Phase 29B in full.

Phase 29B does **not**:

- run an endpoint, server, BFF, or process;
- evaluate policy, validate schemas, verify signatures, evaluate
  signer competence, persist receipts, or execute an audit
  chain;
- modify `package.json` `exports`, the runtime allowlist, or
  the wedge public API;
- vendor any Hounfour `recall-wedge` vector JSON, the
  recall-wedge `README.md`, or the
  `conformance-vector.schema.json` envelope into Straylight;
- edit `loa-dixie`, `loa-finn`, `loa-hounfour`, `loa-freeside`,
  `loa`, or any other sibling repo;
- file a sibling-repo issue, comment, or PR;
- tag, release, or publish on the Straylight side;
- cut any `dist/` (runtime JS) change. Phase 29B forbids every
  path under `dist/`. The only authorized `dist-types/` change
  is the single declaration emit
  `dist-types/src/straylight/host/recall-wedge-contract.d.ts`
  reproducible from `npm run build` (per the committed-
  declaration policy recorded by
  [ADR-024G](./ADR-024G-host-package-subpath-implementation.md));
  every other `dist-types/` path remains forbidden by Phase
  29B;
- fire any ADR-022E gate.

### 6. Boundary table

| Owner | Lane | Phase 29B disposition |
|---|---|---|
| **Hounfour** | Class / schema / conformance-vector substrate. Ships the `recall-wedge` corpus + envelope under `@0xhoneyjar/loa-hounfour@8.7.0`. | Source corpus is referenced as type-only metadata via `RecallWedgeSourceCorpusRef`. No vendoring; no schema authority transfer. |
| **Straylight** | Semantic meaning of the recall wedge: policy / runtime boundary, refusal / authorization, signer-competence boundary, estate-transition meaning, recall semantics. | Owns the Phase 29B contract surface end-to-end. Wedge runtime semantics remain on the Straylight side. |
| **Dixie** | First MVP recall inspection / BFF path. Consumer of the Phase 29B contract. | Default host kind under Phase 29B (`'dixie-first-inspection-bff'`). Dixie is not yet Straylight; Phase 29B defines the contract Dixie will later consume. No `loa-dixie` edits. |
| **Finn** | Later runtime-enforcement / audit-return gate. | Boundary marker only (`'finn-runtime-enforcement-later'`). NOT an active host under Phase 29B. ADR-022E gate #9 remains HELD. |
| **Loa** | Framework / control-plane boundary outside the wedge. | Unaffected by Phase 29B. |

### 7. Non-goals

Phase 29B is explicitly **not**:

- **No endpoint.** Phase 29B does not run an HTTP, gRPC, NATS,
  Discord, Telegram, or REST endpoint. The contract describes
  the inspection request/response shape; it does not serve it.
- **No runtime recall.** Phase 29B does not extend the wedge's
  request-to-pack, pack-to-receipt, or receipt-to-commitment
  pipelines. The recall runtime surface is unchanged.
- **No policy evaluator.** Phase 29B does not introduce
  admission rules, refusal rules, or audit policy. Policy
  ownership remains Straylight-runtime-side, outside Phase 29B
  scope.
- **No signature verification.** Phase 29B does not
  cryptographically verify any signature. The optional
  `integrity` field on `RecallWedgeSourceCorpusRef` is metadata
  only.
- **No signer competence implementation.** Signer competence
  remains a Straylight-owned policy primitive outside Phase
  29B's scope.
- **No storage.** Phase 29B introduces no storage adapter, no
  persistence migration, no receipt/pack persistence change.
- **No audit-chain execution.** Phase 29B does not order, hash,
  or verify audit events. The `0xhoneyjar:straylight:`
  soft-audit-prefix policy remains Straylight-owned, outside
  Phase 29B's scope.
- **No Dixie / Finn / Hounfour repo edits.** Phase 29B edits
  zero sibling-repo files.
- **No package export change.** `package.json` `exports`
  remains the existing three-keys posture (`"."`, `"./host"`,
  `"./runtime/recall-intake"`). The Phase 29B contract module
  is consumed by tests via the `src/straylight/host/...` path,
  not via a new declared subpath.
- **No vendoring.** No copy of any Hounfour vector JSON, the
  recall-wedge `README.md`, or the
  `conformance-vector.schema.json` envelope into the
  Straylight tree.

### 8. Successor phases

- **Phase 29C** is the next first-class step after Phase 29B.
  It SHOULD be a **Dixie-facing host handoff packet** under
  `docs/handoffs/` or a **Dixie contract-consumer test** that
  proves Dixie can consume the Phase 29B contract surface
  type-only — depending on `loa-dixie`-side readiness at the
  time. Phase 29C is a separate first-class proposal with its
  own §4.d evidence.
- **Phase 30A** can become the **first endpoint / runtime
  candidate** for the Recall Wedge MVP **only after Phase
  29C** establishes the consumer-side handoff or test. Phase
  30A inherits its own §4.d, its own ADR-022E disposition, and
  its own threat-model review.

### 9. ADR-022E gate impact

Phase 29B fires **no ADR-022E gates**. Per-gate analysis:

| Gate | Trigger conjunction (verbatim spirit) | Phase 29B posture | Disposition |
|---|---|---|---|
| **#1** | Published canonical `estate-transition.schema.json` shape **and** a separate ADR adopting it. | Phase 29B authors no estate-transition schema and adopts no Hounfour shape under that name. | **HELD.** |
| **#2** | Local `EstateTransition` type / schema / fixture, gated on #1 or its own ADR. | Phase 29B authors no `EstateTransition` type / schema / fixture. | **HELD.** |
| **#3** | Hounfour ships a declared `./canonicalize` (or `./utilities`) JS subpath. | Phase 29B consumes no new Hounfour JS subpath. | **HELD.** |
| **#4** | A separate ADR adopting `Challenge` into the wedge public surface. | Phase 29B authorizes no public re-export. | **HELD.** |
| **#5** | A separate ADR adopting `AuditEvent` from a Hounfour candidate. | Phase 29B authorizes no `AuditEvent` adoption. | **HELD.** |
| **#9** | Finn runtime enforcement / audit-return work. | Phase 29B represents Finn ONLY as a boundary marker, never as an active host. | **HELD.** |
| **#17** | Documented Straylight need + separate ADR + future implementation phase explicitly citing the authorization for any of the eleven Hounfour subpaths. | Phase 29B introduces no new Hounfour subpath consumption. | **HELD.** |
| **#18** | A separate ADR adopting any Hounfour-named symbol into the wedge public surface. | Phase 29B authorizes no public re-export. | **HELD.** |

### 10. Class-vs-policy boundary preservation

Phase 29B preserves the class-vs-policy boundary recorded by
[ADR-027B-Fire §"Decision" §3](./ADR-027B-Fire-hounfour-composition-contracts.md)
verbatim. The Phase 29B contract describes **shape** (request,
decision, item, receipt) on the Straylight host side; it does
not transfer policy validation, signer competence, signature
verification, audit-chain execution, estate transitions, or
recall runtime across the Hounfour → Straylight boundary, and
it does not transfer any of those into the Dixie / Finn /
Freeside lanes.

### 11. §4.d posture — Phase 29B inherits its own gate

Phase 29B is code-bearing and therefore inherits §4.d under
[ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md)
on its own scope/PR. Phase 28E (ADR-027B-Track1-code-candidate-scope)
and the Phase 29A merger do **not** satisfy, weaken, or
pre-satisfy §4.d for Phase 29B.

The Phase 29B real-run scope must include, at minimum: the
Phase 29B contract module, the Phase 29B test file, the
tightened `tests/phase-24c-host-surface-shape.test.ts` guard,
this ADR, and the Phase 29B handoff packet. Reviewers may
expand the scope further; they may not narrow it below this
floor. Local smoke-test results on prior phases — including the
Phase 29A vector-access proof — are **not** §4.d evidence for
Phase 29B; they establish only that the substrate is reachable.

## Consequences

- The Phase 29B host contract is now committed in-repo as
  `src/straylight/host/recall-wedge-contract.ts` (type-only +
  pure helpers) and proven by
  `tests/phase-29b-recall-wedge-contract.test.ts`.
- Dixie is the first MVP recall inspection / BFF host kind.
  Finn is the later enforcement boundary. Hounfour ships the
  substrate; Loa is framework-side; Straylight owns the
  semantics.
- ADR-022E gates #1, #2, #3, #4, #5, #9, #17, #18 all remain
  **HELD**. The class-vs-policy boundary is preserved.
- No sibling-repo edit is authorized by Phase 29B. No package
  export, no runtime allowlist, no threat model, no
  package-boundary edit is authorized.
- Phase 29B's authorization is **necessary, not sufficient**
  for Phase 29C / Phase 30A. Each successor must independently
  satisfy its own §4.d under
  [ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md).

## Validation

```bash
npm run build
npm run typecheck
npm test -- tests/phase-29b-recall-wedge-contract.test.ts \
            tests/phase-29a-hounfour-vector-access.test.ts \
            tests/hounfour-shadow-integration.test.ts \
            tests/phase-24c-host-surface-shape.test.ts
npm test
git diff --check

# Forbidden-path guard — `dist-types` is intentionally NOT
# listed here because Phase 29B authorizes exactly one
# regenerated declaration emit
# (`dist-types/src/straylight/host/recall-wedge-contract.d.ts`);
# see the narrowed assertion below.
git status --short -- dist fixtures .github .claude .loa .run grimoires package.json package-lock.json src/straylight/index.ts src/straylight/host/index.ts

# Narrowed dist-types check — the only authorized
# `dist-types/` change in Phase 29B.
git status --short -- dist-types
```

Expected:

- `npm run build` is clean (declaration emit reproducible from
  source per the
  [ADR-024G](./ADR-024G-host-package-subpath-implementation.md)
  committed-declaration policy).
- `npm run typecheck` is clean.
- The four named test files pass; the full Vitest run passes.
- `git diff --check` is clean.
- The first `git status --short` line is empty (Phase 29B
  touches none of those paths).
- The second `git status --short -- dist-types` line shows
  **exactly one** entry:
  `dist-types/src/straylight/host/recall-wedge-contract.d.ts`
  (the regenerated, reproducible declaration emit; no other
  `dist-types/` path is authorized).
- No `dist/` (runtime JS) entry appears in either listing —
  `dist/` remains forbidden by Phase 29B in full.
- `package.json` and `package-lock.json` are **unchanged** by
  Phase 29B. The existing `@0xhoneyjar/loa-hounfour@8.7.0` pin
  established by Phase 29A is preserved verbatim.

## Source files inspected

- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
  (gate inventory; per-gate trigger columns).
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
  (operator authority + Flatline rule; §3 / §5 pre-merge
  requirement; §6.Forbidden not-authority list).
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
  (runtime allowlist + subpath authorization; allowlist
  pinned by §"Decision" §3).
- [`./ADR-027A-post-dixie-return-gate.md`](./ADR-027A-post-dixie-return-gate.md)
  (canonical return-gate criteria; refusal rules).
- [`./ADR-027B-Fire-hounfour-composition-contracts.md`](./ADR-027B-Fire-hounfour-composition-contracts.md)
  (Phase 28A composition-contract evidence lock; class-vs-policy
  boundary).
- [`./ADR-027B-VectorAccess-release-unblocked.md`](./ADR-027B-VectorAccess-release-unblocked.md)
  (Phase 28D release / vector-access unblock evidence).
- [`./ADR-027B-Track1-code-candidate-scope.md`](./ADR-027B-Track1-code-candidate-scope.md)
  (Phase 28E Track 1 code-candidate scope; Phase 29A name).
- [`./ADR-027C-finn-return-gate-readiness.md`](./ADR-027C-finn-return-gate-readiness.md)
  (Finn-side readiness; gate #9 remains held).
- [`../handoffs/phase-28e-track1-code-candidate-scope.md`](../handoffs/phase-28e-track1-code-candidate-scope.md)
  (Phase 28E operator-oriented planning handoff).
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts),
  [`../../src/straylight/host/types.ts`](../../src/straylight/host/types.ts)
  (Phase 24C host barrel + per-surface shapes; Phase 29B
  contract module is **not** re-exported through the barrel).
- [`../../tests/phase-29a-hounfour-vector-access.test.ts`](../../tests/phase-29a-hounfour-vector-access.test.ts)
  (Phase 29A registry-resolution proof; substrate for the
  Phase 29B source-corpus metadata).
- [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts)
  (Phase 24C host-surface shape pin; tightened by Phase 29B
  to allow `recall-wedge-contract.ts` and to make the
  Hounfour forbidden-imports guard import-syntax-only).
- [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json) —
  unchanged by Phase 29B; the Phase 29A `8.7.0` pin is
  preserved verbatim.
