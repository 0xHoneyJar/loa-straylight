# Phase 28E — Track 1 code-candidate scope

> **Status:** Operator-oriented planning handoff. **Docs-only.**
> Phase 28E pins the next implementation PR's exact name,
> allowed scope, forbidden scope, access-path acceptance
> criteria, and §4.d posture. Phase 28E **does not authorize**
> any Straylight code change, any `package.json` /
> `package-lock.json` edit, any `npm install`, any vendoring,
> any sibling-repo edit, any ADR-022E gate firing, or any
> tag / release / publish on the Straylight side. Phase 28E
> authorizes the **drafting and preparation** of a separate
> future Phase 29A implementation PR scope; it does **not**
> authorize Phase 29A to merge without its own §4.d evidence.
> Canonical record:
> [`../decisions/ADR-027B-Track1-code-candidate-scope.md`](../decisions/ADR-027B-Track1-code-candidate-scope.md).

## TL;DR (≤ 1 minute)

- Phase 28D met the release / vector-access precondition.
  `@0xhoneyjar/loa-hounfour@8.7.0` is published, tagged,
  registry-resolvable, and ships the recall-wedge
  composition-substrate corpus
  (tarball SHA-256 `8c116f205e1ae1771c89b5c455cd0dd3a5c62160962bb3c8e9a4ae6bb50d22f7`).
- Phase 28E pins the **next implementation PR**:
  **Phase 29A — Hounfour v8.7.0 vector-access Track 1
  implementation**.
- Phase 29A is **Track 1 only**, **registry-resolution only**,
  **package-sourced only**, **no vendoring**, **smallest
  possible diff**.
- Phase 29A independently inherits its own §4.d real 3-model
  Flatline + Bridgebuilder gate. Phase 28E does **not**
  pre-satisfy §4.d.
- ADR-022E gates #1, #2, #3, #4, #5, #17, #18 all remain
  **HELD**. The class-vs-policy boundary is preserved.
- Phase 28E **does not** itself implement code, **does not**
  authorize Phase 29A to merge, **does not** edit
  `package.json` / `package-lock.json`, **does not** run
  `npm install`, and **does not** edit any sibling repo.

## What Phase 28E records

### 1. Phase 29A — name, posture

The next implementation PR authorized as a **drafting target**
by Phase 28E is:

> **Phase 29A — Hounfour v8.7.0 vector-access Track 1
> implementation**

Phase 29A is:

- **Code-bearing.** A source / test PR, not a docs-only
  successor.
- **Track 1 only.** Conformance-vector consumption as Vitest
  test inputs and/or `0xhoneyjar:straylight:` soft-audit-prefix
  consumption as a string constant (per
  [`../decisions/ADR-027B-PrivateAlias-successor-plan.md`](../decisions/ADR-027B-PrivateAlias-successor-plan.md)
  §"Decision" §3).
- **Registry-resolution only.** Against
  `https://npm.pkg.github.com`. No
  `loa-hounfour`-`origin/main`, no local-tarball / `file:`,
  no `git+https://`-style, no vendoring, no sibling-repo
  working-tree read.
- **Composition-substrate-only.** No Hounfour shape adoption.
  ADR-022E gates remain HELD.
- **Subject to its own §4.d.** Phase 29A inherits
  [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
  §"Decision" §3 / §5 on its own; Phase 28E does not
  pre-satisfy it.

### 2. Phase 29A — allowed scope

Per
[`../decisions/ADR-027B-Track1-code-candidate-scope.md`](../decisions/ADR-027B-Track1-code-candidate-scope.md)
§"Decision" §3:

| # | Item |
|---|---|
| 2.a | Pin / update the existing `@0xhoneyjar/loa-hounfour` declaration to **exactly `8.7.0`**, **or** confirm a no-manifest-delta posture only if `package.json` and `package-lock.json` already resolve exactly `8.7.0` at Phase 29A implementation time. **No range widening.** Cite the registry-resolved tarball hash at the install/pin step. |
| 2.b | Add a narrow Straylight-side package-access probe that reads Hounfour's package-shipped recall-wedge vector files **from the installed `@0xhoneyjar/loa-hounfour` package**. |
| 2.c | Add a narrow Vitest test proving the installed package exposes the seven required recall-wedge composition-substrate paths (five vectors + recall-wedge `README.md` + `schemas/conformance-vector.schema.json` envelope) through an implementation-approved access path. |
| 2.d | Optionally add a tiny internal/private helper only if necessary for test/readability. **Must not** become a public runtime API; **must not** expand `package.json` `exports`; **must not** introduce a new public type re-export. |
| 2.e | Keep all Hounfour data **package-sourced**. Do not copy vector JSON, the recall-wedge `README.md`, or the envelope schema into the Straylight tree. |
| 2.f | Keep the implementation to the **smallest possible code/test diff**. |

### 3. Phase 29A — forbidden scope

Per
[`../decisions/ADR-027B-Track1-code-candidate-scope.md`](../decisions/ADR-027B-Track1-code-candidate-scope.md)
§"Decision" §4:

- No vendoring of Hounfour vector JSON, recall-wedge `README.md`,
  envelope schema, or recall-wedge architecture doc.
- No local tarball dependency.
- No `git+https://`-style dependency.
- No `origin/main` / branch / commit dependency.
- No Hounfour sibling-repo file reads.
- No generated `dist/` / `dist-types/` change unless the
  Phase 29A PR's own accepted scope separately authorizes one.
- No Straylight runtime recall behavior change.
- No signature verification.
- No signer competence enforcement.
- No policy execution.
- No storage adapter.
- No audit-chain enforcement.
- No Dixie integration (no `loa-dixie` PR #102 re-open, no
  second Dixie endpoint, no second runtime subpath).
- No Finn integration (gate #9 remains held; Finn governed by
  [`../decisions/ADR-027C-finn-return-gate-readiness.md`](../decisions/ADR-027C-finn-return-gate-readiness.md)).
- No runtime allowlist changes.
- No public package export changes.
- No ADR-022E gate firing (#1, #2, #3, #4, #5, #17, #18
  remain HELD).
- No Phase 28E implementation (Phase 28E is docs-only).
- No new tests beyond the corpus-availability proof.
- No new fixtures beyond, at most, a single private pointer /
  manifest under `fixtures/hounfour-conformance/` that records
  the Hounfour-side path of each consumed vector inside the
  resolved `@0xhoneyjar/loa-hounfour` package (no vendored
  vector contents).
- No tag, release, or publish on the Straylight side.

### 4. Access-path discipline — Phase 29A acceptance criteria

Phase 28E does **not** pretend the exact file-access
mechanism has already been proven inside Straylight. The
Phase 29A implementation PR must prove, against its own
review, that:

- **4.a** It resolves the installed `@0xhoneyjar/loa-hounfour`
  package root or a supported asset path declared by the
  package itself.
- **4.b** It **fails closed** if any required path is missing
  or unreadable. No silent fallback.
- **4.c** It does **not** rely on a sibling-repo working-tree
  layout.
- **4.d** It does **not** rely on unpublished package state
  (no `origin/main`, no untagged commit, no pre-release
  artifact).
- **4.e** It does **not** bypass package-manager resolution
  (no hardcoded `node_modules/...` reads that bypass
  `npm`/`yarn`/`pnpm` resolution semantics).
- **4.f** It cites, for each consumed vector, the
  Hounfour-side on-disk path inside the resolved package, the
  registry tag (`8.7.0`), and the registry-resolved tarball
  hash observed at Phase 29A's install/pin step.

#### Suggested Phase 29A acceptance checks (non-binding template)

- `npm install` / `npm ci` resolves
  `@0xhoneyjar/loa-hounfour@8.7.0` from
  `https://npm.pkg.github.com`.
- `package-lock.json` records `8.7.0`.
- Tests prove all seven required recall-wedge vector paths
  are accessible from the installed package.
- Tests prove `package/schemas/conformance-vector.schema.json`
  is accessible from the installed package.
- Tests do not import Straylight runtime recall behavior.
- `git status` shows no vendored vector payloads.
- `git status --short -- dist dist-types` returns no entries
  (no `dist/` / `dist-types/` change unless the
  implementation PR's own accepted scope separately
  authorizes one).
- Real 3-model Flatline + Bridgebuilder evidence is run
  against the Phase 29A scope/PR before merge — that run is
  the Phase 29A §4.d audit input.

### 5. Class-vs-policy boundary preservation

**Hounfour provides** class / schema / conformance-vector
artifacts (the recall-wedge conformance-vector corpus, the
recall-wedge `README.md`, and the
`schemas/conformance-vector.schema.json` envelope).

**Straylight still owns** policy validation, signer
competence, signature verification, audit-chain execution
(including the soft-audit-prefix policy on
`0xhoneyjar:straylight:`), estate transitions, recall
runtime, authorization, and runtime refusal behavior.

Phase 29A's consumption of the recall-wedge corpus as Vitest
test inputs **does not** transfer any policy / competence /
verification / execution / authorization primitive across
the Hounfour → Straylight boundary. The recall-wedge
conformance vectors are **test inputs**, not production
fixtures, not signed artifacts, not hash-verified at install
time, and not runtime authorities.

### 6. ADR-022E gates

| Gate | Trigger (verbatim spirit) | Phase 29A posture | Disposition |
|---|---|---|---|
| #1 | Canonical `estate-transition.schema.json` + adopting ADR | Not adopted; not authored | **HELD** |
| #2 | Local `EstateTransition` type / schema / fixture | Not authorized | **HELD** |
| #3 | New JS subpath (`./canonicalize` / `./utilities`) | Not consumed | **HELD** |
| #4 | `Challenge` adopted into wedge public surface | Not authorized | **HELD** |
| #5 | `AuditEvent` adopted from Hounfour candidate | Not authorized | **HELD** |
| #17 | New Hounfour subpath consumption with separate ADR | Existing `@0xhoneyjar/loa-hounfour/core` posture only; an exact-tag pin to `8.7.0` is **not** a new subpath authorization | **HELD** |
| #18 | Hounfour-named symbol on wedge public surface | Not authorized | **HELD** |

Phase 28E fires no gates. Phase 29A — under the §"Decision"
§3–§5 scope — fires no gates. The class-vs-policy boundary
is preserved across the Phase 28E → Phase 29A boundary.

### 7. §4.d posture

Phase 29A independently inherits §4.d under
[`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
§"Decision" §3 / §5.

- Phase 28E does **not** satisfy §4.d for Phase 29A, does
  **not** waive §4.d, and does **not** weaken §4.d.
- Phase 29A's §4.d is **independently unsatisfied** until a
  real 3-model Flatline + Bridgebuilder run is executed
  against the Phase 29A scope/PR.
- Local review-substrate smoke-test results recorded by
  [`../decisions/ADR-027B-VectorAccess-release-unblocked.md`](../decisions/ADR-027B-VectorAccess-release-unblocked.md)
  §"Decision" §3 (3-model Flatline live smoke passed;
  Bridgebuilder 3-provider dry-run wiring passed) are
  **not** §4.d evidence for Phase 29A. They establish that
  the machinery is **usable** — a necessary precondition for
  Phase 29A's §4.d run, not the run itself.
- Phase 28E does **not** claim that the local review
  substrate is currently degraded.
- A second-class evidence record (e.g., Phase 28D) cannot
  substitute for Phase 29A's first-class §4.d evidence.

## What Phase 28E explicitly does **not** authorize

Reviewers may cite this section verbatim to refuse an
in-repo or sibling-repo PR that exceeds the Phase 28E
scope:

- **Not** Phase 29A code (no test, no fixture, no source,
  no package edit, no script, no generated tree, no public
  surface, no runtime allowlist edit).
- **Not** vendoring of any Hounfour artifact (vectors,
  envelope schema, architecture doc) into the Straylight
  tree.
- **Not** any `loa-hounfour`-`origin/main` resolution path,
  local-tarball / `file:` resolution, `git+https://`-style
  Hounfour resolution, or any non-registry resolution.
- **Not** a manifest edit.
  [`../../package.json`](../../package.json) and
  [`../../package-lock.json`](../../package-lock.json) are
  **unchanged** by Phase 28E. The dependency-posture change
  (if any) is part of the **Phase 29A implementation PR**,
  with its own §4.d gate.
- **Not** any ADR-022E gate firing. #1, #2, #3, #4, #5, #17,
  #18 all remain HELD.
- **Not** Hounfour shape adoption beyond composition /
  vector-access evidence.
- **Not** §4.d satisfaction for Phase 29A or for any other
  future first-class proposal.
- **Not** Track 2 (soft-audit-prefix-only) consumption,
  **not** Track 3 (private-alias *shape* adoption), **not**
  Finn runtime adoption, **not** Freeside wiring, **not**
  production storage migration, **not** signature
  verification, **not** policy execution, **not** audit-chain
  enforcement, **not** a storage adapter, **not** recall
  execution change.
- **Not** a re-open of `loa-dixie` PR #102, **not** a second
  Dixie endpoint, **not** a second runtime subpath, **not** a
  new public type re-export, **not** an edit to
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  or [`../mvp/threat-model.md`](../mvp/threat-model.md).
- **Not** an `npm install` / `npm update` / `npm pack` /
  `npm publish` / `npm test` / `npm run typecheck` /
  `npm run build` run.
- **Not** a sibling-repo edit. No `loa-hounfour`,
  `loa-finn`, `loa-dixie`, `loa-freeside`, `loa`, or
  `freeside-characters` file is edited.
- **Not** a Phase 29A merger without Phase 29A's own §4.d
  evidence. Phase 28E authorizes drafting / preparing the
  Phase 29A scope; it does not authorize Phase 29A to merge.

## What Phase 28E **may** authorize

Phase 28E authorizes, as the **drafting target** of a
separate future event under its own first-class §4.d gate,
the **preparation of the Phase 29A implementation PR
scope** — i.e., the activity of authoring the Phase 29A code
diff under the §"Decision" §2 / §3 (allowed) and §"Decision"
§4 (forbidden) bounds, against §"Decision" §6 (access-path
acceptance criteria) and §"Decision" §7 (class-vs-policy
boundary preservation).

Phase 28E does **not** authorize Phase 29A to **merge**.
Phase 29A's merger requires:

1. The Phase 29A implementation PR satisfying its own
   §"Decision" §3 / §4 / §6 / §7 scope under reviewer
   inspection;
2. A real 3-model Flatline + Bridgebuilder run against the
   Phase 29A scope/PR — that run is the Phase 29A §4.d
   audit input.

## Operator's next steps

This section is **advisory**. None of these steps is
performed by Phase 28E itself, and none is authorized by
Phase 28E.

1. **Decide whether to begin drafting the Phase 29A
   implementation PR scope now.** Phase 28E pins the scope.
   Drafting (in a separate working branch) is acceptable as
   a Phase 29A-side preparation activity; merging Phase 29A
   requires its own §4.d.
2. **Do not run `npm install` against `8.7.0` under cover of
   Phase 28E.** The
   [`../../package-lock.json`](../../package-lock.json)
   posture remains unchanged. Any install / pin step is part
   of the Phase 29A implementation PR.
3. **Treat Phase 28D's release evidence as audit evidence,
   not authority.** It is necessary, not sufficient, for
   Phase 29A.
4. **Treat the local review-substrate smoke-test results as
   machinery readiness, not §4.d evidence.** The Phase 29A
   §4.d run must be against the Phase 29A scope/PR.
5. **Preserve the class-vs-policy boundary in Phase 29A.**
   Hounfour provides shape; Straylight owns policy /
   competence / verification / execution / authorization.
6. **Treat any Hounfour-side re-publish or yank of v8.7.0 as
   a separate evidence event.** Handle it via a future
   first-class successor (or via Phase 29A's own install/pin
   step audit), not via Phase 28E rollback.

## Citations

- [`../decisions/ADR-027B-Track1-code-candidate-scope.md`](../decisions/ADR-027B-Track1-code-candidate-scope.md)
  — canonical Phase 28E decision/scope record (this
  handoff's authorizing in-repo doc).
- [`../decisions/ADR-027B-VectorAccess-release-unblocked.md`](../decisions/ADR-027B-VectorAccess-release-unblocked.md)
  §"Decision" §2 / §3 / §6 — Phase 28D release-evidence
  inventory; release/unblock disposition; authorized-by-
  Phase-28D successor scope.
- [`../decisions/ADR-027B-VectorAccess-release-gate.md`](../decisions/ADR-027B-VectorAccess-release-gate.md)
  §"Decision" §3 / §5 — Phase 28C BLOCKED disposition that
  Phase 28D resolved; §5.a–§5.e exact required release
  evidence.
- [`../decisions/ADR-027B-PrivateAlias-successor-plan.md`](../decisions/ADR-027B-PrivateAlias-successor-plan.md)
  §"Decision" §3 / §6 / §8 — Track 1 future-PR shape; §4.d
  gate; dependency posture / release-/tag-blocker rules.
- [`../decisions/ADR-027B-Fire-hounfour-composition-contracts.md`](../decisions/ADR-027B-Fire-hounfour-composition-contracts.md)
  §"Decision" §2 / §3 — Phase 28A composition-contract
  evidence lock; class-vs-policy boundary.
- [`../decisions/ADR-027A-post-dixie-return-gate.md`](../decisions/ADR-027A-post-dixie-return-gate.md)
  §"Decision" §4.a — release-evidence posture
  ("published, tagged, resolvable").
- [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)
  §"Decision" §3 / §5 / §6.Forbidden — first-class vs
  second-class doc classes; pre-merge requirement; the
  not-authority list.
- [`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md)
  §"Decision" §3 — runtime allowlist set (unchanged).
- [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md)
  — gate inventory; none fired by Phase 28E.
- [`./phase-28d-hounfour-v870-release-evidence.md`](./phase-28d-hounfour-v870-release-evidence.md)
  — operator-oriented Phase 28D evidence handoff.
