// Acceptance: class validation must be SEPARATE from policy validation.
//
// A structurally invalid object never reaches policy. A structurally valid
// object can still be rejected by policy. The two layers must produce distinct
// error surfaces, never collapse into one another.

import { describe, expect, it } from 'vitest';
import {
  policyForAdmitAssertion,
  validateCandidateAssertion,
  type CandidateAssertion,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  loadKeyring,
  DEFAULT_PROVENANCE,
} from '../fixtures/index.js';

const NOW = '2026-05-05T12:00:00Z';
const keyring = loadKeyring();

describe('class validation vs policy validation are separate gates', () => {
  it('class validation rejects a structurally invalid candidate without invoking policy', () => {
    const broken = {
      // missing estate_id, actor_id
      assertion_class: 'observation',
      body: { text: 'a real observation' },
      provenance: DEFAULT_PROVENANCE,
      signatures: [],
    } as unknown as CandidateAssertion;

    const cv = validateCandidateAssertion(broken);
    expect(cv.valid).toBe(false);
    expect(cv.errors.map((e) => e.path)).toEqual(
      expect.arrayContaining(['estate_id', 'actor_id', 'signatures']),
    );
    // None of the class-validation errors should be policy-shaped.
    for (const err of cv.errors) {
      expect(err.code).not.toBe('class_specific'); // note: we treat shape errors as 'missing_field'/'invalid_*' here
    }
  });

  it('class validation passes a candidate even when it would fail policy (signer-not-competent)', () => {
    // runtime tries to admit an `identity` assertion. Class shape is fine.
    const candidate = buildCandidate({
      assertion_class: 'identity',
      body: { attribute: 'role', value: 'demo agent' },
      privacy_scope: 'tenant',
      risk_level: 'high',
      signer: SIGNERS.runtime,
    });
    const cv = validateCandidateAssertion(candidate);
    expect(cv.valid).toBe(true); // structural shape OK

    const decision = policyForAdmitAssertion({
      candidate,
      class_validation: cv,
      keyring,
      now: NOW,
    });
    expect(decision.decision).toBe('deny');
    expect(decision.reasons.join(' ')).toMatch(/competence/);
    expect(decision.signer_competence_result.allowed).toBe(false);
    // The policy decision schema must reference a policy id distinct from the
    // class-validation schema id (no collapsing the two layers).
    expect(decision.policy_id).not.toBe(cv.schema_id);
    expect(typeof decision.policy_id).toBe('string');
    expect(decision.policy_id.length).toBeGreaterThan(0);
  });

  it('policy denial does NOT mutate or invalidate the underlying class validation result', () => {
    const candidate = buildCandidate({
      assertion_class: 'identity',
      body: { attribute: 'role', value: 'agent' },
      risk_level: 'high',
      signer: SIGNERS.runtime,
    });
    const cv = validateCandidateAssertion(candidate);
    const decision = policyForAdmitAssertion({ candidate, class_validation: cv, keyring, now: NOW });
    expect(cv.valid).toBe(true);
    expect(decision.decision).toBe('deny');
    // Re-validating after policy must give the same class validation result.
    const cv2 = validateCandidateAssertion(candidate);
    expect(cv2).toEqual(cv);
  });

  it('class validation failure produces deterministic error codes; policy carries decision-shape fields', () => {
    const broken: CandidateAssertion = {
      estate_id: 'estate:satoshi-demo',
      actor_id: 'agent:satoshi-demo',
      assertion_class: 'observation',
      body: { text: '' }, // class-specific failure: empty text
      provenance: [],     // shape failure: provenance required
      signatures: [],
    };
    const cv = validateCandidateAssertion(broken);
    expect(cv.valid).toBe(false);
    const codes = cv.errors.map((e) => e.code);
    expect(codes).toContain('missing_field'); // for provenance/signatures
    expect(codes).toContain('class_specific'); // for body.text empty

    // Sending it to policy should still produce a policy-shaped decision
    // (deny with class_validation_failed reason), not throw.
    const decision = policyForAdmitAssertion({ candidate: broken, class_validation: cv, keyring, now: NOW });
    expect(decision.decision).toBe('deny');
    expect(decision.reasons[0]).toBe('class_validation_failed');
    expect(decision).toHaveProperty('signer_competence_result');
    expect(decision).toHaveProperty('policy_id');
    expect(decision).toHaveProperty('policy_version');
    expect(decision).toHaveProperty('decided_at');
  });
});
