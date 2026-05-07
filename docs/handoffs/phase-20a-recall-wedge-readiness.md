# Phase 20A — Recall Wedge decision-lock readiness packet

> Status: Phase 20A. **Decision-lock / readiness artifact only, in
> `loa-straylight`.** This document records the five Phase 20A
> decision-locks staged in
> [`docs/decisions/ADR-020A`](../decisions/ADR-020A-straylight-semantic-owner.md)
> through
> [`docs/decisions/ADR-020E`](../decisions/ADR-020E-commitment-root-deferral.md),
> together with the implementation-readiness verdict for Phase 20B.
> It is **not** runtime wiring, **not** sibling-repo coordination
> beyond an in-repo restatement, and **not** a license to begin
> Recall Wedge implementation.
>
> Phase 20A does **not** flip any wedge import, change `package.json`
> / `package-lock.json`, change the Hounfour dependency range or
> resolved patch, modify
> [`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify [`src/straylight/index.ts`](../../src/straylight/index.ts),
> wire Finn / Dixie / Freeside runtime, edit any sibling repo,
> implement `Challenge` or `EstateTransition`, reach into unexported
> Hounfour internals, or touch `.loa/` / `.claude/`. It does **not**
> commit and does **not** open a PR.
>
> Companion docs:
> [`ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md),
> [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md).

## Executive summary

Phase 20A is the docs / coordination phase that converts
Loa-Straylight's existing architecture and shadow-inspection
material into explicit implementation-readiness decisions, while
the team waits for Jani / teammate response on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
It locks the next implementation gate so Phase 20B can scaffold a
narrow local Recall Wedge **without** taking an implicit
dependency on a sibling repo, a Hounfour schema, a subpath, or a
commitment surface that does not yet exist.

The wedge dependency state inherited from Phases 16–19A is
preserved unchanged:

- `@0xhoneyjar/loa-hounfour@^8.5.0` is consumed successfully and
  resolves within the v8.5.x line.
- The 15 net-new v8.5.x schemas are present.
- `Challenge` and `EstateTransition` remain deferred to Hounfour
  v8.6.0 (cycle-005).
- `safeCanonicalize` exported subpath remains deferred under gate
  `no-confirmed-subpath`.
- `audit-event-transition` is `DISCOVERY_NOTE`, not a blocker.

## Decisions locked (this phase)

The five Phase 20A ADRs in
[`docs/decisions/`](../decisions/), summarized:

| ADR | Decision |
|---|---|
| **020A** Semantic owner | Loa-Straylight remains the semantic owner of the Straylight primitive set. Hounfour / Finn / Dixie / Freeside are *candidates* for their respective roles; none has yet implemented the staged contract. |
| **020B** MVP endpoint host | **Default candidate:** Dixie-hosted recall inspection surface. **Fallback:** Finn-hosted endpoint if Phase 20B requires runtime / model-context assembly. Phase 20A wires neither. |
| **020C** Schema namespace strategy | Future Straylight-specific namespace / package surface; Hounfour remains the canonical schema candidate. Explicit deferrals: `Challenge`, `EstateTransition`, `safeCanonicalize` exported subpath, no reach into unexported Hounfour internals. |
| **020D** Persistence and receipts | MVP receipt semantics owned by Loa-Straylight. Finn / Dixie / Freeside are *future* persistence / exposure candidates. Receipts must continue to prove what was *included*, *excluded*, *redacted*, *challenged*, *revoked*, or *blocked-by-policy*. |
| **020E** Commitment root deferral | Local commitment-root helper unchanged. No public anchoring, no onchain integration. Future-requirement gates recorded for any later wiring ADR. |

## Decisions deferred (this phase)

The following items remain deliberately deferred and are recorded
here so a reviewer can confirm Phase 20A did not silently advance
them:

- **Sibling-repo runtime wiring** (Finn / Dixie / Freeside). Each
  remains a future, separate, sibling-repo PR under teammate
  review per
  [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).
- **`Challenge` and `EstateTransition` schema adoption.** Both
  remain on the Hounfour v8.6.0 / cycle-005 trajectory per
  Phase 16 deltas #7 / #8.
- **`safeCanonicalize` subpath migration.** Deferred under gate
  `no-confirmed-subpath` (Phase 18). The Straylight-local
  canonicalizer at
  [`src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  remains the wedge's canonicalization implementation.
- **`audit-event-transition` resolution path.** Recorded as
  `DISCOVERY_NOTE`, not `MISSING`. Resolution (rename, request a
  Hounfour-side `AuditEvent` schema, or re-classify against
  `audit-trail-entry` / `domain-event`) is a deliberate
  later-phase decision.
- **Public anchor / commitment-root publication.** Gated on the
  seven future-requirement bullets in ADR-020E.
- **Production database / persistence substrate.** Gated on
  ADR-020D + the relevant sibling-repo handoff packet.

## Implementation blockers removed by this phase

Phase 20A is docs-only, but it removes a class of *coordination*
blockers that previously stood between the wedge and a Phase 20B
local scaffold:

1. **Ambiguity over which sibling repo "owns" recall semantics
   today.** ADR-020A names Loa-Straylight, with explicit
   candidate-vs-owner labels for Hounfour / Finn / Dixie /
   Freeside.
2. **Ambiguity over which sibling repo is the first endpoint
   host.** ADR-020B names Dixie as default, Finn as fallback,
   without committing to either in Phase 20A.
3. **Ambiguity over whether Phase 20B may import a Hounfour
   namespace name into the public surface.** ADR-020C says no:
   only Straylight-owned types in
   [`src/straylight/index.ts`](../../src/straylight/index.ts);
   the Hounfour alias module remains private.
4. **Ambiguity over whether Phase 20B may emit a different
   receipt shape than the existing wedge.** ADR-020D pins the
   six receipt-content categories and refers Phase 20B to the
   existing receipt code paths.
5. **Ambiguity over whether Phase 20B may publish a commitment
   root.** ADR-020E says no; the local helper remains as-is.

## Implementation blockers remaining

Phase 20A does **not** remove these. They remain in place for
Phase 20B and any later runtime-wiring phase:

- **Awaiting Jani / teammate response** on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
  No Hounfour-side schema work or Hounfour dependency change
  begins until that response is in.
- **Hounfour v8.6.0 / cycle-005** has not shipped. `Challenge`
  and `EstateTransition` adoption remain deferred until it does.
- **`safeCanonicalize` exported subpath** has not been confirmed.
  No subpath import is permitted until the v8.5.x exports map
  declares one (or a Hounfour-side blocker requests one and is
  resolved).
- **Sibling-repo PRs are unmerged.** Until a Finn / Dixie /
  Freeside PR lands under teammate review, the wedge owns every
  primitive those packets describe (per ADR-020A).
- **Threat-model expansion is gated.** Any phase that adds a
  network surface, real cryptography, or onchain publication
  must update
  [`docs/mvp/threat-model.md`](../mvp/threat-model.md) before
  shipping.

## What Phase 20A did *not* do

For symmetry with the load-bearing decisions above, the following
are **explicitly out of scope** and remain in the same state
Phase 19A left them:

- **No Finn / Dixie / Freeside runtime wiring.** The wedge's
  stable public API
  ([`src/straylight/index.ts`](../../src/straylight/index.ts)) is
  unchanged. No Hounfour validator is wired into any internal
  call site. No Straylight type is renamed to a Hounfour name.
- **No sibling-repo edits.** No clone, no fork, no patch, no
  comment filed against any sibling repo by Phase 20A.
- **No Hounfour schema authoring.** Phase 20A authors zero schema
  files; Hounfour-side schema work is gated by issue #70.
- **No `Challenge` implementation.** Deferred per ADR-020C and
  delta #7.
- **No `EstateTransition` implementation.** Deferred per ADR-020C
  and delta #8.
- **No `safeCanonicalize` subpath import.** Deferred per ADR-020C
  and Phase 18 gate `no-confirmed-subpath`.
- **No Hounfour dependency change.** `package.json` retains
  `@0xhoneyjar/loa-hounfour: ^8.5.0`.
- **No `package.json` / `package-lock.json` changes.**
- **No `src/` runtime changes.**
- **No `.loa/` / `.claude/` edits.**
- **No new tests.** The repo's existing handoff-doc validation
  pattern is preserved; Phase 20A defers test coverage of the new
  ADRs to Phase 20B if/when scaffold work begins.
- **No commit, no push, no PR.**

## Verdict for Phase 20B

> **Ready for Phase 20B — local scaffold scope only.**

Phase 20B is authorized to begin a narrow local Recall Wedge
scaffold inside `loa-straylight` once these Phase 20A decision
locks are merged, subject to the explicit non-scope in
[`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md).
Phase 20B remains **not ready** to wire any sibling-repo runtime,
adopt any v8.6.0 schema, or publish a commitment root.

Any deviation from the Phase 20A decision-locks during Phase 20B
must be raised as a new ADR before code lands; the no-go sequence
in
[`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
remains binding.

## What this packet is *not*

- **Not** Hounfour integration. Every "deferred" item above is a
  later-phase decision unless explicitly marked otherwise (none
  is).
- **Not** Recall Wedge implementation. The wedge's runtime
  behavior is unchanged.
- **Not** sibling-repo coordination beyond an in-repo readiness
  restatement.
- **Not** authorization to file a new comment on issue #70 or
  open a sibling-repo PR.
- **Not** a re-derivation of Phase 16 / 17B / 18 / 19A evidence.
  The canonical evidence lives in the Phase 17B / 18 findings
  doc, the Phase 19A review packet, and the existing vitest pins.

## Cross-references

- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
- [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
- [`README.md`](./README.md) — per-packet handoff index, updated in Phase 20A to point at this packet.
- [`../decisions/0001-repo-purpose.md`](../decisions/0001-repo-purpose.md) — ADR 0001 (repo purpose / current-stack interpretation).
