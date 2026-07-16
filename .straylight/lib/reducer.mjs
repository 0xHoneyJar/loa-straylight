// Straylight Control Plane v1 — pure lane reducer.
//
// reduce(lane, event, policy, context) -> decision
//
// The single place where an event is allowed (or refused) to advance a
// lane. Deterministic, side-effect free, idempotent: the same
// (lane, event, policy, context) always yields the same decision, and a
// decision applied twice is detected via sequence numbers.
//
// Decision shape:
//   { ok: true,  lane: <next lane>, effects: [...], note }
//   { ok: false, refusal: <code>, detail, lane: <unchanged lane>,
//     escalate: bool }        // escalate → route lane to operator-required
//
// FAIL CLOSED: every path that is not an explicit allow is a refusal.

import {
  EVENT_TYPES,
  OPERATOR_DECISION_TARGETS,
  isTransitionAllowed,
  isTerminal,
  nextActorFor,
} from "./state-machine.mjs";
import {
  validateLane,
  validateEvent,
  validatePolicy,
  validateLease,
  validateTaskPacket,
  validateAuditRecord,
} from "./validate.mjs";

function refuse(lane, code, detail, escalate = false) {
  return { ok: false, refusal: code, detail, lane, escalate };
}

function advance(lane, event, state, extra = {}, effects = [], note = "") {
  const next = {
    ...lane,
    ...extra,
    state,
    next_actor: nextActorFor(state),
    event_sequence: event.sequence,
    last_transition: `${lane.state} -[${event.event_type}#${event.sequence}]-> ${state}`,
  };
  return { ok: true, lane: next, effects, note };
}

function actorAllowed(policy, role, githubActor) {
  const list = policy.actor_allowlist?.[role];
  return Array.isArray(list) && list.includes(githubActor);
}

// context (all optional, but absence fails closed where noted):
//   now                 ISO timestamp of reduction time
//   event_observed_at   AUTHORITATIVE time the event was recorded (the
//                       GitHub comment's created_at) — used for lease-expiry
//                       checks so replaying history is deterministic: an
//                       event valid when posted stays valid on every replay,
//                       and a late event stays refused. Falls back to `now`.
//   pr_head_sha         current head SHA of the lane PR, if known
//   task_packet         parsed task-packet payload backing an implementer event
//   audit_record        parsed audit payload backing auditor.audit_completed
export function reduce(lane, event, policy, context = {}) {
  // -- 0. Structural validation: malformed anything → no advance. -----------
  const pol = validatePolicy(policy ?? null);
  if (!pol.ok) return refuse(lane, "policy-invalid", pol.errors.join("; "));
  const lv = validateLane(lane ?? null);
  if (!lv.ok) return refuse(lane, "lane-invalid", lv.errors.join("; "));
  const ev = validateEvent(event ?? null);
  if (!ev.ok) return refuse(lane, "event-invalid", ev.errors.join("; "));

  // -- 1. Kill switch and pause. --------------------------------------------
  if (policy.enabled !== true) {
    return refuse(lane, "automation-disabled", "policy.enabled is false (kill switch)");
  }
  const isOperatorEvent = event.actor_role === "operator";
  if (lane.operator_pause === true && !isOperatorEvent) {
    return refuse(lane, "lane-paused", "operator_pause is set; only operator events accepted");
  }

  // -- 2. Lane binding, terminality, sequencing. -----------------------------
  if (event.lane_id !== lane.lane_id) {
    return refuse(lane, "wrong-lane", `event lane ${event.lane_id} != ${lane.lane_id}`);
  }
  if (isTerminal(lane.state)) {
    return refuse(lane, "lane-terminal", `lane is ${lane.state}`);
  }
  if (event.sequence !== lane.event_sequence + 1) {
    return refuse(
      lane,
      "stale-sequence",
      `expected sequence ${lane.event_sequence + 1}, got ${event.sequence}`,
    );
  }
  if (event.prior_state !== lane.state) {
    return refuse(
      lane,
      "prior-state-mismatch",
      `event claims prior ${event.prior_state}, lane is ${lane.state}`,
    );
  }

  // -- 3. Corridor. -----------------------------------------------------------
  // Operator events bypass the corridor check so the operator can always
  // pause, decide, or supersede a lane that has fallen out of the corridor.
  if (!isOperatorEvent && !policy.authorized_corridor.includes(lane.phase)) {
    return refuse(
      lane,
      "outside-corridor",
      `phase ${lane.phase} not in policy corridor`,
      true,
    );
  }

  // -- 4. Actor identity allowlist (fail closed on unknown identity). --------
  if (!actorAllowed(policy, event.actor_role, event.github_actor)) {
    // "system" events must come from an allowlisted operator identity or the
    // repository's own workflow identity; policy lists them under operator.
    if (!(event.actor_role === "system" && actorAllowed(policy, "operator", event.github_actor))) {
      return refuse(
        lane,
        "actor-not-allowlisted",
        `${event.github_actor} not allowlisted for role ${event.actor_role}`,
      );
    }
  }

  // -- 5. Transition legality (unknown event types die here). ----------------
  if (!isTransitionAllowed(lane.state, event.event_type, event.actor_role)) {
    return refuse(
      lane,
      "transition-forbidden",
      `${event.event_type} by ${event.actor_role} not allowed from ${lane.state}`,
    );
  }
  const spec = EVENT_TYPES[event.event_type];

  // -- 6. Lease discipline. ---------------------------------------------------
  const leaseCheck = checkLease(lane, event, policy, context);
  if (leaseCheck) return leaseCheck;

  // -- 7. Per-event semantic checks and routing. ------------------------------
  switch (event.event_type) {
    case "coordinator.task_packet_posted":
    case "coordinator.patch_packet_posted": {
      const tp = validateTaskPacket(context.task_packet ?? null);
      if (!tp.ok) {
        return refuse(lane, "task-packet-invalid", tp.errors.join("; "));
      }
      const packet = context.task_packet;
      if (packet.lane_id !== lane.lane_id) {
        return refuse(lane, "task-packet-wrong-lane", `packet lane ${packet.lane_id}`);
      }
      if (packet.base_sha !== lane.base_sha) {
        return refuse(
          lane,
          "task-packet-stale-base",
          `packet base ${packet.base_sha} != lane base ${lane.base_sha}`,
        );
      }
      if (event.event_type === "coordinator.patch_packet_posted") {
        if (packet.packet_kind !== "patch") {
          return refuse(lane, "task-packet-kind-mismatch", "patch event requires packet_kind=patch");
        }
        const nextCycle = lane.patch_cycle + 1;
        if (nextCycle > policy.maximum_patch_cycles) {
          return advance(
            lane, event, "operator-required",
            { operator_required_reason: `patch cycle ${nextCycle} exceeds maximum ${policy.maximum_patch_cycles}` },
            [{ type: "label", value: "cp-operator-required" }],
            "patch-cycle maximum exceeded",
          );
        }
        return advance(lane, event, "ready-for-claude", {
          patch_cycle: nextCycle,
          verdict: null,
          audited_sha: null,
        });
      }
      if (packet.packet_kind !== "initial") {
        return refuse(lane, "task-packet-kind-mismatch", "initial event requires packet_kind=initial");
      }
      return advance(lane, event, "ready-for-claude");
    }

    case "implementer.lease_acquired":
    case "auditor.lease_acquired": {
      if (!event.lease_id || !event.lease_expires_at) {
        return refuse(lane, "lease-fields-missing", "lease_id and lease_expires_at required");
      }
      if (lane.lease) {
        const at = observedAt(context);
        // Unknown time → fail closed: assume the existing lease is active.
        if (at === null || Date.parse(lane.lease.expires_at) > at) {
          return refuse(lane, "lease-already-held", `active lease ${lane.lease.lease_id}`);
        }
      }
      const role = event.event_type === "implementer.lease_acquired" ? "implementer" : "auditor";
      // Claude must not begin implementation without a valid current task
      // packet bound to the lane's base SHA.
      if (role === "implementer") {
        const tp = validateTaskPacket(context.task_packet ?? null);
        if (!tp.ok) {
          return refuse(lane, "no-valid-task-packet", "implementer start requires a valid task packet");
        }
        if (context.task_packet.lane_id !== lane.lane_id ||
            context.task_packet.base_sha !== lane.base_sha) {
          return refuse(lane, "task-packet-stale-base", "task packet not bound to current lane base SHA");
        }
      }
      const lease = {
        lane_id: lane.lane_id,
        actor_role: role,
        lease_id: event.lease_id,
        grant_sequence: event.sequence,
        acquired_at: event.occurred_at,
        expires_at: event.lease_expires_at,
        expected_state: role === "implementer" ? "claude-working" : "codex-working",
      };
      const lc = validateLease(lease);
      if (!lc.ok) return refuse(lane, "lease-invalid", lc.errors.join("; "));
      return advance(lane, event, spec.to, {
        lease,
        attempt: role === "implementer" ? lane.attempt + 1 : lane.attempt,
      });
    }

    case "implementer.completed": {
      const held = requireHeldLease(lane, event, "implementer", context);
      if (held) return held;
      if (!event.head_sha) {
        return refuse(lane, "head-sha-missing", "implementer.completed requires head_sha");
      }
      if (!event.refs?.pr_number && !lane.pr_number) {
        return refuse(lane, "pr-missing", "implementer.completed requires a PR reference");
      }
      return advance(lane, event, "ready-for-codex", {
        lease: null,
        pr_number: event.refs?.pr_number ?? lane.pr_number,
        pr_head_sha: event.head_sha,
        working_branch: lane.working_branch ?? null,
        verdict: null,
        audited_sha: null,
        audit_retry: 0,
      });
    }

    case "implementer.lease_released":
    case "auditor.lease_released": {
      const role = event.event_type.startsWith("implementer") ? "implementer" : "auditor";
      const held = requireHeldLease(lane, event, role, context);
      if (held) return held;
      return advance(lane, event, spec.to, { lease: null });
    }

    case "implementer.blocked":
    case "implementer.escalated": {
      const held = requireHeldLease(lane, event, "implementer", context);
      if (held) return held;
      return advance(lane, event, spec.to, {
        lease: null,
        operator_required_reason: event.event_type === "implementer.escalated" ? (event.reason ?? "implementer escalation") : lane.operator_required_reason ?? null,
      });
    }

    case "auditor.audit_completed": {
      const held = requireHeldLease(lane, event, "auditor", context);
      if (held) return held;
      const ar = validateAuditRecord(context.audit_record ?? null);
      if (!ar.ok) {
        return refuse(lane, "audit-record-invalid", ar.errors.join("; "));
      }
      const audit = context.audit_record;
      if (audit.lane_id !== lane.lane_id) {
        return refuse(lane, "audit-wrong-lane", `audit lane ${audit.lane_id}`);
      }
      if (lane.pr_number == null || audit.pr_number !== lane.pr_number) {
        return refuse(lane, "audit-wrong-pr", `audit PR ${audit.pr_number} != lane PR ${lane.pr_number}`);
      }
      if (audit.base_sha !== lane.base_sha) {
        return refuse(lane, "audit-base-mismatch", "audited base differs from lane base");
      }
      if (!event.audited_sha || event.audited_sha !== audit.audited_head_sha) {
        return refuse(lane, "audit-sha-mismatch", "event audited_sha must equal audit record audited_head_sha");
      }
      if (event.verdict !== audit.verdict) {
        return refuse(lane, "audit-verdict-mismatch", "event verdict must equal audit record verdict");
      }
      // Exact-SHA binding: the audit only counts if it audited the CURRENT
      // head. The lane's event-derived head (set by implementer.completed)
      // is authoritative here so that replaying history is deterministic;
      // live-head divergence is detected separately by system.head_moved
      // and the merge guard. Unknown head → fail closed.
      const currentHead = lane.pr_head_sha ?? context.pr_head_sha ?? null;
      if (!currentHead) {
        return refuse(lane, "head-unknown", "current PR head SHA unavailable; cannot bind audit");
      }
      if (audit.audited_head_sha !== currentHead) {
        return refuse(
          lane,
          "audit-stale-head",
          `audited ${audit.audited_head_sha} but current head is ${currentHead}`,
        );
      }
      if (audit.complete_diff_reviewed !== true) {
        return refuse(lane, "audit-incomplete-diff", "complete base-to-head diff not confirmed");
      }
      const common = { lease: null, audited_sha: audit.audited_head_sha, verdict: audit.verdict };
      switch (audit.verdict) {
        case "ACCEPT":
          return advance(lane, event, "ready-for-merge", common,
            [{ type: "label", value: "cp-ready-for-merge" }],
            "shadow merge eligibility recorded; merge remains operator-only");
        case "PATCH":
          return advance(lane, event, "patch-required", common);
        case "REJECT":
          return advance(lane, event, "blocked", {
            ...common,
            operator_required_reason: event.reason ?? "audit REJECT",
          });
        case "CANNOT_AUDIT": {
          const retries = lane.audit_retry ?? 0;
          if (audit.retryable === true && retries < 3) {
            return advance(lane, event, "ready-for-codex",
              { ...common, verdict: null, audited_sha: null, audit_retry: retries + 1 },
              [], `CANNOT_AUDIT retryable; audit requeued (retry ${retries + 1}/3)`);
          }
          return advance(lane, event, "blocked", {
            ...common,
            operator_required_reason: event.reason ?? "audit CANNOT_AUDIT",
          });
        }
        default:
          return refuse(lane, "verdict-unknown", `verdict ${audit.verdict}`);
      }
    }

    case "coordinator.escalated": {
      return advance(lane, event, "operator-required", {
        operator_required_reason: event.reason ?? "coordinator escalation",
      });
    }

    case "operator.paused": {
      return advance(lane, event, lane.state, { operator_pause: true },
        [{ type: "label", value: "cp-paused" }], "lane paused; state unchanged");
    }

    case "operator.resumed": {
      if (lane.operator_pause !== true) {
        return refuse(lane, "not-paused", "resume on a lane that is not paused");
      }
      return advance(lane, event, lane.state, { operator_pause: false },
        [{ type: "unlabel", value: "cp-paused" }], "lane resumed; state unchanged");
    }

    case "operator.decision": {
      if (!event.requested_state) {
        return refuse(lane, "decision-target-missing", "operator.decision requires requested_state");
      }
      if (!OPERATOR_DECISION_TARGETS.includes(event.requested_state)) {
        return refuse(lane, "decision-target-forbidden", `operator cannot route to ${event.requested_state} via decision`);
      }
      return advance(lane, event, event.requested_state, {
        operator_required_reason: null,
        lease: null,
      });
    }

    case "operator.merged": {
      // Records that the OPERATOR merged (outside the control plane). The
      // control plane itself never merges; this event is bookkeeping.
      if (!event.head_sha || event.head_sha !== lane.audited_sha) {
        return refuse(lane, "merge-sha-mismatch", "operator.merged head_sha must equal audited_sha");
      }
      return advance(lane, event, "merged", {}, [{ type: "label", value: "cp-merged" }]);
    }

    case "operator.superseded": {
      return advance(lane, event, "superseded", { lease: null });
    }

    case "lane.activated": {
      return advance(lane, event, "ready-for-coordinator");
    }

    case "system.lease_expired": {
      if (!lane.lease) {
        return refuse(lane, "no-lease-to-expire", "system.lease_expired without an active lease");
      }
      const at = observedAt(context);
      if (at === null) {
        return refuse(lane, "time-missing", "lease expiry check requires event_observed_at or now");
      }
      if (Date.parse(lane.lease.expires_at) > at) {
        return refuse(lane, "lease-not-expired", `lease valid until ${lane.lease.expires_at}`);
      }
      return advance(lane, event, "lease-expired", { lease: null });
    }

    case "system.requeued": {
      // Watchdog recovery: return an expired lane to the safe retry state
      // for whichever role lost its lease.
      const target = event.requested_state;
      if (target !== "ready-for-claude" && target !== "ready-for-codex") {
        return refuse(lane, "requeue-target-forbidden", `cannot requeue to ${target}`);
      }
      return advance(lane, event, target, {});
    }

    case "system.escalated": {
      return advance(lane, event, "operator-required", {
        operator_required_reason: event.reason ?? "watchdog escalation",
        lease: null,
      }, [{ type: "label", value: "cp-operator-required" }]);
    }

    case "system.head_moved": {
      // A changed PR head invalidates a prior ACCEPT. The event carries the
      // NEW head SHA itself (recorded by the watchdog at observation time)
      // so that replaying history is deterministic even after the live PR
      // moves again or closes.
      const newHead = event.head_sha ?? null;
      if (!newHead) {
        return refuse(lane, "head-missing", "system.head_moved requires event.head_sha (the observed new head)");
      }
      if (lane.audited_sha && newHead === lane.audited_sha) {
        return refuse(lane, "head-not-moved", "observed head equals audited SHA");
      }
      return advance(lane, event, "ready-for-codex", {
        pr_head_sha: newHead,
        verdict: null,
        audited_sha: null,
      }, [{ type: "unlabel", value: "cp-ready-for-merge" }], "prior ACCEPT invalidated by head move");
    }

    default:
      // isTransitionAllowed already filtered unknown types; this is a
      // defense-in-depth backstop.
      return refuse(lane, "event-type-unhandled", event.event_type);
  }
}

// Authoritative time for lease checks: the GitHub-recorded comment time
// when replaying history (deterministic), else reduction wall-clock.
// Returns epoch millis or null (null → callers fail closed).
function observedAt(context) {
  const iso = context.event_observed_at ?? context.now;
  if (typeof iso !== "string") return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

// A completion/release for a work role requires the active, unexpired lease
// with a matching lease_id. Late results after expiry are refused (v1 has
// no validated late-result path).
function requireHeldLease(lane, event, role, context) {
  if (!lane.lease) {
    return refuse(lane, "no-active-lease", `${event.event_type} requires an active lease`);
  }
  if (lane.lease.actor_role !== role) {
    return refuse(lane, "lease-role-mismatch", `lease held by ${lane.lease.actor_role}, event from ${role}`);
  }
  if (!event.lease_id || event.lease_id !== lane.lease.lease_id) {
    return refuse(lane, "lease-id-mismatch", "event does not carry the active lease id");
  }
  const at = observedAt(context);
  if (at === null) {
    return refuse(lane, "time-missing", "lease validity check requires event_observed_at or now");
  }
  if (Date.parse(lane.lease.expires_at) <= at) {
    return refuse(lane, "lease-expired", `lease expired at ${lane.lease.expires_at}; no late-result path in v1`);
  }
  return null;
}

// General lease gate applied before per-event logic: a stale lease (expired
// but not yet reaped) must not let its holder mutate state through OTHER
// event types either. Only lease_acquired (fresh grant), system events, and
// operator events bypass this; completions are checked in requireHeldLease.
function checkLease(lane, event, _policy, context) {
  if (!lane.lease) return null;
  const bypass =
    event.actor_role === "operator" ||
    event.actor_role === "system" ||
    event.event_type.endsWith("lease_acquired");
  if (bypass) return null;
  const holderEvents = [
    "implementer.completed", "implementer.lease_released", "implementer.blocked", "implementer.escalated",
    "auditor.audit_completed", "auditor.lease_released",
  ];
  if (!holderEvents.includes(event.event_type)) {
    // e.g. a coordinator trying to re-packet a lane mid-lease.
    return refuse(lane, "lease-held", `lane leased to ${lane.lease.actor_role} until ${lane.lease.expires_at}`);
  }
  return null; // holder events get the full expiry check in requireHeldLease
}
