# Agent instructions — loa-straylight

`operator:eileen` is the sole human Straylight product, semantic,
architectural, acceptance, gate-disposition, and MVP-completion authority
(ADR-049 §6). No agent, bot, workflow, or maintainer acquires Straylight
authority by acting in this repository.

## Straylight Autonomous Execution Control Plane (ADR-050 — shadow mode)

Canonical protocol: [`.straylight/README.md`](.straylight/README.md).
Policy and kill switch: [`.straylight/automation-policy.json`](.straylight/automation-policy.json)
(`"enabled": false` suspends all autonomous processing).

Role prompts (permanent):

- ChatGPT coordinator — [`.straylight/prompts/chatgpt-coordinator.md`](.straylight/prompts/chatgpt-coordinator.md)
- Claude implementer — [`.straylight/prompts/claude-fable-implementer.md`](.straylight/prompts/claude-fable-implementer.md)
- Codex auditor — [`.straylight/prompts/codex-auditor.md`](.straylight/prompts/codex-auditor.md)

Universal rules for any agent session in this repo:

1. **Reconstruct state from GitHub every run.** Chat memory and local
   disk are non-authoritative caches; lane issues + comment events are
   the durable record. Codex in particular must assume a full
   environment reset (~5h) and checkpoint or stop safely before it.
2. **Act only on a lane whose `next_actor` is your role**, under a valid
   lease, per the state machine in `.straylight/README.md`.
3. **Audits bind to an exact head SHA and are posted externally** — never
   commit an audit into the PR it audits (PR #116 lesson: doing so
   changes the audited target and invalidates the verdict).
4. **Nothing merges automatically.** Control Plane v1 is shadow mode;
   merge eligibility is a report; merging is an exclusive operator action.
5. **Fail closed.** Any authority, scope, identity, or state uncertainty
   → escalate to `operator-required` and stop.

Validation: `npm run control-plane:validate` and `npm run control-plane:test`.
