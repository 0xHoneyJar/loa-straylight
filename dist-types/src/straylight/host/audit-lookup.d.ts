import type { AuditLog } from '../audit.js';
import type { StorageAdapter } from '../storage/types.js';
import { type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type { AuditChainLookupRequest, AuditChainLookupResponse } from './types.js';
export interface AuditLookupDeps {
    tenantResolver: TenantResolver;
    intakeLog: IntakeDenyLog;
    now: string;
}
export declare function handleAuditChainLookup(auditLog: AuditLog, storage: StorageAdapter, req: AuditChainLookupRequest, deps: AuditLookupDeps): AuditChainLookupResponse;
