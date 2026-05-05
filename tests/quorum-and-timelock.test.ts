// Acceptance: competence rules with quorum / timelock_seconds /
// requires_human_review behave per §10. All three default to "off" when the
// rule field is omitted (Phase 1 behavior preserved).

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  type Keyring,
  type SignerCompetenceRule,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-05T12:00:00Z';
const TEN_MIN_EARLIER = '2026-05-05T11:50:00Z';

function withRule(rule: SignerCompetenceRule, transition_type: SignerCompetenceRule['transition_type'] = 'admit_assertion'): Keyring {
  const k = loadKeyring();
  // Drop the existing matching rule(s) so the new one is the only candidate.
  const rules = k.competence_rules.filter((r) => {
    if (r.transition_type !== transition_type) return true;
    if (rule.assertion_class && r.assertion_class !== rule.assertion_class) return true;
    return false;
  });
  return { ...k, competence_rules: [...rules, rule] };
}

function makeStore(keyring: Keyring): EstateStore {
  return new EstateStore({ actor: loadActor(), estate: loadEstate(), keyring });
}

describe('quorum', () => {
  it('quorum=2: a single competent signer is denied with quorum_not_met', () => {
    const keyring = withRule({
      rule_id: 'rule:claim-quorum-2',
      transition_type: 'admit_assertion',
      assertion_class: 'claim',
      required_signer_roles: ['operator', 'reviewer'],
      quorum: 2,
    });
    const store = makeStore(keyring);
    const out = store.admit(
      buildCandidate({
        assertion_class: 'claim',
        body: { text: 'needs quorum' },
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.policy_decision.signer_competence_result.allowed).toBe(false);
    expect(out.policy_decision.signer_competence_result.reason).toMatch(/^quorum_not_met:2:1$/);
    expect(out.policy_decision.signer_competence_result.quorum_required).toBe(2);
    expect(out.policy_decision.signer_competence_result.quorum_present).toBe(1);
  });

  it('quorum=2: two distinct competent signers are allowed', () => {
    const keyring = withRule({
      rule_id: 'rule:claim-quorum-2',
      transition_type: 'admit_assertion',
      assertion_class: 'claim',
      required_signer_roles: ['operator', 'reviewer'],
      quorum: 2,
    });
    const store = makeStore(keyring);

    // Build a candidate with two signatures over the same payload — operator + reviewer.
    const operatorCandidate = buildCandidate({
      assertion_class: 'claim',
      body: { text: 'two-of-two' },
      signer: SIGNERS.operator,
    });
    const reviewerCandidate = buildCandidate({
      assertion_class: 'claim',
      body: { text: 'two-of-two' },
      signer: SIGNERS.reviewer,
    });
    const candidate = {
      ...operatorCandidate,
      signatures: [...operatorCandidate.signatures, ...reviewerCandidate.signatures],
    };

    const out = store.admit(candidate, NOW);
    expect(out.ok).toBe(true);
    expect(out.policy_decision.signer_competence_result.quorum_present).toBe(2);
  });

  it('quorum=2: same signer signing twice does not count as two distinct signers', () => {
    const keyring = withRule({
      rule_id: 'rule:claim-quorum-2',
      transition_type: 'admit_assertion',
      assertion_class: 'claim',
      required_signer_roles: ['operator', 'reviewer'],
      quorum: 2,
    });
    const store = makeStore(keyring);
    const operator = buildCandidate({
      assertion_class: 'claim',
      body: { text: 'self-quorum-attempt' },
      signer: SIGNERS.operator,
    });
    // Two operator signatures, distinct signature_ids, same signer_id.
    const candidate = {
      ...operator,
      signatures: [
        operator.signatures[0]!,
        { ...operator.signatures[0]!, signature_id: operator.signatures[0]!.signature_id + ':dup' },
      ],
    };
    const out = store.admit(candidate, NOW);
    expect(out.ok).toBe(false);
    expect(out.policy_decision.signer_competence_result.reason).toMatch(/^quorum_not_met:2:1$/);
  });
});

describe('timelock', () => {
  it('timelock_seconds=900: a freshly-signed transition is denied; an older signature succeeds', () => {
    const keyring = withRule({
      rule_id: 'rule:preference-timelock',
      transition_type: 'admit_assertion',
      assertion_class: 'preference',
      required_signer_roles: ['operator'],
      timelock_seconds: 900,
    });

    // Same NOW; fresh signature → not enough elapsed time.
    const fresh = makeStore(keyring).admit(
      buildCandidate({
        assertion_class: 'preference',
        body: { text: 'fresh signature' },
        signer: SIGNERS.operator,
        signed_at: NOW,
      }),
      NOW,
    );
    expect(fresh.ok).toBe(false);
    expect(fresh.policy_decision.signer_competence_result.reason).toMatch(/^timelock_pending:900:0$/);

    // Signature signed 10 minutes earlier — still under the 15-minute timelock.
    const tenMinAgo = makeStore(keyring).admit(
      buildCandidate({
        assertion_class: 'preference',
        body: { text: 'signed 10 min ago' },
        signer: SIGNERS.operator,
        signed_at: TEN_MIN_EARLIER,
      }),
      NOW,
    );
    expect(tenMinAgo.ok).toBe(false);
    expect(tenMinAgo.policy_decision.signer_competence_result.reason).toMatch(/^timelock_pending:900:600$/);

    // Signature signed 16 minutes earlier — past the timelock.
    const past = makeStore(keyring).admit(
      buildCandidate({
        assertion_class: 'preference',
        body: { text: 'signed 16 min ago' },
        signer: SIGNERS.operator,
        signed_at: '2026-05-05T11:44:00Z', // 16 min earlier
      }),
      NOW,
    );
    expect(past.ok).toBe(true);
    expect(past.policy_decision.signer_competence_result.timelock_seconds_elapsed).toBeGreaterThanOrEqual(900);
  });
});

describe('requires_human_review', () => {
  it('competent operator without reviewer co-sign → needs_review (not silent allow)', () => {
    const keyring = withRule({
      rule_id: 'rule:preference-reviewed',
      transition_type: 'admit_assertion',
      assertion_class: 'preference',
      required_signer_roles: ['operator', 'reviewer'],
      requires_human_review: true,
    });
    const store = makeStore(keyring);
    const out = store.admit(
      buildCandidate({
        assertion_class: 'preference',
        body: { text: 'needs reviewer' },
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.policy_decision.decision).toBe('needs_review');
    expect(out.policy_decision.required_next_actions).toContain('reviewer_co_sign');
    expect(out.policy_decision.signer_competence_result.allowed).toBe(true);
    expect(out.policy_decision.signer_competence_result.requires_review).toBe(true);
  });

  it('reviewer co-signs → allow', () => {
    const keyring = withRule({
      rule_id: 'rule:preference-reviewed',
      transition_type: 'admit_assertion',
      assertion_class: 'preference',
      required_signer_roles: ['operator', 'reviewer'],
      requires_human_review: true,
    });
    const store = makeStore(keyring);
    const opCandidate = buildCandidate({
      assertion_class: 'preference',
      body: { text: 'reviewer co-signed' },
      signer: SIGNERS.operator,
    });
    const reviewerCandidate = buildCandidate({
      assertion_class: 'preference',
      body: { text: 'reviewer co-signed' },
      signer: SIGNERS.reviewer,
    });
    const candidate = {
      ...opCandidate,
      signatures: [...opCandidate.signatures, ...reviewerCandidate.signatures],
    };
    const out = store.admit(candidate, NOW);
    expect(out.ok).toBe(true);
    expect(out.policy_decision.decision).toBe('allow');
    expect(out.policy_decision.signer_competence_result.requires_review).toBe(false);
  });
});
