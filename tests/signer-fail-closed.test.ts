// Acceptance: an unknown signer or a signer who is known but NOT competent
// for the requested transition must FAIL CLOSED. No happy-path fallthrough,
// no warnings-only, no implicit allow. Every denial must produce a denied-
// transition audit event so the gate is visible to operators.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  evaluateCompetence,
  executeRecall,
  policyForAdmitAssertion,
  validateCandidateAssertion,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-05T12:00:00Z';

function makeStore(): EstateStore {
  return new EstateStore({ actor: loadActor(), estate: loadEstate(), keyring: loadKeyring() });
}

describe('unknown / incompetent / revoked signers fail closed', () => {
  it('unknown signer cannot admit an observation', () => {
    const store = makeStore();
    const candidate = buildCandidate({
      assertion_class: 'observation',
      body: { text: 'observed something' },
      signer: SIGNERS.unknown,
    });
    const cv = validateCandidateAssertion(candidate);
    expect(cv.valid).toBe(true);

    const decision = policyForAdmitAssertion({
      candidate,
      class_validation: cv,
      keyring: store.getKeyring(),
      now: NOW,
    });
    expect(decision.decision).toBe('deny');
    expect(decision.signer_competence_result.allowed).toBe(false);
    expect(decision.signer_competence_result.reason).toMatch(/unknown_signer/);

    const outcome = store.admit(candidate, NOW);
    expect(outcome.ok).toBe(false);
    expect(outcome.assertion).toBeUndefined();
    // A denied admit must still emit a transition_denied audit event.
    const audit = store.auditLog.list();
    expect(audit.some((e) => e.event_type === 'transition_denied')).toBe(true);
  });

  it('runtime signer is not competent to admit identity (forbid + missing role)', () => {
    const store = makeStore();
    const candidate = buildCandidate({
      assertion_class: 'identity',
      body: { attribute: 'role', value: 'agent' },
      risk_level: 'high',
      signer: SIGNERS.runtime,
    });
    const cv = validateCandidateAssertion(candidate);
    expect(cv.valid).toBe(true);

    const competence = evaluateCompetence(store.getKeyring(), {
      transition_type: 'admit_assertion',
      signatures: candidate.signatures,
      assertion_class: 'identity',
      now: NOW,
    });
    expect(competence.allowed).toBe(false);
    // Either forbid_signer_roles fired or required_signer_roles excluded runtime.
    expect(competence.reason).toMatch(/signer_role_(forbidden|not_competent)/);

    const decision = policyForAdmitAssertion({
      candidate,
      class_validation: cv,
      keyring: store.getKeyring(),
      now: NOW,
    });
    expect(decision.decision).toBe('deny');

    const outcome = store.admit(candidate, NOW);
    expect(outcome.ok).toBe(false);
    expect(outcome.assertion).toBeUndefined();
  });

  it('revoked operator key cannot admit even an observation it is structurally allowed to admit', () => {
    const store = makeStore();
    const candidate = buildCandidate({
      assertion_class: 'observation',
      body: { text: 'observation from revoked operator' },
      signer: SIGNERS.operator_revoked,
    });
    const competence = evaluateCompetence(store.getKeyring(), {
      transition_type: 'admit_assertion',
      signatures: candidate.signatures,
      assertion_class: 'observation',
      now: NOW,
    });
    expect(competence.allowed).toBe(false);
    expect(competence.reason).toMatch(/key_revoked|signer_status_revoked/);

    const outcome = store.admit(candidate, NOW);
    expect(outcome.ok).toBe(false);

    const audit = store.auditLog.list();
    expect(audit.some((e) => e.event_type === 'transition_denied')).toBe(true);
  });

  it('recall with unknown signer is denied and emits a denied audit event', () => {
    const store = makeStore();
    const req = buildRecallRequest({
      task: 'public discord answer',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['observation'],
      signer: SIGNERS.unknown,
    });
    const out = executeRecall(store, req, NOW);
    expect(out.ok).toBe(false);
    expect(out.pack).toBeUndefined();
    expect(out.policy_decision.decision).not.toBe('allow');
    expect(out.audit_event_id).toBeDefined();

    const audit = store.auditLog.list();
    expect(audit.some((e) => e.event_type === 'transition_denied' && e.payload?.['kind'] === 'recall_denied')).toBe(true);
  });

  it('recall with valid signer but signature tampered with fails closed', () => {
    const store = makeStore();
    const req = buildRecallRequest({
      task: 'tampered recall',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['observation'],
      signer: SIGNERS.operator,
    });
    // Tamper: flip a character in the signature payload hash so verification fails.
    const tampered = {
      ...req,
      signature: {
        ...req.signature,
        signed_payload_hash: req.signature.signed_payload_hash.replace(/.$/, '0'),
      },
    };
    const out = executeRecall(store, tampered, NOW);
    expect(out.ok).toBe(false);
    expect(out.policy_decision.decision).toBe('deny');
    expect(out.policy_decision.reasons.some((r) => r.startsWith('signature_invalid:'))).toBe(true);
  });
});
