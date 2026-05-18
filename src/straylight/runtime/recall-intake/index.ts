// Phase 26B — runtime recall-intake barrel
// (`@loa/straylight/runtime/recall-intake`).
//
// @experimental — pre-Finn, Dixie-only. Authorized by ADR-026A §"Decision"
// §2; allowlist pinned by §3. Root `@loa/straylight` and
// `@loa/straylight/host` MUST remain `"types"`-only per ADR-024G + ADR-026A
// §5; widening either of those is OUT OF SCOPE for Phase 26B and requires
// its own future ADR.
//
// Migration path: when Finn ships and ADR-022E gate #9 fires, a future
// ADR (provisionally ADR-026B or successor) MUST migrate runtime
// enforcement to Finn, deprecate this subpath with a documented
// deprecation window, retire it in a clean package-surface change, and
// restore Straylight to its full type-only posture (ADR-026A §"Decision"
// §8).
//
// The marker tokens (`@experimental`, `pre-Finn`, `Dixie-only`, and
// gate-#9 / migration-to-Finn language) are repeated on each exported
// handler and helper so they survive `tsc` emission and reach consumers
// via go-to-definition regardless of which symbol the consumer reaches
// for first. ADR-026A §"Decision" §10.g asserts marker-token presence
// in the emitted `.d.ts` for each exported runtime handler and helper.
//
// Allowlist (ADR-026A §"Decision" §3):
//   * `handleRecallIntake` — required; the one MVP runtime entrypoint.
//   * `createDixieCapability` + `DixieCapabilityError` — the concrete
//     non-Dixie refusal mechanism per §"Decision" §7.
//   * `createInMemoryRecallIntakeDeps` — NOT exported. The implementation
//     does not need it; tests build deps inline.
//   * `executeRecall`, `EstateStore`, `AuditLog`, `JsonlStorage`,
//     `dispositionFor`, `verifyChain`, `computeCommitmentRoot`,
//     `devSign`, `devSignatureFor`, `validateCandidateAssertion`,
//     `validateRecallRequest`, `evaluateCompetence`, `InMemoryStorage`,
//     `loadBundle`, `saveBundle` — NOT exported.

export { handleRecallIntake } from './handle-recall-intake.js';

export {
  createDixieCapability,
  DixieCapabilityError,
} from './dixie-capability.js';

export type { DixieCapability } from './dixie-capability.js';
