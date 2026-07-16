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
//   context:     { now, pr_head_sha?, pr_metadata?, pr_heads? }
// }
//
// Returns {
//   ok, lane, dispositions: [{comment_id, status, refusal?, detail?}...],
//   labels: [...], frozen, refusal?, detail?
// }
//
// Idempotent by construction: same input → same output. Refused events
// never advance the lane, so replaying an already-processed comment stream
// converges to the same state.
//
// Referenced-artifact binding (R2/R4): an event may reference a task packet
// or audit record only by an EARLIER comment (comment_id < event_comment_id)
// — a later comment can never retroactively validate an earlier event. The
// selected artifact is bound by its source author and a canonical content
// digest, so editing the source comment breaks the binding.

import { MARKERS, extractPayload, hasMarker } from "./markers.mjs";
import { validateLane } from "./validate.mjs";
import { reduce } from "./reducer.mjs";
import { nextActorFor } from "./state-machine.mjs";
import { payloadDigest } from "./canonical.mjs";

export function reconstructLane(input) {
  const { issue_body, comments, policy, context = {} } = input ?? {};

  // Kill-switch FREEZE semantics (ADR-050 §4: "Suspension never rewrites
  // lane history"). When automation is disabled we must still replay the
  // append-only history FAITHFULLY — the reduced projection is FROZEN at
  // whatever state it had reached, not rewound to genesis. If we replayed
  // with the live (disabled) policy, reduce() would refuse every historical
  // event and the lane would collapse back to state=planning/seq=0, which is
  // a rewind, not a freeze. So during replay we use a policy with the kill
  // switch forced on, and expose `frozen` so the sole consumer (the reducer
  // workflow) takes NO new action while disabled. A structurally invalid
  // policy is NOT forced enabled — it still fails closed inside reduce().
  const policyIsObject = policy !== null && typeof policy === "object";
  const frozen = !policyIsObject || policy.enabled !== true;
  const replayPolicy = frozen && policyIsObject ? { ...policy, enabled: true } : policy;

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
  if (lane.state !== "planning" || lane.event_sequence !== 0) {
    return {
      ok: false,
      refusal: "genesis-not-initial",
      detail: "genesis lane must start in state=planning with event_sequence=0",
      lane: null, dispositions: [], labels: [],
    };
  }

  const ordered = [...(Array.isArray(comments) ? comments : [])].sort((a, b) => a.id - b.id);

  // The transient live PR metadata (context.pr_metadata / pr_head_sha) is
  // authoritative ONLY at the live audit frontier: the comment carrying the
  // LAST event that actually ADVANCED the lane. It must NOT enter the replay
  // of HISTORICAL events, or reconstruction stops being a pure function of
  // durable content (a head move after a legitimate ACCEPT would re-judge the
  // already-applied historical audit and rewind the projection).
  //
  // The frontier is the last-APPLIED event's comment, found by a first
  // metadata-free replay pass — NOT merely "the newest comment bearing an
  // event marker". Otherwise a trailing junk/refused/foreign comment (even a
  // stranger's wrong-lane event) would shift the frontier off a genuine
  // just-arrived audit, silently downgrading its binding from live metadata
  // to the recorded-head fallback. Two passes keep the frontier immune to
  // trailing noise while staying deterministic.
  const dryRun = replayStream(lane, ordered, replayPolicy, {}, null);
  const frontierCommentId = dryRun.lastAppliedCommentId;

  const live = replayStream(lane, ordered, replayPolicy, context, frontierCommentId);
  return { ok: true, lane: live.lane, dispositions: live.dispositions, labels: deriveLabels(live.lane), frozen };
}

// Replay the ordered comment stream over `startLane`. When `frontierCommentId`
// is non-null, the live context (pr_metadata / pr_head_sha) is passed through
// ONLY for that comment; every other comment is replayed with those transient
// signals stripped. Returns { lane, dispositions, lastAppliedCommentId }.
function replayStream(startLane, ordered, replayPolicy, context, frontierCommentId) {
  let lane = startLane;
  const dispositions = [];
  let lastAppliedCommentId = null;
  // The lane's CURRENT task packet, tracked as coordinator packet events are
  // applied, so later implementer events validate against it.
  let currentPacketCommentId = null;
  // Applied event ids (uniqueness) and consumed lease ids (no reuse), R3/R4.
  const seenEventIds = new Set();
  const usedLeaseIds = new Set();

  for (const comment of ordered) {
    if (!hasMarker(comment.body, MARKERS.event)) continue; // prose comment

    // Comment-mutation posture (R5): the event record is append-oriented, but
    // GitHub comments are editable/deletable. An EDITED protocol comment
    // (updated_at strictly after created_at) is routed to operator-required
    // rather than silently trusted — a v1 shadow-mode limitation, honestly
    // enforced instead of asserted.
    if (isEdited(comment)) {
      dispositions.push({
        comment_id: comment.id,
        status: "refused",
        refusal: "protocol-comment-edited",
        detail: `comment edited after posting (created ${comment.created_at}, updated ${comment.updated_at})`,
      });
      if (lane.state !== "operator-required" && !isTerminalState(lane.state)) {
        lane = toOperatorRequired(lane, `protocol-comment-edited: comment ${comment.id} was edited after posting`);
      }
      continue;
    }

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

    const ctx = { ...context };
    if (typeof comment.created_at === "string") {
      ctx.event_observed_at = comment.created_at;
    }
    // The authenticated comment author binds the lease holder + holder checks.
    ctx.comment_author = typeof comment.user === "string" ? comment.user : null;
    ctx.used_lease_ids = usedLeaseIds;
    // Live PR authority applies at the frontier only. Every non-frontier
    // event has the transient signals stripped so the reducer binds to the
    // deterministic event-recorded head.
    if (comment.id !== frontierCommentId) {
      delete ctx.pr_head_sha;
      delete ctx.pr_metadata;
    }
    // Task-packet binding (R2): only a coordinator packet-posting event may
    // NAME a packet comment, and only an EARLIER one. Every other event uses
    // the coordinator-approved packet tracked in currentPacketCommentId. The
    // packet is bound by source author + canonical digest, so editing the
    // packet comment after it was referenced breaks the binding.
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
        ctx.task_packet_digest = bound.digest;
        ctx.task_packet_source = { comment_id: packetRef, author: bound.author };
      } else {
        ctx.task_packet_bind_error = bound.reason;
      }
    }
    // Audit binding (R4): the referenced audit comment must be an EARLIER
    // comment authored by the SAME auditor posting the completion event,
    // bound by canonical digest. A future/foreign/edited audit comment
    // leaves audit_record unset → reducer refuses.
    if (event.refs?.audit_comment_id != null) {
      const bound = bindArtifact(ordered, event.refs.audit_comment_id, comment, MARKERS.audit, {
        requireEarlier: true,
        requireSameAuthor: true,
      });
      if (bound.ok) {
        ctx.audit_record = bound.value;
        ctx.audit_digest = bound.digest;
        ctx.audit_source = { comment_id: event.refs.audit_comment_id, author: bound.author };
      } else {
        ctx.audit_bind_error = bound.reason;
      }
    }

    const decision = reduce(lane, event, replayPolicy, ctx);
    if (decision.ok) {
      lane = decision.lane;
      lastAppliedCommentId = comment.id;
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
      }
      dispositions.push({ comment_id: comment.id, status: "applied", detail: decision.note || lane.last_transition });
    } else {
      dispositions.push({ comment_id: comment.id, status: "refused", refusal: decision.refusal, detail: decision.detail });
      if (decision.escalate && lane.state !== "operator-required") {
        lane = {
          ...lane,
          state: "operator-required",
          next_actor: nextActorFor("operator-required"),
          operator_required_reason: `${decision.refusal}: ${decision.detail}`,
        };
      }
    }
  }

  return { lane, dispositions, lastAppliedCommentId };
}

// A protocol comment is "edited" when the adapter reports an updated_at
// strictly after created_at. Both are GitHub-recorded; a missing updated_at
// (older adapter) is treated as not-edited.
function isEdited(comment) {
  const c = comment?.created_at;
  const u = comment?.updated_at;
  if (typeof c !== "string" || typeof u !== "string") return false;
  return Date.parse(u) > Date.parse(c);
}

function isTerminalState(state) {
  return state === "merged" || state === "superseded";
}

function toOperatorRequired(lane, reason) {
  return {
    ...lane,
    state: "operator-required",
    next_actor: nextActorFor("operator-required"),
    operator_required_reason: reason,
  };
}

// Bind a referenced artifact (task packet / audit record) from the durable
// stream, enforcing: EARLIER-than-referencing-comment (no forward reference),
// optional same-author-as-referencing-comment, and returning a canonical
// content digest so a later edit of the source comment breaks the binding.
// Returns { ok, value, digest, author } or { ok: false, reason }.
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
  return { ok: true, value: parsed.value, digest: payloadDigest(parsed.value), author: src.user };
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
