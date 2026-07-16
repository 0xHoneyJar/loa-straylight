// Control Plane v1 — direct regression tests for the Codex PATCH blockers
// B1–B13. Each test reproduces the exact exploit Codex reported and asserts
// the patched code now refuses / freezes / binds correctly. Every test is
// written so that it FAILS against the pre-patch code and PASSES after.
//
// Layout: one describe() per blocker, exploit stated in the describe title.
// Fixtures come from _fixtures.ts; workflow-shape blockers (B8 dedupe, B10
// bootstrap base, B11 wording) read the actual repo files, matching the
// existing convention in policy-and-no-leak.test.ts.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { scan } from "../../.straylight/lib/watchdog.mjs";
import { evaluate } from "../../.straylight/lib/merge-guard.mjs";
import { extractPayload, renderPayload, MARKERS } from "../../.straylight/lib/markers.mjs";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { validateEvent } from "../../.straylight/lib/validate.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord, makeLease,
  laneCodexWorking, laneClaudeWorking,
  NOW, LEASE_EXPIRY, AFTER_EXPIRY, HEAD_SHA, OTHER_SHA, BASE_SHA,
} from "./_fixtures.js";

const policy = makePolicy();
const ctx = { now: NOW };

// -- helpers for reconstruction-level exploits --------------------------------

function laneGenesisBody(overrides: Record<string, any> = {}) {
  return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane(overrides))}`;
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

function auditEvent(overrides: Record<string, any> = {}) {
  return makeEvent({
    sequence: 6, actor_role: "auditor", github_actor: "codex-login",
    event_type: "auditor.audit_completed", prior_state: "codex-working",
    lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
    refs: { audit_comment_id: 777, pr_number: 120 },
    ...overrides,
  });
}

// =============================================================================
// B1 — live PR target is not authoritative.
// Exploit: the lane's event-recorded head (lane.pr_head_sha, set from the
// implementer's CLAIMED implementer.completed.head_sha) was used to bind an
// ACCEPT, so an audit could be accepted against a head that differs from the
// live PR head fetched by the workflow.
// =============================================================================
describe("B1 — live PR head is authoritative over the implementer-recorded head", () => {
  it("refuses ACCEPT when the live head diverges from the implementer-recorded head", () => {
    const lane = laneCodexWorking({ pr_head_sha: HEAD_SHA }); // implementer-claimed head
    const out = reduce(lane, auditEvent(), policy, {
      ...ctx,
      audit_record: makeAuditRecord({ audited_head_sha: HEAD_SHA }),
      pr_head_sha: OTHER_SHA, // LIVE head fetched by the workflow — diverges
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("audit-stale-head");
    expect(out.lane.state).toBe("codex-working");
  });

  it("still accepts when the live head equals the audited head", () => {
    const out = reduce(laneCodexWorking(), auditEvent(), policy, {
      ...ctx, audit_record: makeAuditRecord(), pr_head_sha: HEAD_SHA,
    });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("ready-for-merge");
  });

  it("falls back to the recorded head for deterministic replay when no live head is supplied", () => {
    const out = reduce(laneCodexWorking(), auditEvent(), policy, {
      ...ctx, audit_record: makeAuditRecord(), // no pr_head_sha in context
    });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("ready-for-merge");
  });
});

// =============================================================================
// B2 — implementer can substitute an unapproved / stale task packet.
// Exploit: implementer.lease_acquired carried its own refs.task_packet_comment_id
// pointing at a wide-scope packet the implementer authored, bypassing the
// coordinator-approved packet.
// =============================================================================
describe("B2 — implementer cannot substitute its own task packet", () => {
  it("ignores an implementer-authored packet ref; start fails closed with no coordinator packet", () => {
    // Drive to ready-for-claude via the operator escape hatch (no coordinator
    // packet ever posted), then let the implementer point at its OWN packet.
    const selfPacket = makeTaskPacket({ allowed_paths: [".loa/", "src/", ".claude/"], authority_basis: "SELF" });
    const comments = [
      evComment(1, "chatgpt-login", makeEvent({ sequence: 1, event_type: "coordinator.escalated", prior_state: "planning", reason: "x" })),
      evComment(2, "eileen1337", makeEvent({ sequence: 2, actor_role: "operator", github_actor: "eileen1337", event_type: "operator.decision", prior_state: "operator-required", requested_state: "ready-for-claude" })),
      packetComment(50, "claude-login", selfPacket),
      evComment(51, "claude-login", makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
        refs: { task_packet_comment_id: 50 },
      })),
    ];
    const out = reconstructLane({ issue_body: laneGenesisBody(), comments, policy, context: { now: NOW } });
    const lease = out.dispositions.find((d) => d.comment_id === 51);
    expect(lease?.status).toBe("refused");
    expect(lease?.refusal).toBe("no-valid-task-packet");
    expect(out.lane?.state).toBe("ready-for-claude");
  });

  it("still uses the coordinator-approved packet on a normal lease (no ref needed)", () => {
    const comments = [
      evComment(1, "chatgpt-login", makeEvent({ sequence: 1 })),
      packetComment(2, "chatgpt-login", makeTaskPacket()),
      evComment(3, "chatgpt-login", makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 2 },
      })),
      evComment(4, "claude-login", makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
      })),
    ];
    const out = reconstructLane({ issue_body: laneGenesisBody(), comments, policy, context: { now: NOW } });
    expect(out.lane?.state).toBe("claude-working");
  });
});

// =============================================================================
// B3 — lease timestamps/duration/holder/recovery are unsound.
// Exploit: implementer.lease_acquired set an arbitrary far-future expiry
// (year 2099); the watchdog only reaps once expiry passes, so the lane parks
// forever. Secondary: requeue routing ignored which role lost its lease.
// =============================================================================
describe("B3 — lease expiry is bounded by policy; recovery routes by lost role", () => {
  it("refuses a lease whose expiry exceeds observed grant + lease_duration_minutes", () => {
    const lane = makeLane({ state: "ready-for-claude", next_actor: "implementer", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: "2099-01-01T00:00:00Z",
    });
    const out = reduce(lane, event, policy, { now: NOW, event_observed_at: NOW, task_packet: makeTaskPacket() });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-expiry-unbounded");
  });

  it("accepts a lease at exactly observed + lease_duration_minutes (boundary)", () => {
    const lane = makeLane({ state: "ready-for-claude", next_actor: "implementer", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY, // NOW + 240m exactly
    });
    const out = reduce(lane, event, policy, { now: NOW, event_observed_at: NOW, task_packet: makeTaskPacket() });
    expect(out.ok).toBe(true);
  });

  it("records the lost lease role at expiry and refuses a mis-routed requeue", () => {
    // Implementer lease expires → lease-expired with last_lease_role=implementer.
    const working = laneClaudeWorking();
    const expire = makeEvent({
      sequence: 4, actor_role: "system", github_actor: "eileen1337",
      event_type: "system.lease_expired", prior_state: "claude-working",
    });
    const expired = reduce(working, expire, policy, { now: AFTER_EXPIRY });
    expect(expired.ok).toBe(true);
    if (!expired.ok) return;
    expect(expired.lane.state).toBe("lease-expired");
    expect(expired.lane.last_lease_role).toBe("implementer");

    // A requeue to the AUDITOR queue is refused (implementer lost the lease).
    const badRequeue = makeEvent({
      sequence: 5, actor_role: "system", github_actor: "eileen1337",
      event_type: "system.requeued", prior_state: "lease-expired",
      requested_state: "ready-for-codex",
    });
    const bad = reduce(expired.lane, badRequeue, policy, { now: AFTER_EXPIRY });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.refusal).toBe("requeue-role-mismatch");

    // The correct requeue (implementer → ready-for-claude) is accepted.
    const goodRequeue = makeEvent({
      sequence: 5, actor_role: "system", github_actor: "eileen1337",
      event_type: "system.requeued", prior_state: "lease-expired",
      requested_state: "ready-for-claude",
    });
    const good = reduce(expired.lane, goodRequeue, policy, { now: AFTER_EXPIRY });
    expect(good.ok).toBe(true);
    if (good.ok) expect(good.lane.state).toBe("ready-for-claude");
  });

  it("watchdog routes a lease-expired implementer lane to ready-for-claude even with a PR present", () => {
    const lane = makeLane({
      state: "lease-expired", next_actor: "system", event_sequence: 4,
      pr_number: 120, pr_head_sha: HEAD_SHA, last_lease_role: "implementer",
    });
    const out = scan([lane], policy, { now: AFTER_EXPIRY });
    const requeue = out.actions.find((a) => a.event_type === "system.requeued");
    expect(requeue?.requested_state).toBe("ready-for-claude");
  });
});

// =============================================================================
// B4 — the append-only record is not enforcing event-ID uniqueness.
// Exploit: two different comments reusing one event_id both applied.
// =============================================================================
describe("B4 — event IDs are unique within a lane", () => {
  it("refuses a second comment reusing an event_id already applied", () => {
    const comments = [
      evComment(1, "chatgpt-login", makeEvent({ sequence: 1, event_id: "evt-dup" })),
      evComment(2, "eileen1337", makeEvent({
        sequence: 2, actor_role: "operator", github_actor: "eileen1337",
        event_type: "operator.paused", prior_state: "ready-for-coordinator", event_id: "evt-dup",
      })),
    ];
    const out = reconstructLane({ issue_body: laneGenesisBody(), comments, policy, context: { now: NOW } });
    const first = out.dispositions.find((d) => d.comment_id === 1);
    const second = out.dispositions.find((d) => d.comment_id === 2);
    expect(first?.status).toBe("applied");
    expect(second?.status).toBe("refused");
    expect(second?.refusal).toBe("duplicate-event-id");
    // The reused event did not take effect: lane not paused, seq stays at 1.
    expect(out.lane?.operator_pause).toBe(false);
    expect(out.lane?.event_sequence).toBe(1);
  });
});

// =============================================================================
// B5 — parser accepts ambiguous JSON (duplicate object keys).
// Exploit: a payload a human reads as verdict:"REJECT" parses (last-wins) as
// verdict:"ACCEPT".
// =============================================================================
describe("B5 — strict JSON parsing rejects duplicate keys", () => {
  it("rejects a payload with a duplicate object key as ambiguous", () => {
    const body = [
      "<!-- straylight:audit:v1 -->",
      "```json",
      '{ "schema": "straylight.audit.v1", "verdict": "REJECT", "verdict": "ACCEPT" }',
      "```",
    ].join("\n");
    const r = extractPayload(body, MARKERS.audit);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("ambiguous-duplicate-key");
  });

  it("rejects duplicate keys nested anywhere in the document", () => {
    expect(parseStrict('{"a":{"b":1,"b":2}}').ok).toBe(false);
    expect(parseStrict('{"a":1}').ok).toBe(true);
  });

  it("still round-trips well-formed payloads (no false positives)", () => {
    const v = { schema: "straylight.event.v1", a: 1, b: [1, 2, { c: "x" }], d: true, e: null, f: -3.5e10 };
    const back = extractPayload(renderPayload(MARKERS.event, v), MARKERS.event);
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.value).toEqual(v);
  });

  it("does not confuse __proto__ keys (no prototype pollution)", () => {
    const r = parseStrict('{"__proto__": {"polluted": true}}');
    expect(r.ok).toBe(true);
    expect(({} as any).polluted).toBeUndefined();
  });
});

// =============================================================================
// B6 — schemas, validators and declarations diverge.
// Exploit: the event `reason` field is capped at maxLength 4000 in the
// published schema but the validator enforced no bound.
// =============================================================================
describe("B6 — validator enforces the published schema's maxLength on reason", () => {
  it("rejects a reason beyond the schema maxLength (4000)", () => {
    expect(validateEvent(makeEvent({ reason: "x".repeat(4001) })).ok).toBe(false);
  });
  it("accepts a reason at exactly the schema maxLength", () => {
    expect(validateEvent(makeEvent({ reason: "x".repeat(4000) })).ok).toBe(true);
  });
  it("the published event schema still declares that maxLength (divergence source pinned)", () => {
    const schema = JSON.parse(readFileSync(".straylight/schemas/event-v1.schema.json", "utf8"));
    expect(schema.properties.reason.maxLength).toBe(4000);
  });
});

// =============================================================================
// B7 — audit records are not fully enforceable / reconstructible.
// Exploit: an audit comment authored by someone other than the auditor (or a
// PR-thread comment unreachable from the lane issue) could back an ACCEPT.
// =============================================================================
describe("B7 — audit record must be authored by the completing auditor", () => {
  it("refuses an audit record authored by the implementer under audit", () => {
    const comments = [
      evComment(1, "chatgpt-login", makeEvent({ sequence: 1 })),
      packetComment(2, "chatgpt-login", makeTaskPacket()),
      evComment(3, "chatgpt-login", makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 2 },
      })),
      evComment(4, "claude-login", makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
      })),
      evComment(5, "claude-login", makeEvent({
        sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.completed", prior_state: "claude-working",
        lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
      })),
      evComment(6, "codex-login", makeEvent({
        sequence: 5, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
        lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
      })),
      // Audit payload authored by the IMPLEMENTER, not the auditor.
      auditComment(7, "claude-login", makeAuditRecord()),
      evComment(8, "codex-login", makeEvent({
        sequence: 6, actor_role: "auditor", github_actor: "codex-login",
        event_type: "auditor.audit_completed", prior_state: "codex-working",
        lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
        refs: { audit_comment_id: 7, pr_number: 120 },
      })),
    ];
    const out = reconstructLane({ issue_body: laneGenesisBody(), comments, policy, context: { now: NOW, pr_head_sha: HEAD_SHA } });
    expect(out.lane?.state).toBe("codex-working"); // did NOT advance to ready-for-merge
    const audit = out.dispositions.find((d) => d.comment_id === 8);
    expect(audit?.status).toBe("refused");
    expect(audit?.refusal).toBe("audit-record-invalid");
  });
});

// =============================================================================
// B8 — watchdog failures preserve stale eligibility.
// Exploit: when the live head could not be fetched, the ready-for-merge lane
// silently kept its ACCEPT eligibility. (Dedupe-suppression is a workflow
// fix, asserted below in the workflow-shape section.)
// =============================================================================
describe("B8 — watchdog fails closed on an unverifiable ready-for-merge head", () => {
  it("flags a ready-for-merge lane whose PR head could not be resolved", () => {
    const lane = makeLane({
      state: "ready-for-merge", next_actor: "operator", event_sequence: 6,
      pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
    });
    const out = scan([lane], policy, { now: NOW, pr_heads: {}, pr_head_unresolved: [120] });
    const flag = out.actions.find((a) => a.type === "flag-unverifiable-head");
    expect(flag).toBeDefined();
    expect(flag?.lane_id).toBe("lane-phase-49p");
  });

  it("does not flag when the head resolves and equals the audited SHA", () => {
    const lane = makeLane({
      state: "ready-for-merge", next_actor: "operator", event_sequence: 6,
      pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
    });
    const out = scan([lane], policy, { now: NOW, pr_heads: { "120": HEAD_SHA }, pr_head_unresolved: [] });
    expect(out.actions.find((a) => a.type === "flag-unverifiable-head")).toBeUndefined();
  });

  it("every dedupe scan (watchdog, reducer, merge-guard) is restricted to bot-authored marker comments (unsuppressible)", () => {
    // The dedupe check must select on github-actions[bot] authorship AND a
    // straylight marker — never scan raw '.[].body' across all authors, which
    // let any actor suppress a recovery/result by posting the dedupe string.
    for (const [f, marker] of [
      [".github/workflows/straylight-watchdog.yml", /straylight:\(event\|watchdog-result\):v1/],
      [".github/workflows/straylight-reducer.yml", /straylight:reducer-result:v1/],
      [".github/workflows/straylight-merge-guard.yml", /straylight:merge-guard-result:v1/],
    ] as const) {
      const wf = readFileSync(f, "utf8");
      expect(wf, f).toMatch(/select\(\.user\.login == "github-actions\[bot\]"\)/);
      expect(wf, f).toMatch(marker);
      // No raw all-author body scan immediately piped into a dedupe grep.
      expect(wf, f).not.toMatch(/--paginate -q '\.\[\]\.body'\s*\\?\s*\n\s*\| grep -qF "dedupe:/);
    }
  });
});

// =============================================================================
// B9 — merge-check treatment is contradictory / incomplete.
// Exploit: the guard treated "zero check runs configured" as "checks passed"
// (fail open) and trusted a pre-cooked boolean.
// =============================================================================
describe("B9 — merge guard fails closed on the check-status unknowns", () => {
  const eligibleLane = makeLane({
    state: "ready-for-merge", next_actor: "operator", event_sequence: 6,
    pr_number: 120, pr_head_sha: HEAD_SHA, audited_sha: HEAD_SHA, verdict: "ACCEPT",
  });
  it("zero check runs is ineligible (was fail-open)", () => {
    const out = evaluate(eligibleLane, policy, {
      pr_head_sha: HEAD_SHA,
      checks: { check_runs_total: 0, check_runs_failing: 0, commit_statuses_total: 0, commit_status_state: "pending" },
    });
    expect(out.eligible).toBe(false);
  });
  it("a pre-cooked boolean is no longer accepted as evidence", () => {
    const out = evaluate(eligibleLane, policy, { pr_head_sha: HEAD_SHA, required_checks_passed: true } as any);
    expect(out.eligible).toBe(false);
  });
  it("a failing legacy combined status blocks even with passing check runs", () => {
    const out = evaluate(eligibleLane, policy, {
      pr_head_sha: HEAD_SHA,
      checks: { check_runs_total: 3, check_runs_failing: 0, commit_statuses_total: 1, commit_status_state: "failure" },
    });
    expect(out.eligible).toBe(false);
  });
  it("passing check runs with no legacy statuses (and an open, non-draft, on-base PR) is eligible", () => {
    const out = evaluate(eligibleLane, policy, {
      pr_head_sha: HEAD_SHA,
      checks: { check_runs_total: 2, check_runs_failing: 0, commit_statuses_total: 0, commit_status_state: "pending" },
      pr_state: "open", pr_draft: false, pr_base_ref: "main",
    });
    expect(out.eligible).toBe(true);
  });
  it("a closed, draft, or retargeted PR fails the guard closed (R3 regression)", () => {
    const liveChecks = { check_runs_total: 2, check_runs_failing: 0, commit_statuses_total: 0, commit_status_state: "pending" };
    const base = { pr_head_sha: HEAD_SHA, checks: liveChecks, pr_state: "open", pr_draft: false, pr_base_ref: "main" };
    expect(evaluate(eligibleLane, policy, { ...base, pr_state: "closed" }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...base, pr_draft: true }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { ...base, pr_base_ref: "release-x" }).eligible).toBe(false);
    expect(evaluate(eligibleLane, policy, { pr_head_sha: HEAD_SHA, checks: liveChecks }).eligible).toBe(false); // no liveness info → closed
  });
});

// =============================================================================
// B10 — bootstrap base selection is unsafe (git rev-parse HEAD of dispatched
// ref). Workflow-shape assertion (the pure modules cannot reach git).
// =============================================================================
describe("B10 — bootstrap resolves base from origin/main, not the dispatched ref", () => {
  const wf = readFileSync(".github/workflows/straylight-bootstrap.yml", "utf8");
  it("no longer anchors base to the dispatched checkout HEAD", () => {
    expect(wf).not.toMatch(/BASE_SHA=\$\(git rev-parse HEAD\)/);
  });
  it("fetches and resolves origin/main explicitly", () => {
    expect(wf).toMatch(/git fetch[^\n]*origin main/);
    expect(wf).toMatch(/git rev-parse (FETCH_HEAD|origin\/main)/);
  });
});

// =============================================================================
// B11 — canonical governance wording is contradictory / impossible.
// =============================================================================
describe("B11 — governance wording matches the executable artifacts", () => {
  it("README no longer claims a PR-event trigger the merge guard does not have", () => {
    const wf = readFileSync(".github/workflows/straylight-merge-guard.yml", "utf8");
    expect(wf).not.toMatch(/^\s*pull_request(_target)?:/m);
    const readme = readFileSync(".straylight/README.md", "utf8");
    expect(readme).not.toMatch(/PR events on lane PRs/);
  });
  it("ADR-050 §7 ceiling is pull-requests: read and no CP workflow exceeds it", () => {
    const adr = readFileSync("docs/decisions/ADR-050-autonomous-execution-control-plane.md", "utf8");
    expect(adr).not.toMatch(/`pull-requests:\s*write`/);
    for (const f of [
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
      ".github/workflows/straylight-merge-guard.yml",
      ".github/workflows/straylight-bootstrap.yml",
    ]) {
      expect(readFileSync(f, "utf8"), f).not.toMatch(/^\s+pull-requests:\s*write\s*$/m);
    }
  });
});

// =============================================================================
// B12 — coordinator can act when it is not next_actor.
// Exploit: coordinator.escalated on a lane whose turn belongs to another role.
// =============================================================================
describe("B12 — only the lane's turn owner may advance it", () => {
  it("refuses a coordinator escalation of a lane whose turn is the auditor's", () => {
    const lane = makeLane({
      state: "ready-for-codex", next_actor: "auditor", event_sequence: 5,
      pr_number: 120, pr_head_sha: HEAD_SHA,
    });
    const event = makeEvent({
      sequence: 6, actor_role: "coordinator", github_actor: "chatgpt-login",
      event_type: "coordinator.escalated", prior_state: "ready-for-codex", reason: "interject",
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(["not-next-actor", "transition-forbidden"]).toContain(out.refusal);
    expect(out.lane.state).toBe("ready-for-codex");
  });

  it("preserves the coordinator escalation escape hatch on a coordinator-turn lane", () => {
    const lane = makeLane({ state: "patch-required", next_actor: "coordinator", event_sequence: 7, patch_cycle: 1 });
    const event = makeEvent({
      sequence: 8, actor_role: "coordinator", github_actor: "chatgpt-login",
      event_type: "coordinator.escalated", prior_state: "patch-required", reason: "scope conflict",
    });
    const out = reduce(lane, event, policy, ctx);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.state).toBe("operator-required");
  });

  it("preserves operator and system escape hatches out of turn", () => {
    const lane = makeLane({ state: "ready-for-claude", next_actor: "implementer", event_sequence: 2 });
    const pause = makeEvent({
      sequence: 3, actor_role: "operator", github_actor: "eileen1337",
      event_type: "operator.paused", prior_state: "ready-for-claude",
    });
    expect(reduce(lane, pause, policy, ctx).ok).toBe(true);
    const esc = makeEvent({
      sequence: 3, actor_role: "system", github_actor: "eileen1337",
      event_type: "system.escalated", prior_state: "ready-for-claude", reason: "stuck",
    });
    expect(reduce(lane, esc, policy, ctx).ok).toBe(true);
  });
});

// =============================================================================
// B13 — kill switch rewinds the reduced projection.
// Exploit: reconstructing with policy.enabled=false refused every historical
// event, collapsing the lane back to genesis (planning/seq 0) instead of
// freezing it at its reached state.
// =============================================================================
describe("B13 — kill switch freezes the projection, never rewinds it", () => {
  function happyPathComments() {
    return [
      evComment(1, "chatgpt-login", makeEvent({ sequence: 1 })),
      packetComment(2, "chatgpt-login", makeTaskPacket()),
      evComment(3, "chatgpt-login", makeEvent({
        sequence: 2, event_type: "coordinator.task_packet_posted",
        prior_state: "ready-for-coordinator", refs: { task_packet_comment_id: 2 },
      })),
      evComment(4, "claude-login", makeEvent({
        sequence: 3, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
      })),
      evComment(5, "claude-login", makeEvent({
        sequence: 4, actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.completed", prior_state: "claude-working",
        lease_id: "lease-claude-1", head_sha: HEAD_SHA, refs: { pr_number: 120 },
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
        refs: { audit_comment_id: 7, pr_number: 120 },
      })),
    ];
  }

  it("freeze equals live replay: disabled policy does not rewind the lane", () => {
    const input = { issue_body: laneGenesisBody(), comments: happyPathComments(), context: { now: NOW, pr_head_sha: HEAD_SHA } };
    const live = reconstructLane({ ...input, policy: makePolicy() });
    const killed = reconstructLane({ ...input, policy: makePolicy({ enabled: false }) });
    expect(killed.ok).toBe(true);
    expect(killed.lane).toEqual(live.lane);
    expect(killed.lane?.state).toBe("ready-for-merge");
    expect(killed.lane?.event_sequence).toBe(6);
    expect(killed.frozen).toBe(true);
    expect(live.frozen).toBe(false);
    expect(killed.dispositions.filter((d) => d.status === "applied")).toHaveLength(6);
  });

  it("B1×B13 interaction: a historical audit event replays deterministically regardless of the transient live head", () => {
    // Regression for the self-review finding: the B1 live-head guard must
    // apply only at the frontier, never during replay of an already-applied
    // audit — otherwise a head move rewinds ready-for-merge → codex-working
    // and the projection stops being a pure function of durable content.
    // Here the audit is NOT the frontier (a later operator.paused is), so the
    // reduced state must be identical no matter what live head is supplied.
    const comments = [
      ...happyPathComments(),
      evComment(9, "eileen1337", makeEvent({
        sequence: 7, actor_role: "operator", github_actor: "eileen1337",
        event_type: "operator.paused", prior_state: "ready-for-merge",
      }), "2026-07-16T13:00:00Z"),
    ];
    const withHead = reconstructLane({ issue_body: laneGenesisBody(), comments, policy, context: { now: NOW, pr_head_sha: HEAD_SHA } });
    const withMovedHead = reconstructLane({ issue_body: laneGenesisBody(), comments, policy, context: { now: NOW, pr_head_sha: OTHER_SHA } });
    const withNoHead = reconstructLane({ issue_body: laneGenesisBody(), comments, policy, context: { now: NOW } });
    expect(withHead.lane).toEqual(withMovedHead.lane);
    expect(withMovedHead.lane).toEqual(withNoHead.lane);
    expect(withHead.lane?.state).toBe("ready-for-merge");
    expect(withHead.lane?.event_sequence).toBe(7);
    expect(withHead.lane?.operator_pause).toBe(true);
  });

  it("a structurally invalid policy still fails closed (not force-enabled)", () => {
    const out = reconstructLane({
      issue_body: laneGenesisBody(), comments: happyPathComments(),
      policy: { garbage: true } as any, context: { now: NOW },
    });
    // Genesis is valid, so ok:true, but every event is refused (policy-invalid)
    // and the lane stays at genesis — that is correct fail-closed behavior for a
    // BROKEN policy, distinct from the kill-switch freeze of a VALID disabled one.
    expect(out.frozen).toBe(true);
    expect(out.lane?.state).toBe("planning");
    expect(out.dispositions.every((d) => d.status === "refused")).toBe(true);
  });

  it("the reducer workflow gates all actions on the kill switch", () => {
    const wf = readFileSync(".github/workflows/straylight-reducer.yml", "utf8");
    expect(wf).toMatch(/Kill switch check/);
    expect(wf).toMatch(/steps\.killswitch\.outputs\.enabled == 'true'/);
  });
});
