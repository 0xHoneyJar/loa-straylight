// Control Plane v1 — direct regressions for the Codex eleventh-round
// findings. One describe() block per finding; each reproduces the
// reported failure shape against the patched code.
//
//  J2  merge-guard evidence equality compared AGGREGATES only
//      (check_runs_total, check_run_conclusions, commit_statuses_total,
//      commit_status_state): two gathers whose check-run identities,
//      names, status contexts, per-entry states, or conclusion→run
//      bindings differed compared EQUAL whenever the aggregates agreed.
//      parseCheckRunPages / parseCombinedStatus now preserve the COMPLETE
//      validated record sets ({id, name, conclusion, head_sha} sorted by
//      id; {id, context, state} sorted by id) and the planner's stability
//      fence digests them — aggregate equality is never evidence
//      equality.
//
//  J4  the cp-paused warning proof accepted any bot comment whose body
//      byte-equaled the template, but the canonical template carried no
//      machine marker: nothing positively identified a comment AS the
//      canonical warning. warningBodyFor now embeds the dedicated
//      <!-- straylight:cp-paused-warning:v1 --> marker; the proof
//      requires bot author + byte-exact canonical body (marker and
//      dedupe line included by construction).
//
//  J8  watchdog.d.mts made lane_id optional on EVERY action; a healthy
//      post-event action without a lane_id type-checked. WatchdogAction
//      is now a discriminated union: post-event and readable findings
//      REQUIRE lane_id; only issue-keyed malformed findings (unreadable /
//      unreconstructable evidence) may omit it. The stale round-9 test
//      that fabricated synthetic `unreadable-issue-N` lane IDs is
//      replaced with trusted issue-number-keyed stubs.

import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseCheckRunPages, parseCombinedStatus } from "../../.straylight/lib/evidence.mjs";
import { warningBodyFor, warningDedupeKey, validateOperationBody } from "../../.straylight/lib/write-plan.mjs";
import { hasMarker, MARKERS } from "../../.straylight/lib/markers.mjs";
import { scan, asPositiveIssueNumber, asValidLaneId } from "../../.straylight/lib/watchdog.mjs";
import type { WatchdogAction, WatchdogPostEventAction, WatchdogMalformedLaneFinding } from "../../.straylight/lib/watchdog.mjs";
import {
  makeLane, makeEvent, makeTaskPacket, makeAuditRecord, makePolicy, laneClaudeWorking,
  payloadDigest, REPO, NOW, AFTER_EXPIRY, BASE_SHA, HEAD_SHA, WORKING_BRANCH, MAIN_SHA,} from "./_fixtures.js";

const REDUCER_PLANNER = ".straylight/bin/plan-reducer-writes.mjs";
const MERGE_GUARD_PLANNER = ".straylight/bin/plan-merge-guard-write.mjs";
const API = "https://api.github.com";
const NONCE = "12345-1";
const T0 = "2026-07-16T11:00:00Z";

const sha256 = (s: string | Buffer) => "sha256:" + createHash("sha256").update(s).digest("hex");

function enumEntry(n: number, body: string | null) {
  return { number: n, url: `${API}/repos/${REPO}/issues/${n}`, body, created_at: T0, updated_at: NOW };
}
function laneBody(overrides: Record<string, any> = {}) {
  return `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane(overrides))}\n\`\`\``;
}
function comment(id: number, issue: number, user: string, body: string) {
  return { id, url: `${API}/repos/${REPO}/issues/comments/${id}`, issue_url: `${API}/repos/${REPO}/issues/${issue}`, user: { login: user }, body, created_at: T0, updated_at: T0 };
}
function eventComment(id: number, issue: number, payload: Record<string, any>, user = "chatgpt-login") {
  return comment(id, issue, user, `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``);
}

function run(binary: string, args: string[]) {
  try {
    const stdout = execFileSync("node", [binary, ...args], { encoding: "utf8" });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    let out = null;
    try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* */ }
    return { status: e.status ?? -1, out };
  }
}

// Comment chain driving lane-phase-49p to eligibility-pending with PR 120
// recorded (the merge guard's any-pr slot mode derives a PR + checks slot
// from it).
function eligibilityPendingComments(issue: number): any[] {
  const packet = makeTaskPacket();
  const packetBody = `<!-- straylight:task-packet:v1 -->\n\`\`\`json\n${JSON.stringify(packet)}\n\`\`\``;
  const audit = makeAuditRecord();
  const auditBody = `<!-- straylight:audit:v1 -->\n\`\`\`json\n${JSON.stringify(audit)}\n\`\`\``;
  return [
    eventComment(3001, issue, makeEvent({ event_id: "evt-r1", sequence: 1, event_type: "lane.activated", prior_state: "planning" })),
    comment(3002, issue, "chatgpt-login", packetBody),
    eventComment(3003, issue, makeEvent({
      event_id: "evt-r2", sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 3002, task_packet_digest: payloadDigest(packet) },
    })),
    eventComment(3004, issue, makeEvent({
      event_id: "evt-r3", sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: "2026-07-16T14:00:00Z",
    }), "claude-login"),
    eventComment(3005, issue, makeEvent({
      event_id: "evt-r4", sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    }), "claude-login"),
    eventComment(3006, issue, makeEvent({
      event_id: "evt-r5", sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: "2026-07-16T14:00:00Z",
    }), "codex-login"),
    comment(3007, issue, "codex-login", auditBody),
    eventComment(3008, issue, makeEvent({
      event_id: "evt-r6", sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", verdict: "ACCEPT", audited_sha: HEAD_SHA,
      refs: { audit_comment_id: 3007, audit_digest: payloadDigest(audit), pr_number: 120 },
    }), "codex-login"),
  ];
}

const livePr = (overrides: Record<string, any> = {}) => JSON.stringify({
  number: 120, url: `${API}/repos/${REPO}/pulls/120`, state: "open", draft: false, merged: false,
  base: { ref: "main", sha: BASE_SHA, repo: { full_name: REPO } },
  head: { ref: WORKING_BRANCH, sha: HEAD_SHA },
  created_at: T0, updated_at: NOW,
});

function checkRun(id: number, overrides: Record<string, any> = {}) {
  return {
    id,
    url: `${API}/repos/${REPO}/check-runs/${id}`,
    head_sha: HEAD_SHA,
    name: `ci/check-${id}`,
    conclusion: "success",
    ...overrides,
  };
}
const checkRunsDoc = (...runs: any[]) => JSON.stringify({ total_count: runs.length, check_runs: runs });

function statusEntry(id: number, overrides: Record<string, any> = {}) {
  return { id, context: `ci/status-${id}`, state: "success", ...overrides };
}
const statusDoc = (...statuses: any[]) => JSON.stringify({
  state: "success", sha: HEAD_SHA, total_count: statuses.length, statuses,
  repository: { full_name: REPO },
});

// One gather directory (a complete read + the read executor's slot files).
function writeGather(opts: { issue: number; comments: any[]; checkRunsDoc: string; statusDoc: string }) {
  const dir = mkdtempSync(join(tmpdir(), "cp-r11-gather-"));
  const entry = enumEntry(opts.issue, laneBody());
  writeFileSync(join(dir, "enumeration.pages"), JSON.stringify([entry]));
  writeFileSync(join(dir, "issue.json"), JSON.stringify(entry));
  writeFileSync(join(dir, "comments.pages"), JSON.stringify(opts.comments));
  writeFileSync(join(dir, "pr.json"), livePr());
  writeFileSync(join(dir, "check-runs.pages"), opts.checkRunsDoc);
  writeFileSync(join(dir, "status.json"), opts.statusDoc);
  return dir;
}

function writePolicy(dir: string) {
  const p = join(dir, "policy.json");
  writeFileSync(p, JSON.stringify(makePolicy()));
  return p;
}

// Fabricate the read ledger the shared READ executor would have written.
function fabricateReadLedger(claimRoot: string, g1: string, g2: string) {
  const claim = JSON.parse(readFileSync(join(claimRoot, "claim.json"), "utf8"));
  const rows: string[] = [];
  if (claim.pr_number !== null) {
    for (const [gather, dir] of [[1, g1], [2, g2]] as const) {
      const prText = readFileSync(join(dir, "pr.json"), "utf8");
      const headSha = JSON.parse(prText).head.sha;
      rows.push(JSON.stringify({ nonce: NONCE, gather, slot: "pr", pr_number: claim.pr_number, fetched: true, path: "pr.json", sha256: sha256(prText) }));
      if (claim.checks === true) {
        for (const [slot, file] of [["check-runs", "check-runs.pages"], ["status", "status.json"]] as const) {
          const text = readFileSync(join(dir, file), "utf8");
          rows.push(JSON.stringify({ nonce: NONCE, gather, slot, pr_number: claim.pr_number, sha: headSha, fetched: true, path: file, sha256: sha256(text) }));
        }
      }
    }
  }
  writeFileSync(join(claimRoot, "read-ledger.jsonl"), rows.length === 0 ? "" : rows.join("\n") + "\n");
}

// Full merge-guard pipeline: any-pr probe with checks → fabricated read
// ledger → merge-guard planner with claim rebinding.
function runMergeGuard(g1: string, g2: string) {
  const requestRoot = mkdtempSync(join(tmpdir(), "cp-r11-req-"));
  const policyPath = writePolicy(requestRoot);
  const claimRoot = mkdtempSync(join(tmpdir(), "cp-r11-claim-"));
  const probe = run(REDUCER_PLANNER, [
    "--stage", "a", "--probe", "--slot-mode", "any-pr", "--with-checks", "--claim-root", claimRoot,
    "--gather-1", g1, "--gather-2", g2, "--issue-number", "41",
    "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath, "--source-main-sha", MAIN_SHA,
  ]);
  if (probe.status !== 0) return { ...probe, requestRoot };
  fabricateReadLedger(claimRoot, g1, g2);
  const r = run(MERGE_GUARD_PLANNER, [
    "--gather-1", g1, "--gather-2", g2, "--issue-number", "41",
    "--request-root", requestRoot,
    "--claim", join(claimRoot, "claim.json"),
    "--read-ledger", join(claimRoot, "read-ledger.jsonl"),
    "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath, "--source-main-sha", MAIN_SHA,
  ]);
  return { ...r, requestRoot };
}

// =============================================================================
// J2 — merge-guard evidence equality is over COMPLETE validated records
// =============================================================================
describe("J2 — aggregate-equal but identity-different check/status evidence between gathers exits 2", () => {
  const cs = eligibilityPendingComments(41);

  it("Codex probe: gather 1 = run 1 / status 10, gather 2 = run 2 / status 20 (same totals, conclusions, rollup) → exit 2", () => {
    const g1 = writeGather({ issue: 41, comments: cs, checkRunsDoc: checkRunsDoc(checkRun(1, { name: "ci" })), statusDoc: statusDoc(statusEntry(10, { context: "ci/s" })) });
    const g2 = writeGather({ issue: 41, comments: cs, checkRunsDoc: checkRunsDoc(checkRun(2, { name: "ci" })), statusDoc: statusDoc(statusEntry(20, { context: "ci/s" })) });
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");
    expect(existsSync(join(r.requestRoot, "plan.json"))).toBe(false);
  });

  it("same run IDs, different run NAMES → exit 2", () => {
    const g1 = writeGather({ issue: 41, comments: cs, checkRunsDoc: checkRunsDoc(checkRun(1, { name: "build" })), statusDoc: statusDoc(statusEntry(10)) });
    const g2 = writeGather({ issue: 41, comments: cs, checkRunsDoc: checkRunsDoc(checkRun(1, { name: "deploy" })), statusDoc: statusDoc(statusEntry(10)) });
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");
  });

  it("same status IDs, different CONTEXTS → exit 2", () => {
    const g1 = writeGather({ issue: 41, comments: cs, checkRunsDoc: checkRunsDoc(checkRun(1)), statusDoc: statusDoc(statusEntry(10, { context: "ci/alpha" })) });
    const g2 = writeGather({ issue: 41, comments: cs, checkRunsDoc: checkRunsDoc(checkRun(1)), statusDoc: statusDoc(statusEntry(10, { context: "ci/beta" })) });
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");
  });

  it("same rollup state and count, but a per-entry STATE differs → exit 2", () => {
    // Both rollups say "success"; entry 10 is success in one gather and
    // failure in the other. Pre-round-11 the aggregate profile compared
    // equal.
    const g1 = writeGather({ issue: 41, comments: cs, checkRunsDoc: checkRunsDoc(checkRun(1)), statusDoc: statusDoc(statusEntry(10, { state: "success" })) });
    const g2 = writeGather({ issue: 41, comments: cs, checkRunsDoc: checkRunsDoc(checkRun(1)), statusDoc: statusDoc(statusEntry(10, { state: "failure" })) });
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");
  });

  it("identical conclusion LISTS but a permuted conclusion→run binding → exit 2", () => {
    // Gather 1: run 1 succeeded, run 2 failed. Gather 2: run 1 failed,
    // run 2 succeeded — listed in reverse page order so the page-order
    // conclusion list is IDENTICAL (["success","failure"]). Only the
    // per-run records reveal the difference.
    const g1 = writeGather({
      issue: 41, comments: cs,
      checkRunsDoc: checkRunsDoc(checkRun(1, { conclusion: "success" }), checkRun(2, { conclusion: "failure" })),
      statusDoc: statusDoc(statusEntry(10)),
    });
    const g2 = writeGather({
      issue: 41, comments: cs,
      checkRunsDoc: checkRunsDoc(checkRun(2, { conclusion: "success" }), checkRun(1, { conclusion: "failure" })),
      statusDoc: statusDoc(statusEntry(10)),
    });
    // Pre-round-11 aggregate profiles were equal by construction (the
    // PAGE-ORDER conclusion lists matched). Post-round-12 every derived
    // field comes from the id-sorted records, so the binding drift now
    // shows in the conclusion list too:
    const a = parseCheckRunPages(readFileSync(join(g1, "check-runs.pages"), "utf8"), { repository: REPO, sha: HEAD_SHA }) as any;
    const b = parseCheckRunPages(readFileSync(join(g2, "check-runs.pages"), "utf8"), { repository: REPO, sha: HEAD_SHA }) as any;
    expect(a.check_run_conclusions).toEqual(["success", "failure"]);
    expect(b.check_run_conclusions).toEqual(["failure", "success"]);
    expect(a.check_runs_total).toBe(b.check_runs_total);
    // ...and the sorted record sets differ:
    expect(payloadDigest(a.check_runs)).not.toBe(payloadDigest(b.check_runs));
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");
  });

  it("control: byte-identical check evidence in both gathers plans the shadow result", () => {
    const doc = checkRunsDoc(checkRun(1), checkRun(2));
    const st = statusDoc(statusEntry(10), statusEntry(20));
    const g1 = writeGather({ issue: 41, comments: cs, checkRunsDoc: doc, statusDoc: st });
    const g2 = writeGather({ issue: 41, comments: cs, checkRunsDoc: doc, statusDoc: st });
    const r = runMergeGuard(g1, g2);
    expect(r.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(r.requestRoot, "plan.json"), "utf8"));
    expect(plan.operations[0]).toMatchObject({ kind: "post-merge-guard-result", issue_number: 41 });
  });

  it("parseCheckRunPages preserves the complete sorted record set and requires a non-empty name", () => {
    const r = parseCheckRunPages(checkRunsDoc(checkRun(2, { conclusion: null }), checkRun(1)), { repository: REPO, sha: HEAD_SHA }) as any;
    expect(r.ok).toBe(true);
    expect(r.check_runs).toEqual([
      { id: 1, name: "ci/check-1", conclusion: "success", head_sha: HEAD_SHA },
      { id: 2, name: "ci/check-2", conclusion: null, head_sha: HEAD_SHA },
    ]);
    const missingName = parseCheckRunPages(checkRunsDoc({ ...checkRun(1), name: undefined }), { repository: REPO, sha: HEAD_SHA });
    expect(missingName.ok).toBe(false);
    expect((missingName as any).reason).toBe("check-run-invalid");
  });

  it("parseCombinedStatus preserves the complete sorted entry set", () => {
    const r = parseCombinedStatus(statusDoc(statusEntry(20, { state: "pending" }), statusEntry(10)), { repository: REPO, sha: HEAD_SHA }) as any;
    expect(r.ok).toBe(true);
    expect(r.commit_statuses).toEqual([
      { id: 10, context: "ci/status-10", state: "success" },
      { id: 20, context: "ci/status-20", state: "pending" },
    ]);
  });
});

// =============================================================================
// J4 — the canonical cp-paused warning carries and requires its marker
// =============================================================================
describe("J4 — the cp-paused warning is positively identified by its dedicated marker", () => {
  const warningOp = (body: string) => ({
    op_id: "op-1",
    kind: "post-cp-paused-warning",
    issue_number: 41,
    lane_id: "lane-phase-49p",
    dedupe_key: warningDedupeKey("lane-phase-49p", 41),
    body_file: "op-1.json",
    body_sha256: sha256(JSON.stringify({ body })),
  });
  const check = (body: string) => validateOperationBody(warningOp(body), JSON.stringify({ body }));

  it("positive regression: the canonical template embeds <!-- straylight:cp-paused-warning:v1 --> and validates", () => {
    const body = warningBodyFor("lane-phase-49p", 41);
    expect(MARKERS.cpPausedWarning).toBe("straylight:cp-paused-warning:v1");
    expect(hasMarker(body, MARKERS.cpPausedWarning)).toBe(true);
    expect(body.split("\n")[0]).toBe("<!-- straylight:cp-paused-warning:v1 -->");
    expect(check(body)).toEqual({ ok: true });
  });

  it("a body WITHOUT the marker refuses with the dedicated marker error, not only template inequality", () => {
    const body = warningBodyFor("lane-phase-49p", 41)
      .split("\n").filter((l) => !l.includes("straylight:cp-paused-warning")).join("\n");
    const r = check(body) as any;
    expect(r.ok).toBe(false);
    expect(r.errors.some((e: any) => e.detail.includes("lacks the canonical straylight:cp-paused-warning:v1 marker"))).toBe(true);
  });

  it("a WRONG marker refuses", () => {
    const body = warningBodyFor("lane-phase-49p", 41)
      .replace("straylight:cp-paused-warning:v1", "straylight:cp-paused-warning:v2");
    const r = check(body) as any;
    expect(r.ok).toBe(false);
  });

  it("a DUPLICATED marker is not the canonical byte-exact body → refuses", () => {
    const canonical = warningBodyFor("lane-phase-49p", 41);
    const doubled = `<!-- ${MARKERS.cpPausedWarning} -->\n` + canonical;
    const r = check(doubled) as any;
    expect(r.ok).toBe(false);
    expect(r.errors.some((e: any) => e.detail.includes("does not equal the fixed state-neutral template"))).toBe(true);
  });

  // Stage B planner: the already-present proof requires the marker.
  function stageB(comments: any[]) {
    const mk = (issue: number) => {
      const dir = mkdtempSync(join(tmpdir(), "cp-r11-j4-"));
      const entry = enumEntry(issue, laneBody());
      writeFileSync(join(dir, "enumeration.pages"), JSON.stringify([entry]));
      writeFileSync(join(dir, "issue.json"), JSON.stringify(entry));
      writeFileSync(join(dir, "comments.pages"), JSON.stringify(comments));
      writeFileSync(join(dir, "labels.pages"), JSON.stringify(
        ["cp-lane", "cp-paused"].map((name, i) => ({ id: i + 1, name, url: `${API}/repos/${REPO}/labels/${encodeURIComponent(name)}` })),
      ));
      return dir;
    };
    const g1 = mk(41);
    const g2 = mk(41);
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-r11-j4-req-"));
    const policyPath = writePolicy(requestRoot);
    const r = run(REDUCER_PLANNER, [
      "--stage", "b", "--gather-1", g1, "--gather-2", g2,
      "--issue-number", "41", "--request-root", requestRoot,
      "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath, "--source-main-sha", MAIN_SHA,
    ]);
    const plan = r.status === 0 ? JSON.parse(readFileSync(join(requestRoot, "plan.json"), "utf8")) : null;
    return { r, plan };
  }

  it("a bot comment that is the OLD (marker-less) template plus the dedupe line is NOT a proof — the warning re-posts", () => {
    // The pre-round-11 canonical body: everything but the marker line.
    const oldTemplate = warningBodyFor("lane-phase-49p", 41).split("\n").slice(1).join("\n");
    const { r, plan } = stageB([comment(4200, 41, "github-actions[bot]", oldTemplate)]);
    expect(r.status).toBe(0);
    const warning = plan.operations.find((o: any) => o.kind === "post-cp-paused-warning");
    const removal = plan.operations.find((o: any) => o.kind === "remove-derived-cp-paused-after-warning");
    expect(warning).toBeDefined();
    expect(removal.warning_op_id).toBe(warning.op_id);
    expect(removal.warning_proof).toBeUndefined();
  });

  it("unrelated bot machine output CONTAINING the dedupe line AND the marker string in prose is still not a proof", () => {
    const forged = comment(4201, 41, "github-actions[bot]",
      `## Unrelated output quoting the ban\n\ndedupe:${warningDedupeKey("lane-phase-49p", 41)}\n\nthe marker is <!-- straylight:cp-paused-warning:v1 --> and more prose`);
    const { r, plan } = stageB([forged]);
    expect(r.status).toBe(0);
    expect(plan.operations.some((o: any) => o.kind === "post-cp-paused-warning")).toBe(true);
  });

  it("control: the byte-exact canonical marker-bearing bot warning IS the proof (no re-post)", () => {
    const canonical = comment(4202, 41, "github-actions[bot]", warningBodyFor("lane-phase-49p", 41));
    const { r, plan } = stageB([canonical]);
    expect(r.status).toBe(0);
    expect(plan.operations.some((o: any) => o.kind === "post-cp-paused-warning")).toBe(false);
    const removal = plan.operations.find((o: any) => o.kind === "remove-derived-cp-paused-after-warning");
    expect(removal.warning_proof).toEqual({ comment_id: 4202, dedupe_key: warningDedupeKey("lane-phase-49p", 41) });
  });
});

// =============================================================================
// J8 — WatchdogAction is a discriminated union: only malformed findings
// may omit lane_id
// =============================================================================
describe("J8 — healthy actions require lane_id at the type level; only issue-keyed malformed findings may omit it", () => {
  it("COMPILER PROBE: a healthy post-event without a lane_id no longer type-checks", () => {
    // The Codex probe: pre-round-11, `lane_id?: string` on every action
    // made this object a valid WatchdogAction.
    // @ts-expect-error — post-event REQUIRES lane_id (discriminated union)
    const rejected: WatchdogAction = {
      type: "post-event",
      event_type: "system.lease_expired",
      event_id: "evt-x",
      sequence: 4,
      prior_state: "claude-working",
      dedupe_key: "lease-expired:lane-phase-49p:lease-1:3",
      detail: "x",
    };
    // @ts-expect-error — unverifiable-head findings REQUIRE lane_id too
    const rejectedFinding: WatchdogAction = {
      type: "flag-unverifiable-head",
      dedupe_key: "head-unverifiable:x",
      detail: "x",
    };
    // The valid spellings, for contrast (keys constructed through the
    // round-13 validated brand constructors — the only way in):
    const event: WatchdogPostEventAction = {
      type: "post-event",
      lane_id: asValidLaneId("lane-phase-49p")!,
      event_type: "system.lease_expired",
      event_id: "evt-x",
      sequence: 4,
      prior_state: "claude-working",
      dedupe_key: "lease-expired:lane-phase-49p:lease-1:3",
      detail: "x",
    };
    const malformedWithout: WatchdogMalformedLaneFinding = {
      type: "escalate-malformed-lane",
      issue_number: asPositiveIssueNumber(42)!,
      dedupe_key: "malformed:issue:42",
      detail: "x",
    };
    const malformedWith: WatchdogMalformedLaneFinding = {
      type: "escalate-malformed-lane",
      issue_number: asPositiveIssueNumber(17)!,
      lane_id: asValidLaneId("lane-phase-49q")!,
      dedupe_key: "malformed:issue:17",
      detail: "x",
    };
    expect([rejected, rejectedFinding, event, malformedWithout, malformedWith].length).toBe(5);
  });

  it("RUNTIME: every healthy action the scan emits carries the validated lane_id", () => {
    const out = scan([{ ...laneClaudeWorking(), issue_number: 41 }], makePolicy(), { now: AFTER_EXPIRY });
    expect(out.ok).toBe(true);
    expect(out.actions).toHaveLength(1);
    expect(out.actions[0]).toMatchObject({ type: "post-event", lane_id: "lane-phase-49p", issue_number: 41 });
  });

  it("RUNTIME: a stub whose lane_id is NOT a pattern-valid lane identity yields a finding WITHOUT lane_id", () => {
    // Round 11 J8: an arbitrary string in a malformed stub is not a
    // derived identity — it must never enter the durable finding record.
    const out = scan(
      [{ issue_number: 42, lane_id: "unreadable-issue-42", event_sequence: 42 }],
      makePolicy(),
      { now: NOW },
    );
    expect(out.ok).toBe(true);
    const findings = out.actions.filter((a) => a.type === "escalate-malformed-lane");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ issue_number: 42, dedupe_key: "malformed:issue:42" });
    expect(findings[0]?.lane_id).toBeUndefined();
  });

  it("RUNTIME: a pattern-valid lane_id derived from readable evidence IS carried on the malformed finding", () => {
    const out = scan(
      [{ issue_number: 17, lane_id: "lane-phase-49q", event_sequence: 17 }],
      makePolicy(),
      { now: NOW },
    );
    expect(out.ok).toBe(true);
    const findings = out.actions.filter((a) => a.type === "escalate-malformed-lane");
    expect(findings[0]).toMatchObject({ issue_number: 17, lane_id: "lane-phase-49q", dedupe_key: "malformed:issue:17" });
  });

  it("no production or test path routes on synthetic unreadable-issue-*/malformed-issue-* lane IDs", () => {
    const watchdogPlan = readFileSync(".straylight/lib/watchdog-plan.mjs", "utf8");
    const watchdog = readFileSync(".straylight/lib/watchdog.mjs", "utf8");
    expect(watchdogPlan).not.toMatch(/unreadable-issue-|malformed-issue-/);
    expect(watchdog).not.toMatch(/unreadable-issue-|malformed-issue-/);
    // The watchdog relays a stub lane_id onto a finding only through the
    // validated brand constructor (round 13: the pattern gate BECAME the
    // constructor).
    expect(watchdog).toMatch(/asValidLaneId\(lane\?\.lane_id\)/);
  });
});
