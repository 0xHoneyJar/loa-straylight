# Loa-Straylight

**Continuity-under-authorization for persistent AI agents: signed memory, governed recall, challenge, revocation, and commitments.**

> **MVP status (Phase 5 + Phase 6 + Phase 7 + Phase 8 + Phase 9 +
> Phase 10 + Phase 12).** Local-only, in-repo Recall Wedge. Public
> entrypoint: `src/straylight/index.ts`. Run `npm run typecheck`,
> `npm test`, `npm run demo:recall`, `npm run demo:recall:json`,
> `npm run schema:candidates` (Phase 6 — writes current-shape
> examples to `fixtures/schema-candidates/`; not canonical Hounfour
> schemas), `npm run hounfour:conformance` (Phase 8 — writes local
> Hounfour conformance vectors to `fixtures/hounfour-conformance/`;
> not canonical Hounfour schemas, intended as future Hounfour test
> inputs), `npm run hounfour:handoff` (Phase 9 — prints the
> Hounfour extraction issue / PR handoff packet under
> `docs/handoffs/`; this is **handoff prep**, not Hounfour
> integration), `npm run finn:enforcement` (Phase 10 — writes
> local Finn runtime-enforcement fixtures to
> `fixtures/finn-runtime-enforcement/`; not official Finn fixtures,
> intended as future Finn test inputs; this is **handoff prep**, not
> Finn integration), or `npm run dixie:recall` (Phase 12 — writes
> local Dixie governed-recall / BFF / inspection fixtures to
> `fixtures/dixie-governed-recall/`; not official Dixie fixtures,
> intended as future Dixie BFF test inputs; this is **handoff prep**,
> not Dixie integration). See
> [`docs/mvp/straylight-recall-wedge.md`](docs/mvp/straylight-recall-wedge.md)
> for what each phase proves,
> [`docs/mvp/package-boundary.md`](docs/mvp/package-boundary.md)
> for the stable API surface,
> [`docs/mvp/threat-model.md`](docs/mvp/threat-model.md)
> for fail-closed defenses,
> [`docs/schema-candidates/`](docs/schema-candidates/) for Phase 6 / 7 / 8
> schema-extraction prep, and
> [`docs/handoffs/`](docs/handoffs/) for the Phase 9 Hounfour
> extraction handoff packet, the Phase 10 Finn runtime-enforcement
> handoff packet, and the Phase 12 Dixie governed-recall / BFF
> handoff packet (issue drafts + PR checklists + mapping tables +
> boundary docs — none of which is filed against `loa-hounfour`,
> `loa-finn`, or `loa-dixie` yet).


Straylight is the hidden estate architecture for intent-era agents.

It gives each persistent actor a governed state-of-record that exists before any session, outlives any session, and is read from or written to through signed, authorized transitions.

Straylight is not a chatbot memory plugin.

It is not just RAG, vector search, long context, planning, reflection, or tool history.

Straylight is a thin control plane over a governed agent estate: a substrate where assertions are admitted, classified, linked, challenged, inherited, forgotten, recalled, and committed without allowing memory to automatically become belief, instruction, action, or permanence.

## Core thesis

The future of agent memory is not bigger context.

The future is governed continuity.

A memory is not automatically a belief.

A belief is not automatically an instruction.

An instruction is not automatically a plan.

A plan is not automatically permission to act.

Permission is not automatically action.

Action is not automatically commitment.

Commitment is not automatically permanence.

Straylight separates these transitions so persistent agents can remember, reason, act, and learn without being controlled by everything they have ever seen, said, inferred, or done.

## The invariant

The invariant of Straylight is the estate.

Each actor has a persistent, governed estate that is not reducible to the current conversation, prompt, context window, vector search result, or runtime session.

The estate precedes the conversation and outlives it.

Every session is a read-write against a state-of-record it did not create.

That estate may contain memories, identities, intents, relationships, permissions, commitments, claims, assumptions, experiences, reflections, and action traces.

But the estate itself is the substrate.

Memory is what a session has.

An estate is what an actor has.

## Why Straylight exists

Most AI memory systems are still built around retrieval.

They store messages, embed documents, search for similar context, and place retrieved chunks back into a prompt.

That is useful, but it is not enough for persistent agents.

Long-lived agents need to distinguish between:

- something that happened
- something that was observed
- something that was said
- something that was meant
- something that was assumed
- something that was believed
- something that was instructed
- something that was planned
- something that was permitted
- something that was done
- something that was promised
- something that became binding
- something that should be challenged
- something that should be forgotten
- something that must remain auditable

Without these distinctions, agent memory becomes brittle, unsafe, expensive, overly literal, or impossible to govern.

Straylight exists to make agent continuity governable.

## The intent era of AI

In the intent era, agents do not only answer prompts.

They interpret direction, preserve context, infer goals, coordinate with tools, act across time, and learn from outcomes.

This requires memory systems that understand more than similarity.

Old memory systems ask:

> What context should I retrieve?

Straylight asks:

> What does this actor know, believe, intend, remember, doubt, owe, inherit, trust, have permission to use, and need to learn from?

The shift is not simply that memory becomes smarter.

The shift is that memory stops being the only primitive.

Straylight treats memory as one part of a governed estate.

## Hidden architecture

Straylight is hidden architecture.

It is not hidden because the code must be secret.

It is hidden because it governs the internal estate beneath visible agent behavior.

Users may see agents acting through chat, applications, APIs, social platforms, games, repositories, workflows, organizations, markets, or autonomous systems.

But underneath that behavior is a deeper structure:

- what the agent perceived
- what it admitted into memory
- what it classified
- what it linked
- what it challenged
- what it recalled
- what it ignored
- what it inferred
- what it believed
- what it intended
- what it planned
- what it was allowed to do
- what it actually did
- what it committed to
- what it revoked
- what it must preserve
- what it should forget

That hidden architecture is Straylight.

## Public anchors, hidden estate

Straylight is designed for hidden memory with public anchors.

The full estate may live offchain: private, encrypted, mutable, contextual, and permissioned.

Public infrastructure may anchor:

- actor identifiers
- controller keys
- memory roots
- schema versions
- signed permissions
- commitment hashes
- revocations
- audit checkpoints
- payment records
- verification proofs

The chain does not need to store the memory.

The chain can identify the actor, verify the commitment, and anchor the proof.

In this model:

> Offchain memory.  
> Onchain identifiers.  
> Hidden estate.  
> Public commitments.

## Actor estates

An actor estate is the persistent state-of-record for an agent, user, organization, community, application, protocol, or other agentic actor.

An estate may contain:

- memories
- events
- experiences
- claims
- assumptions
- preferences
- identity markers
- intent traces
- relationship records
- permissions
- plans
- action traces
- decisions
- commitments
- challenges
- revocations
- reflections
- consolidations
- provenance records
- audit trails

The estate is not reconstructed from context on every wake.

It is referenced.

The actor does not become continuous because a session retrieved old text.

The actor becomes continuous because every session is instantiated against a governed estate.

## Assertions

Everything admitted into an estate is an assertion.

An assertion is a signed, typed, inspectable statement about the actor’s estate.

Assertions may represent:

- an observation
- an event
- a claim
- an assumption
- a preference
- an intent
- an experience
- an identity marker
- a relationship
- a permission
- a plan
- an action
- a decision
- a commitment
- a challenge
- a revocation
- a reflection
- a consolidation

Assertions are not automatically true, active, usable, or binding.

Their force depends on class, provenance, status, policy, signatures, and authorized transitions.

## Class validation and policy validation

Straylight separates class validation from policy validation.

### Class validation

Class validation asks whether an assertion is structurally valid.

It checks:

- schema version
- required fields
- field types
- assertion class
- actor identifier
- signature format
- provenance references
- timestamp structure
- hash integrity

Class validation answers:

> Is this a legible citizen of the estate?

It does not decide whether the assertion should be accepted.

### Policy validation

Policy validation asks whether a valid assertion is authorized.

It checks:

- who signed the assertion
- whether the signer is recognized
- whether the signer is competent for this transition
- whether the transition is allowed under current estate state
- whether quorum, timelock, delegation, or revocation rules apply
- whether conflicting signatures exist
- whether permissions are still active
- whether the move is legal right now

Policy validation answers:

> Is this move allowed?

Class validation is structural.

Policy validation is semantic.

Both are required.

## The keyring

Straylight does not assume one global authority.

Different transitions may require different signers.

The keyring defines who is competent to authorize each transition.

Examples:

| Transition | Possible signers |
|---|---|
| Observation → memory | agent, runtime, ingestion policy |
| Memory → belief | agent, reviewer, confidence policy |
| Belief → instruction | user, operator, governor |
| Instruction → plan | agent, planner, workflow policy |
| Plan → permission | owner, admin, quorum, budget policy |
| Permission → action | runtime gate, tool policy |
| Action → commitment | signer, wallet, quorum, protocol |
| Commitment → permanence | higher authority, timelock, supermajority |

Plurality does not break the invariant.

Ambiguity does.

For any transition, the competent signers and disagreement-resolution rule must be explicit, inspectable, and queryable before the transition occurs.

## Estate verbs

Straylight exposes a small set of primitive estate verbs.

These verbs form the thin control plane.

### Admit

Introduce a new assertion into the estate.

### Classify

Assign or update the assertion’s class, status, or epistemic role.

### Link

Connect assertions to each other through provenance, support, contradiction, inheritance, dependency, sequence, or relationship.

### Challenge

Contest an assertion without deleting it.

Challenge is the honesty mechanism of the estate.

### Inherit

Carry forward identity, permission, memory, or commitment across actors, sessions, versions, environments, or ownership structures.

### Forget

Make an assertion unavailable to ordinary recall under defined rules without necessarily erasing the audit trail.

### Recall

Return usable estate context for a given actor, intent, task, permission scope, and risk profile.

These verbs are intentionally small.

Higher-level APIs may compose them, but the control plane should remain thin.

## Control plane, not API-first

An API is a surface.

A control plane is a seam.

APIs can be ergonomic, opinionated, and specialized for different users.

The control plane should remain narrow, stubborn, and primitive.

A developer API may expose:

- create memory
- search context
- summarize session
- approve plan
- revoke permission
- generate recall pack

But underneath, those operations should resolve into the same estate verbs:

- admit
- classify
- link
- challenge
- inherit
- forget
- recall

Wide, mobile APIs.

Narrow, stubborn control plane.

## Memory classes

Straylight separates memory classes from functions over memory.

### Core classes

The initial estate classes may include:

- event
- experience
- claim
- assumption
- preference
- identity
- intent
- relationship
- plan
- permission
- action
- decision
- commitment
- challenge
- revocation
- reflection
- consolidation

Each class should have a schema, status model, provenance requirements, and policy hooks.

### Cross-cutting functions

Some concepts are not classes by default.

They operate across classes.

Examples:

- provenance
- governance
- retrieval
- reflection
- consolidation
- audit
- living memory graph

Provenance belongs on every assertion.

Governance adjudicates transitions.

Reflection may produce assertions, but it also operates across assertions.

The living memory graph emerges from linking.

This distinction keeps Straylight from becoming a taxonomy that re-litigates itself every time a new capability is added.

## Challenge, demotion, and revocation

Straylight must support challenge, demotion, and revocation without rewriting history.

### Challenge

A challenge contests an assertion.

It does not delete the original.

The challenge is admitted as its own assertion, linked to the original.

The original may become contested, demoted, or reduced in confidence.

### Demotion

Demotion reduces the forward authority of an assertion.

A belief may demote into memory.

An instruction may demote into preference.

A permission may demote into a plan.

A commitment may stop being forward-binding.

Demotion should leave a trace.

### Revocation

Revocation withdraws future authority.

Revocation is not erasure.

A revoked assertion may be unavailable to normal recall, but it must remain provable through audit when appropriate.

The estate must be able to say:

> This existed.  
> This was challenged.  
> This was demoted.  
> This was revoked.  
> This is no longer active.  
> This was not erased.

If the estate cannot reconstruct why a state changed, it has lost continuity.

## Promotion and demotion boundaries

Straylight treats promotion and demotion as governed transitions.

The core boundary chain is:

```text
memory
  → belief
  → instruction
  → plan
  → permission
  → action
  → commitment
  → permanence
