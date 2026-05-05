// Public surface of the Straylight Recall Wedge MVP package.
//
// Phase 5 — this module is the *only* import path future cross-repo
// consumers (Hounfour, Finn, Dixie, Freeside) are expected to use. Anything
// not re-exported here is internal and subject to change without notice.
// See docs/mvp/package-boundary.md for the stable-vs-internal contract.
//
// Sections below mirror the Phase 5 grouping:
//   1. types                  — primitive shapes (no behavior)
//   2. IDs + canonical helpers — content addressing, hashing
//   3. signatures              — dev-signature signer/verifier (MVP only)
//   4. class validation        — structural shape checks (§9.1)
//   5. keyring + competence    — signer entries, competence evaluation (§10)
//   6. policy                  — admit / transition / recall decisions (§9.2)
//   7. audit chain             — append-only hash-chained log (§14)
//   8. estate store            — transition executor (admit/challenge/revoke/forget)
//   9. recall                  — RecallRequest → RecallPack + RecallReceipt (§11)
//  10. commitment helpers      — local CommitmentRoot over receipts (§13.3)
//  11. storage adapters        — in-memory + JSONL (§17.5)

// ── 1. types ─────────────────────────────────────────────────────────────────
export * from './types.js';

// ── 2. IDs + canonical helpers ───────────────────────────────────────────────
export { canonicalize, sha256, shortHash } from './canonical.js';
export { contentId, payloadHash, makeIdSource } from './ids.js';
export type { IdOptions } from './ids.js';

// ── 3. signatures (dev-signature MVP) ────────────────────────────────────────
export {
  devSign,
  devSignatureFor,
  verifyDevSignature,
  verifyEnvelopeSelfConsistency,
  assertionSignedPayload,
  recallSignedPayload,
  DEV_SIGNATURE_PREFIX,
} from './signatures.js';
export type { DevSignParams, VerifyResult } from './signatures.js';

// ── 4. class validation ──────────────────────────────────────────────────────
export {
  validateCandidateAssertion,
  validateRecallRequest,
} from './validators/class-validator.js';

// ── 5. keyring + competence ──────────────────────────────────────────────────
export {
  resolveSigner,
  isSignerCurrentlyValid,
  evaluateCompetence,
  listActiveSignerRoles,
} from './keyring.js';
export type { CompetenceQuery } from './keyring.js';

// ── 6. policy ────────────────────────────────────────────────────────────────
export {
  policyForAdmitAssertion,
  policyForTransition,
  policyForRecallRequest,
  dispositionFor,
  PolicyEngineError,
  DEFAULT_POLICY_ID,
  DEFAULT_POLICY_VERSION,
} from './policy.js';
export type {
  AdmitPolicyInput,
  TransitionPolicyInput,
  RecallPolicyInput,
  RecallDisposition,
} from './policy.js';

// ── 7. audit chain ───────────────────────────────────────────────────────────
export { AuditLog } from './audit.js';
export type { AuditWriteInput } from './audit.js';

// ── 8. estate store + transition application ────────────────────────────────
export { EstateStore } from './estate.js';
export type {
  EstateStoreInit,
  AdmitOutcome,
  ChallengeOutcome,
  RevokeOutcome,
  ForgetOutcome,
} from './estate.js';

// ── 9. recall ────────────────────────────────────────────────────────────────
export { executeRecall } from './recall.js';
export type { RecallOutcome } from './recall.js';

// ── 10. commitment helpers ───────────────────────────────────────────────────
export { computeCommitmentRoot, commitmentForRecallReceipt } from './commitment.js';
export type { CommitmentInput } from './commitment.js';

// ── 11. storage adapters ─────────────────────────────────────────────────────
export { InMemoryStorage } from './storage/in-memory.js';
export { JsonlStorage } from './storage/jsonl.js';
export type { JsonlStorageOptions } from './storage/jsonl.js';
export type { StorageAdapter, EstateBundle } from './storage/types.js';
export { loadBundle, saveBundle } from './storage/types.js';
