# Phase 49F — ADR-022E Gate #8 Concrete-Candidate Evidence Packet — `PostgreSQL`

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49F (File 2 of 7)** — docs-only **candidate evidence packet** for `PostgreSQL`, filled from
> the Phase 49E File 4 template within the Phase 49E File 3 grain.
> **Status**: **docs / evidence-packet only.** This packet gathers `P-1 … P-11` evidence for the **`PostgreSQL`**
> candidate at **engine grain only**, classifies the packet as
> **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`**, and does nothing else. It ranks **no** candidate, accepts
> **no** candidate, selects **no** concrete physical host, selects **no** production database, proposes **no**
> production adapter, and authorizes **no** implementation. The only change on this branch is **seven** new
> Markdown files under `docs/`.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049F` — following the live Phase 48 / 49 convention. It is one of five per-candidate evidence
packets (Files 2–6), summarized by File 7.

---

## 1. Source lineage

- **Phase 49D File 1 — shortlist**: recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`); named `PostgreSQL` as **C-1**, the database
  engine (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:123`).
- **Phase 49E File 1 — evidence authorization**: recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:171`); EAQ-1 permitted a
  later gathering lane; EAQ-2 fixed the public/provider-documentation-plus-repo-local grain.
- **Phase 49E File 2 — evidence-lane authorization**: recorded `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md:106`).
- **Phase 49E File 3 — evidence-grain boundary**: recorded `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md:140`); fixed the forbidden-detail list.
- **Phase 49F File 1 — source registry**: recorded `CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-SOURCE-REGISTRY-GATE.md` §3.1); registered `PG-SOURCE-1` as the
  sole evidence source for this packet.
- **`P-1 … P-11` decomposition**: `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`.

---

## 2. Candidate identity

- **Candidate display name**: `PostgreSQL`
- **EQ-2 category membership**: **database engine** (not a deployment provider, not a self-hosted deployment)
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:123`).
- **Ownership boundary**: `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`.
- **Semantic owner**: `loa-straylight` (S1 ownership is permanent and host-independent,
  `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
- **Candidate grain confirmation**: named only as an engine within its EQ-2 category — no leaked deployment fact;
  this packet treats `PostgreSQL` as **engine-only** evidence.

---

## 3. Evidence source inventory

- **Public/provider-documentation sources** (evidence-source URLs, not deployment endpoints):
  - `PG-SOURCE-1` — `https://www.postgresql.org/about/` — PostgreSQL engine identity and feature presence at engine
    grain (registered at `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-SOURCE-REGISTRY-GATE.md` §3.1).
- **Repo-local architecture sources** (`file:line`, read-only):
  - `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142` — the `P-1 … P-11`
    decomposition this packet collects against.
  - `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` — the `StorageAdapter` swap-in seam.
  - `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156` — S2 host UNSELECTED.
- **Read-only local code inspection notes**: none required for this engine-only packet.

---

## 4. Evidence freshness / citation posture

- **Citation posture**: each engine claim is attributed to `PG-SOURCE-1` at engine grain; each repo-local claim is
  cited to `file:line`.
- **Freshness posture**: `PG-SOURCE-1` is the engine project's own descriptive "About" documentation; its currency
  is characterized at capability grain only, with no version pin, no release date, and no deployment fact derived
  from it.

---

## 5. Forbidden-detail self-check

This packet introduces **none** of the following (each remains absent, per
`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md` §3 and
`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`):

- [x] no credentials, credential values, secrets, API keys, tokens, or private keys
- [x] no connection strings, host URLs (as deployment endpoints), ports, or endpoints
- [x] no account identifiers, project identifiers, regions, or topology
- [x] no production wiring, deployment steps, commands, or implementation details
- [x] no host / product selection and no production database selection
- [x] no production-adapter proposal (the gate-#8 `M5` shape — reserved for a separate, later lane)

---

## 6. `P-1 … P-11` evidence table

Each row uses exactly one **evidence-grain token** — `SUPPORTED_AT_PUBLIC_DOC_GRAIN`,
`SUPPORTED_AT_ENGINE_GRAIN_ONLY`, or `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` — and exactly one **status token** —
repo-local architecture support recorded, held pending sibling-owner evidence,
held pending adapter-proposal authority, held pending implementation authority, or not evidenced.

| P-row | Evidence (engine grain only; `PostgreSQL` is an engine, not a host) | Grain | Status |
|-------|--------------------------------------------------------------------|-------|--------|
| **P-1** candidate identity / ownership | `PG-SOURCE-1` shows PostgreSQL is an open-source object-relational database **engine**. S1 semantic ownership stays `loa-straylight` regardless of engine (`ADR-048B:156`). Engine identity is shown; *hosted* ownership is not, because an engine is not a deployment. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | repo-local architecture support recorded |
| **P-2** durability | `PG-SOURCE-1` shows WAL, replication, and PITR **feature presence** at engine grain, supporting durable-persistence *capability*. It does not show a managed-service durability guarantee for a Straylight deployment. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending implementation authority |
| **P-3** tenant / actor / estate isolation | `PG-SOURCE-1` shows access-control and row-level-security **feature presence**. Straylight per-`tenant`/`actor`/`estate` isolation is a runtime + Dixie concern (`ADR-026D` per `P-3` mapping at prep-gate `:142`), not shown by engine docs alone. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-4** migration / schema ownership | Engine supports SQL schemas and migrations generically. Schema substrate ownership is `loa-hounfour` and adoption is never automatic (prep-gate `P-4` at `:142`). Engine docs do not show Straylight schema ownership. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-5** runtime writer boundary | Engine supports roles / privileges generically. The governed runtime writer boundary (Finn EMITS, the wedge DEFINES; prep-gate `P-5` at `:142`) is not evidenced by engine docs. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-6** read / recall boundary | Engine supports queries / views generically. The recall-readable canonical-estate boundary (prep-gate `P-6` at `:142`) is a Straylight + Dixie design concern, not shown by engine docs. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-7** audit / receipt persistence | Engine supports durable rows / append-style tables generically. The six receipt categories + audit-chain integrity (`ADR-022D:171`, prep-gate `P-7` at `:142`) are a Straylight responsibility, not shown by engine docs. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending implementation authority |
| **P-8** failure / rollback / recovery | `PG-SOURCE-1` shows WAL / PITR recovery **feature presence** at engine grain. Operational recovery for a Straylight deployment is not shown — there is no Straylight deployment to recover. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending implementation authority |
| **P-9** permission / auth / signer authority | Engine supports roles / privileges generically (described as a role, not a secret). Signer / keyring authority over canonical writes is permanent S1 (prep-gate `P-9` at `:142`); engine docs do not show it. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-10** no-leak / public-private projection | This packet preserves the forbidden-grain boundary: only engine-grain feature presence is recorded; no connection, host, account, region, topology, or credential appears (File 1 §4). Privacy-scope + frame projection itself is an S1 invariant, not an engine feature. | `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` | repo-local architecture support recorded |
| **P-11** test / evidence shape | The inspectable evidence shape is fixed by the Phase 49E File 4 template and this packet's table. A *proposed production adapter* + sibling-repo handoff citation (the `M5` shape, prep-gate `P-11` at `:142`) is **not** produced here. | `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` | held pending adapter-proposal authority |

> **Engine-only reading (load-bearing).** `PostgreSQL` is a database *engine*, not a deployment. Engine-grain
> evidence can support engine identity and feature *presence* (P-1, P-2, P-8 at engine grain) and the no-leak /
> evidence-shape rows at template grain; it **cannot, by itself**, support deployment-provider ownership,
> managed-service durability, Straylight production isolation, the runtime writer boundary, audit persistence, or
> operational recovery. Those rows are held, not supported.

---

## 7. Evidence classification

- **Selected classification**: **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`**
- **Reasoning**: some `P-x` rows are supported within the allowed grain — P-1 (engine identity + repo-local S1
  ownership), P-10 (no-leak boundary preserved), and engine-grain feature presence for P-2 / P-8 — while the
  deployment-dependent rows (P-3, P-4, P-5, P-6, P-7, P-9) are held pending sibling-owner evidence or
  held pending implementation authority, and P-11 is held pending adapter-proposal authority. Some rows
  supported + others held ⇒ **partial**, not prepared and not rejected. It is not
  `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_PACKET_AMBIGUOUS` because the per-row evidence is unambiguous and
  recordable without amendment.

---

## 8. Candidate-specific non-acceptance statement

This packet, for `PostgreSQL`:

- **ranks** the candidate against no other — no ranking;
- **accepts** the candidate as no canonical store — no acceptance;
- **selects** no concrete physical host — host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects** no production database;
- **proposes** no production adapter (the `M5` shape remains a separate, later lane,
  `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes** no implementation — the `StorageAdapter` seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

---

## 9. Sibling-evidence posture

- **Finn (gate #9)**: held `PARTIAL_RECORDED`; runtime-owner evidence is not required before this gathering but is
  required before acceptance / gate #8 satisfaction
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md:89`).
- **Dixie (gate #10)**: held `PARTIAL_RECORDED`; same timing rule.
- **Hounfour**: only-if-required, if schema / protocol responsibilities become implicated
  (`docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md:192`).

---

## 10. Adapter / implementation separation posture & preserved blocked state

- [x] gathering this evidence proposes no production adapter;
- [x] gathering this evidence authorizes no implementation;
- [x] the gate-#8 `M5` adapter-proposal shape remains a separate, later lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

**Preserved blocked state**: gate #8 **`OPEN / HELD`** (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
gate #9 `PARTIAL_RECORDED` (`:159` of the completion gate); gate #10 `PARTIAL_RECORDED` (`:161`); D.1(ii)
unresolved (`:163`); D.1 not satisfied (`:165`); D.2 not started (`:167`); MVP-2 open (`:168`); the concrete
canonical-store physical host remains **unselected** (`ADR-048B:156`).

---

## 11. Next-lane note

- This packet feeds only the **Phase 49F evidence packet rollup** (File 7,
  `./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md`), which records aggregate evidence status
  **without ranking candidates and without selecting a host**.
- Ranking, acceptance, host selection, production database selection, adapter proposal, and implementation each
  remain **separate later gates** (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md:111`).

---

*End of Phase 49F File 2 — `PostgreSQL` evidence packet. Engine-only evidence; classified
`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`. Documentation URLs are evidence-source URLs, not deployment
endpoints. It ranks no candidate, accepts no candidate, selects no host, selects no production database, proposes no
production adapter, and authorizes no implementation. Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
