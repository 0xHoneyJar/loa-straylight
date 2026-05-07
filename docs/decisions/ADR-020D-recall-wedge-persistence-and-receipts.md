# ADR-020D — Recall Wedge persistence and receipt ownership (decision-lock for Phase 20A)

## Status

Accepted-for-Phase-20A.

This ADR is a Phase 20A decision-lock. It records who currently
owns recall-receipt semantics and where future runtime persistence
*may* live, so Phase 20B can scaffold local receipt machinery
without taking an implicit dependency on a runtime persistence
substrate that does not yet exist. **Phase 20A wires no
persistence and changes no runtime behavior.**

## Context

Today the wedge already emits `RecallPack` + `RecallReceipt` per
`RecallRequest` and writes a hash-chained `AuditEvent` per estate
transition (
[`src/straylight/recall.ts`](../../src/straylight/recall.ts),
[`src/straylight/audit.ts`](../../src/straylight/audit.ts),
[`src/straylight/estate.ts`](../../src/straylight/estate.ts)). Per
[`docs/mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md):

- Storage is `InMemoryStorage` by default and `JsonlStorage`
  (append-only `.jsonl` per "table") as the durable option.
- The `StorageAdapter` interface is the swap-in seam for a future
  Postgres or sibling-runtime substrate.
- "Production database" is explicitly listed under "What's
  deliberately missing (out of scope for this wedge)".

The Phase 5 hardening tests
([`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts))
pin the receipt invariants under fail-closed semantics: missing
policy denies, unknown class fails class validation, unknown
signer fails competence, revoked / forgotten / private / contested
do not surface as `usable` in any frame, and a tampered audit
chain is detectable via `verifyChain`.

The sibling-repo handoff packets stage future persistence /
exposure surfaces:

- Finn (Phase 10) — runtime audit-chain persistence and
  receipt-emission boundaries
  ([`docs/handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md)).
- Dixie (Phase 12) — recall-response surface, receipt retrieval,
  excluded-assertion reason display, provenance inspection,
  audit-chain lookup
  ([`docs/handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md)).
- Freeside (Phase 14) — community / bot / admin surfaces that
  consume Dixie / Finn receipts, never re-mint them
  ([`docs/handoffs/freeside-community-surface-issue.md`](../handoffs/freeside-community-surface-issue.md)).

None of those packets has been merged in their target sibling
repo. Per ADR-020A, Loa-Straylight remains the semantic owner of
each primitive those packets describe.

## Decision

1. **MVP receipt semantics remain owned by Loa-Straylight until
   runtime persistence is chosen.** The shape, fields, and
   invariants of `RecallPack`, `RecallReceipt`, `TransitionReceipt`,
   and `AuditEvent` are defined locally in `src/straylight/` and
   re-exported through
   [`src/straylight/index.ts`](../../src/straylight/index.ts) per
   the [package boundary](../mvp/package-boundary.md). No sibling
   repo redefines them; Phase 20A does not redefine them.

2. **Finn / Dixie / Freeside audit substrates are *future*
   persistence / exposure candidates, not current owners.** A
   later phase may choose to:
   - persist `AuditEvent` chains and `TransitionReceipt`s in
     Finn's runtime substrate;
   - expose `RecallReceipt` / exclusion reasons / provenance
     through a Dixie BFF surface;
   - surface receipts inside community / bot flows through
     Freeside (consuming, never authoring).
   Each such migration is a **separate** ADR + sibling-repo PR
   under teammate review per
   [`docs/handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md).

3. **Phase 20A wires no persistence.** No new `StorageAdapter`
   implementation, no Postgres adapter, no Finn / Dixie / Freeside
   storage shim, no fixture / migration changes. The existing
   `InMemoryStorage` and `JsonlStorage` adapters are unchanged.

4. **Receipt requirements are restated, not redefined.** The
   `RecallReceipt` and the per-transition `TransitionReceipt` /
   `AuditEvent` together must continue to prove, for a given
   `RecallRequest` over a given estate at a given time, what
   estate material was:
   - **included** as `usable` (passed class validation, passed
     policy, status active, scope/privacy/risk inside the
     environment frame);
   - **excluded** (with a reason in the
     [`docs/handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
     /
     [`src/straylight/recall.ts`](../../src/straylight/recall.ts)
     enumeration: `privacy_actor_private_in_public_frame`,
     `status_revoked`, `status_forgotten_from_recall`, etc.);
   - **redacted** (surfaced under the receipt's `RedactionSummary`
     when present);
   - **challenged** (surfaced as `marked` in audit-review frames,
     never as `usable`);
   - **revoked** (filtered by `dispositionFor()` regardless of
     caller intent);
   - **blocked by policy** (a `transition_denied` audit event is
     emitted; the recall receipt records the corresponding
     `ExclusionSummary` entry).
   No new requirement is invented in Phase 20A. Phase 20A's job is
   to write down that this is the receipt contract Phase 20B must
   preserve.

5. **No public anchoring is implied by this ADR.** Commitment-root
   / public-anchor work is governed by ADR-020E and is deferred.
   The receipt semantics above are local proof; they do not
   require a public anchor.

## Consequences

- Phase 20B may scaffold a local Recall Wedge that emits the same
  receipt shapes the existing wedge already emits. It may **not**
  introduce a sibling-repo persistence dependency.
- Any future runtime persistence proposal must cite ADR-020D, the
  Phase 5 hardening invariants, the relevant sibling-repo handoff
  packet (Finn / Dixie / Freeside), and the no-go sequence in
  [`docs/handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md).
- Receipt-shape changes (additive or breaking) are governed by the
  package-boundary discipline in
  [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md):
  additive widening is allowed at minor; narrowing is breaking.

## Non-scope (Phase 20A)

- No persistence wiring (Postgres, Finn substrate, Dixie BFF
  storage, Freeside store).
- No new `StorageAdapter` implementation.
- No fixture changes.
- No new tests.
- No edits to `src/straylight/audit.ts`, `recall.ts`,
  `estate.ts`, `commitment.ts`, or `storage/`.
- No `package.json` / `package-lock.json` changes.
- No sibling-repo edits.
- No commit, no push, no PR.

## Source files inspected

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §11 (recall), §14 (audit), §17 (MVP plan) — referenced via the MVP doc's spec links
- [`docs/mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md) (Phase 0–5 boundary)
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) (Phase 5 stable surface)
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) (in-scope / out-of-scope adversaries)
- [`docs/handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md)
- [`docs/handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)
- [`docs/handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md)
- [`docs/handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
- [`docs/handoffs/freeside-community-surface-issue.md`](../handoffs/freeside-community-surface-issue.md)
- [`docs/handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`docs/handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`src/straylight/index.ts`](../../src/straylight/index.ts) (public surface)
- [`src/straylight/recall.ts`](../../src/straylight/recall.ts), [`audit.ts`](../../src/straylight/audit.ts), [`estate.ts`](../../src/straylight/estate.ts), [`storage/`](../../src/straylight/storage)
- [`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts) (fail-closed receipt invariants)
