// Phase 5 hardening — fail-closed acceptance tests.
//
// Each test below maps to a row in docs/mvp/threat-model.md. They are written
// to fail loudly if a future change loosens any of the wedge's no-go
// properties: missing policy, unknown class, unknown signer, revoked /
// forgotten / private leakage, contested promotion, tampered chain, missing
// estate scope, or commitment-root non-determinism.
//
// These tests overlap with earlier phase tests in places (e.g. recall
// exclusion). The Phase 5 framing is *the threat each test pins*, so the
// existence of these assertions is itself part of the package boundary —
// removing them is a breaking change to the wedge's safety contract.

import { describe, expect, it } from 'vitest';
import {
  AuditLog,
  EstateStore,
  InMemoryStorage,
  commitmentForRecallReceipt,
  computeCommitmentRoot,
  evaluateCompetence,
  executeRecall,
  validateCandidateAssertion,
  validateRecallRequest,
  type CandidateAssertion,
  type Keyring,
  type RecallRequest,
} from '../src/straylight/index.js';
import {
  DEFAULT_PROVENANCE,
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  buildSeededAssertion,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-05T12:00:00Z';

function makeStore(opts: { keyring?: Keyring } = {}): EstateStore {
  return new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: opts.keyring ?? loadKeyring(),
  });
}

describe('Phase 5 — missing policy fails closed', () => {
  it('admit transition denies with policy_unavailable_for_transition when no rule matches', () => {
    const k = loadKeyring();
    const empty: Keyring = { ...k, competence_rules: [] };
    const store = makeStore({ keyring: empty });
    const out = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'no policy loaded for this transition' },
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.policy_decision.decision).toBe('deny');
    expect(out.policy_decision.reasons).toContain('policy_unavailable_for_transition');
  });

  it('recall transition denies when no recall rule is loaded', () => {
    const k = loadKeyring();
    const noRecall: Keyring = {
      ...k,
      competence_rules: k.competence_rules.filter(
        (r) => r.transition_type !== 'recall_estate_context',
      ),
    };
    const store = makeStore({ keyring: noRecall });
    const out = executeRecall(
      store,
      buildRecallRequest({
        task: 'no recall rule',
        environment_frame: 'private_operator',
        risk_profile: 'low',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.pack).toBeUndefined();
    expect(out.policy_decision.reasons).toContain('policy_unavailable_for_transition');
  });
});

describe('Phase 5 — unknown assertion class fails class validation', () => {
  it('class validation rejects an unknown assertion_class', () => {
    const candidate = buildCandidate({
      assertion_class: 'observation',
      body: { text: 'about to be retyped' },
      signer: SIGNERS.operator,
    });
    // Force an off-spec class on the candidate object.
    const bad = { ...candidate, assertion_class: 'totally_made_up' as unknown as CandidateAssertion['assertion_class'] };
    const cv = validateCandidateAssertion(bad);
    expect(cv.valid).toBe(false);
    expect(cv.errors.some((e) => e.path === 'assertion_class' && e.code === 'invalid_enum')).toBe(true);
  });

  it('admit() denies an unknown class with class_validation_failed', () => {
    const candidate = buildCandidate({
      assertion_class: 'observation',
      body: { text: 'gets retyped' },
      signer: SIGNERS.operator,
    });
    const bad = { ...candidate, assertion_class: 'totally_made_up' as unknown as CandidateAssertion['assertion_class'] };
    const store = makeStore();
    const out = store.admit(bad, NOW);
    expect(out.ok).toBe(false);
    expect(out.class_validation.valid).toBe(false);
    expect(out.policy_decision.decision).toBe('deny');
    expect(out.policy_decision.reasons.some((r) => r === 'class_validation_failed')).toBe(true);
  });
});

describe('Phase 5 — unknown signer fails policy / signer competence', () => {
  it('evaluateCompetence reports unknown_signer for an off-keyring signer', () => {
    const store = makeStore();
    const candidate = buildCandidate({
      assertion_class: 'observation',
      body: { text: 'unknown signer attempt' },
      signer: SIGNERS.unknown,
    });
    const competence = evaluateCompetence(store.getKeyring(), {
      transition_type: 'admit_assertion',
      signatures: candidate.signatures,
      assertion_class: 'observation',
      now: NOW,
    });
    expect(competence.allowed).toBe(false);
    expect(competence.reason).toMatch(/unknown_signer/);
  });

  it('admit() with an unknown signer fails closed and emits a denied audit event', () => {
    const store = makeStore();
    const out = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'unknown signer attempt' },
        signer: SIGNERS.unknown,
      }),
      NOW,
    );
    expect(out.ok).toBe(false);
    expect(out.assertion).toBeUndefined();
    const denied = store.auditLog.list().some((e) => e.event_type === 'transition_denied');
    expect(denied).toBe(true);
    expect(out.receipt.kind).toBe('denied');
  });
});

describe('Phase 5 — revoked / forgotten / private / contested do not surface as usable', () => {
  function seededStore(): EstateStore {
    const store = makeStore();
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'preference',
        body: { text: 'public preference (anchor)' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
    );
    store.seedAssertion(
      buildSeededAssertion({
        status: 'revoked',
        assertion_class: 'preference',
        body: { text: 'revoked preference' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
    );
    store.seedAssertion(
      buildSeededAssertion({
        status: 'forgotten_from_recall',
        assertion_class: 'preference',
        body: { text: 'forgotten preference' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
    );
    store.seedAssertion(
      buildSeededAssertion({
        status: 'active',
        assertion_class: 'relationship',
        body: { subject: 'user:bob', relation: 'private_note' },
        privacy_scope: 'actor_private',
        signer: SIGNERS.operator,
      }),
    );
    store.seedAssertion(
      buildSeededAssertion({
        status: 'contested',
        assertion_class: 'preference',
        body: { text: 'contested preference' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
    );
    return store;
  }

  it('revoked assertions cannot be recalled as usable in any frame', () => {
    const store = seededStore();
    const publicOut = executeRecall(
      store,
      buildRecallRequest({
        task: 'public',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['preference'],
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(publicOut.ok).toBe(true);
    for (const item of publicOut.pack!.included) expect(item.status).not.toBe('revoked');

    const auditOut = executeRecall(
      store,
      buildRecallRequest({
        task: 'audit',
        environment_frame: 'audit_review',
        risk_profile: 'high',
        requested_classes: ['preference'],
        include_statuses: ['active', 'revoked'],
        mark_statuses: ['revoked'],
        include_receipt_detail: 'debug',
        signer: SIGNERS.reviewer,
      }),
      NOW,
    );
    expect(auditOut.ok).toBe(true);
    for (const item of auditOut.pack!.included) expect(item.status).not.toBe('revoked');
    const revokedMarked = auditOut.pack!.marked.find((m) => m.status === 'revoked');
    expect(revokedMarked).toBeDefined();
    expect(revokedMarked!.use_instruction).not.toBe('usable');
  });

  it('forgotten_from_recall assertions cannot be recalled as usable in any frame', () => {
    const store = seededStore();
    const publicOut = executeRecall(
      store,
      buildRecallRequest({
        task: 'public',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['preference'],
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(publicOut.ok).toBe(true);
    for (const item of publicOut.pack!.included) expect(item.status).not.toBe('forgotten_from_recall');

    const auditOut = executeRecall(
      store,
      buildRecallRequest({
        task: 'audit',
        environment_frame: 'audit_review',
        risk_profile: 'high',
        requested_classes: ['preference'],
        include_statuses: ['active', 'forgotten_from_recall'],
        mark_statuses: ['forgotten_from_recall'],
        include_receipt_detail: 'debug',
        signer: SIGNERS.reviewer,
      }),
      NOW,
    );
    expect(auditOut.ok).toBe(true);
    for (const item of auditOut.pack!.included) expect(item.status).not.toBe('forgotten_from_recall');
    const forgottenMarked = auditOut.pack!.marked.find((m) => m.status === 'forgotten_from_recall');
    expect(forgottenMarked).toBeDefined();
    expect(forgottenMarked!.use_instruction).not.toBe('usable');
  });

  it('actor_private assertions cannot enter a public recall pack', () => {
    const store = seededStore();
    const out = executeRecall(
      store,
      buildRecallRequest({
        task: 'public',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['relationship', 'preference'],
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(true);
    for (const item of out.pack!.included) expect(item.assertion_class).not.toBe('relationship');
    for (const item of out.pack!.marked) expect(item.assertion_class).not.toBe('relationship');
    expect(out.pack!.excluded_summary.map((s) => s.reason)).toContain(
      'privacy_actor_private_in_public_frame',
    );
  });

  it('contested assertions are marked or redacted, never silently promoted to active', () => {
    const store = seededStore();
    const out = executeRecall(
      store,
      buildRecallRequest({
        task: 'public',
        environment_frame: 'private_operator',
        risk_profile: 'low',
        requested_classes: ['preference'],
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(out.ok).toBe(true);
    for (const item of out.pack!.included) expect(item.status).not.toBe('contested');
    const contestedMarked = out.pack!.marked.find((m) => m.status === 'contested');
    expect(contestedMarked).toBeDefined();
    expect(contestedMarked!.use_instruction).toBe('mark_as_contested');
  });
});

describe('Phase 5 — tampered audit chain verification fails', () => {
  it('verifyChain detects a mutated previous_audit_hash link', () => {
    const storage = new InMemoryStorage();
    const store = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: loadKeyring(),
      storage,
    });
    store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'first event' },
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'second event' },
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(store.auditLog.verifyChain('estate:satoshi-demo').ok).toBe(true);

    // Tamper directly on the storage adapter — simulating an attacker who
    // gained filesystem access. We rebuild the audit log array in place so
    // the chain wrapper is forced to walk corrupted state.
    const events = storage.listAuditEvents('estate:satoshi-demo');
    expect(events.length).toBeGreaterThan(1);
    const tamperedTarget = events[1]!;
    const tampered = { ...tamperedTarget, previous_audit_hash: 'sha256:deadbeef' };
    // The InMemoryStorage holds events by reference in its internal array;
    // rebuild the array via a fresh adapter that mirrors the same listing
    // and substitutes one row.
    const tamperedAdapter = new InMemoryStorage();
    // Replay actor/estate/keyring + assertions so the rest of the read path
    // does not throw.
    tamperedAdapter.upsertActor(loadActor());
    tamperedAdapter.upsertEstate(loadEstate());
    tamperedAdapter.upsertKeyring(loadKeyring());
    for (const ev of events) {
      tamperedAdapter.appendAuditEvent(ev.audit_event_id === tampered.audit_event_id ? tampered : ev);
    }
    const tamperedLog = new AuditLog(tamperedAdapter);
    const result = tamperedLog.verifyChain('estate:satoshi-demo');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.broken_at).toBe(1);
      expect(result.reason).toBe('previous_audit_hash_mismatch');
    }
  });
});

describe('Phase 5 — recall cannot proceed without actor_id and estate_id', () => {
  it('class validation rejects a RecallRequest with empty actor_id', () => {
    const req = buildRecallRequest({
      task: 'no actor',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      signer: SIGNERS.operator,
    });
    const bad = { ...req, actor_id: '' } as RecallRequest;
    const cv = validateRecallRequest(bad);
    expect(cv.valid).toBe(false);
    expect(cv.errors.some((e) => e.path === 'actor_id')).toBe(true);
  });

  it('class validation rejects a RecallRequest with empty estate_id', () => {
    const req = buildRecallRequest({
      task: 'no estate',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      signer: SIGNERS.operator,
    });
    const bad = { ...req, estate_id: '' } as RecallRequest;
    const cv = validateRecallRequest(bad);
    expect(cv.valid).toBe(false);
    expect(cv.errors.some((e) => e.path === 'estate_id')).toBe(true);
  });

  it('executeRecall denies a request missing actor_id with class_validation_failed', () => {
    const store = makeStore();
    const req = buildRecallRequest({
      task: 'denied',
      environment_frame: 'private_operator',
      risk_profile: 'low',
      signer: SIGNERS.operator,
    });
    const bad = { ...req, actor_id: '' } as RecallRequest;
    const out = executeRecall(store, bad, NOW);
    expect(out.ok).toBe(false);
    expect(out.class_validation.valid).toBe(false);
    expect(out.policy_decision.decision).toBe('deny');
    expect(out.policy_decision.reasons.some((r) => r.startsWith('class:'))).toBe(true);
  });
});

describe('Phase 5 — commitment root changes if estate material changes', () => {
  it('different included_refs produce different commitment root_hash', () => {
    const a = computeCommitmentRoot({
      actor_id: 'agent:satoshi-demo',
      estate_id: 'estate:satoshi-demo',
      commitment_type: 'recall_receipt',
      refs: ['rcpt_a', 'rpack_a', 'rreq_a'],
      payload_summaries: ['sha256:aaaa', 'sha256:bbbb'],
      created_by: 'operator:eileen',
      created_by_type: 'operator',
      created_by_key_ref: 'dev-key:operator:eileen',
      created_at: NOW,
    });
    const b = computeCommitmentRoot({
      actor_id: 'agent:satoshi-demo',
      estate_id: 'estate:satoshi-demo',
      commitment_type: 'recall_receipt',
      refs: ['rcpt_a', 'rpack_a', 'rreq_b'], // ← one ref changed
      payload_summaries: ['sha256:aaaa', 'sha256:bbbb'],
      created_by: 'operator:eileen',
      created_by_type: 'operator',
      created_by_key_ref: 'dev-key:operator:eileen',
      created_at: NOW,
    });
    expect(a.root_hash).not.toBe(b.root_hash);
  });

  it('different payload_summaries produce different commitment root_hash', () => {
    const a = computeCommitmentRoot({
      actor_id: 'agent:satoshi-demo',
      estate_id: 'estate:satoshi-demo',
      commitment_type: 'recall_receipt',
      refs: ['rcpt_a', 'rpack_a', 'rreq_a'],
      payload_summaries: ['sha256:aaaa', 'sha256:bbbb'],
      created_by: 'operator:eileen',
      created_by_type: 'operator',
      created_by_key_ref: 'dev-key:operator:eileen',
      created_at: NOW,
    });
    const b = computeCommitmentRoot({
      actor_id: 'agent:satoshi-demo',
      estate_id: 'estate:satoshi-demo',
      commitment_type: 'recall_receipt',
      refs: ['rcpt_a', 'rpack_a', 'rreq_a'],
      payload_summaries: ['sha256:aaaa', 'sha256:cccc'], // ← one summary changed
      created_by: 'operator:eileen',
      created_by_type: 'operator',
      created_by_key_ref: 'dev-key:operator:eileen',
      created_at: NOW,
    });
    expect(a.root_hash).not.toBe(b.root_hash);
  });

  it('admitting a new assertion changes the recall pack hash and therefore the recall-receipt commitment root', () => {
    const baseStore = makeStore();
    baseStore.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'first observation' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    const baseRecall = executeRecall(
      baseStore,
      buildRecallRequest({
        task: 'commit-it',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation'],
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(baseRecall.ok).toBe(true);
    const baseCommit = commitmentForRecallReceipt(
      baseRecall.receipt!,
      { id: 'operator:eileen', type: 'operator', key_ref: 'dev-key:operator:eileen' },
      NOW,
    );

    const richStore = makeStore();
    richStore.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'first observation' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    richStore.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'second observation that changes the pack' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    const richRecall = executeRecall(
      richStore,
      buildRecallRequest({
        task: 'commit-it',
        environment_frame: 'public_discord',
        risk_profile: 'medium',
        requested_classes: ['observation'],
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    expect(richRecall.ok).toBe(true);
    const richCommit = commitmentForRecallReceipt(
      richRecall.receipt!,
      { id: 'operator:eileen', type: 'operator', key_ref: 'dev-key:operator:eileen' },
      NOW,
    );

    expect(baseRecall.pack!.pack_hash).not.toBe(richRecall.pack!.pack_hash);
    expect(baseCommit.root_hash).not.toBe(richCommit.root_hash);
  });
});

// silence unused import linters in some editor configs — DEFAULT_PROVENANCE
// is intentionally available to authors extending this file.
void DEFAULT_PROVENANCE;
