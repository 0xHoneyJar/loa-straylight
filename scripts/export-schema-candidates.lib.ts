// Phase 6 — schema candidate exporter library.
//
// Builds a small Straylight estate run-through (admit / challenge / revoke /
// recall) using fixed timestamps and the existing public API, then exposes
// helpers that tests / the CLI use to write the produced objects to disk
// under fixtures/schema-candidates/.
//
// These produced JSON files are EXAMPLES OF CURRENT OBJECT SHAPE — not
// canonical Hounfour schemas. See docs/schema-candidates/README.md for
// what these fixtures are and what they are not.
//
// The library is deliberately small: no schema-generation dependency, no
// generic JSON-Schema emit, no cross-repo writes. It only:
//   1. constructs concrete Straylight objects via the public package API
//   2. assembles a mapping of filename → object
//   3. (when called) writes them to the requested output directory
//
// Re-running with the same inputs produces byte-identical output.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EstateStore,
  computeCommitmentRoot,
  executeRecall,
  policyForAdmitAssertion,
  validateCandidateAssertion,
  type Actor,
  type ActorEstate,
  type Assertion,
  type AuditEvent,
  type CommitmentRoot,
  type Keyring,
  type PolicyDecision,
  type RecallPack,
  type RecallReceipt,
  type RecallRequest,
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
export const DEFAULT_OUT_DIR = resolve(ROOT, 'fixtures', 'schema-candidates');

// Deterministic timeline so re-running the export produces stable IDs.
const T = {
  observation:    '2026-05-05T10:00:00Z',
  reflection:     '2026-05-05T10:10:00Z',
  doomed:         '2026-05-05T10:20:00Z',
  challenge:      '2026-05-05T11:00:00Z',
  revoke:         '2026-05-05T11:30:00Z',
  recall_public:  '2026-05-05T12:30:00Z',
  recall_unknown: '2026-05-05T12:35:00Z',
  commitment:     '2026-05-05T13:00:00Z',
} as const;

export interface SchemaCandidateBundle {
  actor: Actor;
  estate: ActorEstate;
  keyring: Keyring;
  observation: Assertion;
  reflectionContested: Assertion;
  revoked: Assertion;
  recallRequest: RecallRequest;
  recallPack: RecallPack;
  recallReceipt: RecallReceipt;
  auditEventTransition: AuditEvent;
  policyDecisionDenied: PolicyDecision;
  commitmentRoot: CommitmentRoot;
}

export function buildCandidates(): SchemaCandidateBundle {
  const actor = loadActor();
  const estate = loadEstate();
  const keyring = loadKeyring();

  const store = new EstateStore({ actor, estate, keyring });

  // 1. An active observation — the canonical "active assertion" example.
  const observationOut = store.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'User asked the agent about its preferred answer style.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.observation,
    }),
    T.observation,
  );
  if (!observationOut.ok || !observationOut.assertion) {
    throw new Error('export: observation admit failed unexpectedly');
  }

  // 2. A reflection that gets challenged → status: 'contested'.
  const reflectionOut = store.admit(
    buildCandidate({
      assertion_class: 'reflection',
      body: { text: 'Single weak observation may not justify treating user as untrustworthy.' },
      privacy_scope: 'tenant',
      risk_level: 'medium',
      signer: SIGNERS.runtime,
      signed_at: T.reflection,
    }),
    T.reflection,
  );
  if (!reflectionOut.ok || !reflectionOut.assertion) {
    throw new Error('export: reflection admit failed unexpectedly');
  }
  const reflectionId = reflectionOut.assertion.assertion_id;

  const reviewerSig = buildCandidate({
    assertion_class: 'challenge',
    body: { target: reflectionId, kind: 'mark_contested' },
    signer: SIGNERS.reviewer,
    signed_at: T.challenge,
  }).signatures[0]!;

  const challengeOut = store.challenge({
    target_assertion_id: reflectionId,
    challenge: {
      challenge_type: 'unsupported',
      requested_effect: 'mark_contested',
      evidence_refs: reflectionOut.assertion.provenance,
      explanation: 'Single weak observation does not support reflection conclusion.',
      signatures: [reviewerSig],
    },
    now: T.challenge,
  });
  if (!challengeOut.ok || !challengeOut.updated_target) {
    throw new Error('export: challenge failed unexpectedly');
  }
  const reflectionContested = challengeOut.updated_target;

  // 3. A separate assertion that gets revoked → status: 'revoked'.
  const doomedOut = store.admit(
    buildCandidate({
      assertion_class: 'preference',
      body: { text: 'Stale preference scheduled to be revoked.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
      signed_at: T.doomed,
    }),
    T.doomed,
  );
  if (!doomedOut.ok || !doomedOut.assertion) {
    throw new Error('export: doomed preference admit failed unexpectedly');
  }
  const doomedId = doomedOut.assertion.assertion_id;

  const revokeSig = buildCandidate({
    assertion_class: 'revocation',
    body: { target: doomedId, kind: 'revoke' },
    signer: SIGNERS.operator,
    signed_at: T.revoke,
  }).signatures[0]!;

  const revokeOut = store.revoke({
    target_assertion_id: doomedId,
    revocation: {
      reason: 'superseded_by_new_policy_guidance',
      signatures: [revokeSig],
    },
    now: T.revoke,
  });
  if (!revokeOut.ok || !revokeOut.updated_target) {
    throw new Error('export: revoke failed unexpectedly');
  }
  const revoked = revokeOut.updated_target;

  // 4. A public_discord recall request + pack + receipt.
  const recallRequest = buildRecallRequest({
    task: 'public discord answer about the agent\'s answer style',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation', 'preference', 'reflection'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_public,
  });
  const recallOut = executeRecall(store, recallRequest, T.recall_public);
  if (!recallOut.ok || !recallOut.pack || !recallOut.receipt) {
    throw new Error('export: public_discord recall failed unexpectedly');
  }
  const recallPack = recallOut.pack;
  const recallReceipt = recallOut.receipt;

  // 5. Pick the canonical "audit event over a transition" example.
  const transitionEvent = store.auditLog
    .listFor(estate.estate_id)
    .find((e) => e.event_type === 'assertion_challenged');
  if (!transitionEvent) {
    throw new Error('export: expected an assertion_challenged audit event');
  }

  // 6. A policy-deny example: try to admit signed by an unknown signer.
  //    Class validation passes; policy denies on signer competence.
  const unknownCandidate = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'unknown-signer denied admission example' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.unknown,
    signed_at: T.recall_unknown,
  });
  const unknownClassValidation = validateCandidateAssertion(unknownCandidate);
  const policyDecisionDenied = policyForAdmitAssertion({
    candidate: unknownCandidate,
    class_validation: unknownClassValidation,
    keyring,
    now: T.recall_unknown,
  });
  if (policyDecisionDenied.decision === 'allow') {
    throw new Error('export: expected unknown-signer admit to be denied');
  }

  // 7. A local commitment root over the recall receipt.
  const commitmentRoot = computeCommitmentRoot({
    actor_id: actor.actor_id,
    estate_id: estate.estate_id,
    commitment_type: 'recall_receipt',
    refs: [recallReceipt.receipt_id, recallReceipt.recall_pack_id, recallReceipt.recall_request_id],
    payload_summaries: [recallReceipt.pack_hash, recallReceipt.receipt_hash],
    created_by: 'operator:eileen',
    created_by_type: 'operator',
    created_by_key_ref: 'dev-key:operator:eileen',
    created_at: T.commitment,
  });

  return {
    actor,
    estate,
    keyring,
    observation: observationOut.assertion,
    reflectionContested,
    revoked,
    recallRequest,
    recallPack,
    recallReceipt,
    auditEventTransition: transitionEvent,
    policyDecisionDenied,
    commitmentRoot,
  };
}

export interface CandidateFile {
  filename: string;
  content: unknown;
}

export function listCandidateFiles(bundle: SchemaCandidateBundle): CandidateFile[] {
  return [
    { filename: 'actor.json', content: bundle.actor },
    { filename: 'estate.json', content: bundle.estate },
    { filename: 'keyring.json', content: bundle.keyring },
    { filename: 'assertion-observation.json', content: bundle.observation },
    { filename: 'assertion-reflection-contested.json', content: bundle.reflectionContested },
    { filename: 'assertion-revoked.json', content: bundle.revoked },
    { filename: 'recall-request-public-discord.json', content: bundle.recallRequest },
    { filename: 'recall-pack-public-discord.json', content: bundle.recallPack },
    { filename: 'recall-receipt-public-discord.json', content: bundle.recallReceipt },
    { filename: 'audit-event-transition.json', content: bundle.auditEventTransition },
    { filename: 'policy-decision-denied.json', content: bundle.policyDecisionDenied },
    { filename: 'commitment-root.json', content: bundle.commitmentRoot },
  ];
}

export interface WriteResult {
  outDir: string;
  written: string[];
}

export function writeCandidateFiles(outDir: string = DEFAULT_OUT_DIR): WriteResult {
  const bundle = buildCandidates();
  const files = listCandidateFiles(bundle);
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const f of files) {
    const target = resolve(outDir, f.filename);
    writeFileSync(target, `${JSON.stringify(f.content, null, 2)}\n`, 'utf8');
    written.push(target);
  }
  return { outDir, written };
}
