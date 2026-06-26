# Straylight Worker Smoke Test — Tiny Docs-Only Live Apply

> **Smoke-test artifact, docs-only.** This file exists solely to prove that the
> audited Straylight local worker can perform a single gated `--once` Claude
> live apply through an isolated worktree, open a PR against `main`, and post a
> `CLAUDE WORK COMPLETE` report. It changes no code, no configuration, and no
> gate state. Its creation has **no gate-closing effect** whatsoever.

---

## Status

- **docs-only** — the only change is the creation of this single Markdown file.
- **smoke-test-only** — it exercises the local worker routing substrate, not any
  product capability.
- **no gate-closing effect** — creating this file does not satisfy, advance, or
  close any ADR, gate, decision lane, or milestone.
- **isolated-worktree** — the apply was performed inside an isolated worktree,
  never against an adjacent repo, sibling lane, or base checkout outside that
  worktree.
- **single `--once` apply** — exactly one gated Claude apply, not a standing or
  recurring process.

---

## What this smoke test proves

A single end-to-end pass of the local worker substrate:

1. **Intake** — the worker read a tightly-scoped issue packet that allowed
   exactly one file.
2. **Isolated apply** — it performed one gated `--once` Claude live apply inside
   an isolated worktree, creating only `docs/STRAYLIGHT-WORKER-SMOKE-TEST.md`.
3. **Validation** — it ran the allowlisted validation command and recorded the
   output.
4. **PR** — it opened a pull request against `main`.
5. **Report** — it posted a `CLAUDE WORK COMPLETE` report including the source
   issue, head SHA, changed files, validation results, and routing
   recommendation.

That is the entire claim. Nothing beyond the mechanics of the routing substrate
is demonstrated or implied.

---

## Scope

- **Allowed file:** `docs/STRAYLIGHT-WORKER-SMOKE-TEST.md` (this file).
- **Changed files:** exactly one — this file.
- **Touched surfaces:** documentation only.

---

## Non-goals — what this smoke test does NOT do

This file and the PR that introduces it explicitly do **not**:

- merge anything
- delete branches
- create labels
- create milestones
- deploy
- change secrets
- run migrations
- open #9 / #10 evidence lanes
- bind a sibling repo
- select a canonical-store host
- propose a production adapter
- satisfy D.1
- start D.2
- close ADR-022E gate #8
- close MVP-2
- advance ADR-022E, sibling lanes, D.1/D.2, gate #8, or MVP-2
- infer acceptance from silence
- claim production readiness

**ADR-022E gate #8 remains OPEN / HELD.**
**MVP-2 remains OPEN.**

---

## Forbidden claims (must never be inferred from this file)

- "The smoke test advances ADR-022E or any sibling lane."
- "The smoke test closes or holds open any gate as a matter of decision."
- "Straylight is production-ready."
- "A production adapter or canonical-store host has been selected."
- "Acceptance has been granted (by silence or otherwise)."

---

## Validation

Allowlisted validation command for this lane:

```bash
git diff --check
```

The validation output is recorded in the PR's `CLAUDE WORK COMPLETE` report.

---

## Next-step recommendation

Recommend a Codex audit of the worker run that produced this PR — confirming the
isolated-worktree apply, the single-file scope, and the no-gate-closing posture —
before any further worker exercises are routed. No decision lane should treat
this smoke test as evidence for any gate.
