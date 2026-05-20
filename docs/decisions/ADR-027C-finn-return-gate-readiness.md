# ADR-027C — Finn return-gate readiness (Phase 27B)

## Status

Accepted-for-Phase-27B.

ADR-027C is a **Straylight-side readiness record** for the
Finn return gate that ADR-027A §"Decision" §5 contemplated. It
catalogues the current state of the Finn-side evidence that a
future **gate-firing ADR** (referred to here as **ADR-027C-Fire**
without committing to that file name) must supply before any
Finn runtime-enforcement / audit / action-boundary work
reaches Straylight, and it pins the contract that gate-firing
ADR must honor.

ADR-027C does **not** fire ADR-022E gate #9, does **not**
deprecate `@loa/straylight/runtime/recall-intake`, does **not**
retire the runtime subpath, does **not** restore Straylight to
full type-only posture, does **not** move `handleRecallIntake`
enforcement into Finn, does **not** edit `loa-finn` or any
sibling repo, and does **not** publish a package or cut a tag.
ADR-022E gate #9 remains held.

Per [ADR-026A0 §3](./ADR-026A0-operator-authority-flatline-rule.md)
and [ADR-027A §"Decision" §8.o](./ADR-027A-post-dixie-return-gate.md),
ADR-027C-Fire is unambiguously a **§3-class
authorization-creating doc** and inherits the full pre-merge
real 3-model Flatline + Bridgebuilder requirement on its own.
ADR-027C is itself the **second class** under ADR-026A0 §3 —
it tightens refusal by enumerating evidence rows; it does not
create authorization. Its own pre-merge Flatline +
Bridgebuilder is therefore at operator discretion.

## Context

ADR-027A §"Decision" §5 records six generic acceptance rows
(§5.a–§5.f) the future Finn return-gate ADR must satisfy.
ADR-027C does not restate them; the canonical generic record
is [ADR-027A §5](./ADR-027A-post-dixie-return-gate.md).
ADR-027C adds two things:

1. A **current-state inventory** of each §5 row against the
   evidence in the repo today (Phase 10 packet, Finn issue
   #159, the Straylight runtime subpath, threat-model
   amendment, class-vs-policy boundary, ADR-022E gate #9).
2. A **gate-firing-ADR contract** stating exactly what
   ADR-027C-Fire must additionally produce on top of the
   ADR-027A §5 generic criteria for the operator to accept it
   as having satisfied the gate.

## Decision

### 1. File set

ADR-027C establishes only:

- **New:** this ADR.

ADR-027C touches no `src/`, `tests/`, `fixtures/`, `scripts/`,
`dist/`, `dist-types/`; no `package.json` /
`package-lock.json` / `tsconfig*` / `vitest.config.ts` /
`.npmrc` / `.gitignore` / `.loa.config.yaml`; no `.loa/` /
`.claude/` / `.beads/` / `.run/` / `.github/` / `.codex/` /
`.agents/` / `.vitest/` / `grimoires/`; no `node_modules/`;
no prior ADR; no `docs/mvp/package-boundary.md`,
`docs/mvp/threat-model.md`, or any sibling-repo file. It cuts
no tag, files no issue / comment / PR.

### 2. Current-state inventory (Finn return-gate evidence)

| ADR-027A §5 row | Repo evidence | Disposition | Missing for ADR-027C-Fire |
|---|---|---|---|
| **§5.a Finn-side substrate evidence** — Finn package release / Finn enforcement boundary / Finn audit + receipt emission / Finn signer competence / Finn keyring binding shipped or staged with citable evidence (Finn tag, Finn issue #159 status, Finn enforcement-mapping closure). | Phase 10 packet present in `loa-straylight`: [`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md), [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md), [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md). Finn-side response, Finn-side tag, and Finn-side enforcement-mapping closure are **not** in this repo. | `PENDING` — Phase 10 packet is staged in Straylight; Finn-side artifacts have not landed in `loa-finn` to date. | ADR-027C-Fire must cite a Finn tag (e.g., `@0xhoneyjar/loa-finn@x.y.z`), the Finn-side response on issue #159 (or its successor), and a Finn enforcement-mapping closure record. Pre-release-only or draft-only Finn artifacts are not sufficient. |
| **§5.b Subpath retirement plan** — concrete deprecation window; migration path for the Dixie consumer (PR #102 endpoint); test classes proving the runtime seam continues to refuse the ADR-026A §7 attack shapes during and after migration. | Subpath authorized by [ADR-026A](./ADR-026A-runtime-recall-intake-subpath.md) §"Decision" §8 as experimental / pre-Finn / Dixie-only / not permanent. ADR-026A §7 records the four attack shapes the seam must continue to refuse. Phase 27B subpath-retirement / migration handoff at [`../handoffs/phase-27b-subpath-retirement-migration.md`](../handoffs/phase-27b-subpath-retirement-migration.md) is the readiness record (it does **not** itself retire the subpath). | `READY-AS-PLAN` (handoff present); `PENDING-AS-EXECUTION` (no deprecation window has been opened, no migration of `loa-dixie` PR #102 has been authored). | ADR-027C-Fire must pin a concrete deprecation window (start / cutover / removal dates), a citable migration plan for the Dixie endpoint shipped by PR #102, and the test classes that prove ADR-026A §7 refusal continues during and after migration. Re-opening `loa-dixie` PR #102 is **explicitly forbidden** by ADR-027A §8.b; migration goes through a new sibling-repo PR under teammate review. |
| **§5.c Class-vs-policy preservation** — Hounfour ships shape; Finn enforces decisions; Dixie surfaces decisions to humans; Freeside surfaces decisions to community channels. | Boundary recorded in [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md). Finn boundary recorded in [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md) "The three lanes" + "What Finn should eventually own". | `READY` (boundary present and stable). | ADR-027C-Fire must enumerate, per migrated runtime symbol (`handleRecallIntake`, `createDixieCapability`, `DixieCapabilityError`, plus any new Finn-owned enforcement entry point), how the migration preserves the boundary: Hounfour shape, Straylight primitive semantics, Finn runtime gate, Dixie consumer, Freeside consumer. |
| **§5.d Threat-model continuity** — T13–T18 + T9 persistence-posture coverage end-to-end through the migration; no temporary regression; no default-allow during cutover; no metadata-as-identity; no cross-process capability replay. | T13–T18 + T9 amendment in [`../mvp/threat-model.md`](../mvp/threat-model.md) (Phase 26A-1). [ADR-026A §7](./ADR-026A-runtime-recall-intake-subpath.md) records the attack shapes the seam refuses. | `READY` (substrate present); `PENDING-AS-MIGRATION-PROOF` (continuity proof for the Finn migration is not pre-written). | ADR-027C-Fire must show, per cutover phase, that no T13–T18 + T9 invariant degrades — including that the Finn-owned enforcement does not introduce default-allow during cutover, does not treat metadata as identity, and does not allow cross-process capability replay. |
| **§5.e Pre-merge real 3-model Flatline + Bridgebuilder** — currently unsatisfied while the Loa control-plane substrate is degraded; not skipped, not circular, not pre-satisfied. | Phase 26F §7.1 records the substrate degradation. ADR-027A §5.e marks the gate explicitly **unsatisfied**. | `PENDING` — gate is currently unsatisfied; substrate hardening is Loa-side control-plane work, separately authorized. | ADR-027C-Fire must show real 3-model Flatline (PASS or REVISE-with-resolution) AND real Bridgebuilder review **on the gate-firing PR**; substrate-degradation findings are audit evidence the operator weighs, not a reason to bypass the gate. |
| **§5.f ADR-022E gate #9** — remains held until the successor ADR explicitly fires it. | Held per [ADR-022E](./ADR-022E-phase-22-deferred-features.md) row #9. | `HELD` — by design; ADR-027C does not fire it. | ADR-027C-Fire must explicitly fire gate #9 and supply gate #9's per-row trigger (Phase 19A-equivalent feedback received or teammate-review approval; ADR-022B-criteria-driven placement ADR; corresponding `loa-finn` PR opens under teammate review). |

### 3. Bridge handoffs ADR-027C-Fire must cite

A future ADR-027C-Fire (or any successor that fires ADR-022E
gate #9) must cite, by file path:

- [`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md)
- [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)
- [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md)
- [`../handoffs/phase-27b-subpath-retirement-migration.md`](../handoffs/phase-27b-subpath-retirement-migration.md)
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
  (especially §7 attack shapes and §8 retirement / migration
  marker)
- [`./ADR-026C-dixie-recall-intake-consumer-contract.md`](./ADR-026C-dixie-recall-intake-consumer-contract.md)
  (consumer contract that PR #102 honored)

ADR-027C-Fire must also cite [ADR-026A0](./ADR-026A0-operator-authority-flatline-rule.md),
[Phase 26A-1 threat-model amendment](../handoffs/phase-26a1-threat-model-dixie-endpoint.md)
+ [`../mvp/threat-model.md`](../mvp/threat-model.md), and
[ADR-027A](./ADR-027A-post-dixie-return-gate.md).

### 4. Refusal rules

Reviewers may cite this section verbatim to refuse a PR that
treats ADR-027C as authorization for any of:

- **4.a** — firing ADR-022E gate #9 (no §5.a substrate
  evidence pinning is supplied by ADR-027C).
- **4.b** — deprecating `@loa/straylight/runtime/recall-intake`
  or retiring the subpath (no §5.b retirement plan is supplied
  by ADR-027C; ADR-027C only catalogues readiness).
- **4.c** — moving `handleRecallIntake` enforcement into Finn.
- **4.d** — restoring Straylight to full type-only posture
  (the runtime allowlist remains as recorded in
  [ADR-026A §3](./ADR-026A-runtime-recall-intake-subpath.md);
  removal is a §5-firing event under ADR-027C-Fire).
- **4.e** — re-opening `loa-dixie` PR #102 (explicitly
  forbidden by ADR-027A §8.b).
- **4.f** — filing a sibling-repo PR or comment on
  `0xHoneyJar/loa-finn` or `0xHoneyJar/loa-dixie`.
- **4.g** — claiming ADR-027C fires any ADR-022E gate.
- **4.h** — citing ADR-027C as a substitute for the §5.e
  pre-merge Flatline + Bridgebuilder (which remains
  **currently unsatisfied** while substrate is degraded).

### 5. Rollback

ADR-027C is docs-only. Rollback is the inverse-docs-only
operation: delete this ADR plus any append-only Phase 27B
sections that reference it; restore the post-Phase-27A
baseline. Rollback does not re-open `loa-dixie` PR #102 and
does not authorize any sibling-repo edit.

## Consequences

- The Finn return-gate generic criteria from ADR-027A §5 are
  paired with a current-state evidence inventory. Reviewers
  can refuse a Finn-touching PR on either the generic
  criterion (ADR-027A §5) or the missing inventory row
  (ADR-027C §2 / §3).
- The §5.e pre-merge real 3-model Flatline + Bridgebuilder
  gate remains **explicitly unsatisfied** under ADR-027C and
  is not pre-cleared for any successor.
- ADR-027C-Fire is unambiguously a §3-class
  authorization-creating doc under ADR-026A0 and inherits the
  full Flatline + Bridgebuilder requirement on its own.
  ADR-027C pre-approves no successor.
- The Phase 28 coding-candidate note
  ([`../handoffs/phase-27b-phase-28-coding-candidate.md`](../handoffs/phase-27b-phase-28-coding-candidate.md))
  may cite ADR-027C as the readiness record for any Finn-
  adjacent slice but must defer authorization to ADR-027C-Fire.

## Validation

Phase 27B adds no source / test / fixture / script / package
change; the working-tree surface is the entire validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full Phase 27B working set
```

Plain `git diff --stat` reports tracked-file modifications
only and will **not** show the new ADRs / handoffs until they
are staged; ADR-027C does not stage them. `npm run typecheck`,
`npm test`, `npm run build`, and `npm pack --dry-run` remain
identical to the post-Phase-27A baseline by construction.

## Source files inspected

- [`./ADR-027A-post-dixie-return-gate.md`](./ADR-027A-post-dixie-return-gate.md)
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
- [`./ADR-026C-dixie-recall-intake-consumer-contract.md`](./ADR-026C-dixie-recall-intake-consumer-contract.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md) row #9
- [`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md),
  [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md),
  [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (T13–T18 +
  T9 amendment).
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md).
- [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)
  (Phase 26F).
