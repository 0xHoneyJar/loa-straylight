// StorageAdapter — abstraction for the seven Phase-2 "tables" listed in
// docs/architecture/loa-straylight-product-system-architecture-spec.md §17.5.
//
// MVP semantics (must hold for every conforming implementation):
//   * actors / estates / keyrings / assertions / receipts use upsert semantics
//     (latest write wins by primary id).
//   * transitions and audit events are append-only — once written, they MUST
//     be returned in append order and MUST NOT be mutated.
//   * audit events are hash-chained per estate; getAuditTail returns the
//     latest audit_hash for that estate or undefined if none.
//   * adapters MUST NOT throw on unknown ids — return undefined / [] instead.
//   * adapters MAY perform integrity checks (e.g. duplicate audit_event_id) but
//     MUST surface those as exceptions, never silent drops.
//
// Phase 2 intentionally keeps the surface synchronous. Async adapters (real
// SQL/Postgres in Dixie or Finn) replace this interface in a later phase;
// callers that need to remain sync use a wrapper that snapshots state on
// load and writes through.

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
} from '../types.js';

export interface StorageAdapter {
  // ── actors ──────────────────────────────────────────────────────────────────
  upsertActor(actor: Actor): void;
  getActor(actor_id: ID): Actor | undefined;

  // ── estates ─────────────────────────────────────────────────────────────────
  upsertEstate(estate: ActorEstate): void;
  getEstate(estate_id: ID): ActorEstate | undefined;

  // ── keyrings ────────────────────────────────────────────────────────────────
  upsertKeyring(keyring: Keyring): void;
  getKeyring(keyring_id: ID): Keyring | undefined;

  // ── assertions (mutable: status changes write a new version) ────────────────
  upsertAssertion(assertion: Assertion): void;
  getAssertion(assertion_id: ID): Assertion | undefined;
  listAssertions(estate_id: ID): Assertion[];

  // ── transitions (append-only) ───────────────────────────────────────────────
  appendTransition(transition: EstateTransition): void;
  listTransitions(estate_id: ID): EstateTransition[];

  // ── recall receipts (append-only — receipts are immutable artifacts) ────────
  upsertRecallReceipt(receipt: RecallReceipt): void;
  getRecallReceipt(receipt_id: ID): RecallReceipt | undefined;

  // ── transition receipts (append-only) — admission/denied/challenge/etc ──────
  upsertTransitionReceipt(receipt: TransitionReceipt): void;
  getTransitionReceipt(receipt_id: ID): TransitionReceipt | undefined;
  listTransitionReceipts(estate_id: ID): TransitionReceipt[];

  // ── audit events (append-only, hash-chained per estate) ─────────────────────
  appendAuditEvent(event: AuditEvent): void;
  listAuditEvents(estate_id?: ID): AuditEvent[];
  getAuditTail(estate_id: ID): Hash | undefined;
}

export interface EstateBundle {
  actor: Actor;
  estate: ActorEstate;
  keyring: Keyring;
}

export function loadBundle(storage: StorageAdapter, estate_id: ID): EstateBundle | undefined {
  const estate = storage.getEstate(estate_id);
  if (!estate) return undefined;
  const actor = storage.getActor(estate.actor_id);
  const keyring = storage.getKeyring(estate.keyring_id);
  if (!actor || !keyring) return undefined;
  return { actor, estate, keyring };
}

export function saveBundle(storage: StorageAdapter, bundle: EstateBundle): void {
  storage.upsertActor(bundle.actor);
  storage.upsertKeyring(bundle.keyring);
  storage.upsertEstate(bundle.estate);
}
