// Phase 31F — Operator Recall Wedge demo.
//
// Composes the Recall Wedge MVP proofs into one deterministic harness:
// build a single actor estate via real EstateStore transitions, then run
// `executeRecall` twice — once under private_operator, once under
// public_discord — and emit a structured report describing both packs,
// receipts, and the private/public membrane invariants.
//
// The CLI entrypoint (`scripts/demo-recall-wedge-31f.ts`) writes
// `buildRecallWedgeDemoReport()` to stdout. The documented operator
// command is `npm run --silent demo:recall-wedge` (the `--silent` flag
// suppresses npm's lifecycle banner so the captured stdout is a single
// parseable JSON document). The Phase 31F test imports
// `buildRecallWedgeDemoReport` directly so it can assert on the same
// report shape.

import {
  EstateStore,
  executeRecall,
  type Assertion,
  type AssertionClass,
  type AuditEvent,
  type ExclusionSummary,
  type RecallPack,
  type RecallReceipt,
  type RecallRequest,
  type RedactionSummary,
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

const NOW = '2026-05-24T15:00:00Z';

// Distinct, easily-searchable fingerprints for each private assertion so
// the demo and the test can prove they do NOT leak into public surfaces.
const TEXT_OBS_PUBLIC = 'phase-31f: public-safe observation';
const TEXT_PREF_PUBLIC = 'phase-31f: public-safe preference';
const TEXT_CONTESTED = 'phase-31f: public claim slated for contestation';

const TEXT_TENANT = 'phase-31f: tenant-only operator claim PHASE31F-PRIVATE-TENANT';
const TEXT_SEALED = 'phase-31f: sealed-privacy operator note PHASE31F-PRIVATE-SEALED';
const TEXT_REVOKED = 'phase-31f: reflection slated for revocation PHASE31F-PRIVATE-REVOKED';
const TEXT_FORGET = 'phase-31f: tenant observation slated for forget PHASE31F-PRIVATE-FORGOTTEN';
const TEXT_REL_SUBJECT = 'user:phase31f-private-subject';
const TEXT_REL_RELATION = 'has_unresolved_dispute_PHASE31F-PRIVATE-REL';

export const PHASE_31F_PRIVATE_FINGERPRINTS: readonly string[] = [
  'PHASE31F-PRIVATE-TENANT',
  'PHASE31F-PRIVATE-SEALED',
  'PHASE31F-PRIVATE-REVOKED',
  'PHASE31F-PRIVATE-FORGOTTEN',
  'PHASE31F-PRIVATE-REL',
  TEXT_REL_SUBJECT,
];

const REQUESTED_CLASSES: AssertionClass[] = [
  'observation',
  'preference',
  'claim',
  'reflection',
  'relationship',
];

interface BuiltEstate {
  store: EstateStore;
  active_public_observation: Assertion;
  active_public_preference: Assertion;
  active_tenant_claim: Assertion;
  active_sealed_note: Assertion;
  active_actor_private_relationship: Assertion;
  contested_public_claim: Assertion;
  revoked_reflection: Assertion;
  forgotten_observation: Assertion;
}

export interface RecallFrameSummary {
  pack_hash: string;
  receipt_hash: string;
  recall_pack_id: string;
  receipt_id: string;
  included_count: number;
  marked_count: number;
  redacted_counts_by_reason: RedactionSummary[];
  excluded_counts_by_reason: ExclusionSummary[];
  audit_event_id: string;
  recall_pack_emitted: boolean;
}

export interface MembraneInvariants {
  public_private_payload_leak: boolean;
  public_private_assertion_id_leak: boolean;
  public_has_redaction_reasons: boolean;
  public_has_exclusion_reasons: boolean;
  contested_marked_not_usable: boolean;
  revoked_excluded: boolean;
  forgotten_excluded: boolean;
  sealed_excluded: boolean;
  actor_private_excluded: boolean;
  tenant_redacted_in_public: boolean;
}

export interface AuditSummary {
  private_recall_pack_emitted: boolean;
  public_recall_pack_emitted: boolean;
  audit_chain_verified: boolean;
}

export interface RecallWedgeDemoReport {
  demo: 'straylight_recall_wedge';
  phase: '31F';
  estate_id: string;
  actor_id: string;
  assertion_count: number;
  private_operator: RecallFrameSummary;
  public_discord: RecallFrameSummary;
  membrane: MembraneInvariants;
  audit: AuditSummary;
}

function buildEstateThroughTransitions(): BuiltEstate {
  const store = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });

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
  if (!obs.ok || !obs.assertion) throw new Error('admit failed: public observation');

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
  if (!pref.ok || !pref.assertion) throw new Error('admit failed: public preference');

  const tenantClaim = store.admit(
    buildCandidate({
      assertion_class: 'claim',
      body: { text: TEXT_TENANT },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  if (!tenantClaim.ok || !tenantClaim.assertion) throw new Error('admit failed: tenant claim');

  const sealed = store.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: TEXT_SEALED },
      privacy_scope: 'sealed',
      risk_level: 'low',
      signer: SIGNERS.operator,
    }),
    NOW,
  );
  if (!sealed.ok || !sealed.assertion) throw new Error('admit failed: sealed note');

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
  if (!relationship.ok || !relationship.assertion) {
    throw new Error('admit failed: actor_private relationship');
  }

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
  if (!contestable.ok || !contestable.assertion) {
    throw new Error('admit failed: contestable public claim');
  }
  const challengeSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'challenge',
    body: { target: contestable.assertion.assertion_id },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const challenge = store.challenge({
    target_assertion_id: contestable.assertion.assertion_id,
    challenge: {
      challenge_type: 'unsupported',
      requested_effect: 'mark_contested',
      evidence_refs: [],
      explanation: 'phase-31f: contestation evidence pending',
      signatures: [challengeSig],
    },
    now: NOW,
  });
  if (!challenge.ok || challenge.updated_target?.status !== 'contested') {
    throw new Error('challenge failed: contestable claim did not transition');
  }

  const reflection = store.admit(
    buildCandidate({
      assertion_class: 'reflection',
      body: { text: TEXT_REVOKED },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.runtime,
    }),
    NOW,
  );
  if (!reflection.ok || !reflection.assertion) {
    throw new Error('admit failed: reflection (to be revoked)');
  }
  const revokeSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'revocation',
    body: { target: reflection.assertion.assertion_id },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const revoke = store.revoke({
    target_assertion_id: reflection.assertion.assertion_id,
    revocation: {
      reason: 'phase-31f: reflection superseded',
      signatures: [revokeSig],
    },
    now: NOW,
  });
  if (!revoke.ok || revoke.updated_target?.status !== 'revoked') {
    throw new Error('revoke failed: reflection did not transition');
  }

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
  if (!forgetTarget.ok || !forgetTarget.assertion) {
    throw new Error('admit failed: observation (to be forgotten)');
  }
  const forgetSig: SignatureEnvelope = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'phase-31f: forget request' },
    signer: SIGNERS.reviewer,
  }).signatures[0]!;
  const forget = store.forget({
    target_assertion_id: forgetTarget.assertion.assertion_id,
    reason: 'phase-31f: operator-requested forget',
    signatures: [forgetSig],
    now: NOW,
  });
  if (!forget.ok || forget.updated_target?.status !== 'forgotten_from_recall') {
    throw new Error('forget failed: observation did not transition');
  }

  return {
    store,
    active_public_observation: obs.assertion,
    active_public_preference: pref.assertion,
    active_tenant_claim: tenantClaim.assertion,
    active_sealed_note: sealed.assertion,
    active_actor_private_relationship: relationship.assertion,
    contested_public_claim: contestable.assertion,
    revoked_reflection: reflection.assertion,
    forgotten_observation: forgetTarget.assertion,
  };
}

function privateOperatorRequest(): RecallRequest {
  return buildRecallRequest({
    task: 'phase-31f-private-operator',
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
    task: 'phase-31f-public-discord',
    environment_frame: 'public_discord',
    risk_profile: 'low',
    requested_classes: REQUESTED_CLASSES,
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    include_receipt_detail: 'standard',
    signer: SIGNERS.operator,
  });
}

function summarizeFrame(
  pack: RecallPack,
  receipt: RecallReceipt,
  audit_event_id: string,
  audit_event: AuditEvent | undefined,
): RecallFrameSummary {
  return {
    pack_hash: pack.pack_hash,
    receipt_hash: receipt.receipt_hash,
    recall_pack_id: pack.recall_pack_id,
    receipt_id: receipt.receipt_id,
    included_count: pack.included.length,
    marked_count: pack.marked.length,
    redacted_counts_by_reason: pack.redacted.map((r) => ({
      reason: r.reason,
      count: r.count,
    })),
    excluded_counts_by_reason: pack.excluded_summary.map((r) => ({
      reason: r.reason,
      count: r.count,
    })),
    audit_event_id,
    recall_pack_emitted: audit_event?.event_type === 'recall_pack_emitted',
  };
}

export function buildRecallWedgeDemoReport(): RecallWedgeDemoReport {
  const estate = buildEstateThroughTransitions();

  const privateOut = executeRecall(estate.store, privateOperatorRequest(), NOW);
  if (!privateOut.ok || !privateOut.pack || !privateOut.receipt || !privateOut.audit_event_id) {
    throw new Error(
      `private_operator recall denied: ${privateOut.policy_decision.reasons.join(',')}`,
    );
  }

  const publicOut = executeRecall(estate.store, publicDiscordRequest(), NOW);
  if (!publicOut.ok || !publicOut.pack || !publicOut.receipt || !publicOut.audit_event_id) {
    throw new Error(
      `public_discord recall denied: ${publicOut.policy_decision.reasons.join(',')}`,
    );
  }

  const privateAuditId = privateOut.audit_event_id;
  const publicAuditId = publicOut.audit_event_id;

  const auditEvents = estate.store.auditLog.list();
  const privateAudit = auditEvents.find((e) => e.audit_event_id === privateAuditId);
  const publicAudit = auditEvents.find((e) => e.audit_event_id === publicAuditId);

  const privateSummary = summarizeFrame(
    privateOut.pack,
    privateOut.receipt,
    privateAuditId,
    privateAudit,
  );
  const publicSummary = summarizeFrame(
    publicOut.pack,
    publicOut.receipt,
    publicAuditId,
    publicAudit,
  );

  const privateAssertionIds = new Set([
    estate.active_tenant_claim.assertion_id,
    estate.active_sealed_note.assertion_id,
    estate.active_actor_private_relationship.assertion_id,
    estate.revoked_reflection.assertion_id,
    estate.forgotten_observation.assertion_id,
  ]);

  const publicSurfaceJson = JSON.stringify({
    pack: publicOut.pack,
    receipt: publicOut.receipt,
    audit: publicAudit,
  });

  const publicSurfacedIds = [
    ...publicOut.pack.included.map((i) => i.assertion_id),
    ...publicOut.pack.marked.map((m) => m.assertion_id),
  ];

  const publicReasons = new Set(
    publicOut.pack.excluded_summary.map((s) => s.reason),
  );
  const publicRedactionReasons = new Set(
    publicOut.pack.redacted.map((r) => r.reason),
  );

  const contestedMark = publicOut.pack.marked.find(
    (m) => m.assertion_id === estate.contested_public_claim.assertion_id,
  );

  const chain = estate.store.auditLog.verifyChain(
    estate.active_public_observation.estate_id,
  );

  const membrane: MembraneInvariants = {
    public_private_payload_leak: PHASE_31F_PRIVATE_FINGERPRINTS.some((f) =>
      publicSurfaceJson.includes(f),
    ),
    public_private_assertion_id_leak: [...privateAssertionIds].some((id) =>
      publicSurfaceJson.includes(id),
    ),
    public_has_redaction_reasons: publicOut.pack.redacted.length > 0,
    public_has_exclusion_reasons: publicOut.pack.excluded_summary.length > 0,
    contested_marked_not_usable:
      Boolean(contestedMark) && contestedMark!.use_instruction !== 'usable',
    revoked_excluded:
      publicReasons.has('status_revoked') &&
      !publicSurfacedIds.includes(estate.revoked_reflection.assertion_id),
    forgotten_excluded:
      publicReasons.has('status_forgotten_from_recall') &&
      !publicSurfacedIds.includes(estate.forgotten_observation.assertion_id),
    sealed_excluded:
      publicReasons.has('privacy_sealed') &&
      !publicSurfacedIds.includes(estate.active_sealed_note.assertion_id),
    actor_private_excluded:
      publicReasons.has('privacy_actor_private_in_public_frame') &&
      !publicSurfacedIds.includes(
        estate.active_actor_private_relationship.assertion_id,
      ),
    tenant_redacted_in_public:
      publicRedactionReasons.has('privacy_tenant_in_public_frame') &&
      !publicSurfacedIds.includes(estate.active_tenant_claim.assertion_id),
  };

  const audit: AuditSummary = {
    private_recall_pack_emitted: privateAudit?.event_type === 'recall_pack_emitted',
    public_recall_pack_emitted: publicAudit?.event_type === 'recall_pack_emitted',
    audit_chain_verified: chain.ok,
  };

  return {
    demo: 'straylight_recall_wedge',
    phase: '31F',
    estate_id: privateOut.pack.estate_id,
    actor_id: privateOut.pack.actor_id,
    assertion_count: estate.store.listAssertions().length,
    private_operator: privateSummary,
    public_discord: publicSummary,
    membrane,
    audit,
  };
}
