// Shared fixtures for the control-plane test suite.
// Everything here mirrors the published v1 contracts in .straylight/schemas/.

import { payloadDigest } from "../../.straylight/lib/canonical.mjs";
import { nextActorFor } from "../../.straylight/lib/state-machine.mjs";

export const BASE_SHA = "009c4afe34f3f7151db4239fe1c69898833440bb";
export const HEAD_SHA = "a93e9f3694c3b8e5f7e6839856b9f347998a49ad";
export const OTHER_SHA = "1111111111111111111111111111111111111111";

export const NOW = "2026-07-16T12:00:00Z";
export const LEASE_EXPIRY = "2026-07-16T16:00:00Z";
export const AFTER_EXPIRY = "2026-07-16T17:00:00Z";

// The lane working branch: established by the INITIAL coordinator packet
// (its target_branch) and matched by every later packet, implementer
// completion, audit, and confirmed live PR head branch.
export const WORKING_BRANCH = "phase-49p-sibling-evidence-intake";

export const REPO = "0xHoneyJar/loa-straylight";

export { payloadDigest };

// The genesis admission epoch's boundary for fixture policies. Earlier than
// every fixture timestamp (NOW and the lane-history fixtures alike), so a
// fixture event always resolves to the single epoch below.
export const EPOCH_FROM = "2026-01-01T00:00:00Z";
export const EPOCH_ID = "epoch-test-001";

// Policy v2: the four replay-sensitive admission fields are authority only
// inside `admission_history`; at top level they are a projection of the final
// epoch (validatePolicy requires the two to be deep-equal). A test that
// overrides one of the four means "this was the admission policy in force", so
// the override lands in BOTH — pass an explicit `admission_history` to build a
// multi-epoch or deliberately-inconsistent policy.
export function makePolicy(overrides: Record<string, any> = {}) {
  const admission: Record<string, any> = {
    authorized_corridor: ["phase-49p", "phase-49q", "phase-50a", "phase-50b"],
    maximum_patch_cycles: 3,
    lease_duration_minutes: 240,
    actor_allowlist: {
      coordinator: ["chatgpt-login"],
      implementer: ["claude-login"],
      auditor: ["codex-login"],
      operator: ["eileen1337"],
      system: ["eileen1337", "github-actions[bot]"],
    },
  };
  for (const k of Object.keys(admission)) {
    if (k in overrides) admission[k] = overrides[k];
  }
  return {
    schema: "straylight.automation-policy.v2",
    mode: "shadow",
    enabled: true,
    auto_merge: false,
    automatic_estate_semantic_decisions: false,
    automatic_cross_repo_contract_changes: false,
    automatic_sibling_repo_edits: false,
    automatic_external_infrastructure: false,
    automatic_secret_use: false,
    automatic_progression_beyond_mvp2: false,
    stuck_lane_threshold_hours: 72,
    admission_history: [makeEpoch(admission)],
    ...admission,
    ...overrides,
  };
}

// One admission epoch. `overrides` may carry epoch metadata (epoch_id,
// effective_from, authorized_by, authorization_ref, note) and any of the four
// admission fields.
export function makeEpoch(overrides: Record<string, any> = {}) {
  return {
    epoch_id: EPOCH_ID,
    effective_from: EPOCH_FROM,
    authorized_by: "operator:eileen",
    authorization_ref: "test fixture: admission policy in force for the fixture timeline",
    authorized_corridor: ["phase-49p", "phase-49q", "phase-50a", "phase-50b"],
    maximum_patch_cycles: 3,
    lease_duration_minutes: 240,
    actor_allowlist: {
      coordinator: ["chatgpt-login"],
      implementer: ["claude-login"],
      auditor: ["codex-login"],
      operator: ["eileen1337"],
      system: ["eileen1337", "github-actions[bot]"],
    },
    ...overrides,
  };
}

// A policy whose admission ledger is exactly `epochs` and which carries NO
// top-level projection at all — the shape that proves the reducer reads
// admission policy only from the resolved epoch (a stray read of
// `policy.authorized_corridor` here throws or silently mis-adjudicates).
export function makeEpochPolicy(epochs: Record<string, any>[], overrides: Record<string, any> = {}) {
  const {
    authorized_corridor, maximum_patch_cycles, lease_duration_minutes, actor_allowlist,
    ...rest
  } = makePolicy(overrides) as Record<string, any>;
  return { ...rest, admission_history: epochs };
}

// States in which the lane working branch has been established by the
// initial coordinator packet (everything from ready-for-claude onward).
const BRANCH_ESTABLISHED_STATES = new Set([
  "ready-for-claude", "claude-working", "ready-for-codex", "codex-working",
  "eligibility-pending", "ready-for-merge", "merged", "patch-required",
  "lease-expired",
]);

export function makeLane(overrides: Record<string, any> = {}) {
  const state = overrides.state ?? "planning";
  return {
    schema: "straylight.lane.v1",
    lane_id: "lane-phase-49p",
    phase: "phase-49p",
    authorized_corridor: ["phase-49p", "phase-49q", "phase-50a", "phase-50b"],
    repository: REPO,
    base_branch: "main",
    base_sha: BASE_SHA,
    tier: "tier-1",
    authority_bearing: false,
    state,
    // next_actor is a projection of state; the validator refuses records
    // whose next_actor disagrees, so the fixture derives it by default.
    next_actor: nextActorFor(state),
    working_branch: BRANCH_ESTABLISHED_STATES.has(state) ? WORKING_BRANCH : null,
    pr_number: null,
    pr_head_sha: null,
    audited_sha: null,
    verdict: null,
    attempt: 0,
    patch_cycle: 0,
    mode: "shadow",
    auto_merge_allowed: false,
    operator_pause: false,
    operator_required_reason: null,
    lease: null,
    event_sequence: 0,
    last_transition: null,
    ...overrides,
  };
}

let eventCounter = 0;
export function makeEvent(overrides: Record<string, any> = {}) {
  eventCounter += 1;
  return {
    schema: "straylight.event.v1",
    event_id: `evt-test-${eventCounter}`,
    lane_id: "lane-phase-49p",
    sequence: 1,
    actor_role: "coordinator",
    github_actor: "chatgpt-login",
    event_type: "lane.activated",
    prior_state: "planning",
    occurred_at: NOW,
    ...overrides,
  };
}

export function makeTaskPacket(overrides: Record<string, any> = {}) {
  return {
    schema: "straylight.task-packet.v1",
    lane_id: "lane-phase-49p",
    authority_basis: "ADR-050 corridor phase-49p; ADR-049 §10 step 3",
    base_sha: BASE_SHA,
    repository: REPO,
    target_branch: WORKING_BRANCH,
    allowed_paths: ["docs/decisions/", "docs/handoffs/"],
    forbidden_paths: [".loa", ".claude", "src/", ".github/workflows/post-merge.yml"],
    capability_success_condition:
      "Sibling gate 9/10 evidence responses intaken as evidence with receipts",
    non_goals: ["No gate #8 disposition", "No Railway acceptance"],
    required_tests: ["npm test"],
    required_negative_tests: ["intake refuses unmerged sibling evidence"],
    required_no_leak_checks: ["git diff --check", "no secrets in diff"],
    required_completion_report: "Completion report per ADR-050 protocol",
    stop_conditions: ["Any authority uncertainty", "Any scope conflict"],
    may_open_pr: true,
    merge_forbidden: true,
    expected_next_actor: "auditor",
    packet_kind: "initial",
    patch_cycle: 0,
    ...overrides,
  };
}

export function makeAuditRecord(overrides: Record<string, any> = {}) {
  // next_actor must agree with the verdict and retryability
  // (validateAuditRecord enforces: ACCEPT -> system [eligibility-pending
  // awaits the durable confirmation], PATCH -> coordinator, REJECT ->
  // operator, CANNOT_AUDIT -> auditor when retryable else operator). Derive
  // it from the (possibly overridden) fields unless the caller sets it.
  const verdict = overrides.verdict ?? "ACCEPT";
  const retryable = overrides.retryable;
  const nextForVerdict =
    verdict === "ACCEPT" ? "system"
    : verdict === "PATCH" ? "coordinator"
    : verdict === "CANNOT_AUDIT" ? (retryable === true ? "auditor" : "operator")
    : "operator";
  return {
    schema: "straylight.audit.v1",
    lane_id: "lane-phase-49p",
    pr_number: 120,
    base_branch: "main",
    base_sha: BASE_SHA,
    head_branch: WORKING_BRANCH,
    audited_head_sha: HEAD_SHA,
    complete_diff_reviewed: true,
    changed_files: ["docs/decisions/PHASE-49P-INTAKE.md"],
    verdict: "ACCEPT",
    concerns: [],
    validation_summary: "npm test green; docs-only diff",
    audit_committed_in_pr: false,
    next_actor: nextForVerdict,
    ...overrides,
  };
}

export function makeLease(overrides: Record<string, any> = {}) {
  return {
    lane_id: "lane-phase-49p",
    actor_role: "implementer",
    lease_id: "lease-claude-1",
    holder_login: "claude-login",
    grant_sequence: 3,
    acquired_at: NOW,
    expires_at: LEASE_EXPIRY,
    expected_state: "claude-working",
    ...overrides,
  };
}

// The complete authoritative live PR metadata object, as embedded durably
// in a system.eligibility_confirmed event by the reducer workflow.
export function liveMeta(overrides: Record<string, any> = {}) {
  return {
    fetch_ok: true,
    repository: REPO,
    pr_number: 120,
    state: "open",
    draft: false,
    merged: false,
    base_branch: "main",
    base_sha: BASE_SHA,
    head_branch: WORKING_BRANCH,
    head_sha: HEAD_SHA,
    ...overrides,
  };
}

// A system.eligibility_confirmed event with embedded live metadata.
export function makeConfirmEvent(overrides: Record<string, any> = {}, metaOverrides: Record<string, any> = {}) {
  return makeEvent({
    actor_role: "system",
    github_actor: "github-actions[bot]",
    event_type: "system.eligibility_confirmed",
    prior_state: "eligibility-pending",
    pr_metadata: liveMeta(metaOverrides),
    ...overrides,
  });
}

// A lane mid-flight in claude-working with an active implementer lease.
export function laneClaudeWorking(overrides: Record<string, any> = {}) {
  return makeLane({
    state: "claude-working",
    event_sequence: 3,
    attempt: 1,
    lease: makeLease(),
    ...overrides,
  });
}

// A lane in codex-working with an active auditor lease and a recorded PR.
export function laneCodexWorking(overrides: Record<string, any> = {}) {
  return makeLane({
    state: "codex-working",
    event_sequence: 5,
    attempt: 1,
    pr_number: 120,
    pr_head_sha: HEAD_SHA,
    lease: makeLease({ actor_role: "auditor", lease_id: "lease-codex-1", holder_login: "codex-login", grant_sequence: 5, expected_state: "codex-working" }),
    ...overrides,
  });
}

// A lane whose ACCEPT audit is recorded but not yet confirmed against live
// PR metadata (awaiting system.eligibility_confirmed).
export function laneEligibilityPending(overrides: Record<string, any> = {}) {
  return makeLane({
    state: "eligibility-pending",
    event_sequence: 6,
    attempt: 1,
    pr_number: 120,
    pr_head_sha: HEAD_SHA,
    audited_sha: HEAD_SHA,
    verdict: "ACCEPT",
    ...overrides,
  });
}
