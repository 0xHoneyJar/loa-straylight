// Fixture builders for the Straylight Recall Wedge MVP.
//
// Tests load a base actor/estate/keyring from JSON, then build candidate
// assertions and pre-seed status-mutated assertions deterministically.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  type Actor,
  type ActorEstate,
  type Assertion,
  type AssertionClass,
  type AssertionStatus,
  type CandidateAssertion,
  type Keyring,
  type PrivacyScope,
  type ProvenanceRef,
  type RecallRequest,
  type RiskLevel,
  type SignerType,
  payloadHash,
  contentId,
  devSign,
  assertionSignedPayload,
  recallSignedPayload,
} from '../src/straylight/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));

export function loadActor(): Actor {
  return readJson<Actor>('actor.json');
}

export function loadEstate(): ActorEstate {
  return readJson<ActorEstate>('estate.json');
}

export function loadKeyring(): Keyring {
  return readJson<Keyring>('keyring.json');
}

function readJson<T>(name: string): T {
  const p = resolve(HERE, name);
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

export interface CandidateInput {
  estate_id?: string;
  actor_id?: string;
  assertion_class: AssertionClass;
  body: Record<string, unknown>;
  privacy_scope?: PrivacyScope;
  risk_level?: RiskLevel;
  recall_scope?: string[];
  confidence?: number;
  signer: SignerSpec;
  provenance?: ProvenanceRef[];
  signed_at?: string;
}

export interface SignerSpec {
  signer_id: string;
  signer_type: SignerType;
  key_ref: string;
}

export const DEFAULT_PROVENANCE: ProvenanceRef[] = [
  {
    provenance_id: 'prov:fixture-default',
    source_type: 'operator_input',
    observed_at: '2026-05-05T11:00:00Z',
    captured_by: 'operator:eileen',
    evidence_summary: 'fixture default operator-input provenance',
  },
];

export const MODEL_OUTPUT_PROVENANCE: ProvenanceRef[] = [
  {
    provenance_id: 'prov:fixture-model-output',
    source_type: 'model_output',
    observed_at: '2026-05-05T11:00:00Z',
    captured_by: 'runtime:finn',
    evidence_summary: 'fixture model-output-only provenance',
  },
];

export function buildCandidate(input: CandidateInput): CandidateAssertion {
  const estate_id = input.estate_id ?? 'estate:satoshi-demo';
  const actor_id = input.actor_id ?? 'agent:satoshi-demo';
  const provenance = input.provenance ?? DEFAULT_PROVENANCE;
  const signed_at = input.signed_at ?? '2026-05-05T11:00:00Z';
  const signed_payload = assertionSignedPayload({
    estate_id,
    actor_id,
    assertion_class: input.assertion_class,
    body: input.body,
    provenance,
    privacy_scope: input.privacy_scope,
    risk_level: input.risk_level,
  });
  const sig = devSign({
    signer_id: input.signer.signer_id,
    signer_type: input.signer.signer_type,
    key_ref: input.signer.key_ref,
    payload: signed_payload,
    signed_at,
  });
  return {
    estate_id,
    actor_id,
    assertion_class: input.assertion_class,
    body: input.body,
    schema_version: '0.1.0',
    provenance,
    privacy_scope: input.privacy_scope,
    risk_level: input.risk_level,
    recall_scope: input.recall_scope,
    confidence: input.confidence,
    signatures: [sig],
  };
}

export interface SeededAssertionInput extends CandidateInput {
  status: AssertionStatus;
  created_at?: string;
}

// Build an Assertion already in a non-active status (e.g. revoked, sealed).
// Used by tests that want to verify recall behavior without first running
// a full challenge/revoke transition.
export function buildSeededAssertion(input: SeededAssertionInput): Assertion {
  const candidate = buildCandidate(input);
  const body_hash = payloadHash(candidate.body);
  const created_at = input.created_at ?? '2026-05-05T11:00:00Z';
  const assertion_id = contentId(
    { body_hash, status: input.status, candidate, created_at },
    { prefix: 'asrt' },
  );
  return {
    assertion_id,
    estate_id: candidate.estate_id,
    actor_id: candidate.actor_id,
    assertion_class: candidate.assertion_class,
    status: input.status,
    body: candidate.body,
    body_hash,
    schema_version: candidate.schema_version ?? '0.1.0',
    provenance: candidate.provenance,
    privacy_scope: candidate.privacy_scope ?? 'tenant',
    risk_level: candidate.risk_level ?? 'low',
    recall_scope: candidate.recall_scope,
    confidence: candidate.confidence,
    signatures: candidate.signatures,
    created_at,
    updated_at: created_at,
  };
}

export interface RecallRequestInput {
  task: string;
  environment_frame: RecallRequest['environment_frame'];
  risk_profile: RiskLevel;
  requested_classes?: AssertionClass[];
  excluded_classes?: AssertionClass[];
  include_statuses?: AssertionStatus[];
  mark_statuses?: AssertionStatus[];
  exclude_statuses?: AssertionStatus[];
  include_receipt_detail?: RecallRequest['include_receipt_detail'];
  include_provenance?: boolean;
  max_items?: number;
  signer: SignerSpec;
  signed_at?: string;
  request_id?: string;
}

export function buildRecallRequest(input: RecallRequestInput): RecallRequest {
  const signed_at = input.signed_at ?? '2026-05-05T12:00:00Z';
  const recall_request_id = input.request_id ?? `rreq_${input.task.replace(/[^a-z0-9]+/gi, '-').slice(0, 32)}-${signed_at}`;
  const payload = recallSignedPayload({
    actor_id: 'agent:satoshi-demo',
    estate_id: 'estate:satoshi-demo',
    task: input.task,
    environment_frame: input.environment_frame,
    risk_profile: input.risk_profile,
  });
  const sig = devSign({
    signer_id: input.signer.signer_id,
    signer_type: input.signer.signer_type,
    key_ref: input.signer.key_ref,
    payload,
    signed_at,
  });
  return {
    recall_request_id,
    actor_id: 'agent:satoshi-demo',
    estate_id: 'estate:satoshi-demo',
    requested_by: input.signer.signer_id,
    task: input.task,
    environment_frame: input.environment_frame,
    risk_profile: input.risk_profile,
    requested_classes: input.requested_classes,
    excluded_classes: input.excluded_classes,
    include_statuses: input.include_statuses,
    mark_statuses: input.mark_statuses,
    exclude_statuses: input.exclude_statuses,
    include_receipt_detail: input.include_receipt_detail ?? 'standard',
    include_provenance: input.include_provenance,
    max_items: input.max_items,
    signature: sig,
    created_at: signed_at,
  };
}

// Pre-built signer specs for fixture-based tests.
export const SIGNERS = {
  operator: {
    signer_id: 'operator:eileen',
    signer_type: 'operator',
    key_ref: 'dev-key:operator:eileen',
  } as SignerSpec,
  runtime: {
    signer_id: 'runtime:finn',
    signer_type: 'runtime',
    key_ref: 'dev-key:runtime:finn',
  } as SignerSpec,
  reviewer: {
    signer_id: 'reviewer:dixie',
    signer_type: 'reviewer',
    key_ref: 'dev-key:reviewer:dixie',
  } as SignerSpec,
  operator_revoked: {
    signer_id: 'operator:revoked',
    signer_type: 'operator',
    key_ref: 'dev-key:operator:revoked',
  } as SignerSpec,
  unknown: {
    signer_id: 'operator:not-on-keyring',
    signer_type: 'operator',
    key_ref: 'dev-key:not-on-keyring',
  } as SignerSpec,
};
