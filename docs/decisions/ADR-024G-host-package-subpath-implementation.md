# ADR-024G — Host package subpath implementation (Phase 24H opening)

## Status

Accepted-for-Phase-24H.

This ADR is the **Phase 24H opening decision-lock**. It records the
minimum, declaration-only, type-only implementation of an
`@loa/straylight/host` package subpath sufficient to satisfy the
"declaration-only emission" path described in ADR-024F §"Recommended
future implementation posture" §3, and pins which of the eleven
blockers enumerated in ADR-024F §"Context" Phase 24H resolves and
which it explicitly defers.

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
  ([`./ADR-024F-host-package-consumption-readiness.md`](./ADR-024F-host-package-consumption-readiness.md)).

This ADR is **scoped to a Straylight-side implementation phase** that
edits only [`../../package.json`](../../package.json),
[`../../.gitignore`](../../.gitignore),
[`../../vitest.config.ts`](../../vitest.config.ts), the new build
config [`../../tsconfig.build.json`](../../tsconfig.build.json), and
the documentation surface
([`../mvp/package-boundary.md`](../mvp/package-boundary.md), this
ADR, the Phase 24H handoff, the handoffs README index). It does
**not** edit [`../../tsconfig.json`](../../tsconfig.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../.npmrc`](../../.npmrc), any file under
[`../../src/`](../../src/), any file under
[`../../scripts/`](../../scripts/), or any file under
[`../../fixtures/`](../../fixtures/). It adds two new tests under
[`../../tests/`](../../tests/) but does **not** edit any existing
test. It does **not** edit any sibling repo. It does **not** file or
edit any GitHub issue / comment / PR. It does **not** publish the
package. It does **not** create a release tag. It does **not** bump,
downgrade, or reconcile the Hounfour dependency range. It does
**not** import the Hounfour `#116` five-step conformance corpus. It
does **not** adopt the `0xhoneyjar:straylight:*` audit-event prefix
family or the `recall-wedge` Hounfour conformance category into the
Straylight public surface. It does **not** advance any ADR-022E
gate. It does **not** publish a public commitment root. It does
**not** request or run Flatline / Bridgebuilder / red-team review in
the same commit; a 3-model Flatline pass is expected before merge,
not as part of this ADR's commit.

The Phase 19A pending feedback gate on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains pending and is **not** advanced by Phase 24H.

## Context

ADR-024F enumerated eleven independently-load-bearing facts that
prevented `import type { ... } from '@loa/straylight/host'` from
resolving in any external consumer. Phase 24G locked the policy
frame; Phase 24H executes the minimum-viable subset of that frame:
declaration-only emission, type-only exports map, no runtime widening,
no publish, no release tag, no sibling-repo wiring.

The shape this ADR pins is deliberately narrow:

1. The package surface widens **only** for type-shape consumption.
   No `"default"`, `"import"`, `"require"`, `"node"`, or `"browser"`
   condition appears in the new `exports` map; only `"types"`.
2. The package surface widens **only** for two subpaths: `"."`
   (mirroring the existing wedge stable surface from
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md)) and
   `"./host"` (the local host barrel at
   [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)).
3. The package remains `"private": true`. No publish to any
   registry; no GitHub Packages adoption; no tag created. A future
   sibling-repo dependency flip remains **blocked** on a separate,
   reviewed posture decision (private + tag-pinned git-source
   consumption, or un-private + GitHub Packages publishing) AND on
   a separate Hounfour-skew resolution. Neither decision is
   pre-authorized by this ADR.
4. Declaration output lives under `dist-types/`, which is
   **committed** to the repository as the authoritative Phase 24H
   type-only package artifact for tag/release consumers, and
   excluded from vitest. The directory is reproducible from source
   by `npm run clean:types && npm run build`; treat changes to
   `dist-types/` as generated-artifact diffs caused by source
   or type-surface changes. (Earlier drafts of this ADR
   considered `.gitignore`ing `dist-types/` and relying on
   `prepare` to materialize it at install time; that posture is
   rejected because git-/tag-pinned consumers cannot rely on
   `prepare` running deterministically before TypeScript
   resolves the package, and a missing `dist-types/` would silently
   produce a "no host types found" failure for a downstream
   sibling repo.)
5. `tsconfig.json` is **unchanged**. The declaration emission lives
   in a separate
   [`../../tsconfig.build.json`](../../tsconfig.build.json) that
   extends `tsconfig.json` and overrides `rootDir`, `declaration`,
   `emitDeclarationOnly`, `noEmit`, and `declarationDir`. The
   `rootDir: "."` setting is load-bearing: it pins the declaration
   output to `dist-types/src/straylight/index.d.ts` and
   `dist-types/src/straylight/host/index.d.ts`, matching the
   `package.json` `exports` map. Inferring `rootDir` as `src/`
   would emit under `dist-types/straylight/...`, breaking those
   paths.
6. `package-lock.json` is **unchanged**. No `npm install`, no
   dependency add, no dependency removal. The new `build` and
   `prepare` scripts invoke the existing TypeScript devDependency.
7. The wedge public surface and the host barrel source are both
   **byte-identical** to their pre-Phase-24H state. No re-export of
   the host barrel through
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts);
   the one-way wedge↔host dependency invariant from ADR-024F
   §"Decision" rule §4 is preserved.

The eleven blockers from ADR-024F §"Context", and Phase 24H's
posture on each, are summarized in §"Blocker resolution".

## Decision

1. **Add a type-only `@loa/straylight/host` package subpath.**
   [`../../package.json`](../../package.json) gains an `exports`
   map with exactly two keys: `"."` (the existing wedge stable
   surface) and `"./host"` (the local host barrel). Each entry has
   exactly one condition: `"types"`. No `"default"`, `"import"`,
   `"require"`, `"node"`, or `"browser"` condition appears.

2. **`@loa/straylight/host` is type-only in Phase 24H; runtime /
   value imports are unsupported and expected to fail.** A
   consumer using `import type { ... } from
   '@loa/straylight/host'` resolves the `.d.ts` under `"types"`.
   A consumer attempting `import { handleRecallIntake } from
   '@loa/straylight/host'` (value import), `await
   import('@loa/straylight/host')` (dynamic runtime import), or
   `require('@loa/straylight/host')` (CommonJS) does **not**
   resolve — and that failure is the intended, documented
   posture, not a defect. Consumers MUST use `import type`. The
   package's runtime surface is intentionally narrower than its
   type surface in Phase 24H. This is the load-bearing distinction
   between Phase 24H and any future runtime-widening phase. ADR-024F
   §"Recommended future implementation posture" §4 requires a
   separate, larger widening-review for JS emission; runtime
   support is a future, separate widening and is **not**
   pre-authorized by this ADR. The Phase 24H package-exports test
   ([`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts))
   asserts that no runtime / value-import condition (`default`,
   `import`, `require`, `node`, `browser`, `deno`, `bun`,
   `worker`, `react-native`, `electron`, `production`,
   `development`, `module`, `main`, `node-addons`) appears under
   any `exports` entry — adding one is a Phase 24H violation.

3. **No TypeScript source fallback under `exports`.** Earlier
   drafts considered a `"default"` (or `"import"`) condition
   pointing at `src/straylight/host/index.ts` for in-repo testing.
   That fallback is rejected for Phase 24H: it would (a) widen the
   runtime surface; (b) leak TS source into the package's
   advertised consumption path; and (c) couple consumers to the
   in-repo working-tree layout rather than the declaration output.
   In-repo tests that need to exercise the type-only consumption
   path build declarations first and consume them through a
   temp-fixture symlink, never via a source-only fallback.

4. **Declaration-only build to `dist-types/`. All five emit
   settings below are load-bearing — changing any one of them
   silently breaks the package's exports paths or the
   declaration-only posture.** A new
   [`../../tsconfig.build.json`](../../tsconfig.build.json) extends
   `tsconfig.json` and overrides:

   - `rootDir: "."` — **load-bearing.** Pins the emit path to
     `dist-types/src/straylight/...` so it matches the
     `package.json` `exports[*].types` paths. Without this
     override TypeScript infers `rootDir` as `src/` and emits
     under `dist-types/straylight/...`, breaking the package's
     advertised type-resolution paths.
   - `declaration: true` — **load-bearing.** Without it tsc
     produces no `.d.ts` output and the `exports.types` paths
     point at nonexistent files.
   - `emitDeclarationOnly: true` — **load-bearing.** Without it
     tsc would also emit JS, populating a runtime surface that
     Phase 24H explicitly does not authorize.
   - `noEmit: false` — **load-bearing.** Overrides the project
     tsconfig's `noEmit: true`; without it tsc emits nothing
     regardless of the `declaration` flag.
   - `declarationDir: "dist-types"` — **load-bearing.** Pins the
     output directory referenced by `package.json` `files`, by
     `.gitignore`, by `vitest.config.ts` excludes, and by the
     `clean:types` script.

   It restricts `include` to exactly `["src/**/*.ts"]` —
   **load-bearing** for keeping tests / scripts / fixtures out of
   the declaration emit — and excludes `node_modules`, `.loa`,
   `.loa-state`, `tests`, `scripts`, `fixtures`, and `dist-types`.
   The build is invoked via `npm run build`, which first runs
   `npm run clean:types` (a cross-platform Node `fs.rmSync`
   command) to remove stale declarations before invoking tsc;
   this prevents stale-output false-confidence (IMP-008). The
   committed `dist-types/` directory is the **authoritative**
   tag/release artifact: a git-/tag-pinned consumer in a sibling
   repo resolves `@loa/straylight/host` against the committed
   `.d.ts` files without depending on `prepare` running at
   install time. The `prepare` script is kept as a development
   convenience so a fresh in-repo `npm install` regenerates
   declarations from source, but it is **not** the authoritative
   path — the committed artifact is. Future PRs MUST treat
   changes under `dist-types/` as generated-artifact diffs caused
   by source/type-surface changes; a `dist-types/` diff with no
   matching source diff is a non-conforming change.

5. **`"private": true` stays.** Phase 24H does not publish the
   package, does not create a release tag, does not adopt GitHub
   Packages, and does not change the `"version"` field. The
   private-vs-published posture choice from ADR-024F
   §"Recommended future implementation posture" §6 remains
   **deferred**.

6. **No actual sibling-repo dependency flip.** Phase 24H is a
   Straylight-side change only. `loa-dixie` continues to consume
   the local adapter mirrors landed in Dixie PR #96; a Dixie-side
   dependency flip remains blocked on (a) a Straylight release tag
   under the future `"private" + tag-pin` or
   `"un-private" + GitHub Packages` posture decision, and (b) a
   Hounfour-skew resolution.

7. **Hounfour skew is NOT resolved by Phase 24H, and is a HARD
   GATE on any Dixie dependency flip.** The
   `@0xhoneyjar/loa-hounfour@^8.6.0` floor in
   [`../../package.json`](../../package.json) is unchanged.
   `package-lock.json` is unchanged. None of the three ADR-024F
   §"Hounfour version-skew stance" §4 postures (Dixie bumps;
   Straylight raises floor under ADR-024C discipline; both sides
   hold under explicit duplicate-Hounfour isolation) is selected
   by this ADR. The next phase in this lineage **must** be either
   (a) a Hounfour-skew resolution phase that explicitly selects
   one of the three postures, or (b) the opening doc of any later
   phase that touches `@loa/straylight/host` consumption **must**
   explicitly select one of the three postures before any
   sibling-repo dependency flip lands. No Dixie dependency flip
   may proceed on the grounds that `@loa/straylight/host` is now
   type-consumable. Type-consumability and Hounfour-skew
   resolution are independent gates; satisfying one does not
   satisfy the other.

8. **Package-boundary documentation widens additively.** The
   existing [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
   sections 1–11 (the wedge stable surface) are preserved
   verbatim. A new section documents the `./host` subpath as a
   type-only stable public API: six handler exports, helper / type
   exports, the injected-dependency contract, the type-only
   package surface, the absence of a runtime import path in
   Phase 24H, the absence of a TypeScript source fallback, and the
   one-way wedge↔host dependency invariant.

9. **One-way wedge↔host dependency invariant is enforced — now,
   automated.** The host scaffold may import wedge primitives;
   the wedge public API must not import the host scaffold. This
   is enforced by an existing automated test
   ([`../../tests/phase-24c-host-surface-shape.test.ts`](../../tests/phase-24c-host-surface-shape.test.ts),
   describe block `phase-24c host — wedge does not depend on
   host`), which asserts that
   [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
   does not import from `./host/`, and that every existing wedge
   module source file under
   [`../../src/straylight/`](../../src/straylight/) does not
   import from `./host/`. The Phase 24H package-exports test
   ([`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts))
   records this delegation so a future test-file move is forced
   to update the wording here. A stronger import-graph tool
   (e.g. dependency-cruiser, madge) may be added in a future
   phase, but is **not** required for Phase 24H; the invariant is
   load-bearing for the package boundary and is **automated as of
   Phase 24H**, not deferred.

10. **Tag-/release-pinned consumption only.** When a sibling-repo
    dependency flip eventually happens, it must consume Straylight
    via a tag-pinned git source or a published release range. A
    sibling repo pointing at `loa-straylight` via a commit-SHA pin
    against an unpublished tree, a `main`-HEAD git dependency, or
    a workspace-path link to a developer's local clone is **not**
    authorized by this ADR. Phase 24H produces the declaration
    output and the exports map; the tag / release event is a
    separate, later, reviewed change.

## Supported consumer assumptions (Phase 24H)

The Phase 24H type-only consumption contract is **narrow on purpose**. A
consumer outside the supported envelope below may see resolution failures
or type errors that Phase 24H makes no promise to fix. A consumer using
an unsupported resolver mode or attempting a runtime/value import will
see resolution failures; **those failures are the intended Phase 24H
posture, not defects**.

1. **TypeScript >= 5.4 is REQUIRED.** The package's
   `devDependencies` pin `typescript ^5.4.0`; the in-repo Phase 24H
   consumption test exercises that range. Older TypeScript versions
   are **unsupported** in Phase 24H; the package makes no promise
   that `exports.types` resolution will work under TypeScript
   versions that pre-date `moduleResolution: "Bundler"` (TS 5.0)
   or that pre-date the `types`-condition resolution rules used
   by `moduleResolution: "NodeNext"` (TS 4.7+; the >=5.4 floor is
   the *tested* floor, not just the *theoretical* floor). The
   [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
   `Phase 24H — supported-consumer assumptions (SKP-001)` block
   asserts the version range stays at-or-above 5.4.
2. **Supported `moduleResolution` modes are exactly `"Bundler"`
   and `"NodeNext"`.** These are the two modes the in-repo
   end-to-end consumption test exercises (under TypeScript >= 5.4).
   Older / default / non-export-aware resolver modes — including
   `"node"`, `"classic"`, `"node10"`, and `"node16"` — are
   **unsupported** for the `./host` subpath; a consumer using one
   of those modes will fail to resolve `@loa/straylight/host`
   because the legacy node resolver does not honor the package's
   `exports` map. The
   [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
   `Phase 24H — unsupported resolver mode does not resolve
   ./host (SKP-001)` block pins this failure mode under
   `moduleResolution: "node"` so a future widening that
   accidentally adds legacy-resolver support has to update both
   the test and this section.
3. **`import type` only is REQUIRED; runtime/value imports are
   UNSUPPORTED and expected to fail.** Value imports of any
   symbol from `@loa/straylight` or `@loa/straylight/host` are
   **unsupported** in Phase 24H. A consumer attempting any of:
     - `import { handleRecallIntake } from '@loa/straylight/host'`
       (value import),
     - `await import('@loa/straylight/host')` (dynamic ESM
       runtime import),
     - `require('@loa/straylight/host')` (CommonJS), or
     - the same three patterns against the root subpath
       `@loa/straylight`,

   will fail to resolve with `ERR_PACKAGE_PATH_NOT_EXPORTED`
   (Node's exports-map enforcement). See Decision rule §2. The
   [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
   `Phase 24H — runtime/value imports are unsupported by design
   (SKP-001)` block pins this failure mode for both the
   `./host` subpath and the root subpath, under both dynamic ESM
   `import()` and CJS `require`, without requiring `npm install`
   or network access.
4. **Tag- / release-pinned git source.** The consumption surface
   assumes the consumer installs Straylight via a tag-pinned git
   source (or a future GitHub Packages release range). Workspace
   links, `main`-HEAD git dependencies, and commit-SHA pins
   against unpublished trees are **unsupported**. See Decision
   rule §10. Because `dist-types/` is now committed (Decision
   rule §4), a tag-pinned consumer resolves declarations
   directly from the tagged tree without depending on `prepare`.

A future phase that needs to widen any of these four assumptions
must do so under its own ADR — the assumptions are part of the
Phase 24H contract.

## Blocker resolution

The eleven blockers from ADR-024F §"Context", numbered as there:

| # | ADR-024F blocker | Phase 24H posture |
|---|---|---|
| 1 | `"private": true`, not published | **Deferred.** Stays private; no publish; no GitHub Packages adoption. |
| 2 | No `exports` map | **Resolved.** Type-only `exports` map added with `"."` and `"./host"`. |
| 3 | No `./host` subpath | **Resolved.** `"./host"` added under `exports`, pointing at the emitted `.d.ts`. |
| 4 | `main` points at TS source | **Resolved.** `"main"` removed; `"types"` field added; no runtime entrypoint in Phase 24H. |
| 5 | No `types` / `typings` field | **Resolved.** `"types": "./dist-types/src/straylight/index.d.ts"` added. |
| 6 | `declaration: false`, `noEmit: true` | **Resolved (additively).** `tsconfig.json` unchanged; new `tsconfig.build.json` overrides for declaration-only emit. |
| 7 | No `build` script | **Resolved.** `"build": "tsc -p tsconfig.build.json"` added, wired via `"prepare"`. |
| 8 | No `dist/` directory | **Resolved.** `dist-types/` produced by `npm run build` **and committed** as the authoritative Phase 24H type-only package artifact for tag/release consumers; reproducible from source via `clean:types && build`. No `dist/` (runtime JS) is added. |
| 9 | No release tag | **Deferred.** No tag created by Phase 24H; sibling-repo consumption discipline remains blocked. |
| 10 | `package-boundary.md` does not name the host barrel | **Resolved.** Additive section added; wedge sections 1–11 preserved. |
| 11 | Hounfour version skew | **Deferred.** `^8.6.0` floor unchanged; `package-lock.json` unchanged; skew-resolution posture not selected. |

Six blockers (2, 3, 4, 5, 6, 7, 8, 10) are **resolved** by
Phase 24H. Three blockers (1, 9, 11) are **explicitly deferred**.
The deferred blockers are the load-bearing reasons a sibling-repo
dependency flip remains out of scope.

## Non-goals (Phase 24H)

Phase 24H inherits every non-goal from ADR-024A / ADR-024B /
ADR-024C / ADR-024D / ADR-024E / ADR-024F wholesale, and adds
these Phase 24H-specific refusals:

1. **No JS / runtime emission.** No `dist/` (the runtime
   convention); only `dist-types/`. No `"default"` / `"import"` /
   `"require"` / `"node"` / `"browser"` condition under
   `exports`. No `engines.node` change.
2. **No TypeScript source fallback under `exports`.** Earlier
   drafts considered a `"default"` condition pointing at
   `src/straylight/host/index.ts`; rejected as a runtime widening
   and as TS-source-leak into the consumption path.
3. **No publish.** No `npm publish`. No GitHub Packages adoption.
   `"private": true` is preserved. `npm pack --dry-run` is a
   validation-only invocation; no tarball is published.
4. **No release tag.** No `git tag`, no GitHub Release. A future
   sibling-repo dependency flip remains blocked on a separately
   reviewed tag / release event.
5. **No commit-SHA / `main` / git-HEAD consumption posture.** A
   sibling-repo dependency on `loa-straylight` via a commit-SHA
   pin against an unpublished tree, a `main`-HEAD git dependency,
   or a workspace-path link to a developer's local clone is
   non-conforming. Phase 24H does not authorize it.
6. **No actual Dixie dependency flip.** No edit to any sibling
   repo. No `loa-dixie` `package.json` change. Dixie PR #96
   remains the correct transitional seam.
7. **Hounfour skew remains unresolved.** No `^8.6.0` bump. No
   `package-lock.json` change. None of the ADR-024F §"Hounfour
   version-skew stance" §4 postures selected.
8. **No Hounfour `#116` corpus import.** No five-step
   conformance corpus adopted. No `0xhoneyjar:straylight:*`
   audit-event prefix family adopted. No `recall-wedge` Hounfour
   conformance category adopted.
9. **No vector 9 / 10 / 11 widening.** Phase 24B vectors 1–8
   remain the host-inspection test slice.
10. **No endpoint.** No HTTP / NATS / RPC / BFF / Discord /
    Telegram / GraphQL surface added to `loa-straylight`.
11. **No public commitment-root behavior.** ADR-020E unchanged.
12. **No source edits.** No file under
    [`../../src/`](../../src/) is touched. The wedge public
    surface ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
    and the host barrel
    ([`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts))
    are byte-identical to their pre-Phase-24H state.
13. **No `tsconfig.json` edit.** The existing project tsconfig
    stays at `noEmit: true`, `declaration: false`. The new
    declaration-emit lives entirely in a sibling
    [`../../tsconfig.build.json`](../../tsconfig.build.json) that
    extends it.
14. **No `package-lock.json` edit.** No dependency add. No
    `npm install` / `npm update` / `npm ci` run that would touch
    the lock file.
15. **No `.npmrc` edit.** Registry configuration unchanged.
16. **No script edits.** No file under
    [`../../scripts/`](../../scripts/) is touched. The Phase 24H
    `build` and `prepare` scripts are `package.json` script
    entries, not new files under `scripts/`.
17. **No existing-test edits.** No file under
    [`../../tests/`](../../tests/) is touched **except** for the
    two new Phase 24H test files. The existing 30+ test files
    are byte-identical to their pre-Phase-24H state.
18. **No prior-ADR or prior-handoff edits.** No edit to any file
    under [`./`](./) other than this new ADR. No edit to any
    file under [`../handoffs/`](../handoffs/) other than the new
    Phase 24H handoff and the README index entry authored
    alongside it.
19. **No Flatline / Bridgebuilder / red-team in the same
    commit.** A 3-model Flatline pass is expected **before
    merge** because Phase 24H widens the public package surface;
    it is not part of this ADR's commit.

## Future Phase 24I+ entry conditions

A follow-up phase (referred to as "Phase 24I or later") may open
**only if** every condition below is satisfied. Phase 24H does
**not** open that branch.

1. **ADR-024G merged.** This ADR is on `main` under teammate
   review.
2. **Phase 24H handoff merged.** The Phase 24H summary handoff
   at
   [`../handoffs/phase-24h-host-package-subpath-implementation.md`](../handoffs/phase-24h-host-package-subpath-implementation.md)
   is on `main` under teammate review.
3. **3-model Flatline pass on Phase 24H.** Because Phase 24H
   widens the public package surface, a 3-model Flatline review
   must be on file before any follow-up phase opens.
4. **Scope explicitly approved.** The follow-up phase opens with
   a docs / opening-doc commit that enumerates which of the
   three deferred blockers (1: publish posture; 9: release tag;
   11: Hounfour skew) it resolves and which it explicitly defers,
   reviewed before any `package.json` / build / source edit
   lands.
5. **No sibling-repo wiring in the same PR.** A Dixie-side
   dependency flip, if it eventually happens, is a separate
   Dixie-side PR under separate Dixie-side review — never folded
   into a Straylight-side change.

## Consequences

- **`@loa/straylight/host` is now consumable for type-only
  imports.** A consumer with a tag-pinned git-source install
  (when such a tag eventually exists) can write
  `import type { ... } from '@loa/straylight/host'` and resolve
  the emitted `.d.ts` through the `exports` map.
- **Runtime consumption remains blocked.** A consumer attempting
  `await import('@loa/straylight/host')` at runtime does not
  resolve. Phase 24H does not advertise a runtime surface.
- **Dixie PR #96 local mirrors remain transitional.** Phase 24H
  does not flip Dixie's dependency. The mirrors stay correct as
  the pre-consumption seam, subject to the upstream-side
  discussion discipline from ADR-024F §"Decision" rule §3.
- **No sibling-repo work unblocked yet.** A Dixie dependency
  flip remains blocked on (a) a Straylight release tag under the
  deferred publish-posture decision (Blocker 1 and Blocker 9)
  and (b) the Hounfour-skew resolution (Blocker 11).
- **`tsconfig.json` is preserved as the IDE / `tsc --noEmit`
  config.** Editor / typecheck behavior is byte-identical to the
  pre-Phase-24H state. Declaration emission is opt-in via
  `npm run build`.
- **`dist-types/` is committed AND reproducible.** The directory
  is the authoritative Phase 24H type-only package artifact for
  git-/tag-pinned consumers. It is committed to the repo; `npm run
  clean:types && npm run build` rebuilds it deterministically from
  source. `prepare` is kept as a development convenience that
  regenerates declarations on a fresh `npm install`, but it is not
  the authoritative path — the committed artifact is. Future PRs
  treat `dist-types/` diffs as generated-artifact diffs caused by
  source / type-surface changes; a `dist-types/` diff with no
  matching source diff is non-conforming.
- **The committed `dist-types/` includes internal type-supporting
  declarations.** The emit follows `src/**/*.ts` and ships
  declaration files for every module that contributes to the
  public `.d.ts` types (e.g. `dist-types/src/straylight/recall.d.ts`,
  `dist-types/src/straylight/storage/jsonl.d.ts`). These internal
  declarations are emitted **only as type-supporting implementation
  declarations** for the two named public entry points
  (`@loa/straylight` and `@loa/straylight/host`); they are **not**
  stable import subpaths and the package's `exports` map does not
  expose them. Consumers MUST resolve through the named subpaths
  only, per [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  §"Stable public API — `./host` subpath (Phase 24H, type-only)".
- **ADR-024G is additive to ADR-024F.** It does not supersede
  ADR-024F; it executes the declaration-only subset of
  ADR-024F's recommended posture. Reopening ADR-024F reopens
  this one.

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
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../handoffs/phase-24g-host-package-consumption-readiness-plan.md`](../handoffs/phase-24g-host-package-consumption-readiness-plan.md)
- [`../handoffs/phase-24f-dixie-host-issue-draft.md`](../handoffs/phase-24f-dixie-host-issue-draft.md)
- [`../handoffs/phase-24e-dixie-host-handoff-packet.md`](../handoffs/phase-24e-dixie-host-handoff-packet.md)
- [`../handoffs/phase-24d-host-scaffold-hardening.md`](../handoffs/phase-24d-host-scaffold-hardening.md)
- [`../handoffs/phase-24c-dixie-recall-host-scaffold.md`](../handoffs/phase-24c-dixie-recall-host-scaffold.md)
- [`../handoffs/phase-24b-dixie-recall-host-plan.md`](../handoffs/phase-24b-dixie-recall-host-plan.md)
- [`../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md`](../handoffs/phase-24a-hounfour-116-intake-and-host-decision.md)
- [`../../package.json`](../../package.json) (edited by Phase 24H: `main` removed, `types` added, `exports` added, `files` added, `build` + `prepare` scripts added; `private`, Hounfour `^8.6.0`, all other scripts preserved)
- [`../../tsconfig.json`](../../tsconfig.json) (read-only — Phase 24H does not touch the project tsconfig)
- [`../../tsconfig.build.json`](../../tsconfig.build.json) (new — extends tsconfig.json; declaration-only emit)
- [`../../.gitignore`](../../.gitignore) (edited by Phase 24H: `dist-types/` is NOT ignored — it is committed as the authoritative Phase 24H type-only package artifact; an explanatory comment records the rationale)
- [`../../dist-types/`](../../dist-types/) (new — committed declaration emit; reproducible from source via `npm run clean:types && npm run build`; authoritative artifact for tag/release consumers)
- [`../../vitest.config.ts`](../../vitest.config.ts) (edited by Phase 24H: `dist-types/**` added to excludes)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (read-only — wedge public surface, unchanged by Phase 24H)
- [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts) (read-only — host barrel, unchanged by Phase 24H; intentionally not re-exported through the wedge public API per ADR-024E)
