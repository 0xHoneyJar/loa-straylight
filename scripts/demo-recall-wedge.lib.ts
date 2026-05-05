// Phase 4 — runDemo() builds the local Straylight estate, exercises every
// transition the wedge supports (admit / challenge / revoke / forget), runs
// recall in two frames, and returns the resulting pack/receipt/audit so a
// test can assert on the same artifacts the CLI demo prints.
//
// CLI entrypoint: scripts/demo-recall-wedge.ts (npm run demo:recall).
// Test entrypoint: tests/phase-4-demo.test.ts imports runDemo({silent:true}).

import {
  EstateStore,
  executeRecall,
  type Assertion,
  type AuditEvent,
  type RecallPack,
  type RecallReceipt,
  type SignatureEnvelope,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
  DEFAULT_PROVENANCE,
} from '../fixtures/index.js';

// Deterministic timeline so re-running the demo prints identical IDs.
const T = {
  preference:        '2026-05-05T10:00:00Z',
  observation:       '2026-05-05T10:30:00Z',
  reflection:        '2026-05-05T10:31:00Z',
  relationship:      '2026-05-05T10:32:00Z',
  preference_doomed: '2026-05-05T10:33:00Z',
  observation_quiet: '2026-05-05T10:34:00Z',
  challenge:         '2026-05-05T11:00:00Z',
  revoke:            '2026-05-05T11:30:00Z',
  forget:            '2026-05-05T12:00:00Z',
  recall_public:     '2026-05-05T12:30:00Z',
  recall_audit:      '2026-05-05T12:31:00Z',
} as const;

export interface DemoResult {
  publicPack: RecallPack;
  publicReceipt: RecallReceipt;
  auditPack: RecallPack;
  excludedReasons: { reason: string; count: number }[];
  auditEvents: readonly AuditEvent[];
  auditChainOk: boolean;
  revokedAssertion: Assertion;
  forgottenAssertion: Assertion;
  contestedAssertion: Assertion;
  linkedAssertion: Assertion;
}

export interface DemoOptions {
  silent?: boolean;
}

export function runDemo(opts: DemoOptions = {}): DemoResult {
  const log = opts.silent ? () => {} : (...args: unknown[]) => console.log(...args);
  const section = (title: string) => {
    log('');
    log('━━━', title);
  };

  // 1. Create demo actor estate.
  section('1. estate bootstrap');
  const store = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  log('actor      :', store.getActor().actor_id);
  log('estate     :', store.getEstate().estate_id, '(', store.getEstate().status, ')');
  log('keyring    :', store.getKeyring().keyring_id, 'rules=', store.getKeyring().competence_rules.length);

  // 2 + 3 + 4. Admit signed assertions. Each admit() runs class validation
  // first, then policy (signer competence). Both gates emit reasons we print.
  section('2-4. admit signed assertions (class + policy validated)');

  const preference = mustAdmit(
    store,
    buildCandidate({
      assertion_class: 'preference',
      body: { text: 'Agent answers in public Discord must avoid quoting revoked identity claims.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
      signed_at: T.preference,
    }),
    T.preference,
    'preference (public, operator)',
    log,
  );

  const observation = mustAdmit(
    store,
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'User asked the agent about its preferred answer style.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.observation,
    }),
    T.observation,
    'observation (public, runtime)',
    log,
  );

  // 5. Link related assertions: admit a reflection that references the
  //    earlier observation + preference via linked_assertion_refs. The
  //    candidate carries those refs through admission and the resulting
  //    Assertion exposes them on listAssertions().
  section('5. link related assertions');

  // buildCandidate doesn't surface linked_assertion_refs through its input
  // shape; tack them onto the candidate before admit. Signed_payload_hash
  // (computed in buildCandidate) intentionally does NOT cover linked refs,
  // so spreading them here does not break signature self-consistency.
  const reflectionCandidate = buildCandidate({
    assertion_class: 'reflection',
    body: { text: 'Single weak observation may not justify treating user as untrustworthy.' },
    privacy_scope: 'tenant',
    risk_level: 'medium',
    signer: SIGNERS.runtime,
    signed_at: T.reflection,
  });
  reflectionCandidate.linked_assertion_refs = [observation.assertion_id, preference.assertion_id];
  const reflection = mustAdmit(
    store,
    reflectionCandidate,
    T.reflection,
    'reflection (tenant, runtime, linked → observation+preference)',
    log,
  );
  log('  linked_assertion_refs:', reflection.linked_assertion_refs ?? []);

  // Two more assertions to exercise revocation and forget.
  const privateRelationship = mustAdmit(
    store,
    buildCandidate({
      assertion_class: 'relationship',
      body: { subject: 'user:bob', relation: 'open_dispute' },
      privacy_scope: 'actor_private',
      risk_level: 'medium',
      signer: SIGNERS.operator,
      signed_at: T.relationship,
    }),
    T.relationship,
    'relationship (actor_private, operator)',
    log,
  );

  const doomedPreference = mustAdmit(
    store,
    buildCandidate({
      assertion_class: 'preference',
      body: { text: 'Stale preference scheduled to be revoked.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
      signed_at: T.preference_doomed,
    }),
    T.preference_doomed,
    'preference (public, operator) — will be revoked',
    log,
  );

  const quietObservation = mustAdmit(
    store,
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Noisy observation slated for forgotten_from_recall.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.observation_quiet,
    }),
    T.observation_quiet,
    'observation (public, runtime) — will be forgotten_from_recall',
    log,
  );

  // 6. Challenge one assertion. mark_contested keeps the assertion visible
  //    to recall but marked, never silently promoted to active truth.
  section('6. challenge one assertion (mark_contested)');
  const reviewerSig = challengeSignature(reflection.assertion_id, T.challenge);
  const challengeOutcome = store.challenge({
    target_assertion_id: reflection.assertion_id,
    challenge: {
      challenge_type: 'unsupported',
      requested_effect: 'mark_contested',
      evidence_refs: DEFAULT_PROVENANCE,
      explanation: 'Single weak observation does not support reflection conclusion.',
      signatures: [reviewerSig],
    },
    now: T.challenge,
  });
  if (!challengeOutcome.ok) throw new Error('challenge failed unexpectedly');
  const contested = challengeOutcome.updated_target!;
  log('  target:', contested.assertion_id);
  log('  status:', contested.status, '(was active)');
  log('  decision:', challengeOutcome.policy_decision.decision);
  log('  receipt:', challengeOutcome.receipt.receipt_id, 'kind=', challengeOutcome.receipt.kind);

  // 7. Revoke one assertion (different from the contested one).
  section('7. revoke one assertion');
  const revokeSig = revokeSignature(doomedPreference.assertion_id, T.revoke);
  const revokeOutcome = store.revoke({
    target_assertion_id: doomedPreference.assertion_id,
    revocation: {
      reason: 'superseded_by_new_policy_guidance',
      signatures: [revokeSig],
    },
    now: T.revoke,
  });
  if (!revokeOutcome.ok) throw new Error('revoke failed unexpectedly');
  const revoked = revokeOutcome.updated_target!;
  log('  target:', revoked.assertion_id);
  log('  status:', revoked.status);
  log('  decision:', revokeOutcome.policy_decision.decision);
  log('  receipt:', revokeOutcome.receipt.receipt_id, 'kind=', revokeOutcome.receipt.kind);

  // 8. Mark one assertion forgotten_from_recall.
  section('8. mark one assertion forgotten_from_recall');
  const forgetSig = forgetSignature(quietObservation.assertion_id, T.forget);
  const forgetOutcome = store.forget({
    target_assertion_id: quietObservation.assertion_id,
    reason: 'pii_hygiene_request',
    signatures: [forgetSig],
    now: T.forget,
  });
  if (!forgetOutcome.ok) throw new Error('forget failed unexpectedly');
  const forgotten = forgetOutcome.updated_target!;
  log('  target:', forgotten.assertion_id);
  log('  status:', forgotten.status);
  log('  decision:', forgetOutcome.policy_decision.decision);
  log('  receipt:', forgetOutcome.receipt.receipt_id, 'kind=', forgetOutcome.receipt.kind);

  // 9. Request governed recall pack for a public Discord-like frame.
  section('9. governed recall — public_discord');
  const publicReq = buildRecallRequest({
    task: 'public discord answer about the agent\'s answer style',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation', 'preference', 'reflection', 'relationship'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_public,
  });
  const publicOut = executeRecall(store, publicReq, T.recall_public);
  if (!publicOut.ok || !publicOut.pack || !publicOut.receipt) {
    throw new Error(`recall denied unexpectedly: ${publicOut.policy_decision.reasons.join(',')}`);
  }
  const publicPack = publicOut.pack;
  const publicReceipt = publicOut.receipt;

  // 10. Print the RecallPack.
  section('10. RecallPack');
  log(JSON.stringify(redactBodies(publicPack), null, 2));

  // 11. Print the RecallReceipt.
  section('11. RecallReceipt');
  log(JSON.stringify(publicReceipt, null, 2));

  // 12. Print excluded assertion reasons.
  section('12. excluded assertions — reasons');
  for (const ex of publicPack.excluded_summary) {
    log(`  ${ex.reason.padEnd(48)} ×${ex.count}`);
  }
  if (publicPack.redacted.length > 0) {
    log('  -- redacted --');
    for (const r of publicPack.redacted) log(`  ${r.reason.padEnd(48)} ×${r.count}`);
  }

  // 13. Prove revoked / forgotten remain auditable.
  //     Run an audit_review-frame recall — these statuses surface in `marked`,
  //     never `included`, and are tagged with a do-not-use instruction.
  section('13. revoked + forgotten remain auditable');
  const auditReq = buildRecallRequest({
    task: 'audit review',
    environment_frame: 'audit_review',
    risk_profile: 'high',
    requested_classes: ['observation', 'preference', 'reflection', 'relationship'],
    include_statuses: ['active', 'contested', 'demoted', 'revoked', 'forgotten_from_recall'],
    mark_statuses: ['contested', 'demoted', 'revoked', 'forgotten_from_recall'],
    include_receipt_detail: 'debug',
    include_provenance: true,
    signer: SIGNERS.reviewer,
    signed_at: T.recall_audit,
  });
  const auditOut = executeRecall(store, auditReq, T.recall_audit);
  if (!auditOut.ok || !auditOut.pack) {
    throw new Error(`audit-review recall denied: ${auditOut.policy_decision.reasons.join(',')}`);
  }
  const auditPack = auditOut.pack;

  const auditMarkedIds = auditPack.marked.map((m) => m.assertion_id);
  const auditIncludedIds = auditPack.included.map((m) => m.assertion_id);
  log('  audit_review marked   :', auditMarkedIds);
  log('  audit_review included :', auditIncludedIds);

  for (const target of [revoked, forgotten, contested]) {
    const marked = auditPack.marked.find((m) => m.assertion_id === target.assertion_id);
    const refs = store.auditLog
      .listFor(store.getEstate().estate_id)
      .filter((e) => (e.assertion_refs ?? []).includes(target.assertion_id))
      .map((e) => e.event_type);
    log(
      `  ${target.assertion_class.padEnd(12)} ${target.assertion_id} status=${target.status} ` +
      `audit_events=[${refs.join(',')}] ` +
      `marked_in_audit_pack=${Boolean(marked)} ` +
      `use_instruction=${marked?.use_instruction ?? 'n/a'}`,
    );
  }

  // 14. Verify the audit chain.
  section('14. audit chain verification');
  const chain = store.auditLog.verifyChain(store.getEstate().estate_id);
  if (chain.ok) {
    log('  ok: chain verified across', store.auditLog.list().length, 'events');
  } else {
    log('  BROKEN at index', chain.broken_at, '—', chain.reason);
  }

  // Sanity assertions for the demo storyline.
  const includedIds = publicPack.included.map((i) => i.assertion_id);
  if (!includedIds.includes(preference.assertion_id) || !includedIds.includes(observation.assertion_id)) {
    throw new Error('public pack missing expected included assertions');
  }
  if (includedIds.includes(privateRelationship.assertion_id)) {
    throw new Error('private relationship leaked into public pack');
  }
  if (includedIds.includes(revoked.assertion_id) || includedIds.includes(forgotten.assertion_id)) {
    throw new Error('revoked or forgotten assertion leaked into public pack');
  }
  if (publicPack.marked.some((m) => m.use_instruction === 'usable')) {
    throw new Error('marked items must not carry usable instruction');
  }
  if (!chain.ok) throw new Error('audit chain verification failed');

  return {
    publicPack,
    publicReceipt,
    auditPack,
    excludedReasons: publicPack.excluded_summary.map((s) => ({ reason: s.reason, count: s.count })),
    auditEvents: store.auditLog.list(),
    auditChainOk: chain.ok,
    revokedAssertion: revoked,
    forgottenAssertion: forgotten,
    contestedAssertion: contested,
    linkedAssertion: reflection,
  };
}

function mustAdmit(
  store: EstateStore,
  candidate: Parameters<EstateStore['admit']>[0],
  now: string,
  label: string,
  log: (...args: unknown[]) => void,
): Assertion {
  const out = store.admit(candidate, now);
  log(' ', label);
  log('    decision   :', out.policy_decision.decision, '/', out.policy_decision.reasons.join(','));
  log('    class      :', out.class_validation.valid ? 'valid' : 'invalid');
  if (!out.ok || !out.assertion) {
    throw new Error(`admit failed for ${label}: ${out.policy_decision.reasons.join(',')}`);
  }
  log('    assertion  :', out.assertion.assertion_id, 'status=', out.assertion.status);
  log('    receipt    :', out.receipt.receipt_id, 'kind=', out.receipt.kind);
  return out.assertion;
}

function challengeSignature(targetId: string, signedAt: string): SignatureEnvelope {
  // Reuse the fixtures' candidate-builder to mint a dev signature for the
  // reviewer. The signature payload is over a synthetic challenge body so
  // it remains self-consistent under verifyEnvelopeSelfConsistency.
  return buildCandidate({
    assertion_class: 'challenge',
    body: { target: targetId, kind: 'mark_contested' },
    signer: SIGNERS.reviewer,
    signed_at: signedAt,
  }).signatures[0]!;
}

function revokeSignature(targetId: string, signedAt: string): SignatureEnvelope {
  return buildCandidate({
    assertion_class: 'revocation',
    body: { target: targetId, kind: 'revoke' },
    signer: SIGNERS.operator,
    signed_at: signedAt,
  }).signatures[0]!;
}

function forgetSignature(targetId: string, signedAt: string): SignatureEnvelope {
  return buildCandidate({
    assertion_class: 'revocation',
    body: { target: targetId, kind: 'forget_from_recall' },
    signer: SIGNERS.operator,
    signed_at: signedAt,
  }).signatures[0]!;
}

// Pretty-printing the RecallPack with full bodies would dwarf the demo; we
// surface assertion_class + status + use_instruction + summary, which is the
// audit-relevant projection.
function redactBodies(pack: RecallPack): unknown {
  return {
    recall_pack_id: pack.recall_pack_id,
    recall_request_id: pack.recall_request_id,
    actor_id: pack.actor_id,
    estate_id: pack.estate_id,
    pack_hash: pack.pack_hash,
    created_at: pack.created_at,
    policy_decision: {
      decision: pack.policy_decision.decision,
      reasons: pack.policy_decision.reasons,
    },
    included: pack.included.map((i) => ({
      assertion_id: i.assertion_id,
      assertion_class: i.assertion_class,
      status: i.status,
      use_instruction: i.use_instruction,
      summary: i.summary,
    })),
    marked: pack.marked.map((i) => ({
      assertion_id: i.assertion_id,
      assertion_class: i.assertion_class,
      status: i.status,
      use_instruction: i.use_instruction,
    })),
    redacted: pack.redacted,
    excluded_summary: pack.excluded_summary,
  };
}

