// PostgresAdapterSession — a transaction-scoped, SYNCHRONOUS
// StorageAdapter over a loaded CanonicalState snapshot.
//
// This class implements the EXISTING, UNCHANGED `StorageAdapter` interface
// (`src/straylight/storage/types.ts:33`) with no signature change, no added
// method, and no async member. EstateStore, AuditLog, executeRecall, and the
// existing conformance scenarios consume it exactly as they consume
// InMemoryStorage — that is the whole point of the seam (ADR-022D; P-3).
//
// It performs NO network I/O. Every read is served from the snapshot the
// async host loaded before the callback started; every write mutates the
// snapshot and records an entry in the delta. Persistence happens once,
// after the callback returns, inside the host's still-open transaction.
// So:
//
//   * there is no fake synchronous network I/O — there is no I/O at all;
//   * there are no fire-and-forget writes — writes are delta entries, and
//     the host commits them or the transaction rolls back;
//   * success is never reported before durable commit — this class reports
//     nothing; the host returns after COMMIT.
//
// Append positions are assigned here so the session can hold the invariant
// locally, but they continue the loaded prefix and are re-verified against
// the database by the host before persisting.

import type {
  Actor,
  ActorEstate,
  Assertion,
  AuditEvent,
  EstateTransition,
  Hash,
  ID,
  Keyring,
  RecallReceipt,
  TransitionReceipt,
} from '../../types.js';
import type { StorageAdapter } from '../types.js';
import { PostgresIntegrityError, PostgresUnavailableError } from './errors.js';
import type { CanonicalDelta, CanonicalState, Positioned } from './canonical-state.js';
import { canonicalPayload, previousHashKey } from './rows.js';

export class PostgresAdapterSession implements StorageAdapter {
  private readonly state: CanonicalState;

  // Loaded-prefix boundaries. Everything at or beyond these indices was
  // appended by THIS session and is what the delta carries.
  private readonly loadedTransitions: number;
  private readonly loadedTransitionReceipts: number;
  private readonly loadedRecallReceipts: number;
  private readonly loadedAuditEvents: number;

  // Upsert ids this session wrote. Values come from the snapshot maps at
  // close time, so a key written twice persists once, at its final value.
  private readonly touchedActors = new Set<ID>();
  private readonly touchedEstates = new Set<ID>();
  private readonly touchedKeyrings = new Set<ID>();
  private readonly touchedAssertions = new Set<ID>();

  // Per-estate next append position, seeded from the loaded snapshot.
  private readonly nextTransitionPos = new Map<ID, number>();
  private readonly nextTransitionReceiptPos = new Map<ID, number>();
  private readonly nextRecallReceiptPos = new Map<ID, number>();
  private readonly nextAuditPos = new Map<ID, number>();

  // Per-estate APPEND ORDINAL of the offers this session has made, counted
  // from 1 and INDEPENDENT of where a fresh row lands. This is the position a
  // given append CLAIMS to occupy (see `offerPosition`), and it is what the
  // complete-durable-row comparison checks against the existing row's promoted
  // `append_position`. Kept separate from the counters above because those are
  // seeded from the loaded prefix (loaded max + 1) and answer a different
  // question: where the NEXT FRESH row is stored.
  private readonly offeredTransitionPos = new Map<ID, number>();
  private readonly offeredTransitionReceiptPos = new Map<ID, number>();
  private readonly offeredRecallReceiptPos = new Map<ID, number>();
  private readonly offeredAuditPos = new Map<ID, number>();

  // Append writes recognized as already-durable-and-identical. Reported in
  // the delta so a retry's idempotency is an OBSERVABLE fact, not a silent
  // absence of work that looks the same as "the callback did nothing".
  private idempotentSkips = 0;

  private closed = false;

  constructor(state: CanonicalState) {
    this.state = state;
    this.loadedTransitions = state.transitions.length;
    this.loadedTransitionReceipts = state.transitionReceipts.length;
    this.loadedRecallReceipts = state.recallReceipts.length;
    this.loadedAuditEvents = state.auditEvents.length;
    seedPositions(state.transitions, this.nextTransitionPos);
    seedPositions(state.transitionReceipts, this.nextTransitionReceiptPos);
    seedPositions(state.recallReceipts, this.nextRecallReceiptPos);
    seedPositions(state.auditEvents, this.nextAuditPos);
  }

  // ── actors ────────────────────────────────────────────────────────────
  upsertActor(a: Actor): void {
    this.assertOpen();
    this.state.actors.set(a.actor_id, a);
    this.touchedActors.add(a.actor_id);
  }
  getActor(id: ID): Actor | undefined {
    this.assertOpen();
    return this.state.actors.get(id);
  }

  // ── estates ───────────────────────────────────────────────────────────
  upsertEstate(e: ActorEstate): void {
    this.assertOpen();
    this.state.estates.set(e.estate_id, e);
    this.touchedEstates.add(e.estate_id);
  }
  getEstate(id: ID): ActorEstate | undefined {
    this.assertOpen();
    return this.state.estates.get(id);
  }

  // ── keyrings ──────────────────────────────────────────────────────────
  upsertKeyring(k: Keyring): void {
    this.assertOpen();
    this.state.keyrings.set(k.keyring_id, k);
    this.touchedKeyrings.add(k.keyring_id);
  }
  getKeyring(id: ID): Keyring | undefined {
    this.assertOpen();
    return this.state.keyrings.get(id);
  }

  // ── assertions ────────────────────────────────────────────────────────
  upsertAssertion(a: Assertion): void {
    this.assertOpen();
    this.state.assertions.set(a.assertion_id, a);
    this.touchedAssertions.add(a.assertion_id);
  }
  getAssertion(id: ID): Assertion | undefined {
    this.assertOpen();
    return this.state.assertions.get(id);
  }
  listAssertions(estate_id: ID): Assertion[] {
    this.assertOpen();
    const out: Assertion[] = [];
    for (const a of this.state.assertions.values()) {
      if (a.estate_id === estate_id) out.push(a);
    }
    return out;
  }

  // ── transitions (append-only) ─────────────────────────────────────────
  appendTransition(t: EstateTransition): void {
    this.assertOpen();
    if (
      this.classifyExistingAppend(
        'estate_transitions',
        this.state.transitions,
        (r) => r.transition_id,
        t.transition_id,
        t,
        t.estate_id,
        this.offerPosition(this.offeredTransitionPos, t.estate_id),
      ) === 'idempotent'
    ) {
      return;
    }
    this.state.transitions.push({
      estate_id: t.estate_id,
      append_position: this.claimPosition(this.nextTransitionPos, t.estate_id),
      record: t,
    });
  }
  listTransitions(estate_id: ID): EstateTransition[] {
    this.assertOpen();
    return recordsFor(this.state.transitions, estate_id);
  }

  // ── recall receipts (append-only) ─────────────────────────────────────
  upsertRecallReceipt(r: RecallReceipt): void {
    this.assertOpen();
    if (
      this.classifyExistingAppend(
        'recall_receipts',
        this.state.recallReceipts,
        (row) => row.receipt_id,
        r.receipt_id,
        r,
        r.estate_id,
        this.offerPosition(this.offeredRecallReceiptPos, r.estate_id),
      ) === 'idempotent'
    ) {
      return;
    }
    this.state.recallReceipts.push({
      estate_id: r.estate_id,
      append_position: this.claimPosition(this.nextRecallReceiptPos, r.estate_id),
      record: r,
    });
  }
  getRecallReceipt(id: ID): RecallReceipt | undefined {
    this.assertOpen();
    // Append-only: at most one row can carry a given receipt_id, so "the
    // last match" and "the only match" coincide. Scanning from the end is
    // the cheaper of the two identical answers.
    for (let i = this.state.recallReceipts.length - 1; i >= 0; i--) {
      const row = this.state.recallReceipts[i];
      if (row && row.record.receipt_id === id) return row.record;
    }
    return undefined;
  }

  // ── transition receipts (append-only) ─────────────────────────────────
  upsertTransitionReceipt(r: TransitionReceipt): void {
    this.assertOpen();
    if (
      this.classifyExistingAppend(
        'transition_receipts',
        this.state.transitionReceipts,
        (row) => row.receipt_id,
        r.receipt_id,
        r,
        r.estate_id,
        this.offerPosition(this.offeredTransitionReceiptPos, r.estate_id),
      ) === 'idempotent'
    ) {
      return;
    }
    this.state.transitionReceipts.push({
      estate_id: r.estate_id,
      append_position: this.claimPosition(this.nextTransitionReceiptPos, r.estate_id),
      record: r,
    });
  }
  getTransitionReceipt(id: ID): TransitionReceipt | undefined {
    this.assertOpen();
    for (let i = this.state.transitionReceipts.length - 1; i >= 0; i--) {
      const row = this.state.transitionReceipts[i];
      if (row && row.record.receipt_id === id) return row.record;
    }
    return undefined;
  }
  listTransitionReceipts(estate_id: ID): TransitionReceipt[] {
    this.assertOpen();
    return recordsFor(this.state.transitionReceipts, estate_id);
  }

  // ── audit events (append-only, hash-chained per estate) ───────────────
  appendAuditEvent(e: AuditEvent): void {
    this.assertOpen();
    // An identical retry re-derives the same content-addressed
    // `audit_event_id` AND the same `previous_audit_hash`, because the hash is
    // computed from the tail the retry read. That event is already durable at
    // its own chain position, so it converges on the existing link — and the
    // tail check below must NOT run for it: the retry's declared parent is the
    // predecessor of the existing row, not the current tail.
    if (
      this.classifyExistingAppend(
        'audit_events',
        this.state.auditEvents,
        (row) => row.audit_event_id,
        e.audit_event_id,
        e,
        e.estate_id,
        this.offerPosition(this.offeredAuditPos, e.estate_id),
      ) === 'idempotent'
    ) {
      return;
    }
    // A genuine append must attach to THIS estate's current tail. A caller
    // that hands us a link pointing elsewhere is not silently accepted —
    // that would be exactly the silent-repair P-3 forbids.
    const tail = this.getAuditTail(e.estate_id);
    if (e.previous_audit_hash !== tail) {
      throw new PostgresIntegrityError(
        'audit_chain_broken',
        `audit event ${e.audit_event_id} declares previous_audit_hash ` +
          `${String(e.previous_audit_hash)} but estate ${e.estate_id} tail is ${String(tail)}`,
      );
    }
    this.state.auditEvents.push({
      estate_id: e.estate_id,
      append_position: this.claimPosition(this.nextAuditPos, e.estate_id),
      record: e,
    });
  }
  listAuditEvents(estate_id?: ID): AuditEvent[] {
    this.assertOpen();
    if (estate_id === undefined) {
      return this.state.auditEvents.map((row) => row.record);
    }
    return recordsFor(this.state.auditEvents, estate_id);
  }
  getAuditTail(estate_id: ID): Hash | undefined {
    this.assertOpen();
    for (let i = this.state.auditEvents.length - 1; i >= 0; i--) {
      const row = this.state.auditEvents[i];
      if (row && row.estate_id === estate_id) return row.record.audit_hash;
    }
    return undefined;
  }

  // ── session lifecycle (host-facing; not part of StorageAdapter) ───────

  /**
   * Close the session and compute its deterministic delta. Called by the
   * async host after the bounded callback returns and before persisting.
   * Once closed, every adapter method throws — a callback that squirreled
   * the session away cannot write after the transaction is decided.
   */
  close(): CanonicalDelta {
    this.assertOpen();
    this.closed = true;
    return {
      actors: collect(this.touchedActors, this.state.actors),
      estates: collect(this.touchedEstates, this.state.estates),
      keyrings: collect(this.touchedKeyrings, this.state.keyrings),
      assertions: collect(this.touchedAssertions, this.state.assertions),
      transitions: this.state.transitions.slice(this.loadedTransitions),
      transitionReceipts: this.state.transitionReceipts.slice(this.loadedTransitionReceipts),
      recallReceipts: this.state.recallReceipts.slice(this.loadedRecallReceipts),
      auditEvents: this.state.auditEvents.slice(this.loadedAuditEvents),
      idempotentSkips: this.idempotentSkips,
    };
  }

  /** Abandon the session without producing a delta (callback threw). */
  abandon(): void {
    this.closed = true;
  }

  // ── internals ─────────────────────────────────────────────────────────

  private assertOpen(): void {
    if (this.closed) {
      throw new PostgresUnavailableError(
        'session_closed',
        'the adapter session is closed; its transaction has already been decided',
      );
    }
  }

  private claimPosition(counters: Map<ID, number>, estate_id: ID): number {
    const next = counters.get(estate_id) ?? 1;
    counters.set(estate_id, next + 1);
    return next;
  }

  /**
   * The append POSITION this call offers for `estate_id`, consumed from this
   * session's per-estate append ordinal.
   *
   * The store's dense-position invariant (`assertLoadedIntegrity`) means the
   * row at position k is the k-th append that estate ever received. So the
   * k-th append a session offers for an estate is a claim about placement: "this
   * record is the k-th". That claim is exactly what makes `append_position`
   * comparable for a write whose record carries no position of its own, and it
   * is the promoted column the previous payload-only comparison was blind to.
   *
   * A faithful retry re-offers the same records in the same order, so its k-th
   * offer meets the durable row at position k and converges. A partial or
   * reordered replay — Codex's dense-prefix case, where the target id/payload
   * sits at position 2 but is offered first — meets a row at a DIFFERENT
   * position and is refused as conflicting immutable reuse.
   *
   * The ordinal advances on EVERY classified append, converging or fresh:
   * skipping it for a convergence would renumber every later offer in the
   * session and turn one partial replay into a cascade of false matches.
   * `claimPosition` remains the authority for what a FRESH row is actually
   * stored at (loaded max + 1), so density is unaffected by this counter.
   */
  private offerPosition(counters: Map<ID, number>, estate_id: ID): number {
    const next = counters.get(estate_id) ?? 1;
    counters.set(estate_id, next + 1);
    return next;
  }

  /**
   * Classify an append whose immutable id may already be present in this
   * session's view.
   *
   *   'fresh'      the id is unseen — append it.
   *   'idempotent' the id is present as the SAME COMPLETE DURABLE ROW as the
   *                one this write would produce. The row is already durable
   *                exactly as offered, so the write converges on it: no second
   *                position is taken and no duplicate is created
   *                (ADR-049Q §13.1(g)).
   *
   * Any other presence of the id raises `immutable_id_conflict`: the immutable
   * id is being reused for a DIFFERENT durable row, which is an integrity
   * violation, never an update (P-3).
   *
   * COMPLETE-ROW EQUALITY, not payload equality. This is the recorded lesson
   * of this method. Comparing only `canonicalPayload` made a row idempotent
   * whenever its id and payload matched, while the classifier was BLIND to the
   * promoted columns the row is actually stored under — most importantly the
   * `append_position` this call would have claimed. A dense prefix holding the
   * target id/payload at position 2 (a filler occupying position 1) therefore
   * reported `committed: true` with `{inserted: 0, idempotent: 1}` for a write
   * whose own position would have been different: convergence was claimed on a
   * row that is not the row the caller offered.
   *
   * The comparison basis is `durableRowOf` — the same complete-row set
   * `persist.ts` compares against the live database row (immutable identity,
   * promoted estate identity, promoted append position, and for audit events
   * the audit hash, the previous audit hash, and the normalized
   * previous-parent key, plus the canonical payload). The two classifiers now
   * agree on WHAT makes two rows the same row; the only difference is which
   * rows they can see. `tests/phase-50a/postgres-callback-and-row-idempotency.test.ts`
   * pins that agreement structurally so the two cannot drift apart.
   *
   * `offeredPosition` is the position this append WOULD claim — computed
   * without consuming it (`peekPosition`), because a converging retry must not
   * burn a position. It is part of the comparison rather than an afterthought:
   * a same-payload row at a different position is a different durable row.
   *
   * This covers the case where the retried record is in the LOADED PREFIX
   * (the ordinary retry) as well as one appended earlier in the same session.
   * The complementary case — a row committed by another transaction between
   * this session's load and its write — is classified against the live row in
   * `persist.ts`, because only the database can see it.
   */
  private classifyExistingAppend<T>(
    table: string,
    rows: Positioned<T>[],
    idOf: (record: T) => ID,
    id: ID,
    incoming: T,
    estate_id: ID,
    offeredPosition: number,
  ): 'fresh' | 'idempotent' {
    for (const row of rows) {
      if (idOf(row.record) !== id) continue;
      const existing = durableRowOf(row.estate_id, row.append_position, row.record);
      const offered = durableRowOf(estate_id, offeredPosition, incoming);
      const mismatch = firstDurableMismatch(existing, offered);
      if (mismatch === null) {
        this.idempotentSkips += 1;
        return 'idempotent';
      }
      throw new PostgresIntegrityError(
        'immutable_id_conflict',
        `${table}: immutable id ${id} is already present as a different durable row ` +
          `(${mismatch.column}: existing ${mismatch.existing} != incoming ${mismatch.incoming})`,
      );
    }
    return 'fresh';
  }
}

/**
 * The complete durable row one append-only record occupies, keyed by column.
 *
 * Deliberately the SAME column set `persist.ts#durableColumns` binds to its
 * INSERT — identity is carried inside `payload` (the canonical serialization
 * contains the record's own id field), the placement columns are promoted
 * explicitly, and audit events additionally promote their chain columns. Two
 * records are the same durable row exactly when every entry matches.
 *
 * `previous_audit_hash` and `previous_audit_hash_key` are BOTH included: they
 * are distinct enforcement columns in the schema (the nullable parent link and
 * its normalized, uniqueness-bearing key), and `''` must never be conflated
 * with `NULL`.
 */
type DurableRow = Readonly<Record<string, string | number | null>>;

function durableRowOf(estate_id: ID, append_position: number, record: unknown): DurableRow {
  const row: Record<string, string | number | null> = {
    estate_id,
    append_position,
    payload: canonicalPayload(record),
  };
  // Audit events promote their chain linkage. Detected structurally rather
  // than by table name so the comparison cannot be weakened by a caller
  // passing a different label.
  if (isChainLinked(record)) {
    row['audit_hash'] = record.audit_hash;
    row['previous_audit_hash'] = record.previous_audit_hash ?? null;
    row['previous_audit_hash_key'] = previousHashKey(record);
  }
  return row;
}

/** Does this record carry the promoted audit-chain columns? */
function isChainLinked(record: unknown): record is AuditEvent {
  return (
    typeof record === 'object' &&
    record !== null &&
    typeof (record as { audit_hash?: unknown }).audit_hash === 'string'
  );
}

/**
 * The first column on which two durable rows differ, or `null` when they are
 * the same row. Compares the UNION of both key sets, so a column present in
 * one and absent in the other is a difference rather than an unchecked field.
 */
function firstDurableMismatch(
  existing: DurableRow,
  offered: DurableRow,
): { column: string; existing: string; incoming: string } | null {
  const columns = [...new Set([...Object.keys(existing), ...Object.keys(offered)])].sort();
  for (const column of columns) {
    const a = existing[column];
    const b = offered[column];
    if (a !== b) {
      return { column, existing: describeCell(a), incoming: describeCell(b) };
    }
  }
  return null;
}

function describeCell(value: string | number | null | undefined): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '<absent>';
  return String(value);
}

function seedPositions<T>(rows: Positioned<T>[], counters: Map<ID, number>): void {
  for (const row of rows) {
    const seen = counters.get(row.estate_id) ?? 0;
    if (row.append_position + 1 > seen) counters.set(row.estate_id, row.append_position + 1);
  }
}

function recordsFor<T>(rows: Positioned<T>[], estate_id: ID): T[] {
  const out: T[] = [];
  for (const row of rows) {
    if (row.estate_id === estate_id) out.push(row.record);
  }
  return out;
}

function collect<T>(ids: Set<ID>, source: Map<ID, T>): T[] {
  const out: T[] = [];
  for (const id of ids) {
    const value = source.get(id);
    if (value !== undefined) out.push(value);
  }
  return out;
}
