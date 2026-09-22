// Phase 50A R3 — the NO-LEAK SCAN-SET manifest CONSUMER.
//
// ── SCOPE, STATED FIRST AND NARROWLY ────────────────────────────────────
//
// `tests/phase-50a/proof-input-manifest.json` declares the SCAN SET OF ONE SUITE:
// `tests/phase-50a/no-leak-and-neutrality.test.ts`. That is the whole of its
// authority. It is the single declaration of what that suite reads, so the suite
// restates no path and cannot quietly widen its own input set.
//
// It is NOT — in any wording, and under any name — a declaration of the inputs to
// anything else. It does not enumerate the inputs to the build, to the typecheck,
// to the repository-wide test run, to control-plane validation or the
// control-plane tests, to the fixtures, to the generated declarations, to package
// pruning, to the C1-C9 artifact verification, or to the remote proof workflow as
// a whole. Nothing anywhere derives trigger completeness, proof completeness, or
// input completeness from it.
//
// WHY THAT MATTERS. Two successive models claimed exactly the authority this
// module now disclaims: they treated a manifest as the enumeration of every input
// to the full proof and mirrored it into the workflow's `on.pull_request.paths`
// filter. Both were reopened. The enumeration was never complete (vitest.config.ts,
// tests/_global-setup.ts, the tsconfigs, scripts/prune-dist-runtime.mjs,
// tests/control-plane/, .straylight/, fixtures/ and the tracked dist-types/ tree
// were all real inputs it omitted), and "everything DECLARED is covered" is
// satisfied more easily by declaring less. The workflow's pull-request trigger is
// now UNCONDITIONAL, so trigger completeness needs no enumeration at all and this
// manifest is relieved of a job it could not do.
//
// This module is the only way to read the manifest, and it FAILS CLOSED on one
// that is missing, empty, unreadable, malformed, rootless, or that names a root
// resolving to no real tracked file — never defaulting to a narrower scan or a
// vacuous pass. There is NO exception mechanism of any kind: no accepted-gap list,
// no tolerated set, no predicate, and no empty placeholder to append to.
//
// Roots are deliberately BROAD (`src/straylight`, not a file list): a broad root
// also covers files that do not exist yet, so the scan set cannot be defeated by
// adding, renaming, or deleting a declaration.

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '../..');

/** The manifest's repository-relative path. Itself inside the declared scan set. */
export const MANIFEST_PATH = 'tests/phase-50a/proof-input-manifest.json';

/**
 * Read and validate the manifest.
 *
 * Throws on ANY defect — absent, unreadable, malformed JSON, wrong shape, empty
 * root list, a root that is not a non-empty relative path, a duplicate root, or an
 * unknown `kind`. A caller cannot obtain a partial manifest.
 *
 * @param {string} [manifestPath] override, for the negative tests only.
 * @returns {{version: number, roots: {path: string, kind: 'tree'|'file', why: string}[]}}
 */
export function readManifest(manifestPath = MANIFEST_PATH) {
  const abs = resolve(REPO_ROOT, manifestPath);
  let text;
  try {
    text = readFileSync(abs, 'utf8');
  } catch (err) {
    throw new Error(
      `proof-input manifest ${manifestPath} is missing or unreadable: ${describe(err)}`,
    );
  }
  if (text.trim() === '') {
    throw new Error(`proof-input manifest ${manifestPath} is empty`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`proof-input manifest ${manifestPath} is malformed JSON: ${describe(err)}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`proof-input manifest ${manifestPath} must be a JSON object`);
  }
  if (parsed.version !== 1) {
    throw new Error(
      `proof-input manifest ${manifestPath} declares unsupported version ${String(parsed.version)}`,
    );
  }
  if (!Array.isArray(parsed.roots)) {
    throw new Error(`proof-input manifest ${manifestPath} must declare a \`roots\` array`);
  }
  if (parsed.roots.length === 0) {
    // A VACUOUS manifest would make every scan trivially satisfied: a suite that
    // reads nothing finds nothing wrong.
    throw new Error(`proof-input manifest ${manifestPath} declares no roots`);
  }
  const seen = new Set();
  const roots = [];
  for (const entry of parsed.roots) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`proof-input manifest ${manifestPath}: every root must be an object`);
    }
    const { path, kind, why } = entry;
    if (typeof path !== 'string' || path.length === 0) {
      throw new Error(`proof-input manifest ${manifestPath}: a root path must be a non-empty string`);
    }
    if (path.startsWith('/') || path.includes('..') || path.endsWith('/')) {
      throw new Error(
        `proof-input manifest ${manifestPath}: root "${path}" must be a clean relative path`,
      );
    }
    if (kind !== 'tree' && kind !== 'file') {
      throw new Error(
        `proof-input manifest ${manifestPath}: root "${path}" declares unknown kind ${String(kind)}`,
      );
    }
    if (typeof why !== 'string' || why.trim() === '') {
      throw new Error(
        `proof-input manifest ${manifestPath}: root "${path}" must record WHY it is an input`,
      );
    }
    if (seen.has(path)) {
      throw new Error(`proof-input manifest ${manifestPath}: root "${path}" is declared twice`);
    }
    seen.add(path);
    roots.push({ path, kind, why });
  }
  return { version: parsed.version, roots };
}

/** Every declared root path, in declaration order. */
export function manifestRootPaths(manifestPath = MANIFEST_PATH) {
  return readManifest(manifestPath).roots.map((r) => r.path);
}

/**
 * Every GIT-TRACKED file under one declared root.
 *
 * Tracked rather than on-disk, deliberately: the proof is about COMMITTED
 * content, and an untracked scratch file must not be able to widen or narrow the
 * input set. `git ls-files` is invoked with the root as a literal pathspec
 * argument (never interpolated into a shell), and a `tree` root that resolves to
 * nothing is a FAILURE — a typo'd root would otherwise scan nothing silently.
 */
export function trackedFilesUnder(root, kind) {
  const out = execFileSync('git', ['ls-files', '-z', '--', root], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  const files = out.split('\0').filter((p) => p.length > 0);
  if (files.length === 0) {
    throw new Error(
      `proof-input manifest: declared root "${root}" resolves to NO tracked file; ` +
        'every declared root must cover at least one real tracked file',
    );
  }
  if (kind === 'file') {
    if (files.length !== 1 || files[0] !== root) {
      throw new Error(
        `proof-input manifest: root "${root}" is declared as a file but resolves to ` +
          `${files.length} path(s)`,
      );
    }
  } else {
    let isDirectory = false;
    try {
      isDirectory = statSync(resolve(REPO_ROOT, root)).isDirectory();
    } catch {
      isDirectory = false;
    }
    if (!isDirectory) {
      throw new Error(
        `proof-input manifest: root "${root}" is declared as a tree but is not a directory`,
      );
    }
  }
  return files;
}

/**
 * Every tracked file the manifest covers, deduplicated and sorted.
 *
 * This is exactly what the no-leak / neutrality suite SCANS, and it is the extent
 * of the manifest's authority. That suite reads its inputs from here rather than
 * restating them, so a file entering the tree under a declared root is
 * automatically in that suite's scan, and there is no second list to keep in step.
 */
export function manifestTrackedFiles(manifestPath = MANIFEST_PATH) {
  const manifest = readManifest(manifestPath);
  const files = new Set();
  for (const root of manifest.roots) {
    for (const file of trackedFilesUnder(root.path, root.kind)) files.add(file);
  }
  return [...files].sort();
}

/**
 * Read one manifest-covered file's text. Refuses an UNDECLARED path.
 *
 * This is what keeps the no-leak suite's declaration complete by construction: a
 * read of something no root covers throws rather than quietly widening that
 * suite's scan set behind its own declaration.
 */
export function readManifestInput(path, manifestPath = MANIFEST_PATH) {
  const covered = manifestTrackedFiles(manifestPath);
  if (!covered.includes(path)) {
    throw new Error(
      `proof-input manifest: ${path} is not covered by any declared root. Declare a root ` +
        'that covers it rather than reading it directly.',
    );
  }
  return readFileSync(resolve(REPO_ROOT, path), 'utf8');
}

/** Repository-relative path of an absolute one. */
export function repoRelative(abs) {
  return relative(REPO_ROOT, abs).split('\\').join('/');
}

/** Absolute path of a repository-relative one. */
export function repoAbsolute(path) {
  return join(REPO_ROOT, path);
}

function describe(err) {
  return err instanceof Error ? err.message : String(err);
}
