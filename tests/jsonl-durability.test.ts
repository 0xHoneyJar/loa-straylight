// Acceptance: with JsonlStorage, an EstateStore can be torn down and rebuilt
// from disk without losing assertions, transitions, receipts, or the audit
// hash chain. This is the Phase 2 durability gate (§17.5).

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  EstateStore,
  JsonlStorage,
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

const T0 = '2026-05-05T10:00:00Z';
const T1 = '2026-05-05T10:30:00Z';
const T2 = '2026-05-05T11:00:00Z';
const T3 = '2026-05-05T12:00:00Z';

describe('JsonlStorage durability — state survives reload', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'straylight-jsonl-durability-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('writes one .jsonl file per table and reloads to the same materialized state', () => {
    // ── session 1: build the estate, admit, challenge, recall.
    const session1 = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: loadKeyring(),
      storage: new JsonlStorage({ root }),
    });

    const admit = session1.admit(
      buildCandidate({
        assertion_class: 'preference',
        body: { text: 'durable preference' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      T0,
    );
    expect(admit.ok).toBe(true);

    const reflection = session1.admit(
      buildCandidate({
        assertion_class: 'reflection',
        body: { text: 'a doubtful reflection' },
        privacy_scope: 'tenant',
        signer: SIGNERS.runtime,
      }),
      T1,
    );
    expect(reflection.ok).toBe(true);

    const challenge = session1.challenge({
      target_assertion_id: reflection.assertion!.assertion_id,
      challenge: {
        challenge_type: 'unsupported',
        requested_effect: 'revoke',
        evidence_refs: [],
        explanation: 'no evidence',
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

    const req = buildRecallRequest({
      task: 'durable recall',
      environment_frame: 'public_discord',
      risk_profile: 'medium',
      requested_classes: ['preference'],
      exclude_statuses: ['revoked', 'forgotten_from_recall', 'sealed'],
      signer: SIGNERS.operator,
      signed_at: T3,
    });
    const recall = executeRecall(session1, req, T3);
    expect(recall.ok).toBe(true);
    const expectedReceiptId = recall.receipt!.receipt_id;
    const expectedPackHash = recall.pack!.pack_hash;
    const expectedReceiptHash = recall.receipt!.receipt_hash;
    const expectedAssertionId = admit.assertion!.assertion_id;
    const expectedRevokedId = reflection.assertion!.assertion_id;

    // Files exist on disk under the expected names.
    for (const f of [
      'actors.jsonl',
      'actor_estates.jsonl',
      'keyrings.jsonl',
      'estate_assertions.jsonl',
      'estate_transitions.jsonl',
      'recall_receipts.jsonl',
      'audit_events.jsonl',
    ]) {
      expect(existsSync(join(root, f))).toBe(true);
    }

    // Each line is a single JSON object.
    const auditLines = readFileSync(join(root, 'audit_events.jsonl'), 'utf8')
      .split('\n')
      .filter((l) => l.length > 0);
    expect(auditLines.length).toBeGreaterThan(0);
    for (const line of auditLines) {
      const parsed = JSON.parse(line);
      expect(parsed.audit_hash.startsWith('sha256:')).toBe(true);
    }

    // ── session 2: cold reload via fromStorage. The first session is gone.
    const reloadedStorage = new JsonlStorage({ root });
    const session2 = EstateStore.fromStorage(reloadedStorage, loadEstate().estate_id);
    expect(session2).toBeDefined();
    if (!session2) return;

    // Assertions: same set, same statuses.
    const assertions = session2.listAssertions();
    const byId = new Map(assertions.map((a) => [a.assertion_id, a]));
    expect(byId.get(expectedAssertionId)?.status).toBe('active');
    expect(byId.get(expectedRevokedId)?.status).toBe('revoked');

    // Audit chain: verifies clean against the reloaded events.
    const verify = session2.auditLog.verifyChain(loadEstate().estate_id);
    expect(verify.ok).toBe(true);

    // Audit tail matches what the original session would have computed.
    const tail = reloadedStorage.getAuditTail(loadEstate().estate_id);
    const events = session2.auditLog.listFor(loadEstate().estate_id);
    expect(tail).toBe(events[events.length - 1]?.audit_hash);

    // Receipt retrievable + identical hash.
    const persisted = reloadedStorage.getRecallReceipt(expectedReceiptId);
    expect(persisted).toBeDefined();
    expect(persisted!.pack_hash).toBe(expectedPackHash);
    expect(persisted!.receipt_hash).toBe(expectedReceiptHash);

    // Re-running the same recall request (deterministic now) reproduces the same hashes.
    const recall2 = executeRecall(session2, req, T3);
    expect(recall2.ok).toBe(true);
    expect(recall2.pack!.pack_hash).toBe(expectedPackHash);
    expect(recall2.receipt!.receipt_hash).toBe(expectedReceiptHash);
  });

  it('detects a tampered audit_events.jsonl line via verifyChain', () => {
    const session = new EstateStore({
      actor: loadActor(),
      estate: loadEstate(),
      keyring: loadKeyring(),
      storage: new JsonlStorage({ root }),
    });
    session.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'tamper-me-1' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      T0,
    );
    session.admit(
      buildCandidate({
        assertion_class: 'observation',
        body: { text: 'tamper-me-2' },
        privacy_scope: 'public',
        signer: SIGNERS.operator,
      }),
      T1,
    );

    // Tamper: rewrite the audit_events.jsonl with a flipped previous_audit_hash
    // on the second line so the chain breaks.
    const auditPath = join(root, 'audit_events.jsonl');
    const lines = readFileSync(auditPath, 'utf8').split('\n').filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const second = JSON.parse(lines[1]!);
    second.previous_audit_hash = 'sha256:deadbeef';
    lines[1] = JSON.stringify(second);
    writeFileSync(auditPath, lines.join('\n') + '\n', 'utf8');

    const reloaded = new JsonlStorage({ root });
    const reloadedStore = EstateStore.fromStorage(reloaded, loadEstate().estate_id)!;
    const verify = reloadedStore.auditLog.verifyChain(loadEstate().estate_id);
    expect(verify.ok).toBe(false);
    if (!verify.ok) {
      expect(verify.broken_at).toBe(1);
      expect(verify.reason).toBe('previous_audit_hash_mismatch');
    }
  });

  it('fromStorage returns undefined when the requested estate has no rows', () => {
    const storage = new JsonlStorage({ root });
    expect(EstateStore.fromStorage(storage, 'estate:does-not-exist')).toBeUndefined();
  });
});
