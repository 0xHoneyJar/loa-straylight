// GOLDEN HISTORY PROOF — every real cp-lane replays IDENTICALLY after the
// policy-v2 admission-epoch migration.
//
// The defect this proves closed: under policy v1 a single live policy object
// adjudicated every historical event, so editing lease_duration_minutes,
// maximum_patch_cycles, authorized_corridor, or actor_allowlist silently
// re-adjudicated the past. A measured census over these three lanes found that
// BOTH directions rewrite history — 240 → 2880 minutes flipped lane #122 from
// ready-for-claude@121 to codex-working@109 with 15 refusals; 3 → 2 patch
// cycles retro-escalated it to operator-required@17.
//
// The fixtures under fixtures/lane-history/ are DURABLE EVIDENCE, captured from
// the GitHub API by scripts/capture-cp-lane-history.mjs, which refuses to write
// a fixture unless the payload-level capture replays identically to the raw API
// bodies. The `.baseline.json` files record the disposition of every historical
// protocol event under the PRE-MIGRATION code and policy (v1, 240-minute
// leases). They are the answer the new architecture must reproduce.
//
// REGENERATING A BASELINE TO MAKE THIS SUITE PASS DESTROYS THE PROOF. If a
// baseline no longer matches, the migration changed history — that is the bug.
//
// The lane input is rebuilt by the SAME exported function the capture tool
// proved faithful (fixtureToInput), so the fixture the test replays and the
// fixture whose fidelity was proven are not two things that can drift apart.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { scan } from "../../.straylight/lib/watchdog.mjs";
import { validatePolicy } from "../../.straylight/lib/validate.mjs";
// @ts-expect-error — .mjs tool module without a declaration file
import { fixtureToInput } from "../../scripts/capture-cp-lane-history.mjs";

const DIR = join("tests", "control-plane", "fixtures", "lane-history");
const POLICY = JSON.parse(readFileSync(join(".straylight", "automation-policy.json"), "utf8"));

// Every lane the control plane has ever run, and the pre-migration answer.
// Expected values are transcribed here as well as loaded from the baselines so
// a corrupted/regenerated baseline cannot quietly redefine "unchanged".
const LANES = [
  { issue: 118, state: "ready-for-merge", seq: 12, applied: 12, refused: 2 },
  { issue: 120, state: "merged", seq: 11, applied: 11, refused: 3 },
  { issue: 122, state: "ready-for-claude", seq: 121, applied: 121, refused: 3 },
] as const;

type Disposition = { comment_id: number; status: string; refusal?: string; detail?: string };

function load(issue: number) {
  const fixture = JSON.parse(readFileSync(join(DIR, `lane-${issue}.json`), "utf8"));
  const baseline = JSON.parse(readFileSync(join(DIR, `lane-${issue}.baseline.json`), "utf8"));
  const result = reconstructLane({
    ...fixtureToInput(fixture),
    policy: POLICY,
    context: { now: baseline.replay_now },
  });
  // A real lane must reconstruct to a record. A null lane means the genesis or
  // the fixture is unreadable — a failure of the proof apparatus itself, not a
  // per-test assertion, so it aborts loudly here.
  if (result.lane === null) throw new Error(`lane ${issue}: reconstruction produced no lane record`);
  return { fixture, baseline, result, lane: result.lane };
}

describe("golden lane history — the baselines were captured under policy v1", () => {
  it("every baseline records the pre-migration v1 schema and the 240-minute lease bound", () => {
    for (const { issue } of LANES) {
      const baseline = JSON.parse(readFileSync(join(DIR, `lane-${issue}.baseline.json`), "utf8"));
      expect(baseline.policy_schema, `lane ${issue}`).toBe("straylight.automation-policy.v1");
      expect(baseline.lease_duration_minutes, `lane ${issue}`).toBe(240);
    }
  });

  it("the committed policy under test is v2 with exactly one admission epoch at 240 minutes", () => {
    expect(validatePolicy(POLICY).ok).toBe(true);
    expect(POLICY.schema).toBe("straylight.automation-policy.v2");
    expect(POLICY.admission_history).toHaveLength(1);
    expect(POLICY.admission_history[0].lease_duration_minutes).toBe(240);
    expect(POLICY.admission_history[0].maximum_patch_cycles).toBe(3);
  });
});

describe.each(LANES)("lane #$issue replays identically under admission epochs", (spec) => {
  const { baseline, result, lane } = load(spec.issue);
  const dispositions: Disposition[] = result.dispositions;
  const baseDispositions: Disposition[] = baseline.dispositions;

  it("reconstruction still succeeds", () => {
    expect(result.ok).toBe(true);
    expect(result.ok).toBe(baseline.ok);
    expect(result.frozen).toBe(baseline.frozen);
  });

  it("reaches the transcribed pre-migration projection", () => {
    expect(lane.state).toBe(spec.state);
    expect(lane.event_sequence).toBe(spec.seq);
    expect(dispositions.filter((d) => d.status === "applied")).toHaveLength(spec.applied);
    expect(dispositions.filter((d) => d.status === "refused")).toHaveLength(spec.refused);
  });

  it("produces an IDENTICAL final lane record (every field, not just state)", () => {
    expect(result.lane).toEqual(baseline.lane);
  });

  it("produces an identical event_sequence and derived label set", () => {
    expect(lane.event_sequence).toBe(baseline.lane.event_sequence);
    expect(result.labels).toEqual(baseline.labels);
  });

  it("adjudicates EVERY protocol event with the same status, in the same order", () => {
    expect(dispositions.map((d) => d.comment_id)).toEqual(baseDispositions.map((d) => d.comment_id));
    expect(dispositions.map((d) => `${d.comment_id}:${d.status}`))
      .toEqual(baseDispositions.map((d) => `${d.comment_id}:${d.status}`));
  });

  it("refuses every previously-refused event with the SAME refusal code and detail", () => {
    const after = dispositions.filter((d) => d.status === "refused")
      .map((d) => `${d.comment_id}:${d.refusal}:${d.detail}`);
    const before = baseDispositions.filter((d) => d.status === "refused")
      .map((d) => `${d.comment_id}:${d.refusal}:${d.detail}`);
    expect(after).toEqual(before);
  });

  it("applies every previously-applied event (no silently-lost admission)", () => {
    const after = dispositions.filter((d) => d.status === "applied").map((d) => d.comment_id);
    const before = baseDispositions.filter((d) => d.status === "applied").map((d) => d.comment_id);
    expect(after).toEqual(before);
  });

  it("generates no new watchdog action because of the migration", () => {
    // The watchdog reads only LIVE fields (enabled, stuck_lane_threshold_hours),
    // never the epoched admission fields — so its verdict over the reconstructed
    // lane must be the same before and after. Asserted mechanically rather than
    // argued: scan() is run over both lane records at the same instant.
    const ctx = { now: baseline.replay_now };
    const after = scan([{ ...result.lane, issue_number: spec.issue }], POLICY, ctx);
    const before = scan([{ ...baseline.lane, issue_number: spec.issue }], POLICY, ctx);
    expect(after).toEqual(before);
  });
});

// These specific ids are the ones the PR #139 audit turned on: they are cited
// as PROOF OF THE GENERIC INVARIANT above, never as licence to special-case
// them. Nothing in the reducer, validator, or policy mentions any comment id.
describe("lane #122 — the exact events the mutable-policy defect would have flipped", () => {
  const { result, lane } = load(122);
  const byId = new Map<number, Disposition>(
    (result.dispositions as Disposition[]).map((d) => [d.comment_id, d]),
  );

  it("comment 5257177236 stays REFUSED lease-expiry-unbounded under the 240-minute epoch", () => {
    const d = byId.get(5257177236);
    expect(d?.status).toBe("refused");
    expect(d?.refusal).toBe("lease-expiry-unbounded");
    // The refusal names 240m — the value of the epoch governing an August 2026
    // event — and would read 2880m if the bound had been taken from live policy
    // after a later epoch lengthened leases.
    expect(d?.detail).toContain("240m");
  });

  it("comment 5257220713 remains the applied, corrected sequence-109 auditor lease", () => {
    const d = byId.get(5257220713);
    expect(d?.status).toBe("applied");
    expect(lane.event_sequence).toBeGreaterThan(109);
  });

  it("comment 5274503689 remains the applied sequence-120 system.lease_expired", () => {
    expect(byId.get(5274503689)?.status).toBe("applied");
  });

  it("comment 5276134089 remains the applied sequence-121 system.requeued, and the lane ends ready-for-claude with no lease", () => {
    expect(byId.get(5276134089)?.status).toBe("applied");
    expect(lane.state).toBe("ready-for-claude");
    expect(lane.next_actor).toBe("implementer");
    expect(lane.lease).toBeNull();
  });
});
