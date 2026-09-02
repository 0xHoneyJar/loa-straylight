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
//   * A glob metacharacter has no defined meaning anywhere in the protocol
//     (there is no matcher in the repository). In ALLOWED scope it is
//     uninterpretable and refuses the whole determination; in FORBIDDEN
//     scope it is over-approximated by its literal prefix, so `.env.*`
//     still refuses `.env.local`. Real pattern semantics remain an OPEN
//     OPERATOR DECISION; nothing here depends on inventing them.

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

/** The closed refusal vocabulary. Bounded output, never prose reasoning. */
export const SCOPE_REFUSALS = Object.freeze([
  "input-malformed",
  "packet-invalid",
  "unknown-effect",
  "changed-paths-malformed",
  "empty-changed-path-set",
  "changed-path-malformed",
  "allowed-scope-uninterpretable",
  "pr-not-permitted",
  "path-forbidden",
  "path-outside-allowed-scope",
]);

// A glob metacharacter. No component of the protocol defines pattern
// matching over packet scope, so these are handled as documented above
// rather than silently treated as literals.
const GLOB_META_RE = /[*?[\]{}]/;

function refuse(refusal, detail) {
  return { ok: false, refusal, detail };
}

/**
 * Canonical form of a PROPOSED CHANGED PATH: a repo-relative path naming
 * exactly one file, in one unambiguous spelling. Returns a short form code,
 * or null when the path is canonical.
 *
 * RELATIVE_PATH_RE (validate.mjs, the same constant the packet's own scope
 * entries are validated against) already refuses an absolute path, any `..`
 * traversal, a non-printable or non-ASCII byte, an empty string and
 * anything over 300 characters. The rest closes normalization ambiguity: a
 * path must not be spelled two ways, so `./a`, `a//b`, `a/./b`, `a/`, ` a`
 * and `a\b` are all refused rather than normalized into `a`.
 */
function changedPathFormError(p) {
  if (typeof p !== "string") return "not-a-string";
  if (p.length === 0) return "empty";
  if (!RELATIVE_PATH_RE.test(p)) return "malformed"; // absolute, traversal, non-printable, over-long
  if (p.endsWith("/")) return "names-a-directory-not-a-file";
  if (GLOB_META_RE.test(p)) return "glob-metacharacter";
  if (p.includes("\\")) return "backslash-separator";
  for (const segment of p.split("/")) {
    if (segment === "") return "empty-segment"; // `a//b`
    if (segment === ".") return "dot-segment"; // `./a`, `a/./b`
    if (segment !== segment.trim()) return "whitespace-padded-segment";
  }
  return null;
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
 * trailing slash is the exact file AND its subtree; a metacharacter entry
 * is over-approximated by the literal prefix preceding it.
 */
function forbiddenEntryCovers(entry, p) {
  const meta = entry.search(GLOB_META_RE);
  if (meta >= 0) {
    const literal = entry.slice(0, meta);
    return literal.length > 0 && p.startsWith(literal);
  }
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
 * then packet validity, then effect vocabulary, then the effect's own
 * packet permission (`may_open_pr`), then changed-path shape, then
 * allowed-scope interpretability, then — per path, in the given order —
 * forbidden before allowed. Forbidden is evaluated before allowed for every
 * path, so forbidden always wins on overlap.
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

  for (const entry of pkt.allowed_paths) {
    if (GLOB_META_RE.test(entry)) {
      return refuse(
        "allowed-scope-uninterpretable",
        `allowed_paths entry ${JSON.stringify(entry)} contains a glob metacharacter, which has no defined meaning`
      );
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
