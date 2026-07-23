# Straylight Autonomous Execution Control Plane v1

**Authority**: [ADR-050](../docs/decisions/ADR-050-autonomous-execution-control-plane.md).
**Mode**: shadow (default and only mode in v1). **Auto-merge**: forbidden.
**Shipped posture**: the committed policy is **enabled** (`"enabled": true`)
for report-only shadow bookkeeping and coordination while
consequence-disabled — the reducer, watchdog, and merge guard run and
record, and nothing merges, deploys, releases, or mutates anything beyond
lane issue comments and derived labels.
**Kill switch**: set `"enabled": false` in [`automation-policy.json`](./automation-policy.json)
(global — suspends even the report-only bookkeeping), or post an
`operator.paused` event on a lane (per-lane; the `cp-paused` label is the
derived projection of that state, not the switch).

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
    watchdog.mjs             ← recovery scan (expired leases, moved heads…);
                               issue-keyed action contract (C8)
    merge-guard.mjs          ← shadow merge-eligibility report (cannot merge)
    evidence.mjs             ← shared raw-evidence parser: N1 global
                               uniqueness (issue numbers, comment IDs,
                               check-run IDs, combined-status IDs unique
                               across complete paginated responses), N2
                               exact-equality target binding (repository /
                               issue / PR / exact SHA — never substring),
                               N5 chronology (strict instants,
                               updated_at >= created_at); zero-byte streams
                               invalid, one parsed [] page valid empty
    lane-target.mjs          ← universal lane-target authority (N3): unique
                               lane proof / absence proof from
                               same-execution evidence; duplicate valid
                               lane IDs refuse for EVERY writer (C1)
    collection.mjs           ← watchdog dual-collection stages (issue-slot /
                               PR-slot derivation, seal claims rule),
                               per-collection re-verification, canonical
                               planning projection, A/B comparison; ALSO
                               the closed straylight.read-plan.v1 +
                               straylight.fetch-slot-claim.v1 + gather
                               read-ledger contracts: the read-kind
                               allowlist constructs every GET and target
                               file name (no method/path/URL/filename
                               expressible); claims digest-bind to the
                               exact base evidence and are NEVER write
                               authority
    watchdog-plan.mjs        ← final dual-collection planner (independent
                               reparse of BOTH collections; any planning-
                               relevant difference refuses with its ab-*
                               code; issue-keyed deduped write plan)
    write-plan.mjs           ← closed straylight.write-plan.v1 schema:
                               operation-kind allowlist with fixed
                               method/path templates (no method/path/URL/
                               best_effort expressible), kind-derived
                               fatality, structural terminal barriers,
                               §9 cp-paused warning-gate rules, endpoint
                               body-content binding
  bin/                       ← thin CLI adapters (no network calls)
    reduce-issue.mjs
    watchdog-scan.mjs
    merge-guard-check.mjs
    validate-protocol.mjs
    lane-scan.mjs
    policy-gate.mjs          ← canonical workflow policy gate (exit 0 =
                               valid policy + enabled boolean true; exit 3 =
                               valid kill switch; exit 2 = malformed policy,
                               including ANY duplicate JSON key — the policy
                               text is parsed by strict-json.mjs, never
                               JSON.parse → fail closed, never enabled,
                               never a valid kill switch)
    collect-watchdog-evidence.mjs ← staged collection driver
                               (--stage issue-slots|pr-slots|seal), one
                               invocation per stage per collection;
                               appends the enumeration ledger row and
                               authors the S2→S3 / S4→S5 read plans
    plan-bootstrap-write.mjs ← bootstrap planner over TWO independent
                               enumerations (0 = absent in both stable
                               reads → plan create, 3 = exists-once
                               no-op, 2 = an enumeration difference /
                               duplicates / unreadable / malformed —
                               fail closed)
    plan-reducer-writes.mjs  ← staged reducer planner (--stage a | b, §
                               "Reducer stages" below); --probe writes
                               the closed fetch-slot claim + read plan
    plan-merge-guard-write.mjs ← merge-guard planner (report-only;
                               rebinds the probe claim + read ledger)
    plan-watchdog-writes.mjs ← final dual-collection watchdog planner
    execute-read-plan.mjs    ← THE single shared READ executor — the only
                               production code path that performs DERIVED
                               GitHub reads (§ "Read execution" below);
                               GET-only by construction, explicit
                               read-ledger rows
    execute-write-plan.mjs   ← THE single shared WRITE executor — the only
                               production code path that performs GitHub
                               writes (§ "Write execution" below)
  prompts/                   ← permanent actor prompts
    chatgpt-coordinator.md
    claude-fable-implementer.md
    codex-auditor.md
```

Workflows live in `.github/workflows/straylight-*.yml`. Their bash is
confined to three verbs: **fetch FIXED urls to files**, **switch on
validated exit codes**, and **invoke the checked-in Node entry points**
(probe/collector, the shared READ executor, a planner, the shared WRITE
executor). Bash never constructs a write request, never interprets
evidence content, never extracts a field from any evidence or derived
document (no inline Node, no jq, no evidence loops, no semantic command
substitution, no `|| true` on a fetch), never composes a ledger row, and
never calls `gh api -X POST/PATCH/DELETE` directly — no YAML/Bash step
performs a GitHub write, and every DERIVED fetch (a target computed from
evidence: a lane's recorded PR, a PR's head, a collection's issue slots)
flows through `bin/execute-read-plan.mjs` driven by a closed
`straylight.read-plan.v1` authored by a probe or collector. The boundary
is guarded by an executable contract
(`tests/control-plane/workflow-mutation.test.ts`) whose fail-closed
authorization layer is EXACT-BYTE WORKFLOW FINGERPRINTS: each of the
four checked-in workflow files is pinned by a literal committed
SHA-256 constant, and every enforcement surface (boundary check, read
contract, complete check, invocation collector) verifies exact
repository-relative identity + exact byte fingerprint through ONE
shared verifier before any result may read as permitted or clean. ANY
byte difference — a flipped quote, an appended comment, a changed
line ending, whitespace — fails all four surfaces closed, and a
fingerprint mismatch is never reported as an empty/clean result.
Editing a workflow therefore REQUIRES updating its pinned fingerprint
alongside explicit test review — that reviewed step is the contract's
purpose. Beneath the fingerprint gate, a diagnostic layer names the
specific construct a mutation introduced: an executable mutation
matrix over the workflows' LOGICAL shell lines (continuations joined,
escaped/quoted command words normalized, substitutions scanned
nesting-aware, process substitution refused), effective-command
decomposition (quote-aware separator split, substitution bodies
recursed, a closed allowlist of executable wrappers — `command`,
`env`, `exec`, `nohup`, `builtin`, `setsid`, `stdbuf`, `timeout`,
`nice` — resolved per their fixed syntax with unproven command
positions and `xargs` refused), a closed allowlist of the exact
checked-in read tuples in the exact single-negated `if ! <read>;
then` form, ordered per-stage occurrence contracts (the reducer's
seven occurrences, labels only in Stage B), and a strict structural
scan of the reducer's `jobs.reduce.steps` bound to the unique step
ids `gather_a`/`gather_b`. These diagnostics are SUPPLEMENTARY — they
classify and explain, but they authorize nothing: no shell or YAML
analysis grants a permitted result on mutated bytes, and the scan
claims no general YAML parsing. Structural authority over writes and
derived reads remains the fixed Node executors, which are the only
paths that construct requests. They never call model APIs and never
hold `contents: write`.

## Read execution (the shared read executor + fetch-slot claims)

Every DERIVED read flows through ONE invocation of
`bin/execute-read-plan.mjs` per read plan. A read plan is a closed
`straylight.read-plan.v1` document authored by a checked-in binary (the
reducer probe or the watchdog collector): reads carry validated
issue/PR numbers only — **no method, path, URL, host, header, or
filename is expressible**; the read-kind registry (`lib/collection.mjs`)
constructs every GET and every target file name, and the executor never
passes `-X` at all, so a read plan is structurally unable to smuggle a
write. The plan is containment-checked beneath `--plan-root` exactly
like a write plan. Every fetch attempt is an explicit read-ledger row
written ONLY by the executor: issue/comment fetch failure exits 4 with
NO row (the job fails — never "zero comments"); PR/check/status fetch
failure is a durable `{fetched:false}` row — never filename absence.
For the merge guard's check evidence, the bound head SHA is derived
INSIDE the executor from the just-fetched PR bytes via `evidence.mjs`
`parsePr` — never by shell.

The reducer/merge-guard probe's ONLY durable outputs are the read plan
and a closed `straylight.fetch-slot-claim.v1`: the slots it derived
(which PR; whether check evidence is required) digest-bound to the
exact evidence bytes of BOTH reads it derived them from. **A claim is
never write authority.** The final planner independently rederives the
slots from both raw reads, requires derived(read 1) = derived(read 2) =
claim (including the source digests), requires the read ledger to
account for EXACTLY the claim's slots (missing, extra, duplicate, or
wrong-PR rows refuse), digest-verifies every fetched file in its own
gather, refuses any slot-shaped file the ledger does not account for,
and requires the two gathers' live evidence to be canonically equal
over the COMPLETE validated records — the parsed PR metadata, every
check run's `{id, name, conclusion, head_sha}`, and every
combined-status entry's `{id, context, state}` — never aggregate
totals/conclusion lists alone: two reads whose totals and rollup agree
but whose run or status identities differ refuse as instability. The
canonical comparison is ORDER-INSENSITIVE but RECORD-SENSITIVE: records
and every derived aggregate (the conclusion list included) are
canonically id-sorted before digesting, so two reads carrying identical
records in different API page order are the same evidence, while any
drift in a run's id, name, conclusion, or bound head refuses.

## Write execution (the shared executor)

Every GitHub write flows through ONE invocation of
`bin/execute-write-plan.mjs` per plan. A plan is a closed
`straylight.write-plan.v1` document authored by a planner: operations
carry validated fields only — **no method, path, URL, host, endpoint, or
`best_effort` is expressible** (unknown fields refuse everywhere); the
executor constructs each request from the fixed per-kind template and
guards the constructed path again (defense in depth). `plan.repository`
must equal both the compiled-in allowlist (exactly
`0xHoneyJar/loa-straylight`) and the workflow-supplied argv;
`plan.nonce` must equal the run nonce
(`GITHUB_RUN_ID`-`GITHUB_RUN_ATTEMPT`) — no stale-plan replay.

The executor has exactly TWO phases:

- **Validation/preflight** — the plan file is CONTAINED first (J5): its
  parent directory must realpath to exactly the realpath'd
  `--request-root` and its name must be a single safe path component, so
  a plan outside the request root — or reached through a symlinked
  directory or traversal — is refused before it is even opened. Then the
  plan file and every body file are opened
  `O_RDONLY|O_NOFOLLOW` (a symlink at the final component refuses),
  fstat-checked as regular files, read EXACTLY ONCE from the descriptor,
  hashed against the plan's declared digest, strict-parsed against the
  kind's closed endpoint contract (exact full-line dedupe identity,
  single extractable machine marker, embedded payload validity,
  lane/issue binding), and the exact bytes RETAINED. Any failure exits
  **2**, which GUARANTEES: execution never began, no `gh` process was
  launched, zero write attempts occurred.
- **Execution** — begins immediately before the first validated
  operation. Requests are `spawnSync("gh", argv, { shell: false, input:
  <retained bytes>, env: {PATH, HOME, GH_TOKEN} })` with fixed argv
  (`api -X METHOD PATH --input -` for body-bearing kinds; the body is
  the retained validated bytes over stdin — the path is never reopened,
  so a post-validation swap cannot reach a request). After execution
  begins, EVERY launch error, transport error, fatal-operation `gh`
  failure, or executor exception exits **4** — including a launch
  failure on the very first operation and a launch failure for a
  warning-only label operation (no trustworthy result exists). No
  execution-phase condition may exit 2. Exit 4 means earlier operations
  may have executed: recovery is ALWAYS a fresh run — fresh evidence,
  fresh lane-target proof, fresh reconstruction, exact dedupe
  recognition of landed operations, a new plan containing only missing
  work.

A non-zero `gh` API RESULT is warning-only exclusively for the
hard-coded derived-label add/remove kinds (labels reconverge next run);
every other kind is fatal. Fatality is derived from the kind registry in
`lib/write-plan.mjs`; nothing in a plan can widen it.

**Structural terminal barriers**: a `post-state-advancing-event` is
terminal for its issue within its plan — the executor rejects, at
validation time, any plan with a second state-advancing operation for
the same issue or ANY operation addressing that issue after it. Across
the workflow, every state-advancing write is a terminal barrier: further
state-dependent work requires fresh evidence, a fresh proof, and a new
plan.

**cp-paused warning gate (§ uniform)**: every removal of `cp-paused`
uses the dedicated `remove-derived-cp-paused-after-warning` kind (a
plain `remove-derived-label` naming `cp-paused` or `cp-lane` refuses).
The removal requires exactly one of `warning_op_id` (an earlier
same-plan `post-cp-paused-warning`, fatal by kind — if the warning post
fails the executor exits 4 and the removal is never attempted) or
`warning_proof` (the planner proved the warning already present: a
bot-authored comment whose body BYTE-EXACTLY equals the canonical
state-neutral warning for that lane/issue — a comment that merely
contains the dedupe line, or differs by one byte, or comes from any
other author, is never a proof (J4) — so removal retries without
re-posting). The warning text is state-neutral: labels are derived
projections and reconstruction no longer supports the label; it never
asserts how the label came to be present.

## Evidence discipline (every writer)

Every byte of GitHub evidence flows through `lib/evidence.mjs` before
anything derives from it: strict duplicate-key-rejecting JSON, N1 global
uniqueness, N2 exact-equality binding to the expected repository / issue
/ PR / exact commit SHA, N5 strict-instant chronology
(`updated_at >= created_at`), combined-status integrity (unique entry
IDs, contexts, states, `statuses.length === total_count`, exact sha +
repository binding), zero-byte streams invalid, one parsed `[]` page
valid empty evidence. Files are byte containers, never identity
authority.

Before EVERY lane-addressed write, the writer proves the lane target
unique via `lib/lane-target.mjs` from same-execution evidence (N3) — in
BOTH independent reads (J1): the two-read stability fence includes each
read's canonical lane→issue mapping (lanes, duplicates, unreadable
markers), so lane identity itself is fence-compared, and the lane-target
proof runs against each read separately. Duplicate valid lane IDs in
EITHER read exit 2 for every writer — bootstrap included (C1), which
enumerates twice and proves lane ABSENCE in both stable reads before
creating anything — and any unreadable marker-bearing body blocks both
targeting and absence proofs (it could BE the lane in mangled form).

## Reducer stages (Stage A / Stage B)

The reducer job is two strictly ordered stages, each with its own fresh
two-read-stable evidence (the gather runs twice; planning-relevant
canonical projections must be equal, else exit 2), its own lane-target
proof, its own plan, and its own single executor invocation:

- **Stage A — eligibility confirmation (state-advancing, terminal)**:
  the probe writes the closed fetch-slot claim (the recorded PR, only
  when the lane is `eligibility-pending`, digest-bound to both reads'
  evidence bytes) and the read plan; the shared read executor fetches
  the claimed PR into BOTH gathers with explicit ledger rows. The final
  planner fetches nothing itself: it rederives the slot from both raw
  reads, requires derived = claim, verifies the read ledger and every
  digest, parses the per-gather live PR with full binding (the two
  gathers' parsed records must be canonically equal; an explicit
  `{fetched:false}` in either gather is a fail-closed no-op), proves
  exact dedupe from the collected comment stream, and dry-runs the
  candidate (append → re-reduce → require `ready-for-merge`; a doomed
  confirmation is a no-op that never burns the dedupe key). The Stage A
  plan contains EXACTLY ONE operation: the
  `system.eligibility_confirmed` event. Stage A is terminal for its plan
  and its reconstruction.
- **Stage B — projections and publication (non-state-advancing)**: a
  COMPLETELY FRESH gather — never Stage A's evidence, even when Stage A
  posted nothing — whose reconstruction includes Stage A's confirmation
  if one posted. Plans, in structural order: derived-label additions and
  removals (`deriveLabels` projection vs parsed label evidence; a failed
  label read aborts, never "no labels"), the warning-gated cp-paused
  pair when required, and the exact-deduped reducer-result comment.
  Stage B never emits a state-advancing operation.

## Watchdog dual collection

The watchdog gathers TWO complete, independently collected evidence sets
(Collection A, Collection B). Each advances S0→S6: bash fetches ONLY the
fixed enumeration url; the collector binary derives (issue slots from
enumeration ONLY — the stage schema has no PR field, so enumeration-only
evidence structurally cannot emit PR slots; PR slots only after that
collection's complete issue/comment evidence exists, via reconstruction;
the seal re-derives both slot sets from raw bytes and verifies every
ledger claim — a manifest can never claim a slot its own raw evidence
does not independently produce), appends the enumeration ledger row, and
authors the closed read plans; the shared read executor performs every
per-slot issue/comment/PR fetch and writes every derived-fetch ledger
row. Reconstruction additionally binds each FETCHED issue body's lane
identity to the ENUMERATION's derivation for the same issue (J6:
`enumeration-fetch-identity-mismatch`), and the seal/verify stages
require EXACTLY one issue row and one comments row per enumerated slot —
an unenumerated resource row refuses (`ledger-unenumerated-resource`),
as does a missing one (`ledger-resource-missing`). A failed PR fetch is
an explicit durable `{fetched:false}` ledger row, never filename
absence; a failed issue/comment/enumeration fetch fails the job.

Collection B shares NOTHING derived from Collection A. The final
planner (`plan-watchdog-writes.mjs`) trusts nothing derived earlier: it
independently reparses both complete collections (ledger reparse, digest
re-verification, evidence reparse, fresh reconstruction, slot
re-derivation vs manifest claims, PR reparse with binding), builds
canonical planning projections, and refuses ANY planning-relevant
difference with a specific code (`ab-issue-set-difference`,
`ab-lane-set-difference`, `ab-lane-mapping-difference`,
`ab-reconstruction-difference`, `ab-comment-evidence-difference`,
`ab-pr-slot-difference`, `ab-pr-metadata-difference`,
`ab-head-sha-difference`, `ab-fetch-outcome-difference`, plus
`ab-canonical-digest-difference` as the catch-all). PR fetch outcomes
are keyed by the COMPOUND `{issue_number}:{pr_number}` slot identity —
never by PR number alone (J7) — and the comparison walks the UNION of
both collections' key sets, so two lanes recording the same PR can never
alias asymmetric per-issue outcomes into agreement; a stable world where
one PR resolved for one issue but failed for another refuses at planning
(`pr-head-conflict`). Equivalent explicit PR-fetch failures in BOTH
collections are agreement (the unresolved-head fail-closed finding), not
a difference. An A/B difference aborts the whole sweep — the accepted v1
liveness tradeoff — and the next cron firing retries against a stable
world.

Planning is ISSUE-KEYED (C8): every scan action carries the issue
number of the lane entry it derived from; an action the planner cannot
key refuses the sweep (a finding is never dropped silently). Findings
precede any state-advancing event for their issue; the watchdog emits
at most one state-advancing event per issue per plan.

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
- EVERY escalation to `operator-required` — reducer verdicts, corridor
  escalations, watchdog escalations, and reconstruction's edited-comment
  routing alike — clears any active lease: a lease carried into
  `operator-required` would be a cross-state lease, making the escalated
  lane structurally invalid and unrecoverable. An escalated lane is always
  a valid lane the operator can act on with `operator.decision`;
- the genesis lane record must be TRULY initial: `state: planning`,
  `event_sequence: 0`, and null/zero for `working_branch`, `pr_number`,
  `pr_head_sha`, `audited_sha`, `verdict`, `lease`, `attempt`,
  `patch_cycle`, `audit_retry`, `last_lease_role`, with `operator_pause`
  false. A genesis that preseeds any of them (e.g. a preselected
  `working_branch`) is refused (`genesis-not-initial`) — in-flight state
  is established only by applied events;
- protocol timestamps are strict UTC calendar instants with at most
  MILLISECOND (3-digit) fractional precision; a finer fraction is rejected
  everywhere (never rounded), so two distinct instants can never collapse
  into one and strict ordering is preserved;
- malformed anything (lane, event, packet, audit, policy) → no advance;
- an INVALID policy takes precedence over every comment-level handling
  path in reconstruction: each protocol comment is refused as
  `policy-invalid` before the edited-comment check (or any identity/
  artifact/event route) can change lane state, so the lane stays at its
  genesis state and event sequence;
- `policy.enabled: false` (kill switch) → every event refused;
- workflows consult the canonical executable gate
  (`.straylight/bin/policy-gate.mjs` → strict duplicate-key-rejecting
  JSON parse → `validatePolicy`) before any network or mutation action —
  literal boolean `true` proceeds, literal boolean `false` is a valid
  kill switch (no action), anything else (string `"true"`/`"false"`,
  null, missing, number, array, object, any other invalid field, or a
  policy text with ANY duplicate object key anywhere — a contradictory
  duplicate `enabled` is ambiguous, never "last wins") fails closed;
  `jq` textual output is never policy authority, and `JSON.parse` is
  never the policy's parsing authority;
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
becomes the lane's `working_branch` when the packet event applies —
UNCONDITIONALLY. An initial packet applies only to a lane whose
`working_branch` is null (a genesis cannot preseed one — reconstruction
refuses it as `genesis-not-initial` — and an initial packet on a lane
with an established branch is refused as
`working-branch-already-established`), so the establishing branch always
comes from the packet itself, never from a pre-existing lane field. When
the operator routes a lane back to coordination (`operator.decision` →
`planning`/`ready-for-coordinator`), the establishment resets:
`working_branch` clears and the next initial packet establishes it anew.
Every later packet must name that exact branch; the implementer's
completion must declare `head_branch` equal to it; the audit's
`head_branch` must equal it; and the eligibility confirmation's live
`head_branch` must equal it. No packet may name the lane's base branch
as its target.

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

All four follow the same boundary: **gather → plan → one executor
invocation per plan** (after the 0/3/2 policy gate). Planner exit codes
are uniform: 0 = plan written → execute; 3 = valid no-op (nothing to
post / already exists); 2 or anything else = refusal, fail the job
closed, zero writes.

| Workflow | Trigger | Does | Never |
|---|---|---|---|
| `straylight-reducer.yml` | `issues`, `issue_comment` on `cp-lane` issues; manual | Stage A: two-read-stable gather (fixed urls) → probe (writes claim + read plan) → read executor (claimed PR into both gathers, ledger rows) → `plan-reducer-writes.mjs --stage a` (claim rebinding, ledger accounting, exact dedupe, dry-run, ≤1 confirmation event — terminal) → execute. Stage B: fresh two-read-stable gather (never Stage A's evidence) → `--stage b` (derived labels vs parsed label evidence, warning-gated cp-paused pair, exact-deduped result) → execute | execute an individual `gh` write from bash; extract a field from evidence or probe output in shell; derive Stage B from Stage A's evidence; post state advancement in Stage B; evaluate comment content as shell; call model APIs; write repo contents |
| `straylight-watchdog.yml` | cron (off-minute) + manual | Collection A (S0–S6) → Collection B (S0–S6, fully independent) — bash fetches only the fixed enumeration url; the collector derives + authors read plans; the read executor performs every per-slot fetch and writes every ledger row → `plan-watchdog-writes.mjs` over both (independent reparse + A/B equivalence gate, compound-keyed PR outcomes) → execute. Discovery stays label-independent through the shared parsers; unreadable / failed-reconstruction issues surface as issue-keyed malformed-lane findings (no fabricated lane IDs), never dropped; a failed enumeration or issue/comment fetch aborts the sweep — never zero lanes | trust any stage output / manifest / filename as authority; compose a ledger row in bash; write after an A/B difference; post two state-advancing events for one issue in one plan; hide a lane because its label was removed; merge |
| `straylight-merge-guard.yml` | manual `workflow_dispatch` (lane issue number) | two-read-stable gather (fixed urls) → probe (any-pr slot mode with checks; writes claim + read plan) → read executor (PR into both gathers; bound-head check evidence derived inside the executor) → `plan-merge-guard-write.mjs` (lane-target proof in both reads, claim rebinding, ledger accounting, pure evaluation, exact dedupe) → execute (one shadow result comment) | merge (no merge API call exists anywhere in the chain); write without the lane-target proof; extract a head SHA in shell; forward loose single PR fields |
| `straylight-bootstrap.yml` | manual `workflow_dispatch` | TWO label-independent all-issues enumerations + label enumeration + base-SHA resolution from origin/main (materialized to a file the planner reads itself) → `plan-bootstrap-write.mjs` (two-read canonical lane-identity equality, then the universal lane-ABSENCE proof in BOTH reads: an enumeration difference, duplicates anywhere, unreadable genesis bodies, malformed pages/labels, or a bad base SHA exit 2; an existing unique lane exits 3; the planned genesis satisfies the reducer's own validator) → execute (label definition if missing + lane issue) | create when either read's lane-absence proof fails; create against an unstable enumeration; implement 49P, open its PR, call a model API, merge; detect lanes by raw-substring matching or by label |

All workflows: least-privilege permissions (`contents: read` +
`issues: write` and/or `pull-requests: read`), actions pinned to
immutable commit SHAs, checkout pinned to `ref: main` (with recursive
submodules) so the canonical policy gate, the committed automation
policy, and all protocol/reconstruction code are loaded from CURRENT
MAIN — a manual dispatch selecting an older or non-main ref never
evaluates an older enabled policy or older control-plane code —
concurrency groups so two runs cannot move the same lane simultaneously,
payloads passed to Node via files/stdin — never interpolated into shell.

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
2. enumerate all open issues and identify lane issues through the
   canonical marker parser (`node .straylight/bin/lane-scan.mjs
   --all-lanes`) — the `cp-lane` label is a derived convenience
   projection, never discovery authority;
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
