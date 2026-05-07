# Hounfour rc shadow-integration / dependency-flip checklist

> Status: Phase 16. **Readiness evidence + Phase 17 dependency-
> flip checklist only, in `loa-straylight`.** This document was
> originally staged as the future v8.5.0-rc.1 shadow-integration
> window for `loa-straylight`. As of the post-intake upstream
> update, **v8.5.0-rc.1 has fired** (squash SHA `c94bcd22` on
> `loa-hounfour`) and **v8.5.0 final has shipped**
> (`@0xhoneyjar/loa-hounfour@8.5.0`, tag `v8.5.0`, `main` HEAD
> `ea98924d`, `$id`s under
> `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`). The
> checklist is now reframed as (a) **readiness evidence** for
> Phase 16 and (b) the **dependency-flip checklist for Phase 17**,
> the separate follow-up PR that will perform the actual import
> flip on Straylight's timeline.
>
> Phase 16 itself remains scoped to docs / readiness only and is
> **not** Hounfour integration: **this PR does not import from
> `@0xhoneyjar/loa-hounfour`, does not add it to `package.json`,
> and does not change any Phase 0–15 runtime behavior.** Every
> shadow-integration step below is what a future Phase 17 test
> branch will run, not what Phase 16 runs.
>
> Companion docs:
> [`hounfour-response-intake.md`](./hounfour-response-intake.md)
> (disposition counts, "accepted-with-adaptation" framing, and
> the post-intake upstream update recording rc.1 fired and v8.5.0
> final shipped) and
> [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
> (per-delta accepted-with-adaptation table updated for v8.5.0
> final).

## What "shadow integration" means here

A **shadow integration** is a one-shot test branch that:

- pins `@0xhoneyjar/loa-hounfour@^8.5.0` (now that v8.5.0 final
  has shipped — historically the rc range `^8.5.0-rc.1` was the
  intended pin during the rc window) for the duration of the
  branch only;
- imports a small alias / re-export layer (per delta #3 in
  [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md))
  that translates between the wedge's existing internal type names
  and Hounfour's bare-PascalCase `$id` names;
- runs the existing Straylight test suite, the existing
  conformance vectors, and the existing schema-candidate fixtures
  against the Hounfour validators;
- does **not** flip any main-branch import inside Phase 16;
- belongs to the **Phase 17** follow-up PR — a separate PR on
  Straylight's timeline whose scope is exactly the dependency
  flip + alias module + shadow-integration evidence, not Phase
  16's docs / readiness scope.

The shadow window is the only place Straylight validates against
the v8.5.0 line. Main-branch Straylight remains the source of
truth for primitive semantics until the Phase 17 follow-up PR
lands the dependency flip.

## Sequencing rules

### Gate status (post-intake upstream update)

The two original wait-gates are now both **satisfied**:

- ✅ **PR-A2.1 reuse-audit doc:** published on the Hounfour side
  as part of cycle-004 (the per-primitive REUSE / EXTEND /
  ADD-NEW / DEFER / FOLD list backing the disposition summary in
  [`hounfour-response-intake.md`](./hounfour-response-intake.md)).
- ✅ **v8.5.0-rc.1 tag:** fired at squash SHA `c94bcd22` on
  `loa-hounfour`. The shadow-integration window opened on rc.1
  and v8.5.0 final has now shipped
  (`@0xhoneyjar/loa-hounfour@8.5.0`, tag `v8.5.0`, `main` HEAD
  `ea98924d`, `$id`s under
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`).

The rules below are retained as **readiness evidence** (so a
future reviewer of this PR can see what we waited for and why) and
as the **Phase 17 dependency-flip checklist** (so the follow-up PR
runs them against the now-shipped v8.5.0 line, not against a
moving target). Phase 16 itself does not run any of them — Phase
16 ships docs only.

### 1. Wait for the Hounfour PR-A2.1 reuse-audit doc — **satisfied**

Before opening the dependency-flip / shadow-integration test
branch, a reviewer must read the Hounfour PR-A2.1 reuse-audit doc
(the per-primitive disposition published on the Hounfour side as
part of cycle-004). The doc is now published.

Until that doc was published:

- the per-primitive REUSE / EXTEND / ADD-NEW / DEFER / FOLD list
  was not pinned;
- the Straylight-side intake at
  [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  was the *summary*, not the contract;
- opening a shadow-integration test branch would have risked
  validating against a moving target.

The rule is preserved here as readiness evidence: the gate was
real, the gate is satisfied, and Phase 17 may consume the
reuse-audit doc.

### 2. Wait for the v8.5.0-rc.1 tag — **satisfied**

Before pinning `@0xhoneyjar/loa-hounfour` in any branch — even a
test branch — the v8.5.0-rc.1 tag had to exist on the Hounfour
side. **The rc.1 tag landed at squash SHA `c94bcd22`, and v8.5.0
final has now shipped on top of it.**

Pinning against a non-tagged commit, a moving branch, or a draft
tag remains forbidden:

- a moving target produces non-reproducible test runs across the
  shadow window;
- a non-tagged commit can be force-pushed away, which would
  silently invalidate every Straylight test that pinned it;
- a draft tag carries no commitment from the Hounfour side that
  the surface is rc-stable.

The rule is preserved here as readiness evidence: the gate was
real, the gate is satisfied, and Phase 17 may pin the v8.5.0 line.

### 3. Pin `@0xhoneyjar/loa-hounfour` to `^8.5.0` in the Phase 17 test branch only

With v8.5.0 final shipped, the Phase 17 dependency-flip test
branch may pin `@0xhoneyjar/loa-hounfour@^8.5.0`.

Constraints:

- the pin lives **only** on the Phase 17 test branch (or on the
  Phase 17 PR's branch) — never on a Phase 16 docs-only PR like
  this one;
- the pin uses the stable range (`^8.5.0`); the rc range
  (`^8.5.0-rc.1`) is now historical, the 0.x range does not exist
  (see delta #1 in
  [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md));
- if Phase 17 runs as a shadow-integration-then-revert test branch
  (rather than a flip-and-keep PR), the pin is reverted before the
  test branch is closed;
- the pin lives in `package.json` only — not in a hand-written
  type alias, not in a vendored copy, not in a git submodule.

**This Phase 16 PR does not pin
`@0xhoneyjar/loa-hounfour`. The pin is Phase 17's job.**

### 4. Map Hounfour imports / subpaths (Phase 17)

Inside the Phase 17 test branch, every Hounfour import goes
through an **alias / re-export module** (per delta #3 in
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md))
and uses **explicit subpaths** (per delta #9):

- alias module path lives inside the wedge (suggested:
  `src/straylight/hounfour-alias.ts` for the test branch only);
- imports inside the alias module use subpaths such as
  `@0xhoneyjar/loa-hounfour/schemas`,
  `@0xhoneyjar/loa-hounfour/canonicalize`, etc.;
- no internal wedge call site imports from
  `@0xhoneyjar/loa-hounfour` directly during the shadow window;
- if a needed Hounfour subpath does not exist, the test branch
  files a Hounfour blocker rather than reaching into the package
  root.

### 5. Alias `AgentIdentity` as `Actor` if needed

Per delta #10 in
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
the wedge's existing `Actor` shape and Hounfour's `AgentIdentity`
shape are at risk of cross-version transitive drift.

The alias module aliases `AgentIdentity` as `Actor` so:

- the wedge's internal call sites do not change;
- two transitively-imported `AgentIdentity` types (e.g. one via
  Hounfour, one via a future sibling pinning a different rc patch)
  cannot silently merge into a single nominal type at the wedge;
- if the alias cannot be applied because the shapes diverge, this
  is a Hounfour blocker, not a runtime cast.

The alias is a delta-#10 mitigation. It is not a contract pin and
it is not part of the long-term wedge surface — when v8.5.0 stable
lands and the wedge migrates, the alias module is rewritten or
removed under a separate planning artifact.

### 6. Test schema candidates against Hounfour validators

Inside the test branch, the existing schema-candidate fixtures at
[`fixtures/schema-candidates/`](../../fixtures/schema-candidates/)
must validate against Hounfour validators imported via the alias
module:

- every REUSE primitive's existing fixture validates clean;
- every EXTEND primitive's existing fixture validates clean (the
  EXTEND fields are optional from the Straylight side; see
  [`hounfour-response-intake.md`](./hounfour-response-intake.md));
- the FOLD case (`CandidateAssertion` → `Assertion` with
  `status: "candidate"`) validates against the single `Assertion`
  schema, not against a separate `CandidateAssertion` schema;
- DEFER primitives (`Challenge`, `EstateTransition`, and the four
  other deferred names) are **not** validated against Hounfour at
  all (per rule 9 below).

Any fixture that fails to validate is investigated as one of:
(a) a Hounfour blocker, (b) a Straylight migration that the
adaptation-delta doc missed, or (c) an EXTEND ambiguity that
Hounfour PR-A2.1 needs to clarify.

### 7. Test conformance vectors

Inside the test branch, the existing Hounfour conformance vectors
at
[`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
must validate against Hounfour validators imported via the alias
module:

- the count and `expected_valid` outcome of each vector is
  preserved;
- vector files are not edited during the shadow window — the
  shadow window validates *against* them, it does not migrate
  them;
- if a vector fails, this is a Hounfour blocker (the vectors are
  the Phase 8 conformance contract that the Phase 9 handoff
  proposed Hounfour adopt).

### 8. Test canonical hash determinism

Inside the test branch, canonical hashes computed by the wedge's
existing helpers must match canonical hashes computed by
Hounfour's `safeCanonicalize` (per delta #6 in
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md))
for every existing fixture.

- hash-determinism check runs before and after migrating any
  helper to use the Hounfour canonicalize;
- mismatching bytes are a Hounfour blocker, not a Straylight
  migration;
- the Straylight audit-chain entries
  ([`tests/audit-and-receipt.test.ts`](../../tests/audit-and-receipt.test.ts),
  [`tests/jsonl-durability.test.ts`](../../tests/jsonl-durability.test.ts),
  [`tests/transition-receipts.test.ts`](../../tests/transition-receipts.test.ts))
  must replay byte-identically before vs. after migration.

### 9. Test 100 KB `safeCanonicalize` cap behavior

Per delta #6 in
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
`safeCanonicalize` enforces a **100 KB normative cap**.

Inside the test branch, at least one vector must exercise the cap
boundary fail-closed:

- an input that canonicalizes to slightly under 100 KB succeeds;
- an input that canonicalizes to slightly over 100 KB fails at
  the canonicalize boundary, **not** at signature verification;
- the failure is observable as a typed canonicalize error, not
  as a downstream signature mismatch.

A signature-mismatch failure under an oversized canonical input is
itself a Hounfour blocker — the cap must be enforced at the
canonicalize step, not deeper.

### 10. Keep `Challenge` and `EstateTransition` local until cycle-005

Per deltas #7 and #8 in
[`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md),
`Challenge` and `EstateTransition` are deferred to Hounfour
cycle-005 and stay local in Straylight throughout the v8.5.0-rc.1
shadow-integration window.

The shadow-integration test branch must not:

- import `Challenge` from `@0xhoneyjar/loa-hounfour`;
- import `EstateTransition` from `@0xhoneyjar/loa-hounfour`;
- alias either of them through the alias module;
- validate either of them against any Hounfour validator;
- treat any Hounfour `Challenge` / `EstateTransition` schema in
  the v8.5.0-rc.1 line as canonical for the wedge.

If a Hounfour rc.1 build accidentally ships a `Challenge` or
`EstateTransition` schema, this does not authorize Straylight to
validate against it — the deferral is a Straylight-side
constraint, not a Hounfour-side capability question.

### 11. File blockers before the final tag — **historical** / Phase 17 records new findings against v8.5.0 final

The original rule required that issues surfaced by rules 6–9
(validator failures, hash divergences, cap-behavior failures,
ambiguous EXTEND fields, constraint-ID collapses) be filed as a
Hounfour-side blocker **before** the v8.5.0 stable tag was cut.
**v8.5.0 final has now shipped**, so the original "before final
tag" gate is closed for the v8.5.0 line itself.

For Phase 17, the rule is **reframed** as: any new issue surfaced
by Phase 17's shadow-integration evidence must be filed against
the live `@0xhoneyjar/loa-hounfour@8.5.0` package, with a
reproducible vector or fixture, and triaged by Hounfour as either
a v8.5.x patch or a v8.6.0 follow-on (the v8.6.0 line is where
`Challenge` and `EstateTransition` are queued — see deltas #7 /
#8). The original rule is preserved here as readiness evidence.

A blocker is "filed" when:

- the issue is opened on the Hounfour repo with a reproducible
  vector or fixture;
- the issue is linked back to this checklist (and to
  [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  if a specific delta surfaced it);
- the Phase 17 test branch is either closed (if the work was
  shadow-integration-then-revert) or held as a draft PR with the
  blocker linked (if the work was flip-and-keep).

If Phase 17 runs as a shadow-integration-then-revert branch, that
branch must not be merged into `main`. Its purpose is to surface
blockers; once it has done that, it is discarded.

## Out-of-scope for this Phase 16 PR

Phase 16 is **docs / readiness only**. The following are
explicitly out of scope for this PR and are deferred to Phase 17
(or, where applicable, a later cycle):

- adding `@0xhoneyjar/loa-hounfour` to `package.json`;
- pinning any version of `@0xhoneyjar/loa-hounfour` (rc.1 or
  v8.5.0 final), even on a feature branch attached to this PR;
- flipping any wedge import to come from
  `@0xhoneyjar/loa-hounfour`;
- migrating any production fixture to Hounfour-canonical bytes;
- replacing `src/straylight/types.ts` exports with Hounfour
  re-exports;
- removing the wedge's existing class validators;
- treating Hounfour's `$id` naming as canonical inside Straylight
  fixtures or docs (other than this checklist and the companion
  Phase 16 docs);
- absorbing `Challenge` or `EstateTransition` from Hounfour;
- resolving constraint-ID collisions by renaming the Straylight
  side rather than filing a blocker.

Each of those is authorized for **Phase 17** — the separate
follow-up dependency-flip PR — under the rules in this checklist.

## Cross-references

- [`hounfour-response-intake.md`](./hounfour-response-intake.md)
  — the disposition counts and "accepted-with-adaptation" framing.
- [`hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md)
  — the per-delta accepted-with-adaptation table this checklist
  consumes.
- [`hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  — the original Phase 9 handoff.
- [`hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
  — the Phase 9 PR checklist (companion to the Phase 9 handoff).
- [`hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md)
  — the Phase 9 mapping table.
- [`cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — cross-repo index, updated in Phase 16 with the rc.1 status.
- [`cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — implementation order, updated in Phase 16 with the rc.1 wait
  condition.
- [`docs/schema-candidates/hounfour-conformance-vectors.md`](../schema-candidates/hounfour-conformance-vectors.md)
  — the conformance-vector contract that rule 7 validates against.
- [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
  — Hounfour-side filed issue.
