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

// ── Findings 1 & 6 — the proof workflow ────────────────────────────────

describe('Phase 50A patch — the proof workflow authenticates and triggers correctly', () => {
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

  it('exposes an EPHEMERAL token to the install step ONLY, and to no other step', () => {
    const text = readWorkflow();
    // Exactly one NODE_AUTH_TOKEN ASSIGNMENT — comments naming the variable to
    // explain the posture are not assignments and must not be counted as extra
    // exposures.
    const assignments = text
      .split('\n')
      .filter((l) => /^\s*NODE_AUTH_TOKEN\s*:/.test(l));
    expect(assignments).toHaveLength(1);
    expect(assignments[0]).toMatch(
      /\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}|\$\{\{\s*github\.token\s*\}\}/,
    );

    // It belongs to the `npm ci` step. Take the step that ASSIGNS the token and
    // require it to be the install step.
    const steps = text.split(/\n      - name: /).slice(1);
    const tokenSteps = steps.filter((s) => /^\s*NODE_AUTH_TOKEN\s*:/m.test(s));
    expect(tokenSteps).toHaveLength(1);
    expect(tokenSteps[0]).toContain('npm ci');
    expect(tokenSteps[0]?.split('\n')[0]).toMatch(/Install dependencies/);
  });

  it('never echoes, writes, or persists a credential, and adds no fallback registry', () => {
    const text = readWorkflow();
    // No committed credential, no PAT, no token printed or written.
    expect(/echo\s+.*NODE_AUTH_TOKEN|cat\s+.*NODE_AUTH_TOKEN/.test(text)).toBe(false);
    expect(/>>?\s*\.npmrc|npm\s+config\s+set\s+.*authToken/.test(text)).toBe(false);
    expect(/secrets\.(?!GITHUB_TOKEN)[A-Z_]+/.test(text)).toBe(false);
    expect(/ghp_|github_pat_/.test(text)).toBe(false);
    // No alternate/fallback registry and no replacement of the dependency.
    const registries = [...text.matchAll(/https:\/\/[a-z0-9.-]*npm[a-z0-9.-]*/gi)].map((m) => m[0]);
    expect([...new Set(registries)]).toEqual(['https://npm.pkg.github.com']);
    expect(/--registry|registry\.npmjs\.org/.test(text)).toBe(false);
  });

  it('triggers on the three authorized test-input paths the suites actually read', () => {
    const text = readWorkflow();
    for (const path of [
      'src/straylight/index.ts',
      'docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md',
      'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md',
    ]) {
      expect(text, `pull_request.paths must include ${path}`).toContain(`- '${path}'`);
    }
  });

  it('the added trigger paths are EXACTLY the files the no-leak suite reads', () => {
    // Guards against the trigger set drifting from the suite's real inputs: the
    // no-leak test reads these three paths by name, so they must be triggers.
    const noLeak = readFileSync(resolve(ROOT, 'tests/phase-50a/no-leak-and-neutrality.test.ts'), 'utf8');
    const workflow = readWorkflow();
    for (const path of [
      'src/straylight/index.ts',
      'docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md',
      'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md',
    ]) {
      expect(noLeak, `${path} must actually be read by the no-leak suite`).toContain(path);
      expect(workflow).toContain(`- '${path}'`);
    }
  });

  it('runs the artifact/package verification instead of blessing untracked declarations', () => {
    const text = readWorkflow();
    expect(text).toContain('npm run phase-50a:verify-artifact');
    // The replaced assertion required the untracked PostgreSQL declarations to
    // be PRESENT (`test -n`). That inversion must be gone.
    expect(text).not.toContain(
      'test -n "$(git status --porcelain --untracked-files=all -- dist-types/src/straylight/storage/postgres)"',
    );
    expect(text).toContain('git diff --check');
  });

  it('still executes every substantive proof step (none removed by this patch)', () => {
    const text = readWorkflow();
    for (const step of [
      'npm ci',
      'pg_control_system()',
      'npm run build',
      'npm run typecheck',
      'npm test',
      'npm run control-plane:validate',
      'npm run control-plane:test',
      'npm run phase-50a:test',
      'npm run phase-50a:proof',
      'npm run phase-50a:verify-artifact',
    ]) {
      expect(text, `workflow must run: ${step}`).toContain(step);
    }
    // And no step is conditionally skipped.
    expect(/^\s+if:\s/m.test(text.split('steps:')[1] ?? '')).toBe(false);
  });
});
