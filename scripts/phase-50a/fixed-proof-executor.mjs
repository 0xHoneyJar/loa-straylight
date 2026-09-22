#!/usr/bin/env node
// Phase 50A — THE FIXED PROOF EXECUTOR (process-tree proof closure, patch
// cycle 3).
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
// ── PROCESS-TREE CONTAINMENT (this cycle's correction) ──────────────────
//
// The sequence-54 audit recorded that the previous version bounded only the
// DIRECT child it launched. It handed a timeout to the synchronous launch
// primitive, which terminates that one process; the child's OWN descendants
// stayed alive. In the failed automatic run a timed-out test command was
// correctly classified, yet six proof descendants survived until the hosted
// runner's cleanup killed them — free to keep consuming resources or mutating
// the workspace and the service containers after this program had returned.
// Stopping successors is NOT containment.
//
// The synchronous primitive cannot express the remedy, so process control is
// REPLACED rather than patched:
//
//   * every launch is asynchronous and DETACHED, so the child becomes the
//     leader of its OWN process group and every descendant it creates
//     inherits that group. One integer therefore names the whole tree;
//   * THIS PROGRAM owns the clock. No bound is delegated to the launch
//     primitive, whose kill reaches the direct child alone;
//   * when the bound lapses the WHOLE GROUP is signalled (negative pid form),
//     never the direct child alone;
//   * after a FIXED grace period the group is signalled again with a signal
//     that cannot be caught or ignored — escalation, so a member that traps
//     the first signal still dies;
//   * the direct child's reaping is OBSERVED (its exit is actually seen,
//     never inferred from elapsed time);
//   * the group's ABSENCE is then VERIFIED by probing it, within a bounded
//     window, BEFORE any receipt is written or any refusal is returned;
//   * if reaping is not observed, or absence cannot be established, that is
//     its OWN distinct refusal — containment unverified. It is never reported
//     as an ordinary lapse, never as success, and never silently dropped.
//
// SIX DISTINCT OUTCOME CLASSES, checked in this precedence order: launch
// failure, termination failure (signalling the group itself was refused),
// containment failure (the tree could not be proven gone), bound lapsed,
// ordinary signal death, nonzero exit. No pair may collapse; in particular a
// null status is never allowed to fall through an exit-code comparison as
// success.
//
// ── CREDENTIAL NARROWING ────────────────────────────────────────────────
//
// The sequence-54 audit also disproved the previous read-once claim: the child
// environment was built by copying the whole source environment and removing
// the two credential names afterwards, so both credential properties were
// re-read on every one of the thirteen constructions. The launch boundary was
// safe; the claim about it was false.
//
// So the constructor no longer copies wholesale. It ENUMERATES the source
// environment's NAMES and SKIPS both credential names BEFORE reading any
// value, so neither credential property is ever read while building a child:
//
//   * the wrapper names NO registry variable at all. It hands the ephemeral
//     job token to this program under the INGRESS name PHASE_50A_NPM_TOKEN;
//   * this program reads that value EXACTLY ONCE, into a local binding, during
//     the identity gate — a missing or blank ingress is its own refusal,
//     raised BEFORE the identity probe, so it launches nothing whatsoever;
//   * ONE constructor, `childEnv`, builds the environment for EVERY child.
//     It skips the ingress name and the registry name BY NAME, then adds the
//     registry name from the captured value for the install entry ALONE;
//   * the identity probe and schedule entries 2-12 therefore hold NEITHER
//     name, and neither do their descendants, since a child inherits only
//     what its parent was given;
//   * the install argv is `npm ci --ignore-scripts`, so the repository's
//     `prepare` lifecycle (which runs `build`) cannot run inside the one
//     authenticated process tree. The explicit build runs later, as its own
//     schedule entry, in a child holding neither name.
//
// Read counts are proven at RUNTIME — a source-text count cannot see a
// property read performed by a wholesale copy — by driving this production
// seam with an environment whose credential properties are instrumented
// accessors that count every read.
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
//      the gate completes, itself group-bounded and absence-verified,
//      recorded as an identity probe, never as a schedule command.
//   5. Require observed HEAD to equal the expected SHA exactly.
//   6. ONLY THEN run the closed schedule, serially, each entry bounded by
//      this program over the whole process tree, stopping at the first
//      failure of any class.
//
// A failure at any of 1-5 exits nonzero having launched ZERO schedule
// commands. There is no fallback, no shortened schedule, and no refusal path
// that exits zero.
//
// Node 22 builtins only — no package dependency, because this program runs
// BEFORE `npm ci`. `npm ci` is the first entry of its own schedule. The
// module's own location comes from `import.meta.dirname` /
// `import.meta.filename`, so no path-conversion builtin is needed.

import { spawn as nodeSpawn } from "node:child_process";
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
 * packet (comment 5184357042, packet digest
 * sha256:012433fec0b46ef7fdaea0444165fb986c086145507c3da38c7b352958b4fd25).
 *
 * LITERAL AND COMMITTED. Never derived at runtime from any input. Changing the
 * wrapper REQUIRES a new operator-authorized packet that fixes new bytes and a
 * new digest — that reviewed step is the whole point of this constant.
 */
export const EXPECTED_WRAPPER_DIGEST =
  "sha256:b95509fb82142d647e425d8c9a0ca10a7cf289d5fbfedc4573193a20c499fd7b";

/** Environment variable carrying the exact audited head SHA. */
export const EXPECTED_HEAD_ENV = "PHASE_50A_EXPECTED_HEAD_SHA";

/**
 * INGRESS name. The wrapper hands the ephemeral job token to this program
 * under this name, and NO child process ever receives it: `childEnv` skips it
 * by name while building every child environment.
 */
export const NPM_TOKEN_INGRESS_ENV = "PHASE_50A_NPM_TOKEN";

/**
 * The registry-authentication name npm itself reads. It appears in NO workflow
 * file. `childEnv` skips it by name for every child, then adds it for the
 * install entry alone.
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

/**
 * CONTAINMENT PARAMETERS. Fixed committed constants, deliberately not
 * configurable from outside this file: a grace of zero, or a verification
 * window of zero, would quietly turn proven containment back into an
 * assumption.
 *
 * GRACE_MS  — how long a signalled group is given to exit on its own before
 *             the uncatchable escalation is sent.
 * VERIFY_MS — the bounded window in which the group's absence must be
 *             established. Exhausting it is a refusal, never a pass.
 * PROBE_MS  — polling interval of the absence probe.
 */
export const GRACE_MS = 5_000;
export const VERIFY_MS = 15_000;
export const PROBE_MS = 100;

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
  // The identity probe ran, but its own process group could not be proven
  // absent. Uncontained identity work authorizes nothing.
  identityContainmentUnverified: "identity-containment-unverified",
  commandFailed: "command-failed",
  commandSignalled: "command-signalled",
  commandTimedOut: "command-timed-out",
  commandSpawnFailed: "command-spawn-failed",
  commandTerminationFailed: "command-termination-failed",
  commandContainmentUnverified: "command-containment-unverified",
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
 * ENUMERATE AND SKIP, never copy-then-remove. The source environment's NAMES
 * are enumerated, and the two credential names are skipped BEFORE their values
 * are read, so building a child never reads either credential property. A
 * wholesale copy would re-read both on every construction — that is exactly
 * the false read-once claim the sequence-54 audit disproved, and the reason
 * this constructor is shaped this way. The registry name is then added, from
 * the captured value, if and only if this entry's label is the single
 * authenticated label.
 *
 * `token` is the captured ingress value. For the probe and entries 2-12 the
 * result holds neither name at all — asserted by the tests over the ACTUAL
 * options object this constructor's caller passes to the launch primitive, and
 * by instrumented accessors that count the reads this function performs.
 */
export function childEnv(entry, token, baseEnv) {
  const env = {};
  for (const name of Object.keys(baseEnv)) {
    if (name === NPM_TOKEN_INGRESS_ENV) continue;
    if (name === NPM_TOKEN_CHILD_ENV) continue;
    env[name] = baseEnv[name];
  }
  if (entry.label === AUTHENTICATED_ENTRY_LABEL) {
    env[NPM_TOKEN_CHILD_ENV] = token;
  }
  return env;
}

// ---------------------------------------------------------------------------
// Process-group control primitives
// ---------------------------------------------------------------------------

/**
 * Signal an ENTIRE process group by its group id. The negative pid form is
 * what makes this a tree operation rather than a single-process one.
 *
 * Returns { ok: true, delivered } when the group is either signalled or
 * already gone, and { ok: false, code } when the operating system refused —
 * which is a termination FAILURE, its own distinct outcome class, never
 * quietly treated as success.
 */
export function signalGroup(pgid, sig) {
  try {
    process.kill(-pgid, sig);
    return { ok: true, delivered: true };
  } catch (e) {
    // No such process group: every member is already gone. That is the
    // desired end state, so it is a success with nothing delivered.
    if (e && e.code === "ESRCH") return { ok: true, delivered: false };
    return { ok: false, code: String(e?.code ?? e?.message ?? e) };
  }
}

/**
 * Is ANY member of the group still present? Signal 0 performs the existence
 * check without delivering anything.
 *
 * FAIL CLOSED: only an explicit "no such process group" proves absence. A
 * permission error means members exist that we may not signal, and an
 * unrecognized error means we cannot tell — both report "still present", so an
 * unprovable absence becomes a refusal instead of an assumption.
 */
export function groupAlive(pgid) {
  try {
    process.kill(-pgid, 0);
    return true;
  } catch (e) {
    if (e && e.code === "ESRCH") return false;
    return true;
  }
}

function sleep(ms) {
  return new Promise((done) => {
    setTimeout(done, ms);
  });
}

// ---------------------------------------------------------------------------
// Process execution seam
// ---------------------------------------------------------------------------

/**
 * Launch one child. The ONLY place this program starts a process.
 *
 * `shell` is explicitly false, the command is an executable plus an argv
 * ARRAY, and there is no string-command form anywhere — so no argument is ever
 * interpreted by a shell. `detached` puts the child in its OWN process group,
 * which every descendant inherits: that is what lets one group id name the
 * whole tree for termination and for the absence proof. The child environment
 * comes from `childEnv` and from nowhere else. Standard input is never
 * inherited: a detached group must not contend for the terminal.
 *
 * NO BOUND IS PASSED to the primitive. Its own bound kills the direct child
 * only, which is precisely the defect this design replaces; the clock belongs
 * to `realRun`.
 */
function launchChild(entry, token, baseEnv, spawn) {
  return spawn(entry.file, [...entry.args], {
    cwd: REPO_ROOT,
    shell: false,
    env: childEnv(entry, token, baseEnv),
    // The identity probe's output IS the datum, so it is captured. Schedule
    // commands stream straight to the job log, where a human reads them.
    stdio: entry.capture === true
      ? ["ignore", "pipe", "inherit"]
      : ["ignore", "inherit", "inherit"],
    detached: true,
  });
}

/**
 * THE ONE way this program runs anything, and the owner of the clock.
 *
 * Resolves to an outcome describing exactly what happened, including the
 * containment facts: whether the group was signalled, whether escalation was
 * needed, whether the direct child's reaping was OBSERVED, and whether the
 * group's absence was VERIFIED. Those facts are established BEFORE this
 * function resolves, so a caller can never write a receipt or return a
 * refusal for a tree that might still be running.
 *
 * The primitives are injectable so tests can drive this PRODUCTION path while
 * capturing the real options object, forcing a termination failure, and
 * forcing an absence that cannot be established. Production passes none of
 * them and gets the real implementations.
 */
export async function realRun(entry, {
  token,
  baseEnv = process.env,
  spawn = nodeSpawn,
  signal = signalGroup,
  alive = groupAlive,
  graceMs = GRACE_MS,
  verifyMs = VERIFY_MS,
  probeMs = PROBE_MS,
} = {}) {
  let child;
  try {
    child = launchChild(entry, token, baseEnv, spawn);
  } catch (e) {
    return launchFailureOutcome(String(e?.code ?? e?.message ?? e));
  }

  const pgid = typeof child.pid === "number" && child.pid > 0 ? child.pid : null;

  let stdout = "";
  if (entry.capture === true && child.stdout) {
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
  }

  // Observed facts. `reaped` flips only when the child's exit is actually
  // seen; nothing here infers it from elapsed time.
  let reaped = false;
  let status = null;
  let exitSignal = null;
  let launchError = null;

  const settled = new Promise((done) => {
    child.on("error", (e) => {
      launchError = String(e?.code ?? e?.message ?? e);
      done();
    });
    child.on("exit", (code, sig) => {
      status = typeof code === "number" ? code : null;
      exitSignal = sig ?? null;
      reaped = true;
      done();
    });
  });

  // THIS PROGRAM'S CLOCK. A lapse starts tree termination; the bound is never
  // delegated to the launch primitive.
  let timedOut = false;
  let timer = null;
  const bound = new Promise((done) => {
    timer = setTimeout(() => {
      timedOut = true;
      done();
    }, entry.timeout_ms);
  });

  await Promise.race([settled, bound]);
  if (timer !== null) clearTimeout(timer);

  // A launch failure has no tree to contain: there was never a group.
  if (launchError !== null && !reaped) {
    return launchFailureOutcome(launchError);
  }

  let groupSignalled = false;
  let escalated = false;
  let terminationError = null;
  let groupVerifiedAbsent = false;

  // 1. OBSERVE the direct child's reaping FIRST, bounded by the verification
  //    window. An unreaped child is an unproven tree, not merely a slow one,
  //    and it is itself still a group member — so absence can never be
  //    established before its exit is seen. This is required on EVERY path,
  //    not only after a lapse: a timeout is one reason the child may not have
  //    been reaped yet, never the only one.
  if (!reaped) {
    await Promise.race([settled, sleep(verifyMs)]);
  }

  if (pgid === null) {
    // No group id means no addressable tree. Refuse rather than pretend the
    // direct child was the whole of it. Absence stays unproven.
    terminationError = "no-process-group";
  } else {
    // 2. VERIFY the group's absence, bounded, BEFORE deciding whether any
    //    signal is owed. A well-behaved tree that has fully exited needs
    //    nothing: `group_signalled` stays false and this costs one probe.
    groupVerifiedAbsent = reaped && !alive(pgid);

    // 3. THE CORRECTION. If ANY member survives — whether the bound lapsed or
    //    the direct child exited entirely on its own, status 0 included — the
    //    WHOLE GROUP is terminated here. A natural direct-child exit that
    //    leaves a descendant behind is precisely the case the previous design
    //    missed: it probed, reported group_verified_absent=false, and left the
    //    descendant running. Termination is owed to the SURVIVAL of the group,
    //    never to the reason this program stopped waiting.
    if (!groupVerifiedAbsent) {
      const first = signal(pgid, "SIGTERM");
      if (!first.ok) {
        terminationError = first.code;
      } else {
        groupSignalled = true;
        // 4. Bounded grace, then escalate with a signal that cannot be caught
        //    or ignored, so a member that trapped the first one still dies.
        await sleep(graceMs);
        if (alive(pgid)) {
          const second = signal(pgid, "SIGKILL");
          escalated = true;
          if (!second.ok) terminationError = second.code;
        }
      }

      // 5. The child may only now have been reaped (it was signalled), so
      //    observe its exit before probing again — same ordering rule as
      //    step 1, re-applied after the signals.
      if (!reaped) {
        await Promise.race([settled, sleep(verifyMs)]);
      }

      // 6. RE-VERIFY absence within a bounded window. Only an explicit "no
      //    such process group" proves it (see `groupAlive`), so an unprovable
      //    absence leaves group_verified_absent false and `classify` turns
      //    that into a containment refusal: UNCERTAINTY FAILS CLOSED.
      if (reaped) {
        let waited = 0;
        while (alive(pgid) && waited < verifyMs) {
          await sleep(probeMs);
          waited += probeMs;
        }
        groupVerifiedAbsent = !alive(pgid);
      }
    }
  }

  return {
    status,
    signal: exitSignal,
    stdout,
    timed_out: timedOut,
    error: launchError,
    group_signalled: groupSignalled,
    escalated,
    direct_child_reaped: reaped,
    group_verified_absent: groupVerifiedAbsent,
    termination_error: terminationError,
  };
}

function launchFailureOutcome(code) {
  return {
    status: null,
    signal: null,
    stdout: "",
    timed_out: false,
    error: code,
    group_signalled: false,
    escalated: false,
    direct_child_reaped: false,
    group_verified_absent: false,
    termination_error: null,
  };
}

/**
 * Classify one launch outcome into exactly one verdict.
 *
 * SIX classes, checked in precedence order. Collapsing any pair would let a
 * stall, a missing binary, an un-killable tree, or a surviving descendant be
 * reported as something milder — or, worse, let a `status === null` outcome
 * fall through the `status !== 0` test as success.
 *
 *   spawnFailed        the process never started; there is no tree.
 *   terminationFailed  signalling the group was refused — the most specific
 *                      diagnosis, so it outranks the containment failure it
 *                      necessarily also causes.
 *   containmentFailed  reaping was not observed, or absence was not proven
 *                      within the window. Its own refusal, NEVER folded into
 *                      the lapse that led to it.
 *   timedOut           the bound lapsed and the tree was proven gone.
 *   signalled          an ordinary signal death, no lapse involved.
 *   failed             a real, observed nonzero exit status.
 */
export function classify(outcome) {
  const spawnFailed = outcome.error !== null && outcome.error !== undefined;
  const terminationFailed =
    !spawnFailed && outcome.termination_error !== null && outcome.termination_error !== undefined;
  const containmentFailed =
    !spawnFailed &&
    !terminationFailed &&
    (outcome.direct_child_reaped !== true || outcome.group_verified_absent !== true);
  const timedOut =
    !spawnFailed && !terminationFailed && !containmentFailed && outcome.timed_out === true;
  const signalled =
    !spawnFailed &&
    !terminationFailed &&
    !containmentFailed &&
    !timedOut &&
    outcome.signal !== null &&
    outcome.signal !== undefined;
  // `status !== 0` alone would treat a null status as a failure of unknown
  // kind; by this point status is a real exit code or the run is already
  // classified above.
  const failed =
    !spawnFailed &&
    !terminationFailed &&
    !containmentFailed &&
    !timedOut &&
    !signalled &&
    outcome.status !== 0;
  return { spawnFailed, terminationFailed, containmentFailed, timedOut, signalled, failed };
}

/** The refusal code for a verdict, or null when the launch was clean. */
export function refusalFor(verdict) {
  if (verdict.spawnFailed) return REFUSAL.commandSpawnFailed;
  if (verdict.terminationFailed) return REFUSAL.commandTerminationFailed;
  if (verdict.containmentFailed) return REFUSAL.commandContainmentUnverified;
  if (verdict.timedOut) return REFUSAL.commandTimedOut;
  if (verdict.signalled) return REFUSAL.commandSignalled;
  if (verdict.failed) return REFUSAL.commandFailed;
  return null;
}

function outcomeName(verdict) {
  if (verdict.spawnFailed) return "spawn-failed";
  if (verdict.terminationFailed) return "termination-failed";
  if (verdict.containmentFailed) return "containment-unverified";
  if (verdict.timedOut) return "timed-out";
  if (verdict.signalled) return "signalled";
  if (verdict.failed) return "failed";
  return "ok";
}

// ---------------------------------------------------------------------------
// Receipts
// ---------------------------------------------------------------------------

/**
 * One receipt per ATTEMPTED command, in attempt order.
 *
 * DETERMINISTIC BY CONSTRUCTION: label, file, exact argv, status, signal,
 * timed_out, the containment facts, and the ordinal. No timestamp, no
 * duration, no hostname, no absolute path, no process id, no environment
 * value — so two runs of the same schedule produce byte-identical receipt
 * text, and neither a credential nor a machine detail can reach the log
 * through a receipt.
 */
function receiptOf(ordinal, entry, outcome, verdict) {
  return {
    ordinal,
    label: entry.label,
    file: entry.file,
    argv: [...entry.args],
    status: outcome.status === undefined ? null : outcome.status,
    signal: outcome.signal === undefined ? null : outcome.signal,
    timed_out: outcome.timed_out === true,
    spawn_failed: verdict.spawnFailed === true,
    group_signalled: outcome.group_signalled === true,
    escalated: outcome.escalated === true,
    direct_child_reaped: outcome.direct_child_reaped === true,
    group_verified_absent: outcome.group_verified_absent === true,
    outcome: outcomeName(verdict),
  };
}

export function renderReceipts(receipts) {
  return receipts
    .map(
      (r) =>
        `  [${r.ordinal}] ${r.label} :: ${r.file} ${JSON.stringify(r.argv)} ` +
        `status=${r.status} signal=${r.signal} timed_out=${r.timed_out} ` +
        `spawn_failed=${r.spawn_failed} group_signalled=${r.group_signalled} ` +
        `escalated=${r.escalated} reaped=${r.direct_child_reaped} ` +
        `group_absent=${r.group_verified_absent} outcome=${r.outcome}`,
    )
    .join("\n");
}

// ---------------------------------------------------------------------------
// The executor
// ---------------------------------------------------------------------------

/**
 * Run the fixed proof.
 *
 * Resolves to { ok, refusal, wrapper_digest, executor_digest, expected_sha,
 * observed_head, receipts, launches } — a result the tests assert over.
 * `launches` counts SCHEDULE launches only; the identity probe is never
 * counted as one. No field of the result carries a token value.
 */
export async function runFixedProof({
  run = realRun,
  env = process.env,
  repoRoot = REPO_ROOT,
  selfPath = import.meta.filename,
  spawn = nodeSpawn,
  signal = signalGroup,
  alive = groupAlive,
  graceMs = GRACE_MS,
  verifyMs = VERIFY_MS,
  probeMs = PROBE_MS,
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
  const control = { spawn, signal, alive, graceMs, verifyMs, probeMs };

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
  // Read ONCE, here, into a local binding, and passed only to the seam.
  // Checked BEFORE the identity probe, so a missing credential launches
  // NOTHING AT ALL — not even the probe. The refusal names the VARIABLE and
  // never its value. This single read is what the runtime access-count proof
  // observes; `childEnv` never reads either credential property again.
  const token = env[NPM_TOKEN_INGRESS_ENV];
  if (typeof token !== "string" || token.trim() === "") {
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

  // ── GATE STEP 4: the observed HEAD. ───────────────────────────────────
  // The ONLY launch permitted before the gate completes. It is a fixed argv
  // array with shell:false like every other launch, it is group-bounded and
  // absence-verified like every other launch, its environment comes from the
  // same single constructor (so it holds NEITHER token name), and it is
  // recorded as an identity probe — never as a schedule command, and never
  // counted in `launches`.
  const probe = await run({ ...IDENTITY_PROBE, capture: true }, { token, baseEnv: env, ...control });

  // ── GATE STEP 4a: the probe's OWN CONTAINMENT is load-bearing. ────────
  // The identity probe is a real launch in a real process group, so it can
  // leak a descendant exactly like any schedule entry. Its containment is
  // therefore checked through the SAME canonical classifier every schedule
  // entry uses — `classify` — and the three observed facts it rests on are
  // required explicitly. A probe whose tree cannot be proven absent must
  // never authorize successors: reading a correct SHA out of an uncontained
  // process says nothing about whether that process left anything behind.
  // ZERO schedule entries launch on this path.
  const probeVerdict = classify(probe);
  if (
    probe.termination_error !== null ||
    probe.direct_child_reaped !== true ||
    probe.group_verified_absent !== true ||
    probeVerdict.containmentFailed === true ||
    probeVerdict.terminationFailed === true
  ) {
    return {
      ...base,
      ok: false,
      refusal: REFUSAL.identityContainmentUnverified,
      detail:
        `the identity probe's process group was not proven absent, so it ` +
        `cannot authorize any schedule entry ` +
        `(termination_error=${probe.termination_error}, ` +
        `direct_child_reaped=${probe.direct_child_reaped}, ` +
        `group_verified_absent=${probe.group_verified_absent}, ` +
        `containmentFailed=${probeVerdict.containmentFailed}, ` +
        `terminationFailed=${probeVerdict.terminationFailed})`,
    };
  }

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
  // The banner states WHICH entry is authenticated, by label, and the
  // containment parameters this run enforces. It never states the credential,
  // because the credential is not a fact about identity.
  announce(
    [
      "── Phase 50A identity gate: PASSED ─────────────────────────────────",
      `wrapper_digest    : ${wrapperDigest}`,
      `executor_digest   : ${base.executor_digest ?? "(unreadable)"}`,
      `expected_head_sha : ${expectedRaw}`,
      `observed_head     : ${observed}`,
      `schedule_length   : ${SCHEDULE.length}`,
      `authenticated     : ${AUTHENTICATED_ENTRY_LABEL} only (${NPM_TOKEN_CHILD_ENV} set for that child alone)`,
      `containment       : own process group per entry; grace ${control.graceMs}ms, ` +
        `escalation, absence verified within ${control.verifyMs}ms`,
      "No schedule command has been launched yet. Launching now, in order.",
      "────────────────────────────────────────────────────────────────────",
    ].join("\n"),
  );

  for (let i = 0; i < SCHEDULE.length; i += 1) {
    const entry = SCHEDULE[i];
    const ordinal = i + 1;
    base.launches += 1;
    const outcome = await run(entry, { token, baseEnv: env, ...control });
    const verdict = classify(outcome);
    receipts.push(receiptOf(ordinal, entry, outcome, verdict));
    const refusal = refusalFor(verdict);
    if (refusal !== null) {
      // STOP: no successor entry is launched, and the tree of the entry that
      // failed has already been accounted for above.
      return { ...base, ok: false, refusal, detail: detailFor(entry, outcome, verdict) };
    }
  }

  return { ...base, ok: true, refusal: null, detail: null };
}

function detailFor(entry, outcome, verdict) {
  if (verdict.spawnFailed) return `${entry.label}: ${outcome.error}`;
  if (verdict.terminationFailed) {
    return `${entry.label}: could not terminate the process group (${outcome.termination_error})`;
  }
  if (verdict.containmentFailed) {
    return (
      `${entry.label}: containment unproven ` +
      `(direct_child_reaped=${outcome.direct_child_reaped === true}, ` +
      `group_verified_absent=${outcome.group_verified_absent === true})`
    );
  }
  if (verdict.timedOut) {
    return `${entry.label} exceeded ${entry.timeout_ms}ms; process group terminated and verified absent`;
  }
  if (verdict.signalled) return `${entry.label} terminated by ${outcome.signal}`;
  return `${entry.label} exited ${outcome.status}`;
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
    `containment_grace_ms    : ${GRACE_MS}`,
    `containment_verify_ms   : ${VERIFY_MS}`,
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
  const result = await runFixedProof({
    announce: (text) => process.stdout.write(text + "\n"),
  });
  process.stdout.write(renderReport(result) + "\n");
  process.exit(result.ok ? 0 : 1);
}
