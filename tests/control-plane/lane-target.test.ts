// Control Plane v1 — universal lane-target authority (lane-target.mjs).
//
// N3: every lane-addressed write requires a same-execution proof that its
// lane_id maps to exactly one issue. C1: duplicate valid lane IDs refuse
// for EVERY writer, bootstrap included. Unreadable marker-bearing bodies
// block both targeting and absence proofs (an unreadable genesis could BE
// the lane in mangled form).

import { describe, it, expect } from "vitest";
import {
  scanLanes,
  assertUniqueLaneTarget,
  assertLaneAbsent,
  LANE_ID_RE,
} from "../../.straylight/lib/lane-target.mjs";
import { makeLane } from "./_fixtures.js";

function laneBody(overrides: Record<string, any> = {}) {
  return `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane(overrides))}\n\`\`\``;
}

const issue = (number: number, body: string | null) => ({ number, body });

describe("scanLanes — canonical genesis identification", () => {
  it("finds compact and pretty genesis bodies alike; prose and other markers are clean misses", () => {
    const pretty = `# heading\n\n<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify(makeLane(), null, 2)}\n\`\`\``;
    const r = scanLanes([
      issue(1, laneBody()),
      issue(2, pretty),
      issue(3, "prose mentioning lane-phase-49p only"),
      issue(4, null),
    ]);
    expect(r).toMatchObject({ ok: true, unreadable: [] });
    expect((r as any).lanes.map((l: any) => l.number)).toEqual([1, 2]);
    expect((r as any).duplicates).toEqual([{ lane_id: "lane-phase-49p", numbers: [1, 2] }]);
  });

  it("marker-bearing but unparseable bodies are unreadable, never skipped", () => {
    const r = scanLanes([
      issue(9, "<!-- straylight:lane:v1 -->\n```json\n{ not json ]\n```"),
      issue(10, `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify({ lane_id: 42 })}\n\`\`\``),
      issue(11, `<!-- straylight:lane:v1 -->\n\`\`\`json\n${JSON.stringify({ lane_id: "lane-phase-49p " })}\n\`\`\``),
    ]);
    expect((r as any).unreadable).toEqual([
      { number: 9, reason: "malformed-json" },
      { number: 10, reason: "lane-id-missing" },
      { number: 11, reason: "lane-id-malformed" },
    ]);
    expect((r as any).lanes).toEqual([]);
  });

  it("structurally unusable input refuses (fail closed, never zero lanes)", () => {
    expect(scanLanes("nope" as any)).toMatchObject({ ok: false, reason: "issues-not-array" });
    expect(scanLanes([null as any])).toMatchObject({ ok: false, reason: "issue-entry-not-object" });
    expect(scanLanes([{ body: laneBody() } as any])).toMatchObject({ ok: false, reason: "issue-number-invalid" });
  });
});

describe("assertUniqueLaneTarget — the proof every lane-addressed write requires", () => {
  const world = [
    issue(41, laneBody()),
    issue(42, laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" })),
    issue(43, "prose"),
  ];

  it("a unique lane resolves to its issue number", () => {
    expect(assertUniqueLaneTarget(world, "lane-phase-49p")).toEqual({ ok: true, issue_number: 41 });
  });

  it("duplicate valid lane IDs refuse — the C1 ambiguity", () => {
    const dupWorld = [...world, issue(44, laneBody())];
    const r = assertUniqueLaneTarget(dupWorld, "lane-phase-49p");
    expect(r).toMatchObject({ ok: false, reason: "duplicate-lane-id", numbers: [41, 44] });
  });

  it("a missing lane refuses (lane-not-found), never guesses", () => {
    expect(assertUniqueLaneTarget(world, "lane-phase-50a")).toMatchObject({
      ok: false,
      reason: "lane-not-found",
    });
  });

  it("expected_issue binding: the unique lane must live on the expected issue", () => {
    expect(assertUniqueLaneTarget(world, "lane-phase-49p", { expected_issue: 41 })).toEqual({
      ok: true,
      issue_number: 41,
    });
    expect(assertUniqueLaneTarget(world, "lane-phase-49p", { expected_issue: 99 })).toMatchObject({
      ok: false,
      reason: "lane-issue-mismatch",
    });
  });

  it("ANY unreadable marker-bearing body blocks the proof — it could BE this lane", () => {
    const withMangled = [...world, issue(50, "<!-- straylight:lane:v1 -->\n```json\n{ bad ]\n```")];
    const r = assertUniqueLaneTarget(withMangled, "lane-phase-49p");
    expect(r).toMatchObject({ ok: false, reason: "lane-target-unreadable", numbers: [50] });
  });

  it("a malformed requested lane_id refuses before scanning", () => {
    for (const badId of ["", "lane-phase-49p ", "LANE-PHASE", "phase-49p", "lane-a\tb"]) {
      expect(assertUniqueLaneTarget(world, badId)).toMatchObject({ ok: false, reason: "lane-id-malformed" });
      expect(LANE_ID_RE.test(badId)).toBe(false);
    }
  });
});

describe("assertLaneAbsent — the bootstrap precondition", () => {
  it("a truly absent lane proves absent", () => {
    const r = assertLaneAbsent([issue(1, "prose")], "lane-phase-49p");
    expect(r).toEqual({ ok: true, absent: true });
  });

  it("an existing unique lane reports absent:false with its issue (valid no-op)", () => {
    const r = assertLaneAbsent([issue(41, laneBody())], "lane-phase-49p");
    expect(r).toEqual({ ok: true, absent: false, numbers: [41] });
  });

  it("duplicates ANYWHERE (even of another lane) refuse absence — the enumeration is not trustworthy", () => {
    const r = assertLaneAbsent(
      [
        issue(1, laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" })),
        issue(2, laneBody({ lane_id: "lane-phase-49q", phase: "phase-49q" })),
      ],
      "lane-phase-49p",
    );
    expect(r).toMatchObject({ ok: false, reason: "duplicate-lane-id" });
  });

  it("an unreadable marker-bearing body refuses absence — it could BE the lane in mangled form", () => {
    const r = assertLaneAbsent(
      [issue(9, "<!-- straylight:lane:v1 -->\n```json\n{ mangled ]\n```")],
      "lane-phase-49p",
    );
    expect(r).toMatchObject({ ok: false, reason: "lane-target-unreadable" });
  });
});
