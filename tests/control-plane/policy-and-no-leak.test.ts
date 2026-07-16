// Control Plane v1 — committed policy invariants and no-leak checks.
// Pins the ACTUAL committed .straylight/ artifacts (not fixtures) against
// the ADR-050 mandate: shadow mode, kill switch, auto-merge off, corridor
// bounded to MVP-2, and no embedded credentials anywhere in the protocol.

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { validatePolicy } from "../../.straylight/lib/validate.mjs";

const ROOT = ".straylight";
const policy = JSON.parse(readFileSync(join(ROOT, "automation-policy.json"), "utf8"));

describe("committed automation policy", () => {
  it("satisfies the v1 validator", () => {
    expect(validatePolicy(policy).ok).toBe(true);
  });

  it("is shadow mode with auto_merge=false and an obvious kill switch", () => {
    expect(policy.mode).toBe("shadow");
    expect(policy.auto_merge).toBe(false);
    expect(typeof policy.enabled).toBe("boolean");
    expect(policy._kill_switch).toContain("enabled");
  });

  it("authorizes exactly the MVP-2 corridor and nothing beyond", () => {
    expect(policy.authorized_corridor).toEqual([
      "phase-49p", "phase-49q", "phase-50a", "phase-50b",
    ]);
    expect(policy.automatic_progression_beyond_mvp2).toBe(false);
  });

  it("forbids every automatic authority-bearing action", () => {
    expect(policy.automatic_estate_semantic_decisions).toBe(false);
    expect(policy.automatic_cross_repo_contract_changes).toBe(false);
    expect(policy.automatic_sibling_repo_edits).toBe(false);
    expect(policy.automatic_external_infrastructure).toBe(false);
    expect(policy.automatic_secret_use).toBe(false);
  });

  it("bounds patch cycles and leases", () => {
    expect(policy.maximum_patch_cycles).toBe(3);
    expect(policy.lease_duration_minutes).toBeGreaterThan(0);
  });

  it("kill switch flipped off is honored by the validator-level reducer path", () => {
    // Flipping enabled must not make the policy invalid (the switch is
    // legal) — the reducer refuses events instead (covered in reducer tests).
    expect(validatePolicy({ ...policy, enabled: false }).ok).toBe(true);
  });

  it("committed allowlist: single-operator posture is real — same login in all model roles, bot in system only", () => {
    // Recorded ADR-050 §6 limitation, pinned as committed: the operator's
    // login carries every model role (no cryptographic separation in v1),
    // and the CI bot appears ONLY under system.
    const al = policy.actor_allowlist;
    for (const role of ["coordinator", "implementer", "auditor", "operator"]) {
      expect(al[role], role).toContain("eileen1337");
      expect(al[role].some((l: string) => l.endsWith("[bot]")), role).toBe(false);
    }
    expect(al.system).toContain("github-actions[bot]");
  });
});

describe("schema/validator contract sync", () => {
  it("every schema-required field is referenced by the executable validator", () => {
    const validateSrc = readFileSync(".straylight/lib/validate.mjs", "utf8");
    for (const file of [
      "lane-v1.schema.json",
      "event-v1.schema.json",
      "task-packet-v1.schema.json",
      "audit-v1.schema.json",
    ]) {
      const schema = JSON.parse(readFileSync(join(ROOT, "schemas", file), "utf8"));
      for (const field of schema.required ?? []) {
        expect(validateSrc, `${file} required field ${field}`).toContain(`"${field}"`);
      }
    }
  });

  it("v1 schema consts match the validator invariants", () => {
    const lane = JSON.parse(readFileSync(join(ROOT, "schemas", "lane-v1.schema.json"), "utf8"));
    expect(lane.properties.mode.const).toBe("shadow");
    expect(lane.properties.auto_merge_allowed.const).toBe(false);
    const packet = JSON.parse(readFileSync(join(ROOT, "schemas", "task-packet-v1.schema.json"), "utf8"));
    expect(packet.properties.merge_forbidden.const).toBe(true);
    const audit = JSON.parse(readFileSync(join(ROOT, "schemas", "audit-v1.schema.json"), "utf8"));
    expect(audit.properties.audit_committed_in_pr.const).toBe(false);
  });

  it("published schema patterns equal the executable validator regexes", () => {
    // The validator's regex SOURCES, verbatim. If validate.mjs changes a
    // pattern, the published schema must change with it (and vice versa).
    const validateSrc = readFileSync(".straylight/lib/validate.mjs", "utf8");
    const lane = JSON.parse(readFileSync(join(ROOT, "schemas", "lane-v1.schema.json"), "utf8"));
    const event = JSON.parse(readFileSync(join(ROOT, "schemas", "event-v1.schema.json"), "utf8"));
    const auditS = JSON.parse(readFileSync(join(ROOT, "schemas", "audit-v1.schema.json"), "utf8"));
    const packet = JSON.parse(readFileSync(join(ROOT, "schemas", "task-packet-v1.schema.json"), "utf8"));

    const branchPattern = "^[A-Za-z0-9._/-]{1,200}$";
    expect(validateSrc).toContain("BRANCH_RE = /^[A-Za-z0-9._/-]{1,200}$/");
    for (const [schema, field] of [
      [lane, "base_branch"], [lane, "working_branch"],
      [auditS, "base_branch"], [auditS, "head_branch"],
      [packet, "target_branch"],
    ] as const) {
      expect(schema.properties[field].pattern, field).toBe(branchPattern);
    }

    const loginPattern = "^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}(\\[bot\\])?$";
    expect(event.properties.github_actor.pattern).toBe(loginPattern);
    expect(validateSrc).toContain("GH_LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}(\\[bot\\])?$/");

    const shaPattern = "^[0-9a-f]{40}$";
    expect(validateSrc).toContain("SHA_RE = /^[0-9a-f]{40}$/");
    for (const [schema, field] of [
      [lane, "base_sha"], [event, "base_sha"], [event, "head_sha"], [event, "audited_sha"],
      [auditS, "base_sha"], [auditS, "audited_head_sha"], [packet, "base_sha"],
    ] as const) {
      expect(schema.properties[field].pattern, field).toBe(shaPattern);
    }
  });
});

describe("no-leak checks", () => {
  function* walk(dir: string): Generator<string> {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) yield* walk(p);
      else yield p;
    }
  }

  const SECRET_PATTERNS = [
    /ghp_[A-Za-z0-9]{20,}/, // GitHub PAT
    /gho_[A-Za-z0-9]{20,}/, // GitHub OAuth token
    /github_pat_[A-Za-z0-9_]{20,}/,
    /sk-[A-Za-z0-9]{20,}/, // OpenAI-style key
    /sk-ant-[A-Za-z0-9-]{20,}/, // Anthropic key
    /AKIA[0-9A-Z]{16}/, // AWS access key
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /AUTH_TOKEN\s*[:=]\s*["'][^"']+["']/i,
  ];

  it("no secrets, tokens, or private keys in .straylight/ or the CP workflows", () => {
    const files = [
      ...walk(ROOT),
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
      ".github/workflows/straylight-merge-guard.yml",
      ".github/workflows/straylight-bootstrap.yml",
      "docs/decisions/ADR-050-autonomous-execution-control-plane.md",
    ];
    for (const f of files) {
      const content = readFileSync(f, "utf8");
      for (const re of SECRET_PATTERNS) {
        expect(content, `${f} matches ${re}`).not.toMatch(re);
      }
    }
  });

  it("no model API endpoints or API-key secret references in CP workflows", () => {
    for (const f of [
      ".github/workflows/straylight-reducer.yml",
      ".github/workflows/straylight-watchdog.yml",
      ".github/workflows/straylight-merge-guard.yml",
      ".github/workflows/straylight-bootstrap.yml",
    ]) {
      const content = readFileSync(f, "utf8");
      expect(content, f).not.toMatch(/api\.anthropic\.com|api\.openai\.com/);
      expect(content, f).not.toMatch(/ANTHROPIC_API_KEY|OPENAI_API_KEY/);
      // The only secret-ish reference permitted is the runner's own token.
      const secretRefs = content.match(/secrets\.[A-Za-z_]+/g) ?? [];
      expect(secretRefs.filter((s) => s !== "secrets.GITHUB_TOKEN"), f).toEqual([]);
    }
  });

  it("the protocol never claims external schedules are already configured", () => {
    const readme = readFileSync(join(ROOT, "README.md"), "utf8");
    const adr = readFileSync("docs/decisions/ADR-050-autonomous-execution-control-plane.md", "utf8");
    expect(adr).toContain("must be configured after merge");
    expect(adr).toContain("not** active at");
    expect(readme).not.toMatch(/schedules? (are|is) (already |)(configured|installed|active)/i);
  });
});
