# Straylight Recall Wedge — package boundary

> Status: Phase 5 (boundary frozen) + Phase 6 (schema-extraction prep
> staged). Local-only, in-repo. **Not** cross-repo integration. This
> document describes what is *intended to be* stable so future
> integrations can be written against a clean seam, and what is
> *internal* and may change at any commit without notice. Phase 6 adds
> a pre-extraction inventory under `docs/schema-candidates/` and JSON
> shape examples under `fixtures/schema-candidates/` — see the [Phase 6
> note](#phase-6--schema-extraction-prep) below.

The wedge is a single TypeScript package (`@loa/straylight`, package-private,
not yet published). Phase 5 hardens its public surface so downstream
projects (loa-hounfour, loa-finn, loa-dixie, loa-freeside) can plan their
integration paths without being coupled to internal layout. None of those
integrations exist yet — the boundary is reserved, not occupied.

## The single import path

Stable consumers MUST import only from:

```ts
import { /* … */ } from '@loa/straylight';
// or, in-repo, from the package entrypoint:
import { /* … */ } from 'src/straylight/index.js';
```

Anything not re-exported by `src/straylight/index.ts` is internal. Importing
from a file under `src/straylight/<module>.ts` directly is unsupported and
will break across phases without notice.

## Stable public API (Phase 5)

`src/straylight/index.ts` re-exports the symbols below, organized into the
sections numbered there:

### 1. Types (`types.ts`)

All primitive type aliases and interfaces:

| Group | Symbols |
|---|---|
| Identity | `Actor`, `ActorType`, `ActorStatus`, `ActorEstate`, `EstateStatus` |
| Assertions | `Assertion`, `AssertionClass`, `AssertionStatus`, `CandidateAssertion`, `PrivacyScope`, `RiskLevel`, `ProvenanceRef`, `ProvenanceSourceType` |
| Signatures | `SignatureEnvelope`, `SignatureType`, `SignerType` |
| Keyring | `Keyring`, `SignerEntry`, `SignerStatus`, `SignerCompetenceRule`, `SignerCompetenceResult` |
| Validation | `ValidationError`, `ClassValidationResult` |
| Policy | `PolicyDecision`, `PolicyDecisionOutcome` |
| Transitions | `EstateTransition`, `TransitionReceipt`, `TransitionReceiptKind` |
| Challenge | `Challenge`, `ChallengeType`, `ChallengeRequestedEffect`, `Revocation`, `ForgetRecord` |
| Recall | `RecallRequest`, `RecallPack`, `RecallReceipt`, `RecallItem`, `RecallUseInstruction`, `EnvironmentFrame`, `ReceiptDetailLevel`, `RedactionSummary`, `ExclusionSummary` |
| Audit | `AuditEvent`, `AuditEventType` |
| Commitment | `CommitmentRoot` |
| Primitives | `ID`, `Hash`, `ISO8601` |

Types are descriptive, not load-bearing — they have no runtime behavior. A
type can be widened in a minor revision; narrowing is a breaking change.

### 2. IDs + canonical helpers (`ids.ts`, `canonical.ts`)

```
canonicalize(value)       deterministic string serializer (JCS-shaped, MVP)
sha256(value)             hash → "sha256:<hex>"
shortHash(hash, n?)       prefix slice for content-addressed IDs
contentId(payload, opts)  prefixed content-addressed ID
payloadHash(payload)      sha256 over canonicalized payload
makeIdSource(seed)        monotonic ID generator for a single run/test
```

Type re-exports: `IdOptions`.

The canonical encoding is MVP-grade (sufficient for in-repo determinism,
**not** RFC 8785 conformant). Production replacement of `canonicalize` is
expected before any integration writes commitments to a public anchor.

### 3. Signatures (`signatures.ts`) — dev-signature only

```
devSign(params)                  produce a SignatureEnvelope
devSignatureFor(key_ref, hash)   the raw HMAC-SHA256 string
verifyDevSignature(env, ...)     verify against a known payload
verifyEnvelopeSelfConsistency(e) verify the envelope is internally consistent
assertionSignedPayload(...)      canonical assertion-signing payload
recallSignedPayload(...)         canonical recall-signing payload
DEV_SIGNATURE_PREFIX             the "dev:" prefix tag
```

Type re-exports: `DevSignParams`, `VerifyResult`.

`dev_signature` is HMAC-SHA256 keyed by `key_ref`. It is clearly labeled in
code as **development-only**. Production integration MUST replace this with
real signature material (ed25519 / secp256k1 / HMAC over real key material)
before signing anything that anchors to a public commitment or that grants
real-world authority.

### 4. Class validation (`validators/class-validator.ts`)

```
validateCandidateAssertion(c)    "is this structurally legible?"
validateRecallRequest(r)         "is this recall request structurally legible?"
```

Class validators never make policy decisions. They only check shape per §9.1.

### 5. Keyring + competence (`keyring.ts`)

```
resolveSigner(keyring, signer_id)
isSignerCurrentlyValid(keyring, entry, now)
evaluateCompetence(keyring, query)
listActiveSignerRoles(keyring, now)
```

Type re-exports: `CompetenceQuery`.

### 6. Policy (`policy.ts`)

```
policyForAdmitAssertion(input)
policyForTransition(input)
policyForRecallRequest(input)
dispositionFor(assertion, request)
PolicyEngineError                      thrown on internal engine corruption
DEFAULT_POLICY_ID, DEFAULT_POLICY_VERSION
```

Type re-exports: `AdmitPolicyInput`, `TransitionPolicyInput`,
`RecallPolicyInput`, `RecallDisposition`.

Policy is fail-closed by construction: any uncaught engine error becomes a
`deny` with `policy_engine_error:<code>`; a missing rule becomes a `deny`
with `policy_unavailable_for_transition`.

### 7. Audit chain (`audit.ts`)

```
AuditLog                  append + verifyChain over a StorageAdapter
```

Type re-exports: `AuditWriteInput`.

### 8. Estate store + transition application (`estate.ts`)

```
EstateStore                            top-level façade
EstateStore.fromStorage(storage, id)   cold reload
.admit(candidate, now)                 → AdmitOutcome
.challenge(input)                      → ChallengeOutcome
.revoke(input)                         → RevokeOutcome
.forget(input)                         → ForgetOutcome
.seedAssertion(assertion)              fixture-only bootstrap
.listAssertions(), .getAssertion(id)
.listTransitions(), .listTransitionReceipts()
.getActor(), .getEstate(), .getKeyring()
.auditLog                              the AuditLog instance
.storage                               the underlying StorageAdapter
```

Type re-exports: `EstateStoreInit`, `AdmitOutcome`, `ChallengeOutcome`,
`RevokeOutcome`, `ForgetOutcome`.

Every transition emits a `TransitionReceipt` (kind `admission`, `challenge`,
`revocation`, `forget`, or `denied`) and a chained audit event. Bypassing
the `EstateStore` (e.g. by calling `storage.upsertAssertion(...)` directly)
is **not supported** — it skips policy, the receipt, and the audit chain.

### 9. Recall (`recall.ts`)

```
executeRecall(store, request, now)     → RecallOutcome
```

Type re-exports: `RecallOutcome`.

`executeRecall` runs class validation → policy → candidate retrieval →
disposition → pack assembly → receipt, in that order, per §11.6. Retrievers
(vector, keyword, graph) plug in *behind* the prefilter; they never run
above it.

### 10. Commitment helpers (`commitment.ts`)

```
computeCommitmentRoot(input)
commitmentForRecallReceipt(receipt, signer, created_at)
```

Type re-exports: `CommitmentInput`.

Commitment roots are **local-only** in the wedge: they compute a
deterministic root over references and hashes, but do not publish anywhere.
Onchain anchoring is reserved future work; the function shape is the seam.

### 11. Storage adapters (`storage/`)

```
InMemoryStorage          default; no filesystem touch
JsonlStorage             append-only .jsonl per table
loadBundle(s, estate_id) read actor + estate + keyring
saveBundle(s, bundle)    write actor + estate + keyring
```

Type re-exports: `StorageAdapter`, `EstateBundle`, `JsonlStorageOptions`.

The `StorageAdapter` interface is the swap-in seam for a future Postgres /
real WAL backend. Any adapter MUST satisfy `tests/storage-conformance.test.ts`.

## Internal modules — DO NOT IMPORT

Anything not listed above is internal and may change without notice.
Specifically:

- File-level helpers in `policy.ts`, `keyring.ts`, `recall.ts` not exported
  via `index.ts` (e.g. `findCompetenceRule`, `redactReceipt`,
  `useInstructionForMark`, `summaryFor`, `privacyDispositionForFrame`).
- Internal builders in `estate.ts` (`buildTransition`, `persistReceipt`).
- Constant tables in `validators/class-validator.ts` (`ASSERTION_CLASSES`,
  `PROVENANCE_SOURCE_TYPES`, `SIGNATURE_TYPES`, etc.).
- The internal `stringify` in `canonical.ts`.

If a downstream integration needs one of those, the path forward is to
promote it through `index.ts` in a focused PR — not to deep-import.

## Future integration notes (reserved, NOT IMPLEMENTED)

This is forward-planning only. None of these integrations exist in this
repo. The wedge is local, deterministic, in-process, and explicitly does
not reach into any other system.

### loa-hounfour — schema extraction

Hounfour is intended to derive its schema artifacts from the wedge's
*types*, not its runtime. Hounfour will read `types.ts` (re-exported via
`index.ts`) to mint canonical class names, status enums, transition kinds,
environment frames, and provenance source types. The contract:

- Hounfour MUST consume only the type re-exports from `index.ts`.
- Hounfour MUST NOT import behavior (functions, classes) from the wedge.
- New `AssertionClass` / `AssertionStatus` / `EnvironmentFrame` values are
  additive minor changes; removals are breaking.

### loa-finn — runtime enforcement

Finn is intended to be a runtime gate (per-call admission, per-tool recall
gating). Finn will hold an `EstateStore` per actor and call
`executeRecall(store, request, now)` immediately before any tool action,
treating the resulting `RecallPack` (with its `included` / `marked` /
`redacted` discipline) as authoritative. The contract:

- Finn MUST treat the `RecallPack`'s `use_instruction` as binding —
  `marked` / `redacted` items never become tool inputs.
- Finn MUST NOT mutate the estate by writing to `storage.*` directly; it
  goes through `EstateStore.admit/challenge/revoke/forget`.
- Finn's policy hooks (per-environment-frame, per-risk overrides) plug in
  via additional `SignerCompetenceRule` rows in the keyring — not by
  patching `policy.ts`.

### loa-dixie — recall / BFF surface

Dixie is intended to expose a developer-facing recall surface (HTTP / RPC,
operator console, request-trace UI). Dixie will hold the canonical
`StorageAdapter` (Postgres in production) and call `executeRecall` on
behalf of authenticated callers. The contract:

- Dixie MUST swap `JsonlStorage` for a Postgres-backed `StorageAdapter`
  that satisfies `tests/storage-conformance.test.ts`.
- The `RecallReceipt` returned by `executeRecall` is the audit artifact
  Dixie persists for the request — Dixie does not re-derive a separate one.
- Dixie's `minimal` / `standard` / `debug` detail-level setting maps
  directly to `RecallRequest.include_receipt_detail`.

### loa-freeside — community / bot / app surface

Freeside is intended to host bot-shaped consumers (Discord / Telegram /
forum). Freeside is the *worst* trust boundary: messages from a public chat
are tool output, not authority. The contract:

- Freeside MUST NOT pass user-controlled text into `admit()` as a `claim`
  / `identity` / `permission` / `commitment` — those classes are
  reviewer-gated by the default keyring and a Freeside event is a
  `runtime_observation` (or `discord_event` / `telegram_event`) at best.
- Freeside MUST submit recall requests with `environment_frame:
  public_discord` (or `public_telegram`); the wedge's policy raises high /
  critical-risk recalls to `needs_review` in those frames.
- Freeside MUST treat any `RecallPack`'s `marked` items as do-not-quote.

## Phase 6 — schema extraction prep

Phase 6 stages the candidates that will eventually be extracted into
`loa-hounfour` *without performing the extraction*. It does not change
the public API surface above, does not introduce a Hounfour dependency,
does not write to any sibling repo, and does not add a generic
schema-generation pipeline. It only:

- pins which Straylight types are extraction candidates and what stays
  in the wedge
  ([`docs/schema-candidates/hounfour-schema-extraction-prep.md`](../schema-candidates/hounfour-schema-extraction-prep.md))
- pins the class-validation vs policy-validation boundary in writing
  ([`docs/schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md))
- ships representative current-shape JSON examples under
  [`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
- ships a deterministic helper at
  [`scripts/export-schema-candidates.ts`](../../scripts/export-schema-candidates.ts)
  (`npm run schema:candidates`) that re-emits those examples from the
  public API
- ships a conformance test
  ([`tests/schema-candidates.test.ts`](../../tests/schema-candidates.test.ts))
  that pins fixture parseability, required fields, public-API export
  presence, the class-vs-policy separation, and the absence of any
  cross-repo / framework-internal imports in Phase 6 sources

The fixtures are **not** canonical Hounfour schemas. They are local
examples of current object shape, useful as pre-extraction review
input. The actual schema move is reserved future work in
`loa-hounfour`; see
[`docs/schema-candidates/README.md`](../schema-candidates/README.md)
for what Phase 6 is and is not.

## Versioning

The wedge does not yet carry a published semver. Treat the public surface
as **0.x** — minor breakages are possible at any phase boundary. Phase 5
freezes the *shape*; future phases (real signatures, real storage, real
retrieval) will *replace* implementations, not the shape, where possible.

When the wedge is extracted from this repo into its own published package,
the surface above is the API that ships. Anything else gets the
`internal/` prefix and is excluded from the package's `exports` field.
