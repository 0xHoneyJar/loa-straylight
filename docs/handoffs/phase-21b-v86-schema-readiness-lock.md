# Phase 21B — Hounfour v8.6 schema-readiness lock (local only)

> Status: Phase 21B. **Schema-readiness lock packet only, in
> `loa-straylight`.** This document maps the actually-exported
> `@0xhoneyjar/loa-hounfour@8.6.0` surface (consumed by Phase 21A)
> to the Straylight Recall Wedge MVP primitive set, and answers the
> five readiness-lock questions below — what is now safe to treat as
> shipped upstream substrate, what is still not a confirmed
> exported Hounfour contract, what remains deferred locally, what is
> a runtime-integration blocker versus a non-blocking discovery
> note, and what shape Phase 22 should take. Phase 21B is **not
> endpoint-wired**, **not runtime-wired**, **not the full Recall
> Wedge**, **not governed recall in Finn / Dixie / Freeside
> runtime**, and **not Hounfour-side schema work**. **No endpoint /
> runtime integration is authorized by this packet.** Phase 21B is
> **Phase 21B only** — it does not advance any Phase 20A / 20B / 20C
> / 20D / 20E or Phase 21A deferral.
>
> Phase 21B does **not** flip any wedge import, change `package.json`
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
> `.loa/` / `.claude/`. It does **not** commit and does **not** open
> a PR. The actual Phase 21B PR is a separate, future event under
> teammate review.
>
> Companion docs (the Phase 21A intake this readiness lock builds on
> and the Phase 20 closeout it preserves):
> [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt),
> [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
> [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
> [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md),
> [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md),
> [`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md),
> [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md),
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
> [`hounfour-response-intake.md`](./hounfour-response-intake.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md).

## Executive summary

Phase 21A consumed `@0xhoneyjar/loa-hounfour@8.6.0`, refreshed the
shadow inspector against the v8.6.x line, and pinned the refreshed
test expectations
([`../../tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts);
commit `4f31b14`). Phase 21A authorized no `src/straylight/` runtime
change and no sibling-repo wiring; that discipline is preserved by
Phase 21B unchanged.

Phase 21B is the **local readiness lock** that converts the
v8.6.0-resolved shadow output
([`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt))
into an explicit, reviewable mapping from (a) the
`@0xhoneyjar/loa-hounfour@8.6.0` exported surface — both the JS
module subpath exports and the `./schemas/*` file-level subpath — to
(b) the Straylight Recall Wedge MVP primitive set named by the
Phase 9 / 10 / 12 / 14 sibling-repo handoff packets and the Phase 20
ADR-020 series. The mapping answers the five questions below
without flipping any import, mutating any source / fixture / script /
test / package file, or authorizing any endpoint or runtime wiring.

Phase 21B records:

1. **Which v8.6.0 exports are now safe upstream substrate** — the
   nine MATCH dispositions plus the one EXTEND disposition from
   [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt),
   resolved against `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`,
   and the eleven JS module subpaths plus the `./schemas/*`
   file-level subpath in the v8.6.0 `exports` map. **`Challenge`
   has shipped** as `challenge.schema.json` (cycle-005 deferral
   resolved), confirming Phase 16 delta #7 closure.
2. **Which Straylight MVP primitives are still not confirmed
   exported Hounfour contracts** — `EstateTransition` (schema
   absent; delta #8 still queued); `AuditEvent` (DISCOVERY_NOTE,
   not shipped under that name; v8.6.0 ships
   `audit-trail-entry.schema.json` and `domain-event.schema.json`
   instead); the JS-side `safeCanonicalize` subpath (no
   `./canonicalize` or `./utilities` subpath declared in the
   v8.6.0 `exports` map; gate `no-confirmed-subpath` unchanged).
3. **Which items remain deferred locally** — `EstateTransition`
   semantics (kept local in
   [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts));
   canonicalization (kept local in
   [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts));
   `audit-event-transition` candidate resolution path; the
   `policy-decision-denied` schema-candidate disposition; public
   anchoring per ADR-020E; production persistence per ADR-020D.
4. **Which gaps are runtime-integration blockers vs. non-blocking
   discovery notes** — `EstateTransition` absence and the missing
   `safeCanonicalize` subpath are *blockers* for any Phase 21
   endpoint / runtime path that would need them; the Phase 19A
   pending feedback gate, the ADR-020B endpoint-host placement
   gate, and the ADR-020A semantic-owner reaffirmation gate
   remain *blockers* per Phase 20E. The
   `audit-event-transition` DISCOVERY_NOTE and the
   `policy-decision-denied` DEFERRED disposition are *non-blocking*
   and remain later-phase classification decisions.
5. **What shape Phase 22 should take** — Phase 22 should remain
   **local** under the Phase 20E entry-condition discipline:
   either (a) further local schema/readiness work that does not
   change `src/straylight/` or sibling-repo state, or (b) a
   Hounfour-side status comment for
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
   acknowledging v8.6.0 receipt and the residual gates
   (`EstateTransition`, `safeCanonicalize` subpath) — drafted
   in-repo, not filed by Phase 22 itself. **Finn boundary prep
   and Dixie boundary prep are not authorized**: the Phase 20E
   non-go conditions for endpoint-host placement and schema
   ownership reaffirmation remain in force, and the v8.6.0
   release alone does not satisfy the Phase 19A "Hounfour / Jani
   feedback received" gate.

The wedge dependency state inherited from Phase 21A is preserved
unchanged: `@0xhoneyjar/loa-hounfour@^8.6.0` is consumed
successfully and resolves to `8.6.0`. The Phase 19A pending
feedback for issue #70 remains pending. The Phase 20E entry
conditions and non-go conditions remain binding.

## v8.6 inherited state (recap)

Restated narrowly so a reviewer can rely on this list without
re-reading the four-phase Phase 20 lane or the Phase 16 / 17B / 18
/ 19A / 21A intake:

- `@0xhoneyjar/loa-hounfour@^8.6.0` is consumed successfully
  (Phase 21A; commit `4f31b14`). Resolved to `8.6.0`.
- Schema `$id`s under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`.
- The 15 net-new v8.5.0-origin schemas (delta #12) are still
  present in v8.6.x.
- `Challenge` has shipped as `challenge.schema.json` (Phase 16
  delta #7 deferral resolved at v8.6.0).
- `EstateTransition` remains absent under the deferred-schemas
  regex pass (Phase 16 delta #8 still queued).
- `safeCanonicalize` exported subpath remains deferred under gate
  `no-confirmed-subpath`. The v8.6.0 `exports` map declares no
  `./canonicalize` or `./utilities` subpath; importing from
  package root is forbidden (delta #9), and reaching into
  unexported internals (`dist/utilities/`) is forbidden by the
  user-facing Phase 17B / Phase 18 / Phase 21A constraint.
- `audit-event-transition` is `DISCOVERY_NOTE`, not blocker (the
  expected `audit-event` schema is not shipped under that name in
  v8.6.x; resolution is a deliberate later-phase decision).
- `policy-decision-denied` candidate remains `DEFERRED` (no
  current Hounfour-side mapping).
- The wedge's stable public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged. The private alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is unchanged.

The canonical evidence for the points above is the v8.6.x shadow
inspection output Phase 21A captured at
[`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)
and the Phase 21A test pin at
[`../../tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts).

## v8.6.0 exported surface (the substrate Phase 21B maps from)

The installed
[`node_modules/@0xhoneyjar/loa-hounfour/package.json`](../../node_modules/@0xhoneyjar/loa-hounfour/package.json)
`exports` map at v8.6.0 declares exactly the following subpaths.
Phase 21B treats this list as the **complete** set of contracts
Straylight is permitted to depend on at the JS / file boundary —
anything not declared here is by definition not an exported
contract.

| Subpath | Kind | Phase 21B disposition |
|---|---|---|
| `.` | JS module (root) | **Forbidden as a JS import target** per delta #9 (subpath import discipline). Root may still be referenced as the package name only (e.g. dependency declaration). |
| `./core` | JS module | Exported. Not consumed by the wedge today. |
| `./economy` | JS module | Exported. Not consumed by the wedge today. |
| `./model` | JS module | Exported. Not consumed by the wedge today. |
| `./governance` | JS module | Exported. Not consumed by the wedge today. |
| `./constraints` | JS module | Exported. Not consumed by the wedge today. |
| `./integrity` | JS module | Exported. Not consumed by the wedge today. |
| `./graph` | JS module | Exported. Not consumed by the wedge today. |
| `./composition` | JS module | Exported. Not consumed by the wedge today. |
| `./commons` | JS module | Exported. Not consumed by the wedge today. |
| `./vectors` | JS module | Exported. Not consumed by the wedge today. |
| `./schemas/*` | File-level subpath (JSON Schema files) | Exported as a *file* surface — JSON Schema documents under `node_modules/@0xhoneyjar/loa-hounfour/schemas/<name>.schema.json`. Read-only. Not a JS module surface. |
| `./canonicalize` | — | **Not declared.** `safeCanonicalize` subpath remains deferred under gate `no-confirmed-subpath`. |
| `./utilities` | — | **Not declared.** Reaching into `dist/utilities/` for canonicalization helpers remains forbidden. |

Phase 21B notes, but does not authorize, the existence of the
eleven JS module subpaths beyond those the wedge already touches.
Authorization to consume any of the unconsumed subpaths
(`./core`, `./economy`, `./model`, `./governance`, `./constraints`,
`./integrity`, `./graph`, `./composition`, `./commons`,
`./vectors`) is **gated** on (a) a documented, evidence-backed
Straylight need, (b) a separate ADR under teammate review, and
(c) a future implementation phase that explicitly cites the
authorization. Phase 21B authorizes none of these.

## Question 1 — Hounfour v8.6 surface now safe as shipped upstream substrate

The v8.6.0-shipped substrate Straylight may treat as canonical
schema *candidates* (not as authorities; Loa-Straylight remains the
semantic owner per ADR-020A) is the union of the nine MATCH
dispositions and the one EXTEND disposition recorded in the v8.6.x
shadow inspection
([`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)),
each resolved to its v8.6.0 `$id` under
`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`.

| Straylight candidate | v8.6.0 schema (file under `./schemas/*`) | `$id` (suffix after `8.6.0/`) | Disposition | Net-new since v8.5.x? |
|---|---|---|---|---|
| `actor.json` | `agent-identity.schema.json` | `agent-identity` | MATCH | No (rename established v8.5.x). |
| `estate.json` | `agent-estate.schema.json` | `agent-estate` | EXTEND | No (extension established v8.5.x). |
| `keyring.json` | `keyring.schema.json` | `keyring` | MATCH | No. |
| `assertion-observation.json` | `assertion.schema.json` | `assertion` | MATCH | No. |
| `assertion-reflection-contested.json` | `assertion.schema.json` | `assertion` | MATCH | No. |
| `assertion-revoked.json` | `assertion.schema.json` | `assertion` | MATCH | No. |
| `recall-request-public-discord.json` | `recall-request.schema.json` | `recall-request` | MATCH | No (delta #12; net-new in v8.5.0, still present in v8.6.x). |
| `recall-pack-public-discord.json` | `recall-pack.schema.json` | `recall-pack` | MATCH | No (delta #12). |
| `recall-receipt-public-discord.json` | `recall-receipt.schema.json` | `recall-receipt` | MATCH | No (delta #12). |
| `commitment-root.json` | `commitment-root.schema.json` | `commitment-root` | MATCH | No (delta #12). |
| **`Challenge` (v8.6.0 cycle-005 follow-on)** | `challenge.schema.json` | (shipped under v8.6.0) | **MATCH (newly resolved at v8.6.0)** | **Yes — first appearance at v8.6.0 (delta #7 deferral resolved).** |

The fifteen net-new v8.5.0-origin schemas listed in the v8.6.x
shadow output (`receipt-detail-level`, `surface-context`,
`recall-request`, `recall-pack`, `recall-receipt`,
`forget-record`, `commitment-type`, `commitment-root`,
`agent-estate-status`, `agent-estate`, `privacy-scope`,
`risk-level`, `assertion-status`, `assertion-class`, `assertion`)
are confirmed present in the installed v8.6.x line and continue to
back the corresponding wedge candidates as in v8.5.x.

What Phase 21B records, narrowly, about Q1:

- The single new safe-upstream-substrate item at v8.6.0 (relative
  to the v8.5.x-line baseline Phase 19A reviewed) is
  `challenge.schema.json`. This resolves the Phase 16 delta #7
  deferral at the **schema** level. Phase 21B does **not** flip
  any wedge import to consume it, does **not** add a
  `Challenge` re-export to
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
  and does **not** implement `Challenge` locally. Adoption of
  the v8.6.0 `challenge.schema.json` as a Straylight contract
  remains gated on a future ADR per ADR-020C and the Phase 20E
  schema-ownership reaffirmation entry condition.
- Every other MATCH / EXTEND row above was already shipped at
  v8.5.0; v8.6.0 preserves them. Phase 21B records this as
  *continuity*, not as a new authorization.
- Schema-file-level access via the `./schemas/*` subpath is the
  only file-boundary surface Phase 21B treats as substrate. JS
  module subpaths beyond those already used by the wedge are
  noted but unconsumed.

## Question 2 — Straylight MVP primitives still not available as confirmed exported Hounfour contracts

The Recall Wedge MVP primitive set named by the Phase 9 handoff
([`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)),
the Phase 16 adaptation delta
([`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)),
and the ADR-020A semantic-owner list — `Assertion`, `Keyring`,
`EstateTransition`, `Challenge`, `Revocation`, `ForgetRecord`,
`RecallRequest`, `RecallPack`, `RecallReceipt`, `AuditEvent`,
`CommitmentRoot`, plus the supporting `AgentIdentity` /
`AgentEstate` / `AssertionClass` / `AssertionStatus` /
`PrivacyScope` / `RiskLevel` / `SurfaceContext` /
`ReceiptDetailLevel` / `CommitmentType` / `AgentEstateStatus`
shapes, plus the `safeCanonicalize` utility — has the following
v8.6.0 contract status. Phase 21B treats "confirmed exported
contract" as **(a)** a JSON Schema document available under
`./schemas/*` whose `$id` resolves under
`https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`, **or**
**(b)** a JS module symbol available through one of the eleven
declared JS subpath exports.

| Primitive | v8.6.0 contract status | Why not confirmed (if applicable) |
|---|---|---|
| `Assertion` | Confirmed (`./schemas/assertion.schema.json`). | — |
| `AssertionClass` | Confirmed (`./schemas/assertion-class.schema.json`). | — |
| `AssertionStatus` | Confirmed (`./schemas/assertion-status.schema.json`). | — |
| `Keyring` | Confirmed (`./schemas/keyring.schema.json`). | — |
| `Challenge` | Confirmed at v8.6.0 (`./schemas/challenge.schema.json`). | — |
| `Revocation` | Confirmed via `assertion-revoked` MATCH against `./schemas/assertion.schema.json`. | — |
| `ForgetRecord` | Confirmed (`./schemas/forget-record.schema.json`). | — |
| `RecallRequest` | Confirmed (`./schemas/recall-request.schema.json`). | — |
| `RecallPack` | Confirmed (`./schemas/recall-pack.schema.json`). | — |
| `RecallReceipt` | Confirmed (`./schemas/recall-receipt.schema.json`). | — |
| `CommitmentRoot` | Confirmed (`./schemas/commitment-root.schema.json`). | — |
| `CommitmentType` | Confirmed (`./schemas/commitment-type.schema.json`). | — |
| `AgentIdentity` | Confirmed (`./schemas/agent-identity.schema.json`). | — |
| `AgentEstate` | Confirmed (`./schemas/agent-estate.schema.json`). | — |
| `AgentEstateStatus` | Confirmed (`./schemas/agent-estate-status.schema.json`). | — |
| `PrivacyScope` | Confirmed (`./schemas/privacy-scope.schema.json`). | — |
| `RiskLevel` | Confirmed (`./schemas/risk-level.schema.json`). | — |
| `SurfaceContext` | Confirmed (`./schemas/surface-context.schema.json`). | — |
| `ReceiptDetailLevel` | Confirmed (`./schemas/receipt-detail-level.schema.json`). | — |
| **`EstateTransition`** | **Not confirmed.** | Schema absent in v8.6.x (`/^estate-transition(\b\|[-.])/i` regex pass; delta #8 queued). No JS subpath export carries the symbol. |
| **`AuditEvent`** | **Not confirmed under that name.** | v8.6.x ships `./schemas/audit-trail-entry.schema.json` and `./schemas/domain-event.schema.json` but no `audit-event.schema.json`. The Straylight candidate `audit-event-transition.json` is `DISCOVERY_NOTE`, not MATCH / EXTEND. Resolution path (rename, request a Hounfour-side `AuditEvent` schema, or re-classify against `audit-trail-entry` / `domain-event`) is a later-phase decision. |
| **`safeCanonicalize` (JS subpath)** | **Not confirmed.** | The v8.6.0 `exports` map declares no `./canonicalize` or `./utilities` subpath. Importing from package root is forbidden (delta #9). Reaching into `dist/utilities/` is forbidden by the user-facing Phase 17B / 18 / 21A constraint. Gate `no-confirmed-subpath` unchanged. |
| `policy-decision-denied` (Straylight schema candidate, not a wedge runtime primitive) | **Not confirmed.** | DEFERRED disposition in v8.6.x shadow output. No Hounfour-side mapping exists today. |

What Phase 21B records, narrowly, about Q2:

- Three items remain *not confirmed exported* at v8.6.0:
  `EstateTransition`, `AuditEvent` (under that name), and the
  `safeCanonicalize` JS subpath. None of these is changed by
  Phase 21B; the deferral discipline from Phase 16 / 17B / 18 /
  19A / 20A–E continues unchanged.
- `audit-event-transition` is non-blocking informational
  classification, not a Hounfour-side blocker. It is recorded
  in Q2 only because the Straylight primitive `AuditEvent` does
  not have a confirmed v8.6.0 contract under that name.
- `policy-decision-denied` is a Straylight-side schema
  *candidate* listed in the shadow output, not a wedge runtime
  primitive; it is included for completeness only.

## Question 3 — Items that remain deferred locally

Restated narrowly so a reviewer can confirm Phase 21B did not
silently advance any of the Phase 20A / 20E deferrals:

- **`EstateTransition` semantics.** Kept local in
  [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts).
  Adoption of any future Hounfour `EstateTransition` schema is by
  a future ADR per ADR-020C and the Phase 20E schema-ownership
  reaffirmation entry condition. Phase 21B does **not** add a
  local `EstateTransition` type, schema, fixture, or verb.
- **Canonicalization.** Kept local in
  [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts).
  Gate `no-confirmed-subpath` unchanged. Phase 21B does **not**
  add a `safeCanonicalize` subpath import; Phase 21B does **not**
  reach into unexported Hounfour internals; Phase 21B does **not**
  authorize a future package-root import. A Hounfour-side
  blocker filing for an explicit exported subpath remains a
  *future, separate, sibling-repo event* under teammate review,
  not a Phase 21B output.
- **`audit-event-transition` resolution path.** Recorded as
  `DISCOVERY_NOTE`, not `MISSING`. Resolution (rename, request a
  Hounfour-side `AuditEvent` schema, or re-classify against
  `audit-trail-entry` / `domain-event`) is a deliberate
  later-phase decision. Phase 21B does **not** decide it.
- **`policy-decision-denied` candidate disposition.** Remains
  DEFERRED. Phase 21B does **not** decide it.
- **Public anchor / commitment-root publication.** Per ADR-020E.
  The local commitment-root helper at
  [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  is unchanged and unpublished. The seven future-requirement
  gates in ADR-020E remain unsatisfied.
- **Production database / persistence substrate.** Per ADR-020D
  and the Phase 20E "no production persistence is wired" pin.
  The existing `InMemoryStorage` and `JsonlStorage` adapters are
  unchanged.
- **Sibling-repo runtime wiring** (Finn / Dixie / Freeside). Each
  remains a future, separate, sibling-repo PR under teammate
  review per
  [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).
  Phase 21B does **not** advance any of them.
- **Endpoint-host placement** (per ADR-020B). The
  default-vs-fallback recommendation (Dixie default; Finn
  fallback) is unchanged. Phase 21B does **not** select the
  endpoint host. The placement is locked by a later ADR once a
  sibling-repo PR is opened under teammate review.
- **`Challenge` adoption into Straylight's public surface.**
  Although the v8.6.0 `challenge.schema.json` is now shipped
  upstream, Phase 21B does **not** flip any import, **not** add
  a `Challenge` re-export to
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
  **not** add a `Challenge` type / schema / fixture, and
  **not** implement `Challenge` locally. Adoption is by a
  future ADR per ADR-020C, not by rename.

## Question 4 — Blocker classification (runtime-integration blockers vs. non-blocking discovery notes)

Phase 21B classifies each open gap by whether it would block a
Phase 21 endpoint / runtime path. The classification is restated
from existing Phase 20E and Phase 19A material; Phase 21B does
not re-derive it.

### Blockers for runtime integration

A future Phase 21 endpoint / runtime path **must not** proceed
while any of the following holds:

- **`EstateTransition` schema is absent at Hounfour v8.6.x**
  (delta #8 queued). Any runtime path that emits, validates, or
  persists an `EstateTransition` envelope by reference to a
  canonical Hounfour schema cannot do so today. Phase 21B treats
  this as a *blocker* for any wiring that would require it; it is
  not a blocker for paths that explicitly do not need
  `EstateTransition` (e.g. the existing local
  `RecallRequest → RecallPack + RecallReceipt` flow exercised by
  the Phase 20B / 20C tests).
- **`safeCanonicalize` JS subpath is unconfirmed.** No
  `./canonicalize` or `./utilities` subpath exists in the v8.6.0
  `exports` map. Any runtime path that requires canonical
  hashing on the wire by reference to Hounfour's canonicalizer
  cannot do so today. Phase 21B treats this as a *blocker* for
  any wiring that would require it; the local canonicalizer at
  [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  remains the wedge's canonicalization implementation (per
  Phase 17B / Phase 18 / Phase 21A).
- **Phase 19A pending Hounfour / Jani feedback.** The Phase 19A
  upstream-review packet
  ([`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md))
  is awaiting Jani / a Hounfour-side teammate response on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
  The v8.6.0 release is *partial fulfillment* (`Challenge`
  shipped) but does not constitute the issue-#70 response the
  Phase 19A packet was filed for. Per Phase 20E entry
  condition #1, Phase 21 must not begin endpoint / runtime
  wiring until either (a) Jani / a Hounfour-side teammate
  responds on issue #70 *or* (b) a Loa teammate review on this
  repo explicitly approves proceeding.
- **ADR-020B endpoint-host placement is unselected.** Phase 21
  must select Dixie or Finn (or explicitly defer the choice
  with a separate ADR under teammate review) before wiring.
  Phase 21B does **not** make this selection.
- **ADR-020A semantic-ownership reaffirmation is missing for
  Phase 21.** Per Phase 20E entry condition #3, Phase 21 must
  restate this boundary at entry. Phase 21B does **not** open
  Phase 21; restatement is a Phase 21 entry-packet
  responsibility.

### Non-blocking discovery notes

These items are recorded for completeness but do not, by
themselves, block a Phase 21 endpoint / runtime path:

- **`audit-event-transition` is `DISCOVERY_NOTE`.** The expected
  `AuditEvent` schema is not shipped in the installed Hounfour
  line under that name. v8.6.x does ship
  `./schemas/audit-trail-entry.schema.json` and
  `./schemas/domain-event.schema.json`, either of which may be a
  later-phase classification target. Resolution is a deliberate
  later-phase decision; informational only.
- **`policy-decision-denied` candidate is `DEFERRED`.** No
  Hounfour-side mapping exists today. The candidate is
  Straylight-side, not a wedge runtime primitive, and does not
  block a runtime path that does not require it.
- **Cosmetic alias decisions.** `actor → agent-identity` and
  `estate → agent-estate` are MATCH / EXTEND mappings against
  v8.6.0 schemas that are stable across v8.5.x → v8.6.x.
  Whether the wedge surface ever surfaces the Hounfour names
  versus its own is an ADR-020C question, not a substrate
  question.
- **Eleven JS module subpaths are unconsumed.** `./core`,
  `./economy`, `./model`, `./governance`, `./constraints`,
  `./integrity`, `./graph`, `./composition`, `./commons`,
  `./vectors` exist in the v8.6.0 `exports` map but the wedge
  does not consume them. Their presence is informational; their
  absence from the wedge's import surface is the Phase 17B /
  18 / 21A subpath-discipline default, not a gap.

## Question 5 — Phase 22 recommendation

Phase 22's allowable shapes — given the Phase 20E entry conditions
and non-go conditions — are constrained to one of the following:
local schema/readiness work, a Hounfour-side status comment,
Finn boundary prep, Dixie boundary prep, or no code work. Phase 21B
records, narrowly:

- **Recommended:** local schema/readiness work *or* a Hounfour
  status comment, drafted in-repo only. Either is consistent
  with the Phase 20E entry conditions and adds no runtime
  behavior.
- **Not authorized: Finn boundary prep.** Phase 20E entry
  condition #2 (endpoint-host placement) is unsatisfied;
  selecting Finn ahead of an ADR is exactly the
  default-vs-fallback ambiguity ADR-020B refused to resolve in
  Phase 20A. The Phase 10 packet
  ([`finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md))
  remains *staged*, not *implemented*; further Finn-side
  preparation that anticipates placement is premature.
- **Not authorized: Dixie boundary prep.** Symmetrical to Finn.
  Phase 20E entry condition #2 is unsatisfied; the Phase 12
  packet
  ([`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md))
  remains *staged*, not *implemented*. Phase 20D's
  endpoint-boundary planning packet is the only Dixie-side
  document allowed; further preparation that anticipates
  placement is premature.
- **Not preferred: no code work.** Phase 21B does not foreclose
  this — a deliberate Phase 22 pause is allowable — but the
  recommendation above is to prefer one of the two allowed
  shapes.

### Recommended shape A — local schema/readiness work

Examples (each is a *candidate*, not an authorization):

- A Phase 22 in-repo packet that updates the cross-repo
  implementation order
  ([`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md))
  with a v8.6.0 footnote acknowledging the `Challenge` shipping
  event and the residual `EstateTransition` / `safeCanonicalize`
  gates.
- A Phase 22 readiness-classification refresh against the v8.6.x
  shadow output as the Hounfour line evolves (e.g. patch
  releases that ship `audit-event` or an exported
  `./canonicalize` subpath would re-classify rows in §Q1 / §Q2).
- An ADR under
  [`../decisions/`](../decisions/) that pre-locks the future
  adoption procedure for `Challenge` (now upstream-shipped) into
  the Straylight public surface, deferring actual adoption until
  a later phase explicitly cites the ADR.

None of the candidates above flips any import, modifies any
source / fixture / script / test / package file, edits any
sibling repo, or touches `.loa/` / `.claude/`.

### Recommended shape B — Hounfour-side status comment (drafted, not filed)

A Phase 22 in-repo doc that drafts a status comment for
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
acknowledging:

- Receipt of v8.6.0 by Loa-Straylight (Phase 21A flip; commit
  `4f31b14`).
- The `Challenge` schema shipping event closes Phase 16 delta #7.
- Residual gates: `EstateTransition` (delta #8 still queued) and
  the `safeCanonicalize` exported subpath
  (`no-confirmed-subpath`).
- Reaffirmation of the Phase 19A non-claims (no Finn / Dixie /
  Freeside runtime wiring; no sibling-repo inspection or
  fallback; alias boundary remains private).

Per Phase 19A discipline, **filing** the comment is a separate,
sibling-repo, human-reviewed event. Phase 22 may *draft* the
comment in-repo; it must not file it.

### Why Finn / Dixie boundary prep is not the recommendation

Restated narrowly:

- Phase 20E non-go condition #2 (endpoint host still ambiguous)
  is unchanged at v8.6.0. The Hounfour release does not select
  the endpoint host; ADR-020B still recommends Dixie default and
  Finn fallback without committing to either.
- Phase 20E non-go condition #3 (schema ownership still
  ambiguous at Phase 21 entry) is unchanged at v8.6.0. The
  ADR-020A semantic-ownership boundary requires Phase 21-entry
  restatement; Phase 21B does not open Phase 21.
- The
  [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  rules — no Finn ahead of Hounfour, no Dixie BFF as generic
  retrieval, no Freeside before Dixie / Finn settle — remain
  binding.

A Phase 22 that prepared either Finn or Dixie boundary content
beyond the existing Phase 10 / 12 / 20D packets would
short-circuit the gates above.

## Explicit non-scope (Phase 21B)

Phase 21B is **schema-readiness lock only**. It performs no
implementation work. The following are out-of-scope and remain in
the same state Phase 21A left them:

- **No `src/` changes.** The wedge's stable public API surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  is unchanged. The private alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is unchanged. No re-export is added. No re-export is removed.
  No internal module is edited.
- **No tests.** No new test file. No edit to any existing test
  file. The Phase 17B / 18 / 21A shadow-integration pin
  ([`../../tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts)),
  the Phase 19A review-packet pin
  ([`../../tests/hounfour-v850-shadow-review-packet.test.ts`](../../tests/hounfour-v850-shadow-review-packet.test.ts)),
  the Phase 20B per-category receipt pin, and the Phase 20C
  demo-shape pin already cover the local evidence this packet
  narrates.
- **No scripts.** No edit to any script under
  [`../../scripts/`](../../scripts/). The existing
  `hounfour:shadow-inspect` script is the canonical evidence
  source for §Q1 / §Q2 / §Q4; Phase 21B does not add a parallel
  readiness CLI.
- **No fixtures.** No new fixture file. No edit to any existing
  fixture file under
  [`../../fixtures/`](../../fixtures/).
- **No package changes.** `package.json` and `package-lock.json`
  are unchanged from Phase 21A. The Hounfour dependency
  (`@0xhoneyjar/loa-hounfour@^8.6.0`) range and resolved patch
  (`8.6.0`) are unchanged.
- **No Dixie endpoint.** ADR-020B's default endpoint-host
  recommendation is unchanged and unwired.
- **No Finn endpoint.** ADR-020B's fallback endpoint-host
  recommendation is unchanged and unwired.
- **No Freeside integration.** No bot / admin / community
  surface is added.
- **No Hounfour schema work.** No new schema file authored. No
  Hounfour-side schema edit. No comment filed against any
  sibling repo by Phase 21B.
- **No `Challenge` adoption.** Although `challenge.schema.json`
  is now shipped at v8.6.0, no `Challenge` re-export is added to
  the public surface, no local `Challenge` type / schema /
  fixture / verb is added, and no import is flipped. Adoption is
  by a future ADR per ADR-020C, not by Phase 21B.
- **No `EstateTransition` implementation.** Deferred per
  ADR-020C and the Phase 16 delta #8.
- **No `safeCanonicalize` work.** Gate `no-confirmed-subpath`
  unchanged. The local canonicalizer
  ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
  remains the canonicalization implementation. No reach into
  unexported Hounfour internals.
- **No public anchors.** Per ADR-020E.
- **No persistence wiring.** Per ADR-020D.
- **No sibling repo edits.** Not `loa-hounfour`, not `loa-finn`,
  not `loa-dixie`, not `loa-freeside`. No clone, no fork, no
  patch, no comment filed against any sibling repo by Phase 21B.
- **No new HTTP / network surface.**
- **No `.loa/` / `.claude/` edits.**
- **No auth token printing or writing.** The user-scoped
  `~/.npmrc` Hounfour auth (Phase 17B) remains out-of-band; the
  project `.npmrc` remains registry-only.
- **No commit, no push, no PR.**

## What this packet does *not* claim

For symmetry with the readiness-lock answers above, and so a
reviewer cannot misread Phase 21B as authorization for Phase 22
runtime / endpoint wiring, Phase 21B explicitly does **not**
claim:

- **Not** "the v8.6.0 release satisfies the Phase 19A pending
  feedback gate." `Challenge` shipping is partial fulfillment
  of the Phase 16 delta-list, but the Phase 19A packet was filed
  for a *response on issue #70*; that response remains pending.
- **Not** "Hounfour owns Straylight schemas." Per ADR-020A and
  ADR-020C, Loa-Straylight remains the semantic owner of every
  Recall Wedge primitive. Hounfour remains the canonical schema
  *candidate*. Adoption is by a future ADR per ADR-020C, not by
  rename, and not by Phase 21B.
- **Not** "`Challenge` is adopted." The schema is shipped
  upstream. Adoption into the Straylight public surface is a
  future ADR / phase event.
- **Not** "`EstateTransition` is unblocked." Schema absence in
  v8.6.x continues to gate any runtime path that would require
  it.
- **Not** "`safeCanonicalize` subpath is unblocked." The v8.6.0
  `exports` map still declares no `./canonicalize` or
  `./utilities` subpath. Gate `no-confirmed-subpath` unchanged.
- **Not** "the eleven exported JS module subpaths are
  authorized for consumption." Their presence in the `exports`
  map is informational; consumption requires a documented need,
  a separate ADR, and a future implementation phase. Phase 21B
  authorizes none of them.
- **Not** "a Dixie endpoint exists." ADR-020B's default
  endpoint-host candidate is a *recommendation*. It is not
  wired in any runtime. No `loa-dixie` PR has been opened.
- **Not** "a Finn endpoint exists." ADR-020B's fallback
  endpoint-host candidate is a *recommendation*. It is not
  wired in any runtime. No `loa-finn` PR has been opened.
- **Not** "Phase 22 is authorized to begin Finn or Dixie
  boundary prep." Phase 20E non-go conditions remain binding.
- **Not** "Phase 22 is authorized to flip any wedge import."
  Phase 22's allowable shapes are local schema/readiness work,
  a drafted (not filed) Hounfour status comment, or no code
  work.
- **Not** "any new HTTP / NATS / REST / Discord / Telegram
  surface exists." None.

This is **schema-readiness lock**. The output is **local
documentation** that maps the v8.6.0-shipped Hounfour surface to
the Straylight Recall Wedge MVP primitive set, classifies the
remaining gaps, and constrains Phase 22 to non-runtime, non-sibling
work. The Recall Wedge is **not runtime-wired** and **not
endpoint-wired** by Phase 21B. This is **Phase 21B only**.

## Validation evidence

```bash
npm run typecheck
npm test
npm run hounfour:shadow-inspect
```

`npm run typecheck` and `npm test` are expected to remain clean on
the `phase-21b-v86-schema-readiness-lock` branch: Phase 21B adds no
new test, modifies no source file, and modifies no script,
fixture, or package file, so the existing Phase 4 demo test, the
Phase 5 hardening tests, the Phase 17B / 18 / 21A
shadow-integration pin, the Phase 19A review-packet pin, the
Phase 20B local-scaffold pin, the Phase 20C demo-shape pin, and
the existing handoff-doc validation tests are unaffected.

`npm run hounfour:shadow-inspect` reproduces the canonical evidence
the v8.6 readiness lock maps from. Its output continues to match
the captured artifact at
[`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt).

## Cross-references

- [`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)
  — Phase 21A v8.6.x shadow inspection output (canonical evidence
  for §Q1 / §Q2 / §Q4).
- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
  — Phase 20A decision-lock readiness packet.
- [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)
  — Phase 20A-staged Phase 20B candidate scope.
- [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
  — Phase 20B local-scaffold summary.
- [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)
  — Phase 20C demo / evidence summary.
- [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md)
  — Phase 20D endpoint-boundary planning summary.
- [`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md)
  — Phase 20E closeout packet (entry / non-go conditions).
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet (the load-bearing pending
  feedback gate this readiness lock does not satisfy).
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  — Phase 17B / 18 shadow-integration findings.
- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — Phase 16 per-delta accepted-with-adaptation table.
- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — Phase 16 disposition-counts intake doc.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index.
- [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order.
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 21B to link this doc.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  — semantic-owner decision-lock.
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
  — MVP endpoint-host recommendation + fallback.
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
  — schema-namespace strategy + Phase 20A deferrals.
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  — receipt-ownership + persistence-deferral decision-lock.
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — commitment-root / public-anchor deferral.
- [`../../tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts)
  — Phase 17B / 18 / 21A shadow-integration pin (unchanged by
  Phase 21B).
- [`../../scripts/inspect-hounfour-shadow.ts`](../../scripts/inspect-hounfour-shadow.ts),
  [`../../scripts/inspect-hounfour-shadow.lib.ts`](../../scripts/inspect-hounfour-shadow.lib.ts)
  — shadow inspector CLI + library (unchanged by Phase 21B).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge's stable public API surface (unchanged by Phase 21B).
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  — private Hounfour alias module (unchanged by Phase 21B).
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  — local canonicalizer (unchanged by Phase 21B; gate
  `no-confirmed-subpath` unchanged).
- [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts)
  — local estate / transition application (unchanged by
  Phase 21B; `EstateTransition` deferral unchanged).
- [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  — local commitment-root helper (unchanged by Phase 21B; public
  anchoring deferral per ADR-020E unchanged).
