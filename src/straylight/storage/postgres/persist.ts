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
// blanket DO NOTHING that would absorb both cases identically.
//
// ── R2: WHAT IS COMPARED, AND WHAT IS VALIDATED SEPARATELY ──────────────
//
// This file still BINDS every durable column its INSERT writes — including
// `append_position` — because the INSERT must write the complete row. But
// equality is decided over the CALLER-CONTROLLED SUBSET only, from the single
// shared declaration in `rows.ts` (`callerControlledRow` /
// `firstCallerControlledMismatch`), which `session.ts`'s in-snapshot classifier
// consumes identically. Payload (carrying the record's own id), record estate,
// and for audit events the chain fields including the normalized parent key.
//
// `append_position` is NOT compared as a caller-supplied field. The adapter's
// append methods supply no append position, so no caller-supplied position
// exists; comparing the stored position against an invented ordinal is exactly
// what falsely refused a byte-identical replay of an independently committed
// operation. Placement is validated SEPARATELY, against the store's own
// invariants: the per-estate dense-prefix invariant plus the shipped database
// constraints (`CHECK (append_position >= 1)`, `UNIQUE (estate_id,
// append_position)`, `UNIQUE (estate_id, previous_audit_hash_key)`, the audit
// genesis CHECK). `storedPlacementViolation` performs that check here against
// the live estate's positions, so a matched row the store cannot vouch for is
// REFUSED rather than served as a convergence target.
//
// Payload-only equality is still NOT sufficient, and that remains the recorded
// lesson of this file. A row inserted with the same id and the same canonical
// payload but a DIFFERENT promoted `estate_id` (or a different chain link) is a
// different durable write: it is invisible to the estate the session is writing,
// so treating it as an idempotent convergence would report success for a write
// that produced no visible row. `assertColumnsMatchStatement` still proves the
// declared bind set is exactly the statement's column list, so an added column
// cannot silently escape the INSERT.

import type { PoolClient } from 'pg';

import type { ID } from '../../types.js';
import { PostgresIntegrityError } from './errors.js';
import type { CanonicalDelta, Positioned } from './canonical-state.js';
import {
  CALLER_CONTROLLED_COLUMNS,
  callerControlledRow,
  canonicalPayload,
  describeCell,
  firstCallerControlledMismatch,
  previousHashKey,
  storedPlacementViolation,
} from './rows.js';
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
      selectPositionsSql: Q.SELECT_TRANSITION_POSITIONS,
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
      selectPositionsSql: Q.SELECT_TRANSITION_RECEIPT_POSITIONS,
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
      selectPositionsSql: Q.SELECT_RECALL_RECEIPT_POSITIONS,
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
      selectPositionsSql: Q.SELECT_AUDIT_EVENT_POSITIONS,
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
   * The complete durable row this INSERT writes. Supplies the bind parameters
   * in declaration order — the same order as the SQL's `$n` placeholders — and
   * `assertColumnsMatchStatement` proves that order equals the statement's own
   * column list, so a column added to the SQL cannot escape the binding.
   *
   * NOTE: this is the BIND set, not the equality set. Equality is decided over
   * the caller-controlled subset only (`rows.ts#callerControlledRow`); the
   * store-assigned `append_position` bound here is validated separately against
   * the store's placement invariants. See the module header.
   */
  durableColumns: DurableColumns;
  selectByIdSql: string;
  /** Every live position of this table for one estate — the placement check. */
  selectPositionsSql: string;
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
    // (1) CALLER-CONTROLLED equality, from the SHARED declaration in `rows.ts`
    // that `session.ts`'s in-snapshot classifier also consumes. The stored
    // side's fields are read from the LIVE row; the incoming side's from the
    // record the session offered under its bound estate. `append_position` is
    // deliberately absent — see the module header. The FIRST difference found is
    // reported and the whole transaction rolls back; nothing here ever repairs
    // or updates a row.
    const mismatch = firstCallerControlledMismatch(
      liveCallerControlledRow(spec.table, existingRow),
      callerControlledRow(String(spec.durableColumns['estate_id']), spec.row.record),
    );
    if (mismatch !== null) {
      throw new PostgresIntegrityError(
        'immutable_id_conflict',
        `${spec.table}: immutable id ${spec.id} already exists as a different durable write ` +
          `(${mismatch.column}: durable ${mismatch.existing} != incoming ${mismatch.incoming})`,
      );
    }
    // (2) STORED PLACEMENT INTEGRITY, checked against the STORE's own
    // invariants rather than any caller claim: the estate's live positions must
    // be a dense 1..n prefix and the matched row must sit inside it. A matched
    // row the store cannot vouch for is REFUSED, never served as a convergence
    // target — certifying an incoming write against a corrupt placement would
    // launder it into a reported success.
    const positions = await client.query<{ append_position: unknown }>(spec.selectPositionsSql, [
      spec.row.estate_id,
    ]);
    const scoped = positions.rows.map((r) => toPosition(r.append_position));
    const placement = storedPlacementViolation(scoped, toPosition(existingRow['append_position']));
    if (placement !== null) {
      throw new PostgresIntegrityError(
        'append_prefix_mutated',
        `${spec.table}: immutable id ${spec.id} matches a live row whose placement is unsound ` +
          `for estate ${spec.row.estate_id}: ${placement}`,
      );
    }
    return 'idempotent';
  }
}

/**
 * The caller-controlled fields of a LIVE durable row, as the shared comparison
 * expects them.
 *
 * `payload` arrives as decoded `jsonb`, so it is RE-CANONICALIZED: the
 * comparison must be independent of key order and of the server's own JSONB
 * normalization, which is what lets a genuine exact retry stay idempotent.
 *
 * The audit-chain fields are included exactly when the table is the chain-linked
 * one AND the SELECT returned them. A chain column the SELECT did not return
 * surfaces as `<absent>` against the incoming record's value, which the shared
 * comparator reports as a difference — an unreadable column can never be
 * certified equal.
 */
function liveCallerControlledRow(
  table: string,
  existing: Record<string, unknown>,
): Readonly<Record<string, string | null>> {
  const row: Record<string, string | null> = {
    payload: canonicalPayload(existing['payload']),
    estate_id: asTextOrNull(existing['estate_id']),
  };
  if (table === 'audit_events') {
    for (const column of ['audit_hash', 'previous_audit_hash', 'previous_audit_hash_key'] as const) {
      if (!(column in existing)) continue;
      row[column] = asTextOrNull(existing[column]);
    }
  }
  return row;
}

/**
 * A durable text column as `string | null`. Anything that is neither (an
 * unexpected driver type) becomes a value that cannot equal a legitimate one, so
 * it fails closed rather than coercing into a coincidental match.
 */
function asTextOrNull(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === 'string') return value;
  return `<non-text:${typeof value}>`;
}

/**
 * A durable `bigint` position as a JavaScript number. node-postgres returns
 * `bigint` as a STRING to avoid precision loss. A value that is not a safe
 * integer becomes `Number.NaN`, which `storedPlacementViolation` refuses — an
 * unreadable position is never treated as sound.
 */
function toPosition(value: unknown): number {
  const n =
    typeof value === 'string'
      ? Number(value)
      : typeof value === 'bigint'
        ? Number(value)
        : typeof value === 'number'
          ? value
          : Number.NaN;
  return Number.isSafeInteger(n) ? n : Number.NaN;
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
 * The caller-controlled column set this file compares over, re-exported from the
 * SHARED declaration so a reader of the persist path sees the same list the
 * session path uses — and so a test can prove the two consume one declaration
 * rather than two agreeing copies.
 */
export const COMPARED_COLUMNS = CALLER_CONTROLLED_COLUMNS;

/** Re-exported for diagnostics symmetry with the shared comparator. */
export { describeCell };
