# ADR-025A — Recall Wedge MVP implementation sequencing (Phase 25A)

## Status

Accepted-for-Phase-25A.

This ADR is the **Phase 25A implementation-sequencing decision-
lock**. It is a **docs-only sequencing reference**: it pins the
order in which the existing
[`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
gates should be considered when each gate's trigger
independently fires, and it pins the per-gate preconditions a
future authorizing ADR must satisfy before any implementation
work begins.

ADR-025A is **sequencing, not authorization**. It does **not**
authorize any implementation step, does **not** create any new
gate, does **not** relax any existing gate, does **not** weaken
any existing precondition, and does **not** pre-approve any
successor ADR. Each successor ADR remains independently
required, independently triggered, and independently refusable
on its own evidence.

ADR-025A does **not** edit
[`../../package.json`](../../package.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../tsconfig.json`](../../tsconfig.json),
[`../../tsconfig.build.json`](../../tsconfig.build.json),
[`../../vitest.config.ts`](../../vitest.config.ts),
[`../../.npmrc`](../../.npmrc),
[`../../.gitignore`](../../.gitignore), any file under
[`../../src/`](../../src/), any file under
[`../../tests/`](../../tests/), any file under
[`../../scripts/`](../../scripts/), any file under
[`../../fixtures/`](../../fixtures/), any committed declaration
under [`../../dist-types/`](../../dist-types/), or
[`../mvp/package-boundary.md`](../mvp/package-boundary.md). It
edits no prior ADR, no prior handoff (other than the README
index entry authored alongside this ADR), and no sibling repo.
It cuts no tag, pushes no tag, publishes no package, creates no
GitHub Release, files no GitHub issue / comment / PR, bumps no
Hounfour dependency, runs no Flatline / Bridgebuilder / red-team
review, and does not touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`.

No Flatline pass is required because Phase 25A makes no
package-surface, source, test, fixture, schema, or dependency
change.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 25A.

ADR-025A sits on top of ADR-024A through ADR-024K and ADR-022A
through ADR-022E without modifying any of them.

## Context

### Post-Phase-24L state (intake baseline for Phase 25A)

Phase 24H made the Straylight package surface type-only
consumable (two `exports` keys, each `"types"`-only; committed
`dist-types/`; no `main` field; no runtime conditions;
`"private": true`). Phase 24I enumerated the three conjunctive
gates between the type-consumable surface and a downstream Dixie
flip. Phase 24J selected Posture 1a (private + tag-pinned git
source). Phase 24K-opening pinned Gate 2's tag-execution
parameters. The operator action subsequently cut and pushed the
annotated `v0.0.1` tag against
`de65d93568e70c53ba952279f41a23d2f7d5123e` per ADR-024J §"Decision"
§§1–9. Dixie PR #97 bumped `@0xhoneyjar/loa-hounfour` from
`v8.3.1` to `v8.6.0` (Posture 3a). Dixie PR #99 flipped the
type-only dependency conformingly under all three gates.
Phase 24L (PR #38, merged) recorded all three events and closed
the Straylight-side intake for Dixie type-only consumption.

| Fact | Value |
|---|---|
| `main` HEAD | post-PR-#38 (Phase 24L merged) |
| Phase-24L recording baseline | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git tag --list v0.0.1` | `v0.0.1` (annotated) |
| `git rev-parse v0.0.1^{commit}` | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git cat-file -t v0.0.1` | `tag` |
| GitHub Releases for Straylight | **0** |
| Package `name` / `version` / `private` | `@loa/straylight` / `0.0.1` / `true` |
| Hounfour pin (Straylight) | `@0xhoneyjar/loa-hounfour@^8.6.0` |
| ADR-024H Gate 1 (Publish posture) | **Satisfied** by ADR-024I §"Decision" §1 (Posture 1a) |
| ADR-024H Gate 2 (Release / tag consumption point) | **Satisfied** by the annotated `v0.0.1` tag |
| ADR-024H Gate 3 (Hounfour version-skew resolution) | **Satisfied** by Posture 3a |
| Dixie type-only consumption | First conforming consumer (Dixie PR #99); type-only `import type` / `export type` only |
| Phase 19A pending feedback on `0xHoneyJar/loa-hounfour#70` | Pending |
| ADR-022E gate inventory | Gates #1–#20 remain the implementation gate set |

### What Phase 25A is for

Now that the post-Phase-24H type-only surface has been exercised
by a real downstream consumer and all three ADR-024H gates are
satisfied, the next implementation question is **not** "what do
we ship next" — every concrete next step is gated by an
ADR-022E row that has not been independently triggered, and
every concrete next step is independently refusable. The next
implementation question is **"in what order should ADR-022E
gates be considered when their triggers fire, and what must a
successor authorizing ADR provide before that gate's
implementation work begins?"**

ADR-025A pins the order and the per-gate preconditions. It
neither answers "what ships next" nor pre-approves the answer.

## Decision

### 1. Restate the Phase 24H/24I/24J/24L posture as the implementation substrate

The implementation substrate Phase 25A sequences against is the
post-Phase-24L surface, byte-identical to the post-Phase-24K-
opening package state:

- Posture 1a (private + tag-pinned git source consumption) is
  the only authorized publish posture (ADR-024I §"Decision" §1).
- The `./` and `./host` subpaths are type-only; runtime widening
  remains explicitly unauthorized (ADR-024G §"Decision" §2,
  ADR-024K §"Decision" §5.1).
- The annotated `v0.0.1` tag is read-only; tag immutability
  holds (ADR-024J §"Decision" §9, ADR-024I §6).
- The Hounfour pin (`^8.6.0`) is unchanged.
- The wedge public surface (sections 1–11 of
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md))
  and the `./host` six-handler / two-helper / `*Deps` surface
  are unchanged.

ADR-025A does not widen, narrow, reopen, or qualify any of
these. They are the substrate; sequencing is layered on top.

### 2. ADR-022E gate sequencing table

Each row below cites an existing ADR-022E gate. The **trigger**
column quotes the ADR-022E "Trigger to unblock" verbatim or
near-verbatim. The **likely successor** column names the family
of authorizing ADR that would land the implementation work; it
is **informational**, not a reservation.

**Sequencing only — not authorization. Each successor ADR
remains independently required and independently refusable.**

| # | Topic | Current status | Trigger required before action | Likely successor ADR / phase family |
|---|---|---|---|---|
| 1 | `EstateTransition` schema (canonical) | Hounfour delta #8 queued; no schema in v8.6.x | Hounfour ships an `estate-transition.schema.json` (or equivalent) under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.x/`, **and** a separate ADR adopts it under ADR-020C / ADR-022C. | Schema-adoption ADR family (ADR-022C-style). |
| 2 | `EstateTransition` local impl | Local in `src/straylight/estate.ts` per ADR-020C / ADR-022A | Either #1 unblocks (adopt by alias), **or** a separate ADR explicitly authorizes a local primitive. | Local-primitive ADR (currently neither path is open). |
| 3 | `safeCanonicalize` JS-subpath adoption | No `./canonicalize` / `./utilities` Hounfour subpath at v8.6.x | Hounfour ships a declared `./canonicalize` (or `./utilities`) subpath whose JS module exports `safeCanonicalize`, **and** a separate ADR adopts the subpath. | Hounfour-subpath-adoption ADR family. |
| 4 | `Challenge` adoption into wedge public surface | Schema shipped at v8.6.0; not adopted | Separate ADR cites the v8.6.0 `$id`, specifies alias / re-export path, and pins a boundary preservation test. | Public-surface-widening ADR. |
| 5 | `AuditEvent` adoption from a Hounfour candidate | v8.6.x ships `audit-trail-entry.schema.json` and `domain-event.schema.json`; no `audit-event.schema.json` | Separate ADR explicitly adopts one of the v8.6.x candidates as canonical `AuditEvent`, or Hounfour ships an `AuditEvent` schema under that name. | Schema-adoption ADR family. |
| 6 | `policy-decision-denied` schema-candidate | DEFERRED disposition in Phase 21B Q3 | Separate ADR or schema-candidate refresh decides classification. Non-blocking; informational. | Schema-candidate refresh phase. |
| 7 | Public commitment-root anchor / on-chain | ADR-020E unchanged; seven future-requirement gates unsatisfied | Separate ADR satisfies (or formally addresses) the seven gates and explicitly proposes wiring. | Anchor / on-chain wiring ADR. |
| 8 | Production database / persistence substrate | ADR-020D / ADR-022D unchanged; `InMemoryStorage` / `JsonlStorage` are the MVP adapters | Separate ADR proposes the production adapter, cites the relevant sibling-repo handoff, and preserves the ADR-022D receipt and audit-chain invariants. | Persistence-substrate ADR. |
| 9 | Finn runtime wiring (Phase 10 contract execution in `loa-finn`) | Phase 21B Q5 does not authorize Finn boundary prep; ADR-022B placement unselected | (a) Phase 19A pending feedback on `#70` received **or** teammate-review approval on this repo; (b) ADR-022B-criteria-driven placement ADR selects Finn; (c) corresponding `loa-finn` PR opens under teammate review. | Endpoint-host placement ADR (Finn branch) + Finn runtime ADR. |
| 10 | Dixie boundary wiring (Phase 12 contract execution in `loa-dixie`) | Symmetric to #9; Phase 21B Q5 does not authorize Dixie boundary prep | (a) Phase 19A feedback received or teammate-review approval; (b) placement ADR selects Dixie; (c) corresponding `loa-dixie` PR opens under teammate review. | Endpoint-host placement ADR (Dixie branch) + Dixie BFF ADR. |
| 11 | Freeside community / app / bot surface (Phase 14) | Per ADR-022B decision #3 + the no-go sequence, Freeside is **not** a candidate MVP endpoint host | (a) MVP endpoint host wired and stable (#9 or #10); (b) Phase 14 packet executes in `loa-freeside` under teammate review; (c) ADR explicitly authorizes Freeside as a consumer (not a host). | Freeside-consumer ADR (downstream of #9/#10). |
| 12 | New HTTP / NATS / REST / Discord / Telegram surface | Wedge has no network surface today | An MVP endpoint host wiring (#9 or #10) brings the network surface; threat model must be updated *before* that wiring lands. | Network-surface ADR (paired with #20). |
| 13 | Reach into unexported Hounfour internals (`dist/utilities/`, `dist/...`) | Forbidden by Phase 17B / 18 / 21A / 21B user-facing constraint and subpath-import discipline | **Never.** No future ADR may grant this. | None. ADR-025A does **not** sequence this gate. |
| 14 | New `package.json` / `package-lock.json` dependencies | None of #9 / #10 / #11 / #12 are MVP yet | Corresponding feature gate (#9 / #10 / #11 / #12) unblocks **and** the dependency is added by the implementation phase that wires the feature, not by any docs-only phase. | Implementation phase that wires the feature. |
| 15 | Sibling-repo edits (`loa-hounfour`, `loa-finn`, `loa-dixie`, `loa-freeside`) | Phases 9 / 10 / 12 / 14 packets are *staged*, not *implemented* | Sibling-repo work happens in the sibling repo under teammate review. | Sibling-side PRs (not authored by Straylight). |
| 16 | Hounfour status comment filing on `#70` | Filing is sibling-repo, human-reviewed | Teammate / Eileen reviews drafted comment and files it on `0xHoneyJar/loa-hounfour#70` outside this repo. | Out-of-repo human review event. |
| 17 | Eleven exported-but-unconsumed Hounfour JS subpaths | Informational; absence from Straylight import surface is the Phase 17B / 18 / 21A subpath-discipline default | Documented evidence-backed Straylight need + separate ADR + future implementation phase that explicitly cites the authorization. | Hounfour-subpath-adoption ADR family. |
| 18 | Adoption of a Hounfour-named symbol into Straylight *public* surface | Hounfour alias module is private; public surface is Straylight-named | Separate ADR explicitly authorizes a public re-export and pins a boundary preservation test. The shipping of `Challenge` upstream does not, by itself, qualify. | Public-surface-widening ADR (overlaps with #4). |
| 19 | Phase 22+ implementation work without a separate authorizing ADR | Per Phase 21B Q5 + ADR-022A–D, Phase 22+ implementation work is constrained to allowable shapes | Separate ADR (under teammate review) explicitly opens the implementation lane and cites which gates it unblocks. | Any successor authorizing ADR. |
| 20 | Threat-model widening (network adversary, cryptographic forgery, on-chain integrity) | Both adversary classes out-of-scope at MVP per [`../mvp/threat-model.md`](../mvp/threat-model.md) | Wiring an MVP endpoint host (#9 or #10) **or** wiring a public anchor (#7) requires updating the threat model **before** the wiring ADR is accepted. | Threat-model-update ADR (paired with #7 / #9 / #10 / #12). |

**Sequencing-only refusal.** ADR-025A explicitly refuses to
predict which trigger fires first, refuses to recommend that any
trigger be accelerated, and refuses to act as authorization for
any row above. The order in which authorizing ADRs are written
is determined by which trigger independently fires, not by
ADR-025A.

### 3. Future authorizing ADR — required content

A future authorizing ADR that lands implementation work for any
gate above MUST provide all of the following. Reviewers may
refuse a successor ADR that omits any item:

1. **Trigger evidence.** Concrete proof that the gate's
   ADR-022E trigger has fired (e.g., a Hounfour release link, a
   Phase 19A feedback citation, a teammate-review approval
   record).
2. **Source artifact citation.** The ADR-022E row, the
   ADR-024H/I/J/K substrate citations, and the
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
   sections the work touches.
3. **Exact scope.** What the implementation phase ships and
   what it does not. ADR-025A's sequencing row is not a scope.
4. **Exact files allowed.** A bounded list of files the
   implementation phase may create, modify, or delete. Wildcard
   permissions are not acceptable.
5. **Threat-model impact.** Whether the work widens the threat
   model (gate #20). If yes, the threat-model update lands
   **before** the wiring (per ADR-022E #20).
6. **Validation plan.** Concrete commands and expected
   outcomes — typecheck, test, build, pack-shape (if package
   surface widens), forbidden-path diff (if doc-only).
7. **Rollback / refusal rules.** What this ADR refuses to
   authorize, and the explicit non-scope items future PRs must
   not cite this ADR for.
8. **Whether Flatline is required.** If the work changes the
   package surface, source, tests, fixtures, schemas, or
   dependencies, Flatline / Bridgebuilder / red-team review
   discipline applies; the ADR must say so explicitly.

### 4. How future work may cite Phase 25A

**Allowed citations:**

- For sequencing / ordering / trigger inventory of
  ADR-022E gates.
- As the in-repo anchor that documents which gates are open
  vs which are closed at the time the successor ADR is written.
- As the source of the "future authorizing ADR — required
  content" checklist (§3 above).

**Forbidden citations:**

- As implementation authorization. Phase 25A authorizes no
  implementation step; reviewers may refuse a future PR that
  cites Phase 25A as authorization on §"Decision" §5 grounds
  verbatim.
- As a substitute for the gate's ADR-022E trigger. Sequencing
  is independent of trigger satisfaction.
- As pre-approval for a particular ordering. The order in
  which authorizing ADRs are written is determined by which
  trigger independently fires, not by ADR-025A's table.
- As authorization to add a new ADR-022E gate or to relax an
  existing one.

### 5. Refusal rules for citing Phase 25A

Future PRs (Straylight-side or sibling-side) **must not** cite
Phase 25A as authorization for any of the following. Reviewers
may cite this section verbatim to refuse:

1. **No runtime widening** of `@loa/straylight` or
   `@loa/straylight/host`. Runtime widening still requires its
   own ADR per ADR-024G §"Decision" §2; ADR-025A does not
   pre-authorize that ADR.
2. **No endpoint, route, middleware, proxy, rendering, or
   public surface** on the Straylight side or the Dixie side.
   The Phase 20D endpoint-boundary nominees remain contract
   candidates only.
3. **No vector 9 or vectors 10–11** widening. Each vector
   widening requires its own ADR.
4. **No Hounfour `#116` adoption** into the Straylight public
   surface. Adoption remains deferred per ADR-024A and
   ADR-022E.
5. **No `0xhoneyjar:straylight:*` adoption** into the
   Straylight public surface. Adoption remains deferred.
6. **No Hounfour `recall-wedge` adoption** into the Straylight
   test suite. Adoption remains deferred.
7. **No public commitment-root behavior.** Publication remains
   deferred per ADR-020E and ADR-022E #7.
8. **No Hounfour change.** Straylight's Hounfour pin remains
   `^8.6.0`; Hounfour itself is a sibling repo Phase 25A does
   not edit.
9. **No Straylight dependency-posture change.** Posture 1a
   (private + tag-pinned git source) remains selected; Posture
   1b reopening, hybrid-posture adoption, GitHub Packages
   publishing, npm publishing remain deferred per ADR-024I
   §"Decision" §§2–3.
10. **No new tag or release.** No `v0.0.2` / `v0.1.0` /
    `v1.0.0` / pre-release / build-metadata tag; no GitHub
    Release.
11. **No sibling-repo edit.** `loa-dixie`, `loa-finn`,
    `loa-freeside`, `loa-hounfour` are read-only for
    Phase 25A.
12. **No Phase 19A advance** on
    [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
13. **No ADR-022E gate added or relaxed.** Adding a 21st gate,
    or weakening any of the existing 20 triggers / preconditions,
    is out of scope. ADR-025A reads from ADR-022E; it does not
    write to it.

## Explicit non-scope

ADR-025A inherits every non-goal from ADR-024A through ADR-024K
and ADR-022A through ADR-022E wholesale, and adds these
Phase-25A-specific refusals:

1. **No file changes outside the three approved docs.** Only
   this ADR, the companion handoff
   ([`../handoffs/phase-25a-recall-wedge-mvp-implementation-readiness.md`](../handoffs/phase-25a-recall-wedge-mvp-implementation-readiness.md)),
   and the README index append are new.
2. **No `package.json` edit.** No `version`, `scripts`,
   `private`, `exports`, `files`, `dependencies`,
   `devDependencies`, or `engines` change.
3. **No `package-lock.json` edit.**
4. **No `.npmrc` / `.gitignore` edit.**
5. **No `tsconfig.json` / `tsconfig.build.json` edit.**
6. **No `vitest.config.ts` edit.**
7. **No source / test / fixture / script / dist-types edit.**
8. **No `package-boundary.md` / `threat-model.md` /
   `straylight-recall-wedge.md` / `phase-4-demo.md` edit.**
9. **No prior-ADR or prior-handoff edit.**
10. **No new tag / push / Release / publish.**
11. **No Hounfour bump or change.**
12. **No sibling-repo edit.**
13. **No Phase 19A advance.**
14. **No `npm install` / `npm update` / `npm ci` /
    `npm publish` / `npm version` / `git tag` /
    `git push --tags` / `gh release create` / package-manager
    mutation command.** `npm pack --dry-run` is allowed in
    validation (read-only).
15. **No GitHub issue / comment / PR action.**
16. **No Flatline / Bridgebuilder / red-team request.**
17. **No touch of
    [`../../.loa`](../../.loa) /
    [`../../.loa.config.yaml`](../../.loa.config.yaml) /
    [`../../.claude/`](../../.claude/) /
    [`../../.beads/`](../../.beads/) /
    [`../../.run/`](../../.run/) /
    [`../../.github/`](../../.github/) /
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
    `node_modules/`.**
18. **No new ADR-022E gate.** ADR-022E gate inventory remains
    #1–#20.
19. **No relaxation of any ADR-022E trigger or precondition.**
20. **No prediction of which trigger fires first.** ADR-025A
    sequences the order of *consideration*; it does not
    predict the order of *firing*.

## Consequences

- **Sequencing is on the record.** Reviewers of any future
  authorizing ADR may cite ADR-025A for the gate inventory and
  the per-gate trigger requirement, and may refuse the
  successor ADR if it omits an item from §3 (future authorizing
  ADR — required content).
- **No implementation step is pre-approved.** ADR-025A is
  refusable as authorization on §5.1–§5.13 grounds. The next
  implementation phase still requires its own ADR with its own
  trigger evidence.
- **The substrate is unchanged.** Post-Phase-24L surface,
  source, tests, fixtures, schemas, and dependencies are
  byte-identical after ADR-025A merges.
- **Phase 25A is the implementation-sequencing anchor.**
  Future Straylight-side phases that need to reason about
  "what's next" cite ADR-025A for the order of consideration
  and ADR-022E for the per-gate triggers. ADR-025A does not
  duplicate ADR-022E; it sequences it.
- **ADR-025A is additive to ADR-022E and ADR-024K.** It does
  not supersede either; reopening either reopens ADR-025A.

## Source files inspected

- [`./0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md) through [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md) through [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md) through [`./ADR-024K-dixie-host-type-consumption-intake.md`](./ADR-024K-dixie-host-type-consumption-intake.md)
- [`../handoffs/phase-24l-dixie-host-type-consumption-intake.md`](../handoffs/phase-24l-dixie-host-type-consumption-intake.md) (read-only — Phase 25A does not edit it)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (read-only)
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (read-only)
- [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md) (read-only)
- [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md) (read-only)
- [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md) (read-only)
- [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md) (read-only)
- [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md) (read-only)
- [`../../package.json`](../../package.json) (read-only — `version` is `0.0.1`; matches `v0.0.1` byte-for-byte)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (read-only — wedge public surface, unchanged)
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) (read-only — host barrel, unchanged)
- [`../../dist-types/`](../../dist-types/) (read-only — committed declaration emit, unchanged)
- Annotated `v0.0.1` tag (read-only — `de65d93568e70c53ba952279f41a23d2f7d5123e`; verified at intake via `git cat-file -t v0.0.1` / `git rev-parse v0.0.1^{commit}`)
