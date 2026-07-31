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
const NO_LEAK = resolve(ROOT, 'tests/phase-50a/no-leak-and-neutrality.test.ts');
const PROOF_DOC =
  'docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md';
const RUNBOOK = 'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md';

/**
 * Declared fixed inputs that the workflow's `pull_request.paths` does NOT cover.
 *
 * Deriving the complete input set (rather than restating three strings) surfaced
 * these: the estate-domain files the no-leak suite reads to prove Phase 50A did
 * not touch the domain model. A change to any of them can change that suite's
 * verdict, so on the merits they belong in the trigger set.
 *
 * They are RECORDED rather than fixed because `.github/` is a forbidden path for
 * this patch — adding trigger paths is a workflow change this packet does not
 * authorize. Recording them keeps the proof honest in both directions:
 *
 *   * the set is compared for EXACT equality, so a NEW uncovered fixed input is
 *     a failure — which is the drift the audit asked to be made detectable;
 *   * closing a gap without updating this list is also a failure, so the record
 *     cannot quietly become stale.
 *
 * Residual limit, stated plainly: a change to one of these files alone does not
 * trigger the Phase 50A workflow on a pull request. Every one of them is also a
 * forbidden path for this patch and is byte-unchanged here, and `npm test` runs
 * the no-leak suite unconditionally, so the guard itself still executes on every
 * ordinary test run.
 */
const KNOWN_UNCOVERED_INPUTS: readonly string[] = [
  'src/straylight/types.ts',
  'src/straylight/estate.ts',
  'src/straylight/recall.ts',
  'src/straylight/audit.ts',
  'src/straylight/policy.ts',
  'src/straylight/keyring.ts',
  'src/straylight/signatures.ts',
  'src/straylight/commitment.ts',
];
/** A path no declaration contains — the "undeclared input" mutation. */
const UNDECLARED_PROBE = 'src/straylight/anti-drift-undeclared-probe.ts';
/** A path outside every workflow glob — the "uncovered input" mutation. */
const UNCOVERED_PROBE = 'src/straylight/host/anti-drift-uncovered-probe.ts';

function readWorkflow(): string {
  return readFileSync(WORKFLOW, 'utf8');
}

function readNoLeak(): string {
  return readFileSync(NO_LEAK, 'utf8');
}

/**
 * Extract the no-leak suite's AUTHORITATIVE fixed-input declaration from its
 * marked blocks. Nothing is restated here: the sole source is the suite's own
 * source, so this cannot drift from what the suite actually reads.
 */
function declaredFixedInputs(): { treeRoots: string[]; namedInputs: string[] } {
  const text = readNoLeak();
  return {
    treeRoots: extractBlock(text, 'no-leak-tree-roots'),
    namedInputs: extractBlock(text, 'no-leak-named-inputs'),
  };
}

/** The single-quoted paths inside one `straylight:<name>:begin/end` block. */
function extractBlock(text: string, name: string): string[] {
  const begin = `// straylight:${name}:begin`;
  const end = `// straylight:${name}:end`;
  const from = text.indexOf(begin);
  const to = text.indexOf(end);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`no-leak declaration block ${name} not found (markers must not be renamed)`);
  }
  const body = text.slice(from + begin.length, to);
  return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
}

/** The workflow's `pull_request.paths` globs, in declaration order. */
function workflowPathFilters(): string[] {
  const text = readWorkflow();
  // Take the `paths:` list inside the pull_request trigger: contiguous
  // comment-or-item lines. Comments are skipped, so the explanatory notes
  // between entries do not terminate the block.
  const start = text.indexOf('    paths:\n');
  if (start === -1) throw new Error('workflow has no pull_request.paths block');
  const rest = text.slice(start + '    paths:\n'.length).split('\n');
  const globs: string[] = [];
  for (const line of rest) {
    const item = /^\s*- '([^']+)'\s*$/.exec(line);
    if (item?.[1] !== undefined) {
      globs.push(item[1]);
      continue;
    }
    if (/^\s*#/.test(line) || line.trim() === '') continue;
    break;
  }
  return globs;
}

/**
 * Does one repository-relative path trigger the workflow under `globs`?
 *
 * Only the two glob shapes the workflow actually uses are interpreted: an
 * exact path, and a `dir/**` prefix. Anything else is treated as NOT matching
 * — an unrecognized shape must never be assumed to cover something.
 */
function isCovered(path: string, globs: readonly string[]): boolean {
  return globs.some((glob) => {
    if (glob.endsWith('/**')) {
      const dir = glob.slice(0, -3);
      return path === dir || path.startsWith(`${dir}/`);
    }
    if (glob.includes('*')) return false;
    return glob === path;
  });
}

/** Which of `paths` no glob covers, sorted — the anti-drift comparison set. */
function uncoveredAmong(paths: readonly string[], globs: readonly string[]): string[] {
  return paths.filter((p) => !isCovered(p, globs)).sort();
}

/**
 * The no-leak accessor's refusal rule, applied to a candidate declaration. Used
 * by the mutation test to show an undeclared input is rejected without editing
 * the suite on disk.
 */
function simulateReadFixedInput(path: string, declared: readonly string[]): void {
  if (!declared.includes(path)) {
    throw new Error(`no-leak: ${path} is not a declared fixed input.`);
  }
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

  // ── patch cycle 2, finding 3 — anti-drift, derived not hardcoded ───────
  //
  // The defect: the previous pair of tests hardcoded the SAME three strings and
  // only checked each appeared in both the no-leak source and the workflow. A
  // fourth fixed input read by the no-leak suite outside the existing globs
  // would leave both tests green while the workflow omitted it — the assertion
  // was not anti-vacuous.
  //
  // The correction derives the COMPLETE fixed-input set from the no-leak
  // suite's own authoritative declaration (the marked `SCANNED_TREE_ROOTS` and
  // `NAMED_TEXT_INPUTS` blocks) and compares that whole set against the
  // workflow's `pull_request.paths` coverage. Nothing is restated here, so a new
  // input cannot be added without this test seeing it.

  it('the declaration is parsed non-vacuously (the extractor really finds both blocks)', () => {
    const declared = declaredFixedInputs();
    // Guard the guard: an extractor that silently matched nothing would make
    // every comparison below pass for the wrong reason.
    expect(declared.treeRoots.length).toBeGreaterThan(5);
    expect(declared.namedInputs.length).toBeGreaterThan(10);
    // And the declaration must be the suite's REAL behaviour, not a stale list:
    // every declared name is read through the refusing accessor.
    const noLeak = readNoLeak();
    expect(noLeak).toContain('function readFixedInput(');
    expect(noLeak).toContain('is not a declared fixed input');
    // No by-name read may bypass the accessor. `readFileSync` appears only in
    // the tree walker and inside `readFixedInput` itself.
    const bypasses = [...noLeak.matchAll(/readFileSync\(resolve\(ROOT, *'([^']+)'/g)].map(
      (m) => m[1],
    );
    expect(bypasses, 'every by-name read must go through readFixedInput').toEqual([]);
  });

  it('the declared fixed inputs are covered by the workflow, except an EXACT recorded set', () => {
    const declared = declaredFixedInputs();
    const globs = workflowPathFilters();
    expect(globs.length).toBeGreaterThan(5);

    const uncovered = [...declared.treeRoots, ...declared.namedInputs]
      .filter((p) => !isCovered(p, globs))
      .sort();

    // EXACT equality, not a subset check. That is what makes this anti-drift:
    // a newly added fixed input outside the workflow's globs changes this set
    // and fails, and closing one of the recorded gaps also fails (so the record
    // cannot go stale). See KNOWN_UNCOVERED_INPUTS for why these are recorded
    // rather than fixed.
    expect(
      uncovered,
      'the set of fixed inputs without workflow path coverage must match the recorded set exactly',
    ).toEqual([...KNOWN_UNCOVERED_INPUTS].sort());

    // Every path that IS covered stays covered: the tree roots and the two
    // inputs patch cycle 1 added are load-bearing triggers.
    for (const path of declared.treeRoots) {
      expect(isCovered(path, globs), `tree root ${path} must trigger the workflow`).toBe(true);
    }
    for (const path of ['src/straylight/index.ts', PROOF_DOC, RUNBOOK]) {
      expect(isCovered(path, globs), `${path} must trigger the workflow`).toBe(true);
    }
  });

  it('MUTATION: an undeclared fixed input is refused, and an uncovered declared one fails', () => {
    // (a) Adding a by-name read WITHOUT declaring it is refused at read time.
    // This is the mechanism that keeps the declaration complete: the accessor
    // throws, so the suite cannot quietly acquire an undeclared input.
    const declared = declaredFixedInputs();
    expect(declared.namedInputs).not.toContain(UNDECLARED_PROBE);
    expect(() => simulateReadFixedInput(UNDECLARED_PROBE, declared.namedInputs)).toThrow(
      /not a declared fixed input/,
    );
    // A declared one is accepted, so the refusal is specific rather than blanket.
    expect(() =>
      simulateReadFixedInput('src/straylight/index.ts', declared.namedInputs),
    ).not.toThrow();

    // (b) Adding a fixed input the workflow does NOT cover changes the uncovered
    // set, so the exact-equality comparison fails. This is the omission case the
    // previous hardcoded test could not detect at all.
    const globs = workflowPathFilters();
    const baseline = uncoveredAmong(
      [...declared.treeRoots, ...declared.namedInputs],
      globs,
    );
    expect(baseline).toEqual([...KNOWN_UNCOVERED_INPUTS].sort());

    expect(isCovered(UNCOVERED_PROBE, globs)).toBe(false);
    const withNewInput = uncoveredAmong(
      [...declared.treeRoots, ...declared.namedInputs, UNCOVERED_PROBE],
      globs,
    );
    expect(withNewInput).not.toEqual(baseline);
    expect(withNewInput).toContain(UNCOVERED_PROBE);

    // (b2) And OMITTING a declared input from the comparison also changes the
    // set — so the check is sensitive to a shrinking declaration too, not only a
    // growing one.
    const omitted = [...declared.treeRoots, ...declared.namedInputs].filter(
      (p) => p !== KNOWN_UNCOVERED_INPUTS[0],
    );
    expect(uncoveredAmong(omitted, globs)).not.toEqual(baseline);

    // (c) And REMOVING a real trigger path breaks coverage for the input that
    // needed it — so the workflow side is load-bearing too, not just the
    // declaration side.
    const withoutDocTrigger = globs.filter((g) => g !== PROOF_DOC);
    expect(isCovered(PROOF_DOC, globs)).toBe(true);
    expect(isCovered(PROOF_DOC, withoutDocTrigger)).toBe(false);
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
