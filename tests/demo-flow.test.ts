// End-to-end demo: build estate → admit assertions → challenge/revoke →
// run recall in three frames → confirm pack + receipt + audit shape.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  executeRecall,
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

const T0 = '2026-05-05T10:00:00Z';
const T1 = '2026-05-05T10:30:00Z';
const T2 = '2026-05-05T11:00:00Z';
const T3 = '2026-05-05T12:00:00Z';

describe('demo: governed recall over a signed actor estate', () => {
  it('runs the full Recall Wedge happy-path + denial path + audit chain', () => {
    const store = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: loadKeyring(),
    });

    // 1. admit a public-safe preference (operator → ok)
    const pref = store.admit(
      buildCandidate({
        assertion_class: 'preference',
        body: { text: 'Demo agent answers in public Discord must exclude revoked identity claims.' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.operator,
      }),
      T0,
    );
    expect(pref.ok).toBe(true);

    // 2. admit a runtime observation (runtime → ok)
    const obs = store.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'User asked for the agent\'s favorite color.' },
        privacy_scope: 'public',
        risk_level: 'low',
        signer: SIGNERS.runtime,
      }),
      T1,
    );
    expect(obs.ok).toBe(true);

    // 3. attempt to admit identity from runtime (forbidden role → deny)
    const badIdentity = store.admit(
      buildCandidate({
        assertion_class: 'identity',
        body: { attribute: 'true_name', value: 'Satoshi' },
        risk_level: 'high',
        signer: SIGNERS.runtime,
      }),
      T1,
    );
    expect(badIdentity.ok).toBe(false);

    // 4. admit a private relationship (operator → ok, scoped private)
    const rel = store.admit(
      buildCandidate({
        assertion_class: 'relationship',
        body: { subject: 'user:bob', relation: 'open_dispute' },
        privacy_scope: 'actor_private',
        risk_level: 'medium',
        signer: SIGNERS.operator,
      }),
      T1,
    );
    expect(rel.ok).toBe(true);

    // 5. admit a reflection (runtime → ok), then challenge it
    const reflection = store.admit(
      buildCandidate({
        assertion_class: 'reflection',
        body: { text: 'Bob seems suspicious based on one event.' },
        privacy_scope: 'tenant',
        risk_level: 'medium',
        signer: SIGNERS.runtime,
      }),
      T1,
    );
    expect(reflection.ok).toBe(true);

    const challenge = store.challenge({
      target_assertion_id: reflection.assertion!.assertion_id,
      challenge: {
        challenge_type: 'unsupported',
        requested_effect: 'revoke',
        evidence_refs: DEFAULT_PROVENANCE,
        explanation: 'Single weak observation does not support a relationship reflection.',
        signatures: [
          buildCandidate({
            assertion_class: 'challenge',
            body: { target: reflection.assertion!.assertion_id },
            signer: SIGNERS.reviewer,
            signed_at: T2,
          }).signatures[0]!,
        ],
      },
      now: T2,
    });
    expect(challenge.ok).toBe(true);
    expect(challenge.updated_target?.status).toBe('revoked');

    // 6. public_discord recall — must include preference + observation, exclude
    //    private relationship, exclude revoked reflection.
    const publicReq = buildRecallRequest({
      task: 'public discord answer',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['observation', 'preference', 'reflection', 'relationship'],
      exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
      mark_statuses: ['contested', 'demoted'],
      signer: SIGNERS.operator,
      signed_at: T3,
    });
    const publicOut = executeRecall(store, publicReq, T3);
    expect(publicOut.ok).toBe(true);
    const publicPack = publicOut.pack!;
    const includedIds = publicPack.included.map((i) => i.assertion_id);
    expect(includedIds).toContain(pref.assertion!.assertion_id);
    expect(includedIds).toContain(obs.assertion!.assertion_id);
    expect(includedIds).not.toContain(rel.assertion!.assertion_id);
    expect(includedIds).not.toContain(reflection.assertion!.assertion_id);
    expect(publicPack.excluded_summary.map((s) => s.reason)).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'privacy_actor_private_in_public_frame',
      ]),
    );

    // 7. audit_review recall — surfaces the revoked reflection, but never as `usable`.
    const auditReq = buildRecallRequest({
      task: 'audit review',
      environment_frame: 'audit_review',
      risk_profile: 'high',
      requested_classes: ['observation', 'preference', 'reflection', 'relationship'],
      include_statuses: ['active', 'contested', 'demoted', 'revoked', 'forgotten_from_recall'],
      mark_statuses: ['contested', 'demoted', 'revoked', 'forgotten_from_recall'],
      include_receipt_detail: 'debug',
      signer: SIGNERS.reviewer,
      signed_at: T3,
    });
    const auditOut = executeRecall(store, auditReq, T3);
    expect(auditOut.ok).toBe(true);
    const auditPack = auditOut.pack!;
    const markedIds = auditPack.marked.map((m) => m.assertion_id);
    expect(markedIds).toContain(reflection.assertion!.assertion_id);

    // 8. audit chain integrity for the estate
    const chain = store.auditLog.verifyChain('estate:satoshi-demo');
    expect(chain.ok).toBe(true);

    // Audit log must contain the right event mix.
    const types = store.auditLog.list().map((e) => e.event_type);
    expect(types).toEqual(
      expect.arrayContaining([
        'assertion_admitted',
        'transition_denied',
        'assertion_challenged',
        'recall_pack_emitted',
      ]),
    );
  });
});
