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
// VALIDATION/PREFLIGHT — everything before the first MUTATION attempt:
//   securely open + strict-validate the complete plan; securely open,
//   read-once, hash, parse, and RETAIN every body; validate every
//   operation, dependency, target, ordering, and fixed endpoint contract
//   (lib/write-plan.mjs); then re-establish CURRENT write authority from
//   GitHub read-only (below). Any failure here exits 2. Exit 2 therefore
//   GUARANTEES: execution never began and ZERO GitHub WRITE attempts
//   occurred. It does NOT claim no `gh` process ran — the authority probes
//   are `gh api` GETs, and stating otherwise would be false.
//
// EXECUTION — begins immediately before the first mutation is attempted
//   (not before the authority probes that precede it). After execution
//   begins, every non-warning failure exits 4:
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
//   projections that reconverge on the next run (C9). Authority refusals
//   are NEVER warning-only: a label is still a durable GitHub write.
//
// WRITE-TIME AUTHORITY REVALIDATION (Codex H-02):
//
//   A run can be planned before a freeze is merged and reach this executor
//   after. The plan's own claim that it was valid earlier proves nothing
//   about now, and this executor used to load no policy at all — so a
//   committed `enabled: false` was a PLANNING fence, never a durable-write
//   fence. It is now both.
//
//   Immediately before EVERY mutation — not once per plan — this executor
//   re-establishes current committed authority from GitHub, READ-ONLY, and
//   independently of the local checkout (the checkout is exactly what the
//   stale run already believes):
//
//     1. GET repos/{repo}                → default branch is still `main`
//     2. GET .../git/ref/heads/main      → the exact current commit
//     3. GET .../contents/<policy>?ref=<that commit>
//                                        → the policy AS COMMITTED there,
//                                          strict-parsed and accepted with
//                                          the FULL accepted-epoch lock
//                                          (lib/policy-source.mjs)
//
//   Then lib/write-authority.mjs requires, in order: current main SHA ===
//   plan.authority.source_main_sha; an independently computed canonical
//   digest of that committed policy === plan.authority.policy_digest; and
//   `policy.enabled === true` (literal boolean). Any mismatch refuses
//   BEFORE the mutation — exit 2 with zero writes if no mutation has yet
//   been attempted, exit 4 mid-plan.
//
//   The reads use the SAME launcher posture as a mutation (shell: false,
//   fixed argv, minimal env) with argv ["api", <path>] — no -X, so gh's
//   default GET is the only method these calls can perform. Paths are
//   constructed by lib/write-authority.mjs; this executor expresses no
//   path, host, or URL of its own, exactly as plans express none.
//
//   RESIDUAL TOCTOU — stated plainly. GitHub offers no compare-and-write on
//   issue comments or labels: there is no `If-Match` and no conditional
//   POST. So a window remains between read 3 returning and the mutation
//   landing, bounded by two API round trips. This is NOT an atomic
//   compare-and-write, and nothing here should be read as claiming one. A
//   freeze merged INSIDE that window can still be followed by one durable
//   write from an in-flight operation. What is now impossible is the H-02
//   case: a plan continuing to write minutes or hours after a freeze became
//   the committed authority. Reducing the window further would require an
//   API primitive GitHub does not offer; the frozen-write quiescence gate
//   (scripts/verify-frozen-quiescence.mjs) exists precisely because a
//   freeze plus this check is still not a proof that nothing is in flight.
//
// SECURITY POSTURE:
//   - the plan file is CONTAINED: its parent directory must realpath to
//     exactly the realpath'd --request-root and its name must be a single
//     safe path component — a plan outside the request root (or reached
//     through a symlinked directory) is refused before it is opened;
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
// 2 = preflight refusal, INCLUDING an authority refusal before the first
// mutation; ZERO writes were issued (read-only probes may have run).
// 4 = execution began and a non-warning failure occurred — including an
// authority refusal mid-plan; earlier operations may have executed; the
// job fails loudly.

import { openSync, fstatSync, readFileSync, closeSync, realpathSync, constants } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { parseStrict } from "../lib/strict-json.mjs";
import { validatePlan, validateOperationBody } from "../lib/write-plan.mjs";
import { acceptCommittedPolicyText } from "../lib/policy-source.mjs";
import {
  authorityStillCurrent, readRepositoryDefaultBranch, readMainRefSha, decodeCommittedFile,
  repositoryMetadataReadPath, mainRefReadPath, committedPolicyReadPath,
  COMMITTED_POLICY_REPO_PATH,
} from "../lib/write-authority.mjs";

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

// 1. The plan file itself. CONTAINMENT FIRST: the plan must live DIRECTLY
//    under the realpath'd request root — its parent directory must
//    realpath-resolve to exactly the request root (a symlinked
//    intermediate directory collapses here and mismatches), and its name
//    must be a single safe path component (no separators, no traversal).
//    A plan anywhere else — however valid its content — is a validation
//    refusal: exit 2, zero gh launches. Then O_NOFOLLOW (a symlink at the
//    final component fails), regular file, single read, strict parse
//    (duplicate keys rejected), closed-schema validation.
const planName = basename(planPath);
if (!/^[A-Za-z0-9._-]+$/.test(planName)) {
  refuse("plan-outside-request-root", "plan file name is not a single safe path component");
}
let realPlanDir;
try {
  realPlanDir = realpathSync(dirname(planPath));
} catch (e) {
  refuse("plan-outside-request-root", `plan directory unresolvable: ${String(e?.message ?? e)}`);
}
if (realPlanDir !== realRoot) {
  refuse("plan-outside-request-root", "plan file does not live directly under --request-root");
}
const planBytes = readOnceNoFollow(join(realRoot, planName), "plan");
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

// Minimal child environment: exactly PATH, HOME, GH_TOKEN. Shared by the
// read-only authority probes and by every mutation.
const childEnv = {};
for (const key of ["PATH", "HOME", "GH_TOKEN"]) {
  if (typeof process.env[key] === "string") childEnv[key] = process.env[key];
}

const results = [];
const succeededOps = new Set();

// Flipped immediately before the first MUTATION is attempted. It is the sole
// discriminator between the two phases: everything before it is preflight
// (exit 2 permitted, zero writes issued), everything after is execution (no
// condition may exit 2).
let executionBegan = false;

function failExecution(refusal, detail) {
  emit({ ok: false, phase: "execution", refusal, detail, results }, 4);
}

// =============================================================================
// WRITE-TIME AUTHORITY REVALIDATION — read-only; still preflight until the
// first mutation is attempted. See the header for the full contract.
// =============================================================================

// ONE read-only GET. Fixed argv ["api", <path>] — with no -X, gh's default
// method is the only method this function can perform, so a bug here cannot
// become a mutation. Same posture as a write: shell false, minimal env, no
// command-string construction, no interpolation.
function ghGet(path) {
  const res = spawnSync("gh", ["api", path], { shell: false, env: childEnv, encoding: "utf8" });
  if (res.error) {
    return { ok: false, detail: `gh launch failed: ${String(res.error?.message ?? res.error)}` };
  }
  if (typeof res.status !== "number") {
    return { ok: false, detail: `gh terminated without an exit status (signal ${res.signal ?? "unknown"})` };
  }
  if (res.status !== 0) {
    return { ok: false, detail: `gh exited ${res.status}: ${String(res.stderr ?? "").slice(0, 300)}` };
  }
  const parsed = parseStrict(String(res.stdout ?? ""));
  if (!parsed.ok) return { ok: false, detail: `response is not strict JSON: ${parsed.reason}` };
  return { ok: true, value: parsed.value };
}

// Establish what the committed authority IS RIGHT NOW, from GitHub alone. The
// local checkout is deliberately not consulted: it is the stale run's own
// belief, so agreeing with it would prove nothing. Every step fails closed —
// a response the protocol cannot read is not evidence that authority holds.
function establishCurrentAuthority() {
  const metaPath = repositoryMetadataReadPath(repository);
  if (!metaPath.ok) return { ok: false, refusal: metaPath.reason, detail: metaPath.detail };
  const meta = ghGet(metaPath.path);
  if (!meta.ok) return { ok: false, refusal: "authority-read-failed", detail: `repository metadata: ${meta.detail}` };
  const branch = readRepositoryDefaultBranch(meta.value, { repository });
  if (!branch.ok) return { ok: false, refusal: branch.reason, detail: branch.detail };

  const refPath = mainRefReadPath(repository);
  if (!refPath.ok) return { ok: false, refusal: refPath.reason, detail: refPath.detail };
  const ref = ghGet(refPath.path);
  if (!ref.ok) return { ok: false, refusal: "authority-read-failed", detail: `main ref: ${ref.detail}` };
  const head = readMainRefSha(ref.value);
  if (!head.ok) return { ok: false, refusal: head.reason, detail: head.detail };

  // The policy AS COMMITTED AT THAT EXACT COMMIT — not the branch tip, not the
  // working tree. Accepted through the protocol's one accepting loader, so the
  // full accepted-epoch digest lock applies to these bytes too.
  const policyPath = committedPolicyReadPath(repository, head.sha);
  if (!policyPath.ok) return { ok: false, refusal: policyPath.reason, detail: policyPath.detail };
  const contents = ghGet(policyPath.path);
  if (!contents.ok) return { ok: false, refusal: "authority-read-failed", detail: `committed policy: ${contents.detail}` };
  const file = decodeCommittedFile(contents.value, { expected_path: COMMITTED_POLICY_REPO_PATH });
  if (!file.ok) return { ok: false, refusal: file.reason, detail: file.detail };
  const accepted = acceptCommittedPolicyText(file.text, { source: `${COMMITTED_POLICY_REPO_PATH}@${head.sha}` });
  if (!accepted.ok) return { ok: false, refusal: accepted.refusal, detail: accepted.detail };

  return { ok: true, main_sha: head.sha, policy: accepted.value };
}

// The gate EVERY mutation passes through. Routed to the phase this executor is
// actually in: a refusal before the first mutation is a preflight refusal with
// zero writes issued (exit 2); once a mutation has been attempted, nothing may
// exit 2 (exit 4), because earlier operations may already have landed.
function requireCurrentAuthority(op) {
  const deny = (refusal, detail) => {
    if (executionBegan) failExecution(refusal, `${op.op_id}: ${detail}`);
    refuse(refusal, `${op.op_id}: ${detail}`);
  };
  const current = establishCurrentAuthority();
  if (!current.ok) deny(current.refusal, current.detail);
  const still = authorityStillCurrent({
    authority: validated.authority,
    current_main_sha: current.main_sha,
    current_policy: current.policy,
  });
  if (!still.ok) deny(still.refusal, still.detail);
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

    // WRITE-TIME AUTHORITY (H-02) — the last thing that happens before the
    // mutation. Re-established per operation and never cached across them: a
    // freeze merged between operation 1 and operation 2 must stop operation 2,
    // and "we checked at the top of the plan" is exactly the reasoning H-02
    // was filed against.
    requireCurrentAuthority(op);

    // EXECUTION BEGINS HERE. Authority has just been proven current and the
    // next syscall is the durable write itself, so from this line on nothing
    // may exit 2 — an earlier operation may already have landed.
    executionBegan = true;
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
  // An unexpected executor exception. If the first mutation was never
  // attempted this is still preflight — no durable write exists, so it must
  // refuse as such rather than report a phase it never entered. Once execution
  // has begun, exit 4 stands: earlier operations may already have landed.
  if (!executionBegan) {
    refuse("preflight-exception", String(e?.message ?? e));
  }
  failExecution("execution-exception", String(e?.message ?? e));
}

emit({ ok: true, phase: "execution", results }, 0);
