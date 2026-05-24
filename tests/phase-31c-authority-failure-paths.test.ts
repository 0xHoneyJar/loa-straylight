// Phase 31C — Authority failure-path proofs.
//
// Phase 31A proved the *positive* invariant: governed transitions
// (admit / challenge / revoke / forget) build an estate that recall
// reads correctly. Phase 31C proves the corresponding *negative*
// invariant:
//
//     Only competent authority can mutate or recall estate state.
//
// For each governed transition the test exercises real EstateStore
// methods (`admit`, `challenge`, `revoke`, `forget`) and the real
// recall executor (`executeRecall`). It does NOT use `seedAssertion`
// or direct status mutation for the core proof; the only legitimate
// use of `admit` for setup is to land an authorized target so that a
// subsequent challenge/revoke/forget *attempt* by an incompetent
// signer has something to bounce off of.
//
// What the test pins down:
//
//   1. admit  — a schema-valid candidate signed by a signer who is
//               not competent for the requested assertion class is
//               denied; no assertion is admitted; the denial emits a
//               `denied` TransitionReceipt with the rejected signer
//               set + a `transition_denied` audit event.
//
//   2. challenge — an unknown signer cannot challenge an existing
//                  assertion; the target's status does not change;
//                  a `denied` TransitionReceipt is persisted.
//
//   3. revoke — a runtime signer is not competent to revoke; the
//               target stays `active`; a `denied` TransitionReceipt
//               is persisted; an *authorized* revoke afterwards
//               still succeeds (the denial did not break the seam).
//
//   4. forget — a runtime signer is not competent to forget; the
//               target stays `active`; a `denied` TransitionReceipt
//               is persisted.
//
//   5. recall — an unknown signer is denied; a revoked-key signer
//               is denied; and (when the keyring carries a
//               frame-specialized competence rule) an operator
//               caller is denied in a reviewer-only frame, while a
//               reviewer caller is allowed in the same frame. Each
//               denial emits a `transition_denied` audit event with
//               `payload.kind === 'recall_denied'`. Recall denials
//               are an audit-only seam today (no TransitionReceipt
//               is emitted for recall denials by the current model).
//
//   6. Non-transitivity — a runtime signer that *is* competent to
//      admit an observation is *not* automatically competent to
//      revoke that same observation. Authorization is per-transition,
//      not per-signer.
//
// Implementation notes:
//   * No production-code changes. This file is test-only.
//   * Frame-specialized recall rule is composed in-test via a
//     keyring override (same pattern as `quorum-and-timelock.test.ts`),
//     not by mutating fixtures or production code.
//   * Recall authority gap: the default `rule:recall-default` allows
//     {operator, runtime, reviewer} for every frame and risk profile.
//     The model already *supports* per-frame and per-risk recall
//     competence (via `SignerCompetenceRule.environment_frame` /
//     `risk_level` and the specificity ranking in
//     `findCompetenceRule`); it is only the default fixture rule
//     that is permissive. The "frame-specialized recall rule"
//     subtest below exercises the existing seam without inventing
//     new policy machinery.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  evaluateCompetence,
  executeRecall,
  policyForAdmitAssertion,
  policyForTransition,
  type Keyring,
  type SignatureEnvelope,
  type SignerCompetenceRule,
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

const NOW = '2026-05-24T12:00:00Z';

function makeStore(keyring?: Keyring): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: keyring ?? loadKeyring(),
  });
}

function challengeSigFor(target_id: string, signer = SIGNERS.reviewer): SignatureEnvelope {
  return buildCandidate({
    assertion_class: 'challenge',
    body: { target: target_id },
    signer,
  }).signatures[0]!;
}

function revocationSigFor(target_id: string, signer = SIGNERS.reviewer): SignatureEnvelope {
  return buildCandidate({
    assertion_class: 'revocation',
    body: { target: target_id },
    signer,
  }).signatures[0]!;
}

function forgetSigFor(target_id: string, signer = SIGNERS.reviewer): SignatureEnvelope {
  return buildCandidate({
    assertion_class: 'observation',
    body: { target: target_id, kind: 'forget_request' },
    signer,
  }).signatures[0]!;
}

// Replace the recall competence rule with a stricter one that gates
// `public_discord` to reviewers only. Other frames continue to use
// the default rule, which still allows operator + runtime.
function withRecallReviewerOnlyForPublicDiscord(): Keyring {
  const k = loadKeyring();
  const extra: SignerCompetenceRule = {
    rule_id: 'rule:recall-public-discord-reviewer-only',
    transition_type: 'recall_estate_context',
    environment_frame: 'public_discord',
    required_signer_roles: ['reviewer'],
  };
  return { ...k, competence_rules: [...k.competence_rules, extra] };
}

// ─── 1. admit_assertion authority ───────────────────────────────────────────

describe('Phase 31C — admit_assertion authority', () => {
  it('runtime is not competent to admit a `claim` (rule requires operator/reviewer)', () => {
    const store = makeStore();
    const candidate = buildCandidate({
      assertion_class: 'claim',
      body: { text: 'phase-31c: runtime tries to admit a claim' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.runtime,
    });

    // Schema-valid candidate.
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
    expect(decision.signer_competence_result.reason).toMatch(
      /signer_role_(forbidden|not_competent)/,
    );

    const out = store.admit(candidate, NOW);
    expect(out.ok).toBe(false);
    expect(out.assertion).toBeUndefined();

    // No active assertion was admitted to the estate.
    expect(store.listAssertions()).toHaveLength(0);

    // No `assertion_admitted` audit event slipped through.
    const audit = store.auditLog.list();
    expect(audit.some((e) => e.event_type === 'assertion_admitted')).toBe(false);
    expect(audit.some((e) => e.event_type === 'transition_denied')).toBe(true);

    // A denied TransitionReceipt was persisted with the rejected signer set
    // and the attempted transition_type / class recorded in metadata.
    const receipts = store.listTransitionReceipts();
    expect(receipts).toHaveLength(1);
    const r = receipts[0]!;
    expect(r.kind).toBe('denied');
    expect(r.decision).toBe('deny');
    expect(r.transition_type).toBe('admit_assertion');
    expect(r.signer_refs).toEqual(['runtime:finn']);
    expect(r.audit_event_ref).toBe(out.audit_event_id);
    expect(r.metadata?.['transition_type']).toBe('admit_assertion');
    expect(r.metadata?.['class']).toBe('claim');
    expect(r.receipt_hash.startsWith('sha256:')).toBe(true);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('runtime cannot admit a `preference` (rule requires operator/reviewer)', () => {
    const store = makeStore();
    const out = store.admit(
      buildCandidate({
        assertion_class: 'preference',
        body: { text: 'phase-31c: runtime tries to admit a preference' },
        privacy_scope: 'tenant',
        risk_level: 'low',
        signer: SIGNERS.runtime,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.assertion).toBeUndefined();
    expect(out.policy_decision.signer_competence_result.allowed).toBe(false);
    expect(out.receipt.kind).toBe('denied');
    expect(out.receipt.metadata?.['class']).toBe('preference');
  });
});

// ─── 2. challenge_assertion authority ───────────────────────────────────────

describe('Phase 31C — challenge_assertion authority', () => {
  it('unknown signer cannot challenge an existing assertion; target status is unchanged', () => {
    const store = makeStore();
    const seed = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'phase-31c: challenge target seed' },
        privacy_scope: 'tenant',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(seed.ok).toBe(true);
    const target_id = seed.assertion!.assertion_id;
    expect(store.getAssertion(target_id)?.status).toBe('active');

    const challenge = store.challenge({
      target_assertion_id: target_id,
      challenge: {
        challenge_type: 'unsupported',
        requested_effect: 'mark_contested',
        evidence_refs: [],
        explanation: 'phase-31c: unknown-signer challenge attempt',
        signatures: [challengeSigFor(target_id, SIGNERS.unknown)],
      },
      now: NOW,
    });
    expect(challenge.ok).toBe(false);
    expect(challenge.policy_decision.decision).toBe('deny');
    expect(challenge.updated_target).toBeUndefined();

    // Target status unchanged.
    expect(store.getAssertion(target_id)?.status).toBe('active');

    // No `assertion_challenged` audit event was emitted; a `transition_denied`
    // event was.
    const audit = store.auditLog.list();
    expect(audit.some((e) => e.event_type === 'assertion_challenged')).toBe(false);
    expect(
      audit.some(
        (e) =>
          e.event_type === 'transition_denied' &&
          (e.assertion_refs ?? []).includes(target_id),
      ),
    ).toBe(true);

    // Denied receipt shape.
    const denied = store
      .listTransitionReceipts()
      .find((r) => r.kind === 'denied' && r.transition_type === 'challenge_assertion');
    expect(denied).toBeDefined();
    expect(denied!.signer_refs).toEqual(['operator:not-on-keyring']);
    expect(denied!.target_refs).toContain(target_id);
    expect(denied!.metadata?.['transition_type']).toBe('challenge_assertion');
  });
});

// ─── 3. revoke_assertion authority ──────────────────────────────────────────

describe('Phase 31C — revoke_assertion authority', () => {
  it('runtime is not competent to revoke; target stays active; an authorized revoke afterwards still works', () => {
    const store = makeStore();
    const seed = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'phase-31c: revoke target seed' },
        privacy_scope: 'tenant',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(seed.ok).toBe(true);
    const target_id = seed.assertion!.assertion_id;

    // Cross-check at the policy layer that runtime is not competent
    // for revoke even though it is competent for admit_observation.
    const transitionDecision = policyForTransition({
      transition_type: 'revoke_assertion',
      signatures: [revocationSigFor(target_id, SIGNERS.runtime)],
      keyring: store.getKeyring(),
      target_class: 'observation',
      risk_level: 'high',
      now: NOW,
    });
    expect(transitionDecision.decision).toBe('deny');
    expect(transitionDecision.signer_competence_result.allowed).toBe(false);

    const denied = store.revoke({
      target_assertion_id: target_id,
      revocation: {
        reason: 'phase-31c: runtime tries to revoke',
        signatures: [revocationSigFor(target_id, SIGNERS.runtime)],
      },
      now: NOW,
    });
    expect(denied.ok).toBe(false);
    expect(denied.updated_target).toBeUndefined();
    expect(denied.policy_decision.decision).toBe('deny');

    // Target status untouched.
    expect(store.getAssertion(target_id)?.status).toBe('active');

    // Denied receipt persisted.
    const deniedReceipt = store
      .listTransitionReceipts()
      .find((r) => r.kind === 'denied' && r.transition_type === 'revoke_assertion');
    expect(deniedReceipt).toBeDefined();
    expect(deniedReceipt!.signer_refs).toEqual(['runtime:finn']);
    expect(deniedReceipt!.target_refs).toContain(target_id);

    // No `assertion_revoked` audit event was emitted by the failed attempt.
    const audit1 = store.auditLog.list();
    expect(audit1.some((e) => e.event_type === 'assertion_revoked')).toBe(false);
    expect(audit1.some((e) => e.event_type === 'transition_denied')).toBe(true);

    // The system is not jammed: an *authorized* revoke (reviewer) succeeds.
    const authorized = store.revoke({
      target_assertion_id: target_id,
      revocation: {
        reason: 'phase-31c: reviewer-authorized revoke',
        signatures: [revocationSigFor(target_id, SIGNERS.reviewer)],
      },
      now: NOW,
    });
    expect(authorized.ok).toBe(true);
    expect(authorized.updated_target?.status).toBe('revoked');
    expect(store.getAssertion(target_id)?.status).toBe('revoked');
  });
});

// ─── 4. forget_assertion_from_recall authority ──────────────────────────────

describe('Phase 31C — forget_assertion_from_recall authority', () => {
  it('runtime is not competent to forget; target stays active; denied receipt is persisted', () => {
    const store = makeStore();
    const seed = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'phase-31c: forget target seed' },
        privacy_scope: 'tenant',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(seed.ok).toBe(true);
    const target_id = seed.assertion!.assertion_id;

    const denied = store.forget({
      target_assertion_id: target_id,
      reason: 'phase-31c: runtime tries to forget',
      signatures: [forgetSigFor(target_id, SIGNERS.runtime)],
      now: NOW,
    });
    expect(denied.ok).toBe(false);
    expect(denied.updated_target).toBeUndefined();
    expect(denied.policy_decision.decision).toBe('deny');

    // Target status untouched.
    expect(store.getAssertion(target_id)?.status).toBe('active');

    // No `assertion_forgotten_from_recall` audit event emitted.
    const audit = store.auditLog.list();
    expect(
      audit.some((e) => e.event_type === 'assertion_forgotten_from_recall'),
    ).toBe(false);
    expect(audit.some((e) => e.event_type === 'transition_denied')).toBe(true);

    // Denied receipt persisted.
    const deniedReceipt = store
      .listTransitionReceipts()
      .find(
        (r) =>
          r.kind === 'denied' &&
          r.transition_type === 'forget_assertion_from_recall',
      );
    expect(deniedReceipt).toBeDefined();
    expect(deniedReceipt!.signer_refs).toEqual(['runtime:finn']);
    expect(deniedReceipt!.target_refs).toContain(target_id);
  });
});

// ─── 5. recall_estate_context authority ─────────────────────────────────────

describe('Phase 31C — recall_estate_context authority', () => {
  it('unknown signer cannot execute recall; emits transition_denied with kind=recall_denied', () => {
    const store = makeStore();
    const out = executeRecall(
      store,
      buildRecallRequest({
        task: 'phase-31c-unknown-signer-recall',
        environment_frame: 'private_operator',
        risk_profile: 'low',
        requested_classes: ['observation'],
        signer: SIGNERS.unknown,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.pack).toBeUndefined();
    expect(out.policy_decision.decision).toBe('deny');
    expect(out.audit_event_id).toBeDefined();

    const audit = store.auditLog.list();
    expect(
      audit.some(
        (e) =>
          e.event_type === 'transition_denied' &&
          (e.payload as Record<string, unknown> | undefined)?.['kind'] ===
            'recall_denied',
      ),
    ).toBe(true);

    // No `recall_pack_emitted` event sneaks through.
    expect(audit.some((e) => e.event_type === 'recall_pack_emitted')).toBe(false);
  });

  it('revoked operator key cannot execute recall', () => {
    const store = makeStore();

    // Cross-check at the keyring layer: the revoked key fails competence.
    const competence = evaluateCompetence(store.getKeyring(), {
      transition_type: 'recall_estate_context',
      signatures: [
        buildRecallRequest({
          task: 'phase-31c-revoked-recall-competence-check',
          environment_frame: 'private_operator',
          risk_profile: 'low',
          requested_classes: ['observation'],
          signer: SIGNERS.operator_revoked,
        }).signature,
      ],
      environment_frame: 'private_operator',
      risk_level: 'low',
      now: NOW,
    });
    expect(competence.allowed).toBe(false);
    expect(competence.reason).toMatch(/key_revoked|signer_status_revoked/);

    const out = executeRecall(
      store,
      buildRecallRequest({
        task: 'phase-31c-revoked-recall',
        environment_frame: 'private_operator',
        risk_profile: 'low',
        requested_classes: ['observation'],
        signer: SIGNERS.operator_revoked,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.pack).toBeUndefined();
    expect(out.policy_decision.decision).toBe('deny');

    const audit = store.auditLog.list();
    expect(
      audit.some(
        (e) =>
          e.event_type === 'transition_denied' &&
          (e.payload as Record<string, unknown> | undefined)?.['kind'] ===
            'recall_denied',
      ),
    ).toBe(true);
  });

  it('frame-specialized recall rule denies operator/runtime in a reviewer-only frame; reviewer is allowed', () => {
    // The default fixture keyring's `rule:recall-default` is permissive across
    // all frames. To exercise the existing per-frame seam (matched by
    // `findCompetenceRule` specificity), compose a stricter rule for
    // `public_discord` and verify the model honors it.
    const keyring = withRecallReviewerOnlyForPublicDiscord();

    // Operator is competent for recall under the default rule, but not under
    // the public_discord-specialized rule → deny.
    const operatorStore = makeStore(keyring);
    const operatorOut = executeRecall(
      operatorStore,
      buildRecallRequest({
        task: 'phase-31c-public-discord-operator',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation'],
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(operatorOut.ok).toBe(false);
    expect(operatorOut.policy_decision.decision).toBe('deny');
    expect(
      operatorOut.policy_decision.signer_competence_result.matched_rule_id,
    ).toBe('rule:recall-public-discord-reviewer-only');

    const operatorAudit = operatorStore.auditLog.list();
    expect(
      operatorAudit.some(
        (e) =>
          e.event_type === 'transition_denied' &&
          (e.payload as Record<string, unknown> | undefined)?.['kind'] ===
            'recall_denied',
      ),
    ).toBe(true);

    // Runtime is also denied under the same specialized rule.
    const runtimeStore = makeStore(keyring);
    const runtimeOut = executeRecall(
      runtimeStore,
      buildRecallRequest({
        task: 'phase-31c-public-discord-runtime',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation'],
        signer: SIGNERS.runtime,
      }),
      NOW,
    );
    expect(runtimeOut.ok).toBe(false);
    expect(runtimeOut.policy_decision.decision).toBe('deny');

    // Reviewer IS competent under the specialized rule → allow (subject to
    // `medium` risk not triggering the public-frame review escalation, which
    // only fires for high/critical risk).
    const reviewerStore = makeStore(keyring);
    const reviewerOut = executeRecall(
      reviewerStore,
      buildRecallRequest({
        task: 'phase-31c-public-discord-reviewer',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation'],
        signer: SIGNERS.reviewer,
      }),
      NOW,
    );
    expect(reviewerOut.ok).toBe(true);
    expect(reviewerOut.policy_decision.decision).toBe('allow');
  });
});

// ─── 6. Non-transitivity of competence ──────────────────────────────────────

describe('Phase 31C — competence is per-transition, not per-signer', () => {
  it('runtime can admit an observation but cannot revoke that same observation', () => {
    const store = makeStore();

    // 6a. Runtime IS competent for admit_observation.
    const admitted = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'phase-31c: runtime-admitted observation' },
        privacy_scope: 'tenant',
        risk_level: 'low',
        signer: SIGNERS.runtime,
      }),
      NOW,
    );
    expect(admitted.ok).toBe(true);
    const target_id = admitted.assertion!.assertion_id;

    // 6b. The same runtime signer is NOT competent for revoke_assertion.
    const denied = store.revoke({
      target_assertion_id: target_id,
      revocation: {
        reason: 'phase-31c: runtime tries to revoke its own admission',
        signatures: [revocationSigFor(target_id, SIGNERS.runtime)],
      },
      now: NOW,
    });
    expect(denied.ok).toBe(false);
    expect(denied.policy_decision.decision).toBe('deny');
    expect(store.getAssertion(target_id)?.status).toBe('active');

    // The denied revoke produced a denied TransitionReceipt; the original
    // admission receipt is still present and untouched.
    const receipts = store.listTransitionReceipts();
    const admitReceipt = receipts.find(
      (r) => r.kind === 'admission' && r.target_refs.includes(target_id),
    );
    expect(admitReceipt).toBeDefined();
    expect(admitReceipt!.decision).toBe('allow');
    const deniedRevoke = receipts.find(
      (r) =>
        r.kind === 'denied' &&
        r.transition_type === 'revoke_assertion' &&
        r.target_refs.includes(target_id),
    );
    expect(deniedRevoke).toBeDefined();
  });
});
