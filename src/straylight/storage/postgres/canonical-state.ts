// Canonical estate state — the value the transaction-scoped synchronous
// adapter session reads from and writes into.
//
// The synchronous/asynchronous boundary (ADR-049Q §13.1(a); the packet's
// capability_success_condition) works like this:
//
//   1. the async host opens a database transaction;
//   2. establishes per-estate serialization inside that transaction;
//   3. loads a `CanonicalState` snapshot with ONE set of SELECTs;
//   4. hands a synchronous StorageAdapter-conforming session over that
//      snapshot to exactly one bounded callback;
//   5. verifies the snapshot's immutable prefixes are still intact and
//      the audit chain still verifies;
//   6. persists the deterministic delta;
//   7. COMMITs — and only then returns success.
//
// The snapshot is therefore the ONLY thing the synchronous surface touches.
// No adapter method performs network I/O, and no write escapes the
// transaction. That is what makes "no fake synchronous network I/O" and
// "no fire-and-forget writes" true by construction rather than by review.

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

/** One append-only record together with its per-estate dense position. */
export interface Positioned<T> {
  estate_id: ID;
  append_position: number;
  record: T;
}

/**
 * The complete canonical state visible to one adapter session.
 *
 * Upsert tables are keyed maps (latest version by primary id). Append-only
 * tables are position-ordered arrays. The arrays are loaded in
 * `append_position` order and the session only ever pushes onto their ends,
 * so `loaded_*` lengths below are the immutable prefix boundary.
 */
export interface CanonicalState {
  actors: Map<ID, Actor>;
  estates: Map<ID, ActorEstate>;
  keyrings: Map<ID, Keyring>;
  assertions: Map<ID, Assertion>;
  transitions: Positioned<EstateTransition>[];
  transitionReceipts: Positioned<TransitionReceipt>[];
  recallReceipts: Positioned<RecallReceipt>[];
  auditEvents: Positioned<AuditEvent>[];
}

export function emptyCanonicalState(): CanonicalState {
  return {
    actors: new Map(),
    estates: new Map(),
    keyrings: new Map(),
    assertions: new Map(),
    transitions: [],
    transitionReceipts: [],
    recallReceipts: [],
    auditEvents: [],
  };
}

/**
 * The deterministic delta a session produced: which upsert rows to write at
 * their final values, and which append-only rows to add beyond the loaded
 * prefix. Computed once, at session close, from the session's own record of
 * what it touched — never inferred by diffing.
 */
export interface CanonicalDelta {
  actors: Actor[];
  estates: ActorEstate[];
  keyrings: Keyring[];
  assertions: Assertion[];
  transitions: Positioned<EstateTransition>[];
  transitionReceipts: Positioned<TransitionReceipt>[];
  recallReceipts: Positioned<RecallReceipt>[];
  auditEvents: Positioned<AuditEvent>[];
  /**
   * Append-only writes the session recognized as ALREADY DURABLE with
   * byte-identical canonical content, and therefore did not re-append. This
   * is the in-snapshot half of idempotency: an identical retry re-derives the
   * same content-addressed ids, finds them already present in the loaded
   * prefix, and converges on the existing rows instead of creating duplicates
   * (ADR-049Q §13.1(g)). The out-of-snapshot half — a row committed by
   * another transaction between load and write — is classified against the
   * live row in `persist.ts`.
   */
  idempotentSkips: number;
}

/**
 * True when the session produced no WRITE at all. Idempotent skips are not
 * writes, so a pure retry is an empty delta: nothing is persisted and the
 * prefix re-verification has nothing to guard.
 */
export function isDeltaEmpty(delta: CanonicalDelta): boolean {
  return (
    delta.actors.length === 0 &&
    delta.estates.length === 0 &&
    delta.keyrings.length === 0 &&
    delta.assertions.length === 0 &&
    delta.transitions.length === 0 &&
    delta.transitionReceipts.length === 0 &&
    delta.recallReceipts.length === 0 &&
    delta.auditEvents.length === 0
  );
}
