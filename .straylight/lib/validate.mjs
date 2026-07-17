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

import { STATES, ROLES, VERDICTS, isState, isRole, nextActorFor } from "./state-machine.mjs";

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
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

// Strict UTC calendar instant: the ISO shape AND a real calendar date/time.
// A regex alone accepts 2026-13-40T25:61:99Z; this rejects impossible months,
// days (leap-year aware), hours, minutes, and seconds, and requires the `Z`
// zone (no other offset is permitted in v1). Returns epoch millis or null.
export function parseIsoInstant(s) {
  if (typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?Z$/.exec(s);
  if (!m) return null;
  const year = +m[1], month = +m[2], day = +m[3], hour = +m[4], min = +m[5], sec = +m[6];
  if (month < 1 || month > 12) return null;
  if (hour > 23 || min > 59 || sec > 59) return null; // leap seconds not accepted
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;
  const frac = m[7] ? Number(m[7]) : 0; // fractional seconds
  const t = Date.UTC(year, month - 1, day, hour, min, sec) + Math.round(frac * 1000);
  return Number.isNaN(t) ? null : t;
}

// Validate a field as a strict UTC calendar instant (see parseIsoInstant).
function checkTimestamp(errors, obj, key, { optional = false } = {}) {
  const v = obj[key];
  if (v === undefined || v === null) {
    if (!optional) errors.push(`${key}: missing`);
    return;
  }
  if (typeof v !== "string") {
    errors.push(`${key}: not a string`);
    return;
  }
  if (parseIsoInstant(v) === null) {
    errors.push(`${key}: not a valid UTC calendar instant (${JSON.stringify(v.slice(0, 40))})`);
  }
}

function checkString(errors, obj, key, re, { optional = false, maxLength, minLength } = {}) {
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
  if (minLength !== undefined && v.trim().length < minLength) {
    errors.push(`${key}: shorter than minLength ${minLength} (after trim)`);
  }
}

// A string array whose ITEMS must each be substantive (non-blank), used for
// task-packet semantic fields that must not be smuggled through as [""].
function checkNonEmptyStringArray(errors, obj, key, { minItems = 1 } = {}) {
  const v = obj[key];
  if (v === undefined || v === null) {
    errors.push(`${key}: missing`);
    return;
  }
  if (!Array.isArray(v)) {
    errors.push(`${key}: not an array`);
    return;
  }
  if (v.length < minItems) errors.push(`${key}: fewer than ${minItems} items`);
  v.forEach((item, i) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      errors.push(`${key}[${i}]: not a substantive (non-blank) string`);
    }
  });
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
  checkString(errors, v, "holder_login", GH_LOGIN_RE);
  checkInt(errors, v, "grant_sequence", { min: 1 });
  checkTimestamp(errors, v, "acquired_at");
  checkTimestamp(errors, v, "expires_at");
  checkEnum(errors, v, "expected_state", STATES);
  // A lease's expected_state is DERIVED from its holder role: an implementer
  // lease exists only while the lane is claude-working, an auditor lease only
  // while codex-working. A lease claiming any other expected state is
  // structurally inconsistent (cross-state lease) and fails closed.
  if (v.actor_role === "implementer" && v.expected_state !== "claude-working") {
    errors.push("expected_state: implementer lease must expect claude-working");
  }
  if (v.actor_role === "auditor" && v.expected_state !== "codex-working") {
    errors.push("expected_state: auditor lease must expect codex-working");
  }
  if (errors.length === 0) {
    const acq = parseIsoInstant(v.acquired_at);
    const exp = parseIsoInstant(v.expires_at);
    if (acq !== null && exp !== null && exp <= acq) {
      errors.push("expires_at: not after acquired_at");
    }
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
    if (isPlainObject(v.lease)) {
      // An embedded lease must belong to THIS lane and to the lane's CURRENT
      // working state. A lease copied from another lane (cross-lane), or one
      // whose expected_state disagrees with where the lane actually is
      // (cross-state), is a corrupted or forged record and fails closed.
      if (typeof v.lease.lane_id === "string" && typeof v.lane_id === "string" &&
          v.lease.lane_id !== v.lane_id) {
        errors.push(`lease.lane_id: ${v.lease.lane_id} does not match lane ${v.lane_id} (cross-lane lease)`);
      }
      if (typeof v.lease.expected_state === "string" && typeof v.state === "string" &&
          v.lease.expected_state !== v.state) {
        errors.push(`lease.expected_state: ${v.lease.expected_state} does not match lane state ${v.state} (cross-state lease)`);
      }
    }
  }
  checkInt(errors, v, "event_sequence", { min: 0 });
  checkString(errors, v, "last_transition", null, { optional: true });
  // next_actor is a projection of state (ADR-050 §1.1). A stored record whose
  // next_actor disagrees with its state is corrupted or hand-edited; trusting
  // it would let a forged record hand the turn to the wrong role.
  if (typeof v.state === "string" && isState(v.state) &&
      v.next_actor !== undefined && v.next_actor !== null &&
      v.next_actor !== nextActorFor(v.state)) {
    errors.push(`next_actor: state ${v.state} requires next_actor ${nextActorFor(v.state)}, record claims ${v.next_actor}`);
  }
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
  checkTimestamp(errors, v, "lease_expires_at", { optional: true });
  checkInt(errors, v, "attempt", { min: 0, optional: true });
  checkInt(errors, v, "patch_cycle", { min: 0, optional: true });
  checkString(errors, v, "reason", null, { optional: true, maxLength: 4000 });
  checkTimestamp(errors, v, "occurred_at");
  checkString(errors, v, "head_branch", BRANCH_RE, { optional: true });
  if (v.refs !== undefined && v.refs !== null) {
    if (!isPlainObject(v.refs)) {
      errors.push("refs: not an object");
    } else {
      checkInt(errors, v.refs, "task_packet_comment_id", { min: 1, optional: true });
      checkInt(errors, v.refs, "pr_number", { min: 1, optional: true });
      checkInt(errors, v.refs, "audit_comment_id", { min: 1, optional: true });
      // Content digests binding the referenced artifact comment (R-digest):
      // the digest travels IN the durable event payload, so a later edit of
      // the referenced comment is detectable even if edit metadata is lost.
      checkString(errors, v.refs, "task_packet_digest", DIGEST_RE, { optional: true });
      checkString(errors, v.refs, "audit_digest", DIGEST_RE, { optional: true });
    }
  }
  // The embedded live PR metadata of a system.eligibility_confirmed event.
  // Optional at the structural layer (only that event type carries it); when
  // present it must itself be a valid metadata object. The reducer requires
  // it (fetch_ok: true) on the confirmation transition.
  if (v.pr_metadata !== undefined && v.pr_metadata !== null) {
    const pm = validatePrMetadata(v.pr_metadata);
    if (!pm.ok) errors.push(...pm.errors.map((e) => `pr_metadata.${e}`));
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
  // Semantic fields must be SUBSTANTIVE, not merely present: a blank
  // authority basis / success condition / completion-report requirement is a
  // hole an actor could slip an unbounded assignment through.
  checkString(errors, v, "authority_basis", null, { minLength: 8 });
  checkString(errors, v, "base_sha", SHA_RE);
  checkString(errors, v, "repository", REPO_RE);
  checkString(errors, v, "target_branch", BRANCH_RE);
  checkStringArray(errors, v, "allowed_paths", RELATIVE_PATH_RE, { minItems: 1 });
  checkStringArray(errors, v, "forbidden_paths", RELATIVE_PATH_RE);
  checkString(errors, v, "capability_success_condition", null, { minLength: 8 });
  checkNonEmptyStringArray(errors, v, "non_goals", { minItems: 1 });
  checkNonEmptyStringArray(errors, v, "required_tests", { minItems: 1 });
  checkNonEmptyStringArray(errors, v, "required_negative_tests", { minItems: 1 });
  checkNonEmptyStringArray(errors, v, "required_no_leak_checks", { minItems: 1 });
  checkString(errors, v, "required_completion_report", null, { minLength: 8 });
  checkNonEmptyStringArray(errors, v, "stop_conditions", { minItems: 1 });
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
  // retryable is meaningful ONLY with CANNOT_AUDIT, and there it is REQUIRED:
  // a CANNOT_AUDIT that does not declare retryability is ambiguous about its
  // own routing (requeue vs blocked), and a retryable flag on any other
  // verdict is a contradiction that could mislead a reader about routing.
  if (v.verdict === "CANNOT_AUDIT") {
    if (typeof v.retryable !== "boolean") {
      errors.push("retryable: required (boolean) for CANNOT_AUDIT verdicts");
    }
  } else if (v.retryable !== undefined && v.retryable !== null) {
    errors.push(`retryable: only meaningful for CANNOT_AUDIT, not ${v.verdict}`);
  }
  // audit_committed_in_pr is AUDITOR ATTESTATION (self-reported), not a
  // mechanical fact — the pure validator cannot see the PR file list. The
  // reducer additionally cross-checks the live PR (R4). Here we only enforce
  // that the auditor did not attest to the disqualifying PR #116 condition.
  if (v.audit_committed_in_pr === true) {
    errors.push("audit_committed_in_pr: auditor attests the audit was committed into the audited PR — invalid (ADR-050 §5.3)");
  }
  if ((v.verdict === "PATCH" || v.verdict === "REJECT") &&
      Array.isArray(v.concerns) && v.concerns.length === 0) {
    errors.push("concerns: must be non-empty for PATCH/REJECT verdicts");
  }
  // An ACCEPT with recorded concerns is contradictory: an accepted audit has
  // no blocking concerns. (Non-blocking notes belong in validation_summary.)
  if (v.verdict === "ACCEPT" && Array.isArray(v.concerns) && v.concerns.length > 0) {
    errors.push("concerns: an ACCEPT verdict must carry no concerns");
  }
  // Verdict/next_actor must not contradict the routing the reducer performs:
  // ACCEPT -> system (the lane parks in eligibility-pending until the system
  // posts a live-metadata-bearing system.eligibility_confirmed event; the
  // operator acts only after that); PATCH -> coordinator (writes the patch
  // packet); REJECT -> operator (blocked lane is operator-owned);
  // CANNOT_AUDIT -> auditor when retryable (requeued to ready-for-codex;
  // the reducer may still route an exhausted retry budget to the operator),
  // operator when terminal (blocked). A record whose declared next_actor
  // disagrees with its own verdict+retryable is self-inconsistent and refused.
  const expectedNext = {
    ACCEPT: "system",
    PATCH: "coordinator",
    REJECT: "operator",
    CANNOT_AUDIT: v.retryable === true ? "auditor" : "operator",
  }[v.verdict];
  if (expectedNext !== undefined && v.next_actor !== undefined && v.next_actor !== null &&
      v.next_actor !== expectedNext) {
    errors.push(`next_actor: ${v.verdict}${v.verdict === "CANNOT_AUDIT" ? ` (retryable ${v.retryable === true})` : ""} routes to ${expectedNext}, record claims ${v.next_actor}`);
  }
  return result(errors, v);
}

// ---------------------------------------------------------------------------
// Live PR metadata (authoritative object supplied by the adapter workflow)
// ---------------------------------------------------------------------------
//
// The single normalized description of a lane's live PR, fetched read-only by
// the reducer/watchdog/merge-guard workflows. Any missing/partial metadata is
// itself an error: callers must fail closed rather than proceed on a guess.
export function validatePrMetadata(v) {
  const errors = [];
  if (!isPlainObject(v)) return { ok: false, errors: ["pr_metadata: not an object"] };
  checkBool(errors, v, "fetch_ok");
  // When the fetch failed the only meaningful field is fetch_ok:false; every
  // other field is unknown and the record fails closed downstream.
  if (v.fetch_ok !== true) return result(errors, v);
  checkString(errors, v, "repository", REPO_RE);
  checkInt(errors, v, "pr_number", { min: 1 });
  checkEnum(errors, v, "state", ["open", "closed"]);
  checkBool(errors, v, "draft");
  checkBool(errors, v, "merged");
  checkString(errors, v, "base_branch", BRANCH_RE);
  checkString(errors, v, "base_sha", SHA_RE);
  checkString(errors, v, "head_branch", BRANCH_RE);
  checkString(errors, v, "head_sha", SHA_RE);
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
