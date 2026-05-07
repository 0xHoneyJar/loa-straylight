# ADR-020A — Straylight semantic owner (decision-lock for Phase 20A)

## Status

Accepted-for-Phase-20A.

This ADR is a Phase 20A decision-lock. It does **not** change Phase 0–19A
runtime behavior, does **not** wire any sibling repo, and does **not**
re-define any primitive. It records the current semantic-ownership
position so Phase 20B can scaffold a local Recall Wedge without taking
an implicit dependency on a sibling repo that does not yet implement
Straylight semantics.

## Context

ADR 0001 ([`docs/decisions/0001-repo-purpose.md`](./0001-repo-purpose.md))
already declares `loa-straylight` as the semantic and product
architecture home for Straylight. The deep architecture spec
([`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
§1.4) labels each sibling repo a *candidate* for one role, with the
explicit note: *"No uploaded repo currently proves complete Straylight
primitive ownership. The stack should be extended, not renamed."*

Phases 16–19A produced four facts that Phase 20A inherits:

- `@0xhoneyjar/loa-hounfour@^8.5.0` is consumed successfully and resolves
  within the v8.5.x line.
- The 15 net-new v8.5.x schemas are present.
- `Challenge` and `EstateTransition` remain deferred to Hounfour v8.6.0
  (deltas #7 / #8).
- `safeCanonicalize` subpath remains deferred under gate
  `no-confirmed-subpath`.

The Hounfour-side issue
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
has been updated with the Phase 19A shadow-inspection packet. We are
waiting for Jani / teammate response before any runtime wiring or
Hounfour-side schema work.

While we wait, Phase 20A locks the next implementation gate by
restating, in one place, who currently owns Straylight semantics.

## Decision

1. **Loa-Straylight remains the semantic owner of Straylight primitives.**
   The primitive list is the one already pinned in ADR 0001:
   `Actor`, `Estate`, `Assertion`, `AssertionStatus`, `Keyring`,
   `Policy`, `Transition`, `RecallRequest`, `RecallPack`,
   `RecallReceipt`, `Challenge`, `Revocation`, `Commitment`,
   `AuditEvent`. Local source of truth is `src/straylight/`
   (types, validators, keyring, policy, audit, estate, recall,
   commitment, storage) re-exported through
   [`src/straylight/index.ts`](../../src/straylight/index.ts) per the
   [package boundary](../mvp/package-boundary.md).

2. **Hounfour is the schema/protocol candidate, not yet the semantic
   owner.** The wedge consumes `@0xhoneyjar/loa-hounfour@^8.5.0` for
   shadow-inspection only via the **private** alias module
   (`src/straylight/hounfour-alias.ts`), which is not re-exported from
   `src/straylight/index.ts`. Hounfour does not yet ship `Challenge`
   or `EstateTransition`; both stay Straylight-owned until Hounfour
   v8.6.0 (cycle-005) ships canonical schemas.

3. **Finn is the runtime / audit / action-gateway candidate, not yet
   the semantic owner.** No Finn module is consumed by the wedge. The
   Phase 10 handoff packet
   ([`docs/handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md))
   stages the contract, not the wiring.

4. **Dixie is the recall / BFF / provenance candidate, not yet the
   semantic owner.** No Dixie module is consumed by the wedge. The
   Phase 12 handoff packet
   ([`docs/handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md))
   stages the contract, not the wiring.

5. **Freeside is the community / app / bot surface candidate, not the
   primitive owner.** No Freeside module is consumed by the wedge.
   The Phase 14 handoff packet
   ([`docs/handoffs/freeside-community-surface-issue.md`](../handoffs/freeside-community-surface-issue.md))
   stages the contract, not the wiring.

6. **No sibling repo is treated as already implementing full
   Straylight semantics.** Until a sibling-repo PR lands and is
   reviewed under teammate review per
   [`cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md),
   the wedge owns every primitive the staged packets describe.

## Consequences

- Phase 20B may scaffold Recall Wedge work in `loa-straylight` itself
  without negotiating ownership with a sibling repo first.
- Any future migration of a primitive's semantic ownership (e.g. once
  Hounfour v8.6.0 ships `Challenge`) is a **separate** ADR that must
  cite the upstream evidence and the local boundary preservation
  test(s).
- The wedge's stable public surface
  ([`src/straylight/index.ts`](../../src/straylight/index.ts)) remains
  the single import path. The Hounfour alias module remains private
  per Phase 17B / 19A.
- Any sibling-repo PR claiming to "extract" or "redefine" a primitive
  must be reviewed against this ADR + ADR 0001. Renaming the repo a
  primitive lives in does not transfer ownership.

## Non-scope (Phase 20A)

- No Finn runtime wiring.
- No Dixie runtime wiring.
- No Freeside bot / admin / community wiring.
- No edits to any sibling repo.
- No new Hounfour schemas authored.
- No `Challenge` implementation.
- No `EstateTransition` implementation.
- No `safeCanonicalize` subpath work.
- No `package.json` / `package-lock.json` changes.
- No `src/` runtime changes.
- No `.loa/` / `.claude/` edits.
- No commit, no push, no PR.

## Source files inspected

- [`docs/decisions/0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §1.4, §1.5, §2, §3
- [`docs/mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`docs/handoffs/README.md`](../handoffs/README.md)
- [`docs/handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
- [`docs/handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md)
- [`docs/handoffs/hounfour-adaptation-delta.md`](../handoffs/hounfour-adaptation-delta.md)
- [`docs/handoffs/hounfour-shadow-integration-findings.md`](../handoffs/hounfour-shadow-integration-findings.md)
- [`docs/handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)
- [`package.json`](../../package.json)
- [`src/straylight/index.ts`](../../src/straylight/index.ts) (public surface, inspected via package boundary doc)
- [`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts) (private alias module, not re-exported)
