#!/usr/bin/env node
// Phase 50A — prove the generated type artifact and the packed package match
// the internal-only exclusion contract EXACTLY.
//
// This replaces the workflow assertion that merely blessed untracked
// PostgreSQL declarations. That check could only ever say "the extra files are
// not committed"; it could not say the generated tree equals the package
// artifact, and it explicitly tolerated files that `npm pack` then shipped.
//
// The contract this verifies, after a clean build:
//
//   C1  no tracked `dist-types` file differs from its committed content
//       (the committed artifact still reproduces byte-identically);
//   C2  the complete generated `dist-types` tree is EXACTLY the tracked
//       `dist-types` tree — no untracked file remains, PostgreSQL or otherwise;
//   C3  no PostgreSQL declaration exists anywhere under `dist-types`, tracked
//       or untracked;
//   C4  every expected tracked package declaration is present on disk;
//   C5  `npm pack --dry-run --json` packs NO PostgreSQL declaration;
//   C6  every packed `dist-types` entry is a git-TRACKED file;
//   C7  every tracked `dist-types` file IS packed (the packed declaration set
//       and the tracked declaration set are equal, not merely nested);
//   C8  no packed declaration references an absent PostgreSQL declaration, so
//       excluding them leaves no dangling consumer-visible reference;
//   C9  `npm pack --dry-run --json` runs `prepare` (hence a full build), and
//       running it leaves the generated PACKAGE ARTIFACT (`dist-types/` and
//       `dist/`) byte-identical to what the clean build produced — i.e.
//       producing the package artifact is idempotent and yields the declared
//       internal-only contract, including re-pruning the PostgreSQL subtree.
//
// C9 is deliberately scoped to the artifact directories rather than the whole
// working tree: an unrelated source edit in the working copy is not a package
// reproducibility failure, and conflating the two would make this verifier
// fail for reasons that say nothing about the package.
//
// Any failure exits non-zero with the specific contract clause named. Every
// check reads real state: git for tracked content, the filesystem for the
// generated tree, and npm's own machine-readable pack output for the package.
//
// Invoked by `npm run phase-50a:verify-artifact` and by the Phase 50A
// workflow. It performs no network access and mutates nothing.

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, sep } from 'node:path';

import {
  DIST_TYPES,
  INTERNAL_SUBTREE,
  ROOT,
  listFiles,
  trackedFiles,
} from './prune-internal-postgres-types.mjs';

/** Marker identifying a PostgreSQL declaration by path. */
const POSTGRES_PATH_RE = /(^|\/)postgres(\/|\.d\.ts$)/;

const failures = [];
const notes = [];

function fail(clause, message, detail) {
  failures.push({ clause, message, detail: detail ?? null });
}

function git(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (result.error !== undefined) {
    throw new Error(`verify-generated-artifact: git ${args[0]} failed: ${result.error.message}`);
  }
  return result;
}

/** Repository-relative POSIX path list, NUL-delimited git output. */
function gitZ(args) {
  const result = git(args);
  if (result.status !== 0) {
    throw new Error(
      `verify-generated-artifact: git ${args.join(' ')} exited ${String(result.status)}: ` +
        `${(result.stderr ?? '').trim()}`,
    );
  }
  return (result.stdout ?? '').split('\0').filter((p) => p.length > 0);
}

// ── C1: tracked dist-types content is unchanged ─────────────────────────

const changedTracked = gitZ(['diff', '--name-only', '-z', '--', 'dist-types']);
if (changedTracked.length > 0) {
  fail(
    'C1',
    'tracked dist-types file(s) differ after a clean build; the committed type artifact ' +
      'no longer reproduces byte-identically',
    changedTracked,
  );
}

// ── C2 / C3: the generated tree equals the tracked tree, PostgreSQL absent ──

const generated = listFiles(DIST_TYPES);
const tracked = trackedFiles('dist-types');
const trackedSet = new Set(tracked);

const untracked = generated.filter((p) => !trackedSet.has(p));
if (untracked.length > 0) {
  fail(
    'C2',
    'the generated dist-types tree contains file(s) that are not tracked, so the generated ' +
      'tree is not equal to the committed package artifact',
    untracked,
  );
}

const missingFromDisk = tracked.filter((p) => !existsSync(resolve(ROOT, p)));
if (missingFromDisk.length > 0) {
  fail('C4', 'tracked dist-types declaration(s) are absent from the generated tree', missingFromDisk);
}

const generatedPostgres = generated.filter((p) => POSTGRES_PATH_RE.test(p));
if (generatedPostgres.length > 0) {
  fail(
    'C3',
    'PostgreSQL declaration(s) remain under dist-types after the build; the internal-only ' +
      'exclusion did not take effect',
    generatedPostgres,
  );
}

const trackedPostgres = trackedFiles(INTERNAL_SUBTREE);
if (trackedPostgres.length > 0) {
  fail(
    'C3',
    'PostgreSQL declaration(s) are git-TRACKED under dist-types; the internal-only contract ' +
      'forbids committing them',
    trackedPostgres,
  );
}

// ── C5 / C6 / C7: the packed package ────────────────────────────────────
//
// `npm pack --dry-run --json` runs the `prepare` lifecycle (a full clean
// build + prune) and reports the exact file list it would ship. That is both
// the package evidence AND the C9 idempotency exercise.

const pack = spawnSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
if (pack.error !== undefined) {
  throw new Error(`verify-generated-artifact: npm pack failed to launch: ${pack.error.message}`);
}
if (pack.status !== 0) {
  throw new Error(
    `verify-generated-artifact: npm pack --dry-run --json exited ${String(pack.status)}: ` +
      `${(pack.stderr ?? '').trim()}`,
  );
}

let packed;
try {
  const parsed = JSON.parse(pack.stdout ?? '');
  if (!Array.isArray(parsed) || parsed.length === 0 || !Array.isArray(parsed[0]?.files)) {
    throw new Error('unexpected shape');
  }
  packed = parsed[0].files.map((f) => String(f.path).split(sep).join('/'));
} catch (err) {
  throw new Error(
    'verify-generated-artifact: could not read the file list from `npm pack --dry-run --json`: ' +
      `${err instanceof Error ? err.message : String(err)}`,
  );
}

const packedPostgres = packed.filter((p) => POSTGRES_PATH_RE.test(p));
if (packedPostgres.length > 0) {
  fail('C5', 'PostgreSQL declaration(s) are included in the package tarball', packedPostgres);
}

const packedDistTypes = packed.filter((p) => p.startsWith('dist-types/')).sort();
const packedUntracked = packedDistTypes.filter((p) => !trackedSet.has(p));
if (packedUntracked.length > 0) {
  fail(
    'C6',
    'packed dist-types entr(ies) are not git-tracked files, so the package ships declarations ' +
      'that are not part of the committed artifact',
    packedUntracked,
  );
}

const trackedNotPacked = tracked.filter((p) => !packedDistTypes.includes(p));
if (trackedNotPacked.length > 0) {
  fail(
    'C7',
    'tracked dist-types declaration(s) are NOT packed, so the package is missing part of the ' +
      'declared type artifact',
    trackedNotPacked,
  );
}

// ── C8: no dangling reference to an excluded declaration ────────────────
//
// A packed declaration that imported or referenced the pruned subtree would be
// a consumer-visible dangling reference — the case the packet says to STOP and
// escalate on rather than widen. Scanning the packed declarations proves the
// exclusion leaves none.

const dangling = [];
for (const p of packedDistTypes) {
  const abs = resolve(ROOT, p);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, 'utf8');
  for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|<reference\s+path\s*=\s*['"]([^'"]+)['"]/g)) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (spec === undefined) continue;
    if (!/postgres/i.test(spec)) continue;
    dangling.push(`${p} → ${spec}`);
  }
}
if (dangling.length > 0) {
  fail(
    'C8',
    'packed declaration(s) reference a PostgreSQL declaration that the internal-only exclusion ' +
      'removes; this is a package-contract decision, not a build fix',
    dangling,
  );
}

// ── C9: producing the package artifact changed nothing tracked ──────────

// The PACKAGE ARTIFACT directories only — the `files` entries that carry
// generated content. A tracked file in either that now differs from its
// committed content means `prepare` produced a different artifact than the
// declared one.
const changedAfterPack = gitZ(['diff', '--name-only', '-z', '--', 'dist-types', 'dist']);
if (changedAfterPack.length > 0) {
  fail(
    'C9',
    'running the `prepare` lifecycle (via npm pack --dry-run) changed tracked package-artifact ' +
      'file(s), so the package artifact is not reproducible from the committed tree',
    changedAfterPack,
  );
}

// And the regenerated dist-types tree is still EXACTLY the tracked tree. This
// repeats C2's raw filesystem walk rather than asking git, so a file that
// `.gitignore` would hide cannot slip past — the claim is about the real tree
// `npm pack` shipped from, not about git's view of it.
const regenerated = listFiles(DIST_TYPES);
const regeneratedUntracked = regenerated.filter((p) => !trackedSet.has(p));
if (regeneratedUntracked.length > 0) {
  fail(
    'C9',
    'the `prepare` lifecycle left file(s) under dist-types that are not tracked, so the ' +
      'regenerated tree is not equal to the committed package artifact',
    regeneratedUntracked,
  );
}
const regeneratedMissing = tracked.filter((p) => !regenerated.includes(p));
if (regeneratedMissing.length > 0) {
  fail(
    'C9',
    'the `prepare` lifecycle did not regenerate every tracked dist-types declaration',
    regeneratedMissing,
  );
}
const leftoverPostgres = regenerated.filter((p) => POSTGRES_PATH_RE.test(p));
if (leftoverPostgres.length > 0) {
  fail(
    'C9',
    'the `prepare` lifecycle regenerated PostgreSQL declaration(s) that were not pruned',
    leftoverPostgres,
  );
}

// ── report ──────────────────────────────────────────────────────────────

notes.push(`tracked dist-types declarations: ${tracked.length}`);
notes.push(`generated dist-types files:      ${listFiles(DIST_TYPES).length}`);
notes.push(`packed dist-types entries:       ${packedDistTypes.length}`);
notes.push(`packed files total:              ${packed.length}`);

const out = (msg) => process.stdout.write(`${msg}\n`);
out('phase-50a: generated-artifact and package reproducibility');
for (const n of notes) out(`  ${n}`);

if (failures.length === 0) {
  out('  RESULT: PASS — C1..C9 hold; no PostgreSQL declaration is generated or packed.');
  process.exit(0);
}

out('  RESULT: FAIL');
for (const f of failures) {
  out(`  [${f.clause}] ${f.message}`);
  if (Array.isArray(f.detail)) for (const d of f.detail) out(`      - ${d}`);
}
process.exit(1);
