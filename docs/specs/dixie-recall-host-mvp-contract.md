# Dixie recall-host MVP contract — Phase 24B docs/spec lock

> Status: Phase 24B. **Docs/spec-only host-contract lock, in
> `loa-straylight`.** This document is the per-surface MVP host
> contract Phase 24B locks for the Dixie-first Straylight Recall
> Wedge MVP host. It does **not** author any TypeBox / JSON
> Schema, does **not** declare any `$id`, does **not** generate a
> validator, does **not** wire a Dixie endpoint, does **not**
> change `package.json` / `package-lock.json`, does **not** flip
> a wedge import, does **not** edit any sibling repo, and does
> **not** advance any ADR-022E gate. The host shapes below are
> **TypeScript-style sketches**, not schemas — they pin the wire
> shape the wedge already produces (and the host will eventually
> inspect) under the Phase 5 / Phase 20B / Phase 20C invariants
> the wedge already enforces.
>
> Companion docs:
> [`./dixie-recall-host-validation-vectors.md`](./dixie-recall-host-validation-vectors.md),
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md),
> [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md),
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md),
> [`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md),
> [`./recall-wedge-schema-contract.md`](./recall-wedge-schema-contract.md),
> [`./recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md),
> [`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md),
> [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md),
> [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md),
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md),
> [`../mvp/threat-model.md`](../mvp/threat-model.md).

## What this spec is

The Phase 24B MVP host plan (per ADR-024B and ADR-024E) is
**Dixie-first, recall-pack-inspection-first**. The minimum
non-trivial slice the host exercises is **recall-pack inspection
/ provenance walk / receipt display** — *not* generic retrieval.
The host inspects, relays, and renders the wedge's existing
recall output under the wedge's existing fail-closed discipline;
it does not produce that output.

This spec docs-locks the six in-slice host surfaces, the wedge
primitives each surface depends on, the request and response
shape of each surface, the fail-closed posture each surface
inherits, and the per-surface Phase-24A non-scope each surface
preserves. It is the docs-side target a future
`phase-24c-dixie-recall-host-scaffold` branch (per ADR-024E §"The
next implementation branch") scaffolds against.

This spec is **not** a schema. No `$id` is declared. No TypeBox
type is exported. No validator is generated. Per ADR-020C /
ADR-022C / ADR-024A, the wedge owns the local contract; if a
Hounfour-side adoption ever fires, it is a separate ADR plus a
separate sibling-repo PR — not this spec, and not Phase 24B.

## Status taxonomy

Identical to the Phase 23A schema-contract draft
([`./recall-wedge-schema-contract.md`](./recall-wedge-schema-contract.md)),
restated here so this doc is readable standalone:

| Status | Meaning |
|---|---|
| **safe draft** | The surface inspects a wedge-owned primitive with a stable local contract. `phase-24c-*` can scaffold the host shape against the wedge's existing public-API output. |
| **blocked** | The surface would require either `EstateTransition` on the wire or `safeCanonicalize` on the wire to operate. Phase 24B does **not** lock such a surface. |
| **deferred** | The surface is an explicit ADR-022E gate (`Challenge` re-export, `AuditEvent` rename, public commitment root). Phase 24B does **not** lock such a surface. |

The six MVP surfaces below are **all "safe draft"** under this
taxonomy. The host plan does **not** lock any "blocked" or
"deferred" surface — those are not part of the Phase 24B MVP.

## Host invariants (preserved by every surface)

1. **Wedge produces, host inspects.** Every surface output is
   either the wedge's verbatim output, a render of the wedge's
   output, or a walk over the wedge's output. The host does not
   produce a `RecallPack`, a `RecallReceipt`, a
   `dispositionFor`, a `verifyChain`, or a commitment root.
2. **Fail-closed inherited from the wedge.** Every surface
   refuses on storage unavailability, signer-competence failure,
   verifier failure, policy-unavailable, or audit-chain break.
   The host does **not** invent a permissive default. If the
   wedge returns `recall_denied`, the host displays the denial;
   it does not retry under a permissive path.
3. **Privacy-scope is a wedge-side property.** `actor_private`
   provenance does **not** travel to `public_discord`. The host
   relays the wedge's `privacy_scope` discipline; it does not
   reinterpret it.
4. **`detail_level` discipline is wedge-applied.** The wedge
   applies detail-level redaction *before* the host serves the
   output. The host respects the requested level (`minimal` /
   `standard` / `debug`) but does not invent additional
   redaction.
5. **Cross-tenant boundary at intake.** The host enforces the
   tenant boundary at every surface's intake; the wedge / a
   future runtime collaborator enforce it as the second line of
   defense. Cross-tenant chain links are forbidden — the audit
   chain is per-estate.
6. **Receipt-or-audit completeness.** Every server-side decision
   the host surfaces is backed by either a wedge `RecallReceipt`
   or a wedge `AuditEvent`. The host does **not** display a
   decision lacking both. This is the ADR-020D / ADR-022D pin
   that Phase 5 hardening
   ([`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts))
   enforces.
7. **No host-side schema authority.** The host inspects shapes;
   it does **not** validate Hounfour-side schemas. Class
   validation lives in the wedge (and, after a future adoption
   ADR, in Hounfour). The host does not collapse class-vs-policy
   per [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md).

## Surface 1 — Recall intake & response

**Purpose.** The operator submits a `RecallRequest`; the host
relays it to the wedge runtime; the host renders the returned
`RecallPack` + `RecallReceipt`.

**Wedge primitives inspected.** `RecallRequest`, `RecallPack`,
`RecallReceipt`, `PolicyDecision` (wedge-private, surfaced only
as decision summary).

**Status.** safe draft.

**Request shape (host inbound).**

```ts
type RecallIntakeRequest = {
  request: RecallRequest;          // wedge-owned shape; the host does not invent fields
  detail_level: 'minimal' | 'standard' | 'debug';
  caller: {
    tenant_id: string;             // host-enforced cross-tenant boundary
    actor_id: string;              // must scope into request.actor_id's tenant
    session_id?: string;           // optional caller-session correlator
  };
};
```

**Response shape (host outbound).**

```ts
type RecallIntakeResponse =
  | {
      outcome: 'served';
      pack: RecallPack;            // wedge output, verbatim
      receipt: RecallReceipt;      // wedge output, verbatim
    }
  | {
      outcome: 'denied';
      receipt: RecallReceipt;      // RecallReceipt with category 'blocked-by-policy' | 'redacted' | 'excluded' | 'challenged' | 'revoked'
      reason: string;              // wedge-derived; never host-invented
    }
  | {
      outcome: 'needs_review';
      receipt: RecallReceipt;      // RecallReceipt that records the needs_review decision
      review_queue_id: string;     // host-issued review queue handle
    };
```

**Fail-closed posture.**

- Storage refusal on receipt persistence → host refuses; never
  serves the pack without the receipt persisted by the wedge.
- Signer competence failure on `request.signer` envelope → host
  refuses with `outcome: 'denied'` keyed to the wedge's
  `signer_not_competent` reason.
- Policy-unavailable → host refuses with `outcome: 'denied'`
  keyed to the wedge's `policy_unavailable` reason; never
  permissive.
- Cross-tenant boundary violation → host refuses at intake with
  `outcome: 'denied'` keyed to `cross_tenant_recall_refused`;
  the host emits an intake-deny audit log entry referencing the
  wedge's `recall_denied` event.

**Phase 24A non-scope preserved.**

- No `executeRecall` runs at the host. The host calls the
  wedge's existing recall pipeline; it does not bypass policy
  validation.
- No `EstateTransition` on the wire. ADR-022E gate #1 unchanged.
- No `safeCanonicalize` on the wire. ADR-022E gate #2 unchanged.
  The wedge canonicalizes the pack before the host serves it.
- No `Challenge` surfaced at the host. ADR-022E gate #4
  unchanged.
- No `0xhoneyjar:straylight:*` audit-event prefix family
  adoption. ADR-024A unchanged.

## Surface 2 — Receipt retrieval & display

**Purpose.** Given a `receipt_id`, the host retrieves the
persisted `RecallReceipt` (via the wedge's storage adapter) and
renders it under the requested `detail_level`.

**Wedge primitives inspected.** `RecallReceipt`, the wedge's
storage adapter contract
([`../../tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts)).

**Status.** safe draft.

**Request shape.**

```ts
type ReceiptRetrievalRequest = {
  receipt_id: string;              // wedge-issued, content-addressed
  detail_level: 'minimal' | 'standard' | 'debug';
  caller: { tenant_id: string; actor_id: string; session_id?: string };
};
```

**Response shape.**

```ts
type ReceiptRetrievalResponse =
  | { outcome: 'found'; receipt: RecallReceipt }       // wedge output, verbatim
  | { outcome: 'not_found'; reason: 'unknown_receipt_id' | 'cross_tenant_refused' };
```

**Fail-closed posture.**

- Storage unavailable → host refuses with `outcome: 'not_found'`
  keyed to a generic reason; never invents receipt content.
- Cross-tenant lookup attempted → host refuses with
  `cross_tenant_refused`; emits an intake-deny audit log entry.
- `detail_level: 'debug'` requested by a caller whose session
  context does not allow debug-detail → host downgrades to
  `standard`; the wedge's redaction discipline already applies.

**Phase 24A non-scope preserved.** Identical to Surface 1.

## Surface 3 — Excluded-assertion reason display

**Purpose.** For a served `RecallPack`, the host renders the
`excluded_summary[]` (and `redacted[]`, where present) walks.
Reasons are derived from the wedge's `dispositionFor` /
`privacyDispositionForFrame` output; the host does not invent
reasons.

**Wedge primitives inspected.** `RecallPack.excluded_summary[]`,
`RecallPack.redacted[]`, `Assertion`, `AssertionStatus`, the
wedge's `dispositionFor` output (surfaced via the pack — not
recomputed at the host).

**Status.** safe draft.

**Request shape.**

```ts
type ExclusionDisplayRequest = {
  pack: RecallPack;                // wedge output, verbatim
  detail_level: 'minimal' | 'standard' | 'debug';
  caller: { tenant_id: string; actor_id: string; session_id?: string };
};
```

**Response shape.**

```ts
type ExclusionDisplayResponse = {
  excluded: Array<{
    assertion_id: string;
    class: string;                 // wedge-derived
    reason: ExclusionReason;       // wedge-derived; one of the six receipt categories below
  }>;
  redacted: Array<{
    assertion_id: string;
    redaction_reason: string;      // wedge-derived
  }>;
};

type ExclusionReason =
  | 'included'                     // not actually excluded; informational
  | 'excluded'                     // class-allowed but policy-excluded
  | 'redacted'                     // privacy-redacted for the served frame
  | 'challenged'                   // marked under contested status
  | 'revoked'                      // upstream revoked
  | 'blocked-by-policy';           // policy-lane deny
```

**Fail-closed posture.**

- The host does **not** display a reason that is not present in
  the pack. If a reason is missing, the host displays the wedge's
  generic `reason_unavailable` placeholder; the wedge's
  `dispositionFor` is authoritative.
- The host preserves the six-receipt-category pin
  ([`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)).

**Phase 24A non-scope preserved.** Identical to Surface 1.

## Surface 4 — Provenance inspection

**Purpose.** Given an `assertion_id`, the host walks
`Assertion.provenance[]` under the parent assertion's
`privacy_scope`. `actor_private` provenance does **not** travel
to `public_discord`.

**Wedge primitives inspected.** `Assertion`, `Assertion.provenance[]`,
`Assertion.privacy_scope`.

**Status.** safe draft.

**Request shape.**

```ts
type ProvenanceWalkRequest = {
  assertion_id: string;
  detail_level: 'minimal' | 'standard' | 'debug';
  caller: { tenant_id: string; actor_id: string; session_id?: string; frame: 'actor_private' | 'public_discord' };
};
```

**Response shape.**

```ts
type ProvenanceWalkResponse =
  | {
      outcome: 'walked';
      provenance: Array<{
        actor_id: string;
        ts: string;
        kind: string;              // wedge-derived provenance kind
        evidence_ref?: string;
      }>;
    }
  | {
      outcome: 'refused';
      reason: 'privacy_scope_refusal' | 'cross_tenant_refused' | 'unknown_assertion';
    };
```

**Fail-closed posture.**

- `actor_private` provenance + `public_discord` frame → host
  refuses with `privacy_scope_refusal`. The wedge's privacy-scope
  discipline is authoritative.
- Cross-tenant walk attempted → host refuses with
  `cross_tenant_refused`.
- Unknown `assertion_id` → host refuses with `unknown_assertion`;
  never invents a provenance record.

**Phase 24A non-scope preserved.** Identical to Surface 1.

## Surface 5 — Audit-chain lookup

**Purpose.** Given an `estate_id`, the host retrieves the
per-estate `AuditEvent[]` and the `verifyChain` result. On
break, the host surfaces the break index and reason.

**Wedge primitives inspected.** `AuditEvent` (wedge-private —
the host inspects via the wedge's stable public API surface, not
via a Hounfour-side adjacent name), `verifyChain`.

**Status.** safe draft.

**Request shape.**

```ts
type AuditChainLookupRequest = {
  estate_id: string;
  detail_level: 'minimal' | 'standard' | 'debug';
  caller: { tenant_id: string; actor_id: string; session_id?: string };
};
```

**Response shape.**

```ts
type AuditChainLookupResponse =
  | {
      outcome: 'verified';
      events: AuditEvent[];        // wedge output, verbatim
      chain_status: 'ok';
    }
  | {
      outcome: 'broken';
      events: AuditEvent[];        // wedge output up to the break
      chain_status: 'broken';
      break_index: number;
      break_reason: string;        // wedge-derived
    }
  | {
      outcome: 'refused';
      reason: 'cross_tenant_refused' | 'unknown_estate';
    };
```

**Fail-closed posture.**

- Chain break → host surfaces the break index and reason; never
  hides the break.
- Cross-tenant lookup → host refuses with `cross_tenant_refused`.
- Unknown `estate_id` → host refuses with `unknown_estate`.

**Phase 24A non-scope preserved.**

- The `AuditEvent` shape is the wedge's, not a rename of the
  Hounfour-side `audit-trail-entry` / `domain-event` adjacent
  schemas. ADR-022E gate #5 unchanged.
- The `0xhoneyjar:straylight:*` audit-event prefix family
  registered upstream by #116 is **not** adopted into the
  Straylight public surface. ADR-024A unchanged.

## Surface 6 — Estate summary

**Purpose.** Given an `estate_id`, the host returns counts of
assertions by class, by status, by privacy scope, and by risk
level. Counts respect the wedge's existing privacy and risk
discipline.

**Wedge primitives inspected.** `Estate`, `ActorEstate`,
`Assertion`, `AssertionStatus`, `Keyring`, `Policy` (consumed
read-only).

**Status.** safe draft.

**Request shape.**

```ts
type EstateSummaryRequest = {
  estate_id: string;
  detail_level: 'minimal' | 'standard' | 'debug';
  caller: { tenant_id: string; actor_id: string; session_id?: string; frame: 'actor_private' | 'public_discord' };
};
```

**Response shape.**

```ts
type EstateSummaryResponse =
  | {
      outcome: 'summarized';
      actor_id: string;
      estate_id: string;
      counts: {
        by_class: Record<string, number>;
        by_status: Record<AssertionStatus, number>;
        by_privacy_scope: Record<'actor_private' | 'public_discord', number>;
        by_risk_level: Record<'low' | 'medium' | 'high' | 'critical', number>;
      };
    }
  | {
      outcome: 'refused';
      reason: 'cross_tenant_refused' | 'unknown_estate' | 'privacy_scope_refusal';
    };
```

**Fail-closed posture.**

- Cross-tenant summary → refused.
- Unknown estate → refused.
- The `public_discord` frame omits `actor_private` counts (or
  refuses outright if the caller's frame cannot see any counts
  under `actor_private`).

**Phase 24A non-scope preserved.** Identical to Surface 1.

## Appendix A — Exact Straylight primitives in-slice

Every primitive in the table below is owned by
[`../../src/straylight/`](../../src/straylight/) and re-exported
through [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
per the [package boundary](../mvp/package-boundary.md). The host
consumes each primitive read-only — it does not redefine or
re-export.

| Primitive | Wedge module (current) | Phase 24B host surfaces that consume it |
|---|---|---|
| `Actor` | [`../../src/straylight/types.ts`](../../src/straylight/types.ts) | 1, 2, 3, 4, 5, 6 (caller identity) |
| `Estate`, `ActorEstate` | [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts), [`../../src/straylight/types.ts`](../../src/straylight/types.ts) | 5, 6 |
| `Assertion`, `AssertionStatus` | [`../../src/straylight/types.ts`](../../src/straylight/types.ts) | 3, 4, 6 |
| `Keyring`, `SignatureEnvelope` | [`../../src/straylight/keyring.ts`](../../src/straylight/keyring.ts), [`../../src/straylight/signatures.ts`](../../src/straylight/signatures.ts) | 1 (signer competence on `RecallRequest`) |
| `Policy`, `PolicyDecision` | [`../../src/straylight/policy.ts`](../../src/straylight/policy.ts) | 1 (decision summary surfaced via `RecallReceipt`) |
| `Revocation` | [`../../src/straylight/types.ts`](../../src/straylight/types.ts) | 3 (revoked exclusion reason) |
| `RecallRequest` | [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts), [`../../src/straylight/types.ts`](../../src/straylight/types.ts) | 1 |
| `RecallPack` | [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts) | 1, 3 |
| `RecallReceipt` | [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts) | 1, 2 |
| `AuditEvent` (wedge-private) | [`../../src/straylight/audit.ts`](../../src/straylight/audit.ts) | 5 |
| `dispositionFor`, `privacyDispositionForFrame` (operations) | [`../../src/straylight/policy.ts`](../../src/straylight/policy.ts), [`../../src/straylight/recall.ts`](../../src/straylight/recall.ts) | 3 (reasons derived; not recomputed) |
| `verifyChain` (operation) | [`../../src/straylight/audit.ts`](../../src/straylight/audit.ts) | 5 |
| `StorageAdapter` (contract) | [`../../src/straylight/storage`](../../src/straylight/storage), [`../../tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts) | 2 (receipt persistence) |

## Appendix B — Out-of-slice primitives and operations

Each row below is **explicitly excluded** from the Phase 24B
MVP host plan. Each is pinned to its ADR-022E / ADR-020E /
ADR-024A / ADR-024C gate so a reviewer can refuse scope creep
on cite.

| Primitive / operation | Gate | Why out of slice |
|---|---|---|
| `Challenge` (Hounfour `challenge.schema.json` re-export) | ADR-022E gate #4 | Not re-exported by the wedge public surface; host does not consume. |
| `EstateTransition` (Hounfour `estate-transition.schema.json` adoption) | ADR-022E gate #1 | Schema not shipped at v8.6.x; #116 did not ship it. No transition envelope on the wire. |
| `safeCanonicalize` (Hounfour `./canonicalize` / `./utilities` subpath) | ADR-022E gate #2 | Exported subpath absent; local canonicalizer feeds the pack before the host serves it. |
| `AuditEvent` rename from `audit-trail-entry` / `domain-event` | ADR-022E gate #5 | Wedge-owned name; no rename into a Hounfour-side adjacent name. |
| `Commitment` / `CommitmentRoot` publication | ADR-020E | No public anchor; no commitment-root surface on the host. |
| `0xhoneyjar:straylight:*` audit-event prefix family adoption | ADR-024A / ADR-024C | Registered upstream by #116 as substrate; not adopted into the Straylight public surface. |
| `recall-wedge` conformance category adoption | ADR-024A / ADR-024C | Registered upstream by #116 as substrate; not adopted into the Straylight test suite. |
| Hounfour five-step conformance corpus import | ADR-024A / ADR-024C | Upstream test substrate, not Straylight runtime substrate. |
| Hounfour `main` consumption / commit-SHA pin / git-source dependency | ADR-024C | Release-only consumption discipline. |
| Finn-side enforcement on the wire | ADR-024B / ADR-024E §5 | Finn is the later runtime / enforcement collaborator; not in this slice. |
| Freeside-side surface on the wire | ADR-024B | Freeside is the later app / community surface consumer; not in this slice. |
| Sibling-repo wiring (Dixie / Finn / Freeside endpoint code) | ADR-024D §4 | `phase-24b-*` and `phase-24c-*` are local additive scaffolding inside `loa-straylight` only. |
| `loa-dixie` / `loa-finn` / `loa-freeside` `package.json` dependency | ADR-024D §4 | No new dependency. |
| Hounfour dependency range bump | ADR-024C | Stays `^8.6.0`, resolved patch `8.6.0`. |

## Appendix C — Mapping to Phase 12 Dixie surfaces

The Phase 12 Dixie packet
([`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md))
proposed eleven Dixie BFF surfaces against Straylight primitives.
The Phase 24B MVP host plan **narrows** that set to the six
in-slice surfaces above. The remaining Phase 12 surfaces are
**not** dropped — they remain in the Phase 12 packet for a later
slice — but they are **not** in the Phase 24B MVP host contract.

| Phase 12 surface | Phase 24B MVP host plan |
|---|---|
| Recall intake & response | **In slice — Surface 1.** |
| Receipt retrieval & display | **In slice — Surface 2.** |
| Excluded-assertion reason display | **In slice — Surface 3.** |
| Provenance inspection | **In slice — Surface 4.** |
| Audit-chain lookup | **In slice — Surface 5.** |
| Estate summary | **In slice — Surface 6.** |
| Assertion-status inspection | Out of slice for Phase 24B MVP. Covered by Surface 6 (counts by status) at the summary granularity; per-assertion inspection is a later slice. |
| Governance-record awareness | Out of slice; deferred. |
| Environment-frame routing | Out of slice; the host accepts a `frame` on the caller envelope (Surfaces 4, 6) but does not run routing logic. |
| High-risk review-queue routing | Out of slice for the docs/spec lock; Surface 1 surfaces `needs_review` outcomes but the review-queue management surface is deferred to a later slice. |
| Cross-tenant prevention | Cross-cutting; enforced at every surface's intake under the host invariants (host invariant #5). |

## Phase 24B non-scope

This spec records what the host inspects, not what `phase-24b-*`
implements. Per ADR-024D §3.d and ADR-024E:

- **No source / test / fixture / script / package edits in
  Phase 24B.** This is a docs/spec packet.
- **No `phase-24c-*` branch opened by Phase 24B.** ADR-024E §"The
  next implementation branch" scopes the future branch; Phase 24B
  authors no implementation.
- **No schema authoring.** No TypeBox, no JSON Schema, no `$id`.
- **No `package.json` change.** Hounfour stays `^8.6.0`, resolved
  `8.6.0`.
- **No sibling-repo edits.**
- **No GitHub issue / comment / PR.**
- **No `Challenge` / `EstateTransition` / `safeCanonicalize` /
  `AuditEvent`-rename adoption.**
- **No public commitment-root publication.**
- **No `0xhoneyjar:straylight:*` prefix family adoption.**
- **No `recall-wedge` conformance category adoption.**
- **No Hounfour five-step corpus import.**
- **No Hounfour `main` / commit-SHA / git-source consumption.**
- **No HTTP / REST / NATS / Discord / Telegram surface added to
  `loa-straylight`.**
- **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
  edits.**
- **No commit, no push, no PR.**

## Cross-references

- [`./recall-wedge-schema-contract.md`](./recall-wedge-schema-contract.md)
  — Phase 23A per-object MVP schema-contract draft (the fourteen
  primitive set the host inspects from).
- [`./recall-wedge-conformance-vectors.md`](./recall-wedge-conformance-vectors.md)
  — Phase 23A eleven-vector MVP conformance matrix (Phase 24B
  reframes vectors 1–8 at the host inspection layer; see
  [`./dixie-recall-host-validation-vectors.md`](./dixie-recall-host-validation-vectors.md)).
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — the Phase 24B decision-lock this spec sits on top of.
- [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md)
  — host placement: Dixie-first.
- [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — `phase-24b-*` allowable scope and hard non-scope.
- [`../handoffs/dixie-governed-recall-issue.md`](../handoffs/dixie-governed-recall-issue.md)
  — Phase 12 issue handoff (refreshed under Phase 24B).
- [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
  — Phase 12 boundary doc (refreshed under Phase 24B).
- [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
  — Phase 12 mapping doc (refreshed under Phase 24B).
- [`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md)
  — Phase 24B summary handoff.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  — the wedge's stable public API surface.
- [`../mvp/threat-model.md`](../mvp/threat-model.md)
  — the fail-closed defenses the host must preserve.
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — the class-vs-policy invariant the host preserves.
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — the wedge's stable public API surface, unchanged by Phase 24B.
- [`../../tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
  — the Phase 5 audit-chain / receipt invariants the host
  inherits.
- [`../../tests/phase-20b-recall-wedge-local-scaffold.test.ts`](../../tests/phase-20b-recall-wedge-local-scaffold.test.ts)
  — the six-receipt-category pin the host preserves.
