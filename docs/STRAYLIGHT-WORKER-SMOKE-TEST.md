# Straylight Worker Smoke Test — Tiny Docs-Only Live Apply

> **Smoke-test artifact only.** This document exists solely to prove that the
> audited Straylight local worker can perform a single gated `--once` Claude
> live apply through an isolated worktree, open a PR, and post
> `CLAUDE WORK COMPLETE`. It is harmless documentation. Nothing here runs,
> imports runtime code, advances a gate, or implies any deployment.

---

## Purpose

This file is the deliverable of a deliberately tiny, docs-only smoke test of the
**local worker routing substrate** — and nothing more. Its presence on a branch,
inside a PR opened against `main`, demonstrates that the end-to-end worker path
is wired:

1. An issue packet is parsed into branch + scope + allowed files.
2. The worker operates inside an **isolated worktree** (not a base checkout).
3. A single gated `--once` Claude live apply makes exactly one allowed change.
4. The allowlisted validation command (`git diff --check`) runs.
5. A PR is opened against `main`.
6. The worker posts `CLAUDE WORK COMPLETE`.

That is the entire claim. The test succeeds if this one file lands through that
path with no scope violations.

---

## Scope classification

- **docs-only** — exactly one harmless Markdown file is created.
- **substrate smoke test** — exercises the worker routing path, not any product
  surface.
- **no gate-closing effect** — see non-goals below.

### Single allowed change

- `docs/STRAYLIGHT-WORKER-SMOKE-TEST.md` (this file)

No code files, hidden paths, configuration, secrets, migrations, deploy files,
eval harnesses, or sibling/adjacent repositories are touched.

---

## Non-goals — explicitly preserved

This document and its PR do **not**, and must never be read to:

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

This is a substrate smoke test only. It carries no acceptance, no evidence, and
no readiness signal for any of the surfaces named above.

---

## Validation

The only allowlisted validation command for this lane is:

```bash
git diff --check
```

This checks for whitespace errors and conflict markers in the staged change.

---

## Audit posture

This change is intended to be reviewed under a **CODEX AUDIT REQUEST** in the
accompanying PR. The audit scope is limited to confirming that:

- exactly one allowed file changed,
- no forbidden surface was touched,
- the worker substrate behaved as described,

and that none of the non-goals above were violated.
