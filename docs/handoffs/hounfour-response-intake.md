# Hounfour response intake — Jani's reply to issue #70

> Status: Phase 16. **Response intake / readiness artifact only, in
> `loa-straylight`.** This file records Jani's response to the
> Phase 9 handoff filed at
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
> It is **not** Hounfour integration. It is **not** a cross-repo
> implementation. It does **not** flip any package import to
> `@0xhoneyjar/loa-hounfour`, add Hounfour as a dependency, or
> change Phase 0–15 runtime behavior.
>
> Companion docs:
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
> (the accepted-with-adaptation deltas vs. our Phase 9 handoff) and
> [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
> (the future v8.5.0-rc.1 shadow-integration window plan).

## Purpose

Phase 9 staged the Straylight Hounfour-extraction handoff packet
([`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md),
[`hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md),
[`hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)).
That packet was filed in `loa-hounfour` as
[issue #70](https://github.com/0xHoneyJar/loa-hounfour/issues/70).

Jani's response on the Hounfour side answered with a
**disposition table** (per-primitive: REUSE / EXTEND / ADD-NEW /
DEFER / FOLD), an **adaptation plan**, and a **release-target**
update. Phase 16 records that response inside `loa-straylight` so:

- a future reviewer of either repo can see the Straylight-side
  picture of what was accepted, what was adapted, and what was
  deferred — without re-reading the Hounfour issue thread;
- the Straylight repo has a single intake doc to reference when the
  v8.5.0-rc.1 shadow-integration window opens;
- the response is captured as **accepted-with-adaptation, not
  direct import** — both repos must remain free to adapt naming,
  versioning, and scope before the rc tag lands.

## Disposition summary

Jani's disposition of the Phase 9 handoff candidates:

| Disposition | Count | Meaning |
|---|---|---|
| REUSE     | 9   | Adopt the Straylight class shape directly into Hounfour with no semantic change. |
| EXTEND    | 4   | Adopt the shape but add fields / variants Hounfour needs to be canonical across the wider Loa surface. |
| ADD-NEW   | ~21 | Hounfour will introduce schemas Straylight does not yet have. Some are pre-existing in Hounfour; others are required to make the Straylight extraction usable across Loa. |
| DEFER     | 6   | Defer to Hounfour cycle-005. Out of scope for the v8.5.0-rc.1 / cycle-004 window. |
| FOLD      | 1   | `CandidateAssertion` collapses into `Assertion` with `status: "candidate"`. Not a separate type. |

Approximate count for ADD-NEW reflects Hounfour's wider canonical
scope (Straylight only sees a subset). The exact list lives in
the Hounfour repo's reuse audit (PR-A2.1, see
[`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)).

## Accepted-with-adaptation, not direct import

The single most important framing point in Jani's response, and
the framing this whole intake doc enforces:

> **Hounfour accepts the Straylight extraction _with adaptation_.
> It is not a direct import of the Phase 9 handoff packet.**

Concretely, this means:

- The Straylight handoff packet is the *input*, not the *contract*.
  The contract is what Hounfour ships in v8.5.0-rc.1.
- Schema names, `$id` URIs, package version, capability-scope
  labels, and ForgetRecord variant cardinality may all differ
  between the Phase 9 handoff and the rc tag. Each delta is
  enumerated in
  [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md).
- Straylight must not flip its imports / package boundary to
  `@0xhoneyjar/loa-hounfour` until **after** the v8.5.0-rc.1 tag
  exists and has been validated through the shadow-integration
  checklist.
- Until then, the Straylight wedge remains the source of truth for
  primitive semantics. Phase 0–15 behavior is unchanged.

If a future reviewer sees a Straylight PR that:

- pins `@0xhoneyjar/loa-hounfour` outside of an explicit
  shadow-integration test branch, or
- changes any Straylight runtime import to come from Hounfour, or
- treats the Phase 9 handoff packet as the canonical Hounfour
  contract,

the reviewer should refuse the PR at the gate. The "accepted-with-
adaptation" framing is what protects both repos from premature
coupling.

## What Jani accepted (REUSE — 9)

REUSE primitives are adopted into Hounfour with the Straylight
shape preserved (subject to the bare-PascalCase `$id` rule and the
package-version target documented in
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)).

These are the safest primitives to validate against Hounfour
schemas during the rc shadow-integration window: any divergence
is a Hounfour bug, not a Straylight semantic change.

The exact REUSE list lives in Jani's response and in the Hounfour
PR-A2.1 reuse-audit doc that the
[shadow-integration checklist](./hounfour-rc-shadow-integration-checklist.md)
waits for. This intake doc deliberately does not pin a per-name
list, because Jani may rename one or more of them between cycle-004
draft and v8.5.0-rc.1.

## What Jani extended (EXTEND — 4)

EXTEND primitives keep the Straylight shape but add fields or
variants Hounfour needs to canonicalize across the wider Loa
surface (Finn / Dixie / Freeside / eval / future onchain anchors).

Implications for Straylight:

- The Straylight conformance vectors at
  [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
  must be **forward-compatible** with the EXTEND adaptations:
  added fields must validate as optional, added variants must not
  reject the existing variant, and `safeCanonicalize` (per
  [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md))
  must remain stable across the extension.
- During the shadow-integration window, any test that fails because
  a Straylight fixture lacks an EXTEND-added field is **not**
  necessarily a Straylight bug. The EXTEND fields are Hounfour's,
  not Straylight's, until Straylight chooses to populate them.

## What Jani added new (ADD-NEW — ~21)

ADD-NEW schemas are introduced by Hounfour. Some pre-exist in
Hounfour today; others Hounfour will add to make the Straylight
extraction land cleanly across Loa.

Implications for Straylight:

- ADD-NEW schemas are **out of scope** for the Straylight rc
  shadow-integration window unless a specific Straylight primitive
  needs to validate against one. The default during the window is:
  **import only what we already use**, do not pull the full
  Hounfour surface.
- Straylight must not redefine an ADD-NEW schema locally as a
  shortcut. If a Straylight test needs an ADD-NEW schema, the
  shadow-integration test branch imports it from
  `@0xhoneyjar/loa-hounfour` (per the subpath-import discipline
  in [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)).

## What Jani deferred (DEFER — 6)

Six candidates are deferred to Hounfour cycle-005 and **stay local
in Straylight** until then.

The two load-bearing names in the DEFER set are:

- **`Challenge`** — Straylight keeps its current local definition
  in `src/straylight/types.ts`. The wedge's `challenge` verb,
  `Challenge` validator, and conformance vectors continue to be
  the source of truth until Hounfour cycle-005 absorbs them.
- **`EstateTransition`** — Straylight keeps its current local
  definition. The wedge's transition machinery, transition
  receipts, and audit-chain semantics continue to be the source of
  truth until Hounfour cycle-005 absorbs them.

The remaining four DEFER primitives follow the same rule: stay
local in Straylight, do not validate against Hounfour, do not
re-export from Hounfour during the v8.5.0-rc.1 window.

This is **not** a Straylight gap. The Phase 9 handoff explicitly
allowed Hounfour to defer primitives whose semantics needed more
soak time. The `Challenge` and `EstateTransition` deferrals are
captured in
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
and the
[shadow-integration checklist](./hounfour-rc-shadow-integration-checklist.md).

## What Jani folded (FOLD — 1)

One candidate is folded:

- **`CandidateAssertion`** is **not** a separate type. It collapses
  into `Assertion` with `status: "candidate"`.

Implications for Straylight:

- Straylight's existing class-validation does not currently use a
  `CandidateAssertion` type as a distinct shape; the fold is
  semantically a no-op for the wedge's runtime.
- Straylight schema-candidate fixtures
  ([`fixtures/schema-candidates/`](../../fixtures/schema-candidates/))
  must keep `Assertion` shape stable. If a future fixture or test
  relies on a separate `CandidateAssertion` shape, it must be
  rewritten to use `Assertion` with `status: "candidate"` before
  the rc shadow-integration window opens.

## What this doc is *not*

- **Not** Hounfour integration. The integration is the
  shadow-integration window in
  [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md),
  and even that is a *test branch* — not a main-branch import flip.
- **Not** a re-statement of the Phase 9 handoff. The Phase 9
  handoff is still the input; this intake doc captures the
  response.
- **Not** a license to flip Straylight imports to Hounfour. That
  flip happens only after v8.5.0-rc.1 ships and the shadow
  checklist passes.
- **Not** a contract pin. The contract is whatever Hounfour ships
  in v8.5.0-rc.1, not the Phase 9 handoff and not this intake
  doc.
- **Not** a Straylight runtime change. Phase 16 is documentation /
  readiness only.

## Cross-references

- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — the per-delta accepted-with-adaptation table.
- [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  — the future v8.5.0-rc.1 shadow-integration plan.
- [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — the original Phase 9 handoff (the input to issue #70).
- [`hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  — companion PR checklist from Phase 9.
- [`hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
  — Phase 9 mapping table from Straylight primitives to proposed
  Hounfour schema names.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — the cross-repo index, updated with Hounfour issue #70 response
  status in Phase 16.
- [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — implementation order, updated with the rc.1 wait condition
  in Phase 16.
- [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  — Hounfour-side filed issue.
