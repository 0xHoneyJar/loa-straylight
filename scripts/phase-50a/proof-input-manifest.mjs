// Phase 50A R3 — the manifest CONSUMER.
//
// `tests/phase-50a/proof-input-manifest.json` is the SINGLE declaration of the
// proof's input roots. This module is the only way to read it, and it FAILS
// CLOSED on a manifest that is missing, empty, unreadable, or malformed — never
// defaulting to a narrower comparison or a vacuous pass.
//
// WHAT REPLACED WHAT. The rejected model declared the input set inside the
// no-leak suite's own source, inside marked comment blocks, and a second suite
// EXTRACTED those blocks by their markers to compare against the workflow. Three
// independent mutations survived that: deleting a declared input (a smaller
// declaration satisfies `uncovered == []` more easily), truncating the extractor
// (`slice(1)`), and — decisively — replacing the extractor so it SYNTHESIZED a
// path the workflow no longer declared. No proof may derive its authority from
// the extractor it validates.
//
// So there is no extractor here at all:
//
//   * the manifest is CHECKED-IN DATA, read whole and used directly;
//   * the no-leak suite READS ITS INPUTS FROM the manifest instead of restating
//     them, so there is one declaration and nothing to extract;
//   * the workflow side is a BOUNDED STRUCTURAL PARSE of the workflow's own bytes
//     (`workflow-trigger-parser.mjs`);
//   * the comparison is manifest-against-parsed-workflow. Neither side is derived
//     from the other.
//
// There is NO exception mechanism of any kind — no accepted-gap list, no
// tolerated set, no predicate, and no empty placeholder to append to. The
// required set of uncovered manifest inputs is EMPTY.
//
// Roots are deliberately BROAD (`src/straylight`, not a file list): a broad root
// also covers files that do not exist yet, so it cannot be defeated by adding,
// renaming, or deleting a declaration.

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, '../..');

/** The manifest's repository-relative path. Itself a declared input. */
export const MANIFEST_PATH = 'tests/phase-50a/proof-input-manifest.json';
/** The workflow whose trigger declaration the manifest is compared against. */
export const WORKFLOW_PATH = '.github/workflows/phase-50a-postgres-conformance.yml';

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
    // A VACUOUS manifest would make every coverage comparison trivially satisfied.
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
 * This is what the no-leak / neutrality suite SCANS. It reads its inputs from
 * here rather than restating them, which is what makes the manifest the single
 * declaration: a file that enters the tree under a declared root is automatically
 * in scope, and there is no second list to keep in step.
 */
export function manifestTrackedFiles(manifestPath = MANIFEST_PATH) {
  const manifest = readManifest(manifestPath);
  const files = new Set();
  for (const root of manifest.roots) {
    for (const file of trackedFilesUnder(root.path, root.kind)) files.add(file);
  }
  return [...files].sort();
}

/** Read one manifest-covered file's text. Refuses an undeclared path. */
export function readManifestInput(path, manifestPath = MANIFEST_PATH) {
  const covered = manifestTrackedFiles(manifestPath);
  if (!covered.includes(path)) {
    throw new Error(
      `proof-input manifest: ${path} is not covered by any declared root. Declare a root ` +
        'that covers it (and give that root workflow trigger coverage) rather than reading it directly.',
    );
  }
  return readFileSync(resolve(REPO_ROOT, path), 'utf8');
}

/**
 * Does a workflow path filter cover a repository-relative path?
 *
 * Only the glob shapes GitHub's `paths:` filter uses AND this proof relies on are
 * interpreted: an exact path, and a `prefix/**` recursive prefix. Any other shape
 * is treated as NOT covering — an unrecognized filter must never be assumed to
 * cover something, which is the direction that fails closed.
 */
export function filterCovers(glob, path) {
  if (typeof glob !== 'string' || typeof path !== 'string') return false;
  if (glob.endsWith('/**')) {
    const prefix = glob.slice(0, -3);
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  if (glob.includes('*')) return false;
  return glob === path;
}

/**
 * Which of `roots` the workflow's parsed trigger filters do NOT cover.
 *
 * A `tree` root is covered only by a filter that covers the WHOLE tree — an exact
 * filter naming one file inside it does not, because a sibling file under the same
 * root could then change the suite's verdict without starting the workflow. This
 * is checked by requiring coverage of the root path itself AND of every tracked
 * file under it, so a declared root cannot be narrowed while files remain.
 */
export function uncoveredRoots(roots, filters) {
  const uncovered = [];
  for (const root of roots) {
    const covered =
      filters.some((f) => filterCovers(f, root.path)) &&
      trackedFilesUnder(root.path, root.kind).every((file) =>
        filters.some((f) => filterCovers(f, file)),
      );
    if (!covered) uncovered.push(root.path);
  }
  return uncovered.sort();
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
