# Straylight schema candidates

> Status: Phase 6. **Pre-extraction prep, in-repo only.** Nothing in this
> directory is a canonical Hounfour schema. Nothing in this directory is
> a cross-repo integration artifact. Nothing in this directory imports
> from a sibling repo or installs Hounfour as a dependency.

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

The matching JSON example shapes live one directory up at
[`fixtures/schema-candidates/`](../../fixtures/schema-candidates/) so the
helper script and conformance tests can read them as plain files.

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

## Intended next step (out of scope for Phase 6)

Review this inventory and the class-vs-policy boundary, then *in a
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
