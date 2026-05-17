# Phase 26A-2 — Runtime recall-intake subpath authorization (docs-only)

> Status: Phase 26A-2 is a **docs-only authorization-record
> handoff**. Companion ADR:
> [`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md).
>
> Phase 26A-2 *targets* / *addresses* Flatline **SKP-005** by
> recording, on the in-repo record, the proposed experimental,
> pre-Finn, Dixie-only runtime-subpath surface design. SKP-005
> closure is asserted **only** after all three of the following
> hold:
>
> 1. ADR-026A is drafted (this packet), AND
> 2. a real 3-model Flatline pass on the ADR-026A PR returns
>    **PASS** or **REVISE-with-resolution**, AND
> 3. the ADR-026A PR merges.
>
> Until all three hold, Phase 26A-2 *targets* / *addresses* /
> *records the proposed closure design* for SKP-005; it does
> **not** claim closure.
>
> Phase 26A-2 follows Phase 26A-0 (PR #41), which resolved
> SKP-001 by establishing a stable, in-repo, citable source for
> the operator-authority discipline, and Phase 26A-1 (PR #42),
> which recorded the threat-model prerequisites for the future
> Dixie recall-intake endpoint surfaced by Flatline SKP-002,
> SKP-003, and SKP-004.
>
> Phase 26A-2 does **not** close SKP-002, SKP-003, or SKP-004 —
> those remain Phase 26A-1 prerequisites for the future Dixie
> recall-intake endpoint PR.
>
> Phase 26A-2 does **not** itself implement the runtime subpath.
> It does **not** authorize any runtime widening beyond exactly
> one subpath at `@loa/straylight/runtime/recall-intake`. It does
> **not** authorize: a Dixie endpoint; package-surface change in
> this phase; Hounfour adoption; Finn wiring; Freeside wiring;
> Loa framework edits; storage / persistence change; tags;
> releases; package publishing; or sibling-repo edits.
>
> Phase 26A-2 does **not** create or relax any ADR-022E gate,
> does **not** weaken any Hounfour / Finn / Dixie / Freeside
> responsibility boundary, and does **not** weaken any Phase 25A,
> Phase 25B, Phase 26A-0, or Phase 26A-1 refusal rule. ADR-022E
> gates and Phase 25A / 25B / 26A-0 / 26A-1 refusal rules
> **remain binding**.
>
> Phase 26A-2 edits only:
>
> - this handoff (new),
> - the companion ADR-026A (new),
> - [`./README.md`](./README.md) (append-only Phase 26A-2 index
>   entry),
> - [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
>   (narrow append-only Phase 26A-2 cross-reference recording the
>   MVP-slice narrowing of Phase 15 ordering — bounded to recall
>   intake; no general reorder).
>
> No prior ADR is edited. No prior handoff is edited other than
> the two append-only updates above. No file under
> [`../../src/`](../../src/),
> [`../../tests/`](../../tests/),
> [`../../fixtures/`](../../fixtures/),
> [`../../scripts/`](../../scripts/), or
> [`../../dist-types/`](../../dist-types/) is touched. No
> `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`,
> `tsconfig*`, or `vitest.config.ts` is touched.
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
> **not** edited by this phase (deferred to the later
> implementation PR per ADR-026A §"Decision" §6.d).
> [`../mvp/threat-model.md`](../mvp/threat-model.md) is **not**
> edited by this phase (Phase 26A-1 already amended it). No
> `.loa.config.yaml`,
> [`../../.loa`](../../.loa),
> [`../../.claude/`](../../.claude/),
> [`../../.beads/`](../../.beads/),
> [`../../.run/`](../../.run/),
> [`../../.github/`](../../.github/),
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
> `node_modules/` is touched. No sibling repo is edited. No tag
> is cut, no Release is created, no PR or comment is filed, no
> package is published.

## Why Phase 26A-2 exists (Flatline SKP-005)

A real 3-model Flatline pass on Phase 26A Option C2 surfaced
five SKPs:

- **SKP-001** — operator-authority trigger evidence relying on
  chat memory. **Closed by Phase 26A-0 (PR #41)** via the
  stable in-repo, citable operator-authority record at
  [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md).
- **SKP-002** — resource exhaustion / DoS / unbounded
  `InMemoryStorage` at the future Dixie recall-intake endpoint.
  **Recorded by Phase 26A-1 (PR #42)** as a merge-blocking
  prerequisite (T17 four-fold acceptance) on
  [`../mvp/threat-model.md`](../mvp/threat-model.md). Closure
  remains the future Dixie PR's job.
- **SKP-003** — replay semantics at the future Dixie
  recall-intake endpoint. **Recorded by Phase 26A-1** as a
  required choice between idempotent default and explicit
  duplicate-audit-OK with replay-cannot-alter-authorization
  (T15). Closure remains the future Dixie PR's job.
- **SKP-004** — concurrency posture at the future Dixie
  recall-intake endpoint. **Recorded by Phase 26A-1** as a
  required choice between per-estate serialization and an
  explicit non-horizontal deployment constraint, enforced in
  code / config / docs with tests (T16 + T18 + T9 amendment).
  Closure remains the future Dixie PR's job.
- **SKP-005** — future ADR-026A / runtime-subpath /
  experimental pre-Finn API surface design. **Targeted by
  Phase 26A-2 (this packet)**. Closure is asserted only after
  the three-part condition recorded in §"Status banner" above.

Phase 26A-2 *targets* SKP-005 by drafting ADR-026A. Closure is
not declarative; it requires Flatline PASS or
REVISE-with-resolution AND ADR-026A PR merge.

## Summary of the proposed authorizing decision (Option C2)

The full authorization is in
[`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md).
The summary:

- **Dixie-first MVP exception.** Bounded to the single
  `handleRecallIntake` handler. Pre-Finn. Not a permanent lane
  transfer.
- **Exactly one runtime subpath later:**
  `@loa/straylight/runtime/recall-intake`. Root `.` and `./host`
  remain `"types"`-only.
- **Runtime barrel allowlist:** `handleRecallIntake` (required);
  optionally `createInMemoryRecallIntakeDeps` (only if a separate
  justification in the implementation PR shows the helper avoids
  leaking `EstateStore` / `AuditLog` / `JsonlStorage` value
  imports to consumers). No other §1–11 wedge stable-surface
  entry (`executeRecall`, `EstateStore`, `AuditLog`,
  `JsonlStorage`, `dispositionFor`, `verifyChain`,
  `computeCommitmentRoot`, etc.) is authorized as a runtime
  value export from this subpath.
- **Export condition default:** `"import"` (ESM-only), not
  `"default"`. The package is `"type": "module"`; `"import"` is
  narrower. If Flatline reverses this against the ADR-026A PR
  or the implementation PR, the implementation PR follows
  Flatline.
- **Experimental marking** in **all four** places — JSDoc on
  the runtime barrel and on every exported handler / helper;
  emitted `.d.ts` declarations (the JSDoc must survive `tsc`
  emission); `README.md`; and
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (in
  the same diff as the `exports` map entry; deferred to the
  later implementation PR).
- **Concrete non-Dixie refusal mechanism is required and
  blocking.** The implementation PR MUST define and test a
  concrete non-Dixie refusal mechanism. That mechanism must be
  documented, fail-closed behavior must be demonstrated across
  all applicable attack shapes listed in ADR-026A §7,
  dependency-object spoofing must be tested when dependency
  injection or dependency objects are used, and any claimed
  not-applicable attack shape must be explained and accepted
  only under ADR-026A §7's bounded Flatline MAY-accept
  criterion. If the implementation PR cannot satisfy this bar,
  the implementation PR is **blocked** and ADR-026A may NOT be
  cited as sufficient authorization.
- **Migration / retirement to Finn recorded.** When ADR-022E
  gate #9 fires, a future ADR (provisionally ADR-026B or
  successor) must move runtime enforcement to Finn, deprecate
  `@loa/straylight/runtime/recall-intake` with a documented
  deprecation window, retire the subpath, and restore
  Straylight to its full type-only posture.
- **No Hounfour adoption, no Finn wiring, no Freeside wiring,
  no Loa framework edits.** ADR-022E gates #1–#5, #9, #11, #17,
  #18 remain held.
- **Dixie does NOT become semantic / runtime authority.**
  Straylight remains the semantic wedge owner; Dixie is
  host / BFF / consumer only. Finn remains the eventual
  runtime-enforcement owner.

## Phase 15 narrowing

Phase 15's recommended sibling-repo implementation order
(Hounfour → Finn → Dixie → Freeside) is recorded in
[`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md).
ADR-026A narrows that order *only for this MVP slice*: a
Dixie-first recall-intake path is authorized as a pre-Finn
MVP exception, bounded to the single `handleRecallIntake`
handler.

The narrowing does **not** authorize:

- Dixie ahead of Finn for any other handler;
- Dixie taking ownership of any semantic primitive;
- skipping the Finn migration when ADR-022E gate #9 fires;
- any general reorder of the Phase 15 sequence.

The narrowing is recorded as a narrow cross-reference append in
[`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
so that document — the canonical in-repo statement of
sibling-repo ordering — points at ADR-026A / Phase 26A-2
rather than silently disagreeing with it.

## Refusal rules — what Phase 26A-2 does NOT authorize

Future PRs **must not** cite Phase 26A-2 / ADR-026A as
authorization for any of the following. Reviewers may cite this
section verbatim to refuse:

1. **No implementation by Phase 26A-2 itself.** No `src/`, no
   `tests/`, no `fixtures/`, no `scripts/`, no `dist-types/`
   change in this phase.
2. **No `package.json` / `package-lock.json` edit.** No
   `exports` map change, no `files`, no `main`, no `types`,
   no `private`, no dependency, no script change in this
   phase.
3. **No `package-boundary.md` edit by Phase 26A-2.** Deferred
   to the later implementation PR per ADR-026A §"Decision"
   §6.d.
4. **No `threat-model.md` edit by Phase 26A-2.** Phase 26A-1
   already amended it.
5. **No additional runtime subpath**, no runtime condition on
   root `.` / `./host`, no runtime export of any wedge handler
   beyond ADR-026A §"Decision" §3 allowlist.
6. **No Dixie endpoint authorization.** The Dixie endpoint is
   a separate, future, sibling-repo PR that must satisfy
   Phase 26A-1 T13–T18 in full and ADR-022E gate #10.
7. **No Hounfour adoption.** ADR-022E gates #1–#5, #17, #18
   remain held.
8. **No Finn wiring.** ADR-022E gate #9 remains held; Finn
   remains the eventual runtime-enforcement owner.
9. **No Freeside wiring.** ADR-022E gate #11 remains held.
10. **No Loa framework edits authorized by Phase 26A-2.** Per
    Phase 26A-0 §"Decision" §7, Loa-framework edits are not
    authorized by Phase 26A-0 alone and not pre-approved by
    ADR-026A.
11. **No storage / persistence change.** `InMemoryStorage` /
    `JsonlStorage` unchanged. ADR-022E gate #8 remains held.
12. **No new tag.** `v0.0.1` (annotated; pointing at
    `de65d93568e70c53ba952279f41a23d2f7d5123e`, the **Phase
    24K release-consumption tag target**) remains the sole
    release-consumption tag.
13. **No new release.** No GitHub Release is created by Phase
    26A-2 or by any phase that cites only Phase 26A-2 as its
    trigger.
14. **No package publish.** `"private": true` is preserved.
15. **No sibling-repo edit.**
16. **No GitHub issue / comment / PR action filed by Phase
    26A-2.**
17. **No SKP-005 closure by drafting alone.** Closure requires
    Flatline PASS or REVISE-with-resolution AND ADR-026A PR
    merge.
18. **No SKP-002 / SKP-003 / SKP-004 closure.** Those remain
    Phase 26A-1 prerequisites for the future Dixie PR.
19. **No general reorder of Phase 15.** The MVP-slice
    narrowing in
    [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
    is bounded to the single `handleRecallIntake` handler.
20. **No Dixie elevation to semantic / runtime authority.**
    Straylight remains the semantic wedge owner; Dixie is
    host / BFF / consumer only.
21. **No permanent lane transfer.** Pre-Finn MVP exception
    only; documented Finn migration / retirement path per
    ADR-026A §"Decision" §8.
22. **No relaxation of any ADR-022E gate, any Phase 25A /
    25B / 26A-0 / 26A-1 refusal rule, or any Hounfour /
    Finn / Dixie / Freeside responsibility boundary.**
23. **No pre-approval of any successor ADR**, including the
    Finn migration / retirement ADR.

## Future-ADR contract reminder

Any future ADR that draws on Phase 26A-2 must cite **all three**:

- **Phase 26A-0 / ADR-026A0** for the operator-authority leg
  (stable in-repo authority record).
- **Phase 26A-1 +
  [`../mvp/threat-model.md`](../mvp/threat-model.md)** for the
  threat-model prerequisites leg.
- **Phase 26A-2 / ADR-026A** (this packet) for the
  runtime-subpath authorization leg.

ADR-026A authorizes the **scope** of the later Straylight
runtime-implementation PR, but does **not** make that PR
automatically mergeable. The implementation PR remains
independently reviewable and refusable unless it satisfies
ADR-026A's tests, export allowlist, experimental marking,
non-Dixie refusal mechanism, package-boundary update, rollback
plan, and Flatline result. Specifically, the implementation PR
must:

1. cite Phase 26A-0 / ADR-026A0 (operator-authority leg);
2. cite Phase 26A-1 / threat-model.md T13–T18 + T9 amendment
   (threat-model leg);
3. cite Phase 26A-2 / ADR-026A (this authorization);
4. provide its own scope, bounded and additive, and citable;
5. hold the ADR-026A §"Decision" §10 test invariants — root
   `.` does not become runtime-importable; `./host` does not
   become runtime-importable;
   `./runtime/recall-intake` resolves at runtime; no other
   runtime subpath resolves; runtime barrel exports only the
   §3 allowlist; concrete non-Dixie refusal mechanism is held
   by tests; experimental marker survives `tsc` emission;
6. honor the §3 allowlist, §4 export-condition shape, §5
   type-only-subpath preservation, §6 experimental marker,
   §7 Dixie-only refusal mechanism + tests + block-on-failure
   rule, §8 Finn migration / retirement requirements;
7. update [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
   in the same diff that introduces the `exports` map entry;
8. record its own rollback plan (revert; no tag-validation
   needed since no tag is cut until later `v0.1.0`);
9. produce its own real 3-model Flatline result. A REVISE or
   BLOCK verdict requires resolution before the implementation
   PR is accepted.

The later Dixie endpoint PR is independently gated:

- Phase 26A-1 T13–T18 acceptance criteria;
- ADR-022E gate #10;
- sibling-repo discipline per Phase 26A-0 §"Decision" §2.

## Explicit non-scope

Phase 26A-2 inherits every non-goal from ADR-026A0 (Phase
26A-0), the Phase 26A-1 threat-model amendment, ADR-025A,
ADR-025B, ADR-024A through ADR-024K, ADR-022A through ADR-022E,
and ADR-020A through ADR-020E wholesale, and adds these
Phase-26A-2-specific refusals:

1. **No file changes outside the four approved docs** named in
   §"Status banner" above.
2. **No prior-ADR edit.**
3. **No prior-handoff edit other than the two append-only
   updates above.**
4. **No `package.json` / `package-lock.json` / `.npmrc` /
   `.gitignore` edit.**
5. **No `tsconfig*.json` / `vitest.config.ts` edit.**
6. **No `.loa.config.yaml` edit.**
7. **No source / test / fixture / script / dist-types edit.**
8. **No `package-boundary.md` / `threat-model.md` /
   `straylight-recall-wedge.md` / `phase-4-demo.md` edit.**
9. **No new tag / push / Release / publish.**
10. **No Hounfour bump or change.**
11. **No sibling-repo edit.**
12. **No live-GitHub action.** No issue / comment / PR is
    filed by Phase 26A-2.
13. **No `npm install` / `npm update` / `npm ci` /
    `npm publish` / `npm version` / `git tag` /
    `git push --tags` / `gh release create` /
    package-manager mutation command.** `npm pack --dry-run`
    is allowed in validation (read-only).
14. **No touch of
    [`../../.loa`](../../.loa) /
    [`../../.loa.config.yaml`](../../.loa.config.yaml) /
    [`../../.claude/`](../../.claude/) /
    [`../../.beads/`](../../.beads/) /
    [`../../.run/`](../../.run/) /
    [`../../.github/`](../../.github/) /
    [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
    `node_modules/`.**
15. **No new ADR-022E gate.** Gate inventory remains #1–#20.
16. **No relaxation of any ADR-022E trigger or precondition.**
17. **No relaxation of any Phase 25A / Phase 25B / Phase
    26A-0 / Phase 26A-1 refusal rule.**
18. **No prediction of when the later Straylight
    runtime-implementation PR or the later Dixie endpoint PR
    will be written, accepted, or merged.**

## Validation

Phase 26A-2 is **docs-only**. Package surface, source, tests,
fixtures, schemas, declarations, and dependencies are
byte-identical to the post-Phase-26A-1 baseline (post-PR-#42 +
PR-#43 `main`).

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
git tag --list 'v0.0.2' 'v0.0.3' 'v0.1.0'
```

### Expected outcomes

- `npm run typecheck` — clean.
- `npm test` — passes identically to the post-Phase-26A-1
  baseline (no test added; no test edited).
- `npm run build` — clean; rebuilt `dist-types/` byte-identical
  to the committed artifact.
- Both declaration entrypoints exist.
- `npm pack --dry-run` — tarball preview unchanged from Phase
  24H/I/J/K/L / 25A / 25B / 26A-0 / 26A-1.
- Forbidden-path `git diff` — **empty**. Note that **both**
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  and [`../mvp/threat-model.md`](../mvp/threat-model.md) are
  on the forbidden-path list for Phase 26A-2: neither is
  edited by this phase.
- `git diff --stat` — shows only the **four** Phase 26A-2 docs
  (this handoff, ADR-026A, the [`./README.md`](./README.md)
  Phase 26A-2 append, and the
  [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  Phase 26A-2 append).
- `git status --short` — shows the four Phase 26A-2 docs plus
  any pre-existing local dirt.
- `git tag --list v0.0.1` — prints `v0.0.1`.
- `git rev-parse v0.0.1^{commit}` — prints
  `de65d93568e70c53ba952279f41a23d2f7d5123e`, the **Phase 24K
  release-consumption tag target**.
- `git cat-file -t v0.0.1` — prints `tag`.
- `git tag --list 'v0.0.2' 'v0.0.3' 'v0.1.0'` — prints
  **nothing**.

### Pre-merge Flatline pass

Per Phase 26A-0 §"Decision" §3, the pre-merge Flatline /
Bridgebuilder requirement applies to docs-only changes that
*create authorization*. ADR-026A creates authorization, so a
real 3-model Flatline pass is required against this packet
before merge. SKP-005 closure is asserted only after that
Flatline pass returns PASS or REVISE-with-resolution AND the
ADR-026A PR merges.

## Cross-references

- Operator-authority leg (predecessor phase):
  [`./phase-26a0-operator-authority-flatline-rule.md`](./phase-26a0-operator-authority-flatline-rule.md)
  +
  [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md).
- Threat-model leg (predecessor phase):
  [`./phase-26a1-threat-model-dixie-endpoint.md`](./phase-26a1-threat-model-dixie-endpoint.md)
  +
  [`../mvp/threat-model.md`](../mvp/threat-model.md) (T13–T18 +
  T9 amendment).
- Authorization (this phase):
  [`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md).
- Implementation gate inventory:
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md).
- Implementation-sequencing decision-lock:
  [`./phase-25a-recall-wedge-mvp-implementation-readiness.md`](./phase-25a-recall-wedge-mvp-implementation-readiness.md)
  +
  [`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md).
- Hounfour status intake:
  [`./phase-25b-hounfour-70-status-intake.md`](./phase-25b-hounfour-70-status-intake.md)
  +
  [`../decisions/ADR-025B-hounfour-70-status-intake.md`](../decisions/ADR-025B-hounfour-70-status-intake.md).
- Phase 15 ordering, narrowed for this MVP slice:
  [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  (Phase 26A-2 cross-reference append).
- Stable surface (read-only at decision time; will be edited
  by the later implementation PR per ADR-026A §"Decision" §6.d):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Threat model (read-only at decision time; Phase 26A-1
  already amended it):
  [`../mvp/threat-model.md`](../mvp/threat-model.md).
- Per-packet handoff index:
  [`./README.md`](./README.md).
