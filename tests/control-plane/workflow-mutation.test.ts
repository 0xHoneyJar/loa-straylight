// Control Plane v1 — executable workflow-boundary mutation matrix
// (round 10 J3: the non-vacuous replacement for the retired empty
// GUARDED table).
//
// A structural test that only greps for yesterday's exploit is vacuous:
// it passes on a workflow that reintroduces the same class through a
// different spelling. This suite is built the other way around — a
// single checker (checkWorkflowBoundary) encodes the boundary as
// PROHIBITED CONSTRUCT CLASSES over the executable (non-comment) lines
// of a workflow, and every class is proven NON-VACUOUS by mutation:
// for each class, a real workflow is mutated to reintroduce the
// construct and the checker MUST flag it. If someone weakens the
// checker, the mutation rows fail; if someone reintroduces a construct,
// the clean rows fail. Both directions are executable.
//
// The classes (each one a shell-authority vector Codex exploited in
// rounds 1–10 or an adjacent spelling):
//   inline-node          node -e / --input-type / --eval (inline source)
//   authority-jq         any jq invocation on an executable line
//   or-true              `|| true` swallowing a gh/node exit status
//   evidence-loop        while read / for … $(…) / mapfile over output
//   gh-write             gh api -X / --method / gh pr|issue mutation
//   gh-pipe              gh api piped into anything
//   command-substitution $( … ) capturing gh/node/jq/cat output (only
//                        mktemp/date are non-semantic and allowed)
//   eval                 eval / source of dynamic content
//   ledger-append        bash appending to a .jsonl (ledger rows are
//                        written ONLY by Node entry points)
//   redirect-derived     redirecting gh output to a path built from a
//                        shell-parsed variable other than the fixed
//                        gather/collection dirs

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const WORKFLOWS = [
  ".github/workflows/straylight-bootstrap.yml",
  ".github/workflows/straylight-merge-guard.yml",
  ".github/workflows/straylight-reducer.yml",
  ".github/workflows/straylight-watchdog.yml",
] as const;

interface Violation {
  rule: string;
  line: number;
  text: string;
}

// The boundary checker: examine every EXECUTABLE line (YAML comments and
// blank lines dropped; a line whose first non-space byte is `#` is a
// comment in both YAML and the embedded bash).
export function checkWorkflowBoundary(src: string): Violation[] {
  const violations: Violation[] = [];
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const t = raw.trim();
    if (t.length === 0 || t.startsWith("#")) continue;
    const flag = (rule: string) => violations.push({ rule, line: i + 1, text: t });

    // inline-node: any inline Node source on the shell boundary.
    if (/node\s+(-e|--eval|--input-type)/.test(t)) flag("inline-node");

    // authority-jq: jq anywhere on an executable line. There is no
    // non-authority jq left in these workflows; any reappearance is a
    // boundary violation by definition.
    if (/\bjq\b/.test(t)) flag("authority-jq");

    // or-true: swallowing an exit status.
    if (/\|\|\s*true\b/.test(t)) flag("or-true");

    // evidence-loop: shell iteration over anything (loop routing belongs
    // to Node). `for` over a glob is equally banned — the fixed plans
    // enumerate for us.
    if (/^(while|for)\b/.test(t) || /\bmapfile\b/.test(t) || /\bread\s+-r\b/.test(t)) flag("evidence-loop");

    // gh-write: any mutating GitHub call outside the executors.
    if (/gh api[^\n]*-X\s*(POST|PATCH|PUT|DELETE)/.test(t)) flag("gh-write");
    if (/gh api[^\n]*--method\s*(POST|PATCH|PUT|DELETE)/.test(t)) flag("gh-write");
    if (/gh (pr|issue) (create|edit|comment|close|merge|lock)/.test(t)) flag("gh-write");
    if (/--input\s*<\(/.test(t)) flag("gh-write");

    // gh-pipe: gh output interpreted by a pipeline.
    if (/gh api[^\n]*\|/.test(t)) flag("gh-pipe");

    // command-substitution: $( … ) capturing SEMANTIC output. mktemp and
    // date are environment plumbing, not evidence; everything else —
    // gh/node/jq/cat/echo arithmetic — is interpretation.
    for (const m of t.matchAll(/\$\(([^)]*)\)/g)) {
      const inner = (m[1] ?? "").trim();
      if (!/^mktemp\b/.test(inner) && !/^date\b/.test(inner)) flag("command-substitution");
    }

    // eval / dynamic source.
    if (/\beval\b/.test(t) || /^source\s/.test(t)) flag("eval");

    // ledger-append: bash writing ledger rows.
    if (/>>\s*"?[^"\s]*\.jsonl/.test(t)) flag("ledger-append");
    if (/ledger_row\(\)/.test(t)) flag("ledger-append");

    // redirect-derived: gh output redirected into a path containing a
    // shell variable OTHER than the fixed gather/collection dir vars.
    const redirect = t.match(/gh api[^>]*>\s*"?([^"\s;]+)/);
    if (redirect !== null) {
      const target = redirect[1] ?? "";
      const varsUsed = [...target.matchAll(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g)].map((v) => v[1]);
      const ALLOWED_TARGET_VARS = new Set(["DIR", "G1", "G2", "DIR_A", "DIR_B", "REPO", "ISSUE_NUMBER"]);
      for (const v of varsUsed) {
        if (!ALLOWED_TARGET_VARS.has(v ?? "")) flag("redirect-derived");
      }
    }
  }
  return violations;
}

// =============================================================================
// Direction 1 — the four real workflows are CLEAN under the checker
// =============================================================================
describe("boundary checker — the four converted workflows carry zero violations", () => {
  for (const f of WORKFLOWS) {
    it(`${f} is clean`, () => {
      const violations = checkWorkflowBoundary(readFileSync(f, "utf8"));
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});

// =============================================================================
// Direction 2 — every rule is NON-VACUOUS: a mutation reintroducing the
// construct into a real workflow MUST be flagged with that rule
// =============================================================================
describe("mutation matrix — each prohibited construct class is demonstrably caught", () => {
  // Insert a payload line into a real workflow's first run: block so the
  // mutation lives on an executable line in real context.
  function mutate(workflow: string, payload: string): string {
    const src = readFileSync(workflow, "utf8");
    const at = src.indexOf("set -euo pipefail");
    expect(at).toBeGreaterThan(-1);
    const lineStart = src.lastIndexOf("\n", at) + 1;
    const indent = src.slice(lineStart, at);
    return src.slice(0, lineStart) + indent + payload + "\n" + src.slice(lineStart);
  }

  const MUTATIONS: ReadonlyArray<readonly [string, string, string]> = [
    // [expected rule, payload, description]
    ["inline-node", `PROBE=$(node --input-type=module -e 'console.log(1)')`, "inline Node with --input-type"],
    ["inline-node", `node -e 'require("fs")' file.json`, "inline Node with -e"],
    ["authority-jq", `STATE=$(echo "$PROBE" | jq -r '.state // empty')`, "jq field extraction (the round-10 repro)"],
    ["authority-jq", `jq -cn --arg nonce "$NONCE" '{nonce: $nonce}' >> ledger.jsonl`, "jq ledger-row composition"],
    ["or-true", `gh api "repos/x/y/pulls/1" > pr.json 2>/dev/null || true`, "|| true swallowing a fetch failure"],
    ["evidence-loop", `for N in 1 2 3; do echo "$N"; done`, "shell for-loop routing"],
    ["evidence-loop", `while read -r SLOT; do echo "$SLOT"; done < slots.txt`, "while-read routing over derived output"],
    ["evidence-loop", `mapfile -t ISSUES < issues.txt`, "mapfile materialization"],
    ["gh-write", `gh api -X POST "repos/x/y/issues/1/comments" --input body.json`, "direct gh write"],
    ["gh-write", `gh api --method DELETE "repos/x/y/issues/1/labels/cp-paused"`, "direct gh write via --method"],
    ["gh-write", `gh issue comment 41 --body hi`, "gh issue mutation"],
    ["gh-pipe", `gh api "repos/x/y/issues" | grep -q cp-lane`, "gh piped into grep"],
    ["command-substitution", `HEAD=$(gh api "repos/x/y/pulls/1")`, "capturing gh output"],
    ["command-substitution", `SHA=$(sha256sum file | cut -d' ' -f1)`, "capturing digest computation"],
    ["command-substitution", `BASE=$(cat /tmp/base-sha.txt)`, "capturing file content"],
    ["eval", `eval "$CMD"`, "eval of dynamic content"],
    ["ledger-append", `echo '{"resource":"pr"}' >> "\${DIR}/ledger.jsonl"`, "bash appending a ledger row"],
    ["redirect-derived", `gh api "repos/x/y/pulls/\${PRNUM}" > "\${OUTDIR}/pr-\${PRNUM}.json"`, "redirect into a derived path"],
  ];

  for (const workflow of WORKFLOWS) {
    for (const [rule, payload, description] of MUTATIONS) {
      it(`${workflow.split("/").pop()}: ${description} → flagged as ${rule}`, () => {
        const mutated = mutate(workflow, payload);
        const violations = checkWorkflowBoundary(mutated);
        expect(violations.map((v) => v.rule)).toContain(rule);
      });
    }
  }

  it("a COMMENT containing a prohibited construct is NOT flagged (comments may explain the ban)", () => {
    for (const workflow of WORKFLOWS) {
      const mutated = mutate(workflow, `# example of the banned pattern: gh api -X POST | jq -r '.x' || true`);
      expect(checkWorkflowBoundary(mutated)).toEqual([]);
    }
  });

  it("the matrix is exhaustive over the checker's rule set (a rule with no mutation row is untested)", () => {
    const rulesInChecker = [
      "inline-node", "authority-jq", "or-true", "evidence-loop", "gh-write",
      "gh-pipe", "command-substitution", "eval", "ledger-append", "redirect-derived",
    ];
    const rulesCovered = new Set(MUTATIONS.map(([rule]) => rule));
    for (const rule of rulesInChecker) {
      expect(rulesCovered.has(rule), `no mutation row exercises rule ${rule}`).toBe(true);
    }
  });
});

// =============================================================================
// The read boundary itself — the executors are the only fetch/write paths
// =============================================================================
describe("fixed entry points own every derived fetch and every write", () => {
  it("every gh api call remaining in a workflow is a FIXED-url fetch guarded by `if !` (fail-closed, no interpretation)", () => {
    for (const f of WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      const code = src.split("\n").filter((l) => !l.trim().startsWith("#"));
      // Invocations only — echo lines may mention "gh api" in an error
      // message explaining the fail-closed abort.
      for (const line of code.filter((l) => l.includes("gh api") && !l.trim().startsWith("echo"))) {
        // Fail-closed guard + fixed issues/labels url; derived urls
        // (pulls, commits) may not appear in any workflow.
        expect(line.trim(), `${f}: ${line}`).toMatch(/^if ! gh api (--paginate )?"repos\/\$\{REPO\}\/(issues|labels)(\/\$\{ISSUE_NUMBER\})?[^"]*"/);
        expect(line, `${f}: ${line}`).not.toMatch(/\/(pulls|commits)\//);
      }
    }
  });

  it("the read executor is GET-only by construction: no -X flag exists anywhere in it", () => {
    const src = readFileSync(".straylight/bin/execute-read-plan.mjs", "utf8");
    expect(src).not.toMatch(/"-X"/);
    expect(src).toMatch(/\["api", "--paginate", path\] : \["api", path\]/);
  });

  it("the write executor constructs argv exclusively from the kind registry (no plan-expressible method/path)", () => {
    const src = readFileSync(".straylight/bin/execute-write-plan.mjs", "utf8");
    expect(src).toMatch(/\["api", "-X", op\.method, op\.path, "--input", "-"\]/);
    expect(src).toMatch(/spawnSync\("gh", argv, \{\n\s*shell: false/);
    const writePlan = readFileSync(".straylight/lib/write-plan.mjs", "utf8");
    expect(writePlan).toMatch(/const OP_ID_RE/);
    expect(writePlan).toMatch(/checkConstructedPath/);
  });

  it("read plans and claims are authored only by checked-in Node entry points (collector/probe)", () => {
    const collector = readFileSync(".straylight/bin/collect-watchdog-evidence.mjs", "utf8");
    expect(collector).toMatch(/read-plan-issues\.json/);
    expect(collector).toMatch(/read-plan-prs\.json/);
    const reducer = readFileSync(".straylight/bin/plan-reducer-writes.mjs", "utf8");
    expect(reducer).toMatch(/claim\.json/);
    expect(reducer).toMatch(/read-plan\.json/);
    // No workflow writes either document.
    for (const f of WORKFLOWS) {
      const code = readFileSync(f, "utf8").split("\n").filter((l) => !l.trim().startsWith("#")).join("\n");
      expect(code, f).not.toMatch(/>\s*"?[^"\s]*(claim|read-plan)[^"\s]*\.json/);
    }
  });
});
