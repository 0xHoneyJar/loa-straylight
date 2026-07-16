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
//   comments:    [{ id, user, body, created_at? }...]
//                // user = AUTHENTICATED GitHub commenter login from the
//                // API; created_at = GitHub-recorded post time. Both are
//                // supplied by the adapter — never taken from the payload
//                // itself.
//   policy:      parsed automation-policy.json
//   context:     { now, pr_head_sha?, pr_heads? }
// }
//
// Returns {
//   ok, lane, dispositions: [{comment_id, status, refusal?, detail?}...],
//   labels: [...], refusal?, detail?
// }
//
// Idempotent by construction: same input → same output. Refused events
// never advance the lane, so replaying an already-processed comment stream
// converges to the same state.

import { MARKERS, extractPayload, hasMarker } from "./markers.mjs";
import { validateLane } from "./validate.mjs";
import { reduce } from "./reducer.mjs";
import { nextActorFor } from "./state-machine.mjs";

export function reconstructLane(input) {
  const { issue_body, comments, policy, context = {} } = input ?? {};

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

  const dispositions = [];
  const ordered = [...(Array.isArray(comments) ? comments : [])].sort((a, b) => a.id - b.id);
  // The lane's CURRENT task packet, tracked as coordinator packet events are
  // applied, so later implementer events validate against it without having
  // to repeat the reference.
  let currentPacketCommentId = null;

  for (const comment of ordered) {
    if (!hasMarker(comment.body, MARKERS.event)) continue; // prose comment
    const payload = extractPayload(comment.body, MARKERS.event);
    if (!payload.ok) {
      dispositions.push({ comment_id: comment.id, status: "refused", refusal: "event-unreadable", detail: payload.reason });
      continue;
    }
    const event = payload.value;

    // Identity binding: the event's CLAIMED github_actor must equal the
    // AUTHENTICATED commenter. An event pasted by someone else — even with
    // a perfectly forged payload — dies here.
    if (typeof comment.user !== "string" || event.github_actor !== comment.user) {
      dispositions.push({
        comment_id: comment.id,
        status: "refused",
        refusal: "actor-identity-mismatch",
        detail: `payload claims ${event.github_actor}, comment posted by ${comment.user}`,
      });
      continue;
    }

    // Supporting payloads referenced by the event are extracted from the
    // durable record as well (task packets / audits live in comments).
    // Lease-expiry checks use the GitHub-recorded comment time so that a
    // replay of history is deterministic (an event valid when posted stays
    // valid; a late event stays refused).
    const ctx = { ...context };
    if (typeof comment.created_at === "string") {
      ctx.event_observed_at = comment.created_at;
    }
    const packetRef = event.refs?.task_packet_comment_id ?? currentPacketCommentId;
    if (packetRef != null) {
      const src = ordered.find((c) => c.id === packetRef);
      const tp = src ? extractPayload(src.body, MARKERS.taskPacket) : { ok: false, reason: "task-packet-comment-not-found" };
      if (tp.ok) ctx.task_packet = tp.value;
    }
    if (event.refs?.audit_comment_id != null) {
      const src = ordered.find((c) => c.id === event.refs.audit_comment_id);
      const ar = src ? extractPayload(src.body, MARKERS.audit) : { ok: false, reason: "audit-comment-not-found" };
      if (ar.ok) ctx.audit_record = ar.value;
    }

    const decision = reduce(lane, event, policy, ctx);
    if (decision.ok) {
      lane = decision.lane;
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

  return { ok: true, lane, dispositions, labels: deriveLabels(lane) };
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
