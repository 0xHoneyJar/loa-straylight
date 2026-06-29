# Phase 49F — ADR-022E Gate #8 Concrete-Candidate Evidence Packet Rollup Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49F (File 7 of 7)** — docs-only **evidence packet rollup** gate for the canonical-store
> concrete-candidate evidence packet lane (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / rollup only.** This file summarizes the five Phase 49F per-candidate evidence packets
> (Files 2–6), records that **each** packet is `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`, and records the
> aggregate result **`CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`**. It **records evidence status; it
> makes no decision.** It ranks **no** candidate, accepts **no** candidate, rejects **no** candidate as a final
> decision, selects **no** concrete physical host, selects **no** production database, proposes **no** production
> adapter, and authorizes **no** implementation. The only change on this branch is **seven** new Markdown files
> under `docs/`. No source, test, runtime, route, storage, DB, migration, auth/consent/signer, schema, config, CI,
> generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049F` — following the live Phase 48 / 49 convention. It records a bounded **evidence packet
rollup**: it aggregates the per-candidate packet results into an evidence-status summary; it makes no candidate
decision. The immediate predecessors are **Phase 49F Files 1–6**.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49E File 2 — evidence-lane authorization** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED`** — authorized this later evidence lane. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md:106` |
| **Phase 49E File 6 — evidence-to-decision separation** | Recorded **`EVIDENCE_TO_DECISION_SEPARATION_RECORDED`** — evidence result, ranking, acceptance, host selection, adapter proposal, and implementation are each a separate later gate. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md:111` |
| **Phase 49F File 1 — source registry** | Recorded **`CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`** — the nine source labels each packet draws from. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-SOURCE-REGISTRY-GATE.md` §5 |
| **Phase 49D File 1 — shortlist** | Recorded **`CONCRETE_CANDIDATE_SHORTLIST_PREPARED`** — the five candidates. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md:189` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this rollup. The table is a
> status restatement only.

---

## 2. Per-candidate packet summary (Files 2–6)

Each packet was filled within the Phase 49E File 3 grain, drawing only on the File 1 sources, mapped to
`P-1 … P-11`, and classified independently. **All five recorded
`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`.**

| # | Candidate | File | Evidence grain | Sources | Packet result |
|---|-----------|------|----------------|---------|---------------|
| C-1 | `PostgreSQL` | [File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-POSTGRESQL-EVIDENCE-PACKET.md) | engine grain only | `PG-SOURCE-1` | **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`** |
| C-2 | `Railway PostgreSQL` | [File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RAILWAY-POSTGRESQL-EVIDENCE-PACKET.md) | public-doc grain | `RAILWAY-SOURCE-1/2/3` | **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`** |
| C-3 | `Supabase Postgres` | [File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SUPABASE-POSTGRES-EVIDENCE-PACKET.md) | public-doc grain | `SUPABASE-SOURCE-1/2` | **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`** |
| C-4 | `Neon Postgres` | [File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NEON-POSTGRES-EVIDENCE-PACKET.md) | public-doc grain | `NEON-SOURCE-1/2` | **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`** |
| C-5 | `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` | [File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SELF-HOSTED-POSTGRESQL-EVIDENCE-PACKET.md) | engine grain inherited; deployment / operations `NOT_EVIDENCED` or held | `SELFHOST-SOURCE-1` (engine basis `PG-SOURCE-1`) | **`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`** |

> **This is an evidence-status summary, not a comparison.** The table lists each packet's grain and result side by
> side **for status visibility only**; it does **not** rank the candidates, score them, order them by preference,
> or imply any candidate is better, worse, leading, or selectable. Identical `PARTIAL` results across all five are
> recorded precisely so no ranking can be read into the rollup.

### 2.1 Per-candidate `P-1 … P-11` status (no ranking)

Each cell is the row's status token from that candidate's packet (§6 of Files 2–6). The columns are listed in
candidate order C-1 … C-5 (the Phase 49D shortlist order), **not** a preference order.

| P-row | C-1 `PostgreSQL` | C-2 `Railway PostgreSQL` | C-3 `Supabase Postgres` | C-4 `Neon Postgres` | C-5 self-hosted |
|-------|------------------|--------------------------|-------------------------|---------------------|-----------------|
| P-1 | supported (repo-local) | supported (repo-local) | supported (repo-local) | supported (repo-local) | supported (repo-local) |
| P-2 | held (impl) | held (impl) | held (impl) | held (impl) | held (impl) |
| P-3 | held (sibling) | held (sibling) | held (sibling) | held (sibling) | held (sibling) |
| P-4 | held (sibling) | held (sibling) | held (sibling) | held (sibling) | held (sibling) |
| P-5 | held (sibling) | held (sibling) | held (sibling) | held (sibling) | held (sibling) |
| P-6 | held (sibling) | held (sibling) | held (sibling) | held (sibling) | held (sibling) |
| P-7 | held (impl) | held (impl) | held (impl) | held (impl) | held (impl) |
| P-8 | held (impl) | held (impl) | held (impl) | held (impl) | **`NOT_EVIDENCED`** (deployment) |
| P-9 | held (sibling) | held (sibling) | held (sibling) | held (sibling) | held (sibling) |
| P-10 | supported (repo-local) | supported (repo-local) | supported (repo-local) | supported (repo-local) | supported (repo-local) |
| P-11 | held (adapter) | held (adapter) | held (adapter) | held (adapter) | held (adapter) |

> Legend: *supported (repo-local)* = `REPO_LOCAL_ARCHITECTURE_SUPPORTED`; *held (sibling)* =
> `HELD_PENDING_SIBLING_OWNER_EVIDENCE`; *held (impl)* = `HELD_PENDING_IMPLEMENTATION_AUTHORITY`; *held (adapter)* =
> `HELD_PENDING_ADAPTER_PROPOSAL_AUTHORITY`; `NOT_EVIDENCED` as written. **No row, and no candidate, is marked
> "accepted", "selected", "preferred", or "ranked".**

---

## 3. Why every packet is `PARTIAL` (the shared rationale)

Every candidate packet recorded `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL` for the same structural reason:

1. **Public / provider evidence supports some P-rows.** Candidate identity (P-1), durability / recovery
   *capability* (P-2, P-8), and — where applicable — backup-scope or branch-recovery posture support those rows at
   public-doc or engine grain.
2. **Repo-local architecture evidence supports provenance and prior gate lineage.** S1 ownership (P-1), the no-leak
   / forbidden-grain boundary (P-10), and the inspectable evidence shape (P-11) are supported from repo-local
   architecture and the Phase 49E template.
3. **Sibling-owner evidence is still not complete.** Finn / Dixie owner evidence is not required before gathering
   but **is** required before acceptance / gate #8 satisfaction
   (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md:89`), so the isolation / writer /
   recall / schema / signer rows (P-3, P-4, P-5, P-6, P-9) are held.
4. **Adapter proposal is not authorized.** The `M5` proposed-production-adapter shape is a separate, later lane
   (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`), so P-11 is held.
5. **Implementation is not authorized.** The `StorageAdapter` seam is unchanged
   (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`), so the persistence / audit / operational rows
   (P-2, P-7, P-8) are held (and deployment recovery is `NOT_EVIDENCED` for the self-hosted candidate, which has no
   authorized infrastructure).
6. **Host selection is not authorized.** The canonical-store physical host remains **UNSELECTED**
   (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

> **Therefore no candidate can be accepted in Phase 49F.** Some rows supported + others held / not-evidenced ⇒ each
> packet is partial; and partial packets aggregate to a partial rollup. Acceptance, ranking, and host selection are
> each separate later gates.

---

## 4. Rollup decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`**:

1. **It is `CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`** — all five per-candidate packets recorded
   `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL` (§2), and this rollup records that aggregate status faithfully. The
   packets are real and partial, so the rollup is a recorded partial.
2. **It is *not* an "all-prepared" or "complete" result** — no packet recorded
   `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PREPARED`; the deployment / sibling / adapter / implementation rows are held
   across the board, so the aggregate cannot be "complete".
3. **It is *not* a rejection** — no packet recorded `CONCRETE_CANDIDATE_EVIDENCE_PACKET_REJECTED`; the supported
   rows are real, so the aggregate is not a rejection.
4. **It is *not* a patch-required result** — every packet result is unambiguous and recordable without amendment;
   no `PATCH_REQUIRED_CONCRETE_CANDIDATE_EVIDENCE_PACKET_AMBIGUOUS` was recorded.

> **Packets partial-recorded ≠ evidence complete ≠ candidate ranked ≠ candidate accepted ≠ candidate rejected ≠
> host selected ≠ adapter proposed ≠ implementation authorized ≠ gate #8 satisfaction.** Recording
> `CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED` is the result of *this rollup gate only*. **Gate #8 remains
> OPEN / HELD.**

---

## 5. Selected next lane

> **Selected next lane: a docs-only concrete-candidate evidence packet audit / decision-preparation gate.** Because
> the packets are partial-recorded, the next docs-only step (beyond this PR) reviews / audits the five packets and
> prepares for a *later, separately-authorized* decision. **That next lane must still not accept a host** — it
> prepares for a decision; it does not make one, and it may not select a host unless a separate authority authorizes
> host selection.

The next lane, like this one, must **not**: rank candidates; accept any candidate; reject any candidate as a final
decision; select a concrete physical host; select a production database; propose a production adapter; authorize
implementation; or authorize a sibling-repo PR. Ranking, acceptance, host selection, adapter proposal, and
implementation each remain separate later gates
(`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md:111`).

Any follow-on PR title must carry its phase label, e.g. `Phase 49G: concrete-candidate evidence packet audit` *(docs-only)*.

---

## 6. Preserved blocked state

This rollup preserves every held / open state unchanged:

- **Gate #8** remains **`OPEN / HELD`** — not discharged; `ADR-022E:57` not satisfied
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **Gate #9** remains held with **`PARTIAL_RECORDED`**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`);
- **Gate #10** remains held with **`PARTIAL_RECORDED`**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`);
- **D.1(ii)** remains **unresolved**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:163`);
- **D.1 is not satisfied** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:165`);
- **D.2 is not started** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:167`);
- **MVP-2 remains open** (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:168`);
- **The concrete canonical-store physical host remains unselected** — owner "none"
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`).

---

## 7. Preserved non-claims

Each item below is preserved as a **negation**. This evidence packet rollup gate:

- **does not rank** any candidate — the identical `PARTIAL` results encode no ordering;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **does not reject** any candidate as a final decision — `PARTIAL` is an evidence status, not a rejection;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later separate request, the `M5` shape
  (`docs/decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md:352`);
- **authorizes no implementation** of any kind — the `StorageAdapter` swap-in seam is unchanged
  (`docs/decisions/ADR-022D-mvp-persistence-and-audit-owner.md:79`);
- **authorizes no sibling-repo PR** — no sibling-repo PR may merge without teammate review
  (`docs/handoffs/cross-repo-handoff-index.md:28`);
- **does not satisfy** `ADR-022E:57` / gate #8, nor gate #9 / #10, nor D.1(ii), nor D.1, nor D.2, nor MVP-2;
- **does not broaden** into an architecture spec, proof matrix, validator ledger, or implementation plan;
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Rolling up partial evidence packets is not
> ranking any candidate, accepting any candidate, rejecting any candidate, selecting any host, selecting any
> production database, proposing any adapter, satisfying any gate, or authorizing any implementation.

---

## 8. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49F (File 7 of 7) — gate #8 concrete-candidate evidence packet rollup gate (docs-only) |
| **Predecessors** | Phase 49F Files 1–6 (source registry + five per-candidate packets) |
| **Decision result** | **`CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`** — all five packets `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`; not "complete" (rows held across the board), not a rejection (supported rows are real), not patch-required (each result unambiguous) |
| **Per-candidate results** | C-1 `PostgreSQL` PARTIAL; C-2 `Railway PostgreSQL` PARTIAL; C-3 `Supabase Postgres` PARTIAL; C-4 `Neon Postgres` PARTIAL; C-5 self-hosted PARTIAL |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **Gate #9 / #10** | both `PARTIAL_RECORDED`; both gates remain held |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked, accepted, or rejected; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate evidence packet audit / decision-preparation gate that must still **not** accept a host unless separately authorized |
| **Scope of this PR** | exactly seven new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 9. Audit checklist

- [ ] **Seven-file change.** The branch adds exactly the seven Phase 49F files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §6 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii) unresolved;
      D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **All five PARTIAL.** §2 records every per-candidate packet as `CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`.
- [ ] **No ranking.** §2 / §2.1 are an evidence-status summary in shortlist order, with explicit no-ranking notes.
- [ ] **Result conservative and explained.** §4 records `CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`; not
      complete, not a rejection, not patch-required.
- [ ] **Next lane bounded.** §5 selects a docs-only audit / decision-preparation gate that must still not accept a
      host unless separately authorized.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, host selection, a ranked / accepted / rejected
      candidate, a proposed production adapter, or implementation — each appears only inside a negation (§7).
- [ ] **No product leak.** No credential, connection string, port, account / project identifier, region, topology,
      endpoint, pricing figure, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 10. Source references

- [Phase 49F File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-SOURCE-REGISTRY-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_SOURCE_REGISTRY_RECORDED`.
- [Phase 49F File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-POSTGRESQL-EVIDENCE-PACKET.md) — `PostgreSQL` PARTIAL.
- [Phase 49F File 3](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-RAILWAY-POSTGRESQL-EVIDENCE-PACKET.md) —
  `Railway PostgreSQL` PARTIAL.
- [Phase 49F File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SUPABASE-POSTGRES-EVIDENCE-PACKET.md) —
  `Supabase Postgres` PARTIAL.
- [Phase 49F File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-NEON-POSTGRES-EVIDENCE-PACKET.md) — `Neon Postgres`
  PARTIAL.
- [Phase 49F File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SELF-HOSTED-POSTGRESQL-EVIDENCE-PACKET.md) — self-hosted
  PARTIAL.
- [Phase 49E File 2](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-LANE-AUTHORIZATION-GATE.md) — recorded
  `CONCRETE_CANDIDATE_EVIDENCE_LANE_AUTHORIZED` (`:106`).
- [Phase 49E File 5](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-OWNER-EVIDENCE-TIMING-GATE.md) — recorded
  `SIBLING_OWNER_EVIDENCE_TIMING_RECORDED` (`:89`).
- [Phase 49E File 6](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-TO-DECISION-SEPARATION-GATE.md) — recorded
  `EVIDENCE_TO_DECISION_SEPARATION_RECORDED` (`:111`).
- [Phase 49D File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SHORTLIST-GATE.md) — recorded
  `CONCRETE_CANDIDATE_SHORTLIST_PREPARED` (`:189`); the five candidates (`:123`–`:127`).
- [Phase 48P](./ADR-022E-CANONICAL-STORE-PHYSICAL-HOST-DEPENDENCY-DECISION-PREP-GATE.md) — `P-1 … P-11` (`:142`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — S2 UNSELECTED (`:156`).
- [ADR-048C](./decisions/ADR-048C-host-selection-candidate-matrix-no-host-decision.md) — the `M5`
  production-adapter-proposal shape (`:352`); the no-leak forbidden-surface list (`:491`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD). Read
  read-only; **not modified**.
- [ADR-022D](./decisions/ADR-022D-mvp-persistence-and-audit-owner.md) — the `StorageAdapter` swap-in seam (`:79`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49F File 7. Docs-only gate #8 concrete-candidate evidence packet rollup gate. It records
`CONCRETE_CANDIDATE_EVIDENCE_PACKETS_PARTIAL_RECORDED`: all five Phase 49F per-candidate packets recorded
`CONCRETE_CANDIDATE_EVIDENCE_PACKET_PARTIAL`. It ranks no candidate, accepts no candidate, rejects no candidate as a
final decision, selects no host, selects no production database, proposes no production adapter, and authorizes no
implementation. The selected next lane is a docs-only concrete-candidate evidence packet audit / decision-preparation
gate that must still not accept a host unless separately authorized. Gate #8 remains OPEN / HELD. No commit, no push,
no PR.*
