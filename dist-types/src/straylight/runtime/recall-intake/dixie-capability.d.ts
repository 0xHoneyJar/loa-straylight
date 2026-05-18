/**
 * @experimental Phase 26A-2 / ADR-026A — pre-Finn, Dixie-only runtime
 * capability. Migration: this type is retired when ADR-022E gate #9
 * fires and runtime enforcement moves to Finn.
 *
 * Constructed by {@link createDixieCapability}. The capability object
 * carries its own proof; the runtime barrel verifies the proof against
 * the closure-private brand and the deployment-bound shared key on every
 * call. Pass the capability through to {@link handleRecallIntake} as the
 * fourth argument; do not log it, persist it, or transmit it across
 * processes.
 */
export interface DixieCapability {
    readonly nonce: string;
    readonly proof: string;
}
/**
 * @experimental Phase 26A-2 / ADR-026A — pre-Finn, Dixie-only runtime
 * gate constructor. Migration: this constructor is retired when
 * ADR-022E gate #9 fires and runtime enforcement moves to Finn.
 *
 * Reads `STRAYLIGHT_RUNTIME_DIXIE_KEY` from the calling process's env
 * and uses it to HMAC-sign a fresh nonce. The resulting capability is
 * branded for recognition by {@link handleRecallIntake}'s internal
 * verifier; a structurally-identical object that did NOT come from this
 * constructor is rejected at the brand check.
 *
 * Throws {@link DixieCapabilityError} when the env key is absent or
 * empty (fail-closed default per ADR-026A §7).
 */
export declare function createDixieCapability(): DixieCapability;
export type DixieCapabilityVerdict = {
    ok: true;
} | {
    ok: false;
    reason: 'capability_unavailable' | 'capability_unrecognized' | 'proof_invalid';
};
/**
 * Verify a candidate capability. Internal to the runtime seam — exported
 * here for the runtime barrel and the in-repo test suite, NOT re-exported
 * through the package's `./runtime/recall-intake` public surface.
 */
export declare function verifyDixieCapability(candidate: unknown): DixieCapabilityVerdict;
/**
 * @experimental Phase 26A-2 / ADR-026A — pre-Finn, Dixie-only runtime
 * error. Migration: this error class is retired when ADR-022E gate #9
 * fires and runtime enforcement moves to Finn.
 *
 * Thrown by {@link createDixieCapability} when the deployment-bound
 * shared key is not present in the calling process's env. The runtime
 * barrel itself does NOT throw; it returns a `denied` outcome with a
 * closed-enum reason so callers can handle the refusal as normal
 * control flow.
 */
export declare class DixieCapabilityError extends Error {
    constructor(message: string);
}
