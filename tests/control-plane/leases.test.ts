// Control Plane v1 — lease discipline.
// Covers: lease acquisition, duplicate lease rejection, lease expiry
// recovery, completion without lease rejection, completion after expiry,
// release by another role, stale lease not mutating state.

import { describe, it, expect } from "vitest";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeLease,
  laneClaudeWorking, laneCodexWorking,
  NOW, AFTER_EXPIRY, LEASE_EXPIRY, HEAD_SHA,
} from "./_fixtures.js";

const policy = makePolicy();
const ctx = { now: NOW };

describe("lease acquisition", () => {
  it("grants an implementer lease with a valid task packet", () => {
    const lane = makeLane({ state: "ready-for-claude", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
    });
    const out = reduce(lane, event, policy, { ...ctx, task_packet: makeTaskPacket() });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("claude-working");
      expect(out.lane.lease?.lease_id).toBe("lease-claude-1");
      expect(out.lane.lease?.actor_role).toBe("implementer");
      expect(out.lane.attempt).toBe(1);
    }
  });

  it("rejects a second active lease for the same work role (duplicate lease)", () => {
    const lane = laneClaudeWorking();
    // Even a hypothetical re-grant from ready-for-claude is impossible while
    // in claude-working, but simulate the reconstruction race: lane still
    // holds an unexpired lease.
    const event = makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "claude-working",
      lease_id: "lease-claude-2", lease_expires_at: LEASE_EXPIRY,
    });
    const out = reduce(lane, event, policy, { ...ctx, task_packet: makeTaskPacket() });
    expect(out.ok).toBe(false); // transition-forbidden from claude-working
  });

  it("rejects an auditor lease while an unexpired lease exists after requeue", () => {
    // lease survived in lane state (reconstruction edge): ready-for-codex
    // but stale lease object still present and unexpired.
    const lane = makeLane({
      state: "ready-for-codex", event_sequence: 4, pr_number: 120, pr_head_sha: HEAD_SHA,
      lease: makeLease({ actor_role: "auditor", lease_id: "lease-codex-0", expected_state: "codex-working" }),
    });
    const event = makeEvent({
      sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-already-held");
  });
});

describe("completion discipline", () => {
  it("rejects completion without any lease", () => {
    const lane = laneClaudeWorking({ lease: null });
    const event = makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      head_sha: HEAD_SHA, refs: { pr_number: 120 },
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("no-active-lease");
  });

  it("rejects completion carrying the wrong lease id", () => {
    const lane = laneClaudeWorking();
    const event = makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-forged", head_sha: HEAD_SHA, refs: { pr_number: 120 },
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-id-mismatch");
  });

  it("rejects completion after lease expiry (no late-result path in v1)", () => {
    const lane = laneClaudeWorking();
    const event = makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
      occurred_at: AFTER_EXPIRY,
    });
    const out = reduce(lane, event, policy, { now: AFTER_EXPIRY, event_observed_at: AFTER_EXPIRY });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-expired");
  });

  it("rejects lease release by another role", () => {
    const lane = laneClaudeWorking(); // implementer lease
    const event = makeEvent({
      sequence: 4, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_released", prior_state: "claude-working",
      lease_id: "lease-claude-1",
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(false); // transition-forbidden: auditor release only legal from codex-working
  });

  it("rejects cross-role release at the LEASE guard when the transition itself is legal", () => {
    // codex-working with an implementer-held lease (corrupted/rare state):
    // auditor.lease_released IS legal from codex-working, so the transition
    // table passes and the lease guard itself must catch the role mismatch.
    const lane = laneCodexWorking({
      lease: makeLease({ actor_role: "implementer", lease_id: "lease-claude-9", expected_state: "claude-working" }),
    });
    const event = makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_released", prior_state: "codex-working",
      lease_id: "lease-claude-9",
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-role-mismatch");
  });

  it("rejects unknown-time lease checks (fail closed without now)", () => {
    const lane = laneClaudeWorking();
    const event = makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
    });
    const out = reduce(lane, event, policy, {});
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("time-missing");
  });

  it("blocks a coordinator from touching a leased lane (stale lease cannot be bypassed)", () => {
    // No coordinator event is legal from a working state, so the transition
    // table refuses first; the reducer's lease-held check is defense-in-depth
    // behind it. Either way the lane must not advance.
    const lane = laneClaudeWorking();
    const event = makeEvent({
      sequence: 4, event_type: "coordinator.escalated", prior_state: "claude-working",
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(["transition-forbidden", "lease-held"]).toContain(out.refusal);
      expect(out.lane.state).toBe("claude-working");
      expect(out.lane.lease?.lease_id).toBe("lease-claude-1");
    }
  });
});

describe("lease expiry recovery", () => {
  it("system.lease_expired moves an expired lane to lease-expired", () => {
    const lane = laneClaudeWorking();
    const event = makeEvent({
      sequence: 4, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.lease_expired", prior_state: "claude-working",
      occurred_at: AFTER_EXPIRY,
    });
    const out = reduce(lane, event, policy, { now: AFTER_EXPIRY });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("lease-expired");
      expect(out.lane.lease).toBeNull();
    }
  });

  it("refuses to expire an unexpired lease", () => {
    const lane = laneClaudeWorking();
    const event = makeEvent({
      sequence: 4, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.lease_expired", prior_state: "claude-working",
    });
    const out = reduce(lane, event, policy, ctx); // now < expiry
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-not-expired");
  });

  it("system.requeued returns the lane to a safe retry state, preserving history", () => {
    const lane = makeLane({ state: "lease-expired", event_sequence: 4, attempt: 1 });
    const event = makeEvent({
      sequence: 5, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.requeued", prior_state: "lease-expired",
      requested_state: "ready-for-claude",
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-claude");
      expect(out.lane.event_sequence).toBe(5); // history advanced, not rewritten
      expect(out.lane.attempt).toBe(1);
    }
  });

  it("system.requeued refuses unsafe targets", () => {
    const lane = makeLane({ state: "lease-expired", event_sequence: 4 });
    const event = makeEvent({
      sequence: 5, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.requeued", prior_state: "lease-expired",
      requested_state: "ready-for-merge",
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("requeue-target-forbidden");
  });

  it("expired auditor lease follows the same recovery path", () => {
    const lane = laneCodexWorking();
    const expire = reduce(lane, makeEvent({
      sequence: 6, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.lease_expired", prior_state: "codex-working",
      occurred_at: AFTER_EXPIRY,
    }), policy, { now: AFTER_EXPIRY });
    expect(expire.ok).toBe(true);
    if (!expire.ok) return;
    const requeue = reduce(expire.lane, makeEvent({
      sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.requeued", prior_state: "lease-expired",
      requested_state: "ready-for-codex",
    }), policy, { now: AFTER_EXPIRY });
    expect(requeue.ok).toBe(true);
    if (requeue.ok) expect(requeue.lane.state).toBe("ready-for-codex");
  });
});
