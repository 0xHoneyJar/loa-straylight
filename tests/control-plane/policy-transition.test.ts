// Control Plane v2 — APPEND-ONLY POLICY TRANSITION GUARD.
//
// The second of two INDEPENDENT protections over historical admission policy.
//
//   The runtime lock (admission-locks.mjs, proven in admission-epochs.test.ts)
//   answers "is the policy the protocol is about to run the accepted history?"
//   It compares the policy against digests pinned in executable protocol code.
//
//   This guard answers a different question: "is this CHANGE to the policy an
//   append?" It takes the PREVIOUS COMMITTED policy as its baseline and never
//   consults the lock table, so it cannot be satisfied by editing the table.
//
// Independence is the whole point, and this file proves it in both directions:
// an edit that keeps the runtime lock perfectly happy (a history of unlocked
// epochs — the lock is silent by construction) is still refused here, and an
// edit accompanied by a hypothetically recomputed lock is still refused here for
// a reason that is not a lock error at all.
//
// The migration itself is also proven value-preserving: the genesis epoch
// transcribes the four v1 admission fields as committed at main
// 5625c5be425c71fce90a22e81d123b42ed104538 — corridor unchanged, allowlist
// unchanged, maximum_patch_cycles 3, lease_duration_minutes 240 — and a
// candidate that silently changes any of them is refused.

import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canonicalize, payloadDigest } from "../../.straylight/lib/canonical.mjs";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { validatePolicy, ADMISSION_FIELDS, ACTOR_ROLES } from "../../.straylight/lib/validate.mjs";
import { admissionEpochDigest } from "../../.straylight/lib/admission-locks.mjs";
import {
  validatePolicyTransition, POLICY_SCHEMA_V1, POLICY_SCHEMA_V2,
} from "../../.straylight/lib/policy-transition.mjs";
import { makePolicy, makeEpoch } from "./_fixtures.js";

const CHECK = ".straylight/bin/policy-transition-check.mjs";
const TRANSITION_LIB = ".straylight/lib/policy-transition.mjs";
const COMMITTED_PATH = ".straylight/automation-policy.json";

// The v1 policy as committed at the base of this change. Committed as a fixture
// so the migration proof is deterministic in a shallow CI checkout; its bytes
// are pinned below AND compared against the real git blob whenever the history
// is present.
const V1_FIXTURE_PATH = "tests/control-plane/fixtures/policy/automation-policy.v1.json";
const V1_FIXTURE_SHA256 = "e57db658986f991c0d65d4e69220183c4869f6ace176bf917ad0b51eb34f5bed";
// Second, independent lock over the same evidence, matching the lane-fixture
// mechanism: the digest of the CANONICALIZED PARSED policy. The byte lock binds
// the file; this one binds its MEANING, so a reformat that preserves neither the
// bytes nor the values cannot be mistaken for a whitespace change.
const V1_FIXTURE_CANONICAL = "sha256:4e48dba1c6722da9569d7c5cb9f6da51b8a18aa2e4adc96b7f183be7516b9916";
const SOURCE_MAIN_SHA = "5625c5be425c71fce90a22e81d123b42ed104538";

function bytesSha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parsed(path: string): any {
  const out = parseStrict(readFileSync(path, "utf8"));
  expect(out.ok, `${path} must parse strictly`).toBe(true);
  return structuredClone((out as any).value);
}

// The ONE reader for the v1 evidence. Both locks are verified BEFORE the value is
// handed out, so no proof in this file can rest on a fixture that drifted.
function v1(): any {
  expect(bytesSha256(V1_FIXTURE_PATH), `${V1_FIXTURE_PATH} bytes changed`).toBe(V1_FIXTURE_SHA256);
  const value = parsed(V1_FIXTURE_PATH);
  expect(payloadDigest(value), `${V1_FIXTURE_PATH} canonical content changed`).toBe(V1_FIXTURE_CANONICAL);
  return value;
}
const committed = () => parsed(COMMITTED_PATH);

// A v2 policy over an arbitrary epoch history, with the required top-level
// projection derived from the final epoch (validatePolicy demands equality).
function v2With(epochs: any[]): any {
  const final = epochs[epochs.length - 1];
  const policy = makePolicy({ admission_history: structuredClone(epochs) });
  for (const field of ADMISSION_FIELDS) policy[field] = structuredClone(final[field]);
  return policy;
}

// Fixture epochs. Their ids are deliberately NOT accepted ids, so the runtime
// lock is silent for every history built from them — which is exactly the
// condition under which this guard has to work alone.
const E899 = makeEpoch({ epoch_id: "epoch-899", governs_from: "2026-06-01T00:00:00Z" });
const E900 = makeEpoch({ epoch_id: "epoch-900", governs_from: "2026-07-01T00:00:00Z" });
const E901 = makeEpoch({ epoch_id: "epoch-901", governs_from: "2026-08-01T00:00:00Z", lease_duration_minutes: 300 });

const errorsOf = (r: ReturnType<typeof validatePolicyTransition>) => (r.ok ? [] : r.errors).join("; ");

// An APPEND additionally requires the frozen frontier cutover: both sides
// already disabled, and evidence of where the durable event stream ended. Those
// rules have their own suite (frozen-frontier-transition.test.ts); here they are
// satisfied minimally so that the PREFIX rules below are proven in isolation.
const frozen = (p: any): any => {
  p.enabled = false;
  return p;
};
// The frozen main the evidence is bound to (Codex H-02). Synthetic, and named
// separately in the context: the append is authorized against a revision the
// OPERATOR types, never one inferred from whatever the capture happened to see.
const FIXTURE_FROZEN_SHA = "3f1c8b7a24d59e06b1a4c7d8e9f0123456789abc";
const FIXTURE_FRONTIER = Object.freeze({
  schema: "straylight.durable-event-frontier.v1",
  repository: "0xHoneyJar/loa-straylight",
  frozen_main_sha: FIXTURE_FROZEN_SHA,
  captured_at: "2026-07-15T00:00:00Z",
  quiescence_checked_at: "2026-07-14T23:00:00Z",
  write_capable_workflows: [
    ".github/workflows/straylight-bootstrap.yml",
    ".github/workflows/straylight-merge-guard.yml",
    ".github/workflows/straylight-reducer.yml",
    ".github/workflows/straylight-watchdog.yml",
  ],
  active_write_runs: [],
  lanes: [{
    issue_number: 1,
    lane_id: "lane-fixture",
    last_event_comment_id: 1,
    last_event_created_at: "2026-07-14T00:00:00Z",
    event_count: 1,
  }],
  max_event_created_at: "2026-07-14T00:00:00Z",
});
const CTX = Object.freeze({
  repository: "0xHoneyJar/loa-straylight",
  expected_frozen_main_sha: FIXTURE_FROZEN_SHA,
  frontier: FIXTURE_FRONTIER,
});

// =============================================================================
// The evidence the migration proof rests on.
// =============================================================================
describe("the previous committed v1 policy, pinned as evidence", () => {
  it("the fixture's bytes AND its canonical content match their pinned digests", () => {
    expect(bytesSha256(V1_FIXTURE_PATH)).toBe(V1_FIXTURE_SHA256);
    expect(payloadDigest(parsed(V1_FIXTURE_PATH))).toBe(V1_FIXTURE_CANONICAL);
  });

  it("the fixture is byte-identical to the v1 policy committed at the base main SHA", () => {
    // Skipped only where the object is genuinely absent (shallow checkout); the
    // digest pin above still binds the fixture in that case.
    let blob: Buffer;
    try {
      blob = execFileSync("git", ["cat-file", "blob", `${SOURCE_MAIN_SHA}:.straylight/automation-policy.json`], {
        maxBuffer: 4 * 1024 * 1024,
      });
    } catch {
      return;
    }
    expect(createHash("sha256").update(blob).digest("hex")).toBe(V1_FIXTURE_SHA256);
  });

  it("it really is a v1 policy, and it is NOT a valid v2 policy", () => {
    expect(v1().schema).toBe(POLICY_SCHEMA_V1);
    expect(v1().admission_history).toBeUndefined();
    expect(validatePolicy(v1()).ok).toBe(false);
    expect(committed().schema).toBe(POLICY_SCHEMA_V2);
  });

  it("its four admission fields are the values the control plane actually shipped", () => {
    const p = v1();
    expect(p.maximum_patch_cycles).toBe(3);
    expect(p.lease_duration_minutes).toBe(240);
    expect(p.authorized_corridor).toEqual(["phase-49p", "phase-49q", "phase-50a", "phase-50b"]);
    expect(Object.keys(p.actor_allowlist).sort()).toEqual(["_note", ...ACTOR_ROLES].sort());
  });
});

// =============================================================================
// B1 — the real v1 → v2 migration is an exact transcription.
// =============================================================================
describe("B1 — v1 → v2: the genesis epoch transcribes v1 without deciding anything new", () => {
  it("the committed migration is accepted, appending exactly one genesis epoch", () => {
    const out = validatePolicyTransition(v1(), committed());
    expect(out.ok, errorsOf(out)).toBe(true);
    if (out.ok) {
      expect(out.kind).toBe("v1-to-v2");
      expect(out.previous_epochs).toBe(0);
      expect(out.candidate_epochs).toBe(1);
      expect(out.appended).toEqual(["epoch-001"]);
    }
  });

  it("each of the four fields is canonically identical across the migration", () => {
    const before = v1();
    const genesis = committed().admission_history[0];
    for (const field of ADMISSION_FIELDS) {
      if (field === "actor_allowlist") continue; // v1 carried a doc key; compared by role below
      expect(canonicalize(genesis[field]), field).toBe(canonicalize(before[field]));
    }
    for (const role of ACTOR_ROLES) {
      expect(canonicalize(genesis.actor_allowlist[role]), role).toBe(canonicalize(before.actor_allowlist[role]));
    }
    // v1's explanatory `_note` inside actor_allowlist moved to a top-level
    // documentation key: a documentation move, not a policy change.
    expect(genesis.actor_allowlist._note).toBeUndefined();
    expect(committed()._actor_allowlist).toContain("GitHub commenter identity");
  });

  it("the top-level projection of the migrated policy equals the v1 values it replaces", () => {
    const before = v1();
    const after = committed();
    for (const field of ADMISSION_FIELDS) {
      if (field === "actor_allowlist") continue;
      expect(canonicalize(after[field]), field).toBe(canonicalize(before[field]));
    }
  });

  it("B2: a candidate that silently changes ANY transcribed value is refused", () => {
    const changes: Array<[string, (epoch: any) => void]> = [
      ["lease_duration_minutes", (e) => { e.lease_duration_minutes = 2880; }],
      ["maximum_patch_cycles", (e) => { e.maximum_patch_cycles = 4; }],
      ["authorized_corridor", (e) => { e.authorized_corridor = [...e.authorized_corridor, "phase-50c"]; }],
      ["actor_allowlist", (e) => { e.actor_allowlist.implementer = [...e.actor_allowlist.implementer, "someone-else"]; }],
      ["actor_allowlist", (e) => { e.actor_allowlist.auditor = ["someone-else"]; }],
    ];
    for (const [field, mutate] of changes) {
      const candidate = committed();
      mutate(candidate.admission_history[0]);
      for (const f of ADMISSION_FIELDS) candidate[f] = structuredClone(candidate.admission_history[0][f]);
      const out = validatePolicyTransition(v1(), candidate);
      expect(out.ok, field).toBe(false);
      expect(errorsOf(out), field).toMatch(/does not transcribe/);
      expect(errorsOf(out), field).toMatch(new RegExp(field));
      expect(errorsOf(out), field).toMatch(/value-preserving|does not transcribe/);
    }
  });

  it("a migration that introduces MORE than one genesis epoch is refused", () => {
    const candidate = committed();
    candidate.admission_history.push(makeEpoch({ epoch_id: "epoch-002", governs_from: "2026-09-01T00:00:00Z" }));
    const out = validatePolicyTransition(v1(), candidate);
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/exactly ONE genesis epoch/);
  });

  it("an unrecognized role key in the PREVIOUS v1 allowlist makes the migration unprovable", () => {
    const previous = v1();
    previous.actor_allowlist.reviewer = ["someone-else"];
    const out = validatePolicyTransition(previous, committed());
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/unrecognized v1 role key/);
    expect(errorsOf(out)).toMatch(/neither transcribed nor silently dropped/);
  });

  it("a v1 → v1 'migration' (no epochs at all) is refused: admission authority must not stay live", () => {
    const out = validatePolicyTransition(v1(), v1());
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(new RegExp(POLICY_SCHEMA_V2));
    expect(errorsOf(out)).toMatch(/mutable live fields/);
  });
});

// =============================================================================
// B3–B7 — v2 → v2 must be an append onto an untouched prefix.
// =============================================================================
describe("B3 — appending a new epoch is allowed", () => {
  it("appending one epoch onto an unlocked history is accepted", () => {
    const out = validatePolicyTransition(frozen(v2With([E900])), frozen(v2With([E900, E901])), CTX);
    expect(out.ok, errorsOf(out)).toBe(true);
    if (out.ok) {
      expect(out.kind).toBe("v2-append");
      expect(out.previous_epochs).toBe(1);
      expect(out.candidate_epochs).toBe(2);
      expect(out.appended).toEqual(["epoch-901"]);
      // The verdict carries the evidence it rested on, not a claim about it.
      expect(out.frontier).toEqual({
        repository: "0xHoneyJar/loa-straylight",
        frozen_main_sha: FIXTURE_FROZEN_SHA,
        captured_at: "2026-07-15T00:00:00Z",
        quiescence_checked_at: "2026-07-14T23:00:00Z",
        write_capable_workflows: [
          ".github/workflows/straylight-bootstrap.yml",
          ".github/workflows/straylight-merge-guard.yml",
          ".github/workflows/straylight-reducer.yml",
          ".github/workflows/straylight-watchdog.yml",
        ],
        lanes: 1,
        events: 1,
        max_event_created_at: "2026-07-14T00:00:00Z",
        appended_governs_from: "2026-08-01T00:00:00Z",
      });
    }
  });

  it("appending two at once is refused — one epoch per reviewed transition", () => {
    const two = validatePolicyTransition(
      frozen(v2With([E900])),
      frozen(v2With([E900, E901, makeEpoch({ epoch_id: "epoch-902", governs_from: "2026-09-01T00:00:00Z", lease_duration_minutes: 300 })])),
      CTX,
    );
    expect(two.ok).toBe(false);
    expect(errorsOf(two)).toMatch(/2 epochs appended in one transition \("epoch-901", "epoch-902"\)/);
    expect(errorsOf(two)).toMatch(/single authorizable fact/);
  });

  it("an unchanged admission history is a LIVE-only transition, not an append", () => {
    const same = validatePolicyTransition(committed(), committed());
    expect(same.ok, errorsOf(same)).toBe(true);
    if (same.ok) {
      expect(same.kind).toBe("v2-live");
      expect(same.appended).toEqual([]);
      // No admission decision moves, so no evidence is required or consulted.
      expect(same.frontier).toBeNull();
    }
  });

  it("LIVE fields may change freely — the kill switch would not be a kill switch otherwise", () => {
    for (const mutate of [
      (p: any) => { p.enabled = false; },
      (p: any) => { p.stuck_lane_threshold_hours = 96; },
      (p: any) => { p._kill_switch = "reworded documentation"; },
    ]) {
      const candidate = committed();
      mutate(candidate);
      const out = validatePolicyTransition(committed(), candidate);
      expect(out.ok, errorsOf(out)).toBe(true);
    }
  });

  it("appending onto the REAL accepted history additionally requires appending the lock entry", () => {
    // Both protections must be satisfied for a legitimate append: the candidate
    // has to be a policy the protocol would actually accept, and the previous
    // history has to survive as a prefix. Step 2 of the runbook in
    // admission-locks.mjs exists for exactly this.
    const candidate = frozen(committed());
    candidate.admission_history.push(makeEpoch({
      epoch_id: "epoch-002",
      governs_from: "2026-09-01T00:00:00Z",
      lease_duration_minutes: 300,
      provenance: { attributed_to: "test-fixture", reference: "hypothetical append with no lock entry" },
    }));
    for (const f of ADMISSION_FIELDS) candidate[f] = structuredClone(candidate.admission_history[1][f]);
    // Frozen on both sides with sound evidence, so the ONLY thing left to refuse
    // it is the missing lock entry.
    const out = validatePolicyTransition(frozen(committed()), candidate, CTX);
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/accepted epoch lock\(s\)/);
    expect(errorsOf(out)).not.toMatch(/ALREADY FROZEN|context\.frontier|strictly after/);
    expect(readFileSync(".straylight/lib/admission-locks.mjs", "utf8")).toMatch(/APPEND its lock entry below/);
  });
});

describe("B4–B7 — the accepted prefix is untouchable", () => {
  it("B4: editing a historical epoch's content is refused", () => {
    const edits: Array<[string, (e: any) => void]> = [
      ["lease_duration_minutes", (e) => { e.lease_duration_minutes = 2880; }],
      ["maximum_patch_cycles", (e) => { e.maximum_patch_cycles = 9; }],
      ["authorized_corridor", (e) => { e.authorized_corridor = ["phase-50c"]; }],
      ["actor_allowlist", (e) => { e.actor_allowlist.operator = ["someone-else"]; }],
      ["governs_from", (e) => { e.governs_from = "2026-01-01T00:00:00Z"; }],
      ["provenance", (e) => { e.provenance.attributed_to = "someone-else"; }],
      ["provenance.note", (e) => { e.provenance.note = "a different story about where this came from"; }],
    ];
    for (const [label, mutate] of edits) {
      const edited = structuredClone(E900);
      mutate(edited);
      const out = validatePolicyTransition(v2With([E900, E901]), v2With([edited, E901]));
      expect(out.ok, label).toBe(false);
      expect(errorsOf(out), label).toMatch(/canonical content changed — an accepted admission epoch was edited/);
      expect(errorsOf(out), label).toMatch(/APPEND a new epoch/);
    }
  });

  it("B4: the same edit to the REAL committed history is refused", () => {
    const candidate = committed();
    candidate.admission_history[0].lease_duration_minutes = 2880;
    for (const f of ADMISSION_FIELDS) candidate[f] = structuredClone(candidate.admission_history[0][f]);
    const out = validatePolicyTransition(committed(), candidate);
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/epoch-001.*canonical content changed|canonical content changed/);
  });

  it("B5: deleting an accepted epoch is refused", () => {
    const out = validatePolicyTransition(v2With([E900, E901]), v2With([E900]));
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/1 epoch\(s\) but the previous policy had 2/);
    expect(errorsOf(out)).toMatch(/may not be deleted; history is append-only/);

    // Deleting the earlier one and keeping the later is a deletion too — caught
    // as an index-0 identity change, not silently treated as an edit.
    const shifted = validatePolicyTransition(v2With([E900, E901]), v2With([E901]));
    expect(shifted.ok).toBe(false);
    expect(errorsOf(shifted)).toMatch(/may not be reordered, replaced, or preceded by an insertion/);
  });

  it("B6: reordering accepted epochs is refused", () => {
    const out = validatePolicyTransition(v2With([E900, E901]), v2With([E901, E900]));
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/"epoch-901" where the previous policy had "epoch-900"/);
    expect(errorsOf(out)).toMatch(/may not be reordered, replaced, or preceded by an insertion/);
  });

  it("B7: inserting an epoch INTO the accepted prefix is refused", () => {
    const out = validatePolicyTransition(frozen(v2With([E900, E901])), frozen(v2With([E899, E900, E901])), CTX);
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/preceded by an insertion/);
    // Length grew, so nothing about it looks like an append except the count.
    expect(errorsOf(out)).not.toMatch(/may not be deleted/);
  });

  it("replacing an accepted epoch with a differently-named one is refused", () => {
    const renamed = structuredClone(E900);
    renamed.epoch_id = "epoch-905";
    const out = validatePolicyTransition(v2With([E900]), v2With([renamed]));
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/may not be reordered, replaced/);
  });
});

// =============================================================================
// B8 / J8 — the two protections are independent.
// =============================================================================
describe("B8 — an edit that the runtime lock cannot see is still refused here", () => {
  it("the guard does not import, read, or depend on the lock table", () => {
    const src = readFileSync(TRANSITION_LIB, "utf8");
    // Comments blanked: the header DISCUSSES the runtime lock (and must, to
    // explain the independence), while the executable text may not touch it.
    const code = src.split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(src).toMatch(/independence is the point/i);
    expect(code).not.toMatch(/admission-locks/);
    expect(code).not.toMatch(/ACCEPTED_ADMISSION_EPOCH_LOCKS|acceptedEpochLockErrors|admissionEpochDigest/);
    // Its only inputs are its ARGUMENTS: no files, no clock, no lock table, and
    // no network — the frontier evidence is passed in, never fetched.
    expect(code).not.toMatch(/readFileSync|new Date|Date\.now|process\.env/);
    expect(code).not.toMatch(/execFileSync|spawn|fetch\(|https?:\/\//);
    const imports = [...code.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
    expect(imports.sort()).toEqual([
      "./canonical.mjs", "./durable-frontier.mjs", "./frozen-quiescence.mjs", "./validate.mjs",
    ]);
    // ...and the libraries it leans on are pure by the same standard. The
    // quiescence library is included deliberately: its evidence describes live
    // workflow runs, so the temptation to have IT do the looking is real. The
    // looking belongs to scripts/verify-frozen-quiescence.mjs; the library only
    // judges what the operator brings back.
    for (const lib of [".straylight/lib/durable-frontier.mjs", ".straylight/lib/frozen-quiescence.mjs"]) {
      const libSrc = readFileSync(lib, "utf8");
      const libCode = libSrc.split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
      expect(libCode, lib).not.toMatch(/readFileSync|new Date|Date\.now|process\.env|execFileSync|fetch\(/);
    }
    const frontierSrc = readFileSync(".straylight/lib/durable-frontier.mjs", "utf8");
    const frontierCode = frontierSrc.split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect([...frontierCode.matchAll(/from "([^"]+)"/g)].map((m) => m[1]).sort())
      .toEqual(["./frozen-quiescence.mjs", "./lane-target.mjs", "./validate.mjs"]);
  });

  it("J8: with the runtime lock silent (unlocked epochs), the edit is caught anyway", () => {
    // "The lock agrees" is exactly the condition here: neither side presents an
    // accepted epoch id, so validatePolicy — including the runtime binding —
    // passes on BOTH. The only thing standing between this edit and acceptance
    // is the transition guard.
    const edited = structuredClone(E900);
    edited.lease_duration_minutes = 2880;
    const before = v2With([E900]);
    const after = v2With([edited]);
    expect(validatePolicy(before).ok).toBe(true);
    expect(validatePolicy(after).ok).toBe(true);
    const out = validatePolicyTransition(before, after);
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/an accepted admission epoch was edited/);
  });

  it("J8: an old-epoch edit accompanied by a recomputed lock would STILL be refused here", () => {
    // Recomputing the lock entry can only remove lock errors. The refusal below
    // survives after every lock-flavoured error is discarded, so re-pinning the
    // digest in protocol code does not buy acceptance.
    const candidate = committed();
    candidate.admission_history[0].lease_duration_minutes = 2880;
    for (const f of ADMISSION_FIELDS) candidate[f] = structuredClone(candidate.admission_history[0][f]);
    // The digest a lock-repointing edit would compute:
    expect(admissionEpochDigest(candidate.admission_history[0]))
      .not.toBe(admissionEpochDigest(committed().admission_history[0]));

    const out = validatePolicyTransition(committed(), candidate);
    expect(out.ok).toBe(false);
    const nonLockErrors = (out as any).errors.filter(
      (e: string) => !/content digest|accepted epoch lock|accepted admission epoch was edited; historical/.test(e),
    );
    expect(nonLockErrors.join("; ")).toMatch(/canonical content changed/);
    expect(nonLockErrors.length).toBeGreaterThan(0);
  });

  it("a previous policy whose own history is malformed cannot establish a prefix — fail closed", () => {
    const previous = v2With([E900]);
    previous.admission_history = [makeEpoch({ governs_from: "not-a-time" })];
    const out = validatePolicyTransition(previous, v2With([E900, E901]));
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/^previous: |; previous: /);
  });

  it("non-object inputs, a v1 candidate, and an unknown previous schema are all refused", () => {
    for (const bad of [null, undefined, "policy", 7, []]) {
      expect(validatePolicyTransition(bad, committed()).ok, `previous ${String(bad)}`).toBe(false);
      expect(validatePolicyTransition(v1(), bad).ok, `candidate ${String(bad)}`).toBe(false);
    }
    const downgrade = validatePolicyTransition(committed(), v1());
    expect(downgrade.ok).toBe(false);
    expect(errorsOf(downgrade)).toMatch(/Reverting to a schema without admission epochs/);

    const unknownPrevious = validatePolicyTransition({ ...committed(), schema: "straylight.automation-policy.v3" }, committed());
    expect(unknownPrevious.ok).toBe(false);
    expect(errorsOf(unknownPrevious)).toMatch(/the only baseline a transition can be checked against/);
  });

  it("a structurally invalid candidate is refused even when the prefix survives", () => {
    const candidate = committed();
    delete candidate.stuck_lane_threshold_hours;
    const out = validatePolicyTransition(committed(), candidate);
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/^candidate: |; candidate: /);
  });
});

// =============================================================================
// The reusable command surface.
// =============================================================================
describe("policy-transition-check.mjs — the reusable comparison command", () => {
  const tmp = mkdtempSync(join(tmpdir(), "cp-transition-"));
  let n = 0;

  function run(args: string[]): { status: number; out: any } {
    try {
      return { status: 0, out: JSON.parse(execFileSync("node", [CHECK, ...args], { encoding: "utf8" })) };
    } catch (e: any) {
      return { status: e.status ?? -1, out: e.stdout ? JSON.parse(e.stdout) : null };
    }
  }

  function fileWith(policy: any): string {
    const path = join(tmp, `policy-${n++}.json`);
    writeFileSync(path, JSON.stringify(policy, null, 2) + "\n");
    return path;
  }

  it("PROVES the shipped migration: previous v1 main policy → committed v2 candidate", () => {
    const r = run(["--previous", V1_FIXTURE_PATH, "--candidate", COMMITTED_PATH]);
    expect(r.status).toBe(0);
    expect(r.out.ok).toBe(true);
    expect(r.out.kind).toBe("v1-to-v2");
    expect(r.out.previous_epochs).toBe(0);
    expect(r.out.candidate_epochs).toBe(1);
    expect(r.out.appended).toEqual(["epoch-001"]);
    expect(r.out.genesis_epoch).toEqual({ epoch_id: "epoch-001", governs_from: "2026-07-25T20:49:00Z" });
    // The output IS the value-preserving evidence, not a claim about it.
    expect(r.out.candidate_current_admission.lease_duration_minutes).toBe(240);
    expect(r.out.candidate_current_admission.maximum_patch_cycles).toBe(3);
    expect(r.out.previous_current_admission.lease_duration_minutes).toBe(240);
    expect(r.out.candidate_current_admission.authorized_corridor)
      .toEqual(r.out.previous_current_admission.authorized_corridor);
    for (const role of ACTOR_ROLES) {
      expect(r.out.candidate_current_admission.actor_allowlist[role], role)
        .toEqual(r.out.previous_current_admission.actor_allowlist[role]);
    }
  });

  it("exits 2 with transition-forbidden when the candidate rewrites accepted history", () => {
    const candidate = committed();
    candidate.admission_history[0].lease_duration_minutes = 2880;
    for (const f of ADMISSION_FIELDS) candidate[f] = structuredClone(candidate.admission_history[0][f]);
    const r = run(["--previous", COMMITTED_PATH, "--candidate", fileWith(candidate)]);
    expect(r.status).toBe(2);
    expect(r.out.ok).toBe(false);
    expect(r.out.refusal).toBe("transition-forbidden");
    expect(r.out.errors.join("; ")).toMatch(/canonical content changed/);
  });

  it("exits 2 on a missing argument, an unreadable file, and a duplicate-key policy", () => {
    expect(run([]).status).toBe(2);
    expect(run(["--previous", V1_FIXTURE_PATH]).out.refusal).toBe("usage");
    expect(run(["--previous", V1_FIXTURE_PATH, "--candidate", join(tmp, "nope.json")]).out.refusal)
      .toBe("candidate-unreadable");
    const dup = join(tmp, "dup.json");
    const text = JSON.stringify(committed(), null, 2);
    writeFileSync(dup, `{\n  "enabled": false,${text.slice(1)}`);
    const r = run(["--previous", V1_FIXTURE_PATH, "--candidate", dup]);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("candidate-unreadable");
    expect(r.out.detail).toMatch(/duplicate-object-key/);
  });

  it("names no policy path of its own, so it can never become an unlocked reader of the committed policy", () => {
    const src = readFileSync(CHECK, "utf8");
    const code = src.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(code).not.toContain("automation-policy.json");
    expect(code).toMatch(/--previous <file> and --candidate <file> are both required/);
    expect(code).not.toMatch(/execFileSync|spawn|fetch\(|https?:\/\//);
  });
});
