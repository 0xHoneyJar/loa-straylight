// Delta persistence, inside the host transaction, before COMMIT.
//
// Upsert rows are written at their final session value. Append-only rows are
// INSERTed with no ON CONFLICT clause, so a collision raises — and each
// collision is then classified explicitly:
//
//   identical canonical payload  → IDEMPOTENT. The row already durably
//                                  exists with exactly this content, so the
//                                  retry converges on it and creates no
//                                  duplicate (ADR-049Q §13.1(g)).
//   conflicting payload          → PostgresIntegrityError. The immutable id
//                                  is being reused for different content;
//                                  the transaction rolls back and no
//                                  operation is reported successful (P-3).
//
// The distinction is drawn against the EXISTING DURABLE ROW, never against a
// blanket DO NOTHING that would absorb both cases identically.

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
  for (const row of delta.transitions) {
    const outcome = await insertAppendOnly(client, {
      insertSql: Q.INSERT_TRANSITION,
      insertParams: [
        row.record.transition_id,
        row.estate_id,
        row.append_position,
        canonicalPayload(row.record),
      ],
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
      insertParams: [
        row.record.receipt_id,
        row.estate_id,
        row.append_position,
        canonicalPayload(row.record),
      ],
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
      insertParams: [
        row.record.receipt_id,
        row.estate_id,
        row.append_position,
        canonicalPayload(row.record),
      ],
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
      insertParams: [
        row.record.audit_event_id,
        row.estate_id,
        row.append_position,
        row.record.audit_hash,
        row.record.previous_audit_hash ?? null,
        previousHashKey(row.record),
        canonicalPayload(row.record),
      ],
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

interface AppendInsert<T> {
  insertSql: string;
  insertParams: unknown[];
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
  const savepoint = 'straylight_append';
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    await client.query(spec.insertSql, spec.insertParams);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    return 'inserted';
  } catch (err) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    if (!isUniqueViolation(err)) throw err;

    // The id may already exist (retry) or the POSITION may be taken by a
    // different id (a racer won the slot). Only the first is idempotent.
    const existing = await client.query<Record<string, unknown>>(spec.selectByIdSql, [spec.id]);
    const existingRow = existing.rows[0];
    if (existingRow === undefined) {
      throw new PostgresIntegrityError(
        'duplicate_append_position',
        `${spec.table}: append position ${spec.row.append_position} for estate ` +
          `${spec.row.estate_id} is already occupied by another record`,
      );
    }
    const existingPayload = existingRow['payload'];
    const incomingPayload = canonicalPayload(spec.row.record);
    if (canonicalPayload(existingPayload) !== incomingPayload) {
      throw new PostgresIntegrityError(
        'immutable_id_conflict',
        `${spec.table}: immutable id ${spec.id} already exists with different canonical content`,
      );
    }
    return 'idempotent';
  }
}
