#!/usr/bin/env node
// Straylight Control Plane v1 — merge-guard planner (report-only).
//
//   node plan-merge-guard-write.mjs \
//     --gather-1 <dir1> --gather-2 <dir2> --issue-number <n> \
//     --request-root <dir> --repository <owner/repo> \
//     --nonce <id>-<attempt> --now <iso> [--policy <file>]
//
// Two-read stable gather (lane + PR + check-runs + combined status, all
// through the shared evidence parser with N1/N2 profiles), universal
// lane-target proof, pure merge-guard evaluation, exact-deduped shadow
// result plan. THIS PLANNER CANNOT MERGE: it evaluates eligibility and
// plans one report comment; no merge call exists anywhere in the chain.
//
// Each gather directory holds: enumeration.pages, issue.json,
// comments.pages, and optionally pr.json, check-runs.pages, status.json
// (present only when the lane records a PR and the head resolved —
// absence is fail-closed ineligibility, never a guess).
//
// Exit 0 = plan written. Exit 3 = valid no-op (result already posted).
// Exit 2 = refusal (fail closed; nothing written).

import { readFileSync, writeFileSync, realpathSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parseStrict } from "../lib/strict-json.mjs";
import { parseIssuePages, parseIssue, parseCommentPages, parsePr, parseCheckRunPages, parseCombinedStatus } from "../lib/evidence.mjs";
import { assertUniqueLaneTarget } from "../lib/lane-target.mjs";
import { reconstructLane } from "../lib/reconstruct.mjs";
import { evaluate } from "../lib/merge-guard.mjs";
import { payloadDigest } from "../lib/canonical.mjs";
import { renderPayload, MARKERS } from "../lib/markers.mjs";
import { WRITE_PLAN_SCHEMA, hasFullLineDedupe } from "../lib/write-plan.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const BOT = "github-actions[bot]";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function fail(reason, detail) {
  process.stdout.write(JSON.stringify({ ok: false, reason, ...(detail ? { detail } : {}) }) + "\n");
  process.exit(2);
}

const gather1 = arg("--gather-1");
const gather2 = arg("--gather-2");
const issueArg = arg("--issue-number");
const requestRoot = arg("--request-root");
const repository = arg("--repository");
const nonce = arg("--nonce");
const now = arg("--now");
for (const [name, v] of [["--gather-1", gather1], ["--gather-2", gather2], ["--issue-number", issueArg], ["--request-root", requestRoot], ["--repository", repository], ["--nonce", nonce], ["--now", now]]) {
  if (v === null) fail("usage", `${name} is required`);
}
const issueNumber = Number(issueArg);
if (!Number.isInteger(issueNumber) || issueNumber < 1) fail("usage", "--issue-number must be a positive integer");

const policyPath = arg("--policy") ?? resolve(here, "..", "automation-policy.json");
let policy;
{
  let text;
  try {
    text = readFileSync(policyPath, "utf8");
  } catch (e) {
    fail("policy-unreadable", String(e?.message ?? e));
  }
  const parsed = parseStrict(text);
  if (!parsed.ok) fail("policy-unreadable", `strict JSON parse failed: ${parsed.reason}`);
  policy = parsed.value;
}

// Parse one complete read. PR/check/status evidence is OPTIONAL on disk
// (a failed fetch is recorded by absence) but when present it must parse
// and bind exactly; the pure module fails closed on absence downstream.
function parseRead(dir) {
  const realDir = realpathSync(resolve(dir));
  const readText = (name) => {
    const path = join(realDir, name);
    if (!existsSync(path)) return null;
    return readFileSync(path, "utf8");
  };
  const enumText = readText("enumeration.pages");
  if (enumText === null) fail("gather-incomplete", `enumeration.pages missing in ${dir}`);
  const enumerated = parseIssuePages(enumText, { repository });
  if (!enumerated.ok) fail(enumerated.reason, `${dir}: ${enumerated.detail ?? ""}`);
  const issueText = readText("issue.json");
  if (issueText === null) fail("gather-incomplete", `issue.json missing in ${dir}`);
  const issue = parseIssue(issueText, { repository, issue_number: issueNumber });
  if (!issue.ok) fail(issue.reason, `${dir}: ${issue.detail ?? ""}`);
  const commentsText = readText("comments.pages");
  if (commentsText === null) fail("gather-incomplete", `comments.pages missing in ${dir}`);
  const comments = parseCommentPages(commentsText, { repository, issue_number: issueNumber });
  if (!comments.ok) fail(comments.reason, `${dir}: ${comments.detail ?? ""}`);

  const reconstruction = reconstructLane({
    issue_body: issue.issue.body ?? "",
    comments: comments.comments,
    policy,
    context: { now },
  });

  // PR evidence binds to the lane's recorded PR number.
  let prMeta = { fetch_ok: false };
  let checks = null;
  const lane = reconstruction.ok ? reconstruction.lane : null;
  if (lane !== null && Number.isInteger(lane.pr_number)) {
    const prText = readText("pr.json");
    if (prText !== null) {
      const pr = parsePr(prText, { repository, pr_number: lane.pr_number });
      if (!pr.ok) fail(pr.reason, `${dir}: ${pr.detail ?? ""}`);
      prMeta = pr.pr;
      const crText = readText("check-runs.pages");
      const csText = readText("status.json");
      if (crText !== null && csText !== null) {
        const cr = parseCheckRunPages(crText, { repository, sha: prMeta.head_sha });
        if (!cr.ok) fail(cr.reason, `${dir}: ${cr.detail ?? ""}`);
        const cs = parseCombinedStatus(csText, { repository, sha: prMeta.head_sha });
        if (!cs.ok) fail(cs.reason, `${dir}: ${cs.detail ?? ""}`);
        checks = {
          check_runs_total: cr.check_runs_total,
          check_run_conclusions: cr.check_run_conclusions,
          commit_statuses_total: cs.commit_statuses_total,
          commit_status_state: cs.commit_status_state,
        };
      }
    }
  }
  return { issues: enumerated.issues, issue: issue.issue, comments: comments.comments, reconstruction, prMeta, checks };
}

const read1 = parseRead(gather1);
const read2 = parseRead(gather2);

// TWO-READ STABILITY FENCE over the planning-relevant projection.
function project(read) {
  return {
    reconstruction: read.reconstruction.ok
      ? { ok: true, frozen: read.reconstruction.frozen === true, lane: read.reconstruction.lane }
      : { ok: false, refusal: read.reconstruction.refusal },
    comment_evidence_digest: payloadDigest(
      read.comments
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((c) => ({ id: c.id, user: c.user, body: c.body, created_at: c.created_at, updated_at: c.updated_at })),
    ),
    pr_metadata: read.prMeta,
    checks: read.checks,
  };
}
if (payloadDigest(project(read1)) !== payloadDigest(project(read2))) {
  fail("two-read-instability", "planning-relevant projections differ between reads; retry next run");
}

const reconstruction = read2.reconstruction;
if (!reconstruction.ok) fail("reconstruction-failed", reconstruction.refusal);
if (reconstruction.frozen === true) fail("frozen-under-enabled-policy");
const lane = reconstruction.lane;

// UNIVERSAL LANE-TARGET PROOF (N3).
const target = assertUniqueLaneTarget(read2.issues, lane.lane_id, { expected_issue: issueNumber });
if (!target.ok) fail(target.reason, target.detail);

// Pure evaluation — report-only by construction.
const verdict = evaluate(lane, policy, {
  pr_metadata: read2.prMeta,
  ...(read2.checks !== null ? { checks: read2.checks } : {}),
});

const headForKey = read2.prMeta.fetch_ok === true ? read2.prMeta.head_sha : "unknown";
const dedupe = `merge-guard:${lane.event_sequence}:${headForKey}:${verdict.eligible}`;
const already = read2.comments.some(
  (c) => c.user === BOT && c.body.includes(`<!-- ${MARKERS.mergeGuardResult} -->`) && hasFullLineDedupe(c.body, dedupe),
);
if (already) {
  process.stdout.write(JSON.stringify({ ok: true, empty: true, detail: `already posted ${dedupe}` }) + "\n");
  process.exit(3);
}

const commentBody = [
  "## Straylight merge guard — SHADOW RESULT (cannot merge)",
  "",
  `dedupe:${dedupe}`,
  "",
  `Eligibility: **${verdict.eligible}** — this is a report, not an action.`,
  "Merging remains an exclusive `operator:eileen` action.",
  "",
  renderPayload(MARKERS.mergeGuardResult, verdict),
].join("\n");
const content = JSON.stringify({ body: commentBody });
const sha256 = "sha256:" + createHash("sha256").update(content, "utf8").digest("hex");

const realRoot = realpathSync(resolve(requestRoot));
writeFileSync(join(realRoot, "op-1.json"), content);
const plan = {
  schema: WRITE_PLAN_SCHEMA,
  plan_id: `${nonce}-merge-guard`,
  nonce,
  repository,
  operations: [{
    op_id: "op-1",
    kind: "post-merge-guard-result",
    issue_number: issueNumber,
    dedupe_key: dedupe,
    body_file: "op-1.json",
    body_sha256: sha256,
  }],
};
writeFileSync(join(realRoot, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
process.stdout.write(JSON.stringify({ ok: true, empty: false, eligible: verdict.eligible, dedupe }) + "\n");
process.exit(0);
