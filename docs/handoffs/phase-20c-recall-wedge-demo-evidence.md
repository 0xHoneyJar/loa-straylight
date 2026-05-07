# Phase 20C — Recall Wedge demo / evidence packet (local only)

> Status: Phase 20C. **Demo / evidence packet only, in `loa-straylight`.**
> This document records how to reproduce the existing local Recall Wedge
> demo, what its JSON output looks like, and how its output relates to
> the Phase 20A decision-locks and the Phase 20B local scaffold test
> pin. Phase 20C is **local demo / local evidence only**: it is **not
> runtime-wired**, **not endpoint-wired**, **not the full Recall
> Wedge**, **not governed recall in Finn / Dixie / Freeside runtime**,
> and **not Hounfour-side schema work**. Phase 20C is **Phase 20C
> only** — it does not advance any Phase 20A deferral.
>
> Phase 20C does **not** flip any wedge import, change `package.json` /
> `package-lock.json`, change the Hounfour dependency range or resolved
> patch, modify
> [`../../src/straylight/`](../../src/straylight/), modify
> [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts),
> modify [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
> modify [`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
> or [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts),
> wire Finn / Dixie / Freeside runtime, add a Dixie endpoint, edit any
> sibling repo, implement `Challenge` or `EstateTransition`, reach into
> unexported Hounfour internals, add a `safeCanonicalize` subpath
> import, publish a public commitment root, or touch `.loa/` /
> `.claude/`. It does **not** commit and does **not** open a PR. The
> actual Phase 20C PR is a separate, future event under teammate
> review.
>
> Companion docs (the Phase 20A decision-locks and Phase 20B scaffold
> Phase 20C respects):
> [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md),
> [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md),
> [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md),
> [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md),
> [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md),
> [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md),
> [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md),
> [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md).

## Executive summary

Phase 20C makes the existing local Recall Wedge demo **reproducible and
reviewable** from one in-repo packet. It documents how to run the
demo, where its output lands, what the output's top-level JSON shape
is, how that output exercises the Phase 20A decision-locks, and how
it relates to the Phase 20B local-scaffold test pin. Phase 20C adds
exactly two source-controlled artifacts:

1. this handoff doc, plus
2. one additive test file
   ([`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts))
   that lightly pins the demo's JSON output **shape** (the five
   top-level keys + the link between `recall_pack` and
   `recall_receipt`), without changing demo behavior.

Phase 20C also updates the per-packet handoff index
([`README.md`](./README.md)) and the cross-repo handoff index
([`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)) to
link this document. No source file, fixture file, script, or package
file is modified. The Hounfour dependency
(`@0xhoneyjar/loa-hounfour@^8.5.0`) is unchanged. The wedge's stable
public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)) is
unchanged. No new committed example output is added — the demo's
output path (`.run/recall-demo.json`) is gitignored by existing repo
convention (see
[`../../.gitignore`](../../.gitignore) and the demo CLI's own help
text in
[`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)).

## Command to run the local recall demo

The demo is already wired into `package.json` scripts. The three
supported invocations are, in order of evidence value for review:

```bash
# 1. JSON to a local file (Phase 20C-recommended for evidence reviews).
npm run demo:recall:json
# Internally: vite-node scripts/demo-recall-wedge.ts -- --json --out=.run/recall-demo.json

# 2. JSON to stdout (useful when piping into jq for spot-checks).
npm run demo:recall -- --json

# 3. Human-readable transcript to stdout (the original Phase 4 demo flow).
npm run demo:recall
```

These scripts are defined in
[`../../package.json`](../../package.json) (`demo:recall` and
`demo:recall:json` keys) and route through the CLI in
[`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts),
which calls `runDemo()` and `toDemoJson()` from
[`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts).
Phase 20C does not change any of these files.

## Expected output location

`npm run demo:recall:json` writes to `.run/recall-demo.json`, relative
to the repo root. Phase 20C **does not** change this path.

The `.run/` directory is gitignored at
[`../../.gitignore`](../../.gitignore) and is documented as gitignored
by the demo CLI's own help text. That is a deliberate repo convention:
demo output is **local-only evidence** that a reviewer regenerates on
their own machine. No committed snapshot of `.run/recall-demo.json`
exists in the repo, and Phase 20C explicitly does not introduce one
(the existing convention is the source of truth; inventing a parallel
"committed evidence" convention here would create drift between the
two).

A reviewer who wants to inspect the JSON does so by running the
command above; the file appears at `.run/recall-demo.json` in their
working tree, where they can read it, hash it, or pipe it into `jq`
for ad-hoc inspection. The file is overwritten on each run.

## Expected top-level JSON keys

The JSON projection emitted by `npm run demo:recall:json` (and the
two `--json`-flag variants) carries exactly five top-level keys, in
the shape declared by `DemoJsonOutput` in
[`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts):

| Key | Type | Source / purpose |
|---|---|---|
| `recall_request` | `RecallRequest` | The `public_discord`-frame `RecallRequest` the demo built — the structurally validated, signer-bound input that drove the public recall pass. ADR-020D §4 receipt-content categories begin from this request. |
| `recall_pack` | `RecallPack` | The `public_discord`-frame `RecallPack` produced by `executeRecall()` — the local "what was *included*, *marked*, *redacted*, *excluded*" answer to that request. The pack's `included` items are `usable`; its `marked` items are never `usable`. |
| `recall_receipt` | `RecallReceipt` | The receipt linking `recall_pack` to its policy decision, signer reference, included assertion ids, marked assertion ids, redacted count, and excluded-reason counts. The receipt's `pack_hash` matches the pack's `pack_hash`; its `receipt_hash` is `sha256:`-prefixed. |
| `audit_review` | `{ request, pack, receipt }` | A second recall pass over the same estate in the `audit_review` frame — proves that revoked / forgotten / contested material remains *auditable* under elevated review without leaking back into ordinary `usable` answers. |
| `audit_chain_verification` | `{ ok: true } \| { ok: false, broken_at, reason }` | Output of `AuditLog.verifyChain()` over the estate's per-estate hash chain after the demo's full transition + recall sequence. On a clean local run this is `{ ok: true }`. |

The Phase 20C test pin
([`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts))
asserts these top-level keys, the `audit_review` sub-keys
(`request`, `pack`, `receipt`), the `audit_chain_verification.ok`
invariant, and the `recall_pack` ↔ `recall_receipt` linkage on both
the public and audit-review frames. The pin is shape-only and does
not duplicate the behavior assertions already covered by
[`../../tests/phase-4-demo.test.ts`](../../tests/phase-4-demo.test.ts).

## How the demo relates to Phase 20A decisions

The Phase 20A decision-locks under
[`../decisions/`](../decisions/) frame what the demo is *allowed* to
demonstrate; Phase 20C records the actual mapping:

| ADR | Decision-lock | What the demo demonstrates (or deliberately does not) |
|---|---|---|
| **020A** Semantic owner | Loa-Straylight remains the semantic owner; sibling repos are *candidates* only. | The demo composes only Straylight-owned types via the wedge's stable public surface ([`src/straylight/index.ts`](../../src/straylight/index.ts)). No sibling-repo module is imported. No primitive is renamed. |
| **020B** MVP endpoint host | Default candidate Dixie; fallback Finn; Phase 20A wires neither. | The demo is a **local CLI**, not an endpoint. There is no HTTP / NATS / Discord surface in the demo. The JSON output is library-shaped (read on disk), so it is *compatible with* — but does not *commit to* — either a future Dixie-hosted or Finn-hosted inspection surface. |
| **020C** Schema namespace strategy | Future Straylight-specific namespace; `Challenge` / `EstateTransition` / `safeCanonicalize` subpath deferred. | The demo uses no `Challenge` schema, no `EstateTransition` schema, and no `safeCanonicalize` subpath import. Canonicalization runs through the Straylight-local helper at [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts). The Hounfour alias module remains private. |
| **020D** Persistence and receipts | MVP receipt semantics owned by Loa-Straylight; the six receipt categories remain pinned. | All six ADR-020D §4 categories — *included*, *excluded*, *redacted*, *challenged* (marked), *revoked*, *blocked-by-policy* — are visible in the JSON output, distributed across `recall_pack.included`, `recall_pack.excluded_summary`, `recall_pack.redacted`, `recall_pack.marked`, the audit-review pack/receipt, and (for blocked-by-policy specifically) the `transition_denied` audit-event path the Phase 20B test pins. The demo runs a successful recall, so blocked-by-policy is exercised by the Phase 20B test, not by this demo's JSON output. |
| **020E** Commitment root deferral | Local commitment-root helper unchanged; no public anchoring; no onchain integration. | The demo's JSON output **does not** contain a published commitment root. The local commitment-root helper at [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts) remains exercised only by the Phase 5 hardening tests. Phase 20C does not promote it to a demo emission. |

## How the demo relates to Phase 20B local scaffold tests

Phase 20B
([`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md))
added one additive test file
([`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts))
that pinned the six ADR-020D §4 receipt categories on the existing
`executeRecall()` pipeline, plus the load-bearing
"structural validity is not authorization" invariant and a
receipt-or-audit completeness pin.

Phase 20C exercises **the same `executeRecall()` pipeline**
end-to-end, on a richer fixture estate, via `runDemo()` in
[`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts).
The relationship is:

- **Phase 20B is per-category.** It seeds one assertion per category
  and asserts that category's receipt-content invariant in
  isolation. Each `describe` block in
  [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  targets one category from ADR-020D §4 (or one of the
  structural-validity / receipt-or-audit pins).
- **Phase 20C is end-to-end.** It runs the demo's full transition
  sequence (admit × 6, challenge × 1, revoke × 1, forget × 1),
  followed by a public-frame recall and an audit-review-frame
  recall, and asserts that the *shape* of the JSON projection is
  stable. The demo's behavior is already covered by
  [`../../tests/phase-4-demo.test.ts`](../../tests/phase-4-demo.test.ts);
  Phase 20C's pin is purely shape, not behavior.

Together the two phases give a reviewer a per-category pin (Phase 20B)
plus an end-to-end reproducible artifact (Phase 20C) for the same
local pipeline. Neither phase wires runtime, neither adds an
endpoint, and neither changes the wedge's public surface.

## What the demo proves

Restated narrowly so a reviewer can rely on the bullet list without
reading the JSON:

- The local `RecallRequest → RecallPack + RecallReceipt` pipeline
  defined in
  [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts)
  runs end-to-end on the existing fixture estate, in two frames
  (`public_discord` and `audit_review`), and emits both a
  `RecallPack` and a `RecallReceipt` per request.
- The five top-level JSON keys named above are present in the
  output and stable across runs (the Phase 20C test pin protects
  this contract).
- The `recall_pack.pack_hash` matches the `recall_receipt.pack_hash`,
  and the `recall_pack.recall_pack_id` matches the
  `recall_receipt.recall_pack_id` — the receipt is linked to the
  pack it explains. (Pinned in Phase 20C; same invariant on the
  audit-review pair.)
- The audit-chain hash chain over the estate's full transition log
  verifies clean (`audit_chain_verification.ok === true`) after
  the demo's admit / challenge / revoke / forget / recall sequence.
- The five ADR-020D §4 receipt-content categories that the demo can
  surface in a successful recall — *included*, *excluded*,
  *redacted*, *challenged* (marked), *revoked* (in audit-review
  only) — are visible in the JSON output. The sixth category,
  *blocked-by-policy*, is exercised by the Phase 20B test pin
  (the demo runs a successful recall and so does not produce a
  policy-denied output).

## What the demo does not prove

For symmetry, and so a reviewer cannot misread the JSON as proof of
something it does not show:

- **Not** that the full Recall Wedge is implemented. The demo
  exercises only the local library-shaped pipeline.
- **Not** that governed recall exists in Finn / Dixie / Freeside
  runtime. None of those sibling repos is imported, called, or
  wired by the demo.
- **Not** that a Dixie endpoint exists. The demo writes JSON to a
  gitignored local file; no HTTP / NATS / Discord / REST surface
  is exposed.
- **Not** that a Finn runtime integration exists. No Finn
  enforcement boundary, runtime audit substrate, or model-routing
  layer participates in the demo.
- **Not** that a Freeside community / bot / admin surface exists.
  No bot command, admin tool, or tenant-context shim runs in the
  demo.
- **Not** that Hounfour owns Straylight schemas. The demo composes
  Straylight-owned types only; the Hounfour alias module
  ([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
  is not re-exported and is not on the demo's import path.
- **Not** that `Challenge` exists as a Hounfour schema. The
  Straylight-local `challenge` verb participates in the demo's
  transition sequence; that is not a `Challenge` schema and does
  not anticipate one. `Challenge` adoption remains gated on
  Hounfour v8.6.0 / cycle-005.
- **Not** that `EstateTransition` exists. The
  Straylight-local transition-application code path participates
  in the demo; it does not anticipate an `EstateTransition`
  schema. Adoption remains gated on Hounfour v8.6.0 / cycle-005.
- **Not** that public anchoring exists. The demo's JSON output
  contains no published commitment root. The local helper at
  [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  is unchanged and unpublished.
- **Not** that the wedge's threat model has widened. No network
  adversary surface, no real cryptographic surface, no onchain
  surface is added. The demo runs in a single local process.

## Explicit non-claims

Phase 20C makes the following non-claims explicitly, so a reviewer
can quote this list to refuse any over-reading of the demo's output:

- "The full Recall Wedge is implemented." — **No.** Local
  library-shaped demo only; not runtime-wired; not endpoint-wired.
- "Governed recall exists in Finn / Dixie / Freeside runtime." —
  **No.** No sibling-repo runtime is wired; no sibling-repo PR has
  merged.
- "A Dixie endpoint exists." — **No.** ADR-020B's default
  endpoint-host candidate (Dixie) and fallback (Finn) are
  *recommendations*, not implementations. Neither is wired by
  Phase 20C.
- "A Finn runtime integration exists." — **No.** Phase 10 staged
  the contract; no `loa-finn` PR has implemented it.
- "Hounfour owns Straylight schemas." — **No.** Per ADR-020A and
  ADR-020C, Loa-Straylight remains the semantic owner. Hounfour
  remains the canonical schema *candidate*, gated by issue #70.
- "`Challenge` exists." — **No.** Deferred to Hounfour v8.6.0 /
  cycle-005.
- "`EstateTransition` exists." — **No.** Deferred to Hounfour
  v8.6.0 / cycle-005.
- "Public anchoring exists." — **No.** Per ADR-020E, the local
  commitment-root helper is unchanged and unpublished.

This is a **local demo**. The output is **local evidence**. The
Recall Wedge is **not runtime-wired** and **not endpoint-wired** by
Phase 20C. This is **Phase 20C only**.

## What Phase 20C explicitly did *not* do

Phase 20C inherits every Phase 20A / Phase 20B non-scope item, plus
the following:

- **No Finn runtime wiring.** No import from `loa-finn`, no
  Finn-side fixture consumption, no Finn-shaped HTTP / NATS / WAL
  adapter.
- **No Dixie runtime wiring.** No import from `loa-dixie`, no
  Dixie-side fixture consumption, no BFF endpoint, no
  recall-response HTTP surface.
- **No Dixie endpoint.** ADR-020B's default endpoint-host
  recommendation is unchanged and unwired.
- **No Freeside bot / admin / community integration.** No Discord
  / Telegram / REST / NATS surface. No bot command. No admin tool.
  No tenant-context shim.
- **No edits to any sibling repo.** Not `loa-hounfour`, not
  `loa-finn`, not `loa-dixie`, not `loa-freeside`. No clone, no
  fork, no patch.
- **No Hounfour schema authoring.** Hounfour-side work remains
  gated by [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
- **No `Challenge` implementation.** Deferred per ADR-020C and
  the Phase 16 delta.
- **No `EstateTransition` implementation.** Deferred per ADR-020C
  and the Phase 16 delta.
- **No reach into unexported Hounfour internals.** The alias
  module continues to use only declared subpaths.
- **No `safeCanonicalize` subpath import.** The
  `no-confirmed-subpath` gate (Phase 18) is unchanged. The
  Straylight-local canonicalizer
  ([`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts))
  remains the canonicalization implementation.
- **No Hounfour dependency change.** The `^8.5.0` range pin in
  [`../../package.json`](../../package.json) is unchanged. The
  resolved patch is unchanged.
- **No `package.json` / `package-lock.json` changes.**
- **No `src/` changes.** The wedge's stable public API surface
  ([`src/straylight/index.ts`](../../src/straylight/index.ts)) is
  unchanged. No re-export is added. No re-export is removed.
- **No demo source changes.** Neither the CLI in
  [`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
  nor the demo library in
  [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts)
  is modified.
- **No fixture changes.** The fixtures under
  [`../../fixtures/`](../../fixtures/) are unchanged.
- **No new committed example output.** `.run/recall-demo.json`
  remains gitignored per existing repo convention; Phase 20C does
  not invent a parallel "committed evidence" path.
- **No public anchor / commitment-root publication.** Per
  ADR-020E. The local helper at
  [`../../src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
  is unchanged.
- **No re-export of
  [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  from `index.ts`.** The alias module remains private per
  Phase 17B / 19A.
- **No new HTTP / network surface.** The threat model in
  [`../mvp/threat-model.md`](../mvp/threat-model.md) lists network
  adversary as out-of-scope; Phase 20C does not move it in-scope.
- **No new dependencies in `package.json`.**
- **No `.loa/` / `.claude/` edits.**
- **No auth token printing or writing.** The user-scoped
  `~/.npmrc` Hounfour auth (Phase 17B) remains out-of-band; the
  project `.npmrc` remains registry-only.
- **No commit, no push, no PR.**

## Validation evidence

```bash
npm run typecheck
npm test
npm run demo:recall:json   # writes .run/recall-demo.json (gitignored)
```

`npm run typecheck` and `npm test` are expected to remain clean on
the `phase-20c-recall-wedge-demo-evidence` branch: the Phase 20C
test file
([`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts))
exercises the existing `runDemo()` / `toDemoJson()` library entrypoints
and asserts only the documented JSON shape; no source file is
modified, so the existing Phase 4 demo test, Phase 5 hardening
tests, Phase 17B / 18 shadow-integration pins, Phase 19A
review-packet pin, Phase 20B local-scaffold pin, and the existing
handoff-doc validation tests are unaffected.

`npm run demo:recall:json` writes `.run/recall-demo.json` locally
each time it runs; reviewers regenerate it on their own machine to
inspect the actual JSON. The file is gitignored.

## What remains deferred

Phase 20C does not move any of the Phase 20A / Phase 20B deferrals
forward. The following remain explicitly deferred and are recorded
here so a reviewer can confirm Phase 20C did not silently advance
them:

- **Sibling-repo runtime wiring** (Finn / Dixie / Freeside).
  Each remains a future, separate, sibling-repo PR under teammate
  review per
  [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).
- **`Challenge` and `EstateTransition` schema adoption.** Both
  remain on the Hounfour v8.6.0 / cycle-005 trajectory.
- **`safeCanonicalize` subpath migration.** Deferred under gate
  `no-confirmed-subpath` (Phase 18).
- **`audit-event-transition` resolution path.** Recorded as
  `DISCOVERY_NOTE` (Phase 18); resolution is a deliberate
  later-phase decision.
- **Public anchor / commitment-root publication.** Gated on the
  seven future-requirement bullets in ADR-020E.
- **Production database / persistence substrate.** Gated on
  ADR-020D + the relevant sibling-repo handoff packet.
- **Hounfour-side response on
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).**
  No Hounfour-side schema work, Hounfour dependency change, or
  public-surface namespace flip happens in Phase 20C.

## Cross-references

- [`phase-20a-recall-wedge-readiness.md`](./phase-20a-recall-wedge-readiness.md)
  — Phase 20A decision-lock readiness packet.
- [`phase-20b-implementation-candidate-scope.md`](./phase-20b-implementation-candidate-scope.md)
  — Phase 20A-staged Phase 20B candidate scope.
- [`phase-20b-recall-wedge-local-scaffold.md`](./phase-20b-recall-wedge-local-scaffold.md)
  — Phase 20B local-scaffold summary; the per-category receipt pins
  this packet's end-to-end demo references.
- [`../decisions/ADR-020A-straylight-semantic-owner.md`](../decisions/ADR-020A-straylight-semantic-owner.md)
  — semantic-owner decision-lock.
- [`../decisions/ADR-020B-recall-wedge-endpoint-host.md`](../decisions/ADR-020B-recall-wedge-endpoint-host.md)
  — MVP endpoint-host recommendation + fallback.
- [`../decisions/ADR-020C-straylight-schema-namespace-strategy.md`](../decisions/ADR-020C-straylight-schema-namespace-strategy.md)
  — schema-namespace strategy + Phase 20A deferrals.
- [`../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md`](../decisions/ADR-020D-recall-wedge-persistence-and-receipts.md)
  — receipt-ownership + persistence-deferral decision-lock; the six
  receipt categories the demo's JSON output surfaces (the sixth,
  blocked-by-policy, is exercised by the Phase 20B test pin, not
  by this demo's successful run).
- [`../decisions/ADR-020E-commitment-root-deferral.md`](../decisions/ADR-020E-commitment-root-deferral.md)
  — commitment-root / public-anchor deferral.
- [`hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)
  — Phase 19A upstream-review packet.
- [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  — Phase 17B / 18 shadow-integration findings.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo coordination index.
- [`cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — sibling-repo no-go sequence (binding).
- [`README.md`](./README.md) — per-packet handoff index, updated
  in Phase 20C to link this doc.
- [`../../scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts)
  — demo CLI entrypoint (unchanged by Phase 20C).
- [`../../scripts/demo-recall-wedge.lib.ts`](../../scripts/demo-recall-wedge.lib.ts)
  — demo library that defines `runDemo()`, `toDemoJson()`, and the
  `DemoJsonOutput` shape this packet pins (unchanged by Phase 20C).
- [`../../tests/phase-4-demo.test.ts`](../../tests/phase-4-demo.test.ts)
  — Phase 4 demo behavior test (unchanged by Phase 20C).
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — Phase 20B per-category receipt pins (unchanged by Phase 20C).
- [`../../tests/phase-20c-recall-wedge-demo-evidence.test.ts`](../../tests/phase-20c-recall-wedge-demo-evidence.test.ts)
  — the Phase 20C demo-shape pin itself.
