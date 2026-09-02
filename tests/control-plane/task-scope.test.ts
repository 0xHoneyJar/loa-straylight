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
//      Every case calls the real exported production API; there is no
//      reimplementation of the decision anywhere in this file.
//   2. NON-AUTHORITY — a positive determination is one COMPONENT and cannot
//      become execution authorization: the module's whole import closure is
//      pure, so it has no way to advance a lane, take a lease, launch a
//      process, reach Git/GitHub, or post an event.
//   3. CRITICAL-RULE COVERAGE — a table naming each load-bearing rule with
//      the witness that pins it, so a weakened rule has an owning row.
//
// WHAT THIS FILE IS NOT. It is DETERMINISTIC CASE COVERAGE, not mutation
// testing: nothing here mutates production source, and no row may be read as
// proof that a rule is non-vacuous by construction. Mutation evidence is
// produced by mutating .straylight/lib/task-scope.mjs itself in a disposable
// isolated copy of the repository and running this suite against it — see
// ".straylight/README.md § Task-packet effect scope". Keeping that run out of
// the committed tree is deliberate: a committed re-implementation of the
// algorithm would only prove that the copy disagrees with itself.

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

  it("refuses unsupported syntax in a changed path", () => {
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

  it("refuses uninterpretable syntax in ALLOWED scope instead of guessing", () => {
    const r = scope({ allowed_paths: ["docs/**"] }, ["docs/decisions/ADR-051.md"]);
    expect(verdict(r)).toBe("allowed-scope-uninterpretable");
  });
});

// F-01. Unsupported syntax may only REDUCE permission or REFUSE the
// determination; it may never EXPAND permission. There is no pattern language
// here and none is being decided.
describe("unsupported forbidden syntax never expands permission", () => {
  it("a non-empty literal prefix is conservatively forbidden (the corpus's `.env.*`)", () => {
    // The merged corpus really does carry `.env.*` in forbidden_paths. With no
    // matcher defined anywhere, the literal prefix `.env.` is forbidden, so the
    // prohibition still bites instead of collapsing to one odd filename.
    const p = { allowed_paths: ["docs/", ".env.local"], forbidden_paths: [".env.*"] };
    expect(verdict(scope(p, [".env.local"]))).toBe("path-forbidden");
    expect(verdict(scope(p, [".env.production"]))).toBe("path-forbidden");
    // Reducing permission, not expanding it: an unrelated in-scope path is
    // unaffected.
    expect(verdict(scope(p, ["docs/decisions/ADR-051.md"]))).toBe("OK");
  });

  it("a mid-entry prefix reduces to the containing directory (`docs/*.secret`)", () => {
    const p = { allowed_paths: ["docs/"], forbidden_paths: ["docs/*.secret"] };
    // Conservative prefix `docs/`: everything under docs/ is forbidden. That
    // is MORE restrictive than any glob reading, which is the safe direction.
    expect(verdict(scope(p, ["docs/keys.secret"]))).toBe("path-forbidden");
    expect(verdict(scope(p, ["docs/decisions/ADR-051.md"]))).toBe("path-forbidden");
  });

  it("NO safe literal prefix refuses the WHOLE determination, never fail-open", () => {
    // The audited counterexample: an entry beginning with unsupported syntax
    // has an EMPTY literal prefix. Reading it as "matches nothing" made a
    // declared prohibition permit the very path it was written to forbid.
    for (const entry of ["*", "?foo", "[abc]", "*?foo[abc]", "**/secret", "{a,b}", "]x"]) {
      expect(
        verdict(scope({ allowed_paths: ["docs/"], forbidden_paths: [entry] }, ["docs/secret.md"])),
        entry
      ).toBe("forbidden-scope-uninterpretable");
    }
  });

  it("the refusal does not depend on the proposed path or the effect", () => {
    const p = { allowed_paths: ["docs/"], forbidden_paths: ["*"] };
    for (const paths of [["docs/secret.md"], [IN_SCOPE], ["README.md"], ["../x"], []]) {
      for (const effect of ["modify-worktree", "open-pr"]) {
        expect(verdict(scope(p, paths, effect)), `${effect} ${JSON.stringify(paths)}`)
          .toBe("forbidden-scope-uninterpretable");
      }
    }
  });

  it("one uninterpretable entry refuses even beside interpretable ones", () => {
    const p = { allowed_paths: ["docs/"], forbidden_paths: [".loa", "*", "src/"] };
    expect(verdict(scope(p, [IN_SCOPE]))).toBe("forbidden-scope-uninterpretable");
  });

  it("no pattern language is implemented: nothing is interpreted as a wildcard", () => {
    // `docs/*.md` is NOT read as "md files in docs/". If it were, an unnamed
    // sibling would be permitted; instead the whole subtree is forbidden.
    const p = { allowed_paths: ["docs/"], forbidden_paths: ["docs/*.md"] };
    expect(verdict(scope(p, ["docs/notes.txt"]))).toBe("path-forbidden");
    // And in allowed scope nothing is interpreted either — it refuses.
    for (const entry of ["docs/*", "docs/**", "docs/*.md", "*", "?", "[a]", "{a,b}"]) {
      expect(verdict(scope({ allowed_paths: [entry] }, [IN_SCOPE])), entry)
        .toBe("allowed-scope-uninterpretable");
    }
  });
});

// F-02. ONE canonical path language, applied identically to allowed_paths
// entries, forbidden_paths entries and proposed changed paths.
describe("one canonical task-scope path language", () => {
  // A structurally valid packet string is NOT necessarily a canonical
  // task-scope path. Each of these passes validateTaskPacket's
  // RELATIVE_PATH_RE, yet as a scope entry would match nothing (an INERT
  // prohibition) or depend on a platform's normalization.
  const NON_CANONICAL = [
    "docs//", // repeated separator
    "docs//x.md",
    "docs/./", // dot segment, trailing directory form
    "docs/./x.md",
    "./docs/", // dot segment, leading
    "docs\\secret.md", // backslash separator
    "docs\\", // backslash, directory-looking
    "\\\\server\\share", // UNC form
    "C:/secret.txt", // Windows drive letter, forward slashes
    "C:\\secret.txt", // Windows drive letter, backslashes
    "C:secret.txt", // drive-relative
    "docs/ x.md", // whitespace-padded segment
    " docs/", // whitespace-padded segment
    "docs/x.md ",
  ];

  it("refuses a non-canonical ALLOWED entry rather than normalizing it", () => {
    for (const entry of NON_CANONICAL) {
      expect(verdict(scope({ allowed_paths: [entry] }, [IN_SCOPE])), entry)
        .toBe("scope-entry-non-canonical");
    }
  });

  it("refuses a non-canonical FORBIDDEN entry rather than letting it match nothing", () => {
    for (const entry of NON_CANONICAL) {
      expect(
        verdict(scope({ allowed_paths: ["docs/"], forbidden_paths: [entry] }, ["docs/x.md"])),
        entry
      ).toBe("scope-entry-non-canonical");
    }
  });

  it("refuses a non-canonical PROPOSED path by the same language", () => {
    // Same population of spellings, judged by the same predicate — no
    // per-field normalization rules.
    for (const p of NON_CANONICAL) {
      // A directory-form entry is a legal scope entry but never a changed FILE,
      // so both refusals are correct; what matters is that none is permitted.
      expect(verdict(scope({ allowed_paths: ["docs/", "C:/", " docs/"] }, [p])), p)
        .not.toBe("OK");
    }
  });

  it("a Windows drive-letter path is refused, not resolved (audited counterexample)", () => {
    // Previously `C:/secret.txt` was treated as an ordinary relative path, so a
    // packet allowing `C:/` permitted it.
    expect(verdict(scope({ allowed_paths: ["docs/"] }, ["C:/secret.txt"])))
      .toBe("changed-path-malformed");
    expect(verdict(scope({ allowed_paths: ["docs/"] }, ["C:\\secret.txt"])))
      .toBe("changed-path-malformed");
    expect(verdict(scope({ allowed_paths: ["C:/"] }, ["C:/secret.txt"])))
      .toBe("scope-entry-non-canonical");
    expect(verdict(scope({ allowed_paths: ["C:/secret.txt"] }, ["C:/secret.txt"])))
      .toBe("scope-entry-non-canonical");
    expect(verdict(scope({ allowed_paths: ["docs/"], forbidden_paths: ["C:/secret.txt"] }, [IN_SCOPE])))
      .toBe("scope-entry-non-canonical");
  });

  it("`..` and absolute forms stay refused in a scope entry (structural owner)", () => {
    // Already refused by validateTaskPacket's RELATIVE_PATH_RE — the stricter
    // semantic predicate does not weaken the structural one.
    expect(verdict(scope({ allowed_paths: ["docs/../secret"] }, [IN_SCOPE]))).toBe("packet-invalid");
    expect(verdict(scope({ forbidden_paths: ["docs/../secret"] }, [IN_SCOPE]))).toBe("packet-invalid");
    expect(verdict(scope({ allowed_paths: ["/etc/passwd"] }, [IN_SCOPE]))).toBe("packet-invalid");
  });

  it("PRESERVES the established syntax distinction: trailing slash vs slashless", () => {
    // The canonicality rule must not reject the deliberate directory spelling
    // while rejecting repeated or ambiguous slashes.
    expect(verdict(scope({ allowed_paths: ["docs/"] }, ["docs/x.md"]))).toBe("OK");
    expect(verdict(scope({ allowed_paths: ["docs/decisions/"] }, [IN_SCOPE]))).toBe("OK");
    expect(verdict(scope({ allowed_paths: ["docs/x.md"] }, ["docs/x.md"]))).toBe("OK");
    // Slashless is EXACT, not a prefix.
    expect(verdict(scope({ allowed_paths: ["docs"] }, ["docs/x.md"]))).toBe("path-outside-allowed-scope");
    // Trailing slash is a SUBTREE, at any depth.
    expect(verdict(scope({ allowed_paths: ["docs/"] }, ["docs/a/b/c.md"]))).toBe("OK");
    // A nested directory entry is canonical too.
    expect(verdict(scope({ allowed_paths: ["docs/a/b/"] }, ["docs/a/b/c.md"]))).toBe("OK");
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
      [{ allowed_paths: ["docs//"] }, [IN_SCOPE], "open-pr"],
      [{ forbidden_paths: ["*"] }, [IN_SCOPE], "open-pr"],
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

describe("critical-rule coverage: every load-bearing rule has an owning witness", () => {
  // DETERMINISTIC CASE COVERAGE, not mutation testing. Each row names one rule
  // in the production module and the witness that pins it, so that weakening
  // the rule in .straylight/lib/task-scope.mjs fails a NAMED row rather than
  // silently passing. `source` is the control's owner in production, recorded
  // so the mutation run (README § Task-packet effect scope) can target the
  // real line instead of a copy. Nothing here re-implements the decision: a
  // committed re-implementation could only prove the copy agrees with itself.
  const ROWS: Array<{
    rule: string;
    source: string;
    overrides: Record<string, any>;
    changed_paths: any[];
    effect: string;
    refusal: string;
  }> = [
    {
      rule: "forbidden_paths overrides allowed_paths",
      source: "forbidden checked before allowed, per path",
      overrides: { allowed_paths: ["docs/"], forbidden_paths: ["docs/decisions/"] },
      changed_paths: ["docs/decisions/ADR-051.md"],
      effect: "modify-worktree",
      refusal: "path-forbidden",
    },
    {
      rule: "a path outside allowed_paths is refused",
      source: "allowedEntryCovers",
      overrides: {},
      changed_paths: ["README.md"],
      effect: "modify-worktree",
      refusal: "path-outside-allowed-scope",
    },
    {
      rule: "traversal is refused",
      source: "classifyTaskScopePath / RELATIVE_PATH_RE",
      overrides: { allowed_paths: ["docs/"], forbidden_paths: [".loa"] },
      changed_paths: ["docs/../.loa"],
      effect: "modify-worktree",
      refusal: "changed-path-malformed",
    },
    {
      rule: "an absolute path is refused",
      source: "classifyTaskScopePath / RELATIVE_PATH_RE",
      overrides: { allowed_paths: ["/etc/passwd"], forbidden_paths: [".loa"] },
      changed_paths: ["/etc/passwd"],
      effect: "modify-worktree",
      refusal: "packet-invalid", // the packet's own scope entry is illegal too
    },
    {
      rule: "a non-canonical packet scope entry is refused",
      source: "classifyTaskScopePath, applied to allowed_paths and forbidden_paths",
      overrides: { allowed_paths: ["docs/"], forbidden_paths: ["docs//"] },
      changed_paths: ["docs/x.md"],
      effect: "modify-worktree",
      refusal: "scope-entry-non-canonical",
    },
    {
      rule: "a Windows drive-letter path is refused",
      source: "DRIVE_PREFIX_RE",
      overrides: { allowed_paths: ["docs/"] },
      changed_paths: ["C:/secret.txt"],
      effect: "modify-worktree",
      refusal: "changed-path-malformed",
    },
    {
      rule: "unsupported forbidden syntax with an empty literal prefix refuses",
      source: "conservativeForbiddenPrefix",
      overrides: { allowed_paths: ["docs/"], forbidden_paths: ["*"] },
      changed_paths: ["docs/secret.md"],
      effect: "modify-worktree",
      refusal: "forbidden-scope-uninterpretable",
    },
    {
      rule: "unsupported allowed syntax refuses",
      source: "UNSUPPORTED_SYNTAX_RE over allowed_paths",
      overrides: { allowed_paths: ["docs/**"] },
      changed_paths: ["docs/decisions/ADR-051.md"],
      effect: "modify-worktree",
      refusal: "allowed-scope-uninterpretable",
    },
    {
      rule: "may_open_pr false is not treated as true",
      source: "may_open_pr !== true gate on open-pr",
      overrides: { may_open_pr: false },
      changed_paths: [IN_SCOPE],
      effect: "open-pr",
      refusal: "pr-not-permitted",
    },
    {
      rule: "an unknown effect is refused",
      source: "IMPLEMENTER_EFFECTS membership",
      overrides: {},
      changed_paths: [IN_SCOPE],
      effect: "push",
      refusal: "unknown-effect",
    },
  ];

  for (const row of ROWS) {
    it(`${row.rule} — refuses ${row.refusal} (owner: ${row.source})`, () => {
      expect(verdict(scope(row.overrides, row.changed_paths, row.effect))).toBe(row.refusal);
    });
  }

  it("each witness is a real discriminator: the clean baseline PERMITS", () => {
    // A witness that refused for an unrelated reason would pin nothing, so the
    // baseline it deviates from must actually be permitted.
    expect(verdict(scope({}, [IN_SCOPE], "open-pr"))).toBe("OK");
    expect(verdict(scope({}, [IN_SCOPE], "modify-worktree"))).toBe("OK");
    expect(verdict(scope({ allowed_paths: ["docs/"] }, ["docs/x.md"]))).toBe("OK");
    expect(verdict(scope({ allowed_paths: ["docs/"], forbidden_paths: [".loa"] }, ["docs/x.md"])))
      .toBe("OK");
  });

  it("every rule's refusal code is distinct enough to identify the broken rule", () => {
    // Two rules sharing a refusal code would let one regress behind the other.
    const byRefusal = new Map<string, string[]>();
    for (const row of ROWS) {
      byRefusal.set(row.refusal, [...(byRefusal.get(row.refusal) ?? []), row.rule]);
    }
    // changed-path-malformed and packet-invalid are shared by construction —
    // they are the structural refusals; every SEMANTIC rule is on its own code.
    for (const [refusal, rules] of byRefusal) {
      if (refusal === "changed-path-malformed" || refusal === "packet-invalid") continue;
      expect(rules.length, `${refusal}: ${rules.join(" / ")}`).toBe(1);
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
