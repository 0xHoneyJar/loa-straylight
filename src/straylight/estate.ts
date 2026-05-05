// Estate store + transition executor.
//
// Phase 2: persistence delegated to a StorageAdapter.
// Phase 3: every transition (admit / challenge / revoke / forget — and every
// denial) emits a structured TransitionReceipt that is persisted via the
// storage adapter alongside the audit event. The receipt is the contract
// downstream consumers (commitment, appeal, operator inspection) use; the
// audit event is the chained log entry.

import { sha256 } from './canonical.js';
import { contentId, payloadHash } from './ids.js';
import { AuditLog } from './audit.js';
import { policyForAdmitAssertion, policyForTransition } from './policy.js';
import { validateCandidateAssertion } from './validators/class-validator.js';
import { InMemoryStorage } from './storage/in-memory.js';
import { loadBundle, saveBundle } from './storage/types.js';
import type { StorageAdapter } from './storage/types.js';
import type {
  Actor,
  ActorEstate,
  Assertion,
  AuditEvent,
  CandidateAssertion,
  Challenge,
  ClassValidationResult,
  EstateTransition,
  ForgetRecord,
  ID,
  Keyring,
  PolicyDecision,
  Revocation,
  SignatureEnvelope,
  TransitionReceipt,
  TransitionReceiptKind,
} from './types.js';

export interface EstateStoreInit {
  actor: Actor;
  estate: ActorEstate;
  keyring: Keyring;
  /**
   * Optional storage adapter. If omitted, an in-memory adapter is used.
   * The actor/estate/keyring are upserted into the adapter on construction
   * so cold-reload via {@link EstateStore.fromStorage} stays consistent.
   */
  storage?: StorageAdapter;
}

export interface AdmitOutcome {
  ok: boolean;
  assertion?: Assertion;
  transition: EstateTransition;
  audit_event_id: ID;
  policy_decision: PolicyDecision;
  class_validation: ClassValidationResult;
  receipt: TransitionReceipt;
}

export interface ChallengeOutcome {
  ok: boolean;
  challenge: Challenge;
  transition: EstateTransition;
  audit_event_id: ID;
  policy_decision: PolicyDecision;
  updated_target?: Assertion;
  receipt: TransitionReceipt;
}

export interface RevokeOutcome {
  ok: boolean;
  revocation: Revocation;
  transition: EstateTransition;
  audit_event_id: ID;
  policy_decision: PolicyDecision;
  updated_target?: Assertion;
  receipt: TransitionReceipt;
}

export interface ForgetOutcome {
  ok: boolean;
  forget: ForgetRecord;
  transition: EstateTransition;
  audit_event_id: ID;
  policy_decision: PolicyDecision;
  updated_target?: Assertion;
  receipt: TransitionReceipt;
}

export class EstateStore {
  readonly storage: StorageAdapter;
  readonly auditLog: AuditLog;
  private readonly actor: Actor;
  private readonly estate: ActorEstate;
  private readonly keyring: Keyring;

  constructor(init: EstateStoreInit) {
    this.actor = init.actor;
    this.estate = init.estate;
    this.keyring = init.keyring;
    this.storage = init.storage ?? new InMemoryStorage();
    saveBundle(this.storage, { actor: this.actor, estate: this.estate, keyring: this.keyring });
    this.auditLog = new AuditLog(this.storage);
  }

  /**
   * Cold-reload an EstateStore from a StorageAdapter. The adapter must already
   * contain the actor + estate + keyring rows; otherwise undefined is returned.
   */
  static fromStorage(storage: StorageAdapter, estate_id: ID): EstateStore | undefined {
    const bundle = loadBundle(storage, estate_id);
    if (!bundle) return undefined;
    return new EstateStore({ ...bundle, storage });
  }

  getActor(): Actor {
    return this.actor;
  }
  getEstate(): ActorEstate {
    return this.estate;
  }
  getKeyring(): Keyring {
    return this.keyring;
  }

  listAssertions(): Assertion[] {
    return this.storage.listAssertions(this.estate.estate_id);
  }
  getAssertion(id: ID): Assertion | undefined {
    return this.storage.getAssertion(id);
  }
  listTransitions(): readonly EstateTransition[] {
    return this.storage.listTransitions(this.estate.estate_id);
  }
  listTransitionReceipts(): TransitionReceipt[] {
    return this.storage.listTransitionReceipts(this.estate.estate_id);
  }

  // ─── Admit ──────────────────────────────────────────────────────────────────

  admit(candidate: CandidateAssertion, now: string): AdmitOutcome {
    const class_validation = validateCandidateAssertion(candidate);
    const policy_decision = policyForAdmitAssertion({
      candidate,
      class_validation,
      keyring: this.keyring,
      now,
    });

    const transition_id = contentId(
      { kind: 'admit_assertion', candidate, now },
      { prefix: 'trn' },
    );

    if (policy_decision.decision !== 'allow') {
      const audit_event = this.auditLog.append({
        event_type: 'transition_denied',
        actor_id: this.actor.actor_id,
        estate_id: this.estate.estate_id,
        transition_id,
        signer_refs: candidate.signatures.map((s) => s.signer_id),
        policy_decision_ref: policy_decision.policy_id,
        payload: { decision: policy_decision.decision, reasons: policy_decision.reasons },
        created_at: now,
      });
      const transition = this.buildTransition({
        transition_id,
        type: 'admit_assertion',
        target_refs: [],
        signatures: candidate.signatures,
        class_validation,
        policy_decision,
        audit_event,
        now,
      });
      this.storage.appendTransition(transition);
      const receipt = this.persistReceipt({
        kind: 'denied',
        transition,
        target_refs: [],
        decision: policy_decision,
        audit_event_id: audit_event.audit_event_id,
        signer_refs: candidate.signatures.map((s) => s.signer_id),
        metadata: { transition_type: 'admit_assertion', class: candidate.assertion_class },
        now,
      });
      return {
        ok: false,
        transition,
        audit_event_id: audit_event.audit_event_id,
        policy_decision,
        class_validation,
        receipt,
      };
    }

    const body_hash = payloadHash(candidate.body);
    const assertion_id = contentId({ body_hash, candidate, now }, { prefix: 'asrt' });
    const assertion: Assertion = {
      assertion_id,
      estate_id: candidate.estate_id,
      actor_id: candidate.actor_id,
      assertion_class: candidate.assertion_class,
      status: 'active',
      body: candidate.body,
      body_hash,
      schema_version: candidate.schema_version ?? '0.1.0',
      provenance: candidate.provenance,
      privacy_scope: candidate.privacy_scope ?? 'tenant',
      risk_level: candidate.risk_level ?? 'low',
      recall_scope: candidate.recall_scope,
      confidence: candidate.confidence,
      subject_refs: candidate.subject_refs,
      linked_assertion_refs: candidate.linked_assertion_refs,
      signatures: candidate.signatures,
      created_at: now,
      updated_at: now,
    };
    this.storage.upsertAssertion(assertion);

    const audit_event = this.auditLog.append({
      event_type: 'assertion_admitted',
      actor_id: this.actor.actor_id,
      estate_id: this.estate.estate_id,
      transition_id,
      assertion_refs: [assertion_id],
      result_hash: body_hash,
      signer_refs: candidate.signatures.map((s) => s.signer_id),
      policy_decision_ref: policy_decision.policy_id,
      payload: { class: assertion.assertion_class, status: assertion.status },
      created_at: now,
    });

    const transition = this.buildTransition({
      transition_id,
      type: 'admit_assertion',
      target_refs: [assertion_id],
      signatures: candidate.signatures,
      class_validation,
      policy_decision,
      audit_event,
      now,
    });
    this.storage.appendTransition(transition);

    const receipt = this.persistReceipt({
      kind: 'admission',
      transition,
      target_refs: [assertion_id],
      decision: policy_decision,
      audit_event_id: audit_event.audit_event_id,
      signer_refs: candidate.signatures.map((s) => s.signer_id),
      metadata: { class: assertion.assertion_class, body_hash },
      now,
    });

    return {
      ok: true,
      assertion,
      transition,
      audit_event_id: audit_event.audit_event_id,
      policy_decision,
      class_validation,
      receipt,
    };
  }

  // Test/fixture helper: insert an assertion already in a non-active status.
  // Emits an audit event but no transition receipt (this path is fixture
  // bootstrap, not a governed transition).
  seedAssertion(assertion: Assertion): void {
    if (this.storage.getAssertion(assertion.assertion_id)) {
      throw new Error(`seedAssertion: duplicate ${assertion.assertion_id}`);
    }
    this.storage.upsertAssertion(assertion);
    this.auditLog.append({
      event_type: 'assertion_admitted',
      actor_id: this.actor.actor_id,
      estate_id: this.estate.estate_id,
      assertion_refs: [assertion.assertion_id],
      result_hash: assertion.body_hash,
      signer_refs: assertion.signatures.map((s) => s.signer_id),
      payload: { seeded: true, status: assertion.status },
      created_at: assertion.created_at,
    });
  }

  // ─── Challenge ──────────────────────────────────────────────────────────────

  challenge(input: {
    target_assertion_id: ID;
    challenge: Omit<Challenge, 'challenge_id' | 'estate_id' | 'actor_id' | 'target_assertion_id' | 'created_at'>;
    now: string;
  }): ChallengeOutcome {
    const target = this.storage.getAssertion(input.target_assertion_id);
    const policy_decision = policyForTransition({
      transition_type: 'challenge_assertion',
      signatures: input.challenge.signatures,
      keyring: this.keyring,
      target_class: target?.assertion_class,
      now: input.now,
    });

    const challenge_id = contentId(
      { kind: 'challenge_assertion', body: input.challenge, target_id: input.target_assertion_id, now: input.now },
      { prefix: 'chal' },
    );
    const challenge: Challenge = {
      challenge_id,
      estate_id: this.estate.estate_id,
      actor_id: this.actor.actor_id,
      target_assertion_id: input.target_assertion_id,
      challenge_type: input.challenge.challenge_type,
      requested_effect: input.challenge.requested_effect,
      evidence_refs: input.challenge.evidence_refs,
      explanation: input.challenge.explanation,
      signatures: input.challenge.signatures,
      created_at: input.now,
    };

    const transition_id = contentId({ challenge_id, now: input.now }, { prefix: 'trn' });
    const class_validation: ClassValidationResult = {
      valid: true,
      schema_id: 'straylight.challenge.v0',
      schema_version: '0.1.0',
      errors: [],
    };

    if (policy_decision.decision !== 'allow' || !target) {
      const audit_event = this.auditLog.append({
        event_type: 'transition_denied',
        actor_id: this.actor.actor_id,
        estate_id: this.estate.estate_id,
        transition_id,
        assertion_refs: [input.target_assertion_id],
        signer_refs: input.challenge.signatures.map((s) => s.signer_id),
        policy_decision_ref: policy_decision.policy_id,
        payload: {
          decision: policy_decision.decision,
          reasons: policy_decision.reasons,
          target_missing: !target,
        },
        created_at: input.now,
      });
      const transition = this.buildTransition({
        transition_id,
        type: 'challenge_assertion',
        target_refs: [input.target_assertion_id],
        signatures: input.challenge.signatures,
        class_validation,
        policy_decision,
        audit_event,
        now: input.now,
      });
      this.storage.appendTransition(transition);
      const receipt = this.persistReceipt({
        kind: 'denied',
        transition,
        target_refs: [input.target_assertion_id],
        decision: policy_decision,
        audit_event_id: audit_event.audit_event_id,
        signer_refs: input.challenge.signatures.map((s) => s.signer_id),
        metadata: { transition_type: 'challenge_assertion', target_missing: !target },
        now: input.now,
      });
      return {
        ok: false,
        challenge,
        transition,
        audit_event_id: audit_event.audit_event_id,
        policy_decision,
        receipt,
      };
    }

    // Apply requested effect (MVP: mark_contested, demote, revoke, forget_from_recall, seal).
    const updated: Assertion = { ...target, updated_at: input.now };
    switch (input.challenge.requested_effect) {
      case 'mark_contested':
        updated.status = 'contested';
        updated.challenged_by_refs = [...(target.challenged_by_refs ?? []), challenge_id];
        break;
      case 'demote':
        updated.status = 'demoted';
        updated.challenged_by_refs = [...(target.challenged_by_refs ?? []), challenge_id];
        break;
      case 'revoke':
        updated.status = 'revoked';
        updated.revoked_by_ref = challenge_id;
        break;
      case 'forget_from_recall':
        updated.status = 'forgotten_from_recall';
        break;
      case 'seal':
        updated.status = 'sealed';
        break;
      case 'human_review':
        updated.status = 'contested';
        updated.challenged_by_refs = [...(target.challenged_by_refs ?? []), challenge_id];
        break;
    }
    this.storage.upsertAssertion(updated);

    const audit_event = this.auditLog.append({
      event_type: 'assertion_challenged',
      actor_id: this.actor.actor_id,
      estate_id: this.estate.estate_id,
      transition_id,
      assertion_refs: [input.target_assertion_id, challenge_id],
      result_hash: sha256({ status: updated.status, challenge_id }),
      signer_refs: input.challenge.signatures.map((s) => s.signer_id),
      policy_decision_ref: policy_decision.policy_id,
      payload: { effect: input.challenge.requested_effect, new_status: updated.status },
      created_at: input.now,
    });

    const transition = this.buildTransition({
      transition_id,
      type: 'challenge_assertion',
      target_refs: [input.target_assertion_id, challenge_id],
      signatures: input.challenge.signatures,
      class_validation,
      policy_decision,
      audit_event,
      now: input.now,
    });
    this.storage.appendTransition(transition);

    const receipt = this.persistReceipt({
      kind: 'challenge',
      transition,
      target_refs: [input.target_assertion_id, challenge_id],
      decision: policy_decision,
      audit_event_id: audit_event.audit_event_id,
      signer_refs: input.challenge.signatures.map((s) => s.signer_id),
      metadata: {
        challenge_id,
        challenge_type: input.challenge.challenge_type,
        requested_effect: input.challenge.requested_effect,
        new_status: updated.status,
      },
      now: input.now,
    });

    return {
      ok: true,
      challenge,
      transition,
      audit_event_id: audit_event.audit_event_id,
      policy_decision,
      updated_target: updated,
      receipt,
    };
  }

  // ─── Revoke (direct) ────────────────────────────────────────────────────────

  revoke(input: {
    target_assertion_id: ID;
    revocation: Omit<Revocation, 'revocation_id' | 'estate_id' | 'actor_id' | 'target_assertion_id' | 'created_at'>;
    now: string;
  }): RevokeOutcome {
    const target = this.storage.getAssertion(input.target_assertion_id);
    const policy_decision = policyForTransition({
      transition_type: 'revoke_assertion',
      signatures: input.revocation.signatures,
      keyring: this.keyring,
      target_class: target?.assertion_class,
      risk_level: 'high',
      now: input.now,
    });

    const revocation_id = contentId(
      { kind: 'revoke_assertion', target_id: input.target_assertion_id, reason: input.revocation.reason, now: input.now },
      { prefix: 'rvk' },
    );
    const revocation: Revocation = {
      revocation_id,
      estate_id: this.estate.estate_id,
      actor_id: this.actor.actor_id,
      target_assertion_id: input.target_assertion_id,
      reason: input.revocation.reason,
      signatures: input.revocation.signatures,
      created_at: input.now,
    };

    const transition_id = contentId({ revocation_id, now: input.now }, { prefix: 'trn' });
    const class_validation: ClassValidationResult = {
      valid: true,
      schema_id: 'straylight.revocation.v0',
      schema_version: '0.1.0',
      errors: [],
    };

    if (policy_decision.decision !== 'allow' || !target) {
      const audit_event = this.auditLog.append({
        event_type: 'transition_denied',
        actor_id: this.actor.actor_id,
        estate_id: this.estate.estate_id,
        transition_id,
        assertion_refs: [input.target_assertion_id],
        signer_refs: input.revocation.signatures.map((s) => s.signer_id),
        policy_decision_ref: policy_decision.policy_id,
        payload: { decision: policy_decision.decision, reasons: policy_decision.reasons },
        created_at: input.now,
      });
      const transition = this.buildTransition({
        transition_id,
        type: 'revoke_assertion',
        target_refs: [input.target_assertion_id],
        signatures: input.revocation.signatures,
        class_validation,
        policy_decision,
        audit_event,
        now: input.now,
      });
      this.storage.appendTransition(transition);
      const receipt = this.persistReceipt({
        kind: 'denied',
        transition,
        target_refs: [input.target_assertion_id],
        decision: policy_decision,
        audit_event_id: audit_event.audit_event_id,
        signer_refs: input.revocation.signatures.map((s) => s.signer_id),
        metadata: { transition_type: 'revoke_assertion', target_missing: !target },
        now: input.now,
      });
      return {
        ok: false,
        revocation,
        transition,
        audit_event_id: audit_event.audit_event_id,
        policy_decision,
        receipt,
      };
    }

    const updated: Assertion = { ...target, status: 'revoked', revoked_by_ref: revocation_id, updated_at: input.now };
    this.storage.upsertAssertion(updated);

    const audit_event = this.auditLog.append({
      event_type: 'assertion_revoked',
      actor_id: this.actor.actor_id,
      estate_id: this.estate.estate_id,
      transition_id,
      assertion_refs: [input.target_assertion_id, revocation_id],
      signer_refs: input.revocation.signatures.map((s) => s.signer_id),
      policy_decision_ref: policy_decision.policy_id,
      payload: { reason: input.revocation.reason },
      created_at: input.now,
    });

    const transition = this.buildTransition({
      transition_id,
      type: 'revoke_assertion',
      target_refs: [input.target_assertion_id, revocation_id],
      signatures: input.revocation.signatures,
      class_validation,
      policy_decision,
      audit_event,
      now: input.now,
    });
    this.storage.appendTransition(transition);

    const receipt = this.persistReceipt({
      kind: 'revocation',
      transition,
      target_refs: [input.target_assertion_id, revocation_id],
      decision: policy_decision,
      audit_event_id: audit_event.audit_event_id,
      signer_refs: input.revocation.signatures.map((s) => s.signer_id),
      metadata: { revocation_id, reason: input.revocation.reason },
      now: input.now,
    });

    return {
      ok: true,
      revocation,
      transition,
      audit_event_id: audit_event.audit_event_id,
      policy_decision,
      updated_target: updated,
      receipt,
    };
  }

  // ─── Forget (forgotten_from_recall) ─────────────────────────────────────────

  forget(input: {
    target_assertion_id: ID;
    reason: string;
    signatures: SignatureEnvelope[];
    now: string;
  }): ForgetOutcome {
    const target = this.storage.getAssertion(input.target_assertion_id);
    const policy_decision = policyForTransition({
      transition_type: 'forget_assertion_from_recall',
      signatures: input.signatures,
      keyring: this.keyring,
      target_class: target?.assertion_class,
      risk_level: 'high',
      now: input.now,
    });

    const forget_id = contentId(
      { kind: 'forget_assertion_from_recall', target_id: input.target_assertion_id, reason: input.reason, now: input.now },
      { prefix: 'frgt' },
    );
    const forget: ForgetRecord = {
      forget_id,
      estate_id: this.estate.estate_id,
      actor_id: this.actor.actor_id,
      target_assertion_id: input.target_assertion_id,
      reason: input.reason,
      signatures: input.signatures,
      created_at: input.now,
    };

    const transition_id = contentId({ forget_id, now: input.now }, { prefix: 'trn' });
    const class_validation: ClassValidationResult = {
      valid: true,
      schema_id: 'straylight.forget.v0',
      schema_version: '0.1.0',
      errors: [],
    };

    if (policy_decision.decision !== 'allow' || !target) {
      const audit_event = this.auditLog.append({
        event_type: 'transition_denied',
        actor_id: this.actor.actor_id,
        estate_id: this.estate.estate_id,
        transition_id,
        assertion_refs: [input.target_assertion_id],
        signer_refs: input.signatures.map((s) => s.signer_id),
        policy_decision_ref: policy_decision.policy_id,
        payload: { decision: policy_decision.decision, reasons: policy_decision.reasons },
        created_at: input.now,
      });
      const transition = this.buildTransition({
        transition_id,
        type: 'forget_assertion_from_recall',
        target_refs: [input.target_assertion_id],
        signatures: input.signatures,
        class_validation,
        policy_decision,
        audit_event,
        now: input.now,
      });
      this.storage.appendTransition(transition);
      const receipt = this.persistReceipt({
        kind: 'denied',
        transition,
        target_refs: [input.target_assertion_id],
        decision: policy_decision,
        audit_event_id: audit_event.audit_event_id,
        signer_refs: input.signatures.map((s) => s.signer_id),
        metadata: { transition_type: 'forget_assertion_from_recall', target_missing: !target },
        now: input.now,
      });
      return {
        ok: false,
        forget,
        transition,
        audit_event_id: audit_event.audit_event_id,
        policy_decision,
        receipt,
      };
    }

    const updated: Assertion = {
      ...target,
      status: 'forgotten_from_recall',
      updated_at: input.now,
    };
    this.storage.upsertAssertion(updated);

    const audit_event = this.auditLog.append({
      event_type: 'assertion_forgotten_from_recall',
      actor_id: this.actor.actor_id,
      estate_id: this.estate.estate_id,
      transition_id,
      assertion_refs: [input.target_assertion_id, forget_id],
      signer_refs: input.signatures.map((s) => s.signer_id),
      policy_decision_ref: policy_decision.policy_id,
      payload: { reason: input.reason },
      created_at: input.now,
    });

    const transition = this.buildTransition({
      transition_id,
      type: 'forget_assertion_from_recall',
      target_refs: [input.target_assertion_id, forget_id],
      signatures: input.signatures,
      class_validation,
      policy_decision,
      audit_event,
      now: input.now,
    });
    this.storage.appendTransition(transition);

    const receipt = this.persistReceipt({
      kind: 'forget',
      transition,
      target_refs: [input.target_assertion_id, forget_id],
      decision: policy_decision,
      audit_event_id: audit_event.audit_event_id,
      signer_refs: input.signatures.map((s) => s.signer_id),
      metadata: { forget_id, reason: input.reason },
      now: input.now,
    });

    return {
      ok: true,
      forget,
      transition,
      audit_event_id: audit_event.audit_event_id,
      policy_decision,
      updated_target: updated,
      receipt,
    };
  }

  // ─── Internal builders ──────────────────────────────────────────────────────

  private buildTransition(input: {
    transition_id: ID;
    type: EstateTransition['transition_type'];
    target_refs: ID[];
    signatures: SignatureEnvelope[];
    class_validation: ClassValidationResult;
    policy_decision: PolicyDecision;
    audit_event: AuditEvent;
    now: string;
  }): EstateTransition {
    return {
      transition_id: input.transition_id,
      estate_id: this.estate.estate_id,
      actor_id: this.actor.actor_id,
      transition_type: input.type,
      target_refs: input.target_refs,
      requested_by: input.signatures[0]?.signer_id ?? 'unknown',
      class_validation: input.class_validation,
      policy_decision: input.policy_decision,
      signatures: input.signatures,
      audit_event_ref: input.audit_event.audit_event_id,
      created_at: input.now,
    };
  }

  private persistReceipt(input: {
    kind: TransitionReceiptKind;
    transition: EstateTransition;
    target_refs: ID[];
    decision: PolicyDecision;
    audit_event_id: ID;
    signer_refs: ID[];
    metadata?: Record<string, unknown>;
    now: string;
  }): TransitionReceipt {
    const reasons = input.decision.reasons;
    const required_next_actions = input.decision.required_next_actions;
    const receipt_hash = sha256({
      kind: input.kind,
      transition_id: input.transition.transition_id,
      transition_type: input.transition.transition_type,
      estate_id: this.estate.estate_id,
      actor_id: this.actor.actor_id,
      target_refs: [...input.target_refs].sort(),
      decision: input.decision.decision,
      reasons,
      required_next_actions: required_next_actions ?? null,
      signer_refs: [...input.signer_refs].sort(),
      audit_event_ref: input.audit_event_id,
      metadata: input.metadata ?? null,
      created_at: input.now,
    });
    const receipt: TransitionReceipt = {
      receipt_id: contentId(receipt_hash, { prefix: 'trcpt' }),
      kind: input.kind,
      transition_id: input.transition.transition_id,
      transition_type: input.transition.transition_type,
      estate_id: this.estate.estate_id,
      actor_id: this.actor.actor_id,
      target_refs: input.target_refs,
      decision: input.decision.decision,
      policy_decision: input.decision,
      signer_refs: input.signer_refs,
      audit_event_ref: input.audit_event_id,
      reasons,
      required_next_actions,
      metadata: input.metadata,
      receipt_hash,
      created_at: input.now,
    };
    this.storage.upsertTransitionReceipt(receipt);
    return receipt;
  }
}
