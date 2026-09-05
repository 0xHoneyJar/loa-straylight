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
//
// ── R2: SESSION-ESTATE BINDING AND ORDER-INDEPENDENT CLASSIFICATION ─────
//
// Every session is constructed BOUND to exactly one estate id — the estate the
// async host locked and whose snapshot it loaded. That binding is the store's
// ESTATE AUTHORITY: every append-only write must FIRST declare the bound estate,
// and a record naming any other estate is refused as an integrity violation
// (`estate_authority_violation`) that rolls the transaction back. It is never
// classified idempotent and never committed.
//
// This closes the hole the durable REJECT found: records owned by one estate,
// replayed through a session opened and locked for a DIFFERENT estate, committed
// with `inserted: 0` and `idempotent: 3`, because promoted estate equality was
// checked against the RECORD's self-report rather than against the session's
// authority. A record cannot vouch for its own estate; the session can.
//
// Classification of an existing id is now a PURE FUNCTION of the offered record,
// the session's bound estate, and the stored rows. No counter participates, so it
// is independent of callback ordering, of session-local ordering, and of how many
// earlier appends this session made. The rejected `offerPosition` / `offered*`
// ordinals are GONE: they restarted at 1 every transaction and could not
// establish a historical durable position, and comparing one against a stored
// position falsely refused byte-identical replays of independently committed
// operations.
//
// The two concerns the rejected code conflated are now separate:
//
//   CALLER-CONTROLLED IMMUTABLE EQUALITY  `callerControlledRow` /
//       `firstCallerControlledMismatch` in `rows.ts` — ONE shared declaration,
//       consumed identically here and by the live-row classifier in `persist.ts`.
//       `append_position` is deliberately NOT part of it.
//
//   STORE-ASSIGNED PLACEMENT INTEGRITY    `storedPlacementViolation` in
//       `rows.ts`, checked against the estate's dense-prefix invariant and the
//       shipped database constraints. Only a FRESH id receives the next
//       store-assigned position; a converging existing id consumes none.

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
import { callerControlledRow, firstCallerControlledMismatch, storedPlacementViolation } from './rows.js';

export class PostgresAdapterSession implements StorageAdapter {
  private readonly state: CanonicalState;

  /**
   * The ONE estate this session may write to: the estate the host locked and
   * whose snapshot it loaded. Estate authority is the SESSION's, not the
   * record's — see the module header.
   */
  private readonly boundEstateId: ID;

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

  // Per-estate next append position, seeded from the loaded snapshot. This is
  // the STORE-ASSIGNED placement counter: only a FRESH immutable id consumes
  // from it (loaded dense maximum for the estate plus one). A converging
  // existing id consumes NO position and creates no duplicate.
  private readonly nextTransitionPos = new Map<ID, number>();
  private readonly nextTransitionReceiptPos = new Map<ID, number>();
  private readonly nextRecallReceiptPos = new Map<ID, number>();
  private readonly nextAuditPos = new Map<ID, number>();

  // Append writes recognized as already-durable-and-identical. Reported in
  // the delta so a retry's idempotency is an OBSERVABLE fact, not a silent
  // absence of work that looks the same as "the callback did nothing".
  private idempotentSkips = 0;

  private closed = false;

  /**
   * @param state       the snapshot the host loaded for `boundEstateId`.
   * @param boundEstateId the estate the host LOCKED and loaded. Every
   *        append-only write must declare exactly this estate; any other estate
   *        is refused. Required — there is no unbound session.
   */
  constructor(state: CanonicalState, boundEstateId: ID) {
    if (typeof boundEstateId !== 'string' || boundEstateId.length === 0) {
      throw new PostgresIntegrityError(
        'estate_authority_violation',
        'a session must be constructed bound to the estate the host locked and loaded; ' +
          'an unbound session has no estate authority and could not refuse a cross-estate write',
      );
    }
    this.state = state;
    this.boundEstateId = boundEstateId;
    this.loadedTransitions = state.transitions.length;
    this.loadedTransitionReceipts = state.transitionReceipts.length;
    this.loadedRecallReceipts = state.recallReceipts.length;
    this.loadedAuditEvents = state.auditEvents.length;
    seedPositions(state.transitions, this.nextTransitionPos);
    seedPositions(state.transitionReceipts, this.nextTransitionReceiptPos);
    seedPositions(state.recallReceipts, this.nextRecallReceiptPos);
    seedPositions(state.auditEvents, this.nextAuditPos);
  }

  /** The estate this session is bound to. Read-only; host/probe diagnostics. */
  get estateId(): ID {
    return this.boundEstateId;
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
    this.requireBoundEstate('estate_transitions', t.transition_id, t.estate_id);
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
      estate_id: this.boundEstateId,
      append_position: this.claimPosition(this.nextTransitionPos, this.boundEstateId),
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
    this.requireBoundEstate('recall_receipts', r.receipt_id, r.estate_id);
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
      estate_id: this.boundEstateId,
      append_position: this.claimPosition(this.nextRecallReceiptPos, this.boundEstateId),
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
    this.requireBoundEstate('transition_receipts', r.receipt_id, r.estate_id);
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
      estate_id: this.boundEstateId,
      append_position: this.claimPosition(this.nextTransitionReceiptPos, this.boundEstateId),
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
    this.requireBoundEstate('audit_events', e.audit_event_id, e.estate_id);
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
    const tail = this.getAuditTail(this.boundEstateId);
    if (e.previous_audit_hash !== tail) {
      throw new PostgresIntegrityError(
        'audit_chain_broken',
        `audit event ${e.audit_event_id} declares previous_audit_hash ` +
          `${String(e.previous_audit_hash)} but estate ${this.boundEstateId} tail is ${String(tail)}`,
      );
    }
    this.state.auditEvents.push({
      estate_id: this.boundEstateId,
      append_position: this.claimPosition(this.nextAuditPos, this.boundEstateId),
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
   * SESSION-ESTATE BINDING — the first check of every append-only write.
   *
   * The host locks exactly one estate and loads exactly that estate's snapshot,
   * so this session may write to exactly that estate. A record naming any other
   * estate is an integrity violation: it is refused with a distinct bounded
   * reason, the transaction rolls back, and NOTHING from the attempted operation
   * becomes durable. It is never classified idempotent and never committed.
   *
   * Estate authority is the SESSION's, not the record's. The rejected
   * implementation checked promoted estate equality against the record itself,
   * which let records owned by one estate be replayed through a session opened
   * and locked for a different estate and commit as convergences — a record
   * cannot vouch for its own estate.
   *
   * This also makes a cross-estate id reuse impossible to mistake for
   * convergence: a record whose id already exists under another estate never
   * reaches classification at all, because the offered record must name THIS
   * estate, and the snapshot contains only this estate's rows.
   */
  private requireBoundEstate(table: string, id: ID, recordEstateId: ID): void {
    if (recordEstateId !== this.boundEstateId) {
      throw new PostgresIntegrityError(
        'estate_authority_violation',
        `${table}: record ${id} declares estate ${String(recordEstateId)} but this session is ` +
          `bound to estate ${this.boundEstateId}, which the host locked and loaded; ` +
          'a cross-estate write is refused and the transaction rolls back',
      );
    }
  }

  /**
   * Classify an append whose immutable id may already be present in this
   * session's view.
   *
   *   'fresh'      the id is unseen — append it, and only then does it receive
   *                the next store-assigned position.
   *   'idempotent' the id is present as the SAME DURABLE WRITE: every
   *                CALLER-CONTROLLED immutable field matches, and the stored
   *                row's placement is consistent with the store's own
   *                invariants. The write converges on it — no second position is
   *                taken and no duplicate is created (ADR-049Q §13.1(g)).
   *
   * Any other presence of the id raises `immutable_id_conflict`: the immutable
   * id is being reused for a DIFFERENT durable write, which is an integrity
   * violation, never an update (P-3).
   *
   * ORDER INDEPENDENCE. This is a PURE FUNCTION of the offered record, the
   * session's bound estate, and the stored rows. No counter participates, so the
   * result is independent of callback ordering, of session-local ordering, and of
   * how many earlier appends this session made. That is the correction: the
   * rejected version compared the stored `append_position` against a
   * session-local offer ordinal that restarted at 1 in every transaction, so a
   * byte-identical replay of an independently committed operation B (durable at
   * position 2, offered first and therefore claiming 1) was FALSELY refused as
   * `immutable_id_conflict`. A counter that restarts per session cannot establish
   * a historical durable position, and the adapter's append methods supply no
   * caller position at all.
   *
   * TWO SEPARATE CHECKS, from ONE shared declaration:
   *
   *   (1) CALLER-CONTROLLED EQUALITY — `callerControlledRow` and
   *       `firstCallerControlledMismatch` from `rows.ts`, the SINGLE declaration
   *       that `persist.ts`'s live-row classifier also consumes. Canonical
   *       payload (which carries the record's own id), record estate, and for
   *       audit events the chain fields including the normalized parent key.
   *       `append_position` is NOT in it, because it is not caller-supplied.
   *       The offered side's estate is the SESSION's bound estate (authority);
   *       the stored side's is the row's promoted estate column.
   *
   *   (2) STORED PLACEMENT INTEGRITY — `storedPlacementViolation` from
   *       `rows.ts`, validating the matched row's own position against the
   *       estate's dense-prefix invariant and the shipped constraints
   *       (`CHECK (append_position >= 1)`, `UNIQUE (estate_id,
   *       append_position)`). A matched row the store cannot vouch for is
   *       REFUSED rather than served as a convergence target.
   *
   * This covers the case where the retried record is in the LOADED PREFIX (the
   * ordinary retry) as well as one appended earlier in the same session. The
   * complementary case — a row committed by another transaction between this
   * session's load and its write — is invisible to the snapshot and is classified
   * against the LIVE row in `persist.ts`, by the same shared declaration.
   */
  private classifyExistingAppend<T>(
    table: string,
    rows: Positioned<T>[],
    idOf: (record: T) => ID,
    id: ID,
    incoming: T,
  ): 'fresh' | 'idempotent' {
    // The offered write's caller-controlled identity, under the SESSION's estate
    // authority. Computed once, outside the scan, so it cannot vary with where
    // in the row list a match is found.
    const offered = callerControlledRow(this.boundEstateId, incoming);
    // Every stored position of this table for the bound estate, for the
    // dense-prefix half of the placement check.
    const scopedPositions: number[] = [];
    for (const row of rows) {
      if (row.estate_id === this.boundEstateId) scopedPositions.push(row.append_position);
    }
    for (const row of rows) {
      if (idOf(row.record) !== id) continue;
      const existing = callerControlledRow(row.estate_id, row.record);
      const mismatch = firstCallerControlledMismatch(existing, offered);
      if (mismatch !== null) {
        throw new PostgresIntegrityError(
          'immutable_id_conflict',
          `${table}: immutable id ${id} is already present as a different durable write ` +
            `(${mismatch.column}: existing ${mismatch.existing} != incoming ${mismatch.incoming})`,
        );
      }
      // The caller-controlled fields agree. Before certifying convergence, the
      // STORE must vouch for where that row sits — placement is the store's, and
      // a row whose stored placement violates the store's own invariants may not
      // be served as a convergence target.
      const placement = storedPlacementViolation(scopedPositions, row.append_position);
      if (placement !== null) {
        throw new PostgresIntegrityError(
          'append_prefix_mutated',
          `${table}: immutable id ${id} matches a stored row whose placement is unsound ` +
            `for estate ${this.boundEstateId}: ${placement}`,
        );
      }
      this.idempotentSkips += 1;
      return 'idempotent';
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
