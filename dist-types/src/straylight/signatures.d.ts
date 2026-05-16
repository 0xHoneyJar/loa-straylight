import type { Hash, ISO8601, SignatureEnvelope, SignerType } from './types.js';
export declare const DEV_SIGNATURE_PREFIX = "dev:";
export interface DevSignParams {
    signer_id: string;
    signer_type: SignerType;
    key_ref: string;
    payload: unknown;
    signed_at: ISO8601;
}
export declare function devSign(params: DevSignParams): SignatureEnvelope;
export declare function devSignatureFor(key_ref: string, payload_hash: Hash): string;
export interface VerifyResult {
    valid: boolean;
    reason?: string;
}
export declare function verifyDevSignature(envelope: SignatureEnvelope, payload: unknown, expected_key_ref: string): VerifyResult;
export declare function verifyEnvelopeSelfConsistency(envelope: SignatureEnvelope): VerifyResult;
export declare function assertionSignedPayload(input: {
    estate_id: string;
    actor_id: string;
    assertion_class: string;
    body: unknown;
    provenance: unknown;
    privacy_scope?: string;
    risk_level?: string;
}): unknown;
export declare function recallSignedPayload(input: {
    actor_id: string;
    estate_id: string;
    task: string;
    environment_frame: string;
    risk_profile: string;
}): unknown;
