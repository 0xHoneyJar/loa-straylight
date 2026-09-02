// Straylight Control Plane v1 — task-packet EFFECT SCOPE semantics
// (pure, fail-closed).
//
// WHAT THIS OWNS. `allowed_paths`, `forbidden_paths` and `may_open_pr` are
// validated for SHAPE by validate.mjs#validateTaskPacket, but their EFFECT
// semantics — what they actually permit — had no mechanical definition. A
// consumer that wants to know "does this packet's scope permit this effect?"
// must not invent the answer. This module is the single semantic owner of
// that question, and Straylight owns it so an executor can only ENFORCE it.
//
// WHAT THIS IS NOT. A positive result establishes exactly ONE component of
// implementer authorization:
//
//     TASK_PACKET_SCOPE_COMPONENT
//
// It is NOT authorization to execute, to launch a model, to touch the
// worktree, to push, to open a pull request, to post an event, or to
// continue a lane. Production authorization is the CONJUNCTION of
// separately established facts, each owned elsewhere:
//
//     current committed policy      (validate.mjs#acceptPolicy)
//   + resolved admission epoch      (validate.mjs#admissionPolicyFor)
//   + authenticated/current packet  (reconstruct.mjs)
//   + current lane/turn             (state-machine.mjs)
//   + admitted current lease        (reconstruct.mjs, reducer.mjs)
//   + task-packet effect scope      (THIS MODULE)
//
// This module deliberately cannot reach any of the others: it reconstructs
// nothing, authenticates nothing, resolves no epoch, holds no lease, and
// has no I/O. The name of the entry point says "ScopeComponent" and the
// success value carries `component`, never anything resembling "authorized",
// so a caller cannot plausibly mistake it for the whole conjunction. Purity
// and that boundary are pinned by tests/control-plane/task-scope.test.ts.
//
// SEMANTIC PROVENANCE. The rules below are not chosen here; they are read
// off the merged normative artifacts and implemented faithfully:
//
//   task-packet-v1.schema.json#allowed_paths
//     "Complete allowed file scope (repo-relative prefixes). Anything
//      outside is out of scope."
//   task-packet-v1.schema.json#forbidden_paths
//     "Explicitly forbidden paths (e.g. .loa, .claude, src/straylight,
//      .github/workflows/post-merge.yml). Forbidden wins over allowed."
//   prompts/claude-fable-implementer.md
//     "Stay inside `allowed_paths`; never touch `forbidden_paths`
//      (forbidden wins on overlap)."
//
// Accepted packets in the merged lane histories spell a DIRECTORY scope with
// a trailing slash (`src/`, `.straylight/`, `scripts/phase-50a/`,
// `docs/decisions/`) and an EXACT file without one (`package.json`,
// `src/straylight/index.ts`, `.github/workflows/post-merge.yml`). That
// distinction is the established semantics and is implemented as such.
//
// AMBIGUITY IS RESOLVED TOWARD REFUSAL, NEVER TOWARD PERMISSION. Where the
// merged corpus is not decisive, the reading that REFUSES MORE is taken, so
// no gap in the record can widen real write capability:
//
//   * A slashless ALLOWED entry is exact-only. Reading it as a subtree
//     would admit paths the packet did not name.
//   * A slashless FORBIDDEN entry covers its subtree too. The corpus uses
//     both `.loa` (a real file) and `.claude` (a real directory) without a
//     slash, so exact-only would silently drop a directory prohibition.
//
// THERE IS NO PATTERN LANGUAGE HERE. `*`, `?`, `[`, `]`, `{` and `}` have no
// defined meaning anywhere in the protocol — no matcher of any kind exists in
// the repository, and pattern semantics remain an OPEN OPERATOR DECISION that
// this module does not decide. Nothing below interprets a pattern. Entries
// carrying that syntax are handled by the ONE rule that cannot depend on the
// undecided question:
//
//     UNSUPPORTED SYNTAX MAY ONLY REDUCE PERMISSION OR REFUSE THE
//     DETERMINATION. IT MAY NEVER EXPAND PERMISSION.
//
// In ALLOWED scope, unsupported syntax refuses the whole determination: any
// reading of it would admit paths on a guess. In FORBIDDEN scope it is
// over-approximated by the literal text preceding it — but ONLY when that
// literal prefix is non-empty and therefore demonstrably fail-closed, so the
// corpus's real `.env.*` entry still refuses `.env.local`. An entry that
// BEGINS with unsupported syntax (`*`, `?foo`, `[abc]`) has an EMPTY literal
// prefix: there is no conservative prefix to reduce toward, so the whole
// determination refuses rather than letting a prohibition match nothing.
//
// ONE CANONICAL PATH LANGUAGE, USED FOR EVERY PATH. A STRUCTURALLY VALID
// PACKET STRING IS NOT NECESSARILY A CANONICAL TASK-SCOPE PATH. Structural
// packet legality is owned by validate.mjs#RELATIVE_PATH_RE and is necessary
// but NOT sufficient for semantic matching: it admits `docs//`, `docs/./`,
// `docs\secret.md` and `C:/secret.txt`. Each of those either silently matches
// nothing — an INERT prohibition, which is under-matching — or depends on a
// platform's normalization rules. So this module adds a stricter SEMANTIC
// canonicality predicate (classifyTaskScopePath) and applies THE SAME ONE to
// all three path populations: `allowed_paths` entries, `forbidden_paths`
// entries and proposed changed paths. Non-canonical input is REFUSED, never
// normalized into something permitted. The deliberate trailing-slash
// directory spelling is canonical and preserved; ambiguous or repeated
// separators are not.

import { validateTaskPacket, RELATIVE_PATH_RE } from "./validate.mjs";

/** The one authorization component a positive result establishes. */
export const TASK_PACKET_SCOPE_COMPONENT = "task-packet-effect-scope";

/**
 * The CLOSED implementer effect vocabulary this slice governs. An effect
 * outside it has no scope semantics and refuses; it is never "allowed by
 * default". Push, merge, comment, lease and operator-event effects are
 * deliberately absent — they are not task-packet scope questions.
 */
export const IMPLEMENTER_EFFECTS = Object.freeze(["modify-worktree", "open-pr"]);

/**
 * The closed refusal vocabulary. Bounded output, never prose reasoning.
 * Listed in REFUSAL PRECEDENCE order (see evaluateTaskPacketScopeComponent).
 */
export const SCOPE_REFUSALS = Object.freeze([
  "input-malformed",
  "packet-invalid",
  "unknown-effect",
  "pr-not-permitted",
  "scope-entry-non-canonical",
  "allowed-scope-uninterpretable",
  "forbidden-scope-uninterpretable",
  "changed-paths-malformed",
  "empty-changed-path-set",
  "changed-path-malformed",
  "path-forbidden",
  "path-outside-allowed-scope",
]);

// Syntax the protocol does not define. NOT a pattern language: nothing here
// interprets these characters. They are handled by the reduce-or-refuse rule
// documented in the module header.
const UNSUPPORTED_SYNTAX_RE = /[*?[\]{}]/;

// A Windows drive-letter prefix (`C:/secret.txt`, `C:\secret.txt`, `C:x`).
// Whether such a string names a repo-relative file at all is platform
// dependent, so it is not a canonical task-scope path.
const DRIVE_PREFIX_RE = /^[A-Za-z]:/;

function refuse(refusal, detail) {
  return { ok: false, refusal, detail };
}

/**
 * THE ONE canonical task-scope path language. Applied identically to
 * `allowed_paths` entries, `forbidden_paths` entries and proposed changed
 * paths, so no population has its own normalization rules.
 *
 *   -> { kind: "exact" }      a canonical slashless path: one exact path
 *   -> { kind: "directory" }  a canonical trailing-slash path: a subtree
 *   -> { error: <code> }      not canonical; the caller must REFUSE
 *
 * RELATIVE_PATH_RE (validate.mjs — the single structural owner, reused rather
 * than restated) already refuses a leading `/`, any `..` traversal, a
 * non-printable or non-ASCII byte (so NUL and every control form), an empty
 * string and anything over 300 characters. That is NECESSARY BUT NOT
 * SUFFICIENT for semantic matching, so this predicate is strictly stronger:
 * it also refuses any backslash (`docs\x`, UNC forms), a Windows drive-letter
 * prefix (`C:/secret.txt`), a repeated separator (`docs//`), a `.` segment
 * (`./docs`, `docs/./x`) and a whitespace-padded segment. Those are REFUSED
 * rather than normalized, so a path cannot be spelled two ways and a
 * prohibition can never be silently inert.
 *
 * Unsupported syntax is deliberately NOT a canonicality error here: the
 * per-field reduce-or-refuse rule owns it, because `.env.*` must remain a
 * conservatively fail-closed prohibition rather than an invalid packet.
 */
function classifyTaskScopePath(s) {
  if (typeof s !== "string") return { error: "not-a-string" };
  if (s.length === 0) return { error: "empty" };
  if (!RELATIVE_PATH_RE.test(s)) return { error: "malformed" }; // absolute, traversal, non-printable, over-long
  if (s.includes("\\")) return { error: "backslash" };
  if (DRIVE_PREFIX_RE.test(s)) return { error: "drive-letter-path" };
  // A trailing slash is the established DIRECTORY spelling, so it is stripped
  // once before the segments are judged — and exactly once, so `docs//` and
  // `docs/./` still fail below.
  const directory = s.endsWith("/");
  for (const segment of (directory ? s.slice(0, -1) : s).split("/")) {
    if (segment === "") return { error: "empty-segment" }; // `a//b`, `docs//`
    if (segment === ".") return { error: "dot-segment" }; // `./a`, `a/./b`, `docs/./`
    if (segment !== segment.trim()) return { error: "whitespace-padded-segment" };
  }
  return { kind: directory ? "directory" : "exact" };
}

/**
 * Canonical form of a PROPOSED CHANGED PATH: it must be a canonical
 * task-scope path that names exactly one FILE, in syntax the protocol
 * defines. Returns a short form code, or null when the path is canonical.
 */
function changedPathFormError(p) {
  const form = classifyTaskScopePath(p);
  if (form.error !== undefined) return form.error;
  if (form.kind === "directory") return "names-a-directory-not-a-file";
  if (UNSUPPORTED_SYNTAX_RE.test(p)) return "unsupported-syntax";
  return null;
}

/**
 * The conservative FORBIDDEN reduction of an entry carrying syntax the
 * protocol does not define. This interprets nothing; it only asks how far the
 * entry can be read as a plain literal.
 *
 *   -> undefined  no unsupported syntax; the entry is read literally
 *   -> string     a non-empty literal prefix, demonstrably fail-closed:
 *                 forbidding it forbids AT LEAST what the entry could mean
 *   -> null       NO SAFE PREFIX (the entry begins with unsupported syntax),
 *                 so there is nothing conservative to reduce toward
 */
function conservativeForbiddenPrefix(entry) {
  const at = entry.search(UNSUPPORTED_SYNTAX_RE);
  if (at < 0) return undefined;
  const literal = entry.slice(0, at);
  return literal.length > 0 ? literal : null;
}

/**
 * Does an ALLOWED scope entry cover `p`? Trailing slash is a subtree; no
 * trailing slash is that exact file and nothing else.
 */
function allowedEntryCovers(entry, p) {
  if (entry.endsWith("/")) return p.startsWith(entry) && p.length > entry.length;
  return p === entry;
}

/**
 * Does a FORBIDDEN scope entry cover `p`? Trailing slash is a subtree; no
 * trailing slash is the exact file AND its subtree; an entry carrying
 * unsupported syntax is over-approximated by its conservative literal prefix.
 *
 * An entry with NO safe prefix covers EVERY path. The evaluator refuses such a
 * packet outright before reaching here, so this branch is defence in depth —
 * but it is deliberately the maximally restrictive answer, so unsupported
 * syntax cannot expand permission at either layer.
 */
function forbiddenEntryCovers(entry, p) {
  const prefix = conservativeForbiddenPrefix(entry);
  if (prefix === null) return true;
  if (prefix !== undefined) return p.startsWith(prefix);
  if (entry.endsWith("/")) return p.startsWith(entry) && p.length > entry.length;
  return p === entry || p.startsWith(`${entry}/`);
}

/**
 * Evaluate the TASK-PACKET SCOPE COMPONENT of an implementer effect.
 *
 *   evaluateTaskPacketScopeComponent({ packet, changed_paths, requested_effect })
 *     -> { ok: true, component: TASK_PACKET_SCOPE_COMPONENT }
 *     -> { ok: false, refusal, detail }
 *
 * Pure and total: same input, same answer, no I/O, no clock, no mutation of
 * the input. It DEFINES whether the packet's declared scope permits the
 * effect; it never performs the effect, and on its own authorizes nothing.
 *
 * The packet is validated through validate.mjs#validateTaskPacket — the one
 * task-packet validator — so this cannot be pointed at arbitrary JSON. It
 * does not and must not re-derive reconstruction, actor authentication,
 * lane turn, admission epoch or lease facts; a caller must establish those
 * separately and conjoin them with this result.
 *
 * REFUSAL PRECEDENCE is fixed so the answer is deterministic: input shape,
 * then packet validity, then effect vocabulary, then the effect's own packet
 * permission (`may_open_pr`), then the packet's own declared SCOPE LANGUAGE
 * (canonicality of every entry, then allowed-scope and forbidden-scope
 * interpretability), then changed-path shape, then — per path, in the given
 * order — forbidden before allowed. The scope language is judged before any
 * proposed path because a packet whose declared scope cannot be read admits
 * no determination at all, whatever is proposed against it. Forbidden is
 * evaluated before allowed for every path, so forbidden always wins on
 * overlap.
 *
 * Every path must pass: one refused path refuses the whole determination.
 * Duplicate paths are deduplicated and cannot change the answer. An empty
 * changed-path set refuses (an effect that proposes no change is not a
 * scope-approved change).
 */
export function evaluateTaskPacketScopeComponent(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return refuse("input-malformed", "expected an object with packet, changed_paths, requested_effect");
  }
  const { packet, changed_paths, requested_effect } = input;

  const validated = validateTaskPacket(packet);
  if (!validated.ok) return refuse("packet-invalid", validated.errors.join("; "));
  const pkt = validated.value;

  if (typeof requested_effect !== "string" || !IMPLEMENTER_EFFECTS.includes(requested_effect)) {
    return refuse(
      "unknown-effect",
      `requested_effect must be one of ${IMPLEMENTER_EFFECTS.join(", ")}`
    );
  }

  // `may_open_pr` governs the PR effect and NOTHING else. A worktree
  // modification is never gated on it, and `true` here is only the packet's
  // component of PR permission — it is not permission to call GitHub.
  if (requested_effect === "open-pr" && pkt.may_open_pr !== true) {
    return refuse("pr-not-permitted", "packet.may_open_pr is not true");
  }

  // THE PACKET'S OWN SCOPE LANGUAGE. validateTaskPacket establishes that each
  // entry is a structurally legal packet string; it does NOT establish that
  // the entry is a canonical task-scope path. `docs//`, `docs/./`,
  // `docs\secret.md` and `C:/secret.txt` all pass structurally and would then
  // match nothing — an operator's prohibition silently forbidding NOTHING, or
  // a scope decided by a platform's normalization. Refuse instead.
  for (const [field, entries] of [
    ["allowed_paths", pkt.allowed_paths],
    ["forbidden_paths", pkt.forbidden_paths],
  ]) {
    for (const entry of entries) {
      const form = classifyTaskScopePath(entry);
      if (form.error !== undefined) {
        return refuse(
          "scope-entry-non-canonical",
          `${field} entry ${JSON.stringify(entry)} is not a canonical task-scope path: ${form.error}`
        );
      }
    }
  }

  // Unsupported syntax may only REDUCE permission or REFUSE. In allowed scope
  // there is nothing to reduce toward — any reading would admit paths on a
  // guess — so the determination refuses.
  for (const entry of pkt.allowed_paths) {
    if (UNSUPPORTED_SYNTAX_RE.test(entry)) {
      return refuse(
        "allowed-scope-uninterpretable",
        `allowed_paths entry ${JSON.stringify(entry)} uses syntax the protocol does not define`
      );
    }
  }

  // In forbidden scope the conservative literal prefix is used — but only
  // where it is demonstrably fail-closed. An entry BEGINNING with unsupported
  // syntax has an empty prefix, i.e. no safe conservative reading, so the
  // whole determination refuses rather than under-matching.
  for (const entry of pkt.forbidden_paths) {
    if (conservativeForbiddenPrefix(entry) === null) {
      return refuse(
        "forbidden-scope-uninterpretable",
        `forbidden_paths entry ${JSON.stringify(entry)} uses syntax the protocol does not define and has no literal prefix to conservatively forbid`
      );
    }
  }

  if (!Array.isArray(changed_paths)) {
    return refuse("changed-paths-malformed", "changed_paths must be an array");
  }
  if (changed_paths.length === 0) {
    return refuse("empty-changed-path-set", "changed_paths is empty");
  }
  for (let i = 0; i < changed_paths.length; i += 1) {
    const formError = changedPathFormError(changed_paths[i]);
    if (formError !== null) {
      return refuse("changed-path-malformed", `changed_paths[${i}]: ${formError}`);
    }
  }

  for (const path of new Set(changed_paths)) {
    const forbiddenBy = pkt.forbidden_paths.find((entry) => forbiddenEntryCovers(entry, path));
    if (forbiddenBy !== undefined) {
      return refuse("path-forbidden", `${path} is forbidden by ${JSON.stringify(forbiddenBy)}`);
    }
    if (!pkt.allowed_paths.some((entry) => allowedEntryCovers(entry, path))) {
      return refuse("path-outside-allowed-scope", `${path} is not inside allowed_paths`);
    }
  }

  return { ok: true, component: TASK_PACKET_SCOPE_COMPONENT };
}
