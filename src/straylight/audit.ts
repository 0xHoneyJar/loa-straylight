// Audit log — append-only, hash-chained, per-estate.
//
// Phase 2: AuditLog delegates persistence to a StorageAdapter. The audit_hash
// is computed deterministically from the event fields + the previous tail
// fetched from storage. The adapter is the source of truth — AuditLog is a
// thin convenience wrapper over it.

import { sha256 } from './canonical.js';
import { contentId } from './ids.js';
import type { AuditEvent, AuditEventType, ID } from './types.js';
import type { StorageAdapter } from './storage/types.js';

export interface AuditWriteInput {
  event_type: AuditEventType;
  actor_id: ID;
  estate_id: ID;
  transition_id?: ID;
  assertion_refs?: ID[];
  request_hash?: string;
  result_hash?: string;
  signer_refs: ID[];
  policy_decision_ref?: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

export class AuditLog {
  constructor(private readonly storage: StorageAdapter) {}

  append(input: AuditWriteInput): AuditEvent {
    const previous_audit_hash = this.storage.getAuditTail(input.estate_id);
    const audit_hash = sha256({
      event_type: input.event_type,
      actor_id: input.actor_id,
      estate_id: input.estate_id,
      transition_id: input.transition_id ?? null,
      assertion_refs: input.assertion_refs ?? [],
      request_hash: input.request_hash ?? null,
      result_hash: input.result_hash ?? null,
      signer_refs: input.signer_refs,
      policy_decision_ref: input.policy_decision_ref ?? null,
      payload: input.payload ?? null,
      previous_audit_hash: previous_audit_hash ?? null,
      created_at: input.created_at,
    });
    const ev: AuditEvent = {
      audit_event_id: contentId(audit_hash, { prefix: 'aud' }),
      event_type: input.event_type,
      actor_id: input.actor_id,
      estate_id: input.estate_id,
      transition_id: input.transition_id,
      assertion_refs: input.assertion_refs,
      request_hash: input.request_hash,
      result_hash: input.result_hash,
      signer_refs: input.signer_refs,
      policy_decision_ref: input.policy_decision_ref,
      previous_audit_hash,
      audit_hash,
      created_at: input.created_at,
      payload: input.payload,
    };
    this.storage.appendAuditEvent(ev);
    return ev;
  }

  list(): readonly AuditEvent[] {
    return this.storage.listAuditEvents();
  }

  listFor(estate_id: ID): AuditEvent[] {
    return this.storage.listAuditEvents(estate_id);
  }

  // Verify the per-estate hash chain. Returns the index of the first broken
  // link if any. A broken chain means storage was tampered with or two writers
  // raced — in either case, the estate must be quarantined.
  verifyChain(estate_id: ID): { ok: true } | { ok: false; broken_at: number; reason: string } {
    const chain = this.listFor(estate_id);
    let prev: string | undefined;
    for (let i = 0; i < chain.length; i++) {
      const ev = chain[i];
      if (!ev) continue;
      if (ev.previous_audit_hash !== prev) {
        return { ok: false, broken_at: i, reason: 'previous_audit_hash_mismatch' };
      }
      prev = ev.audit_hash;
    }
    return { ok: true };
  }
}
