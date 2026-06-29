# Phase 49F — ADR-022E Gate #8 Concrete-Candidate Evidence Packet — `Self-hosted PostgreSQL on future Straylight-controlled infrastructure`

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49F (File 6 of 7)** — docs-only **candidate evidence packet** for
> `Self-hosted PostgreSQL on future Straylight-controlled infrastructure`, filled from the Phase 49E File 4
> template within the Phase 49E File 3 grain.
> **Status**: **docs / evidence-packet only.** This packet gathers `P-1 … P-11` evidence for the **self-hosted**
> candidate. It inherits **engine-grain** PostgreSQL evidence and marks every **deployment / operations** row as
> not evidenced or held, because no future-infrastructure authority has been granted. It classifies the packet as
> **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`** and does nothing else. It ranks **no** candidate, accepts **no**
> candidate, selects **no** concrete physical host, selects **no** production database, proposes **no** production
> adapter, and authorizes **no** implementation. The only change on this branch is **seven** new Markdown files
> under `docs/`.

**Naming note.** This file lands at **top-level `docs/`**, is **not** an ADR, and is **not** numbered `ADR-049F`.
It is one of five per-candidate evidence packets (Files 2–6), summarized by File 7.

---

## 1. Source lineage

- **Phase 49D File 1 — shortlist**: recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`); named
  `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` as **C-5**, the self-hosted option
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:127`).
- **Phase 49E File 1 — evidence authorization**: recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:171`).
- **Phase 49E File 2 — evidence-lane authorization**: recorded `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md:106`).
- **Phase 49E File 3 — evidence-grain boundary**: recorded `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md:140`).
- **Phase 49F File 1 — source registry**: recorded `CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-SOURCE-REGISTRY-GATE.md` §3.9); registered `SELFHOST-SOURCE-1`
  for this packet, whose engine basis is `PG-SOURCE-1` (§3.1).
- **`P-1 … P-11` decomposition**: `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`.

---

## 2. Candidate identity

- **Candidate display name**: `Self-hosted PostgreSQL on future Straylight-controlled infrastructure`
- **EQ-2 category membership**: **self-hosted option** (not a managed-service provider)
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:127`).
- **Ownership boundary**: `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` — S1 semantic ownership stays
  `loa-straylight` (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
- **Semantic owner**: `loa-straylight`.
- **Candidate grain confirmation**: named only as a *future* self-hosted option within its EQ-2 category — **no**
  deployment provider, account, topology, region, credential, host, or operational owner exists or is named,
  because future-infrastructure authority has not been granted (File 1 §3.9).

---

## 3. Evidence source inventory

- **Public/provider-documentation sources** (evidence-source URLs, not deployment endpoints):
  - `SELFHOST-SOURCE-1` — **no distinct deployment URL**; its engine basis is `PG-SOURCE-1`
    (`https://www.postgresql.org/about/`), inherited at **engine grain only** (File 1 §3.9, §3.1).
- **Repo-local architecture sources** (`file:line`, read-only):
  - `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142` — `P-1 … P-11`.
  - `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` — the `StorageAdapter` swap-in seam.
  - `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156` — S2 host UNSELECTED.
- **Read-only local code inspection notes**: none.

> **No deployment source exists.** Unlike the managed-provider packets (Files 3–5), this candidate has **no**
> provider documentation describing a hosted deployment, because no future Straylight infrastructure has been
> authorized. Only engine-grain evidence is available; all deployment / operations evidence is not evidenced or
> held.

---

## 4. Evidence freshness / citation posture

- **Citation posture**: engine claims are attributed to `PG-SOURCE-1` (via `SELFHOST-SOURCE-1`) at engine grain;
  repo-local claims are cited to `file:line`. No deployment / operations claim is made.
- **Freshness posture**: only the engine project's descriptive documentation is current evidence; there is no
  deployment documentation to characterize, because no deployment exists.

---

## 5. Forbidden-detail self-check

This packet introduces **none** of the following (each remains absent, per
`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md` §3 and
`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`):

- [x] no credentials, credential values, secrets, API keys, tokens, or private keys
- [x] no connection strings, host URLs (as deployment endpoints), ports, or endpoints
- [x] no account identifiers, project identifiers, regions, or topology
- [x] no deployment provider, operational owner, or production infrastructure is named or invented
- [x] no production wiring, deployment steps, commands, or implementation details
- [x] no host / product selection and no production database selection
- [x] no production-adapter proposal (the gate-#8 `M5` shape — reserved for a separate, later lane)

---

## 6. `P-1 … P-11` evidence table

Each row uses exactly one **evidence-grain token** — `SUPPORTED_AT_PUBLIC_DOC_GRAIN`,
`SUPPORTED_AT_ENGINE_GRAIN_ONLY`, or `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` — and exactly one **status token** —
repo-local architecture support recorded, held pending sibling-owner evidence,
held pending adapter-proposal authority, held pending implementation authority, or not evidenced.

| P-row | Evidence (engine grain inherited; deployment / operations not evidenced or held) | Grain | Status |
|-------|-----------------------------------------------------------------------------------|-------|--------|
| **P-1** candidate identity / ownership | The engine basis (`PG-SOURCE-1` via `SELFHOST-SOURCE-1`) shows PostgreSQL engine identity; S1 semantic ownership stays `loa-straylight` (`ADR-048B:156`). The candidate is a *future* self-hosted option; engine identity is shown, but the future infrastructure that would host it does not exist yet. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | repo-local architecture support recorded |
| **P-2** durability | Engine WAL / replication / PITR **feature presence** is inherited at engine grain. Self-hosted durability operations depend on infrastructure that has not been authorized. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending implementation authority |
| **P-3** tenant / actor / estate isolation | Engine access-control / row-level-security **feature presence** is inherited. Straylight isolation on future infrastructure is not evidenced (no infrastructure, plus runtime + Dixie concern, prep-gate `P-3` at `:142`). | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-4** migration / schema ownership | Engine supports SQL schemas / migrations generically. Schema substrate ownership is `loa-hounfour`; self-hosted schema operations are not evidenced (prep-gate `P-4` at `:142`). | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-5** runtime writer boundary | Engine supports roles / privileges generically. The governed runtime writer boundary (prep-gate `P-5` at `:142`) on future infrastructure is not evidenced. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-6** read / recall boundary | Engine supports queries / views generically. The recall-readable canonical-estate boundary (prep-gate `P-6` at `:142`) on future infrastructure is not evidenced. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-7** audit / receipt persistence | Engine supports durable rows generically. The six receipt categories + audit-chain integrity (`ADR-022D:171`, prep-gate `P-7` at `:142`) on future infrastructure are not evidenced. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending implementation authority |
| **P-8** failure / rollback / recovery | Engine WAL / PITR recovery **feature presence** is inherited at engine grain. **Operational** backup / restore / recovery requires infrastructure, an operational owner, and topology — none authorized — so deployment recovery is **not evidenced**. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | not evidenced |
| **P-9** permission / auth / signer authority | Engine supports roles / privileges generically (described as roles, not secrets). Signer / keyring authority over canonical writes is permanent S1 (prep-gate `P-9` at `:142`); self-hosted auth operations are not evidenced. | `SUPPORTED_AT_ENGINE_GRAIN_ONLY` | held pending sibling-owner evidence |
| **P-10** no-leak / public-private projection | This packet preserves the forbidden-grain boundary: no provider, account, region, topology, host, endpoint, credential, or operational owner is named or invented (File 1 §3.9, §4). Privacy-scope + frame projection is an S1 invariant. | `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` | repo-local architecture support recorded |
| **P-11** test / evidence shape | The inspectable evidence shape is fixed by the Phase 49E File 4 template and this table. A *proposed production adapter* + sibling-repo handoff citation (the `M5` shape, prep-gate `P-11` at `:142`) is **not** produced here, and future-infrastructure authority is required first. | `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` | held pending adapter-proposal authority |

> **Engine-inheritance reading (load-bearing).** This candidate carries forward **only** PostgreSQL engine-grain
> evidence (P-1 identity, P-2 / P-3 / P-8 feature presence) and the no-leak / evidence-shape rows at template
> grain. **Deployment / operations evidence — deployment provider, operational owner, production infrastructure,
> topology, backup operations, runtime writer boundary, auth / signer authority, and operational recovery — is
> not evidenced or held**, because future Straylight-controlled infrastructure has not been authorized. The
> operational-recovery row (P-8 deployment recovery) is explicitly not evidenced.

---

## 7. Evidence classification

- **Selected classification**: **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`**
- **Reasoning**: P-1 and P-10 are supported (engine identity + repo-local S1 ownership; no-leak boundary preserved)
  and P-11 is held at template grain, while engine-grain feature presence (P-2, P-3, P-9) and audit / writer rows
  (P-4, P-5, P-6, P-7) are held pending sibling-owner / implementation authority, and the deployment-recovery row
  (P-8) is not evidenced because no infrastructure exists. Some rows supported + others held / not-evidenced ⇒
  **partial**, not prepared and not rejected. It is not
  `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_PACKET_AMBIGUOUS` because the per-row evidence — including the
  explicit not evidenced rows — is unambiguous and recordable without amendment.

---

## 8. Candidate-specific non-acceptance statement

This packet, for `Self-hosted PostgreSQL on future Straylight-controlled infrastructure`: ranks the candidate
against no other (no ranking); accepts it as no canonical store (no acceptance) — future-infrastructure authority is
required before this candidate can be accepted (File 1 §3.9); selects no concrete physical host (host remains
unselected, `ADR-048B:156`); selects no production database; proposes no production adapter (the `M5` shape remains
a separate, later lane, `docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
authorizes no implementation (the `StorageAdapter` seam is unchanged,
`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

---

## 9. Sibling-evidence posture

- **Finn (gate #9)**: held `PARTIAL_RECORDED`; runtime-owner evidence not required before this gathering, required
  before acceptance / gate #8 satisfaction
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md:89`).
- **Dixie (gate #10)**: held `PARTIAL_RECORDED`; same timing rule.
- **Hounfour**: only-if-required, if schema / protocol responsibilities become implicated
  (`docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md:192`).

---

## 10. Adapter / implementation separation posture & preserved blocked state

- [x] gathering this evidence proposes no production adapter;
- [x] gathering this evidence authorizes no implementation;
- [x] no future Straylight-controlled infrastructure is authorized, named, or invented;
- [x] the gate-#8 `M5` adapter-proposal shape remains a separate, later lane
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`).

**Preserved blocked state**: gate #8 **`OPEN / HELD`** (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
gate #9 `PARTIAL_RECORDED` (`:159`); gate #10 `PARTIAL_RECORDED` (`:161`); D.1(ii) unresolved (`:163`); D.1 not
satisfied (`:165`); D.2 not started (`:167`); MVP-2 open (`:168`); the concrete canonical-store physical host
remains **unselected** (`ADR-048B:156`).

---

## 11. Next-lane note

- This packet feeds only the **Phase 49F evidence packet rollup** (File 7,
  `./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-PACKET-ROLLUP-GATE.md`), which records aggregate evidence status
  **without ranking candidates and without selecting a host**.
- Ranking, acceptance, host selection, production database selection, adapter proposal, implementation, and any
  future-infrastructure authority each remain **separate later gates**
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md:111`).

---

*End of Phase 49F File 6 — `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` evidence packet.
Engine-grain evidence inherited from `PG-SOURCE-1`; all deployment / operations evidence not evidenced or held;
classified `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`. No deployment provider, account, region, topology, host,
endpoint, credential, or operational owner is named or invented. It ranks no candidate, accepts no candidate,
selects no host, selects no production database, proposes no production adapter, and authorizes no implementation.
Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
