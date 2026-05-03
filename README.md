# Loa-Straylight

**Governed continuity layer for persistent AI agents: memory, intent, identity, provenance, permissions, and commitment-aware recall.**

Straylight is the hidden architecture of agent memory for the intent era of AI.

It gives persistent agents a governed memory estate: a structured way to remember what happened, understand what was meant, preserve who an agent is, track what was promised, know what can be recalled, and decide what should change over time.

Straylight is not a chatbot memory plugin.

It is not just RAG, vector search, long context, planning, reflection, or tool history.

Straylight is a future-facing memory architecture for agents that need continuity across conversations, tools, workflows, communities, organizations, assets, and other agents.

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
- something that was learned
- something that was preferred
- something that was approved
- something that was promised
- something that should affect future behavior
- something that should be forgotten

Without these distinctions, agent memory becomes brittle, unsafe, expensive, overly literal, or impossible to govern.

Straylight exists to make agent memory governable.

## Core thesis

The future of agent memory is not bigger context.

The future is governed continuity.

A memory is not automatically a belief.

A belief is not automatically an instruction.

An instruction is not automatically a plan.

A plan is not automatically permission to act.

An action is not automatically a commitment.

A commitment is not automatically permanent.

Straylight separates these layers so agents can persist over time without being controlled by everything they have ever seen, said, inferred, or done.

## The intent era of AI

In the intent era, agents do not only answer prompts.

They interpret direction, preserve context, infer goals, coordinate with tools, act across time, and learn from outcomes.

This requires memory systems that understand more than similarity.

Old memory systems ask:

> What context should I retrieve?

Straylight asks:

> What does this agent know, believe, intend, remember, doubt, owe, inherit, trust, have permission to use, and need to learn from?

That is the difference between memory and continuity.

## Future layers of agent memory

Straylight organizes agent memory into multiple layers.

Each layer has different rules for storage, retrieval, permission, decay, and actionability.

### 1. Event memory

Event memory records what happened.

This includes messages, tool calls, API responses, file changes, social activity, transactions, user actions, agent actions, external events, and system outputs.

Event memory is the raw material of continuity.

But an event is not automatically meaningful.

Straylight treats events as evidence candidates, not permanent beliefs.

### 2. Experience memory

Experience memory turns events into episodes.

It records what an agent lived through, attempted, completed, failed, repeated, or learned from.

An experience may contain:

- the original situation
- the agent’s intent
- the relevant context
- the action taken
- the outcome
- the lesson learned
- whether that lesson is reliable

Experience memory is how agents become better over time without simply saving every interaction forever.

### 3. Identity memory

Identity memory preserves who the agent is.

It includes the agent’s role, style, boundaries, inherited traits, behavioral patterns, owner or community context, and long-term self-model.

Identity is not just personality.

Identity defines what kind of agent this is, what it represents, what it should preserve, and how experience may change its expression over time.

Straylight allows identity to evolve without letting random memories rewrite the agent.

### 4. Intent memory

Intent memory records what someone appeared to mean or want.

Intent may come from a user, agent, organization, community, application, protocol, or environment.

Intent can be explicit, inferred, temporary, persistent, confirmed, disputed, stale, private, public, actionable, or non-actionable.

This is one of Straylight’s most important layers.

It prevents agents from confusing:

- brainstorming with instruction
- research with approval
- preference with command
- draft with roadmap
- context with commitment
- one-time request with permanent memory

Intent memory allows agents to remember meaning, not just words.

### 5. Commitment memory

Commitment memory records what has been promised, approved, authorized, voted on, agreed to, constrained, or made binding.

A commitment is stronger than a memory.

Commitments may include:

- promises
- approvals
- votes
- signed decisions
- accepted tasks
- budget authorizations
- policy constraints
- permission grants
- review requirements
- agreements between agents or users

Straylight treats commitments as special objects that require provenance, permissions, and clear rules for recall, execution, revision, and revocation.

### 6. Relationship memory

Relationship memory tracks the agent’s understanding of people, agents, organizations, communities, tools, assets, workflows, and social context.

This layer helps agents understand:

- who is connected to whom
- who has authority
- who has context
- who collaborates well
- who has contributed before
- who has made commitments
- who should or should not see certain memory
- which relationships are stale, active, trusted, or risky

Relationship memory is what lets agents become socially and operationally aware.

### 7. Reflective memory

Reflective memory is higher-order memory.

It is created when an agent reviews multiple events, experiences, outcomes, or contradictions and forms a structured interpretation.

Reflection can identify:

- repeated patterns
- stale beliefs
- unresolved assumptions
- successful strategies
- recurring failures
- identity drift
- contradictory memories
- new risks
- useful generalizations

Reflection should not be uncontrolled self-modification.

Straylight treats reflection as a reviewable memory object that may be accepted, rejected, revised, decayed, or consolidated.

### 8. Governance memory

Governance memory defines what the agent is allowed to remember, reveal, mutate, retrieve, believe, plan, or do.

It includes:

- permissions
- consent
- privacy boundaries
- role constraints
- budget constraints
- access control
- escalation rules
- review requirements
- forgetting rules
- memory mutation rules
- action boundaries

Governance memory prevents persistent agents from becoming uncontrolled continuity machines.

### 9. Provenance memory

Provenance memory records where knowledge came from.

Every important memory, belief, intent trace, plan, action, or commitment should be traceable to its source.

A memory should know whether it came from:

- a user message
- a document
- a research packet
- a tool call
- an API response
- an external source
- a repository
- an event
- a transaction
- another agent
- an inference
- a reflection

Without provenance, persistent agents become difficult to trust.

### 10. Living memory graph

Straylight does not treat memory as a pile of stored chunks.

It treats memory as a living graph.

New memories can update the meaning of older memories.

Repeated events can become patterns.

Patterns can become reflections.

Reflections can become consolidated beliefs.

Consolidated beliefs can affect retrieval, identity, planning, and action.

Stale memories can decay.

False memories can be challenged.

Private memories can remain hidden.

Binding memories can become commitments.

The memory graph evolves, but it remains governed.

## Research as memory input

Straylight treats research as a first-class memory input.

Research conversations, notes, documents, and packets may contain:

- confirmed findings
- uncertain claims
- useful context
- speculative ideas
- product opportunities
- technical assumptions
- unresolved questions
- user preferences
- future directions
- things that need verification

But research should not automatically become instruction.

A research finding can be remembered without becoming a product requirement.

A product idea can be tracked without becoming roadmap.

A technical assumption can be useful without becoming truth.

A user preference can be noted without becoming permanent identity.

Straylight preserves the difference between exploration and commitment.

## Memory object types

Straylight separates continuity into different object types.

### Observation

Something the agent perceived.

### Event

Something that happened.

### Evidence

Source-backed context that may support a claim.

### Claim

A statement that may be true, false, partial, stale, or disputed.

### Assumption

A working belief used for reasoning but not yet verified.

### Preference

A tendency or desire expressed by a user, group, application, or agent.

### Intent trace

A structured record of what someone appeared to mean or want.

### Experience

A meaningful episode composed from events, actions, context, and outcomes.

### Plan

A possible route from intent to action.

### Action trace

A record of what the agent did, why it did it, and what happened next.

### Decision

A chosen direction.

### Commitment

A binding or semi-binding agreement, approval, vote, promise, budget, or constraint.

### Reflection

A higher-order interpretation produced from multiple memories.

### Consolidation

A durable update produced from repeated evidence or reviewed reflection.

### Identity marker

A stable or semi-stable feature of an agent’s role, self-model, style, traits, or behavioral pattern.

## The hidden architecture

Straylight is the hidden architecture beneath visible agent behavior.

Users may see agents acting through chat, applications, APIs, social platforms, repositories, games, workflows, markets, or autonomous systems.

But underneath that behavior is a deeper structure:

- what the agent perceived
- what it remembered
- what it retrieved
- what it ignored
- what it inferred
- what it believed
- what it intended
- what it planned
- what it was allowed to do
- what it actually did
- what it learned
- what it should forget
- what it must preserve

That hidden architecture is Straylight.

It is not hidden because the code is secret.

It is hidden because it governs the internal estate of agent continuity beneath visible action.

## Memory estate model

Straylight can be understood as a memory estate with rooms.

### The Gate

Perception, access control, consent, redaction, and permission boundaries.

### The Archive

Long-term memory, experience history, durable context, and historical records.

### The Index

Retrieval, embeddings, ranking, filtering, recall policy, and context selection.

### The Mirror

Reflection, self-modeling, identity synthesis, personality drift, and behavior change over time.

### The Court

Commitments, approvals, votes, disputes, constraints, agreements, reviews, and signed decisions.

### The Map

Relationships between users, agents, organizations, communities, tools, assets, tasks, workflows, and commitments.

### The Workshop

Planning, simulation, tool preparation, task decomposition, and action design.

### The Ledger

Provenance, audit trails, action traces, tool traces, memory writes, model-cost traces, and verifiable events.

### The Vault

Private, sensitive, owner-bound, confidential, or permissioned memory.

## Why this is not old-school agent memory

Old-school agent memory is mostly about remembering useful context.

Straylight is about governing continuity.

| Old-school memory | Straylight |
|---|---|
| Stores facts | Separates events, claims, assumptions, intent, identity, and commitments |
| Retrieves similar chunks | Recalls based on relevance, provenance, permissions, cost, risk, and actionability |
| Treats memory as context | Treats memory as continuity |
| Saves preferences | Classifies whether preferences are temporary, durable, inferred, or confirmed |
| Summarizes conversations | Converts context into evidence, claims, assumptions, intent traces, and experiences |
| Optimizes for recall | Optimizes for governed action |
| Focuses on the prompt | Focuses on the agent’s long-term coherence |
| Learns by accumulating | Learns by consolidating, challenging, decaying, and forgetting |

## Design principles

Observe broadly.

Classify carefully.

Remember selectively.

Retrieve purposefully.

Infer transparently.

Plan reversibly.

Act permissionfully.

Reflect honestly.

Learn gradually.

Commit explicitly.

Forget deliberately.

## What Straylight prevents

Straylight is designed to reduce common failures in persistent agents:

- treating every memory as instruction
- treating brainstorming as approval
- treating research as roadmap
- treating assumptions as facts
- treating plans as commitments
- acting without permission
- recalling private context in public outputs
- overloading prompts with irrelevant memory
- losing track of why an action happened
- forgetting important prior direction
- overfitting to stale user preferences
- allowing bad memories to poison future behavior
- self-modifying without review
- learning from outcomes without provenance
- confusing personality with identity
- confusing identity with permission

## Product direction

Straylight is designed to be implemented with the Loa stack.

The architecture can be general to all persistent agents, while the first product implementation can use Loa for:

- runtime execution
- memory reads and writes
- model routing
- budget-aware recall
- schema validation
- commitment objects
- provenance records
- agent review workflows
- community and dNFT-based agent identity
- tool and action traces

The README defines the future architecture.

The product spec defines how this becomes a working product.

## Non-goals

Straylight is not:

- a generic chatbot memory plugin
- a simple vector database wrapper
- an ungoverned RAG layer
- a transcript archive
- a planner by itself
- a tool-use framework by itself
- a personality engine by itself
- a replacement for human review
- a place to permanently save every interaction
- a system that assumes more memory is always better
- a system that treats all agent behavior as autonomous by default

## Initial focus

The initial focus of Straylight is defining the primitives for governed agent continuity:

- event memory
- experience memory
- identity memory
- intent memory
- commitment memory
- relationship memory
- reflective memory
- governance memory
- provenance memory
- living memory graph
- recall policy
- consolidation flows
- forgetting and decay rules

Storage adapters, runtime APIs, agent-framework integrations, and Loa-specific implementations can be built on top of these primitives.

## Status

Straylight is an architecture and implementation surface for the intent era of AI.

It is built for agents that need to persist across conversations, tools, workflows, organizations, communities, repositories, applications, assets, markets, and other agents.

The goal is not to help agents remember everything.

The goal is to help agents remember the right things, understand what they mean, know what can be acted on, and remain coherent over time.
