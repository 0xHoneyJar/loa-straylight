// Control Plane v1 — exact-SHA audit protocol.
// Covers: audit without exact SHA rejection, moving-head invalidation,
// PATCH routing, REJECT blocking, CANNOT_AUDIT handling,
// audit-committed-into-target rejection (PR #116 lesson), and the
// two-step ACCEPT: audit → eligibility-pending → (durable live-metadata
// confirmation) → ready-for-merge.

import { describe, it, expect } from "vitest";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { validateAuditRecord } from "../../.straylight/lib/validate.mjs";
import {
  makeEvent, makePolicy, makeAuditRecord, laneCodexWorking, laneEligibilityPending,
  makeConfirmEvent, payloadDigest,
  NOW, HEAD_SHA, OTHER_SHA, BASE_SHA,
} from "./_fixtures.js";

const policy = makePolicy();
const ctx = { now: NOW };

// An audit completion event whose refs declare the digest of `record` —
// the durable content pinning the reducer re-checks on every replay.
function auditEvent(record: Record<string, any>, overrides: Record<string, any> = {}) {
  return makeEvent({
    sequence: 6,
    actor_role: "auditor",
    github_actor: "codex-login",
    event_type: "auditor.audit_completed",
    prior_state: "codex-working",
    lease_id: "lease-codex-1",
    audited_sha: record.audited_head_sha ?? HEAD_SHA,
    verdict: record.verdict ?? "ACCEPT",
    refs: { audit_comment_id: 777, pr_number: 120, audit_digest: payloadDigest(record) },
    ...overrides,
  });
}

describe("exact-SHA binding", () => {
  it("ACCEPT at the recorded head parks the lane in eligibility-pending (never straight to ready-for-merge)", () => {
    const record = makeAuditRecord();
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("eligibility-pending");
      expect(out.lane.verdict).toBe("ACCEPT");
      expect(out.lane.audited_sha).toBe(HEAD_SHA);
      expect(out.lane.next_actor).toBe("system");
    }
  });

  it("a durable live-metadata confirmation advances eligibility-pending to ready-for-merge", () => {
    const confirm = makeConfirmEvent({ sequence: 7 });
    const out = reduce(laneEligibilityPending(), confirm, policy, ctx);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-merge");
      expect(out.lane.next_actor).toBe("operator");
    }
  });

  it("rejects an audit missing its exact SHA", () => {
    const record = makeAuditRecord();
    delete (record as any).audited_head_sha;
    expect(validateAuditRecord(record).ok).toBe(false);
    const out = reduce(laneCodexWorking(), auditEvent(record, { audited_sha: undefined }), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(false);
  });

  it("rejects an event whose audited_sha disagrees with the audit record", () => {
    const record = makeAuditRecord();
    const out = reduce(laneCodexWorking(), auditEvent(record, { audited_sha: OTHER_SHA }), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-sha-mismatch");
  });

  it("invalidates an audit of a moved head (audited SHA != recorded head)", () => {
    const lane = laneCodexWorking({ pr_head_sha: OTHER_SHA }); // head moved after audit started
    const record = makeAuditRecord();
    const out = reduce(lane, auditEvent(record), policy, { ...ctx, audit_record: record });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-stale-head");
  });

  it("fails closed when the recorded head is unknown", () => {
    const lane = laneCodexWorking({ pr_head_sha: null });
    const record = makeAuditRecord();
    const out = reduce(lane, auditEvent(record), policy, { ...ctx, audit_record: record });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("head-unknown");
  });

  it("rejects an audit for the wrong PR, wrong base, or wrong lane", () => {
    for (const bad of [
      makeAuditRecord({ pr_number: 999 }),
      makeAuditRecord({ base_sha: OTHER_SHA }),
      makeAuditRecord({ lane_id: "lane-phase-49q" }),
    ]) {
      expect(reduce(laneCodexWorking(), auditEvent(bad), policy, {
        ...ctx, audit_record: bad,
      }).ok).toBe(false);
    }
  });

  it("rejects an audit bound to the wrong head branch (not the lane working branch)", () => {
    const record = makeAuditRecord({ head_branch: "some-other-branch" });
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, { ...ctx, audit_record: record });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-head-branch-mismatch");
  });

  it("rejects an incomplete-diff audit", () => {
    const record = makeAuditRecord({ complete_diff_reviewed: false });
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-incomplete-diff");
  });

  it("rejects a malformed verdict payload", () => {
    const record = makeAuditRecord({ verdict: "MAYBE" });
    const out = reduce(laneCodexWorking(), auditEvent(record, { verdict: "MAYBE" }), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(false);
  });

  it("rejects an audit from a non-allowlisted auditor identity", () => {
    const record = makeAuditRecord();
    const out = reduce(laneCodexWorking(), auditEvent(record, { github_actor: "impostor" }), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("actor-not-allowlisted");
  });

  it("rejects a completion event without a declared audit digest, or with a mismatched one", () => {
    const record = makeAuditRecord();
    const noDigest = reduce(laneCodexWorking(), auditEvent(record, {
      refs: { audit_comment_id: 777, pr_number: 120 },
    }), policy, { ...ctx, audit_record: record });
    expect(noDigest.ok).toBe(false);
    if (!noDigest.ok) expect(noDigest.refusal).toBe("audit-digest-missing");

    const mutated = makeAuditRecord({ validation_summary: "content mutated after posting" });
    const mismatch = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: mutated, // bound content differs from declared digest
    });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.refusal).toBe("audit-digest-mismatch");
  });
});

describe("PR #116 lesson: audit committed into the audited PR", () => {
  it("structurally rejects audit_committed_in_pr=true", () => {
    const record = makeAuditRecord({ audit_committed_in_pr: true });
    const v = validateAuditRecord(record);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join(" ")).toContain("audited PR");
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, { ...ctx, audit_record: record });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-record-invalid");
  });
});

describe("verdict routing", () => {
  it("PATCH routes to patch-required with mandatory concerns", () => {
    const record = makeAuditRecord({
      verdict: "PATCH",
      concerns: [{ severity: "high", location: "docs/x.md:12", description: "unsupported claim" }],
    });
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("patch-required");
      expect(out.lane.next_actor).toBe("coordinator");
    }
  });

  it("PATCH without concerns is malformed", () => {
    const record = makeAuditRecord({ verdict: "PATCH", concerns: [] });
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(false);
  });

  it("REJECT routes to blocked", () => {
    const record = makeAuditRecord({
      verdict: "REJECT",
      concerns: [{ severity: "blocker", location: "diff", description: "out of scope" }],
    });
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("blocked");
      expect(out.lane.next_actor).toBe("operator");
    }
  });

  it("CANNOT_AUDIT retryable requeues the audit", () => {
    const record = makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: true });
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-codex");
      expect(out.lane.verdict).toBeNull();
      expect(out.lane.audit_retry).toBe(1);
    }
  });

  it("CANNOT_AUDIT non-retryable blocks", () => {
    const record = makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: false });
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("blocked");
  });

  it("CANNOT_AUDIT retry budget exhausts into blocked", () => {
    const lane = laneCodexWorking({ audit_retry: 3 });
    const record = makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: true });
    const out = reduce(lane, auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("blocked");
  });

  it("CANNOT_AUDIT without a retryable declaration is malformed (routing would be ambiguous)", () => {
    const record = makeAuditRecord({ verdict: "CANNOT_AUDIT" });
    expect(validateAuditRecord(record).ok).toBe(false);
    const out = reduce(laneCodexWorking(), auditEvent(record), policy, {
      ...ctx, audit_record: record,
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-record-invalid");
  });
});

describe("head movement after ACCEPT", () => {
  it("system.head_moved invalidates a confirmed ACCEPT and requeues the audit", () => {
    const lane = laneEligibilityPending({
      state: "ready-for-merge", event_sequence: 7, next_actor: "operator",
    });
    const event = makeEvent({
      sequence: 8, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.head_moved", prior_state: "ready-for-merge",
      head_sha: OTHER_SHA,
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-codex");
      expect(out.lane.verdict).toBeNull();
      expect(out.lane.audited_sha).toBeNull();
      expect(out.lane.pr_head_sha).toBe(OTHER_SHA);
    }
  });

  it("system.head_moved also invalidates a PENDING (unconfirmed) ACCEPT", () => {
    const event = makeEvent({
      sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.head_moved", prior_state: "eligibility-pending",
      head_sha: OTHER_SHA,
    });
    const out = reduce(laneEligibilityPending(), event, policy, ctx);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-codex");
      expect(out.lane.verdict).toBeNull();
    }
  });

  it("system.head_moved refuses when the head did not move or is missing", () => {
    const lane = laneEligibilityPending({
      state: "ready-for-merge", event_sequence: 7, next_actor: "operator",
    });
    const notMoved = reduce(lane, makeEvent({
      sequence: 8, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.head_moved", prior_state: "ready-for-merge",
      head_sha: HEAD_SHA,
    }), policy, ctx);
    expect(notMoved.ok).toBe(false);
    if (!notMoved.ok) expect(notMoved.refusal).toBe("head-not-moved");

    const missing = reduce(lane, makeEvent({
      sequence: 8, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.head_moved", prior_state: "ready-for-merge",
    }), policy, ctx);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.refusal).toBe("head-missing");
  });

  it("operator.merged binds to the audited SHA exactly", () => {
    const lane = laneEligibilityPending({
      state: "ready-for-merge", event_sequence: 7, next_actor: "operator",
    });
    const good = reduce(lane, makeEvent({
      sequence: 8, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.merged", prior_state: "ready-for-merge", head_sha: HEAD_SHA,
    }), policy, ctx);
    expect(good.ok).toBe(true);
    if (good.ok) expect(good.lane.state).toBe("merged");

    const bad = reduce(lane, makeEvent({
      sequence: 8, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.merged", prior_state: "ready-for-merge", head_sha: OTHER_SHA,
    }), policy, ctx);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.refusal).toBe("merge-sha-mismatch");
  });
});
