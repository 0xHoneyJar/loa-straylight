// Phase 50A patch cycle 1 — generated-artifact contract and workflow surface
// (audit comment 5135002802, findings 1, 5 and 6).
//
// These run WITHOUT a database: they are static assertions about the build
// path, the pruning/verification scripts, and the workflow definition. They are
// deliberately not gated behind the PostgreSQL opt-in, because they must hold on
// every `npm test` run — a regression in the package contract or the workflow
// trigger set would otherwise only surface in the gated proof.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  INTERNAL_SUBTREE,
  listFiles,
  trackedFiles,
} from '../../scripts/phase-50a/prune-internal-postgres-types.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const WORKFLOW = resolve(ROOT, '.github/workflows/phase-50a-postgres-conformance.yml');
const PACKAGE_JSON = resolve(ROOT, 'package.json');

// NOTE ON SCOPE. This suite once carried a workflow-COVERAGE proof: an extractor
// read a declaration of the proof's inputs out of marked comment blocks and
// compared it against the workflow's `on.pull_request.paths`. Two successive
// versions of that model were reopened by audit — the enumeration was never
// complete, "everything DECLARED is covered" is satisfied more easily by declaring
// less, and a mutation could make the workflow-side reader SYNTHESIZE a trigger the
// file no longer carried.
//
// The abstraction is RETIRED, not repaired. The workflow's pull-request trigger is
// UNCONDITIONAL, so trigger completeness is a property of the trigger itself and
// nothing enumerates repository inputs to establish it. The extractor, the
// structural parser that replaced it, its byte offsets, the offset-provenance
// assertion, and the parser-replacement mutation are all DELETED.
//
// AUTHORITY, CORRECTED (supersedes this header's previous claim). An earlier
// version of this note named `tests/phase-50a/workflow-trigger-contract.test.ts`
// "the one remaining authority on the trigger block" and described its checks as
// duplicated here. That was stale from the moment it was written: that file is
// the REJECTED semantic checker, DELETED at patch cycle 3, and it is not an
// authority over anything. The sequence-46 audit recorded the contradiction.
//
// The authority over the wrapper is the RAW-BYTE FINGERPRINT in
// `tests/phase-50a/fixed-proof-executor.test.ts`, which pins the wrapper's exact
// byte length and SHA-256 against the operator-authorized coordinator packet.
// Its independent probe matrix is
// `tests/phase-50a/proof-input-coverage-mutations.test.ts`.
//
// What this suite keeps is its own subject: the generated-artifact/package
// contract, and the workflow's authentication posture and credential handling. It
// is an INDEPENDENT READER of those wrapper properties, not a trigger
// recognizer — two readers of one safeguard is a strength, and neither is
// load-bearing for the other's conclusion.

function readWorkflow(): string {
  return readFileSync(WORKFLOW, 'utf8');
}

// ── Finding 5 — internal-only exclusion contract ───────────────────────

describe('Phase 50A patch — the internal PostgreSQL declarations are excluded, not committed', () => {
  it('the build path invokes the prune step AFTER declaration generation', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as {
      scripts: Record<string, string>;
    };
    // The prune runs from npm's `postbuild` lifecycle hook rather than being
    // spliced into the `build` string. npm runs `postbuild` immediately after
    // `build` completes — including when `build` is reached through `prepare`
    // (and therefore through `npm pack`) — so the ordering guarantee is the
    // same, while the exact `build` string that
    // `tests/phase-24h-package-exports.test.ts` pins stays untouched.
    expect(pkg.scripts['build']).toContain('tsconfig.build.json');
    expect(pkg.scripts['postbuild']).toBe(
      'node scripts/phase-50a/prune-internal-postgres-types.mjs',
    );
    // `prepare` routes through `build`, so `npm pack` gets the pruned tree.
    expect(pkg.scripts['prepare']).toContain('build');
    // And the verification entry point exists.
    expect(pkg.scripts['phase-50a:verify-artifact']).toContain(
      'scripts/phase-50a/verify-generated-artifact.mjs',
    );
  });

  it('no PostgreSQL declaration is git-TRACKED under dist-types', () => {
    expect(trackedFiles(INTERNAL_SUBTREE)).toEqual([]);
    expect(trackedFiles('dist-types').filter((p) => /postgres/i.test(p))).toEqual([]);
  });

  it('no PostgreSQL declaration is present in the generated tree on disk', () => {
    const present = listFiles(resolve(ROOT, 'dist-types')).filter((p) => /postgres/i.test(p));
    expect(present).toEqual([]);
  });

  it('the PostgreSQL store has NO package export or subpath, so the exclusion is coherent', () => {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as {
      types?: string;
      exports?: Record<string, unknown>;
    };
    expect(JSON.stringify(pkg.exports ?? {})).not.toMatch(/postgres/i);
    expect(pkg.types ?? '').not.toMatch(/postgres/i);
    // The root barrel still must not export it (the pre-existing guard, kept
    // here so this file states the whole contract in one place).
    const index = readFileSync(resolve(ROOT, 'src/straylight/index.ts'), 'utf8');
    expect(/postgres/i.test(index)).toBe(false);
  });

  it('no TRACKED declaration references a PostgreSQL declaration, so nothing dangles', () => {
    const dangling: string[] = [];
    for (const rel of trackedFiles('dist-types')) {
      const abs = resolve(ROOT, rel);
      if (!existsSync(abs)) continue;
      const text = readFileSync(abs, 'utf8');
      for (const m of text.matchAll(
        /from\s+['"]([^'"]+)['"]|<reference\s+path\s*=\s*['"]([^'"]+)['"]/g,
      )) {
        const spec = m[1] ?? m[2];
        if (spec !== undefined && /postgres/i.test(spec)) dangling.push(`${rel} → ${spec}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it('the prune script refuses to delete a TRACKED file (it fails closed, never deletes)', async () => {
    const text = readFileSync(
      resolve(ROOT, 'scripts/phase-50a/prune-internal-postgres-types.mjs'),
      'utf8',
    );
    // Structural: the tracked check must gate the removal, and the removal must
    // target the fixed constant.
    expect(text).toContain('trackedFiles(INTERNAL_SUBTREE)');
    expect(text).toContain('if (tracked.length > 0) return { removed: [], tracked };');
    // The tracked check precedes the deletion.
    expect(text.indexOf('trackedFiles(INTERNAL_SUBTREE)')).toBeLessThan(text.indexOf('rmSync('));
  });

  it('the prune target is a fixed constant inside dist-types, not derived from input', () => {
    expect(INTERNAL_SUBTREE).toBe('dist-types/src/straylight/storage/postgres');
    const text = readFileSync(
      resolve(ROOT, 'scripts/phase-50a/prune-internal-postgres-types.mjs'),
      'utf8',
    );
    // No argv/env-derived target.
    expect(/process\.argv\[2\]|process\.env\[/.test(text)).toBe(false);
  });

  it('the verifier enforces every clause of the contract and exits non-zero on any failure', () => {
    const text = readFileSync(
      resolve(ROOT, 'scripts/phase-50a/verify-generated-artifact.mjs'),
      'utf8',
    );
    for (const clause of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9']) {
      expect(text, `verifier must enforce ${clause}`).toContain(`'${clause}'`);
    }
    // Machine-readable package inspection, not a text scrape of pack output.
    expect(text).toContain("'pack', '--dry-run', '--json'");
    expect(text).toContain('JSON.parse');
    // Fails closed.
    expect(text).toContain('process.exit(1)');
  });
});

// ── Findings 1 & 6 — the proof workflow (R3: the FIXED WRAPPER) ────────
//
// SCOPE CHANGE, patch cycle 3 disposition; wrapper bytes and credential posture
// re-fixed by packet comment 5178032683 (the v2 proof-closure slice), which
// superseded packet comment 5169022573.
//
// The workflow is now a CANONICAL WRAPPER whose complete raw bytes are fixed by
// the operator-authorized coordinator packet. Several assertions that used to
// live here were assertions ABOUT WORKFLOW CONTENT, and the fixed wrapper both
// invalidates their shape and makes them unnecessary. They are REPLACED, not
// silently dropped:
//
//   * the run-command ORDERING scan ("every substantive step comes after the
//     exact-head assertion") — the wrapper no longer contains the substantive
//     steps at all; the executor's identity gate precedes its closed schedule in
//     ordinary Node control flow, proven in
//     `tests/phase-50a/fixed-proof-executor.test.ts`;
//   * the `>5 run commands` COUNT and the per-step `run:` command LOOKUP — the
//     wrapper declares exactly ONE run step, and the schedule it delegates to is
//     asserted entry-by-entry against its fixed argv arrays;
//   * the structural `workflow_dispatch` BLOCK SLICE (locate the block, then
//     enumerate input names inside it) — a positional content model of exactly
//     the kind that was reopened twice; the trigger is now pinned by the byte
//     fingerprint;
//   * the exact-head LITERAL scan (`^[0-9a-f]{40}$`, `git rev-parse HEAD`,
//     `ref:`) — those literals moved into the executor, where the behavior is
//     executed rather than recognized;
//   * the multi-line `run: |` body scan for `${{ }}` interpolation — there is no
//     multi-line run body left to scan.
//
// WHAT REMAINS HERE is this suite's own subject, restated over the fixed
// wrapper: its least-privilege permissions, its registry/scope configuration,
// its credential posture, and the fact that it delegates to the fixed executor
// and carries no proof schedule of its own. The byte/digest pin itself lives in
// `tests/phase-50a/fixed-proof-executor.test.ts`; this suite deliberately reads
// the same properties independently, because two readers of one safeguard is a
// strength rather than drift.

describe('Phase 50A R3 — the fixed wrapper authenticates and delegates correctly', () => {
  it('grants least-privilege packages:read alongside contents:read, and nothing more', () => {
    const text = readWorkflow();
    const block = /\npermissions:\n((?:[ \t]+\S.*\n|\n)*)/.exec(text)?.[1] ?? '';
    const granted = [...block.matchAll(/^\s+([a-z-]+):\s*(\S+)/gm)].map((m) => `${m[1]}:${m[2]}`);
    expect(granted.sort()).toEqual(['contents:read', 'packages:read']);
    // No write scope anywhere in the workflow's permissions.
    expect(/^\s+\S+:\s*write\s*$/m.test(block)).toBe(false);
  });

  it('configures setup-node for the GitHub Packages registry and the @0xhoneyjar scope', () => {
    const text = readWorkflow();
    expect(text).toContain("registry-url: 'https://npm.pkg.github.com'");
    expect(text).toContain("scope: '@0xhoneyjar'");
    expect(text).toContain("node-version: '22'");
  });

  it('names NO registry-authentication variable at all', () => {
    const text = readWorkflow();
    // THE CREDENTIAL-NARROWING CORRECTION (sequence-46 finding). The previous
    // wrapper set `NODE_AUTH_TOKEN` on the executor step, so the executor AND
    // every child it spawned — twelve schedule commands and all of their own
    // descendants — inherited it. The name is now absent from the workflow
    // entirely: the executor sets it, for the single install child, and nothing
    // else can inherit what the step never held.
    //
    // Asserted as ABSENCE over the whole file, so re-adding it anywhere fails.
    expect(text, 'the registry variable must not appear in the YAML').not.toContain(
      'NODE_AUTH_TOKEN',
    );
  });

  it('hands the ephemeral token to the executor under the INGRESS name, once', () => {
    const text = readWorkflow();
    const assignments = text
      .split('\n')
      .filter((l) => /^\s*PHASE_50A_NPM_TOKEN\s*:/.test(l));
    expect(assignments).toHaveLength(1);
    expect(assignments[0]).toMatch(
      /\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}|\$\{\{\s*github\.token\s*\}\}/,
    );
    // And it goes to the executor step alone.
    const steps = text.split(/\n      - name: /).slice(1);
    const tokenSteps = steps.filter((s) => /^\s*PHASE_50A_NPM_TOKEN\s*:/m.test(s));
    expect(tokenSteps).toHaveLength(1);
    expect(tokenSteps[0]).toContain('node scripts/phase-50a/fixed-proof-executor.mjs');
  });

  it('never echoes, writes, or persists a credential, and adds no fallback registry', () => {
    const text = readWorkflow();
    expect(/echo\s+.*(?:NODE_AUTH_TOKEN|PHASE_50A_NPM_TOKEN)/.test(text)).toBe(false);
    expect(/cat\s+.*(?:NODE_AUTH_TOKEN|PHASE_50A_NPM_TOKEN)/.test(text)).toBe(false);
    expect(/>>?\s*\.npmrc|npm\s+config\s+set\s+.*authToken/.test(text)).toBe(false);
    expect(/secrets\.(?!GITHUB_TOKEN)[A-Z_]+/.test(text)).toBe(false);
    expect(/ghp_|github_pat_/.test(text)).toBe(false);
    const registries = [...text.matchAll(/https:\/\/[a-z0-9.-]*npm[a-z0-9.-]*/gi)].map((m) => m[0]);
    expect([...new Set(registries)]).toEqual(['https://npm.pkg.github.com']);
    expect(/--registry|registry\.npmjs\.org/.test(text)).toBe(false);
  });

  it('leaves NO checkout credential behind in the working tree', () => {
    const text = readWorkflow();
    // The other half of the sequence-46 least-privilege finding: actions/checkout
    // writes its token into `.git/config` unless told not to, so any later
    // command in the job could have used it. `persist-credentials: false` is now
    // part of the packet-fixed bytes.
    expect(text).toContain('persist-credentials: false');
    // Asserted against the checkout step specifically, not merely somewhere.
    const steps = text.split(/\n      - name: /).slice(1);
    const checkout = steps.find((s) => s.includes('actions/checkout@'));
    expect(checkout, 'the checkout step exists').toBeDefined();
    expect(checkout!).toContain('persist-credentials: false');
  });

  it('declares exactly ONE run step, and it invokes only the fixed executor', () => {
    const text = readWorkflow();
    const runs = [...text.matchAll(/^\s*run:\s*(.*)$/gm)].map((m) => m[1]!.trim());
    expect(runs).toEqual(['node scripts/phase-50a/fixed-proof-executor.mjs']);
    // No inline script body of any form. A block scalar under `run:` is exactly
    // how the rejected checker's ordering model was defeated; the fixed wrapper
    // has nowhere to put one.
    expect(text).not.toContain('run: |');
    expect(text).not.toContain('run: >');
  });

  it('carries NO proof command of its own — the schedule lives in the executor', () => {
    const text = readWorkflow();
    for (const command of [
      'npm run build',
      'npm run typecheck',
      'npm run control-plane:validate',
      'npm run control-plane:test',
      'npm run phase-50a:test',
      'npm run phase-50a:proof',
      'npm run phase-50a:verify-artifact',
      'git diff --check',
      'pg_control_system()',
    ]) {
      expect(text, `the wrapper must not run \`${command}\` itself`).not.toContain(command);
    }
  });

  it('passes the expected head SHA to the executor through the ENVIRONMENT', () => {
    const text = readWorkflow();
    // The executor — not the workflow — validates the shape and asserts HEAD
    // identity. The workflow's only job is to hand over the value, and it does
    // so as an env var rather than interpolating it into shell text.
    expect(text).toContain('PHASE_50A_EXPECTED_HEAD_SHA:');
    expect(text).toContain('github.event.pull_request.head.sha');
    expect(text).toContain('inputs.head_sha');
  });

  it('keeps the checkout pinned to the exact audited head, never the merge ref', () => {
    const text = readWorkflow();
    // Assert over the `ref:` ASSIGNMENT, not the whole document. The wrapper's
    // prose explains WHY the synthetic merge ref is wrong and therefore names
    // it; a whole-document `not.toContain('refs/pull/')` would fail on that
    // explanation while proving nothing about the assignment itself. Treating a
    // safeguard's prose as if it were the safeguard is the precise error that
    // reopened this proof at sequence 41 — here it would bite in the opposite
    // direction, as a false alarm rather than a false pass.
    const refAssignments = [...text.matchAll(/^\s*ref:\s*(.*)$/gm)].map((m) => m[1]!.trim());
    expect(refAssignments).toEqual([
      '${{ github.event.pull_request.head.sha || inputs.head_sha }}',
    ]);
    expect(refAssignments[0], 'never the synthetic merge ref').not.toContain('refs/pull/');
  });

  it('runs unconditionally for every pull request, with a bounded manual path', () => {
    const text = readWorkflow();
    // Kept as a readable statement of intent. NOT load-bearing on its own: it
    // holds because these exact bytes are the packet's, which
    // `tests/phase-50a/fixed-proof-executor.test.ts` pins by digest.
    expect(text).toContain('\n  pull_request:\n');
    expect(/^\s*paths(-ignore)?\s*:/m.test(text), 'no path filter of any kind').toBe(false);
    expect(text).toContain('      head_sha:\n');
    expect(text).toContain('        required: true\n');
    expect(text).toContain('        type: string\n');
    // No step is conditionally skipped.
    expect(/^\s+if:\s/m.test(text.split('steps:')[1] ?? '')).toBe(false);
  });
});
