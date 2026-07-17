// Control Plane v1 — watchdog and shadow merge guard.
// Covers: watchdog idempotency, expired-lease detection, moved-head
// detection, stuck-lane escalation, shadow merge guard success, and the
// proof that the shadow merge guard cannot merge.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { scan } from "../../.straylight/lib/watchdog.mjs";
import { evaluate } from "../../.straylight/lib/merge-guard.mjs";
import {
  makeLane, makePolicy, makeLease, laneClaudeWorking,
  NOW, AFTER_EXPIRY, HEAD_SHA, OTHER_SHA,
} from "./_fixtures.js";

const policy = makePolicy();

describe("watchdog scan", () => {
  it("identifies an expired lease and proposes system.lease_expired", () => {
    const out = scan([laneClaudeWorking()], policy, { now: AFTER_EXPIRY });
    expect(out.ok).toBe(true);
    expect(out.actions).toHaveLength(1);
    expect(out.actions[0]).toMatchObject({
      type: "post-event",
      event_type: "system.lease_expired",
      lane_id: "lane-phase-49p",
      sequence: 4,
    });
  });

  it("proposes requeue for lease-expired lanes to the correct retry state", () => {
    const noPr = makeLane({ state: "lease-expired", event_sequence: 4 });
    const withPr = makeLane({ state: "lease-expired", event_sequence: 4, pr_number: 120, pr_head_sha: HEAD_SHA });
    const out = scan([noPr, withPr], policy, { now: NOW });
    expect(out.actions.map((a) => a.requested_state)).toEqual(["ready-for-claude", "ready-for-codex"]);
  });

  it("detects an audited lane whose PR head moved", () => {
    const lane = makeLane({
      state: "ready-for-merge", next_actor: "operator", event_sequence: 6,
      pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
    });
    const out = scan([lane], policy, { now: NOW, pr_heads: { "120": OTHER_SHA } });
    expect(out.actions[0]).toMatchObject({ type: "post-event", event_type: "system.head_moved" });
  });

  it("stays quiet when the head has not moved", () => {
    const lane = makeLane({
      state: "ready-for-merge", next_actor: "operator", event_sequence: 6,
      pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
    });
    const out = scan([lane], policy, { now: NOW, pr_heads: { "120": HEAD_SHA } });
    expect(out.actions).toHaveLength(0);
  });

  it("escalates lanes stuck past the threshold (ready-for-codex without audit)", () => {
    const lane = makeLane({ state: "ready-for-codex", next_actor: "auditor", event_sequence: 4, pr_number: 120, pr_head_sha: HEAD_SHA });
    const out = scan([lane], policy, {
      now: "2026-07-20T12:00:00Z",
      last_activity: { "lane-phase-49p": "2026-07-16T12:00:00Z" }, // 96h idle > 72h
    });
    expect(out.actions[0]).toMatchObject({ type: "post-event", event_type: "system.escalated" });
  });

  it("is idempotent: identical input yields identical actions and dedupe keys", () => {
    const lanes = [laneClaudeWorking()];
    const a = scan(lanes, policy, { now: AFTER_EXPIRY });
    const b = scan(lanes, policy, { now: AFTER_EXPIRY });
    expect(a).toEqual(b);
    expect(a.actions[0]?.dedupe_key).toBe(`lease-expired:lane-phase-49p:lease-claude-1:3`);
  });

  it("proposes at most one recovery step per lane per sweep", () => {
    const lane = laneClaudeWorking(); // expired lease AND potentially stuck
    const out = scan([lane], policy, {
      now: AFTER_EXPIRY,
      last_activity: { "lane-phase-49p": "2026-07-01T00:00:00Z" },
    });
    expect(out.actions.filter((a) => a.lane_id === "lane-phase-49p")).toHaveLength(1);
  });

  it("does nothing when the kill switch is off", () => {
    const out = scan([laneClaudeWorking()], makePolicy({ enabled: false }), { now: AFTER_EXPIRY });
    expect(out.ok).toBe(false);
    expect(out.actions).toHaveLength(0);
  });

  it("skips paused lanes and escalates malformed lanes", () => {
    const paused = laneClaudeWorking({ operator_pause: true });
    const malformed = { schema: "straylight.lane.v1", lane_id: "lane-broken" };
    const out = scan([paused, malformed], policy, { now: AFTER_EXPIRY });
    expect(out.actions).toHaveLength(1);
    expect(out.actions[0]?.type).toBe("escalate-malformed-lane");
  });

  it("fails closed without a clock", () => {
    const out = scan([laneClaudeWorking()], policy, {});
    expect(out.ok).toBe(false);
    expect(out.actions).toHaveLength(0);
  });
});

describe("shadow merge guard", () => {
  const eligibleLane = makeLane({
    state: "ready-for-merge", event_sequence: 7,
    pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
  });

  // Raw check evidence that satisfies the fail-closed gate: >=1 check run,
  // every conclusion passing, conclusion list length == API total, no legacy
  // statuses required.
  const passingChecks = {
    check_runs_total: 1, check_run_conclusions: ["success"],
    commit_statuses_total: 0, commit_status_state: "pending",
  };
  // A fully-live context: passing checks, matching head, open non-draft
  // non-merged PR on the lane's base branch. Individual tests override one
  // field to prove closure.
  const liveCtx = {
    pr_head_sha: HEAD_SHA, checks: passingChecks,
    pr_state: "open", pr_draft: false, pr_merged: false, pr_base_ref: "main",
  };

  it("reports eligible for a fully satisfied lane — as a report only", () => {
    const out = evaluate(eligibleLane, policy, liveCtx);
    expect(out.eligible).toBe(true);
    expect(out.shadow).toBe(true);
    expect(out.action).toBe("report-only");
    expect(out.note).toContain("cannot merge");
  });

  it("reports ineligible on head mismatch, missing verdict, wrong state, pause, or failing checks", () => {
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_head_sha: OTHER_SHA }).eligible).toBe(false);
    expect(evaluate({ ...eligibleLane, verdict: "PATCH" }, policy, liveCtx).eligible).toBe(false);
    expect(evaluate({ ...eligibleLane, state: "codex-working", next_actor: "auditor" }, policy, liveCtx).eligible).toBe(false);
    expect(evaluate({ ...eligibleLane, operator_pause: true }, policy, liveCtx).eligible).toBe(false);
    // Failing check run → ineligible.
    expect(evaluate(eligibleLane, policy, { ...liveCtx, checks: { ...passingChecks, check_runs_total: 2, check_run_conclusions: ["success", "failure"] } }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_head_sha: undefined }).eligible).toBe(false); // unknown head fails closed
  });

  it("fails closed on the check-status unknowns that used to fail open (B9)", () => {
    // Zero check runs was previously reported as passing by the workflow.
    expect(evaluate(eligibleLane, policy, { ...liveCtx, checks: { check_runs_total: 0, check_run_conclusions: [], commit_statuses_total: 0, commit_status_state: "pending" } }).eligible).toBe(false);
    // A failing legacy combined commit status is now visible and blocks.
    expect(evaluate(eligibleLane, policy, { ...liveCtx, checks: { check_runs_total: 3, check_run_conclusions: ["success", "success", "success"], commit_statuses_total: 1, commit_status_state: "failure" } }).eligible).toBe(false);
    // A pre-cooked boolean is no longer honored as evidence.
    expect(evaluate(eligibleLane, policy, { ...liveCtx, checks: undefined, required_checks_passed: true } as any).eligible).toBe(false);
    // Missing checks object fails closed.
    expect(evaluate(eligibleLane, policy, { ...liveCtx, checks: undefined }).eligible).toBe(false);
    // A passing legacy status with 0 check runs still fails (need >=1 run).
    expect(evaluate(eligibleLane, policy, { ...liveCtx, checks: { check_runs_total: 0, check_run_conclusions: [], commit_statuses_total: 2, commit_status_state: "success" } }).eligible).toBe(false);
    // An in-progress run (null conclusion, recorded as "null") is non-passing.
    expect(evaluate(eligibleLane, policy, { ...liveCtx, checks: { check_runs_total: 2, check_run_conclusions: ["success", "null"], commit_statuses_total: 0, commit_status_state: "pending" } }).eligible).toBe(false);
    // Legacy pre-cooked failing-count shape (no conclusion list) fails closed.
    expect(evaluate(eligibleLane, policy, { ...liveCtx, checks: { check_runs_total: 1, check_runs_failing: 0, commit_statuses_total: 0, commit_status_state: "pending" } as any }).eligible).toBe(false);
  });

  it("fails closed on a closed, draft, merged, or retargeted PR (R3)", () => {
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_state: "closed" }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_state: undefined }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_draft: true }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_draft: undefined }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_merged: true }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_merged: undefined }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_base_ref: "some-other-branch" }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...liveCtx, pr_base_ref: undefined }).eligible).toBe(false);
  });

  it("reports ineligible when the kill switch is off", () => {
    const out = evaluate(eligibleLane, makePolicy({ enabled: false }), liveCtx);
    expect(out.eligible).toBe(false);
    expect(out.reasons.join(" ")).toContain("kill switch");
  });

  it("PROOF the shadow merge guard cannot merge: no merge capability exists in the logic or workflow", () => {
    // 1. The pure module exposes only evaluate(); its result action is the
    //    constant "report-only" in every case.
    const results = [
      evaluate(eligibleLane, policy, { pr_head_sha: HEAD_SHA, checks: passingChecks }),
      evaluate(eligibleLane, policy, {}),
      evaluate(null, policy, {}),
      evaluate(eligibleLane, null, {}),
    ];
    for (const r of results) {
      expect(r.action).toBe("report-only");
      expect(r.shadow).toBe(true);
    }
    // 2. Neither the module, the CLI, nor the workflow contains a merge
    //    API invocation, and the workflow token cannot write contents.
    //    Merge invocations on GitHub take exactly these shapes:
    //      - REST:    PUT /repos/{o}/{r}/pulls/{n}/merge  (or /merges)
    //      - gh CLI:  gh pr merge
    //      - GraphQL: mergePullRequest mutation
    const MERGE_CALL = /gh pr merge|pulls\/[^\s"']*\/merge|\/merges\b|mergePullRequest|merge_method|mergeMethod/;
    // Scan the ENTIRE control plane, not just the merge-guard trio: every
    // pure module, every CLI adapter, and all four workflows.
    const allCpSources = [
      ".straylight/lib/state-machine.mjs",
      ".straylight/lib/markers.mjs",
      ".straylight/lib/validate.mjs",
      ".straylight/lib/reducer.mjs",
      ".straylight/lib/reconstruct.mjs",
      ".straylight/lib/watchdog.mjs",
      ".straylight/lib/merge-guard.mjs",
      ".straylight/bin/reduce-issue.mjs",
      ".straylight/bin/watchdog-scan.mjs",
      ".straylight/bin/merge-guard-check.mjs",
      ".straylight/bin/validate-protocol.mjs",
    ];
    const allCpWorkflows = [
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
      ".github/workflows/straylight-merge-guard.yml",
      ".github/workflows/straylight-bootstrap.yml",
    ];
    for (const f of allCpSources) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(MERGE_CALL);
      expect(src, f).not.toMatch(/fetch\(|https?:\/\/api\.github\.com/); // no network at all
    }
    for (const f of allCpWorkflows) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(MERGE_CALL);
    }
    // Merge-guard permissions block grants contents:read only.
    const wf = readFileSync(".github/workflows/straylight-merge-guard.yml", "utf8");
    expect(wf).toMatch(/^\s+contents: read$/m);
    expect(wf).not.toMatch(/^\s+contents:\s*write\s*$/m);
  });
});

describe("workflow permission ceiling (ADR-050 §7)", () => {
  it("no straylight workflow holds contents:write or uses pull_request_target or unpinned actions", () => {
    for (const f of [
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
      ".github/workflows/straylight-merge-guard.yml",
      ".github/workflows/straylight-bootstrap.yml",
    ]) {
      const src = readFileSync(f, "utf8");
      // YAML permission keys sit at line start; prose mentions don't count.
      expect(src, f).not.toMatch(/^\s+contents:\s*write\s*$/m);
      expect(src, f).toMatch(/^\s+contents: read$/m);
      expect(src, f).not.toMatch(/pull_request_target/);
      // every `uses:` is pinned to a 40-char SHA
      for (const line of src.split("\n").filter((l) => l.includes("uses:"))) {
        expect(line, `${f}: ${line}`).toMatch(/@[0-9a-f]{40}/);
      }
      // comment/issue bodies are never interpolated via github.event context
      // into run: blocks (script-injection guard).
      expect(src, f).not.toMatch(/\$\{\{\s*github\.event\.(comment|issue)\.(body|title)/);
    }
  });
});
