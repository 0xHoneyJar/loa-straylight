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
import { canonicalize } from "./canonical.mjs";
import { pinnedEpochLockErrors, acceptedEpochLockErrors } from "./admission-locks.mjs";

const LANE_ID_RE = /^lane-[a-z0-9][a-z0-9-]{1,62}$/;
const PHASE_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;
const SHA_RE = /^[0-9a-f]{40}$/;
export const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const BRANCH_RE = /^[A-Za-z0-9._/-]{1,200}$/;
const LEASE_ID_RE = /^lease-[a-z0-9][a-z0-9-]{1,62}$/;
const EVENT_ID_RE = /^evt-[a-z0-9][a-z0-9-]{1,62}$/;
const GH_LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}(\[bot\])?$/;
const RELATIVE_PATH_RE = /^(?!\/)(?!.*\.\.)[\x20-\x7E]{1,300}$/;
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;

// Strict UTC calendar instant: the ISO shape AND a real calendar date/time.
// A regex alone accepts 2026-13-40T25:61:99Z; this rejects impossible months,
// days (leap-year aware), hours, minutes, and seconds, and requires the `Z`
// zone (no other offset is permitted in v1). Returns epoch millis or null.
//
// PRECISION BOUND: at most THREE fractional-second digits (milliseconds).
// The protocol compares instants as integer epoch millis; a finer fraction
// (.0001Z vs .0004Z) cannot be represented at that resolution and rounding
// would collapse distinct instants into the same value — silently breaking
// strict ordering. Sub-millisecond precision is therefore REJECTED
// everywhere (fail closed), not rounded. The fraction is decoded by exact
// digit-padding ("1"→100ms, "12"→120ms, "123"→123ms) — no float rounding.
//
// YEAR RANGE: every four-digit year the published schema pattern accepts
// (0000–9999) is a distinct instant. The UTC instant is constructed via
// setUTCFullYear — NEVER Date.UTC, whose legacy two-digit-year remapping
// silently maps years 0–99 onto 1900–1999 (0099 and 1999 would collapse to
// the SAME epoch value, breaking strict ordering). Every calendar field is
// then round-trip-read back from the constructed instant; any disagreement
// (overflow, normalization, host quirk) fails closed as null.
export function parseIsoInstant(s) {
  if (typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?Z$/.exec(s);
  if (!m) return null;
  const year = +m[1], month = +m[2], day = +m[3], hour = +m[4], min = +m[5], sec = +m[6];
  if (month < 1 || month > 12) return null;
  if (hour > 23 || min > 59 || sec > 59) return null; // leap seconds not accepted
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;
  const millis = m[7] ? Number(m[7].slice(1).padEnd(3, "0")) : 0; // exact integer millis
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, min, sec, millis);
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  if (
    d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day || d.getUTCHours() !== hour ||
    d.getUTCMinutes() !== min || d.getUTCSeconds() !== sec ||
    d.getUTCMilliseconds() !== millis
  ) {
    return null;
  }
  return t;
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
  // working_branch is ESTABLISHED by the initial coordinator packet, which
  // requires it to be null when it applies. In the pre-packet coordination
  // states (planning — the genesis shape — and ready-for-coordinator, which
  // lane.activated and operator re-coordination reach with the branch
  // cleared) a record that already carries a working branch is preseeded or
  // corrupted: it would let a hand-written record preselect the branch the
  // packet is supposed to establish.
  if ((v.state === "planning" || v.state === "ready-for-coordinator") &&
      v.working_branch !== undefined && v.working_branch !== null) {
    errors.push(`working_branch: must be null in state ${v.state} (established only by the initial coordinator packet)`);
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
// Automation policy (automation-policy.json) — schema v2, admission epochs
// ---------------------------------------------------------------------------
//
// Two kinds of field live in the policy, and conflating them is the defect v2
// exists to fix.
//
// LIVE OPERATIONAL fields always take effect from their CURRENT value: enabled
// (the kill switch — it would not be a kill switch if history pinned it), mode,
// auto_merge, the six automatic_* prohibitions, stuck_lane_threshold_hours.
//
// ADMISSION fields decide whether a DURABLE PAST event was admissible:
// authorized_corridor, actor_allowlist, maximum_patch_cycles,
// lease_duration_minutes. Reading these live makes lane history a function of a
// mutable file — raising lease_duration_minutes retroactively converts a
// refused lease grant into an accepted one. In v2 they are versioned into
// `admission_history`, and every event is judged under the epoch governing its
// AUTHENTICATED observation time (the GitHub comment created_at), never under
// today's value.
//
// The epochs themselves are pinned by ACCEPTED_ADMISSION_EPOCH_LOCKS in
// admission-locks.mjs — executable protocol code outside this mutable file. See
// that module for the exact guarantee and its honest threat boundary.

// The four replay-sensitive admission fields, canonical order. Frozen: a caller
// that mutated this list would silently narrow every check derived from it.
export const ADMISSION_FIELDS = Object.freeze([
  "authorized_corridor",
  "actor_allowlist",
  "maximum_patch_cycles",
  "lease_duration_minutes",
]);

// The closed actor-role set. Any other key in an allowlist is an error, so no
// unrecognized role can sit in the policy looking as though it grants something.
export const ACTOR_ROLES = Object.freeze([
  "coordinator", "implementer", "auditor", "operator", "system",
]);

// Closed key sets. v2 rejects unknown keys outright (see validatePolicy) so an
// admission-like field cannot be added and silently treated as authoritative.
const POLICY_KEYS = Object.freeze(new Set([
  "schema", "mode", "enabled", "auto_merge",
  "automatic_estate_semantic_decisions", "automatic_cross_repo_contract_changes",
  "automatic_sibling_repo_edits", "automatic_external_infrastructure",
  "automatic_secret_use", "automatic_progression_beyond_mvp2",
  "stuck_lane_threshold_hours",
  ...ADMISSION_FIELDS,
  "admission_history",
]));
const EPOCH_KEYS = Object.freeze(new Set([
  "epoch_id", "governs_from", ...ADMISSION_FIELDS, "provenance", "transition_evidence",
]));
const PROVENANCE_KEYS = Object.freeze(new Set(["attributed_to", "reference", "note"]));
// transition_evidence is a COMMITMENT, not description, which is why it is a
// sibling of `provenance` rather than a member of it. Provenance says what a
// human believes about the epoch; this says which exact durable-event frontier
// document the append was authorized against, as a canonical content digest the
// change-time transition guard recomputes and must match. It carries no
// admission authority and no reducer behavior — see ADMISSION_FIELDS.
const TRANSITION_EVIDENCE_KEYS = Object.freeze(new Set(["frontier_digest"]));

const EPOCH_ID_RE = /^epoch-[0-9]{3,6}$/;
// A canonical payload digest as produced by payloadDigest (canonical.mjs).
export const FRONTIER_DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
// A documentation key: single leading underscore, then lowercase/digits. These
// carry NO policy force — nothing reads them — and exist so the file can
// explain itself. The single-underscore shape deliberately excludes `__proto__`
// and friends, which fall through to the unknown-key rejection instead.
const DOC_KEY_RE = /^_[a-z][a-z0-9_]*$/;

const VOLATILE_PROHIBITIONS = Object.freeze([
  "automatic_estate_semantic_decisions",
  "automatic_cross_repo_contract_changes",
  "automatic_sibling_repo_edits",
  "automatic_external_infrastructure",
  "automatic_secret_use",
  "automatic_progression_beyond_mvp2",
]);

// The four admission fields of any object that carries them (an epoch, or the
// top-level current-policy projection). ONE implementation, used by both, so
// the projection can never be validated more loosely than an epoch.
function admissionFieldErrors(obj, prefix) {
  const local = [];
  checkStringArray(local, obj, "authorized_corridor", PHASE_RE, { minItems: 1 });
  checkInt(local, obj, "maximum_patch_cycles", { min: 1 });
  checkInt(local, obj, "lease_duration_minutes", { min: 1 });
  local.push(...allowlistErrors(obj.actor_allowlist));
  return prefix ? local.map((e) => `${prefix}${e}`) : local;
}

function allowlistErrors(al) {
  if (!isPlainObject(al)) return ["actor_allowlist: missing or not an object"];
  const errors = [];
  for (const key of Object.keys(al)) {
    if (!ACTOR_ROLES.includes(key)) {
      errors.push(`actor_allowlist.${key}: unknown role key (the role set is closed; documentation belongs in a top-level _-prefixed key)`);
    }
  }
  for (const role of ACTOR_ROLES) {
    checkStringArray(errors, al, role, GH_LOGIN_RE, { minItems: 1 });
  }
  // The mechanical CI identity must never hold operator authority: an
  // operator-role event from a workflow-posted comment would let repo
  // automation exercise the operator's exclusive powers (ADR-050 §3).
  const ops = al.operator;
  if (Array.isArray(ops) && ops.some((l) => typeof l === "string" && l.endsWith("[bot]"))) {
    errors.push("actor_allowlist.operator: bot identities are forbidden in the operator role");
  }
  return errors;
}

// One epoch: closed shape, a real boundary instant, valid admission fields, and
// provenance that is plainly DESCRIPTIVE. `provenance.attributed_to` is checked
// only as a non-blank string — deliberately NOT pattern-matched against
// "operator:...". Matching such a pattern would encode the false idea that the
// string authenticates someone; it does not. Provenance is bound by the epoch's
// content digest so it cannot be rewritten after acceptance, but its force
// comes from the reviewed repository change that introduced the epoch, never
// from what the string says about itself.
function epochErrors(epoch, prefix) {
  if (!isPlainObject(epoch)) return [`${prefix}: not an object`];
  const errors = [];
  for (const key of Object.keys(epoch)) {
    if (!EPOCH_KEYS.has(key)) errors.push(`${prefix}.${key}: unknown epoch key (the epoch shape is closed)`);
  }
  const local = [];
  checkString(local, epoch, "epoch_id", EPOCH_ID_RE);
  // The temporal boundary. Epoch i governs [governs_from_i, governs_from_i+1),
  // and the final epoch governs [governs_from_n, forever). An event observed
  // before the FIRST boundary resolves to no epoch and fails closed — the
  // genesis boundary is where the provable durable history begins, and the
  // protocol refuses to invent admission authority earlier than that.
  checkTimestamp(local, epoch, "governs_from");
  errors.push(...local.map((e) => `${prefix}.${e}`));
  errors.push(...admissionFieldErrors(epoch, `${prefix}.`));
  const prov = epoch.provenance;
  if (!isPlainObject(prov)) {
    errors.push(`${prefix}.provenance: missing or not an object`);
  } else {
    for (const key of Object.keys(prov)) {
      if (!PROVENANCE_KEYS.has(key)) errors.push(`${prefix}.provenance.${key}: unknown provenance key`);
    }
    const pl = [];
    checkString(pl, prov, "attributed_to", null, { minLength: 3, maxLength: 200 });
    checkString(pl, prov, "reference", null, { minLength: 3, maxLength: 400 });
    checkString(pl, prov, "note", null, { optional: true, minLength: 3, maxLength: 4000 });
    errors.push(...pl.map((e) => `${prefix}.provenance.${e}`));
  }
  // OPTIONAL here, because the genesis epoch has no frontier to commit to and
  // this validator sees hypothetical policies as well as real ones. WHEN an
  // append is required to carry it is decided by the transition guard
  // (policy-transition.mjs), which refuses an appended epoch without it and
  // refuses a genesis epoch that has one. Structurally it is closed: present
  // means exactly one key, a canonical digest string.
  if (epoch.transition_evidence !== undefined) {
    const ev = epoch.transition_evidence;
    if (!isPlainObject(ev)) {
      errors.push(`${prefix}.transition_evidence: present but not an object`);
    } else {
      for (const key of Object.keys(ev)) {
        if (!TRANSITION_EVIDENCE_KEYS.has(key)) {
          errors.push(`${prefix}.transition_evidence.${key}: unknown transition evidence key (the shape is closed)`);
        }
      }
      const el = [];
      checkString(el, ev, "frontier_digest", FRONTIER_DIGEST_RE);
      errors.push(...el.map((e) => `${prefix}.transition_evidence.${e}`));
    }
  }
  return errors;
}

// The whole history: a non-empty array of structurally valid epochs with unique
// ids and STRICTLY ASCENDING boundaries. Strict ordering is what makes epoch
// resolution total and unambiguous — two epochs sharing a boundary would both
// "govern" the same instant, and a descending pair would make the last-match
// scan depend on array order rather than time. Both are refused here rather
// than resolved by a tie-break nobody can audit.
export function admissionHistoryErrors(history) {
  if (!Array.isArray(history)) return ["admission_history: missing or not an array"];
  if (history.length === 0) return ["admission_history: must contain at least one epoch"];
  const errors = [];
  history.forEach((epoch, i) => {
    errors.push(...epochErrors(epoch, `admission_history[${i}]`));
  });
  const seen = new Map();
  history.forEach((epoch, i) => {
    const id = isPlainObject(epoch) ? epoch.epoch_id : undefined;
    if (typeof id !== "string") return;
    if (seen.has(id)) {
      errors.push(`admission_history[${i}].epoch_id: ${id} duplicates admission_history[${seen.get(id)}]`);
    } else {
      seen.set(id, i);
    }
  });
  for (let i = 1; i < history.length; i += 1) {
    const prev = isPlainObject(history[i - 1]) ? parseIsoInstant(history[i - 1].governs_from) : null;
    const cur = isPlainObject(history[i]) ? parseIsoInstant(history[i].governs_from) : null;
    if (prev === null || cur === null) continue; // already reported as malformed
    if (cur <= prev) {
      errors.push(
        `admission_history[${i}].governs_from: ${history[i].governs_from} is not strictly after ` +
          `admission_history[${i - 1}].governs_from ${history[i - 1].governs_from} (epochs must be ordered and non-overlapping)`,
      );
    }
  }
  return errors;
}

// Resolve the admission policy governing an instant.
//
// CONTRACT (executable, not aspirational): this function validates the ENTIRE
// history structurally before selecting anything, so calling it directly —
// without a preceding validatePolicy — cannot yield an answer from a malformed,
// unordered, duplicate-id, or empty history. It refuses: a non-object policy; a
// non-integer instant; a missing/non-array/empty history; any malformed epoch;
// duplicate epoch ids; non-strictly-ascending or unparseable boundaries; and an
// instant earlier than the first epoch's boundary (no coverage → fail closed,
// never "use the earliest anyway").
//
// SEPARATION OF CONCERNS, stated explicitly: this is STRUCTURAL selection only.
// It deliberately does NOT check the accepted-epoch digest locks, because it is
// also the selector used against hypothetical policies. It therefore guarantees
// "this answer follows from a well-formed history", NOT "this history is the
// accepted one". Production callers get the second guarantee separately:
// reduce() runs validatePolicy first (which applies the runtime accepted-epoch
// binding), and every loader of the real committed policy runs acceptPolicy
// (which applies the full lock). No caller should read a guarantee here that
// this function does not itself enforce.
export function admissionPolicyFor(policy, atMillis) {
  if (!isPlainObject(policy)) return { ok: false, errors: ["policy: not an object"] };
  if (!Number.isInteger(atMillis)) {
    return { ok: false, errors: ["at: not an integer epoch-millis instant"] };
  }
  const structural = admissionHistoryErrors(policy.admission_history);
  if (structural.length > 0) return { ok: false, errors: structural };
  const history = policy.admission_history;
  let index = -1;
  for (let i = 0; i < history.length; i += 1) {
    if (parseIsoInstant(history[i].governs_from) <= atMillis) index = i;
    else break; // strictly ascending, so no later epoch can govern either
  }
  if (index < 0) {
    return {
      ok: false,
      errors: [
        `admission-epoch-unavailable: the observed instant precedes the earliest admission epoch ` +
          `(${history[0].epoch_id} governs from ${history[0].governs_from})`,
      ],
    };
  }
  const epoch = history[index];
  const admission = {};
  for (const field of ADMISSION_FIELDS) admission[field] = epoch[field];
  return {
    ok: true,
    index,
    epoch_id: epoch.epoch_id,
    governs_from: epoch.governs_from,
    admission,
  };
}

// STRUCTURAL policy validation + the runtime accepted-epoch binding.
//
// Used everywhere a policy is consulted, including inside reduce(), so no
// reduction can proceed under a policy whose accepted epochs have been
// rewritten. See pinnedEpochLockErrors for exactly what the binding covers and
// why the remaining case (a history presenting no accepted epoch at all) is
// closed at the loader boundary by acceptPolicy instead.
export function validatePolicy(v) {
  const errors = [];
  if (!isPlainObject(v)) return { ok: false, errors: ["policy: not an object"] };
  checkEnum(errors, v, "schema", ["straylight.automation-policy.v2"]);
  // CLOSED SHAPE: an unknown top-level key is an error, not ignored. Silently
  // accepting one lets a field that LOOKS like admission policy sit in the file
  // while carrying no force — the reader believes it is bounded and it is not.
  // Documentation keys are the single exception and are inert by construction.
  for (const key of Object.keys(v)) {
    if (DOC_KEY_RE.test(key)) continue;
    if (!POLICY_KEYS.has(key)) {
      errors.push(`${key}: unknown top-level policy key (v2 is a closed shape; documentation keys must match ${DOC_KEY_RE})`);
    }
  }
  // Live operational fields.
  checkEnum(errors, v, "mode", ["shadow"]);
  checkBool(errors, v, "enabled");
  checkBool(errors, v, "auto_merge");
  for (const k of VOLATILE_PROHIBITIONS) checkBool(errors, v, k);
  checkInt(errors, v, "stuck_lane_threshold_hours", { min: 1 });

  // The REQUIRED top-level projection of current admission policy. Required
  // (not optional) so every shipped tool that reads e.g. policy.lease_duration_
  // minutes keeps reading a real, validated value; and pinned deep-equal to the
  // final epoch below so it can never disagree with the policy that actually
  // governs. It is a convenience read of CURRENT policy and never historical
  // authority: the reducer resolves admission from the governing epoch.
  errors.push(...admissionFieldErrors(v, ""));

  const historyErrors = admissionHistoryErrors(v.admission_history);
  errors.push(...historyErrors);

  if (historyErrors.length === 0) {
    const final = v.admission_history[v.admission_history.length - 1];
    for (const field of ADMISSION_FIELDS) {
      if (canonicalize(v[field]) !== canonicalize(final[field])) {
        errors.push(
          `${field}: top-level projection does not equal the final admission epoch ` +
            `(${final.epoch_id}); the projection must be exactly current policy`,
        );
      }
    }
    // The runtime accepted-epoch lock (admission-locks.mjs).
    errors.push(...pinnedEpochLockErrors(v.admission_history));
  }

  // Hard v1/v2 invariants: these fields exist so that flipping them is loud,
  // but the control plane refuses to run with them flipped.
  if (v.auto_merge === true) errors.push("auto_merge: must be false in control plane v1");
  for (const k of VOLATILE_PROHIBITIONS) {
    if (v[k] === true) errors.push(`${k}: must be false in control plane v1`);
  }
  return result(errors, v);
}

// PRODUCTION ACCEPTANCE of the real committed automation-policy.json.
//
// validatePolicy + the FULL accepted-epoch lock: the history must be exactly
// the accepted history — same length, same ids at the same indices, same
// canonical content. This is the boundary where provenance is known (the bytes
// came from the protocol's own policy file), so the unconditional lock is both
// meaningful and safe here in a way it cannot be inside a pure validator that
// also serves hypothetical policies.
//
// EVERY loader of the committed automation-policy.json reaches this function
// through loadProtocolPolicy (policy-source.mjs), the single place that decides
// which validator a policy file must satisfy. That obligation is enforced
// mechanically by tests/control-plane/admission-epochs.test.ts, which scans
// .straylight/bin/ and scripts/ with comments blanked — so a comment mentioning
// the loader cannot satisfy it — and fails if any script reads the policy path
// itself instead of loading it through policy-source.mjs.
export function acceptPolicy(v) {
  const structural = validatePolicy(v);
  if (!structural.ok) return structural;
  const lockErrors = acceptedEpochLockErrors(v.admission_history);
  return lockErrors.length === 0 ? { ok: true, value: v } : { ok: false, errors: lockErrors };
}
