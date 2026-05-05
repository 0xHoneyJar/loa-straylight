# Straylight schema candidates

> Status: Phase 6 (inventory + boundary + fixtures), Phase 7
> (extraction handoff), Phase 8 (local Hounfour conformance
> vectors), and Phase 9 (Hounfour extraction issue / PR handoff
> packet). **Pre-extraction prep, in-repo only.** Nothing in this
> directory is a canonical Hounfour schema. Nothing in this directory
> is a cross-repo integration artifact. Nothing in this directory
> imports from a sibling repo or installs Hounfour as a dependency.
> Phase 9 is **handoff prep** — it stages the issue and PR checklist
> a future `loa-hounfour` change will consume; it does **not**
> perform the extraction, file the issue, or open the PR.

## What this directory is

Phase 6 stages the local Straylight Recall Wedge primitives so they can
become future [`loa-hounfour`](https://github.com/0xHoneyJar/loa-hounfour)
schema candidates *later, in a separate change*. The wedge currently
keeps every primitive (Actor, ActorEstate, Assertion, Keyring, …) inside
this repository under `src/straylight/types.ts` and the validators in
`src/straylight/validators/`. That keeps the wedge honest as a local,
deterministic prototype but blocks cross-repo reuse.

This directory makes the schema-extraction handoff explicit *without
performing the extraction*. It contains:

- [`hounfour-schema-extraction-prep.md`](./hounfour-schema-extraction-prep.md)
  — the inventory of which Straylight types are candidates for
  Hounfour ownership later, what the current source location is for
  each, and what should stay in `loa-straylight`.
- [`class-vs-policy-boundary.md`](./class-vs-policy-boundary.md) — a
  written contract pinning the boundary between class-validation
  schemas (structural shape) and policy-decision artifacts (runtime
  authority). Hounfour will own the former; `loa-straylight` keeps
  the latter.
- [`hounfour-extraction-plan.md`](./hounfour-extraction-plan.md) —
  Phase 7 engineering handoff. Classifies each candidate as
  `move_to_hounfour` or `stay_in_straylight`, defines the
  conformance bar Hounfour must satisfy before `loa-straylight`
  consumes it, and sketches the future-PR sequence. Does not
  perform the extraction.
- [`hounfour-conformance-vectors.md`](./hounfour-conformance-vectors.md)
  — Phase 8 local conformance vectors. Pins 12 deterministic JSON
  vectors per validation layer (`class_validation`,
  `policy_validation`, `audit_validation`, `keyring_validation`)
  under [`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/).
  Written by `npm run hounfour:conformance`. **Not** canonical
  Hounfour schemas; intended as future Hounfour test inputs.
- [`docs/handoffs/`](../handoffs/) — Phase 9 handoff packet for the
  future `loa-hounfour` issue and PR. Three documents:
  [`hounfour-schema-extraction-issue.md`](../handoffs/hounfour-schema-extraction-issue.md)
  (GitHub-issue-ready handoff with title, summary, schema list,
  acceptance criteria, no-go boundaries),
  [`hounfour-schema-extraction-pr-checklist.md`](../handoffs/hounfour-schema-extraction-pr-checklist.md)
  (the review checklist that a future PR-A and PR-B should clear),
  and
  [`hounfour-extraction-mapping.md`](../handoffs/hounfour-extraction-mapping.md)
  (the table mapping each Straylight primitive to a proposed
  Hounfour schema name, file path, classification, validation
  layer, and conformance fixture). The summary is reproducible
  via `npm run hounfour:handoff`. **Phase 9 stages the packet —
  it does not file the issue, open the PR, or start integration.**

The matching JSON example shapes live one directory up at
[`fixtures/schema-candidates/`](../../fixtures/schema-candidates/) (Phase 6
current-shape examples) and
[`fixtures/hounfour-conformance/`](../../fixtures/hounfour-conformance/)
(Phase 8 conformance vectors) so the helper scripts and conformance tests
can read them as plain files.

## What this directory is **not**

- **Not** official Hounfour schemas. The fixtures here are *examples of
  current shape only*. They are not generated, not signed by Hounfour,
  not the canonical contract for any cross-repo consumer. When Hounfour
  schema extraction actually happens, the canonical schemas will live
  in `loa-hounfour` and replace whatever appears here.
- **Not** cross-repo integration. Phase 6 does not add Hounfour, Finn,
  Dixie, or Freeside as a dependency. It does not import from any
  sibling repo. It does not write to `.loa/`, `.claude/`, or any
  framework internal.
- **Not** a runtime contract. Nothing in `src/straylight/` reads from
  this directory at runtime. The fixtures are for documentation,
  inspection, and pre-extraction review only.
- **Not** a generated-schema pipeline. Phase 6 does not introduce a
  schema-generation dependency (TypeBox, JSON Schema generators, etc.).
  The helper at `scripts/export-schema-candidates.ts` writes the same
  fixture examples deterministically — a future `loa-hounfour` will
  generate canonical schemas independently.
- **Not** a behavior change. Phase 6 leaves Phase 0–5 runtime semantics
  exactly as they were. The wedge passes the same `npm test`,
  `npm run demo:recall`, and `npm run demo:recall:json` checks.

## Intended next step (out of scope for Phase 6, 7, 8, and 9)

Review this inventory, the class-vs-policy boundary, the Phase 7
extraction plan, the Phase 8 conformance vectors, and the Phase 9
handoff packet under [`docs/handoffs/`](../handoffs/), then *in a
separate change in a separate repository*, extract the chosen
candidates into `loa-hounfour` as canonical schemas. At that point:

1. `loa-hounfour` becomes the schema source of truth for the candidate
   types listed here.
2. `loa-straylight` removes the locally-owned shape of those types and
   re-exports them from `@loa/hounfour` (or equivalent) — the
   `src/straylight/index.ts` barrel stays the only public entrypoint.
3. The fixtures here are replaced by Hounfour-generated conformance
   vectors, and this directory either evolves into a thin pointer
   document or is deleted.

Until that change ships, treat everything here as **pre-extraction
prep, frozen in time**. Edits are fine while the wedge evolves; cross-
repo wiring is not.

## Phase 9 — Hounfour extraction issue / PR handoff packet

Phase 9 stages the artifacts a future `loa-hounfour` change will
consume. The packet lives under [`docs/handoffs/`](../handoffs/)
and contains the issue handoff, the PR review checklist, and the
extraction mapping table. None of these documents file the issue,
open the PR, or start cross-repo integration; they are the
**inputs** for that work, written and committed inside
`loa-straylight` so the future change can pick them up cleanly.

Run `npm run hounfour:handoff` to print the packet's document paths
and conformance vector counts. The script is local-only, does not
import from `loa-hounfour` or any sibling repo, and does not claim
that integration is complete.
