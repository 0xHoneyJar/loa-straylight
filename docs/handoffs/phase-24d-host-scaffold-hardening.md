# Phase 24D — Dixie recall-host scaffold hardening packet

> Status: Phase 24D. **Local additive hardening pass on top of the
> Phase 24C host scaffold, inside `loa-straylight` only.** This
> packet tightens the existing Phase 24C scaffold under
> [`../../src/straylight/host/`](../../src/straylight/host/) along
> six non-blocking concerns surfaced by the Phase 24C read-only
> review. It introduces **no** new host surface, **no** new
> request/response shape, **no** new wedge primitive, **no**
> fixture, **no** script, **no** `package.json` change, **no** edit
> to [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> **no** re-export of `src/straylight/host/*` through the wedge
> public API, **no** sibling-repo edit, **no** ADR-022E gate
> advance, and **no** Hounfour `#116` adoption.
>
> Phase 24D does **not** flip a wedge import; does **not** change
> `package.json` / `package-lock.json`; does **not** consume
> Hounfour `main` or any unpublished commit; does **not** import
> the Hounfour `#116` five-step conformance corpus; does **not**
> adopt the `0xhoneyjar:straylight:*` audit-event prefix family
> into the Straylight public surface; does **not** adopt the
> `recall-wedge` Hounfour conformance category into the Straylight
> test suite; does **not** wire `loa-dixie` / `loa-finn` /
> `loa-freeside`; does **not** add an HTTP / NATS / Discord /
> Telegram surface; does **not** publish a public commitment
> root; does **not** advance any ADR-022E gate; and does **not**
> touch `.loa/` / `.loa.config.yaml` / `.claude/` / `.beads/` /
> `.run/` / `.github/`. The branch makes no commit, opens no PR,
> and posts no GitHub-side comment by itself.
>
> Companion docs:
> [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
> (refreshed with a Phase 24D hardening addendum, no edits to prior
> sections),
> [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)
> (unchanged),
> [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)
> (unchanged),
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
> (unchanged),
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
> (unchanged).

## Executive summary

Phase 24C landed the local additive TypeScript host-surface scaffold
under [`../../src/straylight/host/`](../../src/straylight/host/) and
covered Phase 24B validation vectors 1–8 at the host inspection
layer. A read-only review of the Phase 24C diff surfaced six
non-blocking hardening concerns. Phase 24D pins those concerns into
the scaffold without changing any response shape, without adding
any new surface, and without touching a wedge primitive:

1. **Tenancy empty-input fail-closed.** `checkSameTenant` now
   refuses an empty `callerTenant` BEFORE invoking the resolver and
   refuses an empty resolver result identically to `undefined`.
   Both paths emit the existing `tenant_unresolved` reason.
2. **Surface 4 tenant-scoped + public_discord refusal.** The
   provenance walk now refuses a `tenant`-scoped parent under a
   `public_discord` caller frame with the existing
   `privacy_scope_refusal` reason. The same parent under an
   `actor_private` caller frame remains permitted. This aligns the
   host's Surface 4 with the wedge's existing
   `privacy_tenant_in_public_frame` redaction discipline on
   Surface 1.
3. **Surface 6 optional intake-deny log on cross-tenant refusal.**
   `handleEstateSummary` gains an *optional* `intakeLog?:
   IntakeDenyLog` dependency. When provided, a cross-tenant target
   refusal appends an intake-deny entry on the CALLER's tenant
   (matching the Surface 1 / 2 / 4 discipline). When omitted, the
   refusal still surfaces in the response shape — Phase 24C call
   sites continue to compile and behave identically.
4. **Surface 1 `needs_review` is not a denial.** Documented inline
   in `handleRecallIntake`: a `needs_review` outcome from the
   wedge writes **no** intake-deny log entry. The intake-deny log
   is reserved for refusals (cross-tenant, frame, storage,
   wedge-side deny). The wedge's audit chain records the
   review-queue routing event independently.
5. **Surface 3 unknown wedge exclusion reason maps to safe
   default.** Documented inline in `classifyExclusionReason`: an
   exclusion reason the host classifier does not recognise maps to
   the generic `excluded` bucket and preserves the verbatim wedge
   string in `raw_reason`. The host has no authority to
   re-classify into a narrower category (`revoked` /
   `challenged`).
6. **Tightened vectors-7-to-8 receipt-not-found assertion.** The
   existing Phase 24C vectors test that exercised Surface 2 with
   an unknown receipt id under a resolver where the caller's
   tenant resolves cleanly now expects EXACTLY
   `unknown_receipt_id`. The host MUST NOT infer tenant identity
   from a missing record.

The scaffold's three load-bearing properties (wedge produces, host
inspects; fail-closed everywhere; no host-side schema authority)
are unchanged. Phase 24D is internal additive hardening with no
public-API or wire-shape impact.

## What this packet ships

### Source edits under `src/straylight/host/`

| File | Change | Why |
|---|---|---|
| [`../../src/straylight/host/tenancy.ts`](../../src/straylight/host/tenancy.ts) | `checkSameTenant` rejects empty `callerTenant` before invoking resolver; rejects empty resolver result identically to `undefined`. | Concern 1 — closes the empty-tenant smuggling path on resolvers that happen to return `""`. |
| [`../../src/straylight/host/provenance.ts`](../../src/straylight/host/provenance.ts) | Surface 4 refuses with `privacy_scope_refusal` when parent `privacy_scope === 'tenant'` AND caller `frame === 'public_discord'`. The same parent under `actor_private` caller frame remains permitted. | Concern 2 — aligns the host's Surface 4 with the wedge's `privacy_tenant_in_public_frame` redaction. |
| [`../../src/straylight/host/estate-summary.ts`](../../src/straylight/host/estate-summary.ts) | `EstateSummaryDeps` gains optional `intakeLog?: IntakeDenyLog`. When provided, cross-tenant target refusals append an intake-deny entry on the CALLER's tenant with `reason: 'cross_tenant_estate_summary'` (or `'tenant_resolution_failed'` for the `tenant_unresolved` branch). | Concern 3 — Surface 6 matches Surfaces 1 / 2 / 4 discipline when callers opt in; backward-compatible when omitted. |
| [`../../src/straylight/host/intake.ts`](../../src/straylight/host/intake.ts) | Inline comment documenting `needs_review` is NOT a denial and writes no intake-deny entry. | Concern 4 — clarifies the receipt-or-audit invariant boundary. |
| [`../../src/straylight/host/exclusion.ts`](../../src/straylight/host/exclusion.ts) | Inline comment documenting unknown wedge reason → `excluded` safe-default; `raw_reason` preserved verbatim; host never re-classifies into a narrower category. | Concern 5 — preserves the wedge's classification authority. |

### Additive test under `tests/`

| File | Pins |
|---|---|
| [`../../tests/phase-24d-host-hardening.test.ts`](../../tests/phase-24d-host-hardening.test.ts) | **Concern 1** — `checkSameTenant` returns `tenant_unresolved` when `callerTenant === ''` even if the resolver returns `""` (fails closed before the resolver is consulted), and when the resolver returns a real slug (the caller-side empty is still refused). **Concern 2** — `checkSameTenant` returns `tenant_unresolved` when the resolver returns `''`. **Concern 3** — Surface 4 refuses with `privacy_scope_refusal` for `parent.privacy_scope === 'tenant'` + caller `frame === 'public_discord'`. **Concern 4** — Surface 4 walks the same `tenant`-scoped parent under caller `frame === 'actor_private'`. **Concern 5** — Surface 6 cross-tenant refusal writes one entry on the caller's tenant (`alice-tenant`) and zero entries on the target's tenant (`satoshi-tenant`) when an `intakeLog` is supplied; entry carries `reason: 'cross_tenant_estate_summary'`, `target_estate_id`, `target_actor_id`. **Concern 6** — Surface 6 cross-tenant refusal returns the same `{ outcome: 'refused', reason: 'cross_tenant_refused' }` shape without `intakeLog` (Phase 24C call shape preserved). **Concern 7** — synthetic unknown wedge exclusion reason produces `category: 'excluded'` with `raw_reason` preserved verbatim in Surface 3. |

### Test tightening under `tests/`

| File | Change |
|---|---|
| [`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts) | The Surface 2 cross-tenant assertion was previously permissive (`['unknown_receipt_id', 'cross_tenant_refused', 'tenant_resolution_failed']`). It now expects EXACTLY `unknown_receipt_id`. The host MUST NOT infer tenant identity from a missing record. |

### Doc additions

| File | Purpose |
|---|---|
| [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md) | **This** summary handoff. |
| [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) | Append-only "Phase 24D — Host scaffold hardening addendum" section between the Phase 24B non-scope and the Cross-references sections. No edits to prior Phase 24B sections. |
| [`./README.md`](./README.md) | Append-only Phase 24D row (no edits to prior rows). |

### Not shipped

- **No new fixture.** Phase 24D adds no file under
  [`../../fixtures/`](../../fixtures/).
- **No new script.** No new entry under
  [`../../scripts/`](../../scripts/); no new `package.json` script.
- **No `package.json` / `package-lock.json` change.** Hounfour
  stays `@0xhoneyjar/loa-hounfour@^8.6.0`, resolved `8.6.0`.
- **No edit to `../../src/straylight/index.ts`.** The wedge public
  surface is byte-identical to its pre-Phase-24C state (and
  remains so under Phase 24D).
- **No edit to any other existing wedge module.** Phase 24D
  touches only the five files under
  [`../../src/straylight/host/`](../../src/straylight/host/)
  enumerated above.
- **No re-export of host symbols through the wedge public API.**
  The Phase 24C local-barrel discipline is preserved.
- **No new wedge primitive.** No new shape, no new audit event,
  no new transition.
- **No new ADR.** Phase 24D operates inside the Phase 24B
  decision-lock; the addendum to
  [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  documents the hardened behaviour but introduces no new policy
  decision requiring a separate ADR.
- **No sibling-repo edits.** Not `loa-hounfour`, not `loa-finn`,
  not `loa-dixie`, not `loa-freeside`.
- **No GitHub-side action.** No issue filed, no comment posted,
  no PR opened.
- **No Hounfour `#116` adoption.** No five-step conformance
  corpus import, no `0xhoneyjar:straylight:*` prefix family
  adoption, no `recall-wedge` category adoption.
- **No advance of any ADR-022E gate.** `EstateTransition` (#1),
  `safeCanonicalize` (#2), `Challenge` re-export (#4),
  `AuditEvent` rename (#5) all unchanged.

## Hardening concern mapping

Each Phase 24D source edit closes one or more of the six
non-blocking concerns surfaced by the Phase 24C read-only review.
The mapping below is the pinned correspondence between concern,
source edit, and test:

| # | Concern | Source edit | Test |
|---|---|---|---|
| 1 | `checkSameTenant` accepted empty `callerTenant` and could be smuggled past a resolver returning `""`. | `tenancy.ts` — early refuse on `callerTenant === ''`; refuse on `resolved === ''` identically to `undefined`. | `phase-24d-host-hardening.test.ts` concerns 1 & 2. |
| 2 | Surface 4 walked `tenant`-scoped provenance under `public_discord` while the wedge already redacts `privacy_tenant_in_public_frame` on Surface 1 — parallel-path leak. | `provenance.ts` — refuse `parent.privacy_scope === 'tenant'` + caller `frame === 'public_discord'` with `privacy_scope_refusal`. | `phase-24d-host-hardening.test.ts` concerns 3 (refuse) & 4 (permit under actor_private). |
| 3 | Surface 6 cross-tenant refusal did not write an intake-deny entry while Surfaces 1 / 2 / 4 did, leaving the per-tenant trail incomplete. | `estate-summary.ts` — optional `intakeLog?` dependency; append on refusal when provided; backward-compatible when omitted. | `phase-24d-host-hardening.test.ts` concerns 5 (with log) & 6 (without). |
| 4 | `needs_review` outcome was visually adjacent to deny paths and could be misread as also writing an intake-deny entry. | `intake.ts` — inline comment documenting `needs_review` is not a denial; writes no entry. | Phase 24C vectors continue to assert the no-write contract. |
| 5 | Unknown wedge exclusion reason silently mapped to `excluded` without explicit "safe-default" framing in code. | `exclusion.ts` — inline comment documenting safe-default; `raw_reason` preserved verbatim; host never re-classifies. | `phase-24d-host-hardening.test.ts` concern 7. |
| 6 | Surface 2 cross-tenant test accepted three possible reasons; the actual fail-closed expectation is exactly one. | `tests/phase-24c-host-vectors-7-to-8.test.ts` — tightened assertion to `unknown_receipt_id`. | Tightened test itself. |

## Architecture summary

Phase 24D preserves the Phase 24C dependency direction:

```
┌─────────────────────────────────────────────────────────────────────┐
│  src/straylight/host/  — Phase 24C scaffold + Phase 24D hardening   │
│                                                                     │
│   tenancy.ts          ← empty-input fail-closed (Phase 24D #1)      │
│   provenance.ts       ← tenant + public_discord refusal (Phase 24D #2) │
│   estate-summary.ts   ← optional intakeLog (Phase 24D #3)           │
│   intake.ts           ← needs_review-is-not-a-denial doc (#4)       │
│   exclusion.ts        ← unknown-reason safe-default doc (#5)        │
│   index.ts: local barrel (NOT re-exported by wedge index.ts)        │
│   receipt.ts, audit-lookup.ts, intake-log.ts, types.ts: unchanged   │
└─────────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │  (one-way; wedge never imports host)
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│  src/straylight/  — wedge public API (unchanged by Phase 24C / 24D) │
└─────────────────────────────────────────────────────────────────────┘
```

The wedge public API (`src/straylight/index.ts`) and every wedge
module are byte-identical to their Phase 24C state. The host
barrel (`src/straylight/host/index.ts`) is byte-identical to its
Phase 24C state — Phase 24D adds no new export. The
`IntakeDenyLog` shape carries `target_estate_id?` already (added
in Phase 24C); Phase 24D's only new code path is the optional
`deps.intakeLog?.append(...)` call inside the existing Surface 6
cross-tenant refusal branch.

## Validation evidence

```bash
npm run typecheck    # clean
npm test             # full suite passes (no regressions)
npx vitest run tests/phase-24c-host-surface-shape.test.ts \
                tests/phase-24c-host-vectors-1-to-3.test.ts \
                tests/phase-24c-host-vectors-4-to-6.test.ts \
                tests/phase-24c-host-vectors-7-to-8.test.ts \
                tests/phase-24c-host-fail-closed.test.ts \
                tests/phase-24c-host-intake-log.test.ts \
                tests/phase-24d-host-hardening.test.ts     # Phase 24C + 24D host suite
npx vitest run tests/phase-5-hardening.test.ts \
                tests/phase-20b-recall-wedge-local-scaffold.test.ts \
                tests/storage-conformance.test.ts \
                tests/dixie-governed-recall-handoff.test.ts # regression pin
```

Pre-existing tests preserved: Phase 4 demo, Phase 5 hardening,
Phase 20B local scaffold, Phase 20C demo evidence, storage
conformance, dixie-governed-recall handoff, all Phase 24C host
tests. The Phase 24C
[`tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts)
test tightens one assertion (Surface 2 cross-tenant → exactly
`unknown_receipt_id`) — no semantic regression: the previous
assertion was a permissive superset that already accepted this
specific reason.

## Open questions / followups (not blocking Phase 24D)

1. **`intakeLog` remains optional on Surface 6.** A future
   hardening pass MAY promote it to required and update existing
   Phase 24C callers in lock-step. That promotion would be a
   breaking change to `EstateSummaryDeps` and is out of scope
   here; Phase 24D's optional-with-backward-compatibility shape
   minimises churn while making the audit discipline available to
   callers that want it.

2. **Wedge-side `privacy_tenant_in_public_frame` discipline could
   be widened beyond `public_discord`.** Phase 24D matches the
   wedge's existing public-frame redaction at the host's Surface
   4. If the wedge widens the redaction (e.g., to `private_admin`
   or a new frame), the host MUST widen Surface 4's matching
   refusal in lock-step. Today the host only knows about the
   two-value `HostFrame` (`actor_private` / `public_discord`); a
   future frame addition is a separate spec event.

3. **Unknown wedge exclusion reason is a code smell upstream.**
   The Phase 24D safe-default mapping fails closed at the host,
   but a wedge release that introduces a new exclusion reason
   string without a corresponding host classifier prefix is a
   wedge-side oversight. The intentional distinct branch in
   `classifyExclusionReason` makes such a release surface here as
   a missing-prefix-match rather than as silent absorption into a
   neighbouring branch.

## Explicit non-scope (Phase 24D)

- No edits to
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  or any existing wedge module outside `src/straylight/host/`.
- No edits to
  [`../../src/straylight/host/types.ts`](../../src/straylight/host/types.ts),
  [`../../src/straylight/host/receipt.ts`](../../src/straylight/host/receipt.ts),
  [`../../src/straylight/host/audit-lookup.ts`](../../src/straylight/host/audit-lookup.ts),
  [`../../src/straylight/host/intake-log.ts`](../../src/straylight/host/intake-log.ts),
  or [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
- No re-export of host symbols through the wedge public API.
- No fixture additions / renames / moves.
- No new script under [`../../scripts/`](../../scripts/).
- No `package.json` / `package-lock.json` change.
- No new ADR.
- No new wedge primitive.
- No new audit event, no new transition.
- No new HostFrame value.
- No new `DeniedReason` value.
- No new `ExclusionReason` value.
- No new host surface.
- No Hounfour `main` / commit-SHA / git-source consumption.
- No `0xhoneyjar:straylight:*` adoption.
- No `recall-wedge` conformance category adoption.
- No Hounfour five-step corpus import.
- No `Challenge` / `EstateTransition` / `safeCanonicalize` /
  `AuditEvent`-rename adoption.
- No public commitment-root publication.
- No HTTP / NATS / Discord / Telegram surface.
- No BFF / server / router / endpoint.
- No queue implementation for `needs_review`.
- No sibling-repo edits. Not `loa-hounfour`, not `loa-finn`, not
  `loa-dixie`, not `loa-freeside`.
- No `.loa/` / `.loa.config.yaml` / `.claude/` / `.beads/` /
  `.run/` / `.github/` / `.gitignore` / `.gitmodules` / `.npmrc`
  edits.
- No commit, no push, no PR, no GitHub-side comment.

## Cross-references

- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — per-surface MVP host contract (Phase 24D addendum appended).
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — vector matrix at the host inspection layer (unchanged).
- [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)
  — Phase 24C scaffold summary handoff (unchanged).
- [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)
  — Phase 24B summary handoff (unchanged).
- [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary (unchanged).
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — Phase 24B decision-lock Phase 24D operates under (unchanged).
- [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
  through
  [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — Phase 24A decision-lock series (unchanged).
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  — host barrel (unchanged by Phase 24D).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge public API (unchanged by Phase 24C and Phase 24D).
- [`../../tests/phase-24d-host-hardening.test.ts`](../../tests/phase-24d-host-hardening.test.ts)
  — Phase 24D hardening test pin.
- [`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts)
  — tightened Surface 2 receipt-not-found assertion (Phase 24D).
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts),
  [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts),
  [`../../tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts),
  [`../../tests/dixie-governed-recall-handoff.test.ts`](../../tests/dixie-governed-recall-handoff.test.ts)
  — regression-pin tests (unchanged by Phase 24D; still pass).
