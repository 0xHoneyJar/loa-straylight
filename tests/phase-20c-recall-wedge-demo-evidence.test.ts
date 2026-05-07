// Phase 20C — Recall Wedge demo / evidence pin.
//
// LOCAL DEMO EVIDENCE, NOT RUNTIME-WIRED. Phase 20C only.
//
// This file lightly pins the JSON output shape of the existing local
// recall demo (`npm run demo:recall:json` /
// `npm run demo:recall -- --json`) so the contract documented in
// docs/handoffs/phase-20c-recall-wedge-demo-evidence.md cannot silently
// drift. It exercises the same `runDemo()` / `toDemoJson()` already
// covered for behavior by tests/phase-4-demo.test.ts; this pin is shape-
// only, on the five top-level keys the Phase 20C handoff doc names:
//   recall_request, recall_pack, recall_receipt, audit_review,
//   audit_chain_verification.
//
// The test does NOT modify any `src/` file, does NOT change demo
// behavior, does NOT wire Finn / Dixie / Freeside runtime, does NOT add
// a Dixie endpoint, does NOT implement Challenge or EstateTransition,
// does NOT import any unexported Hounfour internal, does NOT add a
// `safeCanonicalize` subpath, does NOT change the wedge's public surface
// in `src/straylight/index.ts`, and does NOT change `package.json`.
// Only this test file and the Phase 20C handoff docs are touched by
// Phase 20C.

import { describe, expect, it } from 'vitest';
import { runDemo, toDemoJson } from '../scripts/demo-recall-wedge.lib.js';

describe('phase 20C — local recall demo / evidence: JSON output shape pin', () => {
  it('exposes exactly the five top-level keys named by the Phase 20C handoff doc', () => {
    const json = toDemoJson(runDemo({ silent: true }));
    const keys = Object.keys(json).sort();
    expect(keys).toEqual([
      'audit_chain_verification',
      'audit_review',
      'recall_pack',
      'recall_receipt',
      'recall_request',
    ]);
  });

  it('audit_review carries { request, pack, receipt } — public + audit frames are both projected', () => {
    const json = toDemoJson(runDemo({ silent: true }));
    expect(Object.keys(json.audit_review).sort()).toEqual(['pack', 'receipt', 'request']);
  });

  it('audit_chain_verification.ok is true on a clean local run', () => {
    const json = toDemoJson(runDemo({ silent: true }));
    expect(json.audit_chain_verification.ok).toBe(true);
  });

  it('recall_pack and recall_receipt are linked by recall_pack_id and pack_hash', () => {
    const json = toDemoJson(runDemo({ silent: true }));
    expect(json.recall_pack.recall_pack_id).toBe(json.recall_receipt.recall_pack_id);
    expect(json.recall_pack.pack_hash).toBe(json.recall_receipt.pack_hash);
  });

  it('audit_review.pack and audit_review.receipt are linked by recall_pack_id and pack_hash', () => {
    const json = toDemoJson(runDemo({ silent: true }));
    expect(json.audit_review.pack.recall_pack_id).toBe(json.audit_review.receipt.recall_pack_id);
    expect(json.audit_review.pack.pack_hash).toBe(json.audit_review.receipt.pack_hash);
  });
});
