// Control Plane v1 — exact-SHA audit protocol.
// Covers: audit without exact SHA rejection, moving-head invalidation,
// PATCH routing, REJECT blocking, CANNOT_AUDIT handling,
// audit-committed-into-target rejection (PR #116 lesson).

import { describe, it, expect } from "vitest";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { validateAuditRecord } from "../../.straylight/lib/validate.mjs";
import {
  makeEvent, makePolicy, makeAuditRecord, laneCodexWorking,
  NOW, HEAD_SHA, OTHER_SHA, BASE_SHA,
} from "./_fixtures.js";

const policy = makePolicy();
const ctx = { now: NOW };

function auditEvent(overrides: Record<string, any> = {}) {
  return makeEvent({
    sequence: 6,
    actor_role: "auditor",
    github_actor: "codex-login",
    event_type: "auditor.audit_completed",
    prior_state: "codex-working",
    lease_id: "lease-codex-1",
    audited_sha: HEAD_SHA,
    verdict: "ACCEPT",
    refs: { audit_comment_id: 777, pr_number: 120 },
    ...overrides,
  });
}

describe("exact-SHA binding", () => {
  it("ACCEPT at the current head produces ready-for-merge", () => {
    const out = reduce(laneCodexWorking(), auditEvent(), policy, {
      ...ctx, audit_record: makeAuditRecord(), pr_head_sha: HEAD_SHA,
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-merge");
      expect(out.lane.verdict).toBe("ACCEPT");
      expect(out.lane.audited_sha).toBe(HEAD_SHA);
      expect(out.lane.next_actor).toBe("operator");
    }
  });

  it("rejects an audit missing its exact SHA", () => {
    const record = makeAuditRecord();
    delete (record as any).audited_head_sha;
    expect(validateAuditRecord(record).ok).toBe(false);
    const out = reduce(laneCodexWorking(), auditEvent({ audited_sha: undefined }), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(false);
  });

  it("rejects an event whose audited_sha disagrees with the audit record", () => {
    const out = reduce(laneCodexWorking(), auditEvent({ audited_sha: OTHER_SHA }), policy, {
      ...ctx, audit_record: makeAuditRecord(),
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-sha-mismatch");
  });

  it("invalidates an audit of a moved head (audited SHA != current head)", () => {
    const lane = laneCodexWorking({ pr_head_sha: OTHER_SHA }); // head moved after audit started
    const out = reduce(lane, auditEvent(), policy, { ...ctx, audit_record: makeAuditRecord() });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-stale-head");
  });

  it("fails closed when the current head is unknown", () => {
    const lane = laneCodexWorking({ pr_head_sha: null });
    const out = reduce(lane, auditEvent(), policy, { ...ctx, audit_record: makeAuditRecord() });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("head-unknown");
  });

  it("rejects an audit for the wrong PR, wrong base, or wrong lane", () => {
    expect(reduce(laneCodexWorking(), auditEvent(), policy, {
      ...ctx, audit_record: makeAuditRecord({ pr_number: 999 }),
    }).ok).toBe(false);
    expect(reduce(laneCodexWorking(), auditEvent(), policy, {
      ...ctx, audit_record: makeAuditRecord({ base_sha: OTHER_SHA }),
    }).ok).toBe(false);
    expect(reduce(laneCodexWorking(), auditEvent(), policy, {
      ...ctx, audit_record: makeAuditRecord({ lane_id: "lane-phase-49q" }),
    }).ok).toBe(false);
  });

  it("rejects an incomplete-diff audit", () => {
    const out = reduce(laneCodexWorking(), auditEvent(), policy, {
      ...ctx, audit_record: makeAuditRecord({ complete_diff_reviewed: false }),
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-incomplete-diff");
  });

  it("rejects a malformed verdict payload", () => {
    const out = reduce(laneCodexWorking(), auditEvent(), policy, {
      ...ctx, audit_record: makeAuditRecord({ verdict: "MAYBE" }),
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-record-invalid");
  });

  it("rejects an audit from a non-allowlisted auditor identity", () => {
    const out = reduce(laneCodexWorking(), auditEvent({ github_actor: "impostor" }), policy, {
      ...ctx, audit_record: makeAuditRecord(),
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("actor-not-allowlisted");
  });
});

describe("PR #116 lesson: audit committed into the audited PR", () => {
  it("structurally rejects audit_committed_in_pr=true", () => {
    const record = makeAuditRecord({ audit_committed_in_pr: true });
    const v = validateAuditRecord(record);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join(" ")).toContain("audited PR");
    const out = reduce(laneCodexWorking(), auditEvent(), policy, { ...ctx, audit_record: record });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-record-invalid");
  });
});

describe("verdict routing", () => {
  it("PATCH routes to patch-required with mandatory concerns", () => {
    const out = reduce(laneCodexWorking(), auditEvent({ verdict: "PATCH" }), policy, {
      ...ctx,
      audit_record: makeAuditRecord({
        verdict: "PATCH",
        concerns: [{ severity: "high", location: "docs/x.md:12", description: "unsupported claim" }],
      }),
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("patch-required");
      expect(out.lane.next_actor).toBe("coordinator");
    }
  });

  it("PATCH without concerns is malformed", () => {
    const out = reduce(laneCodexWorking(), auditEvent({ verdict: "PATCH" }), policy, {
      ...ctx, audit_record: makeAuditRecord({ verdict: "PATCH", concerns: [] }),
    });
    expect(out.ok).toBe(false);
  });

  it("REJECT routes to blocked", () => {
    const out = reduce(laneCodexWorking(), auditEvent({ verdict: "REJECT" }), policy, {
      ...ctx,
      audit_record: makeAuditRecord({
        verdict: "REJECT",
        concerns: [{ severity: "blocker", location: "diff", description: "out of scope" }],
      }),
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("blocked");
      expect(out.lane.next_actor).toBe("operator");
    }
  });

  it("CANNOT_AUDIT retryable requeues the audit", () => {
    const out = reduce(laneCodexWorking(), auditEvent({ verdict: "CANNOT_AUDIT" }), policy, {
      ...ctx, audit_record: makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: true }),
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-codex");
      expect(out.lane.verdict).toBeNull();
      expect(out.lane.audit_retry).toBe(1);
    }
  });

  it("CANNOT_AUDIT non-retryable blocks", () => {
    const out = reduce(laneCodexWorking(), auditEvent({ verdict: "CANNOT_AUDIT" }), policy, {
      ...ctx, audit_record: makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: false }),
    });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("blocked");
  });

  it("CANNOT_AUDIT retry budget exhausts into blocked", () => {
    const lane = laneCodexWorking({ audit_retry: 3 });
    const out = reduce(lane, auditEvent({ verdict: "CANNOT_AUDIT" }), policy, {
      ...ctx, audit_record: makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: true }),
    });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("blocked");
  });
});

describe("head movement after ACCEPT", () => {
  it("system.head_moved invalidates a prior ACCEPT and requeues the audit", () => {
    const lane = laneCodexWorking({
      state: "ready-for-merge", next_actor: "operator", event_sequence: 6,
      verdict: "ACCEPT", audited_sha: HEAD_SHA, lease: null,
    });
    const event = makeEvent({
      sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.head_moved", prior_state: "ready-for-merge",
    });
    const out = reduce(lane, event, policy, { ...ctx, pr_head_sha: OTHER_SHA });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-codex");
      expect(out.lane.verdict).toBeNull();
      expect(out.lane.audited_sha).toBeNull();
      expect(out.lane.pr_head_sha).toBe(OTHER_SHA);
    }
  });

  it("system.head_moved refuses when the head did not move", () => {
    const lane = laneCodexWorking({
      state: "ready-for-merge", next_actor: "operator", event_sequence: 6,
      verdict: "ACCEPT", audited_sha: HEAD_SHA, lease: null,
    });
    const event = makeEvent({
      sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.head_moved", prior_state: "ready-for-merge",
    });
    const out = reduce(lane, event, policy, { ...ctx, pr_head_sha: HEAD_SHA });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("head-not-moved");
  });

  it("operator.merged binds to the audited SHA exactly", () => {
    const lane = laneCodexWorking({
      state: "ready-for-merge", next_actor: "operator", event_sequence: 6,
      verdict: "ACCEPT", audited_sha: HEAD_SHA, lease: null,
    });
    const good = reduce(lane, makeEvent({
      sequence: 7, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.merged", prior_state: "ready-for-merge", head_sha: HEAD_SHA,
    }), policy, ctx);
    expect(good.ok).toBe(true);
    if (good.ok) expect(good.lane.state).toBe("merged");

    const bad = reduce(lane, makeEvent({
      sequence: 7, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.merged", prior_state: "ready-for-merge", head_sha: OTHER_SHA,
    }), policy, ctx);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.refusal).toBe("merge-sha-mismatch");
  });
});
