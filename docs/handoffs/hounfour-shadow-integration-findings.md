# Hounfour v8.5.0 shadow-integration findings (Phase 17)

> Status: Phase 17. **Shadow-integration access probe only, in
> `loa-straylight`.** This document records the result of the
> first Phase 17 attempt to consume
> `@0xhoneyjar/loa-hounfour@^8.5.0` from a clean `loa-straylight`
> checkout. The probe **did not** install the package, **did not**
> add the dependency to `package.json`, **did not** add an alias /
> re-export module, and **did not** change Phase 0–16 runtime
> behavior. The only file added to the working tree by Phase 17
> on this attempt is a project-scoped `.npmrc` that maps the
> `@0xhoneyjar` scope to GitHub Packages (no auth token).
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

## What this attempt actually did

This attempt performed steps 1–2 of the Phase 17 sequence
described in the file plan and **stopped at the access gate**
because the gate did not open. The recorded steps are:

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

## Schema-availability comparison: deferred

The originally-planned schema-availability comparison table —
12 Straylight schema candidates × Hounfour `$id` surface ×
MATCH / EXTEND / FOLD / MISSING / DEFERRED — is **deferred to
the follow-up Phase 17 attempt** that runs after auth is
provisioned. It cannot be filled in from local state alone:
every cell in the MATCH / EXTEND / FOLD column requires reading
Hounfour's actually-shipped JSON Schema bytes, which only the
installed package can provide.

What this attempt **can** record from local state alone (without
installing the package) is the *expected* shape of that table,
re-derived from the Phase 16 adaptation-delta doc so a future
reviewer of the follow-up attempt does not have to re-read the
delta doc to know what the inspector is supposed to confirm.

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
inspector. It is **not** evidence of integration — every "REUSE"
/ "EXTEND" / "FOLD" cell will be confirmed or refuted only when
the inspector actually reads the Hounfour package contents.

## Boundary preservation

Phase 17 (this attempt) preserves the Straylight alias /
re-export boundary by **not** modifying `src/straylight/index.ts`.
The wedge's stable public API surface (the only import path
sibling repos are expected to use, per
[`docs/mvp/package-boundary.md`](../mvp/package-boundary.md))
remains Phase 0–16's surface. No Hounfour name leaks into
`src/straylight/index.ts` on this attempt; no Hounfour validator
is wired into any internal call site; no Straylight type is
renamed to a Hounfour name.

The follow-up Phase 17 attempt (after auth is provisioned) will
add `src/straylight/hounfour-alias.ts` as a **separate** module
that is not re-exported from `src/straylight/index.ts`. The
alias module is the only place where Hounfour names appear; the
wedge's call sites import from the alias module, not from
`@0xhoneyjar/loa-hounfour` directly (delta #3 + delta #9).

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

None on this attempt.

The 401 access-gate failure is an **operator-side** gate (auth
provisioning), not a Hounfour-side blocker. There is no
reproducible vector or fixture to file against the live
`@0xhoneyjar/loa-hounfour@8.5.0` package on the basis of a
401 from an unauthenticated install attempt. Per the rules in
[`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
§11, a Hounfour-side blocker is only "filed" when a reproducible
vector or fixture surfaces — which requires the package to
install first.

If the follow-up Phase 17 attempt surfaces validator failures,
hash divergences, cap-behavior failures, EXTEND ambiguities, or
constraint-ID collapses, those become blockers on the live
v8.5.0 package per checklist rule 11 (reframed). This attempt
records none.

## Next-step gate

The next Phase 17 attempt requires **GitHub Packages auth for
the `@0xhoneyjar` scope** to be provisioned at the user level
(not the project level). Once provisioned:

1. Re-run `npm install @0xhoneyjar/loa-hounfour@^8.5.0 --save`
   from the Phase 17 branch root. The project-scoped `.npmrc`
   added on this attempt already points the scope at GitHub
   Packages, so no further `.npmrc` edit is required.
2. If the install succeeds, proceed with the file plan that this
   attempt deferred:
   - `src/straylight/hounfour-alias.ts` — type-only alias / re-
     export module, subpath imports only, aliases `AgentIdentity`
     as `Actor`, excludes `Challenge` / `EstateTransition`, not
     re-exported from `src/straylight/index.ts`.
   - `scripts/inspect-hounfour-shadow.lib.ts` +
     `scripts/inspect-hounfour-shadow.ts` — pure inspection of
     the Hounfour `$id` surface, classifies each Straylight
     schema candidate as MATCH / EXTEND / FOLD / MISSING /
     DEFERRED, emits `.run/hounfour-shadow-report.json`.
   - `tests/hounfour-shadow-integration.test.ts` — vitest test
     pinning the alias module's import discipline, the deferral
     of `Challenge` / `EstateTransition`, and the presence of
     the 15 net-new v8.5.0-rc.1 schemas (delta #12).
   - `package.json` — add the dependency and one
     `hounfour:shadow-inspect` script.
   - `package-lock.json` — regenerated by `npm install`.
3. Update this findings doc in place with the actual inspector
   output (a real schema-availability table replacing the
   *expected* one above) and any blockers surfaced.
4. Stop. The follow-up attempt also does not commit and does not
   open a PR — Phase 17 deliverables are working-tree findings
   only.

The auth provisioning itself is **out of scope** for Phase 17.
It belongs to whoever owns the `@0xhoneyjar` org's GitHub
Packages access list. This doc records the gate; it does not
move the gate.

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
