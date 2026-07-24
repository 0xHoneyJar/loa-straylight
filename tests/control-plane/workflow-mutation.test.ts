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
//                     control words (if/then/!/…), bare VAR=value
//                     assignment prefixes, and a CLOSED allowlist of
//                     executable wrappers resolved per their fixed
//                     syntax (round 14: command, env — assignments,
//                     options, `--`, path spellings like /usr/bin/env —
//                     exec, nohup, builtin, setsid, stdbuf incl. -o L,
//                     timeout incl. duration/--signal, nice incl. -n) —
//                     is unwrapped so rules see the EFFECTIVE
//                     executable and argv, never raw text. FAIL CLOSED:
//                     a wrapper whose command position cannot be proven
//                     (env --split-string, an unknown option, a
//                     non-duration timeout operand) is a violation in
//                     itself (wrapper-unresolved); xargs is refused
//                     categorically (it builds commands from its input
//                     stream); and a bare gh word in the argv of any
//                     unmodeled head (doas gh api …) is refused as a
//                     derived invocation — "unresolved" never reads as
//                     "no gh invocation here".
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
//   gh-api-derived       (round 13, exact since round 15) ANY effective
//                        gh invocation — api or any subcommand; direct,
//                        quoted-word (g'h'), wrapped (command/env/exec/
//                        timeout/nice/stdbuf/setsid/assignment prefix,
//                        path spellings included), inside any
//                        substitution, or as a bare gh argv word under
//                        an unmodeled head — whose normalized argv is
//                        not a member of the CLOSED allowlist of the
//                        seven checked-in read tuples
//                        (PERMITTED_FIXED_READS: exact endpoint incl.
//                        query string and pagination flags, exact
//                        output path, bound to its exact workflows) OR
//                        that is not the SOLE condition of a
//                        fail-closed `if ! <read>; then` (a compound
//                        condition — `; false; then`, `&& true`,
//                        `|| true`, a pipeline, any command before
//                        `then` — lets another status replace the
//                        read's); judged over resolved effective
//                        commands with retained separator context,
//                        never raw text
//   wrapper-unresolved   (round 14) an allowlisted wrapper whose command
//                        position cannot be proven from its fixed syntax
//                        (env --split-string/-S, unknown options, a
//                        non-literal timeout duration) — fail closed:
//                        unproven is a violation, never "no command"
//   xargs                (round 14) xargs anywhere in workflow shell —
//                        it constructs and invokes commands from its
//                        input stream, so no static wrapped-command
//                        resolution is sound; refused categorically
//   eval                 eval / source of dynamic content
//   ledger-append        bash writing ledger rows (any redirect into
//                        a .jsonl)
//   redirect-derived     redirecting gh output to a path built from a
//                        shell-parsed variable other than the fixed
//                        gather/collection dirs

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

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
  /**
   * The command is the SOLE condition of a fail-closed `if ! <cmd>; then`
   * (round 15): it starts with `if !`, ends at `;`/newline, and the very
   * next segment is exactly `then`. A compound condition (`; false; then`,
   * `&& true; then`, `| cat; then`) lets another command replace the
   * read's exit status before `then` — that is NOT guarded.
   */
  guarded: boolean;
  /** A wrapper word or assignment prefix stood before the executable. */
  wrapped: boolean;
  /** The command lives inside $( … ), ` … `, <( … ) or >( … ). */
  inSubstitution: boolean;
  /**
   * An allowlisted wrapper's command position could NOT be proven from
   * its fixed syntax (unknown option, env --split-string, non-duration
   * timeout operand). MUST be treated as a violation by every consumer —
   * never as "no command found" (round 14, fail closed).
   */
  unresolved: boolean;
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
// surfaces as a $-word in command position — indirection). Each segment
// RETAINS the separator that ended it (round 15): condition-list
// structure — `; then` vs `; false; then` vs `&& true; then` — is
// authority-relevant and must survive decomposition.
interface SimpleSegment {
  text: string;
  /** The separator that ENDED this segment: ";", "&", "&&", "|", "||", "\n", or "" at end-of-text. */
  sep: string;
}
function splitSimple(text: string): { segments: SimpleSegment[]; bodies: string[] } {
  const segments: SimpleSegment[] = [];
  const bodies: string[] = [];
  let cur = "";
  let inDouble = false;
  let i = 0;
  const push = (sep: string) => {
    const s = cur.trim();
    if (s.length > 0) segments.push({ text: s, sep });
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
      let sep = c;
      if ((c === "&" || c === "|") && text[i + 1] === c) {
        sep = c + c;
        i++;
      }
      push(sep);
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  push("");
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
const ASSIGNMENT_WORD_RE = /^[A-Za-z_][A-Za-z0-9_]*\+?=/;

// A wrapper may be spelled through a path (/usr/bin/env, /usr/bin/gh);
// match on the final path component.
function wordBasename(w: string): string {
  const i = w.lastIndexOf("/");
  return i === -1 ? w : w.slice(i + 1);
}

// WRAPPER-RESOLUTION CONTRACT (round 14, fail closed): a CLOSED allowlist
// of executables whose command position can be proven from their fixed
// syntax. Each resolver consumes the wrapper's own options/operands and
// returns the wrapped command's argv — or null when the command position
// cannot be proven (an unknown option, an env --split-string that embeds
// a command in a string, a timeout whose duration operand is not a
// duration). null NEVER means "no command": the caller flags it as a
// boundary violation (wrapper-unresolved). Wrappers NOT on this list are
// not silently trusted either — any command whose argv still carries a
// bare `gh` word after resolution is flagged, so an unknown wrapper
// (doas gh api …) fails closed rather than hiding the invocation.
type WrapperResolver = (args: string[]) => string[] | null;
const WRAPPERS: Record<string, WrapperResolver> = {
  command: (a) => {
    let i = 0;
    while (i < a.length) {
      const x = a[i] ?? "";
      if (x === "--") { i++; break; }
      if (/^-[pvV]+$/.test(x)) { i++; continue; }
      if (x.startsWith("-")) return null;
      break;
    }
    return a.slice(i);
  },
  env: (a) => {
    let i = 0;
    while (i < a.length) {
      const x = a[i] ?? "";
      if (x === "--") { i++; break; }
      if (x === "-") { i++; continue; } // clear-environment spelling
      // -S/--split-string re-splits a STRING into a command — the command
      // position lives inside an embedded word this tokenizer must not
      // guess at. Fail closed.
      if (x.startsWith("-S") || x.startsWith("--split-string")) return null;
      if (x === "-u" || x === "--unset" || x === "-C" || x === "--chdir") { i += 2; continue; }
      if (/^--(unset|chdir)=/.test(x) || /^-u./.test(x) || /^-C./.test(x)) { i++; continue; }
      if (x === "-i" || x === "--ignore-environment" || x === "-0" || x === "--null" || x === "-v" || x === "--debug") { i++; continue; }
      if (x.startsWith("-")) return null; // unknown env option → unproven command position
      if (ASSIGNMENT_WORD_RE.test(x)) { i++; continue; }
      break;
    }
    return a.slice(i);
  },
  exec: (a) => {
    let i = 0;
    while (i < a.length) {
      const x = a[i] ?? "";
      if (x === "--") { i++; break; }
      if (x === "-a") { i += 2; continue; }
      if (/^-[cl]+$/.test(x)) { i++; continue; }
      if (x.startsWith("-")) return null;
      break;
    }
    return a.slice(i);
  },
  nohup: (a) => a,
  builtin: (a) => a,
  setsid: (a) => {
    let i = 0;
    while (i < a.length) {
      const x = a[i] ?? "";
      if (x === "--") { i++; break; }
      if (/^-[cwf]+$/.test(x)) { i++; continue; }
      if (x.startsWith("-")) return null;
      break;
    }
    return a.slice(i);
  },
  stdbuf: (a) => {
    let i = 0;
    while (i < a.length) {
      const x = a[i] ?? "";
      if (x === "--") { i++; break; }
      if (x === "-i" || x === "-o" || x === "-e") { i += 2; continue; } // -o L
      if (/^-[ioe]./.test(x)) { i++; continue; }                        // -oL
      if (/^--(input|output|error)=/.test(x)) { i++; continue; }
      if (x.startsWith("-")) return null;
      break;
    }
    return a.slice(i);
  },
  timeout: (a) => {
    let i = 0;
    while (i < a.length) {
      const x = a[i] ?? "";
      if (x === "--") { i++; break; }
      if (x === "-s" || x === "--signal" || x === "-k" || x === "--kill-after") { i += 2; continue; }
      if (/^--(signal|kill-after)=/.test(x) || /^-s./.test(x) || /^-k./.test(x)) { i++; continue; }
      if (x === "--preserve-status" || x === "--foreground" || x === "-v" || x === "--verbose") { i++; continue; }
      if (x.startsWith("-")) return null;
      break;
    }
    // The first operand is the DURATION; the command follows. A word that
    // is not provably a duration means the command position is unproven.
    const dur = a[i] ?? "";
    if (!/^\d+(\.\d+)?[smhd]?$/.test(dur)) return null;
    return a.slice(i + 1);
  },
  nice: (a) => {
    let i = 0;
    while (i < a.length) {
      const x = a[i] ?? "";
      if (x === "--") { i++; break; }
      if (x === "-n" || x === "--adjustment") { i += 2; continue; }
      if (/^-n-?\d+$/.test(x) || /^--adjustment=/.test(x) || /^-\d+$/.test(x)) { i++; continue; }
      if (x.startsWith("-")) return null;
      break;
    }
    return a.slice(i);
  },
};

// xargs is NOT a transparent single-command wrapper: it constructs and
// invokes commands from its INPUT stream (-I replacement, argument
// batching), so no static resolution of "the wrapped command" is sound.
// It is refused categorically in workflow shell.
const XARGS = "xargs";

// Resolve the EFFECTIVE executable: drop control-word prefixes (recording
// the fail-closed `if !` guard) and bare assignment prefixes, then unwrap
// allowlisted wrappers per their fixed syntax to a fixed point. A wrapper
// whose command position cannot be proven yields unresolved:true — the
// caller MUST treat that as a violation, never as "no command found".
function resolveEffective(tokens: string[]): { words: string[]; guarded: boolean; wrapped: boolean; unresolved: boolean } {
  let w = [...tokens];
  let guarded = false;
  let wrapped = false;
  // EXACT sole-negation grammar (round 16): guardedness is granted ONLY
  // to the exact token prefix `if ! <word>` where <word> is not itself a
  // control word or a second negation. `if ! ! gh …; then` inverts twice
  // — a SUCCESSFUL read takes the failure branch and a FAILED read
  // proceeds — and `if ! if gh …; then … fi; then` puts the inner
  // compound's status, not the read's, in control of the branch. Neither
  // is a guard. Every other control-word prefix is stripped WITHOUT ever
  // granting guardedness.
  if (w[0] === "if" && w[1] === "!" && w.length > 2 && !CONTROL_WORDS.has(w[2] ?? "")) {
    guarded = true;
    w = w.slice(2);
  } else {
    while (w.length > 0 && CONTROL_WORDS.has(w[0] ?? "")) w = w.slice(1);
  }
  for (;;) {
    const head = w[0] ?? "";
    if (ASSIGNMENT_WORD_RE.test(head)) {
      if (w.length > 1) wrapped = true;
      w = w.slice(1);
      continue;
    }
    const resolver = WRAPPERS[wordBasename(head)];
    if (resolver === undefined) break; // xargs and unknown heads stay put — judged by the caller
    wrapped = true;
    const rest = resolver(w.slice(1));
    if (rest === null) return { words: w, guarded, wrapped, unresolved: true };
    w = rest;
    if (w.length === 0) break;
  }
  return { words: w, guarded, wrapped, unresolved: false };
}

// Decompose one normalized logical line into every effective command at
// every substitution depth. Guardedness is computed WITH condition-list
// context (round 15): a segment's `if !` prefix counts only when the
// segment is the SOLE condition — it ends at `;`/newline (never `&&`,
// `||`, `|`, `&`, where another command consumes or replaces its status)
// and the immediately following segment is exactly `then`.
function decomposeCommands(t: string): EffectiveCommand[] {
  const out: EffectiveCommand[] = [];
  const walk = (text: string, inSubstitution: boolean) => {
    const { segments, bodies } = splitSimple(text);
    for (let s = 0; s < segments.length; s++) {
      const seg = segments[s] ?? { text: "", sep: "" };
      const tokens = tokenizeWords(seg.text);
      if (tokens.length === 0) continue;
      const { words, guarded: negatedIf, wrapped, unresolved } = resolveEffective(tokens);
      if (words.length === 0) continue;
      const soleCondition =
        negatedIf &&
        (seg.sep === ";" || seg.sep === "\n") &&
        (segments[s + 1]?.text ?? "") === "then";
      out.push({ words, guarded: soleCondition, wrapped, inSubstitution, unresolved });
    }
    for (const body of bodies) walk(body, true);
  };
  walk(t, false);
  return out;
}

// The CLOSED allowlist of permitted fixed reads (round 15): the exact
// seven endpoint/pagination/output tuples checked into the four
// workflows, as NORMALIZED argv (per-word quotes stripped) plus the
// workflows each tuple may appear in. Shape predicates ("under /issues",
// "safe-looking variable names") are gone: `repos/${REPO}/issues/999/
// events`, an arbitrary descendant, a changed query string, a missing
// --paginate, an alternate output file, or a valid endpoint paired with
// another tuple's output all mismatch and are refused. Adding an eighth
// read to a workflow REQUIRES adding its tuple here — the tripwire fires
// on anything else.
interface FixedReadTuple {
  /** Normalized argv: gh api [--paginate] <url> > <output>. */
  argv: readonly string[];
  /** EXACT repository-relative workflow paths this tuple is checked into. */
  workflows: readonly string[];
}
const WF_BOOTSTRAP = ".github/workflows/straylight-bootstrap.yml";
const WF_MERGE_GUARD = ".github/workflows/straylight-merge-guard.yml";
const WF_REDUCER = ".github/workflows/straylight-reducer.yml";
const WF_WATCHDOG = ".github/workflows/straylight-watchdog.yml";
// The CLOSED identity set (round 16): every check/collection call must
// name exactly one of these repository-relative paths. A missing
// identity, a basename, an absolute path, or a same-basename path in
// another directory is NOT an identity — identity failure permits
// nothing (fail closed) and is an error, never a broader match.
const KNOWN_WORKFLOWS: ReadonlySet<string> = new Set([WF_BOOTSTRAP, WF_MERGE_GUARD, WF_REDUCER, WF_WATCHDOG]);

// ---------------------------------------------------------------------------
// Round 20 — EXACT-BYTE WORKFLOW FINGERPRINTS. Nineteen rounds of scanner
// hardening demonstrated that a hand-rolled YAML/shell analyzer is an
// ENDLESSLY EXTENSIBLE authority surface: every round closed one spelling
// and Codex found the next (quoted keys, explicit keys, flow forms, null
// values …). The fail-closed contract is now exact bytes: each of the
// four checked-in workflows is pinned by the SHA-256 of its committed
// bytes, as LITERAL CONSTANTS (never derived from the file under test at
// runtime — a recomputed digest would authorize anything). Every exported
// enforcement surface verifies exact identity + exact fingerprint BEFORE
// any semantic result may be "permitted"/"ok"/clean. Any byte difference
// — a flipped quote, an appended comment, a changed line ending — fails
// closed everywhere. The shell/YAML analysis below remains as
// supplementary DIAGNOSTICS over the canonical bytes; it authorizes
// nothing on its own. Editing a workflow therefore REQUIRES updating its
// fingerprint here, which is exactly the reviewed, explicit step the
// contract exists to force.
// ---------------------------------------------------------------------------
const WORKFLOW_FINGERPRINTS: Readonly<Record<string, string>> = {
  [WF_BOOTSTRAP]: "c006d08b51ff220b96abcc6c4743192df2e409cb2906ff9f258c0585037e6faf",
  [WF_MERGE_GUARD]: "b53c59fd2849cfbf543c3ba8cea9cf78b5f08ccc738c0da5caeb65f26e8123e9",
  [WF_REDUCER]: "a488331cea787bf3329e5bf3789f3d4a3960798b8d8c502903df9a2c609d1f55",
  [WF_WATCHDOG]: "1e171b40863149d207bb102162fcdab8233e90e913d115e5dd5fcd90ed966c10",
};

// Enforcement surfaces take RAW BYTES (round 21): hashing a decoded
// string collapses distinct invalid byte streams onto one replacement-
// character string — update(src, "utf8") re-encodes and loses the
// distinction. The verifier hashes the ORIGINAL bytes directly, and
// diagnostic text is decoded (strict UTF-8, fatal on malformed input)
// ONLY after the fingerprint verifies — mutated bytes are never decoded
// by an enforcement surface.
export type WorkflowBytes = Buffer | Uint8Array;

const STRICT_UTF8 = new TextDecoder("utf-8", { fatal: true });

// The ONE shared verifier every enforcement surface calls. Returns null
// when the named identity is known AND the RAW BYTES hash to the pinned
// constant; otherwise the failure detail. No other predicate may grant
// authorization. A non-bytes value (a decoded string smuggled in by a
// JS caller) is itself a failure — never re-encoded and hashed.
export function verifyWorkflowFingerprint(bytes: WorkflowBytes, workflowFile: string): string | null {
  if (!(bytes instanceof Uint8Array)) {
    return "enforcement requires the workflow's raw bytes (a decoded string is not an authorization input)";
  }
  const pinned = KNOWN_WORKFLOWS.has(workflowFile) ? WORKFLOW_FINGERPRINTS[workflowFile] : undefined;
  if (pinned === undefined) {
    return `unknown workflow identity: ${String(workflowFile)}`;
  }
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== pinned) {
    return `workflow bytes do not match the pinned fingerprint for ${workflowFile} (expected ${pinned}, got ${actual})`;
  }
  return null;
}

// NON-AUTHORITATIVE test conversion: mutated fixture STRINGS become
// bytes here, before entering the enforcement API. This helper is test
// plumbing, not an authorization surface — the byte digest of whatever
// it produces still has to match the pin.
export function wfBytes(text: string): Buffer {
  return Buffer.from(text, "utf8");
}
const PERMITTED_FIXED_READS: readonly FixedReadTuple[] = [
  // bootstrap: two independent all-issues enumerations + label enumeration
  {
    argv: ["gh", "api", "--paginate", "repos/${REPO}/issues?state=all&per_page=100", ">", "/tmp/issue-pages-1.json"],
    workflows: [WF_BOOTSTRAP],
  },
  {
    argv: ["gh", "api", "--paginate", "repos/${REPO}/issues?state=all&per_page=100", ">", "/tmp/issue-pages-2.json"],
    workflows: [WF_BOOTSTRAP],
  },
  {
    argv: ["gh", "api", "--paginate", "repos/${REPO}/labels?per_page=100", ">", "/tmp/label-pages.json"],
    workflows: [WF_BOOTSTRAP],
  },
  // open-issues enumeration (merge-guard/reducer gathers + watchdog collections)
  {
    argv: ["gh", "api", "--paginate", "repos/${REPO}/issues?state=open&per_page=100", ">", "${DIR}/enumeration.pages"],
    workflows: [WF_MERGE_GUARD, WF_REDUCER, WF_WATCHDOG],
  },
  // per-issue gather reads (merge-guard/reducer)
  {
    argv: ["gh", "api", "repos/${REPO}/issues/${ISSUE_NUMBER}", ">", "${DIR}/issue.json"],
    workflows: [WF_MERGE_GUARD, WF_REDUCER],
  },
  {
    argv: ["gh", "api", "--paginate", "repos/${REPO}/issues/${ISSUE_NUMBER}/comments", ">", "${DIR}/comments.pages"],
    workflows: [WF_MERGE_GUARD, WF_REDUCER],
  },
  // label evidence (reducer stage B only)
  {
    argv: ["gh", "api", "--paginate", "repos/${REPO}/issues/${ISSUE_NUMBER}/labels", ">", "${DIR}/labels.pages"],
    workflows: [WF_REDUCER],
  },
];

// Exact-tuple membership: unwrapped, unsubstituted, resolved, the SOLE
// `if ! …; then` condition, argv byte-equal to a checked-in tuple, AND
// the tuple checked into the EXACT named workflow. An unknown or
// missing identity permits nothing.
function isPermittedFixedRead(cmd: EffectiveCommand, workflowFile: string): boolean {
  if (!KNOWN_WORKFLOWS.has(workflowFile)) return false;
  if (cmd.inSubstitution || cmd.wrapped || !cmd.guarded || cmd.unresolved) return false;
  return PERMITTED_FIXED_READS.some(
    (t) =>
      t.argv.length === cmd.words.length &&
      t.argv.every((x, i) => x === cmd.words[i]) &&
      t.workflows.includes(workflowFile),
  );
}

export interface GhInvocation {
  line: number;
  words: string[];
  guarded: boolean;
  wrapped: boolean;
  inSubstitution: boolean;
  /** The command position behind a wrapper could not be proven. */
  unresolved: boolean;
  permitted: boolean;
}

// Every effective gh invocation in a workflow source, with its verdict —
// the NORMALIZED surface the fixed-read test asserts over (never raw
// text). FAIL CLOSED (round 14): a command this decomposition cannot see
// through — an unresolved allowlisted wrapper, an xargs, or a non-gh
// head still carrying a gh word in its argv — is REPORTED as a
// non-permitted invocation, never silently dropped: "unresolved" must
// not read as "no gh invocation here".
// Fingerprint sentinel: when the bytes do not match the pinned
// workflow, the collector must NEVER return an empty (clean-looking)
// list nor mark anything permitted. When no real invocation exists to
// carry the failure, a single explicit non-permitted sentinel does.
const FINGERPRINT_SENTINEL_WORDS = ["<workflow-fingerprint-mismatch>"] as const;

// DIAGNOSTIC collector (round 20): the shell/effective-command analysis
// over arbitrary text — used by the fragment-level tests below and as
// supplementary diagnostics over the canonical bytes. It AUTHORIZES
// nothing: only the fingerprint-gated exported wrapper may mark an
// invocation permitted against the real checked-in workflow.
export function diagnoseEffectiveGhInvocations(src: string, workflowFile: string): GhInvocation[] {
  const out: GhInvocation[] = [];
  for (const { line, text } of logicalLines(src)) {
    // Decomposition runs on the RAW logical line: its tokenizer resolves
    // quotes per-word with real shell semantics (g'h' is the word gh; a
    // quoted url keeps its & and > INSIDE the word). The line-level
    // quote-join in normalizeLogical is only for the regex rules — it
    // glues ACROSS whitespace (`s" > "` → `s > `), which would corrupt
    // command splitting here.
    for (const cmd of decomposeCommands(text.trim())) {
      const head = wordBasename(cmd.words[0] ?? "");
      const carriesGh =
        head === "gh" ||
        cmd.words.some((x, i) => i > 0 && wordBasename(x) === "gh");
      if (head === "gh" || cmd.unresolved || head === XARGS || carriesGh) {
        out.push({ line, ...cmd, permitted: isPermittedFixedRead(cmd, workflowFile) });
      }
    }
  }
  return out;
}

// Strict decode for DIAGNOSTIC text over failed bytes: enforcement
// never decodes mutated bytes, but the collector still surfaces the
// non-permitted invocations a mutation introduced when the bytes are
// valid UTF-8. Malformed bytes yield no text at all (sentinel only).
function tryStrictDecode(bytes: WorkflowBytes): string | null {
  try {
    return STRICT_UTF8.decode(bytes);
  } catch {
    return null;
  }
}

// EXPORTED enforcement surface: exact identity + exact RAW-BYTE
// fingerprint gate the diagnostics. On mismatch nothing is permitted
// and the result is never empty (a mismatch must not read as "no
// invocations, clean"). Text is decoded (strict UTF-8) only for
// diagnostics — the authorization decision is made on bytes alone.
export function collectEffectiveGhInvocations(bytes: WorkflowBytes, workflowFile: string): GhInvocation[] {
  const fingerprintFailed = verifyWorkflowFingerprint(bytes, workflowFile) !== null;
  const text = bytes instanceof Uint8Array ? tryStrictDecode(bytes) : null;
  const out = text === null
    ? []
    : diagnoseEffectiveGhInvocations(text, workflowFile).map((inv) => ({
        ...inv,
        permitted: !fingerprintFailed && inv.permitted,
      }));
  if (fingerprintFailed && out.length === 0) {
    out.push({
      line: 0,
      words: [...FINGERPRINT_SENTINEL_WORDS],
      guarded: false,
      wrapped: false,
      inSubstitution: false,
      unresolved: true,
      permitted: false,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Round 16 — EXACT ORDERED OCCURRENCE CONTRACTS. Tuple membership alone is
// permutation- and multiplicity-blind: the reducer's Stage-B-only labels
// read injected into Stage A, a duplicated read, or a reordered read all
// stayed inside the tuple SET. Each workflow now carries the exact ordered
// occurrence sequence of its checked-in reads — stage identity + tuple
// argv + position, duplicates represented separately — and the checker
// compares the observed sequence against it in both directions.
// ---------------------------------------------------------------------------

// STRUCTURAL stage classification (round 17, structural parse round 18).
// Round 16 classified stages by a free-text marker; round 17 replaced it
// with step ids but recognized them by INDENTATION REGEX over raw lines
// and kept only the FIRST id per step — so renaming jobs.reduce or
// steps:, hiding apparent steps inside a block scalar, or appending a
// second id line all passed. The scanner below is a narrow DETERMINISTIC
// YAML structural walk scoped to the exact checked-in workflow shape —
// it is NOT a general YAML parser; it fails closed on anything outside
// that shape:
//   - a structural-line mask excludes comments, literal/folded block
//     scalar bodies (run: | …), and multi-line quoted scalar
//     continuations from key recognition;
//   - the walk requires top-level `jobs:`, the exact `reduce:` job, and
//     a `steps:` key whose entries are a real sequence of `- ` items;
//   - EVERY step-level id property is recorded; a step with duplicate
//     ids, a malformed id, or a duplicate `run` property is rejected;
//   - a gather anchor id appearing anywhere outside jobs.reduce.steps
//     is rejected (no ambiguity about which structure owns the anchor);
//   - reads classify ONLY when their line lies inside the actual `run`
//     block-scalar body of the gather_a / gather_b step; anything else
//     is "unanchored" and can never satisfy the occurrence contract.

interface StructuralLine {
  /** 0-based raw line index. */
  idx: number;
  indent: number;
  text: string;
}

// A mapping line opening a literal/folded block scalar: `key: |`,
// `key: >-`, `key: |2`, sequence-item forms included.
const BLOCK_SCALAR_OPEN_RE = /:\s*[|>][0-9+-]*\s*(#.*)?$/;

// Structural mask: walk raw lines, emitting only lines that carry YAML
// STRUCTURE — skipping blank lines, full-line comments, block-scalar
// bodies (any line more indented than the opening key while the scalar
// is open), and continuations of an unclosed quoted value.
function structuralLines(src: string): StructuralLine[] {
  const lines = src.split("\n");
  const out: StructuralLine[] = [];
  let scalarIndent = -1;
  let openQuote: '"' | "'" | null = null;
  const unbalanced = (s: string, q: '"' | "'"): boolean => {
    let n = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "\\") { i++; continue; }
      if (s[i] === q) n++;
    }
    return n % 2 === 1;
  };
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (openQuote !== null) {
      if (unbalanced(raw, openQuote)) openQuote = null;
      continue;
    }
    if (scalarIndent >= 0) {
      if (trimmed.length === 0) continue;
      const ind = raw.length - raw.trimStart().length;
      if (ind > scalarIndent) continue;
      scalarIndent = -1; // scalar closed; this line is structural again
    }
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;
    const indent = raw.length - raw.trimStart().length;
    if (BLOCK_SCALAR_OPEN_RE.test(raw)) scalarIndent = indent;
    else {
      const colon = raw.indexOf(":");
      const value = colon === -1 ? "" : raw.slice(colon + 1).trimStart();
      const q = value.startsWith('"') ? '"' : value.startsWith("'") ? "'" : null;
      if (q !== null && unbalanced(value, q)) openQuote = q;
    }
    out.push({ idx: i, indent, text: raw });
  }
  return out;
}

interface ReducerStep {
  /** EVERY step-level id property recorded, inline or standalone, in order. */
  ids: string[];
  /** 0-based raw index of the `- ` line opening this step. */
  startIdx: number;
  /** 0-based raw line span of the step's valid block-scalar run body. */
  runSpans: Array<{ start: number; end: number }>;
  /** Count of run properties seen (inline or standalone, any form). */
  runCount: number;
  /** Count of properties seen — an item with none is not a mapping. */
  propCount: number;
}

const STEP_ID_VALUE_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/;
const INLINE_PROP_RE = /^([A-Za-z_][A-Za-z0-9_-]*):(?:\s+(.*))?$/;

// Strip inline quoted spans and trailing comments from a structural
// line before token scans: a quoted VALUE mentioning `id: gather_b`
// (if: ${{ 'id: gather_b' != … }}) is data, not structure.
function stripInlineQuotesAndComment(text: string): string {
  let out = "";
  let q: '"' | "'" | null = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] ?? "";
    if (q !== null) {
      if (c === "\\" && q === '"') { i++; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'") { q = c as '"' | "'"; continue; }
    if (c === "#" && (i === 0 || /\s/.test(text[i - 1] ?? ""))) break;
    out += c;
  }
  return out;
}

// Parse jobs.reduce.steps from the structural-line stream. This is a
// STRICT parser for the checked-in YAML subset: block mappings, one
// step sequence, dash items whose payload is either empty or ONE plain
// `key: value` inline property, standalone indent-8 properties, and
// block-scalar run bodies. Every parseable construct outside that
// subset — scalar items, sequence-valued items, flow mappings/
// sequences, aliases/merges, duplicate structural keys, unparseable
// inline payloads — is REJECTED, never ignored. Every deviation
// returns a failure detail and the occurrence contract fails closed.
function parseReducerStructure(src: string):
  | { ok: true; steps: ReducerStep[] }
  | { ok: false; detail: string } {
  const rawLines = src.split("\n");
  const sl = structuralLines(src);

  // Unique structural mappings: exactly one top-level jobs, one reduce
  // under it, one steps under that. First-match navigation would let a
  // duplicate key shadow the real one.
  // Uniqueness counts the KEY in any value form (jobs: {} is still a
  // second jobs key); the navigable occurrence must then be the exact
  // bare block-mapping form the subset supports.
  const jobsKeys = sl.filter((l) => l.indent === 0 && /^jobs:(\s|$)/.test(l.text));
  if (jobsKeys.length !== 1) return { ok: false, detail: `expected exactly one top-level jobs key (found ${jobsKeys.length})` };
  const jobsLines = jobsKeys.filter((l) => /^jobs:\s*(#.*)?$/.test(l.text));
  if (jobsLines.length !== 1) return { ok: false, detail: "top-level jobs is not a bare block mapping" };
  const jobsAt = sl.findIndex((l) => l === jobsLines[0]);
  const jobsEnd = sl.findIndex((l, i) => i > jobsAt && l.indent === 0);
  const jobsSpan = sl.slice(jobsAt + 1, jobsEnd === -1 ? sl.length : jobsEnd);

  // No aliases, anchors, or merge keys anywhere under jobs — the subset
  // has no aliasing, so any spelling of it is unsupported structure.
  for (const l of jobsSpan) {
    const t = stripInlineQuotesAndComment(l.text);
    if (/(^|\s)<<:/.test(t) || /:\s*[&*][A-Za-z0-9_-]/.test(t)) {
      return { ok: false, detail: `unsupported YAML alias/anchor/merge under jobs: ${l.text.trim()}` };
    }
  }

  const reduceKeys = jobsSpan.filter((l) => l.indent === 2 && /^ {2}reduce:(\s|$)/.test(l.text));
  if (reduceKeys.length !== 1) return { ok: false, detail: `expected exactly one jobs.reduce key (found ${reduceKeys.length})` };
  const reduceLines = reduceKeys.filter((l) => /^ {2}reduce:\s*(#.*)?$/.test(l.text));
  if (reduceLines.length !== 1) return { ok: false, detail: "jobs.reduce is not a bare block mapping" };
  const reduceAt = jobsSpan.findIndex((l) => l === reduceLines[0]);
  const reduceEnd = jobsSpan.findIndex((l, i) => i > reduceAt && l.indent <= 2);
  const reduceSpan = jobsSpan.slice(reduceAt + 1, reduceEnd === -1 ? jobsSpan.length : reduceEnd);

  const stepsKeys = reduceSpan.filter((l) => l.indent === 4 && /^ {4}steps:(\s|$)/.test(l.text));
  if (stepsKeys.length !== 1) return { ok: false, detail: `expected exactly one jobs.reduce.steps key (found ${stepsKeys.length})` };
  const stepsLines = stepsKeys.filter((l) => /^ {4}steps:\s*(#.*)?$/.test(l.text));
  if (stepsLines.length !== 1) return { ok: false, detail: "jobs.reduce.steps is not a bare block sequence (inline/flow value)" };
  const stepsAt = reduceSpan.findIndex((l) => l === stepsLines[0]);
  const stepsEnd = reduceSpan.findIndex((l, i) => i > stepsAt && l.indent <= 4);
  const stepsSpan = reduceSpan.slice(stepsAt + 1, stepsEnd === -1 ? reduceSpan.length : stepsEnd);
  if (stepsSpan.length === 0) return { ok: false, detail: "jobs.reduce.steps is empty" };

  const steps: ReducerStep[] = [];
  // Record an id/run property (inline or standalone) onto a step; the
  // run span is derived only from a valid standalone block-scalar run.
  const recordProp = (
    step: ReducerStep,
    key: string,
    value: string,
    line: StructuralLine,
    standalone: boolean,
  ): string | null => {
    step.propCount++;
    if (/^[{[]/.test(value)) {
      return `unsupported flow value on step property ${key}: ${value}`;
    }
    if (key === "id") {
      if (!STEP_ID_VALUE_RE.test(value)) return `malformed step id: ${JSON.stringify(value)}`;
      step.ids.push(value);
      return null;
    }
    if (key === "run") {
      step.runCount++;
      if (!standalone || !BLOCK_SCALAR_OPEN_RE.test(line.text)) {
        return "unsupported run form: step run must be a standalone block-scalar property";
      }
      let end = line.idx;
      for (let j = line.idx + 1; j < rawLines.length; j++) {
        const body = rawLines[j] ?? "";
        const ind = body.length - body.trimStart().length;
        if (body.trim().length === 0 || ind > 8) { end = j; continue; }
        break;
      }
      step.runSpans.push({ start: line.idx + 1, end });
      return null;
    }
    return null;
  };

  for (const l of stepsSpan) {
    if (l.indent === 6) {
      // A sequence item. Parse — never discard — its payload.
      const item = l.text.slice(6);
      if (item !== "-" && !item.startsWith("- ")) {
        return { ok: false, detail: `jobs.reduce.steps is not a sequence (found non-item at indent 6: ${l.text.trim()})` };
      }
      const step: ReducerStep = { ids: [], startIdx: l.idx, runSpans: [], runCount: 0, propCount: 0 };
      steps.push(step);
      const payload = item === "-" ? "" : item.slice(2).trim();
      if (payload.length > 0) {
        if (/^[{[]/.test(payload)) {
          return { ok: false, detail: `unsupported flow step item: ${payload}` };
        }
        if (payload.startsWith("- ")) {
          return { ok: false, detail: `sequence-valued step item is not a mapping: ${payload}` };
        }
        const m = stripInlineQuotesAndComment(payload).trim().match(INLINE_PROP_RE);
        if (m === null) {
          return { ok: false, detail: `step item is not a mapping (scalar or unparseable payload): ${payload}` };
        }
        const err = recordProp(step, m[1] ?? "", (m[2] ?? "").trim(), l, false);
        if (err !== null) return { ok: false, detail: err };
      }
      continue;
    }
    const step = steps[steps.length - 1];
    if (step === undefined) {
      return { ok: false, detail: `jobs.reduce.steps content precedes the first sequence item: ${l.text.trim()}` };
    }
    if (l.indent === 8) {
      const m = l.text.trim().match(INLINE_PROP_RE);
      if (m !== null) {
        // Comments/quotes stripped only for id values (plain-word ids);
        // run detection needs the raw line for the block-scalar header.
        const value = stripInlineQuotesAndComment((m[2] ?? "")).trim();
        const err = recordProp(step, m[1] ?? "", m[1] === "run" ? (m[2] ?? "").trim() : value, l, true);
        if (err !== null) return { ok: false, detail: err };
      }
    } else if (l.indent === 7) {
      return { ok: false, detail: `ambiguous step content at indent 7: ${l.text.trim()}` };
    }
  }
  for (const step of steps) {
    if (step.propCount === 0) {
      return { ok: false, detail: "empty step item (not a mapping)" };
    }
    if (step.ids.length > 1) {
      return { ok: false, detail: `step has duplicate id properties: ${step.ids.join(", ")}` };
    }
    if (step.runCount > 1) {
      return { ok: false, detail: "step has duplicate run properties (ambiguous source span)" };
    }
  }
  return { ok: true, steps };
}

// Reducer stages are anchored to the unique structural step ids the
// checked-in YAML carries (gather_a / gather_b). Single-stage workflows
// have no anchors: every read classifies into the one named stage.
const STAGE_ANCHORS: ReadonlyArray<{ stage: string; stepId: string }> = [
  { stage: "stage-a", stepId: "gather_a" },
  { stage: "stage-b", stepId: "gather_b" },
];
const SINGLE_STAGE: Record<string, string> = {
  [WF_BOOTSTRAP]: "fetch-evidence",
  [WF_MERGE_GUARD]: "gather",
  [WF_WATCHDOG]: "collect",
};

// Resolve the two anchored steps: each anchor id must resolve to exactly
// one jobs.reduce step, in declared order, and must not appear as a
// structural step-level id ANYWHERE else in the file — standalone
// (`        id: X`) OR inline after a dash (`      - id: X`), in any
// job. Another job's step carrying gather_a, in either spelling, makes
// the anchor ambiguous. Comments and quoted/scalar text are already
// masked or stripped and carry no weight. Fails closed.
function resolveStageAnchors(src: string, steps: ReducerStep[]):
  | { ok: true; anchored: Array<{ stage: string; step: ReducerStep }> }
  | { ok: false; detail: string } {
  // Count every structural spelling that could bind the id to a step:
  // standalone `id: X`, inline `- id: X`, and flow-ish `{ id: X` /
  // `, id: X` (unsupported forms are rejected elsewhere, but an anchor
  // id inside one is ALSO ambiguity here — belt and suspenders).
  const anchorIdOccurrencesInFile = (id: string) => {
    const re = new RegExp(`(^|[-{,]\\s*|\\s)id:\\s*${id}(\\s|,|}|$)`);
    return structuralLines(src).filter((l) => re.test(stripInlineQuotesAndComment(l.text))).length;
  };
  const anchored: Array<{ stage: string; step: ReducerStep }> = [];
  let prevIndex = -1;
  for (const a of STAGE_ANCHORS) {
    const carriers = steps.map((s, i) => ({ s, i })).filter(({ s }) => s.ids[0] === a.stepId);
    if (carriers.length !== 1) {
      return { ok: false, detail: `stage anchor ${a.stepId} must resolve to exactly one jobs.reduce step (found ${carriers.length})` };
    }
    if (anchorIdOccurrencesInFile(a.stepId) !== 1) {
      return { ok: false, detail: `stage anchor id ${a.stepId} appears outside jobs.reduce.steps (ambiguous anchor)` };
    }
    const idx = carriers[0]?.i ?? -1;
    if (idx <= prevIndex) return { ok: false, detail: `stage anchor ${a.stepId} out of declared order` };
    prevIndex = idx;
    const step = carriers[0]?.s;
    if (step === undefined) return { ok: false, detail: `stage anchor ${a.stepId} unresolvable` };
    anchored.push({ stage: a.stage, step });
  }
  return { ok: true, anchored };
}

// A read's stage: ONLY a line inside the run block-scalar body of an
// anchored step earns that step's stage; everything else — another
// step's run, step metadata, outside the steps sequence — is
// "unanchored" and can never match a contract entry.
function stageOfLine(
  anchored: Array<{ stage: string; step: ReducerStep }>,
  line1: number,
): string {
  const idx = line1 - 1;
  for (const { stage, step } of anchored) {
    for (const span of step.runSpans) {
      if (idx >= span.start && idx <= span.end) return stage;
    }
  }
  return "unanchored";
}

// The exact ordered occurrence contract per workflow: "<stage> <argv>",
// in checked-in order, duplicates listed separately. The reducer's
// gather tuples INTENTIONALLY repeat across stages A and B; the labels
// read exists ONLY in Stage B.
const ENUM_OPEN = "gh api --paginate repos/${REPO}/issues?state=open&per_page=100 > ${DIR}/enumeration.pages";
const READ_ISSUE = "gh api repos/${REPO}/issues/${ISSUE_NUMBER} > ${DIR}/issue.json";
const READ_COMMENTS = "gh api --paginate repos/${REPO}/issues/${ISSUE_NUMBER}/comments > ${DIR}/comments.pages";
const READ_LABELS = "gh api --paginate repos/${REPO}/issues/${ISSUE_NUMBER}/labels > ${DIR}/labels.pages";
const WORKFLOW_READ_CONTRACTS: Record<string, readonly string[]> = {
  [WF_BOOTSTRAP]: [
    "fetch-evidence gh api --paginate repos/${REPO}/issues?state=all&per_page=100 > /tmp/issue-pages-1.json",
    "fetch-evidence gh api --paginate repos/${REPO}/issues?state=all&per_page=100 > /tmp/issue-pages-2.json",
    "fetch-evidence gh api --paginate repos/${REPO}/labels?per_page=100 > /tmp/label-pages.json",
  ],
  [WF_MERGE_GUARD]: [
    `gather ${ENUM_OPEN}`,
    `gather ${READ_ISSUE}`,
    `gather ${READ_COMMENTS}`,
  ],
  [WF_WATCHDOG]: [
    `collect ${ENUM_OPEN}`,
  ],
  [WF_REDUCER]: [
    `stage-a ${ENUM_OPEN}`,
    `stage-a ${READ_ISSUE}`,
    `stage-a ${READ_COMMENTS}`,
    `stage-b ${ENUM_OPEN}`,
    `stage-b ${READ_ISSUE}`,
    `stage-b ${READ_COMMENTS}`,
    `stage-b ${READ_LABELS}`,
  ],
};

export interface ReadContractResult {
  ok: boolean;
  /** The checked-in ordered occurrence contract. */
  expected: string[];
  /** The observed ordered occurrences ("<stage> <argv>"). */
  found: string[];
  detail: string;
}

// Compare the OBSERVED ordered occurrence sequence (every effective gh
// invocation the collector surfaces, stage-classified by STRUCTURAL
// step identity, in source order) against the workflow's contract.
// Ordered equality asserts both directions at once: an extra permitted
// tuple, a duplicate, a move across stages, a missing read, or a
// reorder all mismatch — even when the tuple SET is unchanged. For the
// reducer, an unsound structure — missing jobs.reduce, missing or
// non-sequence steps, duplicate/malformed step ids, duplicate run
// properties, missing/duplicate/reordered anchors — fails the contract
// BEFORE any classification runs.
// DIAGNOSTIC occurrence contract (round 20): the structural analysis
// over arbitrary text — supplementary diagnostics only; it authorizes
// nothing. The exported checkWorkflowReadContract gates on the byte
// fingerprint before this runs.
export function diagnoseWorkflowReadContract(src: string, workflowFile: string): ReadContractResult {
  const expected = [...(WORKFLOW_READ_CONTRACTS[workflowFile] ?? [])];
  if (!KNOWN_WORKFLOWS.has(workflowFile)) {
    return { ok: false, expected, found: [], detail: `unknown workflow identity: ${String(workflowFile)}` };
  }
  let classify: (line1: number) => string;
  if (workflowFile === WF_REDUCER) {
    const structure = parseReducerStructure(src);
    if (!structure.ok) return { ok: false, expected, found: [], detail: structure.detail };
    const anchors = resolveStageAnchors(src, structure.steps);
    if (!anchors.ok) return { ok: false, expected, found: [], detail: anchors.detail };
    classify = (line1) => stageOfLine(anchors.anchored, line1);
  } else {
    const stage = SINGLE_STAGE[workflowFile] ?? "workflow";
    classify = () => stage;
  }
  const found = diagnoseEffectiveGhInvocations(src, workflowFile).map(
    (inv) => `${classify(inv.line)} ${inv.words.join(" ")}`,
  );
  const ok = found.length === expected.length && found.every((x, i) => x === expected[i]);
  return {
    ok,
    expected,
    found,
    detail: ok
      ? "ordered occurrence contract satisfied"
      : `ordered occurrence mismatch — expected [${expected.join(" | ")}] found [${found.join(" | ")}]`,
  };
}

// EXPORTED enforcement surface: exact RAW BYTES first (rounds 20-21) —
// a mutated workflow can never be ok, whatever the diagnostics
// conclude, and text exists only AFTER the fingerprint verifies.
export function checkWorkflowReadContract(bytes: WorkflowBytes, workflowFile: string): ReadContractResult {
  const expected = [...(WORKFLOW_READ_CONTRACTS[workflowFile] ?? [])];
  const fp = verifyWorkflowFingerprint(bytes, workflowFile);
  if (fp !== null) return { ok: false, expected, found: [], detail: fp };
  return diagnoseWorkflowReadContract(STRICT_UTF8.decode(bytes), workflowFile);
}

// The boundary checker: examine every LOGICAL shell line (comments and
// blank lines dropped; continuations joined; escaped command words
// normalized). The caller MUST name the exact repository-relative
// workflow path from the closed identity set (round 16): a missing,
// basename-only, absolute, or same-basename-elsewhere identity is a
// violation in itself and permits no fixed read. (The whole-workflow
// ordered occurrence contract is checkWorkflowReadContract; the two
// compose in checkWorkflowComplete — a per-line checker cannot demand a
// fragment carry a full workflow's reads.)
// DIAGNOSTIC per-line rule engine (round 20): the shell-construct
// classes over arbitrary text. Used by the fragment-level tests and as
// supplementary diagnostics; it AUTHORIZES nothing — the exported
// checkWorkflowBoundary gates on the byte fingerprint first.
export function diagnoseWorkflowBoundary(src: string, workflowFile: string): Violation[] {
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
      const head = wordBasename(cmd.words[0] ?? "");
      // A wrapper whose command position could not be proven is a
      // violation in itself — "unresolved" must NEVER read as "no gh
      // invocation here" (round 14, fail closed).
      if (cmd.unresolved) flag("wrapper-unresolved");
      // xargs constructs and invokes commands from its input stream — no
      // static resolution is sound; refused categorically.
      if (head === XARGS) flag("xargs");
      if (head === "gh" && !isPermittedFixedRead(cmd, workflowFile)) flag("gh-api-derived");
      // Belt for wrappers OUTSIDE the closed allowlist (doas gh api …)
      // and for gh handed to a resolved-but-untrusted head (xargs gh …):
      // a bare gh word ANYWHERE in the argv of a non-gh command is the
      // same derived invocation, spelled through an unmodeled indirection.
      if (head !== "gh" && cmd.words.some((x, i) => i > 0 && wordBasename(x) === "gh")) flag("gh-api-derived");
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

// EXPORTED enforcement surface: identity + exact byte fingerprint gate
// the per-line diagnostics (round 20). A mutated workflow ALWAYS carries
// at least the workflow-fingerprint violation, whatever the diagnostics
// conclude; the diagnostics still run to name the specific construct.
export function checkWorkflowBoundary(bytes: WorkflowBytes, workflowFile: string): Violation[] {
  const violations: Violation[] = [];
  if (!KNOWN_WORKFLOWS.has(workflowFile)) {
    violations.push({ rule: "workflow-identity", line: 0, text: `unknown workflow identity: ${String(workflowFile)}` });
  } else {
    const fp = verifyWorkflowFingerprint(bytes, workflowFile);
    if (fp !== null) violations.push({ rule: "workflow-fingerprint", line: 0, text: fp });
  }
  // Diagnostics name the construct when the bytes are decodable text;
  // malformed bytes stay undecoded (the fingerprint violation stands).
  const text = bytes instanceof Uint8Array ? tryStrictDecode(bytes) : null;
  if (text !== null) violations.push(...diagnoseWorkflowBoundary(text, workflowFile));
  return violations;
}

// The COMPLETE workflow check (round 16): per-line boundary rules PLUS
// the whole-workflow ordered occurrence contract — both behind the
// round-20 fingerprint gate (checkWorkflowBoundary and
// checkWorkflowReadContract each verify it via the ONE shared verifier).
export function checkWorkflowComplete(bytes: WorkflowBytes, workflowFile: string): Violation[] {
  const violations = checkWorkflowBoundary(bytes, workflowFile);
  if (KNOWN_WORKFLOWS.has(workflowFile)) {
    const contract = checkWorkflowReadContract(bytes, workflowFile);
    if (!contract.ok) violations.push({ rule: "read-contract", line: 0, text: contract.detail });
  }
  return violations;
}

// =============================================================================
// Direction 1 — the four real workflows are CLEAN under the checker
// =============================================================================
describe("boundary checker — the four converted workflows carry zero violations", () => {
  for (const f of WORKFLOWS) {
    it(`${f} is clean (boundary rules + ordered occurrence contract)`, () => {
      const violations = checkWorkflowComplete(readFileSync(f), f);
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
    ["gh-api-derived", `timeout 30 gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "timeout-wrapped derived read (round-14 bypass)"],
    ["gh-api-derived", `timeout --signal=TERM 30 gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "timeout with --signal= option (round-14 bypass)"],
    ["gh-api-derived", `nice gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "nice-wrapped derived read (round-14 bypass)"],
    ["gh-api-derived", `nice -n 5 gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "nice -n 5 derived read (round-14 bypass)"],
    ["gh-api-derived", `/usr/bin/env gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "path-spelled /usr/bin/env wrapper (round-14 bypass)"],
    ["gh-api-derived", `env -- gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "env -- end-of-options wrapper (round-14 bypass)"],
    ["gh-api-derived", `stdbuf -o L gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "stdbuf -o L wrapped derived read (round-14 bypass)"],
    ["gh-api-derived", `timeout 30 g'h' api "repos/x/y/pulls/1" > /tmp/pr.json`, "timeout + quoted-word g'h' (round-14 concatenated variant)"],
    ["gh-api-derived", `doas gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "UNKNOWN wrapper before gh — bare gh argv word refused"],
    ["xargs", `echo "repos/x/y/pulls/1" | xargs gh api`, "xargs constructing a gh invocation (round-14: categorical)"],
    ["xargs", `printf '%s\\n' 1 2 | xargs -I{} echo {}`, "any xargs in workflow shell (dynamic command construction)"],
    ["wrapper-unresolved", `env --split-string='gh api repos/x/y/pulls/1' > /tmp/pr.json`, "env --split-string hides the command in a string (unproven position)"],
    ["wrapper-unresolved", `env -S 'gh api' "repos/x/y/pulls/1"`, "env -S short split-string spelling (unproven position)"],
    ["wrapper-unresolved", `timeout \$DUR gh api "repos/x/y/pulls/1" > /tmp/pr.json`, "timeout with a non-literal duration (unproven command position)"],
    ["wrapper-unresolved", `stdbuf --weird gh api "repos/x/y/pulls/1"`, "unknown stdbuf option (unproven command position)"],
    ["command-indirection", `\${GH} api "repos/x/y/pulls/1" > pr.json`, "brace-expansion command name fetch (round-13)"],
    ["read-contract", `if ! gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then\n  exit 97\nfi`, "an EXTRA occurrence of a permitted-shape read violates the ordered occurrence contract (round-16)"],
    ["gh-api-derived", `if ! gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; false; then\n  exit 97\nfi`, "compound condition — `; false` replaces the read's exit status before then (round-15 bypass)"],
    ["gh-api-derived", `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json" && true; then\n  exit 97\nfi`, "compound condition — `&& true` masks the status (round-15)"],
    ["gh-api-derived", `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json" || true; then\n  exit 97\nfi`, "compound condition — `|| true` masks the status (round-15)"],
    ["gh-api-derived", `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" | cat > "\${DIR}/issue.json"; then\n  exit 97\nfi`, "pipeline in the condition — cat's status stands in for the read's (round-15)"],
    ["gh-api-derived", `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json"; echo pre-then; then\n  exit 97\nfi`, "another command before then (round-15)"],
    ["gh-api-derived", `if ! gh api "repos/\${REPO}/issues/999/events" > /tmp/arbitrary.json; then\n  exit 97\nfi`, "arbitrary ISSUE subroute — issues/999/events is not a checked-in tuple (round-15 bypass)"],
    ["gh-api-derived", `if ! gh api --paginate "repos/\${REPO}/labels/bug/something" > "\${DIR}/labels.pages"; then\n  exit 97\nfi`, "arbitrary LABELS subroute (round-15)"],
    ["gh-api-derived", `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > /tmp/arbitrary.json; then\n  exit 97\nfi`, "valid endpoint, arbitrary output filename (round-15)"],
    ["gh-api-derived", `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/enumeration.pages"; then\n  exit 97\nfi`, "valid endpoint paired with ANOTHER tuple's output path (round-15)"],
    ["gh-api-derived", `if ! gh api "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then\n  exit 97\nfi`, "missing required --paginate flag (round-15)"],
    ["gh-api-derived", `if ! gh api --paginate "repos/\${REPO}/issues?state=closed&per_page=100" > "\${DIR}/enumeration.pages"; then\n  exit 97\nfi`, "changed query string — state=closed is not a checked-in tuple (round-15)"],
    ["gh-api-derived", `if ! gh api --paginate --include "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then\n  exit 97\nfi`, "extra flag beyond the tuple's argv (round-15)"],
    ["gh-api-derived", `if ! ! gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then\n  exit 97\nfi`, "DOUBLE negation — if ! ! inverts twice, success takes the failure branch (round-16 bypass)"],
    ["gh-api-derived", `if ! if gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then true; fi; then\n  exit 97\nfi`, "NESTED conditional — the inner compound's status, not the read's, controls the branch (round-16 bypass)"],
    ["eval", `eval "$CMD"`, "eval of dynamic content"],
    ["eval", `source /tmp/dynamic.sh`, "dynamic source"],
    ["ledger-append", `echo '{"resource":"pr"}' >> "\${DIR}/ledger.jsonl"`, "bash appending a ledger row"],
    ["redirect-derived", `gh api "repos/x/y/pulls/\${PRNUM}" > "\${OUTDIR}/pr-\${PRNUM}.json"`, "redirect into a derived path"],
  ];

  for (const workflow of WORKFLOWS) {
    for (const [rule, payload, description] of MUTATIONS) {
      it(`${workflow.split("/").pop()}: ${description} → flagged as ${rule}`, () => {
        const mutated = mutate(workflow, payload);
        const violations = checkWorkflowComplete(wfBytes(mutated), workflow);
        expect(violations.map((v) => v.rule)).toContain(rule);
      });
    }
  }

  it("a COMMENT containing a prohibited construct is NOT flagged by the DIAGNOSTICS (comments may explain the ban) — but any byte change still fails the exported fingerprint", () => {
    for (const workflow of WORKFLOWS) {
      const mutated = mutate(workflow, `# example of the banned pattern: gh api -X POST | jq -r '.x' || true`);
      expect(diagnoseWorkflowBoundary(mutated, workflow)).toEqual([]);
      expect(diagnoseWorkflowReadContract(mutated, workflow).ok).toBe(true);
      // Round 20: the exported surfaces refuse EVERY byte change — an
      // appended comment included — with the fingerprint violation.
      expect(checkWorkflowComplete(wfBytes(mutated), workflow).map((v) => v.rule)).toContain("workflow-fingerprint");
    }
  });

  it("the matrix is exhaustive over the checker's rule set (a rule with no mutation row is untested)", () => {
    // workflow-identity is exercised by its dedicated round-16 test (the
    // matrix always passes a valid identity, so no mutation row can
    // trigger it).
    const rulesInChecker = [
      "inline-node", "authority-jq", "or-true", "evidence-loop", "gh-write",
      "gh-pipe", "command-substitution", "process-substitution",
      "command-indirection", "gh-api-derived", "wrapper-unresolved",
      "xargs", "read-contract", "eval", "ledger-append", "redirect-derived",
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
      const invocations = collectEffectiveGhInvocations(readFileSync(f), f);
      // The real workflows DO fetch — an empty list would mean the
      // decomposition went blind, which must fail this test too.
      expect(invocations.length, `${f}: no effective gh invocations found`).toBeGreaterThan(0);
      for (const inv of invocations) {
        expect(inv.permitted, `${f}:${inv.line}: ${inv.words.join(" ")}`).toBe(true);
        // Redundant belt: permitted implies unwrapped, unsubstituted,
        // sole-condition guarded, api-subcommand, no derived pulls/commits.
        expect(inv.wrapped).toBe(false);
        expect(inv.inSubstitution).toBe(false);
        expect(inv.guarded).toBe(true);
        expect(inv.words[1]).toBe("api");
        expect(inv.words.join(" ")).not.toMatch(/\/(pulls|commits)\//);
      }
    }
  });

  it("EXACT ORDERED OCCURRENCE CONTRACTS: each workflow's observed read sequence equals its checked-in contract, occurrence by occurrence (round 16)", () => {
    // NOT a set comparison (round-16 defect: dedup hid an injected
    // duplicate of a permitted tuple). Every workflow's observed
    // stage-classified occurrence SEQUENCE must equal its contract in
    // order and multiplicity: the reducer carries all SEVEN occurrences
    // (its three gather tuples once per stage + labels), and the labels
    // read occurs ONLY in stage-b.
    for (const f of WORKFLOWS) {
      const r = checkWorkflowReadContract(readFileSync(f), f);
      expect(r.ok, `${f}: ${r.detail}`).toBe(true);
      expect(r.found).toEqual(r.expected);
    }
    const reducer = checkWorkflowReadContract(readFileSync(WF_REDUCER), WF_REDUCER);
    expect(reducer.found).toHaveLength(7);
    const labelsOccurrences = reducer.found.filter((x) => x.includes("/labels "));
    expect(labelsOccurrences).toEqual([`stage-b ${READ_LABELS}`]);
  });

  it("the ordered contract rejects duplicates, cross-stage moves, missing reads, and reorders of PERMITTED tuples (round 16)", () => {
    const src = readFileSync(WF_REDUCER, "utf8");
    // Codex's exact repro: the Stage-B-only labels read injected into
    // Stage A — the tuple SET is unchanged; the occurrence contract fails.
    const stageAAnchor = `if ! gh api --paginate "repos/\${REPO}/issues/\${ISSUE_NUMBER}/comments" > "\${DIR}/comments.pages"; then`;
    const firstComments = src.indexOf(stageAAnchor);
    expect(firstComments).toBeGreaterThan(-1);
    const lineStart = src.lastIndexOf("\n", firstComments) + 1;
    const indent = src.slice(lineStart, firstComments);
    const labelsRead = `if ! gh api --paginate "repos/\${REPO}/issues/\${ISSUE_NUMBER}/labels" > "\${DIR}/labels.pages"; then\n${indent}  exit 97\n${indent}fi\n`;
    const injected = src.slice(0, lineStart) + indent + labelsRead + src.slice(lineStart);
    const moved = diagnoseWorkflowReadContract(injected, WF_REDUCER);
    expect(moved.ok, "Stage-B labels read injected into Stage A must fail the contract").toBe(false);
    expect(checkWorkflowComplete(wfBytes(injected), WF_REDUCER).map((v) => v.rule)).toContain("read-contract");

    // A DUPLICATE of a permitted tuple (same stage) fails on multiplicity.
    const dupSrc = src.slice(0, lineStart) + indent + stageAAnchor + `\n${indent}  exit 97\n${indent}fi\n` + src.slice(lineStart);
    expect(diagnoseWorkflowReadContract(dupSrc, WF_REDUCER).ok, "duplicate permitted read must fail").toBe(false);

    // A MISSING read fails: drop the watchdog's only read.
    const wdSrc = readFileSync(WF_WATCHDOG, "utf8");
    const wdLines = wdSrc.split("\n").filter((l) => !l.includes("if ! gh api"));
    expect(diagnoseWorkflowReadContract(wdLines.join("\n"), WF_WATCHDOG).ok, "missing read must fail").toBe(false);

    // A REORDER fails: swap merge-guard's issue.json and comments reads
    // (same set, same stage, different order).
    const mgSrc = readFileSync(WF_MERGE_GUARD, "utf8");
    const issueLine = `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json"; then`;
    const commentsLine = `if ! gh api --paginate "repos/\${REPO}/issues/\${ISSUE_NUMBER}/comments" > "\${DIR}/comments.pages"; then`;
    const SWAP = " SWAP ";
    const swapped = mgSrc.replace(issueLine, SWAP).replace(commentsLine, issueLine).replace(SWAP, commentsLine);
    expect(swapped).not.toBe(mgSrc);
    expect(diagnoseWorkflowReadContract(swapped, WF_MERGE_GUARD).ok, "reordered reads must fail").toBe(false);
  });

  it("stage authority is STRUCTURAL: Codex's marker-spoofed cross-stage move fails even though the free-text marker precedes the moved read (round 17)", () => {
    // The exact round-17 repro: move the Stage B enumeration into Stage
    // A and insert the OLD free-text marker before it. Under round-16's
    // first-occurrence-of-marker classification this relabeled the rest
    // of Stage A as Stage B and the contract passed; structural step-id
    // classification gives the comment no authority.
    const ENUM_LINE = `            if ! gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then`;
    const lines = readFileSync(WF_REDUCER, "utf8").split("\n");
    const hits = lines.flatMap((line, i) => (line === ENUM_LINE ? [i] : []));
    expect(hits).toHaveLength(2);
    const moved = lines.splice(hits[1] ?? 0, 4);
    const close = lines.findIndex((line, i) => i > (hits[0] ?? 0) && line === "          }");
    expect(close).toBeGreaterThan(-1);
    lines.splice(close, 0, "            # Stage B — gather fresh evidence twice", ...moved);
    const spoofed = lines.join("\n");
    expect(diagnoseWorkflowReadContract(spoofed, WF_REDUCER).ok).toBe(false);
    expect(checkWorkflowReadContract(wfBytes(spoofed), WF_REDUCER).ok).toBe(false);
    expect(checkWorkflowComplete(wfBytes(spoofed), WF_REDUCER)).not.toEqual([]);
  });

  it("stage anchors are validated structurally: duplicate/missing/reordered gather_a|gather_b and spoofed anchor text all fail closed (round 17)", () => {
    const src = readFileSync(WF_REDUCER, "utf8");
    const failsBoth = (mutated: string, why: string) => {
      expect(diagnoseWorkflowReadContract(mutated, WF_REDUCER).ok, why).toBe(false);
      expect(checkWorkflowReadContract(wfBytes(mutated), WF_REDUCER).ok, why).toBe(false);
      expect(checkWorkflowComplete(wfBytes(mutated), WF_REDUCER).map((v) => v.rule), why).toContain("read-contract");
    };

    // Duplicate anchors: a second id line for either anchor — even
    // smuggled into an EXISTING step at property indent — fails.
    failsBoth(src.replace("        id: probe_a", "        id: gather_a"), "duplicate gather_a");
    failsBoth(src.replace("        id: plan_b", "        id: gather_b"), "duplicate gather_b");

    // Missing anchors.
    failsBoth(src.replace("        id: gather_a\n", ""), "missing gather_a");
    failsBoth(src.replace("        id: gather_b\n", ""), "missing gather_b");

    // Reordered anchors: swap the two id lines (gather_b then gather_a).
    const SWAP = "        id: __SWAP__";
    const reordered = src
      .replace("        id: gather_a", SWAP)
      .replace("        id: gather_b", "        id: gather_a")
      .replace(SWAP, "        id: gather_b");
    failsBoth(reordered, "gather_b before gather_a");

    // A COMMENT or STEP NAME containing the anchor text carries no
    // authority — and cannot break the real anchors either: the clean
    // contract still holds with them present.
    const withFakes = src.replace(
      "      - name: Stage B — gather fresh evidence twice (raw bytes to files)",
      "      # id: gather_b (documentation only)\n      - name: gather_b — Stage B — gather fresh evidence twice (raw bytes to files)",
    );
    expect(diagnoseWorkflowReadContract(withFakes, WF_REDUCER).ok, "fake comment/step-name must not affect classification").toBe(true);
    // Round 20: the exported surface still refuses the byte change.
    expect(checkWorkflowReadContract(wfBytes(withFakes), WF_REDUCER).ok).toBe(false);

    // The labels read (Stage-B-only) placed in gather_a fails (structural
    // restatement of the round-16 injection, no marker involved).
    const anchor = `            if ! gh api --paginate "repos/\${REPO}/issues/\${ISSUE_NUMBER}/comments" > "\${DIR}/comments.pages"; then`;
    const first = src.indexOf(anchor);
    const ls = src.lastIndexOf("\n", first) + 1;
    const indent = src.slice(ls, src.indexOf("if !", ls));
    const labelsRead = `${indent}if ! gh api --paginate "repos/\${REPO}/issues/\${ISSUE_NUMBER}/labels" > "\${DIR}/labels.pages"; then\n${indent}  exit 97\n${indent}fi\n`;
    failsBoth(src.slice(0, ls) + labelsRead + src.slice(ls), "labels read in gather_a");

    // A read OUTSIDE both structural gather steps (the killswitch step)
    // classifies as unanchored and fails the contract.
    const killswitchAnchor = "          set -euo pipefail\n          set +e";
    const outside = src.replace(
      killswitchAnchor,
      `          set -euo pipefail\n          if ! gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then\n            exit 97\n          fi\n          set +e`,
    );
    expect(outside).not.toBe(src);
    failsBoth(outside, "read outside both structural gather steps");

    // An extra EIGHTH permitted-shape occurrence inside gather_b fails.
    const bAnchor = src.lastIndexOf(anchor);
    const bls = src.lastIndexOf("\n", bAnchor) + 1;
    const bIndent = src.slice(bls, src.indexOf("if !", bls));
    const extra = `${bIndent}if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json"; then\n${bIndent}  exit 97\n${bIndent}fi\n`;
    failsBoth(src.slice(0, bls) + extra + src.slice(bls), "extra eighth permitted occurrence");

    // Positive control: the clean reducer passes.
    expect(checkWorkflowReadContract(readFileSync(WF_REDUCER), WF_REDUCER).ok).toBe(true);
  });

  it("structure is PARSED, not indentation-matched: Codex's four round-18 probes each fail the contract closed", () => {
    const src = readFileSync(WF_REDUCER, "utf8");
    const failsBoth = (mutated: string, why: string) => {
      expect(mutated, `${why}: mutation did not apply`).not.toBe(src);
      expect(diagnoseWorkflowReadContract(mutated, WF_REDUCER).ok, why).toBe(false);
      expect(checkWorkflowReadContract(wfBytes(mutated), WF_REDUCER).ok, why).toBe(false);
      expect(checkWorkflowComplete(wfBytes(mutated), WF_REDUCER).map((v) => v.rule), why).toContain("read-contract");
    };
    // 1. jobs.reduce renamed — the expected job no longer exists.
    failsBoth(src.replace("  reduce:\n", "  not_reduce:\n"), "wrongJob");
    // 2. steps renamed — jobs.reduce has no steps sequence.
    failsBoth(src.replace("    steps:\n", "    not_steps:\n"), "notSteps");
    // 3. a SECOND step-level id after gather_a — duplicate id property
    //    on one step is rejected, never silently ignored.
    failsBoth(
      src.replace("        id: gather_a\n", "        id: gather_a\n        id: unrelated_step_id\n"),
      "duplicateId",
    );
    // 4. the entire apparent steps tree hidden inside a block scalar —
    //    scalar text is not structure, so jobs.reduce.steps is absent.
    failsBoth(src.replace("    steps:\n", "fake_steps: |2\n    steps:\n"), "scalar");
  });

  it("scalar text, comments, and quoted values carry no structural authority; structural anomalies fail closed (round 18)", () => {
    const src = readFileSync(WF_REDUCER, "utf8");
    const failsBoth = (mutated: string, why: string) => {
      expect(mutated, `${why}: mutation did not apply`).not.toBe(src);
      expect(diagnoseWorkflowReadContract(mutated, WF_REDUCER).ok, why).toBe(false);
      expect(checkWorkflowReadContract(wfBytes(mutated), WF_REDUCER).ok, why).toBe(false);
      expect(checkWorkflowComplete(wfBytes(mutated), WF_REDUCER).map((v) => v.rule), why).toContain("read-contract");
    };
    const staysClean = (mutated: string, why: string) => {
      expect(mutated, `${why}: mutation did not apply`).not.toBe(src);
      // Diagnostics: the spoof carries no structural authority.
      expect(diagnoseWorkflowReadContract(mutated, WF_REDUCER).ok, why).toBe(true);
      // Exported enforcement: ANY byte change still fails the fingerprint.
      expect(checkWorkflowReadContract(wfBytes(mutated), WF_REDUCER).ok, why).toBe(false);
    };

    // No-authority controls: fake ids in a comment, in a quoted value,
    // and fake step/YAML text inside a run block scalar neither anchor
    // nor break the clean contract.
    staysClean(
      src.replace("        id: gather_a", "        # id: gather_b\n        id: gather_a"),
      "fake id in a comment",
    );
    staysClean(
      src.replace(
        "        id: gather_a",
        `        id: gather_a\n        if: \${{ 'id: gather_b' != inputs.never }}`,
      ),
      "fake id inside a quoted value",
    );
    staysClean(
      src.replace(
        "          set -euo pipefail\n          gather_once()",
        "          set -euo pipefail\n          # steps:\n          #   - name: fake\n          #     id: gather_b\n          gather_once()",
      ),
      "fake step/YAML text inside run: |",
    );

    // Duplicate ids at a DIFFERENT indentation level: a nested id line
    // inside the run scalar is text (clean), but a second structural id
    // at step-property indent on another step duplicates the anchor.
    staysClean(
      src.replace("          set -euo pipefail\n          gather_once()", "          set -euo pipefail\n          echo 'id: gather_a'\n          gather_once()"),
      "id text inside the run scalar is not a duplicate",
    );
    failsBoth(src.replace("        id: probe_a", "        id: gather_a"), "structural duplicate on another step");

    // A gather anchor id in ANOTHER JOB is ambiguous — rejected even
    // though jobs.reduce itself still carries a unique gather_a.
    const otherJob = src.replace(
      /$/,
      "\n  shadow:\n    runs-on: ubuntu-latest\n    steps:\n      - name: shadow\n        id: gather_a\n        run: |\n          true\n",
    );
    failsBoth(otherJob, "gather id in another job");

    // Non-sequence steps: a mapping where the sequence should be.
    failsBoth(
      src.replace("    steps:\n      - name: Checkout code", "    steps:\n      note: not-a-sequence\n      - name: Checkout code"),
      "non-sequence steps content",
    );

    // Positive control: the checked-in reducer parses and passes.
    expect(checkWorkflowReadContract(readFileSync(WF_REDUCER), WF_REDUCER).ok).toBe(true);
  });

  it("sequence-item payloads are PARSED, never discarded: scalar items, inline duplicate ids, shadow-job inline anchors, and duplicate structural keys all fail closed (round 19)", () => {
    const src = readFileSync(WF_REDUCER, "utf8");
    const failsBoth = (mutated: string, why: string) => {
      expect(mutated, `${why}: mutation did not apply`).not.toBe(src);
      expect(diagnoseWorkflowReadContract(mutated, WF_REDUCER).ok, why).toBe(false);
      expect(checkWorkflowReadContract(wfBytes(mutated), WF_REDUCER).ok, why).toBe(false);
      expect(checkWorkflowComplete(wfBytes(mutated), WF_REDUCER).map((v) => v.rule), why).toContain("read-contract");
    };

    // Codex repro 1: a scalar sequence item — not a mapping, rejected,
    // never silently skipped.
    failsBoth(src.replace("    steps:\n", "    steps:\n      - harmless-scalar\n"), "scalar step item");

    // Codex repro 2: a REAL shadow job whose step carries the anchor id
    // INLINE after the dash — ambiguity even though jobs.reduce is intact.
    failsBoth(
      src.trimEnd() +
        "\n  shadow:\n    runs-on: ubuntu-latest\n    steps:\n      - id: gather_a\n        run: |\n          echo shadow\n",
      "inline - id: gather_a in a shadow job",
    );

    // Inline duplicate id: `- id: x` followed by a standalone id.
    failsBoth(
      src.replace(
        "      - name: Stage A — gather evidence twice (raw bytes to files)\n        id: gather_a",
        "      - id: gather_a\n        id: gather_a2\n        name: Stage A — gather evidence twice (raw bytes to files)",
      ),
      "inline duplicate id",
    );

    // Inline malformed id.
    failsBoth(
      src.replace("    steps:\n", "    steps:\n      - id: not a valid id!\n        run: |\n          true\n"),
      "inline malformed id",
    );

    // Inline run (unsupported form) and duplicate run.
    failsBoth(
      src.replace("    steps:\n", "    steps:\n      - run: echo inline\n"),
      "inline run form",
    );
    failsBoth(
      src.replace(
        "        run: |\n          set -euo pipefail\n          gather_once()",
        "        run: |\n          true\n        run: |\n          set -euo pipefail\n          gather_once()",
      ),
      "duplicate run property",
    );

    // Duplicate structural mappings: jobs, reduce, steps.
    failsBoth(src.replace("jobs:\n", "jobs:\n  reduce2: {}\njobs:\n"), "duplicate top-level jobs");
    failsBoth(src.replace("  reduce:\n", "  reduce:\n    if: false\n  reduce:\n"), "duplicate reduce under jobs");
    failsBoth(src.replace("    steps:\n", "    steps: []\n    steps:\n"), "duplicate steps under reduce");

    // Flow syntax: a flow-mapping step item (with and without the
    // anchor id) and a flow-sequence item — unsupported, fail closed.
    failsBoth(src.replace("    steps:\n", "    steps:\n      - { id: gather_b, run: echo x }\n"), "flow mapping containing gather_b");
    failsBoth(src.replace("    steps:\n", "    steps:\n      - { name: flow-step }\n"), "unsupported flow step item");
    failsBoth(src.replace("    steps:\n", "    steps:\n      - [a, b]\n"), "flow sequence step item");

    // Sequence-valued item (nested block sequence where a mapping goes).
    failsBoth(src.replace("    steps:\n", "    steps:\n      - - nested\n"), "sequence-valued step item");

    // Positive control: the checked-in reducer still parses and passes.
    expect(checkWorkflowReadContract(readFileSync(WF_REDUCER), WF_REDUCER).ok).toBe(true);
  });

  it("EXACT-BYTE FINGERPRINTS are the authorization boundary: every byte change fails all four exported surfaces (round 20)", () => {
    for (const f of WORKFLOWS) {
      const src = readFileSync(f, "utf8");
      const mutations: ReadonlyArray<readonly [string, string]> = [
        [src.trimEnd() + '\n"jobs":\n  replacement:\n    runs-on: ubuntu-latest\n    steps:\n      - name: replacement\n        run: echo replacement\n', "quoted duplicate jobs (Codex round-20 repro)"],
        // "reduce" duplicated INSIDE jobs at job indent — parseable YAML
        // in which the quoted key genuinely shadows/duplicates reduce
        // (round-21 fix: the prior spelling sat at invalid indentation).
        [src.includes("  reduce:\n") ? src.replace("  reduce:\n", '  "reduce": {}\n  reduce:\n') : src.replace(/$/, '\n  "reduce": {}\n'), "quoted duplicate reduce"],
        [src.includes("    steps:\n") ? src.replace("    steps:\n", '    "steps": []\n    steps:\n') : src.replace(/$/, '\n    "steps": []\n'), "quoted duplicate steps"],
        // a TRUE duplicate quoted "id" on the same real step (round-21
        // fix: the prior spelling added a new id, not a duplicate).
        [src.includes("        id: ") ? src.replace(/^( {8}id: [A-Za-z_][A-Za-z0-9_]*)$/m, '$1\n        "id": duplicate_of_same_step') : src + '\n        "id": x\n', "quoted duplicate id on the same step"],
        [src.replace("        run: |\n", '        "run": |\n          true\n        run: |\n'), "quoted duplicate run"],
        [src + "? explicit-key\n: value\n", "explicit mapping key"],
        [src + "      - name:\n", "null inline value"],
        [src + "      - { id: flow }\n", "flow mapping"],
        [src + "fake: |\n  scalar-spoof\n", "block-scalar spoofing"],
        [src.replace("\n", " \n"), "one-byte whitespace change (first line)"],
        [src + "# harmless appended comment\n", "appended harmless comment"],
        [src.replace("\n", "\r\n"), "changed line ending (first line)"],
      ];
      for (const [mutated, why] of mutations) {
        expect(mutated, `${f}: ${why}: mutation did not apply`).not.toBe(src);
        // 3. boundary → workflow-fingerprint violation
        expect(
          checkWorkflowBoundary(wfBytes(mutated), f).map((v) => v.rule),
          `${f}: ${why} (boundary)`,
        ).toContain("workflow-fingerprint");
        // 4. read contract → ok:false with a fingerprint reason
        const contract = checkWorkflowReadContract(wfBytes(mutated), f);
        expect(contract.ok, `${f}: ${why} (contract)`).toBe(false);
        expect(contract.detail, `${f}: ${why} (contract detail)`).toContain("fingerprint");
        // 5. complete → nonempty violations
        expect(checkWorkflowComplete(wfBytes(mutated), f).length, `${f}: ${why} (complete)`).toBeGreaterThan(0);
        // 6. collector → nothing permitted, never an empty clean result
        const invocations = collectEffectiveGhInvocations(wfBytes(mutated), f);
        expect(invocations.length, `${f}: ${why} (collector nonempty)`).toBeGreaterThan(0);
        expect(invocations.every((i) => !i.permitted), `${f}: ${why} (collector non-permitted)`).toBe(true);
      }
    }
  });

  it("RAW BYTES are hashed, not decoded text: distinct byte streams that decode alike still fail independently, and no surface authorizes a string (round 21)", () => {
    const raw = readFileSync(WF_REDUCER);
    // Two DIFFERENT invalid UTF-8 byte streams that decode to the same
    // replacement-character string: hashing after decoding would
    // collapse them; hashing raw bytes keeps them distinct (and both
    // distinct from the pin).
    const invalidA = Buffer.concat([raw, Buffer.from([0xff])]);
    const invalidB = Buffer.concat([raw, Buffer.from([0xfe])]);
    expect(new TextDecoder("utf-8").decode(invalidA)).toBe(new TextDecoder("utf-8").decode(invalidB));
    const digest = (b: Buffer) => createHash("sha256").update(b).digest("hex");
    expect(digest(invalidA)).not.toBe(digest(invalidB));
    const byteMutations: ReadonlyArray<readonly [Buffer, string]> = [
      [invalidA, "invalid UTF-8 stream A (0xFF tail)"],
      [invalidB, "invalid UTF-8 stream B (0xFE tail)"],
      [Buffer.from(raw.toString("utf8"), "utf16le"), "UTF-16LE re-encoding of the same text"],
      [Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), raw]), "BOM prepended"],
      [Buffer.from(raw.toString("utf8").replace(/\n/g, "\r\n"), "utf8"), "LF → CRLF"],
      [Buffer.concat([raw, Buffer.from("\n")]), "trailing newline appended"],
      [raw.subarray(0, raw.length - 1), "one byte deleted"],
      [Buffer.concat([raw.subarray(0, 100), Buffer.from([raw[100]! ^ 0x01]), raw.subarray(101)]), "one byte changed"],
    ];
    for (const [bytes, why] of byteMutations) {
      expect(verifyWorkflowFingerprint(bytes, WF_REDUCER), why).not.toBeNull();
      expect(checkWorkflowBoundary(bytes, WF_REDUCER).map((v) => v.rule), why).toContain("workflow-fingerprint");
      const contract = checkWorkflowReadContract(bytes, WF_REDUCER);
      expect(contract.ok, why).toBe(false);
      expect(contract.detail, why).toMatch(/fingerprint|raw bytes/);
      expect(checkWorkflowComplete(bytes, WF_REDUCER).length, why).toBeGreaterThan(0);
      const invocations = collectEffectiveGhInvocations(bytes, WF_REDUCER);
      expect(invocations.length, `${why} (collector nonempty)`).toBeGreaterThan(0);
      expect(invocations.every((i) => !i.permitted), `${why} (non-permitted)`).toBe(true);
    }
    // A decoded STRING is not an authorization input: the shared
    // verifier refuses it outright rather than re-encoding and hashing.
    const asString = raw.toString("utf8") as unknown as Buffer;
    expect(verifyWorkflowFingerprint(asString, WF_REDUCER)).toContain("raw bytes");
    const viaString = collectEffectiveGhInvocations(asString, WF_REDUCER);
    expect(viaString.length).toBeGreaterThan(0);
    expect(viaString.every((i) => !i.permitted)).toBe(true);
    // And no enforcement path re-encodes for fingerprinting: only the
    // clean raw bytes pass.
    expect(verifyWorkflowFingerprint(raw, WF_REDUCER)).toBeNull();
  });

  it("fingerprint positive/negative controls: exact bytes pass under exact identity; correct bytes under a WRONG valid identity fail (round 20)", () => {
    for (const f of WORKFLOWS) {
      const raw = readFileSync(f);
      expect(verifyWorkflowFingerprint(raw, f), f).toBeNull();
      expect(checkWorkflowComplete(raw, f), f).toEqual([]);
      expect(checkWorkflowReadContract(raw, f).ok, f).toBe(true);
      expect(collectEffectiveGhInvocations(raw, f).every((i) => i.permitted), f).toBe(true);
      // Correct bytes, wrong (but valid) workflow identity: fingerprint
      // mismatch — identity and bytes bind together.
      const other = WORKFLOWS.find((w) => w !== f) ?? f;
      expect(verifyWorkflowFingerprint(raw, other), `${f} as ${other}`).not.toBeNull();
      expect(checkWorkflowReadContract(raw, other).ok, `${f} as ${other}`).toBe(false);
      expect(
        collectEffectiveGhInvocations(raw, other).some((i) => i.permitted),
        `${f} as ${other}`,
      ).toBe(false);
    }
  });

  it("the pinned constants are literal committed values equal to independent SHA-256 of the committed files — and modified bytes cannot pass by recomputation (round 20)", () => {
    for (const f of WORKFLOWS) {
      const bytes = readFileSync(f);
      const independent = createHash("sha256").update(bytes).digest("hex");
      expect(WORKFLOW_FINGERPRINTS[f], f).toBe(independent);
    }
    // A recomputed digest of MUTATED bytes never matches the pinned
    // constant — the constant is committed, not derived at runtime.
    const mutated = wfBytes(readFileSync(WF_REDUCER, "utf8") + "# tail\n");
    const recomputed = createHash("sha256").update(mutated).digest("hex");
    expect(recomputed).not.toBe(WORKFLOW_FINGERPRINTS[WF_REDUCER]);
    expect(verifyWorkflowFingerprint(mutated, WF_REDUCER)).not.toBeNull();
  });

  it("workflow identity is MANDATORY and exact: missing, basename-only, absolute, and same-basename-elsewhere identities permit nothing (round 16)", () => {
    const src = readFileSync(WF_REDUCER);
    for (const badIdentity of [
      undefined as unknown as string,            // missing identity
      "straylight-reducer.yml",                  // basename only
      "/tmp/not-a-workflow/straylight-reducer.yml", // same basename, wrong tree
      `${process.cwd()}/${WF_REDUCER}`,          // absolute path to the real file
      ".github/workflows/other.yml",             // unknown workflow
    ]) {
      const invocations = collectEffectiveGhInvocations(src, badIdentity);
      expect(invocations.length, String(badIdentity)).toBeGreaterThan(0);
      for (const inv of invocations) {
        expect(inv.permitted, `${String(badIdentity)}: ${inv.words.join(" ")}`).toBe(false);
      }
      expect(
        checkWorkflowBoundary(src, badIdentity).map((v) => v.rule),
        String(badIdentity),
      ).toContain("workflow-identity");
    }
    // The exact repository-relative identity remains fully permitted.
    expect(collectEffectiveGhInvocations(src, WF_REDUCER).every((i) => i.permitted)).toBe(true);
  });

  it("FAIL CLOSED: wrapped, unresolved, and xargs-hidden gh invocations surface as NON-permitted — never as an empty invocation set (round 14)", () => {
    for (const hidden of [
      `timeout 30 gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `timeout --signal=TERM 30 gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `nice gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `nice -n 5 gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `/usr/bin/env gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `env -- gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `env --split-string='gh api repos/x/y/pulls/1' > /tmp/pr.json`,
      `stdbuf -o L gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `echo "repos/x/y/pulls/1" | xargs gh api`,
      `doas gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `timeout \$DUR gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
    ]) {
      const invocations = collectEffectiveGhInvocations(wfBytes(hidden), WF_REDUCER);
      expect(invocations.length, `${hidden}: collector returned an empty set — the wrapper hid the invocation`).toBeGreaterThan(0);
      for (const inv of invocations) {
        expect(inv.permitted, `${hidden}: ${inv.words.join(" ")}`).toBe(false);
      }
    }
  });

  it("wrapper resolution is exact where provable: the resolved argv behind timeout/nice/env/stdbuf is the gh command itself", () => {
    for (const [payload, viaWrapper] of [
      [`timeout 30 gh api "repos/x/y/pulls/1" > /tmp/pr.json`, true],
      [`timeout --signal=TERM 30 gh api "repos/x/y/pulls/1" > /tmp/pr.json`, true],
      [`nice -n 5 gh api "repos/x/y/pulls/1" > /tmp/pr.json`, true],
      [`env -- gh api "repos/x/y/pulls/1" > /tmp/pr.json`, true],
      [`/usr/bin/env gh api "repos/x/y/pulls/1" > /tmp/pr.json`, true],
      [`stdbuf -o L gh api "repos/x/y/pulls/1" > /tmp/pr.json`, true],
      [`stdbuf -oL gh api "repos/x/y/pulls/1" > /tmp/pr.json`, true],
      [`setsid gh api "repos/x/y/pulls/1" > /tmp/pr.json`, true],
    ] as const) {
      const invocations = collectEffectiveGhInvocations(wfBytes(payload), WF_REDUCER);
      expect(invocations, payload).toHaveLength(1);
      expect(invocations[0]?.words[0], payload).toBe("gh");
      expect(invocations[0]?.words[1], payload).toBe("api");
      expect(invocations[0]?.wrapped, payload).toBe(viaWrapper);
      expect(invocations[0]?.unresolved, payload).toBe(false);
    }
    // And the unprovable positions carry unresolved:true explicitly.
    for (const payload of [
      `env --split-string='gh api repos/x/y/pulls/1' > /tmp/pr.json`,
      `env -S 'gh api' "repos/x/y/pulls/1"`,
      `timeout \$DUR gh api "repos/x/y/pulls/1" > /tmp/pr.json`,
      `stdbuf --weird gh api "repos/x/y/pulls/1"`,
    ]) {
      const invocations = collectEffectiveGhInvocations(wfBytes(payload), WF_REDUCER);
      expect(invocations.length, payload).toBeGreaterThan(0);
      expect(invocations.some((i) => i.unresolved), payload).toBe(true);
    }
  });

  it("FAIL CLOSED: compound conditions and tuple mismatches surface from the collector as NON-permitted (round 15)", () => {
    // Codex round-15 repro 1: `; false` replaces the read's exit status
    // before `then` — the segment is no longer the sole condition.
    const compound = [
      `if ! gh api --paginate "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; false; then`,
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json" && true; then`,
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json" || true; then`,
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" | cat > "\${DIR}/issue.json"; then`,
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json"; echo pre-then; then`,
    ];
    for (const payload of compound) {
      const invocations = collectEffectiveGhInvocations(wfBytes(payload), WF_REDUCER);
      expect(invocations.length, payload).toBeGreaterThan(0);
      for (const inv of invocations) {
        expect(inv.guarded, `${payload}: sole-condition context lost`).toBe(false);
        expect(inv.permitted, payload).toBe(false);
      }
    }
    // Codex round-15 repro 2: shape-passing reads outside the closed
    // tuple set — arbitrary subroutes, arbitrary outputs, tuple swaps.
    const offTuple = [
      `if ! gh api "repos/\${REPO}/issues/999/events" > /tmp/arbitrary.json; then`,
      `if ! gh api --paginate "repos/\${REPO}/labels/bug/something" > "\${DIR}/labels.pages"; then`,
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > /tmp/arbitrary.json; then`,
      `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/enumeration.pages"; then`,
      `if ! gh api "repos/\${REPO}/issues?state=open&per_page=100" > "\${DIR}/enumeration.pages"; then`,
      `if ! gh api --paginate "repos/\${REPO}/issues?state=closed&per_page=100" > "\${DIR}/enumeration.pages"; then`,
    ];
    for (const payload of offTuple) {
      const invocations = collectEffectiveGhInvocations(wfBytes(payload), WF_REDUCER);
      expect(invocations.length, payload).toBeGreaterThan(0);
      for (const inv of invocations) {
        expect(inv.guarded, payload).toBe(true); // the guard is intact — the TUPLE is what fails
        expect(inv.permitted, payload).toBe(false);
      }
    }
    // Workflow-identity binding: a tuple is permitted only in a workflow
    // that declares it — issue.json's read inside bootstrap is refused.
    const issueRead = `if ! gh api "repos/\${REPO}/issues/\${ISSUE_NUMBER}" > "\${DIR}/issue.json"; then`;
    const inReducer = diagnoseEffectiveGhInvocations(issueRead, WF_REDUCER);
    const inBootstrap = diagnoseEffectiveGhInvocations(issueRead, WF_BOOTSTRAP);
    expect(inReducer[0]?.permitted).toBe(true);
    expect(inBootstrap[0]?.permitted).toBe(false);
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
