#!/usr/bin/env node
// Straylight Control Plane v1 — merge-guard planner (report-only).
//
//   node plan-merge-guard-write.mjs \
//     --gather-1 <dir1> --gather-2 <dir2> --issue-number <n> \
//     --request-root <dir> --repository <owner/repo> \
//     --nonce <id>-<attempt> --now <iso> \
//     --claim <claim-file> --read-ledger <ledger-file> [--policy <file>]
//
// Two-read stable gather (lane + PR + check-runs + combined status, all
// through the shared evidence parser with N1/N2 profiles), the universal
// lane-target proof IN BOTH READS (J1), probe-claim rebinding (J2), pure
// merge-guard evaluation, exact-deduped shadow result plan. THIS PLANNER
// CANNOT MERGE: it evaluates eligibility and plans one report comment; no
// merge call exists anywhere in the chain.
//
// CLAIM REBINDING (J2): the probe's fetch-slot claim is NEVER authority.
// This planner independently rederives the fetch slot (the lane's
// recorded PR + checks) from BOTH raw reads, requires derived = claim on
// every field INCLUDING the source digests of the exact evidence bytes,
// requires the read executor's ledger to account for EXACTLY the claim's
// slots, digest-verifies every fetched file, and refuses any slot-shaped
// file the ledger does not account for. A PR/check fetch failure is an
// explicit {fetched:false} ledger fact — fail-closed ineligibility, never
// a guess; per-gather evidence must be canonically EQUAL (the live half
// of the stability fence).
//
// Exit 0 = plan written. Exit 3 = valid no-op (result already posted).
// Exit 2 = refusal (fail closed; nothing written).

import { readFileSync, writeFileSync, realpathSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parseStrict } from "../lib/strict-json.mjs";
import { parseIssuePages, parseIssue, parseCommentPages, parsePr, parseCheckRunPages, parseCombinedStatus } from "../lib/evidence.mjs";
import { assertUniqueLaneTarget, scanLanes } from "../lib/lane-target.mjs";
import { reconstructLane } from "../lib/reconstruct.mjs";
import { evaluate } from "../lib/merge-guard.mjs";
import { payloadDigest } from "../lib/canonical.mjs";
import { renderPayload, MARKERS } from "../lib/markers.mjs";
import { WRITE_PLAN_SCHEMA, hasFullLineDedupe } from "../lib/write-plan.mjs";
import { FETCH_SLOT_CLAIM_SCHEMA, parseClaim, parseReadLedger, checkLedgerAgainstClaim, slotFileName } from "../lib/read-plan.mjs";

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

const sha256 = (text) => "sha256:" + createHash("sha256").update(text, "utf8").digest("hex");

const gather1 = arg("--gather-1");
const gather2 = arg("--gather-2");
const issueArg = arg("--issue-number");
const requestRoot = arg("--request-root");
const repository = arg("--repository");
const nonce = arg("--nonce");
const now = arg("--now");
const claimPath = arg("--claim");
const readLedgerPath = arg("--read-ledger");
for (const [name, v] of [["--gather-1", gather1], ["--gather-2", gather2], ["--issue-number", issueArg], ["--request-root", requestRoot], ["--repository", repository], ["--nonce", nonce], ["--now", now], ["--claim", claimPath], ["--read-ledger", readLedgerPath]]) {
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

// Parse one complete BASE read (enumeration + issue + comments), retaining
// raw byte digests so the probe claim can be rebound to the exact
// evidence bytes (J2). PR/check evidence is NOT read here — it is read
// only through ledger accounting below.
function parseRead(dir) {
  const realDir = realpathSync(resolve(dir));
  const digests = {};
  const readText = (name, digestKey) => {
    const path = join(realDir, name);
    if (!existsSync(path)) fail("gather-incomplete", `${name} missing in ${dir}`);
    const text = readFileSync(path, "utf8");
    digests[digestKey] = sha256(text);
    return text;
  };
  const enumerated = parseIssuePages(readText("enumeration.pages", "enumeration_sha256"), { repository });
  if (!enumerated.ok) fail(enumerated.reason, `${dir}: ${enumerated.detail ?? ""}`);
  const issue = parseIssue(readText("issue.json", "issue_sha256"), { repository, issue_number: issueNumber });
  if (!issue.ok) fail(issue.reason, `${dir}: ${issue.detail ?? ""}`);
  const comments = parseCommentPages(readText("comments.pages", "comments_sha256"), { repository, issue_number: issueNumber });
  if (!comments.ok) fail(comments.reason, `${dir}: ${comments.detail ?? ""}`);
  const reconstruction = reconstructLane({
    issue_body: issue.issue.body ?? "",
    comments: comments.comments,
    policy,
    context: { now },
  });
  return { realDir, issues: enumerated.issues, issue: issue.issue, comments: comments.comments, reconstruction, digests };
}

const read1 = parseRead(gather1);
const read2 = parseRead(gather2);

// TWO-READ STABILITY FENCE over the planning-relevant BASE projection —
// including each read's canonical lane→issue mapping (J1): a lane
// appearing, vanishing, moving issues, duplicating, or turning unreadable
// between reads is itself instability.
function project(read) {
  const scanned = scanLanes(read.issues);
  if (!scanned.ok) fail("lane-scan-failed", scanned.reason);
  return {
    lane_mapping: scanned.lanes.map((l) => ({ issue_number: l.number, lane_id: l.lane_id })),
    lane_duplicates: scanned.duplicates,
    lane_unreadable: scanned.unreadable.map((u) => u.number).sort((a, b) => a - b),
    reconstruction: read.reconstruction.ok
      ? { ok: true, frozen: read.reconstruction.frozen === true, lane: read.reconstruction.lane }
      : { ok: false, refusal: read.reconstruction.refusal },
    comment_evidence_digest: payloadDigest(
      read.comments
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((c) => ({ id: c.id, user: c.user, body: c.body, created_at: c.created_at, updated_at: c.updated_at })),
    ),
  };
}
if (payloadDigest(project(read1)) !== payloadDigest(project(read2))) {
  fail("two-read-instability", "planning-relevant projections differ between reads; retry next run");
}

const reconstruction = read2.reconstruction;
if (!reconstruction.ok) fail("reconstruction-failed", reconstruction.refusal);
if (reconstruction.frozen === true) fail("frozen-under-enabled-policy");
const lane = reconstruction.lane;

// UNIVERSAL LANE-TARGET PROOF (N3), IN BOTH READS (J1).
for (const [label, issues] of [["read 1", read1.issues], ["read 2", read2.issues]]) {
  const target = assertUniqueLaneTarget(issues, lane.lane_id, { expected_issue: issueNumber });
  if (!target.ok) fail(target.reason, `${label}: ${target.detail ?? ""}`);
}

// CLAIM REBINDING (J2): rederive the fetch slot (any-pr mode with checks)
// from the fence-proven reconstruction + this planner's own raw-byte
// digests, and require the probe's claim to equal it exactly.
const hasPr = Number.isInteger(lane.pr_number) && lane.pr_number >= 1;
const derivedSlot = {
  schema: FETCH_SLOT_CLAIM_SCHEMA,
  nonce,
  repository,
  issue_number: issueNumber,
  lane_id: lane.lane_id,
  state: lane.state,
  pr_number: hasPr ? lane.pr_number : null,
  checks: hasPr,
  sources: { gather_1: read1.digests, gather_2: read2.digests },
};
let claimText, readLedgerText;
try {
  claimText = readFileSync(resolve(claimPath), "utf8");
} catch (e) {
  fail("claim-unreadable", String(e?.message ?? e));
}
try {
  readLedgerText = readFileSync(resolve(readLedgerPath), "utf8");
} catch (e) {
  fail("read-ledger-unreadable", String(e?.message ?? e));
}
const claimParsed = parseClaim(claimText, { repository, nonce, issue_number: issueNumber });
if (!claimParsed.ok) fail(claimParsed.reason, claimParsed.detail);
const claim = claimParsed.claim;
if (payloadDigest(claim) !== payloadDigest(derivedSlot)) {
  fail("claim-derivation-mismatch", "the probe's claim does not equal the final planner's own slot derivation from raw reads");
}

// READ-LEDGER ACCOUNTING: exactly the claim's slots; every fetched file
// digest-verified in ITS gather; no slot-shaped file without a row.
const ledgerParsed = parseReadLedger(readLedgerText, { nonce });
if (!ledgerParsed.ok) fail(ledgerParsed.reason, ledgerParsed.detail);
const ledgerCheck = checkLedgerAgainstClaim(ledgerParsed.rows, claim);
if (!ledgerCheck.ok) fail(ledgerCheck.reason, ledgerCheck.detail);
const gatherDirs = { 1: read1.realDir, 2: read2.realDir };
for (const row of ledgerParsed.rows) {
  const full = join(gatherDirs[row.gather], slotFileName(row.slot));
  if (row.fetched === true) {
    if (!existsSync(full)) fail("read-ledger-file-missing", `${row.gather}:${row.slot}`);
    if (sha256(readFileSync(full, "utf8")) !== row.sha256) {
      fail("read-ledger-digest-mismatch", `${row.gather}:${row.slot}`);
    }
  } else if (existsSync(full)) {
    fail("read-ledger-unaccounted-file", `${row.gather}:${row.slot}: file present but ledger says fetched:false`);
  }
}
for (const gather of [1, 2]) {
  for (const slot of ["pr", "check-runs", "status"]) {
    const accounted = ledgerParsed.rows.some((r) => r.gather === gather && r.slot === slot);
    if (!accounted && existsSync(join(gatherDirs[gather], slotFileName(slot)))) {
      fail("read-ledger-unaccounted-file", `${gather}:${slot}: slot-shaped file has no ledger row`);
    }
  }
}

// PER-GATHER LIVE EVIDENCE from ledger facts only. A {fetched:false} PR
// row is fail-closed ineligibility, never a guess; check evidence exists
// only when BOTH the check-runs and status rows fetched, bound to that
// gather's own parsed PR head. The two gathers' evidence must be
// canonically EQUAL (the live half of the stability fence, J2).
function gatherEvidence(gather) {
  if (claim.pr_number === null) return { pr_metadata: { fetch_ok: false }, checks: null };
  const rowOf = (slot) => ledgerParsed.rows.find((r) => r.gather === gather && r.slot === slot);
  const prRow = rowOf("pr");
  if (prRow.fetched !== true) return { pr_metadata: { fetch_ok: false }, checks: null };
  const pr = parsePr(readFileSync(join(gatherDirs[gather], slotFileName("pr")), "utf8"), { repository, pr_number: claim.pr_number });
  if (!pr.ok) fail(pr.reason, `gather ${gather}: ${pr.detail ?? ""}`);
  const crRow = rowOf("check-runs");
  const csRow = rowOf("status");
  let checks = null;
  if (crRow.fetched === true && csRow.fetched === true) {
    // The ledger's bound head must be the head of THIS gather's PR.
    if (crRow.sha !== pr.pr.head_sha || csRow.sha !== pr.pr.head_sha) {
      fail("read-ledger-slot-mismatch", `gather ${gather}: check evidence bound to a different head than the fetched PR`);
    }
    const cr = parseCheckRunPages(readFileSync(join(gatherDirs[gather], slotFileName("check-runs")), "utf8"), { repository, sha: pr.pr.head_sha });
    if (!cr.ok) fail(cr.reason, `gather ${gather}: ${cr.detail ?? ""}`);
    const cs = parseCombinedStatus(readFileSync(join(gatherDirs[gather], slotFileName("status")), "utf8"), { repository, sha: pr.pr.head_sha });
    if (!cs.ok) fail(cs.reason, `gather ${gather}: ${cs.detail ?? ""}`);
    checks = {
      check_runs_total: cr.check_runs_total,
      check_run_conclusions: cr.check_run_conclusions,
      commit_statuses_total: cs.commit_statuses_total,
      commit_status_state: cs.commit_status_state,
    };
  }
  return { pr_metadata: pr.pr, checks };
}
const evidence1 = gatherEvidence(1);
const evidence2 = gatherEvidence(2);
if (payloadDigest(evidence1) !== payloadDigest(evidence2)) {
  fail("two-read-instability", "live PR/check evidence differs between gathers; retry next run");
}

// Pure evaluation — report-only by construction.
const verdict = evaluate(lane, policy, {
  pr_metadata: evidence2.pr_metadata,
  ...(evidence2.checks !== null ? { checks: evidence2.checks } : {}),
});

const headForKey = evidence2.pr_metadata.fetch_ok === true ? evidence2.pr_metadata.head_sha : "unknown";
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
    body_sha256: sha256(content),
  }],
};
writeFileSync(join(realRoot, "plan.json"), JSON.stringify(plan, null, 2) + "\n");
process.stdout.write(JSON.stringify({ ok: true, empty: false, eligible: verdict.eligible, dedupe }) + "\n");
process.exit(0);
