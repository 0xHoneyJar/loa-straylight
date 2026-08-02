// Integrity + availability errors raised by the PostgreSQL canonical store.
//
// P-3 requires integrity violations to surface as EXCEPTIONS, never silent
// drops or repairs. P-11 requires persistence uncertainty to DENY rather
// than degrade permissively. These two error classes are how both hold:
//
//   PostgresIntegrityError   the durable content contradicts the canonical
//                            contract (broken chain, non-prefix history,
//                            duplicate append position, conflicting
//                            immutable id, malformed row). Never repaired.
//   PostgresUnavailableError the store could not be reached, the
//                            transaction aborted, or the schema version
//                            does not match. No successful durable
//                            operation is reported.
//
// Neither error is ever swallowed into a fallback. There is no code path
// anywhere in this directory that substitutes InMemoryStorage or
// JsonlStorage after PostgreSQL uncertainty (proven by
// tests/phase-50a/postgres-negative.test.ts).

export type PostgresIntegrityReason =
  | 'audit_chain_broken'
  | 'audit_chain_fork'
  | 'append_prefix_mutated'
  | 'duplicate_append_position'
  | 'immutable_id_conflict'
  // A record was offered to a session bound to a DIFFERENT estate. The host
  // locks exactly one estate and loads exactly that estate's snapshot, so the
  // session's bound estate is the store's estate authority — a record cannot
  // vouch for its own estate. A cross-estate write is refused with this distinct
  // reason, the transaction rolls back, and nothing from the attempted operation
  // is durable. It is never classified idempotent (R2).
  | 'estate_authority_violation'
  | 'malformed_row'
  // The migration ledger records a version as applied but does not bind it to
  // the shipped migration content: no checksum at all, or a checksum that
  // disagrees. Either way the applied schema and the shipped migration cannot
  // be proven to be the same schema, so the store refuses to treat the version
  // as applied — for skipping a migration or for serving the schema.
  | 'migration_checksum_missing'
  | 'migration_checksum_mismatch'
  | 'restore_verification_failed';

export class PostgresIntegrityError extends Error {
  readonly reason: PostgresIntegrityReason;
  readonly detail: string;

  constructor(reason: PostgresIntegrityReason, detail: string) {
    super(`straylight postgres integrity violation [${reason}]: ${detail}`);
    this.name = 'PostgresIntegrityError';
    this.reason = reason;
    this.detail = detail;
  }
}

export type PostgresUnavailableReason =
  | 'connection_failed'
  | 'transaction_aborted'
  | 'schema_version_mismatch'
  | 'session_closed'
  // `withEstateSession`'s callback contract is SYNCHRONOUS. A callback that
  // returns a Promise or any other thenable is unsupported and is refused
  // before the session closes, before the delta is persisted, and before
  // COMMIT — so the transaction rolls back and nothing becomes durable.
  // It belongs to this class rather than the integrity class because the
  // durable content is not corrupt: the operation was simply refused and
  // aborted, and no successful durable operation is reported.
  | 'async_callback_unsupported';

export class PostgresUnavailableError extends Error {
  readonly reason: PostgresUnavailableReason;
  readonly detail: string;

  constructor(reason: PostgresUnavailableReason, detail: string) {
    super(`straylight postgres unavailable [${reason}]: ${detail}`);
    this.name = 'PostgresUnavailableError';
    this.reason = reason;
    this.detail = detail;
  }
}
