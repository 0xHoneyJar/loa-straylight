// Type declarations for `prune-internal-postgres-types.mjs`.
//
// The script is plain ESM JavaScript (it runs from an npm lifecycle hook, with
// no build step), so its exported helpers need a hand-written declaration to be
// consumable from the TypeScript test suite. Same convention as
// `.straylight/lib/*.d.mts`.

/** Absolute path of the repository root. */
export declare const ROOT: string;

/** Absolute path of the generated declaration directory (`dist-types/`). */
export declare const DIST_TYPES: string;

/**
 * The internal declaration subtree the prune removes, repository-relative with
 * POSIX separators.
 */
export declare const INTERNAL_SUBTREE: string;

/** Absolute path of {@link INTERNAL_SUBTREE}. */
export declare function internalSubtreePath(): string;

/**
 * Every file under `dir`, recursively, as sorted repository-relative POSIX
 * paths. Returns `[]` when `dir` does not exist.
 */
export declare function listFiles(dir: string): string[];

/** Repository paths git tracks under `pathspec`, via `git ls-files`. */
export declare function trackedFiles(pathspec: string): string[];

/**
 * Remove the internal PostgreSQL declaration subtree.
 *
 * A non-empty `tracked` means NOTHING was removed and the caller must fail
 * closed: a tracked declaration is a package-contract decision, not something a
 * build step may resolve.
 */
export declare function pruneInternalDeclarations(): {
  removed: string[];
  tracked: string[];
};
