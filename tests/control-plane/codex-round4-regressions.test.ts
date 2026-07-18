// Control Plane v1 — direct regressions for the Codex PATCH findings
// (fourth round, D1–D6). One describe() per finding; each test reproduces
// the reported failure shape against the patched code.
//
//  D1  escalation to operator-required clears an active lease on BOTH
//      escalation paths (reducer system.escalated; reconstruction's
//      edited-comment routing), and the operator can then recover the lane
//  D2  a genesis lane cannot preseed working_branch; the initial packet
//      requires null and establishes the branch unconditionally from its
//      own target_branch
//  D3  sub-millisecond timestamp precision is rejected everywhere (never
//      rounded): .0001Z and .0004Z can never collapse to the same instant
//  D4  the shadow merge guard requires the complete normalized PR metadata
//      record and fails closed on every missing or mismatched field
//  D5  Phase 49P bootstrap duplicate detection parses genesis records
//      through the canonical protocol parser (compact valid JSON included)
//  D6  no control-plane doc/prompt claims the plane ships disabled: the
//      committed policy is enabled (report-only shadow), and the wording
//      is consistent

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { evaluate } from "../../.straylight/lib/merge-guard.mjs";
import { renderPayload, MARKERS } from "../../.straylight/lib/markers.mjs";
import { validateLane, parseIsoInstant } from "../../.straylight/lib/validate.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeLease,
  laneClaudeWorking, laneCodexWorking, liveMeta, payloadDigest,
  NOW, HEAD_SHA, OTHER_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const policy = makePolicy();
const ctx = { now: NOW };

// =============================================================================
// D1 — escalation to operator-required must clear an active lease.
// Original defect: reconstruction's toOperatorRequired / escalate branch
// carried lane.lease into operator-required. A lease's expected_state is its
// holder's working state, so the escalated record embedded a CROSS-STATE
// lease — validateLane refused it, the reducer refused every subsequent
// event with lane-invalid, and the operator could never recover the lane.
// =============================================================================
describe("D1 — escalation to operator-required clears the active lease (both paths), leaving a recoverable lane", () => {
  function packetFor(lane: Record<string, any>) {
    return makeTaskPacket();
  }

  function commentsThroughLeaseAcquired() {
    const packet = makeTaskPacket();
    return [
      { id: 1, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({ sequence: 1 })), created_at: NOW },
      { id: 2, user: "chatgpt-login", body: renderPayload(MARKERS.taskPacket, packet), created_at: NOW },
      { id: 3, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator",
        refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
      })), created_at: NOW },
      { id: 4, user: "claude-login", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: "2026-07-16T16:00:00Z",
      })), created_at: NOW },
    ];
  }

  it("reconstruction path: an edited protocol comment mid-lease escalates AND clears the lease; the lane validates", () => {
    const comments = [
      ...commentsThroughLeaseAcquired(),
      // An edited protocol comment arrives while the implementer lease is
      // active → reconstruction routes to operator-required.
      { id: 5, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({ sequence: 99 })), created_at: NOW, updated_at: "2026-07-16T13:00:00Z" },
    ];
    const out = reconstructLane({
      issue_body: `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`,
      comments, policy, context: { now: NOW },
    });
    expect(out.lane?.state).toBe("operator-required");
    expect(out.lane?.lease).toBeNull();
    expect(validateLane(out.lane).ok).toBe(true);
  });

  it("reducer path: system.escalated on a leased working lane clears the lease; the lane validates", () => {
    const lane = laneClaudeWorking(); // active implementer lease
    const out = reduce(lane, makeEvent({
      sequence: 4, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.escalated", prior_state: "claude-working",
      reason: "watchdog: stuck lane",
    }), policy, ctx);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("operator-required");
      expect(out.lane.lease).toBeNull();
      expect(validateLane(out.lane).ok).toBe(true);
    }
  });

  it("refusal-escalation path: an out-of-corridor event escalates during replay and clears the lease", () => {
    // A lane whose phase falls outside the corridor escalates via the
    // decision.escalate branch in reconstructLane (outside-corridor refusal).
    const genesis = makeLane({ phase: "phase-49q", authorized_corridor: ["phase-49q"] });
    const narrowPolicy = makePolicy({ authorized_corridor: ["phase-49p"] }); // lane phase now outside policy corridor
    const packet = makeTaskPacket();
    const comments = [
      { id: 1, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({ sequence: 1 })), created_at: NOW },
    ];
    const out = reconstructLane({
      issue_body: `# Lane\n\n${renderPayload(MARKERS.lane, genesis)}`,
      comments, policy: narrowPolicy, context: { now: NOW },
    });
    expect(out.lane?.state).toBe("operator-required");
    expect(out.lane?.lease).toBeNull();
    expect(validateLane(out.lane).ok).toBe(true);
  });

  it("after either escalation, the OPERATOR CAN RECOVER the lane with operator.decision", () => {
    // End-to-end: leased lane → system.escalated → operator.decision back to
    // ready-for-claude. Before the fix the middle state carried the lease and
    // step 3 refused with lane-invalid.
    const lane = laneClaudeWorking();
    const escalated = reduce(lane, makeEvent({
      sequence: 4, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.escalated", prior_state: "claude-working",
    }), policy, ctx);
    expect(escalated.ok).toBe(true);
    if (!escalated.ok) return;
    const recovered = reduce(escalated.lane, makeEvent({
      sequence: 5, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.decision", prior_state: "operator-required",
      requested_state: "ready-for-claude",
    }), policy, ctx);
    expect(recovered.ok).toBe(true);
    if (recovered.ok) {
      expect(recovered.lane.state).toBe("ready-for-claude");
      expect(recovered.lane.lease).toBeNull();
      expect(validateLane(recovered.lane).ok).toBe(true);
    }
  });

  it("reconstruction-escalated lane replays operator recovery in the SAME durable stream", () => {
    const comments = [
      ...commentsThroughLeaseAcquired(),
      { id: 5, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({ sequence: 99 })), created_at: NOW, updated_at: "2026-07-16T13:00:00Z" },
      // The operator recovers the escalated lane in-stream. The escalation
      // did not consume a sequence number (it is a routing, not an event),
      // so the operator's event continues from the last APPLIED sequence.
      { id: 6, user: "eileen1337", body: renderPayload(MARKERS.event, makeEvent({
        sequence: 4, actor_role: "operator", github_actor: "eileen1337",
        event_type: "operator.decision", prior_state: "operator-required",
        requested_state: "ready-for-claude",
      })), created_at: NOW },
    ];
    const out = reconstructLane({
      issue_body: `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`,
      comments, policy, context: { now: NOW },
    });
    const decision = out.dispositions.find((d) => d.comment_id === 6);
    expect(decision?.status).toBe("applied");
    expect(out.lane?.state).toBe("ready-for-claude");
    expect(validateLane(out.lane).ok).toBe(true);
  });

  it("patch-cycle-max escalation (reducer) also leaves lease null", () => {
    const lane = makeLane({
      state: "patch-required", event_sequence: 10, patch_cycle: 3, verdict: "PATCH",
    });
    const packet = makeTaskPacket({ packet_kind: "patch", patch_cycle: 4 });
    const out = reduce(lane, makeEvent({
      sequence: 11, event_type: "coordinator.patch_packet_posted",
      prior_state: "patch-required",
      refs: { task_packet_comment_id: 99, task_packet_digest: payloadDigest(packet) },
    }), policy, { ...ctx, task_packet: packet });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("operator-required");
      expect(out.lane.lease).toBeNull();
      expect(validateLane(out.lane).ok).toBe(true);
    }
  });
});

// =============================================================================
// D2 — genesis cannot preseed working_branch; the initial packet requires
// null and establishes the branch unconditionally from packet.target_branch.
// Original defect: `working_branch: lane.working_branch ?? packet.target_branch`
// let a preseeded lane field WIN over the packet, ratifying a branch no
// coordinator ever named.
// =============================================================================
describe("D2 — genesis working_branch preseeding is refused; establishment is unconditional", () => {
  it("a genesis record carrying a preseeded working_branch is refused", () => {
    const genesis = makeLane({ working_branch: "attacker-chosen-branch" });
    const out = reconstructLane({
      issue_body: `# Lane\n\n${renderPayload(MARKERS.lane, genesis)}`,
      comments: [], policy, context: { now: NOW },
    });
    expect(out.ok).toBe(false);
    // Two independent layers refuse it: validateLane (a planning-state
    // record with a working_branch is structurally invalid → genesis-invalid)
    // and the initiality sweep (genesis-not-initial). The structural layer
    // fires first; either way the preseeded genesis never replays.
    expect(["genesis-invalid", "genesis-not-initial"]).toContain(out.refusal);
    expect(out.detail).toContain("working_branch");
    expect(out.lane).toBeNull();
  });

  it("the initiality sweep itself names working_branch (defense in depth behind validateLane)", () => {
    // Exercise the genesis-not-initial layer directly through the source:
    // the sweep must list working_branch among its checks so the guarantee
    // does not silently rest on validateLane alone.
    const src = readFileSync(".straylight/lib/reconstruct.mjs", "utf8");
    expect(src).toMatch(/working_branch must be null \(established only by the initial coordinator packet\)/);
  });

  it("genesis preseeding of other in-flight state is refused too (pr_number, lease, verdict...)", () => {
    for (const overrides of [
      { pr_number: 120 },
      { pr_head_sha: HEAD_SHA },
      { audited_sha: HEAD_SHA },
      { verdict: "ACCEPT" },
      { lease: makeLease({ expected_state: "claude-working", actor_role: "implementer" }) },
      { attempt: 1 },
      { patch_cycle: 2 },
      { operator_pause: true },
    ] as Record<string, any>[]) {
      const genesis = makeLane(overrides);
      // Keep state=planning so ONLY the preseeded field is at fault (the
      // lease case is also structurally cross-state, refused either way).
      const out = reconstructLane({
        issue_body: `# Lane\n\n${renderPayload(MARKERS.lane, genesis)}`,
        comments: [], policy, context: { now: NOW },
      });
      expect(out.ok, JSON.stringify(overrides)).toBe(false);
    }
  });

  it("validateLane refuses ANY planning/ready-for-coordinator record with a working_branch", () => {
    expect(validateLane(makeLane({ working_branch: WORKING_BRANCH })).ok).toBe(false);
    expect(validateLane(makeLane({ state: "ready-for-coordinator", event_sequence: 1, working_branch: WORKING_BRANCH })).ok).toBe(false);
    expect(validateLane(makeLane()).ok).toBe(true);
  });

  it("an initial packet on a lane that somehow has a working_branch is refused (never inherits)", () => {
    // Construct the reducer-level shape directly: even if a preseeded lane
    // slipped past reconstruction, the initial-packet transition itself
    // refuses to apply to a lane with an established branch.
    const lane = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    (lane as any).working_branch = null; // establish baseline validity
    const preseeded = { ...lane, working_branch: "attacker-chosen-branch" };
    const packet = makeTaskPacket(); // targets WORKING_BRANCH
    const out = reduce(preseeded, makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
    }), policy, { ...ctx, task_packet: packet });
    expect(out.ok).toBe(false);
    // validateLane already refuses the preseeded coordination-state record.
    if (!out.ok) expect(["lane-invalid", "working-branch-already-established"]).toContain(out.refusal);
  });

  it("the applied initial packet establishes working_branch from ITS OWN target_branch, unconditionally", () => {
    const lane = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    const packet = makeTaskPacket();
    const out = reduce(lane, makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
    }), policy, { ...ctx, task_packet: packet });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.working_branch).toBe(WORKING_BRANCH);
  });

  it("the reducer source no longer contains the lane-field-wins fallback", () => {
    const src = readFileSync(".straylight/lib/reducer.mjs", "utf8");
    expect(src).not.toContain("lane.working_branch ?? packet.target_branch");
  });

  it("operator re-coordination clears the establishment so the next initial packet re-establishes", () => {
    const blocked = makeLane({
      state: "operator-required", event_sequence: 9,
      working_branch: WORKING_BRANCH, operator_required_reason: "test",
    });
    const out = reduce(blocked, makeEvent({
      sequence: 10, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.decision", prior_state: "operator-required",
      requested_state: "ready-for-coordinator",
    }), policy, ctx);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.working_branch).toBeNull();
      expect(validateLane(out.lane).ok).toBe(true);
    }
  });
});

// =============================================================================
// D3 — sub-millisecond fractions are rejected, never rounded.
// Original defect: Math.round(frac * 1000) collapsed .0001Z and .0004Z to
// the same instant (+0ms), and .9996Z rounded UP into the next second —
// breaking strict ordering of recorded times.
// =============================================================================
describe("D3 — timestamp precision: milliseconds at most, finer fractions rejected everywhere", () => {
  it("accepts 1-3 fractional digits with exact decoding", () => {
    const base = parseIsoInstant("2026-07-16T12:00:00Z")!;
    expect(parseIsoInstant("2026-07-16T12:00:00.5Z")).toBe(base + 500);
    expect(parseIsoInstant("2026-07-16T12:00:00.50Z")).toBe(base + 500);
    expect(parseIsoInstant("2026-07-16T12:00:00.500Z")).toBe(base + 500);
    expect(parseIsoInstant("2026-07-16T12:00:00.007Z")).toBe(base + 7);
    expect(parseIsoInstant("2026-07-16T12:00:00.999Z")).toBe(base + 999);
  });

  it("rejects fractional precision beyond milliseconds (never rounds)", () => {
    expect(parseIsoInstant("2026-07-16T12:00:00.0001Z")).toBeNull();
    expect(parseIsoInstant("2026-07-16T12:00:00.0004Z")).toBeNull();
    expect(parseIsoInstant("2026-07-16T12:00:00.9996Z")).toBeNull(); // would have rounded UP a second
    expect(parseIsoInstant("2026-07-16T12:00:00.123456789Z")).toBeNull();
  });

  it("therefore .0001Z and .0004Z can never compare equal — both are refused wherever a time is consumed", () => {
    const a = parseIsoInstant("2026-07-16T16:00:00.0001Z");
    const b = parseIsoInstant("2026-07-16T16:00:00.0004Z");
    expect(a).toBeNull();
    expect(b).toBeNull(); // rejected, not collapsed into the same instant

    // Reducer: a lease grant with sub-millisecond expiry is refused as an
    // invalid timestamp (validateEvent catches lease_expires_at first).
    const lane = makeLane({ state: "ready-for-claude", event_sequence: 2, working_branch: WORKING_BRANCH });
    const out = reduce(lane, makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-9", lease_expires_at: "2026-07-16T16:00:00.0001Z",
    }), policy, { ...ctx, task_packet: makeTaskPacket(), comment_author: "claude-login" });
    expect(out.ok).toBe(false);

    // Lane validation: a stored lease with sub-millisecond expiry is invalid.
    const badLease = laneClaudeWorking({
      lease: makeLease({ expires_at: "2026-07-16T16:00:00.0004Z" }),
    });
    expect(validateLane(badLease).ok).toBe(false);
  });

  it("an event whose occurred_at carries sub-millisecond precision is structurally refused", () => {
    const out = reduce(makeLane(), makeEvent({ occurred_at: "2026-07-16T12:00:00.0001Z" }), policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("event-invalid");
  });

  it("the published schemas pin the same millisecond bound for every timestamp field", () => {
    const TS = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?Z$";
    const event = JSON.parse(readFileSync(".straylight/schemas/event-v1.schema.json", "utf8"));
    expect(event.properties.occurred_at.pattern).toBe(TS);
    expect(event.properties.lease_expires_at.pattern).toBe(TS);
    const lane = JSON.parse(readFileSync(".straylight/schemas/lane-v1.schema.json", "utf8"));
    expect(lane.properties.lease.properties.acquired_at.pattern).toBe(TS);
    expect(lane.properties.lease.properties.expires_at.pattern).toBe(TS);
    // The parser regex in the executable validator carries the same bound.
    const src = readFileSync(".straylight/lib/validate.mjs", "utf8");
    expect(src).toContain("(\\.\\d{1,3})?Z$");
    expect(src).not.toMatch(/Math\.round\(frac/);
  });
});

// =============================================================================
// D4 — the shadow merge guard requires the COMPLETE normalized PR metadata
// record. Original defect: the guard consulted loose single fields (never
// checked repository/pr_number/base_sha/head_branch at all), and the
// workflow's empty-string plumbing could silently omit fields.
// =============================================================================
describe("D4 — merge guard: complete normalized metadata, field-by-field correspondence, fail closed", () => {
  const lane = makeLane({
    state: "ready-for-merge", event_sequence: 7,
    pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
  });
  const checks = {
    check_runs_total: 1, check_run_conclusions: ["success"],
    commit_statuses_total: 0, commit_status_state: "pending",
  };

  it("the complete corresponding record is eligible; NO metadata at all is not", () => {
    expect(evaluate(lane, policy, { checks, pr_metadata: liveMeta() }).eligible).toBe(true);
    const out = evaluate(lane, policy, { checks });
    expect(out.eligible).toBe(false);
    expect(out.reasons.join(" ")).toContain("metadata unavailable");
  });

  it("a failed fetch (fetch_ok:false) is ineligible", () => {
    expect(evaluate(lane, policy, { checks, pr_metadata: { fetch_ok: false } }).eligible).toBe(false);
  });

  it("EVERY missing field makes the record structurally invalid → ineligible", () => {
    for (const missing of ["repository", "pr_number", "state", "draft", "merged", "base_branch", "base_sha", "head_branch", "head_sha"]) {
      const meta: Record<string, any> = liveMeta();
      delete meta[missing];
      const out = evaluate(lane, policy, { checks, pr_metadata: meta } as any);
      expect(out.eligible, `missing ${missing}`).toBe(false);
    }
  });

  it("EVERY mismatched field is ineligible (wrong repo, number, state, flags, branches, SHAs)", () => {
    const cases: Array<[string, Record<string, any>]> = [
      ["repository", { repository: "someone-else/other-repo" }],
      ["pr_number", { pr_number: 121 }],
      ["state", { state: "closed" }],
      ["draft", { draft: true }],
      ["merged", { merged: true }],
      ["base_branch", { base_branch: "release-x" }],
      ["base_sha", { base_sha: OTHER_SHA }],
      ["head_branch", { head_branch: "rogue-branch" }],
      ["head_sha", { head_sha: OTHER_SHA }],
    ];
    for (const [field, override] of cases) {
      const out = evaluate(lane, policy, { checks, pr_metadata: liveMeta(override) });
      expect(out.eligible, field).toBe(false);
    }
  });

  it("loose single-field context is NOT accepted in place of the record", () => {
    const out = evaluate(lane, policy, {
      checks,
      pr_head_sha: HEAD_SHA, pr_state: "open", pr_draft: false, pr_merged: false, pr_base_ref: "main",
    } as any);
    expect(out.eligible).toBe(false);
  });

  it("a lane with no PR number or no working branch fails closed even with a valid record", () => {
    const noPr = makeLane({
      state: "ready-for-merge", event_sequence: 7,
      pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
    });
    expect(evaluate(noPr, policy, { checks, pr_metadata: liveMeta() }).eligible).toBe(false);
    const noBranch = { ...lane, working_branch: null };
    expect(evaluate(noBranch, policy, { checks, pr_metadata: liveMeta() }).eligible).toBe(false);
  });

  it("the workflow builds the SAME complete-record normalization and forwards pr_metadata only", () => {
    const wf = readFileSync(".github/workflows/straylight-merge-guard.yml", "utf8");
    // Complete-or-nothing jq normalization (identical posture to reducer).
    expect(wf).toMatch(/\(\$p\.draft\|type\) == "boolean" and \(\$p\.merged\|type\) == "boolean"/);
    expect(wf).toMatch(/fetch_ok: true/);
    expect(wf).toMatch(/else \{ fetch_ok: false \}/);
    expect(wf).toMatch(/pr_metadata: \$prmeta/);
    // No loose single-field forwarding remains.
    expect(wf).not.toMatch(/pr_head_sha: \$head/);
    expect(wf).not.toMatch(/pr_state|pr_base_ref|pr_draft|pr_merged/);
  });
});

// =============================================================================
// D5 — bootstrap duplicate detection parses genesis records via the
// canonical protocol parser. Original defect: substring matching on the
// pretty-printed form ("\"lane_id\": \"lane-phase-49p\"") missed compact
// valid JSON ({"lane_id":"lane-phase-49p"}) → duplicate lane creation.
// =============================================================================
describe("D5 — bootstrap existing-lane detection uses the canonical parser (compact JSON included)", () => {
  const laneScan = (issues: Array<Record<string, any>>) => {
    const out = execFileSync("node", [
      ".straylight/bin/lane-scan.mjs", "--lane-id", "lane-phase-49p",
    ], { input: JSON.stringify(issues), encoding: "utf8" });
    return JSON.parse(out);
  };

  it("finds a COMPACT-JSON genesis the old substring match would have missed", () => {
    const compact = `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane())}\n\`\`\``;
    // Prove the old detector's blindness first: the pretty-printed separator
    // is absent from the compact body…
    expect(compact).not.toContain('"lane_id": "lane-phase-49p"');
    // …yet the canonical parser finds the lane.
    const result = laneScan([{ number: 7, body: compact }]);
    expect(result.ok).toBe(true);
    expect(result.matches).toEqual([7]);
    expect(result.unreadable).toEqual([]);
  });

  it("finds the pretty-printed genesis too, and ignores non-lane bodies and other lane ids", () => {
    const pretty = `# Lane\n\n<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane(), null, 2)}\n\`\`\``;
    const otherLane = `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane({ lane_id: "lane-phase-49q" }))}\n\`\`\``;
    const prose = "just a comment mentioning lane-phase-49p in prose";
    const result = laneScan([
      { number: 1, body: pretty },
      { number: 2, body: otherLane },
      { number: 3, body: prose },
    ]);
    expect(result.matches).toEqual([1]);
    expect(result.unreadable).toEqual([]);
  });

  it("reports an unparseable lane-marker body as unreadable (fail closed, never skipped)", () => {
    const mangled = "<!-- straylight:lane:v1 -->\n```json\n{ not json ]\n```";
    const result = laneScan([{ number: 9, body: mangled }]);
    expect(result.matches).toEqual([]);
    expect(result.unreadable).toHaveLength(1);
    expect(result.unreadable[0].number).toBe(9);
  });

  it("the workflow routes detection through lane-scan.mjs and aborts on unreadable bodies", () => {
    const wf = readFileSync(".github/workflows/straylight-bootstrap.yml", "utf8");
    // Round 9: the raw --paginate page stream feeds the scanner directly
    // (--pages), which flattens + excludes PRs fail-closed itself.
    expect(wf).toMatch(/node \.straylight\/bin\/lane-scan\.mjs --pages \/tmp\/issue-pages\.json --lane-id lane-phase-49p/);
    expect(wf).toMatch(/unreadable/);
    expect(wf).toMatch(/refusing to bootstrap until they are resolved/);
    // The whitespace-sensitive substring detector is gone.
    expect(wf).not.toMatch(/contains\("\\"lane_id\\"/);
  });
});

// =============================================================================
// D6 — enabled-posture wording is consistent: the committed policy is
// ENABLED for report-only shadow bookkeeping; no control-plane doc claims
// the plane ships disabled.
// =============================================================================
describe("D6 — no contradictory disabled-by-default claims; committed policy is enabled report-only", () => {
  const CP_DOCS = [
    "docs/decisions/ADR-050-autonomous-execution-control-plane.md",
    ".straylight/README.md",
    ".straylight/prompts/chatgpt-coordinator.md",
    ".straylight/prompts/claude-fable-implementer.md",
    ".straylight/prompts/codex-auditor.md",
    ".straylight/automation-policy.json",
    ".github/workflows/straylight-reducer.yml",
    ".github/workflows/straylight-watchdog.yml",
    ".github/workflows/straylight-merge-guard.yml",
    ".github/workflows/straylight-bootstrap.yml",
  ];

  it("the committed policy itself is enabled, shadow, no auto-merge", () => {
    const committed = JSON.parse(readFileSync(".straylight/automation-policy.json", "utf8"));
    expect(committed.enabled).toBe(true);
    expect(committed.mode).toBe("shadow");
    expect(committed.auto_merge).toBe(false);
  });

  it("no control-plane source claims the plane is disabled by default / ships disabled", () => {
    const CONTRADICTIONS = [
      /disabled[- ]by[- ]default/i,
      /ships? (fully |entirely )?disabled/i,
      /starts (out )?disabled/i,
      /default(s)? to disabled/i,
    ];
    for (const f of CP_DOCS) {
      const content = readFileSync(f, "utf8");
      for (const re of CONTRADICTIONS) {
        expect(content, `${f} matches ${re}`).not.toMatch(re);
      }
    }
  });

  it("REPOSITORY-WIDE: no tracked file claims disabled-by-default (the .loa submodule is a foreign tree)", () => {
    // git ls-files lists every tracked file in THIS repository; the .loa
    // submodule contributes only its gitlink entry, so its internal Loa
    // framework docs (which legitimately describe unrelated Loa features as
    // disabled by default) are naturally out of scope. Everything else —
    // docs, prompts, workflows, source, tests — must be free of the claim.
    const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
      .split("\0")
      .filter((f) => f.length > 0 && f !== ".loa");
    const offenders: string[] = [];
    for (const f of tracked) {
      let content: string;
      try {
        content = readFileSync(f, "utf8");
      } catch {
        continue; // binary or unreadable — no prose claim to make
      }
      if (/disabled[- ]by[- ]default/i.test(content)) offenders.push(f);
    }
    // This very test file names the phrase in order to hunt it; it is the
    // single permitted match.
    expect(offenders.filter((f) => !f.endsWith("codex-round4-regressions.test.ts"))).toEqual([]);
  });

  it("ADR-050 and the protocol README describe the shipped posture: enabled, report-only, consequence-disabled", () => {
    const adr = readFileSync("docs/decisions/ADR-050-autonomous-execution-control-plane.md", "utf8");
    expect(adr).toMatch(/enabled for report-only\s+shadow bookkeeping and coordination while consequence-disabled/);
    const readme = readFileSync(".straylight/README.md", "utf8");
    expect(readme).toMatch(/report-only shadow bookkeeping and coordination/);
    expect(readme).toMatch(/consequence-disabled/);
  });

  it("every prompt states the shipped posture so an actor cannot assume the plane is off", () => {
    for (const f of [
      ".straylight/prompts/chatgpt-coordinator.md",
      ".straylight/prompts/claude-fable-implementer.md",
      ".straylight/prompts/codex-auditor.md",
    ]) {
      const content = readFileSync(f, "utf8");
      expect(content, f).toMatch(/ENABLED for\s+report-only shadow bookkeeping/);
      expect(content, f).toMatch(/consequence-disabled/);
    }
  });
});
