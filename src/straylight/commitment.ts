// Optional CommitmentRoot — local-only for MVP (§13.3).
//
// Computes a deterministic root over a set of estate references. Does NOT
// publish to any chain. The root explicitly excludes assertion bodies and
// private provenance contents so it is safe to hand to a future onchain
// anchor adapter.

import { sha256 } from './canonical.js';
import { contentId } from './ids.js';
import { devSign } from './signatures.js';
import type {
  CommitmentRoot,
  Hash,
  ID,
  ISO8601,
  RecallReceipt,
  SignerType,
} from './types.js';

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

export function computeCommitmentRoot(input: CommitmentInput): CommitmentRoot {
  const root_hash = sha256({
    actor_id: input.actor_id,
    estate_id: input.estate_id,
    commitment_type: input.commitment_type,
    refs: [...input.refs].sort(),
    payload_summaries: [...input.payload_summaries].sort(),
  });
  const commitment_id = contentId({ root_hash, created_at: input.created_at }, { prefix: 'cmt' });

  const signature = devSign({
    signer_id: input.created_by,
    signer_type: input.created_by_type,
    key_ref: input.created_by_key_ref,
    payload: { commitment_id, root_hash },
    signed_at: input.created_at,
  });

  return {
    commitment_id,
    actor_id: input.actor_id,
    estate_id: input.estate_id,
    commitment_type: input.commitment_type,
    root_hash,
    included_refs: input.refs,
    schema_version: '0.1.0',
    created_by: input.created_by,
    signature,
    created_at: input.created_at,
  };
}

// Build a recall-receipt-class commitment from a RecallReceipt. Only references
// and hashes flow into the root; no assertion bodies.
export function commitmentForRecallReceipt(
  receipt: RecallReceipt,
  signer: { id: ID; type: SignerType; key_ref: string },
  created_at: ISO8601,
): CommitmentRoot {
  return computeCommitmentRoot({
    actor_id: receipt.actor_id,
    estate_id: receipt.estate_id,
    commitment_type: 'recall_receipt',
    refs: [receipt.receipt_id, receipt.recall_pack_id, receipt.recall_request_id],
    payload_summaries: [receipt.pack_hash, receipt.receipt_hash],
    created_by: signer.id,
    created_by_type: signer.type,
    created_by_key_ref: signer.key_ref,
    created_at,
  });
}
