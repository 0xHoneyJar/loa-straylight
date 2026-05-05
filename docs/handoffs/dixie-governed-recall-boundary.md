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
