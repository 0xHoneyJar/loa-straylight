// Type declarations for `fixed-proof-executor.mjs`.
//
// The module is plain ESM JavaScript so it can run BEFORE `npm ci` with Node
// builtins alone. Same convention as `proof-input-manifest.d.mts`,
// `prune-internal-postgres-types.d.mts`, and `.straylight/lib/*.d.mts`.
//
// SCOPE: this module is the entire Phase 50A proof schedule. It knows exactly
// one fact about the workflow wrapper — whether its raw bytes hash to the
// digest fixed by the operator-authorized coordinator packet. It recognizes no
// workflow content, and it holds no authority over anything else.
//
// It is also the only place a child-process environment is constructed, so the
// registry credential's blast radius is a property of THIS module rather than
// of the workflow file: see `childEnv`.

/** Absolute path of the repository root, resolved from this module's location. */
export declare const REPO_ROOT: string;

/** Repository-relative path of the canonical workflow wrapper. */
export declare const WRAPPER_PATH: string;

/**
 * The operator-authorized wrapper fingerprint, fixed by the coordinator task
 * packet. A LITERAL committed constant — never derived from any runtime input.
 */
export declare const EXPECTED_WRAPPER_DIGEST: string;

/** Name of the environment variable carrying the exact audited head SHA. */
export declare const EXPECTED_HEAD_ENV: string;

/**
 * INGRESS variable name. The wrapper hands the ephemeral job token to the
 * executor under this name, and NO child process ever receives it — `childEnv`
 * deletes it from every child environment it builds.
 */
export declare const NPM_TOKEN_INGRESS_ENV: string;

/**
 * The registry-authentication variable npm itself reads. It appears in NO
 * workflow file; `childEnv` sets it for the single authenticated entry alone.
 */
export declare const NPM_TOKEN_CHILD_ENV: string;

/**
 * The label of the ONE schedule entry permitted to receive registry
 * authentication. The permission is bound to a named entry, never to a
 * position or an argv guess.
 */
export declare const AUTHENTICATED_ENTRY_LABEL: string;

/** One launch: an executable plus a fixed argv array and a fixed timeout. */
export interface ScheduleEntry {
  /** Stable, human-readable identifier used in receipts. */
  readonly label: string;
  /** The executable. Never a shell string. */
  readonly file: string;
  /** The complete fixed argv array. */
  readonly args: readonly string[];
  /** Hard upper bound for this launch, in milliseconds. */
  readonly timeout_ms: number;
  /** True only for the identity probe, whose stdout is the datum. */
  readonly capture?: boolean;
}

/**
 * The fixed `git rev-parse HEAD` identity probe — the ONLY launch permitted
 * before the identity gate completes, and never counted as a schedule launch.
 */
export declare const IDENTITY_PROBE: ScheduleEntry;

/**
 * THE CLOSED COMMAND SCHEDULE: literal data in the module source, never
 * loaded, generated, templated, filtered, reordered, or extended at runtime.
 */
export declare const SCHEDULE: readonly ScheduleEntry[];

/** Every refusal code. A refusal always exits nonzero. */
export declare const REFUSAL: {
  readonly wrapperUnreadable: string;
  readonly wrapperFingerprintMismatch: string;
  readonly expectedShaMalformed: string;
  readonly npmTokenIngressMissing: string;
  readonly headUnreadable: string;
  readonly headMismatch: string;
  readonly commandFailed: string;
  readonly commandSignalled: string;
  readonly commandTimedOut: string;
  readonly commandSpawnFailed: string;
};

/**
 * THE ONE child-environment constructor, used for every child the production
 * seam launches — the identity probe and all twelve schedule entries.
 *
 * It removes BOTH token names unconditionally, then sets `NPM_TOKEN_CHILD_ENV`
 * from `token` if and only if `entry.label` is `AUTHENTICATED_ENTRY_LABEL`. For
 * every other entry the returned object holds neither name at all, so no
 * descendant of those children can read a credential either.
 */
export declare function childEnv(
  entry: Pick<ScheduleEntry, 'label'>,
  token: string,
  baseEnv: Record<string, string | undefined>,
): Record<string, string | undefined>;

/** What a process-execution function returns. */
export interface RunOutcome {
  /** Exit status, or null when the process was signalled or never started. */
  status: number | null;
  /** Terminating signal, or null. */
  signal: string | null;
  /** Captured stdout — populated only for a capturing entry. */
  stdout?: string;
  /** True only for a timeout kill, distinct from an ordinary signal death. */
  timed_out?: boolean;
  /** Spawn-failure code (ENOENT, EACCES, ...), or null. Never a timeout. */
  error?: string | null;
}

/** The complete options object `realRun` hands to the spawn function. */
export interface SpawnOptions {
  cwd: string;
  /** Always false. There is no string-command form anywhere. */
  shell: false;
  /** Built by `childEnv` and by nothing else. */
  env: Record<string, string | undefined>;
  stdio: 'inherit' | readonly (string | number | null)[];
  timeout: number;
  encoding: string;
}

/**
 * The spawn seam `realRun` calls. Injectable so a test can capture the ACTUAL
 * options object production builds — the environment asserted over is the one
 * production really uses, not a stub's report of itself.
 */
export type SpawnFn = (
  file: string,
  args: readonly string[],
  options: SpawnOptions,
) => {
  status: number | null;
  signal: string | null;
  stdout?: string;
  error?: { code?: string; message?: string } | null;
};

/** Per-launch context: the captured ingress value and the injectable seam. */
export interface RunContext {
  /** The captured ingress credential. Never read from the environment again. */
  token: string;
  /** Environment the child environment is derived FROM. Defaults to process.env. */
  baseEnv?: Record<string, string | undefined>;
  /** Injected spawn function. Defaults to node:child_process spawnSync. */
  spawn?: SpawnFn;
}

/** The injectable process-execution seam. */
export type RunFn = (entry: ScheduleEntry, context: RunContext) => RunOutcome;

/**
 * The real seam: spawnSync with shell:false, an argv array, and an environment
 * built by `childEnv`.
 */
export declare const realRun: RunFn;

/** One receipt per ATTEMPTED command. Deterministic: no run-varying value. */
export interface CommandReceipt {
  /** 1-based position in the schedule. */
  ordinal: number;
  label: string;
  file: string;
  argv: string[];
  status: number | null;
  signal: string | null;
  timed_out: boolean;
  spawn_failed: boolean;
  outcome: 'ok' | 'failed' | 'signalled' | 'timed-out' | 'spawn-failed';
}

/** The complete result of one proof run, refused or passed. */
export interface ProofResult {
  ok: boolean;
  refusal: string | null;
  detail: string | null;
  wrapper_path: string;
  /** Observed digest of the wrapper's raw bytes, or null when unreadable. */
  wrapper_digest: string | null;
  /** The pinned, operator-authorized digest. */
  expected_wrapper_digest: string;
  /** SHA-256 of this executor's own raw source bytes. */
  executor_digest: string | null;
  expected_sha: string | null;
  observed_head: string | null;
  receipts: CommandReceipt[];
  /** Count of SCHEDULE launches. The identity probe is never counted. */
  launches: number;
}

export interface RunFixedProofOptions {
  /** Injected process-execution seam. Defaults to `realRun`. */
  run?: RunFn;
  /** Environment source. Defaults to `process.env`. */
  env?: Record<string, string | undefined>;
  /** Repository root the wrapper is resolved against. Defaults to REPO_ROOT. */
  repoRoot?: string;
  /** Path whose bytes produce the executor self-digest. */
  selfPath?: string;
  /**
   * Injected spawn function, threaded through to `realRun`. Lets a test drive
   * the PRODUCTION seam and capture the real options objects.
   */
  spawn?: SpawnFn;
  /**
   * Sink for the identity-gate banner, written at the moment the gate passes
   * and BEFORE the first schedule launch — so the job log itself carries the
   * ordering evidence rather than requiring the reader to trust code structure.
   * Defaults to a no-op; the CLI entry point writes to stdout.
   */
  announce?: (text: string) => void;
}

/**
 * Run the fixed proof: identity gate first, then the closed schedule.
 *
 * A gate failure returns `ok: false` with `launches === 0` — zero schedule
 * commands are launched and none will be. A missing credential ingress is
 * detected BEFORE the identity probe, so it launches nothing at all. There is
 * no fallback path and no refusal that reports success. No field of the result
 * carries a credential value.
 */
export declare function runFixedProof(options?: RunFixedProofOptions): ProofResult;

/** SHA-256 of a file's raw bytes as `sha256:<hex>`, or null when unreadable. */
export declare function digestOfFile(path: string): string | null;

/** Deterministic receipt lines. Never carry an environment value. */
export declare function renderReceipts(receipts: readonly CommandReceipt[]): string;

/** The published envelope, emitted on every run including a refused one. */
export declare function renderReport(result: ProofResult): string;
