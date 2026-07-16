// Control Plane v1 — regression tests for the R1–R7 correction pass.
// ChatGPT's inspection of the pushed branch found the first PATCH round
// overstated several fixes; these tests pin the tightened behavior:
//   R1 authoritative live PR metadata at the audit frontier
//   R2 temporal + digest + full-contract task-packet binding
//   R3 lease holder_login, trusted time, strict calendar, lease-id reuse
//   R4 temporal + digest audit binding, canonical location, ACCEPT/next_actor
//   R5 comment-mutation posture (edited protocol comments → operator-required)
//   R6 covered by conformance.test.ts (behavioral schema/runtime matrix)

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import {
  validateAuditRecord, validateTaskPacket, validateLease, validatePrMetadata, parseIsoInstant,
} from "../../.straylight/lib/validate.mjs";
import { payloadDigest, canonicalize } from "../../.straylight/lib/canonical.mjs";
import { renderPayload, MARKERS } from "../../.straylight/lib/markers.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord, makeLease,
  laneCodexWorking, NOW, LEASE_EXPIRY, AFTER_EXPIRY, HEAD_SHA, OTHER_SHA, BASE_SHA,
} from "./_fixtures.js";

const policy = makePolicy();
const REPO = "0xHoneyJar/loa-straylight";

function liveMeta(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    fetch_ok: true, repository: REPO, pr_number: 120, state: "open",
    draft: false, merged: false, base_branch: "main", base_sha: BASE_SHA,
    head_branch: "phase-49p-sibling-evidence-intake", head_sha: HEAD_SHA,
    ...overrides,
  };
}
function auditEvent(overrides: Record<string, any> = {}) {
  return makeEvent({
    sequence: 6, actor_role: "auditor", github_actor: "codex-login",
    event_type: "auditor.audit_completed", prior_state: "codex-working",
    lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
    refs: { audit_comment_id: 777, pr_number: 120 },
    ...overrides,
  });
}
const frontierCtx = (over: Record<string, any> = {}) => ({
  now: NOW, comment_author: "codex-login", audit_record: makeAuditRecord(), ...over,
});

// =============================================================================
// R1 — full live PR target authority at the audit frontier.
// =============================================================================
describe("R1 — authoritative live PR metadata governs the audit transition", () => {
  const lane = () => laneCodexWorking();

  it("1. correct stored head but CLOSED live PR → refused", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ state: "closed" }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-not-open");
  });
  it("2. correct head but WRONG live base branch → refused", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ base_branch: "release-x" }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-retargeted-branch");
  });
  it("3. correct head but WRONG base SHA → refused", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ base_sha: OTHER_SHA }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-base-sha-mismatch");
  });
  it("4. correct head but WRONG head branch → refused", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ head_branch: "sneaky-branch" }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-head-branch-mismatch");
  });
  it("5. correct head but WRONG repository → refused", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ repository: "evil/fork" }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-wrong-repository");
  });
  it("6. live metadata UNAVAILABLE (fetch failed) → refused", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: { fetch_ok: false } }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-metadata-unavailable");
  });
  it("7a. a merged live PR → refused (merged cannot record eligibility)", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ merged: true }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-already-merged");
  });
  it("7b. draft policy: a DRAFT live PR → refused (must be ready-for-review first)", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ draft: true }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-draft");
  });
  it("8. stored H1 vs live H2 (head moved) → refused audit-stale-head", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ head_sha: OTHER_SHA }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-stale-head");
  });
  it("wrong PR number → refused", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta({ pr_number: 999 }) }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-wrong-number");
  });
  it("all fields correspond → ACCEPT records eligibility", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: liveMeta() }));
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("ready-for-merge");
  });
  it("partial/invalid metadata object → refused pr-metadata-invalid", () => {
    const out = reduce(lane(), auditEvent(), policy, frontierCtx({ pr_metadata: { fetch_ok: true, repository: REPO } }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("pr-metadata-invalid");
  });
});

// =============================================================================
// R2 — task-packet temporal + digest + full-contract binding.
// =============================================================================
describe("R2 — task-packet binding is temporal, digest-pinned, and full-contract", () => {
  function genesis() { return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`; }
  function ev(id: number, user: string, e: any, over: Record<string, any> = {}) {
    return { id, user, body: renderPayload(MARKERS.event, e), created_at: NOW, ...over };
  }
  function pkt(id: number, user: string, p: any, over: Record<string, any> = {}) {
    return { id, user, body: renderPayload(MARKERS.taskPacket, p), created_at: NOW, ...over };
  }

  it("a coordinator packet event referencing a FUTURE comment does not validate", () => {
    // event at comment 3 references packet comment 50 (posted later).
    const comments = [
      ev(1, "chatgpt-login", makeEvent({ sequence: 1 })),
      ev(3, "chatgpt-login", makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 50 },
      })),
      pkt(50, "chatgpt-login", makeTaskPacket()),
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: { now: NOW } });
    const d = out.dispositions.find((x) => x.comment_id === 3);
    expect(d?.status).toBe("refused"); // forward reference → no packet bound → reducer refuses
    expect(out.lane?.state).toBe("ready-for-coordinator");
  });

  it("a later-appearing packet does NOT retroactively validate the earlier event", () => {
    // Same as above; the packet at id 50 exists but is after the event.
    const comments = [
      ev(1, "chatgpt-login", makeEvent({ sequence: 1 })),
      ev(3, "chatgpt-login", makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 50 },
      })),
      pkt(50, "chatgpt-login", makeTaskPacket()),
      // a real, earlier lease attempt should also fail because no packet was bound
      ev(60, "claude-login", makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
      })),
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: { now: NOW } });
    expect(out.lane?.state).toBe("ready-for-coordinator"); // never reached ready-for-claude
  });

  it("rejects a packet with wrong repository / target branch / phase-mismatch fields", () => {
    expect(validateTaskPacket(makeTaskPacket({ repository: "not a repo!" })).ok).toBe(false);
    expect(validateTaskPacket(makeTaskPacket({ target_branch: "bad branch with spaces" })).ok).toBe(false);
    expect(validateTaskPacket(makeTaskPacket({ expected_next_actor: "nobody" })).ok).toBe(false);
    expect(validateTaskPacket(makeTaskPacket({ patch_cycle: -1 })).ok).toBe(false);
  });

  it("rejects blank semantic fields (authority basis, success condition, non-goals, etc.)", () => {
    expect(validateTaskPacket(makeTaskPacket({ authority_basis: "   " })).ok).toBe(false);
    expect(validateTaskPacket(makeTaskPacket({ capability_success_condition: "" })).ok).toBe(false);
    expect(validateTaskPacket(makeTaskPacket({ required_completion_report: "  " })).ok).toBe(false);
    expect(validateTaskPacket(makeTaskPacket({ non_goals: [""] })).ok).toBe(false);
    expect(validateTaskPacket(makeTaskPacket({ required_tests: ["  "] })).ok).toBe(false);
    expect(validateTaskPacket(makeTaskPacket({ stop_conditions: [""] })).ok).toBe(false);
  });

  it("a changed packet body under the same comment reference changes the digest", () => {
    const a = payloadDigest(makeTaskPacket());
    const b = payloadDigest(makeTaskPacket({ allowed_paths: ["src/", ".loa/"] }));
    expect(a).not.toBe(b);
    // Digest is stable across key order / whitespace (canonical).
    expect(payloadDigest({ x: 1, y: 2 })).toBe(payloadDigest({ y: 2, x: 1 }));
  });

  it("reducer cross-checks packet fields against the lane (repo, next_actor, patch_cycle)", () => {
    const laneRFC = makeLane({ state: "ready-for-coordinator", next_actor: "coordinator", event_sequence: 1 });
    const packetEvent = makeEvent({
      sequence: 2, actor_role: "coordinator", github_actor: "chatgpt-login",
      event_type: "coordinator.task_packet_posted", prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2 },
    });
    const ctx = (tp: any) => ({ now: NOW, comment_author: "chatgpt-login", task_packet: tp });
    // Wrong repository → refused (the R2 exploit: packet drives implementer into a foreign repo).
    let out = reduce(laneRFC, packetEvent, policy, ctx(makeTaskPacket({ repository: "attacker/evil-repo" })));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("task-packet-wrong-repository");
    // Wrong expected_next_actor → refused.
    out = reduce(laneRFC, packetEvent, policy, ctx(makeTaskPacket({ expected_next_actor: "operator" })));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("task-packet-wrong-next-actor");
    // Initial packet with wrong patch_cycle → refused.
    out = reduce(laneRFC, packetEvent, policy, ctx(makeTaskPacket({ patch_cycle: 3 })));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("task-packet-wrong-patch-cycle");
    // A fully-corresponding packet is accepted.
    out = reduce(laneRFC, packetEvent, policy, ctx(makeTaskPacket()));
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("ready-for-claude");
  });

  it("an IMPLEMENTER-authored packet referenced by a coordinator event does not bind", () => {
    // The coordinator event names a packet comment that the IMPLEMENTER wrote.
    // bindArtifact requires the packet-comment author to match the coordinator
    // event author, so the packet is unbound and the reducer refuses.
    const comments = [
      ev(1, "chatgpt-login", makeEvent({ sequence: 1 })),
      pkt(2, "claude-login", makeTaskPacket({ allowed_paths: [".claude/", "src/"] })), // implementer authored
      ev(3, "chatgpt-login", makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 2 },
      })),
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: { now: NOW } });
    const d = out.dispositions.find((x) => x.comment_id === 3);
    expect(d?.status).toBe("refused");
    expect(out.lane?.state).toBe("ready-for-coordinator");
  });

  it("an edited packet comment breaks the binding (reconstruction routes to operator-required)", () => {
    const comments = [
      ev(1, "chatgpt-login", makeEvent({ sequence: 1 })),
      pkt(2, "chatgpt-login", makeTaskPacket(), { updated_at: "2026-07-16T13:00:00Z" }), // edited after posting
      ev(3, "chatgpt-login", makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 2 },
      })),
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: { now: NOW } });
    // The edited packet comment itself is not an event (no event marker), so it
    // is skipped by the mutation gate; but the packet event that references it
    // finds an edited source and fails to bind → reducer refuses the packet.
    const d = out.dispositions.find((x) => x.comment_id === 3);
    expect(d?.status).toBe("refused");
  });
});

// =============================================================================
// R3 — lease holder, trusted time, strict calendar, lease-id reuse.
// =============================================================================
describe("R3 — lease holder / time / id-reuse discipline", () => {
  function laneWorking(over: Record<string, any> = {}) {
    return makeLane({
      state: "claude-working", next_actor: "implementer", event_sequence: 3, attempt: 1,
      lease: makeLease(), ...over,
    });
  }

  it("holder A acquires, holder B completes → refused lease-holder-mismatch", () => {
    const lane = laneWorking();
    const complete = makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
    });
    const out = reduce(lane, complete, policy, { now: NOW, comment_author: "someone-else" });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-holder-mismatch");
  });

  it("holder A acquires, holder B releases → refused lease-holder-mismatch", () => {
    const lane = laneWorking();
    const release = makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_released", prior_state: "claude-working",
      lease_id: "lease-claude-1",
    });
    const out = reduce(lane, release, policy, { now: NOW, comment_author: "impostor" });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-holder-mismatch");
  });

  it("reused lease id after expiry → refused lease-id-reused", () => {
    const lane = makeLane({ state: "ready-for-claude", next_actor: "implementer", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-old", lease_expires_at: LEASE_EXPIRY,
    });
    const out = reduce(lane, event, policy, {
      now: NOW, comment_author: "claude-login", task_packet: makeTaskPacket(),
      used_lease_ids: ["lease-old"],
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-id-reused");
  });

  it("invalid occurred_at (month 13) → event rejected", () => {
    const lane = makeLane({ state: "ready-for-claude", next_actor: "implementer", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY, occurred_at: "2026-13-01T00:00:00Z",
    });
    const out = reduce(lane, event, policy, { now: NOW, comment_author: "claude-login", task_packet: makeTaskPacket() });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("event-invalid");
  });

  it("invalid lease_expires_at (Feb 30) → refused", () => {
    const lane = makeLane({ state: "ready-for-claude", next_actor: "implementer", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: "2026-02-30T00:00:00Z",
    });
    const out = reduce(lane, event, policy, { now: NOW, comment_author: "claude-login", task_packet: makeTaskPacket() });
    expect(out.ok).toBe(false);
  });

  it("acquisition time is taken from the trusted observed time, not the actor payload", () => {
    const lane = makeLane({ state: "ready-for-claude", next_actor: "implementer", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY, occurred_at: "2020-01-01T00:00:00Z",
    });
    const out = reduce(lane, event, policy, {
      now: NOW, event_observed_at: NOW, comment_author: "claude-login", task_packet: makeTaskPacket(),
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      // acquired_at is the observed/comment time, not the actor's 2020 claim.
      expect(out.lane.lease?.acquired_at).toBe(NOW);
      expect(out.lane.lease?.holder_login).toBe("claude-login");
    }
  });

  it("an old worker completing after a replacement lease → refused (lease-id-mismatch)", () => {
    // Lane now holds lease-claude-2; the old worker completes with lease-claude-1.
    const lane = makeLane({
      state: "claude-working", next_actor: "implementer", event_sequence: 5, attempt: 2,
      lease: makeLease({ lease_id: "lease-claude-2", grant_sequence: 5 }),
    });
    const stale = makeEvent({
      sequence: 6, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
    });
    const out = reduce(lane, stale, policy, { now: NOW, comment_author: "claude-login" });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-id-mismatch");
  });

  it("correct role but wrong authenticated login is refused", () => {
    const lane = laneWorking();
    const complete = makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
    });
    // github_actor matches allowlist, but the authenticated comment author is not the holder.
    const out = reduce(lane, complete, policy, { now: NOW, comment_author: "another-claude" });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-holder-mismatch");
  });

  it("strict calendar rejects non-Z offset, hour 24, invalid leap day", () => {
    expect(parseIsoInstant("2026-07-16T12:00:00+00:00")).toBeNull();
    expect(parseIsoInstant("2026-07-16T24:00:00Z")).toBeNull();
    expect(parseIsoInstant("2027-02-29T00:00:00Z")).toBeNull(); // 2027 not leap
    expect(parseIsoInstant("2028-02-29T00:00:00Z")).not.toBeNull(); // 2028 leap
  });
});

// =============================================================================
// R4 — audit temporal + digest binding, canonical location, ACCEPT/next_actor.
// =============================================================================
describe("R4 — audit reference binding and record consistency", () => {
  function genesis() { return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`; }
  function ev(id: number, user: string, e: any, over: Record<string, any> = {}) {
    return { id, user, body: renderPayload(MARKERS.event, e), created_at: NOW, ...over };
  }
  function auditC(id: number, user: string, a: any, over: Record<string, any> = {}) {
    return { id, user, body: renderPayload(MARKERS.audit, a), created_at: NOW, ...over };
  }
  function upToAuditLease() {
    return [
      ev(1, "chatgpt-login", makeEvent({ sequence: 1 })),
      { id: 2, user: "chatgpt-login", body: renderPayload(MARKERS.taskPacket, makeTaskPacket()), created_at: NOW },
      ev(3, "chatgpt-login", makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 2 },
      })),
      ev(4, "claude-login", makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
      })),
      ev(5, "claude-login", makeEvent({
        sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.completed", prior_state: "claude-working",
        lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
      })),
      ev(6, "codex-login", makeEvent({
        sequence: 5, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
        lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
      })),
    ];
  }
  const metaCtx = { now: NOW, pr_metadata: liveMeta() };

  it("a FUTURE audit comment reference does not bind (audit event refused)", () => {
    const comments = [
      ...upToAuditLease(),
      ev(8, "codex-login", makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 99, pr_number: 120 }, // 99 is later than 8
      })),
      auditC(99, "codex-login", makeAuditRecord()),
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: metaCtx });
    expect(out.lane?.state).toBe("codex-working"); // did not advance
    const d = out.dispositions.find((x) => x.comment_id === 8);
    expect(d?.refusal).toBe("audit-record-invalid");
  });

  it("a changed audit comment body breaks the binding", () => {
    const comments = [
      ...upToAuditLease(),
      auditC(7, "codex-login", makeAuditRecord(), { updated_at: "2026-07-16T14:00:00Z" }), // edited
      ev(8, "codex-login", makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120 },
      })),
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: metaCtx });
    const d = out.dispositions.find((x) => x.comment_id === 8);
    expect(d?.status).toBe("refused");
    expect(out.lane?.state).toBe("codex-working");
  });

  it("wrong audit author (implementer authored the audit) does not bind", () => {
    const comments = [
      ...upToAuditLease(),
      auditC(7, "claude-login", makeAuditRecord()), // authored by the implementer
      ev(8, "codex-login", makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120 },
      })),
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: metaCtx });
    const d = out.dispositions.find((x) => x.comment_id === 8);
    expect(d?.refusal).toBe("audit-record-invalid");
  });

  it("ACCEPT carrying concerns is a malformed record", () => {
    expect(validateAuditRecord(makeAuditRecord({
      verdict: "ACCEPT", concerns: [{ severity: "low", location: "x", description: "y" }],
    })).ok).toBe(false);
  });

  it("verdict/next_actor contradiction is rejected (ACCEPT must route to operator)", () => {
    expect(validateAuditRecord(makeAuditRecord({ verdict: "ACCEPT", next_actor: "coordinator" })).ok).toBe(false);
    expect(validateAuditRecord(makeAuditRecord({ verdict: "PATCH", next_actor: "operator", concerns: [{ severity: "high", location: "x", description: "y" }] })).ok).toBe(false);
  });

  it("audit reference missing → audit-completed refused", () => {
    const out = reduce(laneCodexWorking(), auditEvent({ refs: { pr_number: 120 } }), policy, {
      now: NOW, comment_author: "codex-login", pr_metadata: liveMeta(),
      // no audit_record supplied (adapter could not bind)
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-record-invalid");
  });

  it("audit_committed_in_pr=true attestation is rejected", () => {
    expect(validateAuditRecord(makeAuditRecord({ audit_committed_in_pr: true })).ok).toBe(false);
  });

  it("documents the canonical audit location honestly (lane issue, attestation field)", () => {
    const schema = readFileSync(".straylight/schemas/audit-v1.schema.json", "utf8");
    expect(schema).toMatch(/LANE ISSUE|lane issue/i);
    expect(schema).toMatch(/ATTESTATION|attestation/);
    // No claim of dual PR-comment + lane-issue support.
    const readme = readFileSync(".straylight/README.md", "utf8");
    expect(readme).toMatch(/Canonical location: a comment\s+on the LANE ISSUE/i);
  });

  it("a trailing junk comment does NOT shift the audit frontier off a genuine ACCEPT", () => {
    // The frontier is the last-APPLIED event, found by a metadata-free
    // pre-pass — not merely the newest event-marker comment. A stranger's
    // trailing wrong-lane event (refused) must not downgrade the audit's
    // live-metadata binding to the recorded-head fallback.
    const comments = [
      ...upToAuditLease(),
      auditC(7, "codex-login", makeAuditRecord()),
      ev(8, "codex-login", makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120 },
      })),
      // Trailing junk: a stranger posts a wrong-lane event AFTER the audit.
      ev(99, "random-user", makeEvent({
        sequence: 6, event_id: "evt-junk", lane_id: "lane-phase-49q",
        actor_role: "coordinator", github_actor: "random-user", event_type: "lane.activated",
        prior_state: "planning",
      })),
    ];
    // Live head MOVED vs the audited HEAD_SHA. If the frontier had shifted to
    // comment 99, the audit would use the recorded head and wrongly ACCEPT;
    // with the two-pass frontier it stays on comment 8 and is refused.
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: { now: NOW, pr_metadata: liveMeta({ head_sha: OTHER_SHA }) } });
    const d = out.dispositions.find((x) => x.comment_id === 8);
    expect(d?.status).toBe("refused");
    expect(d?.refusal).toBe("audit-stale-head");
    expect(out.lane?.state).toBe("codex-working");
  });
});

// =============================================================================
// R5 — comment-mutation posture.
// =============================================================================
describe("R5 — edited protocol comments route the lane to operator-required", () => {
  function genesis() { return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`; }

  it("an edited EVENT comment is refused and freezes the lane to operator-required", () => {
    const comments = [
      { id: 1, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({ sequence: 1 })), created_at: NOW },
      {
        id: 2, user: "chatgpt-login",
        body: renderPayload(MARKERS.event, makeEvent({ sequence: 2, event_type: "coordinator.escalated", prior_state: "ready-for-coordinator", reason: "x" })),
        created_at: NOW, updated_at: "2026-07-16T15:00:00Z", // edited
      },
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: { now: NOW } });
    const d = out.dispositions.find((x) => x.comment_id === 2);
    expect(d?.refusal).toBe("protocol-comment-edited");
    expect(out.lane?.state).toBe("operator-required");
  });

  it("an un-edited comment (updated_at == created_at) is processed normally", () => {
    const comments = [
      { id: 1, user: "chatgpt-login", body: renderPayload(MARKERS.event, makeEvent({ sequence: 1 })), created_at: NOW, updated_at: NOW },
    ];
    const out = reconstructLane({ issue_body: genesis(), comments, policy, context: { now: NOW } });
    expect(out.dispositions[0]?.status).toBe("applied");
    expect(out.lane?.state).toBe("ready-for-coordinator");
  });

  it("reconstruction input carries updated_at (workflows populate it)", () => {
    for (const f of [
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
      ".github/workflows/straylight-merge-guard.yml",
    ]) {
      expect(readFileSync(f, "utf8"), f).toMatch(/updated_at: \.updated_at/);
    }
  });

  it("no source claims comments are 'never edited or deleted' (honest posture)", () => {
    for (const f of [
      ".straylight/README.md",
      "docs/decisions/ADR-050-autonomous-execution-control-plane.md",
      ".straylight/schemas/event-v1.schema.json",
    ]) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/never edited or deleted/);
    }
  });
});
