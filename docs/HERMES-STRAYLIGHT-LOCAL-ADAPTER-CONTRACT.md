# Hermes ↔ Loa-Straylight — Local Adapter Boundary Contract

> **Fixture-only design artifact.** This document describes a *proposed* local
> adapter boundary by which Hermes could translate its own diary/journal
> material into Loa-Straylight's type contract. It is design only. No code in
> this document runs, imports Straylight runtime JS, or implies any deployment.

---

## Status

- **design-only** — a contract sketch, not an implementation.
- **local-only** — same-machine / same-process framing; no network, no service.
- **fixture-only** — illustrated with one worked scenario, not wired behavior.
- **no implementation** — no functions, classes, or harness are created.
- **no runtime import** — no `import` of any `@loa/straylight` runtime JS or
  any `src/straylight/*.js`/`.ts` module.
- **no deployment claim** — Loa-Straylight is **not** deployed live anywhere;
  nothing here asserts a live recall service, estate store, or endpoint.

**Verified target claim (operator-adjudicated, this lane):**
> Hermes can be designed to consume Loa-Straylight locally at the
> type/package-contract level today; executable local
> validation/admission/recall would require either a source-local harness or a
> future explicit runtime export.

**Forbidden claims (must never be stated):**
- "Hermes is backed by live deployed Straylight."
- "Hermes consumes Straylight at runtime."
- "Hermes can call root package runtime APIs."
- "Hermes can use `handleRecallIntake` as its adapter boundary."
- "The adapter is implemented."

---

## Boundary — the three layers

These three are **not interchangeable**. The phrase "import the package or its
source" is retired as an unsafe collapse.

### Layer A — Supported package / **type** contract consumption  `[E]`

- `@loa/straylight` root export is **`types`-only** (`package.json` `exports["."]`
  carries a `types` condition and **no** `import`/`require`).
- `@loa/straylight/host` export is **`types`-only** (same).
- Hermes may design against the exported declaration shapes:
  `CandidateAssertion`, `ProvenanceRef`, `AssertionClass`, `AssertionStatus`,
  `ProvenanceSourceType`, `RecallRequest`, `RecallPack`, `RecallReceipt`,
  `SignatureEnvelope` (observed under `dist-types/src/straylight/`).
- **Allowed:** design Hermes types against this contract surface.
- **Forbidden:** call root validation/policy functions from the *built package*
  at runtime — no such runtime export exists; those symbols ship as `.d.ts`
  only.

### Layer B — Packaged **runtime** consumption  `[E]`

- The **only** packaged runtime JS export is
  `@loa/straylight/runtime/recall-intake`
  (`exports["./runtime/recall-intake"].import` →
  `./dist/src/straylight/runtime/recall-intake/index.js`).
- Its entrypoint `handleRecallIntake` is **Dixie-gated** via a deployment-bound
  capability key; a non-Dixie caller is refused.
- **Allowed:** state that this seam exists.
- **Forbidden:** treat it as a Hermes-facing adapter boundary. It is **not**.

### Layer C — Source-local / repo-local harness  `[?]` (future-only)

- Executable validation / policy / admission / recall behavior exists today
  **only** as source-local repo code under `src/straylight/`.
- Using it would be a **source-local harness** — reaching into another repo's
  internal source — **not** supported package-consumer behavior.
- Before Hermes could consume validation/policy/admission as a *supported
  runtime package API*, a **future explicit runtime export**
  (a Straylight package-surface change, gated by its own ADR) would be required.
- This document neither authors nor assumes that change. A source-local harness
  is **future-only unless separately authorized**.

---

## One fixture scenario (worked, non-executed)

**Raw source material (Hermes side):** a diary/journal line such as
> "2026-06-14 — operator adjudicated full-suite Straylight run: 45 files / 1075
> tests, exit 0."

This is **source material only**. It has *zero* standing as estate authority.
Writing it, recalling it, or counting it grants it no force.

**Step 1 — candidate observation envelope.** Hermes maps the line into a
`CandidateAssertion`-shaped envelope (see field mapping below), labelled `[?]`,
flagged `non_authority = true`, `state = "not admitted yet"`.

**Step 2 — explicit not-admitted state.** The envelope is a *candidate*. It is
**not** an `Assertion`, **not** active estate state, **not** Hermes memory.

**Step 3 — required adjudication before admission.** Admission requires, in
order: class validation → policy disposition → **operator authorization
(`[A]`/`[V]`)** → receipt/provenance. Absent any one, the candidate stays `[?]`.

**Step 4 — refusal path.** If evidence is missing, the source is ambiguous, the
class is unsupported, the privacy boundary is unclear, or no operator
adjudication exists → the candidate is **rejected** (a first-class outcome) and
remains `[?]`. It is never silently retained as fact.

---

## Envelope fields — minimal mapping to observed Straylight concepts

Mapping a proposed `HermesCandidateEnvelope` to the observed `CandidateAssertion`
shape. (Type targets are Layer A `[E]`; executable use is Layer C `[?]`.)

| Envelope field | Straylight concept | Notes |
|---|---|---|
| `estate_id` | `CandidateAssertion.estate_id` | which estate the candidate targets |
| `actor_id` | `CandidateAssertion.actor_id` | the actor the assertion is about |
| `assertion_class` | `AssertionClass` | default `observation` for diary-origin |
| `body` | `CandidateAssertion.body` | `Record<string, unknown>` claim payload |
| `provenance` | `ProvenanceRef[]` | source_uri (journal path / msg id), observed_at, captured_by, evidence_summary |
| `privacy_scope` | `CandidateAssertion.privacy_scope?` | public/private classification; fail closed if unclear |
| `risk_level` | `CandidateAssertion.risk_level?` | optional risk grading |
| `recall_scope` | `CandidateAssertion.recall_scope?` | scopes under which it may be recalled |
| `confidence` | `CandidateAssertion.confidence?` | optional numeric confidence |
| `subject_refs` | `CandidateAssertion.subject_refs?` | referenced subjects |
| `linked_assertion_refs` | `CandidateAssertion.linked_assertion_refs?` | links to other assertions |
| `signatures` | `SignatureEnvelope[]` | dev-signature only in any local design; non-production |

**Hermes-side status label** (orthogonal to Straylight status, supplied by the
adapter discipline):
- `[?]` — candidate / hypothesis / unverified. Default at envelope creation.
- `[E]` — evidence located; rides as a populated `ProvenanceRef`
  (path/cmd/line/PR + `evidence_summary`).
- `[V]` — verified; minted **only** at the admission gate, **only** after
  class validation + policy + **operator adjudication**. Never adapter-minted.
- `[A]` — authorized action; the operator permission that unlocks an admission
  or transition. Never adapter-synthesized.

---

## Admission boundary

- A candidate is **not admitted memory**. Admission writes to a Straylight
  estate object, not to Hermes MEMORY.md, unless a *separate* operator `[A]`
  authorizes a memory write.
- **Diary/journal text does not self-promote.** No volume of writing,
  summarizing, counting, or recalling confers authority.
- **Class validation is separate from policy/adjudication.** Passing structural
  class validation is necessary but **not** sufficient; policy + operator
  authorization are distinct subsequent gates.
- **Operator authorization required.** `[A]`/`[V]` are operator-supplied; the
  adapter cannot originate them.
- **Receipt/provenance required.** An admitted assertion carries provenance and
  yields a receipt; no receipt → no admission.
- **Rejection is a first-class outcome.** A rejected candidate stays `[?]`, is
  logged, and is never silently kept.
- **Supersession/correction must not rewrite history.** Post-admission, an
  assertion may move through `contested | demoted | revoked |
  forgotten_from_recall | superseded | sealed` — each as a *new, provenance-
  bearing transition*, never an in-place edit that erases the prior record.

---

## Recall boundary

- Recall output is **context with provenance**, carrying its `RecallPack` /
  `RecallReceipt`.
- Recall output is **not automatic authority** — Hermes consuming a recalled
  pack does not make its contents a Hermes fact without separate adjudication.
- Recalled material **preserves source/evidence status** — a `[?]` candidate
  recalled is still `[?]`; recall does not upgrade a label.
- The **public/private boundary fails closed** — if privacy scope is unclear,
  the item is excluded from recall rather than leaked.

---

## Fail-closed table

| Condition | Behavior |
|---|---|
| Missing evidence | Refuse admission; candidate stays `[?]`. |
| Ambiguous source | Refuse; require disambiguation; never guess. |
| Unsupported assertion class | Class validation fails → refuse (`class_validation_failed`). |
| Unclear privacy boundary | Refuse / exclude from recall (`privacy_scope_refusal`). |
| Attempted self-promotion | Hard refuse — `[V]`/`[A]` require operator; structural. |
| No operator adjudication | Refuse (`policy_unavailable` / no `[A]`). |
| Attempt to use Dixie-gated runtime seam | Not authorized for Hermes; refuse — `handleRecallIntake` is Layer B, Dixie-gated, returns `denied`/`storage_unavailable` to non-Dixie callers. |
| Request for live Straylight deployment when none exists | Refuse — Straylight is not deployed; do not imply endpoint wiring. |

---

## Non-goals

- no implementation
- no tests
- no build
- no package export changes
- no source-local harness
- no `handleRecallIntake` use
- no `npm pack` / `npm publish`
- no live endpoint
- no real Dixie / Finn / Freeside / Hounfour runtime verification
- no automatic memory writes

---

## Next possible slices (future options — each requires a separate `[A]`)

- **Type-only TypeScript sketch** — a non-executed `.ts`/markdown showing the
  envelope shape, explicitly not importing runtime JS (Layer A type exercise).
- **Source-local harness proposal** — a *proposal only* enumerating which
  `src/straylight/` imports would be needed and why that is Layer C, not
  package-consumer behavior.
- **Future package runtime export ADR** — a Straylight-side decision to widen a
  root/host export beyond `types`, if and only if Straylight chooses to support
  a runtime package API.
- **Live deployment lane** — only if Loa-Straylight is actually deployed later;
  not in scope while no deployment exists.

---

*End of contract. Document-only; no runtime behavior is defined or invoked.*
