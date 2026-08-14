// Control Plane v1 — direct regressions for the Codex eighth-round
// findings. One describe() per finding; each test reproduces the reported
// failure shape against the patched code.
//
//  H1  policy-gate.mjs parsed the policy with JSON.parse, which silently
//      keeps the LAST occurrence of a duplicate object key. A policy text
//      reading {"enabled": false, ..., "enabled": true} — which a human
//      reviewing the kill switch reads as DISABLED — would have validated
//      as an ENABLED policy (and true-then-false would read as enabled but
//      gate as a kill switch). The gate now reads the policy as TEXT and
//      parses it through the duplicate-key-rejecting strict parser
//      (.straylight/lib/strict-json.mjs — the same parser the protocol
//      markers trust) BEFORE validatePolicy: ANY duplicate key anywhere in
//      the document (top-level or nested) exits 2 (fail closed — a
//      contradictory policy is ambiguous, never "last wins"). Valid
//      policies are untouched: boolean enabled:true still exits 0, boolean
//      enabled:false still exits 3, and every prior malformed-enabled
//      regression stays closed.
//
//  H2  the reducer, watchdog, and merge-guard workflows checked out the
//      DISPATCH ref: a manual workflow_dispatch selecting an older or
//      non-main ref would have made them evaluate an OLDER committed
//      automation policy (e.g. one from before a kill-switch engagement)
//      and OLDER control-plane code as policy authority. All four
//      control-plane workflows (bootstrap was already pinned, B10) now
//      pin actions/checkout to `ref: main`, preserving recursive
//      submodules, so the canonical policy gate, the committed policy,
//      and all protocol/reconstruction code are always loaded from
//      CURRENT MAIN regardless of the event ref.

import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseStrict } from "../../.straylight/lib/strict-json.mjs";
import { makePolicy } from "./_fixtures.js";

const GATE = ".straylight/bin/policy-gate.mjs";
const POLICY_SOURCE = ".straylight/lib/policy-source.mjs";
const CP_WORKFLOWS = [
  ".github/workflows/straylight-reducer.yml",
  ".github/workflows/straylight-watchdog.yml",
  ".github/workflows/straylight-merge-guard.yml",
  ".github/workflows/straylight-bootstrap.yml",
] as const;

const tmp = mkdtempSync(join(tmpdir(), "cp-round8-gate-"));
let n = 0;

// Run the gate against raw policy TEXT (duplicate keys cannot survive a
// JSON.stringify round-trip, so these fixtures must stay strings).
function runGateText(policyText: string): { status: number; out: any } {
  const file = join(tmp, `policy-${n++}.json`);
  writeFileSync(file, policyText);
  try {
    const stdout = execFileSync("node", [GATE, "--policy", file], { encoding: "utf8" });
    return { status: 0, out: JSON.parse(stdout) };
  } catch (e: any) {
    return { status: e.status ?? -1, out: e.stdout ? JSON.parse(e.stdout) : null };
  }
}

// Splice extra raw members into the serialized valid policy so the result
// is well-formed JSON.parse-able text that differs only by the duplicates.
function policyTextWithRawMembers(rawMembers: string): string {
  const valid = JSON.stringify(makePolicy(), null, 2);
  expect(valid.startsWith("{")).toBe(true);
  return `{\n  ${rawMembers},${valid.slice(1)}`;
}

// =============================================================================
// H1 — the gate rejects duplicate keys: strict parser, never JSON.parse.
// =============================================================================
describe("H1 — policy-gate parses the policy text strictly; duplicate keys fail closed", () => {
  it('duplicate enabled FALSE then TRUE → exit 2 (JSON.parse would have gated it as ENABLED)', () => {
    // The valid fixture already carries "enabled": true, so prepending
    // "enabled": false yields false-then-true — the human-visible first
    // occurrence says the kill switch is engaged.
    const text = policyTextWithRawMembers('"enabled": false');
    // Prove the decoy: the host JSON.parse accepts this text and reads it
    // as an ENABLED policy (last duplicate wins).
    expect(JSON.parse(text).enabled).toBe(true);
    const r = runGateText(text);
    expect(r.status).toBe(2);
    expect(r.status).not.toBe(0);
    expect(r.status).not.toBe(3);
    expect(r.out.ok).toBe(false);
    expect(r.out.refusal).toBe("policy-unreadable");
    expect(r.out.detail).toMatch(/duplicate-object-key/);
  });

  it('duplicate enabled TRUE then FALSE → exit 2 (never a valid kill switch)', () => {
    // Serialize a valid DISABLED policy and prepend "enabled": true —
    // true-then-false. JSON.parse reads it as disabled (exit 3 shape);
    // the strict gate refuses the contradiction outright.
    const valid = JSON.stringify(makePolicy({ enabled: false }), null, 2);
    const text = `{\n  "enabled": true,${valid.slice(1)}`;
    expect(JSON.parse(text).enabled).toBe(false);
    const r = runGateText(text);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("policy-unreadable");
    expect(r.out.detail).toMatch(/duplicate-object-key/);
  });

  it("a duplicate key in a NESTED policy object also fails closed at exit 2", () => {
    // Duplicate inside actor_allowlist: same operator key twice. The
    // policy is otherwise fully valid and JSON.parse-able.
    const valid = JSON.stringify(makePolicy(), null, 2);
    const text = valid.replace(
      '"operator": [',
      '"operator": ["someone-else"], "operator": [',
    );
    expect(text).not.toBe(valid);
    expect(() => JSON.parse(text)).not.toThrow(); // the decoy parses fine loosely
    const r = runGateText(text);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("policy-unreadable");
    expect(r.out.detail).toMatch(/duplicate-object-key/);
  });

  it("a duplicate NON-enabled top-level key (e.g. mode) also fails closed", () => {
    const text = policyTextWithRawMembers('"mode": "shadow"');
    const r = runGateText(text);
    expect(r.status).toBe(2);
    expect(r.out.refusal).toBe("policy-unreadable");
  });

  it("ordinary valid policy behavior is unchanged: boolean true → exit 0, boolean false → exit 3", () => {
    const enabled = runGateText(JSON.stringify(makePolicy(), null, 2));
    expect(enabled.status).toBe(0);
    expect(enabled.out).toEqual({ ok: true, enabled: true });
    const killed = runGateText(JSON.stringify(makePolicy({ enabled: false }), null, 2));
    expect(killed.status).toBe(3);
    expect(killed.out.ok).toBe(true);
    expect(killed.out.enabled).toBe(false);
    expect(killed.out.refusal).toBe("automation-disabled");
  });

  it("the COMMITTED policy passes the strict parser and still gates exit 0 with no --policy", () => {
    const committed = readFileSync(".straylight/automation-policy.json", "utf8");
    expect(parseStrict(committed).ok).toBe(true);
    const stdout = execFileSync("node", [GATE], { encoding: "utf8" });
    expect(JSON.parse(stdout)).toEqual({ ok: true, enabled: true });
  });

  it("malformed JSON and prior malformed-enabled regressions remain closed at exit 2", () => {
    expect(runGateText("{ not json ]").status).toBe(2);
    for (const bad of ['"true"', '"false"', "null", "1", "0", "[]", '{"enabled": true}']) {
      const valid = JSON.stringify(makePolicy(), null, 2);
      const text = valid.replace('"enabled": true', `"enabled": ${bad}`);
      expect(text).not.toBe(valid);
      const r = runGateText(text);
      expect(r.status, `enabled as ${bad}`).toBe(2);
    }
    // missing enabled entirely
    const noEnabled = makePolicy();
    delete (noEnabled as any).enabled;
    expect(runGateText(JSON.stringify(noEnabled, null, 2)).status).toBe(2);
  });

  it("source pin: neither the gate nor the loader calls JSON.parse; the text flows through parseStrict before validation", () => {
    // The read → strict-parse → validate sequence now lives in the ONE shared
    // loader the gate delegates to (policy-source.mjs), so the pin follows the
    // code there rather than asserting an order the gate no longer performs.
    const gate = readFileSync(GATE, "utf8");
    const loader = readFileSync(POLICY_SOURCE, "utf8");
    // Comments may EXPLAIN why JSON.parse is banned; executable lines may
    // not invoke it.
    const executable = (s: string) => s.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(executable(gate)).not.toMatch(/JSON\.parse/);
    expect(executable(loader)).not.toMatch(/JSON\.parse/);
    expect(loader).toMatch(/import \{ parseStrict \} from "\.\/strict-json\.mjs"/);
    const read = loader.indexOf("readFileSync(path");
    const strict = loader.indexOf("parseStrict(text)");
    const accept = loader.indexOf("acceptPolicy(parsed.value)");
    const validate = loader.indexOf("validatePolicy(parsed.value)");
    expect(read).toBeGreaterThan(-1);
    expect(strict).toBeGreaterThan(read);
    expect(accept).toBeGreaterThan(strict);
    expect(validate).toBeGreaterThan(strict);
  });

  it("the gate stays dependency-free and no-network with the strict parser wired in", () => {
    for (const [file, allowed] of [
      [GATE, ["../lib/policy-source.mjs"]],
      [POLICY_SOURCE, ["./strict-json.mjs", "./validate.mjs"]],
    ] as const) {
      const src = readFileSync(file, "utf8");
      const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1] ?? "");
      expect(imports.length, file).toBeGreaterThan(0);
      expect(imports.every((s) => s.startsWith("node:") || allowed.includes(s as never)), `${file}: ${imports.join(", ")}`).toBe(true);
      expect(src, file).not.toMatch(/fetch\(|https?:\/\//);
    }
  });

  it("output contract preserved: single JSON result with ok/enabled/refusal/detail shapes", () => {
    // exit 0 → { ok: true, enabled: true } exactly.
    expect(runGateText(JSON.stringify(makePolicy())).out).toEqual({ ok: true, enabled: true });
    // exit 3 → ok:true, enabled:false, refusal + detail strings.
    const killed = runGateText(JSON.stringify(makePolicy({ enabled: false }))).out;
    expect(Object.keys(killed).sort()).toEqual(["detail", "enabled", "ok", "refusal"]);
    // exit 2 (unreadable) → ok:false, refusal + detail strings, no enabled.
    const dup = runGateText(policyTextWithRawMembers('"enabled": false')).out;
    expect(dup.ok).toBe(false);
    expect(dup.enabled).toBeUndefined();
    expect(typeof dup.refusal).toBe("string");
    expect(typeof dup.detail).toBe("string");
  });
});

// =============================================================================
// H2 — every control-plane workflow executes from current main.
// =============================================================================
describe("H2 — reducer, watchdog, merge guard, and bootstrap checkouts are pinned to main", () => {
  // The checkout step's `with:` block, extracted per workflow.
  function checkoutBlock(f: string): string {
    const src = readFileSync(f, "utf8");
    const at = src.indexOf("uses: actions/checkout@");
    expect(at, f).toBeGreaterThan(-1);
    const next = src.indexOf("- name:", at);
    return src.slice(at, next === -1 ? undefined : next);
  }

  it("all four workflows pin actions/checkout to ref: main", () => {
    for (const f of CP_WORKFLOWS) {
      expect(checkoutBlock(f), f).toMatch(/^\s+ref: main\s*$/m);
    }
  });

  it("all four workflows preserve recursive submodule checkout", () => {
    for (const f of CP_WORKFLOWS) {
      expect(checkoutBlock(f), f).toMatch(/^\s+submodules: recursive\s*$/m);
    }
  });

  it("each workflow has exactly ONE checkout, so no second checkout can reintroduce the dispatch ref", () => {
    for (const f of CP_WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      expect(src.match(/uses: actions\/checkout@/g), f).toHaveLength(1);
    }
  });

  it("no control-plane workflow uses the dispatch/event ref as checkout or policy authority", () => {
    for (const f of CP_WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      // No ref: expression other than the literal main pin.
      for (const line of src.split("\n").filter((l) => /^\s+ref:/.test(l))) {
        expect(line.trim(), `${f}: ${line}`).toBe("ref: main");
      }
      // No event-supplied ref/sha ever reaches checkout or the gate.
      expect(src, f).not.toMatch(/github\.event\.(ref|after|pull_request)/);
      expect(src, f).not.toMatch(/github\.(sha|ref|head_ref|ref_name)/);
      expect(src, f).not.toMatch(/inputs\.(ref|sha|branch)/);
      // The gate runs against the checked-out (main) committed policy —
      // never against a --policy override the dispatcher could point
      // somewhere else.
      expect(src, f).toMatch(/node \.straylight\/bin\/policy-gate\.mjs\s*$/m);
      expect(src, f).not.toMatch(/policy-gate\.mjs --policy/);
    }
  });

  it("the checkout still uses the SHA-pinned first-party action (no tag drift)", () => {
    for (const f of CP_WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toMatch(/uses: actions\/checkout@[0-9a-f]{40}/);
    }
  });

  it("bootstrap remains pinned to main and still re-resolves base from origin/main (B10 posture intact)", () => {
    const wf = readFileSync(".github/workflows/straylight-bootstrap.yml", "utf8");
    expect(wf).toMatch(/^\s+ref: main\s*$/m);
    expect(wf).toMatch(/git fetch[^\n]*origin main/);
    expect(wf).toMatch(/git rev-parse (FETCH_HEAD|origin\/main)/);
    expect(wf).not.toMatch(/BASE_SHA=\$\(git rev-parse HEAD\)/);
  });
});
