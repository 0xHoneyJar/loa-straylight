import type { Actor, ActorEstate, Assertion, AuditEvent, EstateTransition, Hash, ID, Keyring, RecallReceipt, TransitionReceipt } from '../types.js';
export interface StorageAdapter {
    upsertActor(actor: Actor): void;
    getActor(actor_id: ID): Actor | undefined;
    upsertEstate(estate: ActorEstate): void;
    getEstate(estate_id: ID): ActorEstate | undefined;
    upsertKeyring(keyring: Keyring): void;
    getKeyring(keyring_id: ID): Keyring | undefined;
    upsertAssertion(assertion: Assertion): void;
    getAssertion(assertion_id: ID): Assertion | undefined;
    listAssertions(estate_id: ID): Assertion[];
    appendTransition(transition: EstateTransition): void;
    listTransitions(estate_id: ID): EstateTransition[];
    upsertRecallReceipt(receipt: RecallReceipt): void;
    getRecallReceipt(receipt_id: ID): RecallReceipt | undefined;
    upsertTransitionReceipt(receipt: TransitionReceipt): void;
    getTransitionReceipt(receipt_id: ID): TransitionReceipt | undefined;
    listTransitionReceipts(estate_id: ID): TransitionReceipt[];
    appendAuditEvent(event: AuditEvent): void;
    listAuditEvents(estate_id?: ID): AuditEvent[];
    getAuditTail(estate_id: ID): Hash | undefined;
}
export interface EstateBundle {
    actor: Actor;
    estate: ActorEstate;
    keyring: Keyring;
}
export declare function loadBundle(storage: StorageAdapter, estate_id: ID): EstateBundle | undefined;
export declare function saveBundle(storage: StorageAdapter, bundle: EstateBundle): void;
