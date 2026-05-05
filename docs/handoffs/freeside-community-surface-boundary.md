# Freeside community-surface boundary — what Freeside owns and what it does not

> Status: Phase 14. **Pre-integration handoff packet, in
> `loa-straylight` only.** This document defines the boundary
> between Hounfour's class lane, Finn's runtime gate, Dixie's
> operator-facing BFF, Straylight's wedge, and Freeside's
> community / bot / admin / tenant / Discord / Telegram / REST /
> NATS lane. **It is not Freeside integration.** Nothing here
> imports from `loa-freeside`, edits any sibling repo, adds a
> Freeside dependency, or changes Phase 0–12 runtime behavior.

## The five lanes

| Lane | Owner | Responsibility |
|---|---|---|
| **Class lane** | `loa-hounfour` (post-Phase 9). Until Hounfour ships, `loa-straylight` owns it. | Canonical schema / class-validation vocabulary. *"Is this object structurally legible?"* |
| **Primitive lane** | `loa-straylight` permanently. | Primitive semantics, local wedge behavior, fail-closed defaults, deterministic content addressing, and the public API surface that downstream consumers import. |
| **Runtime lane** | `loa-finn` after consuming stable contracts (per Phase 10). Until Finn ships, the wedge owns it in-process. | Per-call admission, per-tool recall gating, per-transition policy evaluation, signer competence, transition execution, receipt emission, audit-chain persistence — under fail-closed semantics. |
| **Governed-recall / BFF / inspection lane** | `loa-dixie` after consuming stable contracts (per Phase 12). | Operator-facing recall intake, recall-response display, receipt retrieval, exclusion-reason display, provenance inspection, audit-chain lookup, estate summary, assertion-status inspection, governance-record awareness, environment-frame routing, high-risk review-queue routing, cross-tenant prevention (operator side). |
| **Community / app surface lane** | `loa-freeside` after consuming stable contracts. | Community-facing / bot-facing / admin-facing / tenant-facing surfaces — Discord / Telegram / REST / NATS / community-dashboard / tenant-admin — that route community / bot / admin actions through the runtime + BFF gates and render the resulting recall packs, receipts, audit events, and admin grants without ever owning Straylight primitive semantics. |

The lanes are **separable in code, in test, and in test fixture**.
Collapsing any two of them re-creates a known failure mode (see
[`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)).

## What Freeside should eventually own

Freeside's community / app surface module
(`loa-freeside/src/straylight/`, proposed in
[`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
§6.2.5 / §22.7) is the community-facing seam over the wedge's
primitive lane, Finn's runtime lane, and Dixie's BFF lane.
Freeside consumes; it does not produce new estate truth.

### Discord / Telegram bot recall and rendering

Freeside's Discord and Telegram adapters build a `RecallRequest`,
attach the platform's `EnvironmentFrame` (`public_discord` /
`public_telegram` / `private_chat`), forward to the runtime gate
(via Dixie / Finn or directly to the wedge in single-process
deployments), and render the served `RecallPack` + `RecallReceipt`
in the bot's response shape — included items as quotable, marked
items in a "contested" / "demoted" UI affordance, excluded items
as a public summary (counts, never bodies).

Freeside does not *produce* a `RecallPack`; it relays one.
Freeside does not *produce* a `RecallReceipt`; it surfaces one.

### Public-channel redaction

For every `public_discord` / `public_telegram` / `repo_workflow`
recall, Freeside honors the wedge / Finn / Dixie's
`privacyDispositionForFrame` output. `actor_private` / `sealed`
material is excluded; the bot MUST NOT render the body. Exclusion
summaries (counts, reasons) travel; bodies do not.

### Tenant-scoped and community-scoped recall

Freeside resolves the caller's tenant and community context from
the platform lane (Discord guild, Telegram chat, REST API key,
NATS subject) and forwards the recall with the boundary
attached. Cross-tenant requests are refused at the Freeside
ingress; Dixie / Finn / the wedge re-check downstream.

### Discord / Telegram environment-frame routing

Freeside's Discord and Telegram adapters attach the correct
`EnvironmentFrame` to every recall request and admin action.
Public channels become `public_discord` / `public_telegram`;
private DMs become `private_chat`; admin channels (with role
check) become `private_operator` with caller frame intent
`tenant_admin`. Frame elevation is forbidden — the caller cannot
ask for "debug mode" to see more.

### REST / NATS surface routing

Freeside's REST and NATS surfaces attach the correct
`EnvironmentFrame` to every recall request, admin action, and
capability grant; tenant boundary checks run at the ingress;
governed actions go through Finn's transition gate.

### Feedback signal capture as candidate assertions

Discord, Telegram, NATS, and REST events enter the wedge as
candidate `feedback_signal` (or platform-supplied class)
assertions. The candidate runs through class validation, policy
admission, and signer competence; only then does the candidate
enter the actor's estate. The platform event itself is provenance,
not canonical truth.

### Admin capability grants

Community admins grant scoped bot capabilities (and other scoped
operator permissions) by routing the grant through Finn's
transition gate. The grant emits a `transition_receipt` + audit
event; the capability is **not** active until the gate clears.
Freeside surfaces both to the admin.

### Bot action receipts

Bot-initiated actions (sending a binding message, posting an
on-chain commitment, making a payment, opening a PR, …) run
through Finn's transition gate. The action emits an
`action_executed` audit event + `action` transition receipt;
Freeside surfaces the receipt id + bot action result to the
platform lane.

### Cross-tenant recall prevention

Freeside is the *first* line of defense. The Freeside ingress
(Discord guild, Telegram chat, REST API key, NATS subject)
refuses cross-tenant recall before it reaches Dixie / Finn / the
wedge. Dixie / Finn / the wedge are the second / third / fourth
line; every layer refuses.

### Challenged / revoked / forgotten awareness

For every assertion Freeside surfaces in a bot, REST response, or
admin dashboard, the community surface consults the wedge's
`Challenge` / `Revocation` / `ForgetRecord` records and refuses
to render the assertion as `active` if any of those records is
admitted against it. Public channels show a redacted notice;
admin dashboards show the timeline.

### Tenant-admin estate inspection

Community admins inspect counts, audit chain heads, and assertion
statuses through Dixie's inspection surface. The community-admin
role lets the admin view counts, **not** bodies; bodies stay
private unless the admin holds the reviewer signer key (in which
case `audit_review` applies and Dixie hosts the surface, not
Freeside).

## What Freeside must not own

The list below is the inverse of "what Freeside owns." Each item
maps to a no-go boundary that must hold even when Freeside is
heavily invested in the community / app surface.

### Freeside must not define canonical schema semantics

**Why.** The class lane lives in Hounfour (post-Phase 9). The
canonical shape of an `Assertion`, `RecallRequest`,
`RecallReceipt`, `AuditEvent`, `CommitmentRoot`, and every enum
is published once, by Hounfour, and consumed by every downstream
consumer. If Freeside unilaterally defines a new
`EnvironmentFrame` member, renames an `AssertionStatus`, or adds
a new `PolicyDecisionOutcome`, two consumers (Freeside and a
non-Freeside caller) will disagree on shape, and the audit chain
across the boundary becomes unverifiable.

**How to apply.** Freeside imports the schema. Freeside does not
republish it. New enum members go through Hounfour. Until
Hounfour ships, Freeside imports `types.ts` from `loa-straylight`
directly and the same constraint applies (no Freeside-side
re-author). Freeside-side bot frame intents
(`tenant_admin`, `community_dashboard`) are presentation overlays
that map back to existing wedge frames, not new wedge frames.

### Freeside must not perform runtime policy enforcement that bypasses Finn / the wedge

**Why.** Runtime enforcement lives in Finn (post-Phase 10), or
in the wedge until Finn ships. The decision lane (`allow`,
`deny`, `needs_review`, `allow_with_redaction`,
`allow_marked_only`) is produced by `policyForAdmitAssertion`,
`policyForTransition`, `policyForRecallRequest`, and
`evaluateCompetence`. If Freeside produces its own
`PolicyDecision`, two layers will disagree on whether a recall
is admitted, and the receipt the community surface renders will
not match the receipt the audit chain holds.

**How to apply.** Freeside consumes a `PolicyDecision` produced
upstream. Freeside does not run policy validation. Freeside does
not short-circuit competence checks. Freeside does not auto-promote
a `needs_review` decision to `allow`. The community surface
presents what the runtime gate decided; it does not decide.

### Freeside must not treat bot memory as governed recall

**Why.** Bot-side memory (Discord conversation buffers, Telegram
scrollback, vector stores over chat history, message-search
indexes) is Freeside-owned platform memory. It is **not** a
Straylight estate. A vector hit on chat history is *candidate
material*, not a `RecallPack`. A `RecallPack` exists only after
class validation, policy validation, signer competence, the
disposition matrix, and receipt emission have all run. Treating
bot memory as a governed pack re-creates the
ungoverned-RAG / ungoverned-bot-memory failure mode the wedge
exists to prevent.

**How to apply.** Freeside's bot surfaces do not render bot
memory as a `RecallPack`. The pack the bot renders is the one
returned by the runtime gate, and only after the matching
`RecallReceipt` is also returned. If a Freeside-side bot-memory
surface exists at all (e.g. for typeahead, conversation
continuity, message threading), it is presented as "bot context"
with a clear "not governed recall" affordance. Bot memory may
*propose* candidate assertions through the admission gate, but
it never *is* a governed recall.

### Freeside must not treat Discord / Telegram / REST / NATS messages as canonical estate truth

**Why.** Platform events are observation provenance, not
canonical truth. A Discord message is a Discord message; it
becomes part of the actor's estate only after a candidate
assertion (signed, classified, policy-validated) is admitted. If
Freeside treats a raw platform event as an authoritative
`Assertion`, the actor's estate becomes whatever someone said in
Discord — which is exactly the "memory poisoning" failure mode
the wedge exists to prevent.

**How to apply.** Platform events enter the wedge as candidate
`feedback_signal` (or platform-supplied class) assertions. The
candidate's `provenance[]` references the platform event
(`source_type: 'community_event'` / `'social_signal'` /
`'runtime_observation'`); the body is the Freeside-side
interpretation of the event, signed by the bot or community
runtime. Class validation and policy validation run; only then
does the candidate enter the estate.

### Freeside must not bypass recall receipts

**Why.** A recall response without a receipt is ungoverned RAG.
The receipt is the audit artifact that ties the served pack to
the request and the request to its caller; without it, the audit
chain cannot show *what was served*. The wedge's discipline is
"every served pack has a receipt"; a community surface that
breaks that invariant is not a Straylight community surface.

**How to apply.** Freeside's bot / REST / community surfaces
refuse to render a pack whose matching receipt is missing,
stale, or whose `pack_hash` does not match the served pack. A
pack without a persisted receipt is treated as a denied recall;
the surface returns the deny reason, never a partial pack.

### Freeside must not expose private estate material in public community surfaces

**Why.** Privacy scopes are load-bearing in the wedge. The
`privacyDispositionForFrame` matrix excludes `actor_private` and
`sealed` material from any frame other than `audit_review` (and
only to a competent auditor). If Freeside renders an
`actor_private` body in `public_discord` / `public_telegram` /
`repo_workflow` (or to an uncredentialed REST / NATS caller), the
entire privacy contract collapses — the wedge's exclusion summary
becomes a polite suggestion, not an enforced boundary.

**How to apply.** Freeside respects the wedge / Finn / Dixie
output. Privacy decisions are made upstream; Freeside's renderer
does not derive its own privacy decisions. The community surface
never returns an `actor_private` body in a public frame, even
when the caller "knows the URL" or "has admin role in Discord."
Provenance records on `actor_private` assertions are equally
bound by the parent's privacy scope. Cross-community private
exposure is forbidden — Freeside MUST NOT join an
`actor_private` body across two communities the actor
participates in.

### Freeside must not treat challenged / revoked / forgotten assertions as ordinary active context

**Why.** The wedge's discipline is:
- a `revoked` assertion is excluded outside `audit_review`
  and never quotable as fact;
- a `forgotten_from_recall` assertion is excluded outside
  `audit_review` and never quotable as fact;
- a `contested` assertion is *always* `marked`, never
  silently `included`, regardless of frame.

If Freeside surfaces any of these as ordinary active bot context,
the governance affordances (challenge, revocation, forget) become
invisible to the community member and the bot presents stale
truth as authoritative.

**How to apply.** Freeside consults `Challenge` / `Revocation` /
`ForgetRecord` records before rendering an assertion as `active`.
A `contested` assertion is rendered with a clear "contested"
affordance and use-instruction. A `revoked` /
`forgotten_from_recall` assertion is rendered as `excluded` in
non-`audit_review` frames; in public bot channels, the bot
renders a redacted notice ("this material is no longer
active"), never the body.

### Freeside must not apply community / bot / admin actions without policy validation and a receipt / audit trail

**Why.** Bot actions, admin grants, capability mutations, and
community-side estate changes are governed transitions. The
wedge's promotion chain (`memory → belief → instruction → plan
→ permission → action → commitment → permanence`) holds through
Freeside; community / bot affordances do not get to skip policy
validation because the caller is "in Discord" or "an admin in
Telegram." A bot action without a receipt is an ungoverned
mutation; an admin grant without a receipt is an ungoverned
permission.

**How to apply.** Every governed action / grant / mutation runs
through Finn's transition gate. The transition emits a
`transition_receipt` + audit event; Freeside surfaces both. If
the gate denies, Freeside surfaces the deny reason; the
action / grant / mutation does not happen.

## Boundary violations and what they look like

The table below names the most likely failure modes and ties
each one to the wedge test (or threat-model row) that pins the
boundary today. Freeside's community / app surface module MUST
reproduce the equivalent pin in its own test suite.

| Violation | Boundary breached | Wedge test that pins it |
|---|---|---|
| Freeside renders a Discord conversation buffer as a `RecallPack` | `bot memory is not governed recall` | `tests/recall-exclusion.test.ts`; `tests/audit-and-receipt.test.ts` |
| Freeside admits a raw Discord / Telegram message as a canonical `Assertion` | `platform event is not canonical estate truth` | `tests/class-vs-policy-validation.test.ts`; `tests/policy-unavailable.test.ts` |
| Freeside returns a recall response without a matching `RecallReceipt` | `every served pack has a receipt` | `tests/transition-receipts.test.ts`; `tests/audit-and-receipt.test.ts` |
| Freeside exposes an `actor_private` body in `public_discord` | `private excluded outside audit_review` | `tests/recall-exclusion.test.ts`; `tests/phase-5-hardening.test.ts` (T1) |
| Freeside exposes an `actor_private` body in `public_telegram` | `private excluded outside audit_review` | `tests/recall-exclusion.test.ts`; `tests/phase-5-hardening.test.ts` (T1) |
| Freeside renders a `revoked` assertion as `usable` in any community surface | `revoked excluded outside audit_review` | `tests/recall-exclusion.test.ts`; `tests/phase-5-hardening.test.ts` (T3) |
| Freeside renders a `forgotten_from_recall` assertion as `usable` in any community surface | `forgotten excluded outside audit_review` | `tests/forget-flow.test.ts`; `tests/phase-5-hardening.test.ts` (T4) |
| Freeside surfaces a `contested` assertion as silently `included` in a bot reply | `contested is always marked` | `tests/recall-contested-marking.test.ts`; `tests/phase-5-hardening.test.ts` (T11) |
| Freeside auto-promotes a `needs_review` decision to `allow` | `needs_review must hold` | `tests/quorum-and-timelock.test.ts`; `tests/policy-unavailable.test.ts` |
| Freeside applies an admin capability grant without policy validation | `actions / grants run through the gate` | `tests/quorum-and-timelock.test.ts`; `tests/transition-receipts.test.ts` |
| Freeside applies a bot action without a receipt | `every action has a receipt` | `tests/transition-receipts.test.ts`; `tests/audit-and-receipt.test.ts` |
| Freeside produces a `PolicyDecision` of its own | `decision lane stays upstream` | `tests/class-vs-policy-validation.test.ts`; `tests/policy-unavailable.test.ts` |
| Freeside defines a new `EnvironmentFrame` member | `class lane stays in Hounfour` | `tests/class-vs-policy-validation.test.ts` |
| Freeside serves a recall whose caller's tenant does not match the estate's tenant | `cross-tenant recall is forbidden` | `tests/phase-5-hardening.test.ts` (T6); `tests/recall-exclusion.test.ts` |
| Freeside multiplexes an `actor_private` body across two communities | `cross-tenant private is forbidden` | `tests/phase-5-hardening.test.ts` (T1, T6); `tests/recall-exclusion.test.ts` |
| Freeside elevates a public bot frame to "see more" than the wedge / Finn allow | `frame elevation lives in audit_review only` | `tests/recall-exclusion.test.ts`; `tests/phase-5-hardening.test.ts` (T1, T11) |

## Why this boundary matters

The wedge is small and in-process by design. Its small size is
the source of its trust: every primitive can be read, every test
can be run locally, every receipt can be reproduced. When
Freeside takes over the community / app surface lane, the trust
property must travel *through* the public-facing surface — not
get lost in rendering.

Three failure modes show up if the boundary is not held:

1. **Drift.** Freeside re-implements a primitive (a privacy
   filter, a disposition matrix, an exclusion-reason mapper, a
   receipt redactor, a competence rule) and the two
   implementations diverge. Now the wedge / Finn / Dixie and
   Freeside disagree on what a frame is allowed to see; the
   community member sees a pack the audit chain does not show.
2. **Authority creep.** Freeside invents a new
   `EnvironmentFrame` value to serve a UI need (e.g.
   `community_admin_debug` that "sees more than `audit_review`"),
   or a new `PolicyDecisionOutcome` (e.g. `allow_for_community_demo`),
   or a new "bot context as governed recall" rendering mode.
   Hounfour does not know about it; Finn does not know about
   it; Dixie does not know about it; the eval harness flags
   every new value as an unknown enum member. The schema lane is
   no longer a single source of truth, and the community surface
   starts producing receipts the audit chain cannot replay.
3. **Memory poisoning.** Freeside admits a raw Discord /
   Telegram message as a canonical `Assertion` (because "the
   user said it, so it's true"). The actor's estate becomes
   whatever someone said in a public Discord channel — and the
   wedge's class / policy / competence layers, which exist
   precisely to prevent this, are bypassed.

The boundary doc here exists so Freeside's PR-A reviewer can
refuse all three at the gate.

## Reference: the wedge's stable public surface

Freeside's community / app surface module imports from
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

Freeside's production community surface reads from a storage
adapter that satisfies `tests/storage-conformance.test.ts`,
consumes `PolicyDecision` / `RecallPack` / `RecallReceipt` /
`AuditEvent` produced upstream (by the wedge or by Finn or by
Dixie), and otherwise renders the wedge's public-API output as
published.

## Cross-references

- [`docs/handoffs/freeside-community-surface-issue.md`](./freeside-community-surface-issue.md)
  — Phase 14 issue handoff for `loa-freeside`.
- [`docs/handoffs/freeside-surface-mapping.md`](./freeside-surface-mapping.md)
  — Phase 14 mapping table from Straylight primitives /
  operations to proposed Freeside community / bot / admin /
  tenant surfaces.
- [`docs/handoffs/dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  — Phase 12 Dixie issue handoff (BFF / inspection lane).
- [`docs/handoffs/dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  — Phase 12 Dixie boundary doc.
- [`docs/handoffs/finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md)
  — Phase 10 Finn issue handoff (runtime lane).
- [`docs/handoffs/finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  — Phase 10 Finn boundary doc.
- [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — Phase 9 Hounfour issue handoff (class lane).
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.5, §16.1, §16.2, §22.7 — architectural decisions that
  motivate the Freeside community / app surface module.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  fail-closed defenses Freeside's community surface must
  preserve.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant. Freeside surfaces
  the policy-lane output to community members; it does not
  collapse the boundary.
- [`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/)
  — ten current-shape JSON examples (Freeside PR-A test
  inputs).
