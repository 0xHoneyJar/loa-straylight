// Type declarations for `proof-input-manifest.mjs`.
//
// The module is plain ESM JavaScript so the no-leak suite can consume it without a
// build step. Same convention as `prune-internal-postgres-types.d.mts` and
// `.straylight/lib/*.d.mts`.
//
// SCOPE: the manifest declares the SCAN SET OF ONE SUITE,
// `tests/phase-50a/no-leak-and-neutrality.test.ts`. It is not a declaration of the
// inputs to the build, the typecheck, the repository-wide tests, control-plane
// validation or tests, the fixtures, the generated declarations, package pruning,
// the C1-C9 artifact verification, or the remote workflow. See the module header.

/** Absolute path of the repository root. */
export declare const REPO_ROOT: string;

/** Repository-relative path of the checked-in scan-set manifest. */
export declare const MANIFEST_PATH: string;

/** One declared scan-set root. */
export interface ManifestRoot {
  /** Repository-relative path. Clean and relative; never absolute or `..`-bearing. */
  path: string;
  /** `tree` covers every tracked file beneath it; `file` is exactly one path. */
  kind: 'tree' | 'file';
  /** Why this path's content can change the no-leak suite's verdict. */
  why: string;
}

export interface ProofInputManifest {
  version: number;
  roots: ManifestRoot[];
}

/**
 * Read and validate the manifest. THROWS on any defect — missing, unreadable,
 * empty, malformed JSON, wrong shape, no roots, a bad root path, an unknown
 * `kind`, a missing rationale, or a duplicate root. There is no partial result.
 */
export declare function readManifest(manifestPath?: string): ProofInputManifest;

/** Every declared root path, in declaration order. */
export declare function manifestRootPaths(manifestPath?: string): string[];

/**
 * Every git-TRACKED file under one declared root. Throws when a root resolves to
 * no tracked file, or when a `file` root does not resolve to exactly itself.
 */
export declare function trackedFilesUnder(root: string, kind: 'tree' | 'file'): string[];

/**
 * Every tracked file the manifest covers, deduplicated and sorted — exactly the
 * no-leak suite's scan set.
 */
export declare function manifestTrackedFiles(manifestPath?: string): string[];

/** Read one manifest-covered file's text. Throws for an undeclared path. */
export declare function readManifestInput(path: string, manifestPath?: string): string;

/** Repository-relative path of an absolute one, with POSIX separators. */
export declare function repoRelative(abs: string): string;

/** Absolute path of a repository-relative one. */
export declare function repoAbsolute(path: string): string;
