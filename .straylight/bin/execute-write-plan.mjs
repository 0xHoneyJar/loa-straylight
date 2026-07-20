#!/usr/bin/env node
// Straylight Control Plane v1 — the single shared write executor.
//
// The ONLY production code path that performs GitHub writes. Every
// workflow write phase makes exactly one invocation per plan:
//
//   node .straylight/bin/execute-write-plan.mjs \
//     --plan <request-root>/plan.json \
//     --request-root <request-root> \
//     --repository "$GITHUB_REPOSITORY" \
//     --nonce "<GITHUB_RUN_ID>-<GITHUB_RUN_ATTEMPT>"
//
// TWO PHASES, exactly (the exit-code contract is authoritative):
//
// VALIDATION/PREFLIGHT — everything before the first request attempt:
//   securely open + strict-validate the complete plan; securely open,
//   read-once, hash, parse, and RETAIN every body; validate every
//   operation, dependency, target, ordering, and fixed endpoint contract
//   (lib/write-plan.mjs). Any failure here exits 2. Exit 2 therefore
//   GUARANTEES: execution never began, no `gh` process was launched, zero
//   GitHub write attempts occurred.
//
// EXECUTION — begins immediately before processing the first validated
//   operation. After execution begins, every non-warning failure exits 4:
//   failure to launch `gh` (spawn error, ENOENT), stdin/transport failure,
//   a non-zero `gh` result for a fatal operation, and any unexpected
//   executor exception during operation execution — INCLUDING a launch
//   failure on the very first operation, and INCLUDING a launch failure
//   for a warning-only label operation (no trustworthy execution result
//   exists, so warning semantics cannot apply). Exit 4 means execution
//   began: earlier operations may or may not have completed, so recovery
//   is ALWAYS a fresh workflow run — fresh evidence, fresh lane-target
//   proof, fresh reconstruction, exact dedupe recognition of landed
//   operations, and a new plan containing only still-missing work. No
//   execution-phase condition may exit 2.
//
//   A `gh` API non-zero RESULT remains warning-only exclusively for the
//   hard-coded derived-label add/remove kinds (write-plan.mjs registry) —
//   logged, execution continues, and the run still exits 0: labels are
//   projections that reconverge on the next run (C9).
//
// SECURITY POSTURE:
//   - the plan file and every body file are opened O_RDONLY|O_NOFOLLOW
//     (a symlink at the final component fails), fstat-checked as regular
//     files, read EXACTLY ONCE from the descriptor, hashed, strict-parsed,
//     and the exact bytes RETAINED — nothing rereads any path after
//     validation, so a post-validation swap cannot reach a request;
//   - body files are single safe path components joined under the
//     realpath'd --request-root; no separators or traversal can appear;
//   - every request is spawnSync("gh", argv, { shell: false, input:
//     <retained bytes>, env: {PATH, HOME, GH_TOKEN} }) with a FIXED argv:
//     ["api", "-X", METHOD, PATH, "--input", "-"] for body-bearing kinds,
//     ["api", "-X", "DELETE", PATH] for bodyless kinds. No shell, no eval,
//     no command-string construction, no interpolation, no process
//     substitution, no second file read;
//   - the plan can express NO method/path/URL/host/endpoint and NO
//     best_effort: the kind registry constructs requests, and the
//     constructed path is guard-checked again here (defense in depth);
//   - the literal name "gh" resolves via PATH inside spawnSync (shell:
//     false — no shell is involved in resolution). Tests prepend a fixture
//     directory with a mock `gh` to PATH; no env var or argv can override
//     the binary name or path.
//
// Exit codes: 0 = plan fully executed (fatal ops all succeeded; any
// warning-only API failures logged and reconverging next run).
// 2 = validation refusal; ZERO writes were issued. 4 = execution began
// and a non-warning failure occurred; earlier operations may have
// executed; the job fails loudly.

import { openSync, fstatSync, readFileSync, closeSync, realpathSync, constants } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { parseStrict } from "../lib/strict-json.mjs";
import { validatePlan, validateOperationBody } from "../lib/write-plan.mjs";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

function emit(result, code) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(code);
}

function refuse(code, detail) {
  emit({ ok: false, phase: "validation", refusal: code, detail }, 2);
}

// Open without following a final-component symlink, require a regular
// file, read the complete content exactly once from the descriptor, and
// return the retained buffer. Any failure is a validation refusal.
function readOnceNoFollow(path, label) {
  let fd;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (e) {
    if (e && e.code === "ELOOP") {
      refuse("body-not-regular-file", `${label}: symlink refused (O_NOFOLLOW)`);
    }
    refuse("body-unreadable", `${label}: ${String(e?.message ?? e)}`);
  }
  try {
    if (!fstatSync(fd).isFile()) {
      refuse("body-not-regular-file", `${label}: not a regular file`);
    }
    return readFileSync(fd);
  } catch (e) {
    refuse("body-unreadable", `${label}: ${String(e?.message ?? e)}`);
  } finally {
    try { closeSync(fd); } catch { /* fd already invalidated */ }
  }
}

// =============================================================================
// VALIDATION / PREFLIGHT PHASE — any failure exits 2; zero gh launches.
// =============================================================================

const planPath = arg("--plan");
const requestRoot = arg("--request-root");
const repository = arg("--repository");
const nonce = arg("--nonce");
if (planPath === null || requestRoot === null || repository === null || nonce === null) {
  refuse("usage", "required: --plan <file> --request-root <dir> --repository <owner/repo> --nonce <run-id>-<attempt>");
}

let realRoot;
try {
  realRoot = realpathSync(requestRoot);
} catch (e) {
  refuse("request-root-invalid", String(e?.message ?? e));
}

// 1. The plan file itself: O_NOFOLLOW, regular file, single read, strict
//    parse (duplicate keys rejected), closed-schema validation.
const planBytes = readOnceNoFollow(planPath, "plan");
const planParsed = parseStrict(planBytes.toString("utf8"));
if (!planParsed.ok) {
  refuse("plan-malformed", `strict JSON parse failed: ${planParsed.reason}`);
}
const validated = validatePlan(planParsed.value, { repository, nonce });
if (!validated.ok) {
  const first = validated.errors[0];
  emit({ ok: false, phase: "validation", refusal: first.code, detail: first.detail, errors: validated.errors }, 2);
}
const operations = validated.operations;

// 2. Every body file: name containment (validated as a single safe
//    component), symlink-refusing open under the realpath'd root, regular
//    file, single read, digest over the EXACT bytes, strict parse +
//    endpoint contract over the SAME bytes, buffer retained.
for (const op of operations) {
  if (!op.body_required) continue;
  const fullPath = join(realRoot, op.body_file);
  const bytes = readOnceNoFollow(fullPath, `${op.op_id} body ${op.body_file}`);
  const digest = "sha256:" + createHash("sha256").update(bytes).digest("hex");
  if (digest !== op.body_sha256) {
    refuse("body-digest-mismatch", `${op.op_id}: body ${op.body_file} hashes ${digest}, plan claims ${op.body_sha256}`);
  }
  const bodyCheck = validateOperationBody(op, bytes.toString("utf8"));
  if (!bodyCheck.ok) {
    const first = bodyCheck.errors[0];
    emit({ ok: false, phase: "validation", refusal: first.code, detail: `${op.op_id}: ${first.detail}`, errors: bodyCheck.errors }, 2);
  }
  op.retained_bytes = bytes; // the exact validated bytes; the path is never reopened
}

// =============================================================================
// EXECUTION PHASE — begins now. No condition below may exit 2.
// =============================================================================

// Minimal child environment: exactly PATH, HOME, GH_TOKEN.
const childEnv = {};
for (const key of ["PATH", "HOME", "GH_TOKEN"]) {
  if (typeof process.env[key] === "string") childEnv[key] = process.env[key];
}

const results = [];
const succeededOps = new Set();

function failExecution(refusal, detail) {
  emit({ ok: false, phase: "execution", refusal, detail, results }, 4);
}

try {
  for (const op of operations) {
    // §9 execution-time gate: the removal runs ONLY if its referenced
    // warning actually succeeded. The warning is fatal by kind, so a
    // failed warning has already exited 4 before reaching here — this
    // check is defense in depth, not the primary barrier.
    if (op.kind === "remove-derived-cp-paused-after-warning" && typeof op.warning_op_id === "string" &&
        !succeededOps.has(op.warning_op_id)) {
      failExecution("warning-gate-unsatisfied", `${op.op_id}: warning ${op.warning_op_id} did not succeed`);
    }

    const argv = op.body_required
      ? ["api", "-X", op.method, op.path, "--input", "-"]
      : ["api", "-X", op.method, op.path];
    const res = spawnSync("gh", argv, {
      shell: false,
      input: op.body_required ? op.retained_bytes : undefined,
      env: childEnv,
      encoding: "utf8",
    });

    // Inability to launch gh — or any transport failure — is ALWAYS exit
    // 4, including for a warning-only label operation: no trustworthy
    // execution result exists, so warning semantics cannot apply.
    if (res.error) {
      failExecution("gh-launch-failed", `${op.op_id}: ${String(res.error?.message ?? res.error)}`);
    }
    if (typeof res.status !== "number") {
      failExecution("gh-launch-failed", `${op.op_id}: gh terminated without an exit status (signal ${res.signal ?? "unknown"})`);
    }

    if (res.status === 0) {
      succeededOps.add(op.op_id);
      results.push({ op_id: op.op_id, kind: op.kind, status: "ok" });
      continue;
    }

    // Non-zero gh API RESULT: warning-only exclusively for the hard-coded
    // derived-label kinds; fatal for everything else.
    if (op.fatal) {
      results.push({ op_id: op.op_id, kind: op.kind, status: "fatal-failed", gh_status: res.status });
      failExecution("fatal-operation-failed", `${op.op_id} (${op.kind}): gh exited ${res.status}: ${String(res.stderr ?? "").slice(0, 400)}`);
    }
    results.push({ op_id: op.op_id, kind: op.kind, status: "warning-failed", gh_status: res.status });
    process.stderr.write(`::warning::${op.op_id} (${op.kind}) failed (gh exit ${res.status}); derived labels reconverge on the next run\n`);
  }
} catch (e) {
  // Any unexpected executor exception during operation execution.
  failExecution("execution-exception", String(e?.message ?? e));
}

emit({ ok: true, phase: "execution", results }, 0);
