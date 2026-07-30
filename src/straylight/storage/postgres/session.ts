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
import { canonicalPayload } from './rows.js';

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
   * Classify an append whose immutable id may already be present in this
   * session's view.
   *
   *   'fresh'      the id is unseen — append it.
   *   'idempotent' the id is present with BYTE-IDENTICAL canonical content.
   *                The record is already durable exactly as offered, so the
   *                write converges on it: no second position is taken and no
   *                duplicate is created (ADR-049Q §13.1(g)).
   *
   * A present id with DIFFERENT canonical content raises
   * `immutable_id_conflict` — the immutable id is being reused for other
   * content, which is an integrity violation, never an update (P-3). The
   * comparison is over the canonical serialization, so field order and
   * absent-vs-undefined can never make two different records look equal.
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
  ): 'fresh' | 'idempotent' {
    for (const row of rows) {
      if (idOf(row.record) !== id) continue;
      if (canonicalPayload(row.record) === canonicalPayload(incoming)) {
        this.idempotentSkips += 1;
        return 'idempotent';
      }
      throw new PostgresIntegrityError(
        'immutable_id_conflict',
        `${table}: immutable id ${id} is already present with different canonical content`,
      );
    }
    return 'fresh';
  }
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
