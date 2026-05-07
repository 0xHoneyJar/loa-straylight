# Handoff packets

> Status: in-repo handoff prep only. **None of these handoffs has been
> filed against the target sibling repo.** Filing the issues / opening
> the PRs is out of scope for the phases that produced them.

This directory holds the engineering handoff packets that
`loa-straylight` stages locally for *future* sibling-repo work. Each
packet is a self-contained, in-repo set of documents (and, where
useful, fixture exports) that describes exactly what the eventual PR
against the sibling repo should consume, what it must avoid, and what
its acceptance criteria are.

The packets are deliberately staged inside `loa-straylight` so the
wedge can:

- pin a **stable contract** the sibling repo will eventually consume
  without round-tripping through this repo;
- pin **explicit non-goals** so the sibling repo's reviewer can
  refuse scope creep at the gate;
- ship **deterministic fixture inputs** the sibling repo's tests can
  adopt verbatim once the work begins;
- prove (via `npm test`) that the handoff packet is internally
  consistent and does not silently introduce cross-repo coupling.

Filing the issue / opening the PR / merging the integration are
*future, separate* changes that take place in the sibling repo. None
of them is performed by the phases that produced these packets.

## Packets

### Phase 9 — Hounfour schema extraction

Target: [`0xHoneyJar/loa-hounfour`](https://github.com/0xHoneyJar/loa-hounfour).

| Document | Purpose |
|---|---|
| [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md) | Issue-ready handoff describing what `loa-hounfour` PR-A must ship: TypeBox / JSON Schema for every `move_to_hounfour` candidate, the conformance-vector adoption, and the explicit non-goals. |
| [`hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md) | Companion PR review checklist (PR-A on the Hounfour side; PR-B on the Straylight side). |
| [`hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md) | Mapping table from each Straylight primitive to its proposed Hounfour schema name, file path, classification, validation layer, and conformance fixture. |

The packet consumes the Phase 6 / 7 / 8 artifacts under
[`docs/schema-candidates/`](../schema-candidates/) and the deterministic
fixtures under
[`fixtures/schema-candidates/`](../../fixtures/schema-candidates/) and
[`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/).

Validate locally:

```bash
npm run hounfour:handoff
```

### Phase 10 — Finn runtime enforcement

Target: [`0xHoneyJar/loa-finn`](https://github.com/0xHoneyJar/loa-finn).

| Document | Purpose |
|---|---|
| [`finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md) | Issue-ready handoff describing what `loa-finn` should eventually enforce at runtime: per-call admission, per-tool recall gating, signer competence, transition gating, receipt emission, audit-chain persistence, and recall-request execution boundaries. |
| [`finn-runtime-boundary.md`](./finn-runtime-boundary.md) | Companion boundary doc — what Finn owns vs what it must not own. Pins the no-go boundaries: no canonical schema authority, no model-output-as-authority, no class-vs-policy collapse, no keyring bypass, no recall without receipt, no action / commitment without policy validation. |
| [`finn-enforcement-mapping.md`](./finn-enforcement-mapping.md) | Mapping table from each Straylight transition / primitive to the proposed Finn enforcement point, required input, required output, fail-closed condition, audit-receipt requirement, and related Hounfour schema candidate. |

The packet consumes the wedge's stable public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)) and the
deterministic fixtures under
[`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/).

Validate locally:

```bash
npm run finn:enforcement
```

### Phase 12 — Dixie governed recall / BFF

Target: [`0xHoneyJar/loa-dixie`](https://github.com/0xHoneyJar/loa-dixie).

| Document | Purpose |
|---|---|
| [`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md) | Issue-ready handoff describing what `loa-dixie` should eventually expose: recall intake, recall-response surface, receipt retrieval, excluded-assertion reason display, provenance inspection, audit-chain lookup, estate summary, assertion-status inspection, governance-record awareness, environment-frame routing, high-risk review-queue routing, and cross-tenant prevention — all under fail-closed semantics inherited from Finn / the wedge. |
| [`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md) | Companion boundary doc — what Dixie owns vs what it must not own. Pins the no-go boundaries: no canonical schema authority, no runtime policy enforcement that bypasses Finn / the wedge, no generic-retrieval-as-governed-recall collapse, no recall without receipt, no leakage of private estate material, no surfacing of challenged / revoked / forgotten material as ordinary active context, no model-summary-as-canonical-truth. |
| [`dixie-recall-mapping.md`](./dixie-recall-mapping.md) | Mapping table from each Straylight primitive / operation to the proposed Dixie BFF / API / service surface, required input, required output, fail-closed condition, receipt / provenance requirement, related Hounfour schema candidate, and related Finn enforcement point. |

The packet consumes the wedge's stable public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)), the
Phase 9 Hounfour mapping, the Phase 10 Finn enforcement mapping,
and the deterministic fixtures under
[`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/).

Validate locally:

```bash
npm run dixie:recall
```

### Phase 14 — Freeside community / app surface

Target: [`0xHoneyJar/loa-freeside`](https://github.com/0xHoneyJar/loa-freeside).

| Document | Purpose |
|---|---|
| [`freeside-community-surface-issue.md`](./freeside-community-surface-issue.md) | Issue-ready handoff describing what `loa-freeside` should eventually expose: Discord / Telegram bot recall, public-channel redaction, tenant-scoped recall, community-scoped recall, Discord / Telegram / REST / NATS environment-frame routing, feedback signal capture, admin capability grants, bot action with receipt, cross-tenant recall prevention, challenged / revoked / forgotten awareness, and tenant-admin estate inspection — all under fail-closed semantics inherited from Hounfour / Finn / the wedge / Dixie. |
| [`freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md) | Companion boundary doc — what Freeside owns vs what it must not own. Pins the no-go boundaries: no canonical schema authority, no runtime policy enforcement that bypasses Finn / the wedge, no bot memory as governed recall, no Discord / Telegram / REST / NATS message as canonical estate truth, no recall without receipt, no leakage of private estate material in public community surfaces, no surfacing of challenged / revoked / forgotten as ordinary active context, no community / bot / admin action without policy validation and receipt / audit trail. |
| [`freeside-surface-mapping.md`](./freeside-surface-mapping.md) | Mapping table from each Straylight primitive / operation to the proposed Freeside community / bot / admin / tenant surface, required input, required output, fail-closed condition, receipt / provenance requirement, related Hounfour schema candidate, related Finn enforcement point, and related Dixie BFF surface. |

The packet consumes the wedge's stable public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)), the
Phase 9 Hounfour mapping, the Phase 10 Finn enforcement mapping,
the Phase 12 Dixie recall mapping, and the deterministic fixtures
under
[`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/).

Validate locally:

```bash
npm run freeside:surface
```

## Phase 16 — Hounfour response intake / rc readiness (rc.1 fired, v8.5.0 final shipped)

Phase 16 records Jani's response to the Phase 9 Hounfour handoff
(filed as
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70))
and the post-intake upstream update: **v8.5.0-rc.1 has fired**
(squash SHA `c94bcd22` on `loa-hounfour`) and **v8.5.0 final has
shipped** (`@0xhoneyjar/loa-hounfour@8.5.0`, tag `v8.5.0`,
`main` HEAD `ea98924d`, `$id`s under
`https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`).

**Phase 16 is not Hounfour integration.** It does not flip
imports, add a Hounfour dependency, or change Phase 0–15 runtime
behavior. The dependency flip to
`@0xhoneyjar/loa-hounfour@^8.5.0` is now **eligible** as of
v8.5.0 final shipping and is authorized for a **separate
follow-up PR — Phase 17 — on Straylight's timeline**, not this
PR.

| Document | Purpose |
|---|---|
| [`hounfour-response-intake.md`](./hounfour-response-intake.md) | Disposition counts (9 REUSE / 4 EXTEND / ~21 ADD-NEW / 6 DEFER to cycle-005 / 1 FOLD of `CandidateAssertion` into `Assertion` with `status: "candidate"`), the "accepted-with-adaptation, not direct import" framing, and the post-intake upstream update recording rc.1 fired and v8.5.0 final shipped. Links back to issue #70. |
| [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md) | Per-delta accepted-with-adaptation table updated for v8.5.0 final: `^8.5.0` package target (not `0.1.x`), bare-PascalCase `$id` naming (`$id`s under `/8.5.0/`), Straylight-side alias / re-export strategy, `CapabilityScope` harmonization, `ForgetRecord` 4-variant model, `safeCanonicalize` (NFC + RFC 8785 + 100 KB normative cap), `Challenge` / `EstateTransition` deferral to cycle-005 / v8.6.0 follow-on, subpath import discipline, cross-version transitive risk through `AgentIdentity`, constraint-ID collapse risk, the 15 net-new rc.1 schemas, `UnverifiedObligationsManifest` evaluator/reason widening (pattern-match by `rule_id` + `reason`), and `ClaimGrounding` strict-additive `external_reference` / `external_uri` and `derived_inference` / `inference_basis`. |
| [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md) | Readiness evidence + Phase 17 dependency-flip checklist (rc.1 / v8.5.0 final gates marked satisfied): pin `@0xhoneyjar/loa-hounfour@^8.5.0` on the Phase 17 test branch only, map imports through an alias module on explicit subpaths, alias `AgentIdentity` as `Actor` if needed, validate schema candidates and conformance vectors against Hounfour validators, prove canonical-hash determinism and 100 KB cap behavior, keep `Challenge` and `EstateTransition` local until cycle-005 / v8.6.0, and file new findings against the live v8.5.0 line. |

The Phase 16 packet consumes the Phase 9 handoff packet, the
Phase 6 / 7 / 8 schema-candidate inventory under
[`docs/schema-candidates/`](../schema-candidates/), the
Phase 8 conformance vectors under
[`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/),
Jani's response on
[issue #70](https://github.com/0xHoneyJar/loa-hounfour/issues/70),
and the post-intake upstream update recording rc.1 fired (squash
SHA `c94bcd22`) and v8.5.0 final shipped
(`@0xhoneyjar/loa-hounfour@8.5.0`). It produces no fixture
changes and no runtime changes; the dependency flip itself is
**Phase 17**, a separate follow-up PR.

Validate locally:

```bash
npm run hounfour:rc-readiness
```

(The `hounfour:rc-readiness` script is optional. If absent,
`npm run hounfour:handoff` and `npm run handoffs:index` still
exercise the underlying packet.)

## Phase 17 — Hounfour v8.5.0 shadow-integration / dependency-flip check

Phase 17 is the **separate follow-up PR** authorized by Phase 16
to attempt the dependency flip to
`@0xhoneyjar/loa-hounfour@^8.5.0` on a Phase-17-only branch,
behind a Straylight-side alias / re-export module, with subpath
imports only, and with `Challenge` / `EstateTransition` kept
local until Hounfour v8.6.0.

**Phase 17 is not Hounfour integration on `main`.** It does not
flip any wedge import on `main`, does not wire Finn / Dixie /
Freeside runtime, does not replace Straylight semantics with
Hounfour semantics, does not implement `Challenge` /
`EstateTransition`, and does not commit or open a PR. Its
deliverable is a working-tree findings doc on the Phase 17
branch.

| Document | Purpose |
|---|---|
| [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md) | Phase 17 working-tree findings: access-gate result (e.g. 401 if GitHub Packages auth for the `@0xhoneyjar` scope has not been provisioned), the *expected* schema-availability comparison table derived from the Phase 16 adaptation-delta doc, the boundary preservation note (no change to `src/straylight/index.ts`), the explicit deferral of `Challenge` / `EstateTransition` to v8.6.0, the next-step gate (auth provisioning), and the explicit out-of-scope list. The follow-up Phase 17 attempt updates this doc in place with the inspector's actual output once the package installs. |

The Phase 17 packet consumes the Phase 16 readiness artifacts
([`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md),
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
[`hounfour-response-intake.md`](./hounfour-response-intake.md))
and a project-scoped `.npmrc` mapping `@0xhoneyjar` to GitHub
Packages (registry-only — no auth token in the project file).
The dependency itself is added to `package.json` only when the
install actually succeeds; on the access-gate failure recorded
by this attempt, neither `package.json` nor `package-lock.json`
is mutated.

Validate locally (after auth is provisioned):

```bash
npm install @0xhoneyjar/loa-hounfour@^8.5.0
npm run hounfour:shadow-inspect   # added by the follow-up attempt
```

## Phase 19A — Hounfour v8.5.x upstream-review packet

Phase 19A is a **narrow upstream-coordination packet** that
summarizes the Phase 17B + Phase 18 shadow-inspection findings
against `@0xhoneyjar/loa-hounfour@^8.5.0` into a copy-ready
GitHub comment for
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).

**Phase 19A is not Hounfour integration.** It does not flip any
wedge import, change `package.json` / `package-lock.json`, change
the Hounfour dependency range or resolved patch, modify
`src/straylight/hounfour-alias.ts`, modify
`src/straylight/index.ts`, wire Finn / Dixie / Freeside runtime,
inspect or edit any sibling repo, implement `Challenge` or
`EstateTransition`, reach into unexported Hounfour internals, or
touch `.loa/` / `.claude/`. Phase 19A is docs / coordination
only — the canonical evidence lives in the Phase 17B + Phase 18
findings doc and the existing vitest pins.

| Document | Purpose |
|---|---|
| [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md) | Phase 19A upstream-review packet: seven load-bearing facts (package consumption works; resolves within `^8.5.0`; the 15 net-new v8.5.x schemas are present; `Challenge` and `EstateTransition` deferred to v8.6.0; `audit-event-transition` is `DISCOVERY_NOTE`, not blocker; `safeCanonicalize` subpath remains deferred under gate `no-confirmed-subpath`), an explicit "Ready-to-copy comment for issue #70" fenced block, and the explicit non-claims (no Finn / Dixie / Freeside runtime wiring; no sibling-repo inspection or fallback; alias boundary remains private). |

The Phase 19A packet consumes the Phase 17B + Phase 18 findings
under
[`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md),
the Phase 16 readiness artifacts
([`hounfour-response-intake.md`](./hounfour-response-intake.md),
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
[`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)),
and the existing Phase 17B + Phase 18 vitest pins under
[`tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts).
It produces no fixture changes, no runtime changes, and no
package changes; filing the upstream comment remains a separate,
human-reviewed event in the sibling repo.

## Phase 20A — Recall Wedge decision-lock packet

Phase 20A is a **narrow decision-lock packet** that converts
existing Loa-Straylight architecture / spec material into
explicit implementation-readiness decisions for the Straylight
Recall Wedge, while the team waits for Jani / teammate response
on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
It locks the next implementation gates (semantic ownership, MVP
endpoint-host recommendation, schema namespace strategy,
persistence / recall-receipt ownership, commitment-root /
public-anchor deferral, and Phase 20B implementation-candidate
scope) so Phase 20B can begin a *local* scaffold without taking
an implicit dependency on any sibling repo, any v8.6.0 schema,
any unconfirmed Hounfour subpath, or any commitment surface.

**Phase 20A is not Recall Wedge implementation.** It does
**not** flip any wedge import, change `package.json` /
`package-lock.json`, change the Hounfour dependency range or
resolved patch, modify
[`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
wire Finn / Dixie / Freeside runtime, edit any sibling repo,
implement `Challenge` or `EstateTransition`, reach into
unexported Hounfour internals, or touch `.loa/` / `.claude/`. It
does **not** commit and does **not** open a PR. Phase 20A is
docs / coordination only — it does not, on its own, authorize
Phase 20B work.

| Document | Purpose |
|---|---|
| [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md) | Phase 20A executive summary: decisions locked (the five ADR-020 series), decisions deferred (`Challenge`, `EstateTransition`, `safeCanonicalize` subpath, `audit-event-transition`, public anchoring, runtime persistence), implementation blockers removed (coordination-level ambiguities), implementation blockers remaining (awaiting issue #70, Hounfour v8.6.0, sibling-repo PRs), what Phase 20A explicitly did *not* do, and the ready/not-ready verdict for Phase 20B. |
| [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md) | Phase 20A-staged Phase 20B scope proposal: candidate branch (`phase-20b-recall-wedge-local-scaffold`), candidate goal (library-shaped local scaffold over the existing wedge surface), allowed scope (`src/straylight/`, `tests/`, demo, docs, *additive* only), explicit non-scope (no Finn / Dixie / Freeside wiring, no sibling-repo edits, no Hounfour schema authoring, no Hounfour dependency change, no `Challenge` / `EstateTransition`, no `safeCanonicalize` subpath, no public anchoring, no new HTTP surface, no `package.json` deps), likely files for future implementation, validation expectations, and the dependencies on Hounfour feedback. |

The Phase 20A packet consumes the existing
[`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md),
the existing [`docs/mvp/`](../mvp/) wedge / boundary / threat-model
material, the Phase 9 / 10 / 12 / 14 sibling-repo handoff packets,
the Phase 16 response-intake / adaptation-delta / readiness packet,
the Phase 17B / 18 shadow-integration findings, and the Phase 19A
upstream-review packet. It produces five ADR docs under
[`../decisions/`](../decisions/) (ADR-020A through ADR-020E) plus
the two handoff docs above. It produces no fixture changes, no
runtime changes, and no package changes.

The five Phase 20A ADRs:

- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)

## Phase 20B — Recall Wedge local scaffold

Phase 20B is a **narrow local scaffold** staged on the
`phase-20b-recall-wedge-local-scaffold` branch inside
`loa-straylight`. It is the first implementation-facing branch
after the Phase 20A decision-lock packet, but it remains
**local**: it pins local recall semantics on the existing
`executeRecall` pipeline and does **not** wire Finn, Dixie,
Freeside, or Hounfour runtime behavior. Phase 20B is **not the
full Recall Wedge**, **not governed recall in Finn / Dixie /
Freeside runtime**, and **not Hounfour-side schema work**.

Phase 20B does **not** flip any wedge import, change
`package.json` / `package-lock.json`, change the Hounfour
dependency range or resolved patch, modify
[`../../src/straylight/`](../../src/straylight/), wire any
sibling-repo runtime, add a Dixie endpoint, edit any sibling
repo, implement `Challenge` or `EstateTransition`, reach into
unexported Hounfour internals, add a `safeCanonicalize` subpath
import, publish a public commitment root, or touch `.loa/` /
`.claude/`.

| Document | Purpose |
|---|---|
| [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md) | Phase 20B local-scaffold summary: what was added (one additive test file plus three doc files), behaviors pinned (the six ADR-020D receipt categories — included / excluded / redacted / challenged / revoked / blocked-by-policy — on the existing `executeRecall` pipeline, plus the "structural validity is not authorization" invariant and a receipt-or-audit completeness pin), validation evidence (`npm run typecheck`, `npm test`), what Phase 20B explicitly did *not* do (no Finn / Dixie / Freeside wiring, no Dixie endpoint, no sibling-repo edits, no Hounfour schema authoring, no Hounfour dependency change, no `Challenge` / `EstateTransition`, no `safeCanonicalize` subpath, no new typed helper in `src/`, no public anchoring, no new HTTP surface, no `package.json` deps), what remains deferred, and what Phase 20B does *not* claim. |

The Phase 20B packet consumes the Phase 20A decision-lock packet
([`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)),
the Phase 20A-staged candidate scope
([`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)),
the five ADR-020-series decision-locks under
[`../decisions/`](../decisions/), and the existing Recall Wedge
implementation under
[`../../src/straylight/`](../../src/straylight/). It produces no
fixture changes, no runtime changes, no package changes, and no
new sibling-repo handoff packets. The four filed sibling-repo
issue rows above (Hounfour / Finn / Dixie / Freeside) are
unchanged by Phase 20B.

Validate locally:

```bash
npm run typecheck
npm test
```

## Phase 20C — Recall Wedge demo / evidence packet

Phase 20C is a **narrow, in-repo demo / evidence packet** staged on
the `phase-20c-recall-wedge-demo-evidence` branch inside
`loa-straylight` after the Phase 20B local-scaffold packet. It makes
the existing local Recall Wedge demo (`npm run demo:recall:json`)
reproducible and reviewable from one in-repo packet, without changing
demo behavior, source code, scripts, fixtures, or any package
configuration. Phase 20C is **local demo / local evidence only**: it
is **not runtime-wired**, **not endpoint-wired**, **not the full
Recall Wedge**, **not governed recall in Finn / Dixie / Freeside
runtime**, and **not Hounfour-side schema work**.

Phase 20C does **not** flip any wedge import, change `package.json` /
`package-lock.json`, change the Hounfour dependency range or resolved
patch, modify [`../../src/straylight/`](../../src/straylight/),
modify
[`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
or
[`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts),
wire any sibling-repo runtime, add a Dixie endpoint, edit any sibling
repo, implement `Challenge` or `EstateTransition`, reach into
unexported Hounfour internals, add a `safeCanonicalize` subpath
import, publish a public commitment root, or touch `.loa/` /
`.claude/`. It does **not** commit and does **not** open a PR. It
also does **not** add a committed snapshot of the demo's JSON output;
the demo's output path (`.run/recall-demo.json`) remains gitignored
per existing repo convention.

| Document | Purpose |
|---|---|
| [`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md) | Phase 20C demo / evidence summary: command to run the local recall demo (`npm run demo:recall:json`), expected output location (`.run/recall-demo.json`, gitignored, local-only), expected top-level JSON keys (`recall_request`, `recall_pack`, `recall_receipt`, `audit_review`, `audit_chain_verification`), how the demo relates to the Phase 20A ADR-020A–E decision-locks, how the demo relates to the Phase 20B per-category receipt-pin test, what the demo proves (local pipeline; five JSON keys; pack ↔ receipt linkage; clean audit chain), what the demo does *not* prove (no runtime wiring, no Dixie endpoint, no Finn integration, no Freeside surface, no Hounfour schema ownership, no `Challenge`, no `EstateTransition`, no public anchoring), explicit non-claims, what Phase 20C explicitly did *not* do, and what remains deferred. |

The Phase 20C test pin lives at
[`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts).
It uses only the existing `runDemo()` / `toDemoJson()` library
entrypoints from
[`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts)
and asserts only the documented JSON shape (the five top-level keys,
`audit_review`'s sub-keys, `audit_chain_verification.ok`, and the
`recall_pack` ↔ `recall_receipt` linkage on both the public and
audit-review frames). No source file, fixture file, demo script, or
package file is modified by Phase 20C.

Validate locally:

```bash
npm run typecheck
npm test
npm run demo:recall:json   # writes .run/recall-demo.json (gitignored)
```

The Phase 20C packet introduces no new sibling issues, no new
sibling-repo handoff packets, no new fixture directories, no new
runtime imports, no new public-surface re-exports, no new typed
helpers under `src/straylight/`, no new validate command, and no
committed example output. The four filed sibling-repo issue rows
(Hounfour / Finn / Dixie / Freeside) and the prior Phase 20A /
Phase 20B in-repo rows are unchanged by Phase 20C.

## Phase 15 — Cross-repo coordination

Phases 9 / 10 / 12 / 14 each stage a sibling-repo handoff packet.
Phase 15 (this section) adds the in-repo coordination artifacts
that sit *across* those packets — which sibling-repo issues exist,
in what order their PRs should be opened, and which sequences are
explicitly forbidden.

| Document | Purpose |
|---|---|
| [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md) | Index of the four filed sibling issues (Hounfour, Finn, Dixie, Freeside), the local Straylight handoff packet that backs each one, and the local fixture directory each one points at. Restates that sibling-repo PRs require teammate review before merge. |
| [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md) | Recommended sibling-repo implementation order — Hounfour → Finn → Dixie → Freeside — with the dependency rationale for why Hounfour leads, why Finn cannot wire ahead of Hounfour without explicit stubs, why Dixie depends on Finn, why Freeside is last, and what work can run in parallel safely. |
| [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md) | The no-go rules every sibling-repo PR must respect (no Finn ahead of Hounfour, no Dixie BFF as generic retrieval, no Freeside before Dixie / Finn settle, no merge without teammate review, no sibling-side primitive redefinition, no fixtures as production contracts). |

Phase 15 is **coordination only**: it adds docs (and an optional
helper script printing the same index), files no sibling-repo
issues, opens no sibling-repo PRs, edits no sibling repo, and
changes no Phase 0–14 behavior.

Validate locally:

```bash
npm run handoffs:index
```

## What this directory is *not*

- **Not** Hounfour integration. Phase 9 stages the contract; the
  schema move happens later in `loa-hounfour` (rc.1 fired at
  squash SHA `c94bcd22`; v8.5.0 final shipped as
  `@0xhoneyjar/loa-hounfour@8.5.0`). Phase 16 records Jani's
  "accepted-with-adaptation" response on issue #70 and the
  post-intake upstream update — it is still docs / readiness
  only, not integration. The dependency flip to
  `@0xhoneyjar/loa-hounfour@^8.5.0` is **Phase 17**, a separate
  follow-up PR on Straylight's timeline; Phase 17's first attempt
  is a working-tree access probe whose findings are recorded in
  [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  and which does not, on its own, flip any wedge import.
  **Phase 19A** is an upstream-coordination summary of Phase 17B +
  Phase 18 staged in
  [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md);
  it is docs only and does not flip imports, change packages, or
  file the upstream comment on its own.
- **Not** Finn integration. Phase 10 stages the contract; the
  runtime-enforcement module ships later in `loa-finn`.
- **Not** Dixie integration. Phase 12 stages the contract; the
  governed-recall / BFF / inspection module ships later in
  `loa-dixie`.
- **Not** Freeside integration. Phase 14 stages the contract;
  the community / bot / admin / tenant / Discord / Telegram /
  REST / NATS module ships later in `loa-freeside`.
- **Not** sibling-repo coordination beyond an in-repo index.
  Phase 15 stages the cross-repo handoff index, implementation
  order, and no-go sequence inside `loa-straylight`; filing,
  opening, reviewing, or merging any sibling-repo PR remains a
  separate, future, sibling-repo event under teammate review.
- **Not** Recall Wedge implementation. Phase 20A is a docs /
  coordination decision-lock packet
  ([`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
  [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
  and the five ADRs under [`../decisions/`](../decisions/)
  ADR-020A through ADR-020E). It does not flip imports, change
  packages, wire any sibling repo, or scaffold any Phase 20B
  code on its own; the actual Phase 20B PR is a separate,
  future event under teammate review. **Phase 20B**
  ([`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md))
  is a **local scaffold** that pins ADR-020D's six receipt
  categories on the existing `executeRecall` pipeline; it is
  not runtime-wired, not Hounfour integration, not Finn / Dixie
  / Freeside wiring, and not the full Recall Wedge.
- **Not** a license to begin sibling work ahead of the schedule.
  Until the sibling repo's PR lands, the wedge owns every primitive
  the packets describe.
- **Not** a Phase 0–13 behavior change. The wedge runtime is
  unchanged. The handoffs are docs + fixtures, not behavior.

## Cross-references

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.2 (Hounfour), §6.2.3 (Finn), §6.2.4 (Dixie), §6.2.5
  (Freeside), §22.4 (Finn runtime epic), §22.5 (Dixie BFF
  epic), §22.7 (Freeside integration epic), §23.2 (proposed Finn
  directory layout).
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface that all three packets
  reference.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  fail-closed defenses all three packets pin against.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — the load-bearing class-vs-policy invariant. The packets enforce
  it from three sides (Hounfour ships shape; Finn enforces
  decisions; Dixie surfaces decisions to humans).
