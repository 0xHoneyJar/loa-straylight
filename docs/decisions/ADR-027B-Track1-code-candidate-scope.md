# ADR-027B-Track1-code-candidate-scope — Phase 29A Track 1 implementation-PR scope (Phase 28E)

## Status

Accepted-for-Phase-28E as a **first-class plan, not as code
authorization**.

ADR-027B-Track1-code-candidate-scope is the **Phase 28E docs-only
successor proposal** that follows
[ADR-027B-VectorAccess-release-unblocked](./ADR-027B-VectorAccess-release-unblocked.md)
(Phase 28D). Phase 28D resolved the Hounfour-side release /
vector-access blocker pinned by
[ADR-027B-VectorAccess-release-gate](./ADR-027B-VectorAccess-release-gate.md)
§"Decision" §3 / §5: `@0xhoneyjar/loa-hounfour@8.7.0` is
published, tagged, registry-resolvable from
`https://npm.pkg.github.com`, and the published tarball ships
the seven recall-wedge composition-substrate paths (the five
conformance vectors, the recall-wedge `README.md`, and the
`schemas/conformance-vector.schema.json` envelope) that the
gate ADR pinned as the §5.c required corpus, with observed
SHA-256 `8c116f205e1ae1771c89b5c455cd0dd3a5c62160962bb3c8e9a4ae6bb50d22f7`.

ADR-027B-Track1-code-candidate-scope is the **first-class plan**
authorized by [ADR-027B-VectorAccess-release-unblocked §"Decision" §6](./ADR-027B-VectorAccess-release-unblocked.md)
(authorized-by-Phase-28D successor scope). It makes the choices
that §6 required a successor plan to make and **pins the exact
shape of the next implementation PR** — given working name
**Phase 29A — Hounfour v8.7.0 vector-access Track 1
implementation** — under the narrow Track 1 path selected by
[ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md).

ADR-027B-Track1-code-candidate-scope is, on its own:

- a **first-class doc** under
  [ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md)
  (it would, if accepted on its own §4.d evidence, unblock a
  downstream code-bearing PR — therefore it is
  authorization-creating in the §3 first-class sense);
- but **not yet code-authorizing**, because (a) this ADR is
  Phase 28E docs-only and does not perform any implementation,
  and (b) the future Phase 29A implementation PR independently
  inherits its own §4.d pre-merge real 3-model Flatline +
  Bridgebuilder gate under
  [ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md)
  and must satisfy that gate against its own scope/PR before
  any code is merged.

ADR-027B-Track1-code-candidate-scope is **docs-only**. It does
**not**:

- write, edit, generate, copy, vendor, or stage any source,
  test, fixture, runtime, package, lockfile, script, config,
  generated `dist/`, `dist-types/`, workflow,
  `.claude/` / `.loa/` / `.run/`, or grimoire file;
- run `npm install`, `npm update`, `npm pack`, `npm publish`,
  `npm test`, `npm run typecheck`, `npm run build`, or any
  other npm command;
- vendor or copy any Hounfour `recall-wedge` vector JSON, the
  `recall-wedge/README.md`, the
  `schemas/conformance-vector.schema.json`, or
  `docs/architecture/recall-wedge-composition.md` into the
  Straylight tree;
- read, edit, or otherwise rely on any sibling-repo working
  tree (`loa-hounfour`, `loa-finn`, `loa-dixie`, `loa-freeside`,
  `loa`, `freeside-characters`);
- bump, widen, narrow, pin, or otherwise edit the
  `@0xhoneyjar/loa-hounfour` declaration in
  [`../../package.json`](../../package.json) or its resolution
  in [`../../package-lock.json`](../../package-lock.json);
- change the runtime allowlist, public package exports,
  generated `dist/`, generated `dist-types/`, or
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md) /
  [`../mvp/threat-model.md`](../mvp/threat-model.md);
- claim that the Hounfour v8.7.0 release authorizes shape
  adoption beyond the composition / vector-access evidence
  recorded by
  [ADR-027B-Fire §"Decision" §2](./ADR-027B-Fire-hounfour-composition-contracts.md)
  and
  [ADR-027B-VectorAccess-release-unblocked §"Decision" §2](./ADR-027B-VectorAccess-release-unblocked.md);
- fire any of ADR-022E gates #1, #2, #3, #4, #5, #17, or #18
  (each remains **HELD** — see §5 below);
- authorize the future Phase 29A implementation PR to merge
  without satisfying its own §4.d real 3-model Flatline +
  Bridgebuilder evidence against the Phase 29A scope/PR;
- claim that the local review substrate is currently degraded
  or otherwise weakened — the substrate's posture is
  established by its own first-class evidence runs, not by
  Phase 28E narration.

## Context

### Why Phase 28E exists

[ADR-027B-VectorAccess-release-unblocked §"Decision" §6](./ADR-027B-VectorAccess-release-unblocked.md)
authorizes (as a separate future event under its own §4.d
gate) the **drafting of the next first-class code-candidate
plan/PR scope for Track 1**. It bounds that successor:

- Track 1 only (conformance-vector consumption as Vitest test
  inputs and/or `0xhoneyjar:straylight:` soft-audit-prefix
  consumption as a string constant — per
  [ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md));
- registry-resolution only against
  `https://npm.pkg.github.com` — no `loa-hounfour`-`origin/main`,
  no local-tarball / `file:`, no `git+https://`-style
  resolution, no vendoring;
- no ADR-022E gate firing under cover of §6;
- §4.d remains the successor's own gate;
- a second-class evidence record cannot substitute for §4.d
  evidence on the successor plan or the eventual implementation
  PR.

Phase 28E is **that successor plan**. It is a docs-only event
that pins:

1. The exact name and scope of the next implementation PR
   (Phase 29A) — see §"Decision" §2 / §3 below;
2. The exact forbidden scope of that implementation PR — see
   §"Decision" §4 below;
3. The acceptance-criteria framework against which the Phase 29A
   PR must prove its access path — see §"Decision" §6 below;
4. The class-vs-policy boundary that Phase 29A must preserve —
   see §"Decision" §7 below;
5. The ADR-022E gate disposition that Phase 29A may not fire —
   see §"Decision" §5 below;
6. The §4.d posture that Phase 29A must independently satisfy —
   see §"Decision" §8 below.

Phase 28E does **not** itself implement any of (1)–(6). It
also does not **authorize** Phase 29A to merge; it authorizes
Phase 29A only as a **drafting target** whose merger remains
gated on its own first-class §4.d evidence.

### What Phase 28D gave the wedge, and what it did not

Per
[ADR-027B-VectorAccess-release-unblocked §"Decision" §2 / §3](./ADR-027B-VectorAccess-release-unblocked.md):

- The release / vector-access precondition recorded by
  [ADR-027B-VectorAccess-release-gate](./ADR-027B-VectorAccess-release-gate.md)
  §"Decision" §3 is **MET**.
- The §3 BLOCKED disposition flips to **release-evidence-met**.
- The recall-wedge composition-substrate corpus is **accessible
  from a tagged, registry-resolvable
  `@0xhoneyjar/loa-hounfour@8.7.0` package**, at the standard
  npm install layout (`node_modules/@0xhoneyjar/loa-hounfour/`).

Per
[ADR-027B-VectorAccess-release-unblocked §"Decision" §3 / §5 / §7](./ADR-027B-VectorAccess-release-unblocked.md):

- The future Track 1 code PR's §4.d gate **remains
  independently unsatisfied** until real 3-model Flatline +
  Bridgebuilder evidence is run against the successor
  Straylight scope/PR; the smoke tests do not satisfy §4.d.
- ADR-022E gates #1, #2, #3, #4, #5, #17, #18 all remain
  **HELD**. The release is composition-substrate-only.
- The class-vs-policy boundary is preserved: Hounfour provides
  class / schema / conformance-vector artifacts; Straylight
  still owns policy, signer competence, signature verification,
  audit-chain execution, estate transitions, recall runtime,
  and authorization.

Phase 28E inherits all of these postures verbatim. It does not
narrow them, does not widen them, does not waive any, and does
not pre-satisfy §4.d for itself or for Phase 29A.

### What is *not* authority

Pinned per
[ADR-026A0 §"Decision" §6.Forbidden](./ADR-026A0-operator-authority-flatline-rule.md),
[ADR-027A §"Context" → "What is *not* authority"](./ADR-027A-post-dixie-return-gate.md),
[ADR-027B-Fire §"Context" → "What is *not* authority"](./ADR-027B-Fire-hounfour-composition-contracts.md),
[ADR-027B-PrivateAlias-successor-plan §"Context" → "What is *not* authority"](./ADR-027B-PrivateAlias-successor-plan.md),
[ADR-027B-VectorAccess-release-gate §"Context" → "What is *not* authority"](./ADR-027B-VectorAccess-release-gate.md),
and [ADR-027B-VectorAccess-release-unblocked §"Context" → "What is *not* authority"](./ADR-027B-VectorAccess-release-unblocked.md):

- The fact that Phase 28D recorded release / vector-access
  evidence is **not** authority for any Phase 29A code change.
  It is **necessary, not sufficient**.
- The fact that this ADR pins a **shape** for Phase 29A is
  **not** authority for Phase 29A to merge. Phase 29A inherits
  §4.d on its own under
  [ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md).
- The fact that the local review machinery has been
  smoke-tested as usable (per
  [ADR-027B-VectorAccess-release-unblocked §"Decision" §3](./ADR-027B-VectorAccess-release-unblocked.md))
  is **not** §4.d evidence for Phase 29A. Phase 29A's §4.d is
  satisfied only by a real run against the Phase 29A scope/PR.
- Codex output, ChatGPT advisory output, headless generative
  review, prior Flatline multi-model verdicts on unrelated
  phases, prior Bridgebuilder reviews on unrelated phases,
  Cheval delegation outputs, persisted agent memory
  (`auto-memory`, `observations.jsonl`, framework `.run/` /
  `.claude/` / `.beads/` / `grimoires/`), vector-store
  retrieval, and long-context window dumps are **audit
  evidence**, not authority.
- Prior smoke-test artifacts are **not** transferable §4.d
  evidence. Each first-class doc and each code-bearing PR
  carries its own §4.d obligation.

## Decision

### 1. File set

ADR-027B-Track1-code-candidate-scope establishes only:

- **New:** this ADR.
- **New:** [`../handoffs/phase-28e-track1-code-candidate-scope.md`](../handoffs/phase-28e-track1-code-candidate-scope.md)
  — the operator-oriented Phase 28E handoff (concise; no
  draft to file, no separate sibling-repo paste-ready text).
- **Append-only:** [`../handoffs/README.md`](../handoffs/README.md)
  — a Phase 28E index entry, in chronological order, after
  the Phase 28D entry.
- **Append-only:** [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — a narrow Phase 28E navigation pointer appended after the
  Phase 28D pointer.

ADR-027B-Track1-code-candidate-scope touches no other file.
No prior ADR is edited. No prior handoff is edited except the
two append-only updates above. No
[`../../package.json`](../../package.json) or
[`../../package-lock.json`](../../package-lock.json) edit is
performed; no `npm install` is run; no source / runtime /
test / fixture / script / config / generated / workflow /
`.claude/` / `.loa/` / `.run/` / grimoire file is edited.

### 2. Phase 29A — name, type, and posture

The next implementation PR authorized as a **drafting target**
by Phase 28E is:

> **Phase 29A — Hounfour v8.7.0 vector-access Track 1
> implementation**

Phase 29A is bounded as follows:

- **2.a — PR class.** Phase 29A is a code-bearing,
  source-and-test-modifying PR. It is **not** a docs-only
  successor; it is the **second** future event after Phase 28E,
  and the **first** code-bearing event in the Track 1 lane
  authorized by
  [ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md).
- **2.b — Inherited §4.d.** Phase 29A independently inherits
  §4.d under
  [ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md).
  Phase 29A may not merge without a real 3-model Flatline +
  Bridgebuilder run against its own scope/PR. Phase 28E does
  **not** pre-satisfy that gate, does **not** weaken it, does
  **not** waive it, and does **not** treat the local
  review-substrate smoke-test results recorded by
  [ADR-027B-VectorAccess-release-unblocked §"Decision" §3](./ADR-027B-VectorAccess-release-unblocked.md)
  as transferable §4.d evidence for Phase 29A.
- **2.c — Track scope.** Phase 29A is **Track 1 only** — i.e.,
  conformance-vector consumption as Vitest test inputs and/or
  `0xhoneyjar:straylight:` soft-audit-prefix consumption as a
  string constant, per
  [ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md).
  Track 2 (soft-audit-prefix-only) and Track 3 (private-alias
  *shape* adoption) are **not** authorized by Phase 28E and
  remain governed by their own future first-class proposals.
- **2.d — Resolution path.** Phase 29A consumes the
  recall-wedge composition substrate **only** via
  registry-resolution against
  `https://npm.pkg.github.com`, through the standard
  installed `node_modules/@0xhoneyjar/loa-hounfour/` layout
  (or whatever supported access path the package itself
  declares — see §6 below). No `loa-hounfour`-`origin/main`
  resolution, no local-tarball / `file:` resolution, no
  `git+https://`-style Hounfour resolution, no vendoring,
  and no sibling-repo working-tree read is permitted.
- **2.e — Composition-substrate-only.** Phase 29A consumes
  the recall-wedge corpus as **test inputs**. It does not
  adopt any Hounfour-published canonical shape, domain
  `$id`, JS subpath, or TS public symbol. It does not
  introduce any new public type re-export, runtime allowlist
  entry, or runtime subpath. The class-vs-policy boundary
  recorded by Phase 28A
  ([ADR-027B-Fire §"Decision" §3](./ADR-027B-Fire-hounfour-composition-contracts.md))
  remains intact across Phase 29A.

### 3. Phase 29A — allowed scope

Phase 29A's permitted scope is **bounded** to the following
items. Anything outside this list is out of scope for
Phase 29A and requires a separate first-class authorizing
event.

- **3.a — Dependency posture.** Phase 29A **may** pin or
  update the existing `@0xhoneyjar/loa-hounfour` declaration
  in [`../../package.json`](../../package.json) and resolved
  pin in [`../../package-lock.json`](../../package-lock.json)
  to **exactly `8.7.0`**, **or** confirm a no-manifest-delta
  posture only if `package.json` and `package-lock.json` at
  Phase 29A implementation time **already resolve exactly
  `8.7.0`**. **No range widening is permitted** (per
  [ADR-027B-PrivateAlias-successor-plan §"Decision" §8.d](./ADR-027B-PrivateAlias-successor-plan.md)):
  if Phase 29A pins to a tag, it pins to **exactly that
  tag**, not to a range that includes future v8.7.x or v8.x
  patches. Phase 29A **must explicitly state** which posture
  it adopts and **must cite** the registry-resolved tarball
  hash at the time of the implementation install/pin step
  (cf.
  [ADR-027B-VectorAccess-release-unblocked §"Decision" §2 row 2.f](./ADR-027B-VectorAccess-release-unblocked.md)).
- **3.b — Narrow Straylight-side package-access probe.**
  Phase 29A **may** add a narrow Straylight-side
  package-access probe that reads Hounfour's
  package-shipped recall-wedge vector files **from the
  installed `@0xhoneyjar/loa-hounfour` package**. The probe
  reads vectors as **test inputs**; it does not evaluate
  them, does not enforce them, does not run policy against
  them, and does not transfer any runtime authority across
  the boundary.
- **3.c — Narrow corpus-availability test.** Phase 29A
  **may** add a narrow Vitest test that proves the
  installed package exposes:
  - `package/vectors/conformance/recall-wedge/assertion-admitted.json`
  - `package/vectors/conformance/recall-wedge/commitment-root.json`
  - `package/vectors/conformance/recall-wedge/recall-pack.json`
  - `package/vectors/conformance/recall-wedge/recall-receipt.json`
  - `package/vectors/conformance/recall-wedge/recall-request.json`
  - `package/vectors/conformance/recall-wedge/README.md`
  - `package/schemas/conformance-vector.schema.json`

  through an **implementation-approved access path** (see §6
  below). The test fails closed if any required path is
  missing or unreadable.
- **3.d — Tiny internal/private helper (optional).**
  Phase 29A **may** add a tiny internal/private helper only
  if it is necessary for test/readability. Such a helper:
  - **must not** become part of the wedge's public runtime
    API;
  - **must not** expand `package.json` `exports` or any
    other declared public surface;
  - **must not** introduce a new TS type re-export under any
    public namespace;
  - **must not** introduce a new runtime subpath or runtime
    allowlist entry;
  - **must** be private-by-construction (e.g., not exported
    from the wedge's index, or exported only under a deeply
    internal path that the wedge's published surface does
    not list).
- **3.e — Smallest-possible diff.** Phase 29A **must** keep
  the implementation to the **smallest possible code/test
  diff**. If a section of Phase 29A's diff exceeds what is
  strictly required by §3.a–§3.d, that section is out of
  scope and Phase 29A reviewers may refuse it on those
  grounds.
- **3.f — Hounfour data remains package-sourced.** Phase 29A
  **must** keep all Hounfour data **package-sourced**. It
  **must not** copy the vector JSON payloads, the
  recall-wedge `README.md`, or the
  `schemas/conformance-vector.schema.json` envelope into the
  Straylight tree under any mechanism.

### 4. Phase 29A — forbidden scope

Phase 29A's forbidden scope is bounded to the following items.
Reviewers may cite this section verbatim to refuse a Phase 29A
candidate that exceeds the scope:

- **4.a — No vendoring.** No copying of any Hounfour
  `recall-wedge` vector JSON, the recall-wedge `README.md`,
  the `schemas/conformance-vector.schema.json` envelope, or
  `docs/architecture/recall-wedge-composition.md` into the
  Straylight tree by **any** mechanism (no `npm run` codegen
  step, no `cp` / build-time materialization, no inline
  literal embedding, no `import` of a vendored copy, no
  fixtures-directory mirror).
- **4.b — No local tarball dependency.** No `file:` /
  `link:` / `portal:` / local-path Hounfour dependency.
- **4.c — No `git+https://`-style dependency.** No
  `@0xhoneyjar/loa-hounfour` dependency that resolves via
  `git+https://`, `git+ssh://`, `github:`, or any other
  non-registry git URL.
- **4.d — No `origin/main` / branch / commit dependency.**
  No `@0xhoneyjar/loa-hounfour` declaration that resolves
  against a Hounfour branch, tag-of-a-commit, working-tree
  pointer, or any non-published-tag artifact.
- **4.e — No Hounfour sibling-repo file reads.** No
  Straylight-side code, test, fixture, script, or
  documentation Phase 29A authors may read from the
  `loa-hounfour` sibling working tree, from a checked-out
  Hounfour HEAD, or from any path outside the
  Straylight working tree and the resolved
  `node_modules/@0xhoneyjar/loa-hounfour/` package.
- **4.f — No generated `dist/` / `dist-types/` change.**
  Phase 29A's `dist/` and `dist-types/` trees **must remain
  clean** (`git status --short -- dist dist-types` returns
  no entries) unless the Phase 29A PR's own accepted scope
  separately authorizes a generated-tree change. Any such
  generated-tree change is itself out of scope unless
  explicitly authorized by the implementation PR's own
  scope; Phase 28E does not pre-authorize one.
- **4.g — No Straylight runtime recall behavior.** Phase 29A
  introduces no runtime recall change — no addition to the
  request-to-pack pipeline, no addition to the
  pack-to-receipt pipeline, no addition to the
  receipt-to-commitment pipeline. The recall runtime
  surface is unchanged.
- **4.h — No signature verification.** Phase 29A does not
  implement, modify, or wire any signature-verification
  primitive. Hounfour's published vectors are **test
  inputs**; they are not signed runtime artifacts.
- **4.i — No signer competence enforcement.** Phase 29A
  does not introduce signer-competence enforcement,
  keyring validation, or actor-binding logic. Signer
  competence remains a Straylight-owned policy primitive
  (see §7 below) outside Phase 29A's scope.
- **4.j — No policy execution.** Phase 29A does not
  introduce or modify policy execution — no new admission
  rule, no new refusal rule, no new audit policy.
- **4.k — No storage adapter.** Phase 29A introduces no
  storage adapter, no persistence migration, no
  receipt/pack persistence change.
- **4.l — No audit-chain enforcement.** Phase 29A does not
  introduce, modify, or wire any audit-chain ordering /
  hashing / verification primitive. The
  `0xhoneyjar:straylight:` soft-audit-prefix policy remains
  Straylight-owned (see §7 below).
- **4.m — No Dixie integration.** Phase 29A does not
  re-open `loa-dixie` PR #102, does not add a second Dixie
  endpoint, does not add a second runtime subpath, and
  does not modify the Dixie consumer contract.
- **4.n — No Finn integration.** Phase 29A does not adopt
  Finn runtime behavior. ADR-022E gate #9 remains held
  (Finn governed by
  [ADR-027C](./ADR-027C-finn-return-gate-readiness.md)).
- **4.o — No runtime allowlist changes.** The runtime
  allowlist remains
  `{ handleRecallIntake, createDixieCapability, DixieCapabilityError, DixieCapability (type) }`
  per [ADR-026A §"Decision" §3](./ADR-026A-runtime-recall-intake-subpath.md),
  Phase 26B / 26B-F, ADR-027A §"Decision" §4.c,
  ADR-027B-Fire §"Decision" §3 §4.c row, and
  [ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md).
- **4.p — No public package export changes.** No widening
  of `package.json` `exports`, no new declared subpath, no
  new TS public symbol, no new public type re-export.
- **4.q — No ADR-022E gate firing.** Phase 29A fires no
  ADR-022E gate; #1, #2, #3, #4, #5, #17, and #18 remain
  HELD across Phase 29A — see §5 below.
- **4.r — No Phase 28E implementation.** Phase 28E (this
  ADR + the Phase 28E handoff packet) authorizes the
  drafting of the Phase 29A scope, **not** any Phase 29A
  implementation. Phase 28E itself implements zero code.
- **4.s — No new tests beyond the corpus-availability
  proof.** Phase 29A's new tests are bounded to the
  package-access-probe / corpus-availability proof
  described in §3.b–§3.c. Tests that exercise the
  recall-wedge runtime, evaluate the conformance vectors
  against the wedge's policy plane, or enforce signer
  competence are out of scope.
- **4.t — No new fixtures.** Phase 29A introduces no new
  fixtures beyond, at most, a single private pointer /
  manifest under `fixtures/hounfour-conformance/` (per
  [ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md)
  "Likely files") that records, by Hounfour-side path,
  where each consumed vector lives **inside the resolved
  `@0xhoneyjar/loa-hounfour` package**. **No vendored
  vector JSON contents are admitted under §3.f.**
- **4.u — No tag, release, or publish on the Straylight
  side.** Phase 29A does not tag, release, or publish.

### 5. ADR-022E gate impact

Phase 28E fires **no ADR-022E gates**. It also pins, as
Phase 29A's scope ceiling, that Phase 29A may fire **no
ADR-022E gates** under cover of Phase 28E. Per-gate
analysis:

| Gate | Trigger conjunction (verbatim spirit, per ADR-022E) | Phase 28E posture | Phase 29A posture | Disposition |
|---|---|---|---|---|
| **#1** | Published canonical `estate-transition.schema.json` shape **and** a separate ADR adopting it. | The v8.7.0 tarball ships no `estate-transition.schema.json`; Phase 28E adopts no shape. | Phase 29A consumes only recall-wedge composition substrate as test inputs; it adopts no estate-transition shape. | **HELD.** |
| **#2** | Local `EstateTransition` type / schema / fixture, gated on #1 or its own ADR. | None authorized; this ADR is docs-only. | Phase 29A authors no `EstateTransition` type/schema/fixture. | **HELD.** |
| **#3** | Hounfour ships a declared `./canonicalize` (or `./utilities`) JS subpath. | The v8.7.0 release introduces no new JS subpath relative to the post-v8.6.0 baseline. | Phase 29A consumes no new Hounfour JS subpath; the existing Phase 17B `@0xhoneyjar/loa-hounfour/core` consumption is unchanged. | **HELD.** |
| **#4** | A separate ADR adopting `Challenge` into the wedge public surface. | Phase 28E authorizes no public re-export. | Phase 29A authorizes no public re-export. | **HELD.** |
| **#5** | A separate ADR adopting `AuditEvent` from a Hounfour candidate. | None authorized. | Phase 29A authorizes no `AuditEvent` adoption. | **HELD.** |
| **#17** | Documented Straylight need + separate ADR + future implementation phase explicitly citing the authorization for any of the eleven Hounfour subpaths. | Phase 28E consumes nothing; the existing Phase 17B `@0xhoneyjar/loa-hounfour/core` consumption is unchanged. | Phase 29A may pin / update the existing `@0xhoneyjar/loa-hounfour` dependency declaration to `8.7.0` (or confirm a no-delta posture) per §3.a — that is **not** a new subpath authorization; it is an exact-tag pin of the existing Phase 17B `@0xhoneyjar/loa-hounfour/core` consumption. No new subpath is consumed. | **HELD.** |
| **#18** | A separate ADR adopting any Hounfour-named symbol into the wedge public surface. | Phase 28E authorizes no public re-export. | Phase 29A authorizes no public re-export. | **HELD.** |

The §4.a substrate disposition narrowed by ADR-027B-Fire
(`READY-AS-COMPOSITION-SUBSTRATE; PENDING-AS-SHAPE-ADOPTION`)
and refined by Phase 28D's release-accessibility flip is
**not further narrowed** by Phase 28E's shape-adoption half.
Track 1, by definition, does not require the
`PENDING-AS-SHAPE-ADOPTION` half to flip; it requires only
that the composition substrate be resolvable from a
registry-resolvable package, which Phase 28D established and
Phase 29A consumes.

### 6. Access-path discipline — acceptance criteria for Phase 29A

Phase 28E does **not** claim that the exact file-access
mechanism has already been proven inside Straylight. It does
**not** prescribe a single mechanism (e.g., `require.resolve`,
`import.meta.resolve`, an `exports`-map asset path, a JSON
import, or a filesystem read against the resolved package
root). The choice of mechanism is part of Phase 29A's
implementation, subject to the discipline below.

The Phase 29A implementation PR **must** prove its access
path against the following acceptance criteria. Reviewers
may cite this section verbatim to refuse a Phase 29A
candidate that does not satisfy any one of them:

- **6.a — Resolves the installed package root or supported
  asset path.** Phase 29A's access mechanism resolves the
  installed `@0xhoneyjar/loa-hounfour` package root, or a
  supported asset path declared by the package itself
  (e.g., via the package's own `exports` map, a published
  on-disk layout the package documents, or a stable
  filesystem pointer relative to the resolved package
  root). The mechanism is one Phase 29A's review can audit
  against the actual published v8.7.0 package's contents.
- **6.b — Fails closed on missing paths.** Phase 29A's
  access mechanism **fails closed** if the installed
  package does not expose any one of the seven required
  paths listed in §3.c. Failure mode is loud (e.g., a
  thrown error, a failed test) — silent fallback is
  forbidden.
- **6.c — Does not rely on sibling-repo layout.** Phase 29A
  does not assume a `loa-hounfour` sibling working tree
  exists, does not read from one, and does not encode any
  path that is valid only under a Hounfour checkout. The
  only assumed layout is **the standard installed
  `node_modules/@0xhoneyjar/loa-hounfour/`** (or whatever
  the package's own resolution declares).
- **6.d — Does not rely on unpublished package state.**
  Phase 29A does not assume any path that is present only
  on a Hounfour `origin/main` working tree, on an
  unpublished branch, on an untagged commit, or on a
  pre-release artifact. The only assumed state is the
  **published, tagged, registry-resolvable
  `@0xhoneyjar/loa-hounfour@8.7.0` package**.
- **6.e — Does not bypass package-manager resolution.**
  Phase 29A does not read the recall-wedge corpus via a
  hardcoded `node_modules/...` path that bypasses
  `npm`/`yarn`/`pnpm` resolution semantics. The mechanism
  must work under the package manager Phase 29A's CI uses
  (npm in the current Straylight tree).
- **6.f — Cited by Hounfour-side path and registry tag.**
  Phase 29A **must cite**, for each consumed vector, (i)
  the Hounfour-side on-disk path inside the resolved
  package, (ii) the registry tag (`8.7.0`), and (iii) the
  registry-resolved tarball hash observed at Phase 29A's
  install/pin step.

#### 6.g — Suggested Phase 29A acceptance checks

The following are **suggested** acceptance checks for the
Phase 29A implementation PR. They are not exhaustive, and
Phase 29A reviewers retain the right to extend them. They
are recorded here as a non-binding template:

- `npm install` / `npm ci` resolves
  `@0xhoneyjar/loa-hounfour@8.7.0` from
  `https://npm.pkg.github.com`.
- `package-lock.json` records `8.7.0` (or, under §3.a's
  no-manifest-delta posture, already records `8.7.0`).
- Tests prove all seven required recall-wedge vector paths
  (§3.c) are accessible from the installed package via the
  Phase 29A-chosen mechanism.
- Tests prove `package/schemas/conformance-vector.schema.json`
  is accessible from the installed package via the same
  mechanism.
- Tests do **not** import Straylight runtime recall
  behavior (no `executeRecall` call, no
  `handleRecallIntake` call, no policy plane evaluation).
- `git status` shows **no vendored vector payloads**, no
  copy of the `schemas/conformance-vector.schema.json`
  envelope inside the Straylight tree, and no copy of
  `docs/architecture/recall-wedge-composition.md` inside
  the Straylight tree.
- `git status --short -- dist dist-types` returns **no
  entries** — no `dist/` or `dist-types/` change unless the
  Phase 29A PR's own accepted scope separately authorizes
  one (Phase 28E does not pre-authorize any such change).
- `npm pack --dry-run` shows the **published surface
  unchanged** (no new runtime subpath; no widened
  allowlist; no new public type re-export).
- A **real 3-model Flatline + Bridgebuilder run** is
  executed against the Phase 29A scope/PR before merge,
  per §8 below; the resulting evidence is the §4.d audit
  input for Phase 29A's merger.

### 7. Class-vs-policy boundary preservation

Phase 28E explicitly preserves the class-vs-policy boundary
recorded by Phase 28A
([ADR-027B-Fire §"Decision" §3](./ADR-027B-Fire-hounfour-composition-contracts.md))
and reaffirmed by every successor in the 27/28 series:

- **Hounfour provides** class / schema / conformance-vector
  artifacts. The v8.7.0 release ships the recall-wedge
  conformance-vector corpus, the recall-wedge `README.md`,
  and the `schemas/conformance-vector.schema.json`
  envelope. These are class artifacts: shapes for inputs,
  taxonomy slots inside Hounfour's existing
  conformance-vector machinery, and an envelope schema for
  the conformance vectors themselves.
- **Straylight still owns**: policy validation (which
  assertions are admitted, which keyrings are valid,
  which signers are competent for which estates), signer
  competence (which key bound to which actor under which
  transition), signature verification (the actual
  cryptographic check, not the *shape* of the signature
  envelope), audit-chain execution (the ordering and
  hashing of audit events into a chain, including the
  soft-audit-prefix policy on the
  `0xhoneyjar:straylight:` namespace), estate transitions
  (the runtime decision that an estate moves between
  states), recall runtime (the request-to-pack,
  pack-to-receipt, receipt-to-commitment pipeline as a
  runtime, not as a fixture), authorization (every refusal
  rule, every gate disposition, every "no" in the policy
  plane), and runtime refusal behavior (every soft-fail /
  hard-fail decision in the wedge runtime).
- Phase 29A's consumption of the recall-wedge corpus as
  Vitest test inputs **does not** transfer any policy /
  competence / verification / execution / authorization
  primitive across the Hounfour → Straylight boundary. The
  recall-wedge conformance vectors are **test inputs**,
  not production fixtures, not signed artifacts, not
  hash-verified at install time, and not runtime
  authorities.
- Phase 29A reviewers may cite this section verbatim to
  refuse a Phase 29A candidate that treats the recall-wedge
  vectors as production fixtures, that wires them into
  policy execution, or that treats them as transferring
  runtime authority across the boundary.

### 8. §4.d posture — Phase 29A inherits its own gate

Phase 29A independently inherits §4.d under
[ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md).
Phase 28E **does not satisfy §4.d** for Phase 29A, **does
not waive §4.d**, **does not weaken §4.d**, and **does not
pre-satisfy §4.d**.

- **8.a — Phase 28E's own §4.d.** This ADR is itself a
  first-class doc that, if accepted on its own §4.d
  evidence, would unblock Phase 29A's drafting. Phase 28E's
  own §4.d obligation is **separate** from Phase 29A's. The
  authoring of the Phase 29A scope is the Phase 28E
  doc-merge event; the Phase 29A code merger is a future
  separate event that inherits §4.d on its own.
- **8.b — Phase 29A's own §4.d.** Phase 29A's §4.d is
  **independently unsatisfied** until a real 3-model
  Flatline + Bridgebuilder run is executed against the
  Phase 29A scope/PR. Local smoke-test results on
  unrelated phases — including the smoke-test results
  recorded by
  [ADR-027B-VectorAccess-release-unblocked §"Decision" §3](./ADR-027B-VectorAccess-release-unblocked.md)
  (3-model Flatline live smoke passed; Bridgebuilder
  3-provider dry-run wiring passed) — are **not** §4.d
  evidence for Phase 29A. They establish that the
  machinery is **usable**, which is a **necessary
  precondition** for Phase 29A's §4.d run; they are not the
  run itself.
- **8.c — No second-class doc may substitute.** A
  second-class evidence record (e.g.,
  [ADR-027B-VectorAccess-release-unblocked](./ADR-027B-VectorAccess-release-unblocked.md))
  cannot substitute for Phase 29A's first-class §4.d
  evidence. Reviewers may cite this row verbatim to refuse
  a Phase 29A candidate that tries to claim Phase 28D's
  release evidence as standalone §4.d evidence.
- **8.d — No claim that the review substrate is degraded.**
  Phase 28E does **not** claim that the local review
  substrate is currently degraded. The substrate's
  posture is established by its own first-class evidence
  runs against Phase 29A's scope, not by Phase 28E
  narration.
- **8.e — Real-run scope.** The Phase 29A §4.d real-run
  scope must include, at minimum: the Phase 29A code
  diff, the Phase 29A test diff, the dependency-posture
  delta (per §3.a), the access-path mechanism (per §6),
  the corpus-availability test outcome, and the
  generated-tree posture (per §4.f). Reviewers may
  expand the scope further; they may not narrow it below
  this floor.

### 9. What is explicitly forbidden

Reviewers may cite this section verbatim to refuse an
in-repo or sibling-repo PR that exceeds Phase 28E's scope:

- **9.a** — No claim that ADR-027B-Track1-code-candidate-scope
  authorizes Phase 29A code, vendoring, a dependency bump
  beyond §3.a, an ADR-022E gate firing, an allowlist change,
  a runtime subpath addition, a public type re-export, a
  tag, a release, or a publish on the Straylight side.
- **9.b** — No claim that ADR-027B-Track1-code-candidate-scope
  satisfies, waives, or pre-satisfies §4.d for Phase 29A or
  for any other future first-class proposal.
- **9.c** — No re-open of `loa-dixie` PR #102 and no
  Phase 26E re-implementation in `loa-straylight` under
  cover of Phase 28E.
- **9.d** — No edit to
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  or [`../mvp/threat-model.md`](../mvp/threat-model.md)
  under cover of Phase 28E.
- **9.e** — No edit to
  [`../../package.json`](../../package.json) or
  [`../../package-lock.json`](../../package-lock.json) under
  cover of Phase 28E, and no `npm install` / `npm update` /
  `npm pack` / `npm publish` / `npm test` / `npm run
  typecheck` / `npm run build` under cover of Phase 28E.
- **9.f** — No vendoring of any Hounfour `recall-wedge`
  artifact under cover of Phase 28E. Vendoring remains a
  separate first-class successor with its own §4.d
  evidence; Phase 28E does **not** propose one and does
  **not** pre-approve one.
- **9.g** — No `loa-hounfour`-`origin/main` resolution, no
  local-tarball / `file:` resolution, no
  `git+https://`-style Hounfour resolution under cover of
  Phase 28E. Future consumption is **registry-resolution
  only**, against `https://npm.pkg.github.com`.
- **9.h** — No claim that Codex audit output, ChatGPT
  output, or any model finding is authorization for any of
  the above. Per ADR-026A0 §"Decision" §6.Forbidden, model
  output is audit evidence, not authority.
- **9.i** — No claim that any historical Loa control-plane
  substrate-degradation record, any local review-substrate
  smoke-test result (Flatline live smoke, Bridgebuilder
  dry-run wiring, or any later equivalent), or any prior
  §4.d run on an unrelated phase waives, weakens, shortens,
  or pre-satisfies §4.d for Phase 29A. §4.d is satisfied
  only by a real 3-model Flatline + Bridgebuilder run
  against the Phase 29A scope/PR.
- **9.j** — No Hounfour shape adoption beyond composition /
  vector-access evidence under cover of Phase 28E. The
  v8.7.0 release is composition-substrate-only per
  [ADR-027B-VectorAccess-release-unblocked §"Decision" §2 row 2.g](./ADR-027B-VectorAccess-release-unblocked.md);
  ADR-022E gates #1, #2, #3, #4, #5, #17, #18 all remain
  HELD across Phase 29A.
- **9.k** — No Track 2 (soft-audit-prefix-only) consumption,
  no Track 3 (private-alias *shape* adoption), no Finn
  runtime adoption, no Freeside wiring, no production
  storage migration, no signature verification, no policy
  execution, no audit-chain enforcement, no storage
  adapter, and no recall execution change under cover of
  Phase 28E.
- **9.l** — No claim that Phase 28E itself implements,
  scaffolds, or stages any code. Phase 28E is docs-only by
  construction.
- **9.m** — No claim that Phase 28E authorizes Phase 29A to
  merge without Phase 29A's own §4.d evidence.

### 10. Rollback

ADR-027B-Track1-code-candidate-scope is docs-only and adds
no runtime / test / fixture / script / package change.
Rollback is the inverse-docs-only operation: delete this
ADR; delete
[`../handoffs/phase-28e-track1-code-candidate-scope.md`](../handoffs/phase-28e-track1-code-candidate-scope.md);
revert the two Phase 28E append-only sections in
[`../handoffs/README.md`](../handoffs/README.md) and
[`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md).

Rollback restores the post-Phase-28D baseline. Rollback does
**not** re-impose any BLOCKED disposition (Phase 28D's
release-evidence-met flip is independently observable on the
registry and in
[ADR-027B-VectorAccess-release-unblocked](./ADR-027B-VectorAccess-release-unblocked.md);
Phase 28E rollback only removes the Phase 29A scope record).
Rollback does **not** re-fire any ADR-022E gate (none were
fired by Phase 28E), does **not** alter
[ADR-027B-PrivateAlias-successor-plan §"Decision" §3](./ADR-027B-PrivateAlias-successor-plan.md)
future-PR shape, and does **not** authorize any sibling-repo
edit.

If, after Phase 28E, a Hounfour-side re-publish or yank event
changes the v8.7.0 registry posture (e.g., a re-tag, a yank,
a re-publish under a different SHA-256), that is itself a
separate evidence event whose handling is governed by a
future first-class successor (or by Phase 29A's own
install/pin step audit), not by Phase 28E rollback.

## Consequences

- The Phase 29A implementation-PR scope is now pinned. It is
  bounded by §"Decision" §2–§4 (allowed and forbidden scope),
  §"Decision" §6 (access-path discipline), and §"Decision" §7
  (class-vs-policy boundary preservation).
- The future Phase 29A code PR's release-/tag-blocker
  disposition remains **release-evidence-met** under
  [ADR-027B-PrivateAlias-successor-plan §"Decision" §8.b branch (i)](./ADR-027B-PrivateAlias-successor-plan.md).
  The release / vector-access precondition is **MET** per
  Phase 28D evidence; the §4.d pre-merge real 3-model
  Flatline + Bridgebuilder gate **remains independently
  unsatisfied** for Phase 29A and must be satisfied against
  the Phase 29A scope/PR before any code is merged.
- ADR-022E gates #1, #2, #3, #4, #5, #17, #18 all remain
  **HELD**. Phase 28E fires none of them. Phase 29A — under
  the §"Decision" §3–§5 scope — fires none of them either.
  The class-vs-policy boundary is preserved across the
  Phase 28E → Phase 29A boundary.
- No Straylight code is authorized by Phase 28E. No Hounfour
  dependency change is authorized by Phase 28E itself; the
  dependency-posture change, if any, is inside the Phase 29A
  implementation PR per §3.a, with its own §4.d gate. No
  vendoring is authorized. No public surface, runtime
  allowlist, threat model, or package boundary edit is
  authorized.
- Phase 28E's authorization is **necessary, not sufficient**
  for Phase 29A. Phase 29A must independently satisfy its
  own §4.d under
  [ADR-026A0 §"Decision" §3 / §5](./ADR-026A0-operator-authority-flatline-rule.md).

## Validation

ADR-027B-Track1-code-candidate-scope adds no source / test /
fixture / script / package change; the working-tree surface
is the entire validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full Phase 28E working set
```

Expected:

- `git diff --name-only` lists exactly the two **modified**
  tracked files: `docs/handoffs/README.md` and
  `docs/handoffs/cross-repo-implementation-order.md`.
- `git ls-files --others --exclude-standard` lists exactly
  the two **untracked** new files: this ADR and
  `docs/handoffs/phase-28e-track1-code-candidate-scope.md`.
- `git status --short --untracked-files=all` lists all four
  Phase 28E files (two `M`, two `??`), plus any pre-existing
  local dirt outside the Phase 28E scope (which remains
  unstaged per the phase brief).

`npm run typecheck`, `npm test`, `npm run build`, and
`npm pack --dry-run` remain identical to the post-Phase-28D
baseline by construction. No `npm install` is run by
Phase 28E; the `@0xhoneyjar/loa-hounfour` declaration in
[`../../package.json`](../../package.json) and resolution in
[`../../package-lock.json`](../../package-lock.json) is
unchanged.

## Source files inspected

- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
  (gate inventory; per-gate trigger columns).
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
  (operator authority + Flatline rule; first-class vs
  second-class doc classes; §3 / §5 pre-merge requirement;
  §6.Forbidden not-authority list).
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
  (runtime allowlist + subpath authorization; allowlist set
  pinned by §"Decision" §3).
- [`./ADR-027A-post-dixie-return-gate.md`](./ADR-027A-post-dixie-return-gate.md)
  (canonical return-gate criteria §4.a–§4.e; release-evidence
  posture; refusal rules).
- [`./ADR-027B-hounfour-return-gate-readiness.md`](./ADR-027B-hounfour-return-gate-readiness.md)
  (canonical readiness inventory; §2 §4.a–§4.e rows narrowed
  by Phase 28A).
- [`./ADR-027B-Fire-hounfour-composition-contracts.md`](./ADR-027B-Fire-hounfour-composition-contracts.md)
  (Phase 28A composition-contract evidence lock;
  §"Decision" §2 artifact list; §"Decision" §3 class-vs-
  policy boundary).
- [`./ADR-027B-PrivateAlias-successor-plan.md`](./ADR-027B-PrivateAlias-successor-plan.md)
  (Phase 28B successor plan; §"Decision" §3 future-PR shape;
  §"Decision" §6 §4.d gate; §"Decision" §8 dependency
  posture / release-/tag-blocker rules; §"Decision" §10.a
  vector-accessibility audit).
- [`./ADR-027B-VectorAccess-release-gate.md`](./ADR-027B-VectorAccess-release-gate.md)
  (Phase 28C release / vector-access gate; §"Decision" §3
  BLOCKED disposition; §"Decision" §5.a–§5.e exact required
  release evidence).
- [`./ADR-027B-VectorAccess-release-unblocked.md`](./ADR-027B-VectorAccess-release-unblocked.md)
  (Phase 28D release / vector-access unblock evidence;
  §"Decision" §2 release-evidence inventory; §"Decision" §3
  block / unblock disposition; §"Decision" §6 authorized-by-
  Phase-28D successor scope; §"Decision" §7 forbidden list).
- [`./ADR-027C-finn-return-gate-readiness.md`](./ADR-027C-finn-return-gate-readiness.md)
  (Finn-side readiness; unaffected by Phase 28E).
- [`../handoffs/phase-28d-hounfour-v870-release-evidence.md`](../handoffs/phase-28d-hounfour-v870-release-evidence.md)
  (operator-oriented Phase 28D evidence handoff).
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md),
  [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md),
  [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
  (sibling-repo coordination; long-term order unchanged by
  Phase 28E).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) —
  read-only at decision time; not edited.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) —
  read-only at decision time; not edited.
- [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json) —
  `@0xhoneyjar/loa-hounfour` declaration unchanged by
  Phase 28E. Any change is the Phase 29A implementation
  PR's, not Phase 28E's.
