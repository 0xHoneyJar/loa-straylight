// Control Plane v2 — ADMISSION EPOCHS: the accepted-epoch lock and everything
// that has to hold around it.
//
// The defect this file pins closed, in two acts.
//
//   Act 1 (rejected as PR #139). Admission policy — authorized_corridor,
//   actor_allowlist, maximum_patch_cycles, lease_duration_minutes — was read
//   LIVE while replaying durable history. Raising lease_duration_minutes from
//   240 to 2880 retroactively converted lane-phase-50a comment 5257177236 from
//   REFUSED (lease-expiry-unbounded) into ACCEPTED. A config edit rewrote the
//   past.
//
//   Act 2 (rejected as PR #140). Versioning those fields into temporal epochs
//   fixed WHICH values apply to a past event, but the epoch itself was still a
//   mutable object in a mutable JSON file, so editing epoch 1 rewrote exactly
//   the history the epoch existed to protect. Moving mutable historical
//   authority into a mutable array is not sufficient.
//
// What must therefore be true, and is asserted here:
//
//   A  every accepted epoch's COMPLETE content is digest-locked in executable
//      protocol code (admission-locks.mjs), outside the policy file, and every
//      loader of the real committed policy applies that lock;
//   D  provenance is inspectable metadata — no string in the file authenticates
//      anyone — while still being bound by the epoch digest;
//   E  the epoch selector fails closed on its own contract, with no help from a
//      preceding validatePolicy call;
//   F  event admission has exactly one time authority, the authenticated GitHub
//      comment time; the reducer's run clock is not admissible anywhere;
//   G  the top-level admission fields are a REQUIRED projection of the final
//      epoch and never historical authority, and every consumer of the four
//      fields in the repository is accounted for;
//   J  the adversarial mutations are executable, not prose;
//   K  the policy shape is closed, so nothing admission-shaped can sit in the
//      file looking authoritative while carrying no force.
//
// The append-only change-time guard — the second, independent protection — is
// proven separately in policy-transition.test.ts. Independence is the point:
// neither mechanism can be repaired into agreement by the edit the other one
// catches.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, mkdirSync, cpSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canonicalize, payloadDigest } from "../../.straylight/lib/canonical.mjs";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import {
  validatePolicy, acceptPolicy, admissionPolicyFor, admissionHistoryErrors,
  parseIsoInstant, ADMISSION_FIELDS, ACTOR_ROLES,
} from "../../.straylight/lib/validate.mjs";
import {
  ACCEPTED_ADMISSION_EPOCH_LOCKS, admissionEpochDigest,
  acceptedEpochLockErrors, pinnedEpochLockErrors, historyClaimsAcceptedEpoch,
} from "../../.straylight/lib/admission-locks.mjs";
import { reduce } from "../../.straylight/lib/reducer.mjs";
import {
  makePolicy, makeEpoch, makeLane, makeEvent, makeTaskPacket,
  FIXTURE_EPOCH_ID, FIXTURE_EPOCH_FROM, NOW, BASE_SHA,
} from "./_fixtures.js";

const POLICY_PATH = ".straylight/automation-policy.json";
const LOCKS_PATH = ".straylight/lib/admission-locks.mjs";
const LOADER_PATH = ".straylight/lib/policy-source.mjs";
const REDUCER_PATH = ".straylight/lib/reducer.mjs";
const POLICY_FILE_NAME = "automation-policy.json";

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

const committedText = () => readFileSync(POLICY_PATH, "utf8");

// The committed policy, read the way the protocol reads it: strict parse, so a
// duplicate key is ambiguity rather than "last one wins".
function committedPolicy(): any {
  const parsed = parseStrict(committedText());
  expect(parsed.ok, "the committed policy must parse strictly").toBe(true);
  return structuredClone((parsed as any).value);
}

// The top-level projection must always equal the final epoch (validatePolicy
// enforces it). Adversarial edits below therefore re-derive the projection, so
// the ONLY remaining error is the accepted-epoch lock — a policy edit that is
// internally consistent in every other respect must still fail closed.
function syncProjection(policy: any): any {
  const final = policy.admission_history[policy.admission_history.length - 1];
  for (const field of ADMISSION_FIELDS) policy[field] = structuredClone(final[field]);
  return policy;
}

// Executable text only: `//` comment lines are blanked (line count preserved).
// A comment that NAMES a safeguard must never be able to satisfy a check that
// the safeguard is present — the repository has been bitten by exactly that.
function executable(src: string): string {
  return src
    .split("\n")
    .map((line) => (line.trim().startsWith("//") ? "" : line))
    .join("\n");
}

// Every .mjs entrypoint that could load a policy.
function policyLoadingScripts(): string[] {
  const files = [
    ...readdirSync(".straylight/bin").filter((f) => f.endsWith(".mjs")).map((f) => join(".straylight/bin", f)),
    ...readdirSync("scripts").filter((f) => f.endsWith(".mjs")).map((f) => join("scripts", f)),
  ];
  return files.filter((f) => executable(readFileSync(f, "utf8")).includes(POLICY_FILE_NAME)).sort();
}

// Stage a self-contained copy of .straylight with a (possibly mutated) policy,
// then run one of ITS OWN bins. The bins resolve the committed policy relative
// to their own location, so in the staged tree the mutated file IS "the
// committed policy" — this is an end-to-end proof that a policy edit stops the
// real control plane, not just an in-process assertion about a validator.
function stage(mutate: ((policy: any) => void) | null): string {
  const root = mkdtempSync(join(tmpdir(), "cp-epoch-stage-"));
  const sl = join(root, ".straylight");
  mkdirSync(sl);
  for (const dir of ["lib", "bin", "schemas"]) {
    cpSync(join(".straylight", dir), join(sl, dir), { recursive: true });
  }
  const policy = committedPolicy();
  if (mutate) {
    mutate(policy);
    syncProjection(policy);
  }
  writeFileSync(join(sl, POLICY_FILE_NAME), JSON.stringify(policy, null, 2) + "\n");
  return sl;
}

function runStaged(sl: string, bin: string): { status: number; out: any; stderr: string } {
  try {
    const stdout = execFileSync("node", [join(sl, "bin", bin)], { encoding: "utf8" });
    return { status: 0, out: stdout.trim().startsWith("{") ? JSON.parse(stdout) : stdout, stderr: "" };
  } catch (e: any) {
    const stdout = typeof e.stdout === "string" ? e.stdout : "";
    return {
      status: e.status ?? -1,
      out: stdout.trim().startsWith("{") ? JSON.parse(stdout) : stdout,
      stderr: typeof e.stderr === "string" ? e.stderr : "",
    };
  }
}

// The adversarial edits to the ONE accepted epoch. `key` names the epoch key
// each edit touches; the suite proves below that these cover EVERY key of the
// accepted epoch, which is what "the digest covers the complete epoch object"
// means operationally.
const EPOCH_EDITS: Array<{ label: string; key: string; edit: (epoch: any) => void; keepsAcceptedId: boolean }> = [
  {
    label: "J1 lease_duration_minutes 240 → 2880 (the exact PR #139 retroactive rewrite)",
    key: "lease_duration_minutes",
    edit: (e) => { e.lease_duration_minutes = 2880; },
    keepsAcceptedId: true,
  },
  {
    label: "J2 maximum_patch_cycles 3 → 4",
    key: "maximum_patch_cycles",
    edit: (e) => { e.maximum_patch_cycles = 4; },
    keepsAcceptedId: true,
  },
  {
    label: "J3 authorized_corridor widened by one phase",
    key: "authorized_corridor",
    edit: (e) => { e.authorized_corridor = [...e.authorized_corridor, "phase-50c"]; },
    keepsAcceptedId: true,
  },
  {
    label: "J4 actor_allowlist gains an implementer identity",
    key: "actor_allowlist",
    edit: (e) => { e.actor_allowlist.implementer = [...e.actor_allowlist.implementer, "someone-else"]; },
    keepsAcceptedId: true,
  },
  {
    label: "J5a governs_from backdated to the invented January boundary PR #140 was rejected for",
    key: "governs_from",
    edit: (e) => { e.governs_from = "2026-01-01T00:00:00Z"; },
    keepsAcceptedId: true,
  },
  {
    label: "J5b provenance.attributed_to reassigned to another party",
    key: "provenance",
    edit: (e) => { e.provenance.attributed_to = "someone-else"; },
    keepsAcceptedId: true,
  },
  {
    label: "J5c provenance.reference repointed",
    key: "provenance",
    edit: (e) => { e.provenance.reference = "some other document that was never reviewed"; },
    keepsAcceptedId: true,
  },
  {
    label: "J5d provenance.note rewritten to describe a different transcription",
    key: "provenance",
    edit: (e) => { e.provenance.note = "Transcribes something else entirely, from some other commit."; },
    keepsAcceptedId: true,
  },
  {
    // Renaming the accepted id removes every accepted id from the history, so
    // validatePolicy's conditional binding cannot engage — the documented Tier-1
    // gap. acceptPolicy (provenance known: these bytes came from the protocol's
    // own policy file) still refuses, and so does the transition guard.
    label: "J6 epoch_id renamed (accepted epoch replaced under a new name)",
    key: "epoch_id",
    edit: (e) => { e.epoch_id = "epoch-002"; },
    keepsAcceptedId: false,
  },
];

// =============================================================================
// A — the accepted-epoch lock.
// =============================================================================
describe("A — the committed policy IS the accepted history, and the lock says so", () => {
  it("the committed v2 policy passes production acceptance (validatePolicy + the full lock)", () => {
    const policy = committedPolicy();
    expect(policy.schema).toBe("straylight.automation-policy.v2");
    const accepted = acceptPolicy(policy);
    expect(accepted.ok, accepted.ok ? "" : (accepted as any).errors.join("; ")).toBe(true);
    expect(validatePolicy(policy).ok).toBe(true);
    expect(acceptedEpochLockErrors(policy.admission_history)).toEqual([]);
    expect(pinnedEpochLockErrors(policy.admission_history)).toEqual([]);
  });

  it("history length equals the number of accepted locks, and each index carries its expected epoch_id", () => {
    const history = committedPolicy().admission_history;
    expect(history).toHaveLength(ACCEPTED_ADMISSION_EPOCH_LOCKS.length);
    ACCEPTED_ADMISSION_EPOCH_LOCKS.forEach((lock, i) => {
      expect(history[i].epoch_id, `admission_history[${i}]`).toBe(lock.epoch_id);
    });
  });

  it("each accepted epoch's COMPLETE canonical content digest equals its lock", () => {
    const history = committedPolicy().admission_history;
    ACCEPTED_ADMISSION_EPOCH_LOCKS.forEach((lock, i) => {
      expect(admissionEpochDigest(history[i])).toBe(lock.digest);
      // The digest is the protocol's ONE canonicalization + digest primitive,
      // not a second home-grown canonicalizer that could drift from it.
      expect(admissionEpochDigest(history[i])).toBe(payloadDigest(history[i]));
      expect(lock.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    });
  });

  it("the digest covers EVERY key of the accepted epoch — id, boundary, all four fields, provenance", () => {
    const epoch = committedPolicy().admission_history[0];
    expect(new Set(EPOCH_EDITS.map((m) => m.key))).toEqual(new Set(Object.keys(epoch)));
    expect(Object.keys(epoch).sort()).toEqual([
      "actor_allowlist", "authorized_corridor", "epoch_id", "governs_from",
      "lease_duration_minutes", "maximum_patch_cycles", "provenance",
    ]);
    // and every provenance sub-key is exercised too
    const provKeysEdited = new Set(
      EPOCH_EDITS.filter((m) => m.key === "provenance").map((m) => {
        const e = committedPolicy().admission_history[0];
        const before = structuredClone(e.provenance);
        m.edit(e);
        return Object.keys(e.provenance).find((k) => canonicalize(e.provenance[k]) !== canonicalize(before[k]))!;
      }),
    );
    expect(provKeysEdited).toEqual(new Set(Object.keys(epoch.provenance)));
  });

  it("J1–J6: editing ANY part of the accepted epoch fails production acceptance (projection re-synced, so only the lock objects)", () => {
    for (const m of EPOCH_EDITS) {
      const policy = committedPolicy();
      m.edit(policy.admission_history[0]);
      syncProjection(policy);
      const accepted = acceptPolicy(policy);
      expect(accepted.ok, m.label).toBe(false);
      if (!accepted.ok) {
        expect(accepted.errors.join("; "), m.label).toMatch(/accepted (admission epoch|epoch)|content digest|may not be reordered/);
      }
      // Structural validity is NOT what refuses these: the edited policy is a
      // well-formed v2 policy in every other respect.
      const withoutLockErrors = validatePolicy(policy);
      if (m.keepsAcceptedId) {
        expect(withoutLockErrors.ok, `${m.label} (validatePolicy binding)`).toBe(false);
        expect((withoutLockErrors as any).errors.join("; "), m.label).toMatch(/content digest|accepted/);
      }
    }
  });

  it("J1–J6: reduce() refuses to reduce ANYTHING under an edited accepted epoch", () => {
    const lane = makeLane({ state: "planning", event_sequence: 0 });
    const event = makeEvent({ sequence: 1, event_type: "lane.activated", prior_state: "planning" });
    for (const m of EPOCH_EDITS.filter((x) => x.keepsAcceptedId)) {
      const policy = committedPolicy();
      m.edit(policy.admission_history[0]);
      syncProjection(policy);
      const out = reduce(lane, event, policy, { event_observed_at: "2026-07-26T00:00:00Z" });
      expect(out.ok, m.label).toBe(false);
      if (!out.ok) {
        expect(out.refusal, m.label).toBe("policy-invalid");
        expect(out.detail, m.label).toMatch(/content digest|accepted/);
      }
    }
  });

  it("appending an epoch WITHOUT appending its lock fails closed", () => {
    const policy = committedPolicy();
    policy.admission_history.push(makeEpoch({
      epoch_id: "epoch-002",
      governs_from: "2026-09-01T00:00:00Z",
      lease_duration_minutes: 999,
      provenance: { attributed_to: "test-fixture", reference: "unlocked hypothetical append" },
    }));
    syncProjection(policy);
    expect(acceptPolicy(policy).ok).toBe(false);
    const v = validatePolicy(policy);
    expect(v.ok).toBe(false);
    expect((v as any).errors.join("; ")).toMatch(/accepted epoch lock\(s\)/);
  });

  it("inserting an epoch BEFORE the accepted one fails closed (index displacement)", () => {
    const policy = committedPolicy();
    policy.admission_history.unshift(makeEpoch({
      epoch_id: "epoch-000",
      governs_from: "2026-07-01T00:00:00Z",
      provenance: { attributed_to: "test-fixture", reference: "hypothetical pre-genesis insertion" },
    }));
    syncProjection(policy);
    expect(acceptPolicy(policy).ok).toBe(false);
    expect(validatePolicy(policy).ok).toBe(false);
  });

  it("deleting the accepted epoch fails closed, whether the history is emptied or substituted", () => {
    expect(acceptedEpochLockErrors([]).join("; ")).toMatch(/0 epoch\(s\) but 1 accepted epoch lock/);
    expect(admissionHistoryErrors([]).join("; ")).toMatch(/at least one epoch/);
    // Substituted wholesale for a synthetic history: no accepted id remains, so
    // validatePolicy's conditional binding cannot see it (documented), but
    // acceptPolicy — where the bytes are known to be the protocol's own policy
    // file — refuses.
    const substituted = syncProjection({ ...committedPolicy(), admission_history: [makeEpoch()] });
    expect(validatePolicy(substituted).ok).toBe(true);
    const accepted = acceptPolicy(substituted);
    expect(accepted.ok).toBe(false);
    expect((accepted as any).errors.join("; ")).toMatch(/epoch-001/);
  });

  it("J7: an epoch edit accompanied by a freshly recomputed POLICY-LOCAL digest is still refused", () => {
    // The lock has force only because it lives where the policy edit cannot
    // reach. A digest stored beside the epoch would be recomputed by whoever
    // edited the epoch — so the closed shape refuses one outright, at both
    // levels, and the external lock still refuses the edit itself.
    const policy = committedPolicy();
    const epoch = policy.admission_history[0];
    epoch.lease_duration_minutes = 2880;
    syncProjection(policy);
    epoch.digest = admissionEpochDigest(epoch); // recomputed by the same edit
    const withEpochDigest = validatePolicy(policy);
    expect(withEpochDigest.ok).toBe(false);
    expect((withEpochDigest as any).errors.join("; ")).toMatch(/unknown epoch key/);

    // Removing the self-issued digest does not rescue the edit either: the
    // external lock refuses it on its own.
    delete epoch.digest;
    const withoutIt = validatePolicy(policy);
    expect(withoutIt.ok).toBe(false);
    expect((withoutIt as any).errors.join("; ")).toMatch(/content digest/);

    const topLevel = { ...policy, epoch_digests: [admissionEpochDigest(epoch)] };
    const withTopLevel = validatePolicy(topLevel);
    expect(withTopLevel.ok).toBe(false);
    expect((withTopLevel as any).errors.join("; ")).toMatch(/unknown top-level policy key/);
  });

  it("the lock is EXTERNAL to the policy: the policy file carries no digest of its own", () => {
    expect(committedText()).not.toMatch(/sha256:/);
    // And it says where the lock lives, so a reader of the file is not misled
    // into thinking the file is self-securing.
    expect(committedText()).toMatch(/admission-locks\.mjs/);
  });

  it("the lock table cannot be re-pointed at runtime; changing it means changing protocol code", () => {
    expect(Object.isFrozen(ACCEPTED_ADMISSION_EPOCH_LOCKS)).toBe(true);
    for (const lock of ACCEPTED_ADMISSION_EPOCH_LOCKS) expect(Object.isFrozen(lock)).toBe(true);
    expect(() => { (ACCEPTED_ADMISSION_EPOCH_LOCKS as any)[0] = { epoch_id: "epoch-001", digest: "sha256:" + "0".repeat(64) }; }).toThrow();
    expect(() => { (ACCEPTED_ADMISSION_EPOCH_LOCKS as any).push({}); }).toThrow();
    expect(() => { (ACCEPTED_ADMISSION_EPOCH_LOCKS[0] as any).digest = "sha256:" + "1".repeat(64); }).toThrow();
    // "lock changed, policy unchanged" is the same comparison failing from the
    // other side: any digest other than the epoch's own content digest
    // mismatches. There is no way to express it as data — that is the guarantee.
    const epoch = committedPolicy().admission_history[0];
    const edited = structuredClone(epoch);
    edited.lease_duration_minutes = 2880;
    expect(admissionEpochDigest(edited)).not.toBe(ACCEPTED_ADMISSION_EPOCH_LOCKS[0]!.digest);
    expect(admissionEpochDigest(epoch)).toBe(ACCEPTED_ADMISSION_EPOCH_LOCKS[0]!.digest);
  });

  it("historyClaimsAcceptedEpoch drives the conditional binding, and the unconditional lock ignores it", () => {
    expect(historyClaimsAcceptedEpoch(committedPolicy().admission_history)).toBe(true);
    expect(historyClaimsAcceptedEpoch([makeEpoch()])).toBe(false);
    expect(historyClaimsAcceptedEpoch(null)).toBe(false);
    expect(historyClaimsAcceptedEpoch([null, 7, "x"])).toBe(false);
    // fixture history: conditional binding silent, unconditional lock refuses
    expect(pinnedEpochLockErrors([makeEpoch()])).toEqual([]);
    expect(acceptedEpochLockErrors([makeEpoch()]).length).toBeGreaterThan(0);
    // a fixture that BORROWED an accepted id would fail closed — which is why
    // _fixtures.ts must never use one, and cannot be adjusted to make a
    // production-lock test pass.
    expect(FIXTURE_EPOCH_ID).not.toBe(ACCEPTED_ADMISSION_EPOCH_LOCKS[0]!.epoch_id);
    const borrowed = syncProjection({ ...committedPolicy(), admission_history: [makeEpoch({ epoch_id: "epoch-001" })] });
    expect(validatePolicy(borrowed).ok).toBe(false);
    expect(acceptPolicy(borrowed).ok).toBe(false);
  });

  it("the lock module states its threat boundary honestly (no cryptographic-anchoring claim)", () => {
    const src = readFileSync(LOCKS_PATH, "utf8");
    expect(src).toMatch(/does not make code immutable/i);
    expect(src).toMatch(/no cryptographic public anchor/i);
    expect(src).toMatch(/exact-SHA|exact head SHA/);
    expect(src).not.toMatch(/tamper[- ]proof|immutable code|cannot be changed by anyone/i);
  });
});

// =============================================================================
// A (continued) — the loader boundary. Every reader of the REAL policy applies
// the full lock, so no accepted epoch is editable by changing the JSON alone.
// =============================================================================
describe("A — every loader of the committed policy goes through the one accepting loader", () => {
  it("scan: every script whose EXECUTABLE text names the policy file loads it via loadProtocolPolicy", () => {
    const scripts = policyLoadingScripts();
    // The set is non-trivial and includes the reducer/watchdog/merge-guard
    // entrypoints the workflows actually run.
    expect(scripts.length).toBeGreaterThanOrEqual(10);
    for (const bin of [
      "policy-gate.mjs", "reduce-issue.mjs", "watchdog-scan.mjs", "merge-guard-check.mjs",
      "plan-reducer-writes.mjs", "plan-watchdog-writes.mjs", "plan-merge-guard-write.mjs",
      "collect-watchdog-evidence.mjs", "validate-protocol.mjs",
    ]) {
      expect(scripts, bin).toContain(join(".straylight/bin", bin));
    }
    expect(scripts).toContain(join("scripts", "capture-cp-lane-history.mjs"));

    for (const file of scripts) {
      const src = executable(readFileSync(file, "utf8"));
      expect(src, `${file}: must load the policy through policy-source.mjs`).toMatch(/loadProtocolPolicy\s*\(/);
      expect(src, `${file}: must import the shared loader`).toMatch(/loadProtocolPolicy\b[^\n]*\}?\s*from\s*"[^"]*policy-source\.mjs"|from\s*"[^"]*policy-source\.mjs"/);
      // No script may read the policy path itself: that is how a loader skips
      // the accepted-epoch lock.
      expect(src, `${file}: must not read the policy file directly`).not.toMatch(
        new RegExp(`readFileSync\\([^)]*${POLICY_FILE_NAME.replace(".", "\\.")}`),
      );
      expect(src, `${file}: must not validate the policy itself`).not.toMatch(/\bvalidatePolicy\s*\(/);
      expect(src, `${file}: must not JSON.parse a policy`).not.toMatch(/JSON\.parse\([^)]*polic/i);
    }
  });

  it("the loader is the ONE place that decides accept-vs-validate, and it keys on the resolved real path", () => {
    const loader = executable(readFileSync(LOADER_PATH, "utf8"));
    expect(loader).toMatch(/acceptPolicy\s*\(/);
    expect(loader).toMatch(/validatePolicy\s*\(/);
    expect(loader).toMatch(/realpathSync/);
    expect(loader).toMatch(/parseStrict\s*\(/);
    expect(loader).not.toMatch(/JSON\.parse/);
    // The committed path takes the ACCEPTING branch.
    expect(loader).toMatch(/accepted\s*\?\s*acceptPolicy/);
  });

  it("no control-plane workflow passes --policy, so no production loader takes the override branch", () => {
    for (const wf of readdirSync(".github/workflows").filter((f) => f.startsWith("straylight-"))) {
      const src = readFileSync(join(".github/workflows", wf), "utf8");
      expect(src, wf).not.toMatch(/--policy\b/);
    }
  });

  it("a script that only MENTIONS the policy in a comment is not in scope (and the transition check is such a script)", () => {
    const check = ".straylight/bin/policy-transition-check.mjs";
    expect(readFileSync(check, "utf8")).toContain(POLICY_FILE_NAME); // in its usage comment
    expect(executable(readFileSync(check, "utf8"))).not.toContain(POLICY_FILE_NAME);
    expect(policyLoadingScripts()).not.toContain(check);
    // It takes BOTH paths from argv with no defaults, so it can never become an
    // unlocked reader of the committed policy without entering the scan above.
    expect(executable(readFileSync(check, "utf8"))).toMatch(/--previous/);
    expect(executable(readFileSync(check, "utf8"))).toMatch(/--candidate/);
  });

  it("END TO END: the real gate accepts the committed policy in a staged tree", () => {
    const sl = stage(null);
    const r = runStaged(sl, "policy-gate.mjs");
    expect(r.status).toBe(0);
    expect(r.out).toEqual({ ok: true, enabled: true });
  });

  it("END TO END: editing the staged tree's accepted epoch stops the gate and the protocol check", () => {
    // Nothing but the policy JSON differs from the passing run above.
    const sl = stage((p) => { p.admission_history[0].lease_duration_minutes = 2880; });
    const gate = runStaged(sl, "policy-gate.mjs");
    expect(gate.status).toBe(2);
    expect(gate.out.ok).toBe(false);
    expect(gate.out.refusal).toBe("policy-invalid");
    expect(gate.out.detail).toMatch(/content digest/);

    const proto = runStaged(sl, "validate-protocol.mjs");
    expect(proto.status).not.toBe(0);
    expect(String(proto.out) + proto.stderr).toMatch(/policy/);
  });

  it("END TO END: appending an epoch to the staged policy without a lock also stops the gate", () => {
    const sl = stage((p) => {
      p.admission_history.push(makeEpoch({
        epoch_id: "epoch-002",
        governs_from: "2026-09-01T00:00:00Z",
        lease_duration_minutes: 999,
        provenance: { attributed_to: "test-fixture", reference: "unlocked hypothetical append" },
      }));
    });
    const gate = runStaged(sl, "policy-gate.mjs");
    expect(gate.status).toBe(2);
    expect(gate.out.refusal).toBe("policy-invalid");
    expect(gate.out.detail).toMatch(/accepted epoch lock\(s\)/);
  });

  it("the kill switch still works in the staged tree — suspension is a LIVE field, never epoched", () => {
    const sl = stage((p) => { p.enabled = false; });
    const gate = runStaged(sl, "policy-gate.mjs");
    expect(gate.status).toBe(3);
    expect(gate.out.ok).toBe(true);
    expect(gate.out.enabled).toBe(false);
  });
});

// =============================================================================
// E — the selector fails closed on its own contract.
// =============================================================================
describe("E — admissionPolicyFor refuses malformed input without help from validatePolicy", () => {
  const at = (iso: string) => parseIsoInstant(iso) as number;

  it("selects the epoch governing an instant, half-open [governs_from_i, governs_from_i+1)", () => {
    const a = makeEpoch({ epoch_id: "epoch-900", governs_from: "2026-07-01T00:00:00Z", lease_duration_minutes: 60 });
    const b = makeEpoch({ epoch_id: "epoch-901", governs_from: "2026-08-01T00:00:00Z", lease_duration_minutes: 600 });
    const policy = { admission_history: [a, b] };
    const pick = (iso: string) => admissionPolicyFor(policy, at(iso));
    // exactly ON a boundary → that epoch governs (inclusive lower bound)
    expect((pick("2026-07-01T00:00:00Z") as any).epoch_id).toBe("epoch-900");
    expect((pick("2026-07-31T23:59:59.999Z") as any).epoch_id).toBe("epoch-900");
    expect((pick("2026-08-01T00:00:00Z") as any).epoch_id).toBe("epoch-901");
    expect((pick("2099-01-01T00:00:00Z") as any).epoch_id).toBe("epoch-901"); // final epoch → forever
    const first = pick("2026-07-15T00:00:00Z");
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.index).toBe(0);
      expect(first.governs_from).toBe("2026-07-01T00:00:00Z");
      expect(first.admission.lease_duration_minutes).toBe(60);
      expect(Object.keys(first.admission).sort()).toEqual([...ADMISSION_FIELDS].sort());
    }
  });

  it("refuses an instant BEFORE the earliest epoch (no coverage → fail closed, never 'use the earliest anyway')", () => {
    const policy = makePolicy();
    const out = admissionPolicyFor(policy, at("2026-06-30T23:59:59Z"));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.errors.join("; ")).toMatch(/admission-epoch-unavailable/);
  });

  const badHistories: Array<[string, any]> = [
    ["missing history", undefined],
    ["non-array history", { epoch_id: "epoch-900" }],
    ["empty history", []],
    ["null epoch", [null]],
    ["non-object epoch", ["epoch-900"]],
    ["epoch missing lease_duration_minutes", [(() => { const e = makeEpoch(); delete (e as any).lease_duration_minutes; return e; })()]],
    ["epoch missing provenance", [(() => { const e = makeEpoch(); delete (e as any).provenance; return e; })()]],
    ["epoch with a malformed id", [makeEpoch({ epoch_id: "genesis" })]],
    ["epoch with an unparseable boundary", [makeEpoch({ governs_from: "yesterday" })]],
    ["epoch with an impossible calendar boundary", [makeEpoch({ governs_from: "2026-02-30T00:00:00Z" })]],
    ["duplicate epoch ids", [makeEpoch(), makeEpoch({ governs_from: "2026-08-01T00:00:00Z" })]],
    ["equal boundaries (ambiguous coverage)", [makeEpoch({ epoch_id: "epoch-900" }), makeEpoch({ epoch_id: "epoch-901" })]],
    ["descending boundaries", [makeEpoch({ epoch_id: "epoch-900", governs_from: "2026-08-01T00:00:00Z" }), makeEpoch({ epoch_id: "epoch-901", governs_from: "2026-07-01T00:00:00Z" })]],
  ];

  it("J11: refuses every malformed / duplicate / unordered history when called DIRECTLY", () => {
    for (const [label, history] of badHistories) {
      const out = admissionPolicyFor({ admission_history: history }, at("2026-07-15T00:00:00Z"));
      expect(out.ok, label).toBe(false);
      if (!out.ok) expect(out.errors.length, label).toBeGreaterThan(0);
      // The whole-policy validator agrees — the selector is not more permissive
      // than the validator that production runs first.
      expect(validatePolicy(makePolicy({ admission_history: history })).ok, `${label} (validatePolicy)`).toBe(false);
    }
  });

  it("refuses a non-object policy and a non-integer instant", () => {
    for (const p of [null, undefined, "policy", 7, [makeEpoch()]]) {
      expect(admissionPolicyFor(p, at(NOW)).ok, String(p)).toBe(false);
    }
    for (const t of [null, undefined, "2026-07-15T00:00:00Z", 1.5, NaN, Infinity]) {
      expect(admissionPolicyFor(makePolicy(), t).ok, String(t)).toBe(false);
    }
  });

  it("the documented contract matches the executable behavior, and claims no lock guarantee", () => {
    const src = readFileSync(".straylight/lib/validate.mjs", "utf8");
    const at = src.indexOf("export function admissionPolicyFor");
    const doc = src.slice(Math.max(0, src.lastIndexOf("// Resolve the admission policy", at)), at);
    expect(doc).toMatch(/STRUCTURAL selection only/);
    expect(doc).toMatch(/does NOT check the accepted-epoch digest locks/);
    expect(doc).toMatch(/reduce\(\) runs validatePolicy first/);
  });

  it("production reduce() still runs the full validator (including the locks) before selecting anything", () => {
    const reducer = executable(readFileSync(REDUCER_PATH, "utf8"));
    const validateAt = reducer.indexOf("validatePolicy(policy");
    const selectAt = reducer.indexOf("admissionPolicyFor(policy");
    expect(validateAt).toBeGreaterThan(-1);
    expect(selectAt).toBeGreaterThan(validateAt);
  });
});

// =============================================================================
// F — one time authority for event admission: the authenticated comment time.
// =============================================================================
describe("F — the reducer's run clock is not admission authority", () => {
  // Two epochs: a narrow lease window historically, a wide one now. The
  // top-level projection equals the FINAL epoch, as validatePolicy demands.
  const EARLY = makeEpoch({ epoch_id: "epoch-900", governs_from: "2026-07-01T00:00:00Z", lease_duration_minutes: 60 });
  const LATE = makeEpoch({ epoch_id: "epoch-901", governs_from: "2026-08-01T00:00:00Z", lease_duration_minutes: 600 });
  const twoEpoch = makePolicy({ admission_history: [EARLY, LATE], lease_duration_minutes: 600 });

  function leaseAcquire(observedAt: string, expiresAt: string, extraContext: Record<string, any> = {}) {
    const lane = makeLane({ state: "ready-for-claude", event_sequence: 2 });
    const event = makeEvent({
      sequence: 3, actor_role: "implementer", github_actor: "claude-login",
      event_type: "implementer.lease_acquired", prior_state: "ready-for-claude",
      lease_id: "lease-claude-1", lease_expires_at: expiresAt,
    });
    return reduce(lane, event, twoEpoch, {
      event_observed_at: observedAt, comment_author: "claude-login",
      task_packet: makeTaskPacket(), ...extraContext,
    } as any);
  }

  it("the policy is valid and its projection is the LATE epoch", () => {
    expect(validatePolicy(twoEpoch).ok).toBe(true);
    expect(twoEpoch.lease_duration_minutes).toBe(600);
  });

  it("an event observed under the EARLY epoch is judged by the EARLY lease bound, not the projection", () => {
    // 120m expiry: within the LATE/projection bound (600m), beyond EARLY's 60m.
    const out = leaseAcquire("2026-07-16T12:00:00Z", "2026-07-16T14:00:00Z");
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.refusal).toBe("lease-expiry-unbounded");
      expect(out.detail).toMatch(/grant \+ 60m/);
      expect(out.detail).not.toMatch(/600m/);
    }
    // Within EARLY's bound → accepted.
    expect(leaseAcquire("2026-07-16T12:00:00Z", "2026-07-16T12:59:00Z").ok).toBe(true);
  });

  it("the SAME event observed under the LATE epoch is accepted — the epoch follows the event's time", () => {
    const out = leaseAcquire("2026-08-02T12:00:00Z", "2026-08-02T14:00:00Z");
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.lane.lease?.expires_at).toBe("2026-08-02T14:00:00Z");
  });

  it("J10: a stray context.now cannot select an epoch or stand in for the observed time", () => {
    // A wall clock inside the LATE epoch does NOT widen a historical event's
    // bound: the event was observed in EARLY and stays judged under EARLY.
    const out = leaseAcquire("2026-07-16T12:00:00Z", "2026-07-16T14:00:00Z", { now: "2026-08-02T12:00:00Z" });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.refusal).toBe("lease-expiry-unbounded");

    // And a wall clock ALONE admits nothing.
    const lane = makeLane({ state: "planning", event_sequence: 0 });
    const event = makeEvent({ sequence: 1, event_type: "lane.activated", prior_state: "planning", occurred_at: NOW });
    for (const [label, context] of [
      ["no context at all", undefined],
      ["empty context", {}],
      ["context.now only", { now: NOW }],
      ["non-string event_observed_at", { event_observed_at: 1753476540000 }],
      ["unparseable event_observed_at", { event_observed_at: "2026-07-16 12:00" }],
      ["impossible calendar instant", { event_observed_at: "2026-02-30T00:00:00Z" }],
    ] as Array<[string, any]>) {
      const out2 = reduce(lane, event, twoEpoch, context);
      expect(out2.ok, label).toBe(false);
      if (!out2.ok) {
        expect(out2.refusal, label).toBe("event-time-unavailable");
        expect(out2.detail, label).toMatch(/reducer run clock is not admission authority/);
      }
    }
    // The actor-supplied occurred_at is not a substitute either: the event above
    // carries one, and it did not admit the event.
    expect(event.occurred_at).toBe(NOW);
  });

  it("an event observed before the genesis boundary fails closed rather than inventing authority", () => {
    const lane = makeLane({ state: "planning", event_sequence: 0 });
    const event = makeEvent({ sequence: 1, event_type: "lane.activated", prior_state: "planning" });
    const out = reduce(lane, event, twoEpoch, { event_observed_at: "2026-06-30T00:00:00Z" });
    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.refusal).toBe("admission-epoch-unresolved");
      expect(out.detail).toMatch(/admission-epoch-unavailable/);
    }
  });

  it("source: the reducer has no wall clock at all — no context.now, no Date", () => {
    const src = executable(readFileSync(REDUCER_PATH, "utf8"));
    expect(src).not.toMatch(/context\.now/);
    expect(src).not.toMatch(/\bDate\.now\s*\(/);
    expect(src).not.toMatch(/new\s+Date\s*\(/);
    // The one time authority, named once, in one helper.
    expect(src).toMatch(/context\.event_observed_at/);
    // The declared interface must not offer a `now` either: a declared-but-dead
    // field is exactly the ambiguity this closes.
    const dts = readFileSync(".straylight/lib/reducer.d.mts", "utf8");
    const ctx = dts.slice(dts.indexOf("interface ReduceContext"), dts.indexOf("export type ReduceDecision"));
    expect(ctx).not.toMatch(/^\s*now\??:/m);
    expect(ctx).toMatch(/event_observed_at: string;/);
  });

  it("the production reconstruction adapter supplies no clock, and reconstruct binds the authenticated comment time", () => {
    const adapter = executable(readFileSync(".straylight/bin/reduce-issue.mjs", "utf8"));
    expect(adapter).not.toMatch(/new\s+Date\s*\(/);
    expect(adapter).not.toMatch(/\bnow\b/);
    const reconstruct = executable(readFileSync(".straylight/lib/reconstruct.mjs", "utf8"));
    expect(reconstruct).toMatch(/event_observed_at:\s*comment\.created_at/);
    expect(reconstruct).not.toMatch(/event_observed_at:\s*[^\n]*(now|Date)/);
  });
});

// =============================================================================
// G — the top-level projection, and every consumer of the four fields.
// =============================================================================
describe("G — the four top-level fields are a required projection, never historical authority", () => {
  it("the projection is REQUIRED in v2: dropping any of the four fails closed", () => {
    for (const field of ADMISSION_FIELDS) {
      const policy = committedPolicy();
      delete policy[field];
      const out = validatePolicy(policy);
      expect(out.ok, field).toBe(false);
      if (!out.ok) expect(out.errors.join("; "), field).toMatch(new RegExp(field));
    }
  });

  it("the projection must deep-equal the final epoch: any disagreement fails closed", () => {
    const disagreements: Array<[string, (p: any) => void]> = [
      ["lease_duration_minutes", (p) => { p.lease_duration_minutes = 300; }],
      ["maximum_patch_cycles", (p) => { p.maximum_patch_cycles = 2; }],
      ["authorized_corridor", (p) => { p.authorized_corridor = [...p.authorized_corridor, "phase-50c"]; }],
      ["actor_allowlist", (p) => { p.actor_allowlist.auditor = ["someone-else"]; }],
    ];
    for (const [field, mutate] of disagreements) {
      const policy = committedPolicy();
      mutate(policy);
      const out = validatePolicy(policy);
      expect(out.ok, field).toBe(false);
      if (!out.ok) {
        expect(out.errors.join("; "), field).toMatch(
          new RegExp(`${field}: top-level projection does not equal the final admission epoch`),
        );
      }
    }
  });

  it("with several epochs the projection tracks the FINAL one, not the first", () => {
    const early = makeEpoch({ epoch_id: "epoch-900", governs_from: "2026-07-01T00:00:00Z", lease_duration_minutes: 60 });
    const late = makeEpoch({ epoch_id: "epoch-901", governs_from: "2026-08-01T00:00:00Z", lease_duration_minutes: 600 });
    expect(validatePolicy(makePolicy({ admission_history: [early, late], lease_duration_minutes: 600 })).ok).toBe(true);
    expect(validatePolicy(makePolicy({ admission_history: [early, late], lease_duration_minutes: 60 })).ok).toBe(false);
  });

  it("J9: the reducer reads the four fields ONLY from the resolved epoch, never from the live policy", () => {
    const src = executable(readFileSync(REDUCER_PATH, "utf8"));
    for (const field of ADMISSION_FIELDS) {
      expect(src, `reducer must not read policy.${field}`).not.toMatch(new RegExp(`policy\\.${field}`));
      expect(src, `reducer must not read policy?.${field}`).not.toMatch(new RegExp(`policy\\?\\.${field}`));
    }
    // Each field that the reducer uses at all is read off the resolved epoch.
    for (const field of ["authorized_corridor", "maximum_patch_cycles", "lease_duration_minutes", "actor_allowlist"]) {
      expect(src, `reducer must read admission.${field}`).toMatch(new RegExp(`admission\\.${field}|admission\\?\\.${field}`));
    }
    // The live policy is consulted for LIVE fields only.
    expect(src).toMatch(/policy\.enabled/);
  });

  it("every consumer of the four admission fields in the repository is classified", () => {
    // Mechanical audit: any .mjs/.mts under .straylight/ or scripts/ that names
    // one of the four fields must appear here with a declared reading. A new
    // consumer fails this test until it is classified — which is the point.
    const CLASSIFIED: Record<string, string> = {
      ".straylight/lib/validate.mjs": "defines and validates the fields (projection + epochs)",
      ".straylight/lib/validate.d.mts": "type surface for the above",
      ".straylight/lib/reducer.mjs": "reads them ONLY from the resolved admission epoch",
      ".straylight/lib/admission-locks.mjs": "names them in the doctrine header; reads none",
      ".straylight/lib/policy-transition.mjs": "compares them across a policy change (append-only guard)",
      ".straylight/bin/plan-bootstrap-write.mjs": "writes the genesis LANE record's own authorized_corridor (lane field, not a policy read)",
      "scripts/capture-cp-lane-history.mjs": "records the resolved epoch's admission in the baseline provenance",
    };
    const roots = [".straylight/lib", ".straylight/bin", "scripts"];
    const found: string[] = [];
    for (const dir of roots) {
      for (const f of readdirSync(dir)) {
        if (!/\.(mjs|mts)$/.test(f)) continue;
        const path = join(dir, f);
        const src = readFileSync(path, "utf8");
        if (ADMISSION_FIELDS.some((field) => src.includes(field))) found.push(path);
      }
    }
    expect(found.sort()).toEqual(Object.keys(CLASSIFIED).sort());
  });

  it("the genesis lane record's corridor cannot drift from the committed policy corridor", () => {
    const src = readFileSync(".straylight/bin/plan-bootstrap-write.mjs", "utf8");
    const m = src.match(/authorized_corridor:\s*(\[[^\]]*\])/);
    expect(m).not.toBeNull();
    expect(JSON.parse(m![1]!.replace(/\s+/g, " "))).toEqual(committedPolicy().authorized_corridor);
  });

  it("the capture harness records admission from the FINAL epoch, never from a top-level field it might not find", () => {
    const src = executable(readFileSync("scripts/capture-cp-lane-history.mjs", "utf8"));
    // It loads the policy through the accepting loader...
    expect(src).toMatch(/loadProtocolPolicy/);
    // ...and resolves current admission from the final epoch when there is a
    // history, so it works against the v1 policy the pre-migration baselines
    // were captured under AND against v2 without depending on the projection.
    expect(src).toMatch(/history\[history\.length - 1\]/);
    expect(src).not.toMatch(/policy\.lease_duration_minutes/);
    expect(src).toMatch(/epoch_id/);
  });
});

// =============================================================================
// K — the closed policy shape.
// =============================================================================
describe("K — nothing admission-shaped can sit in the policy without force", () => {
  // Splice raw members into serialized policy text so keys like __proto__
  // survive as OWN properties (an object literal would set the prototype).
  function policyFromTextWith(rawMembers: string): any {
    const valid = JSON.stringify(committedPolicy(), null, 2);
    const parsed = parseStrict(`{\n  ${rawMembers},${valid.slice(1)}`);
    expect(parsed.ok).toBe(true);
    return (parsed as any).value;
  }

  it("an unknown top-level key is refused, not ignored", () => {
    for (const raw of [
      '"lease_duration_hours": 48',
      '"maximum_patch_cycle": 9',
      '"actor_allow_list": {}',
      '"admission_epochs": []',
      '"note": "not a documentation key"',
      '"_Kill_Switch": "wrong case for a doc key"',
      '"__proto__": {"lease_duration_minutes": 2880}',
      '"constructor": 1',
    ]) {
      const out = validatePolicy(policyFromTextWith(raw));
      expect(out.ok, raw).toBe(false);
      if (!out.ok) expect(out.errors.join("; "), raw).toMatch(/unknown top-level policy key/);
    }
  });

  it("an unknown admission-like key cannot become implicit authority even when it looks official", () => {
    const policy = policyFromTextWith('"lease_duration_hours": 48');
    expect(validatePolicy(policy).ok).toBe(false);
    expect(acceptPolicy(policy).ok).toBe(false);
    // and it changes nothing about the resolved admission policy
    const resolved = admissionPolicyFor(committedPolicy(), parseIsoInstant("2026-08-01T00:00:00Z") as number);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.admission.lease_duration_minutes).toBe(240);
  });

  it("intentional documentation keys ARE allowed, and the committed policy uses them", () => {
    const policy = committedPolicy();
    const docKeys = Object.keys(policy).filter((k) => k.startsWith("_"));
    expect(docKeys).toContain("_kill_switch");
    expect(docKeys.length).toBeGreaterThanOrEqual(5);
    for (const k of docKeys) expect(k).toMatch(/^_[a-z][a-z0-9_]*$/);
    expect(validatePolicy({ ...policy, _future_note: "inert by construction" }).ok).toBe(true);
    // Doc keys carry no force: nothing in the protocol reads one.
    for (const dir of [".straylight/lib", ".straylight/bin"]) {
      for (const f of readdirSync(dir).filter((x) => x.endsWith(".mjs"))) {
        const src = executable(readFileSync(join(dir, f), "utf8"));
        for (const k of docKeys) expect(src, `${dir}/${f} reads ${k}`).not.toContain(k);
      }
    }
  });

  it("the epoch, provenance and allowlist shapes are closed too", () => {
    const unknownEpochKey = committedPolicy();
    unknownEpochKey.admission_history[0].effective_until = "2026-12-01T00:00:00Z";
    expect((validatePolicy(unknownEpochKey) as any).errors.join("; ")).toMatch(/unknown epoch key/);

    const unknownProv = committedPolicy();
    unknownProv.admission_history[0].provenance.signature = "not a signature";
    expect((validatePolicy(unknownProv) as any).errors.join("; ")).toMatch(/unknown provenance key/);

    const unknownRole = committedPolicy();
    unknownRole.admission_history[0].actor_allowlist.reviewer = ["someone-else"];
    syncProjection(unknownRole);
    expect((validatePolicy(unknownRole) as any).errors.join("; ")).toMatch(/unknown role key/);
    expect(ACTOR_ROLES).not.toContain("reviewer");
  });

  it("a bot identity in the operator role is still refused, in the epoch and in the projection", () => {
    const policy = committedPolicy();
    policy.admission_history[0].actor_allowlist.operator = ["eileen1337", "github-actions[bot]"];
    syncProjection(policy);
    const out = validatePolicy(policy);
    expect(out.ok).toBe(false);
    expect((out as any).errors.join("; ")).toMatch(/bot identities are forbidden in the operator role/);
    // reported for BOTH the epoch and the projection — one implementation,
    // used for both, so the projection is never checked more loosely
    expect((out as any).errors.filter((e: string) => /bot identities/.test(e)).length).toBeGreaterThanOrEqual(2);
  });
});

// =============================================================================
// D — provenance is metadata. No string in the file authenticates anyone.
// =============================================================================
describe("D — provenance is inspectable metadata, not self-authorization", () => {
  it("the protocol performs no identity check on provenance: any non-blank attribution validates", () => {
    for (const who of ["operator:eileen", "someone-else", "not-the-operator", "a description of nothing"]) {
      const policy = makePolicy({
        admission_history: [makeEpoch({ provenance: { attributed_to: who, reference: "tests/control-plane/admission-epochs.test.ts" } })],
      });
      expect(validatePolicy(policy).ok, who).toBe(true);
    }
    // Blank/absent attribution is a shape error, not an authority decision.
    expect(validatePolicy(makePolicy({ admission_history: [makeEpoch({ provenance: { reference: "x-ref" } })] })).ok).toBe(false);
  });

  it("no protocol code compares an attribution string against an operator identity", () => {
    for (const dir of [".straylight/lib", ".straylight/bin"]) {
      for (const f of readdirSync(dir).filter((x) => x.endsWith(".mjs"))) {
        const src = executable(readFileSync(join(dir, f), "utf8"));
        expect(src, `${dir}/${f}`).not.toMatch(/attributed_to\s*(===|!==|==|!=)/);
        expect(src, `${dir}/${f}`).not.toMatch(/attributed_to[^\n]*(match|test|startsWith|includes)\s*\(/);
        expect(src, `${dir}/${f}`).not.toMatch(/"operator:[a-z]+"/);
      }
    }
    // The validator says so where it does the checking.
    const validate = readFileSync(".straylight/lib/validate.mjs", "utf8");
    expect(validate).toMatch(/deliberately NOT pattern-matched/);
  });

  it("provenance is nevertheless BOUND: it cannot be rewritten after acceptance", () => {
    const policy = committedPolicy();
    expect(policy.admission_history[0].provenance.attributed_to).toBe("operator:eileen");
    policy.admission_history[0].provenance.attributed_to = "someone-else";
    expect(acceptPolicy(policy).ok).toBe(false);
    expect(validatePolicy(policy).ok).toBe(false);
  });

  it("the committed epoch says plainly that attribution is not authentication", () => {
    const note = committedPolicy().admission_history[0].provenance.note;
    expect(note).toMatch(/descriptive metadata, not authentication/i);
    expect(note).toMatch(/reviewed repository change/i);
  });
});

// =============================================================================
// C — the genesis boundary is evidence-derived.
// =============================================================================
describe("C — the genesis epoch begins at the earliest proven durable event", () => {
  it("governs_from is the authenticated created_at of lane #118 comment 5080520742", () => {
    const genesis = committedPolicy().admission_history[0];
    expect(genesis.epoch_id).toBe("epoch-001");
    expect(genesis.governs_from).toBe("2026-07-25T20:49:00Z");
    expect(genesis.provenance.note).toMatch(/5080520742/);
    expect(genesis.provenance.note).toMatch(/earliest durable protocol event/i);
  });

  it("it is not backdated: no January boundary, and no claim of authority before the control plane existed", () => {
    const genesis = committedPolicy().admission_history[0];
    expect(genesis.governs_from).not.toBe("2026-01-01T00:00:00Z");
    expect(parseIsoInstant(genesis.governs_from)).toBeGreaterThan(parseIsoInstant("2026-07-01T00:00:00Z") as number);
    expect(genesis.provenance.note).toMatch(/asserts nothing about authorization before that instant/i);
  });

  it("the genesis epoch transcribes the four v1 admission fields that were actually shipped", () => {
    const genesis = committedPolicy().admission_history[0];
    expect(genesis.maximum_patch_cycles).toBe(3);
    expect(genesis.lease_duration_minutes).toBe(240);
    expect(genesis.authorized_corridor).toEqual(["phase-49p", "phase-49q", "phase-50a", "phase-50b"]);
    expect(Object.keys(genesis.actor_allowlist).sort()).toEqual([...ACTOR_ROLES].sort());
    expect(genesis.provenance.note).toMatch(/5625c5be425c71fce90a22e81d123b42ed104538/);
  });

  it("the current shipped lease duration is still 240 minutes and no later epoch exists yet", () => {
    const policy = committedPolicy();
    expect(policy.admission_history).toHaveLength(1);
    expect(policy.lease_duration_minutes).toBe(240);
    expect(committedText()).not.toMatch(/2880/);
  });

  it("the fixture epoch boundary is synthetic and distinct from the genesis boundary", () => {
    expect(FIXTURE_EPOCH_FROM).not.toBe(committedPolicy().admission_history[0].governs_from);
    expect(BASE_SHA).not.toBe("5625c5be425c71fce90a22e81d123b42ed104538");
  });
});
