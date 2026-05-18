import type { IntakeDeps } from '../../host/intake.js';
import type { RecallIntakeRequest, RecallIntakeResponse } from '../../host/types.js';
import type { EstateStore } from '../../estate.js';
import { type DixieCapability } from './dixie-capability.js';
/**
 * @experimental Phase 26A-2 / ADR-026A — pre-Finn, Dixie-only runtime
 * recall-intake entrypoint. Migration: this entrypoint is deprecated
 * and retired by a future ADR (provisionally ADR-026B or successor)
 * when ADR-022E gate #9 fires and runtime enforcement moves to Finn.
 *
 * This is the **only** runtime entrypoint authorized for the wedge
 * during the MVP slice (ADR-026A §"Decision" §3 allowlist). Consumption
 * is gated to Dixie via the capability mechanism in
 * `./dixie-capability.ts`; a non-Dixie caller cannot pass the gate
 * without the deployment-bound `STRAYLIGHT_RUNTIME_DIXIE_KEY` value
 * Dixie plants in its own process env.
 *
 * On capability-gate refusal the response is shaped as a `denied`
 * outcome with `reason: 'storage_unavailable'` (the closest closed-enum
 * value carrying "the seam refused" semantics that does NOT invent a
 * new `DeniedReason` — the host's `DeniedReason` enum is intentionally
 * not widened by Phase 26B). The `raw_reasons` array carries the
 * seam-level refusal code (`runtime_seam:capability_*`).
 */
export declare function handleRecallIntake(store: EstateStore, req: RecallIntakeRequest, deps: IntakeDeps, capability: DixieCapability): RecallIntakeResponse;
