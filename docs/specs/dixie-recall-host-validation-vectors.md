# Dixie recall-host validation vectors — Phase 24B docs/spec lock

> Status: Phase 24B. **Docs/spec-only validation-vector matrix,
> in `loa-straylight`.** This document is the per-vector
> validation matrix Phase 24B locks for the Dixie-first MVP host.
> It sits **on top of** the Phase 23A eleven-vector MVP
> conformance matrix
> ([`./recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md))
> by reframing the host-decidable subset (vectors 1–8) at the
> host inspection layer, and explicitly leaves vectors 10 and 11
> as gates that Phase 24B does **not** exercise.
>
> Phase 24B does **not** author any TypeBox / JSON Schema, does
> **not** generate a validator, does **not** add or modify any
> test, does **not** add or modify any fixture, does **not**
> change `package.json` / `package-lock.json`, does **not** flip
> any wedge import, does **not** wire a Dixie endpoint, does
> **not** edit any sibling repo, and does **not** file any
> GitHub issue / comment / PR. The matrix below is a docs-only
> target for a future `phase-24c-dixie-recall-host-scaffold`
> branch (per ADR-024E §"The next implementation branch") to
> scaffold against. **No new tests or fixtures are produced by
> this packet.**
>
> Companion docs:
> [`./dixie-recall-host-mvp-contract.md`](./dixie-recall-host-mvp-contract.md),
> [`./recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md),
> [`./recall-wedge-schema-contract.md`](./recall-wedge-schema-contract.md),
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md),
> [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md),
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md),
> [`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md),
> [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md).

## What this matrix is

The Phase 23A eleven-vector MVP conformance matrix
([`./recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md))
enumerates the eleven scenarios the Recall Wedge MVP must
distinguish at the **wedge runtime layer** — by lane
(`class_validation` / `policy_validation` / `audit_validation` /
`keyring_validation`), by schema exercised, and by expected
outcome.

Phase 24B's matrix sits at a **different layer**: it reframes
the host-decidable subset of the Phase 23A vectors (vectors
**1–8**) at the **host inspection layer** — what Dixie must
display, what Dixie must refuse, which of the six MVP host
surfaces from
[`./dixie-recall-host-mvp-contract.md`](./dixie-recall-host-mvp-contract.md)
the vector exercises, the receipt category surfaced, and the
fail-closed expectation the host inherits from the wedge.

Phase 23A vectors **10** (`EstateTransition` on the wire) and
**11** (`safeCanonicalize` on the wire) remain **gates** — the
host plan does **not** exercise them; ADR-022E gate #1 and gate
#2 are unchanged.

Phase 23A vector **9** (`keyring_validation`-lane signer
competence) is **not in slice for Phase 24B** per ADR-024D §3.b,
which scopes `phase-24c-*` test scaffolding to vectors 1–8. The
wedge already covers signer-competence behavior end-to-end via
its existing tests (`tests/signer-fail-closed.test.ts` and the
`keyring`/`signatures` modules); when the wedge refuses on a
non-competent `SignatureEnvelope`, Surface 1 ("Recall intake &
response") inherits that refusal as a `denied` outcome keyed to
the wedge's `signer_not_competent` reason — but no Phase 24B
host-layer validation vector locks that path, and `phase-24c-*`
does not author a vector-9 host test. Vector 9 is listed in the
matrix below for cross-reference with the Phase 23A eleven-
vector matrix only, with status **not in slice**.

The matrix does **not** replace the Phase 23A matrix. The two are
coordinate: a future `phase-24c-dixie-recall-host-scaffold`
branch that scaffolds the host surfaces still owes the Phase 23A
matrix its wedge-runtime-layer separation.

## Status taxonomy

Identical to the Phase 23A matrix
([`./recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md) §"Status taxonomy"),
restated here so this doc is readable standalone:

| Status | Meaning |
|---|---|
| **safe draft** | The vector exercises a wedge-owned shape with a stable local contract. `phase-24c-*` can scaffold the host shape against the wedge's existing public-API output. |
| **blocked** | The vector requires `EstateTransition` on the wire (Hounfour delta #8 still queued) or `safeCanonicalize` on the wire (gate `no-confirmed-subpath`). The host plan does **not** lock such a vector. |
| **deferred** | The vector is an explicit ADR-022E gate. Phase 24B does **not** schedule. |
| **discovery note** | The vector exercises a primitive whose canonical name is **not** confirmed in v8.6.x; an *adjacent* upstream shape exists but **must not be renamed** without confirmation. |

Vectors **1–8** below are all **safe draft** at the host layer.
Vector **9** (`keyring_validation`-lane signer competence) is
**not in slice** for Phase 24B / `phase-24c-*` per ADR-024D
§3.b; it is listed for cross-reference only. Vectors **10–11**
are **blocked / deferred** and not exercised.

## Receipt category mapping (re-pinned)

The host surfaces each decision under one of the six receipt
categories pinned by ADR-020D §6 and exercised by
[`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts):

- **`included`** — the assertion is in the served pack.
- **`excluded`** — class-allowed but policy-excluded.
- **`redacted`** — privacy-redacted for the served frame.
- **`challenged`** — marked under contested status.
- **`revoked`** — upstream revoked.
- **`blocked-by-policy`** — policy-lane deny.

The host **never** surfaces a receipt category outside this set.

## Vector matrix

| # | Vector (host layer) | Wedge-runtime origin (Phase 23A) | Host surface | Receipt category surfaced | Fail-closed expectation | Phase 24B status |
|---|---|---|---|---|---|---|
| 1 | **Class-valid carrier, policy-allowed, included.** A `RecallRequest` produces a `RecallPack` with the assertion `included` and a `RecallReceipt` of category `included`. | Phase 23A vector 1 (`class_validation` + `policy_validation` allow). | Surface 1 (intake), Surface 2 (later receipt retrieval), Surface 3 (no exclusion). | `included`. | None — happy path. | safe draft. |
| 2 | **Class-valid carrier, policy-excluded.** Policy refuses inclusion; the host renders the exclusion reason from `excluded_summary[]`. | Phase 23A vector 2 (`policy_validation` deny). | Surface 1, Surface 3 (exclusion reason). | `excluded`. | Host does not invent reason; renders wedge's `dispositionFor`. | safe draft. |
| 3 | **Class-valid carrier, privacy-redacted in served frame.** The assertion has `actor_private` privacy scope; the served frame is `public_discord`; the wedge redacts; the host renders the redaction. | Phase 23A vector 3 (`policy_validation` + privacy-scope discipline). | Surface 1, Surface 3 (redaction walk), Surface 4 (provenance refusal under `privacy_scope_refusal`). | `redacted`. | `actor_private` provenance does **not** travel to `public_discord`. | safe draft. |
| 4 | **Contested assertion marked.** An assertion under contested status appears in the pack as `challenged`; the host surfaces the marking. | Phase 23A vector 4 (`class_validation` + status discipline). | Surface 1, Surface 3 (challenged exclusion walk). | `challenged`. | Host does not auto-promote `challenged` to `included`. | safe draft. |
| 5 | **Revoked assertion excluded.** An upstream-revoked assertion is excluded from the served pack; the host surfaces the revocation reason. | Phase 23A vector 5 (`class_validation` + revocation discipline). | Surface 1, Surface 3 (revoked exclusion walk). | `revoked`. | Host does not auto-include a revoked assertion. | safe draft. |
| 6 | **Forgotten assertion excluded but auditable.** The assertion is forgotten from the served pack; the `AuditEvent[]` trail records the forgetting; Surface 5 surfaces the audit event under `verifyChain` ok. | Phase 23A vector 6 (`audit_validation` discipline). | Surface 1, Surface 3 (forgotten exclusion walk), Surface 5 (audit-chain lookup). | `excluded` (with audit-chain event). | Audit-chain unbroken; receipt + audit completeness preserved. | safe draft. |
| 7 | **Cross-tenant recall refused.** A caller in tenant A requests a recall over an estate in tenant B. The host refuses at intake; the wedge / runtime collaborator refuses as the second line of defense. | Phase 23A vector 7 (cross-tenant policy lane). | Surface 1 (refused at intake), Surface 2 / 4 / 5 / 6 (lookup refused `cross_tenant_refused`). | `blocked-by-policy`. | Host emits intake-deny audit log entry referencing the wedge's `recall_denied`. Cross-tenant chain links are forbidden. | safe draft. |
| 8 | **Denied private-assertion in public frame.** A request in the `public_discord` frame for an `actor_private` assertion is denied; the host surfaces the denial reason without leaking the assertion content. | Phase 23A vector 8 (privacy-scope discipline). | Surface 1, Surface 3 (denial walk), Surface 4 (provenance refusal). | `blocked-by-policy` or `redacted` depending on the wedge's `privacyDispositionForFrame` output. | Host does not leak `actor_private` content via the denial reason. | safe draft. |
| 9 | **Signer not competent for `RecallRequest` envelope.** The caller's `SignatureEnvelope` does not satisfy the wedge's signer-competence discipline; the wedge refuses. | Phase 23A vector 9 (`keyring_validation` lane). | — (not in slice). | — | — | **not in slice** — `keyring_validation`-lane signer competence; covered by existing wedge tests (`tests/signer-fail-closed.test.ts`); `phase-24c-*` does not author a host-layer vector-9 test per ADR-024D §3.b. |
| 10 | **`EstateTransition` on the wire.** The host would receive or emit an `EstateTransition` shape. | Phase 23A vector 10. | — (not in slice). | — | — | **blocked** — ADR-022E gate #1 unchanged; not exercised by Phase 24B. |
| 11 | **`safeCanonicalize` on the wire.** The host would import or invoke a Hounfour `safeCanonicalize` subpath. | Phase 23A vector 11. | — (not in slice). | — | — | **blocked** — ADR-022E gate #2 unchanged; not exercised by Phase 24B. |

## Per-vector audit-chain expectation

For every vector 1–8 that produces a host outcome, the wedge
emits a `RecallReceipt` and an `AuditEvent`. The host surfaces
the receipt at Surface 2 (on retrieval) and the audit event at
Surface 5 (on per-estate lookup). The Phase 5 hardening
invariants
([`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts))
are preserved unchanged.

For vectors 7 (cross-tenant refused) and 8 (denied
private-in-public), the host emits an **additional**
intake-deny audit log entry that references the wedge's
`recall_denied` event for chain-of-custody. The host's own
intake-deny entry is per-tenant; cross-estate / cross-tenant
chain links remain forbidden.

For vector 9 (`keyring_validation`-lane signer competence — not
in slice per ADR-024D §3.b) and vectors 10 and 11 (gates), no
host outcome is locked by Phase 24B; `phase-24c-*` does not
scaffold a host-layer code path that would attempt to exercise
these vectors. Signer-competence behavior continues to be
covered by the existing wedge tests.

## Demo plan

A future demo evidence packet — in the shape of
[`../handoffs/phase-20c-recall-wedge-demo-evidence.md`](../handoffs/phase-20c-recall-wedge-demo-evidence.md),
ported to the host inspection layer — would walk vectors 1–8
end-to-end against the wedge runtime, showing for each vector:

1. The input `RecallRequest` (and, where relevant, the caller
   frame and `detail_level`).
2. The wedge's produced `RecallPack` + `RecallReceipt`.
3. The host surface that consumes the wedge's output (one of
   Surfaces 1–6 from
   [`./dixie-recall-host-mvp-contract.md`](./dixie-recall-host-mvp-contract.md)).
4. The host's rendered response — receipt category, displayed
   exclusion reason, displayed provenance walk, displayed audit
   chain, displayed estate summary.
5. The fail-closed posture the host inherits (for vectors that
   produce a denial / refusal / break).

The demo evidence packet itself is **not** produced by
Phase 24B. Phase 24B is docs/spec-only; demo evidence is the
output of the future `phase-24c-dixie-recall-host-scaffold`
branch under ADR-024D §3.a–c (additive source / tests /
fixtures), or of a successor demo-evidence phase that follows
the implementation scaffold.

Concretely, the demo plan **commits to**:

- **No new fixtures in Phase 24B.** The existing ten Phase 12
  fixtures under
  [`../../fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  remain the reference shape for the host surfaces; they are
  unchanged by Phase 24B.
- **No new tests in Phase 24B.** The existing wedge tests
  (Phase 4 demo, Phase 5 hardening, Phase 20B local scaffold,
  Phase 20C demo evidence, storage conformance, dixie-governed-
  recall handoff) remain green by construction; they are
  unchanged by Phase 24B.
- **The demo evidence packet for the host is produced in a
  later phase** — by `phase-24c-dixie-recall-host-scaffold`
  (additive demo evidence under ADR-024D §3.a–c) or by a
  successor demo-evidence phase. Phase 24B locks the *plan* for
  that packet; it does not produce the packet.

## Layer separation (re-pinned)

| Layer | Conformance vectors | Status (Phase 24B) |
|---|---|---|
| Phase 8 schema-candidate-layer vectors at [`../schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md) under [`../../fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/) | Twelve, four-lane. | Unchanged; load-bearing for a future Hounfour-side adoption PR. |
| Phase 23A wedge-runtime-layer matrix at [`./recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md) | Eleven, four-lane. | Unchanged; load-bearing for `phase-24c-*` test scaffolding at the wedge runtime layer. |
| Phase 24B host-inspection-layer matrix (this doc) | Eight in-slice (Phase 23A vectors 1–8), six host surfaces; vector 9 listed for cross-reference only (`keyring_validation` lane, not in slice per ADR-024D §3.b); vectors 10–11 remain gates. | New; load-bearing for `phase-24c-*` test scaffolding at the host inspection layer. |

The three layers are coordinate, not subordinate. `phase-24c-*`
owes each layer its existing separation; the Phase 24B matrix
does not absolve the Phase 23A or Phase 8 matrices.

## Phase 24B non-scope

This matrix records what the host must distinguish, not what
`phase-24c-*` implements. Per ADR-024D §3.d, §4 and ADR-024E:

- **No source / test / fixture / script / package edits in
  Phase 24B.**
- **No `phase-24c-*` branch opened by Phase 24B.**
- **No schema authoring.** No TypeBox, no JSON Schema, no `$id`.
- **No `package.json` change.** Hounfour stays `^8.6.0`,
  resolved patch `8.6.0`.
- **No sibling-repo edits.**
- **No GitHub issue / comment / PR.**
- **No `EstateTransition` on the wire.** Vector 10 remains a
  gate.
- **No `safeCanonicalize` on the wire.** Vector 11 remains a
  gate.
- **No `Challenge` adoption.** ADR-022E gate #4 unchanged.
- **No `AuditEvent` rename.** ADR-022E gate #5 unchanged.
- **No public commitment-root publication.**
- **No `0xhoneyjar:straylight:*` prefix family adoption.**
- **No `recall-wedge` conformance category adoption** into the
  Straylight test suite.
- **No Hounfour five-step corpus import.**
- **No Hounfour `main` / commit-SHA / git-source consumption.**
- **No HTTP / REST / NATS / Discord / Telegram surface added to
  `loa-straylight`.**
- **No new tests in Phase 24B.** The existing wedge test suite
  remains unchanged.
- **No new fixtures in Phase 24B.** The existing fixtures
  remain unchanged.
- **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
  edits.**
- **No commit, no push, no PR.**

## Cross-references

- [`./dixie-recall-host-mvp-contract.md`](./dixie-recall-host-mvp-contract.md)
  — the per-surface MVP host contract this matrix exercises.
- [`./recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md)
  — Phase 23A wedge-runtime-layer matrix this doc reframes.
- [`./recall-wedge-schema-contract.md`](./recall-wedge-schema-contract.md)
  — Phase 23A per-object MVP schema-contract draft.
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — the Phase 24B decision-lock this matrix sits on top of.
- [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md)
  — host placement: Dixie-first.
- [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — `phase-24b-*` allowable scope and hard non-scope.
- [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — gate #1 (`EstateTransition`), gate #2 (`safeCanonicalize`),
  gate #4 (`Challenge`), gate #5 (`AuditEvent`).
- [`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md)
  — Phase 24B summary handoff.
- [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
  — Phase 12 per-Dixie-surface mapping (refreshed under
  Phase 24B).
- [`../handoffs/phase-20c-recall-wedge-demo-evidence.md`](../handoffs/phase-20c-recall-wedge-demo-evidence.md)
  — the wedge-runtime demo evidence shape the host demo plan
  models against.
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
  — fail-closed receipt + audit-chain invariants.
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — six-receipt-category pin.
- [`../../tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts)
  — the storage-adapter contract Surface 2 (receipt retrieval)
  reads against.
- [`../../fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  — ten Phase 12 reference fixtures, unchanged by Phase 24B.
