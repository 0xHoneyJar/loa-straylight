# ADR-027B-VectorAccess-release-gate — Hounfour release / vector-access gate (Phase 28C)

## Status

Accepted-for-Phase-28C as a **second-class evidence record under
[ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md)**
(it does **not** create authorization).

ADR-027B-VectorAccess-release-gate records, as of Phase 28C, the
**release / vector-access evidence** that bears on whether the
future Straylight Track 1 code PR contemplated by
[ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md)
(and bounded by §"Decision" §8 of that ADR) may be opened. It
answers, with citation, four narrow questions:

1. Does a published, tagged, resolvable
   `@0xhoneyjar/loa-hounfour` release exist that contains the
   five `recall-wedge` conformance-vector JSON files (and the
   associated composition-contract artifacts)?
2. Is `@0xhoneyjar/loa-hounfour@8.7.0` (or any later version)
   currently resolvable on the GitHub Packages registry the
   Straylight working tree is configured against?
3. Is the future Track 1 code PR
   ([ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md))
   currently **blocked** or **unblocked**?
4. What exact release evidence would unblock it?

This ADR is not authorization-creating: it does not unblock a
downstream gate, it does not widen a permitted surface, it does
not amend a refusal rule from "no" to "yes". It records the
**absence** of release evidence that the existing first-class
plan (ADR-027B-PrivateAlias-successor-plan) already requires.

ADR-027B-VectorAccess-release-gate does **not** authorize:

- any Straylight code change (test, fixture, source, package,
  script, generated tree, public surface, runtime allowlist);
- any vendoring of the five Hounfour `recall-wedge` vector JSON
  files into the Straylight tree (per ADR-027B-PrivateAlias-
  successor-plan §"Decision" §3 row "Likely files" and §8.b /
  §8.c, vendoring requires a **separate** first-class successor
  ADR with its own §4.d evidence; this proposal does **not**
  pre-approve such an ADR and explicitly does not propose one);
- any bump, range widening, range narrowing, or other change to
  the `@0xhoneyjar/loa-hounfour` dependency declared at
  `^8.6.0` and resolved at `8.6.0` in
  [`../../package.json`](../../package.json) and
  [`../../package-lock.json`](../../package-lock.json);
- the firing of any ADR-022E gate (#1, #2, #3, #4, #5, #17, #18
  all remain **HELD** — see §4 below);
- any sibling-repo edit (no `loa-hounfour`, `loa-finn`,
  `loa-dixie`, `loa-freeside`, `loa`, `freeside-characters`
  file is edited; the Hounfour-side release request drafted in
  the Phase 28C handoff is a **draft**, not a filed comment / PR
  / issue);
- any re-open of `loa-dixie` PR #102, any second Dixie endpoint,
  any second runtime subpath, any new public type re-export, or
  any change to [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  or [`../mvp/threat-model.md`](../mvp/threat-model.md);
- any Finn runtime work (gate #9 remains held; Finn is governed
  by [ADR-027C](./ADR-027C-finn-return-gate-readiness.md));
- a tag, a release, a package publish, a Loa-framework /
  control-plane / model-substrate edit, or any §4.d substitute
  route.

Per the Phase 28C hard constraints, ADR-027B-VectorAccess-
release-gate creates only the four Phase 28C files listed in
§"Decision" §1 and edits no other file. It does not commit, does
not push, does not stage, does not open a PR, does not file an
issue or comment, does not edit any sibling repo, does not edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) or
[`../mvp/threat-model.md`](../mvp/threat-model.md), does not
change [`../../package.json`](../../package.json) or
[`../../package-lock.json`](../../package-lock.json), and does
not edit any prior ADR or prior handoff except the two
append-only navigation updates listed in §"Decision" §1.

## Context

### Why Phase 28C exists

[ADR-027B-PrivateAlias-successor-plan §"Decision" §8.b](./ADR-027B-PrivateAlias-successor-plan.md)
records the **release/tag blocker**:

> If the five `recall-wedge` conformance vectors are available
> **only** from Hounfour `origin/main` / commit `c06ef1ba`,
> from another untagged Hounfour commit, or from a
> `package.json` version field (e.g., `8.7.0`) inside an
> untagged Hounfour commit that has not been **published as a
> tagged, resolvable registry release**, the future code PR is
> **blocked**. The block is released only by **either**: (i) a
> published, tagged, resolvable `@0xhoneyjar/loa-hounfour`
> release that contains the vectors at a path the published
> package's own `exports` map or shipped on-disk layout makes
> available, after which the future PR may pin to that exact
> tag (no range widening; exact tag only); **or** (ii) a
> separate first-class successor ADR that authorizes vendoring
> the vector JSON contents into the Straylight tree under its
> own §4.d evidence.

Phase 28C resolves which branch of that disjunction is currently
satisfied (neither) and what evidence is required to release
branch (i). Phase 28C **explicitly does not propose** branch
(ii); a vendoring ADR remains a separate, first-class, future
event under its own §4.d evidence.

ADR-027B-PrivateAlias-successor-plan §"Decision" §10.a
(vector-accessibility audit) further records that the read-only
audit must distinguish three cases:

> (i) inside the **already-resolved**
> `@0xhoneyjar/loa-hounfour@8.6.0` package, through an existing
> supported access path; (ii) only via a **later published,
> tagged, resolvable** Hounfour-side release; or (iii) only via
> a Hounfour-side commit not yet published under any tag.
> **Current evidence indicates outcome (iii).**

ADR-027B-VectorAccess-release-gate is the in-repo evidence
record for outcome (iii) and the **release-request specification**
that, if satisfied by a Hounfour-side maintainer-driven release,
would move the evidence to outcome (ii) and unblock the future
Track 1 code PR's dependency posture row.

### What is *not* authority

Pinned per
[ADR-026A0 §"Decision" §6.Forbidden](./ADR-026A0-operator-authority-flatline-rule.md),
[ADR-027A §"Context" → "What is *not* authority"](./ADR-027A-post-dixie-return-gate.md),
[ADR-027B-Fire §"Context" → "What is *not* authority"](./ADR-027B-Fire-hounfour-composition-contracts.md),
and [ADR-027B-PrivateAlias-successor-plan §"Context" → "What is *not* authority"](./ADR-027B-PrivateAlias-successor-plan.md):

- The presence of the five vectors in `loa-hounfour` working
  trees, on `origin/main`, in commit `c06ef1ba`, in PR #116, or
  inside a `package.json` `version` field of an untagged
  Hounfour commit is **not authority** for treating them as
  resolvable from `@0xhoneyjar/loa-hounfour@8.6.0` or from any
  later registry-published tag. A registry-published tag is
  the artifact; an untagged commit is not.
- Codex output, ChatGPT advisory output, headless generative
  review, prior Flatline multi-model verdicts on unrelated
  phases, prior Bridgebuilder reviews on unrelated phases,
  Cheval delegation outputs, persisted agent memory
  (`auto-memory`, `observations.jsonl`, framework `.run/` /
  `.claude/` / `.beads/` / `grimoires/`), vector-store retrieval,
  and long-context window dumps are **audit evidence**, not
  authority.
- Loa-side substrate degradation (Phase 26F §7.1) does not
  weaken or pre-satisfy §4.d for the future code PR. Phase 28C
  records its evidence-record nature explicitly so substrate
  degradation cannot be invoked to convert this ADR into an
  authorization-creating doc.

## Decision

### 1. File set

ADR-027B-VectorAccess-release-gate establishes only:

- **New:** this ADR.
- **New:** [`../handoffs/phase-28c-hounfour-release-request.md`](../handoffs/phase-28c-hounfour-release-request.md)
  — a **draft** release-request handoff for paste-into-Hounfour
  (issue / PR / release discussion) that requests a published,
  tagged, resolvable `@0xhoneyjar/loa-hounfour` release
  containing the Recall Wedge composition-contract artifacts.
  The handoff is a **draft**, not a filed comment / PR / issue.
- **Append-only:** [`../handoffs/README.md`](../handoffs/README.md)
  — a Phase 28C index entry, in chronological order, after the
  Phase 28B entry.
- **Append-only:** [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — a narrow Phase 28C navigation pointer appended after the
  Phase 28B successor-plan pointer.

ADR-027B-VectorAccess-release-gate touches no other file. No
prior ADR is edited. No prior handoff is edited except the two
append-only updates above.

### 2. Release-evidence inventory (as of Phase 28C)

The following evidence was checked against
[ADR-027B-PrivateAlias-successor-plan §"Decision" §3 / §8.b / §8.c / §10.a](./ADR-027B-PrivateAlias-successor-plan.md).
Each row records the source, the result, and the disposition.

| # | Source / probe | Result | Disposition |
|---|---|---|---|
| 2.a | `loa-hounfour` `origin/main` HEAD | `c06ef1ba` (the merge commit for Hounfour PR #116, "Add Straylight Recall Wedge composition contracts" — the same HEAD pinned by ADR-027B-Fire §"Decision" §2). | **Not** a published, tagged, resolvable registry release in the [ADR-027A §"Decision" §4.a](./ADR-027A-post-dixie-return-gate.md) sense. `origin/main` is not a tag. |
| 2.b | `loa-hounfour` local tag inventory for `v8.7.x` | No local `v8.7.0`, `v8.7.1`, ..., or any `v8.7.x` tag exists. | **No `v8.7.x` tag exists** locally to be checked out, packed, or published. |
| 2.c | `npm view @0xhoneyjar/loa-hounfour versions --registry=https://npm.pkg.github.com` | Returns exactly `[ '8.4.0', '8.5.0', '8.5.1', '8.5.2', '8.6.0' ]`. | **No `8.7.x` version is published** to the GitHub Packages registry the Straylight working tree resolves against. The most recent published version is `8.6.0`. |
| 2.d | `npm view @0xhoneyjar/loa-hounfour@8.7.0 dist.tarball --registry=https://npm.pkg.github.com` | 404 / "no match found" — the tarball URL does not exist. | **`@0xhoneyjar/loa-hounfour@8.7.0` is not currently resolvable**; an `npm install` against it would fail with `E404`. |
| 2.e | Vector accessibility inside the **already-resolved** `@0xhoneyjar/loa-hounfour@8.6.0` package (i.e., inside `node_modules/@0xhoneyjar/loa-hounfour/` after the existing pinned install resolved by [`../../package-lock.json`](../../package-lock.json)) | The five `vectors/conformance/recall-wedge/*.json` files, the `schemas/conformance-vector.schema.json` envelope update, and `docs/architecture/recall-wedge-composition.md` were **introduced in Hounfour PR #116**, which merged **after** the `8.6.0` release was cut. They are therefore **not** present at any path inside the resolved `8.6.0` package. | The `@0xhoneyjar/loa-hounfour@8.6.0` "already-resolved" access path of [ADR-027B-PrivateAlias-successor-plan §"Decision" §3 / §8.c](./ADR-027B-PrivateAlias-successor-plan.md) is **unavailable**. |
| 2.f | Hounfour-side `package.json` `version` field on `origin/main` / `c06ef1ba` | A `package.json` version field is *not* a registry-published tag. (Even if the field reads `8.7.0` or any other later value, the registry of record is GitHub Packages, and the registry has no `8.7.x` entry per row 2.c / 2.d.) | A field on an untagged commit is **not** ADR-027A §"Decision" §4.a release evidence. |

**Net evidence state**: the five `recall-wedge` conformance
vectors (and the rest of the composition-contract artifacts
recorded by ADR-027B-Fire §"Decision" §2) are **not** present
in any published, tagged, resolvable `@0xhoneyjar/loa-hounfour`
release available to Straylight today. They exist on
`loa-hounfour` `origin/main` / `c06ef1ba` only.

### 3. Block / unblock disposition

Per [ADR-027B-PrivateAlias-successor-plan §"Decision" §8.b / §8.c / §10.a](./ADR-027B-PrivateAlias-successor-plan.md):

- The future Straylight Track 1 code PR (ADR-027B-PrivateAlias-
  successor-plan §"Decision" §3) is **BLOCKED** under §8.b
  outcome (iii) ("vectors available only via an untagged
  Hounfour commit"). Hounfour `origin/main` / `c06ef1ba`,
  Hounfour PR #116, and any `package.json`-internal version
  field on an untagged commit are **not** sufficient release
  evidence.
- The block is released **only** by satisfying ADR-027B-
  PrivateAlias-successor-plan §"Decision" §8.b branch (i):
  a published, tagged, resolvable `@0xhoneyjar/loa-hounfour`
  release that contains the vectors at a path the published
  package's own `exports` map or shipped on-disk layout makes
  available. The future PR may then pin to that **exact tag**
  (no range widening; exact tag only).
- Branch (ii) (vendoring) is **explicitly not proposed by
  Phase 28C**. A vendoring ADR remains a separate first-class
  successor with its own §4.d evidence. Phase 28C does **not**
  pre-approve such an ADR.
- The §4.d pre-merge real 3-model Flatline + Bridgebuilder gate
  for the future code PR remains **independently unsatisfied**
  while the Loa control-plane substrate is degraded (per
  ADR-027A §"Decision" §4.d, ADR-027B §"Decision" §2 §4.d row,
  ADR-027B-Fire §"Decision" §3 §4.d row, ADR-027B-PrivateAlias-
  successor-plan §"Decision" §6, and Phase 26F §7.1). Even if
  branch (i) is satisfied tomorrow, §4.d remains its own
  separate gate.

### 4. ADR-022E gate impact

ADR-027B-VectorAccess-release-gate fires **no ADR-022E gates**.
Per-gate analysis:

| Gate | Trigger conjunction (verbatim spirit, per ADR-022E) | Phase 28C release evidence | Disposition |
|---|---|---|---|
| **#1** | Published canonical `estate-transition.schema.json` shape **and** a separate ADR adopting it. | No `estate-transition.schema.json` is shipped by Hounfour PR #116; no Phase 28C release publishes one. | **HELD.** |
| **#2** | Local `EstateTransition` type / schema / fixture, gated on #1 or its own ADR. | None authorized; this ADR is docs-only. | **HELD.** |
| **#3** | Hounfour ships a declared `./canonicalize` (or `./utilities`) JS subpath. | Hounfour PR #116 declares no new JS subpath; no Phase 28C release does either. | **HELD.** |
| **#4** | A separate ADR adopting `Challenge` into the wedge public surface. | Phase 28C authorizes no public re-export. | **HELD.** |
| **#5** | A separate ADR adopting `AuditEvent` from a Hounfour candidate. | None authorized. | **HELD.** |
| **#17** | Documented Straylight need + separate ADR + future implementation phase explicitly citing the authorization for any of the eleven Hounfour subpaths. | Phase 28C consumes nothing; the existing Phase 17B `@0xhoneyjar/loa-hounfour/core` consumption is unchanged. | **HELD.** |
| **#18** | A separate ADR adopting any Hounfour-named symbol into the wedge public surface. | Phase 28C authorizes no public re-export. | **HELD.** |

The §4.a substrate disposition narrowed by ADR-027B-Fire
(`READY-AS-COMPOSITION-SUBSTRATE; PENDING-AS-SHAPE-ADOPTION`)
is **not further narrowed** by Phase 28C. Track 1 specifically
does not require the `PENDING-AS-SHAPE-ADOPTION` half to flip;
it requires only that the composition substrate become
**resolvable from the registry** rather than from `origin/main`.

### 5. Exact release evidence required to unblock

A future Hounfour-side maintainer-driven release that satisfies
**all** of the following constitutes ADR-027A §"Decision" §4.a
release evidence sufficient to release the §3 block under
ADR-027B-PrivateAlias-successor-plan §"Decision" §8.b branch (i).
Reviewers may cite this section verbatim to refuse a future
Straylight Track 1 code PR that pins to a release missing any of
these:

- **5.a — Tag.** The release is git-tagged on `loa-hounfour`
  (e.g., `v8.7.0`, or a strictly later tag — the tag value
  itself is at the maintainer's discretion as long as it is
  ≥ a minor / patch bump from `8.6.0` per Hounfour's release
  convention).
- **5.b — Registry publish.** The release is published to the
  GitHub Packages registry the Straylight working tree resolves
  against (`https://npm.pkg.github.com`); `npm view
  @0xhoneyjar/loa-hounfour versions --registry=https://npm.pkg.github.com`
  lists the new tag, and `npm view @0xhoneyjar/loa-hounfour@<tag>
  dist.tarball --registry=https://npm.pkg.github.com` resolves
  to a non-404 tarball URL.
- **5.c — Tarball contains the recall-wedge vector corpus.** The
  published tarball, when extracted under the standard npm
  install layout (`node_modules/@0xhoneyjar/loa-hounfour/`),
  contains every one of the following at a path the package's
  own `exports` map or shipped on-disk layout makes available
  to a consuming `import` / `readFile` of JSON inputs:
  - `vectors/conformance/recall-wedge/README.md`
  - `vectors/conformance/recall-wedge/assertion-admitted.json`
  - `vectors/conformance/recall-wedge/recall-request.json`
  - `vectors/conformance/recall-wedge/recall-pack.json`
  - `vectors/conformance/recall-wedge/recall-receipt.json`
  - `vectors/conformance/recall-wedge/commitment-root.json`
  - `schemas/conformance-vector.schema.json` (the envelope
    schema for conformance vectors themselves, generated as
    part of Hounfour PR #116).
  - `docs/architecture/recall-wedge-composition.md` **if** the
    Hounfour-side release convention includes architecture
    docs in the published tarball; if Hounfour's convention
    excludes `docs/` from the tarball, the doc is acceptable
    in-repo only on the tagged commit, and Phase 28C does not
    require its presence inside the tarball.
- **5.d — Release-integrity / dist / stub artifacts.** The
  published tarball passes whatever release-integrity / dist /
  stub-artifact convention Hounfour normally enforces for a
  release of this class (e.g., the `npm run check:release-
  integrity-parity` lane noted by ADR-027B-Fire §"Decision" §5
  in the Hounfour-side audit). Phase 28C does not redefine
  Hounfour's release convention; it requires only that whatever
  convention Hounfour normally applies has been applied.
- **5.e — Composition-substrate-only.** The release introduces
  no **new** Hounfour-published canonical shape (no new domain
  `$id`, no new JS subpath, no new TS public symbol that the
  ADR-022E gate inventory would treat as a shape adoption
  trigger). A release that *adds* shape evidence does not
  break this rule, but it does **not** satisfy any ADR-022E
  gate — gate firings remain governed by their own first-class
  successor ADRs per [ADR-027B-PrivateAlias-successor-plan §"Decision" §2 / §11.a / §11.g](./ADR-027B-PrivateAlias-successor-plan.md).
  Phase 28C requires only the composition substrate be
  **resolvable**.

If, and only if, all five rows are satisfied:

1. The §3 release-/tag-blocker disposition flips from **BLOCKED**
   to **release-evidence-met**;
2. The Hounfour dependency posture in the future Track 1 code PR
   may pin to the new exact tag per ADR-027B-PrivateAlias-
   successor-plan §"Decision" §3 row "Package / dependency
   treatment" and §"Decision" §8.d (no range widening; exact tag
   only); **and**
3. The future Straylight Track 1 code PR's §4.d pre-merge real
   3-model Flatline + Bridgebuilder gate **remains independently
   unsatisfied** until the Loa control-plane substrate is
   restored. §4.d is its own separate gate; satisfying §5.a–§5.e
   does **not** waive, weaken, or pre-satisfy §4.d.

### 6. What is explicitly forbidden

Reviewers may cite this section verbatim to refuse an in-repo or
sibling-repo PR that exceeds Phase 28C's scope:

- **6.a** — No claim that ADR-027B-VectorAccess-release-gate
  authorizes Straylight code, vendoring, a dependency bump,
  any ADR-022E gate firing, an allowlist change, a runtime
  subpath addition, a public type re-export, or a tag /
  release / publish.
- **6.b** — No claim that ADR-027B-VectorAccess-release-gate
  satisfies, waives, or pre-satisfies §4.d for the future
  Track 1 code PR.
- **6.c** — No re-open of `loa-dixie` PR #102 and no Phase
  26E re-implementation in `loa-straylight` under cover of
  Phase 28C.
- **6.d** — No edit to [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  or [`../mvp/threat-model.md`](../mvp/threat-model.md) under
  cover of Phase 28C.
- **6.e** — No edit to [`../../package.json`](../../package.json)
  or [`../../package-lock.json`](../../package-lock.json) under
  cover of Phase 28C.
- **6.f** — No vendoring of the five Hounfour `recall-wedge`
  vector JSON files, of `schemas/conformance-vector.schema.json`,
  or of `docs/architecture/recall-wedge-composition.md` into
  the Straylight tree under cover of Phase 28C. Vendoring
  requires a separate first-class successor ADR with its own
  §4.d evidence; Phase 28C does **not** pre-approve such an
  ADR.
- **6.g** — No filing of the Phase 28C Hounfour release-request
  draft as a sibling-repo issue, comment, or PR by Phase 28C
  itself. The draft is paste-ready for a future operator-driven
  filing event under the operator's read-only / discretion
  posture; the filing event is **not** Phase 28C.
- **6.h** — No claim that Codex audit output, ChatGPT output,
  or any model finding is authorization for any of the above.
  Per ADR-026A0 §"Decision" §6.Forbidden, model output is
  audit evidence, not authority.
- **6.i** — No claim that Loa control-plane substrate
  degradation waives, weakens, or shortens §4.d for the
  future Track 1 code PR.
- **6.j** — No Track 2 (soft-audit-prefix-only) consumption,
  no Track 3 (private-alias *shape* adoption), no Finn
  runtime adoption, no Freeside wiring, no production storage
  migration, no signature verification, no policy execution,
  no audit-chain enforcement, no storage adapter, and no
  recall execution change under cover of Phase 28C.

### 7. Rollback

ADR-027B-VectorAccess-release-gate is docs-only and adds no
runtime / test / fixture / script / package change. Rollback is
the inverse-docs-only operation: delete this ADR; delete
[`../handoffs/phase-28c-hounfour-release-request.md`](../handoffs/phase-28c-hounfour-release-request.md);
revert the two Phase 28C append-only sections in
[`../handoffs/README.md`](../handoffs/README.md) and
[`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md).
Rollback restores the post-Phase-28B baseline. Rollback does
**not** re-open `loa-dixie` PR #102, does **not** re-fire any
ADR-022E gate (none were fired), does **not** alter the
ADR-027B-PrivateAlias-successor-plan §"Decision" §3 future-PR
shape, and does **not** authorize any sibling-repo edit.

If, after Phase 28C, a published, tagged, resolvable Hounfour
release satisfies §5.a–§5.e, no special rollback of Phase 28C
is required: the future Track 1 code PR is the next first-class
event and inherits §4.d on its own under
[ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md).

## Consequences

- The release / vector-access evidence is recorded with citation.
  Reviewers may refuse a PR that treats `origin/main` /
  `c06ef1ba`, an untagged Hounfour commit, or a `package.json`
  version field as ADR-027A §"Decision" §4.a release evidence.
- The future Track 1 code PR
  (ADR-027B-PrivateAlias-successor-plan §"Decision" §3) is
  **BLOCKED** under §8.b outcome (iii) and remains so until the
  five-row release evidence in §5 is satisfied. Vendoring is
  **not** an alternative this ADR pre-approves.
- The §4.d pre-merge real 3-model Flatline + Bridgebuilder gate
  for the future Track 1 code PR remains **independently
  unsatisfied**. Even if §5 is satisfied, §4.d is its own gate.
- ADR-022E gates #1, #2, #3, #4, #5, #17, #18 all remain
  **HELD**. Phase 28C fires none of them.
- No Straylight code is authorized. No Hounfour dependency
  change is authorized. No vendoring is authorized. No public
  surface, runtime allowlist, threat model, or package boundary
  edit is authorized.
- A Hounfour-side maintainer-driven release event is the
  expected next external precondition. The Phase 28C handoff
  packet
  ([`../handoffs/phase-28c-hounfour-release-request.md`](../handoffs/phase-28c-hounfour-release-request.md))
  is the **draft** request. Its filing is a separate
  operator-driven event; Phase 28C does not file it.

## Validation

ADR-027B-VectorAccess-release-gate adds no source / test /
fixture / script / package change; the working-tree surface is
the entire validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full Phase 28C working set
```

Expected:

- `git diff --name-only` lists exactly the two **modified**
  tracked files: `docs/handoffs/README.md` and
  `docs/handoffs/cross-repo-implementation-order.md`.
- `git ls-files --others --exclude-standard` lists exactly the
  two **untracked** new files: this ADR and
  `docs/handoffs/phase-28c-hounfour-release-request.md`.
- `git status --short --untracked-files=all` lists all four
  Phase 28C files (two `M`, two `??`), plus any pre-existing
  local dirt outside the Phase 28C scope (which remains
  unstaged per the phase brief).

`npm run typecheck`, `npm test`, `npm run build`, and
`npm pack --dry-run` remain identical to the post-Phase-28B
baseline by construction.

## Source files inspected

- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
  (gate inventory; per-gate trigger columns).
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
  (operator authority + Flatline rule; first-class vs second-
  class doc classes; §3 / §5 pre-merge requirement; §6.Forbidden
  not-authority list).
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
  (runtime allowlist + subpath authorization; allowlist set
  pinned by §"Decision" §3).
- [`./ADR-027A-post-dixie-return-gate.md`](./ADR-027A-post-dixie-return-gate.md)
  (canonical return-gate criteria §4.a–§4.e; release-evidence
  posture; refusal rules).
- [`./ADR-027B-hounfour-return-gate-readiness.md`](./ADR-027B-hounfour-return-gate-readiness.md)
  (canonical readiness inventory; §2 §4.a–§4.e rows narrowed by
  Phase 28A).
- [`./ADR-027B-Fire-hounfour-composition-contracts.md`](./ADR-027B-Fire-hounfour-composition-contracts.md)
  (Phase 28A composition-contract evidence lock; §"Decision" §2
  artifact list; Hounfour PR #116 / origin/main `c06ef1ba` HEAD
  pin; §"Decision" §5 read-only audit results).
- [`./ADR-027B-PrivateAlias-successor-plan.md`](./ADR-027B-PrivateAlias-successor-plan.md)
  (Phase 28B successor plan; §"Decision" §3 future-PR shape;
  §"Decision" §8 dependency posture / release-/tag-blocker
  rules; §"Decision" §10.a vector-accessibility audit).
- [`./ADR-027C-finn-return-gate-readiness.md`](./ADR-027C-finn-return-gate-readiness.md)
  (Finn-side readiness; unaffected by Phase 28C).
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md),
  [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md),
  [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
  (sibling-repo coordination; long-term order unchanged by
  Phase 28C).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) — read-only
  at decision time; not edited.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) —
  read-only at decision time; not edited.
- [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json) —
  `@0xhoneyjar/loa-hounfour` declared `^8.6.0`, resolved
  `8.6.0`; unchanged in scope.
- [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)
  (Phase 26F §7.1 substrate-degradation record; reason §4.d
  for the future Track 1 code PR remains independently
  unsatisfied).
