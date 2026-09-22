// Phase 31F — Operator recall wedge demo proof.
//
// One local command — the documented operator command
// `npm run --silent demo:recall-wedge` — must produce a deterministic JSON
// report showing that a single transition-built actor estate yields
// different governed recall packs under private_operator vs public_discord,
// with receipts/audit explaining included, marked, redacted, and excluded
// material — and without leaking private payload or private assertion IDs
// into the public surface.
//
// We exercise the demo two ways:
//   1. directly via buildRecallWedgeDemoReport() — keeps the structural
//      assertions fast and lets us inspect the report shape in-process.
//   2. by running `npm run --silent demo:recall-wedge` as a BOUNDED,
//      PROCESS-TREE-SAFE subprocess — proves the actual operator command (the
//      one documented for humans and machines) emits a single parseable JSON
//      document on stdout. `--silent` is required because npm otherwise prints
//      lifecycle banner lines ("> @loa/straylight@... demo:recall-wedge") to
//      stdout that would corrupt the JSON document when redirected.
//
// ── WHY THE SUBPROCESS MECHANISM CHANGED (Phase 50A, sequence-54 audit) ──
//
// This suite previously ran the operator command with the SYNCHRONOUS
// `execFileSync` and no `timeout` option, so the call was an unbounded block.
// The `60_000` argument below is Vitest's per-test budget, and Vitest cannot
// preempt a synchronous blocking call: it can neither interrupt the blocked
// worker nor reap the npm/shell/Node/esbuild descendants the command starts.
//
// In Phase 50A automatic run 30907873453 / job 91987141482 this file was the
// SOLE file of 88 that failed to complete, and the hosted runner's cleanup
// named exactly that descendant tree. The Phase 50A proof harness has since
// replaced its own direct-child-only bounding with real process-group
// containment; this test is corrected the same way, so the repository test run
// can no longer be stalled from here.
//
// ONLY THE MECHANISM CHANGED. The command is the same documented operator
// command with the same `--silent`, stdout is collected the same way, and every
// assertion and semantic below is untouched: the same single-parseable-JSON
// property, the same report-shape, membrane, audit-chain, and private-
// fingerprint expectations. The package script is still NOT bypassed — the
// operator-command path itself is what must stay parseable.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  PHASE_31F_PRIVATE_FINGERPRINTS,
  buildRecallWedgeDemoReport,
  type RecallWedgeDemoReport,
} from '../scripts/demo-recall-wedge-31f.lib.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');
const NPM_BIN = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const PRIVATE_RECEIPT_ID_RE = /^rcpt_/;

/**
 * The PRE-SEAM globals, captured at MODULE EVALUATION — before any seam in
 * this file (or any suite in it) can have been installed.
 *
 * Deliberately independent of the seam's own `realKill` / `realSetTimeout`:
 * the identity assertions compare against THESE, so a seam that saved and
 * restored a bound copy would satisfy its own internal bookkeeping and still
 * fail here. That independence is what makes the assertion non-vacuous — the
 * sequence-83 audit's blocker was exactly a self-consistent wrong object.
 */
const PRISTINE_PROCESS_KILL: typeof process.kill = process.kill;
const PRISTINE_SET_TIMEOUT: typeof globalThis.setTimeout = globalThis.setTimeout;

/**
 * Run one command as a BOUNDED, process-tree-safe subprocess and resolve its
 * stdout.
 *
 * Fixed executable plus a fixed argv array, `shell: false`, and `detached: true`
 * so the child leads its OWN process group which every descendant inherits.
 * THIS FUNCTION owns the clock — the bound is not delegated to the launch
 * primitive, whose kill would reach the direct child alone and leave the npm /
 * shell / Node / esbuild descendants behind. On a lapse the WHOLE GROUP is
 * signalled, escalated after a fixed grace, and the direct child's exit is
 * awaited, so nothing outlives this call.
 *
 * A lapse, a signal death, or a nonzero exit all REJECT, so the test fails
 * loudly rather than parsing a truncated document.
 *
 * THIS FUNCTION OWNS EVERY TIMER IT CREATES and cancels all of them on every
 * exit path, so no delayed signal can fire after it returns. It does not return
 * until the whole group's absence has been PROVEN within a bounded window —
 * including the case where the direct child exits normally while a descendant
 * is still running, which a design that merely awaited the child's close would
 * miss entirely.
 */
async function runBounded(
  file: string,
  args: readonly string[],
  options: { cwd: string; timeoutMs: number; graceMs?: number; verifyMs?: number; probeMs?: number },
): Promise<string> {
  const graceMs = options.graceMs ?? 2_000;
  const verifyMs = options.verifyMs ?? 15_000;
  const probeMs = options.probeMs ?? 50;

  // EVERY timer this function creates lands here and is cleared in `finally`,
  // so no delayed signal can fire after the call returns.
  const timers = new Set<ReturnType<typeof setTimeout>>();

  // FAIL CLOSED, exactly as the executor's `groupAlive` does: only an explicit
  // "no such process group" proves absence. A permission error means members
  // exist we may not signal; an unrecognized error means we cannot tell. Both
  // report "still present", so an unprovable absence never passes as proven.
  const groupAlive = (gid: number): boolean => {
    try {
      process.kill(-gid, 0);
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException | null)?.code === 'ESRCH') return false;
      return true;
    }
  };
  const sleep = (ms: number): Promise<void> =>
    new Promise((done) => {
      // Tracked like every other timer so it cannot outlive this call.
      timers.add(setTimeout(done, ms));
    });
  const child = spawn(file, [...args], {
    cwd: options.cwd,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  const pgid = typeof child.pid === 'number' && child.pid > 0 ? child.pid : null;

  let stdout = '';
  let stderr = '';
  child.stdout?.setEncoding('utf8');
  child.stdout?.on('data', (chunk: string) => {
    stdout += chunk;
  });
  child.stderr?.setEncoding('utf8');
  child.stderr?.on('data', (chunk: string) => {
    stderr += chunk;
  });

  let timedOut = false;
  const settled = new Promise<{ code: number | null; signal: string | null }>((done, fail) => {
    child.on('error', fail);
    child.on('close', (code, signal) => done({ code, signal }));
  });
  timers.add(
    setTimeout(() => {
      timedOut = true;
      if (pgid !== null) {
        try {
          process.kill(-pgid, 'SIGTERM');
        } catch {
          /* group already gone */
        }
        // RETAINED, not orphaned: the escalation timer is tracked like every
        // other, so `finally` cancels it and it can never fire after return.
        timers.add(
          setTimeout(() => {
            try {
              process.kill(-pgid, 'SIGKILL');
            } catch {
              /* group already gone */
            }
          }, graceMs),
        );
      }
    }, options.timeoutMs),
  );

  try {
    const { code, signal } = await settled;

    // THE WHOLE TREE IS BOUNDED BEFORE THIS FUNCTION RETURNS OR THROWS.
    // Awaiting the direct child's close proves nothing about its descendants:
    // a child that exits normally, status 0, can leave a grandchild running.
    // So whenever the group still has a member, terminate the group, escalate
    // after a bounded grace, and PROVE absence within a bounded window.
    if (pgid !== null && groupAlive(pgid)) {
      try {
        process.kill(-pgid, 'SIGTERM');
      } catch {
        /* group already gone */
      }
      await sleep(graceMs);
      if (groupAlive(pgid)) {
        try {
          process.kill(-pgid, 'SIGKILL');
        } catch {
          /* group already gone */
        }
      }
      let waited = 0;
      while (groupAlive(pgid) && waited < verifyMs) {
        await sleep(probeMs);
        waited += probeMs;
      }
      if (groupAlive(pgid)) {
        // Absence could not be proven. Fail loudly rather than return a value
        // produced alongside processes that are still running.
        throw new Error(
          `${file} ${args.join(' ')} left process group ${pgid} alive after ` +
            `SIGTERM, ${graceMs}ms grace, SIGKILL and a ${verifyMs}ms absence probe`,
        );
      }
    }

    if (timedOut) {
      throw new Error(
        `${file} ${args.join(' ')} exceeded ${options.timeoutMs}ms; process group terminated`,
      );
    }
    if (signal !== null) {
      throw new Error(`${file} ${args.join(' ')} terminated by ${signal}`);
    }
    if (code !== 0) {
      throw new Error(`${file} ${args.join(' ')} exited ${code}: ${stderr.slice(0, 400)}`);
    }
    return stdout;
  } finally {
    // EVERY timer, including the nested escalation timer, is cancelled here on
    // every path: success, nonzero exit, signal death, lapse, or spawn error.
    for (const t of timers) clearTimeout(t);
    timers.clear();
    // Nothing may outlive this call, whichever way it ended.
    if (pgid !== null) {
      try {
        process.kill(-pgid, 'SIGKILL');
      } catch {
        /* the expected case: already gone */
      }
    }
  }
}

describe('Phase 31F — operator recall wedge demo', () => {
  it('buildRecallWedgeDemoReport() returns a valid demo report with both frame summaries over the same estate', () => {
    const report = buildRecallWedgeDemoReport();

    expect(report.demo).toBe('straylight_recall_wedge');
    expect(report.phase).toBe('31F');
    expect(typeof report.estate_id).toBe('string');
    expect(report.estate_id.length).toBeGreaterThan(0);
    expect(typeof report.actor_id).toBe('string');
    expect(report.actor_id.length).toBeGreaterThan(0);
    expect(report.assertion_count).toBeGreaterThanOrEqual(8);

    // Sanity check on hash shape only. We deliberately do NOT treat
    // pack_hash / receipt_hash inequality as the membrane proof: the
    // private_operator and public_discord requests intentionally use
    // different `task` strings (and frames), so their hashes are
    // request-sensitive and would differ even if the pack contents were
    // identical. The real membrane proof lives in the
    // included/marked/redacted/excluded surfaces and the leak checks
    // below.
    expect(report.private_operator.pack_hash).not.toBe(
      report.public_discord.pack_hash,
    );
    expect(report.private_operator.receipt_hash).not.toBe(
      report.public_discord.receipt_hash,
    );

    for (const frame of [report.private_operator, report.public_discord]) {
      expect(frame.pack_hash.startsWith('sha256:')).toBe(true);
      expect(frame.receipt_hash.startsWith('sha256:')).toBe(true);
      expect(typeof frame.recall_pack_id).toBe('string');
      expect(frame.receipt_id).toMatch(PRIVATE_RECEIPT_ID_RE);
      expect(frame.recall_pack_emitted).toBe(true);
      expect(frame.included_count).toBeGreaterThan(0);
    }
  });

  it('public_discord summary reports per-reason redaction including privacy_tenant_in_public_frame and per-reason exclusions for sealed/actor_private/revoked/forgotten', () => {
    const report = buildRecallWedgeDemoReport();
    const pub = report.public_discord;

    const redactionReasons = pub.redacted_counts_by_reason.map((r) => r.reason);
    expect(redactionReasons).toContain('privacy_tenant_in_public_frame');
    for (const entry of pub.redacted_counts_by_reason) {
      expect(typeof entry.reason).toBe('string');
      expect(Number.isInteger(entry.count)).toBe(true);
      expect(entry.count).toBeGreaterThan(0);
    }

    const exclusionReasons = pub.excluded_counts_by_reason.map((r) => r.reason);
    expect(exclusionReasons).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'status_forgotten_from_recall',
        'privacy_sealed',
        'privacy_actor_private_in_public_frame',
      ]),
    );
    for (const entry of pub.excluded_counts_by_reason) {
      expect(typeof entry.reason).toBe('string');
      expect(Number.isInteger(entry.count)).toBe(true);
      expect(entry.count).toBeGreaterThan(0);
    }
  });

  it('membrane invariants are all proved: contested marked-not-usable, revoked/forgotten excluded, no private payload or assertion-id leak into public surfaces', () => {
    const report = buildRecallWedgeDemoReport();

    expect(report.membrane.public_private_payload_leak).toBe(false);
    expect(report.membrane.public_private_assertion_id_leak).toBe(false);
    expect(report.membrane.public_has_redaction_reasons).toBe(true);
    expect(report.membrane.public_has_exclusion_reasons).toBe(true);
    expect(report.membrane.contested_marked_not_usable).toBe(true);
    expect(report.membrane.revoked_excluded).toBe(true);
    expect(report.membrane.forgotten_excluded).toBe(true);
    expect(report.membrane.sealed_excluded).toBe(true);
    expect(report.membrane.actor_private_excluded).toBe(true);
    expect(report.membrane.tenant_redacted_in_public).toBe(true);
  });

  it('audit summary reports recall_pack_emitted for both frames and a verified audit chain', () => {
    const report = buildRecallWedgeDemoReport();
    expect(report.audit.private_recall_pack_emitted).toBe(true);
    expect(report.audit.public_recall_pack_emitted).toBe(true);
    expect(report.audit.audit_chain_verified).toBe(true);
  });

  it('public_discord report surface contains no private payload fingerprints', () => {
    const report = buildRecallWedgeDemoReport();
    const publicJson = JSON.stringify(report.public_discord);
    for (const fragment of PHASE_31F_PRIVATE_FINGERPRINTS) {
      expect(publicJson).not.toContain(fragment);
    }
  });

  it('the documented operator command `npm run --silent demo:recall-wedge` emits a single parseable JSON report on stdout', async () => {
    // This test exercises the exact command operators are told to run
    // (`npm run --silent demo:recall-wedge`). `--silent` suppresses the
    // npm lifecycle banner ("> @loa/straylight@... demo:recall-wedge")
    // that would otherwise appear before the JSON on stdout and break
    // `... > /tmp/phase-31f-demo-output.json | JSON.parse(...)`. We
    // deliberately do NOT bypass the package script by invoking
    // node_modules/.bin/vite-node directly here — the operator-command
    // path itself is what must stay parseable.
    //
    // BOUNDED AND PROCESS-TREE-SAFE. `runBounded` owns the clock and puts the
    // command in its own process group, so a hung npm/Node/esbuild tree is
    // terminated here instead of stalling the whole repository test run until
    // the CI runner's cleanup — the Phase 50A sequence-54 finding. The bound
    // sits inside this test's own budget so a lapse fails this test loudly.
    const stdout = await runBounded(NPM_BIN, ['run', '--silent', 'demo:recall-wedge'], {
      cwd: REPO_ROOT,
      timeoutMs: 45_000,
    });

    const parsed = JSON.parse(stdout) as RecallWedgeDemoReport;
    expect(parsed.demo).toBe('straylight_recall_wedge');
    expect(parsed.phase).toBe('31F');
    expect(parsed.private_operator.pack_hash.startsWith('sha256:')).toBe(true);
    expect(parsed.public_discord.pack_hash.startsWith('sha256:')).toBe(true);
    // Note: pack_hash inequality is request-sensitive (different `task`
    // strings between frames), not the sole membrane proof — see the
    // leak checks below for the actual membrane invariants.
    expect(parsed.private_operator.pack_hash).not.toBe(parsed.public_discord.pack_hash);
    expect(typeof parsed.estate_id).toBe('string');
    expect(parsed.audit.audit_chain_verified).toBe(true);
    expect(parsed.membrane.public_private_payload_leak).toBe(false);
    expect(parsed.membrane.public_private_assertion_id_leak).toBe(false);

    // Public-frame surface in the operator-command output must also be
    // free of private fingerprints.
    const publicJson = JSON.stringify(parsed.public_discord);
    for (const fragment of PHASE_31F_PRIVATE_FINGERPRINTS) {
      expect(publicJson).not.toContain(fragment);
    }
  }, 60_000);
});

// ── runBounded's own containment contract ───────────────────────────────
//
// The sequence-63 Phase 50A audit found this helper returning as soon as its
// DIRECT CHILD closed: it sent a final group SIGKILL without ever observing
// group absence, and the escalation timer created on timeout was neither
// retained nor cancelled, so a delayed signal could fire after the call had
// already returned. Both are fixed, and both are proven here with REAL
// processes — the helper that bounds every other Phase 31F subprocess must
// itself be bounded.
//
// This block proves TREE containment. Timer cancellation is proven separately
// and observably, on all five exit paths, in the suite that follows.
describe('Phase 31F — runBounded bounds the WHOLE TREE and owns every timer', () => {
  /** Is this single process still present? Signal 0 checks without delivering. */
  const pidAlive = (pid: number): boolean => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException | null)?.code === 'ESRCH') return false;
      // Fail closed in the test too: unknown means "cannot prove gone".
      return true;
    }
  };

  it('a direct child that exits NORMALLY while a descendant lives does not return until the tree is gone', async () => {
    // The natural-exit case. The direct child prints a grandchild's pid and
    // exits 0 immediately; the grandchild sleeps far past this test's budget.
    // A helper that equated "child closed" with "tree gone" would resolve with
    // that grandchild still running.
    const script = [
      'const { spawn } = require("node:child_process");',
      // detached:false — the grandchild INHERITS this process group, which is
      // what lets one group id name the whole tree.
      'const g = spawn(process.execPath, ["-e", "setTimeout(()=>{}, 600000)"], {',
      '  stdio: "ignore", detached: false, shell: false });',
      'process.stdout.write(String(g.pid));',
      'setTimeout(() => process.exit(0), 100);',
    ].join('\n');

    const stdout = await runBounded(process.execPath, ['-e', script], {
      cwd: REPO_ROOT,
      timeoutMs: 30_000,
      graceMs: 200,
      verifyMs: 5_000,
      probeMs: 25,
    });

    const grandchildPid = Number(stdout.trim());
    expect(Number.isInteger(grandchildPid), `parsed pid from ${JSON.stringify(stdout)}`).toBe(true);
    expect(grandchildPid).toBeGreaterThan(0);

    // THE OPERATING SYSTEM IS THE WITNESS, questioned the instant runBounded
    // returned. No cleanup hook has run yet, so nothing can launder a leak
    // into a pass.
    expect(pidAlive(grandchildPid), `descendant ${grandchildPid} outlived runBounded`).toBe(false);
  }, 60_000);

  it('a nonzero exit still bounds the tree before rejecting', async () => {
    // Failure paths must contain the tree too — the `finally` block and the
    // absence proof both run before the rejection escapes.
    const script = [
      'const { spawn } = require("node:child_process");',
      'const g = spawn(process.execPath, ["-e", "setTimeout(()=>{}, 600000)"], {',
      '  stdio: "ignore", detached: false, shell: false });',
      'process.stderr.write(String(g.pid));',
      'setTimeout(() => process.exit(3), 100);',
    ].join('\n');

    let message = '';
    try {
      await runBounded(process.execPath, ['-e', script], {
        cwd: REPO_ROOT,
        timeoutMs: 30_000,
        graceMs: 200,
        verifyMs: 5_000,
        probeMs: 25,
      });
      throw new Error('runBounded resolved for a nonzero exit');
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/exited 3|left process group/);

    // The grandchild pid was written to stderr, which the rejection carries
    // AFTER the "exited 3:" marker. Anchoring there matters: an unanchored
    // \d+ would match the first number anywhere in the message — on a hosted
    // runner that is the "22" inside the Node toolcache path
    // (/opt/hostedtoolcache/node/22.x/...), and pid 22 belongs to a live
    // system process, so the assertion would misfire on a pid this test
    // never spawned.
    const pid = Number(/exited 3: (\d+)/.exec(message)?.[1] ?? '0');
    if (Number.isInteger(pid) && pid > 1) {
      expect(pidAlive(pid), `descendant ${pid} outlived a failing runBounded`).toBe(false);
    }
  }, 60_000);
});

// ── runBounded cancels EVERY timer on ALL FIVE exit paths ────────────────
//
// The sequence-77 Phase 50A audit found the previous proof VACUOUS: deleting
// the sole `clearTimeout` loop in runBounded's `finally` left no failure
// mechanism, because the timeout case ended in `expect(true).toBe(true)`, the
// timer callbacks swallowed their errors, and the signal-death and spawn-error
// paths had no case at all. That verdict is accepted; this suite replaces the
// tautology with OBSERVATION.
//
// THE SEAM. `process.kill` and `setTimeout` are wrapped for the duration of one
// call, so every signal the call issues and every timer it creates is RECORDED
// — pid, signal and timestamp for signals; the delay and the firing order for
// timers. Nothing is inferred from the fact that runBounded returned.
//
// THE BOUNDARY IS AN INDEX, NOT A CLOCK. `finally` runs BEFORE the promise
// settles, so runBounded's own last group SIGKILL is already on the seam when
// the awaiting continuation resumes; a timestamp comparison cannot separate the
// two (both land in the same millisecond). Taking the seam LENGTH as a mark the
// instant the await returns partitions the record exactly: everything before
// the mark is in-band, and ANY later entry is a post-return escape.
//
// THE WAIT OUTLASTS THE DEADLINES. Each case then waits strictly longer than
// every deadline that path could have armed — the outer `timeoutMs`, plus the
// nested `graceMs` escalation measured from the moment the timeout fired — using
// the same numbers the test itself passed to runBounded. A surviving timer has
// therefore had its full delay in which to fire before anything is asserted.
//
// NEGATIVE CONTROL. Deleting the timer-clear loop makes each of the five cases
// FAIL: the outer timer fires late and signals a group whose id has since been
// recycled, or the escalation timer fires after return. The mutation is run and
// reported, not assumed.
describe('Phase 31F — runBounded cancels every timer on all five exit paths', () => {
  /** One recorded `process.kill` call. `signal: '0'` only probes; it delivers nothing. */
  type KillRecord = { readonly pid: number; readonly signal: string; readonly at: number };
  /** One recorded `setTimeout` created by the code under test. */
  type TimerRecord = { readonly delayMs: number; firedAt: number | null };

  /** What one observed runBounded call recorded. */
  type Observation = {
    /** Every kill call, in issue order, across the whole observation window. */
    readonly kills: readonly KillRecord[];
    /** Every timer runBounded created, in creation order. */
    readonly timers: readonly TimerRecord[];
    /** `kills.length` sampled the instant the call returned or rejected. */
    readonly mark: number;
    /** Timers that had already fired at the mark, by creation index. */
    readonly firedAtMark: readonly boolean[];
    /** The process-group ids runBounded signalled, recovered from the seam. */
    readonly pgids: readonly number[];
    /** Group ids still present at the mark — before any cleanup hook runs. */
    readonly groupsAliveAtMark: readonly number[];
    /** The resolved stdout, when the call resolved. */
    readonly resolved: string | null;
    /** The rejection message, when the call rejected. */
    readonly rejection: string | null;
  };

  // THE EXACT ORIGINAL OBJECTS, captured before any seam is installed and
  // restored by REFERENCE IDENTITY in `observe`'s finally.
  //
  // `process.kill.bind(process)` was the sequence-83 audit's blocker: `bind`
  // returns a NEW function object, so restoring it left `process.kill`
  // permanently replaced — functionally similar, but not the object Node
  // installed, and every later test in this worker inherited the substitute.
  // `Object.is` separates the two, and only reference identity is restoration.
  //
  // Node's `process.kill` reads no `this`, so the unbound reference calls
  // exactly as the bound one did: only WHAT IS SAVED changes, not behaviour.
  const realKill = process.kill;
  const realSetTimeout = globalThis.setTimeout;

  /** Sleep on the UNWRAPPED timer, so the harness never records its own waits. */
  const waitReal = (ms: number): Promise<void> =>
    new Promise((done) => {
      realSetTimeout(done, ms);
    });

  /** Is this pid or group present? Asked through the UNWRAPPED kill: the
   *  question must not appear on the record it is used to interpret. */
  const isPresent = (target: number): boolean => {
    try {
      realKill(target, 0);
      return true;
    } catch (e) {
      // Fail closed exactly as runBounded does: only ESRCH proves absence.
      return (e as NodeJS.ErrnoException | null)?.code !== 'ESRCH';
    }
  };

  /**
   * Run `call` with the seam installed, mark the record the instant it settles,
   * then wait `waitBeyondMs` — which every caller computes to exceed every
   * deadline the path could have armed.
   *
   * The seam is REMOVED in `finally`, so a failing expectation can never leave
   * `process.kill` wrapped for another test.
   */
  const observe = async (
    call: () => Promise<string>,
    waitBeyondMs: number,
  ): Promise<Observation> => {
    const kills: KillRecord[] = [];
    const timers: TimerRecord[] = [];
    let recording = true;

    process.kill = ((pid: number, signal?: string | number): true => {
      if (recording) {
        kills.push({ pid, signal: String(signal ?? 'SIGTERM'), at: Date.now() });
      }
      return realKill(pid, signal as NodeJS.Signals) as true;
    }) as typeof process.kill;

    globalThis.setTimeout = ((fn: unknown, ms?: number, ...rest: unknown[]): unknown => {
      // Only real callbacks from the code under test are tracked. A string
      // callback (the legacy eval form) and anything created while not
      // recording pass straight through, untouched and unrecorded.
      if (!recording || typeof fn !== 'function') {
        return (realSetTimeout as (...a: unknown[]) => unknown)(fn, ms, ...rest);
      }
      const record: TimerRecord = { delayMs: ms ?? 0, firedAt: null };
      timers.push(record);
      return (realSetTimeout as (...a: unknown[]) => unknown)(
        (...args: unknown[]): unknown => {
          // Stamped BEFORE the callback body, so a callback that throws is
          // still recorded as having fired. Nothing here swallows an error:
          // the callback's own exception propagates exactly as it would
          // without the seam.
          record.firedAt = Date.now();
          return (fn as (...a: unknown[]) => unknown)(...args);
        },
        ms,
        ...rest,
      );
    }) as typeof globalThis.setTimeout;

    try {
      let resolved: string | null = null;
      let rejection: string | null = null;
      try {
        resolved = await call();
      } catch (e) {
        rejection = (e as Error).message;
      }

      // ── THE MARK ──────────────────────────────────────────────────────────
      // runBounded's `finally` has already run (it precedes settlement), so
      // every in-band signal — including its closing group SIGKILL — is on the
      // record. Any entry appended from here on escaped the call.
      const mark = kills.length;
      const firedAtMark = timers.map((t) => t.firedAt !== null);

      // The group ids runBounded signalled, recovered from the seam itself
      // rather than from a pid the test guessed. Group sends are negative.
      const pgids = [...new Set(kills.slice(0, mark).filter((k) => k.pid < 0).map((k) => -k.pid))];
      // Asked HERE, at the mark, before any afterEach or runner cleanup could
      // reap the tree: absence must be established by the code under test.
      const groupsAliveAtMark = pgids.filter((g) => isPresent(g));

      await waitReal(waitBeyondMs);

      return {
        kills,
        timers,
        mark,
        firedAtMark,
        pgids,
        groupsAliveAtMark,
        resolved,
        rejection,
      };
    } finally {
      recording = false;
      process.kill = realKill;
      globalThis.setTimeout = realSetTimeout;
    }
  };

  /**
   * The seam left the globals EXACTLY as it found them — by reference.
   *
   * Compared against the module-level pre-seam capture, not against the seam's
   * own saved value, so a seam that restored a bound copy of `process.kill`
   * (the sequence-83 blocker) fails here even though it restored something
   * that works. `typeof`, `.name` and `toString()` cannot tell the two apart;
   * `Object.is` can, and nothing weaker counts as restoration.
   */
  const expectGlobalsRestored = (label: string): void => {
    expect(
      Object.is(process.kill, PRISTINE_PROCESS_KILL),
      `${label}: process.kill is not REFERENCE-IDENTICAL to the pre-seam object ` +
        '(a bound or wrapped replacement is not a restoration)',
    ).toBe(true);
    expect(
      Object.is(globalThis.setTimeout, PRISTINE_SET_TIMEOUT),
      `${label}: globalThis.setTimeout is not REFERENCE-IDENTICAL to the pre-seam object`,
    ).toBe(true);
  };

  /** Signals that DELIVER. A `0` probe asks a question and is not a signal. */
  const delivering = (records: readonly KillRecord[]): readonly KillRecord[] =>
    records.filter((k) => k.signal !== '0');

  const describeKills = (records: readonly KillRecord[]): string =>
    records.map((k) => `${k.signal}->${k.pid}`).join(', ') || '(none)';

  /**
   * The assertions every exit path shares: nothing crossed the mark.
   *
   * A post-mark delivering signal is a delayed SIGTERM/SIGKILL from a timer
   * that outlived the call — the exact defect. A post-mark timer firing is the
   * same defect observed one step earlier, and catches a leaked timer whose
   * signal happened to hit an already-absent group.
   */
  const expectNothingEscaped = (o: Observation, label: string): void => {
    const postKills = delivering(o.kills.slice(o.mark));
    expect(
      postKills.length,
      `${label}: ${postKills.length} signal(s) issued AFTER runBounded returned: ` +
        `${describeKills(postKills)} (in-band: ${describeKills(o.kills.slice(0, o.mark))})`,
    ).toBe(0);

    const lateTimers = o.timers.filter((t, i) => o.firedAtMark[i] === false && t.firedAt !== null);
    expect(
      lateTimers.length,
      `${label}: ${lateTimers.length} timer callback(s) ran AFTER runBounded returned ` +
        `(delays: ${lateTimers.map((t) => `${t.delayMs}ms`).join(', ')})`,
    ).toBe(0);

    // No SIGTERM and no SIGKILL after return, named explicitly — the two
    // signals the audit requires be proven absent.
    for (const signal of ['SIGTERM', 'SIGKILL'] as const) {
      const late = o.kills.slice(o.mark).filter((k) => k.signal === signal);
      expect(late.length, `${label}: ${signal} issued after return to ${describeKills(late)}`).toBe(0);
    }

    // The seam must have observed SOMETHING for this call, or every absence
    // assertion above is vacuous. Every path arms at least the outer timer.
    expect(o.timers.length, `${label}: the seam recorded no timers at all`).toBeGreaterThan(0);
  };

  /** Every group runBounded created is gone at the mark, before any cleanup. */
  const expectGroupsGone = (o: Observation, label: string): void => {
    expect(
      o.groupsAliveAtMark,
      `${label}: process group(s) ${o.groupsAliveAtMark.join(', ')} outlived runBounded`,
    ).toEqual([]);
  };

  // Timings. Deliberately short so the whole suite stays inside its budget,
  // and every post-return wait is derived from these same numbers.
  const OUTER_MS = 1_200;   // the outer timeoutMs for the four non-timeout paths
  const GRACE_MS = 200;     // the escalation grace for those paths
  const SLACK_MS = 400;     // margin past the last deadline
  const TIMEOUT_OUTER_MS = 600;   // the timeout path's own outer deadline
  const TIMEOUT_GRACE_MS = 900;   // its escalation grace — deliberately LONG

  // For a path that never times out, the only armed deadline is the outer
  // timer (the escalation timer exists only inside the timeout handler). The
  // wait starts at the mark, and the outer timer was armed at most OUTER_MS
  // before it, so OUTER_MS + slack strictly outlasts it. GRACE_MS is added
  // because a leaked outer timer would itself arm an escalation timer.
  const WAIT_NON_TIMEOUT_MS = OUTER_MS + GRACE_MS + SLACK_MS;

  it('SUCCESS PATH: after runBounded resolves, no timer fires and no signal is issued', async () => {
    // The child writes its own pid and exits 0 straight away. No descendant, so
    // the absence proof is about the CALL's timers, not about a surviving tree.
    const o = await observe(
      () =>
        runBounded(process.execPath, ['-e', 'process.stdout.write(String(process.pid));'], {
          cwd: REPO_ROOT,
          timeoutMs: OUTER_MS,
          graceMs: GRACE_MS,
          verifyMs: 5_000,
          probeMs: 25,
        }),
      // Waits OUTER_MS + GRACE_MS + SLACK_MS past the mark: strictly beyond the
      // outer deadline (armed ≤ OUTER_MS before the mark) and beyond the
      // escalation a leaked outer timer would arm.
      WAIT_NON_TIMEOUT_MS,
    );

    expect(o.rejection, `runBounded rejected on the success path: ${o.rejection}`).toBeNull();
    expect(Number(String(o.resolved).trim())).toBeGreaterThan(0);
    expectGroupsGone(o, 'success');
    expectNothingEscaped(o, 'success');
    // THE RESOLVED PATH restored the exact original globals, by reference.
    expectGlobalsRestored('success');
  }, 60_000);

  it('NON-ZERO EXIT PATH: after runBounded rejects on exit 3, no timer fires and no signal is issued', async () => {
    const o = await observe(
      () =>
        runBounded(
          process.execPath,
          ['-e', 'process.stderr.write("child " + process.pid);setTimeout(() => process.exit(3), 50);'],
          { cwd: REPO_ROOT, timeoutMs: OUTER_MS, graceMs: GRACE_MS, verifyMs: 5_000, probeMs: 25 },
        ),
      WAIT_NON_TIMEOUT_MS,
    );

    expect(o.rejection, 'runBounded did not reject on a nonzero exit').toMatch(
      /exited 3|left process group/,
    );
    expectGroupsGone(o, 'nonzero-exit');
    expectNothingEscaped(o, 'nonzero-exit');
    // THE REJECTED PATH — the one the sequence-83 audit found leaking a bound
    // replacement — restored the exact original globals, by reference.
    expectGlobalsRestored('nonzero-exit');
  }, 60_000);

  it('SIGNAL-DEATH PATH: after runBounded rejects on a signal-killed child, no timer fires and no signal is issued', async () => {
    // The child SIGKILLs itself, so `close` reports a signal and no exit code —
    // the `signal !== null` rejection branch. It also holds a long timer, so it
    // would still be alive had it not killed itself.
    const o = await observe(
      () =>
        runBounded(
          process.execPath,
          [
            '-e',
            'setTimeout(() => process.kill(process.pid, "SIGKILL"), 50);setTimeout(() => {}, 600000);',
          ],
          { cwd: REPO_ROOT, timeoutMs: OUTER_MS, graceMs: GRACE_MS, verifyMs: 5_000, probeMs: 25 },
        ),
      WAIT_NON_TIMEOUT_MS,
    );

    expect(o.rejection, 'runBounded did not reject on a signal death').toMatch(
      /terminated by SIG|left process group/,
    );
    expectGroupsGone(o, 'signal-death');
    expectNothingEscaped(o, 'signal-death');
  }, 60_000);

  it('TIMEOUT PATH: after the lapse rejection, the nested escalation timer never fires and no late SIGKILL is issued', async () => {
    // THE CASE THE AUDIT CALLED VACUOUS, now observed.
    //
    // The child OBEYS SIGTERM, so it dies during the timeout handler's grace
    // window and runBounded returns while the nested escalation timer is STILL
    // PENDING — precisely the timer whose cancellation is in question. (A
    // SIGTERM-ignoring child would let that timer fire in band, proving
    // nothing about cancellation.) TIMEOUT_GRACE_MS is 900ms, comfortably
    // longer than the time the call needs to observe absence and return.
    const o = await observe(
      () =>
        runBounded(process.execPath, ['-e', 'setTimeout(() => {}, 600000);'], {
          cwd: REPO_ROOT,
          timeoutMs: TIMEOUT_OUTER_MS,
          graceMs: TIMEOUT_GRACE_MS,
          verifyMs: 5_000,
          probeMs: 25,
        }),
      // The outer timer fired at TIMEOUT_OUTER_MS and armed the escalation
      // TIMEOUT_GRACE_MS later; the mark comes after the outer firing, so
      // waiting TIMEOUT_OUTER_MS + TIMEOUT_GRACE_MS + SLACK_MS past the mark
      // strictly outlasts BOTH deadlines.
      TIMEOUT_OUTER_MS + TIMEOUT_GRACE_MS + SLACK_MS,
    );

    expect(o.rejection, 'runBounded did not reject on the lapse').toMatch(
      new RegExp(`exceeded ${TIMEOUT_OUTER_MS}ms|left process group`),
    );

    // The escalation timer was armed and was still PENDING at the mark — the
    // premise of this case. Without it the test would prove nothing, so it is
    // asserted rather than assumed.
    const escalation = o.timers.filter((t) => t.delayMs === TIMEOUT_GRACE_MS);
    expect(
      escalation.length,
      `expected the ${TIMEOUT_GRACE_MS}ms escalation timer to be armed; saw delays ` +
        `${o.timers.map((t) => t.delayMs).join(', ')}`,
    ).toBeGreaterThan(0);
    const pendingEscalation = escalation.filter(
      (t) => o.firedAtMark[o.timers.indexOf(t)] === false,
    );
    expect(
      pendingEscalation.length,
      'the escalation timer had already fired in band, so its cancellation is untested here',
    ).toBeGreaterThan(0);

    expectGroupsGone(o, 'timeout');
    expectNothingEscaped(o, 'timeout');
  }, 60_000);

  it('SPAWN-ERROR PATH: after a spawn failure rejects, the outer timer never fires and no signal is issued', async () => {
    // The executable does not exist, so the child emits 'error' and runBounded
    // rejects within milliseconds — while the outer timer is freshly armed and
    // has its whole delay still ahead of it. Proves `finally` cancels even when
    // the child never started and there is no group to signal.
    const missing = resolve(REPO_ROOT, 'phase-31f-no-such-executable-a4f1c7');

    const o = await observe(
      () =>
        runBounded(missing, [], {
          cwd: REPO_ROOT,
          timeoutMs: OUTER_MS,
          graceMs: GRACE_MS,
          verifyMs: 5_000,
          probeMs: 25,
        }),
      WAIT_NON_TIMEOUT_MS,
    );

    expect(o.rejection, 'runBounded did not reject on a spawn failure').toMatch(/ENOENT|spawn/);
    // No group was ever created, so there is nothing to signal — and the seam
    // must show exactly that, for the whole window.
    expect(
      delivering(o.kills).length,
      `a failed spawn issued signals: ${describeKills(delivering(o.kills))}`,
    ).toBe(0);
    expectNothingEscaped(o, 'spawn-error');
  }, 60_000);

  it('POSITIVE CONTROL: the seam RECORDS the in-band SIGTERM and SIGKILL escalation runBounded legitimately issues', async () => {
    // Without this, every absence assertion above could be satisfied by a seam
    // that observes nothing. Here the child IGNORES SIGTERM, so the timeout
    // handler must escalate in band: SIGTERM, grace, then SIGKILL — and the
    // seam is required to have SEEN both, plus the timers that drove them.
    const o = await observe(
      () =>
        runBounded(
          process.execPath,
          ['-e', 'process.on("SIGTERM", () => {});setTimeout(() => {}, 600000);'],
          {
            cwd: REPO_ROOT,
            timeoutMs: TIMEOUT_OUTER_MS,
            graceMs: 150,
            verifyMs: 5_000,
            probeMs: 25,
          },
        ),
      TIMEOUT_OUTER_MS + 150 + SLACK_MS,
    );

    expect(o.rejection, 'the SIGTERM-ignoring child did not force a lapse').toMatch(
      new RegExp(`exceeded ${TIMEOUT_OUTER_MS}ms|left process group`),
    );

    const inBand = o.kills.slice(0, o.mark);
    // The seam is LIVE: it saw the real escalation, addressed to the group.
    expect(
      inBand.some((k) => k.signal === 'SIGTERM' && k.pid < 0),
      `seam recorded no in-band group SIGTERM; saw ${describeKills(inBand)}`,
    ).toBe(true);
    expect(
      inBand.some((k) => k.signal === 'SIGKILL' && k.pid < 0),
      `seam recorded no in-band group SIGKILL; saw ${describeKills(inBand)}`,
    ).toBe(true);
    // And it saw the timers that drove them fire, in band.
    const firedInBand = o.timers.filter((_, i) => o.firedAtMark[i] === true);
    expect(
      firedInBand.length,
      'seam recorded no timer callbacks firing in band on the escalation path',
    ).toBeGreaterThanOrEqual(2);

    // The escalation was in band, so the post-mark record must STILL be clean.
    expectGroupsGone(o, 'positive-control');
    expectNothingEscaped(o, 'positive-control');
    expectGlobalsRestored('positive-control');
  }, 60_000);

  it('THROWING PATH: an expectation that throws INSIDE the observed call still leaves the globals reference-identical', async () => {
    // The third exit path out of `observe`: not a resolved call and not a
    // rejected one, but a `call` whose body threw for a reason of the test's
    // own — the case where a failing assertion could otherwise strand the seam
    // installed for every later test in this worker.
    //
    // `observe` catches the throw into `o.rejection` exactly as it catches
    // runBounded's own rejections, so the assertion here is about the FINALLY:
    // whatever happened inside, the globals must be the pre-seam objects.
    const marker = 'phase-31f-throwing-path-probe-9c1e';
    const o = await observe(async () => {
      // A real bounded call first, so the seam has genuinely observed
      // something and the restoration is not trivially about an empty window.
      await runBounded(process.execPath, ['-e', 'process.stdout.write("ok");'], {
        cwd: REPO_ROOT,
        timeoutMs: OUTER_MS,
        graceMs: GRACE_MS,
        verifyMs: 5_000,
        probeMs: 25,
      });
      throw new Error(marker);
    }, WAIT_NON_TIMEOUT_MS);

    expect(o.rejection, 'the throwing path did not surface its own error').toBe(marker);
    // The seam was live for the call that preceded the throw.
    expect(o.timers.length, 'the seam recorded no timers on the throwing path').toBeGreaterThan(0);
    expectGroupsGone(o, 'throwing');
    expectNothingEscaped(o, 'throwing');
    // THE THROWING PATH restored the exact original globals, by reference.
    expectGlobalsRestored('throwing');
  }, 60_000);

  it('the seam SAVES the ORIGINAL process.kill object, not a bound replacement', () => {
    // The defect stated positively, over the values the seam actually holds.
    // `process.kill.bind(process)` would produce a function that WORKS and
    // whose `typeof` and arity match, so only reference identity distinguishes
    // it — asserted here against the module-level pre-seam capture, and
    // demonstrated to be discriminating on the very next line.
    expect(
      Object.is(realKill, PRISTINE_PROCESS_KILL),
      'the seam saved something other than the original process.kill object',
    ).toBe(true);
    expect(
      Object.is(realSetTimeout, PRISTINE_SET_TIMEOUT),
      'the seam saved something other than the original globalThis.setTimeout object',
    ).toBe(true);

    // THE ASSERTION IS DISCRIMINATING: a bound copy of the very same function
    // is NOT reference-identical, which is precisely why saving one leaked.
    // (`typeof` and `.name` agree — the weaker comparisons the packet forbids.)
    const bound = PRISTINE_PROCESS_KILL.bind(process);
    expect(Object.is(bound, PRISTINE_PROCESS_KILL)).toBe(false);
    expect(typeof bound).toBe(typeof PRISTINE_PROCESS_KILL);

    // And the globals are untouched right now, outside any observed call.
    expectGlobalsRestored('no-call-in-flight');
  });
});
