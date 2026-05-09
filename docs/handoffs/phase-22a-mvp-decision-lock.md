# Phase 22A — MVP decision-lock packet (local only)

> Status: Phase 22A. **MVP decision-lock packet only, in
> `loa-straylight`.** This document records the five MVP
> decision-locks Phase 22A produces (ADR-022A through ADR-022E)
> and pins the Phase 22A discipline before any Phase 22
> implementation branch opens. Phase 22A is **not endpoint-wired**,
> **not runtime-wired**, **not the full Recall Wedge**, **not
> governed recall in Finn / Dixie / Freeside runtime**, and **not
> Hounfour-side schema work**. **No endpoint / runtime integration
> is authorized by this packet.** Phase 22A is **Phase 22A only**
> — it does not advance any Phase 20A / 20B / 20C / 20D / 20E /
> 21A / 21B deferral.
>
> Phase 22A does **not** flip any wedge import, change `package.json`
> / `package-lock.json`, change the Hounfour dependency range or
> resolved patch, modify
> [`../../src/straylight/`](../../src/straylight/), modify
> [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> modify any script under
> [`../../scripts/`](../../scripts/), wire Finn / Dixie / Freeside
> runtime, add a Dixie endpoint, add a Finn endpoint, edit any
> sibling repo, implement `Challenge` locally, implement
> `EstateTransition` locally, reach into unexported Hounfour
> internals, add a `safeCanonicalize` subpath import, publish a
> public commitment root, add a network surface, change persistence,
> add or modify any test, add or modify any fixture, or touch
> `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`. It does
> **not** commit and does **not** open a PR. The actual Phase 22A
> PR is a separate, future event under teammate review.
>
> Companion docs (the Phase 21B readiness lock this decision lock
> builds on, the Phase 19A pending feedback gate this decision lock
> does not satisfy, and the Phase 20A decision-lock series this one
> succeeds):
> [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md),
> [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt),
> [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md),
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
> [`hounfour-response-intake.md`](./hounfour-response-intake.md),
> [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
> [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
> [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
> [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md),
> [`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md),
> [`../decisions/0001-repo-purpose.md`](../decisions/0001-repo-purpose.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md).

## Executive summary

Phase 21B mapped the v8.6.0 Hounfour exported surface to the
Straylight Recall Wedge MVP primitive set, recorded `Challenge` as
newly upstream-shipped (delta #7 schema-level closure), recorded
`EstateTransition` and the `safeCanonicalize` JS subpath as still
not confirmed exported Hounfour contracts, and constrained Phase 22
to local schema/readiness work *or* a drafted-not-filed Hounfour
status comment for issue #70. Phase 21B explicitly did **not**
discharge the Phase 20E entry conditions (semantic-ownership
reaffirmation, endpoint-host placement, schema-ownership
reaffirmation).

Phase 22A is the **MVP decision-lock packet** that converts the
v8.6.0 substrate plus the Phase 20E entry conditions into five
explicit decision-locks before any Phase 22 implementation branch
opens. It produces five ADRs under
[`../decisions/`](../decisions/) — ADR-022A through ADR-022E — and
this summary handoff. It optionally drafts (without filing) a
Hounfour status comment for issue #70 at
[`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md).

The five decisions Phase 22A locks:

1. **Straylight semantic home** (ADR-022A) — Loa-Straylight
   remains the semantic / control-plane home for Straylight.
   Hounfour v8.6.0 is the shipped upstream substrate, not the
   semantic owner. Successful v8.6 intake does **not** authorize
   Finn / Dixie / Freeside runtime wiring. The wedge owns every
   primitive the staged handoff packets describe until a
   sibling-repo PR lands under teammate review.
2. **MVP endpoint host: Dixie preferred; Finn fallback**
   (ADR-022B). The decision criteria are explicit (host's
   architecture-spec role; recall-inspection-first vs.
   runtime-context-assembly-first; whether `executeRecall` runs
   ahead of policy; whether `EstateTransition` /
   `safeCanonicalize` are required on the wire; public-channel
   exposure; whether the host's PR has landed). Freeside is
   **not** a candidate MVP host. **Phase 22A wires neither
   host.**
3. **Schema dependency direction**
   (ADR-022C). Loa-Straylight ← Hounfour (adopt-by-alias),
   Hounfour does not depend on Straylight, Finn ← {Hounfour,
   Straylight}, Dixie ← {Hounfour, Straylight}, Freeside ←
   {Dixie, Finn} ← Straylight. The graph is acyclic and stops
   at the wedge boundary. Hounfour adoption into the public
   surface is by separate ADR per ADR-020C / ADR-022A.
4. **MVP persistence + audit / receipt owner** (ADR-022D).
   Loa-Straylight owns the receipt and audit-event shape at MVP.
   Persistence remains in-process (`InMemoryStorage` /
   `JsonlStorage`). The endpoint host (Dixie or Finn) is a
   *persistence / exposure surface*, not a *semantic owner*.
   The Phase 5 hardening invariants are elevated to "MVP host
   contract." `AuditEvent` stays Straylight-owned; no Hounfour
   `audit-trail-entry` / `domain-event` adoption by Phase 22A.
   Public anchoring remains deferred per ADR-020E.
5. **Phase 22 deferred features list** (ADR-022E). Twenty
   deferral rows, each a gate with a current state and a
   trigger. ADR-022E is the single doc reviewers cite when
   refusing scope creep at the gate.

The sixth decision area — whether a Hounfour status comment is
needed now — is answered: **yes, drafted in-repo, not filed.**
The drafted comment lives at
[`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md).
The concrete upstream ask is the residual gates Phase 21B
identified: `EstateTransition` (delta #8) and the `safeCanonicalize`
exported subpath (`no-confirmed-subpath`). Per Phase 19A
discipline, **filing** the comment is a separate, sibling-repo,
human-reviewed event. Phase 22A drafts only.

## v8.6 inherited state (recap)

Restated narrowly so a reviewer can rely on this list without
re-reading the four-phase Phase 20 lane or the Phase 16 / 17B / 18
/ 19A / 21A / 21B intake:

- `@0xhoneyjar/loa-hounfour@^8.6.0` is consumed successfully
  (Phase 21A; commit `4f31b14`). Resolved to `8.6.0`. Phase 21B
  preserved this state unchanged.
- Schema `$id`s under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`.
- `Challenge` shipped at v8.6.0 as `./schemas/challenge.schema.json`
  (Phase 16 delta #7 schema-level closure).
- `EstateTransition` schema absent in v8.6.x (Phase 16 delta #8
  still queued).
- `safeCanonicalize` exported subpath remains deferred under gate
  `no-confirmed-subpath`. The v8.6.0 `exports` map declares no
  `./canonicalize` and no `./utilities` subpath.
- `audit-event-transition` is `DISCOVERY_NOTE`; v8.6.x ships
  `./schemas/audit-trail-entry.schema.json` and
  `./schemas/domain-event.schema.json` but no
  `audit-event.schema.json`.
- `policy-decision-denied` candidate remains `DEFERRED`.
- The wedge's stable public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged.
- The private alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is unchanged.
- The Phase 19A pending feedback gate on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  remains pending; the v8.6.0 release is partial fulfillment, not
  the issue-#70 response.

## The five Phase 22A ADRs (one row per decision area)

### Decision area 1 — Straylight semantic home

**Lock:** ADR-022A
([`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md)).

Loa-Straylight remains the semantic / control-plane home for
Straylight post-v8.6.0. The primitive list pinned in ADR 0001 is
preserved. Hounfour v8.6.0 is shipped upstream substrate, not the
semantic owner. Finn, Dixie, and Freeside remain *candidate*
roles (runtime / recall-BFF / community-surface) per ADR-020A,
ADR 0001, and the architecture spec §1.4. The shipping of
`Challenge` upstream does **not** transfer ownership; per
ADR-020C, schema *shape* ownership migrates to Hounfour by
**adoption** (alias / re-export under a separate ADR), not by
**rename**.

The successful v8.6 intake does **not** authorize Finn / Dixie /
Freeside runtime wiring. ADR-022A makes this explicit so Phase 22
implementation work cannot silently advance ownership on the
strength of the substrate event.

### Decision area 2 — MVP endpoint host: Dixie vs Finn

**Lock:** ADR-022B
([`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md)).

The MVP endpoint host is selected by seven ordered criteria
(host's architecture-spec role; runtime-shape; whether
`executeRecall` runs ahead of policy; whether `EstateTransition`
is required on the wire; whether `safeCanonicalize` is required
on the wire; public-channel exposure; whether the host's PR has
landed). For an MVP whose first endpoint inspects a precomputed
`RecallPack` + `RecallReceipt`, **Dixie is the preferred host**.
For an MVP whose first endpoint must execute a `RecallRequest`
inside a runtime tool call, **Finn is the fallback host**.
**Freeside is not a candidate MVP host.**

Phase 22A wires neither host. No `package.json` dependency on
`loa-dixie` or `loa-finn` is added. Per Phase 21B Q5, Finn /
Dixie boundary preparation work in those sibling repos remains
**not authorized** until the Phase 19A pending feedback gate is
satisfied (or a teammate review explicitly approves proceeding)
**and** a separate ADR selects the host.

### Decision area 3 — Schema dependency direction

**Lock:** ADR-022C
([`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md)).

The MVP schema dependency graph:

```
            (canonical schema substrate)
                        |
                  loa-hounfour
                  /     |     \
                 v      v      v
         loa-straylight loa-finn loa-dixie
                 \      /         |
                  \    /          |
                   v  v           v
                (semantic       (semantic
                 contract)       contract)
                    ^               ^
                    |               |
                 loa-finn        loa-dixie
                                    |
                                    v
                                loa-freeside
```

- Hounfour → Straylight, Finn, Dixie (substrate).
- Straylight → Finn, Dixie (semantic contract).
- {Dixie, Finn} → Freeside (governed recall consumption).
- No edge points into `loa-straylight` from any sibling at MVP.
- No edge points into `loa-hounfour` from any sibling at MVP.
- The wedge's stable public surface is the cut: siblings
  consume Straylight only via
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts);
  the Hounfour alias module remains private.

Adoption of any specific Hounfour schema into the wedge's public
surface (including `Challenge`) is by separate ADR per
ADR-020C / ADR-022A. Phase 22A authors no schema and flips no
import.

### Decision area 4 — MVP persistence + audit / receipt owner

**Lock:** ADR-022D
([`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md)).

The shape, fields, invariants, and emission rules of `RecallPack`,
`RecallReceipt`, `TransitionReceipt`, and `AuditEvent` are owned
by Loa-Straylight at MVP. The six receipt categories from
ADR-020D — **included / excluded / redacted / challenged /
revoked / blocked-by-policy** — are preserved unchanged. The
existing in-process persistence (`InMemoryStorage`,
`JsonlStorage`) is the MVP substrate. No production database, no
Postgres adapter, no sibling-runtime persistence shim is wired.

The MVP endpoint host (Dixie or Finn per ADR-022B) is a
**persistence / exposure surface** for receipts and audit events
— it is **not** their semantic owner. The Phase 5 hardening
invariants
([`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts))
are elevated from "Phase 5 hardening" to "MVP host contract": a
host that re-mints receipts, surfaces challenged / revoked /
forgotten material as `usable`, or serves an unverified chain is
rejected.

`AuditEvent` stays Straylight-owned at MVP. v8.6.x ships
`audit-trail-entry.schema.json` and `domain-event.schema.json` but
no `audit-event.schema.json`. ADR-022D does **not** adopt either
candidate. `Commitment` stays Straylight-owned; public anchoring
remains deferred per ADR-020E.

### Decision area 5 — Deferred features for Phase 22 and beyond

**Lock:** ADR-022E
([`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)).

Twenty deferral rows. Each row is a **gate** with a current state
and a **trigger** that would unblock it. The deferred items
include `EstateTransition` schema and local implementation;
`safeCanonicalize` JS-subpath adoption; `Challenge` adoption into
the wedge's public surface; `AuditEvent` adoption from a Hounfour
candidate; `policy-decision-denied` schema-candidate disposition;
public commitment-root anchor; production database / persistence
substrate; Finn / Dixie / Freeside runtime wiring; new HTTP /
NATS / Discord / Telegram surface; reach into unexported Hounfour
internals (**never** unblocks); new `package.json` dependencies;
sibling-repo edits; Hounfour status comment **filing**; the
eleven exported-but-unconsumed Hounfour JS subpaths; adoption of a
Hounfour-named symbol into the wedge's public surface; Phase 22
implementation work without a separate authorizing ADR; and
threat-model widening.

ADR-022E is the single doc reviewers cite when refusing scope
creep at the gate.

## Decision area 6 — Hounfour status comment

The decision: **yes, drafted in-repo, not filed.**

The concrete upstream ask Phase 22A identifies is the residual
gates Phase 21B's Q4 classified as runtime-integration blockers:

- **`EstateTransition` schema** (delta #8 still queued).
  Awaiting confirmation that an `estate-transition.schema.json`
  is queued for an upcoming v8.6.x patch or a v8.7.x release,
  and (if known) the timeline.
- **`safeCanonicalize` exported subpath** (gate
  `no-confirmed-subpath`). Awaiting confirmation that
  `./canonicalize` (or `./utilities`) is on the roadmap as a
  declared subpath in the `exports` map, and (if known) the
  timeline.

The comment is drafted at
[`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md).
Per Phase 19A / Phase 21B discipline:

- **Filing** the comment is a separate, sibling-repo,
  human-reviewed event. Phase 22A does **not** file it.
- The drafted comment makes **no** claim that the v8.6.0
  release satisfies the Phase 19A pending feedback gate; it
  asks for status only.
- The drafted comment makes **no** claim that `Challenge` is
  adopted into the Straylight public surface.
- The drafted comment makes **no** claim that any sibling-repo
  runtime is wired.

## Phase 22 entry conditions (forward-looking; non-binding on Phase 22A)

ADR-022B and ADR-022E together specify the entry conditions a
future Phase 22 implementation branch must satisfy before
beginning endpoint / runtime wiring. Restated for the reviewer:

- Phase 19A pending feedback for issue #70 received **or** a
  teammate review on this repo explicitly approves proceeding.
- ADR-022B-criteria-driven placement ADR selects Dixie or Finn
  (or formally defers).
- ADR-022D receipt / audit-chain invariants preserved by the
  proposed wiring.
- Whichever ADR-022E gates the proposed feature unblocks have
  their triggers satisfied.

Phase 22A does **not** open Phase 22 implementation; restatement
of these entry conditions is a Phase 22 entry-packet
responsibility.

## Phase 22 non-go conditions

A Phase 22 implementation branch must **not** open if any of the
following holds:

- Phase 19A pending feedback still pending **and** no teammate
  review approves proceeding → do not begin endpoint / runtime
  wiring.
- ADR-022B placement still unselected → do not wire Dixie or
  Finn.
- ADR-022A semantic-ownership boundary still unrestated for
  Phase 22 entry → do not flip imports.
- Any ADR-022E trigger required for the proposed feature is
  unsatisfied → do not advance the feature.
- The proposed wiring requires `EstateTransition` on the wire
  while delta #8 remains queued → do not wire.
- The proposed wiring requires `safeCanonicalize` on the wire
  while gate `no-confirmed-subpath` is in force → do not wire.
- The proposed work edits any sibling repo from this branch →
  do not edit.

## Explicit non-scope (Phase 22A)

Phase 22A is **MVP decision-lock only**. It performs no
implementation work. The following are out-of-scope and remain in
the same state Phase 21B left them:

- **No `src/` changes.** The wedge's stable public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged. The private alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is unchanged. No re-export is added or removed. No internal
  module is edited.
- **No tests.** No new test file. No edit to any existing test
  file.
- **No scripts.** No edit to any script under
  [`../../scripts/`](../../scripts/).
- **No fixtures.** No new fixture file. No edit to any existing
  fixture file under
  [`../../fixtures/`](../../fixtures/).
- **No package changes.** `package.json` and `package-lock.json`
  are unchanged from Phase 21A / Phase 21B. The Hounfour
  dependency (`@0xhoneyjar/loa-hounfour@^8.6.0`) range and
  resolved patch (`8.6.0`) are unchanged.
- **No Dixie endpoint.** ADR-022B's preferred host is unchanged
  and unwired.
- **No Finn endpoint.** ADR-022B's fallback host is unchanged
  and unwired.
- **No Freeside integration.** No bot / admin / community /
  Discord / Telegram / REST / NATS surface is added.
- **No Hounfour schema work.** No new schema file authored. No
  Hounfour-side schema edit. No comment **filed** against any
  sibling repo by Phase 22A.
- **No `Challenge` adoption.** Although `challenge.schema.json`
  is shipped at v8.6.0, no `Challenge` re-export is added to the
  public surface, no local `Challenge` type / schema / fixture /
  verb is added, and no import is flipped.
- **No `EstateTransition` implementation.** Deferred per
  ADR-020C / ADR-022C / ADR-022E and Phase 16 delta #8.
- **No `safeCanonicalize` work.** Gate `no-confirmed-subpath`
  unchanged. The local canonicalizer
  ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
  remains the canonicalization implementation. No reach into
  unexported Hounfour internals.
- **No public anchors.** Per ADR-020E.
- **No persistence wiring.** Per ADR-020D / ADR-022D.
- **No new HTTP / NATS / REST / Discord / Telegram surface.**
- **No sibling repo edits.** Not `loa-hounfour`, not `loa-finn`,
  not `loa-dixie`, not `loa-freeside`. No clone, no fork, no
  patch, no comment **filed** against any sibling repo by
  Phase 22A.
- **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` /
  `.gitignore` / `.gitmodules` / `.npmrc` edits.**
- **No commit, no push, no PR.**

## What this packet does *not* claim

For symmetry with the decision-lock answers above, and so a
reviewer cannot misread Phase 22A as authorization for Phase 22
runtime / endpoint wiring, Phase 22A explicitly does **not**
claim:

- **Not** "the v8.6.0 release satisfies the Phase 19A pending
  feedback gate." `Challenge` shipping is partial fulfillment;
  the issue-#70 response remains pending.
- **Not** "Hounfour owns Straylight schemas." Per ADR-020A /
  ADR-022A and ADR-020C / ADR-022C, Loa-Straylight remains the
  semantic owner. Hounfour remains the canonical schema
  *candidate*. Adoption is by separate ADR.
- **Not** "`Challenge` is adopted." The schema is shipped
  upstream. Adoption into the public surface is a separate ADR
  per ADR-022E gate #4.
- **Not** "`EstateTransition` is unblocked." Schema absence in
  v8.6.x continues to gate any runtime path that would require
  it.
- **Not** "`safeCanonicalize` subpath is unblocked." Gate
  `no-confirmed-subpath` unchanged.
- **Not** "the eleven exported-but-unconsumed JS subpaths are
  authorized for consumption." Their presence is informational.
- **Not** "a Dixie endpoint exists." ADR-022B preference is a
  *recommendation*; no `loa-dixie` PR has been opened.
- **Not** "a Finn endpoint exists." ADR-022B fallback is a
  *recommendation*; no `loa-finn` PR has been opened.
- **Not** "Phase 22 is authorized to begin Finn or Dixie
  boundary prep." Phase 21B Q5 remains binding.
- **Not** "Phase 22 is authorized to flip any wedge import."
- **Not** "the Hounfour status comment has been filed." It is
  drafted in-repo only.
- **Not** "any new HTTP / NATS / REST / Discord / Telegram
  surface exists." None.

This is **MVP decision-lock**. The output is **local
documentation** — five ADRs, this summary, a drafted-not-filed
upstream status comment, and an updated handoffs README index —
that locks the MVP decisions before any Phase 22 implementation
branch opens. The Recall Wedge is **not runtime-wired** and
**not endpoint-wired** by Phase 22A. This is **Phase 22A only**.

## Validation evidence

```bash
npm run typecheck
npm test
```

`npm run typecheck` and `npm test` are expected to remain clean on
the `phase-22a-mvp-decision-lock` branch: Phase 22A adds no new
test, modifies no source file, and modifies no script, fixture, or
package file, so the existing Phase 4 demo test, the Phase 5
hardening tests, the Phase 17B / 18 / 21A shadow-integration pin,
the Phase 19A review-packet pin, the Phase 20B local-scaffold pin,
the Phase 20C demo-shape pin, and the existing handoff-doc
validation tests are unaffected.

## Cross-references

- [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md)
  — Phase 21B schema-readiness lock (the substrate map this
  decision lock builds on; Q5 constrains Phase 22's allowable
  shapes).
- [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)
  — Phase 21A v8.6.x shadow inspection output.
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet (the load-bearing pending
  feedback gate this decision lock does not satisfy).
- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — Phase 16 per-delta accepted-with-adaptation table (delta
  numbering used throughout).
- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — Phase 16 disposition-counts intake doc.
- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
  [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
  [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
  [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
  [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md),
  [`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md)
  — Phase 20 lane (decision-lock + scaffold + demo + endpoint
  boundary + closeout).
- [`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md)
  — drafted-not-filed Hounfour status comment for issue #70
  (Phase 22A; in-repo only).
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index.
- [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order.
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 22A to link this doc and the five ADRs.
- [`../decisions/0001-repo-purpose.md`](../decisions/0001-repo-purpose.md)
  — repo-purpose declaration.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
  [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
  [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
  [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
  [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — Phase 20A decision-lock series (the predecessor that
  Phase 22A succeeds without superseding).
- [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md)
  — Phase 22A decision area 1.
- [`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md)
  — Phase 22A decision area 2.
- [`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md)
  — Phase 22A decision area 3.
- [`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md)
  — Phase 22A decision area 4.
- [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — Phase 22A decision area 5.
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge's stable public API surface (unchanged by Phase 22A).
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  — private Hounfour alias module (unchanged by Phase 22A).
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  — local canonicalizer (unchanged by Phase 22A; gate
  `no-confirmed-subpath` unchanged).
- [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts)
  — local estate / transition application (unchanged by
  Phase 22A; `EstateTransition` deferral unchanged).
- [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  — local commitment-root helper (unchanged by Phase 22A;
  ADR-020E unchanged).
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
  — fail-closed receipt + audit-chain invariants (elevated to
  MVP host contract by ADR-022D).
