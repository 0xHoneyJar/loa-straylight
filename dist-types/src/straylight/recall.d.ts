import type { EstateStore } from './estate.js';
import type { ClassValidationResult, PolicyDecision, RecallPack, RecallReceipt, RecallRequest } from './types.js';
export interface RecallOutcome {
    ok: boolean;
    request: RecallRequest;
    class_validation: ClassValidationResult;
    policy_decision: PolicyDecision;
    pack?: RecallPack;
    receipt?: RecallReceipt;
    audit_event_id?: string;
}
export declare function executeRecall(store: EstateStore, request: RecallRequest, now: string): RecallOutcome;
