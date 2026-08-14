// Policy v2 — admission epochs: history is immutable, current policy is not.
//
// Four policy fields decide whether an event was ADMISSIBLE: authorized_corridor,
// actor_allowlist, maximum_patch_cycles, lease_duration_minutes. Under v1 they
// lived in one live object that adjudicated the entire replayed history, so
// editing any of them re-adjudicated the past. v2 moves them into an
// append-oriented `admission_history`; every event is judged under the epoch in
// force at the AUTHENTICATED GitHub time of the comment that recorded it.
//
// This suite proves the property that makes the ledger worth having: appending
// or mutating a LATER epoch cannot change the disposition of an event governed
// by an EARLIER one — in either direction, for all four fields — while new
// events do receive the later policy.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import {
  validatePolicy,
  admissionPolicyFor,
  ADMISSION_FIELDS,
  parseIsoInstant,
} from "../../.straylight/lib/validate.mjs";
import { MARKERS, renderPayload } from "../../.straylight/lib/markers.mjs";
// @ts-expect-error — .mjs tool module without a declaration file
import { fixtureToInput } from "../../scripts/capture-cp-lane-history.mjs";
import {
  makePolicy, makeEpoch, makeEpochPolicy, makeLane, makeEvent, makeLease, makeTaskPacket,
  laneClaudeWorking, payloadDigest, EPOCH_FROM, EPOCH_ID, NOW, HEAD_SHA, WORKING_BRANCH,
} from "./_fixtures.js";

const COMMITTED = JSON.parse(readFileSync(join(".straylight", "automation-policy.json"), "utf8"));
const HISTORY_DIR = join("tests", "control-plane", "fixtures", "lane-history");
const REAL_LANES = [118, 120, 122] as const;

const at = (iso: string) => parseIsoInstant(iso) as number;
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const fixtureOf = (issue: number) => readJson(join(HISTORY_DIR, `lane-${issue}.json`));
const baselineOf = (issue: number) => readJson(join(HISTORY_DIR, `lane-${issue}.baseline.json`));

// ---------------------------------------------------------------------------
// The shipped policy
// ---------------------------------------------------------------------------

describe("committed policy v2", () => {
  it("declares schema v2 with exactly ONE admission epoch", () => {
    expect(validatePolicy(COMMITTED).ok).toBe(true);
    expect(COMMITTED.schema).toBe("straylight.automation-policy.v2");
    expect(Array.isArray(COMMITTED.admission_history)).toBe(true);
    expect(COMMITTED.admission_history).toHaveLength(1);
  });

  it("that epoch is TODAY'S admission policy, transcribed with no change in value", () => {
    const epoch = COMMITTED.admission_history[0];
    expect(epoch.authorized_corridor).toEqual(["phase-49p", "phase-49q", "phase-50a", "phase-50b"]);
    expect(epoch.maximum_patch_cycles).toBe(3);
    expect(epoch.lease_duration_minutes).toBe(240);
    expect(epoch.actor_allowlist.system).toContain("github-actions[bot]");
    for (const role of ["coordinator", "implementer", "auditor", "operator"]) {
      expect(epoch.actor_allowlist[role], role).toEqual(["eileen1337"]);
    }
  });

  it("does NOT ship a 48-hour lease: 2880 appears in no admission field", () => {
    // The 2880-minute epoch is separately authorized and deliberately NOT part
    // of this change; this pin makes an accidental early cutover impossible.
    for (const epoch of COMMITTED.admission_history) {
      expect(epoch.lease_duration_minutes).not.toBe(2880);
    }
    expect(COMMITTED.lease_duration_minutes).toBe(240);
  });

  it("keeps the four top-level fields as a projection that deep-equals the final epoch", () => {
    const final = COMMITTED.admission_history[COMMITTED.admission_history.length - 1];
    for (const field of ADMISSION_FIELDS) {
      expect(COMMITTED[field], field).toEqual(final[field]);
    }
  });

  it("epoch 1 begins before every event in the repository's lane history", () => {
    const from = at(COMMITTED.admission_history[0].effective_from);
    for (const issue of REAL_LANES) {
      for (const c of fixtureOf(issue).comments) {
        expect(at(c.created_at), `lane ${issue} comment ${c.id}`).toBeGreaterThan(from);
      }
    }
  });

  it("leaves the LIVE operational fields un-epoched", () => {
    // enabled and stuck_lane_threshold_hours describe what the plane may do
    // NOW. Epoching them would mean a kill switch that stops applying to old
    // events — a freeze that rewrites history.
    const epochKeys = Object.keys(COMMITTED.admission_history[0]);
    expect(epochKeys).not.toContain("enabled");
    expect(epochKeys).not.toContain("stuck_lane_threshold_hours");
    expect(typeof COMMITTED.enabled).toBe("boolean");
    expect(COMMITTED.stuck_lane_threshold_hours).toBe(72);
  });
});

// ---------------------------------------------------------------------------
// Cross-version fail-closed
// ---------------------------------------------------------------------------

describe("version crossing fails closed in BOTH directions", () => {
  it("the v2 validator refuses a v1-shaped policy (old policy + new code)", () => {
    const v1 = {
      schema: "straylight.automation-policy.v1",
      mode: "shadow", enabled: true, auto_merge: false,
      authorized_corridor: ["phase-49p"],
      automatic_estate_semantic_decisions: false,
      automatic_cross_repo_contract_changes: false,
      automatic_sibling_repo_edits: false,
      automatic_external_infrastructure: false,
      automatic_secret_use: false,
      automatic_progression_beyond_mvp2: false,
      maximum_patch_cycles: 3,
      lease_duration_minutes: 240,
      stuck_lane_threshold_hours: 72,
      actor_allowlist: makeEpoch().actor_allowlist,
    };
    const r = validatePolicy(v1);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.join("; ")).toContain("schema");
      expect(r.errors.join("; ")).toContain("admission_history");
    }
  });

  it("the v1 validator would refuse the v2 policy (new policy + old code)", () => {
    // v1 gated `schema` on this exact list. The bump — not a convention — is
    // what stops v1 code from accepting a v2 policy and then silently ignoring
    // admission_history while adjudicating from the mutable top-level fields.
    const V1_ACCEPTED_SCHEMAS = ["straylight.automation-policy.v1"];
    expect(V1_ACCEPTED_SCHEMAS).not.toContain(COMMITTED.schema);
  });

  it("refuses any unrecognized schema identifier rather than guessing a version", () => {
    for (const schema of [
      "straylight.automation-policy.v3", "straylight.automation-policy", "", null, 2,
    ]) {
      expect(validatePolicy({ ...COMMITTED, schema }).ok, String(schema)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Validator: mechanical rejection of every malformed ledger
// ---------------------------------------------------------------------------

describe("validatePolicy mechanically rejects a malformed admission ledger", () => {
  const cases: Array<[string, Record<string, any>, string]> = [
    ["missing admission_history", { admission_history: undefined }, "admission_history: missing"],
    ["null admission_history", { admission_history: null }, "admission_history: missing"],
    ["empty admission_history", { admission_history: [] }, "admission_history: empty"],
    ["non-array admission_history", { admission_history: {} }, "admission_history: not an array"],
    ["non-object epoch entry", { admission_history: ["epoch-001"] }, "admission_history[0]: not an object"],
    ["duplicate epoch ids", {
      admission_history: [
        makeEpoch({ epoch_id: "epoch-dup", effective_from: "2026-01-01T00:00:00Z" }),
        makeEpoch({ epoch_id: "epoch-dup", effective_from: "2026-02-01T00:00:00Z" }),
      ],
    }, "duplicate epoch_id"],
    ["malformed epoch id", { admission_history: [makeEpoch({ epoch_id: "001" })] }, "epoch_id: malformed"],
    ["missing epoch boundary", { admission_history: [makeEpoch({ effective_from: undefined })] }, "effective_from: missing"],
    ["malformed epoch boundary", { admission_history: [makeEpoch({ effective_from: "2026-02-30T00:00:00Z" })] }, "effective_from: not a valid UTC calendar instant"],
    ["non-UTC epoch boundary", { admission_history: [makeEpoch({ effective_from: "2026-01-01T00:00:00+01:00" })] }, "effective_from: not a valid UTC calendar instant"],
    ["unordered epoch history", {
      admission_history: [
        makeEpoch({ epoch_id: "epoch-late", effective_from: "2026-06-01T00:00:00Z" }),
        makeEpoch({ epoch_id: "epoch-early", effective_from: "2026-01-01T00:00:00Z" }),
      ],
    }, "does not strictly follow"],
    ["overlapping (identical) epoch boundaries", {
      admission_history: [
        makeEpoch({ epoch_id: "epoch-a", effective_from: "2026-01-01T00:00:00Z" }),
        makeEpoch({ epoch_id: "epoch-b", effective_from: "2026-01-01T00:00:00Z" }),
      ],
    }, "does not strictly follow"],
    ["missing authorization provenance", { admission_history: [makeEpoch({ authorized_by: undefined })] }, "authorized_by: missing"],
    ["non-operator authority", { admission_history: [makeEpoch({ authorized_by: "implementer:claude" })] }, "authorized_by: malformed"],
    ["bot as epoch authority", { admission_history: [makeEpoch({ authorized_by: "operator:github-actions[bot]" })] }, "authorized_by: malformed"],
    ["missing authorization_ref", { admission_history: [makeEpoch({ authorization_ref: undefined })] }, "authorization_ref: missing"],
    ["blank authorization_ref", { admission_history: [makeEpoch({ authorization_ref: "   " })] }, "authorization_ref: shorter than"],
    ["unknown epoch field", { admission_history: [makeEpoch({ enabled: false })] }, "admission_history[0].enabled: unknown epoch field"],
    ["empty epoch corridor", { admission_history: [makeEpoch({ authorized_corridor: [] })] }, "authorized_corridor: fewer than 1 items"],
    ["malformed epoch corridor entry", { admission_history: [makeEpoch({ authorized_corridor: ["Phase-50A"] })] }, "authorized_corridor[0]: malformed"],
    ["non-array epoch corridor", { admission_history: [makeEpoch({ authorized_corridor: "phase-50a" })] }, "authorized_corridor: not an array"],
    ["missing epoch allowlist", { admission_history: [makeEpoch({ actor_allowlist: undefined })] }, "actor_allowlist: missing"],
    ["epoch allowlist missing a role", {
      admission_history: [makeEpoch({
        actor_allowlist: { coordinator: ["a"], implementer: ["a"], auditor: ["a"], operator: ["a"] },
      })],
    }, "system: missing"],
    ["epoch allowlist with an empty role", {
      admission_history: [makeEpoch({
        actor_allowlist: { ...makeEpoch().actor_allowlist, auditor: [] },
      })],
    }, "auditor: fewer than 1 items"],
    ["epoch allowlist with an unknown role", {
      admission_history: [makeEpoch({
        actor_allowlist: { ...makeEpoch().actor_allowlist, superuser: ["a"] },
      })],
    }, "actor_allowlist.superuser: unknown actor role"],
    ["bot in the epoch's operator role", {
      admission_history: [makeEpoch({
        actor_allowlist: { ...makeEpoch().actor_allowlist, operator: ["github-actions[bot]"] },
      })],
    }, "bot identities are forbidden in the operator role"],
    ["zero maximum_patch_cycles", { admission_history: [makeEpoch({ maximum_patch_cycles: 0 })] }, "maximum_patch_cycles: not an integer >= 1"],
    ["fractional maximum_patch_cycles", { admission_history: [makeEpoch({ maximum_patch_cycles: 2.5 })] }, "maximum_patch_cycles: not an integer >= 1"],
    ["string maximum_patch_cycles", { admission_history: [makeEpoch({ maximum_patch_cycles: "3" })] }, "maximum_patch_cycles: not an integer >= 1"],
    ["missing maximum_patch_cycles", { admission_history: [makeEpoch({ maximum_patch_cycles: undefined })] }, "maximum_patch_cycles: missing"],
    ["zero lease_duration_minutes", { admission_history: [makeEpoch({ lease_duration_minutes: 0 })] }, "lease_duration_minutes: not an integer >= 1"],
    ["negative lease_duration_minutes", { admission_history: [makeEpoch({ lease_duration_minutes: -240 })] }, "lease_duration_minutes: not an integer >= 1"],
    ["string lease_duration_minutes", { admission_history: [makeEpoch({ lease_duration_minutes: "240" })] }, "lease_duration_minutes: not an integer >= 1"],
    ["missing lease_duration_minutes", { admission_history: [makeEpoch({ lease_duration_minutes: undefined })] }, "lease_duration_minutes: missing"],
  ];

  it.each(cases)("rejects %s", (_label, overrides, expectedError) => {
    // Built from the base fixture policy so ONLY the named defect differs.
    const policy: Record<string, any> = { ...makePolicy(), ...overrides };
    const r = validatePolicy(policy);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" | ")).toContain(expectedError);
  });

  it("rejects a top-level projection that disagrees with the final epoch — for EVERY field", () => {
    const divergent: Record<string, unknown> = {
      actor_allowlist: { ...makeEpoch().actor_allowlist, auditor: ["someone-else"] },
      authorized_corridor: ["phase-49p"],
      lease_duration_minutes: 2880,
      maximum_patch_cycles: 9,
    };
    for (const field of ADMISSION_FIELDS) {
      // makePolicy() propagates an admission override into BOTH the epoch and
      // the projection, so the divergence is applied after it is built.
      const policy: Record<string, any> = { ...makePolicy(), [field]: divergent[field] };
      const r = validatePolicy(policy);
      expect(r.ok, field).toBe(false);
      if (!r.ok) {
        expect(r.errors.join(" | "), field).toContain("does not equal the final admission epoch");
      }
    }
  });

  it("rejects a PARTIAL top-level projection (all four or none)", () => {
    const policy: Record<string, any> = makePolicy();
    delete policy.lease_duration_minutes;
    const r = validatePolicy(policy);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(" | ")).toContain("projection is partial");
  });

  it("accepts a ledger-only policy: the projection is optional, the ledger is not", () => {
    expect(validatePolicy(makeEpochPolicy([makeEpoch()])).ok).toBe(true);
  });

  it("compares the projection against the FINAL epoch, not the first", () => {
    const early = makeEpoch({ epoch_id: "epoch-first", effective_from: "2026-01-01T00:00:00Z", lease_duration_minutes: 240 });
    const late = makeEpoch({ epoch_id: "epoch-second", effective_from: "2026-06-01T00:00:00Z", lease_duration_minutes: 600 });
    const twoEpochs = { admission_history: [early, late] };
    expect(validatePolicy({ ...makePolicy(), ...twoEpochs, lease_duration_minutes: 600 }).ok).toBe(true);
    expect(validatePolicy({ ...makePolicy(), ...twoEpochs, lease_duration_minutes: 240 }).ok).toBe(false);
  });

  it("still enforces the hard v1 protocol invariants alongside the ledger", () => {
    expect(validatePolicy(makePolicy({ mode: "active" })).ok).toBe(false);
    expect(validatePolicy(makePolicy({ auto_merge: true })).ok).toBe(false);
    expect(validatePolicy(makePolicy({ automatic_secret_use: true })).ok).toBe(false);
    expect(validatePolicy(makePolicy({ automatic_progression_beyond_mvp2: true })).ok).toBe(false);
    // The kill switch is a legal value, not a validity error.
    expect(validatePolicy(makePolicy({ enabled: false })).ok).toBe(true);
    expect(validatePolicy(makePolicy({ enabled: "false" })).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The selector
// ---------------------------------------------------------------------------

describe("admissionPolicyFor — one epoch, no fallback, no clock", () => {
  const e1 = makeEpoch({ epoch_id: "epoch-one", effective_from: "2026-01-01T00:00:00Z", lease_duration_minutes: 240 });
  const e2 = makeEpoch({ epoch_id: "epoch-two", effective_from: "2026-06-01T00:00:00Z", lease_duration_minutes: 600 });
  const e3 = makeEpoch({ epoch_id: "epoch-three", effective_from: "2026-09-01T00:00:00Z", lease_duration_minutes: 90 });
  const policy = makeEpochPolicy([e1, e2, e3]);

  it("resolves the epoch in force and reports its id for provenance", () => {
    const r = admissionPolicyFor(policy, at("2026-03-15T00:00:00Z"));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.epoch_id).toBe("epoch-one");
      expect(r.effective_from).toBe("2026-01-01T00:00:00Z");
      expect(r.admission.lease_duration_minutes).toBe(240);
    }
  });

  it("treats each boundary as half-open [effective_from, next)", () => {
    const pick = (iso: string) => {
      const r = admissionPolicyFor(policy, at(iso));
      return r.ok ? r.epoch_id : `REFUSED:${r.reason}`;
    };
    expect(pick("2026-05-31T23:59:59.999Z")).toBe("epoch-one");
    expect(pick("2026-06-01T00:00:00Z")).toBe("epoch-two"); // inclusive lower bound
    expect(pick("2026-08-31T23:59:59.999Z")).toBe("epoch-two");
    expect(pick("2026-09-01T00:00:00Z")).toBe("epoch-three");
    expect(pick("2099-01-01T00:00:00Z")).toBe("epoch-three"); // final epoch has no end
  });

  it("returns exactly the four admission fields and nothing else", () => {
    const r = admissionPolicyFor(policy, at("2026-03-15T00:00:00Z"));
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.keys(r.admission).sort()).toEqual([...ADMISSION_FIELDS].sort());
  });

  it("fails closed before the earliest epoch — it does NOT extrapolate backwards", () => {
    const r = admissionPolicyFor(policy, at("2025-12-31T23:59:59Z"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("no admission epoch is in force");
  });

  it("fails closed on a missing/empty ledger instead of falling back to top-level policy", () => {
    // The top-level projection here is complete and valid, and still yields
    // nothing: the refusal is a refusal, not a silent read-through.
    const withProjection: Record<string, any> = makePolicy();
    expect(withProjection.lease_duration_minutes).toBe(240);
    for (const bad of [undefined, null, [], {}, "epoch"]) {
      const r = admissionPolicyFor({ ...withProjection, admission_history: bad }, at(NOW));
      expect(r.ok, String(bad)).toBe(false);
      if (!r.ok) expect(r.reason, String(bad)).toContain("admission_history");
    }
  });

  it("fails closed on an unresolvable boundary anywhere in the ledger", () => {
    const broken = makeEpochPolicy([e1, { ...e2, effective_from: "not-a-time" }]);
    const r = admissionPolicyFor(broken, at("2026-03-15T00:00:00Z"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("unresolvable effective_from");
  });

  it("fails closed on a structurally invalid selected epoch", () => {
    const r = admissionPolicyFor(makeEpochPolicy([makeEpoch({ lease_duration_minutes: 0 })]), at(NOW));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("structurally invalid");
  });

  it("refuses a non-instant selection time — it never substitutes a clock", () => {
    for (const bad of [undefined, null, NOW, "2026-01-01T00:00:00Z", NaN, 1.5]) {
      const r = admissionPolicyFor(policy, bad as unknown as number);
      expect(r.ok, String(bad)).toBe(false);
    }
  });

  it("is a pure function of (policy, instant): same inputs, same epoch, always", () => {
    const a = admissionPolicyFor(policy, at("2026-07-04T12:00:00Z"));
    const b = admissionPolicyFor(policy, at("2026-07-04T12:00:00Z"));
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// GENERIC ANTI-REGRESSION: a later epoch cannot reach backwards
// ---------------------------------------------------------------------------

// Later-epoch variants spanning BOTH directions for all four fields. Several of
// these measurably rewrote history under v1's single live policy.
const LATER_EPOCH_VARIANTS: Array<[string, Record<string, any>]> = [
  ["identical to epoch 1 (pure append)", {}],
  ["lease duration LONGER (240 -> 2880)", { lease_duration_minutes: 2880 }],
  ["lease duration SHORTER (240 -> 60)", { lease_duration_minutes: 60 }],
  ["lease duration minimal (240 -> 1)", { lease_duration_minutes: 1 }],
  ["patch ceiling LOWER (3 -> 1)", { maximum_patch_cycles: 1 }],
  ["patch ceiling HIGHER (3 -> 9)", { maximum_patch_cycles: 9 }],
  ["corridor REMOVAL (only phase-50b remains)", { authorized_corridor: ["phase-50b"] }],
  ["corridor REMOVAL of phase-50a", { authorized_corridor: ["phase-49p", "phase-49q", "phase-50b"] }],
  ["corridor WIDENING (unrelated phase added)", {
    authorized_corridor: ["phase-49p", "phase-49q", "phase-50a", "phase-50b", "phase-51z"],
  }],
  ["allowlist identity REMOVAL (auditor rotated away)", {
    actor_allowlist: { ...COMMITTED.actor_allowlist, auditor: ["some-other-login"] },
  }],
  ["allowlist identity REMOVAL (system loses the CI bot)", {
    actor_allowlist: { ...COMMITTED.actor_allowlist, system: ["eileen1337"] },
  }],
  ["allowlist WIDENING (future bot identity added)", {
    actor_allowlist: { ...COMMITTED.actor_allowlist, auditor: ["eileen1337", "codex-bot-future"] },
  }],
];

describe("appending a later epoch cannot re-adjudicate governed history", () => {
  // Well after the newest event in any real lane, so every recorded event
  // resolves to epoch 1 and the later epoch governs only the future.
  const LATER_FROM = "2026-12-01T00:00:00Z";

  const golden = REAL_LANES.map((issue) => ({
    issue,
    input: fixtureToInput(fixtureOf(issue)),
    baseline: baselineOf(issue),
  }));

  type Golden = (typeof golden)[number];

  function replay(policy: unknown, lane: Golden) {
    const r = reconstructLane({ ...lane.input, policy, context: { now: lane.baseline.replay_now } });
    return {
      ok: r.ok,
      frozen: r.frozen,
      labels: r.labels,
      lane: r.lane,
      vector: r.dispositions.map((d) => `${d.comment_id}:${d.status}:${d.refusal ?? "-"}`),
    };
  }

  const baseVector = (lane: Golden): string[] =>
    lane.baseline.dispositions.map((d: any) => `${d.comment_id}:${d.status}:${d.refusal ?? "-"}`);

  // A two-epoch policy whose top-level projection follows the FINAL epoch, so
  // a hypothetical cutover is a legal, reviewable change rather than a shape
  // the validator would have rejected anyway.
  function cutoverPolicy(later: Record<string, any>) {
    return {
      ...COMMITTED,
      admission_history: [COMMITTED.admission_history[0], later],
      authorized_corridor: later.authorized_corridor,
      maximum_patch_cycles: later.maximum_patch_cycles,
      lease_duration_minutes: later.lease_duration_minutes,
      actor_allowlist: later.actor_allowlist,
    };
  }

  it("the historic vector is what we claim it is (guards the guard)", () => {
    for (const lane of golden) {
      expect(replay(COMMITTED, lane).lane, `lane ${lane.issue}`).toEqual(lane.baseline.lane);
    }
  });

  it.each(LATER_EPOCH_VARIANTS)("later epoch %s leaves every real lane byte-identical", (_label, overrides) => {
    const later = makeEpoch({
      epoch_id: "epoch-002-hypothetical",
      effective_from: LATER_FROM,
      authorized_by: "operator:eileen",
      authorization_ref: "hypothetical later epoch, exercised only by this regression",
      authorized_corridor: COMMITTED.authorized_corridor,
      maximum_patch_cycles: COMMITTED.maximum_patch_cycles,
      lease_duration_minutes: COMMITTED.lease_duration_minutes,
      actor_allowlist: COMMITTED.actor_allowlist,
      ...overrides,
    });
    const policy = cutoverPolicy(later);
    expect(validatePolicy(policy).ok).toBe(true);

    for (const lane of golden) {
      const after = replay(policy, lane);
      expect(after.lane, `lane ${lane.issue} final record`).toEqual(lane.baseline.lane);
      expect(after.labels, `lane ${lane.issue} labels`).toEqual(lane.baseline.labels);
      expect(after.ok, `lane ${lane.issue} ok`).toBe(lane.baseline.ok);
      expect(after.frozen, `lane ${lane.issue} frozen`).toBe(lane.baseline.frozen);
      expect(after.vector, `lane ${lane.issue} dispositions`).toEqual(baseVector(lane));
    }
  });

  it("MUTATING an already-appended later epoch is equally powerless over the past", () => {
    // Not merely "appending is safe": the whole later entry is rewritten
    // between runs, and the governed history does not move.
    const base = makeEpoch({
      epoch_id: "epoch-002-hypothetical", effective_from: LATER_FROM,
      authorization_ref: "hypothetical later epoch under mutation",
    });
    const mutations: Array<Record<string, any>> = [
      { lease_duration_minutes: 2880, maximum_patch_cycles: 1, authorized_corridor: ["phase-50b"] },
      { lease_duration_minutes: 1, maximum_patch_cycles: 99, authorized_corridor: ["phase-49p"] },
      {
        actor_allowlist: {
          coordinator: ["x-login"], implementer: ["y-login"], auditor: ["z-login"],
          operator: ["w-login"], system: ["v-login"],
        },
      },
    ];
    for (const m of mutations) {
      const policy = cutoverPolicy({ ...base, ...m });
      expect(validatePolicy(policy).ok, JSON.stringify(m)).toBe(true);
      for (const lane of golden) {
        const after = replay(policy, lane);
        expect(after.lane, `lane ${lane.issue} / ${JSON.stringify(m)}`).toEqual(lane.baseline.lane);
        expect(after.vector, `lane ${lane.issue} / ${JSON.stringify(m)}`).toEqual(baseVector(lane));
      }
    }
  });
});

// ---------------------------------------------------------------------------
// ADVERSARIAL: the specific event a permissive later epoch would un-refuse
// ---------------------------------------------------------------------------

describe("adversarial history boundary — a permissive later epoch cannot un-refuse a governed event", () => {
  // Lane #122 sequence 109 (comment 5257177236): an auditor lease observed at
  // 2026-08-11T18:24:10Z claiming expiry 22:40:00Z — 255m50s, past the
  // 240-minute bound, refused as lease-expiry-unbounded. Under a 2880-minute
  // policy that very same event is ADMISSIBLE, which is precisely how a
  // lease-duration change would have rewritten this lane. The event is read
  // from the durable fixture, not transcribed, so the proof binds to the real
  // recorded shape.
  const fixture = fixtureOf(122);
  const baseline = baselineOf(122);
  const REFUSED_ID = 5257177236;
  const source = fixture.comments.find((c: any) => c.id === REFUSED_ID);
  const governedEvent = source.payloads.event;

  const permissiveLater = makeEpoch({
    epoch_id: "epoch-002-forty-eight-hour",
    effective_from: "2026-08-20T00:00:00Z", // AFTER the governed event
    authorization_ref: "hypothetical 48h cutover — separately authorized, not shipped here",
    authorized_corridor: COMMITTED.authorized_corridor,
    maximum_patch_cycles: COMMITTED.maximum_patch_cycles,
    lease_duration_minutes: 2880,
    actor_allowlist: COMMITTED.actor_allowlist,
  });
  const twoEpochPolicy = {
    ...COMMITTED,
    admission_history: [COMMITTED.admission_history[0], permissiveLater],
    lease_duration_minutes: 2880,
  };

  it("the fixture event really is the over-bound lease it is claimed to be", () => {
    const minutes = (at(governedEvent.lease_expires_at) - at(source.created_at)) / 60000;
    expect(governedEvent.sequence).toBe(109);
    expect(governedEvent.event_type).toBe("auditor.lease_acquired");
    expect(minutes).toBeGreaterThan(240);
    expect(minutes).toBeLessThan(2880);
  });

  it("the two-epoch policy is valid and its CURRENT admission really is 2880", () => {
    expect(validatePolicy(twoEpochPolicy).ok).toBe(true);
    const now = admissionPolicyFor(twoEpochPolicy, at("2026-09-15T00:00:00Z"));
    expect(now.ok).toBe(true);
    if (now.ok) {
      expect(now.epoch_id).toBe("epoch-002-forty-eight-hour");
      expect(now.admission.lease_duration_minutes).toBe(2880);
    }
  });

  it("the governed event still resolves to epoch 1 and stays REFUSED at 240m", () => {
    const sel = admissionPolicyFor(twoEpochPolicy, at(source.created_at));
    expect(sel.ok).toBe(true);
    if (sel.ok) {
      expect(sel.epoch_id).toBe(COMMITTED.admission_history[0].epoch_id);
      expect(sel.admission.lease_duration_minutes).toBe(240);
    }

    const r = reconstructLane({
      ...fixtureToInput(fixture),
      policy: twoEpochPolicy,
      context: { now: baseline.replay_now },
    });
    const d = r.dispositions.find((x) => x.comment_id === REFUSED_ID);
    expect(d?.status).toBe("refused");
    expect(d?.refusal).toBe("lease-expiry-unbounded");
    expect(d?.detail).toContain("240m");
    // ...and the lane as a whole did not move.
    expect(r.lane).toEqual(baseline.lane);
    expect(r.lane?.state).toBe("ready-for-claude");
  });

  it("the cutover does not resurrect the refused event into the applied set", () => {
    const r = reconstructLane({
      ...fixtureToInput(fixture),
      policy: twoEpochPolicy,
      context: { now: baseline.replay_now },
    });
    const applied = r.dispositions.filter((d) => d.status === "applied").map((d) => d.comment_id);
    expect(applied).toEqual(
      baseline.dispositions.filter((d: any) => d.status === "applied").map((d: any) => d.comment_id),
    );
    expect(applied).not.toContain(REFUSED_ID);
  });

  it("the SAME event shape posted after the cutover DOES receive the later policy", () => {
    // Same lease window (255m50s), same claim, later observed time: admitted
    // under epoch 2. The boundary is what changes the answer — nothing else.
    // The fixture allowlist is used rather than the committed one because this
    // probe is about the lease bound; identity must not be what decides it.
    const policy = {
      ...makePolicy(),
      admission_history: [
        makeEpoch({ epoch_id: "epoch-one", effective_from: "2026-01-01T00:00:00Z", lease_duration_minutes: 240 }),
        makeEpoch({ epoch_id: "epoch-two", effective_from: "2026-08-20T00:00:00Z", lease_duration_minutes: 2880 }),
      ],
      lease_duration_minutes: 2880,
    };
    expect(validatePolicy(policy).ok).toBe(true);

    const lane = makeLane({
      state: "ready-for-codex", event_sequence: 5, attempt: 1,
      pr_number: 136, pr_head_sha: HEAD_SHA,
    });
    const event = makeEvent({
      actor_role: "auditor", github_actor: "codex-login",
      event_type: "auditor.lease_acquired", prior_state: "ready-for-codex",
      requested_state: "codex-working", sequence: 6,
      lease_id: "lease-codex-after-cutover",
      lease_expires_at: "2026-09-01T22:40:00Z",
      occurred_at: "2026-09-01T18:24:10Z",
    });

    const after = reduce(lane, event, policy, {
      comment_author: "codex-login", event_observed_at: "2026-09-01T18:24:10Z",
    });
    expect(after.ok).toBe(true);
    if (after.ok) expect(after.lane.state).toBe("codex-working");

    // The identical grant judged under epoch 1 (before the cutover) is refused.
    const before = reduce(
      lane,
      { ...event, lease_expires_at: "2026-08-11T22:40:00Z", occurred_at: "2026-08-11T18:24:10Z" },
      policy,
      { comment_author: "codex-login", event_observed_at: "2026-08-11T18:24:10Z" },
    );
    expect(before.ok).toBe(false);
    if (!before.ok) {
      expect(before.refusal).toBe("lease-expiry-unbounded");
      expect(before.detail).toContain("240m");
    }
  });
});

// ---------------------------------------------------------------------------
// STRUCTURAL GUARD: the reducer cannot resume reading top-level admission
// ---------------------------------------------------------------------------

describe("the reducer adjudicates from the resolved epoch ONLY", () => {
  // The real guarantee is behavioral: a valid policy may omit the top-level
  // projection entirely, so any code path that reads policy.authorized_corridor
  // (or the other three) throws or visibly mis-adjudicates instead of quietly
  // working — a NaN lease bound would un-bound every lease, and a missing
  // corridor array would throw on .includes.
  function ledgerOnly(policy: Record<string, any>) {
    const stripped: Record<string, any> = { ...policy };
    for (const f of ADMISSION_FIELDS) delete stripped[f];
    return stripped;
  }

  it("a ledger-only committed policy replays every real lane identically", () => {
    const stripped = ledgerOnly(COMMITTED);
    expect(validatePolicy(stripped).ok).toBe(true);
    for (const f of ADMISSION_FIELDS) expect(stripped[f], f).toBeUndefined();
    for (const issue of REAL_LANES) {
      const baseline = baselineOf(issue);
      const r = reconstructLane({
        ...fixtureToInput(fixtureOf(issue)), policy: stripped, context: { now: baseline.replay_now },
      });
      expect(r.lane, `lane ${issue}`).toEqual(baseline.lane);
      expect(r.dispositions, `lane ${issue}`).toEqual(baseline.dispositions);
      expect(r.labels, `lane ${issue}`).toEqual(baseline.labels);
    }
  });

  it("each of the four decisions is driven by the epoch on a projection-free policy", () => {
    const ctx = { now: NOW };

    // (1) CORRIDOR — the epoch's corridor excludes the lane's phase.
    const outside = reduce(
      makeLane({ phase: "phase-50a" }),
      makeEvent({ event_type: "lane.activated", prior_state: "planning" }),
      makeEpochPolicy([makeEpoch({ authorized_corridor: ["phase-49q"] })]),
      ctx,
    );
    expect(outside.ok).toBe(false);
    if (!outside.ok) {
      expect(outside.refusal).toBe("outside-corridor");
      expect(outside.escalate).toBe(true);
    }

    // (2) ALLOWLIST — the epoch's allowlist lacks the coordinator identity.
    const notAllowed = reduce(
      makeLane(),
      makeEvent({ event_type: "lane.activated", prior_state: "planning" }),
      makeEpochPolicy([makeEpoch({
        actor_allowlist: { ...makeEpoch().actor_allowlist, coordinator: ["someone-else"] },
      })]),
      ctx,
    );
    expect(notAllowed.ok).toBe(false);
    if (!notAllowed.ok) expect(notAllowed.refusal).toBe("actor-not-allowlisted");

    // (3) LEASE BOUND — the epoch's duration is 60 minutes, the claim is 4h.
    const overBound = reduce(
      makeLane({ state: "ready-for-claude", event_sequence: 2 }),
      makeEvent({
        actor_role: "implementer", github_actor: "claude-login",
        event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
        requested_state: "claude-working", sequence: 3,
        lease_id: "lease-claude-epoch", lease_expires_at: "2026-07-16T16:00:00Z",
      }),
      makeEpochPolicy([makeEpoch({ lease_duration_minutes: 60 })]),
      { ...ctx, comment_author: "claude-login" },
    );
    expect(overBound.ok).toBe(false);
    if (!overBound.ok) {
      expect(overBound.refusal).toBe("lease-expiry-unbounded");
      expect(overBound.detail).toContain("60m");
    }

    // (4) PATCH CEILING — the epoch's ceiling of 1 escalates a second cycle.
    const packet = makeTaskPacket({ packet_kind: "patch", patch_cycle: 2 });
    const patchLane = () => makeLane({
      state: "patch-required", event_sequence: 8, attempt: 1, patch_cycle: 1, verdict: "PATCH",
    });
    const patchEvent = () => makeEvent({
      event_type: "coordinator.patch_packet_posted", prior_state: "patch-required", sequence: 9,
      refs: { task_packet_comment_id: 99, task_packet_digest: payloadDigest(packet) },
    });
    const ceiling = reduce(
      patchLane(), patchEvent(),
      makeEpochPolicy([makeEpoch({ maximum_patch_cycles: 1 })]),
      { ...ctx, task_packet: packet },
    );
    expect(ceiling.ok).toBe(true);
    if (ceiling.ok) {
      expect(ceiling.lane.state).toBe("operator-required");
      expect(ceiling.lane.operator_required_reason).toContain("exceeds maximum 1");
      expect(ceiling.lane.lease).toBeNull();
    }
    // ...and the same packet under a ceiling of 3 proceeds normally, so the
    // escalation above is the epoch's doing and not a broken fixture.
    const withinBudget = reduce(
      patchLane(), patchEvent(),
      makeEpochPolicy([makeEpoch({ maximum_patch_cycles: 3 })]),
      { ...ctx, task_packet: packet },
    );
    expect(withinBudget.ok).toBe(true);
    if (withinBudget.ok) expect(withinBudget.lane.state).toBe("ready-for-claude");
  });

  it("reducer source never reads an admission field off the live policy object", () => {
    // The cheap half of the guard (the behavioral tests above are the real
    // guarantee), scanned over COMMENT-BLANKED text so prose explaining the
    // rule cannot satisfy or violate it: comments may EXPLAIN that the four
    // fields are off limits; executable lines may not read them.
    const executable = readFileSync(".straylight/lib/reducer.mjs", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .split("\n")
      .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"))
      .join("\n");
    for (const field of ADMISSION_FIELDS) {
      expect(executable, field).not.toContain(`policy.${field}`);
      expect(executable, field).not.toContain(`policy?.${field}`);
      expect(executable, field).not.toContain(`policy["${field}"]`);
    }
    // Exactly ONE resolution per event, from the authenticated instant, and
    // every one of the four decisions taken from what it returned.
    expect(executable).toContain("admissionPolicyFor(policy, admissionAt)");
    expect(executable.match(/admissionPolicyFor\(/g)).toHaveLength(1);
    for (const field of ADMISSION_FIELDS) {
      expect(executable, field).toContain(`admission.${field}`);
    }
  });
});

// ---------------------------------------------------------------------------
// OBSERVED-TIME DETERMINISM
// ---------------------------------------------------------------------------

describe("authenticated event time is required, never synthesized", () => {
  const genesisBody = () => renderPayload(MARKERS.lane, makeLane());
  const eventComment = (id: number, user: string, payload: unknown, times: Record<string, any> = {}) => ({
    id, user, body: renderPayload(MARKERS.event, payload), ...times,
  });

  it("reconstruction refuses a protocol comment with no created_at instead of using the wall clock", () => {
    const event = makeEvent({ event_type: "lane.activated", prior_state: "planning", sequence: 1 });
    const r = reconstructLane({
      issue_body: genesisBody(),
      comments: [eventComment(9001, "chatgpt-login", event)],
      policy: COMMITTED,
      context: { now: NOW },
    });
    expect(r.ok).toBe(true);
    expect(r.dispositions).toEqual([{
      comment_id: 9001,
      status: "refused",
      refusal: "event-time-unavailable",
      detail: expect.stringContaining("created_at"),
    }]);
    // Fail closed WITHOUT rewriting the lane: an adapter's omission is not
    // evidence of tampering, so the lane simply stays at genesis.
    expect(r.lane?.state).toBe("planning");
    expect(r.lane?.event_sequence).toBe(0);
  });

  it("refuses a present-but-unparseable created_at (fail-closed as edited, still no clock)", () => {
    const event = makeEvent({ event_type: "lane.activated", prior_state: "planning", sequence: 1 });
    const r = reconstructLane({
      issue_body: genesisBody(),
      comments: [eventComment(9002, "chatgpt-login", event, {
        created_at: "2026-02-30T00:00:00Z", updated_at: "2026-02-30T00:00:00Z",
      })],
      policy: COMMITTED,
      context: { now: NOW },
    });
    expect(r.dispositions[0]?.status).toBe("refused");
    expect(r.dispositions[0]?.refusal).toBe("protocol-comment-edited");
    expect(r.lane?.event_sequence).toBe(0);
  });

  it("reconstruction NEVER lets context.now reach an admission decision", () => {
    // Same durable history, wildly different replay clocks — identical result.
    const input = fixtureToInput(fixtureOf(122));
    const baseline = baselineOf(122);
    for (const now of ["2026-08-14T12:00:00Z", "2027-01-01T00:00:00Z", "2099-12-31T23:59:59Z"]) {
      const r = reconstructLane({ ...input, policy: COMMITTED, context: { now } });
      expect(r.lane, now).toEqual(baseline.lane);
      expect(r.dispositions, now).toEqual(baseline.dispositions);
    }
  });

  it("an isolated reduce() may supply event_observed_at explicitly, and it wins over now", () => {
    // Direct callers (tests, tooling) may pass the observed time; when both are
    // present the OBSERVED time governs, so a live clock cannot override the
    // recorded one.
    const twoEpochs = makeEpochPolicy([
      makeEpoch({ epoch_id: "epoch-one", effective_from: "2026-01-01T00:00:00Z", authorized_corridor: ["phase-49p"] }),
      makeEpoch({ epoch_id: "epoch-two", effective_from: "2026-08-01T00:00:00Z", authorized_corridor: ["phase-49q"] }),
    ]);
    const lane = makeLane({ phase: "phase-49p" });
    const event = makeEvent({ event_type: "lane.activated", prior_state: "planning" });
    // Observed under epoch one: phase-49p is in corridor → applied.
    const early = reduce(lane, event, twoEpochs, {
      now: "2026-09-01T00:00:00Z", event_observed_at: "2026-03-01T00:00:00Z",
    });
    expect(early.ok).toBe(true);
    // Observed under epoch two: phase-49p is NOT in corridor → refused.
    const late = reduce(lane, event, twoEpochs, {
      now: "2026-03-01T00:00:00Z", event_observed_at: "2026-09-01T00:00:00Z",
    });
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.refusal).toBe("outside-corridor");
  });

  it("refuses an event whose observed time predates every epoch", () => {
    const r = reduce(
      makeLane(),
      makeEvent({ event_type: "lane.activated", prior_state: "planning" }),
      makeEpochPolicy([makeEpoch({ effective_from: "2026-06-01T00:00:00Z" })]),
      { event_observed_at: "2026-01-01T00:00:00Z" },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.refusal).toBe("admission-epoch-unresolved");
      expect(r.detail).toContain("no admission epoch is in force");
    }
  });

  it("refuses when no observed time is available at all", () => {
    const r = reduce(
      makeLane(),
      makeEvent({ event_type: "lane.activated", prior_state: "planning" }),
      makePolicy(),
      {},
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.refusal).toBe("time-missing");
  });
});

// ---------------------------------------------------------------------------
// LEASE REGRESSIONS, now under epoch-selected admission policy
// ---------------------------------------------------------------------------

describe("lease discipline under epoch-selected admission", () => {
  const readyForClaude = () => makeLane({ state: "ready-for-claude", event_sequence: 2 });
  const grantEvent = (overrides: Record<string, any> = {}) => makeEvent({
    actor_role: "implementer", github_actor: "claude-login",
    event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
    requested_state: "claude-working", sequence: 3, lease_id: "lease-claude-epoch-1",
    lease_expires_at: "2026-07-16T16:00:00Z", occurred_at: NOW, ...overrides,
  });
  // A lease is granted against the packet that authorized the work, so the
  // packet is part of every grant context; the completion paths ignore it.
  const ctx = (overrides: Record<string, any> = {}) => ({
    comment_author: "claude-login", event_observed_at: NOW,
    task_packet: makeTaskPacket(), ...overrides,
  });
  const completion = (overrides: Record<string, any> = {}) => makeEvent({
    actor_role: "implementer", github_actor: "claude-login",
    event_type: "implementer.completed", prior_state: "claude-working",
    requested_state: "ready-for-codex", sequence: 4,
    lease_id: "lease-claude-1", head_sha: HEAD_SHA, head_branch: WORKING_BRANCH,
    refs: { pr_number: 120 }, ...overrides,
  });

  it("accepts a grant exactly at the epoch's configured boundary", () => {
    // NOW + 240m, to the millisecond.
    const r = reduce(readyForClaude(), grantEvent(), makePolicy(), ctx());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lane.state).toBe("claude-working");
      expect(r.lane.lease.expires_at).toBe("2026-07-16T16:00:00Z");
    }
  });

  it("refuses a grant one millisecond beyond the epoch's boundary", () => {
    const r = reduce(
      readyForClaude(), grantEvent({ lease_expires_at: "2026-07-16T16:00:00.001Z" }), makePolicy(), ctx(),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.refusal).toBe("lease-expiry-unbounded");
      expect(r.detail).toContain("240m");
    }
  });

  it("bounds the grant by OBSERVED GitHub time, not by the actor's occurred_at", () => {
    // The real lane #122 seq-109 pattern: occurred_at (18:40) would have made
    // the claim exactly 240m and admissible; the authenticated comment time
    // (18:24:10) makes it 255m50s and refused. An actor cannot inflate its own
    // grant by back-dating occurred_at.
    const observed = "2026-08-11T18:24:10Z";
    const r = reduce(
      readyForClaude(),
      grantEvent({ occurred_at: "2026-08-11T18:40:00Z", lease_expires_at: "2026-08-11T22:40:00Z" }),
      makePolicy(),
      ctx({ event_observed_at: observed }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.refusal).toBe("lease-expiry-unbounded");
    // Proof the refusal is about the OBSERVED time: measured from occurred_at
    // the same claim is exactly 240 minutes.
    expect((at("2026-08-11T22:40:00Z") - at("2026-08-11T18:40:00Z")) / 60000).toBe(240);
    expect((at("2026-08-11T22:40:00Z") - at(observed)) / 60000).toBeGreaterThan(240);
  });

  it("refuses a completion posted after the lease expired — no late-result path in v1", () => {
    const lane = laneClaudeWorking({
      lease: makeLease({ expires_at: "2026-07-16T16:00:00Z" }),
      working_branch: WORKING_BRANCH, pr_number: 120,
    });
    const r = reduce(lane, completion(), makePolicy(), ctx({ event_observed_at: "2026-07-16T17:00:00Z" }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.refusal).toBe("lease-expired");
      expect(r.detail).toContain("no late-result path");
    }
  });

  it("a later, longer epoch does not extend an ALREADY-GRANTED lease", () => {
    // The recorded expiry is a durable fact of the lease record; admission
    // policy bounds what may be granted, never what already was.
    const lane = laneClaudeWorking({
      lease: makeLease({ expires_at: "2026-07-16T16:00:00Z" }),
      working_branch: WORKING_BRANCH, pr_number: 120,
    });
    const policy = makeEpochPolicy([
      makeEpoch({ epoch_id: "epoch-one", effective_from: "2026-01-01T00:00:00Z", lease_duration_minutes: 240 }),
      makeEpoch({ epoch_id: "epoch-two", effective_from: "2026-07-16T00:00:00Z", lease_duration_minutes: 2880 }),
    ]);
    const r = reduce(lane, completion(), policy, ctx({ event_observed_at: "2026-07-16T17:00:00Z" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.refusal).toBe("lease-expired");
  });

  it("the epoch governing the GRANT sets the bound, even across a cutover", () => {
    const policy = makeEpochPolicy([
      makeEpoch({ epoch_id: "epoch-one", effective_from: "2026-01-01T00:00:00Z", lease_duration_minutes: 240 }),
      makeEpoch({ epoch_id: "epoch-two", effective_from: "2026-08-01T00:00:00Z", lease_duration_minutes: 2880 }),
    ]);
    // A 20-hour grant: refused before the cutover, admitted after it.
    const before = reduce(
      readyForClaude(),
      grantEvent({ lease_expires_at: "2026-07-17T08:00:00Z", occurred_at: "2026-07-16T12:00:00Z" }),
      policy, ctx({ event_observed_at: "2026-07-16T12:00:00Z" }),
    );
    expect(before.ok).toBe(false);
    if (!before.ok) expect(before.refusal).toBe("lease-expiry-unbounded");
    const after = reduce(
      readyForClaude(),
      grantEvent({ lease_expires_at: "2026-08-15T08:00:00Z", occurred_at: "2026-08-14T12:00:00Z" }),
      policy, ctx({ event_observed_at: "2026-08-14T12:00:00Z" }),
    );
    expect(after.ok).toBe(true);
    if (after.ok) expect(after.lane.state).toBe("claude-working");
  });
});

// ---------------------------------------------------------------------------
// KILL SWITCH remains live and un-epoched
// ---------------------------------------------------------------------------

describe("the kill switch keeps its exact v1 freeze behavior", () => {
  const input = () => fixtureToInput(fixtureOf(122));
  const baseline = baselineOf(122);

  it("enabled:false FREEZES the projection without rewinding history", () => {
    const r = reconstructLane({
      ...input(), policy: { ...COMMITTED, enabled: false }, context: { now: baseline.replay_now },
    });
    expect(r.frozen).toBe(true);
    expect(r.lane).toEqual(baseline.lane);
    expect(r.dispositions).toEqual(baseline.dispositions);
  });

  it("a malformed `enabled` is a broken policy, not an engaged switch", () => {
    const r = reconstructLane({
      ...input(), policy: { ...COMMITTED, enabled: "false" }, context: { now: baseline.replay_now },
    });
    expect(r.frozen).toBe(true);
    expect(r.lane?.event_sequence).toBe(0);
    expect(r.dispositions.length).toBeGreaterThan(0);
    expect(r.dispositions.every((d) => d.refusal === "policy-invalid")).toBe(true);
  });

  it("reduce() still refuses every event under the live kill switch", () => {
    const r = reduce(
      makeLane(),
      makeEvent({ event_type: "lane.activated", prior_state: "planning" }),
      makePolicy({ enabled: false }),
      { now: NOW },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.refusal).toBe("automation-disabled");
  });
});

// The fixture epoch constants are the assumption every fixture policy rests
// on: one epoch, in force before any fixture timestamp.
describe("fixture epoch constants", () => {
  it("the fixture epoch precedes the fixture clock", () => {
    expect(EPOCH_ID).toBe(makeEpoch().epoch_id);
    expect(EPOCH_FROM).toBe(makeEpoch().effective_from);
    expect(at(EPOCH_FROM)).toBeLessThan(at(NOW));
  });
});
