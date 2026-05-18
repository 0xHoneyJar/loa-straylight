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

> **Phase 24H cross-reference.** The wedge stable surface (sections 1–11
> below) is **not** the only named public entrypoint of the package after
> Phase 24H. A second, distinct, type-only public subpath
> (`@loa/straylight/host`) is documented in
> [§"Stable public API — `./host` subpath (Phase 24H, type-only)"](#stable-public-api--host-subpath-phase-24h-type-only)
> below. The wedge↔host dependency is strictly one-way: the host
> scaffold may import wedge primitives; the wedge public API does not
> import the host scaffold. Sections 1–11 are byte-identical to their
> pre-Phase-24H state.

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

## Stable public API — `./host` subpath (Phase 24H, type-only)

Phase 24H widens the package's documented public surface by adding a
second, distinct named subpath. The package's `exports` map now has
exactly two keys, each with exactly one `"types"` condition:

```json
{
  ".": {
    "types": "./dist-types/src/straylight/index.d.ts"
  },
  "./host": {
    "types": "./dist-types/src/straylight/host/index.d.ts"
  }
}
```

The `./host` subpath documents the local host barrel at
`src/straylight/host/index.ts` as part of the **stable, named public
surface** of the package — type-only, declaration-only, with no runtime
import path in Phase 24H. The companion decision-lock is
[`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md);
the companion handoff is
[`../handoffs/phase-24h-host-package-subpath-implementation.md`](../handoffs/phase-24h-host-package-subpath-implementation.md).

### Six handler exports

The `./host` subpath re-exports six recall-host handlers (per the
Phase 24B / 24C / 24D host scaffold contract):

```
handleRecallIntake         (Surface 1: intake / recall request)
handleReceiptRetrieval     (Surface 2: receipt retrieval)
handleExclusionDisplay     (Surface 3: excluded / redacted / marked
                            display)
handleProvenanceWalk       (Surface 4: provenance inspection)
handleAuditChainLookup     (Surface 5: audit-chain lookup)
handleEstateSummary        (Surface 6: estate summary / by-privacy-scope)
```

Each handler is a pure function over the wedge's stable public API. The
host never produces `RecallPack` / `RecallReceipt` / `dispositionFor` /
`verifyChain` / commitment-root values; every decision flows back to
wedge primitives surfaced through `src/straylight/index.ts`.

### Helper / type exports

The `./host` subpath also re-exports:

```
checkSameTenant                (tenancy guard helper)
createInMemoryIntakeDenyLog    (in-memory intake-deny log constructor)
```

and the following type re-exports (declaration-only; no runtime
behavior):

```
TenantCheckResult, TenantResolver
IntakeDenyEntry, IntakeDenyLog
IntakeDeps
ReceiptDeps
ProvenanceDeps
AuditLookupDeps
EstateSummaryDeps
```

plus the host-local types re-exported from `src/straylight/host/types.ts`
via `export *`.

### Injected-dependency contract

Each handler accepts a **per-call dependency object** typed by its
`*Deps` interface. The handler:

- never imports `EstateStore` / `JsonlStorage` / `AuditLog` directly;
- never reaches outside its `Deps` argument for state;
- never produces output that the wedge has not already produced (no
  invention, no synthesis).

A future host runtime (e.g. `loa-dixie`) constructs the `Deps` objects
from its own `StorageAdapter` / `EstateStore` / `AuditLog` instances
and passes them per call. The `Deps` contract is the consumption
seam.

### Type-only package surface

`./host` is exposed under `"types"` only:

- A consumer with a tag-pinned git-source install can write
  `import type { ... } from '@loa/straylight/host'` and resolve the
  emitted `.d.ts` through the `exports` map.
- A consumer attempting `import { ... }` (value import),
  `await import('@loa/straylight/host')` (dynamic ESM runtime
  import), or `require('@loa/straylight/host')` (CJS) does **not**
  resolve and emits `ERR_PACKAGE_PATH_NOT_EXPORTED`. Phase 24H
  does not advertise a runtime surface for `./host`. The Phase
  24H type-only consumption test pins this failure mode without
  requiring `npm install` or network access.
- Declarations are emitted to `dist-types/src/straylight/host/index.d.ts`
  by `npm run build` (which invokes `tsc -p tsconfig.build.json`) **and
  committed** to the repository as the authoritative Phase 24H
  type-only package artifact. A tag-/release-pinned sibling repo
  resolves `@loa/straylight/host` against the committed `.d.ts`
  files without depending on `prepare` running at install time.
  `prepare` is kept as a development convenience that regenerates
  declarations from source on `npm install`; the committed artifact
  is authoritative. Future PRs MUST treat changes under
  `dist-types/` as generated-artifact diffs caused by source /
  type-surface changes; a `dist-types/` diff with no matching
  source diff is non-conforming.

A future phase (referred to as "Phase 24I or later" in ADR-024G) may
widen the `./host` subpath to a runtime surface (JS emission, `dist/`,
`"default"` / `"import"` condition). That widening is a strictly larger
public-surface change and must be reviewed under its own ADR.

### No runtime import path (Phase 24H)

The package has **no `"main"` field** after Phase 24H. The
`exports` map carries **no `"default"`, `"import"`, `"require"`,
`"node"`, `"node-addons"`, `"browser"`, `"deno"`, `"bun"`,
`"worker"`, `"react-native"`, `"electron"`, `"production"`,
`"development"`, `"module"`, or `"main"` condition**. There is
**no `dist/` directory** (only `dist-types/`).

A consumer that attempts a runtime / value import of either
`@loa/straylight` or `@loa/straylight/host` — for example,
`import { handleRecallIntake } from '@loa/straylight/host'`,
`await import('@loa/straylight/host')`, or
`require('@loa/straylight/host')` — **will fail to resolve, and
that failure is the intended, documented Phase 24H posture**, not
a defect. Consumers MUST use `import type`. Runtime support is a
future, separate widening (hypothetical Phase 24I or later) and
is not authorized by Phase 24H.

This is the load-bearing distinction between Phase 24H and any
future runtime-widening phase. The Phase 24H package-exports test
asserts that no runtime / value-import condition appears under
any `exports` entry — adding one is a Phase 24H violation. The
Phase 24H type-only consumption test exercises only
`import type` and never executes a runtime import.

### Supported consumer assumptions (Phase 24H)

The Phase 24H consumption contract is **narrow on purpose**. A
consumer outside this envelope will see resolution failures; those
failures are the intended posture, not defects.

- **TypeScript >= 5.4 is REQUIRED.** Pinned via `devDependencies`.
  The Phase 24H type-only consumption test asserts the range.
  Older TypeScript versions are unsupported.
- **Supported `moduleResolution` modes are exactly `"Bundler"`
  and `"NodeNext"`.** These two modes are exercised end-to-end
  by the consumption test. Older / default / non-export-aware
  resolver modes — including `"node"`, `"classic"`, `"node10"`,
  and `"node16"` — are **unsupported** for the `./host` subpath.
  The legacy node resolver does not honor the package's `exports`
  map and will fail to resolve `@loa/straylight/host`. The Phase
  24H type-only consumption test pins this failure under
  `moduleResolution: "node"` so a future widening that
  accidentally adds legacy-resolver support has to update both
  the test and this section.
- **`import type` only is REQUIRED; runtime/value imports are
  UNSUPPORTED and expected to fail.** A consumer attempting any
  of `import { ... } from '@loa/straylight/host'` (value import),
  `await import('@loa/straylight/host')` (dynamic ESM runtime
  import), or `require('@loa/straylight/host')` (CJS) — or the
  same patterns against the root subpath `@loa/straylight` —
  will fail to resolve with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
  See [§"No runtime import path (Phase 24H)"](#no-runtime-import-path-phase-24h)
  below. The Phase 24H type-only consumption test pins this
  failure mode for both subpaths under both dynamic ESM
  `import()` and CJS `require`.
- **Tag- / release-pinned git source** (or, in a future phase, a
  published release range). Workspace links, `main`-HEAD git
  dependencies, and commit-SHA pins against unpublished trees
  are **unsupported**. Because `dist-types/` is now committed,
  a tag-pinned consumer resolves declarations directly from the
  tagged tree without depending on `prepare` running at install
  time.

A future phase that needs to widen any of these four assumptions
must do so under its own ADR — the assumptions are part of the
Phase 24H contract.

### No source fallback under `exports`

The `exports` map points exclusively at the `.d.ts` files emitted to
`dist-types/`. There is **no `"default"` condition pointing at
`src/straylight/host/index.ts`** as a development fallback. Earlier
drafts considered such a fallback; ADR-024G rejects it for three
reasons:

1. it would widen the runtime surface;
2. it would leak TypeScript source into the package's advertised
   consumption path; and
3. it would couple consumers to the in-repo working-tree layout
   rather than the declaration output.

In-repo tests that need to exercise the type-only consumption path
build declarations first and consume them through a temp-fixture
symlink, never via a source-only fallback.

### One-way wedge↔host dependency invariant (automated)

The host scaffold under `src/straylight/host/` **may** import from the
wedge stable public API at `src/straylight/index.ts`. The wedge stable
public API at `src/straylight/index.ts` **must not** import from
`src/straylight/host/`. This invariant is **automated as of Phase
24H**, not deferred:

- enforced by the existing automated test at
  `tests/phase-24c-host-surface-shape.test.ts`, describe block
  `phase-24c host — wedge does not depend on host`. Two test cases
  assert:
  1. `src/straylight/index.ts does not import from ./host/`, and
  2. every existing wedge module source file under `src/straylight/`
     does not import from `./host/`.
- recorded in the Phase 24H package-exports test
  (`tests/phase-24h-package-exports.test.ts`) under describe block
  `Phase 24H — one-way wedge↔host dependency invariant is automated
  NOW (SKP-006)`, which validates the delegation pointer so any
  future test-file move is forced to update both the test and the
  prose here.
- documented as a load-bearing rule in ADR-024G §"Decision" rule §9.

A stronger import-graph tool (e.g. dependency-cruiser, madge) may be
added in a future phase. That stronger tool is **not** required for
Phase 24H; the invariant is automated now.

A future implementation phase that violates the invariant — for
example, by re-exporting the host barrel through the wedge stable
surface, or by introducing a wedge module that imports a host module
— is a non-conforming public-surface widening and must be refused at
review.

### Internal modules under `src/straylight/host/` — DO NOT IMPORT

Anything not listed in the six handlers, two helpers, or the type
re-exports above is **internal** and may change without notice. In
particular, importing from a file under `src/straylight/host/<module>.ts`
directly (e.g. `import { handleRecallIntake } from
'@loa/straylight/host/intake'`) is unsupported and will not resolve
through the `exports` map; only the barrel at
`@loa/straylight/host` is named public surface.

### Tag- / release-pinned consumption only

Phase 24H does **not** publish the package; `"private": true` is
preserved. Phase 24H does **not** create a release tag. A future
sibling-repo dependency on `@loa/straylight/host` MUST consume via:

- a tag-pinned git-source install (if Straylight remains
  `"private": true`), or
- a published release range (if Straylight adopts GitHub Packages
  under a separately reviewed posture decision).

A sibling-repo dependency via a commit-SHA pin against an unpublished
tree, a `main`-HEAD git dependency, or a workspace-path link to a
developer's local clone is **not** authorized.

## Runtime subpath — `./runtime/recall-intake` (Phase 26A-2 implementation, experimental, pre-Finn, Dixie-only)

> **Status: Phase 26B implementation of ADR-026A** (authorization-record
> drafted in Phase 26A-2). The subpath is **experimental**, **pre-Finn**,
> and **Dixie-only**. Root `.` and `./host` remain `"types"`-only. This
> section is added in the same diff as the `package.json` `exports` map
> entry per ADR-026A §"Decision" §6.d.

After Phase 26B, the package's `exports` map has exactly three keys:

```json
{
  ".": {
    "types": "./dist-types/src/straylight/index.d.ts"
  },
  "./host": {
    "types": "./dist-types/src/straylight/host/index.d.ts"
  },
  "./runtime/recall-intake": {
    "types":  "./dist-types/src/straylight/runtime/recall-intake/index.d.ts",
    "import": "./dist/src/straylight/runtime/recall-intake/index.js"
  }
}
```

Root `.` and `./host` MUST remain `{"types": "..."}`-only per ADR-024G
+ ADR-026A §"Decision" §5. Adding a runtime condition to either of
those is **out of scope** for Phase 26B and requires its own future
ADR.

### Why `"import"` and not `"default"` (ADR-026A §"Decision" §4)

The runtime subpath uses the `"import"` (ESM-only) condition rather
than `"default"` because:

- the package is `"type": "module"`;
- `"import"` is narrower (no CJS fallback, no non-Node consumers);
- narrower is the safer MVP posture.

A successor authorizing ADR or a pre-merge Flatline pass on this
implementation PR may reverse this; absent reversal the choice holds.

### Runtime barrel allowlist (ADR-026A §"Decision" §3)

The barrel at `src/straylight/runtime/recall-intake/index.ts` exports
**exactly**:

| Export | Kind | Notes |
|---|---|---|
| `handleRecallIntake` | function | The one MVP runtime entrypoint. Wraps the host-layer handler behind the Dixie-only capability gate. |
| `createDixieCapability` | function | Mints the per-call capability used to satisfy the non-Dixie refusal mechanism. Refuses (throws) when `STRAYLIGHT_RUNTIME_DIXIE_KEY` is absent. |
| `DixieCapabilityError` | class | Thrown by `createDixieCapability` when the deployment-bound shared key is absent. |
| `DixieCapability` | type | Capability interface (no runtime value). |

`createInMemoryRecallIntakeDeps` is intentionally **not** exported.
Tests build deps inline; keeping this off the allowlist preserves the
§3 guarantee that the runtime seam does not leak `EstateStore` /
`AuditLog` / `JsonlStorage` value imports.

The following are **NOT** exported as runtime values from this subpath
(adding any of them requires a separate, future, expanding ADR):
`executeRecall`, `EstateStore`, `AuditLog`, `JsonlStorage`,
`dispositionFor`, `verifyChain`, `computeCommitmentRoot`, `devSign`,
`devSignatureFor`, `validateCandidateAssertion`,
`validateRecallRequest`, `evaluateCompetence`, `InMemoryStorage`,
`loadBundle`, `saveBundle`, and every other §1–11 wedge stable-surface
entry.

### Experimental / pre-Finn / Dixie-only marker (ADR-026A §"Decision" §6)

The marker is recorded in **four** places, all of which the Phase 26B
test suite asserts:

- JSDoc on the runtime barrel and on every exported handler / helper.
- Emitted `.d.ts` declarations: the JSDoc survives `tsc` emission so
  consumers see the marker through `import type`. The
  `tests/phase-26b-runtime-recall-intake.test.ts` suite reads the
  emitted `.d.ts` and asserts the `@experimental` tag plus the marker
  tokens `pre-Finn`, `Dixie-only`, and migration-to-Finn language are
  present.
- README "Runtime subpath (experimental, pre-Finn, Dixie-only)"
  section.
- This section.

### Concrete non-Dixie refusal mechanism (ADR-026A §"Decision" §7)

The mechanism is HMAC-SHA256 challenge-response gated by an
environment-bound shared key (`STRAYLIGHT_RUNTIME_DIXIE_KEY`) plus a
closure-private brand on the capability object. Per ADR-026A §7 the
mechanism is (a) unforgeable by a non-Dixie caller without operator
access, (b) observable in tests, and (c) localized to the runtime
barrel boundary rather than relying on transitive trust.

Per-attack-shape coverage (ADR-026A §7):

| Attack shape | Defence |
|---|---|
| (i) direct ESM import from non-Dixie | Without `STRAYLIGHT_RUNTIME_DIXIE_KEY` in env, `createDixieCapability` refuses; the runtime barrel rejects unbranded objects. |
| (ii) forged caller metadata | The gate consumes NO caller-identity strings; metadata-forging is a no-op against this gate. |
| (iii) fake `"dixie"`-named wrapper package | Package-name strings are never inspected; a wrapper without the env key cannot construct a capability. |
| (iv) dependency-object spoofing | The capability brand is membership in a module-private `WeakSet` populated only by `createDixieCapability`. A hand-rolled `{ nonce, proof }` object — even with a cryptographically-correct proof obtained out-of-band — fails the brand check. |

The full module-level threat-model commentary is in
[`../../src/straylight/runtime/recall-intake/dixie-capability.ts`](../../src/straylight/runtime/recall-intake/dixie-capability.ts).

#### Cross-process replay (Phase 26B-F W4)

A capability is **not** a transferrable bearer token. The runtime
barrel recognises a capability by membership in a closure-private
`WeakSet` populated by `createDixieCapability` in the importing
module instance. Serialising the capability (`JSON.stringify`,
structured-clone, RPC marshal, copy through shared memory, etc.)
and rehydrating it in another process produces a new object that
is **not** in the source process's `WeakSet`; the verify step
rejects it with `runtime_seam:capability_unrecognized` (the
defence (iv) lane). The implication is that process B does **not**
"replay" process A's capability; process B MUST construct its own
capability locally by calling `createDixieCapability` with its
own `STRAYLIGHT_RUNTIME_DIXIE_KEY` planted in its own env. There
is no supported wire format for capabilities, and adding one is
out of scope for Phase 26B.

#### Env-key rotation (Phase 26B-F W3)

`STRAYLIGHT_RUNTIME_DIXIE_KEY` is the deployment-bound shared
secret consumed at both mint and verify. If the key is rotated
between the mint of a capability and a subsequent
`handleRecallIntake` call, the verify step re-reads the env at
call time and re-HMACs the capability's nonce under the
post-rotation key; the two HMACs do not match; the seam fails
closed with `runtime_seam:proof_invalid` under
`crypto.timingSafeEqual`. Rotation is therefore safe by
construction: pre-rotation capabilities cannot be replayed
against a post-rotation deployment. Operationally, **Dixie MUST
re-mint capabilities after a rotation event** (typically by
re-invoking `createDixieCapability()` for the next request rather
than caching the capability across rotations).
`tests/phase-26b-runtime-recall-intake.test.ts` §10.f.i covers
this fail-closed path ("WRONG env key (key rotation /
deployment mismatch)"). No HMAC model change is implied; this
section documents the existing seam behavior.

If the chosen mechanism is ever found to be insufficient against any
listed attack shape, Phase 26B is **blocked** and ADR-026A may NOT be
cited as sufficient authorization (per ADR-026A §"Decision" §7
block-on-failure rule).

### Threat-model legs (ADR-026A §"Decision" §11)

The runtime seam:

- T13 (network adversary): is **not** the network seam; Dixie's
  ingress is. The seam re-checks the wedge invariants the wedge
  re-checks (estate-id scoping, class validation, signer competence,
  status filtering, audit-chain append) via the host-layer
  `handleRecallIntake` and is fail-closed on precondition mismatch.
- T14 (cross-tenant authorization): the seam refuses to act on a
  tenant value not derived from the authenticated context; the
  host-layer `checkSameTenant` guard is preserved verbatim.
- T15 (replay): the seam does not own replay/idempotency state — the
  Dixie endpoint does. The Straylight runtime seam records no replay
  state and adds no idempotency layer.
- T16/T17/T18/T9: the Straylight runtime seam **MUST NOT** add ingress
  validation, rate limits, body-size limits, per-tenant memory caps,
  replay/idempotency state, or multi-instance coordination logic.
  Those remain Dixie-endpoint responsibilities per Phase 26A-1; adding
  them to the runtime barrel is a Phase 26A-1 leak and is blocked by
  ADR-026A.

### Migration / retirement to Finn (ADR-026A §"Decision" §8)

This subpath is a pre-Finn MVP exception, **not** a permanent lane
transfer. When ADR-022E gate #9 fires, a future ADR (provisionally
ADR-026B or successor) MUST:

- move runtime enforcement to Finn;
- deprecate `@loa/straylight/runtime/recall-intake` with a documented
  deprecation window, named in the successor ADR with a concrete
  trigger and an upper bound that does not require operator inaction
  to enforce;
- retire the subpath in a clean package-surface change;
- restore Straylight to its full type-only posture.

Dixie does NOT become a semantic / runtime authority; Straylight
remains the semantic wedge owner; Finn remains the eventual
runtime-enforcement owner.

## Versioning

The wedge does not yet carry a published semver. Treat the public surface
as **0.x** — minor breakages are possible at any phase boundary. Phase 5
freezes the *shape*; future phases (real signatures, real storage, real
retrieval) will *replace* implementations, not the shape, where possible.

When the wedge is extracted from this repo into its own published package,
the surface above is the API that ships. Anything else gets the
`internal/` prefix and is excluded from the package's `exports` field.
