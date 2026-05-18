// Phase 26B — runtime recall-intake handler.
//
// Wraps the existing host-layer `handleRecallIntake` (per ADR-024G / Phase
// 24C) behind the Phase 26B Dixie-only capability gate (see
// ./dixie-capability.ts). The wedge's semantic logic is unchanged; this
// module is the runtime seam ADR-026A authorizes — and only that.
//
// Per ADR-026A §11, the runtime seam:
//   * MUST NOT add ingress validation, rate limits, body-size limits,
//     per-tenant memory caps, replay/idempotency state, or
//     multi-instance coordination logic;
//   * MUST re-check the wedge invariants the wedge itself re-checks
//     (delegated to `executeRecall` via the host-layer
//     `handleRecallIntake`);
//   * is fail-closed on precondition mismatch (capability-gate refusal
//     short-circuits before any wedge work).
import { handleRecallIntake as handleHostRecallIntake } from '../../host/intake.js';
import { verifyDixieCapability, } from './dixie-capability.js';
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
export function handleRecallIntake(store, req, deps, capability) {
    const verdict = verifyDixieCapability(capability);
    if (!verdict.ok) {
        const reason = 'storage_unavailable';
        return {
            outcome: 'denied',
            reason,
            raw_reasons: [`runtime_seam:${verdict.reason}`],
        };
    }
    return handleHostRecallIntake(store, req, deps);
}
