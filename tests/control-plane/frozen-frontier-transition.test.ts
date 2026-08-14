// Control Plane v2 — H-01: A BACKDATED APPEND REWRITES HISTORY.
//
// THE DEFECT. Policy v2 protected historical admission policy two ways: the
// CONTENT of an accepted epoch is digest-locked in executable protocol code, and
// the previous admission history must survive as an exact canonical PREFIX of any
// candidate. Both hold for an epoch appended at the END of the array whose
// `governs_from` points BACKWARDS into time that already has events in it. The
// array is a clean append. The runtime lock is satisfied. The transition guard
// accepted it. And replaying the same durable comments now judges them under the
// new epoch.
//
// It is not theoretical. An epoch boundary shortly before lane #122 comment
// 5257177236 turns that REFUSED `lease-expiry-unbounded` claim into an ACCEPTED
// lease, which makes the corrected 5257220713 a stale sequence, which moves the
// lane's final state from ready-for-claude@121 to codex-working@109. This suite
// reproduces that consequence and then proves the guard refuses the transition
// BEFORE any replay can reinterpret anything.
//
// THE REPAIR — FROZEN FRONTIER CUTOVER. Appending an admission epoch requires:
//
//   1. the PREVIOUS committed policy already has enabled === false,
//   2. the CANDIDATE also has enabled === false,
//   3. an explicit durable event frontier captured under that freeze, and
//   4. every appended epoch's governs_from STRICTLY AFTER that frontier.
//
// (1) and (2) together forbid combining the append with the change that first
// disables automation, so nothing can be written between capturing the evidence
// and relying on it. Policy evolution becomes a multi-transition operation:
// freeze → capture → append → re-enable, each merged and audited on its own.
//
// WHAT IS AND IS NOT PROVEN HERE. The transition library is pure; it cannot know
// that GitHub lane discovery was complete. Completeness is provenance, supplied
// at authorization time by a read-only capture run while the control plane is
// already frozen. What is mechanical is that a missing, malformed, stale, or
// doctored frontier is a REFUSAL, and that a boundary at or before the evidence
// is a REFUSAL. A deliberate manual lane comment during the frozen window is
// outside the claim — `operator:eileen` must not write lane events during a
// cutover, and if one appears the evidence is stale and must be recaptured.
//
// EPOCH IDS. Two families are used deliberately:
//   epoch-001 / epoch-002 — the REAL accepted id and its hypothetical successor.
//     The runtime lock is keyed by id, so a history holding epoch-001 must hold
//     the whole accepted history; an unlocked epoch-002 beside it fails closed.
//     Used where the interaction WITH the lock is the point.
//   epoch-901 / epoch-902 — synthetic ids this build has never accepted, so the
//     runtime lock is silent by construction. Used where the frontier gate must
//     be proven to work ALONE, and for replay (proven below to be admission-
//     equivalent to the committed policy).
//
// NOTHING HERE ACTIVATES THE 48-HOUR LEASE. The committed policy remains
// epoch-001 / lease 240 / enabled true; the 2880-minute epoch exists only inside
// this file's synthetic simulation of the future procedure.

import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { payloadDigest } from "../../.straylight/lib/canonical.mjs";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { validatePolicy, ADMISSION_FIELDS } from "../../.straylight/lib/validate.mjs";
import { admissionEpochDigest } from "../../.straylight/lib/admission-locks.mjs";
import { validatePolicyTransition } from "../../.straylight/lib/policy-transition.mjs";
import { validateDurableFrontier, FRONTIER_SCHEMA } from "../../.straylight/lib/durable-frontier.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import { fixtureToInput } from "../../scripts/capture-cp-lane-history.mjs";
import { laneFrontierEntry, frontierFromCapture } from "../../scripts/capture-durable-frontier.mjs";
import { makeLane, makeEvent, makeTaskPacket } from "./_fixtures.js";

const REPO = "0xHoneyJar/loa-straylight";
const COMMITTED_PATH = ".straylight/automation-policy.json";
const TRANSITION_LIB = ".straylight/lib/policy-transition.mjs";
const CAPTURE_SCRIPT = "scripts/capture-durable-frontier.mjs";
const LANE_FIXTURES = "tests/control-plane/fixtures/lane-history";

// The instant the committed lane evidence was captured at. Used as the frontier's
// captured_at so this suite's derived evidence is deterministic.
const CAPTURED_AT = "2026-08-14T12:00:00Z";

// THE REAL DURABLE EVENT FRONTIER of this repository, as of the committed lane
// evidence: the latest authenticated protocol-event created_at across every
// cp-lane. Everything in this suite is bounded by it.
const FRONTIER_MAX = "2026-08-13T04:55:42Z";
const AFTER_FRONTIER = "2026-08-13T04:55:43Z"; // +1s: the earliest legal append
const BACKDATED = "2026-08-11T18:24:00Z"; // ~10s before comment 5257177236

// ONE lock over this suite's own evidence: the canonical digest of the frontier
// DERIVED from the three committed lane fixtures. It binds every value the
// frontier is made of — issue numbers, lane ids, last event ids, authenticated
// times, event counts — so the fixtures cannot drift underneath these proofs. The
// lane fixtures' own byte locks live with the golden-history suite that owns
// them; re-pinning them here would be a second copy to drift.
const DERIVED_FRONTIER_DIGEST = "sha256:3bd9d4998bd0029a7b5829504f8a0c0147a715df5f6ee12a6888e4b41deead34";

// -----------------------------------------------------------------------------
// Evidence readers
// -----------------------------------------------------------------------------

function parsedFile(path: string): any {
  const out = parseStrict(readFileSync(path, "utf8"));
  expect(out.ok, `${path} must parse strictly`).toBe(true);
  return structuredClone((out as any).value);
}

const committed = () => parsedFile(COMMITTED_PATH);

function laneFixture(issue: number): any {
  return JSON.parse(readFileSync(join(LANE_FIXTURES, `lane-${issue}.json`), "utf8"));
}

// The captured lane comment streams, rebuilt by the very function whose fidelity
// was proven at capture time.
function capturedLanes(): Array<{ issue_number: number; lane_id: string; comments: any[] }> {
  return [118, 120, 122].map((n) => {
    const f = laneFixture(n);
    return { issue_number: f.issue_number, lane_id: f.lane_id, comments: fixtureToInput(f).comments };
  });
}

// THE frontier reader. The derived-evidence lock is verified BEFORE the value is
// handed out, so no proof below can rest on evidence that drifted.
function realFrontier(): any {
  const built = frontierFromCapture({ repository: REPO, captured_at: CAPTURED_AT, lanes: capturedLanes() });
  expect(built.ok, built.ok ? "" : (built as any).errors?.join("; ")).toBe(true);
  const frontier = (built as any).frontier;
  expect(payloadDigest(frontier), "the derived durable event frontier changed").toBe(DERIVED_FRONTIER_DIGEST);
  return frontier;
}

const ctx = (frontier: any = realFrontier(), repository: string = REPO) => ({ repository, frontier });
const errorsOf = (r: ReturnType<typeof validatePolicyTransition>) => (r.ok ? [] : r.errors).join("; ");

// -----------------------------------------------------------------------------
// Policy builders
// -----------------------------------------------------------------------------

const committedEpoch = () => committed().admission_history[0];

// An admission-equivalent clone of the committed epoch under an id this build has
// never accepted, so the runtime lock is silent and the frontier gate stands
// alone. Proven admission-equivalent by the replay comparison below.
function unlocked(epoch_id: string, overrides: Record<string, any> = {}): any {
  const e = committedEpoch();
  e.epoch_id = epoch_id;
  e.provenance = {
    attributed_to: "test-fixture",
    reference: "tests/control-plane/frozen-frontier-transition.test.ts (synthetic, unlocked id)",
  };
  return Object.assign(e, structuredClone(overrides));
}

// A policy over an explicit history, with the required top-level projection
// derived from the final epoch and the kill switch set explicitly.
function policyOver(epochs: any[], enabled: boolean): any {
  const p = committed();
  p.enabled = enabled;
  p.admission_history = structuredClone(epochs);
  const final = p.admission_history[p.admission_history.length - 1];
  for (const f of ADMISSION_FIELDS) p[f] = structuredClone(final[f]);
  return p;
}

function realAppend(governs_from: string, overrides: Record<string, any> = {}): any {
  return {
    epoch_id: "epoch-002",
    governs_from,
    authorized_corridor: structuredClone(committedEpoch().authorized_corridor),
    maximum_patch_cycles: committedEpoch().maximum_patch_cycles,
    actor_allowlist: structuredClone(committedEpoch().actor_allowlist),
    lease_duration_minutes: 240,
    provenance: {
      attributed_to: "test-fixture",
      reference: "hypothetical successor epoch; NOT committed, NOT locked",
    },
    ...structuredClone(overrides),
  };
}

// -----------------------------------------------------------------------------
// Replay helpers
// -----------------------------------------------------------------------------

function replay(issue: number, policy: any): any {
  const f = laneFixture(issue);
  const out: any = reconstructLane({ ...fixtureToInput(f), policy });
  return {
    state: out.lane?.state ?? null,
    event_sequence: out.lane?.event_sequence ?? null,
    applied: (out.dispositions ?? []).filter((d: any) => d.status === "applied").length,
    refused: (out.dispositions ?? []).filter((d: any) => d.status === "refused").length,
    frozen: out.frozen ?? null,
    dispositions: out.dispositions ?? [],
  };
}

const dispositionOf = (r: any, id: number) => r.dispositions.find((d: any) => d.comment_id === id) ?? null;

// -----------------------------------------------------------------------------
// Staged-tree harness: run the REAL CLI out of a copied .straylight, optionally
// with asserted single-occurrence source mutations applied to it.
// -----------------------------------------------------------------------------

type Mutation = { file: string; from: string; to: string };

function stageStraylight(mutations: Mutation[] = []): string {
  const root = mkdtempSync(join(tmpdir(), "cp-frontier-stage-"));
  const sl = join(root, ".straylight");
  mkdirSync(sl);
  for (const dir of ["lib", "bin", "schemas"]) {
    cpSync(join(".straylight", dir), join(sl, dir), { recursive: true });
  }
  for (const m of mutations) {
    const path = join(sl, m.file);
    const src = readFileSync(path, "utf8");
    // The target must be unambiguous AND must be executable text: a comment that
    // merely NAMES a safeguard must never be what a mutation edits.
    const executable = src.split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(src.split(m.from).length - 1, `${m.file}: mutation target must occur exactly once`).toBe(1);
    expect(executable.split(m.from).length - 1, `${m.file}: mutation target must be executable text`).toBe(1);
    const next = src.split(m.from).join(m.to);
    expect(next, `${m.file}: mutation must change the source`).not.toBe(src);
    writeFileSync(path, next);
  }
  return sl;
}

function runCheck(
  sl: string,
  previous: any,
  candidate: any,
  evidence: { repository?: string; frontier?: any } | null = null,
): { status: number; out: any } {
  const dir = mkdtempSync(join(tmpdir(), "cp-frontier-args-"));
  const write = (name: string, value: any) => {
    const p = join(dir, name);
    writeFileSync(p, JSON.stringify(value, null, 2) + "\n");
    return p;
  };
  const args = ["--previous", write("prev.json", previous), "--candidate", write("cand.json", candidate)];
  if (evidence?.frontier !== undefined) args.push("--frontier", write("frontier.json", evidence.frontier));
  if (evidence?.repository !== undefined) args.push("--repository", evidence.repository);
  try {
    const stdout = execFileSync("node", [join(sl, "bin", "policy-transition-check.mjs"), ...args], {
      encoding: "utf8",
    });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    const stdout = typeof e.stdout === "string" ? e.stdout : "{}";
    return { status: e.status ?? -1, out: JSON.parse(stdout.trim().length > 0 ? stdout : "{}") };
  }
}

// =============================================================================
// The evidence: the real durable event frontier of this repository.
// =============================================================================
describe("the durable event frontier, derived from the committed lane evidence", () => {
  it("is derived from the three captured lanes and matches its pinned digest", () => {
    const f = realFrontier();
    expect(f.schema).toBe(FRONTIER_SCHEMA);
    expect(f.repository).toBe(REPO);
    expect(f.lanes.map((l: any) => l.issue_number)).toEqual([118, 120, 122]);
    expect(f.lanes.map((l: any) => l.lane_id)).toEqual(["lane-phase-49p", "lane-phase-49q", "lane-phase-50a"]);
    expect(f.lanes.map((l: any) => l.event_count)).toEqual([14, 14, 124]);
    expect(f.lanes.map((l: any) => l.last_event_comment_id)).toEqual([5096236059, 5131558860, 5276134089]);
    expect(f.max_event_created_at).toBe(FRONTIER_MAX);
    const v = validateDurableFrontier(f);
    expect(v.ok, v.ok ? "" : v.errors.join("; ")).toBe(true);
    if (v.ok) expect(v.value.event_count).toBe(152);
  });

  it("T13: the global maximum is DERIVED from the lane entries, never trusted", () => {
    for (const claimed of ["2026-09-01T00:00:00Z", "2026-01-01T00:00:00Z", FRONTIER_MAX.replace(":42Z", ":41Z")]) {
      const f = realFrontier();
      f.max_event_created_at = claimed;
      const v = validateDurableFrontier(f);
      expect(v.ok, `claimed ${claimed}`).toBe(false);
      if (!v.ok) {
        expect(v.errors.join("; ")).toMatch(/disagrees with the maximum derived from the lane entries/);
        expect(v.errors.join("; ")).toMatch(new RegExp(FRONTIER_MAX));
      }
    }
    // An equivalent SPELLING of the same instant is not a disagreement.
    const equivalent = realFrontier();
    equivalent.max_event_created_at = "2026-08-13T04:55:42.000Z";
    expect(validateDurableFrontier(equivalent).ok).toBe(true);
  });

  it("T13: the frontier reads AUTHENTICATED created_at, not actor occurred_at", () => {
    // An event payload claiming a far-future occurred_at moves nothing: the
    // frontier entry reports the GitHub-recorded created_at.
    const body =
      "<!-- straylight:event:v1 -->\n```json\n" +
      JSON.stringify({ schema: "straylight.event.v1", occurred_at: "2099-01-01T00:00:00Z" }) +
      "\n```";
    const built = laneFrontierEntry({
      issue_number: 999,
      lane_id: "lane-synthetic",
      comments: [{ id: 7, user: "eileen1337", created_at: "2026-05-05T05:05:05Z", updated_at: "2026-05-05T05:05:05Z", body }],
    });
    expect(built.ok).toBe(true);
    if (built.ok) {
      expect(built.entry.last_event_created_at).toBe("2026-05-05T05:05:05Z");
      expect(built.entry.event_count).toBe(1);
    }
    // And the capture utility never reads occurred_at at all.
    const capture = readFileSync(CAPTURE_SCRIPT, "utf8")
      .split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(capture).not.toMatch(/occurred_at/);
  });

  it("T13: non-protocol comments (reducer results, prose) are not authority", () => {
    const built = laneFrontierEntry({
      issue_number: 999,
      lane_id: "lane-synthetic",
      comments: [
        { id: 1, user: "eileen1337", created_at: "2026-05-05T05:05:05Z", updated_at: "2026-05-05T05:05:05Z",
          body: "<!-- straylight:event:v1 -->\n```json\n{\"schema\":\"straylight.event.v1\"}\n```" },
        // Later, but carries no protocol marker: inert to replay, inert here.
        { id: 2, user: "github-actions[bot]", created_at: "2026-06-06T06:06:06Z", updated_at: "2026-06-06T06:06:06Z",
          body: "<!-- cp-reducer-result:v1 -->\nlane advanced" },
      ],
    });
    expect(built.ok).toBe(true);
    if (built.ok) {
      expect(built.entry.event_count).toBe(1);
      expect(built.entry.last_event_comment_id).toBe(1);
      expect(built.entry.last_event_created_at).toBe("2026-05-05T05:05:05Z");
    }
  });

  it("an ambiguous or unreadable event comment is REFUSED, never silently omitted", () => {
    const twice = laneFrontierEntry({
      issue_number: 999, lane_id: "lane-synthetic",
      comments: [{ id: 1, user: "e", created_at: "2026-05-05T05:05:05Z", updated_at: "2026-05-05T05:05:05Z",
        body: "<!-- straylight:event:v1 -->\n```json\n{}\n```\n<!-- straylight:event:v1 -->\n```json\n{}\n```" }],
    });
    expect(twice.ok).toBe(false);
    if (!twice.ok) expect(twice.reason).toMatch(/appears 2 times \(ambiguous\)/);

    const broken = laneFrontierEntry({
      issue_number: 999, lane_id: "lane-synthetic",
      comments: [{ id: 1, user: "e", created_at: "2026-05-05T05:05:05Z", updated_at: "2026-05-05T05:05:05Z",
        body: "<!-- straylight:event:v1 -->\n```json\n{not json}\n```" }],
    });
    expect(broken.ok).toBe(false);
    if (!broken.ok) expect(broken.reason).toMatch(/payload unreadable/);
  });

  it("T12: a malformed, ambiguous, or incoherent frontier is refused", () => {
    const cases: Array<[string, (f: any) => any, RegExp]> = [
      ["not an object", () => "frontier", /not an object/],
      ["null", () => null, /not an object/],
      ["unknown key", (f) => { f.extra = 1; return f; }, /frontier\.extra: unknown key/],
      ["missing lanes", (f) => { delete f.lanes; return f; }, /frontier\.lanes: missing/],
      ["wrong schema", (f) => { f.schema = "straylight.frontier.v9"; return f; }, /frontier\.schema/],
      ["bad repository", (f) => { f.repository = "not-a-repo"; return f; }, /frontier\.repository/],
      ["bad captured_at", (f) => { f.captured_at = "2026-08-14 12:00"; return f; }, /frontier\.captured_at/],
      ["lanes not an array", (f) => { f.lanes = {}; return f; }, /frontier\.lanes: not an array/],
      ["empty lanes", (f) => { f.lanes = []; return f; }, /bounds nothing|frontier\.lanes: empty/],
      ["duplicate issue_number", (f) => { f.lanes[1].issue_number = 118; return f; }, /issue 118 appears 2 times/],
      ["duplicate lane_id", (f) => { f.lanes[1].lane_id = "lane-phase-49p"; return f; }, /lane_id "lane-phase-49p" appears 2 times/],
      ["missing last_event_created_at", (f) => { f.lanes[2].last_event_created_at = null; return f; }, /last_event_created_at/],
      ["impossible calendar time", (f) => { f.lanes[2].last_event_created_at = "2026-02-30T00:00:00Z"; return f; }, /last_event_created_at/],
      ["sub-millisecond precision", (f) => { f.lanes[2].last_event_created_at = "2026-08-13T04:55:42.1234Z"; return f; }, /last_event_created_at/],
      ["non-UTC offset", (f) => { f.lanes[2].last_event_created_at = "2026-08-13T04:55:42+00:00"; return f; }, /last_event_created_at/],
      ["negative event_count", (f) => { f.lanes[0].event_count = -1; return f; }, /event_count/],
      ["unknown lane key", (f) => { f.lanes[0].note = "x"; return f; }, /frontier\.lanes\[0\]\.note: unknown key/],
      ["count 0 but a last event recorded", (f) => { f.lanes[0].event_count = 0; return f; }, /event_count is 0 but a last event is recorded/],
      ["count > 0 with null id", (f) => { f.lanes[0].last_event_comment_id = null; return f; }, /last_event_comment_id/],
      ["no lane holds an event", (f) => {
        f.lanes = f.lanes.map((l: any) => ({ ...l, event_count: 0, last_event_comment_id: null, last_event_created_at: null }));
        f.max_event_created_at = FRONTIER_MAX;
        return f;
      }, /bounds nothing/],
      ["captured before the latest event", (f) => { f.captured_at = "2026-08-01T00:00:00Z"; return f; }, /precedes the latest observed event/],
    ];
    for (const [label, mutate, pattern] of cases) {
      const v = validateDurableFrontier(mutate(realFrontier()));
      expect(v.ok, label).toBe(false);
      if (!v.ok) expect(v.errors.join("; "), label).toMatch(pattern);
    }
  });
});

// =============================================================================
// The four transition categories.
// =============================================================================
describe("v2 → v2 LIVE-ONLY: the kill switch needs no evidence", () => {
  it("T9: freezing (enabled true → false, history unchanged) is accepted with no frontier", () => {
    const out = validatePolicyTransition(committed(), policyOver([committedEpoch()], false));
    expect(out.ok, errorsOf(out)).toBe(true);
    if (out.ok) {
      expect(out.kind).toBe("v2-live");
      expect(out.appended).toEqual([]);
      expect(out.frontier).toBeNull();
    }
  });

  it("T10: re-enabling (enabled false → true, history unchanged) is accepted with no frontier", () => {
    const out = validatePolicyTransition(policyOver([committedEpoch()], false), committed());
    expect(out.ok, errorsOf(out)).toBe(true);
    if (out.ok) {
      expect(out.kind).toBe("v2-live");
      expect(out.frontier).toBeNull();
    }
  });

  it("the accepted prefix is still enforced on the live path — an edit is not a live change", () => {
    const edited = policyOver([committedEpoch()], false);
    edited.admission_history[0].lease_duration_minutes = 2880;
    for (const f of ADMISSION_FIELDS) edited[f] = structuredClone(edited.admission_history[0][f]);
    const out = validatePolicyTransition(committed(), edited);
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/canonical content changed|accepted lock/);
  });
});

describe("v2 → v2 APPEND: the frozen frontier cutover", () => {
  it("T1: an append while the PREVIOUS policy is still enabled is refused, even with valid evidence", () => {
    const previous = policyOver([unlocked("epoch-901")], true);
    const candidate = policyOver([unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER })], false);
    const out = validatePolicyTransition(previous, candidate, ctx());
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/previous\.enabled: true — appending an admission epoch requires the control plane to be ALREADY FROZEN/);
    expect(errorsOf(out)).toMatch(/Merge a live-only transition setting enabled: false/);
  });

  it("T11: the same-PR 'disable AND append' shape is refused on the REAL committed policy", () => {
    // The tempting shape: one PR that stops automation and appends the new epoch.
    // It is exactly what must not be possible — the freeze has to be the
    // committed state before the frontier is captured.
    const candidate = committed();
    candidate.enabled = false;
    candidate.admission_history.push(realAppend(AFTER_FRONTIER, { lease_duration_minutes: 2880 }));
    for (const f of ADMISSION_FIELDS) candidate[f] = structuredClone(candidate.admission_history[1][f]);
    const out = validatePolicyTransition(committed(), candidate, ctx());
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/ALREADY FROZEN/);
  });

  it("the candidate must stay frozen too — an append that re-enables in the same change is refused", () => {
    const previous = policyOver([unlocked("epoch-901")], false);
    const candidate = policyOver([unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER })], true);
    const out = validatePolicyTransition(previous, candidate, ctx());
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/candidate\.enabled: true — the candidate must keep enabled: false/);
    expect(errorsOf(out)).toMatch(/separate later live-only transition/);
  });

  it("T2: an append with NO frontier evidence is refused", () => {
    const previous = policyOver([unlocked("epoch-901")], false);
    const candidate = policyOver([unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER })], false);
    for (const [label, context] of [
      ["no context at all", undefined],
      ["explicit null context", null],
      ["context without a frontier", { repository: REPO }],
      ["context that is not an object", "trust me"],
    ] as Array<[string, any]>) {
      const out = validatePolicyTransition(previous, candidate, context);
      expect(out.ok, label).toBe(false);
      expect(errorsOf(out), label).toMatch(/context.*(required for an admission append|frontier: missing|not an object)/);
    }
  });

  it("the evidence must name this repository, and the context shape is closed", () => {
    const previous = policyOver([unlocked("epoch-901")], false);
    const candidate = policyOver([unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER })], false);

    const mismatched = validatePolicyTransition(previous, candidate, ctx(realFrontier(), "someone/else"));
    expect(mismatched.ok).toBe(false);
    expect(errorsOf(mismatched)).toMatch(/does not match frontier\.repository/);

    const unnamed = validatePolicyTransition(previous, candidate, { frontier: realFrontier() } as any);
    expect(unnamed.ok).toBe(false);
    expect(errorsOf(unnamed)).toMatch(/context\.repository/);

    const extra = validatePolicyTransition(previous, candidate, { ...ctx(), reviewed_by: "someone" } as any);
    expect(extra.ok).toBe(false);
    expect(errorsOf(extra)).toMatch(/context\.reviewed_by: unknown key/);
  });

  it("the repository binding is a PROVENANCE boundary, and the library says so", () => {
    // Honest limit, recorded as a test so it cannot quietly be overclaimed: a
    // policy file carries no repository identity, so the pure library cannot know
    // which repository it is deciding for. It can only require that the operator
    // NAME one and that the evidence agree. A frontier captured in a different
    // repository, presented alongside a consistent --repository, is accepted.
    const previous = policyOver([unlocked("epoch-901")], false);
    const candidate = policyOver([unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER })], false);
    const elsewhere = realFrontier();
    elsewhere.repository = "someone/else";
    const foreign = validatePolicyTransition(previous, candidate, ctx(elsewhere, "someone/else"));
    expect(foreign.ok, errorsOf(foreign)).toBe(true);
    if (foreign.ok) expect(foreign.frontier!.repository).toBe("someone/else");
    // What IS mechanical: the repository is echoed in the verdict, so the
    // exact-SHA review sees which repository's history the append relied on
    // rather than having to assume it.
    expect(readFileSync(TRANSITION_LIB, "utf8")).toMatch(
      /cannot know which repository it is deciding for/,
    );
  });

  it("T3/T4/T5: the boundary must be STRICTLY after the frontier", () => {
    const previous = policyOver([unlocked("epoch-901")], false);
    const attempt = (governs_from: string) =>
      validatePolicyTransition(
        previous,
        policyOver([unlocked("epoch-901"), unlocked("epoch-902", { governs_from })], false),
        ctx(),
      );

    // T3 — before the frontier.
    const before = attempt("2026-08-13T04:55:41Z");
    expect(before.ok).toBe(false);
    expect(errorsOf(before)).toMatch(/is not strictly after the durable event frontier 2026-08-13T04:55:42Z/);
    expect(errorsOf(before)).toMatch(/RE-JUDGES events already recorded \(152 protocol event\(s\) across 3 lane\(s\)/);

    // T4 — exactly AT the frontier: the frontier instant already has an event.
    const at = attempt(FRONTIER_MAX);
    expect(at.ok).toBe(false);
    expect(errorsOf(at)).toMatch(/not strictly after/);

    // T5 — one second after.
    const after = attempt(AFTER_FRONTIER);
    expect(after.ok, errorsOf(after)).toBe(true);
    if (after.ok) {
      expect(after.kind).toBe("v2-append");
      expect(after.appended).toEqual(["epoch-902"]);
      expect(after.frontier).toEqual({
        repository: REPO,
        captured_at: CAPTURED_AT,
        lanes: 3,
        events: 152,
        max_event_created_at: FRONTIER_MAX,
        appended_governs_from: AFTER_FRONTIER,
      });
    }
  });

  it("only ONE epoch may be appended per reviewed transition", () => {
    const out = validatePolicyTransition(
      policyOver([unlocked("epoch-901")], false),
      policyOver([
        unlocked("epoch-901"),
        unlocked("epoch-902", { governs_from: AFTER_FRONTIER }),
        unlocked("epoch-903", { governs_from: "2026-08-14T00:00:00Z" }),
      ], false),
      ctx(),
    );
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/2 epochs appended in one transition \("epoch-902", "epoch-903"\)/);
  });

  it("T12: an append carrying malformed evidence is refused with the frontier's own errors", () => {
    const broken = realFrontier();
    broken.lanes[1].issue_number = 118;
    const out = validatePolicyTransition(
      policyOver([unlocked("epoch-901")], false),
      policyOver([unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER })], false),
      ctx(broken),
    );
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/context\.frontier\.lanes: issue 118 appears 2 times/);
  });
});

describe("v2 historical mutation is still refused, for reasons that are not the frontier", () => {
  it("editing, deleting, reordering, and replacing accepted epochs stay refused", () => {
    const E901 = unlocked("epoch-901");
    const E902 = unlocked("epoch-902", { governs_from: AFTER_FRONTIER });
    const frozenPrev = policyOver([E901, E902], false);
    const cases: Array<[string, any, RegExp]> = [
      ["edit", (() => {
        const c = policyOver([E901, E902], false);
        c.admission_history[0].lease_duration_minutes = 2880;
        return c;
      })(), /canonical content changed/],
      ["delete", policyOver([E901], false), /may not be deleted; history is append-only/],
      ["reorder", policyOver([E902, E901], false), /may not be reordered, replaced, or preceded by an insertion/],
    ];
    for (const [label, candidate, pattern] of cases) {
      const out = validatePolicyTransition(frozenPrev, candidate, ctx());
      expect(out.ok, label).toBe(false);
      expect(errorsOf(out), label).toMatch(pattern);
    }
  });

  it("the runtime accepted-epoch lock remains independent and unchanged in purpose", () => {
    // An epoch appended onto the REAL history with a perfectly prospective
    // boundary and sound evidence is STILL refused until its lock entry exists.
    const candidate = committed();
    candidate.enabled = false;
    candidate.admission_history.push(realAppend(AFTER_FRONTIER));
    for (const f of ADMISSION_FIELDS) candidate[f] = structuredClone(candidate.admission_history[1][f]);
    const previous = policyOver([committedEpoch()], false);
    const out = validatePolicyTransition(previous, candidate, ctx());
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/accepted epoch lock\(s\)/);
    // ...and not because of the freeze or the frontier, both of which are sound.
    expect(errorsOf(out)).not.toMatch(/ALREADY FROZEN|not strictly after|context\.frontier/);
  });
});

// =============================================================================
// T6 — the Codex counterexample, reproduced and then refused.
// =============================================================================
describe("T6 — a backdated append over comment 5257177236", () => {
  it("the transition is REFUSED, and prospectivity is the ONLY reason", () => {
    const previous = policyOver([unlocked("epoch-901")], false);
    const candidate = policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: BACKDATED, lease_duration_minutes: 2880 })],
      false,
    );
    // Both policies are structurally VALID and the runtime lock is silent: the
    // frontier constraint is the only thing standing in the way.
    expect(validatePolicy(previous).ok).toBe(true);
    expect(validatePolicy(candidate).ok).toBe(true);
    const out = validatePolicyTransition(previous, candidate, ctx());
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.errors).toHaveLength(1);
      expect(out.errors[0]).toMatch(/epoch-902\)\.governs_from: "2026-08-11T18:24:00Z" is not strictly after the durable event frontier 2026-08-13T04:55:42Z/);
      expect(out.errors[0]).toMatch(/the array is still append-only and the runtime lock still holds, yet history changes/);
    }
  });

  it("the same backdating onto the REAL accepted history is refused too", () => {
    const candidate = committed();
    candidate.enabled = false;
    candidate.admission_history.push(realAppend(BACKDATED, { lease_duration_minutes: 2880 }));
    for (const f of ADMISSION_FIELDS) candidate[f] = structuredClone(candidate.admission_history[1][f]);
    const out = validatePolicyTransition(policyOver([committedEpoch()], false), candidate, ctx());
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/not strictly after the durable event frontier/);
  });

  it("the consequence it prevents is real: the backdated epoch rewrites lane #122", () => {
    // Replayed with the kill switch on, so this measures ADMISSION alone.
    const oneEpoch = policyOver([unlocked("epoch-901")], true);
    const backdated = policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: BACKDATED, lease_duration_minutes: 2880 })],
      true,
    );

    // The single unlocked epoch is admission-equivalent to the committed policy:
    // same values, different id and provenance. This is what licenses using
    // unlocked ids for every replay comparison in this file.
    const asCommitted = replay(122, committed());
    const asUnlocked = replay(122, oneEpoch);
    expect(asUnlocked.dispositions).toEqual(asCommitted.dispositions);
    expect([asUnlocked.state, asUnlocked.event_sequence, asUnlocked.applied, asUnlocked.refused])
      .toEqual(["ready-for-claude", 121, 121, 3]);
    expect(dispositionOf(asUnlocked, 5257177236)).toMatchObject({
      status: "refused", refusal: "lease-expiry-unbounded",
    });
    expect(dispositionOf(asUnlocked, 5257177236)!.detail).toMatch(/exceeds observed grant \+ 240m/);
    expect(dispositionOf(asUnlocked, 5257220713)).toMatchObject({ status: "applied" });

    // Under the backdated epoch the refused lease claim is ACCEPTED, the
    // correction that followed it becomes a stale sequence, and the lane's final
    // state moves backwards by twelve events.
    const rewritten = replay(122, backdated);
    expect([rewritten.state, rewritten.event_sequence, rewritten.applied, rewritten.refused])
      .toEqual(["codex-working", 109, 109, 15]);
    expect(dispositionOf(rewritten, 5257177236)).toMatchObject({ status: "applied" });
    expect(dispositionOf(rewritten, 5257220713)).toMatchObject({ status: "refused", refusal: "stale-sequence" });
  });

  it("the guard refuses BEFORE any replay could reinterpret anything", () => {
    // The refusal is a property of the CHANGE, not of a later observation: it
    // needs no lane, no comments, and no reducer run.
    const lib = readFileSync(TRANSITION_LIB, "utf8")
      .split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(lib).not.toMatch(/reconstructLane|reduce\(|dispositions/);
  });
});

// =============================================================================
// T7 / T8 — a prospective boundary is accepted and changes nothing historical.
// =============================================================================
describe("T7/T8 — a boundary after the complete frontier is accepted and inert", () => {
  const PROSPECTIVE = { governs_from: AFTER_FRONTIER, lease_duration_minutes: 2880 };

  it("T7: the transition guard accepts it", () => {
    const out = validatePolicyTransition(
      policyOver([unlocked("epoch-901")], false),
      policyOver([unlocked("epoch-901"), unlocked("epoch-902", PROSPECTIVE)], false),
      ctx(),
    );
    expect(out.ok, errorsOf(out)).toBe(true);
    if (out.ok) expect(out.appended).toEqual(["epoch-902"]);
  });

  it("T8: every historical disposition of #118, #120 and #122 is unchanged under it", () => {
    const one = policyOver([unlocked("epoch-901")], true);
    const two = policyOver([unlocked("epoch-901"), unlocked("epoch-902", PROSPECTIVE)], true);
    const expected: Record<number, [string, number, number, number]> = {
      118: ["ready-for-merge", 12, 12, 2],
      120: ["merged", 11, 11, 3],
      122: ["ready-for-claude", 121, 121, 3],
    };
    for (const issue of [118, 120, 122]) {
      const before = replay(issue, one);
      const after = replay(issue, two);
      expect(after.dispositions, `#${issue} dispositions`).toEqual(before.dispositions);
      expect([after.state, after.event_sequence, after.applied, after.refused], `#${issue} summary`)
        .toEqual(expected[issue]);
      // ...and identical to the committed policy's own replay.
      expect(before.dispositions, `#${issue} vs committed`).toEqual(replay(issue, committed()).dispositions);
    }
    // The specific event the whole epoch mechanism exists for.
    const lane122 = replay(122, two);
    expect(dispositionOf(lane122, 5257177236)).toMatchObject({
      status: "refused", refusal: "lease-expiry-unbounded",
    });
    expect(dispositionOf(lane122, 5257177236)!.detail).toMatch(/240m/);
    expect(dispositionOf(lane122, 5257177236)!.detail).not.toMatch(/2880/);
  });
});

// =============================================================================
// The FUTURE 48-hour lease change, SIMULATED ONLY. Nothing here is committed.
// =============================================================================
describe("the 48-hour lease change as a four-transition procedure (simulation)", () => {
  // STATE A is the real committed policy: epoch-001, lease 240, enabled true.
  // STATE B freezes it. STATE C appends a 2880-minute epoch beyond the frontier.
  // STATE D re-enables. Each arrow is its own reviewed, merged transition.
  const stateA = () => committed();
  const stateB = () => policyOver([committedEpoch()], false);
  const stateC = () => {
    const c = stateB();
    c.admission_history.push(realAppend(AFTER_FRONTIER, { lease_duration_minutes: 2880 }));
    for (const f of ADMISSION_FIELDS) c[f] = structuredClone(c.admission_history[1][f]);
    return c;
  };
  const stateD = () => {
    const d = stateC();
    d.enabled = true;
    return d;
  };

  it("STATE A is what is actually committed: epoch-001, lease 240, automation enabled", () => {
    const a = stateA();
    expect(a.enabled).toBe(true);
    expect(a.lease_duration_minutes).toBe(240);
    expect(a.admission_history).toHaveLength(1);
    expect(a.admission_history[0].epoch_id).toBe("epoch-001");
    expect(admissionEpochDigest(a.admission_history[0]))
      .toBe("sha256:0b0e84ea6ff3c60b71770785954cc99cfdf85c26e2ce2f9bec3380b943a1f5cc");
  });

  it("A → B (freeze) is accepted with no evidence; B → C (append) needs the hypothetical lock", () => {
    const ab = validatePolicyTransition(stateA(), stateB());
    expect(ab.ok, errorsOf(ab)).toBe(true);
    if (ab.ok) expect(ab.kind).toBe("v2-live");

    // Against the REAL build, STATE C fails the runtime lock: this build has
    // accepted exactly one epoch. That is correct — a real 48-hour change would
    // append its lock entry in the same reviewed protocol-code diff.
    const bc = validatePolicyTransition(stateB(), stateC(), ctx());
    expect(bc.ok).toBe(false);
    expect(errorsOf(bc)).toMatch(/accepted epoch lock\(s\)/);
  });

  it("with the hypothetical epoch-002 lock staged, B → C and C → D are accepted end-to-end", () => {
    const digest = admissionEpochDigest(stateC().admission_history[1]);
    const sl = stageStraylight([{
      file: "lib/admission-locks.mjs",
      from: "  }),\n]);",
      to: `  }),\n  Object.freeze({ epoch_id: "epoch-002", digest: ${JSON.stringify(digest)} }),\n]);`,
    }]);

    const bc = runCheck(sl, stateB(), stateC(), ctx());
    expect(bc.status, JSON.stringify(bc.out)).toBe(0);
    expect(bc.out.kind).toBe("v2-append");
    expect(bc.out.appended).toEqual(["epoch-002"]);
    expect(bc.out.frontier).toMatchObject({
      repository: REPO, lanes: 3, events: 152,
      max_event_created_at: FRONTIER_MAX, appended_governs_from: AFTER_FRONTIER,
    });
    expect(bc.out.candidate_current_admission.lease_duration_minutes).toBe(2880);
    expect(bc.out.previous_current_admission.lease_duration_minutes).toBe(240);

    // C → D re-enables automation and touches nothing else.
    const cd = runCheck(sl, stateC(), stateD());
    expect(cd.status, JSON.stringify(cd.out)).toBe(0);
    expect(cd.out.kind).toBe("v2-live");
    expect(cd.out.appended).toEqual([]);
    expect(cd.out.frontier).toBeNull();

    // The one-transition shortcut stays refused even with the lock in place.
    const shortcut = stateC();
    const ac = runCheck(sl, stateA(), shortcut, ctx());
    expect(ac.status).toBe(2);
    expect(JSON.stringify(ac.out.errors)).toMatch(/ALREADY FROZEN/);
  });

  it("under STATE C, history still resolves epoch-001 — 5257177236 stays refused under 240", () => {
    // Replayed over unlocked ids (admission-equivalent, proven above) so the
    // simulation does not need the hypothetical lock in-process.
    const synthC = policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER, lease_duration_minutes: 2880 })],
      false,
    );
    const frozenReplay = replay(122, synthC);
    const live = replay(122, policyOver([unlocked("epoch-901")], true));
    expect(frozenReplay.dispositions).toEqual(live.dispositions);
    expect([frozenReplay.state, frozenReplay.event_sequence]).toEqual(["ready-for-claude", 121]);
    // The kill switch is reported, and reported honestly, without rewinding.
    expect(frozenReplay.frozen).toBe(true);
    expect(live.frozen).toBe(false);
    expect(dispositionOf(frozenReplay, 5257177236)!.detail).toMatch(/grant \+ 240m/);
  });

  it("under STATE C, an event AFTER the boundary is judged by the 2880-minute epoch", () => {
    const synthC = policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER, lease_duration_minutes: 2880 })],
      true,
    );
    expect(validatePolicy(synthC).ok).toBe(true);
    expect(synthC.lease_duration_minutes).toBe(2880);

    const acquire = (observedAt: string, expiresAt: string) =>
      reduce(
        makeLane({ state: "ready-for-claude", event_sequence: 2 }),
        makeEvent({
          sequence: 3, actor_role: "implementer", github_actor: "eileen1337",
          event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
          lease_id: "lease-claude-1", lease_expires_at: expiresAt,
        }),
        synthC,
        { event_observed_at: observedAt, comment_author: "eileen1337", task_packet: makeTaskPacket() } as any,
      );

    // Observed inside epoch-902: 2880 minutes exactly is admissible…
    const at2880 = acquire("2026-08-14T00:00:00Z", "2026-08-16T00:00:00Z");
    expect(at2880.ok, (at2880 as any).detail).toBe(true);
    // …one minute more is not.
    const beyond = acquire("2026-08-14T00:00:00Z", "2026-08-16T00:01:00Z");
    expect(beyond.ok).toBe(false);
    if (!beyond.ok) {
      expect(beyond.refusal).toBe("lease-expiry-unbounded");
      expect(beyond.detail).toMatch(/grant \+ 2880m/);
    }
    // The SAME 48-hour claim observed BEFORE the boundary is still bounded by 240.
    const historical = acquire("2026-08-01T00:00:00Z", "2026-08-03T00:00:00Z");
    expect(historical.ok).toBe(false);
    if (!historical.ok) {
      expect(historical.refusal).toBe("lease-expiry-unbounded");
      expect(historical.detail).toMatch(/grant \+ 240m/);
      expect(historical.detail).not.toMatch(/2880/);
    }
  });

  it("the committed policy is NOT changed by any of this", () => {
    const p = committed();
    expect(p.enabled).toBe(true);
    expect(p.lease_duration_minutes).toBe(240);
    expect(p.admission_history).toHaveLength(1);
    expect(JSON.stringify(p)).not.toMatch(/2880|epoch-002/);
    expect(readFileSync(".straylight/lib/admission-locks.mjs", "utf8")).not.toMatch(/epoch-002/);
  });
});

// =============================================================================
// The H-01 constraint is LOAD-BEARING: remove it and the defect comes back.
// =============================================================================
describe("H-01 mutation harness — each part of the cutover is proven necessary", () => {
  const previous = () => policyOver([unlocked("epoch-901")], false);
  const backdatedCandidate = () =>
    policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: BACKDATED, lease_duration_minutes: 2880 })],
      false,
    );
  const prospectiveCandidate = (enabled = false) =>
    policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER, lease_duration_minutes: 2880 })],
      enabled,
    );

  // The mutations, and for each one the candidate it must wrongly accept.
  const MUTANTS: Array<{
    label: string;
    mutations: Mutation[];
    previous: () => any;
    candidate: () => any;
    /** Whether the operator supplies real frontier evidence with this attempt. */
    evidence: "real-frontier" | "none";
    realRefusal: RegExp;
  }> = [
    {
      label: "M1 — drop the prospectivity comparison",
      mutations: [{
        file: "lib/policy-transition.mjs",
        from: "      if (boundary > bound.max_millis) return;",
        to: "      if (true) return;",
      }],
      previous,
      candidate: backdatedCandidate,
      evidence: "real-frontier",
      realRefusal: /not strictly after the durable event frontier/,
    },
    {
      label: "M2 — drop the prior-freeze requirement",
      mutations: [{
        file: "lib/policy-transition.mjs",
        from: "  if (previous.enabled !== false) {",
        to: "  if (false) {",
      }],
      previous: () => policyOver([unlocked("epoch-901")], true),
      candidate: () => prospectiveCandidate(false),
      evidence: "real-frontier",
      realRefusal: /ALREADY FROZEN/,
    },
    {
      label: "M3 — revert the whole cutover gate to the pre-patch behaviour",
      mutations: [{
        file: "lib/policy-transition.mjs",
        from: "      const gate = appendGateErrors(previous, candidate, context, prevHistory.length);",
        to: "      const gate = { errors: [], bound: null };",
      }],
      previous: () => policyOver([unlocked("epoch-901")], true),
      candidate: backdatedCandidate,
      evidence: "none", // no evidence at all: exactly the pre-patch H-01 shape
      realRefusal: /ALREADY FROZEN|required for an admission append/,
    },
  ];

  const evidenceFor = (m: { evidence: "real-frontier" | "none" }) =>
    m.evidence === "real-frontier" ? ctx() : null;

  it("the unmutated staged build refuses every one of these candidates", () => {
    const sl = stageStraylight();
    for (const m of MUTANTS) {
      const run = runCheck(sl, m.previous(), m.candidate(), evidenceFor(m));
      expect(run.status, m.label).toBe(2);
      expect(run.out.refusal, m.label).toBe("transition-forbidden");
      expect(JSON.stringify(run.out.errors), m.label).toMatch(m.realRefusal);
    }
  });

  it("each mutated build ACCEPTS what the real build refuses", () => {
    for (const m of MUTANTS) {
      const sl = stageStraylight(m.mutations);
      const run = runCheck(sl, m.previous(), m.candidate(), evidenceFor(m));
      expect(run.status, `${m.label}: mutant must accept, output ${JSON.stringify(run.out)}`).toBe(0);
      expect(run.out.ok, m.label).toBe(true);
      expect(run.out.appended, m.label).toEqual(["epoch-902"]);
    }
  });

  it("M1 is precisely the H-01 defect: the mutant accepts a candidate that rewrites lane #122", () => {
    const sl = stageStraylight(MUTANTS.find((m) => m.label.startsWith("M1 "))!.mutations);
    const accepted = runCheck(sl, previous(), backdatedCandidate(), ctx());
    expect(accepted.status).toBe(0);
    // And that accepted candidate is exactly the one proven above to move lane
    // #122 from ready-for-claude@121 to codex-working@109.
    const rewritten = replay(122, policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: BACKDATED, lease_duration_minutes: 2880 })],
      true,
    ));
    expect([rewritten.state, rewritten.event_sequence]).toEqual(["codex-working", 109]);
    // The real build refuses it.
    expect(runCheck(stageStraylight(), previous(), backdatedCandidate(), ctx()).status).toBe(2);
  });
});

// =============================================================================
// The capture utility is read-only and reuses the established discovery path.
// =============================================================================
describe("the frontier capture utility", () => {
  const source = () => readFileSync(CAPTURE_SCRIPT, "utf8");
  const code = () => source().split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");

  it("performs GET operations only — no write verb, no mutation endpoint", () => {
    const c = code();
    expect(c).toMatch(/execFileSync\("gh", \["api", "--paginate", path\]/);
    expect(c).not.toMatch(/--method|-X\b|-f\b|"POST"|"PATCH"|"PUT"|"DELETE"/);
    expect(c).not.toMatch(/gh pr |gh issue |gh label|--add-label|--remove-label|--merge/);
  });

  it("discovers lanes through the canonical marker parser, not the label", () => {
    const c = code();
    expect(c).toMatch(/scanLanes/);
    expect(c).toMatch(/parseIssuePages/);
    expect(c).toMatch(/parseCommentPages/);
    // Dual enumeration, unioned: the label is a cross-check, never authority.
    expect(c).toMatch(/state=all&per_page=100"/);
    expect(c).toMatch(/labels=cp-lane/);
    expect(c).toMatch(/--paginate/);
    // Fails closed on ambiguity rather than omitting material.
    expect(c).toMatch(/scan\.unreadable\.length > 0/);
    expect(c).toMatch(/scan\.duplicates\.length > 0/);
  });

  it("validates its own output before emitting it", () => {
    expect(code()).toMatch(/buildDurableFrontier/);
    expect(code()).toMatch(/frontier refused by its own validator/);
  });

  it("emits deterministic JSON: lanes sorted by issue number", () => {
    const shuffled = [...capturedLanes()].reverse();
    const built = frontierFromCapture({ repository: REPO, captured_at: CAPTURED_AT, lanes: shuffled });
    expect(built.ok).toBe(true);
    if (built.ok) {
      expect(built.frontier.lanes.map((l: any) => l.issue_number)).toEqual([118, 120, 122]);
      expect(payloadDigest(built.frontier)).toBe(DERIVED_FRONTIER_DIGEST);
    }
  });

  it("importing it fetches nothing (the CLI runs only when invoked directly)", () => {
    expect(code()).toMatch(/if \(invokedDirectly\(\)\) main\(\);/);
  });
});
