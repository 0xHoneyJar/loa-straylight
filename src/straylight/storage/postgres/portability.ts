// Portability — canonical-state comparison and restore verification.
//
// ADR-049Q §13.1(e), (i); P-4, P-6, P-7:
//   * export/restore uses ORDINARY PostgreSQL tooling (`pg_dump` /
//     `pg_restore`/`psql`), driven by the proof harness — this module adds no
//     bespoke serialization format, because a bespoke format would not prove
//     the ordinary path works;
//   * the restored store must be canonically EQUAL to the source and its
//     per-estate audit chains must verify IDENTICALLY;
//   * a restore that is short rows, carries a changed payload, or has a
//     broken chain is DETECTED and the estate is QUARANTINED — refused from
//     normal service rather than served (P-4).
//
// "Canonically equal" is byte equality of the canonical serialization of the
// complete, order-normalized store — not a spot check of counts.

import type { PoolClient } from 'pg';

import { AuditLog } from '../../audit.js';
import { sha256 } from '../../canonical.js';
import type { Hash, ID } from '../../types.js';
import { PostgresIntegrityError } from './errors.js';
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
} from './rows.js';
import { assertChainIntact } from './load.js';
import { PostgresAdapterSession } from './session.js';
import * as Q from './queries.js';

/**
 * The complete canonical content of a store, in a deterministic, host-
 * independent shape. Two stores holding the same estates produce identical
 * snapshots regardless of physical row order, page layout, or dump method.
 */
export interface StoreSnapshot {
  actors: unknown[];
  estates: unknown[];
  keyrings: unknown[];
  assertions: unknown[];
  transitions: { estate_id: ID; append_position: number; record: unknown }[];
  transitionReceipts: { estate_id: ID; append_position: number; record: unknown }[];
  recallReceipts: { estate_id: ID; append_position: number; record: unknown }[];
  auditEvents: { estate_id: ID; append_position: number; record: unknown }[];
}

export async function readStoreSnapshot(client: PoolClient): Promise<StoreSnapshot> {
  const actors = await client.query(Q.SELECT_ALL_ACTORS);
  const estates = await client.query(Q.SELECT_ALL_ESTATES);
  const keyrings = await client.query(Q.SELECT_ALL_KEYRINGS);
  const assertions = await client.query(Q.SELECT_ALL_ASSERTIONS);
  const transitions = await client.query(Q.SELECT_ALL_TRANSITIONS);
  const transitionReceipts = await client.query(Q.SELECT_ALL_TRANSITION_RECEIPTS);
  const recallReceipts = await client.query(Q.SELECT_ALL_RECALL_RECEIPTS);
  const auditEvents = await client.query(Q.SELECT_ALL_AUDIT_EVENTS);

  return {
    actors: actors.rows.map(decodeActor),
    estates: estates.rows.map(decodeEstate),
    keyrings: keyrings.rows.map(decodeKeyring),
    assertions: assertions.rows.map(decodeAssertion),
    transitions: transitions.rows.map(decodeTransition),
    transitionReceipts: transitionReceipts.rows.map(decodeTransitionReceipt),
    recallReceipts: recallReceipts.rows.map(decodeRecallReceipt),
    auditEvents: auditEvents.rows.map(decodeAuditEvent),
  };
}

/** Content digest of a whole store. Equal digests ⇒ canonically identical. */
export function snapshotDigest(snapshot: StoreSnapshot): Hash {
  return sha256(snapshot);
}

export interface SnapshotComparison {
  equal: boolean;
  sourceDigest: Hash;
  targetDigest: Hash;
  differences: string[];
}

export function compareSnapshots(
  source: StoreSnapshot,
  target: StoreSnapshot,
): SnapshotComparison {
  const differences: string[] = [];
  const keys: (keyof StoreSnapshot)[] = [
    'actors',
    'estates',
    'keyrings',
    'assertions',
    'transitions',
    'transitionReceipts',
    'recallReceipts',
    'auditEvents',
  ];
  for (const key of keys) {
    const a = sha256(source[key]);
    const b = sha256(target[key]);
    if (a !== b) {
      differences.push(
        `${key}: source has ${source[key].length} row(s) digest ${a}; ` +
          `target has ${target[key].length} row(s) digest ${b}`,
      );
    }
  }
  const sourceDigest = snapshotDigest(source);
  const targetDigest = snapshotDigest(target);
  return {
    equal: differences.length === 0 && sourceDigest === targetDigest,
    sourceDigest,
    targetDigest,
    differences,
  };
}

/** Per-estate audit-chain verdicts, using the existing verifier. */
export interface ChainVerification {
  estate_id: ID;
  ok: boolean;
  length: number;
  tail: Hash | undefined;
  detail?: string;
}

export function verifyChains(snapshot: StoreSnapshot): ChainVerification[] {
  const byEstate = new Map<ID, { estate_id: ID; append_position: number; record: unknown }[]>();
  for (const row of snapshot.auditEvents) {
    const bucket = byEstate.get(row.estate_id);
    if (bucket) bucket.push(row);
    else byEstate.set(row.estate_id, [row]);
  }
  const out: ChainVerification[] = [];
  for (const estate_id of [...byEstate.keys()].sort()) {
    const rows = byEstate.get(estate_id) ?? [];
    const state = {
      ...emptyCanonicalState(),
      auditEvents: rows.map((r) => ({
        estate_id: r.estate_id,
        append_position: r.append_position,
        record: r.record as never,
      })),
    };
    // Read-only chain verification for ONE estate: the probe session is bound to
    // exactly that estate (R2).
    const probe = new PostgresAdapterSession(state, estate_id);
    const verdict = new AuditLog(probe).verifyChain(estate_id);
    const tail = probe.getAuditTail(estate_id);
    probe.abandon();
    out.push(
      verdict.ok
        ? { estate_id, ok: true, length: rows.length, tail }
        : {
            estate_id,
            ok: false,
            length: rows.length,
            tail,
            detail: `broken at ${verdict.broken_at}: ${verdict.reason}`,
          },
    );
  }
  return out;
}

export interface RestoreVerification {
  ok: boolean;
  comparison: SnapshotComparison;
  chains: ChainVerification[];
  quarantinedEstates: ID[];
  reasons: string[];
}

/**
 * Verify a restored store against its source. The result is a QUARANTINE
 * decision, not advice: `ok: false` means the restored estates named in
 * `quarantinedEstates` must be refused from normal service. Callers that
 * want the fail-closed form call `assertRestoreServiceable` instead.
 */
export function verifyRestore(
  source: StoreSnapshot,
  target: StoreSnapshot,
): RestoreVerification {
  const comparison = compareSnapshots(source, target);
  const chains = verifyChains(target);
  const reasons: string[] = [];
  const quarantined = new Set<ID>();

  if (!comparison.equal) {
    reasons.push(`canonical state differs: ${comparison.differences.join(' | ')}`);
    // A canonical difference is a whole-store defect: every estate present in
    // either store is suspect, because a missing row is invisible in the
    // target alone.
    for (const row of source.estates) {
      const id = (row as { estate_id?: unknown }).estate_id;
      if (typeof id === 'string') quarantined.add(id);
    }
    for (const row of target.estates) {
      const id = (row as { estate_id?: unknown }).estate_id;
      if (typeof id === 'string') quarantined.add(id);
    }
  }
  for (const chain of chains) {
    if (!chain.ok) {
      reasons.push(`estate ${chain.estate_id} chain invalid: ${chain.detail ?? 'unknown'}`);
      quarantined.add(chain.estate_id);
    }
  }

  // The source's chains must also verify, or the comparison proves nothing.
  for (const chain of verifyChains(source)) {
    if (!chain.ok) {
      reasons.push(`source estate ${chain.estate_id} chain invalid: ${chain.detail ?? 'unknown'}`);
      quarantined.add(chain.estate_id);
    }
  }

  return {
    ok: reasons.length === 0,
    comparison,
    chains,
    quarantinedEstates: [...quarantined].sort(),
    reasons,
  };
}

/** Fail-closed form: throw unless the restored store is serviceable. */
export function assertRestoreServiceable(
  source: StoreSnapshot,
  target: StoreSnapshot,
): RestoreVerification {
  const verification = verifyRestore(source, target);
  if (!verification.ok) {
    throw new PostgresIntegrityError(
      'restore_verification_failed',
      `restored store is quarantined (estates: ${verification.quarantinedEstates.join(', ') || 'none identified'}): ` +
        verification.reasons.join(' | '),
    );
  }
  return verification;
}

/**
 * Gate a restored estate before normal service. Loads the estate and runs the
 * same load-time integrity assertions a session would, so a quarantined
 * estate cannot be served by going around `verifyRestore`.
 */
export function assertEstateServiceable(snapshot: StoreSnapshot, estate_id: ID): void {
  const state = {
    ...emptyCanonicalState(),
    auditEvents: snapshot.auditEvents
      .filter((r) => r.estate_id === estate_id)
      .map((r) => ({
        estate_id: r.estate_id,
        append_position: r.append_position,
        record: r.record as never,
      })),
  };
  assertChainIntact(state, estate_id);
}
