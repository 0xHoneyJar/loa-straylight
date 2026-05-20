# ADR-027B — Hounfour return-gate readiness (Phase 27B)

## Status

Accepted-for-Phase-27B.

ADR-027B is a **Straylight-side readiness record** for the
Hounfour return gate that ADR-027A §"Decision" §4 contemplated.
It catalogues the current state of the Hounfour-side evidence
that a future **gate-firing ADR** must supply before any
Hounfour adoption flip reaches Straylight, and it pins the
contract that gate-firing ADR must honor.

ADR-027B does **not** fire any ADR-022E gate, does **not**
authorize a Hounfour dependency bump, does **not** widen the
Straylight package surface, does **not** change the runtime
allowlist, does **not** edit `loa-hounfour` or any sibling
repo, does **not** flip any import, and does **not** publish a
package or cut a tag. ADR-022E gates #1, #2, #3, #4, #5, #17,
and #18 remain held.

Per [ADR-026A0 §3](./ADR-026A0-operator-authority-flatline-rule.md)
and [ADR-027A §"Decision" §8.o](./ADR-027A-post-dixie-return-gate.md),
the gate-firing successor (referred to here as **ADR-027B-Fire**
without committing to that file name) is unambiguously a
**§3-class authorization-creating doc** and inherits the full
pre-merge real 3-model Flatline + Bridgebuilder requirement
on its own. ADR-027B is itself the **second class** under
ADR-026A0 §3 — it tightens refusal by enumerating evidence
rows and adds specificity to the return-gate criteria; it does
not create authorization. Its own pre-merge Flatline +
Bridgebuilder is therefore at operator discretion.

## Context

ADR-027A §"Decision" §4 records five generic acceptance rows
(§4.a–§4.e) the future Hounfour return-gate ADR must satisfy.
ADR-027B does not restate them; the canonical generic record
is [ADR-027A §4](./ADR-027A-post-dixie-return-gate.md).
ADR-027B adds two things:

1. A **current-state inventory** of each §4 row against the
   evidence in the repo today (Hounfour upstream tags,
   schema `$id` namespaces, JS subpaths, Phase 17 / 18 / 19A
   shadow records, the Phase 26A-1 threat model, and the
   ADR-026A runtime allowlist).
2. A **gate-firing-ADR contract** stating exactly what
   ADR-027B-Fire must additionally produce on top of the
   ADR-027A §4 generic criteria for the operator to accept it
   as having satisfied the gate.

## Decision

### 1. File set

ADR-027B establishes only:

- **New:** this ADR.
- **New:** the companion Phase 28 coding-candidate note at
  [`../handoffs/phase-27b-phase-28-coding-candidate.md`](../handoffs/phase-27b-phase-28-coding-candidate.md)
  (referenced by §4 below; the candidate note itself does not
  authorize code).
- **New:** the companion subpath-retirement / migration
  handoff at
  [`../handoffs/phase-27b-subpath-retirement-migration.md`](../handoffs/phase-27b-subpath-retirement-migration.md)
  (referenced by ADR-027C; not edited by ADR-027B except as a
  link).

ADR-027B touches no file under `src/`, `tests/`, `fixtures/`,
`scripts/`, `dist/`, `dist-types/`; no `package.json` /
`package-lock.json` / `tsconfig*` / `vitest.config.ts` /
`.npmrc` / `.gitignore` / `.loa.config.yaml`; no `.loa/` /
`.claude/` / `.beads/` / `.run/` / `.github/` / `.codex/` /
`.agents/` / `.vitest/` / `grimoires/`; no `node_modules/`;
no prior ADR; no `docs/mvp/package-boundary.md`,
`docs/mvp/threat-model.md`, or any `loa-dixie` / `loa-finn` /
`loa-hounfour` / `loa-freeside` / `loa` / `freeside-characters`
file. It cuts no tag, files no issue / comment / PR.

### 2. Current-state inventory (Hounfour return-gate evidence)

Each row records: the §4 row from ADR-027A; the citable
evidence currently in repo; current readiness disposition
(`READY` / `PENDING` / `NOT-EVALUATED`); what is missing for
the gate-firing ADR.

| ADR-027A §4 row | Repo evidence | Disposition | Missing for ADR-027B-Fire |
|---|---|---|---|
| **§4.a Upstream substrate evidence** — published, tagged, resolvable Hounfour shape (`@0xhoneyjar/loa-hounfour@x.y.z`, `$id` URL, JS subpath); not pending; not pre-release-only; not draft. | v8.5.0 final shipped (tag `v8.5.0`, `main` HEAD `ea98924d`, `$id`s under `https://schemas.0xhoneyjar.com/loa-hounfour/8.5.0/`) per [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md) and [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md) Phase 16 banner. v8.6.x `Challenge` schema shipped per [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md). | `PENDING` for v8.6.x — adoption-target version is not pinned by ADR-027B; v8.5.0 vs v8.6.x is a successor decision. | ADR-027B-Fire must pin **one** target version, cite that exact `@0xhoneyjar/loa-hounfour@x.y.z`, the exact `$id` namespace, the generated JSON Schema artifact (file path within the published package, e.g., the `schemas/*.json` location), the exact JS subpath(s) it adopts, and the exact TS / type export evidence (e.g., `.d.ts` path or named type re-export) for any TypeScript-side consumption. |
| **§4.b Threat-model impact statement** — under T13–T18 + the T9 persistence-posture amendment; class-vs-policy boundary preserved or refused. | T13–T18 + T9 amendment merged in [`../mvp/threat-model.md`](../mvp/threat-model.md) (Phase 26A-1). Class-vs-policy boundary at [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md). | `READY` (substrate present; impact statement is per-flip, not pre-written). | ADR-027B-Fire must state per-symbol impact under T13–T18 + T9 and explicitly preserve or refuse the class-vs-policy boundary for each adopted shape. |
| **§4.c Consumer-contract delta** — runtime allowlist held unless explicitly amended; no Straylight runtime export added by side effect. | Allowlist `{ handleRecallIntake, createDixieCapability, DixieCapabilityError, DixieCapability (type) }` unchanged since [ADR-026A](./ADR-026A-runtime-recall-intake-subpath.md) §"Decision" §3 + Phase 26B. Phase 26C consumer obligations unchanged. | `READY` (allowlist is a fixed surface; no delta is required for an adoption flip that adds no runtime export). | ADR-027B-Fire must explicitly state "no runtime allowlist delta" or, if a delta is proposed, supply its own ADR-026A0 §3 first-class authorization for that delta. |
| **§4.d Pre-merge real 3-model Flatline + Bridgebuilder** — currently unsatisfied while the Loa control-plane substrate is degraded; not skipped, not circular, not pre-satisfied. | Phase 26F §7.1 records the substrate degradation. ADR-027A §4.d marks the gate explicitly **unsatisfied**. | `PENDING` — gate is currently unsatisfied; substrate hardening is Loa-side control-plane work, separately authorized. | ADR-027B-Fire must show real 3-model Flatline (PASS or REVISE-with-resolution) AND real Bridgebuilder review **on the gate-firing PR**; substrate-degradation findings on ADR-027B-Fire are audit evidence the operator weighs, not a reason to bypass the gate. |
| **§4.e ADR-022E gates** — #1, #2, #3, #4, #5, #17, #18 remain held until each is independently fired by a successor ADR with its own trigger evidence. | Held per [ADR-022E](./ADR-022E-phase-22-deferred-features.md). ADR-027A §"Decision" §4.e records they remain held. | `HELD` — by design; ADR-027B does not fire any of them. | ADR-027B-Fire must explicitly enumerate which gates it fires and supply each gate's individual trigger evidence per ADR-022E's per-row trigger column. |

### 3. Bridge handoffs ADR-027B-Fire must cite

A future ADR-027B-Fire (or any successor that fires a Hounfour
gate) must cite, by file path:

- [`../handoffs/hounfour-schema-extraction-issue.md`](../handoffs/hounfour-schema-extraction-issue.md)
- [`../handoffs/hounfour-extraction-mapping.md`](../handoffs/hounfour-extraction-mapping.md)
- [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md)
- [`../handoffs/hounfour-rc-shadow-integration-checklist.md`](../handoffs/hounfour-rc-shadow-integration-checklist.md)
- [`../handoffs/hounfour-shadow-integration-findings.md`](../handoffs/hounfour-shadow-integration-findings.md)
- [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)

ADR-027B-Fire must also cite [ADR-026A0](./ADR-026A0-operator-authority-flatline-rule.md),
[Phase 26A-1 threat-model amendment](../handoffs/phase-26a1-threat-model-dixie-endpoint.md)
+ [`../mvp/threat-model.md`](../mvp/threat-model.md), and
[ADR-027A](./ADR-027A-post-dixie-return-gate.md).

### 4. Class-vs-policy boundary preservation

Hounfour adoption may bring class shapes (`Challenge`,
`EstateTransition`, `safeCanonicalize`) into the wedge but
must not transfer **policy**, **audit**, or **keyring** lanes
to Hounfour. Per
[`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md):

- Hounfour ships **shape** (class lane).
- Straylight produces decisions, audit chain, keyring (policy
  / audit / keyring lanes — wedge-owned).
- Finn (eventual) enforces decisions at runtime (runtime lane).
- Dixie surfaces decisions to humans (BFF lane).
- Freeside surfaces decisions to community channels (community
  lane).

ADR-027B-Fire must explicitly preserve or refuse this boundary
per adopted symbol. Adopting a Hounfour-named symbol into the
wedge's **public** surface is gate #18 in
[ADR-022E](./ADR-022E-phase-22-deferred-features.md) and
requires that ADR's per-row trigger.

### 5. Refusal rules

Reviewers may cite this section verbatim to refuse a PR that
treats ADR-027B as authorization for any of:

- **5.a** — bumping `@0xhoneyjar/loa-hounfour` (no §4.a / §4.e
  pinning is supplied by ADR-027B).
- **5.b** — adopting `Challenge`, `EstateTransition`, or
  `safeCanonicalize` (each is a separate ADR-022E gate).
- **5.c** — flipping `move_to_hounfour` candidates per
  [`../schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md).
- **5.d** — widening the Straylight runtime allowlist or
  package surface.
- **5.e** — editing the threat model, package boundary, or
  any prior ADR.
- **5.f** — filing a sibling-repo PR or comment on
  `0xHoneyJar/loa-hounfour`.
- **5.g** — claiming ADR-027B fires any ADR-022E gate.
- **5.h** — citing ADR-027B as a substitute for the §4.d
  pre-merge Flatline + Bridgebuilder (which remains
  **currently unsatisfied** while substrate is degraded).

### 6. Rollback

ADR-027B is docs-only and adds no runtime / test / fixture /
script. Rollback is the inverse-docs-only operation: delete
this ADR plus any append-only Phase 27B sections that
reference it; restore the post-Phase-27A baseline. Rollback
does not re-open `loa-dixie` PR #102 and does not authorize
any sibling-repo edit.

## Consequences

- The Hounfour return-gate generic criteria from ADR-027A §4
  are paired with a current-state evidence inventory.
  Reviewers can refuse a Hounfour-touching PR on either the
  generic criterion (ADR-027A §4) or the missing inventory
  row (ADR-027B §2 / §3).
- The §4.d pre-merge real 3-model Flatline + Bridgebuilder
  gate remains **explicitly unsatisfied** under ADR-027B and
  is not pre-cleared for any successor.
- ADR-027B-Fire (or any successor that fires an ADR-022E gate
  in the Hounfour set) is unambiguously a §3-class
  authorization-creating doc under ADR-026A0 and inherits the
  full Flatline + Bridgebuilder requirement on its own. ADR-027B
  pre-approves no successor.
- The Phase 28 coding-candidate note
  ([`../handoffs/phase-27b-phase-28-coding-candidate.md`](../handoffs/phase-27b-phase-28-coding-candidate.md))
  may cite ADR-027B as the readiness record but must defer
  authorization to ADR-027B-Fire.

## Validation

Phase 27B adds no source / test / fixture / script / package
change; the working-tree surface is the entire validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full Phase 27B working set
```

Plain `git diff --stat` reports tracked-file modifications only
and will **not** show the new ADRs / handoffs until they are
staged; ADR-027B does not stage them. `npm run typecheck`,
`npm test`, `npm run build`, and `npm pack --dry-run` remain
identical to the post-Phase-27A baseline by construction.

## Source files inspected

- [`./ADR-027A-post-dixie-return-gate.md`](./ADR-027A-post-dixie-return-gate.md)
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`../handoffs/hounfour-schema-extraction-issue.md`](../handoffs/hounfour-schema-extraction-issue.md),
  [`../handoffs/hounfour-extraction-mapping.md`](../handoffs/hounfour-extraction-mapping.md),
  [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md),
  [`../handoffs/hounfour-rc-shadow-integration-checklist.md`](../handoffs/hounfour-rc-shadow-integration-checklist.md),
  [`../handoffs/hounfour-shadow-integration-findings.md`](../handoffs/hounfour-shadow-integration-findings.md),
  [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md),
  [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (T13–T18 +
  T9 amendment).
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md),
  [`../schema-candidates/hounfour-extraction-plan.md`](../schema-candidates/hounfour-extraction-plan.md).
- [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)
  (Phase 26F).
