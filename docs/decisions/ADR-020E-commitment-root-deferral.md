# ADR-020E — Commitment root and public-anchor deferral (decision-lock for Phase 20A)

## Status

Accepted-for-Phase-20A.

This ADR is a Phase 20A decision-lock. It records that public
anchoring / commitment-root publication remains optional and
deferred, restates the future requirements a commitment root must
satisfy when (or if) it is wired, and pins the explicit non-scope
for Phase 20A and Phase 20B. **Phase 20A implements no public
anchoring and adds no onchain integration.**

## Context

The wedge already includes a *local* commitment-root helper
([`src/straylight/commitment.ts`](../../src/straylight/commitment.ts))
that computes a `CommitmentRoot` over a canonical projection of
estate material; the helper is exercised by the Phase 4 demo
([`scripts/demo-recall-wedge.ts`](../../scripts/demo-recall-wedge.ts))
and pinned by the Phase 5 hardening test
([`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts))
which proves the root changes whenever estate material changes.

[`docs/mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
states explicitly under "What's deliberately missing":

> Public anchor publishing. `commitment.ts` computes a local root
> only.

and under Phase 5 explicit non-goals:

> No onchain publishing (still local commitment roots).

[`docs/mvp/threat-model.md`](../mvp/threat-model.md) lists
"Cryptographic forgery" and "Network adversary" as out-of-scope for
this phase. Adding a public anchor pulls both of those threat
classes into scope: real signature material would replace the
`dev_signature` HMAC, and a network surface would expose the
anchor publication path.

The architecture spec
([`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md))
lists §13.3 (commitments) and §21.2 (public anchors, encryption,
key rotation, dNFT inheritance, cross-tenant proof) as MVP-out-of-scope
items.

## Decision

1. **Commitment root remains optional and deferred.** The local
   commitment-root helper at
   [`src/straylight/commitment.ts`](../../src/straylight/commitment.ts)
   is unchanged in Phase 20A. No new caller, no new fixture, no
   new export, no new test.

2. **No public anchoring is implemented.** Phase 20A does not
   wire the local root to any external surface (HTTP, NATS,
   Discord, on-disk publication channel, etc.). Phase 20A does
   not promote the local root from "optional, computed on
   demand" to "always emitted".

3. **No onchain integration is implemented.** Phase 20A does not
   add a chain client, a wallet, a contract ABI, an EVM/Solana
   library, an L2 client, an indexer, a webhook, or any related
   dependency. No `package.json` change. No fixture for an
   onchain payload.

4. **Future requirements (recorded, not implemented).** When (or
   if) a future ADR proposes wiring a public anchor, the wired
   surface MUST satisfy at least the following — none of which
   is satisfied today:

   - **Real signature substrate.** `dev_signature` HMAC must be
     replaced with ed25519 / secp256k1 / equivalent before any
     anchor leaves the local process. This is already an open
     question recorded in the MVP doc and the architecture spec
     §21.1 #3.
   - **Determinism reproducible across implementations.** The
     canonical projection feeding the root must be byte-deterministic
     across re-runs and across canonicalization libraries — i.e.
     it must follow the same NFC + RFC 8785 (JCS) discipline
     Hounfour delta #6 records for `safeCanonicalize`. The
     current local helper at
     [`src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
     is the wedge's canonicalizer; whether it is replaced by a
     Hounfour subpath import is governed by ADR-020C, not this
     ADR.
   - **Receipt linkage.** Every published root must be linkable
     back to (a) the `RecallReceipt` / `TransitionReceipt` set
     it covers, (b) the `AuditEvent` chain entry it commits to,
     and (c) the actor / estate it speaks for. ADR-020D pins
     the receipt contract.
   - **Privacy preservation.** The published payload must not
     leak `actor_private` body content. Current
     `commitment.ts` projects ID + hash, not bodies; any future
     publication must preserve that.
   - **Revocability without rewrite.** Publishing a root must
     not retroactively legitimize revoked / forgotten / contested
     assertions. Subsequent roots must be able to record
     revocation without rewriting prior published material.
   - **Threat-model expansion.** A public-anchor wiring brings
     the network adversary and the cryptographic-forgery
     adversary into scope. The
     [`docs/mvp/threat-model.md`](../mvp/threat-model.md) list
     must be updated *before* the wiring ADR is accepted.
   - **Cross-tenant integrity.** When an anchor covers more than
     one actor / estate, the tenant boundary defined in the
     architecture spec §1.4 / §6 must be preserved; no anchor
     may collapse two tenants' state into a single root that
     leaks their cardinality or scope.

5. **The `Commitment` primitive remains Straylight-owned.** Per
   ADR-020A, Loa-Straylight owns the `Commitment` shape. A
   future Hounfour adoption (parallel to the `Challenge` /
   `EstateTransition` v8.6.0 trajectory) is not assumed by
   Phase 20A.

## Consequences

- Phase 20B may continue to compute the local commitment root for
  test and demo purposes (i.e. it does not need to remove or
  hide `commitment.ts`). It may **not** publish that root or add
  any anchor surface.
- A future "wire commitment root" ADR is gated on the seven
  requirements above. Each requirement that is not yet satisfied
  is a separate gate.
- Reviewers should reject any PR that adds an onchain dependency,
  a chain client, a wallet integration, a webhook publishing the
  root, or a new public-facing emitter, citing this ADR.

## Non-scope (Phase 20A)

- No public anchor publication.
- No onchain integration / chain client / wallet / contract.
- No promotion of the local root to required output.
- No new caller of the local root helper.
- No threat-model widening.
- No `package.json` / `package-lock.json` changes.
- No `src/` runtime changes.
- No new fixtures.
- No new tests.
- No sibling-repo edits.
- No commit, no push, no PR.

## Source files inspected

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §13.3, §21.1, §21.2 (referenced via the MVP doc cross-refs)
- [`docs/mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md) ("What's deliberately missing", Phase 5 non-goals)
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) (out-of-scope adversaries: Cryptographic forgery, Network adversary)
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`src/straylight/commitment.ts`](../../src/straylight/commitment.ts) (local root helper)
- [`src/straylight/canonical.ts`](../../src/straylight/canonical.ts) (local canonicalizer)
- [`src/straylight/index.ts`](../../src/straylight/index.ts) (public surface — `CommitmentRoot` type re-exported)
- [`tests/phase-5-hardening.test.ts`](../../tests/phase-5-hardening.test.ts) (commitment-root invariant)
