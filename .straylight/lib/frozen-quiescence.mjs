// Straylight Control Plane v2 — FROZEN-WRITE QUIESCENCE (pure).
//
// WHY THIS FILE EXISTS (Codex H-02, second half)
//
// The executor's write-time authority check stops a stale plan from writing
// (lib/write-authority.mjs). That is the runtime guarantee. But the CUTOVER
// procedure needs a different, operator-facing fact:
//
//   "The freeze is committed, and there is no workflow run still in flight that
//    could attempt a durable write."
//
// Merging `enabled: false` does not establish that. A run that started seconds
// earlier is still executing, still holds a plan authored under `enabled: true`,
// and — before H-02 — could still have written. With H-02 in place such a run
// now REFUSES rather than writes, which is the safety property; but a frontier
// captured while it is still running was captured against a control plane that
// was still moving, and "the executor would have refused" is not the same
// statement as "nothing was in flight". The frontier's whole value is that it
// says where history ENDED. So the capture is gated on quiescence, and the
// evidence of quiescence travels WITH the frontier.
//
// WHAT COUNTS AS WRITE-CAPABLE
//
// Exactly one code path performs durable GitHub mutations: bin/execute-write-plan.mjs.
// So the closed set of write-capable workflows is derived MECHANICALLY, by
// scanning the repository's own workflow files for that entry point, rather than
// maintained as a hand-written list that drifts the first time a workflow is
// added. A hand-written list is the failure mode this module refuses to have.
//
// CONSERVATIVE STATE READING. Only the literal Actions status "completed" is
// terminal. Every other value — queued, in_progress, waiting, requested,
// pending, and anything GitHub adds tomorrow — counts as ACTIVE. An unknown
// state is not evidence of quiescence.
//
// WHAT THIS CANNOT PROVE. Not a transactional snapshot. GitHub can create a run
// the instant after the last page is read (a comment on any lane still triggers
// the reducer while frozen), so the CLI performs two complete independent scans
// and the cutover re-verifies after the capture — the same two-read stability
// fence used elsewhere in the protocol, not a claim of atomicity. Nor does this
// module cancel anything: cancelling a run mid-plan is itself a hazard, and the
// operator decides.
//
// PURE: no network, no clock, no filesystem. The CLI
// (scripts/verify-frozen-quiescence.mjs) fetches; every decision is here.

import { parsePageStream } from "./evidence.mjs";
import { parseIsoInstant, REPO_RE } from "./validate.mjs";

export const QUIESCENCE_SCHEMA = "straylight.frozen-write-quiescence.v1";

// The full immutable commit SHA of the frozen revision. Deliberately declared
// here rather than imported from write-authority.mjs: this module and the frontier
// validator that leans on it must stay importable-without-side-effects and free
// of any filesystem-touching dependency (write-authority reads the one small file
// a workflow materializes from its own checkout). A test pins this source string
// to write-authority's MAIN_SHA_RE, so the two cannot drift silently.
export const FROZEN_MAIN_SHA_RE = /^[0-9a-f]{40}$/;

// The ONE durable-write code path. Both the workflow scan and its tests key on
// this constant, so the set cannot be widened by editing a string in one place.
export const WRITE_EXECUTOR_ENTRYPOINT = "execute-write-plan.mjs";

// The ONLY terminal Actions run status.
export const TERMINAL_RUN_STATUS = "completed";

export const QUIESCENCE_KEYS = Object.freeze([
  "schema",
  "repository",
  "frozen_main_sha",
  "checked_at",
  "write_capable_workflows",
  "active_write_runs",
]);

// The evidence fields a durable frontier carries so that it names the frozen
// revision it was captured under and the quiescence that licensed it. Shared
// with durable-frontier.mjs so the two documents cannot disagree about what
// quiescence evidence is.
export const FRONTIER_QUIESCENCE_KEYS = Object.freeze([
  "frozen_main_sha",
  "quiescence_checked_at",
  "write_capable_workflows",
  "active_write_runs",
]);

const ACTIVE_RUN_KEYS = Object.freeze(["workflow", "run_id", "status", "created_at"]);

// A workflow file path as GitHub reports it and as the repository stores it.
const WORKFLOW_PATH_RE = /^\.github\/workflows\/[A-Za-z0-9._-]+\.ya?ml$/;

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function bad(reason, detail) {
  return { ok: false, reason, detail };
}

// ---------------------------------------------------------------------------
// Deriving the closed write-capable set from the repository's own workflows
// ---------------------------------------------------------------------------

// Blank YAML comments so a workflow that merely DESCRIBES the write executor in
// prose is not mistaken for one that invokes it — and, in the other direction,
// so a deleted invocation cannot keep its workflow in the set on the strength of
// the comment that used to explain it. Same discipline as the workflow-contract
// tests' executable() helper: the bytes that RUN are the bytes that count.
export function executableYaml(text) {
  if (typeof text !== "string") return "";
  return text
    .split("\n")
    .map((line) => {
      let inSingle = false;
      let inDouble = false;
      for (let i = 0; i < line.length; i += 1) {
        const c = line[i];
        if (c === "'" && !inDouble) inSingle = !inSingle;
        else if (c === '"' && !inSingle) inDouble = !inDouble;
        else if (c === "#" && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1]))) {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join("\n");
}

/**
 * Derive the CLOSED SET of write-capable workflows from workflow file contents.
 *
 * `files` is [{ path, text }] for every file under .github/workflows. Returns
 * { ok: true, workflows } with workflows sorted by path, or a refusal.
 *
 * Refuses when the scan finds NOTHING: a repository whose reducer, watchdog,
 * merge guard, and bootstrap all invoke the write executor cannot legitimately
 * yield an empty set, so an empty result means the scan itself is broken — and a
 * broken scan would report perfect quiescence over zero workflows.
 *
 * Refuses when a workflow names the executor only in prose: that is either an
 * invocation that was deleted without its comment or a comment hiding one, and
 * either way the set is no longer mechanically derivable.
 */
export function writeCapableWorkflows(files) {
  if (!Array.isArray(files)) return bad("workflow-scan-failed", "files: not an array");
  const workflows = [];
  const proseOnly = [];
  for (const file of files) {
    if (!isPlainObject(file) || typeof file.path !== "string" || typeof file.text !== "string") {
      return bad("workflow-scan-failed", "each file must be { path: string, text: string }");
    }
    if (!WORKFLOW_PATH_RE.test(file.path)) {
      return bad("workflow-scan-failed", `${file.path}: not a .github/workflows/*.yml path`);
    }
    const executes = executableYaml(file.text).includes(WRITE_EXECUTOR_ENTRYPOINT);
    if (executes) {
      workflows.push(file.path);
      continue;
    }
    if (file.text.includes(WRITE_EXECUTOR_ENTRYPOINT)) proseOnly.push(file.path);
  }
  if (proseOnly.length > 0) {
    return bad(
      "workflow-scan-ambiguous",
      `${proseOnly.join(", ")}: names ${WRITE_EXECUTOR_ENTRYPOINT} only in comments — either an invocation was ` +
        "removed without its comment or a comment is standing in for one; the write-capable set cannot be " +
        "derived mechanically while that is true",
    );
  }
  if (workflows.length === 0) {
    return bad(
      "workflow-scan-empty",
      `no workflow invokes ${WRITE_EXECUTOR_ENTRYPOINT}; refusing to report quiescence over an empty set — ` +
        "an empty derivation means the scan is broken, not that nothing can write",
    );
  }
  workflows.sort();
  return { ok: true, workflows };
}

// ---------------------------------------------------------------------------
// Reading Actions run pages
// ---------------------------------------------------------------------------

/** Only the literal terminal status is terminal; everything else is active. */
export function runIsActive(status) {
  return status !== TERMINAL_RUN_STATUS;
}

/**
 * Parse `gh api --paginate repos/<repo>/actions/workflows/<file>/runs` output and
 * classify every run.
 *
 * Binds the response to the workflow that was asked about: a page whose runs
 * describe some other workflow path is refused rather than read, so a mistyped
 * or redirected request cannot report another workflow's quiescence as this
 * one's.
 *
 * DUPLICATE RUN IDS ARE A REFUSAL, NOT A DEDUPLICATION. Pagination that repeats
 * a page — a shifting cursor, a retried request, a proxy replaying a response —
 * makes the collected count exceed the number of runs actually seen. Counting
 * each ENTRY would then let a repeated completed run pay for an omitted active
 * one: two copies of run #1 satisfy `total_count: 2` while the queued run #2 is
 * never read, and the scan reports quiescence over a history it never saw. So
 * the scan tracks the ids it has already accepted, refuses the moment one comes
 * back, and counts UNIQUE ids toward completeness. Silently deduplicating would
 * fix the arithmetic and keep the omission.
 *
 * Returns { ok: true, scanned, active } where `scanned` is the number of unique
 * validated run ids and active is [{ workflow, run_id, status, created_at }]
 * sorted by run id, or a refusal.
 */
export function parseWorkflowRunPages(text, { workflow_path }) {
  if (typeof workflow_path !== "string" || !WORKFLOW_PATH_RE.test(workflow_path)) {
    return bad("run-pages-unusable", `workflow_path ${JSON.stringify(workflow_path)} is not a workflow file path`);
  }
  const stream = parsePageStream(text);
  if (!stream.ok) return bad("run-pages-unusable", `${workflow_path}: ${stream.reason} (${stream.detail ?? ""})`);

  const active = [];
  const seen = new Map();
  let minTotal = null;
  for (const [pageIndex, page] of stream.pages.entries()) {
    const at = `${workflow_path} page ${pageIndex + 1}`;
    if (!isPlainObject(page)) return bad("run-pages-unusable", `${at}: not a JSON object`);
    if (!Number.isInteger(page.total_count) || page.total_count < 0) {
      return bad("run-pages-unusable", `${at}: total_count ${JSON.stringify(page.total_count)} is not a count`);
    }
    if (minTotal === null || page.total_count < minTotal) minTotal = page.total_count;
    if (!Array.isArray(page.workflow_runs)) {
      return bad("run-pages-unusable", `${at}: workflow_runs is not an array`);
    }
    for (const run of page.workflow_runs) {
      if (!isPlainObject(run)) return bad("run-pages-unusable", `${at}: a run entry is not an object`);
      if (!Number.isInteger(run.id) || run.id < 1) {
        return bad("run-pages-unusable", `${at}: run id ${JSON.stringify(run.id)} is not a positive integer`);
      }
      if (run.path !== workflow_path) {
        return bad(
          "run-pages-unusable",
          `${at}: run ${run.id} reports path ${JSON.stringify(run.path)} — the response describes a different workflow`,
        );
      }
      if (typeof run.status !== "string" || run.status.length === 0) {
        return bad("run-pages-unusable", `${at}: run ${run.id} has no status string`);
      }
      if (parseIsoInstant(run.created_at) === null) {
        return bad("run-pages-unusable", `${at}: run ${run.id} created_at ${JSON.stringify(run.created_at)} is not a UTC instant`);
      }
      const previous = seen.get(run.id);
      if (previous !== undefined) {
        const disagrees = previous.status !== run.status || previous.created_at !== run.created_at;
        return bad(
          "run-pages-duplicate",
          `${at}: run ${run.id} was already collected from ${previous.at}` +
            (disagrees
              ? ` and the two entries disagree (status ${JSON.stringify(previous.status)}/${JSON.stringify(run.status)}, ` +
                `created_at ${JSON.stringify(previous.created_at)}/${JSON.stringify(run.created_at)}) — the run's state is ambiguous`
              : "") +
            " — repeated pages make the collected count exceed the runs actually seen, which would let a duplicated " +
            "completed run pay for an omitted active one; refusing rather than deduplicating a scan whose pagination " +
            "is not trustworthy",
        );
      }
      seen.set(run.id, { at, status: run.status, created_at: run.created_at });
      if (runIsActive(run.status)) {
        active.push({
          workflow: workflow_path,
          run_id: run.id,
          status: run.status,
          created_at: run.created_at,
        });
      }
    }
  }
  // Pages LOST during pagination would hide active runs, so a collection
  // smaller than the smallest total the API itself reported is refused. The
  // comparison uses UNIQUE ids, so a repeated page cannot inflate the count past
  // the bound (and in fact refuses above, before reaching here). Runs CREATED
  // during pagination are a different problem and are not solved here: the CLI
  // scans twice and the cutover re-verifies (see the header).
  const scanned = seen.size;
  if (minTotal !== null && scanned < minTotal) {
    return bad(
      "run-pages-incomplete",
      `${workflow_path}: collected ${scanned} unique run(s) but the API reported at least ${minTotal} — pagination ` +
        "lost pages; refusing rather than reporting quiescence over a partial history",
    );
  }
  active.sort((a, b) => a.run_id - b.run_id);
  return { ok: true, scanned, active };
}

// ---------------------------------------------------------------------------
// The quiescence document
// ---------------------------------------------------------------------------

/**
 * Shape + admissibility rules for the four quiescence evidence fields, shared by
 * the standalone quiescence document and by the durable frontier that embeds it.
 * `errors` are pushed with the caller's prefix so the messages read naturally in
 * either document. Returns error strings; [] means admissible.
 */
export function quiescenceEvidenceErrors(doc, { at, keys }) {
  const errors = [];
  const field = (name) => `${at}.${name}`;
  const frozen = doc[keys.frozen_main_sha];
  if (typeof frozen !== "string" || !FROZEN_MAIN_SHA_RE.test(frozen)) {
    errors.push(
      `${field(keys.frozen_main_sha)}: ${JSON.stringify(frozen)} — expected the full 40-hex commit SHA of the ` +
        "frozen main the evidence was gathered against (never a branch name)",
    );
  }
  if (parseIsoInstant(doc[keys.checked_at]) === null) {
    errors.push(
      `${field(keys.checked_at)}: ${JSON.stringify(doc[keys.checked_at])} — expected a UTC instant ` +
        "YYYY-MM-DDTHH:MM:SS[.mmm]Z recorded after the quiescence scan completed",
    );
  }
  const wf = doc[keys.write_capable_workflows];
  if (!Array.isArray(wf) || wf.length === 0) {
    errors.push(
      `${field(keys.write_capable_workflows)}: expected a non-empty array of the write-capable workflow paths ` +
        `derived from the repository (files invoking ${WRITE_EXECUTOR_ENTRYPOINT})`,
    );
  } else {
    let previous = null;
    wf.forEach((path, i) => {
      if (typeof path !== "string" || !WORKFLOW_PATH_RE.test(path)) {
        errors.push(`${field(keys.write_capable_workflows)}[${i}]: ${JSON.stringify(path)} — expected .github/workflows/<file>.yml`);
        return;
      }
      // Deterministic ordering: two captures of the same repository must
      // produce byte-identical evidence, so the list is sorted and duplicate-free.
      if (previous !== null && path <= previous) {
        errors.push(
          `${field(keys.write_capable_workflows)}[${i}]: ${JSON.stringify(path)} does not sort strictly after ` +
            `${JSON.stringify(previous)} — the derived set is recorded sorted and duplicate-free`,
        );
      }
      previous = path;
    });
  }
  const runs = doc[keys.active_write_runs];
  if (!Array.isArray(runs)) {
    errors.push(`${field(keys.active_write_runs)}: not an array`);
  } else {
    let previousId = null;
    runs.forEach((run, i) => {
      const rat = `${field(keys.active_write_runs)}[${i}]`;
      if (!isPlainObject(run)) {
        errors.push(`${rat}: not an object`);
        return;
      }
      for (const key of Object.keys(run)) {
        if (!ACTIVE_RUN_KEYS.includes(key)) errors.push(`${rat}.${key}: unknown key — the run shape is closed`);
      }
      for (const key of ACTIVE_RUN_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(run, key)) errors.push(`${rat}.${key}: missing`);
      }
      if (typeof run.workflow !== "string" || !WORKFLOW_PATH_RE.test(run.workflow)) {
        errors.push(`${rat}.workflow: ${JSON.stringify(run.workflow)} — expected .github/workflows/<file>.yml`);
      }
      if (!Number.isInteger(run.run_id) || run.run_id < 1) {
        errors.push(`${rat}.run_id: ${JSON.stringify(run.run_id)} — expected a positive integer run id`);
      } else {
        if (previousId !== null && run.run_id <= previousId) {
          errors.push(`${rat}.run_id: ${run.run_id} does not sort strictly after ${previousId} — runs are recorded by ascending id`);
        }
        previousId = run.run_id;
      }
      if (typeof run.status !== "string" || run.status.length === 0) {
        errors.push(`${rat}.status: ${JSON.stringify(run.status)} — expected the Actions status string`);
      } else if (!runIsActive(run.status)) {
        errors.push(
          `${rat}.status: ${JSON.stringify(run.status)} is the terminal status — a completed run is not an ` +
            "active write-capable run and must not be recorded as one",
        );
      }
      if (parseIsoInstant(run.created_at) === null) {
        errors.push(`${rat}.created_at: ${JSON.stringify(run.created_at)} — expected a UTC instant`);
      }
    });
    // THE ADMISSIBILITY RULE. Non-empty is a valid observation and a refusal to
    // proceed, never a document to append against.
    if (runs.length > 0) {
      errors.push(
        `${field(keys.active_write_runs)}: ${runs.length} write-capable run(s) were still in flight ` +
          `(${runs.map((r) => `${isPlainObject(r) ? r.workflow : "?"}#${isPlainObject(r) ? r.run_id : "?"}`).join(", ")}) — ` +
          "the control plane was not quiescent, so this evidence cannot authorize an append. Wait for the runs to " +
          "reach the terminal status and gather the evidence again; do not cancel them.",
      );
    }
  }
  return errors;
}

const STANDALONE_KEYS = Object.freeze({
  frozen_main_sha: "frozen_main_sha",
  checked_at: "checked_at",
  write_capable_workflows: "write_capable_workflows",
  active_write_runs: "active_write_runs",
});

/** The key names a durable frontier uses for the same four facts. */
export const FRONTIER_EVIDENCE_KEY_MAP = Object.freeze({
  frozen_main_sha: "frozen_main_sha",
  checked_at: "quiescence_checked_at",
  write_capable_workflows: "write_capable_workflows",
  active_write_runs: "active_write_runs",
});

/**
 * Validate a standalone quiescence document (the CLI's output, and the
 * `--quiescence` input the frontier capture consumes).
 * Returns { ok: true, value } or { ok: false, errors }.
 */
export function validateFrozenQuiescence(doc) {
  if (!isPlainObject(doc)) return { ok: false, errors: ["quiescence: not an object"] };
  const errors = [];
  for (const key of Object.keys(doc)) {
    if (!QUIESCENCE_KEYS.includes(key)) errors.push(`quiescence.${key}: unknown key — the shape is closed`);
  }
  for (const key of QUIESCENCE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(doc, key)) errors.push(`quiescence.${key}: missing`);
  }
  if (doc.schema !== QUIESCENCE_SCHEMA) {
    errors.push(`quiescence.schema: ${JSON.stringify(doc.schema)} — expected ${QUIESCENCE_SCHEMA}`);
  }
  if (typeof doc.repository !== "string" || !REPO_RE.test(doc.repository)) {
    errors.push(`quiescence.repository: ${JSON.stringify(doc.repository)} — expected "owner/name"`);
  }
  errors.push(...quiescenceEvidenceErrors(doc, { at: "quiescence", keys: STANDALONE_KEYS }));
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      repository: doc.repository,
      frozen_main_sha: doc.frozen_main_sha,
      checked_at: doc.checked_at,
      write_capable_workflows: doc.write_capable_workflows.slice(),
      active_write_runs: doc.active_write_runs.slice(),
    },
  };
}

/**
 * Assemble the quiescence document. Self-validating: a caller cannot emit a
 * document this module would refuse, so a non-quiescent observation surfaces as
 * a refusal at build time rather than as a file that looks authoritative.
 */
export function buildFrozenQuiescence({
  repository,
  frozen_main_sha,
  checked_at,
  write_capable_workflows,
  active_write_runs,
} = {}) {
  const doc = {
    schema: QUIESCENCE_SCHEMA,
    repository,
    frozen_main_sha,
    checked_at,
    write_capable_workflows: Array.isArray(write_capable_workflows)
      ? write_capable_workflows.slice().sort()
      : write_capable_workflows,
    active_write_runs: Array.isArray(active_write_runs)
      ? active_write_runs.slice().sort((a, b) => (isPlainObject(a) && isPlainObject(b) ? a.run_id - b.run_id : 0))
      : active_write_runs,
  };
  const verdict = validateFrozenQuiescence(doc);
  if (!verdict.ok) return { ok: false, errors: verdict.errors, document: doc };
  return { ok: true, document: doc, value: verdict.value };
}
