// Straylight Control Plane v2 — APPEND-ONLY POLICY TRANSITION GUARD.
//
// The second of two independent protections over historical admission policy.
//
//   RUNTIME lock (admission-locks.mjs): the policy the protocol RUNS must
//   present the accepted epochs with exactly the pinned content. It answers
//   "is this policy the accepted history?" at every load.
//
//   CHANGE-TIME guard (this module): a candidate policy must extend the
//   PREVIOUS COMMITTED policy's history without touching it. It answers "is
//   this change to the policy an append?" and it takes the previous policy as
//   input, so it does not consult, and cannot be satisfied by, the runtime lock
//   table.
//
// The independence is the point. Editing epoch 1 and recomputing its lock entry
// in the same change satisfies the runtime lock — the policy and the table agree
// again — but the transition guard still refuses it, because the previous
// committed history is no longer a prefix of the candidate's. Neither mechanism
// can be repaired into agreement by the edit that the other one catches.
//
// WHAT IS ALLOWED
//
//   v1 -> v2   exactly ONE genesis epoch, transcribing the four v1 admission
//              fields with no alteration. The migration may re-describe the
//              policy; it may not re-decide it.
//   v2 -> v2   the entire previous admission_history is a canonical prefix of
//              the candidate's. Epochs may be APPENDED. Nothing already there
//              may be edited (content, boundary, or provenance), deleted,
//              reordered, replaced, or preceded by an insertion.
//
// LIVE fields are deliberately unconstrained here: enabled, mode, auto_merge,
// the automatic_* prohibitions and stuck_lane_threshold_hours are meant to
// change, and the kill switch would not be a kill switch otherwise. The
// top-level admission projection is constrained transitively — validatePolicy
// requires it to deep-equal the final epoch, so it cannot move without an
// appended epoch to move to.

import { canonicalize } from "./canonical.mjs";
import { validatePolicy, ADMISSION_FIELDS, ACTOR_ROLES, admissionHistoryErrors } from "./validate.mjs";

export const POLICY_SCHEMA_V1 = "straylight.automation-policy.v1";
export const POLICY_SCHEMA_V2 = "straylight.automation-policy.v2";

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// A documentation key inside the v1 actor_allowlist (v1 carried its explanatory
// `_note` there; v2 closes the role set and moves documentation to a top-level
// `_`-prefixed key). Dropping such a key is a documentation move, not a policy
// change. Any OTHER unrecognized key is refused: an unknown role in v1 might
// have granted something, and silently dropping it in transcription would be a
// change of admission policy disguised as a reformat.
const V1_ALLOWLIST_DOC_KEY = /^_[a-z][a-z0-9_]*$/;

// v1 -> v2: the genesis epoch must transcribe v1's admission fields exactly.
function v1ToV2Errors(previous, candidate) {
  const errors = [];
  const history = candidate.admission_history;
  if (!Array.isArray(history) || history.length !== 1) {
    errors.push(
      `candidate.admission_history: the v1→v2 migration must introduce exactly ONE genesis epoch ` +
        `transcribing v1 (found ${Array.isArray(history) ? history.length : "no array"}); ` +
        "later epochs are appended in their own reviewed change",
    );
    return errors;
  }
  const genesis = history[0];
  if (!isPlainObject(genesis)) {
    errors.push("candidate.admission_history[0]: not an object");
    return errors;
  }
  for (const field of ADMISSION_FIELDS) {
    if (field === "actor_allowlist") continue; // handled below, doc-key aware
    if (canonicalize(previous[field]) !== canonicalize(genesis[field])) {
      errors.push(
        `candidate.admission_history[0].${field}: ${canonicalize(genesis[field])} does not transcribe ` +
          `the previous v1 policy's ${field} ${canonicalize(previous[field])} — the migration must be ` +
          "value-preserving; changing admission policy requires appending a NEW epoch",
      );
    }
  }
  const prevAl = previous.actor_allowlist;
  const newAl = genesis.actor_allowlist;
  if (!isPlainObject(prevAl)) {
    errors.push("previous.actor_allowlist: missing or not an object; the migration has nothing to transcribe");
  } else if (!isPlainObject(newAl)) {
    errors.push("candidate.admission_history[0].actor_allowlist: missing or not an object");
  } else {
    for (const key of Object.keys(prevAl)) {
      if (ACTOR_ROLES.includes(key) || V1_ALLOWLIST_DOC_KEY.test(key)) continue;
      errors.push(
        `previous.actor_allowlist.${key}: unrecognized v1 role key; it can be neither transcribed nor ` +
          "silently dropped, so this migration cannot be proven value-preserving",
      );
    }
    for (const role of ACTOR_ROLES) {
      if (canonicalize(prevAl[role]) !== canonicalize(newAl[role])) {
        errors.push(
          `candidate.admission_history[0].actor_allowlist.${role}: ${canonicalize(newAl[role])} does not ` +
            `transcribe the previous v1 policy's ${canonicalize(prevAl[role])}`,
        );
      }
    }
  }
  return errors;
}

// v2 -> v2: the previous history must be a canonical prefix of the candidate's.
function v2AppendErrors(previous, candidate) {
  const errors = [];
  const prevHistoryErrors = admissionHistoryErrors(previous.admission_history);
  if (prevHistoryErrors.length > 0) {
    // A previous policy whose own history does not parse cannot establish a
    // prefix to preserve. Fail closed rather than guess at its intent.
    return prevHistoryErrors.map((e) => `previous: ${e}`);
  }
  const prev = previous.admission_history;
  const next = candidate.admission_history;
  if (!Array.isArray(next)) return ["candidate.admission_history: not an array"];
  if (next.length < prev.length) {
    errors.push(
      `candidate.admission_history: ${next.length} epoch(s) but the previous policy had ${prev.length} — ` +
        "accepted epochs may not be deleted; history is append-only",
    );
  }
  for (let i = 0; i < prev.length; i += 1) {
    const before = canonicalize(prev[i]);
    const after = i < next.length ? canonicalize(next[i]) : undefined;
    if (after === before) continue;
    if (after === undefined) continue; // already reported as a deletion
    const prevId = prev[i]?.epoch_id;
    const nextId = isPlainObject(next[i]) ? next[i].epoch_id : undefined;
    errors.push(
      nextId !== prevId
        ? `candidate.admission_history[${i}]: ${JSON.stringify(nextId)} where the previous policy had ` +
          `${JSON.stringify(prevId)} — accepted epochs may not be reordered, replaced, or preceded by an insertion`
        : `candidate.admission_history[${i}] (${prevId}): canonical content changed — an accepted admission ` +
          "epoch was edited. Historical admission policy is immutable; to change admission policy going " +
          "forward, APPEND a new epoch.",
    );
  }
  return errors;
}

// Validate a policy change.
//
//   previous   the policy as committed before the change (v1 or v2)
//   candidate  the proposed policy (must be v2)
//
// Returns { ok: true, kind, previous_epochs, candidate_epochs, appended } or
// { ok: false, errors }. Pure: reads nothing outside its arguments — no files,
// no clock, no lock table.
export function validatePolicyTransition(previous, candidate) {
  if (!isPlainObject(previous)) return { ok: false, errors: ["previous: not an object"] };
  if (!isPlainObject(candidate)) return { ok: false, errors: ["candidate: not an object"] };

  const errors = [];
  if (candidate.schema !== POLICY_SCHEMA_V2) {
    return {
      ok: false,
      errors: [
        `candidate.schema: ${JSON.stringify(candidate.schema)} — the candidate must be ${POLICY_SCHEMA_V2}. ` +
          "Reverting to a schema without admission epochs would return historical admission authority to " +
          "mutable live fields.",
      ],
    };
  }
  // The candidate must be a structurally valid v2 policy in its own right. This
  // reuses the ONE policy validator rather than re-deriving a second, drifting
  // set of shape rules here.
  const structural = validatePolicy(candidate);
  if (!structural.ok) errors.push(...structural.errors.map((e) => `candidate: ${e}`));

  let kind;
  if (previous.schema === POLICY_SCHEMA_V1) {
    kind = "v1-to-v2";
    errors.push(...v1ToV2Errors(previous, candidate));
  } else if (previous.schema === POLICY_SCHEMA_V2) {
    kind = "v2-append";
    errors.push(...v2AppendErrors(previous, candidate));
  } else {
    return {
      ok: false,
      errors: [
        `previous.schema: ${JSON.stringify(previous.schema)} — expected ${POLICY_SCHEMA_V1} or ${POLICY_SCHEMA_V2}; ` +
          "the previous committed policy is the only baseline a transition can be checked against",
      ],
    };
  }
  if (errors.length > 0) return { ok: false, errors };

  const prevLen = kind === "v1-to-v2" ? 0 : previous.admission_history.length;
  const appended = candidate.admission_history.slice(prevLen).map((e) => e.epoch_id);
  return {
    ok: true,
    kind,
    previous_epochs: prevLen,
    candidate_epochs: candidate.admission_history.length,
    appended,
  };
}
