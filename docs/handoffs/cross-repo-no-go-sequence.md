# Cross-repo no-go sequence

> Status: Phase 15. **Coordination artifact only, in
> `loa-straylight`.** This document lists the no-go rules that
> every sibling-repo PR (Hounfour, Finn, Dixie, Freeside) must
> respect. It is **not** cross-repo implementation. It does not
> file, open, review, or merge any sibling-repo PR. Filing or
> merging the sibling-repo PRs is out of scope for Phase 15 and
> must happen in the sibling repo, under teammate review.
>
> Companion docs:
> [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
> (which sibling issues exist and what they back) and
> [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
> (recommended sibling-repo implementation order and dependency
> rationale).

## Why a no-go list

The four sibling-repo handoff packets (Phases 9 / 10 / 12 / 14) are
each locally consistent. Each one's boundary doc says clearly what
the sibling repo must not own. But a *sequence* of sibling-repo
PRs has emergent failure modes that no individual boundary doc can
catch on its own:

- a downstream sibling PR can quietly assume an upstream contract
  that has not actually merged;
- a sibling PR can re-define a primitive the wedge owns to fill a
  gap left by the absence of an upstream sibling;
- a sibling PR can be merged by its own author with no teammate
  review, on the grounds that the diff "is just a mechanical
  extraction of the wedge";
- a sibling PR can promote a local Straylight fixture into a
  production contract before the fixture has been reviewed in the
  sibling repo on its own merits;
- a sibling PR can ship a user-visible surface (Freeside) before
  any of the upstream contracts (Hounfour shape, Finn runtime,
  Dixie BFF) have settled, on the grounds that "the bot side is
  decoupled."

Each of those failures has a known mitigation. This document
lists them as explicit no-go rules so a future sibling-repo
reviewer can refuse the PR at the gate without having to
reconstruct the rationale from scratch.

## No-go rules

### 1. Do not wire Finn before Hounfour schema contracts are reviewed or explicitly stubbed

Finn's runtime gate evaluates *typed* assertions, transitions, and
recall requests. The shape of those types is the class lane, which
Hounfour owns (per Phase 9
[`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
and per the boundary in
[`finn-runtime-boundary.md`](./finn-runtime-boundary.md)).

Wiring Finn against the wedge's current-shape helpers, against an
ad-hoc Finn-side schema, or against no schema at all collapses the
class lane into the runtime lane and creates a hard backwards-
compatibility liability the moment Hounfour pins canonical shapes.

The only acceptable Finn-without-Hounfour path is an *explicit
stub*: Finn imports a typed shim that mirrors the future Hounfour
API, the stub is documented in the Finn PR description, and the
team agrees in writing that the stub will be removed in a follow-
up PR after Hounfour lands. "Implicit" stubs (i.e. inlining
wedge-internal types and calling them schemas) do not count and
must be rejected at review.

### 2. Do not expose Dixie BFF recall as generic retrieval

Dixie's BFF surfaces serve recall packs *with receipts*, surface
audit events, route high-risk recalls to review queues, and
respect class-vs-policy decisions made upstream by Finn / the
wedge. None of that is generic retrieval (per Phase 12
[`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md)).

Exposing Dixie BFF recall as generic retrieval — i.e. as a vector
search, a SQL `LIKE`, an embedding lookup, or a chunk-fetch
endpoint that returns recall-shaped responses without recall
receipts — is the most dangerous failure mode in the index. It
*looks* like governed recall to a downstream consumer (Freeside
bots, eval harness, future onchain anchor adapter) and silently
discards the receipt, the policy decision, the redaction layer,
and the audit trail.

Dixie BFF endpoints that return recall-shaped data must always
return a receipt. A Dixie endpoint that cannot return a receipt
must not return recall-shaped data. There is no "lite recall"
exception.

### 3. Do not expose Freeside bot / community surfaces before Dixie / Finn boundaries are settled or explicitly mocked

Freeside is the most visible lane (Discord / Telegram / REST /
NATS) and has the highest blast radius for boundary failures (per
Phase 14
[`freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md)).
Freeside also depends on the most upstream contracts at once:
Hounfour shape, Finn runtime enforcement, Dixie BFF recall, and
the wedge's privacy / public-channel rules.

Exposing Freeside community / bot surfaces before Dixie BFF and
Finn runtime enforcement have settled (or are explicitly mocked
behind a typed shim, with a written commitment to rewire before
user-facing rollout) creates a chain of guaranteed failures: bot
recall served directly out of the wedge with no runtime gate, bot
conversation buffers treated as governed recall, private estate
material surfaced in public Discord / Telegram channels, and a
forced rewrite of every Freeside call site once the upstream
boundaries land.

Freeside community / bot surface rollout to real users without
either real Dixie / Finn or explicit mocks-with-rewire-commitment
for both is forbidden.

### 4. Do not merge sibling implementation PRs without teammate review

**Sibling-repo PRs require teammate review before merge.** This is
restated here from
[`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
because it is a no-go rule, not just a recommendation.

No author may self-approve a sibling-repo PR that consumes one of
the Phase 9 / 10 / 12 / 14 handoff packets, even when:

- the PR is described as "purely mechanical";
- the PR is described as a "pure extraction" of a wedge primitive;
- the PR is described as "cosmetic" or "renames only";
- the PR is described as a "test-only" or "fixture-only" change;
- the PR is unblocking a downstream sibling-repo PR with a
  deadline.

A teammate reviewer is the only practical defense against
silent primitive re-definition and against scope creep at the
gate. Self-approval of a sibling-repo PR — even with green CI —
is a violation of this index regardless of the diff's content.

### 5. Do not let any sibling repo redefine Straylight primitive semantics independently

The wedge's primitives — `Assertion`, `Keyring`, `EstateTransition`,
`Challenge`, `Revocation`, `ForgetRecord`, `RecallRequest`,
`RecallPack`, `RecallReceipt`, `AuditEvent`, `CommitmentRoot`, and
the verbs `admit`, `classify`, `link`, `challenge`, `inherit`,
`forget`, `recall` — have semantics that live in `loa-straylight`.

Sibling repos may consume these primitives, surface them, redact
them, gate them, route them, audit them, and adapt them — but
sibling repos must not *redefine* them.

A "redefinition" is anything that changes what the primitive means
to a downstream consumer. Examples (each forbidden):

- Hounfour PR-A defining a new `RecallReceipt` field that the
  wedge does not produce, and changing receipt semantics to
  require it.
- Finn PR defining its own `policyForTransition` whose return type
  is incompatible with the wedge's `PolicyDecision`.
- Dixie BFF PR defining a "soft recall" that is recall-shaped but
  returns no `RecallReceipt`.
- Freeside PR defining a `bot_recall_request` that bypasses
  `RecallRequest` validation.

If a sibling repo discovers that a primitive's semantics need to
change, the change lands in `loa-straylight` first, under teammate
review, and then the sibling repos pick it up downstream. The
direction is one-way.

### 6. Do not treat local Straylight fixtures as canonical production contracts until extracted/reviewed

The fixture packs at
[`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/),
[`fixtures/finn-runtime-enforcement/`](../../fixtures/finn-runtime-enforcement/),
[`fixtures/dixie-governed-recall/`](../../fixtures/dixie-governed-recall/),
and
[`fixtures/freeside-community-surface/`](../../fixtures/freeside-community-surface/)
are deterministic test inputs staged in `loa-straylight` for the
sibling-repo PRs to eventually adopt. They are explicitly *not*
canonical production contracts (per the per-packet handoff docs,
e.g.
[`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)).

Treating these fixtures as canonical production contracts before
the sibling repo has reviewed them on its own merits is forbidden.
Examples (each forbidden):

- A Hounfour PR that ships a TypeBox schema *generated from* a
  fixture's shape without the schema having been reviewed.
- A Finn PR that wires the fixture pack as the production policy
  table.
- A Dixie PR that ships the fixture-pack reasons as the production
  user-facing recall-deny strings.
- A Freeside PR that ships fixture-pack public-channel redaction
  outputs as the production redaction policy.

The fixtures are inputs to the sibling-repo PR's review. They are
not the contract. The sibling-repo PR's reviewer must explicitly
approve the production contract that the PR ships, regardless of
how closely it tracks the local fixture.

## What this document is *not*

- **Not** a license to begin sibling-repo work without reading the
  per-packet handoff documents and the implementation-order doc.
- **Not** a substitute for the per-packet boundary docs
  ([`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md),
  [`finn-runtime-boundary.md`](./finn-runtime-boundary.md),
  [`dixie-governed-recall-boundary.md`](./dixie-governed-recall-boundary.md),
  [`freeside-community-surface-boundary.md`](./freeside-community-surface-boundary.md)).
  The per-packet boundary docs remain authoritative for what each
  sibling repo must not own.
- **Not** a runtime cross-repo dependency. This document is docs
  only. It introduces no imports from sibling repos, no NPM
  dependencies, and no behavior changes inside `loa-straylight`.
- **Not** a record of past violations. The rules above are
  forward-looking; they apply to every sibling-repo PR that
  references the Phase 9 / 10 / 12 / 14 handoff packets.

## Cross-references

- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — the index of filed sibling issues and the local handoff packet
  each one consumes.
- [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo implementation order and dependency
  rationale.
- [`docs/handoffs/README.md`](./README.md) — the per-packet
  handoff index (Phases 9 / 10 / 12 / 14).
- [`docs/mvp/threat-model.md`](../mvp/threat-model.md) — the
  fail-closed defenses every sibling-repo PR pins against.
