// Control Plane v1 — task-packet EFFECT SCOPE semantics.
//
// `allowed_paths`, `forbidden_paths` and `may_open_pr` were shape-validated
// but had no mechanical MEANING, so nothing could ask "does this packet's
// scope permit this effect?" without inventing the answer. This suite pins
// the semantics against their owner, .straylight/lib/task-scope.mjs.
//
// Three things are proven here, in order:
//
//   1. THE SEMANTICS — path scope and PR scope, case by case, fail-closed.
//   2. NON-AUTHORITY — a positive determination is one COMPONENT and cannot
//      become execution authorization: the module's whole import closure is
//      pure, so it has no way to advance a lane, take a lease, launch a
//      process, reach Git/GitHub, or post an event.
//   3. NON-VACUITY — for each critical rule, a MUTANT evaluator with that
//      one rule weakened is built and must DISAGREE with the real module on
//      a named witness. A rule whose mutant agreed everywhere would mean
//      the rule is untested; these rows fail if a rule is ever weakened.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  evaluateTaskPacketScopeComponent,
  IMPLEMENTER_EFFECTS,
  SCOPE_REFUSALS,
  TASK_PACKET_SCOPE_COMPONENT,
} from "../../.straylight/lib/task-scope.mjs";
import { makeTaskPacket } from "./_fixtures.js";

const LIB = ".straylight/lib";

// The default fixture packet's scope, restated so each case below is legible:
//   allowed_paths:   ["docs/decisions/", "docs/handoffs/"]
//   forbidden_paths: [".loa", ".claude", "src/", ".github/workflows/post-merge.yml"]
//   may_open_pr:     true
const IN_SCOPE = "docs/decisions/ADR-051-example.md";

function scope(overrides: Record<string, any>, changed_paths: unknown, effect: unknown = "modify-worktree") {
  return evaluateTaskPacketScopeComponent({
    packet: makeTaskPacket(overrides),
    changed_paths,
    requested_effect: effect,
  });
}

/** Refusal code of a result, or "OK" — keeps the expectations one-line. */
function verdict(r: any): string {
  return r.ok ? "OK" : r.refusal;
}

describe("task-packet path scope", () => {
  it("permits a file inside a trailing-slash directory scope", () => {
    const r = scope({}, [IN_SCOPE]);
    expect(r.ok).toBe(true);
    expect((r as any).component).toBe(TASK_PACKET_SCOPE_COMPONENT);
  });

  it("permits an exact-path allowed entry", () => {
    expect(verdict(scope({ allowed_paths: ["package.json"] }, ["package.json"]))).toBe("OK");
  });

  it("an exact-path allowed entry is EXACT — it does not open a subtree", () => {
    // The restrictive reading of a slashless allowed entry. Reading it as a
    // prefix would admit a path the packet never named.
    expect(verdict(scope({ allowed_paths: ["docs/decisions"] }, ["docs/decisions/ADR-051.md"])))
      .toBe("path-outside-allowed-scope");
  });

  it("a directory scope does not leak across a segment boundary", () => {
    // `docs/dec` must not admit `docs/decisions/...`; only `docs/dec/...`.
    expect(verdict(scope({ allowed_paths: ["docs/dec/"] }, ["docs/decisions/ADR-051.md"])))
      .toBe("path-outside-allowed-scope");
  });

  it("a directory scope does not admit the bare directory itself as a file", () => {
    expect(verdict(scope({}, ["docs/decisions/"]))).toBe("changed-path-malformed");
  });

  it("refuses a path outside allowed scope", () => {
    expect(verdict(scope({}, ["README.md"]))).toBe("path-outside-allowed-scope");
  });

  it("FORBIDDEN WINS: a forbidden path refuses even when allowed scope covers it", () => {
    const r = scope(
      { allowed_paths: ["docs/decisions/"], forbidden_paths: ["docs/decisions/SEALED.md"] },
      ["docs/decisions/SEALED.md"]
    );
    expect(verdict(r)).toBe("path-forbidden");
  });

  it("FORBIDDEN WINS for a whole subtree nested inside allowed scope", () => {
    const pkt = { allowed_paths: ["docs/"], forbidden_paths: ["docs/decisions/"] };
    expect(verdict(scope(pkt, ["docs/handoffs/h.md"]))).toBe("OK");
    expect(verdict(scope(pkt, ["docs/decisions/ADR-051.md"]))).toBe("path-forbidden");
  });

  it("a slashless FORBIDDEN entry covers its subtree too (expansive reading)", () => {
    // The corpus writes `.claude` (a directory) and `.loa` (a file) without a
    // slash; exact-only would silently drop the directory prohibition.
    const pkt = { allowed_paths: [".claude/"], forbidden_paths: [".claude"] };
    expect(verdict(scope(pkt, [".claude/settings.json"]))).toBe("path-forbidden");
    expect(verdict(scope({ allowed_paths: [".loa"], forbidden_paths: [".loa"] }, [".loa"])))
      .toBe("path-forbidden");
  });

  it("refuses an absolute path", () => {
    expect(verdict(scope({}, ["/etc/passwd"]))).toBe("changed-path-malformed");
    expect(verdict(scope({}, [`/${IN_SCOPE}`]))).toBe("changed-path-malformed");
  });

  it("refuses `..` traversal, including traversal that lands back in scope", () => {
    expect(verdict(scope({}, ["../loa-dixie/secrets.ts"]))).toBe("changed-path-malformed");
    expect(verdict(scope({}, ["docs/decisions/../../.loa"]))).toBe("changed-path-malformed");
    expect(verdict(scope({}, ["docs/handoffs/../decisions/ADR-051.md"]))).toBe("changed-path-malformed");
  });

  it("refuses ambiguous normalization rather than normalizing it", () => {
    // Each of these denotes an in-scope file under some normalization. A
    // second spelling of a path is a second way to reason about scope, so
    // every one is refused instead of being canonicalized.
    for (const p of [
      `./${IN_SCOPE}`, // dot segment, leading
      "docs/./decisions/ADR-051.md", // dot segment, interior
      "docs//decisions/ADR-051.md", // empty segment
      "docs\\decisions\\ADR-051.md", // backslash separator
      ` ${IN_SCOPE}`, // leading whitespace
      `${IN_SCOPE} `, // trailing whitespace
      "docs/ decisions/ADR-051.md", // whitespace-padded segment
    ]) {
      expect(verdict(scope({}, [p])), p).toBe("changed-path-malformed");
    }
  });

  it("refuses a malformed changed path", () => {
    for (const p of [
      "", // empty
      "docs/decisions/\u0000.md", // NUL byte
      "docs/decisions/é.md", // non-ASCII
      `docs/decisions/${"x".repeat(300)}.md`, // over 300 chars
      42, // not a string
      null,
      undefined,
      { path: IN_SCOPE },
    ] as unknown[]) {
      expect(verdict(scope({}, [p])), JSON.stringify(p)).toBe("changed-path-malformed");
    }
  });

  it("refuses a glob metacharacter in a changed path", () => {
    expect(verdict(scope({}, ["docs/decisions/*.md"]))).toBe("changed-path-malformed");
  });

  it("ONE refused path refuses the whole determination, wherever it sits", () => {
    const bad = "src/straylight/estate.ts"; // forbidden by `src/`
    expect(verdict(scope({}, [bad, IN_SCOPE]))).toBe("path-forbidden");
    expect(verdict(scope({}, [IN_SCOPE, bad]))).toBe("path-forbidden");
    expect(verdict(scope({}, [IN_SCOPE, "README.md"]))).toBe("path-outside-allowed-scope");
    expect(verdict(scope({}, [IN_SCOPE, "../x"]))).toBe("changed-path-malformed");
  });

  it("an empty changed-path set has an explicit refusal", () => {
    expect(verdict(scope({}, []))).toBe("empty-changed-path-set");
    expect(verdict(scope({}, [], "open-pr"))).toBe("empty-changed-path-set");
  });

  it("a non-array changed-path set refuses", () => {
    for (const v of [null, undefined, IN_SCOPE, {}, new Set([IN_SCOPE])] as unknown[]) {
      expect(verdict(scope({}, v)), JSON.stringify(v)).toBe("changed-paths-malformed");
    }
  });

  it("duplicate paths are deterministic: identical to the deduplicated set", () => {
    expect(scope({}, [IN_SCOPE, IN_SCOPE, IN_SCOPE])).toEqual(scope({}, [IN_SCOPE]));
    // A duplicated bad path is still refused, and refused the same way.
    expect(scope({}, ["README.md", "README.md"])).toEqual(scope({}, ["README.md"]));
  });

  it("is pure: it does not mutate the packet or the changed-path array", () => {
    const packet = makeTaskPacket({});
    const before = JSON.stringify(packet);
    const paths = [IN_SCOPE, IN_SCOPE];
    evaluateTaskPacketScopeComponent({ packet, changed_paths: paths, requested_effect: "open-pr" });
    expect(JSON.stringify(packet)).toBe(before);
    expect(paths).toEqual([IN_SCOPE, IN_SCOPE]);
  });

  it("is total and deterministic over repeated evaluation", () => {
    const a = scope({}, [IN_SCOPE], "open-pr");
    const b = scope({}, [IN_SCOPE], "open-pr");
    expect(a).toEqual(b);
  });

  it("refuses an uninterpretable glob in ALLOWED scope instead of guessing", () => {
    const r = scope({ allowed_paths: ["docs/**"] }, ["docs/decisions/ADR-051.md"]);
    expect(verdict(r)).toBe("allowed-scope-uninterpretable");
  });

  it("over-approximates a glob in FORBIDDEN scope (fail closed, e.g. `.env.*`)", () => {
    // The merged corpus really does carry `.env.*` in forbidden_paths. With
    // no pattern matcher defined anywhere, the literal prefix is used, so the
    // prohibition still bites instead of collapsing to one odd filename.
    const p = { allowed_paths: ["docs/", ".env.local"], forbidden_paths: [".env.*"] };
    expect(verdict(scope(p, [".env.local"]))).toBe("path-forbidden");
    expect(verdict(scope(p, ["docs/decisions/ADR-051.md"]))).toBe("OK");
  });
});

describe("task-packet PR-effect scope", () => {
  it("may_open_pr true + open-pr passes the scope component", () => {
    const r = scope({ may_open_pr: true }, [IN_SCOPE], "open-pr");
    expect(r.ok).toBe(true);
    expect((r as any).component).toBe(TASK_PACKET_SCOPE_COMPONENT);
  });

  it("may_open_pr false + open-pr REFUSES", () => {
    expect(verdict(scope({ may_open_pr: false }, [IN_SCOPE], "open-pr"))).toBe("pr-not-permitted");
  });

  it("only boolean true permits: no truthy coercion", () => {
    for (const v of ["true", 1, {}, [], "yes"] as unknown[]) {
      // A non-boolean fails the packet validator first — either way, closed.
      expect(verdict(scope({ may_open_pr: v }, [IN_SCOPE], "open-pr")), JSON.stringify(v))
        .not.toBe("OK");
    }
  });

  it("modify-worktree is NOT governed by may_open_pr", () => {
    expect(verdict(scope({ may_open_pr: false }, [IN_SCOPE], "modify-worktree"))).toBe("OK");
    expect(verdict(scope({ may_open_pr: true }, [IN_SCOPE], "modify-worktree"))).toBe("OK");
  });

  it("may_open_pr does not rescue an out-of-scope path", () => {
    expect(verdict(scope({ may_open_pr: true }, ["README.md"], "open-pr")))
      .toBe("path-outside-allowed-scope");
    expect(verdict(scope({ may_open_pr: true }, ["src/straylight/estate.ts"], "open-pr")))
      .toBe("path-forbidden");
  });

  it("refuses an unknown effect", () => {
    for (const requested_effect of [
      "push", "merge", "comment", "lease", "audit", "operator-event",
      "open_pr", "OPEN-PR", "modify-worktree ", "", null, undefined, 1, {},
    ] as unknown[]) {
      // Called directly: a helper default would mask the `undefined` row.
      const r = evaluateTaskPacketScopeComponent({
        packet: makeTaskPacket({}),
        changed_paths: [IN_SCOPE],
        requested_effect,
      });
      expect(verdict(r), JSON.stringify(requested_effect ?? null)).toBe("unknown-effect");
    }
  });

  it("the effect vocabulary is closed to exactly the two implementer effects", () => {
    expect(IMPLEMENTER_EFFECTS).toEqual(["modify-worktree", "open-pr"]);
    expect(Object.isFrozen(IMPLEMENTER_EFFECTS)).toBe(true);
  });
});

describe("task-packet binding: not arbitrary JSON", () => {
  it("refuses anything the single task-packet validator rejects", () => {
    expect(verdict(scope({ schema: "not.a.packet" }, [IN_SCOPE]))).toBe("packet-invalid");
    expect(verdict(scope({ allowed_paths: [] }, [IN_SCOPE]))).toBe("packet-invalid");
    expect(verdict(scope({ merge_forbidden: false }, [IN_SCOPE]))).toBe("packet-invalid");
    // A traversal entry in the packet's OWN scope is already invalid on main.
    expect(verdict(scope({ forbidden_paths: ["../loa-dixie/"] }, [IN_SCOPE]))).toBe("packet-invalid");
  });

  it("refuses a non-packet payload and a malformed input envelope", () => {
    for (const packet of [null, undefined, "packet", 42, [], {}] as unknown[]) {
      expect(
        verdict(evaluateTaskPacketScopeComponent({ packet, changed_paths: [IN_SCOPE], requested_effect: "open-pr" })),
        JSON.stringify(packet)
      ).toBe("packet-invalid");
    }
    for (const input of [null, undefined, "x", 42, []] as unknown[]) {
      expect(verdict(evaluateTaskPacketScopeComponent(input as any)), JSON.stringify(input))
        .toBe("input-malformed");
    }
  });
});

describe("non-authority: a positive scope result is ONE component, not authorization", () => {
  // The whole transitive import closure of the semantic owner. If a future
  // edit reaches for the network, the filesystem, a subprocess, or the lane,
  // it lands in this closure and the purity assertions below fail.
  function importClosure(entry: string): Map<string, string> {
    const seen = new Map<string, string>();
    const queue = [entry];
    while (queue.length > 0) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      const src = readFileSync(join(LIB, file), "utf8");
      seen.set(file, src);
      for (const m of src.matchAll(/(?:^|\s)(?:import|export)[^;]*?from\s+"([^"]+)"/g)) {
        const spec = m[1]!;
        if (spec.startsWith("./")) queue.push(spec.slice(2));
      }
    }
    return seen;
  }

  const closure = importClosure("task-scope.mjs");

  it("the closure is exactly the pure validator stack", () => {
    expect([...closure.keys()].sort()).toEqual([
      "admission-locks.mjs",
      "canonical.mjs",
      "state-machine.mjs",
      "task-scope.mjs",
      "validate.mjs",
    ]);
  });

  it("imports no capability: no network, filesystem, subprocess, or lane module", () => {
    // node:crypto is the one permitted builtin: canonical.mjs hashes with it.
    // It performs no I/O and grants no capability.
    const PURE_BUILTINS = new Set(["node:crypto"]);
    for (const [file, src] of closure) {
      for (const m of src.matchAll(/(?:^|\s)(?:import|export)[^;]*?from\s+"([^"]+)"/g)) {
        const spec = m[1]!;
        if (spec.startsWith("./")) continue;
        expect(PURE_BUILTINS.has(spec), `${file} imports ${spec}`).toBe(true);
      }
      // No dynamic escape hatch, and no ambient capability reference.
      for (const forbidden of [
        "require(", "import(", "fetch(", "process.", "globalThis",
        "child_process", "node:fs", "node:http", "node:net", "node:dns",
        "XMLHttpRequest", "eval(", "Function(",
      ]) {
        expect(src.includes(forbidden), `${file} contains ${forbidden}`).toBe(false);
      }
    }
  });

  it("cannot advance a lane, take a lease, or post an event: those owners are not reachable", () => {
    // The semantic owners of the OTHER authorization components are absent
    // from the closure, so no scope determination can stand in for them.
    for (const owner of [
      "reconstruct.mjs", "reducer.mjs", "write-plan.mjs", "write-authority.mjs",
      "collection.mjs", "lane-target.mjs", "admission-locks.d.mts",
    ]) {
      expect(closure.has(owner), owner).toBe(false);
    }
    // Only the doc header may NAME the other components; no CODE line may
    // reference them (admission-locks.mjs is reachable via validate.mjs, but
    // only as pure digest checking — this module never calls into it).
    const code = closure
      .get("task-scope.mjs")!
      .replace(/\/\*[\s\S]*?\*\//g, "") // block + JSDoc comments
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    for (const symbol of [
      "lease", "reconstruct", "reduce", "writePlan", "admissionPolicyFor",
      "next_actor", "cp-state", "spawn", "exec",
    ]) {
      expect(code.includes(symbol), symbol).toBe(false);
    }
  });

  it("the public surface is exactly four names and one of them is the ceiling", async () => {
    const mod = await import("../../.straylight/lib/task-scope.mjs");
    expect(Object.keys(mod).sort()).toEqual([
      "IMPLEMENTER_EFFECTS",
      "SCOPE_REFUSALS",
      "TASK_PACKET_SCOPE_COMPONENT",
      "evaluateTaskPacketScopeComponent",
    ]);
    expect(TASK_PACKET_SCOPE_COMPONENT).toBe("task-packet-effect-scope");
  });

  it("a success value claims a COMPONENT and never full authorization", () => {
    const r = scope({}, [IN_SCOPE], "open-pr") as any;
    expect(r.ok).toBe(true);
    // Bounded output: exactly these two keys, nothing an executor could
    // mistake for a grant.
    expect(Object.keys(r).sort()).toEqual(["component", "ok"]);
    expect(r.component).toBe("task-packet-effect-scope");
    for (const claim of [
      "authorized", "authorization", "AUTHORIZED_TO_EXECUTE", "may_execute",
      "may_push", "may_launch", "authority", "approved", "token", "credential",
    ]) {
      expect(claim in r, claim).toBe(false);
    }
    // And the string form carries no grant either.
    expect(JSON.stringify(r).toLowerCase()).not.toContain("authoriz");
  });

  it("every refusal is a bounded code from the closed vocabulary, never prose", () => {
    const observed = new Set<string>();
    const cases: Array<[Record<string, any>, unknown, unknown]> = [
      [{ schema: "x" }, [IN_SCOPE], "open-pr"],
      [{}, [IN_SCOPE], "push"],
      [{}, "nope", "open-pr"],
      [{}, [], "open-pr"],
      [{}, ["../x"], "open-pr"],
      [{ allowed_paths: ["docs/**"] }, [IN_SCOPE], "open-pr"],
      [{ may_open_pr: false }, [IN_SCOPE], "open-pr"],
      [{}, ["src/straylight/estate.ts"], "open-pr"],
      [{}, ["README.md"], "open-pr"],
    ];
    for (const [ov, paths, effect] of cases) {
      const r = scope(ov, paths, effect) as any;
      expect(r.ok).toBe(false);
      expect(SCOPE_REFUSALS).toContain(r.refusal);
      expect(r.refusal).toMatch(/^[a-z][a-z-]*[a-z]$/); // a code, not a sentence
      expect(Object.keys(r).sort()).toEqual(["detail", "ok", "refusal"]);
      observed.add(r.refusal);
    }
    observed.add("input-malformed");
    // Every declared refusal is reachable — no dead vocabulary.
    expect([...observed].sort()).toEqual([...SCOPE_REFUSALS].sort());
  });
});

describe("mutation discriminators: each critical rule is non-vacuous", () => {
  // A compact re-implementation of the decision with exactly ONE rule
  // weakened. For each rule the mutant must PERMIT a witness that the real
  // module REFUSES. If the real module were ever weakened the same way, the
  // corresponding case in the suites above would flip — that is what makes
  // these rules load-bearing rather than decorative.
  type Weakening =
    | "forbidden-ignored"
    | "allowed-ignored"
    | "path-form-unchecked"
    | "may-open-pr-ignored"
    | "unknown-effect-accepted";

  function mutantPermits(weakening: Weakening, packet: any, changed_paths: any[], effect: string): boolean {
    const known = ["modify-worktree", "open-pr"];
    if (weakening !== "unknown-effect-accepted" && !known.includes(effect)) return false;
    if (weakening !== "may-open-pr-ignored" && effect === "open-pr" && packet.may_open_pr !== true) return false;
    if (changed_paths.length === 0) return false;
    for (const p of changed_paths) {
      if (weakening !== "path-form-unchecked") {
        if (typeof p !== "string" || !/^(?!\/)(?!.*\.\.)[\x20-\x7E]{1,300}$/.test(p)) return false;
      }
      if (weakening !== "forbidden-ignored") {
        const hit = (packet.forbidden_paths as string[]).some((e) =>
          e.endsWith("/") ? p.startsWith(e) && p.length > e.length : p === e || p.startsWith(`${e}/`)
        );
        if (hit) return false;
      }
      if (weakening !== "allowed-ignored") {
        const ok = (packet.allowed_paths as string[]).some((e) =>
          e.endsWith("/") ? p.startsWith(e) && p.length > e.length : p === e
        );
        if (!ok) return false;
      }
    }
    return true;
  }

  const ROWS: Array<{
    rule: string;
    weakening: Weakening;
    overrides: Record<string, any>;
    changed_paths: any[];
    effect: string;
    refusal: string;
  }> = [
    {
      rule: "forbidden_paths overrides allowed_paths",
      weakening: "forbidden-ignored",
      overrides: { allowed_paths: ["docs/"], forbidden_paths: ["docs/decisions/"] },
      changed_paths: ["docs/decisions/ADR-051.md"],
      effect: "modify-worktree",
      refusal: "path-forbidden",
    },
    {
      rule: "a path outside allowed_paths is refused",
      weakening: "allowed-ignored",
      overrides: {},
      changed_paths: ["README.md"],
      effect: "modify-worktree",
      refusal: "path-outside-allowed-scope",
    },
    {
      rule: "traversal is refused",
      weakening: "path-form-unchecked",
      overrides: { allowed_paths: ["docs/"], forbidden_paths: [".loa"] },
      changed_paths: ["docs/../.loa"],
      effect: "modify-worktree",
      refusal: "changed-path-malformed",
    },
    {
      rule: "an absolute path is refused",
      weakening: "path-form-unchecked",
      overrides: { allowed_paths: ["/etc/passwd"], forbidden_paths: [".loa"] },
      changed_paths: ["/etc/passwd"],
      effect: "modify-worktree",
      refusal: "packet-invalid", // the packet's own scope entry is illegal too
    },
    {
      rule: "may_open_pr false is not treated as true",
      weakening: "may-open-pr-ignored",
      overrides: { may_open_pr: false },
      changed_paths: [IN_SCOPE],
      effect: "open-pr",
      refusal: "pr-not-permitted",
    },
    {
      rule: "an unknown effect is refused",
      weakening: "unknown-effect-accepted",
      overrides: {},
      changed_paths: [IN_SCOPE],
      effect: "push",
      refusal: "unknown-effect",
    },
  ];

  for (const row of ROWS) {
    it(`${row.rule} — real refuses (${row.refusal}), mutant would permit`, () => {
      const real = scope(row.overrides, row.changed_paths, row.effect);
      expect(verdict(real)).toBe(row.refusal);

      // The witness is only a discriminator if the weakened rule flips it.
      const packet = makeTaskPacket(row.overrides);
      expect(mutantPermits(row.weakening, packet, row.changed_paths, row.effect)).toBe(true);
    });
  }

  it("the mutants agree with the real module on the clean baseline", () => {
    // A mutant that permitted everything would be a vacuous discriminator.
    const packet = makeTaskPacket({});
    for (const w of [
      "forbidden-ignored", "allowed-ignored", "path-form-unchecked",
      "may-open-pr-ignored", "unknown-effect-accepted",
    ] as Weakening[]) {
      expect(mutantPermits(w, packet, [IN_SCOPE], "open-pr"), w).toBe(true);
      expect(verdict(scope({}, [IN_SCOPE], "open-pr"))).toBe("OK");
    }
  });
});

describe("the merged corpus is mechanically consumable", () => {
  // The point of the slice: real accepted packets must actually work through
  // the new semantics, not just synthetic fixtures.
  const HISTORY_DIR = "tests/control-plane/fixtures/lane-history";

  function packetsFrom(value: unknown, out: any[] = []): any[] {
    if (Array.isArray(value)) {
      for (const v of value) packetsFrom(v, out);
    } else if (value !== null && typeof value === "object") {
      if ((value as any).schema === "straylight.task-packet.v1") out.push(value);
      for (const v of Object.values(value)) packetsFrom(v, out);
    } else if (typeof value === "string" && /^[[{]/.test(value.trim())) {
      try {
        packetsFrom(JSON.parse(value), out);
      } catch {
        /* not embedded JSON */
      }
    }
    return out;
  }

  const packets = packetsFrom(
    readFileSync(join(HISTORY_DIR, "lane-122.json"), "utf8").trim().startsWith("{")
      ? JSON.parse(readFileSync(join(HISTORY_DIR, "lane-122.json"), "utf8"))
      : {}
  );

  it("finds real packets to evaluate", () => {
    expect(packets.length).toBeGreaterThan(0);
  });

  it("every valid real packet yields a bounded determination for both effects", () => {
    for (const packet of packets) {
      for (const requested_effect of IMPLEMENTER_EFFECTS) {
        const r = evaluateTaskPacketScopeComponent({
          packet,
          changed_paths: ["package.json"],
          requested_effect,
        }) as any;
        if (r.ok) {
          expect(Object.keys(r).sort()).toEqual(["component", "ok"]);
        } else {
          expect(SCOPE_REFUSALS).toContain(r.refusal);
        }
      }
    }
  });

  it("a real packet permits a path it declared and refuses one it forbade", () => {
    // lane-122's implementation packets allow `src/straylight/storage/postgres/`
    // and forbid `.straylight/`.
    const withPostgres = packets.find(
      (p) => Array.isArray(p.allowed_paths) && p.allowed_paths.includes("src/straylight/storage/postgres/")
    );
    expect(withPostgres, "expected a lane-122 packet allowing the postgres subtree").toBeTruthy();
    expect(
      verdict(
        evaluateTaskPacketScopeComponent({
          packet: withPostgres,
          changed_paths: ["src/straylight/storage/postgres/queries.ts"],
          requested_effect: "modify-worktree",
        })
      )
    ).toBe("OK");
    expect(
      verdict(
        evaluateTaskPacketScopeComponent({
          packet: withPostgres,
          changed_paths: [".straylight/lib/reducer.mjs"],
          requested_effect: "modify-worktree",
        })
      )
    ).not.toBe("OK");
  });
});
