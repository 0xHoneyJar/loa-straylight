// Phase 12 — Dixie governed-recall / BFF / inspection fixture exporter.
//
// Usage:
//   npm run dixie:recall
//
// Writes deterministic JSON examples to fixtures/dixie-governed-recall/
// describing the BFF / inspection responses Dixie should eventually render
// once it consumes the wedge's stable contracts (and, post-Phase 10, Finn's
// runtime gate). These fixtures are CURRENT-SHAPE LOCAL examples produced
// from the wedge's public API. They are NOT official Dixie fixtures, NOT
// canonical Dixie schemas, and NOT a claim that Dixie integration is
// complete. They do not import from loa-dixie, .loa, .claude, or any
// sibling repo.
//
// Each fixture is a self-describing JSON object with:
//   - case_name           : stable identifier for the case
//   - expected_allowed    : did Dixie's BFF render the operation as allowed?
//   - reason              : human-readable explanation of allow/deny
//   - input               : the shape Dixie would receive at the BFF
//   - expected_output     : the shape Dixie must produce on accept/deny
//
// Re-running the script with the same wedge inputs produces byte-identical
// output. See docs/handoffs/dixie-governed-recall-issue.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EstateStore,
  executeRecall,
  type Assertion,
  type AuditEvent,
  type RecallPack,
  type RecallReceipt,
  type RecallRequest,
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
export const DEFAULT_OUT_DIR = resolve(ROOT, 'fixtures', 'dixie-governed-recall');

// Deterministic timeline so re-running the export produces stable IDs.
const T = {
  base_observation:  '2026-05-05T10:00:00Z',
  preference:        '2026-05-05T10:05:00Z',
  private_seed:      '2026-05-05T10:10:00Z',
  revoked_seed:      '2026-05-05T10:15:00Z',
  forgotten_seed:    '2026-05-05T10:20:00Z',
  contested_seed:    '2026-05-05T10:25:00Z',
  recall_request:    '2026-05-05T11:00:00Z',
  recall_response:   '2026-05-05T11:00:00Z',
  recall_private:    '2026-05-05T11:05:00Z',
  recall_cross:      '2026-05-05T11:10:00Z',
  recall_revoked:    '2026-05-05T11:15:00Z',
  recall_forgotten:  '2026-05-05T11:20:00Z',
  recall_audit:      '2026-05-05T11:25:00Z',
  recall_contested:  '2026-05-05T11:30:00Z',
  prov_lookup:       '2026-05-05T11:35:00Z',
  audit_lookup:      '2026-05-05T11:40:00Z',
  estate_summary:    '2026-05-05T11:45:00Z',
} as const;

export interface DixieFixture {
  case_name: string;
  expected_allowed: boolean;
  reason: string;
  input: unknown;
  expected_output: unknown;
}

export interface FixtureFile {
  filename: string;
  content: DixieFixture;
}

interface BuiltOutputs {
  // shared bookkeeping
  actor: ReturnType<typeof loadActor>;
  estate: ReturnType<typeof loadEstate>;
  keyring: ReturnType<typeof loadKeyring>;

  // recall-request-public-discord
  publicRequest: RecallRequest;

  // recall-response-with-receipt
  publicPack: RecallPack;
  publicReceipt: RecallReceipt;
  publicAuditEvents: readonly AuditEvent[];

  // denied-private-assertion-public-context
  privatePack: RecallPack;
  privateReceipt: RecallReceipt;
  privateAssertion: Assertion;

  // denied-cross-tenant-recall (bff-side, no wedge call: shape illustration)
  crossTenantRequest: RecallRequest;

  // revoked-assertion-excluded
  revokedPack: RecallPack;
  revokedReceipt: RecallReceipt;
  revokedAssertion: Assertion;

  // forgotten-assertion-excluded-but-auditable
  forgottenPublicPack: RecallPack;
  forgottenPublicReceipt: RecallReceipt;
  forgottenAuditPack: RecallPack;
  forgottenAuditReceipt: RecallReceipt;
  forgottenAssertion: Assertion;
  forgottenAuditEvents: readonly AuditEvent[];

  // contested-assertion-marked
  contestedPack: RecallPack;
  contestedReceipt: RecallReceipt;
  contestedAssertion: Assertion;

  // provenance-inspection-response
  provenanceAssertion: Assertion;

  // audit-chain-lookup-response
  auditChainEvents: readonly AuditEvent[];
  auditChainVerify: { ok: true } | { ok: false; broken_at: number; reason: string };

  // estate-summary-response
  summaryStore: EstateStore;
}

function buildOutputs(): BuiltOutputs {
  // ── 1. Public-discord recall on a healthy public estate. ────────────────
  const publicStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  publicStore.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Dixie-handoff: public observation, an operator may quote this.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.base_observation,
    }),
    T.base_observation,
  );
  publicStore.admit(
    buildCandidate({
      assertion_class: 'preference',
      body: { text: 'Dixie-handoff: agent prefers concise replies in public Discord.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
      signed_at: T.preference,
    }),
    T.preference,
  );
  const publicRequest = buildRecallRequest({
    task: 'dixie-handoff: public_discord recall, healthy estate',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation', 'preference'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_request,
    request_id: 'rreq_dixie-public-discord-intake',
  });
  const publicOut = executeRecall(publicStore, publicRequest, T.recall_response);
  if (!publicOut.ok || !publicOut.pack || !publicOut.receipt) {
    throw new Error('dixie-recall: public recall denied unexpectedly');
  }

  // ── 2. Private-in-public exclusion. ─────────────────────────────────────
  const privateStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const privateAssertion = buildSeededAssertion({
    status: 'active',
    assertion_class: 'observation',
    body: { text: 'Dixie-handoff: a private observation Dixie must NOT leak to public_discord.' },
    privacy_scope: 'actor_private',
    risk_level: 'medium',
    signer: SIGNERS.operator,
    signed_at: T.private_seed,
    created_at: T.private_seed,
  });
  privateStore.seedAssertion(privateAssertion);
  privateStore.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Dixie-handoff: public counterpart Dixie may include.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.private_seed,
    }),
    T.private_seed,
  );
  const privateRequest = buildRecallRequest({
    task: 'dixie-handoff: public_discord recall, must exclude private',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_private,
    request_id: 'rreq_dixie-private-public-context',
  });
  const privateOut = executeRecall(privateStore, privateRequest, T.recall_private);
  if (!privateOut.ok || !privateOut.pack || !privateOut.receipt) {
    throw new Error('dixie-recall: private-exclusion recall denied unexpectedly');
  }

  // ── 3. Cross-tenant recall request (illustration only). ─────────────────
  // The fixture demonstrates the *shape* of a cross-tenant request that
  // Dixie's BFF must refuse at intake; the wedge / Finn provide the second
  // line of defense. We build the request envelope deterministically; the
  // BFF deny is captured in expected_output.
  const crossTenantRequest = buildRecallRequest({
    task: 'dixie-handoff: cross-tenant recall, must be refused at intake',
    environment_frame: 'private_operator',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.unknown, // not on this tenant's keyring
    signed_at: T.recall_cross,
    request_id: 'rreq_dixie-cross-tenant-refused',
  });

  // ── 4. Revoked-assertion exclusion. ─────────────────────────────────────
  const revokedStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const revokedAssertion = buildSeededAssertion({
    status: 'revoked',
    assertion_class: 'observation',
    body: { text: 'Dixie-handoff: a revoked observation Dixie must exclude from public_discord.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.operator,
    signed_at: T.revoked_seed,
    created_at: T.revoked_seed,
  });
  revokedStore.seedAssertion(revokedAssertion);
  revokedStore.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Dixie-handoff: active companion Dixie may include.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.revoked_seed,
    }),
    T.revoked_seed,
  );
  const revokedRequest = buildRecallRequest({
    task: 'dixie-handoff: public_discord recall, must exclude revoked',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_revoked,
    request_id: 'rreq_dixie-revoked-excluded',
  });
  const revokedOut = executeRecall(revokedStore, revokedRequest, T.recall_revoked);
  if (!revokedOut.ok || !revokedOut.pack || !revokedOut.receipt) {
    throw new Error('dixie-recall: revoked-exclusion recall denied unexpectedly');
  }

  // ── 5. Forgotten-assertion: excluded in public, marked in audit_review. ─
  const forgottenStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const forgottenAssertion = buildSeededAssertion({
    status: 'forgotten_from_recall',
    assertion_class: 'observation',
    body: { text: 'Dixie-handoff: a forgotten observation Dixie must exclude from ordinary recall.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.operator,
    signed_at: T.forgotten_seed,
    created_at: T.forgotten_seed,
  });
  forgottenStore.seedAssertion(forgottenAssertion);
  forgottenStore.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Dixie-handoff: active companion Dixie may include in public_discord.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.forgotten_seed,
    }),
    T.forgotten_seed,
  );
  const forgottenPublicRequest = buildRecallRequest({
    task: 'dixie-handoff: public_discord recall, must exclude forgotten',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_forgotten,
    request_id: 'rreq_dixie-forgotten-excluded-public',
  });
  const forgottenPublicOut = executeRecall(forgottenStore, forgottenPublicRequest, T.recall_forgotten);
  if (!forgottenPublicOut.ok || !forgottenPublicOut.pack || !forgottenPublicOut.receipt) {
    throw new Error('dixie-recall: forgotten-public recall denied unexpectedly');
  }
  const forgottenAuditRequest = buildRecallRequest({
    task: 'dixie-handoff: audit_review recall, forgotten surfaces as marked',
    environment_frame: 'audit_review',
    risk_profile: 'high',
    requested_classes: ['observation'],
    include_statuses: ['active', 'contested', 'demoted', 'revoked', 'forgotten_from_recall'],
    mark_statuses: ['contested', 'demoted', 'revoked', 'forgotten_from_recall'],
    include_receipt_detail: 'debug',
    include_provenance: true,
    signer: SIGNERS.reviewer,
    signed_at: T.recall_audit,
    request_id: 'rreq_dixie-forgotten-marked-audit',
  });
  const forgottenAuditOut = executeRecall(forgottenStore, forgottenAuditRequest, T.recall_audit);
  if (!forgottenAuditOut.ok || !forgottenAuditOut.pack || !forgottenAuditOut.receipt) {
    throw new Error('dixie-recall: forgotten-audit recall denied unexpectedly');
  }

  // ── 6. Contested-assertion marking. ─────────────────────────────────────
  const contestedStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const contestedAssertion = buildSeededAssertion({
    status: 'contested',
    assertion_class: 'observation',
    body: { text: 'Dixie-handoff: a contested observation Dixie must surface as marked, never usable.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.operator,
    signed_at: T.contested_seed,
    created_at: T.contested_seed,
  });
  contestedStore.seedAssertion(contestedAssertion);
  const contestedRequest = buildRecallRequest({
    task: 'dixie-handoff: public_discord recall, contested must be marked',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_contested,
    request_id: 'rreq_dixie-contested-marked',
  });
  const contestedOut = executeRecall(contestedStore, contestedRequest, T.recall_contested);
  if (!contestedOut.ok || !contestedOut.pack || !contestedOut.receipt) {
    throw new Error('dixie-recall: contested-marked recall denied unexpectedly');
  }

  // ── 7. Provenance-inspection target. ────────────────────────────────────
  // Use the first admitted assertion of the public store as the provenance
  // lookup target. The provenance walk respects the parent's privacy scope.
  const provenanceAssertion = publicStore
    .listAssertions()
    .find((a) => a.privacy_scope === 'public' && a.assertion_class === 'observation');
  if (!provenanceAssertion) {
    throw new Error('dixie-recall: missing provenance target observation');
  }

  // ── 8. Audit-chain lookup. ──────────────────────────────────────────────
  const auditChainEvents = publicStore.auditLog.listFor(loadEstate().estate_id);
  const auditChainVerify = publicStore.auditLog.verifyChain(loadEstate().estate_id);

  return {
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
    publicRequest,
    publicPack: publicOut.pack,
    publicReceipt: publicOut.receipt,
    publicAuditEvents: auditChainEvents,
    privatePack: privateOut.pack,
    privateReceipt: privateOut.receipt,
    privateAssertion,
    crossTenantRequest,
    revokedPack: revokedOut.pack,
    revokedReceipt: revokedOut.receipt,
    revokedAssertion,
    forgottenPublicPack: forgottenPublicOut.pack,
    forgottenPublicReceipt: forgottenPublicOut.receipt,
    forgottenAuditPack: forgottenAuditOut.pack,
    forgottenAuditReceipt: forgottenAuditOut.receipt,
    forgottenAssertion,
    forgottenAuditEvents: forgottenStore.auditLog.listFor(loadEstate().estate_id),
    contestedPack: contestedOut.pack,
    contestedReceipt: contestedOut.receipt,
    contestedAssertion,
    provenanceAssertion,
    auditChainEvents,
    auditChainVerify,
    summaryStore: publicStore,
  };
}

function summarizeEstate(store: EstateStore): {
  actor_id: string;
  estate_id: string;
  estate_status: string;
  keyring_id: string;
  signer_roles: string[];
  counts_by_class: Record<string, number>;
  counts_by_status: Record<string, number>;
  counts_by_privacy_scope: Record<string, number>;
  counts_by_risk_level: Record<string, number>;
  total_assertions: number;
} {
  const actor = store.getActor();
  const estate = store.getEstate();
  const keyring = store.getKeyring();
  const assertions = store.listAssertions();

  const byKey = <K extends string>(items: { [k in K]?: string | null | undefined }[], key: K): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const it of items) {
      const v = (it[key] ?? 'unspecified') as string;
      out[v] = (out[v] ?? 0) + 1;
    }
    return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
  };

  const signerRoles = Array.from(
    new Set(keyring.signer_entries.map((e) => e.signer_type)),
  ).sort();

  return {
    actor_id: actor.actor_id,
    estate_id: estate.estate_id,
    estate_status: estate.status,
    keyring_id: keyring.keyring_id,
    signer_roles: signerRoles,
    counts_by_class: byKey(assertions, 'assertion_class'),
    counts_by_status: byKey(assertions, 'status'),
    counts_by_privacy_scope: byKey(assertions, 'privacy_scope'),
    counts_by_risk_level: byKey(assertions, 'risk_level'),
    total_assertions: assertions.length,
  };
}

export function buildFixtures(): DixieFixture[] {
  const r = buildOutputs();

  return [
    {
      case_name: 'recall_request_public_discord',
      expected_allowed: true,
      reason:
        "Dixie's BFF intake builds a RecallRequest envelope per the wedge's validateRecallRequest shape, runs cross-tenant boundary checks (caller's signer / actor matches the target estate), and forwards the request to the runtime gate. The fixture pins the intake-accept envelope.",
      input: {
        bff_route: 'POST /recall',
        environment_frame: 'public_discord',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          signer: {
            signer_id: SIGNERS.operator.signer_id,
            signer_type: SIGNERS.operator.signer_type,
          },
        },
        request_envelope: r.publicRequest,
        now: T.recall_request,
      },
      expected_output: {
        intake_decision: 'accepted',
        forwarded_request: r.publicRequest,
        notes:
          'Intake validates the envelope, enforces cross-tenant boundary, then forwards to the runtime gate. The BFF MUST NOT short-circuit class / policy / competence layers downstream.',
      },
    },
    {
      case_name: 'recall_response_with_receipt',
      expected_allowed: true,
      reason:
        "Dixie's BFF MUST render the served RecallPack alongside its matching RecallReceipt. The receipt's pack_hash matches the served pack, and the receipt's receipt_hash is content-addressed. A pack rendered without its receipt is a runtime bug; the BFF refuses to render in that case.",
      input: {
        bff_route: 'GET /recall/:request_id',
        recall_request_id: r.publicRequest.recall_request_id,
        environment_frame: 'public_discord',
        now: T.recall_response,
      },
      expected_output: {
        served_pack: r.publicPack,
        served_receipt: r.publicReceipt,
        receipt_pack_hash_matches: r.publicReceipt.pack_hash === r.publicPack.pack_hash,
        notes:
          'The BFF surfaces the included / marked / redacted / excluded_summary discipline intact. Provenance refs travel via included[].provenance_refs.',
      },
    },
    {
      case_name: 'denied_private_assertion_public_context',
      expected_allowed: false,
      reason:
        "Dixie's BFF surfaces the served pack with the actor_private body excluded — privacyDispositionForFrame in public_discord refuses actor_private material. The private assertion is NOT in included, NOT in marked; it appears only in excluded_summary as private_excluded_from_public_frame. The BFF MUST surface the exclusion summary, never the body.",
      input: {
        bff_route: 'GET /recall/:request_id',
        recall_request_id: 'rreq_dixie-private-public-context',
        environment_frame: 'public_discord',
        seeded_private_assertion: r.privateAssertion,
        now: T.recall_private,
      },
      expected_output: {
        served_pack: r.privatePack,
        served_receipt: r.privateReceipt,
        private_assertion_in_included: false,
        private_assertion_in_marked: false,
        deny_reason: 'private_excluded_from_public_frame',
        notes:
          'The BFF MUST NOT expose actor_private bodies in public_discord under any circumstance. Provenance refs on actor_private assertions are also excluded.',
      },
    },
    {
      case_name: 'denied_cross_tenant_recall',
      expected_allowed: false,
      reason:
        "Dixie's BFF refuses cross-tenant recall at intake. The caller's signer is not on the target estate's keyring, and the caller's tenant boundary does not match the target's tenant. The BFF emits a Dixie-side audit log entry referencing the wedge's recall_denied event. The wedge / Finn are the second line of defense — both layers refuse.",
      input: {
        bff_route: 'POST /recall',
        environment_frame: 'private_operator',
        caller_frame_intent: 'tenant_dashboard',
        caller: {
          tenant_id: 'tenant:other-actor',
          actor_id: 'agent:other-actor',
          signer: {
            signer_id: SIGNERS.unknown.signer_id,
            signer_type: SIGNERS.unknown.signer_type,
          },
        },
        request_envelope: r.crossTenantRequest,
        now: T.recall_cross,
      },
      expected_output: {
        intake_decision: 'denied',
        deny_reason: 'cross_tenant_recall_refused',
        bff_audit_entry: {
          event_type: 'dixie_recall_intake_denied',
          recall_request_id: r.crossTenantRequest.recall_request_id,
          target_estate_id: r.crossTenantRequest.estate_id,
          caller_tenant_id: 'tenant:other-actor',
          caller_signer_id: SIGNERS.unknown.signer_id,
          reason: 'cross_tenant_recall_refused',
          references_wedge_event_type: 'recall_denied',
          now: T.recall_cross,
        },
        notes:
          'Cross-tenant prevention is a Dixie-layer responsibility (first line of defense). The wedge / Finn refuse at the runtime gate (second line). Both must refuse for the boundary to hold.',
      },
    },
    {
      case_name: 'revoked_assertion_excluded',
      expected_allowed: false,
      reason:
        "Dixie's BFF surfaces the served pack with the revoked assertion excluded — dispositionFor refuses status: 'revoked' outside audit_review. The revoked assertion is NOT in included, NOT in marked; the BFF surfaces excluded_summary with reason revoked_excluded_outside_audit_review. The audit chain still shows the revocation; revocation is not erasure.",
      input: {
        bff_route: 'GET /recall/:request_id',
        recall_request_id: 'rreq_dixie-revoked-excluded',
        environment_frame: 'public_discord',
        seeded_revoked_assertion: r.revokedAssertion,
        now: T.recall_revoked,
      },
      expected_output: {
        served_pack: r.revokedPack,
        served_receipt: r.revokedReceipt,
        revoked_assertion_in_included: false,
        revoked_assertion_in_marked: false,
        deny_reason: 'revoked_excluded_outside_audit_review',
        notes:
          'The BFF MUST NOT render a revoked assertion as usable in any frame other than audit_review. The revocation transition receipt remains in the audit chain so the BFF estate-summary view shows the revocation count.',
      },
    },
    {
      case_name: 'forgotten_assertion_excluded_but_auditable',
      expected_allowed: false,
      reason:
        "Dixie's BFF surfaces a public_discord recall with forgotten material excluded (forgotten_excluded_outside_audit_review) and surfaces an audit_review recall with the same material as marked (use_instruction = mark_as_contested or do_not_use_quote_only per the wedge's marker matrix). The forget transition receipt remains in the audit chain. Forget is unavailable to ordinary recall, not erased.",
      input: {
        bff_route_public: 'GET /recall/:request_id',
        bff_route_audit: 'GET /recall/:request_id',
        public_recall_request_id: 'rreq_dixie-forgotten-excluded-public',
        audit_recall_request_id: 'rreq_dixie-forgotten-marked-audit',
        seeded_forgotten_assertion: r.forgottenAssertion,
        public_environment_frame: 'public_discord',
        audit_environment_frame: 'audit_review',
        now_public: T.recall_forgotten,
        now_audit: T.recall_audit,
      },
      expected_output: {
        public_served_pack: r.forgottenPublicPack,
        public_served_receipt: r.forgottenPublicReceipt,
        public_forgotten_in_included: false,
        public_forgotten_in_marked: false,
        public_deny_reason: 'forgotten_excluded_outside_audit_review',
        audit_served_pack: r.forgottenAuditPack,
        audit_served_receipt: r.forgottenAuditReceipt,
        audit_forgotten_in_included_count: r.forgottenAuditPack.included.filter(
          (i) => i.assertion_id === r.forgottenAssertion.assertion_id,
        ).length,
        audit_forgotten_in_marked_count: r.forgottenAuditPack.marked.filter(
          (i) => i.assertion_id === r.forgottenAssertion.assertion_id,
        ).length,
        audit_chain_event_types_for_forgotten: r.forgottenAuditEvents
          .filter((e) => (e.assertion_refs ?? []).includes(r.forgottenAssertion.assertion_id))
          .map((e) => e.event_type),
        notes:
          'Forgotten material is excluded outside audit_review and rendered as marked in audit_review. The BFF MUST surface both halves consistently across the recall, status, and audit-chain views.',
      },
    },
    {
      case_name: 'contested_assertion_marked',
      expected_allowed: true,
      reason:
        "Dixie's BFF renders contested assertions as marked, never silently included. dispositionFor returns 'mark' for status: 'contested' regardless of mark_statuses; useInstructionForMark maps the mark to mark_as_contested. The BFF surfaces the marked item in a 'contested' UI affordance — not as quotable context.",
      input: {
        bff_route: 'GET /recall/:request_id',
        recall_request_id: 'rreq_dixie-contested-marked',
        environment_frame: 'public_discord',
        seeded_contested_assertion: r.contestedAssertion,
        now: T.recall_contested,
      },
      expected_output: {
        served_pack: r.contestedPack,
        served_receipt: r.contestedReceipt,
        contested_in_included_count: r.contestedPack.included.filter(
          (i) => i.assertion_id === r.contestedAssertion.assertion_id,
        ).length,
        contested_in_marked_count: r.contestedPack.marked.filter(
          (i) => i.assertion_id === r.contestedAssertion.assertion_id,
        ).length,
        notes:
          'The marked discipline is binding through the BFF. A contested assertion MUST always carry use_instruction = mark_as_contested; the BFF MUST NOT promote it to usable context.',
      },
    },
    {
      case_name: 'provenance_inspection_response',
      expected_allowed: true,
      reason:
        "Dixie's provenance-inspection surface returns the assertion's provenance[] records — provenance_id, source_type, observed_at, captured_by, evidence_summary — and respects the parent's privacy_scope. A public assertion's provenance is exposed in public_discord; an actor_private parent's provenance would NOT travel to public_discord (the BFF would surface an exclusion entry instead).",
      input: {
        bff_route: 'GET /assertion/:assertion_id/provenance',
        assertion_id: r.provenanceAssertion.assertion_id,
        environment_frame: 'public_discord',
        now: T.prov_lookup,
      },
      expected_output: {
        assertion_id: r.provenanceAssertion.assertion_id,
        assertion_class: r.provenanceAssertion.assertion_class,
        privacy_scope: r.provenanceAssertion.privacy_scope,
        exposed_in_caller_frame: true,
        provenance_records: r.provenanceAssertion.provenance,
        notes:
          'Provenance walk is the audit-side trace of why an assertion entered the estate. The BFF MUST NOT synthesize provenance refs; it walks Assertion.provenance[] only.',
      },
    },
    {
      case_name: 'audit_chain_lookup_response',
      expected_allowed: true,
      reason:
        "Dixie's audit-chain lookup surface returns AuditEvent[] in chain order plus a verifyChain result. When the chain is broken, the BFF surfaces the break index and reason — never suppresses. The fixture pins a healthy chain; the verifyChain result is { ok: true }.",
      input: {
        bff_route: 'GET /estate/:estate_id/audit',
        estate_id: r.estate.estate_id,
        environment_frame: 'audit_review',
        now: T.audit_lookup,
      },
      expected_output: {
        estate_id: r.estate.estate_id,
        events: r.auditChainEvents,
        verify_chain_result: r.auditChainVerify,
        events_count: r.auditChainEvents.length,
        notes:
          'The BFF surfaces verifyChain output unchanged. A broken chain renders the break index + reason; the BFF MUST NOT suppress or fabricate a healthy result.',
      },
    },
    {
      case_name: 'estate_summary_response',
      expected_allowed: true,
      reason:
        "Dixie's estate-summary surface returns actor / estate / keyring meta + assertion counts. Counts respect privacy_scope: public_discord views do not expose actor_private counts. Keyring private material (signer-private envelopes) NEVER travels through the summary; only the role list is surfaced.",
      input: {
        bff_route: 'GET /estate/:estate_id/summary',
        estate_id: r.estate.estate_id,
        environment_frame: 'private_operator',
        environment_frame_intent: 'tenant_dashboard',
        now: T.estate_summary,
      },
      expected_output: {
        summary: summarizeEstate(r.summaryStore),
        notes:
          'The summary view is read-only; no receipt is emitted on a summary call. The view itself is provenance for the operator console. Privacy-scope counts respect the caller frame.',
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

function filenameFor(f: DixieFixture): string {
  switch (f.case_name) {
    case 'recall_request_public_discord':
      return 'recall-request-public-discord.json';
    case 'recall_response_with_receipt':
      return 'recall-response-with-receipt.json';
    case 'denied_private_assertion_public_context':
      return 'denied-private-assertion-public-context.json';
    case 'denied_cross_tenant_recall':
      return 'denied-cross-tenant-recall.json';
    case 'revoked_assertion_excluded':
      return 'revoked-assertion-excluded.json';
    case 'forgotten_assertion_excluded_but_auditable':
      return 'forgotten-assertion-excluded-but-auditable.json';
    case 'contested_assertion_marked':
      return 'contested-assertion-marked.json';
    case 'provenance_inspection_response':
      return 'provenance-inspection-response.json';
    case 'audit_chain_lookup_response':
      return 'audit-chain-lookup-response.json';
    case 'estate_summary_response':
      return 'estate-summary-response.json';
    default:
      throw new Error(`dixie-recall: no filename mapping for case ${f.case_name}`);
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

try {
  const { outDir, written } = writeFixtureFiles();
  for (const p of written) console.log(`wrote ${p}`);
  console.log(`\n${written.length} Dixie governed-recall fixtures written to ${outDir}`);
  console.log('reminder: these are LOCAL current-shape examples, not official Dixie fixtures.');
  console.log('reminder: this is handoff prep, not Dixie integration.');
} catch (err) {
  console.error('dixie-recall export failed:', err);
  process.exitCode = 1;
}
