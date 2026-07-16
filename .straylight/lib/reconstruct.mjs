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

  const dispositions = [];
  const ordered = [...(Array.isArray(comments) ? comments : [])].sort((a, b) => a.id - b.id);
  // The transient live PR head (context.pr_head_sha) is authoritative ONLY at
  // the live audit frontier — the newest event-bearing comment. It must NOT
  // enter the replay of HISTORICAL events, or reconstruction stops being a
  // pure function of durable content: a head move after a legitimate ACCEPT
  // would re-judge the already-applied historical auditor.audit_completed and
  // rewind the projection (ready-for-merge → codex-working), desyncing from
  // the watchdog's replay-deterministic system.head_moved recovery. Historical
  // events bind to their event-recorded head (lane.pr_head_sha); the live head
  // only gates a freshly-arriving audit at the frontier.
  const frontierCommentId = (() => {
    for (let i = ordered.length - 1; i >= 0; i--) {
      if (hasMarker(ordered[i].body, MARKERS.event)) return ordered[i].id;
    }
    return null;
  })();
  // The lane's CURRENT task packet, tracked as coordinator packet events are
  // applied, so later implementer events validate against it without having
  // to repeat the reference.
  let currentPacketCommentId = null;
  // Every applied event's ID must be unique within the lane. The reducer's
  // sequence gate already stops a duplicate event from applying twice, but
  // it does NOT stop two DIFFERENT comments from reusing one event_id, which
  // would make the append-only audit trail non-uniquely addressable.
  const seenEventIds = new Set();

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

    // Event-ID uniqueness: a reused evt-* id (checked AFTER identity binding
    // so a stranger's forged comment cannot burn a legitimate id) makes the
    // durable record ambiguous — refuse the later occurrence. An id is
    // "used" only once its event is APPLIED (added to seenEventIds after a
    // successful reduce below), NOT when merely seen: a reducer-refused
    // comment must not burn its id, or an allowlisted actor could pre-post a
    // refused event carrying a future recovery event_id and permanently deny
    // that recovery (event-id burn / denial-of-recovery).
    if (typeof event.event_id === "string" && seenEventIds.has(event.event_id)) {
      dispositions.push({
        comment_id: comment.id,
        status: "refused",
        refusal: "duplicate-event-id",
        detail: `event_id ${event.event_id} already applied in this lane`,
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
    // Live head is authoritative at the frontier only (see above). For every
    // earlier (historical) event, strip it so the reducer binds the audit to
    // the deterministic event-recorded head instead.
    if (comment.id !== frontierCommentId) {
      delete ctx.pr_head_sha;
    }
    // Task-packet binding: an implementer must NOT be able to point the
    // reducer at a packet it authored itself. Only a coordinator
    // packet-posting event — whose comment is identity-bound to an
    // allowlisted coordinator — may name a fresh packet comment; every other
    // event uses the coordinator-approved packet tracked in
    // currentPacketCommentId (set only from an APPLIED coordinator packet
    // event below). An implementer's own refs.task_packet_comment_id is
    // ignored, so substituting a wide-scope self-authored packet fails closed.
    const isCoordinatorPacketEvent =
      event.event_type === "coordinator.task_packet_posted" ||
      event.event_type === "coordinator.patch_packet_posted";
    const packetRef = isCoordinatorPacketEvent
      ? (event.refs?.task_packet_comment_id ?? null)
      : currentPacketCommentId;
    if (packetRef != null) {
      const src = ordered.find((c) => c.id === packetRef);
      const tp = src ? extractPayload(src.body, MARKERS.taskPacket) : { ok: false, reason: "task-packet-comment-not-found" };
      if (tp.ok) ctx.task_packet = tp.value;
    }
    // Audit binding: the referenced audit comment must be authored by the
    // SAME authenticated actor that posts the audit_completed event (already
    // identity-bound above and, in reduce, allowlist-checked as an auditor).
    // Without this, any actor could post an audit payload and an auditor's
    // completion event could bind to it. When authorship fails the audit
    // record is left unset and the reducer refuses (audit-record-invalid).
    if (event.refs?.audit_comment_id != null) {
      const src = ordered.find((c) => c.id === event.refs.audit_comment_id);
      const authored = src && typeof src.user === "string" && src.user === comment.user;
      const ar = authored
        ? extractPayload(src.body, MARKERS.audit)
        : { ok: false, reason: "audit-comment-author-mismatch" };
      if (ar.ok) ctx.audit_record = ar.value;
    }

    const decision = reduce(lane, event, replayPolicy, ctx);
    if (decision.ok) {
      lane = decision.lane;
      // Burn the event_id only now that the event has actually advanced the
      // lane — a refused event leaves its id available for the legitimate
      // event that will carry it.
      if (typeof event.event_id === "string") seenEventIds.add(event.event_id);
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

  return { ok: true, lane, dispositions, labels: deriveLabels(lane), frozen };
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
