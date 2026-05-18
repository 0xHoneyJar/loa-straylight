// Phase 26B — concrete non-Dixie refusal mechanism for the runtime
// recall-intake subpath.
//
// Per ADR-026A §"Decision" §7, the runtime barrel MUST fail closed
// against:
//   (i)   direct ESM import / use from a non-Dixie package;
//   (ii)  forged caller metadata;
//   (iii) fake "dixie"-named wrapper packages;
//   (iv)  dependency-object spoofing (since the runtime seam takes a
//         capability object as part of its dependency contract).
//
// Mechanism: HMAC-SHA256 challenge-response gated by an environment-bound
// secret that only Dixie's deployment can plant in its own process env,
// PLUS a closure-private brand on the capability object. The capability
// is constructed by `createDixieCapability()` which:
//
//   1. reads the env-bound shared key (`STRAYLIGHT_RUNTIME_DIXIE_KEY`);
//      refuses (throws) when the key is absent or empty — that is the
//      load-bearing fail-closed default;
//   2. mints a fresh per-capability nonce via `crypto.randomBytes`;
//   3. computes `HMAC-SHA256(key, nonce)` and stores it on the
//      capability as `proof`;
//   4. registers the capability in a closure-private `WeakSet` so the
//      runtime barrel's verifier can recognise it as genuinely
//      module-issued.
//
// The runtime barrel calls `verifyDixieCapability(cap)` which checks, in
// order:
//
//   * the candidate is an object that is a member of the closure-private
//     `WeakSet` (defeats dependency-object spoofing per §7 (iv): a
//     hand-rolled object with the same shape but synthesised outside
//     this module is rejected at the brand check, before the HMAC check
//     runs);
//   * the env-bound key is still present (defeats direct import from a
//     non-Dixie process per §7 (i): without the env key this check
//     fails);
//   * the proof has the expected hex shape;
//   * the proof bit-equals the canonical HMAC of the nonce under the
//     shared key (constant-time via `crypto.timingSafeEqual`).
//
// Per-attack-shape coverage analysis (ADR-026A §7):
//
//   (i) direct ESM import from a non-Dixie package: a non-Dixie process
//       does not carry `STRAYLIGHT_RUNTIME_DIXIE_KEY` in its env. The
//       capability constructor refuses (throws). The runtime barrel
//       rejects any object that did not come from the constructor via
//       the brand check. Net result: every call fails closed.
//
//   (ii) forged caller metadata: the gate consults NO caller-supplied
//        metadata — no package name, no user-agent, no caller-identity
//        string, no header. ADR-026A §7 explicitly rules these
//        insufficient. Forging metadata against this gate is a no-op.
//
//   (iii) fake "dixie"-named wrapper package: package-name strings are
//         never inspected by the gate. A wrapper package called "dixie"
//         that does NOT carry the env key cannot construct a capability
//         and therefore cannot pass the brand check. A wrapper that DOES
//         carry the env key has been granted Dixie's deployment secret
//         and is, definitionally, Dixie-authorised — which matches the
//         deployment-bound trust model the ADR pins.
//
//   (iv) dependency-object spoofing: the capability's brand is membership
//        in a module-private `WeakSet`. A caller that fabricates an
//        object with `{ nonce, proof }` shape — even with a
//        cryptographically-correct proof obtained out-of-band — fails the
//        brand check. The brand cannot be replicated by re-importing this
//        module from a different package graph because that re-import
//        produces a *different* `WeakSet` instance that the verifier in
//        THIS module instance does not consult.
//
// The mechanism is observable in tests: tests plant the env key, mint a
// real capability, and observe served outcomes; negative tests omit the
// env key, mutate the proof, fabricate a structurally-identical object
// without the brand, and observe refusal.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
const KEY_ENV_VAR = 'STRAYLIGHT_RUNTIME_DIXIE_KEY';
const HMAC_ALGORITHM = 'sha256';
const NONCE_BYTES = 32;
const HMAC_HEX_LEN = 64;
const ISSUED_CAPABILITIES = new WeakSet();
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
export function createDixieCapability() {
    const key = readKeyFromEnv();
    if (key === undefined) {
        throw new DixieCapabilityError('capability_unavailable: STRAYLIGHT_RUNTIME_DIXIE_KEY is not set');
    }
    const nonce = randomBytes(NONCE_BYTES).toString('hex');
    const proof = hmac(key, nonce);
    const cap = Object.freeze({ nonce, proof });
    ISSUED_CAPABILITIES.add(cap);
    return cap;
}
/**
 * Verify a candidate capability. Internal to the runtime seam — exported
 * here for the runtime barrel and the in-repo test suite, NOT re-exported
 * through the package's `./runtime/recall-intake` public surface.
 */
export function verifyDixieCapability(candidate) {
    if (typeof candidate !== 'object' ||
        candidate === null ||
        !ISSUED_CAPABILITIES.has(candidate)) {
        return { ok: false, reason: 'capability_unrecognized' };
    }
    const cap = candidate;
    const key = readKeyFromEnv();
    if (key === undefined) {
        return { ok: false, reason: 'capability_unavailable' };
    }
    if (typeof cap.nonce !== 'string' || cap.nonce.length === 0) {
        return { ok: false, reason: 'capability_unrecognized' };
    }
    if (typeof cap.proof !== 'string' || cap.proof.length !== HMAC_HEX_LEN) {
        return { ok: false, reason: 'proof_invalid' };
    }
    const expected = hmac(key, cap.nonce);
    let expectedBuf;
    let actualBuf;
    try {
        expectedBuf = Buffer.from(expected, 'hex');
        actualBuf = Buffer.from(cap.proof, 'hex');
    }
    catch {
        return { ok: false, reason: 'proof_invalid' };
    }
    if (expectedBuf.length !== actualBuf.length ||
        expectedBuf.length === 0 ||
        !timingSafeEqual(expectedBuf, actualBuf)) {
        return { ok: false, reason: 'proof_invalid' };
    }
    return { ok: true };
}
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
export class DixieCapabilityError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DixieCapabilityError';
    }
}
function readKeyFromEnv() {
    const raw = process.env[KEY_ENV_VAR];
    if (typeof raw !== 'string' || raw.length === 0)
        return undefined;
    return raw;
}
function hmac(key, message) {
    return createHmac(HMAC_ALGORITHM, key).update(message).digest('hex');
}
