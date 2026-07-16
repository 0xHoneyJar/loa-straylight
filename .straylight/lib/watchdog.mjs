// Straylight Control Plane v1 — pure watchdog logic.
//
// scan(lanes, policy, context) -> { actions: [...] }
//
// Given reduced lane states, decide which recovery events SHOULD be
// posted. Pure and idempotent: running the scan twice over the same
// input yields the same action list, and each action carries a
// deterministic dedupe key so an adapter can refuse to post the same
// recovery event twice.
//
// The watchdog only proposes system/escalation events; the reducer
// remains the sole authority on whether they advance the lane.

import { validatePolicy, validateLane } from "./validate.mjs";

function hoursBetween(aIso, bIso) {
  return (Date.parse(bIso) - Date.parse(aIso)) / 3_600_000;
}

export function scan(lanes, policy, context = {}) {
  const pol = validatePolicy(policy ?? null);
  if (!pol.ok) return { ok: false, refusal: "policy-invalid", detail: pol.errors.join("; "), actions: [] };
  if (policy.enabled !== true) {
    return { ok: false, refusal: "automation-disabled", detail: "kill switch active", actions: [] };
  }
  const now = context.now;
  if (typeof now !== "string" || now.length === 0) {
    return { ok: false, refusal: "now-missing", detail: "watchdog requires context.now", actions: [] };
  }

  const actions = [];
  for (const lane of Array.isArray(lanes) ? lanes : []) {
    const lv = validateLane(lane);
    if (!lv.ok) {
      // A malformed lane is itself a finding — but the watchdog cannot
      // guess a recovery, so it routes to the operator.
      actions.push({
        type: "escalate-malformed-lane",
        lane_id: lane?.lane_id ?? "unknown",
        dedupe_key: `malformed:${lane?.lane_id ?? "unknown"}:${lane?.event_sequence ?? "na"}`,
        detail: lv.errors.join("; "),
      });
      continue;
    }
    if (lane.operator_pause === true) continue;

    // 1. Expired leases → propose system.lease_expired.
    if (lane.lease && lane.lease.expires_at <= now) {
      actions.push({
        type: "post-event",
        event_type: "system.lease_expired",
        lane_id: lane.lane_id,
        sequence: lane.event_sequence + 1,
        prior_state: lane.state,
        dedupe_key: `lease-expired:${lane.lane_id}:${lane.lease.lease_id}`,
        detail: `lease ${lane.lease.lease_id} expired ${lane.lease.expires_at}`,
      });
      continue; // one recovery step per lane per sweep
    }

    // 2. lease-expired lanes → propose requeue to the safe retry state.
    if (lane.state === "lease-expired") {
      const target = lane.pr_number != null && lane.pr_head_sha ? "ready-for-codex" : "ready-for-claude";
      actions.push({
        type: "post-event",
        event_type: "system.requeued",
        lane_id: lane.lane_id,
        sequence: lane.event_sequence + 1,
        prior_state: "lease-expired",
        requested_state: target,
        dedupe_key: `requeue:${lane.lane_id}:${lane.event_sequence}`,
        detail: `requeue to ${target}`,
      });
      continue;
    }

    // 3. ready-for-merge lanes whose PR head moved → invalidate ACCEPT.
    if (lane.state === "ready-for-merge" && lane.audited_sha) {
      const currentHead = context.pr_heads?.[String(lane.pr_number)] ?? null;
      if (currentHead && currentHead !== lane.audited_sha) {
        actions.push({
          type: "post-event",
          event_type: "system.head_moved",
          lane_id: lane.lane_id,
          sequence: lane.event_sequence + 1,
          prior_state: "ready-for-merge",
          dedupe_key: `head-moved:${lane.lane_id}:${currentHead}`,
          detail: `head ${currentHead} != audited ${lane.audited_sha}`,
        });
        continue;
      }
    }

    // 4. Lanes stuck beyond the configured threshold → escalation finding.
    //    (ready-for-codex without an audit event is the canonical case.)
    const stuckStates = ["ready-for-coordinator", "ready-for-claude", "ready-for-codex", "patch-required"];
    if (stuckStates.includes(lane.state) && context.last_activity?.[lane.lane_id]) {
      const idleHours = hoursBetween(context.last_activity[lane.lane_id], now);
      if (idleHours >= policy.stuck_lane_threshold_hours) {
        actions.push({
          type: "post-event",
          event_type: "system.escalated",
          lane_id: lane.lane_id,
          sequence: lane.event_sequence + 1,
          prior_state: lane.state,
          dedupe_key: `stuck:${lane.lane_id}:${lane.event_sequence}`,
          detail: `idle ${Math.floor(idleHours)}h in ${lane.state} (threshold ${policy.stuck_lane_threshold_hours}h)`,
        });
      }
    }
  }
  return { ok: true, actions };
}
