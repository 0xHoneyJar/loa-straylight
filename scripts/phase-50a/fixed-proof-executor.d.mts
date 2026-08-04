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
//
// PROCESS-TREE CONTAINMENT. Every launch is asynchronous and detached into its
// OWN process group, this module owns the clock, and a lapsed bound terminates
// the WHOLE GROUP, escalates after a fixed grace, observes the direct child's
// reaping, and VERIFIES the group's absence before any receipt is written. An
// unprovable containment is its own refusal — never an ordinary lapse, and
// never a pass. See `realRun`, `signalGroup`, `groupAlive`, and `classify`.

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
 * skips it BY NAME while enumerating, so its value is never even read there.
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

/**
 * CONTAINMENT PARAMETERS — fixed committed constants, deliberately not
 * configurable from outside the module.
 *
 * `GRACE_MS`  grace given to a signalled group before uncatchable escalation.
 * `VERIFY_MS` bounded window in which the group's absence must be established.
 * `PROBE_MS`  polling interval of the absence probe.
 */
export declare const GRACE_MS: number;
export declare const VERIFY_MS: number;
export declare const PROBE_MS: number;

/** One launch: an executable plus a fixed argv array and a fixed bound. */
export interface ScheduleEntry {
  /** Stable, human-readable identifier used in receipts. */
  readonly label: string;
  /** The executable. Never a shell string. */
  readonly file: string;
  /** The complete fixed argv array. */
  readonly args: readonly string[];
  /** Hard upper bound for this launch, in milliseconds, enforced by the module. */
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
  /** Signalling the process group was refused by the operating system. */
  readonly commandTerminationFailed: string;
  /** Reaping was not observed, or the tree's absence could not be proven. */
  readonly commandContainmentUnverified: string;
};

/**
 * THE ONE child-environment constructor, used for every child the production
 * seam launches — the identity probe and all twelve schedule entries.
 *
 * It ENUMERATES the source environment's names and SKIPS both credential names
 * BEFORE reading any value, then sets `NPM_TOKEN_CHILD_ENV` from `token` if and
 * only if `entry.label` is `AUTHENTICATED_ENTRY_LABEL`. For every other entry
 * the returned object holds neither name at all, so no descendant of those
 * children can read a credential either — and building a child never reads
 * either credential property, which is what makes the read-once claim provable
 * at runtime rather than merely asserted over source text.
 */
export declare function childEnv(
  entry: Pick<ScheduleEntry, 'label'>,
  token: string,
  baseEnv: Record<string, string | undefined>,
): Record<string, string | undefined>;

/** Result of signalling a whole process group. */
export interface SignalResult {
  /** True when the group was signalled OR was already entirely gone. */
  ok: boolean;
  /** True only when a signal was actually delivered to a live group. */
  delivered?: boolean;
  /** OS error code when the signal was refused. Present only when `ok` is false. */
  code?: string;
}

/**
 * Signal an ENTIRE process group by group id (the negative-pid form). An
 * already-absent group is success with nothing delivered; an OS refusal is a
 * termination FAILURE, never quietly treated as success.
 */
export declare function signalGroup(pgid: number, sig: string): SignalResult;

/**
 * Is ANY member of the group still present? FAIL CLOSED: only an explicit
 * "no such process group" proves absence — a permission error or an
 * unrecognized error reports "still present", so an unprovable absence becomes
 * a refusal rather than an assumption.
 */
export declare function groupAlive(pgid: number): boolean;

/** What the process-execution seam resolves to. */
export interface RunOutcome {
  /** Exit status, or null when the process was signalled or never started. */
  status: number | null;
  /** Terminating signal, or null. */
  signal: string | null;
  /** Captured stdout — populated only for a capturing entry. */
  stdout?: string;
  /** True when THIS MODULE's bound lapsed, distinct from a signal death. */
  timed_out?: boolean;
  /** Launch-failure code (ENOENT, EACCES, ...), or null. Never a lapse. */
  error?: string | null;
  /** True when the whole group was signalled after a lapse. */
  group_signalled?: boolean;
  /** True when the uncatchable escalation was needed after the grace period. */
  escalated?: boolean;
  /** True only when the direct child's exit was OBSERVED, never inferred. */
  direct_child_reaped?: boolean;
  /** True only when the group's absence was VERIFIED within the window. */
  group_verified_absent?: boolean;
  /** Set when signalling the group was refused, or no group id existed. */
  termination_error?: string | null;
}

/** The complete options object the launch helper hands to the spawn function. */
export interface SpawnOptions {
  cwd: string;
  /** Always false. There is no string-command form anywhere. */
  shell: false;
  /** Built by `childEnv` and by nothing else. */
  env: Record<string, string | undefined>;
  stdio: readonly (string | number | null)[];
  /**
   * Always true: the child leads its OWN process group, which every descendant
   * inherits, so one group id names the whole tree.
   */
  detached: true;
}

/** A live child handle: the subset of it this module uses. */
export interface SpawnedChild {
  /** The child's pid, which is also its process-group id when detached. */
  pid?: number;
  stdout?: {
    setEncoding(encoding: string): void;
    on(event: string, listener: (chunk: string) => void): void;
  } | null;
  on(event: string, listener: (...args: never[]) => void): void;
}

/**
 * The spawn seam the launch helper calls. Injectable so a test can capture the
 * ACTUAL options object production builds — the environment asserted over is
 * the one production really uses, not a stub's report of itself.
 */
export type SpawnFn = (
  file: string,
  args: readonly string[],
  options: SpawnOptions,
) => SpawnedChild;

/** Per-launch context: the captured ingress value and the injectable seams. */
export interface RunContext {
  /** The captured ingress credential. Never read from the environment again. */
  token: string;
  /** Environment the child environment is derived FROM. Defaults to process.env. */
  baseEnv?: Record<string, string | undefined>;
  /** Injected spawn function. Defaults to node:child_process spawn. */
  spawn?: SpawnFn;
  /** Injected group-signal primitive. Defaults to `signalGroup`. */
  signal?: (pgid: number, sig: string) => SignalResult;
  /** Injected group-liveness probe. Defaults to `groupAlive`. */
  alive?: (pgid: number) => boolean;
  /** Grace before escalation. Defaults to `GRACE_MS`. */
  graceMs?: number;
  /** Bounded absence-verification window. Defaults to `VERIFY_MS`. */
  verifyMs?: number;
  /** Absence-probe interval. Defaults to `PROBE_MS`. */
  probeMs?: number;
}

/** The injectable process-execution seam. Asynchronous: it owns the clock. */
export type RunFn = (entry: ScheduleEntry, context: RunContext) => Promise<RunOutcome>;

/**
 * The real seam: an asynchronous, detached, group-bounded launch with
 * shell:false and an argv array, an environment built by `childEnv`, whole-group
 * termination on a lapse, fixed grace then uncatchable escalation, OBSERVED
 * reaping, and VERIFIED group absence — all established before it resolves.
 */
export declare const realRun: RunFn;

/** The six mutually exclusive outcome classes, in precedence order. */
export interface Verdict {
  /** The process never started; there is no tree. */
  spawnFailed: boolean;
  /** Signalling the group was refused, or no group id existed. */
  terminationFailed: boolean;
  /** Reaping unobserved, or absence unproven within the window. */
  containmentFailed: boolean;
  /** The bound lapsed AND the tree was proven gone. */
  timedOut: boolean;
  /** An ordinary signal death, no lapse involved. */
  signalled: boolean;
  /** A real, observed nonzero exit status. */
  failed: boolean;
}

/**
 * Classify one outcome into exactly one verdict. No pair of classes may
 * collapse; in particular a null status never falls through an exit-code
 * comparison as success, and a containment failure is never folded into the
 * lapse that led to it.
 */
export declare function classify(outcome: RunOutcome): Verdict;

/** The refusal code for a verdict, or null when the launch was clean. */
export declare function refusalFor(verdict: Verdict): string | null;

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
  /** Whether the whole group was signalled after a lapse. */
  group_signalled: boolean;
  /** Whether uncatchable escalation was needed. */
  escalated: boolean;
  /** Whether the direct child's exit was OBSERVED. */
  direct_child_reaped: boolean;
  /** Whether the group's absence was VERIFIED. */
  group_verified_absent: boolean;
  outcome:
    | 'ok'
    | 'failed'
    | 'signalled'
    | 'timed-out'
    | 'spawn-failed'
    | 'termination-failed'
    | 'containment-unverified';
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
  /** Injected group-signal primitive, threaded through to `realRun`. */
  signal?: (pgid: number, sig: string) => SignalResult;
  /** Injected group-liveness probe, threaded through to `realRun`. */
  alive?: (pgid: number) => boolean;
  /** Grace before escalation, threaded through to `realRun`. */
  graceMs?: number;
  /** Bounded absence-verification window, threaded through to `realRun`. */
  verifyMs?: number;
  /** Absence-probe interval, threaded through to `realRun`. */
  probeMs?: number;
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
 * A gate failure resolves with `ok: false` and `launches === 0` — zero schedule
 * commands are launched and none will be. A missing credential ingress is
 * detected BEFORE the identity probe, so it launches nothing at all. There is
 * no fallback path and no refusal that reports success. No field of the result
 * carries a credential value.
 */
export declare function runFixedProof(options?: RunFixedProofOptions): Promise<ProofResult>;

/** SHA-256 of a file's raw bytes as `sha256:<hex>`, or null when unreadable. */
export declare function digestOfFile(path: string): string | null;

/** Deterministic receipt lines. Never carry an environment value. */
export declare function renderReceipts(receipts: readonly CommandReceipt[]): string;

/** The published envelope, emitted on every run including a refused one. */
export declare function renderReport(result: ProofResult): string;
