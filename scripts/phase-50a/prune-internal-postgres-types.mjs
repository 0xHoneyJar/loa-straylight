#!/usr/bin/env node
// Phase 50A — prune the INTERNAL PostgreSQL declaration subtree from the
// generated type artifact.
//
// Why this exists
// ───────────────
// `dist-types/` is the committed, type-only package artifact for tag/release
// consumers (Phase 24H; ADR-024G). `npm run build` runs
// `clean:types && tsc -p tsconfig.build.json`, which emits a declaration for
// every file under `src/`, so adding the Phase 50A PostgreSQL store made the
// build emit 12 declarations that are NOT part of that artifact.
//
// That left the generated tree and the committed/packed tree unequal: `build`
// produced 12 untracked files, and because `package.json#files` includes
// `dist-types/`, `npm pack` (which runs `prepare` → `build`) packed them.
// "Generated but not committed" is not a coherent package contract; either the
// declarations are package artifacts or they are not.
//
// The Phase 50A patch packet resolves this with the INTERNAL-ONLY EXCLUSION
// contract: the PostgreSQL store is internal (it is deliberately not exported
// from `src/straylight/index.ts` and has no package subpath — importing `pg`
// from every type-only consumer is exactly what the package boundary avoids),
// so its declarations are NOT package artifacts and must not appear in the
// final generated or packed tree at all.
//
// This script is that exclusion. It runs from the authorized `package.json`
// build path AFTER declaration generation and removes only the internal
// PostgreSQL declaration subtree. `dist-types/` itself is a forbidden path for
// this packet and is not edited: nothing tracked is touched, and the only files
// removed are ones this build just generated.
//
// Why a prune step rather than a tsconfig exclusion
// ─────────────────────────────────────────────────
// `tsconfig.build.json` is outside this packet's allowed paths, and excluding
// the directory there would also remove it from the declaration compilation —
// which would stop `npm run typecheck`-equivalent declaration checking of the
// store's own public shape. Emitting and then pruning keeps the store fully
// type-checked while keeping it out of the artifact.
//
// Safety posture
// ──────────────
//   * The prune target is a FIXED relative path constant. Nothing is derived
//     from argv or the environment.
//   * It refuses to delete anything git TRACKS. If a PostgreSQL declaration
//     were ever committed, this script fails closed rather than silently
//     deleting a tracked file — that situation is a package-contract decision
//     for the operator, not something a build step may resolve.
//   * It refuses to run if the target path escapes `dist-types/`.
//   * Removing nothing is a normal outcome (an already-pruned tree), reported
//     as such. Verification that the tree and package are correct lives in
//     `verify-generated-artifact.mjs`, not here.
//   * Output goes to stderr, so a caller capturing stdout (e.g.
//     `npm pack --dry-run --json`, which runs `prepare`) gets clean JSON.

import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '../..');
export const DIST_TYPES = resolve(ROOT, 'dist-types');

/**
 * The internal declaration subtree to remove, repository-relative with POSIX
 * separators. A single fixed constant: the pruned set is a stated contract, not
 * a pattern that could widen as the tree changes.
 */
export const INTERNAL_SUBTREE = 'dist-types/src/straylight/storage/postgres';

/** Absolute path of {@link INTERNAL_SUBTREE}. */
export function internalSubtreePath() {
  return resolve(ROOT, INTERNAL_SUBTREE);
}

/**
 * List every file under `dir`, recursively, as repository-relative POSIX paths.
 * Returns `[]` when `dir` does not exist.
 *
 * @param {string} dir
 * @returns {string[]} sorted, repository-relative POSIX paths
 */
export function listFiles(dir) {
  if (!existsSync(dir)) return [];
  /** @type {string[]} */
  const out = [];
  const walk = (abs) => {
    for (const entry of readdirSync(abs)) {
      const child = resolve(abs, entry);
      if (statSync(child).isDirectory()) walk(child);
      else out.push(relative(ROOT, child).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * Repository paths git tracks under `pathspec`. Uses `git ls-files`, so the
 * answer is git's own, not an inference from `.gitignore`.
 *
 * @param {string} pathspec repository-relative pathspec
 * @returns {string[]} tracked repository-relative POSIX paths
 */
export function trackedFiles(pathspec) {
  const result = spawnSync('git', ['ls-files', '-z', '--', pathspec], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.error !== undefined) {
    throw new Error(`prune-internal-postgres-types: git ls-files failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `prune-internal-postgres-types: git ls-files exited ${String(result.status)}: ` +
        `${(result.stderr ?? '').trim()}`,
    );
  }
  return (result.stdout ?? '').split('\0').filter((p) => p.length > 0);
}

/**
 * Remove the internal PostgreSQL declaration subtree.
 *
 * @returns {{ removed: string[], tracked: string[] }}
 *   `removed` — the files deleted (empty when already absent).
 *   `tracked` — tracked files found in the subtree. Non-empty means NOTHING was
 *               removed and the caller must fail closed.
 */
export function pruneInternalDeclarations() {
  const target = internalSubtreePath();

  // Containment: the target must be inside dist-types/. A constant makes this
  // true today; asserting it means a future edit cannot quietly point the
  // deletion somewhere else.
  const rel = relative(DIST_TYPES, target);
  if (rel.length === 0 || rel.startsWith('..') || rel.includes(`..${sep}`)) {
    throw new Error(
      `prune-internal-postgres-types: refusing to prune ${target}, which is not inside ${DIST_TYPES}`,
    );
  }

  const present = listFiles(target);
  if (present.length === 0) return { removed: [], tracked: [] };

  // Fail closed rather than delete anything committed. A tracked declaration
  // here would mean the package contract had changed to "these ARE artifacts",
  // which this build step has no authority to decide.
  const tracked = trackedFiles(INTERNAL_SUBTREE);
  if (tracked.length > 0) return { removed: [], tracked };

  rmSync(target, { recursive: true, force: true });
  return { removed: present, tracked: [] };
}

function main() {
  const log = (msg) => process.stderr.write(`${msg}\n`);
  const { removed, tracked } = pruneInternalDeclarations();

  if (tracked.length > 0) {
    log('prune-internal-postgres-types: REFUSED — the internal PostgreSQL declaration');
    log('subtree contains git-TRACKED files, so it is not internal-only after all:');
    for (const t of tracked) log(`  - ${t}`);
    log('Resolving this is a package-contract decision, not a build-step action.');
    process.exit(1);
  }

  if (removed.length > 0) {
    log(`prune-internal-postgres-types: removed ${removed.length} internal declaration(s):`);
    for (const r of removed) log(`  - ${r}`);
  } else {
    log('prune-internal-postgres-types: nothing to prune');
  }
}

// Side-effecting only when invoked directly, so the helpers above stay pure
// for the verifier and the unit tests that import them.
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main();
}
