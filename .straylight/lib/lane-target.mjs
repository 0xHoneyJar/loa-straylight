// Straylight Control Plane v1 — universal lane-target authority (pure).
//
// N3: EVERY lane-addressed write requires a fresh, same-execution proof
// that the lane it targets is the UNIQUE lane with that lane_id in the
// repository's canonical enumeration. This module is the single owner of
// that proof for every writer — reducer, watchdog, merge guard, and
// bootstrap all derive lane identity here, from the same canonical marker
// parser the reducer trusts (markers.mjs → strict-json.mjs), never from
// labels, filenames, or captions.
//
// Duplicate valid lane IDs are a protocol-integrity failure everywhere:
// two issues both parsing as genesis for the same lane_id make every
// lane-addressed write ambiguous, so scanLanes reports the collision and
// every assertion against that lane_id refuses (exit 2 at the CLI layer
// for every writer, including bootstrap — C1).
//
// FAIL CLOSED on ambiguity: an issue whose body carries the lane marker
// but whose payload cannot be parsed (or parses without a canonical
// lane_id) is UNREADABLE, never silently skipped — an unreadable genesis
// could BE the existing lane in mangled form. Bootstrap must refuse while
// any lane-marker body is unprovable; the watchdog surfaces it as an
// explicit malformed-lane finding.

import { MARKERS, extractPayload, hasMarker } from "./markers.mjs";

// Canonical lane-id contract (lane-v1.schema.json `lane_id` pattern). A
// marker-bearing body whose lane_id does NOT satisfy it is UNREADABLE, not
// a clean miss: "lane-phase-49p " (trailing space) must refuse rather than
// read as "some other lane", and a crafted lane_id carrying tab/newline
// must never reach a caller's line-oriented issue mapping.
export const LANE_ID_RE = /^lane-[a-z0-9][a-z0-9-]{1,62}$/;

// Scan pre-flattened issues ([{ number, body }...] — the evidence.mjs
// parseIssuePages output shape; pull requests already excluded there) for
// lane genesis records via the canonical marker parser.
//
// Returns {
//   ok: true,
//   lanes:      [{ number, lane_id }...]   — every readable genesis, in
//                                            enumeration order;
//   duplicates: [{ lane_id, numbers }...]  — lane_ids claimed by MORE THAN
//                                            ONE issue (ambiguity, C1);
//   unreadable: [{ number, reason }...]    — marker-bearing but unprovable;
// }
// or { ok: false, reason } on structurally unusable input.
export function scanLanes(issues) {
  if (!Array.isArray(issues)) return { ok: false, reason: "issues-not-array" };
  const lanes = [];
  const unreadable = [];
  const byLaneId = new Map();
  for (const issue of issues) {
    if (issue === null || typeof issue !== "object" || Array.isArray(issue)) {
      return { ok: false, reason: "issue-entry-not-object" };
    }
    if (!Number.isInteger(issue.number) || issue.number < 1) {
      return { ok: false, reason: "issue-number-invalid" };
    }
    const body = typeof issue.body === "string" ? issue.body : "";
    if (!hasMarker(body, MARKERS.lane)) continue; // not a lane record at all
    const parsed = extractPayload(body, MARKERS.lane);
    if (!parsed.ok) {
      unreadable.push({ number: issue.number, reason: parsed.reason });
      continue;
    }
    if (typeof parsed.value.lane_id !== "string") {
      unreadable.push({ number: issue.number, reason: "lane-id-missing" });
      continue;
    }
    if (!LANE_ID_RE.test(parsed.value.lane_id)) {
      unreadable.push({ number: issue.number, reason: "lane-id-malformed" });
      continue;
    }
    lanes.push({ number: issue.number, lane_id: parsed.value.lane_id });
    const list = byLaneId.get(parsed.value.lane_id) ?? [];
    list.push(issue.number);
    byLaneId.set(parsed.value.lane_id, list);
  }
  const duplicates = [];
  for (const [lane_id, numbers] of byLaneId) {
    if (numbers.length > 1) duplicates.push({ lane_id, numbers });
  }
  return { ok: true, lanes, duplicates, unreadable };
}

// The universal lane-target proof: assert that `lane_id` maps to EXACTLY
// ONE issue in this same-execution enumeration, and (when expected_issue
// is provided) that it is the expected issue. Every writer calls this with
// the evidence it just fetched, immediately before planning any write that
// addresses the lane.
//
// Returns { ok: true, issue_number } or
//         { ok: false, reason, detail?, numbers? } — every failure mode
// distinct and fail closed:
//   lane-id-malformed        — the requested id itself violates the pattern
//   lane-target-unreadable   — some marker-bearing body is unprovable; the
//                              requested lane cannot be proven unique while
//                              any genesis is unreadable (it could BE one)
//   duplicate-lane-id        — more than one issue claims this lane_id
//   lane-not-found           — no issue claims this lane_id
//   lane-issue-mismatch      — unique, but not the expected issue
export function assertUniqueLaneTarget(issues, lane_id, { expected_issue = null } = {}) {
  if (typeof lane_id !== "string" || !LANE_ID_RE.test(lane_id)) {
    return { ok: false, reason: "lane-id-malformed" };
  }
  const scanned = scanLanes(issues);
  if (!scanned.ok) return scanned;
  if (scanned.unreadable.length > 0) {
    return {
      ok: false,
      reason: "lane-target-unreadable",
      detail: `${scanned.unreadable.length} marker-bearing issue(s) unprovable`,
      numbers: scanned.unreadable.map((u) => u.number),
    };
  }
  const matches = scanned.lanes.filter((l) => l.lane_id === lane_id).map((l) => l.number);
  if (matches.length > 1) {
    return { ok: false, reason: "duplicate-lane-id", numbers: matches };
  }
  if (matches.length === 0) {
    return { ok: false, reason: "lane-not-found" };
  }
  if (expected_issue !== null && matches[0] !== expected_issue) {
    return {
      ok: false,
      reason: "lane-issue-mismatch",
      detail: `lane ${lane_id} lives on issue #${matches[0]}, not expected #${expected_issue}`,
      numbers: matches,
    };
  }
  return { ok: true, issue_number: matches[0] };
}

// Prove lane ABSENCE (the bootstrap precondition): `lane_id` maps to ZERO
// issues, AND no marker-bearing body is unprovable, AND no duplicate lane
// ambiguity exists anywhere (an enumeration containing any duplicate lane
// is not a trustworthy basis for creating more lanes).
//
// Returns { ok: true, absent: true } |
//         { ok: true, absent: false, numbers } (exists — a valid no-op) |
//         { ok: false, reason, ... } (ambiguity — refuse).
export function assertLaneAbsent(issues, lane_id) {
  if (typeof lane_id !== "string" || !LANE_ID_RE.test(lane_id)) {
    return { ok: false, reason: "lane-id-malformed" };
  }
  const scanned = scanLanes(issues);
  if (!scanned.ok) return scanned;
  if (scanned.unreadable.length > 0) {
    return {
      ok: false,
      reason: "lane-target-unreadable",
      detail: `${scanned.unreadable.length} marker-bearing issue(s) unprovable`,
      numbers: scanned.unreadable.map((u) => u.number),
    };
  }
  if (scanned.duplicates.length > 0) {
    return {
      ok: false,
      reason: "duplicate-lane-id",
      detail: scanned.duplicates.map((d) => `${d.lane_id}: #${d.numbers.join(", #")}`).join("; "),
    };
  }
  const matches = scanned.lanes.filter((l) => l.lane_id === lane_id).map((l) => l.number);
  if (matches.length > 0) {
    return { ok: true, absent: false, numbers: matches };
  }
  return { ok: true, absent: true };
}
