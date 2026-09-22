// Canonical migration runner — provider-neutral, idempotent, reversible,
// and CONTENT-BOUND.
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
//
// Ledger DDL — creating the table, adding the checksum column, attaching the
// immutability trigger — belongs to the INITIALIZATION path alone (`migrate`,
// `rollback`, `initializeLedger`). The steady-state verification path is
// strictly READ-ONLY, because it runs inside the caller's estate transaction
// and DDL there would hold a relation lock for the whole estate callback,
// coupling unrelated estates. See `ensureLedger` for the full argument.
//
// ── content binding (the version↔content checksum) ─────────────────────
//
// A ledger that records only "version 0001 is applied" says nothing about
// WHICH 0001 is applied. If the shipped SQL later changes, an unbound ledger
// silently reports the database as current while the schema on disk and the
// schema in the database disagree. So every applied version is bound to a
// deterministic checksum of the migration content it was applied from, and
// that checksum is verified before the version is treated as applied — both
// when deciding to SKIP a migration and when the host asks whether the schema
// is serviceable.
//
// A missing, forged, stale, or mismatched checksum FAILS CLOSED. See
// `migrationChecksum` for the algorithm and `verifyAppliedChecksums` for the
// verification points.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PoolClient } from 'pg';

import { PostgresIntegrityError, PostgresUnavailableError } from './errors.js';
import {
  ADD_MIGRATION_LEDGER_CHECKSUM,
  ATTACH_MIGRATION_LEDGER_IMMUTABILITY,
  BIND_MIGRATION_CHECKSUM,
  CREATE_MIGRATION_LEDGER,
  CREATE_MIGRATION_LEDGER_IMMUTABILITY,
  DROP_MIGRATION_LEDGER_IMMUTABILITY,
  MIGRATION_LEDGER_EXISTS,
  SELECT_APPLIED_MIGRATIONS,
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

// ── the version↔content checksum ────────────────────────────────────────

/**
 * Identifier of the checksum algorithm, recorded IN each checksum so a future
 * algorithm change is a visible mismatch rather than a silent reinterpretation
 * of an old digest.
 */
export const MIGRATION_CHECKSUM_ALGORITHM = 'straylight-migration-sha256-v1';

/**
 * Deterministic checksum binding a migration VERSION to the exact content of
 * BOTH its shipped directions.
 *
 * The algorithm is fully specified, stable, and collision-unambiguous:
 *
 *   1. Read the shipped `up` and `down` files as raw BYTES. Nothing is
 *      trimmed, re-indented, comment-stripped, case-folded, or otherwise
 *      normalized — the ONLY normalization applied is CRLF → LF (below), and
 *      it is applied because git checkouts on Windows runners rewrite line
 *      endings, which would otherwise make an unchanged file appear changed.
 *      Arbitrary SQL is never silently rewritten.
 *   2. Decode as UTF-8 and replace each CRLF with LF. This is the complete
 *      documented normalization; a lone CR is NOT touched, so a file that
 *      genuinely contains one still hashes distinctly.
 *   3. FRAME each component with its own byte length before concatenating:
 *
 *          straylight-migration-sha256-v1
 *          version:<n>:<version>
 *          up:<n>:<up sql>
 *          down:<n>:<down sql>
 *
 *      Each line is terminated by LF, and `<n>` is the UTF-8 byte length of
 *      the value that follows it. Length-framing is what makes the input
 *      unambiguous: no combination of version string and SQL content can
 *      produce the same framed input as a different combination, because the
 *      declared lengths pin every boundary. Concatenating the pieces without
 *      framing would let content shifted across a boundary collide.
 *   4. SHA-256 the UTF-8 bytes of that framed input; the checksum is
 *      `<algorithm>:<hex digest>`.
 *
 * Both directions participate deliberately: a rollback file that changed while
 * its up file did not is still a different migration, and the ledger must not
 * claim the old pair is applied.
 */
export function migrationChecksum(version: string, source?: MigrationSource): string {
  const up = normalizeMigrationText(source?.up ?? readMigrationSql(version, 'up'));
  const down = normalizeMigrationText(source?.down ?? readMigrationSql(version, 'down'));
  const framed =
    `${MIGRATION_CHECKSUM_ALGORITHM}\n` +
    frame('version', version) +
    frame('up', up) +
    frame('down', down);
  const digest = createHash('sha256').update(Buffer.from(framed, 'utf8')).digest('hex');
  return `${MIGRATION_CHECKSUM_ALGORITHM}:${digest}`;
}

/** Explicit migration content, for tests that must hash content not on disk. */
export interface MigrationSource {
  up: string;
  down: string;
}

/** The complete documented normalization: CRLF → LF, and nothing else. */
function normalizeMigrationText(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

function frame(label: string, value: string): string {
  return `${label}:${Buffer.byteLength(value, 'utf8')}:${value}\n`;
}

// ── ledger ──────────────────────────────────────────────────────────────

/**
 * Create the ledger if absent, ensure it carries the checksum column, and
 * attach the trigger that makes a recorded checksum immutable. Idempotent.
 *
 * ── this is INITIALIZATION, not a read ───────────────────────────────────
 *
 * Every statement here is DDL, and DDL takes an ACCESS EXCLUSIVE lock on the
 * ledger relation that is held until the enclosing transaction ends. So this
 * function runs ONLY from the migration/initialization path — `migrate`,
 * `rollback`, and the explicit `initializeLedger` entry point — and NEVER from
 * a ledger read.
 *
 * The reason is cross-estate isolation. `assertSchemaVersion` runs inside the
 * caller's ESTATE transaction, before the per-estate locks, and that
 * transaction stays open for the whole synchronous callback. Running this DDL
 * there would park an ACCESS EXCLUSIVE ledger lock for the callback's entire
 * duration, so a session on a COMPLETELY DIFFERENT estate would block on
 * `Lock/relation` behind it — or hit its statement timeout. Different estates
 * must never contend (§13.1(h), P-12), so the steady-state verification path
 * is strictly read-only (`appliedMigrations`, `verifyAppliedChecksums`,
 * `assertSchemaVersion`) and tolerates an absent or pre-checksum ledger
 * without touching its shape.
 */
async function ensureLedger(client: PoolClient): Promise<void> {
  await client.query(CREATE_MIGRATION_LEDGER);
  await client.query(ADD_MIGRATION_LEDGER_CHECKSUM);
  await client.query(CREATE_MIGRATION_LEDGER_IMMUTABILITY);
  await client.query(DROP_MIGRATION_LEDGER_IMMUTABILITY);
  await client.query(ATTACH_MIGRATION_LEDGER_IMMUTABILITY);
}

/**
 * Bring the ledger's own shape up to date: create it if absent, add the
 * checksum column if a pre-checksum build created it, and (re)attach the
 * immutability trigger. Idempotent, and the ONLY exported way to run ledger
 * DDL.
 *
 * `migrate` and `rollback` call this for you. It is exported so a deployment
 * that wants the ledger current WITHOUT applying migrations — an
 * initialization step, or a test asserting the upgrade path — can ask for it
 * explicitly instead of a read silently performing it.
 */
export async function initializeLedger(client: PoolClient): Promise<void> {
  await ensureLedger(client);
}

/**
 * Is the ledger relation present? A pure catalog lookup (`to_regclass`), so an
 * absent ledger is a `false` rather than a 42P01 that would abort the caller's
 * transaction — and so a read never has to create the table to find out.
 */
async function ledgerPresent(client: PoolClient): Promise<boolean> {
  const result = await client.query<{ present: boolean }>(MIGRATION_LEDGER_EXISTS);
  return result.rows[0]?.present === true;
}

/**
 * Versions the ledger claims are applied, version-ascending. READ-ONLY: an
 * absent ledger yields `[]` (nothing is claimed applied) rather than being
 * created.
 */
export async function appliedVersions(client: PoolClient): Promise<string[]> {
  if (!(await ledgerPresent(client))) return [];
  const result = await client.query<{ version: string }>(SELECT_APPLIED_VERSIONS);
  return result.rows.map((r) => r.version);
}

/** One ledger row: a version and the checksum it was applied from. */
export interface AppliedMigration {
  version: string;
  /** `null` when the row carries no recorded checksum — a FAILURE, not a pass. */
  content_checksum: string | null;
}

/**
 * Every ledger row, version-ascending, with its recorded checksum. READ-ONLY:
 * this is the steady-state verification path and it creates, alters, and
 * upgrades NOTHING (see `ensureLedger` for why).
 *
 * An absent ledger yields `[]` — no version is claimed applied. A ledger
 * written by a pre-checksum build yields rows whose `content_checksum` is
 * `null`, because the column is read through `to_jsonb(row) ->>` and is simply
 * absent; `null` is a verification FAILURE for every caller, so such a ledger
 * fails closed rather than being silently backfilled or migrated by a read.
 */
export async function appliedMigrations(client: PoolClient): Promise<AppliedMigration[]> {
  if (!(await ledgerPresent(client))) return [];
  const result = await client.query<AppliedMigration>(SELECT_APPLIED_MIGRATIONS);
  return result.rows.map((r) => ({
    version: r.version,
    content_checksum: typeof r.content_checksum === 'string' ? r.content_checksum : null,
  }));
}

/**
 * Verify each named version's recorded checksum against the CURRENTLY SHIPPED
 * migration content. Fails closed on every failure mode:
 *
 *   * the version is not in the ledger at all → not applied (caller decides);
 *   * the ledger row has NO checksum          → `migration_checksum_missing`;
 *   * the ledger checksum ≠ shipped content   → `migration_checksum_mismatch`.
 *
 * The mismatch case covers a FORGED ledger value, a STALE checksum left by an
 * earlier content revision, and CHANGED shipped content alike — the runner
 * cannot and does not try to distinguish which side moved; either way the
 * database's schema and the shipped migration no longer provably agree, so it
 * refuses.
 *
 * READ-ONLY. This runs inside the caller's estate transaction on every
 * `withEstateSession`, so it issues no DDL and takes no relation lock beyond
 * the ordinary read (see `ensureLedger`). An absent or pre-checksum ledger is
 * observed, not repaired.
 *
 * Returns the versions that are present in the ledger AND verified.
 */
export async function verifyAppliedChecksums(
  client: PoolClient,
  versions: readonly string[],
): Promise<string[]> {
  const ledger = new Map(
    (await appliedMigrations(client)).map((r) => [r.version, r.content_checksum]),
  );
  const verified: string[] = [];
  for (const version of versions) {
    if (!ledger.has(version)) continue;
    const recorded = ledger.get(version) ?? null;
    if (recorded === null) {
      throw new PostgresIntegrityError(
        'migration_checksum_missing',
        `migration ${version} is recorded as applied but carries no content checksum, so the ` +
          'applied schema cannot be bound to the shipped migration',
      );
    }
    const expected = migrationChecksum(version);
    if (recorded !== expected) {
      throw new PostgresIntegrityError(
        'migration_checksum_mismatch',
        `migration ${version} is recorded as applied with checksum ${recorded} but the shipped ` +
          `migration content hashes to ${expected}`,
      );
    }
    verified.push(version);
  }
  return verified;
}

/**
 * Apply every shipped version not yet in the ledger, in order. Returns the
 * versions this call applied — empty when already current (the idempotency
 * result).
 *
 * A version already in the ledger is SKIPPED only after its recorded checksum
 * is verified against the currently shipped migration content
 * (`verifyAppliedChecksums`). A missing, forged, stale, or mismatched checksum
 * raises instead — so changed migration content is never silently treated as
 * already applied, which is the defect this binding closes.
 */
export async function migrate(
  client: PoolClient,
  versions: readonly string[] = SHIPPED_SCHEMA_VERSIONS,
): Promise<string[]> {
  // The ledger's own shape is established HERE, on the initialization path,
  // and nowhere else — a version's DDL below inserts its ledger row, and the
  // checksum binding updates it, so both need the table, the checksum column,
  // and the immutability trigger to exist first. Steady-state reads never do
  // this (see `ensureLedger`).
  await ensureLedger(client);
  // Verify BEFORE deciding anything. This throws on the first version whose
  // ledger checksum does not match the shipped content, so no migration is
  // applied and no version is skipped on the strength of an unproven claim.
  const already = new Set(await verifyAppliedChecksums(client, versions));
  const applied: string[] = [];
  for (const version of versions) {
    if (already.has(version)) continue;
    const sql = readMigrationSql(version, 'up');
    // Hash the content BEFORE applying it, so the checksum recorded in the
    // ledger is derived from the same read that produced the SQL below.
    const checksum = migrationChecksum(version, {
      up: sql,
      down: readMigrationSql(version, 'down'),
    });
    await client.query('BEGIN');
    try {
      await client.query(sql);
      // Bind the checksum in the SAME transaction as the DDL and the ledger row
      // the migration file inserted. The UPDATE is guarded by
      // `content_checksum IS NULL`, so it can only fill an unbound row — it can
      // never overwrite an existing binding — and it must affect exactly the
      // one row the migration just claimed.
      const bound = await client.query(BIND_MIGRATION_CHECKSUM, [version, checksum]);
      if (bound.rowCount !== 1) {
        throw new PostgresIntegrityError(
          'migration_checksum_missing',
          `migration ${version} did not produce exactly one unbound ledger row to bind its ` +
            `content checksum to (rows affected: ${String(bound.rowCount)})`,
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      // An integrity refusal keeps its own class: it is a contract violation,
      // not an availability blip, and callers distinguish the two.
      if (err instanceof PostgresIntegrityError) throw err;
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
 *
 * Fails closed on an unverifiable checksum, like every other "is this version
 * applied?" decision. Running the currently shipped DOWN file against a schema
 * that was applied from DIFFERENT content is precisely the case where a
 * rollback could destroy or half-drop objects it does not describe, so the
 * refusal is the safe outcome; the runbook's export-then-repair path is the
 * operator route out of a mismatched ledger.
 */
export async function rollback(client: PoolClient, version: string): Promise<boolean> {
  // Also an initialization-path caller: the DOWN file deletes the version's
  // ledger row, so the ledger must exist and carry its current shape. As in
  // `migrate`, this is the only kind of caller permitted to run ledger DDL.
  await ensureLedger(client);
  const verified = new Set(await verifyAppliedChecksums(client, [version]));
  if (!verified.has(version)) return false;
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
 * Fail closed unless every required version is applied AND its recorded
 * checksum matches the shipped migration content. A store whose schema version
 * does not match must DENY, not serve a partial schema (P-11) — and a store
 * whose ledger cannot prove WHICH migration content produced its schema is in
 * exactly that position, so it denies too.
 *
 * This is the host-side guard: `PostgresEstateHost.withEstateSession` and every
 * read path call it before serving any operation, so an unverifiable schema is
 * refused at the boundary rather than discovered mid-session.
 *
 * READ-ONLY, and that is load-bearing: this runs inside the estate transaction
 * before the per-estate locks, so any DDL here would hold a ledger relation
 * lock for the whole callback and couple unrelated estates together
 * (see `ensureLedger`). Verification only observes.
 */
export async function assertSchemaVersion(
  client: PoolClient,
  required: readonly string[],
): Promise<void> {
  // Checksum verification runs FIRST and raises on a missing/forged/stale
  // binding. It returns the required versions that are both present and
  // verified, which is the only set that may count as applied.
  const verified = new Set(await verifyAppliedChecksums(client, required));
  const missing = required.filter((v) => !verified.has(v));
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
