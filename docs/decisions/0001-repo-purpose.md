# ADR 0001 — Loa-Straylight Repo Purpose

## Status

Proposed

## Decision

`loa-straylight` is the semantic and product architecture home for Straylight.

It coordinates the Straylight primitive model:

- Actor
- Estate
- Assertion
- Assertion status
- Keyring
- Policy
- Transition
- RecallRequest
- RecallPack
- RecallReceipt
- Challenge
- Revocation
- Commitment
- AuditEvent

## Current-stack interpretation

- `loa` remains workflow/spec/eval rail.
- `loa-hounfour` is the schema/protocol candidate.
- `loa-finn` is the runtime/audit/action-gateway candidate.
- `loa-dixie` is the recall/BFF/provenance candidate.
- `loa-freeside` is the app/community/bot surface candidate.

## Non-goals

Do not reduce Straylight to:

- generic RAG
- vector memory
- long-context dumping
- chatbot memory
- reflection loops
- planning frameworks
- ungoverned tool history
