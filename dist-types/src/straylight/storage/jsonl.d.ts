import type { Actor, ActorEstate, Assertion, AuditEvent, EstateTransition, Hash, ID, Keyring, RecallReceipt, TransitionReceipt } from '../types.js';
import type { StorageAdapter } from './types.js';
export interface JsonlStorageOptions {
    root: string;
    createDirIfMissing?: boolean;
}
export declare class JsonlStorage implements StorageAdapter {
    readonly root: string;
    constructor(opts: JsonlStorageOptions);
    upsertActor(a: Actor): void;
    getActor(id: ID): Actor | undefined;
    upsertEstate(e: ActorEstate): void;
    getEstate(id: ID): ActorEstate | undefined;
    upsertKeyring(k: Keyring): void;
    getKeyring(id: ID): Keyring | undefined;
    upsertAssertion(a: Assertion): void;
    getAssertion(id: ID): Assertion | undefined;
    listAssertions(estate_id: ID): Assertion[];
    appendTransition(t: EstateTransition): void;
    listTransitions(estate_id: ID): EstateTransition[];
    upsertRecallReceipt(r: RecallReceipt): void;
    getRecallReceipt(id: ID): RecallReceipt | undefined;
    upsertTransitionReceipt(r: TransitionReceipt): void;
    getTransitionReceipt(id: ID): TransitionReceipt | undefined;
    listTransitionReceipts(estate_id: ID): TransitionReceipt[];
    appendAuditEvent(e: AuditEvent): void;
    listAuditEvents(estate_id?: ID): AuditEvent[];
    getAuditTail(estate_id: ID): Hash | undefined;
    private path;
    private append;
    private readAll;
    private lastBy;
}
