// Type surface for tests/tooling. Runtime source of truth: admission-locks.mjs
export interface AcceptedEpochLock {
  readonly epoch_id: string;
  /** `sha256:<hex>` over the COMPLETE canonical epoch object. */
  readonly digest: string;
}
/**
 * The canonical content digest of a complete admission epoch, via the
 * protocol's one canonicalizer (canonical.mjs payloadDigest).
 */
export declare function admissionEpochDigest(epoch: unknown): string;
/**
 * The accepted epochs, in history order; index i pins admission_history[i].
 * Frozen: it cannot be re-pointed at runtime, only by changing protocol code.
 */
export declare const ACCEPTED_ADMISSION_EPOCH_LOCKS: readonly AcceptedEpochLock[];
/** True when `history` presents any epoch id this build has accepted. */
export declare function historyClaimsAcceptedEpoch(history: unknown): boolean;
/**
 * THE FULL LOCK: `history` must be exactly the accepted history — same length,
 * same ids at the same indices, same complete canonical content. [] when it is.
 */
export declare function acceptedEpochLockErrors(history: unknown): string[];
/**
 * The runtime binding applied by validatePolicy: a history presenting ANY
 * accepted epoch id must present the accepted history in full.
 */
export declare function pinnedEpochLockErrors(history: unknown): string[];
