# Phase 24E — Dixie host handoff packet (docs-only)

> Status: Phase 24E. **Docs-only Dixie host handoff packet, in
> `loa-straylight` only.** This packet consolidates the merged
> Phase 24C local TypeScript host scaffold under
> [`../../src/straylight/host/`](../../src/straylight/host/) and
> the Phase 24D hardening into a Dixie-side reading: what a
> future `loa-dixie` host / BFF must **inspect**, **relay**, and
> **render** against each of the six in-slice surfaces — and the
> explicit set of things Dixie must **not** invent. The packet
> produces **no Straylight recall objects**, **no host runtime**,
> **no sibling-repo edit**, **no endpoint**, **no schema**, and
> **no test / fixture / script / package change**.
>
> Phase 24E does **not** flip a wedge import; does **not** change
> `package.json` / `package-lock.json`; does **not** consume
> Hounfour `main` or any unpublished commit; does **not** import
> the Hounfour `#116` five-step conformance corpus; does **not**
> adopt the `0xhoneyjar:straylight:*` audit-event prefix family
> into the Straylight public surface; does **not** adopt the
> `recall-wedge` Hounfour conformance category into the
> Straylight test suite; does **not** wire `loa-dixie` /
> `loa-finn` / `loa-freeside`; does **not** add an HTTP / NATS /
> Discord / Telegram surface; does **not** publish a public
> commitment root; does **not** advance any ADR-022E gate; and
> does **not** touch `.loa/` / `.loa.config.yaml` / `.claude/` /
> `.beads/` / `.run/` / `.github/` / `grimoires/loa/a2a/`. It
> does **not** commit, does **not** push, and does **not** open
> a PR. The Phase 19A pending feedback gate on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> remains pending and is not advanced by Phase 24E.
>
> Companion docs:
> [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md),
> [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md),
> [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md),
> [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md),
> [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
> [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md),
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md),
> [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
> through
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md),
> [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
> (Phase 24E refresh appended),
> [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
> (Phase 24E refresh appended),
> [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md)
> (Phase 24E refresh appended).

## Executive summary

Phase 24B docs/spec-locked the Dixie-first recall-pack-inspection
MVP host (ADR-024E, six in-slice surfaces, vectors 1–8 reframed
at the host inspection layer). Phase 24C landed the local
TypeScript scaffold expressing those six surfaces under
[`../../src/straylight/host/`](../../src/straylight/host/) against
the wedge's stable public API. Phase 24D tightened six
non-blocking review concerns into that scaffold without changing
any surface shape. The Phase 24C/24D scaffold has **63 host
tests passing** under
[`../../tests/phase-24c-host-*.test.ts`](../../tests/) +
[`../../tests/phase-24d-host-hardening.test.ts`](../../tests/phase-24d-host-hardening.test.ts).

Phase 24E is the **Dixie-side reading** of that scaffold. It
produces the cross-repo–shaped handoff a future `loa-dixie` host /
BFF will consume: what each surface lets Dixie inspect, what it
must relay verbatim, what it must render for an operator, what it
must not invent, the typed refusals it must surface, the
receipt-category vocabulary it must use, and the dependency
contracts it must inject. The packet **does not** open a
`loa-dixie` PR, **does not** ship a Dixie endpoint, **does not**
build a host runtime, and **does not** advance any Hounfour-side
or wedge-side gate. It is the docs-side artifact that Dixie
implementers (or a future Phase 24F demo-evidence packet) will
read against `src/straylight/host/index.ts`.

The packet has four load-bearing properties under review:

1. **Wedge produces, host inspects, Dixie renders.** Every Dixie
   surface output is a render over a Phase 24C/24D host handler's
   return value. Dixie never instantiates a `RecallPack` or
   `RecallReceipt`, never computes `dispositionFor`, never
   reinterprets `privacy_scope`, never runs `verifyChain`, and
   never publishes a commitment root.
2. **Fail-closed flows through Dixie unchanged.** Every typed
   refusal the host emits — `cross_tenant_recall_refused`,
   `privacy_scope_refusal`, `tenant_resolution_failed`,
   `frame_unsupported`, `storage_unavailable`,
   `unknown_receipt_id`, `unknown_assertion`, `unknown_estate`,
   `outcome: 'broken'` with `break_index` — is surfaced by Dixie
   verbatim. Dixie does not invent a permissive default and does
   not rewrite a refusal as a soft warning.
3. **Tenant resolution is Dixie's explicit dependency.** Dixie
   MUST inject a `TenantResolver` per call (or per session); the
   host scaffold ships **no production default**. Ambiguity
   (resolver returns `undefined` or empty string) fails closed
   with `tenant_resolution_failed`.
4. **Phase 24A/24B/24C/24D non-scope is fully preserved.** No
   Hounfour `#116` adoption; no `0xhoneyjar:straylight:*`
   adoption; no `recall-wedge` category adoption; no Hounfour
   `main` consumption; no `Challenge` / `EstateTransition` /
   `safeCanonicalize` / `AuditEvent`-rename adoption; no public
   commitment root; no sibling-repo wiring; no endpoint.

## Inherited state recap

- **Phase 24B (PR pre-Phase-24C, merged earlier)** selected
  **Dixie-first** host placement (ADR-024B / ADR-024E) under
  shape (b) of ADR-022B criterion #2: the host inspects a
  precomputed `RecallPack` + `RecallReceipt` emitted by the wedge;
  no `executeRecall` runs at the host. The minimum MVP slice is
  **recall-pack inspection / provenance walk / receipt display**,
  not generic retrieval.
- **Phase 24C (PR #29, merged)** added the six local host
  surfaces under [`../../src/straylight/host/`](../../src/straylight/host/)
  expressing the Phase 24B contract: `handleRecallIntake`,
  `handleReceiptRetrieval`, `handleExclusionDisplay`,
  `handleProvenanceWalk`, `handleAuditChainLookup`,
  `handleEstateSummary`. The scaffold includes a `TenantResolver`
  contract with no production default, an in-memory intake-deny
  log, and a local barrel
  ([`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts))
  that is intentionally **not** re-exported through the wedge
  public API.
- **Phase 24D (PR #30, merged)** tightened six non-blocking
  review concerns into the existing surfaces without adding new
  shapes: empty-tenant fail-closed in `checkSameTenant`; Surface
  4 refusal of `tenant`-scoped parent under `public_discord`
  caller frame; optional Surface 6 intake-deny log dependency on
  cross-tenant refusal; inline documentation pinning
  `needs_review` ≠ denial; inline documentation pinning unknown
  wedge exclusion reason → safe-default `excluded` with verbatim
  `raw_reason`; tightened vectors-7-to-8 receipt-not-found
  assertion to exactly `unknown_receipt_id`.
- **Host barrel discipline.** The host barrel
  ([`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts))
  is intentionally **NOT** re-exported through
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
  Consumers (tests today, a future Dixie host / BFF tomorrow)
  import the host barrel directly. The wedge public surface
  remains byte-identical to its pre-Phase-24C state.
- **Vector status.** Vectors 1–8 in slice and exercised at the
  host inspection layer. Vector 9 (`keyring_validation`-lane
  signer competence) is **not in slice** for Phase 24B / 24C /
  24D / 24E per ADR-024D §3.b; cross-reference only via the
  existing wedge test `tests/signer-fail-closed.test.ts`. Vectors
  10 (`EstateTransition` on the wire) and 11 (`safeCanonicalize`
  on the wire) remain ADR-022E gates and are **not** exercised
  by Phase 24E.
- **Hounfour / Finn / Freeside disposition unchanged.** Hounfour
  remains schema / protocol / conformance substrate only;
  Hounfour `#116` remains upstream substrate, not Straylight
  runtime substrate. Finn remains the later runtime / enforcement
  collaborator; out of slice for Phase 24E. Freeside remains the
  later community / app surface consumer; out of slice for
  Phase 24E. The Phase 19A pending feedback gate on
  `0xHoneyJar/loa-hounfour#70` remains pending and is **not**
  advanced by Phase 24E.

## Six per-surface Dixie readings

Each section below pins the Dixie-side reading for one of the
six in-slice host surfaces. Each section follows the same
five-part shape: **what Dixie may inspect**, **what Dixie may
relay**, **what Dixie may render**, **what Dixie must not
invent**, **relevant typed refusals + receipt-category
vocabulary**.

### Surface 1 — Recall intake / response

**Inspect.** `handleRecallIntake` returns one of three
discriminated outcomes: `served` (with a wedge-emitted
`RecallPack` + `RecallReceipt`), `denied` (with `audit_event_id`,
classified `DeniedReason`, and `raw_reasons` — no synthesised
receipt; see deviation #1 below), or `needs_review` (with a
deterministic `review_queue_id` handle; **not** a denial — no
intake-deny log entry written).

**Relay.** Dixie relays the wedge's emitted `RecallPack` and
`RecallReceipt` verbatim. Dixie relays the wedge's
`audit_event_id` verbatim on denial. Dixie relays the classified
`DeniedReason` and the verbatim `raw_reasons[]` so an auditor
can correlate to the wedge's audit chain.

**Render.** Dixie renders the served pack under the requested
`detail_level` (`minimal` / `standard` / `debug`) using the
wedge-applied redaction the pack already carries. For denial,
Dixie renders the `DeniedReason` classification plus the
`raw_reasons[]` trace. For `needs_review`, Dixie renders the
`review_queue_id` handle plus the wedge's `audit_event_id`; the
review-queue management surface itself is **future work**.

**Must not invent.** Dixie must not produce a `RecallPack` or
`RecallReceipt`; must not synthesise a receipt on `denied` or
`needs_review`; must not run `executeRecall`; must not
re-classify a `DeniedReason` (the host's classification is
authoritative); must not promote `needs_review` into a denial
or vice versa.

**Typed refusals carried.** `cross_tenant_recall_refused`,
`policy_unavailable`, `signer_not_competent`,
`storage_unavailable`, `blocked_by_policy`,
`privacy_scope_refusal`, `frame_unsupported`,
`tenant_resolution_failed`, `class_validation_failed`.

**Receipt vocabulary used by S1.** `included`, `excluded`,
`redacted`, `challenged`, `revoked`, `blocked-by-policy`.

### Surface 2 — Receipt retrieval / display

**Inspect.** `handleReceiptRetrieval` returns `{ outcome:
'found', receipt }` (wedge's persisted `RecallReceipt`, verbatim)
or `{ outcome: 'not_found', reason }` keyed to a typed reason.

**Relay.** Dixie relays the wedge's persisted `RecallReceipt`
verbatim under the requested `detail_level`. Dixie relays the
typed `not_found` reason verbatim.

**Render.** Dixie renders the receipt's `pack_hash`,
`receipt_hash`, signer envelope summary, `policy_decision`
summary, and `commitment_ref` (if present). Detail-level
discipline is wedge-applied at receipt emission; Dixie does not
invent additional redaction.

**Must not invent.** Dixie must not synthesise a receipt for an
unknown `receipt_id`; must not infer tenant identity from a
missing record (Phase 24D concern 6: unknown receipt id under a
cleanly-resolving caller tenant returns exactly
`unknown_receipt_id`); must not downgrade `debug` to `standard`
on its own — the wedge / persisted detail level is authoritative.

**Typed refusals carried.** `unknown_receipt_id`,
`cross_tenant_refused`, `tenant_resolution_failed`.

**Receipt vocabulary used by S2.** Whatever the persisted
receipt carries from `included` / `excluded` / `redacted` /
`challenged` / `revoked` / `blocked-by-policy`.

### Surface 3 — Excluded-assertion reason display

**Inspect.** `handleExclusionDisplay` is a pure render over the
wedge's already-served `RecallPack.excluded_summary[]`,
`redacted[]`, and `marked[]`. Per Phase 24C deviation #2,
`excluded_aggregates` and `redacted_aggregates` are
aggregate-by-reason (mirroring what the wedge actually carries);
per-assertion granularity exists only on `marked[]`.

**Relay.** Dixie relays each `excluded_aggregates[]` entry's
`category` (one of the six receipt categories), wedge-derived
`raw_reason`, and `count`. Dixie relays `marked[]` entries
per-assertion including `category` + `raw_reason`. Dixie relays
Phase 24D's safe-default mapping for unrecognised wedge reasons:
the entry's `category` is `excluded` and the `raw_reason` is the
verbatim wedge string.

**Render.** Dixie renders the operator-friendly reason text
keyed to the `category` enum and surfaces `raw_reason` for
trace. Counts are surfaced as-is.

**Must not invent.** Dixie must not invent a reason that is not
in the pack; must not promote an unrecognised wedge reason into
a narrower category (`revoked` / `challenged`) — the host's
safe-default `excluded` mapping is authoritative; must not
recompute `dispositionFor`; must not synthesise per-assertion
granularity on `excluded` / `redacted` aggregates.

**Typed refusals carried.** None at S3 itself — Surface 3 is a
pure render; the upstream pack already encodes the wedge's
fail-closed posture.

**Receipt vocabulary used by S3.** `included`, `excluded`,
`redacted`, `challenged`, `revoked`, `blocked-by-policy`.

### Surface 4 — Provenance inspection

**Inspect.** `handleProvenanceWalk` returns `{ outcome: 'walked',
provenance }` or `{ outcome: 'refused', reason }`. The walk
enforces the wedge's privacy-scope discipline against the
caller's `HostFrame`.

**Relay.** Dixie relays each provenance record's `actor_id`,
`ts`, `kind`, and (where present) `evidence_ref` verbatim. Dixie
relays the typed refusal reason verbatim on `refused`.

**Render.** Dixie renders the walk in chronological order, using
the parent assertion's `privacy_scope` to inform the operator
view. Per Phase 24D concern 2, a `tenant`-scoped parent under a
`public_discord` caller frame surfaces as
`privacy_scope_refusal` — Dixie renders the refusal, not the
walk. Under an `actor_private` caller frame, the same
`tenant`-scoped parent walks normally.

**Must not invent.** Dixie must not synthesise a provenance
record for an unknown assertion; must not widen the host's
two-value `HostFrame` (`actor_private` / `public_discord`) into
the wedge's seven-value `EnvironmentFrame`; must not promote a
refused walk into a permissive walk under a different caller
identity at render time.

**Typed refusals carried.** `privacy_scope_refusal`,
`cross_tenant_refused`, `unknown_assertion`,
`tenant_resolution_failed`, `frame_unsupported`.

**Receipt vocabulary used by S4.** Surface 4 does not emit
receipt categories itself; it gates whether provenance is
visible. The parent assertion's category in S1 / S3 governs the
operator view.

### Surface 5 — Audit-chain lookup

**Inspect.** `handleAuditChainLookup` returns one of three
outcomes: `verified` (with the wedge's `AuditEvent[]` and
`chain_status: 'ok'`), `broken` (with events up to the break,
`break_index`, and wedge-derived `break_reason`), or `refused`
(with typed reason).

**Relay.** Dixie relays the wedge's `AuditEvent[]` verbatim.
Dixie relays `break_index` and `break_reason` verbatim on a
broken chain — Dixie never hides a break.

**Render.** Dixie renders the per-estate chain in order. On
break, Dixie renders the break index and reason prominently so
an auditor can reconcile. Dixie relays the wedge's
`verifyChain` outcome unchanged.

**Must not invent.** Dixie must not run `verifyChain` itself;
must not hide a chain break; must not synthesise missing events;
must not rename `AuditEvent` to a Hounfour-side adjacent name
(`audit-trail-entry` / `domain-event`) — ADR-022E gate #5
unchanged.

**Typed refusals carried.** `cross_tenant_refused`,
`unknown_estate`, `tenant_resolution_failed`.

**Receipt vocabulary used by S5.** S5 surfaces audit events,
not receipt categories. The relationship to receipt categories
flows through the events the wedge wrote at recall time.

### Surface 6 — Estate summary display

**Inspect.** `handleEstateSummary` returns `{ outcome:
'summarized', actor_id, estate_id, counts }` or `{ outcome:
'refused', reason }`. Per Phase 24C deviation #3, the response
includes both the spec 2-key `by_privacy_scope`
(`actor_private` / `public_discord`) AND a raw 4-key
`_widened_privacy_scope` map (`public` / `tenant` /
`actor_private` / `sealed`) for trace.

**Relay.** Dixie relays `by_class`, `by_status`,
`by_privacy_scope` (the 2-key spec shape with frame discipline
applied — zero `actor_private` under `public_discord` caller
frame), `by_risk_level`, and `_widened_privacy_scope` (the
raw 4-key map; no frame discipline) verbatim.

**Render.** Dixie renders the operator-facing summary using the
2-key `by_privacy_scope`. The 4-key `_widened_privacy_scope` is
trace / debug data; Dixie surfaces it under a debug detail
level or correlation tool, not as the operator default. Per
Phase 24D concern 3, Dixie MAY inject an `IntakeDenyLog`
dependency on this surface so cross-tenant target refusals
append an intake-deny entry on the caller's tenant matching the
Surface 1 / 2 / 4 audit-trail discipline.

**Must not invent.** Dixie must not collapse the 4-key map back
into the 2-key shape with its own projection (the host's
projection is authoritative: `public + tenant → public_discord`,
`actor_private + sealed → actor_private`); must not surface
`actor_private` counts in `by_privacy_scope` under
`public_discord` caller frame (the host's frame discipline is
authoritative); must not widen the 2-key shape into the 4-key
shape for an operator render — `_widened_privacy_scope` is
trace data, not operator content.

**Typed refusals carried.** `cross_tenant_refused`,
`unknown_estate`, `privacy_scope_refusal`,
`tenant_resolution_failed`.

**Receipt vocabulary used by S6.** Counts use `AssertionStatus`
and `PrivacyScope` enums from the wedge public API. The six
receipt categories appear via `by_status` indirectly (status
includes `active` / `challenged` / `revoked` / etc.); S6 does
not project status into receipt categories.

## Per-surface handler mapping

| Surface | Handler export | Module path | Dependency interface |
|---|---|---|---|
| S1 — Recall intake / response | `handleRecallIntake` | [`../../src/straylight/host/intake.ts`](../../src/straylight/host/intake.ts) | `IntakeDeps` |
| S2 — Receipt retrieval / display | `handleReceiptRetrieval` | [`../../src/straylight/host/receipt.ts`](../../src/straylight/host/receipt.ts) | `ReceiptDeps` |
| S3 — Excluded-assertion reason display | `handleExclusionDisplay` | [`../../src/straylight/host/exclusion.ts`](../../src/straylight/host/exclusion.ts) | (pure render; no dep struct) |
| S4 — Provenance inspection | `handleProvenanceWalk` | [`../../src/straylight/host/provenance.ts`](../../src/straylight/host/provenance.ts) | `ProvenanceDeps` |
| S5 — Audit-chain lookup | `handleAuditChainLookup` | [`../../src/straylight/host/audit-lookup.ts`](../../src/straylight/host/audit-lookup.ts) | `AuditLookupDeps` |
| S6 — Estate summary display | `handleEstateSummary` | [`../../src/straylight/host/estate-summary.ts`](../../src/straylight/host/estate-summary.ts) | `EstateSummaryDeps` (Phase 24D adds optional `intakeLog?: IntakeDenyLog`) |

All six handlers are exported from the local barrel
[`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
The barrel is **NOT** re-exported through the wedge public API
([`../../src/straylight/index.ts`](../../src/straylight/index.ts));
Dixie consumers must import the host barrel directly. The wedge
does not import the host scaffold (one-way dependency).

## Injected dependency requirements

Dixie's host integration MUST inject the following dependencies
explicitly. The host scaffold ships no production defaults for
the contracts that govern cross-tenant decisions.

- **`TenantResolver` (required, no production default).**
  Defined in
  [`../../src/straylight/host/tenancy.ts`](../../src/straylight/host/tenancy.ts).
  Every surface that makes a cross-tenant decision (S1, S2, S4,
  S5, S6) requires a caller-supplied resolver. Per Phase 24D
  concern 1, an empty `callerTenant` is refused **before** the
  resolver is consulted, and an empty resolver result is treated
  identically to `undefined`. Both paths emit
  `tenant_unresolved` (surfaced at the host as
  `tenant_resolution_failed`). Dixie MUST inject a resolver that
  derives tenant from authenticated session context — not from
  request body content.
- **`IntakeDenyLog` (required on S1, S2, S4; optional on S6).**
  Defined in
  [`../../src/straylight/host/intake-log.ts`](../../src/straylight/host/intake-log.ts).
  Surfaces 1, 2, and 4 always append a host-side intake-deny
  entry on cross-tenant refusal (scoped to the caller's tenant
  per host invariant #5; cross-tenant chain links forbidden).
  Surface 6 gained an optional `intakeLog?: IntakeDenyLog`
  dependency in Phase 24D (concern 3); when provided, S6 matches
  the S1 / S2 / S4 audit-trail discipline. Dixie SHOULD inject
  the same log instance across all four surfaces so an auditor
  can correlate refusals per tenant.
- **`AuditLog` (wedge public surface — read by host, not
  redefined by Dixie).** Exported from
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
  S5 reads through this via the host's `AuditLookupDeps`; Dixie
  does not instantiate its own audit log and does not run
  `verifyChain` directly. Dixie passes the wedge's `AuditLog`
  reference into the host handler and renders the handler's
  outcome.
- **`EstateStore` (wedge public surface — read by host, not
  redefined by Dixie).** Exported from
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
  S1, S2, S4, S5, S6 read estate state through this via their
  respective deps. Dixie does not instantiate its own estate
  store.
- **`StorageAdapter` (wedge public surface — read by host, not
  redefined by Dixie).** Defined under
  [`../../src/straylight/storage`](../../src/straylight/storage)
  and re-exported through
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
  S2 reads persisted receipts through this. Dixie does not
  invent receipt persistence and does not bypass the wedge's
  storage discipline.

## Phase 24C intentional deviations (restated for Dixie readers)

The Phase 24C scaffold ships three intentional deviations from
the Phase 24B per-surface MVP host contract. Each deviation is
forced by the constraint "host does not synthesize" plus the
wedge's actual output shape. Dixie's render layer MUST honor all
three.

1. **No synthesised receipt on Surface 1 deny / `needs_review`.**
   The wedge does not emit a `RecallReceipt` on recall denial —
   only an `AuditEvent` with `transition_denied` payload
   `kind: 'recall_denied'`. The Phase 24C `RecallIntakeResponse`
   shape surfaces `audit_event_id`, classified `DeniedReason`,
   and verbatim `raw_reasons[]` instead. Dixie's render layer
   MUST NOT synthesise a receipt to fill the slot; it MUST
   surface the audit-event reference and reason classification.
   `needs_review` follows the same discipline — the wedge has
   not yet emitted a final receipt; Dixie surfaces the queue
   handle and the wedge's audit event.

2. **Aggregate-by-reason on Surface 3 `excluded` / `redacted`.**
   The wedge's `RecallPack.excluded_summary[]` and `redacted[]`
   are aggregate counts keyed by reason — not per-assertion.
   The Phase 24C `ExclusionDisplayResponse` preserves that shape
   as `excluded_aggregates[]` and `redacted_aggregates[]`.
   Per-assertion granularity exists only on `marked[]`, which
   the wedge does carry per-assertion. Dixie's render layer
   MUST NOT recompute `dispositionFor` to manufacture
   per-assertion granularity on aggregates; it MUST render the
   counts the wedge produced.

3. **`_widened_privacy_scope` 4-key trace map on Surface 6.**
   The Phase 24C `EstateSummaryResponse` surfaces both the
   Phase 24B spec 2-key `by_privacy_scope` (with frame
   discipline applied — zero `actor_private` under
   `public_discord`) AND a raw 4-key `_widened_privacy_scope`
   map (`public` / `tenant` / `actor_private` / `sealed`; no
   frame discipline). Dixie's operator-default render uses the
   2-key shape; the 4-key map is trace data for debug
   correlation. Dixie MUST NOT promote the 4-key map into the
   operator default and MUST NOT re-project the 4-key map with
   its own scheme.

## Phase 24D hardening implications (restated for Dixie readers)

Phase 24D pinned six concerns into the existing scaffold. Each
has a direct implication for Dixie's render and integration
layer.

1. **Empty tenant fail-closed.** `checkSameTenant` refuses an
   empty `callerTenant` **before** invoking the resolver and
   refuses an empty resolver result identically to `undefined`.
   Dixie's resolver MUST NOT return `""` as a "default tenant"
   sentinel; the host treats empty identically to "unresolved"
   and surfaces `tenant_resolution_failed`.

2. **Tenant-scoped parent provenance refuses under
   `public_discord`.** Surface 4 refuses with
   `privacy_scope_refusal` when the parent assertion's
   `privacy_scope` is `tenant` AND the caller's `frame` is
   `public_discord`. This aligns the host's S4 with the wedge's
   Surface 1 `privacy_tenant_in_public_frame` redaction. Dixie
   MUST surface the refusal; MUST NOT fall back to a redacted
   walk; MUST NOT widen the `actor_private` permit into other
   frames without a host-layer widening event.

3. **Optional Surface 6 intake-deny logging.** S6's
   `EstateSummaryDeps` gained optional `intakeLog?:
   IntakeDenyLog`. When provided, cross-tenant target refusals
   append an entry on the caller's tenant with `reason:
   'cross_tenant_estate_summary'` (or
   `'tenant_resolution_failed'` for the unresolved branch).
   Dixie SHOULD inject the same log instance used on S1 / S2 /
   S4 to give an auditor a complete per-tenant trail across all
   four refusing surfaces. When omitted, S6 still refuses cleanly
   under the existing `{ outcome: 'refused', reason:
   'cross_tenant_refused' }` shape — backward-compatible.

4. **`needs_review` is not a denial path.** Surface 1's
   `needs_review` outcome writes **no** intake-deny log entry.
   Dixie's render and audit layers MUST NOT classify
   `needs_review` as a denial; the wedge's audit chain records
   the review-queue routing event independently. If a human
   reviewer later denies the queued request, the denial event
   lives in the wedge's audit chain — not in the host's
   intake-deny log.

5. **Unknown wedge exclusion reason maps to safe-default
   `excluded` with verbatim `raw_reason`.** `classifyExclusionReason`
   maps any wedge exclusion reason it does not recognise to the
   `excluded` bucket and preserves the verbatim wedge string in
   `raw_reason`. Dixie MUST NOT promote an unknown reason into a
   narrower category (`revoked` / `challenged`); the host's
   classification is authoritative. A future wedge release that
   introduces a new exclusion-reason string without a
   corresponding host classifier prefix is a wedge-side oversight
   that surfaces here as a missing prefix match, never as silent
   absorption into a neighbouring category.

6. **Tightened Surface 2 receipt-not-found assertion.** Per
   Phase 24D concern 6, the Phase 24C test for unknown receipt
   id under a cleanly-resolving caller tenant now expects exactly
   `unknown_receipt_id`. Dixie MUST NOT infer tenant identity
   from a missing record. The receipt is missing; the resolver
   resolved; the answer is the typed `unknown_receipt_id`
   refusal.

## Vector mapping (re-pinned)

Phase 24E does not change the vector matrix. Restated narrowly
for the Dixie reader:

| Vector | Status | Where exercised at the host inspection layer |
|---|---|---|
| 1 — included | In slice | [`../../tests/phase-24c-host-vectors-1-to-3.test.ts`](../../tests/phase-24c-host-vectors-1-to-3.test.ts) |
| 2 — class-filter excluded | In slice | [`../../tests/phase-24c-host-vectors-1-to-3.test.ts`](../../tests/phase-24c-host-vectors-1-to-3.test.ts) |
| 3 — privacy redacted/excluded in served frame | In slice | [`../../tests/phase-24c-host-vectors-1-to-3.test.ts`](../../tests/phase-24c-host-vectors-1-to-3.test.ts) |
| 4 — contested marked | In slice | [`../../tests/phase-24c-host-vectors-4-to-6.test.ts`](../../tests/phase-24c-host-vectors-4-to-6.test.ts) |
| 5 — revoked excluded | In slice | [`../../tests/phase-24c-host-vectors-4-to-6.test.ts`](../../tests/phase-24c-host-vectors-4-to-6.test.ts) |
| 6 — forgotten excluded but auditable | In slice | [`../../tests/phase-24c-host-vectors-4-to-6.test.ts`](../../tests/phase-24c-host-vectors-4-to-6.test.ts) |
| 7 — cross-tenant recall refused | In slice | [`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts) + [`../../tests/phase-24c-host-intake-log.test.ts`](../../tests/phase-24c-host-intake-log.test.ts) |
| 8 — denied private in public frame | In slice | [`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts) |
| 9 — signer not competent | **Not in slice** — cross-reference only via existing [`../../tests/signer-fail-closed.test.ts`](../../tests/signer-fail-closed.test.ts) | — |
| 10 — `EstateTransition` on the wire | **Gate** (ADR-022E gate #1) | Not exercised |
| 11 — `safeCanonicalize` on the wire | **Gate** (ADR-022E gate #2) | Not exercised |

Dixie MUST NOT widen this scope. A Dixie-side proposal that
exercises vector 9 / 10 / 11 at the host inspection layer is a
**non-go condition** under ADR-024E §"The next implementation
branch" §5 and must be refused on cite by reviewers.

## Validation evidence

```bash
npm run typecheck    # clean
npm test             # 33 files / 728 tests passed
npx vitest run tests/phase-24c-host-surface-shape.test.ts \
                tests/phase-24c-host-vectors-1-to-3.test.ts \
                tests/phase-24c-host-vectors-4-to-6.test.ts \
                tests/phase-24c-host-vectors-7-to-8.test.ts \
                tests/phase-24c-host-fail-closed.test.ts \
                tests/phase-24c-host-intake-log.test.ts \
                tests/phase-24d-host-hardening.test.ts
# Phase 24C + Phase 24D host suite: 63 tests passed
npx vitest run tests/phase-5-hardening.test.ts \
                tests/phase-20b-recall-wedge-local-scaffold.test.ts \
                tests/storage-conformance.test.ts \
                tests/dixie-governed-recall-handoff.test.ts
# Regression subset: 107 tests passed
```

Phase 24E adds no source, no test, no fixture, no script, no
package change. Every validation command above is expected to
produce identical output to the Phase 24D post-merge baseline by
construction. Pre-existing tests preserved unchanged: Phase 4
demo, Phase 5 hardening, Phase 20B local scaffold, Phase 20C
demo evidence, storage conformance, dixie-governed-recall
handoff, Phase 17B / 18 / 21A shadow-integration, Phase 19A
review-packet pin, all Phase 24C / 24D host tests, all wedge
unit tests.

## Dixie-side supplemental acceptance criteria (Phase 24E)

The Phase 12 `dixie-governed-recall-issue.md` §"Acceptance
criteria" list remains the canonical acceptance pin for the
eventual `loa-dixie` PR. Phase 24E does **not** rewrite that
list. The supplemental criteria below extend the Phase 12 list
to reflect the Phase 24C/24D scaffold reality; they are
intentionally listed here (and re-cited in the appended
Phase 24E refresh of `dixie-governed-recall-issue.md`) so a
reviewer can cite them against a future Dixie-side PR.

1. **Dixie consumes host-handler outputs; Dixie does not produce
   `RecallPack` or `RecallReceipt`.** Every Dixie-side render
   path on S1 / S2 / S3 / S4 / S5 / S6 takes the corresponding
   Phase 24C handler's return value as input. No Dixie code
   instantiates `RecallPack` or `RecallReceipt`.
2. **Dixie does not compute `dispositionFor`.** The wedge's
   `dispositionFor` / `privacyDispositionForFrame` output flows
   through the pack and through Surface 3's classification.
   Dixie renders; Dixie does not re-derive.
3. **Dixie does not reinterpret `privacy_scope`.** The wedge's
   four-value `PrivacyScope` enum is authoritative. Surface 6's
   projection to the spec 2-key shape is host-applied; Dixie's
   operator render uses the host's projection unchanged.
4. **Dixie does not run `verifyChain`.** Surface 5's
   `handleAuditChainLookup` invokes the wedge's `verifyChain`
   through `AuditLookupDeps`; Dixie relays the outcome
   (`verified` / `broken` with `break_index` + `break_reason` /
   `refused`). Dixie does not re-verify and does not hide a
   break.
5. **Dixie injects tenant resolution explicitly; Dixie does not
   infer production tenant scope silently.** A Dixie integration
   that ships a "default tenant" fallback resolver is a
   non-conforming integration. Resolver returns `undefined` or
   `""` → host emits `tenant_resolution_failed` → Dixie surfaces
   the refusal verbatim.
6. **Dixie surfaces typed refusals verbatim.** Every typed
   refusal the host emits (`cross_tenant_recall_refused`,
   `privacy_scope_refusal`, `tenant_resolution_failed`,
   `frame_unsupported`, `storage_unavailable`,
   `unknown_receipt_id`, `unknown_assertion`, `unknown_estate`,
   `outcome: 'broken'` with `break_index`) is surfaced by Dixie
   verbatim. Dixie does not rewrite a refusal as a soft warning
   and does not invent permissive defaults.
7. **Dixie does not widen vector scope beyond Phase 24B.**
   Vectors 1–8 in slice; vector 9 cross-reference only; vectors
   10–11 remain ADR-022E gates. A Dixie-side test or feature
   that exercises vector 9 / 10 / 11 at the host inspection
   layer is rejected on cite.
8. **Dixie does not adopt Hounfour `#116` output directly.**
   No `0xhoneyjar:straylight:*` adoption into Dixie's audit-event
   surface on the strength of `#116` alone; no `recall-wedge`
   conformance-category adoption into Dixie's test suite; no
   Hounfour five-step corpus import; no Hounfour `main`
   consumption. Adoption follows ADR-024C's Event A + Event B +
   Event C discipline and a separate Dixie-side ADR.

## Open questions / follow-ups (not blocking Phase 24E)

1. **Phase 24F demo-evidence packet (anticipated, not
   authored).** Phase 24C's "Open questions / followups" §3
   defers a wedge-runtime-style demo-evidence packet for the
   host (analogous to
   [`./phase-20c-recall-wedge-demo-evidence.md`](./phase-20c-recall-wedge-demo-evidence.md))
   to a later phase. A future Phase 24F MAY produce that demo
   evidence — walking vectors 1–8 end-to-end against the wedge
   runtime and capturing the host's rendered output. Phase 24E
   does NOT author any demo evidence and does NOT add the
   supporting scripts / fixtures. Anticipate-but-do-not-author.
2. **Dixie-side review-queue semantics for `needs_review`.**
   Phase 24C's `review_queue_id` is a deterministic placeholder
   (content-addressed from `recall_request_id` + `now`). The
   actual review-queue management surface — operator inbox,
   approval action, denial action with corresponding audit
   event, escalation policy — is **future work**. The most
   plausible host for that surface is a Dixie operator console
   or Finn under a later runtime-tool-call host-placement ADR.
   Phase 24E does NOT pin a host placement for the review queue.
3. **`HostFrame` widening.** The host's two-value `HostFrame`
   (`actor_private` / `public_discord`) is narrower than the
   wedge's seven-value `EnvironmentFrame`. A future phase MAY
   widen the host envelope under a separate spec; today the
   narrower enum is what
   [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
   pins. If the wedge widens its privacy-frame discipline (e.g.,
   to `private_admin` or a new frame), the host MUST widen S4's
   matching refusal in lock-step.
4. **Hounfour `#70` / Phase 19A feedback gate.** Remains
   **pending** and is **not** advanced by Phase 24E. ADR-024D
   §3.b explicitly allows Phase 24B / 24C / 24D / 24E to proceed
   under the "local additive scaffolding only" rule without
   satisfying the gate; advancing the gate is a separate,
   sibling-repo, human-reviewed event.
5. **No host placement for the Hounfour-side adoption event.**
   If / when a Hounfour GitHub Packages release publishes the
   `#116` outputs (Event A under ADR-024C), the adoption ADR
   (Event B) and the shadow-integration check (Event C) are
   separate, future, sibling-repo / Straylight-side events.
   Phase 24E pre-authorises none of them.

## Explicit non-scope (Phase 24E)

- **No source changes.** Wedge public surface unchanged; host
  scaffold unchanged; no new module under
  [`../../src/straylight/`](../../src/straylight/).
- **No tests.** No new test, no modification to any existing
  test.
- **No fixtures.** No new fixture, no modification to any
  existing fixture under
  [`../../fixtures/`](../../fixtures/).
- **No package changes.** `package.json` /
  `package-lock.json` unchanged. Hounfour stays
  `@0xhoneyjar/loa-hounfour@^8.6.0`, resolved patch `8.6.0`.
- **No scripts.** No new script under
  [`../../scripts/`](../../scripts/); no new `package.json`
  script.
- **No endpoints.** No HTTP / NATS / REST / Discord / Telegram
  surface added in `loa-straylight`. The host barrel remains
  intentionally NOT re-exported through the wedge public API.
- **No sibling-repo edits.** Not `loa-hounfour`, not
  `loa-finn`, not `loa-dixie`, not `loa-freeside`. No GitHub
  issue / comment / PR opened by Phase 24E.
- **No Hounfour `#116` adoption.** No five-step conformance
  corpus import, no `0xhoneyjar:straylight:*` prefix family
  adoption, no `recall-wedge` category adoption, no Hounfour
  `main` / commit-SHA / git-source consumption, no Hounfour
  dependency-range bump.
- **No public commitment roots.** ADR-020E unchanged.
- **No advance of any ADR-022E gate.** `EstateTransition` (#1),
  `safeCanonicalize` (#2), `Challenge` re-export (#4),
  `AuditEvent` rename (#5) all unchanged.
- **No new ADR.** Phase 24E operates under the existing
  ADR-024A / ADR-024B / ADR-024C / ADR-024D / ADR-024E
  decision-lock series.
- **No `.loa/` / `.loa.config.yaml` / `.claude/` / `.beads/` /
  `.run/` / `.github/` / `grimoires/loa/a2a/` edits.**
- **No commit, no push, no PR.** Phase 24E is local docs.

## Cross-references

- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — per-surface MVP host contract (unchanged by Phase 24E).
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — vector matrix at the host inspection layer (unchanged by
  Phase 24E).
- [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)
  — Phase 24D summary handoff (unchanged by Phase 24E).
- [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)
  — Phase 24C summary handoff (unchanged by Phase 24E).
- [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)
  — Phase 24B summary handoff (unchanged by Phase 24E).
- [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary handoff (unchanged by Phase 24E).
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — the Phase 24B decision-lock Phase 24E operates under
  (unchanged).
- [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md)
  through
  [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — Phase 24A decision-lock series (unchanged).
- [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  (Phase 24E refresh appended).
- [`./dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  (Phase 24E refresh appended).
- [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md)
  (Phase 24E refresh appended).
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  — canonical host barrel (post-PR-30 snapshot; not re-exported
  through the wedge public API).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge public surface (unchanged by Phase 24C / 24D / 24E).
- [`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts),
  [`../../tests/phase-24c-host-vectors-1-to-3.test.ts`](../../tests/phase-24c-host-vectors-1-to-3.test.ts),
  [`../../tests/phase-24c-host-vectors-4-to-6.test.ts`](../../tests/phase-24c-host-vectors-4-to-6.test.ts),
  [`../../tests/phase-24c-host-vectors-7-to-8.test.ts`](../../tests/phase-24c-host-vectors-7-to-8.test.ts),
  [`../../tests/phase-24c-host-fail-closed.test.ts`](../../tests/phase-24c-host-fail-closed.test.ts),
  [`../../tests/phase-24c-host-intake-log.test.ts`](../../tests/phase-24c-host-intake-log.test.ts),
  [`../../tests/phase-24d-host-hardening.test.ts`](../../tests/phase-24d-host-hardening.test.ts)
  — the Phase 24C + Phase 24D host suite (63 tests passed;
  unchanged by Phase 24E).
