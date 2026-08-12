// Barrel for the provider-neutral PostgreSQL canonical store.
//
// This directory is the ADAPTER BOUNDARY (ADR-049Q §11.3). It is the only
// place in `src/straylight/` that imports `pg`, knows a connection string
// exists, or is asynchronous. Everything above it — EstateStore, AuditLog,
// executeRecall, the StorageAdapter interface itself — is unchanged and
// remains synchronous.
//
// The store is NOT re-exported from `src/straylight/index.ts`. The wedge's
// public surface stays type-only for consumers (ADR-024G / ADR-026A §5) and
// widening it is out of scope for Phase 50A; callers import this barrel by
// path. Adding it to the public surface would also make `pg` a hard runtime
// dependency of every type-only consumer, which the package boundary
// deliberately avoids.

export { PostgresEstateHost } from './host.js';
export type { EstateSessionResult, TargetIdentity } from './host.js';

export { PostgresAdapterSession } from './session.js';

export { PostgresIntegrityError, PostgresUnavailableError } from './errors.js';
export type { PostgresIntegrityReason, PostgresUnavailableReason } from './errors.js';

// `redactConnectionString` is GONE, not renamed: the store no longer renders a
// connection string at all (F-04). A diagnostic names its target through
// `PostgresEstateHost.describeTarget()`, which prints the identity `pg`
// resolved and no credential-bearing material in any form.
export { SHIPPED_SCHEMA_VERSIONS, resolveConfig } from './config.js';
export type { PostgresStoreConfig, ResolvedPostgresStoreConfig } from './config.js';

export {
  MIGRATIONS_DIR,
  MIGRATION_CHECKSUM_ALGORITHM,
  appliedMigrations,
  appliedVersions,
  assertSchemaVersion,
  migrate,
  migrationChecksum,
  readMigrationSql,
  rollback,
  verifyAppliedChecksums,
} from './migrate.js';
export type { AppliedMigration, MigrationSource } from './migrate.js';

export { emptyCanonicalState, isDeltaEmpty } from './canonical-state.js';
export type { CanonicalDelta, CanonicalState, Positioned } from './canonical-state.js';

export {
  assertChainIntact,
  assertLoadedIntegrity,
  assertPrefixUnchanged,
  fingerprintAppendPrefix,
  fingerprintOf,
  loadEstateState,
} from './load.js';
export type { AppendPrefixFingerprint } from './load.js';

export { persistDelta } from './persist.js';
export type { AppendOutcome, PersistResult } from './persist.js';

export { canonicalPayload, previousHashKey } from './rows.js';

export {
  CANONICAL_SNAPSHOT_READS,
  assertEstateServiceable,
  assertRestoreServiceable,
  canonicalReadText,
  compareSnapshots,
  readStoreSnapshot,
  recognizeCanonicalRead,
  snapshotDigest,
  verifyChains,
  verifyRestore,
} from './portability.js';
export type {
  CanonicalRead,
  ChainVerification,
  RestoreVerification,
  SnapshotComparison,
  StoreSnapshot,
} from './portability.js';
