# Phase 27B → Phase 28 — coding candidate note

> Status: Phase 27B readiness record. **Docs-only.** This
> note identifies the **likely** first code-bearing slice
> after the Phase 27B readiness bundle. It does **not**
> authorize code, does **not** fire any ADR-022E gate, does
> **not** edit any sibling repo, and does **not** start
> Phase 28. Phase 28 begins, if and only if, a separate
> ADR-027B-Fire or ADR-027C-Fire (or another successor ADR)
> independently supplies the §3-class authorization-creating
> doc that ADR-026A0 / ADR-027A require.

## Bottom line

The candidate first code-bearing slice after Phase 27B is a
**Hounfour-side schema-extraction PR opened in `loa-hounfour`
under teammate review**, gated by a successor ADR-027B-Fire
in `loa-straylight`. This is **not** a Straylight code
change. The companion in-repo Straylight change (a
pin/update of the existing `@0xhoneyjar/loa-hounfour`
dependency to the ADR-027B-Fire-selected exact version — or
a confirmation of no manifest delta if the selected version
is already pinned/resolved — paired with a private-alias
adoption preserving the public surface) is a **second**,
separate, follow-up PR **after** the Hounfour-side PR has
merged and is published under a citable tag, also gated by
ADR-027B-Fire.

This ordering follows the recorded cross-repo implementation
order
([`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md))
"Hounfour goes first" rationale and the ADR-027A §3.d
candidate / eventual lane assignment.

## Likely repo

| Slice | Likely repo | Why |
|---|---|---|
| **First slice (out-of-repo)** | [`0xHoneyJar/loa-hounfour`](https://github.com/0xHoneyJar/loa-hounfour) | Hounfour is the **candidate** schema / class-validation lane per [ADR-022C](../decisions/ADR-022C-schema-dependency-direction.md), [ADR-027A §3.d](../decisions/ADR-027A-post-dixie-return-gate.md), and the cross-repo implementation order. The Phase 9 packet (`hounfour-schema-extraction-issue.md`) is staged; the v8.5.0 / v8.6.x shape is recorded in [`./hounfour-response-intake.md`](./hounfour-response-intake.md) and [`./phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md). This slice happens **outside** `loa-straylight` under teammate review. |
| **Second slice (in-repo, follow-up)** | `loa-straylight` (this repo) | After the Hounfour-side PR ships and is published under a pinned `@0xhoneyjar/loa-hounfour@x.y.z` tag, an in-repo Straylight PR may flip a private alias module to the Hounfour-published shape **without** widening the wedge's public surface. This is the first code-bearing **Straylight** slice after Phase 27A. |

The Finn-side slice (per
[ADR-027C](../decisions/ADR-027C-finn-return-gate-readiness.md))
is **not** the candidate first slice. ADR-027A §3.d records
the long-term order Hounfour → Finn → Dixie → Freeside, and
the Phase 27B readiness inventory shows Finn-side substrate
evidence is currently `PENDING` (no Finn tag, no Finn-side
issue #159 closure). Finn returns **after** Hounfour.

## Likely file areas

For the **Straylight-side follow-up** PR (the in-repo slice
after the Hounfour-side PR ships and is tagged):

| Likely file area | Plain reading | Constraint |
|---|---|---|
| [`../../package.json`](../../package.json), [`../../package-lock.json`](../../package-lock.json) | Pin/update the existing `@0xhoneyjar/loa-hounfour` dependency (already present at `^8.6.0`, lockfile resolves 8.6.0) to the ADR-027B-Fire-selected exact version, or confirm no manifest delta if the selected version is already pinned/resolved. | The version is pinned by ADR-027B-Fire, not by this note. |
| Private wedge alias module under `src/straylight/` (e.g., a Hounfour-shape import indirection module — no widening of `src/straylight/index.ts`) | Re-import the Hounfour-published shape under a wedge-internal alias so the wedge's public surface stays Straylight-named. | Per [ADR-020C](../decisions/ADR-020C-straylight-schema-namespace-strategy.md) and [ADR-022A](../decisions/ADR-022A-straylight-semantic-home.md): the public surface remains Straylight-named; Hounfour is referenced privately. |
| Boundary preservation test under `tests/` | Pin the public surface unchanged after the alias flip; pin the private alias correctly resolves to the Hounfour shape; pin the threat-model invariants T13–T18 + T9 over the wedge surface. | Per [ADR-022E](../decisions/ADR-022E-phase-22-deferred-features.md) row #18 and [ADR-027A §4.b](../decisions/ADR-027A-post-dixie-return-gate.md). |
| [`../mvp/package-boundary.md`](../mvp/package-boundary.md) | The runtime allowlist remains `{ handleRecallIntake, createDixieCapability, DixieCapabilityError }` plus the `DixieCapability` type re-export. The Hounfour adoption flip does **not** add a runtime export. | Per [ADR-027A §4.c](../decisions/ADR-027A-post-dixie-return-gate.md) and [ADR-027B §2 §4.c row](../decisions/ADR-027B-hounfour-return-gate-readiness.md). |

For the **Hounfour-side** PR (out-of-repo, the actual first
slice): file areas are documented in
[`./hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md)
and [`./hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md).
This note does **not** restate them.

## Explicit non-goals

Phase 28, when it begins, must **not** (and this note does
not authorize):

- a second Dixie endpoint (forbidden by ADR-027A §8.c);
- a second runtime subpath (forbidden by ADR-027A §8.d);
- re-opening `loa-dixie` PR #102 (forbidden by ADR-027A §8.b);
- re-implementing Phase 26E in `loa-straylight` (forbidden by
  ADR-027A §8.a);
- firing ADR-022E gates #1, #2, #3, #4, #5, #17, #18 without
  ADR-027B-Fire (forbidden by ADR-027A §8.e + §8.o);
- firing ADR-022E gate #9 without ADR-027C-Fire (forbidden by
  ADR-027A §8.f + §8.o);
- Freeside wiring (forbidden by ADR-027A §8.g);
- production storage migration (forbidden by ADR-027A §8.h);
- a Straylight package-surface change beyond the private
  alias module (no new runtime subpath, no widened
  allowlist; forbidden by ADR-027A §8.i);
- Loa framework / control-plane / model-substrate edits
  (forbidden by ADR-027A §8.j);
- a tag, a release, a package publish, or a Hounfour
  dependency bump *outside* the ADR-027B-Fire-authorized
  pinning (forbidden by ADR-027A §8.k);
- any sibling-repo edit *from* `loa-straylight` (forbidden by
  ADR-027A §8.l);
- treating Codex / Flatline / Bridgebuilder / Cheval / model
  context / long context / persisted memory as authority
  (forbidden by ADR-027A §8.n).

## Validation expected

For the **Hounfour-side** PR:

- Hounfour-side test suite (in `loa-hounfour`) passes per
  Hounfour's own conventions;
- the 12 conformance vectors from
  [`./hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md)
  / [`../../fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
  are imported as test inputs and pass;
- the package is published under a pinned tag with citable
  `$id` namespace.

For the **Straylight-side follow-up** PR (after Hounfour-side
ships):

- `npm run typecheck` clean;
- `npm test` passes (existing Phase 26B / 26B-F / 26C suites
  continue to pin the Straylight-side seam; new boundary
  preservation test pins the alias flip);
- `npm run build` clean (`dist/` and `dist-types/` reflect
  the alias flip without widening the public surface);
- `npm pack --dry-run` shows the published surface unchanged
  (no new runtime subpath; no widened allowlist);
- `git status --short -- dist dist-types` clean.

## Codex / multi-model audit expected

Per [ADR-027A §6](../decisions/ADR-027A-post-dixie-return-gate.md)
and [ADR-026A0 §3](../decisions/ADR-026A0-operator-authority-flatline-rule.md):

- ADR-027B-Fire must pass real 3-model Flatline (PASS or
  REVISE-with-resolution) AND real Bridgebuilder review
  pre-merge (the §4.d gate, **currently unsatisfied** per
  ADR-027A while Loa substrate is degraded).
- The Hounfour-side PR (out-of-repo) operates under
  Hounfour's own review rules; teammate review per the
  cross-repo handoff index applies.
- The Straylight-side follow-up PR also passes pre-merge
  real 3-model Flatline + Bridgebuilder per ADR-026A0 §3
  (it is a §3-class authorization-creating doc / code
  change because it widens the wedge's dependency surface
  and adopts a new shape).
- Codex / Flatline / Bridgebuilder / Cheval findings on any
  of the above are audit evidence, not authority. Persisted
  agent memory and long-context dumps are not authority.

## What must still be true before implementation starts

All of the following must hold before any Phase 28 commit
lands. None is supplied by this note or by ADR-027B /
ADR-027C alone:

| Precondition | Where it would be supplied |
|---|---|
| ADR-027B-Fire merged in `loa-straylight` and citing exactly which `@0xhoneyjar/loa-hounfour@x.y.z`, `$id` namespace, generated JSON Schema artifact / file path, JS subpath, and TS / type export (e.g., `.d.ts` path or named type re-export) the in-repo follow-up adopts. | A separate successor ADR per [ADR-027A §4](../decisions/ADR-027A-post-dixie-return-gate.md) and [ADR-027B](../decisions/ADR-027B-hounfour-return-gate-readiness.md) §3. |
| The relevant ADR-022E gates fired by ADR-027B-Fire (one or more of #1, #4, #17, #18; possibly #3 if a `safeCanonicalize` subpath is in scope). | ADR-027B-Fire per [ADR-022E](../decisions/ADR-022E-phase-22-deferred-features.md) per-row trigger column. |
| The Hounfour-side PR merged in `loa-hounfour` under teammate review and shipped under a pinned tag. | Out-of-repo, in `loa-hounfour`, per [`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md). |
| Pre-merge real 3-model Flatline + Bridgebuilder verdict on ADR-027B-Fire (currently **unsatisfied** per [ADR-027A §4.d](../decisions/ADR-027A-post-dixie-return-gate.md) while substrate is degraded). | Loa-side substrate hardening (separately authorized) plus the gate-firing PR's own review evidence. |
| Threat-model impact statement under T13–T18 + T9 for the specific adopted symbols, recorded by ADR-027B-Fire per [ADR-027A §4.b](../decisions/ADR-027A-post-dixie-return-gate.md). | ADR-027B-Fire. |
| Class-vs-policy boundary explicitly preserved per adopted symbol per [ADR-027B §4](../decisions/ADR-027B-hounfour-return-gate-readiness.md). | ADR-027B-Fire. |
| Consumer-contract delta = "no runtime allowlist change" (or, if a delta is proposed, its own ADR-026A0 §3 first-class authorization). | ADR-027B-Fire. |
| Phase 28 phase brief drafted in `docs/handoffs/phase-28-*.md` (referenced from this note's branch but not authored by it). | Phase 28 docs-only authoring step that follows ADR-027B-Fire. |

## Cross-references

- [`../decisions/ADR-027A-post-dixie-return-gate.md`](../decisions/ADR-027A-post-dixie-return-gate.md)
  — canonical post-Dixie return gate.
- [`../decisions/ADR-027B-hounfour-return-gate-readiness.md`](../decisions/ADR-027B-hounfour-return-gate-readiness.md)
  — Hounfour readiness inventory.
- [`../decisions/ADR-027C-finn-return-gate-readiness.md`](../decisions/ADR-027C-finn-return-gate-readiness.md)
  — Finn readiness inventory.
- [`./phase-27b-subpath-retirement-migration.md`](./phase-27b-subpath-retirement-migration.md)
  — runtime subpath retirement / migration plan
  (gated by ADR-027C-Fire, not this note).
- [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — recommended sibling-repo order.
- [`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
  — sibling-repo issue index.
- [`./cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md)
  — no-go rules every sibling-repo PR must respect.
- [`./hounfour-schema-extraction-issue.md`](./hounfour-schema-extraction-issue.md),
  [`./hounfour-extraction-mapping.md`](./hounfour-extraction-mapping.md),
  [`./hounfour-schema-extraction-pr-checklist.md`](./hounfour-schema-extraction-pr-checklist.md),
  [`./hounfour-response-intake.md`](./hounfour-response-intake.md),
  [`./hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md),
  [`./phase-21b-v86-schema-readiness-lock.md`](./phase-21b-v86-schema-readiness-lock.md)
  — Hounfour packets ADR-027B-Fire must cite.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md),
  [`../mvp/threat-model.md`](../mvp/threat-model.md),
  [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — invariants Phase 28 must preserve.
