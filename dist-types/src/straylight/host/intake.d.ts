import type { EstateStore } from '../estate.js';
import { type TenantResolver } from './tenancy.js';
import type { IntakeDenyLog } from './intake-log.js';
import type { RecallIntakeRequest, RecallIntakeResponse } from './types.js';
export interface IntakeDeps {
    /** REQUIRED. No silent default. See ./tenancy.ts for the contract. */
    tenantResolver: TenantResolver;
    /** REQUIRED. Vectors 7/8 require intake-deny log entries on refusal. */
    intakeLog: IntakeDenyLog;
    /** Logical "now" timestamp (ISO 8601). */
    now: string;
}
export declare function handleRecallIntake(store: EstateStore, req: RecallIntakeRequest, deps: IntakeDeps): RecallIntakeResponse;
