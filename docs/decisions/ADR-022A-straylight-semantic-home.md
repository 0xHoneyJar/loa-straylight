# ADR-022A — Straylight semantic home (MVP decision-lock for Phase 22A)

## Status

Accepted-for-Phase-22A.

This ADR is a Phase 22A MVP decision-lock. It is the post-v8.6.0
reaffirmation of ADR-020A and the Phase 20E entry-condition #3
restatement that Phase 21B explicitly did not perform. It does
**not** change Phase 0–21B runtime behavior, does **not** wire any
sibling repo, and does **not** redefine any primitive. It records
the current semantic-ownership position so Phase 22 (and any later
implementation phase) cannot silently drift the boundary on the
back of the v8.6.0 schema-shipping event.

## Context

ADR 0001 ([`docs/decisions/0001-repo-purpose.md`](./0001-repo-purpose.md))
declares `loa-straylight` as the semantic and product architecture
home for Straylight. ADR-020A
([`ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md))
locked that boundary against the v8.5.x line, against the
sibling-repo *candidate* roles in the architecture spec
([`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
§1.4), and against the Phase 9 / 10 / 12 / 14 staged handoff
packets.

Phase 21A consumed `@0xhoneyjar/loa-hounfour@^8.6.0` (resolved to
`8.6.0`; commit `4f31b14`). Phase 21B's schema-readiness lock
([`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md))
records that:

- The 15 net-new v8.5.0-origin schemas remain present at v8.6.0
  and continue to back the corresponding wedge candidates.
- `Challenge` has shipped at v8.6.0 as
  `./schemas/challenge.schema.json`, closing Phase 16 delta #7 at
  the *schema* level — not at the *adoption* level.
- `EstateTransition` (delta #8) remains absent. The Straylight-side
  primitive stays local in
  [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts).
- The `safeCanonicalize` JS subpath remains undeclared in the
  v8.6.0 `exports` map. Gate `no-confirmed-subpath` is unchanged.
- `audit-event-transition` remains a `DISCOVERY_NOTE`; v8.6.x
  ships `audit-trail-entry.schema.json` and `domain-event.schema.json`
  but no `audit-event.schema.json`.

Two adjacent facts shape the reaffirmation:

1. **Successful v8.6.0 intake is not a transfer of ownership.** It
   is a substrate event. Per Phase 21B, "the v8.6.0 release does
   not constitute the issue-#70 response the Phase 19A packet was
   filed for." The schema-shipping event resolves a *schema-level*
   gate, not the semantic-owner question.
2. **Phase 20E entry condition #3 is a Phase 21+ entry-packet
   responsibility, and Phase 21B explicitly declined to discharge
   it.** Phase 22A, as the MVP decision-lock that precedes any
   Phase 22 implementation branch, is the natural place to
   restate the boundary — without re-opening the question.

## Decision

1. **Loa-Straylight remains the semantic / control-plane home for
   Straylight.** The primitive list pinned in ADR 0001 — `Actor`,
   `Estate`, `Assertion`, `AssertionStatus`, `Keyring`, `Policy`,
   `Transition`, `RecallRequest`, `RecallPack`, `RecallReceipt`,
   `Challenge`, `Revocation`, `Commitment`, `AuditEvent` —
   continues to be owned by `loa-straylight`. Local source of
   truth is `src/straylight/` re-exported through
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   per the [package boundary](../mvp/package-boundary.md). No
   sibling repo re-defines any of these primitives by Phase 22A.

2. **Hounfour v8.6.0 is the shipped upstream substrate, not the
   semantic owner.** Per ADR-020C, schema *shape* ownership
   migrates to Hounfour by **adoption**, not by **rename**. The
   v8.6.0 schemas listed in Phase 21B Q1 (and `Challenge` in
   particular) are *substrate candidates*. They are not adopted
   into the Straylight public surface by Phase 22A and are not
   adopted by any later phase except by a separate ADR that
   explicitly cites the upstream evidence and the local boundary
   preservation tests.

3. **Finn remains the runtime / audit / action-gateway
   candidate.** No Finn module is consumed by the wedge today.
   The Phase 10 handoff packet
   ([`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md),
   [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md),
   [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md))
   stages the contract, not the wiring. Phase 22A does not
   authorize Finn runtime preparation work in `loa-finn`.

4. **Dixie remains the recall / BFF / provenance candidate.** No
   Dixie module is consumed by the wedge today. The Phase 12
   handoff packet
   ([`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md),
   [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md),
   [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md))
   stages the contract, not the wiring. Phase 22A does not
   authorize Dixie boundary preparation work in `loa-dixie`.

5. **Freeside remains the community / app / bot surface
   candidate, not the primitive owner.** No Freeside module is
   consumed by the wedge today. The Phase 14 handoff packet
   ([`../handoffs/freeside-community-surface-issue.md`](../handoffs/freeside-community-surface-issue.md))
   stages the contract, not the wiring. Per the Phase 14
   boundary doc, Freeside *consumes* governed recall — it does
   not author it. Phase 22A does not authorize Freeside-side
   work.

6. **The wedge owns every primitive the staged handoff packets
   describe until a sibling-repo PR lands under teammate review.**
   The shipping of `Challenge` upstream at v8.6.0 does not
   transfer ownership; it shifts the *substrate*. ADR-020A's
   ownership statement is preserved unchanged at v8.6.0.

7. **Phase 22A is a docs-only decision-lock.** No sibling-repo
   work is authorized. No code is written outside the
   `docs/decisions/` and `docs/handoffs/` paths. No `src/`,
   `tests/`, `scripts/`, `fixtures/`, `package.json`, or
   `package-lock.json` change is made.

## Consequences

- Any future migration of a primitive's semantic ownership is a
  **separate** ADR (e.g. a future ADR-022F or ADR-023x) that must
  cite the upstream Hounfour schema, the boundary preservation
  test(s), and the corresponding sibling-repo PR under teammate
  review. Renaming the repo a primitive lives in does not
  transfer ownership.
- The wedge's stable public surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  remains the single import path. The Hounfour alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  remains private per Phase 17B / 19A / 21A / 21B.
- Reviewers should reject any Phase 22 PR that introduces a
  Hounfour-named symbol into the public surface, that wires a
  sibling-runtime dependency, or that claims `Challenge` is
  adopted on the strength of the v8.6.0 ship event alone.
- ADR-022B (endpoint host), ADR-022C (schema dependency
  direction), ADR-022D (persistence + audit/receipt owner), and
  ADR-022E (deferred features) all rest on this reaffirmation.
  If this ADR is reopened, those ADRs reopen with it.

## Non-scope (Phase 22A)

- No Finn runtime wiring. No Finn boundary preparation work in
  `loa-finn`.
- No Dixie runtime wiring. No Dixie boundary preparation work in
  `loa-dixie`.
- No Freeside runtime wiring. No Freeside-side work.
- No edits to any sibling repo.
- No new Hounfour schemas authored.
- No `Challenge` implementation, no `Challenge` re-export, no
  `Challenge` adoption into the Straylight public surface.
- No `EstateTransition` implementation.
- No `safeCanonicalize` subpath import. Gate
  `no-confirmed-subpath` unchanged.
- No reach into unexported Hounfour internals.
- No `package.json` / `package-lock.json` changes.
- No `src/` / `tests/` / `scripts/` / `fixtures/` changes.
- No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` /
  `.gitignore` / `.gitmodules` / `.npmrc` edits.
- No commit, no push, no PR.

## Source files inspected

- [`./0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020B-recall-wedge-endpoint-host.md`](./ADR-020B-recall-wedge-endpoint-host.md)
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`../architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §1.4, §1.5, §2, §3
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
- [`../handoffs/README.md`](../handoffs/README.md)
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`../handoffs/phase-20a-recall-wedge-readiness.md`](../handoffs/phase-20a-recall-wedge-readiness.md)
- [`../handoffs/phase-20e-recall-wedge-closeout.md`](../handoffs/phase-20e-recall-wedge-closeout.md)
- [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (public surface, inspected via package boundary doc; unchanged by Phase 22A)
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts) (private alias module, not re-exported; unchanged by Phase 22A)
