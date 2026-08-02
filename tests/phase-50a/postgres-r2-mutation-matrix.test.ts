// Phase 50A R2 — the INDEPENDENT MUTATION MATRIX on the corrected append-only
// classification model.
//
// Each mutation is applied to a DISPOSABLE COPY of the source tree, one named
// test is run against that copy, and the mutation is reverted by discarding the
// copy. The repository tree is never mutated, so no other suite — and no build,
// package check, or git operation — can observe it.
//
// WHY THIS SUITE IS A SEPARATE FILE. The harness runs vitest against the copy
// with `-t <test name>`. If the harness lived in the same file as the tests it
// targets, the copy would contain the harness too and `-t` would match the
// harness's OWN cases, recursing: the inner run would spawn further runs and its
// pass/fail would report on the wrong tests entirely. Keeping the harness out of
// every file it targets — and excluding this file from the copy — makes the inner
// run contain exactly the assertions under test.
//
// What each mutation proves, per the packet's R2 mutation-matrix requirement:
//
//   M1  reintroducing a session-local / callback-local append ordinal
//   M2  dropping the session-estate binding check
//   M3  comparing append_position as a caller-controlled field
//   M4  omitting the stored-placement validation (in-snapshot classifier)
//   M5  omitting the stored-placement validation (live-row classifier)
//   M6  taking estate authority from the RECORD instead of the SESSION
//
// Every case asserts the named test FAILS, that it fails for the INTENDED
// reason, and that the repository file is still unmutated afterwards.

import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import {
  phase50aEnabled,
  phase50aGateReport,
  requireReachable,
  sourceHost,
} from './_support.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');

/** This file's own name — excluded from every copy, to prevent recursion. */
const SELF = 'postgres-r2-mutation-matrix.test.ts';

phase50aGateReport('postgres-r2-mutation-matrix');

const maybe = phase50aEnabled() ? describe : describe.skip;

maybe('Phase 50A R2 — independent mutation matrix (each mutation must FAIL a named test)', () => {
  beforeAll(async () => {
    await requireReachable(sourceHost());
  }, 60_000);

  /**
   * Copy the repository's source and test trees into a uniquely-named directory
   * INSIDE the repository, apply `mutate` to one source file, and run one named
   * test file against the mutated copy.
   *
   * Inside the repository is required, not incidental: ordinary Node resolution
   * walks upward for `node_modules`, so a copy under the OS temp directory could
   * not resolve `pg` or the private scoped dependency, and every mutation would
   * appear to "fail" for the wrong reason. The BASELINE case below proves the
   * harness itself is sound before any mutation result is trusted.
   *
   * This file is removed from the copy, so the inner run cannot re-enter the
   * harness (see the module header).
   */
  function runMutated(
    file: string,
    mutate: (source: string) => string,
    testFile: string,
    testNamePattern: string,
  ): { ok: boolean; output: string } {
    const dir = mkdtempSync(join(REPO_ROOT, '.r2-mutation-probe-'));
    try {
      for (const tree of ['src', 'tests', 'fixtures', 'scripts', 'migrations']) {
        cpSync(resolve(REPO_ROOT, tree), join(dir, tree), { recursive: true });
      }
      cpSync(resolve(REPO_ROOT, 'tsconfig.json'), join(dir, 'tsconfig.json'));
      // No harness inside the copy → no recursion.
      rmSync(join(dir, 'tests/phase-50a', SELF), { force: true });

      const target = join(dir, file);
      const original = readFileSync(target, 'utf8');
      const mutated = mutate(original);
      expect(mutated, `the mutation of ${file} must actually change the source`).not.toBe(original);
      writeFileSync(target, mutated);

      // A minimal config for the copy: the repository's own config runs a global
      // build setup that is neither needed nor meaningful for one focused inner
      // run. `node_modules` still resolves upward from the copy.
      writeFileSync(
        join(dir, 'vitest.config.ts'),
        'import { defineConfig } from "vitest/config";\n' +
          'export default defineConfig({ test: { include: ["tests/**/*.test.ts"], environment: "node" } });\n',
      );

      const run = spawnSync(
        process.execPath,
        [
          resolve(REPO_ROOT, 'node_modules/vitest/vitest.mjs'),
          'run',
          testFile,
          '-t',
          testNamePattern,
        ],
        {
          cwd: dir,
          encoding: 'utf8',
          env: { ...process.env, STRAYLIGHT_PHASE_50A_POSTGRES: '1' },
          // BOUNDED. An inner run that hung would otherwise park this suite until
          // the CI job's own limit, turning a diagnosable failure into an opaque
          // timeout. A killed run reports no test results, so `assertRanTests`
          // fails loudly instead of the mutation looking like a pass.
          timeout: 180_000,
          killSignal: 'SIGKILL',
        },
      );
      return {
        ok: run.status === 0,
        output: stripAnsi(`${run.stdout ?? ''}${run.stderr ?? ''}`),
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  /**
   * Remove ANSI escape sequences from captured output.
   *
   * Load-bearing rather than cosmetic. Vitest colourizes its summary when it
   * believes the stream supports it, so `Tests  1 passed` arrives with escape
   * sequences interleaved under CI's terminal settings while being plain
   * locally. Every assertion below matches against this NORMALIZED text, so the
   * harness behaves identically in both places — a guard that only held locally
   * would be no guard at all on the remote proof, which is where it matters.
   */
  function stripAnsi(text: string): string {
    // The escape byte is built from its code point so this source carries no
    // literal control character.
    const esc = String.fromCharCode(27);
    return text.replace(new RegExp(`${esc}\\[[0-9;]*[A-Za-z]`, 'g'), '');
  }

  /**
   * A run is only meaningful if it actually EXECUTED the named test. A `-t`
   * pattern that matches nothing exits 0 in some vitest configurations and
   * would make every mutation look like a pass — the vacuity this checks for.
   */
  function assertRanTests(result: { output: string }, context: string): void {
    expect(result.output, `${context}: the inner run must report test results`).toMatch(
      /Tests\s+\d+\s+(?:passed|failed)/,
    );
    expect(
      /Tests\s+0\s+passed\s*\(0\)/.test(result.output),
      `${context}: the inner run must not have matched ZERO tests`,
    ).toBe(false);
  }

  it('BASELINE: the UNMUTATED copy PASSES the named test (the harness is sound)', () => {
    const result = runMutated(
      'src/straylight/storage/postgres/session.ts',
      (s) => `${s}\n// r2 mutation-harness sanity probe\n`,
      'tests/phase-50a/postgres-r2-outcome-matrix.test.ts',
      'a FULL faithful operation retry converges',
    );
    assertRanTests(result, 'baseline');
    expect(result.ok, `the baseline must PASS:\n${result.output.slice(-4000)}`).toBe(true);
    // And it must have run the intended test, not merely something.
    expect(result.output).toMatch(/Tests\s+1\s+passed/);
  }, 300_000);

  const MUTATIONS: ReadonlyArray<{
    id: string;
    description: string;
    file: string;
    mutate: (source: string) => string;
    testFile: string;
    testName: string;
    /** The reason the failure must be attributable to. */
    expectOutput: RegExp;
  }> = [
    {
      id: 'M1',
      description:
        'reintroduce a session-local append ordinal and compare it as a caller-controlled field',
      file: 'src/straylight/storage/postgres/session.ts',
      mutate: (s) => {
        // A per-table offer counter, folded into BOTH sides of the
        // caller-controlled comparison — exactly the rejected shape.
        const anchor = '    const offered = callerControlledRow(this.boundEstateId, incoming);';
        expect(s, 'the offered-row construction must be present').toContain(anchor);
        return s
          .replace(
            anchor,
            '    const offerOrdinal = (this.mutationOrdinals.get(table) ?? 0) + 1;\n' +
              '    this.mutationOrdinals.set(table, offerOrdinal);\n' +
              '    const offered = {\n' +
              '      ...callerControlledRow(this.boundEstateId, incoming),\n' +
              '      append_position: String(offerOrdinal),\n' +
              '    };',
          )
          .replace(
            '  private closed = false;',
            '  private readonly mutationOrdinals = new Map<string, number>();\n' +
              '  private closed = false;',
          )
          .replace(
            '      const existing = callerControlledRow(row.estate_id, row.record);',
            '      const existing = {\n' +
              '        ...callerControlledRow(row.estate_id, row.record),\n' +
              '        append_position: String(row.append_position),\n' +
              '      };',
          );
      },
      testFile: 'tests/phase-50a/postgres-r2-outcome-matrix.test.ts',
      testName: 'a PARTIAL operation retry converges on exactly the records it offers',
      expectOutput: /PARTIAL operation retry/,
    },
    {
      id: 'M2',
      description: 'drop the session-estate binding check',
      file: 'src/straylight/storage/postgres/session.ts',
      mutate: (s) => {
        // Neuter the binding guard, so estate authority reverts to the record's
        // own self-report — the hole the durable REJECT found.
        const guard = 'if (recordEstateId !== this.boundEstateId) {';
        expect(s, 'the binding guard must be present').toContain(guard);
        return s.replace(guard, 'if (false && recordEstateId !== this.boundEstateId) {');
      },
      testFile: 'tests/phase-50a/postgres-r2-outcome-matrix.test.ts',
      testName: 'a record naming another estate is REFUSED',
      expectOutput: /estate_authority_violation|REFUSED with a distinct reason/,
    },
    {
      id: 'M3',
      description: 'compare append_position as a caller-controlled field in the shared declaration',
      file: 'src/straylight/storage/postgres/rows.ts',
      mutate: (s) => {
        const anchor = "export const CALLER_CONTROLLED_COLUMNS = Object.freeze([\n  'payload',";
        expect(s, 'the shared declaration must be present').toContain(anchor);
        return s.replace(
          anchor,
          "export const CALLER_CONTROLLED_COLUMNS = Object.freeze([\n  'append_position',\n  'payload',",
        );
      },
      testFile: 'tests/phase-50a/postgres-callback-and-row-idempotency.test.ts',
      testName: 'the caller-controlled comparison is declared ONCE and shared',
      expectOutput: /append_position/,
    },
    {
      id: 'M4',
      description: 'omit the stored-placement validation in the IN-SNAPSHOT classifier',
      file: 'src/straylight/storage/postgres/session.ts',
      mutate: (s) => {
        const anchor =
          '      const placement = storedPlacementViolation(scopedPositions, row.append_position);';
        expect(s, 'the in-snapshot placement check must be present').toContain(anchor);
        return s.replace(
          anchor,
          '      const placement: string | null = null; // mutation: placement unvalidated',
        );
      },
      testFile: 'tests/phase-50a/postgres-callback-and-row-idempotency.test.ts',
      testName: 'the caller-controlled comparison is declared ONCE and shared',
      expectOutput: /storedPlacementViolation|placement/,
    },
    {
      id: 'M5',
      description: 'omit the stored-placement validation in the LIVE-row classifier',
      file: 'src/straylight/storage/postgres/persist.ts',
      mutate: (s) => {
        const anchor =
          "    const placement = storedPlacementViolation(scoped, toPosition(existingRow['append_position']));";
        expect(s, 'the live-row placement check must be present').toContain(anchor);
        return s.replace(
          anchor,
          '    const placement: string | null = null; // mutation: live placement unvalidated',
        );
      },
      testFile: 'tests/phase-50a/postgres-callback-and-row-idempotency.test.ts',
      testName: 'the caller-controlled comparison is declared ONCE and shared',
      expectOutput: /storedPlacementViolation|placement/,
    },
    {
      id: 'M6',
      description: "take estate authority from the RECORD instead of the SESSION",
      file: 'src/straylight/storage/postgres/session.ts',
      mutate: (s) => {
        // The write path still refuses cross-estate records (the guard is
        // untouched), so what must catch this is the STRUCTURAL assertion that
        // estate authority is VISIBLY the session's — a record cannot vouch for
        // its own estate even where doing so happens to agree.
        const anchor = 'const offered = callerControlledRow(this.boundEstateId, incoming);';
        expect(s).toContain(anchor);
        return s
          .replace(anchor, 'const offered = callerControlledRow(estateIdOfRecord(incoming), incoming);')
          .replace(
            'function seedPositions<T>',
            'function estateIdOfRecord(record: unknown): ID {\n' +
              '  return (record as { estate_id: ID }).estate_id;\n' +
              '}\n\nfunction seedPositions<T>',
          );
      },
      testFile: 'tests/phase-50a/postgres-callback-and-row-idempotency.test.ts',
      testName: 'the caller-controlled comparison is declared ONCE and shared',
      expectOutput: /boundEstateId|estate authority/,
    },
  ];

  for (const mutation of MUTATIONS) {
    it(`${mutation.id}: ${mutation.description} → FAILS "${mutation.testName}"`, () => {
      const result = runMutated(
        mutation.file,
        mutation.mutate,
        mutation.testFile,
        mutation.testName,
      );
      // Non-vacuity first: a run that matched nothing proves nothing.
      assertRanTests(result, mutation.id);
      expect(
        result.ok,
        `${mutation.id} must FAIL the named test; it passed instead:\n${result.output.slice(-4000)}`,
      ).toBe(false);
      expect(result.output, `${mutation.id} must fail for the INTENDED reason`).toMatch(
        mutation.expectOutput,
      );
      // REVERTED: the mutation was applied to a disposable copy, which
      // `runMutated` removes in its `finally`. Proven directly — the repository
      // file is still the unmutated original, so `mutate` remains a real change
      // to it.
      const live = readFileSync(resolve(REPO_ROOT, mutation.file), 'utf8');
      expect(
        mutation.mutate(live),
        `${mutation.id} must still be a real mutation of the UNCHANGED repository file`,
      ).not.toBe(live);
    }, 300_000);
  }

  it('no mutation probe directory survives in the repository tree', () => {
    // The copies are created with a fixed prefix and removed in `finally`. If one
    // ever survived, it would be untracked content inside the tree that the
    // package and no-leak checks would then have to reason about.
    const stray = readdirSync(REPO_ROOT).filter((e) => e.startsWith('.r2-mutation-probe-'));
    expect(stray, 'every mutation probe directory must have been removed').toEqual([]);
  });
});
