# ADR-022D — MVP persistence and audit / receipt owner (decision-lock for Phase 22A)

## Status

Accepted-for-Phase-22A.

This ADR is a Phase 22A MVP decision-lock. It is the post-v8.6.0
restatement of ADR-020D under the Phase 21B substrate. It records,
for the MVP, who owns recall-receipt and audit-event semantics,
who may persist them, and what an MVP endpoint host must preserve
when surfacing them. **Phase 22A wires no persistence, adds no
storage adapter, and changes no runtime behavior.**

## Context

ADR-020D pinned receipt-shape ownership to Loa-Straylight against
the v8.5.x substrate, restated the six receipt categories
(included / excluded / redacted / challenged / revoked /
blocked-by-policy), and recorded that Finn / Dixie / Freeside are
*future* persistence / exposure candidates, not current owners.

Phase 21B's substrate map adds three facts ADR-022D inherits:

- **`Challenge` shipped** at v8.6.0 as
  `./schemas/challenge.schema.json`. The receipt-shape `challenged`
  category is Straylight-owned and is **not** affected by the
  shipping event; adoption of the Hounfour shape is by separate
  ADR per ADR-020C / ADR-022A / ADR-022C.
- **`AuditEvent` (under that name) is not shipped at v8.6.x.**
  v8.6.x ships `audit-trail-entry.schema.json` and
  `domain-event.schema.json`. The Straylight candidate
  `audit-event-transition.json` is `DISCOVERY_NOTE`, not MATCH /
  EXTEND. ADR-022D treats `AuditEvent` as **Straylight-owned and
  unmigrated** at MVP.
- **`safeCanonicalize` JS subpath is undeclared.** Receipt and
  audit-event canonicalization continues to flow through the
  local canonicalizer at
  [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts).

ADR-022B ranks Dixie as the preferred MVP endpoint host
(recall-inspection-first) and Finn as the fallback (runtime-
enforcement-first). ADR-022D answers the persistence / receipt
ownership question against either host, without selecting one.

## Decision

### 1. Receipt and audit-event ownership: Loa-Straylight (MVP)

For MVP, the **shape, fields, invariants, and emission rules**
of:

- `RecallPack`
- `RecallReceipt`
- `TransitionReceipt`
- `AuditEvent`

are owned by Loa-Straylight and defined locally in `src/straylight/`
([`recall.ts`](../../src/straylight/recall.ts),
[`audit.ts`](../../src/straylight/audit.ts),
[`estate.ts`](../../src/straylight/estate.ts),
[`commitment.ts`](../../src/straylight/commitment.ts)), re-exported
through
[`../../src/straylight/index.ts`](../../src/straylight/index.ts)
per the [package boundary](../mvp/package-boundary.md). No sibling
repo redefines them. The ADR-020D six-category enumeration —
**included / excluded / redacted / challenged / revoked /
blocked-by-policy** — is preserved unchanged.

### 2. Persistence: in-process for MVP; production substrate deferred

For MVP, persistence is the existing
[`../../src/straylight/storage/`](../../src/straylight/storage)
adapter pair:

- `InMemoryStorage` by default.
- `JsonlStorage` (append-only `.jsonl` per "table") as the
  durable option.

The `StorageAdapter` interface remains the swap-in seam for a
future Postgres / sibling-runtime substrate. **No production
database is wired by Phase 22A.** No new storage adapter is
authored. No fixture / migration / new test is added.

### 3. The MVP endpoint host (Dixie or Finn) does not own receipts

Whichever host ADR-022B's criteria select for MVP:

- **Dixie (preferred, recall-inspection-first)** must serve
  `RecallPack` + `RecallReceipt` outputs the wedge already
  produced. Dixie does **not** re-mint receipts. Dixie does
  **not** redefine the shape. Per the Phase 12 boundary
  ([`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)):
  no recall without receipt; no leakage of private estate
  material; no surfacing of challenged / revoked / forgotten
  material as ordinary active context; no model-summary-as-
  canonical-truth.
- **Finn (fallback, runtime-enforcement-first)** must execute a
  `RecallRequest` under policy, emit the receipt the wedge
  defines, and append the audit-event the wedge defines. Per the
  Phase 10 boundary
  ([`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)):
  no recall without receipt; no action / commitment without
  policy validation; no keyring bypass; no model-output-as-
  authority.

The MVP endpoint host is a **persistence / exposure surface** for
receipts and audit events; it is **not** their semantic owner.

### 4. Audit-chain integrity: the wedge's invariant is the host's contract

The Phase 5 hardening invariants
([`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts))
already pin:

- Missing policy denies (fail-closed).
- Unknown class fails class validation.
- Unknown signer fails competence.
- Revoked / forgotten / private / contested do not surface as
  `usable`.
- Tampered audit chains are detectable via `verifyChain`.

These invariants are **the contract the host inherits**. A host
that breaks any of them — by re-minting receipts, by skipping
class validation before policy, by surfacing challenged material
as `usable`, by serving an unverified chain — is rejected. ADR-022D
elevates these invariants from "Phase 5 hardening" to "MVP host
contract."

### 5. `AuditEvent` stays Straylight-owned at MVP

Until Hounfour ships an `AuditEvent` schema **under that name**
(or a separate ADR explicitly adopts `audit-trail-entry.schema.json`
or `domain-event.schema.json` as the canonical replacement), the
`AuditEvent` shape stays Straylight-owned. Phase 22A does **not**
adopt either Hounfour candidate. The `audit-event-transition`
candidate disposition remains `DISCOVERY_NOTE` per Phase 21B.

### 6. `Commitment` stays Straylight-owned; public anchoring remains deferred

Per ADR-020E, public anchoring / commitment-root publication
remains optional and deferred. The local commitment-root helper
at [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
is unchanged. The seven future-requirement gates in ADR-020E
remain unsatisfied. The MVP endpoint host **must not** publish a
commitment root, must not promote the local root from
"optional, computed on demand" to "always emitted", and must not
add an anchor surface.

### 7. Migration trajectory (recorded, not implemented)

A future ADR may propose:

- Persisting `AuditEvent` chains and `TransitionReceipt`s in
  Finn's runtime substrate.
- Exposing `RecallReceipt` / exclusion reasons / provenance
  through a Dixie BFF surface.
- Surfacing receipts inside community / bot flows through
  Freeside (consuming, never authoring).
- Adopting a Hounfour `AuditEvent` schema (when shipped) as the
  canonical shape, with the wedge's `AuditEvent` becoming a thin
  alias / re-export.

Each migration is a **separate** ADR + sibling-repo PR under
teammate review per
[`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md).
Phase 22A does not advance any of them.

## Consequences

- A Phase 22 implementation branch that wires an MVP endpoint
  host must (a) cite ADR-022D, (b) preserve the six receipt
  categories, (c) preserve the audit-chain integrity invariants
  in [`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts),
  and (d) refuse to re-mint receipts.
- Receipt-shape changes (additive or breaking) remain governed
  by the package-boundary discipline in
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md):
  additive widening at minor; narrowing is breaking.
- Reviewers should reject any Phase 22 PR that:
  - Adds a Postgres / Finn / Dixie / Freeside production
    persistence adapter.
  - Promotes the local commitment root to required output.
  - Re-mints receipts at the host.
  - Adopts a Hounfour `AuditEvent` candidate without a separate
    ADR.
  - Surfaces `challenged` / `revoked` / `forgotten` material as
    ordinary `usable` context.

## Non-scope (Phase 22A)

- No persistence wiring (Postgres, Finn substrate, Dixie BFF
  storage, Freeside store).
- No new `StorageAdapter` implementation.
- No edits to
  [`../../src/straylight/audit.ts`](../../src/straylight/audit.ts),
  [`recall.ts`](../../src/straylight/recall.ts),
  [`estate.ts`](../../src/straylight/estate.ts),
  [`commitment.ts`](../../src/straylight/commitment.ts), or
  [`storage/`](../../src/straylight/storage).
- No `AuditEvent` adoption from `audit-trail-entry.schema.json`
  or `domain-event.schema.json`.
- No `Challenge` re-export to the public surface.
- No `safeCanonicalize` subpath import.
- No public anchor / commitment-root publication.
- No fixture changes.
- No new tests.
- No `package.json` / `package-lock.json` changes.
- No sibling-repo edits.
- No commit, no push, no PR.

## Source files inspected

- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md)
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
- [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md) (Phase 0–5 boundary)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (Phase 5 stable surface)
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (in-scope / out-of-scope adversaries)
- [`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md)
- [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)
- [`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md)
- [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
- [`../handoffs/freeside-community-surface-issue.md`](../handoffs/freeside-community-surface-issue.md)
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (public surface)
- [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts), [`audit.ts`](../../src/straylight/audit.ts), [`estate.ts`](../../src/straylight/estate.ts), [`commitment.ts`](../../src/straylight/commitment.ts), [`storage/`](../../src/straylight/storage)
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts) (local canonicalizer; gate `no-confirmed-subpath` unchanged)
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts) (fail-closed receipt + audit-chain invariants)
