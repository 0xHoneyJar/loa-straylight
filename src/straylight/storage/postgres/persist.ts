// Delta persistence, inside the host transaction, before COMMIT.
//
// Upsert rows are written at their final session value. Append-only rows are
// INSERTed with no ON CONFLICT clause, so a collision raises — and each
// collision is then classified explicitly:
//
//   identical COMPLETE DURABLE ROW → IDEMPOTENT. The row already durably
//                                  exists with exactly this content at
//                                  exactly this identity and placement, so
//                                  the retry converges on it and creates no
//                                  duplicate (ADR-049Q §13.1(g)).
//   any difference                 → PostgresIntegrityError. The immutable id
//                                  is being reused for a different row; the
//                                  transaction rolls back and no operation is
//                                  reported successful (P-3).
//
// The distinction is drawn against the EXISTING DURABLE ROW, never against a
// blanket DO NOTHING that would absorb both cases identically — and it covers
// the COMPLETE row, not just the canonical payload. Every column the INSERT
// wrote is compared: the immutable primary id, the promoted `estate_id`, the
// promoted `append_position`, the promoted audit hash, the promoted previous
// audit hash, the normalized previous-hash key, and the canonical payload.
//
// Payload-only equality is NOT sufficient, and that is the recorded lesson of
// this file. A row inserted with the same id and the same canonical payload but
// a DIFFERENT promoted `estate_id` (or position, or chain link) is a different
// durable row: it is invisible to the estate the session is writing, so
// treating it as an idempotent convergence would report success for a write
// that produced no visible row. The comparison is therefore driven by
// `durableColumns` — declared beside the INSERT parameters it mirrors, so a
// future column cannot be added to one without the other.

import type { PoolClient } from 'pg';

import type { ID } from '../../types.js';
import { PostgresIntegrityError } from './errors.js';
import type { CanonicalDelta, Positioned } from './canonical-state.js';
import { canonicalPayload, previousHashKey } from './rows.js';
import * as Q from './queries.js';

/** PostgreSQL SQLSTATE for unique-constraint violation. */
const UNIQUE_VIOLATION = '23505';
/** SQLSTATE the immutability triggers raise. */
const INTEGRITY_CONSTRAINT_VIOLATION = '23000';

function sqlState(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

export function isUniqueViolation(err: unknown): boolean {
  return sqlState(err) === UNIQUE_VIOLATION;
}

export function isImmutabilityRefusal(err: unknown): boolean {
  return sqlState(err) === INTEGRITY_CONSTRAINT_VIOLATION;
}

/** Outcome of persisting one append-only row. */
export type AppendOutcome = 'inserted' | 'idempotent';

export interface PersistResult {
  inserted: number;
  idempotent: number;
}

export async function persistDelta(
  client: PoolClient,
  delta: CanonicalDelta,
): Promise<PersistResult> {
  // Seed with the session's in-snapshot idempotent skips: a retry whose
  // records were already in the loaded prefix produced no delta rows at all,
  // and its convergence must still be reported rather than looking like a
  // callback that did nothing.
  const result: PersistResult = { inserted: 0, idempotent: delta.idempotentSkips };

  for (const actor of delta.actors) {
    await client.query(Q.UPSERT_ACTOR, [actor.actor_id, canonicalPayload(actor)]);
  }
  for (const estate of delta.estates) {
    await client.query(Q.UPSERT_ESTATE, [estate.estate_id, canonicalPayload(estate)]);
  }
  for (const keyring of delta.keyrings) {
    await client.query(Q.UPSERT_KEYRING, [keyring.keyring_id, canonicalPayload(keyring)]);
  }
  for (const assertion of delta.assertions) {
    await client.query(Q.UPSERT_ASSERTION, [
      assertion.assertion_id,
      assertion.estate_id,
      canonicalPayload(assertion),
    ]);
  }

  // Append-only inserts, in dependency-free but deterministic order:
  // transitions, then their receipts, then recall receipts, then the audit
  // chain (whose per-estate uniqueness constraints are the strictest).
  //
  // `durableColumns` enumerates every column the INSERT writes, in the same
  // order and from the same expressions as `insertParams`. It is what the
  // conflict classifier compares against the existing durable row, so
  // idempotency is complete-row equality by construction.
  for (const row of delta.transitions) {
    const outcome = await insertAppendOnly(client, {
      insertSql: Q.INSERT_TRANSITION,
      durableColumns: {
        transition_id: row.record.transition_id,
        estate_id: row.estate_id,
        append_position: row.append_position,
        payload: canonicalPayload(row.record),
      },
      selectByIdSql: Q.SELECT_TRANSITION_BY_ID,
      id: row.record.transition_id,
      table: 'estate_transitions',
      row,
    });
    bump(result, outcome);
  }

  for (const row of delta.transitionReceipts) {
    const outcome = await insertAppendOnly(client, {
      insertSql: Q.INSERT_TRANSITION_RECEIPT,
      durableColumns: {
        receipt_id: row.record.receipt_id,
        estate_id: row.estate_id,
        append_position: row.append_position,
        payload: canonicalPayload(row.record),
      },
      selectByIdSql: Q.SELECT_TRANSITION_RECEIPT_BY_ID,
      id: row.record.receipt_id,
      table: 'transition_receipts',
      row,
    });
    bump(result, outcome);
  }

  for (const row of delta.recallReceipts) {
    const outcome = await insertAppendOnly(client, {
      insertSql: Q.INSERT_RECALL_RECEIPT,
      durableColumns: {
        receipt_id: row.record.receipt_id,
        estate_id: row.estate_id,
        append_position: row.append_position,
        payload: canonicalPayload(row.record),
      },
      selectByIdSql: Q.SELECT_RECALL_RECEIPT_BY_ID,
      id: row.record.receipt_id,
      table: 'recall_receipts',
      row,
    });
    bump(result, outcome);
  }

  for (const row of delta.auditEvents) {
    const outcome = await insertAppendOnly(client, {
      insertSql: Q.INSERT_AUDIT_EVENT,
      durableColumns: {
        audit_event_id: row.record.audit_event_id,
        estate_id: row.estate_id,
        append_position: row.append_position,
        audit_hash: row.record.audit_hash,
        previous_audit_hash: row.record.previous_audit_hash ?? null,
        previous_audit_hash_key: previousHashKey(row.record),
        payload: canonicalPayload(row.record),
      },
      selectByIdSql: Q.SELECT_AUDIT_EVENT_BY_ID,
      id: row.record.audit_event_id,
      table: 'audit_events',
      row,
    });
    bump(result, outcome);
  }

  return result;
}

function bump(result: PersistResult, outcome: AppendOutcome): void {
  if (outcome === 'inserted') result.inserted += 1;
  else result.idempotent += 1;
}

/**
 * Every durable column one append-only INSERT writes, keyed by column name.
 *
 * `payload` is the CANONICAL SERIALIZATION of the record (a string). Every
 * other entry is the promoted column's value exactly as the INSERT binds it:
 * a `string` id, a `number` position, or `string | null` for the nullable
 * previous-hash column.
 */
type DurableColumns = Readonly<Record<string, string | number | null>>;

interface AppendInsert<T> {
  insertSql: string;
  /**
   * The complete durable row this INSERT writes. Supplies BOTH the bind
   * parameters (in declaration order — the same order as the SQL's `$n`
   * placeholders) AND the comparison basis for conflict classification, so
   * the two can never drift apart.
   */
  durableColumns: DurableColumns;
  selectByIdSql: string;
  id: ID;
  table: string;
  row: Positioned<T>;
}

/**
 * Insert one append-only row, classifying a unique violation.
 *
 * The insert runs inside a SAVEPOINT so a raised unique violation does not
 * poison the enclosing transaction: PostgreSQL marks a transaction as
 * aborted after any error, and without the savepoint the subsequent
 * classification SELECT would itself fail with `current transaction is
 * aborted`. The savepoint is released on success and rolled back to on
 * error, leaving the outer transaction usable either way.
 */
async function insertAppendOnly<T>(
  client: PoolClient,
  spec: AppendInsert<T>,
): Promise<AppendOutcome> {
  // Fail closed before touching the database if the declared durable columns
  // and the INSERT statement have drifted apart: an undeclared column would be
  // a column the equality check below cannot see, which is exactly the defect
  // this file's header records.
  assertColumnsMatchStatement(spec.table, spec.insertSql, spec.durableColumns);

  const savepoint = 'straylight_append';
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    // Declaration order IS bind order: the object's string keys enumerate in
    // creation order, and `assertColumnsMatchStatement` has just proven that
    // order equals the statement's own column list.
    await client.query(spec.insertSql, Object.values(spec.durableColumns));
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    return 'inserted';
  } catch (err) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    if (!isUniqueViolation(err)) throw err;

    // The id may already exist (retry) or the POSITION may be taken by a
    // different id (a racer won the slot). Only the first can be idempotent.
    const existing = await client.query<Record<string, unknown>>(spec.selectByIdSql, [spec.id]);
    const existingRow = existing.rows[0];
    if (existingRow === undefined) {
      throw new PostgresIntegrityError(
        'duplicate_append_position',
        `${spec.table}: append position ${spec.row.append_position} for estate ` +
          `${spec.row.estate_id} is already occupied by another record`,
      );
    }
    // COMPLETE-ROW equality. Every column the INSERT wrote must match the
    // existing durable row — identity, placement, chain linkage, and canonical
    // payload alike. The FIRST difference found is reported and the whole
    // transaction rolls back; nothing here ever repairs or updates a row.
    const mismatch = firstColumnMismatch(spec.durableColumns, existingRow);
    if (mismatch !== null) {
      throw new PostgresIntegrityError(
        'immutable_id_conflict',
        `${spec.table}: immutable id ${spec.id} already exists as a different durable row ` +
          `(${mismatch.column}: durable ${mismatch.durable} != incoming ${mismatch.incoming})`,
      );
    }
    return 'idempotent';
  }
}

/**
 * Prove that the declared durable columns are EXACTLY the columns the INSERT
 * statement writes, in the same order.
 *
 * This is the structural guard on Finding-3's defect class. The classifier can
 * only compare columns it was told about, so a column added to the SQL without
 * being declared here would silently fall outside complete-row equality. Rather
 * than trust that the two lists stay in sync by convention, the column list is
 * parsed out of the statement text and required to match — and a disagreement
 * raises before any row is written.
 *
 * The statement text is a module constant from `queries.ts`, never caller
 * input, so this is a self-consistency check on shipped code rather than
 * validation of untrusted data.
 */
function assertColumnsMatchStatement(
  table: string,
  insertSql: string,
  declared: DurableColumns,
): void {
  const match = /INSERT\s+INTO\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)/i.exec(insertSql);
  if (match === null || match[1] === undefined || match[2] === undefined) {
    throw new PostgresIntegrityError(
      'malformed_row',
      `${table}: could not read the column list from its INSERT statement, so ` +
        'complete-row idempotency cannot be guaranteed',
    );
  }
  if (match[1] !== table) {
    throw new PostgresIntegrityError(
      'malformed_row',
      `${table}: INSERT statement targets ${match[1]}`,
    );
  }
  const statementColumns = match[2]
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  const declaredColumns = Object.keys(declared);
  const same =
    statementColumns.length === declaredColumns.length &&
    statementColumns.every((c, i) => c === declaredColumns[i]);
  if (!same) {
    throw new PostgresIntegrityError(
      'malformed_row',
      `${table}: declared durable columns [${declaredColumns.join(', ')}] do not match the ` +
        `INSERT column list [${statementColumns.join(', ')}]`,
    );
  }
}

/**
 * Compare the incoming durable row against the existing one, column by
 * column, and return the first difference — or `null` when every declared
 * column matches exactly.
 *
 * A column the SELECT did not return (`undefined`, as distinct from a SQL
 * NULL) is itself a mismatch, not a pass: it means the lookup statement and
 * the insert disagree about the row's shape, and an unreadable column can
 * never be certified equal.
 */
function firstColumnMismatch(
  incoming: DurableColumns,
  existing: Record<string, unknown>,
): { column: string; durable: string; incoming: string } | null {
  for (const [column, incomingValue] of Object.entries(incoming)) {
    if (!(column in existing)) {
      return {
        column,
        durable: '<not selected>',
        incoming: describeValue(incomingValue),
      };
    }
    const durableValue = existing[column];
    if (!durableColumnEquals(column, durableValue, incomingValue)) {
      return {
        column,
        durable: describeValue(durableValue),
        incoming: describeValue(incomingValue),
      };
    }
  }
  return null;
}

/**
 * Column-appropriate equality.
 *
 *   `payload`  the durable value is decoded `jsonb`; re-canonicalizing it
 *              makes the comparison independent of key order and of the
 *              server's own JSONB normalization, which is what lets a genuine
 *              exact retry stay idempotent.
 *   positions  `bigint` arrives from node-postgres as a STRING to avoid
 *              precision loss, so it is compared by decimal-string form
 *              rather than by JavaScript type.
 *   everything else
 *              strict identity of the string / null value, so NULL is equal
 *              only to NULL and never to `''` — the normalized-key column and
 *              the nullable parent column are checked as the distinct
 *              enforcement columns they are.
 */
function durableColumnEquals(column: string, durable: unknown, incoming: unknown): boolean {
  if (column === 'payload') {
    return canonicalPayload(durable) === incoming;
  }
  if (typeof incoming === 'number') {
    // Reject a non-integral or unsafe incoming position outright rather than
    // stringifying it into a form that might coincidentally match.
    if (!Number.isSafeInteger(incoming)) return false;
    if (typeof durable === 'string') return durable === String(incoming);
    if (typeof durable === 'number') return Number.isSafeInteger(durable) && durable === incoming;
    if (typeof durable === 'bigint') return durable === BigInt(incoming);
    return false;
  }
  return durable === incoming;
}

function describeValue(value: unknown): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '<absent>';
  if (typeof value === 'string') return value;
  return JSON.stringify(value) ?? String(value);
}
