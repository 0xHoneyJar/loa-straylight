# Straylight Autonomous Execution Control Plane v1

**Authority**: [ADR-050](../docs/decisions/ADR-050-autonomous-execution-control-plane.md).
**Mode**: shadow (default and only mode in v1). **Auto-merge**: forbidden.
**Kill switch**: set `"enabled": false` in [`automation-policy.json`](./automation-policy.json),
or label a lane issue `cp-paused` via an `operator.paused` event.

This directory is the canonical, normative protocol. Everything else
(labels, issue text, dashboards, prompts) is derived from or points at it.

## The one-paragraph model

GitHub is the durable blackboard. **One issue = one lane.** The issue body
carries the genesis lane record; every subsequent protocol action is an
**append-only event** posted as an issue comment. A pure reducer
([`lib/reducer.mjs`](./lib/reducer.mjs)) replays the comment stream over
the genesis record to derive the current state — labels are projections,
never authority. Actors (ChatGPT coordinator, Claude implementer, Codex
auditor) hold **leases** while working, bind their outputs to **exact
SHAs**, and anything malformed, stale, unknown, out-of-corridor, or
posted by a non-allowlisted identity is refused: the lane simply does not
advance. Nothing in v1 can merge.

## Directory layout

```
.straylight/
  README.md                  ← this protocol document (normative)
  automation-policy.json     ← operator-owned policy: kill switch, corridor,
                               allowlist, patch-cycle max, lease duration
  schemas/                   ← published v1 contracts (JSON Schema 2020-12)
    lane-v1.schema.json
    event-v1.schema.json
    task-packet-v1.schema.json
    audit-v1.schema.json
  lib/                       ← pure, dependency-free ESM logic (Node 22)
    state-machine.mjs        ← states, event table, transition legality
    markers.mjs              ← hidden-marker payload extraction (fail-closed)
    validate.mjs             ← structural validators mirroring the schemas
    reducer.mjs              ← the single state-advancement authority
    reconstruct.mjs          ← full lane rebuild from issue + comments
    watchdog.mjs             ← recovery scan (expired leases, moved heads…)
    merge-guard.mjs          ← shadow merge-eligibility report (cannot merge)
  bin/                       ← thin CLI adapters (no network calls)
    reduce-issue.mjs
    watchdog-scan.mjs
    merge-guard-check.mjs
    validate-protocol.mjs
  prompts/                   ← permanent actor prompts
    chatgpt-coordinator.md
    claude-fable-implementer.md
    codex-auditor.md
```

Workflows live in `.github/workflows/straylight-*.yml` and only fetch
GitHub content, run the CLIs above, and post results. They never call
model APIs and never hold `contents: write`.

## Machine-readable payloads

A payload is a hidden HTML marker followed immediately by a fenced JSON
block:

````markdown
<!-- straylight:event:v1 -->
```json
{ "schema": "straylight.event.v1", ... }
```
````

Markers: `straylight:lane:v1` (issue body only), `straylight:event:v1`,
`straylight:task-packet:v1`, `straylight:audit:v1`, plus result markers
posted by workflows (`straylight:reducer-result:v1`,
`straylight:watchdog-result:v1`, `straylight:merge-guard-result:v1`).

Parser rules (fail closed):

- **exactly one** payload of a given kind per body — two or more of the
  same marker is `ambiguous-multiple-payloads` and the whole body is
  rejected for that kind;
- only whitespace may separate marker and fence;
- payloads over 64 KiB, non-JSON, non-object, or unterminated are rejected;
- comment content is untrusted input: it is parsed as JSON, never
  evaluated, never interpolated into shell.

## State machine

Happy path:

```
planning → ready-for-coordinator → ready-for-claude → claude-working
→ ready-for-codex → codex-working → ready-for-merge → merged
```

Failure/recovery states: `patch-required`, `blocked`, `operator-required`,
`lease-expired`, `superseded`. Terminal: `merged`, `superseded`.

| Event | Role | From | To |
|---|---|---|---|
| `lane.activated` | coordinator/operator | planning | ready-for-coordinator |
| `coordinator.task_packet_posted` | coordinator | ready-for-coordinator | ready-for-claude |
| `coordinator.patch_packet_posted` | coordinator | patch-required | ready-for-claude (or operator-required past the patch-cycle max) |
| `coordinator.escalated` | coordinator | most non-working states | operator-required |
| `implementer.lease_acquired` | implementer | ready-for-claude | claude-working |
| `implementer.completed` | implementer | claude-working | ready-for-codex |
| `implementer.lease_released` / `.blocked` / `.escalated` | implementer | claude-working | ready-for-claude / blocked / operator-required |
| `auditor.lease_acquired` | auditor | ready-for-codex | codex-working |
| `auditor.audit_completed` | auditor | codex-working | verdict routing (below) |
| `auditor.lease_released` | auditor | codex-working | ready-for-codex |
| `operator.paused` / `operator.resumed` | operator | any non-terminal | same state (pause flag) |
| `operator.decision` | operator | operator-required, blocked | operator-chosen safe target |
| `operator.merged` | operator | ready-for-merge | merged |
| `operator.superseded` | operator | any non-terminal | superseded |
| `system.lease_expired` | system | claude-working, codex-working | lease-expired |
| `system.requeued` | system | lease-expired | ready-for-claude or ready-for-codex |
| `system.head_moved` | system | ready-for-merge | ready-for-codex (ACCEPT invalidated) |
| `system.escalated` | system | any non-terminal | operator-required (watchdog escalation) |

Verdict routing (`auditor.audit_completed`):

- `ACCEPT` → `ready-for-merge` **only if** `audited_head_sha` equals the
  current PR head SHA (otherwise refused as `audit-stale-head`);
- `PATCH` → `patch-required` (coordinator writes a bounded patch packet);
- `REJECT` → `blocked`;
- `CANNOT_AUDIT` → `ready-for-codex` when `retryable: true` and within the
  retry budget, else `blocked`.

Universal fail-closed rules enforced by the reducer:

- unknown event types never advance the lane;
- an event whose `sequence` ≠ lane `event_sequence + 1` is stale — refused;
- an event whose `prior_state` ≠ current lane state is refused;
- an event whose `lane_id` differs is refused (wrong lane);
- an event whose authenticated GitHub commenter is not in the policy
  allowlist for the claimed role is refused;
- an event whose claimed `github_actor` differs from the authenticated
  commenter is refused (`actor-identity-mismatch`);
- a lane whose phase is outside `authorized_corridor` escalates to
  `operator-required`;
- exceeding `maximum_patch_cycles` escalates to `operator-required`;
- malformed anything (lane, event, packet, audit, policy) → no advance;
- `policy.enabled: false` (kill switch) → every event refused;
- `operator_pause: true` → only operator events accepted.

## Leases

Claude and Codex acquire a lease (`implementer.lease_acquired` /
`auditor.lease_acquired`) before working. A lease records: lane ID, actor
role, lease ID, grant sequence, acquisition time, expiry time, expected
state. Duration comes from `policy.lease_duration_minutes` (default 240).

The reducer rejects: a second active lease for the same work role;
completion from an actor without the active lease; lease release by
another role; completion after lease expiry (**v1 has no late-result
path** — expired work is redone); and any non-holder, non-operator,
non-system event while a lease is active. The watchdog detects expired
leases, posts `system.lease_expired`, then `system.requeued` back to the
safe retry state (`ready-for-claude`, or `ready-for-codex` when a PR with
a recorded head already exists) — history is never rewritten.

## Task packets

The coordinator's bounded assignment (`straylight:task-packet:v1`,
schema: [`schemas/task-packet-v1.schema.json`](./schemas/task-packet-v1.schema.json)).
Includes: lane identity, authority basis, **exact base SHA**, target
repository/branch, complete allowed file scope, forbidden paths, explicit
capability success condition, non-goals, required tests, required
negative tests, required no-leak checks, required completion report, stop
conditions, whether a PR may be opened, `merge_forbidden` (always `true`
in v1), and the expected next actor.

Claude must not begin implementation without a valid current packet; the
reducer enforces this at `implementer.lease_acquired`. A packet whose
`base_sha` no longer equals the lane's base SHA is stale and fails closed.

## Audits and the exact-SHA rule

Codex posts an audit record (`straylight:audit:v1`, schema:
[`schemas/audit-v1.schema.json`](./schemas/audit-v1.schema.json))
**externally** — as a PR comment or lane event comment. It binds to an
exact `audited_head_sha` and confirms the complete base-to-head diff was
reviewed. An `ACCEPT` is invalid when: the PR head changed; the base
changed; the lane differs; the exact SHA is missing; the auditor identity
is not allowlisted; the verdict payload is malformed; or —

> **the audit was committed into the audited PR.** An audit report must
> not be committed into the pull request it audits because doing so
> changes the audited target (the head SHA the verdict binds to no longer
> exists as the PR head). This is the recorded lesson of PR #116, and it
> is enforced structurally: `audit_committed_in_pr` must be `false` or
> the record is invalid.

If the head moves after an `ACCEPT`, the watchdog posts
`system.head_moved` and the lane returns to `ready-for-codex` with the
verdict cleared.

## Actor identity (recorded limitation)

`actor_role` is a claimed field, not a cryptographic identity. The
authenticated identity available in v1 is the GitHub commenter login,
checked against the per-role allowlist in `automation-policy.json`. In
the current deployment all three model actors may post through the same
GitHub user. Distinct GitHub App/bot identities or signed events are a
hard precondition for ever enabling auto-merge. Shadow mode remains safe
under this limitation because nothing merges automatically and no
control-plane workflow holds `contents: write`.

## Workflows (`.github/workflows/`)

| Workflow | Trigger | Does | Never |
|---|---|---|---|
| `straylight-reducer.yml` | `issues`, `issue_comment` on `cp-lane` issues; manual | fetch issue + comments, run `reduce-issue.mjs`, sync derived labels, post reducer result | evaluate comment content as shell; call model APIs; write repo contents |
| `straylight-watchdog.yml` | cron (off-minute) + manual | reconstruct all lanes, run `watchdog-scan.mjs`, post deduped recovery events / escalations | duplicate a recovery event (dedupe keys); merge |
| `straylight-merge-guard.yml` | manual + PR events on lane PRs | reconstruct lane, run `merge-guard-check.mjs`, post shadow eligibility comment | merge (no merge API call exists in the workflow or CLI) |
| `straylight-bootstrap.yml` | manual `workflow_dispatch` | idempotently create the single Phase 49P shadow lane issue | implement 49P, open its PR, call a model API, merge |

All workflows: least-privilege permissions (`contents: read` +
`issues: write` and/or `pull-requests: write`), actions pinned to
immutable commit SHAs, concurrency groups so two runs cannot move the
same lane simultaneously, payloads passed to Node via files/stdin — never
interpolated into shell.

## Recovery from total local-state loss

Any actor, on any run, can rebuild everything from GitHub:

1. read `automation-policy.json` at the merged main HEAD;
2. list open `cp-lane` issues;
3. for each: fetch issue body + comments, run the reducer
   (`node .straylight/bin/reduce-issue.mjs`);
4. the resulting lane record names the current state and `next_actor` —
   if that is you, follow your prompt in [`prompts/`](./prompts/); if
   not, stop.

Chat memory and local disk are caches. Anything not reconstructible from
GitHub does not exist, protocol-wise.

## Validation

```bash
npm run control-plane:validate   # policy + schemas + state machine + markers
npm run control-plane:test       # vitest suite: tests/control-plane/
```
