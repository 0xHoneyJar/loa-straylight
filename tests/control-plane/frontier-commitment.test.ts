// Control Plane v2 — M-01: THE APPEND MUST COMMIT TO ONE FRONTIER.
//
// THE DEFECT. The frozen frontier cutover (H-01/H-02) requires an explicit
// durable event frontier, bound to a named frozen revision, with quiescence
// proven — but at ddee83f the transition check accepted WHATEVER structurally
// valid frontier arrived via --frontier. The captured bytes were never
// mechanically bound to the candidate transition reviewed at an exact SHA, so
// any other sound-looking frontier for the same repository and the same frozen
// SHA stood in equally well: an earlier capture left in /tmp, an artifact from
// an abandoned attempt, or a file whose lane entries were edited down. Codex
// demonstrated exactly that: with the real captured maximum at
// 2026-08-13T04:55:42Z, editing the frontier's lane material down to
// 2026-08-13T02:59:59Z made a 2026-08-13T03:00:00Z boundary — which re-judges
// recorded events — pass every check the gate had.
//
// THE REPAIR. The appended epoch now COMMITS the canonical content digest of
// the exact frontier it was authorized against, as
// `transition_evidence: { frontier_digest }` — a closed sibling of provenance,
// reviewed at an exact SHA inside the candidate policy. The transition guard
// recomputes payloadDigest over whatever frontier it is handed and requires
// exact equality; the capture prints the digest to commit after a successful
// run and never writes it into the document it digests. There is no override:
// no CLI flag, no frontier-internal field, no environment variable, no sidecar,
// no fallback.
//
// THREAT MODEL, stated honestly. This defends against the ORDINARY failure —
// a stale file, an accidental artifact substitution, a capture from a previous
// attempt — by making "which frontier?" a mechanical equality instead of a
// matter of review attention. It does not defeat a malicious operator, who can
// edit protocol code; there is no public anchor, no signature, and no notary.
//
// EPOCH IDS follow the convention of frozen-frontier-transition.test.ts:
// epoch-901/epoch-902 are synthetic ids this build has never accepted, so the
// runtime lock is silent and the commitment stands alone; epoch-001/epoch-002
// appear only where the interaction WITH the runtime lock is the point
// (M01-T12), and the epoch-002 lock is staged into a COPIED tree, never the
// real one. Nothing here activates the 48-hour lease or touches the committed
// policy.

import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { payloadDigest } from "../../.straylight/lib/canonical.mjs";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { validatePolicy, ADMISSION_FIELDS, FRONTIER_DIGEST_RE } from "../../.straylight/lib/validate.mjs";
import { admissionEpochDigest } from "../../.straylight/lib/admission-locks.mjs";
import { validatePolicyTransition, POLICY_SCHEMA_V1 } from "../../.straylight/lib/policy-transition.mjs";
import { validateDurableFrontier } from "../../.straylight/lib/durable-frontier.mjs";
import { reconstructLane } from "../../.straylight/lib/reconstruct.mjs";
import { fixtureToInput } from "../../scripts/capture-cp-lane-history.mjs";
import { frontierFromCapture } from "../../scripts/capture-durable-frontier.mjs";

const REPO = "0xHoneyJar/loa-straylight";
const COMMITTED_PATH = ".straylight/automation-policy.json";
const CAPTURE_SCRIPT = "scripts/capture-durable-frontier.mjs";
const LANE_FIXTURES = "tests/control-plane/fixtures/lane-history";

// The same synthetic freeze the H-01 suite binds its evidence to. The frontier
// itself is DERIVED from the committed lane fixtures via frontierFromCapture;
// its canonical digest is computed at runtime rather than re-pinned here — the
// pin lives in frozen-frontier-transition.test.ts, and a second copy would only
// drift. This suite is about the EQUALITY, not the pin.
const CAPTURED_AT = "2026-08-14T12:00:00Z";
const QUIESCENCE_AT = "2026-08-14T11:59:00Z";
const FROZEN_MAIN_SHA = "0f2a5c8e1b47d93a6058fe1c2d3b4a5968770123";
const WRITE_CAPABLE = [
  ".github/workflows/straylight-bootstrap.yml",
  ".github/workflows/straylight-merge-guard.yml",
  ".github/workflows/straylight-reducer.yml",
  ".github/workflows/straylight-watchdog.yml",
];
const FRONTIER_MAX = "2026-08-13T04:55:42Z";
const AFTER_FRONTIER = "2026-08-13T04:55:43Z";
// The exact boundary from the Codex demonstration: prospective against the
// forged 02:59:59Z frontier, historical against the real 04:55:42Z one.
const CODEX_BOUNDARY = "2026-08-13T03:00:00Z";
const CODEX_FORGED_MAX = "2026-08-13T02:59:59Z";

// -----------------------------------------------------------------------------
// Evidence and policy builders (the conventions of the H-01 suite)
// -----------------------------------------------------------------------------

function parsedFile(path: string): any {
  const out = parseStrict(readFileSync(path, "utf8"));
  expect(out.ok, `${path} must parse strictly`).toBe(true);
  return structuredClone((out as any).value);
}

const committed = () => parsedFile(COMMITTED_PATH);
const committedEpoch = () => committed().admission_history[0];

function laneFixture(issue: number): any {
  return JSON.parse(readFileSync(join(LANE_FIXTURES, `lane-${issue}.json`), "utf8"));
}

// F — THE reviewed frontier: derived from the three committed lane fixtures.
function realFrontier(): any {
  const built = frontierFromCapture({
    repository: REPO,
    frozen_main_sha: FROZEN_MAIN_SHA,
    captured_at: CAPTURED_AT,
    quiescence_checked_at: QUIESCENCE_AT,
    write_capable_workflows: WRITE_CAPABLE,
    active_write_runs: [],
    lanes: [118, 120, 122].map((n) => {
      const f = laneFixture(n);
      return { issue_number: f.issue_number, lane_id: f.lane_id, comments: fixtureToInput(f).comments };
    }),
  });
  expect(built.ok, built.ok ? "" : (built as any).errors?.join("; ")).toBe(true);
  return (built as any).frontier;
}
const D1 = payloadDigest(realFrontier());

// F2 — a STALE artifact: the ordinary threat. Same repository, same frozen SHA,
// same lanes, quiescence-valid, prospectivity identical — a perfectly sound
// capture from thirty seconds later that simply is not the reviewed one.
function staleFrontier(): any {
  const f = realFrontier();
  f.captured_at = "2026-08-14T11:59:30Z";
  return f;
}

// The exact Codex forgery: the frontier's lane material edited DOWN so that a
// boundary which re-judges recorded events looks prospective.
function forgedFrontier(): any {
  const f = realFrontier();
  f.lanes[2].last_event_created_at = CODEX_FORGED_MAX;
  f.max_event_created_at = CODEX_FORGED_MAX;
  return f;
}

const ctx = (frontier: any = realFrontier()) => ({
  repository: REPO,
  expected_frozen_main_sha: FROZEN_MAIN_SHA,
  frontier,
});
const errorsOf = (r: ReturnType<typeof validatePolicyTransition>) => (r.ok ? [] : r.errors).join("; ");

const commits = (frontier_digest: string = D1) => ({ transition_evidence: { frontier_digest } });

function unlocked(epoch_id: string, overrides: Record<string, any> = {}): any {
  const e = committedEpoch();
  e.epoch_id = epoch_id;
  e.provenance = {
    attributed_to: "test-fixture",
    reference: "tests/control-plane/frontier-commitment.test.ts (synthetic, unlocked id)",
  };
  return Object.assign(e, structuredClone(overrides));
}

function policyOver(epochs: any[], enabled: boolean): any {
  const p = committed();
  p.enabled = enabled;
  p.admission_history = structuredClone(epochs);
  const final = p.admission_history[p.admission_history.length - 1];
  for (const f of ADMISSION_FIELDS) p[f] = structuredClone(final[f]);
  return p;
}

// The standard append attempt: frozen on both sides, evidence supplied, one
// appended epoch whose commitment and boundary the caller chooses.
function attempt(epochOverrides: Record<string, any>, evidence: any = ctx()) {
  return validatePolicyTransition(
    policyOver([unlocked("epoch-901")], false),
    policyOver([unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER, ...epochOverrides })], false),
    evidence,
  );
}

// -----------------------------------------------------------------------------
// Staged-tree harness (as in frozen-frontier-transition.test.ts): run the REAL
// CLI out of a copied .straylight, optionally with asserted single-occurrence
// source mutations applied to it. Local files only; no network.
// -----------------------------------------------------------------------------

type Mutation = { file: string; from: string; to: string };

function stageStraylight(mutations: Mutation[] = []): string {
  const root = mkdtempSync(join(tmpdir(), "cp-commitment-stage-"));
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

function runCheck(sl: string, previous: any, candidate: any, evidence: any = null): { status: number; out: any } {
  const dir = mkdtempSync(join(tmpdir(), "cp-commitment-args-"));
  const write = (name: string, value: any) => {
    const p = join(dir, name);
    writeFileSync(p, JSON.stringify(value, null, 2) + "\n");
    return p;
  };
  const args = ["--previous", write("prev.json", previous), "--candidate", write("cand.json", candidate)];
  if (evidence?.frontier !== undefined) args.push("--frontier", write("frontier.json", evidence.frontier));
  if (evidence?.repository !== undefined) args.push("--repository", evidence.repository);
  if (evidence?.expected_frozen_main_sha !== undefined) {
    args.push("--expect-frozen-main-sha", evidence.expected_frozen_main_sha);
  }
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
// The commitment's shape: a closed sibling, refused when absent or malformed.
// =============================================================================
describe("transition_evidence — the closed commitment shape", () => {
  it("M01-T1: an appended epoch with NO transition_evidence is refused", () => {
    const out = attempt({});
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/\(epoch-902\)\.transition_evidence: missing/);
    expect(errorsOf(out)).toMatch(/COMMIT the canonical digest/);
    // ...and the refusal points at the tool that prints the digest to commit.
    expect(errorsOf(out)).toMatch(/capture-durable-frontier\.mjs prints the digest to commit/);
  });

  it("M01-T2: an unknown key inside transition_evidence is refused — the shape is closed", () => {
    const out = attempt({ transition_evidence: { frontier_digest: D1, note: "reviewed" } });
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/transition_evidence\.note: unknown transition evidence key \(the shape is closed\)/);
    // Evidence that is not an object at all is refused, not coerced.
    for (const bad of [null, "sha256:abc", ["sha256:abc"], 7]) {
      const shape = attempt({ transition_evidence: bad });
      expect(shape.ok, JSON.stringify(bad)).toBe(false);
      expect(errorsOf(shape), JSON.stringify(bad)).toMatch(/transition_evidence: present but not an object/);
    }
  });

  it("M01-T3: a malformed frontier_digest is refused structurally", () => {
    const cases: Array<[any, RegExp]> = [
      [{}, /frontier_digest: missing/],
      [{ frontier_digest: null }, /frontier_digest: missing/],
      [{ frontier_digest: 42 }, /frontier_digest: not a string/],
      [{ frontier_digest: "sha1:" + "a".repeat(40) }, /frontier_digest: malformed/],
      [{ frontier_digest: "sha256:" + "a".repeat(63) }, /frontier_digest: malformed/],
      [{ frontier_digest: "sha256:" + "A".repeat(64) }, /frontier_digest: malformed/], // hex is lowercase
      [{ frontier_digest: D1.slice(7) }, /frontier_digest: malformed/], // bare hex, no scheme
    ];
    for (const [evidence, pattern] of cases) {
      const out = attempt({ transition_evidence: evidence });
      expect(out.ok, JSON.stringify(evidence)).toBe(false);
      expect(errorsOf(out), JSON.stringify(evidence)).toMatch(pattern);
    }
    // The digest the capture derives is exactly what the schema's pattern names.
    expect(D1).toMatch(FRONTIER_DIGEST_RE);
  });
});

// =============================================================================
// The binding: only THE committed frontier authorizes the append.
// =============================================================================
describe("the digest binding (requirement 6)", () => {
  it("M01-T4: committing digest(F) and supplying F is accepted, and the verdict echoes the digest", () => {
    const out = attempt(commits());
    expect(out.ok, errorsOf(out)).toBe(true);
    if (out.ok) {
      expect(out.kind).toBe("v2-append");
      expect(out.appended).toEqual(["epoch-902"]);
      expect(out.frontier!.frontier_digest).toBe(D1);
    }
  });

  it("M01-T5: committing digest(F) and supplying a VALID F2 is refused, naming both digests", () => {
    const f2 = staleFrontier();
    const d2 = payloadDigest(f2);
    // F2 is structurally perfect and passes every OTHER gate: same repository,
    // same frozen SHA, quiescence-valid, and the boundary clears its frontier.
    const v = validateDurableFrontier(f2);
    expect(v.ok, v.ok ? "" : v.errors.join("; ")).toBe(true);
    expect(f2.repository).toBe(REPO);
    expect(f2.frozen_main_sha).toBe(FROZEN_MAIN_SHA);
    expect(f2.max_event_created_at).toBe(FRONTIER_MAX);
    expect(d2).not.toBe(D1);

    const out = attempt(commits(), ctx(f2));
    expect(out.ok).toBe(false);
    if (!out.ok) {
      // The mismatch is the ONLY thing wrong with this attempt, and the refusal
      // names both the committed digest and the recomputed one.
      expect(out.errors).toHaveLength(1);
      expect(out.errors[0]).toMatch(/transition_evidence\.frontier_digest/);
      expect(out.errors[0]).toContain(D1);
      expect(out.errors[0]).toContain(d2);
      expect(out.errors[0]).toMatch(/not the evidence the appended epoch commits to/);
    }

    // The substitution is symmetric: committing digest(F2) makes F2 the ONE
    // frontier that authorizes the append, and F is now the wrong document.
    const swapped = attempt(commits(d2), ctx(f2));
    expect(swapped.ok, errorsOf(swapped)).toBe(true);
    const wrongWayRound = attempt(commits(d2), ctx());
    expect(wrongWayRound.ok).toBe(false);
    expect(errorsOf(wrongWayRound)).toMatch(/does not match the canonical digest of the supplied durable event frontier/);
  });

  it("M01-T6: the exact Codex forgery is refused by the digest, and by NOTHING else", () => {
    const forged = forgedFrontier();
    // The forgery is a structurally valid frontier whose derived maximum is the
    // edited-down 02:59:59Z — which is what made the 03:00:00Z boundary pass at
    // ddee83f. Reproduce that premise before proving the repair.
    const v = validateDurableFrontier(forged);
    expect(v.ok, v.ok ? "" : v.errors.join("; ")).toBe(true);
    if (v.ok) expect(v.value.max_event_created_at).toBe(CODEX_FORGED_MAX);

    // Against the REAL frontier the boundary is historical and prospectivity
    // refuses it — that is H-01 doing its job on honest evidence.
    const honest = attempt({ governs_from: CODEX_BOUNDARY, ...commits() });
    expect(honest.ok).toBe(false);
    expect(errorsOf(honest)).toMatch(/not strictly after the durable event frontier 2026-08-13T04:55:42Z/);

    // Against the FORGED frontier, prospectivity passes, the freeze passes, the
    // repository and frozen SHA match, quiescence is "proven" — every pre-M01
    // rule accepts it. The single remaining error IS the M-01 repair.
    const out = attempt({ governs_from: CODEX_BOUNDARY, ...commits() }, ctx(forged));
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.errors).toHaveLength(1);
      expect(out.errors[0]).toMatch(/transition_evidence\.frontier_digest/);
      expect(out.errors[0]).toMatch(/does not match the canonical digest of the supplied durable event frontier/);
    }
  });
});

// =============================================================================
// Canonical identity: the digest names content, not bytes.
// =============================================================================
describe("canonical, not byte-order (M01-T7 / M01-T8)", () => {
  it("M01-T7: reordered keys and different whitespace are the SAME frontier", () => {
    const f = realFrontier();
    // Key order: rebuild the document (and each lane entry) with insertion
    // order reversed. JSON.stringify would disagree; the canonical digest must not.
    const reversedKeys = (obj: any): any =>
      Object.fromEntries(Object.keys(obj).reverse().map((k) => [k, obj[k]]));
    const reordered = reversedKeys({ ...f, lanes: f.lanes.map(reversedKeys) });
    expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(f));
    expect(payloadDigest(reordered)).toBe(D1);
    const out = attempt(commits(), ctx(reordered));
    expect(out.ok, errorsOf(out)).toBe(true);

    // Whitespace: two spellings of the same document parse to the same digest —
    // serialization never reaches the canonicalizer.
    const compact = parseStrict(JSON.stringify(f)) as any;
    const pretty = parseStrict(JSON.stringify(f, null, 2)) as any;
    expect(compact.ok && pretty.ok).toBe(true);
    expect(payloadDigest(compact.value)).toBe(D1);
    expect(payloadDigest(pretty.value)).toBe(D1);
  });

  it("M01-T8: any semantic field change is a DIFFERENT frontier and is refused", () => {
    const edits: Array<[string, (f: any) => void]> = [
      ["event_count", (f) => { f.lanes[0].event_count += 1; }],
      ["captured_at", (f) => { f.captured_at = "2026-08-14T12:00:01Z"; }],
      ["last_event_comment_id", (f) => { f.lanes[0].last_event_comment_id += 1; }],
    ];
    for (const [label, edit] of edits) {
      const f2 = realFrontier();
      edit(f2);
      expect(validateDurableFrontier(f2).ok, label).toBe(true); // still valid — only the identity moved
      expect(payloadDigest(f2), label).not.toBe(D1);
      const out = attempt(commits(), ctx(f2));
      expect(out.ok, label).toBe(false);
      expect(errorsOf(out), label).toMatch(/transition_evidence\.frontier_digest/);
    }
  });
});

// =============================================================================
// Where the commitment does NOT belong.
// =============================================================================
describe("genesis and live-only paths (M01-T9 / M01-T10)", () => {
  // A v1 policy carrying the same admission values the committed genesis
  // transcribes, so the migration below is value-preserving by construction.
  const v1 = () => {
    const c = committed();
    const p: any = { schema: POLICY_SCHEMA_V1 };
    for (const f of ADMISSION_FIELDS) p[f] = structuredClone(c[f]);
    return p;
  };

  it("M01-T9: a genesis epoch carrying transition_evidence is refused", () => {
    // The clean migration is accepted, with no frontier consulted…
    const clean = validatePolicyTransition(v1(), policyOver([unlocked("epoch-901")], true));
    expect(clean.ok, errorsOf(clean)).toBe(true);
    if (clean.ok) {
      expect(clean.kind).toBe("v1-to-v2");
      expect(clean.frontier).toBeNull();
    }
    // …and the same migration whose genesis claims frontier evidence is not:
    // the migration transcribes v1 and moves no decision, so it has no capture
    // to commit to. Evidence there would only make genesis look bounded.
    const claimed = validatePolicyTransition(v1(), policyOver([unlocked("epoch-901", commits())], true));
    expect(claimed.ok).toBe(false);
    expect(errorsOf(claimed)).toMatch(/admission_history\[0\]\.transition_evidence: present on the genesis epoch/);
    expect(errorsOf(claimed)).toMatch(/Frontier evidence belongs to APPENDED epochs only/);
  });

  it("M01-T10: live-only transitions still require no evidence — even over a post-append history", () => {
    // The real committed freeze/unfreeze, unchanged by M-01.
    const freeze = validatePolicyTransition(committed(), policyOver([committedEpoch()], false));
    expect(freeze.ok, errorsOf(freeze)).toBe(true);
    if (freeze.ok) expect(freeze.frontier).toBeNull();

    // A history whose FINAL epoch already carries a commitment (the world after
    // a cutover): flipping the kill switch consults no frontier and re-litigates
    // no evidence. The commitment is part of accepted history now, not a toll on
    // live operation.
    const history = [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER, ...commits() })];
    const out = validatePolicyTransition(policyOver(history, false), policyOver(history, true));
    expect(out.ok, errorsOf(out)).toBe(true);
    if (out.ok) {
      expect(out.kind).toBe("v2-live");
      expect(out.appended).toEqual([]);
      expect(out.frontier).toBeNull();
    }
  });
});

// =============================================================================
// The commitment is immutable once accepted — by BOTH protections.
// =============================================================================
describe("immutability of an accepted commitment (M01-T11 / M01-T12)", () => {
  it("M01-T11: a later candidate editing ONLY an accepted epoch's frontier_digest is refused by the prefix guard", () => {
    const D2 = payloadDigest(staleFrontier());
    const accepted = [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER, ...commits() })];
    const previous = policyOver(accepted, false);
    const candidate = policyOver(accepted, false);
    candidate.admission_history[1].transition_evidence.frontier_digest = D2;
    // Still a structurally valid policy — the edit is invisible to shape checks…
    expect(validatePolicy(candidate).ok).toBe(true);
    // …and the prefix guard refuses it independently of any lock or frontier.
    const out = validatePolicyTransition(previous, candidate);
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/admission_history\[1\] \(epoch-902\): canonical content changed/);
  });

  it("M01-T12: the runtime accepted-epoch lock covers the commitment — a changed frontier_digest fails it", () => {
    const D2 = payloadDigest(staleFrontier());
    const epoch = (digest: string) => ({
      epoch_id: "epoch-002",
      governs_from: AFTER_FRONTIER,
      authorized_corridor: structuredClone(committedEpoch().authorized_corridor),
      maximum_patch_cycles: committedEpoch().maximum_patch_cycles,
      actor_allowlist: structuredClone(committedEpoch().actor_allowlist),
      lease_duration_minutes: 240,
      provenance: {
        attributed_to: "test-fixture",
        reference: "hypothetical successor epoch; NOT committed, NOT locked",
      },
      transition_evidence: { frontier_digest: digest },
    });
    // Editing ONLY the committed digest changes the epoch's canonical content —
    // the runtime lock pins the COMPLETE epoch object, evidence included.
    expect(admissionEpochDigest(epoch(D1))).not.toBe(admissionEpochDigest(epoch(D2)));

    // Stage a HYPOTHETICAL epoch-002 lock computed from the D2-carrying epoch
    // (tests only; the real table still pins exactly epoch-001), then submit the
    // D1-carrying epoch with the real frontier F. The append gate is satisfied —
    // frozen both sides, evidence sound, boundary prospective, digest equality
    // holds — so the runtime lock is the ONLY thing that refuses.
    const sl = stageStraylight([{
      file: "lib/admission-locks.mjs",
      from: "  }),\n]);",
      to: `  }),\n  Object.freeze({ epoch_id: "epoch-002", digest: ${JSON.stringify(admissionEpochDigest(epoch(D2)))} }),\n]);`,
    }]);
    const previous = policyOver([committedEpoch()], false);
    const candidate = policyOver([committedEpoch(), epoch(D1)], false);
    const run = runCheck(sl, previous, candidate, ctx());
    expect(run.status).toBe(2);
    const errors = JSON.stringify(run.out.errors);
    expect(errors).toMatch(/content digest .* does not match the accepted lock/);
    expect(errors).not.toMatch(/transition_evidence|not strictly after|ALREADY FROZEN|context\.frontier/);

    // With the lock staged from the SAME epoch the candidate presents, the whole
    // chain accepts — proving the refusal above was the lock and only the lock.
    const agreed = stageStraylight([{
      file: "lib/admission-locks.mjs",
      from: "  }),\n]);",
      to: `  }),\n  Object.freeze({ epoch_id: "epoch-002", digest: ${JSON.stringify(admissionEpochDigest(epoch(D1)))} }),\n]);`,
    }]);
    const ok = runCheck(agreed, previous, candidate, ctx());
    expect(ok.status, JSON.stringify(ok.out)).toBe(0);
    expect(ok.out.frontier.frontier_digest).toBe(D1);
  });
});

// =============================================================================
// The future 48-hour change under the commitment. SIMULATED ONLY.
// =============================================================================
describe("the future 2880 synthetic append (M01-T13 / M01-T14)", () => {
  const with2880 = (digest: string) =>
    attempt({ lease_duration_minutes: 2880, ...commits(digest) });

  it("M01-T13: committing the correct digest of F, the 2880 append is accepted", () => {
    const out = with2880(D1);
    expect(out.ok, errorsOf(out)).toBe(true);
    if (out.ok) {
      expect(out.appended).toEqual(["epoch-902"]);
      expect(out.frontier!.frontier_digest).toBe(D1);
      expect(out.frontier!.max_event_created_at).toBe(FRONTIER_MAX);
    }
  });

  it("M01-T14: the same append with a substituted F2 is refused by the digest binding", () => {
    const out = validatePolicyTransition(
      policyOver([unlocked("epoch-901")], false),
      policyOver(
        [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER, lease_duration_minutes: 2880, ...commits(D1) })],
        false,
      ),
      ctx(staleFrontier()),
    );
    expect(out.ok).toBe(false);
    expect(errorsOf(out)).toMatch(/transition_evidence\.frontier_digest/);
    expect(errorsOf(out)).toMatch(/does not match the canonical digest of the supplied durable event frontier/);
    // Nothing real moves: the committed policy remains epoch-001 / 240 / enabled.
    const p = committed();
    expect([p.enabled, p.lease_duration_minutes, p.admission_history.length]).toEqual([true, 240, 1]);
    expect(JSON.stringify(p)).not.toMatch(/2880|epoch-002|transition_evidence/);
  });
});

// =============================================================================
// The capture REPORTS the digest; the document never CONTAINS it.
// =============================================================================
describe("M01-T15: the digest is derived and reported, never stored", () => {
  it("the frontier schema has no self-digest field — one inside the document is refused", () => {
    const f = realFrontier();
    f.frontier_digest = D1;
    const v = validateDurableFrontier(f);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors.join("; ")).toMatch(/frontier\.frontier_digest: unknown key/);
  });

  it("the validator DERIVES the identity, so capture and guard cannot disagree", () => {
    const v = validateDurableFrontier(realFrontier());
    expect(v.ok, v.ok ? "" : (v as any).errors.join("; ")).toBe(true);
    if (v.ok) expect(v.value.frontier_digest).toBe(D1);
  });

  it("the capture prints the digest to STDERR and writes ONLY the frontier JSON to --out", () => {
    // Executable text, comments blanked: a comment naming the behaviour must not
    // satisfy this after the behaviour is deleted.
    const c = readFileSync(CAPTURE_SCRIPT, "utf8")
      .split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
    expect(c).toMatch(/process\.stderr\.write\(\n\s*`frontier_digest: \$\{built\.value\.frontier_digest\}\\n` \+/);
    // The emitted document is exactly the assembled frontier — no digest merged in.
    expect(c).toMatch(/const text = JSON\.stringify\(built\.frontier, null, 2\) \+ "\\n";/);
  });
});

// =============================================================================
// No admission authority: the commitment describes evidence, it decides nothing.
// =============================================================================
describe("transition_evidence carries no admission authority", () => {
  it("the replay-sensitive admission field set is exactly the four, unchanged", () => {
    expect([...ADMISSION_FIELDS]).toEqual([
      "authorized_corridor",
      "actor_allowlist",
      "maximum_patch_cycles",
      "lease_duration_minutes",
    ]);
  });

  it("replay is byte-identical with and without a commitment on the epoch", () => {
    const replay = (policy: any) => {
      const out: any = reconstructLane({ ...fixtureToInput(laneFixture(122)), policy });
      return {
        state: out.lane?.state ?? null,
        event_sequence: out.lane?.event_sequence ?? null,
        dispositions: out.dispositions ?? [],
      };
    };
    const bare = replay(policyOver([unlocked("epoch-901")], true));
    const carrying = replay(policyOver([unlocked("epoch-901", commits())], true));
    expect(carrying.dispositions).toEqual(bare.dispositions);
    expect([carrying.state, carrying.event_sequence]).toEqual(["ready-for-claude", 121]);
  });

  it("no replay module reads transition_evidence at all", () => {
    for (const path of [".straylight/lib/reducer.mjs", ".straylight/lib/reconstruct.mjs"]) {
      const code = readFileSync(path, "utf8")
        .split("\n").map((l) => (l.trim().startsWith("//") ? "" : l)).join("\n");
      expect(code, path).not.toMatch(/transition_evidence|frontier_digest/);
    }
  });
});

// =============================================================================
// M-M01 — the equality comparison is LOAD-BEARING. Neuter it and both the Codex
// forgery and the stale substitution are accepted; the real build refuses them.
// The mutant IS the ddee83f-era gate for this rule, so its acceptance is the
// proof that the forged frontier would have passed before this patch.
// =============================================================================
describe("M-M01 mutation — remove the digest equality and the defect returns", () => {
  const MUTATION: Mutation = {
    file: "lib/policy-transition.mjs",
    from: "    if (evidence.frontier_digest !== bound.frontier_digest) {",
    to: "    if (false) {",
  };
  const previous = () => policyOver([unlocked("epoch-901")], false);
  const forgery = () =>
    policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: CODEX_BOUNDARY, lease_duration_minutes: 2880, ...commits(D1) })],
      false,
    );
  const substitution = () =>
    policyOver(
      [unlocked("epoch-901"), unlocked("epoch-902", { governs_from: AFTER_FRONTIER, ...commits(D1) })],
      false,
    );

  it("the unmutated staged build refuses the forgery and the substitution — and accepts the true pairing", () => {
    const sl = stageStraylight();
    const forged = runCheck(sl, previous(), forgery(), ctx(forgedFrontier()));
    expect(forged.status).toBe(2);
    expect(JSON.stringify(forged.out.errors)).toMatch(/transition_evidence\.frontier_digest/);

    const stale = runCheck(sl, previous(), substitution(), ctx(staleFrontier()));
    expect(stale.status).toBe(2);
    expect(JSON.stringify(stale.out.errors)).toMatch(/does not match the canonical digest of the supplied durable event frontier/);

    // The harness is not refusing everything: the reviewed pairing passes.
    const honest = runCheck(sl, previous(), substitution(), ctx());
    expect(honest.status, JSON.stringify(honest.out)).toBe(0);
    expect(honest.out.frontier.frontier_digest).toBe(D1);
  });

  it("the mutated build ACCEPTS what the real build refuses", () => {
    const sl = stageStraylight([MUTATION]);
    // The Codex forgery: an edited-down frontier makes a boundary that re-judges
    // recorded events look prospective, and nothing else objects.
    const forged = runCheck(sl, previous(), forgery(), ctx(forgedFrontier()));
    expect(forged.status, JSON.stringify(forged.out)).toBe(0);
    expect(forged.out.ok).toBe(true);
    expect(forged.out.appended).toEqual(["epoch-902"]);
    expect(forged.out.frontier.max_event_created_at).toBe(CODEX_FORGED_MAX);

    // The stale substitution: a perfectly valid F2 stands in for the reviewed F.
    const stale = runCheck(sl, previous(), substitution(), ctx(staleFrontier()));
    expect(stale.status, JSON.stringify(stale.out)).toBe(0);
    expect(stale.out.appended).toEqual(["epoch-902"]);
  });
});
