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
