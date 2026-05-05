// Phase 10 — Finn runtime-enforcement fixture exporter.
//
// Usage:
//   npm run finn:enforcement
//
// Writes deterministic JSON examples to fixtures/finn-runtime-enforcement/
// describing the runtime-enforcement decisions Finn should eventually make
// once it consumes the wedge's stable contracts. These fixtures are
// CURRENT-SHAPE LOCAL examples produced from the wedge's public API. They
// are NOT official Finn fixtures, NOT canonical Finn schemas, and NOT a
// claim that Finn integration is complete. They do not import from
// loa-finn, .loa, .claude, or any sibling repo.
//
// Each fixture is a self-describing JSON object with:
//   - case_name           : stable identifier for the case
//   - expected_allowed    : did Finn's runtime gate allow the move?
//   - reason              : human-readable explanation of allow/deny
//   - input               : the shape Finn would receive at the gate
//   - expected_output     : the shape Finn must produce on accept/deny
//
// Re-running the script with the same wedge inputs produces byte-identical
// output. See docs/handoffs/finn-runtime-enforcement-issue.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AuditLog,
  EstateStore,
  InMemoryStorage,
  commitmentForRecallReceipt,
  computeCommitmentRoot,
  executeRecall,
  policyForAdmitAssertion,
  validateCandidateAssertion,
  type AuditEvent,
  type Assertion,
  type CommitmentRoot,
  type RecallPack,
  type RecallReceipt,
  type RecallRequest,
  type PolicyDecision,
} from '../src/straylight/index.js';
import {
  SIGNERS,
  buildCandidate,
  buildRecallRequest,
  buildSeededAssertion,
  loadActor,
  loadEstate,
  loadKeyring,
} from '../fixtures/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
export const DEFAULT_OUT_DIR = resolve(ROOT, 'fixtures', 'finn-runtime-enforcement');

// Deterministic timeline so re-running the export produces stable IDs.
const T = {
  observation_admit: '2026-05-05T10:00:00Z',
  unknown_admit:     '2026-05-05T10:05:00Z',
  identity_admit:    '2026-05-05T10:10:00Z',
  private_seed:      '2026-05-05T10:15:00Z',
  revoked_seed:      '2026-05-05T10:20:00Z',
  contested_seed:    '2026-05-05T10:25:00Z',
  receipt_recall:    '2026-05-05T11:00:00Z',
  contested_recall:  '2026-05-05T11:05:00Z',
  private_recall:    '2026-05-05T11:10:00Z',
  revoked_recall:    '2026-05-05T11:15:00Z',
  commitment_a:      '2026-05-05T12:00:00Z',
  commitment_b:      '2026-05-05T12:05:00Z',
} as const;

export interface FinnFixture {
  case_name: string;
  expected_allowed: boolean;
  reason: string;
  input: unknown;
  expected_output: unknown;
}

export interface FixtureFile {
  filename: string;
  content: FinnFixture;
}

interface RealOutputs {
  allowedAdmit: {
    assertion: Assertion;
    auditEvent: AuditEvent;
    policyDecision: PolicyDecision;
    candidate: ReturnType<typeof buildCandidate>;
  };
  unknownDeny: {
    candidate: ReturnType<typeof buildCandidate>;
    policyDecision: PolicyDecision;
  };
  incompetentDeny: {
    candidate: ReturnType<typeof buildCandidate>;
    policyDecision: PolicyDecision;
  };
  privateExclusion: {
    request: RecallRequest;
    pack: RecallPack;
    receipt: RecallReceipt;
    privateAssertion: Assertion;
  };
  revokedExclusion: {
    request: RecallRequest;
    pack: RecallPack;
    receipt: RecallReceipt;
    revokedAssertion: Assertion;
  };
  contestedMarked: {
    request: RecallRequest;
    pack: RecallPack;
    receipt: RecallReceipt;
    contestedAssertion: Assertion;
  };
  receiptRequired: {
    request: RecallRequest;
    pack: RecallPack;
    receipt: RecallReceipt;
  };
  auditChainTamper: {
    goodEvent: AuditEvent;
    tamperedEvent: AuditEvent;
    estateId: string;
  };
  commitmentChange: {
    rootA: CommitmentRoot;
    rootB: CommitmentRoot;
    receiptA: RecallReceipt;
    receiptB: RecallReceipt;
  };
}

function buildRealOutputs(): RealOutputs {
  // ─── Setup: a clean store dedicated to admission examples. ───────────
  const admitStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });

  // 1. Allowed admit: runtime admits an observation.
  const allowedCandidate = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'Finn-handoff: a runtime-signed observation Finn should admit.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.runtime,
    signed_at: T.observation_admit,
  });
  const allowedOut = admitStore.admit(allowedCandidate, T.observation_admit);
  if (!allowedOut.ok || !allowedOut.assertion) {
    throw new Error('finn-enforcement: allowed admit failed unexpectedly');
  }
  const allowedAuditEvent = admitStore.auditLog
    .listFor(loadEstate().estate_id)
    .find((e) => e.event_type === 'assertion_admitted');
  if (!allowedAuditEvent) {
    throw new Error('finn-enforcement: expected an assertion_admitted event');
  }

  // 2. Denied admit (unknown signer). Build a clean policy probe; do NOT
  //    mutate the admit store (the wedge would refuse and emit a denial
  //    transition, which we re-derive instead so the fixture is purely
  //    a policy-decision object).
  const unknownCandidate = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'Finn-handoff: unknown-signer admission Finn should deny.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.unknown,
    signed_at: T.unknown_admit,
  });
  const unknownClassValidation = validateCandidateAssertion(unknownCandidate);
  const unknownDecision = policyForAdmitAssertion({
    candidate: unknownCandidate,
    class_validation: unknownClassValidation,
    keyring: admitStore.getKeyring(),
    now: T.unknown_admit,
  });
  if (unknownDecision.decision !== 'deny') {
    throw new Error('finn-enforcement: expected deny for unknown signer');
  }

  // 3. Denied admit (incompetent signer): runtime tries to admit identity.
  const identityCandidate = buildCandidate({
    assertion_class: 'identity',
    body: { attribute: 'role', value: 'finn-handoff demo agent' },
    privacy_scope: 'tenant',
    risk_level: 'high',
    signer: SIGNERS.runtime,
    signed_at: T.identity_admit,
  });
  const identityClassValidation = validateCandidateAssertion(identityCandidate);
  const identityDecision = policyForAdmitAssertion({
    candidate: identityCandidate,
    class_validation: identityClassValidation,
    keyring: admitStore.getKeyring(),
    now: T.identity_admit,
  });
  if (identityDecision.decision !== 'deny') {
    throw new Error('finn-enforcement: expected deny for runtime admitting identity');
  }

  // ─── Private-to-public exclusion. ────────────────────────────────────
  const privateStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const privateAssertion = buildSeededAssertion({
    status: 'active',
    assertion_class: 'observation',
    body: { text: 'Finn-handoff: a private observation Finn must NOT leak to public_discord.' },
    privacy_scope: 'actor_private',
    risk_level: 'medium',
    signer: SIGNERS.operator,
    signed_at: T.private_seed,
    created_at: T.private_seed,
  });
  privateStore.seedAssertion(privateAssertion);
  // Add one valid public observation so the pack is non-empty.
  const privatePublicCandidate = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'Finn-handoff: public counterpart Finn may include.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.runtime,
    signed_at: T.private_seed,
  });
  privateStore.admit(privatePublicCandidate, T.private_seed);
  const privateRequest = buildRecallRequest({
    task: 'finn-handoff: public_discord recall, must exclude private',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.private_recall,
    request_id: 'rreq_finn-private-to-public-exclusion',
  });
  const privateRecall = executeRecall(privateStore, privateRequest, T.private_recall);
  if (!privateRecall.ok || !privateRecall.pack || !privateRecall.receipt) {
    throw new Error('finn-enforcement: expected private-exclusion recall to succeed (with private excluded)');
  }

  // ─── Revoked-assertion exclusion. ────────────────────────────────────
  const revokedStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const revokedAssertion = buildSeededAssertion({
    status: 'revoked',
    assertion_class: 'observation',
    body: { text: 'Finn-handoff: a revoked observation Finn must exclude from public_discord.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.operator,
    signed_at: T.revoked_seed,
    created_at: T.revoked_seed,
  });
  revokedStore.seedAssertion(revokedAssertion);
  const revokedPublicCandidate = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'Finn-handoff: active companion Finn may include.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.runtime,
    signed_at: T.revoked_seed,
  });
  revokedStore.admit(revokedPublicCandidate, T.revoked_seed);
  const revokedRequest = buildRecallRequest({
    task: 'finn-handoff: public_discord recall, must exclude revoked',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.revoked_recall,
    request_id: 'rreq_finn-revoked-exclusion',
  });
  const revokedRecall = executeRecall(revokedStore, revokedRequest, T.revoked_recall);
  if (!revokedRecall.ok || !revokedRecall.pack || !revokedRecall.receipt) {
    throw new Error('finn-enforcement: expected revoked-exclusion recall to succeed (with revoked excluded)');
  }

  // ─── Contested-assertion marking. ────────────────────────────────────
  const contestedStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const contestedAssertion = buildSeededAssertion({
    status: 'contested',
    assertion_class: 'observation',
    body: { text: 'Finn-handoff: a contested observation Finn must surface as marked, never usable.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.operator,
    signed_at: T.contested_seed,
    created_at: T.contested_seed,
  });
  contestedStore.seedAssertion(contestedAssertion);
  const contestedRequest = buildRecallRequest({
    task: 'finn-handoff: public_discord recall, contested must be marked',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.contested_recall,
    request_id: 'rreq_finn-contested-marked',
  });
  const contestedRecall = executeRecall(contestedStore, contestedRequest, T.contested_recall);
  if (!contestedRecall.ok || !contestedRecall.pack || !contestedRecall.receipt) {
    throw new Error('finn-enforcement: expected contested recall to succeed (with item marked)');
  }

  // ─── Receipt-required example: a clean recall + receipt pair. ────────
  const receiptStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const receiptCandidate = buildCandidate({
    assertion_class: 'observation',
    body: { text: 'Finn-handoff: receipt-required canonical observation.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.runtime,
    signed_at: T.receipt_recall,
  });
  receiptStore.admit(receiptCandidate, T.receipt_recall);
  const receiptRequest = buildRecallRequest({
    task: 'finn-handoff: receipt is mandatory on every served pack',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.receipt_recall,
    request_id: 'rreq_finn-audit-receipt-required',
  });
  const receiptRecall = executeRecall(receiptStore, receiptRequest, T.receipt_recall);
  if (!receiptRecall.ok || !receiptRecall.pack || !receiptRecall.receipt) {
    throw new Error('finn-enforcement: expected receipt-required recall to succeed');
  }

  // ─── Audit-chain tamper. ─────────────────────────────────────────────
  // Re-use the admit-store's audit chain for a real chained event; we then
  // deterministically derive a tampered copy. Finn's runtime gate must
  // detect the mismatch through its persisted-chain successor.
  const goodEvent = allowedAuditEvent;
  const tamperedEvent: AuditEvent = {
    ...goodEvent,
    audit_hash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
  };

  // ─── Commitment-root change. ─────────────────────────────────────────
  // Two recall receipts whose pack content differs produce different
  // commitment roots. Finn's runtime gate must refuse to anchor a root
  // that does not reproduce from its inputs.
  const commitmentSignerA = {
    id: SIGNERS.operator.signer_id,
    type: SIGNERS.operator.signer_type,
    key_ref: SIGNERS.operator.key_ref,
  };

  // The first commitment is over the receipt-required recall.
  const rootA = commitmentForRecallReceipt(
    receiptRecall.receipt,
    commitmentSignerA,
    T.commitment_a,
  );

  // The second commitment is over a *different* receipt produced by a
  // recall whose included material has changed (the contested-marked
  // recall has a different pack). Same canonical projection family,
  // different inputs → different `root_hash`.
  const rootB = commitmentForRecallReceipt(
    contestedRecall.receipt,
    commitmentSignerA,
    T.commitment_b,
  );
  if (rootA.root_hash === rootB.root_hash) {
    throw new Error('finn-enforcement: expected distinct commitment roots');
  }

  return {
    allowedAdmit: {
      assertion: allowedOut.assertion,
      auditEvent: goodEvent,
      policyDecision: allowedOut.policy_decision,
      candidate: allowedCandidate,
    },
    unknownDeny: {
      candidate: unknownCandidate,
      policyDecision: unknownDecision,
    },
    incompetentDeny: {
      candidate: identityCandidate,
      policyDecision: identityDecision,
    },
    privateExclusion: {
      request: privateRequest,
      pack: privateRecall.pack,
      receipt: privateRecall.receipt,
      privateAssertion,
    },
    revokedExclusion: {
      request: revokedRequest,
      pack: revokedRecall.pack,
      receipt: revokedRecall.receipt,
      revokedAssertion,
    },
    contestedMarked: {
      request: contestedRequest,
      pack: contestedRecall.pack,
      receipt: contestedRecall.receipt,
      contestedAssertion,
    },
    receiptRequired: {
      request: receiptRequest,
      pack: receiptRecall.pack,
      receipt: receiptRecall.receipt,
    },
    auditChainTamper: {
      goodEvent,
      tamperedEvent,
      estateId: loadEstate().estate_id,
    },
    commitmentChange: {
      rootA,
      rootB,
      receiptA: receiptRecall.receipt,
      receiptB: contestedRecall.receipt,
    },
  };
}

export function buildFixtures(): FinnFixture[] {
  const r = buildRealOutputs();

  return [
    {
      case_name: 'allowed_transition_admit_observation',
      expected_allowed: true,
      reason:
        "Finn's runtime gate runs class validation, then policyForAdmitAssertion, then evaluateCompetence. The runtime signer is on the keyring with status 'active' and the runtime role is in rule:admit-observation-runtime's required_signer_roles. The candidate class-validates. Decision: allow.",
      input: {
        gate: 'admit_assertion',
        candidate: r.allowedAdmit.candidate,
        keyring_id: loadKeyring().keyring_id,
        now: T.observation_admit,
      },
      expected_output: {
        decision: r.allowedAdmit.policyDecision.decision,
        admitted_assertion: r.allowedAdmit.assertion,
        audit_event: r.allowedAdmit.auditEvent,
        receipt_required: false,
        notes:
          'On admit success, the runtime gate emits an `admission` TransitionReceipt and an `assertion_admitted` AuditEvent. The fixture pins both so PR-A can compare its runtime output against the wedge.',
      },
    },
    {
      case_name: 'denied_transition_unknown_signer',
      expected_allowed: false,
      reason:
        "policyForAdmitAssertion returns decision: 'deny'. signer_competence_result.allowed is false with reason 'unknown_signer:<id>' because the candidate's signer is not on the keyring. Class validation passes; the policy lane refuses the move.",
      input: {
        gate: 'admit_assertion',
        candidate: r.unknownDeny.candidate,
        keyring_id: loadKeyring().keyring_id,
        now: T.unknown_admit,
      },
      expected_output: {
        decision: r.unknownDeny.policyDecision.decision,
        policy_decision: r.unknownDeny.policyDecision,
        deny_reason: 'unknown_signer',
        emitted_audit_event_type: 'transition_denied',
        notes:
          'On deny, the runtime gate MUST emit a `transition_denied` AuditEvent and a `denied` TransitionReceipt; no Assertion row is persisted. The fixture pins the PolicyDecision shape Finn must consume.',
      },
    },
    {
      case_name: 'denied_transition_incompetent_signer',
      expected_allowed: false,
      reason:
        "policyForAdmitAssertion returns decision: 'deny' for a runtime trying to admit `identity`. The signature envelope is self-consistent — the runtime really did sign the payload — but the runtime role is not in rule:admit-identity-reviewer-only's required_signer_roles. evaluateCompetence returns allowed: false, signer_role_forbidden:<role>. This is the load-bearing pin against the 'valid signature is signer competence' conflation.",
      input: {
        gate: 'admit_assertion',
        candidate: r.incompetentDeny.candidate,
        keyring_id: loadKeyring().keyring_id,
        now: T.identity_admit,
      },
      expected_output: {
        decision: r.incompetentDeny.policyDecision.decision,
        policy_decision: r.incompetentDeny.policyDecision,
        deny_reason: 'signer_role_forbidden_or_not_required',
        emitted_audit_event_type: 'transition_denied',
        notes:
          'A signature whose envelope is self-consistent does NOT imply signer competence. Finn MUST run evaluateCompetence even after verifyEnvelopeSelfConsistency returns true.',
      },
    },
    {
      case_name: 'denied_recall_private_to_public',
      expected_allowed: false,
      reason:
        "executeRecall in environment_frame: 'public_discord' applies privacyDispositionForFrame, which excludes assertions with privacy_scope: 'actor_private' from public frames. The private assertion is NOT in the served pack's `included` and NOT in `marked`; it appears only in the exclusion summary. Finn's runtime gate MUST preserve this exclusion.",
      input: {
        gate: 'recall_request',
        request: r.privateExclusion.request,
        seeded_private_assertion: r.privateExclusion.privateAssertion,
        now: T.private_recall,
      },
      expected_output: {
        served_pack: r.privateExclusion.pack,
        served_receipt: r.privateExclusion.receipt,
        private_assertion_in_included: false,
        private_assertion_in_marked: false,
        deny_reason: 'private_excluded_from_public_frame',
        notes:
          'The recall succeeds (with the private item excluded). Finn MUST NOT include actor_private or sealed material in any frame other than audit_review. This fixture demonstrates the exclusion summary path.',
      },
    },
    {
      case_name: 'denied_recall_revoked_assertion',
      expected_allowed: false,
      reason:
        "executeRecall applies dispositionFor, which excludes status: 'revoked' from any frame other than audit_review. The revoked assertion is NOT in the served pack's `included` and NOT in `marked`. Finn's runtime gate MUST preserve this exclusion.",
      input: {
        gate: 'recall_request',
        request: r.revokedExclusion.request,
        seeded_revoked_assertion: r.revokedExclusion.revokedAssertion,
        now: T.revoked_recall,
      },
      expected_output: {
        served_pack: r.revokedExclusion.pack,
        served_receipt: r.revokedExclusion.receipt,
        revoked_assertion_in_included: false,
        revoked_assertion_in_marked: false,
        deny_reason: 'revoked_excluded_outside_audit_review',
        notes:
          'The recall succeeds (with the revoked item excluded). The audit trail for the revoked assertion remains intact (revocation is not erasure). Finn MUST NOT surface a revoked item as usable in public frames.',
      },
    },
    {
      case_name: 'allowed_recall_contested_marked',
      expected_allowed: true,
      reason:
        "executeRecall returns the contested assertion in `marked`, never `included`. dispositionFor returns 'mark' for status: 'contested' regardless of whether mark_statuses lists it; useInstructionForMark maps the mark to 'mark_as_contested'. The pack's `included` does NOT contain the contested item. Finn's runtime gate MUST preserve this marking.",
      input: {
        gate: 'recall_request',
        request: r.contestedMarked.request,
        seeded_contested_assertion: r.contestedMarked.contestedAssertion,
        now: T.contested_recall,
      },
      expected_output: {
        served_pack: r.contestedMarked.pack,
        served_receipt: r.contestedMarked.receipt,
        contested_in_marked_count: r.contestedMarked.pack.marked.length,
        contested_in_included_count: r.contestedMarked.pack.included.length,
        notes:
          'A contested assertion is ALWAYS marked, never silently included. The marked item carries use_instruction = mark_as_contested. Finn MUST treat the marked discipline as binding: marked items are never tool inputs.',
      },
    },
    {
      case_name: 'audit_receipt_required',
      expected_allowed: true,
      reason:
        "Every served recall MUST emit a RecallReceipt. The receipt's pack_hash matches the served pack and the receipt_hash is content-addressed. detail_level (minimal / standard / debug) is applied AFTER pack assembly. A pack served without a persisted receipt is a runtime bug.",
      input: {
        gate: 'recall_request',
        request: r.receiptRequired.request,
        now: T.receipt_recall,
      },
      expected_output: {
        served_pack: r.receiptRequired.pack,
        served_receipt: r.receiptRequired.receipt,
        receipt_pack_hash_matches: true,
        receipt_required: true,
        notes:
          'Finn MUST persist the receipt durably and make it retrievable by receipt_id. detail_level (minimal/standard/debug) is applied after the pack is built so callers cannot probe via detail differences.',
      },
    },
    {
      case_name: 'audit_chain_tamper_detected',
      expected_allowed: false,
      reason:
        "AuditLog.verifyChain walks the chain and recomputes each event's audit_hash over its content + the prior event's audit_hash. Mutating audit_hash to an all-zero digest breaks the link from that row forward. verifyChain returns { ok: false, broken_at, reason: 'previous_audit_hash_mismatch' } (or equivalent). Finn's runtime gate MUST treat a broken chain as a signal to refuse new transitions on the affected estate until reconciled.",
      input: {
        gate: 'audit_chain_verification',
        estate_id: r.auditChainTamper.estateId,
        good_event: r.auditChainTamper.goodEvent,
        tampered_event: r.auditChainTamper.tamperedEvent,
        now: T.observation_admit,
      },
      expected_output: {
        verify_chain_ok: false,
        broken_reason_family: 'previous_audit_hash_mismatch',
        deny_reason: 'audit_chain_broken',
        notes:
          "The wedge's position is 'make tampering visible'. Finn's position MUST be 'block new transitions on the affected estate until an operator reconciles' — per finn-runtime-boundary.md R6.",
      },
    },
    {
      case_name: 'commitment_root_changed',
      expected_allowed: false,
      reason:
        "Two RecallReceipts with different included material produce different commitment roots. computeCommitmentRoot hashes a canonical projection of (actor_id, estate_id, commitment_type, sorted refs, sorted payload_summaries). Any change to refs or summaries produces a different root_hash. A commitment whose root_hash cannot be reproduced from the inputs MUST NOT be anchored. Finn MUST emit `commitment_generation_failed` and hold for operator review when reproducibility fails.",
      input: {
        gate: 'commitment_root_generation',
        receipt_a: r.commitmentChange.receiptA,
        receipt_b: r.commitmentChange.receiptB,
        now_a: T.commitment_a,
        now_b: T.commitment_b,
      },
      expected_output: {
        root_a: r.commitmentChange.rootA,
        root_b: r.commitmentChange.rootB,
        roots_differ: true,
        anchor_decision_when_inputs_change: 'do_not_anchor_until_reproducible',
        notes:
          'Real signature material (not dev_signature) is required before any commitment escapes Finn process. Onchain anchoring is reserved future work in loa-straylight; Finn MAY hand the root to a separate adapter once production signing is wired.',
      },
    },
  ];
}

export function listFixtureFiles(): FixtureFile[] {
  const fixtures = buildFixtures();
  return fixtures.map((f) => ({
    filename: filenameFor(f),
    content: f,
  }));
}

function filenameFor(f: FinnFixture): string {
  switch (f.case_name) {
    case 'allowed_transition_admit_observation':
      return 'allowed-transition.json';
    case 'denied_transition_unknown_signer':
      return 'denied-transition-unknown-signer.json';
    case 'denied_transition_incompetent_signer':
      return 'denied-transition-incompetent-signer.json';
    case 'denied_recall_private_to_public':
      return 'denied-recall-private-to-public.json';
    case 'denied_recall_revoked_assertion':
      return 'denied-recall-revoked-assertion.json';
    case 'allowed_recall_contested_marked':
      return 'allowed-recall-contested-marked.json';
    case 'audit_receipt_required':
      return 'audit-receipt-required.json';
    case 'audit_chain_tamper_detected':
      return 'audit-chain-tamper-detected.json';
    case 'commitment_root_changed':
      return 'commitment-root-changed.json';
    default:
      throw new Error(`finn-enforcement: no filename mapping for case ${f.case_name}`);
  }
}

export interface WriteResult {
  outDir: string;
  written: string[];
}

export function writeFixtureFiles(outDir: string = DEFAULT_OUT_DIR): WriteResult {
  const files = listFixtureFiles();
  mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const f of files) {
    const target = resolve(outDir, f.filename);
    writeFileSync(target, `${JSON.stringify(f.content, null, 2)}\n`, 'utf8');
    written.push(target);
  }
  return { outDir, written };
}

// Suppress unused-symbol noise: AuditLog and InMemoryStorage are imported
// from the wedge so this script's import surface visibly mirrors the
// runtime substrate Finn must wire (chain, storage adapter). They are not
// instantiated here — the EstateStore constructs its own InMemoryStorage,
// and the wedge's audit chain is reused via the store's audit log.
void AuditLog;
void InMemoryStorage;
void computeCommitmentRoot;

try {
  const { outDir, written } = writeFixtureFiles();
  for (const p of written) console.log(`wrote ${p}`);
  console.log(`\n${written.length} Finn runtime-enforcement fixtures written to ${outDir}`);
  console.log('reminder: these are LOCAL current-shape examples, not official Finn fixtures.');
  console.log('reminder: this is handoff prep, not Finn integration.');
} catch (err) {
  console.error('finn-enforcement export failed:', err);
  process.exitCode = 1;
}
