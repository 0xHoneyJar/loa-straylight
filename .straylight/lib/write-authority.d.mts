// Type surface for tests/tooling. Runtime source of truth: write-authority.mjs
//
// The H-02 write-authority binding: every write plan names the exact commit it
// was planned at and the canonical digest of the accepted policy that governed
// the planning, and the executor requires BOTH to still be current — read-only
// from GitHub — immediately before every durable mutation.

export declare const MAIN_SHA_RE: RegExp;
export declare const AUTHORITY_KEYS: readonly ["source_main_sha", "policy_digest"];
export declare const EXPECTED_DEFAULT_BRANCH: "main";
export declare const MAIN_REF: "refs/heads/main";
export declare const COMMITTED_POLICY_REPO_PATH: ".straylight/automation-policy.json";

export interface WriteAuthority {
  /** Full immutable 40-hex commit SHA; never a branch name. */
  source_main_sha: string;
  /** `sha256:<64 hex>` canonical digest of the accepted policy. */
  policy_digest: string;
}

export interface AuthorityError {
  code: string;
  detail: string;
}

/** Canonical content digest of a policy via the protocol's canonicalizer. */
export declare function policyAuthorityDigest(policy: unknown): string;

/** Closed-shape rules for `plan.authority` (write-plan error rows). */
export declare function authorityShapeErrors(authority: unknown): AuthorityError[];

/** The binding a planner embeds, built from its checkout SHA + loaded policy. */
export declare function buildWriteAuthority(input: {
  source_main_sha: unknown;
  policy: unknown;
}): { ok: true; authority: WriteAuthority } | { ok: false; reason: string; detail: string };

/** `--source-main-sha` / `--source-main-sha-file` for every plan producer (J3). */
export declare function resolveSourceMainSha(input: {
  literal: string | null;
  filePath: string | null;
}): { ok: true; sha: string } | { ok: false; reason: string; detail: string };

/**
 * The write-time check. `current_main_sha` / `current_policy` MUST have been
 * established independently of the local checkout.
 */
export declare function authorityStillCurrent(input: {
  authority: unknown;
  current_main_sha: unknown;
  current_policy: unknown;
}): { ok: true } | { ok: false; refusal: string; detail: string };

export type ReadPathResult =
  | { ok: true; path: string }
  | { ok: false; reason: string; detail: string };

/** GET repos/{owner}/{repo} */
export declare function repositoryMetadataReadPath(repository: unknown): ReadPathResult;
/** GET repos/{owner}/{repo}/git/ref/heads/main */
export declare function mainRefReadPath(repository: unknown): ReadPathResult;
/** GET repos/{owner}/{repo}/contents/.straylight/automation-policy.json?ref=<sha> */
export declare function committedPolicyReadPath(repository: unknown, main_sha: unknown): ReadPathResult;

export declare function readRepositoryDefaultBranch(
  value: unknown,
  opts: { repository: string }
): { ok: true; default_branch: "main" } | { ok: false; reason: string; detail: string };

export declare function readMainRefSha(
  value: unknown,
  opts?: { expected_ref?: string }
): { ok: true; sha: string } | { ok: false; reason: string; detail: string };

export declare function decodeCommittedFile(
  value: unknown,
  opts: { expected_path: string }
): { ok: true; text: string; bytes: Buffer } | { ok: false; reason: string; detail: string };
