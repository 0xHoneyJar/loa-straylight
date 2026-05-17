# Phase 26A-1 — Threat-model amendment for the future Dixie recall-intake endpoint (docs-only)

> Status: Phase 26A-1 is a **docs-only, threat-model-only**
> amendment that records the threat-model prerequisites surfaced
> by Flatline SKP-002 (resource exhaustion / DoS / unbounded
> `InMemoryStorage`), SKP-003 (replay semantics), and SKP-004
> (concurrency posture) for the *future* Dixie recall-intake
> endpoint. Phase 26A-1 has **no companion ADR** because this
> phase authorizes nothing.
>
> Phase 26A-1 follows Phase 26A-0 (PR #41), which resolved
> SKP-001 by establishing a stable, in-repo, citable source for
> the operator-authority discipline. Phase 26A-0's companion
> decision-lock is
> [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md);
> Phase 26A-0's summary handoff is
> [`./phase-26a0-operator-authority-flatline-rule.md`](./phase-26a0-operator-authority-flatline-rule.md).
>
> Phase 26A-1 records threat-model prerequisites *for* a future
> authorizing ADR. It does **not** close those prerequisites; it
> writes them down. Closure is the later authorizing ADR's job.
>
> Phase 26A-1 does **not** close SKP-005 (future ADR-026A /
> runtime-subpath / experimental pre-Finn API surface design).
> SKP-005 remains open for that later authorizing ADR. Phase
> 26A-1 may reference SKP-005 as still unsolved; it does not
> claim to resolve it.
>
> Phase 26A-1 does **not** authorize ADR-026A, does **not**
> authorize runtime widening, does **not** authorize a Dixie
> endpoint, does **not** authorize package-surface changes, does
> **not** authorize Hounfour adoption, does **not** authorize
> Finn wiring, does **not** authorize Freeside wiring, does
> **not** authorize Loa framework edits, does **not** authorize
> storage / production persistence change, does **not** authorize
> tags or releases, and does **not** authorize sibling-repo
> edits.
>
> Phase 26A-1 does **not** create or relax any ADR-022E gate,
> does **not** weaken any Hounfour / Finn / Dixie / Freeside
> responsibility boundary, does **not** weaken any Phase 25A or
> Phase 25B refusal rule, and does **not** weaken any Phase
> 26A-0 refusal rule. ADR-022E gates and Phase 25A / 25B / 26A-0
> refusal rules **remain binding**.
>
> Phase 26A-1 edits only:
>
> - [`../mvp/threat-model.md`](../mvp/threat-model.md) (substantive
>   amendment: T13–T18 added; T9 amended with persistence
>   posture; status banner and out-of-scope notes updated to
>   cross-reference this phase),
> - this handoff (new),
> - [`./README.md`](./README.md) (append-only Phase 26A-1 index
>   entry).
>
> No prior ADR is edited. No prior handoff is edited other than
> the one append-only update above. No file under
> [`../../src/`](../../src/),
> [`../../tests/`](../../tests/),
> [`../../fixtures/`](../../fixtures/),
> [`../../scripts/`](../../scripts/), or
> [`../../dist-types/`](../../dist-types/) is touched. No
> `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`,
> `tsconfig*`, or `vitest.config.ts` is touched. No
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

## Why Phase 26A-1 exists

Phase 26A-0 (PR #41) resolved Flatline SKP-001 by establishing a
stable, in-repo, citable source for the operator-authority
discipline. That closure unblocked the operator-authority leg of
the future ADR-026A; it left every other Flatline finding open.

A real 3-model Flatline pass on Phase 26A Option C2 also surfaced:

- **SKP-002 — Resource exhaustion / DoS / unbounded
  `InMemoryStorage`.** Flatline refused informational-only
  treatment. The future endpoint's per-tenant memory footprint,
  request body size, and per-tenant rate posture must be
  recorded as merge-blocking prerequisites before the endpoint
  is contemplated.
- **SKP-003 — Replay semantics.** Flatline required an explicit
  choice: idempotent replay handling by default, or — if the
  MVP cannot implement idempotency — explicit duplicate-audit-OK
  semantics with tests proving replay cannot alter
  authorization.
- **SKP-004 — Concurrency posture.** Flatline required an
  explicit choice between per-estate serialization and an
  explicit non-horizontal deployment constraint, enforced in
  code / config / docs with tests; vague "single-instance" prose
  was rejected as insufficient.
- **SKP-005 — Future ADR-026A / runtime-subpath / experimental
  pre-Finn API surface design.** Out of scope for Phase 26A-1.
  Remains open for the later authorizing ADR.

Phase 26A-1 records the threat-model prerequisites surfaced by
SKP-002, SKP-003, and SKP-004 in
[`../mvp/threat-model.md`](../mvp/threat-model.md). It does not
implement any of them. It does not authorize the endpoint that
would have to honor them. It writes the constraints down so a
later authorizing ADR — notably ADR-026A — can cite a stable,
in-repo source for the threat-model leg it must satisfy, in the
same way Phase 26A-0 / ADR-026A0 is the stable, in-repo source
for the operator-authority leg.

## Summary of threat-model changes

The threat-model rows added or amended by Phase 26A-1 are:

- **T13 — Network adversary at the future Dixie recall-intake
  endpoint.** Tamper / replay / forged HTTP `RecallIntakeRequest`.
  Endpoint is future work, not authorized. First line: Dixie
  ingress validation. Second line (only if separately authorized
  later): future Straylight recall-intake runtime seam. Future
  tests: Dixie ingress tests.
- **T14 — Cross-tenant authorization at network ingress.** Dixie
  must resolve authoritative tenant from authenticated context
  before invoking any Straylight runtime seam; caller-supplied
  tenant cannot be trusted. Future tests: Dixie cross-tenant
  ingress tests + later runtime-subpath tests.
- **T15 — Replay against the Dixie recall-intake endpoint.**
  Required default: idempotent replay handling for matching
  authenticated caller + replay key / request identity, returning
  the prior receipt rather than appending duplicate state. If
  the later MVP cannot implement idempotency, the later ADR
  must explicitly document duplicate-audit-OK semantics and
  test that replay cannot alter authorization. Phase 26A-1
  implements neither; it records the threat-model requirement.
  Future tests: replay / idempotency tests.
- **T16 — HTTP-driven concurrency against `InMemoryStorage`.**
  Required choice: per-estate serialization, or explicit
  single-process / single-instance / non-horizontal deployment
  constraint enforced in code / config / docs with tests. Vague
  "single-instance" prose alone is insufficient. Future tests:
  per-estate serialization or single-instance refusal tests.
- **T17 — Resource exhaustion / DoS at the Dixie endpoint.**
  Must not remain merely informational (SKP-002 closure). Later
  endpoint not mergeable unless it has all four of: request body
  size limit, per-tenant rate limit / equivalent throttle,
  per-tenant memory cap / bounded estate storage posture, and
  refusal behavior when limits are exceeded. Future tests:
  rate-limit / body-size / memory-cap tests.
- **T18 — Cross-instance state divergence under
  `InMemoryStorage`.** Horizontal / multi-process /
  load-balanced deployment is out of scope unless ADR-022E gate
  #8 fires or a separate storage / concurrency ADR fires. Later
  code / config / docs must prevent or loudly refuse
  multi-process deployment if `InMemoryStorage` is used. Future
  tests: single-instance / multi-instance refusal tests.
- **T9 amendment — persistence posture.** `InMemoryStorage` at
  the future MVP endpoint is process-memory-only; does not
  survive process restart; is not a production persistence
  adapter. Production persistence remains held behind ADR-022E
  gate #8. `JsonlStorage` must not be used at a live HTTP
  endpoint unless ADR-022E gate #8 fires or a separate
  adapter / concurrency ADR authorizes it.

Each new or amended row carries a "Future tests" pointer. Phase
26A-1 adds **no** test, no fixture, no script, no source, no
declaration, and no schema. The pointers describe later test
classes a later authorizing ADR's PR is expected to add.

## Refusal rules — what Phase 26A-1 does NOT authorize

Future PRs **must not** cite Phase 26A-1 as authorization for any
of the following. Reviewers may cite this section verbatim to
refuse:

1. **No ADR-026A authorization.** ADR-026A remains an
   independently required, independently triggered, independently
   refusable decision. Phase 26A-1 is **threat-model
   prerequisites only**; ADR-026A must still provide its own
   trigger evidence, scope, tests, rollback, and Flatline result.
2. **No runtime widening** of `@loa/straylight`,
   `@loa/straylight/host`, or any Loa stack repo's runtime
   surface.
3. **No Dixie endpoint.** No HTTP / NATS / REST / Discord /
   Telegram / WebSocket / RPC endpoint is authorized by Phase
   26A-1. ADR-022E gates #10 and #12 remain held.
4. **No package-surface change.** Sections 1–11 of
   [`../mvp/package-boundary.md`](../mvp/package-boundary.md) and
   the `./host` six-handler / two-helper / `*Deps` surface are
   unchanged.
5. **No Hounfour adoption.** ADR-022E gates #1–#5, #17, #18
   remain held.
6. **No Finn wiring.** ADR-022E gate #9 remains held.
7. **No Freeside wiring.** ADR-022E gate #11 remains held.
8. **No Loa framework edits authorized by Phase 26A-1.** Each
   specific framework edit remains subject to its own
   authorization, scope, discipline check, and pre-push Flatline /
   Bridgebuilder pass per Phase 26A-0.
9. **No storage / persistence change.** `InMemoryStorage` /
   `JsonlStorage` unchanged. ADR-022E gate #8 remains held.
10. **No new tag.** `v0.0.1` remains the sole release-consumption
    tag.
11. **No new release.** No GitHub Release is created by Phase
    26A-1 or by any phase that cites only Phase 26A-1 as its
    trigger.
12. **No sibling-repo edit.**
13. **No GitHub issue / comment / PR action filed by Phase
    26A-1.**
14. **No SKP-005 closure.** SKP-005 (future ADR-026A /
    runtime-subpath / experimental pre-Finn API surface design)
    remains open. Phase 26A-1 does not close it; later
    authorizing ADR work does.
15. **No relaxation of any ADR-022E gate, any Phase 25A /
    Phase 25B / Phase 26A-0 refusal rule, or any Hounfour /
    Finn / Dixie / Freeside responsibility boundary.**
16. **No pre-approval of any successor ADR**, including
    ADR-026A specifically. Phase 26A-1 is threat-model
    prerequisites; it is not an ADR pre-write.

## Future-ADR contract reminder

Any future ADR that draws on Phase 26A-1 must cite **both**:

- **Phase 26A-0 / ADR-026A0** for the operator-authority leg
  (stable in-repo authority record).
- **Phase 26A-1 (this handoff) +
  [`../mvp/threat-model.md`](../mvp/threat-model.md)** for the
  threat-model prerequisites leg.

The future-ADR contract from Phase 26A-0 §"Future-ADR contract"
remains binding. A future ADR that cites Phase 26A-0 / ADR-026A0
and Phase 26A-1 still must provide on its own, or it remains
refusable:

1. **Exact trigger evidence** beyond the operator-authority
   discipline and the threat-model prerequisites — what
   specifically triggered *this* ADR's scope.
2. **Scope** — exactly what surfaces / files / behaviors the
   ADR authorizes. Bounded, additive, citable.
3. **Threat-model impact statement** — how the ADR's scope
   maps onto T13–T18 and the T9 amendment recorded by Phase
   26A-1. Each row the ADR's scope touches must be cited and
   answered (chosen defense, chosen tests). Rows the ADR does
   not touch must be left explicitly untouched.
4. **Tests** — the actual test classes the ADR authors,
   replacing the "Future tests" pointers Phase 26A-1 wrote
   down.
5. **Rollback** — exactly how the ADR's changes are reverted
   if the gate it unblocks is re-held.
6. **Flatline result** — verdict and SKP-* IDs from the
   pre-merge Flatline / Bridgebuilder pass on the ADR's PR. A
   REVISE or BLOCK verdict requires resolution before the ADR
   is accepted.

Phase 26A-1 does not pre-approve, pre-resolve, or pre-shortcut
any item above.

## Validation

Phase 26A-1 is **docs-only**. Package surface, source, tests,
fixtures, schemas, declarations, and dependencies are
byte-identical to the post-Phase-26A-0 baseline (post-PR-#41
`main`).

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
  dist-types/ docs/mvp/package-boundary.md
git diff --stat
git status --short
git tag --list v0.0.1
git rev-parse v0.0.1^{commit}
git cat-file -t v0.0.1
git tag --list 'v0.0.2' 'v0.0.3'
```

### Expected outcomes

- `npm run typecheck` — clean.
- `npm test` — passes identically to the post-Phase-26A-0
  baseline (no test added; no test edited).
- `npm run build` — clean; rebuilt `dist-types/` byte-identical
  to the committed artifact.
- Both declaration entrypoints exist.
- `npm pack --dry-run` — tarball preview unchanged from Phase
  24H/I/J/K/L / 25A / 25B / 26A-0.
- Forbidden-path `git diff` — **empty**. Note that
  [`../mvp/threat-model.md`](../mvp/threat-model.md) is **not**
  on the forbidden-path list for Phase 26A-1: it is the
  primary target of this phase.
- `git diff --stat` — shows only the three Phase 26A-1 docs
  ([`../mvp/threat-model.md`](../mvp/threat-model.md), this
  handoff, and the [`./README.md`](./README.md) Phase 26A-1
  index entry).
- `git status --short` — shows the three Phase 26A-1 docs plus
  any pre-existing local dirt.
- `git tag --list v0.0.1` — prints `v0.0.1`.
- `git rev-parse v0.0.1^{commit}` — prints the post-Phase-25B
  recording baseline commit (unchanged by Phase 26A-0 and
  unchanged by Phase 26A-1).
- `git cat-file -t v0.0.1` — prints `tag`.
- `git tag --list 'v0.0.2' 'v0.0.3'` — prints **nothing**.

## Cross-references

- Companion-of-record (operator-authority leg, predecessor
  phase):
  [`./phase-26a0-operator-authority-flatline-rule.md`](./phase-26a0-operator-authority-flatline-rule.md)
  +
  [`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md).
- Implementation-sequencing decision-lock:
  [`./phase-25a-recall-wedge-mvp-implementation-readiness.md`](./phase-25a-recall-wedge-mvp-implementation-readiness.md)
  +
  [`../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md`](../decisions/ADR-025A-recall-wedge-mvp-implementation-sequencing.md).
- Hounfour status intake:
  [`./phase-25b-hounfour-70-status-intake.md`](./phase-25b-hounfour-70-status-intake.md)
  +
  [`../decisions/ADR-025B-hounfour-70-status-intake.md`](../decisions/ADR-025B-hounfour-70-status-intake.md).
- Implementation gate inventory:
  [`../decisions/ADR-022E-phase-22-deferred-features.md`](../decisions/ADR-022E-phase-22-deferred-features.md).
- Threat model (primary target of this phase):
  [`../mvp/threat-model.md`](../mvp/threat-model.md).
- Stable surface (read-only; not edited by this phase):
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md).
- Per-packet handoff index:
  [`./README.md`](./README.md).
