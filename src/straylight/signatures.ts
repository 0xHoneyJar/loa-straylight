// Dev-signature implementation (signature_type === 'dev_signature').
//
// CLEARLY MARKED AS DEVELOPMENT-ONLY. This is not cryptographic authority.
// It is a deterministic HMAC-SHA256 over the canonicalized signed payload,
// keyed by the signer's `key_ref`. A production implementation MUST replace
// this with ed25519/secp256k1/HMAC-with-real-key-material before any real
// estate exists.

import { createHmac } from 'node:crypto';
import { canonicalize, sha256 } from './canonical.js';
import { contentId } from './ids.js';
import type { Hash, ISO8601, SignatureEnvelope, SignerType } from './types.js';

export const DEV_SIGNATURE_PREFIX = 'dev:';

export interface DevSignParams {
  signer_id: string;
  signer_type: SignerType;
  key_ref: string;
  payload: unknown;
  signed_at: ISO8601;
}

export function devSign(params: DevSignParams): SignatureEnvelope {
  const payload_hash = sha256(params.payload);
  const sig = devSignatureFor(params.key_ref, payload_hash);
  return {
    signature_id: contentId(
      { payload_hash, signer_id: params.signer_id, signed_at: params.signed_at },
      { prefix: 'sig' },
    ),
    signer_id: params.signer_id,
    signer_type: params.signer_type,
    signature_type: 'dev_signature',
    signed_payload_hash: payload_hash,
    signature: sig,
    signed_at: params.signed_at,
    key_ref: params.key_ref,
  };
}

export function devSignatureFor(key_ref: string, payload_hash: Hash): string {
  const mac = createHmac('sha256', key_ref).update(payload_hash).digest('hex');
  return `${DEV_SIGNATURE_PREFIX}${mac}`;
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
}

// Verify a dev signature against an expected key_ref + raw payload.
// Returns reason when invalid so policy.ts can attribute failure precisely.
export function verifyDevSignature(
  envelope: SignatureEnvelope,
  payload: unknown,
  expected_key_ref: string,
): VerifyResult {
  if (envelope.signature_type !== 'dev_signature') {
    return { valid: false, reason: `unsupported_signature_type:${envelope.signature_type}` };
  }
  if (envelope.key_ref !== expected_key_ref) {
    return { valid: false, reason: 'key_ref_mismatch' };
  }
  const expected_payload_hash = sha256(payload);
  if (envelope.signed_payload_hash !== expected_payload_hash) {
    return { valid: false, reason: 'payload_hash_mismatch' };
  }
  const expected_sig = devSignatureFor(expected_key_ref, expected_payload_hash);
  if (envelope.signature !== expected_sig) {
    return { valid: false, reason: 'signature_mismatch' };
  }
  return { valid: true };
}

// Verify only the internal consistency of the envelope (signature matches the
// envelope's own claimed key_ref and payload hash). Used when the verifier
// doesn't have the original payload but already trusts the signed_payload_hash
// produced upstream — class validation has already run by then.
export function verifyEnvelopeSelfConsistency(
  envelope: SignatureEnvelope,
): VerifyResult {
  if (envelope.signature_type !== 'dev_signature') {
    return { valid: false, reason: `unsupported_signature_type:${envelope.signature_type}` };
  }
  const expected_sig = devSignatureFor(envelope.key_ref, envelope.signed_payload_hash);
  if (envelope.signature !== expected_sig) {
    return { valid: false, reason: 'signature_mismatch' };
  }
  return { valid: true };
}

// Helper: canonicalize the body that callers should sign for an assertion.
// Includes class + body + provenance + scope so any tampering with those
// invalidates the signature.
export function assertionSignedPayload(input: {
  estate_id: string;
  actor_id: string;
  assertion_class: string;
  body: unknown;
  provenance: unknown;
  privacy_scope?: string;
  risk_level?: string;
}): unknown {
  return {
    estate_id: input.estate_id,
    actor_id: input.actor_id,
    assertion_class: input.assertion_class,
    body: input.body,
    provenance: input.provenance,
    privacy_scope: input.privacy_scope ?? null,
    risk_level: input.risk_level ?? null,
  };
}

export function recallSignedPayload(input: {
  actor_id: string;
  estate_id: string;
  task: string;
  environment_frame: string;
  risk_profile: string;
}): unknown {
  return canonicalShape(input);
}

function canonicalShape<T extends Record<string, unknown>>(v: T): T {
  // canonicalize() already sorts; this is just a documentation hook.
  void canonicalize(v);
  return v;
}
