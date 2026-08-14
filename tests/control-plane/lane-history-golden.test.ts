// Control Plane v2 — GOLDEN HISTORY: the migration changed nothing that happened.
//
// The whole point of epoching admission policy is that replay stops depending on
// today's editable values. The proof obligation that comes with it is exactly
// this file: every durable cp-lane event must still be dispositioned the way it
// was dispositioned BEFORE the migration — same state, same sequence, same
// applied/refused verdict, same refusal code, same refusal detail, same labels,
// same lease, same complete lane record.
//
// The pre-migration answers are committed as baselines captured from the code
// and policy at main 5625c5be425c71fce90a22e81d123b42ed104538 (policy schema
// straylight.automation-policy.v1). They are EVIDENCE, not configuration:
// regenerating one to make a test pass destroys the only thing it is for. So the
// content of all six evidence files is pinned below, and every pin is verified
// BEFORE the file is allowed to be used as evidence — a silent regeneration
// fails loudly, at the lock, rather than quietly redefining the expected past.
//
// This is not cryptographic public anchoring: there is no notary and no external
// timestamp. It is an exact-SHA repository proof-harness lock. Its force is that
// changing the recorded past now requires editing pinned digests in reviewed
// protocol test code, in the same commit, where a reviewer sees it.
//
// The single most load-bearing row in the whole corpus: lane #122 comment
// 5257177236 is REFUSED as lease-expiry-unbounded because its claimed expiry
// exceeds the observed grant + 240m. PR #139 changed the live lease to 2880 and
// this event became ACCEPTED — a retroactive rewrite of a refused authority
// claim. Under epochs the 240 comes from the epoch governing that event's
// authenticated observation time, so no future policy change can reach it.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { payloadDigest } from "../../.straylight/lib/canonical.mjs";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { admissionPolicyFor, parseIsoInstant, ADMISSION_FIELDS } from "../../.straylight/lib/validate.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { scan } from "../../.straylight/lib/watchdog.mjs";
import { loadProtocolPolicy } from "../../.straylight/lib/policy-source.mjs";
import { fixtureToInput, FIXTURE_REPLAY_NOW } from "../../scripts/capture-cp-lane-history.mjs";
import { makePolicy, makeEpoch } from "./_fixtures.js";

const SOURCE_MAIN_SHA = "5625c5be425c71fce90a22e81d123b42ed104538";
const DIR = "tests/control-plane/fixtures/lane-history";

// EVIDENCE LOCK. bytes_sha256 pins the file exactly as committed; canonical
// pins its parsed content through the protocol's one canonicalizer, so a
// whitespace-only reformat is distinguishable from a content change.
const LANE_HISTORY_EVIDENCE_LOCKS = [
  {
    file: "lane-118.json",
    bytes_sha256: "2a63daae2e7ed9a795f88a898a9a6e2329e98bfdd8672d96b52cf76fe4cc6b66",
    canonical: "sha256:2847ff13da0274874c2b3f0305bfb55c0a33bdfc6302c31bfd2fef8f28423e4f",
  },
  {
    file: "lane-118.baseline.json",
    bytes_sha256: "200ccfee08e6aefabb691822a6683763aa641f14b4e025e068c3dbf9c6ff231f",
    canonical: "sha256:932064085129d8274e98d969a58e03c8d810320d1ee79da5c699667eff925b82",
  },
  {
    file: "lane-120.json",
    bytes_sha256: "ce403673eedc34ccebef1e88b953a0369edaf0d78a160d59a22f7c6771bd13e3",
    canonical: "sha256:258ff890286423e8692971af34afc9021150ddb8a233259fb12db297e76fb5c2",
  },
  {
    file: "lane-120.baseline.json",
    bytes_sha256: "41da1a12c14bc46a806f1561aa6c8b4cddd373a41d61d220e8ae016a3fbf1928",
    canonical: "sha256:817e424484807893b5143877fea359d61aa27cc89df420d7ef7a472cf1f5cee2",
  },
  {
    file: "lane-122.json",
    bytes_sha256: "a4bc317c110dd4ce2ba8732dbd13ab2c575253654c698e9f79b0b30cc2c14b5c",
    canonical: "sha256:a4accdb49324e66f33582582bac06c7129aa4cb04e1d238a721c3b869313e77c",
  },
  {
    file: "lane-122.baseline.json",
    bytes_sha256: "162bf594caf802ddbe753f55b8e6c8d4a844c6f608c565ed3b4c692c3b4fce20",
    canonical: "sha256:d22cd51355007e225e496e7bd4a6d5e40a30ee180417a923c1564fd485bf6d41",
  },
] as const;

function lockFor(file: string) {
  const lock = LANE_HISTORY_EVIDENCE_LOCKS.find((l) => l.file === file);
  if (!lock) throw new Error(`${file} is not pinned in LANE_HISTORY_EVIDENCE_LOCKS`);
  return lock;
}

// Errors of one evidence file against its lock. [] means "usable as evidence".
function evidenceErrors(file: string): string[] {
  const lock = lockFor(file);
  const errors: string[] = [];
  const bytes = readFileSync(`${DIR}/${file}`);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== lock.bytes_sha256) errors.push(`${file}: bytes ${digest} != pinned ${lock.bytes_sha256}`);
  const parsed = parseStrict(bytes.toString("utf8"));
  if (!parsed.ok) return [...errors, `${file}: ${(parsed as any).reason}`];
  const canonical = payloadDigest((parsed as any).value);
  if (canonical !== lock.canonical) errors.push(`${file}: canonical ${canonical} != pinned ${lock.canonical}`);
  const sha = (parsed as any).value?.source_main_sha;
  if (sha !== SOURCE_MAIN_SHA) errors.push(`${file}: source_main_sha ${String(sha)} != ${SOURCE_MAIN_SHA}`);
  return errors;
}

// THE ONLY READER. Nothing in this file touches an evidence file except through
// here, so the lock is always checked before the content is believed.
function evidence(file: string): any {
  const errors = evidenceErrors(file);
  if (errors.length > 0) throw new Error(`EVIDENCE LOCK FAILED: ${errors.join("; ")}`);
  return (parseStrict(readFileSync(`${DIR}/${file}`, "utf8")) as any).value;
}

const policy = (() => {
  const loaded = loadProtocolPolicy({ committedPath: ".straylight/automation-policy.json" });
  if (!loaded.ok) throw new Error(`committed policy refused: ${loaded.refusal} (${loaded.detail})`);
  return loaded.value as any;
})();

function projection(result: any) {
  return {
    ok: result.ok,
    refusal: result.refusal ?? null,
    detail: result.detail ?? null,
    frozen: result.frozen ?? null,
    labels: result.labels ?? [],
    lane: result.lane ?? null,
    dispositions: result.dispositions ?? [],
  };
}

const replayed = new Map<number, { fixture: any; baseline: any; replay: any }>();
function lane(issue: number) {
  if (!replayed.has(issue)) {
    const fixture = evidence(`lane-${issue}.json`);
    const baseline = evidence(`lane-${issue}.baseline.json`);
    const replay = projection(reconstructLane({ ...fixtureToInput(fixture), policy }));
    replayed.set(issue, { fixture, baseline, replay });
  }
  return replayed.get(issue)!;
}

// The pre-migration answers, restated here so the expected past is readable in
// the test and not only inside a JSON file.
const EXPECTED = [
  { issue: 118, lane_id: "lane-phase-49p", state: "ready-for-merge", sequence: 12, applied: 12, refused: 2 },
  { issue: 120, lane_id: "lane-phase-49q", state: "merged", sequence: 11, applied: 11, refused: 3 },
  { issue: 122, lane_id: "lane-phase-50a", state: "ready-for-claude", sequence: 121, applied: 121, refused: 3 },
] as const;

// =============================================================================
// H / J-12 — the evidence lock itself.
// =============================================================================
describe("H — committed pre-migration evidence is locked before it is used", () => {
  it("all six evidence files match their pinned bytes AND canonical digests", () => {
    expect(LANE_HISTORY_EVIDENCE_LOCKS).toHaveLength(6);
    for (const lock of LANE_HISTORY_EVIDENCE_LOCKS) {
      expect(evidenceErrors(lock.file), lock.file).toEqual([]);
    }
  });

  it("every evidence file binds itself to the source main SHA", () => {
    for (const lock of LANE_HISTORY_EVIDENCE_LOCKS) {
      expect(evidence(lock.file).source_main_sha, lock.file).toBe(SOURCE_MAIN_SHA);
      expect(evidence(lock.file).repository, lock.file).toBe("0xHoneyJar/loa-straylight");
    }
    // The SHA is a real commit in this repository (skipped in a checkout that
    // genuinely lacks the object; the digest pins above still bind the files).
    try {
      const type = execFileSync("git", ["cat-file", "-t", SOURCE_MAIN_SHA], { encoding: "utf8" }).trim();
      expect(type).toBe("commit");
    } catch { /* shallow checkout */ }
  });

  it("the baselines were captured under v1 — the pre-migration policy they prove", () => {
    for (const { issue } of EXPECTED) {
      expect(lane(issue).baseline.policy_schema, `#${issue}`).toBe("straylight.automation-policy.v1");
      expect(lane(issue).baseline.admission.epoch_id, `#${issue}`).toBeNull();
      expect(lane(issue).baseline.admission.lease_duration_minutes, `#${issue}`).toBe(240);
    }
  });

  it("J-12: any content change to a fixture or baseline fails the lock", () => {
    const mutations: Array<[string, (v: any) => void]> = [
      ["lane-118.json", (v) => { v.comments[0].created_at = "2026-07-25T20:49:01Z"; }],
      ["lane-118.json", (v) => { v.comments[0].payloads.event.reason = "rewritten"; }],
      ["lane-118.baseline.json", (v) => { v.dispositions[13].status = "applied"; }],
      ["lane-120.baseline.json", (v) => { v.summary.refused = 0; }],
      ["lane-122.json", (v) => { v.comments.pop(); }],
      // The exact rewrite PR #139 produced: the refused lease claim accepted.
      ["lane-122.baseline.json", (v) => {
        const d = v.dispositions.find((x: any) => x.comment_id === 5257177236);
        d.status = "applied";
        delete d.refusal;
        d.detail = "ready-for-codex -[auditor.lease_acquired#109]-> codex-working";
      }],
    ];
    for (const [file, mutate] of mutations) {
      const mutated = structuredClone(evidence(file));
      mutate(mutated);
      const lock = lockFor(file);
      const bytes = createHash("sha256").update(JSON.stringify(mutated, null, 2) + "\n").digest("hex");
      expect(bytes, file).not.toBe(lock.bytes_sha256);
      // Canonical too: no reformatting trick makes a content change invisible.
      expect(payloadDigest(mutated), file).not.toBe(lock.canonical);
    }
  });

  it("J-12: a mutated fixture would replay DIFFERENTLY — the lock is load-bearing", () => {
    const mutated = structuredClone(evidence("lane-122.json"));
    // Move the historical lease grant later: under a mutable-replay architecture
    // this is how a refusal silently becomes an acceptance.
    mutated.comments = mutated.comments.filter((c: any) => c.id !== 5276134089);
    const after = projection(reconstructLane({ ...fixtureToInput(mutated), policy }));
    expect(JSON.stringify(after)).not.toBe(JSON.stringify(lane(122).baseline.lane));
    expect(after.lane.event_sequence).not.toBe(121);
  });

  it("both evidence kinds announce that regenerating them is destructive and pinned here", () => {
    for (const lock of LANE_HISTORY_EVIDENCE_LOCKS) {
      const note = evidence(lock.file)._comment;
      expect(note, lock.file).toMatch(/tests\/control-plane\/lane-history-golden\.test\.ts/);
      expect(note, lock.file).toMatch(/NEVER hand-edit|Regenerating this file to make a test pass/);
    }
    // The capture harness points at this file too, so whoever regenerates is
    // told where the pin lives before the diff is even written.
    const capture = readFileSync("scripts/capture-cp-lane-history.mjs", "utf8");
    expect(capture).toMatch(/lane-history-golden\.test\.ts/);
  });
});

// =============================================================================
// I — the histories themselves, per lane, exactly.
// =============================================================================
describe.each(EXPECTED)("I — lane #$issue replays identically under v2", (exp) => {
  it("the COMPLETE projection is byte-identical to the pre-migration baseline", () => {
    const { baseline, replay } = lane(exp.issue);
    const expected = {
      ok: baseline.ok,
      refusal: baseline.refusal ?? null,
      detail: baseline.detail ?? null,
      frozen: baseline.frozen,
      labels: baseline.labels,
      lane: baseline.lane,
      dispositions: baseline.dispositions,
    };
    // Deep equality first (readable diffs), then canonical byte equality.
    expect(replay).toEqual(expected);
    expect(payloadDigest(replay)).toBe(payloadDigest(expected));
  });

  it("state, sequence, lane id, and applied/refused counts match the expected past", () => {
    const { replay, baseline } = lane(exp.issue);
    expect(replay.ok).toBe(true);
    expect(replay.frozen).toBe(false);
    expect(replay.lane.lane_id).toBe(exp.lane_id);
    expect(replay.lane.state).toBe(exp.state);
    expect(replay.lane.event_sequence).toBe(exp.sequence);
    expect(replay.dispositions.filter((d: any) => d.status === "applied")).toHaveLength(exp.applied);
    expect(replay.dispositions.filter((d: any) => d.status === "refused")).toHaveLength(exp.refused);
    expect(baseline.summary).toEqual({
      state: exp.state, event_sequence: exp.sequence, applied: exp.applied, refused: exp.refused,
    });
    // No lane ends holding a lease: nothing in this change resurrects one.
    expect(replay.lane.lease).toBeNull();
  });

  it("the disposition list is ordered by comment, complete, and one row per event", () => {
    // Exactly the comments carrying an EVENT payload are dispositioned; a
    // task-packet-only or audit-record-only comment is durable content the
    // reducer reads, not a transition it dispositions.
    const { fixture, replay } = lane(exp.issue);
    const protocolIds = fixture.comments
      .filter((c: any) => c.payloads?.event !== undefined)
      .map((c: any) => c.id);
    expect(replay.dispositions.map((d: any) => d.comment_id)).toEqual(protocolIds);
    for (const d of replay.dispositions) {
      expect(["applied", "refused"]).toContain(d.status);
      if (d.status === "refused") expect(typeof d.refusal).toBe("string");
      expect(typeof d.detail).toBe("string");
    }
  });

  it("every refusal keeps its exact code AND detail", () => {
    const { baseline, replay } = lane(exp.issue);
    const refusals = (rs: any[]) =>
      rs.filter((d) => d.status === "refused").map((d) => `${d.comment_id}:${d.refusal}:${d.detail}`);
    expect(refusals(replay.dispositions)).toEqual(refusals(baseline.dispositions));
    expect(refusals(replay.dispositions)).toHaveLength(exp.refused);
  });

  it("labels are unchanged", () => {
    expect(lane(exp.issue).replay.labels).toEqual(lane(exp.issue).baseline.labels);
    expect(lane(exp.issue).replay.labels[0]).toBe("cp-lane");
  });

  it("every event resolves to the genesis epoch, whose values ARE the v1 values", () => {
    const { fixture, baseline } = lane(exp.issue);
    for (const c of fixture.comments) {
      const at = parseIsoInstant(c.created_at);
      expect(at, `${c.id} created_at`).not.toBeNull();
      const resolved = admissionPolicyFor(policy, at);
      expect(resolved.ok, `${c.id}: ${resolved.ok ? "" : (resolved as any).errors.join("; ")}`).toBe(true);
      if (!resolved.ok) continue;
      expect(resolved.epoch_id).toBe("epoch-001");
      for (const field of ADMISSION_FIELDS) {
        if (field === "actor_allowlist") {
          // v1 carried an explanatory `_note` inside the allowlist, which v2
          // moved to a top-level documentation key. Compared role by role, the
          // admitted identities are identical.
          for (const role of Object.keys(resolved.admission.actor_allowlist)) {
            expect(resolved.admission.actor_allowlist[role], `${c.id} ${role}`)
              .toEqual(baseline.admission.actor_allowlist[role]);
          }
          expect(Object.keys(resolved.admission.actor_allowlist).sort())
            .toEqual(Object.keys(baseline.admission.actor_allowlist).filter((k) => k !== "_note").sort());
          continue;
        }
        expect(resolved.admission[field], `${c.id} ${field}`).toEqual(baseline.admission[field]);
      }
    }
  });
});

// =============================================================================
// I — the specific rows PR #139 would have rewritten.
// =============================================================================
describe("I — lane #122's lease history, event by event", () => {
  const at = (id: number) => lane(122).replay.dispositions.find((d: any) => d.comment_id === id);

  it("5257177236 stays REFUSED as lease-expiry-unbounded, bounded by 240m", () => {
    expect(at(5257177236)).toEqual({
      comment_id: 5257177236,
      status: "refused",
      refusal: "lease-expiry-unbounded",
      detail: "lease_expires_at 2026-08-11T22:40:00Z exceeds observed grant + 240m",
    });
    // The bound comes from the epoch governing THAT event, not from live policy.
    expect(at(5257177236).detail).not.toMatch(/2880/);
  });

  it("5257220713 is the corrected re-post, applied as seq 109", () => {
    expect(at(5257220713)).toEqual({
      comment_id: 5257220713,
      status: "applied",
      detail: "ready-for-codex -[auditor.lease_acquired#109]-> codex-working",
    });
  });

  it("the seq119 implementer lease remains APPLIED, and its expiry remains final", () => {
    const acquired = lane(122).replay.dispositions.filter((d: any) =>
      d.status === "applied" && /implementer\.lease_acquired#119/.test(d.detail));
    expect(acquired).toHaveLength(1);
    // v1 has no late-result path: the expiry stands, the work is redone.
    expect(at(5274503689)).toEqual({
      comment_id: 5274503689,
      status: "applied",
      detail: "claude-working -[system.lease_expired#120]-> lease-expired",
    });
    expect(at(5276134089)).toEqual({
      comment_id: 5276134089,
      status: "applied",
      detail: "lease-expired -[system.requeued#121]-> ready-for-claude",
    });
  });

  it("the lane ends ready-for-claude at 121 with no lease", () => {
    const l = lane(122).replay.lane;
    expect(l.state).toBe("ready-for-claude");
    expect(l.next_actor).toBe("implementer");
    expect(l.event_sequence).toBe(121);
    expect(l.lease).toBeNull();
    expect(l.last_transition).toBe("lease-expired -[system.requeued#121]-> ready-for-claude");
  });

  it("no control-plane source special-cases any of these comment ids or lanes", () => {
    const ids = ["5257177236", "5257220713", "5274503689", "5276134089", "5080520742", "5096236059"];
    const files = execFileSync("git", ["ls-files", ".straylight/lib", ".straylight/bin", "scripts"], { encoding: "utf8" })
      .split("\n").filter((f) => f.endsWith(".mjs"));
    expect(files.length).toBeGreaterThan(15);
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      for (const id of ids) expect(src, `${file} names ${id}`).not.toContain(id);
      expect(src, `${file} names a lane id`).not.toContain("lane-phase-50a");
    }
  });
});

// =============================================================================
// I — the watchdog verdict at an identical evaluation instant.
// =============================================================================
describe("I — the watchdog reaches the same verdict, and epochs cannot move it", () => {
  // Idle time is measured from each lane's last authenticated comment.
  function lanesForScan() {
    const lanes: any[] = [];
    const last_activity: Record<string, string> = {};
    for (const { issue } of EXPECTED) {
      const { fixture, replay } = lane(issue);
      lanes.push({ ...replay.lane, issue_number: issue });
      last_activity[replay.lane.lane_id] = fixture.comments[fixture.comments.length - 1].created_at;
    }
    return { lanes, last_activity };
  }

  function watchdogAt(now: string, pol: any) {
    const { lanes, last_activity } = lanesForScan();
    return scan(lanes, pol, { now, last_activity });
  }

  // Two policies that differ in ALL FOUR admission fields, sharing the live
  // stuck-lane threshold. Their epochs are unlocked ids, so validatePolicy
  // accepts both: the comparison isolates admission content exactly.
  const admissionA = makePolicy({
    admission_history: [makeEpoch({ epoch_id: "epoch-910", governs_from: "2026-07-01T00:00:00Z" })],
  });
  const admissionB = (() => {
    const epoch = makeEpoch({
      epoch_id: "epoch-911",
      governs_from: "2026-07-01T00:00:00Z",
      lease_duration_minutes: 999,
      maximum_patch_cycles: 9,
      authorized_corridor: ["phase-99z"],
      actor_allowlist: {
        coordinator: ["someone-else"], implementer: ["someone-else"], auditor: ["someone-else"],
        operator: ["someone-else"], system: ["someone-else"],
      },
    });
    const p = makePolicy({ admission_history: [epoch] });
    for (const field of ADMISSION_FIELDS) p[field] = structuredClone(epoch[field]);
    return p;
  })();

  it("at the baselines' evaluation instant it proposes nothing", () => {
    expect(watchdogAt(FIXTURE_REPLAY_NOW, policy)).toEqual({ ok: true, actions: [] });
  });

  it("the verdict is identical under two policies with different admission epochs", () => {
    for (const now of [FIXTURE_REPLAY_NOW, "2026-09-01T12:00:00Z"]) {
      const a = watchdogAt(now, admissionA);
      const b = watchdogAt(now, admissionB);
      expect(JSON.stringify(a), now).toBe(JSON.stringify(b));
      expect(JSON.stringify(a), now).toBe(JSON.stringify(watchdogAt(now, policy)));
    }
  });

  it("it still responds to the LIVE stuck-lane threshold, which epochs do not govern", () => {
    const later = watchdogAt("2026-09-01T12:00:00Z", policy);
    expect(later.ok).toBe(true);
    expect(later.actions).toHaveLength(1);
    expect(later.actions[0]).toMatchObject({
      type: "post-event",
      event_type: "system.escalated",
      lane_id: "lane-phase-50a",
      issue_number: 122,
      sequence: 122,
      prior_state: "ready-for-claude",
      dedupe_key: "stuck:lane-phase-50a:121",
    });
    expect(later.actions[0]?.detail).toMatch(/threshold 72h\)$/);
    expect(policy.stuck_lane_threshold_hours).toBe(72);

    // Raising the live threshold silences it: a live field, still live.
    const relaxed = { ...policy, stuck_lane_threshold_hours: 8760 };
    expect(watchdogAt("2026-09-01T12:00:00Z", relaxed)).toEqual({ ok: true, actions: [] });
  });

  it("the watchdog reads no epoched admission field at all", () => {
    const code = readFileSync(".straylight/lib/watchdog.mjs", "utf8")
      .split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    for (const field of ADMISSION_FIELDS) expect(code, field).not.toContain(field);
    expect(code).toContain("stuck_lane_threshold_hours");
  });
});

// =============================================================================
// C — the genesis boundary, checked against the history itself.
// =============================================================================
describe("C — the genesis boundary is the earliest durable event, proven here", () => {
  const genesis = policy.admission_history[0];

  it("the boundary equals the earliest authenticated event observation in the corpus", () => {
    const times = EXPECTED.flatMap(({ issue }) => lane(issue).fixture.comments.map((c: any) => c.created_at));
    const earliest = times.reduce((a, b) => (parseIsoInstant(a)! <= parseIsoInstant(b)! ? a : b));
    expect(earliest).toBe("2026-07-25T20:49:00Z");
    expect(genesis.governs_from).toBe(earliest);
    expect(lane(118).fixture.comments[0].id).toBe(5080520742);
    expect(lane(118).fixture.comments[0].created_at).toBe(earliest);
  });

  it("no durable event predates the boundary — and one would fail closed, not be assumed", () => {
    const boundary = parseIsoInstant(genesis.governs_from)!;
    for (const { issue } of EXPECTED) {
      for (const c of lane(issue).fixture.comments) {
        expect(parseIsoInstant(c.created_at)!, `#${issue} ${c.id}`).toBeGreaterThanOrEqual(boundary);
      }
    }
    const before = admissionPolicyFor(policy, boundary - 1);
    expect(before.ok).toBe(false);
    expect((before as any).errors.join("; ")).toMatch(/precedes the earliest admission epoch/);
  });

  it("the boundary is NOT backdated to before the control plane existed", () => {
    // PR #140 claimed 2026-01-01T00:00:00Z, for which no authority evidence
    // exists. The boundary is a coverage claim about proven events, not a claim
    // that a policy was authorized earlier.
    expect(genesis.governs_from).not.toMatch(/^2026-01/);
    expect(parseIsoInstant(genesis.governs_from)!).toBeGreaterThan(parseIsoInstant("2026-07-01T00:00:00Z")!);
    // The epoch says where its evidence is, and says plainly that it asserts
    // nothing about authorization before that instant.
    expect(genesis.provenance.note).toMatch(/5080520742/);
    expect(genesis.provenance.note).toContain(SOURCE_MAIN_SHA);
    expect(genesis.provenance.note).toMatch(/asserts nothing about authorization before that instant/);
    expect(genesis.provenance.reference).toMatch(/ADR-050/);
  });
});
