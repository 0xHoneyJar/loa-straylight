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
