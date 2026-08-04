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
 */
async function runBounded(
  file: string,
  args: readonly string[],
  options: { cwd: string; timeoutMs: number; graceMs?: number },
): Promise<string> {
  const graceMs = options.graceMs ?? 2_000;
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
  const timer = setTimeout(() => {
    timedOut = true;
    if (pgid !== null) {
      try {
        process.kill(-pgid, 'SIGTERM');
      } catch {
        /* group already gone */
      }
      setTimeout(() => {
        try {
          process.kill(-pgid, 'SIGKILL');
        } catch {
          /* group already gone */
        }
      }, graceMs).unref();
    }
  }, options.timeoutMs);

  try {
    const { code, signal } = await settled;
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
    clearTimeout(timer);
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
