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
  | 'malformed_row'
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
  | 'session_closed';

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
