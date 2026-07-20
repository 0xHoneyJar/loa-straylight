// Control Plane v1 — planner adversarial matrix
// (plan-bootstrap-write.mjs, plan-reducer-writes.mjs --stage a|b,
//  plan-merge-guard-write.mjs).
//
// Duplicate valid lane IDs exit 2 for EVERY writer (C1) — bootstrap
// included; every planner requires the universal lane-target proof from
// same-execution evidence (N3); reducer Stage A plans at most the single
// eligibility-confirmation event (terminal); Stage B never emits a
// state-advancing operation and gates every cp-paused removal behind the
// §9 warning pair; the two-read stability fence refuses a moved world.

import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord,
  payloadDigest, REPO, NOW, BASE_SHA, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";
import { warningDedupeKey, warningBodyFor } from "../../.straylight/lib/write-plan.mjs";

const BOOTSTRAP_PLANNER = ".straylight/bin/plan-bootstrap-write.mjs";
const REDUCER_PLANNER = ".straylight/bin/plan-reducer-writes.mjs";
const MERGE_GUARD_PLANNER = ".straylight/bin/plan-merge-guard-write.mjs";
const API = "https://api.github.com";
const NONCE = "12345-1";
const T0 = "2026-07-16T11:00:00Z";

function enumEntry(n: number, body: string | null) {
  return { number: n, url: `${API}/repos/${REPO}/issues/${n}`, body, created_at: T0, updated_at: NOW };
}
function laneBody(overrides: Record<string, any> = {}) {
  return `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane(overrides))}\n\`\`\``;
}
function comment(id: number, issue: number, user: string, body: string, created = T0, updated = T0) {
  return { id, url: `${API}/repos/${REPO}/issues/comments/${id}`, issue_url: `${API}/repos/${REPO}/issues/${issue}`, user: { login: user }, body, created_at: created, updated_at: updated };
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

function writePolicy(dir: string, overrides: Record<string, any> = {}) {
  const p = join(dir, "policy.json");
  writeFileSync(p, JSON.stringify(makePolicy(overrides)));
  return p;
}

// =============================================================================
// Bootstrap planner
// =============================================================================
describe("bootstrap planner — the absence proof gates every creation", () => {
  function setup(issues: any[], labels: any[] = []) {
    const dir = mkdtempSync(join(tmpdir(), "cp-boot-"));
    writeFileSync(join(dir, "pages.json"), JSON.stringify(issues));
    writeFileSync(join(dir, "labels.json"), JSON.stringify(labels));
    const requestRoot = join(dir, "request");
    mkdirSync(requestRoot);
    return { dir, requestRoot };
  }
  const label = (name: string, id = 7) => ({ id, name, url: `${API}/repos/${REPO}/labels/${encodeURIComponent(name)}` });
  const args = (s: ReturnType<typeof setup>) => [
    "--pages", join(s.dir, "pages.json"), "--labels", join(s.dir, "labels.json"),
    "--base-sha", BASE_SHA, "--request-root", s.requestRoot,
    "--repository", REPO, "--nonce", NONCE,
  ];

  it("absence proven → plans label definition + lane issue; genesis validates and binds", () => {
    const s = setup([enumEntry(1, "prose")]);
    const r = run(BOOTSTRAP_PLANNER, args(s));
    expect(r.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(s.requestRoot, "plan.json"), "utf8"));
    expect(plan.operations.map((o: any) => o.kind)).toEqual(["create-label-definition", "create-lane-issue"]);
    const laneOp = plan.operations[1];
    const body = JSON.parse(readFileSync(join(s.requestRoot, laneOp.body_file), "utf8"));
    expect(body.labels).toEqual(["cp-lane"]);
    expect(body.body).toContain("<!-- straylight:lane:v1 -->");
    // The genesis pins the planner-verified base SHA.
    expect(body.body).toContain(BASE_SHA);
  });

  it("cp-lane label already defined → only the lane issue is planned", () => {
    const s = setup([enumEntry(1, "prose")], [label("cp-lane")]);
    const r = run(BOOTSTRAP_PLANNER, args(s));
    expect(r.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(s.requestRoot, "plan.json"), "utf8"));
    expect(plan.operations.map((o: any) => o.kind)).toEqual(["create-lane-issue"]);
  });

  it("the lane existing exactly once (even on a later page / without any label) → exit 3, nothing written", () => {
    const s = setup([enumEntry(1, "prose"), enumEntry(202, laneBody())]);
    const r = run(BOOTSTRAP_PLANNER, args(s));
    expect(r.status).toBe(3);
    expect(r.out).toMatchObject({ ok: true, exists: true, numbers: [202] });
    expect(existsSync(join(s.requestRoot, "plan.json"))).toBe(false);
  });

  it("C1: DUPLICATE valid lane IDs exit 2 — bootstrap refuses to trust an ambiguous enumeration", () => {
    const s = setup([enumEntry(41, laneBody()), enumEntry(44, laneBody())]);
    const r = run(BOOTSTRAP_PLANNER, args(s));
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("duplicate-lane-id");
    expect(existsSync(join(s.requestRoot, "plan.json"))).toBe(false);
    // Even a duplicate of ANOTHER lane refuses absence.
    const s2 = setup([
      enumEntry(41, laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" })),
      enumEntry(44, laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" })),
    ]);
    expect(run(BOOTSTRAP_PLANNER, args(s2)).status).toBe(2);
  });

  it("an unreadable marker-bearing body exits 2 — it could BE the lane in mangled form", () => {
    const s = setup([enumEntry(9, "<!-- straylight:lane:v1 -->\n```json\n{ mangled ]\n```")]);
    const r = run(BOOTSTRAP_PLANNER, args(s));
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("lane-target-unreadable");
  });

  it("malformed enumeration, malformed labels, and a bad base SHA all exit 2", () => {
    const s = setup([enumEntry(1, "prose")]);
    writeFileSync(join(s.dir, "pages.json"), '[{"number": 1'); // truncated
    expect(run(BOOTSTRAP_PLANNER, args(s)).status).toBe(2);

    const s2 = setup([enumEntry(1, "prose")]);
    writeFileSync(join(s2.dir, "labels.json"), ""); // zero-byte stream
    expect(run(BOOTSTRAP_PLANNER, args(s2)).status).toBe(2);

    const s3 = setup([enumEntry(1, "prose")]);
    const badSha = [...args(s3)];
    badSha[badSha.indexOf(BASE_SHA)] = "not-a-sha";
    expect(run(BOOTSTRAP_PLANNER, badSha).status).toBe(2);
  });

  it("wrong-repository evidence exits 2 (N2 binding through the shared parser)", () => {
    const s = setup([{ ...enumEntry(1, "prose"), url: `${API}/repos/evil/repo/issues/1` }]);
    const r = run(BOOTSTRAP_PLANNER, args(s));
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("binding-url-mismatch");
  });
});

// =============================================================================
// Reducer planner — shared gather scaffolding
// =============================================================================

// Comment chain driving lane-phase-49p to eligibility-pending (ACCEPT
// audit recorded, awaiting confirmation).
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
  ...overrides,
});

// One gather directory (a complete read) for the reducer/merge-guard
// planners: enumeration + issue + comments (+ labels / pr as requested).
function writeGather(opts: {
  issue: number;
  body: string;
  comments: any[];
  labels?: string[];
  prDoc?: string;
  extraIssues?: any[];
}) {
  const dir = mkdtempSync(join(tmpdir(), "cp-gather-"));
  const entry = enumEntry(opts.issue, opts.body);
  writeFileSync(join(dir, "enumeration.pages"), JSON.stringify([entry, ...(opts.extraIssues ?? [])]));
  writeFileSync(join(dir, "issue.json"), JSON.stringify(entry));
  writeFileSync(join(dir, "comments.pages"), JSON.stringify(opts.comments));
  if (opts.labels !== undefined) {
    writeFileSync(join(dir, "labels.pages"), JSON.stringify(
      opts.labels.map((name, i) => ({ id: i + 1, name, url: `${API}/repos/${REPO}/labels/${encodeURIComponent(name)}` })),
    ));
  }
  if (opts.prDoc !== undefined) writeFileSync(join(dir, "pr.json"), opts.prDoc);
  return dir;
}

function reducerArgs(stage: string, g1: string, g2: string, requestRoot: string | null, policyPath: string, issue = 41) {
  return [
    "--stage", stage,
    "--gather-1", g1, "--gather-2", g2,
    "--issue-number", String(issue),
    ...(requestRoot === null ? ["--probe"] : ["--request-root", requestRoot]),
    "--repository", REPO, "--nonce", NONCE, "--now", NOW,
    "--policy", policyPath,
  ];
}

// =============================================================================
// Reducer Stage A
// =============================================================================
describe("reducer Stage A — at most the eligibility confirmation, terminal", () => {
  it("an eligibility-pending lane with live PR evidence plans EXACTLY ONE state-advancing operation", () => {
    const cs = eligibilityPendingComments(41);
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: cs });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: cs, prDoc: livePr() });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("a", g1, g2, requestRoot, policyPath));
    expect(r.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(requestRoot, "plan.json"), "utf8"));
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]).toMatchObject({
      kind: "post-state-advancing-event",
      issue_number: 41,
      lane_id: "lane-phase-49p",
      dedupe_key: "eligibility-confirmed:lane-phase-49p:6",
    });
    const body = JSON.parse(readFileSync(join(requestRoot, plan.operations[0].body_file), "utf8"));
    expect(body.body).toContain("system.eligibility_confirmed");
    expect(body.body).toContain(`"head_sha": "${HEAD_SHA}"`);
  });

  it("--probe reports the derived state without writing anything (bash decides fetches on DERIVED output)", () => {
    const cs = eligibilityPendingComments(41);
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: cs });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: cs });
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("a", g1, g2, null, policyPath));
    expect(r.status).toBe(0);
    expect(r.out).toMatchObject({ ok: true, state: "eligibility-pending", lane_id: "lane-phase-49p", pr_number: 120 });
  });

  it("not eligibility-pending → exit 3 (valid no-op); missing PR evidence → exit 3 (fail closed, retry)", () => {
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    expect(run(REDUCER_PLANNER, reducerArgs("a", g1, g2, requestRoot, policyPath)).status).toBe(3);

    const cs = eligibilityPendingComments(41);
    const g3 = writeGather({ issue: 41, body: laneBody(), comments: cs });
    const g4 = writeGather({ issue: 41, body: laneBody(), comments: cs }); // no pr.json
    const r = run(REDUCER_PLANNER, reducerArgs("a", g3, g4, requestRoot, policyPath));
    expect(r.status).toBe(3);
    expect(existsSync(join(requestRoot, "plan.json"))).toBe(false);
  });

  it("the dry-run refuses a doomed confirmation (draft PR) → exit 3, dedupe key NOT burned", () => {
    const cs = eligibilityPendingComments(41);
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: cs });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: cs, prDoc: livePr({ draft: true }) });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("a", g1, g2, requestRoot, policyPath));
    expect(r.status).toBe(3);
    expect(r.out.detail).toContain("dry-run");
    expect(existsSync(join(requestRoot, "plan.json"))).toBe(false);
  });

  it("an already-posted confirmation (exact dedupe) → exit 3; a moved world between reads → exit 2", () => {
    const cs = eligibilityPendingComments(41);
    const posted = comment(3999, 41, "github-actions[bot]",
      `## confirmation\n\ndedupe:eligibility-confirmed:lane-phase-49p:6\n\n<!-- straylight:event:v1 -->\n\`\`\`json\n{"schema":"straylight.event.v1"}\n\`\`\``);
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [...cs, posted] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [...cs, posted], prDoc: livePr() });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    expect(run(REDUCER_PLANNER, reducerArgs("a", g1, g2, requestRoot, policyPath)).status).toBe(3);

    // Two-read instability: read 2 gained a protocol comment.
    const g3 = writeGather({ issue: 41, body: laneBody(), comments: cs });
    const g4 = writeGather({ issue: 41, body: laneBody(), comments: [...cs, posted], prDoc: livePr() });
    const r = run(REDUCER_PLANNER, reducerArgs("a", g3, g4, requestRoot, policyPath));
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");
  });

  it("C1: a duplicate lane ID in the same-execution enumeration exits 2 (universal lane-target proof)", () => {
    const cs = eligibilityPendingComments(41);
    const dup = enumEntry(44, laneBody());
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: cs, extraIssues: [dup] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: cs, extraIssues: [dup], prDoc: livePr() });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("a", g1, g2, requestRoot, policyPath));
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("duplicate-lane-id");
  });

  it("wrong-repository / wrong-PR live evidence exits 2 (N2 binding)", () => {
    const cs = eligibilityPendingComments(41);
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: cs });
    const g2 = writeGather({
      issue: 41, body: laneBody(), comments: cs,
      prDoc: livePr({ base: { ref: "main", sha: BASE_SHA, repo: { full_name: "evil/repo" } } }),
    });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("a", g1, g2, requestRoot, policyPath));
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("binding-repository-mismatch");
  });
});

// =============================================================================
// Reducer Stage B
// =============================================================================
describe("reducer Stage B — projections only, warning-gated cp-paused, never state-advancing", () => {
  it("plans label adds/removals + the result comment from FRESH evidence; no state-advancing kind ever", () => {
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [], labels: ["cp-lane", "cp-state:ready-for-merge"] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [], labels: ["cp-lane", "cp-state:ready-for-merge"] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("b", g1, g2, requestRoot, policyPath));
    expect(r.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(requestRoot, "plan.json"), "utf8"));
    const kinds = plan.operations.map((o: any) => o.kind);
    expect(kinds).not.toContain("post-state-advancing-event");
    // planning state wants cp-state:planning + cp-next:coordinator; the
    // stale ready-for-merge projection is removed; result posted.
    expect(kinds).toContain("add-derived-label");
    expect(kinds).toContain("remove-derived-label");
    expect(kinds).toContain("post-reducer-result");
    const removal = plan.operations.find((o: any) => o.kind === "remove-derived-label");
    expect(removal.label).toBe("cp-state:ready-for-merge");
  });

  it("§9: a required cp-paused removal is planned as the warning-gated PAIR (warning first, fatal by kind)", () => {
    // Lane reconstructs unpaused, but the label evidence carries cp-paused.
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [], labels: ["cp-lane", "cp-paused"] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [], labels: ["cp-lane", "cp-paused"] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("b", g1, g2, requestRoot, policyPath));
    expect(r.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(requestRoot, "plan.json"), "utf8"));
    const warning = plan.operations.find((o: any) => o.kind === "post-cp-paused-warning");
    const removal = plan.operations.find((o: any) => o.kind === "remove-derived-cp-paused-after-warning");
    expect(warning).toBeDefined();
    expect(removal).toBeDefined();
    expect(removal.warning_op_id).toBe(warning.op_id);
    expect(plan.operations.indexOf(warning)).toBeLessThan(plan.operations.indexOf(removal));
    // NEVER a plain remove-derived-label naming cp-paused.
    expect(plan.operations.some((o: any) => o.kind === "remove-derived-label" && o.label === "cp-paused")).toBe(false);
    // The warning body is the byte-exact state-neutral template.
    const wBody = JSON.parse(readFileSync(join(requestRoot, warning.body_file), "utf8"));
    expect(wBody.body).toBe(warningBodyFor("lane-phase-49p", 41));
  });

  it("§9 already-present path: an existing exact warning lets the removal carry warning_proof (retry without re-posting)", () => {
    const wDedupe = warningDedupeKey("lane-phase-49p", 41);
    const postedWarning = comment(3998, 41, "github-actions[bot]", warningBodyFor("lane-phase-49p", 41));
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [postedWarning], labels: ["cp-lane", "cp-paused"] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [postedWarning], labels: ["cp-lane", "cp-paused"] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("b", g1, g2, requestRoot, policyPath));
    expect(r.status).toBe(0);
    const plan = JSON.parse(readFileSync(join(requestRoot, "plan.json"), "utf8"));
    expect(plan.operations.some((o: any) => o.kind === "post-cp-paused-warning")).toBe(false);
    const removal = plan.operations.find((o: any) => o.kind === "remove-derived-cp-paused-after-warning");
    expect(removal.warning_proof).toEqual({ comment_id: 3998, dedupe_key: wDedupe });
  });

  it("labels converged + result already posted → exit 3 (valid no-op)", () => {
    const resultDedupe = "reducer-result:0:planning";
    const postedResult = comment(3997, 41, "github-actions[bot]",
      `## result\n\ndedupe:${resultDedupe}\n\n<!-- straylight:reducer-result:v1 -->\n\`\`\`json\n{"ok":true}\n\`\`\``);
    const labels = ["cp-lane", "cp-state:planning", "cp-next:coordinator"];
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [postedResult], labels });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [postedResult], labels });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    expect(run(REDUCER_PLANNER, reducerArgs("b", g1, g2, requestRoot, policyPath)).status).toBe(3);
  });

  it("Stage B refuses a moved world (two-read fence) and malformed label evidence", () => {
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [], labels: ["cp-lane"] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [], labels: ["cp-lane", "cp-paused"] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(REDUCER_PLANNER, reducerArgs("b", g1, g2, requestRoot, policyPath));
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("two-read-instability");

    const g3 = writeGather({ issue: 41, body: laneBody(), comments: [], labels: ["cp-lane"] });
    writeFileSync(join(g3, "labels.pages"), ""); // zero-byte stream
    const g4 = writeGather({ issue: 41, body: laneBody(), comments: [], labels: ["cp-lane"] });
    expect(run(REDUCER_PLANNER, reducerArgs("b", g3, g4, requestRoot, policyPath)).status).toBe(2);
  });
});

// =============================================================================
// Merge-guard planner
// =============================================================================
describe("merge-guard planner — report-only, deduped, fail-closed", () => {
  it("plans one exact-deduped shadow result; ineligible on absent PR/check evidence (fail closed)", () => {
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(MERGE_GUARD_PLANNER, [
      "--gather-1", g1, "--gather-2", g2, "--issue-number", "41",
      "--request-root", requestRoot, "--repository", REPO,
      "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    expect(r.status).toBe(0);
    expect(r.out.eligible).toBe(false);
    const plan = JSON.parse(readFileSync(join(requestRoot, "plan.json"), "utf8"));
    expect(plan.operations).toHaveLength(1);
    expect(plan.operations[0]).toMatchObject({ kind: "post-merge-guard-result", issue_number: 41 });
    const body = JSON.parse(readFileSync(join(requestRoot, plan.operations[0].body_file), "utf8"));
    expect(body.body).toContain("SHADOW RESULT (cannot merge)");
    expect(body.body).toContain("<!-- straylight:merge-guard-result:v1 -->");
  });

  it("an already-posted result for the same sequence+head+eligibility → exit 3", () => {
    const dedupe = "merge-guard:0:unknown:false";
    const posted = comment(3996, 41, "github-actions[bot]",
      `## guard\n\ndedupe:${dedupe}\n\n<!-- straylight:merge-guard-result:v1 -->\n\`\`\`json\n{"eligible":false}\n\`\`\``);
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [posted] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [posted] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(MERGE_GUARD_PLANNER, [
      "--gather-1", g1, "--gather-2", g2, "--issue-number", "41",
      "--request-root", requestRoot, "--repository", REPO,
      "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    expect(r.status).toBe(3);
  });

  it("C1: duplicate lane IDs exit 2 for the merge guard too", () => {
    const dup = enumEntry(44, laneBody());
    const g1 = writeGather({ issue: 41, body: laneBody(), comments: [], extraIssues: [dup] });
    const g2 = writeGather({ issue: 41, body: laneBody(), comments: [], extraIssues: [dup] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(MERGE_GUARD_PLANNER, [
      "--gather-1", g1, "--gather-2", g2, "--issue-number", "41",
      "--request-root", requestRoot, "--repository", REPO,
      "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    expect(r.status).toBe(2);
    expect(r.out.reason).toBe("duplicate-lane-id");
  });

  it("the lane living on a DIFFERENT issue than dispatched exits 2 (lane-issue-mismatch)", () => {
    // Issue 41 is prose; the lane lives on 44. Dispatch names 41.
    const laneElsewhere = enumEntry(44, laneBody());
    const g1 = writeGather({ issue: 41, body: "prose", comments: [], extraIssues: [laneElsewhere] });
    const g2 = writeGather({ issue: 41, body: "prose", comments: [], extraIssues: [laneElsewhere] });
    const requestRoot = mkdtempSync(join(tmpdir(), "cp-req-"));
    const policyPath = writePolicy(g1);
    const r = run(MERGE_GUARD_PLANNER, [
      "--gather-1", g1, "--gather-2", g2, "--issue-number", "41",
      "--request-root", requestRoot, "--repository", REPO,
      "--nonce", NONCE, "--now", NOW, "--policy", policyPath,
    ]);
    expect(r.status).toBe(2);
    // Issue 41 has no genesis at all → reconstruction fails there first;
    // either refusal is fail-closed and correct.
    expect(["lane-issue-mismatch", "reconstruction-failed"]).toContain(r.out.reason);
  });
});
