// Phase 8 — Hounfour conformance vector exporter.
//
// Usage:
//   npm run hounfour:conformance
//
// Writes deterministic JSON conformance vectors to
// fixtures/hounfour-conformance/. These vectors are LOCAL pre-Hounfour
// test inputs. They are NOT canonical Hounfour schemas. They do not
// import from loa-hounfour, .loa, .claude, or any sibling repo. They are
// intended as future Hounfour test inputs that a later loa-hounfour PR
// can pick up; until that PR lands, the wedge owns the runtime semantics
// these vectors describe.
//
// Each vector is a self-describing JSON object with:
//   - case_name           : stable identifier
//   - expected_valid      : did this pass its declared validation layer?
//   - validation_layer    : class_validation | policy_validation
//                           | audit_validation | keyring_validation
//   - reason              : human-readable explanation of pass/fail
//   - subject             : which Straylight type the payload represents
//   - payload             : the example object itself
//
// Re-running with the same inputs produces byte-identical output.
//
// See docs/schema-candidates/hounfour-conformance-vectors.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  executeRecall,
  policyForAdmitAssertion,
  validateCandidateAssertion,
  EstateStore,
  type AuditEvent,
  type PolicyDecision,
  type RecallReceipt,
  type RecallRequest,
  type Assertion,
  type SignatureEnvelope,
  type SignerCompetenceResult,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
export const DEFAULT_OUT_DIR = resolve(ROOT, 'fixtures', 'hounfour-conformance');

// Deterministic timeline so re-running the export produces stable IDs.
const T = {
  observation:    '2026-05-05T10:00:00Z',
  recall:         '2026-05-05T12:30:00Z',
  unknown_admit:  '2026-05-05T12:35:00Z',
} as const;

export type ValidationLayer =
  | 'class_validation'
  | 'policy_validation'
  | 'audit_validation'
  | 'keyring_validation';

export type VectorSubject =
  | 'assertion'
  | 'recall_request'
  | 'recall_receipt'
  | 'audit_event'
  | 'policy_decision'
  | 'signer_competence';

export interface ConformanceVector {
  case_name: string;
  expected_valid: boolean;
  validation_layer: ValidationLayer;
  reason: string;
  subject: VectorSubject;
  payload: unknown;
}

interface SignerCompetencePayload {
  transition_type: string;
  assertion_class?: string;
  signer_id: string;
  signer_role: string;
  signature_envelope: SignatureEnvelope;
  signature_self_consistent: true;
  signer_competence_result: SignerCompetenceResult;
}

interface RealRunOutputs {
  observation: Assertion;
  observationCandidateSignature: SignatureEnvelope;
  recallRequest: RecallRequest;
  recallReceipt: RecallReceipt;
  auditEvent: AuditEvent;
  policyDecisionAllowed: PolicyDecision;
  policyDecisionDenied: PolicyDecision;
  identityCandidateSignature: SignatureEnvelope;
  identityIncompetenceResult: SignerCompetenceResult;
}

// Build a small, deterministic Straylight run that produces every shape
// we need to ground the conformance vectors. We use only the wedge's
// public API + local fixture builders.
function buildRealOutputs(): RealRunOutputs {
  const actor = loadActor();
  const estate = loadEstate();
  const keyring = loadKeyring();

  const store = new EstateStore({ actor, estate, keyring });

  // 1. A canonical valid observation, admitted by the runtime.
  const observationCandidate = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'Conformance: a structurally legible observation.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.runtime,
    signed_at: T.observation,
  });
  const observationCandidateSignature = observationCandidate.signatures[0]!;
  const observationOut = store.admit(observationCandidate, T.observation);
  if (!observationOut.ok || !observationOut.assertion) {
    throw new Error('hounfour-conformance: observation admit failed unexpectedly');
  }
  const observation = observationOut.assertion;

  // 2. A class-valid recall request to drive a recall and receipt.
  const recallRequest = buildRecallRequest({
    task: 'public discord conformance recall',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall,
  });
  const recallOut = executeRecall(store, recallRequest, T.recall);
  if (!recallOut.ok || !recallOut.receipt) {
    throw new Error('hounfour-conformance: recall failed unexpectedly');
  }
  const recallReceipt = recallOut.receipt;

  // 3. A policy-allow decision: runtime admitting an observation.
  const obsClassValidation = validateCandidateAssertion(observationCandidate);
  const policyDecisionAllowed = policyForAdmitAssertion({
    candidate: observationCandidate,
    class_validation: obsClassValidation,
    keyring,
    now: T.observation,
  });
  if (policyDecisionAllowed.decision !== 'allow') {
    throw new Error('hounfour-conformance: expected allow decision for observation');
  }

  // 4. A policy-deny decision: unknown signer admitting an observation.
  const unknownCandidate = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'Conformance: unknown-signer denied admission example.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.unknown,
    signed_at: T.unknown_admit,
  });
  const unknownClassValidation = validateCandidateAssertion(unknownCandidate);
  const policyDecisionDenied = policyForAdmitAssertion({
    candidate: unknownCandidate,
    class_validation: unknownClassValidation,
    keyring,
    now: T.unknown_admit,
  });
  if (policyDecisionDenied.decision !== 'deny') {
    throw new Error('hounfour-conformance: expected deny decision for unknown signer');
  }

  // 5. A canonical audit event over a transition (the admit we just did).
  const auditEvent = store.auditLog
    .listFor(estate.estate_id)
    .find((e) => e.event_type === 'assertion_admitted');
  if (!auditEvent) {
    throw new Error('hounfour-conformance: expected an assertion_admitted audit event');
  }

  // 6. A keyring-incompetence example: runtime tries to admit an
  //    `identity` assertion. The signature itself is structurally valid
  //    (self-consistent dev signature), but the runtime role is not in
  //    the matched competence rule's required_signer_roles.
  const identityCandidate = buildCandidate({
    assertion_class: 'identity',
    body: { attribute: 'role', value: 'demo agent' },
    privacy_scope: 'tenant',
    risk_level: 'high',
    signer: SIGNERS.runtime,
    signed_at: T.observation,
  });
  const identityCandidateSignature = identityCandidate.signatures[0]!;
  const identityClassValidation = validateCandidateAssertion(identityCandidate);
  const identityPolicy = policyForAdmitAssertion({
    candidate: identityCandidate,
    class_validation: identityClassValidation,
    keyring,
    now: T.observation,
  });
  if (identityPolicy.decision !== 'deny') {
    throw new Error('hounfour-conformance: expected deny for runtime admitting identity');
  }
  const identityIncompetenceResult = identityPolicy.signer_competence_result;

  return {
    observation,
    observationCandidateSignature,
    recallRequest,
    recallReceipt,
    auditEvent,
    policyDecisionAllowed,
    policyDecisionDenied,
    identityCandidateSignature,
    identityIncompetenceResult,
  };
}

// Build the 12 conformance vectors. Valid vectors carry real wedge output
// shapes; invalid vectors are deterministic mutations of those shapes,
// each documenting the precise reason the layer declares them invalid.
export function buildVectors(): ConformanceVector[] {
  const r = buildRealOutputs();

  const tamperedAuditEvent: AuditEvent = {
    ...r.auditEvent,
    audit_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
  };

  const recallRequestMissingActorId = stripField(
    r.recallRequest as unknown as Record<string, unknown>,
    'actor_id',
  );
  const recallReceiptMissingReceiptHash = stripField(
    r.recallReceipt as unknown as Record<string, unknown>,
    'receipt_hash',
  );

  const observationUnknownClass = {
    ...r.observation,
    assertion_class: 'this_is_not_a_real_class',
  };

  const competentResult: SignerCompetenceResult = r.policyDecisionAllowed.signer_competence_result;

  const competentPayload: SignerCompetencePayload = {
    transition_type: 'admit_assertion',
    assertion_class: 'observation',
    signer_id: 'runtime:finn',
    signer_role: 'runtime',
    signature_envelope: r.observationCandidateSignature,
    signature_self_consistent: true,
    signer_competence_result: competentResult,
  };

  const incompetentPayload: SignerCompetencePayload = {
    transition_type: 'admit_assertion',
    assertion_class: 'identity',
    signer_id: 'runtime:finn',
    signer_role: 'runtime',
    signature_envelope: r.identityCandidateSignature,
    signature_self_consistent: true,
    signer_competence_result: r.identityIncompetenceResult,
  };

  return [
    {
      case_name: 'valid_observation_assertion',
      expected_valid: true,
      validation_layer: 'class_validation',
      reason:
        'Structurally legible observation: every required field present, schema_version pinned, body_hash sha256-prefixed, signatures non-empty.',
      subject: 'assertion',
      payload: r.observation,
    },
    {
      case_name: 'invalid_assertion_unknown_class',
      expected_valid: false,
      validation_layer: 'class_validation',
      reason:
        'assertion_class is not a known AssertionClass enum member; class validation rejects on enum membership before any policy lane runs.',
      subject: 'assertion',
      payload: observationUnknownClass,
    },
    {
      case_name: 'valid_recall_request_public_discord',
      expected_valid: true,
      validation_layer: 'class_validation',
      reason:
        'Structurally legible RecallRequest: actor_id / estate_id / task / environment_frame / risk_profile / signature all present and well-typed.',
      subject: 'recall_request',
      payload: r.recallRequest,
    },
    {
      case_name: 'invalid_recall_request_missing_actor_id',
      expected_valid: false,
      validation_layer: 'class_validation',
      reason:
        'actor_id is required on RecallRequest; class validation rejects on missing required field before policy or recall execution.',
      subject: 'recall_request',
      payload: recallRequestMissingActorId,
    },
    {
      case_name: 'valid_recall_receipt_public_discord',
      expected_valid: true,
      validation_layer: 'class_validation',
      reason:
        'Structurally legible RecallReceipt: receipt_id, recall_request_id, recall_pack_id, pack_hash, receipt_hash, detail_level all present; hashes sha256-prefixed.',
      subject: 'recall_receipt',
      payload: r.recallReceipt,
    },
    {
      case_name: 'invalid_recall_receipt_missing_receipt_hash',
      expected_valid: false,
      validation_layer: 'class_validation',
      reason:
        'receipt_hash is required to anchor the receipt; class validation rejects on missing required field. The wedge will refuse to persist a receipt without a content-addressed hash.',
      subject: 'recall_receipt',
      payload: recallReceiptMissingReceiptHash,
    },
    {
      case_name: 'valid_audit_event_chain_consistent',
      expected_valid: true,
      validation_layer: 'audit_validation',
      reason:
        'audit_hash matches sha256(canonicalize(previous_audit_hash, event_type, transition_id, assertion_refs, signer_refs, payload, created_at)); the chain link is intact.',
      subject: 'audit_event',
      payload: r.auditEvent,
    },
    {
      case_name: 'invalid_audit_event_tampered_hash',
      expected_valid: false,
      validation_layer: 'audit_validation',
      reason:
        'audit_hash has been mutated to an all-zero digest; recomputing sha256 over the canonical event content does not match the stored audit_hash, so AuditLog.verifyChain fails. Audit-chain integrity is the documented failure mode here, not class shape.',
      subject: 'audit_event',
      payload: tamperedAuditEvent,
    },
    {
      case_name: 'policy_decision_allowed_admit_observation',
      expected_valid: true,
      validation_layer: 'policy_validation',
      reason:
        "decision: 'allow'. The signer (runtime:finn) is on the keyring with status: 'active' and the runtime role is in rule:admit-observation-runtime's required_signer_roles. Policy lane authorizes the move now.",
      subject: 'policy_decision',
      payload: r.policyDecisionAllowed,
    },
    {
      case_name: 'policy_decision_denied_unknown_signer',
      expected_valid: false,
      validation_layer: 'policy_validation',
      reason:
        "decision: 'deny'. The signer (operator:not-on-keyring) is not on the keyring; signer_competence_result.allowed is false with reason unknown_signer:<id>. Class validation passes for the underlying candidate; policy lane refuses the move.",
      subject: 'policy_decision',
      payload: r.policyDecisionDenied,
    },
    {
      case_name: 'keyring_signer_competent_for_admit_observation',
      expected_valid: true,
      validation_layer: 'keyring_validation',
      reason:
        "Signature envelope is self-consistent AND the signer's role is in the matched rule's required_signer_roles. Both gates clear: the signature would also pass verifyEnvelopeSelfConsistency, and evaluateCompetence returns allowed: true. Signature validity alone would not be sufficient; competence is the gate.",
      subject: 'signer_competence',
      payload: competentPayload,
    },
    {
      case_name: 'keyring_signer_incompetent_role_not_in_required_roles',
      expected_valid: false,
      validation_layer: 'keyring_validation',
      reason:
        "Signature envelope is self-consistent (the signer really did sign the payload), but the signer's role (runtime) is not in the required_signer_roles for admit_assertion of class identity (rule:admit-identity-reviewer-only). evaluateCompetence returns allowed: false. This vector exists specifically to pin: a structurally valid signature does NOT imply signer competence.",
      subject: 'signer_competence',
      payload: incompetentPayload,
    },
  ];
}

function stripField<T extends Record<string, unknown>>(
  obj: T,
  field: keyof T & string,
): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...obj };
  delete copy[field];
  return copy;
}

export interface VectorFile {
  filename: string;
  content: ConformanceVector;
}

export function listVectorFiles(): VectorFile[] {
  const vectors = buildVectors();
  return vectors.map((v) => ({
    filename: filenameFor(v),
    content: v,
  }));
}

function filenameFor(v: ConformanceVector): string {
  // Stable filenames matching the Phase 8 spec.
  switch (v.case_name) {
    case 'valid_observation_assertion':
      return 'valid-assertion.json';
    case 'invalid_assertion_unknown_class':
      return 'invalid-assertion-unknown-class.json';
    case 'valid_recall_request_public_discord':
      return 'valid-recall-request.json';
    case 'invalid_recall_request_missing_actor_id':
      return 'invalid-recall-request-missing-actor-id.json';
    case 'valid_recall_receipt_public_discord':
      return 'valid-recall-receipt.json';
    case 'invalid_recall_receipt_missing_receipt_hash':
      return 'invalid-recall-receipt-missing-receipt-hash.json';
    case 'valid_audit_event_chain_consistent':
      return 'valid-audit-event.json';
    case 'invalid_audit_event_tampered_hash':
      return 'invalid-audit-event-tampered-hash.json';
    case 'policy_decision_allowed_admit_observation':
      return 'policy-decision-allowed.json';
    case 'policy_decision_denied_unknown_signer':
      return 'policy-decision-denied.json';
    case 'keyring_signer_competent_for_admit_observation':
      return 'keyring-signer-competent.json';
    case 'keyring_signer_incompetent_role_not_in_required_roles':
      return 'keyring-signer-incompetent.json';
    default:
      throw new Error(`hounfour-conformance: no filename mapping for case ${v.case_name}`);
  }
}

export interface WriteResult {
  outDir: string;
  written: string[];
}

export function writeVectorFiles(outDir: string = DEFAULT_OUT_DIR): WriteResult {
  const files = listVectorFiles();
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const f of files) {
    const target = resolve(outDir, f.filename);
    writeFileSync(target, `${JSON.stringify(f.content, null, 2)}\n`, 'utf8');
    written.push(target);
  }
  return { outDir, written };
}

try {
  const { outDir, written } = writeVectorFiles();
  for (const p of written) console.log(`wrote ${p}`);
  console.log(`\n${written.length} Hounfour conformance vectors written to ${outDir}`);
  console.log('reminder: these are LOCAL conformance vectors, not canonical Hounfour schemas.');
} catch (err) {
  console.error('hounfour-conformance export failed:', err);
  process.exitCode = 1;
}
