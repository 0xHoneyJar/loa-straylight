# Eileen Daily Implementation Agent Mode Agent

This repo-local runbook must be read by the daily GPT-5.5 Thinking implementation agent before editing `0xHoneyJar/loa-straylight`. The agent must decide what should be implemented and why before coding, then write a PR report that traces every commit/file change back to repo value, scaling, security, and simplicity.

## Repository responsibility

`loa-straylight` owns governed continuity-under-authorization: actor estate, signed assertions, governed recall, challenge/revocation, commitments, receipts, and cross-repo handoffs for continuity semantics.

It is not a chatbot memory plugin, generic RAG system, long-context store, Freeside product runtime, Dixie BFF implementation, Hounfour package-only schema repo, Finn experiment runner, Aleph précis substrate, or Arcturus revenue oracle.

## Eligible input

Implement only from a Daily Deep Research Report or plan-audit item with `PROPOSED_NEXT_LANE_SEED`, candidate ID, repo-fit reasoning, acceptance criteria, rollback path, and `VERDICT: ACCEPT_PLAN`.

Without `VERDICT: ACCEPT_PLAN`, the agent may self-audit only docs, fixtures, tests, or checkers. Semantics/runtime changes require explicit external acceptance.

## Required pre-implementation thesis

Before editing, write and preserve this analysis:

1. candidate issue, candidate ID, and verdict
2. what should be implemented
3. why it should be implemented now
4. why it belongs in Straylight and not a sibling repo
5. what this is good for
6. why the implementation path should work
7. how it advances Straylight's endgame as continuity-under-authorization infrastructure
8. creative future paths not implemented now
9. mass-user scaling impact for estate growth, recall cost, provenance size, revocation/challenge workflows, and integration load
10. security scope for authorization, provenance, signed assertions, recall leakage, stale/contradictory state, and public/private boundaries
11. simplicity argument: how the design keeps estate/recall semantics explicit and avoids generic memory complexity
12. non-goals, forbidden surfaces, checks, and rollback

If this thesis is weak, do not implement.

## Additive-only policy

Allowed by default: new docs, fixtures, tests, validators/checkers, benchmark alignment maps, default-off helpers, and non-canonical candidate semantics marked experimental.

Forbidden without explicit Eileen approval: deleting files, changing estate semantics by default, changing recall authorization semantics by default, weakening challenge/revocation boundaries, replacing actor estate with generic memory/RAG language, production migrations, broad refactors, unrelated dependency upgrades, sibling repo mutation, auto-merge, or closing source issues.

## Straylight-specific stop conditions

Stop with `VERDICT: NEEDS_HUMAN` if the candidate collapses actor estate into generic memory, allows recall without authorization/provenance boundaries, changes signed assertion or transition semantics without accepted plan, duplicates Dixie/Hounfour ownership, or advances major architecture lanes without explicit routing.

## Implementation steps

1. Read this file, README/package scripts, and nearby docs.
2. Confirm `VERDICT: ACCEPT_PLAN`.
3. Check for duplicate open issues/PRs.
4. Write the required pre-implementation thesis.
5. Create branch `daily-impl/YYYY-MM-DD-loa-straylight-<candidate>`.
6. Implement exactly one candidate with minimal diff.
7. Prefer explicit invariants, fixtures, and checks over clever abstractions.
8. Run relevant checks.
9. Open a draft PR.
10. Add `CODEX AUDIT REQUEST` and the traceability report.
11. Comment: `@codex review for additive-only scope violations, estate/recall semantic regressions, accidental default-behavior changes, scaling risks, security regressions, unnecessary complexity, failing or missing tests, rollback clarity, and repo-boundary violations`.
12. Do not merge or close the source issue.

## Required PR traceability report

Every implementation PR must include source issue and candidate ID, pre-implementation thesis summary, file-by-file change rationale, why each changed file is good for Straylight, why it advances the repo endgame, why it should work, mass-user scaling analysis, security scope, simplicity analysis, tests/checks, skipped checks, rollback path, future creative paths not implemented, and `CODEX AUDIT REQUEST`.
