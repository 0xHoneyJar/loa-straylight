# ADR-025B — Hounfour #70 status intake and adoption-trigger check (Phase 25B)

## Status

Accepted-for-Phase-25B.

This ADR is the **Phase 25B Hounfour #70 status-intake decision-
lock**. It is a **docs-only status-intake reference**: it records
the post-Phase-25A in-repo state of the
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
coordination thread, summarizes which substrate facts Hounfour
v8.5.x and v8.6.0 appear to have shipped, and applies the per-gate
trigger check from
[`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
against that state.

ADR-025B is **status intake, not authorization**. It does **not**
authorize any implementation step, does **not** authorize any
Hounfour adoption, does **not** create any new ADR-022E gate,
does **not** relax any existing ADR-022E gate, does **not**
weaken any existing precondition, and does **not** pre-approve
any successor ADR. Each successor ADR remains independently
required, independently triggered, and independently refusable on
its own evidence per
[`./ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](./ADR-025A-recall-wedge-mvp-implementation-sequencing.md).

ADR-025B does **not** edit
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

No Flatline pass is required because Phase 25B makes no package-
surface, source, test, fixture, schema, or dependency change.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
is **not advanced** by Phase 25B. The handoff records the gate's
in-repo status; it does not resolve it.

ADR-025B sits on top of ADR-024A through ADR-024K, ADR-022A
through ADR-022E, and ADR-025A without modifying any of them.

## Context

### Post-Phase-25A baseline (intake substrate for Phase 25B)

Phase 25A (PR #39, merged) recorded the post-Phase-24L state and
sequenced ADR-022E gates #1–#20. Phase 25B does not redo that
sequencing; it intakes the upstream coordination state against it.

| Fact | Value |
|---|---|
| `main` HEAD | post-PR-#39 (Phase 25A merged) |
| Phase-25A baseline commit | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git tag --list v0.0.1` | `v0.0.1` (annotated) |
| `git rev-parse v0.0.1^{commit}` | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git cat-file -t v0.0.1` | `tag` |
| GitHub Releases for Straylight | **0** |
| Package `name` / `version` / `private` | `@loa/straylight` / `0.0.1` / `true` |
| Hounfour pin (Straylight) | `@0xhoneyjar/loa-hounfour@^8.6.0` |
| Phase 24L (PR #38) | Merged — Dixie host type-only consumption intake closed |
| Phase 25A (PR #39) | Merged — implementation-sequencing decision-lock recorded |
| Accidental tags (`v0.0.2`, `v0.0.3`) | Deleted locally and remotely **before Phase 25B** — not part of any release-consumption posture |
| Sole release-consumption tag | `v0.0.1`, pointing at `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| ADR-022E gate inventory | Gates #1–#20 unchanged |

### What Phase 25B is for

Phase 25A pinned the *order* in which ADR-022E gates should be
considered when their triggers fire. Phase 25B answers a narrower
question against the same gate inventory: *given the in-repo
record at this snapshot, has any ADR-022E gate's full trigger
conjunction crossed?*

Three Hounfour-status artifacts have accumulated in the repo
without a single intake refreshing the gate-trigger picture:

- [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md)
  (Phase 16 — Jani's accepted-with-adaptation response on issue
  #70).
- [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)
  (Phase 19A — drafted-not-filed v8.5.x upstream-review comment).
- [`../handoffs/hounfour-v86-status-comment-draft.md`](../handoffs/hounfour-v86-status-comment-draft.md)
  (Phase 22A — drafted-not-filed v8.6.x status comment).

Two operational events have landed on top of those artifacts:

- The annotated `v0.0.1` tag was cut and pushed against the
  Phase-24L recording baseline `de65d935…`; the accidental
  `v0.0.2` and `v0.0.3` tags were deleted locally and remotely
  before Phase 25B.
- Dixie PR #99 flipped to type-only consumption against the
  `v0.0.1` tag (Phase 24L).

ADR-025B records the intake snapshot, applies the gate-trigger
check, and refuses to authorize anything that the snapshot does
not independently authorize.

### Important wording disclaimer (in-repo scope)

All "filed" / "not filed" / "pending" statements in this ADR and
in the companion handoff describe the **Straylight repo's
in-repo record only**. Phase 25B did **not** independently
inspect the live `0xHoneyJar/loa-hounfour#70` issue thread on
GitHub. Where a fact is sourced from the Straylight repo only,
this ADR phrases it as **"no in-repo evidence found"** rather
than as a live-GitHub claim. A future ADR that wishes to convert
"no in-repo evidence" into a live-GitHub finding must cite an
explicit live-issue inspection performed during that ADR's
authoring window.

## Decision

### 1. Restate the post-Phase-25A posture as the intake substrate

The substrate Phase 25B intakes against is the post-Phase-25A
surface, byte-identical to post-Phase-24L:

- Posture 1a (private + tag-pinned git source consumption) per
  ADR-024I §"Decision" §1.
- The `./` and `./host` subpaths are type-only; runtime widening
  is unauthorized per ADR-024G §"Decision" §2 and ADR-024K
  §"Decision" §5.1.
- The annotated `v0.0.1` tag is read-only and is the **sole**
  release-consumption tag pointing at
  `de65d93568e70c53ba952279f41a23d2f7d5123e`. The accidental
  `v0.0.2` and `v0.0.3` tags were deleted locally and remotely
  before Phase 25B and are not part of any consumption posture.
- The Hounfour pin (`^8.6.0`) is unchanged.
- The wedge public surface (sections 1–11 of
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)) and
  the `./host` six-handler / two-helper / `*Deps` surface are
  unchanged.

Phase 25B does not widen, narrow, reopen, or qualify any of these.
They are the substrate; the gate-trigger check is layered on top.

### 2. Hounfour #70 / Phase 19A / Phase 22A status (in-repo record)

| Item | In-repo record |
|---|---|
| Issue `0xHoneyJar/loa-hounfour#70` (Phase 9 schema-extraction handoff) | Filed; Jani's accepted-with-adaptation response intaken at Phase 16. |
| Phase 16 disposition | REUSE / EXTEND / ADD-NEW / DEFER / FOLD recorded. `Challenge` and `EstateTransition` deferred to Hounfour cycle-005 (the v8.6.0 line). |
| Phase 19A v8.5.x upstream-review comment | **Drafted in-repo, not filed from the Straylight repo's record.** No in-repo evidence found that the comment was filed. The "Phase 19A pending feedback" gate is recorded by Phase 25A as still pending. |
| Phase 22A v8.6.x status-comment draft | **Drafted in-repo, no in-repo evidence found of filing.** The draft asks for status on `EstateTransition` and the `./canonicalize` / `./utilities` subpath. |
| Hounfour v8.5.x consumption from Straylight | Phase 17B installed `@0xhoneyjar/loa-hounfour@^8.5.0` (resolved `8.5.2`); 15 net-new schemas confirmed at `$id`s under `/loa-hounfour/8.5.x/`; `audit-trail-entry` and `domain-event` shipped, no `audit-event`; no `./canonicalize` or `./utilities` subpath. |
| Hounfour v8.6.0 consumption from Straylight | Pin advanced to `^8.6.0`; `challenge.schema.json` is upstream substrate at `/loa-hounfour/8.6.0/`. Used by Dixie via Posture 3a per ADR-024K. |
| Dixie alignment | Dixie PR #97 bumped Hounfour to `8.6.0`; Dixie PR #99 flipped type-only Straylight consumption against `v0.0.1`. |

**Phase 19A pending feedback gate**: From the Straylight repo's
point of view, the gate remains **pending** unless and until a
live-GitHub inspection cited in a future phase proves otherwise.

### 3. What Hounfour v8.5.x and v8.6.0 appear to satisfy (in-repo record)

| Hounfour line | Apparent satisfactions |
|---|---|
| **v8.5.x** | Substrate / shadow-consumption material: the 15 net-new schemas (delta #12 — `receipt-detail-level`, `surface-context`, `recall-request`, `recall-pack`, `recall-receipt`, `forget-record`, `commitment-type`, `commitment-root`, `agent-estate-status`, `agent-estate`, `privacy-scope`, `risk-level`, `assertion-status`, `assertion-class`, `assertion`); subpath-import discipline against `@0xhoneyjar/loa-hounfour/core` clean per Phase 17B + Phase 18 findings; `UnverifiedObligationsManifest` widening (delta #13); `ClaimGrounding` strict-additive fields (delta #14). |
| **v8.6.0** | `challenge.schema.json` shipped at `/loa-hounfour/8.6.0/` (delta #7 substrate availability). Hounfour pin advanced to `^8.6.0` (Posture 3a) and Dixie aligned via PR #97. |

These are **substrate** satisfactions only. They do not, by
themselves, fire any ADR-022E *adoption* trigger. Adoption is
gated separately per ADR-022E and ADR-025A §3.

### 4. What remains unsatisfied or unclear (in-repo record)

| Item | State |
|---|---|
| `EstateTransition` schema | Not adopted; not confirmed shipped under `/loa-hounfour/8.6.x/` (delta #8 still queued). |
| `safeCanonicalize` JS subpath | Not confirmed; v8.6.0 exports map declares no `./canonicalize` and no `./utilities`. Gate `no-confirmed-subpath` unchanged. |
| `AuditEvent` adoption | Not resolved as an adoption trigger. v8.5.x / v8.6.0 ship `audit-trail-entry` and `domain-event` but no `audit-event` schema. Phase 18 classifies the local `audit-event-transition` candidate as `DISCOVERY_NOTE`. |
| Phase 19A pending feedback on issue #70 | Pending from in-repo record. |
| Phase 22A v8.6 status-comment filing | Unknown from in-repo record. No in-repo evidence found of filing. |

### 5. ADR-022E gate trigger check (post-Phase-25A snapshot)

Each row applies the ADR-022E "Trigger to unblock" verbatim or
near-verbatim. **Substrate status** records whether the upstream
material that the trigger names exists. **Authorization status**
records whether the *separate authorizing ADR* the trigger
requires has been written. **Conclusion** records whether the
gate's full trigger conjunction has crossed.

| # | Topic | Current trigger state | Substrate status | Authorization status | Conclusion |
|---|---|---|---|---|---|
| 1 | `EstateTransition` schema (canonical) | Hounfour ships an `estate-transition.schema.json` (or equivalent) under `/loa-hounfour/8.6.x/` **and** a separate ADR adopts it. | **Not shipped** in v8.6.x per in-repo record. | No adoption ADR. | **Held.** |
| 2 | `EstateTransition` local impl | Either #1 unblocks (adopt by alias) **or** a separate ADR explicitly authorizes a local primitive. | Stays local in `src/straylight/estate.ts`. | No alternate authorizing ADR. | **Held.** |
| 3 | `safeCanonicalize` JS-subpath adoption | Hounfour ships a declared `./canonicalize` (or `./utilities`) subpath whose JS module exports `safeCanonicalize` **and** a separate ADR adopts the subpath. | Subpath **not declared** in v8.6.0 exports map. Gate `no-confirmed-subpath` holds. | No adoption ADR. | **Held.** |
| 4 | `Challenge` adoption into wedge public surface | Separate ADR cites the v8.6.0 `$id`, specifies alias / re-export path, pins a boundary preservation test. | Schema **shipped** at v8.6.0 (`challenge.schema.json`). Substrate availability only. | No adoption ADR. | **Held — partial substrate availability only.** |
| 5 | `AuditEvent` adoption from a Hounfour candidate | Separate ADR adopts a candidate as canonical `AuditEvent`, **or** Hounfour ships `audit-event.schema.json`. | `audit-trail-entry` and `domain-event` ship; no `audit-event`. | No adoption ADR. | **Held.** |
| 6 | `policy-decision-denied` schema-candidate | Schema-candidate refresh decides classification. | DEFERRED disposition (Phase 21B Q3). | Non-blocking. | **Held — informational.** |
| 7 | Public commitment-root anchor / on-chain | Separate ADR satisfies / formally addresses the seven gates and explicitly proposes wiring. | ADR-020E unchanged; seven future-requirement gates unsatisfied. | No anchor ADR. | **Held.** |
| 8 | Production database / persistence substrate | Separate ADR proposes the production adapter; cites sibling-repo handoff; preserves ADR-022D invariants. | MVP adapters `InMemoryStorage` / `JsonlStorage` unchanged. | No persistence-substrate ADR. | **Held.** |
| 9 | Finn runtime wiring (Phase 10 in `loa-finn`) | (a) Phase 19A `#70` feedback received **or** teammate-review approval; (b) ADR-022B-criteria placement ADR selects Finn; (c) `loa-finn` PR opens under teammate review. | Phase 19A pending feedback **pending** (in-repo record); placement ADR unselected. | No placement ADR. | **Held — leg (a) pending.** |
| 10 | Dixie boundary wiring (Phase 12 in `loa-dixie`) | Symmetric to #9; placement ADR selects Dixie. | Symmetric to #9. | No placement ADR. | **Held — leg (a) pending.** |
| 11 | Freeside community / app / bot surface (Phase 14) | (a) MVP endpoint host stable (#9 or #10); (b) Phase 14 packet executes in `loa-freeside` under teammate review; (c) ADR authorizes Freeside as a *consumer*. | Endpoint host not stable; Freeside not an MVP host candidate per ADR-022B #3. | No Freeside-consumer ADR. | **Held.** |
| 12 | New HTTP / NATS / REST / Discord / Telegram surface | MVP endpoint host wiring (#9 or #10) brings network surface; threat-model update **before** wiring. | Wedge has no network surface. | No network-surface ADR. | **Held.** |
| 13 | Reach into unexported Hounfour internals | **Never.** No future ADR may grant this. | Forbidden. | N/A. | **Permanently held.** |
| 14 | New `package.json` / `package-lock.json` dependencies | Feature gate unblocks **and** dependency lands with implementation phase. | None of #9 / #10 / #11 / #12 unblocked. | No implementation phase. | **Held.** |
| 15 | Sibling-repo edits | Sibling-repo work happens in the sibling repo under teammate review. | Phase 9 / 10 / 12 / 14 packets staged, not implemented. | N/A — out-of-repo. | **Held.** |
| 16 | Hounfour status comment filing on `#70` | Teammate / Eileen reviews drafted comment and files it. | Phase 19A and Phase 22A drafts in-repo; no in-repo evidence found of filing for either. | N/A — out-of-repo. | **Held — out-of-repo from Straylight side.** |
| 17 | Eleven exported-but-unconsumed Hounfour JS subpaths | Documented evidence-backed need + separate ADR + future implementation phase. | Informational; absence is the subpath-discipline default. | No subpath-adoption ADR. | **Held.** |
| 18 | Adoption of a Hounfour-named symbol into Straylight *public* surface | Separate ADR authorizes a public re-export; pins a boundary preservation test. | Public surface is Straylight-named per ADR-020C / ADR-022A / ADR-022C. | No public-surface-widening ADR. | **Held.** |
| 19 | Phase 22+ implementation work without a separate authorizing ADR | Separate ADR (under teammate review) opens the implementation lane and cites which gates it unblocks. | Constrained per Phase 21B Q5 + ADR-022A–D. | No implementation-lane ADR. | **Held.** |
| 20 | Threat-model widening | Wiring an MVP endpoint host (#9 / #10) **or** wiring a public anchor (#7) — threat-model update **before** the wiring ADR is accepted. | Network adversary + cryptographic forgery + on-chain integrity out-of-scope at MVP. | No threat-model-update ADR. | **Held.** |

### 6. Explicit conclusion

- **No ADR-022E gate has crossed its full trigger conjunction.**
- **Gate #4 (`Challenge` adoption) has partial substrate
  availability only.** The `challenge.schema.json` schema is
  shipped upstream at v8.6.0; the *authorization* leg of gate #4
  (separate ADR + alias / re-export path + boundary preservation
  test) has not fired.
- **No adoption is justified by Phase 25B.**
- **No authorizing ADR is justified by Phase 25B.**
- **No new ADR-022E gate is justified by Phase 25B.**
- **No relaxation of any ADR-022E precondition is justified by
  Phase 25B.**

### 7. How future work may cite Phase 25B

**Allowed citations:**

- Cite ADR-025B as a **status snapshot** — the in-repo record of
  Hounfour #70 / Phase 19A / Phase 22A status at the post-
  Phase-25A baseline.
- Cite ADR-025B as a **trigger-check record** — the per-gate
  pass/hold conclusion at the post-Phase-25A baseline.
- Cite ADR-025B alongside ADR-025A for sequencing /
  trigger-status when a successor authorizing ADR is written.

**Forbidden citations:**

- Cite ADR-025B as **authorization for adoption or
  implementation**. ADR-025B authorizes nothing.
- Cite ADR-025B as a **substitute for the gate's ADR-022E
  trigger**. Substrate availability is not adoption authorization.
- Cite ADR-025B as **pre-approval of any successor ADR**.
- Cite ADR-025B as authorization to **add or relax an ADR-022E
  gate**.

### 8. Refusal rules — what Phase 25B does NOT authorize

Future PRs **must not** cite Phase 25B as authorization for any
of the following. Reviewers may cite this section verbatim to
refuse:

1. **No Hounfour adoption** of any kind into the Straylight
   public surface.
2. **No `Challenge` adoption.** Schema availability at v8.6.0 is
   substrate only; ADR-022E gate #4 remains held.
3. **No `EstateTransition` adoption.** Local stays local per
   ADR-022E gate #2.
4. **No `safeCanonicalize` adoption.** Gate `no-confirmed-subpath`
   holds; ADR-022E gate #3 remains held.
5. **No Hounfour `#116` adoption** into the Straylight public
   surface. Adoption remains deferred per ADR-024A and ADR-022E.
6. **No `0xhoneyjar:straylight:*` adoption** into the Straylight
   public surface.
7. **No Hounfour `recall-wedge` adoption** into the Straylight
   test suite.
8. **No runtime widening** of `@loa/straylight` or
   `@loa/straylight/host`.
9. **No endpoint, route, middleware, proxy, rendering, or public
   surface** on the Straylight side or the Dixie side.
10. **No public commitment-root behavior.** ADR-020E unchanged.
11. **No Hounfour dependency change.** Pin remains `^8.6.0`.
12. **No Straylight dependency-posture change.** Posture 1a
    remains selected.
13. **No new tag or release.** `v0.0.1` remains the sole
    release-consumption tag pointing at
    `de65d93568e70c53ba952279f41a23d2f7d5123e`. The accidental
    `v0.0.2` / `v0.0.3` tags were deleted locally and remotely
    before Phase 25B.
14. **No sibling-repo edit.**
15. **No GitHub issue / comment / PR action.** Phase 25B does not
    file the Phase 19A or Phase 22A drafts and does not advance
    the Phase 19A pending-feedback gate.
16. **No new ADR-022E gate; no relaxation of any ADR-022E
    trigger or precondition.**

## Explicit non-scope

ADR-025B inherits every non-goal from ADR-025A, ADR-024A through
ADR-024K, and ADR-022A through ADR-022E wholesale, and adds
these Phase-25B-specific refusals:

1. **No file changes outside the three approved docs.** Only
   this ADR, the companion handoff
   ([`../handoffs/phase-25b-hounfour-70-status-intake.md`](../handoffs/phase-25b-hounfour-70-status-intake.md)),
   and the README index append are new.
2. **No `package.json` edit.**
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
13. **No Phase 19A advance.** The pending-feedback gate is
    recorded, not resolved.
14. **No Phase 22A draft refresh, edit, or filing.**
15. **No live-GitHub inspection of issue #70 was performed during
    Phase 25B.** All "filed" / "not filed" / "pending" statements
    in this ADR scope to the Straylight repo's in-repo record
    only.
16. **No `npm install` / `npm update` / `npm ci` / `npm publish`
    / `npm version` / `git tag` / `git push --tags` /
    `gh release create` / package-manager mutation command.**
    `npm pack --dry-run` is allowed in validation (read-only).
17. **No GitHub issue / comment / PR action.**
18. **No Flatline / Bridgebuilder / red-team request.**
19. **No touch of
    [`../../.loa`](../../.loa) /
    [`../../.loa.config.yaml`](../../.loa.config.yaml) /
    [`../../.claude/`](../../.claude/) /
    [`../../.beads/`](../../.beads/) /
    [`../../.run/`](../../.run/) /
    [`../../.github/`](../../.github/) /
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
    `node_modules/`.**
20. **No new ADR-022E gate.** Gate inventory remains #1–#20.
21. **No relaxation of any ADR-022E trigger or precondition.**
22. **No prediction of when any trigger will fire.**

## Consequences

- **Status intake is on the record.** Reviewers of any future
  authorizing ADR may cite ADR-025B for the post-Phase-25A
  trigger-state snapshot, and may refuse a successor ADR that
  treats substrate availability (e.g., `challenge.schema.json`
  shipping at v8.6.0) as authorization.
- **No implementation step is pre-approved.** ADR-025B is
  refusable as authorization on §"Decision" §8.1–§8.16 grounds.
- **The substrate is unchanged.** Post-Phase-25A surface, source,
  tests, fixtures, schemas, and dependencies are byte-identical
  after ADR-025B merges.
- **ADR-025B is additive to ADR-025A and ADR-022E.** It does not
  supersede either; reopening either reopens ADR-025B.
- **The `v0.0.1` tag remains the sole release-consumption
  tag.** Accidental `v0.0.2` / `v0.0.3` tags were deleted locally
  and remotely before Phase 25B.

## Source files inspected

- [`./0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md) through [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md) through [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md) through [`./ADR-024K-dixie-host-type-consumption-intake.md`](./ADR-024K-dixie-host-type-consumption-intake.md)
- [`./ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](./ADR-025A-recall-wedge-mvp-implementation-sequencing.md)
- [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md) (read-only)
- [`../handoffs/hounfour-adaptation-delta.md`](../handoffs/hounfour-adaptation-delta.md) (read-only)
- [`../handoffs/hounfour-rc-shadow-integration-checklist.md`](../handoffs/hounfour-rc-shadow-integration-checklist.md) (read-only)
- [`../handoffs/hounfour-shadow-integration-findings.md`](../handoffs/hounfour-shadow-integration-findings.md) (read-only)
- [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md) (read-only)
- [`../handoffs/hounfour-v86-status-comment-draft.md`](../handoffs/hounfour-v86-status-comment-draft.md) (read-only)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md) (read-only)
- [`../handoffs/phase-22a-mvp-decision-lock.md`](../handoffs/phase-22a-mvp-decision-lock.md) (read-only)
- [`../handoffs/phase-24l-dixie-host-type-consumption-intake.md`](../handoffs/phase-24l-dixie-host-type-consumption-intake.md) (read-only)
- [`../handoffs/phase-25a-recall-wedge-mvp-implementation-readiness.md`](../handoffs/phase-25a-recall-wedge-mvp-implementation-readiness.md) (read-only)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (read-only)
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (read-only)
- [`../../package.json`](../../package.json) (read-only — `version` is `0.0.1`; matches `v0.0.1` byte-for-byte)
- Annotated `v0.0.1` tag (read-only — `de65d93568e70c53ba952279f41a23d2f7d5123e`)
