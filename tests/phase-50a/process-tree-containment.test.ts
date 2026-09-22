// Phase 50A — REAL PROCESS-TREE CONTAINMENT.
//
// Authority: coordinator task packet comment 5184357042 (packet digest
// sha256:012433fec0b46ef7fdaea0444165fb986c086145507c3da38c7b352958b4fd25),
// posted by event 5184414449 at lane sequence 60, under the operator.decision
// at sequence 59 (comment 5183886488). That decision refused packet 5182125244
// for an unsatisfiable evidence contract and authorized this replacement slice.
//
// ── WHY THIS SUITE EXISTS ───────────────────────────────────────────────
//
// The sequence-54 audit REJECTED the previous slice for a blocker the previous
// suites could not have caught. The old executor handed its bound to the
// synchronous launch primitive, which terminates the DIRECT child only. In
// automatic run 30907873453 / job 91987141482 a test command exceeded its
// bound, the direct receipt was correctly classified, and SIX real descendants
// (Vitest, esbuild, an npm demo, a shell, Node, a second esbuild) stayed alive
// until the hosted runner's cleanup killed them.
//
// The old suites stayed green through all of that, for a precise reason: they
// SYNTHESIZED timeout outcomes and asserted only that no successor launched.
// A synthesized outcome cannot exhibit the defect, because the defect was that
// a real grandchild outlived a terminated direct child. Stubs assert what the
// author already believes.
//
// So this suite uses REAL PROCESSES. `fixtures/process-tree-timeout-fixture.mjs`
// spawns a genuine child which spawns a genuine grandchild; the tests read the
// actual pids the three generations recorded, drive them through the PRODUCTION
// `realRun`, and then probe those pids themselves. It is LOAD-BEARING: the
// stubbed classification tests elsewhere supplement it and may never replace
// it.
//
// The two claims that matter, and both are checked against the operating
// system rather than against the executor's own report:
//
//   1. after a lapsed bound, the ENTIRE tree is gone — and gone BEFORE the
//      refusal is returned, not merely eventually;
//   2. when absence CANNOT be proven, the executor refuses with its own
//      distinct containment code instead of reporting an ordinary lapse.

import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  GRACE_MS,
  PROBE_MS,
  REFUSAL,
  SCHEDULE,
  VERIFY_MS,
  classify,
  groupAlive,
  realRun,
  refusalFor,
  runFixedProof,
  signalGroup,
} from '../../scripts/phase-50a/fixed-proof-executor.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const FIXTURE = resolve(HERE, 'fixtures/process-tree-timeout-fixture.mjs');

/** A stand-in credential; nothing here can authenticate anywhere. */
const FAKE_INGRESS = 'ingress-value-for-tests-only';

/**
 * Short, real bounds. Small enough to keep the suite fast, large enough for
 * three real processes to start and record themselves first.
 */
const BOUND_MS = 1_500;
const TEST_GRACE_MS = 300;
const TEST_VERIFY_MS = 4_000;
const TEST_PROBE_MS = 25;

let workdir: string;
let record: string;

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'phase-50a-ptree-'));
  record = join(workdir, 'generations.jsonl');
});

afterEach(() => {
  // Belt and braces: if a test failed to contain the tree, do not leak it into
  // the rest of the run. Reading the record and killing by pid is exactly what
  // the production code is supposed to have made unnecessary.
  for (const gen of readGenerations()) {
    try {
      process.kill(gen.pid, 'SIGKILL');
    } catch {
      /* already gone — the expected case */
    }
  }
  rmSync(workdir, { recursive: true, force: true });
});

interface Generation {
  generation: string;
  pid: number;
  pgid: number;
}

function readGenerations(): Generation[] {
  if (!existsSync(record)) return [];
  return readFileSync(record, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Generation);
}

/**
 * This process's own process-group id, read from the Linux process table
 * (`/proc/self/stat` field 5). Node exposes no `getpgrp`, and the comm field can
 * itself contain spaces or parentheses, hence the split on the LAST closing
 * parenthesis.
 */
function ownProcessGroup(): number {
  const stat = readFileSync('/proc/self/stat', 'utf8');
  const afterComm = stat.slice(stat.lastIndexOf(')') + 2);
  // fields: state, ppid, pgrp, ...
  const pgrp = Number(afterComm.split(' ')[2]);
  if (!Number.isInteger(pgrp) || pgrp <= 0) throw new Error(`unreadable pgrp: ${pgrp}`);
  return pgrp;
}

/** Is this single process still present? Signal 0 checks without delivering. */
function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === 'ESRCH') return false;
    // Fail closed in the test too: unknown means "cannot prove gone".
    return true;
  }
}

async function waitForGenerations(count: number, budgetMs = 5_000): Promise<Generation[]> {
  const started = Date.now();
  for (;;) {
    const gens = readGenerations();
    if (gens.length >= count) return gens;
    if (Date.now() - started > budgetMs) return gens;
    await new Promise((done) => setTimeout(done, 25));
  }
}

/**
 * The fixture's modes. `orphan` is the natural-exit case: the ROOT exits
 * cleanly with status 0 while its descendants keep running, so no bound has to
 * lapse for a live descendant to be left behind.
 */
type FixtureMode = 'hang' | 'trap' | 'orphan';

/** A fixture entry for the production runner: fixed executable, fixed argv. */
function fixtureEntry(label: string, mode: FixtureMode, timeoutMs = BOUND_MS) {
  return {
    label,
    file: process.execPath,
    args: [FIXTURE],
    timeout_ms: timeoutMs,
    mode,
  };
}

/**
 * The environment the fixture needs. Built here rather than by `childEnv`,
 * because `childEnv` intentionally forwards only what the source environment
 * holds — so the fixture's own variables are placed in that source environment.
 */
function fixtureBaseEnv(mode: FixtureMode): Record<string, string | undefined> {
  return {
    PATH: process.env.PATH,
    PHASE_50A_FIXTURE_RECORD: record,
    PHASE_50A_FIXTURE_MODE: mode,
    PHASE_50A_FIXTURE_GENERATION: 'root',
  };
}

// ── 1. The real tree is terminated, and proven gone BEFORE the refusal ──

describe('Phase 50A containment — a real child+grandchild tree is verifiably gone', () => {
  it(
    'a lapsed bound terminates the WHOLE GROUP and proves absence before returning',
    async () => {
      const entry = fixtureEntry('real-tree-hang', 'hang');
      const runPromise = realRun(entry, {
        token: FAKE_INGRESS,
        baseEnv: fixtureBaseEnv('hang'),
        graceMs: TEST_GRACE_MS,
        verifyMs: TEST_VERIFY_MS,
        probeMs: TEST_PROBE_MS,
      });

      // Three REAL generations must actually exist. If the fixture only ever
      // produced one process, this suite would be proving nothing.
      const gens = await waitForGenerations(3);
      expect(gens.map((g) => g.generation)).toEqual(['root', 'child', 'grandchild']);
      const [root, child, grandchild] = gens as [Generation, Generation, Generation];
      expect(root.pid).toBeGreaterThan(0);
      expect(child.pid).not.toBe(root.pid);
      expect(grandchild.pid).not.toBe(child.pid);
      // GROUP INHERITANCE is the mechanism under test: one group id must name
      // the whole tree, so every generation reports the leader's group.
      expect(child.pgid).toBe(root.pgid);
      expect(grandchild.pgid).toBe(root.pgid);
      expect(root.pgid).toBe(root.pid);

      const outcome = await runPromise;

      // THE CENTRAL ASSERTION, made against the operating system rather than
      // against the executor's own report: at the instant the runner resolved,
      // every real process in the tree is already gone. This is what the
      // rejected design could not do — its grandchild was still alive here.
      for (const gen of gens) {
        expect(pidAlive(gen.pid), `${gen.generation} (pid ${gen.pid}) must be gone`).toBe(false);
      }
      expect(groupAlive(root.pgid), 'the process group must be gone').toBe(false);

      // And the executor's own containment facts agree with the OS.
      expect(outcome.timed_out).toBe(true);
      expect(outcome.group_signalled).toBe(true);
      expect(outcome.direct_child_reaped).toBe(true);
      expect(outcome.group_verified_absent).toBe(true);
      expect(outcome.termination_error ?? null).toBeNull();

      // Classified as a lapse — NOT as a containment failure, because
      // containment succeeded.
      const verdict = classify(outcome);
      expect(verdict.timedOut).toBe(true);
      expect(verdict.containmentFailed).toBe(false);
      expect(verdict.terminationFailed).toBe(false);
      expect(verdict.spawnFailed).toBe(false);
      expect(refusalFor(verdict)).toBe(REFUSAL.commandTimedOut);
    },
    30_000,
  );

  it(
    'ESCALATION IS REQUIRED: a tree that traps the polite signal is still gone',
    async () => {
      // Every generation installs a handler for the polite signal and keeps
      // running. A design that sends only the first signal leaves this tree
      // alive and fails here — which is precisely the point of the test.
      const entry = fixtureEntry('real-tree-trap', 'trap');
      const runPromise = realRun(entry, {
        token: FAKE_INGRESS,
        baseEnv: fixtureBaseEnv('trap'),
        graceMs: TEST_GRACE_MS,
        verifyMs: TEST_VERIFY_MS,
        probeMs: TEST_PROBE_MS,
      });

      const gens = await waitForGenerations(3);
      expect(gens).toHaveLength(3);

      const outcome = await runPromise;

      expect(outcome.escalated, 'the uncatchable escalation was needed').toBe(true);
      expect(outcome.group_verified_absent).toBe(true);
      expect(outcome.direct_child_reaped).toBe(true);
      for (const gen of gens) {
        expect(pidAlive(gen.pid), `${gen.generation} survived escalation`).toBe(false);
      }
      expect(classify(outcome).timedOut).toBe(true);
    },
    30_000,
  );

  it(
    'a tree that exits on its own needs no signalling and no escalation',
    async () => {
      // Control case: a fast, well-behaved command. Containment must still be
      // VERIFIED — absence is proven on every launch, not only on a lapse — but
      // nothing should have been signalled or escalated.
      const outcome = await realRun(
        { label: 'quick-exit', file: process.execPath, args: ['-e', 'process.exit(0)'], timeout_ms: 30_000 },
        { token: FAKE_INGRESS, baseEnv: { PATH: process.env.PATH }, probeMs: TEST_PROBE_MS },
      );
      expect(outcome.status).toBe(0);
      expect(outcome.timed_out).toBe(false);
      expect(outcome.group_signalled).toBe(false);
      expect(outcome.escalated).toBe(false);
      expect(outcome.direct_child_reaped).toBe(true);
      expect(outcome.group_verified_absent).toBe(true);
      const verdict = classify(outcome);
      expect(verdict).toEqual({
        spawnFailed: false,
        terminationFailed: false,
        containmentFailed: false,
        timedOut: false,
        signalled: false,
        failed: false,
      });
      expect(refusalFor(verdict)).toBeNull();
    },
    30_000,
  );

  // ── THE NATURAL-EXIT / LIVE-DESCENDANT CASE ─────────────────────────
  //
  // The sequence-63 audit REJECTED the previous slice over exactly this gap.
  // The old `realRun` gated ALL termination behind `if (timedOut)`, so when the
  // direct child exited FIRST — normally, status 0, no lapse — a surviving
  // descendant was only probed, reported as `group_verified_absent: false`, and
  // LEFT RUNNING. The suite could not catch it: one case covered a wholly live
  // timeout tree, the other a single-process quick exit, and neither is a
  // parent that finishes while its child keeps going.
  //
  // Verified against the substrate executor at 032cec5d before this test was
  // written: it reported `group_signalled: false` and left the child and
  // grandchild ALIVE. This test fails against that code and passes only once
  // termination is owed to the SURVIVAL of the group rather than to the reason
  // the executor stopped waiting.
  it(
    'a direct child that exits NORMALLY while a descendant lives still leaves ZERO survivors',
    async () => {
      // 30s bound the fixture never approaches: the root exits on its own in
      // ~250ms, so nothing here is a timeout. If this test ever reports
      // timed_out, the fixture — not the executor — is what changed.
      const entry = fixtureEntry('real-tree-orphan', 'orphan', 30_000);
      const runPromise = realRun(entry, {
        token: FAKE_INGRESS,
        baseEnv: fixtureBaseEnv('orphan'),
        graceMs: TEST_GRACE_MS,
        verifyMs: TEST_VERIFY_MS,
        probeMs: TEST_PROBE_MS,
      });

      // Three REAL generations, sharing one group, must exist — otherwise this
      // test would prove nothing about descendants.
      const gens = await waitForGenerations(3);
      expect(gens.map((g) => g.generation)).toEqual(['root', 'child', 'grandchild']);
      const [root, child, grandchild] = gens as [Generation, Generation, Generation];
      expect(child.pid).not.toBe(root.pid);
      expect(grandchild.pid).not.toBe(child.pid);
      expect(child.pgid).toBe(root.pgid);
      expect(grandchild.pgid).toBe(root.pgid);

      const outcome = await runPromise;

      // THE PRECONDITION THAT MAKES THIS TEST THE ONE THAT MATTERS: the direct
      // child ended by ITSELF, cleanly. No bound lapsed.
      expect(outcome.status, 'the direct child exited normally').toBe(0);
      expect(outcome.timed_out, 'no bound lapsed — this is not the timeout path').toBe(false);
      expect(outcome.direct_child_reaped).toBe(true);

      // A descendant survived that exit, so the WHOLE GROUP was owed a signal.
      expect(outcome.group_signalled, 'the surviving group was signalled').toBe(true);

      // Absence is PROVEN, and proven before the outcome was produced.
      expect(outcome.group_verified_absent).toBe(true);
      expect(outcome.termination_error).toBeNull();

      // THE OPERATING SYSTEM IS THE WITNESS, not the executor's own report, and
      // it is questioned at the moment the outcome exists — before any receipt
      // is written. `afterEach` never runs first, so no cleanup can launder a
      // leak into a pass here.
      for (const gen of gens) {
        expect(pidAlive(gen.pid), `${gen.generation} (pid ${gen.pid}) survived`).toBe(false);
      }
      expect(groupAlive(root.pgid), 'the process group survived').toBe(false);

      // A clean, fully contained natural exit: no refusal is owed.
      const verdict = classify(outcome);
      expect(verdict.containmentFailed).toBe(false);
      expect(verdict.terminationFailed).toBe(false);
      expect(verdict.timedOut).toBe(false);
      expect(refusalFor(verdict)).toBeNull();
    },
    60_000,
  );
});

// ── 2. Unprovable containment FAILS CLOSED, distinctly ─────────────────

describe('Phase 50A containment — an unprovable tree is its own refusal', () => {
  it(
    'a group that cannot be proven absent yields containment-unverified, not a lapse',
    async () => {
      // The absence probe is forced to keep reporting "still present". The real
      // tree is really terminated (the signal primitive is untouched), so this
      // isolates exactly one variable: what the executor does when it CANNOT
      // establish absence. It must refuse with its own code.
      const entry = fixtureEntry('unverifiable', 'hang');
      const runPromise = realRun(entry, {
        token: FAKE_INGRESS,
        baseEnv: fixtureBaseEnv('hang'),
        graceMs: TEST_GRACE_MS,
        verifyMs: 500,
        probeMs: TEST_PROBE_MS,
        alive: () => true,
      });
      const gens = await waitForGenerations(3);
      const outcome = await runPromise;

      expect(outcome.timed_out).toBe(true);
      expect(outcome.group_verified_absent, 'absence was not established').toBe(false);

      const verdict = classify(outcome);
      expect(verdict.containmentFailed).toBe(true);
      // NEVER folded into the lapse that led to it, and never a pass.
      expect(verdict.timedOut).toBe(false);
      expect(refusalFor(verdict)).toBe(REFUSAL.commandContainmentUnverified);
      expect(refusalFor(verdict)).not.toBe(REFUSAL.commandTimedOut);

      // The tree itself was still really terminated: fail-closed reporting must
      // not come at the cost of leaving processes behind.
      for (const gen of gens) {
        try {
          process.kill(gen.pid, 'SIGKILL');
        } catch {
          /* expected: already terminated by the production path */
        }
      }
    },
    30_000,
  );

  it(
    'a REFUSED group signal yields termination-failed, outranking containment',
    async () => {
      // The operating system refuses the group signal. That is a more specific
      // diagnosis than "absence unproven" (which it also causes), so it must
      // win the precedence order.
      const entry = fixtureEntry('termination-refused', 'hang');
      const runPromise = realRun(entry, {
        token: FAKE_INGRESS,
        baseEnv: fixtureBaseEnv('hang'),
        graceMs: TEST_GRACE_MS,
        verifyMs: 500,
        probeMs: TEST_PROBE_MS,
        signal: () => ({ ok: false, code: 'EPERM' }),
        alive: () => true,
      });
      const gens = await waitForGenerations(3);
      const outcome = await runPromise;

      expect(outcome.termination_error).toBe('EPERM');
      expect(outcome.group_signalled).toBe(false);

      const verdict = classify(outcome);
      expect(verdict.terminationFailed).toBe(true);
      expect(verdict.containmentFailed).toBe(false);
      expect(verdict.timedOut).toBe(false);
      expect(refusalFor(verdict)).toBe(REFUSAL.commandTerminationFailed);

      // This test deliberately prevented production from killing the tree, so
      // it cleans up after itself.
      for (const gen of gens) {
        try {
          process.kill(gen.pid, 'SIGKILL');
        } catch {
          /* already gone */
        }
      }
    },
    30_000,
  );

  it('the group primitives themselves fail closed on an unknown error', () => {
    // `groupAlive` must report "present" for anything other than a definite
    // "no such process group", so an unprovable absence can never read as
    // proven. Probed against the current process's own group, which certainly
    // exists, and against a group id that certainly does not.
    expect(groupAlive(ownProcessGroup())).toBe(true);
    // An absurd group id: absence here is definite, so it must report false.
    expect(groupAlive(0x7ffffff0)).toBe(false);
    // Signalling an absent group is success-with-nothing-delivered, never an
    // error: the desired end state is already reached.
    const result = signalGroup(0x7ffffff0, 'SIGTERM');
    expect(result.ok).toBe(true);
    expect(result.delivered).toBe(false);
  });
});

// ── 3. No successor launches, and the containment facts reach receipts ──

describe('Phase 50A containment — a contained failure stops the schedule', () => {
  it(
    'a real lapsed entry launches no successor and records the containment facts',
    async () => {
      // The production `runFixedProof` loop, driven with a real tree for the
      // FIRST schedule entry. Exactly one launch may occur, and its receipt
      // must carry the containment evidence rather than a bare status.
      const launched: string[] = [];
      const result = await runFixedProof({
        env: {
          PHASE_50A_EXPECTED_HEAD_SHA: headSha(),
          PHASE_50A_NPM_TOKEN: FAKE_INGRESS,
        },
        repoRoot: ROOT,
        run: async (entry, context) => {
          launched.push(entry.label);
          if (entry.capture === true) {
            // The identity probe: run it for real so the gate passes honestly.
            return realRun(entry, { ...context, baseEnv: { PATH: process.env.PATH } });
          }
          // The first schedule entry becomes the real hanging tree.
          return realRun(
            { ...fixtureEntry(entry.label, 'hang'), capture: false },
            {
              ...context,
              baseEnv: fixtureBaseEnv('hang'),
              graceMs: TEST_GRACE_MS,
              verifyMs: TEST_VERIFY_MS,
              probeMs: TEST_PROBE_MS,
            },
          );
        },
      });

      expect(result.ok).toBe(false);
      expect(result.refusal).toBe(REFUSAL.commandTimedOut);
      // ONE schedule launch, and no successor: the probe is not counted.
      expect(result.launches).toBe(1);
      expect(result.receipts).toHaveLength(1);
      expect(launched.filter((l) => l !== 'git-rev-parse-head')).toEqual([SCHEDULE[0]!.label]);

      const receipt = result.receipts[0]!;
      expect(receipt.ordinal).toBe(1);
      expect(receipt.label).toBe(SCHEDULE[0]!.label);
      expect(receipt.outcome).toBe('timed-out');
      expect(receipt.timed_out).toBe(true);
      // THE CONTAINMENT FIELDS: a receipt now states what was proven, not just
      // that something ended.
      expect(receipt.group_signalled).toBe(true);
      expect(receipt.direct_child_reaped).toBe(true);
      expect(receipt.group_verified_absent).toBe(true);

      // Real tree, really gone.
      for (const gen of readGenerations()) {
        expect(pidAlive(gen.pid)).toBe(false);
      }
    },
    60_000,
  );

  it('the committed containment parameters are real bounds, not zeroes', () => {
    // A grace or verification window of zero would silently turn proven
    // containment back into an assumption, so the committed constants are
    // asserted to be substantive.
    expect(GRACE_MS).toBeGreaterThan(0);
    expect(VERIFY_MS).toBeGreaterThan(GRACE_MS);
    expect(PROBE_MS).toBeGreaterThan(0);
    expect(PROBE_MS).toBeLessThan(VERIFY_MS);
  });
});

/**
 * This repository's real HEAD, so the identity gate passes honestly.
 *
 * Reading git's own records rather than shelling out keeps this helper free of a
 * second process launch inside a suite about process control. `.git` is a
 * DIRECTORY in a normal clone but a FILE (`gitdir: <path>`) in a linked
 * worktree, and this slice is developed in a worktree — so both shapes are
 * resolved rather than assuming the clone layout.
 */
function gitDirOf(root: string): string {
  const dotGit = resolve(root, '.git');
  if (statSync(dotGit).isDirectory()) return dotGit;
  const pointer = readFileSync(dotGit, 'utf8').trim();
  const marker = 'gitdir:';
  if (!pointer.startsWith(marker)) throw new Error(`unrecognized .git file: ${pointer}`);
  return resolve(root, pointer.slice(marker.length).trim());
}

function headSha(): string {
  const gitDir = gitDirOf(ROOT);
  const head = readFileSync(resolve(gitDir, 'HEAD'), 'utf8').trim();
  if (!head.startsWith('ref: ')) return head;
  const ref = head.slice(5).trim();
  const loose = resolve(gitDir, ref);
  if (existsSync(loose)) return readFileSync(loose, 'utf8').trim();
  // A linked worktree keeps its refs in the COMMON dir, one level up from the
  // per-worktree gitdir; packed refs live there too.
  for (const base of [gitDir, resolve(gitDir, '..', '..')]) {
    const alt = resolve(base, ref);
    if (existsSync(alt)) return readFileSync(alt, 'utf8').trim();
    const packedPath = resolve(base, 'packed-refs');
    if (existsSync(packedPath)) {
      const line = readFileSync(packedPath, 'utf8')
        .split('\n')
        .find((l) => l.endsWith(` ${ref}`));
      if (line) return line.split(' ')[0]!;
    }
  }
  throw new Error(`cannot resolve ${ref}`);
}
