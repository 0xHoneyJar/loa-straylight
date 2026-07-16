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
  validatePrMetadata,
  parseIsoInstant,
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
//   pr_head_sha         current head SHA of the lane PR, if known (legacy;
//                       superseded by pr_metadata for authoritative binding)
//   pr_metadata         normalized live PR object (repository, pr_number,
//                       state, draft, merged, base_branch, base_sha,
//                       head_branch, head_sha, fetch_ok) — AUTHORITATIVE at
//                       the audit frontier. Missing/partial → fail closed.
//   comment_author      authenticated GitHub login of the event's comment,
//                       used to bind a lease to its real holder (R3)
//   used_lease_ids      Set/array of lease IDs already consumed earlier in
//                       lane history (reused IDs are refused, R3)
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
  // Every role — including "system" — has its own allowlist. The CI bot
  // identity lives ONLY under system; validatePolicy rejects any policy
  // that puts a bot under operator (ADR-050 §3).
  if (!actorAllowed(policy, event.actor_role, event.github_actor)) {
    return refuse(
      lane,
      "actor-not-allowlisted",
      `${event.github_actor} not allowlisted for role ${event.actor_role}`,
    );
  }

  // -- 5. Transition legality (unknown event types die here). ----------------
  if (!isTransitionAllowed(lane.state, event.event_type, event.actor_role)) {
    return refuse(
      lane,
      "transition-forbidden",
      `${event.event_type} by ${event.actor_role} not allowed from ${lane.state}`,
    );
  }

  // -- 5.5. Next-actor turn discipline. --------------------------------------
  // A model role (coordinator/implementer/auditor) may only act when it is
  // the lane's next actor. Every non-escalation transition already satisfies
  // this by construction of the event table; the one gap the table leaves
  // open is coordinator.escalated, which is legal from states owned by the
  // implementer (ready-for-claude) and operator (ready-for-merge) — letting a
  // coordinator yank a lane out from under whoever's turn it actually is
  // (e.g. escalating a ready-for-merge lane the operator is about to merge).
  // The coordinator prompt already scopes the coordinator to coordinator-turn
  // lanes; this enforces it mechanically. The turn owner is DERIVED from the
  // lane state (nextActorFor) — not read from the stored next_actor
  // projection, which is derived state (ADR-050 §1.1) and must never be
  // trusted as authority. operator and system are the deliberate escape
  // hatches (the operator is the supreme authority; the watchdog must recover
  // any lane), so they bypass the turn check.
  const turnOwner = nextActorFor(lane.state);
  if (
    event.actor_role !== "operator" &&
    event.actor_role !== "system" &&
    event.actor_role !== turnOwner
  ) {
    return refuse(
      lane,
      "not-next-actor",
      `${event.actor_role} may not act; lane turn belongs to ${turnOwner}`,
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
      // Every packet field that names a target must correspond with the lane
      // (the same "every field must correspond" guarantee R1 applies to live
      // PR metadata). Without this a packet could drive the implementer into a
      // FOREIGN repository or an arbitrary target branch, or misdeclare the
      // next actor / patch cycle — none of which the format validator catches.
      if (packet.repository !== lane.repository) {
        return refuse(lane, "task-packet-wrong-repository", `packet repo ${packet.repository} != lane repo ${lane.repository}`);
      }
      if (lane.working_branch != null && packet.target_branch !== lane.working_branch) {
        return refuse(lane, "task-packet-wrong-target-branch", `packet target ${packet.target_branch} != lane working_branch ${lane.working_branch}`);
      }
      // An initial/patch packet hands off to the auditor after implementation.
      if (packet.expected_next_actor !== "auditor") {
        return refuse(lane, "task-packet-wrong-next-actor", `packet expected_next_actor ${packet.expected_next_actor} != auditor`);
      }
      if (event.event_type === "coordinator.patch_packet_posted") {
        if (packet.packet_kind !== "patch") {
          return refuse(lane, "task-packet-kind-mismatch", "patch event requires packet_kind=patch");
        }
        const nextCycle = lane.patch_cycle + 1;
        // The patch packet must declare the cycle it belongs to (the cycle it
        // advances the lane INTO), so a stale/duplicated packet cannot be
        // replayed at the wrong cycle.
        if (packet.patch_cycle !== nextCycle) {
          return refuse(lane, "task-packet-wrong-patch-cycle", `patch packet cycle ${packet.patch_cycle} != expected ${nextCycle}`);
        }
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
      // An initial packet belongs to the lane's current (pre-patch) cycle.
      if (packet.patch_cycle !== lane.patch_cycle) {
        return refuse(lane, "task-packet-wrong-patch-cycle", `initial packet cycle ${packet.patch_cycle} != lane ${lane.patch_cycle}`);
      }
      return advance(lane, event, "ready-for-claude");
    }

    case "implementer.lease_acquired":
    case "auditor.lease_acquired": {
      if (!event.lease_id || !event.lease_expires_at) {
        return refuse(lane, "lease-fields-missing", "lease_id and lease_expires_at required");
      }
      // A lease grant is time-bearing: without a trusted observed time we
      // cannot bound its expiry, so fail closed rather than store an
      // actor-chosen, unbounded window. observedAt uses the GitHub-recorded
      // comment time (event_observed_at), NOT the actor-supplied occurred_at.
      const grantAt = observedAt(context);
      if (grantAt === null) {
        return refuse(lane, "time-missing", "lease grant requires event_observed_at or now");
      }
      if (lane.lease) {
        // Unknown time already handled above; the existing lease is active
        // until its recorded expiry.
        const laneExp = parseIsoInstant(lane.lease.expires_at);
        if (laneExp === null || laneExp > grantAt) {
          return refuse(lane, "lease-already-held", `active lease ${lane.lease.lease_id}`);
        }
      }
      // A lease id may be consumed at most once across the whole lane history.
      // Reusing a released/expired id would let a stale worker's late result
      // re-match a fresh lease. The adapter tracks consumed ids in
      // context.used_lease_ids.
      const usedIds = leaseIdSet(context);
      if (usedIds.has(event.lease_id)) {
        return refuse(lane, "lease-id-reused", `lease_id ${event.lease_id} was already used in this lane`);
      }
      // The expiry is actor-supplied but must not exceed observed grant time
      // + the policy lease duration, and must be a real calendar instant. An
      // unbounded (e.g. year-2099) expiry would park the lane forever: the
      // watchdog only reaps a lease once its recorded expiry passes.
      const maxExpiry = grantAt + policy.lease_duration_minutes * 60000;
      const claimedExpiry = parseIsoInstant(event.lease_expires_at);
      if (claimedExpiry === null) {
        return refuse(lane, "lease-expiry-invalid", "lease_expires_at is not a valid UTC calendar instant");
      }
      if (claimedExpiry > maxExpiry) {
        return refuse(
          lane,
          "lease-expiry-unbounded",
          `lease_expires_at ${event.lease_expires_at} exceeds observed grant + ${policy.lease_duration_minutes}m`,
        );
      }
      // The lease is bound to the AUTHENTICATED comment author, not the
      // claimed github_actor (which validateEvent has already matched to the
      // allowlist for the role; reconstruct binds github_actor to the real
      // commenter). Without a known author we cannot bind a holder → fail closed.
      const holderLogin = context.comment_author ?? event.github_actor ?? null;
      if (typeof holderLogin !== "string" || holderLogin.length === 0) {
        return refuse(lane, "lease-holder-unknown", "lease grant requires an authenticated comment author");
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
        holder_login: holderLogin,
        grant_sequence: event.sequence,
        // acquired_at comes from the TRUSTED GitHub comment time, not the
        // actor-supplied occurred_at, so a forged occurred_at cannot widen
        // the lease window.
        acquired_at: observedIso(context) ?? event.occurred_at,
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
      // -- Live PR target authority (R1). ------------------------------------
      // At the audit FRONTIER the adapter supplies context.pr_metadata: the
      // normalized live PR object. When PRESENT it is AUTHORITATIVE and every
      // field must correspond with the lane and the audit record; a closed,
      // merged, draft, retargeted, wrong-repo, wrong-number, wrong-branch, or
      // head-moved PR must NOT record eligibility. A partial/malformed object,
      // or one whose fetch_ok is false, fails closed. This binds at the audit
      // transition itself — not only later in the merge guard — so a stale
      // ACCEPT is never stored.
      //
      // reconstruct supplies pr_metadata only for the frontier event, so
      // historical replay stays deterministic (non-frontier events take the
      // recorded-head branch below). When pr_metadata is WHOLLY ABSENT (an
      // adapter that supplies no live PR object at all, or historical replay),
      // this falls back to the event-recorded head — deterministic but NOT the
      // full live-liveness check. That is acceptable in v1 because it is
      // shadow-only and the merge guard independently fails closed on a
      // non-open / unverifiable PR before any human acts; the shipped reducer
      // workflow always attaches pr_metadata (fetch_ok:false on failure), so
      // the live check runs whenever a PR is named.
      const meta = context.pr_metadata ?? null;
      let currentHead;
      if (meta !== null) {
        const mv = validatePrMetadata(meta);
        if (!mv.ok) {
          return refuse(lane, "pr-metadata-invalid", mv.errors.join("; "));
        }
        if (meta.fetch_ok !== true) {
          return refuse(lane, "pr-metadata-unavailable", "live PR metadata fetch failed; cannot bind audit (fail closed)");
        }
        if (meta.repository !== lane.repository) {
          return refuse(lane, "pr-wrong-repository", `live PR repo ${meta.repository} != lane repo ${lane.repository}`);
        }
        if (meta.pr_number !== lane.pr_number) {
          return refuse(lane, "pr-wrong-number", `live PR #${meta.pr_number} != lane PR #${lane.pr_number}`);
        }
        if (meta.state !== "open") {
          return refuse(lane, "pr-not-open", `live PR state is ${meta.state}, not open`);
        }
        if (meta.merged === true) {
          return refuse(lane, "pr-already-merged", "live PR is already merged; audit cannot record eligibility");
        }
        // Draft policy (documented): a draft PR is by definition not ready to
        // merge, so an ACCEPT must not record eligibility against it. Fail
        // closed — the PR must be marked ready-for-review first.
        if (meta.draft === true) {
          return refuse(lane, "pr-draft", "live PR is a draft; mark it ready-for-review before an audit can record eligibility");
        }
        if (meta.base_branch !== lane.base_branch) {
          return refuse(lane, "pr-retargeted-branch", `live PR base ${meta.base_branch} != lane base_branch ${lane.base_branch}`);
        }
        if (meta.base_sha !== lane.base_sha) {
          return refuse(lane, "pr-base-sha-mismatch", `live PR base sha ${meta.base_sha} != lane base_sha ${lane.base_sha}`);
        }
        if (audit.base_branch !== meta.base_branch) {
          return refuse(lane, "audit-base-branch-mismatch", `audit base branch ${audit.base_branch} != live ${meta.base_branch}`);
        }
        if (audit.head_branch !== meta.head_branch) {
          return refuse(lane, "audit-head-branch-mismatch", `audit head branch ${audit.head_branch} != live ${meta.head_branch}`);
        }
        if (audit.audited_head_sha !== meta.head_sha) {
          return refuse(lane, "audit-stale-head", `audited ${audit.audited_head_sha} but live head is ${meta.head_sha}`);
        }
        currentHead = meta.head_sha;
      } else {
        // No metadata (historical replay, or a legacy pr_head_sha-only path):
        // fall back to the live head SHA if supplied, else the event-recorded
        // head, for deterministic replay. Unknown head → fail closed.
        const liveHead = context.pr_head_sha ?? null;
        currentHead = liveHead ?? lane.pr_head_sha ?? null;
        if (!currentHead) {
          return refuse(lane, "head-unknown", "current PR head SHA unavailable; cannot bind audit");
        }
        if (liveHead && lane.pr_head_sha && liveHead !== lane.pr_head_sha &&
            audit.audited_head_sha !== liveHead) {
          return refuse(
            lane,
            "audit-stale-head",
            `audited ${audit.audited_head_sha}; live head ${liveHead} diverges from recorded ${lane.pr_head_sha}`,
          );
        }
        if (audit.audited_head_sha !== currentHead) {
          return refuse(
            lane,
            "audit-stale-head",
            `audited ${audit.audited_head_sha} but current head is ${currentHead}`,
          );
        }
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
      // Record WHICH role lost its lease so recovery routes to the correct
      // retry state (implementer→ready-for-claude, auditor→ready-for-codex),
      // rather than guessing from PR presence.
      return advance(lane, event, "lease-expired", {
        lease: null,
        last_lease_role: lane.lease.actor_role,
      });
    }

    case "system.requeued": {
      // Watchdog recovery: return an expired lane to the safe retry state
      // for whichever role lost its lease. The target must match the role
      // recorded at expiry — a requeue to the other role's queue is refused
      // (a lost implementer must not be routed to the auditor and vice versa).
      const target = event.requested_state;
      if (target !== "ready-for-claude" && target !== "ready-for-codex") {
        return refuse(lane, "requeue-target-forbidden", `cannot requeue to ${target}`);
      }
      const expectedTarget = lane.last_lease_role === "auditor"
        ? "ready-for-codex"
        : lane.last_lease_role === "implementer"
          ? "ready-for-claude"
          : null;
      if (expectedTarget !== null && target !== expectedTarget) {
        return refuse(
          lane,
          "requeue-role-mismatch",
          `lost lease was ${lane.last_lease_role}; requeue target ${target} != ${expectedTarget}`,
        );
      }
      return advance(lane, event, target, { last_lease_role: null });
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
// Returns epoch millis or null (null → callers fail closed). Uses the strict
// calendar parser so an ISO-shaped but impossible time fails closed.
function observedAt(context) {
  const iso = context.event_observed_at ?? context.now;
  return parseIsoInstant(typeof iso === "string" ? iso : null);
}

// The observed time as its ISO string (the trusted comment time), or null.
function observedIso(context) {
  const iso = context.event_observed_at ?? context.now;
  return typeof iso === "string" && parseIsoInstant(iso) !== null ? iso : null;
}

// Consumed lease ids across applied lane history (adapter-supplied), so a
// released/expired id cannot be reused by a stale worker.
function leaseIdSet(context) {
  const raw = context.used_lease_ids;
  if (raw instanceof Set) return raw;
  if (Array.isArray(raw)) return new Set(raw);
  return new Set();
}

// A completion/release for a work role requires the active, unexpired lease
// with a matching lease_id AND a matching authenticated holder login. Late
// results after expiry are refused (v1 has no validated late-result path).
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
  // Holder binding: the authenticated author of THIS event's comment must be
  // the login that acquired the lease. A different worker (even one
  // allowlisted for the same role) cannot complete/release someone else's
  // lease. When the lease predates holder_login (legacy) or no author is
  // supplied, skip this specific check rather than fail an otherwise-valid
  // holder — the id + role + expiry checks still bind.
  if (lane.lease.holder_login) {
    const author = context.comment_author ?? event.github_actor ?? null;
    if (typeof author !== "string" || author !== lane.lease.holder_login) {
      return refuse(
        lane,
        "lease-holder-mismatch",
        `lease held by ${lane.lease.holder_login}, event from ${author ?? "unknown"}`,
      );
    }
  }
  const at = observedAt(context);
  if (at === null) {
    return refuse(lane, "time-missing", "lease validity check requires event_observed_at or now");
  }
  const exp = parseIsoInstant(lane.lease.expires_at);
  if (exp === null || exp <= at) {
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
