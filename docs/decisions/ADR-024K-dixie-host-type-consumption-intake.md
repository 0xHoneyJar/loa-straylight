# ADR-024K — Dixie host type-only consumption intake (Phase 24L)

## Status

Accepted-for-Phase-24L.

This ADR is the **Phase 24L decision-lock**. It is a **docs-only
intake** that records, on the Straylight side, two cross-repo
events that already happened:

1. The operator action that satisfied **Gate 2** by cutting and
   pushing the annotated `v0.0.1` tag against the verified
   post-Phase-24K-opening `main` commit
   (`de65d93568e70c53ba952279f41a23d2f7d5123e`).
2. The Dixie-side conforming consumption that satisfied **Gate 3**
   via Posture 3a (Dixie bumped `@0xhoneyjar/loa-hounfour` from
   `v8.3.1` to `v8.6.0` in Dixie PR #97) and exercised the
   type-only `@loa/straylight/host` surface for the first time
   in Dixie PR #99 (type-only `import type` / `export type` from
   `@loa/straylight/host`; `app/package.json` depending on
   `github:0xHoneyJar/loa-straylight#v0.0.1`).

ADR-024K **does not** edit
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
under [`../../dist-types/`](../../dist-types/), or the Phase 5
stable public surface
([`../mvp/package-boundary.md`](../mvp/package-boundary.md)).
ADR-024K does **not** edit any prior ADR, any prior handoff
(other than the README index entry authored alongside this ADR),
or any sibling repo (`loa-dixie`, `loa-finn`, `loa-freeside`,
`loa-hounfour`). ADR-024K does **not** create a new tag, does
**not** push a new tag, does **not** publish the package, does
**not** create a GitHub Release, does **not** bump the Hounfour
dependency range, does **not** consume Hounfour `main` or any
unpublished commit, does **not** import the Hounfour `#116`
five-step conformance corpus, does **not** adopt the
`0xhoneyjar:straylight:*` audit-event prefix family into the
Straylight public surface, does **not** adopt the `recall-wedge`
Hounfour conformance category into the Straylight test suite,
does **not** advance any ADR-022E gate, does **not** publish a
public commitment root, does **not** file or edit any GitHub
issue / comment / PR, and does **not** touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`.

No Flatline / Bridgebuilder / red-team review is requested or
run by Phase 24L, because Phase 24L makes **no** package-surface
or source change. The events being recorded are external to this
PR: the `v0.0.1` tag was cut by a separate operator action
against an already-merged `main` commit; the Dixie-side
consumption was reviewed and merged Dixie-side. Phase 24L is the
in-repo intake record only.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24L.

This ADR sits on top of:

- ADR-024A
  ([`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)),
- ADR-024B
  ([`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md)),
- ADR-024C
  ([`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)),
- ADR-024D
  ([`./ADR-024D-phase-24b-implementation-branch.md`](./ADR-024D-phase-24b-implementation-branch.md)),
- ADR-024E
  ([`./ADR-024E-dixie-host-mvp-wire-shape.md`](./ADR-024E-dixie-host-mvp-wire-shape.md)),
- ADR-024F
  ([`./ADR-024F-host-package-consumption-readiness.md`](./ADR-024F-host-package-consumption-readiness.md)),
- ADR-024G
  ([`./ADR-024G-host-package-subpath-implementation.md`](./ADR-024G-host-package-subpath-implementation.md)),
- ADR-024H
  ([`./ADR-024H-release-and-dixie-flip-gate-plan.md`](./ADR-024H-release-and-dixie-flip-gate-plan.md)),
- ADR-024I
  ([`./ADR-024I-release-posture-selection.md`](./ADR-024I-release-posture-selection.md)),
- ADR-024J
  ([`./ADR-024J-release-tag-execution.md`](./ADR-024J-release-tag-execution.md)).

ADR-024K is **additive** to ADR-024H / ADR-024I / ADR-024J.
ADR-024H enumerated the three conjunctive gates. ADR-024I
selected Gate 1 as Posture 1a. ADR-024J pinned Gate 2's
execution parameters. ADR-024K records that:

- Gate 2 has flipped from "prepared" to **"satisfied"** by the
  operator action that cut and pushed `v0.0.1`.
- Gate 3 has flipped from "unresolved, still blocking" to
  **"satisfied"** by Posture 3a (Dixie bumped Hounfour to
  `v8.6.0` in Dixie PR #97).
- The post-Gate-1/2/3 type-only Dixie flip in Dixie PR #99 is
  **conforming** under ADR-024H §5 + ADR-024I §"Dixie flip rule
  after Phase 24J" + ADR-024J §"Consequences" because (a) all
  three gates are independently satisfied at the time the flip
  PR opened and merged, and (b) the flip is type-only and
  honors the Phase 24H supported-consumer envelope.

ADR-024K does **not** reopen ADR-024I §"Decision" §1 (Posture 1a
remains selected), does **not** reopen ADR-024I §"Decision" §2
(Posture 1b remains refused for now), does **not** reopen
ADR-024I §"Decision" §3 (hybrid posture remains refused), does
**not** reopen ADR-024J §"Decision" §§1–9 (the executed tag
honors all nine rules), and does **not** widen any ADR-024G §2
runtime-widening refusal.

## Context

### Phase 24H / 24I / 24J recap (what already shipped)

Phase 24H (ADR-024G + the Phase 24H handoff, merged via PR #34)
made the Straylight package surface **type-only consumable**: a
type-only `exports` map with two subpaths (`"."` and `"./host"`),
each with exactly one `"types"` condition; committed
`dist-types/` declaration emit reproducible from source via
`npm run clean:types && npm run build`; no `main` field; no
runtime export conditions; `"private": true` preserved; Hounfour
declared at `@0xhoneyjar/loa-hounfour@^8.6.0`, unchanged; no
tag; no publish.

Phase 24I (ADR-024H + the Phase 24I gate-plan handoff, merged
via PR #35) enumerated three conjunctive gates between the
post-Phase-24H type-consumable surface and a future Dixie
dependency flip: Gate 1 publish posture, Gate 2 release / tag
consumption point, Gate 3 Hounfour version-skew resolution.

Phase 24J (ADR-024I + the Phase 24J release-posture-selection
handoff, merged via PR #36) selected Gate 1 as **Posture 1a**
(private + tag-pinned git-source consumption) and **prepared
Gate 2** by pinning the seven-section tag-readiness checklist.

Phase 24K-opening (ADR-024J + the Phase 24K release-tag-execution
handoff, merged via PR #37) selected Gate 2's execution parameters
(version label `v0.0.1`; annotated tag; tag target = the verified
post-Phase-24K-opening `main` commit; verification approach =
in-tree clean-rebuild + `git diff -- dist-types/`; no GitHub
Release; no publish; no `version` change; no metadata change;
no force-push / retag) and authored the operator-facing pre-tag
checklist + tag command + post-tag verification commands.
Phase 24K-opening **did not** cut the tag.

### Events Phase 24L records (what shipped between Phase 24K-opening and now)

Three events, all external to this PR, occurred after PR #37
merged:

1. **Operator action: `v0.0.1` cut and pushed.** A separate
   operator action ran the ADR-024J §"Verification method"
   pre-tag validation checklist against the post-Phase-24K-
   opening `main` HEAD (`de65d93568e70c53ba952279f41a23d2f7d5123e`,
   the merge commit of PR #37), confirmed every acceptance
   criterion, ran the §"Tag command" sequence (`git tag -a
   v0.0.1 -m "Phase 24K — Straylight v0.0.1 ..." && git push
   origin v0.0.1`), and ran the §"Post-tag verification"
   commands. The annotated tag is observable now in this repo:
   `git cat-file -t v0.0.1` returns `tag`; `git rev-parse
   v0.0.1^{commit}` returns `de65d93568e70c53ba952279f41a23d2f7d5123e`;
   `git show v0.0.1 --stat --no-patch` shows tagger
   identity, date, and the ADR-024J-prescribed tag message.
2. **Dixie PR #97 — Hounfour 8.6.0 alignment (Gate 3 / Posture
   3a).** Dixie-side merged the bump of
   `@0xhoneyjar/loa-hounfour` from `v8.3.1` to `v8.6.0`,
   matching the Straylight Hounfour pin (`^8.6.0`, locked since
   Phase 24H). This satisfies Gate 3 via Posture 3a (Dixie bumps
   to a Hounfour line compatible with Straylight) per ADR-024H
   §4 / ADR-024H §5.
3. **Dixie PR #99 — type-only dependency flip.** Dixie-side
   merged the type-only consumption of the Straylight package:
   - `app/package.json` now depends on `@loa/straylight` as
     `github:0xHoneyJar/loa-straylight#v0.0.1` (Posture 1a's
     consumption template, byte-for-byte).
   - `app/package-lock.json` resolves Straylight to git commit
     SHA `de65d93568e70c53ba952279f41a23d2f7d5123e` (the same
     commit `v0.0.1` points at).
   - `@0xhoneyjar/loa-hounfour` is **deduped** at `8.6.0`
     across Dixie's app and the consumed Straylight tree (no
     duplicate-Hounfour isolation under Posture 3c was needed).
   - Dixie's local `host/types.ts` mirror of Straylight host
     types was **deleted**.
   - Dixie now imports types from `@loa/straylight/host`
     using `import type` / `export type` only (the Phase 24H
     supported-consumer envelope: TypeScript >= 5.4;
     `moduleResolution: "Bundler"` or `"NodeNext"`;
     `import type` only).
   - Dixie's local runtime helpers remain local; no runtime
     Straylight import was added.
   - Required CI passed after a Dixie-side workflow auth patch.
   - A Dixie-side `package-contract` tripwire test remains in
     place to catch drift in the consumed Straylight surface.
   - Advisory staging smoke may still fail Dixie-side on
     environment, GHCR, or package-access infrastructure
     grounds; this is a **Dixie-side infra concern**, not a
     Straylight gate.

### Current package state recap (post-PR-#37 baseline; unchanged through Phase 24L)

The Straylight package configuration on `main` after PR #37
merged is **byte-identical** to the post-Phase-24H baseline. The
events recorded in §"Events Phase 24L records" above are external
to this Straylight repo's package state — the operator action
that cut `v0.0.1` produced no `main` commit; the Dixie-side
flip in PRs #97 / #99 produced no Straylight `main` commit. The
current Straylight state is:

| Fact | Value |
|---|---|
| Package name | `@loa/straylight` |
| Version | `0.0.1` |
| `private` | `true` |
| Module type | ESM (`"module"`) |
| Type-only exports | `"."` and `"./host"`, each with exactly one `"types"` condition |
| Runtime conditions under `exports` | **None** |
| `main` field | **Absent** |
| `types` field | `./dist-types/src/straylight/index.d.ts` |
| `files` | `["dist-types/", "README.md", "package.json"]` |
| `build` script | `npm run clean:types && tsc -p tsconfig.build.json` |
| `prepare` script | `npm run build` (development convenience) |
| `publish` / `prepublishOnly` / `prepack` / `postpublish` script | **Absent** |
| Hounfour dependency | `@0xhoneyjar/loa-hounfour@^8.6.0` |
| `@loa` registry mapping in [`../../.npmrc`](../../.npmrc) | **None** |
| Publish workflow for `@loa/straylight` in [`../../.github/workflows/`](../../.github/workflows/) | **None** |
| Local `git tag --list v0.0.1` | `v0.0.1` (annotated) |
| `git rev-parse v0.0.1^{commit}` | `de65d93568e70c53ba952279f41a23d2f7d5123e` |
| `git cat-file -t v0.0.1` | `tag` (annotated, not lightweight) |
| `git ls-remote --tags origin v0.0.1` | present at `origin` |
| GitHub Releases | **0** (no Release was created; ADR-024J §"Decision" §5 honored) |
| Forbidden-path `git diff` (ADR-024I §5 file list) | **Empty** against `main` |

### Gate status going into Phase 24L

| Gate | Status entering Phase 24L |
|---|---|
| Gate 1 — Publish posture | **Satisfied** by Phase 24J (Posture 1a; ADR-024I §"Decision" §1) |
| Gate 2 — Release / tag consumption point | **Satisfied** by the operator action (annotated `v0.0.1` cut + pushed; ADR-024J §"Decision" §§1–9 honored) |
| Gate 3 — Hounfour version-skew resolution | **Satisfied** via Posture 3a (Dixie PR #97 bumped `@0xhoneyjar/loa-hounfour` to `v8.6.0`) |

All three ADR-024H gates are independently satisfied. The Dixie
PR #99 type-only flip that merged afterwards is **conforming on
its face** under ADR-024H §5 and is recorded by Phase 24L as the
first downstream consumer of the post-Phase-24H type-only
Straylight surface.

## Decision

### 1. Record Gate 1 as satisfied

Gate 1 (Publish posture) is **satisfied** by ADR-024I §"Decision"
§1 (Posture 1a: private + tag-pinned git source consumption).
The Straylight package state on `main` continues to reflect
Posture 1a unambiguously:

- `"private": true` preserved verbatim in
  [`../../package.json`](../../package.json).
- No `publish` / `prepublishOnly` / `prepack` / `postpublish`
  script.
- No `@loa:registry=` mapping in
  [`../../.npmrc`](../../.npmrc).
- No GitHub Packages publish workflow for `@loa/straylight` in
  [`../../.github/workflows/`](../../.github/workflows/).
- No `npm publish` / GitHub Packages publish has been performed.

Phase 24L makes no Gate-1 change. The Posture 1b refusal
(ADR-024I §"Decision" §2) and the hybrid-posture refusal
(ADR-024I §"Decision" §3) remain in force.

### 2. Record Gate 2 as satisfied

Gate 2 (Release / tag consumption point) is **satisfied** by the
operator action that cut and pushed the annotated `v0.0.1` tag
per ADR-024J §"Decision" §§1–9. Specifically:

- **Tag label.** `v0.0.1` (exactly; lowercase `v`; no
  pre-release / build-metadata suffix; matches
  [`../../package.json`](../../package.json) `version`
  byte-for-byte). Honors ADR-024J §"Decision" §1.
- **Tag type.** Annotated (`git cat-file -t v0.0.1` → `tag`).
  Honors ADR-024J §"Decision" §2.
- **Tag target.** Commit
  `de65d93568e70c53ba952279f41a23d2f7d5123e` (the merge commit
  of PR #37, the verifying post-Phase-24K-opening `main` HEAD).
  No subsequent merge changed the package surface between
  PR #37 merging and the operator action running. Honors
  ADR-024J §"Decision" §3.
- **Verification approach.** In-tree clean-rebuild +
  `git diff -- dist-types/` (the operator ran the
  `npm run clean:types && npm run build` sequence, observed
  empty `git diff -- dist-types/`, observed all
  `npm run typecheck` / `npm test` / `npm run build` /
  `npm pack --dry-run --json` checks clean, observed both
  declaration entrypoints present, observed empty
  forbidden-path diff, and observed the `npm pack --dry-run
  --json` `files` array contains only `README.md` /
  `package.json` / `dist-types/**/*.d.ts`). Honors ADR-024J
  §"Decision" §4.
- **No GitHub Release.** No `gh release create` was run; no
  Release exists for `v0.0.1`. Honors ADR-024J §"Decision" §5.
- **No publish.** No `npm publish`, no GitHub Packages publish,
  no alternate-registry publish. Honors ADR-024J §"Decision"
  §6.
- **No `version` change.** [`../../package.json`](../../package.json)
  `version` remains `0.0.1` (matches the tag label byte-for-
  byte). Honors ADR-024J §"Decision" §7.
- **No package metadata change.** No edit to
  [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json),
  [`../../.npmrc`](../../.npmrc),
  [`../../.gitignore`](../../.gitignore),
  [`../../tsconfig.json`](../../tsconfig.json),
  [`../../tsconfig.build.json`](../../tsconfig.build.json),
  [`../../vitest.config.ts`](../../vitest.config.ts), any file
  under [`../../src/`](../../src/), any file under
  [`../../tests/`](../../tests/), any file under
  [`../../scripts/`](../../scripts/), any file under
  [`../../fixtures/`](../../fixtures/), any committed
  declaration under [`../../dist-types/`](../../dist-types/),
  or [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  was made by the operator action. Honors ADR-024J §"Decision"
  §8.
- **Tag immutability.** No force-push, no retag, no relocation.
  `v0.0.1` remains pinned to
  `de65d93568e70c53ba952279f41a23d2f7d5123e`. Honors ADR-024J
  §"Decision" §9 + ADR-024I §6.

The operator action that satisfied Gate 2 produced no separate
Phase 24K-closing handoff at the time it ran; Phase 24L
**absorbs** the operator-action record into this intake (see
§"Operator-action record" below).

### 3. Record Gate 3 as satisfied via Posture 3a

Gate 3 (Hounfour version-skew resolution) is **satisfied** via
**Posture 3a** (Dixie bumps to a Hounfour line compatible with
Straylight) per ADR-024H §4. Specifically:

- Dixie PR #97 merged on the Dixie side, bumping
  `@0xhoneyjar/loa-hounfour` from `v8.3.1` to `v8.6.0` to
  match the Straylight Hounfour pin (`^8.6.0`, locked since
  Phase 24H).
- After Dixie PR #97 merged and the type-only flip in Dixie
  PR #99 followed, `@0xhoneyjar/loa-hounfour` is **deduped at
  `8.6.0`** in Dixie's `app/package-lock.json` across the
  Dixie tree and the consumed Straylight git source.
- No duplicate-Hounfour isolation under Posture 3c was needed.
- No Straylight-side change to the Hounfour posture under
  Posture 3b was required.
- Posture 3a is the lowest-blast-radius Gate-3 outcome
  available; Phase 24L records its selection but does not
  reopen the Posture 3a / 3b / 3c choice for any future
  resolution (a future ADR may re-select if Dixie ever
  diverges).

Phase 24L does **not** edit the Straylight Hounfour pin (still
`^8.6.0`). Phase 24L does **not** propose a Straylight-side
Hounfour change. Phase 24L does **not** propose any Dixie-side
Hounfour change (Dixie PR #97 already merged; Phase 24L records
the event, does not re-author it).

### 4. Record Dixie PR #99 as a conforming type-only flip

Dixie PR #99 is the first downstream conforming consumer of the
Straylight `@loa/straylight/host` type-only surface. Phase 24L
records the conformance facts without authorizing any further
consumption posture.

**Conformance facts as observed:**

- **Citation chain.** Dixie PR #99 is conforming under ADR-024H
  §5 + ADR-024I §"Dixie flip rule after Phase 24J" + ADR-024J
  §"Consequences" because all three ADR-024H gates were
  independently satisfied at the time PR #99 opened and merged
  (Gate 1 by ADR-024I, Gate 2 by the operator action that cut
  `v0.0.1`, Gate 3 by Dixie PR #97 / Posture 3a).
- **Dependency template.** `app/package.json` declares
  `@loa/straylight` as
  `github:0xHoneyJar/loa-straylight#v0.0.1` — byte-for-byte
  the Posture 1a consumption template pinned by ADR-024I
  §"Decision" §1.
- **Lockfile resolution.** `app/package-lock.json` resolves
  Straylight to git commit
  `de65d93568e70c53ba952279f41a23d2f7d5123e`, the same commit
  the annotated `v0.0.1` tag points at. The lockfile pin is
  immutable under Posture 1a's consumption mechanics.
- **Hounfour dedup.** `@0xhoneyjar/loa-hounfour@8.6.0` is
  deduped across Dixie's app and the consumed Straylight tree.
- **Local mirror deletion.** Dixie's previous `host/types.ts`
  local mirror of Straylight host types was deleted as part of
  PR #99. The single source of truth for Straylight host types
  is now the `@loa/straylight/host` package subpath, served by
  the committed `dist-types/src/straylight/host/index.d.ts`.
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
- **CI status.** Required CI passed Dixie-side after a
  workflow auth patch. The auth patch is a Dixie-side
  CI/credentials concern, not a Straylight-side gate.
- **Tripwire test.** A Dixie-side `package-contract` tripwire
  test remains in place to catch drift in the consumed
  Straylight surface. Phase 24L records its existence but
  does not co-own it; Dixie owns the tripwire.
- **Advisory staging smoke.** May still fail Dixie-side on
  environment, GHCR, or package-access infrastructure grounds.
  Phase 24L mentions this **once** as a Dixie-side infra
  concern, **explicitly not** a Straylight gate. Straylight
  takes no position on Dixie's staging smoke status; the gate
  set is ADR-024H's three gates, all of which are satisfied.

**Conformance non-facts (what Dixie PR #99 did NOT do):**

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
- Dixie PR #99 did **not** adopt the
  `0xhoneyjar:straylight:*` audit-event prefix family.
- Dixie PR #99 did **not** adopt the Hounfour `recall-wedge`
  conformance category.
- Dixie PR #99 did **not** add public commitment-root
  behavior.
- Dixie PR #99 did **not** change the Straylight dependency
  posture.
- Dixie PR #99 did **not** change Hounfour.

### 5. Refusal rules for citing Phase 24L

Future PRs (Straylight-side or sibling-side) **must not** cite
Phase 24L as authorization for any of the following. Reviewers
may cite this section verbatim to refuse:

1. **Runtime widening.** Phase 24L records a type-only
   consumption event; it does **not** authorize value /
   runtime imports, dynamic `import()`, or `require()` against
   `@loa/straylight*`. Runtime widening still requires its own
   ADR per ADR-024G §"Decision" §2; ADR-024K does not
   pre-authorize that ADR.
2. **Endpoint / route / middleware / proxy / rendering.**
   Phase 24L authorizes none of these on either the Straylight
   side or the Dixie side. The Phase 20D endpoint-boundary
   nominees (`RecallRequest` / `RecallPack` / `RecallReceipt`
   / `audit_review` / `audit_chain_verification`) remain
   contract candidates only. The MVP endpoint host selection
   (Dixie preferred per ADR-022B / ADR-024B) remains a
   selection on paper; no endpoint, route, middleware, proxy,
   or rendering surface is authorized.
3. **Vector 9 / vectors 10–11.** Phase 24L authorizes no
   widening into vector 9 or vectors 10–11. Vector widening
   requires its own ADR.
4. **Hounfour `#116` adoption.** Phase 24L does not adopt
   Hounfour `#116` directly into the Straylight public
   surface. Adoption remains deferred per ADR-024A and
   ADR-022E.
5. **`0xhoneyjar:straylight:*` audit-event prefix.** Phase 24L
   does not adopt the `0xhoneyjar:straylight:*` audit-event
   prefix family into the Straylight public surface. Adoption
   remains deferred.
6. **Hounfour `recall-wedge` adoption.** Phase 24L does not
   adopt the Hounfour `recall-wedge` conformance category into
   the Straylight test suite. Adoption remains deferred.
7. **Public commitment-root behavior.** Phase 24L does not
   publish any public commitment root and does not authorize
   any. Publication remains deferred per ADR-020E and
   ADR-022E.
8. **Hounfour change.** Phase 24L makes no change to the
   Straylight Hounfour pin (`^8.6.0` preserved verbatim) and
   makes no change to Hounfour itself (Hounfour is a sibling
   repo Phase 24L does not edit).
9. **Straylight dependency-posture change.** Phase 24L makes
   no change to Posture 1a (private + tag-pinned git source
   consumption). Posture 1b reopening, hybrid-posture
   adoption, GitHub Packages publishing, npm publishing, or
   any alternate consumption posture remain deferred per
   ADR-024I §"Decision" §§2–3 + ADR-024J §"Decision" §§5–6 +
   §"Decision" §1 above.
10. **New tag or release.** Phase 24L does not cut a new tag
    (no `v0.0.2` / `v0.1.0` / `v1.0.0` / pre-release / build-
    metadata tag), does not push any tag, and does not create
    any GitHub Release. Future tag bumps require their own
    ADR per ADR-024J §"Decision" §9 + ADR-024J
    §"Consequences".
11. **Sibling-repo edit.** Phase 24L edits no file in
    `loa-dixie`, `loa-finn`, `loa-freeside`, or `loa-hounfour`
    and authorizes no Straylight-side PR that would do so.
    The Dixie PR #97 / #99 events Phase 24L records were
    Dixie-side authored under Dixie-side review.
12. **Phase 19A pending feedback advance.** Phase 24L does
    **not** advance the Phase 19A pending feedback gate on
    [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).

## Operator-action record (absorbed Phase 24K-closing)

Phase 24L absorbs the missing Phase 24K-closing record. The
operator action that satisfied Gate 2 ran the following sequence
against a clean checkout of `main` at
`de65d93568e70c53ba952279f41a23d2f7d5123e` (the merge commit of
PR #37, after no subsequent merge changed the package surface):

### Pre-tag validation (per ADR-024J §"Verification method")

The operator ran the ADR-024J pre-tag validation checklist. Each
command exited 0; the forbidden-path `git diff` produced empty
output; both declaration entrypoints existed on disk after
`npm run build`; the final `git diff -- dist-types/` after
`npm run clean:types && npm run build` produced empty output;
the parsed `npm pack --dry-run --json` output's `files` array
contained only `README.md`, `package.json`, and entries under
`dist-types/**/*.d.ts` (no path under `src/`, `tests/`,
`scripts/`, `fixtures/`, `docs/`, `node_modules/`, `.run/`,
`.claude/`, `.loa/`, `.beads/`, `.github/`, `grimoires/`; no
`package-lock.json`, `.npmrc`, `.gitignore`, `tsconfig*.json`,
or `vitest.config.ts`).

### Tag command (per ADR-024J §"Tag command")

The operator ran:

```
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
Dixie PR #97 (Posture 3a). The tag message is not retroactively
edited (tag immutability per ADR-024J §"Decision" §9).

### Post-tag verification (per ADR-024J §"Post-tag verification")

The operator ran:

```
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
- `git cat-file -t v0.0.1` prints `tag` (annotated).
- `git show v0.0.1 --stat --no-patch` shows tagger identity
  (Eileen C `<ecyleileen@gmail.com>`), date (Sun May 17
  10:08:07 2026 +0200), and the ADR-024J-prescribed tag
  message body.
- `git ls-remote --tags origin v0.0.1` returns the remote ref
  with a SHA matching `git rev-parse v0.0.1`.

Gate 2 is recorded as **satisfied** on the strength of the
above. Phase 24L does not re-run the operator action; the tag
exists, is annotated, points at the verifying commit, and is
reachable on `origin`. Re-verification by any future reader is a
read-only operation against the existing repo state.

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
| `package-contract` tripwire test in place | Dixie PR #99 (pre-existing or co-landed) | Phase 24L intake |
| Advisory staging smoke may still fail (infra) | Dixie CI | Phase 24L intake (Dixie-side concern) |
| Annotated `v0.0.1` tag exists | This repo (`git cat-file -t v0.0.1`) | Re-verifiable now |
| `v0.0.1` points at `de65d93568e70c53ba952279f41a23d2f7d5123e` | This repo (`git rev-parse v0.0.1^{commit}`) | Re-verifiable now |

If Dixie ever reverts PR #97 or PR #99, the gate-3 / Dixie-flip
facts in this ADR become stale; the resolving action is a
successor ADR that records the revert event and re-evaluates
Gate 3. ADR-024K does not pre-authorize that successor ADR.

## Gate status

After Phase 24L merges (this PR):

| Gate | Status |
|---|---|
| Gate 1 — Publish posture | **Satisfied** (by Phase 24J / ADR-024I §"Decision" §1; unchanged) |
| Gate 2 — Release / tag consumption point | **Satisfied** (by the operator action that cut + pushed annotated `v0.0.1` against `de65d93568e70c53ba952279f41a23d2f7d5123e`) |
| Gate 3 — Hounfour version-skew resolution | **Satisfied** (by Posture 3a; Dixie PR #97 bumped Hounfour to `v8.6.0`) |

All three ADR-024H gates are independently satisfied. The Dixie
PR #99 type-only flip merged after Gate 3 satisfaction is
recorded as the first conforming downstream consumer.

## Explicit non-scope

Phase 24L inherits every non-goal from ADR-024A through ADR-024J
wholesale, and adds these Phase 24L-specific refusals:

1. **No file changes outside the three approved docs.** The
   only files changed by Phase 24L are this ADR
   ([`./ADR-024K-dixie-host-type-consumption-intake.md`](./ADR-024K-dixie-host-type-consumption-intake.md)),
   the companion handoff
   ([`../handoffs/phase-24l-dixie-host-type-consumption-intake.md`](../handoffs/phase-24l-dixie-host-type-consumption-intake.md)),
   and the README index append.
2. **No `package.json` edit.** No `version` field change. No
   script edit. No `private` change. No `exports` / `files` /
   `dependencies` / `devDependencies` / `engines` edit.
3. **No `package-lock.json` edit.** No dependency change.
4. **No `.npmrc` edit.** No `@loa:registry=` mapping added.
5. **No `.gitignore` edit.** `dist-types/` remains committed.
6. **No `tsconfig.json` / `tsconfig.build.json` edit.** Build
   configuration unchanged.
7. **No `vitest.config.ts` edit.**
8. **No source edit.** No file under
   [`../../src/`](../../src/) is touched.
9. **No test edit.** No file under
   [`../../tests/`](../../tests/) is touched. No new test file
   is created. No existing test is modified. The two
   Phase 24H tests
   ([`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts),
   [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts))
   continue to pass against the unchanged package state.
10. **No `dist-types/` edit.** No file under
    [`../../dist-types/`](../../dist-types/) is touched.
11. **No script edit.** No file under
    [`../../scripts/`](../../scripts/) is touched.
12. **No fixture edit.** No file under
    [`../../fixtures/`](../../fixtures/) is touched.
13. **No `package-boundary.md` edit.**
    [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    is read-only for Phase 24L.
14. **No new tag.** No `git tag` (annotated, lightweight, or
    signed). The existing `v0.0.1` tag is read-only for
    Phase 24L. No `v0.0.2` / `v0.1.0` / `v1.0.0` / pre-release
    / build-metadata tag.
15. **No tag push.** No `git push <tag>`. No tag relocation.
    No `git push --force` / `--force-with-lease` against any
    tag.
16. **No GitHub Release.** No `gh release create`. No release
    notes published. The ADR-024J §"Decision" §5 refusal
    remains in force.
17. **No publish.** No `npm publish`. No GitHub Packages
    publish. No npm-registry publish. No alternate-registry
    publish. `"private": true` preserved verbatim.
18. **No Hounfour bump / change.** Straylight's Hounfour pin
    remains `@0xhoneyjar/loa-hounfour@^8.6.0`. No Hounfour
    `main` consumption. No commit-SHA pin. No `#116` corpus
    import. No `0xhoneyjar:straylight:*` adoption. No
    `recall-wedge` adoption.
19. **No sibling-repo edit.** No edit to `loa-dixie`,
    `loa-finn`, `loa-freeside`, or `loa-hounfour`. The Dixie
    PR #97 / #99 events Phase 24L records were Dixie-side
    authored under Dixie-side review; Phase 24L does not
    co-author them.
20. **No additional Dixie consumption.** Phase 24L records the
    type-only flip in Dixie PR #99 as conforming. Phase 24L
    does **not** authorize, pre-authorize, or implement any
    further Dixie-side consumption (no value imports, no
    runtime imports, no endpoint, no route, no middleware, no
    proxy, no rendering, no vector 9 / 10 / 11 widening, no
    Hounfour `#116` adoption, no
    `0xhoneyjar:straylight:*` adoption, no `recall-wedge`
    adoption, no public commitment-root behavior).
21. **No Flatline / Bridgebuilder / red-team request.** Phase
    24L makes no package-surface or source change.
22. **No prior-ADR edit.** ADR-024A through ADR-024J are
    byte-identical to their pre-Phase-24L state.
23. **No prior-handoff edit.** Only the new Phase 24L handoff
    and the README index entry authored alongside this ADR are
    new artifacts; all prior handoffs are byte-identical.
24. **No ADR-022E gate advance.** No Phase 19A pending
    feedback advance on
    [`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70).
    No commitment-root publication. No endpoint. No runtime
    Straylight import into any sibling repo.
25. **No `npm install` / `npm update` / `npm ci` / `npm publish`
    / `npm version` / `npm pack` (as a publish step) /
    package-manager mutation command.** `npm pack --dry-run`
    is allowed in validation (it is read-only).
26. **No GitHub issue / comment / PR action.** No filing, no
    editing, no commenting on any GitHub issue or PR.
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
    smoke is a Dixie-side infra/package-access concern.
    Phase 24L mentions it once (above) and takes no
    remediation action; remediation, if any, is Dixie-side.
29. **No Dixie tripwire-test co-ownership.** The Dixie-side
    `package-contract` tripwire test is owned Dixie-side.
    Phase 24L records its existence and does not co-own,
    duplicate, or migrate it.

## Consequences

- **All three ADR-024H gates are satisfied.** Reviewers of any
  future Dixie-side flip (extension, narrowing, or revert) may
  cite ADR-024H §5 + ADR-024I + ADR-024J + ADR-024K + the
  annotated `v0.0.1` tag + Dixie PR #97 + Dixie PR #99 as the
  current Straylight-side intake record. Phase 24L is the
  Straylight-side anchor.
- **The post-Phase-24H type-only Straylight surface has been
  exercised by a real downstream consumer.** Dixie PR #99 is
  the first such consumer. The Phase 24H supported-consumer
  envelope (TypeScript >= 5.4; `moduleResolution: "Bundler"`
  or `"NodeNext"`; `import type` only) holds against a real
  consumer; the host barrel surface
  ([`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts))
  is in use; the committed
  [`../../dist-types/src/straylight/host/index.d.ts`](../../dist-types/src/straylight/host/index.d.ts)
  is the live type source for that consumer.
- **Dixie's local `host/types.ts` mirror is gone.** Future
  Dixie-side host-type changes flow through the
  `@loa/straylight/host` package surface, not through a Dixie-
  side mirror. This is the post-flip steady state ADR-024G
  §"Consequences" anticipated.
- **Hounfour deduplication holds at `8.6.0`.** No
  duplicate-Hounfour isolation under Posture 3c is in force;
  Posture 3a alignment is the steady-state Gate-3 outcome.
  A future divergence (Dixie reverts to `<8.6.x`, Straylight
  bumps past `8.6.x`) would re-open Gate 3 under a successor
  ADR.
- **Tag immutability is observable.** `v0.0.1` is annotated,
  points at `de65d93568e70c53ba952279f41a23d2f7d5123e`, and is
  reachable at `origin`. Future readers may verify the tag's
  identity and target without consulting this ADR.
- **No package-surface or source change.** The committed
  package surface on `main` after Phase 24L merges is
  byte-identical to its pre-Phase-24L (and pre-Phase-24K-
  opening) state. No Flatline review is warranted.
- **Phase 24L is the Straylight-side downstream-adoption
  anchor.** Future Straylight-side phases that reason about
  downstream consumers may cite Phase 24L as the first such
  intake. Phase 24L does **not** pre-authorize any further
  consumer adoption (Finn, Freeside, additional Dixie
  surfaces) — those each require their own ADR with
  gate-conformance evidence at the time the consumer flip
  PR opens.
- **Runtime widening remains explicitly deferred.** ADR-024G
  §"Decision" §2's "runtime / value imports against
  `@loa/straylight*` are unsupported by design" rule remains
  in force. ADR-024K does not authorize runtime widening on
  either the Straylight side or the Dixie side; future PRs
  that try to cite ADR-024K as runtime authorization are
  refusable on §"Decision" §5.1 grounds verbatim.
- **ADR-024K is additive to ADR-024H / ADR-024I / ADR-024J.**
  It does not supersede any of them; it records the
  successful satisfaction of the gates each enumerated /
  selected / pinned, and the first conforming downstream
  consumption that all three gates collectively authorize.
  Reopening ADR-024H reopens this ADR; reopening ADR-024I
  reopens this ADR; reopening ADR-024J reopens this ADR.

## Source files inspected

- [`./0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020B-recall-wedge-endpoint-host.md`](./ADR-020B-recall-wedge-endpoint-host.md)
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md)
- [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
- [`./ADR-022D-mvp-persistence-and-audit-owner.md`](./ADR-022D-mvp-persistence-and-audit-owner.md)
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md)
- [`./ADR-024B-mvp-host-selection.md`](./ADR-024B-mvp-host-selection.md)
- [`./ADR-024C-package-release-ambiguity.md`](./ADR-024C-package-release-ambiguity.md)
- [`./ADR-024D-phase-24b-implementation-branch.md`](./ADR-024D-phase-24b-implementation-branch.md)
- [`./ADR-024E-dixie-host-mvp-wire-shape.md`](./ADR-024E-dixie-host-mvp-wire-shape.md)
- [`./ADR-024F-host-package-consumption-readiness.md`](./ADR-024F-host-package-consumption-readiness.md)
- [`./ADR-024G-host-package-subpath-implementation.md`](./ADR-024G-host-package-subpath-implementation.md)
- [`./ADR-024H-release-and-dixie-flip-gate-plan.md`](./ADR-024H-release-and-dixie-flip-gate-plan.md)
- [`./ADR-024I-release-posture-selection.md`](./ADR-024I-release-posture-selection.md)
- [`./ADR-024J-release-tag-execution.md`](./ADR-024J-release-tag-execution.md)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (read-only — Phase 24L does not edit it)
- [`../handoffs/phase-24k-release-tag-execution.md`](../handoffs/phase-24k-release-tag-execution.md) (read-only — Phase 24L does not edit it)
- [`../handoffs/phase-24j-release-posture-selection.md`](../handoffs/phase-24j-release-posture-selection.md) (read-only — Phase 24L does not edit it)
- [`../handoffs/phase-24i-release-and-dixie-flip-gate-plan.md`](../handoffs/phase-24i-release-and-dixie-flip-gate-plan.md) (read-only — Phase 24L does not edit it)
- [`../handoffs/phase-24h-host-package-subpath-implementation.md`](../handoffs/phase-24h-host-package-subpath-implementation.md) (read-only — Phase 24L does not edit it)
- [`../../package.json`](../../package.json) (read-only — Phase 24L does not edit it; `version` is `0.0.1`, byte-identical to the `v0.0.1` tag label)
- [`../../package-lock.json`](../../package-lock.json) (read-only — Phase 24L does not edit it)
- [`../../tsconfig.json`](../../tsconfig.json) (read-only — Phase 24L does not edit it)
- [`../../tsconfig.build.json`](../../tsconfig.build.json) (read-only — Phase 24L does not edit it)
- [`../../.npmrc`](../../.npmrc) (read-only — Phase 24L does not edit it; no `@loa` registry mapping exists)
- [`../../.gitignore`](../../.gitignore) (read-only — Phase 24L does not edit it)
- [`../../vitest.config.ts`](../../vitest.config.ts) (read-only — Phase 24L does not edit it)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (read-only — wedge public surface, unchanged by Phase 24L)
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) (read-only — host barrel, unchanged by Phase 24L)
- [`../../dist-types/`](../../dist-types/) (read-only — committed declaration emit, unchanged by Phase 24L)
- [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts) (read-only — pins the artifact-shape invariants the Dixie tripwire test mirrors Dixie-side)
- [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts) (read-only — pins the type-only consumption envelope Dixie PR #99 honors)
- Annotated `v0.0.1` tag (read-only — pointed at `de65d93568e70c53ba952279f41a23d2f7d5123e`; verified at intake via `git cat-file -t v0.0.1` / `git rev-parse v0.0.1^{commit}`)
