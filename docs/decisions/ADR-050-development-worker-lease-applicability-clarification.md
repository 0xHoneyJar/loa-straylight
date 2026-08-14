# ADR-050 Clarification — Development-Worker Lease Applicability Boundary

_Status: clarification to `ADR-050 — Autonomous Execution Control Plane v1`._  
_Parent context: `docs/decisions/ADR-050-autonomous-execution-control-plane.md` §5.2 Work leases._  
_Scope: development-control-plane semantics only; this document does not alter Straylight estate semantics or authorize implementation work._

## Clarification

The work lease defined by ADR-050 is a **development control-plane coordination mechanism**. It is not a Straylight estate permission, and the Claude, Codex, ChatGPT, and GitHub Actions roles participating in this control plane are not thereby Straylight-governed actors.

ADR-050 coordinates systems that are building Straylight. It does not claim those systems are already running inside the finished Straylight authorization architecture.

This distinction matters because the control-plane lease policy is intentionally operational. Its duration, renewal behavior, watchdog behavior, retry routing, and other parameters may be changed to suit the development environment without changing Straylight product doctrine. The current automation policy configures `lease_duration_minutes` as `240`; that value is a control-plane policy choice, not a four-hour Straylight authorization rule.

An expired development lease therefore means:

> the holder no longer has authority, under this control-plane policy, to advance the durable lane using that expired lease.

It does **not** mean:

- every future Straylight permission must expire after the same interval;
- a model's internal reasoning or session must terminate when the coordination lease expires;
- current development workers have adopted Straylight runtime semantics;
- the development control plane is itself proof of a complete Straylight authorization system.

## Implementation-derived architecture evidence

The lease mechanism nevertheless provides useful evidence for a Straylight authorization invariant.

When a development lease expires:

1. the historical lease remains part of the durable record;
2. work validly performed while the lease was active is not rewritten out of history;
3. the expired lease no longer carries forward authority;
4. a stale completion cannot acquire force merely because the actor once held the lease;
5. continuation requires a fresh authorized transition;
6. watchdog recovery and subsequent lease acquisition make the interruption and renewed authority inspectable.

This is the same architectural shape Straylight should preserve when a future permission, delegation, controller authority, capability, or other authorization ceases to carry forward force:

> **Past authorization remains historical evidence; present action requires present authority.**

The analogy stops there. Development leases remain control-plane policy until an explicit Straylight architecture decision, implementation, proof, and operator acceptance adopt corresponding semantics into the product runtime.

## Development-policy consequence

Because current Claude, Codex, ChatGPT, and GitHub Actions workers have not adopted Straylight runtime governance merely by participating in ADR-050, development lease parameters should be evaluated as development ergonomics and concurrency/recovery controls.

Changing a lease duration or introducing a bounded renewal/heartbeat mechanism for development workers would therefore require ordinary control-plane authorization and audit, but it would not weaken the product invariant above. The invariant is not that authorization must expire after a particular number of minutes. The invariant is that once the governing authorization boundary has been crossed, forward authority cannot be inferred from historical authority alone.

A future Straylight-native renewal mechanism should itself be modeled as an explicit governed transition rather than an invisible extension of stale permission. Such a transition may reference a prior grant, but current state, policy, signer competence, revocation state, environment, risk, and requested scope must be evaluated anew.

## Addendum — how a lease duration change is now made (policy v2)

Under control-plane policy v2 (`ADR-050 §5.4`), `lease_duration_minutes` is an **admission** parameter versioned by epoch, not a single live value. The current admission epoch configures it as `240`, and this addendum does not change that.

Changing it is done by **appending a new admission epoch** carrying the new duration and its own operator authorization, never by editing the existing entry. The consequence is that a duration change bounds future lease grants only: every lease already recorded was adjudicated under the epoch in force at the authenticated time it was granted, and stays adjudicated that way on every later replay.

This is the same invariant this clarification already states, now mechanically enforced rather than merely intended:

> Past authorization remains historical evidence; present action requires present authority.

A longer development lease duration may therefore be authorized as a later epoch once the epoch migration has proven stable. That is an ordinary control-plane authorization and audit, and it is deliberately not part of the migration that introduced the mechanism.
