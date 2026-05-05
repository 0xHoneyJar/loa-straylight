// Phase 14 — Freeside community / app surface fixture exporter.
//
// Usage:
//   npm run freeside:surface
//
// Writes deterministic JSON examples to fixtures/freeside-community-surface/
// describing the community / bot / admin / tenant / Discord / Telegram /
// REST / NATS surface decisions Freeside should eventually render once it
// consumes the wedge's stable contracts (and, post-Phase 10 / 12, Finn's
// runtime gate and Dixie's BFF). These fixtures are CURRENT-SHAPE LOCAL
// examples produced from the wedge's public API. They are NOT official
// Freeside fixtures, NOT canonical Freeside schemas, and NOT a claim that
// Freeside integration is complete. They do not import from loa-freeside,
// .loa, .claude, or any sibling repo.
//
// Each fixture is a self-describing JSON object with:
//   - case_name           : stable identifier for the case
//   - expected_allowed    : did Freeside's community surface render the
//                           operation as allowed?
//   - reason              : human-readable explanation of allow/deny
//   - input               : the shape Freeside would receive at the surface
//   - expected_output     : the shape Freeside must produce on accept/deny
//
// Re-running the script with the same wedge inputs produces byte-identical
// output. See docs/handoffs/freeside-community-surface-issue.md.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EstateStore,
  executeRecall,
  policyForAdmitAssertion,
  validateCandidateAssertion,
  type AdmitOutcome,
  type Assertion,
  type AuditEvent,
  type CandidateAssertion,
  type PolicyDecision,
  type ProvenanceRef,
  type RecallPack,
  type RecallReceipt,
  type RecallRequest,
  type TransitionReceipt,
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
export const DEFAULT_OUT_DIR = resolve(ROOT, 'fixtures', 'freeside-community-surface');

// Deterministic timeline so re-running the export produces stable IDs.
const T = {
  base_observation:   '2026-05-05T10:00:00Z',
  preference:         '2026-05-05T10:05:00Z',
  telegram_seed:      '2026-05-05T10:08:00Z',
  tenant_admin_seed:  '2026-05-05T10:11:00Z',
  private_seed:       '2026-05-05T10:14:00Z',
  revoked_seed:       '2026-05-05T10:17:00Z',
  forgotten_seed:     '2026-05-05T10:20:00Z',
  feedback_event:     '2026-05-05T10:25:00Z',
  permission_grant:   '2026-05-05T10:30:00Z',
  bot_action:         '2026-05-05T10:35:00Z',
  recall_discord:     '2026-05-05T11:00:00Z',
  recall_telegram:    '2026-05-05T11:05:00Z',
  recall_tenant_adm:  '2026-05-05T11:10:00Z',
  recall_cross:       '2026-05-05T11:15:00Z',
  recall_private:     '2026-05-05T11:20:00Z',
  recall_revoked_fg:  '2026-05-05T11:25:00Z',
} as const;

export interface FreesideFixture {
  case_name: string;
  expected_allowed: boolean;
  reason: string;
  input: unknown;
  expected_output: unknown;
}

export interface FixtureFile {
  filename: string;
  content: FreesideFixture;
}

interface BuiltOutputs {
  // recall — public Discord
  discordRequest: RecallRequest;
  discordPack: RecallPack;
  discordReceipt: RecallReceipt;

  // recall — public Telegram
  telegramRequest: RecallRequest;
  telegramPack: RecallPack;
  telegramReceipt: RecallReceipt;

  // recall — tenant admin
  tenantAdminRequest: RecallRequest;
  tenantAdminPack: RecallPack;
  tenantAdminReceipt: RecallReceipt;

  // cross-tenant denied (illustration only)
  crossTenantRequest: RecallRequest;

  // private excluded in public bot
  privatePack: RecallPack;
  privateReceipt: RecallReceipt;
  privateAssertion: Assertion;

  // feedback signal candidate (denied — no rule)
  feedbackCandidate: CandidateAssertion;
  feedbackDecision: PolicyDecision;

  // admin capability grant (allowed)
  permissionAdmit: AdmitOutcome;
  permissionCandidate: CandidateAssertion;

  // bot action with receipt (allowed)
  actionAdmit: AdmitOutcome;
  actionCandidate: CandidateAssertion;

  // revoked / forgotten excluded from bot recall
  revokedAssertion: Assertion;
  forgottenAssertion: Assertion;
  revokedForgottenPack: RecallPack;
  revokedForgottenReceipt: RecallReceipt;
  revokedForgottenAuditEvents: readonly AuditEvent[];
}

function feedbackProvenance(now: string): ProvenanceRef[] {
  return [
    {
      provenance_id: 'prov:freeside-discord-event',
      source_type: 'discord_event',
      observed_at: now,
      captured_by: 'freeside:discord-adapter',
      evidence_summary: 'public Discord channel #community feedback message',
      source_uri: 'discord://guild/freeside-demo/channel/community-feedback/message/0001',
    },
  ];
}

function buildOutputs(): BuiltOutputs {
  // ── 1. Public-Discord bot recall on a healthy public estate. ───────────
  const discordStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  discordStore.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Freeside-handoff: public observation, a Discord bot may quote this.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.base_observation,
    }),
    T.base_observation,
  );
  discordStore.admit(
    buildCandidate({
      assertion_class: 'preference',
      body: { text: 'Freeside-handoff: agent prefers concise replies in public Discord.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.operator,
      signed_at: T.preference,
    }),
    T.preference,
  );
  const discordRequest = buildRecallRequest({
    task: 'freeside-handoff: public_discord bot recall, healthy estate',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation', 'preference'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_discord,
    request_id: 'rreq_freeside-bot-recall-public-discord',
  });
  const discordOut = executeRecall(discordStore, discordRequest, T.recall_discord);
  if (!discordOut.ok || !discordOut.pack || !discordOut.receipt) {
    throw new Error('freeside-surface: public Discord bot recall denied unexpectedly');
  }

  // ── 2. Public-Telegram bot recall. ─────────────────────────────────────
  const telegramStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  telegramStore.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Freeside-handoff: public observation, a Telegram bot may quote this.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.telegram_seed,
    }),
    T.telegram_seed,
  );
  const telegramRequest = buildRecallRequest({
    task: 'freeside-handoff: public_telegram bot recall, healthy estate',
    environment_frame: 'public_telegram',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_telegram,
    request_id: 'rreq_freeside-bot-recall-public-telegram',
  });
  const telegramOut = executeRecall(telegramStore, telegramRequest, T.recall_telegram);
  if (!telegramOut.ok || !telegramOut.pack || !telegramOut.receipt) {
    throw new Error('freeside-surface: public Telegram bot recall denied unexpectedly');
  }

  // ── 3. Tenant-admin recall (private_operator + frame intent). ──────────
  const tenantAdminStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  tenantAdminStore.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Freeside-handoff: tenant-admin observation, scoped to admin dashboard.' },
      privacy_scope: 'tenant',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.tenant_admin_seed,
    }),
    T.tenant_admin_seed,
  );
  const tenantAdminRequest = buildRecallRequest({
    task: 'freeside-handoff: tenant_admin recall via private_operator frame',
    environment_frame: 'private_operator',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_tenant_adm,
    request_id: 'rreq_freeside-tenant-admin-recall',
  });
  const tenantAdminOut = executeRecall(tenantAdminStore, tenantAdminRequest, T.recall_tenant_adm);
  if (!tenantAdminOut.ok || !tenantAdminOut.pack || !tenantAdminOut.receipt) {
    throw new Error('freeside-surface: tenant-admin recall denied unexpectedly');
  }

  // ── 4. Cross-tenant request (illustration only). ───────────────────────
  // Build a request envelope whose signer is unknown to this tenant's
  // keyring. Freeside's ingress refuses at intake; the wedge / Finn / Dixie
  // are the second / third / fourth lines of defense.
  const crossTenantRequest = buildRecallRequest({
    task: 'freeside-handoff: cross-tenant recall, must be refused at ingress',
    environment_frame: 'private_operator',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.unknown,
    signed_at: T.recall_cross,
    request_id: 'rreq_freeside-cross-tenant-refused',
  });

  // ── 5. Private-in-public exclusion (bot adapter). ──────────────────────
  const privateStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const privateAssertion = buildSeededAssertion({
    status: 'active',
    assertion_class: 'observation',
    body: { text: 'Freeside-handoff: a private observation a Discord bot must NOT leak.' },
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
      body: { text: 'Freeside-handoff: public counterpart a Discord bot may include.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.private_seed,
    }),
    T.private_seed,
  );
  const privateRequest = buildRecallRequest({
    task: 'freeside-handoff: public_discord bot recall, must exclude private',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_private,
    request_id: 'rreq_freeside-private-public-bot',
  });
  const privateOut = executeRecall(privateStore, privateRequest, T.recall_private);
  if (!privateOut.ok || !privateOut.pack || !privateOut.receipt) {
    throw new Error('freeside-surface: private-exclusion bot recall denied unexpectedly');
  }

  // ── 6. Feedback signal as candidate (denied — no rule). ────────────────
  // A Discord event enters the wedge as a candidate feedback_signal with
  // discord_event provenance. The wedge currently has no competence rule
  // for feedback_signal admission, so admission is denied with
  // no_competence_rule_for_transition. This pins the load-bearing rule:
  // platform events enter as candidates, not as memory truth — and even as
  // candidates, they fail closed when no rule authorizes the admission.
  const feedbackStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const feedbackCandidate = buildCandidate({
    assertion_class: 'feedback_signal',
    body: {
      summary: 'community member upvoted agent reply in #community-feedback',
      score: 1,
      platform: 'discord',
    },
    privacy_scope: 'tenant',
    risk_level: 'low',
    signer: SIGNERS.runtime,
    signed_at: T.feedback_event,
    provenance: feedbackProvenance(T.feedback_event),
  });
  const feedbackClassValidation = validateCandidateAssertion(feedbackCandidate);
  const feedbackDecision = policyForAdmitAssertion({
    candidate: feedbackCandidate,
    class_validation: feedbackClassValidation,
    keyring: feedbackStore.getKeyring(),
    now: T.feedback_event,
  });
  if (feedbackDecision.decision !== 'deny') {
    throw new Error(
      'freeside-surface: expected feedback_signal admission to fail closed (no competence rule)',
    );
  }

  // ── 7. Admin capability grant (allowed). ───────────────────────────────
  // A community admin (reviewer signer) grants a scoped bot capability via
  // a candidate `permission` assertion. The wedge admits and emits a
  // transition receipt + audit event.
  const permissionStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const permissionCandidate = buildCandidate({
    assertion_class: 'permission',
    body: {
      capability: 'discord.bot.send_message',
      scope: 'community:freeside-demo',
      granted_to: 'agent:satoshi-demo',
      granted_by: 'reviewer:dixie',
      conditions: { rate_limit_per_minute: 5, public_only: true },
    },
    privacy_scope: 'tenant',
    risk_level: 'medium',
    signer: SIGNERS.reviewer,
    signed_at: T.permission_grant,
  });
  const permissionAdmit = permissionStore.admit(permissionCandidate, T.permission_grant);
  if (!permissionAdmit.ok || !permissionAdmit.assertion) {
    throw new Error('freeside-surface: permission grant denied unexpectedly');
  }

  // ── 8. Bot action with receipt (allowed). ──────────────────────────────
  // The bot executes a governed action (action_trace class). The wedge's
  // rule:admit-action-trace-runtime allows runtime / operator signers.
  const actionStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const actionCandidate = buildCandidate({
    assertion_class: 'action_trace',
    body: {
      action: 'discord.bot.send_message',
      target: 'discord://guild/freeside-demo/channel/community',
      summary: 'Bot replied to community-feedback thread with governed recall pack reference.',
      result: 'success',
      capability_ref: permissionAdmit.assertion.assertion_id,
    },
    privacy_scope: 'tenant',
    risk_level: 'low',
    signer: SIGNERS.runtime,
    signed_at: T.bot_action,
  });
  const actionAdmit = actionStore.admit(actionCandidate, T.bot_action);
  if (!actionAdmit.ok || !actionAdmit.assertion) {
    throw new Error('freeside-surface: bot action_trace admission denied unexpectedly');
  }

  // ── 9. Revoked + forgotten excluded from bot recall. ───────────────────
  const revokedForgottenStore = new EstateStore({
    actor: loadActor(),
    estate: loadEstate(),
    keyring: loadKeyring(),
  });
  const revokedAssertion = buildSeededAssertion({
    status: 'revoked',
    assertion_class: 'observation',
    body: { text: 'Freeside-handoff: a revoked observation a bot must exclude from public_discord.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.operator,
    signed_at: T.revoked_seed,
    created_at: T.revoked_seed,
  });
  revokedForgottenStore.seedAssertion(revokedAssertion);
  const forgottenAssertion = buildSeededAssertion({
    status: 'forgotten_from_recall',
    assertion_class: 'observation',
    body: { text: 'Freeside-handoff: a forgotten observation a bot must exclude from ordinary recall.' },
    privacy_scope: 'public',
    risk_level: 'low',
    signer: SIGNERS.operator,
    signed_at: T.forgotten_seed,
    created_at: T.forgotten_seed,
  });
  revokedForgottenStore.seedAssertion(forgottenAssertion);
  revokedForgottenStore.admit(
    buildCandidate({
      assertion_class: 'observation',
      body: { text: 'Freeside-handoff: active companion a bot may include in public_discord.' },
      privacy_scope: 'public',
      risk_level: 'low',
      signer: SIGNERS.runtime,
      signed_at: T.forgotten_seed,
    }),
    T.forgotten_seed,
  );
  const revokedForgottenRequest = buildRecallRequest({
    task: 'freeside-handoff: public_discord bot recall, must exclude revoked + forgotten',
    environment_frame: 'public_discord',
    risk_profile: 'medium',
    requested_classes: ['observation'],
    exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
    mark_statuses: ['contested', 'demoted'],
    include_provenance: true,
    signer: SIGNERS.operator,
    signed_at: T.recall_revoked_fg,
    request_id: 'rreq_freeside-revoked-forgotten-excluded-bot',
  });
  const revokedForgottenOut = executeRecall(
    revokedForgottenStore,
    revokedForgottenRequest,
    T.recall_revoked_fg,
  );
  if (!revokedForgottenOut.ok || !revokedForgottenOut.pack || !revokedForgottenOut.receipt) {
    throw new Error('freeside-surface: revoked+forgotten bot recall denied unexpectedly');
  }

  return {
    discordRequest,
    discordPack: discordOut.pack,
    discordReceipt: discordOut.receipt,
    telegramRequest,
    telegramPack: telegramOut.pack,
    telegramReceipt: telegramOut.receipt,
    tenantAdminRequest,
    tenantAdminPack: tenantAdminOut.pack,
    tenantAdminReceipt: tenantAdminOut.receipt,
    crossTenantRequest,
    privatePack: privateOut.pack,
    privateReceipt: privateOut.receipt,
    privateAssertion,
    feedbackCandidate,
    feedbackDecision,
    permissionAdmit,
    permissionCandidate,
    actionAdmit,
    actionCandidate,
    revokedAssertion,
    forgottenAssertion,
    revokedForgottenPack: revokedForgottenOut.pack,
    revokedForgottenReceipt: revokedForgottenOut.receipt,
    revokedForgottenAuditEvents: revokedForgottenStore.auditLog.listFor(loadEstate().estate_id),
  };
}

function describeReceipt(r: TransitionReceipt): {
  receipt_id: string;
  receipt_kind: string;
  transition_id: string;
  transition_type: string;
  decision: string;
  audit_event_ref: string;
  receipt_hash: string;
} {
  return {
    receipt_id: r.receipt_id,
    receipt_kind: r.kind,
    transition_id: r.transition_id,
    transition_type: r.transition_type,
    decision: r.decision,
    audit_event_ref: r.audit_event_ref,
    receipt_hash: r.receipt_hash,
  };
}

export function buildFixtures(): FreesideFixture[] {
  const r = buildOutputs();

  return [
    {
      case_name: 'bot_recall_public_discord',
      expected_allowed: true,
      reason:
        "Freeside's Discord bot adapter builds a RecallRequest envelope per the wedge's validateRecallRequest shape, attaches environment_frame=public_discord, runs cross-tenant boundary checks, and forwards to the runtime gate. The bot reply renders the served RecallPack + RecallReceipt; included items are quotable, marked items carry a 'contested' affordance, excluded items appear only as exclusion summary entries.",
      input: {
        adapter: 'discord',
        adapter_event: 'discord:bot.recall',
        environment_frame: 'public_discord',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          discord: {
            guild_id: 'guild:freeside-demo',
            channel_id: 'channel:community',
            channel_visibility: 'public',
          },
          signer: {
            signer_id: SIGNERS.operator.signer_id,
            signer_type: SIGNERS.operator.signer_type,
          },
        },
        request_envelope: r.discordRequest,
        now: T.recall_discord,
      },
      expected_output: {
        intake_decision: 'accepted',
        served_pack: r.discordPack,
        served_receipt: r.discordReceipt,
        receipt_pack_hash_matches: r.discordReceipt.pack_hash === r.discordPack.pack_hash,
        notes:
          "The Discord bot reply MUST surface the included / marked / excluded_summary discipline intact. The receipt is the audit artifact; a pack rendered without its receipt is a runtime bug.",
      },
    },
    {
      case_name: 'bot_recall_public_telegram',
      expected_allowed: true,
      reason:
        "Freeside's Telegram bot adapter builds a RecallRequest envelope per the wedge's validateRecallRequest shape, attaches environment_frame=public_telegram, runs cross-tenant boundary checks, and forwards to the runtime gate. The bot reply renders the served RecallPack + RecallReceipt; private bodies stay excluded.",
      input: {
        adapter: 'telegram',
        adapter_event: 'telegram:bot.recall',
        environment_frame: 'public_telegram',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          telegram: {
            chat_id: 'chat:freeside-demo-public',
            chat_visibility: 'public',
          },
          signer: {
            signer_id: SIGNERS.operator.signer_id,
            signer_type: SIGNERS.operator.signer_type,
          },
        },
        request_envelope: r.telegramRequest,
        now: T.recall_telegram,
      },
      expected_output: {
        intake_decision: 'accepted',
        served_pack: r.telegramPack,
        served_receipt: r.telegramReceipt,
        receipt_pack_hash_matches: r.telegramReceipt.pack_hash === r.telegramPack.pack_hash,
        notes:
          "Telegram-side audit_review surfaces are NOT exposed; review-queue UI lives in Dixie, not Freeside. The bot reply renders only what the wedge / Finn / Dixie returned.",
      },
    },
    {
      case_name: 'tenant_admin_recall',
      expected_allowed: true,
      reason:
        "Freeside's tenant-admin surface (REST or admin Discord channel) maps caller frame intent 'tenant_admin' to wedge frame 'private_operator', forwards the recall, and renders the result. The frame intent is a Freeside-side presentation overlay; it is NOT a new wedge EnvironmentFrame value.",
      input: {
        adapter: 'rest',
        adapter_event: 'POST /admin/recall',
        environment_frame: 'private_operator',
        caller_frame_intent: 'tenant_admin',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          signer: {
            signer_id: SIGNERS.operator.signer_id,
            signer_type: SIGNERS.operator.signer_type,
          },
          rest_route: '/admin/recall',
          rest_tenant_header: 'tenant:satoshi-demo',
        },
        request_envelope: r.tenantAdminRequest,
        now: T.recall_tenant_adm,
      },
      expected_output: {
        intake_decision: 'accepted',
        served_pack: r.tenantAdminPack,
        served_receipt: r.tenantAdminReceipt,
        receipt_pack_hash_matches:
          r.tenantAdminReceipt.pack_hash === r.tenantAdminPack.pack_hash,
        notes:
          "Tenant-admin recall lets the admin view counts and tenant-scoped material; actor_private bodies stay private unless the admin holds the reviewer signer (in which case audit_review applies and Dixie hosts the surface).",
      },
    },
    {
      case_name: 'denied_cross_tenant_recall',
      expected_allowed: false,
      reason:
        "Freeside's ingress refuses cross-tenant recall at the bot / REST / NATS layer. The caller's signer is not on the target estate's keyring, and the caller's tenant boundary does not match the target's tenant. Freeside emits an audit log entry referencing the wedge's recall_denied event. Dixie / Finn / the wedge are the second / third / fourth lines of defense — every layer refuses.",
      input: {
        adapter: 'rest',
        adapter_event: 'POST /admin/recall',
        environment_frame: 'private_operator',
        caller_frame_intent: 'tenant_admin',
        caller: {
          tenant_id: 'tenant:other-actor',
          actor_id: 'agent:other-actor',
          signer: {
            signer_id: SIGNERS.unknown.signer_id,
            signer_type: SIGNERS.unknown.signer_type,
          },
          rest_route: '/admin/recall',
          rest_tenant_header: 'tenant:other-actor',
        },
        request_envelope: r.crossTenantRequest,
        now: T.recall_cross,
      },
      expected_output: {
        intake_decision: 'denied',
        deny_reason: 'cross_tenant_recall_refused',
        freeside_audit_entry: {
          event_type: 'freeside_recall_intake_denied',
          recall_request_id: r.crossTenantRequest.recall_request_id,
          target_estate_id: r.crossTenantRequest.estate_id,
          caller_tenant_id: 'tenant:other-actor',
          caller_signer_id: SIGNERS.unknown.signer_id,
          reason: 'cross_tenant_recall_refused',
          references_wedge_event_type: 'recall_denied',
          now: T.recall_cross,
        },
        notes:
          "Cross-tenant prevention is a Freeside-layer responsibility (first line of defense). Dixie / Finn / the wedge re-check downstream; every layer must refuse for the boundary to hold.",
      },
    },
    {
      case_name: 'denied_private_in_public_bot',
      expected_allowed: false,
      reason:
        "Freeside's Discord bot adapter surfaces the served pack with the actor_private body excluded — privacyDispositionForFrame in public_discord refuses actor_private material. The private assertion is NOT in included, NOT in marked; it appears only in excluded_summary as private_excluded_from_public_frame. The bot reply MUST surface the exclusion summary, never the body.",
      input: {
        adapter: 'discord',
        adapter_event: 'discord:bot.recall',
        environment_frame: 'public_discord',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          discord: {
            guild_id: 'guild:freeside-demo',
            channel_id: 'channel:community',
            channel_visibility: 'public',
          },
          signer: {
            signer_id: SIGNERS.operator.signer_id,
            signer_type: SIGNERS.operator.signer_type,
          },
        },
        seeded_private_assertion: r.privateAssertion,
        recall_request_id: 'rreq_freeside-private-public-bot',
        now: T.recall_private,
      },
      expected_output: {
        served_pack: r.privatePack,
        served_receipt: r.privateReceipt,
        private_assertion_in_included: false,
        private_assertion_in_marked: false,
        deny_reason: 'private_excluded_from_public_frame',
        notes:
          "Freeside MUST NOT expose actor_private bodies in public_discord under any circumstance, even if the caller has admin role in Discord. Frame elevation is forbidden; private bodies live in audit_review only (and only via Dixie's reviewer-signed surface).",
      },
    },
    {
      case_name: 'denied_bot_memory_as_recall',
      expected_allowed: false,
      reason:
        "Freeside MUST NOT promote bot-side conversation buffers, vector-store hits, or message scrollback into a RecallPack. A Discord conversation buffer is bot context, not governed recall. A RecallPack only exists if the request ran through the runtime gate, the policy lane returned a non-deny decision, the disposition matrix was applied, and a RecallReceipt was emitted and persisted.",
      input: {
        adapter: 'discord',
        adapter_event: 'discord:bot.context_request',
        environment_frame: 'public_discord',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          discord: {
            guild_id: 'guild:freeside-demo',
            channel_id: 'channel:community',
            channel_visibility: 'public',
          },
        },
        bot_memory_hit_list: [
          {
            source: 'discord_message',
            message_id: 'msg:0001',
            similarity: 0.91,
            text: 'last week the agent said this in #community-feedback',
          },
          {
            source: 'discord_message',
            message_id: 'msg:0002',
            similarity: 0.88,
            text: 'and this in #community-help',
          },
        ],
        now: T.recall_discord,
      },
      expected_output: {
        intake_decision: 'denied',
        deny_reason: 'bot_memory_is_not_governed_recall',
        rendered_as: 'bot_context',
        bot_context_affordance: {
          label: 'bot context (not governed recall)',
          warning:
            'These are platform-side message hits; they have NOT passed class validation, policy validation, signer competence, or receipt emission. They are NOT estate truth.',
          governed_recall_alternative: 'POST a RecallRequest through the bot recall surface to receive a RecallPack + RecallReceipt.',
        },
        notes:
          "Bot memory may PROPOSE candidate assertions through the admission gate, but it never IS a governed recall. Freeside's bot adapter MUST surface bot context with a clear 'not governed recall' affordance; rendering it as a RecallPack would re-create the ungoverned-RAG failure mode the wedge exists to prevent.",
      },
    },
    {
      case_name: 'feedback_signal_as_candidate',
      expected_allowed: false,
      reason:
        "A Discord feedback event enters the wedge as a candidate feedback_signal assertion — built per Hounfour's class shape (or, until Hounfour ships, the wedge's re-exported types) with provenance.source_type='discord_event'. The candidate runs through class validation and policy admission; the wedge's keyring currently has NO competence rule for feedback_signal admission, so admission fails closed with no_competence_rule_for_transition. The fixture pins the fail-closed rule: platform events enter as candidates, not as memory truth, and even as candidates they fail closed when no rule authorizes the admission.",
      input: {
        adapter: 'discord',
        adapter_event: 'discord:event.ingest',
        environment_frame: 'public_discord',
        platform_event: {
          discord: {
            guild_id: 'guild:freeside-demo',
            channel_id: 'channel:community-feedback',
            message_id: 'msg:0001',
            event_type: 'reaction_add',
            reaction: '👍',
          },
        },
        candidate_envelope: r.feedbackCandidate,
        now: T.feedback_event,
      },
      expected_output: {
        admission_decision: r.feedbackDecision.decision,
        admission_reason: r.feedbackDecision.reasons,
        candidate_provenance_source_type: 'discord_event',
        candidate_assertion_class: 'feedback_signal',
        notes:
          "Per arch spec §22.7.G2: Discord/Telegram/social/economic feedback signals enter as candidate `feedback_signal`, not as memory truth. The wedge currently fails closed because no competence rule covers feedback_signal admission. Until Hounfour ships a feedback_signal schema and Finn / the wedge ship a competence rule, Freeside MUST NOT admit feedback signals as memory.",
      },
    },
    {
      case_name: 'admin_capability_grant',
      expected_allowed: true,
      reason:
        "A community admin (reviewer signer) grants a scoped Discord bot capability via a candidate `permission` assertion. The wedge's rule:admit-permission-reviewer-only allows reviewer / operator signers to admit permission. Admission succeeds; the wedge emits a TransitionReceipt + assertion_admitted audit event. Freeside's admin surface renders both. Bypassing the gate (e.g. via a Freeside-internal capability table that is not reflected in the actor's estate) would re-create the ungoverned-permission failure mode.",
      input: {
        adapter: 'rest',
        adapter_event: 'POST /admin/capability/grant',
        environment_frame: 'private_operator',
        caller_frame_intent: 'tenant_admin',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          signer: {
            signer_id: SIGNERS.reviewer.signer_id,
            signer_type: SIGNERS.reviewer.signer_type,
          },
        },
        candidate_envelope: r.permissionCandidate,
        candidate_assertion_class: 'permission',
        granted_capability: 'discord.bot.send_message',
        now: T.permission_grant,
      },
      expected_output: {
        admission_decision: r.permissionAdmit.policy_decision.decision,
        admitted_assertion: r.permissionAdmit.assertion,
        transition_receipt_summary: describeReceipt(r.permissionAdmit.receipt),
        audit_event_id: r.permissionAdmit.audit_event_id,
        notes:
          "Per arch spec §22.7.G3: community admin can grant scoped bot capability with policy and audit. The permission assertion enters the actor's estate and becomes inspectable via Dixie's assertion_status_inspection surface; Freeside renders the grant outcome to the admin.",
      },
    },
    {
      case_name: 'bot_action_with_receipt',
      expected_allowed: true,
      reason:
        "A bot-initiated action (sending a Discord message under a previously-granted capability) enters the wedge as a candidate `action_trace` assertion signed by the runtime. The wedge's rule:admit-action-trace-runtime allows runtime / operator signers; admission succeeds. The wedge emits a TransitionReceipt + assertion_admitted audit event. Freeside's bot surface renders the action result alongside the receipt id; the audit chain shows what the bot did and under whose capability.",
      input: {
        adapter: 'discord',
        adapter_event: 'discord:bot.action',
        environment_frame: 'public_discord',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          signer: {
            signer_id: SIGNERS.runtime.signer_id,
            signer_type: SIGNERS.runtime.signer_type,
          },
          discord: {
            guild_id: 'guild:freeside-demo',
            channel_id: 'channel:community',
            channel_visibility: 'public',
          },
        },
        candidate_envelope: r.actionCandidate,
        candidate_assertion_class: 'action_trace',
        action_summary: 'discord.bot.send_message',
        now: T.bot_action,
      },
      expected_output: {
        admission_decision: r.actionAdmit.policy_decision.decision,
        admitted_assertion: r.actionAdmit.assertion,
        transition_receipt_summary: describeReceipt(r.actionAdmit.receipt),
        audit_event_id: r.actionAdmit.audit_event_id,
        notes:
          "Every bot action that mutates state runs through Finn's transition gate (or the wedge's, in single-process deployments). The 'every action has a receipt' discipline is load-bearing through Freeside; an action without a receipt is an ungoverned mutation.",
      },
    },
    {
      case_name: 'revoked_forgotten_excluded_bot',
      expected_allowed: false,
      reason:
        "Freeside's Discord bot adapter surfaces a public_discord recall with both revoked and forgotten material excluded — dispositionFor refuses status='revoked' and status='forgotten_from_recall' outside audit_review. Neither assertion appears in included or marked; the bot reply surfaces excluded_summary entries. The audit chain still shows both governance records; revocation and forget are not erasure.",
      input: {
        adapter: 'discord',
        adapter_event: 'discord:bot.recall',
        environment_frame: 'public_discord',
        caller: {
          tenant_id: 'tenant:satoshi-demo',
          actor_id: 'agent:satoshi-demo',
          discord: {
            guild_id: 'guild:freeside-demo',
            channel_id: 'channel:community',
            channel_visibility: 'public',
          },
          signer: {
            signer_id: SIGNERS.operator.signer_id,
            signer_type: SIGNERS.operator.signer_type,
          },
        },
        seeded_revoked_assertion: r.revokedAssertion,
        seeded_forgotten_assertion: r.forgottenAssertion,
        recall_request_id: 'rreq_freeside-revoked-forgotten-excluded-bot',
        now: T.recall_revoked_fg,
      },
      expected_output: {
        served_pack: r.revokedForgottenPack,
        served_receipt: r.revokedForgottenReceipt,
        revoked_in_included_count: r.revokedForgottenPack.included.filter(
          (i) => i.assertion_id === r.revokedAssertion.assertion_id,
        ).length,
        revoked_in_marked_count: r.revokedForgottenPack.marked.filter(
          (i) => i.assertion_id === r.revokedAssertion.assertion_id,
        ).length,
        forgotten_in_included_count: r.revokedForgottenPack.included.filter(
          (i) => i.assertion_id === r.forgottenAssertion.assertion_id,
        ).length,
        forgotten_in_marked_count: r.revokedForgottenPack.marked.filter(
          (i) => i.assertion_id === r.forgottenAssertion.assertion_id,
        ).length,
        deny_reasons: [
          'revoked_excluded_outside_audit_review',
          'forgotten_excluded_outside_audit_review',
        ],
        audit_chain_event_count: r.revokedForgottenAuditEvents.length,
        notes:
          "Per threat-model T3 / T4: revoked and forgotten material are excluded outside audit_review and never quotable as fact. The bot adapter MUST surface a redacted notice ('this material is no longer active'), never the body.",
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

function filenameFor(f: FreesideFixture): string {
  switch (f.case_name) {
    case 'bot_recall_public_discord':
      return 'bot-recall-public-discord.json';
    case 'bot_recall_public_telegram':
      return 'bot-recall-public-telegram.json';
    case 'tenant_admin_recall':
      return 'tenant-admin-recall.json';
    case 'denied_cross_tenant_recall':
      return 'denied-cross-tenant-recall.json';
    case 'denied_private_in_public_bot':
      return 'denied-private-in-public-bot.json';
    case 'denied_bot_memory_as_recall':
      return 'denied-bot-memory-as-recall.json';
    case 'feedback_signal_as_candidate':
      return 'feedback-signal-as-candidate.json';
    case 'admin_capability_grant':
      return 'admin-capability-grant.json';
    case 'bot_action_with_receipt':
      return 'bot-action-with-receipt.json';
    case 'revoked_forgotten_excluded_bot':
      return 'revoked-forgotten-excluded-bot.json';
    default:
      throw new Error(`freeside-surface: no filename mapping for case ${f.case_name}`);
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
  console.log(`\n${written.length} Freeside community-surface fixtures written to ${outDir}`);
  console.log('reminder: these are LOCAL current-shape examples, not official Freeside fixtures.');
  console.log('reminder: this is handoff prep, not Freeside integration.');
} catch (err) {
  console.error('freeside-surface export failed:', err);
  process.exitCode = 1;
}
