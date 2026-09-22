// Snapshot load + append-prefix verification, inside the host transaction.

import type { PoolClient } from 'pg';

import { AuditLog } from '../../audit.js';
import type { ID } from '../../types.js';
import { PostgresIntegrityError } from './errors.js';
import type { CanonicalState } from './canonical-state.js';
import { emptyCanonicalState } from './canonical-state.js';
import {
  decodeActor,
  decodeAssertion,
  decodeAuditEvent,
  decodeEstate,
  decodeKeyring,
  decodeRecallReceipt,
  decodeTransition,
  decodeTransitionReceipt,
  previousHashKey,
} from './rows.js';
import * as Q from './queries.js';
import { PostgresAdapterSession } from './session.js';

/** Row-count + max-position fingerprint of one estate's append-only tables. */
export interface AppendPrefixFingerprint {
  transitions: { count: number; max: number };
  transitionReceipts: { count: number; max: number };
  recallReceipts: { count: number; max: number };
  auditEvents: { count: number; max: number };
}

interface CountRow {
  row_count: string | number | null;
  max_position: string | number | null;
}

function toNumber(value: string | number | null): number {
  if (value === null) return 0;
  return typeof value === 'string' ? Number(value) : value;
}

/**
 * Load one estate's complete canonical state. Estate-scoped by construction:
 * the actor and keyring are resolved from the estate's own references, so no
 * other estate's rows can enter this snapshot.
 */
export async function loadEstateState(
  client: PoolClient,
  estate_id: ID,
): Promise<CanonicalState> {
  const state = emptyCanonicalState();

  const estateResult = await client.query<{ estate_id: string; payload: unknown }>(
    Q.SELECT_ESTATE,
    [estate_id],
  );
  const actorIds: string[] = [];
  const keyringIds: string[] = [];
  for (const row of estateResult.rows) {
    const estate = decodeEstate(row);
    state.estates.set(estate.estate_id, estate);
    actorIds.push(estate.actor_id);
    keyringIds.push(estate.keyring_id);
  }

  if (actorIds.length > 0) {
    const actors = await client.query<{ actor_id: string; payload: unknown }>(
      Q.SELECT_ACTORS_FOR_ESTATE,
      [actorIds],
    );
    for (const row of actors.rows) {
      const actor = decodeActor(row);
      state.actors.set(actor.actor_id, actor);
    }
  }
  if (keyringIds.length > 0) {
    const keyrings = await client.query<{ keyring_id: string; payload: unknown }>(
      Q.SELECT_KEYRINGS_FOR_ESTATE,
      [keyringIds],
    );
    for (const row of keyrings.rows) {
      const keyring = decodeKeyring(row);
      state.keyrings.set(keyring.keyring_id, keyring);
    }
  }

  const assertions = await client.query<{
    assertion_id: string;
    estate_id: string;
    payload: unknown;
  }>(Q.SELECT_ASSERTIONS, [estate_id]);
  for (const row of assertions.rows) {
    const assertion = decodeAssertion(row);
    state.assertions.set(assertion.assertion_id, assertion);
  }

  const transitions = await client.query(Q.SELECT_TRANSITIONS, [estate_id]);
  for (const row of transitions.rows) {
    state.transitions.push(decodeTransition(row));
  }

  const transitionReceipts = await client.query(Q.SELECT_TRANSITION_RECEIPTS, [estate_id]);
  for (const row of transitionReceipts.rows) {
    state.transitionReceipts.push(decodeTransitionReceipt(row));
  }

  const recallReceipts = await client.query(Q.SELECT_RECALL_RECEIPTS, [estate_id]);
  for (const row of recallReceipts.rows) {
    state.recallReceipts.push(decodeRecallReceipt(row));
  }

  const auditEvents = await client.query(Q.SELECT_AUDIT_EVENTS, [estate_id]);
  for (const row of auditEvents.rows) {
    state.auditEvents.push(decodeAuditEvent(row));
  }

  assertLoadedIntegrity(state, estate_id);
  return state;
}

/**
 * Every loaded snapshot must be internally coherent BEFORE a callback sees
 * it. A dense position sequence and an intact hash chain are both checked
 * here, so a tampered or partially restored database is refused at load
 * rather than served (P-3, P-4: a broken chain quarantines, never serves).
 */
export function assertLoadedIntegrity(state: CanonicalState, estate_id: ID): void {
  assertDensePositions('estate_transitions', state.transitions, estate_id);
  assertDensePositions('transition_receipts', state.transitionReceipts, estate_id);
  assertDensePositions('recall_receipts', state.recallReceipts, estate_id);
  assertDensePositions('audit_events', state.auditEvents, estate_id);
  assertChainIntact(state, estate_id);
}

function assertDensePositions<T>(
  table: string,
  rows: { estate_id: ID; append_position: number }[],
  estate_id: ID,
): void {
  const scoped = rows.filter((r) => r.estate_id === estate_id);
  for (let i = 0; i < scoped.length; i++) {
    const row = scoped[i];
    if (!row) continue;
    if (row.append_position !== i + 1) {
      throw new PostgresIntegrityError(
        'append_prefix_mutated',
        `${table} for estate ${estate_id} has a gap or duplicate: ` +
          `row ${i} carries append_position ${row.append_position}, expected ${i + 1}`,
      );
    }
  }
}

/**
 * Verify the per-estate audit chain with the EXISTING verifier
 * (`AuditLog.verifyChain`, `src/straylight/audit.ts:75`-`:88`) — not a
 * reimplementation. The verifier is the semantic authority; using it here is
 * what makes "the chain verifies identically after every move" a claim about
 * the same function, in the same terms, on every host (P-4).
 */
export function assertChainIntact(state: CanonicalState, estate_id: ID): void {
  const scoped = state.auditEvents.filter((r) => r.estate_id === estate_id);
  // The probe is a READ-ONLY verification session over this estate's chain, so
  // it is bound to the estate whose chain is being verified (R2: every session
  // is bound to exactly one estate).
  const probe = new PostgresAdapterSession(
    {
      ...emptyCanonicalState(),
      auditEvents: scoped,
    },
    estate_id,
  );
  const verdict = new AuditLog(probe).verifyChain(estate_id);
  probe.abandon();
  if (!verdict.ok) {
    throw new PostgresIntegrityError(
      'audit_chain_broken',
      `estate ${estate_id} audit chain fails AuditLog.verifyChain at index ` +
        `${verdict.broken_at}: ${verdict.reason}`,
    );
  }
  // A fork would place two events at the same chain position; the database
  // forbids it structurally, but a restored dump could carry one, so the
  // load path checks it too rather than trusting the constraint was present.
  const seen = new Set<string>();
  for (const row of scoped) {
    const key = previousHashKey(row.record);
    if (seen.has(key)) {
      throw new PostgresIntegrityError(
        'audit_chain_fork',
        `estate ${estate_id} has two audit events whose previous_audit_hash is ${key || '<genesis>'}`,
      );
    }
    seen.add(key);
  }
}

/** Fingerprint the append-only prefix so it can be re-checked before write. */
export async function fingerprintAppendPrefix(
  client: PoolClient,
  estate_id: ID,
): Promise<AppendPrefixFingerprint> {
  const [transitions, transitionReceipts, recallReceipts, auditEvents] = [
    await client.query<CountRow>(Q.COUNT_TRANSITIONS, [estate_id]),
    await client.query<CountRow>(Q.COUNT_TRANSITION_RECEIPTS, [estate_id]),
    await client.query<CountRow>(Q.COUNT_RECALL_RECEIPTS, [estate_id]),
    await client.query<CountRow>(Q.COUNT_AND_TAIL_AUDIT, [estate_id]),
  ];
  const read = (r: { rows: CountRow[] }): { count: number; max: number } => {
    const row = r.rows[0];
    return {
      count: toNumber(row?.row_count ?? 0),
      max: toNumber(row?.max_position ?? 0),
    };
  };
  return {
    transitions: read(transitions),
    transitionReceipts: read(transitionReceipts),
    recallReceipts: read(recallReceipts),
    auditEvents: read(auditEvents),
  };
}

export function fingerprintOf(state: CanonicalState, estate_id: ID): AppendPrefixFingerprint {
  const of = (rows: { estate_id: ID; append_position: number }[]) => {
    const scoped = rows.filter((r) => r.estate_id === estate_id);
    let max = 0;
    for (const row of scoped) if (row.append_position > max) max = row.append_position;
    return { count: scoped.length, max };
  };
  return {
    transitions: of(state.transitions),
    transitionReceipts: of(state.transitionReceipts),
    recallReceipts: of(state.recallReceipts),
    auditEvents: of(state.auditEvents),
  };
}

/**
 * The loaded prefix must still be the live prefix. Under the estate lock a
 * difference means the snapshot predates a committed writer, so appending
 * onto it would create a non-prefix history or a lost update — refuse.
 */
export function assertPrefixUnchanged(
  estate_id: ID,
  loaded: AppendPrefixFingerprint,
  live: AppendPrefixFingerprint,
): void {
  const tables: (keyof AppendPrefixFingerprint)[] = [
    'transitions',
    'transitionReceipts',
    'recallReceipts',
    'auditEvents',
  ];
  for (const table of tables) {
    const a = loaded[table];
    const b = live[table];
    if (a.count !== b.count || a.max !== b.max) {
      throw new PostgresIntegrityError(
        'append_prefix_mutated',
        `${table} for estate ${estate_id} changed under the session: ` +
          `loaded {count:${a.count},max:${a.max}} but live is {count:${b.count},max:${b.max}}`,
      );
    }
  }
}
