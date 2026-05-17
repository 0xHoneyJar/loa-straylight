# Phase 25B — Hounfour #70 status intake and adoption-trigger check (docs-only)

> Status: Phase 25B is a **docs-only Hounfour #70 status intake
> and adoption-trigger check**. Companion ADR:
> [`../decisions/ADR-025B-hounfour-70-status-intake.md`](../decisions/ADR-025B-hounfour-70-status-intake.md).
>
> Phase 25B records the post-Phase-25A in-repo state of the
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> coordination thread, summarizes which substrate facts Hounfour
> v8.5.x and v8.6.0 appear to have shipped from the Straylight
> repo's record, and applies the per-gate trigger check from
> [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
> against that state. **Phase 25B is status intake, not
> authorization.**
>
> Phase 25B does **not** create or relax any ADR-022E gate, does
> **not** authorize any Hounfour adoption, does **not** advance
> the Phase 19A pending feedback gate, does **not** add code,
> tests, fixtures, schemas, exports, dependencies, package
> metadata, or `dist-types/`, does **not** edit any sibling repo,
> does **not** create or push a tag, does **not** publish, does
> **not** create a GitHub Release, does **not** file the Phase
> 19A or Phase 22A drafted comments, does **not** request any
> Flatline / Bridgebuilder / red-team review, and does **not**
> touch
> [`../../.loa`](../../.loa) /
> [`../../.loa.config.yaml`](../../.loa.config.yaml) /
> [`../../.claude/`](../../.claude/) /
> [`../../.beads/`](../../.beads/) /
> [`../../.run/`](../../.run/) /
> [`../../.github/`](../../.github/) /
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
> `node_modules/`. Phase 25B edits only this handoff, the
> companion ADR-025B, and the README index append.

## Important wording disclaimer (in-repo scope)

All "filed" / "not filed" / "pending" statements in this handoff
describe the **Straylight repo's in-repo record only**. Phase 25B
did **not** independently inspect the live `0xHoneyJar/loa-hounfour#70`
issue thread on GitHub during this phase. Where a fact is sourced
from the Straylight repo only, it is phrased as **"no in-repo
evidence found"** rather than as a live-GitHub claim. A future
phase that wishes to convert "no in-repo evidence" into a
live-GitHub finding must cite an explicit live-issue inspection
performed during that phase's authoring window.

## Executive summary

Phase 24L (PR #38, merged) closed the Straylight-side intake for
Dixie type-only consumption. Phase 25A (PR #39, merged) recorded
the post-Phase-24L state and sequenced ADR-022E gates #1–#20
without authorizing any of them. Phase 25B:

- **Records** post-Phase-25A baseline state.
- **Records** Hounfour #70 / Phase 19A / Phase 22A status as
  represented in the Straylight repo.
- **Records** what Hounfour v8.5.x and v8.6.0 appear to satisfy.
- **Records** what remains unsatisfied or unclear.
- **Applies** the per-gate trigger check from ADR-022E.
- **Concludes** that no ADR-022E gate has crossed its full
  trigger conjunction; gate #4 (`Challenge` adoption) has partial
  substrate availability only.
- **Refuses** to authorize any implementation step or successor
  authorizing ADR.

## Post-Phase-25A baseline

| Fact | Value |
|---|---|
| Branch (this PR) | `phase-25b-hounfour-70-status-intake` (docs-only) |
| `main` HEAD | post-PR-#39 (Phase 25A merged) |
| Phase-25A baseline commit | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git tag --list v0.0.1` | `v0.0.1` (annotated) |
| `git rev-parse v0.0.1^{commit}` | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git cat-file -t v0.0.1` | `tag` (annotated) |
| Sole release-consumption tag | `v0.0.1` only |
| Accidental tags `v0.0.2`, `v0.0.3` | **Deleted locally and remotely before Phase 25B.** Not part of any release-consumption posture. |
| GitHub Releases | **0** |
| Package `name` / `version` / `private` | `@loa/straylight` / `0.0.1` / `true` |
| Hounfour pin (Straylight) | `@0xhoneyjar/loa-hounfour@^8.6.0` |
| Phase 24L | Complete (PR #38 merged) |
| Phase 25A | Complete (PR #39 merged) |
| ADR-024H Gate 1 (Publish posture) | Satisfied (Posture 1a) |
| ADR-024H Gate 2 (Release / tag consumption point) | Satisfied (annotated `v0.0.1`) |
| ADR-024H Gate 3 (Hounfour version-skew resolution) | Satisfied (Posture 3a, Dixie PR #97) |
| Dixie type-only consumption (PR #99) | First conforming downstream consumer |
| ADR-022E gate inventory | Gates #1–#20 unchanged |

## Hounfour #70 / Phase 19A / Phase 22A status (in-repo record)

| Item | In-repo record |
|---|---|
| Issue `0xHoneyJar/loa-hounfour#70` (Phase 9 schema-extraction handoff) | Filed; Jani's accepted-with-adaptation response intaken at Phase 16 in [`./hounfour-response-intake.md`](./hounfour-response-intake.md). |
| Phase 16 disposition | REUSE / EXTEND / ADD-NEW / DEFER / FOLD recorded. `Challenge` and `EstateTransition` deferred to Hounfour cycle-005 (the v8.6.0 line). |
| Phase 19A v8.5.x upstream-review comment ([`./hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md)) | **Drafted in-repo, not filed from the Straylight repo's record.** No in-repo evidence found that the comment was filed. |
| Phase 19A pending-feedback gate | **Pending from in-repo record.** Phase 25A explicitly recorded this gate as pending; Phase 25B does not advance it. |
| Phase 22A v8.6.x status-comment draft ([`./hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md)) | **Drafted in-repo.** No in-repo evidence found of filing. The draft asks for status on `EstateTransition` and the `./canonicalize` / `./utilities` subpath. |
| Hounfour v8.5.x consumption from Straylight | Phase 17B / Phase 18 inspected `@0xhoneyjar/loa-hounfour@^8.5.0` (resolved `8.5.2`); 15 net-new schemas confirmed at `$id`s under `/loa-hounfour/8.5.x/`; `audit-trail-entry` and `domain-event` shipped, no `audit-event`; no `./canonicalize` or `./utilities` subpath. |
| Hounfour v8.6.0 consumption from Straylight | Pin advanced to `^8.6.0`; `challenge.schema.json` is upstream substrate at `/loa-hounfour/8.6.0/`. Used by Dixie via Posture 3a per ADR-024K. |
| Dixie alignment | Dixie PR #97 bumped Hounfour to `8.6.0`; Dixie PR #99 flipped type-only Straylight consumption against `v0.0.1`. |

## What Hounfour v8.5.x and v8.6.0 appear to satisfy (in-repo record)

| Hounfour line | Apparent satisfactions |
|---|---|
| **v8.5.x** | Substrate / shadow-consumption material already recorded in prior Straylight docs: 15 net-new schemas (delta #12 — `receipt-detail-level`, `surface-context`, `recall-request`, `recall-pack`, `recall-receipt`, `forget-record`, `commitment-type`, `commitment-root`, `agent-estate-status`, `agent-estate`, `privacy-scope`, `risk-level`, `assertion-status`, `assertion-class`, `assertion`); subpath-import discipline against `@0xhoneyjar/loa-hounfour/core` clean per Phase 17B + Phase 18 findings; `UnverifiedObligationsManifest` widening (delta #13); `ClaimGrounding` strict-additive fields (delta #14). |
| **v8.6.0** | `challenge.schema.json` shipped at `/loa-hounfour/8.6.0/` (delta #7 substrate availability). Hounfour pin advanced to `^8.6.0` (Posture 3a). Dixie aligned to Hounfour 8.6.0 via PR #97. |

These are **substrate** satisfactions only. They do not, by
themselves, fire any ADR-022E *adoption* trigger. Adoption is
gated separately per ADR-022E and ADR-025A §3.

## What remains unsatisfied or unclear (in-repo record)

| Item | State |
|---|---|
| `EstateTransition` schema | Not adopted; not confirmed as satisfied. Delta #8 still queued; not confirmed shipped under `/loa-hounfour/8.6.x/`. |
| `safeCanonicalize` JS subpath | Not confirmed. v8.6.0 exports map declares no `./canonicalize` and no `./utilities`. Gate `no-confirmed-subpath` unchanged. |
| `AuditEvent` adoption | Not resolved as an adoption trigger. v8.5.x / v8.6.0 ship `audit-trail-entry` and `domain-event` but no `audit-event` schema. Phase 18 classifies the local `audit-event-transition` candidate as `DISCOVERY_NOTE`. |
| Phase 19A pending feedback on issue #70 | Pending from in-repo record. |
| Phase 22A status-comment filing | Unknown from in-repo record. No in-repo evidence found of filing. |

## ADR-022E gate trigger check (post-Phase-25A snapshot)

**Gate-trigger check only — not authorization. Each row records
substrate status, authorization status, and conclusion.**

| # | Topic | Current trigger state | Substrate status | Authorization status | Conclusion |
|---|---|---|---|---|---|
| 1 | `EstateTransition` schema (canonical) | Hounfour ships an `estate-transition.schema.json` (or equivalent) under `/loa-hounfour/8.6.x/` **and** a separate ADR adopts it. | Not shipped in v8.6.x per in-repo record. | No adoption ADR. | **Held.** |
| 2 | `EstateTransition` local impl | #1 unblocks (adopt by alias) **or** separate ADR authorizes a local primitive. | Stays local. | No authorizing ADR. | **Held.** |
| 3 | `safeCanonicalize` JS-subpath adoption | Hounfour ships declared `./canonicalize` / `./utilities` subpath **and** separate ADR adopts. | Subpath not declared. | No adoption ADR. | **Held.** |
| 4 | `Challenge` adoption into wedge public surface | Separate ADR cites the v8.6.0 `$id`, specifies alias / re-export path, pins boundary preservation test. | Schema **shipped** at v8.6.0. | No adoption ADR. | **Held — partial substrate availability only.** |
| 5 | `AuditEvent` adoption from a Hounfour candidate | Separate ADR adopts a candidate as canonical `AuditEvent`, **or** Hounfour ships `audit-event.schema.json`. | `audit-trail-entry` + `domain-event` ship; no `audit-event`. | No adoption ADR. | **Held.** |
| 6 | `policy-decision-denied` schema-candidate | Schema-candidate refresh decides classification. | DEFERRED (Phase 21B Q3). | Non-blocking. | **Held — informational.** |
| 7 | Public commitment-root anchor / on-chain | Separate ADR satisfies seven future-requirement gates and proposes wiring. | ADR-020E unchanged. | No anchor ADR. | **Held.** |
| 8 | Production database / persistence substrate | Separate ADR proposes the production adapter. | `InMemoryStorage` / `JsonlStorage` unchanged. | No persistence-substrate ADR. | **Held.** |
| 9 | Finn runtime wiring (`loa-finn` Phase 10) | (a) Phase 19A `#70` feedback received **or** teammate-review approval; (b) placement ADR selects Finn; (c) `loa-finn` PR opens under teammate review. | Phase 19A pending feedback **pending** (in-repo); placement ADR unselected. | No placement ADR. | **Held — leg (a) pending.** |
| 10 | Dixie boundary wiring (`loa-dixie` Phase 12) | Symmetric to #9; placement ADR selects Dixie. | Symmetric to #9. | No placement ADR. | **Held — leg (a) pending.** |
| 11 | Freeside community / app / bot surface (Phase 14) | (a) MVP endpoint host stable; (b) Phase 14 packet executes in `loa-freeside` under teammate review; (c) ADR authorizes Freeside as a *consumer*. | Endpoint host not stable. | No Freeside-consumer ADR. | **Held.** |
| 12 | New HTTP / NATS / REST / Discord / Telegram surface | MVP endpoint host wiring brings network surface; threat-model update **before** wiring. | Wedge has no network surface. | No network-surface ADR. | **Held.** |
| 13 | Reach into unexported Hounfour internals | **Never.** | Forbidden. | N/A. | **Permanently held.** |
| 14 | New `package.json` / `package-lock.json` dependencies | Feature gate unblocks **and** dependency lands with implementation phase. | None of #9 / #10 / #11 / #12 unblocked. | No implementation phase. | **Held.** |
| 15 | Sibling-repo edits | Sibling-repo work happens in the sibling repo under teammate review. | Phase 9 / 10 / 12 / 14 packets staged, not implemented. | N/A — out-of-repo. | **Held.** |
| 16 | Hounfour status comment filing on `#70` | Teammate / Eileen reviews drafted comment and files it. | Phase 19A and Phase 22A drafts in-repo; no in-repo evidence of filing. | N/A — out-of-repo. | **Held — out-of-repo from Straylight side.** |
| 17 | Eleven exported-but-unconsumed Hounfour JS subpaths | Documented evidence-backed need + separate ADR + future implementation phase. | Informational. | No subpath-adoption ADR. | **Held.** |
| 18 | Adoption of a Hounfour-named symbol into Straylight *public* surface | Separate ADR authorizes a public re-export; pins boundary preservation test. | Public surface is Straylight-named. | No public-surface-widening ADR. | **Held.** |
| 19 | Phase 22+ implementation work without a separate authorizing ADR | Separate ADR explicitly opens the implementation lane. | Constrained per Phase 21B Q5 + ADR-022A–D. | No implementation-lane ADR. | **Held.** |
| 20 | Threat-model widening | MVP endpoint host wiring (#9 / #10) **or** public anchor wiring (#7) — threat-model update **before** wiring ADR. | Both adversary classes out-of-scope at MVP. | No threat-model-update ADR. | **Held.** |

## Explicit conclusion

- **No ADR-022E gate has crossed its full trigger conjunction.**
- **Gate #4 (`Challenge` adoption) has partial substrate
  availability only** — `challenge.schema.json` is shipped at
  v8.6.0; the authorization leg (separate ADR + alias / re-export
  path + boundary preservation test) has not fired.
- **No Hounfour adoption is justified by Phase 25B.**
- **No authorizing ADR is justified by Phase 25B.**
- **No new ADR-022E gate is justified by Phase 25B.**
- **No relaxation of any ADR-022E precondition is justified by
  Phase 25B.**

ADR-025B's full status-intake decision (with §"Decision" §§1–8,
§"Source files inspected", and the "How future work may cite
Phase 25B" allowed/forbidden lists) lives in
[`../decisions/ADR-025B-hounfour-70-status-intake.md`](../decisions/ADR-025B-hounfour-70-status-intake.md).

## How future work may cite Phase 25B

**Allowed:**

- Cite ADR-025B as a **status snapshot** — the in-repo record of
  Hounfour #70 / Phase 19A / Phase 22A status at the post-
  Phase-25A baseline.
- Cite ADR-025B as a **trigger-check record** — the per-gate
  pass/hold conclusion at the post-Phase-25A baseline.
- Cite ADR-025B alongside ADR-025A for sequencing /
  trigger-status when a successor authorizing ADR is written.

**Forbidden:**

- Cite ADR-025B as **authorization for adoption or
  implementation**.
- Cite ADR-025B as a **substitute for the gate's ADR-022E
  trigger**. Substrate availability is not adoption authorization.
- Cite ADR-025B as **pre-approval of any successor ADR**.
- Cite ADR-025B as authorization to **add or relax an ADR-022E
  gate**.

## Refusal rules — what Phase 25B does NOT authorize

Future PRs **must not** cite Phase 25B as authorization for any
of the following. Reviewers may cite this section verbatim to
refuse:

1. **No Hounfour adoption** of any kind into the Straylight
   public surface.
2. **No `Challenge` adoption.** Substrate availability only.
3. **No `EstateTransition` adoption.**
4. **No `safeCanonicalize` adoption.** Gate `no-confirmed-subpath`
   holds.
5. **No Hounfour `#116` adoption.**
6. **No `0xhoneyjar:straylight:*` adoption.**
7. **No Hounfour `recall-wedge` adoption.**
8. **No runtime widening** of `@loa/straylight` or
   `@loa/straylight/host`.
9. **No endpoint, route, middleware, proxy, rendering, or public
   surface.**
10. **No public commitment-root behavior.**
11. **No Hounfour dependency change.** Pin remains `^8.6.0`.
12. **No Straylight dependency-posture change.** Posture 1a
    remains selected.
13. **No new tag or release.** `v0.0.1` remains the sole
    release-consumption tag pointing at
    `de65d93568e70c53ba952279f41a23d2f7d5123e`. The accidental
    `v0.0.2` / `v0.0.3` tags were deleted locally and remotely
    before Phase 25B.
14. **No sibling-repo edit.**
15. **No GitHub issue / comment / PR action.** Phase 25B does
    not file the Phase 19A or Phase 22A drafts and does not
    advance the Phase 19A pending-feedback gate.
16. **No new ADR-022E gate; no relaxation of any ADR-022E
    trigger or precondition.**

## Explicit non-scope

1. No file changes outside the three approved docs (this
   handoff, ADR-025B, README append).
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
10. No Phase 22A draft refresh, edit, or filing.
11. No live-GitHub inspection of issue #70 was performed during
    Phase 25B.
12. No `npm install` / `npm update` / `npm ci` / `npm publish` /
    `npm version` / `git tag` / `git push --tags` /
    `gh release create` / package-manager mutation.
    `npm pack --dry-run` is allowed in validation (read-only).
13. No GitHub issue / comment / PR action.
14. No Flatline / Bridgebuilder / red-team request.
15. No new ADR-022E gate; no relaxation of any ADR-022E trigger
    or precondition.
16. No prediction of when any trigger will fire.

## Validation

Phase 25B is **docs-only**. Package surface, source, tests,
fixtures, schemas, declarations, and dependencies are
byte-identical to the post-Phase-25A baseline.

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
  dist-types/ docs/mvp/package-boundary.md docs/mvp/threat-model.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
git tag --list 'v0.0.2' 'v0.0.3'
```

### Expected outcomes

- `npm run typecheck` — clean.
- `npm test` — passes identically to the post-Phase-25A
  baseline (no test added; no test edited).
- `npm run build` — clean; rebuilt `dist-types/` byte-identical
  to the committed artifact.
- Both declaration entrypoints exist.
- `npm pack --dry-run` — tarball preview unchanged from
  Phase 24H/I/J/K/L/25A.
- Forbidden-path `git diff` — **empty**.
- `git diff --stat` — shows only the three Phase 25B docs (this
  handoff, ADR-025B, README append).
- `git status --short` — shows the three Phase 25B docs plus
  any pre-existing local dirt.
- `git tag --list v0.0.1` — prints `v0.0.1`.
- `git rev-parse v0.0.1^{commit}` — prints
  `de65d93568e70c53ba952279f41a23d2f7d5123e`.
- `git cat-file -t v0.0.1` — prints `tag`.
- `git tag --list 'v0.0.2' 'v0.0.3'` — prints **nothing**
  (accidental tags deleted locally before Phase 25B).

## Open follow-ups

1. **Phase 19A pending feedback** on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
   — pending from in-repo record. Phase 25B does not advance it.
   A future phase that performs a live-GitHub inspection of the
   issue thread may convert "no in-repo evidence" into a
   live-GitHub finding and update the gate-trigger check
   accordingly.
2. **Phase 22A v8.6.x status-comment filing** — unknown from
   in-repo record. Same disposition as above.
3. **Hounfour upstream activity** — if Hounfour ships
   `EstateTransition`, an `audit-event` schema, a
   `./canonicalize` subpath, or `#116` outputs, the corresponding
   ADR-022E row's substrate status changes; a successor ADR (not
   ADR-025B) records the update and writes the authorizing ADR.
2. **Successor ADRs** — each ADR-022E gate row remains held.
   No row is pre-authorized by Phase 25B.

## Cross-references

- Companion ADR:
  [`../decisions/ADR-025B-hounfour-70-status-intake.md`](../decisions/ADR-025B-hounfour-70-status-intake.md).
- Direct predecessor (implementation-sequencing decision-lock):
  [`./phase-25a-recall-wedge-mvp-implementation-readiness.md`](./phase-25a-recall-wedge-mvp-implementation-readiness.md)
  +
  [`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md).
- Implementation gate inventory:
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md).
- Hounfour #70 response intake:
  [`./hounfour-response-intake.md`](./hounfour-response-intake.md).
- Hounfour adaptation delta:
  [`./hounfour-adaptation-delta.md`](./hounfour-adaptation-delta.md).
- Hounfour rc / dependency-flip checklist:
  [`./hounfour-rc-shadow-integration-checklist.md`](./hounfour-rc-shadow-integration-checklist.md).
- Hounfour shadow-integration findings (Phase 17B + 18):
  [`./hounfour-shadow-integration-findings.md`](./hounfour-shadow-integration-findings.md).
- Phase 19A v8.5.x upstream-review packet (drafted, not filed
  per in-repo record):
  [`./hounfour-v850-shadow-review-packet.md`](./hounfour-v850-shadow-review-packet.md).
- Phase 22A v8.6.x status-comment draft (drafted, no in-repo
  evidence of filing):
  [`./hounfour-v86-status-comment-draft.md`](./hounfour-v86-status-comment-draft.md).
- Stable surface (read-only):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Threat model (read-only):
  [`../mvp/threat-model.md`](../mvp/threat-model.md).
- Issue:
  [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
