# Hounfour v8.5.x upstream-review packet (Phase 19A)

> Status: Phase 19A. **Upstream-coordination artifact only, in
> `loa-straylight`.** This file is a narrow, copy-ready summary of
> the Phase 17B + Phase 18 shadow-inspection findings against
> `@0xhoneyjar/loa-hounfour@^8.5.0`, prepared so a human reviewer
> can paste the **Ready-to-copy comment** section below into
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> as a status update.
>
> Phase 19A is **not** Hounfour integration. It does **not** flip
> any wedge import, change `package.json` / `package-lock.json`,
> change the Hounfour dependency range or resolved patch, modify
> `src/straylight/hounfour-alias.ts`, modify `src/straylight/index.ts`,
> wire Finn / Dixie / Freeside runtime, inspect or edit any sibling
> repo, implement `Challenge` or `EstateTransition`, reach into
> unexported Hounfour internals, or touch `.loa/` / `.claude/`. It
> does **not** commit and does **not** open a PR. The packet is a
> docs-only summary of evidence already pinned by Phase 17B + Phase
> 18 in this repo.
>
> Companion docs (the canonical evidence this packet summarizes):
> [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
> (Phase 17B + Phase 18 working-tree findings — the source of truth
> for every fact below),
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
> (per-delta accepted-with-adaptation table for v8.5.0 final),
> [`hounfour-response-intake.md`](./hounfour-response-intake.md)
> (Jani's response on issue #70 and the post-intake upstream
> update), and
> [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
> (readiness evidence + Phase 17 dependency-flip checklist).

## What Phase 19A is

Phase 19A is a **single packet doc** that:

- summarizes the Phase 17B + Phase 18 shadow-inspection findings
  in seven load-bearing facts;
- carries an explicit **Ready-to-copy comment for issue #70**
  section a human reviewer can paste verbatim;
- restates the explicit non-goals (no Finn / Dixie / Freeside
  runtime wiring, no sibling-repo inspection or fallback, the
  Straylight alias boundary remains private);
- cross-references the canonical Phase 17B + Phase 18 findings
  doc rather than restating its tables.

Phase 19A is **not** authorized to file the comment, edit any
sibling repo, change wedge runtime behavior, change the Hounfour
dependency, or run a fresh `npm run hounfour:shadow-inspect` that
mutates `.run/`. The packet is read-only docs.

## Findings summary (seven load-bearing facts)

The following are **already pinned** by
[`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
and by the Phase 17B + Phase 18 vitest pins under
[`tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts).
Phase 19A does not re-derive them; it summarizes them so the
upstream comment can stand alone.

1. **Package consumption works.** With GitHub Packages auth
   provisioned (user-scoped, out-of-band), `npm install
   @0xhoneyjar/loa-hounfour@^8.5.0` succeeds in this repo. The
   alias module (`src/straylight/hounfour-alias.ts`) imports
   types from `@0xhoneyjar/loa-hounfour/core` (subpath import
   discipline per delta #9), `npm run typecheck` is clean, and
   `npm test` is green.

2. **`@0xhoneyjar/loa-hounfour` resolves within `^8.5.0`.** The
   `package.json` `dependencies` block pins
   `"@0xhoneyjar/loa-hounfour": "^8.5.0"` (the user-authorized
   range, preserved against npm's default `--save` rewrite). The
   currently-resolved patch is in the v8.5.x line; the dependency
   range is the load-bearing pin, the resolved patch is recorded
   in `package-lock.json`.

3. **The 15 net-new v8.5.0 schemas (delta #12) are present in
   v8.5.x.** Each declares a `$id` URI matching
   `/loa-hounfour/8.5.\d+/`. Names asserted by the inspector and
   the test suite: `receipt-detail-level`, `surface-context`,
   `recall-request`, `recall-pack`, `recall-receipt`,
   `forget-record`, `commitment-type`, `commitment-root`,
   `agent-estate-status`, `agent-estate`, `privacy-scope`,
   `risk-level`, `assertion-status`, `assertion-class`,
   `assertion`.

4. **`Challenge` remains absent in v8.5.x as expected (delta #7,
   deferred to v8.6.0).** No `challenge*.schema.json` ships in
   the installed `@0xhoneyjar/loa-hounfour@^8.5.0`. The alias
   module imports no `Challenge` symbol from any subpath. The
   wedge's `challenge` verb and audit chain remain
   Straylight-owned until Hounfour cycle-005 / v8.6.0 ships
   canonical schemas. The Phase 18 inspector records this as a
   structured `cycleFiveDeferrals` entry with `shipsInV85x:
   false`.

5. **`EstateTransition` remains absent in v8.5.x as expected
   (delta #8, deferred to v8.6.0).** No
   `estate-transition*.schema.json` ships in the installed
   `@0xhoneyjar/loa-hounfour@^8.5.0`. The alias module imports
   no `EstateTransition` symbol from any subpath. The wedge's
   `EstateStore.applyTransition`-style transition machinery
   remains Straylight-owned until Hounfour cycle-005 / v8.6.0
   ships canonical schemas. The Phase 18 inspector records this
   as a structured `cycleFiveDeferrals` entry with `shipsInV85x:
   false`.

6. **`audit-event-transition` is classified as
   `DISCOVERY_NOTE` — not `MISSING`, not a blocker.** The Phase
   16 disposition expected an `AuditEvent` schema; v8.5.x ships
   `audit-trail-entry.schema.json` and `domain-event.schema.json`
   instead, but no `audit-event.schema.json`. Phase 18
   introduced the `DISCOVERY_NOTE` disposition (replacing the
   dead Phase 17B `NAME_DRIFT` placeholder), flagged the row
   with `discoveryNote: true` in the inspector's
   `STRAYLIGHT_CANDIDATES`, and pinned `isBlocker: false` in
   `DISPOSITION_TABLE`. The Straylight-local fixture shape is
   unchanged. The resolution path (rename, request a
   Hounfour-side `AuditEvent` schema, or re-classify against
   `audit-trail-entry` / `domain-event`) is a deliberate
   later-phase decision and is **not** filed against the live
   v8.5.x line by this packet.

7. **`safeCanonicalize` subpath selection remains deferred —
   gate `no-confirmed-subpath`.** The installed
   `@0xhoneyjar/loa-hounfour@^8.5.0` exports map declares no
   `./canonicalize` and no `./utilities` subpath. Both are
   confirmed-not-exported by the Phase 18 test suite (which
   reads the installed `package.json` exports map directly,
   not just the docs). The function appears to be re-exported
   through the package root and `./model`, but importing from
   the package root is forbidden by delta #9 and reaching into
   unexported internals is forbidden by the user-facing Phase
   17B / 18 constraint. The alias module imports no
   `safeCanonicalize` from any subpath. The Phase 18 inspector
   records this as a structured `deferredSubpaths` entry with
   `gate: 'no-confirmed-subpath'` and lists
   `@0xhoneyjar/loa-hounfour/canonicalize` and
   `@0xhoneyjar/loa-hounfour/utilities` as the
   confirmed-not-exported subpaths. The resolution path
   (confirm an explicit exported subpath, or file a
   Hounfour-side blocker requesting one) is a later-phase
   decision and is **not** filed against the live v8.5.x line
   by this packet.

## What Phase 19A explicitly does *not* claim

For symmetry with the load-bearing facts above, the following
are **explicitly out of scope** for this packet and remain in
the same state Phase 17B + Phase 18 left them:

- **No Finn / Dixie / Freeside runtime wiring happened.** The
  wedge's stable public API surface
  ([`src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged at the Hounfour boundary; no Hounfour validator
  is wired into any internal call site; no Straylight type is
  renamed to a Hounfour name. The Phase 10 / 12 / 14 sibling-
  repo handoff packets remain docs-only.
- **No sibling-repo inspection, fallback, or fork happened.**
  Phase 17B + Phase 18 read **only** from the locally-installed
  `node_modules/@0xhoneyjar/loa-hounfour/` tree (as a filesystem
  read of installed package contents — JS module-boundary
  subpath discipline is preserved). No clone of `loa-hounfour`,
  `loa-finn`, `loa-dixie`, or `loa-freeside` is consulted; no
  GitHub API call is made; no network read is performed.
- **The Straylight alias boundary remains private.**
  `src/straylight/hounfour-alias.ts` is **not** re-exported from
  `src/straylight/index.ts`. The wedge's public surface
  (the only import path sibling repos are expected to use, per
  [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md))
  is unchanged. The alias module is a forward-looking boundary
  pin, not a runtime wiring.

These three non-claims are pinned by the existing Phase 17B +
Phase 18 boundary-preservation tests; this packet does not
re-prove them, only restates them so the upstream comment can
stand alone.

## Ready-to-copy comment for issue #70

The block below is a copy-ready upstream comment for
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
A human reviewer pastes it verbatim — Phase 19A does **not**
file the comment itself.

```markdown
**Straylight-side shadow-inspection update against `@0xhoneyjar/loa-hounfour@^8.5.0`**  
Phase 17B + Phase 18 results. This is a Straylight-side shadow-inspection / boundary review update only: no Hounfour-side change is requested by this comment, and no Finn / Dixie / Freeside runtime integration is included.

Summary against the v8.5.x line, sourced from the locally-installed package:

- **Package consumption works.** `npm install @0xhoneyjar/loa-hounfour@^8.5.0` succeeds with GitHub Packages auth provisioned out-of-band. Subpath imports from `@0xhoneyjar/loa-hounfour/core` resolve cleanly. `npm run typecheck` is clean and `npm test` is green on the Straylight Phase 17B + 18 branches.
- **`@0xhoneyjar/loa-hounfour` resolves within the user-authorized `^8.5.0` range.** Currently resolved inside the v8.5.x line; the dependency range is the load-bearing pin.
- **The 15 net-new v8.5.0 schemas (delta #12) are present in v8.5.x.** Each declares a `$id` matching `/loa-hounfour/8.5.\d+/`. Names: `receipt-detail-level`, `surface-context`, `recall-request`, `recall-pack`, `recall-receipt`, `forget-record`, `commitment-type`, `commitment-root`, `agent-estate-status`, `agent-estate`, `privacy-scope`, `risk-level`, `assertion-status`, `assertion-class`, `assertion`.
- **`Challenge` remains absent in v8.5.x as expected (delta #7).** Deferred to Hounfour cycle-005 / v8.6.0; the Straylight `challenge` verb stays local until then. No Hounfour-side change requested.
- **`EstateTransition` remains absent in v8.5.x as expected (delta #8).** Deferred to Hounfour cycle-005 / v8.6.0; the Straylight transition machinery stays local until then. No Hounfour-side change requested.
- **`audit-event-transition` → expected `audit-event` is classified as `DISCOVERY_NOTE`, not a blocker.** v8.5.x ships `audit-trail-entry.schema.json` and `domain-event.schema.json` but no `audit-event.schema.json`. Straylight will resolve this on its side in a later phase: rename the local fixture, or re-classify against `audit-trail-entry` / `domain-event`. No Hounfour-side change requested by this comment.
- **`safeCanonicalize` subpath selection remains deferred — gate `no-confirmed-subpath`.** v8.5.x exports map declares no `./canonicalize` and no `./utilities` subpath. The Straylight alias module imports no `safeCanonicalize` from any subpath. If Hounfour intends `safeCanonicalize` to be a public boundary, an explicit exported subpath would close this gate; if Hounfour intends it to remain internal, Straylight will keep the local Phase 0–18 implementation. Either is fine — this comment is informational, not a blocker.

Boundary preservation re-affirmed:

- The Straylight wedge's public API surface (`src/straylight/index.ts`) is unchanged at the Hounfour boundary. The alias module (`src/straylight/hounfour-alias.ts`) is **not** re-exported from `index.ts`; it is a forward-looking boundary pin, not runtime wiring.
- No Finn / Dixie / Freeside runtime is wired by this work.
- No sibling repo (`loa-hounfour`, `loa-finn`, `loa-dixie`, `loa-freeside`) was inspected, cloned, forked, or edited by this work. The inspection reads only the locally-installed `node_modules/@0xhoneyjar/loa-hounfour/` tree.

**No Hounfour-side blockers filed by this update.** All findings above are either confirmations, expected deferrals, or Straylight-side later-phase decisions.

References, Straylight-side in `loa-straylight`:

- `docs/handoffs/hounfour-shadow-integration-findings.md` — Phase 17B + Phase 18 findings.
- `docs/handoffs/hounfour-adaptation-delta.md` — per-delta accepted-with-adaptation table for v8.5.0 final.
- `docs/handoffs/hounfour-rc-shadow-integration-checklist.md` — readiness evidence + Phase 17 dependency-flip checklist.
- `docs/handoffs/hounfour-v850-shadow-review-packet.md` — Phase 19A upstream-review summary.
- `tests/hounfour-shadow-integration.test.ts` — Phase 17B + Phase 18 vitest pins backing the facts above.
```

## What this packet is *not*

- **Not** a Hounfour-side change request. Every "deferred" /
  "discovery note" item above is a Straylight-side later-phase
  decision unless explicitly marked otherwise (it is not).
- **Not** Hounfour integration. The wedge's public surface is
  unchanged; the alias module is not re-exported; no Hounfour
  validator is wired into any wedge call site.
- **Not** authorization to file the comment. Phase 19A produces
  the copy-ready text only; the human reviewer files it
  upstream under teammate review per
  [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).
- **Not** a license to wire Finn / Dixie / Freeside, edit any
  sibling repo, implement `Challenge` or `EstateTransition`,
  reach into unexported Hounfour internals, change the Hounfour
  dependency, or change wedge runtime behavior.
- **Not** a re-derivation of the Phase 17B + Phase 18 evidence.
  The canonical evidence lives in
  [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  and the Phase 17B + Phase 18 vitest pins.

## Cross-references

- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  — Phase 17B + Phase 18 working-tree findings (the source of
  truth for every fact in this packet).
- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — per-delta accepted-with-adaptation table for v8.5.0 final.
- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — Jani's response and the post-intake upstream update.
- [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  — readiness evidence + Phase 17 dependency-flip checklist.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index, updated in Phase 19A to
  point at this packet.
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 19A to point at this packet.
- [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  — the Hounfour-side filed issue this packet's comment block
  is staged for.
