// Row codec — durable `jsonb` payload ⇄ canonical domain record.
//
// The canonical primitives are stored WHOLE, as one `jsonb` payload per row,
// with the fields the database needs to enforce invariants (primary id,
// estate_id, append_position, audit hashes) promoted to columns. Two reasons:
//
//   1. Semantics live above the substrate (ADR-049Q §11.1). Shredding
//      `Assertion` into thirty columns would move part of the domain model
//      into the schema, and every later semantic change would become a
//      migration. Straylight owns the shape; the store holds the bytes.
//   2. Round-tripping is then byte-exact under the canonical serializer,
//      which is what makes "compare canonical state after export/restore"
//      a real equality check rather than a field-by-field approximation.
//
// Every decode is DEFENSIVE. A row whose payload is not an object, whose
// promoted column disagrees with the payload's own field, or which lacks a
// required identity field is a `malformed_row` integrity error — it is never
// served and never repaired (P-3, P-11).

import { canonicalize } from '../../canonical.js';
import type {
  Actor,
  ActorEstate,
  Assertion,
  AuditEvent,
  EstateTransition,
  ID,
  Keyring,
  RecallReceipt,
  TransitionReceipt,
} from '../../types.js';
import { PostgresIntegrityError } from './errors.js';
import type { Positioned } from './canonical-state.js';

/** Canonical serialization of a domain record, used for every comparison. */
export function canonicalPayload(record: unknown): string {
  return canonicalize(record);
}

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PostgresIntegrityError(
      'malformed_row',
      `${context}: payload is not a JSON object`,
    );
  }
  return value as Record<string, unknown>;
}

function requireString(
  payload: Record<string, unknown>,
  field: string,
  context: string,
): string {
  const value = payload[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new PostgresIntegrityError(
      'malformed_row',
      `${context}: payload.${field} must be a non-empty string`,
    );
  }
  return value;
}

function requireAgreement(
  context: string,
  field: string,
  columnValue: string,
  payloadValue: string,
): void {
  if (columnValue !== payloadValue) {
    throw new PostgresIntegrityError(
      'malformed_row',
      `${context}: column ${field}=${columnValue} disagrees with payload.${field}=${payloadValue}`,
    );
  }
}

function requirePosition(value: unknown, context: string): number {
  // node-postgres returns bigint as a string to avoid precision loss.
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 1) {
    throw new PostgresIntegrityError(
      'malformed_row',
      `${context}: append_position must be a positive safe integer, got ${String(value)}`,
    );
  }
  return n;
}

// ── upsert tables ───────────────────────────────────────────────────────

export function decodeActor(row: { actor_id: string; payload: unknown }): Actor {
  const context = `actors[${row.actor_id}]`;
  const payload = asRecord(row.payload, context);
  requireAgreement(context, 'actor_id', row.actor_id, requireString(payload, 'actor_id', context));
  return payload as unknown as Actor;
}

export function decodeEstate(row: { estate_id: string; payload: unknown }): ActorEstate {
  const context = `actor_estates[${row.estate_id}]`;
  const payload = asRecord(row.payload, context);
  requireAgreement(context, 'estate_id', row.estate_id, requireString(payload, 'estate_id', context));
  return payload as unknown as ActorEstate;
}

export function decodeKeyring(row: { keyring_id: string; payload: unknown }): Keyring {
  const context = `keyrings[${row.keyring_id}]`;
  const payload = asRecord(row.payload, context);
  requireAgreement(
    context,
    'keyring_id',
    row.keyring_id,
    requireString(payload, 'keyring_id', context),
  );
  return payload as unknown as Keyring;
}

export function decodeAssertion(row: {
  assertion_id: string;
  estate_id: string;
  payload: unknown;
}): Assertion {
  const context = `estate_assertions[${row.assertion_id}]`;
  const payload = asRecord(row.payload, context);
  requireAgreement(
    context,
    'assertion_id',
    row.assertion_id,
    requireString(payload, 'assertion_id', context),
  );
  requireAgreement(context, 'estate_id', row.estate_id, requireString(payload, 'estate_id', context));
  return payload as unknown as Assertion;
}

// ── append-only tables ──────────────────────────────────────────────────

export function decodeTransition(row: {
  transition_id: string;
  estate_id: string;
  append_position: unknown;
  payload: unknown;
}): Positioned<EstateTransition> {
  const context = `estate_transitions[${row.transition_id}]`;
  const payload = asRecord(row.payload, context);
  requireAgreement(
    context,
    'transition_id',
    row.transition_id,
    requireString(payload, 'transition_id', context),
  );
  requireAgreement(context, 'estate_id', row.estate_id, requireString(payload, 'estate_id', context));
  return {
    estate_id: row.estate_id,
    append_position: requirePosition(row.append_position, context),
    record: payload as unknown as EstateTransition,
  };
}

export function decodeTransitionReceipt(row: {
  receipt_id: string;
  estate_id: string;
  append_position: unknown;
  payload: unknown;
}): Positioned<TransitionReceipt> {
  const context = `transition_receipts[${row.receipt_id}]`;
  const payload = asRecord(row.payload, context);
  requireAgreement(
    context,
    'receipt_id',
    row.receipt_id,
    requireString(payload, 'receipt_id', context),
  );
  requireAgreement(context, 'estate_id', row.estate_id, requireString(payload, 'estate_id', context));
  return {
    estate_id: row.estate_id,
    append_position: requirePosition(row.append_position, context),
    record: payload as unknown as TransitionReceipt,
  };
}

export function decodeRecallReceipt(row: {
  receipt_id: string;
  estate_id: string;
  append_position: unknown;
  payload: unknown;
}): Positioned<RecallReceipt> {
  const context = `recall_receipts[${row.receipt_id}]`;
  const payload = asRecord(row.payload, context);
  requireAgreement(
    context,
    'receipt_id',
    row.receipt_id,
    requireString(payload, 'receipt_id', context),
  );
  requireAgreement(context, 'estate_id', row.estate_id, requireString(payload, 'estate_id', context));
  return {
    estate_id: row.estate_id,
    append_position: requirePosition(row.append_position, context),
    record: payload as unknown as RecallReceipt,
  };
}

export function decodeAuditEvent(row: {
  audit_event_id: string;
  estate_id: string;
  append_position: unknown;
  audit_hash: string;
  previous_audit_hash: string | null;
  payload: unknown;
}): Positioned<AuditEvent> {
  const context = `audit_events[${row.audit_event_id}]`;
  const payload = asRecord(row.payload, context);
  requireAgreement(
    context,
    'audit_event_id',
    row.audit_event_id,
    requireString(payload, 'audit_event_id', context),
  );
  requireAgreement(context, 'estate_id', row.estate_id, requireString(payload, 'estate_id', context));
  requireAgreement(
    context,
    'audit_hash',
    row.audit_hash,
    requireString(payload, 'audit_hash', context),
  );
  // `previous_audit_hash` is optional in the domain type (undefined for the
  // genesis link) and nullable in the column. The two must agree exactly:
  // NULL ⇔ absent. A column/payload disagreement here would let a restored
  // chain claim a parent it does not record, so it is malformed, not
  // tolerated.
  const payloadPrev = payload['previous_audit_hash'];
  const columnPrev = row.previous_audit_hash;
  const payloadPrevIsAbsent = payloadPrev === undefined || payloadPrev === null;
  if (columnPrev === null) {
    if (!payloadPrevIsAbsent) {
      throw new PostgresIntegrityError(
        'malformed_row',
        `${context}: column previous_audit_hash is NULL but payload declares ${String(payloadPrev)}`,
      );
    }
  } else {
    if (payloadPrevIsAbsent || payloadPrev !== columnPrev) {
      throw new PostgresIntegrityError(
        'malformed_row',
        `${context}: column previous_audit_hash=${columnPrev} disagrees with payload ${String(payloadPrev)}`,
      );
    }
  }
  return {
    estate_id: row.estate_id,
    append_position: requirePosition(row.append_position, context),
    record: payload as unknown as AuditEvent,
  };
}

/** Normalized chain key: the genesis link's absent parent becomes ''. */
export function previousHashKey(record: AuditEvent): string {
  return record.previous_audit_hash ?? '';
}

export function estateIdOf(value: { estate_id: ID }): ID {
  return value.estate_id;
}

// ── the CALLER-CONTROLLED immutable comparison (R2, declared ONCE) ───────
//
// Two append-only writes are THE SAME DURABLE WRITE exactly when the immutable
// primary id matches AND every CALLER-CONTROLLED immutable field matches. This
// is the single declaration of that field set. Both classifiers consume it:
// `session.ts` against the loaded snapshot, `persist.ts` against the live
// database row. Neither restates it, so the two cannot drift.
//
// What is caller-controlled:
//
//   payload                   the canonical serialization of the record, which
//                             CARRIES THE RECORD'S OWN ID. Identity is therefore
//                             inside the comparison, not beside it.
//   estate_id                 the record's own declared estate.
//   audit_hash                audit events only: the caller-computed chain hash.
//   previous_audit_hash       audit events only: the caller-declared parent link,
//                             `null` for the genesis event.
//   previous_audit_hash_key   audit events only: the NORMALIZED parent key. Kept
//                             DISTINCT from the column above because '' (genesis)
//                             must never be conflated with NULL — they are two
//                             separate enforcement columns in the schema.
//
// What is NOT caller-controlled, and is deliberately ABSENT:
//
//   append_position           STORE-ASSIGNED. `StorageAdapter.appendTransition`,
//                             `upsertTransitionReceipt`, `upsertRecallReceipt`
//                             and `appendAuditEvent` supply NO append position,
//                             so no caller-supplied append position exists and
//                             none may be invented. The rejected implementation
//                             compared the stored position against a
//                             session-local offer ordinal that restarted every
//                             transaction; that ordinal was not a historical
//                             durable position, and comparing it FALSELY REFUSED
//                             a byte-identical replay of an independently
//                             committed operation. Placement is validated
//                             SEPARATELY, against the store's own invariants —
//                             the per-estate dense-prefix invariant and the
//                             shipped database constraints — never against a
//                             caller claim.

/**
 * The caller-controlled column names, in comparison order. Exported so a test
 * can pin the set structurally and so neither classifier can quietly widen or
 * narrow it.
 *
 * `append_position` is absent BY CONTRACT — see the note above. A test asserts
 * its absence, so re-adding it here fails.
 */
export const CALLER_CONTROLLED_COLUMNS = Object.freeze([
  'payload',
  'estate_id',
  'audit_hash',
  'previous_audit_hash',
  'previous_audit_hash_key',
] as const);

/** The caller-controlled columns of one append-only record, keyed by column. */
export type CallerControlledRow = Readonly<Record<string, string | null>>;

/**
 * The caller-controlled immutable identity of one append-only record.
 *
 * `estate_id` is passed in rather than read off the record so each side can
 * supply the value its own authority establishes: `session.ts` supplies the
 * SESSION's bound estate for the offered record and the row's PROMOTED estate
 * column for the stored row; `persist.ts` supplies the same promoted column it
 * binds to its INSERT. (The row codec above already requires the promoted column
 * and the payload's own field to agree, so the two can never disagree silently.)
 *
 * The audit-chain columns are added only for a chain-linked record, detected
 * STRUCTURALLY rather than by a caller-supplied table label — a label cannot be
 * passed wrongly to weaken the comparison.
 */
export function callerControlledRow(estate_id: ID, record: unknown): CallerControlledRow {
  const row: Record<string, string | null> = {
    payload: canonicalPayload(record),
    estate_id,
  };
  if (isChainLinked(record)) {
    row['audit_hash'] = record.audit_hash;
    row['previous_audit_hash'] = record.previous_audit_hash ?? null;
    row['previous_audit_hash_key'] = previousHashKey(record);
  }
  return row;
}

/** Does this record carry the promoted audit-chain columns? */
export function isChainLinked(record: unknown): record is AuditEvent {
  return (
    typeof record === 'object' &&
    record !== null &&
    typeof (record as { audit_hash?: unknown }).audit_hash === 'string'
  );
}

export interface CallerControlledMismatch {
  column: string;
  existing: string;
  incoming: string;
}

/**
 * The first caller-controlled column on which two records differ, or `null`
 * when every one matches — i.e. when the two are the same durable write.
 *
 * The UNION of both key sets is compared, in `CALLER_CONTROLLED_COLUMNS` order
 * with any unexpected extra key appended, so a column present on one side and
 * absent on the other is a DIFFERENCE rather than an unchecked field. That is
 * what stops a chain-linked record from converging on a non-chain-linked row.
 */
export function firstCallerControlledMismatch(
  existing: CallerControlledRow,
  incoming: CallerControlledRow,
): CallerControlledMismatch | null {
  const present = new Set([...Object.keys(existing), ...Object.keys(incoming)]);
  const ordered = [
    ...CALLER_CONTROLLED_COLUMNS.filter((c) => present.has(c)),
    ...[...present].filter((c) => !(CALLER_CONTROLLED_COLUMNS as readonly string[]).includes(c)).sort(),
  ];
  for (const column of ordered) {
    const a = column in existing ? existing[column] : undefined;
    const b = column in incoming ? incoming[column] : undefined;
    if (a !== b) {
      return { column, existing: describeCell(a), incoming: describeCell(b) };
    }
  }
  return null;
}

export function describeCell(value: string | null | undefined): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '<absent>';
  return value;
}

/**
 * The store-assigned placement of one stored append-only row must be consistent
 * with the store's OWN invariants before that row may be certified as the
 * convergence target of an incoming write.
 *
 * This is the other half of the separation R2 establishes: placement is the
 * STORE's, so it is checked against the store's invariants rather than against
 * any caller claim. The invariants mirrored here are exactly the shipped ones:
 *
 *   * `CHECK (append_position >= 1)` — a positive safe integer;
 *   * `UNIQUE (estate_id, append_position)` — no two rows of one estate share a
 *     position;
 *   * the per-estate DENSE-PREFIX invariant asserted at load
 *     (`assertLoadedIntegrity` / `assertDensePositions`) and re-asserted before
 *     persist (`assertPrefixUnchanged`) — the estate's positions are exactly
 *     1..n, so the row at position k is the k-th append that estate received.
 *
 * A matched row whose stored placement violates any of them is REFUSED, never
 * served as a convergence target: certifying an incoming write against a row the
 * store cannot vouch for would launder a corrupt placement into a reported
 * success. Returns a reason string, or `null` when the placement is sound.
 */
export function storedPlacementViolation(
  scopedPositions: readonly number[],
  position: number,
): string | null {
  if (!Number.isSafeInteger(position) || position < 1) {
    return `stored append_position ${String(position)} is not a positive safe integer`;
  }
  const sorted = [...scopedPositions].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      return (
        `the estate's stored positions are not a dense 1..${sorted.length} prefix ` +
        `(position ${String(sorted[i])} found where ${i + 1} was required)`
      );
    }
  }
  if (position > sorted.length) {
    return `stored append_position ${position} lies outside the estate's dense prefix of ${sorted.length}`;
  }
  return null;
}
