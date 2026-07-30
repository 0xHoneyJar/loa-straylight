// Canonical migration runner — provider-neutral, idempotent, reversible.
//
// ADR-049Q §13.1(b), (f); P-9:
//   * migrations carry no provider-specific semantics (the SQL files are
//     plain PostgreSQL DDL; this runner adds no provider concept either);
//   * `migrate` from an empty database reaches the current version, and
//     repeating it is a no-op (idempotency);
//   * `rollback` EXISTS before either is attempted, and is exercised in
//     non-production before the re-apply.
//
// Each version's up/down SQL runs inside ONE transaction together with its
// ledger row, so a migration that fails partway leaves the database at the
// previous version with no ledger claim — never in a half-applied state that
// reports success.
//
// The ledger table itself is created by this runner (not by a versioned
// file), so rollback → re-apply works: dropping 0001's tables must not drop
// the ledger that records which versions exist.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PoolClient } from 'pg';

import { PostgresUnavailableError } from './errors.js';
import {
  CREATE_MIGRATION_LEDGER,
  SELECT_APPLIED_VERSIONS,
} from './queries.js';
import { SHIPPED_SCHEMA_VERSIONS } from './config.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Repository-root-relative location of the canonical migration files. */
export const MIGRATIONS_DIR = resolve(HERE, '../../../../migrations/postgres');

const FILE_NAMES: Readonly<Record<string, string>> = {
  '0001': '0001_canonical_estate',
};

function migrationPath(version: string, direction: 'up' | 'down'): string {
  const base = FILE_NAMES[version];
  if (base === undefined) {
    throw new Error(`unknown migration version ${version}`);
  }
  return resolve(MIGRATIONS_DIR, `${base}.${direction}.sql`);
}

export function readMigrationSql(version: string, direction: 'up' | 'down'): string {
  return readFileSync(migrationPath(version, direction), 'utf8');
}

export async function appliedVersions(client: PoolClient): Promise<string[]> {
  await client.query(CREATE_MIGRATION_LEDGER);
  const result = await client.query<{ version: string }>(SELECT_APPLIED_VERSIONS);
  return result.rows.map((r) => r.version);
}

/**
 * Apply every shipped version not yet in the ledger, in order. Returns the
 * versions this call applied — empty when already current (the idempotency
 * result).
 */
export async function migrate(
  client: PoolClient,
  versions: readonly string[] = SHIPPED_SCHEMA_VERSIONS,
): Promise<string[]> {
  const already = new Set(await appliedVersions(client));
  const applied: string[] = [];
  for (const version of versions) {
    if (already.has(version)) continue;
    const sql = readMigrationSql(version, 'up');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw new PostgresUnavailableError(
        'transaction_aborted',
        `migration ${version} (up) failed and was rolled back: ${describe(err)}`,
      );
    }
    applied.push(version);
  }
  return applied;
}

/**
 * Roll a single version back. Returns true when the version was applied and
 * has now been withdrawn, false when it was not applied (a no-op, so the
 * rollback path is itself idempotent).
 */
export async function rollback(client: PoolClient, version: string): Promise<boolean> {
  const already = new Set(await appliedVersions(client));
  if (!already.has(version)) return false;
  const sql = readMigrationSql(version, 'down');
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw new PostgresUnavailableError(
      'transaction_aborted',
      `migration ${version} (down) failed and was rolled back: ${describe(err)}`,
    );
  }
  return true;
}

/**
 * Fail closed unless every required version is applied. A store whose schema
 * version does not match must DENY, not serve a partial schema (P-11).
 */
export async function assertSchemaVersion(
  client: PoolClient,
  required: readonly string[],
): Promise<void> {
  const applied = new Set(await appliedVersions(client));
  const missing = required.filter((v) => !applied.has(v));
  if (missing.length > 0) {
    throw new PostgresUnavailableError(
      'schema_version_mismatch',
      `required schema version(s) not applied: ${missing.join(', ')}`,
    );
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
