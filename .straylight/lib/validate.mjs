// Straylight Control Plane v1 — structural validators (pure, fail-closed).
//
// Deliberately dependency-free: a tiny explicit validator per record type
// instead of a JSON-Schema engine, so no new runtime dependency is needed.
// The JSON Schema files under .straylight/schemas/ are the published
// contract; these validators implement the same constraints. The
// schema/validator sync is pinned by tests/control-plane/
// policy-and-no-leak.test.ts ("schema/validator contract sync"): every
// schema-required field, every v1 const invariant, and the shared
// pattern constants below are cross-checked against the schema files.
//
// Every function returns { ok: true, value } or { ok: false, errors: [...] }.
// Unknown/missing/mistyped fields are errors, never warnings.

import { STATES, ROLES, VERDICTS, isState, isRole } from "./state-machine.mjs";

const LANE_ID_RE = /^lane-[a-z0-9][a-z0-9-]{1,62}$/;
const PHASE_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH_RE = /^[A-Za-z0-9._/-]{1,200}$/;
const LEASE_ID_RE = /^lease-[a-z0-9][a-z0-9-]{1,62}$/;
const EVENT_ID_RE = /^evt-[a-z0-9][a-z0-9-]{1,62}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const GH_LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}(\[bot\])?$/;
const RELATIVE_PATH_RE = /^(?!\/)(?!.*\.\.)[\x20-\x7E]{1,300}$/;

function checkString(errors, obj, key, re, { optional = false, maxLength } = {}) {
  const v = obj[key];
  if (v === undefined || v === null) {
    if (!optional) errors.push(`${key}: missing`);
    return;
  }
  if (typeof v !== "string") {
    errors.push(`${key}: not a string`);
    return;
  }
  if (re && !re.test(v)) errors.push(`${key}: malformed (${JSON.stringify(v.slice(0, 80))})`);
  if (maxLength !== undefined && v.length > maxLength) {
    errors.push(`${key}: exceeds maxLength ${maxLength}`);
  }
}

function checkEnum(errors, obj, key, values, { optional = false } = {}) {
  const v = obj[key];
  if (v === undefined || v === null) {
    if (!optional) errors.push(`${key}: missing`);
    return;
  }
  if (!values.includes(v)) errors.push(`${key}: not one of ${values.join("|")}`);
}

function checkInt(errors, obj, key, { min = 0, optional = false } = {}) {
  const v = obj[key];
  if (v === undefined || v === null) {
    if (!optional) errors.push(`${key}: missing`);
    return;
  }
  if (!Number.isInteger(v) || v < min) errors.push(`${key}: not an integer >= ${min}`);
}

function checkBool(errors, obj, key, { optional = false } = {}) {
  const v = obj[key];
  if (v === undefined || v === null) {
    if (!optional) errors.push(`${key}: missing`);
    return;
  }
  if (typeof v !== "boolean") errors.push(`${key}: not a boolean`);
}

function checkStringArray(errors, obj, key, re, { optional = false, minItems = 0 } = {}) {
  const v = obj[key];
  if (v === undefined || v === null) {
    if (!optional) errors.push(`${key}: missing`);
    return;
  }
  if (!Array.isArray(v)) {
    errors.push(`${key}: not an array`);
    return;
  }
  if (v.length < minItems) errors.push(`${key}: fewer than ${minItems} items`);
  v.forEach((item, i) => {
    if (typeof item !== "string" || (re && !re.test(item))) {
      errors.push(`${key}[${i}]: malformed`);
    }
  });
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function result(errors, value) {
  return errors.length === 0 ? { ok: true, value } : { ok: false, errors };
}

// ---------------------------------------------------------------------------
// Lease
// ---------------------------------------------------------------------------

export function validateLease(v) {
  const errors = [];
  if (!isPlainObject(v)) return { ok: false, errors: ["lease: not an object"] };
  checkString(errors, v, "lane_id", LANE_ID_RE);
  checkEnum(errors, v, "actor_role", ["implementer", "auditor"]);
  checkString(errors, v, "lease_id", LEASE_ID_RE);
  checkInt(errors, v, "grant_sequence", { min: 1 });
  checkString(errors, v, "acquired_at", ISO_RE);
  checkString(errors, v, "expires_at", ISO_RE);
  checkEnum(errors, v, "expected_state", STATES);
  if (errors.length === 0 && v.expires_at <= v.acquired_at) {
    errors.push("expires_at: not after acquired_at");
  }
  return result(errors, v);
}

// ---------------------------------------------------------------------------
// Lane (schema: lane-v1.schema.json)
// ---------------------------------------------------------------------------

export function validateLane(v) {
  const errors = [];
  if (!isPlainObject(v)) return { ok: false, errors: ["lane: not an object"] };
  checkEnum(errors, v, "schema", ["straylight.lane.v1"]);
  checkString(errors, v, "lane_id", LANE_ID_RE);
  checkString(errors, v, "phase", PHASE_RE);
  checkStringArray(errors, v, "authorized_corridor", PHASE_RE, { minItems: 1 });
  checkString(errors, v, "repository", REPO_RE);
  checkString(errors, v, "base_branch", BRANCH_RE);
  checkString(errors, v, "base_sha", SHA_RE);
  checkEnum(errors, v, "tier", ["tier-0", "tier-1", "tier-2", "tier-3"]);
  checkBool(errors, v, "authority_bearing");
  checkEnum(errors, v, "state", STATES);
  checkEnum(errors, v, "next_actor", [...ROLES, "none"]);
  checkString(errors, v, "working_branch", BRANCH_RE, { optional: true });
  checkInt(errors, v, "pr_number", { min: 1, optional: true });
  checkString(errors, v, "pr_head_sha", SHA_RE, { optional: true });
  checkString(errors, v, "audited_sha", SHA_RE, { optional: true });
  checkEnum(errors, v, "verdict", VERDICTS, { optional: true });
  checkInt(errors, v, "attempt", { min: 0 });
  checkInt(errors, v, "patch_cycle", { min: 0 });
  checkInt(errors, v, "audit_retry", { min: 0, optional: true });
  checkEnum(errors, v, "mode", ["shadow", "active"]);
  checkBool(errors, v, "auto_merge_allowed");
  checkBool(errors, v, "operator_pause");
  checkString(errors, v, "operator_required_reason", null, { optional: true, maxLength: 4000 });
  checkEnum(errors, v, "last_lease_role", ["implementer", "auditor"], { optional: true });
  if (v.lease !== undefined && v.lease !== null) {
    const lease = validateLease(v.lease);
    if (!lease.ok) errors.push(...lease.errors.map((e) => `lease.${e}`));
  }
  checkInt(errors, v, "event_sequence", { min: 0 });
  checkString(errors, v, "last_transition", null, { optional: true });
  // v1 invariant: shadow mode + no auto-merge, enforced at parse time so a
  // hand-edited lane cannot smuggle active mode past the reducer.
  if (v.mode === "active") errors.push("mode: 'active' is not permitted in control plane v1");
  if (v.auto_merge_allowed === true) errors.push("auto_merge_allowed: must be false in control plane v1");
  if (typeof v.phase === "string" && Array.isArray(v.authorized_corridor) &&
      !v.authorized_corridor.includes(v.phase)) {
    errors.push("phase: not inside authorized_corridor");
  }
  return result(errors, v);
}

// ---------------------------------------------------------------------------
// Event (schema: event-v1.schema.json)
// ---------------------------------------------------------------------------

export function validateEvent(v) {
  const errors = [];
  if (!isPlainObject(v)) return { ok: false, errors: ["event: not an object"] };
  checkEnum(errors, v, "schema", ["straylight.event.v1"]);
  checkString(errors, v, "event_id", EVENT_ID_RE);
  checkString(errors, v, "lane_id", LANE_ID_RE);
  checkInt(errors, v, "sequence", { min: 1 });
  checkEnum(errors, v, "actor_role", ROLES);
  checkString(errors, v, "github_actor", GH_LOGIN_RE);
  checkString(errors, v, "event_type", /^[a-z_]+\.[a-z_]+$/);
  checkEnum(errors, v, "prior_state", STATES);
  checkEnum(errors, v, "requested_state", STATES, { optional: true });
  checkString(errors, v, "base_sha", SHA_RE, { optional: true });
  checkString(errors, v, "head_sha", SHA_RE, { optional: true });
  checkString(errors, v, "audited_sha", SHA_RE, { optional: true });
  checkEnum(errors, v, "verdict", VERDICTS, { optional: true });
  checkString(errors, v, "lease_id", LEASE_ID_RE, { optional: true });
  checkString(errors, v, "lease_expires_at", ISO_RE, { optional: true });
  checkInt(errors, v, "attempt", { min: 0, optional: true });
  checkInt(errors, v, "patch_cycle", { min: 0, optional: true });
  checkString(errors, v, "reason", null, { optional: true, maxLength: 4000 });
  checkString(errors, v, "occurred_at", ISO_RE);
  if (v.refs !== undefined && v.refs !== null) {
    if (!isPlainObject(v.refs)) {
      errors.push("refs: not an object");
    } else {
      checkInt(errors, v.refs, "task_packet_comment_id", { min: 1, optional: true });
      checkInt(errors, v.refs, "pr_number", { min: 1, optional: true });
      checkInt(errors, v.refs, "audit_comment_id", { min: 1, optional: true });
    }
  }
  return result(errors, v);
}

// ---------------------------------------------------------------------------
// Task packet (schema: task-packet-v1.schema.json)
// ---------------------------------------------------------------------------

export function validateTaskPacket(v) {
  const errors = [];
  if (!isPlainObject(v)) return { ok: false, errors: ["task_packet: not an object"] };
  checkEnum(errors, v, "schema", ["straylight.task-packet.v1"]);
  checkString(errors, v, "lane_id", LANE_ID_RE);
  checkString(errors, v, "authority_basis", null);
  checkString(errors, v, "base_sha", SHA_RE);
  checkString(errors, v, "repository", REPO_RE);
  checkString(errors, v, "target_branch", BRANCH_RE);
  checkStringArray(errors, v, "allowed_paths", RELATIVE_PATH_RE, { minItems: 1 });
  checkStringArray(errors, v, "forbidden_paths", RELATIVE_PATH_RE);
  checkString(errors, v, "capability_success_condition", null);
  checkStringArray(errors, v, "non_goals", null, { minItems: 1 });
  checkStringArray(errors, v, "required_tests", null, { minItems: 1 });
  checkStringArray(errors, v, "required_negative_tests", null, { minItems: 1 });
  checkStringArray(errors, v, "required_no_leak_checks", null, { minItems: 1 });
  checkString(errors, v, "required_completion_report", null);
  checkStringArray(errors, v, "stop_conditions", null, { minItems: 1 });
  checkBool(errors, v, "may_open_pr");
  checkBool(errors, v, "merge_forbidden");
  checkEnum(errors, v, "expected_next_actor", ROLES);
  checkEnum(errors, v, "packet_kind", ["initial", "patch"]);
  checkInt(errors, v, "patch_cycle", { min: 0 });
  // v1 invariant: a task packet can never authorize a merge.
  if (v.merge_forbidden === false) {
    errors.push("merge_forbidden: must be true in control plane v1");
  }
  return result(errors, v);
}

// ---------------------------------------------------------------------------
// Audit record (schema: audit-v1.schema.json)
// ---------------------------------------------------------------------------

export function validateAuditRecord(v) {
  const errors = [];
  if (!isPlainObject(v)) return { ok: false, errors: ["audit: not an object"] };
  checkEnum(errors, v, "schema", ["straylight.audit.v1"]);
  checkString(errors, v, "lane_id", LANE_ID_RE);
  checkInt(errors, v, "pr_number", { min: 1 });
  checkString(errors, v, "base_branch", BRANCH_RE);
  checkString(errors, v, "base_sha", SHA_RE);
  checkString(errors, v, "head_branch", BRANCH_RE);
  checkString(errors, v, "audited_head_sha", SHA_RE);
  checkBool(errors, v, "complete_diff_reviewed");
  checkStringArray(errors, v, "changed_files", null, { minItems: 1 });
  checkEnum(errors, v, "verdict", VERDICTS);
  if (v.concerns !== undefined && v.concerns !== null) {
    if (!Array.isArray(v.concerns)) {
      errors.push("concerns: not an array");
    } else {
      v.concerns.forEach((c, i) => {
        if (!isPlainObject(c)) {
          errors.push(`concerns[${i}]: not an object`);
          return;
        }
        checkEnum(errors, c, "severity", ["blocker", "high", "medium", "low"]);
        checkString(errors, c, "location", null);
        checkString(errors, c, "description", null);
      });
    }
  } else if (v.verdict === "PATCH" || v.verdict === "REJECT") {
    errors.push("concerns: required for PATCH/REJECT verdicts");
  }
  checkString(errors, v, "validation_summary", null);
  checkBool(errors, v, "audit_committed_in_pr");
  checkBool(errors, v, "retryable", { optional: true });
  checkEnum(errors, v, "next_actor", [...ROLES, "none"]);
  // The PR #116 lesson, enforced structurally: an audit that reports itself
  // as committed inside the audited PR is invalid regardless of verdict.
  if (v.audit_committed_in_pr === true) {
    errors.push("audit_committed_in_pr: audit committed into audited PR invalidates the audit (ADR-050 §5.3)");
  }
  if ((v.verdict === "PATCH" || v.verdict === "REJECT") &&
      Array.isArray(v.concerns) && v.concerns.length === 0) {
    errors.push("concerns: must be non-empty for PATCH/REJECT verdicts");
  }
  return result(errors, v);
}

// ---------------------------------------------------------------------------
// Automation policy (automation-policy.json)
// ---------------------------------------------------------------------------

export function validatePolicy(v) {
  const errors = [];
  if (!isPlainObject(v)) return { ok: false, errors: ["policy: not an object"] };
  checkEnum(errors, v, "schema", ["straylight.automation-policy.v1"]);
  checkEnum(errors, v, "mode", ["shadow"]);
  checkBool(errors, v, "enabled");
  checkBool(errors, v, "auto_merge");
  checkStringArray(errors, v, "authorized_corridor", PHASE_RE, { minItems: 1 });
  checkBool(errors, v, "automatic_estate_semantic_decisions");
  checkBool(errors, v, "automatic_cross_repo_contract_changes");
  checkBool(errors, v, "automatic_sibling_repo_edits");
  checkBool(errors, v, "automatic_external_infrastructure");
  checkBool(errors, v, "automatic_secret_use");
  checkBool(errors, v, "automatic_progression_beyond_mvp2");
  checkInt(errors, v, "maximum_patch_cycles", { min: 1 });
  checkInt(errors, v, "lease_duration_minutes", { min: 1 });
  checkInt(errors, v, "stuck_lane_threshold_hours", { min: 1 });
  if (!isPlainObject(v.actor_allowlist)) {
    errors.push("actor_allowlist: missing or not an object");
  } else {
    for (const role of ["coordinator", "implementer", "auditor", "operator", "system"]) {
      checkStringArray(errors, v.actor_allowlist, role, GH_LOGIN_RE, { minItems: 1 });
    }
    // The mechanical CI identity must never hold operator authority: an
    // operator-role event from a workflow-posted comment would let repo
    // automation exercise the operator's exclusive powers (ADR-050 §3).
    const ops = v.actor_allowlist.operator;
    if (Array.isArray(ops) && ops.some((l) => typeof l === "string" && l.endsWith("[bot]"))) {
      errors.push("actor_allowlist.operator: bot identities are forbidden in the operator role");
    }
  }
  // Hard v1 invariants: these fields exist so that flipping them is loud,
  // but v1 refuses to run with them flipped.
  if (v.auto_merge === true) errors.push("auto_merge: must be false in control plane v1");
  for (const k of [
    "automatic_estate_semantic_decisions",
    "automatic_cross_repo_contract_changes",
    "automatic_sibling_repo_edits",
    "automatic_external_infrastructure",
    "automatic_secret_use",
    "automatic_progression_beyond_mvp2",
  ]) {
    if (v[k] === true) errors.push(`${k}: must be false in control plane v1`);
  }
  return result(errors, v);
}
