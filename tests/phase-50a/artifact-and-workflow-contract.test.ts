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
/** This suite's own source, for the structural self-guards. */
const SELF = resolve(ROOT, 'tests/phase-50a/artifact-and-workflow-contract.test.ts');
const PROOF_DOC =
  'docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md';
const RUNBOOK = 'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md';

/**
 * Patch cycle 3, concern 2 — there is NO accepted-gap list any more.
 *
 * Patch cycle 2 recorded eight uncovered fixed inputs (the estate-domain files
 * the no-leak suite reads) in a `KNOWN_UNCOVERED_INPUTS` constant, which turned
 * the assertion from "zero uncovered inputs" into "exactly this accepted set".
 * That made the required remote proof bypassable: a pull request changing any
 * ONE of those eight files alone could change the no-leak suite's verdict
 * without ever starting the Phase 50A workflow, and live repository state has no
 * branch protection, no ruleset, and no other pre-merge workflow that would run
 * the suite instead.
 *
 * The gap is now CLOSED at the source — all eight are `pull_request.paths`
 * triggers — and the assertion below requires the uncovered set to equal `[]`.
 * An empty required set is the only shape that cannot be quietly widened: there
 * is no list to append a new exception to.
 */
/** A path no declaration contains — the "undeclared input" mutation. */
const UNDECLARED_PROBE = 'src/straylight/anti-drift-undeclared-probe.ts';
/** A path outside every workflow glob — the "uncovered input" mutation. */
const UNCOVERED_PROBE = 'src/straylight/host/anti-drift-uncovered-probe.ts';

/**
 * Rejection-remediation R3 — the REQUIRED declaration floor.
 *
 * The rejected suite derived the declared-input set from the no-leak suite and
 * required `uncovered == []`. That is monotone in the WRONG direction: a
 * SMALLER declaration satisfies it more easily, so deleting a declared input
 * (Codex: removing `src/straylight/storage/postgres`) left all 33 focused tests
 * green. "Everything declared is covered" says nothing about what must be
 * declared.
 *
 * This is the floor. Every path here MUST be a declared input of the no-leak
 * suite AND a workflow trigger. It is a lower bound, not an allowance: it can
 * only be satisfied by declaring more, never by declaring less, and it is
 * asserted independently of whatever the extractor happens to return.
 *
 * These are the inputs whose content can change the no-leak suite's verdict:
 * the Phase 50A tree roots it walks, and the by-name files it reads.
 */
const REQUIRED_TREE_ROOTS = [
  'src/straylight/storage/postgres',
  'migrations/postgres',
  'scripts/phase-50a',
  'tests/phase-50a',
  'docker-compose.phase-50a.yml',
  '.github/workflows/phase-50a-postgres-conformance.yml',
  PROOF_DOC,
  RUNBOOK,
] as const;

/** The eight estate-domain files plus the public-surface and adapter inputs. */
const REQUIRED_NAMED_INPUTS = [
  'src/straylight/index.ts',
  'src/straylight/types.ts',
  'src/straylight/estate.ts',
  'src/straylight/recall.ts',
  'src/straylight/audit.ts',
  'src/straylight/policy.ts',
  'src/straylight/keyring.ts',
  'src/straylight/signatures.ts',
  'src/straylight/commitment.ts',
  'src/straylight/storage/types.ts',
  'src/straylight/storage/in-memory.ts',
  'src/straylight/storage/jsonl.ts',
] as const;

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
  //
  // ── patch cycle 3, concern 2 — the uncovered set must be EMPTY ──────────
  //
  // Cycle 2 derived the set correctly but then compared it against an accepted
  // eight-path gap (`KNOWN_UNCOVERED_INPUTS`), because `.github/` was forbidden
  // to that packet. Disclosure is not enforcement: a pull request touching only
  // one of those eight could flip the no-leak suite's verdict without starting
  // this workflow at all, and nothing else in live repository state would have
  // run the suite. Cycle 3 adds the eight trigger paths and requires zero
  // uncovered inputs, so coverage is now complete by assertion rather than
  // documented as incomplete.

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

  it('EVERY declared fixed input triggers the workflow — the uncovered set is empty', () => {
    const declared = declaredFixedInputs();
    const globs = workflowPathFilters();
    expect(globs.length).toBeGreaterThan(5);

    const allInputs = [...declared.treeRoots, ...declared.namedInputs];
    const uncovered = uncoveredAmong(allInputs, globs);

    // ZERO uncovered inputs. Not "an accepted set", not a subset check: every
    // path whose content can change this workflow's conclusions must be able to
    // START this workflow. `[]` is the only shape that cannot be widened by
    // appending a new exception — which is exactly how the patch-cycle-2
    // accepted-gap list made the remote proof bypassable.
    expect(
      uncovered,
      'every declared fixed input must have workflow path coverage; the uncovered set must be empty',
    ).toEqual([]);

    // Anti-vacuity: the comparison must have examined a real, non-trivial set.
    // An extractor that returned nothing would also produce an empty uncovered
    // set, and would do so for entirely the wrong reason.
    expect(allInputs.length).toBeGreaterThan(15);

    // And every input is individually covered, so the aggregate above cannot
    // pass while some specific load-bearing trigger is missing.
    for (const path of allInputs) {
      expect(isCovered(path, globs), `fixed input ${path} must trigger the workflow`).toBe(true);
    }
    for (const path of ['src/straylight/index.ts', PROOF_DOC, RUNBOOK]) {
      expect(isCovered(path, globs), `${path} must trigger the workflow`).toBe(true);
    }
  });

  it('the eight estate-domain inputs are trigger paths (patch cycle 3, concern 2)', () => {
    // Named explicitly as well as derived, because these eight are the specific
    // gap the audit required closed. The derived assertion above would also fail
    // if one were dropped from the workflow — this one names WHICH, so a
    // regression reports the actual missing trigger rather than a set diff.
    const globs = workflowPathFilters();
    const declared = declaredFixedInputs();
    for (const path of [
      'src/straylight/types.ts',
      'src/straylight/estate.ts',
      'src/straylight/recall.ts',
      'src/straylight/audit.ts',
      'src/straylight/policy.ts',
      'src/straylight/keyring.ts',
      'src/straylight/signatures.ts',
      'src/straylight/commitment.ts',
    ]) {
      // Still a declared input of the no-leak suite...
      expect(declared.namedInputs, `${path} must remain a declared fixed input`).toContain(path);
      // ...and now also a workflow trigger.
      expect(isCovered(path, globs), `${path} must trigger the Phase 50A workflow`).toBe(true);
    }
  });

  it('no accepted-gap / known-uncovered escape hatch exists in this suite', () => {
    // Structural guard against the mechanism itself returning. The assertion
    // above is only as strong as the absence of a tolerated-exception list, so
    // reintroducing one under any of these names fails here.
    const self = readFileSync(resolve(ROOT, 'tests/phase-50a/artifact-and-workflow-contract.test.ts'), 'utf8');
    for (const banned of [
      'KNOWN_UNCOVERED',
      'ACCEPTED_UNCOVERED',
      'ALLOWED_UNCOVERED',
      'EXPECTED_UNCOVERED',
      'TOLERATED_UNCOVERED',
    ]) {
      // The banned identifier may appear ONLY inside prose explaining its
      // removal, never as a declaration.
      const declarations = [
        ...self.matchAll(new RegExp(`^\\s*(?:const|let|var)\\s+${banned}`, 'gm')),
      ];
      expect(declarations, `${banned} must not be declared`).toEqual([]);
    }
  });

  it('MUTATION: a new uncovered input, a removed trigger, or an undeclared read each FAILS', () => {
    const declared = declaredFixedInputs();
    const globs = workflowPathFilters();
    const allInputs = [...declared.treeRoots, ...declared.namedInputs];

    // The baseline the real assertion enforces: EMPTY. Every mutation below is
    // shown to move the result off `[]`, which is what makes the empty-set
    // requirement load-bearing rather than incidentally true.
    const baseline = uncoveredAmong(allInputs, globs);
    expect(baseline).toEqual([]);

    // (a) An undeclared by-name read is refused at read time. This is the
    // mechanism that keeps the declaration complete: the accessor throws, so the
    // suite cannot quietly acquire an input the workflow does not watch.
    expect(declared.namedInputs).not.toContain(UNDECLARED_PROBE);
    expect(() => simulateReadFixedInput(UNDECLARED_PROBE, declared.namedInputs)).toThrow(
      /not a declared fixed input/,
    );
    // A declared one is accepted, so the refusal is specific rather than blanket.
    expect(() =>
      simulateReadFixedInput('src/straylight/index.ts', declared.namedInputs),
    ).not.toThrow();

    // (b) A NEW fixed input outside every glob makes the uncovered set
    // non-empty, so the assertion fails. This is the "new input is uncovered"
    // mutation.
    expect(isCovered(UNCOVERED_PROBE, globs)).toBe(false);
    const withNewInput = uncoveredAmong([...allInputs, UNCOVERED_PROBE], globs);
    expect(withNewInput).not.toEqual(baseline);
    expect(withNewInput).toEqual([UNCOVERED_PROBE]);

    // (c) REMOVING any required trigger path makes the input that needed it
    // uncovered, so the assertion fails. Checked for EVERY declared input, one
    // at a time — not just one representative path — so no trigger in the set is
    // decorative. This is the "required trigger is removed" mutation.
    for (const input of allInputs) {
      // The glob that actually covers this input. Removing it must break
      // coverage for that input specifically.
      const covering = globs.filter((g) => isCovered(input, [g]));
      expect(covering.length, `${input} must be covered by at least one glob`).toBeGreaterThan(0);
      const without = globs.filter((g) => !covering.includes(g));
      expect(
        isCovered(input, without),
        `removing ${covering.join(', ')} must leave ${input} uncovered`,
      ).toBe(false);
      expect(
        uncoveredAmong(allInputs, without),
        `removing the trigger(s) for ${input} must make the uncovered set non-empty`,
      ).not.toEqual(baseline);
    }

    // (d) The eight estate-domain triggers specifically: each is load-bearing,
    // and removing it strands exactly that input. Named separately because these
    // are the paths patch cycle 3 added — a future edit deleting one must fail
    // here with that path named.
    for (const path of [
      'src/straylight/types.ts',
      'src/straylight/estate.ts',
      'src/straylight/recall.ts',
      'src/straylight/audit.ts',
      'src/straylight/policy.ts',
      'src/straylight/keyring.ts',
      'src/straylight/signatures.ts',
      'src/straylight/commitment.ts',
    ]) {
      const without = globs.filter((g) => g !== path);
      expect(without.length, `${path} must be an exact-path trigger`).toBe(globs.length - 1);
      expect(isCovered(path, without), `${path} must be uncovered once its trigger is removed`).toBe(
        false,
      );
      expect(uncoveredAmong(allInputs, without)).toEqual([path]);
    }
  });

  // ── rejection-remediation R3 — the proof must be mutation-complete ──────
  //
  // The rejected suite derived the declared set and required the uncovered set
  // to be empty. Three mutations survived it (Codex, concern 3):
  //
  //   (a) DELETING `src/straylight/storage/postgres` from the authoritative
  //       declaration left all 33 focused tests green — `uncovered == []` is
  //       satisfied more easily by a SMALLER declaration.
  //   (b) WEAKENING the extractor with `slice(1)` left all 19 contract tests
  //       green — a truncated set still had full coverage.
  //   (c) A RENAMED accepted-gap set applied during extraction absorbed a real
  //       uncovered declared input while all 33 tests passed — the banned-name
  //       list only checked five specific identifiers, and only as declarations
  //       in this file.
  //
  // The corrections below are a required FLOOR (what must be declared, so
  // deletion fails), extractor FIDELITY checks against the file's own literal
  // content (so truncation and filtering fail), and a BEHAVIOURAL accepted-gap
  // guard that tests the comparison's response to a planted uncovered input
  // rather than trusting identifier spellings.

  it('R3: the REQUIRED declaration floor is declared and covered (deletion fails here)', () => {
    // A LOWER BOUND on the declaration, asserted from this file's own required
    // list rather than from whatever the extractor returns. Deleting an input
    // from the no-leak suite now fails here, naming the missing path — the
    // mutation that previously left every test green.
    const declared = declaredFixedInputs();
    const globs = workflowPathFilters();

    for (const root of REQUIRED_TREE_ROOTS) {
      expect(
        declared.treeRoots,
        `${root} must remain a declared no-leak tree root (removing it is the mutation this floor catches)`,
      ).toContain(root);
      expect(isCovered(root, globs), `${root} must trigger the workflow`).toBe(true);
    }
    for (const named of REQUIRED_NAMED_INPUTS) {
      expect(
        declared.namedInputs,
        `${named} must remain a declared no-leak by-name input`,
      ).toContain(named);
      expect(isCovered(named, globs), `${named} must trigger the workflow`).toBe(true);
    }
    // The floor is a MINIMUM, so the real declaration may be larger — but never
    // smaller. Stated as an explicit relation so the intent cannot be misread
    // as an exact-set check that a future addition would break.
    expect(declared.treeRoots.length).toBeGreaterThanOrEqual(REQUIRED_TREE_ROOTS.length);
    expect(declared.namedInputs.length).toBeGreaterThanOrEqual(REQUIRED_NAMED_INPUTS.length);
  });

  it('R3: the extractor is FAITHFUL to the declaration blocks (truncation or filtering fails)', () => {
    // The rejected suite trusted whatever `declaredFixedInputs()` returned. A
    // `slice(1)` inside it — or any filter applied on the way out — silently
    // shrank the compared set and left everything green.
    //
    // Fidelity is checked against an INDEPENDENT count taken from the raw file
    // text: every single-quoted path inside each marked block, counted here
    // without reusing the extractor. A weakened extractor disagrees with the
    // file and fails.
    const text = readNoLeak();
    const declared = declaredFixedInputs();

    const rawCount = (name: string): number => {
      const begin = `// straylight:${name}:begin`;
      const end = `// straylight:${name}:end`;
      const from = text.indexOf(begin);
      const to = text.indexOf(end);
      expect(from, `${name} block must exist`).toBeGreaterThan(-1);
      expect(to, `${name} block must be terminated`).toBeGreaterThan(from);
      const body = text.slice(from + begin.length, to);
      return [...body.matchAll(/'[^']+'/g)].length;
    };

    expect(
      declared.treeRoots.length,
      'the extractor must return EVERY declared tree root (no slice, no filter)',
    ).toBe(rawCount('no-leak-tree-roots'));
    expect(
      declared.namedInputs.length,
      'the extractor must return EVERY declared by-name input (no slice, no filter)',
    ).toBe(rawCount('no-leak-named-inputs'));

    // The FIRST and LAST entries must both survive: `slice(1)` and `slice(0,-1)`
    // are the two cheapest truncations and each drops exactly one end.
    const firstOf = (name: string): string => {
      const begin = `// straylight:${name}:begin`;
      const body = text.slice(text.indexOf(begin) + begin.length, text.indexOf(`// straylight:${name}:end`));
      const all = [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
      return all[0]!;
    };
    const lastOf = (name: string): string => {
      const begin = `// straylight:${name}:begin`;
      const body = text.slice(text.indexOf(begin) + begin.length, text.indexOf(`// straylight:${name}:end`));
      const all = [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]!);
      return all[all.length - 1]!;
    };
    expect(declared.treeRoots).toContain(firstOf('no-leak-tree-roots'));
    expect(declared.treeRoots).toContain(lastOf('no-leak-tree-roots'));
    expect(declared.namedInputs).toContain(firstOf('no-leak-named-inputs'));
    expect(declared.namedInputs).toContain(lastOf('no-leak-named-inputs'));

    // The extractor must be the AUTHORITATIVE reader: it must fail loudly on a
    // renamed marker rather than returning a quietly empty set, because an
    // empty set would make the uncovered comparison vacuously satisfied.
    expect(() => extractBlock(text, 'no-such-block-name')).toThrow(/not found/);
    expect(() => extractBlock('', 'no-leak-tree-roots')).toThrow(/not found/);
  });

  it('R3: the uncovered-set comparison is NON-VACUOUS (an empty declaration fails)', () => {
    // `uncovered == []` is trivially true when the declared set is empty, which
    // is what made both the deletion and the truncation mutations survive. The
    // comparison must therefore be paired with a proven-non-trivial input set,
    // and the pairing itself must be checked.
    const declared = declaredFixedInputs();
    const globs = workflowPathFilters();
    const allInputs = [...declared.treeRoots, ...declared.namedInputs];

    // An EMPTY input set produces an empty uncovered set — the vacuous pass.
    expect(uncoveredAmong([], globs)).toEqual([]);
    // Which is why the real assertion must also require a substantive set. The
    // floor above fixes the minimum; this states the invariant plainly.
    expect(allInputs.length).toBeGreaterThanOrEqual(
      REQUIRED_TREE_ROOTS.length + REQUIRED_NAMED_INPUTS.length,
    );
    // And a glob set that covers everything by accident must not be the reason
    // the comparison passes: a catch-all glob is not present.
    expect(globs).not.toContain('**');
    expect(globs).not.toContain('*');
    expect(globs.some((g) => g === '**/*')).toBe(false);
  });

  it('R3: an accepted-gap mechanism under ANY name is caught BEHAVIOURALLY', () => {
    // The rejected guard banned five identifier spellings, declared in this
    // file. A renamed set applied inside the extraction path defeated it.
    //
    // The behavioural check does not care what a filter is called or where it
    // lives: it plants a genuinely uncovered input into the comparison and
    // requires the comparison to REPORT it. Any mechanism that absorbs
    // exceptions — a list, a set, a predicate, a rename — makes this fail,
    // because an absorbed input would not be reported.
    const declared = declaredFixedInputs();
    const globs = workflowPathFilters();
    const allInputs = [...declared.treeRoots, ...declared.namedInputs];

    // The planted input is genuinely uncovered...
    expect(isCovered(UNCOVERED_PROBE, globs)).toBe(false);
    // ...and the comparison must SURFACE it rather than tolerate it.
    const withProbe = uncoveredAmong([...allInputs, UNCOVERED_PROBE], globs);
    expect(
      withProbe,
      'an uncovered input must be reported, not absorbed by any exception mechanism',
    ).toEqual([UNCOVERED_PROBE]);

    // The same for each required input in turn: strip its covering glob and the
    // comparison must name exactly that input. A tolerated-exception mechanism
    // anywhere in the path would swallow at least one of these.
    for (const input of [...REQUIRED_TREE_ROOTS, ...REQUIRED_NAMED_INPUTS]) {
      const covering = globs.filter((g) => isCovered(input, [g]));
      expect(covering.length, `${input} must be covered`).toBeGreaterThan(0);
      const without = globs.filter((g) => !covering.includes(g));
      expect(
        uncoveredAmong([input], without),
        `stripping coverage for ${input} must report it as uncovered`,
      ).toEqual([input]);
    }

    // Structural backstop, kept from the previous cycle and WIDENED: no
    // exception-shaped constant may be declared under any casing or wording.
    // This is now a supplement to the behavioural check above, not the whole
    // defence — which is what made a rename sufficient to defeat it.
    const self = readFileSync(SELF, 'utf8');
    const suspicious = [
      ...self.matchAll(
        /^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=/gm,
      ),
    ]
      .map((m) => m[1]!)
      .filter((name) =>
        /(?:KNOWN|ACCEPTED|ALLOWED|EXPECTED|TOLERATED|IGNORED|SKIP|EXEMPT|WAIVED|DEBT|EXCLUDE|EXCEPTION)/i.test(
          name,
        ),
      );
    expect(
      suspicious,
      'no accepted-gap / exception-shaped constant may be declared in this suite',
    ).toEqual([]);
  });

  it('R3: the workflow trigger set has no decorative entries and no removed step', () => {
    // The "removed trigger path" mutation, stated over the REQUIRED floor so it
    // cannot weaken alongside the declaration. Each required input must lose
    // coverage when its glob goes.
    const globs = workflowPathFilters();
    for (const path of [...REQUIRED_TREE_ROOTS, ...REQUIRED_NAMED_INPUTS]) {
      const covering = globs.filter((g) => isCovered(path, [g]));
      const without = globs.filter((g) => !covering.includes(g));
      expect(
        isCovered(path, without),
        `${path} must be uncovered once its trigger(s) ${covering.join(', ')} are removed`,
      ).toBe(false);
    }

    // And the substantive proof steps must all still be present, checked here
    // as well as below so a removed step fails inside the R3 contract too.
    const text = readWorkflow();
    for (const step of [
      'npm ci',
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
