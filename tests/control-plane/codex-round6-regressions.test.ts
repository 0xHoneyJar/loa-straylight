// Control Plane v1 — direct regressions for the Codex PATCH finding
// (sixth round, F1). One describe() per finding; each test reproduces
// the reported failure shape against the patched code.
//
//  F1  reconstruction's kill-switch replay force-enablement must not
//      launder a malformed policy into a valid one: the old guard only
//      checked `typeof policy === "object" && policy.enabled !== true`,
//      so a policy whose `enabled` was the string "false", null, a
//      number, an object, or missing entirely was rewritten to
//      `enabled: true` before replay — turning a structurally INVALID
//      policy into a fully VALID one and replaying (even advancing) the
//      lane under a policy that never validly existed. Force-enablement
//      is now gated on FULL validatePolicy success and applies only when
//      the original `enabled` is the literal boolean false (the one
//      value the kill switch legitimately produces); every other policy
//      is passed through unchanged so the reducer refuses each event
//      with its normal fail-closed policy-invalid error.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { renderPayload, MARKERS } from "../../.straylight/lib/markers.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord,
  payloadDigest,
  NOW, LEASE_EXPIRY, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

// -- helpers (same shapes as blocker-regressions.test.ts) ---------------------

function laneGenesisBody() {
  return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`;
}
function evComment(id: number, user: string, event: any, created_at = NOW) {
  return { id, user, body: `note\n\n${renderPayload(MARKERS.event, event)}`, created_at };
}
function packetComment(id: number, user: string, packet: any) {
  return { id, user, body: renderPayload(MARKERS.taskPacket, packet), created_at: NOW };
}
function auditComment(id: number, user: string, audit: any) {
  return { id, user, body: renderPayload(MARKERS.audit, audit), created_at: NOW };
}

// The full happy path to ready-for-merge (7 applied events), so a freeze
// (faithful replay) is distinguishable from a fail-closed refusal (genesis).
function happyPathComments() {
  const packet = makeTaskPacket();
  const record = makeAuditRecord();
  return [
    evComment(1, "chatgpt-login", makeEvent({ sequence: 1 })),
    packetComment(2, "chatgpt-login", packet),
    evComment(3, "chatgpt-login", makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
    })),
    evComment(4, "claude-login", makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
    })),
    evComment(5, "claude-login", makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    })),
    evComment(6, "codex-login", makeEvent({
      sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
    })),
    auditComment(7, "codex-login", makeAuditRecord()),
    evComment(8, "codex-login", makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
      refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(makeAuditRecord()) },
    })),
    evComment(9, "github-actions[bot]", makeEvent({
      sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.eligibility_confirmed", prior_state: "eligibility-pending",
      pr_metadata: {
        fetch_ok: true, repository: "0xHoneyJar/loa-straylight", pr_number: 120,
        state: "open", draft: false, merged: false, base_branch: "main",
        base_sha: makeLane().base_sha, head_branch: WORKING_BRANCH, head_sha: HEAD_SHA,
      },
    })),
  ];
}

function reconstructWith(policy: any) {
  return reconstructLane({
    issue_body: laneGenesisBody(),
    comments: happyPathComments(),
    policy,
    context: { now: NOW },
  });
}

// A reconstruction that FAILED CLOSED before any event applied: the lane is
// still the untouched genesis and every protocol comment was refused with
// the reducer's normal fail-closed policy-invalid error naming the bad field.
function expectRefusedAtGenesis(out: ReturnType<typeof reconstructLane>, detail: RegExp = /enabled/) {
  expect(out.ok).toBe(true); // genesis itself is valid — the EVENTS are refused
  expect(out.frozen).toBe(true);
  expect(out.lane?.state).toBe("planning");
  expect(out.lane?.event_sequence).toBe(0);
  expect(out.dispositions.length).toBeGreaterThan(0);
  for (const d of out.dispositions) {
    expect(d.status).toBe("refused");
    expect(d.refusal).toBe("policy-invalid");
    expect(d.detail).toMatch(detail);
  }
}

// =============================================================================
// F1 — replay force-enablement is gated on full policy validation.
// Original defect: `{ ...policy, enabled: true }` was constructed for ANY
// object policy with enabled !== true, so enabled: "false" / null / 1 / {} /
// missing was rewritten to boolean true — an otherwise-valid policy with a
// malformed kill-switch field became fully valid and the lane replayed (and
// could advance) under it instead of failing closed as policy-invalid.
// =============================================================================
describe("F1 — malformed-policy fail-closed reconstruction (force-enable only after validation)", () => {
  it("a VALID disabled policy (enabled: false) still freezes, not rewinds: projection equals live replay", () => {
    const live = reconstructWith(makePolicy());
    const killed = reconstructWith(makePolicy({ enabled: false }));
    expect(killed.ok).toBe(true);
    expect(killed.frozen).toBe(true);
    expect(killed.lane).toEqual(live.lane);
    expect(killed.lane?.state).toBe("ready-for-merge");
    expect(killed.lane?.event_sequence).toBe(7);
    expect(killed.dispositions.filter((d) => d.status === "applied")).toHaveLength(7);
  });

  it("a valid enabled policy (enabled: true) reconstructs normally, with no semantic alteration", () => {
    const out = reconstructWith(makePolicy());
    expect(out.ok).toBe(true);
    expect(out.frozen).toBe(false);
    expect(out.lane?.state).toBe("ready-for-merge");
    expect(out.lane?.event_sequence).toBe(7);
    expect(out.dispositions.filter((d) => d.status === "applied")).toHaveLength(7);
  });

  it('enabled: "false" (string) is refused as policy-invalid before any event applies — never rewritten to true', () => {
    expectRefusedAtGenesis(reconstructWith(makePolicy({ enabled: "false" })));
  });

  it("enabled: null is refused as policy-invalid before any event applies", () => {
    expectRefusedAtGenesis(reconstructWith(makePolicy({ enabled: null })));
  });

  it("a policy MISSING the enabled field is refused as policy-invalid before any event applies", () => {
    const policy = makePolicy();
    delete (policy as any).enabled;
    expectRefusedAtGenesis(reconstructWith(policy));
  });

  it("numeric and object-valued enabled fields are refused as policy-invalid before any event applies", () => {
    for (const bad of [0, 1, {}, { enabled: true }, [], "true"]) {
      expectRefusedAtGenesis(reconstructWith(makePolicy({ enabled: bad })));
    }
  });

  it("validation gates the WHOLE policy: enabled: false with another invalid field is not force-enabled", () => {
    // auto_merge: true is a hard v1 invariant violation; a boolean-false
    // kill switch must not buy this policy a validated replay.
    expectRefusedAtGenesis(reconstructWith(makePolicy({ enabled: false, auto_merge: true })), /auto_merge/);
    // Same for a policy whose actor allowlist is missing entirely.
    const noAllowlist = makePolicy({ enabled: false });
    delete (noAllowlist as any).actor_allowlist;
    const out = reconstructLane({
      issue_body: laneGenesisBody(), comments: happyPathComments(),
      policy: noAllowlist, context: { now: NOW },
    });
    expect(out.frozen).toBe(true);
    expect(out.lane?.state).toBe("planning");
    expect(out.dispositions.every((d) => d.status === "refused" && d.refusal === "policy-invalid")).toBe(true);
  });

  it("a malformed policy cannot advance a planning lane through lane.activated", () => {
    const out = reconstructLane({
      issue_body: laneGenesisBody(),
      comments: [evComment(1, "chatgpt-login", makeEvent({ sequence: 1 }))], // lane.activated
      policy: makePolicy({ enabled: "false" }),
      context: { now: NOW },
    });
    expect(out.ok).toBe(true);
    expect(out.frozen).toBe(true);
    expect(out.lane?.state).toBe("planning");
    expect(out.lane?.event_sequence).toBe(0);
    expect(out.dispositions).toEqual([
      expect.objectContaining({ comment_id: 1, status: "refused", refusal: "policy-invalid" }),
    ]);
    expect(out.labels).toContain("cp-state:planning");
  });

  it("source pin: reconstruction validates the original policy and force-enables only boolean false", () => {
    const src = readFileSync(".straylight/lib/reconstruct.mjs", "utf8");
    expect(src).toMatch(/validatePolicy/);
    expect(src).toMatch(/pv\.ok && policy\.enabled === false/);
    // The old unconditional object-shape guard is gone.
    expect(src).not.toMatch(/policyIsObject/);
  });
});
