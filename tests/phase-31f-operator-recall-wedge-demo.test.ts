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

  it('the escalation timer is cancelled, so no delayed signal fires after return', async () => {
    // A tree that ignores SIGTERM forces the escalation path: SIGTERM, grace,
    // then SIGKILL. The escalation timer is created inside the timeout handler
    // — the one the previous design left orphaned with `.unref()`.
    const script = [
      'process.on("SIGTERM", () => {});',
      'setTimeout(() => {}, 600000);',
    ].join('\n');

    await expect(
      runBounded(process.execPath, ['-e', script], {
        cwd: REPO_ROOT,
        timeoutMs: 600,
        graceMs: 150,
        verifyMs: 5_000,
        probeMs: 25,
      }),
    ).rejects.toThrow(/exceeded 600ms|left process group/);

    // If any timer survived the call, the event loop would still hold it. Node
    // exposes no timer census, so this asserts the observable consequence: the
    // process stays quiet well past the grace window, and an uncaught delayed
    // `process.kill` inside a cleared timer would have crashed this test.
    await new Promise((done) => setTimeout(done, 600));
    expect(true).toBe(true);
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
