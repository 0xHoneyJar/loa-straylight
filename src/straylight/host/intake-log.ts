// Phase 24C — host-side intake-deny log.
//
// Vectors 7 and 8 of docs/specs/dixie-recall-host-validation-vectors.md
// require the host to emit an "intake-deny audit log entry referencing the
// wedge's `recall_denied` event for chain-of-custody". This log is
// distinct from the wedge's per-estate hash-chained AuditLog: it is the
// host's own intake-side trail. It is per-tenant (NOT cross-tenant);
// cross-estate / cross-tenant chain links are forbidden by the host
// invariants in
// docs/specs/dixie-recall-host-mvp-contract.md §"Host invariants" #5.
//
// This in-memory implementation is deliberately minimal: no persistence,
// no hash chain, no signatures. A future real Dixie BFF will replace it
// with a per-tenant durable store; the public shape stays the same.

import { contentId } from '../ids.js';

export interface IntakeDenyEntry {
  intake_log_entry_id: string;
  caller_tenant: string;
  caller_actor_id: string;
  /** Set when the deny is bound to a specific target actor. */
  target_actor_id?: string;
  /** Set when the deny is bound to a specific target estate. */
  target_estate_id?: string;
  /** Set when the deny is bound to a specific target receipt (Surface 2). */
  target_receipt_id?: string;
  /** Set when the deny is bound to a specific target assertion (Surface 4). */
  target_assertion_id?: string;
  /** Host-classified deny reason. */
  reason: string;
  /** Optional reference to the wedge's `recall_denied` audit event. */
  wedge_audit_event_ref?: string;
  ts: string;
}

export interface IntakeDenyLog {
  append(entry: Omit<IntakeDenyEntry, 'intake_log_entry_id'>): IntakeDenyEntry;
  list(): readonly IntakeDenyEntry[];
  /**
   * Per-tenant view. Cross-tenant chain links are forbidden — callers MUST
   * use this method when surfacing log entries to a tenant operator. The
   * unscoped `list()` is for in-process debugging only.
   */
  listForTenant(tenant_id: string): IntakeDenyEntry[];
}

export function createInMemoryIntakeDenyLog(): IntakeDenyLog {
  const entries: IntakeDenyEntry[] = [];
  return {
    append(input) {
      const id = contentId(
        {
          caller_tenant: input.caller_tenant,
          caller_actor_id: input.caller_actor_id,
          target_actor_id: input.target_actor_id ?? null,
          target_estate_id: input.target_estate_id ?? null,
          target_receipt_id: input.target_receipt_id ?? null,
          target_assertion_id: input.target_assertion_id ?? null,
          reason: input.reason,
          wedge_audit_event_ref: input.wedge_audit_event_ref ?? null,
          ts: input.ts,
          seq: entries.length,
        },
        { prefix: 'idlog' },
      );
      const entry: IntakeDenyEntry = { ...input, intake_log_entry_id: id };
      entries.push(entry);
      return entry;
    },
    list() {
      return entries;
    },
    listForTenant(tenant_id) {
      return entries.filter((e) => e.caller_tenant === tenant_id);
    },
  };
}
