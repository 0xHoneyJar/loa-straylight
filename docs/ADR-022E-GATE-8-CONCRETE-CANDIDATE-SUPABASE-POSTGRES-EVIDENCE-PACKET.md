# Phase 49F — ADR-022E Gate #8 Concrete-Candidate Evidence Packet — `Supabase Postgres`

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49F (File 4 of 7)** — docs-only **candidate evidence packet** for `Supabase Postgres`,
> filled from the Phase 49E File 4 template within the Phase 49E File 3 grain.
> **Status**: **docs / evidence-packet only.** This packet gathers `P-1 … P-11` evidence for the
> **`Supabase Postgres`** candidate at **descriptive public-doc grain**, classifies the packet as
> **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`**, and does nothing else. It ranks **no** candidate, accepts
> **no** candidate, selects **no** concrete physical host, selects **no** production database, proposes **no**
> production adapter, and authorizes **no** implementation. The only change on this branch is **seven** new
> Markdown files under `docs/`.

**Naming note.** This file lands at **top-level `docs/`**, is **not** an ADR, and is **not** numbered `ADR-049F`.
It is one of five per-candidate evidence packets (Files 2–6), summarized by File 7.

---

## 1. Source lineage

- **Phase 49D File 1 — shortlist**: recorded `CONCRETE_CANDIDATE_SHORTLIST_PREPARED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189`); named `Supabase Postgres` as **C-3**, a
  deployment provider / managed-service option (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:125`).
- **Phase 49E File 1 — evidence authorization**: recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:171`).
- **Phase 49E File 2 — evidence-lane authorization**: recorded `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md:106`).
- **Phase 49E File 3 — evidence-grain boundary**: recorded `CONCRETE_CANDIDATE_EVIDENCE_GRAIN_BOUNDARY_RECORDED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md:140`).
- **Phase 49F File 1 — source registry**: recorded `CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-SOURCE-REGISTRY-GATE.md` §3.5–§3.6); registered
  `SUPABASE-SOURCE-1`, `SUPABASE-SOURCE-2` for this packet.
- **`P-1 … P-11` decomposition**: `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142`.

---

## 2. Candidate identity

- **Candidate display name**: `Supabase Postgres`
- **EQ-2 category membership**: **deployment provider (managed-service option)**
  (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:125`).
- **Ownership boundary**: `STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY` — S1 semantic ownership stays
  `loa-straylight` regardless of host (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).
- **Semantic owner**: `loa-straylight`.
- **Candidate grain confirmation**: named only as a managed-provider option within its EQ-2 category — no leaked
  deployment fact (no API token, project-ref, endpoint, region, price, or credential).

---

## 3. Evidence source inventory

- **Public/provider-documentation sources** (evidence-source URLs, not deployment endpoints):
  - `SUPABASE-SOURCE-1` — `https://supabase.com/docs/guides/database/overview` — full Postgres database posture.
  - `SUPABASE-SOURCE-2` — `https://supabase.com/docs/guides/platform/backups` — daily backup + PITR posture and the
    Storage-API backup boundary.
- **Repo-local architecture sources** (`file:line`, read-only):
  - `docs/ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md:142` — `P-1 … P-11`.
  - `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79` — the `StorageAdapter` swap-in seam.
  - `docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156` — S2 host UNSELECTED.
- **Read-only local code inspection notes**: none.

---

## 4. Evidence freshness / citation posture

- **Citation posture**: each provider claim is attributed to a Supabase source label at public-doc grain; each
  repo-local claim is cited to `file:line`.
- **Freshness posture**: Supabase sources are the provider's own descriptive documentation; their currency is
  characterized at capability grain only. Plan tiers (Pro / Team / Enterprise) and add-on *requirements* are
  referenced as posture only — **no price figure** and no project-ref, token, curl command, or endpoint is derived.

---

## 5. Forbidden-detail self-check

This packet introduces **none** of the following (each remains absent, per
`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-GRAIN-BOUNDARY-GATE.md` §3 and
`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:491`):

- [x] no credentials, credential values, secrets, API keys, tokens, or private keys
- [x] no connection strings, host URLs (as deployment endpoints), ports, or endpoints
- [x] no account identifiers, project identifiers / project-refs, regions, or topology
- [x] no API token examples, curl commands, or API examples
- [x] no pricing figures (plan-tier / add-on posture referenced descriptively only)
- [x] no production wiring, deployment steps, commands, or implementation details
- [x] no host / product selection and no production database selection
- [x] no production-adapter proposal (the gate-#8 `M5` shape — reserved for a separate, later lane)

---

## 6. `P-1 … P-11` evidence table

Each row uses exactly one **evidence-grain token** — `SUPPORTED_AT_PUBLIC_DOC_GRAIN`,
`SUPPORTED_AT_ENGINE_GRAIN_ONLY`, or `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` — and exactly one **status token** —
repo-local architecture support recorded, held pending sibling-owner evidence,
held pending adapter-proposal authority, held pending implementation authority, or not evidenced.

| P-row | Evidence (public-doc grain; no deployment fact) | Grain | Status |
|-------|--------------------------------------------------|-------|--------|
| **P-1** candidate identity / ownership | `SUPABASE-SOURCE-1` shows every Supabase project has a full Postgres database (the foundation for Auth, Storage, Realtime, Edge Functions) — candidate identity at public-doc grain. S1 semantic ownership stays `loa-straylight` (`ADR-048B:156`). | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | repo-local architecture support recorded |
| **P-2** durability | `SUPABASE-SOURCE-1` + `SUPABASE-SOURCE-2` show managed daily backups and PITR (on paid / add-on plans) — durable-persistence + recovery *capability* at public-doc grain. A Straylight durability guarantee is not shown. | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | held pending implementation authority |
| **P-3** tenant / actor / estate isolation | Provider docs describe a per-project database; Straylight per-`tenant`/`actor`/`estate` isolation is a runtime + Dixie concern (prep-gate `P-3` at `:142`), not shown by provider docs. | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | held pending sibling-owner evidence |
| **P-4** migration / schema ownership | Provider hosts a full Postgres database; schema substrate ownership is `loa-hounfour` and adoption is never automatic (prep-gate `P-4` at `:142`). Provider docs do not show Straylight schema ownership. | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | held pending sibling-owner evidence |
| **P-5** runtime writer boundary | Provider hosts a database the application writes to; the governed runtime writer boundary (Finn EMITS, the wedge DEFINES; prep-gate `P-5` at `:142`) is not evidenced by provider docs. | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | held pending sibling-owner evidence |
| **P-6** read / recall boundary | Provider docs describe database access; the recall-readable canonical-estate boundary (prep-gate `P-6` at `:142`) is a Straylight + Dixie design concern, not shown by provider docs. | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | held pending sibling-owner evidence |
| **P-7** audit / receipt persistence | `SUPABASE-SOURCE-2` shows backups do not store custom-role passwords and database backups do not include Storage-API objects — a useful backup-scope boundary. The six receipt categories + audit-chain integrity (`ADR-022D:171`, prep-gate `P-7` at `:142`) are a Straylight responsibility, not shown by provider docs. | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | held pending implementation authority |
| **P-8** failure / rollback / recovery | `SUPABASE-SOURCE-2` shows daily backups, PITR with finer-than-daily granularity (plan / add-on requirements), and that restoration can involve project downtime — recovery *capability* + caveats at public-doc grain. Operational recovery of a Straylight deployment is not shown. | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | held pending implementation authority |
| **P-9** permission / auth / signer authority | Provider docs reference roles and (separately) the Auth product (described as roles, not secrets). Signer / keyring authority over canonical writes is permanent S1 (prep-gate `P-9` at `:142`); provider docs do not show it. | `SUPPORTED_AT_PUBLIC_DOC_GRAIN` | held pending sibling-owner evidence |
| **P-10** no-leak / public-private projection | This packet preserves the forbidden-grain boundary: no API token, project-ref, curl command, endpoint, region, or price is copied (File 1 §3.5–§3.6, §4). The backup-scope boundary (`SUPABASE-SOURCE-2`: backups exclude custom-role passwords and Storage-API objects) is recorded descriptively. Privacy-scope + frame projection is an S1 invariant. | `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` | repo-local architecture support recorded |
| **P-11** test / evidence shape | The inspectable evidence shape is fixed by the Phase 49E File 4 template and this table. A *proposed production adapter* + sibling-repo handoff citation (the `M5` shape, prep-gate `P-11` at `:142`) is **not** produced here. | `SUPPORTED_AT_TEMPLATE_GRAIN_ONLY` | held pending adapter-proposal authority |

> **Public-doc reading (load-bearing).** Supabase provider documentation can support candidate identity (P-1),
> durability + recovery *capability* (P-2, P-8), a backup-scope boundary informing P-7 / P-10, and the
> evidence-shape row (P-11) at the recorded grain; it **cannot, by itself**, support Straylight tenant / estate
> isolation, schema ownership, the runtime writer boundary, recall boundary, audit persistence, or signer
> authority. Those rows are held, not supported.

---

## 7. Evidence classification

- **Selected classification**: **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`**
- **Reasoning**: P-1, P-2, P-7, P-8 are supported at public-doc grain and P-10 / P-11 at template grain, while the
  Straylight-design-dependent rows (P-3, P-4, P-5, P-6, P-9) are held pending sibling-owner evidence and P-11 is
  held pending adapter-proposal authority. Some rows supported + others held ⇒ **partial**, not prepared and not
  rejected. It is not `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_PACKET_AMBIGUOUS` because the per-row evidence is
  unambiguous and recordable without amendment.

---

## 8. Candidate-specific non-acceptance statement

This packet, for `Supabase Postgres`: ranks the candidate against no other (no ranking); accepts it as no canonical
store (no acceptance); selects no concrete physical host (host remains unselected, `ADR-048B:156`); selects no
production database; proposes no production adapter (the `M5` shape remains a separate, later lane,
`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`); authorizes no implementation
(the `StorageAdapter` seam is unchanged, `docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`).

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
- Ranking, acceptance, host selection, production database selection, adapter proposal, and implementation each
  remain **separate later gates** (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md:111`).

---

*End of Phase 49F File 4 — `Supabase Postgres` evidence packet. Public-doc-grain evidence; classified
`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`. Documentation URLs are evidence-source URLs, not deployment
endpoints; no API token, project-ref, curl command, endpoint, price, or credential is copied. It ranks no
candidate, accepts no candidate, selects no host, selects no production database, proposes no production adapter,
and authorizes no implementation. Gate #8 remains OPEN / HELD. No commit, no push, no PR.*
