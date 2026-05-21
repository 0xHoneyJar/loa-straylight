# Phase 28D — Hounfour v8.7.0 release evidence

> **Status:** Operator-oriented evidence handoff. **Docs-only.**
> Phase 28D records that the Hounfour-side release / vector-
> access blocker pinned by Phase 28C
> ([`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md))
> is **resolved**. Phase 28D **does not authorize** any
> Straylight code change, any Hounfour dependency bump, any
> vendoring, any `loa-hounfour`-`origin/main` / local-tarball
> resolution, any ADR-022E gate firing, any sibling-repo edit,
> or any tag / release / publish on the Straylight side.
> Canonical record:
> [`../decisions/ADR-027B-VectorAccess-release-unblocked.md`](../decisions/ADR-027B-VectorAccess-release-unblocked.md).

## TL;DR (≤ 1 minute)

- Hounfour v8.7.0 is **published, tagged, and registry-
  resolvable**.
- The recall-wedge composition-substrate corpus (five
  conformance vectors + recall-wedge `README.md` + envelope
  schema) is **inside the v8.7.0 tarball** at the standard npm
  install paths.
- The Phase 28C BLOCKED disposition flips to **release-
  evidence-met**.
- The future Track 1 code PR remains **not yet authorized**:
  one of two preconditions (release / vector-access) is now
  met; the other (§4.d pre-merge real 3-model Flatline +
  Bridgebuilder) **remains independently unsatisfied until
  real 3-model Flatline + Bridgebuilder evidence is run
  against the successor Straylight scope/PR**. The local
  review substrate has been smoke-tested usable (3-model
  Flatline live smoke passed; Bridgebuilder 3-provider
  dry-run wiring passed); the smoke tests do not satisfy
  §4.d for any future implementation PR.
- The next first-class code-candidate **plan/PR scope** for
  Track 1 may be drafted as a separate, future, docs-only
  event under its own §4.d gate. The corresponding
  **implementation PR** is a second future event after that.
- ADR-022E gates #1, #2, #3, #4, #5, #17, #18 all remain
  **HELD**. The class-vs-policy boundary is preserved.

## What Phase 28D records

### 1. The Hounfour-side release event

`loa-hounfour` issue #70 release comment:

> <https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4507326260>

This is the Hounfour-side answer to the Phase 28C draft
request
([`./phase-28c-hounfour-release-request.md`](./phase-28c-hounfour-release-request.md)).

### 2. The release evidence

| # | Probe | Result |
|---|---|---|
| A | Package published | `@0xhoneyjar/loa-hounfour@8.7.0` |
| B | Git tag | `loa-hounfour` `v8.7.0` |
| C | `npm view @0xhoneyjar/loa-hounfour versions --registry=https://npm.pkg.github.com` | List **includes** `8.7.0` |
| D | `npm view @0xhoneyjar/loa-hounfour@8.7.0 dist.tarball --registry=https://npm.pkg.github.com` | **Non-404** tarball URL |
| E | Tarball contents (extracted under `node_modules/@0xhoneyjar/loa-hounfour/`) | Contains all of: `package/vectors/conformance/recall-wedge/assertion-admitted.json`, `package/vectors/conformance/recall-wedge/commitment-root.json`, `package/vectors/conformance/recall-wedge/recall-pack.json`, `package/vectors/conformance/recall-wedge/recall-receipt.json`, `package/vectors/conformance/recall-wedge/recall-request.json`, `package/vectors/conformance/recall-wedge/README.md`, `package/schemas/conformance-vector.schema.json` |
| F | Tarball SHA-256 | `8c116f205e1ae1771c89b5c455cd0dd3a5c62160962bb3c8e9a4ae6bb50d22f7` |

The tarball SHA-256 is recorded as the **observed identity at
Phase 28D evidence-collection time**. Any future Track 1
implementation PR that pins to v8.7.0 must verify the
registry-resolved tarball hash at that PR's install-and-pin
step; divergence is itself a §4.d audit input, not a Phase 28D
authorization failure.

### 3. The block / unblock disposition

Per
[`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md)
§"Decision" §3 / §5 and
[`../decisions/ADR-027B-PrivateAlias-successor-plan.md`](../decisions/ADR-027B-PrivateAlias-successor-plan.md)
§"Decision" §8.b:

- The release / vector-access precondition for the future
  Track 1 code PR is **MET** under §8.b branch (i).
- The §3 BLOCKED disposition flips to **release-evidence-met**.
- Branch (ii) (vendoring) remains a separate first-class event
  with its own §4.d evidence; it is **not** authorized by
  Phase 28D.
- The future Track 1 code PR's **§4.d pre-merge real 3-model
  Flatline + Bridgebuilder gate remains independently
  unsatisfied until real 3-model Flatline + Bridgebuilder
  evidence is run against the successor Straylight scope/PR**.
  The local review substrate has been smoke-tested usable
  (3-model Flatline live smoke passed; Bridgebuilder 3-provider
  dry-run wiring passed) — the machinery itself is no longer
  the blocker — but the smoke tests do **not** satisfy §4.d for
  any future implementation PR; §4.d is satisfied only by a
  real run against the successor's actual scope.
- Two preconditions exist; one is now met; the other is
  independently unmet. **Both must be true** before any
  Straylight code change is authorized.

### 4. ADR-022E gates

| Gate | Trigger (verbatim spirit) | Phase 28D | Disposition |
|---|---|---|---|
| #1 | Canonical `estate-transition.schema.json` + adopting ADR | Not shipped; not adopted | **HELD** |
| #2 | Local `EstateTransition` type / schema / fixture | Not authorized | **HELD** |
| #3 | New JS subpath (`./canonicalize` / `./utilities`) | Not introduced by v8.7.0 | **HELD** |
| #4 | `Challenge` adopted into wedge public surface | Not authorized | **HELD** |
| #5 | `AuditEvent` adopted from Hounfour candidate | Not authorized | **HELD** |
| #17 | New Hounfour subpath consumption with separate ADR | Existing `@0xhoneyjar/loa-hounfour/core` posture unchanged | **HELD** |
| #18 | Hounfour-named symbol on wedge public surface | Not authorized | **HELD** |

The v8.7.0 release ships **composition substrate**, not shape
adoption. ADR-027B-Fire's §"Decision" §4.a substrate
disposition (`READY-AS-COMPOSITION-SUBSTRATE; PENDING-AS-SHAPE-
ADOPTION`) is narrowed only on the **release-accessibility**
dimension of the composition-substrate half: the substrate is
now resolvable from the registry rather than from `origin/main`.

### 5. Class-vs-policy boundary preservation

**Hounfour provides** class / schema / conformance-vector
artifacts: the recall-wedge conformance-vector corpus, the
recall-wedge `README.md`, and the
`schemas/conformance-vector.schema.json` envelope.

**Straylight still owns** policy, signer competence, signature
verification, audit-chain execution (including the soft-audit-
prefix policy on `0xhoneyjar:straylight:`), estate transitions,
recall runtime, and authorization.

The v8.7.0 release does **not** transfer any policy /
competence / verification / execution / authorization primitive
across the boundary by being published. The recall-wedge
conformance vectors are **test inputs**, not production
fixtures, not signed artifacts, not hash-verified at install
time, and not runtime authorities.

## What Phase 28D explicitly does **not** authorize

Reviewers may cite this section verbatim to refuse an in-repo
or sibling-repo PR that exceeds the Phase 28D scope:

- **Not** Straylight code (no test, no fixture, no source, no
  package, no script, no generated tree, no public surface,
  no runtime allowlist edit).
- **Not** vendoring of any Hounfour artifact (vectors,
  envelope schema, architecture doc) into the Straylight tree.
  Vendoring requires a separate first-class successor ADR with
  its own §4.d evidence; Phase 28D does **not** propose one and
  does **not** pre-approve one.
- **Not** any `loa-hounfour`-`origin/main` resolution path,
  local-tarball / `file:` resolution, `git+https://`-style
  Hounfour resolution, or any non-registry resolution. Future
  consumption is **registry-resolution only**, against
  `https://npm.pkg.github.com`.
- **Not** a manifest edit. [`../../package.json`](../../package.json)
  and [`../../package-lock.json`](../../package-lock.json) are
  **unchanged** by Phase 28D. The next code candidate **may**
  pin or update the existing `@0xhoneyjar/loa-hounfour`
  dependency declaration to `8.7.0` (or confirm a no-delta
  posture against the actual package state at the time of that
  PR), but **only as a separate implementation PR with its own
  §4.d gate**. No range widening is permitted.
- **Not** any ADR-022E gate firing. #1, #2, #3, #4, #5, #17,
  #18 all remain HELD.
- **Not** Hounfour shape adoption beyond composition / vector-
  access evidence. The v8.7.0 release is composition-substrate-
  only.
- **Not** §4.d satisfaction. The future Track 1 successor
  plan/PR and the future Track 1 implementation PR each inherit
  §4.d on their own; Phase 28D does not waive, weaken, or
  pre-satisfy it.
- **Not** Track 2 (soft-audit-prefix-only) consumption, **not**
  Track 3 (private-alias *shape* adoption), **not** Finn
  runtime adoption (governed by ADR-027C), **not** Freeside
  wiring, **not** production storage migration, **not**
  signature verification, **not** policy execution, **not**
  audit-chain enforcement, **not** a storage adapter, **not**
  recall execution change.
- **Not** a re-open of `loa-dixie` PR #102, **not** a second
  Dixie endpoint, **not** a second runtime subpath, **not** a
  new public type re-export, **not** an edit to
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md) or
  [`../mvp/threat-model.md`](../mvp/threat-model.md).
- **Not** an `npm install` / `npm update` run.
- **Not** a sibling-repo edit. No `loa-hounfour`, `loa-finn`,
  `loa-dixie`, `loa-freeside`, `loa`, or `freeside-characters`
  file is edited by Phase 28D.

## What Phase 28D **may** authorize

Phase 28D **may** authorize, as a separate future event under
its own first-class §4.d gate, the **drafting of the next
first-class code-candidate plan/PR scope for Track 1**. The
authorized successor scope, in summary (see the canonical record
[`../decisions/ADR-027B-VectorAccess-release-unblocked.md`](../decisions/ADR-027B-VectorAccess-release-unblocked.md)
§"Decision" §6 for the full enumeration):

- **Successor type.** A first-class plan/PR scope under
  ADR-026A0 §"Decision" §3 — authored as a docs-only successor
  (an ADR plus a handoff packet), not as a code PR.
- **Track scope.** Track 1 only.
- **Dependency posture (in the implementation PR, not the plan).**
  May propose pinning / updating the existing
  `@0xhoneyjar/loa-hounfour` dependency to `8.7.0` (or
  confirming a no-delta posture against actual package state),
  with no range widening — exact tag only. The dependency edit
  is inside the **implementation PR**, not Phase 28D and not
  the successor plan itself.
- **Resolution path.** Registry-resolution only against
  `https://npm.pkg.github.com`.
- **No new ADR-022E gate firings.** #1, #2, #3, #4, #5, #17,
  #18 each remain governed by their own first-class proposals.
- **§4.d remains the successor's own gate.** Phase 28D's
  resolution of the release / vector-access precondition is
  **necessary, not sufficient**.

## Operator's next steps

This section is **advisory**. None of these steps is performed
by Phase 28D itself, and none is authorized by Phase 28D.

1. **Decide whether to draft the Track 1 successor plan/PR
   scope now.** The release / vector-access precondition is
   met, but §4.d remains independently unsatisfied. Drafting
   the successor plan now is acceptable as a docs-only event;
   merging it requires its own §4.d.
2. **Do not run `npm install` against `8.7.0` under cover of
   Phase 28D.** The `package-lock.json` resolved-`8.6.0`
   posture remains unchanged. Any install / pin step is part
   of the future implementation PR.
3. **Treat the v8.7.0 release event as audit evidence, not
   authority.** The release answers the Phase 28C release
   request; it does not on its own authorize Straylight code,
   dependency edits, or shape adoption. ADR-026A0
   §"Decision" §6.Forbidden remains binding.
4. **Preserve the class-vs-policy boundary in any successor
   draft.** Hounfour ships shape; Straylight owns policy /
   competence / verification / execution / authorization. The
   successor plan must reaffirm this boundary explicitly.
5. **If a Hounfour-side re-publish or yank changes the v8.7.0
   posture**, that is a separate evidence event handled by the
   successor plan/PR scope, not by Phase 28D rollback.

## Citations

- [`../decisions/ADR-027B-VectorAccess-release-unblocked.md`](../decisions/ADR-027B-VectorAccess-release-unblocked.md)
  — canonical Phase 28D decision/evidence record (this handoff's
  authorizing in-repo doc).
- [`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md)
  §"Decision" §3 / §5 — the Phase 28C BLOCKED disposition that
  Phase 28D resolves; the §5.a–§5.e exact required release
  evidence.
- [`../decisions/ADR-027B-PrivateAlias-successor-plan.md`](../decisions/ADR-027B-PrivateAlias-successor-plan.md)
  §"Decision" §3 / §6 / §8 — the future Track 1 code PR's
  shape, its own §4.d gate, dependency posture / release-/tag-
  blocker rules.
- [`../decisions/ADR-027B-Fire-hounfour-composition-contracts.md`](../decisions/ADR-027B-Fire-hounfour-composition-contracts.md)
  §"Decision" §2 / §3 / §5 — Phase 28A composition-contract
  evidence lock; class-vs-policy boundary; Hounfour-side
  release-integrity convention.
- [`../decisions/ADR-027A-post-dixie-return-gate.md`](../decisions/ADR-027A-post-dixie-return-gate.md)
  §"Decision" §4.a — the release-evidence posture
  ("published, tagged, resolvable").
- [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
  §"Decision" §3 / §6.Forbidden — first-class vs second-class
  doc classes; the not-authority list.
- [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — gate inventory; none fired by Phase 28D.
- [`./phase-28c-hounfour-release-request.md`](./phase-28c-hounfour-release-request.md)
  — the Phase 28C draft release request whose answer is the
  v8.7.0 release.
- [`loa-hounfour` issue #70 release comment](https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4507326260)
  — the Hounfour-side release announcement.
