# Phase 25A — Recall Wedge MVP implementation-sequencing decision-lock (docs-only)

> Status: Phase 25A is a **docs-only implementation-sequencing
> decision-lock**. Companion ADR:
> [`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md).
>
> Phase 25A pins the order in which existing ADR-022E gates
> should be considered when each gate's trigger independently
> fires, and pins the per-gate preconditions a future authorizing
> ADR must satisfy. **Phase 25A is sequencing, not authorization.**
>
> Phase 25A does **not** create or relax any ADR-022E gate, does
> **not** add code, tests, fixtures, schemas, exports, dependencies,
> package metadata, or `dist-types/`, does **not** edit any sibling
> repo, does **not** create a new tag, does **not** push a tag,
> does **not** publish, does **not** create a GitHub Release, does
> **not** advance the Phase 19A pending feedback gate, does **not**
> request any Flatline / Bridgebuilder / red-team review, and does
> **not** touch
> [`../../.loa`](../../.loa) /
> [`../../.loa.config.yaml`](../../.loa.config.yaml) /
> [`../../.claude/`](../../.claude/) /
> [`../../.beads/`](../../.beads/) /
> [`../../.run/`](../../.run/) /
> [`../../.github/`](../../.github/) /
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
> `node_modules/`. Phase 25A edits only this handoff, the
> companion ADR-025A, and the README index append.

## Executive summary

Phase 24L (PR #38, merged) closed the Straylight-side intake for
Dixie type-only consumption and recorded all three ADR-024H
gates as satisfied. The package surface, the host scaffold, the
annotated `v0.0.1` tag, and the Hounfour pin are unchanged from
the post-Phase-24K-opening baseline. Phase 25A:

- **Records** the post-Phase-24L state.
- **Sequences** ADR-022E gates #1–#20 by current status,
  required trigger, and likely successor ADR family.
- **Pins** the per-gate checklist a future authorizing ADR must
  satisfy.
- **Refuses** to authorize any implementation step on its own.

## Phase 24H–24L recap (what Phase 25A does not redo)

Phase 24H made the package surface type-only consumable.
Phase 24I enumerated the three conjunctive gates. Phase 24J
selected Posture 1a and prepared Gate 2. Phase 24K-opening
pinned Gate 2's tag-execution parameters. The operator action
cut + pushed the annotated `v0.0.1` tag against
`de65d93568e70c53ba952279f41a23d2f7d5123e`. Dixie PR #97 bumped
Hounfour to `v8.6.0` (Posture 3a). Dixie PR #99 flipped the
type-only dependency conformingly. Phase 24L (PR #38) recorded
all of the above on the Straylight side.

## Current state

| Fact | Value |
|---|---|
| Branch (this PR) | `phase-25a-recall-wedge-mvp-implementation-readiness` (docs-only) |
| `main` HEAD | post-PR-#38 (Phase 24L merged) |
| Phase 24L recording baseline | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git tag --list v0.0.1` | `v0.0.1` (annotated) |
| `git rev-parse v0.0.1^{commit}` | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git cat-file -t v0.0.1` | `tag` (annotated) |
| GitHub Releases | **0** |
| Package `name` / `version` / `private` | `@loa/straylight` / `0.0.1` / `true` |
| Hounfour pin (Straylight) | `@0xhoneyjar/loa-hounfour@^8.6.0` |
| Forbidden-path `git diff` (ADR-024I §5 file list) | **empty** against `main` |
| ADR-024H Gate 1 (Publish posture) | **Satisfied** (Posture 1a, ADR-024I §"Decision" §1) |
| ADR-024H Gate 2 (Release / tag consumption point) | **Satisfied** (annotated `v0.0.1` cut + pushed) |
| ADR-024H Gate 3 (Hounfour version-skew resolution) | **Satisfied** (Posture 3a, Dixie PR #97) |
| Dixie type-only consumption (PR #99) | First conforming downstream consumer |
| Phase 19A pending feedback on `0xHoneyJar/loa-hounfour#70` | Pending |
| ADR-022E gate inventory | Gates #1–#20 (unchanged) |

## ADR-022E gate sequencing table

**Sequencing only — not authorization. Each successor ADR remains
independently required, independently triggered, and independently
refusable.**

| # | Topic | Current status | Trigger required before action | Likely successor ADR / phase family |
|---|---|---|---|---|
| 1 | `EstateTransition` schema (canonical) | Hounfour delta #8 queued; not in v8.6.x | Hounfour ships `estate-transition.schema.json` (or equiv) under v8.6.x; separate ADR adopts it. | Schema-adoption ADR (ADR-022C-style). |
| 2 | `EstateTransition` local impl | Local in `src/straylight/estate.ts` | #1 unblocks (adopt by alias) **or** separate ADR authorizes a local primitive. | Local-primitive ADR (currently neither path is open). |
| 3 | `safeCanonicalize` JS-subpath adoption | No `./canonicalize` / `./utilities` Hounfour subpath | Hounfour ships declared subpath; separate ADR adopts. | Hounfour-subpath-adoption ADR. |
| 4 | `Challenge` adoption into wedge public surface | Schema shipped at v8.6.0; not adopted | Separate ADR cites the v8.6.0 `$id`, specifies alias / re-export path, pins a boundary preservation test. | Public-surface-widening ADR. |
| 5 | `AuditEvent` adoption from a Hounfour candidate | v8.6.x ships `audit-trail-entry` / `domain-event`; no `audit-event` schema | Separate ADR adopts a candidate as canonical `AuditEvent`, or Hounfour ships `audit-event.schema.json`. | Schema-adoption ADR. |
| 6 | `policy-decision-denied` schema-candidate | DEFERRED disposition (Phase 21B Q3) | Schema-candidate refresh decides classification. Non-blocking. | Schema-candidate refresh phase. |
| 7 | Public commitment-root anchor / on-chain | ADR-020E unchanged; seven future-requirement gates unsatisfied | Separate ADR satisfies / formally addresses the seven gates; explicitly proposes wiring. | Anchor / on-chain wiring ADR (paired with #20). |
| 8 | Production database / persistence substrate | ADR-020D / ADR-022D unchanged; MVP adapters are `InMemoryStorage` / `JsonlStorage` | Separate ADR proposes the production adapter; cites sibling-repo handoff; preserves ADR-022D invariants. | Persistence-substrate ADR. |
| 9 | Finn runtime wiring (Phase 10 in `loa-finn`) | Phase 21B Q5 does not authorize Finn boundary prep; ADR-022B placement unselected | (a) Phase 19A `#70` feedback received **or** teammate-review approval; (b) ADR-022B-criteria placement ADR selects Finn; (c) `loa-finn` PR opens under teammate review. | Endpoint-host placement ADR (Finn) + Finn runtime ADR. |
| 10 | Dixie boundary wiring (Phase 12 in `loa-dixie`) | Symmetric to #9 | Symmetric to #9; placement ADR selects Dixie. | Endpoint-host placement ADR (Dixie) + Dixie BFF ADR. |
| 11 | Freeside community / app / bot surface (Phase 14) | ADR-022B decision #3 + no-go sequence: Freeside is **not** an MVP endpoint host candidate | (a) MVP endpoint host stable (#9 or #10); (b) Phase 14 packet executes in `loa-freeside` under teammate review; (c) ADR authorizes Freeside as a *consumer*. | Freeside-consumer ADR (downstream of #9/#10). |
| 12 | New HTTP / NATS / REST / Discord / Telegram surface | Wedge has no network surface today | MVP endpoint host wiring (#9 or #10) brings network surface; threat-model update **before** wiring (per #20). | Network-surface ADR (paired with #20). |
| 13 | Reach into unexported Hounfour internals | Forbidden by Phase 17B / 18 / 21A / 21B + subpath-import discipline | **Never.** No future ADR may grant this. | None. ADR-025A does **not** sequence this gate. |
| 14 | New `package.json` / `package-lock.json` dependencies | None of #9 / #10 / #11 / #12 are MVP yet | Feature gate unblocks **and** the dependency lands with the implementation phase, not docs-only. | Implementation phase that wires the feature. |
| 15 | Sibling-repo edits | Phases 9 / 10 / 12 / 14 packets are *staged*, not *implemented* | Sibling-repo work happens in the sibling repo under teammate review. | Sibling-side PRs (not authored by Straylight). |
| 16 | Hounfour status comment filing on `#70` | Filing is sibling-repo, human-reviewed | Teammate / Eileen reviews drafted comment and files it. | Out-of-repo human-review event. |
| 17 | Eleven exported-but-unconsumed Hounfour JS subpaths | Informational; absence is the subpath-discipline default | Documented evidence-backed need + separate ADR + future implementation phase. | Hounfour-subpath-adoption ADR. |
| 18 | Adoption of a Hounfour-named symbol into Straylight *public* surface | Public surface is Straylight-named per ADR-020C / ADR-022A / ADR-022C | Separate ADR authorizes a public re-export; pins a boundary preservation test. | Public-surface-widening ADR (overlaps with #4). |
| 19 | Phase 22+ implementation work without a separate authorizing ADR | Constrained per Phase 21B Q5 + ADR-022A–D | Separate ADR (under teammate review) opens the implementation lane and cites which gates it unblocks. | Any successor authorizing ADR. |
| 20 | Threat-model widening | Network adversary + cryptographic forgery + on-chain integrity out-of-scope at MVP | Wiring an MVP endpoint host (#9 / #10) **or** wiring a public anchor (#7) — threat-model update **before** the wiring ADR is accepted. | Threat-model-update ADR (paired with #7 / #9 / #10 / #12). |

ADR-025A's full sequencing decision (with §"Decision" §§1–5,
§"Future authorizing ADR — required content", and the "How
future work may cite Phase 25A" allowed/forbidden lists) lives
in
[`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md).

## Future authorizing ADR — required content

A future authorizing ADR that lands implementation work for any
ADR-022E gate above MUST provide all of the following.
Reviewers may refuse a successor ADR that omits any item:

1. **Trigger evidence** — concrete proof the gate's ADR-022E
   trigger has fired.
2. **Source artifact citation** — the ADR-022E row, the
   ADR-024H/I/J/K substrate citations, and the
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
   sections the work touches.
3. **Exact scope** — what the implementation phase ships and
   what it does not.
4. **Exact files allowed** — bounded list of files the phase
   may create / modify / delete.
5. **Threat-model impact** — does the work widen the threat
   model (gate #20)? If yes, the threat-model update lands
   **before** the wiring ADR is accepted.
6. **Validation plan** — concrete commands and expected
   outcomes.
7. **Rollback / refusal rules** — what the ADR refuses to
   authorize, and the explicit non-scope future PRs must not
   cite the ADR for.
8. **Whether Flatline is required** — if the work changes the
   package surface, source, tests, fixtures, schemas, or
   dependencies, Flatline / Bridgebuilder / red-team review
   discipline applies; the ADR must say so.

## How future work may cite Phase 25A

**Allowed:**

- Cite ADR-025A for sequencing / ordering / trigger inventory
  of ADR-022E gates.
- Cite ADR-025A as the in-repo anchor that records which gates
  are open vs closed at the time the successor ADR is written.
- Cite ADR-025A's §3 checklist as the per-gate precondition
  list a successor authorizing ADR must satisfy.

**Forbidden:**

- Cite ADR-025A as **implementation authorization** — it is
  refusable as authorization on §"Decision" §5 grounds verbatim.
- Cite ADR-025A as a **substitute for the gate's ADR-022E
  trigger**.
- Cite ADR-025A as **pre-approval of a particular ordering** —
  the order in which authorizing ADRs are written is determined
  by which trigger independently fires, not by the table.
- Cite ADR-025A as authorization to **add or relax an ADR-022E
  gate**.

## Refusal rules — what Phase 25A does NOT authorize

Future PRs **must not** cite Phase 25A as authorization for any
of the following. Reviewers may cite this section verbatim to
refuse:

1. **No runtime widening** of `@loa/straylight` or
   `@loa/straylight/host`.
2. **No endpoint, route, middleware, proxy, rendering, or
   public surface.**
3. **No vector 9 / vectors 10–11 widening.**
4. **No Hounfour `#116` adoption** into the Straylight public
   surface.
5. **No `0xhoneyjar:straylight:*` adoption** into the
   Straylight public surface.
6. **No Hounfour `recall-wedge` adoption** into the Straylight
   test suite.
7. **No public commitment-root behavior.**
8. **No Hounfour change.** Straylight's Hounfour pin remains
   `^8.6.0`.
9. **No Straylight dependency-posture change.** Posture 1a
   remains selected.
10. **No new tag or release.**
11. **No sibling-repo edit.**
12. **No Phase 19A advance.**
13. **No ADR-022E gate added or relaxed.**

## Explicit non-scope

1. No file changes outside the three approved docs (this
   handoff, ADR-025A, README append).
2. No `package.json` / `package-lock.json` / `.npmrc` /
   `.gitignore` / `tsconfig*.json` / `vitest.config.ts` edit.
3. No source / test / fixture / script / dist-types edit.
4. No `package-boundary.md` / `threat-model.md` /
   `straylight-recall-wedge.md` / `phase-4-demo.md` edit.
5. No prior-ADR or prior-handoff edit.
6. No new tag / push / Release / publish.
7. No Hounfour bump or change.
8. No sibling-repo edit.
9. No Phase 19A advance.
10. No `npm install` / `npm update` / `npm ci` /
    `npm publish` / `npm version` / `git tag` /
    `git push --tags` / `gh release create` / package-manager
    mutation. `npm pack --dry-run` is allowed in validation
    (read-only).
11. No GitHub issue / comment / PR action.
12. No Flatline / Bridgebuilder / red-team request.
13. No new ADR-022E gate; no relaxation of any ADR-022E
    trigger or precondition.
14. No prediction of which trigger fires first.

## Validation

Phase 25A is **docs-only**. Package surface, source, tests,
fixtures, schemas, declarations, and dependencies are
byte-identical to the post-Phase-24L baseline.

### Validation commands

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ \
  package.json package-lock.json \
  tsconfig.json tsconfig.build.json vitest.config.ts \
  .npmrc .gitignore \
  dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
```

### Expected outcomes

- `npm run typecheck` — clean.
- `npm test` — passes identically to the post-Phase-24L
  baseline (no test added; no test edited).
- `npm run build` — clean; rebuilt `dist-types/` is byte-
  identical to the committed artifact.
- Both declaration entrypoints exist.
- `npm pack --dry-run` — tarball preview unchanged from
  Phase 24H/I/J/K/L.
- Forbidden-path `git diff` — **empty**.
- `git diff --stat` — shows only the three Phase 25A docs
  (this handoff, ADR-025A, README append).
- `git status --short` — shows the three Phase 25A docs plus
  any pre-existing local dirt.
- `git tag --list v0.0.1` — prints `v0.0.1`.
- `git rev-parse v0.0.1^{commit}` — prints
  `de65d93568e70c53ba952279f41a23d2f7d5123e`.
- `git cat-file -t v0.0.1` — prints `tag`.

## Open follow-ups

1. **Successor ADRs** — each ADR-022E gate row above remains
   blocked behind its own trigger. No row is pre-authorized.
2. **Phase 19A pending feedback** on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
   — pending. Phase 25A does not advance it.
3. **Hounfour upstream activity** — if Hounfour ships
   `EstateTransition`, an `audit-event` schema, a
   `./canonicalize` subpath, or `#116` outputs, the
   corresponding ADR-022E row's trigger is satisfied; the
   sequencing table's "Current status" becomes stale and a
   successor ADR records the update.
4. **Endpoint-host placement** — ADR-022B preferred Dixie;
   ADR-025A does not re-litigate. A future placement ADR
   makes the selection final under its own trigger evidence.
5. **Threat-model update obligation** — gate #20 remains
   owned by ADR-022E; ADR-025A only cites it.

## Cross-references

- Companion ADR:
  [`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md).
- Direct predecessor (Dixie host type-only consumption intake):
  [`./phase-24l-dixie-host-type-consumption-intake.md`](./phase-24l-dixie-host-type-consumption-intake.md)
  +
  [`../decisions/ADR-024K-dixie-host-type-consumption-intake.md`](../decisions/ADR-024K-dixie-host-type-consumption-intake.md).
- Implementation gate inventory:
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md).
- Stable surface (read-only):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Threat model (read-only; gate #20 owner):
  [`../mvp/threat-model.md`](../mvp/threat-model.md).
- Phase 5 wedge entry (read-only):
  [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md).
- Schema-contract draft (read-only):
  [`../specs/recall-wedge-schema-contract.md`](../specs/recall-wedge-schema-contract.md).
- Conformance vectors (read-only):
  [`../specs/recall-wedge-conformance-vectors.md`](../specs/recall-wedge-conformance-vectors.md).
- Dixie host MVP contract (read-only):
  [`../specs/dixie-recall-host-mvp-contract.md`](../specs/dixie-recall-host-mvp-contract.md).
- Dixie host validation vectors (read-only):
  [`../specs/dixie-recall-host-validation-vectors.md`](../specs/dixie-recall-host-validation-vectors.md).
