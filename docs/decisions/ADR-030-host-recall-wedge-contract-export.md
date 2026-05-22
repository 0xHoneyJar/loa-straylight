# ADR-030-host-recall-wedge-contract-export — Phase 30 host-consumable Recall Wedge contract export

## Status

Accepted-for-Phase-30 as a **first-class implementation slice
limited to a host-barrel re-export + executable contract export
test + a docs-only ADR/handoff bundle**.

ADR-030 is the **Phase 30** successor to:

- [ADR-029B-dixie-first-recall-wedge-contract](./ADR-029B-dixie-first-recall-wedge-contract.md)
  (Phase 29B) — authored the Straylight-side Recall Wedge host
  contract under `src/straylight/host/recall-wedge-contract.ts`
  but intentionally did **not** widen the host barrel to
  re-export it.
- [ADR-024G-host-package-subpath-implementation](./ADR-024G-host-package-subpath-implementation.md)
  — committed-declaration policy (`dist-types/` is committed
  AND reproducible).

ADR-030 is **code-bearing** (it widens the host barrel and ships
an executable contract export test). It is **not** an endpoint,
**not** a runtime, **not** a policy evaluator, **not** a
signature verifier, **not** a signer-competence implementation,
**not** a storage adapter, **not** an audit-chain executor, and
**not** a sibling-repo edit. It does **not** flip any wedge
public-API import, does **not** add a new package.json export
key, does **not** add any runtime field on the existing `./host`
export (which remains `types`-only), and does **not** vendor any
Hounfour artifact.

## Context

### Phase 29B left an unbridged seam

Phase 29B authored the Straylight-side Recall Wedge host
contract — version literal `'phase-29b.recall-wedge-contract.v0'`,
host-kind union (Dixie active; Finn boundary marker only),
boundary-owner table (Hounfour / Straylight / Dixie / Finn /
Loa), inspection request / item / receipt / result interfaces,
and four pure helpers. The contract module imports nothing from
any other Straylight module and was published in-tree at
`src/straylight/host/recall-wedge-contract.ts`. Phase 29B
intentionally stopped short of re-exporting the contract through
any consumer-facing surface: the host barrel
`src/straylight/host/index.ts` was kept frozen, and the package
`exports` map was unchanged.

The result was a working contract with no host-consumable seam.
A future Dixie BFF / inspection consumer would need to either
(a) reach into `@loa/straylight/host/recall-wedge-contract.js`
as a deep import, which the `./host` package export does not
declare, or (b) wait for a successor phase to widen the host
barrel. ADR-029B §"Decision" §8 names this successor explicitly
("Phase 29C handoff/test, Phase 30A endpoint candidate") but
does not authorize a barrel change of its own.

Phase 30 is that successor. It moves Phase 29B from "internal
contract exists" to "host-consumable Recall Wedge seam exists
and is testable" without crossing into endpoint, runtime,
policy, signature, signer-competence, storage, or audit-chain
behavior.

### Why the existing `./host` export is the correct seam

The repo's package.json already declares three export keys —
`"."` (types-only public wedge API), `"./host"` (types-only
host scaffold), and `"./runtime/recall-intake"` (the only
runtime subpath). Both `"."` and `"./host"` are intentionally
`types`-only per
[ADR-026A §"Decision" §3 / §5](./ADR-026A-runtime-recall-intake-subpath.md)
and the runtime allowlist pinned there. The Phase 29B contract
module is type-only / pure-helper code with no runtime
side-effects; re-exporting it through the existing `./host`
export preserves the types-only invariant on `./host` and
requires no package.json change. The Phase 30B / 30C / 31
endpoint and runtime proposals will inherit their own §4.d
gates if and when they are filed.

### What Phase 30 is *not* authority for

Pinned per
[ADR-026A0 §"Decision" §6.Forbidden](./ADR-026A0-operator-authority-flatline-rule.md):

- The fact that the Phase 29B contract module is now
  re-exported through the host barrel is **not** authority for
  any runtime, endpoint, policy evaluator, signature verifier,
  signer-competence implementation, storage adapter, or
  audit-chain executor. Phase 30 is type-shape exposure only.
- The fact that ADR-030 re-exports the Phase 29B contract is
  **not** authority for any sibling-repo PR
  (`loa-dixie` / `loa-finn` / `loa-hounfour` / `loa-freeside`)
  under cover of Phase 30. Sibling-repo work remains a separate
  future event under teammate review.
- Codex / ChatGPT advisory output, headless generative review,
  prior Flatline multi-model verdicts on unrelated phases,
  prior Bridgebuilder reviews on unrelated phases, Cheval
  delegation outputs, and persisted agent memory are **audit
  evidence**, not authority for Phase 30.

## Decision

### 1. Host-consumable Recall Wedge contract seam

Phase 30 widens the host barrel
`src/straylight/host/index.ts` to re-export the Phase 29B
contract surface. The contract is now reachable from the
existing `@loa/straylight/host` package export. The re-export
is:

- **Type-only / pure-helper**, identical to the contract module
  itself. No runtime side-effects are added at the seam.
- **Through the existing `./host` package export**, which is
  `types`-only per package.json. No new package.json export
  key is added. The Phase 30B / 30C / 31 successor proposals
  may add a runtime subpath if and when they are filed; Phase
  30 does not.
- **Consumed by the Phase 30 executable contract test
  (`tests/phase-30-host-recall-wedge-contract-export.test.ts`)
  via the host barrel only.** The test itself is the
  executable proof that the consumer-facing seam works.

### 2. Boundary owners are unchanged from Phase 29B

| Owner | Lane | Phase 30 disposition |
|---|---|---|
| **Hounfour** | Class / schema / conformance-vector substrate (`@0xhoneyjar/loa-hounfour@8.7.0`). | Unchanged. Phase 30 references the corpus as type-only metadata via `RecallWedgeSourceCorpusRef`; no vendoring; no schema authority transfer. |
| **Straylight** | Semantic meaning of the recall wedge: policy / runtime boundary, refusal / authorization, signer-competence boundary, estate-transition meaning, recall semantics. | Owns the Phase 29B contract surface end-to-end. The host barrel re-export does not transfer ownership. |
| **Dixie** | First MVP recall inspection / BFF path. | Default / only active host kind under the contract (`'dixie-first-inspection-bff'`). Phase 30 makes the contract host-consumable from `@loa/straylight/host` so Dixie can later import it without a deep path. No `loa-dixie` edit in Phase 30. |
| **Finn** | Later runtime-enforcement / audit-return gate. | Boundary marker only (`'finn-runtime-enforcement-later'`). NOT an active host. ADR-022E gate #9 remains HELD. |
| **Loa** | Framework / control-plane boundary outside the wedge. | Unaffected. |

### 3. Phase 30 authorizes barrel widening + export test only

Phase 30 authorizes:

- **Modified:** [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  — re-exports the Phase 29B contract module's named values
  and types under the existing host barrel. The pre-existing
  Phase 24C exports (handlers, dep types, intake-log helpers,
  tenancy helpers) are preserved verbatim. No runtime / policy
  / storage / audit / signature / signer code is added.
- **New:** [`../../tests/phase-30-host-recall-wedge-contract-export.test.ts`](../../tests/phase-30-host-recall-wedge-contract-export.test.ts)
  — executable contract export test pinning: a host consumer
  can import the contract from the public host surface
  (`@loa/straylight/host`); the exported version literal is
  exactly `'phase-29b.recall-wedge-contract.v0'`; Dixie is the
  default and only active host; Hounfour remains substrate-only
  metadata; Finn remains a boundary marker (the boundary
  assertion throws on Finn-widening drift); the host export
  does not import runtime / policy / storage / audit /
  signature / signer implementation; the package surface is
  ready for Dixie consumption (the `./host` export is
  `types`-only; no new export key is added).
- **Modified:** [`../../tests/phase-29b-recall-wedge-contract.test.ts`](../../tests/phase-29b-recall-wedge-contract.test.ts)
  — the "host barrel does NOT re-export the contract" pin
  (Phase 29B posture) is updated to "host barrel re-exports the
  contract module under the Phase 30 host-consumable seam"
  (Phase 30 posture). The "package.json declares the existing
  three exports keys without adding a Phase 29B-specific
  subpath" pin is preserved verbatim — Phase 30 does not add
  a new export key either.
- **New:** this ADR
  ([`./ADR-030-host-recall-wedge-contract-export.md`](./ADR-030-host-recall-wedge-contract-export.md)).
- **New:** [`../handoffs/phase-30-host-recall-wedge-contract-export.md`](../handoffs/phase-30-host-recall-wedge-contract-export.md)
  — operator-oriented Phase 30 handoff packet (the Dixie
  consumer handoff).
- **Append-only:** [`../handoffs/README.md`](../handoffs/README.md)
  — Phase 30 index entry, in chronological order, after the
  Phase 29B entry.
- **Append-only:** [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — Phase 30 navigation pointer appended after the Phase 29B
  pointer.
- **New (generated, reproducible):** [`../../dist-types/src/straylight/host/index.d.ts`](../../dist-types/src/straylight/host/index.d.ts)
  — the host barrel declaration emit gains the Phase 29B
  contract re-exports. Reproducible from `npm run build`. This
  is the **only** authorized `dist-types/` change in Phase 30
  (one path, regenerated). All other `dist-types/` paths
  remain forbidden by Phase 30; `dist/` (runtime JS) remains
  forbidden by Phase 30 in full.

Phase 30 does **not**:

- run an endpoint, server, BFF, or process;
- evaluate policy, validate schemas, verify signatures, evaluate
  signer competence, persist receipts, or execute an audit
  chain;
- modify `package.json` `exports`, the runtime allowlist, the
  wedge public API, or the `./host` types-only invariant;
- vendor any Hounfour vector JSON, recall-wedge `README.md`, or
  `conformance-vector.schema.json` envelope into Straylight;
- edit `loa-dixie`, `loa-finn`, `loa-hounfour`, `loa-freeside`,
  `loa`, or any other sibling repo;
- file a sibling-repo issue, comment, or PR;
- tag, release, or publish on the Straylight side;
- cut any `dist/` (runtime JS) change. Phase 30 forbids every
  path under `dist/` and forbids every `dist-types/` path
  except the regenerated host-barrel emit
  `dist-types/src/straylight/host/index.d.ts`;
- fire any ADR-022E gate.

### 4. Successor phases

- **Phase 30B / 30C / 31** is the next first-class step after
  Phase 30. It SHOULD be the **Dixie-side consumer wiring**
  (a `loa-dixie`-side PR that imports the Phase 30 contract
  from `@loa/straylight/host` and adds an inspection / BFF
  endpoint). Phase 30B is a **separate first-class proposal**
  with its own §4.d evidence; Phase 30 is **not** authority
  for it.
- **Phase 30 does not author the Dixie endpoint.** Endpoint
  authoring lives downstream of Phase 30 under its own §4.d
  gate, its own ADR-022E disposition, and its own threat-model
  review.

### 5. Non-goals

Phase 30 is explicitly **not**:

- **No endpoint.** Phase 30 does not run an HTTP, gRPC, NATS,
  Discord, Telegram, or REST endpoint.
- **No runtime recall.** Phase 30 does not extend the wedge's
  request-to-pack, pack-to-receipt, or receipt-to-commitment
  pipelines. The recall runtime surface is unchanged.
- **No policy evaluator.** Phase 30 introduces no admission,
  refusal, or audit policy.
- **No signature verification.** Phase 30 does not
  cryptographically verify any signature.
- **No signer competence implementation.** Signer competence
  remains a Straylight-owned policy primitive outside Phase 30
  scope.
- **No storage.** No new `InMemoryStorage` / `JsonlStorage`
  consumer, no migration, no read-from-disk helper.
- **No audit-chain execution.** No `AuditLog` write, no chain
  verification, no commitment-root recomputation.
- **No Dixie / Finn / Hounfour / Freeside repo edits.** Phase
  30 edits zero sibling-repo files.
- **No package export change.** `package.json` `exports`
  remains the existing three-keys posture (`"."`, `"./host"`,
  `"./runtime/recall-intake"`). The Phase 30 host-consumable
  seam is reached through the existing `./host` export, not a
  new subpath.
- **No vendoring.**
- **No new wedge public-API export.** The wedge public surface
  in [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  remains unchanged. The Phase 24C invariant ("wedge public
  surface must not import the host scaffold") is preserved.

### 6. ADR-022E gate impact

Phase 30 fires **no ADR-022E gates**. Per-gate analysis:

| Gate | Trigger conjunction (verbatim spirit) | Phase 30 posture | Disposition |
|---|---|---|---|
| **#1** | Published canonical `estate-transition.schema.json` shape **and** a separate ADR adopting it. | Phase 30 authors no estate-transition schema and adopts no Hounfour shape under that name. | **HELD.** |
| **#2** | Local `EstateTransition` type / schema / fixture. | Phase 30 authors no `EstateTransition` type / schema / fixture. | **HELD.** |
| **#3** | Hounfour ships a declared `./canonicalize` (or `./utilities`) JS subpath. | Phase 30 consumes no new Hounfour JS subpath. | **HELD.** |
| **#4** | A separate ADR adopting `Challenge` into the wedge public surface. | Phase 30 authorizes no public re-export through `src/straylight/index.ts`. The wedge public surface is unchanged. | **HELD.** |
| **#5** | A separate ADR adopting `AuditEvent` from a Hounfour candidate. | Phase 30 authorizes no `AuditEvent` adoption. | **HELD.** |
| **#9** | Finn runtime enforcement / audit-return work. | Phase 30 represents Finn ONLY as a boundary marker, never as an active host. | **HELD.** |
| **#17** | Documented Straylight need + separate ADR + future implementation phase explicitly citing the authorization for any of the eleven Hounfour subpaths. | Phase 30 introduces no new Hounfour subpath consumption. | **HELD.** |
| **#18** | A separate ADR adopting any Hounfour-named symbol into the wedge public surface. | Phase 30 authorizes no public re-export through `src/straylight/index.ts`. The host barrel widening does NOT cross the wedge public surface. | **HELD.** |

### 7. Class-vs-policy boundary preservation

Phase 30 preserves the class-vs-policy boundary recorded by
[ADR-027B-Fire §"Decision" §3](./ADR-027B-Fire-hounfour-composition-contracts.md)
verbatim. The Phase 30 host barrel re-export describes
**shape** (request, decision, item, receipt) at the host
surface; it does not transfer policy validation, signer
competence, signature verification, audit-chain execution,
estate transitions, or recall runtime across the Hounfour →
Straylight boundary, and it does not transfer any of those
into the Dixie / Finn / Freeside lanes.

### 8. §4.d posture — Phase 30 inherits its own gate

Phase 30 is code-bearing and therefore inherits §4.d under
[ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md)
on its own scope/PR. ADR-029B (Phase 29B) and the merged Phase
29B PR (#58; squash SHA `5b713bd`) do **not** satisfy, weaken,
or pre-satisfy §4.d for Phase 30.

The Phase 30 real-run scope must include, at minimum: the
modified host barrel, the new Phase 30 export test, the
updated Phase 29B export-posture pin, this ADR, and the Phase
30 handoff packet. Reviewers may expand the scope further;
they may not narrow it below this floor.

## Consequences

- The Phase 29B host contract is now consumable from the
  existing `@loa/straylight/host` package surface. A future
  Dixie BFF consumer can import it type-only without a new
  package export key.
- Dixie remains the first MVP recall inspection / BFF host
  kind. Finn remains the later enforcement boundary. Hounfour
  remains substrate. Loa remains framework-side. Straylight
  remains the semantic owner.
- ADR-022E gates #1, #2, #3, #4, #5, #9, #17, #18 all remain
  **HELD**. The class-vs-policy boundary is preserved.
- No sibling-repo edit is authorized by Phase 30. No package
  export key, no runtime allowlist edit, no threat model edit,
  no package-boundary edit is authorized.
- Phase 30's authorization is **necessary, not sufficient**
  for Phase 30B / 30C / 31. Each successor must independently
  satisfy its own §4.d under
  [ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md).

## Validation

```bash
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

# Full Vitest suite.
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
# `dist-types/` change in Phase 30 is the regenerated host
# barrel emit.
git status --short -- dist-types
```

Expected:

- `npm run build` is clean (declaration emit reproducible from
  source per the
  [ADR-024G](./ADR-024G-host-package-subpath-implementation.md)
  committed-declaration policy).
- `npm run typecheck` is clean.
- The three named test files pass; the full Vitest run passes.
- `git diff --check` is clean.
- The first `git status --short` line is empty (Phase 30
  touches none of those paths). `package.json`,
  `package-lock.json`, `src/straylight/index.ts`, and the
  wedge runtime barrel are unchanged.
- The second `git status --short -- dist-types` line shows
  **exactly one** entry:
  `dist-types/src/straylight/host/index.d.ts` (the regenerated,
  reproducible host barrel emit).
- No `dist/` (runtime JS) entry appears in either listing —
  `dist/` remains forbidden by Phase 30 in full.

## Source files inspected

- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
  (gate inventory; per-gate trigger columns).
- [`./ADR-024G-host-package-subpath-implementation.md`](./ADR-024G-host-package-subpath-implementation.md)
  (committed-declaration policy: `dist-types/` is committed
  AND reproducible).
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
  (`./host` types-only invariant pinned by §"Decision" §3 /
  §5).
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
  (operator authority + Flatline rule; §3 / §5 pre-merge
  requirement; §6.Forbidden not-authority list).
- [`./ADR-027B-Fire-hounfour-composition-contracts.md`](./ADR-027B-Fire-hounfour-composition-contracts.md)
  (Phase 28A composition-contract evidence lock; class-vs-policy
  boundary).
- [`./ADR-027C-finn-return-gate-readiness.md`](./ADR-027C-finn-return-gate-readiness.md)
  (Finn-side readiness; gate #9 remains held).
- [`./ADR-029B-dixie-first-recall-wedge-contract.md`](./ADR-029B-dixie-first-recall-wedge-contract.md)
  (Phase 29B contract module + executable contract test;
  Phase 30 widens the host barrel without altering the
  contract module).
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts),
  [`../../src/straylight/host/recall-wedge-contract.ts`](../../src/straylight/host/recall-wedge-contract.ts),
  [`../../src/straylight/host/types.ts`](../../src/straylight/host/types.ts)
  (Phase 24C host barrel + per-surface shapes; Phase 30
  re-exports the Phase 29B contract).
- [`../../tests/phase-29b-recall-wedge-contract.test.ts`](../../tests/phase-29b-recall-wedge-contract.test.ts)
  (Phase 29B export-posture pin; updated by Phase 30 to
  reflect the host-consumable seam).
- [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts)
  (Phase 24C host-surface shape pin; unchanged by Phase 30).
- [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json) —
  unchanged by Phase 30; the existing three-export-key posture
  is preserved verbatim.
