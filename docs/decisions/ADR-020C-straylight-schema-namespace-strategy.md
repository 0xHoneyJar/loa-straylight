# ADR-020C — Straylight schema namespace strategy (decision-lock for Phase 20A)

## Status

Accepted-for-Phase-20A.

This ADR is a Phase 20A decision-lock. It records the *future*
namespace strategy for Straylight schemas and pins the Phase 20A
deferrals so Phase 20B does not silently take a dependency on a
schema or subpath that is not yet canonical. **Phase 20A authors no
new Hounfour schemas, implements no `Challenge`, implements no
`EstateTransition`, and assumes no `safeCanonicalize` exported
subpath.**

## Context

Phase 17B / Phase 18 / Phase 19A established four load-bearing facts
about the Hounfour boundary
([`docs/handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)):

1. `@0xhoneyjar/loa-hounfour@^8.5.0` is consumed successfully and
   resolves within the v8.5.x line.
2. The 15 net-new v8.5.x schemas (delta #12) are present, with
   `$id`s under `/loa-hounfour/8.5.\d+/`.
3. `Challenge` (delta #7) and `EstateTransition` (delta #8) are
   absent in v8.5.x as expected; both are deferred to Hounfour
   cycle-005 / v8.6.0.
4. `safeCanonicalize` subpath selection remains deferred under
   gate `no-confirmed-subpath`: the v8.5.x exports map declares
   no `./canonicalize` and no `./utilities` subpath. The function
   is reachable through the package root and through `./model`,
   but importing from the package root is forbidden by delta #9
   and reaching into unexported internals is forbidden by the
   user-facing Phase 17B / 18 constraint.

The Phase 16 adaptation-delta doc
([`docs/handoffs/hounfour-adaptation-delta.md`](../handoffs/hounfour-adaptation-delta.md))
records that Hounfour ships under bare-PascalCase `$id`s
(e.g. `Assertion`, `RecallReceipt`) under
`https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`, and that
Straylight-side adoption is mediated by a private alias /
re-export module
([`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
that uses subpath imports (delta #9) and is **not** re-exported
from [`src/straylight/index.ts`](../../src/straylight/index.ts).

We are waiting for Jani / teammate response on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
before any runtime wiring or Hounfour-side schema work. Phase 20A
is the docs-coordination phase that locks the namespace question
without prejudging that response.

## Decision

1. **Target future namespace: a Straylight-specific schema
   namespace / package surface.** The future canonical place a
   sibling repo or external consumer reaches Straylight-specific
   primitive *shapes* is a Straylight-owned namespace (concretely
   today: the wedge's stable public API at
   [`src/straylight/index.ts`](../../src/straylight/index.ts) per
   [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)).
   A future package-surface migration is allowed, but it does
   **not** happen in Phase 20A and does not happen in Phase 20B
   without a separate ADR.

2. **Hounfour remains the likely canonical schema / protocol
   candidate.** Per Phase 16 / 19A, the canonical-schema role
   is on a Hounfour timeline (v8.5.x today, v8.6.0 / cycle-005
   for `Challenge` and `EstateTransition`). When Hounfour ships
   the canonical shape Straylight needs, the Straylight namespace
   becomes a thin alias / re-export over Hounfour types — never a
   silent semantic redefinition. ADR-020A keeps Loa-Straylight as
   the semantic owner; this ADR-020C clarifies that schema *shape*
   ownership migrates to Hounfour by adoption, not by rename.

3. **No new Hounfour schemas are authored in Phase 20A.** Schema
   authoring is a sibling-repo activity, gated by Jani / teammate
   review on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
   Phase 20A ships zero schema files.

4. **`Challenge` is not implemented.** It remains deferred to
   Hounfour cycle-005 / v8.6.0 per delta #7. The Straylight-side
   `challenge` verb stays local until then (§22.x in the
   architecture spec). Phase 20A does not create or rename a
   `Challenge` schema, type, or fixture.

5. **`EstateTransition` is not implemented.** It remains deferred
   to Hounfour cycle-005 / v8.6.0 per delta #8. The Straylight-side
   `EstateStore.applyTransition`-style transition machinery stays
   local until then. Phase 20A does not create or rename an
   `EstateTransition` schema, type, or fixture.

6. **`safeCanonicalize` exported subpath is not assumed to exist.**
   The Phase 18 inspector confirmed neither `./canonicalize` nor
   `./utilities` is in the v8.5.x exports map. Phase 20A does
   **not** import `safeCanonicalize` from any subpath. The
   Straylight-local canonical helper at
   [`src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
   remains the wedge's canonicalization implementation.

7. **No reach into unexported Hounfour internals.** Reaching into
   `node_modules/@0xhoneyjar/loa-hounfour/dist/...` past the
   declared exports map is explicitly forbidden — both as a
   subpath-import discipline (delta #9) and as a Phase 17B / 18
   user-facing constraint. Phase 20A and Phase 20B inherit this
   rule.

## Consequences

- Phase 20B may scaffold a local Recall Wedge using only the
  Straylight-owned types in
  [`src/straylight/index.ts`](../../src/straylight/index.ts). It
  may **not** introduce a Hounfour-named symbol into the public
  surface, and it may **not** assume a Hounfour subpath exists
  beyond those already validated by the Phase 17B / Phase 18
  vitest pins
  ([`tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts)).
- A future ADR (post-Hounfour-v8.6.0) will record the explicit
  migration of `Challenge` and `EstateTransition` shape ownership
  to Hounfour. That ADR is **not** Phase 20A and is **not**
  Phase 20B.
- A future ADR (post-`safeCanonicalize`-subpath confirmation) will
  record whether Straylight adopts the Hounfour subpath or keeps
  the local canonical helper. That ADR is **not** Phase 20A.
- The `audit-event-transition` discovery note (Phase 18) is
  recorded as `DISCOVERY_NOTE`, not `MISSING`, and is not a
  Phase 20A blocker. Resolution (rename, request a Hounfour-side
  `AuditEvent` schema, or re-classify against `audit-trail-entry`
  / `domain-event`) is a deliberately deferred later-phase
  decision.

## Non-scope (Phase 20A)

- No new schemas (Hounfour or Straylight) authored.
- No `Challenge` schema / type / fixture / verb wiring.
- No `EstateTransition` schema / type / fixture / wiring.
- No `safeCanonicalize` import from any subpath.
- No reach into unexported Hounfour internals.
- No edits to
  [`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts).
- No edits to
  [`src/straylight/index.ts`](../../src/straylight/index.ts) at
  the Hounfour boundary.
- No `package.json` / `package-lock.json` changes.
- No fixture-export script changes.
- No sibling-repo edits.
- No commit, no push, no PR.

## Source files inspected

- [`docs/architecture/loa-straylight-product-system-architecture-spec.md`](../architecture/loa-straylight-product-system-architecture-spec.md) §1.4, §6.2.2 (Hounfour role)
- [`docs/mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`docs/handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md)
- [`docs/handoffs/hounfour-adaptation-delta.md`](../handoffs/hounfour-adaptation-delta.md) deltas #1–#15
- [`docs/handoffs/hounfour-rc-shadow-integration-checklist.md`](../handoffs/hounfour-rc-shadow-integration-checklist.md)
- [`docs/handoffs/hounfour-shadow-integration-findings.md`](../handoffs/hounfour-shadow-integration-findings.md)
- [`docs/handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md) (seven load-bearing facts)
- [`package.json`](../../package.json) (`@0xhoneyjar/loa-hounfour: ^8.5.0`)
- [`src/straylight/canonical.ts`](../../src/straylight/canonical.ts) (Straylight-local canonical helper)
- [`src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts) (private alias module, not re-exported)
- [`src/straylight/index.ts`](../../src/straylight/index.ts) (public surface — unchanged at the Hounfour boundary)
- [`tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts) (Phase 17B + 18 vitest pins)
