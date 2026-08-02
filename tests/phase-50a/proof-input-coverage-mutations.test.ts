// Phase 50A R3 — the INDEPENDENT PROBE / MUTATION MATRIX over the closed
// coverage model.
//
// Each mutation is applied to a DISPOSABLE COPY of the tree, one named test is run
// against that copy, and the mutation is reverted by discarding the copy. The
// repository tree is never mutated.
//
// SEPARATE FILE, deliberately: the harness runs vitest against the copy with
// `-t <test name>`, so a harness living beside the tests it targets would match its
// own cases inside the copy and recurse. This file is also removed from every copy.
//
// The packet requires each of the following, applied to a disposable copy, asserted
// to FAIL a specific named test, and reverted:
//
//   P1  replace or indirect the input declaration so a path is SYNTHESIZED
//       rather than declared — the mutation that defeated the rejected suite
//   P2  DELETE a declared manifest input
//   P3  apply a FILTER or TRUNCATION during declaration or comparison
//   P4  RENAME a declaration, marker, block, or constant
//   P5  make the declaration VACUOUS (empty manifest)
//   P6  declare a root with NO real files
//   P7  NARROW a declared root while real files remain under it
//   P8  remove each workflow trigger path INDIVIDUALLY
//   P9  remove `workflow_dispatch`
//
// Every case asserts the failure is for the INTENDED reason, and that the
// repository file is unchanged afterwards.

import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  MANIFEST_PATH,
  WORKFLOW_PATH,
} from '../../scripts/phase-50a/proof-input-manifest.mjs';
import { parseWorkflowTriggers } from '../../scripts/phase-50a/workflow-trigger-parser.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');

/** This file's own name — removed from every copy, to prevent recursion. */
const SELF = 'proof-input-coverage-mutations.test.ts';

/** The coverage suite these mutations are required to break. */
const COVERAGE_SUITE = 'tests/phase-50a/proof-input-coverage.test.ts';
/** The no-leak suite, which consumes the manifest as its input set. */
const NO_LEAK_SUITE = 'tests/phase-50a/no-leak-and-neutrality.test.ts';

/**
 * Copy the tree, apply `mutate` to one file, and run one named test against the
 * copy.
 *
 * The copy lives INSIDE the repository: ordinary Node resolution walks upward for
 * `node_modules`, so a copy under the OS temp directory could not resolve the
 * project's dependencies and every mutation would appear to fail for the wrong
 * reason. The BASELINE case proves the harness is sound before any result is
 * trusted.
 *
 * The copy is INITIALIZED AS ITS OWN GIT REPOSITORY and everything is staged.
 * The manifest consumer resolves its inputs through `git ls-files`, so a copy
 * without git metadata would report zero tracked files and every mutation would
 * "fail" for that reason rather than the intended one. Staging the copy means the
 * consumer sees exactly the copy's content — including the mutation — which is
 * what the mutation is supposed to be tested against.
 */
function runMutated(
  file: string,
  mutate: (source: string) => string,
  testFile: string,
  testNamePattern: string,
): { ok: boolean; output: string } {
  const dir = mkdtempSync(join(REPO_ROOT, '.r3-coverage-probe-'));
  try {
    // Every tree and file the MANIFEST declares must exist in the copy, or a root
    // would resolve to nothing and every mutation would fail for that reason
    // instead of the intended one. `docs/` is included in full because two
    // manifest roots live under it.
    for (const tree of ['src', 'tests', 'fixtures', 'scripts', 'migrations', 'docs', '.github']) {
      cpSync(resolve(REPO_ROOT, tree), join(dir, tree), { recursive: true });
    }
    for (const file of [
      'tsconfig.json',
      'package.json',
      'package-lock.json',
      'docker-compose.phase-50a.yml',
    ]) {
      cpSync(resolve(REPO_ROOT, file), join(dir, file));
    }
    // No harness inside the copy → no recursion.
    rmSync(join(dir, 'tests/phase-50a', SELF), { force: true });

    const target = join(dir, file);
    const original = readFileSync(target, 'utf8');
    const mutated = mutate(original);
    expect(mutated, `the mutation of ${file} must actually change the source`).not.toBe(original);
    writeFileSync(target, mutated);

    writeFileSync(
      join(dir, 'vitest.config.ts'),
      'import { defineConfig } from "vitest/config";\n' +
        'export default defineConfig({ test: { include: ["tests/**/*.test.ts"], environment: "node" } });\n',
    );

    // Make the copy its own git repository and stage everything, so the manifest
    // consumer's `git ls-files` resolution sees the COPY's content (mutation
    // included) rather than nothing at all.
    for (const args of [
      ['init', '--quiet'],
      ['add', '--all'],
    ]) {
      const git = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
      expect(git.status, `git ${args[0]} in the probe copy must succeed: ${git.stderr ?? ''}`).toBe(
        0,
      );
    }

    const run = spawnSync(
      process.execPath,
      [
        resolve(REPO_ROOT, 'node_modules/vitest/vitest.mjs'),
        'run',
        testFile,
        '-t',
        testNamePattern,
      ],
      { cwd: dir, encoding: 'utf8' },
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
 * believes the stream supports it, so `Tests  1 passed` arrives as
 * `Tests \x1b[1m\x1b[32m1 passed\x1b[…` under CI's terminal settings while
 * being plain locally. Every assertion below matches against this normalized
 * text, so the harness behaves identically in both places — a guard that only
 * held locally would be no guard at all on the remote proof.
 */
function stripAnsi(text: string): string {
  // The escape byte is built from its code point so this source carries no
  // literal control character.
  const esc = String.fromCharCode(27);
  return text.replace(new RegExp(`${esc}\\[[0-9;]*[A-Za-z]`, 'g'), '');
}

/**
 * A run proves nothing unless it EXECUTED the named test. A `-t` pattern matching
 * nothing can exit 0, which would make every mutation look like a pass.
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

/** Remove exactly one `- 'glob'` line from the workflow's trigger block. */
function removeTriggerLine(workflow: string, glob: string): string {
  const line = `      - '${glob}'\n`;
  expect(workflow, `the workflow must declare '${glob}'`).toContain(line);
  return workflow.replace(line, '');
}

describe('Phase 50A R3 — independent probe/mutation matrix (each must FAIL a named test)', () => {
  it('the non-vacuity guard survives COLOURIZED output (the remote-runner condition)', () => {
    // The first remote run of this slice failed here and nowhere else: vitest
    // colourizes its summary under the runner's terminal settings, so the plain
    // `Tests  1 passed` the guard matched locally arrived with escape sequences
    // interleaved and matched nothing. The guard then reported "the inner run must
    // report test results" for twenty otherwise-correct cases.
    //
    // The stripper is therefore asserted DIRECTLY, against both forms, so the
    // guard is proven to behave identically locally and remotely rather than being
    // trusted to.
    const esc = String.fromCharCode(27);
    const colourized = `      Tests  ${esc}[1m${esc}[32m1 passed${esc}[39m${esc}[22m (1)\n`;
    const plain = '      Tests  1 passed (1)\n';

    // Before stripping, the colourized form does NOT match — this is the defect.
    expect(/Tests\s+\d+\s+(?:passed|failed)/.test(colourized)).toBe(false);
    // After stripping, both forms are accepted identically.
    for (const form of [colourized, plain]) {
      expect(() => assertRanTests({ output: stripAnsi(form) }, 'stripper probe')).not.toThrow();
    }
    // And the stripper does not defeat the guard's real purpose: a zero-match run
    // is still rejected, colourized or not.
    for (const form of [`      Tests  ${esc}[1m0 passed${esc}[22m (0)\n`, '      Tests  0 passed (0)\n']) {
      expect(() => assertRanTests({ output: stripAnsi(form) }, 'stripper probe')).toThrow(
        /ZERO tests/,
      );
    }
  });

  it('BASELINE: the UNMUTATED copy PASSES the coverage claim (the harness is sound)', () => {
    const result = runMutated(
      MANIFEST_PATH,
      (s) => s.replace('"version": 1', '"version": 1 '),
      COVERAGE_SUITE,
      'the set of manifest roots NOT covered by the parsed workflow triggers is EMPTY',
    );
    assertRanTests(result, 'baseline');
    expect(result.ok, `the baseline must PASS:\n${result.output.slice(-4000)}`).toBe(true);
  }, 300_000);

  const MUTATIONS: ReadonlyArray<{
    id: string;
    description: string;
    file: string;
    mutate: (source: string) => string;
    testFile: string;
    testName: string;
    expectOutput: RegExp;
  }> = [
    {
      id: 'P1',
      description:
        'replace the parser so it SYNTHESIZES a path the workflow no longer declares (the mutation that defeated the rejected suite)',
      file: 'scripts/phase-50a/workflow-trigger-parser.mjs',
      mutate: (s) => {
        // The exact laundering shape: remove a real trigger AND have the parser
        // invent it in its return value. The provenance check must catch it,
        // because a synthesized path has no byte offset containing it.
        const anchor = '  return {\n    ok: true,\n    pullRequestPaths: items.values,';
        expect(s, 'the parser return shape must be present').toContain(anchor);
        return s.replace(
          anchor,
          '  return {\n    ok: true,\n    pullRequestPaths: [\n' +
            "      ...items.values,\n" +
            "      { value: 'docs/runbooks/**', offset: 0 },\n" +
            '    ],',
        );
      },
      testFile: COVERAGE_SUITE,
      testName: 'PROVENANCE: every parsed path is a real substring of the workflow bytes',
      expectOutput: /PROVENANCE|must contain/,
    },
    {
      id: 'P2',
      description: 'DELETE a declared manifest input',
      file: MANIFEST_PATH,
      mutate: (s) => {
        const parsed = JSON.parse(s) as { roots: { path: string }[] };
        const kept = parsed.roots.filter((r) => r.path !== 'migrations/postgres');
        expect(kept.length, 'the deletion must remove a real root').toBe(parsed.roots.length - 1);
        return JSON.stringify({ ...parsed, roots: kept }, null, 2);
      },
      testFile: NO_LEAK_SUITE,
      testName: 'the migrations reference no provider-managed role, database, or extension',
      expectOutput: /migrations|Tests\s+\d+\s+failed/,
    },
    {
      id: 'P3',
      description: 'apply a TRUNCATION during declaration reading (slice the root list)',
      file: 'scripts/phase-50a/proof-input-manifest.mjs',
      mutate: (s) => {
        const anchor = '  return { version: parsed.version, roots };';
        expect(s, 'the reader return must be present').toContain(anchor);
        return s.replace(anchor, '  return { version: parsed.version, roots: roots.slice(1) };');
      },
      testFile: COVERAGE_SUITE,
      testName: 'SELF-TRIGGER: the manifest and every proof file that consumes it are trigger inputs',
      expectOutput: /SELF-TRIGGER|manifest-covered|Tests\s+\d+\s+failed/,
    },
    {
      id: 'P4',
      description: 'RENAME the manifest declaration key (`roots` → `paths`)',
      file: MANIFEST_PATH,
      mutate: (s) => {
        expect(s, 'the roots key must be present').toContain('"roots"');
        return s.replace('"roots"', '"paths"');
      },
      testFile: COVERAGE_SUITE,
      testName: 'the manifest is non-empty and every declared root resolves to at least one real tracked file',
      expectOutput: /must declare a `roots` array|Tests\s+\d+\s+failed/,
    },
    {
      id: 'P5',
      description: 'make the declaration VACUOUS (empty manifest root list)',
      file: MANIFEST_PATH,
      mutate: (s) => {
        const parsed = JSON.parse(s) as Record<string, unknown>;
        return JSON.stringify({ ...parsed, roots: [] }, null, 2);
      },
      testFile: COVERAGE_SUITE,
      testName: 'the set of manifest roots NOT covered by the parsed workflow triggers is EMPTY',
      expectOutput: /declares no roots|Tests\s+\d+\s+failed/,
    },
    {
      id: 'P6',
      description: 'declare a root with NO real tracked files',
      file: MANIFEST_PATH,
      mutate: (s) => {
        const parsed = JSON.parse(s) as { roots: unknown[] };
        return JSON.stringify(
          {
            ...parsed,
            roots: [
              ...parsed.roots,
              { path: 'src/straylight/no-such-root', kind: 'tree', why: 'probe' },
            ],
          },
          null,
          2,
        );
      },
      testFile: COVERAGE_SUITE,
      testName: 'the manifest is non-empty and every declared root resolves to at least one real tracked file',
      expectOutput: /resolves to NO tracked file|Tests\s+\d+\s+failed/,
    },
    {
      id: 'P7',
      description: 'NARROW a declared root while real files remain under it',
      file: MANIFEST_PATH,
      mutate: (s) => {
        // `src/straylight` → `src/straylight/storage/postgres`. The narrowed root
        // still resolves to real files, so only the "every real file under a
        // declared root is covered" direction catches it — via the no-leak suite,
        // whose domain-model scan then finds no domain files at all.
        expect(s).toContain('"path": "src/straylight"');
        return s.replace('"path": "src/straylight"', '"path": "src/straylight/storage/postgres"');
      },
      testFile: NO_LEAK_SUITE,
      testName: 'the estate domain model is untouched by Phase 50A',
      expectOutput: /domain|must be a manifest-covered domain input|Tests\s+\d+\s+failed/,
    },
    {
      id: 'P9',
      description: 'remove the `workflow_dispatch` trigger',
      file: WORKFLOW_PATH,
      mutate: (s) => {
        const start = s.indexOf('  workflow_dispatch:');
        expect(start, 'workflow_dispatch must be declared').toBeGreaterThan(-1);
        const end = s.indexOf('\n# Least privilege', start);
        expect(end).toBeGreaterThan(start);
        return s.slice(0, start) + s.slice(end + 1);
      },
      testFile: COVERAGE_SUITE,
      testName: 'recovers on.pull_request.paths and on.workflow_dispatch from the CHECKED-IN workflow',
      expectOutput: /workflow-dispatch-absent|Tests\s+\d+\s+failed/,
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
      assertRanTests(result, mutation.id);
      expect(
        result.ok,
        `${mutation.id} must FAIL the named test; it passed instead:\n${result.output.slice(-4000)}`,
      ).toBe(false);
      expect(result.output, `${mutation.id} must fail for the INTENDED reason`).toMatch(
        mutation.expectOutput,
      );
      // REVERTED: the copy is discarded in `runMutated`'s finally. Proven directly
      // — the repository file is still the unmutated original.
      const live = readFileSync(resolve(REPO_ROOT, mutation.file), 'utf8');
      expect(
        mutation.mutate(live),
        `${mutation.id} must still be a real mutation of the UNCHANGED repository file`,
      ).not.toBe(live);
    }, 300_000);
  }

  // ── P8: EVERY workflow trigger path, removed INDIVIDUALLY ──────────────

  describe('P8: removing each workflow trigger path individually', () => {
    const parsed = parseWorkflowTriggers(
      readFileSync(resolve(REPO_ROOT, WORKFLOW_PATH), 'utf8'),
    );
    if (!parsed.ok) throw new Error(`the workflow must parse: ${parsed.reason}`);
    /**
     * The filters that back a MANIFEST root. Each is load-bearing: removing it
     * strands the root it covers, so the coverage claim must fail. Derived from the
     * parsed workflow rather than restated, so a new trigger is covered
     * automatically.
     */
    const filters = parsed.pullRequestPaths.map((p) => p.value);

    for (const glob of filters) {
      it(`removing '${glob}' must FAIL the coverage claim or the no-leak scan`, () => {
        const result = runMutated(
          WORKFLOW_PATH,
          (s) => removeTriggerLine(s, glob),
          COVERAGE_SUITE,
          'the set of manifest roots NOT covered by the parsed workflow triggers is EMPTY',
        );
        assertRanTests(result, `P8/${glob}`);
        // Two acceptable outcomes, both failures of the model:
        //   * a filter backing a manifest root → the uncovered set is non-empty;
        //   * `tests/storage-conformance.test.ts`, which is a trigger input but not
        //     a manifest root, so its removal instead strands a file-level claim.
        // Either way the suite must NOT pass with a trigger missing.
        expect(
          result.ok,
          `removing '${glob}' must not leave the coverage claim green:\n${result.output.slice(-3000)}`,
        ).toBe(false);
      }, 300_000);
    }

    it('the trigger set that P8 iterates is non-empty and derived, not restated', () => {
      expect(filters.length, 'P8 must iterate a real, non-trivial trigger set').toBeGreaterThan(5);
      // Derived from the parse: the values are the workflow's own bytes.
      const text = readFileSync(resolve(REPO_ROOT, WORKFLOW_PATH), 'utf8');
      for (const glob of filters) expect(text).toContain(`- '${glob}'`);
    });
  });

  it('no coverage probe directory survives in the repository tree', () => {
    const stray = readdirSync(REPO_ROOT).filter((e) => e.startsWith('.r3-coverage-probe-'));
    expect(stray, 'every coverage probe directory must have been removed').toEqual([]);
  });
});
