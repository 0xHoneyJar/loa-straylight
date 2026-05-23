// Phase 31A — Recall runtime object-model proof.
//
// Builds an actor estate purely through real EstateStore transition
// methods (`admit`, `challenge`, `revoke`, `forget`) — NOT through
// `seedAssertion` — and runs governed recall over the resulting
// transition-built estate via both `executeRecall` and the runtime
// recall-intake seam. The test proves:
//
//   * active allowed assertions → INCLUDED with `usable`;
//   * challenged-with-mark_contested → MARKED, never silently included;
//   * revoked → EXCLUDED in non-audit frames;
//   * forgotten_from_recall → EXCLUDED in non-audit frames;
//   * pack / receipt / audit links hash-prefixed and cross-referenced;
//   * persisted RecallReceipt lookup works;
//   * the per-estate audit chain verifies;
//   * a TransitionReceipt was persisted for each of admit / challenge /
//     revoke / forget.
//
// Strictly Straylight-local: no Dixie / Finn / Hounfour wiring beyond
// the existing in-tree runtime seam, no new public API surface, no
// network, no production persistence.

import { describe, expect, it } from 'vitest';
import process from 'node:process';

import {
  EstateStore,
  executeRecall,
  type Assertion,
  type RecallRequest,
  type SignatureEnvelope,
  type TransitionReceiptKind,
} from '../src/straylight/index.js';
import {
  createInMemoryIntakeDenyLog,
  type TenantResolver,
} from '../src/straylight/host/index.js';
import {
  handleRecallIntake as runtimeHandleRecallIntake,
  createDixieCapability,
} from '../src/straylight/runtime/recall-intake/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-23T12:00:00Z';
const KEY_ENV_VAR = 'STRAYLIGHT_RUNTIME_DIXIE_KEY';
const TEST_KEY = 'phase-31a-test-key-do-not-use-in-production';

const tenantResolver: TenantResolver = (id) => {
  if (id.includes('satoshi-demo')) return 'satoshi-tenant';
  return undefined;
};

const caller = {
  tenant_id: 'satoshi-tenant',
  actor_id: 'agent:satoshi-demo',
  session_id: 'sess:phase-31a',
};

function withEnvKey<T>(key: string | undefined, fn: () => T): T {
  const previous = process.env[KEY_ENV_VAR];
  if (key === undefined) delete process.env[KEY_ENV_VAR];
  else process.env[KEY_ENV_VAR] = key;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env[KEY_ENV_VAR];
    else process.env[KEY_ENV_VAR] = previous;
  }
}

interface BuiltEstate {
  store: EstateStore;
  active_observation: Assertion;
  active_preference: Assertion;
  contested_claim: Assertion;
  revoked_reflection: Assertion;
  forgotten_observation: Assertion;
}

// Build the entire actor estate through admit -> challenge / revoke /
// forget transitions. No seedAssertion. No direct status mutation.
function buildEstateThroughTransitions(): BuiltEstate {
  const store = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });

  // ── 1. Admit five signed assertions ────────────────────────────────────────
  const admitObservation = store.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'phase-31a: agent prefers concise tenant-scoped answers' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(admitObservation.ok).toBe(true);
  expect(admitObservation.assertion).toBeDefined();

  const admitPreference = store.admit(
    buildCandidate({
      assertion_class: 'preference',
      body: { text: 'phase-31a: prefer markdown bullet lists' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(admitPreference.ok).toBe(true);

  const admitClaim = store.admit(
    buildCandidate({
      assertion_class: 'claim',
      body: { text: 'phase-31a: the agent has shipped MVP slice X' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(admitClaim.ok).toBe(true);

  const admitReflection = store.admit(
    buildCandidate({
      assertion_class: 'reflection',
      body: { text: 'phase-31a: yesterdays reflection about X' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.runtime,
    }),
    NOW,
  );
  expect(admitReflection.ok).toBe(true);

  const admitToForget = store.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'phase-31a: observation slated to be forgotten' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(admitToForget.ok).toBe(true);

  // Sanity: every admit produced an admission receipt.
  for (const out of [
    admitObservation,
    admitPreference,
    admitClaim,
    admitReflection,
    admitToForget,
  ]) {
    expect(out.receipt.kind).toBe('admission');
    expect(out.receipt.decision).toBe('allow');
    expect(out.receipt.audit_event_ref).toBe(out.audit_event_id);
  }

  // ── 2. Challenge the claim → mark_contested ───────────────────────────────
  const challengeSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'challenge',
    body: { target: admitClaim.assertion!.assertion_id },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const challenge = store.challenge({
    target_assertion_id: admitClaim.assertion!.assertion_id,
    challenge: {
      challenge_type: 'unsupported',
      requested_effect: 'mark_contested',
      evidence_refs: [],
      explanation: 'phase-31a: contestation evidence not yet attached',
      signatures: [challengeSig],
    },
    now: NOW,
  });
  expect(challenge.ok).toBe(true);
  expect(challenge.receipt.kind).toBe('challenge');
  expect(challenge.updated_target?.status).toBe('contested');

  // ── 3. Revoke the reflection through the revoke transition ────────────────
  const revokeSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'revocation',
    body: { target: admitReflection.assertion!.assertion_id },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const revoke = store.revoke({
    target_assertion_id: admitReflection.assertion!.assertion_id,
    revocation: {
      reason: 'phase-31a: reflection superseded',
      signatures: [revokeSig],
    },
    now: NOW,
  });
  expect(revoke.ok).toBe(true);
  expect(revoke.receipt.kind).toBe('revocation');
  expect(revoke.updated_target?.status).toBe('revoked');

  // ── 4. Forget the dedicated forget-target through the forget transition ──
  const forgetSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'phase-31a: forget request' },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const forget = store.forget({
    target_assertion_id: admitToForget.assertion!.assertion_id,
    reason: 'phase-31a: operator-requested forget',
    signatures: [forgetSig],
    now: NOW,
  });
  expect(forget.ok).toBe(true);
  expect(forget.receipt.kind).toBe('forget');
  expect(forget.updated_target?.status).toBe('forgotten_from_recall');

  // The two assertions we left untouched must still be active.
  const post = (id: string) => store.getAssertion(id);
  expect(post(admitObservation.assertion!.assertion_id)?.status).toBe('active');
  expect(post(admitPreference.assertion!.assertion_id)?.status).toBe('active');
  expect(post(admitClaim.assertion!.assertion_id)?.status).toBe('contested');
  expect(post(admitReflection.assertion!.assertion_id)?.status).toBe('revoked');
  expect(post(admitToForget.assertion!.assertion_id)?.status).toBe(
    'forgotten_from_recall',
  );

  return {
    store,
    active_observation: admitObservation.assertion!,
    active_preference: admitPreference.assertion!,
    contested_claim: admitClaim.assertion!,
    revoked_reflection: admitReflection.assertion!,
    forgotten_observation: admitToForget.assertion!,
  };
}

function buildPrivateOperatorRequest(): RecallRequest {
  return buildRecallRequest({
    task: 'phase-31a-recall-runtime-object-model',
    environment_frame: 'private_operator',
    risk_profile: 'low',
    requested_classes: ['observation', 'preference', 'claim', 'reflection'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    include_receipt_detail: 'standard',
    signer: SIGNERS.operator,
  });
}

describe('Phase 31A — recall over a transition-built actor estate', () => {
  it('executeRecall over a fully transition-built estate proves include/mark/exclude + pack + receipt + audit', () => {
    const estate = buildEstateThroughTransitions();
    const { store } = estate;

    const out = executeRecall(store, buildPrivateOperatorRequest(), NOW);
    expect(out.ok).toBe(true);
    expect(out.pack).toBeDefined();
    expect(out.receipt).toBeDefined();
    expect(out.audit_event_id).toBeDefined();

    const pack = out.pack!;
    const receipt = out.receipt!;

    // ── Included: the two still-active assertions, marked `usable` ──
    const includedIds = pack.included.map((i) => i.assertion_id).sort();
    expect(includedIds).toEqual(
      [
        estate.active_observation.assertion_id,
        estate.active_preference.assertion_id,
      ].sort(),
    );
    for (const item of pack.included) {
      expect(item.use_instruction).toBe('usable');
      expect(item.status).toBe('active');
    }

    // ── Marked: the contested claim, never `usable` ──
    expect(pack.marked.map((m) => m.assertion_id)).toEqual([
      estate.contested_claim.assertion_id,
    ]);
    const contestedItem = pack.marked[0]!;
    expect(contestedItem.status).toBe('contested');
    expect(contestedItem.use_instruction).toBe('mark_as_contested');
    for (const m of pack.marked) {
      expect(m.use_instruction).not.toBe('usable');
    }

    // ── Excluded: revoked + forgotten, recorded by reason in the summary ──
    const exclusionReasons = pack.excluded_summary.map((s) => s.reason);
    expect(exclusionReasons).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'status_forgotten_from_recall',
      ]),
    );
    // No revoked / forgotten assertion leaks into included or marked.
    const surfacedIds = [
      ...pack.included.map((i) => i.assertion_id),
      ...pack.marked.map((m) => m.assertion_id),
    ];
    expect(surfacedIds).not.toContain(estate.revoked_reflection.assertion_id);
    expect(surfacedIds).not.toContain(
      estate.forgotten_observation.assertion_id,
    );

    // ── pack.pack_hash + receipt.receipt_hash invariants ──
    expect(pack.pack_hash.startsWith('sha256:')).toBe(true);
    expect(receipt.receipt_hash.startsWith('sha256:')).toBe(true);
    expect(receipt.pack_hash).toBe(pack.pack_hash);
    expect(receipt.recall_pack_id).toBe(pack.recall_pack_id);
    expect(receipt.receipt_id).toBe(pack.receipt_id);

    // The receipt's included / marked id sets mirror the pack's at standard
    // detail level (minimal would scrub them; standard preserves them).
    expect(receipt.included_assertion_ids.sort()).toEqual(includedIds);
    expect(receipt.marked_assertion_ids).toEqual([
      estate.contested_claim.assertion_id,
    ]);

    // ── Persisted RecallReceipt lookup via the storage adapter ──
    const persisted = store.storage.getRecallReceipt(receipt.receipt_id);
    expect(persisted).toBeDefined();
    expect(persisted!.receipt_hash).toBe(receipt.receipt_hash);
    expect(persisted!.pack_hash).toBe(pack.pack_hash);

    // ── Audit event id present and resolves on the per-estate chain ──
    expect(out.audit_event_id).toBeDefined();
    const auditEvents = store.auditLog.list();
    const recallAudit = auditEvents.find(
      (e) => e.audit_event_id === out.audit_event_id,
    );
    expect(recallAudit).toBeDefined();
    expect(recallAudit!.event_type).toBe('recall_pack_emitted');
    expect(recallAudit!.result_hash).toBe(pack.pack_hash);

    // ── Audit chain verifies cleanly through every transition + recall ──
    const chain = store.auditLog.verifyChain(estate.active_observation.estate_id);
    expect(chain.ok).toBe(true);
  });

  it('every governed transition (admit / challenge / revoke / forget) persisted a TransitionReceipt', () => {
    const estate = buildEstateThroughTransitions();
    const receipts = estate.store.listTransitionReceipts();
    const kinds = receipts.map((r) => r.kind).sort();

    // 5 admissions + 1 challenge + 1 revocation + 1 forget. All `allow`.
    const expectedKinds: TransitionReceiptKind[] = [
      'admission',
      'admission',
      'admission',
      'admission',
      'admission',
      'challenge',
      'forget',
      'revocation',
    ];
    expect(kinds).toEqual(expectedKinds);

    // Every receipt is hash-prefixed and references its transition + audit event.
    for (const r of receipts) {
      expect(r.receipt_hash.startsWith('sha256:')).toBe(true);
      expect(r.transition_id).toBeTruthy();
      expect(r.audit_event_ref).toBeTruthy();
      expect(r.decision).toBe('allow');
    }

    // The challenge / revocation / forget receipts each name the right target.
    const challengeReceipt = receipts.find((r) => r.kind === 'challenge')!;
    expect(challengeReceipt.target_refs).toContain(
      estate.contested_claim.assertion_id,
    );
    expect(challengeReceipt.metadata?.['new_status']).toBe('contested');

    const revocationReceipt = receipts.find((r) => r.kind === 'revocation')!;
    expect(revocationReceipt.target_refs).toContain(
      estate.revoked_reflection.assertion_id,
    );

    const forgetReceipt = receipts.find((r) => r.kind === 'forget')!;
    expect(forgetReceipt.target_refs).toContain(
      estate.forgotten_observation.assertion_id,
    );
  });

  it('runtime/recall-intake seam serves the same transition-built estate end-to-end', () => {
    withEnvKey(TEST_KEY, () => {
      const estate = buildEstateThroughTransitions();
      const cap = createDixieCapability();
      const result = runtimeHandleRecallIntake(
        estate.store,
        {
          request: buildPrivateOperatorRequest(),
          detail_level: 'standard',
          caller,
        },
        {
          tenantResolver,
          intakeLog: createInMemoryIntakeDenyLog(),
          now: NOW,
        },
        cap,
      );

      expect(result.outcome).toBe('served');
      if (result.outcome !== 'served') return;

      const { pack, receipt } = result;
      expect(pack.pack_hash.startsWith('sha256:')).toBe(true);
      expect(receipt.receipt_hash.startsWith('sha256:')).toBe(true);
      expect(receipt.pack_hash).toBe(pack.pack_hash);
      expect(result.audit_event_id).toBeDefined();

      // Same disposition shape as the direct executeRecall call: two active
      // assertions included, the contested claim marked, revoked + forgotten
      // excluded.
      expect(pack.included.map((i) => i.assertion_id).sort()).toEqual(
        [
          estate.active_observation.assertion_id,
          estate.active_preference.assertion_id,
        ].sort(),
      );
      expect(pack.marked.map((m) => m.assertion_id)).toEqual([
        estate.contested_claim.assertion_id,
      ]);
      const exclusionReasons = pack.excluded_summary.map((s) => s.reason);
      expect(exclusionReasons).toEqual(
        expect.arrayContaining([
          'status_revoked',
          'status_forgotten_from_recall',
        ]),
      );

      // Persisted recall receipt is reachable through the same estate store
      // the runtime seam delegated to.
      const persisted = estate.store.storage.getRecallReceipt(receipt.receipt_id);
      expect(persisted).toBeDefined();
      expect(persisted!.pack_hash).toBe(pack.pack_hash);

      // Audit chain still verifies after the runtime-seam recall.
      const chain = estate.store.auditLog.verifyChain(
        estate.active_observation.estate_id,
      );
      expect(chain.ok).toBe(true);
    });
  });
});
