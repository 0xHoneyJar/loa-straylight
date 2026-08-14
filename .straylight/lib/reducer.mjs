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
  admissionPolicyFor,
  parseIsoInstant,
} from "./validate.mjs";
import { payloadDigest } from "./canonical.mjs";

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

// Allowlist membership is read from the RESOLVED admission epoch, never from
// the live policy: whether an actor was allowlisted is a fact about the moment
// the event was recorded, not about today.
function actorAllowed(admission, role, githubActor) {
  const list = admission.actor_allowlist?.[role];
  return Array.isArray(list) && list.includes(githubActor);
}

// context:
//   event_observed_at   REQUIRED. The AUTHORITATIVE time the event was recorded
//                       — the authenticated GitHub comment created_at, supplied
//                       by reconstruct from the API. It selects the admission
//                       epoch, sets the lease grant instant, and decides
//                       whether a completion was timely. There is NO fallback
//                       to a reduction wall clock: the reducer's own run time is
//                       not authority over any of those questions, and letting
//                       it stand in would make a historical event's admission
//                       depend on when the reducer happened to run. The
//                       actor-supplied occurred_at is likewise never authority.
//   comment_author      authenticated GitHub login of the event's comment,
//                       used to bind a lease to its real holder (R3)
//   used_lease_ids      Set/array of lease IDs already consumed earlier in
//                       lane history (reused IDs are refused, R3)
//   task_packet         parsed task-packet payload backing an implementer event
//   audit_record        parsed audit payload backing auditor.audit_completed
//
// DETERMINISM INVARIANT: reduce() consults NO transient live signal. Live PR
// metadata enters the protocol only as a DURABLE field of a
// system.eligibility_confirmed event (checked by the reducer workflow,
// embedded in the event payload, re-validated here on every replay). An
// ACCEPT audit therefore parks the lane in eligibility-pending; nothing but
// that durable confirmation can produce ready-for-merge, so a replay with no
// metadata in context reaches exactly the same states as the live run.
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

  // -- 2.5. Admission epoch resolution. --------------------------------------
  // The four admission fields — authorized_corridor, actor_allowlist,
  // maximum_patch_cycles, lease_duration_minutes — are HISTORICAL authority:
  // they decide whether a DURABLE PAST event was admissible. They are resolved
  // ONCE here, from the epoch governing the event's authenticated observation
  // time, and every check below reads that resolved epoch. Nothing downstream
  // reads the live policy's top-level projection, so replaying the same durable
  // comment yields the same decision forever, whatever today's policy says.
  //
  // The observation time comes ONLY from context.event_observed_at. Absence or
  // an unparseable value fails closed; there is deliberately no reduction-clock
  // fallback, because the reducer's run time is not authority over which policy
  // governed a past event, when a lease was granted, or whether a completion
  // was timely.
  const observedMs = eventObservedAt(context);
  const observedIso = eventObservedIso(context);
  if (observedMs === null || observedIso === null) {
    return refuse(
      lane,
      "event-time-unavailable",
      "event admission requires context.event_observed_at (the authenticated GitHub comment time); the reducer run clock is not admission authority",
    );
  }
  const resolved = admissionPolicyFor(policy, observedMs);
  if (!resolved.ok) {
    return refuse(lane, "admission-epoch-unresolved", resolved.errors.join("; "));
  }
  const admission = resolved.admission;

  // -- 3. Corridor. -----------------------------------------------------------
  // Operator events bypass the corridor check so the operator can always
  // pause, decide, or supersede a lane that has fallen out of the corridor.
  if (!isOperatorEvent && !admission.authorized_corridor.includes(lane.phase)) {
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
  if (!actorAllowed(admission, event.actor_role, event.github_actor)) {
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
  const leaseCheck = checkLease(lane, event);
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
      // Working-branch discipline: the INITIAL coordinator packet ESTABLISHES
      // the lane's working branch (its target_branch becomes
      // lane.working_branch); every later packet must name that exact branch.
      // A packet may never name the lane's base branch as its target — the
      // implementer works on a working branch and merges only via the
      // operator.
      if (packet.target_branch === lane.base_branch) {
        return refuse(lane, "task-packet-targets-base-branch", `packet target ${packet.target_branch} is the lane base branch; a working branch is required`);
      }
      if (lane.working_branch != null && packet.target_branch !== lane.working_branch) {
        return refuse(lane, "task-packet-wrong-target-branch", `packet target ${packet.target_branch} != lane working_branch ${lane.working_branch}`);
      }
      // An initial/patch packet hands off to the auditor after implementation.
      if (packet.expected_next_actor !== "auditor") {
        return refuse(lane, "task-packet-wrong-next-actor", `packet expected_next_actor ${packet.expected_next_actor} != auditor`);
      }
      // Digest pinning (durable): the packet event must DECLARE the canonical
      // content digest of the packet it posts, and the declared digest must
      // equal the digest of the bound packet on every replay. The digest
      // lives in the durable event payload, so mutating the packet comment
      // after the event was posted is detected mechanically — independent of
      // GitHub edit metadata.
      const declaredPacketDigest = event.refs?.task_packet_digest;
      if (typeof declaredPacketDigest !== "string") {
        return refuse(lane, "task-packet-digest-missing", "packet event must declare refs.task_packet_digest");
      }
      if (declaredPacketDigest !== payloadDigest(packet)) {
        return refuse(lane, "task-packet-digest-mismatch", "bound packet content does not match the digest declared in the event");
      }
      if (event.event_type === "coordinator.patch_packet_posted") {
        if (packet.packet_kind !== "patch") {
          return refuse(lane, "task-packet-kind-mismatch", "patch event requires packet_kind=patch");
        }
        // A patch packet REFINES existing work on the established working
        // branch; a lane with no established branch has nothing to patch.
        if (lane.working_branch == null) {
          return refuse(lane, "task-packet-no-working-branch", "patch packet requires an established lane working_branch");
        }
        const nextCycle = lane.patch_cycle + 1;
        // The patch packet must declare the cycle it belongs to (the cycle it
        // advances the lane INTO), so a stale/duplicated packet cannot be
        // replayed at the wrong cycle.
        if (packet.patch_cycle !== nextCycle) {
          return refuse(lane, "task-packet-wrong-patch-cycle", `patch packet cycle ${packet.patch_cycle} != expected ${nextCycle}`);
        }
        if (nextCycle > admission.maximum_patch_cycles) {
          // Every escalation to operator-required clears the lease (checkLease
          // already refuses coordinator events under an active lease, so this
          // is belt-and-braces): a lease carried into operator-required would
          // be a cross-state lease and the lane would fail validation —
          // unrecoverable by the operator.
          return advance(
            lane, event, "operator-required",
            {
              operator_required_reason: `patch cycle ${nextCycle} exceeds maximum ${admission.maximum_patch_cycles}`,
              lease: null,
            },
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
      // The initial packet ESTABLISHES the lane working branch — a one-time,
      // coordinator-owned act on a lane that has none. It never inherits or
      // ratifies a pre-existing branch: a lane whose working_branch is
      // already set (reconstruction refuses genesis preseeding; an operator
      // reroute preserves an established branch) refuses a new INITIAL
      // packet outright. The branch comes unconditionally from THIS packet's
      // target_branch or not at all.
      if (lane.working_branch != null) {
        return refuse(
          lane,
          "working-branch-already-established",
          `lane working_branch ${lane.working_branch} is already established; an initial packet applies only to a lane with none`,
        );
      }
      return advance(lane, event, "ready-for-claude", {
        working_branch: packet.target_branch,
      });
    }

    case "implementer.lease_acquired":
    case "auditor.lease_acquired": {
      if (!event.lease_id || !event.lease_expires_at) {
        return refuse(lane, "lease-fields-missing", "lease_id and lease_expires_at required");
      }
      // A lease grant is time-bearing, and its instant is the GitHub-recorded
      // comment time resolved at step 2.5 — NOT the actor-supplied occurred_at
      // and NOT the reducer's run clock. A run-clock grant instant would let the
      // same durable grant get a different (and on a later replay, a wider)
      // window purely because the reducer ran later.
      const grantAt = observedMs;
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
      const maxExpiry = grantAt + admission.lease_duration_minutes * 60000;
      const claimedExpiry = parseIsoInstant(event.lease_expires_at);
      if (claimedExpiry === null) {
        return refuse(lane, "lease-expiry-invalid", "lease_expires_at is not a valid UTC calendar instant");
      }
      if (claimedExpiry > maxExpiry) {
        return refuse(
          lane,
          "lease-expiry-unbounded",
          `lease_expires_at ${event.lease_expires_at} exceeds observed grant + ${admission.lease_duration_minutes}m`,
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
        // The packet the implementer starts from must target the lane's
        // established working branch (the initial packet set it when applied).
        if (lane.working_branch == null ||
            context.task_packet.target_branch !== lane.working_branch) {
          return refuse(lane, "task-packet-wrong-target-branch",
            `packet target ${context.task_packet.target_branch} != lane working_branch ${lane.working_branch}`);
        }
      }
      const lease = {
        lane_id: lane.lane_id,
        actor_role: role,
        lease_id: event.lease_id,
        holder_login: holderLogin,
        grant_sequence: event.sequence,
        // acquired_at is the TRUSTED GitHub comment time resolved at step 2.5.
        // There is no fallback to the actor-supplied occurred_at: a forged
        // occurred_at must not be able to widen the lease window, and the
        // observed time is already known to be present and parseable here.
        acquired_at: observedIso,
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
      const held = requireHeldLease(lane, event, "implementer", context, observedMs);
      if (held) return held;
      if (!event.head_sha) {
        return refuse(lane, "head-sha-missing", "implementer.completed requires head_sha");
      }
      if (!event.refs?.pr_number && !lane.pr_number) {
        return refuse(lane, "pr-missing", "implementer.completed requires a PR reference");
      }
      // Branch discipline: implementation happens ON the lane working branch
      // established by the initial packet. The completion event must declare
      // the branch it pushed (head_branch) and it must be that branch.
      if (typeof event.head_branch !== "string" || event.head_branch.length === 0) {
        return refuse(lane, "head-branch-missing", "implementer.completed requires head_branch (the pushed working branch)");
      }
      if (lane.working_branch == null) {
        return refuse(lane, "no-working-branch", "lane has no established working branch; initial packet must establish it first");
      }
      if (event.head_branch !== lane.working_branch) {
        return refuse(lane, "wrong-working-branch", `implementer pushed ${event.head_branch}, lane working branch is ${lane.working_branch}`);
      }
      return advance(lane, event, "ready-for-codex", {
        lease: null,
        pr_number: event.refs?.pr_number ?? lane.pr_number,
        pr_head_sha: event.head_sha,
        verdict: null,
        audited_sha: null,
        audit_retry: 0,
      });
    }

    case "implementer.lease_released":
    case "auditor.lease_released": {
      const role = event.event_type.startsWith("implementer") ? "implementer" : "auditor";
      const held = requireHeldLease(lane, event, role, context, observedMs);
      if (held) return held;
      return advance(lane, event, spec.to, { lease: null });
    }

    case "implementer.blocked":
    case "implementer.escalated": {
      const held = requireHeldLease(lane, event, "implementer", context, observedMs);
      if (held) return held;
      return advance(lane, event, spec.to, {
        lease: null,
        operator_required_reason: event.event_type === "implementer.escalated" ? (event.reason ?? "implementer escalation") : lane.operator_required_reason ?? null,
      });
    }

    case "auditor.audit_completed": {
      const held = requireHeldLease(lane, event, "auditor", context, observedMs);
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
      if (audit.base_branch !== lane.base_branch) {
        return refuse(lane, "audit-base-branch-mismatch", `audit base branch ${audit.base_branch} != lane base_branch ${lane.base_branch}`);
      }
      // Branch discipline: the audit must bind to the lane's established
      // working branch (set by the initial coordinator packet).
      if (lane.working_branch == null) {
        return refuse(lane, "no-working-branch", "lane has no established working branch; cannot bind an audit");
      }
      if (audit.head_branch !== lane.working_branch) {
        return refuse(lane, "audit-head-branch-mismatch", `audit head branch ${audit.head_branch} != lane working_branch ${lane.working_branch}`);
      }
      if (!event.audited_sha || event.audited_sha !== audit.audited_head_sha) {
        return refuse(lane, "audit-sha-mismatch", "event audited_sha must equal audit record audited_head_sha");
      }
      if (event.verdict !== audit.verdict) {
        return refuse(lane, "audit-verdict-mismatch", "event verdict must equal audit record verdict");
      }
      // Digest pinning (durable): the completion event must DECLARE the
      // canonical content digest of the audit record it references, and the
      // declared digest must match the bound record on every replay. The
      // digest lives in the durable event payload, so a post-hoc mutation of
      // the audit comment is detected mechanically.
      const declaredAuditDigest = event.refs?.audit_digest;
      if (typeof declaredAuditDigest !== "string") {
        return refuse(lane, "audit-digest-missing", "audit completion event must declare refs.audit_digest");
      }
      if (declaredAuditDigest !== payloadDigest(audit)) {
        return refuse(lane, "audit-digest-mismatch", "bound audit content does not match the digest declared in the event");
      }
      // Deterministic head binding: the audit must bind to the head the
      // implementer durably recorded (implementer.completed.head_sha). This
      // is a pure function of lane history, so replay is deterministic. The
      // LIVE PR check happens at system.eligibility_confirmed, whose checked
      // metadata is embedded durably in that event.
      if (!lane.pr_head_sha) {
        return refuse(lane, "head-unknown", "lane has no recorded PR head SHA; cannot bind audit");
      }
      if (audit.audited_head_sha !== lane.pr_head_sha) {
        return refuse(
          lane,
          "audit-stale-head",
          `audited ${audit.audited_head_sha} but recorded head is ${lane.pr_head_sha}`,
        );
      }
      if (audit.complete_diff_reviewed !== true) {
        return refuse(lane, "audit-incomplete-diff", "complete base-to-head diff not confirmed");
      }
      const common = { lease: null, audited_sha: audit.audited_head_sha, verdict: audit.verdict };
      switch (audit.verdict) {
        case "ACCEPT":
          // NOT ready-for-merge. An ACCEPT parks the lane in
          // eligibility-pending; only a durable system.eligibility_confirmed
          // event carrying successfully-checked live PR metadata advances it.
          // Metadata-free replay therefore can never mint ready-for-merge.
          return advance(lane, event, "eligibility-pending", common, [],
            "ACCEPT recorded; awaiting durable live-PR-metadata confirmation (system.eligibility_confirmed)");
        case "PATCH":
          return advance(lane, event, "patch-required", common);
        case "REJECT":
          return advance(lane, event, "blocked", {
            ...common,
            operator_required_reason: event.reason ?? "audit REJECT",
          });
        case "CANNOT_AUDIT": {
          // validateAuditRecord has already required `retryable` to be a
          // boolean for CANNOT_AUDIT, so routing here is total: retryable
          // within budget → requeue to ready-for-codex; terminal (retryable
          // false, or budget exhausted) → blocked (operator-owned).
          const retries = lane.audit_retry ?? 0;
          if (audit.retryable === true && retries < 3) {
            return advance(lane, event, "ready-for-codex",
              { ...common, verdict: null, audited_sha: null, audit_retry: retries + 1 },
              [], `CANNOT_AUDIT retryable; audit requeued (retry ${retries + 1}/3)`);
          }
          return advance(lane, event, "blocked", {
            ...common,
            operator_required_reason: event.reason ??
              (audit.retryable === true
                ? "audit CANNOT_AUDIT (retry budget exhausted)"
                : "audit CANNOT_AUDIT (not retryable)"),
          });
        }
        default:
          return refuse(lane, "verdict-unknown", `verdict ${audit.verdict}`);
      }
    }

    case "system.eligibility_confirmed": {
      // The ONLY path from eligibility-pending to ready-for-merge. The event
      // must EMBED the complete authoritative live PR metadata the posting
      // workflow checked (validateEvent has validated its shape); the check
      // is re-run against the lane on every replay, so the durable record
      // itself proves the live check happened and corresponded. Absence of
      // metadata, a failed fetch, or any non-corresponding field fails
      // closed and the lane stays pending.
      const meta = event.pr_metadata ?? null;
      if (meta === null) {
        return refuse(lane, "pr-metadata-missing", "eligibility confirmation requires embedded live PR metadata");
      }
      const mv = validatePrMetadata(meta);
      if (!mv.ok) {
        return refuse(lane, "pr-metadata-invalid", mv.errors.join("; "));
      }
      if (meta.fetch_ok !== true) {
        return refuse(lane, "pr-metadata-unavailable", "embedded metadata records a failed fetch; cannot confirm eligibility (fail closed)");
      }
      if (lane.verdict !== "ACCEPT" || !lane.audited_sha) {
        return refuse(lane, "no-accept-recorded", "eligibility confirmation requires a recorded ACCEPT with an audited SHA");
      }
      if (meta.repository !== lane.repository) {
        return refuse(lane, "pr-wrong-repository", `live PR repo ${meta.repository} != lane repo ${lane.repository}`);
      }
      if (lane.pr_number == null || meta.pr_number !== lane.pr_number) {
        return refuse(lane, "pr-wrong-number", `live PR #${meta.pr_number} != lane PR #${lane.pr_number}`);
      }
      if (meta.state !== "open") {
        return refuse(lane, "pr-not-open", `live PR state is ${meta.state}, not open`);
      }
      // merged/draft must be OBSERVED false — validatePrMetadata guarantees
      // they are booleans when fetch_ok is true (an adapter that lost the
      // fields cannot default them; the record fails validation instead).
      if (meta.merged !== false) {
        return refuse(lane, "pr-already-merged", "live PR is merged; eligibility cannot be confirmed");
      }
      if (meta.draft !== false) {
        return refuse(lane, "pr-draft", "live PR is a draft; mark it ready-for-review before eligibility can be confirmed");
      }
      if (meta.base_branch !== lane.base_branch) {
        return refuse(lane, "pr-retargeted-branch", `live PR base ${meta.base_branch} != lane base_branch ${lane.base_branch}`);
      }
      if (meta.base_sha !== lane.base_sha) {
        return refuse(lane, "pr-base-sha-mismatch", `live PR base sha ${meta.base_sha} != lane base_sha ${lane.base_sha}`);
      }
      if (lane.working_branch == null || meta.head_branch !== lane.working_branch) {
        return refuse(lane, "pr-wrong-head-branch", `live PR head branch ${meta.head_branch} != lane working_branch ${lane.working_branch}`);
      }
      if (meta.head_sha !== lane.audited_sha) {
        return refuse(lane, "audit-stale-head", `live head ${meta.head_sha} != audited ${lane.audited_sha}`);
      }
      return advance(lane, event, "ready-for-merge", {},
        [{ type: "label", value: "cp-ready-for-merge" }],
        "shadow merge eligibility confirmed against durably-recorded live PR metadata; merge remains operator-only");
    }

    case "coordinator.escalated": {
      // Clear any lease on escalation (none should exist in coordinator-turn
      // states — checkLease refuses coordinator events under an active lease
      // — but a lane that escalates must ALWAYS leave operator-required
      // valid and recoverable, so this is enforced unconditionally).
      return advance(lane, event, "operator-required", {
        operator_required_reason: event.reason ?? "coordinator escalation",
        lease: null,
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
      // Routing a lane back to coordination (planning/ready-for-coordinator)
      // RESETS branch establishment: the next initial packet must find
      // working_branch null and establish it from its own target_branch —
      // it never inherits or ratifies a branch from a previous life of the
      // lane. Retry targets (ready-for-claude/ready-for-codex) keep the
      // established branch: their packets/audits must still bind to it.
      const rectifiesCoordination =
        event.requested_state === "planning" ||
        event.requested_state === "ready-for-coordinator";
      return advance(lane, event, event.requested_state, {
        operator_required_reason: null,
        lease: null,
        ...(rectifiesCoordination ? { working_branch: null } : {}),
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
      // Whether a lease had expired is a question about the PAST, so it is
      // answered against the observed (authenticated) time of THIS event —
      // resolved at step 2.5 — never against the reducer run's wall clock.
      // Strict parsed-instant comparison (never lexical, never lenient
      // Date.parse): an unparseable recorded expiry fails closed as
      // NOT-expired-yet-unreapable → surfaced via refusal, not guessed.
      const recordedExpiry = parseIsoInstant(lane.lease.expires_at);
      if (recordedExpiry === null) {
        return refuse(lane, "lease-expiry-invalid", "recorded lease expiry is not a valid UTC calendar instant");
      }
      if (recordedExpiry > observedMs) {
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

// THE ONLY time authority for event admission.
//
// `context.event_observed_at` is the AUTHENTICATED GitHub comment time of the
// event being reduced (reconstruct.mjs populates it from comment.created_at).
// There is deliberately NO fallback to the reducer run's wall clock: a wall
// clock would make "which admission epoch governs this event", "when was this
// lease granted", and "was this historical completion timely" depend on WHEN
// the replay happened rather than on when the event happened. Replaying the
// same history tomorrow would then produce different answers. Missing or
// unparseable observed time fails closed (null → the caller refuses).
//
// Returns epoch millis, using the strict calendar parser so an ISO-shaped but
// impossible instant fails closed rather than being coerced.
function eventObservedAt(context) {
  const iso = context.event_observed_at;
  return parseIsoInstant(typeof iso === "string" ? iso : null);
}

// The same authenticated instant as its ISO string, or null.
function eventObservedIso(context) {
  const iso = context.event_observed_at;
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
// `observedMs` is the authenticated observed instant of THIS event, resolved
// once in reduce(); it is threaded in rather than re-derived so that lease
// validity cannot be decided by a different clock than admission was.
function requireHeldLease(lane, event, role, context, observedMs) {
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
  const exp = parseIsoInstant(lane.lease.expires_at);
  if (exp === null || exp <= observedMs) {
    return refuse(lane, "lease-expired", `lease expired at ${lane.lease.expires_at}; no late-result path in v1`);
  }
  return null;
}

// General lease gate applied before per-event logic: a stale lease (expired
// but not yet reaped) must not let its holder mutate state through OTHER
// event types either. Only lease_acquired (fresh grant), system events, and
// operator events bypass this; completions are checked in requireHeldLease.
function checkLease(lane, event) {
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
