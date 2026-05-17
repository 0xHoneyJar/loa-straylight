# ADR-026A — Runtime recall-intake subpath (Phase 26A-2)

## Status

Accepted-for-Phase-26A-2.

This ADR is the **Phase 26A-2 runtime recall-intake subpath
authorization-record**. It is a **docs-only authorization
reference**: it authorizes — but does not implement — exactly one
future runtime subpath at `@loa/straylight/runtime/recall-intake`,
exposing exactly the handler set Dixie needs at MVP, gated to
Dixie-only consumption, marked experimental, with a recorded
migration / retirement path back to Finn when ADR-022E gate #9
fires.

ADR-026A *targets* / *addresses* Flatline **SKP-005** by recording
the proposed experimental, pre-Finn, Dixie-only runtime-subpath
surface design. SKP-005 closure is asserted **only** after all
three of the following hold:

1. ADR-026A is drafted (this ADR), AND
2. a real 3-model Flatline pass on the ADR-026A PR returns
   **PASS** or **REVISE-with-resolution**, AND
3. the ADR-026A PR merges.

Until all three hold, ADR-026A *targets* / *addresses* / *records
the proposed closure design* for SKP-005; it does **not** claim
closure. ADR-026A does **not** close SKP-002, SKP-003, or SKP-004
— those remain Phase 26A-1 prerequisites for the future Dixie
recall-intake endpoint PR.

ADR-026A is **substantive-scope widening** on the package public
surface: it authorizes a new runtime subpath and a bounded set of
runtime value exports. Per
[`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
§"Decision" §2.2, net-new entries on the published package's
public surface require their own authorizing ADR. ADR-026A is
exactly that authorizing ADR; Phase 26A-0 supplies the
operator-authority *trigger*, ADR-026A supplies the bounded
*scope*. ADR-026A does **not** itself implement the subpath; the
later Straylight implementation PR does.

ADR-026A does **not** edit
[`../../package.json`](../../package.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../tsconfig.json`](../../tsconfig.json),
[`../../tsconfig.build.json`](../../tsconfig.build.json),
[`../../vitest.config.ts`](../../vitest.config.ts),
[`../../.npmrc`](../../.npmrc),
[`../../.gitignore`](../../.gitignore),
[`../../.loa.config.yaml`](../../.loa.config.yaml), any file
under [`../../src/`](../../src/), any file under
[`../../tests/`](../../tests/), any file under
[`../../scripts/`](../../scripts/), any file under
[`../../fixtures/`](../../fixtures/), any committed declaration
under [`../../dist-types/`](../../dist-types/),
[`../mvp/package-boundary.md`](../mvp/package-boundary.md), or
[`../mvp/threat-model.md`](../mvp/threat-model.md). It edits no
prior ADR and no prior handoff except the two append-only updates
listed in §"Decision" §1 below. It cuts no tag, pushes no tag,
publishes no package, creates no GitHub Release, files no GitHub
issue / comment / PR, bumps no Hounfour dependency, and does not
touch
[`../../.loa`](../../.loa) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`.

A pre-merge real 3-model Flatline / Bridgebuilder pass is performed
against this ADR and the companion handoff
([`../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md`](../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md))
before merge, per Phase 26A-0 §"Decision" §3 (the pre-merge
Flatline requirement applies to docs-only changes that *create
authorization*, which ADR-026A does).

ADR-026A sits on top of ADR-025A, ADR-025B, ADR-024A through
ADR-024K, ADR-022A through ADR-022E, ADR-020A through ADR-020E,
ADR-026A0 (Phase 26A-0), and the Phase 26A-1 threat-model
amendment, without modifying any of them.

## Context

### Why ADR-026A exists

Recall intake is the one runtime call Dixie needs from the wedge
to serve a recall request. After Phase 24H, both the root subpath
`@loa/straylight` and the `./host` subpath are exposed under
`"types"`-only conditions; the package has no `"main"` field, no
`dist/`, and no runtime conditions in its `exports` map. A
consumer that attempts a runtime / value import of either subpath
fails to resolve with `ERR_PACKAGE_PATH_NOT_EXPORTED`, by design.
This is the load-bearing Phase 24H posture that ADR-024G, ADR-024H,
and the Phase 24H package-exports test pin.

That posture is correct for type-only consumption (Dixie PR #99
flipped its dependency under it; Phase 24L recorded the result),
but it leaves Dixie unable to actually *call* a wedge function at
runtime. Finn is the eventual runtime-enforcement owner per
ADR-022B and ADR-022E gate #9. Finn is not yet wired; gate #9
remains held; no successor ADR has fired it.

The MVP needs a recall path *before* Finn is wired. Option C2 is
the narrowest viable shape: exactly one runtime subpath at
`@loa/straylight/runtime/recall-intake`, exposing only the handler
set Dixie needs, gated to Dixie-only consumption, marked
experimental, with a recorded migration / retirement path to Finn.

### Trigger evidence (Future-ADR contract per Phase 26A-0)

Per
[`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
§"Decision" §5, a future ADR that cites Phase 26A-0 / ADR-026A0
for operator-authority trigger evidence must still provide its own
independent trigger. ADR-026A's three-leg trigger:

1. **Operator-authority leg.** ADR-026A0 / Phase 26A-0 (PR #41,
   merged) is the stable in-repo, citable source for the
   operator-authority discipline that governs the Loa stack
   during the Straylight MVP. ADR-026A operates inside that
   discipline.
2. **Threat-model leg.** Phase 26A-1 / amended
   [`../mvp/threat-model.md`](../mvp/threat-model.md) (PR #42,
   merged) records the threat-model prerequisites surfaced by
   Flatline SKP-002 (resource exhaustion / DoS / unbounded
   `InMemoryStorage`), SKP-003 (replay semantics), and SKP-004
   (concurrency posture) for the future Dixie recall-intake
   endpoint, plus the T9 persistence-posture amendment.
   ADR-026A's §11 maps its scope onto those rows.
3. **Independent trigger.** Dixie cannot call recall intake at
   runtime today; the Phase 24H type-only posture is correct for
   type consumption but blocks runtime consumption. Finn is not
   yet wired; ADR-022E gate #9 is not yet ready to fire. Dixie
   is the selected MVP wedge consumer under Option C2. ADR-026A
   records the bounded Dixie-first exception; it does not claim
   Finn-first or Straylight-only alternatives were impossible.

### Phase 15 narrowing for this MVP slice

The Phase 15 sibling-repo implementation order
(Hounfour → Finn → Dixie → Freeside) recorded in
[`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
was authored under the assumption Finn would ship before Dixie
wired anything against the wedge. ADR-026A narrows Phase 15
*only for this MVP slice*: a Dixie-first recall-intake path is
authorized as a pre-Finn MVP exception, bounded to the single
`handleRecallIntake` handler.

The narrowing does **not** authorize:

- Dixie ahead of Finn for any other handler;
- Dixie taking ownership of any semantic primitive;
- skipping the Finn migration when ADR-022E gate #9 fires;
- any general reorder of the Phase 15 sequence.

The cross-reference appended to
[`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
records this narrowing on the in-repo coordination record so a
sibling-repo reviewer can refuse a citation that overreaches the
MVP slice.

### Why a docs-only authorization-record is the right shape here

ADR-026A is *authorization* + *bounded scope* + *required
test invariants* + *required experimental marking* + *required
non-Dixie refusal mechanism* + *required migration path* — but
not *implementation*. Splitting authorization from implementation
is the same shape Phase 26A-0 used (operator-authority record,
not edit) and Phase 26A-1 used (threat-model prerequisites
record, not endpoint wiring). Reviewers of the later Straylight
implementation PR will need a stable, citable scope reference;
ADR-026A is that reference.

The implementation PR will:

- add the `exports` map entry per §4;
- add the runtime barrel under
  `src/straylight/runtime/recall-intake/index.ts` per §3;
- add tests under `tests/` per §10;
- add the experimental marker per §6 (JSDoc, surviving `tsc`
  emission; README; `package-boundary.md`);
- update `docs/mvp/package-boundary.md` in the same diff that
  introduces the `exports` map entry, per §6.d;
- pin the concrete non-Dixie refusal mechanism per §7.

ADR-026A pre-authorizes the *scope* of those changes; it does not
pre-author them.

## Decision

### 1. File set

ADR-026A establishes the following file set, and only this file
set:

- **New:** this ADR
  ([`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)).
- **New:** the companion handoff
  ([`../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md`](../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md)).
- **Append-only:**
  [`../handoffs/README.md`](../handoffs/README.md) — Phase 26A-2
  index entry only.
- **Append-only:**
  [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — narrow cross-reference recording the MVP-slice narrowing of
  Phase 15 ordering. Bounded to recall intake. No general
  reorder.

No prior ADR is edited. No prior handoff is edited except the
two append-only updates above.
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
**not** edited by ADR-026A; that edit is deferred to the later
implementation PR per §6.d.
[`../mvp/threat-model.md`](../mvp/threat-model.md) is **not**
edited by ADR-026A; Phase 26A-1 already amended it.

### 2. Authorization

A later Straylight implementation PR is authorized to add
**exactly one** runtime subpath:

> `@loa/straylight/runtime/recall-intake`

No other runtime subpath is authorized. Root `.` and `./host`
**must** remain `"types"`-only.

### 3. Runtime barrel value-export allowlist

The barrel at `src/straylight/runtime/recall-intake/index.ts`
**may** export at runtime exactly:

- `handleRecallIntake` — required; the one MVP runtime
  entrypoint.
- `createInMemoryRecallIntakeDeps` — optional; only if a
  separate justification in the implementation PR shows the
  helper avoids leaking `EstateStore` / `AuditLog` /
  `JsonlStorage` value imports to consumers.

Types **may** be re-exported as types only (per `import type`).

The following **must not** be exported as runtime values from
this subpath without a separate, future, expanding ADR:

`executeRecall`, `EstateStore`, `AuditLog`, `JsonlStorage`,
`dispositionFor`, `verifyChain`, `computeCommitmentRoot`,
`devSign`, `devSignatureFor`, `validateCandidateAssertion`,
`validateRecallRequest`, `evaluateCompetence`, `InMemoryStorage`,
`loadBundle`, `saveBundle`, and every other section 1–11 entry
of the wedge stable public API per
[`../mvp/package-boundary.md`](../mvp/package-boundary.md).

### 4. Export-condition shape

The package `exports` map entry for the subpath MUST use,
unless a successor authorizing ADR or a pre-merge Flatline pass
on the implementation PR specifically reverses this:

```json
{
  "./runtime/recall-intake": {
    "types":  "./dist-types/src/straylight/runtime/recall-intake/index.d.ts",
    "import": "./dist/src/straylight/runtime/recall-intake/index.js"
  }
}
```

Use `"import"` (ESM-only) rather than `"default"`, because:

- the package is `"type": "module"`;
- `"import"` is narrower than `"default"` (no CJS fallback, no
  non-Node consumers);
- narrower is the safer MVP posture.

If the pre-merge Flatline pass against the ADR-026A PR or the
later implementation PR specifically reverses this and requires
`"default"` instead, the implementation PR follows Flatline;
ADR-026A does not pre-bind that choice against a Flatline
finding.

### 5. Type-only subpaths preserved

Root `.` MUST remain `{"types": "..."}`-only.
`./host` MUST remain `{"types": "..."}`-only.

Adding any runtime condition under either of those is
out-of-scope for ADR-026A and requires its own future ADR.

### 6. Experimental marking (proposed SKP-005 closure design)

The implementation PR MUST mark
`@loa/straylight/runtime/recall-intake` as experimental and
pre-Finn, in **all four** places:

- **a.** JSDoc on the runtime barrel and on every exported
  handler / helper (`@experimental`, plus a sentence calling out
  pre-Finn / Dixie-only / migration to Finn).
- **b.** Emitted `.d.ts` declarations: the JSDoc must survive
  `tsc` emission so consumers see the marker through
  `import type`. The implementation PR adds a test that reads
  the emitted `.d.ts` and asserts the marker survives (per §10.g).
- **c.** `README.md` — add a "Runtime subpath (experimental,
  pre-Finn, Dixie-only)" section.
- **d.** [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  — add a "Runtime subpath — `./runtime/recall-intake` (Phase
  26A-2 implementation, experimental, pre-Finn, Dixie-only)"
  section in the same diff that introduces the `exports` map
  entry. ADR-026A explicitly does NOT pre-author this doc text;
  the implementation PR does.

### 7. Dixie-only consumption (proposed SKP-005 closure design)

The mechanism MUST be (a) **unforgeable by a non-Dixie caller
without operator access**, (b) **observable in tests** — meaning
its enforcement is exercisable from a test harness — and (c)
**localized to the runtime barrel boundary** rather than relying
on transitive trust through other handlers. Caller-identity
strings, package-name checks, and dependency-object structural
shape alone do not satisfy (a).

The runtime subpath does **not** magically know who is calling
it. The later implementation PR MUST define and test a concrete
non-Dixie refusal mechanism — a runtime guard, a deps-injection
contract that only Dixie can credibly satisfy, a caller-identity
check at the handler boundary, or equivalent — and must
demonstrate that mechanism against all applicable non-Dixie
attack shapes described below.

The mechanism MUST fail closed against direct imports from a
non-Dixie package, forged caller metadata, fake Dixie wrapper
packages, and dependency-object spoofing **unless** the
dependency contract contains an unforgeable or environment-bound
capability controlled by Dixie deployment (for example, a
process-injected secret, a cryptographic handshake, or a runtime
token Dixie alone can issue). A purely type-level marker, a
package-name string check, a caller-provided header, or a
convention-only dependency shape is **not** sufficient. The
implementation PR MUST document a threat model for the chosen
mechanism and MUST include tests that exercise **all applicable
attack shapes** among: (i) direct ESM
`import('@loa/straylight/runtime/recall-intake')` from a
non-Dixie test fixture, (ii) a forged caller-metadata shape, and
(iii) a fake `"dixie"`-named wrapper package importing the
subpath. If the chosen mechanism uses dependency injection or
dependency objects, the tests MUST also include
dependency-object spoofing. If the implementation claims any
listed attack shape is not applicable, the implementation PR
MUST explain why and Flatline MAY accept that explanation only
if the justification independently establishes that the attack
shape cannot reach the runtime barrel under the chosen
mechanism; absent such a finding, the shape remains required
and the block-on-failure rule applies. If
the implementation PR cannot demonstrate fail-closed behavior
across the applicable attack shapes, the implementation PR is
**blocked** and ADR-026A may NOT be cited as sufficient
authorization.

If the implementation PR cannot provide a credible runtime or
dependency-contract mechanism for non-Dixie refusal, **the
implementation PR is blocked** and ADR-026A may NOT be cited as
sufficient authorization. In that case, the implementation PR
must escalate back to a successor authorizing ADR (or to a
revision of this ADR) before proceeding.

ADR-026A pins the requirement and the block-on-failure rule;
the implementation PR pins the mechanism and the tests.

### 8. Finn migration / retirement path (proposed SKP-005 closure design)

ADR-026A records:

- the runtime subpath is a pre-Finn MVP exception, **not** a
  permanent lane transfer;
- Dixie does **not** become a semantic / runtime authority;
- Straylight remains the semantic wedge owner;
- Finn remains the eventual runtime-enforcement owner per
  ADR-022B and ADR-022E gate #9;
- when Finn ships and gate #9 fires, a future ADR
  (provisionally ADR-026B or successor) **must**:
  a. move runtime enforcement to Finn,
  b. deprecate `@loa/straylight/runtime/recall-intake` with a
     documented deprecation window,
  c. **name the deprecation window in the successor ADR**
     (provisionally ADR-026B or successor) with a concrete
     trigger — for example, "N minor releases after Finn ships"
     or "M weeks after Dixie has migrated to Finn" — and an
     **upper bound that does not require operator inaction to
     enforce**; the experimental subpath's continued existence
     past the window MUST itself require a new authorizing ADR,
     not an absence of action,
  d. eventually retire the runtime subpath in a clean
     package-surface change,
  e. restore Straylight to its full type-only posture.
- the deprecation / retirement path is recorded here so a future
  ADR cannot leave the experimental subpath as a de-facto stable
  API.

### 9. Refusal rules — what ADR-026A does NOT authorize

See §"Explicit non-scope" below and the Phase 26A-2 handoff
§"Refusal rules". Reviewers may cite either verbatim to refuse
citation overreach.

### 10. Required test invariants in the later implementation PR

The implementation PR is **not mergeable** unless all of the
following invariants are held by tests in `tests/`:

- **a. Root `.` does not become runtime-importable.** No
  runtime resolution and no runtime values are produced by any
  of: dynamic ESM `import('@loa/straylight')`, CJS
  `require('@loa/straylight')`, value-form
  `import { ... } from '@loa/straylight'`. Tests MAY
  additionally assert the specific error code
  (`ERR_PACKAGE_PATH_NOT_EXPORTED`) where Node provides one,
  but the **load-bearing invariant is no runtime resolution /
  no runtime values**, not the exact error string. Phase 24H's
  pinned test for the root subpath remains in force.
- **b. `./host` does not become runtime-importable.** Same
  invariant as (a) for `@loa/straylight/host`. Tests MAY
  additionally assert `ERR_PACKAGE_PATH_NOT_EXPORTED` where
  Node provides it; the load-bearing invariant is no runtime
  resolution / no runtime values. Phase 24H's pinned test for
  the `./host` subpath remains in force.
- **c. `./runtime/recall-intake` resolves at runtime.** A
  positive test that
  `import('@loa/straylight/runtime/recall-intake')` resolves
  and exposes only the §3 allowlisted exports.
- **d. No other runtime subpath resolves.** Negative
  invariant tests (no runtime resolution, no runtime values)
  for `./runtime`, `./runtime/x`, `./recall-intake`,
  `./host/recall-intake`, and any other plausibly-named
  runtime subpath.
- **e. Runtime barrel exports only the approved allowlist.**
  A test enumerating the runtime barrel's value exports and
  asserting equality with the §3 allowlist (set comparison;
  fails on any addition).
- **f. Concrete non-Dixie refusal mechanism is held by
  tests** per §7: the mechanism is documented, fail-closed
  behavior is demonstrated across all applicable attack shapes
  listed in §7, dependency-object spoofing is tested when
  dependency injection or dependency objects are used, and any
  claimed not-applicable attack shape is explained and accepted
  only under §7's bounded Flatline MAY-accept criterion.
- **g. Experimental / pre-Finn / Dixie-only marker survives
  `tsc` emission** — a test that reads the emitted `.d.ts`
  and asserts the `@experimental` JSDoc tag is present on the
  barrel and on each runtime handler, and that the emitted
  declaration text includes the marker tokens `pre-Finn`,
  `Dixie-only`, and migration-to-Finn language. The test must
  assert marker-token presence, not exact verbatim prose.
- **h. Doc-marker presence.** Tests assert that the strings
  `experimental`, `pre-Finn`, and `Dixie-only` appear in the
  §6.c `README.md` section and the §6.d
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  section. Tests do not assert exact verbatim text (which
  would be brittle); they assert presence of the three marker
  tokens.

### 11. Threat-model legs the implementation PR MUST address

The implementation PR MUST cite Phase 26A-1 T13–T18 + T9
amendment as the threat-model contract it satisfies, and MUST
explicitly answer:

- **T13 (network adversary).** The runtime seam is **not** the
  network seam; Dixie's ingress is. The seam re-checks
  invariants the wedge can re-check (estate-id scoping, class
  validation, signer competence, status filtering, audit-chain
  append) and is fail-closed on precondition mismatch.
- **T14 (cross-tenant authorization).** The seam refuses to
  act on a tenant value not derived from the authenticated
  context; caller-supplied tenant in the body is ignored or
  overwritten upstream by Dixie before reaching the seam.
- **T15 (replay).** The implementation PR or the future Dixie
  PR records the chosen path (idempotent default vs explicit
  duplicate-audit-OK with replay-cannot-alter-authorization).
  ADR-026A does not pre-choose; it pins the requirement.
- **T16 (concurrency), T17 (resource exhaustion), T18
  (cross-instance state divergence), T9 (persistence
  posture).** These are **Dixie endpoint** prerequisites per
  Phase 26A-1; the Straylight runtime seam re-checks
  audit-chain append atomicity per estate but does **not** own
  ingress / rate-limit / memory-cap / multi-instance refusal.
  The future Dixie PR owns those. The Straylight runtime seam
  **MUST NOT** add ingress validation, rate limits, body-size
  limits, per-tenant memory caps, replay/idempotency state, or
  multi-instance coordination logic. Adding any of these to
  the runtime barrel is a Phase 26A-1 Dixie-endpoint
  responsibility leaking into Straylight and is out-of-scope
  for ADR-026A. The implementation PR is **blocked** if it
  does so.

### 12. Tags / releases

ADR-026A creates no tag. `v0.0.1` (annotated; pointing at commit
`de65d93568e70c53ba952279f41a23d2f7d5123e`, the **Phase 24K
release-consumption tag target** per
[`./ADR-024J-host-package-subpath-tag-decision.md`](./ADR-024J-host-package-subpath-tag-decision.md))
remains the sole release-consumption tag.

A later `v0.1.0` tag (or any other tag) requires:

- the runtime-implementation PR to be merged;
- separate explicit release / tag validation per the standing
  Phase 24J / Phase 26A-1 tag-validation discipline;
- the post-merge automated tag pipeline still being disabled
  (per PR #43);
- operator-authored tag cut, not workflow-automated.

### 13. Dixie endpoint NOT authorized by ADR-026A

ADR-026A authorizes the Straylight runtime seam **only**. The
Dixie recall-intake endpoint is **not** authorized by ADR-026A;
it requires:

- a later Dixie PR (sibling-repo, separately reviewed under
  Phase 26A-0 §"Decision" §2 discipline);
- that Dixie PR satisfies Phase 26A-1 T13–T18 acceptance
  criteria in full — T17 four-fold acceptance (body size limit,
  per-tenant rate limit, per-tenant memory cap, refusal
  behavior under excess); T15 replay default; T16 concurrency
  choice; T18 cross-instance refusal; T13 / T14 ingress
  validation;
- ADR-022E gate #10 firing at that point.

## Explicit non-scope

ADR-026A inherits every non-goal from ADR-026A0 (Phase 26A-0),
the Phase 26A-1 threat-model amendment, ADR-025A, ADR-025B,
ADR-024A through ADR-024K, ADR-022A through ADR-022E, and ADR-020A
through ADR-020E wholesale, and adds these Phase-26A-2-specific
refusals:

1. **No implementation by ADR-026A itself.** No `src/`, no
   `tests/`, no `fixtures/`, no `scripts/`, no `dist-types/`
   change in this ADR.
2. **No `package.json` / `package-lock.json` edit.** No
   `exports` map change, no `files`, no `main`, no `types`,
   no `private`, no dependency, no script change.
3. **No prior-ADR edit.**
4. **No prior-handoff edit** other than the README and
   cross-repo-implementation-order.md append-only updates
   listed in §"Decision" §1.
5. **No `package-boundary.md` edit.** Deferred to the later
   implementation PR per §6.d.
6. **No `threat-model.md` edit.** Phase 26A-1 already amended it.
7. **No `tsconfig*.json` / `vitest.config.ts` /
   `.npmrc` / `.gitignore` / `.loa.config.yaml` edit.**
8. **No new tag / push / Release / publish.**
9. **No GitHub issue / comment / PR action** by Phase 26A-2.
10. **No Dixie edit.** The Dixie endpoint is a separate, future,
    sibling-repo PR.
11. **No Hounfour edit.** ADR-022E gates #1–#5, #17, #18 remain
    held.
12. **No Finn edit.** ADR-022E gate #9 remains held; Finn
    remains the eventual runtime-enforcement owner.
13. **No Freeside edit.** ADR-022E gate #11 remains held.
14. **No Loa framework edit.** Per Phase 26A-0 §"Decision" §7,
    Loa-framework edits are not authorized by Phase 26A-0
    alone and not pre-approved by ADR-026A.
15. **No Dixie elevation to semantic / runtime authority.**
    Straylight remains the semantic wedge owner; Dixie is
    host / BFF / consumer only.
16. **No permanent lane transfer.** Pre-Finn MVP exception
    only; documented Finn migration / retirement path per §8.
17. **No additional runtime subpath**, no runtime condition on
    root `.` / `./host`, no runtime export of any wedge
    handler beyond the §3 allowlist, no sibling-repo runtime
    widening.
18. **No touch of [`../../.loa`](../../.loa) /
    [`../../.claude/`](../../.claude/) /
    [`../../.beads/`](../../.beads/) /
    [`../../.run/`](../../.run/) /
    [`../../.github/`](../../.github/) /
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
    `node_modules/`.**
19. **No pre-approval of any successor ADR**, including the
    Finn migration / retirement ADR.
20. **No relaxation of any ADR-022E gate**, any Phase 25A /
    25B / 26A-0 / 26A-1 refusal rule, or any Hounfour /
    Finn / Dixie / Freeside responsibility boundary.
21. **No general reorder of Phase 15.** The narrowing in
    [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
    is bounded to the single `handleRecallIntake` handler for
    the MVP slice.
22. **No SKP-005 closure by ADR-026A's drafting alone.**
    Closure requires the three-part condition recorded in
    §"Status".
23. **No SKP-002 / SKP-003 / SKP-004 closure.** Those remain
    Phase 26A-1 prerequisites for the future Dixie PR.

## Consequences

- **SKP-005 closure design is recorded** on the in-repo record;
  closure is asserted only after Flatline PASS or
  REVISE-with-resolution AND ADR-026A PR merge.
- **The later Straylight implementation PR is authorized in
  scope.** ADR-026A authorizes the scope of that PR but does
  not make it automatically mergeable; it remains independently
  reviewable and refusable on §7 / §10 / §11 grounds, plus the
  Phase 26A-0 future-ADR contract.
- **The later Dixie endpoint PR is NOT authorized by ADR-026A.**
  It remains independently reviewable and refusable on Phase
  26A-1 grounds.
- **The substrate is unchanged.** Post-Phase-26A-1 surface,
  source, tests, fixtures, schemas, declarations, and
  dependencies are byte-identical after ADR-026A merges.
- **Reopening any ADR-022E gate reopens ADR-026A's evidence
  base.** ADR-026A does not protect successor ADRs from their
  own gate-trigger conjunction.
- **Phase 15 ordering is narrowed for one MVP slice only.**
  The cross-reference in
  [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  is bounded to the single recall-intake handler; reviewers
  may refuse a citation that overreaches.

## Source files inspected

- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
- [`./ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](./ADR-025A-recall-wedge-mvp-implementation-sequencing.md)
- [`./ADR-025B-hounfour-70-status-intake.md`](./ADR-025B-hounfour-70-status-intake.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md) through [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md) through [`./ADR-024K-dixie-host-type-consumption-intake.md`](./ADR-024K-dixie-host-type-consumption-intake.md) (especially ADR-024G `./host` type-only contract; ADR-024I posture 1a; ADR-024J Phase 24K tag-execution parameters)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md) through [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`../handoffs/phase-26a0-operator-authority-flatline-rule.md`](../handoffs/phase-26a0-operator-authority-flatline-rule.md)
- [`../handoffs/phase-26a1-threat-model-dixie-endpoint.md`](../handoffs/phase-26a1-threat-model-dixie-endpoint.md)
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (T9 Phase 26A-1 amendment + T13–T18; read-only at decision time)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (read-only at decision time; will be edited by the later implementation PR per §6.d)
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md) (read-only)
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md) (read-only at decision time; Phase 26A-2 appends a narrow cross-reference)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md) (read-only)
- [`../handoffs/README.md`](../handoffs/README.md) (read-only at decision time; Phase 26A-2 appends an index entry)
- [`../../package.json`](../../package.json) (read-only)
