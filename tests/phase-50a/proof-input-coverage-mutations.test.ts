// Phase 50A R3 — the INDEPENDENT PROBE / MUTATION MATRIX over the trigger
// contract and the no-leak scan-set manifest.
//
// Each mutation is applied to a DISPOSABLE COPY of the tree, one named test is run
// against that copy, and the mutation is reverted by discarding the copy. The
// repository tree is never mutated, and each case re-reads the repository file
// afterwards to prove it.
//
// SEPARATE FILE, deliberately: the harness runs vitest against the copy with
// `-t <test name>`, so a harness living beside the tests it targets would match its
// own cases inside the copy and recurse. This file is also removed from every copy.
//
// ── WHAT THIS MATRIX COVERS, AND WHAT IT NO LONGER DOES ─────────────────
//
// TRIGGER PROBES (T*) mutate the WORKFLOW and require a named test in
// `tests/phase-50a/workflow-trigger-contract.test.ts` to fail. They are the
// independent form of the enumerated trigger rejections: a filtered or removed
// `pull_request`, an introduced `paths`/`paths-ignore`, a removed or broadened
// `workflow_dispatch`, `head_sha` ceasing to be the sole required input, and the
// removal of the exact 40-hex validation, the exact checkout `ref`, or the
// `git rev-parse HEAD` equality assertion.
//
// SCAN-SET PROBES (P*) mutate the MANIFEST or its consumer and require a named
// test in `tests/phase-50a/no-leak-and-neutrality.test.ts` to fail — that being the
// one suite whose scan set the manifest declares.
//
// DISCLOSED RETIREMENTS. The rejected matrix carried three parser-bound cases that
// are GONE, deleted with the abstraction they probed rather than silently dropped:
//
//   * P1 replaced `scripts/phase-50a/workflow-trigger-parser.mjs` so it
//     SYNTHESIZED a path the workflow no longer declared — the mutation that
//     defeated the rejected suite, aimed at a byte-offset provenance assertion.
//     Both the parser and the provenance assertion are DELETED. Nothing derives a
//     trigger claim from a parsed value or offset any more, so there is no
//     parser-replacement or parser-bypass mutation left to be load-bearing: T1-T11
//     mutate the workflow's own bytes and are checked directly against them.
//   * P8 removed each `on.pull_request.paths` entry INDIVIDUALLY. There is no
//     `paths` filter to remove; the pull-request trigger is unconditional. T1/T2
//     invert it — INTRODUCING a filter is now the refusal.
//   * P9 removed `workflow_dispatch` and expected the PARSER's absence reason. The
//     mutation survives as T5, checked against the workflow's bytes instead.
//
// Also retired: P3's target. It truncated `readManifest`'s root list to prove the
// consumer could not narrow the declaration, and it aimed at a coverage test that
// no longer exists; it survives as P3 below, re-pointed at the no-leak suite.

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { MANIFEST_PATH } from '../../scripts/phase-50a/proof-input-manifest.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');

/** This file's own name — removed from every copy, to prevent recursion. */
const SELF = 'proof-input-coverage-mutations.test.ts';

/** The workflow the trigger probes mutate. */
const WORKFLOW = '.github/workflows/phase-50a-postgres-conformance.yml';
/** The trigger contract the trigger probes must break. */
const TRIGGER_SUITE = 'tests/phase-50a/workflow-trigger-contract.test.ts';
/** The no-leak suite, the one suite whose scan set the manifest declares. */
const NO_LEAK_SUITE = 'tests/phase-50a/no-leak-and-neutrality.test.ts';

/**
 * Copy the tree, apply `mutate` to one file, and run one named test against the
 * copy.
 *
 * The copy lives INSIDE the repository: ordinary Node resolution walks upward for
 * `node_modules`, so a copy under the OS temp directory could not resolve the
 * project's dependencies and every mutation would appear to fail for the wrong
 * reason. The BASELINE cases prove the harness is sound before any result is
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
    // instead of the intended one.
    //
    // The set is MINIMAL on purpose. Copying `docs/` wholesale pulled 6.4 MB of
    // unrelated ADRs into each of ~30 copies; on a hosted runner's slower disk
    // that dominated the step's wall clock so heavily that the first attempt at
    // this proof ran for over two hours without finishing, while completing in
    // ~26 s locally (even pinned to two cores). Only the two `docs` paths the
    // manifest actually declares are copied.
    for (const tree of ['src', 'tests', 'fixtures', 'scripts', 'migrations', '.github']) {
      cpSync(resolve(REPO_ROOT, tree), join(dir, tree), { recursive: true });
    }
    for (const file of [
      'tsconfig.json',
      'package.json',
      'package-lock.json',
      'docker-compose.phase-50a.yml',
      // The proof document — a declared manifest root, copied individually rather
      // than by pulling in all of `docs/`.
      'docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md',
    ]) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      cpSync(resolve(REPO_ROOT, file), join(dir, file));
    }
    // `docs/runbooks` — the other declared `docs` root.
    cpSync(resolve(REPO_ROOT, 'docs/runbooks'), join(dir, 'docs/runbooks'), { recursive: true });
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
      {
        cwd: dir,
        encoding: 'utf8',
        // BOUNDED. An inner run that hung would otherwise park this suite until
        // the CI job's own limit, turning a diagnosable failure into an opaque
        // timeout — which is exactly what a slower runner turned the first
        // attempt at this proof into. A killed run reports no test results, so
        // `assertRanTests` fails loudly instead of the mutation looking like a
        // pass.
        timeout: 120_000,
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
 * A run proves nothing unless it EXECUTED the named test, or failed while trying
 * to collect it. A `-t` pattern matching nothing can exit 0, which would make
 * every mutation look like a pass.
 *
 * Two shapes count as evidence that the mutation reached the suite:
 *
 *   * `Tests N passed|failed` — the named test ran;
 *   * `Test Files N failed` with `Tests  no tests` — the mutation broke the file
 *     at COLLECTION time, before any test could run. That is a genuine, and
 *     stronger, failure of the model. It must be distinguished from a `-t` pattern
 *     that matched nothing, which reports `skipped` and exits 0.
 *
 * A zero-match run (`Tests 0 passed (0)`, or any `skipped` summary) is rejected.
 */
function assertRanTests(result: { output: string }, context: string): void {
  const ranTests = /Tests\s+\d+\s+(?:passed|failed)/.test(result.output);
  const failedAtCollection =
    /Test Files\s+\d+\s+failed/.test(result.output) && /Tests\s+no tests/.test(result.output);
  expect(
    ranTests || failedAtCollection,
    `${context}: the inner run must report test results or a collection failure. Output tail:\n${result.output.slice(-2000)}`,
  ).toBe(true);
  expect(
    /Tests\s+0\s+passed\s*\(0\)/.test(result.output),
    `${context}: the inner run must not have matched ZERO tests`,
  ).toBe(false);
  expect(
    /Tests\s+\d+\s+skipped/.test(result.output),
    `${context}: a skipped summary means the -t pattern matched nothing`,
  ).toBe(false);
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

  it('the non-vacuity guard accepts a COLLECTION failure but never a SKIPPED run', () => {
    // A mutation that makes the suite throw while being collected is a real, and
    // stronger, failure — but vitest then reports `Tests  no tests`, which the
    // earlier guard could not distinguish from a `-t` pattern matching nothing.
    // Both shapes are asserted directly so the distinction is proven.
    const collectionFailure =
      ' Test Files  1 failed (1)\n      Tests  no tests\n   Start at  00:00:00\n';
    const zeroMatch = ' Test Files  1 skipped (1)\n      Tests  1 skipped (1)\n';
    const bareNoTests = ' Test Files  1 passed (1)\n      Tests  no tests\n';
    expect(() => assertRanTests({ output: collectionFailure }, 'collection probe')).not.toThrow();
    expect(() => assertRanTests({ output: zeroMatch }, 'collection probe')).toThrow(/skipped/);
    // `no tests` WITHOUT a failed file is not evidence of anything either.
    expect(() => assertRanTests({ output: bareNoTests }, 'collection probe')).toThrow(
      /report test results or a collection failure/,
    );
  });

  it('BASELINE (trigger): the UNMUTATED copy PASSES the trigger contract (the harness is sound)', () => {
    const result = runMutated(
      WORKFLOW,
      // A benign whitespace change inside a comment: it must not affect the
      // contract, which is itself worth proving.
      (s) => s.replace('# Least privilege:', '#  Least privilege:'),
      TRIGGER_SUITE,
      'THE CLAIM: the checked-in workflow satisfies the trigger contract completely',
    );
    assertRanTests(result, 'baseline/trigger');
    expect(result.ok, `the trigger baseline must PASS:\n${result.output.slice(-4000)}`).toBe(true);
  }, 300_000);

  it('BASELINE (scan set): the UNMUTATED copy PASSES the no-leak scan (the harness is sound)', () => {
    const result = runMutated(
      MANIFEST_PATH,
      (s) => s.replace('"version": 1', '"version": 1 '),
      NO_LEAK_SUITE,
      'the manifest is readable, non-vacuous, and every declared root contributes tracked files',
    );
    assertRanTests(result, 'baseline/scan-set');
    expect(result.ok, `the scan-set baseline must PASS:\n${result.output.slice(-4000)}`).toBe(true);
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
    // ── TRIGGER PROBES ────────────────────────────────────────────────────
    {
      id: 'T1',
      description: 'FILTER the pull_request trigger by introducing a `paths` key',
      file: WORKFLOW,
      mutate: (s) => {
        expect(s, 'the unconditional pull_request trigger must be present').toContain(
          '  pull_request:\n',
        );
        return s.replace(
          '  pull_request:\n',
          "  pull_request:\n    paths:\n      - 'src/straylight/**'\n",
        );
      },
      testFile: TRIGGER_SUITE,
      testName: 'NO paths or paths-ignore key appears anywhere in the workflow',
      expectOutput: /path-filter-present|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T2',
      description: 'introduce a `paths-ignore` key',
      file: WORKFLOW,
      mutate: (s) =>
        s.replace('  pull_request:\n', "  pull_request:\n    paths-ignore:\n      - 'docs/**'\n"),
      testFile: TRIGGER_SUITE,
      testName: 'NO paths or paths-ignore key appears anywhere in the workflow',
      expectOutput: /path-filter-present|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T3',
      description: 'REMOVE pull_request from the trigger block',
      file: WORKFLOW,
      mutate: (s) => s.replace('  pull_request:\n', ''),
      testFile: TRIGGER_SUITE,
      testName:
        'the pull-request trigger is UNCONDITIONAL and the manual trigger is BOUNDED to one required head_sha',
      expectOutput: /trigger-block-not-canonical|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T4',
      description: 'PARAMETERIZE pull_request with a branch filter',
      file: WORKFLOW,
      mutate: (s) =>
        s.replace('  pull_request:\n', '  pull_request:\n    branches:\n      - main\n'),
      testFile: TRIGGER_SUITE,
      testName:
        'the pull-request trigger is UNCONDITIONAL and the manual trigger is BOUNDED to one required head_sha',
      expectOutput: /trigger-block-not-canonical|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T5',
      description: 'REMOVE the workflow_dispatch trigger',
      file: WORKFLOW,
      mutate: (s) => {
        const start = s.indexOf('  workflow_dispatch:');
        expect(start, 'workflow_dispatch must be declared').toBeGreaterThan(-1);
        const end = s.indexOf('\n# Least privilege', start);
        expect(end).toBeGreaterThan(start);
        return s.slice(0, start) + s.slice(end + 1);
      },
      testFile: TRIGGER_SUITE,
      testName:
        'the pull-request trigger is UNCONDITIONAL and the manual trigger is BOUNDED to one required head_sha',
      expectOutput: /trigger-block-not-canonical|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T6',
      description: 'BROADEN workflow_dispatch with an additional input',
      file: WORKFLOW,
      mutate: (s) =>
        s.replace(
          '        type: string\n',
          "        type: string\n      target_repo:\n        description: 'extra'\n        required: false\n        type: string\n",
        ),
      testFile: TRIGGER_SUITE,
      testName:
        'the pull-request trigger is UNCONDITIONAL and the manual trigger is BOUNDED to one required head_sha',
      expectOutput: /trigger-block-not-canonical|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T7',
      description: 'RENAME head_sha so it is no longer the declared input',
      file: WORKFLOW,
      mutate: (s) => s.replace('      head_sha:\n', '      commit_sha:\n'),
      testFile: TRIGGER_SUITE,
      testName:
        'the pull-request trigger is UNCONDITIONAL and the manual trigger is BOUNDED to one required head_sha',
      expectOutput: /trigger-block-not-canonical|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T8',
      description: 'make head_sha OPTIONAL, so it is no longer the sole REQUIRED input',
      file: WORKFLOW,
      mutate: (s) => s.replace('        required: true\n', '        required: false\n'),
      testFile: TRIGGER_SUITE,
      testName:
        'the pull-request trigger is UNCONDITIONAL and the manual trigger is BOUNDED to one required head_sha',
      expectOutput: /trigger-block-not-canonical|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T9',
      description: 'REMOVE the exact 40-hex head-SHA validation (leaving the comment about it)',
      file: WORKFLOW,
      mutate: (s) => {
        expect(s).toContain("grep -Eq '^[0-9a-f]{40}$'");
        return s.replace("grep -Eq '^[0-9a-f]{40}$'", "grep -Eq '.*'");
      },
      testFile: TRIGGER_SUITE,
      testName: 'the exact 40-hex head-SHA validation is intact',
      expectOutput: /head-sha-validation-absent|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T10',
      description: 'REDIRECT the checkout ref away from the derived SHA',
      file: WORKFLOW,
      mutate: (s) => {
        expect(s).toContain('ref: ${{ steps.target.outputs.sha }}');
        return s.replace(
          'ref: ${{ steps.target.outputs.sha }}',
          'ref: ${{ github.event.pull_request.head.ref }}',
        );
      },
      testFile: TRIGGER_SUITE,
      testName: 'the checkout pins the EXACT derived SHA as its ref',
      expectOutput: /checkout-ref-not-pinned|Tests\s+\d+\s+failed/,
    },
    {
      id: 'T11',
      description: 'REMOVE the git rev-parse HEAD equality assertion (leaving the step name)',
      file: WORKFLOW,
      mutate: (s) => {
        expect(s).toContain('actual="$(git rev-parse HEAD)"');
        return s
          .replace('actual="$(git rev-parse HEAD)"', 'actual="$TARGET_SHA"')
          .replace('"$actual" != "$TARGET_SHA"', '1 -eq 1');
      },
      testFile: TRIGGER_SUITE,
      testName:
        'the git rev-parse HEAD equality assertion is intact and precedes every substantive step',
      expectOutput: /head-equality-(?:assertion|comparison)-absent|Tests\s+\d+\s+failed/,
    },

    // ── SCAN-SET PROBES ───────────────────────────────────────────────────
    {
      id: 'P2',
      description: 'DELETE a declared scan-set root',
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
      testFile: NO_LEAK_SUITE,
      testName: 'the estate domain model is untouched by Phase 50A',
      expectOutput: /domain|must be a manifest-covered domain input|Tests\s+\d+\s+failed/,
    },
    {
      id: 'P4',
      description: 'RENAME the declaration key (`roots` → `paths`)',
      file: MANIFEST_PATH,
      mutate: (s) => {
        expect(s, 'the roots key must be present').toContain('"roots"');
        return s.replace('"roots"', '"paths"');
      },
      testFile: NO_LEAK_SUITE,
      testName: 'the manifest is readable, non-vacuous, and every declared root contributes tracked files',
      expectOutput: /must declare a `roots` array|Tests\s+(?:\d+\s+failed|no tests)/,
    },
    {
      id: 'P5',
      description: 'make the declaration VACUOUS (empty root list)',
      file: MANIFEST_PATH,
      mutate: (s) => {
        const parsed = JSON.parse(s) as Record<string, unknown>;
        return JSON.stringify({ ...parsed, roots: [] }, null, 2);
      },
      testFile: NO_LEAK_SUITE,
      testName: 'the manifest is readable, non-vacuous, and every declared root contributes tracked files',
      expectOutput: /declares no roots|Tests\s+(?:\d+\s+failed|no tests)/,
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
      testFile: NO_LEAK_SUITE,
      testName: 'the manifest is readable, non-vacuous, and every declared root contributes tracked files',
      expectOutput: /resolves to NO tracked file|Tests\s+(?:\d+\s+failed|no tests)/,
    },
    {
      id: 'P7',
      description: 'NARROW a declared root while real files remain under it',
      file: MANIFEST_PATH,
      mutate: (s) => {
        // `src/straylight` → `src/straylight/storage/postgres`. The narrowed root
        // still resolves to real files, so only the "every real file under a
        // declared root is scanned" direction catches it — via the no-leak suite,
        // whose domain-model scan then finds no domain files at all.
        expect(s).toContain('"path": "src/straylight"');
        return s.replace('"path": "src/straylight"', '"path": "src/straylight/storage/postgres"');
      },
      testFile: NO_LEAK_SUITE,
      testName: 'the estate domain model is untouched by Phase 50A',
      expectOutput: /domain|must be a manifest-covered domain input|Tests\s+\d+\s+failed/,
    },
    {
      id: 'P10',
      description:
        'READ AN UNDECLARED INPUT: make the manifest accessor serve a path no root covers',
      file: 'scripts/phase-50a/proof-input-manifest.mjs',
      mutate: (s) => {
        // The accessor's refusal is what keeps the no-leak suite's declaration
        // complete. Removing it means an undeclared input can be read.
        const anchor = '  if (!covered.includes(path)) {';
        expect(s, 'the undeclared-read refusal must be present').toContain(anchor);
        return s.replace(anchor, '  if (false) {');
      },
      testFile: NO_LEAK_SUITE,
      testName: 'an UNDECLARED input cannot be read through the manifest accessor',
      expectOutput: /not covered by any declared root|Tests\s+\d+\s+failed/,
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

  it('the retired parser and its declarations are GONE, not merely unused', () => {
    // The disclosed retirement, asserted mechanically rather than only described:
    // no parser file, no parser-bypass or parser-replacement mutation, and no
    // surviving import of either from anywhere in the proof.
    for (const retired of [
      'scripts/phase-50a/workflow-trigger-parser.mjs',
      'scripts/phase-50a/workflow-trigger-parser.d.mts',
      'tests/phase-50a/proof-input-coverage.test.ts',
    ]) {
      const tracked = spawnSync('git', ['ls-files', '--error-unmatch', '--', retired], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      expect(tracked.status, `${retired} must no longer be tracked`).not.toBe(0);
    }
    // And no CODE in the tracked tree still reaches for them. Scoped to the
    // executable surfaces — scripts, tests, workflows — because the retirement must
    // be DISCLOSED, not concealed: this harness and the proof document both name
    // the parser in order to record that it is gone, and a check that forbade the
    // name outright would push the disclosure out of the tree.
    const grep = spawnSync(
      'git',
      [
        'grep',
        '-l',
        '-e',
        'workflow-trigger-parser',
        '-e',
        'parseWorkflowTriggers',
        '--',
        'scripts',
        'tests',
        '.github',
      ],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    const survivors = (grep.stdout ?? '')
      .split('\n')
      .filter((p) => p.length > 0)
      .filter((p) => p !== `tests/phase-50a/${SELF}`);
    expect(survivors, 'no code may still reference the retired parser').toEqual([]);
    // And the parser is load-bearing for NO proof claim because there is nothing
    // left for it to have parsed: the workflow declares no path filter at all.
    // Read directly from the workflow's own lines, so this assertion cannot be
    // satisfied by anything but the file.
    const workflowLines = readFileSync(resolve(REPO_ROOT, WORKFLOW), 'utf8').split('\n');
    expect(
      workflowLines.filter((l) => !l.trim().startsWith('#') && /^\s*paths(-ignore)?\s*:/.test(l)),
      'the workflow must declare no path filter, so no trigger parse is load-bearing',
    ).toEqual([]);
  });

  it('no coverage probe directory survives in the repository tree', () => {
    const stray = readdirSync(REPO_ROOT).filter((e) => e.startsWith('.r3-coverage-probe-'));
    expect(stray, 'every coverage probe directory must have been removed').toEqual([]);
  });
});
