#!/usr/bin/env node
// Straylight Control Plane v1 — staged reducer planner (§8).
//
// STAGE A — eligibility confirmation (state-advancing, terminal):
//
//   node plan-reducer-writes.mjs --stage a --probe --claim-root <dir> \
//     --gather-1 <dir1> --gather-2 <dir2> --issue-number <n> \
//     --repository <owner/repo> --nonce <id>-<attempt> --now <iso> [--policy <f>]
//       → validates both reads, proves the lane target IN BOTH reads,
//         reconstructs, derives the fetch slot (the recorded PR, only when
//         eligibility-pending), and writes <dir>/claim.json (a closed
//         straylight.fetch-slot-claim.v1 digest-bound to both reads'
//         evidence bytes) plus <dir>/read-plan.json (a closed
//         straylight.read-plan.v1 the shared READ executor consumes).
//         Probe output is NEVER write authority — the final planner
//         rederives everything. Without --claim-root the probe prints its
//         derived summary to stdout and writes nothing (test/diagnostic
//         mode). Exit 0 = probed; exit 2 = refuse.
//
//   node plan-reducer-writes.mjs --stage a \
//     …same args… --request-root <dir> --claim <claim-file> --read-ledger <f>
//       → REQUIRES the probe's claim and the read executor's ledger. It
//         independently rederives the fetch slot from BOTH raw reads,
//         requires derived(read 1) = derived(read 2) = claim, verifies the
//         claim's source digests against the exact evidence bytes, requires
//         the read ledger to contain EXACTLY the claim's slots (missing,
//         extra, duplicate, or mismatched rows refuse), verifies every
//         fetched file's digest, and refuses any slot-shaped file the
//         ledger does not account for. Only then: constructs the
//         durable-embedding system.eligibility_confirmed event, proves
//         dedupe from the collected comment stream, dry-runs it (append
//         candidate → re-reduce → require ready-for-merge), and writes a
//         ONE-OPERATION plan. Exit 0 = plan written; exit 3 = valid no-op
//         (not pending / already confirmed / explicit both-gather fetch
//         failure / dry-run refusal — retry next run); exit 2 = refuse.
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
// TWO-READ STABILITY FENCE (carried, widened round 10): each gather
// directory holds one complete read (enumeration.pages, issue.json,
// comments.pages, and for stage b labels.pages). The planning-relevant
// canonical projections of both reads must be equal, else exit 2 — the
// world moved mid-gather. The projection INCLUDES the canonical
// lane→issue mapping of the read's own enumeration (lanes, duplicates,
// unreadable), so lane identity itself is part of the fence (J1).
//
// UNIVERSAL LANE-TARGET PROOF (N3, both reads — J1): the reconstructed
// lane's lane_id must map to EXACTLY this issue in EACH read's
// same-execution enumeration; duplicate valid lane IDs in EITHER read
// exit 2 (C1).
//
// No network I/O; no GitHub writes; files are byte containers.

import { readFileSync, writeFileSync, realpathSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { parseStrict } from "../lib/strict-json.mjs";
import { parseIssuePages, parseIssue, parseCommentPages, parsePr, parseLabelPages } from "../lib/evidence.mjs";
import { assertUniqueLaneTarget, scanLanes } from "../lib/lane-target.mjs";
import { reconstructLane, deriveLabels } from "../lib/reconstruct.mjs";
import { payloadDigest } from "../lib/canonical.mjs";
import { renderPayload, hasMarker, MARKERS } from "../lib/markers.mjs";
import { WRITE_PLAN_SCHEMA, warningDedupeKey, warningBodyFor, hasFullLineDedupe } from "../lib/write-plan.mjs";
import {
  READ_PLAN_SCHEMA, FETCH_SLOT_CLAIM_SCHEMA, parseClaim, parseReadLedger,
  checkLedgerAgainstClaim, slotFileName,
} from "../lib/collection.mjs";

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
// Probe slot derivation mode: "eligibility" (reducer Stage A — the slot
// exists only when the lane is eligibility-pending) or "any-pr" (merge
// guard — the slot exists whenever the lane records a PR). --with-checks
// claims check-run + combined-status evidence for the slot (merge guard).
const slotMode = arg("--slot-mode") ?? "eligibility";
if (slotMode !== "eligibility" && slotMode !== "any-pr") fail("usage", "--slot-mode must be eligibility or any-pr");
const withChecks = flag("--with-checks");
if (withChecks && slotMode !== "any-pr") fail("usage", "--with-checks requires --slot-mode any-pr");
const claimRoot = arg("--claim-root");
const claimPath = arg("--claim");
const readLedgerPath = arg("--read-ledger");
if (stage === "a" && !probe && (claimPath === null || readLedgerPath === null)) {
  fail("usage", "--claim and --read-ledger are required for the final Stage A planner (J2)");
}

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
// stage b). Every stream goes through the shared evidence parser. Raw
// byte digests are retained so a probe claim can bind itself to the
// exact evidence it derived from (J2).
function parseRead(dir, { withLabels }) {
  const realDir = realpathSync(resolve(dir));
  const digests = {};
  const readText = (name, digestKey) => {
    const path = join(realDir, name);
    if (!existsSync(path)) fail("gather-incomplete", `${name} missing in ${dir}`);
    const text = readFileSync(path, "utf8");
    if (digestKey !== undefined) digests[digestKey] = sha256(text);
    return text;
  };
  const enumerated = parseIssuePages(readText("enumeration.pages", "enumeration_sha256"), { repository });
  if (!enumerated.ok) fail(enumerated.reason, `${dir}: ${enumerated.detail ?? ""}`);
  const issue = parseIssue(readText("issue.json", "issue_sha256"), { repository, issue_number: issueNumber });
  if (!issue.ok) fail(issue.reason, `${dir}: ${issue.detail ?? ""}`);
  const comments = parseCommentPages(readText("comments.pages", "comments_sha256"), { repository, issue_number: issueNumber });
  if (!comments.ok) fail(comments.reason, `${dir}: ${comments.detail ?? ""}`);
  let labels = null;
  if (withLabels) {
    const parsed = parseLabelPages(readText("labels.pages"), { repository });
    if (!parsed.ok) fail(parsed.reason, `${dir}: ${parsed.detail ?? ""}`);
    labels = parsed.labels;
  }
  return { realDir, issues: enumerated.issues, issue: issue.issue, comments: comments.comments, labels, digests };
}

// The planning-relevant canonical projection of one read: the canonical
// lane→issue mapping of the read's OWN enumeration (J1 — lane identity is
// part of the fence: lanes, duplicates, AND unreadable markers must agree
// between reads), the reconstructed lane, the comment evidence
// (dedupe-proof source), and — stage b — the current cp-* label set.
// Issue updated_at is deliberately NOT included (it is not
// planning-relevant to the reducer and would trip the fence on unrelated
// activity).
function projectRead(read) {
  const scanned = scanLanes(read.issues);
  if (!scanned.ok) fail("lane-scan-failed", scanned.reason);
  const reconstruction = reconstructLane({
    issue_body: read.issue.body ?? "",
    comments: read.comments,
    policy,
    context: { now },
  });
  const projection = {
    lane_mapping: scanned.lanes.map((l) => ({ issue_number: l.number, lane_id: l.lane_id })),
    lane_duplicates: scanned.duplicates,
    lane_unreadable: scanned.unreadable.map((u) => u.number).sort((a, b) => a - b),
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
// The compared projection INCLUDES each read's canonical lane→issue
// mapping, so a lane appearing, vanishing, moving issues, duplicating, or
// turning unreadable between reads is itself instability (J1).
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

// UNIVERSAL LANE-TARGET PROOF (N3), IN BOTH READS (J1): this lane_id maps
// to exactly THIS issue in EACH read's same-execution enumeration —
// duplicate lane IDs, unreadable markers, zero matches, or a different
// issue in EITHER read exit 2.
for (const [label, issues] of [["read 1", read1.issues], ["read 2", read2.issues]]) {
  const target = assertUniqueLaneTarget(issues, lane.lane_id, { expected_issue: issueNumber });
  if (!target.ok) fail(target.reason, `${label}: ${target.detail ?? ""}`);
}

// Exact-full-line dedupe proof over BOT-authored machine comments (B8/C4).
function alreadyPosted(dedupeKey, markerNames) {
  return read2.comments.some(
    (c) =>
      c.user === BOT &&
      markerNames.some((m) => c.body.includes(`<!-- ${m} -->`)) &&
      hasFullLineDedupe(c.body, dedupeKey),
  );
}

// The fetch slot this run's DERIVED reads require, rederived here from
// the (fence-proven-stable) reconstruction — the probe writes it as the
// claim; the final planner rederives it AGAIN and requires equality with
// the probe's claim (J2). Slot modes: "eligibility" (a PR slot exists
// only when the lane is eligibility-pending — the reducer confirmation
// consumes live PR evidence only then) or "any-pr" (a PR slot exists
// whenever the lane records a PR — the merge guard).
function deriveFetchSlot() {
  const hasPr = Number.isInteger(lane.pr_number) && lane.pr_number >= 1;
  const wantsPr = slotMode === "any-pr" ? hasPr : (lane.state === "eligibility-pending" && hasPr);
  return {
    schema: FETCH_SLOT_CLAIM_SCHEMA,
    nonce,
    repository,
    issue_number: issueNumber,
    lane_id: lane.lane_id,
    state: lane.state,
    pr_number: wantsPr ? lane.pr_number : null,
    checks: wantsPr && withChecks,
    sources: { gather_1: read1.digests, gather_2: read2.digests },
  };
}

// =============================================================================
// STAGE A
// =============================================================================
if (stage === "a") {
  if (probe) {
    const claim = deriveFetchSlot();
    if (claimRoot !== null) {
      // The probe's ONLY durable outputs: the closed claim and the closed
      // read plan the shared READ executor consumes. Neither is write
      // authority — the final planner rederives and rebinds everything.
      const realClaimRoot = realpathSync(resolve(claimRoot));
      writeFileSync(join(realClaimRoot, "claim.json"), JSON.stringify(claim, null, 2) + "\n");
      const readPlan = {
        schema: READ_PLAN_SCHEMA,
        plan_id: `${nonce}-probe-${issueNumber}`,
        nonce,
        repository,
        reads: claim.pr_number === null ? [] : [{
          kind: claim.checks ? "pr-with-checks-into-gathers" : "pr-into-gathers",
          pr_number: claim.pr_number,
        }],
      };
      writeFileSync(join(realClaimRoot, "read-plan.json"), JSON.stringify(readPlan, null, 2) + "\n");
    }
    process.stdout.write(JSON.stringify({
      ok: true,
      state: lane.state,
      lane_id: lane.lane_id,
      pr_number: deriveFetchSlot().pr_number,
    }) + "\n");
    process.exit(0);
  }

  // CLAIM REBINDING (J2): the final planner trusts NOTHING the probe
  // printed. It rederives the fetch slot from BOTH raw reads (the fence
  // above proved them canonically equal, and the lane-target proof ran on
  // both), parses the probe's claim, and requires derived = claim on
  // every identity field INCLUDING the source digests of the exact
  // evidence bytes the probe derived from. Then the read executor's
  // ledger must account for EXACTLY the claim's slots, every fetched file
  // must hash to its row, and no slot-shaped file may exist that the
  // ledger does not account for.
  const derivedSlot = deriveFetchSlot();
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
  const ledgerParsed = parseReadLedger(readLedgerText, { nonce });
  if (!ledgerParsed.ok) fail(ledgerParsed.reason, ledgerParsed.detail);
  const ledgerCheck = checkLedgerAgainstClaim(ledgerParsed.rows, claim);
  if (!ledgerCheck.ok) fail(ledgerCheck.reason, ledgerCheck.detail);
  // Digest-verify every fetched row against the file in ITS gather; a
  // slot-shaped file with no accounting row is smuggled evidence.
  const gatherDirs = { 1: read1.realDir, 2: read2.realDir };
  for (const row of ledgerParsed.rows) {
    const full = join(gatherDirs[row.gather], slotFileName(row.slot));
    if (row.fetched === true) {
      if (!existsSync(full)) fail("read-ledger-file-missing", `${row.gather}:${row.slot}`);
      const digest = sha256(readFileSync(full, "utf8"));
      if (digest !== row.sha256) fail("read-ledger-digest-mismatch", `${row.gather}:${row.slot}`);
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

  if (lane.state !== "eligibility-pending") {
    noop({ state: lane.state, detail: "lane not eligibility-pending; nothing to confirm" });
  }
  if (claim.pr_number === null) {
    // eligibility-pending without a recorded PR cannot be confirmed;
    // fail closed as a no-op (the watchdog escalates a stuck lane).
    noop({ state: lane.state, detail: "no PR recorded; cannot confirm (fail closed)" });
  }

  // Live PR evidence, from BOTH gathers: each fetch outcome is a ledger
  // fact. An explicit failure in either gather is a no-op (lane stays
  // pending; retried next run) — never a guessed record. Both fetched
  // documents parse with full binding and must agree on every field the
  // confirmation embeds (the live-PR half of the stability fence).
  const prRows = { 1: null, 2: null };
  for (const row of ledgerParsed.rows) {
    if (row.slot === "pr") prRows[row.gather] = row;
  }
  if (prRows[1].fetched !== true || prRows[2].fetched !== true) {
    noop({ state: lane.state, detail: "live PR evidence unavailable in at least one gather (explicit ledger fact); posting nothing (fail closed)" });
  }
  const prDocs = {};
  for (const gather of [1, 2]) {
    const parsed = parsePr(readFileSync(join(gatherDirs[gather], slotFileName("pr")), "utf8"), { repository, pr_number: claim.pr_number });
    if (!parsed.ok) fail(parsed.reason, `gather ${gather}: ${parsed.detail ?? ""}`);
    prDocs[gather] = parsed.pr;
  }
  if (payloadDigest(prDocs[1]) !== payloadDigest(prDocs[2])) {
    fail("two-read-instability", "live PR evidence differs between gathers; retry next run");
  }
  const meta = prDocs[2];

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
    // The proof requires ALL of (round 11 J4):
    //   - bot authorship (comment identity/chronology already validated
    //     by parseCommentPages: unique IDs, strict instants);
    //   - the POSITIVE canonical marker
    //     <!-- straylight:cp-paused-warning:v1 --> — the condition that
    //     identifies a comment AS the warning, so unrelated machine
    //     output that merely CONTAINS the dedupe line is never a proof;
    //   - the exact full-line dedupe identity for THIS lane/issue;
    //   - the BYTE-EXACT complete canonical body (which embeds the
    //     marker and dedupe line by construction — the explicit checks
    //     above are defense in depth against template regression).
    const wDedupe = warningDedupeKey(lane.lane_id, issueNumber);
    const canonicalBody = warningBodyFor(lane.lane_id, issueNumber);
    const proofComment = read2.comments.find(
      (c) =>
        c.user === BOT &&
        hasMarker(c.body, MARKERS.cpPausedWarning) &&
        hasFullLineDedupe(c.body, wDedupe) &&
        c.body === canonicalBody,
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
