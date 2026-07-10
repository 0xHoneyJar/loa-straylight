# ADR-022E Gate #8 — Sibling Evidence Response Intake Gate (PR A)

> **Phase**: 49P — sibling evidence intake (step 3 of the ADR-049 §10 operational sequence).
> **Type**: docs-only intake artifact. Effective as intake upon operator merge
> (`operator:eileen` is the sole Straylight decision authority, ADR-049 §6).
> **Authorizing frame**: Phase 49L operator decision (sibling evidence dispatch),
> ADR-049 §9–§10 (Railway direction pending intake; corridor compression to PR A + PR B).
> **Tier**: Tier 0 (evidence intake and mechanical verification) under ADR-049 §5.

---

## 1. What this document does

This is **PR A** of the compressed sequence recorded in ADR-049 §9.2/§10. Upon
operator merge, it:

1. cites both merged sibling evidence responses (§2);
2. **accepts them as evidence** (§3) — evidence only, per the
   evidence-versus-acceptance rule (ADR-049 §7);
3. records what each repo proves and cannot prove (§4–§5);
4. resolves the former sibling-evidence blockers B-1 and B-2 from the Phase 49I
   residual-blockers register (§6);
5. confirms that neither sibling repo becomes the Straylight semantic owner (§7);
6. records the remaining provider-level and implementation-level risks (§8);
7. routes directly to operator host acceptance — **PR B** (§9).

It does **not**: accept Railway PostgreSQL or any candidate; select a host or
production database; propose an adapter; satisfy or discharge gate #8, gate #9,
or gate #10; resolve D.1(ii); satisfy D.1; start D.2; close MVP-2; or authorize
implementation or production wiring. Those belong to PR B and later lanes.

## 2. Evidence responses cited

### 2.1 `loa-finn` — gate #9 (Phase 49M)

- PR: `0xHoneyJar/loa-finn#258` — "Phase 49M: record Finn gate 9 evidence response".
- Merged: 2026-07-10, squash commit `0e04a4c8f2d3865c58dd7c6afa9249d86bcc87e3`.
- Artifacts (exactly three docs-only files):
  - `docs/ADR-022E-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-PACKET.md`
    (`FINN_GATE_9_RAILWAY_POSTGRESQL_EVIDENCE_RESPONSE_RECORDED`)
  - `docs/ADR-022E-GATE-9-FINN-RUNTIME-BOUNDARY-EVIDENCE.md`
    (`FINN_GATE_9_RUNTIME_BOUNDARY_EVIDENCE_RECORDED`)
  - `docs/ADR-022E-GATE-9-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-ROLLUP.md`
    (`FINN_GATE_9_EVIDENCE_RESPONSE_ROLLUP_RECORDED`)

### 2.2 `loa-dixie` — gate #10 (Phase 49N)

- PR: `0xHoneyJar/loa-dixie#255` — "Phase 49N: record Dixie gate 10 evidence response".
- Merged: 2026-07-10, squash commit `d36c0846f03bfd097d35dd2c001de19eec817cf0`.
- Artifacts (exactly three docs-only files):
  - `docs/ADR-022E-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-PACKET.md`
    (`DIXIE_GATE_10_RAILWAY_POSTGRESQL_EVIDENCE_RESPONSE_RECORDED`)
  - `docs/ADR-022E-GATE-10-DIXIE-BOUNDARY-EVIDENCE.md`
    (`DIXIE_GATE_10_BOUNDARY_EVIDENCE_RECORDED`)
  - `docs/ADR-022E-GATE-10-RAILWAY-POSTGRESQL-EVIDENCE-RESPONSE-ROLLUP.md`
    (`DIXIE_GATE_10_EVIDENCE_RESPONSE_ROLLUP_RECORDED`)

### 2.3 Pre-merge audit record

Both PRs were audited before merge (2026-07-10): each adds exactly three
docs-only Markdown files, touches no source/test/config/package/CI/schema/
migration/state surface, carries an explicit non-claims section, observes the
no-leak posture (no credentials, connection strings, endpoints, hostnames,
ports, account/project IDs, regions, env-var values, pricing, or wiring
guidance), and advances no gate by itself. The single failing check on
finn#258 ("Scan Dependencies for Vulnerabilities" in a duplicate workflow run)
reflected pre-existing default-branch dependency state, not the docs-only
diff; the same-named check passed in the PR-event run.

## 3. Intake classification

| Lane | Response | Classification on operator merge |
|---|---|---|
| Gate #9 (`loa-finn`) | Phase 49M evidence response | `FINN_GATE_9_EVIDENCE_RESPONSE_ACCEPTED_AS_EVIDENCE` |
| Gate #10 (`loa-dixie`) | Phase 49N evidence response | `DIXIE_GATE_10_EVIDENCE_RESPONSE_ACCEPTED_AS_EVIDENCE` |

"Accepted as evidence" means exactly that: the responses are legible, bounded,
honestly qualified, and usable as input to the operator's host-acceptance
decision. It does not convert either response into gate satisfaction, candidate
acceptance, or authorization (ADR-049 §7).

## 4. What each repo proved (recorded)

### 4.1 Finn proved locally

- a feature-flagged, fail-closed, **host-agnostic** PostgreSQL integration path
  (boot throws on enabled-but-unconfigured; boot-time validation covers the
  three base tables only — a scoped, honestly qualified claim);
- schema-namespace isolation (`pgSchema("finn")`; Finn-local operational
  records only);
- WAL-first durability posture, with the PostgreSQL-independence claim
  correctly qualified as a storage-dependency claim, not a boot-sequence claim;
- enforce-not-define boundary surfaces at wire ingress (scoped: not a
  repo-wide single-constructor guarantee);
- negative evidence: zero `straylight`/`ADR-022E` coupling in `src/`; no
  Railway-specific configuration, dependency, or runtime binding in the `src/`
  runtime tree (two comment-only mentions disclosed; operator-side Railway
  cost-accounting tooling disclosed and correctly scoped out).

### 4.2 Dixie proved locally

- the Admission Wedge boundary ingress is default-off and env-gated,
  fail-closed by default;
- **zero local definitions** of canonical Straylight primitives (`Assertion`,
  `TransitionReceipt`, `AuditEvent`, `RecallReceipt`, `EstateTransition`);
  canonical types are `import type`-only from `@loa/straylight` /
  `@loa/straylight/host`;
- the spike tree is reference-carrying, not storage-owning, with test-enforced
  isolation from Dixie's own production DB/migration paths;
- Dixie's own DB layer is PostgreSQL-conversant but non-canonical and isolated
  — the candidate substrate *class* is not foreign to the codebase;
- no Railway-specific coupling in `app/src` (comment-only generic PaaS `PORT`
  convention disclosed).

## 5. What neither repo could prove (recorded)

Common to both, by construction and honestly declared:

- any operational property of Railway PostgreSQL or any managed provider
  (durability, backup/restore, failover, version pinning, network isolation,
  tenancy) — provider-side facts with no local artifact;
- the state of Straylight gates #8/#9/#10 — gate state lives in
  `loa-straylight`;
- end-to-end cross-repo alignment or live end-to-end behavior;
- suitability of their own persistence surfaces for canonical-store duty.

Both repos correctly deferred canonical-store semantics, candidate acceptance,
substrate contract, and gate #8 disposition to Straylight; each deferred the
other's lane to its owner; both deferred adapter/host/wiring to a later,
separately authorized production decision. Both answered the closing topic
question identically: **no further sibling-side artifact is needed before
Straylight may request/exercise candidate acceptance authority** (with Dixie's
bounded caveat that a future substrate contract may create a later bounded
Dixie lane — a deferral, not a present gap).

## 6. Blocker resolution

From the Phase 49I preferred-candidate residual-blockers register:

- **B-1 (Finn gate #9 owner evidence)** — RESOLVED as an intake blocker: the
  requested evidence response exists, is merged, and is accepted as evidence.
  Gate #9 itself remains held; the two semantic-ownership-creep findings
  (`TIER_TRUST_MAP`, `CRITICAL_ACTIONS`) remain unresolved and are carried as
  implementation-level risk (§8).
- **B-2 (Dixie gate #10 owner evidence)** — RESOLVED as an intake blocker: the
  requested evidence response exists, is merged, and is accepted as evidence.
  Gate #10 itself remains held; its merged `PARTIAL` posture is unchanged.

B-3 through B-11 remain open and route to PR B and later lanes.

## 7. Semantic ownership confirmation

Both evidence responses affirm, and this intake confirms, that **neither
`loa-finn` nor `loa-dixie` becomes the Straylight semantic owner**. Straylight
remains the semantic owner of the canonical-store boundary
(`STRAYLIGHT_OWNED_CANONICAL_ESTATE_STORE_BOUNDARY`, Phase 48U/48V); Finn
remains enforce/emit/persist under externally defined semantics; Dixie remains
a reference-carrying boundary/relay surface. No primitive moved.

## 8. Remaining risks (recorded for PR B and the implementation lane)

**Provider-level** (unverifiable from any sibling repo; must be addressed by
PR B's clauses and the implementation lane's operational evidence):
durability guarantees; backup/restore behavior (a documented backup/restore
test is mandatory before production admission — ADR-049 §9.1 clause 4);
failover and availability; version pinning; network isolation and tenancy;
credential handling at the deployment boundary; incident recovery.

**Implementation-level**:
- Finn's two documented semantic-creep findings must be treated separately
  before Finn could host the gate #9 runtime responsibility cleanly;
- Finn's database-client construction has two seams (runtime factory +
  migration runner) — a future host change touches both;
- Finn's boot validation covers base tables only; schema drift beyond them
  surfaces at query time;
- Dixie's boundary behavior under a real substrate contract cannot be known
  until Straylight defines that contract; a later bounded Dixie lane may be
  needed after it exists;
- the full MVP-2 remaining-work list (ADR-049 §3.2) stands: provider-neutral
  adapter, durable migrations, backup/restore validation, live auth/identity
  binding, consent enforcement and receipts, production-grade signer handling,
  idempotency/concurrency, end-to-end admission-to-recall acceptance,
  operational and rollback evidence.

## 9. Routing

This intake routes **directly to operator host acceptance — PR B**: the
Railway PostgreSQL acceptance and implementation-authorization ADR specified
by ADR-049 §9–§10 (Tier 1; operator-signed; carrying the ten §9.1
rollback/portability clauses; discharging ADR-022E gate #8 for that bounded
purpose; authorizing the provider-neutral PostgreSQL `StorageAdapter` and the
durable implementation/migration lane).

No further sibling request/authority/request-response gates are inserted
between this intake and PR B (ADR-049 §9.2).

## 10. Preserved state

Until PR B merges under operator signature: ADR-022E gate #8 remains
**OPEN / HELD**; gates #9 and #10 remain held (evidence accepted ≠ gate
satisfied); D.1(ii) remains unresolved; full D.1 remains **NOT YET
SATISFIED**; D.2 remains **NOT STARTED**; **MVP-2 remains OPEN**; no host is
accepted; no adapter is proposed; no implementation or production wiring is
authorized.

## 11. Result

**Result token**: `SIBLING_GATE_9_10_EVIDENCE_RESPONSES_INTAKEN`
