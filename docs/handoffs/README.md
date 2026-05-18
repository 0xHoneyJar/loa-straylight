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

## Phase 20D — Recall Wedge endpoint-boundary packet

Phase 20D is a **narrow, in-repo endpoint-boundary planning packet**
staged on the `phase-20d-recall-wedge-endpoint-boundary` branch
inside `loa-straylight` after the Phase 20C demo / evidence packet.
It converts the Phase 20B / Phase 20C local Recall Wedge evidence
into a **future integration boundary** for a Dixie-hosted
recall-inspection candidate and a Finn-hosted runtime-context
fallback candidate, **without implementing either endpoint**.
Phase 20D is **endpoint-boundary planning only** — it is **not
endpoint-wired**, **not runtime-wired**, **not the full Recall
Wedge**, **not governed recall in Finn / Dixie / Freeside runtime**,
and **not Hounfour-side schema work**.

Phase 20D does **not** flip any wedge import, change `package.json` /
`package-lock.json`, change the Hounfour dependency range or resolved
patch, modify [`../../src/straylight/`](../../src/straylight/),
modify
[`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
or
[`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts),
wire any sibling-repo runtime, add a Dixie endpoint, add a Finn
endpoint, edit any sibling repo, implement `Challenge` or
`EstateTransition`, reach into unexported Hounfour internals, add a
`safeCanonicalize` subpath import, publish a public commitment root,
add a network surface, change persistence, or touch `.loa/` /
`.claude/`. It does **not** commit and does **not** open a PR. It
also does **not** add any new test, fixture, or `src/` module — the
Phase 20B per-category receipt pins and the Phase 20C demo-shape pin
already cover the local evidence this packet narrates.

| Document | Purpose |
|---|---|
| [`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md) | Phase 20D endpoint-boundary planning summary: executive summary (endpoint-boundary planning only; no endpoint implemented; no sibling repo edited; no runtime wiring), boundary model (`RecallRequest` / `RecallPack` / `RecallReceipt` plus the Phase 20C `audit_review` and `audit_chain_verification` projections as current evidence-backed contract candidates — *candidates*, not finalized cross-repo API schemas), Dixie-hosted recall-inspection candidate responsibilities (operator/admin inspection; should not become semantic owner; should not mutate estate state without an explicit transition path), Finn-hosted runtime-context fallback responsibilities (immediate model-context assembly; runtime policy + audit; should not define canonical Straylight semantics; should not bypass local receipt semantics), shared future contract candidate (input: actor/estate context, task/intent, environment frame, requested classes/scopes, caller/authority context; output: pack + receipt + audit-review + exclusion/redaction/challenge/revocation summaries + audit-chain verification; errors/denials: policy denied, invalid request, unavailable transition, missing competence, unsupported runtime host), ownership boundaries (Straylight owns semantics; Hounfour may own schema/protocol exports; Dixie may host inspection; Finn may host runtime; Freeside consumes; no sibling owns Phase 20D output), explicit non-scope (no Dixie endpoint, no Finn endpoint, no Freeside integration, no Hounfour schemas, no `Challenge`, no `EstateTransition`, no `safeCanonicalize` subpath, no public anchors, no persistence wiring, no package changes, no `src/` changes), what this packet does *not* claim, and what remains deferred. |

The Phase 20D packet consumes the Phase 20A decision-lock packet
([`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)),
the Phase 20A-staged candidate scope
([`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)),
the Phase 20B local-scaffold packet
([`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)),
the Phase 20C demo / evidence packet
([`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)),
the five ADR-020-series decision-locks under
[`../decisions/`](../decisions/), the Phase 10 Finn packet
([`finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md),
[`finn-runtime-boundary.md`](./finn-runtime-boundary.md),
[`finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)),
the Phase 12 Dixie packet
([`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
[`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
[`dixie-recall-mapping.md`](./dixie-recall-mapping.md)), and the
existing Recall Wedge implementation under
[`../../src/straylight/`](../../src/straylight/) (read-only). It
produces no fixture changes, no runtime changes, no script changes,
no test additions, no package changes, and no new sibling-repo
handoff packets. The four filed sibling-repo issue rows above
(Hounfour / Finn / Dixie / Freeside) are unchanged by Phase 20D.

Validate locally:

```bash
npm run typecheck
npm test
```

## Phase 20E — Recall Wedge closeout packet

Phase 20E is a **narrow, in-repo closeout packet** staged on the
`phase-20e-recall-wedge-closeout` branch inside `loa-straylight`
after the Phase 20D endpoint-boundary planning packet. It closes
the Phase 20 Recall Wedge **pre-integration** lane by summarizing
what Phases 20A, 20B, 20C, and 20D established locally, what
remains unimplemented, and what must be true before Phase 21
endpoint / runtime integration begins. Phase 20E is **closeout
only** — it is **not endpoint-wired**, **not runtime-wired**,
**not the full Recall Wedge**, **not governed recall in Finn /
Dixie / Freeside runtime**, and **not Hounfour-side schema work**.
**No endpoint / runtime integration is authorized by this packet.**

Phase 20E does **not** flip any wedge import, change `package.json`
/ `package-lock.json`, change the Hounfour dependency range or
resolved patch, modify [`../../src/straylight/`](../../src/straylight/),
modify
[`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
or
[`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts),
wire any sibling-repo runtime, add a Dixie endpoint, add a Finn
endpoint, edit any sibling repo, implement `Challenge` or
`EstateTransition`, reach into unexported Hounfour internals, add a
`safeCanonicalize` subpath import, publish a public commitment root,
add a network surface, change persistence, or touch `.loa/` /
`.claude/`. It does **not** commit and does **not** open a PR. It
also does **not** add any new test, fixture, script, or `src/`
module — the Phase 20B per-category receipt pins and the Phase 20C
demo-shape pin already cover the local evidence this packet
narrates.

| Document | Purpose |
|---|---|
| [`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md) | Phase 20E closeout summary: executive summary (closeout only; Phase 20 local Recall Wedge prep complete; no endpoint / runtime integration authorized), Phase 20 recap (20A decision-lock; 20B local `executeRecall` behavior pinned; 20C local demo / evidence output shape pinned; 20D endpoint-host boundary documented), what is locally proven (`RecallRequest` / `RecallPack` / `RecallReceipt` / `audit_review` / `audit_chain_verification` shape evidence-backed; local recall behavior pinned by tests; local demo evidence reproducible; endpoint-host candidates and integration boundary documented), what is not proven (no Dixie endpoint, no Finn runtime integration, no Freeside integration, no Hounfour Straylight schemas, no `Challenge` or `EstateTransition` implementation, no public anchor / commitment-root implementation, no production persistence wired, no governed recall in sibling-runtime production surfaces), Phase 21 entry conditions (Hounfour / Jani feedback received or teammate review approves proceeding; endpoint host selected; schema ownership boundary reaffirmed; runtime persistence / audit owner reaffirmed; non-scope remains explicit), Phase 21 non-go conditions (Hounfour feedback still pending and no teammate review approves proceeding → do not begin endpoint / runtime wiring; endpoint host still ambiguous → do not wire Dixie or Finn; schema ownership still ambiguous → do not add Hounfour schemas; `Challenge` / `EstateTransition` still deferred → do not implement them locally), explicit non-scope (no `src/` changes, no tests, no scripts, no package changes, no Dixie endpoint, no Finn endpoint, no Freeside integration, no Hounfour schemas, no `Challenge`, no `EstateTransition`, no `safeCanonicalize` work, no public anchors, no persistence wiring, no sibling repo edits), what this packet does *not* claim, and validation evidence. |

The Phase 20E packet consumes the Phase 20A decision-lock packet
([`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)),
the Phase 20A-staged candidate scope
([`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)),
the Phase 20B local-scaffold packet
([`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)),
the Phase 20C demo / evidence packet
([`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md)),
the Phase 20D endpoint-boundary packet
([`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md)),
the five ADR-020-series decision-locks under
[`../decisions/`](../decisions/), the Phase 19A upstream-review
packet
([`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md))
that pins the load-bearing pending feedback for Phase 21 entry,
and the existing Recall Wedge implementation under
[`../../src/straylight/`](../../src/straylight/) (read-only). It
produces no fixture changes, no runtime changes, no script changes,
no test additions, no package changes, and no new sibling-repo
handoff packets. The four filed sibling-repo issue rows above
(Hounfour / Finn / Dixie / Freeside) and the prior Phase 20A /
Phase 20B / Phase 20C / Phase 20D in-repo rows are unchanged by
Phase 20E.

Validate locally:

```bash
npm run typecheck
npm test
```

## Phase 21B — Hounfour v8.6 schema-readiness lock

Phase 21B is a **narrow, in-repo schema-readiness lock packet**
staged on the `phase-21b-v86-schema-readiness-lock` branch inside
`loa-straylight` after the Phase 21A `@0xhoneyjar/loa-hounfour@^8.6.0`
dependency intake. It maps the actually-exported v8.6.0 surface
(eleven JS module subpaths plus the `./schemas/*` file-level
subpath, against
[`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt))
to the Straylight Recall Wedge MVP primitive set — answering, in
one packet, which v8.6.0 exports are now safe upstream substrate
(notably `challenge.schema.json`, which closes Phase 16 delta #7),
which Straylight primitives still are not confirmed exported
Hounfour contracts (`EstateTransition`, `AuditEvent` under that
name, the `safeCanonicalize` JS subpath), which items remain
deferred locally, which gaps are runtime-integration blockers
versus non-blocking discovery notes, and what shape Phase 22
should take. Phase 21B is **schema-readiness lock only** — it is
**not endpoint-wired**, **not runtime-wired**, **not the full
Recall Wedge**, **not governed recall in Finn / Dixie / Freeside
runtime**, and **not Hounfour-side schema work**. **No endpoint /
runtime integration is authorized by this packet.**

Phase 21B does **not** flip any wedge import, change `package.json`
/ `package-lock.json`, change the Hounfour dependency range or
resolved patch, modify [`../../src/straylight/`](../../src/straylight/),
modify any script under [`../../scripts/`](../../scripts/), wire
any sibling-repo runtime, add a Dixie endpoint, add a Finn
endpoint, edit any sibling repo, implement `Challenge` locally,
implement `EstateTransition` locally, reach into unexported
Hounfour internals, add a `safeCanonicalize` subpath import,
publish a public commitment root, add a network surface, change
persistence, add or modify any test, add or modify any fixture,
or touch `.loa/` / `.claude/`. It does **not** commit and does
**not** open a PR.

| Document | Purpose |
|---|---|
| [`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md) | Phase 21B readiness-lock summary: executive summary (schema-readiness lock only; v8.6.0-shipped substrate mapped to Straylight Recall Wedge primitives; no endpoint / runtime integration authorized), v8.6 inherited dependency state recap (consumes `^8.6.0`; resolves to `8.6.0`; `Challenge` shipped; `EstateTransition` queued; `safeCanonicalize` subpath gated), v8.6.0 exported surface table (11 JS module subpaths + `./schemas/*` file-level subpath; `./canonicalize` and `./utilities` confirmed absent), Q1 — v8.6 surface now safe as shipped upstream substrate (9 MATCH + 1 EXTEND dispositions resolved against `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`; `challenge.schema.json` newly resolved at v8.6.0 closing Phase 16 delta #7), Q2 — Straylight MVP primitives still not confirmed exported Hounfour contracts (`EstateTransition` schema absent; `AuditEvent` not shipped under that name; `safeCanonicalize` JS subpath absent), Q3 — items remaining deferred locally (`EstateTransition` semantics; canonicalization; `audit-event-transition` resolution path; `policy-decision-denied` candidate disposition; public anchoring per ADR-020E; production persistence per ADR-020D; sibling-repo runtime wiring; endpoint-host placement; `Challenge` adoption into the public surface), Q4 — blocker classification (blockers: `EstateTransition` absence; `safeCanonicalize` subpath absence; Phase 19A pending feedback; ADR-020B endpoint-host unselected; ADR-020A semantic-ownership reaffirmation missing for Phase 21; non-blocking discovery notes: `audit-event-transition`; `policy-decision-denied`; cosmetic alias decisions; eleven unconsumed JS subpaths), Q5 — Phase 22 recommendation (recommended: local schema/readiness work *or* a drafted-not-filed Hounfour status comment for issue #70; not authorized: Finn boundary prep, Dixie boundary prep; not preferred but allowable: no code work), explicit non-scope, what this packet does *not* claim, validation evidence (`npm run typecheck`, `npm test`, `npm run hounfour:shadow-inspect`). |

The Phase 21B packet consumes the Phase 21A v8.6.x shadow
inspection output
([`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)),
the Phase 21A test-pin refresh
([`../../tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts)),
the Phase 19A upstream-review packet
([`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md))
that pins the load-bearing pending feedback gate this readiness
lock does not satisfy, the Phase 16 adaptation-delta and
response-intake packets
([`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
[`hounfour-response-intake.md`](./hounfour-response-intake.md)),
the Phase 20A decision-lock packet
([`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md))
and Phase 20B–E packets, the five ADR-020-series decision-locks
under [`../decisions/`](../decisions/), and the existing Recall
Wedge implementation under
[`../../src/straylight/`](../../src/straylight/) (read-only). It
produces no fixture changes, no runtime changes, no script
changes, no test additions, no package changes, and no new
sibling-repo handoff packets. The four filed sibling-repo issue
rows above (Hounfour / Finn / Dixie / Freeside) and the prior
Phase 20A / Phase 20B / Phase 20C / Phase 20D / Phase 20E in-repo
rows are unchanged by Phase 21B.

Validate locally:

```bash
npm run typecheck
npm test
npm run hounfour:shadow-inspect
```

## Phase 22A — MVP decision-lock packet

Phase 22A is a **narrow, in-repo MVP decision-lock packet** staged
on the `phase-22a-mvp-decision-lock` branch inside
`loa-straylight` after the Phase 21B v8.6 schema-readiness lock.
It converts the v8.6.0 substrate Phase 21B mapped plus the Phase
20E entry conditions Phase 21B did not discharge into five
explicit decision-locks before any Phase 22 implementation
branch opens — Straylight semantic home (post-v8.6
reaffirmation), MVP endpoint host (Dixie preferred; Finn
fallback) with seven explicit decision criteria, schema
dependency direction (Hounfour substrate → Straylight semantic
contract → Finn / Dixie consume → Freeside consumes; acyclic;
wedge public surface as the cut), MVP persistence + audit /
receipt owner (Loa-Straylight; Phase 5 hardening invariants
elevated to MVP host contract; in-process persistence at MVP),
and a deferred-features list (twenty gates, each with a current
state and a trigger). It also drafts (without filing) a Hounfour
status comment for issue #70 asking for status on the residual
gates (`EstateTransition` schema, `safeCanonicalize` exported
subpath). Phase 22A is **MVP decision-lock only** — it is **not
endpoint-wired**, **not runtime-wired**, **not the full Recall
Wedge**, **not governed recall in Finn / Dixie / Freeside
runtime**, and **not Hounfour-side schema work**. **No endpoint /
runtime integration is authorized by this packet.**

Phase 22A does **not** flip any wedge import, change `package.json`
/ `package-lock.json`, change the Hounfour dependency range or
resolved patch, modify [`../../src/straylight/`](../../src/straylight/),
modify any script under [`../../scripts/`](../../scripts/), wire
any sibling-repo runtime, add a Dixie endpoint, add a Finn
endpoint, edit any sibling repo, implement `Challenge` locally,
implement `EstateTransition` locally, reach into unexported
Hounfour internals, add a `safeCanonicalize` subpath import,
publish a public commitment root, add a network surface, change
persistence, add or modify any test, add or modify any fixture,
**file** the drafted Hounfour status comment, or touch `.loa/` /
`.claude/`. It does **not** commit and does **not** open a PR.

| Document | Purpose |
|---|---|
| [`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md) | Phase 22A summary handoff: executive summary (MVP decision-lock only; no endpoint / runtime integration authorized; successful v8.6 intake does not authorize Finn / Dixie / Freeside runtime wiring), v8.6 inherited state recap, the five ADR-022-series decision-locks summarized one row each (semantic home; MVP endpoint host with Dixie-preferred / Finn-fallback / Freeside-not-a-host criteria; schema dependency direction graph; persistence + audit / receipt owner with Phase 5 hardening invariants elevated to MVP host contract; twenty-row deferred-features list), decision area 6 (Hounfour status comment — yes, drafted in-repo, not filed), Phase 22 entry conditions and non-go conditions, explicit non-scope, what this packet does *not* claim, validation evidence (`npm run typecheck`, `npm test`). |
| [`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md) | Drafted-not-filed Hounfour status comment for [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70). Asks for **status** on `EstateTransition` (delta #8) and the `safeCanonicalize` exported subpath (`no-confirmed-subpath`). Explicitly does **not** claim v8.6.0 satisfies the Phase 19A pending feedback gate, does **not** claim `Challenge` is adopted into the Loa-Straylight public surface, does **not** claim any sibling-repo runtime is wired, and does **not** claim the alias boundary has changed. Includes a filing checklist for the human reviewer. **Filing is a separate, sibling-repo, human-reviewed event** — Phase 22A drafts only. |

The Phase 22A packet consumes the Phase 21B schema-readiness lock
([`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md))
that constrains Phase 22's allowable shapes, the Phase 21A
v8.6.x shadow inspection output
([`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)),
the Phase 19A upstream-review packet
([`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md))
that pins the load-bearing pending feedback gate this decision
lock does not satisfy, the Phase 16 adaptation-delta and
response-intake packets
([`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
[`hounfour-response-intake.md`](./hounfour-response-intake.md)),
the Phase 20A decision-lock packet
([`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md))
and Phase 20B–E packets, the five ADR-020-series decision-locks
under [`../decisions/`](../decisions/) (Phase 22A succeeds them
without superseding), and the existing Recall Wedge implementation
under [`../../src/straylight/`](../../src/straylight/) (read-only).
It produces five new ADR-022-series decision-locks under
[`../decisions/`](../decisions/) plus the two handoff docs above.
It produces no fixture changes, no runtime changes, no script
changes, no test additions, no package changes, and no new
sibling-repo handoff packets. The four filed sibling-repo issue
rows above (Hounfour / Finn / Dixie / Freeside) and the prior
Phase 20A / Phase 20B / Phase 20C / Phase 20D / Phase 20E /
Phase 21B in-repo rows are unchanged by Phase 22A.

The five Phase 22A ADRs:

- [`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md)
- [`../decisions/ADR-022B-mvp-endpoint-host.md`](../decisions/ADR-022B-mvp-endpoint-host.md)
- [`../decisions/ADR-022C-schema-dependency-direction.md`](../decisions/ADR-022C-schema-dependency-direction.md)
- [`../decisions/ADR-022D-mvp-persistence-and-audit-owner.md`](../decisions/ADR-022D-mvp-persistence-and-audit-owner.md)
- [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)

Validate locally:

```bash
npm run typecheck
npm test
```

## Phase 23A — MVP schema-contract draft packet

Phase 23A is a **narrow, in-repo MVP schema-contract draft
packet** staged on the `phase-23a-mvp-schema-contract-draft`
branch inside `loa-straylight` after the Phase 22A MVP
decision-lock and after the Phase 22A-drafted Hounfour status
comment was filed on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70#issuecomment-4413876047)
by the user as a separate sibling-repo human-reviewed event.
It converts the v8.6.0 substrate Phase 21B mapped, the five
Phase 22A decision-locks (ADR-022A–E), and the Phase 22A
deferred-features list into a per-object MVP schema-contract
draft (fourteen objects: `Actor`, `ActorEstate`, `Assertion`,
`SignatureEnvelope`, `Keyring`, `PolicyDecision`,
`EstateTransition`, `Challenge`, `Revocation`, `RecallRequest`,
`RecallPack`, `RecallReceipt`, `AuditEvent`, optional
`CommitmentRoot`) and an eleven-vector MVP conformance matrix
— **without authoring any schema, fixture, or test**. Phase 23A
is **MVP schema-contract draft only** — it is **not
endpoint-wired**, **not runtime-wired**, **not the full Recall
Wedge**, **not governed recall in Finn / Dixie / Freeside
runtime**, **not Hounfour-side schema work**, and **not
schema-authoring**. **No endpoint / runtime integration is
authorized by this packet, and no schema is authored.**

Phase 23A does **not** flip any wedge import, change `package.json`
/ `package-lock.json`, change the Hounfour dependency range or
resolved patch, modify [`../../src/straylight/`](../../src/straylight/),
modify any script under [`../../scripts/`](../../scripts/), wire
any sibling-repo runtime, add a Dixie endpoint, add a Finn
endpoint, edit any sibling repo, implement `Challenge` locally,
implement `EstateTransition` locally, reach into unexported
Hounfour internals, add a `safeCanonicalize` subpath import,
publish a public commitment root, add a network surface, change
persistence, add or modify any test, add or modify any fixture,
author any TypeBox / JSON Schema, **file** any GitHub issue or
comment, or touch `.loa/` / `.claude/`. It does **not** commit
and does **not** open a PR.

| Document | Purpose |
|---|---|
| [`phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md) | Phase 23A summary handoff: executive summary (MVP schema-contract draft only; no schema authored; no endpoint / runtime integration authorized; the Hounfour status comment for issue #70 was filed before Phase 23A by the user as an open status request, not an answer), v8.6 inherited state recap with the comment-filed delta, minimum MVP object contract list (fourteen one-line rows summarizing the per-object spec), conformance-vector matrix summary (eleven one-line rows summarizing the per-vector spec), blockers vs non-blockers tables (five runtime-integration blockers; four non-blocking discovery notes), next-phase recommendation (Scenario A — wait for Hounfour answer; Scenario B — local semantic-contract scaffolding only with `EstateTransition` and `safeCanonicalize` deferred; default — Phase 23B does not open), Phase 23 entry / non-go conditions, explicit non-scope, what this packet does *not* claim, validation evidence (`npm run typecheck`, `npm test`). |
| [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md) | Phase 23A primary deliverable — the per-object MVP schema-contract draft. Pins a five-tier status taxonomy (shipped upstream / safe draft / blocked / deferred / discovery note) that separates *shape availability* from *adoption authorization*. For each of the fourteen MVP objects: purpose, minimum required fields, class-validation role, policy-validation relationship, signer/keyring relationship, recall/audit relationship, current Phase 23A status, and likely future Hounfour `$id` (under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`) *or* Straylight-local export name. Closes with summary tables (semantic owner / status / Hounfour name; lane assignment) and explicit non-claims. |
| [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md) | Phase 23A companion deliverable — the eleven-vector MVP conformance matrix. Each vector pins schema(s) exercised, lane(s) on which the decision is made (`class_validation` / `policy_validation` / `audit_validation` / `keyring_validation`), expected outcome at the wedge MVP, matching ADR / Phase-21B / Phase-22A pin, and Phase 23A status. Vectors 1–8 cover safe-draft scenarios (valid observation admission; invalid missing provenance; valid reflection but not identity promotion; revoked assertion excluded from recall; private assertion excluded from public Discord recall; contested assertion marked or excluded; unknown signer denied; valid signer but not competent denied). Vector 9 demonstrates that the upstream `challenge.schema.json` shipped at v8.6.0 *can* describe a wedge `Challenge` without adoption. Vectors 10 and 11 are explicit gates: `EstateTransition` deferred (Hounfour delta #8 still queued) and `safeCanonicalize` absent exported subpath (gate `no-confirmed-subpath`). The Phase 8 schema-candidate-layer vector pack remains the load-bearing precursor; Phase 23A's matrix sits at the wedge MVP layer on top of it. |

The Phase 23A packet consumes the Phase 22A MVP decision-lock
([`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md))
and its five ADRs ([`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md)
through
[`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md))
that constrain Phase 23's allowable shapes, the Phase 22A drafted
Hounfour status comment
([`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md))
**which has now been filed on issue #70 by the user** as a
separate human-reviewed event (the filed comment is a status
request, not an answer to the Phase 19A pending feedback gate),
the Phase 21B schema-readiness lock
([`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md)),
the Phase 21A v8.6.x shadow inspection output
([`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)),
the Phase 19A upstream-review packet
([`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md))
that pins the load-bearing pending feedback gate this packet
does not satisfy, the Phase 16 adaptation-delta and
response-intake packets
([`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
[`hounfour-response-intake.md`](./hounfour-response-intake.md)),
the Phase 20A decision-lock packet and the five ADR-020-series
decision-locks under [`../decisions/`](../decisions/), the
Phase 6 per-candidate inventory
([`../schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md))
and the Phase 8 schema-candidate-layer conformance vectors
([`../schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md))
as load-bearing precursors at the schema layer, the
class-vs-policy boundary doc
([`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md))
that pins the per-lane separation Phase 23A reuses, and the
existing Recall Wedge implementation under
[`../../src/straylight/`](../../src/straylight/) (read-only).
It produces two new spec docs under
[`../specs/`](../specs/), this summary handoff, and an updated
README index entry. It produces no fixture changes, no runtime
changes, no script changes, no test additions, no package
changes, no new ADR, and no new sibling-repo handoff packets.
The four filed sibling-repo issue rows above (Hounfour / Finn /
Dixie / Freeside) and the prior Phase 20A / 20B / 20C / 20D /
20E / 21B / 22A in-repo rows are unchanged by Phase 23A.

Validate locally:

```bash
npm run typecheck
npm test
```

## Phase 24A — Hounfour #116 intake + next-host decision packet

Phase 24A is a **narrow, in-repo intake + decision-lock packet**
staged on the `phase-24a-hounfour-recall-wedge-intake` branch
inside `loa-straylight` after Hounfour PR
[`0xHoneyJar/loa-hounfour#116`](https://github.com/0xHoneyJar/loa-hounfour/pull/116)
merged to Hounfour `main`. PR #116 is a Hounfour-side substrate
event: it registered the `0xhoneyjar:straylight:*` audit-event
prefix family upstream, registered `recall-wedge` as a
conformance category upstream, added an upstream
`docs/architecture/recall-wedge-composition.md`, added a five-step
recall-wedge conformance corpus upstream, added recall-wedge
vector tests upstream, and regenerated the Hounfour
`schema/dist/release-integrity` outputs — while preserving the
Hounfour boundary explicitly (schema / protocol / conformance
only, no Straylight runtime wired upstream). Phase 24A intakes
that substrate event, updates the Hounfour dependency / status
ledger, pins the resulting package-release ambiguity discipline,
places the next MVP host (Dixie-first, recall-pack-inspection-
first), and scopes the next implementation branch
(`phase-24b-*`, local additive scaffolding only) — **without
authoring any schema, fixture, or test, without flipping any
import, and without bumping the Hounfour dependency range**.
Phase 24A is **intake + decision-lock only** — it is **not
endpoint-wired**, **not runtime-wired**, **not the full Recall
Wedge**, **not governed recall in Finn / Dixie / Freeside
runtime**, **not Hounfour-side schema work**, **not Hounfour
`main` consumption**, and **not schema-authoring**. **No
endpoint / runtime integration is authorized by this packet, no
schema is authored, and no Hounfour dependency-range bump is
performed.**

Phase 24A does **not** flip any wedge import, change
`package.json` / `package-lock.json`, change the Hounfour
dependency range or resolved patch, consume Hounfour `main` or
any unpublished commit, modify [`../../src/straylight/`](../../src/straylight/),
modify any script under [`../../scripts/`](../../scripts/), wire
any sibling-repo runtime, add a Dixie endpoint, add a Finn
endpoint, edit any sibling repo, implement `Challenge` locally,
implement `EstateTransition` locally, reach into unexported
Hounfour internals (including internals that only exist on
`main`), add a `safeCanonicalize` subpath import, publish a
public commitment root, add a network surface, change
persistence, add or modify any test, add or modify any fixture,
author any TypeBox / JSON Schema, **file** any GitHub issue or
comment, or touch `.loa/` / `.claude/`. It does **not** commit
and does **not** open a PR.

| Document | Purpose |
|---|---|
| [`phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md) | Phase 24A summary handoff: executive summary (intake + decision-lock only; Dixie-first host placed; package-release ambiguity disciplined; Phase 24B scope defined as local additive scaffolding only; no endpoint / runtime / schema-authoring authorized), v8.6-plus-#116 inherited state recap, Hounfour dependency / status ledger (one-line view), blockers vs non-blockers tables (four runtime-integration blockers; six non-blocking discovery notes), next-phase recommendation (`phase-24b-*` allowable scope + hard non-scope; behavior if a Hounfour release publishes #116 outputs mid-Phase-24B; behavior if Phase 19A feedback for issue #70 arrives), Phase 24 entry / non-go conditions, explicit non-scope, what this packet does *not* claim, validation evidence (`npm run typecheck`, `npm test`). |
| [`hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md) | Phase 24A per-component intake doc: records the merge event of `0xHoneyJar/loa-hounfour#116`, per-component summary of what #116 added Hounfour-side (registered `0xhoneyjar:straylight:*` audit-event prefix family; registered `recall-wedge` conformance category; added `docs/architecture/recall-wedge-composition.md` upstream; added the five-step recall-wedge conformance corpus; added the recall-wedge vector tests; regenerated `schema/dist/release-integrity` outputs), Hounfour boundary preservation note (schema / protocol / conformance only — no Straylight runtime wired upstream), Hounfour dependency / status ledger (21-row table updated for Phase 24A), package-release ambiguity (Hounfour `main` may include #116 before a GitHub Packages release exists), anti-collapse rules preserved, and what this intake does *not* claim. |
| [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md) | Phase 24A substrate-intake decision-lock: reaffirms Loa-Straylight as semantic / control-plane owner post-#116; pins that the `0xhoneyjar:straylight:*` audit-event prefix family is Straylight-owned even though registered upstream; pins that the `recall-wedge` conformance category is Straylight-defined even though registered upstream; pins that the Hounfour five-step conformance corpus is upstream test substrate, not Straylight runtime substrate; preserves all anti-collapse rules (class-vs-policy, receipt-or-audit, Hounfour-substrate-not-owner, `PolicyDecision`-wedge-only, no-reach-into-unexported-internals, no-silent-adoption); ADR-022E gates #1 / #2 / #4 / #5 unchanged. |
| [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md) | Phase 24A MVP host selection: tightens ADR-022B's criteria + preference (Dixie default; Finn fallback) into a **placement** — Dixie-first (recall-pack-inspection-first). Rationale: the next Straylight slice is governed recall / recall-pack inspection / provenance / receipt behavior, not runtime action enforcement; the recall-pack-inspection MVP shape is shape (b) under ADR-022B criterion #2 and satisfies all seven ADR-022B criteria without triggering ADR-022E gates #1 or #2. Finn remains the later runtime collaborator / enforcement boundary; Freeside remains the later community / app surface consumer; Hounfour remains schema / protocol / conformance substrate only. No endpoint is wired by Phase 24A. |
| [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md) | Phase 24A package-release ambiguity discipline: Straylight consumes only published GitHub Packages releases of `@0xhoneyjar/loa-hounfour`. Hounfour `main`, commit-SHA pins, git-source dependencies, and Hounfour `dist/` paths that only exist on `main` are all refused. The currently-pinned range stays `^8.6.0`; the currently-resolved patch stays `8.6.0`. Adopting #116's outputs requires three independent events (Event A: Hounfour publishes a release including the #116 outputs; Event B: a separate ADR adopts the new range; Event C: a shadow-integration check); each necessary, none sufficient. Phase 24A pre-authorizes none of them and drafts no coordination signal asking for a release. |
| [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md) | Phase 24A Phase 24B implementation-branch scope: defines `phase-24b-*` as **local additive scaffolding inside `loa-straylight` only**. Allowable scope: additive TypeScript types pinning the recall-pack-inspection MVP host contract; additive tests exercising vectors 1–8 of the Phase 23A eleven-vector matrix via locally-owned shapes; additive fixtures; additive docs under `docs/handoffs/` / `docs/specs/` / `docs/decisions/`; a Dixie-side handoff packet refresh (in-repo only). Hard non-scope: no `package.json` / `package-lock.json` change; no Hounfour `main` / commit-SHA / git-source consumption; no endpoint in `loa-straylight`; no sibling-repo edits; no schema authoring; no `Challenge` / `EstateTransition` / `safeCanonicalize` / `AuditEvent`-rename adoption; no public commitment-root publication; no persistence wiring beyond the MVP adapters; no adoption of the `0xhoneyjar:straylight:*` prefix family or `recall-wedge` conformance category on the strength of #116 alone; no import of the Hounfour five-step conformance corpus; no `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` edits; no GitHub-side action. Phase 24A does **not** open `phase-24b-*`. |

The Phase 24A packet consumes the Phase 23A MVP schema-contract
draft
([`phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md))
and its two spec docs
([`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md),
[`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md)),
the Phase 22A MVP decision-lock
([`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md))
and its five ADRs
([`../decisions/ADR-022A-straylight-semantic-home.md`](../decisions/ADR-022A-straylight-semantic-home.md)
through
[`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md))
that constrain Phase 24's allowable shapes, the Phase 22A drafted
Hounfour status comment
([`hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md))
filed by the user before Phase 23A as a separate human-reviewed
event (the filed comment remains an open status request, not an
answer to the Phase 19A pending feedback gate), the Phase 21B
schema-readiness lock
([`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md)),
the Phase 21A v8.6.x shadow-inspection output
([`hounfour-v86-shadow-inspection-output.txt`](./hounfour-v86-shadow-inspection-output.txt)),
the Phase 19A upstream-review packet
([`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md))
that pins the load-bearing pending feedback gate this packet
does not satisfy, the Phase 16 / 17B intake precedents
([`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
[`hounfour-response-intake.md`](./hounfour-response-intake.md),
[`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md),
[`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md))
that Phase 24A inherits the boundary discipline from, the
Phase 20A decision-lock packet and the five ADR-020-series
decision-locks under [`../decisions/`](../decisions/), the
class-vs-policy boundary doc
([`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md))
that pins the per-lane separation Phase 24A reuses, and the
existing Recall Wedge implementation under
[`../../src/straylight/`](../../src/straylight/) (read-only). It
produces this summary handoff, the per-component intake doc, the
four Phase 24A ADRs, and this README index entry. It produces no
fixture changes, no runtime changes, no script changes, no test
additions, no package changes, no new spec doc, no new
sibling-repo handoff packet, and no GitHub-side action. The four
filed sibling-repo issue rows above (Hounfour / Finn / Dixie /
Freeside) and the prior Phase 20A / 20B / 20C / 20D / 20E / 21B /
22A / 23A in-repo rows are unchanged by Phase 24A.

Validate locally:

```bash
npm run typecheck
npm test
```

## Phase 24B — Dixie recall-host plan packet

Phase 24B is a **narrow, in-repo docs/spec packet** staged on the
`phase-24b-dixie-recall-host-plan` branch inside `loa-straylight`
after Phase 24A's ADR series (ADR-024A–D) and intake doc merged.
Phase 24B locks the **Straylight↔Dixie wire-shape** the
recall-pack-inspection MVP host targets, the **Dixie↔Finn
boundary** for this slice (Finn out), the **package-release
gate** for Hounfour-#116-derived contracts (re-anchored to
ADR-024C), the **validation / demo plan** at the host inspection
layer, and the **next implementation branch**
(`phase-24c-dixie-recall-host-scaffold`) — **without authoring
any schema, fixture, or test, without flipping any import, and
without bumping the Hounfour dependency range**. Phase 24B is
**docs/spec only** — it is **not endpoint-wired**, **not
runtime-wired**, **not the full Recall Wedge**, **not governed
recall in Finn / Dixie / Freeside runtime**, **not Hounfour-side
schema work**, and **not Hounfour-package consumption beyond
the existing `^8.6.0` published range**. **No endpoint /
runtime integration is authorized by this packet, no schema is
authored, no test is added, no fixture is added, and no
Hounfour dependency-range bump is performed.**

Phase 24B does **not** flip any wedge import, change
`package.json` / `package-lock.json`, change the Hounfour
dependency range or resolved patch, consume Hounfour `main` or
any unpublished commit, modify [`../../src/straylight/`](../../src/straylight/),
modify any script under [`../../scripts/`](../../scripts/), wire
any sibling-repo runtime, add a Dixie endpoint, add a Finn
endpoint, edit any sibling repo, implement `Challenge` locally,
implement `EstateTransition` locally, reach into unexported
Hounfour internals, add a `safeCanonicalize` subpath import,
publish a public commitment root, add a network surface, change
persistence, add or modify any test, add or modify any fixture,
author any TypeBox / JSON Schema, **file** any GitHub issue or
comment, or touch `.loa/` / `.claude/` / `.beads/` / `.run/` /
`.github/`. It does **not** commit and does **not** open a PR.

| Document | Purpose |
|---|---|
| [`phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md) | Phase 24B summary handoff: executive summary (Dixie-first; recall-pack-inspection-first; six in-slice host surfaces; vectors 1–8 reframed at host layer; vector 9 not in slice / cross-reference only per ADR-024D §3.b; vectors 10/11 remain gates; no test / fixture / schema authored by Phase 24B), v8.6-plus-#116-plus-Phase-24A inherited state recap with the Phase 24B deltas, the eight required definitional points (host plan; minimum slice; Straylight primitives; Straylight↔Dixie boundary; Dixie↔Finn boundary; package-release gate; validation / demo plan; next implementation branch), Straylight↔Dixie boundary, Dixie↔Finn boundary, Freeside disposition, Hounfour disposition, package-release gate (Event A + Event B + Event C; each necessary, none sufficient), validation / demo plan (no new tests; no new fixtures; host demo evidence produced in a later phase), next implementation branch (`phase-24c-dixie-recall-host-scaffold`) with entry / non-go conditions, blockers vs non-blockers tables (four runtime-integration blockers; six non-blocking discovery notes), explicit non-scope, what this packet does *not* claim, validation evidence (`npm run typecheck`, `npm test`). |
| [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md) | Phase 24B decision-lock: pins the Straylight↔Dixie wire-shape (shape (b) of ADR-022B criterion #2 — precomputed `RecallPack` + `RecallReceipt` inspected by Dixie; no `executeRecall` at the host); the minimum MVP slice (recall-pack inspection / provenance / receipt display — not generic retrieval); the exact in-slice Straylight primitives; the Straylight↔Dixie boundary (wedge produces; host inspects); the Dixie↔Finn boundary (Finn out of this slice; later runtime / enforcement collaborator only); the package-release gate for Hounfour-#116-derived contracts (re-anchored to ADR-024C: Event A + Event B + Event C); and the next implementation branch (`phase-24c-dixie-recall-host-scaffold`) with allowable scope, hard non-scope, entry conditions, and non-go conditions. |
| [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) | Phase 24B primary spec — per-Dixie-surface MVP host contract. Six in-slice surfaces (recall intake & response; receipt retrieval & display; excluded-assertion reason display; provenance inspection; audit-chain lookup; estate summary), each with purpose, wedge primitive(s) inspected, TypeScript-style request/response shape (no schema authored), fail-closed posture, Phase 24A non-scope preserved. Appendices: (A) exact Straylight primitives in-slice — all wedge-owned, already shipped under [`../../src/straylight/`](../../src/straylight/); (B) out-of-slice primitives (`Challenge` / `EstateTransition` / `safeCanonicalize` / `AuditEvent` rename / `Commitment` publication / `0xhoneyjar:straylight:*` adoption / `recall-wedge` adoption / corpus import / sibling-repo wiring / dependency bumps), each pinned to its ADR gate; (C) mapping to Phase 12 Dixie surfaces (six in-slice; rest deferred to a later slice). |
| [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md) | Phase 24B companion spec — per-vector validation matrix at the host inspection layer. Phase 23A vectors 1–8 reframed against the six host surfaces (vector 9 not in slice / cross-reference only per ADR-024D §3.b) and the six receipt categories (`included` / `excluded` / `redacted` / `challenged` / `revoked` / `blocked-by-policy`). Vectors 10 (`EstateTransition` on the wire) and 11 (`safeCanonicalize` on the wire) explicitly remain gates — **not** exercised by Phase 24B or by `phase-24c-dixie-recall-host-scaffold`. Demo plan: no new tests in Phase 24B; no new fixtures in Phase 24B; host demo-evidence packet produced in a later phase (by `phase-24c-*` under ADR-024D §3.a–c or by a successor demo-evidence phase). Layer separation re-pinned: Phase 8 schema-candidate-layer + Phase 23A wedge-runtime-layer + Phase 24B host-inspection-layer are coordinate, not subordinate. |
| [`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md) (Phase 24B refresh appended) | Phase 12 boundary doc with a Phase 24B append-only section. Pins the four-lane disposition for the recall-pack-inspection MVP slice (class lane unchanged; primitive lane load-bearing for Phase 24B; runtime lane out of slice; governed-recall lane targeted for Phase 24B), the Straylight↔Dixie boundary, and the Dixie↔Finn boundary. Existing Phase 12 prose unchanged. |
| [`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md) (Phase 24B refresh appended) | Phase 12 issue handoff with a Phase 24B append-only section. Pins the Phase 24B MVP shape (recall-pack-inspection-first; six in-slice surfaces; vectors 1–8 reframed at host layer, vector 9 not in slice / cross-reference only per ADR-024D §3.b, vectors 10–11 remain gates), what Phase 24B changes (a new ADR; two new specs; a summary handoff; three append-only refreshes), what Phase 24B does *not* change (Phase 12 prose; wedge public API; `package.json`; sibling repos), the package-release gate, and the next implementation branch. Existing Phase 12 prose unchanged. |
| [`dixie-recall-mapping.md`](./dixie-recall-mapping.md) (Phase 24B refresh appended) | Phase 12 mapping doc with a Phase 24B append-only section. Maps each in-slice Phase 24B host surface to its Phase 12 row; explicitly defers the remaining Phase 12 surfaces (assertion-status inspection; governance-record awareness; environment-frame routing; high-risk review-queue management surface; cross-tenant prevention as cross-cutting only) to a later slice; per-surface validation-vector mapping. Existing Phase 12 mapping rows unchanged. |

The Phase 24B packet consumes the Phase 24A summary handoff
([`phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)),
the Phase 24A per-component intake
([`hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md)),
the four Phase 24A ADRs
([`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
through
[`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)),
the Phase 23A MVP schema-contract draft and its two spec docs,
the Phase 22A MVP decision-lock series, the Phase 21B
schema-readiness lock, the Phase 19A upstream-review packet
that pins the load-bearing pending feedback gate (still
pending; not satisfied by Phase 24B), the Phase 12 Dixie packet
([`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
[`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
[`dixie-recall-mapping.md`](./dixie-recall-mapping.md))
refreshed in append-only form by Phase 24B, the Phase 10 Finn
packet (preserved unchanged), the Phase 14 Freeside packet
(preserved unchanged), the existing Recall Wedge implementation
under [`../../src/straylight/`](../../src/straylight/)
(read-only), the existing Phase 12 fixtures under
[`../../fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
(unchanged), and the existing wedge tests (Phase 4 demo,
Phase 5 hardening, Phase 20B local scaffold, Phase 20C demo
evidence, storage conformance, dixie-governed-recall handoff)
(unchanged). It produces this summary handoff, the new ADR
(ADR-024E), the two new specs, the three append-only refreshes
to the Phase 12 Dixie handoffs, and this README index entry. It
produces no new fixture, no new test, no source / script /
package change, no new sibling-repo handoff packet, and no
GitHub-side action. The Phase 9 / 10 / 12 / 14 / 15 / 19A / 20
/ 21B / 22A / 23A / 24A in-repo rows above are unchanged by
Phase 24B except for the three append-only Phase 24B sections
in the Phase 12 Dixie handoffs.

Validate locally:

```bash
npm run typecheck
npm test
```

## Phase 24C — Dixie recall-host local scaffold packet

Phase 24C is a **local additive scaffold packet** staged on the
`phase-24c-dixie-recall-host-scaffold` branch inside
`loa-straylight` after Phase 24B's docs/spec packet (ADR-024E +
the two new specs + the three append-only refreshes to the
Phase 12 Dixie handoffs + the Phase 24B summary handoff + the
Phase 24B README index entry) merged. Phase 24C lands the
**TypeScript host-surface scaffold** under
[`../../src/straylight/host/`](../../src/straylight/host/) that
expresses the six in-slice Dixie MVP host surfaces from
[`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
against the wedge's existing stable public API, plus additive
vitest coverage exercising Phase 24B validation vectors 1–8 at
the host inspection layer. Phase 24C is **not endpoint-wired**,
**not runtime-wired**, **not a sibling-repo PR**, **not a
Hounfour package bump**, **not a wedge public-API change**, and
**not a schema authoring event**. The host module is **not**
re-exported through
[`../../src/straylight/index.ts`](../../src/straylight/index.ts);
consumers must import from
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
directly.

Phase 24C does **not** edit
[`../../src/straylight/index.ts`](../../src/straylight/index.ts)
or any existing wedge module under
[`../../src/straylight/`](../../src/straylight/); does **not**
flip a wedge import; does **not** change `package.json` /
`package-lock.json`; does **not** consume Hounfour `main` or any
unpublished commit; does **not** import the Hounfour `#116`
five-step conformance corpus; does **not** adopt the
`0xhoneyjar:straylight:*` audit-event prefix family into the
Straylight public surface; does **not** adopt the `recall-wedge`
Hounfour conformance category into the Straylight test suite;
does **not** wire `loa-dixie` / `loa-finn` / `loa-freeside`;
does **not** add an HTTP / NATS / Discord / Telegram surface;
does **not** publish a public commitment root; does **not**
advance any ADR-022E gate; and does **not** touch `.loa/` /
`.claude/` / `.beads/` / `.run/` / `.github/`. It does **not**
commit and does **not** open a PR.

| Document / artifact | Purpose |
|---|---|
| [`phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md) | Phase 24C summary handoff: executive summary (local additive scaffold; six host surfaces; vectors 1–8 in slice; vector 9 cross-reference only; vectors 10/11 remain gates; tenant resolver is REQUIRED with no production default; host barrel NOT re-exported through wedge public API; no Hounfour-#116 adoption; no sibling-repo wiring; no endpoint), what this packet ships (10 source files under `src/straylight/host/` + 6 test files under `tests/` + this doc + this README row; **no** fixture / script / package change; **no** edits to existing wedge modules), architecture summary (wedge → host one-way dependency; host barrel local-only), intentional deviations from the Phase 24B spec (3 documented: Surface 1 denied/needs_review carry no synthesised RecallReceipt; Surface 3 aggregate-by-reason for excluded/redacted with per-assertion granularity only on marked[]; Surface 6 surfaces both spec 2-key `by_privacy_scope` AND raw `_widened_privacy_scope` 4-key map), vector mapping pin (each Phase 24B vector 1–8 → host test file + surface(s) + receipt category), validation evidence (`npm run typecheck` clean; `npm test` 720 passed; phase-24c-host-only run 55 passed; regression-pin run 107 passed), open questions / followups (no wedge `tenant_id` field; `HostFrame` narrower than wedge `EnvironmentFrame`; demo evidence deferred; `review_queue_id` is a deterministic placeholder), explicit non-scope (all forbidden paths preserved), cross-references. |
| [`../../src/straylight/host/types.ts`](../../src/straylight/host/types.ts) | Per-surface TypeScript request/response shapes for the six MVP surfaces + `HostFrame` / `HostCaller` / `DeniedReason` / `ExclusionReason` enums. NO schema; no `$id`; no validator. |
| [`../../src/straylight/host/tenancy.ts`](../../src/straylight/host/tenancy.ts) | `TenantResolver` contract + `checkSameTenant` primitive. NO production default resolver — callers MUST inject explicitly; ambiguity (resolver returns `undefined`) fails closed with `tenant_resolution_failed`. |
| [`../../src/straylight/host/intake-log.ts`](../../src/straylight/host/intake-log.ts) | In-memory host-side intake-deny log for vectors 7 / 8. Per-tenant view via `listForTenant`; cross-tenant chain links forbidden. Content-addressed entry ids. |
| [`../../src/straylight/host/intake.ts`](../../src/straylight/host/intake.ts) | **Surface 1** — Recall intake & response (`handleRecallIntake`). Cross-tenant intake guard; delegates to wedge `executeRecall`; maps `RecallOutcome` → served / denied / needs_review with classified `DeniedReason`. Denied path never carries synthesised pack/receipt. |
| [`../../src/straylight/host/receipt.ts`](../../src/straylight/host/receipt.ts) | **Surface 2** — Receipt retrieval & display (`handleReceiptRetrieval`). Returns wedge's persisted receipt verbatim; detail-level redaction stays wedge-applied. Cross-tenant lookup → intake-deny log entry + `cross_tenant_refused`. |
| [`../../src/straylight/host/exclusion.ts`](../../src/straylight/host/exclusion.ts) | **Surface 3** — Excluded-assertion reason display (`handleExclusionDisplay`). Pure render over `RecallPack.excluded_summary[]` / `redacted[]` / `marked[]`; wedge reasons classified into the six-receipt-category enum from ADR-020D §6 with verbatim `raw_reason` preserved for trace. |
| [`../../src/straylight/host/provenance.ts`](../../src/straylight/host/provenance.ts) | **Surface 4** — Provenance inspection (`handleProvenanceWalk`). Walks `Assertion.provenance[]`; refuses `actor_private` parent under `public_discord` caller frame; refuses `sealed` parent regardless of frame; never synthesises provenance for unknown assertions. |
| [`../../src/straylight/host/audit-lookup.ts`](../../src/straylight/host/audit-lookup.ts) | **Surface 5** — Audit-chain lookup (`handleAuditChainLookup`). Surfaces wedge's `AuditLog.verifyChain` outcome; on break, returns events up to break + `break_index` + `break_reason`; never hides a break. ADR-022E gate #5 unchanged — `AuditEvent` not renamed. |
| [`../../src/straylight/host/estate-summary.ts`](../../src/straylight/host/estate-summary.ts) | **Surface 6** — Estate summary (`handleEstateSummary`). Wedge 4-key `PrivacyScope` projects to spec 2-key `by_privacy_scope` (`public + tenant → public_discord`; `actor_private + sealed → actor_private`); frame discipline (zero `actor_private` under `public_discord` caller frame) applied to the 2-key shape; raw 4-key map surfaced under `_widened_privacy_scope` for trace. |
| [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) | Local barrel. **NOT re-exported through `../../src/straylight/index.ts`** (the wedge public API). Wedge does not import host. |
| [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts) | Surface-shape pin: six handlers + helpers exported from host barrel; wedge public surface does NOT re-export host symbols; wedge 11-section public API preserved; no forbidden imports under `src/straylight/host/` (no `loa-dixie` / `loa-finn` / `loa-freeside` / `@0xhoneyjar/loa-hounfour` / `hounfour-alias`); wedge does not import host. |
| [`../../tests/phase-24c-host-vectors-1-to-3.test.ts`](../../tests/phase-24c-host-vectors-1-to-3.test.ts) | Vectors 1 / 2 / 3 at the host inspection layer. |
| [`../../tests/phase-24c-host-vectors-4-to-6.test.ts`](../../tests/phase-24c-host-vectors-4-to-6.test.ts) | Vectors 4 / 5 / 6 — including Vector 6 via the wedge's real forget transition so the audit chain carries `assertion_forgotten_from_recall`. |
| [`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts) | Vectors 7 / 8 — cross-tenant refusal across S1 / S2 / S4 / S5 / S6; intake-deny log entry on caller tenant only; private-in-public denial. |
| [`../../tests/phase-24c-host-fail-closed.test.ts`](../../tests/phase-24c-host-fail-closed.test.ts) | Unknown ids → typed refusals; resolver `undefined` → `tenant_resolution_failed`; out-of-enum frame → `frame_unsupported`; sealed parent → `privacy_scope_refusal`; storage throw → `storage_unavailable`; tampered audit chain → `outcome: 'broken'`; denied intake never carries pack/receipt. |
| [`../../tests/phase-24c-host-intake-log.test.ts`](../../tests/phase-24c-host-intake-log.test.ts) | Per-tenant `listForTenant` scoping; content-addressed entry ids; vector-7 cross-tenant intake records on caller tenant only; wedge `recall_denied` audit_event_id captured in `wedge_audit_event_ref`. |

The Phase 24C packet consumes the Phase 24B summary handoff
([`phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)),
the Phase 24B decision-lock
([`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)),
the two Phase 24B specs
([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
[`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)),
the four Phase 24A ADRs (ADR-024A through ADR-024D), the
Phase 24A summary handoff and per-component intake doc, the
Phase 23A MVP schema-contract draft, the Phase 22A MVP
decision-lock series, the Phase 21B schema-readiness lock, the
Phase 19A upstream-review packet (pending feedback gate still
pending; not satisfied by Phase 24C), the Phase 12 Dixie packet
(unchanged by Phase 24C), the Phase 10 Finn packet (preserved
unchanged), the Phase 14 Freeside packet (preserved unchanged),
the existing Recall Wedge implementation under
[`../../src/straylight/`](../../src/straylight/) (read-only —
the host scaffold imports the wedge public API; the wedge does
NOT import the host), the existing wedge tests (unchanged by
Phase 24C; all preserved and passing), and the existing
Phase 12 fixtures under
[`../../fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
(unchanged — Phase 24C adds no fixture). It produces this
summary handoff, the 10 source files under
[`../../src/straylight/host/`](../../src/straylight/host/), the
6 additive tests under [`../../tests/`](../../tests/), and this
README index entry. It produces no new fixture, no new script,
no `package.json` / `package-lock.json` change, no edit to any
existing wedge source / test file, no new sibling-repo handoff
packet, and no GitHub-side action. All Phase 9 / 10 / 12 / 14 /
15 / 19A / 20 / 21B / 22A / 23A / 24A / 24B in-repo rows above
are unchanged by Phase 24C.

Validate locally:

```bash
npm run typecheck
npm test
npx vitest run tests/phase-24c-host*.test.ts
npx vitest run tests/phase-5-hardening.test.ts \
                tests/phase-20b-recall-wedge-local-scaffold.test.ts \
                tests/storage-conformance.test.ts \
                tests/dixie-governed-recall-handoff.test.ts
```

## Phase 24D — Dixie recall-host scaffold hardening packet

Phase 24D is a **local additive hardening pass on top of the
Phase 24C host scaffold** staged on the
`phase-24d-host-scaffold-hardening-plan` branch inside
`loa-straylight` after Phase 24C's scaffold packet merged. Phase
24D tightens the Phase 24C scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) along
six non-blocking concerns surfaced by the Phase 24C read-only
review. Phase 24D introduces **no** new host surface, **no** new
request/response shape, **no** new wedge primitive, **no**
fixture, **no** script, **no** `package.json` change, **no** edit
to [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
**no** re-export of `src/straylight/host/*` through the wedge
public API, **no** sibling-repo edit, **no** ADR-022E gate
advance, and **no** Hounfour `#116` adoption.

Phase 24D does **not** flip a wedge import; does **not** change
`package.json` / `package-lock.json`; does **not** consume
Hounfour `main` or any unpublished commit; does **not** import the
Hounfour `#116` five-step conformance corpus; does **not** adopt
the `0xhoneyjar:straylight:*` audit-event prefix family into the
Straylight public surface; does **not** adopt the `recall-wedge`
Hounfour conformance category into the Straylight test suite;
does **not** wire `loa-dixie` / `loa-finn` / `loa-freeside`; does
**not** add an HTTP / NATS / Discord / Telegram surface; does
**not** publish a public commitment root; does **not** advance
any ADR-022E gate; and does **not** touch `.loa/` /
`.loa.config.yaml` / `.claude/` / `.beads/` / `.run/` /
`.github/`. It does **not** commit and does **not** open a PR.

| Document / artifact | Purpose |
|---|---|
| [`phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md) | Phase 24D summary handoff: executive summary (six non-blocking review concerns pinned: tenancy empty-input fail-closed; Surface 4 tenant + public_discord refusal; Surface 6 optional intake-deny log on cross-tenant refusal; Surface 1 `needs_review` is not a denial; Surface 3 unknown wedge reason → safe-default `excluded`; tightened vectors-7-to-8 receipt-not-found assertion), what this packet ships (5 source-edits under `src/straylight/host/` — `tenancy.ts`, `provenance.ts`, `estate-summary.ts`, `intake.ts`, `exclusion.ts` — plus 1 new test file `tests/phase-24d-host-hardening.test.ts`, plus the tightened `tests/phase-24c-host-vectors-7-to-8.test.ts`, plus the appended Phase 24D addendum to `docs/specs/dixie-recall-host-mvp-contract.md`, plus this doc, plus this README row; **no** fixture / script / package change; **no** new host surface, **no** new request/response shape; **no** new wedge primitive; **no** re-export of host symbols through the wedge public API), hardening concern mapping table (concern → source edit → test), architecture summary (wedge → host one-way dependency unchanged; host barrel local-only unchanged), validation evidence (`npm run typecheck` clean; `npm test` clean; Phase 24C+24D host suite + regression pin clean), open questions / followups (Surface 6 `intakeLog` remains optional; wedge-side `privacy_tenant_in_public_frame` widening would require host-side widening in lock-step; unknown wedge exclusion reason is a wedge-side code smell), explicit non-scope (all forbidden paths preserved), cross-references. |
| [`../../src/straylight/host/tenancy.ts`](../../src/straylight/host/tenancy.ts) | **Concern 1** — `checkSameTenant` rejects empty `callerTenant` BEFORE invoking the resolver; rejects empty resolver result identically to `undefined`. Both paths emit existing `tenant_unresolved` reason. |
| [`../../src/straylight/host/provenance.ts`](../../src/straylight/host/provenance.ts) | **Concern 2** — Surface 4 refuses `privacy_scope_refusal` when parent `privacy_scope === 'tenant'` AND caller `frame === 'public_discord'`. Aligns the host's Surface 4 with the wedge's `privacy_tenant_in_public_frame` Surface 1 redaction. The same parent under `actor_private` caller frame remains permitted. |
| [`../../src/straylight/host/estate-summary.ts`](../../src/straylight/host/estate-summary.ts) | **Concern 3** — `EstateSummaryDeps` gains optional `intakeLog?: IntakeDenyLog`. When provided, cross-tenant target refusals append an intake-deny entry on the CALLER's tenant with `reason: 'cross_tenant_estate_summary'` (or `'tenant_resolution_failed'`). Backward-compatible without the dep. |
| [`../../src/straylight/host/intake.ts`](../../src/straylight/host/intake.ts) | **Concern 4** — Inline documentation pinning `needs_review` is NOT a denial and writes no intake-deny entry. |
| [`../../src/straylight/host/exclusion.ts`](../../src/straylight/host/exclusion.ts) | **Concern 5** — Inline documentation pinning unknown wedge reason → safe-default `excluded`; `raw_reason` preserved verbatim; host never re-classifies into a narrower category. |
| [`../../tests/phase-24d-host-hardening.test.ts`](../../tests/phase-24d-host-hardening.test.ts) | New Phase 24D test pin covering concerns 1–7 (empty caller tenant; empty resolver result; Surface 4 tenant + public_discord refusal; Surface 4 tenant + actor_private permit; Surface 6 with intakeLog; Surface 6 without intakeLog; Surface 3 unknown wedge reason safe-default). |
| [`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts) | **Concern 6** — Tightened Surface 2 cross-tenant assertion: previously `['unknown_receipt_id', 'cross_tenant_refused', 'tenant_resolution_failed']`; now exactly `unknown_receipt_id`. The host MUST NOT infer tenant identity from a missing record. |
| [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) | Append-only "Phase 24D — Host scaffold hardening addendum" section pinning the six concerns into the contract. No edits to prior Phase 24B / 24C sections. |

The Phase 24D packet consumes the Phase 24C summary handoff
([`phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)),
the Phase 24B summary handoff
([`phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)),
the Phase 24B decision-lock
([`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)),
the two Phase 24B specs
([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
[`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)),
the four Phase 24A ADRs (ADR-024A through ADR-024D), and the
Phase 24C host scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) and the
six Phase 24C host tests (preserved unchanged except for the one
tightened assertion in
[`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts)
documented above). It produces this summary handoff, the five
source-edits enumerated above, the one new test file under
[`../../tests/`](../../tests/), the one tightened existing test,
the append-only Phase 24D addendum to
[`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
and this README index entry. It produces no new fixture, no new
script, no `package.json` / `package-lock.json` change, no edit
to any existing wedge module under
[`../../src/straylight/`](../../src/straylight/) outside the
host scaffold directory, no new sibling-repo handoff packet, and
no GitHub-side action. All Phase 9 / 10 / 12 / 14 / 15 / 19A /
20 / 21B / 22A / 23A / 24A / 24B / 24C in-repo rows above are
unchanged by Phase 24D.

Validate locally:

```bash
npm run typecheck
npm test
npx vitest run tests/phase-24c-host-surface-shape.test.ts \
                tests/phase-24c-host-vectors-1-to-3.test.ts \
                tests/phase-24c-host-vectors-4-to-6.test.ts \
                tests/phase-24c-host-vectors-7-to-8.test.ts \
                tests/phase-24c-host-fail-closed.test.ts \
                tests/phase-24c-host-intake-log.test.ts \
                tests/phase-24d-host-hardening.test.ts
npx vitest run tests/phase-5-hardening.test.ts \
                tests/phase-20b-recall-wedge-local-scaffold.test.ts \
                tests/storage-conformance.test.ts \
                tests/dixie-governed-recall-handoff.test.ts
```

## Phase 24E — Dixie host handoff packet (docs-only)

Phase 24E is a **docs-only Dixie host handoff packet** staged on
the `phase-24e-dixie-host-handoff-packet` branch inside
`loa-straylight` after Phase 24D's hardening packet merged. Phase
24E consolidates the merged Phase 24C local TypeScript host
scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) and
the Phase 24D hardening into a Dixie-side reading: what a future
`loa-dixie` host / BFF must **inspect**, **relay**, and **render**
against each of the six in-slice surfaces — and the explicit set
of things Dixie must **not** invent. Phase 24E is **not
endpoint-wired**, **not runtime-wired**, **not a sibling-repo
PR**, **not a Hounfour package bump**, **not a wedge public-API
change**, **not a schema authoring event**, **not a host runtime
change**, and **not a new ADR**. It produces no Straylight recall
objects, no host code, no test, no fixture, no script, no
package change, and no GitHub-side action.

Phase 24E does **not** flip a wedge import; does **not** change
`package.json` / `package-lock.json`; does **not** consume
Hounfour `main` or any unpublished commit; does **not** import
the Hounfour `#116` five-step conformance corpus; does **not**
adopt the `0xhoneyjar:straylight:*` audit-event prefix family
into the Straylight public surface; does **not** adopt the
`recall-wedge` Hounfour conformance category into the Straylight
test suite; does **not** wire `loa-dixie` / `loa-finn` /
`loa-freeside`; does **not** add an HTTP / NATS / Discord /
Telegram surface; does **not** publish a public commitment
root; does **not** advance any ADR-022E gate; and does **not**
touch `.loa/` / `.loa.config.yaml` / `.claude/` / `.beads/` /
`.run/` / `.github/` / `grimoires/loa/a2a/`. It does **not**
commit and does **not** open a PR. The Phase 19A pending feedback
gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24E.

| Document / artifact | Purpose |
|---|---|
| [`phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md) | Phase 24E summary handoff: executive summary (Dixie-side reading of the Phase 24C/24D local host scaffold; no Straylight recall-object production; no sibling-repo edit; no Hounfour adoption); inherited state recap (Phase 24B Dixie-first placement; Phase 24C six local host surfaces under `src/straylight/host/`; Phase 24D hardening; host barrel intentionally not re-exported through `src/straylight/index.ts`); six per-surface Dixie readings (S1 recall intake/response; S2 receipt retrieval/display; S3 excluded-assertion reason display; S4 provenance inspection; S5 audit-chain lookup; S6 estate summary display — each with **inspect / relay / render / must-not-invent / typed refusals + receipt-category vocabulary**); per-surface handler mapping table (S1→`handleRecallIntake`, S2→`handleReceiptRetrieval`, S3→`handleExclusionDisplay`, S4→`handleProvenanceWalk`, S5→`handleAuditChainLookup`, S6→`handleEstateSummary`); injected dependency requirements (required `TenantResolver` with no production default; optional `IntakeDenyLog` on S6 per Phase 24D concern 3; `AuditLog` / `EstateStore` / `StorageAdapter` from the wedge public surface — read by host, not redefined by Dixie); restated Phase 24C deviations (no synthesised receipt on S1 deny/needs_review; aggregate-by-reason on S3; `_widened_privacy_scope` 4-key trace map on S6); restated Phase 24D hardening implications (empty tenant fail-closed; tenant-scoped parent under `public_discord` refusal; optional S6 intake-deny log; `needs_review` ≠ denial; unknown wedge reason → safe-default `excluded` with verbatim `raw_reason`; tightened S2 receipt-not-found assertion); vector mapping (vectors 1–8 in slice; vector 9 cross-reference only; vectors 10–11 remain gates); validation evidence (`npm run typecheck` clean; `npm test` 33 files / 728 tests passed; Phase 24C + Phase 24D host suite 63 tests passed; regression subset 107 tests passed); Dixie-side supplemental acceptance criteria (eight items extending — not rewriting — the Phase 12 acceptance criteria); open follow-ups (Phase 24F demo-evidence packet anticipated; Dixie review-queue semantics for `needs_review` future work; `HostFrame` widening future work; Hounfour #70 / Phase 19A pending and not advanced); explicit non-scope; cross-references. |
| [`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md) (Phase 24E refresh appended) | Phase 12 Dixie issue handoff with a Phase 24E append-only section. Records that the six in-slice surfaces now exist as exported handlers under `src/straylight/host/` and are exercised by the Phase 24C + Phase 24D host suite (63 tests passed). Adds a supplemental Dixie-side acceptance-criteria list (eight items) without rewriting the Phase 12 §"Acceptance criteria" list. Existing Phase 12 and Phase 24B prose unchanged. |
| [`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md) (Phase 24E refresh appended) | Phase 12 boundary doc with a Phase 24E append-only section. Tightens the Phase 12 "Dixie consumes; it does not produce new estate truth" statement to the Phase 24C/24D scaffold reality: Dixie inspects/relays/renders/refuses/audits over six concrete handler entry points; Dixie does not produce `RecallPack` / `RecallReceipt`, does not compute `dispositionFor`, does not reinterpret `privacy_scope`, does not run `verifyChain`, does not publish a commitment root, does not rename `AuditEvent`. Existing Phase 12 and Phase 24B prose unchanged. |
| [`dixie-recall-mapping.md`](./dixie-recall-mapping.md) (Phase 24E refresh appended) | Phase 12 mapping doc with a Phase 24E append-only section. Adds a six-row per-surface handler-binding table mapping S1–S6 to (a) handler export name, (b) module path under `src/straylight/host/`, (c) dependency-interface name (`IntakeDeps` / `ReceiptDeps` / `ProvenanceDeps` / `AuditLookupDeps` / `EstateSummaryDeps`), (d) typed refusal reasons surfaced, (e) render expectation. Cites `src/straylight/host/index.ts` as the canonical host barrel (post-PR-30 snapshot). Existing Phase 12 mapping rows and Phase 24B refresh unchanged. |

The Phase 24E packet consumes the Phase 24D summary handoff
([`phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)),
the Phase 24C summary handoff
([`phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)),
the Phase 24B summary handoff
([`phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)),
the Phase 24B decision-lock
([`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)),
the two Phase 24B specs
([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
[`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)),
the four Phase 24A ADRs (ADR-024A through ADR-024D), the
Phase 12 Dixie packet (refreshed in append-only form by
Phase 24E), and the post-PR-30 host scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) (read-
only — Phase 24E touches no source). It produces this summary
handoff, the three append-only Phase 24E refresh sections in
[`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
/
[`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
/ [`dixie-recall-mapping.md`](./dixie-recall-mapping.md), and
this README index entry. It produces no new fixture, no new
script, no `package.json` / `package-lock.json` change, no edit
to any existing wedge or host source / test file, no new
sibling-repo handoff packet, and no GitHub-side action. All
Phase 9 / 10 / 12 / 14 / 15 / 19A / 20 / 21B / 22A / 23A / 24A /
24B / 24C / 24D in-repo rows above are unchanged by Phase 24E.

Validate locally:

```bash
npm run typecheck
npm test
npx vitest run tests/phase-24c-host-surface-shape.test.ts \
                tests/phase-24c-host-vectors-1-to-3.test.ts \
                tests/phase-24c-host-vectors-4-to-6.test.ts \
                tests/phase-24c-host-vectors-7-to-8.test.ts \
                tests/phase-24c-host-fail-closed.test.ts \
                tests/phase-24c-host-intake-log.test.ts \
                tests/phase-24d-host-hardening.test.ts
npx vitest run tests/phase-5-hardening.test.ts \
                tests/phase-20b-recall-wedge-local-scaffold.test.ts \
                tests/storage-conformance.test.ts \
                tests/dixie-governed-recall-handoff.test.ts
```

## Phase 24F — Dixie host issue / PR handoff draft (docs-only)

Phase 24F is a **narrow, paste-ready Dixie-side GitHub-issue /
first-PR handoff draft** staged on the
`phase-24f-dixie-host-issue-draft` branch inside `loa-straylight`
after Phase 24E's docs-only handoff packet merged. Phase 24F
specifies the *first* future `loa-dixie` PR that consumes the
Phase 24C/24D TypeScript host scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) — and
**only that first PR**. The first-PR scope is **scaffold-
consumption-only**: the future Dixie PR imports the six host
handler contracts, wires explicit injected dependencies
(`TenantResolver` required; `IntakeDenyLog` optional), surfaces
typed refusals verbatim, and preserves the Phase 24C/24D host
semantics — **without** authoring any operator-facing rendering,
**without** declaring any HTTP / NATS / RPC / BFF route shape as
binding, and **without** widening vector scope beyond Phase 24B's
vectors 1–8. Phase 24F is **narrower** than Phase 24E and cites
Phase 24E as the authoritative source for per-surface behavior.
Phase 24F is **not endpoint-wired**, **not runtime-wired**, **not
a sibling-repo PR**, **not a sibling-repo issue filing**, **not a
Hounfour package bump**, **not a wedge public-API change**, **not
a schema authoring event**, **not a host runtime change**, **not
a new ADR**, **not a new spec**, and **not a demo / evidence
artifact**. It produces no Straylight recall objects, no host
code, no test, no fixture, no script, no package change, and no
GitHub-side action.

Phase 24F does **not** flip a wedge import; does **not** change
`package.json` / `package-lock.json`; does **not** consume
Hounfour `main` or any unpublished commit; does **not** import
the Hounfour `#116` five-step conformance corpus; does **not**
adopt the `0xhoneyjar:straylight:*` audit-event prefix family
into the Straylight public surface; does **not** adopt the
`recall-wedge` Hounfour conformance category into the Straylight
test suite; does **not** wire `loa-dixie` / `loa-finn` /
`loa-freeside`; does **not** add an HTTP / NATS / RPC / BFF /
Discord / Telegram surface; does **not** declare any Dixie
endpoint route as binding; does **not** publish a public
commitment root; does **not** advance any ADR-022E gate; does
**not** request or run Flatline / Bridgebuilder / red-team
review; and does **not** touch `.loa/` / `.loa.config.yaml` /
`.claude/` / `.beads/` / `.run/` / `.github/` /
`grimoires/loa/a2a/`. It does **not** commit and does **not**
open a PR. The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24F.

| Document / artifact | Purpose |
|---|---|
| [`phase-24f-dixie-host-issue-draft.md`](./phase-24f-dixie-host-issue-draft.md) | Phase 24F handoff packet: status banner (handoff prep only; not filed; no source / test / package / sibling repo edits), executive summary (paste-ready Dixie-side issue / first-PR draft; narrower than Phase 24E; Phase 24E remains the broader per-surface reading), background / lineage (PR #29 = Phase 24C scaffold; PR #30 = Phase 24D hardening; PR #31 = Phase 24E reading; Phase 24F = first-PR draft; Hounfour `#116` upstream substrate only; Phase 19A pending and not advanced), **paste-ready issue body** (fenced with `<!-- BEGIN paste-ready issue body -->` / `<!-- END paste-ready issue body -->` markers; contains Title, Summary, Background, First PR scope, six per-surface contracts S1–S6 with consume / relay / render-later / must-not-produce-or-reinterpret / typed-refusals-verbatim / transport-out-of-scope, required injected dependencies `TenantResolver` (required, no production default) + `IntakeDenyLog` (optional, recommended) + wedge `AuditLog` / `EstateStore` / `StorageAdapter` (read by host, not redefined by Dixie), 15-item Acceptance criteria list, Validation expectations, Explicit non-goals for the first PR, References), six-surface contract requirements mirror (table-form restatement keyed to the first-PR scope), per-surface handler mapping table (S1→`handleRecallIntake`, S2→`handleReceiptRetrieval`, S3→`handleExclusionDisplay`, S4→`handleProvenanceWalk`, S5→`handleAuditChainLookup`, S6→`handleEstateSummary` — all imported from the local barrel `src/straylight/host/index.ts`, **not** re-exported through the wedge public API), 15-item acceptance criteria restatement (cite-able by a Phase 24F reviewer without entering the paste block), transport-neutrality section (no HTTP / NATS / RPC / BFF / GraphQL / Discord / Telegram surface declared binding; transport ownership sits with the Dixie repo under a future, separate, Dixie-side ADR), explicit non-goals (no `loa-dixie` edit; no endpoint; no route; no Hounfour adoption; no package change; no source change; no tests; no fixtures; no scripts; no public commitment root; no vector 9 / 10 / 11; no rendering implementation; no Flatline / Bridgebuilder request), open follow-ups (filing posture out of Phase 24F; follow-up PR plan not pre-authorised; vector-9 cross-reference test out of slice; `HostFrame` widening out of slice; no Phase 24F demo-evidence packet authored; Hounfour `#70` pending and not advanced), validation evidence (`npm run typecheck` clean; `npm test` unchanged from Phase 24E baseline; empty diff for `src/` / `tests/` / `fixtures/` / `scripts/` / `package.json` / `package-lock.json`), cross-references. |

The Phase 24F packet consumes the Phase 24E summary handoff
([`phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md))
as the authoritative source for per-surface Dixie behavior, the
Phase 24D summary handoff
([`phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)),
the Phase 24C summary handoff
([`phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)),
the Phase 24B summary handoff
([`phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)),
the Phase 24B decision-lock
([`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)),
the two Phase 24B specs
([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
[`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)),
the four Phase 24A ADRs (ADR-024A through ADR-024D), the
Phase 12 Dixie packet
([`dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
[`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
[`dixie-recall-mapping.md`](./dixie-recall-mapping.md), each
already refreshed in append-only form by Phase 24B and
Phase 24E), and the post-PR-30 host scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) (read-
only — Phase 24F touches no source). It produces this single
summary handoff and this README index entry. It produces no new
fixture, no new script, no `package.json` / `package-lock.json`
change, no edit to any existing wedge or host source / test
file, no append to any prior handoff packet (the Phase 12 docs
already carry Phase 24B + Phase 24E refreshes; Phase 24F does
**not** add a third refresh), no new sibling-repo handoff
packet, and no GitHub-side action. All Phase 9 / 10 / 12 / 14 /
15 / 19A / 20 / 21B / 22A / 23A / 24A / 24B / 24C / 24D / 24E
in-repo rows above are unchanged by Phase 24F.

Validate locally:

```bash
npm run typecheck
npm test
git status --short
git diff --stat
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json
```

Expected: `npm run typecheck` clean; `npm test` identical to the
Phase 24E post-merge baseline; empty `git diff` for `src/`,
`tests/`, `fixtures/`, `scripts/`, `package.json`, and
`package-lock.json`.

## Phase 24G — Host package-consumption readiness plan (docs-only)

Phase 24G is a **docs-only readiness handoff** staged on the
`phase-24g-host-package-consumption-readiness-plan` branch inside
`loa-straylight` after Phase 24F's paste-ready Dixie-side issue /
first-PR handoff draft merged. Phase 24G records the package-
consumption blockers that currently prevent `loa-dixie` (and any
other consumer) from replacing its local adapter mirror with a
real `import type { ... } from '@loa/straylight/host'`, pins a
policy frame for exposing `./host` as a future Straylight package
subpath, and defines the entry / non-go conditions for a later
implementation phase that may add the minimum package / build /
export surface required to make `@loa/straylight/host` actually
consumable. The companion decision-lock is
[`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md).

Phase 24G is **not a bugfix**. It is a **public-surface /
package-boundary decision-lock** that locks the policy frame so a
later implementation phase has a reviewable target. Phase 24G
does **not** edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc); does **not** add an `exports`
map, a `./host` subpath, a `types` / `typings` field, a `files`
field, or a `build` script; does **not** emit declarations or JS
or a `dist/` directory; does **not** un-`"private"` the package;
does **not** publish to any registry; does **not** edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md); does
**not** edit any prior ADR or any prior handoff (other than this
README index entry); does **not** edit any source under
[`../../src/`](../../src/) (no edit to the wedge surface; no
edit to the host scaffold; no re-export of the host barrel
through the wedge public API); does **not** edit any test,
fixture, or script; does **not** edit any sibling repo (no
`loa-dixie` change; no `loa-finn` change; no `loa-freeside`
change; no `loa-hounfour` change); does **not** file or edit any
GitHub issue / comment / PR; does **not** bump, downgrade, or
reconcile the Hounfour dependency range; does **not** consume
Hounfour `main` or any unpublished commit; does **not** import
the Hounfour `#116` five-step conformance corpus; does **not**
adopt the `0xhoneyjar:straylight:*` audit-event prefix family
into the Straylight public surface; does **not** adopt the
Hounfour `recall-wedge` conformance category into the Straylight
test suite; does **not** publish a public commitment root; does
**not** advance any ADR-022E gate; does **not** widen vector
scope beyond Phase 24B's vectors 1–8; does **not** request or
run Flatline / Bridgebuilder / red-team review; and does **not**
touch `.loa/` / `.loa.config.yaml` / `.claude/` / `.beads/` /
`.run/` / `.github/` / `grimoires/loa/a2a/`. It does **not**
commit and does **not** open a PR. The Phase 19A pending
feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24G.

| Document / artifact | Purpose |
|---|---|
| [`phase-24g-host-package-consumption-readiness-plan.md`](./phase-24g-host-package-consumption-readiness-plan.md) | Phase 24G handoff packet: status banner (docs-only; no source / package / test / sibling-repo / fixture / script changes; companion ADR-024F), executive summary (Dixie PR #96 landed a local adapter boundary, not real `@loa/straylight` consumption; `@loa/straylight/host` is not currently consumable because Straylight is not package-consumable yet; Phase 24G records the blockers and defines the next implementation gate), current package / export / build state (`package.json` facts: `name @loa/straylight`, `version 0.0.1`, `private: true`, `type: module`, `main` points at TS source, no `exports` map, no `types` field, no `build` script, no `dist/`, Hounfour declared at `^8.6.0`; `tsconfig.json` facts: `declaration: false`, `noEmit: true`, ESM `Bundler` resolution; source layout facts: wedge index and host barrel separate, host barrel intentionally **not** re-exported through the wedge public API per ADR-024E; package-boundary doc facts: only the wedge index named as stable), **Dixie import blocker checklist** (nine blockers, each with current state / why it blocks Dixie / required future state / Phase 24G posture: missing `exports`; missing `./host` subpath; no declaration output; no JS output / no `dist/`; source-only package entry; private package / no publish discipline; no tag/release consumption rule; public-surface widening decision; Hounfour version skew — plus a blocker summary table), package-boundary implications (`./host` not snuck into public surface; host subpath is a deliberate future surface; wedge public API unchanged; one-way wedge↔host dependency preserved), Dixie follow-up implication (PR #96 remains correct as a pre-consumption adapter boundary; future Dixie PR may replace local mirrors only after Phase 24H-like package-readiness lands; Dixie Issue #95 remains partially satisfied, not fully completed, until actual dependency wiring happens), validation baseline (`npm run typecheck`, `npm test`, forbidden-path diff empty), explicit non-scope (no `package.json` / `package-lock.json` / `tsconfig.json` / `vitest.config.ts` / `.npmrc` edit; no source / test / fixture / script edit; no `package-boundary.md` edit; no prior ADR / prior handoff edit; no sibling-repo edit; no `npm install` / `npm update` / `npm ci` / `npm publish` / `npm pack`; no Hounfour bump or adoption; no `#116` corpus import; no `0xhoneyjar:straylight:*` adoption; no `recall-wedge` category adoption; no endpoint; no public commitment root; no ADR-022E gate advance; no vector 9 / 10 / 11 widening; no rendering implementation; no Flatline / Bridgebuilder request), open questions / follow-ups (exact Phase 24H branch name not pinned; declaration-only vs declarations-plus-JS choice deferred; private-package-with-tag-pin vs GitHub-Packages-publishing choice deferred; Dixie / Hounfour skew resolution deferred to follow-up phase's opening doc; future `package-boundary.md` update for `./host` deferred; one-way wedge↔host dependency guard implementation shape deferred; Hounfour `#70` pending and not advanced), cross-references. |
| [`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md) | Phase 24G decision-lock: Status (Accepted-for-Phase-24G; docs-only readiness; no implementation), Context (eleven independently-load-bearing facts pinning why `@loa/straylight/host` is not currently consumable), **Decision** (seven rules: do not implement in Phase 24G; treat `./host` exposure as public-surface widening; require a follow-up implementation phase before any consumer can `import type` from `@loa/straylight/host`; keep wedge and host entrypoints separate with strictly one-way dependency; future consumption must be tag-pinned or release-pinned; do not resolve Dixie / Hounfour skew by downgrading Straylight or consuming Hounfour `main`; do not adopt `#116` / `0xhoneyjar:straylight:*` / `recall-wedge` as part of package-readiness), Recommended future implementation posture (advisory: branch named "Phase 24H or later"; prefer ESM-only; prefer declaration-only emission if first consumer's need is type-only; runtime JS emission is strictly larger widening; preserve `"private": true` with tag-pin OR un-private with GitHub Packages, no hybrid; preserve one-way wedge↔host dependency via automated guard), Hounfour version-skew stance (Straylight `^8.6.0` floor unchanged; Dixie's older pin acknowledged; three acceptable postures for follow-up phase: Dixie bumps to match, Straylight raises floor under ADR-024C discipline, or both sides hold under explicit duplicate-Hounfour isolation; silent duplicate Hounfour resolution non-conforming), Future Phase 24H entry conditions (ADR-024F merged; Phase 24G handoff merged; package / export / build scope explicitly approved; no sibling-repo wiring in same PR; no Dixie dependency flip until Straylight package output is testable), Future Phase 24H non-goals (no Dixie / Finn / Freeside / Hounfour edits; no Hounfour bump; no Hounfour `main` / unpublished consumption; no `#116` corpus import; no `0xhoneyjar:straylight:*` adoption; no `recall-wedge` category adoption; no vector 9; no vectors 10–11; no public commitment root; no endpoint; no runtime Dixie wiring), Consequences (Dixie PR #96 local mirrors remain transitional; `@loa/straylight/host` remains unavailable until package-readiness implementation phase lands; package-readiness is now explicit and reviewable; wedge public surface unchanged; ADR-024F supersedes nothing, additive to ADR-024A through ADR-024E), Non-scope, Source files inspected. |

The Phase 24G packet consumes the Phase 24F summary handoff
([`phase-24f-dixie-host-issue-draft.md`](./phase-24f-dixie-host-issue-draft.md)),
the Phase 24E summary handoff
([`phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)),
the Phase 24D summary handoff
([`phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)),
the Phase 24C summary handoff
([`phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)),
the Phase 24B summary handoff
([`phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)),
the Phase 24A summary handoff
([`phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)),
the Phase 24A ADR series (ADR-024A through ADR-024D), the
Phase 24B decision-lock
([`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)),
the Phase 24B specs
([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
[`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)),
the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md), read-
only — Phase 24G does not edit it), and the current
[`../../package.json`](../../package.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../src/straylight/index.ts`](../../src/straylight/index.ts) /
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
state (read-only — Phase 24G touches no source or config). It
produces this single summary handoff, the companion ADR-024F,
and this README index entry. It produces no new fixture, no new
script, no `package.json` / `package-lock.json` change, no edit
to any existing wedge or host source / test file, no append to
any prior handoff packet (the Phase 12 docs already carry
Phase 24B + Phase 24E refreshes; Phase 24G does **not** add a
third refresh), no new sibling-repo handoff packet, and no
GitHub-side action. All Phase 9 / 10 / 12 / 14 / 15 / 19A / 20 /
21B / 22A / 23A / 24A / 24B / 24C / 24D / 24E / 24F in-repo rows
above are unchanged by Phase 24G.

Validate locally:

```bash
npm run typecheck
npm test
git status --short
git diff --stat
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json vitest.config.ts .npmrc
```

Expected: `npm run typecheck` clean; `npm test` identical to the
Phase 24F post-merge baseline; empty `git diff` for `src/`,
`tests/`, `fixtures/`, `scripts/`, `package.json`,
`package-lock.json`, `tsconfig.json`, `vitest.config.ts`, and
`.npmrc`.

## Phase 24H — Host package subpath implementation (type-only, declaration-only)

Phase 24H is the **first Straylight-side implementation phase**
that widens the package's public surface for cross-repo
consumption. It is staged on the
`phase-24h-host-package-subpath` branch inside `loa-straylight`
after Phase 24G's docs-only readiness plan merged. Phase 24H
executes the **declaration-only subset** of the ADR-024F
§"Recommended future implementation posture" §3 path: a type-only
`@loa/straylight/host` package subpath, a declaration-only
`tsconfig.build.json`, an `exports` map with no runtime
conditions, and two new tests pinning the shape. The companion
decision-lock is
[`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md).

Phase 24H **does** widen the public package surface. It does
**not** widen the runtime surface: no `"default"` / `"import"` /
`"require"` / `"node"` / `"browser"` condition under `exports`,
no TypeScript source fallback, no `dist/` (only `dist-types/`),
no JS emission, no `engines.node` change. A consumer attempting
`await import('@loa/straylight/host')` (or
`require('@loa/straylight/host')`) at runtime does not resolve.
Phase 24H does **not** edit
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../.npmrc`](../../.npmrc); does **not** edit any file under
[`../../src/`](../../src/) (no edit to the wedge public surface;
no edit to the host barrel; no re-export of the host barrel
through the wedge public API); does **not** edit any file under
[`../../scripts/`](../../scripts/); does **not** edit any file
under [`../../fixtures/`](../../fixtures/); does **not** edit
any existing test under [`../../tests/`](../../tests/) (only
two new Phase 24H test files are added); does **not**
un-`"private"` the package; does **not** publish to any
registry; does **not** create a release tag; does **not** bump,
downgrade, or reconcile the Hounfour dependency range; does
**not** consume Hounfour `main` or any unpublished commit; does
**not** import the Hounfour `#116` five-step conformance corpus;
does **not** adopt the `0xhoneyjar:straylight:*` audit-event
prefix family into the Straylight public surface; does **not**
adopt the `recall-wedge` Hounfour conformance category into the
Straylight test suite; does **not** publish a public commitment
root; does **not** advance any ADR-022E gate; does **not** widen
vector scope beyond Phase 24B's vectors 1–8; does **not** edit
any prior ADR or any prior handoff (other than this README
index entry); does **not** edit any sibling repo (no `loa-dixie`
change; no `loa-finn` change; no `loa-freeside` change; no
`loa-hounfour` change); does **not** file or edit any GitHub
issue / comment / PR; and does **not** touch `.loa/` /
`.loa.config.yaml` / `.claude/` / `.beads/` / `.run/` /
`.github/` / `grimoires/loa/a2a/`. A 3-model Flatline pass is
expected **before merge** because Phase 24H widens the public
package surface; it is **not** part of the same commit. The
Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24H.

| Document / artifact | Purpose |
|---|---|
| [`phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md) | Phase 24H summary handoff: status banner (implementation handoff; type-only; declaration-only; no runtime widening; no publish; no tag; no sibling-repo edit; companion ADR-024G), executive summary (the minimum-viable widening; eight of eleven ADR-024F blockers resolved; three explicitly deferred), blocker resolution table (per-blocker status with resolution / deferral notes), files changed (created: `tsconfig.build.json`, ADR-024G, this handoff, the two new tests `phase-24h-package-exports.test.ts` and `phase-24h-type-only-consumption.test.ts`; modified: `package.json`, `.gitignore`, `vitest.config.ts`, `package-boundary.md`, handoffs `README.md`; unchanged-and-verified: `tsconfig.json`, `package-lock.json`, `.npmrc`, `src/`, `scripts/`, `fixtures/`, all existing tests, all prior ADRs, all prior handoffs, sibling repos, `.loa` / `.loa.config.yaml` / `.claude/` / `.beads/` / `.run/` / `.github/` / `grimoires/loa/a2a/`), validation evidence (`npm run typecheck` clean; `npm run build` emits `dist-types/src/straylight/index.d.ts` + `dist-types/src/straylight/host/index.d.ts` because `rootDir: "."` pins the layout; `npm test` passes; `npm pack --dry-run` includes `dist-types/`; empty diff for `src/`, `scripts/`, `fixtures/`, `package-lock.json`, `.npmrc`, `tsconfig.json`; `dist-types/` not staged because gitignored), package surface shape (`exports` map: two subpaths `"."` and `"./host"`, exactly one `"types"` condition each, no runtime conditions, no source fallback, no `main` field), explicit non-scope (no JS / runtime emission; no source fallback; no publish; no tag; no commit-SHA / `main` / git-HEAD posture; no Dixie flip; no Hounfour bump or adoption; no `#116` corpus import; no `0xhoneyjar:straylight:*` adoption; no `recall-wedge` category adoption; no vector 9 / 10 / 11 widening; no endpoint; no commitment root; no source edits; no `tsconfig.json` / `package-lock.json` / `.npmrc` / scripts / fixtures edits; no existing-test edits; no prior-ADR / prior-handoff edits; no Flatline / Bridgebuilder / red-team in the same commit), Dixie posture (PR #96 remains transitional; future flip blocked on Blocker 1 publish posture + Blocker 9 release tag + Blocker 11 Hounfour skew), open questions / follow-ups (publish posture deferred; release-tag event deferred; Hounfour skew deferred; runtime widening deferred to a hypothetical Phase 24I or later; one-way wedge↔host dependency guard implementation shape deferred; future `package-boundary.md` updates deferred; Hounfour `#70` pending), cross-references. |
| [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md) | Phase 24H opening ADR: Status (Accepted-for-Phase-24H; scoped Straylight-side implementation; no sibling-repo edit; no publish; no tag; 3-model Flatline expected before merge), Context (eleven independently-load-bearing blockers from ADR-024F enumerated; Phase 24H executes the minimum-viable subset; type-only `exports` map; declaration-only emit to `dist-types/`; `tsconfig.json` preserved; `package-lock.json` preserved; source byte-identical; one-way wedge↔host dependency preserved), **Decision** (ten rules: add type-only `@loa/straylight/host` package subpath; no runtime import condition; no TypeScript source fallback under `exports`; declaration-only build to `dist-types/`; `"private": true` stays; no actual sibling-repo dependency flip; Hounfour skew remains unresolved; package-boundary documentation widens additively; one-way wedge↔host dependency invariant preserved; tag-/release-pinned consumption only), Blocker resolution table (eleven blockers; eight resolved: 2 + 3 + 4 + 5 + 6 + 7 + 8 + 10; three deferred: 1 + 9 + 11), Non-goals (nineteen Phase 24H-specific refusals; inheritance of all ADR-024A through ADR-024F non-goals), Future Phase 24I+ entry conditions (ADR-024G merged; Phase 24H handoff merged; 3-model Flatline pass on Phase 24H; scope explicitly approved; no sibling-repo wiring in the same PR), Consequences (`@loa/straylight/host` consumable for type-only imports; runtime consumption blocked; Dixie PR #96 local mirrors remain transitional; no sibling-repo work unblocked yet; `tsconfig.json` preserved as IDE / `tsc --noEmit` config; `dist-types/` reproducible; additive to ADR-024F), Source files inspected. |

The Phase 24H packet consumes the Phase 24G summary handoff
([`phase-24g-host-package-consumption-readiness-plan.md`](./phase-24g-host-package-consumption-readiness-plan.md)),
the Phase 24G decision-lock
([`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md)),
the Phase 24F summary handoff
([`phase-24f-dixie-host-issue-draft.md`](./phase-24f-dixie-host-issue-draft.md)),
the Phase 24E summary handoff
([`phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)),
the Phase 24D summary handoff
([`phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)),
the Phase 24C summary handoff
([`phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)),
the Phase 24B summary handoff
([`phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)),
the Phase 24A summary handoff
([`phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)),
the Phase 24A ADR series (ADR-024A through ADR-024D), the
Phase 24B decision-lock
([`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)),
the Phase 24B specs
([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
[`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)),
the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md), edited
additively by Phase 24H: existing sections 1–11 preserved; one new
section documents the `./host` subpath as type-only stable public
API), and the current
[`../../package.json`](../../package.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../src/straylight/index.ts`](../../src/straylight/index.ts) /
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
state. It produces this README index entry, the Phase 24H summary
handoff, the companion ADR-024G, the new `tsconfig.build.json`
build config, the two new Phase 24H tests
(`phase-24h-package-exports.test.ts` and
`phase-24h-type-only-consumption.test.ts`), the edits to
[`../../package.json`](../../package.json) (`main` removed; `types`,
`exports`, `files`, `build`, `prepare` added; `private`, Hounfour
`^8.6.0`, all other scripts preserved), the edit to
[`../../.gitignore`](../../.gitignore) (`dist-types/` is **not**
ignored — intentionally committed as the authoritative Phase 24H
type-only package artifact; explanatory comment added), the new
committed [`../../dist-types/`](../../dist-types/) declaration emit
(authoritative artifact for tag/release consumers; reproducible
from source via `npm run clean:types && npm run build`; `prepare`
is a development convenience, not the authoritative path; the
entire `dist-types/**` subtree is staged as part of the Phase 24H
PR), the edit to [`../../vitest.config.ts`](../../vitest.config.ts)
(`dist-types/**` added to excludes), and the additive edit to
[`../mvp/package-boundary.md`](../mvp/package-boundary.md). It
produces no new fixture, no new script, no `tsconfig.json` edit,
no `package-lock.json` edit, no `.npmrc` edit, no edit to any
existing wedge or host source / test file, no append to any prior
handoff packet, no new sibling-repo handoff packet, and no
GitHub-side action. All Phase 9 / 10 / 12 / 14 / 15 / 19A / 20 /
21B / 22A / 23A / 24A / 24B / 24C / 24D / 24E / 24F / 24G in-repo
rows above are unchanged by Phase 24H.

Validate locally:

```bash
npm run typecheck
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm test
npm pack --dry-run
git diff -- src/ scripts/ fixtures/ package-lock.json .npmrc
git diff -- tsconfig.json
git diff --stat
git status --short
```

Expected: `npm run typecheck` clean; `npm run build` emits
`dist-types/src/straylight/index.d.ts` and
`dist-types/src/straylight/host/index.d.ts` (the `rootDir: "."`
setting in `tsconfig.build.json` is load-bearing; without it the
emit would land under `dist-types/straylight/...` and break the
package exports paths); `npm test` passes with the two new
Phase 24H tests; `npm pack --dry-run` includes `dist-types/`,
`README.md`, `package.json`; empty `git diff` for `src/`,
`scripts/`, `fixtures/`, `package-lock.json`, `.npmrc`, and
`tsconfig.json`; `dist-types/` appears in `git status` as the
new committed Phase 24H type-only package artifact (no longer
gitignored) and the entire `dist-types/**` subtree must be staged
as part of the Phase 24H PR.

## Phase 24I — Release and Dixie dependency-flip gate plan (docs-only)

Phase 24I is a **docs-only gate-plan handoff** staged on the
`phase-24i-release-and-dixie-flip-gate-plan` branch inside
`loa-straylight` after Phase 24H's type-only package-subpath
implementation merged (PR #34). Phase 24I records the gates that
still stand between the post-Phase-24H type-consumable package
surface and a future `loa-dixie` dependency flip from local type
mirrors to `import type { ... } from '@loa/straylight/host'`,
and pins the refusal rules that govern any future Dixie
dependency-flip PR. The companion decision-lock is
[`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md).

Phase 24I selects **no** gate. Phase 24I does **not** cut a
release tag, publish the package, edit any file under
[`../../src/`](../../src/) /
[`../../tests/`](../../tests/) /
[`../../scripts/`](../../scripts/) /
[`../../fixtures/`](../../fixtures/) /
[`../../dist-types/`](../../dist-types/), edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc) /
[`../../.gitignore`](../../.gitignore), edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md), edit
any prior ADR, edit any prior handoff (other than this README
index entry), edit any sibling repo (no `loa-dixie`, `loa-finn`,
`loa-freeside`, or `loa-hounfour` change), file or edit any
GitHub issue / comment / PR, bump / downgrade / reconcile the
Hounfour dependency range, consume Hounfour `main` or any
unpublished commit, import the Hounfour `#116` five-step
conformance corpus, adopt the `0xhoneyjar:straylight:*`
audit-event prefix family into the Straylight public surface,
adopt the `recall-wedge` Hounfour conformance category into the
Straylight test suite, publish a public commitment root, advance
any ADR-022E gate, run `npm install` / `npm update` / `npm ci` /
`npm publish` / any package-manager mutation command, request or
run Flatline / Bridgebuilder / red-team review, or touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/). No
Flatline pass is required because Phase 24I makes no
package-surface or source change. The Phase 19A pending feedback
gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24I.

| Document / artifact | Purpose |
|---|---|
| [`phase-24i-release-and-dixie-flip-gate-plan.md`](./phase-24i-release-and-dixie-flip-gate-plan.md) | Phase 24I summary handoff: status banner (docs-only; companion ADR-024H; no source / package / test / sibling-repo / fixture / script / dist-types / config edits; no tag; no publish; no Hounfour change; no Flatline required), executive summary (Phase 24H made the type-only package surface real; three gates remain before Dixie may flip; Phase 24I records those gates and refuses premature flips), current package state recap (post-Phase-24H baseline: `@loa/straylight` type-only `"."` + `"./host"`; committed `dist-types/`; no runtime conditions; no `main`; `"private": true`; Hounfour `^8.6.0`; no tag / no publish), three-gate table (Gate 1 publish posture: current state / why-it-blocks-Dixie / allowed postures (private + tag-pin git source OR un-private + GitHub Packages; hybrid refused) / forbidden shortcuts / required evidence; Gate 2 release/tag consumption point: current state / why-it-blocks-Dixie / allowed resolution (reviewed tag with `npm run typecheck` + `npm run build` + `npm test` + `npm pack --dry-run --json` + `dist-types/` source-match + tarball-allowlist verification) / forbidden shortcuts (no `main`-HEAD; no commit-SHA; no unpublished working-tree; no workspace-path) / required evidence (exact tag cited); Gate 3 Hounfour version-skew resolution: current state (Straylight `^8.6.0`; Dixie older non-matching; exact Dixie pin Dixie-side state) / why-it-blocks-Dixie / allowed postures (3a Dixie bumps; 3b Straylight changes posture under ADR-024C discipline; 3c duplicate-Hounfour isolation explicitly designed) / forbidden shortcuts (no Hounfour `main`; no commit-SHA silent fix; no implicit duplicate acceptance) / required evidence), gate-of-gates examples (two short orderings: Gate 3→Gate 1→Gate 2→Dixie flip, and Gate 1→Gate 2→Gate 3→Dixie flip — both show that release/tag alone or Hounfour-skew alone do not authorize Dixie flip; all gates must be cited), Dixie dependency flip protocol (future Dixie-side PR only; cites ADR-024H + each gate's resolving event; remains type-only; does not bundle endpoint / rendering / runtime / vector 9–11 / Hounfour #116 / `0xhoneyjar:straylight:*` / `recall-wedge` / commitment-root / runtime-Straylight-import changes), validation (docs-only: `npm run typecheck` clean; `npm test` passes unchanged; `npm run build` clean; `npm pack --dry-run` shape unchanged from Phase 24H; forbidden-path diff empty; no new tests; no package mutation), explicit non-scope (mirrors ADR non-scope; 21 specific refusals; no Flatline required), open questions / follow-ups (publish posture selection, exact release/tag event, Hounfour skew posture, future Dixie dependency flip PR, optional future Dixie flip acceptance packet, runtime widening separate from gates, Hounfour `#70` pending), cross-references. |
| [`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md) | Phase 24I opening ADR: Status (Accepted-for-Phase-24I; docs-only gate plan; selects no gate; cuts no tag; publishes nothing; edits no source / package / test / sibling-repo / fixture / script / dist-types / config / package-boundary / prior ADR / prior handoff other than the README index entry; no Flatline required), Context (post-Phase-24H baseline: type-only `"."` + `"./host"` exports; committed `dist-types/`; `"private": true`; Hounfour `^8.6.0`; TypeScript `>= 5.4` REQUIRED; supported `moduleResolution` modes `"Bundler"` + `"NodeNext"` only; runtime/value imports unsupported by design; no tag/publish; Dixie PR #96 remains transitional), **Decision** (eight rules: §1 three remaining gates enumerated as Gate 1 publish posture + Gate 2 release/tag consumption point + Gate 3 Hounfour version-skew resolution; §2 Gate 1 deferred with Posture 1a (`private` + tag-pinned git source) and Posture 1b (un-`private` + GitHub Packages) enumerated, hybrid refused, five tradeoff axes pinned (registry auth; package visibility; version semantics; CI/publish discipline; tag/release discipline); §3 Gate 2 deferred with verification commands (`npm run typecheck` + `npm run build` + `npm test` + `npm pack --dry-run --json`) and constraints (`dist-types/` matches source-generated output; tarball contains only allowed files) and refusals (no `main`-HEAD; no raw commit-SHA; no unpublished working-tree; no workspace-path as production posture); §4 Gate 3 deferred as a hard gate with Posture 3a / 3b / 3c enumerated and refusals (no Hounfour `main`; no Hounfour commit-SHA as silent fix; no implicit duplicate-Hounfour acceptance) and an explicit refusal to authoritatively restate Dixie's exact Hounfour pin (Dixie-side state to verify at the resolving phase); §5 gate-of-gates conjunction rule (all three gates simultaneously satisfied at flip-PR open time; ordering not fixed); §6 Dixie flip protocol (future Dixie-side PR only; must cite ADR-024H + each gate's resolving event; must remain type-only; must not bundle endpoint / rendering / runtime / vector 9–11 / Hounfour #116 / `0xhoneyjar:straylight:*` / `recall-wedge` / commitment-root / runtime-Straylight-import changes); §7 explicit non-scope (no `package.json` / `package-lock.json` / `tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts` / `.npmrc` / `.gitignore` / source / test / dist-types / scripts / fixtures / package-boundary / prior-ADR / prior-handoff / sibling-repo / GitHub-action edits; no tag; no publish; no `npm install` / `npm update` / `npm ci` / `npm publish` / package-manager mutation; no Hounfour bump; no `#116` corpus import; no `0xhoneyjar:straylight:*` adoption; no `recall-wedge` adoption; no Flatline / Bridgebuilder / red-team review; no ADR-022E gate advance; no Phase 19A pending feedback advance; no commitment-root publication; no `.loa` / `.loa.config.yaml` / `.claude/` / `.beads/` / `.run/` / `.github/` / `grimoires/loa/a2a/` touch); §8 future-phase entry conditions (release/tag execution phase entry conditions; Hounfour skew decision phase entry conditions; Dixie dependency flip phase entry conditions — each requires ADR-024H + Phase 24I handoff merged, the gate-selecting opening ADR / opening doc merged, and each future phase must cite ADR-024H by name if it claims to satisfy a gate)), Consequences (gates enumerated and reviewable; flip PR has concrete conformance check; gate resolution order not pre-committed; Dixie PR #96 remains transitional; Phase 24H type-consumability intact; no silent gate satisfaction; additive to ADR-024G), Source files inspected. |

The Phase 24I packet consumes the Phase 24H summary handoff
([`phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md)),
the Phase 24H decision-lock
([`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md)),
the Phase 24G summary handoff
([`phase-24g-host-package-consumption-readiness-plan.md`](./phase-24g-host-package-consumption-readiness-plan.md)),
the Phase 24G decision-lock
([`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md)),
the Phase 24F summary handoff
([`phase-24f-dixie-host-issue-draft.md`](./phase-24f-dixie-host-issue-draft.md)),
the Phase 24E summary handoff
([`phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)),
the Phase 24D summary handoff
([`phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)),
the Phase 24C summary handoff
([`phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)),
the Phase 24B summary handoff
([`phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)),
the Phase 24A summary handoff
([`phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)),
the Phase 24A ADR series (ADR-024A through ADR-024D), the
Phase 24B decision-lock
([`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)),
the Phase 24B specs
([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
[`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)),
the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md), read-
only — Phase 24I does not edit it), the current
[`../../package.json`](../../package.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../src/straylight/index.ts`](../../src/straylight/index.ts) /
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) /
[`../../dist-types/`](../../dist-types/)
state (read-only — Phase 24I touches no source, no test, no
config, and no committed declaration). It produces this single
summary handoff, the companion ADR-024H, and this README index
entry. It produces no new fixture, no new script, no new test,
no `package.json` / `package-lock.json` / `tsconfig.json` /
`tsconfig.build.json` / `vitest.config.ts` / `.npmrc` /
`.gitignore` change, no edit to any existing wedge or host
source / test file, no edit to any committed declaration under
`dist-types/`, no append to any prior handoff packet (the
Phase 12 docs already carry Phase 24B + Phase 24E refreshes;
Phase 24I does **not** add a third refresh), no new sibling-repo
handoff packet, and no GitHub-side action. All Phase 9 / 10 /
12 / 14 / 15 / 19A / 20 / 21B / 22A / 23A / 24A / 24B / 24C /
24D / 24E / 24F / 24G / 24H in-repo rows above are unchanged by
Phase 24I.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the Phase 24H post-merge baseline; `npm run build`
clean (the rebuilt `dist-types/` is byte-identical to the
committed artifact); both declaration entrypoints exist;
`npm pack --dry-run` shape is unchanged from Phase 24H (only
`dist-types/**`, `README.md`, `package.json` ship); forbidden-
path diff is **empty**; `git diff --stat` shows only the three
Phase 24I docs (this README append, the new handoff, and the
new ADR-024H); `git status --short` shows only the three
Phase 24I docs plus any pre-existing local dirt.

## Phase 24J — Release posture selection (docs-only)

Phase 24J is a **docs-only release-posture selection handoff**
staged on the `phase-24j-straylight-host-release-posture-plan`
branch inside `loa-straylight` after Phase 24I's gate-plan
merged (PR #35). Phase 24J selects **Gate 1** from ADR-024H
§"Decision" §2 as **Posture 1a** (private + tag-pinned
git-source consumption), and **prepares Gate 2** by pinning the
tag-readiness checklist that a future release / tag execution
phase must run against the tagged tree. The companion
decision-lock is
[`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md).

Phase 24J does **not** cut a release tag, publish the package,
or change package metadata — the current `package.json` /
[`../../.npmrc`](../../.npmrc) /
[`../../.github/workflows/`](../../.github/workflows/)
configuration on `main` already reflects Posture 1a
unambiguously (`"private": true` preserved; no `publish` script
exists; no `@loa:registry=` mapping exists; no GitHub Packages
publish workflow exists). Phase 24J does **not** satisfy
Gate 2; Phase 24J does **not** satisfy Gate 3; the Hounfour
version-skew posture remains unresolved and continues to
independently block any Dixie dependency-flip PR per ADR-024H
§5's conjunctive gate-of-gates rule. Phase 24J does **not**
edit any file under
[`../../src/`](../../src/) /
[`../../tests/`](../../tests/) /
[`../../scripts/`](../../scripts/) /
[`../../fixtures/`](../../fixtures/) /
[`../../dist-types/`](../../dist-types/), edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc) /
[`../../.gitignore`](../../.gitignore), edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md), edit
any prior ADR, edit any prior handoff (other than this README
index entry), edit any sibling repo (`loa-dixie`, `loa-finn`,
`loa-freeside`, `loa-hounfour`), file or edit any GitHub issue /
comment / PR, bump / downgrade / reconcile the Hounfour
dependency range, consume Hounfour `main` or any unpublished
commit, import the Hounfour `#116` five-step conformance
corpus, adopt the `0xhoneyjar:straylight:*` audit-event prefix
family into the Straylight public surface, adopt the
`recall-wedge` Hounfour conformance category into the
Straylight test suite, publish a public commitment root,
advance any ADR-022E gate, run `npm install` / `npm update` /
`npm ci` / `npm publish` / `npm version` / any package-manager
mutation command, request or run Flatline / Bridgebuilder /
red-team review, or touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/). No
Flatline pass is required because Phase 24J makes no
package-surface or source change. The Phase 19A pending
feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24J.

| Document / artifact | Purpose |
|---|---|
| [`phase-24j-release-posture-selection.md`](./phase-24j-release-posture-selection.md) | Phase 24J summary handoff: status banner (docs-only; companion ADR-024I; no tag; no publish; no package/source/test/config/sibling edits; no Flatline required), executive summary (Phase 24J selects private + tag-pinned git-source consumption as the first Straylight release posture; does not cut the tag; does not publish; does not authorize Dixie dependency flip), current package baseline (post-Phase-24I byte-identical state: `@loa/straylight`; `private: true`; type-only `.` and `./host` exports; committed `dist-types/**`; no runtime JS; no runtime conditions; Hounfour `^8.6.0`; no tag; no publish workflow; no `@loa` registry mapping), posture selection table (Posture 1a SELECTED; Posture 1b REJECTED FOR NOW; hybrid REFUSED), tag-readiness checklist (seven items: pre-tag verification commands `npm run typecheck` + `npm run build` + `npm test` + `npm pack --dry-run --json`; declaration entrypoint existence; committed `dist-types/**` matches source-generated output; package artifact allow-list and deny-list; forbidden-path diff empty; tag immutability — no force-push, no retagging, cut a new tag if wrong; reproducibility check), gate status table (Gate 1 SELECTED by Phase 24J; Gate 2 PREPARED but not satisfied; Gate 3 UNRESOLVED still blocking), future Dixie flip implications (future Dixie flip must cite ADR-024H + ADR-024I + future tag event + future Hounfour-skew resolution; Hounfour skew independently blocking; type-only flip only; no value/runtime imports; no endpoint/rendering/vector-9–11/Hounfour-#116/`0xhoneyjar:straylight:*`/`recall-wedge`/commitment-root/runtime-Straylight-import bundling), explicit non-scope (mirrors ADR non-scope; 24 specific refusals; no Flatline required), validation expectations (docs-only: `npm run typecheck` + `npm test` + `npm run build` + `npm pack --dry-run` + empty forbidden-path diff), open follow-ups (tag-naming / version label deferred; future release / tag execution phase deferred; future Hounfour-skew decision phase deferred; future Dixie dependency-flip PR deferred; optional future GitHub Packages Posture 1b available only under a new ADR; runtime widening deferred; Hounfour `#70` pending), cross-references. |
| [`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md) | Phase 24J opening ADR: Status (Accepted-for-Phase-24J; docs-only release posture selection; selects Gate 1 only; prepares Gate 2; does not satisfy Gate 2; does not satisfy Gate 3; no tag; no publish; no `package.json` / `package-lock.json` / `tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts` / `.npmrc` / `.gitignore` / source / test / fixtures / scripts / dist-types / `package-boundary.md` / prior-ADR / prior-handoff / sibling-repo / `.github/` / `.loa` / `.claude/` / `.beads/` / `.run/` / `grimoires/loa/a2a/` / `node_modules/` touch; no Hounfour bump / change; no `#116` corpus import; no `0xhoneyjar:straylight:*` adoption; no `recall-wedge` adoption; no commitment-root publication; no ADR-022E gate advance; no Flatline / Bridgebuilder / red-team review), Context (Phase 24H landed type-only `@loa/straylight/host`; Phase 24I defined the gate-of-gates rule; three remaining gates — Gate 1 publish/private posture, Gate 2 release/tag consumption point, Gate 3 Hounfour version-skew resolution; current package state recap: `private: true`; no `main`; type-only exports for `.` and `./host`; committed `dist-types/**`; `files` includes `dist-types/` + `README.md` + `package.json`; no runtime export conditions; Hounfour `^8.6.0`; no tag exists; no `@loa` registry mapping; no publish script/workflow for `@loa/straylight`; `.github/workflows/post-merge.yml` performs tag creation under Loa-framework discipline but contains no `npm publish` step and no GitHub Packages publish job), **Decision** (three rules: §1 Select Posture 1a — preserve `"private": true`, no npm/GitHub Packages publish, no `@loa` registry setup, future sibling-repo consumption via tag-pinned git source `"@loa/straylight": "github:0xHoneyJar/loa-straylight#v<X.Y.Z>"`, committed `dist-types/**` is the authoritative type-only artifact, current configuration already reflects Posture 1a unambiguously so no `package.json` / `.npmrc` / `.github/workflows/` edit required; §2 Refuse Posture 1b for now — no un-`private`, no GitHub Packages publishing, no registry/publish workflow change, no `@loa:registry=` line, no `publish`/`prepublishOnly`/`prepack`/`postpublish` script; §3 Refuse hybrid posture unless a later ADR explicitly reopens it — a change that simultaneously preserves `"private": true` and adds a `publish` script (or un-`private`s while leaving `prepare` unchanged) is non-conforming on its face), Rationale (Posture 1a is the lowest-blast-radius selection: no `@loa` registry mapping exists; no publishing workflow exists for `@loa/straylight`; GitHub Packages publishing would require registry auth, versioning, workflow, visibility, and package-management decisions; Phase 24H already made tag-pinned source consumption viable by committing `dist-types/**`; Posture 1b is rejected for now but not permanently; Gate 3 is not selected by Phase 24J — Phase 24J's scope is deliberately narrow), Gate status (Gate 1 SELECTED by Phase 24J; Gate 2 PREPARED but not satisfied; Gate 3 UNRESOLVED still blocking), Tag-readiness checklist for a future release / tag execution phase (seven sections: §1 pre-tag verification commands `npm run typecheck` + `npm run build` + `npm test` + `npm pack --dry-run --json`; §2 declaration entrypoint existence — both `dist-types/src/straylight/index.d.ts` and `dist-types/src/straylight/host/index.d.ts`; §3 committed `dist-types/**` matches source-generated output via clean rebuild; §4 package artifact contents allow-list `README.md` + `package.json` + `dist-types/**/*.d.ts` plus deny-list for `src/`, `tests/`, `scripts/`, `fixtures/`, `docs/`, `node_modules/`, local/system artifacts, `package-lock.json`, `.npmrc`, `.gitignore`, any `tsconfig*.json`, `vitest.config.ts`, non-declaration files under `dist-types/`; §5 forbidden-path diff empty; §6 tag immutability — no force-push, no retagging, cut a new tag at a new version label if wrong, wrong tag remains in history annotated as superseded; §7 reproducibility check `git checkout <tag> && npm run clean:types && npm run build && git diff -- dist-types/` produces empty output), Refused consumption shortcuts (no `main`-HEAD dependency; no raw commit-SHA dependency flip; no unpublished working-tree dependency; no workspace-path dependency as production posture; no Dixie dependency flip without all three gates), Dixie flip rule after Phase 24J (Phase 24J alone does not authorize Dixie dependency flip; future Dixie flip must cite ADR-024I for Gate 1 + future release/tag event for Gate 2 + future Hounfour-skew resolution for Gate 3; until all are present, a Dixie dependency flip is non-conforming), Explicit non-scope (24 Phase-24J-specific refusals; inheritance of all ADR-024A through ADR-024H non-goals), Future-phase entry conditions (future release / tag execution phase: ADR-024H + Phase 24I handoff + ADR-024I merged; opening ADR cites ADR-024I §"Tag-readiness checklist"; checklist passes against tagged tree; no sibling-repo wiring in same PR — future Hounfour-skew decision phase: ADR-024H + Phase 24I handoff merged; opening doc selects Posture 3a / 3b / 3c per ADR-024H §4; implementation PR honors selected posture's refusal rules; phase may run in either repository; Gate 3 independent of Gate 1 — future Dixie dependency-flip phase: ADR-024H + Phase 24I handoff merged; Gate 1 satisfied by ADR-024I; Gate 2 satisfied by future tag event; Gate 3 satisfied by future Hounfour-skew decision; Dixie-side flip PR opens in `loa-dixie` and cites ADR-024H + ADR-024I + Gate-2 event + Gate-3 resolving artifact; type-only flip only; Dixie-side review approves independently), Consequences (Gate 1 selected and reviewable; Gate 2 prepared and reviewable; no package metadata change required; tag immutability pinned at decision time; Gate 3 remains independently load-bearing; hybrid posture remains refused; Dixie PR #96 remains the correct transitional seam; Phase 24H type-consumability remains intact; no silent gate satisfaction; ADR-024I additive to ADR-024H), Source files inspected. |

The Phase 24J packet consumes the Phase 24I summary handoff
([`phase-24i-release-and-dixie-flip-gate-plan.md`](./phase-24i-release-and-dixie-flip-gate-plan.md)),
the Phase 24I decision-lock
([`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md)),
the Phase 24H summary handoff
([`phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md)),
the Phase 24H decision-lock
([`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md)),
the Phase 24G summary handoff
([`phase-24g-host-package-consumption-readiness-plan.md`](./phase-24g-host-package-consumption-readiness-plan.md)),
the Phase 24G decision-lock
([`../decisions/ADR-024F-host-package-consumption-readiness.md`](../decisions/ADR-024F-host-package-consumption-readiness.md)),
the Phase 24F / 24E / 24D / 24C / 24B / 24A handoffs and their
ADR series, the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md), read-
only — Phase 24J does not edit it), the current
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../.npmrc`](../../.npmrc) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.gitignore`](../../.gitignore) /
[`../../.github/workflows/post-merge.yml`](../../.github/workflows/post-merge.yml) /
[`../../src/straylight/index.ts`](../../src/straylight/index.ts) /
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) /
[`../../dist-types/`](../../dist-types/) /
[`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts) /
[`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
state (read-only — Phase 24J touches no source, no test, no
config, no committed declaration, no GitHub workflow). It
produces this single summary handoff, the companion ADR-024I,
and this README index entry. It produces no new fixture, no new
script, no new test, no `package.json` / `package-lock.json` /
`tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts` /
`.npmrc` / `.gitignore` / `.github/workflows/` change, no edit
to any existing wedge or host source / test file, no edit to
any committed declaration under `dist-types/`, no append to any
prior handoff packet, no new sibling-repo handoff packet, and
no GitHub-side action. All Phase 9 / 10 / 12 / 14 / 15 / 19A /
20 / 21B / 22A / 23A / 24A / 24B / 24C / 24D / 24E / 24F / 24G /
24H / 24I in-repo rows above are unchanged by Phase 24J.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the Phase 24I post-merge baseline; `npm run build`
clean (the rebuilt `dist-types/` is byte-identical to the
committed artifact); both declaration entrypoints exist;
`npm pack --dry-run` shape is unchanged from Phase 24H (only
`dist-types/**`, `README.md`, `package.json` ship); forbidden-
path diff is **empty**; `git diff --stat` shows only the three
Phase 24J docs (this README append, the new handoff, and the
new ADR-024I); `git status --short` shows only the three
Phase 24J docs plus any pre-existing local dirt.

## Phase 24K — Release / tag execution plan (docs-only opening)

Phase 24K-opening is a **docs-only release / tag execution
plan** staged on the `phase-24k-release-tag-execution-plan`
branch inside `loa-straylight` after Phase 24J's release-posture
selection merged (PR #36). Phase 24K-opening selects the exact
tag label (`v0.0.1`, annotated) and the verification approach
(in-tree clean-rebuild + `git diff -- dist-types/`) that a
future operator action will use to satisfy ADR-024H §3 /
ADR-024I §"Tag-readiness checklist" (Gate 2). The companion
decision-lock is
[`../decisions/ADR-024J-release-tag-execution.md`](../decisions/ADR-024J-release-tag-execution.md).

Phase 24K-opening does **not** create the tag, does **not**
push the tag, does **not** satisfy Gate 2, does **not** satisfy
Gate 3, and does **not** authorize a Dixie dependency flip. The
actual tag creation + push is a later operator action whose own
handoff must record the pre-tag checklist outputs against the
verifying commit, run the tag command, and record the post-tag
verification outputs. Until that operator action successfully
creates and pushes the annotated `v0.0.1` tag, Gate 2 remains
**prepared, not satisfied**. Phase 24K-opening does **not**
edit any file under
[`../../src/`](../../src/) /
[`../../tests/`](../../tests/) /
[`../../scripts/`](../../scripts/) /
[`../../fixtures/`](../../fixtures/) /
[`../../dist-types/`](../../dist-types/), edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc) /
[`../../.gitignore`](../../.gitignore), edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md), edit
any prior ADR, edit any prior handoff (other than this README
index entry), edit any sibling repo (`loa-dixie`, `loa-finn`,
`loa-freeside`, `loa-hounfour`), file or edit any GitHub issue /
comment / PR, bump / downgrade / reconcile the Hounfour
dependency range, consume Hounfour `main` or any unpublished
commit, import the Hounfour `#116` five-step conformance
corpus, adopt the `0xhoneyjar:straylight:*` audit-event prefix
family into the Straylight public surface, adopt the
`recall-wedge` Hounfour conformance category into the
Straylight test suite, publish a public commitment root,
advance any ADR-022E gate, run `npm install` / `npm update` /
`npm ci` / `npm publish` / `npm version` / `npm pack` (as a
publish step) / `git tag` / `git push --tags` / `gh release
create` / any package-manager mutation command, request or run
Flatline / Bridgebuilder / red-team review, or touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/). No
Flatline pass is required because Phase 24K-opening makes no
package-surface or source change; the tag itself, when later
cut by a separate operator action, will cite a commit whose
package surface is byte-identical to the post-Phase-24J `main`.
The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24K-opening.

| Document / artifact | Purpose |
|---|---|
| [`phase-24k-release-tag-execution.md`](./phase-24k-release-tag-execution.md) | Phase 24K-opening summary handoff: status banner (docs-only; companion ADR-024J; selects `v0.0.1` annotated tag plan; no tag created yet; Gate 2 not yet satisfied; Gate 3 unresolved; no package/source/test/config/dist-types/sibling-repo edits; no Flatline required), executive summary (Phase 24K-opening prepares the no-file operator action that will later cut and push an immutable annotated `v0.0.1` tag; selects tag label / annotated posture / tag target / verification approach / no-Release / no-publish / no-metadata-edit; refuses package-mutation commands; defines pre-tag and post-tag validation; does not execute the tag), current state (branch; `main` HEAD post-PR-#36; empty local + remote tags; zero GitHub Releases; package `@loa/straylight` at `0.0.1` with `private: true`; absent `publish` scripts; absent `@loa` registry mapping; absent publish workflow; both declaration entrypoints present; empty forbidden-path diff; Hounfour `^8.6.0`; Posture 1a satisfied; Posture 1b refused; hybrid refused), tag plan table (tag name `v0.0.1`; annotated; target = verified post-Phase-24K-opening `main`; verification approach = in-tree clean-rebuild + `git diff -- dist-types/`; no Release; no publish; no `version` edit; no metadata edit; retag/force-push forbidden), pre-tag checklist (operator action after this PR merges; exact command sequence: `git fetch origin --tags` + `git switch main` + `git pull --ff-only` + forbidden-path `git diff` + `npm run typecheck` + `npm run build` + `npm test` + `npm pack --dry-run --json` + `ls` of both `.d.ts` entrypoints + `npm run clean:types` + `npm run build` + `git diff -- dist-types/`; acceptance criteria: every command exit 0, forbidden-path diff empty, both entrypoints exist on disk, final `dist-types` diff empty, pack JSON files array contains only `README.md` + `package.json` + `dist-types/**/*.d.ts` and no forbidden prefix / forbidden file; if any criterion fails, do not cut the tag), tag command (operator action after PR merges; `git tag -a v0.0.1 -m "Phase 24K — Straylight v0.0.1 ..."` then `git push origin v0.0.1`; clearly marked do-not-run-inside-this-PR), post-tag verification (`git tag --list` + `git rev-parse` + `git rev-parse v0.0.1^{commit}` + `git cat-file -t` + `git show --stat --no-patch` + `git ls-remote --tags`; acceptance criteria: tag listed, annotated SHA, commit SHA matches verifying commit, type=tag, tagger/date/message visible, remote ref present with matching SHA; record each output in operator-action handoff), gate status (before tag cut: Gate 1 satisfied; Gate 2 prepared not satisfied; Gate 3 unresolved — after tag cut: Gate 1 still satisfied; Gate 2 satisfied; Gate 3 still unresolved), Dixie warning (v0.0.1 alone does not authorize Dixie flip; future Dixie flip must cite ADR-024H + ADR-024I + ADR-024J + the cut `v0.0.1` tag + Gate-3 resolving artifact; Hounfour skew independently load-bearing; type-only flip only; no value/runtime imports; no endpoint/rendering/vector-9–11/Hounfour-#116/`0xhoneyjar:straylight:*`/`recall-wedge`/commitment-root/runtime-Straylight-import bundling), explicit non-scope (27 Phase-24K-opening-specific refusals; inheritance of all ADR-024A through ADR-024I non-goals), validation expectations (docs-only: `npm run typecheck` + `npm test` + `npm run build` + `npm pack --dry-run` + empty forbidden-path diff; no new tests; no package mutation; no tag; no push; no Release; no publish), open follow-ups (run pre-tag checklist; create and push `v0.0.1`; run post-tag verification; verify remote tag; then separately resolve Gate 3; only after Gate 3 consider Dixie flip; future tag bumps `v0.0.2+` deferred; Posture 1b reopening deferred; runtime widening deferred; Hounfour `#70` pending), cross-references. |
| [`../decisions/ADR-024J-release-tag-execution.md`](../decisions/ADR-024J-release-tag-execution.md) | Phase 24K-opening ADR: Status (Accepted-for-Phase-24K-opening; docs-only release / tag execution plan; selects tag label and verification approach; does not create the tag; does not satisfy Gate 2; does not satisfy Gate 3; no tag; no push; no publish; no GitHub Release; no `package.json` / `package-lock.json` / `tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts` / `.npmrc` / `.gitignore` / source / test / fixtures / scripts / dist-types / `package-boundary.md` / prior-ADR / prior-handoff / sibling-repo / `.github/` / `.loa` / `.claude/` / `.beads/` / `.run/` / `grimoires/loa/a2a/` / `node_modules/` touch; no Hounfour bump / change; no `#116` corpus import; no `0xhoneyjar:straylight:*` adoption; no `recall-wedge` adoption; no commitment-root publication; no ADR-022E gate advance; no Flatline / Bridgebuilder / red-team review), Context (Phase 24H landed type-only `@loa/straylight/host`; Phase 24I defined gate-of-gates; Phase 24J selected Posture 1a and prepared Gate 2; current package state recap: `private: true`; type-only exports; committed `dist-types/**`; no runtime export conditions; Hounfour `^8.6.0`; no tags; zero Releases; no `@loa` registry mapping; no publish workflow; empty forbidden-path diff against `main`), **Decision** (nine rules: §1 Select `v0.0.1` — exact lowercase `v` prefix, no suffix, matches `package.json` `version` byte-for-byte; §2 Annotated tag, not lightweight — `git tag -a`, audit-trail substrate, lightweight tags refused; §3 Tag target = verified post-Phase-24K-opening `main` commit — operator must re-run checklist if a non-Phase-24K merge changes the surface; §4 Verification approach for ADR-024I §"Tag-readiness checklist" §3 = in-tree clean-rebuild + `git diff -- dist-types/` (selected over scratch-directory byte-compare fallback for simplicity + repo-aligned with prior Phase 24H/24I/24J validation flow + trivially diagnosable drift); §5 No GitHub Release under Posture 1a — Posture 1a's git-source consumption doesn't need a Release surface, and a Release would reopen Posture 1b's discoverability without a successor ADR; §6 No publish — no `npm publish`, no GitHub Packages, no alternate-registry publish, `"private": true` preserved; §7 No `version` field change — `v0.0.1` already matches; §8 No package metadata change — `package.json` / `package-lock.json` / `.npmrc` / `.gitignore` / `tsconfig*.json` / `vitest.config.ts` / source / tests / scripts / fixtures / `dist-types/` / `package-boundary.md` byte-identical at tag cut; §9 Tag immutability — no force-push, no retag, cut a new tag at a new label if `v0.0.1` is wrong, wrong tag stays in history annotated as superseded), Version-label rationale (`v0.0.1` selected over `v0.1.0` and `v1.0.0`: matches `package.json`; lowest-blast-radius; honors Posture 1a "version semantics" tradeoff axis; preserves bump room; `v0.1.0` rejected because no field has changed and no minor-bump cadence is reviewed; `v1.0.0` rejected because it overclaims stability and prematurely commits to semver-major discipline; pre-release / build-metadata suffixes rejected because they're outside Posture 1a's consumption template), Verification method (full operator-action pre-tag checklist: `git fetch origin --tags` + `git switch main` + `git pull --ff-only` + forbidden-path `git diff` + `npm run typecheck` + `npm run build` + `npm test` + `npm pack --dry-run --json` + `ls` of both `.d.ts` entrypoints + `npm run clean:types` + `npm run build` + `git diff -- dist-types/`; acceptance criteria: every command exit 0, forbidden-path diff empty, both entrypoints present, final dist-types diff empty, pack JSON files array allow/deny shape; if any criterion fails do not cut the tag), Tag command (to be run later by operator; `git tag -a v0.0.1 -m "..."` + `git push origin v0.0.1`; one-action requirement; do-not-run-inside-this-PR), Post-tag verification commands (full operator-action checklist with acceptance criteria), Gate status (before / after tables; Gate 1 satisfied by ADR-024I; Gate 2 prepared by ADR-024J then satisfied by future operator action; Gate 3 unresolved before and after), Explicit non-scope (27 Phase-24K-opening-specific refusals; inheritance of all ADR-024A through ADR-024I non-goals), Consequences (Gate 2 has an unambiguous execution spec; Gate 2 not satisfied yet; the tag is reusable across all three Gate-3 outcomes; tag immutability pinned at decision time; no Release; verification approach pinned; no package-surface or source change; ADR-024J additive to ADR-024I), Source files inspected. |

The Phase 24K-opening packet consumes the Phase 24J summary handoff
([`phase-24j-release-posture-selection.md`](./phase-24j-release-posture-selection.md)),
the Phase 24J decision-lock
([`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md)),
the Phase 24I summary handoff
([`phase-24i-release-and-dixie-flip-gate-plan.md`](./phase-24i-release-and-dixie-flip-gate-plan.md)),
the Phase 24I decision-lock
([`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md)),
the Phase 24H summary handoff
([`phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md)),
the Phase 24H decision-lock
([`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md)),
the Phase 24G / 24F / 24E / 24D / 24C / 24B / 24A handoffs and
their ADR series, the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md), read-
only — Phase 24K-opening does not edit it), the current
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../.npmrc`](../../.npmrc) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.gitignore`](../../.gitignore) /
[`../../.github/workflows/post-merge.yml`](../../.github/workflows/post-merge.yml) /
[`../../src/straylight/index.ts`](../../src/straylight/index.ts) /
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) /
[`../../dist-types/`](../../dist-types/) /
[`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts) /
[`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
state (read-only — Phase 24K-opening touches no source, no
test, no config, no committed declaration, no GitHub workflow,
no `package.json`, no `package-lock.json`, no `.npmrc`, no
`.gitignore`). It produces this single summary handoff, the
companion ADR-024J, and this README index entry. It produces
no new fixture, no new script, no new test, no
`package.json` / `package-lock.json` / `tsconfig.json` /
`tsconfig.build.json` / `vitest.config.ts` / `.npmrc` /
`.gitignore` / `.github/workflows/` change, no edit to any
existing wedge or host source / test file, no edit to any
committed declaration under `dist-types/`, no append to any
prior handoff packet, no new sibling-repo handoff packet, no
GitHub-side action, no tag, no tag push, and no GitHub Release.
All Phase 9 / 10 / 12 / 14 / 15 / 19A / 20 / 21B / 22A / 23A /
24A / 24B / 24C / 24D / 24E / 24F / 24G / 24H / 24I / 24J
in-repo rows above are unchanged by Phase 24K-opening.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the Phase 24J post-merge baseline; `npm run
build` clean (the rebuilt `dist-types/` is byte-identical to
the committed artifact); both declaration entrypoints exist;
`npm pack --dry-run` shape is unchanged from Phase 24H (only
`dist-types/**`, `README.md`, `package.json` ship); forbidden-
path diff is **empty**; `git diff --stat` shows only the three
Phase 24K-opening docs (this README append, the new handoff,
and the new ADR-024J); `git status --short` shows only the
three Phase 24K-opening docs plus any pre-existing local dirt.

## Phase 24L — Dixie host type-only consumption intake (docs-only)

Phase 24L is a **docs-only Dixie host type-only consumption
intake** staged on the `phase-24l-dixie-host-type-consumption-intake`
branch inside `loa-straylight` after Phase 24K-opening (PR #37)
merged, an operator action subsequently cut and pushed the
annotated `v0.0.1` tag against the post-Phase-24K-opening `main`
commit `de65d93568e70c53ba952279f41a23d2f7d5123e`, Dixie PR #97
merged Hounfour `8.3.1 → 8.6.0` Gate-3 alignment, and Dixie
PR #99 merged the type-only `@loa/straylight` dependency flip.
Phase 24L is the in-repo intake record on the Straylight side
and **absorbs** the operator-action record (no separate
Phase 24K-closing handoff was authored at tag-cut time). The
companion decision-lock is
[`../decisions/ADR-024K-dixie-host-type-consumption-intake.md`](../decisions/ADR-024K-dixie-host-type-consumption-intake.md).

Phase 24L records that **all three ADR-024H gates are satisfied**:
Gate 1 by Phase 24J (Posture 1a; ADR-024I §"Decision" §1);
Gate 2 by the operator action that cut + pushed the annotated
`v0.0.1` tag against `de65d93568e70c53ba952279f41a23d2f7d5123e`
honoring all nine ADR-024J §"Decision" rules (label `v0.0.1`;
annotated; correct target; in-tree clean-rebuild + `git diff
-- dist-types/` verification approach; no GitHub Release; no
publish; no `version` change; no metadata change; no force-push
/ retag); Gate 3 by Posture 3a (Dixie PR #97 bumped
`@0xhoneyjar/loa-hounfour` from `v8.3.1` to `v8.6.0`, matching
Straylight's `^8.6.0` pin). Phase 24L records Dixie PR #99 as
the **first conforming downstream consumer** of the post-
Phase-24H type-only Straylight surface: `app/package.json`
declares `@loa/straylight` as
`github:0xHoneyJar/loa-straylight#v0.0.1` (Posture 1a's
consumption template); `app/package-lock.json` resolves
Straylight to `de65d93568e70c53ba952279f41a23d2f7d5123e` (the
same commit `v0.0.1` points at); `@0xhoneyjar/loa-hounfour@8.6.0`
is **deduped** across Dixie's app and the consumed Straylight
tree (no Posture 3c isolation needed); Dixie's previous local
`host/types.ts` mirror was **deleted**; Dixie now imports types
from `@loa/straylight/host` using `import type` / `export type`
only (honoring the Phase 24H supported-consumer envelope:
TypeScript >= 5.4; `moduleResolution: "Bundler"` or `"NodeNext"`;
`import type` only); Dixie's local runtime helpers remain local;
no runtime Straylight import was added; required CI passed
Dixie-side after a workflow auth patch; a Dixie-side
`package-contract` tripwire test (Dixie-owned) remains in place
to catch drift in the consumed surface; advisory staging smoke
may still fail Dixie-side on environment / GHCR / package-access
infrastructure grounds (a **Dixie-side infra concern, explicitly
not a Straylight gate**).

Phase 24L does **not** create a new tag, **not** push a tag,
**not** publish, **not** create a GitHub Release, **not**
author or modify any test, **not** edit any source / test /
config / dist-types / package metadata, **not** edit any sibling
repo, **not** advance any ADR-022E gate, **not** advance the
Phase 19A pending feedback gate, **not** authorize any further
Dixie consumption, **not** authorize any runtime widening, and
**not** request any Flatline / Bridgebuilder / red-team review.
Phase 24L does **not** edit any file under
[`../../src/`](../../src/) /
[`../../tests/`](../../tests/) /
[`../../scripts/`](../../scripts/) /
[`../../fixtures/`](../../fixtures/) /
[`../../dist-types/`](../../dist-types/), edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc) /
[`../../.gitignore`](../../.gitignore), edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md), edit
any prior ADR, edit any prior handoff (other than this README
index entry), edit any sibling repo (`loa-dixie`, `loa-finn`,
`loa-freeside`, `loa-hounfour`), file or edit any GitHub issue /
comment / PR, bump / downgrade / reconcile the Hounfour
dependency range, consume Hounfour `main` or any unpublished
commit, import the Hounfour `#116` five-step conformance
corpus, adopt the `0xhoneyjar:straylight:*` audit-event prefix
family into the Straylight public surface, adopt the
`recall-wedge` Hounfour conformance category into the
Straylight test suite, publish a public commitment root,
advance any ADR-022E gate, run `npm install` / `npm update` /
`npm ci` / `npm publish` / `npm version` / `npm pack` (as a
publish step) / `git tag` / `git push --tags` / `gh release
create` / any package-manager mutation command, request or run
Flatline / Bridgebuilder / red-team review, or touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/). No
Flatline pass is required because Phase 24L makes no package-
surface or source change; the events being recorded are external
to this PR (the `v0.0.1` tag was cut by a separate operator
action against an already-merged `main` commit; Dixie PR #97 /
PR #99 were authored and reviewed Dixie-side).
The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24L.

| Document / artifact | Purpose |
|---|---|
| [`phase-24l-dixie-host-type-consumption-intake.md`](./phase-24l-dixie-host-type-consumption-intake.md) | Phase 24L summary handoff: status banner (docs-only; companion ADR-024K; absorbs Phase 24K-closing operator-action record; no new tag; no push; no Release; no publish; no source/test/config/dist-types/sibling-repo edits; no Flatline required), executive summary (records Gate 1 / 2 / 3 as satisfied; records the operator action that cut + pushed annotated `v0.0.1` against `de65d93568e70c53ba952279f41a23d2f7d5123e` honoring all nine ADR-024J §"Decision" rules; records Dixie PR #97 as Hounfour-8.6.0 Gate-3 alignment via Posture 3a; records Dixie PR #99 as the first conforming type-only flip; records the Dixie tripwire test as Dixie-owned; mentions advisory staging smoke once as a Dixie-side infra concern, not a Straylight gate; refuses runtime widening / endpoint / route / middleware / proxy / rendering / vector 9 / 10 / 11 widening / Hounfour `#116` adoption / `0xhoneyjar:straylight:*` adoption / `recall-wedge` adoption / public commitment-root behavior / Hounfour change / Straylight dependency-posture change / new tag-or-release / sibling-repo edit / additional Dixie consumption / Phase 19A advance), Phase 24H/24I/24J/24K-opening recap, current state (branch; `main` HEAD = `de65d93568e70c53ba952279f41a23d2f7d5123e`; `v0.0.1` annotated tag points at that commit; remote tag present; zero Releases; package `@loa/straylight` at `0.0.1` with `private: true`; absent `publish` scripts; absent `@loa` registry mapping; absent publish workflow; both declaration entrypoints present; empty forbidden-path diff; Hounfour `^8.6.0` Straylight-side, `8.6.0` Dixie-side, deduped at `8.6.0`; Dixie `app/package.json` Straylight specifier `github:0xHoneyJar/loa-straylight#v0.0.1`; Dixie `app/package-lock.json` Straylight resolution `de65d93568e70c53ba952279f41a23d2f7d5123e`; Dixie local `host/types.ts` mirror deleted; Dixie type imports `import type` / `export type` only; no runtime Straylight imports added; Dixie runtime helpers remain local; required CI passed after workflow auth patch; `package-contract` tripwire test in place Dixie-owned; advisory staging smoke may still fail Dixie-side infra; Posture 1a satisfied; Posture 1b refused; hybrid refused), gate satisfaction record table (Gate 1 / 2 / 3 each satisfying event + source artifact), operator-action record (absorbed Phase 24K-closing): pre-tag validation per ADR-024J §"Verification method" (`git fetch origin --tags` + `git switch main` + `git pull --ff-only` + forbidden-path `git diff` + `npm run typecheck` + `npm run build` + `npm test` + `npm pack --dry-run --json` + `ls` of both `.d.ts` entrypoints + `npm run clean:types` + `npm run build` + `git diff -- dist-types/`); acceptance, as observed (every command exit 0, forbidden-path diff empty, both entrypoints present, final `dist-types/` diff empty, pack JSON `files` array contains only `README.md` / `package.json` / `dist-types/**/*.d.ts` and no forbidden prefix or forbidden file); tag command (`git tag -a v0.0.1 -m "Phase 24K — Straylight v0.0.1 ..."` + `git push origin v0.0.1`; tag message reflects gate state at cut time and is not retroactively edited per ADR-024J §"Decision" §9 + ADR-024I §6); post-tag verification (`git tag --list` / `git rev-parse` / `git rev-parse v0.0.1^{commit}` / `git cat-file -t` / `git show --stat --no-patch` / `git ls-remote --tags`; acceptance, as observed: tag listed, annotated SHA, commit SHA = `de65d93568e70c53ba952279f41a23d2f7d5123e`, type=`tag`, tagger Eileen C `<ecyleileen@gmail.com>` / date Sun May 17 10:08:07 2026 +0200 / ADR-024J-prescribed message body, remote ref present with matching SHA), Dixie consumption record (conformance facts: citation chain ADR-024H §5 + ADR-024I §"Dixie flip rule after Phase 24J" + ADR-024J §"Consequences"; dependency template `github:0xHoneyJar/loa-straylight#v0.0.1`; lockfile pinned at `de65d93568e70c53ba952279f41a23d2f7d5123e`; Hounfour deduped at `8.6.0`; local `host/types.ts` mirror deleted; type-only `import type` / `export type` consumption; local runtime helpers preserved; required CI passed after workflow auth patch; tripwire test in place Dixie-owned; advisory staging smoke flagged Dixie-side once; conformance non-facts: no value imports, no runtime imports, no endpoint / route / middleware / proxy / rendering, no vector 9 / 10 / 11 widening, no Hounfour `#116` / `0xhoneyjar:straylight:*` / `recall-wedge` adoption, no public commitment-root, no Straylight dependency-posture change, no Hounfour change), cross-repo fact provenance (each fact + source + observed-at), refusal rules (13 explicit refusals reviewers may cite verbatim), explicit non-scope (29 Phase-24L-specific refusals; inheritance of all ADR-024A through ADR-024J non-goals), validation expectations (docs-only: `npm run typecheck` + `npm test` + `npm run build` + `npm pack --dry-run` + empty forbidden-path diff; no new tests; no package mutation; no tag; no push; no Release; no publish; tag-existence re-verification), open follow-ups (future Straylight-side downstream-adoption phases; future runtime-widening ADR; future tag bumps; Posture 1b reopening only under successor ADR; Hounfour-skew successor ADR only if Dixie diverges; Phase 19A `#70` pending; Dixie staging-smoke remediation Dixie-side; Dixie tripwire-test co-evolution Dixie-owned), cross-references. |
| [`../decisions/ADR-024K-dixie-host-type-consumption-intake.md`](../decisions/ADR-024K-dixie-host-type-consumption-intake.md) | Phase 24L ADR: Status (Accepted-for-Phase-24L; docs-only Dixie host type-only consumption intake; records Gate 1 / 2 / 3 as satisfied; absorbs Phase 24K-closing operator-action record; no new tag; no push; no publish; no GitHub Release; no `package.json` / `package-lock.json` / `tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts` / `.npmrc` / `.gitignore` / source / test / fixtures / scripts / dist-types / `package-boundary.md` / prior-ADR / prior-handoff / sibling-repo / `.github/` / `.loa` / `.claude/` / `.beads/` / `.run/` / `grimoires/loa/a2a/` / `node_modules/` touch; no Hounfour bump / change; no `#116` corpus import; no `0xhoneyjar:straylight:*` adoption; no `recall-wedge` adoption; no commitment-root publication; no ADR-022E gate advance; no Flatline / Bridgebuilder / red-team review), Context (Phase 24H landed type-only `@loa/straylight/host`; Phase 24I defined gate-of-gates; Phase 24J selected Posture 1a and prepared Gate 2; Phase 24K-opening pinned Gate 2 execution parameters; events Phase 24L records: operator action cut + pushed annotated `v0.0.1` against `de65d93568e70c53ba952279f41a23d2f7d5123e`, Dixie PR #97 bumped `@0xhoneyjar/loa-hounfour` from `v8.3.1` to `v8.6.0` satisfying Gate 3 via Posture 3a, Dixie PR #99 flipped the type-only dependency conformingly; current package state recap unchanged byte-identical to post-Phase-24K-opening; gate status entering Phase 24L: Gate 1 satisfied / Gate 2 satisfied / Gate 3 satisfied), **Decision** (five rules: §1 Record Gate 1 as satisfied — Posture 1a; ADR-024I §"Decision" §1 preserved; `private: true` preserved; no `publish` scripts; no `@loa:registry=`; no GitHub Packages publish workflow; no `npm publish` / GitHub Packages publish performed; §2 Record Gate 2 as satisfied — annotated `v0.0.1` cut + pushed against `de65d93568e70c53ba952279f41a23d2f7d5123e` honoring all nine ADR-024J §"Decision" rules verbatim; §3 Record Gate 3 as satisfied via Posture 3a — Dixie PR #97 bumped Hounfour to `v8.6.0`; Hounfour deduped at `8.6.0`; no Posture 3c isolation needed; no Straylight-side Hounfour change required; lowest-blast-radius Gate-3 outcome; future divergence reopens under successor ADR; §4 Record Dixie PR #99 as a conforming type-only flip — citation chain ADR-024H §5 + ADR-024I + ADR-024J; dependency template `github:0xHoneyJar/loa-straylight#v0.0.1`; lockfile pinned at `de65d93568e70c53ba952279f41a23d2f7d5123e`; Hounfour deduped at `8.6.0`; local `host/types.ts` mirror deleted; type-only `import type` / `export type` consumption only; no value imports / runtime imports / dynamic `import()` / `require()` against `@loa/straylight*`; honors Phase 24H supported-consumer envelope; local runtime helpers preserved; CI passed after workflow auth patch; tripwire test in place Dixie-owned; advisory staging smoke noted as Dixie-side infra concern not Straylight gate; conformance non-facts enumerate everything Dixie PR #99 did NOT do; §5 Refusal rules for citing Phase 24L — twelve refusals reviewers may cite verbatim: no runtime widening, no endpoint / route / middleware / proxy / rendering, no vector 9 / vectors 10–11, no Hounfour `#116` adoption, no `0xhoneyjar:straylight:*` adoption, no Hounfour `recall-wedge` adoption, no public commitment-root behavior, no Hounfour change, no Straylight dependency-posture change, no new tag or release, no sibling-repo edit, no Phase 19A pending feedback advance), Operator-action record (absorbed Phase 24K-closing; pre-tag validation + acceptance-as-observed + tag command + post-tag verification + acceptance with concrete commit SHA / tagger / date / message), Cross-repo fact provenance (each cross-repo fact recorded as observed at intake time; provenance table; future-revert-resolving-action note), Gate status (after Phase 24L merges: Gate 1 / 2 / 3 all satisfied), Explicit non-scope (29 Phase-24L-specific refusals; inheritance of all ADR-024A through ADR-024J non-goals), Consequences (all three ADR-024H gates satisfied; type-only Straylight surface exercised by first real downstream consumer; Dixie's local mirror gone; Hounfour deduplication holds; tag immutability observable; no package-surface or source change; Phase 24L is the Straylight-side downstream-adoption anchor; runtime widening remains explicitly deferred; ADR-024K is additive to ADR-024H / I / J), Source files inspected. |

The Phase 24L packet consumes the Phase 24K-opening summary
handoff
([`phase-24k-release-tag-execution.md`](./phase-24k-release-tag-execution.md)),
the Phase 24K-opening decision-lock
([`../decisions/ADR-024J-release-tag-execution.md`](../decisions/ADR-024J-release-tag-execution.md)),
the Phase 24J summary handoff
([`phase-24j-release-posture-selection.md`](./phase-24j-release-posture-selection.md)),
the Phase 24J decision-lock
([`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md)),
the Phase 24I summary handoff
([`phase-24i-release-and-dixie-flip-gate-plan.md`](./phase-24i-release-and-dixie-flip-gate-plan.md)),
the Phase 24I decision-lock
([`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md)),
the Phase 24H summary handoff
([`phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md)),
the Phase 24H decision-lock
([`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md)),
the Phase 24G / 24F / 24E / 24D / 24C / 24B / 24A handoffs and
their ADR series, the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md), read-
only — Phase 24L does not edit it), the current
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../.npmrc`](../../.npmrc) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.gitignore`](../../.gitignore) /
[`../../.github/workflows/post-merge.yml`](../../.github/workflows/post-merge.yml) /
[`../../src/straylight/index.ts`](../../src/straylight/index.ts) /
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) /
[`../../dist-types/`](../../dist-types/) /
[`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts) /
[`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
state (read-only — Phase 24L touches no source, no test, no
config, no committed declaration, no GitHub workflow, no
`package.json`, no `package-lock.json`, no `.npmrc`, no
`.gitignore`), and the existing annotated `v0.0.1` tag (read-
only — pointed at `de65d93568e70c53ba952279f41a23d2f7d5123e`;
verified at intake via `git cat-file -t v0.0.1` /
`git rev-parse v0.0.1^{commit}`). It produces this single
summary handoff, the companion ADR-024K, and this README index
entry. It produces no new fixture, no new script, no new test,
no `package.json` / `package-lock.json` / `tsconfig.json` /
`tsconfig.build.json` / `vitest.config.ts` / `.npmrc` /
`.gitignore` / `.github/workflows/` change, no edit to any
existing wedge or host source / test file, no edit to any
committed declaration under `dist-types/`, no append to any
prior handoff packet, no new sibling-repo handoff packet, no
GitHub-side action, no new tag, no tag push, and no GitHub
Release. All Phase 9 / 10 / 12 / 14 / 15 / 19A / 20 / 21B /
22A / 23A / 24A / 24B / 24C / 24D / 24E / 24F / 24G / 24H /
24I / 24J / 24K-opening in-repo rows above are unchanged by
Phase 24L.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the Phase 24K-opening post-merge baseline;
`npm run build` clean (the rebuilt `dist-types/` is byte-
identical to the committed artifact); both declaration
entrypoints exist; `npm pack --dry-run` shape is unchanged from
Phase 24H (only `dist-types/**`, `README.md`, `package.json`
ship); forbidden-path diff is **empty**; `git diff --stat`
shows only the three Phase 24L docs (this README append, the
new handoff, and the new ADR-024K); `git status --short` shows
only the three Phase 24L docs plus any pre-existing local dirt;
`git tag --list v0.0.1` prints `v0.0.1`; `git rev-parse
v0.0.1^{commit}` prints
`de65d93568e70c53ba952279f41a23d2f7d5123e`; `git cat-file -t
v0.0.1` prints `tag`.

## Phase 25A — Recall Wedge MVP implementation-sequencing decision-lock (docs-only)

Phase 25A is a **docs-only implementation-sequencing
decision-lock** staged on the
`phase-25a-recall-wedge-mvp-implementation-readiness` branch
inside `loa-straylight` after Phase 24L (PR #38) merged and
closed the Straylight-side intake for Dixie type-only
consumption. The companion decision-lock is
[`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md).

Phase 25A pins the order in which existing
[`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
gates #1–#20 should be considered when each gate's trigger
independently fires, and pins the per-gate preconditions a
future authorizing ADR must satisfy. **Phase 25A is sequencing,
not authorization.** Each successor ADR remains independently
required, independently triggered, and independently refusable.

Phase 25A records the post-Phase-24L state: `main` HEAD =
post-PR-#38; the annotated `v0.0.1` tag remains pinned to
`de65d93568e70c53ba952279f41a23d2f7d5123e` and reachable at
`origin`; package `@loa/straylight` at `0.0.1` with
`private: true`; type-only `./` and `./host` exports; no runtime
conditions; Hounfour at `^8.6.0`; all three ADR-024H gates
satisfied; Dixie PR #99 stands as the first conforming
type-only downstream consumer; Phase 19A pending feedback on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending; ADR-022E gate inventory unchanged.

Phase 25A does **not** create or relax any ADR-022E gate, does
**not** add code / tests / fixtures / schemas / exports /
dependencies / package metadata / `dist-types/`, does **not**
edit any sibling repo, does **not** create or push a tag, does
**not** publish, does **not** create a GitHub Release, does
**not** advance any ADR-022E gate, does **not** advance the
Phase 19A pending feedback gate, does **not** authorize any
runtime widening, endpoint / route / middleware / proxy /
rendering / public surface, vector 9 / 10 / 11 widening,
Hounfour `#116` adoption, `0xhoneyjar:straylight:*` adoption,
`recall-wedge` adoption, public commitment-root behavior,
Hounfour change, or Straylight dependency-posture change, and
does **not** request any Flatline / Bridgebuilder / red-team
review. Phase 25A does **not** edit any file under
[`../../src/`](../../src/) /
[`../../tests/`](../../tests/) /
[`../../scripts/`](../../scripts/) /
[`../../fixtures/`](../../fixtures/) /
[`../../dist-types/`](../../dist-types/), does **not** edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc) /
[`../../.gitignore`](../../.gitignore), does **not** edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) /
[`../mvp/threat-model.md`](../mvp/threat-model.md) /
[`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md) /
[`../mvp/phase-4-demo.md`](../mvp/phase-4-demo.md), does
**not** edit any prior ADR, does **not** edit any prior
handoff (other than this README index entry), and does **not**
touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`. No Flatline pass is required because
Phase 25A makes no package-surface, source, test, fixture,
schema, or dependency change.

| Document / artifact | Purpose |
|---|---|
| [`phase-25a-recall-wedge-mvp-implementation-readiness.md`](./phase-25a-recall-wedge-mvp-implementation-readiness.md) | Phase 25A summary handoff: status banner; Phase 24H–24L recap; current-state table (post-PR-#38; `v0.0.1` annotated; all three ADR-024H gates satisfied; Hounfour `^8.6.0`; ADR-022E gate inventory unchanged); ADR-022E gate-sequencing table (one row per gate #1–#20: topic / current status / trigger required / likely successor ADR family); future-authorizing-ADR required-content checklist (trigger evidence, source artifact citation, exact scope, exact files allowed, threat-model impact, validation plan, rollback / refusal rules, Flatline requirement); allowed-vs-forbidden citation rules ("how future work may cite Phase 25A"); 13 refusal rules reviewers may cite verbatim; explicit non-scope (14 items); validation expectations (docs-only); open follow-ups; cross-references. |
| [`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md) | Phase 25A decision-lock: Status (Accepted-for-Phase-25A; sequencing not authorization); Context (post-Phase-24L baseline; what Phase 25A is for); **Decision** (§1 substrate restated unchanged; §2 ADR-022E gate sequencing table; §3 future-authorizing-ADR required-content checklist; §4 allowed-vs-forbidden citation rules; §5 refusal rules); Explicit non-scope (20 items); Consequences; Source files inspected. |

The Phase 25A packet consumes the Phase 24L summary handoff,
ADR-024K, the ADR-024A through ADR-024J / ADR-022A through
ADR-022E series, the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md),
read-only), the threat model
([`../mvp/threat-model.md`](../mvp/threat-model.md), read-only),
the wedge entry doc
([`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md),
read-only), the schema-contract draft and conformance-vector
matrix under [`../specs/`](../specs/) (read-only), the current
[`../../package.json`](../../package.json) /
[`../../src/straylight/index.ts`](../../src/straylight/index.ts) /
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) /
[`../../dist-types/`](../../dist-types/) state (read-only), and
the existing annotated `v0.0.1` tag (read-only). It produces
this single summary handoff, the companion ADR-025A, and this
README index entry. It produces no new fixture, no new script,
no new test, no `package.json` / `package-lock.json` /
`tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts` /
`.npmrc` / `.gitignore` / `.github/workflows/` change, no edit
to any existing wedge or host source / test file, no edit to
any committed declaration under `dist-types/`, no append to any
prior handoff packet, no new sibling-repo handoff packet, no
GitHub-side action, no new tag, no tag push, and no GitHub
Release. All Phase 9 / 10 / 12 / 14 / 15 / 19A / 20 / 21B /
22A / 23A / 24A through 24L in-repo rows above are unchanged by
Phase 25A.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the post-Phase-24L baseline; `npm run build`
clean (rebuilt `dist-types/` byte-identical to the committed
artifact); both declaration entrypoints exist; `npm pack
--dry-run` shape unchanged from Phase 24H/I/J/K/L; forbidden-
path diff is **empty**; `git diff --stat` shows only the three
Phase 25A docs (this README append, the new handoff, and
ADR-025A); `git status --short` shows only the three Phase 25A
docs plus any pre-existing local dirt; `git tag --list v0.0.1`
prints `v0.0.1`; `git rev-parse v0.0.1^{commit}` prints
`de65d93568e70c53ba952279f41a23d2f7d5123e`; `git cat-file -t
v0.0.1` prints `tag`.

## Phase 25B — Hounfour #70 status intake and adoption-trigger check (docs-only)

Phase 25B is a **docs-only Hounfour #70 status intake and
adoption-trigger check** staged on the
`phase-25b-hounfour-70-status-intake` branch inside
`loa-straylight` after Phase 25A (PR #39) merged. The companion
decision-lock is
[`../decisions/ADR-025B-hounfour-70-status-intake.md`](../decisions/ADR-025B-hounfour-70-status-intake.md).

Phase 25B records the post-Phase-25A in-repo state of the
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
coordination thread, summarizes which substrate facts Hounfour
v8.5.x and v8.6.0 appear to have shipped from the Straylight
repo's record, and applies the per-gate trigger check from
[`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
gates #1–#20 against that state. **Phase 25B is status intake,
not authorization.**

All "filed" / "not filed" / "pending" statements in Phase 25B
describe the **Straylight repo's in-repo record only**. Phase 25B
performed no live-GitHub inspection of issue #70; statements
sourced from the Straylight repo are phrased as **"no in-repo
evidence found"** rather than as live-GitHub claims.

Phase 25B records the post-Phase-25A baseline: Phase 24L (PR #38)
and Phase 25A (PR #39) are complete; `main` HEAD = post-PR-#39;
the annotated `v0.0.1` tag remains the **sole** release-
consumption tag, pointing at
`de65d93568e70c53ba952279f41a23d2f7d5123e`; the accidental
`v0.0.2` and `v0.0.3` tags were **deleted locally and remotely
before Phase 25B** and are not part of any release-consumption
posture; package `@loa/straylight` at `0.0.1` with
`private: true`; type-only `./` and `./host` exports; no runtime
conditions; Hounfour at `^8.6.0`; all three ADR-024H gates
satisfied; Phase 19A pending feedback on issue #70 remains
pending from in-repo record; Phase 22A v8.6.x status-comment
draft has no in-repo evidence of filing; ADR-022E gate inventory
unchanged.

Phase 25B's gate-trigger check concludes: **no ADR-022E gate has
crossed its full trigger conjunction**; gate #4 (`Challenge`
adoption) has **partial substrate availability only** —
`challenge.schema.json` is shipped at v8.6.0, but the
authorization leg (separate ADR + alias / re-export path +
boundary preservation test) has not fired; **no Hounfour
adoption is justified by Phase 25B**; **no authorizing ADR is
justified by Phase 25B**.

Phase 25B does **not** create or relax any ADR-022E gate, does
**not** authorize any Hounfour adoption (`Challenge`,
`EstateTransition`, `safeCanonicalize`, `#116`,
`0xhoneyjar:straylight:*`, `recall-wedge`), does **not** add
code / tests / fixtures / schemas / exports / dependencies /
package metadata / `dist-types/`, does **not** edit any sibling
repo, does **not** create or push a tag, does **not** publish,
does **not** create a GitHub Release, does **not** advance the
Phase 19A pending-feedback gate, does **not** file the Phase 19A
or Phase 22A drafted comments, does **not** authorize any
runtime widening, endpoint / route / middleware / proxy /
rendering / public surface, public commitment-root behavior,
Hounfour change, or Straylight dependency-posture change, and
does **not** request any Flatline / Bridgebuilder / red-team
review. Phase 25B does **not** edit any file under
[`../../src/`](../../src/) /
[`../../tests/`](../../tests/) /
[`../../scripts/`](../../scripts/) /
[`../../fixtures/`](../../fixtures/) /
[`../../dist-types/`](../../dist-types/), does **not** edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc) /
[`../../.gitignore`](../../.gitignore), does **not** edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) /
[`../mvp/threat-model.md`](../mvp/threat-model.md) /
[`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md) /
[`../mvp/phase-4-demo.md`](../mvp/phase-4-demo.md), does
**not** edit any prior ADR, does **not** edit any prior handoff
(other than this README index entry), and does **not** touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`. No Flatline pass is required because Phase 25B
makes no package-surface, source, test, fixture, schema, or
dependency change.

| Document / artifact | Purpose |
|---|---|
| [`phase-25b-hounfour-70-status-intake.md`](./phase-25b-hounfour-70-status-intake.md) | Phase 25B summary handoff: status banner; in-repo wording disclaimer; post-Phase-25A baseline (Phase 24L + Phase 25A complete; `v0.0.1` sole release-consumption tag at `de65d935…`; accidental `v0.0.2` / `v0.0.3` deleted locally and remotely before Phase 25B; ADR-022E gate inventory unchanged); Hounfour #70 / Phase 19A / Phase 22A status as represented in Straylight; what Hounfour v8.5.x / v8.6.0 appear to satisfy; what remains unsatisfied or unclear (`EstateTransition`, `safeCanonicalize` subpath, `AuditEvent`, Phase 19A feedback pending, Phase 22A filing unknown); ADR-022E gate trigger table (one row per gate #1–#20: topic / current trigger state / substrate status / authorization status / conclusion); explicit conclusion (no gate crossed; gate #4 partial substrate only; no authorization); allowed-vs-forbidden citation rules; 16 refusal rules; explicit non-scope (16 items); validation expectations (docs-only); open follow-ups; cross-references. |
| [`../decisions/ADR-025B-hounfour-70-status-intake.md`](../decisions/ADR-025B-hounfour-70-status-intake.md) | Phase 25B decision-lock: Status (Accepted-for-Phase-25B; status intake not authorization); Context (post-Phase-25A baseline; what Phase 25B is for; in-repo wording disclaimer); **Decision** (§1 substrate restated unchanged; §2 Hounfour #70 / Phase 19A / Phase 22A status; §3 what v8.5.x / v8.6.0 appear to satisfy; §4 what remains unsatisfied or unclear; §5 ADR-022E gate trigger check; §6 explicit conclusion; §7 allowed-vs-forbidden citation rules; §8 refusal rules); Explicit non-scope (22 items); Consequences; Source files inspected. |

The Phase 25B packet consumes the Phase 25A summary handoff,
ADR-025A, ADR-024A through ADR-024K / ADR-022A through
ADR-022E, the Phase 16 / 17B / 18 / 19A / 21B / 22A Hounfour
intake artifacts (read-only), the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md),
read-only), the threat model
([`../mvp/threat-model.md`](../mvp/threat-model.md), read-only),
the current
[`../../package.json`](../../package.json) state (read-only),
and the existing annotated `v0.0.1` tag (read-only). It produces
this single summary handoff, the companion ADR-025B, and this
README index entry. It produces no new fixture, no new script,
no new test, no `package.json` / `package-lock.json` /
`tsconfig.json` / `tsconfig.build.json` / `vitest.config.ts` /
`.npmrc` / `.gitignore` / `.github/workflows/` change, no edit
to any existing wedge or host source / test file, no edit to
any committed declaration under `dist-types/`, no append to any
prior handoff packet, no new sibling-repo handoff packet, no
GitHub-side action, no new tag, no tag push, and no GitHub
Release. All Phase 9 / 10 / 12 / 14 / 15 / 19A / 20 / 21B /
22A / 23A / 24A through 24L / 25A in-repo rows above are
unchanged by Phase 25B.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md docs/mvp/threat-model.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
git tag --list 'v0.0.2' 'v0.0.3'
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the post-Phase-25A baseline; `npm run build`
clean (rebuilt `dist-types/` byte-identical to the committed
artifact); both declaration entrypoints exist; `npm pack
--dry-run` shape unchanged from Phase 24H/I/J/K/L/25A;
forbidden-path diff is **empty**; `git diff --stat` shows only
the three Phase 25B docs (this README append, the new handoff,
and ADR-025B); `git status --short` shows only the three
Phase 25B docs plus any pre-existing local dirt; `git tag --list
v0.0.1` prints `v0.0.1`; `git rev-parse v0.0.1^{commit}` prints
`de65d93568e70c53ba952279f41a23d2f7d5123e`; `git cat-file -t
v0.0.1` prints `tag`; `git tag --list 'v0.0.2' 'v0.0.3'` prints
nothing (accidental tags deleted locally and remotely before
Phase 25B).

## Phase 26A-0 — Operator-authority and Flatline rule (docs-only)

Phase 26A-0 is a **docs-only operator-authority and Flatline-rule
decision-lock** staged on the
`phase-26a0-operator-authority-flatline-rule` branch inside
`loa-straylight` after Phase 25B (PR #40) merged. The companion
decision-lock is
[`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md).

Phase 26A-0 resolves **Flatline SKP-001 only**. SKP-001 was
surfaced by a real 3-model Flatline pass on Phase 26A Option C2
(verdict: **REVISE**), which refused to let ADR-026A or its
dependent threat-model PR / runtime export work / Dixie endpoint
work proceed while citing **chat memory** as their
operator-authority trigger evidence. Phase 26A-0 establishes a
stable, in-repo, citable source for the updated operator-
authority rule so future ADRs can cite the in-repo record instead
of chat memory.

Phase 26A-0 records the **old Phase 15 rule**: sibling-repo
implementation PRs required teammate review before merge.

Phase 26A-0 records the **updated rule**: for the duration of the
Loa Straylight MVP, the operator may directly edit any of `loa`,
`loa-hounfour`, `loa-finn`, `loa-dixie`, `loa-freeside`, and
`loa-straylight`, provided **all five** discipline clauses hold —
(1) existing functions do not change unexpectedly; (2) changes
are additive / bounded unless explicitly authorized;
(3) Flatline / Bridgebuilder runs before pushes or PRs that
change source / package / runtime / test / dependency / public
surface in any Loa stack repo; (4) repo responsibility boundaries
remain intact; (5) ADR-022E gates and Phase 25A / Phase 25B
refusal rules remain binding.

Phase 26A-0 narrows the **review mechanism** only. It does **not**
change technical implementation order by itself — Phase 25A's
implementation-sequencing decision-lock and the ADR-022E gate
inventory remain in their current pass/hold state. It does **not**
authorize ADR-026A, runtime widening, a Dixie endpoint, Hounfour
adoption, Finn wiring, Freeside wiring, Loa framework edits,
public commitment-root behavior, storage / persistence change,
new tags, new releases, package-surface changes, or sibling-repo
edits by this phase alone. It does **not** create or relax any
ADR-022E gate, does **not** weaken any Hounfour / Finn / Dixie /
Freeside responsibility boundary, and does **not** weaken any
Phase 25A or Phase 25B refusal rule.

Phase 26A-0 pins a **future-ADR contract**: any future ADR that
cites Phase 26A-0 / ADR-026A0 as its operator-authority trigger
evidence must still provide (1) exact trigger evidence beyond
operator authority, (2) scope, (3) threat-model impact, (4) tests,
(5) rollback, and (6) a Flatline result on the ADR's PR. An ADR
that omits any of these may be refused even if it correctly cites
ADR-026A0 for the operator-authority leg.

Phase 26A-0 pins **allowed citations** (cite ADR-026A0 / Phase
26A-0 as stable operator-authority trigger evidence for a
specific later ADR; cite alongside ADR-025A / ADR-025B for
sequencing; cite as the canonical record of the Phase 15 →
updated-rule narrowing of the review mechanism) and **forbidden
citations** (cite as universal permission to change any repo or
bypass any gate; cite as bypass for any ADR-022E gate or any
Phase 25A / 25B refusal rule; cite as a substitute for the
pre-push / pre-PR Flatline / Bridgebuilder pass; cite as a
substitute for the future-ADR contract; cite as pre-approval of
any successor ADR including ADR-026A specifically).

A pre-merge Flatline / Bridgebuilder pass is performed against
the Phase 26A-0 handoff and ADR-026A0 before merge, because Phase
26A-0 is the docs-only-creates-authorization class described in
the Flatline-requirement section. Phase 26A-0 does **not** edit
any file under [`../../src/`](../../src/) /
[`../../tests/`](../../tests/) /
[`../../scripts/`](../../scripts/) /
[`../../fixtures/`](../../fixtures/) /
[`../../dist-types/`](../../dist-types/), does **not** edit
[`../../package.json`](../../package.json) /
[`../../package-lock.json`](../../package-lock.json) /
[`../../tsconfig.json`](../../tsconfig.json) /
[`../../tsconfig.build.json`](../../tsconfig.build.json) /
[`../../vitest.config.ts`](../../vitest.config.ts) /
[`../../.npmrc`](../../.npmrc) /
[`../../.gitignore`](../../.gitignore) /
[`../../.loa.config.yaml`](../../.loa.config.yaml), does **not**
edit [`../mvp/package-boundary.md`](../mvp/package-boundary.md) /
[`../mvp/threat-model.md`](../mvp/threat-model.md) /
[`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md) /
[`../mvp/phase-4-demo.md`](../mvp/phase-4-demo.md), does
**not** edit any prior ADR, does **not** edit any prior handoff
**other than the two append-only updates explicitly listed
below** (this README index entry, plus the narrow cross-reference
in [`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)),
and does **not** touch
[`../../.loa`](../../.loa) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`. Phase 26A-0 does **not** create or push a tag,
does **not** publish, does **not** create a GitHub Release, does
**not** file any GitHub issue / comment / PR, does **not** bump
or change Hounfour, and does **not** edit any sibling repo.

| Document / artifact | Purpose |
|---|---|
| [`phase-26a0-operator-authority-flatline-rule.md`](./phase-26a0-operator-authority-flatline-rule.md) | Phase 26A-0 summary handoff: status banner; SKP-001 unblock context; old Phase 15 rule recorded verbatim from the in-repo record; updated rule with the five discipline clauses; review-mechanism narrowing only (no technical-order change); refusal-rule block (no ADR-026A authorization, no runtime widening, no Dixie endpoint, no Hounfour adoption, no Finn wiring, no Freeside wiring, no Loa framework edits, no public commitment roots, no storage changes, no tags, no releases, no package-surface changes, no sibling-repo edits by this phase alone, no ADR-022E gate relaxation, no Phase 25A / 25B refusal-rule relaxation, no responsibility-boundary relaxation); Flatline requirement (six surface classes for the six Loa stack repos; docs-only creates-authorization rule); future-ADR contract (six conjunctive items); allowed-vs-forbidden citation rules; explicit non-scope (18 items); validation expectations (docs-only); cross-references. |
| [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md) | Phase 26A-0 decision-lock: Status (Accepted-for-Phase-26A-0; codification not authorization); Context (SKP-001 unblock; old Phase 15 rule; why a docs-only authority record is the right shape); **Decision** (§1 file set; §2 updated operator-authority rule; §3 Flatline requirement; §4 mechanism narrowing only; §5 future-ADR contract; §6 allowed-vs-forbidden citation rules; §7 refusal rules; §8 scope limit); Explicit non-scope (18 items); Consequences; Source files inspected. |

The Phase 26A-0 packet consumes the Phase 25B summary handoff,
ADR-025B, ADR-025A, ADR-024A through ADR-024K / ADR-022A through
ADR-022E (read-only),
[`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
(read-only at decision time; appended below for the cross-
reference),
[`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
(read-only),
[`./cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
(read-only), the Phase 5 stable-surface freeze
([`../mvp/package-boundary.md`](../mvp/package-boundary.md),
read-only), and the threat model
([`../mvp/threat-model.md`](../mvp/threat-model.md), read-only).
It produces this single summary handoff, the companion
ADR-026A0, this README index entry, and the narrow
cross-reference append in
[`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).
It produces no new fixture, no new script, no new test, no
`package.json` / `package-lock.json` / `tsconfig.json` /
`tsconfig.build.json` / `vitest.config.ts` / `.npmrc` /
`.gitignore` / `.github/workflows/` change, no edit to any
existing wedge or host source / test file, no edit to any
committed declaration under `dist-types/`, no append to any
prior handoff packet other than the two updates listed in the
status banner, no new sibling-repo handoff packet, no GitHub-side
action, no new tag, no tag push, and no GitHub Release. All
Phase 9 / 10 / 12 / 14 / 15 / 19A / 20 / 21B / 22A / 23A / 24A
through 24L / 25A / 25B in-repo rows above are unchanged by
Phase 26A-0.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md docs/mvp/threat-model.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
git tag --list 'v0.0.2' 'v0.0.3'
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the post-Phase-25B baseline; `npm run build`
clean (rebuilt `dist-types/` byte-identical to the committed
artifact); both declaration entrypoints exist; `npm pack
--dry-run` shape unchanged from Phase 24H/I/J/K/L / 25A / 25B;
forbidden-path diff is **empty**; `git diff --stat` shows only
the four Phase 26A-0 docs (this README append, the new handoff,
ADR-026A0, and the
[`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
cross-reference append); `git status --short` shows only the
four Phase 26A-0 docs plus any pre-existing local dirt; `git tag
--list v0.0.1` prints `v0.0.1`; `git rev-parse v0.0.1^{commit}`
prints the Phase 24K release-consumption tag target; `git
cat-file -t v0.0.1` prints `tag`; `git tag --list 'v0.0.2'
'v0.0.3'` prints nothing.

## Phase 26A-1 — Threat-model amendment for the future Dixie recall-intake endpoint (docs-only)

Phase 26A-1 is a **docs-only, threat-model-only** amendment that
records the threat-model prerequisites surfaced by Flatline
SKP-002 (resource exhaustion / DoS / unbounded `InMemoryStorage`),
SKP-003 (replay semantics), and SKP-004 (concurrency posture)
for the *future* Dixie recall-intake endpoint. Phase 26A-1 has
**no companion ADR** because this phase authorizes nothing;
Phase 26A-0 / ADR-026A0 remains the operator-authority leg, and
ADR-026A (when later authored) is the implementation-authorizing
ADR. Phase 26A-1 sits between them as the threat-model leg.

Phase 26A-1 follows Phase 26A-0 (PR #41), which resolved
SKP-001. Phase 26A-1 does **not** close SKP-005 (future
ADR-026A / runtime-subpath / experimental pre-Finn API surface
design); SKP-005 remains open for the later authorizing ADR.

The threat-model amendment adds rows **T13** (network adversary
at the future Dixie recall-intake endpoint), **T14** (cross-tenant
authorization at network ingress), **T15** (replay against the
Dixie recall-intake endpoint), **T16** (HTTP-driven concurrency
against `InMemoryStorage`), **T17** (resource exhaustion / DoS at
the Dixie endpoint), and **T18** (cross-instance state divergence
under `InMemoryStorage`), and amends **T9** with the persistence
posture: `InMemoryStorage` is process-memory-only and not a
production persistence adapter; `JsonlStorage` must not be used
at a live HTTP endpoint unless ADR-022E gate #8 fires or a
separate adapter / concurrency ADR authorizes it. Each new or
amended row carries a **Future tests** pointer; no test is added
by this phase.

Phase 26A-1 does **not** authorize ADR-026A, runtime widening, a
Dixie endpoint, package-surface changes, Hounfour adoption, Finn
wiring, Freeside wiring, Loa framework edits, storage /
production persistence change, tags, releases, or sibling-repo
edits. It does **not** create or relax any ADR-022E gate, does
**not** weaken any Hounfour / Finn / Dixie / Freeside
responsibility boundary, and does **not** weaken any Phase 25A,
Phase 25B, or Phase 26A-0 refusal rule.

| Document / artifact | Purpose |
|---|---|
| [`phase-26a1-threat-model-dixie-endpoint.md`](./phase-26a1-threat-model-dixie-endpoint.md) | Phase 26A-1 summary handoff: status banner; SKP-002 / SKP-003 / SKP-004 unblock context with explicit non-closure of SKP-005; T13–T18 + T9-amendment summary; sixteen-item refusal-rule block (no ADR-026A authorization, no runtime widening, no Dixie endpoint, no package-surface change, no Hounfour / Finn / Freeside wiring, no Loa framework edits, no storage / persistence change, no tags, no releases, no sibling-repo edits, no SKP-005 closure, no ADR-022E / Phase 25A / 25B / 26A-0 relaxation, no successor-ADR pre-approval); future-ADR contract reminder anchored to Phase 26A-0; validation expectations (docs-only); cross-references. |
| [`../mvp/threat-model.md`](../mvp/threat-model.md) | Threat-model document, amended in-place: status banner now flags Phase 26A-1; the out-of-scope "Network adversary" bullet now points at T13–T18; T9 has a "Persistence posture (Phase 26A-1 amendment)" addition; T13–T18 added under a "Phase 26A-1 amendment — future Dixie recall-intake endpoint" section before the "Defense-in-depth properties" closing; the closing "Limitations" section cross-references the amendment. |

No ADR was created for Phase 26A-1 because this phase
authorizes nothing. ADR-026A0 (Phase 26A-0) remains the
operator-authority record; ADR-026A (when later authored) is
the implementation-authorizing ADR that must cite both
Phase 26A-0 (authority leg) and Phase 26A-1 (threat-model leg).

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
git tag --list 'v0.0.2' 'v0.0.3'
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the post-Phase-26A-0 baseline; `npm run build`
clean (rebuilt `dist-types/` byte-identical to the committed
artifact); both declaration entrypoints exist; `npm pack
--dry-run` shape unchanged from Phase 24H/I/J/K/L / 25A / 25B /
26A-0; forbidden-path `git diff` is **empty** (note that
`docs/mvp/threat-model.md` is **not** on the forbidden-path
list for this phase: it is the primary target); `git diff
--stat` shows only the three Phase 26A-1 docs (this README
append, the new handoff, and `docs/mvp/threat-model.md`); `git
status --short` shows only the three Phase 26A-1 docs plus any
pre-existing local dirt; `git tag --list v0.0.1` prints
`v0.0.1`; `git rev-parse v0.0.1^{commit}` prints the
Phase 24K release-consumption tag target; `git cat-file -t
v0.0.1` prints `tag`; `git tag --list 'v0.0.2' 'v0.0.3'` prints
nothing.

## Phase 26A-2 — Runtime recall-intake subpath authorization (docs-only)

Phase 26A-2 is a **docs-only authorization-record handoff**
that *targets* / *addresses* Flatline **SKP-005** by drafting
ADR-026A — the proposed experimental, pre-Finn, Dixie-only
runtime-subpath surface design. SKP-005 closure is asserted
**only** after all three of the following hold: (i) ADR-026A is
drafted (this packet), (ii) a real 3-model Flatline pass on the
ADR-026A PR returns **PASS** or **REVISE-with-resolution**, and
(iii) the ADR-026A PR merges. Until all three hold, Phase 26A-2
*targets* / *addresses* / *records the proposed closure design*
for SKP-005; it does **not** claim closure.

Phase 26A-2 follows Phase 26A-0 (PR #41, operator-authority
record) and Phase 26A-1 (PR #42, threat-model prerequisites for
the future Dixie recall-intake endpoint). Phase 26A-2 does
**not** close SKP-002, SKP-003, or SKP-004; those remain Phase
26A-1 prerequisites for the future Dixie PR.

ADR-026A authorizes — but does not implement — exactly **one**
future runtime subpath at `@loa/straylight/runtime/recall-intake`,
exposing exactly the handler set Dixie needs at MVP, gated to
Dixie-only consumption, marked experimental, with a recorded
migration / retirement path back to Finn when ADR-022E gate #9
fires. Root `.` and `./host` remain `"types"`-only. The runtime
barrel value-export allowlist is `handleRecallIntake` (required)
and optionally `createInMemoryRecallIntakeDeps` (only if the
later implementation PR justifies it). The export condition
defaults to `"import"` (ESM-only). The implementation PR MUST
define and test a concrete non-Dixie refusal mechanism; if it
cannot provide a credible mechanism, the implementation PR is
**blocked** and ADR-026A may NOT be cited as sufficient
authorization.

ADR-026A authorizes the **scope** of the later Straylight
runtime-implementation PR, but does **not** make that PR
automatically mergeable. The implementation PR remains
independently reviewable and refusable unless it satisfies
ADR-026A's tests, export allowlist, experimental marking,
non-Dixie refusal mechanism, package-boundary update, rollback
plan, and Flatline result.

Phase 26A-2 does **not** authorize: a Dixie endpoint;
package-surface change in this phase; Hounfour adoption; Finn
wiring; Freeside wiring; Loa framework edits; storage /
persistence change; tags; releases; package publishing; or
sibling-repo edits. ADR-022E gates and Phase 25A / 25B / 26A-0 /
26A-1 refusal rules **remain binding**. The Dixie endpoint
remains independently gated by Phase 26A-1 T13–T18 + ADR-022E
gate #10 + sibling-repo discipline. Finn remains the eventual
runtime-enforcement owner per ADR-022E gate #9; the Straylight
runtime subpath is a pre-Finn MVP exception, not a permanent
lane transfer.

| Document / artifact | Purpose |
|---|---|
| [`phase-26a2-runtime-recall-intake-subpath-authorization.md`](./phase-26a2-runtime-recall-intake-subpath-authorization.md) | Phase 26A-2 summary handoff: status banner; SKP-005 unblock context with explicit non-closure of SKP-002 / SKP-003 / SKP-004 and the three-part SKP-005 closure condition (drafted + Flatline PASS-or-resolved + merged); summary of the proposed authorizing decision (Option C2); Phase 15 narrowing (MVP-slice, recall-intake-only); twenty-three-item refusal-rule block (no implementation, no `package.json` change, no `package-boundary.md` edit, no `threat-model.md` edit, no additional runtime subpath, no Dixie endpoint, no Hounfour / Finn / Freeside wiring, no Loa framework edits, no storage change, no tags, no releases, no package publish, no sibling-repo edits, no SKP-005 closure by drafting alone, no SKP-002 / SKP-003 / SKP-004 closure, no general Phase 15 reorder, no Dixie elevation, no permanent lane transfer, no ADR-022E / Phase 25A / 25B / 26A-0 / 26A-1 relaxation, no successor-ADR pre-approval); future-ADR contract reminder anchored to all three legs (Phase 26A-0 + Phase 26A-1 + Phase 26A-2); validation expectations (docs-only, four Phase 26A-2 docs in the diff); pre-merge Flatline pass requirement; cross-references. |
| [`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md) | Phase 26A-2 decision-lock: Status (Accepted-for-Phase-26A-2; authorization not implementation; SKP-005 three-part closure condition); Context (why ADR-026A exists; three-leg trigger evidence with the operator-authority + threat-model + independent-trigger anchors; Phase 15 narrowing for the MVP slice; why a docs-only authorization-record is the right shape); **Decision** (§1 file set; §2 authorization of exactly one runtime subpath; §3 runtime-barrel value-export allowlist; §4 export-condition shape; §5 type-only subpaths preserved; §6 experimental marking in four places; §7 concrete non-Dixie refusal mechanism + block-on-failure rule; §8 Finn migration / retirement path; §9 refusal rules; §10 required test invariants in the implementation PR; §11 threat-model legs the implementation PR must address; §12 tags / releases; §13 Dixie endpoint NOT authorized); Explicit non-scope (twenty-three items); Consequences; Source files inspected. |
| [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md) | Append-only Phase 26A-2 cross-reference recording the MVP-slice narrowing of the recommended Hounfour → Finn → Dixie → Freeside ordering. The narrowing is bounded to the single `handleRecallIntake` handler. No general reorder. |

The Phase 26A-2 packet consumes the Phase 26A-0 and Phase 26A-1
summary handoffs, ADR-026A0, the Phase 26A-1 threat-model
amendment (T13–T18 + T9 amendment), and the existing ADR-022A /
ADR-022E / ADR-024G / ADR-024H / ADR-024I / ADR-024J / ADR-025A /
ADR-025B record without editing any of them.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md docs/mvp/threat-model.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
git tag --list 'v0.0.2' 'v0.0.3' 'v0.1.0'
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the post-Phase-26A-1 baseline; `npm run build`
clean (rebuilt `dist-types/` byte-identical to the committed
artifact); both declaration entrypoints exist; `npm pack
--dry-run` shape unchanged from Phase 24H/I/J/K/L / 25A / 25B /
26A-0 / 26A-1; forbidden-path `git diff` is **empty** (note that
**both** `docs/mvp/package-boundary.md` and
`docs/mvp/threat-model.md` are on the forbidden-path list for
this phase: neither is edited by Phase 26A-2 — the boundary
edit is deferred to the later implementation PR per ADR-026A
§"Decision" §6.d, and the threat-model amendment is Phase
26A-1's record); `git diff --stat` shows only the **four** Phase
26A-2 docs (this README append, the new handoff, ADR-026A, and
the `cross-repo-implementation-order.md` Phase 26A-2 append);
`git status --short` shows the four Phase 26A-2 docs plus any
pre-existing local dirt; `git tag --list v0.0.1` prints
`v0.0.1`; `git rev-parse v0.0.1^{commit}` prints
`de65d93568e70c53ba952279f41a23d2f7d5123e`, the **Phase 24K
release-consumption tag target**; `git cat-file -t v0.0.1`
prints `tag`; `git tag --list 'v0.0.2' 'v0.0.3' 'v0.1.0'`
prints nothing.

A pre-merge real 3-model Flatline pass is performed against this
packet before merge, per Phase 26A-0 §"Decision" §3 (the
pre-merge Flatline requirement applies to docs-only changes that
*create authorization*, which Phase 26A-2 does). SKP-005
closure is asserted only after that Flatline pass returns PASS
or REVISE-with-resolution AND the ADR-026A PR merges.

## Phase 26C — Dixie recall-intake consumer contract (in-repo only)

Phase 26C is a **Straylight-side, in-repo consumer-contract
record** for the runtime recall-intake subpath that ADR-026A
authorized and Phase 26B (PR #45) implemented (with Phase 26B-F
runtime-packaging hardening on PR #46). Phase 26C does **not**
authorize a Dixie endpoint, a Dixie adapter, a sibling-repo
edit, a deployment, a Straylight package-surface change, a
Straylight runtime-source change, a fixture / script / build
change, a `dist/` or `dist-types/` commit, a Hounfour adoption
flip, a Finn wiring step, a Freeside surface, a Loa framework
edit, a tag, a release, or a package publish. The future Dixie
endpoint, if and when it ships, remains independently gated by
Phase 26A-1 T13–T18 + ADR-022E gate #10 + the operator-authority
discipline pinned by ADR-026A0. ADR-022E gates and Phase 25A /
25B / 26A-0 / 26A-1 refusal rules **remain binding**.

ADR-026C records the contract a future Dixie endpoint or
adapter, **if separately authorized**, would have to satisfy in
order to consume `@loa/straylight/runtime/recall-intake`
correctly: subpath-only import (no root, no `./host`, no deep
import); capability mint via the public
`createDixieCapability()` constructor; deployment-bound
`STRAYLIGHT_RUNTIME_DIXIE_KEY` planted in process env;
capability passed to `handleRecallIntake` as the fourth
argument; no metadata-trust (no `package_name`,
`caller_identity`, or `user_agent` carries weight); no
cross-process replay (each process mints its own capability
locally); and fail-closed handling of `runtime_seam:capability_*`
denials. The contract is descriptive on the consumer side and
already enforced on the Straylight side by the Phase 26B HMAC +
closure-private-brand gate and the package's `exports` map.

| Document / artifact | Purpose |
|---|---|
| [`phase-26c-dixie-recall-intake-consumer-contract.md`](./phase-26c-dixie-recall-intake-consumer-contract.md) | Phase 26C summary handoff: status banner; why Phase 26C exists; eight-item consumer-contract obligations a future Dixie endpoint / adapter would have to satisfy if separately authorized (subpath-only import, no deep import, capability mint via the public constructor, env-key binding, capability passed to `handleRecallIntake`, no metadata-trust, no cross-process replay, fail-closed handling); ten-item Phase 26C test invariants; explicit non-goal block (no Dixie endpoint, no sibling-repo edit, no package-surface change, no runtime-source change, no fixture/script change, no `dist/` or `dist-types/` commit, no `.github/` / `.loa.config.yaml` / `.claude/` / `.beads/` / `.run/` / `grimoires/` edit, no release/tag/publish, no Hounfour bump, no relaxation of any ADR-022E or Phase 25/26 refusal rule, no SKP-005 re-claim, no successor-ADR pre-approval); validation expectations; cross-references. |
| [`../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md`](../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md) | Phase 26C decision-lock: Status (Accepted-for-Phase-26C; Straylight-side consumer-contract record; not authorization for any Dixie endpoint, sibling-repo edit, deployment, storage, Finn enforcement, Hounfour adoption, or package export change); Context (why ADR-026C exists; why a Straylight-side, in-repo decision-lock is the right shape; what the Phase 26C consumer-shaped test proves); **Decision** (§1 file set, §2 contract subject, §3 consumer-contract obligations, §4 Straylight-side obligations the contract depends on, §5 Phase 26C test invariants, §6 explicit non-goals, §7 future-ADR contract reminder); Consequences; Source files inspected. |
| [`../../tests/phase-26c-dixie-consumer-contract.test.ts`](../../tests/phase-26c-dixie-consumer-contract.test.ts) | vitest suite that simulates a Dixie-shaped consumer flow against `@loa/straylight/runtime/recall-intake`. Uses the same temp-fixture-symlink pattern Phase 24H and Phase 26B already use: `node_modules/@loa/straylight` is symlinked to the repo so consumer imports flow through the real `exports` map, and small consumer `.mjs` files exercise positive + negative shapes in fresh subprocesses. Asserts subpath-only resolution (root + `./host` + named deep-import paths fail), positive served path with env key + minted capability + BFF-shaped payload, fail-closed without env key, fail-closed across env-key rotation, capability-shape spoofing rejection, cross-process replay rejection. Consumes the existing Phase 26B build outputs and the existing [`../../fixtures/index.ts`](../../fixtures/index.ts) builders; does not edit `src/`, `scripts/`, `fixtures/`, `dist/`, or `dist-types/`. |

The Phase 26C packet consumes ADR-026A, ADR-026A0, the Phase
26A-1 threat-model amendment, the Phase 26A-2 authorization
handoff, the merged Phase 26B implementation, and the existing
[`./dixie-recall-mapping.md`](./dixie-recall-mapping.md),
[`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md),
[`../mvp/package-boundary.md`](../mvp/package-boundary.md), and
[`../mvp/threat-model.md`](../mvp/threat-model.md) records
without editing any of them.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
git status --short -- dist dist-types
git diff --stat
git diff --name-only
git status --short
```

Expected: `npm run typecheck` clean; `npm test` passes (the new
`phase-26c-dixie-consumer-contract` suite passes; the existing
`phase-26b-runtime-recall-intake` suite still passes; no other
test changes verdict); `npm run build` clean (artifacts under
`dist/` and `dist-types/` byte-identical to the post-Phase-26B-F
baseline because Phase 26C touches no `src/` file); `npm pack
--dry-run` shape unchanged from the post-Phase-26B-F tarball;
`git status --short -- dist dist-types` empty; `git diff --stat`
shows only the four Phase 26C files (this README append, the
new handoff, ADR-026C, and the new test file); `git diff
--name-only` matches that four-file set; `git status --short`
shows the four Phase 26C files plus any pre-existing local dirt
outside the Phase 26C scope (which remains unstaged per the
phase brief).

## Phase 26D — Dixie recall-intake endpoint authorization (in-repo only)

Phase 26D is a **Straylight-side authorization record** for
exactly **one** future sibling-repo PR in
[`loa-dixie`](https://github.com/0xHoneyJar/loa-dixie) that
adds a recall-intake endpoint/adapter consuming
`@loa/straylight/runtime/recall-intake` per ADR-026A and
ADR-026C. Phase 26D does **not** itself implement the
endpoint, edit `loa-dixie`, open the sibling-repo PR, or
authorize broader Dixie integration. Phase 26D does **not**
authorize: any Dixie endpoint other than the single
recall-intake endpoint/adapter scoped below; any Phase 24E
S2–S6 surface (receipt retrieval, exclusion display,
provenance walk, audit-chain lookup, estate summary); any
review-queue management surface or governance timeline
surface; any BFF rebuild, operator console, or
Discord / Telegram / NATS / REST surface; a Straylight
package-surface change (no `package.json` / `exports` map /
runtime allowlist / new subpath edit); a Straylight
runtime-source change (no edit to the Phase 26B HMAC +
closure-private brand mechanism, env-key binding, or
fail-closed defaults); Finn wiring (ADR-022E gate #9 held);
Hounfour adoption (ADR-022E gates #1–#5, #17, #18 held);
Freeside wiring (ADR-022E gate #11 held); production storage
migration (ADR-022E gate #8 held) beyond the per-tenant
memory cap and bounded estate-storage posture authorized as
endpoint guardrail under ADR-026D §3.a (iii); a Loa framework
edit; a tag, a release, a package publish, or a Hounfour
dependency bump; broad autonomy / action execution; a general
Phase 15 reorder; or any successor-ADR pre-approval. ADR-022E
gates and Phase 25A / 25B / 26A-0 / 26A-1 refusal rules
**remain binding**.

ADR-026D authorizes exactly one future sibling-repo PR in
`loa-dixie` to add **one** recall-intake endpoint/adapter
that consumes `@loa/straylight/runtime/recall-intake` from
the published Straylight package surface. The endpoint MUST:
use `createDixieCapability` and `handleRecallIntake`; bind
`STRAYLIGHT_RUNTIME_DIXIE_KEY` in the deployment process
environment; honor ADR-026C §3 obligations 3.1–3.8 in full;
resolve the Phase 26A-1 endpoint prerequisites (T13–T18 + the
T9 persistence-posture amendment) under ADR-026D §"Decision"
§3 acceptance criteria — request body size limit + per-tenant
rate limit + per-tenant memory cap + explicit refusal
behavior (T17 / SKP-002); idempotent replay default OR
explicit duplicate-audit-OK with replay-cannot-alter-
authorization (T15 / SKP-003); per-estate serialization OR
enforced single-instance refusal (T16 + T18 / SKP-004);
ingress validation + authoritative-tenant resolution (T13 +
T14); fail-closed under each of ADR-026D §4.a–§4.g (missing
key, key rotation, spoofed capability, serialised
capability, metadata-only caller identity, unknown frame,
cross-tenant intake); and ship the test classes ADR-026D §5.a
through §5.f mandates in `loa-dixie`'s own test suite. The
sibling-repo PR MUST pass a real 3-model Flatline pass AND a
real Bridgebuilder review pre-merge per ADR-026A0
§"Decision" §5.

| Document / artifact | Purpose |
|---|---|
| [`phase-26d-dixie-recall-intake-endpoint-authorization.md`](./phase-26d-dixie-recall-intake-endpoint-authorization.md) | Phase 26D summary handoff: status banner; why Phase 26D exists; **Authorized next PR** table (repo, surfaces in scope, runtime symbols, env binding, consumer obligations, pre-merge gates, scope refusal pointers); **Endpoint prerequisites** table mapping T13–T18 + T9 amendment to ADR-026D §3 resolution paths and recording SKP-002 / SKP-003 / SKP-004 closure as the Dixie PR's responsibility; **Dixie implementation requirements** sections (capability + env binding, subpath discipline, tenant resolution, request controls, idempotency / replay, concurrency posture, fail-closed catalogue); required-tests table (5.a–5.f) with citation anchors; required pre-merge Flatline + Bridgebuilder; explicit non-goal block (no Dixie endpoint other than recall-intake; no broader Dixie integration; no Straylight package-surface change; no new runtime subpath; no edit to Phase 26B HMAC gate; no Finn / Hounfour / Freeside wiring; no production storage migration beyond endpoint guardrails; no tag / release / publish; no broad autonomy; no Loa framework edit; no general Phase 15 reorder; no successor-ADR pre-approval); validation expectations; cross-references. |
| [`../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md`](../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md) | Phase 26D decision-lock: Status (Accepted-for-Phase-26D; Straylight-side authorization record for exactly one future sibling-repo PR in `loa-dixie`; not implementation; not a sibling-repo edit by this phase; not authorization for any other Dixie surface or any other sibling repo); Context (why ADR-026D exists; why a Straylight-side authorization record is the right shape); **Decision** (§1 file set; §2 authorized sibling-repo PR scope — repo, endpoint shape, package consumption, required runtime symbols, required env binding, consumer obligations; §3 endpoint prerequisites with resolution paths for T17 / T15 / T16 + T18 / T13 + T14; §4 fail-closed behaviors §4.a–§4.g; §5 required tests in `loa-dixie` before merge §5.a–§5.f; §6 pre-merge Flatline + Bridgebuilder requirement; §7 refusal rules §7.a–§7.n; §8 successor-ADR contract reminder; §9 rollback); Consequences; Source files inspected. |
| [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md) | Append-only Phase 26D cross-reference recording that the **single** future Dixie recall-intake endpoint PR is now authorized under ADR-026D. **No** general reorder of the Hounfour → Finn → Dixie → Freeside sequence; no other Dixie work is opened by this narrowing. |

The Phase 26D packet consumes ADR-026A, ADR-026A0, ADR-026C,
ADR-022E, the Phase 26A-1 threat-model amendment, the Phase
26A-2 authorization handoff, the merged Phase 26B
implementation, the merged Phase 26C consumer-contract
record, and the existing
[`./dixie-recall-mapping.md`](./dixie-recall-mapping.md),
[`../mvp/package-boundary.md`](../mvp/package-boundary.md),
and [`../mvp/threat-model.md`](../mvp/threat-model.md)
records without editing any of them.

Validate locally:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
git status --short -- dist dist-types
git diff --stat
git diff --name-only
git status --short
```

Expected: `npm run typecheck` clean; `npm test` passes
identically to the post-Phase-26C baseline (Phase 26D adds no
test, edits no test, and changes no source file under
[`../../src/`](../../src/); the existing Phase 26B and Phase
26C suites continue to pin the Straylight-side seam);
`npm run build` clean (`dist/` and `dist-types/` byte-
identical to the post-Phase-26C baseline because Phase 26D
touches no `src/` file); `npm pack --dry-run` shape unchanged
from the post-Phase-26C tarball; `git status --short -- dist
dist-types` empty; `git diff --stat` shows only the four
Phase 26D files (this README append, the new handoff,
ADR-026D, and the `cross-repo-implementation-order.md`
append); `git diff --name-only` matches that four-file set;
`git status --short` shows the four Phase 26D files plus any
pre-existing local dirt outside the Phase 26D scope (which
remains unstaged per the phase brief).

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
  / Freeside wiring, and not the full Recall Wedge. **Phase 20C**
  ([`phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md))
  is a **local demo / evidence packet** that pins the existing
  demo's JSON output shape; it is not runtime-wired, not
  endpoint-wired, not a Dixie endpoint, not a Finn integration,
  not Hounfour-side schema work, and not the full Recall Wedge.
  **Phase 20D**
  ([`phase-20d-recall-wedge-endpoint-boundary.md`](./phase-20d-recall-wedge-endpoint-boundary.md))
  is an **endpoint-boundary planning packet** that nominates the
  local `RecallRequest` / `RecallPack` / `RecallReceipt` /
  `audit_review` / `audit_chain_verification` objects as the
  current evidence-backed contract *candidates* for a future
  Dixie-hosted recall-inspection endpoint or Finn-hosted
  runtime-context endpoint; it is **not endpoint-wired**, **not
  runtime-wired**, no Dixie endpoint, no Finn endpoint, no
  Freeside integration, no Hounfour schema work, and not the
  full Recall Wedge. **Phase 20E**
  ([`phase-20e-recall-wedge-closeout.md`](./phase-20e-recall-wedge-closeout.md))
  is the **closeout packet** for the Phase 20 Recall Wedge
  **pre-integration** lane — it summarizes what 20A / 20B / 20C /
  20D established locally, what remains unimplemented, and what
  must be true before Phase 21 endpoint / runtime integration
  begins; it authorizes **no** endpoint / runtime integration, is
  **not endpoint-wired** and **not runtime-wired**, adds no test /
  fixture / script / `src/` change, and is **Phase 20E only**.
  **Phase 21B**
  ([`phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md))
  is a **schema-readiness lock packet** that maps the
  v8.6.0-resolved Hounfour exported surface (eleven JS module
  subpaths plus `./schemas/*`) to the Straylight Recall Wedge MVP
  primitive set, records `challenge.schema.json` as newly safe
  upstream substrate (closing Phase 16 delta #7), records
  `EstateTransition` / `AuditEvent` (under that name) /
  `safeCanonicalize` JS subpath as still not confirmed exported
  Hounfour contracts, classifies blockers vs non-blocking
  discovery notes, and constrains Phase 22 to local
  schema/readiness work *or* a drafted-not-filed Hounfour status
  comment for issue #70 (Finn / Dixie boundary prep is **not
  authorized**); it is **not endpoint-wired** and **not
  runtime-wired**, adds no test / fixture / script / `src/` /
  package change, and is **Phase 21B only**. **Phase 22A**
  ([`phase-22a-mvp-decision-lock.md`](./phase-22a-mvp-decision-lock.md))
  is an **MVP decision-lock packet** that locks the five MVP
  decisions before any Phase 22 implementation branch opens —
  Straylight semantic home (post-v8.6 reaffirmation), MVP
  endpoint host (Dixie preferred; Finn fallback; Freeside not a
  candidate host) under seven explicit decision criteria, schema
  dependency direction (acyclic; wedge public surface as the
  cut), MVP persistence + audit / receipt owner (Loa-Straylight;
  Phase 5 hardening invariants elevated to MVP host contract),
  and a twenty-row deferred-features list — and **drafts**
  (without filing) a Hounfour status comment for issue #70
  asking for status on the residual gates (`EstateTransition`,
  `safeCanonicalize` exported subpath); it is **not
  endpoint-wired** and **not runtime-wired**, adds no test /
  fixture / script / `src/` / package change, files no
  sibling-repo comment, edits no sibling repo, does not advance
  any Phase 20A / 20B / 20C / 20D / 20E / 21A / 21B deferral, and
  is **Phase 22A only**. **Phase 23A**
  ([`phase-23a-mvp-schema-contract-draft.md`](./phase-23a-mvp-schema-contract-draft.md),
  [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md),
  [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md))
  is an **MVP schema-contract draft packet** staged after the
  Phase 22A-drafted Hounfour status comment was **filed on
  issue #70** by the user as a separate sibling-repo
  human-reviewed event. It produces two new local spec docs —
  a per-object MVP schema-contract draft (fourteen objects:
  `Actor`, `ActorEstate`, `Assertion`, `SignatureEnvelope`,
  `Keyring`, `PolicyDecision`, `EstateTransition`, `Challenge`,
  `Revocation`, `RecallRequest`, `RecallPack`, `RecallReceipt`,
  `AuditEvent`, optional `CommitmentRoot`) and an eleven-vector
  MVP conformance matrix — and pins a five-tier status taxonomy
  (shipped upstream / safe draft / blocked / deferred /
  discovery note) that separates *shape availability* from
  *adoption authorization*. **Phase 23A authors no schema, no
  fixture, and no test.** The filed Hounfour status comment is
  treated as an open status request, not as an answer to the
  Phase 19A pending feedback gate. `EstateTransition`,
  `safeCanonicalize` exported subpath, `Challenge` adoption
  into the wedge public surface, `AuditEvent` adoption from
  any v8.6.x adjacent candidate, and public anchoring all
  remain deferred per the ADR-020 / ADR-022 series. Phase 23A's
  next-phase recommendation is two-pronged: Scenario A — wait
  for the Hounfour answer if it arrives before Phase 23B
  implementation; Scenario B — if the answer does not arrive
  and a teammate review explicitly approves proceeding,
  Phase 23B continues with local semantic-contract scaffolding
  only, keeping `EstateTransition` and `safeCanonicalize`
  deferred. It is **not endpoint-wired** and **not
  runtime-wired**, adds no test / fixture / script / `src/` /
  package change, files no sibling-repo issue / comment / PR
  by Phase 23A itself, edits no sibling repo, does not advance
  any Phase 20A / 20B / 20C / 20D / 20E / 21A / 21B / 22A
  deferral, and is **Phase 23A only**.
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
