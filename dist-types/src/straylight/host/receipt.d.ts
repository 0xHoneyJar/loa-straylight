import type { StorageAdapter } from '../storage/types.js';
import { type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type { ReceiptRetrievalRequest, ReceiptRetrievalResponse } from './types.js';
export interface ReceiptDeps {
    tenantResolver: TenantResolver;
    intakeLog: IntakeDenyLog;
    now: string;
}
export declare function handleReceiptRetrieval(storage: StorageAdapter, req: ReceiptRetrievalRequest, deps: ReceiptDeps): ReceiptRetrievalResponse;
