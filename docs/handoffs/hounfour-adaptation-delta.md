# Hounfour adaptation delta

> Status: Phase 16. **Adaptation-delta artifact only, in
> `loa-straylight`.** This document enumerates the deltas between
> the Phase 9 Straylight handoff and what Hounfour actually
> shipped on the v8.5.0 line, beginning with Jani's response on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> and updated for the v8.5.0-rc.1 cut (squash SHA `c94bcd22`) and
> the v8.5.0 final cut (`@0xhoneyjar/loa-hounfour@8.5.0`, tag
> `v8.5.0`, `main` HEAD `ea98924d`, `$id`s resolving under
> `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`). It is
> **not** Hounfour integration. It does **not** flip imports, add
> a Hounfour dependency, or change Phase 0–15 runtime behavior in
> this PR. The dependency flip to
> `@0xhoneyjar/loa-hounfour@^8.5.0` is authorized for a separate
> follow-up PR (Phase 17), not Phase 16.
>
> Companion docs:
> [`hounfour-response-intake.md`](./hounfour-response-intake.md)
> (the disposition counts, "accepted-with-adaptation" framing,
> and the post-intake upstream update recording rc.1 fired and
> v8.5.0 final shipped) and
> [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
> (the rc shadow-integration plan, now reframed as readiness
> evidence + the Phase 17 dependency-flip checklist).

## Why a delta doc

Phase 9 staged a Straylight-side proposal for what Hounfour should
ship as the canonical schema package. Jani responded with an
**accepted-with-adaptation** disposition: most primitives are
adopted, but a series of naming, versioning, scope, and shape
adaptations apply. Each adaptation is small on its own; together
they are the difference between "Straylight imports Hounfour
cleanly" and "Straylight imports Hounfour and silently breaks a
fixture or a vector."

This document pins each delta in one place so:

- the future Straylight rc-shadow-integration test branch (per
  [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md))
  has a single readable list to validate against;
- a future reviewer of either repo can see the exact deltas without
  re-reading the issue thread or diffing two cycles of schema
  drafts;
- both repos retain the freedom to evolve the deltas before
  v8.5.0-rc.1 — the doc captures the *current* deltas, not a
  contractual freeze.

## Delta table (summary)

| # | Delta | Owner | Phase 9 handoff position | v8.5.0 line position (rc.1 fired, final shipped) |
|---|---|---|---|---|
| 1 | Package version target | Hounfour | `@loa/hounfour@0.x` (0.1.x line) | `@0xhoneyjar/loa-hounfour@^8.5.0` (final shipped); the rc range `^8.5.0-rc.1` is now historical |
| 2 | `$id` naming convention | Hounfour | `straylight.<type>.v0` style implied by handoff | bare PascalCase `$id` (e.g. `Assertion`, `RecallReceipt`), not `straylight.<type>.v0`; all 234 published `$id`s now resolve under `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/` |
| 3 | Straylight-side alias / re-export | Straylight | direct rename of internal types to imported names | alias / re-export layer in Straylight; internal call sites unchanged |
| 4 | `CapabilityScope` harmonization | Hounfour | per-primitive scope hints | single harmonized `CapabilityScope` enum / discriminator across the wider Loa surface |
| 5 | `ForgetRecord` cardinality | Hounfour | single forget shape with reason | 4-variant `ForgetRecord` model; published in v8.5.0 final |
| 6 | `safeCanonicalize` semantics | Hounfour | unspecified exact bytes (NFC + JCS implied) | NFC + RFC 8785 (JCS) + 100 KB normative cap |
| 7 | `Challenge` deferral | Hounfour / Straylight | extract in cycle-004 | deferred to cycle-005 / v8.6.0 follow-on; stays local in Straylight |
| 8 | `EstateTransition` deferral | Hounfour / Straylight | extract in cycle-004 | deferred to cycle-005 / v8.6.0 follow-on; stays local in Straylight |
| 9 | Subpath import discipline | Straylight | import everything from `@loa/hounfour` root | import from explicit subpaths only (e.g. `@0xhoneyjar/loa-hounfour/schemas`) |
| 10 | `AgentIdentity` cross-version risk | Straylight | not yet considered | guard against transitive cross-version mismatches via `AgentIdentity`; alias as `Actor` if Hounfour names diverge |
| 11 | Constraint-ID collapse risk | Both | one constraint per primitive | guard against collapsing two distinct constraints (Straylight `lot_invariant` vs Hounfour-wide constraint IDs) onto one identifier |
| 12 | rc.1 net-new schemas | Hounfour | not yet enumerated | rc.1 added 15 net-new schemas across recall machinery, forget / commit / estate, and the assertion family (see §12) |
| 13 | `UnverifiedObligationsManifest` widening | Hounfour | single-evaluator-string assumption | `evaluator` widened to `runtime-deferred \| consumer \| library`; `reason` widened to `context_absent \| crypto_deferred \| integrity_deferred \| pattern_matching \| vocabulary_drift`; pattern-match by `rule_id` + `reason`, not by `evaluator` literal (see §13) |
| 14 | `ClaimGrounding` strict-additive fields | Hounfour | not yet considered | strict-additive `external_reference` / `external_uri` and `derived_inference` / `inference_basis` fields land in v8.5.0 final without breaking existing groundings (see §14) |
| 15 | v8.5.0 final shipped / dependency-flip eligibility | Both | not yet considered | `@0xhoneyjar/loa-hounfour@8.5.0` is the wedge dependency target; flip is authorized for a separate Phase 17 PR, not this PR (see §15) |

The numbered sections below pin each delta in detail.

## 1. Package version target: `^8.5.0` (final shipped), not `0.1.x`

The Phase 9 handoff at
[`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
proposed pinning `@loa/hounfour@0.x`. Jani's response targeted the
v8.5.0 line in the `@0xhoneyjar` org scope, and v8.5.0 final has
now shipped:

- target package: `@0xhoneyjar/loa-hounfour`
- target stable range: `^8.5.0` (now live;
  `@0xhoneyjar/loa-hounfour@8.5.0` is published, tag `v8.5.0`,
  `main` HEAD `ea98924d`)
- rc range: `^8.5.0-rc.1` (rc.1 fired at squash SHA `c94bcd22`;
  range is now historical, retained only for archival reference)

Implication for Straylight: any future package pin must use the
v8.5.0 line, not the 0.1.x line. The
[rc shadow-integration / dependency-flip checklist](./hounfour-rc-shadow-integration-checklist.md)
treats the rc.1 gate as **satisfied** and v8.5.0 final as
**shipped**, and the next planned package pin is the dependency
flip to `@0xhoneyjar/loa-hounfour@^8.5.0` in a separate Phase 17
PR.

This delta also implies Straylight cannot pin a 0.x line as a
"placeholder" — there is no 0.x line.

## 2. `$id` naming convention: bare PascalCase, not `straylight.<type>.v0`

The Phase 9 handoff at
[`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
treated schema `$id` as a Straylight-scoped namespace
(`straylight.<type>.v0` was the implicit pattern). Jani's response
moves to **bare PascalCase** `$id` values across the Hounfour
schema surface:

- `Assertion`, not `straylight.assertion.v0`
- `RecallReceipt`, not `straylight.recall_receipt.v0`
- `Keyring`, not `straylight.keyring.v0`
- `ForgetRecord`, not `straylight.forget_record.v0`
- `AuditEvent`, not `straylight.audit_event.v0` *(Phase 18: the
  shipped v8.5.x surface ships no `audit-event` schema; the
  Straylight fixture `audit-event-transition.json` is now formally
  classified by the inspector as `DISCOVERY_NOTE` -- informational,
  never a blocker. See
  [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
  §"Phase 18: boundary hardening".)*
- `CommitmentRoot`, not `straylight.commitment_root.v0`

Reasoning (Hounfour-side, recorded here for Straylight's intake):

- Hounfour will canonicalize across the wider Loa surface (Finn /
  Dixie / Freeside / eval / future onchain anchors), so the
  `straylight.*` namespace would be misleading: the schemas are
  **not** Straylight-scoped, they are Loa-scoped.
- Bare PascalCase `$id` is the convention shipped by the wider
  Hounfour package family.

Implication for Straylight: any local fixture or doc that prints
a Straylight-scoped `$id` will need to be migrated to the bare
form during the rc shadow-integration window. **No fixture is
migrated in Phase 16.**

## 3. Straylight-side alias / re-export strategy

Because the Hounfour names will be bare PascalCase and the
Straylight wedge already exports its primitive types from
`src/straylight/types.ts`, the cleanest migration path during the
rc window is:

- the wedge keeps its existing internal type names;
- a thin **alias / re-export layer** translates between
  `@0xhoneyjar/loa-hounfour` types and the wedge's existing names;
- internal call sites do not change.

This layer is **not added in Phase 16**. The Phase 16 deliverable
is the *strategy* — a future rc-shadow-integration PR will add the
layer in a test branch and validate that the wedge compiles
unchanged.

The alias layer also satisfies the
[non-flip rule](./hounfour-rc-shadow-integration-checklist.md):
flipping a single import boundary in one place (the alias module)
is reversible; rewriting every internal call site is not.

## 4. `CapabilityScope` harmonization

The Phase 9 handoff at
[`hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
treated capability scope as a per-primitive concept. Jani's
response harmonizes capability scope into a single
`CapabilityScope` discriminator across the wider Loa surface so
that:

- a single `CapabilityScope` value is comparable across `Keyring`,
  `Assertion`, `ForgetRecord`, `RecallRequest`, and Hounfour's
  ADD-NEW schemas;
- Finn's runtime gate, Dixie's BFF inspection surface, and
  Freeside's bot recall surface can all read the same scope value
  without per-surface translation;
- canonical hashing is not affected (scope is a typed enum-like
  value, not a free-form string).

Implication for Straylight:

- The wedge's current per-primitive capability fields will need to
  be mapped onto the harmonized `CapabilityScope` during the
  shadow-integration window.
- This is a typing / validation question, not a runtime semantics
  change — the wedge's `admit`, `classify`, `link`, `challenge`,
  `inherit`, `forget`, `recall` verbs do not move.
- If a wedge primitive has a capability concept that does not map
  cleanly to the harmonized scope, the rc-shadow-integration test
  branch must file a Hounfour blocker and **not** invent a local
  scope value to bridge the gap.

## 5. `ForgetRecord` 4-variant model

The Phase 9 handoff treated `ForgetRecord` as a single shape with
a reason string. Jani's response splits it into a **4-variant
model** (final variant names land in v8.5.0-rc.1; the cardinality
is fixed at 4).

Implication for Straylight:

- Straylight's existing forget machinery
  ([`tests/forget-flow.test.ts`](../../tests/forget-flow.test.ts))
  emits a single-shape `ForgetRecord` today. Under the 4-variant
  model, that shape will map to one specific variant, and the
  remaining three variants are net-new at the Hounfour boundary.
- The shadow-integration test branch must validate that the
  Straylight wedge's emitted `ForgetRecord` validates against the
  correct one of the four variants — not against the union.
- Validating against the wrong variant (or against the union as a
  shortcut) silently weakens forget semantics and must be refused
  at review.

## 6. `safeCanonicalize`: NFC + RFC 8785 + 100 KB normative cap

Canonical-bytes determinism is the load-bearing invariant under
every Hounfour-side schema, every Straylight signature, and every
Straylight audit-chain entry. Jani's response pins
`safeCanonicalize` precisely:

- **NFC** Unicode normalization on every string before
  canonicalization.
- **RFC 8785 (JSON Canonicalization Scheme, JCS)** for the
  canonical-bytes encoding.
- A **100 KB normative cap** on the canonical-bytes output;
  inputs that would exceed the cap fail closed at the canonicalize
  boundary, not at signature verification.

Implication for Straylight:

- The wedge's existing canonicalization helper must be checked
  against NFC + RFC 8785 + 100 KB during the shadow-integration
  window. If the wedge's helper is byte-identical, no work is
  required at flip-time. If it is not, the wedge migrates to the
  Hounfour helper (under alias) before flipping any call site.
- The 100 KB cap is **normative**: it is the rule, not a hint.
  Straylight tests under the shadow-integration window must
  include at least one vector at the cap boundary
  ([`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  pins this) to prove the cap is enforced fail-closed.
- Audit-chain bytes computed before vs. after the migration must
  match for every existing fixture. Any fixture that re-hashes
  differently is a Hounfour blocker, not a Straylight migration.

> **Phase 18 footnote.** `safeCanonicalize` remains deferred
> pending a confirmed Hounfour exported subpath. The v8.5.x
> exports map ships no `./canonicalize` or `./utilities` subpath;
> importing from the package root is forbidden by delta #9, and
> reaching into unexported internals is forbidden by the
> Phase 17B / Phase 18 user-facing constraint. The Phase 18
> inspector now records this as a structured `deferredSubpaths`
> entry with `gate: 'no-confirmed-subpath'`. See
> [`hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md)
> §"Phase 18: boundary hardening".

## 7. `Challenge` deferral to cycle-005 / v8.6.0 follow-on

The `Challenge` primitive is **deferred** to Hounfour cycle-005,
and the v8.6.0 forward pointer published with v8.5.0 final places
the `Challenge` layer (and related follow-on work) on that
release line. Until cycle-005 / v8.6.0 lands:

- Straylight keeps its current `Challenge` definition in
  `src/straylight/types.ts` and its current validator in
  `src/straylight/validators/`.
- The wedge's `challenge` verb, the conformance vectors that
  exercise it, and the audit-chain entries that follow from it all
  remain Straylight-owned.
- Neither the v8.5.0-rc.1 nor v8.5.0 final line carries a
  canonical `Challenge` schema for the wedge; the Phase 17
  shadow-integration / dependency-flip work must **not** validate
  `Challenge` against the v8.5.0 line.

This deferral is captured in
[`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
as a hard rule.

## 8. `EstateTransition` deferral to cycle-005 / v8.6.0 follow-on

The `EstateTransition` primitive is **deferred** to Hounfour
cycle-005, and rides the same v8.6.0 forward pointer as
`Challenge` (per delta #7). Until cycle-005 / v8.6.0 lands:

- Straylight keeps its current `EstateTransition` definition,
  transition machinery, transition receipts, and audit-chain
  semantics.
- The wedge's transition tests
  ([`tests/transition-receipts.test.ts`](../../tests/transition-receipts.test.ts),
  [`tests/quorum-and-timelock.test.ts`](../../tests/quorum-and-timelock.test.ts))
  remain Straylight-owned and Straylight-validated.
- Neither the v8.5.0-rc.1 nor v8.5.0 final line carries a
  canonical `EstateTransition` schema for the wedge; the Phase 17
  shadow-integration / dependency-flip work must **not** validate
  `EstateTransition` against the v8.5.0 line.

This deferral is also captured in the
[shadow-integration checklist](./hounfour-rc-shadow-integration-checklist.md).

## 9. Subpath import discipline

When the rc shadow-integration test branch flips imports inside an
alias module (per delta #3), it must do so via **explicit
subpaths**, not via the package root.

- Acceptable: `import { ... } from '@0xhoneyjar/loa-hounfour/schemas'`
- Acceptable: `import { ... } from '@0xhoneyjar/loa-hounfour/canonicalize'`
- Forbidden: `import * as Hounfour from '@0xhoneyjar/loa-hounfour'`

Reasoning:

- Subpath imports document which Hounfour surface the wedge
  depends on, which makes future deprecations local.
- Subpath imports avoid pulling in Hounfour's full ADD-NEW surface
  when Straylight only uses REUSE / EXTEND primitives during the
  shadow window.
- A package-root import would silently widen the wedge's coupling
  the moment Hounfour adds a new export.

This discipline applies at the **alias module boundary** only.
The wedge's internal call sites continue to import from the alias
module, not from `@0xhoneyjar/loa-hounfour` directly.

## 10. Cross-version transitive dependency risk through `AgentIdentity`

Hounfour's `AgentIdentity` schema is consumed transitively by other
Loa packages (Finn, Dixie, Freeside, eval). If Straylight pins
`@0xhoneyjar/loa-hounfour@^8.5.0-rc.1` while a sibling pins a
different `^8.5.0-rc.x`, the `AgentIdentity` shape can drift across
the dependency tree and produce two structurally identical but
nominally distinct types.

Implication for Straylight:

- During the shadow-integration test branch, the wedge must alias
  `AgentIdentity` as `Actor` (the wedge's existing name) at the
  alias-module boundary. The alias both decouples the wedge from
  the Hounfour name and prevents two transitively-imported
  `AgentIdentity` types from looking like the same nominal type
  to the wedge.
- If the wedge's `Actor` shape and Hounfour's `AgentIdentity`
  shape diverge during cycle-004, the shadow-integration branch
  files a Hounfour blocker rather than papering over the divergence
  with a runtime cast.

This delta is the single most likely source of a "compiles fine,
breaks at runtime" failure during the shadow window. The
[shadow-integration checklist](./hounfour-rc-shadow-integration-checklist.md)
calls it out explicitly.

## 11. Constraint-ID collapse risk

Hounfour will canonicalize constraint identifiers across the
wider Loa surface. The Phase 9 handoff used a Straylight-local
naming convention (e.g. `lot_invariant`, internal Straylight
constraint IDs) which may collide with Hounfour-wide constraint
IDs after harmonization.

Implication for Straylight:

- The shadow-integration test branch must check that every
  Straylight-emitted constraint ID either (a) matches a
  Hounfour-wide ID exactly and means the same thing, or (b)
  remains Straylight-local and is **not** referenced by any
  Hounfour schema.
- If a Straylight constraint ID and a Hounfour constraint ID
  share a name but diverge in semantics, this is a constraint-ID
  collapse and is a Hounfour blocker, not a Straylight migration.
- Examples of the failure mode this guards against:
  - Two distinct `lot_invariant` constraints (one Straylight-local,
    one Hounfour-wide) sharing an ID and silently being treated as
    the same constraint by a downstream validator.
  - Two distinct receipt-format constraints sharing an ID and
    silently passing one fixture vs. the other depending on import
    order.

This delta is, like delta #10, a "compiles fine, breaks at
runtime" risk and must be checked during the Phase 17
dependency-flip / shadow-integration work.

## 12. rc.1 net-new schemas (15 total)

v8.5.0-rc.1 (squash SHA `c94bcd22`) introduced **15 net-new
schemas** across three families. They were carried forward into
v8.5.0 final without renaming. The list is recorded here so the
Phase 17 dependency-flip PR can validate that each Straylight
fixture and conformance vector that *should* validate against one
of these schemas in fact does:

- **Recall machinery (5):** `ReceiptDetailLevel`, `SurfaceContext`,
  `RecallRequest`, `RecallPack`, `RecallReceipt`.
- **Forget / Commit / Estate (5):** `ForgetRecord`,
  `CommitmentType`, `CommitmentRoot`, `AgentEstateStatus`,
  `AgentEstate`.
- **Assertion family (5):** `PrivacyScope`, `RiskLevel`,
  `AssertionStatus`, `AssertionClass`, `Assertion`.

Implication for Straylight:

- Phase 16 ships **no** schema imports — the list is recorded for
  Phase 17.
- The `ForgetRecord` 4-variant cardinality from delta #5 is
  realized in this list; a Straylight-side `ForgetRecord` fixture
  validates against a single variant of the v8.5.0 final schema,
  not against the union.
- `Assertion` carries the FOLD-into-`Assertion` collapse from
  Jani's response (per
  [`hounfour-response-intake.md`](./hounfour-response-intake.md)):
  the `status: "candidate"` discriminator is the supported way to
  represent a candidate assertion in v8.5.0 final. There is no
  separate `CandidateAssertion` schema.

## 13. `UnverifiedObligationsManifest` evaluator / reason widening

In v8.5.0-rc.1 (and carried into v8.5.0 final), the
`UnverifiedObligationsManifest` schema widened two fields the
Straylight wedge currently emits:

- `evaluator` now accepts the values
  `runtime-deferred | consumer | library`.
- `reason` now accepts the values
  `context_absent | crypto_deferred | integrity_deferred |
  pattern_matching | vocabulary_drift`.

Hounfour's published migration guidance is:
**prefer pattern matching by `rule_id` + `reason`, not by literal
`evaluator` value.** The `evaluator` axis is intentionally
underspecified compared to `reason`; pattern matching by
`evaluator` is brittle to future widening, while `rule_id` +
`reason` is stable.

Implication for Straylight:

- The wedge's existing emit sites for unverified-obligation
  manifests must be audited (under Phase 17, not under this PR)
  to ensure they emit a value in the widened `reason` set rather
  than relying on legacy `evaluator` literals.
- Any Straylight-side test or fixture that pattern-matches a
  manifest by `evaluator === "<literal>"` must be migrated under
  Phase 17 to match by `rule_id` + `reason`.
- Phase 16 ships **no** code change against this widening; the
  audit and migration are Phase 17 work. Recording the widening
  here keeps the Phase 17 PR from re-discovering it.

## 14. `ClaimGrounding` strict-additive `external_reference` / `external_uri` and `derived_inference` / `inference_basis`

v8.5.0 final's `ClaimGrounding` schema adds two additive field
pairs without removing or renaming any existing field, and without
changing the validation semantics of an existing `ClaimGrounding`
that omits them:

- `external_reference` / `external_uri` — a strict-additive pair
  for grounding a claim against an external reference URI.
- `derived_inference` / `inference_basis` — a strict-additive pair
  for grounding a claim against a derived inference and its
  documented basis.

Both pairs are **strict-additive**: a Straylight fixture that
omits them validates as cleanly against v8.5.0 final
`ClaimGrounding` as it did against the cycle-004 draft.

Implication for Straylight:

- Phase 16 makes **no** ClaimGrounding fixture changes. The pairs
  are recorded so the Phase 17 dependency-flip PR can opt fixtures
  in (or leave them omitted) on a fixture-by-fixture basis without
  re-deriving the additive guarantee.
- A Straylight test that asserts the *absence* of either pair on
  legacy fixtures must remain green under v8.5.0 final — if a test
  ever asserts these fields are required, that is a Hounfour
  blocker, not an additive migration.

## 15. v8.5.0 final shipped / dependency-flip eligibility (Phase 17, not Phase 16)

After Jani's response on issue #70, Hounfour fired
**v8.5.0-rc.1** (squash SHA `c94bcd22`) and then shipped **v8.5.0
final**:

- package: `@0xhoneyjar/loa-hounfour@8.5.0`
- tag: `v8.5.0`
- `main` HEAD: `ea98924d`
- `$id` resolution: all 234 published `$id` URIs resolve under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`
- forward pointer: v8.6.0 carries `Challenge` (per delta #7) and
  `EstateTransition` (per delta #8) and related follow-on work.

Implication for Straylight:

- The wedge's dependency flip to
  `@0xhoneyjar/loa-hounfour@^8.5.0` is **eligible** as of v8.5.0
  final shipping. It is **not** performed in this PR.
- The flip is authorized for **Phase 17** — a separate follow-up
  PR on Straylight's timeline. Phase 17 is where the alias /
  re-export module lands (delta #3), where the subpath import
  discipline is applied (delta #9), and where the `AgentIdentity`
  ↔ `Actor` alias (delta #10) and constraint-ID checks (delta
  #11) are validated against Hounfour's shipped validators.
- Phase 16 (this PR) does not add
  `@0xhoneyjar/loa-hounfour` to `package.json`, does not flip
  any wedge import, and does not change any Phase 0–15 runtime
  behavior. The deltas above are recorded so a future reviewer of
  Phase 17 has a single readable list.

## What this doc is *not*

- **Not** a Hounfour-side spec. The canonical Hounfour spec is
  whatever Hounfour shipped in v8.5.0 final
  (`@0xhoneyjar/loa-hounfour@8.5.0`, tag `v8.5.0`, `$id`s under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`). This doc
  is the Straylight-side intake of the deltas as of v8.5.0 final.
- **Not** a contract pin. The contract is the v8.5.0 tag; this
  doc is a readiness artifact that helps the Phase 17 dependency-
  flip PR validate the v8.5.0 line.
- **Not** a Straylight runtime change. Phase 16 ships docs and a
  printer script; no runtime imports change in this PR. The
  dependency flip is Phase 17.
- **Not** a license to flip imports inside this PR. Imports flip
  only inside the Phase 17 follow-up PR, behind the alias module,
  using subpath imports (delta #9).

## Cross-references

- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — the disposition counts and "accepted-with-adaptation" framing.
- [`hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md)
  — the checklist that consumes this delta table during the rc
  window.
- [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — the original Phase 9 handoff (the input that Jani's response
  adapts).
- [`hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
  — Phase 9 mapping table (the per-primitive Phase 9 view that
  these deltas adapt).
- [`docs/schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md)
  — Phase 6/7/8 extraction plan (the Straylight-side input).
- [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  — Hounfour-side filed issue.
