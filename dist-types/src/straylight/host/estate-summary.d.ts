import type { StorageAdapter } from '../storage/types.js';
import { type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type { EstateSummaryRequest, EstateSummaryResponse } from './types.js';
export interface EstateSummaryDeps {
    tenantResolver: TenantResolver;
    /**
     * Optional. When provided, cross-tenant target refusals append an
     * intake-deny entry on the caller's tenant (matching Surface 1 / 2 / 4
     * discipline). Phase 24C callers without an `intakeLog` continue to
     * work unchanged; the refusal still surfaces in the response.
     */
    intakeLog?: IntakeDenyLog;
    now: string;
}
export declare function handleEstateSummary(storage: StorageAdapter, req: EstateSummaryRequest, deps: EstateSummaryDeps): EstateSummaryResponse;
