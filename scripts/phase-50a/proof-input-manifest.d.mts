// Type declarations for `proof-input-manifest.mjs`.
//
// The module is plain ESM JavaScript so the proof suites and the workflow-coverage
// suite can consume it without a build step. Same convention as
// `prune-internal-postgres-types.d.mts` and `.straylight/lib/*.d.mts`.

/** Absolute path of the repository root. */
export declare const REPO_ROOT: string;

/** Repository-relative path of the checked-in proof-input manifest. */
export declare const MANIFEST_PATH: string;

/** Repository-relative path of the workflow whose triggers are parsed. */
export declare const WORKFLOW_PATH: string;

/** One declared proof-input root. */
export interface ManifestRoot {
  /** Repository-relative path. Clean and relative; never absolute or `..`-bearing. */
  path: string;
  /** `tree` covers every tracked file beneath it; `file` is exactly one path. */
  kind: 'tree' | 'file';
  /** Why this path's content can change the proof's verdict. */
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

/** Every tracked file the manifest covers, deduplicated and sorted. */
export declare function manifestTrackedFiles(manifestPath?: string): string[];

/** Read one manifest-covered file's text. Throws for an undeclared path. */
export declare function readManifestInput(path: string, manifestPath?: string): string;

/**
 * Does a workflow `paths:` filter cover a repository-relative path? Only an exact
 * path and a `prefix/**` recursive prefix are interpreted; any other shape is
 * treated as NOT covering, which is the direction that fails closed.
 */
export declare function filterCovers(glob: string, path: string): boolean;

/**
 * Which of `roots` the parsed workflow filters do NOT cover, sorted. A `tree` root
 * counts as covered only when the root itself AND every tracked file under it are
 * covered, so a declared root cannot be narrowed while files remain under it.
 */
export declare function uncoveredRoots(roots: ManifestRoot[], filters: string[]): string[];

/** Repository-relative path of an absolute one, with POSIX separators. */
export declare function repoRelative(abs: string): string;

/** Absolute path of a repository-relative one. */
export declare function repoAbsolute(path: string): string;
