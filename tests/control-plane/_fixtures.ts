// Shared fixtures for the control-plane test suite.
// Everything here mirrors the published v1 contracts in .straylight/schemas/.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { payloadDigest } from "../../.straylight/lib/canonical.mjs";
import { nextActorFor } from "../../.straylight/lib/state-machine.mjs";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { policyAuthorityDigest } from "../../.straylight/lib/write-authority.mjs";

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

// The fixture admission epoch's id is deliberately NOT a production accepted
// epoch id. ACCEPTED_ADMISSION_EPOCH_LOCKS pins the real history, so a fixture
// policy claiming "epoch-001" must fail closed (proved in
// tests/control-plane/admission-epochs.test.ts) — the fixtures must therefore
// never borrow an accepted id, and the suite must never be able to make one
// pass by adjusting a fixture.
export const FIXTURE_EPOCH_ID = "epoch-900";
// Boundary well before NOW so every fixture event resolves to this epoch, and
// late enough to be an obviously synthetic test value.
export const FIXTURE_EPOCH_FROM = "2026-07-01T00:00:00Z";

const FIXTURE_ALLOWLIST = {
  coordinator: ["chatgpt-login"],
  implementer: ["claude-login"],
  auditor: ["codex-login"],
  operator: ["eileen1337"],
  system: ["eileen1337", "github-actions[bot]"],
};
const FIXTURE_CORRIDOR = ["phase-49p", "phase-49q", "phase-50a", "phase-50b"];

// One admission epoch. Callers override individual fields to build adversarial
// histories (edited content, bad boundaries, duplicate ids).
export function makeEpoch(overrides: Record<string, any> = {}) {
  return {
    epoch_id: FIXTURE_EPOCH_ID,
    governs_from: FIXTURE_EPOCH_FROM,
    authorized_corridor: [...FIXTURE_CORRIDOR],
    maximum_patch_cycles: 3,
    lease_duration_minutes: 240,
    actor_allowlist: structuredClone(FIXTURE_ALLOWLIST),
    provenance: {
      attributed_to: "test-fixture",
      reference: "tests/control-plane/_fixtures.ts (synthetic epoch; not protocol history)",
    },
    ...overrides,
  };
}

// A v2 policy. The four admission fields exist at top level as the REQUIRED
// current-policy projection AND inside a single admission epoch, and
// validatePolicy demands they be deep-equal — so overriding one (the way most
// of this suite exercises admission policy) must change both. Overriding
// `admission_history` explicitly takes full control of the history instead.
export function makePolicy(overrides: Record<string, any> = {}) {
  const policy: Record<string, any> = {
    schema: "straylight.automation-policy.v2",
    mode: "shadow",
    enabled: true,
    auto_merge: false,
    authorized_corridor: [...FIXTURE_CORRIDOR],
    automatic_estate_semantic_decisions: false,
    automatic_cross_repo_contract_changes: false,
    automatic_sibling_repo_edits: false,
    automatic_external_infrastructure: false,
    automatic_secret_use: false,
    automatic_progression_beyond_mvp2: false,
    maximum_patch_cycles: 3,
    lease_duration_minutes: 240,
    stuck_lane_threshold_hours: 72,
    actor_allowlist: structuredClone(FIXTURE_ALLOWLIST),
    ...overrides,
  };
  if (!("admission_history" in overrides)) {
    policy.admission_history = [
      makeEpoch({
        authorized_corridor: policy.authorized_corridor,
        maximum_patch_cycles: policy.maximum_patch_cycles,
        lease_duration_minutes: policy.lease_duration_minutes,
        actor_allowlist: policy.actor_allowlist,
      }),
    ];
  }
  return policy;
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

// ---------------------------------------------------------------------------
// H-02 WRITE AUTHORITY (Codex H-02)
//
// Every production write plan carries `authority: { source_main_sha,
// policy_digest }`, and the executor re-establishes both from GitHub before
// EVERY mutation. Tests therefore need two things: a plan-side authority block,
// and the three read-only responses that make it current.
//
// The policy digest is computed over the REAL COMMITTED POLICY, not over a
// fixture policy. It has to be: the executor accepts those bytes through
// `acceptCommittedPolicyText`, which enforces the production accepted-epoch
// digest locks, and FIXTURE_EPOCH_ID ("epoch-900") can never satisfy them. So
// the mock's committed-policy response serves the repository's own file and the
// digest is derived from it — one source of truth, nothing to keep in sync.
// ---------------------------------------------------------------------------

// A synthetic but well-formed main commit. 40 lowercase hex; a branch name is
// never acceptable anywhere in the authority path.
export const MAIN_SHA = "7c9b1f0a4d3e2b5c6a89f0e1d2c3b4a5968778e9";

export const COMMITTED_POLICY_TEXT = readFileSync(
  new URL("../../.straylight/automation-policy.json", import.meta.url),
  "utf8",
);

export const COMMITTED_POLICY_DIGEST = (() => {
  const parsed = parseStrict(COMMITTED_POLICY_TEXT);
  if (!parsed.ok) throw new Error(`.straylight/automation-policy.json is not strict JSON: ${parsed.reason}`);
  return policyAuthorityDigest(parsed.value);
})();

/** The plan-side authority block. Overrides let a test stale exactly one field. */
export function planAuthority(overrides: Record<string, any> = {}) {
  return { source_main_sha: MAIN_SHA, policy_digest: COMMITTED_POLICY_DIGEST, ...overrides };
}

/**
 * The three read-only GET responses the executor's authority revalidation
 * makes, keyed by the exact path it constructs. Serialized as the mock `gh`
 * would print them.
 */
export function authorityResponses(
  {
    repository = REPO,
    main_sha = MAIN_SHA,
    default_branch = "main",
    policy_text = COMMITTED_POLICY_TEXT,
  }: {
    repository?: string;
    main_sha?: string;
    default_branch?: string;
    policy_text?: string;
  } = {},
) {
  const content = Buffer.from(policy_text, "utf8").toString("base64");
  return {
    metadata: JSON.stringify({ full_name: repository, default_branch }),
    ref: JSON.stringify({ ref: "refs/heads/main", object: { type: "commit", sha: main_sha } }),
    // GitHub wraps contents base64 at 60 columns; the decoder strips newlines
    // and then requires the encoding to be canonical, so wrapping here keeps the
    // fixture faithful to the real response shape.
    contents: JSON.stringify({
      type: "file",
      path: ".straylight/automation-policy.json",
      encoding: "base64",
      size: Buffer.byteLength(policy_text, "utf8"),
      content: (content.match(/.{1,60}/g) ?? []).join("\n") + "\n",
    }),
  };
}

// ---------------------------------------------------------------------------
// THE WORKFLOW TREE AT AN EXACT COMMIT (Codex quiescence-provenance)
//
// The write-capable workflow set is derived from the workflow bytes committed at
// the frozen revision, fetched from GitHub — never from the local checkout. These
// build the two response shapes that derivation reads: the `?ref=<sha>` directory
// listing, and each file inside it. The blob id is a REAL git blob id so the
// listing entry and the file response agree the way GitHub's do (the protocol
// binds one to the other, and a fixture that faked the id would not exercise it).
// ---------------------------------------------------------------------------

export function gitBlobSha(text: string): string {
  const bytes = Buffer.from(text, "utf8");
  return createHash("sha1")
    .update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`, "utf8"), bytes]))
    .digest("hex");
}

/** GET .../contents/.github/workflows?ref=<sha> — a JSON ARRAY of entries. */
export function workflowDirectoryResponse(
  files: Array<{ name: string; text: string }>,
  extraEntries: Record<string, any>[] = [],
): string {
  return JSON.stringify([
    ...files.map((f) => ({
      type: "file",
      name: f.name,
      path: `.github/workflows/${f.name}`,
      sha: gitBlobSha(f.text),
      size: Buffer.byteLength(f.text, "utf8"),
    })),
    ...extraEntries,
  ]);
}

/** GET .../contents/.github/workflows/<name>?ref=<sha> — one workflow's bytes. */
export function workflowFileResponse(
  name: string,
  text: string,
  overrides: Record<string, any> = {},
): string {
  const content = Buffer.from(text, "utf8").toString("base64");
  return JSON.stringify({
    type: "file",
    path: `.github/workflows/${name}`,
    sha: gitBlobSha(text),
    encoding: "base64",
    size: Buffer.byteLength(text, "utf8"),
    content: (content.match(/.{1,60}/g) ?? []).join("\n") + "\n",
    ...overrides,
  });
}
