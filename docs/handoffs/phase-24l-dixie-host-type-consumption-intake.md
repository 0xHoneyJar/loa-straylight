# Phase 24L — Dixie host type-only consumption intake (docs-only)

> Status: Phase 24L **docs-only Dixie host type-only consumption
> intake handoff**. Companion ADR:
> [`../decisions/ADR-024K-dixie-host-type-consumption-intake.md`](../decisions/ADR-024K-dixie-host-type-consumption-intake.md).
>
> Phase 24L records, on the Straylight side, two cross-repo
> events that already happened after Phase 24K-opening (PR #37)
> merged: (1) the operator action that satisfied **Gate 2** by
> cutting and pushing the annotated `v0.0.1` tag against the
> verified post-Phase-24K-opening `main` commit
> (`de65d93568e70c53ba952279f41a23d2f7d5123e`); and (2) the
> Dixie-side conforming consumption that satisfied **Gate 3** via
> Posture 3a (Dixie PR #97 bumped `@0xhoneyjar/loa-hounfour` from
> `v8.3.1` to `v8.6.0`) and exercised the type-only
> `@loa/straylight/host` surface for the first time in Dixie
> PR #99 (type-only `import type` / `export type` consumption;
> `app/package.json` depending on
> `github:0xHoneyJar/loa-straylight#v0.0.1`; lockfile pinned at
> `de65d93568e70c53ba952279f41a23d2f7d5123e`).
>
> Phase 24L **absorbs** the Phase 24K-closing operator-action
> record (the operator did not author a separate Phase 24K-
> closing handoff at the time the tag was cut). Phase 24L is the
> single Straylight-side anchor for both events.
>
> Phase 24L does **not** create a new tag, **not** push a tag,
> **not** publish, **not** create a GitHub Release, **not**
> author or modify any test, **not** edit any source / test /
> config / dist-types / package metadata, **not** edit any sibling
> repo, **not** advance any ADR-022E gate, **not** advance the
> Phase 19A pending feedback gate, **not** authorize any further
> Dixie consumption, **not** authorize any runtime widening, and
> **not** request any Flatline / Bridgebuilder / red-team review.
>
> Phase 24L cuts no tag, pushes no tag, publishes no package,
> creates no GitHub Release, runs no
> `npm install` / `npm update` / `npm ci` / `npm publish` /
> `npm version` / `git tag` / `git push --tags` / `gh release
> create` command, edits no
> [`../../package.json`](../../package.json) /
> [`../../package-lock.json`](../../package-lock.json) /
> [`../../.npmrc`](../../.npmrc) /
> [`../../.gitignore`](../../.gitignore) /
> [`../../tsconfig.json`](../../tsconfig.json) /
> [`../../tsconfig.build.json`](../../tsconfig.build.json) /
> [`../../vitest.config.ts`](../../vitest.config.ts), edits no
> file under [`../../src/`](../../src/) /
> [`../../tests/`](../../tests/) /
> [`../../scripts/`](../../scripts/) /
> [`../../fixtures/`](../../fixtures/) /
> [`../../dist-types/`](../../dist-types/), edits no
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md),
> edits no prior ADR, edits no prior handoff (other than the
> README index entry authored alongside this handoff), edits no
> sibling repo (`loa-dixie`, `loa-finn`, `loa-freeside`,
> `loa-hounfour`), files no GitHub issue / comment / PR, bumps
> no Hounfour dependency range, runs no Flatline /
> Bridgebuilder / red-team review, and does not touch
> [`../../.loa`](../../.loa) /
> [`../../.loa.config.yaml`](../../.loa.config.yaml) /
> [`../../.claude/`](../../.claude/) /
> [`../../.beads/`](../../.beads/) /
> [`../../.run/`](../../.run/) /
> [`../../.github/`](../../.github/) /
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) or
> `node_modules/`.
>
> No Flatline pass is required because Phase 24L makes no
> package-surface or source change. The events being recorded
> are external to this PR: the `v0.0.1` tag was cut by a
> separate operator action against an already-merged `main`
> commit; the Dixie-side flip in PRs #97 / #99 was authored and
> reviewed Dixie-side. Phase 24L is the in-repo intake record
> only.
>
> The Phase 19A pending feedback gate on
> [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
> remains pending and is **not** advanced by Phase 24L.

## Executive summary

Phase 24L is the Straylight-side intake record for the post-
Phase-24K-opening events that flipped Gate 2 and Gate 3 from
"prepared/unresolved" to "satisfied" and authorized the first
type-only downstream consumer. Phase 24L:

- **Records Gate 1 as satisfied** (Posture 1a, ADR-024I §"Decision"
  §1; unchanged since Phase 24J).
- **Records Gate 2 as satisfied** by the operator action that cut
  and pushed the annotated `v0.0.1` tag against the verified
  post-Phase-24K-opening `main` commit
  `de65d93568e70c53ba952279f41a23d2f7d5123e`, honoring all nine
  ADR-024J §"Decision" rules (label `v0.0.1`; annotated; correct
  target; in-tree clean-rebuild + `git diff -- dist-types/`
  verification approach; no GitHub Release; no publish; no
  `version` change; no metadata change; no force-push / retag).
- **Records Gate 3 as satisfied** via Posture 3a (Dixie PR #97
  bumped `@0xhoneyjar/loa-hounfour` from `v8.3.1` to `v8.6.0`,
  matching Straylight's `^8.6.0` pin).
- **Records Dixie PR #99 as a conforming type-only flip** under
  ADR-024H §5 + ADR-024I §"Dixie flip rule after Phase 24J" +
  ADR-024J §"Consequences": all three gates were independently
  satisfied at the time PR #99 opened and merged; Dixie's
  `app/package.json` declares `@loa/straylight` as
  `github:0xHoneyJar/loa-straylight#v0.0.1`; the lockfile
  resolves Straylight to commit
  `de65d93568e70c53ba952279f41a23d2f7d5123e`; Hounfour is
  deduped at `8.6.0`; Dixie's local `host/types.ts` mirror was
  deleted; Dixie now imports types from `@loa/straylight/host`
  using `import type` / `export type` only; Dixie's runtime
  helpers remain local; no runtime Straylight import was added;
  required CI passed Dixie-side after a workflow auth patch.
- **Records the Dixie `package-contract` tripwire test as
  Dixie-owned**; Phase 24L does not co-own, duplicate, or
  migrate it.
- **Mentions the Dixie advisory staging smoke once** as a
  Dixie-side environment / GHCR / package-access infrastructure
  concern, **not** a Straylight gate.
- **Refuses** any future citation of Phase 24L as authorization
  for runtime widening, endpoint / route / middleware / proxy /
  rendering, vector 9 / 10 / 11 widening, Hounfour `#116`
  adoption, `0xhoneyjar:straylight:*` adoption, Hounfour
  `recall-wedge` adoption, public commitment-root behavior,
  Hounfour change, Straylight dependency-posture change, new
  tag / release, sibling-repo edit, additional Dixie
  consumption, or Phase 19A pending-feedback-gate advance.
- **Does not author or modify any test.** The Phase 24H tests
  ([`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts),
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts))
  continue to pass against the unchanged package state.
- **Does not modify any package metadata.**
  [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json),
  [`../../.npmrc`](../../.npmrc), and the build configuration
  files remain byte-identical to their post-Phase-24K-opening
  state.

The full constraint set, refusal rules, and rationale live in
the companion ADR
([`../decisions/ADR-024K-dixie-host-type-consumption-intake.md`](../decisions/ADR-024K-dixie-host-type-consumption-intake.md)).
This handoff is the operator-facing summary.

### Phase 24H / 24I / 24J / 24K-opening recap (what Phase 24L does not redo)

Phase 24H made the type-only package surface real: a type-only
`exports` map with `"."` and `"./host"`, committed `dist-types/`,
no `main` field, no runtime conditions, `"private": true`
preserved, Hounfour at `^8.6.0`, no tag, no publish.

Phase 24I enumerated three conjunctive gates (publish posture,
release / tag consumption point, Hounfour version-skew
resolution) between the post-Phase-24H surface and a future
Dixie dependency flip.

Phase 24J selected Gate 1 as **Posture 1a** (private + tag-
pinned git-source consumption) and prepared Gate 2 by pinning
the seven-section tag-readiness checklist.

Phase 24K-opening selected Gate 2's execution parameters
(version label `v0.0.1`; annotated tag; tag target = the
verified post-Phase-24K-opening `main` commit; verification
approach = in-tree clean-rebuild + `git diff -- dist-types/`;
no GitHub Release; no publish; no `version` change; no metadata
change; no force-push / retag) and authored the operator-facing
pre-tag checklist + tag command + post-tag verification commands.
Phase 24K-opening **did not** cut the tag.

Phase 24L records that the operator action subsequently cut and
pushed the tag honoring every ADR-024J rule, that Dixie PR #97
bumped Hounfour to `v8.6.0` satisfying Gate 3 via Posture 3a,
and that Dixie PR #99 flipped the type-only dependency
conformingly.

## Current state

| Fact | Value |
|---|---|
| Branch (this PR) | `phase-24l-dixie-host-type-consumption-intake` (docs-only) |
| `main` HEAD (recording baseline) | post-PR #37 (Phase 24K-opening merged); commit `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| Local `git tag --list v0.0.1` | `v0.0.1` (annotated) |
| `git rev-parse v0.0.1^{commit}` | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git cat-file -t v0.0.1` | `tag` (annotated, not lightweight) |
| `git ls-remote --tags origin v0.0.1` | present at `origin` |
| GitHub Releases | **0** (no Release was created; ADR-024J §"Decision" §5 honored) |
| Package `name` / `version` / `private` | `@loa/straylight` / `0.0.1` / `true` |
| `package.json` `publish` / `prepublishOnly` / `prepack` / `postpublish` script | **absent** |
| `.npmrc` `@loa:registry` mapping | **absent** |
| `.github/workflows/` publish workflow for `@loa/straylight` | **absent** |
| `dist-types/src/straylight/index.d.ts` | present (committed) |
| `dist-types/src/straylight/host/index.d.ts` | present (committed) |
| Forbidden-path `git diff` (ADR-024I §5 file list) | **empty** against `main` |
| Hounfour pin (Straylight) | `@0xhoneyjar/loa-hounfour@^8.6.0` (unchanged since Phase 24H) |
| Hounfour pin (Dixie, post-PR-#97) | `@0xhoneyjar/loa-hounfour@8.6.0` (matches Straylight) |
| Dixie `app/package.json` Straylight specifier | `github:0xHoneyJar/loa-straylight#v0.0.1` |
| Dixie `app/package-lock.json` Straylight resolution | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| Dixie Hounfour dedup | deduped at `8.6.0` across Dixie app + consumed Straylight tree |
| Dixie local `host/types.ts` mirror | **deleted** in Dixie PR #99 |
| Dixie type imports from `@loa/straylight/host` | `import type` / `export type` only |
| Dixie runtime Straylight imports | **none added** |
| Dixie runtime helpers | remain local |
| Dixie required CI status | passed (after workflow auth patch) |
| Dixie `package-contract` tripwire test | in place (Dixie-owned) |
| Dixie advisory staging smoke | may still fail (Dixie-side env / GHCR / package-access infra; **not** a Straylight gate) |
| Posture 1a configuration | satisfied unambiguously by current `main` |
| Posture 1b adoption | refused (per ADR-024I §"Decision" §2) |
| Hybrid posture | refused (per ADR-024I §"Decision" §3) |

## Gate satisfaction record

| Gate | Status | Satisfying event | Source artifact |
|---|---|---|---|
| Gate 1 — Publish posture | **Satisfied** | Phase 24J selected Posture 1a (private + tag-pinned git source) | ADR-024I §"Decision" §1; preserved on `main` post-Phase-24L |
| Gate 2 — Release / tag consumption point | **Satisfied** | Operator action cut + pushed annotated `v0.0.1` against `de65d93568e70c53ba952279f41a23d2f7d5123e` honoring all nine ADR-024J §"Decision" rules | ADR-024J §"Decision" §§1–9; tag observable now (`git cat-file -t v0.0.1` → `tag`) |
| Gate 3 — Hounfour version-skew resolution | **Satisfied** | Dixie PR #97 bumped `@0xhoneyjar/loa-hounfour` from `v8.3.1` to `v8.6.0` (Posture 3a) | Dixie PR #97; ADR-024H §4 / ADR-024H §5 |

All three ADR-024H gates are independently satisfied. Dixie
PR #99 (the type-only flip) is recorded as the first conforming
downstream consumer.

## Operator-action record (absorbed Phase 24K-closing)

The operator action that satisfied Gate 2 ran in the following
sequence against a clean checkout of `main` at
`de65d93568e70c53ba952279f41a23d2f7d5123e` (the merge commit of
PR #37, after no subsequent merge changed the package surface).
Phase 24L absorbs the operator-action record because the operator
did not author a separate Phase 24K-closing handoff at the time
the tag was cut.

### Pre-tag validation (per ADR-024J §"Verification method")

The operator ran the ADR-024J pre-tag validation checklist
verbatim:

```bash
# Sync to the verifying tip of main.
git fetch origin --tags
git switch main
git pull --ff-only

# §5 forbidden-path diff — must be empty BEFORE building.
git diff -- src/ tests/ fixtures/ scripts/ \
  package.json package-lock.json \
  tsconfig.json tsconfig.build.json vitest.config.ts \
  .npmrc .gitignore \
  dist-types/ docs/mvp/package-boundary.md

# §1 pre-tag verification commands.
npm run typecheck
npm run build
npm test
npm pack --dry-run --json > /tmp/phase-24k-pack.json

# §2 declaration entrypoints exist on disk.
ls dist-types/src/straylight/index.d.ts \
   dist-types/src/straylight/host/index.d.ts

# §3 + §7 reproducibility — committed dist-types/** matches
# source-generated output (ADR-024J §"Decision" §4: in-tree
# clean-rebuild + `git diff -- dist-types/`).
npm run clean:types
npm run build
git diff -- dist-types/
```

### Acceptance, as observed

- Every numbered command exited 0.
- The forbidden-path `git diff` produced **empty** output.
- Both `dist-types/src/straylight/index.d.ts` and
  `dist-types/src/straylight/host/index.d.ts` existed on disk
  after `npm run build`.
- The final `git diff -- dist-types/` (after
  `npm run clean:types && npm run build`) produced **empty**
  output.
- The parsed `npm pack --dry-run --json` `files` array
  contained only `README.md`, `package.json`, and entries
  under `dist-types/**/*.d.ts`. The `files` array contained
  **no** path under `src/`, `tests/`, `scripts/`, `fixtures/`,
  `docs/`, `node_modules/`, `.run/`, `.claude/`, `.loa/`,
  `.beads/`, `.github/`, `grimoires/`, and **no**
  `package-lock.json`, `.npmrc`, `.gitignore`,
  `tsconfig*.json`, or `vitest.config.ts`.

### Tag command (per ADR-024J §"Tag command")

The operator ran the ADR-024J §"Tag command" sequence verbatim:

```bash
git tag -a v0.0.1 \
  -m "Phase 24K — Straylight v0.0.1

First reviewed, immutable Straylight tag.
Posture 1a: private + tag-pinned git source consumption per ADR-024I.
Type-only package surface; no runtime exports.

Does NOT authorize a Dixie dependency flip.
Gate 3, Hounfour version-skew resolution, remains unresolved per ADR-024H."

git push origin v0.0.1
```

The tag message text matches ADR-024J §"Tag command" verbatim.
The "Does NOT authorize a Dixie dependency flip" / "Gate 3 …
remains unresolved" language reflects the gate state **at the
time the tag was cut**; Gate 3 was subsequently satisfied by
Dixie PR #97 (Posture 3a). The tag message is **not**
retroactively edited (tag immutability per ADR-024J §"Decision"
§9 + ADR-024I §6).

### Post-tag verification (per ADR-024J §"Post-tag verification")

The operator ran the ADR-024J §"Post-tag verification"
commands verbatim:

```bash
git tag --list v0.0.1
git rev-parse v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
git show v0.0.1 --stat --no-patch
git ls-remote --tags origin v0.0.1
```

Acceptance, as observed at intake time (re-verifiable from this
repo's current state):

- `git tag --list v0.0.1` prints `v0.0.1` (one line).
- `git rev-parse v0.0.1` prints the annotated tag's object SHA.
- `git rev-parse v0.0.1^{commit}` prints
  `de65d93568e70c53ba952279f41a23d2f7d5123e`.
- `git cat-file -t v0.0.1` prints `tag` (annotated, not
  lightweight).
- `git show v0.0.1 --stat --no-patch` prints the tagger
  identity (Eileen C `<ecyleileen@gmail.com>`), the tagger
  date (Sun May 17 10:08:07 2026 +0200), and the
  ADR-024J-prescribed tag message body (no patch body).
- `git ls-remote --tags origin v0.0.1` prints the remote ref
  with a SHA matching `git rev-parse v0.0.1`.

Gate 2 is recorded as **satisfied** on the strength of the above.
Phase 24L does not re-run the operator action; the tag exists,
is annotated, points at the verifying commit, and is reachable
on `origin`. Re-verification by any future reader is a read-only
operation against the existing repo state.

## Dixie consumption record

Dixie PR #99 is the first downstream conforming consumer of the
post-Phase-24H type-only Straylight surface. Phase 24L records
the conformance facts without authorizing any further
consumption posture.

### Conformance facts

- **Citation chain.** Dixie PR #99 is conforming under ADR-024H
  §5 + ADR-024I §"Dixie flip rule after Phase 24J" + ADR-024J
  §"Consequences" because all three ADR-024H gates were
  independently satisfied at the time PR #99 opened and merged
  (Gate 1 by ADR-024I, Gate 2 by the operator action that cut
  `v0.0.1`, Gate 3 by Dixie PR #97 / Posture 3a).
- **Dependency template.** Dixie's `app/package.json` declares
  `@loa/straylight` as
  `github:0xHoneyJar/loa-straylight#v0.0.1` — byte-for-byte
  the Posture 1a consumption template pinned by ADR-024I
  §"Decision" §1.
- **Lockfile resolution.** Dixie's `app/package-lock.json`
  resolves Straylight to git commit
  `de65d93568e70c53ba952279f41a23d2f7d5123e` (the same commit
  the annotated `v0.0.1` tag points at). The lockfile pin is
  immutable under Posture 1a's consumption mechanics.
- **Hounfour dedup.** `@0xhoneyjar/loa-hounfour@8.6.0` is
  deduped across Dixie's app and the consumed Straylight tree.
  No duplicate-Hounfour isolation under Posture 3c was needed.
- **Local mirror deletion.** Dixie's previous `host/types.ts`
  local mirror of Straylight host types was deleted as part of
  PR #99. The single source of truth for Straylight host types
  is now the `@loa/straylight/host` package subpath, served by
  the committed
  [`../../dist-types/src/straylight/host/index.d.ts`](../../dist-types/src/straylight/host/index.d.ts).
- **Type-only consumption.** Dixie imports types from
  `@loa/straylight/host` using `import type` / `export type`
  only. No value imports, no runtime imports, no dynamic
  `import()`, no `require()` against `@loa/straylight*` were
  added. This honors the Phase 24H supported-consumer envelope
  (TypeScript >= 5.4; `moduleResolution: "Bundler"` or
  `"NodeNext"`; `import type` only) pinned by ADR-024G
  §"Decision" §1 and tested by
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts).
- **Local runtime helpers preserved.** Dixie's local runtime
  helpers (the non-type portions of the host implementation)
  remain local. No runtime helper was migrated into the
  Straylight package surface; no runtime helper was imported
  from the Straylight package surface.
- **CI status.** Required CI passed Dixie-side after a workflow
  auth patch. The auth patch is a Dixie-side CI/credentials
  concern, not a Straylight-side gate.
- **Tripwire test.** A Dixie-side `package-contract` tripwire
  test remains in place to catch drift in the consumed
  Straylight surface. Phase 24L records its existence but does
  **not** co-own it; the test is owned Dixie-side.
- **Advisory staging smoke.** May still fail Dixie-side on
  environment, GHCR, or package-access infrastructure grounds.
  Phase 24L mentions this **once** as a Dixie-side infra
  concern, **explicitly not** a Straylight gate. Straylight
  takes no position on Dixie's staging smoke status; the gate
  set is ADR-024H's three gates, all of which are satisfied.

### Conformance non-facts (what Dixie PR #99 did NOT do)

- Dixie PR #99 did **not** add value imports against
  `@loa/straylight*`.
- Dixie PR #99 did **not** add runtime imports, dynamic
  `import()`, or `require()` against `@loa/straylight*`.
- Dixie PR #99 did **not** add endpoint changes, runtime route
  changes, middleware changes, proxy changes, or new rendering
  surfaces.
- Dixie PR #99 did **not** widen vector 9, vectors 10–11, or
  any other vector outside the type-only surface.
- Dixie PR #99 did **not** adopt Hounfour `#116` directly.
- Dixie PR #99 did **not** adopt the `0xhoneyjar:straylight:*`
  audit-event prefix family.
- Dixie PR #99 did **not** adopt the Hounfour `recall-wedge`
  conformance category.
- Dixie PR #99 did **not** add public commitment-root behavior.
- Dixie PR #99 did **not** change the Straylight dependency
  posture.
- Dixie PR #99 did **not** change Hounfour itself.

## Cross-repo fact provenance

Phase 24L cites cross-repo facts that originate outside this
repo. Each fact is recorded **as observed at intake time** and
is not a Straylight-side guarantee about future Dixie state:

| Fact | Source | Observed at |
|---|---|---|
| Dixie PR #97 merged: `@0xhoneyjar/loa-hounfour` `v8.3.1 → v8.6.0` | Dixie repo | Phase 24L intake (post-PR-#99 merge) |
| Dixie PR #99 merged: type-only `@loa/straylight` flip | Dixie repo | Phase 24L intake |
| `app/package.json` Straylight specifier: `github:0xHoneyJar/loa-straylight#v0.0.1` | Dixie PR #99 | Phase 24L intake |
| `app/package-lock.json` Straylight resolution: `de65d93568e70c53ba952279f41a23d2f7d5123e` | Dixie PR #99 | Phase 24L intake |
| `@0xhoneyjar/loa-hounfour` deduped at `8.6.0` | Dixie PR #99 lockfile | Phase 24L intake |
| Dixie `host/types.ts` mirror deleted | Dixie PR #99 | Phase 24L intake |
| Dixie uses `import type` / `export type` from `@loa/straylight/host` only | Dixie PR #99 | Phase 24L intake |
| Dixie runtime helpers remain local | Dixie PR #99 | Phase 24L intake |
| Required CI passed Dixie-side after workflow auth patch | Dixie CI | Phase 24L intake |
| `package-contract` tripwire test in place (Dixie-owned) | Dixie PR #99 (pre-existing or co-landed) | Phase 24L intake |
| Advisory staging smoke may still fail (Dixie-side infra) | Dixie CI | Phase 24L intake (Dixie-side concern) |
| Annotated `v0.0.1` tag exists | This repo (`git cat-file -t v0.0.1`) | Re-verifiable now |
| `v0.0.1` points at `de65d93568e70c53ba952279f41a23d2f7d5123e` | This repo (`git rev-parse v0.0.1^{commit}`) | Re-verifiable now |

If Dixie ever reverts PR #97 or PR #99, the gate-3 / Dixie-flip
facts in this handoff become stale; the resolving action is a
successor ADR + handoff that records the revert event and
re-evaluates Gate 3. Phase 24L does not pre-authorize that
successor phase.

## Refusal rules — what Phase 24L does NOT authorize

Future PRs (Straylight-side or sibling-side) **must not** cite
Phase 24L as authorization for any of the following. Reviewers
may cite this section verbatim to refuse:

1. **No runtime widening.** Phase 24L records a type-only
   consumption event; it does **not** authorize value /
   runtime imports, dynamic `import()`, or `require()` against
   `@loa/straylight*`. Runtime widening still requires its own
   ADR per ADR-024G §"Decision" §2; Phase 24L does not pre-
   authorize that ADR.
2. **No endpoint / route / middleware / proxy / rendering /
   public surface.** Phase 24L authorizes none of these on
   either the Straylight side or the Dixie side. The Phase 20D
   endpoint-boundary nominees remain contract candidates only.
3. **No vector 9, no vectors 10–11.** Phase 24L authorizes no
   vector widening. Vector widening requires its own ADR.
4. **No Hounfour `#116` adoption.** Phase 24L does not adopt
   Hounfour `#116` directly into the Straylight public surface.
5. **No `0xhoneyjar:straylight:*` adoption.** Phase 24L does
   not adopt the `0xhoneyjar:straylight:*` audit-event prefix
   family into the Straylight public surface.
6. **No Hounfour `recall-wedge` adoption.** Phase 24L does not
   adopt the Hounfour `recall-wedge` conformance category into
   the Straylight test suite.
7. **No public commitment-root behavior.** Phase 24L does not
   publish any public commitment root and does not authorize
   any.
8. **No Hounfour change.** Phase 24L makes no change to the
   Straylight Hounfour pin (`^8.6.0` preserved verbatim) and
   makes no change to Hounfour itself.
9. **No Straylight dependency-posture change.** Phase 24L
   makes no change to Posture 1a.
10. **No GitHub Packages or npm publish.** Phase 24L does not
    publish to GitHub Packages, the npm registry, or any
    alternate registry. `"private": true` preserved verbatim.
11. **No new tag or release.** Phase 24L does not cut a new
    tag, does not push any tag, and does not create any GitHub
    Release.
12. **No additional Dixie consumption.** Phase 24L does not
    authorize any further Dixie-side consumption beyond the
    type-only flip already merged in PR #99.
13. **No Phase 19A pending feedback advance** on
    [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).

## Explicit non-scope

Phase 24L mirrors ADR-024K §"Explicit non-scope" wholesale. The
short form:

1. **No file changes outside the three approved docs.** Only
   this handoff, the companion ADR-024K, and the README index
   append are new.
2. **No `package.json` edit.** No `version` field change. No
   script edit.
3. **No `package-lock.json` edit.**
4. **No `.npmrc` edit.**
5. **No `.gitignore` edit.**
6. **No `tsconfig.json` / `tsconfig.build.json` edit.**
7. **No `vitest.config.ts` edit.**
8. **No source edit** (`src/**` byte-identical).
9. **No test edit** (`tests/**` byte-identical; no new test
   file).
10. **No `dist-types/` edit.**
11. **No script edit** (`scripts/**` byte-identical).
12. **No fixture edit** (`fixtures/**` byte-identical).
13. **No
    [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    edit.**
14. **No new tag in this PR.** No `git tag`. The existing
    `v0.0.1` tag is read-only for Phase 24L.
15. **No tag push in this PR.** No tag relocation. No
    `git push --force` / `--force-with-lease` against any tag.
16. **No GitHub Release.** No `gh release create`.
17. **No publish.** No `npm publish`. No GitHub Packages
    publish. `"private": true` preserved.
18. **No Hounfour bump / change.** `^8.6.0` preserved verbatim.
19. **No sibling repo edit** (`loa-dixie`, `loa-finn`,
    `loa-freeside`, `loa-hounfour`).
20. **No additional Dixie consumption.** The type-only flip in
    Dixie PR #99 is recorded as conforming; no further
    consumption is authorized.
21. **No Flatline / Bridgebuilder / red-team request.**
22. **No prior-ADR edit.** ADR-024A through ADR-024J preserved
    verbatim.
23. **No prior-handoff edit.** Only the new Phase 24L handoff
    and the README index entry are new artifacts.
24. **No ADR-022E gate advance.** No Phase 19A pending
    feedback advance. No commitment-root publication. No
    endpoint.
25. **No `npm install` / `npm update` / `npm ci` /
    `npm publish` / `npm version` / package-manager mutation
    command.** `npm pack --dry-run` is allowed in validation
    (read-only).
26. **No GitHub issue / comment / PR action.**
27. **No touch of
    [`../../.loa`](../../.loa),
    [`../../.loa.config.yaml`](../../.loa.config.yaml),
    [`../../.claude/`](../../.claude/),
    [`../../.beads/`](../../.beads/),
    [`../../.run/`](../../.run/),
    [`../../.github/`](../../.github/),
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
    `node_modules/`.**
28. **No Dixie staging-smoke remediation.** Advisory staging
    smoke is a Dixie-side infra concern; remediation is
    Dixie-side, not Straylight-side.
29. **No Dixie tripwire-test co-ownership.** The Dixie-side
    `package-contract` tripwire test is owned Dixie-side.

## Validation

Phase 24L is **docs-only**. The package surface, source,
declarations, tests, and configuration are byte-identical to the
post-PR-#37 (Phase 24K-opening) state. Validation is limited to
asserting that:

- the package state still builds;
- the test suite still passes;
- the declaration entrypoints still exist;
- `npm pack --dry-run` is still shaped the same as Phase 24H;
- the forbidden-path diff is empty;
- the existing `v0.0.1` tag still resolves to
  `de65d93568e70c53ba952279f41a23d2f7d5123e` and is annotated.

### Validation commands

```bash
npm run typecheck
npm test
npm run build
ls dist-types/src/straylight/index.d.ts dist-types/src/straylight/host/index.d.ts
npm pack --dry-run
git diff -- src/ tests/ fixtures/ scripts/ package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .npmrc .gitignore dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
```

### Expected outcomes

- `npm run typecheck` — clean. (No source edit;
  `tsconfig.json` unchanged.)
- `npm test` — passes identically to the Phase 24K-opening
  post-merge baseline. (No test added; no test edited; the two
  Phase 24H tests
  [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts)
  and
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
  continue to pass against the unchanged package state.)
- `npm run build` — clean. Emits
  `dist-types/src/straylight/index.d.ts` and
  `dist-types/src/straylight/host/index.d.ts`. The rebuilt
  artifact is byte-identical to the committed `dist-types/**`.
- `ls dist-types/src/straylight/index.d.ts
  dist-types/src/straylight/host/index.d.ts` — both files
  exist.
- `npm pack --dry-run` — tarball preview is identical in shape
  to the Phase 24H / 24I / 24J / 24K-opening baselines (only
  `dist-types/**`, `README.md`, and `package.json` ship; no
  `tsconfig*.json`, no `vitest.config.ts`, no `.npmrc`, no
  `.gitignore`, no `package-lock.json`, no `src/`, no
  `tests/`, no `scripts/`, no `fixtures/`, no `docs/`).
- Forbidden-path diff is **empty**: `git diff -- src/ tests/
  fixtures/ scripts/ package.json package-lock.json
  tsconfig.json tsconfig.build.json vitest.config.ts .npmrc
  .gitignore dist-types/ docs/mvp/package-boundary.md`
  produces no output.
- `git diff --stat` — shows only the three Phase 24L docs
  (this handoff, the companion ADR-024K, and the README index
  append).
- `git status --short` — shows only the three Phase 24L docs
  plus any pre-existing local dirt.
- `git tag --list v0.0.1` — prints `v0.0.1` (one line).
- `git rev-parse v0.0.1^{commit}` — prints
  `de65d93568e70c53ba952279f41a23d2f7d5123e`.
- `git cat-file -t v0.0.1` — prints `tag` (annotated).

**No new tests.** Phase 24L does not author or modify any test.

**No package mutation.** Phase 24L does not run `npm install`,
`npm update`, `npm ci`, `npm publish`, `npm version`, `git tag`,
`git push --tags`, `gh release create`, or any other
package-manager / git-mutation command. No tag is created. No
tag is pushed. No release is cut. No GitHub Release is created.

## Open follow-ups

1. **Future Straylight-side downstream-adoption phases.** Phase
   24L is the first downstream-adoption intake. Future phases
   (e.g., Finn type-only consumption, Freeside type-only
   consumption, additional Dixie-side surfaces) each require
   their own ADR with gate-conformance evidence at the time
   the consumer flip PR opens. ADR-024K does not pre-authorize
   any of those phases.
2. **Runtime-widening ADR.** Per ADR-024G §"Decision" §2,
   runtime / value imports against `@loa/straylight*` are
   unsupported by design and require a future runtime-widening
   ADR before any consumer may add value / runtime imports.
   Phase 24L does **not** author that ADR.
3. **Future tag bumps.** If a future package-surface change
   warrants a bump, the next tag is `v0.0.2` (patch bump under
   tag-immutability discipline) or a higher label under its
   own ADR. ADR-024J does not pre-authorize future labels;
   Phase 24L does not author them either.
4. **Posture 1b reopening.** ADR-024I §"Decision" §2 refuses
   Posture 1b for the duration covered by ADR-024I; ADR-024K
   does not reopen the refusal. A future ADR may reopen under
   its own teammate review.
5. **Hounfour-skew successor ADR (only if Dixie diverges).**
   Posture 3a alignment is the steady-state Gate-3 outcome as
   of Phase 24L. If Dixie ever diverges (reverts to a
   `<8.6.x` Hounfour line, or Straylight bumps past
   `8.6.x` under its own ADR), a successor ADR re-evaluates
   Gate 3 (Posture 3a still / Posture 3b / Posture 3c).
   Phase 24L does not pre-authorize that successor.
6. **Phase 19A pending feedback gate** on
   [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
   remains pending and is **not** advanced by Phase 24L.
7. **Dixie staging-smoke remediation.** Advisory staging
   smoke is a Dixie-side infra/package-access concern;
   remediation, if any, is Dixie-side. Phase 24L takes no
   position.
8. **Dixie tripwire-test co-evolution.** The Dixie-side
   `package-contract` tripwire test is owned Dixie-side.
   Future Straylight-side surface changes (under their own
   ADRs) must consider the tripwire as a Dixie-side
   regression signal but do not co-own it.

## Cross-references

- Companion ADR:
  [`../decisions/ADR-024K-dixie-host-type-consumption-intake.md`](../decisions/ADR-024K-dixie-host-type-consumption-intake.md).
- Direct predecessor (release / tag execution plan):
  [`./phase-24k-release-tag-execution.md`](./phase-24k-release-tag-execution.md).
- Release / tag execution decision-lock:
  [`../decisions/ADR-024J-release-tag-execution.md`](../decisions/ADR-024J-release-tag-execution.md).
- Release-posture decision-lock:
  [`../decisions/ADR-024I-release-posture-selection.md`](../decisions/ADR-024I-release-posture-selection.md).
- Release-posture handoff:
  [`./phase-24j-release-posture-selection.md`](./phase-24j-release-posture-selection.md).
- Gate-plan decision-lock:
  [`../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md`](../decisions/ADR-024H-release-and-dixie-flip-gate-plan.md).
- Gate-plan handoff:
  [`./phase-24i-release-and-dixie-flip-gate-plan.md`](./phase-24i-release-and-dixie-flip-gate-plan.md).
- Implementation decision-lock:
  [`../decisions/ADR-024G-host-package-subpath-implementation.md`](../decisions/ADR-024G-host-package-subpath-implementation.md).
- Implementation handoff:
  [`./phase-24h-host-package-subpath-implementation.md`](./phase-24h-host-package-subpath-implementation.md).
- Package-release ambiguity discipline:
  [`../decisions/ADR-024C-package-release-ambiguity.md`](../decisions/ADR-024C-package-release-ambiguity.md).
- Hounfour 116 substrate intake (`#116` adoption deferred):
  [`../decisions/ADR-024A-hounfour-116-substrate-intake.md`](../decisions/ADR-024A-hounfour-116-substrate-intake.md).
- Phase 5 stable-surface freeze (read-only; not edited by
  Phase 24L):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Phase 24H package-shape invariants (mirrored Dixie-side by
  the `package-contract` tripwire test):
  [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts).
- Phase 24H supported-consumer envelope (honored by Dixie
  PR #99):
  [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts).
- Host barrel (unchanged; live type source for Dixie):
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts).
- Wedge public surface (unchanged):
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
- Committed declaration emit (live type source for Dixie):
  [`../../dist-types/`](../../dist-types/).
