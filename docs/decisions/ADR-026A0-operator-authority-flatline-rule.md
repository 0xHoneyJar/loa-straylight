# ADR-026A0 — Operator-authority and Flatline rule (Phase 26A-0)

## Status

Accepted-for-Phase-26A-0.

This ADR is the **Phase 26A-0 operator-authority and Flatline-rule
decision-lock**. It is a **docs-only authority-record reference**:
it codifies, on the in-repo record, the updated operator-authority
discipline that governs the Loa stack (`loa`, `loa-hounfour`,
`loa-finn`, `loa-dixie`, `loa-freeside`, `loa-straylight`) for the
duration of the Loa Straylight MVP, and pins the Flatline /
Bridgebuilder requirement that any push or PR changing source /
package / runtime / test / dependency / public surface in those
repos must run before the push or PR.

ADR-026A0 exists so that any future ADR — notably ADR-026A — has
a stable, citable, in-repo source for "operator-authority trigger
evidence" instead of relying on chat memory. **ADR-026A0 resolves
Flatline SKP-001 only.** It does **not** authorize ADR-026A,
runtime widening, a Dixie endpoint, Hounfour adoption, Finn
wiring, Freeside wiring, Loa framework edits, public commitment
roots, storage changes, tags, releases, package-surface changes,
or sibling-repo edits by this phase alone.

ADR-026A0 does **not** create or relax any ADR-022E gate, does
**not** weaken any Hounfour / Finn / Dixie / Freeside
responsibility boundary, does **not** advance any pending Phase
25A leg, and does **not** weaken any Phase 25B refusal rule. Each
successor ADR remains independently required, independently
triggered, and independently refusable on its own evidence per
[`./ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](./ADR-025A-recall-wedge-mvp-implementation-sequencing.md)
and the ADR-022E gate inventory.

ADR-026A0 does **not** edit
[`../../package.json`](../../package.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../tsconfig.json`](../../tsconfig.json),
[`../../tsconfig.build.json`](../../tsconfig.build.json),
[`../../vitest.config.ts`](../../vitest.config.ts),
[`../../.npmrc`](../../.npmrc),
[`../../.gitignore`](../../.gitignore),
[`../../.loa.config.yaml`](../../.loa.config.yaml), any file
under [`../../src/`](../../src/), any file under
[`../../tests/`](../../tests/), any file under
[`../../scripts/`](../../scripts/), any file under
[`../../fixtures/`](../../fixtures/), any committed declaration
under [`../../dist-types/`](../../dist-types/), or
[`../mvp/package-boundary.md`](../mvp/package-boundary.md). It
edits no prior ADR and no prior handoff except the two
append-only updates explicitly listed in §"Decision" §1 below.
It cuts no tag, pushes no tag, publishes no package, creates no
GitHub Release, files no GitHub issue / comment / PR, bumps no
Hounfour dependency, and does not touch
[`../../.loa`](../../.loa) /
[`../../.loa.config.yaml`](../../.loa.config.yaml) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`.

A pre-merge Flatline / Bridgebuilder pass is performed against
this ADR and the companion handoff
([`../handoffs/phase-26a0-operator-authority-flatline-rule.md`](../handoffs/phase-26a0-operator-authority-flatline-rule.md))
before merge, because Phase 26A-0 is the docs-only-creates-
authorization class described in the Flatline-requirement
section of the companion handoff.

ADR-026A0 sits on top of ADR-025A, ADR-025B, ADR-024A through
ADR-024K, and ADR-022A through ADR-022E without modifying any
of them.

## Context

### The SKP-001 unblock

A real 3-model Flatline pass on Phase 26A Option C2 returned a
**REVISE** verdict and surfaced **SKP-001**: ADR-026A and its
dependent threat-model PR, runtime export work, and Dixie endpoint
work cannot proceed because they would cite **chat memory** as
their operator-authority trigger evidence. Chat memory is not
citable in an ADR's evidence chain.

ADR-026A0 resolves SKP-001 by establishing a stable, in-repo,
citable source for the updated operator-authority rule. It does
so without authorizing any of the downstream work that SKP-001
was blocking. ADR-026A, the threat-model PR, runtime exports, and
Dixie endpoint work each remain independently gated, independently
triggered, and independently refusable on their own evidence.

### Old Phase 15 rule (in-repo)

The Phase 15 rule that governed sibling-repo implementation PRs,
as recorded in
[`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
and reflected per-packet in
[`../handoffs/README.md`](../handoffs/README.md):

> **Sibling-repo implementation PRs required teammate review
> before merge.** No author may self-approve a PR that consumes
> one of the Phases 9 / 10 / 12 / 14 handoff packets, even when
> the PR appears to be a pure mechanical extraction of the
> canonical primitive.

This rule is coarse: it presumes two authors (operator + teammate)
on every sibling-repo implementation PR, regardless of additivity,
boundedness, or surface impact.

### Why a docs-only authority record is the right shape here

ADR-026A0 is **review-mechanism narrowing**, not
**substantive-scope widening**. It does not authorize a single new
behavior, surface, dependency, or boundary; it codifies the
discipline under which the operator may directly edit Loa stack
repos for the Straylight MVP. Putting the discipline on the
in-repo record — paired with a citable ADR — gives any future
ADR a stable trigger-evidence source and gives reviewers a
verbatim refusal text for citations that overreach.

## Decision

### 1. File set

ADR-026A0 establishes the following file set, and only this file
set:

- **New:** this ADR
  ([`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)).
- **New:** the companion handoff
  ([`../handoffs/phase-26a0-operator-authority-flatline-rule.md`](../handoffs/phase-26a0-operator-authority-flatline-rule.md)).
- **Append-only:**
  [`../handoffs/README.md`](../handoffs/README.md) — Phase 26A-0
  index entry only.
- **Append-only:**
  [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md)
  — narrow cross-reference under or near the existing
  sibling-repo teammate-review rule, pointing to ADR-026A0 /
  Phase 26A-0 as the canonical update to the review mechanism.

No prior ADR is edited. No prior handoff is edited except the
two append-only updates above.

### 2. Updated operator-authority rule

For the duration of the Loa Straylight MVP, **the operator may
directly edit any of the following Loa stack repos**:

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
   surface in any Loa stack repo** (per §"Decision" §3 below).
4. **Repo responsibility boundaries remain intact.** Hounfour
   remains the schema candidate; Finn remains the runtime
   enforcement candidate; Dixie remains the governed-recall / BFF
   candidate; Freeside remains the community / app surface
   candidate; Loa-Straylight remains the semantic owner. The
   operator does not collapse, swap, or re-home any of these
   responsibilities under cover of operator authority.
5. **ADR-022E gates, Phase 25A refusal rules, and Phase 25B
   refusal rules remain binding.** Operator authority does not
   relax any ADR-022E trigger conjunction, does not relax any
   Hounfour / Finn / Dixie / Freeside responsibility-boundary
   refusal recorded in Phase 25A or Phase 25B, and does not
   substitute for the authorizing ADR that any ADR-022E gate
   requires.

### 3. Flatline requirement

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
- **Runtime.** Any change to behavior emitted at runtime,
  including default values, fail-closed semantics, or
  audit-emission semantics, regardless of whether the textual
  diff is in `src/` or in a peer directory that informs runtime.
- **Test.** Any change under that repo's `tests/` (or
  equivalent), including additions and removals.
- **Dependency.** Any change to a declared dependency,
  devDependency, peerDependency, optional dependency, or
  resolved-dependency entry.
- **Public surface.** Any change to a re-exported symbol, a
  re-exported type, a publicly documented API, an API named in
  a boundary doc, or any contractually frozen invariant.

For docs-only changes, the Flatline requirement still applies
**when the docs change creates authorization** — for example,
an ADR that cites a trigger and unblocks a downstream gate, a
boundary doc that widens a permitted surface, or a refusal
rule that previously read "no" being changed to "yes" under
some condition. ADR-026A0 itself is exactly this latter class
for the *review-mechanism* dimension; this is precisely why
ADR-026A0 is a separate, citable record rather than a
chat-memory artifact.

For docs-only changes that do **not** create authorization
(e.g., a status-intake handoff, a corrigendum, a typo fix in a
boundary doc that does not change semantics), the Flatline
requirement is operator-discretion — but no docs-only change
may relax the substantive Flatline requirement above for
source / package / runtime / test / dependency / public-surface
diffs.

### 4. Mechanism narrowing only

The updated rule narrows the **review mechanism** that
previously required teammate review on every sibling-repo
implementation PR. It does **not** narrow:

- the **gate inventory** — ADR-022E gates #1–#20 remain in
  force;
- the **substantive scope** of any review — every existing
  refusal rule remains substantively in force;
- the **technical implementation order** — Phase 25A's
  decision-lock remains binding;
- the **Hounfour / Finn / Dixie / Freeside responsibility
  boundaries** — Phases 9 / 10 / 12 / 14 boundaries remain;
- the **Phase 25A / Phase 25B refusal rules** — every refusal
  recorded in those phases remains binding;
- the **wedge public surface** —
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  is not edited;
- the **threat model** —
  [`../mvp/threat-model.md`](../mvp/threat-model.md) is not
  edited;
- the **Hounfour pin or dependency posture** — pin remains
  `^8.6.0`; Posture 1a remains selected;
- the **release-consumption tag posture** — `v0.0.1` remains
  the sole release-consumption tag.

### 5. Future-ADR contract

Any future ADR that cites ADR-026A0 / Phase 26A-0 as its
operator-authority trigger evidence **must still provide all of
the following on its own**, or it remains refusable:

1. **Exact trigger evidence** beyond the operator-authority
   discipline (e.g., a shipped upstream schema, a teammate-review
   approval, an in-repo precondition that just changed state).
2. **Scope** — exactly what surfaces / files / behaviors this
   ADR authorizes; bounded, additive, and citable.
3. **Threat-model impact** — whether the ADR's scope adds,
   moves, or relaxes any threat-model adversary class, surface,
   or defense, and the corresponding update to
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
correctly cites ADR-026A0 for operator-authority trigger
evidence.

### 6. How future work may cite ADR-026A0

**Allowed citations:**

- Cite ADR-026A0 / Phase 26A-0 as **stable operator-authority
  trigger evidence** for a specific later ADR's scope, in
  combination with that ADR's own independent trigger evidence
  per §"Decision" §5.
- Cite ADR-026A0 alongside ADR-025A and ADR-025B for sequencing
  / trigger-status when a successor authorizing ADR is written
  during the Straylight MVP.
- Cite Phase 26A-0 as the canonical in-repo record of the
  Phase 15 → updated-rule narrowing of the review mechanism.

**Forbidden citations:**

- Cite ADR-026A0 / Phase 26A-0 as **universal permission to
  change any repo or bypass any gate**. Authority is bounded by
  the five discipline clauses and the Flatline requirement.
- Cite ADR-026A0 / Phase 26A-0 as **bypass authority for any
  ADR-022E gate**. No gate is relaxed; no trigger is loosened.
- Cite ADR-026A0 / Phase 26A-0 as **bypass authority for any
  Phase 25A / Phase 25B refusal rule**.
- Cite ADR-026A0 / Phase 26A-0 as **a substitute for
  Flatline / Bridgebuilder pre-push / pre-PR pass** for source /
  package / runtime / test / dependency / public-surface diffs.
- Cite ADR-026A0 / Phase 26A-0 as **a substitute for the
  Future-ADR contract above**. The contract is conjunctive; an
  ADR that omits any item is refusable.
- Cite ADR-026A0 / Phase 26A-0 as **pre-approval of any
  successor ADR**, including ADR-026A specifically.

### 7. Refusal rules — what ADR-026A0 does NOT authorize

Future PRs **must not** cite ADR-026A0 / Phase 26A-0 as
authorization for any of the following. Reviewers may cite this
section verbatim to refuse:

1. **No ADR-026A authorization.** ADR-026A remains an
   independently required, independently triggered, independently
   refusable decision.
2. **No runtime widening** of `@loa/straylight`,
   `@loa/straylight/host`, or any Loa stack repo's runtime
   surface.
3. **No Dixie endpoint.** ADR-022E gates #10 and #12 remain
   held.
4. **No Hounfour adoption.** ADR-022E gates #1–#5, #17, #18
   remain held.
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
9. **No storage / persistence change.** ADR-022E gate #8
   remains held.
10. **No new tag.** `v0.0.1` remains the sole release-
    consumption tag.
11. **No new release.**
12. **No package-surface change.**
13. **No sibling-repo edit by Phase 26A-0 alone.** The updated
    rule **permits** the operator to edit a sibling Loa stack
    repo under the five-clause discipline; it does not by itself
    constitute authorization for any specific sibling-repo edit.
14. **No relaxation of any ADR-022E gate.**
15. **No relaxation of any Phase 25A / Phase 25B refusal rule.**
16. **No relaxation of any Hounfour / Finn / Dixie / Freeside
    responsibility boundary.**
17. **No GitHub issue / comment / PR action by Phase 26A-0.**
18. **No Flatline / Bridgebuilder / red-team request from this
    phase** beyond the pre-merge pass on this ADR + companion
    handoff.

### 8. Scope limit

ADR-026A0 is **operator-authority and Flatline-rule
codification** only. It is not implementation; it is not
sequencing; it is not gate-trigger advancement. Reopening any
ADR-022E gate reopens ADR-026A0's evidence base; ADR-026A0 does
not protect any successor ADR from the gate-trigger conjunction
of its own gate.

## Explicit non-scope

ADR-026A0 inherits every non-goal from ADR-025A, ADR-025B,
ADR-024A through ADR-024K, and ADR-022A through ADR-022E
wholesale, and adds these Phase-26A-0-specific refusals:

1. **No file changes outside the four approved docs** named in
   §"Decision" §1.
2. **No prior-ADR edit.**
3. **No prior-handoff edit other than the two append-only
   updates listed in §"Decision" §1.**
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
    filed by Phase 26A-0.
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

## Consequences

- **Operator authority is on the record.** Reviewers of any
  future authorizing ADR may cite ADR-026A0 for the
  operator-authority discipline, and may refuse a successor ADR
  that treats ADR-026A0 as universal-permission citation.
- **Flatline / Bridgebuilder discipline is on the record.** The
  pre-push / pre-PR pass requirement is citable verbatim from
  §"Decision" §3.
- **The substrate is unchanged.** Post-Phase-25B surface,
  source, tests, fixtures, schemas, and dependencies are
  byte-identical after ADR-026A0 merges.
- **No implementation step is pre-approved.** ADR-026A0 is
  refusable as authorization on §"Decision" §6.Forbidden and
  §"Decision" §7.1–§7.18 grounds.
- **ADR-026A0 is additive to ADR-025A, ADR-025B, and
  ADR-022E.** It does not supersede any of them; reopening any
  one reopens ADR-026A0.
- **Flatline SKP-001 is closed by ADR-026A0** for the purpose of
  later ADRs needing a citable operator-authority trigger
  evidence source. SKP-001 closure does **not** discharge the
  pre-merge Flatline pass on any later ADR's PR.

## Source files inspected

- [`./0001-repo-purpose.md`](./0001-repo-purpose.md)
- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md) through [`./ADR-020E-commitment-root-deferral.md`](./ADR-020E-commitment-root-deferral.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md) through [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
- [`./ADR-024A-hounfour-116-substrate-intake.md`](./ADR-024A-hounfour-116-substrate-intake.md) through [`./ADR-024K-dixie-host-type-consumption-intake.md`](./ADR-024K-dixie-host-type-consumption-intake.md)
- [`./ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](./ADR-025A-recall-wedge-mvp-implementation-sequencing.md)
- [`./ADR-025B-hounfour-70-status-intake.md`](./ADR-025B-hounfour-70-status-intake.md)
- [`../handoffs/README.md`](../handoffs/README.md) (read-only at decision time; Phase 26A-0 appends an index entry only)
- [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md) (read-only at decision time; Phase 26A-0 appends a narrow cross-reference only)
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md) (read-only)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md) (read-only)
- [`../handoffs/phase-25a-recall-wedge-mvp-implementation-readiness.md`](../handoffs/phase-25a-recall-wedge-mvp-implementation-readiness.md) (read-only)
- [`../handoffs/phase-25b-hounfour-70-status-intake.md`](../handoffs/phase-25b-hounfour-70-status-intake.md) (read-only)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md) (read-only)
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (read-only)
