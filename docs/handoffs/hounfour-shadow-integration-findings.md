# Hounfour v8.5.0 shadow-integration findings (Phase 17)

> Status: Phase 17, in two attempts (17A access probe, 17B
> alias/inspector/tests). **Shadow-integration working-tree
> findings only, in `loa-straylight`.** This document records both
> attempts:
>
> - **Phase 17A** wrote a project-scoped `.npmrc` mapping the
>   `@0xhoneyjar` scope to GitHub Packages and stopped at the
>   401 access gate. No package installed, no source / fixture /
>   doc / test mutated.
> - **Phase 17B** -- the current state of this branch -- ran the
>   install with auth provisioned (out-of-band, user-scoped),
>   added a type-only alias / re-export module, a pure inspector
>   (library + CLI + npm script), and a vitest test pinning the
>   Phase 17B contract. The install resolved
>   `@0xhoneyjar/loa-hounfour@8.5.2` (within the user-authorized
>   `^8.5.0` range). The 15 net-new v8.5.0 schemas (delta #12) all
>   ship with `$id`s under `/loa-hounfour/8.5.2/`; the deferral of
>   `Challenge` and `EstateTransition` (deltas #7 / #8) is honored
>   by the actually-shipped surface; the wedge's public API
>   (`src/straylight/index.ts`) is unchanged. No blockers surfaced.
>   One name-drift finding recorded: `audit-event-transition.json`
>   expected `audit-event` but no schema with that stem ships in
>   v8.5.2 -- the inspector treats this as a discovery note, not a
>   blocker.
>
> Phase 17B does **not** wire Finn / Dixie / Freeside runtime,
> does **not** edit any sibling repo, does **not** implement
> `Challenge` or `EstateTransition`, does **not** replace
> Straylight semantics with Hounfour semantics, does **not** edit
> `.loa/` or `.claude/`, does **not** commit, and does **not**
> open a PR.
>
> Companion docs:
> [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
> (the readiness evidence + Phase 17 dependency-flip checklist),
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
> (the per-delta accepted-with-adaptation table updated for
> v8.5.0 final), and
> [`hounfour-response-intake.md`](./hounfour-response-intake.md)
> (Jani's response and the post-intake upstream update).

## What "Phase 17" is, restated

Per the
[shadow-integration / dependency-flip checklist](./hounfour-rc-shadow-integration-checklist.md),
Phase 17 is the **separate follow-up PR** whose scope is exactly:

- attempt the dependency flip to `@0xhoneyjar/loa-hounfour@^8.5.0`;
- if access works, add a Straylight-side alias / re-export module
  (delta #3) using subpath imports (delta #9), aliasing
  `AgentIdentity` as `Actor` (delta #10), and excluding `Challenge`
  / `EstateTransition` (deltas #7 / #8);
- if access works, run a small inspector that compares Hounfour
  v8.5.0's published `$id` surface against Straylight's local
  schema candidates and conformance vectors;
- record match / mismatch findings;
- file any blockers against the live `@0xhoneyjar/loa-hounfour@8.5.0`
  package per checklist rule 11.

Phase 17 is **not** authorized to wire Finn / Dixie / Freeside
runtime, edit any sibling repo, implement `Challenge` /
`EstateTransition`, replace Straylight semantics with Hounfour
semantics, or perform broad refactors. It is also not authorized
to commit or open a PR — Phase 17 produces in-repo working-tree
findings only, scoped to the dependency-flip check.

## Phase 17A: access probe (historical)

Phase 17A performed steps 1-2 of the Phase 17 sequence described
in the file plan and **stopped at the access gate** because the
gate did not open. The recorded steps are:

1. Wrote a project-scoped `.npmrc` containing one line:
   ```
   @0xhoneyjar:registry=https://npm.pkg.github.com
   ```
   No `_authToken`, no `always-auth`, no other config. Auth is
   user-scoped (`~/.npmrc`) by convention; project `.npmrc` is
   intentionally registry-only so it can be checked in safely.
2. Ran `npm install @0xhoneyjar/loa-hounfour@^8.5.0 --save`
   against the now-mapped `@0xhoneyjar` scope.

The install **failed** with HTTP **401 Unauthorized** at
`GET https://npm.pkg.github.com/@0xhoneyjar%2floa-hounfour`
(reason class: `authentication token not provided`). No mutation
to `package.json`, `package-lock.json`, `node_modules/`, or any
Straylight source / fixture / doc was performed by the failed
install. `git status` after the failure showed only the new
`.npmrc` as untracked.

Because the package did not install, the attempt **did not**:

- add `@0xhoneyjar/loa-hounfour` to `package.json`;
- regenerate `package-lock.json`;
- add `src/straylight/hounfour-alias.ts` (the alias / re-export
  module described in delta #3) — adding a module that
  `import type`s from an unresolvable subpath would break
  `tsc --noEmit` and `vitest run`, which the user-facing rule for
  Phase 17 forbids;
- add `scripts/inspect-hounfour-shadow.ts` (the inspector) — same
  reasoning;
- add `tests/hounfour-shadow-integration.test.ts` (the
  shadow-integration test) — same reasoning.

The single working-tree change from this Phase 17 attempt is the
new `.npmrc`. It is registry-only and contains no secret. It is
safe to keep on the Phase 17 branch as it stands — once auth is
provisioned (see "Next-step gate" below), the same `.npmrc`
allows the install to proceed without further edits.

## Phase 17B: alias module, inspector, and tests landed

With GitHub Packages auth for the `@0xhoneyjar` scope provisioned
out-of-band (user-scoped), Phase 17B ran the install and added
the working-tree scaffolding the Phase 17A "Next-step gate"
section had deferred. The recorded steps are:

1. Ran
   `npm install @0xhoneyjar/loa-hounfour@^8.5.0 --save --ignore-scripts`.
   The install **succeeded** (added 6 packages: Hounfour and 5
   transitive deps). `package.json` and `package-lock.json` were
   regenerated by the install. The `package.json` `dependencies`
   block was hand-edited back to `"^8.5.0"` to preserve the
   user-authorized range (npm's default `--save` rewrote it to
   `"^8.5.2"`).
2. **Intended dependency range:** `^8.5.0`.
   **Currently resolved package:** `@0xhoneyjar/loa-hounfour@8.5.2`
   (per `node_modules/@0xhoneyjar/loa-hounfour/package.json`).
   `package-lock.json` is the source of truth for the resolved
   patch on this branch; the dependency range is intentionally
   unaffected by the patch resolution.
3. Inspected the installed package's `exports` map. Named JS
   subpaths exported by v8.5.2: `./core`, `./economy`, `./model`,
   `./governance`, `./constraints`, `./integrity`, `./graph`,
   `./composition`, `./commons`, `./vectors`. A wildcard
   `./schemas/*` exposes raw JSON schema files. **There is no
   `./canonicalize` or `./utilities` subpath**; selecting a
   subpath for `safeCanonicalize` is therefore deferred for Phase
   17B (delta #6 work moves to a later phase).
4. Added `src/straylight/hounfour-alias.ts` -- a type-only alias
   / re-export boundary module. Imports from
   `@0xhoneyjar/loa-hounfour/core` (the only subpath Phase 17B
   actually consumes), aliases `AgentIdentity` as `Actor` (delta
   #10), re-exports `CapabilityScope` (delta #4), and explicitly
   does **not** import or re-export `Challenge` or
   `EstateTransition` (deltas #7 / #8). The alias module is **not**
   re-exported from `src/straylight/index.ts` -- the wedge's
   public surface is unchanged.
5. Added `scripts/inspect-hounfour-shadow.lib.ts` and
   `scripts/inspect-hounfour-shadow.ts` -- a pure inspector
   library plus a thin CLI. The inspector reads schema bytes via
   `node:fs` from `node_modules/@0xhoneyjar/loa-hounfour/schemas/`
   (a filesystem read of installed package contents, not a JS
   package-root import; subpath discipline at the JS module
   boundary preserved). It classifies the 12 Straylight schema
   candidates as MATCH / EXTEND / FOLD / MISSING / DEFERRED /
   NAME_DRIFT, asserts presence of the 15 net-new v8.5.0 schemas,
   asserts absence of `Challenge` / `EstateTransition`, and
   writes a JSON report to `.run/hounfour-shadow-report.json`.
6. Added `tests/hounfour-shadow-integration.test.ts` -- 63
   vitest assertions pinning the Phase 17B contract: dependency
   pin range, resolved 8.5.x version, alias-module subpath
   discipline, alias-module deferral of `Challenge` /
   `EstateTransition` / `safeCanonicalize`, boundary preservation
   of `src/straylight/index.ts`, presence of all 15 net-new
   schemas with `$id`s matching `/loa-hounfour/8.5.\d+/`, and
   absence of any inspector-surfaced blocker.
7. Added `"hounfour:shadow-inspect": "vite-node scripts/inspect-hounfour-shadow.ts"`
   to `package.json` `scripts`.

Phase 17B verified the working tree by running `npm run typecheck`
(clean) and `npm test` (595 tests, all green), and ran
`npm run hounfour:shadow-inspect` to capture the actual
schema-availability table recorded below.

## Schema-availability comparison

The Phase 17A *expected* table is preserved below as historical
reference; the Phase 17B inspector output follows it as the
authoritative actual-shipped record against
`@0xhoneyjar/loa-hounfour@8.5.2`.

### Phase 17A expected table (historical, derived from Phase 16 deltas)

The originally-planned schema-availability comparison table --
12 Straylight schema candidates x Hounfour `$id` surface x
MATCH / EXTEND / FOLD / MISSING / DEFERRED -- was **deferred** by
Phase 17A because the package did not install. The expected
shape of that table, re-derived from the Phase 16 adaptation-
delta doc:

| Local Straylight schema candidate (file under `fixtures/schema-candidates/`) | Expected Hounfour `$id` (v8.5.0, bare PascalCase per delta #2) | Expected disposition (per Jani's response, summarized in `hounfour-response-intake.md`) | Notes |
|---|---|---|---|
| `actor.json` | `AgentIdentity` (aliased as `Actor` at the boundary per delta #10) | REUSE | Cross-version transitive risk — alias must be applied at the alias module per delta #10. |
| `estate.json` | `AgentEstate` (with `AgentEstateStatus`) | REUSE / EXTEND | One of the 5 forget/commit/estate net-new schemas (delta #12). |
| `keyring.json` | `Keyring` | REUSE | — |
| `assertion-observation.json` | `Assertion` (with `AssertionStatus` discriminator) | REUSE | One of the 5 assertion-family net-new schemas (delta #12). |
| `assertion-reflection-contested.json` | `Assertion` (`status: "contested"`) | REUSE | Same `Assertion` schema, different status. |
| `assertion-revoked.json` | `Assertion` (`status: "revoked"`) | REUSE | Same `Assertion` schema, different status. |
| (no separate `candidate-assertion.json` fixture — see notes column) | `Assertion` (`status: "candidate"`) | FOLD | Per delta #12 / intake doc: `CandidateAssertion` was folded into `Assertion` with `status: "candidate"`; there is no separate `CandidateAssertion` schema. Any future Straylight fixture for the candidate state must validate against `Assertion`, not against a separate name. |
| `recall-request-public-discord.json` | `RecallRequest` | REUSE | Recall-machinery family (delta #12). |
| `recall-pack-public-discord.json` | `RecallPack` | REUSE | Recall-machinery family (delta #12). |
| `recall-receipt-public-discord.json` | `RecallReceipt` (with `ReceiptDetailLevel`, `SurfaceContext`) | REUSE | Recall-machinery family (delta #12). |
| `audit-event-transition.json` | `AuditEvent` | REUSE | — |
| `policy-decision-denied.json` | (Straylight-local) | DEFERRED / not in v8.5.0 | Policy-decision shape stays Straylight-local for now; not part of the v8.5.0 line per Phase 16 disposition. |
| `commitment-root.json` | `CommitmentRoot` (with `CommitmentType`) | REUSE | Forget/commit/estate family (delta #12). |
| (no fixture — Challenge stays local) | (intentionally absent) | DEFERRED to v8.6.0 | Per delta #7. The follow-up attempt must assert v8.5.0 carries no `Challenge` schema. |
| (no fixture — EstateTransition stays local) | (intentionally absent) | DEFERRED to v8.6.0 | Per delta #8. The follow-up attempt must assert v8.5.0 carries no `EstateTransition` schema. |
| `forget-record.json` (not yet exported as a candidate) | `ForgetRecord` (4-variant) | EXTEND | Per delta #5: Straylight emits one variant; the other three are net-new at the Hounfour boundary. The follow-up attempt must validate the wedge's emitted shape against the **specific** matching variant, not against the union. |

This table is the *target* for the follow-up Phase 17 attempt's
inspector. It is **not** evidence of integration -- every "REUSE"
/ "EXTEND" / "FOLD" cell will be confirmed or refuted only when
the inspector actually reads the Hounfour package contents.

### Phase 17B actual inspector output (against @0xhoneyjar/loa-hounfour@8.5.2)

The Phase 17B inspector ran against the installed package and
produced the following classification (also written to
`.run/hounfour-shadow-report.json`):

| Local Straylight schema candidate | Expected Hounfour stem | Observed disposition | Hounfour `$id` |
|---|---|---|---|
| `actor.json` | `agent-identity` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/agent-identity` |
| `estate.json` | `agent-estate` | EXTEND | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/agent-estate` |
| `keyring.json` | `keyring` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/keyring` |
| `assertion-observation.json` | `assertion` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/assertion` |
| `assertion-reflection-contested.json` | `assertion` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/assertion` |
| `assertion-revoked.json` | `assertion` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/assertion` |
| `recall-request-public-discord.json` | `recall-request` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/recall-request` |
| `recall-pack-public-discord.json` | `recall-pack` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/recall-pack` |
| `recall-receipt-public-discord.json` | `recall-receipt` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/recall-receipt` |
| `audit-event-transition.json` | `audit-event` | **MISSING (name-drift)** | (no `audit-event.schema.json` ships in v8.5.2) |
| `policy-decision-denied.json` | (none) | DEFERRED | (Straylight-local; not part of v8.5.x) |
| `commitment-root.json` | `commitment-root` | MATCH | `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.2/commitment-root` |

All 15 net-new v8.5.0 schemas (delta #12) are present in v8.5.2:
`receipt-detail-level`, `surface-context`, `recall-request`,
`recall-pack`, `recall-receipt`, `forget-record`,
`commitment-type`, `commitment-root`, `agent-estate-status`,
`agent-estate`, `privacy-scope`, `risk-level`,
`assertion-status`, `assertion-class`, `assertion`. Each declares
a `$id` URI matching `/loa-hounfour/8.5.\d+/`.

The deferral of `Challenge` and `EstateTransition` (deltas #7 /
#8) is honored by the actually-shipped surface: no
`challenge*.schema.json` and no `estate-transition*.schema.json`
ship in v8.5.2. The deltas hold against runtime evidence, not
just docs.

#### Findings (notes, not blockers)

- **`audit-event-transition.json` -> `audit-event` name drift.**
  The Phase 16 intake doc treated `AuditEvent` as REUSE, but
  v8.5.2 does not ship `audit-event.schema.json`. The closest
  shipping schemas are `audit-trail-entry.schema.json` and
  `domain-event.schema.json`. The inspector records this as a
  discovery note, not a blocker -- the wedge's local
  `audit-event-transition` shape is unchanged in Phase 17B; a
  later phase will either (a) confirm the rename, (b) request a
  Hounfour-side `AuditEvent` schema, or (c) re-classify the
  Straylight fixture against the actually-shipping name.
- **`safeCanonicalize` subpath selection is deferred.** v8.5.x
  exports map declares no `./canonicalize` or `./utilities`
  subpath. The function appears in `dist/utilities/` and seems
  to be re-exported through the package root and `./model`, but
  Phase 17B does not pin a subpath. Importing from the package
  root is forbidden (delta #9); reaching into unexported
  internals is forbidden by the user-facing Phase 17B
  constraint. Resolution moves to a later phase that can either
  confirm an explicit exported subpath or file a Hounfour-side
  blocker requesting one.

## Boundary preservation

Phase 17A and Phase 17B both preserve the Straylight alias /
re-export boundary by **not** modifying `src/straylight/index.ts`.
The wedge's stable public API surface (the only import path
sibling repos are expected to use, per
[`docs/mvp/package-boundary.md`](../mvp/package-boundary.md))
remains Phase 0-16's surface. No Hounfour name leaks into
`src/straylight/index.ts` on either attempt; no Hounfour validator
is wired into any internal call site; no Straylight type is
renamed to a Hounfour name.

Phase 17B added `src/straylight/hounfour-alias.ts` as a
**separate** module that is not re-exported from
`src/straylight/index.ts`. The alias module is the only place
where Hounfour names appear at the JS module boundary; the
wedge's call sites do **not** import from the alias module on
this PR (the alias module is a forward-looking boundary pin, not
a runtime wiring). The boundary-preservation contract is locked
in by `tests/hounfour-shadow-integration.test.ts`, which fails if
any Hounfour name leaks into `src/straylight/index.ts` or if the
alias module is re-exported from the wedge's public surface.

## `Challenge` / `EstateTransition`: deferred (deltas #7 / #8)

Phase 17 (this attempt) preserves the deferral of `Challenge`
and `EstateTransition` to Hounfour cycle-005 / v8.6.0. The
working tree contains no Hounfour-side `Challenge` or
`EstateTransition` import, no alias for either name, no
validator hookup for either name, and no fixture migration for
either name. The wedge's existing `challenge` verb,
`EstateStore.applyTransition`-style transition machinery, and
the audit-chain entries that follow from each remain
Straylight-owned.

If the follow-up Phase 17 attempt's inspector observes that
v8.5.0 ships a `Challenge` or `EstateTransition` schema, this
does **not** authorize Straylight to validate against it: the
deferral is a Straylight-side constraint until cycle-005 / v8.6.0
ships, not a Hounfour-side capability question.

## Blockers filed

**None on either attempt.**

Phase 17A: the 401 access-gate failure was an **operator-side**
gate (auth provisioning), not a Hounfour-side blocker. There was
no reproducible vector or fixture to file against the live
package on the basis of a 401 from an unauthenticated install.
Per the rules in
[`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
section 11, a Hounfour-side blocker is only "filed" when a
reproducible vector or fixture surfaces -- which requires the
package to install first.

Phase 17B: the inspector classified all 12 Straylight schema
candidates without surfacing a validator failure, hash
divergence, cap-behavior failure, EXTEND ambiguity, or
constraint-ID collapse. The single `audit-event-transition.json`
name-drift is recorded as a **note** (discovery finding), not a
blocker -- the local Straylight shape is unchanged, no fixture
or vector breaks because of it, and the resolution path is a
deliberate later-phase decision. Per checklist rule 11
(reframed), this does not meet the bar for filing against
`@0xhoneyjar/loa-hounfour@8.5.x`.

If a later phase surfaces a real validator failure, hash
divergence, cap-behavior failure, EXTEND ambiguity, or
constraint-ID collapse against v8.5.x, those become blockers on
the live package per checklist rule 11 (reframed).

## Next-step gate (consumed by Phase 17B)

The Phase 17A "next-step gate" required **GitHub Packages auth
for the `@0xhoneyjar` scope** to be provisioned at the user
level. That provisioning happened out-of-band, and Phase 17B
consumed the gate in this branch:

1. [done] Re-ran `npm install @0xhoneyjar/loa-hounfour@^8.5.0 --save
   --ignore-scripts`. The install succeeded.
2. [done] Added `src/straylight/hounfour-alias.ts` -- type-only
   alias / re-export module, subpath imports only (from
   `@0xhoneyjar/loa-hounfour/core`), aliases `AgentIdentity` as
   `Actor`, excludes `Challenge` / `EstateTransition`, not
   re-exported from `src/straylight/index.ts`.
3. [done] Added `scripts/inspect-hounfour-shadow.lib.ts` and
   `scripts/inspect-hounfour-shadow.ts` -- pure inspector +
   thin CLI, classifies each Straylight schema candidate, emits
   `.run/hounfour-shadow-report.json`.
4. [done] Added `tests/hounfour-shadow-integration.test.ts` --
   vitest test pinning the Phase 17B contract.
5. [done] Added `hounfour:shadow-inspect` npm script.
6. [done] Updated this findings doc in place with the actual
   inspector output (the Phase 17B table above).
7. [done] Stopped. Phase 17B does not commit and does not open a
   PR.

Recommended next phase (out of scope for Phase 17B):

- Decide the resolution for the `audit-event-transition.json`
  name-drift finding (rename the Straylight fixture, request a
  Hounfour-side `AuditEvent` schema, or re-classify against
  `audit-trail-entry` / `domain-event`).
- Confirm the explicit exported subpath for `safeCanonicalize`,
  or file a Hounfour-side blocker requesting a `./canonicalize`
  or `./utilities` subpath. Until that decision is made, the
  alias module does not import the function.
- Decide whether `src/straylight/index.ts` should re-export the
  alias module (or whether the wedge should keep its public
  surface unchanged and consume the alias module only at
  internal call sites). Phase 17B defers this decision.

## Out-of-scope for this Phase 17 attempt

The following remain explicitly out of scope, both on this
attempt and on the follow-up attempt that runs after auth is
provisioned:

- wiring Finn runtime;
- wiring Dixie runtime;
- wiring Freeside runtime;
- editing any sibling repo;
- implementing `Challenge` (deferred to v8.6.0 per delta #7);
- implementing `EstateTransition` (deferred to v8.6.0 per delta
  #8);
- replacing Straylight semantics with Hounfour semantics (the
  wedge is the source of truth for primitive semantics until a
  later, separately-planned migration phase);
- broad refactors (Phase 17 is the dependency-flip check, not a
  code reorganization);
- editing `.loa/` or `.claude/` (framework-internal, not Phase 17
  scope);
- committing this branch;
- opening a PR.

## Cross-references

- [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  — the readiness evidence + Phase 17 dependency-flip checklist
  this attempt consumes.
- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — the per-delta accepted-with-adaptation table (deltas #1–#15)
  this attempt's expected-disposition table is derived from.
- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — Jani's response, disposition counts, and the post-intake
  upstream update recording rc.1 fired and v8.5.0 final shipped.
- [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — the original Phase 9 handoff (the input that Jani's response
  adapts).
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — the cross-repo coordination index, updated in this attempt
  to point at this findings doc.
- [`docs/schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
  — the conformance-vector contract the follow-up Phase 17
  attempt's inspector validates against.
- [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  — the Hounfour-side filed issue that backs the v8.5.0 line.
