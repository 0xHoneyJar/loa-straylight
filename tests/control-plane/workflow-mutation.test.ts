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
// NORMALIZATION (rounds 11–12 J3/J2 — each step closes a Codex bypass):
//   logical lines   — a physical line ending in `\`, `|`, or `&&`
//                     continues onto the next; rules match the JOINED
//                     command, so `gh api \` + `-X POST` is one write.
//   escaped words   — `\<alnum>` → `<alnum>` (an unquoted backslash
//                     before an alphanumeric is shell identity), so
//                     `j\q` matches \bjq\b.
//   quoted words    — a word-content quote pair GLUED to a word char is
//                     shell identity (`n'o'de` runs node, `g'h'` runs
//                     gh); joined to fixed point before matching.
//   substitutions   — $( … ) is scanned nesting-aware across the whole
//                     logical line; EVERY separator-split command inside
//                     ($(date; cat x), $(mktemp && gh api …)) must be
//                     non-semantic plumbing with no nested substitution;
//                     an UNCLOSED `$(` (a substitution spanning physical
//                     lines) is always flagged; backticks are always
//                     flagged; process substitution `<( … )` / `>( … )`
//                     is refused outright as its own class.
//   effective commands — (round 13) each escape-normalized logical
//                     line is further split into SIMPLE COMMANDS
//                     (quote-aware, on ; & | && || and newline — a
//                     separator inside quotes or a substitution does
//                     not split), every substitution body ($( … ),
//                     backticks, <( … ), >( … )) recurses through the
//                     same decomposition, per-word quote stripping
//                     resolves the spelling bash would execute (g'h' is
//                     the word gh), and each command's wrapper prefix —
//                     control words (if/then/!/…), `command`, `env`
//                     (options and NAME=value assignments), `exec`,
//                     `nohup`, `builtin`, and bare VAR=value assignment
//                     prefixes — is unwrapped so rules see the
//                     EFFECTIVE executable and argv, never raw text.
//
// The checker is a REGRESSION TRIPWIRE over checked-in workflow text —
// it proves each known bypass class stays caught, not that every
// possible shell spelling is; structural authority over writes and
// derived reads remains the fixed Node executors.
//
// The classes (each a shell-authority vector Codex exploited in rounds
// 1–12 or an adjacent spelling):
//   inline-node          node -e / -p / --eval / --print / --input-type
//                        (inline source or print-evaluation)
//   authority-jq         any jq invocation (escaped spellings included)
//   or-true              `|| true` swallowing a gh/node exit status
//   evidence-loop        while/for/until, read -r, mapfile/readarray
//   gh-write             api with -X/-XPOST/--method/--method= and a
//                        mutating verb; gh pr|issue mutation; api with
//                        an implicit-POST field/body flag (-f/-F/
//                        --field/--raw-field/--input, the compact
//                        -fkey=value/-Fkey=value spellings included)
//   gh-pipe              gh api piped into anything (multiline included)
//   command-substitution $( … ) capturing semantic output — EVERY
//                        separator-split command inside must be
//                        non-semantic plumbing (mktemp/date) with no
//                        nested substitution; unclosed $( ; backticks
//   process-substitution <( … ) / >( … ) anywhere (a fetch or write
//                        smuggled through a substituted FD is the same
//                        authority as a pipe)
//   command-indirection  a variable expansion in command position
//                        ("$GH" api …, ${NODE_BIN} … — a checker that
//                        keys on the literal words gh/node/jq must also
//                        refuse a variable standing where a command goes)
//   gh-api-derived       (round 13) ANY effective gh invocation — api or
//                        any subcommand; direct, quoted-word (g'h'),
//                        wrapped (command/env/exec/assignment prefix),
//                        or inside any substitution — that is not the
//                        EXACT fail-closed guarded fixed read
//                        `if ! gh api [--paginate] "repos/${REPO}/…" > file`;
//                        judged over resolved effective commands, never
//                        raw text
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

// Escaped-word + quoted-word normalization shared by the line rules and
// the effective-command decomposition: an unquoted backslash before an
// alphanumeric is shell identity (j\q runs jq), and a quote pair GLUED
// to a word character on either side is shell word-identity (n'o'de
// runs node, g'h' runs gh — round 12 J2). Joined to fixed point BEFORE
// matching so every rule sees the word the shell would resolve.
function normalizeLogical(text: string): string {
  let t = text.replace(/\\([A-Za-z0-9_-])/g, "$1").trim();
  for (;;) {
    const joined = t
      .replace(/(\w)'([^']*)'/g, "$1$2")
      .replace(/'([^']*)'(\w)/g, "$1$2")
      .replace(/(\w)"([^"]*)"/g, "$1$2")
      .replace(/"([^"]*)"(\w)/g, "$1$2");
    if (joined === t) break;
    t = joined;
  }
  return t;
}

// ---------------------------------------------------------------------------
// Round 13 — EFFECTIVE-COMMAND decomposition. Round 12 joined quoted-word
// spellings on the LINE, but the fixed-read guard still ran over raw text
// and no rule resolved what bash would actually EXECUTE: `g'h' api … > f`
// (no pipe, no -X, no field flag), `command gh api …`, and
// `env TOKEN=x gh api …` evaded every class. Every normalized logical
// line is now decomposed into the SIMPLE COMMANDS bash would run —
// quote-aware split on ; & | && || and newline; substitution bodies
// ($( … ), backticks, <( … ), >( … )) recursed through the same
// decomposition; per-word quote stripping; command-position wrappers
// (command/env/exec/nohup/builtin — options and NAME=value assignments
// included) and bare assignment prefixes unwrapped — and the rules judge
// the EFFECTIVE executable and argv. An effective `gh` invocation is
// categorically refused (gh-api-derived) unless the command is the EXACT
// fail-closed guarded fixed read, unwrapped and unsubstituted:
//   if ! gh api [--paginate] "repos/${REPO}/(issues|labels)…" > <fixed target>
// ---------------------------------------------------------------------------

interface EffectiveCommand {
  /** Resolved words: quotes stripped, wrappers/assignments unwrapped. */
  words: string[];
  /** The command is the condition of a fail-closed `if !` guard. */
  guarded: boolean;
  /** A wrapper word or assignment prefix stood before the executable. */
  wrapped: boolean;
  /** The command lives inside $( … ), ` … `, <( … ) or >( … ). */
  inSubstitution: boolean;
}

// Nesting-aware paren scan shared by the substitution extractors. An
// unclosed body extends to end-of-text (the command-substitution rule
// independently flags the unclosed spelling).
function parenBody(text: string, from: number): { body: string; end: number } {
  let depth = 1;
  for (let m = from; m < text.length; m++) {
    const c = text[m];
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return { body: text.slice(from, m), end: m + 1 };
    }
  }
  return { body: text.slice(from), end: text.length };
}

// Quote-aware split of one shell text into simple-command segments plus
// the bodies of every substitution found at this level. Separators inside
// single/double quotes do not split; $( … ) and backticks still substitute
// inside double quotes (bash semantics); <( … ) / >( … ) substitute only
// unquoted. Substitution spans are replaced by a $SUB placeholder so the
// outer command tokenizes cleanly (and a command-position substitution
// surfaces as a $-word in command position — indirection).
function splitSimple(text: string): { segments: string[]; bodies: string[] } {
  const segments: string[] = [];
  const bodies: string[] = [];
  let cur = "";
  let inDouble = false;
  let i = 0;
  const push = () => {
    const s = cur.trim();
    if (s.length > 0) segments.push(s);
    cur = "";
  };
  while (i < text.length) {
    const c = text[i] ?? "";
    if (!inDouble && c === "'") {
      const end = text.indexOf("'", i + 1);
      cur += text.slice(i, end === -1 ? text.length : end + 1);
      i = end === -1 ? text.length : end + 1;
      continue;
    }
    if (c === "\\") {
      cur += text.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (c === '"') {
      inDouble = !inDouble;
      cur += c;
      i++;
      continue;
    }
    if (c === "$" && text[i + 1] === "(") {
      const { body, end } = parenBody(text, i + 2);
      bodies.push(body);
      cur += "$SUB";
      i = end;
      continue;
    }
    if (c === "`") {
      const end = text.indexOf("`", i + 1);
      bodies.push(text.slice(i + 1, end === -1 ? text.length : end));
      cur += "$SUB";
      i = end === -1 ? text.length : end + 1;
      continue;
    }
    if (!inDouble && (c === "<" || c === ">") && text[i + 1] === "(") {
      const { body, end } = parenBody(text, i + 2);
      bodies.push(body);
      cur += "$SUB";
      i = end;
      continue;
    }
    if (!inDouble && (c === ";" || c === "&" || c === "|" || c === "\n")) {
      push();
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  push();
  return { segments, bodies };
}

// Word tokenizer with per-word quote stripping: `g"h"` and `"g"'h'` both
// resolve to the word gh, exactly as bash joins adjacent quoted and
// unquoted fragments of one word.
function tokenizeWords(segment: string): string[] {
  const words: string[] = [];
  let cur = "";
  let has = false;
  let i = 0;
  while (i < segment.length) {
    const c = segment[i] ?? "";
    if (c === "'" || c === '"') {
      const end = segment.indexOf(c, i + 1);
      cur += segment.slice(i + 1, end === -1 ? segment.length : end);
      has = true;
      i = end === -1 ? segment.length : end + 1;
      continue;
    }
    if (c === "\\" && i + 1 < segment.length) {
      cur += segment[i + 1] ?? "";
      has = true;
      i += 2;
      continue;
    }
    if (/\s/.test(c)) {
      if (has) {
        words.push(cur);
        cur = "";
        has = false;
      }
      i++;
      continue;
    }
    cur += c;
    has = true;
    i++;
  }
  if (has) words.push(cur);
  return words;
}

const CONTROL_WORDS = new Set(["if", "then", "elif", "else", "fi", "do", "done", "while", "until", "case", "esac", "!", "{", "}", "time"]);
// Wrappers whose prefix is exhausted by options/assignments — words like
// `timeout 30 …` (a non-option argument before the command) are NOT here:
// half-unwrapping them would misidentify the effective executable, and a
// wrapper this decomposition cannot resolve still fails the fixed-read
// test's permitted shape (fail closed for the clean direction).
const WRAPPER_WORDS = new Set(["command", "env", "exec", "nohup", "builtin", "setsid", "stdbuf"]);
const ASSIGNMENT_WORD_RE = /^[A-Za-z_][A-Za-z0-9_]*\+?=/;
// env options that consume a separate argument word.
const ENV_OPT_WITH_ARG = new Set(["-u", "--unset", "-C", "--chdir"]);

// Resolve the EFFECTIVE executable: drop control-word prefixes (recording
// the fail-closed `if !` guard), bare assignment prefixes, and wrapper
// words with their options/assignments, to a fixed point.
function resolveEffective(tokens: string[]): { words: string[]; guarded: boolean; wrapped: boolean } {
  let w = [...tokens];
  let guarded = false;
  let wrapped = false;
  while (w.length > 0 && CONTROL_WORDS.has(w[0] ?? "")) {
    if (w[0] === "if" && w[1] === "!") {
      guarded = true;
      w = w.slice(2);
      continue;
    }
    w = w.slice(1);
  }
  for (;;) {
    const head = w[0] ?? "";
    if (ASSIGNMENT_WORD_RE.test(head)) {
      if (w.length > 1) wrapped = true;
      w = w.slice(1);
      continue;
    }
    if (WRAPPER_WORDS.has(head)) {
      wrapped = true;
      w = w.slice(1);
      while (w.length > 0) {
        const x = w[0] ?? "";
        if (head === "env" && ENV_OPT_WITH_ARG.has(x)) {
          w = w.slice(2);
          continue;
        }
        // Any option-looking word, the bare `-` (env's clear-environment
        // spelling) included: consuming MORE prefix words only makes MORE
        // spellings resolve to their effective executable — the closed
        // direction for a tripwire.
        if (x.startsWith("-")) {
          w = w.slice(1);
          continue;
        }
        if (ASSIGNMENT_WORD_RE.test(x)) {
          w = w.slice(1);
          continue;
        }
        break;
      }
      continue;
    }
    break;
  }
  return { words: w, guarded, wrapped };
}

// Decompose one normalized logical line into every effective command at
// every substitution depth.
function decomposeCommands(t: string): EffectiveCommand[] {
  const out: EffectiveCommand[] = [];
  const walk = (text: string, inSubstitution: boolean) => {
    const { segments, bodies } = splitSimple(text);
    for (const seg of segments) {
      const tokens = tokenizeWords(seg);
      if (tokens.length === 0) continue;
      const { words, guarded, wrapped } = resolveEffective(tokens);
      if (words.length === 0) continue;
      out.push({ words, guarded, wrapped, inSubstitution });
    }
    for (const body of bodies) walk(body, true);
  };
  walk(t, false);
  return out;
}

// The ONE permitted effective-gh shape: the fail-closed guarded FIXED
// read — unwrapped, unsubstituted, `api` (optionally --paginate), a
// fixed issues/labels url, one redirect target drawn from the fixed
// gather/collection variables, and NOTHING after the target.
const FIXED_READ_URL_RE = /^repos\/\$\{REPO\}\/(issues|labels)([/?]|$)/;
const FIXED_TARGET_VARS = new Set(["DIR", "G1", "G2", "DIR_A", "DIR_B", "REPO", "ISSUE_NUMBER"]);

function isPermittedFixedRead(cmd: EffectiveCommand): boolean {
  if (cmd.inSubstitution || cmd.wrapped || !cmd.guarded) return false;
  const w = cmd.words;
  let k = 1;
  if (w[k] !== "api") return false;
  k++;
  if (w[k] === "--paginate") k++;
  const url = w[k] ?? "";
  if (!FIXED_READ_URL_RE.test(url) || /\/(pulls|commits)(\/|$)/.test(url)) return false;
  // Every variable in the url AND the target must come from the fixed
  // gather/collection set — a url built from a shell-parsed variable
  // (repos/${REPO}/issues/${TARGET}) is a derived read even when its
  // prefix looks fixed.
  const fixedVarsOnly = (s: string) =>
    [...s.matchAll(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g)].every((m) => FIXED_TARGET_VARS.has(m[1] ?? ""));
  if (!fixedVarsOnly(url) || url.includes("$SUB")) return false;
  k++;
  if (w[k] !== ">") return false;
  const target = w[k + 1] ?? "";
  if (target.length === 0 || w.length > k + 2) return false;
  return fixedVarsOnly(target) && !target.includes("$SUB");
}

export interface GhInvocation {
  line: number;
  words: string[];
  guarded: boolean;
  wrapped: boolean;
  inSubstitution: boolean;
  permitted: boolean;
}

// Every effective gh invocation in a workflow source, with its verdict —
// the NORMALIZED surface the fixed-read test asserts over (never raw
// text).
export function collectEffectiveGhInvocations(src: string): GhInvocation[] {
  const out: GhInvocation[] = [];
  for (const { line, text } of logicalLines(src)) {
    // Decomposition runs on the RAW logical line: its tokenizer resolves
    // quotes per-word with real shell semantics (g'h' is the word gh; a
    // quoted url keeps its & and > INSIDE the word). The line-level
    // quote-join in normalizeLogical is only for the regex rules — it
    // glues ACROSS whitespace (`s" > "` → `s > `), which would corrupt
    // command splitting here.
    for (const cmd of decomposeCommands(text.trim())) {
      if ((cmd.words[0] ?? "") === "gh") {
        out.push({ line, ...cmd, permitted: isPermittedFixedRead(cmd) });
      }
    }
  }
  return out;
}

// The boundary checker: examine every LOGICAL shell line (comments and
// blank lines dropped; continuations joined; escaped command words
// normalized).
export function checkWorkflowBoundary(src: string): Violation[] {
  const violations: Violation[] = [];
  for (const { line, text } of logicalLines(src)) {
    const t = normalizeLogical(text);
    const flag = (rule: string) => violations.push({ rule, line, text: t });

    // inline-node: any inline Node source OR print-evaluation on the
    // shell boundary (-p/--print evaluate and print — round 12 J2).
    if (/\bnode\s+(-e\b|-p\b|--eval\b|--print\b|--input-type)/.test(t)) flag("inline-node");

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
    // a write needs no -X at all. The compact short-option spelling glues
    // the key to the flag (-fbody=hello ≡ -f body=hello — round 12 J2).
    if (/\bapi\b/.test(t) && /(^|\s)(-f|-F)(\b|[A-Za-z_])/.test(t)) flag("gh-write");
    if (/\bapi\b/.test(t) && /(^|\s)(--field|--raw-field|--input)\b/.test(t)) flag("gh-write");
    if (/\bgh\s+(pr|issue)\s+(create|edit|comment|close|reopen|merge|lock|unlock|transfer|delete|pin|unpin)\b/.test(t)) flag("gh-write");
    if (/--input\s*<\(/.test(t)) flag("gh-write");

    // gh-pipe: gh output interpreted by a pipeline (a trailing `|`
    // continues the logical line, so the multiline spelling joins).
    if (/gh api[^\n]*\|/.test(t)) flag("gh-pipe");

    // command-substitution: $( … ) capturing SEMANTIC output. mktemp and
    // date are environment plumbing, not evidence; everything else —
    // gh/node/jq/cat/echo arithmetic — is interpretation. EVERY
    // separator-split command inside the substitution must be
    // non-semantic, with no nested substitution: $(date; cat evidence.json)
    // and $(mktemp && gh api …) are interpretation smuggled behind a
    // plumbing prefix (round 12 J2). An UNCLOSED $( (a substitution
    // spanning physical lines) always flags; so do backticks.
    for (const sub of commandSubstitutions(t)) {
      const inner = sub.inner.trim();
      const commands = inner.split(/\|\||&&|[;|&\n]/).map((c) => c.trim()).filter((c) => c.length > 0);
      const nonSemantic =
        sub.closed &&
        !inner.includes("$(") &&
        !inner.includes("`") &&
        commands.length > 0 &&
        commands.every((c) => /^(mktemp|date)\b/.test(c));
      if (!nonSemantic) flag("command-substitution");
    }
    if (t.includes("`")) flag("command-substitution");

    // process-substitution: <( … ) / >( … ) anywhere — a fetch or write
    // smuggled through a substituted file descriptor (cat <(gh api …))
    // is pipe authority by another spelling (round 12 J2).
    if (/[<>]\(/.test(t)) flag("process-substitution");

    // command-indirection: a variable expansion standing where a command
    // goes. Every rule above keys on literal command words; a workflow
    // that spells the command as "$GH" or ${NODE_BIN} must be refused as
    // a class, not chased per spelling.
    if (new RegExp(CMD_POS + String.raw`"?\$\{?[A-Za-z_]`).test(t)) flag("command-indirection");

    // gh-api-derived (round 13): judge the EFFECTIVE commands, not the
    // text. The rules above catch known spellings; this rule refuses the
    // CLASS — g'h' api, command gh api, env TOKEN=x gh api, exec gh api,
    // an assignment-prefixed gh, and gh inside any substitution all
    // resolve to the same effective executable and are all refused
    // unless the command IS the exact fail-closed guarded fixed read
    // (unwrapped, unsubstituted, fixed issues/labels url, fixed target).
    // Decomposition runs on the RAW logical line — its tokenizer resolves
    // quotes with real shell semantics; the line-level quote-join above
    // glues ACROSS whitespace and would corrupt command splitting.
    for (const cmd of decomposeCommands(text.trim())) {
      if ((cmd.words[0] ?? "") === "gh" && !isPermittedFixedRead(cmd)) flag("gh-api-derived");
      // Decomposition-level sibling of the line rule above: a variable
      // (or substitution result) standing where a command goes, after a
      // separator the line regex cannot anchor on (the single `&`).
      if (/^\$/.test(cmd.words[0] ?? "") && cmd.words.length > 1) flag("command-indirection");
    }

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
    ["inline-node", `node -p 'JSON.parse(require("fs").readFileSync("pr.json")).state'`, "Node print-evaluation -p (round-12 bypass)"],
    ["inline-node", `node --print 'process.version'`, "Node print-evaluation --print (round-12 bypass)"],
    ["inline-node", `n'o'de -e 'console.log(1)'`, "quoted-word-concatenated n'o'de (round-12 bypass)"],
    ["inline-node", `n"o"de -p '1+1'`, "double-quoted-word-concatenated n\"o\"de (round-12 bypass)"],
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
    ["gh-write", `gh api -fbody=hello "repos/x/y/issues/1/comments"`, "compact -fbody=hello field spelling (round-12 bypass)"],
    ["gh-write", `gh api -Fname=value "repos/x/y/issues/1/comments"`, "compact -Fname=value field spelling (round-12 bypass)"],
    ["gh-write", `g'h' api -fbody=hello "repos/x/y/issues/1/comments"`, "quoted-word-concatenated g'h' write (round-12 bypass)"],
    ["gh-write", `gh issue comment 41 --body hi`, "gh issue mutation"],
    ["gh-pipe", `gh api "repos/x/y/issues" | grep -q cp-lane`, "gh piped into grep"],
    ["gh-pipe", `gh api "repos/x/y/issues" |\n  grep -q cp-lane`, "multiline gh pipe (round-11 bypass)"],
    ["gh-pipe", `g'h' api "repos/x/y/issues/41" | sed -n 's/.*"state": "\\([a-z]*\\)".*/\\1/p'`, "quoted-word g'h' piped into sed (round-12 bypass)"],
    ["command-substitution", `HEAD=$(gh api "repos/x/y/pulls/1")`, "capturing gh output"],
    ["command-substitution", `HEAD=$(\n  gh api "repos/x/y/pulls/1"\n)`, "MULTILINE semantic substitution (round-11 bypass)"],
    ["command-substitution", `SHA=$(sha256sum file | cut -d' ' -f1)`, "capturing digest computation"],
    ["command-substitution", `BASE=$(cat /tmp/base-sha.txt)`, "capturing file content"],
    ["command-substitution", `VALUE=$(date; cat evidence.json)`, "semantic command behind a date prefix (round-12 bypass)"],
    ["command-substitution", `TMP=$(mktemp && gh api "repos/x/y/pulls/1")`, "semantic command behind a mktemp prefix (round-12 bypass)"],
    ["command-substitution", `T=$(date -u +%s | tee /tmp/now)`, "plumbing piped into a semantic consumer"],
    ["command-substitution", "HEAD=`gh api \"repos/x/y/pulls/1\"`", "backtick substitution"],
    ["process-substitution", `cat <(gh api "repos/x/y/pulls/1")`, "fetch smuggled through process substitution (round-12 bypass)"],
    ["process-substitution", `tee >(sha256sum > /tmp/d) < pr.json`, "write-side process substitution"],
    ["command-indirection", `"$GH" api "repos/x/y/pulls/1" > pr.json`, "variable command name fetch (round-11 bypass)"],
    ["command-indirection", `\${NODE_BIN} .straylight/bin/execute-write-plan.mjs --plan evil.json`, "variable node binary"],
    ["gh-api-derived", `gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "direct UNGUARDED derived read — no pipe, no write flag (round-13 class)"],
    ["gh-api-derived", `g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`, "quoted-word g'h' derived read (round-13 bypass)"],
    ["gh-api-derived", `command g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`, "command-wrapped quoted-word derived read (round-13 bypass)"],
    ["gh-api-derived", `env g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`, "env-wrapped quoted-word derived read (round-13 bypass)"],
    ["gh-api-derived", `env TOKEN=x gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "env-with-assignment derived read (round-13 bypass)"],
    ["gh-api-derived", `exec gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "exec-wrapped derived read"],
    ["gh-api-derived", `GH_PAGER= gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "bare-assignment-prefixed derived read"],
    ["gh-api-derived", `HEAD=$(gh api "repos/x/y/pulls/1")`, "gh api inside command substitution (effective-command row)"],
    ["gh-api-derived", `cat <(gh api "repos/x/y/pulls/1")`, "gh api inside process substitution (effective-command row)"],
    ["gh-api-derived", `gh api "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"`, "fixed-shape read WITHOUT the fail-closed if ! guard"],
    ["command-indirection", `\${GH} api "repos/x/y/pulls/1" > pr.json`, "brace-expansion command name fetch (round-13)"],
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
      "gh-pipe", "command-substitution", "process-substitution",
      "command-indirection", "gh-api-derived", "eval", "ledger-append",
      "redirect-derived",
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
  it("every EFFECTIVE gh invocation in a workflow is the guarded FIXED read (normalized commands, never raw text — round 13)", () => {
    for (const f of WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      // The invocation list comes from the same effective-command
      // decomposition the checker uses: quoted-word spellings, wrappers
      // (command/env/exec/assignments), and substitution bodies all
      // resolve to their effective executable — a raw-text scan that a
      // g'h' spelling or an `env gh` prefix slips past cannot happen
      // here by construction.
      const invocations = collectEffectiveGhInvocations(src);
      // The real workflows DO fetch — an empty list would mean the
      // decomposition went blind, which must fail this test too.
      expect(invocations.length, `${f}: no effective gh invocations found`).toBeGreaterThan(0);
      for (const inv of invocations) {
        expect(inv.permitted, `${f}:${inv.line}: ${inv.words.join(" ")}`).toBe(true);
        // Redundant belt: permitted implies unwrapped, unsubstituted,
        // guarded, api-subcommand, fixed url, no derived pulls/commits.
        expect(inv.wrapped).toBe(false);
        expect(inv.inSubstitution).toBe(false);
        expect(inv.guarded).toBe(true);
        expect(inv.words[1]).toBe("api");
        expect(inv.words.join(" ")).not.toMatch(/\/(pulls|commits)\//);
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
