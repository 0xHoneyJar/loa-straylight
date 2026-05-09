# ADR-022C — Schema dependency direction (decision-lock for Phase 22A)

## Status

Accepted-for-Phase-22A.

This ADR is a Phase 22A MVP decision-lock. It records the
**direction** of the schema dependency edges between
`loa-straylight`, `loa-hounfour`, `loa-finn`, `loa-dixie`, and
`loa-freeside` for MVP, restated against the v8.6.0 substrate
Phase 21B mapped. It complements ADR-020C (namespace strategy)
and ADR-022A (semantic home) by stating, as a directed graph,
who depends on whose schemas. **Phase 22A authors no schema, flips
no import, edits no sibling repo, and changes no `package.json`.**

## Context

ADR-020C set the namespace *strategy*: Hounfour is the canonical
schema *candidate*; Straylight adopts schema shapes by **alias /
re-export**, not by rename; the wedge consumes Hounfour at v8.6.x
through the **private** alias module
([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)),
not through the public surface.

Phase 21B established the substrate available at v8.6.0:

- 11 declared JS module subpaths (`./core`, `./economy`,
  `./model`, `./governance`, `./constraints`, `./integrity`,
  `./graph`, `./composition`, `./commons`, `./vectors`) plus the
  `./schemas/*` file-level subpath. Of the JS subpaths, only
  what the wedge already touches is consumed; ten are exported
  but unconsumed.
- 9 MATCH + 1 EXTEND schema dispositions resolved against
  `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`, plus
  `Challenge` newly resolved at v8.6.0 (delta #7 schema-level
  closure).
- `EstateTransition` schema absent (delta #8 queued).
- `AuditEvent` (under that name) not shipped; v8.6.x ships
  `audit-trail-entry.schema.json` and `domain-event.schema.json`.
- `safeCanonicalize` JS subpath undeclared; gate
  `no-confirmed-subpath` unchanged.

ADR-022A reaffirmed Loa-Straylight as the semantic home; ADR-022B
recorded the host criteria for the MVP endpoint. ADR-022C closes
the loop: with the substrate mapped and ownership reaffirmed, the
**directed graph** of schema dependency in MVP must be explicit
so future endpoint / runtime work cannot silently invert it.

## Decision

The MVP schema dependency graph is **acyclic**, points **toward
the contract owner**, and stops at the wedge boundary.

### 1. Direction: Loa-Straylight ← Hounfour (adopt-by-alias)

`loa-straylight` is the **adopter**; `loa-hounfour` is the
**substrate**. The wedge consumes Hounfour shapes via the
private alias module, not via the public surface. Concretely:

- The wedge depends on `@0xhoneyjar/loa-hounfour@^8.6.0` as a
  declared `package.json` dependency. This dependency is
  **substrate**, not **ownership transfer** (per ADR-022A).
- Adoption of any specific Hounfour schema into the wedge's
  public surface is by a **separate ADR** that:
  - Cites the v8.6.x `$id` (under
    `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.0/`).
  - Specifies the alias / re-export path through
    [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts).
  - Pins a boundary preservation test against
    [`../../tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts)
    (or a new equivalent test).
- `Challenge` (now upstream at v8.6.0) is **not adopted by
  Phase 22A**; adoption requires the separate ADR above.
- `EstateTransition` is **not adopted** because the schema is
  absent in v8.6.x (delta #8). The Straylight-side primitive
  stays local in
  [`../../src/straylight/estate.ts`](../../src/straylight/estate.ts).
- `safeCanonicalize` is **not adopted by JS subpath** (gate
  `no-confirmed-subpath`). The local canonicalizer at
  [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts)
  is the wedge's canonicalization implementation.

### 2. Direction: Hounfour does not depend on Straylight

`loa-hounfour` is the protocol / schema package. It must not, by
the structure of this graph, take a schema dependency on
`loa-straylight`. Phase 22A authors no Hounfour-side schema and
no Hounfour-side change of any kind. The Phase 19A pending
feedback on
[`0xHoneyJar/loa-hounfour#70`](https://github.com/0xHoneyJar/loa-hounfour/issues/70)
remains the upstream coordination channel; Phase 22A may *draft*
a status comment in-repo but does not file it.

### 3. Direction: Finn ← Hounfour (consume schemas) and Finn ← Straylight (semantic contract)

When Finn ships its Phase 10 enforcement boundary, its schema
dependencies will be:

- **Schema shapes:** consumed from Hounfour, by alias / re-export,
  using the same subpath-import discipline the wedge follows
  (delta #9).
- **Semantic contract:** the wedge's stable public surface
  ([`../../src/straylight/index.ts`](../../src/straylight/index.ts))
  remains the single source of truth for what Straylight means by
  each primitive. Finn enforces that contract; it does not
  redefine it. Per
  [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md):
  Finn does not own canonical schema authority; Finn does not
  collapse class-vs-policy; Finn does not bypass the keyring.

Phase 22A authorizes **no** Finn-side schema or Finn-side
boundary preparation work (per Phase 21B Q5).

### 4. Direction: Dixie ← Hounfour (consume schemas) and Dixie ← Straylight (semantic contract); Dixie does not author canonical schemas

Symmetric to Finn:

- **Schema shapes:** consumed from Hounfour by alias / re-export.
- **Semantic contract:** the wedge's stable public surface owns
  what each primitive means; Dixie surfaces — it does not
  re-define. Per
  [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md):
  Dixie is not a canonical-schema authority; Dixie is not a
  generic retrieval substitute; Dixie does not re-mint receipts.

Phase 22A authorizes **no** Dixie-side schema or Dixie-side
boundary preparation work (per Phase 21B Q5).

### 5. Direction: Freeside ← {Dixie, Finn} (consume governed recall) ← Straylight (semantic contract); Freeside does not depend on Hounfour directly

Freeside is the *outermost* node:

- It consumes already-governed recall outputs from Dixie (and
  audit / receipt outputs from Finn, mediated through Dixie or
  Finn's exposure surface).
- It does not consume Hounfour schemas directly. Per
  [`../handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md):
  Freeside does not own canonical schemas; Freeside does not
  redefine primitive shapes; Freeside surfaces.
- It does not author or re-mint receipts.
- It is **not** a candidate MVP endpoint host (per ADR-022B
  decision #3).

Phase 22A authorizes **no** Freeside-side work.

### 6. Acyclicity is required

The graph is acyclic:

```
            (canonical schema substrate)
                        |
                  loa-hounfour
                  /     |     \
                 v      v      v
         loa-straylight loa-finn loa-dixie
                 \      /         |
                  \    /          |
                   v  v           v
                (semantic       (semantic
                 contract)       contract)
                    ^               ^
                    |               |
                 loa-finn        loa-dixie
                                    |
                                    v
                                loa-freeside
```

- Hounfour → all consumers (substrate).
- Straylight → Finn, Dixie (semantic contract).
- {Dixie, Finn} → Freeside (governed recall consumption).
- No edge points into `loa-straylight` from any sibling at MVP.
- No edge points into `loa-hounfour` from any sibling at MVP.

A future ADR that proposes adding an inverse edge (e.g.
"Straylight depends on a Finn-side schema") must explicitly
reopen this ADR.

### 7. The wedge's stable public surface is the cut

The package boundary doc
([`../mvp/package-boundary.md`](../mvp/package-boundary.md)) and
ADR-022A together define the cut:
[`../../src/straylight/index.ts`](../../src/straylight/index.ts)
is the **only** module any sibling consumer (Finn, Dixie,
Freeside) is permitted to import in MVP. The Hounfour alias
module
([`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts))
remains private; siblings consuming Hounfour shapes do so directly
from `@0xhoneyjar/loa-hounfour@^8.6.0` under the same subpath
discipline, not by reaching into the wedge's private alias.

## Consequences

- A Phase 22 implementation branch that depends on a not-yet-
  shipped Hounfour shape (e.g. `EstateTransition`) is blocked at
  the substrate edge. It must either (a) wait for the upstream
  shape, (b) keep the primitive local per ADR-020C / ADR-022A,
  or (c) propose a new ADR that reopens this graph.
- Reviewers should reject any Phase 22 PR that:
  - Adds a sibling-repo import path that bypasses the wedge's
    public surface.
  - Re-exports the Hounfour alias module from the public surface.
  - Adds a Finn-side, Dixie-side, or Freeside-side primitive
    redefinition.
  - Introduces a cycle (e.g. a Finn schema that the wedge
    imports).
  - Imports `safeCanonicalize` from any path while gate
    `no-confirmed-subpath` remains in force.
  - Reaches into `node_modules/@0xhoneyjar/loa-hounfour/dist/...`
    past the declared exports map.

## Non-scope (Phase 22A)

- No new schemas (Hounfour, Straylight, Finn, Dixie, Freeside)
  authored.
- No `Challenge` adoption into the wedge's public surface.
- No `EstateTransition` implementation.
- No `safeCanonicalize` subpath import.
- No reach into unexported Hounfour internals.
- No edits to
  [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts).
- No edits to
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts).
- No `package.json` / `package-lock.json` changes.
- No fixture / script / test changes.
- No sibling-repo edits.
- No commit, no push, no PR.

## Source files inspected

- [`./ADR-020A-straylight-semantic-owner.md`](./ADR-020A-straylight-semantic-owner.md)
- [`./ADR-020B-recall-wedge-endpoint-host.md`](./ADR-020B-recall-wedge-endpoint-host.md)
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md)
- [`./ADR-020D-recall-wedge-persistence-and-receipts.md`](./ADR-020D-recall-wedge-persistence-and-receipts.md)
- [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md)
- [`./ADR-022B-mvp-endpoint-host.md`](./ADR-022B-mvp-endpoint-host.md)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../mvp/straylight-recall-wedge.md`](../mvp/straylight-recall-wedge.md)
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
- [`../handoffs/hounfour-adaptation-delta.md`](../handoffs/hounfour-adaptation-delta.md)
- [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md)
- [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md)
- [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
- [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md)
- [`../handoffs/dixie-governed-recall-boundary.md`](../handoffs/dixie-governed-recall-boundary.md)
- [`../handoffs/freeside-community-surface-boundary.md`](../handoffs/freeside-community-surface-boundary.md)
- [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
- [`../../package.json`](../../package.json)
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts) (public surface — unchanged at the schema-dependency boundary)
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts) (private alias module, not re-exported)
- [`../../src/straylight/canonical.ts`](../../src/straylight/canonical.ts) (local canonicalizer)
- [`../../tests/hounfour-shadow-integration.test.ts`](../../tests/hounfour-shadow-integration.test.ts) (Phase 17B / 18 / 21A shadow-integration pin)
