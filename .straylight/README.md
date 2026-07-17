# Straylight Autonomous Execution Control Plane v1

**Authority**: [ADR-050](../docs/decisions/ADR-050-autonomous-execution-control-plane.md).
**Mode**: shadow (default and only mode in v1). **Auto-merge**: forbidden.
**Kill switch**: set `"enabled": false` in [`automation-policy.json`](./automation-policy.json)
(global), or post an `operator.paused` event on a lane (per-lane; the
`cp-paused` label is the derived projection of that state, not the switch).

This directory is the canonical, normative protocol. Everything else
(labels, issue text, dashboards, prompts) is derived from or points at it.

## The one-paragraph model

GitHub is the durable blackboard. **One issue = one lane.** The issue body
carries the genesis lane record; every subsequent protocol action is an
**append-oriented event** posted as an issue comment. A pure reducer
([`lib/reducer.mjs`](./lib/reducer.mjs)) replays the comment stream over
the genesis record to derive the current state — labels are projections,
never authority. Actors (ChatGPT coordinator, Claude implementer, Codex
auditor) hold **leases** while working, bind their outputs to **exact
SHAs**, and anything malformed, stale, unknown, out-of-corridor, or
posted by a non-allowlisted identity is refused: the lane simply does not
advance. Nothing in v1 can merge.

"Append-oriented" is a protocol convention, not a cryptographic guarantee:
GitHub comments are editable and deletable. v1 mitigates mutation with two
independent layers. (1) Edit metadata: reconstruction carries each
comment's `created_at` and `updated_at` (compared as parsed instants,
never lexically), and ANY protocol comment edited after posting — an
event, a task packet, or an audit record — is refused and routes the lane
to `operator-required`. (2) Durable digests: every packet-posting and
audit-completion event DECLARES the canonical content digest of the
artifact it references (`refs.task_packet_digest` / `refs.audit_digest`),
and the reducer recomputes the bound artifact's digest on every replay —
a mutated artifact body is refused (`…-digest-mismatch`) even if edit
metadata is lost. Deletion and edit-history forgery remain documented
shadow-mode limitations, bounded by the actor allowlist and by the fact
that nothing merges.

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
→ ready-for-codex → codex-working → eligibility-pending → ready-for-merge
→ merged
```

Failure/recovery states: `patch-required`, `blocked`, `operator-required`,
`lease-expired`, `superseded`. Terminal: `merged`, `superseded`.

| Event | Role | From | To |
|---|---|---|---|
| `lane.activated` | coordinator/operator | planning | ready-for-coordinator |
| `coordinator.task_packet_posted` | coordinator | ready-for-coordinator | ready-for-claude (ESTABLISHES the lane working branch from the packet's `target_branch`) |
| `coordinator.patch_packet_posted` | coordinator | patch-required | ready-for-claude (or operator-required past the patch-cycle max; must name the established working branch) |
| `coordinator.escalated` | coordinator | coordinator-turn states only (planning, ready-for-coordinator, patch-required) | operator-required |
| `implementer.lease_acquired` | implementer | ready-for-claude | claude-working |
| `implementer.completed` | implementer | claude-working | ready-for-codex (must declare `head_branch` == lane working branch) |
| `implementer.lease_released` / `.blocked` / `.escalated` | implementer | claude-working | ready-for-claude / blocked / operator-required |
| `auditor.lease_acquired` | auditor | ready-for-codex | codex-working |
| `auditor.audit_completed` | auditor | codex-working | verdict routing (below) |
| `auditor.lease_released` | auditor | codex-working | ready-for-codex |
| `system.eligibility_confirmed` | system | eligibility-pending | ready-for-merge (ONLY with valid embedded live PR metadata) |
| `operator.paused` / `operator.resumed` | operator | any non-terminal | same state (pause flag) |
| `operator.decision` | operator | operator-required, blocked | operator-chosen safe target |
| `operator.merged` | operator | ready-for-merge | merged |
| `operator.superseded` | operator | any non-terminal | superseded |
| `system.lease_expired` | system | claude-working, codex-working | lease-expired |
| `system.requeued` | system | lease-expired | ready-for-claude or ready-for-codex |
| `system.head_moved` | system | eligibility-pending, ready-for-merge | ready-for-codex (ACCEPT invalidated, pending or confirmed) |
| `system.escalated` | system | any non-terminal | operator-required (watchdog escalation) |

Verdict routing (`auditor.audit_completed`):

- `ACCEPT` → `eligibility-pending` **only if** `audited_head_sha` equals
  the lane's durably-recorded PR head (otherwise refused as
  `audit-stale-head`). The lane reaches `ready-for-merge` ONLY via a
  subsequent `system.eligibility_confirmed` event whose payload EMBEDS the
  complete live PR metadata the reducer workflow checked (open, not
  merged, not draft, right repository/number/base/branch, live head ==
  audited SHA). The metadata is re-validated against the lane on every
  replay, so a metadata-free replay can never mint `ready-for-merge` and
  the durable record itself proves the live check happened;
- `PATCH` → `patch-required` (coordinator writes a bounded patch packet);
- `REJECT` → `blocked`;
- `CANNOT_AUDIT` → requires an explicit `retryable` boolean in the audit
  record (a CANNOT_AUDIT without one is malformed): `ready-for-codex` when
  `retryable: true` and within the retry budget, else `blocked`.

Universal fail-closed rules enforced by the reducer:

- unknown event types never advance the lane;
- an event whose `sequence` ≠ lane `event_sequence + 1` is stale — refused;
- an event whose `prior_state` ≠ current lane state is refused;
- an event whose `lane_id` differs is refused (wrong lane);
- an event whose authenticated GitHub commenter is not in the policy
  allowlist for the claimed role is refused;
- an event whose claimed `github_actor` differs from the authenticated
  commenter is refused (`actor-identity-mismatch`);
- an event from a model role (coordinator/implementer/auditor) that is not
  the lane's current turn owner (derived from the lane state) is refused
  (`not-next-actor`); operator and system keep their escape hatches;
- a reused `event_id` within a lane is refused (`duplicate-event-id`) so the
  append-only record stays uniquely addressable;
- a lease whose `expires_at` exceeds the observed grant time plus
  `lease_duration_minutes` is refused (`lease-expiry-unbounded`) so no lease
  can outlive the watchdog's ability to reap it;
- a lane record whose stored `next_actor` disagrees with the projection
  derived from its state is structurally invalid, as is an embedded lease
  whose `lane_id` differs from the lane (cross-lane), whose
  `expected_state` differs from the lane's current state (cross-state), or
  whose `expected_state` is not the holder role's working state;
- a packet/completion/audit that names a branch other than the lane's
  established working branch is refused (`task-packet-wrong-target-branch`,
  `wrong-working-branch`, `audit-head-branch-mismatch`); a packet naming
  the lane's base branch is refused (`task-packet-targets-base-branch`);
- a packet or audit-completion event without its declared content digest —
  or whose bound artifact no longer matches the declared digest — is
  refused (`…-digest-missing` / `…-digest-mismatch`);
- a lane whose phase is outside `authorized_corridor` escalates to
  `operator-required`;
- exceeding `maximum_patch_cycles` escalates to `operator-required`;
- malformed anything (lane, event, packet, audit, policy) → no advance;
- `policy.enabled: false` (kill switch) → every event refused;
- `operator_pause: true` → only operator events accepted.

Determinism invariant: the reducer and reconstruction consult NO transient
live signal. Live PR facts enter the protocol exclusively as the durable
`pr_metadata` field of `system.eligibility_confirmed` events, re-validated
on every replay. Same durable content → same projection, on every run.

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

**Working-branch establishment**: the INITIAL packet's `target_branch`
becomes the lane's `working_branch` when the packet event applies. Every
later packet must name that exact branch; the implementer's completion
must declare `head_branch` equal to it; the audit's `head_branch` must
equal it; and the eligibility confirmation's live `head_branch` must
equal it. No packet may name the lane's base branch as its target.

The packet-posting event must declare `refs.task_packet_digest` — the
canonical content digest of the packet payload. The reducer recomputes the
bound packet's digest on every replay and refuses a mismatch, so mutating
the packet comment after the event posts is detected mechanically.

Claude must not begin implementation without a valid current packet; the
reducer enforces this at `implementer.lease_acquired`. A packet whose
`base_sha` no longer equals the lane's base SHA is stale and fails closed,
as is one whose `target_branch` differs from the established working
branch.

## Audits and the exact-SHA rule

Codex posts an audit record (`straylight:audit:v1`, schema:
[`schemas/audit-v1.schema.json`](./schemas/audit-v1.schema.json))
**externally to the PR under audit — as a comment on the LANE ISSUE**
(never committed into the audited branch). **Canonical location: a comment
on the LANE ISSUE** — the only stream the reducer/watchdog reconstruct
from; an audit posted as a PR-thread comment is unreachable and its
completion event fails closed. The `auditor.audit_completed` event
references it via `refs.audit_comment_id`, and reconstruction binds that
reference only when the referenced comment (a) is EARLIER than the
completion event (no forward reference), (b) was authored by the SAME
auditor that posts the completion event (`artifact-author-mismatch`
otherwise), and (c) was not edited after posting; the bound record is
pinned by a canonical content digest so a later edit breaks the binding.
It binds to an exact `audited_head_sha` and confirms the complete
base-to-head diff was reviewed, and the completion event pins the record
content with `refs.audit_digest` (recomputed on every replay). The audit
transition itself is a pure function of durable lane history: the audited
SHA must equal the lane's recorded head, the audit's branches must equal
the lane's base and working branches, and the verdict must be internally
consistent. An `ACCEPT` then parks the lane in `eligibility-pending`.

`ready-for-merge` is minted ONLY by `system.eligibility_confirmed`, whose
payload embeds the complete live PR metadata the reducer workflow fetched
at confirmation time. The confirmation is refused — on first application
AND on every later replay — when that embedded metadata shows: the live
head moved off the audited SHA; the base changed or the PR was
retargeted; the PR is closed, merged, or still a draft (a draft PR is not
ready to merge); the repository or PR number differs; the head branch is
not the lane working branch; the fetch failed (`fetch_ok: false`); or any
field is missing (missing draft/merged information is UNKNOWN and fails
closed — it is never defaulted to false). An audit is likewise invalid
when: the lane differs; the exact SHA is missing; the auditor identity is
not allowlisted; the referenced audit comment is a forward reference,
authored by someone else, or edited; the declared digest mismatches; the
verdict payload is malformed; the verdict/next_actor disagree; a
`CANNOT_AUDIT` omits `retryable`; an `ACCEPT` carries concerns; or —

> **the audit was committed into the audited PR.** An audit report must
> not be committed into the pull request it audits because doing so
> changes the audited target (the head SHA the verdict binds to no longer
> exists as the live PR head). This is the recorded lesson of PR #116.
> The MECHANICAL guarantee is the confirmation-time live-head binding
> above (a committed audit moves the head, so the live head no longer
> equals `audited_head_sha` and eligibility is never confirmed).
> `audit_committed_in_pr` is the auditor's ATTESTATION: the validator
> rejects a `true` value, but the field is a self-report, not a file-list
> inspection.

If the head moves after an `ACCEPT` — pending or confirmed — the watchdog
posts `system.head_moved` and the lane returns to `ready-for-codex` with
the verdict cleared.

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
| `straylight-reducer.yml` | `issues`, `issue_comment` on `cp-lane` issues; manual | fetch issue + comments, run `reduce-issue.mjs`, sync derived labels, post reducer result; for an `eligibility-pending` lane, fetch the live PR and post the durable `system.eligibility_confirmed` event (metadata embedded; nothing posted on a failed/partial fetch) | evaluate comment content as shell; call model APIs; write repo contents |
| `straylight-watchdog.yml` | cron (off-minute) + manual | reconstruct all lanes, run `watchdog-scan.mjs`, post deduped recovery events / escalations (a failed lane enumeration aborts the sweep — never treated as zero lanes) | duplicate a recovery event (dedupe keys); merge |
| `straylight-merge-guard.yml` | manual `workflow_dispatch` (lane issue number) | reconstruct lane, gather live PR facts (draft/merged forwarded only as OBSERVED booleans) and the complete all-pages check-run conclusion list, run `merge-guard-check.mjs`, post shadow eligibility comment | merge (no merge API call exists in the workflow or CLI) |
| `straylight-bootstrap.yml` | manual `workflow_dispatch` | idempotently create the single Phase 49P shadow lane issue (a failed existence-check enumeration aborts — never treated as "no existing lane") | implement 49P, open its PR, call a model API, merge |

All workflows: least-privilege permissions (`contents: read` +
`issues: write` and/or `pull-requests: read`), actions pinned to
immutable commit SHAs, concurrency groups so two runs cannot move the
same lane simultaneously, payloads passed to Node via files/stdin — never
interpolated into shell.

Known eventual-consistency wrinkle (accepted for v1): the reducer skips
comments posted by `github-actions[bot]` to prevent trigger loops, so an
event posted by the watchdog does not itself re-trigger label sync.
State is never lost — every reduction replays the full comment stream —
but derived labels may lag until the next actor comment or a manual
reducer dispatch. Labels are projections, not authority, so this lag is
cosmetic.

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
