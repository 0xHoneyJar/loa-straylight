// Straylight Control Plane v1 — state machine (pure, dependency-free).
//
// Authority: docs/decisions/ADR-050-autonomous-execution-control-plane.md
// Contract:  .straylight/schemas/lane-v1.schema.json / event-v1.schema.json
//
// Labels and issue text are derived from this table, never the other way
// around. Anything not explicitly allowed here is forbidden (fail closed).

export const STATES = Object.freeze([
  "planning",
  "ready-for-coordinator",
  "ready-for-claude",
  "claude-working",
  "ready-for-codex",
  "codex-working",
  "eligibility-pending",
  "ready-for-merge",
  "merged",
  "patch-required",
  "blocked",
  "operator-required",
  "lease-expired",
  "superseded",
]);

export const TERMINAL_STATES = Object.freeze(["merged", "superseded"]);

export const ROLES = Object.freeze([
  "coordinator",
  "implementer",
  "auditor",
  "operator",
  "system",
]);

export const VERDICTS = Object.freeze([
  "ACCEPT",
  "PATCH",
  "REJECT",
  "CANNOT_AUDIT",
]);

// Event types. `to: null` means routing is computed by the reducer
// (verdict routing, requeue routing, operator decisions).
export const EVENT_TYPES = Object.freeze({
  "lane.activated": { role: ["coordinator", "operator"], from: ["planning"], to: "ready-for-coordinator" },
  "coordinator.task_packet_posted": { role: ["coordinator"], from: ["ready-for-coordinator"], to: "ready-for-claude" },
  "coordinator.patch_packet_posted": { role: ["coordinator"], from: ["patch-required"], to: "ready-for-claude" },
  // Escalation is turn-disciplined (reducer step 5.5): the coordinator may
  // only escalate a lane it actually owns. Its owned states are exactly
  // planning / ready-for-coordinator / patch-required (nextActorFor ===
  // "coordinator"). Lanes owned by other roles are escalated by that role
  // (implementer.escalated), by the watchdog (system.escalated, from="*"),
  // or by the operator — never by a coordinator acting out of turn.
  "coordinator.escalated": {
    role: ["coordinator"],
    from: ["planning", "ready-for-coordinator", "patch-required"],
    to: "operator-required",
  },
  "implementer.lease_acquired": { role: ["implementer"], from: ["ready-for-claude"], to: "claude-working" },
  "implementer.completed": { role: ["implementer"], from: ["claude-working"], to: "ready-for-codex" },
  "implementer.lease_released": { role: ["implementer"], from: ["claude-working"], to: "ready-for-claude" },
  "implementer.blocked": { role: ["implementer"], from: ["claude-working"], to: "blocked" },
  "implementer.escalated": { role: ["implementer"], from: ["claude-working"], to: "operator-required" },
  "auditor.lease_acquired": { role: ["auditor"], from: ["ready-for-codex"], to: "codex-working" },
  "auditor.audit_completed": { role: ["auditor"], from: ["codex-working"], to: null },
  "auditor.lease_released": { role: ["auditor"], from: ["codex-working"], to: "ready-for-codex" },
  // An ACCEPT audit parks the lane in eligibility-pending. Only this SYSTEM
  // event — posted by the reducer workflow and carrying the complete
  // authoritative live PR metadata it checked, embedded durably in the event
  // payload itself — advances it to ready-for-merge. Metadata-free replay of
  // an audit alone can therefore never produce ready-for-merge: the durable
  // record either contains a confirmation whose embedded metadata still
  // corresponds field-by-field with the lane, or eligibility stays pending.
  "system.eligibility_confirmed": { role: ["system"], from: ["eligibility-pending"], to: "ready-for-merge" },
  "operator.paused": { role: ["operator"], from: "*", to: null },
  "operator.resumed": { role: ["operator"], from: "*", to: null },
  "operator.decision": { role: ["operator"], from: ["operator-required", "blocked"], to: null },
  "operator.merged": { role: ["operator"], from: ["ready-for-merge"], to: "merged" },
  "operator.superseded": {
    role: ["operator"],
    from: ["planning", "ready-for-coordinator", "ready-for-claude", "claude-working", "ready-for-codex", "codex-working", "eligibility-pending", "ready-for-merge", "patch-required", "blocked", "operator-required", "lease-expired"],
    to: "superseded",
  },
  "system.lease_expired": { role: ["system"], from: ["claude-working", "codex-working"], to: "lease-expired" },
  "system.requeued": { role: ["system"], from: ["lease-expired"], to: null },
  // A moved head invalidates recorded eligibility whether it is still
  // pending confirmation or already confirmed.
  "system.head_moved": { role: ["system"], from: ["eligibility-pending", "ready-for-merge"], to: null },
  "system.escalated": { role: ["system"], from: "*", to: "operator-required" },
});

// Targets the operator may direct a lane to from operator-required/blocked.
// Deliberately excludes merged (use operator.merged from ready-for-merge)
// and working states (leases must be re-acquired by the actors themselves).
export const OPERATOR_DECISION_TARGETS = Object.freeze([
  "planning",
  "ready-for-coordinator",
  "ready-for-claude",
  "ready-for-codex",
  "blocked",
  "superseded",
]);

export const NEXT_ACTOR = Object.freeze({
  planning: "coordinator",
  "ready-for-coordinator": "coordinator",
  "ready-for-claude": "implementer",
  "claude-working": "implementer",
  "ready-for-codex": "auditor",
  "codex-working": "auditor",
  "eligibility-pending": "system",
  "ready-for-merge": "operator",
  merged: "none",
  "patch-required": "coordinator",
  blocked: "operator",
  "operator-required": "operator",
  "lease-expired": "system",
  superseded: "none",
});

export function isState(value) {
  return STATES.includes(value);
}

export function isRole(value) {
  return ROLES.includes(value);
}

export function isTerminal(state) {
  return TERMINAL_STATES.includes(state);
}

// True when `eventType` is defined, is legal from `state`, and is emitted
// by an allowed role. Unknown event types are never allowed (fail closed).
export function isTransitionAllowed(state, eventType, role) {
  const spec = EVENT_TYPES[eventType];
  if (!spec) return false;
  if (!spec.role.includes(role)) return false;
  if (spec.from === "*") return !isTerminal(state);
  return spec.from.includes(state);
}

export function nextActorFor(state) {
  return NEXT_ACTOR[state] ?? "operator";
}
