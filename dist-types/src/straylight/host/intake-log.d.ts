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
export declare function createInMemoryIntakeDenyLog(): IntakeDenyLog;
