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
// Every recovery action that becomes an event also carries a
// deterministic, collision-resistant `event_id`: the sha256 digest of the
// FULL dedupe key (which embeds the complete lane_id and recovery key).
// Hashing — not truncation — guarantees two distinct long lane IDs or
// recovery keys can never yield the same event_id.
//
// All time comparisons parse timestamps into instants via the strict
// calendar parser (parseIsoInstant); no lexical string comparison is used
// anywhere. An unparseable time never satisfies a recovery condition —
// instead it surfaces as an explicit fail-closed finding.
//
// The watchdog only proposes system/escalation events; the reducer
// remains the sole authority on whether they advance the lane.

import { createHash } from "node:crypto";
import { validatePolicy, validateLane, parseIsoInstant } from "./validate.mjs";

// Deterministic, collision-resistant event id for a recovery action:
// sha256 over the full dedupe key (complete lane id + recovery key + seq).
// 48 hex chars (192 bits) fits the evt- pattern's 63-char budget.
export function recoveryEventId(dedupeKey) {
  return "evt-" + createHash("sha256").update(String(dedupeKey), "utf8").digest("hex").slice(0, 48);
}

export function scan(lanes, policy, context = {}) {
  const pol = validatePolicy(policy ?? null);
  if (!pol.ok) return { ok: false, refusal: "policy-invalid", detail: pol.errors.join("; "), actions: [] };
  if (policy.enabled !== true) {
    return { ok: false, refusal: "automation-disabled", detail: "kill switch active", actions: [] };
  }
  const nowMs = parseIsoInstant(typeof context.now === "string" ? context.now : null);
  if (nowMs === null) {
    return { ok: false, refusal: "now-missing", detail: "watchdog requires a valid UTC instant in context.now", actions: [] };
  }

  const actions = [];
  for (const entry of Array.isArray(lanes) ? lanes : []) {
    // ISSUE-KEYED ACTION CONTRACT (C8): a lane entry may carry the issue
    // number it was reconstructed from; every action for that lane then
    // carries `issue_number`, and callers key posting/dedupe by it —
    // never by a first-match lane-id → issue mapping.
    const issueNumber =
      Number.isInteger(entry?.issue_number) && entry.issue_number >= 1 ? entry.issue_number : null;
    const withIssue = (action) => (issueNumber !== null ? { issue_number: issueNumber, ...action } : action);
    const lane = entry;
    const lv = validateLane(lane);
    if (!lv.ok) {
      // A malformed lane is itself a finding — but the watchdog cannot
      // guess a recovery, so it routes to the operator. When the entry is
      // issue-keyed, the finding identity IS the issue number: no
      // synthetic lane identity exists to collide or mis-map.
      actions.push(withIssue({
        type: "escalate-malformed-lane",
        lane_id: lane?.lane_id ?? "unknown",
        dedupe_key: issueNumber !== null
          ? `malformed:issue:${issueNumber}`
          : `malformed:${lane?.lane_id ?? "unknown"}:${lane?.event_sequence ?? "na"}`,
        detail: lv.errors.join("; "),
      }));
      continue;
    }
    if (lane.operator_pause === true) continue;

    // 1. Expired leases → propose system.lease_expired. Parsed-instant
    //    comparison: validateLane guarantees expires_at parses.
    if (lane.lease && parseIsoInstant(lane.lease.expires_at) <= nowMs) {
      const dedupe = `lease-expired:${lane.lane_id}:${lane.lease.lease_id}:${lane.event_sequence}`;
      actions.push(withIssue({
        type: "post-event",
        event_type: "system.lease_expired",
        event_id: recoveryEventId(dedupe),
        lane_id: lane.lane_id,
        sequence: lane.event_sequence + 1,
        prior_state: lane.state,
        // event_sequence is part of the key so a recovery event refused in a
        // race (e.g. an operator pause consumed the sequence) is re-proposed
        // once the lane advances, instead of being deduped away forever.
        dedupe_key: dedupe,
        detail: `lease ${lane.lease.lease_id} expired ${lane.lease.expires_at}`,
      }));
      continue; // one recovery step per lane per sweep
    }

    // 2. lease-expired lanes → propose requeue to the safe retry state.
    if (lane.state === "lease-expired") {
      // Route by WHICH role lost its lease (recorded at expiry), not by PR
      // presence: an implementer whose lease expired mid-patch already has a
      // PR, but must return to ready-for-claude, not the auditor's queue.
      // Fall back to the PR-presence heuristic only when the role is absent
      // (lanes expired before this field existed).
      const target = lane.last_lease_role === "auditor"
        ? "ready-for-codex"
        : lane.last_lease_role === "implementer"
          ? "ready-for-claude"
          : (lane.pr_number != null && lane.pr_head_sha ? "ready-for-codex" : "ready-for-claude");
      const dedupe = `requeue:${lane.lane_id}:${lane.event_sequence}`;
      actions.push(withIssue({
        type: "post-event",
        event_type: "system.requeued",
        event_id: recoveryEventId(dedupe),
        lane_id: lane.lane_id,
        sequence: lane.event_sequence + 1,
        prior_state: "lease-expired",
        requested_state: target,
        dedupe_key: dedupe,
        detail: `requeue to ${target}`,
      }));
      continue;
    }

    // 3. eligibility-pending / ready-for-merge lanes whose PR head moved →
    //    invalidate the recorded ACCEPT (pending or confirmed alike).
    if ((lane.state === "ready-for-merge" || lane.state === "eligibility-pending") && lane.audited_sha) {
      const currentHead = context.pr_heads?.[String(lane.pr_number)] ?? null;
      if (currentHead && currentHead !== lane.audited_sha) {
        const dedupe = `head-moved:${lane.lane_id}:${currentHead}:${lane.event_sequence}`;
        actions.push(withIssue({
          type: "post-event",
          event_type: "system.head_moved",
          event_id: recoveryEventId(dedupe),
          lane_id: lane.lane_id,
          sequence: lane.event_sequence + 1,
          prior_state: lane.state,
          head_sha: currentHead, // recorded in the event for replay determinism
          dedupe_key: dedupe,
          detail: `head ${currentHead} != audited ${lane.audited_sha}`,
        }));
        continue;
      }
      // Fail closed on an UNVERIFIABLE head: if the adapter could not resolve
      // this PR's live head (fetch failed / rate-limited), we must NOT leave a
      // stale ACCEPT silently eligible. Surface a finding so the operator sees
      // that eligibility is unconfirmed. (Absence of the PR number from BOTH
      // pr_heads and pr_head_unresolved means the adapter did not attempt it —
      // e.g. no PR recorded — which is not a head-verification failure.)
      const unresolved = Array.isArray(context.pr_head_unresolved)
        ? context.pr_head_unresolved.map(String)
        : [];
      if (!currentHead && lane.pr_number != null && unresolved.includes(String(lane.pr_number))) {
        actions.push(withIssue({
          type: "flag-unverifiable-head",
          lane_id: lane.lane_id,
          dedupe_key: `head-unverifiable:${lane.lane_id}:${lane.audited_sha}:${lane.event_sequence}`,
          detail: `${lane.state} but PR #${lane.pr_number} head could not be resolved; ACCEPT eligibility is UNCONFIRMED (fail closed)`,
        }));
        continue;
      }
    }

    // 4. Lanes stuck beyond the configured threshold → escalation finding.
    //    (ready-for-codex without an audit event is the canonical case;
    //    eligibility-pending without a confirmation is its sibling.)
    const stuckStates = ["ready-for-coordinator", "ready-for-claude", "ready-for-codex", "eligibility-pending", "patch-required"];
    if (stuckStates.includes(lane.state) && context.last_activity?.[lane.lane_id]) {
      const lastMs = parseIsoInstant(context.last_activity[lane.lane_id]);
      if (lastMs === null) {
        // A timestamp we cannot parse means we cannot prove the lane is NOT
        // stuck. Fail closed by surfacing it, never by silently skipping.
        actions.push(withIssue({
          type: "flag-unverifiable-activity",
          lane_id: lane.lane_id,
          dedupe_key: `activity-unverifiable:${lane.lane_id}:${lane.event_sequence}`,
          detail: `last-activity timestamp unparseable (${String(context.last_activity[lane.lane_id]).slice(0, 40)}); stuck-lane check cannot run (fail closed)`,
        }));
        continue;
      }
      const idleHours = (nowMs - lastMs) / 3_600_000;
      if (idleHours >= policy.stuck_lane_threshold_hours) {
        const dedupe = `stuck:${lane.lane_id}:${lane.event_sequence}`;
        actions.push(withIssue({
          type: "post-event",
          event_type: "system.escalated",
          event_id: recoveryEventId(dedupe),
          lane_id: lane.lane_id,
          sequence: lane.event_sequence + 1,
          prior_state: lane.state,
          dedupe_key: dedupe,
          detail: `idle ${Math.floor(idleHours)}h in ${lane.state} (threshold ${policy.stuck_lane_threshold_hours}h)`,
        }));
      }
    }
  }
  return { ok: true, actions };
}
