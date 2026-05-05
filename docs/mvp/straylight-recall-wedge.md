# Straylight Recall Wedge — MVP, in-repo

> Status: Phase 0, 1, 2, 3, 4, and 5 implementation. Local-only. No
> cross-repo integration, no production DB, no onchain anchor, no
> Discord/Freeside surface.
>
> Phase 5 hardens the package boundary, the threat model, and the
> fail-closed contracts — see [`package-boundary.md`](./package-boundary.md)
> and [`threat-model.md`](./threat-model.md). The runtime behavior of
> phases 0–4 is unchanged.

This document is the user-facing entry point for the wedge. Source of truth
for the wedge's semantics is
[`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md)
(§6 target architecture, §7 primitives, §9 validation, §10 keyring,
§11 recall, §14 audit, §17 MVP plan).

## What this wedge proves

> The system can prove which estate material was allowed to matter, which
> material was excluded, and why.

Not proven (deliberately): natural-language quality, vector retrieval,
graph traversal, multi-tenant isolation, dNFT transfer, public anchoring,
Freeside/Dixie/Finn integration.

## Where the code lives

```
src/straylight/
  types.ts            primitive type definitions (§7)
  canonical.ts        deterministic JSON canonicalization + sha256
  ids.ts              content-addressed ID generation
  signatures.ts       dev-signature impl (HMAC-SHA256, clearly marked)
  validators/
    class-validator.ts  structural class validation (§9.1)
  keyring.ts          signer entries + competence rules (§10)
  policy.ts           policy decisions (§9.2) + recall scope filters (§11.5)
  audit.ts            in-memory hash-chained audit log (§14)
  estate.ts           EstateStore + transition executor (storage-backed,
                      emits TransitionReceipt + audit event per mutation;
                      admit / challenge / revoke / forget)
  recall.ts           RecallRequest -> RecallPack + RecallReceipt (§11)
  commitment.ts       optional CommitmentRoot (§13.3)
  storage/
    types.ts          StorageAdapter interface + EstateBundle helpers (§17.5)
    in-memory.ts      InMemoryStorage — default, no filesystem touch
    jsonl.ts          JsonlStorage — append-only .jsonl per "table"
  index.ts            public surface
fixtures/
  actor.json          demo Actor (agent:satoshi-demo)
  estate.json         demo ActorEstate
  keyring.json        demo Keyring (operator/runtime/reviewer + revoked)
  index.ts            fixture-builder helpers
tests/
  class-vs-policy-validation.test.ts
  recall-exclusion.test.ts
  recall-contested-marking.test.ts
  signer-fail-closed.test.ts
  audit-and-receipt.test.ts
  demo-flow.test.ts
  storage-conformance.test.ts   (Phase 2)
  jsonl-durability.test.ts      (Phase 2)
  transition-receipts.test.ts   (Phase 3)
  quorum-and-timelock.test.ts   (Phase 3)
  forget-flow.test.ts           (Phase 3)
  policy-unavailable.test.ts    (Phase 3)
  phase-4-demo.test.ts          (Phase 4 — acceptance test for runDemo())
  phase-5-hardening.test.ts     (Phase 5 — fail-closed acceptance tests)
scripts/
  demo-recall-wedge.ts          (Phase 4/5 — CLI entrypoint with --json)
  demo-recall-wedge.lib.ts      (Phase 4/5 — runDemo() + toDemoJson())
docs/migrations/
  001-init.md         (Phase 2/3 — table contract for any storage adapter)
docs/mvp/
  phase-4-demo.md     (Phase 4 — how to run the demo + what it proves)
  package-boundary.md (Phase 5 — stable public API and integration seams)
  threat-model.md     (Phase 5 — threats and their fail-closed defenses)
```

## Public API entrypoint

```ts
import { /* … */ } from './src/straylight/index.js';
```

`src/straylight/index.ts` is the **only** stable import path. Anything not
re-exported there is internal and may change without notice. The full
stable surface and future cross-repo integration notes live in
[`package-boundary.md`](./package-boundary.md).

## Run it

```bash
npm install
npm run typecheck            # tsc --noEmit
npm test                     # vitest run
npm run demo:recall          # Phase 4 — human-readable transcript
npm run demo:recall:json     # Phase 5 — JSON to .run/recall-demo.json
# Or, with custom flags:
npm run demo:recall -- --json                 # JSON to stdout
npm run demo:recall -- --json --out=PATH      # JSON to PATH
```

Each script is intentionally minimal: `tsc --noEmit` for `typecheck`,
`vitest run` for `test`, and `vite-node scripts/demo-recall-wedge.ts` for
the demo. The wedge has no build step — its consumers will import from
`src/straylight/index.ts` directly.

`.run/` is gitignored; the JSON demo writes there by default and is safe
to delete at any time.

## Demo flow (covered by `tests/demo-flow.test.ts`)

1. Build an `EstateStore` from the demo `Actor`/`ActorEstate`/`Keyring`.
2. Operator admits a public `preference` and a runtime admits a public
   `observation`. Both pass class validation, both pass policy.
3. Runtime tries to admit an `identity` assertion. Class validation passes
   (the body shape is legible). Policy denies — `runtime` is forbidden from
   `admit_assertion[identity]`. A `transition_denied` audit event is emitted.
4. Operator admits an `actor_private` `relationship` note. It passes.
5. Runtime admits a `reflection`. A reviewer then files a `challenge` with
   `requested_effect: revoke`. Target assertion's status flips to `revoked`.
6. A public-Discord `RecallRequest` is signed and submitted. The pack:
   - includes the public preference + observation (`use_instruction: usable`),
   - excludes the private relationship (`privacy_actor_private_in_public_frame`),
   - excludes the revoked reflection (`status_revoked`),
   - emits a `RecallPack` + `RecallReceipt` and a `recall_pack_emitted`
     audit event.
7. An audit-review `RecallRequest` over the same estate surfaces the revoked
   reflection in `marked`, never in `included`, with `use_instruction !=
   'usable'`.
8. The estate's audit hash chain verifies clean.

## Phase 4 — runnable demo

Phase 4 adds a single executable entrypoint that walks the wedge end-to-end
without any new runtime surface. It composes the Phase 0–3 primitives only.

```bash
npm run demo:recall
```

The demo (1) bootstraps the demo estate, (2) admits a preference + an
observation, (3) admits a reflection that links them via
`linked_assertion_refs`, (4) admits a private relationship, (5) admits two
extra assertions that get used as revoke + forget targets, (6) challenges
the reflection with `mark_contested`, (7) revokes one of the extras,
(8) marks the other `forgotten_from_recall`, (9) runs a `public_discord`
recall, prints the resulting RecallPack + RecallReceipt + exclusion
reasons, (10) re-runs the same estate under `audit_review` to prove
revoked + forgotten + contested assertions remain visible (always as
`marked`, never as `usable`), and (11) verifies the per-estate audit hash
chain.

`runDemo()` is the same function the Phase 4 acceptance test
(`tests/phase-4-demo.test.ts`) invokes with `silent: true`, so the CLI
transcript and the test both check the same artifacts. See
[`docs/mvp/phase-4-demo.md`](./phase-4-demo.md) for a step-by-step guide.

## Phase 5 — hardening + package boundary prep

Phase 5 freezes the *shape* of the wedge. It does not add runtime features
and does not change phase 0–4 behavior. What it adds:

- **Stable public API**. `src/straylight/index.ts` re-exports the full
  intended public surface, grouped into eleven sections (types, IDs,
  signatures, class validation, keyring, policy, audit, estate store,
  recall, commitment, storage). See
  [`package-boundary.md`](./package-boundary.md) for the contract.
- **Threat model**. [`threat-model.md`](./threat-model.md) lists the
  twelve threats the wedge defends against (memory poisoning,
  inference-as-fact, revoked / forgotten / private leakage, contested
  promotion, missing policy, tampered audit chain, prompt injection
  treated as authority, etc.) and points each one at the test that pins
  it.
- **Fail-closed acceptance tests**. `tests/phase-5-hardening.test.ts`
  proves: missing policy denies, unknown class fails class validation,
  unknown signer fails competence, revoked / forgotten / private /
  contested do not surface as `usable` in any frame, a tampered audit
  chain is detectable via `verifyChain`, recall requests missing
  `actor_id` / `estate_id` fail class validation, and the commitment
  root changes whenever estate material changes.
- **Machine-readable demo output**. `npm run demo:recall:json` writes a
  JSON projection (`recall_request`, `recall_pack`, `recall_receipt`,
  `audit_review`, `audit_chain_verification`) to `.run/recall-demo.json`.
  `npm run demo:recall -- --json` prints the same JSON to stdout.

What Phase 5 explicitly does **not** do:

- No production database integration (still `InMemoryStorage` /
  `JsonlStorage`).
- No onchain publishing (still local commitment roots).
- No Discord / Freeside / Finn / Dixie / Hounfour cross-repo wiring.
- No real cryptography (still `dev_signature` HMAC).
- No generic RAG / vector retrieval (still full estate scan).
- No change to phase 0–4 runtime semantics.

## Runtime enforcement (Phase 3)

Every transition routes through the policy engine and emits a structured
`TransitionReceipt` alongside its audit event:

| Transition | Receipt kind on allow | Receipt kind on deny |
|---|---|---|
| `admit_assertion` | `admission` | `denied` |
| `challenge_assertion` | `challenge` | `denied` |
| `revoke_assertion` | `revocation` | `denied` |
| `forget_assertion_from_recall` | `forget` | `denied` |

`TransitionReceipt` carries `transition_id`, `target_refs`, the full
`PolicyDecision`, the audit event reference, signer refs, and a
`receipt_hash` over a canonical projection — downstream commitment roots
ingest these without ever seeing assertion bodies.

Competence rules (`SignerCompetenceRule`) support:
- `quorum: N` — require N distinct competent signers; same signer signing
  twice does not satisfy quorum.
- `timelock_seconds: S` — `now − earliest matched-signature.signed_at` must
  be ≥ S; otherwise `timelock_pending:S:<elapsed>`.
- `requires_human_review: true` — competent operator without a reviewer
  co-signature lifts the decision to `needs_review`, never silent allow.

Fail-closed surfaces:
- No matching rule → `policy_unavailable_for_transition`.
- Rule with empty `required_signer_roles` → `competence:signer_role_not_competent`.
- Any throw inside the engine → `deny` with `policy_engine_error:<code>`.

## Persistence (Phase 2)

`EstateStore` accepts an optional `storage: StorageAdapter`. With no adapter
it uses `InMemoryStorage` (Phase 1 behavior). With `JsonlStorage` it persists
seven append-only files mirroring the §17.5 table sketch:

```
<root>/
  actors.jsonl              actor_estates.jsonl     keyrings.jsonl
  estate_assertions.jsonl   estate_transitions.jsonl
  recall_receipts.jsonl     audit_events.jsonl
```

Cold reload:

```ts
const storage = new JsonlStorage({ root: '/var/lib/straylight/agent-x' });
const store = EstateStore.fromStorage(storage, 'estate:agent-x');
store!.auditLog.verifyChain('estate:agent-x'); // { ok: true }
```

Storage contract details and the future-Postgres translation guide live in
[`docs/migrations/001-init.md`](../migrations/001-init.md). Adapter
conformance is enforced at `tests/storage-conformance.test.ts` — every new
adapter is added to its `cases` list.

## Anti-collapse boundaries enforced in this wedge

- Class validation lives in `validators/class-validator.ts` and never
  references the keyring, policy outcomes, or estate state.
- Policy lives in `policy.ts` and never re-validates structural shape — it
  short-circuits on `class_validation.valid === false`.
- A signature alone is never authority: every transition runs through
  `evaluateCompetence()` which separately checks (a) signer is on the
  keyring, (b) signer is currently valid, (c) signer's role satisfies the
  matched competence rule for that transition + class + frame + risk.
- `revoked` / `forgotten_from_recall` / `sealed` assertions are filtered by
  `dispositionFor()` regardless of caller intent. The audit-review frame
  may surface them, but only as `marked`, never as `usable`.
- `model_output`-only provenance cannot authorize identity / permission /
  commitment classes (returns `needs_review`).
- `dev_signature` is HMAC-SHA256 keyed by `key_ref`. It is clearly labeled
  in code as development-only and must be replaced with real signature
  verification before any production use.

## What's deliberately missing (out of scope for this wedge)

- Production database. `JsonlStorage` is single-process, single-host. The
  `StorageAdapter` interface is the swap-in seam for Postgres in Dixie/Finn.
- Real cryptography. `dev_signature` is HMAC; no ed25519/secp256k1 yet.
- Cross-repo integration with Hounfour / Finn / Dixie / Freeside / Loa.
- HTTP / API surface. Everything is a TypeScript function call.
- Public anchor publishing. `commitment.ts` computes a local root only.
- Vector / graph retrieval. Recall does a full estate scan; the order
  enforced by §11.6 is the contract that real retrieval will plug into.
- Inheritance / dNFT transfer / forget-with-tombstone / appeal flow.

## Open questions still tracked from the spec

§21.1 (#3 signature substrate, #4 keyring policy language, #5 recall policy
home) are answered locally for the wedge but remain open at the system
level. §21.2 (public anchors, encryption, key rotation, dNFT inheritance,
cross-tenant proof) are out of MVP scope.
