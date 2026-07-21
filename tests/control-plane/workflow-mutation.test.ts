// Control Plane v1 — executable workflow-boundary mutation matrix
// (round 10 J3, hardened round 11: the checker normalizes LOGICAL shell
// lines before matching, so a prohibited construct split across
// backslash/pipe continuations, spelled through an escaped command word
// (j\q), reached through command-position indirection ("$GH" api), or
// expressed as --method=POST / -XPOST / an implicit-POST field flag is
// the SAME construct).
//
// A structural test that only greps for yesterday's exploit is vacuous:
// it passes on a workflow that reintroduces the same class through a
// different spelling. This suite is built the other way around — a
// single checker (checkWorkflowBoundary) encodes the boundary as
// PROHIBITED CONSTRUCT CLASSES over the logical (non-comment) shell
// lines of a workflow, and every class is proven NON-VACUOUS by
// mutation: for each class, a real workflow is mutated to reintroduce
// the construct and the checker MUST flag it. If someone weakens the
// checker, the mutation rows fail; if someone reintroduces a construct,
// the clean rows fail. Both directions are executable.
//
// NORMALIZATION (round 11 J3 — each step closes a Codex bypass):
//   logical lines   — a physical line ending in `\`, `|`, or `&&`
//                     continues onto the next; rules match the JOINED
//                     command, so `gh api \` + `-X POST` is one write.
//   escaped words   — `\<alnum>` → `<alnum>` (an unquoted backslash
//                     before an alphanumeric is shell identity), so
//                     `j\q` matches \bjq\b.
//   substitutions   — $( … ) is scanned nesting-aware across the whole
//                     logical line; an UNCLOSED `$(` (a substitution
//                     spanning physical lines) is always flagged;
//                     backticks are always flagged.
//
// The classes (each a shell-authority vector Codex exploited in rounds
// 1–11 or an adjacent spelling):
//   inline-node          node -e / --eval / --input-type (inline source)
//   authority-jq         any jq invocation (escaped spellings included)
//   or-true              `|| true` swallowing a gh/node exit status
//   evidence-loop        while/for/until, read -r, mapfile/readarray
//   gh-write             api with -X/-XPOST/--method/--method= and a
//                        mutating verb; gh pr|issue mutation; api with
//                        an implicit-POST field/body flag (-f/-F/
//                        --field/--raw-field/--input)
//   gh-pipe              gh api piped into anything (multiline included)
//   command-substitution $( … ) capturing semantic output (only mktemp/
//                        date are non-semantic); unclosed $( ; backticks
//   command-indirection  a variable expansion in command position
//                        ("$GH" api …, ${NODE_BIN} … — a checker that
//                        keys on the literal words gh/node/jq must also
//                        refuse a variable standing where a command goes)
//   eval                 eval / source of dynamic content
//   ledger-append        bash writing ledger rows (any redirect into
//                        a .jsonl)
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

interface LogicalLine {
  line: number;
  text: string;
}

// A YAML block-scalar header (`run: |`, `run: |-`, `value: >+2`…) ends in
// a bar/fold indicator that is NOT a shell pipe.
const YAML_BLOCK_HEADER_RE = /:\s*[|>][+-]?[0-9]*\s*$/;

// Join physical lines into LOGICAL shell lines: a comment/blank line is
// dropped; a line ending in `\` (continuation), `|` (a pipe never ends a
// command — bash allows comment/blank lines between pipeline segments,
// so those are skipped), or `&&` continues onto the next physical line.
// The logical line is attributed to its FIRST physical line number.
function logicalLines(src: string): LogicalLine[] {
  const physical = src.split("\n");
  const out: LogicalLine[] = [];
  let i = 0;
  while (i < physical.length) {
    const raw = physical[i] ?? "";
    const trimmed = raw.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      i++;
      continue;
    }
    let text = raw;
    let j = i;
    for (;;) {
      const t = text.trimEnd();
      if (j + 1 >= physical.length) break;
      if (t.endsWith("\\")) {
        text = t.slice(0, -1) + " " + (physical[j + 1] ?? "");
        j++;
        continue;
      }
      if ((t.endsWith("|") && !YAML_BLOCK_HEADER_RE.test(t)) || t.endsWith("&&")) {
        // Bash skips comment/blank lines between pipeline segments.
        let k = j + 1;
        while (k < physical.length) {
          const nt = (physical[k] ?? "").trim();
          if (nt.length === 0 || nt.startsWith("#")) k++;
          else break;
        }
        if (k >= physical.length) break;
        text = t + " " + (physical[k] ?? "");
        j = k;
        continue;
      }
      break;
    }
    out.push({ line: i + 1, text });
    i = j + 1;
  }
  return out;
}

// Nesting-aware $( … ) extraction across one logical line. An unclosed
// substitution (spanning physical lines with no continuation marker)
// comes back with closed:false — the checker always flags it.
function commandSubstitutions(t: string): Array<{ inner: string; closed: boolean }> {
  const subs: Array<{ inner: string; closed: boolean }> = [];
  for (let k = 0; k < t.length - 1; k++) {
    if (t[k] === "$" && t[k + 1] === "(") {
      let depth = 1;
      let end = -1;
      for (let m = k + 2; m < t.length; m++) {
        const c = t[m];
        if (c === "(") depth++;
        else if (c === ")") {
          depth--;
          if (depth === 0) {
            end = m;
            break;
          }
        }
      }
      if (end === -1) {
        subs.push({ inner: t.slice(k + 2), closed: false });
        break;
      }
      subs.push({ inner: t.slice(k + 2, end), closed: true });
      k = end;
    }
  }
  return subs;
}

// Command position: start of logical line, or after ;  &&  |  ||  $(  `
// if  then  else  do  {  ! — anywhere bash would resolve the next word
// as a command.
const CMD_POS = String.raw`(?:^|;|&&|\|\|?|\$\(|` + "`" + String.raw`|\bif\b|\bthen\b|\belse\b|\bdo\b|\{|!)\s*`;

// The boundary checker: examine every LOGICAL shell line (comments and
// blank lines dropped; continuations joined; escaped command words
// normalized).
export function checkWorkflowBoundary(src: string): Violation[] {
  const violations: Violation[] = [];
  for (const { line, text } of logicalLines(src)) {
    // Escaped-word normalization: an unquoted backslash before an
    // alphanumeric is shell identity (j\q runs jq). Continuation
    // backslashes were already consumed by the join above.
    const t = text.replace(/\\([A-Za-z0-9_-])/g, "$1").trim();
    const flag = (rule: string) => violations.push({ rule, line, text: t });

    // inline-node: any inline Node source on the shell boundary.
    if (/\bnode\s+(-e\b|--eval\b|--input-type)/.test(t)) flag("inline-node");

    // authority-jq: jq anywhere on a logical line (escaped spellings
    // normalized above). There is no non-authority jq left in these
    // workflows; any reappearance is a boundary violation by definition.
    if (/\bjq\b/.test(t)) flag("authority-jq");

    // or-true: swallowing an exit status (multiline `||` + `true` joins
    // into one logical line above).
    if (/\|\|\s*true\b/.test(t)) flag("or-true");

    // evidence-loop: shell iteration over anything (loop routing belongs
    // to Node). `for` over a glob is equally banned — the fixed plans
    // enumerate for us.
    if (new RegExp(CMD_POS + String.raw`(while|for|until)\s`).test(t) ||
        /\bmapfile\b/.test(t) || /\breadarray\b/.test(t) || /\bread\s+-r\b/.test(t)) {
      flag("evidence-loop");
    }

    // gh-write: any mutating GitHub call outside the executors. The verb
    // may arrive as -X POST, -XPOST, --method POST, or --method=POST; the
    // command word may be indirect ("$GH" api — flagged again below), so
    // the api token alone anchors the rule.
    if (/\bapi\b/.test(t) && /(^|\s)-X\s*(POST|PATCH|PUT|DELETE)\b/.test(t)) flag("gh-write");
    if (/\bapi\b/.test(t) && /--method[=\s]\s*(POST|PATCH|PUT|DELETE)\b/i.test(t)) flag("gh-write");
    // gh api runs an implicit POST when any field/body flag is present —
    // a write needs no -X at all.
    if (/\bapi\b/.test(t) && /(^|\s)(-f|-F|--field|--raw-field|--input)\b/.test(t)) flag("gh-write");
    if (/\bgh\s+(pr|issue)\s+(create|edit|comment|close|reopen|merge|lock|unlock|transfer|delete|pin|unpin)\b/.test(t)) flag("gh-write");
    if (/--input\s*<\(/.test(t)) flag("gh-write");

    // gh-pipe: gh output interpreted by a pipeline (a trailing `|`
    // continues the logical line, so the multiline spelling joins).
    if (/gh api[^\n]*\|/.test(t)) flag("gh-pipe");

    // command-substitution: $( … ) capturing SEMANTIC output. mktemp and
    // date are environment plumbing, not evidence; everything else —
    // gh/node/jq/cat/echo arithmetic — is interpretation. An UNCLOSED
    // $( (a substitution spanning physical lines) always flags; so do
    // backticks.
    for (const sub of commandSubstitutions(t)) {
      const inner = sub.inner.trim();
      if (!sub.closed || (!/^mktemp\b/.test(inner) && !/^date\b/.test(inner))) {
        flag("command-substitution");
      }
    }
    if (t.includes("`")) flag("command-substitution");

    // command-indirection: a variable expansion standing where a command
    // goes. Every rule above keys on literal command words; a workflow
    // that spells the command as "$GH" or ${NODE_BIN} must be refused as
    // a class, not chased per spelling.
    if (new RegExp(CMD_POS + String.raw`"?\$\{?[A-Za-z_]`).test(t)) flag("command-indirection");

    // eval / dynamic source.
    if (/\beval\b/.test(t)) flag("eval");
    if (new RegExp(CMD_POS + String.raw`(source|\.)\s`).test(t)) flag("eval");

    // ledger-append: bash writing ledger rows (append or truncate).
    if (/>{1,2}\s*"?[^"\s]*\.jsonl/.test(t)) flag("ledger-append");
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
  // Insert a payload (possibly MULTI-LINE — the round-11 bypasses are
  // split constructs) into a real workflow's first run: block so the
  // mutation lives on executable lines in real context.
  function mutate(workflow: string, payload: string): string {
    const src = readFileSync(workflow, "utf8");
    const at = src.indexOf("set -euo pipefail");
    expect(at).toBeGreaterThan(-1);
    const lineStart = src.lastIndexOf("\n", at) + 1;
    const indent = src.slice(lineStart, at);
    const indented = payload.split("\n").map((l) => indent + l).join("\n");
    return src.slice(0, lineStart) + indented + "\n" + src.slice(lineStart);
  }

  const MUTATIONS: ReadonlyArray<readonly [string, string, string]> = [
    // [expected rule, payload, description]
    ["inline-node", `PROBE=$(node --input-type=module -e 'console.log(1)')`, "inline Node with --input-type"],
    ["inline-node", `node -e 'require("fs")' file.json`, "inline Node with -e"],
    ["authority-jq", `STATE=$(echo "$PROBE" | jq -r '.state // empty')`, "jq field extraction (the round-10 repro)"],
    ["authority-jq", `jq -cn --arg nonce "$NONCE" '{nonce: $nonce}' >> ledger.jsonl`, "jq ledger-row composition"],
    ["authority-jq", `j\\q -r '.state' < pr.json`, "ESCAPED command word j\\q (round-11 bypass)"],
    ["authority-jq", `gh api "repos/x/y/issues/41" |\n  j\\q -r '.state'`, "multiline pipe into escaped j\\q (round-11 bypass)"],
    ["or-true", `gh api "repos/x/y/pulls/1" > pr.json 2>/dev/null || true`, "|| true swallowing a fetch failure"],
    ["or-true", `gh api "repos/x/y/pulls/1" > pr.json ||\n  true`, "multiline || true (round-11 bypass)"],
    ["evidence-loop", `for N in 1 2 3; do echo "$N"; done`, "shell for-loop routing"],
    ["evidence-loop", `while read -r SLOT; do echo "$SLOT"; done < slots.txt`, "while-read routing over derived output"],
    ["evidence-loop", `mapfile -t ISSUES < issues.txt`, "mapfile materialization"],
    ["gh-write", `gh api -X POST "repos/x/y/issues/1/comments" --input body.json`, "direct gh write"],
    ["gh-write", `gh api -XPOST "repos/x/y/issues/1/comments" --input body.json`, "-XPOST no-space spelling"],
    ["gh-write", `gh api --method DELETE "repos/x/y/issues/1/labels/cp-paused"`, "direct gh write via --method"],
    ["gh-write", `gh api --method=POST "repos/x/y/issues/1/comments" --input body.json`, "--method=POST equals spelling (round-11 bypass)"],
    ["gh-write", `gh api \\\n  -X POST "repos/x/y/issues/1/comments" --input body.json`, "multiline continuation write (round-11 bypass)"],
    ["gh-write", `"$GH" api -X POST "repos/x/y/issues/1/comments" --input body.json`, "variable command name write (round-11 bypass)"],
    ["gh-write", `gh api "repos/x/y/issues/1/comments" -f body=hi`, "implicit POST via field flag (no -X at all)"],
    ["gh-write", `gh issue comment 41 --body hi`, "gh issue mutation"],
    ["gh-pipe", `gh api "repos/x/y/issues" | grep -q cp-lane`, "gh piped into grep"],
    ["gh-pipe", `gh api "repos/x/y/issues" |\n  grep -q cp-lane`, "multiline gh pipe (round-11 bypass)"],
    ["command-substitution", `HEAD=$(gh api "repos/x/y/pulls/1")`, "capturing gh output"],
    ["command-substitution", `HEAD=$(\n  gh api "repos/x/y/pulls/1"\n)`, "MULTILINE semantic substitution (round-11 bypass)"],
    ["command-substitution", `SHA=$(sha256sum file | cut -d' ' -f1)`, "capturing digest computation"],
    ["command-substitution", `BASE=$(cat /tmp/base-sha.txt)`, "capturing file content"],
    ["command-substitution", "HEAD=`gh api \"repos/x/y/pulls/1\"`", "backtick substitution"],
    ["command-indirection", `"$GH" api "repos/x/y/pulls/1" > pr.json`, "variable command name fetch (round-11 bypass)"],
    ["command-indirection", `\${NODE_BIN} .straylight/bin/execute-write-plan.mjs --plan evil.json`, "variable node binary"],
    ["eval", `eval "$CMD"`, "eval of dynamic content"],
    ["eval", `source /tmp/dynamic.sh`, "dynamic source"],
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
      "gh-pipe", "command-substitution", "command-indirection", "eval",
      "ledger-append", "redirect-derived",
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
