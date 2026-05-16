import { AuditLog } from './audit.js';
import type { StorageAdapter } from './storage/types.js';
import type { Actor, ActorEstate, Assertion, CandidateAssertion, Challenge, ClassValidationResult, EstateTransition, ForgetRecord, ID, Keyring, PolicyDecision, Revocation, SignatureEnvelope, TransitionReceipt } from './types.js';
export interface EstateStoreInit {
    actor: Actor;
    estate: ActorEstate;
    keyring: Keyring;
    /**
     * Optional storage adapter. If omitted, an in-memory adapter is used.
     * The actor/estate/keyring are upserted into the adapter on construction
     * so cold-reload via {@link EstateStore.fromStorage} stays consistent.
     */
    storage?: StorageAdapter;
}
export interface AdmitOutcome {
    ok: boolean;
    assertion?: Assertion;
    transition: EstateTransition;
    audit_event_id: ID;
    policy_decision: PolicyDecision;
    class_validation: ClassValidationResult;
    receipt: TransitionReceipt;
}
export interface ChallengeOutcome {
    ok: boolean;
    challenge: Challenge;
    transition: EstateTransition;
    audit_event_id: ID;
    policy_decision: PolicyDecision;
    updated_target?: Assertion;
    receipt: TransitionReceipt;
}
export interface RevokeOutcome {
    ok: boolean;
    revocation: Revocation;
    transition: EstateTransition;
    audit_event_id: ID;
    policy_decision: PolicyDecision;
    updated_target?: Assertion;
    receipt: TransitionReceipt;
}
export interface ForgetOutcome {
    ok: boolean;
    forget: ForgetRecord;
    transition: EstateTransition;
    audit_event_id: ID;
    policy_decision: PolicyDecision;
    updated_target?: Assertion;
    receipt: TransitionReceipt;
}
export declare class EstateStore {
    readonly storage: StorageAdapter;
    readonly auditLog: AuditLog;
    private readonly actor;
    private readonly estate;
    private readonly keyring;
    constructor(init: EstateStoreInit);
    /**
     * Cold-reload an EstateStore from a StorageAdapter. The adapter must already
     * contain the actor + estate + keyring rows; otherwise undefined is returned.
     */
    static fromStorage(storage: StorageAdapter, estate_id: ID): EstateStore | undefined;
    getActor(): Actor;
    getEstate(): ActorEstate;
    getKeyring(): Keyring;
    listAssertions(): Assertion[];
    getAssertion(id: ID): Assertion | undefined;
    listTransitions(): readonly EstateTransition[];
    listTransitionReceipts(): TransitionReceipt[];
    admit(candidate: CandidateAssertion, now: string): AdmitOutcome;
    seedAssertion(assertion: Assertion): void;
    challenge(input: {
        target_assertion_id: ID;
        challenge: Omit<Challenge, 'challenge_id' | 'estate_id' | 'actor_id' | 'target_assertion_id' | 'created_at'>;
        now: string;
    }): ChallengeOutcome;
    revoke(input: {
        target_assertion_id: ID;
        revocation: Omit<Revocation, 'revocation_id' | 'estate_id' | 'actor_id' | 'target_assertion_id' | 'created_at'>;
        now: string;
    }): RevokeOutcome;
    forget(input: {
        target_assertion_id: ID;
        reason: string;
        signatures: SignatureEnvelope[];
        now: string;
    }): ForgetOutcome;
    private buildTransition;
    private persistReceipt;
}
