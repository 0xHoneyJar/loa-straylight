#!/usr/bin/env node
// Straylight Control Plane v1 — staged reducer planner (§8).
//
// STAGE A — eligibility confirmation (state-advancing, terminal):
//
//   node plan-reducer-writes.mjs --stage a --probe \
//     --gather-1 <dir1> --gather-2 <dir2> --issue-number <n> \
//     --repository <owner/repo> --nonce <id>-<attempt> --now <iso> [--policy <f>]
//       → validates both reads, proves the lane target, reconstructs, and
//         prints {ok, state, lane_id, pr_number} WITHOUT writing a plan —
//         bash uses this DERIVED output (never raw evidence) to decide
//         whether and which PR to fetch. Exit 0 = probed; exit 2 = refuse.
//
//   node plan-reducer-writes.mjs --stage a \
//     …same args… --request-root <dir>
//       → requires <gather-2>/pr.json when the lane is eligibility-pending;
//         constructs the durable-embedding system.eligibility_confirmed
//         event, proves dedupe from the collected comment stream, dry-runs
//         it (append candidate → re-reduce → require ready-for-merge), and
//         writes a ONE-OPERATION plan. Exit 0 = plan written; exit 3 =
//         valid no-op (not pending / already confirmed / dry-run refusal —
//         retry next run); exit 2 = refuse.
//
//   Stage A is TERMINAL for its plan: the single operation is the
//   confirmation event; the executor's structural rule independently
//   forbids anything after it for the same issue.
//
// STAGE B — projections and publication (non-state-advancing):
//
//   node plan-reducer-writes.mjs --stage b \
//     --gather-1 <dir1> --gather-2 <dir2> --issue-number <n> \
//     --request-root <dir> --repository … --nonce … --now … [--policy <f>]
//       → NEWLY FETCHED state, unconditionally (never Stage A's evidence):
//         plans, in structural order, derived-label additions/removals
//         (deriveLabels projection vs the fetched label evidence), the §9
//         warning-gated cp-paused pair when a cp-paused removal is
//         required, and the exact-deduped reducer-result comment. Never
//         emits a state-advancing operation. Exit 0/3/2 as above.
//
// TWO-READ STABILITY FENCE (carried): each gather directory holds one
// complete read (enumeration.pages, issue.json, comments.pages, and for
// stage b labels.pages). The planning-relevant canonical projections of
// both reads must be equal, else exit 2 — the world moved mid-gather.
//
// UNIVERSAL LANE-TARGET PROOF (N3): the reconstructed lane's lane_id must
// map to EXACTLY this issue in the same-execution enumeration; duplicate
// valid lane IDs exit 2 (C1).
//
// No network I/O; no GitHub writes; files are byte containers.

import { readFileSync, writeFileSync, realpathSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parseStrict } from "../lib/strict-json.mjs";
import { parseIssuePages, parseIssue, parseCommentPages, parsePr, parseLabelPages } from "../lib/evidence.mjs";
import { assertUniqueLaneTarget } from "../lib/lane-target.mjs";
import { reconstructLane, deriveLabels } from "../lib/reconstruct.mjs";
import { payloadDigest } from "../lib/canonical.mjs";
import { renderPayload, MARKERS } from "../lib/markers.mjs";
import { WRITE_PLAN_SCHEMA, warningDedupeKey, warningBodyFor, hasFullLineDedupe } from "../lib/write-plan.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const BOT = "github-actions[bot]";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function flag(name) {
  return process.argv.includes(name);
}

function fail(reason, detail) {
  process.stdout.write(JSON.stringify({ ok: false, reason, ...(detail ? { detail } : {}) }) + "\n");
  process.exit(2);
}

function noop(payload) {
  process.stdout.write(JSON.stringify({ ok: true, empty: true, ...payload }) + "\n");
  process.exit(3);
}

const sha256 = (text) => "sha256:" + createHash("sha256").update(text, "utf8").digest("hex");

const stage = arg("--stage");
if (stage !== "a" && stage !== "b") fail("usage", "--stage must be a or b");
const probe = flag("--probe");
const gather1 = arg("--gather-1");
const gather2 = arg("--gather-2");
const issueArg = arg("--issue-number");
const repository = arg("--repository");
const nonce = arg("--nonce");
const now = arg("--now");
for (const [name, v] of [["--gather-1", gather1], ["--gather-2", gather2], ["--issue-number", issueArg], ["--repository", repository], ["--nonce", nonce], ["--now", now]]) {
  if (v === null) fail("usage", `${name} is required`);
}
const issueNumber = Number(issueArg);
if (!Number.isInteger(issueNumber) || issueNumber < 1) fail("usage", "--issue-number must be a positive integer");
const requestRoot = arg("--request-root");
if (!probe && requestRoot === null) fail("usage", "--request-root is required unless --probe");

function loadPolicy() {
  const policyPath = arg("--policy") ?? resolve(here, "..", "automation-policy.json");
  let text;
  try {
    text = readFileSync(policyPath, "utf8");
  } catch (e) {
    fail("policy-unreadable", String(e?.message ?? e));
  }
  const parsed = parseStrict(text);
  if (!parsed.ok) fail("policy-unreadable", `strict JSON parse failed: ${parsed.reason}`);
  return parsed.value;
}
const policy = loadPolicy();

// Parse one complete read: enumeration + issue + comments (+ labels for
// stage b). Every stream goes through the shared evidence parser.
function parseRead(dir, { withLabels }) {
  const realDir = realpathSync(resolve(dir));
  const readText = (name) => {
    const path = join(realDir, name);
    if (!existsSync(path)) fail("gather-incomplete", `${name} missing in ${dir}`);
    return readFileSync(path, "utf8");
  };
  const enumerated = parseIssuePages(readText("enumeration.pages"), { repository });
  if (!enumerated.ok) fail(enumerated.reason, `${dir}: ${enumerated.detail ?? ""}`);
  const issue = parseIssue(readText("issue.json"), { repository, issue_number: issueNumber });
  if (!issue.ok) fail(issue.reason, `${dir}: ${issue.detail ?? ""}`);
  const comments = parseCommentPages(readText("comments.pages"), { repository, issue_number: issueNumber });
  if (!comments.ok) fail(comments.reason, `${dir}: ${comments.detail ?? ""}`);
  let labels = null;
  if (withLabels) {
    const parsed = parseLabelPages(readText("labels.pages"), { repository });
    if (!parsed.ok) fail(parsed.reason, `${dir}: ${parsed.detail ?? ""}`);
    labels = parsed.labels;
  }
  return { realDir, issues: enumerated.issues, issue: issue.issue, comments: comments.comments, labels };
}

// The planning-relevant canonical projection of one read: the
// reconstructed lane, the comment evidence (dedupe-proof source), and —
// stage b — the current cp-* label set. Issue updated_at is deliberately
// NOT included (it is not planning-relevant to the reducer and would trip
// the fence on unrelated activity).
function projectRead(read) {
  const reconstruction = reconstructLane({
    issue_body: read.issue.body ?? "",
    comments: read.comments,
    policy,
    context: { now },
  });
  const projection = {
    reconstruction: reconstruction.ok
      ? { ok: true, frozen: reconstruction.frozen === true, lane: reconstruction.lane, labels: reconstruction.labels }
      : { ok: false, refusal: reconstruction.refusal },
    comment_evidence_digest: payloadDigest(
      read.comments
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((c) => ({ id: c.id, user: c.user, body: c.body, created_at: c.created_at, updated_at: c.updated_at })),
    ),
    cp_labels: read.labels === null ? null : read.labels.filter((l) => l.startsWith("cp-")).sort(),
  };
  return { reconstruction, projection };
}

const withLabels = stage === "b";
const read1 = parseRead(gather1, { withLabels });
const read2 = parseRead(gather2, { withLabels });
const p1 = projectRead(read1);
const p2 = projectRead(read2);

// TWO-READ STABILITY FENCE: the world must not have moved mid-gather.
if (payloadDigest(p1.projection) !== payloadDigest(p2.projection)) {
  fail("two-read-instability", "planning-relevant projections differ between reads; retry next run");
}

const reconstruction = p2.reconstruction;
if (!reconstruction.ok) {
  fail("reconstruction-failed", reconstruction.refusal);
}
if (reconstruction.frozen === true) {
  // The policy gate proved the committed policy valid + enabled in this
  // same run; a frozen reconstruction contradicts it.
  fail("frozen-under-enabled-policy");
}
const lane = reconstruction.lane;

// UNIVERSAL LANE-TARGET PROOF (N3): this lane_id maps to exactly THIS
// issue in the same-execution enumeration.
const target = assertUniqueLaneTarget(read2.issues, lane.lane_id, { expected_issue: issueNumber });
if (!target.ok) fail(target.reason, target.detail);

// Exact-full-line dedupe proof over BOT-authored machine comments (B8/C4).
function alreadyPosted(dedupeKey, markerNames) {
  return read2.comments.some(
    (c) =>
      c.user === BOT &&
      markerNames.some((m) => c.body.includes(`<!-- ${m} -->`)) &&
      hasFullLineDedupe(c.body, dedupeKey),
  );
}

// =============================================================================
// STAGE A
// =============================================================================
if (stage === "a") {
  if (probe) {
    process.stdout.write(JSON.stringify({
      ok: true,
      state: lane.state,
      lane_id: lane.lane_id,
      pr_number: lane.pr_number ?? null,
    }) + "\n");
    process.exit(0);
  }

  if (lane.state !== "eligibility-pending") {
    noop({ state: lane.state, detail: "lane not eligibility-pending; nothing to confirm" });
  }
  if (!Number.isInteger(lane.pr_number)) {
    // eligibility-pending without a recorded PR cannot be confirmed;
    // fail closed as a no-op (the watchdog escalates a stuck lane).
    noop({ state: lane.state, detail: "no PR recorded; cannot confirm (fail closed)" });
  }

  // Live PR evidence: parsed through the shared evidence parser with
  // repository + PR-number binding. Its absence is a no-op (fetch failed;
  // lane stays pending; retried next run) — never a guessed record.
  const prPath = join(read2.realDir, "pr.json");
  if (!existsSync(prPath)) {
    noop({ state: lane.state, detail: "live PR evidence unavailable; posting nothing (fail closed)" });
  }
  const prParsed = parsePr(readFileSync(prPath, "utf8"), { repository, pr_number: lane.pr_number });
  if (!prParsed.ok) fail(prParsed.reason, prParsed.detail);
  const meta = prParsed.pr;

  const dedupe = `eligibility-confirmed:${lane.lane_id}:${lane.event_sequence}`;
  if (alreadyPosted(dedupe, [MARKERS.event])) {
    noop({ state: lane.state, detail: `confirmation already posted for ${dedupe}` });
  }

  const eventId = "evt-" + createHash("sha256").update(dedupe, "utf8").digest("hex").slice(0, 48);
  const event = {
    schema: "straylight.event.v1",
    event_id: eventId,
    lane_id: lane.lane_id,
    sequence: lane.event_sequence + 1,
    actor_role: "system",
    github_actor: BOT,
    event_type: "system.eligibility_confirmed",
    prior_state: "eligibility-pending",
    occurred_at: now,
    pr_metadata: meta,
  };
  const commentBody = [
    "## Straylight eligibility confirmation (shadow mode)",
    "",
    `dedupe:${dedupe}`,
    "",
    renderPayload(MARKERS.event, event),
    "",
    "_Live PR metadata checked and recorded durably above. Nothing merges; merge remains an exclusive operator action._",
  ].join("\n");

  // DRY-RUN (carried): append the candidate to the fetched stream and
  // re-reduce. Plan ONLY if the pure reducer would APPLY it — a doomed
  // confirmation would burn the dedupe key for this sequence and park the
  // lane (liveness, not just safety).
  const maxId = read2.comments.reduce((m, c) => Math.max(m, c.id), 0);
  const dryRun = reconstructLane({
    issue_body: read2.issue.body ?? "",
    comments: [...read2.comments, { id: maxId + 1, user: BOT, body: commentBody, created_at: now, updated_at: now }],
    policy,
    context: { now },
  });
  if (!dryRun.ok || dryRun.lane?.state !== "ready-for-merge") {
    noop({
      state: lane.state,
      detail: `dry-run: confirmation would be refused (lane stays ${dryRun.ok ? dryRun.lane?.state : "unreadable"}); retry next run`,
    });
  }

  // The Stage A plan contains EXACTLY ONE operation — the confirmation.
  const content = JSON.stringify({ body: commentBody });
  const realRoot = realpathSync(resolve(requestRoot));
  writeFileSync(join(realRoot, "op-1.json"), content);
  const plan = {
    schema: WRITE_PLAN_SCHEMA,
    plan_id: `${nonce}-reducer-a`,
    nonce,
    repository,
    operations: [{
      op_id: "op-1",
      kind: "post-state-advancing-event",
      issue_number: issueNumber,
      lane_id: lane.lane_id,
      dedupe_key: dedupe,
      body_file: "op-1.json",
      body_sha256: sha256(content),
    }],
  };
  writeFileSync(join(realRoot, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ ok: true, empty: false, operations: 1, dedupe }) + "\n");
  process.exit(0);
}

// =============================================================================
// STAGE B — labels, warning-gated cp-paused pair, result comment.
// =============================================================================
const wanted = deriveLabels(lane);
const have = read2.labels.filter((l) => l.startsWith("cp-"));
const operations = [];
const bodies = [];
let opCounter = 0;
const nextOpId = () => `op-${++opCounter}`;

// Additions first (converging toward the projection), then removals.
for (const label of wanted) {
  if (have.includes(label)) continue;
  const opId = nextOpId();
  const content = JSON.stringify({ labels: [label] });
  bodies.push({ name: `${opId}.json`, content });
  operations.push({
    op_id: opId,
    kind: "add-derived-label",
    issue_number: issueNumber,
    label,
    body_file: `${opId}.json`,
    body_sha256: sha256(content),
  });
}
for (const label of have) {
  if (wanted.includes(label) || label === "cp-lane") continue;
  if (label === "cp-paused") {
    // §9: EVERY cp-paused removal goes through the warning-gated kind.
    // Prove the exact warning already present, or post it (fatal) first.
    const wDedupe = warningDedupeKey(lane.lane_id, issueNumber);
    const proofComment = read2.comments.find(
      (c) => c.user === BOT && hasFullLineDedupe(c.body, wDedupe),
    );
    if (proofComment !== undefined) {
      operations.push({
        op_id: nextOpId(),
        kind: "remove-derived-cp-paused-after-warning",
        issue_number: issueNumber,
        lane_id: lane.lane_id,
        warning_proof: { comment_id: proofComment.id, dedupe_key: wDedupe },
      });
    } else {
      const wOpId = nextOpId();
      const wContent = JSON.stringify({ body: warningBodyFor(lane.lane_id, issueNumber) });
      bodies.push({ name: `${wOpId}.json`, content: wContent });
      operations.push({
        op_id: wOpId,
        kind: "post-cp-paused-warning",
        issue_number: issueNumber,
        lane_id: lane.lane_id,
        dedupe_key: wDedupe,
        body_file: `${wOpId}.json`,
        body_sha256: sha256(wContent),
      });
      operations.push({
        op_id: nextOpId(),
        kind: "remove-derived-cp-paused-after-warning",
        issue_number: issueNumber,
        lane_id: lane.lane_id,
        warning_op_id: wOpId,
      });
    }
  } else {
    operations.push({
      op_id: nextOpId(),
      kind: "remove-derived-label",
      issue_number: issueNumber,
      label,
    });
  }
}

// The reducer-result comment (deduped per event_sequence + state).
const resultDedupe = `reducer-result:${lane.event_sequence}:${lane.state}`;
if (!alreadyPosted(resultDedupe, [MARKERS.reducerResult])) {
  const result = {
    dedupe: `dedupe:${resultDedupe}`,
    ok: true,
    labels: wanted,
    lane: {
      lane_id: lane.lane_id,
      state: lane.state,
      next_actor: lane.next_actor,
      event_sequence: lane.event_sequence,
      pr_number: lane.pr_number ?? null,
      pr_head_sha: lane.pr_head_sha ?? null,
      audited_sha: lane.audited_sha ?? null,
      verdict: lane.verdict ?? null,
      patch_cycle: lane.patch_cycle,
      operator_pause: lane.operator_pause,
    },
    dispositions: reconstruction.dispositions,
  };
  const commentBody = [
    "## Straylight reducer result (shadow mode)",
    "",
    `State: \`${lane.state}\` · next actor: \`${lane.next_actor}\` · sequence: \`${lane.event_sequence}\``,
    "",
    `dedupe:${resultDedupe}`,
    "",
    renderPayload(MARKERS.reducerResult, result),
    "",
    "_Mechanical reduction only. No semantic decision. Nothing merges. Kill switch: `.straylight/automation-policy.json` → `enabled: false`._",
  ].join("\n");
  const opId = nextOpId();
  const content = JSON.stringify({ body: commentBody });
  bodies.push({ name: `${opId}.json`, content });
  operations.push({
    op_id: opId,
    kind: "post-reducer-result",
    issue_number: issueNumber,
    dedupe_key: resultDedupe,
    body_file: `${opId}.json`,
    body_sha256: sha256(content),
  });
}

if (operations.length === 0) {
  noop({ state: lane.state, detail: "labels converged and result already posted" });
}

const realRoot = realpathSync(resolve(requestRoot));
for (const body of bodies) {
  writeFileSync(join(realRoot, body.name), body.content);
}
const plan = {
  schema: WRITE_PLAN_SCHEMA,
  plan_id: `${nonce}-reducer-b`,
  nonce,
  repository,
  operations,
};
writeFileSync(join(realRoot, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
process.stdout.write(JSON.stringify({ ok: true, empty: false, operations: operations.length, state: lane.state }) + "\n");
process.exit(0);
