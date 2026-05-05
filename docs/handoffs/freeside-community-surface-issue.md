# Freeside community / app surface — issue handoff

> Status: Phase 14. **Pre-integration handoff packet, in
> `loa-straylight` only.** This file is written so it can be filed
> verbatim (or with minor edits) as a GitHub issue against
> [`0xHoneyJar/loa-freeside`](https://github.com/0xHoneyJar/loa-freeside)
> when that repo is ready to host the community / bot / admin /
> tenant / Discord / Telegram / REST surfaces around the Straylight
> Recall Wedge. **Filing the issue is not part of Phase 14.**
> Nothing in this handoff imports from `loa-freeside`, edits any
> sibling repo, adds a Freeside dependency, performs Freeside
> integration, or changes Phase 0–12 runtime behavior. This is
> handoff prep, not Freeside integration.

## Title

> Adopt Straylight Recall Wedge primitives as `loa-freeside`
> community / bot / admin / Discord / Telegram / REST / tenant
> surfaces

## Summary

`loa-straylight` Phase 5 froze the Recall Wedge's public API surface
([`src/straylight/index.ts`](../../src/straylight/index.ts)). Phases
6, 7, 8, and 9 staged the schema-extraction handoff that should move
the wedge's class-validation vocabulary to `loa-hounfour`. Phase 10
staged the runtime-enforcement handoff that should land in
`loa-finn` *after* Hounfour ships a stable schema surface. Phase 12
staged the governed-recall / BFF / inspection handoff that should
land in `loa-dixie` *after* Hounfour ships shape and Finn ships a
runtime gate. Phase 14 (this issue) stages the **community / app
surface** handoff that should land in `loa-freeside` *after*
Hounfour ships shape, Finn ships a runtime gate, and Dixie ships
the operator-facing recall / inspection lane.

This issue requests that `loa-freeside` eventually ships:

1. A community / app surface module (e.g.
   `loa-freeside/src/straylight/`) that consumes Hounfour-published
   class shapes, Finn's runtime-enforcement gate, and Dixie's
   governed-recall / BFF surface, and exposes
   community-facing / bot-facing / admin-facing / tenant-facing
   surfaces over the resulting recall packs, receipts, audit
   events, and admin grants.
2. **Discord** and **Telegram** bot surfaces that map platform
   events into candidate `feedback_signal` assertions (never as
   memory truth), attach the caller's `environment_frame`
   (`public_discord` / `public_telegram` / `private_chat`) to every
   recall request, and refuse to render `RecallPack` content the
   wedge / Finn / Dixie excluded.
3. **REST / NATS** surfaces that route community / bot / admin
   actions through Dixie / Finn under fail-closed semantics —
   tenant boundary first, governed recall second, capability
   grant third, receipt / audit trail emitted on every action.
4. **Admin / tenant-dashboard** surfaces that let a community
   admin request scoped recall, grant scoped bot capability,
   inspect the per-estate audit chain, and review high-risk
   review-queue entries — without ever owning Straylight
   primitive semantics.
5. **Cross-tenant prevention** as a Freeside-layer responsibility,
   with the wedge / Finn / Dixie as the second / third / fourth
   line of defense.
6. Freeside-side conformance tests grounded by the local fixture
   pack at
   [`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/),
   adopted verbatim or imported as a fixture package once the
   wedge, Hounfour, Finn, and Dixie are pinned.

The companion boundary doc is at
[`docs/handoffs/freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md).
The mapping table from Straylight primitives to proposed Freeside
community / bot / admin / tenant surfaces is at
[`docs/handoffs/freeside-surface-mapping.md`](./freeside-surface-mapping.md).

## Background

The Straylight Recall Wedge ships a thin control plane over a
governed actor estate. Today, every primitive the wedge produces
(`Assertion`, `Keyring`, `EstateTransition`, `Challenge`,
`Revocation`, `ForgetRecord`, `RecallRequest`, `RecallPack`,
`RecallReceipt`, `AuditEvent`, `CommitmentRoot`) is exercised
through `EstateStore`, `executeRecall`, `AuditLog`, and
`policyForX(...)`. The Phase 9–12 handoff packets stage how those
primitives travel into Hounfour, Finn, and Dixie. Phase 14 (this
issue) stages how they travel further — into the public-facing
community / bot / admin / tenant surfaces that everyday users,
community moderators, Discord bots, Telegram bots, and REST
clients actually touch.

The architecture spec calls this out:

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.5 — Freeside community / bot adapters: community actor
  estate creation, tenant / community scoped recall,
  Discord / Telegram environment frames, admin permission grants,
  public-channel redaction rules, event / feedback signal
  assertions, bot action receipts.
- §16.1 — Freeside is the consumer / app surface for tenant /
  community actors, bot environment frames, feedback signal
  capture, and admin grants. Freeside MUST NOT own primitive
  doctrine, hidden estate truth, or schema authority.
- §16.2 — Dixie → Freeside contract: Freeside calls Dixie / Finn
  for governed recall and estate inspection, passes
  tenant / community / environment frame and caller identity, and
  never bypasses recall policy for public bot outputs.
- §22.7 — Epic G ("Freeside integration") with task-level
  acceptance criteria: (G1) define environment frames for bot
  surfaces, (G2) capture feedback signals as candidate
  assertions, (G3) governed capability grants.

Phase 14 (this issue) consumes those architectural decisions and
turns them into a Freeside-shaped handoff. It does not start the
work; it specifies what the work needs to consume, fail-close on,
and emit when the work is done.

## Why this belongs in Freeside

The community / app surface is downstream of shape (Hounfour),
runtime (Finn), and operator-facing presentation (Dixie). Every
Loa component that wants a community member, bot, admin, or REST
client to *interact* with an actor's estate needs the same shapes,
the same fail-closed defaults, and the same receipt / audit
discipline. Hounfour cannot host a bot because it must remain
runtime-free. Finn cannot host a community surface because it is a
runtime gate, not a presentation layer. Dixie cannot host a
multi-tenant Discord / Telegram fleet because it is the
operator-facing BFF, not the community-facing one. Straylight (the
wedge) cannot host any of them because it is in-process by design.
Freeside is the natural seam:

1. **Multi-tenant community substrate.** Freeside already hosts
   the multi-tenant Discord / Telegram / REST community infra,
   NATS event surfaces, RLS tenant context, governed mutation
   service, hash-chained audit substrate, and admin / budget
   surfaces. Community-scoped recall, bot recall, admin grants,
   and tenant-scoped audit views are a substrate match.
2. **Bot environment frames.** Freeside already brokers Discord
   and Telegram message lanes; mapping platform events to
   `EnvironmentFrame` (`public_discord`, `public_telegram`,
   `private_chat`, `private_operator`, …) is a Freeside-side
   responsibility, not a wedge / Finn / Dixie one.
3. **Feedback signal capture.** Freeside already ingests
   community / social / economic feedback signals; mapping them
   into candidate `feedback_signal` assertions (never as memory
   truth) is the natural Freeside-side seam.
4. **Tenant boundary enforcement.** Freeside already enforces
   per-tenant RLS / row-level security; cross-tenant recall
   prevention is naturally enforced at the Freeside ingress
   (with Dixie / Finn / the wedge as second / third / fourth
   lines of defense).
5. **Admin / capability grant flow.** Freeside already brokers
   community admin permission grants; routing them through
   Finn's policy gate and emitting them as
   `permission` / `capability` assertions in the actor's estate
   is a Freeside-side responsibility.

What Freeside gets is the **community / app surface lane only**.
The class-vs-policy boundary in
[`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
remains load-bearing here: Hounfour ships shape, the wedge
produces decisions in-process, Finn enforces decisions across
processes, Dixie exposes those decisions to operators, **Freeside
exposes those decisions to community members / bots / admins
without collapsing the boundary**.

## Explicit non-goals

Freeside is **not** asked to ship any of the following. Each item
maps to a responsibility that stays in `loa-straylight`,
`loa-hounfour`, `loa-finn`, `loa-dixie` (or a sibling)
permanently:

- **No canonical schema authority.** Freeside MUST NOT define the
  canonical shape of any Straylight primitive. It MUST consume
  Hounfour-published schemas (or, until Hounfour ships, the
  wedge's re-exported `types.ts`) and MUST treat re-shape
  decisions as out-of-scope. The class lane lives in Hounfour,
  not Freeside.
- **No runtime policy enforcement that bypasses Finn / the
  wedge.** Freeside MUST NOT decide on its own whether a
  transition is admitted, denied, marked, or held for review.
  The runtime gate lives in Finn (post-Phase 10) — or, until
  Finn ships, in the wedge — and Freeside consumes the resulting
  `PolicyDecision` / `RecallReceipt` / `AuditEvent`. Freeside
  MUST NOT produce a `PolicyDecision` of its own.
- **No "bot memory is governed recall" collapse.** Freeside MUST
  NOT promote bot-side message history, conversation buffers,
  vector-store snapshots, or chat transcripts into a
  `RecallPack`. A Discord message is **not** a canonical estate
  assertion; a vector hit on chat history is **not** a
  `RecallPack`. A `RecallPack` only exists if the request ran
  through the runtime gate, the policy lane returned a non-deny
  decision, the disposition matrix was applied, and a
  `RecallReceipt` was emitted and persisted. Anything else is
  "bot context" and MUST be presented as such — never as
  governed recall.
- **No "Discord message is canonical estate truth" collapse.**
  Freeside MUST NOT treat a Discord / Telegram / REST event as
  an authoritative `Assertion`. Platform events enter the wedge
  as candidate `feedback_signal` (or another runtime-supplied
  candidate class) and pass through Hounfour class validation,
  Finn policy validation, and signer competence before any
  estate state is mutated. Until then, the platform event is
  observation provenance, not canonical truth.
- **No recall without receipt.** Freeside MUST NOT display,
  return, cache, or relay a recall response to a community
  member, bot, admin, or REST caller without a matching
  `RecallReceipt`. A pack without a receipt is treated as a
  denied recall; the community surface either returns the deny
  reason or refuses to render. The wedge's "every served pack
  has a receipt" discipline is load-bearing through Freeside.
- **No leakage of private estate material in public community
  surfaces.** Freeside MUST NOT expose `actor_private` or
  `sealed` material in `public_discord` / `public_telegram` /
  `repo_workflow` frames, or in any other public-facing channel.
  The wedge's `privacyDispositionForFrame` discipline must be
  respected by every Freeside surface; exclusion summaries are
  fine, but the underlying body MUST NOT travel.
- **No surfacing of challenged / revoked / forgotten material as
  ordinary active context in bots, REST surfaces, or admin
  dashboards.** Freeside MUST NOT render a `revoked` or
  `forgotten_from_recall` assertion as `usable` in any frame
  (the wedge already excludes them outside `audit_review`;
  Freeside MUST NOT undo that). A `contested` assertion MUST
  always be presented as `marked`, never as silently included
  bot context. The recall pack's `marked[]` and
  `excluded_summary[]` are the load-bearing surfaces; Freeside
  MUST preserve them.
- **No community / bot / admin action without policy validation
  and a receipt / audit trail.** Freeside MUST NOT apply a bot
  action, admin grant, capability mutation, or community-side
  estate change without routing it through Finn's policy gate
  and emitting a transition receipt + audit event. The wedge's
  promotion chain (`memory → belief → instruction → plan →
  permission → action → commitment → permanence`) holds through
  Freeside; community / bot affordances do not get to skip
  policy validation because the caller is "in Discord."
- **No new schema authority.** Freeside MUST NOT promote new
  `AssertionClass`, `AssertionStatus`, `EnvironmentFrame`,
  `TransitionType`, `AuditEventType`, `CommitmentType`,
  `PrivacyScope`, `RiskLevel`, `ProvenanceSourceType`,
  `ChallengeType`, `ChallengeRequestedEffect`,
  `RecallUseInstruction`, `ReceiptDetailLevel`, `SignerType`,
  `SignatureType`, `SignerStatus`, `PolicyDecisionOutcome`,
  `TransitionReceiptKind`, `EstateStatus`, `ActorType`, or
  `ActorStatus` values unilaterally. Additions are a Hounfour
  change; Freeside consumes the enum, it does not own it.
  Freeside-side bot frame intents (e.g. `tenant_admin`,
  `community_dashboard`) are presentation overlays that map
  back to existing wedge frames, not new wedge frames.
- **No reverse imports.** Freeside MUST NOT publish a package
  that `loa-straylight`, `loa-hounfour`, `loa-finn`, `loa-dixie`,
  or any other Straylight consumer is expected to import. The
  community / app surface is *downstream*, not a peer dependency
  of the wedge.
- **No cross-tenant recall.** Freeside MUST NOT serve a recall
  whose request signer / requested actor does not match the
  target estate's tenant. Cross-tenant prevention is a
  Freeside-layer responsibility (with Dixie / Finn / the wedge
  as the second / third / fourth line of defense — every layer
  must refuse).
- **No private estate exposure across communities.** Freeside
  MUST NOT join an `actor_private` body across two communities
  the actor participates in. Per-community context is per-tenant;
  the actor's private estate is never multiplexed across tenants.
- **No production signature material in the handoff packet.**
  The fixtures under
  [`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/)
  carry `dev_signature` envelopes for shape illustration only;
  Freeside MUST consume real signature material once Finn wires
  production signers. The community surface MUST NOT treat
  `dev_signature` as a binding signing primitive.
- **No Discord / Telegram / Freeside / Finn / Hounfour /
  Dixie integration in the same change.** This issue is the
  Freeside-side community / app surface gate; sibling
  integrations are separately tracked epics (per
  §22.4 / §22.5 / §22.6).
- **No production database integration in the same change.**
  Freeside's storage adapter is downstream of the wedge's
  `StorageAdapter` contract; production database choice
  (Postgres / WAL / equivalent) is a Finn / Dixie / Freeside
  deployment decision and MUST satisfy
  [`tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts).
- **No onchain publishing.** The commitment-anchor seam stays
  in `loa-straylight` (per §6.2.3 and `package-boundary.md`
  §10). Freeside MAY display a `CommitmentRoot` once anchored,
  but Freeside MUST NOT host the chain client itself.
- **No generic RAG / vector / keyword / graph retrieval as
  governed recall.** Bot-side context retrievers, message
  search, and vector indexes are caller affordances; they MUST
  NOT be presented as a `RecallPack`. The wedge's prefilter
  discipline holds through Freeside.
- **No PRD / SDD / sprint planning artifact** is requested by
  this issue. Freeside's process for adopting these primitives
  is Freeside's choice.

## Freeside responsibilities it should eventually own

The responsibilities below are derivable from the architecture
spec (§6.2.5, §16.1, §16.2, §22.7) and from the wedge's stable
public surface (`src/straylight/index.ts`). Each one carries a
**fail-closed condition**: if Freeside cannot complete the
responsibility, the community surface denies / refuses to render /
surfaces the deny reason — never fabricates a pack, never serves a
stale receipt, never collapses a `marked` item into `included`,
never accepts a Discord message as canonical estate truth.

### F1. Discord / Telegram bot recall

For every bot-initiated recall (Discord, Telegram, future
platforms), Freeside MUST:

1. Build a `RecallRequest` per the wedge's
   `validateRecallRequest` shape.
2. Attach the caller's `environment_frame` from the platform
   lane — `public_discord` for a public Discord channel,
   `public_telegram` for a public Telegram chat, `private_chat`
   for a DM, `private_operator` for an admin console, …
3. Refuse to file a request whose caller's tenant / community
   does not match the target estate's tenant.
4. Hand the request to the runtime gate (Finn, post-Phase 10;
   or Dixie's BFF, post-Phase 12; or the wedge's `executeRecall`
   until Finn / Dixie ship) without short-circuiting class /
   policy / competence layers.
5. Render the served `RecallPack` + `RecallReceipt` in the
   bot's response shape — included items as quotable,
   marked items in a "contested" / "demoted" UI affordance,
   excluded items as a public summary (counts, never bodies).

Fail-closed condition: any layer error denies the bot recall;
engine errors become `deny` with `policy_engine_error:<code>`. The
wedge's `safeRun` discipline travels through every Freeside
surface.

### F2. Public-channel redaction

For every `public_discord` / `public_telegram` / `repo_workflow`
recall, Freeside MUST:

1. Honor the wedge / Finn / Dixie's
   `privacyDispositionForFrame` output. `actor_private` /
   `sealed` material is excluded; the bot MUST NOT render the
   body.
2. Render exclusion summaries (counts, reasons) without
   leaking the underlying body.
3. Refuse to "elevate" the frame on caller request — a public
   channel is a public channel, even if the caller asks for
   "debug mode" or "admin override." Frame elevation lives in
   `audit_review` (and only with a competent reviewer signer
   on Dixie).

Fail-closed condition: a public channel that would have to
synthesize a private body to answer the prompt → return the
exclusion summary; do **not** answer the prompt.

### F3. Tenant-scoped recall

For every recall (bot, admin, REST, dashboard), Freeside MUST:

1. Resolve the caller's tenant from the platform lane
   (Discord guild, Telegram chat, REST API key, NATS subject).
2. Refuse a recall whose target `actor_id` / `estate_id` does
   not belong to the caller's tenant.
3. Forward the recall with the tenant boundary attached so
   Dixie / Finn / the wedge can re-check.

Fail-closed condition: tenant boundary undefined → deny;
never default-allow. Cross-tenant recall MUST refuse at every
layer.

### F4. Community-scoped recall

For every community-scoped recall (community admin, community
dashboard, community-side bot), Freeside MUST:

1. Resolve the community context from the platform lane
   (Discord guild role, Telegram admin status, REST API
   community header).
2. Apply the community's recall scope filters (which classes,
   statuses, frames are visible to community members vs
   community admins).
3. Forward the recall with the community context attached;
   the wedge / Finn / Dixie re-check on receipt.

Fail-closed condition: community context unresolved → treat as
non-admin community-member access (most restrictive scope);
never default to admin scope.

### F5. Discord environment-frame routing

Freeside's Discord adapter MUST attach the correct
`EnvironmentFrame` to every recall request and admin action:

- public Discord channel → `public_discord`;
- private Discord DM → `private_chat`;
- admin Discord channel (with role check) → `private_operator`
  (with caller frame intent `tenant_admin`);
- audit-review Discord channel (gated by reviewer signer) →
  `audit_review` (forwarded to Dixie's review-queue UI, not
  rendered raw in Freeside).

Fail-closed condition: caller's Discord context unknown /
spoofed → deny intake with reason
`unknown_environment_frame`.

### F6. Telegram environment-frame routing

Freeside's Telegram adapter MUST attach the correct
`EnvironmentFrame` to every recall request and admin action:

- public Telegram chat → `public_telegram`;
- private Telegram DM → `private_chat`;
- admin Telegram channel (with role check) → `private_operator`
  (with caller frame intent `tenant_admin`);
- audit-review surfaces are not exposed via Telegram.

Fail-closed condition: caller's Telegram context unknown /
spoofed → deny intake with reason
`unknown_environment_frame`.

### F7. REST / NATS surface routing

Freeside's REST and NATS surfaces MUST attach the correct
`EnvironmentFrame` to every recall request, admin action, and
capability grant:

- REST API call with tenant header + caller signature →
  `private_operator` or `repo_workflow` (per route);
- NATS subject scoped to a tenant → tenant-scoped frame;
- public REST endpoint (e.g. status pings) MUST NOT serve
  governed recall — it serves only public, non-estate data.

Fail-closed condition: REST route or NATS subject not on the
allowlist for the caller's tenant → deny; never default-allow.

### F8. Feedback signal capture

For every Discord / Telegram / social / economic feedback
signal, Freeside MUST:

1. Build a candidate `feedback_signal` (or platform-supplied
   class) per Hounfour's class shape (or, until Hounfour
   ships, the wedge's re-exported types).
2. Fill `provenance[]` with the platform event reference
   (`source_type: 'community_event'` / `'social_signal'` /
   `'runtime_observation'`, `captured_by`,
   `evidence_summary`).
3. Hand the candidate to Finn's admission gate. The candidate
   MUST NOT enter the actor's estate as memory truth — only
   as a candidate awaiting class + policy validation.
4. Render the resulting admission decision (accepted / denied /
   marked / needs_review) to the platform lane.

Fail-closed condition: the candidate's signature, provenance,
or class shape fails validation → deny intake; emit a
Freeside-side audit log entry; never admit as memory.

### F9. Admin capability grants

For every community-admin action that grants a scoped bot
capability or scoped operator permission, Freeside MUST:

1. Build a candidate `permission` (or platform-supplied class)
   per Hounfour's class shape.
2. Verify the admin's role + competence via the wedge / Finn
   keyring.
3. Hand the candidate to Finn's transition gate.
   `policyForTransition` runs; quorum / timelock /
   human-review apply.
4. On allow, the wedge / Finn emit the
   `permission_granted` audit event + `transition_receipt`.
   Freeside surfaces both to the admin.
5. On deny / `needs_review`, Freeside surfaces the reason; the
   capability is **not** active until the gate clears.

Fail-closed condition: capability grant attempted by a signer
who does not pass `evaluateCompetence` → deny;
`signer_role_forbidden:<role>` is the wedge's discipline.

### F10. Bot action receipt

For every bot action that mutates state on behalf of a
community member or admin (sends a binding message, posts an
on-chain commitment, makes a payment, opens a PR, …),
Freeside MUST:

1. Build a candidate `action` assertion per Hounfour's class
   shape, with the bot's signer envelope.
2. Hand the candidate to Finn's transition gate; the action's
   competence rule, quorum, timelock, and human-review
   conditions apply.
3. On allow, Finn emits `action_executed` audit event +
   `action` transition receipt. Freeside surfaces the
   receipt id + bot action result to the platform lane.
4. On deny, Freeside surfaces the deny reason; the action
   does **not** execute.

Fail-closed condition: bot action without a competent signer,
without a passing policy decision, or without a persisted
receipt → do not execute; do not pretend to execute. The
"every action has a receipt" discipline is load-bearing.

### F11. Cross-tenant recall prevention

Freeside is the *first* line of defense against cross-tenant
recall. The Freeside ingress (Discord guild, Telegram chat,
REST API key, NATS subject) is the natural place to refuse a
recall whose:

- caller's tenant boundary does not match the target estate's
  tenant boundary;
- caller's `actor_id` does not match the target estate's
  controlling actor (unless an explicit `cross-actor
  delegation` is on the keyring); or
- the request's `estate_id` is not on the Freeside allow-list
  for the caller's session.

Fail-closed condition: any tenant-boundary check failure →
deny intake with `cross_tenant_recall_refused`; emit a
Freeside-side audit log entry referencing the wedge's
`recall_denied`. Dixie / Finn / the wedge are the second /
third / fourth line; every layer refuses.

### F12. Challenged / revoked / forgotten awareness in
community surfaces

For every assertion Freeside surfaces in a bot, REST response,
or admin dashboard, the community surface MUST consult the
wedge's `Challenge` / `Revocation` / `ForgetRecord` records and
refuse to render the assertion as `active` if any of:

- a `Challenge` exists with `requested_effect: revoke` that
  has been admitted;
- a `Revocation` record exists for the assertion;
- a `ForgetRecord` exists for the assertion.

Instead, Freeside surfaces the challenge / revocation / forget
record (with its signer, reason, and timestamp) — or, in
public channels, a redacted notice that the assertion is
not active.

Fail-closed condition: governance record unparseable → render
the assertion as `excluded` with reason
`unparseable_governance_record`; never as `active`.

### F13. Tenant-admin estate inspection

For every tenant-admin estate inspection (community admin
viewing community estate counts, audit chain, assertion
status), Freeside MUST:

1. Forward the inspection request to Dixie's inspection
   surface with the caller's tenant context.
2. Render Dixie's response; respect the privacy scope (a
   community admin is **not** an `audit_review` reviewer
   unless they hold the reviewer signer key).
3. Refuse to expose `actor_private` / `sealed` material
   based on community-admin role alone — the role lets the
   admin view counts, not bodies.

Fail-closed condition: inspection that would have to expose
`actor_private` body to a community admin → refuse; surface
the count, not the body.

## Freeside responsibilities it should not own

The list below is the inverse of the responsibilities Freeside
does own. Each one belongs to a sibling repo or to the wedge
itself. Repeating them here so the PR reviewer cannot accidentally
promote Freeside into a class-lane, runtime-lane, presentation-lane,
or schema-lane authority.

- **Class validation vocabulary.** Owned by Hounfour
  (post-Phase 9). Until Hounfour ships, `loa-straylight` owns
  the TypeScript declarations. Freeside consumes; Freeside does
  not author.
- **Runtime policy enforcement.** Owned by Finn (post-Phase 10).
  Until Finn ships, the wedge owns it in-process. Freeside does
  not re-implement `policyForAdmitAssertion`,
  `policyForTransition`, `policyForRecallRequest`,
  `evaluateCompetence`, or any other decision producer.
- **Operator-facing recall / inspection surface.** Owned by
  Dixie (post-Phase 12). Freeside calls Dixie / Finn for
  governed recall; Freeside does not re-implement Dixie's BFF
  semantics on its own.
- **Local wedge primitives** (`EstateStore`, `executeRecall`,
  `dispositionFor`, `summaryFor`, `useInstructionForMark`,
  `redactReceipt`, `AuditLog.append`,
  `AuditLog.verifyChain`). Owned by `loa-straylight`
  permanently.
- **Storage adapter implementations.** `InMemoryStorage` and
  `JsonlStorage` are wedge-only fixtures. The Postgres / real-WAL
  adapter that production Freeside consumes from MUST satisfy
  [`tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts);
  the *implementation* is Finn / Dixie / Freeside's
  responsibility, but the *interface* is wedge-owned.
- **Onchain anchor adapters.** Reserved future work in
  `loa-straylight`. Freeside MAY display an anchored
  `CommitmentRoot`, but Freeside MUST NOT host the chain
  client.
- **Generic RAG / vector / keyword / graph retrieval as
  governed recall.** Owned by the runtime gate's retrievers
  (Finn-side) or by adapter modules outside Freeside.
  Retrievers plug in *behind* the wedge's prefilter, never
  above. Freeside does not bolt a vector index onto the bot
  surface and call the result a `RecallPack`.
- **Bot memory.** Bot-side conversation buffers, vector
  stores, message scrollback, and chat transcripts stay in
  Freeside, but they are **not** governed recall. They are
  Freeside-owned platform memory; the wedge / Finn / Dixie
  do not see them, and they do not enter the actor's estate
  unless they pass through the admission gate as candidate
  assertions.

## Proposed community / app surfaces

Each surface below is a candidate route / endpoint / view in
Freeside. PR-A's author may relocate them; the *surface* must
remain.

| Surface | Method (illustrative) | Wedge primitive consumed | Output |
|---|---|---|---|
| Discord bot recall | `discord:bot.recall` | `validateRecallRequest` + `policyForRecallRequest` + `executeRecall` (via Dixie / Finn) | `RecallPack` + `RecallReceipt` (or deny reason) |
| Telegram bot recall | `telegram:bot.recall` | `validateRecallRequest` + `policyForRecallRequest` + `executeRecall` (via Dixie / Finn) | `RecallPack` + `RecallReceipt` (or deny reason) |
| Tenant-admin recall | `POST /admin/recall` | `validateRecallRequest` + `policyForRecallRequest` (via Dixie / Finn) | `RecallPack` + `RecallReceipt` |
| Community-scoped recall | `GET /community/:community_id/recall` | tenant-scoped recall via Dixie / Finn | community-scoped `RecallPack` + `RecallReceipt` |
| Public-channel redaction | (middleware on every public surface) | `privacyDispositionForFrame` | exclusion summaries, never bodies |
| Discord environment-frame routing | (Discord adapter) | `EnvironmentFrame` enum | frame-tagged recall request |
| Telegram environment-frame routing | (Telegram adapter) | `EnvironmentFrame` enum | frame-tagged recall request |
| REST / NATS surface | `POST /api/v1/...`, NATS subjects | tenant-scoped routing | tenant-scoped recall / action / inspection |
| Feedback signal capture | `discord:event.ingest` / `telegram:event.ingest` / `nats:event.ingest` | `validateCandidateAssertion` + `policyForAdmitAssertion` (via Finn) | candidate `feedback_signal` admission decision |
| Admin capability grant | `POST /admin/capability/grant` | `policyForTransition` + `evaluateCompetence` (via Finn) | `permission` transition + receipt + audit event |
| Bot action with receipt | `discord:bot.action` / `telegram:bot.action` | `policyForTransition` + `evaluateCompetence` (via Finn) | `action` transition + receipt + audit event |
| Cross-tenant guard | (middleware on every surface) | tenant boundary check | accept / deny intake |
| Tenant-admin estate inspection | `GET /admin/estate/:estate_id/...` | Dixie inspection surfaces | community-admin-scoped inspection view |

## Proposed feedback-signal and admin-grant surfaces

The feedback-signal and admin-grant surfaces are the *write*
counterparts of the recall surface. They are how a Discord /
Telegram / REST / NATS event gets to enter the actor's estate
without bypassing class / policy / competence layers.

| Surface | Wedge primitive consumed | Notes |
|---|---|---|
| Per-event candidate ingest | `validateCandidateAssertion` | Maps Discord / Telegram / REST / NATS events into candidate `feedback_signal` (or platform-supplied class) — never as memory truth. |
| Per-feedback policy admission | `policyForAdmitAssertion` | Decides whether the candidate enters the estate, is held for review, or is denied. |
| Per-admin capability grant | `policyForTransition` (`grant_permission` transition) | Decides whether the admin's capability grant is admitted, denied, marked, or held for review. |
| Per-admin estate inspection | (via Dixie) | Community admins inspect counts / audit chain / assertion status; bodies stay private unless the admin holds the reviewer signer. |
| Per-bot action transition | `policyForTransition` (action / commitment transitions) | Decides whether the bot's action is admitted, denied, marked, or held for review. |

Fail-closed condition: candidate / grant / action that fails
class validation, policy validation, signer competence, or
receipt persistence → deny; surface the reason; never silently
admit.

## Proposed bot-action / admin-grant receipt surfaces

Receipts and audit events are the *durable* artifacts of the
governed-action / governed-grant flow. Freeside's bot and admin
surfaces MUST render both in a shape that the community admin or
auditor can replay.

| Display surface | Wedge primitive consumed | Output |
|---|---|---|
| Bot action receipt | `transition_receipt` (action) + `AuditEvent` | full receipt + chain ref |
| Admin capability grant receipt | `transition_receipt` (permission grant) + `AuditEvent` | full receipt + chain ref |
| Feedback signal admission receipt | `transition_receipt` (admission) + `AuditEvent` | full receipt + chain ref |
| Bot recall receipt | `RecallReceipt` (with `detail_level`) | receipt at requested detail level |
| Per-tenant audit chain head | `AuditLog.list` + `verifyChain` | tenant-scoped chain head + verify result |
| Chain-broken indicator | `AuditLog.verifyChain` failure path | break index + reason (escalated to operator) |

Fail-closed condition: a display request that would have to
synthesize a missing field (e.g. a missing `audit_hash`) →
return a "field-missing" surface, not a fabricated value.

## Proposed fail-closed behavior

Fail-closed is the load-bearing property of the community / app
surface. Every layer denies / refuses to render on uncertainty;
no layer fabricates, summarizes-as-truth, auto-promotes a
`marked` item to `included`, or admits a Discord message as
canonical estate truth.

1. **Bot recall** with unknown frame, unknown caller, or
   cross-tenant boundary mismatch → `deny`, reason
   `cross_tenant_recall_refused` /
   `unknown_environment_frame`.
2. **Bot recall response without receipt** → refuse to render
   the pack; surface the deny reason. The wedge's discipline
   ("every served pack has a receipt") travels through every
   Freeside surface.
3. **Public-channel exposure of `actor_private` body** →
   refuse the leak; surface the exclusion summary instead.
4. **Bot memory promoted to governed recall** → refuse to
   render as `RecallPack`; render as "bot context" with a
   clear "not governed recall" affordance.
5. **Discord / Telegram message admitted as canonical estate
   truth** → refuse; the platform event enters as candidate
   `feedback_signal` only.
6. **Cross-tenant recall** → deny intake; emit a
   Freeside-side audit log entry referencing the wedge's
   `recall_denied`.
7. **Cross-community private exposure** → deny; never
   multiplex `actor_private` bodies across two tenants the
   actor participates in.
8. **Capability grant by an incompetent signer** → deny;
   `signer_role_forbidden:<role>` is the load-bearing
   discipline.
9. **Bot action without a competent signer** → deny; do not
   execute; do not pretend to execute.
10. **Bot action whose receipt cannot be persisted** → deny;
    roll back the action (or, equivalently, refuse to apply
    it).
11. **Challenged / revoked / forgotten material rendered as
    `usable`** → refuse; render as `excluded` (or `marked`,
    if the wedge / Finn / Dixie said so).
12. **Engine error inside a Freeside surface** → return the
    error envelope; do **not** fabricate a partial pack /
    receipt / capability grant.

## Proposed tests

Freeside's community / app surface module MUST ship a conformance
test pack that covers every responsibility above. The fixtures
at
[`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/)
are *current-shape examples* that PR-A can adopt or import as
inputs. They are **not** the official Freeside fixtures yet; they
are the deterministic local prep the wedge ships so PR-A does not
start from scratch.

The minimum test list:

1. **Bot recall — public Discord.** A correctly shaped
   `RecallRequest` for `public_discord` is accepted by the
   bot adapter, validated, and forwarded to the runtime gate
   (via Dixie / Finn or directly to the wedge in single-process
   deployments); the fixture pins the request envelope shape
   plus the served pack + receipt.
2. **Bot recall — public Telegram.** A correctly shaped
   `RecallRequest` for `public_telegram` is accepted by the
   bot adapter, validated, and forwarded; the fixture pins
   the envelope plus served pack + receipt.
3. **Tenant-admin recall.** A tenant-admin recall (with frame
   intent `tenant_admin` mapping to `private_operator`) returns
   counts and admin-scoped views without exposing
   `actor_private` bodies the admin is not authorized to see.
4. **Denied cross-tenant recall.** A recall whose caller's
   tenant does not match the target estate's tenant is
   refused at the Freeside ingress; the fixture pins the
   Freeside-side audit log entry referencing the wedge's
   `recall_denied`.
5. **Denied private-in-public bot recall.** A bot recall in
   `public_discord` MUST exclude `actor_private` material;
   the bot adapter renders the exclusion summary, never the
   body.
6. **Denied bot-memory-as-recall.** A bot-side conversation
   buffer / vector hit list MUST NOT be rendered as a
   `RecallPack`. The fixture pins the "not governed recall"
   affordance.
7. **Feedback signal as candidate assertion.** A Discord /
   Telegram / NATS feedback event enters as candidate
   `feedback_signal`, runs class + policy validation, and
   either admits, denies, or holds for review. The fixture
   pins the candidate envelope + admission decision.
8. **Admin capability grant.** A community admin grants a
   scoped bot capability through Finn's transition gate;
   the fixture pins the `permission` transition receipt +
   audit event.
9. **Bot action with receipt.** A bot-initiated action runs
   through Finn's transition gate; the fixture pins the
   `action` transition receipt + audit event.
10. **Revoked / forgotten material excluded from bot recall.**
    A revoked or forgotten assertion is excluded from a
    public-bot recall; the audit chain still shows the
    governance record.

The handoff fixtures cover all ten cases. Filenames listed in
[§Validation commands](#validation-commands).

## Acceptance criteria

PR-A is acceptable when **every** item below is satisfied. Until
all are satisfied, `loa-straylight` keeps its locally-owned
recall / inspection / admission semantics and does not delegate
to a partial Freeside implementation.

### Structural

- [ ] **FS1.** `loa-freeside/src/straylight/` (or the equivalent
  Freeside module path) exists with the community / bot / admin
  surface layout proposed in
  [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.5 / §22.7.
- [ ] **FS2.** Freeside imports the wedge's public surface (or
  its Hounfour-extracted successor) only through the documented
  package entrypoint. No deep imports.
- [ ] **FS3.** Freeside imports Finn's runtime-gate surface (or
  its pre-Finn equivalent) only through the documented package
  entrypoint, and Dixie's BFF surface only through the
  documented package entrypoint.
- [ ] **FS4.** Freeside's bot / REST / NATS / admin surfaces run
  ingress → tenant guard → frame attach → forward to runtime
  gate / Dixie → render pack + receipt, in that order, for every
  governed recall. Every governed transition runs ingress →
  tenant guard → forward to Finn → emit receipt + audit event.
- [ ] **FS5.** Freeside does not produce a `PolicyDecision` of
  its own. The decision is upstream.

### Behavioral non-shipment

- [ ] **FS6.** Freeside does not host canonical class schemas.
  Any schema-shape change goes through Hounfour
  (post-Phase 9).
- [ ] **FS7.** Freeside does not perform runtime policy
  enforcement. Any decision goes through Finn / the wedge.
- [ ] **FS8.** Freeside does not collapse bot memory or
  generic retrieval into governed recall. A `RecallPack` only
  exists when the runtime gate served it, with a matching
  `RecallReceipt`.
- [ ] **FS9.** Freeside does not serve / display / cache /
  relay a recall response without a matching `RecallReceipt`.
- [ ] **FS10.** Freeside does not expose `actor_private` /
  `sealed` material in public bot / REST / community surfaces.
- [ ] **FS11.** Freeside does not surface
  `revoked` / `forgotten_from_recall` / `contested` material
  as ordinary active context in any community surface.
- [ ] **FS12.** Freeside does not admit Discord / Telegram /
  REST / NATS events as canonical estate truth. Events enter
  as candidate `feedback_signal` (or platform-supplied class)
  only.
- [ ] **FS13.** Freeside does not apply community / bot / admin
  actions without policy validation and receipt + audit
  emission.

### Conformance

- [ ] **FS14.** All ten fixtures in
  [`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/)
  ship in Freeside's test inputs (verbatim, or imported as a
  fixture package).
- [ ] **FS15.** For each fixture, Freeside's community surface
  produces a render that matches the fixture's
  `expected_allowed`, `expected_output`, and `reason`. Class
  shape comes from Hounfour; runtime decisions come from Finn /
  the wedge; operator-side rendering comes from Dixie; the
  *community-side render* is Freeside's.
- [ ] **FS16.** Receipts / audit events surfaced through
  Freeside validate against the wedge's
  `RecallReceipt` / `AuditEvent` shape (and against Hounfour's
  `straylight.recall_receipt.v0` /
  `straylight.audit_event.v0` once Hounfour ships).
- [ ] **FS17.** Cross-tenant recall MUST refuse at the
  Freeside ingress (first line of defense), then at Dixie /
  Finn / the wedge (second / third / fourth lines).

## Validation commands

The handoff is reproducible from `loa-straylight` today. PR-A
should be able to consume the artifacts these commands produce:

```bash
# Type-check the wedge.
npm run typecheck

# Run all wedge tests (Phase 0–14 inclusive).
npm test

# Run the recall demo (sanity check the wedge still works).
npm run demo:recall

# Run the recall demo and dump JSON output for inspection.
npm run demo:recall:json

# Re-emit Phase 6 schema-candidate fixtures.
npm run schema:candidates

# Re-emit Phase 8 Hounfour conformance vectors.
npm run hounfour:conformance

# Print the Phase 9 Hounfour handoff packet summary.
npm run hounfour:handoff

# Re-emit Phase 10 Finn runtime-enforcement fixtures.
npm run finn:enforcement

# Re-emit Phase 12 Dixie governed-recall fixtures.
npm run dixie:recall

# Re-emit Phase 14 Freeside community-surface fixtures.
npm run freeside:surface
```

`fixtures/freeside-community-surface/` holds the ten current-shape
examples PR-A should adopt as test inputs. The directory is
deterministic; running the helper twice produces byte-identical
files.

The fixtures cover:

- `bot-recall-public-discord.json`
- `bot-recall-public-telegram.json`
- `tenant-admin-recall.json`
- `denied-cross-tenant-recall.json`
- `denied-private-in-public-bot.json`
- `denied-bot-memory-as-recall.json`
- `feedback-signal-as-candidate.json`
- `admin-capability-grant.json`
- `bot-action-with-receipt.json`
- `revoked-forgotten-excluded-bot.json`

## Risks and open questions

These are the things PR-A's author should think about before
starting. None of them block filing this issue.

- **Hounfour / Finn / Dixie adoption ordering.** Phase 9
  (Hounfour), Phase 10 (Finn), and Phase 12 (Dixie) are
  prerequisites for Phase 14 (Freeside) in spirit, not in
  letter. Freeside can begin by importing the wedge's
  `types.ts` directly and calling `executeRecall` /
  `policyForX(...)` / `EstateStore` in single-process
  deployments, then swap to Hounfour shape, Finn runtime, and
  Dixie BFF as those PRs ship. The four PRs are independent in
  time but must not contradict each other in shape.
- **Tenant boundary model.** Cross-tenant recall prevention
  is a Freeside-layer responsibility (first line of defense);
  Dixie / Finn / the wedge are second / third / fourth. The
  exact shape of the tenant boundary (Discord guild? Telegram
  chat? REST tenant header? NATS subject? RLS row scope?) is
  a Freeside deployment decision; the wedge / Finn / Dixie
  refuse on cross-tenant material regardless.
- **Bot memory vs governed recall.** Bot-side memory
  (conversation buffers, vector stores, message scrollback)
  is Freeside-owned; it is **not** a Straylight estate. The
  load-bearing rule: bot memory is a Freeside affordance;
  governed recall is a wedge / Finn / Dixie affordance;
  Freeside MUST NOT collapse the two.
- **Discord / Telegram / REST / NATS frame model.** The
  wedge's `EnvironmentFrame` enum currently contains
  `private_operator`, `private_chat`, `public_discord`,
  `public_telegram`, `repo_workflow`, `tool_action_precheck`,
  and `audit_review`. Freeside-side frame intents
  (`tenant_admin`, `community_dashboard`, etc.) are
  presentation overlays that map back to existing wedge
  frames; they are **not** new wedge enum members. New wedge
  frames go through Hounfour.
- **Feedback signal class.** The wedge does not currently
  ship a `feedback_signal` class. Freeside-side feedback
  signals enter as the wedge's existing classes
  (`observation`, `experience`, `signal`, …) until Hounfour /
  Freeside agree on a `feedback_signal` shape. The
  load-bearing rule: feedback signals enter as candidate
  assertions, not as memory truth.
- **Capability grant model.** The wedge's `permission` class
  is the natural fit for community-admin capability grants.
  Freeside's grant flow MUST run through Finn's transition
  gate and emit a `transition_receipt` + audit event;
  bypassing the gate (e.g. via a Freeside-internal
  capability table that is not reflected in the actor's
  estate) would re-create the ungoverned-permission failure
  mode the wedge exists to prevent.
- **Bot action receipts.** Bot-initiated actions must run
  through Finn's transition gate. The bot's signer envelope
  is the bot's identity; the bot is **not** an authoritative
  signer for arbitrary classes. The bot's competence rule
  (which classes it may admit, transition, recall, etc.) is
  pinned in the actor's keyring, not in Freeside.
- **REST / NATS surface shape.** REST and NATS surfaces are
  Freeside-internal; the wedge / Finn / Dixie do not
  prescribe their shape. The load-bearing rule: every
  governed action goes through the runtime gate; every
  governed recall returns a receipt; every cross-tenant
  attempt is refused at ingress.
- **Operator UI vs community UI.** Dixie hosts the
  operator-facing UI; Freeside hosts the community-facing
  UI. The two are distinct but use the same wedge
  primitives. Freeside's renderer MUST NOT derive its own
  privacy decisions; it consumes the wedge / Finn / Dixie
  output and renders accordingly.
- **No PRD / SDD / sprint planning artifact** is requested by
  this handoff. Freeside's process for adopting these
  primitives is Freeside's choice.

## Cross-references

- [`docs/handoffs/freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md)
  — companion boundary doc (what Freeside owns vs what it
  must not own).
- [`docs/handoffs/freeside-surface-mapping.md`](./freeside-surface-mapping.md)
  — mapping table from Straylight primitives / operations to
  proposed Freeside community / bot / admin / tenant surfaces.
- [`docs/handoffs/dixie-governed-recall-issue.md`](./dixie-governed-recall-issue.md)
  — Phase 12 Dixie issue handoff (BFF / inspection lane).
- [`docs/handoffs/dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)
  — Phase 12 Dixie boundary doc.
- [`docs/handoffs/dixie-recall-mapping.md`](./dixie-recall-mapping.md)
  — Phase 12 Dixie mapping (BFF / inspection lane).
- [`docs/handoffs/finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md)
  — Phase 10 Finn issue handoff (runtime lane).
- [`docs/handoffs/finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  — Phase 10 Finn boundary doc.
- [`docs/handoffs/finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
  — Phase 10 Finn mapping (runtime lane).
- [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — Phase 9 Hounfour issue handoff (class lane).
- [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  — Phase 9 Hounfour PR checklist (class lane).
- [`docs/handoffs/hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
  — Phase 9 Hounfour mapping (class lane).
- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
  §6.2.5, §16.1, §16.2, §22.7 — architectural recommendations
  for the Freeside community / app surface module.
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md) —
  the wedge's stable public API surface.
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  wedge's fail-closed defenses, which Freeside's community
  surface MUST preserve.
- [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant. Freeside surfaces
  the policy-lane output to community members; it does not
  collapse the boundary.
- [`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/)
  — ten current-shape JSON examples (Freeside PR-A test
  inputs).
