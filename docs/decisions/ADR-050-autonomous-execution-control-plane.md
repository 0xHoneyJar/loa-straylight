# ADR-050 — Autonomous Execution Control Plane v1

> **Decision provenance**: Directed by `operator:eileen` on 2026-07-16 as the
> next capability-bearing slice under merged ADR-049 governance.
> **Repository status**: Proposed — effective as accepted governance upon
> operator-authorized merge. This ADR records the operator's mandate; it was
> drafted by Claude under the drafting role defined in ADR-049 §7.
> **Classification**: Tier 3 — project-governance and delegated-authority
> bearing (ADR-049 §5). This slice does not change estate semantics, but it
> creates a durable mechanism that may act under operator authority, so it
> receives Tier-3-equivalent adversarial treatment. The classification may
> not be lowered by any implementer, drafter, auditor, or reviewer.
> **Builds on**: ADR-049 (roadmap, tiers, authority), ADR-026A0
> (operator-authority discipline). Neither is modified.

---

## 1. Purpose

This ADR establishes the **Autonomous Execution Control Plane v1**: a
GitHub-backed coordination protocol that ships **enabled for report-only
shadow bookkeeping and coordination while consequence-disabled** — the
committed policy sets `"enabled": true` with `"mode": "shadow"` and
`"auto_merge": false`, so the reducer, watchdog, and merge guard run and
record, and nothing merges, deploys, releases, or mutates anything
beyond lane issue comments and derived labels; the kill switch
(`"enabled": false`) suspends even that bookkeeping — through which:

1. **ChatGPT** coordinates and scopes the next authorized lane;
2. **Claude** implements the bounded task packet;
3. **Codex** independently audits the complete pull request at an exact
   head SHA;
4. **GitHub** preserves all durable lane state, task packets,
   implementation reports, audit verdicts, leases, transitions, and merge
   eligibility;
5. the workflow reconstructs correctly after Claude or Codex loses all
   local state;
6. the workflow fails closed whenever authority, scope, identity, audit
   integrity, or state is uncertain.

### 1.1 Durability model

- **GitHub is the durable coordination blackboard.** Lane issues, PR
  threads, and structured comments are the only coordination substrate.
- **Chat memory and local agent disk are non-authoritative caches.** Any
  actor may lose all local state at any time; the protocol must
  reconstruct from GitHub alone.
- **Merged repository artifacts remain durable project truth.** The
  control plane coordinates work; it does not replace ADRs, handoffs, or
  the repository record as authority.
- **Issues identify lanes.** One GitHub issue = one lane.
- **Pull requests identify implementation targets.** A lane binds to at
  most one open implementation PR at a time.
- **Structured comments form an append-oriented event record.** The protocol
  convention is that events are appended, not edited or deleted; corrections
  are new events. This is a convention, not a cryptographic guarantee —
  GitHub comments are editable and deletable. v1 mitigates rather than
  prevents mutation: the reducer input carries each comment's `created_at`
  and `updated_at`, and any protocol comment whose `updated_at` is after its
  `created_at` is routed to `operator-required` on reconstruction. Deletion
  and comment-history forgery remain documented shadow-mode limitations (§6),
  bounded by the actor allowlist and by the fact that nothing merges.
- **Labels are reduced/derived state, never primary authority.** Any label
  can be reconstructed by re-reducing the event record; a label that
  disagrees with the reduction is wrong.

### 1.2 What this ADR does not do

- It does not merge anything, authorize any merge, or create automatic
  merge capability. `auto_merge` defaults to `false` and Control Plane v1
  contains **no merge API call anywhere**.
- It does not implement Phase 49P, accept sibling evidence, discharge
  ADR-022E gate #8, resolve D.1(ii), start D.2, or close MVP-2.
- It does not alter Recall Wedge or Admission Wedge domain semantics, the
  published `@loa/straylight` package surface, the `.loa` submodule, the
  `.claude` scripts, or the existing post-merge pipeline.
- It does not create any new Straylight authority (§3).
- It does not claim external ChatGPT/Claude/Codex schedules are configured
  (§8).

---

## 2. Bounded mandate

Autonomous execution is initially authorized **only** for the already
planned MVP-2 corridor:

1. **Phase 49P** — sibling evidence intake;
2. **Phase 49Q** — Railway host acceptance, ADR-022E gate #8 disposition,
   and bounded D.2 authorization;
3. **Phase 50A** — durable Admission Wedge capability implementation and
   proof;
4. **Phase 50B** — MVP-2 controlled development/operator-grade acceptance
   preparation.

The corridor is encoded machine-readably in
[`.straylight/automation-policy.json`](../../.straylight/automation-policy.json)
as `authorized_corridor`. A lane whose phase is outside the corridor must
be refused by the reducer and routed to `operator-required`.

### 2.1 The mandate permits the machinery to

- reconstruct merged state from GitHub;
- identify the next already-authorized lane;
- propose a tier (final tier authority remains the operator, ADR-049 §5);
- write a bounded task packet;
- implement that packet;
- open or update a pull request;
- independently audit an exact target (base SHA → head SHA);
- route a `PATCH` verdict back to Claude as a new bounded patch packet;
- record merge eligibility (shadow verdict only);
- escalate uncertainty to `operator-required`;
- recover expired work via leases and the watchdog;
- prepare the next lane after an operator-authorized merge.

### 2.2 The mandate does NOT permit

- automatic Tier-3 estate-semantic interpretation;
- invention of new product doctrine;
- invention of a seventh MVP;
- silent changes to consent, signer competence, identity, challenge,
  revocation, forgetting, inheritance, or commitment semantics;
- new stable sibling contracts;
- sibling-repository edits;
- production infrastructure creation;
- production secret use;
- irreversible external side effects;
- automatic progression beyond MVP-2 into unresolved MVP-3 semantics;
- **automatic merge in Control Plane v1** (no exception).

Every item above is a fail-closed boundary: when the machinery cannot
prove an action is inside the mandate, it must not act, and the lane
routes to `operator-required`.

---

## 3. Authority

```
operator:eileen
```

remains the **sole** human Loa-Straylight product authority, roadmap
authority, semantic authority, architectural authority, acceptance
authority, gate-disposition authority, and MVP-completion authority
(ADR-049 §6). This ADR creates **no** new Straylight authority. It does
not make ChatGPT, Claude, Codex, GitHub Actions, a GitHub App, a
repository maintainer, or a sibling owner into a Straylight authority.

The control plane acts only inside this explicit, bounded, revocable
operator mandate:

- **ChatGPT (coordinator)** may coordinate, reason, propose the next lane,
  propose a tier, and write task packets — only within the corridor. It
  may not implement, may not audit, may not accept, may not merge, and may
  not invent authority. Unresolved semantic or scope questions route to
  `operator-required`.
- **Claude (implementer)** may implement bounded task packets and
  adversarially self-review its work. It may not audit itself, may not
  merge, may not choose a new semantic lane, and must stop on authority
  uncertainty.
- **Codex (auditor)** may independently audit a complete PR at an exact
  head SHA and return exactly one of `ACCEPT`, `PATCH`, `REJECT`,
  `CANNOT_AUDIT`. **Codex is not an acceptance authority**: `ACCEPT` is an
  audit verdict that feeds merge *eligibility*; only the operator merges.
- **GitHub Actions (reducer/watchdog/merge-guard)** may mechanically
  validate, reduce state, project labels, and post shadow results. It may
  not make semantic or product decisions, and in v1 it may not merge.

## 4. Revocation and rollback

- **Kill switch (policy field)**: setting `"enabled": false` in
  `.straylight/automation-policy.json` suspends all autonomous
  processing — the reducer refuses every event, the watchdog takes no
  action, and the merge guard reports `ineligible`. One field, one file,
  one obvious switch, changed through an ordinary operator commit.
- **Kill switch (per lane)**: an `operator.paused` event freezes that
  lane for all non-operator events. The `cp-paused` label is a derived
  *projection* of that pause state (per §1.1, labels are never primary
  authority) — pausing is done by posting the event, not by adding the
  label by hand.
- **Revocation preserves history.** Suspension and revocation never
  rewrite lane history: the event record is append-only, and a revoked
  mandate simply stops advancing lanes. Un-suspending resumes from the
  recorded state.
- **Shadow mode is the default.** `"mode": "shadow"` means: events are
  validated, state is reduced, eligibility is computed and reported — and
  nothing merges, tags, releases, deploys, or mutates anything outside
  the lane-coordination surface (issue comments and labels).
- **Automatic merge defaults to false** (`"auto_merge": false`). Enabling
  it in any future version requires a separately audited authorization
  and stronger actor identity (§6); v1 ships with no merge code path at
  all, so flipping the field alone cannot cause a merge.

---

## 5. Protocol summary

The canonical, normative protocol specification lives in
[`.straylight/README.md`](../../.straylight/README.md). Summary:

### 5.1 State machine

Happy path:

```
planning
→ ready-for-coordinator
→ ready-for-claude
→ claude-working
→ ready-for-codex
→ codex-working
→ eligibility-pending
→ ready-for-merge
→ merged
```

Failure and recovery states:

```
patch-required   blocked   operator-required   lease-expired   superseded
```

Required routing (normative):

- Codex `ACCEPT` produces `eligibility-pending` **only** when the audited
  SHA equals the lane's durably-recorded PR head. `ready-for-merge` is
  produced ONLY by a subsequent `system.eligibility_confirmed` event whose
  payload durably embeds the complete live PR metadata the reducer
  workflow checked (open, not merged, not draft, correct
  repository/number/base/working-branch, live head equal to the audited
  SHA); the embedded record is re-validated on every replay, so replaying
  history without live metadata can never mint `ready-for-merge`.
- Codex `PATCH` routes to `patch-required`, then a new bounded Claude
  patch packet routes back to `ready-for-claude`.
- Codex `REJECT` routes to `blocked`.
- Codex `CANNOT_AUDIT` must declare `retryable` explicitly (a record
  without it is malformed): it routes back to `ready-for-codex` when
  `retryable: true` and the retry budget is not exhausted, else `blocked`.
- The initial coordinator task packet ESTABLISHES the lane working branch
  — unconditionally from the packet's own `target_branch`, and only on a
  lane whose `working_branch` is null. A genesis record cannot preseed
  `working_branch` (or any other in-flight state: PR binding, audited
  SHA, verdict, lease, attempt/patch/retry counters, pause flag) —
  reconstruction refuses a non-initial genesis. Every later packet, the
  implementer's completion (`head_branch`), the audit (`head_branch`),
  and the confirmed live PR head branch must match the established branch
  exactly. No packet may target the lane's base branch. An operator
  decision routing a lane back to coordination clears the establishment
  so the next initial packet establishes it anew.
- Every escalation to `operator-required` — reducer verdict routing,
  corridor escalation, watchdog escalation, and reconstruction's
  edited-comment routing alike — clears any active lease, so the
  escalated lane is always structurally valid and recoverable by an
  `operator.decision`.
- Protocol timestamps are strict UTC calendar instants with at most
  millisecond (3-digit) fractional precision; finer fractions are
  rejected everywhere, never rounded, so two distinct recorded instants
  can never collapse into one.
- The shadow merge guard evaluates the COMPLETE normalized live PR
  metadata record (the same field set the eligibility confirmation
  embeds durably) and fails closed unless fetch status, repository, PR
  number, open/merged/draft state, base branch and SHA, and head branch
  and SHA all correspond exactly with the lane and the audited target;
  loose single-field evidence is never accepted.
- A changed PR head invalidates any prior `ACCEPT`, pending or confirmed
  (lane returns to `ready-for-codex`).
- A scope or authority conflict routes to `operator-required`.
- Exceeding the configured `maximum_patch_cycles` routes to
  `operator-required`.
- Missing or malformed state fails closed (no advance). A lane record
  whose stored `next_actor` disagrees with its state, or whose embedded
  lease belongs to another lane or another state, is structurally invalid.
- Unknown events do not advance the lane.
- Stale sequence numbers do not advance the lane.
- Events for another lane do not affect the current lane.

### 5.2 Work leases

A lease (lane ID, actor role, lease ID, grant sequence, acquisition time,
expiry time, expected state) prevents concurrent Claude or Codex work on
the same lane. The reducer rejects: second active leases, completion
without the active lease, release by another role, completion after
expiry (v1 has **no** late-result path), and stale leases changing state.
The watchdog returns expired-lease lanes to a safe retry state without
losing history.

### 5.3 Exact-SHA audit and the PR #116 lesson

An audit verdict binds to an exact `audited_head_sha`, checked against the
lane's durably-recorded head, and an `ACCEPT` parks the lane in
`eligibility-pending`. Merge eligibility (`ready-for-merge`) is recorded
ONLY by a `system.eligibility_confirmed` event whose payload **embeds the
complete authoritative live PR metadata** the reducer workflow fetched at
confirmation time (repository, PR number, open/merged/draft state, base
branch/SHA, head branch/SHA, `fetch_ok`). The confirmation is refused —
at first application and on every replay of the durable record — when the
live head moved off the audited SHA, the base changed or was retargeted,
the PR is closed, merged, or still a **draft** (a draft PR is not ready to
merge, so eligibility cannot be recorded against it), the repository or
PR number differs, the head branch is not the lane's established working
branch, the fetch failed, or any field is missing — missing draft/merged
information is UNKNOWN and fails closed; it is never converted to false.
An audit is likewise invalid when the lane differs, the SHA is missing,
the auditor identity is not allowlisted, or the payload is malformed. The
canonical location of the audit record is a **comment on the lane issue**
(the only stream reconstruction reads), bound to its author, to
edit-metadata freshness, and to the canonical content digest DECLARED in
the durable completion event (`refs.audit_digest`, recomputed on every
replay) so a later mutation of the record breaks the binding even without
edit metadata. And, encoding the lesson from PR #116:

> **An audit report must not be committed into the pull request it
> audits, because doing so changes the audited target.** An audit that
> appears as a commit inside the audited PR invalidates itself: the head
> SHA the verdict binds to no longer equals the live head SHA of the PR.
> Audits live as lane-issue comments, never as repository content inside
> the audited branch.

Two layers enforce this. (1) MECHANICAL: eligibility is confirmed only
against the live head fetched read-only from the PR at confirmation time
and embedded durably in the confirmation event; an audit committed into
the branch moves the head, so the live head no longer equals the audited
SHA and eligibility is never confirmed. (2) ATTESTATION:
`audit_committed_in_pr` is the auditor's self-report; the validator
rejects a `true` attestation. The mechanical layer is the real guarantee —
the field is a declared attestation, not a claim of file-list inspection.

---

## 6. Actor identity posture (recorded limitation)

Control Plane v1 does **not** falsely claim cryptographic distinction
between ChatGPT, Claude, and Codex:

- The structured `actor_role` field in events is a **claimed** identity,
  not a cryptographic identity.
- The authenticated identity available to the protocol is the **GitHub
  commenter login**. In the current single-operator deployment, ChatGPT,
  Claude, and Codex may all post through the same GitHub user.
- v1 therefore uses a **GitHub identity allowlist per role** (in
  `automation-policy.json`) and fails closed on any event whose commenter
  is outside the allowlist for the claimed role.
- **Distinct GitHub App / bot identities or signed events are required
  before high-authority auto-merge could ever be enabled.** That is a
  hard precondition, recorded here, for any future ADR that proposes
  enabling `auto_merge`.
- Shadow mode remains safe under this limitation because no automatic
  merge occurs and no workflow holds `contents: write`.

No live credentials, account tokens, or secret values are embedded in
the protocol, policy, prompts, or workflows.

---

## 7. Mechanical components authorized by this ADR

| Component | Location | Nature |
|---|---|---|
| Automation policy (kill switch, corridor, allowlist, limits) | `.straylight/automation-policy.json` | Derived-state input, operator-owned |
| Lane / event / task-packet / audit schemas (v1) | `.straylight/schemas/` | Versioned protocol contracts |
| Marker parser, validators, state machine, lease logic, reducer, watchdog, merge guard | `.straylight/lib/` | Pure, dependency-free ESM logic |
| CLI entrypoints | `.straylight/bin/` | Thin adapters over the pure logic |
| Reducer / watchdog / merge-guard / bootstrap workflows | `.github/workflows/straylight-*.yml` | Mechanical validation only, least privilege, no merge capability |
| Actor prompts | `.straylight/prompts/` | Permanent per-actor instructions |
| Agent instruction pointers | `CLAUDE.md`, `AGENTS.md` | Session bootstrap pointers |
| Tests | `tests/control-plane/` | Positive + fail-closed negative coverage |

Workflow permission ceiling (normative): shadow-mode control-plane
workflows may hold at most `contents: read`, `issues: write`, and
pull-requests read access (`pull-requests: read`). **No control-plane
workflow may hold write access to repository contents or to pull
requests.** The deployed workflows hold exactly this and no more; the
ceiling equals the argued-safe privilege rather than sitting a level above
it (write access to pull requests would let a compromised step retarget,
close, or edit a lane PR even though it still could not merge). Third-party
actions are pinned to immutable commit SHAs. `pull_request_target` is
forbidden. Issue-comment content is untrusted input and is never evaluated
as shell.

### 7.1 Bootstrap

A manual, idempotent `workflow_dispatch` (`straylight-bootstrap.yml`) may
create the **Phase 49P shadow lane issue** after this ADR merges. It
creates at most one lane issue (search-before-create; existing-lane
detection parses every cp-lane issue body through the canonical protocol
parser rather than substring-matching the raw body, so a genesis in any
valid JSON formatting — compact included — is found, and an unparseable
lane-marker body aborts the bootstrap rather than being skipped),
implements nothing, opens no implementation PR, invokes no model API,
and merges nothing.

---

## 8. Delivered versus deferred (explicit separation)

**Delivered by this PR (repository control-plane capability):** the
protocol, schemas, policy, pure reducer/watchdog/merge-guard logic, CLI,
shadow workflows, prompts, agent instruction pointers, and tests — all in
shadow mode, unable to merge.

**Deferred — external schedules that must be configured after merge (none
of these exist yet, and this ADR does not claim they do):**

1. a ChatGPT automation/task that periodically reads the lane queue and
   performs the coordinator role;
2. a Claude cron/goal/routine that polls for `ready-for-claude` lanes and
   performs the implementer role;
3. a Codex scheduled task that polls for `ready-for-codex` lanes and
   performs the auditor role.

GitHub Actions in this repository does **not** call Anthropic or OpenAI
APIs for the control plane, holds no model API secrets for it, and does
not pretend it can run ChatGPT, Claude, or Codex. Until the external
schedules are installed, the control plane is a correct, durable,
machine-readable queue that humans and manually-invoked agents can
already operate. Unattended end-to-end execution is **not** active at
merge time.

---

## 9. Review posture for this slice

Flatline is unavailable in the operator's current phone/cloud-only
environment. This slice therefore compensates with: Cheval-style
capability decomposition before implementation; Claude adversarial
architecture and implementation self-review; comprehensive tests
including fail-closed negative tests; ChatGPT readiness assessment;
comprehensive Codex audit of the complete PR at an exact SHA; and
operator-authorized merge. **No claim is made that Flatline ran.**

Bridgebuilder is not required: this work changes no sibling repository,
no `.loa` submodule contract, no stable Loa package/API surface, no
cross-repository product contract, and no published schema consumed as a
stable interface by sibling repositories. If any future control-plane
change crosses one of those boundaries, it stops and reports rather than
expanding.

---

## 10. Preserved state

Nothing in this ADR advances or discharges any ADR-022E gate. Gate #8
remains **OPEN / HELD**; D.1(ii) remains unresolved; D.1 remains **NOT
YET SATISFIED**; D.2 remains **NOT STARTED**; gates #9 and #10 remain at
`PARTIAL_RECORDED` pending intake; **MVP-2 remains OPEN**. Phase 49P is
not implemented, not intaken, and not advanced by this ADR — the control
plane will later *coordinate* Phase 49P in shadow mode; it does not
*perform* it.
