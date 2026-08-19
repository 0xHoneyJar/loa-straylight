// Straylight Control Plane v2 — DURABLE EVENT FRONTIER (transition evidence).
//
// WHAT THIS IS FOR
//
// The append-only transition guard proves that a candidate policy's admission
// history EXTENDS the previous one in ARRAY ORDER. That is not sufficient on its
// own. An epoch appended at the end of the array may still carry a `governs_from`
// that lies BEFORE events already recorded in the durable comment stream. The
// array is still a clean append, the runtime accepted-epoch lock still holds —
// and yet replaying the same comments now re-judges them under the new epoch.
// A BACKDATED APPEND rewrites history without editing a single accepted byte.
//
// The frontier closes that gap. It is a small, explicit statement of where the
// durable event stream ENDED at a known moment:
//
//   "As of <captured_at>, in <repository>, these are all of the cp-lanes, and
//    for each one this is its last protocol event, its authenticated GitHub
//    created_at, and how many protocol events it holds."
//
// An appended epoch must begin strictly AFTER the global maximum of those
// authenticated times. Then it governs only events that do not yet exist.
//
// BOUND TO A FROZEN REVISION (Codex H-02)
//
// "Captured while frozen" was, until H-02, prose in a procedure rather than a
// field in the evidence. The document said WHEN it was captured but not WHAT it
// was captured against, so a frontier gathered before the freeze landed — or
// while a workflow run authored under `enabled: true` was still in flight — was
// indistinguishable from one gathered after the control plane had actually come
// to rest. So the frontier now NAMES the frozen revision (`frozen_main_sha`) and
// carries the quiescence evidence that licensed the capture: when quiescence was
// verified, the closed set of workflows able to reach the write executor, and the
// write-capable runs still in flight — which for an admissible frontier is the
// empty list (lib/frozen-quiescence.mjs). The transition CLI must then name the
// expected frozen SHA independently and the two must agree, so a frontier
// captured against a different revision cannot be presented as this one's.
//
// WHICH FRONTIER — THE CANONICAL DIGEST (Codex M-01)
//
// A structurally valid frontier says what it observed; on its own it does not say
// that it is the document the append was reviewed against. Any other valid
// frontier for the same repository and the same frozen SHA — an earlier capture
// left in /tmp, an artifact from a previous attempt, a file whose lane entries
// were edited down — validates exactly as well. So the frontier BYTES are not
// what an appended epoch carries: the epoch commits their canonical content
// DIGEST (`transition_evidence.frontier_digest`), and the transition guard
// recomputes that digest over whatever frontier it is handed and requires exact
// equality (see .straylight/lib/policy-transition.mjs). The commitment is a
// small, reviewable string at an exact SHA; the digest is what binds it to one
// document, and through that document to the repository, the frozen revision,
// the quiescence proof, and every lane bound the capture observed.
//
// WHAT THIS CANNOT PROVE
//
// This module is pure. It cannot verify that lane DISCOVERY was complete — that
// no cp-lane was omitted from `lanes`, and that no event was posted after the
// capture. Completeness is PROVENANCE, established at authorization time: the
// capture runs read-only against GitHub while the control plane is already
// frozen (`enabled: false`) and quiescent, it proves that quiescence itself,
// before and after the lane reads, and the operator's exact-SHA audit of the
// epoch that commits this document's digest is what accepts it. What this module
// does is make the evidence explicit, self-consistent, and mechanically
// checkable, so that a missing, malformed, stale, or doctored frontier is a
// REFUSAL rather than a silent omission.
//
// There is no public anchor, no signature, and no notary here, and the digest
// commitment does not make one: it distinguishes documents, it does not vouch for
// them. Nor is `captured_at` a transactional snapshot, and the quiescence fields
// do not make it one: GitHub can create a write-capable run the instant after the
// last page is read. Two agreeing proofs bracketing the reads and an unmoved main
// are strong evidence; none of that is atomicity.
//
// The stored `max_event_created_at` is a legibility aid for the operator reading
// the file. It is NEVER trusted: the maximum is recomputed from the lane entries
// on every validation and a disagreement in EITHER direction is refused.

import { parseIsoInstant, REPO_RE } from "./validate.mjs";
import { LANE_ID_RE } from "./lane-target.mjs";
import { FRONTIER_EVIDENCE_KEY_MAP, quiescenceEvidenceErrors } from "./frozen-quiescence.mjs";
import { payloadDigest } from "./canonical.mjs";

export const FRONTIER_SCHEMA = "straylight.durable-event-frontier.v1";

const FRONTIER_KEYS = [
  "schema",
  "repository",
  "frozen_main_sha",
  "captured_at",
  "quiescence_checked_at",
  "write_capable_workflows",
  "active_write_runs",
  "lanes",
  "max_event_created_at",
];
const LANE_KEYS = ["issue_number", "lane_id", "last_event_comment_id", "last_event_created_at", "event_count"];

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isPositiveInt(v) {
  return Number.isInteger(v) && v >= 1;
}

function closedKeyErrors(errors, obj, allowed, at) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) errors.push(`${at}.${key}: unknown key — the frontier shape is closed`);
  }
  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) errors.push(`${at}.${key}: missing`);
  }
}

// Derive the global maximum authenticated event time from the lane entries.
// Only well-formed entries that CLAIM an event contribute; entries the validator
// will reject are skipped here so the two do not need to agree on order.
function deriveMax(lanes) {
  let millis = null;
  let iso = null;
  if (!Array.isArray(lanes)) return { millis, iso };
  for (const lane of lanes) {
    if (!isPlainObject(lane)) continue;
    if (!Number.isInteger(lane.event_count) || lane.event_count <= 0) continue;
    const t = parseIsoInstant(lane.last_event_created_at);
    if (t === null) continue;
    if (millis === null || t > millis) {
      millis = t;
      iso = lane.last_event_created_at;
    }
  }
  return { millis, iso };
}

/**
 * Validate a supplied frontier and report its derived bound.
 *
 * Returns { ok: true, value: { repository, captured_at, lane_count,
 * event_count, max_event_created_at, max_millis, frontier_digest } } or
 * { ok: false, errors }. Pure: no files, no clock, no network.
 *
 * `frontier_digest` is the canonical content digest of the WHOLE supplied
 * document (payloadDigest, .straylight/lib/canonical.mjs) — the frontier's
 * identity, derived here rather than stored in the file, so the capture that
 * reports it and the transition guard that requires it cannot disagree about
 * what "this frontier" means.
 */
export function validateDurableFrontier(frontier) {
  if (!isPlainObject(frontier)) return { ok: false, errors: ["frontier: not an object"] };

  const errors = [];
  closedKeyErrors(errors, frontier, FRONTIER_KEYS, "frontier");

  if (frontier.schema !== FRONTIER_SCHEMA) {
    errors.push(`frontier.schema: ${JSON.stringify(frontier.schema)} — expected ${FRONTIER_SCHEMA}`);
  }
  if (typeof frontier.repository !== "string" || !REPO_RE.test(frontier.repository)) {
    errors.push(`frontier.repository: ${JSON.stringify(frontier.repository)} — expected "owner/name"`);
  }
  const capturedAt = parseIsoInstant(frontier.captured_at);
  if (capturedAt === null) {
    errors.push(
      `frontier.captured_at: ${JSON.stringify(frontier.captured_at)} — expected a UTC instant ` +
        "YYYY-MM-DDTHH:MM:SS[.mmm]Z",
    );
  }

  // The frozen revision this capture was gathered against, and the quiescence
  // that licensed it. One shared implementation with the standalone quiescence
  // document, so the two cannot drift about what the evidence must say — and the
  // "no write-capable run in flight" rule is enforced HERE, at validation, not
  // only in the tool that gathered it.
  errors.push(...quiescenceEvidenceErrors(frontier, { at: "frontier", keys: FRONTIER_EVIDENCE_KEY_MAP }));
  const quiescenceAt = parseIsoInstant(frontier.quiescence_checked_at);
  if (capturedAt !== null && quiescenceAt !== null && quiescenceAt > capturedAt) {
    errors.push(
      `frontier.quiescence_checked_at: ${JSON.stringify(frontier.quiescence_checked_at)} is later than ` +
        `captured_at ${JSON.stringify(frontier.captured_at)} — quiescence must be established BEFORE the capture ` +
        "it licenses; evidence gathered afterwards says nothing about the state the capture ran in",
    );
  }

  const lanes = frontier.lanes;
  let laneCount = 0;
  let eventCount = 0;
  let lanesWithEvents = 0;
  if (!Array.isArray(lanes)) {
    errors.push(`frontier.lanes: not an array`);
  } else if (lanes.length === 0) {
    errors.push(
      "frontier.lanes: empty — a frontier that observes no lane bounds nothing. If the control plane has " +
        "durable history, the capture was incomplete; fail closed rather than append against no evidence.",
    );
  } else {
    laneCount = lanes.length;
    const issueSeen = new Map();
    const laneSeen = new Map();
    lanes.forEach((lane, i) => {
      const at = `frontier.lanes[${i}]`;
      if (!isPlainObject(lane)) {
        errors.push(`${at}: not an object`);
        return;
      }
      closedKeyErrors(errors, lane, LANE_KEYS, at);

      if (!isPositiveInt(lane.issue_number)) {
        errors.push(`${at}.issue_number: ${JSON.stringify(lane.issue_number)} — expected a positive integer`);
      } else {
        if (!issueSeen.has(lane.issue_number)) issueSeen.set(lane.issue_number, []);
        issueSeen.get(lane.issue_number).push(i);
      }
      if (typeof lane.lane_id !== "string" || !LANE_ID_RE.test(lane.lane_id)) {
        errors.push(`${at}.lane_id: ${JSON.stringify(lane.lane_id)} — expected ${LANE_ID_RE.source}`);
      } else {
        if (!laneSeen.has(lane.lane_id)) laneSeen.set(lane.lane_id, []);
        laneSeen.get(lane.lane_id).push(i);
      }
      if (!Number.isInteger(lane.event_count) || lane.event_count < 0) {
        errors.push(`${at}.event_count: ${JSON.stringify(lane.event_count)} — expected a non-negative integer`);
        return;
      }
      eventCount += lane.event_count;

      // The last-event pair and the count must agree. A lane claiming events
      // with no last event, or no events with a last event, is ambiguous
      // evidence: one of the two says the frontier moved and the other does not.
      if (lane.event_count === 0) {
        if (lane.last_event_comment_id !== null || lane.last_event_created_at !== null) {
          errors.push(
            `${at}: event_count is 0 but a last event is recorded — a lane with no protocol events must ` +
              "carry last_event_comment_id: null and last_event_created_at: null",
          );
        }
        return;
      }
      lanesWithEvents += 1;
      if (!isPositiveInt(lane.last_event_comment_id)) {
        errors.push(
          `${at}.last_event_comment_id: ${JSON.stringify(lane.last_event_comment_id)} — expected a positive ` +
            `integer comment id (event_count is ${lane.event_count})`,
        );
      }
      if (parseIsoInstant(lane.last_event_created_at) === null) {
        errors.push(
          `${at}.last_event_created_at: ${JSON.stringify(lane.last_event_created_at)} — expected the ` +
            "authenticated GitHub created_at as a UTC instant YYYY-MM-DDTHH:MM:SS[.mmm]Z",
        );
      }
    });

    for (const [issue, indices] of issueSeen) {
      if (indices.length > 1) {
        errors.push(
          `frontier.lanes: issue ${issue} appears ${indices.length} times (indices ${indices.join(", ")}) — ` +
            "one entry per lane; a duplicated lane lets the entry with the EARLIER frontier stand in for the later one",
        );
      }
    }
    for (const [laneId, indices] of laneSeen) {
      if (indices.length > 1) {
        errors.push(
          `frontier.lanes: lane_id ${JSON.stringify(laneId)} appears ${indices.length} times ` +
            `(indices ${indices.join(", ")}) — one entry per lane`,
        );
      }
    }
    if (lanesWithEvents === 0) {
      errors.push(
        "frontier.lanes: no lane records a durable protocol event, so no bound can be derived — an append " +
          "cannot be authorized against a frontier that bounds nothing",
      );
    }
  }

  const derived = deriveMax(lanes);
  const claimed = parseIsoInstant(frontier.max_event_created_at);
  if (claimed === null) {
    errors.push(
      `frontier.max_event_created_at: ${JSON.stringify(frontier.max_event_created_at)} — expected a UTC ` +
        "instant YYYY-MM-DDTHH:MM:SS[.mmm]Z",
    );
  } else if (derived.millis !== null && claimed !== derived.millis) {
    errors.push(
      `frontier.max_event_created_at: ${JSON.stringify(frontier.max_event_created_at)} disagrees with the ` +
        `maximum derived from the lane entries (${derived.iso}) — the stored maximum is never trusted, it is ` +
        "recomputed from every lane's last_event_created_at",
    );
  }
  if (capturedAt !== null && derived.millis !== null && capturedAt < derived.millis) {
    errors.push(
      `frontier.captured_at: ${JSON.stringify(frontier.captured_at)} precedes the latest observed event ` +
        `(${derived.iso}) — a capture cannot have observed an event later than itself`,
    );
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      repository: frontier.repository,
      frozen_main_sha: frontier.frozen_main_sha,
      captured_at: frontier.captured_at,
      quiescence_checked_at: frontier.quiescence_checked_at,
      write_capable_workflows: frontier.write_capable_workflows.slice(),
      lane_count: laneCount,
      event_count: eventCount,
      max_event_created_at: derived.iso,
      max_millis: derived.millis,
      frontier_digest: payloadDigest(frontier),
    },
  };
}

/**
 * Assemble a frontier document from captured lane entries and the quiescence
 * evidence the capture ran under, deriving the global maximum mechanically so no
 * caller hand-computes it. Lanes are sorted by issue number for deterministic
 * output. Returns { ok: true, frontier, value } or { ok: false, errors } — the
 * assembled document is validated before it is returned, so a caller cannot emit
 * a frontier this module would refuse (including one whose quiescence evidence
 * records a run still in flight).
 */
export function buildDurableFrontier({
  repository,
  frozen_main_sha,
  captured_at,
  quiescence_checked_at,
  write_capable_workflows,
  active_write_runs,
  lanes,
} = {}) {
  const entries = Array.isArray(lanes) ? lanes.slice() : lanes;
  if (Array.isArray(entries) && entries.every((l) => isPlainObject(l) && Number.isInteger(l.issue_number))) {
    entries.sort((a, b) => a.issue_number - b.issue_number);
  }
  const derived = deriveMax(entries);
  const frontier = {
    schema: FRONTIER_SCHEMA,
    repository,
    frozen_main_sha,
    captured_at,
    quiescence_checked_at,
    write_capable_workflows: Array.isArray(write_capable_workflows)
      ? write_capable_workflows.slice().sort()
      : write_capable_workflows,
    active_write_runs,
    lanes: entries,
    max_event_created_at: derived.iso,
  };
  const verdict = validateDurableFrontier(frontier);
  if (!verdict.ok) return { ok: false, errors: verdict.errors };
  return { ok: true, frontier, value: verdict.value };
}
