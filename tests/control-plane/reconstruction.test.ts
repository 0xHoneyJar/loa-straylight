// Control Plane v1 — full lane reconstruction from GitHub-durable content.
// Covers: reducer idempotency (replay convergence), identity binding of
// payload actor vs authenticated commenter, event-for-another-lane isolation,
// Claude-start-without-packet via the durable record, recovery after total
// local-state loss.

import { describe, it, expect } from "vitest";
import { reconstructLane, deriveLabels } from "../../.straylight/lib/reconstruct.mjs";
import { MARKERS, renderPayload } from "../../.straylight/lib/markers.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord,
  NOW, LEASE_EXPIRY, HEAD_SHA, BASE_SHA,
} from "./_fixtures.js";

const policy = makePolicy();

function comment(id: number, user: string, payloadMarker: string, payload: any, created_at = NOW) {
  return { id, user, body: `progress note\n\n${renderPayload(payloadMarker, payload)}`, created_at };
}

function genesisBody() {
  return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`;
}

// The full happy-path comment stream: activate → packet → lease → complete
// → audit lease → audit ACCEPT.
function happyPathComments() {
  return [
    comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 })),
    comment(2, "chatgpt-login", MARKERS.taskPacket, makeTaskPacket()),
    comment(3, "chatgpt-login", MARKERS.event, makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 2 },
    })),
    comment(4, "claude-login", MARKERS.event, makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
    })),
    comment(5, "claude-login", MARKERS.event, makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
    })),
    comment(6, "codex-login", MARKERS.event, makeEvent({
      sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
    })),
    comment(7, "codex-login", MARKERS.audit, makeAuditRecord()),
    comment(8, "codex-login", MARKERS.event, makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
      refs: { audit_comment_id: 7, pr_number: 120 },
    })),
  ];
}

describe("reconstruction from durable GitHub content", () => {
  it("replays the full happy path to ready-for-merge from nothing but issue + comments", () => {
    const out = reconstructLane({
      issue_body: genesisBody(),
      comments: happyPathComments(),
      policy,
      context: { now: NOW },
    });
    expect(out.ok).toBe(true);
    expect(out.lane?.state).toBe("ready-for-merge");
    expect(out.lane?.verdict).toBe("ACCEPT");
    expect(out.lane?.audited_sha).toBe(HEAD_SHA);
    expect(out.lane?.event_sequence).toBe(6);
    expect(out.dispositions.filter((d) => d.status === "applied")).toHaveLength(6);
    expect(out.labels).toContain("cp-state:ready-for-merge");
    expect(out.labels).toContain("cp-ready-for-merge");
  });

  it("is idempotent: reconstructing twice yields identical lanes (reducer idempotency)", () => {
    const input = {
      issue_body: genesisBody(),
      comments: happyPathComments(),
      policy,
      context: { now: NOW },
    };
    const a = reconstructLane(input);
    const b = reconstructLane(input);
    expect(a.lane).toEqual(b.lane);
    expect(a.dispositions).toEqual(b.dispositions);
  });

  it("converges even with duplicated event comments (replay refused as stale)", () => {
    const comments = happyPathComments();
    // Duplicate the completion event with a later comment id.
    const completion = comments[4]!;
    const duped = [...comments, { ...completion, id: 99 }];
    const out = reconstructLane({ issue_body: genesisBody(), comments: duped, policy, context: { now: NOW } });
    expect(out.ok).toBe(true);
    expect(out.lane?.state).toBe("ready-for-merge");
    const refused = out.dispositions.find((d) => d.comment_id === 99);
    expect(refused?.status).toBe("refused");
  });

  it("refuses a payload whose claimed actor differs from the authenticated commenter", () => {
    const forged = comment(1, "some-stranger", MARKERS.event, makeEvent({ sequence: 1 }));
    const out = reconstructLane({ issue_body: genesisBody(), comments: [forged], policy, context: { now: NOW } });
    expect(out.ok).toBe(true);
    expect(out.lane?.state).toBe("planning"); // nothing advanced
    expect(out.dispositions[0]?.refusal).toBe("actor-identity-mismatch");
  });

  it("ignores events addressed to another lane (wrong-lane isolation)", () => {
    const alien = comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1, lane_id: "lane-phase-49q" }));
    const out = reconstructLane({ issue_body: genesisBody(), comments: [alien], policy, context: { now: NOW } });
    expect(out.lane?.state).toBe("planning");
    expect(out.dispositions[0]?.refusal).toBe("wrong-lane");
  });

  it("refuses implementer lease when the referenced packet comment does not exist", () => {
    const comments = [
      comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 })),
      comment(3, "chatgpt-login", MARKERS.event, makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 12345 },
      })),
    ];
    const out = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: NOW } });
    // The packet event itself is refused because the packet is unreadable.
    expect(out.lane?.state).toBe("ready-for-coordinator");
    const refused = out.dispositions.find((d) => d.comment_id === 3);
    expect(refused?.status).toBe("refused");
  });

  it("rejects a genesis that is not an initial lane (no state smuggling)", () => {
    const smuggled = makeLane({ state: "ready-for-merge", verdict: "ACCEPT", audited_sha: HEAD_SHA, event_sequence: 6 });
    const out = reconstructLane({
      issue_body: renderPayload(MARKERS.lane, smuggled),
      comments: [], policy, context: { now: NOW },
    });
    expect(out.ok).toBe(false);
    expect(out.refusal).toBe("genesis-not-initial");
  });

  it("rejects an issue with two lane payloads (ambiguity)", () => {
    const body = renderPayload(MARKERS.lane, makeLane()) + "\n" + renderPayload(MARKERS.lane, makeLane());
    const out = reconstructLane({ issue_body: body, comments: [], policy, context: { now: NOW } });
    expect(out.ok).toBe(false);
    expect(out.refusal).toBe("genesis-unreadable");
  });

  it("escalates to operator-required when the corridor no longer covers the lane", () => {
    const narrowPolicy = makePolicy({ authorized_corridor: ["phase-50a"] });
    const out = reconstructLane({
      issue_body: genesisBody(),
      comments: [comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 }))],
      policy: narrowPolicy,
      context: { now: NOW },
    });
    expect(out.lane?.state).toBe("operator-required");
    expect(out.lane?.operator_required_reason).toContain("outside-corridor");
  });

  it("derives labels purely from the reduced lane", () => {
    const lane = makeLane({ state: "ready-for-claude", next_actor: "implementer" });
    expect(deriveLabels(lane)).toEqual(["cp-lane", "cp-state:ready-for-claude", "cp-next:implementer"]);
  });
});
