# Phase 20B — Recall Wedge local scaffold (in-repo only)

> Status: Phase 20B. **Local scaffold artifact only, in
> `loa-straylight`.** This document records the Phase 20B local
> implementation pin produced on the
> `phase-20b-recall-wedge-local-scaffold` branch. Phase 20B is the
> first implementation-facing branch after the Phase 20A
> decision-lock packet, but it remains **local**: it proves local
> recall semantics on the existing `executeRecall` pipeline, and
> it does **not** wire Finn, Dixie, Freeside, or Hounfour runtime
> behavior. Phase 20B is **not the full Recall Wedge**, **not
> governed recall in Finn / Dixie / Freeside runtime**, and
> **not Hounfour-side schema work**.
>
> Phase 20B does **not** flip any wedge import, change
> `package.json` / `package-lock.json`, change the Hounfour
> dependency range or resolved patch, modify
> [`../../src/straylight/`](../../src/straylight/), modify
> [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> wire Finn / Dixie / Freeside runtime, add a Dixie endpoint,
> edit any sibling repo, implement `Challenge` or
> `EstateTransition`, reach into unexported Hounfour internals,
> add a `safeCanonicalize` subpath import, publish a public
> commitment root, or touch `.loa/` / `.claude/`. It does
> **not** commit and does **not** open a PR. The actual Phase 20B
> PR is a separate, future event under teammate review.
>
> Companion docs (the Phase 20A decision-locks Phase 20B
> respects):
> [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md).

## Executive summary

Phase 20B adds a single additive test pin
([`tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts))
that exercises the existing `executeRecall` pipeline against the
six receipt categories named in ADR-020D §4 — *included*,
*excluded*, *redacted*, *challenged*, *revoked*,
*blocked-by-policy* — plus the load-bearing
"structural validity is not authorization" invariant. The pin
reuses the existing fixture builders in
[`fixtures/index.ts`](../../fixtures/index.ts) and adds no new
fixture JSON files.

No source file is modified by Phase 20B. The wedge's stable
public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)) is
unchanged. The package boundary discipline in
[`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) is
preserved. The Hounfour dependency
(`@0xhoneyjar/loa-hounfour@^8.5.0`) is unchanged. The private
alias module
([`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
is unchanged.

## What Phase 20B did

Inside `loa-straylight`, only:

1. **Added one test file:**
   [`tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
   — nine acceptance tests across seven `describe` blocks pinning
   the six ADR-020D receipt categories on the existing pipeline,
   plus one structural-validity pin and one
   receipt-or-audit completeness pin.
2. **Added this handoff doc.** Documents what the local scaffold
   proved and what remains deferred.
3. **Updated the per-packet handoff index
   ([`README.md`](./README.md))** to link this doc.
4. **Updated the cross-repo handoff index
   ([`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md))**
   to link this doc — without introducing any new sibling-repo
   issue URL.

That is the entire Phase 20B touch list.

## Behaviors pinned (local semantics, not runtime-wired)

The new test file pins, on the existing `executeRecall` pipeline:

### ADR-020D §4 — six receipt categories

| Category | Pin |
|---|---|
| **included** | An active, public-scoped, in-scope assertion is surfaced under `pack.included` with `use_instruction: 'usable'` and `status: 'active'`. The receipt's `included_assertion_ids` lists it. |
| **excluded** | Revoked / forgotten / actor-private / out-of-scope-class assertions appear in `pack.excluded_summary` with named reasons (`status_revoked`, `status_forgotten_from_recall`, `privacy_actor_private_in_public_frame`, `class_not_requested:<class>`). The receipt's `excluded_counts_by_reason` mirrors them. |
| **redacted** | A tenant-scoped active assertion in a `public_*` frame appears under `pack.redacted` with reason `privacy_tenant_in_public_frame` (an existing `dispositionFor()` path that no prior test pinned in isolation). The receipt's `redacted_count` equals the sum of `pack.redacted` counts. |
| **challenged** | A contested assertion is surfaced under `pack.marked` with `use_instruction: 'mark_as_contested'`; no marked item is ever `usable`. The receipt's `marked_assertion_ids` lists it. |
| **revoked** | A revoked assertion is excluded from `pack.included` regardless of caller intent (i.e., even when the caller does not pre-set `exclude_statuses`). In an `audit_review` frame, the same assertion appears only under `pack.marked` with a non-`usable` instruction. |
| **blocked-by-policy** | When no `recall_estate_context` competence rule is loaded, a class-valid request returns `ok: false`, `pack` and `receipt` are both undefined, `policy_decision.decision === 'deny'` with reason `policy_unavailable_for_transition`, and the audit log carries a `transition_denied` event whose payload `kind === 'recall_denied'`. |

### Structural validity is not authorization

A class-valid `RecallRequest` (i.e.
`validateRecallRequest(req).valid === true`) is still denied if
local policy rejects the signer or competence:

- **off-keyring signer** → `policy_decision.decision === 'deny'`,
  reasons include `unknown_signer`, `pack` undefined, audit row
  `transition_denied`.
- **missing recall competence rule** → as above with reason
  `policy_unavailable_for_transition`.

This pins the §9.2 invariant: class validation is shape; only
policy + signer competence authorize.

### Receipt-or-audit completeness

For a successful recall, the receipt and the
`recall_pack_emitted` audit row together carry the included
assertion ids, the marked assertion ids, the redacted-count
summary, and the excluded-reason summary — i.e., every recall
explains both *included* and *excluded* material in a single
verifiable artifact pair.

## Validation evidence

```bash
npm run typecheck
npm test
```

Both are expected to be clean on the
`phase-20b-recall-wedge-local-scaffold` branch. The new test
file passes locally (nine tests, all green); existing test files
are unaffected since no source file or fixture is modified.

The pin is consistent with the Phase 20A candidate-scope
validation expectations in
[`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md):
typecheck clean, all existing tests still green (Phase 4 demo,
Phase 5 hardening, Phase 17B / 18 shadow-integration pins,
Phase 19A review-packet pin, handoff-doc validation tests), and
the JSON projection schema of `npm run demo:recall` /
`demo:recall:json` is preserved (Phase 20B does not touch the
demo).

## What Phase 20B explicitly did *not* do

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
  the Phase 16 delta. Phase 20B does not add a `Challenge`
  schema, type, fixture, or verb wiring beyond what already
  exists in the wedge.
- **No `EstateTransition` implementation.** Deferred per
  ADR-020C and the Phase 16 delta.
- **No Hounfour schema authoring.** Hounfour-side work is gated
  by [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  and is not Phase 20B scope.
- **No Hounfour dependency change.** The `^8.5.0` range pin in
  [`../../package.json`](../../package.json) is unchanged.
- **No `safeCanonicalize` subpath work.** The
  `no-confirmed-subpath` gate (Phase 18) is unchanged. The
  Straylight-local canonicalizer
  ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
  remains the canonicalization implementation.
- **No reach into unexported Hounfour internals.** The alias
  module continues to use only declared subpaths.
- **No public anchor / commitment-root publication.** Per
  ADR-020E. The local helper at
  [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  is unchanged.
- **No re-export of
  [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  from `index.ts`.** The alias module remains private per
  Phase 17B / 19A.
- **No new typed helper added under `src/straylight/`.** The
  Phase 20A candidate-scope doc raised "a small typed library
  entrypoint shaped to fit a future Dixie-hosted (default) or
  Finn-hosted (fallback) inspection surface" as illustrative. We
  declined to add it in Phase 20B because the existing
  `executeRecall` pipeline already proves the required behaviors;
  any future entrypoint widening is a separate ADR + PR.
- **No new HTTP / network surface.** The threat model in
  [`../mvp/threat-model.md`](../mvp/threat-model.md) lists
  network adversary as out-of-scope; Phase 20B does not move it
  in-scope.
- **No new dependencies in `package.json`.**
- **No edits to `package-lock.json`.**
- **No edits to `src/`, `fixtures/`, or `scripts/`.** The pin
  uses only the existing public surface
  ([`src/straylight/index.ts`](../../src/straylight/index.ts))
  and the existing fixture builders
  ([`fixtures/index.ts`](../../fixtures/index.ts)).
- **No `.loa/` / `.claude/` edits.**
- **No auth token printing or writing.** The user-scoped
  `~/.npmrc` Hounfour auth (Phase 17B) remains out-of-band; the
  project `.npmrc` remains registry-only.
- **No commit, no push, no PR.**

## What remains deferred

Phase 20B does not move any of the Phase 20A deferrals forward.
The following remain explicitly deferred and are recorded here so
a reviewer can confirm Phase 20B did not silently advance them:

- **Sibling-repo runtime wiring** (Finn / Dixie / Freeside).
  Each remains a future, separate, sibling-repo PR under teammate
  review per
  [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).
- **`Challenge` and `EstateTransition` schema adoption.** Both
  remain on the Hounfour v8.6.0 / cycle-005 trajectory.
- **`safeCanonicalize` subpath migration.** Deferred under gate
  `no-confirmed-subpath` (Phase 18).
- **`audit-event-transition` resolution path.** Recorded as
  `DISCOVERY_NOTE` (Phase 18); resolution is a deliberate
  later-phase decision.
- **Public anchor / commitment-root publication.** Gated on the
  seven future-requirement bullets in ADR-020E.
- **Production database / persistence substrate.** Gated on
  ADR-020D + the relevant sibling-repo handoff packet.
- **Hounfour-side response on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).**
  No Hounfour-side schema work, Hounfour dependency change, or
  public-surface namespace flip happens in Phase 20B.

## What Phase 20B does *not* claim

For symmetry with the load-bearing pins above, Phase 20B
explicitly does **not** claim:

- **Not** "the full Recall Wedge is complete." Phase 20B is the
  first implementation-facing branch after the Phase 20A
  decision-lock packet; it pins local semantics on the existing
  pipeline and does not deliver runtime governed recall.
- **Not** "governed recall exists in Finn / Dixie / Freeside
  runtime." None of the sibling-repo handoff packets has been
  merged in its target repo. Phase 20B touches no sibling repo.
- **Not** "Hounfour owns Straylight schemas." Per ADR-020A and
  ADR-020C, Loa-Straylight remains the semantic owner of every
  Recall Wedge primitive. Hounfour remains the canonical schema
  candidate, gated by issue #70.
- **Not** "`Challenge` exists." Phase 20B does not implement
  `Challenge`. `Challenge` adoption is gated by Hounfour
  v8.6.0 / cycle-005.
- **Not** "`EstateTransition` exists." Phase 20B does not
  implement `EstateTransition`. Its adoption is gated by
  Hounfour v8.6.0 / cycle-005.
- **Not** "the wedge has a public commitment root." Per ADR-020E,
  the commitment-root helper remains local-only.
- **Not** "the wedge has a network surface." Per the threat model
  in [`../mvp/threat-model.md`](../mvp/threat-model.md), network
  adversary remains out-of-scope.

## Cross-references

- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
  — Phase 20A decision-lock readiness packet.
- [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)
  — Phase 20A-staged Phase 20B candidate scope.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  — semantic-owner decision-lock.
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
  — MVP endpoint-host recommendation + fallback.
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
  — schema-namespace strategy + Phase 20A deferrals.
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  — receipt-ownership + persistence-deferral decision-lock; the
  six receipt categories pinned by Phase 20B.
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — commitment-root / public-anchor deferral.
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet.
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  — Phase 17B / 18 shadow-integration findings.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index.
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 20B to link this doc.
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — the Phase 20B local-scaffold test pin itself.
