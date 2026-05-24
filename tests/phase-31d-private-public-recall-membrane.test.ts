// Phase 31D — Private / public recall membrane proof.
//
// The same actor estate must produce different recall packs under
// different environment frames, without generic retrieval deciding
// authority. Build an estate via real EstateStore transitions
// (`admit` / `challenge` / `revoke` / `forget`), then run two recalls
// over the same store and prove the membrane.
//
// The membrane:
//   * private_operator: includes public + tenant + actor_private active
//     material; contested marked; revoked / forgotten / sealed-privacy
//     excluded; nothing redacted (no public-frame privacy demotion).
//   * public_discord:   includes only public-privacy active material;
//     tenant-privacy active material is redacted (not surfaced); sealed
//     and actor_private are excluded; contested still marked (never
//     silently ordinary); revoked + forgotten excluded; no private
//     payload (body text, relationship subject/relation) leaks into
//     pack items, receipt fields, exclusion / redaction summaries, or
//     the recall_pack_emitted audit payload.
//
// Strictly Straylight-local: real transitions, real recall executor,
// no seedAssertion for the core proof, no production-code changes.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  executeRecall,
  type Assertion,
  type AssertionClass,
  type RecallRequest,
  type SignatureEnvelope,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const NOW = '2026-05-24T13:00:00Z';

// Distinct, easily-searchable text payloads for each private assertion
// so we can prove they do NOT leak into public pack / receipt / audit
// content.
const TEXT_OBS_PUBLIC = 'phase-31d: public-safe observation';
const TEXT_PREF_PUBLIC = 'phase-31d: public-safe preference';
const TEXT_CONTESTED = 'phase-31d: public claim slated for contestation';

const TEXT_TENANT_CLAIM =
  'phase-31d: tenant-only operational claim PHASE31D-PRIVATE-TENANT';
const TEXT_SEALED_NOTE =
  'phase-31d: sealed-privacy operator note PHASE31D-PRIVATE-SEALED';
const TEXT_REFLECTION =
  'phase-31d: reflection slated for revocation PHASE31D-PRIVATE-REFL';
const TEXT_FORGET =
  'phase-31d: observation slated for forget PHASE31D-PRIVATE-FORGET';
const TEXT_REL_SUBJECT = 'user:phase31d-private-subject';
const TEXT_REL_RELATION = 'has_unresolved_dispute_PHASE31D-PRIVATE-REL';

// Fragments that must NEVER appear in any public surface. Each fragment
// is a body-text token that uniquely identifies a private/operator-only
// assertion's payload.
const PRIVATE_TEXT_FRAGMENTS = [
  'PHASE31D-PRIVATE-TENANT',
  'PHASE31D-PRIVATE-SEALED',
  'PHASE31D-PRIVATE-REFL',
  'PHASE31D-PRIVATE-FORGET',
  'PHASE31D-PRIVATE-REL',
  TEXT_REL_SUBJECT,
];

interface BuiltEstate {
  store: EstateStore;
  active_public_observation: Assertion;
  active_tenant_claim: Assertion;
  active_sealed_note: Assertion;
  contested_public_claim: Assertion;
  revoked_reflection: Assertion;
  forgotten_observation: Assertion;
  private_relationship: Assertion;
  active_public_preference: Assertion;
}

// Build the entire estate via real transitions: admit, challenge,
// revoke, forget. No seedAssertion. No direct status mutation.
function buildEstateThroughTransitions(): BuiltEstate {
  const store = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });

  // 1. Active public-safe observation.
  const obs = store.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: TEXT_OBS_PUBLIC },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(obs.ok).toBe(true);

  // 2. Active private/operator-only (tenant-scope) claim.
  const tenantClaim = store.admit(
    buildCandidate({
      assertion_class: 'claim',
      body: { text: TEXT_TENANT_CLAIM },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(tenantClaim.ok).toBe(true);

  // 3. Active sealed/private note (privacy_scope = 'sealed').
  const sealed = store.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: TEXT_SEALED_NOTE },
      privacy_scope: 'sealed',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(sealed.ok).toBe(true);

  // 4. Public-safe claim → contested via challenge transition.
  const contestable = store.admit(
    buildCandidate({
      assertion_class: 'claim',
      body: { text: TEXT_CONTESTED },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(contestable.ok).toBe(true);
  const challengeSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'challenge',
    body: { target: contestable.assertion!.assertion_id },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const challenge = store.challenge({
    target_assertion_id: contestable.assertion!.assertion_id,
    challenge: {
      challenge_type: 'unsupported',
      requested_effect: 'mark_contested',
      evidence_refs: [],
      explanation: 'phase-31d: contestation evidence not yet attached',
      signatures: [challengeSig],
    },
    now: NOW,
  });
  expect(challenge.ok).toBe(true);
  expect(challenge.updated_target?.status).toBe('contested');

  // 5. Tenant-scoped reflection → revoked via revoke transition.
  const reflection = store.admit(
    buildCandidate({
      assertion_class: 'reflection',
      body: { text: TEXT_REFLECTION },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.runtime,
    }),
    NOW,
  );
  expect(reflection.ok).toBe(true);
  const revokeSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'revocation',
    body: { target: reflection.assertion!.assertion_id },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const revoke = store.revoke({
    target_assertion_id: reflection.assertion!.assertion_id,
    revocation: {
      reason: 'phase-31d: reflection superseded',
      signatures: [revokeSig],
    },
    now: NOW,
  });
  expect(revoke.ok).toBe(true);
  expect(revoke.updated_target?.status).toBe('revoked');

  // 6. Tenant observation → forgotten_from_recall via forget transition.
  const forgetTarget = store.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: TEXT_FORGET },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(forgetTarget.ok).toBe(true);
  const forgetSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'phase-31d: forget request' },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const forget = store.forget({
    target_assertion_id: forgetTarget.assertion!.assertion_id,
    reason: 'phase-31d: operator-requested forget',
    signatures: [forgetSig],
    now: NOW,
  });
  expect(forget.ok).toBe(true);
  expect(forget.updated_target?.status).toBe('forgotten_from_recall');

  // 7. actor_private relationship/context assertion.
  const relationship = store.admit(
    buildCandidate({
      assertion_class: 'relationship',
      body: { subject: TEXT_REL_SUBJECT, relation: TEXT_REL_RELATION },
      privacy_scope: 'actor_private',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(relationship.ok).toBe(true);

  // 8. Public-safe preference.
  const pref = store.admit(
    buildCandidate({
      assertion_class: 'preference',
      body: { text: TEXT_PREF_PUBLIC },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(pref.ok).toBe(true);

  // Sanity: every untouched assertion is `active`, the contested claim is
  // `contested`, the revoked reflection is `revoked`, the forget target
  // is `forgotten_from_recall`.
  const get = (id: string) => store.getAssertion(id);
  expect(get(obs.assertion!.assertion_id)?.status).toBe('active');
  expect(get(tenantClaim.assertion!.assertion_id)?.status).toBe('active');
  expect(get(sealed.assertion!.assertion_id)?.status).toBe('active');
  expect(get(contestable.assertion!.assertion_id)?.status).toBe('contested');
  expect(get(reflection.assertion!.assertion_id)?.status).toBe('revoked');
  expect(get(forgetTarget.assertion!.assertion_id)?.status).toBe(
    'forgotten_from_recall',
  );
  expect(get(relationship.assertion!.assertion_id)?.status).toBe('active');
  expect(get(pref.assertion!.assertion_id)?.status).toBe('active');

  return {
    store,
    active_public_observation: obs.assertion!,
    active_tenant_claim: tenantClaim.assertion!,
    active_sealed_note: sealed.assertion!,
    contested_public_claim: contestable.assertion!,
    revoked_reflection: reflection.assertion!,
    forgotten_observation: forgetTarget.assertion!,
    private_relationship: relationship.assertion!,
    active_public_preference: pref.assertion!,
  };
}

const REQUESTED_CLASSES: AssertionClass[] = [
  'observation',
  'preference',
  'claim',
  'reflection',
  'relationship',
];

function privateOperatorRequest(): RecallRequest {
  return buildRecallRequest({
    task: 'phase-31d-private-operator',
    environment_frame: 'private_operator',
    risk_profile: 'low',
    requested_classes: REQUESTED_CLASSES,
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    include_receipt_detail: 'standard',
    signer: SIGNERS.operator,
  });
}

function publicDiscordRequest(): RecallRequest {
  return buildRecallRequest({
    task: 'phase-31d-public-discord',
    environment_frame: 'public_discord',
    risk_profile: 'low',
    requested_classes: REQUESTED_CLASSES,
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    include_receipt_detail: 'standard',
    signer: SIGNERS.operator,
  });
}

describe('Phase 31D — private / public recall membrane', () => {
  it('private_operator recall over the transition-built estate includes public + tenant + actor_private active material; revoked/forgotten/sealed-privacy excluded; contested marked', () => {
    const estate = buildEstateThroughTransitions();
    const out = executeRecall(estate.store, privateOperatorRequest(), NOW);

    expect(out.ok).toBe(true);
    const pack = out.pack!;
    const receipt = out.receipt!;
    expect(pack.pack_hash.startsWith('sha256:')).toBe(true);
    expect(receipt.receipt_hash.startsWith('sha256:')).toBe(true);
    expect(receipt.pack_hash).toBe(pack.pack_hash);
    expect(receipt.recall_pack_id).toBe(pack.recall_pack_id);
    expect(receipt.receipt_id).toBe(pack.receipt_id);

    const includedIds = pack.included.map((i) => i.assertion_id).sort();
    expect(includedIds).toEqual(
      [
        estate.active_public_observation.assertion_id,
        estate.active_tenant_claim.assertion_id,
        estate.private_relationship.assertion_id,
        estate.active_public_preference.assertion_id,
      ].sort(),
    );
    for (const item of pack.included) {
      expect(item.use_instruction).toBe('usable');
      expect(item.status).toBe('active');
    }

    expect(pack.marked.map((m) => m.assertion_id)).toEqual([
      estate.contested_public_claim.assertion_id,
    ]);
    expect(pack.marked[0]!.use_instruction).toBe('mark_as_contested');
    for (const m of pack.marked) {
      expect(m.use_instruction).not.toBe('usable');
    }

    const exclusionReasons = pack.excluded_summary.map((s) => s.reason);
    expect(exclusionReasons).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'status_forgotten_from_recall',
        'privacy_sealed',
      ]),
    );

    // No revoked / forgotten / sealed assertion leaks into pack.included
    // or pack.marked under the operator frame.
    const surfacedIds = [
      ...pack.included.map((i) => i.assertion_id),
      ...pack.marked.map((m) => m.assertion_id),
    ];
    expect(surfacedIds).not.toContain(estate.active_sealed_note.assertion_id);
    expect(surfacedIds).not.toContain(estate.revoked_reflection.assertion_id);
    expect(surfacedIds).not.toContain(estate.forgotten_observation.assertion_id);

    // Operator frame does NOT redact tenant or actor_private.
    const redactionReasons = pack.redacted.map((r) => r.reason);
    expect(redactionReasons).not.toContain('privacy_tenant_in_public_frame');
    expect(redactionReasons).not.toContain(
      'privacy_actor_private_in_public_frame',
    );

    // Receipt mirrors pack disposition at standard detail.
    expect(receipt.included_assertion_ids.sort()).toEqual(includedIds);
    expect(receipt.marked_assertion_ids).toEqual([
      estate.contested_public_claim.assertion_id,
    ]);

    // recall_pack_emitted audit event present and audit chain verifies.
    const audit = estate.store.auditLog.list();
    const recallAudit = audit.find(
      (e) => e.audit_event_id === out.audit_event_id,
    );
    expect(recallAudit).toBeDefined();
    expect(recallAudit!.event_type).toBe('recall_pack_emitted');
    expect(recallAudit!.result_hash).toBe(pack.pack_hash);

    const chain = estate.store.auditLog.verifyChain(
      estate.active_public_observation.estate_id,
    );
    expect(chain.ok).toBe(true);
  });

  it('public_discord recall over the SAME estate produces a strictly smaller pack: tenant redacted, actor_private + sealed-privacy excluded, contested still marked, revoked/forgotten excluded, no private payload leaks', () => {
    const estate = buildEstateThroughTransitions();

    const privateOut = executeRecall(estate.store, privateOperatorRequest(), NOW);
    expect(privateOut.ok).toBe(true);

    const publicOut = executeRecall(estate.store, publicDiscordRequest(), NOW);
    expect(publicOut.ok).toBe(true);
    const publicPack = publicOut.pack!;
    const publicReceipt = publicOut.receipt!;

    // Same estate ⇒ same estate_id on both packs (the membrane is policy,
    // not data — we did not seed a different estate for the public path).
    expect(publicPack.estate_id).toBe(privateOut.pack!.estate_id);
    expect(publicPack.actor_id).toBe(privateOut.pack!.actor_id);
    expect(publicPack.estate_id).toBe(
      estate.active_public_observation.estate_id,
    );

    // The two packs differ for policy reasons. Pack hashes differ AND the
    // public pack's included id-set is a strict subset of the private one.
    expect(publicPack.pack_hash).not.toBe(privateOut.pack!.pack_hash);

    const publicIncludedIds = publicPack.included.map((i) => i.assertion_id).sort();
    expect(publicIncludedIds).toEqual(
      [
        estate.active_public_observation.assertion_id,
        estate.active_public_preference.assertion_id,
      ].sort(),
    );
    for (const item of publicPack.included) {
      expect(item.status).toBe('active');
      expect(item.use_instruction).toBe('usable');
    }

    // Contested public claim is still marked (never silently ordinary).
    expect(publicPack.marked.map((m) => m.assertion_id)).toEqual([
      estate.contested_public_claim.assertion_id,
    ]);
    expect(publicPack.marked[0]!.use_instruction).toBe('mark_as_contested');

    // Tenant-scope active material is REDACTED (not surfaced) in public.
    const redactionReasons = publicPack.redacted.map((r) => r.reason);
    expect(redactionReasons).toEqual(
      expect.arrayContaining(['privacy_tenant_in_public_frame']),
    );

    // sealed-privacy + actor_private + revoked + forgotten are EXCLUDED
    // in public.
    const exclusionReasons = publicPack.excluded_summary.map((s) => s.reason);
    expect(exclusionReasons).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'status_forgotten_from_recall',
        'privacy_sealed',
        'privacy_actor_private_in_public_frame',
      ]),
    );

    // None of the private assertion_ids appear in the public surface.
    const publicSurfacedIds = [
      ...publicPack.included.map((i) => i.assertion_id),
      ...publicPack.marked.map((m) => m.assertion_id),
    ];
    const privateAssertionIds = [
      estate.active_tenant_claim.assertion_id,
      estate.active_sealed_note.assertion_id,
      estate.revoked_reflection.assertion_id,
      estate.forgotten_observation.assertion_id,
      estate.private_relationship.assertion_id,
    ];
    for (const privateId of privateAssertionIds) {
      expect(publicSurfacedIds).not.toContain(privateId);
      expect(publicReceipt.included_assertion_ids).not.toContain(privateId);
      expect(publicReceipt.marked_assertion_ids).not.toContain(privateId);
    }

    // Hash invariants on the public side.
    expect(publicPack.pack_hash.startsWith('sha256:')).toBe(true);
    expect(publicReceipt.receipt_hash.startsWith('sha256:')).toBe(true);
    expect(publicReceipt.pack_hash).toBe(publicPack.pack_hash);
    expect(publicReceipt.recall_pack_id).toBe(publicPack.recall_pack_id);

    // recall_pack_emitted audit event is present for the allowed public
    // recall and references the public pack hash.
    const publicAuditEvent = estate.store.auditLog
      .list()
      .find((e) => e.audit_event_id === publicOut.audit_event_id);
    expect(publicAuditEvent).toBeDefined();
    expect(publicAuditEvent!.event_type).toBe('recall_pack_emitted');
    expect(publicAuditEvent!.result_hash).toBe(publicPack.pack_hash);

    // No private body text / relationship subject / relation token leaks
    // into the public pack, the public receipt, OR the audit event payload.
    const publicSurfaceJson = JSON.stringify({
      pack: publicPack,
      receipt: publicReceipt,
      audit: publicAuditEvent,
    });
    for (const fragment of PRIVATE_TEXT_FRAGMENTS) {
      expect(publicSurfaceJson).not.toContain(fragment);
    }

    // Audit chain still verifies after both recalls.
    const chain = estate.store.auditLog.verifyChain(
      estate.active_public_observation.estate_id,
    );
    expect(chain.ok).toBe(true);
  });

  it('summary metadata explains the public membrane without exposing hidden estate contents', () => {
    const estate = buildEstateThroughTransitions();
    const publicOut = executeRecall(estate.store, publicDiscordRequest(), NOW);
    expect(publicOut.ok).toBe(true);
    const publicPack = publicOut.pack!;
    const publicReceipt = publicOut.receipt!;

    // Pack-level reasons cover the membrane's exclusion + redaction set.
    const packReasons = [
      ...publicPack.excluded_summary.map((s) => s.reason),
      ...publicPack.redacted.map((r) => r.reason),
    ];
    expect(packReasons).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'status_forgotten_from_recall',
        'privacy_sealed',
        'privacy_actor_private_in_public_frame',
        'privacy_tenant_in_public_frame',
      ]),
    );

    // Receipt-level exclusion is per-reason; receipt-level redaction is a
    // single integer count (no per-reason breakdown). This is the
    // documented redaction-summary gap at the receipt layer — pack.redacted
    // already exposes per-reason counts, so the gap is receipt-only.
    const receiptExclusionReasons = Object.keys(
      publicReceipt.excluded_counts_by_reason,
    );
    expect(receiptExclusionReasons).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'status_forgotten_from_recall',
        'privacy_sealed',
        'privacy_actor_private_in_public_frame',
      ]),
    );
    expect(typeof publicReceipt.redacted_count).toBe('number');
    expect(publicReceipt.redacted_count).toBeGreaterThan(0);

    // Reason strings carry no body text, subject, or relation payload.
    for (const fragment of PRIVATE_TEXT_FRAGMENTS) {
      for (const reason of packReasons) {
        expect(reason).not.toContain(fragment);
      }
      for (const reason of receiptExclusionReasons) {
        expect(reason).not.toContain(fragment);
      }
    }
  });
});
