// Straylight Control Plane v1 — full lane reconstruction (pure).
//
// reconstructLane(input) rebuilds a lane's current state from nothing but
// GitHub-durable content: the lane issue body (genesis lane record) plus
// the ordered comment stream (append-only events). This is the recovery
// path after ANY actor loses all local state, and it is also the reducer
// workflow's only source of truth — reduced state is never trusted from a
// previous run, always re-derived.
//
// input = {
//   issue_body:  string,
//   comments:    [{ id, user, body, created_at?, updated_at? }...]
//                // user = AUTHENTICATED GitHub commenter login from the
//                // API; created_at = GitHub-recorded post time; updated_at =
//                // GitHub-recorded last-edit time. All supplied by the
//                // adapter — never taken from the payload itself.
//   policy:      parsed automation-policy.json
//   context:     ACCEPTED AND IGNORED. Reconstruction takes NO wall clock.
//                Every event's authoritative time is the authenticated
//                comment.created_at above, and the reducer context is built
//                here from the durable comment alone — an adapter cannot
//                supply, override, or stand in for it. The parameter is still
//                accepted so callers that pass one are not broken, and
//                tests/control-plane assert that its contents change nothing.
// }
//
// Returns {
//   ok, lane, dispositions: [{comment_id, status, refusal?, detail?}...],
//   labels: [...], frozen, task_packet, task_packet_source, used_lease_ids,
//   refusal?, detail?
// }
//
// CURRENT-PACKET PROJECTION: `task_packet` / `task_packet_source` expose the
// packet this replay ITSELF bound and the reducer ACCEPTED for the lane's most
// recent applied coordinator packet event — the same binding the replay used to
// validate downstream events, not a fresh search of the comment stream. There
// is deliberately no second end-of-run scan: a refused packet event (malformed,
// foreign, future-referencing, digest-mismatched, wrong-author, edited, out of
// turn) leaves the projection exactly where the accepted history left it, and a
// lane that never had one reports null/null. It is a READING of governed state
// and confers NO authority: it does not authorize implementation, lease
// acquisition, or any Git/GitHub write, does not change lane state or
// task-scope semantics, and is not a continuation grant.
//
// LEASE-HISTORY PROJECTION: `used_lease_ids` exposes the SAME accumulator this
// replay already hands the reducer as ctx.used_lease_ids — the lease ids of
// every APPLIED `*.lease_acquired` event, in replay (ascending comment) order.
// There is no second accumulator and no second scan: the historical-consumption
// rule stays the reducer's, and the projection is a frozen copy of the one live
// Set that rule was decided against, so a consumer can ask whether a candidate
// lease id was already consumed without reimplementing or inferring lease
// history locally. Consumed is PERMANENT: a released, expired, or requeued
// lease id stays here (that is the whole point of R3 — a stale worker must not
// re-match a fresh lease), implementer and auditor ids share one namespace, and
// a refused acquisition contributes nothing. Like the packet projection it is a
// READING and confers NO authority: it grants no lease and does not change lane
// state, lease validity, or lease-ID policy.
//
// DETERMINISM: reconstruction is a pure function of the durable content
// alone. No transient live signal (PR metadata, live head SHA) enters the
// replay; live PR facts reach the protocol only as durable fields of
// system.eligibility_confirmed events, re-validated by the reducer on every
// replay. Same input → same output, on every run, forever.
//
// Referenced-artifact binding (R2/R4): an event may reference a task packet
// or audit record only by an EARLIER comment (comment_id < event_comment_id)
// — a later comment can never retroactively validate an earlier event. The
// referencing event DECLARES the canonical content digest of its artifact
// (refs.task_packet_digest / refs.audit_digest), and the reducer re-compares
// that durable digest against the bound comment's current content on every
// replay — so mutating the artifact comment after the event was posted
// breaks the binding mechanically, independent of GitHub edit metadata.

import { MARKERS, extractPayload, hasMarker } from "./markers.mjs";
import { validateLane, validatePolicy, parseIsoInstant } from "./validate.mjs";
import { reduce } from "./reducer.mjs";
import { nextActorFor } from "./state-machine.mjs";

export function reconstructLane(input) {
  // `input.context` is deliberately NOT destructured: nothing an adapter can
  // put in it may reach the reducer. See the header note.
  const { issue_body, comments, policy } = input ?? {};

  // Kill-switch FREEZE semantics (ADR-050 §4: "Suspension never rewrites
  // lane history"). When automation is disabled we must still replay the
  // append-only history FAITHFULLY — the reduced projection is FROZEN at
  // whatever state it had reached, not rewound to genesis. If we replayed
  // with the live (disabled) policy, reduce() would refuse every historical
  // event and the lane would collapse back to state=planning/seq=0, which is
  // a rewind, not a freeze. So during replay we use a policy with the kill
  // switch forced on, and expose `frozen` so the sole consumer (the reducer
  // workflow) takes NO new action while disabled.
  //
  // Force-enablement is gated on FULL structural validation of the ORIGINAL
  // policy, and applies only when its `enabled` field is the literal boolean
  // false — the one value the kill switch legitimately produces. Any other
  // non-true `enabled` (missing, null, the string "false", a number, an
  // object) is a MALFORMED policy, not an engaged kill switch: rewriting it
  // to `enabled: true` would launder the invalid field into a passing one
  // and replay history under a policy that never validly existed.
  //
  // INVALID-POLICY PRECEDENCE: a policy that fails validation authorizes
  // NOTHING — not reduction, and not the comment-level handling either. The
  // comment loop below refuses EVERY protocol comment as policy-invalid
  // BEFORE the edited-comment check runs, so an edited event / task-packet /
  // audit comment can never invoke toOperatorRequired (or any other lane
  // change) under a policy that never validated. The lane stays exactly at
  // its genesis state and event sequence, and the derived labels are the
  // genesis labels — no label from a changed lane is ever produced.
  const pv = validatePolicy(policy ?? null);
  const frozen = !pv.ok || policy.enabled !== true;
  const replayPolicy = pv.ok && policy.enabled === false ? { ...policy, enabled: true } : policy;

  // Genesis: the issue body must contain exactly one lane payload.
  const genesis = extractPayload(issue_body, MARKERS.lane);
  if (!genesis.ok) {
    return { ok: false, refusal: "genesis-unreadable", detail: genesis.reason, lane: null, dispositions: [], labels: [] };
  }
  const gv = validateLane(genesis.value);
  if (!gv.ok) {
    return { ok: false, refusal: "genesis-invalid", detail: gv.errors.join("; "), lane: null, dispositions: [], labels: [] };
  }
  let lane = genesis.value;
  // The genesis record must be TRULY initial: every in-flight/derived field
  // at its starting value. A genesis that preseeds any of them smuggles
  // state past the events that are supposed to establish it — e.g. a
  // preselected working_branch would ratify a branch no coordinator packet
  // ever named (the initial packet must both find working_branch null and
  // establish it from its own target_branch), and a preseeded pr_number
  // would let a completion event omit its PR reference.
  const genesisViolations = [];
  if (lane.state !== "planning") genesisViolations.push("state must be planning");
  if (lane.event_sequence !== 0) genesisViolations.push("event_sequence must be 0");
  if (lane.working_branch != null) genesisViolations.push("working_branch must be null (established only by the initial coordinator packet)");
  if (lane.pr_number != null) genesisViolations.push("pr_number must be null");
  if (lane.pr_head_sha != null) genesisViolations.push("pr_head_sha must be null");
  if (lane.audited_sha != null) genesisViolations.push("audited_sha must be null");
  if (lane.verdict != null) genesisViolations.push("verdict must be null");
  if (lane.lease != null) genesisViolations.push("lease must be null");
  if (lane.attempt !== 0) genesisViolations.push("attempt must be 0");
  if (lane.patch_cycle !== 0) genesisViolations.push("patch_cycle must be 0");
  if ((lane.audit_retry ?? 0) !== 0) genesisViolations.push("audit_retry must be 0 or absent");
  if (lane.last_lease_role != null) genesisViolations.push("last_lease_role must be null or absent");
  if (lane.operator_pause !== false) genesisViolations.push("operator_pause must be false (pausing requires an operator.paused event)");
  if (genesisViolations.length > 0) {
    return {
      ok: false,
      refusal: "genesis-not-initial",
      detail: `genesis lane must be initial: ${genesisViolations.join("; ")}`,
      lane: null, dispositions: [], labels: [],
    };
  }

  const ordered = [...(Array.isArray(comments) ? comments : [])].sort((a, b) => a.id - b.id);

  const dispositions = [];
  // The lane's CURRENT task packet, tracked as coordinator packet events are
  // applied, so later implementer events validate against it.
  let currentPacketCommentId = null;
  // PROJECTION of that same tracking, for consumers (see the return value).
  // Not a second resolver: these are the exact packet value and provenance
  // this replay already bound into the reducer context for the coordinator
  // packet event that the reducer ACCEPTED, captured at the one place
  // currentPacketCommentId moves. Nothing else may write them, so the
  // projection cannot diverge from the packet state replay itself used.
  let currentTaskPacket = null;
  let currentTaskPacketSource = null;
  // Applied event ids (uniqueness) and consumed lease ids (no reuse), R3/R4.
  const seenEventIds = new Set();
  const usedLeaseIds = new Set();

  for (const comment of ordered) {
    const isProtocolComment =
      hasMarker(comment.body, MARKERS.event) ||
      hasMarker(comment.body, MARKERS.taskPacket) ||
      hasMarker(comment.body, MARKERS.audit);
    if (!isProtocolComment) continue; // prose / workflow-result comment

    // INVALID-POLICY PRECEDENCE (G1): a policy that failed validation
    // authorizes NOTHING — including the comment-level handling below. This
    // refusal runs BEFORE the edited-comment (R5) check, so an edited
    // protocol comment can never invoke toOperatorRequired — and before the
    // identity/artifact/event paths, so no route can move the lane off its
    // genesis state or event sequence. Every protocol comment is refused
    // with the reducer's own policy-invalid code naming the bad field(s).
    if (!pv.ok) {
      dispositions.push({
        comment_id: comment.id,
        status: "refused",
        refusal: "policy-invalid",
        detail: pv.errors.join("; "),
      });
      continue;
    }

    // Comment-mutation posture (R5): the event record is append-oriented, but
    // GitHub comments are editable/deletable. An EDITED protocol comment —
    // an event, a task packet, or an audit record (updated_at strictly after
    // created_at) — is routed to operator-required rather than silently
    // trusted or silently unbound. A v1 shadow-mode limitation, honestly
    // enforced instead of asserted.
    if (isEdited(comment)) {
      dispositions.push({
        comment_id: comment.id,
        status: "refused",
        refusal: "protocol-comment-edited",
        detail: `protocol comment edited after posting (created ${comment.created_at}, updated ${comment.updated_at})`,
      });
      if (lane.state !== "operator-required" && !isTerminalState(lane.state)) {
        lane = toOperatorRequired(lane, `protocol-comment-edited: comment ${comment.id} was edited after posting`);
      }
      continue;
    }

    // Artifact-only comments (task packet / audit record without an event
    // marker) carry no event to reduce; they are bound by reference from
    // their event. The edit check above has already run for them.
    if (!hasMarker(comment.body, MARKERS.event)) continue;

    const payload = extractPayload(comment.body, MARKERS.event);
    if (!payload.ok) {
      dispositions.push({ comment_id: comment.id, status: "refused", refusal: "event-unreadable", detail: payload.reason });
      continue;
    }
    const event = payload.value;

    // Identity binding: the event's CLAIMED github_actor must equal the
    // AUTHENTICATED commenter. An event pasted by someone else dies here.
    if (typeof comment.user !== "string" || event.github_actor !== comment.user) {
      dispositions.push({
        comment_id: comment.id,
        status: "refused",
        refusal: "actor-identity-mismatch",
        detail: `payload claims ${event.github_actor}, comment posted by ${comment.user}`,
      });
      continue;
    }

    // Event-ID uniqueness: a reused evt-* id (checked AFTER identity binding
    // so a stranger's forged comment cannot burn a legitimate id) makes the
    // durable record ambiguous. An id is "used" only once its event is
    // APPLIED (added below), NOT when merely seen — a reducer-refused comment
    // must not burn its id (event-id burn / denial-of-recovery).
    if (typeof event.event_id === "string" && seenEventIds.has(event.event_id)) {
      dispositions.push({
        comment_id: comment.id,
        status: "refused",
        refusal: "duplicate-event-id",
        detail: `event_id ${event.event_id} already applied in this lane`,
      });
      continue;
    }

    // OBSERVED TIME: the authenticated GitHub post time of THIS comment. It is
    // the only admission clock — it selects the governing admission epoch, sets
    // any lease grant instant, and decides whether a completion was timely. A
    // comment the adapter cannot timestamp is unadmittable rather than
    // adjudicated under a substitute clock: without a trustworthy observation
    // time we cannot say which policy governed the event. The refusal does NOT
    // escalate — it is an adapter/API gap, not a lane-authority violation, and
    // the lane simply does not advance past it.
    if (typeof comment.created_at !== "string" || parseIsoInstant(comment.created_at) === null) {
      dispositions.push({
        comment_id: comment.id,
        status: "refused",
        refusal: "event-time-unavailable",
        detail: "comment has no valid authenticated created_at; event admission has no substitute clock",
      });
      continue;
    }
    // The reducer context is built HERE, field by field, from the durable
    // comment and the replay's own accumulators. It is never derived from
    // input.context, so no caller can inject an observation time.
    const ctx = {
      event_observed_at: comment.created_at,
      // The authenticated comment author binds the lease holder + holder checks.
      comment_author: typeof comment.user === "string" ? comment.user : null,
      used_lease_ids: usedLeaseIds,
    };
    // Task-packet binding (R2): only a coordinator packet-posting event may
    // NAME a packet comment, and only an EARLIER one. Every other event uses
    // the coordinator-approved packet tracked in currentPacketCommentId. The
    // packet content is pinned by the digest declared in the durable packet
    // event (checked by the reducer), so editing the packet comment after it
    // was referenced breaks the binding.
    const isCoordinatorPacketEvent =
      event.event_type === "coordinator.task_packet_posted" ||
      event.event_type === "coordinator.patch_packet_posted";
    const packetRef = isCoordinatorPacketEvent
      ? (event.refs?.task_packet_comment_id ?? null)
      : currentPacketCommentId;
    if (packetRef != null) {
      const bound = bindArtifact(ordered, packetRef, comment, MARKERS.taskPacket, {
        // A coordinator packet event must reference an EARLIER comment authored
        // by the SAME (coordinator) login that posts the packet event — mirror
        // the audit path. Without this an implementer could pre-post its own
        // wide-scope packet and a coordinator event merely naming it would
        // bind it. For downstream (non-coordinator) events reusing the tracked
        // currentPacketCommentId, the packet was already coordinator-authored
        // when it was tracked, so no author re-check is needed.
        requireEarlier: isCoordinatorPacketEvent,
        requireSameAuthor: isCoordinatorPacketEvent,
      });
      if (bound.ok) {
        ctx.task_packet = bound.value;
        ctx.task_packet_source = { comment_id: packetRef, author: bound.author };
      } else {
        ctx.task_packet_bind_error = bound.reason;
      }
    }
    // Audit binding (R4): the referenced audit comment must be an EARLIER
    // comment authored by the SAME auditor posting the completion event; the
    // completion event's declared refs.audit_digest pins the content (the
    // reducer re-compares it on every replay). A future/foreign/edited audit
    // comment leaves audit_record unset → reducer refuses.
    if (event.refs?.audit_comment_id != null) {
      const bound = bindArtifact(ordered, event.refs.audit_comment_id, comment, MARKERS.audit, {
        requireEarlier: true,
        requireSameAuthor: true,
      });
      if (bound.ok) {
        ctx.audit_record = bound.value;
        ctx.audit_source = { comment_id: event.refs.audit_comment_id, author: bound.author };
      } else {
        ctx.audit_bind_error = bound.reason;
      }
    }

    const decision = reduce(lane, event, replayPolicy, ctx);
    if (decision.ok) {
      lane = decision.lane;
      if (typeof event.event_id === "string") seenEventIds.add(event.event_id);
      if (event.event_type.endsWith("lease_acquired") && typeof event.lease_id === "string") {
        usedLeaseIds.add(event.lease_id);
      }
      if (
        (event.event_type === "coordinator.task_packet_posted" ||
          event.event_type === "coordinator.patch_packet_posted") &&
        event.refs?.task_packet_comment_id != null
      ) {
        currentPacketCommentId = event.refs.task_packet_comment_id;
        // Same accepted event, same bound artifact: the reducer refuses a
        // packet event whose ctx.task_packet is absent, invalid, or
        // digest-mismatched, so reaching here means THIS packet was bound by
        // THIS replay and accepted. `?? null` keeps the absence explicit
        // rather than undefined.
        currentTaskPacket = ctx.task_packet ?? null;
        currentTaskPacketSource = ctx.task_packet_source ?? null;
      }
      dispositions.push({ comment_id: comment.id, status: "applied", detail: decision.note || lane.last_transition });
    } else {
      dispositions.push({ comment_id: comment.id, status: "refused", refusal: decision.refusal, detail: decision.detail });
      if (decision.escalate && lane.state !== "operator-required") {
        // Same lease-clearing escalation as the edited-comment path: the
        // resulting lane must be valid and operator-recoverable.
        lane = toOperatorRequired(lane, `${decision.refusal}: ${decision.detail}`);
      }
    }
  }

  return {
    ok: true,
    lane,
    dispositions,
    labels: deriveLabels(lane),
    frozen,
    task_packet: currentTaskPacket,
    task_packet_source: currentTaskPacketSource,
    // The reducer's own consumed-lease history, projected for consumers. A
    // FRESH FROZEN COPY, not the live Set: the reducer keeps deciding
    // lease-id-reused against `usedLeaseIds` itself, and no consumer mutation
    // may reach that state. Insertion order is replay order (comments are
    // replayed in ascending id), so no independent sort is applied — sorting
    // here would report an order the replay never had.
    used_lease_ids: Object.freeze([...usedLeaseIds]),
  };
}

// A protocol comment is "edited" when the adapter reports an updated_at
// strictly after created_at, compared as PARSED INSTANTS (never lexically).
// Both are GitHub-recorded; a missing updated_at (older adapter) is treated
// as not-edited. A PRESENT but unparseable timestamp fails closed as edited:
// we cannot prove the comment was not mutated.
function isEdited(comment) {
  const c = comment?.created_at;
  const u = comment?.updated_at;
  if (typeof c !== "string" || typeof u !== "string") return false;
  const cMs = parseIsoInstant(c);
  const uMs = parseIsoInstant(u);
  if (cMs === null || uMs === null) return true; // unparseable → fail closed
  return uMs > cMs;
}

function isTerminalState(state) {
  return state === "merged" || state === "superseded";
}

// Route a lane to operator-required, CLEARING any active lease. A lease's
// expected_state is its holder's working state; carrying it into
// operator-required would embed a cross-state lease that validateLane
// refuses — the "escalated" lane would be structurally invalid and the
// operator could never recover it with an event. Escalation hands the lane
// to the operator, so the worker's claim on it ends here; the holder must
// re-acquire after the operator routes the lane back to a ready state.
function toOperatorRequired(lane, reason) {
  return {
    ...lane,
    state: "operator-required",
    next_actor: nextActorFor("operator-required"),
    operator_required_reason: reason,
    lease: null,
  };
}

// Bind a referenced artifact (task packet / audit record) from the durable
// stream, enforcing: EARLIER-than-referencing-comment (no forward reference),
// optional same-author-as-referencing-comment, and not-edited. Content
// pinning is the reducer's job: it compares the digest DECLARED in the
// durable referencing event against the bound content on every replay.
// Returns { ok, value, author } or { ok: false, reason }.
function bindArtifact(ordered, refId, referencingComment, marker, { requireEarlier = false, requireSameAuthor = false } = {}) {
  const src = ordered.find((c) => c.id === refId);
  if (!src) return { ok: false, reason: "artifact-comment-not-found" };
  if (requireEarlier && !(src.id < referencingComment.id)) {
    return { ok: false, reason: "artifact-forward-reference" };
  }
  if (isEdited(src)) {
    return { ok: false, reason: "artifact-comment-edited" };
  }
  if (requireSameAuthor) {
    if (typeof src.user !== "string" || src.user !== referencingComment.user) {
      return { ok: false, reason: "artifact-author-mismatch" };
    }
  }
  const parsed = extractPayload(src.body, marker);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  return { ok: true, value: parsed.value, author: src.user };
}

// Labels are DERIVED state (ADR-050 §1.1) — reconstruct them, never trust
// them. `cp-` prefix namespaces control-plane labels away from repo labels.
export function deriveLabels(lane) {
  const labels = [`cp-lane`, `cp-state:${lane.state}`, `cp-next:${lane.next_actor}`];
  if (lane.operator_pause) labels.push("cp-paused");
  if (lane.state === "ready-for-merge") labels.push("cp-ready-for-merge");
  if (lane.state === "merged") labels.push("cp-merged");
  return labels;
}
