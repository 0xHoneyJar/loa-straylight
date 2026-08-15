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
//              LIVE-ONLY (history canonically identical): the live fields may
//              change freely. This is how the kill switch is flipped, and it is
//              the path used to FREEZE the control plane before an append and to
//              RE-ENABLE it afterwards. No frontier evidence is required,
//              because no admission decision moves.
//
//              APPEND (history grows): additionally gated by the FROZEN
//              FRONTIER CUTOVER below.
//
// FROZEN FRONTIER CUTOVER — why array order is not enough
//
// An appended epoch sits at the end of the array but its `governs_from` is a
// point in TIME. If that point lies before events already recorded, replaying
// the same durable comments re-judges them: the array is still a clean append,
// the runtime accepted-epoch lock still holds, this guard's prefix check still
// passes, and history has nevertheless changed. Demonstrated on real material:
// an epoch boundary shortly before lane #122 comment 5257177236 turns that
// REFUSED lease claim into an ACCEPTED one and moves the lane's final state.
//
// So an append additionally requires:
//
//   1. the PREVIOUS committed policy already has enabled === false, and
//   2. the CANDIDATE also has enabled === false, and
//   3. an explicit durable event frontier captured under that freeze, whose
//      quiescence evidence records NO write-capable run in flight, and
//   4. the caller NAMES the frozen main SHA it believes the evidence describes,
//      and the frontier agrees, and
//   5. every appended epoch's governs_from STRICTLY AFTER that frontier.
//
// (1) and (2) together mean an append can never be combined with the change that
// first disables automation: the freeze must ALREADY be merged and in effect
// before the frontier is captured, so nothing can be written between capturing
// the evidence and relying on it. Policy evolution is therefore deliberately a
// multi-transition operation — freeze, capture, append, re-enable — each merged
// and audited on its own. Historical authority is worth more than saving a PR.
//
// (3) and (4) are the Codex H-02 half. "Captured under the freeze" used to be
// prose in a procedure: the evidence recorded WHEN it was captured but not WHAT it
// was captured against, and said nothing about whether a workflow run authored
// while automation was permitted was still executing. Now the frontier names the
// frozen revision and carries its quiescence evidence, the frontier validator
// refuses a frontier whose `active_write_runs` is non-empty, and the CALLER must
// state the frozen SHA independently — so presenting a frontier captured against
// some other revision is a refusal rather than a matter of noticing.
//
// The kill switch stays LIVE operational policy. It is not epoched, and freezing
// is itself a live-only transition that needs no evidence.
//
// THREAT BOUNDARY, stated precisely. This does not defeat the operator. The
// operator can still post lane comments by hand during the frozen window, or
// change protocol code — and protocol-code changes were never inside the claim.
// `operator:eileen` is the control-plane authority and MUST NOT write lane events
// during a cutover; if an event is posted anyway, the frontier evidence is stale
// and must be recaptured. What the mechanism does establish is that a backdated
// append is not an ordinary policy edit: it cannot be done while automation is
// running, it cannot be done without committing evidence that contradicts it,
// and the contradiction is mechanical rather than a matter of review attention.
//
// Two further limits belong to the same provenance boundary, and are recorded so
// they are not overclaimed. First, this library cannot prove that GitHub lane
// discovery was COMPLETE; a frontier that silently omitted a lane would bound the
// append too early. Second, a policy file carries no repository identity, so this
// library cannot know which repository it is deciding for: it requires the caller
// to NAME one and requires the evidence to agree, and echoes the repository it
// relied on in the verdict. Both facts are established at authorization time, by a
// read-only capture run under the freeze and by the operator's exact-SHA review of
// the resulting evidence — not by this function.
//
// LIVE fields are deliberately unconstrained here (apart from the append freeze
// rule above): enabled, mode, auto_merge, the automatic_* prohibitions and
// stuck_lane_threshold_hours are meant to change, and the kill switch would not
// be a kill switch otherwise. The top-level admission projection is constrained
// transitively — validatePolicy requires it to deep-equal the final epoch, so it
// cannot move without an appended epoch to move to. NOTE that this makes the
// projection follow an appended future epoch IMMEDIATELY on merge; that interval
// is exactly why the append requires enabled === false on both sides, so no
// worker can act under a projection whose epoch has not begun.

import { canonicalize } from "./canonical.mjs";
import { validatePolicy, ADMISSION_FIELDS, ACTOR_ROLES, admissionHistoryErrors, parseIsoInstant } from "./validate.mjs";
import { validateDurableFrontier } from "./durable-frontier.mjs";
import { FROZEN_MAIN_SHA_RE } from "./frozen-quiescence.mjs";

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

// The closed shape of the transition-evidence argument. Naming the repository and
// the frozen revision separately from the frontier file is deliberate: the
// operator's command has to assert which repository AND which frozen commit this
// append is for, so evidence captured somewhere else — or against a revision that
// is no longer the freeze under review — cannot be presented as this one's.
const CONTEXT_KEYS = ["repository", "frontier", "expected_frozen_main_sha"];

// v2 -> v2 APPEND: the frozen frontier cutover gate. Additional to the prefix
// check, and reached only when the candidate's history is LONGER than the
// previous one. Returns { errors, bound } — bound is the derived frontier
// summary when the evidence is sound, so an accepted result can report the
// evidence it relied on instead of merely claiming it existed.
function appendGateErrors(previous, candidate, context, prevLen) {
  const errors = [];

  // 1 + 2. Both sides frozen. The freeze must already be the committed state:
  // otherwise the append lands in the same change that stops automation, and the
  // frontier would have been captured while workers could still write.
  if (previous.enabled !== false) {
    errors.push(
      `previous.enabled: ${JSON.stringify(previous.enabled)} — appending an admission epoch requires the ` +
        "control plane to be ALREADY FROZEN. Merge a live-only transition setting enabled: false (admission " +
        "history unchanged) first, confirm it is the committed state, capture the durable event frontier under " +
        "that freeze, and then append.",
    );
  }
  if (candidate.enabled !== false) {
    errors.push(
      `candidate.enabled: ${JSON.stringify(candidate.enabled)} — the candidate must keep enabled: false. ` +
        "Automation is restored by a separate later live-only transition, after the append is merged.",
    );
  }

  const appended = candidate.admission_history.slice(prevLen);
  if (appended.length !== 1) {
    errors.push(
      `candidate.admission_history: ${appended.length} epochs appended in one transition ` +
        `(${appended.map((e) => JSON.stringify(isPlainObject(e) ? e.epoch_id : e)).join(", ")}) — append exactly ` +
        "ONE epoch per reviewed transition, so its boundary, its values, and the frontier that bounds it are a " +
        "single authorizable fact",
    );
  }

  // 3. Explicit evidence. The library stays pure: it never goes looking for the
  // frontier, so a caller that omits it gets a refusal rather than a default.
  if (context === null || context === undefined) {
    errors.push(
      "context: required for an admission append — pass { repository, expected_frozen_main_sha, frontier } where " +
        "frontier is a durable event frontier captured read-only while enabled: false and quiescent " +
        "(scripts/verify-frozen-quiescence.mjs then scripts/capture-durable-frontier.mjs). Appending without " +
        "evidence of where history ended, and of the frozen revision it ended at, cannot be authorized.",
    );
    return { errors, bound: null };
  }
  if (!isPlainObject(context)) {
    errors.push("context: not an object");
    return { errors, bound: null };
  }
  for (const key of Object.keys(context)) {
    if (!CONTEXT_KEYS.includes(key)) errors.push(`context.${key}: unknown key — the context shape is closed`);
  }
  if (context.frontier === undefined) {
    errors.push(
      "context.frontier: missing — an admission append must be bounded by a captured durable event frontier",
    );
  }
  if (typeof context.repository !== "string" || context.repository.length === 0) {
    errors.push(
      `context.repository: ${JSON.stringify(context.repository)} — name the repository this append is for, ` +
        "independently of the evidence file",
    );
  }
  // 4. The frozen revision, asserted by the CALLER. A full immutable SHA, never a
  // branch name: "main" would name whatever main happens to be at check time,
  // which is precisely the moving target the binding exists to pin down.
  if (typeof context.expected_frozen_main_sha !== "string" || !FROZEN_MAIN_SHA_RE.test(context.expected_frozen_main_sha)) {
    errors.push(
      `context.expected_frozen_main_sha: ${JSON.stringify(context.expected_frozen_main_sha)} — name the full ` +
        "40-hex commit SHA of the frozen main this append is authorized against (never a branch name). The " +
        "frontier must have been captured against exactly that revision.",
    );
  }

  let bound = null;
  if (context.frontier !== undefined) {
    const verdict = validateDurableFrontier(context.frontier);
    if (!verdict.ok) {
      errors.push(...verdict.errors.map((e) => `context.${e}`));
    } else {
      bound = verdict.value;
      if (typeof context.repository === "string" && context.repository !== bound.repository) {
        errors.push(
          `context.repository: ${JSON.stringify(context.repository)} does not match ` +
            `frontier.repository ${JSON.stringify(bound.repository)} — the evidence describes a different repository`,
        );
      }
      if (
        typeof context.expected_frozen_main_sha === "string" &&
        FROZEN_MAIN_SHA_RE.test(context.expected_frozen_main_sha) &&
        context.expected_frozen_main_sha !== bound.frozen_main_sha
      ) {
        errors.push(
          `context.expected_frozen_main_sha: ${context.expected_frozen_main_sha} does not match ` +
            `frontier.frozen_main_sha ${JSON.stringify(bound.frozen_main_sha)} — the evidence was captured against ` +
            "a different revision than the freeze this append claims to be authorized under, so it cannot bound it",
        );
      }
    }
  }

  // 5. Strict prospectivity. Checked for EVERY appended epoch, not just the
  // first: the invariant is that no appended epoch governs an event that already
  // exists. (validatePolicy separately requires boundaries to ascend strictly,
  // so with a sound history the first is the binding one.)
  if (bound !== null) {
    appended.forEach((epoch, offset) => {
      const index = prevLen + offset;
      const boundary = parseIsoInstant(isPlainObject(epoch) ? epoch.governs_from : undefined);
      if (boundary === null) return; // malformed boundary already reported structurally
      if (boundary > bound.max_millis) return;
      const label = isPlainObject(epoch) ? String(epoch.epoch_id) : "?";
      errors.push(
        `candidate.admission_history[${index}] (${label}).governs_from: ${JSON.stringify(epoch.governs_from)} is ` +
          `not strictly after the durable event frontier ${bound.max_event_created_at} — an appended epoch may ` +
          "govern only events that do not yet exist. A boundary at or before the frontier RE-JUDGES events " +
          `already recorded (${bound.event_count} protocol event(s) across ${bound.lane_count} lane(s) as of ` +
          `${bound.captured_at}): the array is still append-only and the runtime lock still holds, yet history changes.`,
      );
    });
  }

  return { errors, bound };
}

// Validate a policy change.
//
//   previous   the policy as committed before the change (v1 or v2)
//   candidate  the proposed policy (must be v2)
//   context    transition evidence: { repository, expected_frozen_main_sha,
//              frontier }. REQUIRED when the candidate appends an admission
//              epoch; ignored otherwise (the result reports frontier: null so the
//              output shows it was not consulted).
//
// Returns { ok: true, kind, previous_epochs, candidate_epochs, appended,
// frontier } or { ok: false, errors }. Pure: reads nothing outside its arguments
// — no files, no clock, no network, no lock table.
export function validatePolicyTransition(previous, candidate, context = null) {
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
  let bound = null;
  if (previous.schema === POLICY_SCHEMA_V1) {
    // The genesis migration transcribes v1's live admission values, so it cannot
    // move any decision wherever its boundary sits, and needs no frontier.
    kind = "v1-to-v2";
    errors.push(...v1ToV2Errors(previous, candidate));
  } else if (previous.schema === POLICY_SCHEMA_V2) {
    errors.push(...v2AppendErrors(previous, candidate));
    // Classify by whether the admission history GROWS. A history that is
    // identical (or that v2AppendErrors has already refused as mutated) is a
    // live-only change: no admission decision moves, so no evidence is needed.
    const prevHistory = Array.isArray(previous.admission_history) ? previous.admission_history : null;
    const nextHistory = Array.isArray(candidate.admission_history) ? candidate.admission_history : null;
    const grows = prevHistory !== null && nextHistory !== null && nextHistory.length > prevHistory.length;
    kind = grows ? "v2-append" : "v2-live";
    if (grows) {
      const gate = appendGateErrors(previous, candidate, context, prevHistory.length);
      errors.push(...gate.errors);
      bound = gate.bound;
    }
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
    // The evidence the verdict rests on, so the output IS the evidence. null on
    // paths where no admission decision moves and none was consulted.
    frontier:
      bound === null
        ? null
        : {
            repository: bound.repository,
            frozen_main_sha: bound.frozen_main_sha,
            captured_at: bound.captured_at,
            quiescence_checked_at: bound.quiescence_checked_at,
            write_capable_workflows: bound.write_capable_workflows,
            lanes: bound.lane_count,
            events: bound.event_count,
            max_event_created_at: bound.max_event_created_at,
            appended_governs_from: candidate.admission_history[prevLen].governs_from,
          },
  };
}
