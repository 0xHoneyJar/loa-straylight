// Acceptance §17.6 + §19.3: when policy is unavailable for a transition
// (no rule loaded, malformed engine state, or thrown error), the engine
// MUST deny — never fall through to a permissive default. High-risk
// transitions specifically must be denied with a recognizable reason.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  type Keyring,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-05T12:00:00Z';

function emptyRulesKeyring(): Keyring {
  const k = loadKeyring();
  return { ...k, competence_rules: [] };
}

describe('policy unavailable fails closed', () => {
  it('no competence rule loaded → high-risk admission denied with policy_unavailable_for_transition', () => {
    const store = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: emptyRulesKeyring(),
    });
    const out = store.admit(
      buildCandidate({
        assertion_class: 'identity',
        body: { attribute: 'role', value: 'agent' },
        risk_level: 'high',
        signer: SIGNERS.reviewer,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.policy_decision.decision).toBe('deny');
    expect(out.policy_decision.reasons).toContain('policy_unavailable_for_transition');
    expect(out.policy_decision.signer_competence_result.allowed).toBe(false);
    expect(out.policy_decision.signer_competence_result.reason).toBe('no_competence_rule_for_transition');
    // Audit event emitted (gate visible to operators).
    const auditEvents = store.auditLog.list();
    expect(auditEvents.some((e) => e.event_type === 'transition_denied')).toBe(true);
    // Receipt persisted with kind=denied.
    expect(out.receipt.kind).toBe('denied');
  });

  it('no rule for low-risk admission still fails closed — no permissive fall-through', () => {
    const store = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: emptyRulesKeyring(),
    });
    const out = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'low risk should still be denied' },
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.policy_decision.reasons).toContain('policy_unavailable_for_transition');
  });

  it('a competence rule with no allowed roles denies even matching signer types', () => {
    const k = loadKeyring();
    // Replace the observation admit rule with one that has no roles.
    const rules = k.competence_rules.filter(
      (r) => !(r.transition_type === 'admit_assertion' && r.assertion_class === 'observation'),
    );
    const broken: Keyring = {
      ...k,
      competence_rules: [
        ...rules,
        {
          rule_id: 'rule:observation-empty-roles',
          transition_type: 'admit_assertion',
          assertion_class: 'observation',
          required_signer_roles: [],
        },
      ],
    };
    const store = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: broken,
    });
    const out = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'no roles allowed' },
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    // No role matched: reason starts with `competence:signer_role_not_competent`.
    const allReasons = out.policy_decision.reasons.join(' ');
    expect(allReasons).toMatch(/competence:signer_role_not_competent/);
  });
});
