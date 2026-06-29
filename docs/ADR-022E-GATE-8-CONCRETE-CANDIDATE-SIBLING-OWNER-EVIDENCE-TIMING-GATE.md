# Phase 49E — ADR-022E Gate #8 Concrete-Candidate Sibling-Owner Evidence Timing Gate

> **Repo**: `loa-straylight` (`@loa/straylight`) — canonical primitive / substrate semantic owner.
> **Phase**: **Phase 49E (File 5 of 6)** — docs-only **sibling-owner evidence timing** gate for the canonical-store
> concrete-candidate shortlist (D.1(ii) / ADR-022E gate #8).
> **Status**: **docs / timing-record only.** Phase 49E File 1 recorded
> **`CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`** and answered EAQ-4: Finn / Dixie owner participation is
> not required before docs-only evidence gathering, but Finn / Dixie owner evidence is required before concrete
> candidate acceptance / gate #8 satisfaction, and Hounfour evidence remains only-if-required
> (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:140-146`). This file **records
> that timing rule** as **`SIBLING_OWNER_EVIDENCE_TIMING_RECORDED`**. It **records timing; it requests no sibling
> evidence and opens no sibling lane.** It ranks **no** candidate, accepts **no** candidate, selects **no** host,
> proposes **no** production adapter, and authorizes **no** implementation. The only change on this branch is
> **six** new Markdown files under `docs/`. No source, test, runtime, route, storage, DB, migration,
> auth/consent/signer, schema, config, CI, generated, `.claude`, `.loa`, `.run`, grimoire, memory, or sibling-repo
> path is touched.

**Naming note.** This file lands at **top-level `docs/`** (not under `docs/decisions/`), is **not** an ADR, and is
**not** numbered `ADR-049E` — following the live convention for the Phase 48 / 49 family. It records a bounded
**sibling-owner evidence timing rule**: it fixes *when* `loa-finn` / `loa-dixie` / `loa-hounfour` owner evidence is
and is not required relative to the evidence lane; it requests no sibling evidence and opens no sibling PR. The
immediate predecessor is **Phase 49E File 1**
([`./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md`](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md)),
which recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL`.

This is **File 5 of 6** in Phase 49E.

---

## 1. Source context (restated, not changed)

| Item | Recorded state | Authority / evidence |
|------|----------------|----------------------|
| **Phase 49B File 3 — sibling routing** | Recorded **`SIBLING_EVIDENCE_ROUTING_RECORDED`** — what sibling evidence may be needed later, with its routing; Hounfour only-if-schema/protocol-implicated. | `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md:192` |
| **Phase 49C File 4 — sibling-evidence request preparation** | Recorded **`SIBLING_EVIDENCE_REQUEST_PREPARED`** — Finn / Dixie / Hounfour request lanes prepared but not authorized. | `docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md:113` |
| **Phase 49D File 4 — sibling-evidence posture** | Recorded **`CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED`** — per-candidate Finn / Dixie held `PARTIAL_RECORDED`; Hounfour out of scope unless schema implicated. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md:103` |
| **Phase 49E File 1 — EAQ-4 response** | Recorded that Finn / Dixie owner participation is not required before docs-only gathering, is required before acceptance / gate #8 satisfaction, and Hounfour remains only-if-required. | `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:140-146` |

> Nothing in §1 is advanced, satisfied, discharged, resolved, started, or closed by this gate. The table is a
> status restatement only. The EAQ-4 response (File 1) is the entry baseline; this gate records the timing rule
> that response fixes — and goes no further.

**Sibling surfaces (non-canonical, preserved).** `loa-finn` (runtime / execution), `loa-dixie` (route-side ingress
/ control-plane), and `loa-hounfour` (schema / validation / policy) remain non-canonical participant surfaces only;
none owns the canonical estate record, and the lanes stay separable in code, test, and fixture
(`docs/handoffs/finn-runtime-boundary.md:18`; `docs/handoffs/finn-runtime-boundary.md:59`;
`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:159`). No sibling-repo PR may merge
without teammate review (`docs/handoffs/cross-repo-handoff-index.md:28`).

---

## 2. Timing rule

The sibling-owner evidence timing rule, recorded from the EAQ-4 response, is:

- **Evidence gathering may proceed first.** A later docs-only `P-1 … P-11` evidence packet PR may gather evidence
  for the five candidates **without** `loa-finn` or `loa-dixie` owner participation up front; sibling-owner
  participation is not a prerequisite to docs-only evidence gathering.
- **Sibling owner evidence must precede candidate acceptance / gate #8 satisfaction.** Before any concrete
  candidate can be accepted — and before gate #8 can be satisfied — `loa-finn` (gate #9) and `loa-dixie` (gate #10)
  owner evidence is **required** (`docs/decisions/ADR-022E-phase-22-deferred-features.md:58`;
  `docs/decisions/ADR-022E-phase-22-deferred-features.md:59`).
- **Hounfour remains only-if-required.** `loa-hounfour` evidence is required **only if** schema / protocol
  responsibilities become implicated (`docs/ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md:192`).
- **Sibling evidence gaps must remain visible in evidence packets.** The later packet's sibling-evidence posture
  field (File 4 §4.17) must record, per candidate, the state of `loa-finn` / `loa-dixie` / `loa-hounfour` evidence —
  including gaps — so a reviewer can see what remains outstanding before acceptance.

> The rule sequences *evidence* (gatherable first) ahead of *acceptance* (sibling-owner-gated). It neither requests
> sibling evidence nor authorizes any sibling PR; it only records when that evidence becomes a prerequisite.

---

## 3. Explicitly preserved sibling state

- **Gate #9** remains held with **`PARTIAL_RECORDED`**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:159`).
- **Gate #10** remains held with **`PARTIAL_RECORDED`**
  (`docs/ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md:161`).
- **No sibling PR is authorized** by this gate — neither `loa-finn` nor `loa-dixie` nor `loa-hounfour`
  (`docs/handoffs/cross-repo-handoff-index.md:28`).
- **No sibling repo is modified** by this gate.

---

## 4. Timing decision and rationale

The result is recorded against the permitted results for this gate, and the conservative-but-accurate result is
**`SIBLING_OWNER_EVIDENCE_TIMING_RECORDED`**:

1. **It is `SIBLING_OWNER_EVIDENCE_TIMING_RECORDED`** — the timing rule (§2) and the preserved sibling state (§3)
   are recorded coherently and within the EAQ-4 response. The timing is formable and recorded, so the timing is
   recorded.
2. **It is *not* `SIBLING_OWNER_EVIDENCE_TIMING_HELD`** — a held result would apply only if the timing could not be
   formed (for example, if the EAQ-4 response were missing or contradictory). The EAQ-4 response is recorded and
   consistent, so the timing is recorded, not held.
3. **It is *not* `PATCH_REQUIRED_SIBLING_OWNER_EVIDENCE_TIMING_AMBIGUOUS`** — a patch result would apply if the
   timing were ambiguous, internally inconsistent, or impossible to record without amendment. The timing is
   unambiguous and bounded: gathering first, sibling-owner evidence before acceptance, Hounfour only-if-required,
   gaps visible. No patch is required.

> **Timing-recorded ≠ sibling evidence requested ≠ sibling PR authorized ≠ candidate accepted ≠ gate #8
> satisfaction.** Recording `SIBLING_OWNER_EVIDENCE_TIMING_RECORDED` is the result of *this timing gate only*.
> **Gate #8 remains OPEN / HELD; gates #9 / #10 remain held (`PARTIAL_RECORDED`).**

---

## 5. Preserved blocked state

This gate preserves every held/open state unchanged:

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

## 6. Preserved non-claims

Each item below is preserved as a **negation**. This sibling-owner evidence timing gate:

- **does not satisfy** `ADR-022E:57` / gate #8 — gate #8 remains **OPEN / HELD**
  (`docs/decisions/ADR-022E-phase-22-deferred-features.md:57`);
- **does not satisfy** `ADR-022E:58` / gate #9 — gate #9 remains held (`PARTIAL_RECORDED`);
- **does not satisfy** `ADR-022E:59` / gate #10 — gate #10 remains held (`PARTIAL_RECORDED`);
- **does not discharge** gate #8;
- **does not resolve** **D.1(ii)** — the canonical-store physical-host dependency remains unresolved;
- **does not satisfy** full **D.1** — D.1 is not satisfied;
- **does not start** **D.2** — D.2 is not started;
- **does not close** **MVP-2** — MVP-2 remains open;
- **does not request** any sibling evidence — it records *when* sibling-owner evidence becomes a prerequisite;
- **does not open** any sibling lane or **authorize** any sibling PR;
- **does not modify** any sibling repo;
- **does not gather** any `P-1 … P-11` evidence;
- **does not rank** any candidate — ranking is a separate candidate decision gate;
- **does not accept** any candidate — acceptance is a separate candidate acceptance gate;
- **selects no concrete canonical-store physical host** — the host remains unselected
  (`docs/decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md:156`);
- **selects no production database** — none is selected;
- **proposes no production adapter** — adapter proposal remains a later separate request (EQ-5);
- **authorizes no implementation** of any kind — implementation remains a later separate request (EQ-6);
- **authorizes no** source / test / runtime / config / package / CI / schema / migration / SQL change;
- **authorizes no** production wiring.

> Every notion above appears in this document only inside a negation. Recording a sibling-owner evidence timing
> rule is not requesting any sibling evidence, opening any sibling lane, authorizing any sibling PR, gathering any
> evidence, ranking any candidate, accepting any candidate, selecting any host, proposing any adapter, satisfying
> any gate, or authorizing any implementation.

---

## 7. Return artifact / handoff

| Field | Value |
|-------|-------|
| **Phase** | Phase 49E (File 5 of 6) — gate #8 concrete-candidate sibling-owner evidence timing gate (docs-only) |
| **Predecessor** | Phase 49E File 1 — recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` (EAQ-4 timing answer) |
| **Decision result** | **`SIBLING_OWNER_EVIDENCE_TIMING_RECORDED`** — gathering may proceed first, sibling-owner evidence required before acceptance / gate #8 satisfaction, Hounfour only-if-required, gaps visible; not `SIBLING_OWNER_EVIDENCE_TIMING_HELD` (the timing is formable and recorded), not `PATCH_REQUIRED_SIBLING_OWNER_EVIDENCE_TIMING_AMBIGUOUS` (the timing is unambiguous and bounded) |
| **Timing rule** | evidence gathering may proceed first; `loa-finn` / `loa-dixie` owner evidence must precede candidate acceptance / gate #8 satisfaction; `loa-hounfour` only-if-required; sibling evidence gaps must remain visible in packets |
| **Sibling state** | gate #9 held `PARTIAL_RECORDED`; gate #10 held `PARTIAL_RECORDED`; no sibling PR authorized; no sibling repo modified |
| **Gate #8** | remains **`OPEN / HELD`**; `ADR-022E:57` not satisfied |
| **D.1(ii)** | unresolved (canonical-store physical-host dependency) |
| **D.1 / D.2 / MVP-2** | D.1 is not satisfied; D.2 is not started; MVP-2 remains open |
| **Host / adapter / implementation** | no concrete host selected; no production database selected; no candidate ranked or accepted; proposes no production adapter; authorizes no implementation |
| **Selected next lane** | docs-only concrete-candidate evidence packet lane (records per-candidate sibling-evidence posture, including gaps) that must not rank, accept, select a host, propose an adapter, or implement |
| **Scope of this PR** | exactly six new docs files; no commit / push / PR / comment / GitHub mutation by the authoring step; no sibling-repo write |

---

## 8. Audit checklist

- [ ] **Six-file change.** The branch adds exactly the six Phase 49E files and nothing else.
- [ ] **No forbidden paths.** No change under `src/`, `tests/`, `scripts/`, `package.json`, lockfiles,
      `.github/`, `.claude/`, `.loa/`, `.run/`, `grimoires/`, schema, migration, SQL, or any sibling repo.
- [ ] **State restated, not changed.** §1 / §3 / §5 keep gate #8 OPEN / HELD; gates #9 / #10 held; D.1(ii)
      unresolved; D.1 not satisfied; D.2 not started; MVP-2 open; no host chosen.
- [ ] **Timing recorded, not acted upon.** §2 records the timing rule; no sibling evidence is requested, no sibling
      lane is opened, no sibling repo is modified.
- [ ] **Result conservative and explained.** §4 records `SIBLING_OWNER_EVIDENCE_TIMING_RECORDED`; not HELD, not
      PATCH_REQUIRED.
- [ ] **No overclaim.** No affirmative claim of gate satisfaction, gate-#8 discharge, a ranked / accepted
      candidate, an opened sibling lane, an authorized sibling PR, gathered evidence, a proposed production adapter,
      or implementation — each appears only inside a negation (§6).
- [ ] **No product leak.** No connection string, port, credential, account / project identifier, region, topology,
      endpoint, or production wiring appears.
- [ ] **No mutation.** No commit, push, PR, issue, comment, or GitHub mutation by the authoring step; no sibling
      repo written to.

---

## 9. Source references

- [Phase 49E File 1](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md) —
  recorded `CONCRETE_CANDIDATE_EVIDENCE_AUTHORIZATION_PARTIAL` and the EAQ-4 timing answer (`docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-EVIDENCE-AUTHORIZATION-RESPONSE-INTAKE-GATE.md:140-146`). **Entry
  baseline / predecessor.**
- [Phase 49D File 4](./ADR-022E-GATE-8-CONCRETE-CANDIDATE-SIBLING-EVIDENCE-POSTURE.md) — recorded
  `CONCRETE_CANDIDATE_SIBLING_EVIDENCE_POSTURE_RECORDED` (`:103`).
- [Phase 49C File 4](./ADR-022E-GATE-8-SIBLING-EVIDENCE-REQUEST-PREPARATION-GATE.md) — recorded
  `SIBLING_EVIDENCE_REQUEST_PREPARED` (`:113`).
- [Phase 49B File 3](./ADR-022E-GATE-8-SIBLING-EVIDENCE-ROUTING-GATE.md) — recorded
  `SIBLING_EVIDENCE_ROUTING_RECORDED` (`:192`).
- [Phase 48N](./ADR-022E-SIBLING-GATE-9-10-EVIDENCE-RESULT-INTAKE-COMPLETION-GATE.md) — the held-state rows
  (`:159`, `:161`, `:163`, `:165`, `:167`, `:168`).
- [ADR-048B](./decisions/ADR-048B-canonical-store-physical-host-ownership-routing.md) — marks S2 UNSELECTED,
  owner "none" (`:156`); the S5 route-side row (`:159`); ownership does not follow location (`:221`).
- [ADR-022E gate inventory](./decisions/ADR-022E-phase-22-deferred-features.md) — gate #8 (`:57`, HELD); gate #9
  (`:58`); gate #10 (`:59`). Read read-only; **not modified**.
- [`finn-runtime-boundary.md`](./handoffs/finn-runtime-boundary.md) — the surfaces stay separable in code, test,
  and fixture (`:18`); Finn applies transitions through the wedge's `EstateStore` (`:59`).
- [`cross-repo-handoff-index.md`](./handoffs/cross-repo-handoff-index.md) — no sibling-repo PR may merge without
  teammate review (`:28`).

---

*End of Phase 49E File 5. Docs-only gate #8 concrete-candidate sibling-owner evidence timing gate. It records
`SIBLING_OWNER_EVIDENCE_TIMING_RECORDED` (not `SIBLING_OWNER_EVIDENCE_TIMING_HELD`, not
`PATCH_REQUIRED_SIBLING_OWNER_EVIDENCE_TIMING_AMBIGUOUS`): `loa-finn` / `loa-dixie` owner evidence is not required
before docs-only candidate evidence gathering, but is required before concrete candidate acceptance / gate #8
satisfaction; `loa-hounfour` evidence remains only-if-required if schema / protocol responsibilities become
implicated; and sibling evidence gaps must remain visible in evidence packets. Gate #9 and gate #10 remain held
with `PARTIAL_RECORDED`; no sibling PR is authorized and no sibling repo is modified. It requests no sibling
evidence, gathers no evidence, ranks no candidate, accepts no candidate, selects no host, proposes no production
adapter, and authorizes no implementation. No commit, no push, no PR.*
