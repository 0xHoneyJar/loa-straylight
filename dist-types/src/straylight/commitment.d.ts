import type { CommitmentRoot, Hash, ID, ISO8601, RecallReceipt, SignerType } from './types.js';
export interface CommitmentInput {
    actor_id: ID;
    estate_id: ID;
    commitment_type: CommitmentRoot['commitment_type'];
    refs: ID[];
    payload_summaries: Hash[];
    created_by: ID;
    created_by_type: SignerType;
    created_by_key_ref: string;
    created_at: ISO8601;
}
export declare function computeCommitmentRoot(input: CommitmentInput): CommitmentRoot;
export declare function commitmentForRecallReceipt(receipt: RecallReceipt, signer: {
    id: ID;
    type: SignerType;
    key_ref: string;
}, created_at: ISO8601): CommitmentRoot;
