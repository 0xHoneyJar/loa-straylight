# Eileen Daily Implementation Agent Mode Agent

This file is the repo-local runbook for the daily GPT-5.5 Thinking implementation agent. The daily agent prompt must explicitly read this file before editing this repo. This file is intentionally separate from `AGENTS.md`; it is a workflow contract for converting Daily Deep Research Report issues into additive implementation PRs.

## Repository responsibility

`0xHoneyJar/loa-straylight` owns governed continuity-under-authorization: actor estate, signed assertions, governed recall, challenge/revocation, commitments, receipts, and cross-repo handoffs for continuity semantics.

This repo is not a chatbot memory plugin, generic RAG system, long-context store, Freeside product runtime, Dixie BFF implementation, Hounfour package-only schema repo, Finn experiment runner, Aleph précis substrate, or Arcturus revenue oracle.

## Eligible input

Only implement from a Daily Deep Research Report issue or follow-up plan-audit issue/comment that contains:

- `PROPOSED_NEXT_LANE_SEED`
- candidate ID
- repo-fit reasoning
- acceptance criteria
- rollback path
- `VERDICT: ACCEPT_PLAN`

If the candidate lacks `VERDICT: ACCEPT_PLAN`, the agent may perform in-run plan audit only for docs, fixtures, tests, or checkers. Semantics/runtime changes require explicit external acceptance.

## Selection rule

Pick at most one candidate per run. Prefer work that strengthens estate invariants, recall authorization evidence, challenge/revocation reasoning, fixtures, or doctrine alignment without changing default runtime behavior.

Priority order:

1. docs-only doctrine/alignment maps
2. fixture-only estate/recall examples
3. test-only invariant coverage
4. checker/validator-only additions
5. experimental default-off helpers

## Additive-only policy

Nothing currently working may stop functioning.

Allowed by default:

- new docs
- new fixtures
- new tests
- new validators/checkers
- benchmark alignment maps
- default-off experimental helpers
- non-canonical candidate semantics marked experimental

Forbidden without explicit Eileen approval:

- deleting files
- changing estate semantics by default
- changing recall authorization semantics by default
- weakening challenge/revocation boundaries
- replacing actor estate with generic memory/RAG language
- production migrations
- broad refactors
- unrelated dependency upgrades
- sibling repo mutation
- auto-merge
- closing source issues

## Straylight-specific stop conditions

Stop and return `VERDICT: NEEDS_HUMAN` if the candidate would:

- collapse actor estate into generic memory
- allow recall without authorization/provenance boundaries
- change signed assertion or transition semantics without accepted plan
- duplicate Dixie runtime or Hounfour package responsibilities
- advance major architecture lanes without explicit routing

## Implementation steps

1. Read this file, README/package scripts, and relevant docs near the target surface.
2. Inspect the source issue and confirm `VERDICT: ACCEPT_PLAN`.
3. Check for obvious duplicate open issues/PRs.
4. Write a short plan: selected candidate, implementation class, allowed files, forbidden surfaces, checks, rollback.
5. Create a branch named `daily-impl/YYYY-MM-DD-loa-straylight-<candidate>`.
6. Implement exactly one candidate with a minimal diff.
7. Run relevant checks from the repo.
8. Open a draft PR.
9. Add `CODEX AUDIT REQUEST` to the PR body.
10. Comment: `@codex review for additive-only scope violations, estate/recall semantic regressions, accidental default-behavior changes, failing or missing tests, rollback clarity, repo-boundary violations, and security regressions`.
11. Do not merge and do not close the source issue.

## PR body requirements

The PR must include:

- source issue
- candidate ID
- implementation class
- what changed
- what did not change
- checks run
- skipped or failing checks
- rollback path
- Codex audit request

## Final run report

Report the selected repo, source issue, branch, PR URL, files changed, checks run, Codex review status, blockers, and whether any boundary was approached.
