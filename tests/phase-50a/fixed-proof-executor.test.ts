// Phase 50A R3 — THE FIXED WRAPPER / FIXED EXECUTOR CONTRACT.
//
// Authority: coordinator task packet comment 5178032683 (packet digest
// sha256:86b0f7383241a850fb7dc79dde597f28db3c9bee7df24775fee7f8e498093d18),
// posted by event 5178044860 at lane sequence 50, under the operator.decision
// at sequence 49 (comment 5171890625). That decision authorized ONE fresh
// INITIAL proof-closure slice retaining patch_cycle 3, and fixed NEW canonical
// wrapper bytes; the previous authority was packet comment 5169022573 at
// sequence 43, whose wrapper fingerprint this file no longer carries.
//
// ── WHAT THIS SUITE IS, AND WHY IT REPLACED A SEMANTIC CHECKER ──────────
//
// Three successive attempts to prove the workflow's trigger and exact-head
// posture by RECOGNIZING its content were reopened by audit. The last of them,
// `tests/phase-50a/workflow-trigger-contract.test.ts`, was a 568-line direct
// byte/line checker; it was REJECTED at lane sequence 41 for three defects that
// are all the same defect:
//
//   * unsupported byte/YAML forms (a BOM, a document separator, a CRLF line, a
//     quoted or aliased top-level key) left the contract GREEN;
//   * it blanked only whole-line comments, so an inline comment or an unrelated
//     block scalar restating a literal SATISFIED a safeguard whose real
//     implementation had been deleted;
//   * its ordering check recognized only single-line `run:` commands, so a
//     `run: |` block executing `npm ci` before the exact-HEAD assertion was
//     invisible.
//
// A recognizer has unsupported forms; raw-byte identity does not. So the
// checker is DELETED and the property is proven a different way: the workflow's
// COMPLETE RAW BYTES are fixed by the operator-authorized packet, and both this
// suite and the executor compare against that one fingerprint. Every one of the
// three defects above becomes impossible rather than handled — a BOM, a CRLF
// line, an added comment, a re-indent, and a `run: |` block ALL change the
// bytes, and a byte change is the single refusal.
//
// TWO INDEPENDENT READERS. The expected length and digest below are literal
// constants of THIS file, written from the packet — not imported from the
// executor. The executor carries its own literal copy. A test that read the
// executor's constant and compared it to the file the executor checks would
// prove only self-consistency; comparing two independently committed copies
// against the packet is what makes drift detectable.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  AUTHENTICATED_ENTRY_LABEL,
  EXPECTED_HEAD_ENV,
  EXPECTED_WRAPPER_DIGEST,
  IDENTITY_PROBE,
  NPM_TOKEN_CHILD_ENV,
  NPM_TOKEN_INGRESS_ENV,
  REFUSAL,
  SCHEDULE,
  childEnv,
  realRun,
  renderReceipts,
  renderReport,
  runFixedProof,
} from '../../scripts/phase-50a/fixed-proof-executor.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const WRAPPER_REL = '.github/workflows/phase-50a-postgres-conformance.yml';
const WRAPPER_ABS = resolve(ROOT, WRAPPER_REL);
const EXECUTOR_REL = 'scripts/phase-50a/fixed-proof-executor.mjs';
const EXECUTOR_ABS = resolve(ROOT, EXECUTOR_REL);

/**
 * THE OPERATOR-AUTHORIZED WRAPPER FINGERPRINT, transcribed from the packet's
 * `fixed_wrapper_contract`. Literal constants of this file, deliberately NOT
 * imported from the executor.
 */
const PACKET_WRAPPER_BYTE_LENGTH = 7287;
const PACKET_WRAPPER_SHA256 =
  'b95509fb82142d647e425d8c9a0ca10a7cf289d5fbfedc4573193a20c499fd7b';

/** A valid-shaped SHA that is NOT this repository's HEAD. */
const OTHER_SHA = '0123456789abcdef0123456789abcdef01234567';

/**
 * A stand-in credential. Deliberately NOT a real token shape: nothing here can
 * authenticate anywhere, and the leak/neutrality scan must not see a
 * credential-shaped literal in this file.
 */
const FAKE_INGRESS = 'ingress-value-for-tests-only';

/**
 * The complete environment the gate requires: the exact head SHA and the
 * credential ingress. Both are mandatory, so every positive-path run must
 * supply both — a run missing the ingress refuses before the probe.
 *
 * `null` means OMIT THE VARIABLE; `undefined` would be substituted by the
 * default parameter, which would silently supply the credential to a test whose
 * whole point is its absence.
 */
function gateEnv(head: string | null, ingress: string | null = FAKE_INGRESS) {
  const env: Record<string, string | undefined> = {};
  if (head !== null) env[EXPECTED_HEAD_ENV] = head;
  if (ingress !== null) env[NPM_TOKEN_INGRESS_ENV] = ingress;
  return env;
}

function sha256OfBytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// ── The stub process-execution seam ─────────────────────────────────────
//
// ORDERING IS PROVEN IN ORDINARY NODE CONTROL FLOW over this call log — never
// by reading the workflow, and never by parsing any command text. The stub
// records every launch it is asked to make, so "zero launches" is an assertion
// about an exact count, not an inference from an exit status.

interface Launch {
  label: string;
  file: string;
  args: string[];
  shellFalse: true;
  timeout_ms: number;
  capture: boolean;
}

interface StubOptions {
  /** HEAD the identity probe reports. Defaults to the expected SHA. */
  head?: string;
  /** Make the probe itself fail. */
  probeStatus?: number;
  /**
   * Override the identity probe's CONTAINMENT facts while leaving its status
   * and stdout perfectly valid. This is how the gate is tested against a probe
   * that read the right SHA out of a process whose tree cannot be proven gone.
   */
  probeContainment?: Partial<{
    group_signalled: boolean;
    escalated: boolean;
    direct_child_reaped: boolean;
    group_verified_absent: boolean;
    termination_error: string | null;
    timed_out: boolean;
  }>;
  /** 1-based schedule ordinal to fail, and how. */
  failAt?: number;
  failMode?: 'status' | 'signal' | 'timeout' | 'spawn' | 'termination' | 'containment';
}

/**
 * The containment facts of a launch that was CONTAINED: the direct child's exit
 * was observed and the group was proven gone.
 *
 * Every stubbed outcome must state these, because the classifier treats an
 * unproven tree as its own refusal — a stub that omitted them would be
 * classified `containment-unverified` and no positive-path test could pass.
 * That is deliberate: the production default is "not proven", so silence is
 * failure rather than success.
 */
const CONTAINED = {
  group_signalled: false,
  escalated: false,
  direct_child_reaped: true,
  group_verified_absent: true,
  termination_error: null,
} as const;

function makeStub(expectedSha: string, opts: StubOptions = {}) {
  const launches: Launch[] = [];
  const scheduleLaunches: Launch[] = [];
  let scheduleCount = 0;
  const run = async (entry: {
    label: string;
    file: string;
    args: readonly string[];
    timeout_ms: number;
    capture?: boolean;
  }) => {
    const record: Launch = {
      label: entry.label,
      file: entry.file,
      args: [...entry.args],
      // The seam contract is shell:false by construction — the stub asserts it
      // received an executable plus an argv ARRAY, never a shell string.
      shellFalse: true,
      timeout_ms: entry.timeout_ms,
      capture: entry.capture === true,
    };
    launches.push(record);
    if (entry.label === IDENTITY_PROBE.label) {
      return {
        status: opts.probeStatus ?? 0,
        signal: null,
        stdout: `${opts.head ?? expectedSha}\n`,
        timed_out: false,
        error: null,
        ...CONTAINED,
        // Containment overrides come LAST so a test can leave the probe's
        // status and stdout entirely valid while making its tree unprovable.
        ...(opts.probeContainment ?? {}),
      };
    }
    scheduleCount += 1;
    scheduleLaunches.push(record);
    if (opts.failAt !== undefined && scheduleCount === opts.failAt) {
      switch (opts.failMode) {
        case 'signal':
          return { status: null, signal: 'SIGKILL', stdout: '', timed_out: false, error: null, ...CONTAINED };
        case 'timeout':
          // A CONTAINED lapse: the bound lapsed, the group was signalled, and
          // the tree was proven gone. Only then is it a plain `timed-out`.
          return {
            status: null, signal: 'SIGTERM', stdout: '', timed_out: true, error: null,
            ...CONTAINED, group_signalled: true,
          };
        case 'spawn':
          return {
            status: null, signal: null, stdout: '', timed_out: false, error: 'ENOENT',
            group_signalled: false, escalated: false,
            direct_child_reaped: false, group_verified_absent: false, termination_error: null,
          };
        case 'termination':
          // The OS refused the group signal. The most specific diagnosis, so it
          // outranks the containment failure it also causes.
          return {
            status: null, signal: null, stdout: '', timed_out: true, error: null,
            group_signalled: false, escalated: false,
            direct_child_reaped: false, group_verified_absent: false, termination_error: 'EPERM',
          };
        case 'containment':
          // Reaped, signalled, escalated — and STILL not proven gone.
          return {
            status: null, signal: 'SIGTERM', stdout: '', timed_out: true, error: null,
            group_signalled: true, escalated: true,
            direct_child_reaped: true, group_verified_absent: false, termination_error: null,
          };
        default:
          return { status: 7, signal: null, stdout: '', timed_out: false, error: null, ...CONTAINED };
      }
    }
    return { status: 0, signal: null, stdout: '', timed_out: false, error: null, ...CONTAINED };
  };
  return { run, launches, scheduleLaunches };
}

/** The real repository HEAD, used so a successful stubbed run is realistic. */
function repoHead(): string {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8', shell: false });
  return (r.stdout ?? '').trim();
}

// ── 1. Exact wrapper bytes and digest ──────────────────────────────────

describe('Phase 50A R3 — the workflow wrapper has EXACTLY the packet-authorized bytes', () => {
  it('the wrapper byte length and RAW-BYTE SHA-256 equal the packet contract', async () => {
    // Read as BYTES and hashed BEFORE any decoding, so distinct invalid byte
    // streams can never collapse into one another through
    // replacement-character decoding.
    const bytes = readFileSync(WRAPPER_ABS);
    expect(bytes.length, 'the wrapper must be exactly the packet-fixed length').toBe(
      PACKET_WRAPPER_BYTE_LENGTH,
    );
    expect(sha256OfBytes(bytes), 'the wrapper must be byte-identical to the packet').toBe(
      PACKET_WRAPPER_SHA256,
    );
  });

  it('the wrapper is canonical: UTF-8, LF only, no BOM, no tab, one trailing LF', async () => {
    const bytes = readFileSync(WRAPPER_ABS);
    expect(bytes.includes(0x0d), 'no CR byte anywhere').toBe(false);
    expect(bytes.includes(0x09), 'no tab byte anywhere').toBe(false);
    expect(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf, 'no BOM').toBe(false);
    // Strict UTF-8: re-encoding the decoded text reproduces the exact bytes.
    const text = bytes.toString('utf8');
    expect(Buffer.from(text, 'utf8').equals(bytes), 'strictly valid UTF-8').toBe(true);
    expect(text.endsWith('\n') && !text.endsWith('\n\n'), 'exactly one trailing LF').toBe(true);
  });

  it('PINNED-CONSTANT AGREEMENT: the executor enforces the packet fingerprint', async () => {
    // The executor's committed constant must equal the packet's literal — this
    // is what proves it enforces the OPERATOR-AUTHORIZED digest rather than one
    // it derived from whatever wrapper happened to be present.
    expect(EXPECTED_WRAPPER_DIGEST).toBe(`sha256:${PACKET_WRAPPER_SHA256}`);
  });

  it('the executor never derives its expected digest from a runtime input', async () => {
    // Structural, over the executor's own source: the constant is a literal
    // string assignment, and no environment/argv/config read feeds it.
    const src = readFileSync(EXECUTOR_ABS, 'utf8');
    expect(src).toContain(`"sha256:${PACKET_WRAPPER_SHA256}"`);
    // EVERY environment name the executor touches, enumerated exactly. The
    // digest is not among them, which is the point of this assertion: an
    // executor that read its expected digest from the environment would
    // authorize whatever wrapper the caller pointed it at.
    //
    // The set grew by two under the credential narrowing — the ingress the gate
    // reads, and the registry name the child-environment constructor skips and
    // conditionally re-adds. Enumerated rather than pattern-matched so a THIRD
    // name (a digest override, a schedule override, a fallback registry) fails
    // here rather than passing unnoticed.
    const subscripts = [...src.matchAll(/\b\w*env\[([^\]]+)\]/gi)].map((m) => m[1]!);
    const constantNamed = subscripts.filter((x) => /^[A-Z_]+$/.test(x));
    expect(new Set(constantNamed)).toEqual(
      new Set(['EXPECTED_HEAD_ENV', 'NPM_TOKEN_INGRESS_ENV', 'NPM_TOKEN_CHILD_ENV']),
    );
    // The ONLY non-constant subscripts are the two in the child-environment
    // constructor's enumerate-and-skip loop: the copy's write target and the
    // source read. Pinned by their exact text, so a dynamic read under any
    // other identifier — the shape a smuggled override would take — fails here.
    const dynamic = subscripts.filter((x) => !/^[A-Z_]+$/.test(x));
    expect(dynamic).toEqual(['name', 'name']);
    expect(src, 'the copy target is the fresh child object').toContain('env[name] = baseEnv[name];');
    // ENUMERATE-AND-SKIP, not copy-then-remove: both credential names are
    // skipped BEFORE any value is read, which is what makes the read-once claim
    // true at runtime rather than merely asserted over this source text. A
    // wholesale copy would re-read both on every construction — the sequence-54
    // finding.
    expect(src).toContain('if (name === NPM_TOKEN_INGRESS_ENV) continue;');
    expect(src).toContain('if (name === NPM_TOKEN_CHILD_ENV) continue;');
    expect(src, 'no wholesale copy of the source environment').not.toContain('{ ...baseEnv }');
    expect(src, 'the expected digest is never read from argv').not.toContain('process.argv[2]');
  });
});

// ── 2. The single invocation seam ──────────────────────────────────────

describe('Phase 50A R3 — the wrapper carries ONE run step and no proof schedule', () => {
  it('the wrapper declares exactly one `run:` and it invokes only the fixed executor', () => {
    const text = readFileSync(WRAPPER_ABS, 'utf8');
    const runs = [...text.matchAll(/^\s*run:\s*(.*)$/gm)].map((m) => m[1]!.trim());
    expect(runs, 'exactly one run step in the whole file').toEqual([
      `node ${EXECUTOR_REL}`,
    ]);
  });

  it('the wrapper passes the expected head SHA and the INGRESS name, and no registry name', async () => {
    const text = readFileSync(WRAPPER_ABS, 'utf8');
    expect(text).toContain(`${EXPECTED_HEAD_ENV}: \${{ github.event.pull_request.head.sha || inputs.head_sha }}`);
    // The credential arrives under the INGRESS name. The registry name npm reads
    // appears NOWHERE in the workflow: it is set by the executor, for one child.
    // That is the sequence-46 credential-narrowing finding, closed at the source
    // rather than described — a name absent from the YAML cannot be inherited by
    // a step's whole process tree.
    expect(text).toContain(`${NPM_TOKEN_INGRESS_ENV}: \${{ secrets.GITHUB_TOKEN }}`);
    expect(text, 'the registry name must not appear in the workflow at all').not.toContain(
      NPM_TOKEN_CHILD_ENV,
    );
    // No secret other than the ephemeral job token.
    expect(/secrets\.(?!GITHUB_TOKEN)[A-Z_]+/.test(text)).toBe(false);
  });

  it('the wrapper keeps the unconditional pull_request trigger and the bounded dispatch', async () => {
    const text = readFileSync(WRAPPER_ABS, 'utf8');
    // Kept as a readable statement of intent. It is NOT the load-bearing proof
    // — the byte/digest assertion above is, and this holds only because these
    // exact bytes are the packet's. A reader must not mistake this for a
    // content recognizer that could be satisfied independently.
    expect(text).toContain('\n  pull_request:\n');
    expect(/^\s*paths(-ignore)?\s*:/m.test(text), 'no path filter of any kind').toBe(false);
    expect(text).toContain('      head_sha:\n');
    expect(text).toContain('        required: true\n');
    expect(text).toContain('        type: string\n');
  });

  it('the wrapper leaves no checkout credential in the working tree', async () => {
    const text = readFileSync(WRAPPER_ABS, 'utf8');
    // The other half of the sequence-46 least-privilege finding: checkout
    // persisted its token into `.git/config` by default, so any later child
    // could have used it. Same reading as above — the byte/digest assertion is
    // the load-bearing proof; this states the property a reader cares about.
    expect(text).toContain('persist-credentials: false');
  });
});

// ── 3. Schedule coverage, fixed argv, and order ────────────────────────

describe('Phase 50A R3 — the closed schedule covers the proof and is fixed', () => {
  it('covers every substantive proof command the previous workflow ran', async () => {
    const argvs = SCHEDULE.map((e) => [e.file, ...e.args].join(' '));
    expect(argvs).toEqual([
      'npm ci --ignore-scripts',
      'docker exec straylight-phase-50a-source psql -tA -U straylight_proof -d straylight_source -c SELECT system_identifier FROM pg_control_system()',
      'docker exec straylight-phase-50a-replacement psql -tA -U straylight_proof -d straylight_replacement -c SELECT system_identifier FROM pg_control_system()',
      'npm run build',
      'npm run typecheck',
      'npm test',
      'npm run control-plane:validate',
      'npm run control-plane:test',
      'npm run phase-50a:test',
      'npm run phase-50a:proof',
      'npm run phase-50a:verify-artifact',
      'git diff --check',
    ]);
  });

  it('every entry is an executable plus an argv ARRAY with a bounded timeout', async () => {
    for (const entry of SCHEDULE) {
      expect(Array.isArray(entry.args), `${entry.label}: args is an array`).toBe(true);
      expect(typeof entry.file, `${entry.label}: file is a plain executable`).toBe('string');
      expect(entry.file, `${entry.label}: no shell metacharacter in the executable`).toMatch(
        /^[a-z][a-z0-9-]*$/,
      );
      expect(entry.timeout_ms, `${entry.label}: bounded`).toBeGreaterThan(0);
      expect(Object.isFrozen(entry.args), `${entry.label}: argv frozen`).toBe(true);
    }
    expect(Object.isFrozen(SCHEDULE), 'the schedule itself is frozen').toBe(true);
  });

  it('FIXED ARGV AND ORDER: a successful run launches exactly the schedule, in order', async () => {
    const head = repoHead();
    const stub = makeStub(head);
    const result = await runFixedProof({
      run: stub.run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    expect(result.ok, `refused: ${result.refusal} ${result.detail}`).toBe(true);
    expect(stub.scheduleLaunches.map((l) => l.label)).toEqual(SCHEDULE.map((e) => e.label));
    for (const [i, launch] of stub.scheduleLaunches.entries()) {
      expect(launch.file).toBe(SCHEDULE[i]!.file);
      expect(launch.args).toEqual([...SCHEDULE[i]!.args]);
      expect(launch.shellFalse).toBe(true);
    }
    expect(result.launches).toBe(SCHEDULE.length);
  });

  it('ENTRY 1 IS THE GUARDED INSTALL, and the build is a separate later entry', async () => {
    // `--ignore-scripts` is the whole reason the credential can be confined to
    // one child: without it `npm ci` runs the repository's `prepare` lifecycle,
    // which runs `build`, INSIDE the authenticated process tree. Asserted as an
    // exact argv, not a substring, so dropping the flag fails here.
    expect([SCHEDULE[0]!.file, ...SCHEDULE[0]!.args]).toEqual(['npm', 'ci', '--ignore-scripts']);
    expect(SCHEDULE[0]!.label).toBe(AUTHENTICATED_ENTRY_LABEL);

    // The build did not disappear with the flag — it is its own entry, LATER in
    // the schedule, and it is not the authenticated one.
    const buildAt = SCHEDULE.findIndex((e) => e.label === 'build');
    expect(buildAt, 'the explicit build survives').toBeGreaterThan(0);
    expect([SCHEDULE[buildAt]!.file, ...SCHEDULE[buildAt]!.args]).toEqual(['npm', 'run', 'build']);
    expect(SCHEDULE[buildAt]!.label).not.toBe(AUTHENTICATED_ENTRY_LABEL);

    // And the thing the flag suppresses really does exist: `prepare` routes
    // through `build`, so an unguarded install WOULD have built under the token.
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['prepare'], 'prepare routes through build').toContain('build');

    // Exactly ONE entry bears the authenticated label, so "the install alone" is
    // a statement about the whole schedule rather than about one index.
    expect(SCHEDULE.filter((e) => e.label === AUTHENTICATED_ENTRY_LABEL)).toHaveLength(1);
  });

  it('the identity banner is emitted BEFORE the first schedule launch', async () => {
    // The published envelope is assembled at the END of the run, so a reader of
    // the job log has to trust the code's structure to believe the identity
    // check preceded the work. The banner removes that inference: it is written
    // at the moment the gate passes, so its position in the interleaved log is
    // itself the ordering evidence. Asserted here over a shared event log, in
    // ordinary control flow.
    const head = repoHead();
    const events: string[] = [];
    const stub = makeStub(head);
    const result = await runFixedProof({
      run: (entry) => {
        events.push(`launch:${entry.label}`);
        return stub.run(entry);
      },
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
      announce: (text) => events.push(`announce:${text}`),
    });
    expect(result.ok).toBe(true);
    const announceAt = events.findIndex((e) => e.startsWith('announce:'));
    const firstScheduleAt = events.findIndex((e) => e === `launch:${SCHEDULE[0]!.label}`);
    expect(announceAt, 'the banner must be emitted').toBeGreaterThan(-1);
    expect(announceAt, 'the banner must precede the first schedule launch').toBeLessThan(
      firstScheduleAt,
    );
    // It carries the facts an auditor needs, and says plainly that nothing has
    // run yet.
    const banner = events[announceAt]!;
    expect(banner).toContain(PACKET_WRAPPER_SHA256);
    expect(banner).toContain(head);
    expect(banner).toContain('No schedule command has been launched yet');
  });

  it('a REFUSED run emits NO identity banner', async () => {
    // The banner asserts "the gate passed". A refusal must never print it, or
    // the log would claim an identity that was never established.
    const events: string[] = [];
    const result = await runFixedProof({
      run: makeStub(OTHER_SHA, { head: OTHER_SHA }).run,
      env: gateEnv(repoHead()),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
      announce: (text) => events.push(text),
    });
    expect(result.ok).toBe(false);
    expect(result.refusal).toBe(REFUSAL.headMismatch);
    expect(events, 'a refused run announces no passed gate').toEqual([]);
  });

  it('ZERO LAUNCHES BEFORE IDENTITY: the probe is the only pre-gate launch', async () => {
    const head = repoHead();
    const stub = makeStub(head);
    await runFixedProof({
      run: stub.run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    // The FIRST launch of the entire run is the identity probe, and it is not a
    // schedule entry. Ordinal comparison over the call log — no text parsing.
    expect(stub.launches[0]!.label).toBe(IDENTITY_PROBE.label);
    expect(stub.launches[0]!.args).toEqual(['rev-parse', 'HEAD']);
    expect(stub.launches[0]!.capture, 'the probe captures its stdout').toBe(true);
    expect(SCHEDULE.some((e) => e.label === IDENTITY_PROBE.label)).toBe(false);
    // Everything after index 0 is a schedule entry, so nothing substantive
    // preceded the gate.
    expect(stub.launches.slice(1).map((l) => l.label)).toEqual(SCHEDULE.map((e) => e.label));
  });
});

// ── 3b. CREDENTIAL NARROWING, over the REAL production options ─────────
//
// WHY THIS SECTION LOOKS DIFFERENT FROM THE REST OF THE FILE.
//
// Everything above injects `run`, replacing the production seam entirely. That
// is right for ordering and argv, which are properties of the SCHEDULE. It is
// WRONG for the child environment, which is a property of `realRun` itself: a
// stub that reports "I was given no token" proves only that the stub was written
// that way. The sequence-46 audit recorded exactly this — the credential
// assertions of the day inspected the YAML and a stub's own fields while the
// real `spawnSync` call inherited the token for every child.
//
// So these tests run the PRODUCTION `realRun` and inject only the lowest seam
// the packet authorizes: the `spawn` function. What they assert over is the
// actual options object production builds and hands to `spawnSync` — the same
// object the real run uses, captured rather than simulated.

interface CapturedSpawn {
  file: string;
  args: string[];
  options: {
    cwd: string;
    shell: boolean;
    env: Record<string, string | undefined>;
    detached: boolean;
    stdio: unknown;
  };
}

/**
 * A spawn function that RECORDS what production asked for and returns a benign,
 * immediately-exiting CHILD HANDLE. It fabricates no option: every recorded
 * field is the one the production launch helper built.
 *
 * The handle is asynchronous now, because the production seam is: it emits
 * `exit` on the next tick so `realRun` OBSERVES a real reaping, and it reports a
 * pid so the group-absence probe has something to check. The probe's stdout is
 * delivered through a stream, exactly as the real primitive delivers it.
 */
function captureSpawn(head: string) {
  const captured: CapturedSpawn[] = [];
  let nextPid = 900_001;
  const spawn = (file: string, args: readonly string[], options: CapturedSpawn['options']) => {
    captured.push({ file, args: [...args], options });
    const isProbe = file === IDENTITY_PROBE.file && args[0] === IDENTITY_PROBE.args[0];
    const listeners: Record<string, Array<(...a: never[]) => void>> = {};
    const emit = (event: string, ...a: unknown[]) => {
      for (const fn of listeners[event] ?? []) (fn as (...x: unknown[]) => void)(...a);
    };
    const stdoutListeners: Record<string, Array<(chunk: string) => void>> = {};
    const child = {
      pid: nextPid++,
      stdout: {
        setEncoding: () => {},
        on: (event: string, fn: (chunk: string) => void) => {
          (stdoutListeners[event] ??= []).push(fn);
        },
      },
      on: (event: string, fn: (...a: never[]) => void) => {
        (listeners[event] ??= []).push(fn);
      },
    };
    setImmediate(() => {
      if (isProbe) for (const fn of stdoutListeners['data'] ?? []) fn(`${head}\n`);
      emit('exit', 0, null);
    });
    return child;
  };
  // The captured pids are fictions, so the absence probe must not consult the
  // real process table for them: a stubbed launch is contained by construction.
  const alive = () => false;
  return { spawn, captured, alive };
}

describe('Phase 50A R3 — only the install child is authenticated, proven over production options', () => {
  it('PRODUCTION SEAM: exactly one captured environment carries the registry name', async () => {
    const head = repoHead();
    const { spawn, captured, alive } = captureSpawn(head);
    const result = await runFixedProof({
      // NOTE: `run` is NOT injected. Production `realRun` builds every options
      // object below, including every child environment.
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
      spawn,
      alive,
    });
    expect(result.ok, `refused: ${result.refusal} ${result.detail}`).toBe(true);

    // Probe + 12 schedule entries, in order.
    expect(captured).toHaveLength(SCHEDULE.length + 1);
    const withToken = captured.filter((c) => NPM_TOKEN_CHILD_ENV in c.options.env);
    expect(withToken, 'exactly one child may hold the registry name').toHaveLength(1);

    // ...and it is the install child, identified by its exact argv.
    const authenticated = withToken[0]!;
    expect([authenticated.file, ...authenticated.args]).toEqual(['npm', 'ci', '--ignore-scripts']);
    expect(authenticated.options.env[NPM_TOKEN_CHILD_ENV]).toBe(FAKE_INGRESS);
    // The INGRESS name is never forwarded, not even to the child that is allowed
    // the credential — so nothing downstream can re-derive it under that name.
    expect(NPM_TOKEN_INGRESS_ENV in authenticated.options.env).toBe(false);
  });

  it('PRODUCTION SEAM: the probe and entries 2-12 hold NEITHER token name', async () => {
    const head = repoHead();
    const { spawn, captured, alive } = captureSpawn(head);
    const result = await runFixedProof({
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
      spawn,
      alive,
    });
    expect(result.ok).toBe(true);

    // captured[0] is the identity probe; captured[1] is the install; the rest
    // are schedule entries 2-12.
    const probe = captured[0]!;
    expect([probe.file, ...probe.args]).toEqual(['git', 'rev-parse', 'HEAD']);
    expect(NPM_TOKEN_CHILD_ENV in probe.options.env, 'probe: no registry name').toBe(false);
    expect(NPM_TOKEN_INGRESS_ENV in probe.options.env, 'probe: no ingress name').toBe(false);

    for (const [i, c] of captured.slice(2).entries()) {
      const label = SCHEDULE[i + 1]!.label;
      expect(NPM_TOKEN_CHILD_ENV in c.options.env, `${label}: no registry name`).toBe(false);
      expect(NPM_TOKEN_INGRESS_ENV in c.options.env, `${label}: no ingress name`).toBe(false);
    }
    // Absence is asserted as a MISSING KEY, not an empty string: an empty value
    // would still be a name npm could read and misinterpret.
    expect(
      captured.filter((c) => NPM_TOKEN_INGRESS_ENV in c.options.env),
      'the ingress reaches no child at all',
    ).toHaveLength(0);
  });

  it('PRODUCTION SEAM: shell is false and the command is an argv ARRAY everywhere', async () => {
    const head = repoHead();
    const { spawn, captured, alive } = captureSpawn(head);
    await runFixedProof({ env: gateEnv(head), repoRoot: ROOT, selfPath: EXECUTOR_ABS, spawn, alive });
    for (const c of captured) {
      expect(c.options.shell, `${c.file}: shell must be false`).toBe(false);
      expect(Array.isArray(c.args), `${c.file}: argv must be an array`).toBe(true);
      expect(typeof c.file, `${c.file}: file is a plain executable`).toBe('string');
      // The BOUND IS NOT DELEGATED to the primitive any more: the module owns
      // the clock, because the primitive's own bound reaches the direct child
      // alone. So no `timeout` option is passed, and `detached` is what makes
      // the whole tree addressable instead.
      expect('timeout' in c.options, `${c.file}: no delegated bound`).toBe(false);
      expect(c.options.detached, `${c.file}: own process group`).toBe(true);
      expect(c.options.cwd).toBe(ROOT);
    }
  });

  it('the AMBIENT registry name is stripped, not merely left unset', async () => {
    // A runner whose own environment already carries the registry name would
    // otherwise leak it into every child by inheritance. `childEnv` deletes the
    // name unconditionally BEFORE re-adding it for the install alone, so an
    // ambient value cannot reach entries 2-12.
    const head = repoHead();
    const { spawn, captured, alive } = captureSpawn(head);
    const result = await runFixedProof({
      env: {
        ...gateEnv(head),
        [NPM_TOKEN_CHILD_ENV]: 'ambient-value-that-must-not-propagate',
      },
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
      spawn,
      alive,
    });
    expect(result.ok).toBe(true);
    for (const [i, c] of captured.entries()) {
      if (i === 1) {
        // The install child gets the CAPTURED INGRESS, never the ambient value.
        expect(c.options.env[NPM_TOKEN_CHILD_ENV]).toBe(FAKE_INGRESS);
        continue;
      }
      expect(NPM_TOKEN_CHILD_ENV in c.options.env, `launch ${i}: ambient value stripped`).toBe(
        false,
      );
    }
  });

  it('the constructor used by production is the one exported, for every entry', async () => {
    // Ties the behavioural capture above to the single exported constructor: for
    // the probe, the install, and a non-install entry, `childEnv`'s own output
    // equals the environment production actually passed. One constructor, one
    // behaviour, no second path.
    const head = repoHead();
    const { spawn, captured, alive } = captureSpawn(head);
    const baseEnv = gateEnv(head);
    await runFixedProof({ env: baseEnv, repoRoot: ROOT, selfPath: EXECUTOR_ABS, spawn, alive });

    const entries = [IDENTITY_PROBE, ...SCHEDULE];
    for (const [i, entry] of entries.entries()) {
      expect(captured[i]!.options.env).toEqual(childEnv(entry, FAKE_INGRESS, baseEnv));
    }

    // And the constructor's contract, exercised directly on the three shapes.
    const probeEnv = childEnv(IDENTITY_PROBE, FAKE_INGRESS, baseEnv);
    const installEnv = childEnv(SCHEDULE[0]!, FAKE_INGRESS, baseEnv);
    const buildEnv = childEnv(
      SCHEDULE.find((e) => e.label === 'build')!,
      FAKE_INGRESS,
      baseEnv,
    );
    expect(installEnv[NPM_TOKEN_CHILD_ENV]).toBe(FAKE_INGRESS);
    expect(NPM_TOKEN_CHILD_ENV in probeEnv).toBe(false);
    expect(NPM_TOKEN_CHILD_ENV in buildEnv).toBe(false);
    for (const env of [probeEnv, installEnv, buildEnv]) {
      expect(NPM_TOKEN_INGRESS_ENV in env, 'the ingress never survives').toBe(false);
    }
  });

  it('realRun passes childEnv output straight through, with no later mutation', async () => {
    // `realRun` is called directly here, so the assertion covers the seam in
    // isolation as well as inside a full run.
    const baseEnv = { ...gateEnv(repoHead()), UNRELATED: 'kept' };
    const seen: Array<Record<string, string | undefined>> = [];
    let pid = 910_001;
    const spawn = (_f: string, _a: readonly string[], o: { env: Record<string, string | undefined> }) => {
      seen.push(o.env);
      const listeners: Record<string, Array<(...a: never[]) => void>> = {};
      const child = {
        pid: pid++,
        stdout: { setEncoding: () => {}, on: () => {} },
        on: (event: string, fn: (...a: never[]) => void) => {
          (listeners[event] ??= []).push(fn);
        },
      };
      setImmediate(() => {
        for (const fn of listeners['exit'] ?? []) (fn as (c: number, s: null) => void)(0, null);
      });
      return child;
    };
    const alive = () => false;
    await realRun(SCHEDULE[0]!, { token: FAKE_INGRESS, baseEnv, spawn, alive });
    await realRun(SCHEDULE[1]!, { token: FAKE_INGRESS, baseEnv, spawn, alive });
    expect(seen[0]).toEqual(childEnv(SCHEDULE[0]!, FAKE_INGRESS, baseEnv));
    expect(seen[1]).toEqual(childEnv(SCHEDULE[1]!, FAKE_INGRESS, baseEnv));
    // Unrelated environment is preserved: the constructor narrows credentials,
    // it does not build a minimal environment the commands could not run in.
    expect(seen[0]!['UNRELATED']).toBe('kept');
    expect(seen[1]!['UNRELATED']).toBe('kept');
  });

  it('NO TOKEN IN ANY PUBLISHED TEXT: receipts, banner, and envelope are clean', async () => {
    const head = repoHead();
    const banners: string[] = [];
    const { spawn, alive } = captureSpawn(head);
    const result = await runFixedProof({
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
      spawn,
      alive,
      announce: (text) => banners.push(text),
    });
    expect(result.ok).toBe(true);
    const published = [renderReport(result), renderReceipts(result.receipts), ...banners].join('\n');
    expect(published, 'no credential value is ever published').not.toContain(FAKE_INGRESS);
    // Nor does any receipt carry an environment at all.
    for (const receipt of result.receipts) {
      expect(Object.keys(receipt).sort()).toEqual([
        'argv',
        'file',
        'label',
        'ordinal',
        'signal',
        'spawn_failed',
        'status',
        'timed_out',
        'outcome',
        // THE CONTAINMENT FACTS. A receipt now states what was PROVEN about the
        // process tree, not merely how the direct child ended.
        'group_signalled',
        'escalated',
        'direct_child_reaped',
        'group_verified_absent',
      ].sort());
    }
    // The banner names WHICH entry is authenticated — a fact about the schedule,
    // not about the credential.
    expect(banners.join('\n')).toContain(AUTHENTICATED_ENTRY_LABEL);
  });
});

// ── 3c. RUNTIME CREDENTIAL ACCESS COUNTS ───────────────────────────────
//
// THIS REPLACES A FALSE CLAIM. The previous slice asserted "the ingress is read
// once" by counting one lexical `env[NPM_TOKEN_INGRESS_ENV]` expression in the
// executor's source text. The sequence-54 audit disproved it at runtime: the
// old child-environment constructor spread the whole source environment and only
// then deleted the two credential names, so an independent Proxy-backed probe
// observed the ingress read FOURTEEN times (the gate plus all thirteen
// constructions) and the ambient registry name read THIRTEEN times.
//
// The lesson is about the METHOD, not the count: a source-text count cannot see
// a property read performed by a spread, so it can never falsify that claim. So
// the claim is now proven the only way it can be — by instrumenting the
// environment the PRODUCTION seam actually reads and counting real accesses.
//
// The constructor was reshaped to make the claim true: it enumerates NAMES and
// SKIPS both credential names before reading any value.

/**
 * An environment whose credential properties COUNT their reads.
 *
 * Accessors rather than a Proxy for the two credential names, plus a Proxy to
 * catch `has`/`ownKeys` as well — so a read reached by any route (subscript,
 * spread, destructuring, `Object.assign`, `Object.entries`) is counted. The
 * counter is the test's, not the code's: the executor cannot know it is being
 * watched.
 */
function countingEnv(head: string, opts: { ambientRegistry?: string } = {}) {
  const counts = { ingress: 0, registry: 0 };
  const target: Record<string, string | undefined> = {
    [EXPECTED_HEAD_ENV]: head,
    UNRELATED_A: 'a',
    UNRELATED_B: 'b',
  };
  Object.defineProperty(target, NPM_TOKEN_INGRESS_ENV, {
    enumerable: true,
    configurable: true,
    get() {
      counts.ingress += 1;
      return FAKE_INGRESS;
    },
  });
  if (opts.ambientRegistry !== undefined) {
    Object.defineProperty(target, NPM_TOKEN_CHILD_ENV, {
      enumerable: true,
      configurable: true,
      get() {
        counts.registry += 1;
        return opts.ambientRegistry;
      },
    });
  }
  const env = new Proxy(target, {
    get(t, prop, recv) {
      return Reflect.get(t, prop, recv);
    },
  });
  return { env, counts };
}

describe('Phase 50A — RUNTIME credential access counts, not a source-text claim', () => {
  it('the ingress is read EXACTLY ONCE across the gate and all thirteen child environments', async () => {
    const head = repoHead();
    const { spawn, captured, alive } = captureSpawn(head);
    const { env, counts } = countingEnv(head);
    const result = await runFixedProof({
      // Production `realRun` and production `childEnv` do all the work; only the
      // lowest primitives are injected.
      env,
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
      spawn,
      alive,
    });
    expect(result.ok, `refused: ${result.refusal} ${result.detail}`).toBe(true);
    // Thirteen child environments really were built (probe + twelve entries),
    // so the count below is not small because the work did not happen.
    expect(captured).toHaveLength(SCHEDULE.length + 1);
    // THE CLAIM, now measured: ONE read in total — the gate's capture.
    expect(counts.ingress, 'the ingress is read exactly once in total').toBe(1);
  });

  it('an AMBIENT registry credential is read ZERO times and forwarded nowhere', async () => {
    const head = repoHead();
    const { spawn, captured, alive } = captureSpawn(head);
    const { env, counts } = countingEnv(head, { ambientRegistry: 'ambient-must-not-be-read' });
    const result = await runFixedProof({
      env,
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
      spawn,
      alive,
    });
    expect(result.ok).toBe(true);
    // ZERO: the constructor skips the name before ever reading its value, so an
    // ambient credential is not merely unforwarded — it is never even read.
    expect(counts.registry, 'the ambient registry value is never read').toBe(0);
    expect(counts.ingress, 'the ingress is still read exactly once').toBe(1);
    // And no child holds the ambient value under either name.
    for (const c of captured) {
      expect(c.options.env[NPM_TOKEN_CHILD_ENV]).not.toBe('ambient-must-not-be-read');
      expect(NPM_TOKEN_INGRESS_ENV in c.options.env).toBe(false);
    }
    // The install child holds the CAPTURED ingress, which is the only value the
    // registry name may ever carry.
    const withToken = captured.filter((c) => NPM_TOKEN_CHILD_ENV in c.options.env);
    expect(withToken).toHaveLength(1);
    expect(withToken[0]!.options.env[NPM_TOKEN_CHILD_ENV]).toBe(FAKE_INGRESS);
  });

  it('childEnv itself reads NEITHER credential property, for every entry shape', async () => {
    // The constructor in isolation, so the claim is attributed to the right
    // function rather than inferred from a whole run. Called for the probe, the
    // authenticated install, and an unauthenticated entry.
    const head = repoHead();
    const { env, counts } = countingEnv(head, { ambientRegistry: 'ambient' });
    for (const entry of [IDENTITY_PROBE, SCHEDULE[0]!, SCHEDULE[3]!]) {
      childEnv(entry, FAKE_INGRESS, env);
    }
    expect(counts.ingress, 'the constructor never reads the ingress').toBe(0);
    expect(counts.registry, 'the constructor never reads the registry name').toBe(0);
    // It still forwards everything else, so the commands can actually run.
    const built = childEnv(SCHEDULE[3]!, FAKE_INGRESS, env);
    expect(built['UNRELATED_A']).toBe('a');
    expect(built[EXPECTED_HEAD_ENV]).toBe(head);
  });

  it('a SPREAD-based constructor would fail this proof — the method has teeth', async () => {
    // Guards the test itself: it must be capable of detecting the defect it was
    // written for. The rejected shape is reproduced here locally (never in
    // production code) and the counter observes exactly what the audit observed.
    const head = repoHead();
    const { env, counts } = countingEnv(head, { ambientRegistry: 'ambient' });
    const spreadThenDelete = (entry: { label: string }, token: string, baseEnv: typeof env) => {
      const out = { ...baseEnv } as Record<string, string | undefined>;
      delete out[NPM_TOKEN_INGRESS_ENV];
      delete out[NPM_TOKEN_CHILD_ENV];
      if (entry.label === AUTHENTICATED_ENTRY_LABEL) out[NPM_TOKEN_CHILD_ENV] = token;
      return out;
    };
    spreadThenDelete(SCHEDULE[3]!, FAKE_INGRESS, env);
    // ONE spread already re-reads BOTH credential properties. Thirteen of them
    // is how the audit reached fourteen and thirteen.
    expect(counts.ingress, 'a spread re-reads the ingress').toBe(1);
    expect(counts.registry, 'a spread re-reads the ambient registry value').toBe(1);
    // The production constructor, given the same environment, reads neither.
    const before = { ...counts };
    childEnv(SCHEDULE[3]!, FAKE_INGRESS, env);
    expect(counts.ingress).toBe(before.ingress);
    expect(counts.registry).toBe(before.registry);
  });
});

describe('Phase 50A R3 — a missing credential ingress launches NOTHING', () => {
  for (const [name, value] of [
    ['absent', null],
    ['empty', ''],
    ['whitespace only', '   '],
  ] as Array<[string, string | null]>) {
    it(`refuses an ${name} ingress before the identity probe runs`, async () => {
      const head = repoHead();
      const stub = makeStub(head);
      const result = await runFixedProof({
        run: stub.run,
        env: gateEnv(head, value),
        repoRoot: ROOT,
        selfPath: EXECUTOR_ABS,
      });
      expect(result.ok).toBe(false);
      expect(result.refusal).toBe(REFUSAL.npmTokenIngressMissing);
      // STRONGER than "zero schedule launches": zero launches of ANY kind. The
      // check precedes the probe, so not even the probe runs.
      expect(stub.launches, 'not even the identity probe runs').toHaveLength(0);
      expect(stub.scheduleLaunches).toHaveLength(0);
      expect(result.launches).toBe(0);
      // The refusal names the VARIABLE and never a value.
      expect(result.detail).toContain(NPM_TOKEN_INGRESS_ENV);
      if (value !== null && value !== '') {
        expect(result.detail, 'the refusal quotes no value').not.toContain(value);
      }
    });
  }

  it('a missing ingress is a DISTINCT refusal from every other gate failure', async () => {
    // Four gate refusals, four codes. Collapsing any pair would make a missing
    // credential indistinguishable from a wrong wrapper in the job log.
    const codes = new Set([
      REFUSAL.wrapperFingerprintMismatch,
      REFUSAL.expectedShaMalformed,
      REFUSAL.npmTokenIngressMissing,
      REFUSAL.headMismatch,
    ]);
    expect(codes.size).toBe(4);
  });
});

// ── 4. Deterministic receipts and the published envelope ───────────────

describe('Phase 50A R3 — receipts are complete and deterministic', () => {
  it('one receipt per attempted command, in order, with the full outcome record', async () => {
    const head = repoHead();
    const stub = makeStub(head);
    const result = await runFixedProof({
      run: stub.run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    expect(result.receipts).toHaveLength(SCHEDULE.length);
    for (const [i, receipt] of result.receipts.entries()) {
      expect(receipt.ordinal).toBe(i + 1);
      expect(receipt.label).toBe(SCHEDULE[i]!.label);
      expect(receipt.file).toBe(SCHEDULE[i]!.file);
      expect(receipt.argv).toEqual([...SCHEDULE[i]!.args]);
      expect(receipt.status).toBe(0);
      expect(receipt.signal).toBeNull();
      expect(receipt.timed_out).toBe(false);
      expect(receipt.spawn_failed).toBe(false);
      expect(receipt.outcome).toBe('ok');
    }
  });

  it('two runs of the same stubbed schedule produce BYTE-IDENTICAL receipt text', async () => {
    const head = repoHead();
    const once = await runFixedProof({
      run: makeStub(head).run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    const twice = await runFixedProof({
      run: makeStub(head).run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    expect(renderReceipts(twice.receipts)).toBe(renderReceipts(once.receipts));
    expect(renderReport(twice)).toBe(renderReport(once));
    // Determinism means no run-varying value leaked in.
    const text = renderReceipts(once.receipts);
    expect(/\d{4}-\d{2}-\d{2}T/.test(text), 'no timestamp').toBe(false);
    expect(text.includes(ROOT), 'no absolute path prefix').toBe(false);
  });

  it('the envelope publishes both digests, the expected SHA and the observed HEAD', async () => {
    const head = repoHead();
    const result = await runFixedProof({
      run: makeStub(head).run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    const report = renderReport(result);
    expect(report).toContain(`sha256:${PACKET_WRAPPER_SHA256}`);
    expect(result.executor_digest).toBe(
      `sha256:${sha256OfBytes(readFileSync(EXECUTOR_ABS))}`,
    );
    expect(report).toContain(result.executor_digest!);
    expect(report).toContain(head);
    expect(report).toContain('outcome                 : PASS');
    // The identity facts precede the receipts, so a refusal is as inspectable
    // as a success.
    expect(report.indexOf('wrapper_digest_observed')).toBeLessThan(
      report.indexOf('command receipts:'),
    );
  });

  it('a REFUSED run still publishes the envelope', async () => {
    const result = await runFixedProof({
      run: makeStub(OTHER_SHA).run,
      env: gateEnv('not-a-sha'),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    expect(result.ok).toBe(false);
    const report = renderReport(result);
    expect(report).toContain('outcome                 : REFUSED');
    expect(report).toContain(REFUSAL.expectedShaMalformed);
    expect(report).toContain('(none launched)');
  });
});

// ── 5. NEGATIVE: the identity gate launches nothing when it refuses ────

describe('Phase 50A R3 — a failed identity gate launches ZERO schedule commands', () => {
  it('BAD WRAPPER: a digest mismatch launches zero schedule commands', async () => {
    // A disposable copy of the tree with a MUTATED wrapper. The repository file
    // is never touched.
    const probe = mkdtempSync(join(tmpdir(), 'p50a-badwrapper-'));
    try {
      cpSync(WRAPPER_ABS, join(probe, 'wrapper.yml'));
      const mutated = `${readFileSync(WRAPPER_ABS, 'utf8')}# one appended comment\n`;
      const fakeRoot = mkdtempSync(join(tmpdir(), 'p50a-fakeroot-'));
      try {
        const dest = join(fakeRoot, WRAPPER_REL);
        cpSync(WRAPPER_ABS, dest, { recursive: false, force: true, errorOnExist: false });
        writeFileSync(dest, mutated, 'utf8');
        const head = repoHead();
        const stub = makeStub(head);
        const result = await runFixedProof({
          run: stub.run,
          env: gateEnv(head),
          repoRoot: fakeRoot,
          selfPath: EXECUTOR_ABS,
        });
        expect(result.ok).toBe(false);
        expect(result.refusal).toBe(REFUSAL.wrapperFingerprintMismatch);
        // THE ASSERTION: an exact count of zero, not merely a nonzero exit.
        expect(stub.scheduleLaunches).toHaveLength(0);
        expect(result.launches).toBe(0);
        expect(result.receipts).toHaveLength(0);
        // Not even the identity probe ran: the wrapper gate precedes it.
        expect(stub.launches).toHaveLength(0);
      } finally {
        rmSync(fakeRoot, { recursive: true, force: true });
      }
    } finally {
      rmSync(probe, { recursive: true, force: true });
    }
    // The repository wrapper is UNMUTATED.
    expect(sha256OfBytes(readFileSync(WRAPPER_ABS))).toBe(PACKET_WRAPPER_SHA256);
  });

  it('HEAD MISMATCH: a valid wrapper with the wrong HEAD launches zero commands', async () => {
    const stub = makeStub(OTHER_SHA, { head: OTHER_SHA });
    const result = await runFixedProof({
      run: stub.run,
      env: gateEnv(repoHead()),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    expect(result.ok).toBe(false);
    expect(result.refusal).toBe(REFUSAL.headMismatch);
    expect(stub.scheduleLaunches).toHaveLength(0);
    expect(result.launches).toBe(0);
    // The probe ran (that is how HEAD was read); nothing else did.
    expect(stub.launches.map((l) => l.label)).toEqual([IDENTITY_PROBE.label]);
  });

  it('MALFORMED EXPECTED SHA: every bad shape refuses with zero launches', async () => {
    const head = repoHead();
    const bad: Array<string | null> = [
      null,
      '',
      head.slice(0, 39), // 39 hex
      `${head}a`, // 41 hex
      head.toUpperCase(), // uppercase
      `${head.slice(0, 39)}z`, // non-hex
      ` ${head}`, // leading whitespace
      `${head} `, // trailing whitespace
      `${head}\n`, // trailing newline
    ];
    for (const value of bad) {
      const stub = makeStub(head);
      const env = gateEnv(value);
      const result = await runFixedProof({
        run: stub.run,
        env,
        repoRoot: ROOT,
        selfPath: EXECUTOR_ABS,
      });
      expect(result.ok, `must refuse ${JSON.stringify(value)}`).toBe(false);
      expect(result.refusal).toBe(REFUSAL.expectedShaMalformed);
      expect(stub.scheduleLaunches, `zero launches for ${JSON.stringify(value)}`).toHaveLength(0);
      expect(result.launches).toBe(0);
    }
  });

  it('UNREADABLE HEAD: a failing probe refuses with zero schedule launches', async () => {
    const head = repoHead();
    const stub = makeStub(head, { probeStatus: 128 });
    const result = await runFixedProof({
      run: stub.run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    expect(result.ok).toBe(false);
    expect(result.refusal).toBe(REFUSAL.headUnreadable);
    expect(stub.scheduleLaunches).toHaveLength(0);
  });

  // ── THE IDENTITY PROBE'S OWN CONTAINMENT IS LOAD-BEARING ────────────
  //
  // The sequence-63 audit REJECTED the previous slice because this gate read
  // `probe.error`, `probe.status` and `probe.stdout` and NOTHING else. A probe
  // that reported the exact expected SHA from a process whose group could not
  // be proven gone passed the gate and launched all twelve schedule entries —
  // so uncontained identity work authorized successors. Each case below leaves
  // the SHA perfectly valid and breaks only one containment fact.
  it('UNVERIFIED IDENTITY CONTAINMENT: each single broken fact refuses with ZERO launches', async () => {
    const head = repoHead();
    const cases: Array<[string, StubOptions['probeContainment']]> = [
      ['absence not proven', { group_verified_absent: false }],
      ['reaping not observed', { direct_child_reaped: false }],
      ['termination error', { termination_error: 'EPERM' }],
      // Absence unproven AND the bound lapsed: still the containment refusal,
      // because an unprovable tree outranks the reason we stopped waiting.
      ['unprovable after a lapse', { group_verified_absent: false, timed_out: true }],
    ];
    for (const [why, probeContainment] of cases) {
      const stub = makeStub(head, { probeContainment });
      const result = await runFixedProof({
        run: stub.run,
        env: gateEnv(head),
        repoRoot: ROOT,
        selfPath: EXECUTOR_ABS,
      });
      expect(result.ok, `must refuse: ${why}`).toBe(false);
      expect(result.refusal, `refusal code for: ${why}`).toBe(
        REFUSAL.identityContainmentUnverified,
      );
      // THE CLAIM THAT MATTERS: not one successor ran.
      expect(stub.scheduleLaunches, `zero schedule launches for: ${why}`).toHaveLength(0);
      expect(result.launches, `zero counted launches for: ${why}`).toBe(0);
      // The gate refused on containment, so it never reached the identity
      // comparison — a valid SHA must not be laundered into an authorization.
      expect(result.receipts ?? [], `no receipts for: ${why}`).toHaveLength(0);
    }
  });

  it('VERIFIED IDENTITY CONTAINMENT: a fully contained probe authorizes the whole schedule', async () => {
    // The positive control. Every containment fact holds and the canonical
    // classification reports no containment failure, so all twelve entries run.
    // Without this, the refusal tests above could pass on a gate that refuses
    // unconditionally.
    const head = repoHead();
    const stub = makeStub(head);
    const result = await runFixedProof({
      run: stub.run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    expect(result.ok).toBe(true);
    expect(result.refusal ?? null).toBeNull();
    expect(stub.scheduleLaunches).toHaveLength(SCHEDULE.length);
    expect(SCHEDULE.length).toBe(12);
    // The probe is an identity probe, never a schedule command.
    expect(stub.scheduleLaunches.map((l) => l.label)).not.toContain(IDENTITY_PROBE.label);
  });

  it('NO FALLBACK: no refusal path exits zero or runs a shortened schedule', async () => {
    const head = repoHead();
    const refusals = [
      { env: gateEnv(null), stubHead: head },
      { env: gateEnv('nope'), stubHead: head },
      { env: gateEnv(head, null), stubHead: head },
      { env: gateEnv(head), stubHead: OTHER_SHA },
    ];
    for (const { env, stubHead } of refusals) {
      const stub = makeStub(head, { head: stubHead });
      const result = await runFixedProof({
        run: stub.run,
        env,
        repoRoot: ROOT,
        selfPath: EXECUTOR_ABS,
      });
      expect(result.ok).toBe(false);
      expect(result.refusal).not.toBeNull();
      expect(stub.scheduleLaunches).toHaveLength(0);
    }
  });

  it('SELF-AUTHORIZATION IS IMPOSSIBLE: a different well-formed workflow is refused', async () => {
    // Valid YAML, unconditional pull_request, exactly one required head_sha
    // input — everything a SHAPE recognizer would accept. Raw-byte identity
    // refuses it, which is the whole point: the gate is not shape recognition.
    const lookalike = [
      'name: Phase 50A PostgreSQL Conformance',
      'on:',
      '  pull_request:',
      '  workflow_dispatch:',
      '    inputs:',
      '      head_sha:',
      "        description: 'Exact 40-hex commit SHA'",
      '        required: true',
      '        type: string',
      'permissions:',
      '  contents: read',
      '  packages: read',
      'jobs:',
      '  postgres-proof:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - name: Phase 50A fixed proof executor',
      `        run: node ${EXECUTOR_REL}`,
      '',
    ].join('\n');
    const fakeRoot = mkdtempSync(join(tmpdir(), 'p50a-lookalike-'));
    try {
      const dest = join(fakeRoot, WRAPPER_REL);
      cpSync(WRAPPER_ABS, dest, { force: true, errorOnExist: false });
      writeFileSync(dest, lookalike, 'utf8');
      const head = repoHead();
      const stub = makeStub(head);
      const result = await runFixedProof({
        run: stub.run,
        env: gateEnv(head),
        repoRoot: fakeRoot,
        selfPath: EXECUTOR_ABS,
      });
      expect(result.ok).toBe(false);
      expect(result.refusal).toBe(REFUSAL.wrapperFingerprintMismatch);
      expect(stub.scheduleLaunches).toHaveLength(0);
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
    expect(sha256OfBytes(readFileSync(WRAPPER_ABS))).toBe(PACKET_WRAPPER_SHA256);
  });
});

// ── 6. NEGATIVE: any wrapper byte change fails ─────────────────────────

describe('Phase 50A R3 — ANY workflow byte change fails the fingerprint', () => {
  const canonical = () => readFileSync(WRAPPER_ABS);

  const mutations: Array<{ name: string; mutate: (bytes: Buffer) => Buffer }> = [
    {
      name: 'a flipped quote',
      mutate: (b) => Buffer.from(b.toString('utf8').replace("'22'", '"22"'), 'utf8'),
    },
    {
      name: 'one appended comment line',
      mutate: (b) => Buffer.concat([b, Buffer.from('# inert comment\n', 'utf8')]),
    },
    {
      name: 'one CRLF line ending',
      mutate: (b) => Buffer.from(b.toString('utf8').replace('on:\n', 'on:\r\n'), 'utf8'),
    },
    {
      name: 'a prepended UTF-8 BOM',
      mutate: (b) => Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), b]),
    },
    {
      name: 'one added trailing space',
      mutate: (b) => Buffer.from(b.toString('utf8').replace('on:\n', 'on: \n'), 'utf8'),
    },
    {
      name: 'one re-indented line',
      mutate: (b) =>
        Buffer.from(b.toString('utf8').replace('  contents: read', '   contents: read'), 'utf8'),
    },
    {
      name: 'a removed trailing newline',
      mutate: (b) => b.subarray(0, b.length - 1),
    },
    {
      name: 'a YAML document separator',
      mutate: (b) => Buffer.concat([Buffer.from('---\n', 'utf8'), b]),
    },
  ];

  for (const { name, mutate } of mutations) {
    it(`refuses ${name}`, async () => {
      const original = canonical();
      const mutated = mutate(Buffer.from(original));
      // The mutation must genuinely differ, or the case proves nothing.
      expect(mutated.equals(original), `${name} must change the bytes`).toBe(false);

      const fakeRoot = mkdtempSync(join(tmpdir(), 'p50a-mutate-'));
      try {
        const dest = join(fakeRoot, WRAPPER_REL);
        cpSync(WRAPPER_ABS, dest, { force: true, errorOnExist: false });
        writeFileSync(dest, mutated);
        const head = repoHead();
        const stub = makeStub(head);
        const result = await runFixedProof({
          run: stub.run,
          env: gateEnv(head),
          repoRoot: fakeRoot,
          selfPath: EXECUTOR_ABS,
        });
        expect(result.ok, `${name} must fail closed`).toBe(false);
        expect(result.refusal).toBe(REFUSAL.wrapperFingerprintMismatch);
        expect(stub.scheduleLaunches, `${name} launches nothing`).toHaveLength(0);
      } finally {
        // No probe directory is left behind.
        rmSync(fakeRoot, { recursive: true, force: true });
      }

      // RE-READ the repository file to prove the mutation never touched it.
      expect(readFileSync(WRAPPER_ABS).equals(original)).toBe(true);
      expect(sha256OfBytes(readFileSync(WRAPPER_ABS))).toBe(PACKET_WRAPPER_SHA256);
    });
  }
});

// ── 7. NEGATIVE: a stop is a stop ──────────────────────────────────────

describe('Phase 50A R3 — a failing command stops every successor', () => {
  const cases: Array<{
    mode: 'status' | 'signal' | 'timeout' | 'spawn' | 'termination' | 'containment';
    refusal: string;
    check: (r: {
      signal: string | null;
      timed_out: boolean;
      spawn_failed: boolean;
      outcome: string;
      group_signalled: boolean;
      escalated: boolean;
      direct_child_reaped: boolean;
      group_verified_absent: boolean;
    }) => void;
  }> = [
    {
      mode: 'status',
      refusal: REFUSAL.commandFailed,
      check: (r) => {
        expect(r.outcome).toBe('failed');
        expect(r.timed_out).toBe(false);
        expect(r.spawn_failed).toBe(false);
      },
    },
    {
      mode: 'signal',
      refusal: REFUSAL.commandSignalled,
      check: (r) => {
        // A signal death is recorded DISTINCTLY, not as a timeout.
        expect(r.outcome).toBe('signalled');
        expect(r.signal).toBe('SIGKILL');
        expect(r.timed_out).toBe(false);
      },
    },
    {
      mode: 'timeout',
      refusal: REFUSAL.commandTimedOut,
      check: (r) => {
        // A timeout is recorded DISTINCTLY from a plain nonzero status AND from
        // an ordinary signal death, even though the OS reports it as SIGTERM.
        expect(r.outcome).toBe('timed-out');
        expect(r.timed_out).toBe(true);
      },
    },
    {
      mode: 'spawn',
      refusal: REFUSAL.commandSpawnFailed,
      check: (r) => {
        expect(r.outcome).toBe('spawn-failed');
        expect(r.spawn_failed).toBe(true);
        expect(r.timed_out).toBe(false);
      },
    },
    {
      // NEW CLASS. Signalling the process group was refused by the operating
      // system. The most specific diagnosis available, so it outranks the
      // containment failure it necessarily also causes.
      mode: 'termination',
      refusal: REFUSAL.commandTerminationFailed,
      check: (r) => {
        expect(r.outcome).toBe('termination-failed');
        expect(r.spawn_failed).toBe(false);
        expect(r.group_verified_absent).toBe(false);
      },
    },
    {
      // NEW CLASS, and the one the sequence-54 blocker needed. The bound lapsed,
      // the group was signalled AND escalated, the direct child was reaped — and
      // the tree still could not be proven gone. That is NOT a plain lapse: a
      // design that reported it as one is exactly what let six descendants
      // survive into runner cleanup while the receipt looked clean.
      mode: 'containment',
      refusal: REFUSAL.commandContainmentUnverified,
      check: (r) => {
        expect(r.outcome).toBe('containment-unverified');
        expect(r.group_signalled).toBe(true);
        expect(r.escalated).toBe(true);
        expect(r.direct_child_reaped).toBe(true);
        expect(r.group_verified_absent, 'absence was NOT established').toBe(false);
        // The lapse that led here is recorded, but it is not the verdict.
        expect(r.timed_out).toBe(true);
        expect(r.outcome).not.toBe('timed-out');
      },
    },
  ];

  for (const { mode, refusal, check } of cases) {
    it(`stops after a ${mode} failure and surfaces it distinctly`, async () => {
      const failAt = 3;
      const head = repoHead();
      const stub = makeStub(head, { failAt, failMode: mode });
      const result = await runFixedProof({
        run: stub.run,
        env: gateEnv(head),
        repoRoot: ROOT,
        selfPath: EXECUTOR_ABS,
      });
      expect(result.ok, 'a stop is never reported as success').toBe(false);
      expect(result.refusal).toBe(refusal);
      // EXACT count: entries after k were never launched.
      expect(stub.scheduleLaunches).toHaveLength(failAt);
      expect(result.launches).toBe(failAt);
      expect(result.receipts).toHaveLength(failAt);
      const last = result.receipts[failAt - 1]!;
      expect(last.label).toBe(SCHEDULE[failAt - 1]!.label);
      check(last);
      // The successor label appears nowhere in the receipts.
      const successor = SCHEDULE[failAt]!.label;
      expect(result.receipts.some((r) => r.label === successor)).toBe(false);
    });
  }

  it('the first schedule entry failing means exactly one launch', async () => {
    const head = repoHead();
    const stub = makeStub(head, { failAt: 1, failMode: 'status' });
    const result = await runFixedProof({
      run: stub.run,
      env: gateEnv(head),
      repoRoot: ROOT,
      selfPath: EXECUTOR_ABS,
    });
    expect(result.ok).toBe(false);
    expect(stub.scheduleLaunches).toHaveLength(1);
    expect(stub.scheduleLaunches[0]!.label).toBe('npm-ci');
  });
});
