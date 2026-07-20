// Control Plane v1 — direct regressions for the Codex seventh-round
// findings. One describe() per finding; each test reproduces the reported
// failure shape against the patched code.
//
//  G1  invalid-policy precedence in reconstruction: a policy that fails
//      validatePolicy authorizes NOTHING — including the comment-level
//      handling. Before the fix, the edited-comment (R5) check ran BEFORE
//      any policy validation inside the comment loop, so an EDITED protocol
//      comment (event, task packet, or audit record) still invoked
//      toOperatorRequired and CHANGED THE LANE STATE under a policy that
//      never validly existed. Reconstruction now refuses every protocol
//      comment as policy-invalid before the edited-comment check (and
//      before the identity / artifact / event routes), so the lane stays
//      exactly at its genesis state and event sequence.
//
//  G2  workflow policy gates decided on jq TEXTUAL output:
//      `jq -r '.enabled'` prints `true` for the STRING "true" exactly as
//      for the boolean true, and inspects nothing else about the policy —
//      so the reducer, watchdog, and bootstrap workflows would have
//      treated `"enabled": "true"` (or an otherwise-invalid policy with a
//      boolean enabled) as an enabled policy. All control-plane workflows
//      now consult ONE canonical executable gate (policy-gate.mjs →
//      validatePolicy) that validates the COMPLETE policy and decides on
//      literal booleans: exit 0 = valid + enabled true; exit 3 = valid
//      kill switch (boolean false, no action); anything else = malformed
//      → fail closed (never enabled, never a valid kill switch).
//
//  G3  workflow mutation points ran off loosely-checked reconstructions:
//      the reducer's eligibility confirmation / label sync / result
//      publication now each require `.ok == true` AND `.frozen == false`
//      with jq's type-strict equality, and the watchdog's scan only
//      ingests ok/unfrozen reconstructions. Bootstrap label/issue
//      creation and watchdog recovery posting are unreachable under a
//      malformed or disabled policy (the gate fails the job / gates the
//      steps off).
//
//  G4  reconstruct.d.mts claimed an UNUSABLE policy is faithfully
//      replayed as a frozen projection. Corrected: frozen:true from a
//      structurally VALID disabled policy is a faithful freeze-not-rewind
//      replay; an INVALID policy is fail-closed at genesis and authorizes
//      no reconstruction-side state change and no workflow mutation.

import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { renderPayload, MARKERS } from "../../.straylight/lib/markers.mjs";
import {
  makeLane, makeEvent, makePolicy, makeTaskPacket, makeAuditRecord,
  payloadDigest,
  NOW, LEASE_EXPIRY, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const EDITED_AT = "2026-07-16T13:00:00Z"; // strictly after NOW → edited

// -- helpers (same shapes as codex-round6-regressions.test.ts) ---------------

function laneGenesisBody() {
  return `# Lane\n\n${renderPayload(MARKERS.lane, makeLane())}`;
}
function evComment(id: number, user: string, event: any, extra: Record<string, any> = {}) {
  return { id, user, body: `note\n\n${renderPayload(MARKERS.event, event)}`, created_at: NOW, ...extra };
}
function packetComment(id: number, user: string, packet: any, extra: Record<string, any> = {}) {
  return { id, user, body: renderPayload(MARKERS.taskPacket, packet), created_at: NOW, ...extra };
}
function auditComment(id: number, user: string, audit: any, extra: Record<string, any> = {}) {
  return { id, user, body: renderPayload(MARKERS.audit, audit), created_at: NOW, ...extra };
}

// Every malformed `enabled` shape the goal names. `MISSING` is a sentinel:
// the field is deleted rather than assigned.
const MISSING = Symbol("missing");
const MALFORMED_ENABLED: Array<[string, any]> = [
  ['string "false"', "false"],
  ['string "true"', "true"],
  ["null", null],
  ["missing", MISSING],
  ["number 1", 1],
  ["number 0", 0],
  ["array", []],
  ["object", { enabled: true }],
];
function policyWithEnabled(value: any) {
  const policy = makePolicy();
  if (value === MISSING) delete (policy as any).enabled;
  else (policy as any).enabled = value;
  return policy;
}

// The full happy path to ready-for-merge (7 applied events) so freeze
// (faithful replay) stays distinguishable from fail-closed-at-genesis.
function happyPathComments() {
  const packet = makeTaskPacket();
  return [
    evComment(1, "chatgpt-login", makeEvent({ sequence: 1 })),
    packetComment(2, "chatgpt-login", packet),
    evComment(3, "chatgpt-login", makeEvent({
      sequence: 2, event_type: "coordinator.task_packet_posted",
      prior_state: "ready-for-coordinator",
      refs: { task_packet_comment_id: 2, task_packet_digest: payloadDigest(packet) },
    })),
    evComment(4, "claude-login", makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: LEASE_EXPIRY,
    })),
    evComment(5, "claude-login", makeEvent({
      sequence: 4, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.completed", prior_state: "claude-working",
      lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
      refs: { pr_number: 120 },
    })),
    evComment(6, "codex-login", makeEvent({
      sequence: 5, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      lease_id: "lease-codex-1", lease_expires_at: LEASE_EXPIRY,
    })),
    auditComment(7, "codex-login", makeAuditRecord()),
    evComment(8, "codex-login", makeEvent({
      sequence: 6, actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.audit_completed", prior_state: "codex-working",
      lease_id: "lease-codex-1", audited_sha: HEAD_SHA, verdict: "ACCEPT",
      refs: { audit_comment_id: 7, pr_number: 120, audit_digest: payloadDigest(makeAuditRecord()) },
    })),
    evComment(9, "github-actions[bot]", makeEvent({
      sequence: 7, actor_role: "system", github_actor: "github-actions[bot]",
      event_type: "system.eligibility_confirmed", prior_state: "eligibility-pending",
      pr_metadata: {
        fetch_ok: true, repository: "0xHoneyJar/loa-straylight", pr_number: 120,
        state: "open", draft: false, merged: false, base_branch: "main",
        base_sha: makeLane().base_sha, head_branch: WORKING_BRANCH, head_sha: HEAD_SHA,
      },
    })),
  ];
}

function reconstruct(comments: any[], policy: any) {
  return reconstructLane({ issue_body: laneGenesisBody(), comments, policy, context: { now: NOW } });
}

// The lane must be EXACTLY the untouched genesis: original state, original
// event sequence, no operator routing, and only genesis-derived labels.
function expectUntouchedGenesis(out: ReturnType<typeof reconstructLane>) {
  expect(out.ok).toBe(true); // genesis itself is valid — the COMMENTS are refused
  expect(out.frozen).toBe(true);
  expect(out.lane?.state).toBe("planning");
  expect(out.lane?.event_sequence).toBe(0);
  expect(out.lane?.operator_required_reason ?? null).toBeNull();
  expect(out.dispositions.length).toBeGreaterThan(0);
  for (const d of out.dispositions) {
    expect(d.status).toBe("refused");
    expect(d.refusal).toBe("policy-invalid");
  }
  // Labels derive from the UNCHANGED genesis lane — never from a changed one.
  expect(out.labels).toContain("cp-state:planning");
  expect(out.labels).toContain("cp-next:coordinator");
  expect(out.labels.some((l: string) => l.includes("operator-required"))).toBe(false);
}

// =============================================================================
// G1 — invalid-policy precedence over comment-level handling.
// =============================================================================
describe("G1 — an invalid policy refuses every protocol comment BEFORE edited-comment routing", () => {
  it('an EDITED valid event under enabled:"false" leaves the lane at genesis as policy-invalid (never operator-required)', () => {
    const out = reconstruct(
      [evComment(1, "chatgpt-login", makeEvent({ sequence: 1 }), { updated_at: EDITED_AT })],
      makePolicy({ enabled: "false" }),
    );
    expectUntouchedGenesis(out);
    // Precedence pin: the refusal is policy-invalid, NOT protocol-comment-edited.
    expect(out.dispositions[0]?.refusal).toBe("policy-invalid");
    expect(out.lane?.state).not.toBe("operator-required");
  });

  it('an EDITED valid event under enabled:"true" leaves the lane at genesis as policy-invalid', () => {
    const out = reconstruct(
      [evComment(1, "chatgpt-login", makeEvent({ sequence: 1 }), { updated_at: EDITED_AT })],
      makePolicy({ enabled: "true" }),
    );
    expectUntouchedGenesis(out);
    expect(out.dispositions[0]?.refusal).toBe("policy-invalid");
  });

  it("an EDITED task-packet-only comment cannot route to operator-required under ANY malformed enabled value", () => {
    for (const [label, bad] of MALFORMED_ENABLED) {
      const out = reconstruct(
        [packetComment(1, "chatgpt-login", makeTaskPacket(), { updated_at: EDITED_AT })],
        policyWithEnabled(bad),
      );
      expect(out.lane?.state, `enabled as ${label}`).toBe("planning");
      expect(out.lane?.event_sequence, `enabled as ${label}`).toBe(0);
      expect(out.dispositions, `enabled as ${label}`).toEqual([
        expect.objectContaining({ comment_id: 1, status: "refused", refusal: "policy-invalid" }),
      ]);
    }
  });

  it("an EDITED audit-only comment cannot route to operator-required under ANY malformed enabled value", () => {
    for (const [label, bad] of MALFORMED_ENABLED) {
      const out = reconstruct(
        [auditComment(1, "codex-login", makeAuditRecord(), { updated_at: EDITED_AT })],
        policyWithEnabled(bad),
      );
      expect(out.lane?.state, `enabled as ${label}`).toBe("planning");
      expect(out.dispositions, `enabled as ${label}`).toEqual([
        expect.objectContaining({ comment_id: 1, status: "refused", refusal: "policy-invalid" }),
      ]);
    }
  });

  it("missing/null/numeric/array/object enabled values cannot change lane state through edited-comment handling on a FULL stream", () => {
    // The full happy path PLUS a trailing edited event: nothing applies,
    // nothing escalates — the lane never leaves genesis.
    for (const [label, bad] of MALFORMED_ENABLED) {
      const out = reconstruct(
        [
          ...happyPathComments(),
          evComment(10, "chatgpt-login", makeEvent({ sequence: 99 }), { updated_at: EDITED_AT }),
        ],
        policyWithEnabled(bad),
      );
      expect(out.lane?.state, `enabled as ${label}`).toBe("planning");
      expect(out.lane?.event_sequence, `enabled as ${label}`).toBe(0);
      expect(out.dispositions.every((d) => d.status === "refused" && d.refusal === "policy-invalid"),
        `enabled as ${label}`).toBe(true);
    }
  });

  it("a boolean enabled paired with another invalid policy field is ALSO refused before edited-comment routing", () => {
    for (const enabled of [true, false]) {
      const out = reconstruct(
        [evComment(1, "chatgpt-login", makeEvent({ sequence: 1 }), { updated_at: EDITED_AT })],
        makePolicy({ enabled, auto_merge: true }),
      );
      expectUntouchedGenesis(out);
      expect(out.dispositions[0]?.detail, `enabled: ${enabled}`).toMatch(/auto_merge/);
    }
  });

  it("VALID policy behavior is preserved: an edited protocol comment still routes to operator-required", () => {
    const out = reconstruct(
      [evComment(1, "chatgpt-login", makeEvent({ sequence: 1 }), { updated_at: EDITED_AT })],
      makePolicy(),
    );
    expect(out.dispositions[0]?.refusal).toBe("protocol-comment-edited");
    expect(out.lane?.state).toBe("operator-required");
  });

  it("VALID enabled:false still preserves freeze-not-rewind: projection equals the live replay", () => {
    const live = reconstruct(happyPathComments(), makePolicy());
    const killed = reconstruct(happyPathComments(), makePolicy({ enabled: false }));
    expect(killed.ok).toBe(true);
    expect(killed.frozen).toBe(true);
    expect(killed.lane).toEqual(live.lane);
    expect(killed.lane?.state).toBe("ready-for-merge");
    expect(killed.dispositions.filter((d) => d.status === "applied")).toHaveLength(7);
  });

  it("VALID enabled:true still reconstructs normally", () => {
    const out = reconstruct(happyPathComments(), makePolicy());
    expect(out.ok).toBe(true);
    expect(out.frozen).toBe(false);
    expect(out.lane?.state).toBe("ready-for-merge");
    expect(out.lane?.event_sequence).toBe(7);
  });

  it("source pin: the policy-invalid refusal precedes the edited-comment check inside the comment loop", () => {
    const src = readFileSync(".straylight/lib/reconstruct.mjs", "utf8");
    const loop = src.indexOf("for (const comment of ordered)");
    expect(loop).toBeGreaterThan(-1);
    const policyGuard = src.indexOf('refusal: "policy-invalid"', loop);
    const editedCheck = src.indexOf("if (isEdited(comment))", loop);
    expect(policyGuard).toBeGreaterThan(loop);
    expect(editedCheck).toBeGreaterThan(loop);
    expect(policyGuard).toBeLessThan(editedCheck);
  });
});

// =============================================================================
// G2 — one canonical executable policy gate; jq textual output is never
// policy authority.
// =============================================================================
describe("G2 — policy-gate.mjs is the single type-strict workflow policy authority", () => {
  const GATE = ".straylight/bin/policy-gate.mjs";
  const tmp = mkdtempSync(join(tmpdir(), "cp-policy-gate-"));
  let n = 0;

  function runGate(policy: any): { status: number; out: any } {
    const file = join(tmp, `policy-${n++}.json`);
    writeFileSync(file, typeof policy === "string" ? policy : JSON.stringify(policy));
    try {
      const stdout = execFileSync("node", [GATE, "--policy", file], { encoding: "utf8" });
      return { status: 0, out: JSON.parse(stdout) };
    } catch (e: any) {
      return { status: e.status ?? -1, out: e.stdout ? JSON.parse(e.stdout) : null };
    }
  }

  it("valid policy with boolean enabled true → exit 0 (actions permitted)", () => {
    const r = runGate(makePolicy());
    expect(r.status).toBe(0);
    expect(r.out).toEqual({ ok: true, enabled: true });
  });

  it("valid policy with boolean enabled false → exit 3 (valid kill switch, no action, not an error)", () => {
    const r = runGate(makePolicy({ enabled: false }));
    expect(r.status).toBe(3);
    expect(r.out.ok).toBe(true);
    expect(r.out.enabled).toBe(false);
    expect(r.out.refusal).toBe("automation-disabled");
  });

  it('string "true" → exit 2 (fail closed) even though `jq -r .enabled` would print `true`', () => {
    const r = runGate(makePolicy({ enabled: "true" }));
    expect(r.status).toBe(2);
    expect(r.out.ok).toBe(false);
    expect(r.out.refusal).toBe("policy-invalid");
    expect(r.out.detail).toMatch(/enabled/);
  });

  it('string "false" → exit 2 (fail closed: a malformed field is NOT a valid kill switch)', () => {
    const r = runGate(makePolicy({ enabled: "false" }));
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("policy-invalid");
  });

  it("missing / null / numeric / array / object enabled → exit 2, never 0, never 3", () => {
    for (const [label, bad] of MALFORMED_ENABLED) {
      const r = runGate(policyWithEnabled(bad));
      expect(r.status, `enabled as ${label}`).toBe(2);
      expect(r.out.refusal, `enabled as ${label}`).toBe("policy-invalid");
    }
  });

  it("a boolean enabled combined with any other invalid policy field → exit 2 (whole-policy validation)", () => {
    for (const enabled of [true, false]) {
      expect(runGate(makePolicy({ enabled, auto_merge: true })).status, `enabled: ${enabled}`).toBe(2);
      const noAllowlist = makePolicy({ enabled });
      delete (noAllowlist as any).actor_allowlist;
      expect(runGate(noAllowlist).status, `enabled: ${enabled}, no allowlist`).toBe(2);
    }
  });

  it("an unreadable or non-JSON policy file → exit 2 (policy-unreadable)", () => {
    const r = runGate("{ not json ]");
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("policy-unreadable");
    try {
      execFileSync("node", [GATE, "--policy", join(tmp, "does-not-exist.json")], { encoding: "utf8" });
      expect.unreachable("gate must exit non-zero on a missing policy file");
    } catch (e: any) {
      expect(e.status).toBe(2);
    }
  });

  it("with no --policy the gate resolves the COMMITTED policy and permits (it is enabled, shadow, report-only)", () => {
    const stdout = execFileSync("node", [GATE], { encoding: "utf8" });
    expect(JSON.parse(stdout)).toEqual({ ok: true, enabled: true });
  });

  it("the gate is dependency-free: only node: builtins and the canonical lib modules", () => {
    const src = readFileSync(GATE, "utf8");
    const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1] ?? "");
    expect(imports.length).toBeGreaterThan(0);
    expect(imports.every((s) =>
      s.startsWith("node:") || s === "../lib/validate.mjs" || s === "../lib/strict-json.mjs",
    )).toBe(true);
    expect(src).toMatch(/validatePolicy/);
    expect(src).toMatch(/policy\.enabled === true/);
    expect(src).toMatch(/policy\.enabled === false/);
  });

  it("REDUCER, WATCHDOG, BOOTSTRAP (and merge guard) all consult the gate; none uses jq -r '.enabled' as authority", () => {
    for (const f of [
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
      ".github/workflows/straylight-bootstrap.yml",
      ".github/workflows/straylight-merge-guard.yml",
    ]) {
      const wf = readFileSync(f, "utf8");
      expect(wf, f).toMatch(/node \.straylight\/bin\/policy-gate\.mjs/);
      expect(wf, f).not.toMatch(/jq -r '\.enabled'/);
      // Exit 3 (valid kill switch) and every other non-zero (malformed) are
      // handled as DISTINCT cases: 3 gates actions off; malformed fails the
      // job loudly. Neither can ever read as "enabled".
      expect(wf, f).toMatch(/GATE=\$\?/);
      expect(wf, f).toMatch(/-eq 3/);
      expect(wf, f).toMatch(/failing closed|refusing to bootstrap/);
    }
  });

  it("reducer and watchdog fail the job (exit 1) on a malformed policy instead of reading it as a kill switch", () => {
    for (const f of [
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
    ]) {
      const wf = readFileSync(f, "utf8");
      expect(wf, f).toMatch(/::error::automation policy failed validation[\s\S]{0,220}exit 1/);
      // enabled=false (the no-action path) is emitted ONLY from the exit-3 branch.
      const killswitchStep = wf.slice(wf.indexOf("Kill switch check"), wf.indexOf("enabled=false") + 40);
      expect(killswitchStep, f).toMatch(/-eq 3/);
    }
  });
});

// =============================================================================
// G3 — every workflow mutation point is guarded.
// =============================================================================
describe("G3 — mutation guards: ok:true AND frozen:false (type-strict) before any reducer mutation", () => {
  const reducer = readFileSync(".github/workflows/straylight-reducer.yml", "utf8");

  it("eligibility confirmation, label sync, and result publication each require .ok == true and .frozen == false", () => {
    const GUARD = /jq -e '\(\.ok == true\) and \(\.frozen == false\)' \/tmp\/reducer-result\.json/g;
    expect(reducer.match(GUARD) ?? []).toHaveLength(3);
    // Each mutation step carries its own guard (defense in depth): confirm,
    // label sync, result post.
    for (const step of [
      "Confirm eligibility with durable live PR metadata",
      "Sync derived labels",
      "Post reducer result",
    ]) {
      const start = reducer.indexOf(step);
      expect(start, step).toBeGreaterThan(-1);
      const nextStep = reducer.indexOf("- name:", start);
      const body = reducer.slice(start, nextStep === -1 ? undefined : nextStep);
      expect(body, step).toMatch(/\(\.ok == true\) and \(\.frozen == false\)/);
    }
    // The old loose textual check is gone.
    expect(reducer).not.toMatch(/OK=\$\(jq -r '\.ok'/);
  });

  it("watchdog scan ingests ONLY ok:true, frozen:false reconstructions (type-strict jq)", () => {
    const wf = readFileSync(".github/workflows/straylight-watchdog.yml", "utf8");
    expect(wf).toMatch(/jq -e '\(\.ok == true\) and \(\.frozen == false\)' \/tmp\/lane\.json/);
    // The old textual `jq -r '.ok'` comparison is gone from the sweep.
    expect(wf).not.toMatch(/jq -r '\.ok'/);
  });

  it("watchdog scanning and recovery posting are gated on the killswitch output (never run disabled/malformed)", () => {
    const wf = readFileSync(".github/workflows/straylight-watchdog.yml", "utf8");
    for (const step of ["Reconstruct all lanes and scan", "Post deduped recovery events"]) {
      const start = wf.indexOf(step);
      expect(start, step).toBeGreaterThan(-1);
      const body = wf.slice(start, start + 400);
      expect(body, step).toMatch(/if: steps\.killswitch\.outputs\.enabled == 'true'/);
    }
  });

  it("bootstrap label creation and lane-issue creation cannot run under a malformed OR disabled policy", () => {
    const wf = readFileSync(".github/workflows/straylight-bootstrap.yml", "utf8");
    // Workflow-boundary redesign: ALL bootstrap mutations (label
    // definition + lane issue) flow through the single shared-executor
    // invocation, so the gate preceding the plan→execute chain gates
    // every mutation. It exits 1 for BOTH the valid kill switch (3) and
    // any malformed policy (other non-zero).
    const gate = wf.indexOf("Kill switch check (canonical policy gate)");
    const plan = wf.indexOf("Plan bootstrap write (planner authority)");
    const execute = wf.indexOf("Execute write plan (single shared executor)");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(plan);
    expect(gate).toBeLessThan(execute);
    const gateBody = wf.slice(gate, wf.indexOf("- name:", gate + 10));
    expect(gateBody).toMatch(/-eq 3[\s\S]{0,200}exit 1/);
    expect(gateBody).toMatch(/-ne 0[\s\S]{0,300}exit 1/);
  });

  it("the merge-guard workflow (a comment-posting mutator) consults the same canonical gate before acting", () => {
    const wf = readFileSync(".github/workflows/straylight-merge-guard.yml", "utf8");
    const gate = wf.indexOf("node .straylight/bin/policy-gate.mjs");
    // Workflow-boundary redesign: the gate precedes the entire
    // gather → plan → execute chain (the only mutation path).
    const gatherStep = wf.indexOf("Gather evidence twice");
    const executeStep = wf.indexOf("Execute write plan (single shared executor)");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(gatherStep);
    expect(gatherStep).toBeLessThan(executeStep);
  });
});

// =============================================================================
// G4 — the type surface tells the truth about frozen.
// =============================================================================
describe("G4 — reconstruct.d.mts documents freeze (valid disabled) vs fail-closed (invalid) distinctly", () => {
  const dts = readFileSync(".straylight/lib/reconstruct.d.mts", "utf8");

  it("no longer claims an unusable policy is faithfully replayed", () => {
    expect(dts).not.toMatch(/policy is unusable/);
    expect(dts).not.toMatch(/kill switch is engaged \(policy\.enabled !== true\)/);
  });

  it("frozen:true is documented as EITHER a structurally valid engaged kill switch OR a fail-closed invalid policy", () => {
    expect(dts).toMatch(/STRUCTURALLY VALID policy with the boolean kill switch engaged/);
    expect(dts).toMatch(/freeze, not rewind/);
    expect(dts).toMatch(/INVALID policy/);
    expect(dts).toMatch(/FAIL CLOSED/);
    expect(dts).toMatch(/genesis state and event sequence/);
    expect(dts).toMatch(/no workflow mutation/);
  });
});
