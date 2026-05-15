// Phase 24C — Surface 2: Receipt retrieval & display.
//
// Per docs/specs/dixie-recall-host-mvp-contract.md §Surface 2. The host
// returns the wedge's persisted `RecallReceipt` verbatim. detail_level
// redaction is wedge-applied (see src/straylight/recall.ts `redactReceipt`);
// the host does NOT re-redact and does NOT invent receipt content.

import type { StorageAdapter } from '../storage/types.js';
import { checkSameTenant, type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type {
  ReceiptRetrievalRequest,
  ReceiptRetrievalResponse,
} from './types.js';

export interface ReceiptDeps {
  tenantResolver: TenantResolver;
  intakeLog: IntakeDenyLog;
  now: string;
}

export function handleReceiptRetrieval(
  storage: StorageAdapter,
  req: ReceiptRetrievalRequest,
  deps: ReceiptDeps,
): ReceiptRetrievalResponse {
  // 1. Caller tenant must resolve. Ambiguity → tenant_resolution_failed.
  const callerCheck = checkSameTenant(req.caller.tenant_id, req.caller.actor_id, deps.tenantResolver);
  if (!callerCheck.ok) {
    return {
      outcome: 'not_found',
      reason:
        callerCheck.reason === 'tenant_unresolved'
          ? 'tenant_resolution_failed'
          : 'cross_tenant_refused',
    };
  }

  // 2. Receipt lookup — storage faults fail closed.
  let receipt;
  try {
    receipt = storage.getRecallReceipt(req.receipt_id);
  } catch {
    return { outcome: 'not_found', reason: 'storage_unavailable' };
  }
  if (!receipt) return { outcome: 'not_found', reason: 'unknown_receipt_id' };

  // 3. Verify the receipt's actor_id resolves into the caller's tenant.
  //    Cross-tenant lookup → intake-deny log entry + cross_tenant_refused.
  const targetCheck = checkSameTenant(req.caller.tenant_id, receipt.actor_id, deps.tenantResolver);
  if (!targetCheck.ok) {
    deps.intakeLog.append({
      caller_tenant: req.caller.tenant_id,
      caller_actor_id: req.caller.actor_id,
      target_actor_id: receipt.actor_id,
      target_receipt_id: req.receipt_id,
      reason:
        targetCheck.reason === 'tenant_unresolved'
          ? 'tenant_resolution_failed'
          : 'cross_tenant_receipt_lookup',
      ts: deps.now,
    });
    return {
      outcome: 'not_found',
      reason:
        targetCheck.reason === 'tenant_unresolved'
          ? 'tenant_resolution_failed'
          : 'cross_tenant_refused',
    };
  }

  return { outcome: 'found', receipt };
}
