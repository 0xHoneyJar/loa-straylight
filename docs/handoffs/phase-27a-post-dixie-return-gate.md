# Phase 27A — Post-Dixie return gate (in-repo only)

> Status: Phase 27A is a **Straylight-side sequencing
> decision-lock**. It closes the Phase 26E/26F Dixie-first MVP
> exception and pins the return-gate criteria a future ADR must
> satisfy before Hounfour-side or Finn-side work resumes against
> Straylight. Companion ADR (canonical record):
> [`../decisions/ADR-027A-post-dixie-return-gate.md`](../decisions/ADR-027A-post-dixie-return-gate.md).
>
> Phase 27A authors no code, files no sibling-repo PR, fires no
> ADR-022E gate, edits no prior ADR, cuts no tag, publishes no
> package, and does not widen the Straylight runtime surface.
> The runtime subpath remains
> `@loa/straylight/runtime/recall-intake` per ADR-026A and
> Phase 26B; root `@loa/straylight` and `@loa/straylight/host`
> remain `"types"`-only.

## What Phase 27A pins

ADR-027A is canonical. This handoff is a thin pointer to it.
For each row, the linked ADR section is the source of truth.

| Pin | Plain reading | Canonical record |
|---|---|---|
| Phase 26 chain complete | Phase 26A-0 → 26A-1 → 26A-2 → 26B → 26B-F → 26C → 26D → 26E (`loa-dixie` PR #102) → 26F are recorded link by link with their merged-PR status. | [ADR-027A §"Decision" §2](../decisions/ADR-027A-post-dixie-return-gate.md) |
| Dixie-first is a closed exception | One slice only; no precedent; no semantic transfer; long-term lane assignment unchanged (each lane labeled **candidate** or **eventual**, activated only after the relevant ADR-022E gate fires); pre-Finn seam time-bounded. | [ADR-027A §"Decision" §3](../decisions/ADR-027A-post-dixie-return-gate.md) |
| Hounfour return gate | Future PR resuming Hounfour-side contract work that reaches Straylight needs a separate ADR with: 4.a upstream substrate evidence; 4.b threat-model impact under T13–T18 + T9; 4.c consumer-contract delta; 4.d **pre-merge real Flatline + Bridgebuilder (currently unsatisfied while substrate is degraded — not skipped, not circular, not pre-satisfied by ADR-027A)**; 4.e ADR-022E gates #1–#5 / #17 / #18 still held. | [ADR-027A §"Decision" §4](../decisions/ADR-027A-post-dixie-return-gate.md) |
| Finn return gate | Future PR resuming Finn-side runtime enforcement / audit / action-boundary work needs a separate ADR with: 5.a Finn substrate evidence; 5.b subpath retirement plan; 5.c class-vs-policy preservation; 5.d threat-model continuity; 5.e **pre-merge real Flatline + Bridgebuilder (currently unsatisfied)**; 5.f ADR-022E gate #9 still held. | [ADR-027A §"Decision" §5](../decisions/ADR-027A-post-dixie-return-gate.md) |
| Findings are audit evidence, not authority | Codex / Flatline / Bridgebuilder / Cheval / model findings, persisted agent memory, and long-context window dumps are evidence the operator weighs under ADR-026A0 — they do not authorize widening, gate firing, sibling-repo edits, or releases. Substrate degradation is a Loa-side concern, not a reason to re-open `loa-dixie` PR #102 or widen Straylight surfaces. | [ADR-027A §"Decision" §6](../decisions/ADR-027A-post-dixie-return-gate.md) |
| Out of scope | Local config, framework / control-plane state, model substrate, and sibling repos remain separately-authorized work. | [ADR-027A §"Decision" §7](../decisions/ADR-027A-post-dixie-return-gate.md) |
| Refusal rules | 8.a–8.o pin the citable refusal block reviewers may quote verbatim, including 8.o (no successor-ADR pre-approval — successors are §3-class authorization-creating docs under ADR-026A0 and inherit the full pre-merge real 3-model Flatline + Bridgebuilder requirement on their own). | [ADR-027A §"Decision" §8](../decisions/ADR-027A-post-dixie-return-gate.md) |
| Successor-ADR contract | A successor must cite ADR-026A0 + Phase 26A-1 + ADR-026A + ADR-026C + ADR-026D + Phase 26F + ADR-027A and supply its own trigger evidence, scope, threat-model leg, consumer-contract delta, tests, rollback, and pre-merge Flatline + Bridgebuilder verdict. | [ADR-027A §"Decision" §9](../decisions/ADR-027A-post-dixie-return-gate.md) |

## Relationship to ADR-026A0

Per ADR-026A0 §3, ADR-027A is the **second class** of doc — it
**tightens refusal** rather than creating authorization, so the
pre-merge Flatline + Bridgebuilder requirement applies at
**operator discretion** for ADR-027A itself. The future
Hounfour / Finn return-gate ADRs ADR-027A contemplates are
unambiguously the **first class** and each independently
inherits the full ADR-026A0 §3 source / package / runtime /
test / dependency / public-surface Flatline + Bridgebuilder
requirement. ADR-027A pre-approves no successor.

## Out of scope

Phase 27A does not authorize edits to local config
(`.loa.config.yaml`, `.env*`, `.npmrc`, `.gitignore`,
`tsconfig*`, `vitest.config.ts`, `package.json`,
`package-lock.json`); framework / control-plane state
(`.claude/`, `.loa/`, `.beads/`, `.run/`, `.codex/`, `.agents/`,
`.vitest/`, `.github/`, `grimoires/`, `node_modules/`, `dist/`,
`dist-types/`); model substrate (Bedrock / Flatline /
Bridgebuilder / Cheval / Codex / GPT / Gemini / headless /
model-routing config); or any sibling repo (`loa-dixie`,
`loa-finn`, `loa-hounfour`, `loa-freeside`, `loa`,
`freeside-characters`, or any other repo under `~/loa-dev/`).

## Validation

Phase 27A adds no source / test / fixture / script / package
change; the working-tree surface is the entire validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full four-file working set
```

Expected:

- `git diff --name-only` lists exactly the two **modified**
  tracked files: `docs/handoffs/README.md` and
  `docs/handoffs/cross-repo-implementation-order.md`.
- `git ls-files --others --exclude-standard` lists exactly the
  two **untracked** new files: ADR-027A and this handoff.
- `git status --short --untracked-files=all` lists all four
  Phase 27A files (two `M`, two `??`), plus any pre-existing
  local dirt outside the Phase 27A scope.

`git diff --stat` reports tracked-file modifications only and
will **not** show the new ADR or this handoff until they are
staged; Phase 27A does not stage them. `npm run typecheck`,
`npm test`, `npm run build`, and `npm pack --dry-run` remain
identical to the post-Phase-26F baseline by construction
(no `src/` change).

## Cross-references

- [`../decisions/ADR-027A-post-dixie-return-gate.md`](../decisions/ADR-027A-post-dixie-return-gate.md)
  — the canonical decision-lock.
- [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
  — the operator-authority / Flatline rule ADR-027A defers to.
- [`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md)
  — runtime subpath authorization, unchanged by Phase 27A.
- [`../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md`](../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md)
  — consumer contract Dixie PR #102 honored.
- [`../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md`](../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md)
  — bounded Dixie-first authorization Phase 27A closes forward.
- [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)
  — frozen Phase 26F verification report.
- [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order, with the
  Phase 27A return-gate section appended.
- [`./cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — no-go rules every sibling-repo PR must respect.
- [`../mvp/threat-model.md`](../mvp/threat-model.md) — T13–T18 +
  T9 persistence-posture amendment future return-gate ADRs must
  cite under §4.b / §5.d.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) —
  runtime allowlist; unchanged by Phase 27A.
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — load-bearing class-vs-policy invariant.
- [`./finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md),
  [`./finn-runtime-boundary.md`](./finn-runtime-boundary.md),
  [`./finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
  — Phase 10 packet a future Finn return-gate ADR must cite
  under §5.a.
- [`./hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md),
  [`./hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md),
  [`./hounfour-response-intake.md`](./hounfour-response-intake.md),
  [`./hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  — Hounfour-side packets a future Hounfour return-gate ADR
  must cite under §4.a.
