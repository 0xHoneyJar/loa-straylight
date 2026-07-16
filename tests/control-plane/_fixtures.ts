// Shared fixtures for the control-plane test suite.
// Everything here mirrors the published v1 contracts in .straylight/schemas/.

export const BASE_SHA = "009c4afe34f3f7151db4239fe1c69898833440bb";
export const HEAD_SHA = "a93e9f3694c3b8e5f7e6839856b9f347998a49ad";
export const OTHER_SHA = "1111111111111111111111111111111111111111";

export const NOW = "2026-07-16T12:00:00Z";
export const LEASE_EXPIRY = "2026-07-16T16:00:00Z";
export const AFTER_EXPIRY = "2026-07-16T17:00:00Z";

export function makePolicy(overrides: Record<string, any> = {}) {
  return {
    schema: "straylight.automation-policy.v1",
    mode: "shadow",
    enabled: true,
    auto_merge: false,
    authorized_corridor: ["phase-49p", "phase-49q", "phase-50a", "phase-50b"],
    automatic_estate_semantic_decisions: false,
    automatic_cross_repo_contract_changes: false,
    automatic_sibling_repo_edits: false,
    automatic_external_infrastructure: false,
    automatic_secret_use: false,
    automatic_progression_beyond_mvp2: false,
    maximum_patch_cycles: 3,
    lease_duration_minutes: 240,
    stuck_lane_threshold_hours: 72,
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

export function makeLane(overrides: Record<string, any> = {}) {
  return {
    schema: "straylight.lane.v1",
    lane_id: "lane-phase-49p",
    phase: "phase-49p",
    authorized_corridor: ["phase-49p", "phase-49q", "phase-50a", "phase-50b"],
    repository: "0xHoneyJar/loa-straylight",
    base_branch: "main",
    base_sha: BASE_SHA,
    tier: "tier-1",
    authority_bearing: false,
    state: "planning",
    next_actor: "coordinator",
    working_branch: null,
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
    repository: "0xHoneyJar/loa-straylight",
    target_branch: "phase-49p-sibling-evidence-intake",
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
  // next_actor must agree with the verdict (validateAuditRecord enforces:
  // ACCEPT/REJECT/CANNOT_AUDIT -> operator, PATCH -> coordinator). Derive it
  // from the (possibly overridden) verdict unless the caller sets it.
  const verdict = overrides.verdict ?? "ACCEPT";
  const nextForVerdict = verdict === "PATCH" ? "coordinator" : "operator";
  return {
    schema: "straylight.audit.v1",
    lane_id: "lane-phase-49p",
    pr_number: 120,
    base_branch: "main",
    base_sha: BASE_SHA,
    head_branch: "phase-49p-sibling-evidence-intake",
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

// A lane mid-flight in claude-working with an active implementer lease.
export function laneClaudeWorking(overrides: Record<string, any> = {}) {
  return makeLane({
    state: "claude-working",
    next_actor: "implementer",
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
    next_actor: "auditor",
    event_sequence: 5,
    attempt: 1,
    pr_number: 120,
    pr_head_sha: HEAD_SHA,
    lease: makeLease({ actor_role: "auditor", lease_id: "lease-codex-1", holder_login: "codex-login", grant_sequence: 5, expected_state: "codex-working" }),
    ...overrides,
  });
}
