# Phase 20B — Recall Wedge implementation candidate scope

> Status: Phase 20A. **Implementation-candidate scope artifact only,
> in `loa-straylight`.** This document is a *forward-looking* scope
> proposal staged by Phase 20A for a future Phase 20B PR. It is
> **not** a Phase 20A implementation. It does **not** create the
> branch it proposes, does **not** scaffold any code, does **not**
> add or remove any dependency, and does **not** edit any sibling
> repo. The actual Phase 20B PR is a separate, future event under
> teammate review.
>
> Companion docs (the Phase 20A decision-locks this scope must
> respect):
> [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md).

## Candidate branch name

Proposed: `phase-20b-recall-wedge-local-scaffold`.

The branch name is a *suggestion*, not a reservation. Phase 20A
does not create the branch. The actual branch is opened by the
person or agent who picks Phase 20B up.

## Candidate goal

Phase 20B prepares a **narrow, local Recall Wedge scaffold** that
extends the existing in-repo wedge surface
([`src/straylight/`](../../src/straylight/),
[`src/straylight/index.ts`](../../src/straylight/index.ts)) **only
within `loa-straylight`** — i.e. it does not begin any
sibling-repo runtime integration and does not flip any wedge
import to a Hounfour name on the public surface.

The scaffold's purpose is to make the next implementation step
*reviewable in one PR* against the Phase 20A decision-locks,
without committing the project to a runtime endpoint host or a
persistence substrate. Concretely, Phase 20B is the place where
the existing `RecallRequest → RecallPack + RecallReceipt`
pipeline (already implemented in
[`src/straylight/recall.ts`](../../src/straylight/recall.ts)) gets
its next layer of local readiness — for example, additional
test coverage of the receipt categories pinned by ADR-020D, or a
small typed library entrypoint shaped to fit a future
Dixie-hosted (default) or Finn-hosted (fallback) inspection
surface per ADR-020B.

The scaffold is **library-shaped**, not endpoint-shaped. No
network surface is added.

## Allowed scope

Inside `loa-straylight` only:

- Add or extend code under `src/straylight/` that composes the
  existing public surface, provided nothing is removed from
  [`src/straylight/index.ts`](../../src/straylight/index.ts) and
  the package-boundary discipline in
  [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) is
  preserved.
- Add or extend `tests/` coverage that pins ADR-020D's six
  receipt categories (included / excluded / redacted /
  challenged / revoked / blocked-by-policy) on top of the
  existing Phase 5 hardening invariants in
  [`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts).
- Extend the local CLI demo
  ([`scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts))
  with additional in-repo scenarios, only if the existing JSON
  output schema (`recall_request`, `recall_pack`,
  `recall_receipt`, `audit_review`, `audit_chain_verification`)
  is preserved or strictly widened.
- Add or update documentation under `docs/`, including new ADRs
  in `docs/decisions/` if Phase 20B uncovers a decision the
  Phase 20A locks did not anticipate (raise it as an ADR before
  code lands).
- Use `@0xhoneyjar/loa-hounfour@^8.5.0` *only* through the
  existing private alias module
  ([`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  on the existing subpaths the Phase 17B / 18 vitest pins
  already validate.

## Explicit non-scope

Phase 20B inherits every Phase 20A non-scope item, plus the
following:

- **No Finn runtime wiring.** No import from `loa-finn`, no
  Finn-side fixture consumption, no Finn-shaped HTTP / NATS /
  WAL adapter.
- **No Dixie runtime wiring.** No import from `loa-dixie`, no
  Dixie-side fixture consumption, no BFF endpoint, no
  recall-response HTTP surface.
- **No Freeside bot / admin / community integration.** No
  Discord / Telegram / REST / NATS surface. No bot command. No
  admin tool. No tenant-context shim.
- **No edits to any sibling repo.** Not `loa-hounfour`, not
  `loa-finn`, not `loa-dixie`, not `loa-freeside`. No clone, no
  fork, no patch.
- **No `Challenge` implementation.** Deferred per ADR-020C and
  delta #7. Phase 20B does not add a `Challenge` schema, type,
  fixture, or verb wiring beyond what already exists in the
  wedge.
- **No `EstateTransition` implementation.** Deferred per
  ADR-020C and delta #8. Phase 20B does not add an
  `EstateTransition` schema, type, or fixture beyond what
  already exists in the wedge.
- **No Hounfour schema authoring.** Hounfour-side work is gated
  by [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  and is not Phase 20B scope.
- **No Hounfour dependency change.** The `^8.5.0` range pin in
  [`package.json`](../../package.json) is unchanged.
- **No `safeCanonicalize` subpath work.** The
  `no-confirmed-subpath` gate (Phase 18) is unchanged. The
  Straylight-local canonicalizer
  ([`src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
  remains the canonicalization implementation.
- **No reach into unexported Hounfour internals.** The alias
  module continues to use only declared subpaths.
- **No public anchor / commitment-root publication.** Per
  ADR-020E. The local helper at
  [`src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  is unchanged.
- **No re-export of
  [`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  from `index.ts`.** The alias module remains private per
  Phase 17B / 19A.
- **No new HTTP / network surface.** The threat model in
  [`docs/mvp/threat-model.md`](../mvp/threat-model.md) lists
  network adversary as out-of-scope; Phase 20B does not move it
  in-scope.
- **No new dependencies in `package.json`.** Adding a runtime
  dependency is a separate ADR + PR.
- **No `.loa/` / `.claude/` edits.**
- **No auth token printing or writing.** The user-scoped
  `~/.npmrc` Hounfour auth (Phase 17B) remains out-of-band; the
  project `.npmrc` remains registry-only.

## Likely files for future implementation

Phase 20B's likely *touch list* (illustrative, not contractual):

- [`src/straylight/index.ts`](../../src/straylight/index.ts) —
  *additive* re-exports only, if the scaffold introduces new
  helpers.
- [`src/straylight/recall.ts`](../../src/straylight/recall.ts) —
  internal extensions of the existing `RecallRequest →
  RecallPack + RecallReceipt` pipeline, preserving the
  package-boundary contract.
- [`src/straylight/audit.ts`](../../src/straylight/audit.ts) —
  internal extensions of the audit-chain plumbing, preserving
  `verifyChain` semantics.
- [`src/straylight/estate.ts`](../../src/straylight/estate.ts) —
  internal extensions only; no new transition verb.
- [`src/straylight/types.ts`](../../src/straylight/types.ts) —
  additive widening only; no narrowing.
- `tests/recall-*.test.ts` — additive tests pinning ADR-020D
  receipt categories.
- `scripts/demo-recall-wedge.ts` — additive scenarios only,
  preserving JSON output schema.
- `docs/mvp/straylight-recall-wedge.md` — small additive notes
  if scaffold changes the demo flow.
- `docs/decisions/` — *possible* new ADRs if Phase 20B uncovers
  a decision Phase 20A did not anticipate.

The list intentionally omits any sibling-repo file or any
Hounfour subpath that is not already pinned by the Phase 17B /
18 vitest test.

## Validation expectations

Phase 20B is expected to satisfy, at minimum:

- `npm run typecheck` — clean.
- `npm test` — green, including:
  - the existing Phase 4 demo test
    ([`tests/phase-4-demo.test.ts`](../../tests/phase-4-demo.test.ts));
  - the existing Phase 5 hardening tests
    ([`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts));
  - the existing Phase 17B / 18 shadow-integration pins
    ([`tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts));
  - the existing Phase 19A review-packet pin
    ([`tests/hounfour-v850-shadow-review-packet.test.ts`](../../tests/hounfour-v850-shadow-review-packet.test.ts));
  - the existing handoff-doc validation tests
    (`tests/cross-repo-handoff-index.test.ts`,
    `tests/hounfour-handoff.test.ts`,
    `tests/hounfour-response-intake.test.ts`).
- `npm run demo:recall` and `npm run demo:recall:json` — both
  succeed; the JSON projection schema is preserved or strictly
  widened.
- The package boundary discipline in
  [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)
  is preserved; nothing is removed from the public surface.

If Phase 20B introduces new ADR-020-series decisions, those new
ADRs land in `docs/decisions/` *before* the code that depends on
them.

## Dependencies on Hounfour feedback

Phase 20B is **not** blocked on Hounfour feedback for the local
scaffold scope above. It is **explicitly blocked** on Hounfour
feedback for any of the following, none of which is Phase 20B
scope:

- Adopting any Hounfour-named symbol on the wedge's public
  surface (gated by Jani / teammate response on issue #70 +
  ADR-020C).
- Adopting `Challenge` or `EstateTransition` (gated by Hounfour
  v8.6.0 / cycle-005).
- Adopting `safeCanonicalize` from a Hounfour subpath (gated by
  the v8.5.x exports map declaring an explicit subpath, or by
  resolution of a Hounfour-side blocker request).
- Resolving the `audit-event-transition` `DISCOVERY_NOTE`
  (Phase 18) — rename, request a Hounfour-side `AuditEvent`
  schema, or re-classify against `audit-trail-entry` /
  `domain-event`.

If Phase 20B uncovers a *new* Hounfour-side question, that
question is filed on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
or against the live `@0xhoneyjar/loa-hounfour@8.5.0` package per
the existing checklist rule, **not** unilaterally resolved inside
`loa-straylight`.

## What this packet is *not*

- **Not** authorization to begin Phase 20B work. It is a *scope
  proposal* the Phase 20A decision-locks frame.
- **Not** a sibling-repo integration plan. Sibling-repo PRs
  remain governed by
  [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md),
  [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md),
  and
  [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md).
- **Not** a license to widen the wedge's public API
  destructively. Additive widening only; narrowing is breaking
  per
  [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md).
- **Not** a license to publish a commitment root. ADR-020E
  governs.
- **Not** a license to wire any sibling repo. ADR-020A and
  ADR-020B govern.

## Cross-references

- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
- [`README.md`](./README.md) — per-packet handoff index, updated in Phase 20A to point at this packet.
