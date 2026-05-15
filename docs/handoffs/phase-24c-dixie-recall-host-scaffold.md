# Phase 24C — Dixie recall-host local scaffold packet

> Status: Phase 24C. **Local additive scaffold inside `loa-straylight`
> only.** This packet ships the Phase 24C deliverable: a TypeScript
> host-surface scaffold under `src/straylight/host/` that expresses the
> six in-slice Dixie MVP host surfaces from
> [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
> against the wedge's existing stable public API, plus additive vitest
> coverage exercising Phase 24B validation vectors 1–8 at the host
> inspection layer.
>
> Phase 24C is **not endpoint-wired**, **not runtime-wired**, **not a
> sibling-repo PR**, **not a Hounfour package bump**, **not a wedge
> public-API change**, and **not a schema authoring event**. The host
> module is **not** re-exported through
> [`../../src/straylight/index.ts`](../../src/straylight/index.ts);
> consumers must import from
> [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
> directly. The wedge public API does not depend on the host scaffold;
> the host scaffold imports the wedge public API.
>
> Phase 24C does **not** edit
> [`../../src/straylight/index.ts`](../../src/straylight/index.ts) or any
> existing wedge module under
> [`../../src/straylight/`](../../src/straylight/); does **not** flip a
> wedge import; does **not** change `package.json` /
> `package-lock.json`; does **not** consume Hounfour `main` or any
> unpublished commit; does **not** import the Hounfour `#116` five-step
> conformance corpus; does **not** adopt the
> `0xhoneyjar:straylight:*` audit-event prefix family into the
> Straylight public surface; does **not** adopt the `recall-wedge`
> Hounfour conformance category into the Straylight test suite; does
> **not** wire `loa-dixie` / `loa-finn` / `loa-freeside`; does **not**
> add an HTTP / NATS / Discord / Telegram surface; does **not** publish
> a public commitment root; does **not** advance any ADR-022E gate; and
> does **not** touch `.loa/` / `.claude/` / `.beads/` / `.run/` /
> `.github/`. The branch makes no commit, opens no PR, and posts no
> GitHub-side comment by itself.
>
> Companion docs:
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md),
> [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
> [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md),
> [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md),
> [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md),
> [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
> through
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md),
> [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
> [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
> [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md),
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md),
> [`../mvp/threat-model.md`](../mvp/threat-model.md).

## Executive summary

Phase 24B docs/spec-locked the Dixie-first recall-pack-inspection MVP
host: six in-slice surfaces, vectors 1–8 reframed at the host
inspection layer, vector 9 as cross-reference only, vectors 10 and 11
as gates. Phase 24C lands the **local additive scaffold** that
expresses those surfaces in TypeScript, against the wedge's stable
public API. The scaffold has three properties that load-bear under
review:

1. **Wedge produces, host inspects.** Every host outcome that surfaces
   wedge state — `RecallPack`, `RecallReceipt`, exclusion reasons,
   provenance walks, audit chains, estate counts — is derived from a
   wedge primitive surfaced through
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (or
   the `EstateStore` / `StorageAdapter` / `AuditLog` aggregates that
   `index.ts` re-exports). The host never produces a `RecallPack`,
   never produces a `RecallReceipt`, never computes `dispositionFor`,
   never reinterprets `privacy_scope`, and never publishes a
   commitment root.

2. **Fail-closed everywhere.** Storage unavailability, missing
   receipt, unknown assertion, unknown estate, cross-tenant mismatch,
   private-in-public, signer/policy denial surfaced from the wedge,
   and a broken audit chain all surface a typed refusal. The host
   never invents a permissive default and never synthesizes a missing
   `RecallPack`, `RecallReceipt`, provenance entry, audit event, or
   estate assertion.

3. **Tenant resolution is an explicit, required dependency.** Every
   host surface that makes a cross-tenant decision requires a
   `TenantResolver` injected by the caller. There is no production
   default resolver; ambiguity (resolver returns `undefined`) fails
   closed with `tenant_resolution_failed`.

Six TypeScript host-surface modules ship under
[`../../src/straylight/host/`](../../src/straylight/host/) plus a
local barrel, a host-side intake-deny log, and a tenant-resolver
primitive. Six additive vitest files ship under
[`../../tests/`](../../tests/) covering the surface-shape pin,
validation-vectors 1–8, the host-layer fail-closed invariants, and
the intake-log per-tenant scoping. Existing tests are unchanged and
still pass.

## What this packet ships

### Local additive scaffold under `src/straylight/host/`

| File | Surface / role | Source |
|---|---|---|
| [`../../src/straylight/host/types.ts`](../../src/straylight/host/types.ts) | Per-surface TypeScript request/response shapes; `HostFrame`, `HostCaller`, `DeniedReason`, `ExclusionReason` enums. No schema; no `$id`. | New. |
| [`../../src/straylight/host/tenancy.ts`](../../src/straylight/host/tenancy.ts) | `TenantResolver` contract + `checkSameTenant` primitive. **No production default resolver.** | New. |
| [`../../src/straylight/host/intake-log.ts`](../../src/straylight/host/intake-log.ts) | In-memory `IntakeDenyLog` for host-side intake refusals (vectors 7 / 8). Per-tenant view via `listForTenant`. | New. |
| [`../../src/straylight/host/intake.ts`](../../src/straylight/host/intake.ts) | **Surface 1** — Recall intake & response (`handleRecallIntake`). Delegates to wedge `executeRecall`. | New. |
| [`../../src/straylight/host/receipt.ts`](../../src/straylight/host/receipt.ts) | **Surface 2** — Receipt retrieval & display (`handleReceiptRetrieval`). | New. |
| [`../../src/straylight/host/exclusion.ts`](../../src/straylight/host/exclusion.ts) | **Surface 3** — Excluded-assertion reason display (`handleExclusionDisplay`). Pure render over `RecallPack.excluded_summary[]` / `redacted[]` / `marked[]`. | New. |
| [`../../src/straylight/host/provenance.ts`](../../src/straylight/host/provenance.ts) | **Surface 4** — Provenance inspection (`handleProvenanceWalk`). | New. |
| [`../../src/straylight/host/audit-lookup.ts`](../../src/straylight/host/audit-lookup.ts) | **Surface 5** — Audit-chain lookup (`handleAuditChainLookup`). Surfaces `verifyChain` ok / broken outcomes. | New. |
| [`../../src/straylight/host/estate-summary.ts`](../../src/straylight/host/estate-summary.ts) | **Surface 6** — Estate summary (`handleEstateSummary`). Wedge 4-key `PrivacyScope` → spec 2-key `by_privacy_scope` projection + raw `_widened_privacy_scope` map for trace. | New. |
| [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) | Local barrel. **NOT re-exported through `src/straylight/index.ts`.** | New. |

### Additive tests under `tests/`

| File | Pins |
|---|---|
| [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts) | The six handlers + `checkSameTenant` + `createInMemoryIntakeDenyLog` are exported from the host barrel. The wedge public surface does NOT re-export host symbols. The wedge's 11 existing sections are still re-exported. No forbidden imports under `src/straylight/host/` (no `loa-dixie` / `loa-finn` / `loa-freeside` / `@0xhoneyjar/loa-hounfour` / `hounfour-alias`). The wedge does not depend on the host. |
| [`../../tests/phase-24c-host-vectors-1-to-3.test.ts`](../../tests/phase-24c-host-vectors-1-to-3.test.ts) | Vector 1 (included), Vector 2 (class-filter exclusion surfaced as `excluded`), Vector 3 (actor_private parent + public_discord request frame → excluded; tenant scope redacted; Surface 4 refuses provenance walk under `public_discord` caller frame; permits walk under `actor_private` caller frame). |
| [`../../tests/phase-24c-host-vectors-4-to-6.test.ts`](../../tests/phase-24c-host-vectors-4-to-6.test.ts) | Vector 4 (contested marked → category `challenged`), Vector 5 (revoked → category `revoked`, raw_reason `status_revoked`), Vector 6 (forget transition via wedge → ordinary recall excludes, audit chain verifyChain=ok with `assertion_forgotten_from_recall` event surfaced through Surface 5). |
| [`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts) | Vector 7 (cross-tenant intake denied with `cross_tenant_recall_refused`; intake-deny log entry on the caller's tenant only; Surfaces 4 / 5 / 6 refuse identically). Vector 8 (actor_private + public_discord request frame → pack served with `privacy_actor_private_in_public_frame` exclusion; Surface 4 with caller.frame=public_discord refuses with `privacy_scope_refusal`). |
| [`../../tests/phase-24c-host-fail-closed.test.ts`](../../tests/phase-24c-host-fail-closed.test.ts) | Unknown ids → typed refusals (Surfaces 2 / 4 / 5 / 6). Resolver returning `undefined` → `tenant_resolution_failed` everywhere. Out-of-enum frame → `frame_unsupported` (Surfaces 4 / 6). Sealed parent → `privacy_scope_refusal` regardless of caller frame. Storage exception → `storage_unavailable` typed reason. Tampered audit chain → `outcome: 'broken'` with `break_index` + `break_reason`. Denied intake never carries pack / receipt fields. |
| [`../../tests/phase-24c-host-intake-log.test.ts`](../../tests/phase-24c-host-intake-log.test.ts) | Per-tenant `listForTenant` scoping. Content-addressed entry ids. Vector 7 cross-tenant intake produces an entry on the CALLER tenant only (cross-tenant chain links forbidden). Wedge-side recall_denied path records the wedge's audit_event_id in `wedge_audit_event_ref`. |

### Doc additions

| File | Purpose |
|---|---|
| [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md) | **This** summary handoff. |
| [`./README.md`](./README.md) | Append-only Phase 24C row (no edits to prior rows). |

### Not shipped

- **No fixture additions / renames / moves.** The 10 existing
  [`../../fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  fixtures remain Phase 12 handoff evidence and are unchanged. Host
  tests seed assertions inline via the existing fixture builders in
  [`../../fixtures/index.ts`](../../fixtures/index.ts).
- **No `package.json` / `package-lock.json` change.** Hounfour stays
  `@0xhoneyjar/loa-hounfour@^8.6.0`, resolved patch `8.6.0`.
- **No script additions.** No new entry in
  [`../../scripts/`](../../scripts/); no new `package.json` script.
- **No `src/straylight/index.ts` edit.** The wedge public surface is
  byte-identical to its pre-Phase-24C state.
- **No edits to any existing wedge module.** Phase 24C never touched
  [`../../src/straylight/types.ts`](../../src/straylight/types.ts),
  [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts),
  [`../../src/straylight/policy.ts`](../../src/straylight/policy.ts),
  [`../../src/straylight/audit.ts`](../../src/straylight/audit.ts),
  [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts),
  or any other pre-existing file.
- **No sibling-repo edits.** Not `loa-hounfour`, not `loa-finn`, not
  `loa-dixie`, not `loa-freeside`.
- **No GitHub-side action.** No issue filed, no comment posted, no PR
  opened.
- **No Hounfour `#116` adoption.** No five-step conformance corpus
  import, no `0xhoneyjar:straylight:*` prefix family adoption, no
  `recall-wedge` category adoption. ADR-024C's package-release gate
  (Event A + Event B + Event C) is unsatisfied; Phase 24C triggers
  none of the three.
- **No advance of any ADR-022E gate.** `EstateTransition` (gate #1),
  `safeCanonicalize` (gate #2), `Challenge` re-export (gate #4),
  `AuditEvent` rename (gate #5) all unchanged.

## Architecture summary

```
┌─────────────────────────────────────────────────────────────────────┐
│  src/straylight/host/  — Phase 24C local additive scaffold          │
│                                                                     │
│   handleRecallIntake (S1)  ──┐                                      │
│   handleReceiptRetrieval(S2) │                                      │
│   handleExclusionDisplay(S3) ├─ imports the wedge public API only:  │
│   handleProvenanceWalk  (S4) │    EstateStore, executeRecall,       │
│   handleAuditChainLookup(S5) │    AuditLog, StorageAdapter,         │
│   handleEstateSummary   (S6) ┘    contentId, types from ../types.js │
│                                                                     │
│   tenancy.ts: REQUIRED TenantResolver injection                     │
│   intake-log.ts: host-side intake-deny log (per-tenant)             │
│   index.ts: local barrel (NOT re-exported by wedge index.ts)        │
└─────────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │  (one-way; wedge never imports host)
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│  src/straylight/  — wedge public API (unchanged by Phase 24C)       │
│                                                                     │
│   index.ts re-exports: types, canonical/ids, signatures, validators,│
│   keyring, policy, audit, estate, recall, commitment, storage       │
└─────────────────────────────────────────────────────────────────────┘
```

## Intentional deviations from the Phase 24B spec

Three deviations from
[`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
are intentional. Each is forced by the constraint "host does not
synthesize" + the wedge's actual output shape.

1. **Surface 1 `denied` / `needs_review` outcomes do not carry a
   `RecallReceipt`.** The wedge does not emit a `RecallReceipt` on
   recall denial — only an `AuditEvent` (`transition_denied` payload
   `kind: 'recall_denied'`). The spec response shape
   ([`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
   §Surface 1) requires a receipt on deny; synthesizing one at the
   host would violate "host does not invent". Instead, the
   Phase 24C response shape surfaces `audit_event_id` +
   `raw_reasons` + a classified `DeniedReason`. The denial path
   carries the wedge's audit_event_id in the intake-deny log entry's
   `wedge_audit_event_ref` for chain-of-custody.

2. **Surface 3 excluded / redacted are aggregate-by-reason, not
   per-assertion.** The wedge's
   [`RecallPack.excluded_summary`](../../src/straylight/types.ts) is
   `Array<{ reason: string; count: number }>` and
   [`RecallPack.redacted`](../../src/straylight/types.ts) is
   `Array<{ reason: string; count: number }>` — no per-assertion
   granularity at the aggregate layer. Recomputing
   `dispositionFor` per-assertion at the host would violate "host
   does not invent reasons". The Phase 24C response keeps
   aggregate-by-reason shape (`excluded_aggregates`,
   `redacted_aggregates`) and preserves per-assertion granularity
   only on `marked[]` (which the wedge does carry per-assertion).
   The six-receipt-category classification is preserved on every
   aggregate / marked item via the `category` field plus a verbatim
   `raw_reason` for trace.

3. **Surface 6 `by_privacy_scope` is the spec 2-key shape plus a
   `_widened_privacy_scope` 4-key map.** The wedge's `PrivacyScope`
   enum has four values (`public` / `tenant` / `actor_private` /
   `sealed`); the spec response shape has two keys (`actor_private`
   / `public_discord`). Phase 24C projects `public + tenant →
   public_discord` and `actor_private + sealed → actor_private`,
   applies the frame discipline (zero `actor_private` under
   `public_discord` caller frame) on the 2-key shape, and AND
   surfaces the raw 4-key map under `_widened_privacy_scope` (no
   frame discipline applied — debug/trace only).

All three deviations are documented inline in
[`../../src/straylight/host/types.ts`](../../src/straylight/host/types.ts).

## Vector mapping pin

Per
[`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md):

| # | Vector | Phase 24C test | Host surface(s) exercised | Category surfaced |
|---|---|---|---|---|
| 1 | included | `phase-24c-host-vectors-1-to-3` | S1 served + S2 found + S3 (no exclusion) | `included` |
| 2 | class-filter excluded | `phase-24c-host-vectors-1-to-3` | S1 served + S3 (`excluded` aggregate, `class_excluded:observation`) | `excluded` |
| 3 | privacy redacted/excluded in served frame | `phase-24c-host-vectors-1-to-3` | S1 served + S3 (`privacy_actor_private_in_public_frame` excluded; `privacy_tenant_in_public_frame` redacted) + S4 (refused privacy_scope_refusal under public_discord caller frame; walked under actor_private caller frame) | `excluded` / `redacted` |
| 4 | contested marked | `phase-24c-host-vectors-4-to-6` | S1 served + S3 marked[] | `challenged` |
| 5 | revoked excluded | `phase-24c-host-vectors-4-to-6` | S1 served + S3 (`status_revoked` excluded) | `revoked` |
| 6 | forgotten excluded but auditable | `phase-24c-host-vectors-4-to-6` | S1 served + S3 (`status_forgotten_from_recall` excluded) + S5 (`assertion_forgotten_from_recall` event surfaced under verifyChain=ok) | `excluded` |
| 7 | cross-tenant recall refused | `phase-24c-host-vectors-7-to-8` + `phase-24c-host-intake-log` | S1 denied (`cross_tenant_recall_refused`; intake-deny log entry on caller tenant only) + S2 / S4 / S5 / S6 refused | `blocked-by-policy` (mapped via `DeniedReason: cross_tenant_recall_refused`) |
| 8 | denied private in public frame | `phase-24c-host-vectors-7-to-8` | S1 served (pack carries `privacy_actor_private_in_public_frame` exclusion) + S4 refused privacy_scope_refusal | `excluded` |
| 9 | signer not competent for RecallRequest | **NOT IN SLICE** — covered by existing [`../../tests/signer-fail-closed.test.ts`](../../tests/signer-fail-closed.test.ts); fail-closed coverage at the host layer is by `phase-24c-host-fail-closed` (`SIGNERS.unknown` path) | — | — |
| 10 | `EstateTransition` on the wire | **GATE — not exercised** (ADR-022E gate #1) | — | — |
| 11 | `safeCanonicalize` on the wire | **GATE — not exercised** (ADR-022E gate #2) | — | — |

## Validation evidence

```bash
npm run typecheck   # clean
npm test            # 32 files / 720 tests passed
npx vitest run tests/phase-24c-host*.test.ts                          # 6 files / 55 tests passed
npx vitest run tests/phase-5-hardening.test.ts \
                tests/phase-20b-recall-wedge-local-scaffold.test.ts \
                tests/storage-conformance.test.ts \
                tests/dixie-governed-recall-handoff.test.ts            # 107 tests passed (regression pin)
```

Pre-existing tests preserved: Phase 4 demo, Phase 5 hardening,
Phase 20B local scaffold, Phase 20C demo evidence, storage
conformance, dixie-governed-recall handoff, Phase 17B / 18 / 21A
shadow-integration, Phase 19A review-packet pin, all wedge unit
tests. No regression introduced; no test mutated.

## Open questions / followups (not blocking Phase 24C)

1. **No tenant_id on wedge primitives.** Phase 24C's `TenantResolver`
   contract is the agreed substitute. A future phase MAY introduce a
   first-class `tenant_id` on `Actor` / `Estate` under a separate
   adoption ADR; that would be a wedge-surface change and is
   explicitly out of scope here.

2. **`HostFrame` is narrower than wedge `EnvironmentFrame`.** The
   host accepts only `actor_private` / `public_discord` on caller
   envelopes (Surfaces 4, 6). The wedge's `RecallRequest.environment_frame`
   accepts seven values; the host does NOT widen the host envelope
   onto the wedge. A future phase MAY align them under a separate
   spec; today the narrower enum is what
   [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
   pins.

3. **Demo evidence packet deferred.** Per
   [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
   §"Demo plan", the wedge-runtime-style demo-evidence packet (à la
   [`./phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md))
   is produced "in a later phase". Phase 24C produces no
   demo-evidence packet; the additive tests under
   `tests/phase-24c-host-*.test.ts` cover vectors 1–8 end-to-end
   against the wedge runtime as the execution evidence.

4. **`review_queue_id` on `outcome: 'needs_review'` is a deterministic
   placeholder handle.** Phase 24C ships no review queue (no runtime
   surface). The handle is content-addressed from `recall_request_id`
   + `now` so tests can pin it; the real queue is the responsibility
   of a future runtime collaborator (most plausibly Finn under a
   later host-placement ADR).

## Explicit non-scope (Phase 24C)

- No edits to
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts) or
  any existing wedge module.
- No edits to
  [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts).
- No re-export of host symbols through the wedge public API.
- No fixture additions / renames / moves.
- No `package.json` / `package-lock.json` change.
- No Hounfour `main` / commit-SHA / git-source consumption.
- No `0xhoneyjar:straylight:*` adoption.
- No `recall-wedge` category adoption.
- No Hounfour five-step corpus import.
- No `Challenge` / `EstateTransition` / `safeCanonicalize` /
  `AuditEvent`-rename adoption.
- No public commitment-root publication.
- No HTTP / NATS / Discord / Telegram surface.
- No BFF / server / router / endpoint.
- No queue implementation for `needs_review`.
- No sibling-repo edits. Not `loa-hounfour`, not `loa-finn`, not
  `loa-dixie`, not `loa-freeside`.
- No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/` /
  `.gitignore` / `.gitmodules` / `.npmrc` edits.
- No commit, no push, no PR, no GitHub-side comment.

## Cross-references

- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — Phase 24B decision-lock the Phase 24C scaffold targets.
- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — per-surface MVP host contract.
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — vector matrix at the host inspection layer.
- [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)
  — Phase 24B summary handoff.
- [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary.
- [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
  through
  [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — Phase 24A decision-lock series.
- [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md),
  [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
  [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md)
  — Phase 12 Dixie packet (unchanged by Phase 24C).
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  — host barrel (Phase 24C).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge public API (unchanged by Phase 24C).
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts),
  [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts),
  [`../../tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts),
  [`../../tests/dixie-governed-recall-handoff.test.ts`](../../tests/dixie-governed-recall-handoff.test.ts)
  — regression-pin tests (unchanged by Phase 24C; still pass).
