import type { StorageAdapter } from '../storage/types.js';
import { type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type { ProvenanceWalkRequest, ProvenanceWalkResponse } from './types.js';
export interface ProvenanceDeps {
    tenantResolver: TenantResolver;
    intakeLog: IntakeDenyLog;
    now: string;
}
export declare function handleProvenanceWalk(storage: StorageAdapter, req: ProvenanceWalkRequest, deps: ProvenanceDeps): ProvenanceWalkResponse;
