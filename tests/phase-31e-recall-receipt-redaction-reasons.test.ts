// Phase 31E — Recall receipt redaction-reason granularity proof.
//
// Phase 31D documented a receipt-only gap: RecallPack.redacted carries
// per-reason counts and the recall_pack_emitted audit payload mirrors
// them, but RecallReceipt.redacted_count was aggregate-only. This test
// closes that gap by proving:
//
//   * RecallReceipt.redacted_counts_by_reason exists and is per-reason;
//   * receipt.redacted_count equals the sum of the per-reason counts;
//   * pack / receipt / audit redaction summaries agree on the same
//     reason → count mapping;
//   * RecallReceipt.excluded_counts_by_reason still reports per-reason
//     exclusion counts (no regression);
//   * the new receipt-level field carries reason + count only — no
//     assertion bodies, private subject strings, relationship strings,
//     or private assertion IDs leak via this surface;
//   * private assertion IDs are absent from the entire serialized
//     public pack / receipt / audit JSON.
//
// Strictly Straylight-local: real transitions, real recall executor,
// no seedAssertion for the core proof.

import { describe, expect, it } from 'vitest';
import {
  EstateStore,
  executeRecall,
  type Assertion,
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

const NOW = '2026-05-24T14:00:00Z';

const TEXT_OBS_PUBLIC = 'phase-31e: public-safe observation';
const TEXT_TENANT_CLAIM =
  'phase-31e: tenant-only operational claim PHASE31E-PRIVATE-TENANT';
const TEXT_SEALED_NOTE =
  'phase-31e: sealed-privacy operator note PHASE31E-PRIVATE-SEALED';
const TEXT_ACTOR_PRIVATE_REL_SUBJECT = 'user:phase31e-private-subject';
const TEXT_ACTOR_PRIVATE_REL_RELATION =
  'has_unresolved_dispute_PHASE31E-PRIVATE-REL';
const TEXT_REVOKED_REFL =
  'phase-31e: reflection slated for revocation PHASE31E-PRIVATE-REFL';

const PRIVATE_TEXT_FRAGMENTS = [
  'PHASE31E-PRIVATE-TENANT',
  'PHASE31E-PRIVATE-SEALED',
  'PHASE31E-PRIVATE-REL',
  'PHASE31E-PRIVATE-REFL',
  TEXT_ACTOR_PRIVATE_REL_SUBJECT,
];

interface BuiltEstate {
  store: EstateStore;
  active_public_observation: Assertion;
  active_tenant_claim: Assertion;
  active_sealed_note: Assertion;
  active_actor_private_relationship: Assertion;
  revoked_reflection: Assertion;
}

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

  // 2. Active tenant-scope claim — REDACTED in public_discord with
  // reason privacy_tenant_in_public_frame.
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

  // 3. Active sealed-privacy note — EXCLUDED with privacy_sealed.
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

  // 4. Active actor_private relationship — EXCLUDED with
  // privacy_actor_private_in_public_frame.
  const relationship = store.admit(
    buildCandidate({
      assertion_class: 'relationship',
      body: {
        subject: TEXT_ACTOR_PRIVATE_REL_SUBJECT,
        relation: TEXT_ACTOR_PRIVATE_REL_RELATION,
      },
      privacy_scope: 'actor_private',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  expect(relationship.ok).toBe(true);

  // 5. Tenant-scope reflection → revoked via revoke transition.
  const reflection = store.admit(
    buildCandidate({
      assertion_class: 'reflection',
      body: { text: TEXT_REVOKED_REFL },
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
      reason: 'phase-31e: reflection superseded',
      signatures: [revokeSig],
    },
    now: NOW,
  });
  expect(revoke.ok).toBe(true);
  expect(revoke.updated_target?.status).toBe('revoked');

  return {
    store,
    active_public_observation: obs.assertion!,
    active_tenant_claim: tenantClaim.assertion!,
    active_sealed_note: sealed.assertion!,
    active_actor_private_relationship: relationship.assertion!,
    revoked_reflection: reflection.assertion!,
  };
}

function publicDiscordRequest(): RecallRequest {
  return buildRecallRequest({
    task: 'phase-31e-public-discord',
    environment_frame: 'public_discord',
    risk_profile: 'low',
    requested_classes: ['observation', 'claim', 'reflection', 'relationship'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    include_receipt_detail: 'standard',
    signer: SIGNERS.operator,
  });
}

describe('Phase 31E — recall receipt redaction-reason granularity', () => {
  it('public_discord recall receipt carries per-reason redaction counts that agree with pack and audit', () => {
    const estate = buildEstateThroughTransitions();
    const out = executeRecall(estate.store, publicDiscordRequest(), NOW);
    expect(out.ok).toBe(true);

    const pack = out.pack!;
    const receipt = out.receipt!;

    // Pack carries per-reason redaction counts including the membrane's
    // tenant-in-public reason.
    const packReasonCounts = new Map(pack.redacted.map((r) => [r.reason, r.count]));
    expect(packReasonCounts.has('privacy_tenant_in_public_frame')).toBe(true);
    expect(packReasonCounts.get('privacy_tenant_in_public_frame')).toBeGreaterThan(0);

    // Receipt carries an aggregate redacted_count > 0.
    expect(receipt.redacted_count).toBeGreaterThan(0);

    // Receipt carries the new per-reason field, in the project's
    // RedactionSummary shape (reason + count).
    expect(Array.isArray(receipt.redacted_counts_by_reason)).toBe(true);
    const receiptReasonCounts = new Map(
      receipt.redacted_counts_by_reason.map((r) => [r.reason, r.count]),
    );
    expect(receiptReasonCounts.has('privacy_tenant_in_public_frame')).toBe(true);
    expect(receiptReasonCounts.get('privacy_tenant_in_public_frame')).toBe(
      packReasonCounts.get('privacy_tenant_in_public_frame'),
    );

    // Aggregate equals the sum of per-reason counts (backward compat).
    const sumReceiptByReason = receipt.redacted_counts_by_reason.reduce(
      (acc, r) => acc + r.count,
      0,
    );
    expect(receipt.redacted_count).toBe(sumReceiptByReason);

    // Pack and receipt agree on the entire reason → count mapping.
    expect(receipt.redacted_counts_by_reason.length).toBe(pack.redacted.length);
    for (const r of pack.redacted) {
      expect(receiptReasonCounts.get(r.reason)).toBe(r.count);
    }

    // Audit event's redacted summary mirrors pack.redacted (the
    // recall_pack_emitted payload is the only audit shape that exposes
    // a redaction summary). The receipt-level per-reason field must
    // agree with that audit summary.
    const auditEvent = estate.store.auditLog
      .list()
      .find((e) => e.audit_event_id === out.audit_event_id);
    expect(auditEvent).toBeDefined();
    expect(auditEvent!.event_type).toBe('recall_pack_emitted');
    const auditRedacted = (auditEvent!.payload as { redacted: { reason: string; count: number }[] })
      .redacted;
    expect(Array.isArray(auditRedacted)).toBe(true);
    const auditReasonCounts = new Map(auditRedacted.map((r) => [r.reason, r.count]));
    for (const [reason, count] of receiptReasonCounts) {
      expect(auditReasonCounts.get(reason)).toBe(count);
    }
    for (const [reason, count] of auditReasonCounts) {
      expect(receiptReasonCounts.get(reason)).toBe(count);
    }
  });

  it('exclusion behavior is unchanged: per-reason exclusion counts still surface for excluded material', () => {
    const estate = buildEstateThroughTransitions();
    const out = executeRecall(estate.store, publicDiscordRequest(), NOW);
    expect(out.ok).toBe(true);

    const receipt = out.receipt!;
    const exclusionReasons = Object.keys(receipt.excluded_counts_by_reason);
    expect(exclusionReasons).toEqual(
      expect.arrayContaining([
        'status_revoked',
        'privacy_sealed',
        'privacy_actor_private_in_public_frame',
      ]),
    );
    for (const r of exclusionReasons) {
      expect(receipt.excluded_counts_by_reason[r]).toBeGreaterThan(0);
    }
  });

  it('the new receipt-level reason field carries reason + count only — no body, subject, relation, or assertion IDs leak via it', () => {
    const estate = buildEstateThroughTransitions();
    const out = executeRecall(estate.store, publicDiscordRequest(), NOW);
    expect(out.ok).toBe(true);

    const receipt = out.receipt!;

    // Exact shape: every entry has exactly two keys, `reason` (string)
    // and `count` (positive integer). No payload leak channel.
    for (const entry of receipt.redacted_counts_by_reason) {
      expect(Object.keys(entry).sort()).toEqual(['count', 'reason']);
      expect(typeof entry.reason).toBe('string');
      expect(typeof entry.count).toBe('number');
      expect(Number.isInteger(entry.count)).toBe(true);
      expect(entry.count).toBeGreaterThan(0);
    }

    // Reason strings carry no body text fragments, no subject strings,
    // no relation tokens, and no private assertion IDs.
    const privateAssertionIds = [
      estate.active_tenant_claim.assertion_id,
      estate.active_sealed_note.assertion_id,
      estate.active_actor_private_relationship.assertion_id,
      estate.revoked_reflection.assertion_id,
    ];
    for (const entry of receipt.redacted_counts_by_reason) {
      for (const fragment of PRIVATE_TEXT_FRAGMENTS) {
        expect(entry.reason).not.toContain(fragment);
      }
      for (const id of privateAssertionIds) {
        expect(entry.reason).not.toContain(id);
      }
    }
  });

  it('serialized public pack, receipt, and audit event do not contain private payload fragments or private assertion IDs', () => {
    const estate = buildEstateThroughTransitions();
    const out = executeRecall(estate.store, publicDiscordRequest(), NOW);
    expect(out.ok).toBe(true);

    const pack = out.pack!;
    const receipt = out.receipt!;
    const auditEvent = estate.store.auditLog
      .list()
      .find((e) => e.audit_event_id === out.audit_event_id);
    expect(auditEvent).toBeDefined();

    const publicSurfaceJson = JSON.stringify({
      pack,
      receipt,
      audit: auditEvent,
    });

    for (const fragment of PRIVATE_TEXT_FRAGMENTS) {
      expect(publicSurfaceJson).not.toContain(fragment);
    }

    // Private assertion IDs must not appear anywhere in the serialized
    // public pack / receipt / audit JSON — not in included, not in
    // marked, not in any aggregate field, not in audit payload.
    const privateAssertionIds = [
      estate.active_tenant_claim.assertion_id,
      estate.active_sealed_note.assertion_id,
      estate.active_actor_private_relationship.assertion_id,
      estate.revoked_reflection.assertion_id,
    ];
    for (const id of privateAssertionIds) {
      expect(publicSurfaceJson).not.toContain(id);
    }

    // The public observation's id IS expected to appear (it's the
    // included assertion); proving the test is exercising the right
    // serialization rather than a no-op string search.
    expect(publicSurfaceJson).toContain(
      estate.active_public_observation.assertion_id,
    );
  });
});
