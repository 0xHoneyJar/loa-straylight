// Straylight Control Plane v1 — write-plan schema + structural rules (pure).
//
// The closed `straylight.write-plan.v1` contract every planner authors and
// the single shared executor (bin/execute-write-plan.mjs) consumes. This
// module owns:
//
//   - the CLOSED plan/operation schema — unknown fields are refused
//     everywhere. In particular, NO `best_effort` field exists: its
//     appearance anywhere is an unknown-field refusal. Best-effort
//     semantics derive EXCLUSIVELY from the hard-coded operation-kind
//     registry below; nothing in a plan can widen them.
//   - the REQUIRED write-authority binding (`authority`): the exact commit
//     the plan was produced at and the canonical digest of the accepted
//     policy that governed the planning. Shape rules live in
//     lib/write-authority.mjs; the executor re-establishes both from
//     GitHub before every mutation, because a plan that was authorized
//     earlier is not a plan that is authorized now (Codex H-02).
//   - the operation-kind allowlist with fixed method/path templates —
//     a plan carries NO method, path, URL, host, or endpoint anywhere;
//     the executor constructs the request path from the validated fields
//     via this registry only.
//   - kind-derived fatality: a non-zero `gh` API result is FATAL for
//     every kind except the derived-label add/remove kinds (and the
//     removal half of the cp-paused pair), which are warning-only.
//   - structural terminal-barrier rules: at most one state-advancing
//     operation per issue per plan, nothing addressing that issue after
//     it (§10), and the cp-paused warning-before-removal dependency (§9)
//     as a validated structural field, never array order alone.
//   - endpoint body-content binding: every body is strict-parsed and
//     checked against its kind's closed endpoint schema, including the
//     exact full-line dedupe identity, the machine marker, embedded
//     payload validity, and lane/issue binding.
//
// Pure validation only — no file I/O, no network, no process spawning.
// The executor owns secure I/O (O_NOFOLLOW single-read/hash/retain) and
// process launch; planners own evidence, proofs, and dedupe.

import { parseStrict } from "./strict-json.mjs";
import { MARKERS, extractPayload, hasMarker } from "./markers.mjs";
import { validateEvent, validateLane } from "./validate.mjs";
import { STATES, ROLES } from "./state-machine.mjs";
import { authorityShapeErrors } from "./write-authority.mjs";

export const WRITE_PLAN_SCHEMA = "straylight.write-plan.v1";

// Owner and repository are FIXED: the compiled-in allowlist has exactly
// one entry for this control plane. plan.repository must equal it AND the
// workflow-supplied --repository argv.
export const REPOSITORY_ALLOWLIST = Object.freeze(["0xHoneyJar/loa-straylight"]);

// Run nonce: GITHUB_RUN_ID-GITHUB_RUN_ATTEMPT — two positive decimal
// integers separated by "-". Tests may supply an explicit valid fixture
// nonce; nothing else is accepted.
export const NONCE_RE = /^[1-9][0-9]*-[1-9][0-9]*$/;

const OP_ID_RE = /^op-[0-9]+$/;
const LANE_ID_RE = /^lane-[a-z0-9][a-z0-9-]{1,62}$/;
const BODY_FILE_RE = /^[A-Za-z0-9._-]+$/; // single path component, no traversal
const DIGEST_RE = /^sha256:[0-9a-f]{64}$/;
// Exact full-line dedupe identity: printable, no whitespace (a key with a
// space could never be a full-line identity match target).
const DEDUPE_KEY_RE = /^[\x21-\x7E]{1,200}$/;
const LABEL_COLOR_RE = /^[0-9a-f]{6}$/;
// Printable (no control bytes); the canonical Phase 49P title carries an
// em dash, so this is not ASCII-only.
const LANE_ISSUE_TITLE_RE = /^CP lane: [^\x00-\x1f\x7f]{1,180}$/;

const MAX_OPERATIONS = 64;
const MAX_COMMENT_BODY_BYTES = 65536;
const MAX_ISSUE_NUMBER = 1_000_000_000;

// The derived-label vocabulary (labels are projections of reconstructed
// state — ADR-050 §1.1). Anything outside it is refused before any
// argument construction.
const FIXED_LABELS = new Set(["cp-lane", "cp-paused", "cp-ready-for-merge", "cp-merged"]);

export function isDerivedLabel(label) {
  if (typeof label !== "string") return false;
  if (FIXED_LABELS.has(label)) return true;
  if (label.startsWith("cp-state:")) return STATES.includes(label.slice("cp-state:".length));
  if (label.startsWith("cp-next:")) {
    const actor = label.slice("cp-next:".length);
    return ROLES.includes(actor) || actor === "none";
  }
  return false;
}

// ---------------------------------------------------------------------------
// Operation-kind registry (the complete allowlist)
// ---------------------------------------------------------------------------
//
// fatal: a non-zero gh API result aborts the plan (executor exit 4).
// warning-only kinds log and continue — that set is HARD-CODED here;
// no plan field can move a kind between classes.
// state_advancing: terminal for its issue within a plan (§10).
// fields: the exact allowed/required op fields (closed per kind).

const COMMENT_FIELDS = Object.freeze(["issue_number", "dedupe_key", "body_file", "body_sha256"]);

export const OPERATION_KINDS = Object.freeze({
  "post-state-advancing-event": {
    method: "POST",
    path: (op, repo) => `repos/${repo}/issues/${op.issue_number}/comments`,
    body: true,
    fatal: true,
    state_advancing: true,
    fields: Object.freeze(["issue_number", "lane_id", "dedupe_key", "body_file", "body_sha256"]),
  },
  "post-reducer-result": {
    method: "POST",
    path: (op, repo) => `repos/${repo}/issues/${op.issue_number}/comments`,
    body: true,
    fatal: true,
    state_advancing: false,
    fields: COMMENT_FIELDS,
  },
  "post-watchdog-finding": {
    method: "POST",
    path: (op, repo) => `repos/${repo}/issues/${op.issue_number}/comments`,
    body: true,
    fatal: true,
    state_advancing: false,
    fields: COMMENT_FIELDS,
  },
  "post-merge-guard-result": {
    method: "POST",
    path: (op, repo) => `repos/${repo}/issues/${op.issue_number}/comments`,
    body: true,
    fatal: true,
    state_advancing: false,
    fields: COMMENT_FIELDS,
  },
  "post-cp-paused-warning": {
    method: "POST",
    path: (op, repo) => `repos/${repo}/issues/${op.issue_number}/comments`,
    body: true,
    fatal: true, // the §9 prerequisite: its failure must abort the removal
    state_advancing: false,
    fields: Object.freeze(["issue_number", "lane_id", "dedupe_key", "body_file", "body_sha256"]),
  },
  "add-derived-label": {
    method: "POST",
    path: (op, repo) => `repos/${repo}/issues/${op.issue_number}/labels`,
    body: true,
    fatal: false, // labels reconverge on the next run (C9)
    state_advancing: false,
    fields: Object.freeze(["issue_number", "label", "body_file", "body_sha256"]),
  },
  "remove-derived-label": {
    method: "DELETE",
    path: (op, repo) => `repos/${repo}/issues/${op.issue_number}/labels/${encodeURIComponent(op.label)}`,
    body: false,
    fatal: false,
    state_advancing: false,
    fields: Object.freeze(["issue_number", "label"]),
  },
  "remove-derived-cp-paused-after-warning": {
    method: "DELETE",
    // The label is FIXED by the kind — a plan cannot carry it.
    path: (op, repo) => `repos/${repo}/issues/${op.issue_number}/labels/cp-paused`,
    body: false,
    fatal: false, // the removal half stays warning-only; the WARNING is fatal by ITS kind
    state_advancing: false,
    fields: Object.freeze(["issue_number", "lane_id", "warning_op_id", "warning_proof"]),
  },
  "create-lane-issue": {
    method: "POST",
    path: (op, repo) => `repos/${repo}/issues`,
    body: true,
    fatal: true,
    state_advancing: false,
    fields: Object.freeze(["lane_id", "body_file", "body_sha256"]),
  },
  "create-label-definition": {
    method: "POST",
    path: (op, repo) => `repos/${repo}/labels`,
    body: true,
    fatal: true, // a silent failure would make lane creation diverge
    state_advancing: false,
    fields: Object.freeze(["body_file", "body_sha256"]),
  },
});

export function isWarningOnlyKind(kind) {
  const spec = OPERATION_KINDS[kind];
  return spec !== undefined && spec.fatal === false;
}

export function isStateAdvancingKind(kind) {
  const spec = OPERATION_KINDS[kind];
  return spec !== undefined && spec.state_advancing === true;
}

// ---------------------------------------------------------------------------
// cp-paused warning identity (the fixed, state-neutral template — §9/U7)
// ---------------------------------------------------------------------------

export function warningDedupeKey(laneId, issueNumber) {
  return `cp-paused-warning:${laneId}:${issueNumber}`;
}

// STATE-NEUTRAL by contract: the text explains that labels are derived
// projections and that reconstructed protocol state no longer supports
// cp-paused. It asserts NOTHING about how the label came to be present —
// label evidence carries no authorship, so "added by hand" is unprovable.
//
// The body BEGINS with the dedicated machine marker (round 11 J4):
// `<!-- straylight:cp-paused-warning:v1 -->` positively identifies a
// comment AS the canonical warning. The §9 removal proof requires the
// exact marker IN ADDITION to bot authorship, the byte-exact canonical
// body for the exact lane/issue, and the exact full-line dedupe
// identity — unrelated machine output that merely CONTAINS the dedupe
// line can never be a proof.
export function warningBodyFor(laneId, issueNumber) {
  return [
    `<!-- ${MARKERS.cpPausedWarning} -->`,
    "## Straylight cp-paused removal notice (shadow mode)",
    "",
    `dedupe:${warningDedupeKey(laneId, issueNumber)}`,
    "",
    "The `cp-paused` label on this issue is a derived projection of reconstructed",
    "protocol state, and the current reconstruction no longer supports it, so the",
    "label is being removed to reconverge the projection with the durable record.",
    "",
    "Labels are never authority (ADR-050 §1.1); this removal asserts nothing about",
    "how the label came to be present. To pause this lane, post an `operator.paused`",
    "event comment (see `.straylight/README.md`), or disable all automation via",
    "`.straylight/automation-policy.json` → `enabled: false`.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Plan validation (closed schema + structural rules)
// ---------------------------------------------------------------------------

function err(code, detail) {
  return { code, detail };
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Defense-in-depth guard over the CONSTRUCTED request path. The plan can
// never express a path, but the constructed one must still match the fixed
// repository prefix and carry no URL/traversal/query/whitespace bytes —
// so a validator regression upstream can only fail CLOSED here.
export function checkConstructedPath(path) {
  if (typeof path !== "string" || path.length === 0 || path.length > 512) {
    return err("constructed-path-invalid", "path empty or oversized");
  }
  if (!/^repos\/0xHoneyJar\/loa-straylight\/(issues|labels)(\/|$)/.test(path)) {
    return err("constructed-path-invalid", `path escapes the fixed repository prefix: ${path.slice(0, 120)}`);
  }
  if (/:\/\//.test(path) || path.includes("..") || path.includes("?") || path.includes("#") ||
      /[\s]/.test(path) || /[\x00-\x1f\x7f]/.test(path)) {
    return err("constructed-path-invalid", "path carries URL/traversal/query/whitespace/control bytes");
  }
  return null;
}

// `authority` is REQUIRED on every plan (Codex H-02): the exact commit the
// plan was produced at plus the canonical digest of the accepted policy that
// governed the planning. There is no optional and no legacy plan shape — a
// plan with no authority binding cannot be executed, because the executor
// would have nothing to re-establish at write time. See lib/write-authority.mjs.
const PLAN_KEYS = Object.freeze(["schema", "plan_id", "nonce", "repository", "authority", "operations"]);

// Validate the parsed plan document against the closed schema, the fixed
// repository/nonce expectations, and every structural rule. Returns
//   { ok: true, operations: [{ ...op, method, path, body_required, fatal,
//                              state_advancing }...] }
// or { ok: false, errors: [{code, detail}...] } — fail closed on the
// FIRST structural ambiguity class encountered per field, all collected.
export function validatePlan(plan, { repository, nonce } = {}) {
  const errors = [];
  if (!isPlainObject(plan)) {
    return { ok: false, errors: [err("plan-not-object", "plan document is not a JSON object")] };
  }
  for (const key of Object.keys(plan)) {
    if (!PLAN_KEYS.includes(key)) errors.push(err("unknown-field", `plan.${key}`));
  }
  if (plan.schema !== WRITE_PLAN_SCHEMA) {
    errors.push(err("schema-mismatch", `plan.schema must be ${WRITE_PLAN_SCHEMA}`));
  }
  // Fixed owner/repository: compiled-in allowlist AND the workflow argv.
  if (typeof plan.repository !== "string" || !REPOSITORY_ALLOWLIST.includes(plan.repository)) {
    errors.push(err("repository-not-allowlisted", `plan.repository ${JSON.stringify(plan.repository ?? null)} is not in the compiled allowlist`));
  } else if (plan.repository !== repository) {
    errors.push(err("repository-argv-mismatch", "plan.repository does not equal the workflow-supplied --repository"));
  }
  if (typeof nonce !== "string" || !NONCE_RE.test(nonce)) {
    errors.push(err("nonce-invalid", "--nonce must be two positive decimal integers separated by '-'"));
  }
  if (typeof plan.nonce !== "string" || !NONCE_RE.test(plan.nonce)) {
    errors.push(err("nonce-invalid", "plan.nonce must be two positive decimal integers separated by '-'"));
  } else if (plan.nonce !== nonce) {
    errors.push(err("nonce-mismatch", "plan.nonce does not equal --nonce (stale-plan replay refused)"));
  }
  if (typeof plan.plan_id !== "string" || !/^[A-Za-z0-9-]{1,120}$/.test(plan.plan_id) ||
      (typeof plan.nonce === "string" && !plan.plan_id.startsWith(`${plan.nonce}-`))) {
    errors.push(err("plan-id-invalid", "plan_id must be '<nonce>-<planner-name>[-<stage>]'"));
  }
  // The write-authority binding, structurally. Whether it is STILL current is
  // a question only the executor can ask, and it asks GitHub, not the plan.
  for (const e of authorityShapeErrors(plan.authority)) errors.push(err(e.code, e.detail));
  if (!Array.isArray(plan.operations)) {
    errors.push(err("operations-invalid", "operations is not an array"));
    return { ok: false, errors };
  }
  if (plan.operations.length > MAX_OPERATIONS) {
    errors.push(err("operations-invalid", `more than ${MAX_OPERATIONS} operations`));
  }

  const prepared = [];
  const seenOpIds = new Set();
  // issue → index of its state-advancing operation (terminal barrier).
  const stateAdvancingAt = new Map();

  plan.operations.forEach((op, i) => {
    const where = `operations[${i}]`;
    if (!isPlainObject(op)) {
      errors.push(err("operation-invalid", `${where}: not an object`));
      return;
    }
    if (typeof op.op_id !== "string" || !OP_ID_RE.test(op.op_id)) {
      errors.push(err("operation-invalid", `${where}: op_id must match ^op-[0-9]+$`));
      return;
    }
    if (seenOpIds.has(op.op_id)) {
      errors.push(err("duplicate-op-id", `${where}: op_id ${op.op_id} reused`));
      return;
    }
    seenOpIds.add(op.op_id);
    const spec = OPERATION_KINDS[op.kind];
    if (spec === undefined) {
      errors.push(err("kind-not-allowlisted", `${where}: kind ${JSON.stringify(op.kind ?? null)}`));
      return;
    }
    // CLOSED per-kind field set: anything outside {op_id, kind} ∪ spec.fields
    // is unknown — including best_effort, method, path, url, repository.
    for (const key of Object.keys(op)) {
      if (key === "op_id" || key === "kind") continue;
      if (!spec.fields.includes(key)) {
        errors.push(err("unknown-field", `${where}.${key} is not expressible on kind ${op.kind}`));
      }
    }

    // Field-by-field validation BEFORE any argument construction.
    if (spec.fields.includes("issue_number")) {
      if (!Number.isInteger(op.issue_number) || op.issue_number < 1 || op.issue_number > MAX_ISSUE_NUMBER) {
        errors.push(err("operation-invalid", `${where}: issue_number must be a positive integer within GitHub bounds`));
      }
    }
    if (spec.fields.includes("lane_id") && op.kind !== "remove-derived-cp-paused-after-warning") {
      if (typeof op.lane_id !== "string" || !LANE_ID_RE.test(op.lane_id)) {
        errors.push(err("operation-invalid", `${where}: lane_id malformed`));
      }
    }
    if (spec.fields.includes("dedupe_key")) {
      if (typeof op.dedupe_key !== "string" || !DEDUPE_KEY_RE.test(op.dedupe_key)) {
        errors.push(err("operation-invalid", `${where}: dedupe_key must be 1-200 printable non-space bytes`));
      }
    }
    if (spec.fields.includes("label")) {
      if (!isDerivedLabel(op.label)) {
        errors.push(err("operation-invalid", `${where}: label is not in the derived vocabulary`));
      } else if (op.kind === "remove-derived-label" && (op.label === "cp-paused" || op.label === "cp-lane")) {
        // cp-paused removal MUST go through the warning-gated kind; cp-lane
        // is the discovery-convenience label bootstrap creates, never removed.
        errors.push(err("cp-paused-requires-warning-gate", `${where}: remove-derived-label may not name ${op.label}`));
      }
    }
    if (spec.body) {
      if (typeof op.body_file !== "string" || !BODY_FILE_RE.test(op.body_file)) {
        errors.push(err("operation-invalid", `${where}: body_file must be a single safe path component`));
      }
      if (typeof op.body_sha256 !== "string" || !DIGEST_RE.test(op.body_sha256)) {
        errors.push(err("operation-invalid", `${where}: body_sha256 must be sha256:<64 hex>`));
      }
    } else {
      // Bodyless kinds (DELETE) must carry NO body binding — but those keys
      // are already outside spec.fields, so the unknown-field check above
      // has refused them. Nothing further here.
    }

    if (op.kind === "remove-derived-cp-paused-after-warning") {
      if (typeof op.lane_id !== "string" || !LANE_ID_RE.test(op.lane_id)) {
        errors.push(err("operation-invalid", `${where}: lane_id malformed`));
      }
      const hasRef = op.warning_op_id !== undefined;
      const hasProof = op.warning_proof !== undefined;
      if (hasRef === hasProof) {
        errors.push(err("warning-gate-invalid", `${where}: exactly one of warning_op_id / warning_proof is required`));
      } else if (hasRef) {
        if (typeof op.warning_op_id !== "string" || !OP_ID_RE.test(op.warning_op_id)) {
          errors.push(err("warning-gate-invalid", `${where}: warning_op_id malformed`));
        } else {
          // The referenced warning must exist EARLIER in the plan, be the
          // right kind, and address the same issue and lane — a validated
          // structural field, never array order alone.
          const wIndex = plan.operations.findIndex(
            (o, j) => j < i && isPlainObject(o) && o.op_id === op.warning_op_id,
          );
          const w = wIndex >= 0 ? plan.operations[wIndex] : null;
          if (w === null) {
            errors.push(err("warning-gate-invalid", `${where}: warning_op_id ${op.warning_op_id} does not name an earlier operation`));
          } else {
            if (w.kind !== "post-cp-paused-warning") {
              errors.push(err("warning-gate-invalid", `${where}: ${op.warning_op_id} is not a post-cp-paused-warning`));
            }
            if (w.issue_number !== op.issue_number) {
              errors.push(err("warning-gate-invalid", `${where}: warning addresses issue #${w.issue_number}, removal addresses #${op.issue_number}`));
            }
            if (w.lane_id !== op.lane_id) {
              errors.push(err("warning-gate-invalid", `${where}: warning lane ${w.lane_id} != removal lane ${op.lane_id}`));
            }
          }
        }
      } else {
        const p = op.warning_proof;
        if (!isPlainObject(p) ||
            Object.keys(p).some((k) => k !== "comment_id" && k !== "dedupe_key") ||
            !Number.isInteger(p.comment_id) || p.comment_id < 1 ||
            typeof p.dedupe_key !== "string") {
          errors.push(err("warning-gate-invalid", `${where}: warning_proof must be {comment_id, dedupe_key}`));
        } else if (typeof op.lane_id === "string" && Number.isInteger(op.issue_number) &&
                   p.dedupe_key !== warningDedupeKey(op.lane_id, op.issue_number)) {
          // The proof must carry the CANONICAL warning identity for this
          // lane/issue — its truth was established by the planner from the
          // same-execution collection (N3); its shape is checked here.
          errors.push(err("warning-gate-invalid", `${where}: warning_proof dedupe_key is not the canonical identity for this lane/issue`));
        }
      }
    }

    // Terminal barrier (§10): at most one state-advancing operation per
    // issue, and NOTHING addressing that issue after it.
    if (Number.isInteger(op.issue_number)) {
      if (stateAdvancingAt.has(op.issue_number)) {
        if (spec.state_advancing) {
          errors.push(err("duplicate-state-advancing-event", `${where}: second state-advancing operation for issue #${op.issue_number}`));
        } else {
          errors.push(err("terminal-barrier-violation", `${where}: operation addresses issue #${op.issue_number} after its state-advancing event`));
        }
      } else if (spec.state_advancing) {
        stateAdvancingAt.set(op.issue_number, i);
      }
    }

    // Fixed per-kind request construction + defense-in-depth path guard.
    // Constructed HERE (validation phase) so a malformed path can never be
    // discovered mid-execution.
    let path = null;
    try {
      path = spec.path(op, plan.repository);
    } catch {
      path = null;
    }
    if (typeof path !== "string") {
      errors.push(err("constructed-path-invalid", `${where}: request path could not be constructed`));
    } else {
      const badPath = checkConstructedPath(path);
      if (badPath !== null) errors.push({ ...badPath, detail: `${where}: ${badPath.detail}` });
    }

    prepared.push({
      ...op,
      method: spec.method,
      path,
      body_required: spec.body,
      fatal: spec.fatal,
      state_advancing: spec.state_advancing,
    });
  });

  if (errors.length > 0) return { ok: false, errors };
  // The validated authority travels with the validated operations so the
  // executor never re-reads it out of the raw plan document.
  return { ok: true, authority: plan.authority, operations: prepared };
}

// ---------------------------------------------------------------------------
// Endpoint body-content binding (per kind, over the EXACT retained bytes)
// ---------------------------------------------------------------------------

// True when `text` contains a line that is EXACTLY `dedupe:<key>` — the
// canonical full-line identity (C4). Substring containment is never used.
export function hasFullLineDedupe(text, key) {
  if (typeof text !== "string" || typeof key !== "string") return false;
  const needle = `dedupe:${key}`;
  return text.split("\n").some((line) => line === needle);
}

const COMMENT_MARKER_BY_KIND = Object.freeze({
  "post-state-advancing-event": MARKERS.event,
  "post-reducer-result": MARKERS.reducerResult,
  "post-watchdog-finding": MARKERS.watchdogResult,
  "post-merge-guard-result": MARKERS.mergeGuardResult,
});

// Validate the strict-parsed content of a body file against its
// operation's kind-specific endpoint schema. `text` is the exact decoded
// byte content the executor retained. Returns { ok: true } or
// { ok: false, errors: [{code, detail}] } — every failure fails closed.
export function validateOperationBody(op, text) {
  const errors = [];
  const parsed = parseStrict(text);
  if (!parsed.ok) {
    return { ok: false, errors: [err("body-endpoint-schema", `body is not strict JSON: ${parsed.reason}`)] };
  }
  const doc = parsed.value;
  if (!isPlainObject(doc)) {
    return { ok: false, errors: [err("body-endpoint-schema", "body document is not an object")] };
  }

  const commentMarker = COMMENT_MARKER_BY_KIND[op.kind];
  if (commentMarker !== undefined || op.kind === "post-cp-paused-warning") {
    // Endpoint: POST .../issues/{n}/comments — body is EXACTLY {body: string}.
    for (const key of Object.keys(doc)) {
      if (key !== "body") errors.push(err("body-endpoint-schema", `comment body carries unknown field ${key}`));
    }
    if (typeof doc.body !== "string") {
      errors.push(err("body-endpoint-schema", "comment body.body is not a string"));
      return { ok: false, errors };
    }
    if (Buffer.byteLength(doc.body, "utf8") > MAX_COMMENT_BODY_BYTES) {
      errors.push(err("body-endpoint-schema", `comment body exceeds ${MAX_COMMENT_BODY_BYTES} bytes`));
    }
    if (!hasFullLineDedupe(doc.body, op.dedupe_key)) {
      errors.push(err("body-endpoint-schema", "comment body lacks the exact full-line dedupe identity"));
    }
    if (op.kind === "post-cp-paused-warning") {
      // The POSITIVE canonical marker first (round 11 J4): a warning
      // body must identify itself as the warning. Byte-exact template
      // equality below already implies it — the explicit check is
      // defense in depth against a template regression that drops it.
      if (!hasMarker(doc.body, MARKERS.cpPausedWarning)) {
        errors.push(err("body-endpoint-schema", `cp-paused warning body lacks the canonical ${MARKERS.cpPausedWarning} marker`));
      }
      // The fixed state-neutral template, byte-exact: exactness is what
      // makes the already-present proof and the dedupe identity sound.
      if (doc.body !== warningBodyFor(op.lane_id, op.issue_number)) {
        errors.push(err("body-endpoint-schema", "cp-paused warning body does not equal the fixed state-neutral template"));
      }
      if (op.dedupe_key !== warningDedupeKey(op.lane_id, op.issue_number)) {
        errors.push(err("body-endpoint-schema", "cp-paused warning dedupe_key is not the canonical identity"));
      }
    } else {
      const extracted = extractPayload(doc.body, commentMarker);
      if (!extracted.ok) {
        errors.push(err("body-endpoint-schema", `comment body does not carry exactly one extractable ${commentMarker} payload (${extracted.reason})`));
      } else if (op.kind === "post-state-advancing-event") {
        const ev = validateEvent(extracted.value);
        if (!ev.ok) {
          errors.push(err("body-endpoint-schema", `embedded event invalid: ${ev.errors.join("; ")}`));
        } else {
          if (extracted.value.lane_id !== op.lane_id) {
            errors.push(err("body-endpoint-schema", `embedded event lane_id ${extracted.value.lane_id} != operation lane_id ${op.lane_id}`));
          }
          // The executor posts exclusively as the workflow identity; a
          // state-advancing event claiming anything else could never bind.
          if (extracted.value.actor_role !== "system" || extracted.value.github_actor !== "github-actions[bot]") {
            errors.push(err("body-endpoint-schema", "state-advancing event must be a system event by github-actions[bot]"));
          }
        }
      }
      // For every OTHER marker kind: no other straylight event payload may
      // ride along — a result comment that also parses as an event would be
      // a state-advancing write smuggled through a non-advancing kind.
      if (op.kind !== "post-state-advancing-event" && hasMarker(doc.body, MARKERS.event)) {
        errors.push(err("body-endpoint-schema", `${op.kind} body carries a straylight:event:v1 marker`));
      }
    }
    return errors.length === 0 ? { ok: true } : { ok: false, errors };
  }

  if (op.kind === "add-derived-label") {
    // Endpoint: POST .../issues/{n}/labels — EXACTLY {labels: [<op.label>]}.
    for (const key of Object.keys(doc)) {
      if (key !== "labels") errors.push(err("body-endpoint-schema", `label body carries unknown field ${key}`));
    }
    if (!Array.isArray(doc.labels) || doc.labels.length !== 1 || doc.labels[0] !== op.label) {
      errors.push(err("body-endpoint-schema", "label body must be exactly the operation's single validated label"));
    }
    return errors.length === 0 ? { ok: true } : { ok: false, errors };
  }

  if (op.kind === "create-lane-issue") {
    // Endpoint: POST .../issues — EXACTLY {title, body, labels: ["cp-lane"]}.
    for (const key of Object.keys(doc)) {
      if (!["title", "body", "labels"].includes(key)) {
        errors.push(err("body-endpoint-schema", `lane-issue body carries unknown field ${key}`));
      }
    }
    if (typeof doc.title !== "string" || !LANE_ISSUE_TITLE_RE.test(doc.title)) {
      errors.push(err("body-endpoint-schema", "lane-issue title does not match the fixed template"));
    }
    if (!Array.isArray(doc.labels) || doc.labels.length !== 1 || doc.labels[0] !== "cp-lane") {
      errors.push(err("body-endpoint-schema", 'lane-issue labels must be exactly ["cp-lane"]'));
    }
    if (typeof doc.body !== "string" || Buffer.byteLength(doc.body, "utf8") > MAX_COMMENT_BODY_BYTES) {
      errors.push(err("body-endpoint-schema", "lane-issue body missing or oversized"));
      return { ok: false, errors };
    }
    const genesis = extractPayload(doc.body, MARKERS.lane);
    if (!genesis.ok) {
      errors.push(err("body-endpoint-schema", `lane-issue body does not carry exactly one extractable genesis (${genesis.reason})`));
    } else {
      const lv = validateLane(genesis.value);
      if (!lv.ok) {
        errors.push(err("body-endpoint-schema", `embedded genesis invalid: ${lv.errors.join("; ")}`));
      } else if (genesis.value.lane_id !== op.lane_id) {
        errors.push(err("body-endpoint-schema", `embedded genesis lane_id ${genesis.value.lane_id} != operation lane_id ${op.lane_id}`));
      }
    }
    return errors.length === 0 ? { ok: true } : { ok: false, errors };
  }

  if (op.kind === "create-label-definition") {
    // Endpoint: POST .../labels — EXACTLY {name: "cp-lane", color, description}.
    for (const key of Object.keys(doc)) {
      if (!["name", "color", "description"].includes(key)) {
        errors.push(err("body-endpoint-schema", `label-definition body carries unknown field ${key}`));
      }
    }
    if (doc.name !== "cp-lane") {
      errors.push(err("body-endpoint-schema", 'label-definition name must be "cp-lane"'));
    }
    if (typeof doc.color !== "string" || !LABEL_COLOR_RE.test(doc.color)) {
      errors.push(err("body-endpoint-schema", "label-definition color must be 6 lowercase hex"));
    }
    if (typeof doc.description !== "string" || doc.description.length === 0 || doc.description.length > 200) {
      errors.push(err("body-endpoint-schema", "label-definition description must be a 1-200 char string"));
    }
    return errors.length === 0 ? { ok: true } : { ok: false, errors };
  }

  return { ok: false, errors: [err("body-endpoint-schema", `kind ${op.kind} does not accept a body`)] };
}
