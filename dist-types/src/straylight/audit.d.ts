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
export declare class AuditLog {
    private readonly storage;
    constructor(storage: StorageAdapter);
    append(input: AuditWriteInput): AuditEvent;
    list(): readonly AuditEvent[];
    listFor(estate_id: ID): AuditEvent[];
    verifyChain(estate_id: ID): {
        ok: true;
    } | {
        ok: false;
        broken_at: number;
        reason: string;
    };
}
