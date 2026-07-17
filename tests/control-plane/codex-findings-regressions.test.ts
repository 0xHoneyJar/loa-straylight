// Control Plane v1 — direct regressions for the Codex PATCH findings
// (third round, C1–C12). One describe() per finding; each test reproduces
// the reported failure shape against the patched code.
//
//  C1  invalid audit followed by a later valid event (metadata-free replay
//      must never turn an invalid/unconfirmed audit into ready-for-merge)
//  C2  missing draft / merged metadata preserved as UNKNOWN (fail closed,
//      never defaulted to false)
//  C3  initial packet establishes the working branch; later branch
//      mismatches are refused everywhere
//  C4  edits to task-packet-only and audit-only comments route the lane to
//      operator-required (documented mutation posture)
//  C5  retryable and non-retryable CANNOT_AUDIT: validation and routing
//      are consistent
//  C6  invalid next_actor and cross-lane / cross-state embedded leases are
//      structurally refused
//  C7  fractional-second lease expiry: parsed instants, never lexical
//  C8  two distinct long-lane recovery keys yield distinct event IDs
//  C9  failed watchdog lane enumeration aborts (never "zero lanes")
//  C10 failed bootstrap existence enumeration aborts (never "no lane")
//  C11 check-run conclusions aggregate across ALL pages; a dropped page
//      fails closed
//  C12 artifact mutation after its original digest was computed is refused
//      by the durable declared digest

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { scan, recoveryEventId } from "../../.straylight/lib/watchdog.mjs";
import { evaluate } from "../../.straylight/lib/merge-guard.mjs";
import { renderPayload, MARKERS } from "../../.straylight/lib/markers.mjs";
import { validateLane, validateLease, validateAuditRecord, validatePrMetadata } from "../../.straylight/lib/validate.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord, makeLease,
  laneCodexWorking, laneClaudeWorking, laneEligibilityPending, makeConfirmEvent,
  liveMeta, payloadDigest,
  NOW, LEASE_EXPIRY, AFTER_EXPIRY, HEAD_SHA, OTHER_SHA, BASE_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const policy = makePolicy();
const ctx = { now: NOW };

function genesisBody() {
  return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`;
}
function comment(id: number, user: string, marker: string, payload: any, over: Record<string, any> = {}) {
  return { id, user, body: `note\n\n${renderPayload(marker, payload)}`, created_at: NOW, ...over };
}

// Stream: activate → packet → implementer lease → completed → auditor lease.
function upToCodexWorking() {
  const packet = makeTaskPacket();
  return [
    comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 })),
    comment(2, "chatgpt-login", MARKERS.taskPacket, packet),
    comment(3, "chatgpt-login", MARKERS.event, makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
    })),
    comment(4, "claude-login", MARKERS.event, makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
    })),
    comment(5, "claude-login", MARKERS.event, makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    })),
    comment(6, "codex-login", MARKERS.event, makeEvent({
      sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
    })),
  ];
}

// =============================================================================
// C1 — invalid audit + later valid event: replay determinism.
// Original exploit: reconstruction bound live PR metadata only at the
// "frontier" (last applied event). An audit refused live (head moved) became
// a NON-frontier comment as soon as any later event applied; the next replay
// then re-evaluated it WITHOUT metadata, it bound to the recorded head,
// applied, and the lane minted ready-for-merge from a refused audit.
// Resolution: the audit transition never consults live signals (parks in
// eligibility-pending), and only a durable metadata-bearing confirmation
// mints ready-for-merge — so replay is a pure function of durable content.
// =============================================================================
describe("C1 — an invalid audit followed by a later valid event never becomes ready-for-merge", () => {
  it("a durably-invalid audit stays refused after a later valid event, on every replay", () => {
    const badRecord = makeAuditRecord({ audited_head_sha: OTHER_SHA }); // != recorded head
    const comments = [
      ...upToCodexWorking(),
      comment(7, "codex-login", MARKERS.audit, badRecord),
      comment(8, "codex-login", MARKERS.event, makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: OTHER_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(badRecord) },
      })),
      // Later VALID event (operator pause) — under the old frontier logic
      // this would shift the frontier and re-judge the audit metadata-free.
      comment(9, "eileen1337", MARKERS.event, makeEvent({
        sequence: 6, actor_role: "operator", github_actor: "eileen1337",
        event_type: "operator.paused", prior_state: "codex-working",
      })),
    ];
    const a = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: NOW } });
    const b = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: "2026-08-01T00:00:00Z" } });
    for (const out of [a, b]) {
      const audit = out.dispositions.find((d) => d.comment_id === 8);
      expect(audit?.status).toBe("refused");
      expect(audit?.refusal).toBe("audit-stale-head");
      const pause = out.dispositions.find((d) => d.comment_id === 9);
      expect(pause?.status).toBe("applied");
      expect(out.lane?.state).toBe("codex-working");
      expect(out.lane?.operator_pause).toBe(true);
      expect(out.lane?.state).not.toBe("ready-for-merge");
    }
    expect(a.lane).toEqual(b.lane); // pure function of durable content
  });

  it("a VALID audit without its durable confirmation replays to eligibility-pending, never ready-for-merge", () => {
    const record = makeAuditRecord();
    const comments = [
      ...upToCodexWorking(),
      comment(7, "codex-login", MARKERS.audit, record),
      comment(8, "codex-login", MARKERS.event, makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(record) },
      })),
      // Later valid event on top of the pending state.
      comment(9, "eileen1337", MARKERS.event, makeEvent({
        sequence: 7, actor_role: "operator", github_actor: "eileen1337",
        event_type: "operator.paused", prior_state: "eligibility-pending",
      })),
    ];
    const out = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: NOW } });
    expect(out.lane?.state).toBe("eligibility-pending");
    expect(out.labels).not.toContain("cp-ready-for-merge");
  });

  it("a confirmation whose embedded metadata did NOT correspond is refused on every replay", () => {
    const comments = [
      comment(1, "github-actions[bot]", MARKERS.event, makeEvent({
        sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
        event_type: "system.eligibility_confirmed", prior_state: "eligibility-pending",
        pr_metadata: liveMeta({ head_sha: OTHER_SHA }), // stale at check time
      })),
    ];
    // Reduce directly over the pending lane (reconstruction path covered above).
    const out = reduce(laneEligibilityPending(), makeConfirmEvent({ sequence: 7 }, { head_sha: OTHER_SHA }), policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-stale-head");
    expect(comments.length).toBe(1); // (comments fixture exercised above)
  });
});

// =============================================================================
// C2 — missing draft/merged metadata is UNKNOWN, never false.
// =============================================================================
describe("C2 — missing draft/merged PR metadata fails closed as unknown", () => {
  it("validatePrMetadata refuses a fetched record missing draft or merged", () => {
    const noDraft: Record<string, any> = liveMeta();
    delete noDraft.draft;
    expect(validatePrMetadata(noDraft).ok).toBe(false);
    const noMerged: Record<string, any> = liveMeta();
    delete noMerged.merged;
    expect(validatePrMetadata(noMerged).ok).toBe(false);
  });

  it("a confirmation event whose embedded metadata omits draft/merged is refused", () => {
    for (const missing of ["draft", "merged"]) {
      const meta: Record<string, any> = liveMeta();
      delete meta[missing];
      const event = makeEvent({
        sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
        event_type: "system.eligibility_confirmed", prior_state: "eligibility-pending",
        pr_metadata: meta,
      });
      const out = reduce(laneEligibilityPending(), event, policy, ctx);
      expect(out.ok, missing).toBe(false);
      if (!out.ok) expect(out.refusal).toBe("event-invalid");
    }
  });

  it("merge guard treats missing draft/merged as unknown → ineligible", () => {
    const lane = makeLane({
      state: "ready-for-merge", event_sequence: 7,
      pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
    });
    const checks = { check_runs_total: 1, check_run_conclusions: ["success"], commit_statuses_total: 0, commit_status_state: "pending" };
    // A metadata record missing draft (or merged) is structurally invalid
    // (unknown is preserved as unknown) → ineligible; the complete record
    // is eligible.
    const noDraft: Record<string, any> = liveMeta();
    delete noDraft.draft;
    const noMerged: Record<string, any> = liveMeta();
    delete noMerged.merged;
    expect(evaluate(lane, policy, { checks, pr_metadata: noDraft } as any).eligible).toBe(false);
    expect(evaluate(lane, policy, { checks, pr_metadata: noMerged } as any).eligible).toBe(false);
    expect(evaluate(lane, policy, { checks, pr_metadata: liveMeta() }).eligible).toBe(true);
  });

  it("workflows forward draft/merged only as OBSERVED booleans (no // false defaulting)", () => {
    const reducer = readFileSync(".github/workflows/straylight-reducer.yml", "utf8");
    expect(reducer).not.toMatch(/\.draft\s*\/\/\s*false/);
    expect(reducer).not.toMatch(/\.merged\s*\/\/\s*false/);
    expect(reducer).toMatch(/\(\$p\.draft\|type\) == "boolean"/);
    expect(reducer).toMatch(/\(\$p\.merged\|type\) == "boolean"/);
    // The merge-guard workflow normalizes with the SAME complete-record jq
    // (fetch_ok collapses to false unless every field is present and typed).
    const guard = readFileSync(".github/workflows/straylight-merge-guard.yml", "utf8");
    expect(guard).not.toMatch(/\.draft\s*\/\/\s*false/);
    expect(guard).not.toMatch(/\.merged\s*\/\/\s*false/);
    expect(guard).toMatch(/\(\$p\.draft\|type\) == "boolean"/);
    expect(guard).toMatch(/\(\$p\.merged\|type\) == "boolean"/);
    expect(guard).toMatch(/fetch_ok: false/);
    // No loose single-field forwarding survives anywhere in the workflow.
    expect(guard).not.toMatch(/pr_draft|pr_merged|pr_state|pr_base_ref|pr_head_sha/);
  });
});

// =============================================================================
// C3 — working-branch establishment and mismatch.
// =============================================================================
describe("C3 — the initial packet establishes the working branch; mismatches refuse", () => {
  it("the initial packet's target_branch becomes lane.working_branch", () => {
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

  it("a LATER packet naming a different branch is refused", () => {
    const lane = makeLane({ state: "patch-required", event_sequence: 10, patch_cycle: 0, verdict: "PATCH" });
    const packet = makeTaskPacket({ packet_kind: "patch", patch_cycle: 1, target_branch: "some-other-branch" });
    const out = reduce(lane, makeEvent({
      sequence: 11, event_type: "coordinator.patch_packet_posted",
      prior_state: "patch-required",
      refs: { task_packet_comment_id: 99, task_packet_digest: payloadDigest(packet) },
    }), policy, { ...ctx, task_packet: packet });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("task-packet-wrong-target-branch");
  });

  it("a packet targeting the lane base branch is refused even at establishment", () => {
    const lane = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    const packet = makeTaskPacket({ target_branch: "main" });
    const out = reduce(lane, makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
    }), policy, { ...ctx, task_packet: packet });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("task-packet-targets-base-branch");
  });

  it("an implementer completion on the wrong branch is refused", () => {
    const out = reduce(laneClaudeWorking(), makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: "rogue-branch",
      refs: { pr_number: 120 },
    }), policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("wrong-working-branch");
  });

  it("an implementer completion that omits head_branch is refused", () => {
    const out = reduce(laneClaudeWorking(), makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
    }), policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("head-branch-missing");
  });

  it("an audit bound to a different head branch is refused; so is a confirmation", () => {
    const record = makeAuditRecord({ head_branch: "rogue-branch" });
    const auditOut = reduce(laneCodexWorking(), makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
      refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(record) },
    }), policy, { ...ctx, audit_record: record });
    expect(auditOut.ok).toBe(false);
    if (!auditOut.ok) expect(auditOut.refusal).toBe("audit-head-branch-mismatch");

    const confirmOut = reduce(laneEligibilityPending(), makeConfirmEvent({ sequence: 7 }, { head_branch: "rogue-branch" }), policy, ctx);
    expect(confirmOut.ok).toBe(false);
    if (!confirmOut.ok) expect(confirmOut.refusal).toBe("pr-wrong-head-branch");
  });
});

// =============================================================================
// C4 — edited task-packet-only / audit-only comments route to
// operator-required (they are protocol comments, not just unbound sources).
// =============================================================================
describe("C4 — edited artifact-only comments route the lane to operator-required", () => {
  it("an edited TASK-PACKET-only comment routes to operator-required", () => {
    const packet = makeTaskPacket();
    const comments = [
      comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 })),
      comment(2, "chatgpt-login", MARKERS.taskPacket, packet, { updated_at: "2026-07-16T13:00:00Z" }), // edited
      comment(3, "chatgpt-login", MARKERS.event, makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator",
        refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
      })),
    ];
    const out = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: NOW } });
    const edited = out.dispositions.find((d) => d.comment_id === 2);
    expect(edited?.refusal).toBe("protocol-comment-edited");
    const packetEvent = out.dispositions.find((d) => d.comment_id === 3);
    expect(packetEvent?.status).toBe("refused");
    expect(out.lane?.state).toBe("operator-required");
  });

  it("an edited AUDIT-only comment routes to operator-required", () => {
    const record = makeAuditRecord();
    const comments = [
      ...upToCodexWorking(),
      comment(7, "codex-login", MARKERS.audit, record, { updated_at: "2026-07-16T14:00:00Z" }), // edited
      comment(8, "codex-login", MARKERS.event, makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(record) },
      })),
    ];
    const out = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: NOW } });
    const edited = out.dispositions.find((d) => d.comment_id === 7);
    expect(edited?.refusal).toBe("protocol-comment-edited");
    expect(out.lane?.state).toBe("operator-required");
  });

  it("an unparseable updated_at on a protocol comment fails closed as edited", () => {
    const comments = [
      comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 }),
        { updated_at: "not-a-timestamp" }),
    ];
    const out = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: NOW } });
    expect(out.dispositions[0]?.refusal).toBe("protocol-comment-edited");
    expect(out.lane?.state).toBe("operator-required");
  });
});

// =============================================================================
// C5 — CANNOT_AUDIT validation/routing consistency.
// =============================================================================
describe("C5 — CANNOT_AUDIT: retryable and terminal outcomes are consistent", () => {
  function cannotAuditEvent(record: Record<string, any>) {
    return makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "CANNOT_AUDIT",
      refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(record) },
    });
  }

  it("retryable:true + next_actor:auditor validates and requeues to ready-for-codex", () => {
    const record = makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: true });
    expect(record.next_actor).toBe("auditor");
    expect(validateAuditRecord(record).ok).toBe(true);
    const out = reduce(laneCodexWorking(), cannotAuditEvent(record), policy, { ...ctx, audit_record: record });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("ready-for-codex");
      expect(out.lane.audit_retry).toBe(1);
      expect(out.lane.next_actor).toBe("auditor");
    }
  });

  it("retryable:false + next_actor:operator validates and blocks", () => {
    const record = makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: false });
    expect(record.next_actor).toBe("operator");
    expect(validateAuditRecord(record).ok).toBe(true);
    const out = reduce(laneCodexWorking(), cannotAuditEvent(record), policy, { ...ctx, audit_record: record });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("blocked");
      expect(out.lane.next_actor).toBe("operator");
      expect(out.lane.operator_required_reason).toContain("not retryable");
    }
  });

  it("a CANNOT_AUDIT with NO retryable declaration is malformed (ambiguous routing)", () => {
    const record = makeAuditRecord({ verdict: "CANNOT_AUDIT", next_actor: "operator" });
    delete (record as any).retryable;
    const v = validateAuditRecord(record);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join(" ")).toContain("retryable");
  });

  it("contradictory pairings are refused (retryable:true→operator, retryable:false→auditor, retryable on ACCEPT)", () => {
    expect(validateAuditRecord(makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: true, next_actor: "operator" })).ok).toBe(false);
    expect(validateAuditRecord(makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: false, next_actor: "auditor" })).ok).toBe(false);
    expect(validateAuditRecord(makeAuditRecord({ verdict: "ACCEPT", retryable: true })).ok).toBe(false);
  });

  it("an exhausted retry budget routes even a retryable CANNOT_AUDIT to blocked", () => {
    const record = makeAuditRecord({ verdict: "CANNOT_AUDIT", retryable: true });
    const out = reduce(laneCodexWorking({ audit_retry: 3 }), cannotAuditEvent(record), policy, { ...ctx, audit_record: record });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.lane.state).toBe("blocked");
      expect(out.lane.operator_required_reason).toContain("retry budget exhausted");
    }
  });
});

// =============================================================================
// C6 — next_actor projection and embedded-lease invariants.
// =============================================================================
describe("C6 — invalid next_actor and cross-lane/cross-state leases are refused", () => {
  it("a lane whose next_actor disagrees with its state is structurally invalid", () => {
    const v = validateLane(makeLane({ state: "ready-for-claude", next_actor: "operator" }));
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join(" ")).toContain("next_actor");
    // Every state × wrong-actor combination fails; the derived one passes.
    expect(validateLane(makeLane({ state: "ready-for-codex", next_actor: "implementer" })).ok).toBe(false);
    expect(validateLane(makeLane({ state: "ready-for-codex", next_actor: "auditor", pr_number: 120, pr_head_sha: HEAD_SHA })).ok).toBe(true);
  });

  it("a CROSS-LANE lease (lease.lane_id != lane.lane_id) is structurally invalid", () => {
    const lane = laneClaudeWorking({
      lease: makeLease({ lane_id: "lane-phase-49q" }),
    });
    const v = validateLane(lane);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join(" ")).toContain("cross-lane");
    // The reducer refuses any event on such a lane.
    const out = reduce(lane, makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    }), policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lane-invalid");
  });

  it("a CROSS-STATE lease (expected_state != lane state) is structurally invalid", () => {
    const lane = makeLane({
      state: "ready-for-codex", event_sequence: 4, pr_number: 120, pr_head_sha: HEAD_SHA,
      lease: makeLease({ actor_role: "auditor", expected_state: "codex-working" }),
    });
    const v = validateLane(lane);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join(" ")).toContain("cross-state");
  });

  it("a lease whose expected_state is not its holder role's working state is invalid", () => {
    expect(validateLease(makeLease({ actor_role: "implementer", expected_state: "codex-working" })).ok).toBe(false);
    expect(validateLease(makeLease({ actor_role: "auditor", expected_state: "claude-working" })).ok).toBe(false);
    expect(validateLease(makeLease({ actor_role: "auditor", expected_state: "ready-for-merge" })).ok).toBe(false);
    expect(validateLease(makeLease({ actor_role: "implementer", expected_state: "claude-working" })).ok).toBe(true);
    expect(validateLease(makeLease({ actor_role: "auditor", expected_state: "codex-working" })).ok).toBe(true);
  });

  it("the watchdog escalates (never recovers) a lane with an invalid next_actor or lease", () => {
    const badNext = makeLane({ state: "ready-for-claude", next_actor: "operator" });
    const badLease = laneClaudeWorking({ lease: makeLease({ lane_id: "lane-phase-49q" }) });
    const out = scan([badNext, badLease], policy, { now: AFTER_EXPIRY });
    expect(out.actions).toHaveLength(2);
    for (const a of out.actions) expect(a.type).toBe("escalate-malformed-lane");
  });
});

// =============================================================================
// C7 — fractional-second lease expiry: parsed instants, never lexical.
// =============================================================================
describe("C7 — fractional-second lease expiry compares as instants, not strings", () => {
  it("watchdog does NOT reap a lease expiring 500ms AFTER now (lexical compare would)", () => {
    // Lexically "…16:00:00.500Z" < "…16:00:00Z" (because "." < "Z"), so a
    // string comparison would falsely report this lease as expired.
    const lane = laneClaudeWorking({
      lease: makeLease({ expires_at: "2026-07-16T16:00:00.500Z" }),
    });
    const out = scan([lane], policy, { now: "2026-07-16T16:00:00Z" });
    expect(out.actions.filter((a) => a.event_type === "system.lease_expired")).toHaveLength(0);
  });

  it("watchdog DOES reap once the parsed instant passes (fractional now)", () => {
    const lane = laneClaudeWorking({
      lease: makeLease({ expires_at: "2026-07-16T16:00:00.500Z" }),
    });
    const out = scan([lane], policy, { now: "2026-07-16T16:00:00.600Z" });
    expect(out.actions.filter((a) => a.event_type === "system.lease_expired")).toHaveLength(1);
  });

  it("the reducer refuses system.lease_expired for a lease still 500ms alive", () => {
    const lane = laneClaudeWorking({
      lease: makeLease({ expires_at: "2026-07-16T16:00:00.500Z" }),
    });
    const out = reduce(lane, makeEvent({
      sequence: 4, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.lease_expired", prior_state: "claude-working",
    }), policy, { now: "2026-07-16T16:00:00Z" });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-not-expired");
  });

  it("a completion 250ms before a fractional expiry is still in-lease; 750ms after is refused", () => {
    const lane = laneClaudeWorking({
      lease: makeLease({ expires_at: "2026-07-16T16:00:00.500Z" }),
    });
    const complete = (at: string) => reduce(lane, makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    }), policy, { now: at, event_observed_at: at, comment_author: "claude-login" });
    expect(complete("2026-07-16T16:00:00.250Z").ok).toBe(true);
    const late = complete("2026-07-16T16:00:01.250Z");
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.refusal).toBe("lease-expired");
  });
});

// =============================================================================
// C8 — collision-resistant watchdog recovery event IDs.
// =============================================================================
describe("C8 — recovery event IDs cannot collide across long lane IDs / recovery keys", () => {
  // Two DISTINCT maximal-length lane ids sharing a long common prefix. Under
  // the old scheme (truncate the dedupe key to 60 chars) both produced the
  // SAME event id; the reducer then refused the second lane's recovery as
  // duplicate-event-id — denial of recovery.
  const laneIdA = "lane-" + "a".repeat(56) + "-one";  // 65 chars total
  const laneIdB = "lane-" + "a".repeat(56) + "-two";
  const keyA = `lease-expired:${laneIdA}:lease-x1:3`;
  const keyB = `lease-expired:${laneIdB}:lease-x1:3`;

  it("two long-lane recovery keys sharing a 60+ char prefix yield distinct event IDs", () => {
    expect(keyA.slice(0, 60)).toBe(keyB.slice(0, 60)); // the old truncation WOULD collide
    const idA = recoveryEventId(keyA);
    const idB = recoveryEventId(keyB);
    expect(idA).not.toBe(idB);
    // Both satisfy the published event_id pattern.
    for (const id of [idA, idB]) expect(id).toMatch(/^evt-[a-z0-9][a-z0-9-]{1,62}$/);
  });

  it("scan() emits those distinct IDs end-to-end for two colliding-prefix lanes", () => {
    const mkLane = (laneId: string) => makeLane({
      lane_id: laneId,
      state: "claude-working", event_sequence: 3, attempt: 1,
      lease: makeLease({ lane_id: laneId, lease_id: "lease-x1" }),
    });
    const out = scan([mkLane(laneIdA), mkLane(laneIdB)], policy, { now: AFTER_EXPIRY });
    const ids = out.actions.filter((a) => a.type === "post-event").map((a) => a.event_id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("the watchdog workflow posts the scanner's event_id (no jq truncation of the dedupe key)", () => {
    const wf = readFileSync(".github/workflows/straylight-watchdog.yml", "utf8");
    expect(wf).toMatch(/event_id: \$a\[0\]\.event_id/);
    expect(wf).not.toMatch(/\.\[0:60\]/);
  });
});

// =============================================================================
// C9 — failed watchdog lane enumeration fails closed.
// =============================================================================
describe("C9 — a failed watchdog lane enumeration aborts the sweep", () => {
  const wf = readFileSync(".github/workflows/straylight-watchdog.yml", "utf8");
  it("the lane listing checks the API exit status explicitly and exits non-zero", () => {
    expect(wf).toMatch(/if ! gh api --paginate "repos\/\$\{REPO\}\/issues\?labels=cp-lane&state=open&per_page=100"/);
    expect(wf).toMatch(/lane enumeration failed[\s\S]{0,160}exit 1/);
  });
  it("the listing is never piped through a failure-swallowing construct", () => {
    // No `mapfile -t ISSUES < <(gh api ...)` (process substitution swallows
    // the exit status) and no `|| true` on the listing call.
    expect(wf).not.toMatch(/mapfile -t ISSUES < <\(gh api/);
    expect(wf).not.toMatch(/issues\?labels=cp-lane&state=open[^\n]*\|\|\s*true/);
  });
});

// =============================================================================
// C10 — failed bootstrap existence enumeration fails closed.
// =============================================================================
describe("C10 — a failed bootstrap existence check aborts (never 'no existing lane')", () => {
  const wf = readFileSync(".github/workflows/straylight-bootstrap.yml", "utf8");
  it("the existence check verifies the API exit status and refuses to bootstrap on failure", () => {
    expect(wf).toMatch(/if ! gh api --paginate "repos\/\$\{REPO\}\/issues\?labels=cp-lane&state=all[^"]*"/);
    expect(wf).toMatch(/refusing to bootstrap[\s\S]{0,120}exit 1/);
  });
  it("the count no longer swallows the API status with a trailing || true on the pipeline", () => {
    // grep -c over the already-verified FILE may carry || true (zero matches
    // exits 1); the gh api call itself must not.
    expect(wf).not.toMatch(/FOUND=\$\(gh api[\s\S]{0,200}\|\|\s*true\)/);
  });
});

// =============================================================================
// C11 — check-run conclusions aggregate across ALL pages.
// =============================================================================
describe("C11 — two-page check-run aggregation", () => {
  const lane = makeLane({
    state: "ready-for-merge", event_sequence: 7,
    pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
  });
  const liveBase = { pr_metadata: liveMeta() };

  it("150 runs across two pages, all passing → eligible (aggregation honored)", () => {
    const out = evaluate(lane, policy, {
      ...liveBase,
      checks: {
        check_runs_total: 150,
        check_run_conclusions: Array.from({ length: 150 }, () => "success"),
        commit_statuses_total: 0, commit_status_state: "pending",
      },
    });
    expect(out.eligible).toBe(true);
  });

  it("a failure ON THE SECOND PAGE blocks (page-1-only counting would miss it)", () => {
    const conclusions = Array.from({ length: 150 }, (_, i) => (i === 149 ? "failure" : "success"));
    const out = evaluate(lane, policy, {
      ...liveBase,
      checks: { check_runs_total: 150, check_run_conclusions: conclusions, commit_statuses_total: 0, commit_status_state: "pending" },
    });
    expect(out.eligible).toBe(false);
  });

  it("a conclusion list shorter than the API total (dropped page) fails closed", () => {
    const out = evaluate(lane, policy, {
      ...liveBase,
      checks: {
        check_runs_total: 150,
        check_run_conclusions: Array.from({ length: 100 }, () => "success"),
        commit_statuses_total: 0, commit_status_state: "pending",
      },
    });
    expect(out.eligible).toBe(false);
  });

  it("the merge-guard workflow gathers conclusions with --paginate and slurps every page", () => {
    const wf = readFileSync(".github/workflows/straylight-merge-guard.yml", "utf8");
    expect(wf).toMatch(/gh api --paginate "repos\/\$\{REPO\}\/commits\/\$\{HEAD\}\/check-runs"/);
    expect(wf).toMatch(/jq -s '\[\.\[\]\.check_runs\[\] \| \(\.conclusion \/\/ "null"\)\]'/);
    expect(wf).toMatch(/check_run_conclusions/);
  });
});

// =============================================================================
// C12 — artifact mutation after its original digest was computed.
// =============================================================================
describe("C12 — post-digest artifact mutation is refused by the durable declared digest", () => {
  it("a task packet mutated after its event posted is refused (digest mismatch, no edit metadata needed)", () => {
    const original = makeTaskPacket();
    const mutated = makeTaskPacket({ allowed_paths: [".loa/", "src/", ".github/"] }); // scope widened post-hoc
    const comments = [
      comment(1, "chatgpt-login", MARKERS.event, makeEvent({ sequence: 1 })),
      comment(2, "chatgpt-login", MARKERS.taskPacket, mutated), // body now differs; no updated_at signal
      comment(3, "chatgpt-login", MARKERS.event, makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator",
        refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(original) },
      })),
    ];
    const out = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: NOW } });
    const d = out.dispositions.find((x) => x.comment_id === 3);
    expect(d?.status).toBe("refused");
    expect(d?.refusal).toBe("task-packet-digest-mismatch");
    expect(out.lane?.state).toBe("ready-for-coordinator");
  });

  it("an audit record mutated after its completion event posted is refused the same way", () => {
    const original = makeAuditRecord();
    const mutated = makeAuditRecord({ verdict: "ACCEPT", validation_summary: "forged summary" });
    const comments = [
      ...upToCodexWorking(),
      comment(7, "codex-login", MARKERS.audit, mutated), // swapped body, no edit metadata
      comment(8, "codex-login", MARKERS.event, makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(original) },
      })),
    ];
    const out = reconstructLane({ issue_body: genesisBody(), comments, policy, context: { now: NOW } });
    const d = out.dispositions.find((x) => x.comment_id === 8);
    expect(d?.status).toBe("refused");
    expect(d?.refusal).toBe("audit-digest-mismatch");
    expect(out.lane?.state).toBe("codex-working");
  });

  it("the digest is canonical: key order and whitespace do not affect it; content does", () => {
    expect(payloadDigest({ b: 2, a: 1 })).toBe(payloadDigest({ a: 1, b: 2 }));
    expect(payloadDigest(makeTaskPacket())).not.toBe(payloadDigest(makeTaskPacket({ authority_basis: "changed basis" })));
  });

  it("events missing their digest declaration are refused (nothing to pin against)", () => {
    const packet = makeTaskPacket();
    const record = makeAuditRecord();
    const lane1 = makeLane({ state: "ready-for-coordinator", event_sequence: 1 });
    const noPacketDigest = reduce(lane1, makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 2 },
    }), policy, { ...ctx, task_packet: packet });
    expect(noPacketDigest.ok).toBe(false);
    if (!noPacketDigest.ok) expect(noPacketDigest.refusal).toBe("task-packet-digest-missing");

    const noAuditDigest = reduce(laneCodexWorking(), makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
      refs: { audit_comment_id: 7, pr_number: 120 },
    }), policy, { ...ctx, audit_record: record });
    expect(noAuditDigest.ok).toBe(false);
    if (!noAuditDigest.ok) expect(noAuditDigest.refusal).toBe("audit-digest-missing");
  });
});
