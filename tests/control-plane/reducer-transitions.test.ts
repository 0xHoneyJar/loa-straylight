// Control Plane v1 — reducer transition legality and fail-closed behavior.
// Covers: allowed transition, forbidden transition, stale sequence,
// wrong-lane event, unauthorized actor, unknown event, operator pause,
// kill switch, out-of-corridor escalation, patch-cycle maximum, idempotency.

import { describe, it, expect } from "vitest";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket,
  NOW, BASE_SHA, OTHER_SHA,
} from "./_fixtures.js";

const ctx = { now: NOW };

describe("allowed transitions", () => {
  it("advances planning → ready-for-coordinator on lane.activated", () => {
    const out = reduce(makeLane(), makeEvent(), makePolicy(), ctx);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-coordinator");
      expect(out.lane.next_actor).toBe("coordinator");
      expect(out.lane.event_sequence).toBe(1);
    }
  });

  it("advances ready-for-coordinator → ready-for-claude on a valid task packet", () => {
    const lane = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    const event = makeEvent({
      sequence: 2,
      event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 42 },
    });
    const out = reduce(lane, event, makePolicy(), { ...ctx, task_packet: makeTaskPacket() });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("ready-for-claude");
  });
});

describe("forbidden transitions and unknown events (fail closed)", () => {
  it("refuses a forbidden transition (implementer completing from planning)", () => {
    const event = makeEvent({
      actor_role: "implementer",
      github_actor: "claude-login",
      event_type: "implementer.completed",
      prior_state: "planning",
    });
    const out = reduce(makeLane(), event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("transition-forbidden");
  });

  it("refuses an unknown event type without advancing the lane", () => {
    const event = makeEvent({ event_type: "wizard.summoned" });
    const out = reduce(makeLane(), event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.refusal).toBe("transition-forbidden");
      expect(out.lane.state).toBe("planning");
      expect(out.lane.event_sequence).toBe(0);
    }
  });

  it("refuses a role emitting another role's event type (actor spoofing)", () => {
    // A coordinator-allowlisted identity claiming to complete an audit.
    const event = makeEvent({
      actor_role: "coordinator",
      github_actor: "chatgpt-login",
      event_type: "auditor.audit_completed",
      prior_state: "planning",
    });
    const out = reduce(makeLane(), event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
  });

  it("never escapes terminal states", () => {
    const lane = makeLane({ state: "merged", next_actor: "none", event_sequence: 9 });
    const event = makeEvent({ sequence: 10, prior_state: "merged" });
    const out = reduce(lane, event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lane-terminal");
  });
});

describe("sequencing and lane binding", () => {
  it("refuses stale sequence numbers", () => {
    const lane = makeLane({ event_sequence: 5, state: "ready-for-coordinator" });
    const replayed = makeEvent({ sequence: 3, prior_state: "ready-for-coordinator", event_type: "coordinator.escalated" });
    const out = reduce(lane, replayed, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("stale-sequence");
  });

  it("refuses skipped-ahead sequence numbers", () => {
    const lane = makeLane({ event_sequence: 1, state: "ready-for-coordinator" });
    const skipped = makeEvent({ sequence: 5, prior_state: "ready-for-coordinator", event_type: "coordinator.escalated" });
    expect(reduce(lane, skipped, makePolicy(), ctx).ok).toBe(false);
  });

  it("is idempotent: replaying an applied event is refused as stale", () => {
    const lane = makeLane();
    const event = makeEvent();
    const first = reduce(lane, event, makePolicy(), ctx);
    expect(first.ok).toBe(true);
    if (first.ok) {
      const replay = reduce(first.lane, event, makePolicy(), ctx);
      expect(replay.ok).toBe(false);
      if (!replay.ok) expect(replay.refusal).toBe("stale-sequence");
      expect(replay.ok === false && replay.lane).toEqual(first.lane);
    }
  });

  it("refuses events addressed to another lane", () => {
    const event = makeEvent({ lane_id: "lane-phase-49q" });
    const out = reduce(makeLane(), event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("wrong-lane");
  });

  it("refuses events whose prior_state disagrees with the lane", () => {
    const event = makeEvent({ prior_state: "ready-for-merge" });
    const out = reduce(makeLane(), event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("prior-state-mismatch");
  });
});

describe("identity, corridor, pause, kill switch", () => {
  it("refuses an unauthorized GitHub actor for the claimed role", () => {
    const event = makeEvent({ github_actor: "some-stranger" });
    const out = reduce(makeLane(), event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("actor-not-allowlisted");
  });

  it("refuses a correct login claiming a role it is not allowlisted for", () => {
    const event = makeEvent({ actor_role: "operator", github_actor: "chatgpt-login" });
    const out = reduce(makeLane(), event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("actor-not-allowlisted");
  });

  it("refuses the CI bot claiming the operator role (system-only identity)", () => {
    const lane = makeLane({ state: "operator-required", event_sequence: 5, operator_required_reason: "x" });
    const event = makeEvent({
      sequence: 6, actor_role: "operator", github_actor: "github-actions[bot]",
      event_type: "operator.decision", prior_state: "operator-required",
      requested_state: "ready-for-claude",
    });
    const out = reduce(lane, event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("actor-not-allowlisted");
  });

  it("rejects any policy that puts a bot identity in the operator role", () => {
    const policy = makePolicy({
      actor_allowlist: {
        coordinator: ["chatgpt-login"], implementer: ["claude-login"],
        auditor: ["codex-login"], operator: ["eileen1337", "github-actions[bot]"],
        system: ["github-actions[bot]"],
      },
    });
    const out = reduce(makeLane(), makeEvent(), policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("policy-invalid");
  });

  it("escalates a lane whose phase left the policy corridor (out-of-mandate)", () => {
    const policy = makePolicy({ authorized_corridor: ["phase-49q"] });
    const out = reduce(makeLane(), makeEvent(), policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.refusal).toBe("outside-corridor");
      expect(out.escalate).toBe(true);
    }
  });

  it("kill switch: policy.enabled=false refuses every event", () => {
    const out = reduce(makeLane(), makeEvent(), makePolicy({ enabled: false }), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("automation-disabled");
  });

  it("operator pause freezes the lane for non-operator events", () => {
    const lane = makeLane({ operator_pause: true });
    const out = reduce(lane, makeEvent(), makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lane-paused");
  });

  it("operator can pause, resume, and decide while paused", () => {
    const policy = makePolicy();
    const lane = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    const pause = reduce(lane, makeEvent({
      sequence: 2, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.paused", prior_state: "ready-for-coordinator",
    }), policy, ctx);
    expect(pause.ok).toBe(true);
    if (!pause.ok) return;
    expect(pause.lane.operator_pause).toBe(true);
    expect(pause.lane.state).toBe("ready-for-coordinator");
    const resume = reduce(pause.lane, makeEvent({
      sequence: 3, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.resumed", prior_state: "ready-for-coordinator",
    }), policy, ctx);
    expect(resume.ok).toBe(true);
    if (resume.ok) expect(resume.lane.operator_pause).toBe(false);
  });

  it("malformed policy fails closed", () => {
    const out = reduce(makeLane(), makeEvent(), { schema: "wrong" }, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("policy-invalid");
  });

  it("malformed lane fails closed", () => {
    const out = reduce({ schema: "straylight.lane.v1" }, makeEvent(), makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lane-invalid");
  });
});

describe("task packets", () => {
  it("refuses a task packet bound to the wrong base SHA (stale packet)", () => {
    const lane = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    const event = makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 42 },
    });
    const out = reduce(lane, event, makePolicy(), { ...ctx, task_packet: makeTaskPacket({ base_sha: OTHER_SHA }) });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("task-packet-stale-base");
  });

  it("refuses a packet with merge_forbidden=false (no packet can authorize merge)", () => {
    const lane = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    const event = makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
    });
    const out = reduce(lane, event, makePolicy(), { ...ctx, task_packet: makeTaskPacket({ merge_forbidden: false }) });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("task-packet-invalid");
  });

  it("refuses Claude starting without any task packet", () => {
    const lane = makeLane({ state: "ready-for-claude", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: "2026-07-16T16:00:00Z",
    });
    const out = reduce(lane, event, makePolicy(), ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("no-valid-task-packet");
  });
});

describe("patch-cycle maximum escalation", () => {
  it("routes to operator-required past maximum_patch_cycles", () => {
    const lane = makeLane({ state: "patch-required", event_sequence: 10, patch_cycle: 3, verdict: "PATCH" });
    const event = makeEvent({
      sequence: 11, event_type: "coordinator.patch_packet_posted",
      prior_state: "patch-required", refs: { task_packet_comment_id: 99 },
    });
    const out = reduce(lane, event, makePolicy({ maximum_patch_cycles: 3 }), {
      ...ctx, task_packet: makeTaskPacket({ packet_kind: "patch", patch_cycle: 4 }),
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("operator-required");
      expect(out.lane.operator_required_reason).toContain("patch cycle");
    }
  });

  it("permits patch cycles inside the budget", () => {
    const lane = makeLane({ state: "patch-required", event_sequence: 10, patch_cycle: 1, verdict: "PATCH" });
    const event = makeEvent({
      sequence: 11, event_type: "coordinator.patch_packet_posted",
      prior_state: "patch-required", refs: { task_packet_comment_id: 99 },
    });
    const out = reduce(lane, event, makePolicy(), {
      ...ctx, task_packet: makeTaskPacket({ packet_kind: "patch", patch_cycle: 2 }),
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-claude");
      expect(out.lane.patch_cycle).toBe(2);
    }
  });
});
