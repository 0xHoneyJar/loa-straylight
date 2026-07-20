// Control Plane v1 — workflow-boundary invariants (rev. 3 §11 + row 19
// + partial-execution recovery).
//
// The four workflows are gather → plan → execute: bash fetches bytes,
// switches on validated exit codes, and invokes the two Node entry
// points; no YAML/Bash step directly performs a GitHub write; every
// write flows through the single shared executor. Row 19: Stage B
// gathers FRESH evidence after Stage A's write and its plan derives from
// the post-write stream. Partial-execution recovery: after an exit-4
// partial run, fresh evidence + exact dedupe replan only missing work.

import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, chmodSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord,
  payloadDigest, REPO, NOW, BASE_SHA, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const REDUCER_PLANNER = ".straylight/bin/plan-reducer-writes.mjs";
const EXECUTOR = ".straylight/bin/execute-write-plan.mjs";
const API = "https://api.github.com";
const NONCE = "12345-1";
const T0 = "2026-07-16T11:00:00Z";

const WORKFLOWS = [
  ".github/workflows/straylight-bootstrap.yml",
  ".github/workflows/straylight-merge-guard.yml",
  ".github/workflows/straylight-reducer.yml",
  ".github/workflows/straylight-watchdog.yml",
] as const;

const sha256 = (s: string | Buffer) => "sha256:" + createHash("sha256").update(s).digest("hex");

// =============================================================================
// The boundary itself — no direct write anywhere; one executor per plan
// =============================================================================
describe("workflow boundary — bash fetches, planners decide, ONE executor writes", () => {
  it("no YAML/Bash step directly performs a GitHub write (no gh api -X, gh pr, gh issue mutation)", () => {
    for (const f of WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      const code = src.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
      expect(code, f).not.toMatch(/gh api -X (POST|PATCH|PUT|DELETE)/);
      expect(code, f).not.toMatch(/gh (pr|issue) (create|edit|comment|close|merge)/);
      expect(code, f).not.toMatch(/--method (POST|PATCH|PUT|DELETE)/);
    }
  });

  it("every write path is the shared executor with the fixed argument shape", () => {
    for (const f of WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toMatch(/node \.straylight\/bin\/execute-write-plan\.mjs/);
      expect(src, f).toMatch(/--plan "\$\{REQUEST_ROOT\}\/plan\.json"/);
      expect(src, f).toMatch(/--request-root "\$\{REQUEST_ROOT\}"/);
      expect(src, f).toMatch(/--nonce "\$\{NONCE\}"/);
    }
  });

  it("no shell interpretation of evidence: no eval, no authority-bearing gh|jq pipeline into a write decision", () => {
    for (const f of WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      const code = src.split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
      expect(code, f).not.toMatch(/\beval\b/);
      expect(code, f).not.toMatch(/gh api[^\n]*\|\s*grep/);
      // No process substitution feeding gh input (the retired
      // `--input <(jq …)` write pattern).
      expect(code, f).not.toMatch(/--input <\(/);
    }
  });

  it("the run nonce is passed explicitly to every planner and executor invocation", () => {
    for (const f of WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toMatch(/NONCE: \$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
    }
  });

  it("owner and repository are fixed: the executor's compiled allowlist is exactly 0xHoneyJar/loa-straylight", () => {
    const writePlan = readFileSync(".straylight/lib/write-plan.mjs", "utf8");
    expect(writePlan).toMatch(/REPOSITORY_ALLOWLIST = Object\.freeze\(\["0xHoneyJar\/loa-straylight"\]\)/);
    const executor = readFileSync(EXECUTOR, "utf8");
    expect(executor).toMatch(/validatePlan\(/);
  });
});

// =============================================================================
// Row 19 — Stage A posts; Stage B derives from the POST-write stream
// =============================================================================

function enumEntry(n: number, body: string | null) {
  return { number: n, url: `${API}/repos/${REPO}/issues/${n}`, body, created_at: T0, updated_at: NOW };
}
function laneBody() {
  return `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane())}\n\`\`\``;
}
function comment(id: number, issue: number, user: string, body: string) {
  return { id, url: `${API}/repos/${REPO}/issues/comments/${id}`, issue_url: `${API}/repos/${REPO}/issues/${issue}`, user: { login: user }, body, created_at: T0, updated_at: T0 };
}
function eventComment(id: number, issue: number, payload: Record<string, any>, user = "chatgpt-login") {
  return comment(id, issue, user, `<!-- straylight:event:v1 -->\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``);
}

function eligibilityPendingComments(issue: number): any[] {
  const packet = makeTaskPacket();
  const audit = makeAuditRecord();
  return [
    eventComment(3001, issue, makeEvent({ event_id: "evt-w1", sequence: 1, event_type: "lane.activated", prior_state: "planning" })),
    comment(3002, issue, "chatgpt-login", `<!-- straylight:task-packet:v1 -->\n\`\`\`json\n${JSON.stringify(packet)}\n\`\`\``),
    eventComment(3003, issue, makeEvent({
      event_id: "evt-w2", sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 3002, task_packet_digest: payloadDigest(packet) },
    })),
    eventComment(3004, issue, makeEvent({
      event_id: "evt-w3", sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: "2026-07-16T14:00:00Z",
    }), "claude-login"),
    eventComment(3005, issue, makeEvent({
      event_id: "evt-w4", sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    }), "claude-login"),
    eventComment(3006, issue, makeEvent({
      event_id: "evt-w5", sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: "2026-07-16T14:00:00Z",
    }), "codex-login"),
    comment(3007, issue, "codex-login", `<!-- straylight:audit:v1 -->\n\`\`\`json\n${JSON.stringify(audit)}\n\`\`\``),
    eventComment(3008, issue, makeEvent({
      event_id: "evt-w6", sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", verdict: "ACCEPT", audited_sha: HEAD_SHA,
      refs: { audit_comment_id: 3007, audit_digest: payloadDigest(audit), pr_number: 120 },
    }), "codex-login"),
  ];
}

const livePr = () => JSON.stringify({
  number: 120, url: `${API}/repos/${REPO}/pulls/120`, state: "open", draft: false, merged: false,
  base: { ref: "main", sha: BASE_SHA, repo: { full_name: REPO } },
  head: { ref: WORKING_BRANCH, sha: HEAD_SHA },
  created_at: T0, updated_at: NOW,
});

function writeGather(dir: string, comments: any[], labels: string[] | null, prDoc?: string) {
  const entry = enumEntry(41, laneBody());
  writeFileSync(join(dir, "enumeration.pages"), JSON.stringify([entry]));
  writeFileSync(join(dir, "issue.json"), JSON.stringify(entry));
  writeFileSync(join(dir, "comments.pages"), JSON.stringify(comments));
  if (labels !== null) {
    writeFileSync(join(dir, "labels.pages"), JSON.stringify(
      labels.map((name, i) => ({ id: i + 1, name, url: `${API}/repos/${REPO}/labels/${encodeURIComponent(name)}` })),
    ));
  }
  if (prDoc !== undefined) writeFileSync(join(dir, "pr.json"), prDoc);
}

function runPlanner(args: string[]) {
  try {
    const stdout = execFileSync("node", [REDUCER_PLANNER, ...args], { encoding: "utf8" });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    let out = null;
    try { out = e.stdout ? JSON.parse(e.stdout) : null; } catch { /* */ }
    return { status: e.status ?? -1, out };
  }
}

describe("row 19 — reducer Stage B gathers and reconstructs AFTER Stage A's write", () => {
  it("Stage A posts the confirmation; a FRESH post-write gather makes Stage B's labels/result reflect ready-for-merge", () => {
    const policyDir = mkdtempSync(join(tmpdir(), "cp-row19-"));
    const policyPath = join(policyDir, "policy.json");
    writeFileSync(policyPath, JSON.stringify(makePolicy()));
    const cs = eligibilityPendingComments(41);

    // --- Stage A: plan against the pre-write world.
    const gA1 = mkdtempSync(join(tmpdir(), "cp-a1-"));
    const gA2 = mkdtempSync(join(tmpdir(), "cp-a2-"));
    writeGather(gA1, cs, null);
    writeGather(gA2, cs, null, livePr());
    const requestA = mkdtempSync(join(tmpdir(), "cp-reqa-"));
    const a = runPlanner([
      "--stage", "a", "--gather-1", gA1, "--gather-2", gA2,
      "--issue-number", "41", "--request-root", requestA,
      "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    expect(a.status).toBe(0);
    const planA = JSON.parse(readFileSync(join(requestA, "plan.json"), "utf8"));
    expect(planA.operations).toHaveLength(1);
    expect(planA.operations[0].kind).toBe("post-state-advancing-event");

    // --- "Execute" Stage A: the confirmation comment LANDS on the issue.
    // (The durable effect of the executor's single POST.)
    const confirmationBody = JSON.parse(readFileSync(join(requestA, planA.operations[0].body_file), "utf8")).body;
    const postWrite = [...cs, comment(3999, 41, "github-actions[bot]", confirmationBody)];

    // --- Stage B: a COMPLETELY FRESH gather of the post-write stream.
    const gB1 = mkdtempSync(join(tmpdir(), "cp-b1-"));
    const gB2 = mkdtempSync(join(tmpdir(), "cp-b2-"));
    writeGather(gB1, postWrite, ["cp-lane", "cp-state:eligibility-pending", "cp-next:system"]);
    writeGather(gB2, postWrite, ["cp-lane", "cp-state:eligibility-pending", "cp-next:system"]);
    const requestB = mkdtempSync(join(tmpdir(), "cp-reqb-"));
    const b = runPlanner([
      "--stage", "b", "--gather-1", gB1, "--gather-2", gB2,
      "--issue-number", "41", "--request-root", requestB,
      "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    expect(b.status).toBe(0);
    expect(b.out.state).toBe("ready-for-merge"); // the CONFIRMED state — no pre-write projection escaped
    const planB = JSON.parse(readFileSync(join(requestB, "plan.json"), "utf8"));
    // Labels converge to the confirmed state; stale eligibility-pending
    // projections are removed; the result reflects sequence 7.
    const adds = planB.operations.filter((o: any) => o.kind === "add-derived-label").map((o: any) => o.label);
    const removes = planB.operations.filter((o: any) => o.kind === "remove-derived-label").map((o: any) => o.label);
    expect(adds).toContain("cp-state:ready-for-merge");
    expect(adds).toContain("cp-ready-for-merge");
    expect(removes).toContain("cp-state:eligibility-pending");
    const result = planB.operations.find((o: any) => o.kind === "post-reducer-result");
    expect(result.dedupe_key).toBe("reducer-result:7:ready-for-merge");
    // Stage B NEVER advances state.
    expect(planB.operations.some((o: any) => o.kind === "post-state-advancing-event")).toBe(false);

    // --- Control: Stage B against the STALE pre-write stream would have
    // published the pre-confirmation projection — proving the freshness
    // requirement is what keeps the stale projection unpublishable.
    const gS1 = mkdtempSync(join(tmpdir(), "cp-s1-"));
    const gS2 = mkdtempSync(join(tmpdir(), "cp-s2-"));
    writeGather(gS1, cs, ["cp-lane"]);
    writeGather(gS2, cs, ["cp-lane"]);
    const requestS = mkdtempSync(join(tmpdir(), "cp-reqs-"));
    const stale = runPlanner([
      "--stage", "b", "--gather-1", gS1, "--gather-2", gS2,
      "--issue-number", "41", "--request-root", requestS,
      "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    expect(stale.status).toBe(0);
    expect(stale.out.state).toBe("eligibility-pending");
  });

  it("the workflow structurally orders Stage B's fresh gather AFTER Stage A's executor invocation", () => {
    const wf = readFileSync(".github/workflows/straylight-reducer.yml", "utf8");
    const execA = wf.indexOf("Stage A — execute write plan");
    const gatherB = wf.indexOf("Stage B — gather fresh evidence twice");
    expect(execA).toBeGreaterThan(-1);
    expect(gatherB).toBeGreaterThan(execA);
    // Stage B's planner consumes ONLY the Stage B gather outputs.
    const stageB = wf.slice(gatherB);
    expect(stageB).toMatch(/--gather-1 "\$\{\{ steps\.gather_b\.outputs\.g1 \}\}"/);
    expect(stageB).toMatch(/--gather-2 "\$\{\{ steps\.gather_b\.outputs\.g2 \}\}"/);
    expect(stageB).not.toMatch(/steps\.gather_a\.outputs/);
  });
});

// =============================================================================
// Partial-execution recovery — fresh evidence + exact dedupe replan only
// missing work after an exit-4 partial run
// =============================================================================
describe("partial-execution recovery — dedupe + fresh reconstruction plan only missing work", () => {
  it("after op 1 (of 2) landed and the run exited 4, the fresh replan contains ONLY the missing operation", () => {
    const policyDir = mkdtempSync(join(tmpdir(), "cp-recover-"));
    const policyPath = join(policyDir, "policy.json");
    writeFileSync(policyPath, JSON.stringify(makePolicy()));

    // A Stage B world needing TWO comment-visible writes is not natural
    // (labels are invisible to dedupe), so use the natural two-write
    // surface: the §9 cp-paused pair — warning (op W) + removal. Simulate
    // "warning landed, removal never ran" (executor exited 4 between).
    const preComments: any[] = [];
    const g1 = mkdtempSync(join(tmpdir(), "cp-rc1-"));
    const g2 = mkdtempSync(join(tmpdir(), "cp-rc2-"));
    writeGather(g1, preComments, ["cp-lane", "cp-paused", "cp-state:planning", "cp-next:coordinator"]);
    writeGather(g2, preComments, ["cp-lane", "cp-paused", "cp-state:planning", "cp-next:coordinator"]);
    const request1 = mkdtempSync(join(tmpdir(), "cp-rcq1-"));
    const first = runPlanner([
      "--stage", "b", "--gather-1", g1, "--gather-2", g2,
      "--issue-number", "41", "--request-root", request1,
      "--repository", REPO, "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    expect(first.status).toBe(0);
    const plan1 = JSON.parse(readFileSync(join(request1, "plan.json"), "utf8"));
    const warning1 = plan1.operations.find((o: any) => o.kind === "post-cp-paused-warning");
    const removal1 = plan1.operations.find((o: any) => o.kind === "remove-derived-cp-paused-after-warning");
    expect(warning1).toBeDefined();
    expect(removal1.warning_op_id).toBe(warning1.op_id);

    // The warning LANDED durably; the removal did not (partial execution).
    const warningBody = JSON.parse(readFileSync(join(request1, warning1.body_file), "utf8")).body;
    const postPartial = [...preComments, comment(4001, 41, "github-actions[bot]", warningBody)];

    // RECOVERY: a fresh run — fresh evidence, fresh reconstruction, new
    // plan. The warning is now PROVEN already present (exact full-line
    // dedupe), so the replan carries warning_proof and NO second warning.
    const g3 = mkdtempSync(join(tmpdir(), "cp-rc3-"));
    const g4 = mkdtempSync(join(tmpdir(), "cp-rc4-"));
    writeGather(g3, postPartial, ["cp-lane", "cp-paused", "cp-state:planning", "cp-next:coordinator"]);
    writeGather(g4, postPartial, ["cp-lane", "cp-paused", "cp-state:planning", "cp-next:coordinator"]);
    const request2 = mkdtempSync(join(tmpdir(), "cp-rcq2-"));
    const second = runPlanner([
      "--stage", "b", "--gather-1", g3, "--gather-2", g4,
      "--issue-number", "41", "--request-root", request2,
      "--repository", REPO, "--nonce", "12345-2", "--now", NOW, "--policy", policyPath,
    ]);
    expect(second.status).toBe(0);
    const plan2 = JSON.parse(readFileSync(join(request2, "plan.json"), "utf8"));
    expect(plan2.operations.some((o: any) => o.kind === "post-cp-paused-warning")).toBe(false);
    const removal2 = plan2.operations.find((o: any) => o.kind === "remove-derived-cp-paused-after-warning");
    expect(removal2).toBeDefined();
    expect(removal2.warning_proof).toEqual({
      comment_id: 4001,
      dedupe_key: "cp-paused-warning:lane-phase-49p:41",
    });
  });

  it("the recovered plan executes: the DELETE runs without a second warning post (end-to-end)", () => {
    // Execute a warning_proof-only removal through the real executor with
    // a mock gh: exactly one DELETE, no POST.
    const root = mkdtempSync(join(tmpdir(), "cp-rcx-"));
    const ghDir = join(root, "gh-mock");
    mkdirSync(ghDir);
    const log = join(ghDir, "launches.log");
    writeFileSync(join(ghDir, "gh"), `#!/bin/sh\n{ printf 'ARGV:'; for a in "$@"; do printf ' %s' "$a"; done; printf '\\n'; } >> "${log}"\ncat > /dev/null\nexit 0\n`);
    chmodSync(join(ghDir, "gh"), 0o755);
    const plan = {
      schema: "straylight.write-plan.v1",
      plan_id: `${NONCE}-reducer-b`,
      nonce: NONCE,
      repository: REPO,
      operations: [{
        op_id: "op-1", kind: "remove-derived-cp-paused-after-warning",
        issue_number: 41, lane_id: "lane-phase-49p",
        warning_proof: { comment_id: 4001, dedupe_key: "cp-paused-warning:lane-phase-49p:41" },
      }],
    };
    writeFileSync(join(root, "plan.json"), JSON.stringify(plan));
    execFileSync(process.execPath, [
      EXECUTOR, "--plan", join(root, "plan.json"), "--request-root", root,
      "--repository", REPO, "--nonce", NONCE,
    ], {
      encoding: "utf8",
      env: { PATH: `${ghDir}:${process.env.PATH}`, HOME: process.env.HOME ?? "/tmp", GH_TOKEN: "t" },
    });
    const launches = readFileSync(log, "utf8").trim().split("\n");
    expect(launches).toEqual([`ARGV: api -X DELETE repos/${REPO}/issues/41/labels/cp-paused`]);
  });
});
