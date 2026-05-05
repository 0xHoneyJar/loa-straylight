# Hounfour schema extraction — PR review checklist

> Status: Phase 9. **Pre-extraction handoff packet, in `loa-straylight`
> only.** This checklist is a companion to
> [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md).
> It is intended to be reused (verbatim or with light edits) on the
> future `loa-hounfour` PR-A *and* on the `loa-straylight` PR-B that
> consumes Hounfour. **Filing the PR is not part of Phase 9.** Nothing
> in this checklist edits any sibling repo, adds a Hounfour
> dependency, or changes Phase 0–8 runtime behavior.

The boxes below are intentionally empty. Each item maps to a
constraint in the
[Phase 7 extraction plan](../schema-candidates/hounfour-extraction-plan.md)
or to an explicit non-goal from the issue handoff. Items grouped
under PR-A apply to the future `loa-hounfour` PR; items grouped
under PR-B apply to the future `loa-straylight` PR that adopts
Hounfour. Reviewers may use either set independently.

## PR-A (future `loa-hounfour`)

### Schema files

- [ ] One TypeBox (or equivalent) declaration exists for every type
  in [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  §"Schema candidates to extract".
- [ ] Every schema declaration uses the id prefix
  `straylight.<type>.v0`.
- [ ] Field-name set, optional/required discipline, and field-type
  annotations match the wedge's current TypeScript interface in
  [`src/straylight/types.ts`](../../src/straylight/types.ts) for
  every type. Per §5.1 H1.
- [ ] Every enum is *closed* — unknown values must fail validation.
  Per §5.1 H2.
- [ ] No enum member has been renamed or removed relative to the
  wedge. Per §5.1 H2.
- [ ] No new required field has been added to a type that already
  has Phase 6 fixtures. Per §5.1 H1, §5.3 H16.
- [ ] `straylight.signature_type.v0` includes the `dev_signature`
  enum member but does **not** require it. Per §5.1 H6.
- [ ] `ID`, `Hash`, and `ISO8601` are *not* promoted to Hounfour
  types. They remain language-level aliases in `loa-straylight`.
  Per §2.12.

### JSON Schema generation

- [ ] A reproducible JSON Schema generator exists (TypeBox
  `Type.Strict()` / `zod-to-json-schema` / equivalent).
- [ ] One `straylight.<type>.v0.json` document is published per
  schema. List enumerated in
  [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  §"Proposed generated JSON Schema outputs".
- [ ] All published schemas use the same JSON Schema dialect
  (Draft 2020-12 recommended; PR-A's choice if pinned uniformly).
- [ ] Every `Hash` field uses
  `pattern: ^sha256:[0-9a-f]+$` (or equivalent regex). Per §5.1 H4.
- [ ] Every `ISO8601` field uses `format: date-time`. Per §5.1 H5.
- [ ] Generation is reproducible: regenerating from the same
  TypeBox sources produces byte-identical JSON Schema output.
- [ ] Generated schemas are committed alongside their TypeBox
  sources (no implicit build step required to read them).

### Conformance tests

- [ ] All 12 conformance vectors from
  [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
  ship in Hounfour's test inputs (verbatim, or imported as a
  fixture package).
- [ ] For every `class_validation` vector, Hounfour's validator
  agrees with the vector's `expected_valid` outcome.
- [ ] For every `audit_validation`, `keyring_validation`, and
  `policy_validation` vector, Hounfour's behavior is **read-only**:
  the validator parses shape only and does **not** recompute
  audit hashes, evaluate signer competence, or produce policy
  decisions.
- [ ] Class-validation vectors are rejected if they smuggle a
  top-level `decision` or `policy_decision`. (Test pin: the
  forbidden-fields invariant from
  [`docs/schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
  §"Why a separate `validation_layer` field".)
- [ ] Policy-validation vectors are rejected if they smuggle
  `assertion_id`, `body`, `body_hash`, `assertion_class`,
  `provenance`, `pack_hash`, `receipt_hash`, or
  `audit_hash` as top-level fields.
- [ ] Both keyring vectors carry `signature_self_consistent: true`
  and the validator does **not** treat that as competence — the
  competence outcome comes from `signer_competence_result.allowed`,
  not from the envelope shape.
- [ ] The audit-tamper vector is rejected for an audit-chain reason
  (chain / hash / recompute / integrity), **not** for a class-shape
  reason.

### Fixture import

- [ ] Every JSON file in
  [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
  validates without modification against the corresponding
  Hounfour schema. List enumerated in §5.3 H12.
- [ ] Wedge-emitted artifacts (from `npm run schema:candidates` or
  its post-extraction successor) validate against Hounfour with no
  errors. Per §5.3 H13.
- [ ] Fixture import does **not** require any wedge code. Hounfour's
  test runner reads the JSON directly and validates against
  Hounfour's schemas.

### No runtime enforcement added

- [ ] No code in Hounfour produces a `PolicyDecision`. The type is
  exported so cross-repo readers can deserialize one; the engine
  that *makes* decisions stays in `loa-straylight` permanently.
  **This is a load-bearing non-goal.** Per §5.2 H8.
- [ ] No code in Hounfour applies an `EstateTransition`. Per §5.2 H10.
- [ ] No code in Hounfour computes `previous_audit_hash` /
  `audit_hash`, appends to an audit log, or verifies an audit
  chain. Per §5.2 H9.
- [ ] No code in Hounfour evaluates per-environment-frame rules,
  `dispositionFor`, `privacyDispositionForFrame`, or any
  per-frame `needs_review` lift.
- [ ] No code in Hounfour runs a recall executor. The
  `RecallRequest`, `RecallPack`, and `RecallReceipt` *types* are
  exported; recall execution stays wedge-owned.

### No signer competence runtime decisions

- [ ] No code in Hounfour exports `evaluateCompetence`,
  `resolveSigner`, `isSignerCurrentlyValid`, or any equivalent
  symbol. Per §5.2 H7.
- [ ] No code in Hounfour evaluates `quorum`, `timelock`, or
  `requires_human_review` constraints from a `SignerCompetenceRule`.
- [ ] No code in Hounfour resolves `forbid_signer_roles` or
  `required_signer_roles` against a candidate signer set.
- [ ] No code in Hounfour exports `verifyDevSignature`,
  `verifyEnvelopeSelfConsistency`, or any HMAC / ed25519 /
  secp256k1 verifier. Per §5.2 H7.
- [ ] **`dev_signature` is not promoted to a production signature
  type.** The enum member is shape-only; production signature
  material (ed25519 / secp256k1 / real HMAC over real key
  material) is reserved future work in `loa-straylight`, not
  Hounfour. Per §2.3.

### No storage or recall execution ownership

- [ ] No `StorageAdapter`, `InMemoryStorage`, `JsonlStorage`,
  `loadBundle`, or `saveBundle` ships from Hounfour. Storage is
  wedge-owned permanently. Per §2.1.
- [ ] No `EstateStore` or equivalent façade ships from Hounfour.
- [ ] No `executeRecall` or equivalent ships from Hounfour.
- [ ] No persistence backend (sqlite, leveldb, postgres, redis,
  etc.) is added.
- [ ] No production database integration is added.
- [ ] No onchain anchor adapter is added. Onchain publishing is
  reserved future work in `loa-straylight`. Per §2.11.
- [ ] No Discord, Freeside, Finn, Dixie, or external integration
  ships. v0 is schema only.

### No reverse imports

- [ ] No code in Hounfour imports from `@loa/straylight`,
  the `loa-straylight` repo, or any sibling repo that depends on
  the wedge. Per §5.2 H11.
- [ ] Schemas are upstream of behavior; the dependency arrow points
  `loa-straylight → loa-hounfour` only.

### Docs update

- [ ] Hounfour README explains that v0 schemas are
  shape-only, that the wedge owns runtime authority, and that
  Hounfour MUST NOT produce a `PolicyDecision`.
- [ ] Hounfour README links back to the `loa-straylight`
  class-vs-policy boundary documented at
  [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md).
- [ ] Hounfour README links to the conformance-vector pack
  documented at
  [`docs/schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md).
- [ ] Hounfour CHANGELOG carries an explicit `0.1.0` entry that
  states "shape only; no runtime; consumers must not infer
  authority from validation success."

### Package export surface

- [ ] Hounfour publishes a single public entrypoint (`index.ts` or
  equivalent) that re-exports every type listed in
  [§"Schema candidates to extract"](./hounfour-schema-extraction-issue.md#schema-candidates-to-extract).
- [ ] No internal symbol leaks through the public entrypoint.
- [ ] The package's `exports` map (or equivalent) is narrow enough
  that `loa-straylight` can do per-type re-exports without pulling
  in optional reference validators.
- [ ] Schema id strings (`straylight.<type>.v0`) are exported as
  named constants alongside the schemas, so cross-repo readers
  can match on id without reconstructing strings.

### Backwards compatibility

- [ ] Initial published version is `0.x.0`. No v1 commitment yet.
- [ ] Adding a new optional field is allowed without a version
  bump.
- [ ] Adding a new required field, removing a field, or renaming a
  field is a *breaking* change; PR-B (in `loa-straylight`) MUST
  be updated in the same wave.
- [ ] Adding a new enum member is allowed without a version bump.
- [ ] Removing or renaming an enum member is a breaking change.

## PR-B (future `loa-straylight`, after PR-A merges)

### Schema files (re-export only)

- [ ] `src/straylight/types.ts` declarations for `move_to_hounfour`
  candidates are replaced with `export * from '@loa/hounfour'`
  (or per-type `export type { Actor } from '@loa/hounfour';` etc.).
- [ ] `ID`, `Hash`, and `ISO8601` aliases stay in
  `src/straylight/types.ts`. Per §2.12.
- [ ] Every wedge-side runtime symbol stays exactly where it is.
  `policy.ts`, `keyring.ts`, `recall.ts`, `audit.ts`, `estate.ts`,
  `commitment.ts`, `validators/class-validator.ts`,
  `signatures.ts`, and the storage adapters do not move.

### JSON Schema generation (in PR-B)

- [ ] PR-B does **not** add a TypeBox or JSON Schema generator to
  `loa-straylight`. Generation stays in Hounfour.
- [ ] PR-B does not add a build step that generates schemas
  locally — the wedge consumes Hounfour-published schemas.

### Conformance tests (in PR-B)

- [ ] After the swap, every test currently green under `npm test`
  stays green. The full list is enumerated below under
  [§"Test list pinned by H17"](#test-list-pinned-by-h17).
- [ ] `npm run typecheck` passes with no new errors.
- [ ] `npm run demo:recall` produces the same observable output as
  before the swap.
- [ ] `npm run demo:recall:json` produces the same JSON output as
  before the swap.
- [ ] `npm run schema:candidates` produces byte-identical fixtures
  as before the swap (or its post-extraction successor produces
  fixtures that validate against Hounfour without modification).
- [ ] `npm run hounfour:conformance` produces byte-identical
  vectors as before the swap.
- [ ] `npm run hounfour:handoff` (Phase 9 helper) still resolves
  the handoff document paths.

### Fixture import (in PR-B)

- [ ] [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
  is replaced with a thin pointer to Hounfour's vectors *or* deleted
  if the conformance is fully delegated. Either way, the README
  transitions to a "post-extraction" status.
- [ ] [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
  is similarly delegated or pointed.
- [ ] [`fixtures/actor.json`](../../fixtures/actor.json),
  [`fixtures/estate.json`](../../fixtures/estate.json), and
  [`fixtures/keyring.json`](../../fixtures/keyring.json) (the
  fixed runtime fixtures) continue to validate against Hounfour
  schemas.

### No runtime enforcement added (in PR-B)

- [ ] PR-B adds no new runtime behavior. It is a re-export and
  documentation update only.
- [ ] `EstateStore` is unchanged. The transition matrix is
  unchanged.
- [ ] `executeRecall` is unchanged. The disposition rules are
  unchanged.
- [ ] `AuditLog.append` and `AuditLog.verifyChain` are unchanged.
  The chain construction is unchanged.

### No signer competence runtime decisions (in PR-B)

- [ ] `evaluateCompetence` is unchanged.
- [ ] `resolveSigner` is unchanged.
- [ ] `isSignerCurrentlyValid` is unchanged.
- [ ] The rule-matching specificity heuristic is unchanged.
- [ ] Quorum / timelock / human-review resolution is unchanged.
- [ ] `verifyDevSignature` and `verifyEnvelopeSelfConsistency` are
  unchanged.
- [ ] `dev_signature` is still development-only; production
  signature material is still reserved future work in
  `loa-straylight`, not Hounfour.

### No storage or recall execution ownership (in PR-B)

- [ ] No production database integration is added in PR-B.
- [ ] No onchain anchor adapter is added in PR-B.
- [ ] No Discord / Freeside / Finn / Dixie integration is added in
  PR-B.
- [ ] No new `StorageAdapter` is added in PR-B.

### Docs update (in PR-B)

- [ ] [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)
  §6.2.2 / §"Future integration notes — loa-hounfour" / Phase 6
  note is updated to reflect Hounfour as the new source of truth.
- [ ] [`docs/schema-candidates/README.md`](../schema-candidates/README.md)
  is updated to a "post-extraction" status — or the directory is
  retired entirely.
- [ ] [`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
  §7 (stability and change discipline) is rewritten to reflect that
  additive changes now flow through Hounfour.
- [ ] [`docs/handoffs/hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  and [`docs/handoffs/hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  are marked as "consumed" or moved to an archive.
- [ ] [`README.md`](../../README.md) is updated to reflect Phase 9
  → post-extraction.

### Package export surface (in PR-B)

- [ ] [`src/straylight/index.ts`](../../src/straylight/index.ts) stays
  the only public entrypoint of `loa-straylight`.
- [ ] All wedge-side runtime symbols are still exported from the
  barrel.
- [ ] Type re-exports from `@loa/hounfour` are visible through the
  same barrel (so cross-repo consumers continue to see one
  surface).

### Backwards compatibility (in PR-B)

- [ ] `package.json` adds `@loa/hounfour` (or equivalent) as a
  `dependencies` entry, pinned to the version that satisfied
  PR-A's structural / non-shipment / consumability gates.
- [ ] No major-version bump on `loa-straylight` is required if
  PR-A is purely additive. If PR-A removed or renamed a field,
  PR-B must coordinate the corresponding wedge change in the same
  PR.

### Test list pinned by H17

These tests must stay green after the swap. Adding tests is fine;
removing or skipping any is not.

- [ ] [`tests/audit-and-receipt.test.ts`](../../tests/audit-and-receipt.test.ts)
- [ ] [`tests/class-vs-policy-validation.test.ts`](../../tests/class-vs-policy-validation.test.ts)
- [ ] [`tests/demo-flow.test.ts`](../../tests/demo-flow.test.ts)
- [ ] [`tests/forget-flow.test.ts`](../../tests/forget-flow.test.ts)
- [ ] [`tests/hounfour-conformance.test.ts`](../../tests/hounfour-conformance.test.ts)
- [ ] [`tests/hounfour-handoff.test.ts`](../../tests/hounfour-handoff.test.ts)
- [ ] [`tests/jsonl-durability.test.ts`](../../tests/jsonl-durability.test.ts)
- [ ] [`tests/phase-4-demo.test.ts`](../../tests/phase-4-demo.test.ts)
- [ ] [`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts)
- [ ] [`tests/policy-unavailable.test.ts`](../../tests/policy-unavailable.test.ts)
- [ ] [`tests/quorum-and-timelock.test.ts`](../../tests/quorum-and-timelock.test.ts)
- [ ] [`tests/recall-contested-marking.test.ts`](../../tests/recall-contested-marking.test.ts)
- [ ] [`tests/recall-exclusion.test.ts`](../../tests/recall-exclusion.test.ts)
- [ ] [`tests/schema-candidates.test.ts`](../../tests/schema-candidates.test.ts)
- [ ] [`tests/signer-fail-closed.test.ts`](../../tests/signer-fail-closed.test.ts)
- [ ] [`tests/storage-conformance.test.ts`](../../tests/storage-conformance.test.ts)
- [ ] [`tests/transition-receipts.test.ts`](../../tests/transition-receipts.test.ts)

## Review checklist (cross-cutting)

For reviewers picking up either PR — quick read-through to confirm
the load-bearing non-goals haven't been quietly relaxed.

- [ ] Did this PR introduce a function in Hounfour that *produces*
  a `PolicyDecision`? **It must not.**
- [ ] Did this PR introduce a runtime evaluator (`evaluateCompetence`,
  `dispositionFor`, `policyForX`, `verifyChain`, `executeRecall`,
  `EstateStore`, `verifyDevSignature`,
  `verifyEnvelopeSelfConsistency`) in Hounfour? **It must not.**
- [ ] Did this PR add a new required field to a type that already
  has Phase 6 fixtures? **It must not** (without a coordinated
  wedge change).
- [ ] Did this PR rename or remove an enum member? **It must not.**
- [ ] Did this PR weaken the `Hash` pattern, the `ISO8601`
  format, or any field's optional/required discipline? **It must
  not.**
- [ ] Did this PR introduce a Hounfour import from `@loa/straylight`,
  the wedge, or any sibling repo? **It must not.**
- [ ] Did this PR claim that Straylight integration is complete?
  **It must not.** This work is the schema move; integration with
  Finn / Dixie / Freeside / onchain remains reserved future work.
- [ ] Did this PR add a storage backend or onchain anchor in
  Hounfour? **It must not.**
- [ ] Did this PR claim `dev_signature` is production-ready? **It
  must not.**
- [ ] Did this PR collapse class validation and policy validation
  into one validator? **It must not** (see the four "no-go"
  conflations in
  [`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)).
- [ ] Did this PR change Phase 0–8 wedge runtime semantics? **It
  must not** (PR-B is allowed to swap declarations for re-exports;
  it is not allowed to change runtime behavior).
