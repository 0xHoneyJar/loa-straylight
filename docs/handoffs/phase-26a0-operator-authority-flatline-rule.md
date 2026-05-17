# Phase 26A-0 — Operator-authority and Flatline rule (docs-only)

> Status: Phase 26A-0 is a **docs-only operator-authority and
> Flatline-rule decision-lock**. Companion ADR:
> [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md).
>
> Phase 26A-0 records, on the in-repo record, the updated
> operator-authority discipline that governs the Loa stack
> (`loa`, `loa-hounfour`, `loa-finn`, `loa-dixie`, `loa-freeside`,
> `loa-straylight`) during the Loa Straylight MVP, and pins the
> Flatline / Bridgebuilder requirement that any push or PR
> changing source / package / runtime / test / dependency / public
> surface in those repos must run before the push or PR. Phase
> 26A-0 exists so that any future ADR (notably ADR-026A) has a
> stable, citable, in-repo source for "operator-authority trigger
> evidence" instead of relying on chat memory.
>
> Phase 26A-0 resolves **Flatline SKP-001 only**. It does **not**
> authorize ADR-026A, does **not** authorize runtime widening,
> does **not** authorize a Dixie endpoint, does **not** authorize
> Hounfour adoption, does **not** authorize Finn wiring, does
> **not** authorize Freeside wiring, does **not** authorize Loa
> framework edits, does **not** authorize public commitment-root
> behavior, does **not** authorize storage changes, does **not**
> authorize tags, releases, package-surface changes, or
> sibling-repo edits by this phase alone.
>
> Phase 26A-0 does **not** create or relax any ADR-022E gate,
> does **not** relax any Hounfour / Finn / Dixie / Freeside
> responsibility boundary, does **not** relax the Phase 25A
> implementation-sequencing decision-lock, and does **not**
> relax any Phase 25B refusal rule. ADR-022E gates and Phase
> 25A / 25B refusal rules **remain binding**.
>
> Phase 26A-0 edits only:
>
> - this handoff (new),
> - the companion ADR-026A0 (new),
> - [`./README.md`](./README.md) (append-only Phase 26A-0 index entry),
> - [`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
>   (narrow append under the existing sibling-repo teammate-review
>   rule).
>
> No prior ADR is edited. No prior handoff is edited other than
> the two append-only updates listed above. No file under
> [`../../src/`](../../src/),
> [`../../tests/`](../../tests/),
> [`../../fixtures/`](../../fixtures/),
> [`../../scripts/`](../../scripts/),
> [`../../dist-types/`](../../dist-types/), or
> [`../mvp/`](../mvp/) is touched. No `package.json`,
> `package-lock.json`, `.npmrc`, `.gitignore`, `tsconfig*`, or
> `vitest.config.ts` is touched. No `.loa.config.yaml`,
> [`../../.loa`](../../.loa),
> [`../../.claude/`](../../.claude/),
> [`../../.beads/`](../../.beads/),
> [`../../.run/`](../../.run/),
> [`../../.github/`](../../.github/),
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
> `node_modules/` is touched. No sibling repo is edited. No tag
> is cut, no Release is created, no PR or comment is filed, no
> package is published.

## Why Phase 26A-0 exists (Flatline SKP-001 unblock)

A real 3-model Flatline pass on Phase 26A Option C2 returned a
**REVISE** verdict and surfaced **SKP-001**: the contemplated
ADR-026A and its dependent threat-model PR, runtime export work,
and Dixie endpoint work cannot proceed because they would cite
**chat memory** as their operator-authority trigger evidence.
Chat memory is not citable in an ADR's evidence chain.

Phase 26A-0 resolves SKP-001 by establishing a **stable, in-repo,
citable** source for the updated operator-authority rule. It
does so without authorizing any of the downstream work that
SKP-001 was blocking; ADR-026A, the threat-model PR, runtime
exports, and Dixie endpoint work each remain independently
gated, independently triggered, and independently refusable on
their own evidence.

This unblock narrows the **review mechanism** that previously
required teammate review on sibling-repo implementation PRs. It
does **not** narrow the **gate inventory** (ADR-022E gates
#1–#20 remain in force) and does **not** narrow the **refusal
rules** of Phase 25A or Phase 25B.

## Old Phase 15 rule (recorded verbatim from the in-repo record)

The Phase 15 rule that governed sibling-repo implementation PRs,
as currently recorded in
[`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
under the section "Sibling-repo PRs require teammate review
before merge":

> **Sibling-repo PRs require teammate review before merge.** This
> applies to every sibling repo on this index — `loa-hounfour`,
> `loa-finn`, `loa-dixie`, and `loa-freeside`. No author may
> self-approve a PR that consumes one of these handoff packets,
> even when the PR appears to be a pure mechanical extraction of
> the canonical primitive.

The same rule is reflected per-packet in
[`./README.md`](./README.md) for Phases 9 / 10 / 12 / 14
(Hounfour / Finn / Dixie / Freeside).

## Updated rule (Phase 26A-0)

For the duration of the Loa Straylight MVP, the operator may
directly edit any of the following Loa stack repos:

- [`0xHoneyJar/loa`](https://github.com/0xHoneyJar/loa)
- [`0xHoneyJar/loa-hounfour`](https://github.com/0xHoneyJar/loa-hounfour)
- [`0xHoneyJar/loa-finn`](https://github.com/0xHoneyJar/loa-finn)
- [`0xHoneyJar/loa-dixie`](https://github.com/0xHoneyJar/loa-dixie)
- [`0xHoneyJar/loa-freeside`](https://github.com/0xHoneyJar/loa-freeside)
- [`0xHoneyJar/loa-straylight`](https://github.com/0xHoneyJar/loa-straylight)

provided **all five** of the following discipline clauses hold:

1. **Existing functions do not change in their public contract
   without explicit prior authorization.** Behavior already
   exposed through any of the six repos' public surfaces —
   shape, semantics, return values, error conditions, and
   invariants — is frozen against operator-authority-only
   changes; any change to that contract requires its own
   authorizing ADR or handoff.
2. **Changes are additive / bounded unless explicitly
   authorized.** Net-new files, net-new internal helpers, and
   net-new behavior gated behind explicit opt-in are within
   the discipline. Net-new entries on a published package's
   public surface (notably `@loa/straylight` /
   `@loa/straylight/host`, and the equivalent published surface
   of any other Loa stack repo) require their own authorizing
   ADR and are **not** within the standing discipline.
3. **Flatline / Bridgebuilder runs before pushes or PRs that
   change source / package / runtime / test / dependency / public
   surface in any Loa stack repo.** The pre-push / pre-PR
   Flatline / Bridgebuilder pass is part of the discipline, not
   an optional add-on. See "Flatline requirement" below for the
   exact trigger surface.
4. **Repo responsibility boundaries remain intact.** Hounfour
   remains the schema candidate. Finn remains the runtime
   enforcement candidate. Dixie remains the governed-recall / BFF
   candidate. Freeside remains the community / app surface
   candidate. Loa-Straylight remains the semantic owner. The
   operator does not collapse, swap, or re-home any of these
   responsibilities under cover of operator authority.
5. **ADR-022E gates, Phase 25A refusal rules, and Phase 25B
   refusal rules remain binding.** Operator authority does not
   relax any ADR-022E trigger conjunction, does not relax any
   Hounfour / Finn / Dixie / Freeside responsibility-boundary
   refusal recorded in Phase 25A or Phase 25B, and does not
   substitute for the authorizing ADR that any ADR-022E gate
   requires.

## What this updated rule narrows

This updated rule narrows the **review mechanism** only.

- The Phase 15 rule effectively required teammate review on
  every sibling-repo implementation PR, even strictly-additive
  / strictly-bounded ones, even when the operator was the
  author. This was a coarse mechanism: it pre-supposed two
  authors (operator + teammate) at all times.
- The updated rule replaces the coarse "teammate review on every
  sibling-repo implementation PR" gate with a discipline-based
  gate: operator-authored direct edits are admissible inside the
  six Loa stack repos *iff* the five discipline clauses above
  all hold and Flatline / Bridgebuilder has run before the push
  or PR.

This is a narrowing of the **mechanism by which review is
performed** for operator-authored Loa-stack edits during the
Straylight MVP. It is **not** a narrowing of the **substantive
scope** of any review, of any ADR-022E gate, or of any Phase
25A / 25B refusal rule.

## What this updated rule does NOT change

Phase 26A-0 explicitly does **not** change:

- **Technical implementation order.** Phase 25A's
  implementation-sequencing decision-lock
  ([`./phase-25a-recall-wedge-mvp-implementation-readiness.md`](./phase-25a-recall-wedge-mvp-implementation-readiness.md)
  +
  [`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md))
  remains binding. ADR-022E gates #1–#20 remain in their
  current pass/hold state per Phase 25B
  ([`./phase-25b-hounfour-70-status-intake.md`](./phase-25b-hounfour-70-status-intake.md)).
- **Any ADR-022E gate.** No gate is added. No gate is relaxed.
  No trigger is loosened. No precondition is weakened. The
  gate inventory remains #1–#20.
- **Hounfour / Finn / Dixie / Freeside responsibility
  boundaries.** Each sibling repo's responsibility boundary
  recorded in Phases 9 / 10 / 12 / 14 and re-affirmed in
  Phase 25A / 25B remains in force.
- **Phase 25A / Phase 25B refusal rules.** Every refusal
  recorded in those phases remains binding. Phase 26A-0 does
  not pre-approve, pre-authorize, or pre-relax any of them.
- **The wedge public surface.**
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
  not edited.
- **The threat model.**
  [`../mvp/threat-model.md`](../mvp/threat-model.md) is not
  edited.
- **Hounfour pin or dependency posture.** Pin remains `^8.6.0`;
  Posture 1a remains selected per ADR-024I.
- **Release-consumption tag posture.** `v0.0.1` remains the
  sole release-consumption tag.

## Refusal rules — what Phase 26A-0 does NOT authorize

Future PRs **must not** cite Phase 26A-0 (or ADR-026A0) as
authorization for any of the following. Reviewers may cite
this section verbatim to refuse:

1. **No ADR-026A authorization.** ADR-026A remains an
   independently required, independently triggered, independently
   refusable decision. Phase 26A-0 is **trigger evidence for
   operator authority only**; ADR-026A must still provide its
   own scope, threat-model impact, tests, rollback, and Flatline
   result.
2. **No runtime widening** of `@loa/straylight`,
   `@loa/straylight/host`, or any Loa stack repo's runtime
   surface.
3. **No Dixie endpoint.** No HTTP / NATS / REST / Discord /
   Telegram / WebSocket / RPC endpoint is authorized by Phase
   26A-0. ADR-022E gates #10 and #12 remain held.
4. **No Hounfour adoption.** No `Challenge`, `EstateTransition`,
   `safeCanonicalize`, `audit-event`, `#116`,
   `0xhoneyjar:straylight:*`, or `recall-wedge` adoption is
   authorized. ADR-022E gates #1–#5, #17, #18 remain held.
5. **No Finn wiring.** ADR-022E gate #9 remains held.
6. **No Freeside wiring.** ADR-022E gate #11 remains held.
7. **No Loa framework edits authorized by Phase 26A-0 alone.**
   Operator authority permits the operator to edit the `loa`
   framework repo subject to the five-clause discipline, but
   Phase 26A-0 does not pre-approve any specific Loa framework
   edit. Each specific framework edit remains subject to its
   own authorization, its own scope, its own discipline check,
   and its own pre-push Flatline / Bridgebuilder pass. Hooks,
   skills, audit primitives, and similar framework-wide
   constraints are explicitly out-of-scope for the standing
   discipline.
8. **No public commitment-root behavior.** ADR-020E unchanged.
   ADR-022E gate #7 remains held.
9. **No storage / persistence change.** `InMemoryStorage` /
   `JsonlStorage` unchanged. ADR-022E gate #8 remains held.
10. **No new tag.** `v0.0.1` remains the sole release-consumption
    tag.
11. **No new release.** No GitHub Release is created by Phase
    26A-0 or by any phase that cites only Phase 26A-0 as its
    trigger.
12. **No package-surface change.** Sections 1–11 of
    [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
    and the `./host` six-handler / two-helper / `*Deps` surface
    are unchanged.
13. **No sibling-repo edit by Phase 26A-0 alone.** The updated
    rule **permits** the operator to edit a sibling Loa stack
    repo under the five-clause discipline; it does not by itself
    constitute authorization for any specific sibling-repo edit.
    Each specific sibling-repo edit remains subject to its own
    authorization, its own scope, its own discipline check, and
    its own pre-push Flatline / Bridgebuilder pass.
14. **No relaxation of any ADR-022E gate.**
15. **No relaxation of any Phase 25A / Phase 25B refusal rule.**
16. **No relaxation of any Hounfour / Finn / Dixie / Freeside
    responsibility boundary.**
17. **No GitHub issue / comment / PR action.** Phase 26A-0 does
    not file any issue, comment, or PR.
18. **No Flatline / Bridgebuilder / red-team request from this
    phase.** Phase 26A-0 is docs-only and creates no
    package / runtime / surface change to review.

## Flatline requirement

For each repo in the set
{`loa`, `loa-hounfour`, `loa-finn`, `loa-dixie`, `loa-freeside`,
`loa-straylight`}, **before** any push or PR (open, update,
re-push, force-push, or merge request) that changes any of the
following surfaces, Flatline / Bridgebuilder **must** run:

- **Source.** Any change under that repo's `src/` (or
  equivalent source root).
- **Package.** Any change to `package.json`,
  `package-lock.json`, `.npmrc`, exports map, files-list, or
  publish-config.
- **Runtime.** Any change to behavior emitted at runtime, including
  default values, fail-closed semantics, or audit-emission
  semantics, regardless of whether the textual diff is in
  `src/` or in a peer directory that informs runtime.
- **Test.** Any change under that repo's `tests/` (or
  equivalent), including additions and removals.
- **Dependency.** Any change to a declared dependency,
  devDependency, peerDependency, optional dependency, or
  resolved-dependency entry.
- **Public surface.** Any change to a re-exported symbol, a
  re-exported type, a publicly documented API, an API named
  in a boundary doc, or any contractually frozen invariant.

For docs-only changes, the Flatline requirement still applies
**when the docs change creates authorization** — for example,
an ADR that cites a trigger and unblocks a downstream gate, a
boundary doc that widens a permitted surface, or a refusal
rule that previously read "no" being changed to "yes" under
some condition. Phase 26A-0 itself is exactly this latter
class for the *review-mechanism* dimension; this is precisely
why Phase 26A-0 is a separate, citable record rather than a
chat-memory artifact. The corresponding pre-merge Flatline /
Bridgebuilder pass on Phase 26A-0 is performed against this
handoff and the companion ADR-026A0 before merge.

For docs-only changes that do **not** create authorization
(e.g., a status-intake handoff, a corrigendum, a typo fix in a
boundary doc that does not change semantics), the Flatline
requirement is operator-discretion — but no docs-only change
may relax the substantive Flatline requirement above for
source / package / runtime / test / dependency / public-surface
diffs.

## Future-ADR contract

Any future ADR that cites Phase 26A-0 / ADR-026A0 as its
operator-authority trigger evidence **must still provide all of
the following on its own**, or it remains refusable:

1. **Exact trigger evidence** — what specifically triggered
   *this* ADR's scope, beyond the operator-authority discipline.
   Operator authority is the *standing* discipline; the ADR's
   *trigger* must be its own load-bearing evidence (e.g., a
   shipped upstream schema, a teammate-review approval, an
   in-repo precondition that just changed state).
2. **Scope** — exactly what surfaces / files / behaviors this
   ADR authorizes. Bounded, additive, and citable.
3. **Threat-model impact** — whether the ADR's scope adds, moves,
   or relaxes any threat-model adversary class, surface, or
   defense, and the corresponding update to
   [`../mvp/threat-model.md`](../mvp/threat-model.md) (or
   explicit "no threat-model impact" with reasoning).
4. **Tests** — what tests pin the ADR's scope, including
   boundary-preservation tests where the ADR widens a public
   surface.
5. **Rollback** — exactly how the ADR's changes are reverted
   if the gate it unblocks is re-held.
6. **Flatline result** — the verdict and SKP-* IDs from the
   pre-merge Flatline / Bridgebuilder pass on the ADR's PR. A
   REVISE or BLOCK verdict requires resolution before the ADR
   is accepted.

A future ADR that omits any of #1–#6 may be refused even if it
correctly cites Phase 26A-0 / ADR-026A0 for operator-authority
trigger evidence.

## How future work may cite Phase 26A-0

**Allowed:**

- Cite ADR-026A0 / Phase 26A-0 as **stable operator-authority
  trigger evidence** for a specific later ADR's scope, in
  combination with that ADR's own independent trigger
  evidence per the Future-ADR contract above.
- Cite ADR-026A0 alongside ADR-025A and ADR-025B for sequencing
  / trigger-status when a successor authorizing ADR is written
  during the Straylight MVP.
- Cite Phase 26A-0 as the canonical in-repo record of the
  Phase 15 → updated-rule narrowing of the review mechanism.

**Forbidden:**

- Cite Phase 26A-0 / ADR-026A0 as **universal permission to
  change any repo**. Authority is bounded by the five
  discipline clauses; broad / non-additive / surface-changing /
  boundary-collapsing changes still require their own
  authorizing ADR.
- Cite Phase 26A-0 / ADR-026A0 as **bypass authority** for any
  ADR-022E gate. No gate is relaxed; no trigger is loosened.
- Cite Phase 26A-0 / ADR-026A0 as **bypass authority** for any
  Phase 25A / Phase 25B refusal rule.
- Cite Phase 26A-0 / ADR-026A0 as **a substitute for Flatline /
  Bridgebuilder pre-push / pre-PR pass** for source / package /
  runtime / test / dependency / public-surface diffs.
- Cite Phase 26A-0 / ADR-026A0 as **substitute for the
  Future-ADR contract above**. The contract is conjunctive; an
  ADR that omits any item is refusable.
- Cite Phase 26A-0 / ADR-026A0 as **pre-approval of any
  successor ADR**, including ADR-026A specifically.

## Explicit non-scope

Phase 26A-0 inherits every non-goal from ADR-025A, ADR-025B,
ADR-024A through ADR-024K, and ADR-022A through ADR-022E
wholesale, and adds these Phase-26A-0-specific refusals:

1. **No file changes outside the four approved docs.** Only
   this handoff, the companion ADR-026A0, the
   [`./README.md`](./README.md) Phase 26A-0 index entry, and
   the narrow [`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md)
   cross-reference are new.
2. **No prior-ADR edit.**
3. **No prior-handoff edit other than the two append-only
   updates listed above.**
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
12. **No live-GitHub action.** No issue / comment / PR is filed
    by Phase 26A-0.
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
17. **No relaxation of any Phase 25A / Phase 25B refusal rule.**
18. **No prediction of when ADR-026A or any other downstream
    ADR will be written, accepted, or merged.**

## Validation

Phase 26A-0 is **docs-only**. Package surface, source, tests,
fixtures, schemas, declarations, and dependencies are
byte-identical to the post-Phase-25B baseline.

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
- `npm test` — passes identically to the post-Phase-25B
  baseline (no test added; no test edited).
- `npm run build` — clean; rebuilt `dist-types/` byte-identical
  to the committed artifact.
- Both declaration entrypoints exist.
- `npm pack --dry-run` — tarball preview unchanged from
  Phase 24H/I/J/K/L / 25A / 25B.
- Forbidden-path `git diff` — **empty**.
- `git diff --stat` — shows only the four Phase 26A-0 docs
  (this handoff, ADR-026A0, the README Phase 26A-0 index entry,
  the cross-repo-handoff-index Phase 26A-0 cross-reference).
- `git status --short` — shows the four Phase 26A-0 docs plus
  any pre-existing local dirt.
- `git tag --list v0.0.1` — prints `v0.0.1`.
- `git rev-parse v0.0.1^{commit}` — prints the post-Phase-25B
  recording baseline commit.
- `git cat-file -t v0.0.1` — prints `tag`.
- `git tag --list 'v0.0.2' 'v0.0.3'` — prints **nothing**.

## Cross-references

- Companion ADR:
  [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md).
- Direct predecessor (status-intake decision-lock):
  [`./phase-25b-hounfour-70-status-intake.md`](./phase-25b-hounfour-70-status-intake.md)
  +
  [`../decisions/ADR-025B-hounfour-70-status-intake.md`](../decisions/ADR-025B-hounfour-70-status-intake.md).
- Implementation-sequencing decision-lock:
  [`./phase-25a-recall-wedge-mvp-implementation-readiness.md`](./phase-25a-recall-wedge-mvp-implementation-readiness.md)
  +
  [`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md).
- Implementation gate inventory:
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md).
- Old Phase 15 rule (in-repo home of the
  "Sibling-repo PRs require teammate review before merge"
  paragraph that Phase 26A-0 narrows the *mechanism* of):
  [`./cross-repo-handoff-index.md`](./cross-repo-handoff-index.md).
- Cross-repo coordination context:
  [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md),
  [`./cross-repo-no-go-sequence.md`](./cross-repo-no-go-sequence.md).
- Per-packet handoff index:
  [`./README.md`](./README.md).
- Stable surface (read-only):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Threat model (read-only):
  [`../mvp/threat-model.md`](../mvp/threat-model.md).
