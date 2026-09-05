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

/** One authorized snapshot read: the section it fills and the statement it is. */
export interface CanonicalRead {
  /** Which `StoreSnapshot` section this read populates. */
  readonly section: keyof StoreSnapshot;
  /**
   * The intended canonical relation this read's SQL names, unqualified — the
   * object the read is BOUND to before it is issued (F-14). It is declared here,
   * beside the statement, so the object-binding check and the statement cannot
   * name different relations: both come from this one entry.
   */
  readonly relation: string;
  /** The exact statement text, as issued. */
  readonly sql: string;
}

/**
 * THE READ PLAN. Every statement `readStoreSnapshot` issues, and nothing else.
 *
 * ── WHY THE PLAN IS THE AUTHORITY (sequence-110 audit, F-14) ──────────────
 *
 * A consumer that must decide whether an observed statement was one of this
 * module's reads used to decide it by SHAPE — "a SELECT of bare columns from one
 * bare relation" — which authorized every relation that had ever existed or ever
 * would, including one with a trigger, a rule, or a side effect behind it. The
 * audit's counterexample was `SELECT actor_id FROM side_effect_view`: the shape
 * was right, the authority was absent, and it proved read-only.
 *
 * So the authority is not a shape and it is not a hand-maintained list beside
 * the code: it IS the plan below, published as `CANONICAL_SNAPSHOT_READS` by the
 * module that issues it, and `readStoreSnapshot` issues the plan by ITERATING it.
 * A statement can therefore be recognized only by membership, membership can
 * only be obtained by being in the plan, and being in the plan is the same thing
 * as being issued. There is no way to add an issued read that the authority does
 * not know about, and none to authorize a statement that is never issued.
 *
 * `compareSnapshots` walks the same plan for its section list, so a plan entry
 * cannot be read and then silently left out of the comparison either.
 */
const SNAPSHOT_READ_PLAN = [
  { section: 'actors', relation: 'actors', sql: Q.SELECT_ALL_ACTORS, decode: decodeActor },
  { section: 'estates', relation: 'actor_estates', sql: Q.SELECT_ALL_ESTATES, decode: decodeEstate },
  { section: 'keyrings', relation: 'keyrings', sql: Q.SELECT_ALL_KEYRINGS, decode: decodeKeyring },
  {
    section: 'assertions',
    relation: 'estate_assertions',
    sql: Q.SELECT_ALL_ASSERTIONS,
    decode: decodeAssertion,
  },
  {
    section: 'transitions',
    relation: 'estate_transitions',
    sql: Q.SELECT_ALL_TRANSITIONS,
    decode: decodeTransition,
  },
  {
    section: 'transitionReceipts',
    relation: 'transition_receipts',
    sql: Q.SELECT_ALL_TRANSITION_RECEIPTS,
    decode: decodeTransitionReceipt,
  },
  {
    section: 'recallReceipts',
    relation: 'recall_receipts',
    sql: Q.SELECT_ALL_RECALL_RECEIPTS,
    decode: decodeRecallReceipt,
  },
  {
    section: 'auditEvents',
    relation: 'audit_events',
    sql: Q.SELECT_ALL_AUDIT_EVENTS,
    decode: decodeAuditEvent,
  },
] as const satisfies readonly {
  section: keyof StoreSnapshot;
  relation: string;
  sql: string;
  decode: (row: never) => unknown;
}[];

/**
 * THE CLOSED AUTHORITATIVE SET of reads this module issues, in issue order.
 *
 * Published for consumers that must decide what a statement they OBSERVED was
 * authorized to be. A consumer compares against these entries; it does not
 * restate them, and it does not describe them.
 */
export const CANONICAL_SNAPSHOT_READS: readonly CanonicalRead[] = Object.freeze(
  SNAPSHOT_READ_PLAN.map((step) =>
    Object.freeze({ section: step.section, relation: step.relation, sql: step.sql }),
  ),
);

/**
 * The one text normalization the authority applies, published with it.
 *
 * The statements are written as indented template literals, so the text that
 * reaches the driver carries the newlines and indentation of this source file.
 * Collapsing runs of whitespace to one space and trimming is the whole of it:
 * nothing is case-folded, nothing is re-spelled, no token is reordered, and no
 * comment or literal is stripped. A consumer normalizes THROUGH THIS FUNCTION so
 * that what it compares and what this module issues cannot be normalized
 * differently.
 */
export function canonicalReadText(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

/** Membership, by exact normalized text. Built once from the plan. */
const AUTHORIZED_READ_TEXT = new Map<string, CanonicalRead>(
  CANONICAL_SNAPSHOT_READS.map((read) => [canonicalReadText(read.sql), read]),
);

/**
 * Is this statement one of the authorized canonical snapshot reads?
 *
 * Returns the authorizing entry, or `null`. `null` for EVERYTHING else, with no
 * exception and no shape allowance: an unknown relation, an unknown operation, a
 * statement that merely resembles a read, a second statement after a `;`, and a
 * read of a real table this module does not read are all unauthorized, because
 * authority here means "this module issues exactly this statement" and nothing
 * weaker.
 */
export function recognizeCanonicalRead(sql: string): CanonicalRead | null {
  return AUTHORIZED_READ_TEXT.get(canonicalReadText(sql)) ?? null;
}

// ── DB-OBJECT BINDING (sequence-116 audit, F-14) ──────────────────────────
//
// Recognizing a statement as one this module ISSUES proved it was one of ours;
// it did NOT prove that the bare relation name in it resolves to the object we
// mean. The canonical reads name relations UNQUALIFIED (`FROM actors`), and an
// unqualified name resolves through the SESSION's `search_path` — so a caller
// whose search_path puts a schema of their own first could make `FROM actors`
// resolve to THEIR `actors`: a view with an `ON SELECT` rule, a foreign table, a
// matview, or a base table in another schema holding other data. `BEGIN
// TRANSACTION READ ONLY` refuses ordinary DML/DDL, but it does not make an
// arbitrary relation's READ side-effect-free, and it does not prove the object
// read is the migrated one. That is the F-14 gap: the SQL was authorized, the
// OBJECT it resolves to was not.
//
// The binding below closes it WITHOUT a search_path change (no `SET`, which the
// verifier must not need) and WITHOUT parsing SQL. It resolves each canonical
// name through PostgreSQL's own name resolution, in the SAME session the reads
// run in, and refuses unless every canonical relation is:
//
//   * RESOLVED — a bare name that resolves to nothing is a dropped, renamed or
//     never-migrated object, and fails closed;
//   * a BASE TABLE (relkind 'r') — a base table can carry no `ON SELECT` rule and
//     its triggers do not fire on `SELECT`, so reading it is provably
//     side-effect-free; a view / matview / foreign table / partitioned parent
//     planted under a canonical name is not, and is refused;
//   * in the migration ledger's own NAMESPACE and OWNER — the ledger
//     (`straylight_schema_migrations`) is created by `migrate.ts` on the
//     initialization path together with every canonical table, so "lives where
//     the ledger lives, owned by whoever owns the ledger" is a migration-identity
//     invariant. A same-named base table planted in another schema, or owned by
//     another role, does not satisfy it.
//
// The binding read itself is fully schema-qualified to `pg_catalog`, so the
// caller's search_path cannot redirect the binding — only the objects it
// REPORTS ON. It is a catalog read, side-effect-free by the same relkind
// argument applied to `pg_catalog.pg_class`/`pg_catalog.pg_namespace`.

/**
 * The migration ledger relation — the TRUSTED ANCHOR for object binding.
 *
 * `migrate.ts` creates exactly this table on the initialization path, in the
 * same schema as every canonical table, so its object identity (namespace,
 * owner, kind) is the identity the canonical relations must share. Binding to it
 * is binding to "the schema the migrations actually built".
 */
export const CANONICAL_LEDGER_RELATION = 'straylight_schema_migrations';

/**
 * Every relation the binding must resolve, in order: the eight canonical
 * snapshot relations (from the plan, so a read cannot exist unbound), then the
 * migration-ledger anchor. Published so a consumer proves the binding over the
 * SAME list this module resolves.
 */
export const CANONICAL_BINDING_RELATIONS: readonly string[] = Object.freeze([
  ...SNAPSHOT_READ_PLAN.map((step) => step.relation),
  CANONICAL_LEDGER_RELATION,
]);

/**
 * THE OBJECT-BINDING READ. For each requested bare relation name it reports what
 * the CURRENT session's name resolution makes of it: whether it resolves, its
 * `relkind`, its owning role, and its namespace. Every identifier here is
 * schema-qualified to `pg_catalog` — `unnest`, `to_regclass`, `pg_class`,
 * `pg_namespace` — so the caller's search_path cannot redirect the binding read;
 * `to_regclass(req.relname)` resolves each bare name EXACTLY as the snapshot read
 * `FROM <relname>` will, so what this reports is what those reads will hit.
 *
 * Parameterized (`$1::text[]`): no relation name is interpolated into the text,
 * and the text is CONSTANT, so it is recognized by exact membership like the
 * snapshot reads. It contains no `SET`, no `ROLE`, no `GRANT` and no session
 * characteristic — it changes nothing, it only reports.
 */
export const CANONICAL_OBJECT_BINDING_READ = `
  SELECT
    req.ord            AS ord,
    req.relname        AS requested,
    (c.oid IS NOT NULL) AS resolved,
    c.relkind          AS relkind,
    c.relowner         AS relowner,
    c.relnamespace     AS relnamespace,
    n.nspname          AS namespace
  FROM pg_catalog.unnest($1::text[]) WITH ORDINALITY AS req(relname, ord)
  LEFT JOIN pg_catalog.pg_class AS c
    ON c.oid = pg_catalog.to_regclass(req.relname)
  LEFT JOIN pg_catalog.pg_namespace AS n
    ON n.oid = c.relnamespace
  ORDER BY req.ord ASC
`;

/**
 * One row of the object-binding read: what the session's name resolution makes
 * of one requested relation. Every field is a catalog FACT, not a caller claim.
 */
export interface CanonicalObjectRow {
  /** The bare relation name that was asked about. */
  readonly requested: string;
  /** Did the bare name resolve to any relation under the current session? */
  readonly resolved: boolean;
  /** `pg_class.relkind` of the resolved relation, or `null` when unresolved. */
  readonly relkind: string | null;
  /** `pg_class.relowner` (an oid), or `null` when unresolved. */
  readonly relowner: string | number | null;
  /** `pg_class.relnamespace` (an oid), or `null` when unresolved. */
  readonly relnamespace: string | number | null;
  /** `pg_namespace.nspname` of the resolved relation, or `null` when unresolved. */
  readonly namespace: string | null;
}

/** The object-binding verdict. `bound` is the whole gate; reasons name failures. */
export interface ObjectBindingVerdict {
  /** True only when EVERY canonical relation binds to a trusted base table. */
  readonly bound: boolean;
  /** One entry per failed check, relation order. Empty exactly when `bound`. */
  readonly reasons: readonly string[];
  /** The ledger's namespace name, for the report; `null` if the ledger is absent. */
  readonly ledgerNamespace: string | null;
}

/**
 * Decide, from the binding read's rows, whether the exact canonical SQL will
 * resolve to the TRUSTED canonical objects. PURE over catalog facts, so the
 * decision is provable without a database (F-14).
 *
 * The migration ledger is the anchor: it must itself resolve to a base table,
 * and every canonical relation must resolve to a base table in the ledger's
 * namespace and owned by the ledger's owner. Anything else — unresolved, a
 * non-table object, a different schema, a different owner, a duplicate or a
 * missing row — is fail-closed. There is NO SQL-text inspection: the decision is
 * over object identity PostgreSQL's own resolver reported, never over a string's
 * shape.
 */
export function evaluateObjectBinding(
  rows: readonly CanonicalObjectRow[],
  expected: readonly string[] = CANONICAL_BINDING_RELATIONS,
): ObjectBindingVerdict {
  const byName = new Map<string, CanonicalObjectRow>();
  for (const row of rows) {
    if (byName.has(row.requested)) {
      // Cannot happen through the published read (`to_regclass` resolves one oid
      // per name), so a duplicate means the rows are not what was asked for.
      return {
        bound: false,
        reasons: [`relation ${row.requested}: the binding read returned more than one row for it`],
        ledgerNamespace: null,
      };
    }
    byName.set(row.requested, row);
  }

  const ledger = byName.get(CANONICAL_LEDGER_RELATION);
  if (ledger === undefined || !ledger.resolved || ledger.relkind !== 'r') {
    return {
      bound: false,
      reasons: [
        `migration ledger ${CANONICAL_LEDGER_RELATION}: a resolved base table (relkind 'r') is the ` +
          'trusted anchor for object binding, and it is absent or substituted',
      ],
      ledgerNamespace: ledger?.resolved ? ledger.namespace : null,
    };
  }
  const ledgerNs = String(ledger.relnamespace);
  const ledgerOwner = String(ledger.relowner);

  const reasons: string[] = [];
  for (const name of expected) {
    if (name === CANONICAL_LEDGER_RELATION) continue;
    const row = byName.get(name);
    if (row === undefined) {
      reasons.push(`relation ${name}: the binding read returned no row for it`);
      continue;
    }
    if (!row.resolved) {
      reasons.push(
        `relation ${name}: the bare name did not resolve to any object under the current session`,
      );
      continue;
    }
    if (row.relkind !== 'r') {
      reasons.push(
        `relation ${name}: resolved to relkind ${JSON.stringify(row.relkind)}, not a base table ('r'); ` +
          "a view, matview, foreign table or partitioned parent under a canonical name can carry " +
          'read-time side effects and is refused',
      );
      continue;
    }
    if (String(row.relnamespace) !== ledgerNs) {
      reasons.push(
        `relation ${name}: resolved in namespace ${JSON.stringify(row.namespace)}, outside the ` +
          `migration ledger's schema ${JSON.stringify(ledger.namespace)}; a canonical name planted in ` +
          'another schema is refused',
      );
      continue;
    }
    if (String(row.relowner) !== ledgerOwner) {
      reasons.push(
        `relation ${name}: owned by a different role than the migration ledger; a canonical name owned ` +
          'outside the ledger owner is refused',
      );
      continue;
    }
  }

  return { bound: reasons.length === 0, reasons, ledgerNamespace: ledger.namespace };
}

/**
 * Issue the object-binding read on `client` and decide the binding.
 *
 * Issued through the SAME client the snapshot reads use, so it observes the SAME
 * name resolution they will, and — when that client is the verifier's observed
 * one — it is recorded and must be recognized like any other statement (see
 * `recognizeCanonicalBindingRead`). This module both PUBLISHES and ISSUES the
 * binding read, so its authority and its execution cannot drift apart, exactly
 * as with the snapshot reads.
 */
export async function bindCanonicalObjects(client: PoolClient): Promise<ObjectBindingVerdict> {
  const result = await client.query(CANONICAL_OBJECT_BINDING_READ, [[...CANONICAL_BINDING_RELATIONS]]);
  return evaluateObjectBinding(result.rows as CanonicalObjectRow[]);
}

/**
 * Is this statement the canonical object-binding read? True only for the exact
 * published text (after the one whitespace normalization `canonicalReadText`
 * applies), so a consumer that OBSERVED it recognizes it by the same membership
 * rule the snapshot reads use — not by resembling a catalog query.
 */
export function recognizeCanonicalBindingRead(sql: string): boolean {
  return canonicalReadText(sql) === canonicalReadText(CANONICAL_OBJECT_BINDING_READ);
}

export async function readStoreSnapshot(client: PoolClient): Promise<StoreSnapshot> {
  const sections = new Map<keyof StoreSnapshot, unknown[]>();
  // ISSUES THE PLAN, so the published authority and the statements that actually
  // reach the driver are the same data and cannot drift apart.
  for (const step of SNAPSHOT_READ_PLAN) {
    const result = await client.query(step.sql);
    sections.set(step.section, result.rows.map(step.decode as (row: unknown) => unknown));
  }
  const take = (section: keyof StoreSnapshot): unknown[] => {
    const rows = sections.get(section);
    if (rows === undefined) {
      // Unreachable while the plan covers every section — and a fail-closed
      // refusal rather than an empty section if it ever stops covering one,
      // because "no rows" and "never read" must not look alike to a comparison.
      throw new PostgresIntegrityError(
        'restore_verification_failed',
        `snapshot section ${section} was not read: the canonical read plan does not cover it`,
      );
    }
    return rows;
  };

  return {
    actors: take('actors'),
    estates: take('estates'),
    keyrings: take('keyrings'),
    assertions: take('assertions'),
    transitions: take('transitions') as StoreSnapshot['transitions'],
    transitionReceipts: take('transitionReceipts') as StoreSnapshot['transitionReceipts'],
    recallReceipts: take('recallReceipts') as StoreSnapshot['recallReceipts'],
    auditEvents: take('auditEvents') as StoreSnapshot['auditEvents'],
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
  // The sections compared are the sections READ — derived from the same plan, not
  // a second list beside it, so a read cannot be added and left uncompared.
  const keys: readonly (keyof StoreSnapshot)[] = CANONICAL_SNAPSHOT_READS.map(
    (read) => read.section,
  );
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
