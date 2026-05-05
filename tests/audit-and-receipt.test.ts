// Acceptance: every mutation emits an audit event; recall emits both a recall
// pack and a receipt; audit chain links per estate; commitment root is
// reproducible without leaking estate body.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  commitmentForRecallReceipt,
  executeRecall,
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

describe('audit + receipt + commitment behavior', () => {
  it('admit emits assertion_admitted; recall emits recall_pack_emitted; chain stays consistent', () => {
    const store = makeStore();
    const candidate = buildCandidate({
      assertion_class: 'observation',
      body: { text: 'public-safe observation' },
      privacy_scope: 'public',
      signer: SIGNERS.operator,
    });
    const admit = store.admit(candidate, NOW);
    expect(admit.ok).toBe(true);

    const req = buildRecallRequest({
      task: 'recall it',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['observation'],
      exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
      signer: SIGNERS.operator,
    });
    const out = executeRecall(store, req, NOW);
    expect(out.ok).toBe(true);
    expect(out.pack).toBeDefined();
    expect(out.receipt).toBeDefined();

    const events = store.auditLog.list();
    const types = events.map((e) => e.event_type);
    expect(types).toContain('assertion_admitted');
    expect(types).toContain('recall_pack_emitted');

    const chain = store.auditLog.verifyChain('estate:satoshi-demo');
    expect(chain.ok).toBe(true);
  });

  it('receipt hash and pack hash are deterministic for the same input', () => {
    const a = makeStore();
    const b = makeStore();

    const candidate = buildCandidate({
      assertion_class: 'observation',
      body: { text: 'deterministic' },
      privacy_scope: 'public',
      signer: SIGNERS.operator,
    });
    const aAdmit = a.admit(candidate, NOW);
    const bAdmit = b.admit(candidate, NOW);
    expect(aAdmit.ok && bAdmit.ok).toBe(true);

    const req = buildRecallRequest({
      task: 'deterministic recall',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['observation'],
      exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
      signer: SIGNERS.operator,
    });

    const aOut = executeRecall(a, req, NOW);
    const bOut = executeRecall(b, req, NOW);
    expect(aOut.pack!.pack_hash).toBe(bOut.pack!.pack_hash);
    expect(aOut.receipt!.receipt_hash).toBe(bOut.receipt!.receipt_hash);
  });

  it('minimal-detail receipt does not leak included or marked assertion ids', () => {
    const store = makeStore();
    store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'public obs' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      NOW,
    );

    const req = buildRecallRequest({
      task: 'minimal',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['observation'],
      include_receipt_detail: 'minimal',
      signer: SIGNERS.operator,
    });
    const out = executeRecall(store, req, NOW);
    expect(out.ok).toBe(true);
    expect(out.receipt!.included_assertion_ids).toEqual([]);
    expect(out.receipt!.marked_assertion_ids).toEqual([]);
  });

  it('commitment root references receipt without including its body', () => {
    const store = makeStore();
    store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'public obs' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      NOW,
    );
    const req = buildRecallRequest({
      task: 'commit it',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['observation'],
      signer: SIGNERS.operator,
    });
    const out = executeRecall(store, req, NOW);
    const commit = commitmentForRecallReceipt(
      out.receipt!,
      { id: 'operator:eileen', type: 'operator', key_ref: 'dev-key:operator:eileen' },
      NOW,
    );
    expect(commit.root_hash.startsWith('sha256:')).toBe(true);
    expect(commit.included_refs).toEqual(
      expect.arrayContaining([out.receipt!.receipt_id, out.receipt!.recall_pack_id]),
    );
    // Root hash should be reproducible.
    const commit2 = commitmentForRecallReceipt(
      out.receipt!,
      { id: 'operator:eileen', type: 'operator', key_ref: 'dev-key:operator:eileen' },
      NOW,
    );
    expect(commit2.root_hash).toBe(commit.root_hash);
  });
});
