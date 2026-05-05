// In-process StorageAdapter — the Phase 1 default behavior, now behind the
// adapter interface. No filesystem touch. Loses all state when the process
// exits, by design.

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
import type { StorageAdapter } from './types.js';

export class InMemoryStorage implements StorageAdapter {
  private readonly actors = new Map<ID, Actor>();
  private readonly estates = new Map<ID, ActorEstate>();
  private readonly keyrings = new Map<ID, Keyring>();
  private readonly assertions = new Map<ID, Assertion>();
  private readonly transitions: EstateTransition[] = [];
  private readonly receipts = new Map<ID, RecallReceipt>();
  private readonly transitionReceipts = new Map<ID, TransitionReceipt>();
  private readonly auditEvents: AuditEvent[] = [];
  private readonly auditTail = new Map<ID, Hash>();

  upsertActor(a: Actor): void {
    this.actors.set(a.actor_id, a);
  }
  getActor(id: ID): Actor | undefined {
    return this.actors.get(id);
  }

  upsertEstate(e: ActorEstate): void {
    this.estates.set(e.estate_id, e);
  }
  getEstate(id: ID): ActorEstate | undefined {
    return this.estates.get(id);
  }

  upsertKeyring(k: Keyring): void {
    this.keyrings.set(k.keyring_id, k);
  }
  getKeyring(id: ID): Keyring | undefined {
    return this.keyrings.get(id);
  }

  upsertAssertion(a: Assertion): void {
    this.assertions.set(a.assertion_id, a);
  }
  getAssertion(id: ID): Assertion | undefined {
    return this.assertions.get(id);
  }
  listAssertions(estate_id: ID): Assertion[] {
    const out: Assertion[] = [];
    for (const a of this.assertions.values()) {
      if (a.estate_id === estate_id) out.push(a);
    }
    return out;
  }

  appendTransition(t: EstateTransition): void {
    this.transitions.push(t);
  }
  listTransitions(estate_id: ID): EstateTransition[] {
    return this.transitions.filter((t) => t.estate_id === estate_id);
  }

  upsertRecallReceipt(r: RecallReceipt): void {
    this.receipts.set(r.receipt_id, r);
  }
  getRecallReceipt(id: ID): RecallReceipt | undefined {
    return this.receipts.get(id);
  }

  upsertTransitionReceipt(r: TransitionReceipt): void {
    this.transitionReceipts.set(r.receipt_id, r);
  }
  getTransitionReceipt(id: ID): TransitionReceipt | undefined {
    return this.transitionReceipts.get(id);
  }
  listTransitionReceipts(estate_id: ID): TransitionReceipt[] {
    const out: TransitionReceipt[] = [];
    for (const r of this.transitionReceipts.values()) {
      if (r.estate_id === estate_id) out.push(r);
    }
    return out;
  }

  appendAuditEvent(e: AuditEvent): void {
    this.auditEvents.push(e);
    this.auditTail.set(e.estate_id, e.audit_hash);
  }
  listAuditEvents(estate_id?: ID): AuditEvent[] {
    if (estate_id === undefined) return [...this.auditEvents];
    return this.auditEvents.filter((e) => e.estate_id === estate_id);
  }
  getAuditTail(estate_id: ID): Hash | undefined {
    return this.auditTail.get(estate_id);
  }
}
