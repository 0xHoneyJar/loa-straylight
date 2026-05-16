# Dixie governed-recall boundary — what Dixie owns and what it does not

> Status: Phase 12. **Pre-integration handoff packet, in
> `loa-straylight` only.** This document defines the boundary
> between Hounfour's class lane, Finn's runtime gate,
> Straylight's wedge, and Dixie's governed-recall / BFF /
> provenance / inspection lane. **It is not Dixie integration.**
> Nothing here imports from `loa-dixie`, edits any sibling repo,
> adds a Dixie dependency, or changes Phase 0–11 runtime behavior.

## The four lanes

| Lane | Owner | Responsibility |
|---|---|---|
| **Class lane** | `loa-hounfour` (post-Phase 9). Until Hounfour ships, `loa-straylight` owns it. | Canonical schema / class-validation vocabulary. *"Is this object structurally legible?"* |
| **Primitive lane** | `loa-straylight` permanently. | Primitive semantics, local wedge behavior, fail-closed defaults, deterministic content addressing, and the public API surface that downstream consumers import. |
| **Runtime lane** | `loa-finn` after consuming stable contracts (per Phase 10). Until Finn ships, the wedge owns it in-process. | Per-call admission, per-tool recall gating, per-transition policy evaluation, signer competence, transition execution, receipt emission, audit-chain persistence — under fail-closed semantics. |
| **Governed-recall / BFF / inspection lane** | `loa-dixie` after consuming stable contracts. | Operator-facing / developer-facing / auditor-facing recall intake, recall-response display, receipt retrieval, exclusion-reason display, provenance inspection, audit-chain lookup, estate summary, assertion-status inspection, governance-record awareness, environment-frame routing, high-risk review-queue routing, cross-tenant prevention. |

The lanes are **separable in code, in test, and in test fixture**.
Collapsing any two of them re-creates a known failure mode (see
[`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)).

## What Dixie should eventually own

Dixie's governed-recall / BFF / inspection module
(`loa-dixie/src/straylight/`, proposed in
[`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
§6.2.4) is the operator-facing seam over the wedge's primitive
lane and Finn's runtime lane. Dixie consumes; it does not produce
new estate truth.

### Recall intake and response

Dixie builds a `RecallRequest`, validates it (via the wedge's
`validateRecallRequest` or its post-extraction successor), and
hands it to the runtime gate. When the gate returns a
`RecallPack` and a `RecallReceipt`, Dixie renders both in a
shape that respects the `included` / `marked` / `redacted`
discipline and the requested `detail_level`.

Dixie does not *produce* a `RecallPack`; it relays one. Dixie
does not *produce* a `RecallReceipt`; it retrieves one.

### Receipt retrieval and display

Dixie exposes a receipt-retrieval surface keyed by `receipt_id`
that returns the persisted `RecallReceipt`. Dixie respects the
requested `detail_level` (`minimal` / `standard` / `debug`) but
does not invent detail-level redaction of its own — the wedge /
Finn applied detail-level redaction *after* the pack was built;
Dixie consumes the result.

### Excluded-assertion reason display

For every served pack, Dixie renders the `excluded_summary[]`
(and, where present, `redacted[]`) in a shape that explains
*why* each excluded class was excluded. The reasons are derived
from the wedge's `dispositionFor` / `privacyDispositionForFrame`
output; Dixie does not invent new reasons.

### Provenance inspection

Dixie exposes a per-assertion provenance walk that returns
`Assertion.provenance[]` records. The walk respects the parent
assertion's `privacy_scope` — `actor_private` provenance does
not travel to `public_discord`.

### Audit-chain lookup

Dixie exposes a per-estate audit-chain lookup that returns
`AuditEvent[]` plus a `verifyChain` result. When the chain is
broken, Dixie surfaces the break index and reason so an
operator can reconcile.

### Estate summary

Dixie exposes a per-estate summary that returns the
actor / estate / keyring meta plus assertion counts (by class,
by status, by privacy scope, by risk level). Counts respect
privacy-scope (the `public_discord` view does not expose
`actor_private` counts).

### Assertion-status inspection

Dixie exposes a per-assertion status surface that returns the
current `AssertionStatus`, the `challenged_by_refs`, and the
`revoked_by_ref` (when present). For a `revoked` /
`forgotten_from_recall` assertion in a non-`audit_review`
frame, Dixie renders the assertion as `excluded`; in
`audit_review`, Dixie renders it as `marked` with the wedge's
`use_instruction`.

### Governance-record awareness

For every assertion Dixie surfaces, the BFF consults the wedge's
`Challenge` / `Revocation` / `ForgetRecord` records and refuses
to render an assertion as `active` if any of those records is
admitted against it.

### Environment-frame routing

Dixie attaches the caller's `environment_frame` to every recall
request. The wedge / Finn decide what the frame is allowed to
see; Dixie does not override the frame.

### High-risk review-queue routing

For high / critical-risk recalls in public frames, the wedge's
`policyForRecallRequest` lifts to `needs_review`. Dixie holds
the request in a review queue keyed by a competent reviewer
signer; the review-queue UI / API is Dixie-native.

### Cross-tenant recall prevention

Dixie refuses a recall whose caller's tenant boundary does not
match the target estate's tenant boundary. Dixie is the *first*
line of defense; the wedge / Finn are the second line.

## What Dixie must not own

The list below is the inverse of "what Dixie owns." Each item
maps to a no-go boundary that must hold even when Dixie is
heavily invested in the BFF / inspection surface.

### Dixie must not define canonical schema semantics

**Why.** The class lane lives in Hounfour (post-Phase 9). The
canonical shape of an `Assertion`, `RecallRequest`,
`RecallReceipt`, `AuditEvent`, `CommitmentRoot`, and every enum
is published once, by Hounfour, and consumed by every downstream
consumer. If Dixie unilaterally defines a new `EnvironmentFrame`
member, renames an `AssertionStatus`, or adds a new
`PolicyDecisionOutcome`, two consumers (Dixie and a non-Dixie
caller) will disagree on shape, and the audit chain across the
boundary becomes unverifiable.

**How to apply.** Dixie imports the schema. Dixie does not
republish it. New enum members go through Hounfour. Until
Hounfour ships, Dixie imports `types.ts` from `loa-straylight`
directly and the same constraint applies (no Dixie-side
re-author).

### Dixie must not perform runtime policy enforcement that bypasses Finn / the wedge

**Why.** Runtime enforcement lives in Finn (post-Phase 10), or
in the wedge until Finn ships. The decision lane (`allow`,
`deny`, `needs_review`, `allow_with_redaction`,
`allow_marked_only`) is produced by `policyForAdmitAssertion`,
`policyForTransition`, `policyForRecallRequest`, and
`evaluateCompetence`. If Dixie produces its own
`PolicyDecision`, two layers will disagree on whether a recall
is admitted, and the receipt the BFF renders will not match the
receipt the audit chain holds.

**How to apply.** Dixie consumes a `PolicyDecision` produced
upstream. Dixie does not run policy validation. Dixie does not
short-circuit competence checks. Dixie does not auto-promote a
`needs_review` decision to `allow`. The BFF presents what the
runtime gate decided; it does not decide.

### Dixie must not treat generic retrieval as governed recall

**Why.** Vector / keyword / graph / RAG retrievers plug in
*behind* the wedge's prefilter, never above. A retriever's hit
list is *candidate material*, not a `RecallPack`. A `RecallPack`
exists only after class validation, policy validation, signer
competence, the disposition matrix, and receipt emission have
all run. Treating raw retrieval results as a governed pack
re-creates the ungoverned-RAG failure mode the wedge exists to
prevent.

**How to apply.** Dixie's BFF does not render retriever output
as a `RecallPack`. The pack the BFF renders is the one returned
by the runtime gate, and only after the matching `RecallReceipt`
is also returned. If a Dixie-side retrieval surface exists at
all (e.g. for typeahead), it is presented as "context retrieval"
with a clear "not governed recall" affordance.

### Dixie must not bypass recall receipts

**Why.** A recall response without a receipt is ungoverned RAG.
The receipt is the audit artifact that ties the served pack to
the request and the request to its caller; without it, the audit
chain cannot show *what was served*. The wedge's discipline is
"every served pack has a receipt"; a BFF that breaks that
invariant is not a Straylight BFF.

**How to apply.** Dixie's recall-response surface refuses to
render a pack whose matching receipt is missing, stale, or
whose `pack_hash` does not match the served pack. A pack
without a persisted receipt is treated as a denied recall;
the BFF surfaces the deny reason, never a partial pack.

### Dixie must not expose private estate material in public or unauthorized contexts

**Why.** Privacy scopes are load-bearing in the wedge. The
`privacyDispositionForFrame` matrix excludes `actor_private`
and `sealed` material from any frame other than
`audit_review` (and only to a competent auditor). If Dixie
renders an `actor_private` body in `public_discord` (or to
an uncredentialed caller), the entire privacy contract
collapses — the wedge's exclusion summary becomes a polite
suggestion, not an enforced boundary.

**How to apply.** Dixie respects the wedge / Finn output.
Privacy decisions are made upstream; Dixie's renderer does
not derive its own privacy decisions. The BFF never returns
an `actor_private` body in a public frame, even when the
caller "knows the URL" or "has a debug header." Provenance
records on `actor_private` assertions are equally bound by
the parent's privacy scope.

### Dixie must not treat challenged / revoked / forgotten assertions as ordinary active context

**Why.** The wedge's discipline is:
- a `revoked` assertion is excluded outside `audit_review`
  and never quotable as fact;
- a `forgotten_from_recall` assertion is excluded outside
  `audit_review` and never quotable as fact;
- a `contested` assertion is *always* `marked`, never
  silently `included`, regardless of frame.

If Dixie surfaces any of these as ordinary active context, the
governance affordances (challenge, revocation, forget) become
invisible to the operator and the BFF presents stale truth.

**How to apply.** Dixie consults `Challenge` / `Revocation` /
`ForgetRecord` records before rendering an assertion as
`active`. A `contested` assertion is rendered with a clear
"contested" affordance and use-instruction. A `revoked` /
`forgotten_from_recall` assertion is rendered as `excluded`
in non-`audit_review` frames and as `marked` in `audit_review`.

### Dixie must not turn model summaries into canonical estate truth

**Why.** A model-generated summary of a recall pack or estate
is provenance, not authority. The canonical truth is the JSON
the wedge produced; the summary is a reading of that JSON.
Treating the summary as canonical re-creates the
inference-as-fact failure mode the wedge exists to prevent.

**How to apply.** When Dixie renders a model-generated summary
(e.g. "this estate has 3 active observations and 1 contested
reflection"), the surface tags the text as a model summary,
links to the underlying JSON, and never replaces the JSON
view. The summary is a convenience, not the source of truth.

## Boundary violations and what they look like

The table below names the most likely failure modes and ties
each one to the wedge test (or threat-model row) that pins the
boundary today. Dixie's BFF / inspection module MUST reproduce
the equivalent pin in its own test suite.

| Violation | Boundary breached | Wedge test that pins it |
|---|---|---|
| Dixie renders a vector-search hit list as a `RecallPack` | `generic retrieval is not governed recall` | `tests/recall-exclusion.test.ts`; `tests/audit-and-receipt.test.ts` |
| Dixie returns a recall response without a matching `RecallReceipt` | `every served pack has a receipt` | `tests/transition-receipts.test.ts`; `tests/audit-and-receipt.test.ts` |
| Dixie exposes an `actor_private` body in `public_discord` | `private excluded outside audit_review` | `tests/recall-exclusion.test.ts`; `tests/phase-5-hardening.test.ts` (T1) |
| Dixie renders a `revoked` assertion as `usable` in any frame | `revoked excluded outside audit_review` | `tests/recall-exclusion.test.ts`; `tests/phase-5-hardening.test.ts` (T3) |
| Dixie renders a `forgotten_from_recall` assertion as `usable` in any frame | `forgotten excluded outside audit_review` | `tests/forget-flow.test.ts`; `tests/phase-5-hardening.test.ts` (T4) |
| Dixie surfaces a `contested` assertion as silently `included` | `contested is always marked` | `tests/recall-contested-marking.test.ts`; `tests/phase-5-hardening.test.ts` (T11) |
| Dixie auto-promotes a `needs_review` decision to `allow` | `needs_review must hold` | `tests/quorum-and-timelock.test.ts`; `tests/policy-unavailable.test.ts` |
| Dixie suppresses a broken `verifyChain` result | `audit log is append-only and chained` | `tests/audit-and-receipt.test.ts`; `tests/phase-5-hardening.test.ts` (T9) |
| Dixie produces a `PolicyDecision` of its own | `decision lane stays upstream` | `tests/class-vs-policy-validation.test.ts`; `tests/policy-unavailable.test.ts` |
| Dixie defines a new `EnvironmentFrame` member | `class lane stays in Hounfour` | `tests/class-vs-policy-validation.test.ts` |
| Dixie serves a recall whose caller's tenant does not match the estate's tenant | `cross-tenant recall is forbidden` | `tests/phase-5-hardening.test.ts` (T6); `tests/recall-exclusion.test.ts` |
| Dixie renders a model-generated estate summary as canonical truth | `model output is not authority` | `tests/class-vs-policy-validation.test.ts`; `policy.ts.needsReviewForModelOutput` |

## Why this boundary matters

The wedge is small and in-process by design. Its small size is
the source of its trust: every primitive can be read, every test
can be run locally, every receipt can be reproduced. When Dixie
takes over the BFF / inspection lane, the trust property must
travel *through* the operator-facing surface — not get lost in
rendering.

Two failure modes show up if the boundary is not held:

1. **Drift.** Dixie re-implements a primitive (a privacy
   filter, a disposition matrix, an exclusion-reason mapper,
   a receipt redactor) and the two implementations diverge.
   Now the wedge / Finn and Dixie disagree on what a frame is
   allowed to see; the operator sees a pack the audit chain
   does not show.
2. **Authority creep.** Dixie invents a new
   `EnvironmentFrame` value to serve a UI need (e.g.
   `internal_debug` that "sees more than `audit_review`"),
   or a new `PolicyDecisionOutcome` (e.g. `allow_for_demo`),
   or a new "summary as truth" rendering mode. Hounfour does
   not know about it; Finn does not know about it; the
   eval harness flags every new value as an unknown enum
   member. The schema lane is no longer a single source of
   truth, and the BFF starts producing receipts the audit
   chain cannot replay.

The boundary doc here exists so Dixie's PR-A reviewer can refuse
both at the gate.

## Reference: the wedge's stable public surface

Dixie's BFF / inspection module imports from
[`src/straylight/index.ts`](../../src/straylight/index.ts) only.
Anything not re-exported there is internal to the wedge and may
change without notice. The public surface, in summary:

| Group | Symbols |
|---|---|
| Types | All primitive types per `package-boundary.md` §1 |
| IDs / canonical | `canonicalize`, `sha256`, `shortHash`, `contentId`, `payloadHash`, `makeIdSource` |
| Signatures (dev) | `devSign`, `devSignatureFor`, `verifyDevSignature`, `verifyEnvelopeSelfConsistency`, `assertionSignedPayload`, `recallSignedPayload`, `DEV_SIGNATURE_PREFIX` |
| Class validation | `validateCandidateAssertion`, `validateRecallRequest` |
| Keyring / competence | `resolveSigner`, `isSignerCurrentlyValid`, `evaluateCompetence`, `listActiveSignerRoles` |
| Policy | `policyForAdmitAssertion`, `policyForTransition`, `policyForRecallRequest`, `dispositionFor`, `PolicyEngineError`, `DEFAULT_POLICY_ID`, `DEFAULT_POLICY_VERSION` |
| Audit | `AuditLog` |
| Estate / transitions | `EstateStore` (and its `admit` / `challenge` / `revoke` / `forget` methods) |
| Recall | `executeRecall` |
| Commitment | `computeCommitmentRoot`, `commitmentForRecallReceipt` |
| Storage | `InMemoryStorage`, `JsonlStorage`, `loadBundle`, `saveBundle`, `StorageAdapter`, `EstateBundle` |

Dixie's production BFF reads from a storage adapter that
satisfies `tests/storage-conformance.test.ts`, consumes
`PolicyDecision` / `RecallPack` / `RecallReceipt` /
`AuditEvent` produced upstream (by the wedge or by Finn), and
otherwise renders the wedge's public-API output as published.

## Cross-references

- [`docs/handoffs/dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  — Phase 12 issue handoff for `loa-dixie`.
- [`docs/handoffs/dixie-recall-mapping.md`](./dixie-recall-mapping.md)
  — Phase 12 mapping table from Straylight primitives /
  operations to proposed Dixie BFF / API / service surfaces.
- [`docs/handoffs/finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md)
  — Phase 10 Finn issue handoff (runtime lane).
- [`docs/handoffs/finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  — Phase 10 Finn boundary doc.
- [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — Phase 9 Hounfour issue handoff (class lane).
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.4, §22.5 — architectural decisions that motivate the
  Dixie BFF / inspection module.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  fail-closed defenses Dixie's BFF must preserve.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant. Dixie surfaces the
  policy-lane output; it does not collapse the boundary.
- [`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/)
  — ten current-shape JSON examples (Dixie PR-A test inputs).

---

## Phase 24B refresh — recall-pack-inspection MVP boundary lock

> Status: Phase 24B (append-only). This section is the **Phase 24B
> refresh** to this Phase 12 boundary doc. It does **not** edit
> any Phase 12 prose above. It records, in append-only form, how
> the Phase 24A host-placement decision (ADR-024B: Dixie-first,
> recall-pack-inspection-first) and the Phase 24B wire-shape lock
> (ADR-024E) tighten the four-lane model for the recall-pack-
> inspection MVP slice.
>
> Companion docs:
> [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md),
> [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md),
> [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md),
> [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md),
> [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md),
> [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md),
> [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md),
> [`./hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md).

### Lane disposition for Phase 24B

The Phase 12 four-lane model (class / primitive / runtime /
governed-recall-BFF) carries forward unchanged. Phase 24B
narrows the four-lane disposition for the **recall-pack-
inspection MVP slice** as follows:

| Lane | Phase 24B disposition | Rationale |
|---|---|---|
| **Class lane** (`loa-hounfour`, after adoption) | **Unchanged.** Wedge owns class validation in-process until a Hounfour-side adoption PR lands. Hounfour #116 registered the `recall-wedge` category and the `0xhoneyjar:straylight:*` audit-event prefix family upstream as **substrate**, not as an adoption event. Phase 24B does **not** adopt either into the Straylight public surface or test suite. | Per ADR-020C / ADR-022C / ADR-024A / ADR-024C. #116 is upstream substrate; adoption requires Event A + Event B + Event C. |
| **Primitive lane** (`loa-straylight`, permanent) | **Load-bearing for Phase 24B.** Every wedge primitive the host inspects (`RecallRequest`, `RecallPack`, `RecallReceipt`, `Assertion`, `AssertionStatus`, `Estate`, `Actor`, `Keyring`, `Policy`, `Revocation`, `AuditEvent` (wedge-private), `dispositionFor`, `privacyDispositionForFrame`, `verifyChain`, `StorageAdapter`) stays wedge-owned. See [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) §"Appendix A". | Per ADR-024A / ADR-022A / ADR-020A / ADR-024E §"Decision" 3. |
| **Runtime lane** (`loa-finn`, later) | **Out of slice for Phase 24B.** Finn remains the **later runtime / enforcement collaborator**, not the Phase 24B host. Finn re-enters only when recall output is fed into model / tool execution — a *later* slice that requires a separate host-placement ADR. The Phase 10 Finn packet ([`./finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md), [`./finn-runtime-boundary.md`](./finn-runtime-boundary.md), [`./finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)) is **not** refreshed by Phase 24B and **not** advanced by Phase 24B. | Per ADR-024B / ADR-024E §"Decision" 5. |
| **Governed-recall / BFF / inspection lane** (`loa-dixie`, after adoption) | **Targeted for Phase 24B (recall-pack-inspection-first).** The eventual Dixie host inspects, relays, and renders the wedge's existing recall output under the wedge's existing fail-closed discipline. The host does **not** produce a `RecallPack`, does **not** produce a `RecallReceipt`, does **not** compute `dispositionFor`, does **not** publish a commitment root, and does **not** invent privacy-scope semantics. | Per ADR-024B / ADR-024E §"Decision" 1–2 / §"Decision" 4. |

The lanes remain **separable in code, in test, and in test
fixture**. Collapsing any two of them re-creates a known failure
mode (see
[`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)).
Phase 24B preserves the separation unchanged.

### Straylight ↔ Dixie boundary (Phase 24B MVP)

The Phase 24B MVP host plan is **shape (b) of ADR-022B
criterion #2** — a precomputed `RecallPack` + `RecallReceipt`
(emitted by the wedge) inspected by Dixie. The Straylight↔Dixie
boundary for this slice is:

| Side | Owns | Examples |
|---|---|---|
| Straylight (wedge) | Primitive semantics; recall execution; receipt emission; audit-chain persistence; fail-closed defaults; deterministic content-addressing; local canonicalization; the stable public API surface. | `executeRecall`; `RecallPack` / `RecallReceipt` emission; `dispositionFor`; `verifyChain`; `computeCommitmentRoot`. |
| Dixie (host) | Operator-facing intake, relay, render. Receipt retrieval keyed by `receipt_id`. `excluded_summary[]` / `redacted[]` walks. `Assertion.provenance[]` walks under `privacy_scope`. Per-estate audit-chain lookup. Per-estate summary counts. Cross-tenant boundary at intake. | The six surfaces of [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md). |

The host does **not** produce a `RecallPack`. The host does
**not** produce a `RecallReceipt`. The host does **not** compute
`dispositionFor`. The host does **not** publish a commitment
root. The host does **not** invent privacy-scope semantics.

### Dixie ↔ Finn boundary (Phase 24B MVP)

Per ADR-024E §"Decision" 5: **Finn is out of this slice.** The
Phase 24B MVP host contract does **not** include a Finn-shaped
runtime-tool-call surface. Finn re-enters only on a later slice
that places a runtime-tool-call host under shape (a) of
ADR-022B criterion #2 — under a separate ADR (most plausibly an
ADR-024F or later).

Concretely, for Phase 24B and for the future
`phase-24c-dixie-recall-host-scaffold` branch:

- Finn is **not** wired by `phase-24b-*` (per ADR-024D §4).
- Finn is **not** wired by `phase-24c-*` (per ADR-024E §"The
  next implementation branch" §3).
- Finn does **not** appear in the Phase 24B MVP host contract
  request/response shapes.
- The Phase 10 Finn packet is the in-repo contract for the
  later runtime slice — preserved unchanged; **not** advanced
  by Phase 24B.

### Hounfour and Freeside (Phase 24B disposition)

- **Hounfour** remains schema / protocol / conformance
  substrate only per ADR-020C / ADR-022A / ADR-022C / ADR-024A /
  ADR-024E §"Decision" 7. Phase 24B does **not** make Hounfour a
  host candidate.
- **Freeside** remains the later app / community surface
  consumer per ADR-024B / ADR-024E §"Decision" 6. Phase 24B does
  **not** refresh the Freeside packet
  ([`./freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md)).

### Phase 24B refresh non-scope

- **No edits to the existing Phase 12 prose above.** This
  section is append-only.
- **No new Dixie BFF surfaces beyond the six in
  [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md).**
- **No schema authoring.**
- **No `package.json` change.** No `loa-dixie` / `loa-finn` /
  `loa-freeside` dependency. No Hounfour range bump.
- **No sibling-repo edits.**
- **No GitHub issue / comment / PR.**
- **No `Challenge` / `EstateTransition` / `safeCanonicalize` /
  `AuditEvent`-rename adoption.**
- **No `0xhoneyjar:straylight:*` prefix family adoption** into
  the Straylight public surface.
- **No `recall-wedge` conformance category adoption** into the
  Straylight test suite.
- **No Hounfour five-step corpus import** from a working-tree
  path.
- **No Hounfour `main` / commit-SHA / git-source consumption.**
- **No `.loa/` / `.claude/` / `.beads/` / `.run/` / `.github/`
  edits.**
- **No commit, no push, no PR.**

### Phase 24B refresh cross-references

- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — Phase 24B decision-lock for the Dixie host MVP wire-shape.
- [`../decisions/ADR-024B-mvp-host-selection.md`](../decisions/ADR-024B-mvp-host-selection.md)
  — host placement (Dixie-first).
- [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md)
  — package-release discipline for Hounfour-#116-derived
  contracts.
- [`../decisions/ADR-024D-phase-24b-implementation-branch.md`](../decisions/ADR-024D-phase-24b-implementation-branch.md)
  — `phase-24b-*` allowable scope.
- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — per-Dixie-surface Phase 24B MVP host contract.
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — per-vector validation matrix at the host inspection layer.
- [`./phase-24b-dixie-recall-host-plan.md`](./phase-24b-dixie-recall-host-plan.md)
  — Phase 24B summary handoff.
- [`./phase-24a-hounfour-116-intake-and-host-decision.md`](./phase-24a-hounfour-116-intake-and-host-decision.md)
  — Phase 24A summary handoff (the packet Phase 24B builds on).
- [`./hounfour-116-merge-intake.md`](./hounfour-116-merge-intake.md)
  — Phase 24A per-component intake.

## Phase 24E refresh — Dixie's read-only consumption of the local host scaffold

> Status: Phase 24E (append-only). This section is the **Phase 24E
> refresh** of this Phase 12 boundary doc. It tightens the
> Phase 12 "Dixie consumes; it does not produce new estate truth"
> statement to the Phase 24C/24D scaffold reality: every Dixie
> surface is a render over a Phase 24C handler's return value;
> Dixie's only sources of truth are the host handler shapes and
> the wedge public API surfaced through them. Existing Phase 12
> and Phase 24B prose is unchanged.
>
> Companion docs (Phase 24E):
> [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)
> (Phase 24E summary handoff),
> [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
> (Phase 24E refresh appended),
> [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md)
> (Phase 24E refresh appended),
> [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md),
> [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md).

### Dixie's role in the post-PR-30 scaffold

The Phase 12 boundary statement "Dixie consumes; it does not
produce new estate truth" predates the Phase 24C / 24D scaffold.
The scaffold tightens what "consumes" means: Dixie has six
concrete handler entry points
([`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts))
that take Dixie's caller envelope + a `TenantResolver` (and
optional `IntakeDenyLog` on S6) as input and return a typed
discriminated outcome. Dixie's BFF surface is a thin render
layer over those outcomes. Phase 24E pins the following
strengthened boundary statements:

- **Dixie does not produce a `RecallPack`.** S1's
  `handleRecallIntake` returns the wedge's pack on the `served`
  path; on `denied` and `needs_review` it returns no pack and
  Dixie MUST NOT synthesise one (per Phase 24C deviation #1).
- **Dixie does not produce a `RecallReceipt`.** S1 and S2 return
  the wedge's persisted receipt verbatim; on denial / refusal
  paths there is no receipt and Dixie MUST NOT manufacture one.
- **Dixie does not compute `dispositionFor`.** S3's
  classification is host-applied over the wedge's
  `excluded_summary[]` / `redacted[]` / `marked[]`. Per
  Phase 24D concern 5, an unrecognised wedge reason maps to
  safe-default `excluded` and preserves `raw_reason`. Dixie
  renders the host's classification; Dixie does not re-derive.
- **Dixie does not reinterpret `privacy_scope`.** The wedge's
  four-value `PrivacyScope` enum is authoritative. S6's host-
  applied 2-key projection (with frame discipline) is what
  Dixie renders; the 4-key `_widened_privacy_scope` is trace
  data only.
- **Dixie does not run `verifyChain`.** S5's
  `handleAuditChainLookup` invokes the wedge's `verifyChain`
  through `AuditLookupDeps`. Dixie relays `verified` /
  `broken` (with `break_index` + `break_reason`) / `refused`;
  Dixie does not re-verify and does not hide a break.
- **Dixie does not publish a commitment root.** ADR-020E
  unchanged. The wedge's `computeCommitmentRoot` is internal to
  the wedge; no host surface exposes it.
- **Dixie does not rename `AuditEvent`.** S5 surfaces the wedge's
  `AuditEvent` shape; ADR-022E gate #5 is preserved. Dixie does
  not project `AuditEvent` into Hounfour-side adjacent names
  (`audit-trail-entry` / `domain-event`).

### Lane disposition (Phase 24E)

The Phase 24B lane-disposition table above is unchanged. The
governed-recall / BFF / inspection lane now has a concrete
local scaffold under
[`../../src/straylight/host/`](../../src/straylight/host/) that
Dixie's eventual sibling-repo PR will consume; the table's
"targeted for Phase 24B" row is the row this scaffold satisfies
locally. Phase 24E does not change the four-lane structure.

### Straylight ↔ Dixie boundary (Phase 24E reading)

The Phase 24B boundary statement above is unchanged. Phase 24E
adds the following five-part read of how Dixie operates over the
scaffold:

- **Inspect.** Dixie passes Dixie's caller envelope + the
  required `TenantResolver` (and on S6, optionally an
  `IntakeDenyLog`) into the matching host handler. The handler
  returns a typed discriminated outcome.
- **Relay.** Dixie relays every wedge-emitted artefact (pack,
  receipt, audit events, provenance records, counts) and every
  typed refusal reason verbatim. Dixie does not rewrite, does
  not soften, and does not omit.
- **Render.** Dixie renders for operators, developers, and
  auditors using the receipt-category vocabulary the wedge
  pinned in ADR-020D §6 (`included` / `excluded` / `redacted` /
  `challenged` / `revoked` / `blocked-by-policy`) and the typed
  refusal vocabulary the host's scaffold pinned (Phase 24C
  `DeniedReason` + per-surface `outcome: 'refused'` reasons).
- **Refuse.** When the host refuses, Dixie refuses. Phase 24D
  concern 1 (empty-tenant fail-closed), concern 2 (tenant-
  scoped parent under `public_discord` refusal on S4), concern
  3 (optional S6 intake-deny log), and concern 6 (tightened S2
  unknown-receipt-id assertion) all flow through to Dixie
  unchanged.
- **Audit.** Dixie surfaces the wedge's `audit_event_id` on
  denial (S1) and on cross-tenant refusal (S1, S2, S4, and S6
  with `intakeLog`) and surfaces the wedge's `AuditEvent[]` on
  per-estate lookup (S5). The host-side intake-deny log entries
  are per-tenant (cross-tenant chain links forbidden); Dixie
  preserves that scoping in its operator console / API surface.

### Dixie ↔ Finn boundary (Phase 24E reading)

The Phase 24B boundary statement above is unchanged: Finn is
**out of slice**. The Phase 24C / 24D scaffold has no Finn
import, no Finn dependency, and no Finn shape in any handler
deps interface. Phase 24E preserves the Phase 24B disposition
verbatim. Finn re-enters only when a *later* slice places a
runtime-tool-call host on Finn under shape (a) of ADR-022B
criterion #2; that placement requires a separate ADR (most
plausibly an ADR-024F or later) and is **not** authorised by
Phase 24E.

### Hounfour and Freeside (Phase 24E disposition)

The Phase 24B disposition above is unchanged: Hounfour remains
schema / protocol / conformance substrate only; Freeside remains
the later community / app surface consumer. Phase 24E does **not**
adopt Hounfour `#116` outputs, does **not** advance the Phase 19A
pending feedback gate on `0xHoneyJar/loa-hounfour#70`, and does
**not** refresh the Freeside packet
([`./freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md)).

### Phase 24E refresh non-scope

- **No edit to the Phase 12 prose above.** Existing §"The four
  lanes" / §"What Dixie should eventually own" / §"What Dixie
  must not own" / §"Boundary violations" / §"Why this boundary
  matters" / §"Reference: the wedge's stable public surface"
  sections are unchanged.
- **No edit to the Phase 24B refresh section above.**
- **No source / test / fixture / script / package change.**
- **No new endpoint / runtime / Hounfour adoption.** Phase 24E
  is local docs.
- **No sibling-repo edit, no GitHub-side action.**
- **No commit, no push, no PR by Phase 24E itself.**

### Phase 24E refresh cross-references

- [`./phase-24e-dixie-host-handoff-packet.md`](./phase-24e-dixie-host-handoff-packet.md)
  — Phase 24E summary handoff (this section's owning doc).
- [`./phase-24d-host-scaffold-hardening.md`](./phase-24d-host-scaffold-hardening.md)
  — Phase 24D summary handoff.
- [`./phase-24c-dixie-recall-host-scaffold.md`](./phase-24c-dixie-recall-host-scaffold.md)
  — Phase 24C summary handoff.
- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md)
  — per-surface MVP host contract.
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md)
  — vector matrix at the host inspection layer.
- [`../decisions/ADR-024E-dixie-host-mvp-wire-shape.md`](../decisions/ADR-024E-dixie-host-mvp-wire-shape.md)
  — Phase 24B decision-lock.
- [`./dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  (Phase 24E refresh appended).
- [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md)
  (Phase 24E refresh appended).
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  — canonical host barrel (post-PR-30 snapshot).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  — wedge public API (unchanged by Phase 24C / 24D / 24E).
