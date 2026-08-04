#!/usr/bin/env node
// Phase 50A — THE FIXED PROOF EXECUTOR (R3 proof closure v2, patch cycle 3).
//
// This program is the entire proof schedule. The workflow
// `.github/workflows/phase-50a-postgres-conformance.yml` is a CANONICAL
// WRAPPER whose complete raw bytes are fixed by the coordinator task packet;
// its single `run:` step invokes this file and nothing else.
//
// ── WHY THIS SHAPE ──────────────────────────────────────────────────────
//
// Three successive attempts to prove the workflow's trigger and exact-head
// posture by RECOGNIZING its content failed audit: a manifest mirrored into a
// `paths` filter, then a structural parser with positional provenance, then a
// direct byte/line checker. Each was defeated the same way — an unsupported
// or inert form the recognizer did not model (a quoted key, a BOM, a CRLF
// line, an inline comment restating a deleted safeguard, a block scalar
// hiding a command) left the proof green while the property was gone.
//
// The abstraction itself was the defect, so it is REPLACED, not repaired.
// Nothing here recognizes workflow CONTENT. This executor knows exactly one
// fact about the wrapper: whether its RAW BYTES hash to the single digest
// pinned below as a literal committed constant. Any byte difference — a
// flipped quote, an appended comment, a changed line ending, a BOM, one added
// space, a re-indent, a wholesale replacement by a different well-formed
// workflow — fails that comparison identically, because raw-byte identity has
// no unsupported forms to model.
//
// Consequently this file contains no markup parser, no markup-shaped line
// scanner, no shell parser, no command-word splitter, no comment stripping or
// blanking, no positional or line/column provenance, no regex or substring
// recognition of workflow content for authorization, no dynamic command or
// configuration loading, no dynamic code evaluation of any form, and no
// generalized workflow interpretation.
//
// `tests/phase-50a/proof-executor-envelope.test.ts` asserts that absence over
// this file's RAW source text, with NO comment stripping. That direction is
// deliberate: for an absence check, a mention inside a comment can only make
// the test fail on clean code — it can never hide a real construct. So the
// prose here deliberately avoids spelling the forbidden constructs.
//
// ── THIS FILE CANNOT AUTHORIZE ITSELF ───────────────────────────────────
//
// EXPECTED_WRAPPER_DIGEST is the digest the OPERATOR-AUTHORIZED coordinator
// packet fixed. It is written here as a literal. It is NEVER computed from the
// file being checked, read from an environment variable, a config file, or a
// CLI argument — an executor that hashed whatever wrapper it found would
// authorize any wrapper at all. This file's own bytes are in turn pinned and
// compared independently by `tests/phase-50a/fixed-proof-executor.test.ts`,
// `tests/phase-50a/proof-executor-envelope.test.ts`, and by the auditor
// against the packet.
//
// ── CREDENTIAL NARROWING (v2) ───────────────────────────────────────────
//
// The sequence-46 audit recorded that every schedule child inherited the
// registry credential, because the wrapper put it in the step environment and
// nothing narrowed it afterwards. It is now narrowed HERE, where the schedule
// actually lives:
//
//   * the wrapper names NO registry variable at all. It hands the ephemeral
//     job token to this program under the INGRESS name PHASE_50A_NPM_TOKEN;
//   * this program captures that value ONCE, into a local binding, during the
//     identity gate — a missing or blank ingress is its own refusal, raised
//     BEFORE the identity probe, so it launches nothing whatsoever;
//   * ONE constructor, `childEnv`, builds the environment for EVERY child the
//     production seam launches. It REMOVES both the ingress name and the
//     registry name unconditionally, then re-adds the registry name from the
//     captured value for the install entry ALONE;
//   * the identity probe and schedule entries 2-12 therefore hold NEITHER
//     name, and neither do their own descendants, since a child inherits only
//     what its parent was given;
//   * the install argv is `npm ci --ignore-scripts`, so the repository's
//     `prepare` lifecycle (which runs `build`) cannot execute inside the one
//     authenticated process tree. The explicit build runs later, as its own
//     schedule entry, in a child holding neither name.
//
// No token value is ever placed in a receipt, in the identity banner, in the
// published envelope, or in a refusal detail. Refusals name the VARIABLE.
//
// ── ORDER OF OPERATIONS (load-bearing) ──────────────────────────────────
//
//   1. Hash the wrapper's raw bytes; require the pinned digest.
//   2. Require PHASE_50A_EXPECTED_HEAD_SHA to be exactly 40 lowercase hex.
//   3. Require PHASE_50A_NPM_TOKEN to be present and non-blank; capture it.
//   4. Read `git rev-parse HEAD` — the ONLY process launch permitted before
//      the gate completes, recorded as an identity probe, never as a schedule
//      command.
//   5. Require observed HEAD to equal the expected SHA exactly.
//   6. ONLY THEN run the closed schedule, serially, each entry bounded by a
//      timeout, stopping at the first nonzero exit, signal, timeout, or spawn
//      failure.
//
// A failure at any of 1-5 exits nonzero having launched ZERO schedule
// commands. There is no fallback, no shortened schedule, and no refusal path
// that exits zero.
//
// Node 22 builtins only — no package dependency, because this program runs
// BEFORE `npm ci`. `npm ci` is the first entry of its own schedule. The
// module's own location comes from `import.meta.dirname` /
// `import.meta.filename`, so no path-conversion builtin is needed.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Fixed constants
// ---------------------------------------------------------------------------

const HERE = import.meta.dirname;
export const REPO_ROOT = resolve(HERE, "..", "..");

/** The wrapper this executor is invoked by, and the only file it inspects. */
export const WRAPPER_PATH = ".github/workflows/phase-50a-postgres-conformance.yml";

/**
 * The operator-authorized wrapper fingerprint, fixed by the coordinator task
 * packet (comment 5178032683, packet digest
 * sha256:86b0f7383241a850fb7dc79dde597f28db3c9bee7df24775fee7f8e498093d18).
 *
 * LITERAL AND COMMITTED. Never derived at runtime from any input. Changing the
 * wrapper REQUIRES a new operator-authorized packet that fixes new bytes and a
 * new digest — that reviewed step is the whole point of this constant.
 */
export const EXPECTED_WRAPPER_DIGEST =
  "sha256:6fb6b2bd51b645a1e4c5884ca4a74b10a9d24da2ad2127bf76237dd90f117852";

/** Environment variable carrying the exact audited head SHA. */
export const EXPECTED_HEAD_ENV = "PHASE_50A_EXPECTED_HEAD_SHA";

/**
 * INGRESS name. The wrapper hands the ephemeral job token to this program
 * under this name, and NO child process ever receives it: `childEnv` deletes
 * it from every child environment it builds.
 */
export const NPM_TOKEN_INGRESS_ENV = "PHASE_50A_NPM_TOKEN";

/**
 * The registry-authentication name npm itself reads. It appears in NO workflow
 * file. `childEnv` deletes it from every child environment and re-adds it for
 * the install entry alone.
 */
export const NPM_TOKEN_CHILD_ENV = "NODE_AUTH_TOKEN";

/** Exactly 40 lowercase hex characters. Anchored; no leading/trailing slack. */
const EXACT_SHA_RE = /^[0-9a-f]{40}$/;

/**
 * The label of the ONE schedule entry permitted to receive registry
 * authentication. Compared against `entry.label`, so the permission is bound
 * to a named schedule entry rather than to a position or an argv guess.
 */
export const AUTHENTICATED_ENTRY_LABEL = "npm-ci";

/** The fixed identity probe. A literal argv array, like every other launch. */
export const IDENTITY_PROBE = Object.freeze({
  label: "git-rev-parse-head",
  file: "git",
  args: Object.freeze(["rev-parse", "HEAD"]),
  timeout_ms: 60_000,
});

/**
 * THE CLOSED COMMAND SCHEDULE.
 *
 * Literal DATA in this source file: a fixed sequence of { label, file, args }
 * entries, each an executable plus a fixed argv ARRAY. It is never loaded,
 * generated, templated, filtered, reordered, or extended at runtime, and
 * nothing outside this file can add an entry or change an argument.
 *
 * It covers exactly the substantive proof commands the previous workflow ran
 * as separate workflow steps, in the same order — the correction moves them
 * out of interpretable markup into this fixed table without losing proof
 * coverage.
 *
 * Entry 1 carries `--ignore-scripts`. That flag is LOAD-BEARING, not tidiness:
 * it is what keeps the repository's `prepare` lifecycle — and therefore the
 * whole build — from running inside the one child that can see registry
 * authentication. The build still happens, later, as its own entry, in a child
 * that holds neither token name.
 */
export const SCHEDULE = Object.freeze([
  {
    label: "npm-ci",
    file: "npm",
    args: Object.freeze(["ci", "--ignore-scripts"]),
    timeout_ms: 900_000,
  },
  {
    label: "confirm-source-instance",
    file: "docker",
    args: Object.freeze([
      "exec",
      "straylight-phase-50a-source",
      "psql",
      "-tA",
      "-U",
      "straylight_proof",
      "-d",
      "straylight_source",
      "-c",
      "SELECT system_identifier FROM pg_control_system()",
    ]),
    timeout_ms: 120_000,
  },
  {
    label: "confirm-replacement-instance",
    file: "docker",
    args: Object.freeze([
      "exec",
      "straylight-phase-50a-replacement",
      "psql",
      "-tA",
      "-U",
      "straylight_proof",
      "-d",
      "straylight_replacement",
      "-c",
      "SELECT system_identifier FROM pg_control_system()",
    ]),
    timeout_ms: 120_000,
  },
  {
    label: "build",
    file: "npm",
    args: Object.freeze(["run", "build"]),
    timeout_ms: 600_000,
  },
  {
    label: "typecheck",
    file: "npm",
    args: Object.freeze(["run", "typecheck"]),
    timeout_ms: 600_000,
  },
  {
    label: "repository-tests",
    file: "npm",
    args: Object.freeze(["test"]),
    timeout_ms: 1_800_000,
  },
  {
    label: "control-plane-validate",
    file: "npm",
    args: Object.freeze(["run", "control-plane:validate"]),
    timeout_ms: 300_000,
  },
  {
    label: "control-plane-tests",
    file: "npm",
    args: Object.freeze(["run", "control-plane:test"]),
    timeout_ms: 900_000,
  },
  {
    label: "phase-50a-postgres-suites",
    file: "npm",
    args: Object.freeze(["run", "phase-50a:test"]),
    timeout_ms: 900_000,
  },
  {
    label: "phase-50a-two-host-proof",
    file: "npm",
    args: Object.freeze(["run", "phase-50a:proof"]),
    timeout_ms: 900_000,
  },
  {
    label: "phase-50a-verify-artifact",
    file: "npm",
    args: Object.freeze(["run", "phase-50a:verify-artifact"]),
    timeout_ms: 600_000,
  },
  {
    label: "no-whitespace-damage",
    file: "git",
    args: Object.freeze(["diff", "--check"]),
    timeout_ms: 120_000,
  },
]);

/** Refusal codes. A refusal is always one of these, and always exits nonzero. */
export const REFUSAL = Object.freeze({
  wrapperUnreadable: "wrapper-unreadable",
  wrapperFingerprintMismatch: "wrapper-fingerprint-mismatch",
  expectedShaMalformed: "expected-head-sha-malformed",
  npmTokenIngressMissing: "npm-token-ingress-missing",
  headUnreadable: "observed-head-unreadable",
  headMismatch: "head-identity-mismatch",
  commandFailed: "command-failed",
  commandSignalled: "command-signalled",
  commandTimedOut: "command-timed-out",
  commandSpawnFailed: "command-spawn-failed",
});

// ---------------------------------------------------------------------------
// The ONE child-environment constructor
// ---------------------------------------------------------------------------

/**
 * Build the environment for ONE child process. THE ONLY place any child
 * environment is constructed — the production seam calls this for the identity
 * probe and for all twelve schedule entries, so there is no second path a
 * credential could travel by.
 *
 * Two removals, then one narrow addition:
 *
 *   * the INGRESS name is deleted unconditionally, so no child — and no
 *     descendant of a child — can read the value the wrapper handed in;
 *   * the REGISTRY name is deleted unconditionally, so an ambient value in the
 *     runner's own environment cannot leak into any child either;
 *   * the REGISTRY name is then set, from the captured value, if and only if
 *     this entry's label is the single authenticated label.
 *
 * `token` is the captured ingress value. For the probe and entries 2-12 the
 * result holds neither name at all — asserted by the tests over the ACTUAL
 * options object this constructor's caller passes to the spawn function.
 */
export function childEnv(entry, token, baseEnv) {
  const env = { ...baseEnv };
  delete env[NPM_TOKEN_INGRESS_ENV];
  delete env[NPM_TOKEN_CHILD_ENV];
  if (entry.label === AUTHENTICATED_ENTRY_LABEL) {
    env[NPM_TOKEN_CHILD_ENV] = token;
  }
  return env;
}

// ---------------------------------------------------------------------------
// Process execution seam
// ---------------------------------------------------------------------------

/**
 * The ONE way this program launches anything. shell:false is explicit, the
 * command is an executable plus an argv ARRAY, and there is no string-command
 * form anywhere — so no argument is ever interpreted by a shell. The child
 * environment comes from `childEnv` and from nowhere else.
 *
 * `spawn` is injectable so the tests can capture the ACTUAL options object
 * this function builds and hands to `spawnSync` — the environment they assert
 * over is the one production really uses, not a stub's report of itself.
 * Production passes nothing and gets `spawnSync`.
 */
export function realRun(entry, { token, baseEnv = process.env, spawn = spawnSync } = {}) {
  const result = spawn(entry.file, [...entry.args], {
    cwd: REPO_ROOT,
    shell: false,
    env: childEnv(entry, token, baseEnv),
    // The identity probe's output IS the datum, so it is captured. Schedule
    // commands stream straight to the job log, where a human reads them.
    stdio: entry.capture === true ? ["ignore", "pipe", "inherit"] : "inherit",
    timeout: entry.timeout_ms,
    encoding: "utf8",
  });
  // Node signals a timeout kill as error.code ETIMEDOUT *with* signal SIGTERM.
  // Distinguishing the two by CODE — not by the presence of a signal — is what
  // keeps "timed out" from being reported as an ordinary signal death, and
  // keeps a genuine spawn failure (ENOENT, EACCES) from being reported as a
  // timeout.
  const code = result.error?.code ?? null;
  return {
    status: result.status,
    signal: result.signal,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    timed_out: code === "ETIMEDOUT",
    error: result.error && code !== "ETIMEDOUT" ? String(code ?? result.error.message) : null,
  };
}

/**
 * Classify one launch outcome into exactly one verdict.
 *
 * The four failure modes stay DISTINCT and are checked in precedence order:
 * a spawn failure is not a timeout, a timeout is not an ordinary signal death,
 * and a signal death is not a nonzero exit. Collapsing any pair would let a
 * stall or a missing binary be reported as a generic failure — or, worse, let
 * a `status === null` outcome fall through the `status !== 0` test as success.
 */
function classify(outcome) {
  const spawnFailed = outcome.error !== null && outcome.error !== undefined;
  const timedOut = !spawnFailed && outcome.timed_out === true;
  const signalled =
    !spawnFailed && !timedOut && outcome.signal !== null && outcome.signal !== undefined;
  // `status !== 0` alone would treat a null status as a failure of unknown
  // kind; by this point status is a real exit code or the run is already
  // classified above.
  const failed = !spawnFailed && !timedOut && !signalled && outcome.status !== 0;
  return { spawnFailed, timedOut, signalled, failed };
}

// ---------------------------------------------------------------------------
// Receipts
// ---------------------------------------------------------------------------

/**
 * One receipt per ATTEMPTED command, in attempt order.
 *
 * DETERMINISTIC BY CONSTRUCTION: label, file, exact argv, status, signal,
 * timed_out, ordinal. No timestamp, no duration, no hostname, no absolute
 * path, no environment value — so two runs of the same schedule produce
 * byte-identical receipt text, and no credential can reach the log through a
 * receipt.
 */
function receiptOf(ordinal, entry, outcome, verdict) {
  return {
    ordinal,
    label: entry.label,
    file: entry.file,
    argv: [...entry.args],
    status: outcome.status === undefined ? null : outcome.status,
    signal: outcome.signal === undefined ? null : outcome.signal,
    timed_out: verdict.timedOut === true,
    spawn_failed: verdict.spawnFailed === true,
    outcome: verdict.spawnFailed
      ? "spawn-failed"
      : verdict.timedOut
        ? "timed-out"
        : verdict.signalled
          ? "signalled"
          : verdict.failed
            ? "failed"
            : "ok",
  };
}

export function renderReceipts(receipts) {
  return receipts
    .map(
      (r) =>
        `  [${r.ordinal}] ${r.label} :: ${r.file} ${JSON.stringify(r.argv)} ` +
        `status=${r.status} signal=${r.signal} timed_out=${r.timed_out} ` +
        `spawn_failed=${r.spawn_failed} outcome=${r.outcome}`,
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// The executor
// ---------------------------------------------------------------------------

/**
 * Run the fixed proof.
 *
 * Returns { ok, refusal, wrapper_digest, executor_digest, expected_sha,
 *           observed_head, receipts, launches } — a pure-ish result the tests
 * assert over. `launches` counts SCHEDULE launches only; the identity probe is
 * never counted as one. No field of the result carries a token value.
 */
export function runFixedProof({
  run = realRun,
  env = process.env,
  repoRoot = REPO_ROOT,
  selfPath = import.meta.filename,
  spawn = spawnSync,
  announce = () => {},
} = {}) {
  const receipts = [];
  const base = {
    wrapper_path: WRAPPER_PATH,
    expected_wrapper_digest: EXPECTED_WRAPPER_DIGEST,
    executor_digest: digestOfFile(selfPath),
    wrapper_digest: null,
    expected_sha: null,
    observed_head: null,
    receipts,
    launches: 0,
  };

  // ── GATE STEP 1: the wrapper's RAW BYTES. ─────────────────────────────
  // Hashed before ANY decoding, so distinct invalid byte streams can never
  // collapse into one another through replacement-character decoding. The
  // bytes are never decoded, parsed, scanned, or inspected — only hashed.
  let wrapperBytes;
  try {
    wrapperBytes = readFileSync(resolve(repoRoot, WRAPPER_PATH));
  } catch (e) {
    return {
      ...base,
      ok: false,
      refusal: REFUSAL.wrapperUnreadable,
      detail: `cannot read ${WRAPPER_PATH}: ${String(e?.message ?? e)}`,
    };
  }
  const wrapperDigest = "sha256:" + createHash("sha256").update(wrapperBytes).digest("hex");
  base.wrapper_digest = wrapperDigest;
  if (wrapperDigest !== EXPECTED_WRAPPER_DIGEST) {
    // STOP. Zero schedule commands have been launched and none will be. No
    // diagnostic reads the refused bytes: their content is not this program's
    // business, whatever it contains.
    return {
      ...base,
      ok: false,
      refusal: REFUSAL.wrapperFingerprintMismatch,
      detail:
        `${WRAPPER_PATH} raw bytes hash to ${wrapperDigest}, ` +
        `not the operator-authorized ${EXPECTED_WRAPPER_DIGEST}`,
    };
  }

  // ── GATE STEP 2: the expected head SHA, exactly 40 lowercase hex. ─────
  const expectedRaw = env[EXPECTED_HEAD_ENV];
  if (typeof expectedRaw !== "string" || !EXACT_SHA_RE.test(expectedRaw)) {
    return {
      ...base,
      ok: false,
      refusal: REFUSAL.expectedShaMalformed,
      detail:
        `${EXPECTED_HEAD_ENV} must be exactly 40 lowercase hex characters; ` +
        `got ${typeof expectedRaw === "string" ? JSON.stringify(expectedRaw) : typeof expectedRaw}`,
    };
  }
  base.expected_sha = expectedRaw;

  // ── GATE STEP 3: the registry-credential INGRESS. ─────────────────────
  // Captured ONCE, here, and passed only to the seam. Checked BEFORE the
  // identity probe, so a missing credential launches NOTHING AT ALL — not even
  // the probe. The refusal names the VARIABLE and never its value.
  const ingress = env[NPM_TOKEN_INGRESS_ENV];
  if (typeof ingress !== "string" || ingress.trim() === "") {
    return {
      ...base,
      ok: false,
      refusal: REFUSAL.npmTokenIngressMissing,
      detail:
        `${NPM_TOKEN_INGRESS_ENV} must be present and non-blank; the install ` +
        `entry cannot resolve the private dependency without it, and there is ` +
        `no fallback registry`,
    };
  }
  const token = ingress;

  // ── GATE STEP 4: the observed HEAD. ───────────────────────────────────
  // The ONLY launch permitted before the gate completes. It is a fixed argv
  // array with shell:false like every other launch, its environment comes from
  // the same single constructor (so it holds NEITHER token name), and it is
  // recorded as an identity probe — never as a schedule command, and never
  // counted in `launches`.
  const probe = run({ ...IDENTITY_PROBE, capture: true }, { token, baseEnv: env, spawn });
  const observed = typeof probe.stdout === "string" ? probe.stdout.trim() : "";
  if (probe.error || probe.status !== 0 || !EXACT_SHA_RE.test(observed)) {
    return {
      ...base,
      ok: false,
      refusal: REFUSAL.headUnreadable,
      detail:
        `git rev-parse HEAD did not yield a 40-hex commit id ` +
        `(status=${probe.status}, signal=${probe.signal ?? null})`,
    };
  }
  base.observed_head = observed;

  // ── GATE STEP 5: exact identity. ──────────────────────────────────────
  if (observed !== expectedRaw) {
    return {
      ...base,
      ok: false,
      refusal: REFUSAL.headMismatch,
      detail: `observed HEAD ${observed} != expected ${expectedRaw}`,
    };
  }

  // ── THE GATE HAS SUCCEEDED. Only now may schedule commands launch. ────
  //
  // Announce the identity facts HERE, at the moment the gate passes and before
  // the first launch, so the job log itself carries the ordering evidence: the
  // banner cannot appear after a schedule command's output, because it is
  // written before the loop starts. The closing envelope repeats these facts,
  // but a reader would have to trust the code's structure to know the envelope
  // was not assembled after the fact. This line is checkable on its own.
  //
  // The banner states WHICH entry is authenticated, by label. It never states
  // the credential, because the credential is not a fact about identity.
  announce(
    [
      "── Phase 50A identity gate: PASSED ─────────────────────────────────",
      `wrapper_digest    : ${wrapperDigest}`,
      `executor_digest   : ${base.executor_digest ?? "(unreadable)"}`,
      `expected_head_sha : ${expectedRaw}`,
      `observed_head     : ${observed}`,
      `schedule_length   : ${SCHEDULE.length}`,
      `authenticated     : ${AUTHENTICATED_ENTRY_LABEL} only (${NPM_TOKEN_CHILD_ENV} set for that child alone)`,
      "No schedule command has been launched yet. Launching now, in order.",
      "────────────────────────────────────────────────────────────────────",
    ].join("\n"),
  );

  for (let i = 0; i < SCHEDULE.length; i += 1) {
    const entry = SCHEDULE[i];
    const ordinal = i + 1;
    base.launches += 1;
    const outcome = run(entry, { token, baseEnv: env, spawn });
    const verdict = classify(outcome);
    receipts.push(receiptOf(ordinal, entry, outcome, verdict));
    if (verdict.spawnFailed) {
      return { ...base, ok: false, refusal: REFUSAL.commandSpawnFailed, detail: `${entry.label}: ${outcome.error}` };
    }
    if (verdict.timedOut) {
      return { ...base, ok: false, refusal: REFUSAL.commandTimedOut, detail: `${entry.label} exceeded ${entry.timeout_ms}ms` };
    }
    if (verdict.signalled) {
      return { ...base, ok: false, refusal: REFUSAL.commandSignalled, detail: `${entry.label} terminated by ${outcome.signal}` };
    }
    if (verdict.failed) {
      return { ...base, ok: false, refusal: REFUSAL.commandFailed, detail: `${entry.label} exited ${outcome.status}` };
    }
  }

  return { ...base, ok: true, refusal: null, detail: null };
}

/** SHA-256 of a file's raw bytes, or null when unreadable. */
export function digestOfFile(path) {
  try {
    return "sha256:" + createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch {
    return null;
  }
}

/**
 * The published envelope. Emitted on EVERY run, including a refused one, so a
 * refusal is as inspectable as a success: the identity facts always precede
 * the receipts. Every line here is a fact about identity, the schedule, or an
 * outcome — never about a credential's value.
 */
export function renderReport(result) {
  const lines = [
    "── Phase 50A fixed proof executor ──────────────────────────────────",
    `wrapper_path            : ${result.wrapper_path}`,
    `wrapper_digest_observed : ${result.wrapper_digest ?? "(unreadable)"}`,
    `wrapper_digest_expected : ${result.expected_wrapper_digest}`,
    `executor_digest         : ${result.executor_digest ?? "(unreadable)"}`,
    `expected_head_sha       : ${result.expected_sha ?? "(absent or malformed)"}`,
    `observed_head           : ${result.observed_head ?? "(not read)"}`,
    `schedule_length         : ${SCHEDULE.length}`,
    `schedule_launches       : ${result.launches}`,
    `authenticated_entry     : ${AUTHENTICATED_ENTRY_LABEL}`,
    `outcome                 : ${result.ok ? "PASS" : "REFUSED"}`,
    `refusal                 : ${result.refusal ?? "(none)"}`,
    `detail                  : ${result.detail ?? "(none)"}`,
    "command receipts:",
    result.receipts.length > 0 ? renderReceipts(result.receipts) : "  (none launched)",
    "────────────────────────────────────────────────────────────────────",
  ];
  return lines.join("\n");
}

// Entry point. Kept minimal: the logic above is what the tests exercise.
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const result = runFixedProof({
    announce: (text) => process.stdout.write(text + "\n"),
  });
  process.stdout.write(renderReport(result) + "\n");
  process.exit(result.ok ? 0 : 1);
}
