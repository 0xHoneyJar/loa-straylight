# Phase 27B — Runtime subpath retirement / migration handoff

> Status: Phase 27B readiness record. **Docs-only.** This
> handoff explains how the Phase 26E Dixie-first
> recall-intake exception eventually retires, migrates, or
> becomes subordinate to the long-term Hounfour / Finn split.
> It is **not** a retirement, **not** a deprecation, and
> **not** a migration. The runtime subpath
> `@loa/straylight/runtime/recall-intake` remains active per
> [ADR-026A](../decisions/ADR-026A-runtime-recall-intake-subpath.md);
> the runtime allowlist remains
> `{ handleRecallIntake, createDixieCapability,
> DixieCapabilityError }` plus the `DixieCapability` type
> re-export.
>
> This handoff does **not** re-open `loa-dixie` PR #102
> (explicitly forbidden by [ADR-027A §8.b](../decisions/ADR-027A-post-dixie-return-gate.md)).
> It does **not** authorize new Dixie implementation. It
> does **not** authorize `loa-finn` implementation. It does
> **not** fire ADR-022E gate #9. It does **not** edit any
> sibling repo, any prior ADR, the package boundary, the
> threat model, or any source / test / fixture / script /
> package file.

## Why this handoff exists

[ADR-026A](../decisions/ADR-026A-runtime-recall-intake-subpath.md)
§"Decision" §8 marks the runtime subpath as **experimental /
pre-Finn / Dixie-only / not permanent** and pins a retirement
path back to Finn when [ADR-022E](../decisions/ADR-022E-phase-22-deferred-features.md)
gate #9 fires. [ADR-027A §"Decision" §5](../decisions/ADR-027A-post-dixie-return-gate.md)
records the Finn return gate every later PR must satisfy
before that retirement happens.
[ADR-027C](../decisions/ADR-027C-finn-return-gate-readiness.md)
catalogues the current readiness state of each §5 row.

This handoff sits between ADR-026A §8 (the retirement
authorization marker) and ADR-027C-Fire (the future
gate-firing ADR ADR-027C contemplates). It explains, in
plain reading and without firing any gate, what the
retirement / migration would look like — so a reviewer of a
future Finn-side PR or ADR-027C-Fire can confirm the plan is
honored.

## Long-term split (recap, links only)

The long-term split is recorded canonically in:

- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  — the class-vs-policy boundary invariant.
- [`./finn-runtime-boundary.md`](./finn-runtime-boundary.md)
  "The three lanes" + "What Finn should eventually own".
- [ADR-022B](../decisions/ADR-022B-mvp-endpoint-host.md) — MVP
  endpoint host criteria.
- [ADR-022E](../decisions/ADR-022E-phase-22-deferred-features.md)
  rows #9 (Finn runtime wiring) and #11 (Freeside).
- [ADR-027A §3.d](../decisions/ADR-027A-post-dixie-return-gate.md)
  — long-term lane assignment with each lane labeled
  candidate / eventual gated by ADR-022E firings.

This handoff does not restate that doctrine; it points at it.

## What "retirement" means in plain reading

When ADR-027C-Fire (the §5 gate-firing successor) fires
ADR-022E gate #9, three load-bearing things happen:

1. **`handleRecallIntake` enforcement moves into Finn.** A
   `loa-finn`-side runtime gate consumes the wedge's primitive
   API directly (per
   [`./finn-runtime-boundary.md`](./finn-runtime-boundary.md)),
   replacing the `@loa/straylight/runtime/recall-intake`
   subpath as the recall-intake enforcement surface for
   future endpoints.
2. **The Phase 26E Dixie endpoint shipped by `loa-dixie`
   PR #102 migrates** to consume the Finn-side runtime gate
   instead of the Straylight runtime subpath. The migration
   happens in a **new** sibling-repo PR in `loa-dixie`,
   under teammate review — **not** by re-opening PR #102
   and **not** by an in-repo Straylight change to the
   already-shipped endpoint.
3. **`@loa/straylight/runtime/recall-intake` deprecates and
   eventually retires.** The deprecation window, cutover
   date, removal date, and removal mechanism (subpath kept
   with explicit deprecation export, or subpath removed at
   a major-version bump) are decided by ADR-027C-Fire — not
   by this handoff.

After retirement, the wedge returns to **full type-only
posture** at the package boundary: root `@loa/straylight` and
`@loa/straylight/host` remain `"types"`-only, and the
runtime subpath is gone. Hounfour shape adoption (under
ADR-027B-Fire) is a separate event on the wedge's type
surface.

## What ADR-027C-Fire must pin (handoff-side checklist)

ADR-027C-Fire — the future ADR that fires ADR-022E gate #9
and authorizes the retirement / migration described above —
must pin, on top of [ADR-027A §5](../decisions/ADR-027A-post-dixie-return-gate.md)
and [ADR-027C](../decisions/ADR-027C-finn-return-gate-readiness.md):

| Pin | What ADR-027C-Fire must contain |
|---|---|
| **Deprecation window** | Concrete start date for the deprecation announcement; cutover date by which the Dixie endpoint must consume the Finn-side gate; removal date or major-version-bump anchor at which the subpath leaves the package surface. |
| **Migration plan for `loa-dixie` PR #102** | Path of the new `loa-dixie` PR (not a re-open of #102); how the new PR replaces the subpath import with the Finn-side gate; how it preserves the ADR-026C consumer-contract obligations 3.1–3.8; teammate-review owner. |
| **Test classes that prove the seam refuses ADR-026A §7 attack shapes during and after migration** | Specifically the four ADR-026A §7 attack shapes — direct non-Dixie import; forged caller metadata; fake "dixie" wrapper package; dependency-object spoofing — plus the Phase 26B-F additions (key rotation; cross-process capability replay) and the missing-key / spoofed-capability / serialised-capability variants — must continue to refuse during the deprecation window, at cutover, and after removal. |
| **Allowlist final state** | Whether the allowlist `{ handleRecallIntake, createDixieCapability, DixieCapabilityError, DixieCapability (type) }` retires entirely or migrates to a Finn-side surface; which Straylight package surface (root or `host` or new) hosts any residual type re-export. |
| **Threat-model continuity** | Per [ADR-027A §5.d](../decisions/ADR-027A-post-dixie-return-gate.md): no temporary regression; no default-allow during cutover; no metadata-as-identity; no cross-process capability replay. |
| **Pre-merge real 3-model Flatline + Bridgebuilder** | Per [ADR-027A §5.e](../decisions/ADR-027A-post-dixie-return-gate.md), currently **unsatisfied** while Loa substrate is degraded. ADR-027C-Fire must show real review on the gate-firing PR. |

## Out of scope for Phase 27B

This handoff does **not**:

- retire, deprecate, or migrate
  `@loa/straylight/runtime/recall-intake`;
- edit `package.json` / `package-lock.json` / `tsconfig*` /
  `vitest.config.ts` / `.npmrc` / `.gitignore` /
  `.loa.config.yaml`;
- edit any file under `src/`, `tests/`, `fixtures/`,
  `scripts/`, `dist/`, `dist-types/`;
- edit
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md) or
  [`../mvp/threat-model.md`](../mvp/threat-model.md);
- edit any prior ADR or any prior handoff;
- edit `loa-dixie`, `loa-finn`, `loa-hounfour`,
  `loa-freeside`, `loa`, `freeside-characters`, or any other
  repo;
- file a sibling-repo PR / comment / issue;
- re-open `loa-dixie` PR #102 (explicitly forbidden by
  [ADR-027A §8.b](../decisions/ADR-027A-post-dixie-return-gate.md));
- fire ADR-022E gate #9 (explicitly forbidden by
  [ADR-027C §4.a](../decisions/ADR-027C-finn-return-gate-readiness.md));
- authorize a new Dixie endpoint (forbidden by
  [ADR-027A §8.c](../decisions/ADR-027A-post-dixie-return-gate.md));
- authorize a new runtime subpath (forbidden by
  [ADR-027A §8.d](../decisions/ADR-027A-post-dixie-return-gate.md));
- pre-approve any successor ADR (forbidden by
  [ADR-027A §8.o](../decisions/ADR-027A-post-dixie-return-gate.md));
- treat Codex / Flatline / Bridgebuilder / Cheval /
  long-context / persisted-memory output as authority for
  any of the above (forbidden by
  [ADR-027A §6](../decisions/ADR-027A-post-dixie-return-gate.md)).

## Validation

Phase 27B adds no source / test / fixture / script / package
change; the working-tree surface is the entire validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full Phase 27B working set
```

`npm run typecheck`, `npm test`, `npm run build`, and `npm
pack --dry-run` remain identical to the post-Phase-27A
baseline by construction.

## Cross-references

- [`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md)
  §7 attack shapes + §8 retirement marker.
- [`../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md`](../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md)
  consumer obligations 3.1–3.8.
- [`../decisions/ADR-027A-post-dixie-return-gate.md`](../decisions/ADR-027A-post-dixie-return-gate.md)
  §5 Finn return gate (canonical generic record).
- [`../decisions/ADR-027C-finn-return-gate-readiness.md`](../decisions/ADR-027C-finn-return-gate-readiness.md)
  §5 readiness inventory.
- [`./finn-runtime-enforcement-issue.md`](./finn-runtime-enforcement-issue.md),
  [`./finn-runtime-boundary.md`](./finn-runtime-boundary.md),
  [`./finn-enforcement-mapping.md`](./finn-enforcement-mapping.md)
  Phase 10 packet.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  runtime allowlist (unchanged by Phase 27B).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) T13–T18 +
  T9 amendment.
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  class-vs-policy invariant.
