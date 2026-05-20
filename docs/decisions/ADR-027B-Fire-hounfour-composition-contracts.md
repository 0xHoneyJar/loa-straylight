# ADR-027B-Fire — Hounfour composition-contract evidence lock (Phase 28A)

## Status

Accepted-for-Phase-28A.

ADR-027B-Fire is a **Straylight-side evidence lock** that
adjudicates the post-merge Hounfour-side artifact recorded in
Hounfour PR #116 (origin/main resolves at `c06ef1ba`) against
the readiness inventory in [ADR-027B](./ADR-027B-hounfour-return-gate-readiness.md)
§"Decision" §2 and the canonical return-gate criteria in
[ADR-027A](./ADR-027A-post-dixie-return-gate.md) §"Decision" §4.

Despite its file name, ADR-027B-Fire **does not fire** the
ADR-022E shape-adoption gate set (#1, #2, #3, #4, #5, #17, #18).
It records the post-merge composition-contract evidence,
narrows ADR-027B §"Decision" §2 §4.a from `PENDING-FOR-V8.6.x-
ADOPTION-TARGET` to `READY-AS-COMPOSITION-SUBSTRATE; PENDING-
AS-SHAPE-ADOPTION`, and otherwise leaves §4.b–§4.e in their
prior dispositions. The pre-merge real 3-model Flatline +
Bridgebuilder gate at ADR-027B §"Decision" §2 §4.d / ADR-027A
§"Decision" §4.d **remains unsatisfied**. The ADR-022E gate
set named above **remains held**.

Per [ADR-026A0 §3](./ADR-026A0-operator-authority-flatline-rule.md)
and [ADR-027A §"Decision" §8.o](./ADR-027A-post-dixie-return-gate.md),
ADR-027B-Fire is the **second class** of doc — it tightens
refusal by enumerating which Hounfour PR #116 evidence rows
have or have not arrived; it does not author code, does not
widen any Straylight surface, does not amend the runtime
allowlist, does not flip a dependency, does not pin a target
adoption version, does not declare an `$id` adoption, does
not declare a JS subpath adoption, does not pre-approve any
successor, and does not authorize a sibling-repo edit.
ADR-027B-Fire's own pre-merge Flatline + Bridgebuilder is at
operator discretion under ADR-026A0 §3 because it does **not**
create authorization in the §3 first-class sense; the
gate-firing successor it contemplates (referred to here as
**ADR-027B-Fire-FlipShape** without committing to that file
name) inherits the full first-class requirement on its own.

ADR-027B-Fire does **not** authorize:

- a re-open of `loa-dixie` PR #102 or any post-merge edit to
  Phase 26E;
- a re-implementation of Phase 26E in `loa-straylight`;
- a second Dixie endpoint, a second runtime subpath, or any
  Phase 24E S2–S6 surface;
- Hounfour shape adoption (ADR-022E gates #1–#5, #17, #18
  remain held);
- Finn wiring (ADR-022E gate #9 remains held; see
  [ADR-027C](./ADR-027C-finn-return-gate-readiness.md));
- Freeside wiring (ADR-022E gate #11 remains held);
- production storage migration (ADR-022E gate #8 remains
  held);
- a bump of the existing `@0xhoneyjar/loa-hounfour` dependency
  beyond the pinned posture;
- a new Straylight runtime export, a new Straylight runtime
  subpath, an amended runtime allowlist, a new public type
  re-export, or any change to
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md);
- signature verification, policy execution, audit-chain
  enforcement, a storage adapter, recall execution changes, or
  any new Straylight runtime code;
- any Loa framework / control-plane / model-substrate edit;
- any tag, release, package publish, or PR;
- any sibling-repo edit. ADR-027B-Fire is a Straylight-side
  evidence record and authorizes no PR in `loa-dixie`,
  `loa-finn`, `loa-hounfour`, `loa-freeside`, `loa`, or any
  other repo.

ADR-027B-Fire edits no prior ADR. It touches only the three
Phase 28A files listed in §"Decision" §1; it touches no file
under `src/`, `tests/`, `fixtures/`, `scripts/`, `dist/`,
`dist-types/`; no `package.json` / `package-lock.json` /
`tsconfig*` / `vitest.config.ts` / `.npmrc` / `.gitignore` /
`.loa.config.yaml`; no `.loa/` / `.claude/` / `.beads/` /
`.run/` / `.github/` / `.codex/` / `.agents/` / `.vitest/` /
`grimoires/`; no `node_modules/`;
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) and
[`../mvp/threat-model.md`](../mvp/threat-model.md) are
**not** edited; no `loa-dixie` / `loa-finn` / `loa-hounfour` /
`loa-freeside` / `loa` / `freeside-characters` file is edited.
It cuts no tag, files no issue / comment / PR, and does not
stage any file.

## Context

ADR-027B §"Decision" §2 paired the canonical
[ADR-027A §"Decision" §4](./ADR-027A-post-dixie-return-gate.md)
Hounfour return-gate rows (§4.a–§4.e) with a current-state
inventory and named the missing-for-ADR-027B-Fire columns row
by row. Phase 27B's coding-candidate note
([`../handoffs/phase-27b-phase-28-coding-candidate.md`](../handoffs/phase-27b-phase-28-coding-candidate.md))
identified the likely first code-bearing slice as a
Hounfour-side PR opened in `loa-hounfour` under teammate
review, gated by an ADR-027B-Fire successor.

Phase 28A's trigger evidence is that Hounfour PR #116 has
**already merged** in `0xHoneyJar/loa-hounfour` (origin/main =
`c06ef1ba`) under that repo's own conventions. The user's
read-only audit (Codex, recorded as audit evidence under
ADR-027A §"Decision" §6 and ADR-026A0 §"Decision" §3, not as
authorization) characterises the merged artifact as **strict-
additive composition over existing primitives**: it ships
documentation, a conformance category, a soft audit prefix,
five conformance vectors, the corresponding Vitest, and a
generated conformance-vector JSON Schema update; it ships no
new domain `$id` schemas, no runtime authority, no runtime
policy, no signature verification, no audit-chain
enforcement, no storage adapter, no recall execution, no
Dixie integration, no Finn integration, and no Straylight
runtime code.

The plain reading is therefore: **Hounfour PR #116 is the
"Straylight Recall Wedge composition contracts" artifact**,
not the "Hounfour schema extraction" artifact contemplated
under [`../handoffs/hounfour-schema-extraction-issue.md`](../handoffs/hounfour-schema-extraction-issue.md)
and the Phase 9 / 17B / 18 / 19A / 21B chain. Composition
contracts are *evidence about how to test conformance against
existing wedge primitives*; they are not new shapes for the
wedge to adopt. ADR-027B-Fire records this distinction because
it is load-bearing: the ADR-022E gate set ADR-027B contemplated
firing (#1, #2, #3, #4, #5, #17, #18) is **shape-adoption-
oriented** — each row's trigger requires a published shape,
an exact `$id`, an exact JS subpath, or an exact public
re-export. Composition contracts neither propose nor supply
any of those triggers. Whether the composition-contract
evidence may yet authorize a *different*, **smaller**, future
Straylight code-bearing PR (e.g., a private-alias consumption
of the five conformance vectors or the soft audit prefix as a
test-only / boundary-preservation construct) is a question
this ADR explicitly defers to a future first-class successor.

### Relationship to ADR-026A0 / ADR-027A / ADR-027B

ADR-026A0 §"Decision" §3 distinguishes **docs that create
authorization** (first class — ADR + trigger that unblocks a
downstream gate; boundary doc that widens a permitted
surface; refusal-rule "no" → "yes" amendment) from **docs
that do not create authorization** (status intake;
corrigendum; refusal narrowing; evidence record).

ADR-027B-Fire is the **second class**. It enumerates which
Hounfour PR #116 evidence rows arrived and which did not; it
narrows ADR-027B §"Decision" §2 §4.a substrate disposition
without firing any gate; it does not amend the runtime
allowlist, does not pin a target version, does not declare a
shape adoption, does not relax any prior refusal. Per
ADR-026A0 §3, the pre-merge real 3-model Flatline +
Bridgebuilder requirement therefore applies at **operator
discretion** for ADR-027B-Fire itself.

The future ADR-027B-Fire-FlipShape (or any other successor
that fires an ADR-022E gate in the Hounfour set) is
unambiguously the **first class** under ADR-026A0 §3, and
each independently inherits the full source / package /
runtime / test / dependency / public-surface pre-merge
Flatline + Bridgebuilder requirement. ADR-027B-Fire
pre-approves no successor.

### What is *not* authority

Pinned per [ADR-027A §"Context" → "What is *not* authority"](./ADR-027A-post-dixie-return-gate.md)
and [ADR-026A0 §"Decision" §6.Forbidden](./ADR-026A0-operator-authority-flatline-rule.md):

- The Codex read-only audit summary referenced in §"Context"
  above is **audit evidence the operator weighs**; it is not
  authorization. Codex did not run pre-merge real 3-model
  Flatline; Codex did not run Bridgebuilder. The Codex audit
  log explicitly skipped `check:dist-parity` because that
  script writes to tracked `dist/` and the audit was
  read-only. Codex audit evidence does not satisfy ADR-027A
  §"Decision" §4.d.
- Persisted agent memory (auto-memory, `observations.jsonl`,
  framework `.run/` / `.claude/` / `.beads/` / `grimoires/`,
  vector-store retrieval, long-context window dumps) is not
  authorization.
- ChatGPT advisory output, headless generative review, prior
  Flatline multi-model verdicts on unrelated phases, prior
  Bridgebuilder reviews on unrelated phases, and Cheval
  delegation outputs are **audit evidence**, not authority.
- Degraded local Flatline / Bridgebuilder / Cheval / Bedrock /
  Codex / model-routing substrate (cf. Phase 26F §7.1) is a
  Loa-side control-plane concern, not a Straylight phase
  trigger. ADR-027B-Fire does not sequence Loa-side substrate
  hardening against Straylight phase work, does not treat
  substrate degradation as a reason to weaken the §4.d gate,
  and does not treat substrate degradation as a reason to
  re-do or re-open `loa-dixie` PR #102.

## Decision

### 1. File set

ADR-027B-Fire establishes only:

- **New:** this ADR.
- **Append-only:**
  [`../handoffs/README.md`](../handoffs/README.md) — a Phase
  28A index entry, in chronological order, after the Phase
  27B entry.
- **Append-only:**
  [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — a narrow Phase 28A composition-contract evidence-lock
  navigation pointer appended after the Phase 27B navigation
  pointer.

ADR-027B-Fire touches no other file. No prior ADR is edited.
No prior handoff is edited except the two append-only updates
above.

### 2. Hounfour PR #116 — what landed (citable)

The following is the working list of artifacts the user's
read-only audit reports as having landed in
`0xHoneyJar/loa-hounfour` PR #116 at origin/main =
`c06ef1ba`. ADR-027B-Fire treats the list as **audit evidence
the operator weighs**, not as a manifest produced by this
ADR; the canonical artifact is the merged Hounfour-side
commit, not this list:

| Artifact | Class |
|---|---|
| `docs/architecture/recall-wedge-composition.md` | Architecture documentation; explains how the recall-wedge composes over existing Hounfour primitives. |
| `recall-wedge` conformance category | Conformance taxonomy; sits inside the existing conformance-vector machinery. |
| `0xhoneyjar:straylight:` soft audit prefix | String constant; namespaces wedge-emitted soft-audit identifiers without changing audit-chain semantics. |
| Five `recall-wedge` conformance vectors | Test inputs for the wedge surface, exercising request-to-pack, pack-to-receipt, receipt-to-commitment, commitment_type, packed assertion item, admitted assertion, signatures-present, and `recall_scope === surface_context`. |
| `tests/vectors/recall-wedge-vectors.test.ts` | Vitest harness driving the five conformance vectors; deliberately does not verify hashes or signatures, preserving class-validation vs policy-validation separation. |
| `schemas/conformance-vector.schema.json` (generated) update | Schema of the conformance-vector envelope; not a new domain `$id` for wedge primitives. |
| CHANGELOG / release-integrity / `dist/` artifacts | Per Hounfour repo's own conventions; not a Straylight artifact. |

The audit further reports that no new domain `$id` namespace
was added; no new public root export, no new package subpath,
and no new TypeScript public-surface symbol on the
`@0xhoneyjar/loa-hounfour` package were declared; existing
root / governance / schema exports were verified sufficient;
and no new `EstateTransition`, `Challenge`, `safeCanonicalize`,
or `AuditEvent` shape was shipped.

### 3. Mapping to ADR-027B §"Decision" §2 readiness rows

For each ADR-027B row, the disposition is recorded **after
Hounfour PR #116** along with what is still missing for any
gate-firing successor.

| ADR-027B §2 row | Pre-#116 disposition | Post-#116 disposition | Still missing for any gate-firing successor |
|---|---|---|---|
| **§4.a Upstream substrate evidence** | `PENDING` for v8.6.x adoption-target version. | `READY-AS-COMPOSITION-SUBSTRATE` (citable Hounfour HEAD `c06ef1ba`; citable composition document; citable conformance category; citable soft audit prefix; citable five vectors + harness; citable generated conformance-vector schema). `PENDING-AS-SHAPE-ADOPTION` (no new domain `$id` shipped; no new JS subpath shipped; no new TS public symbol shipped; no `EstateTransition` / `Challenge` / `safeCanonicalize` / `AuditEvent` shape shipped). | A successor that proposes a **shape adoption** must still pin one target `@0xhoneyjar/loa-hounfour@x.y.z`, the exact `$id` namespace, the generated JSON Schema artifact path within the published package, the exact JS subpath(s), and the exact TS / type export evidence. A successor that proposes a **conformance-vector-only or soft-audit-prefix-only** consumption must additionally pin which exact import path it consumes, that no `$id` is adopted into the wedge public surface, that no runtime export is added, and that the conformance vectors enter only as boundary-preservation test inputs (not as production fixtures). |
| **§4.b Threat-model impact statement** | `READY` (substrate present; per-flip impact statement deferred to flip-time). | `READY` unchanged. Hounfour PR #116 itself adds **no Straylight-side surface**, no runtime, no authority, no signature verification, no policy execution, no audit-chain enforcement, no storage adapter, no recall execution, and no Dixie / Finn integration. Per the audit, the harness deliberately does not verify hashes or signatures, preserving the class-validation vs policy-validation separation pinned by [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md). T13–T18 + the T9 persistence-posture amendment are not impacted by Hounfour PR #116 in isolation. | A successor that proposes any in-repo Straylight consumption must state per-symbol impact under T13–T18 + T9 and explicitly preserve or refuse the class-vs-policy boundary for each adopted symbol. ADR-027B-Fire does not edit [`../mvp/threat-model.md`](../mvp/threat-model.md). |
| **§4.c Consumer-contract delta** | `READY` (allowlist held). | `READY` unchanged. The runtime allowlist remains `{ handleRecallIntake, createDixieCapability, DixieCapabilityError, DixieCapability (type) }` per [ADR-026A](./ADR-026A-runtime-recall-intake-subpath.md) §"Decision" §3 and Phase 26B / 26B-F. Hounfour PR #116 does **not** require an allowlist delta because it adds no Straylight runtime export. | Any successor that proposes a runtime allowlist delta must supply its own ADR-026A0 §3 first-class authorization for that delta. ADR-027B-Fire proposes no delta. |
| **§4.d Pre-merge real 3-model Flatline + Bridgebuilder** | `PENDING` / **currently unsatisfied** while Loa control-plane substrate is degraded (Phase 26F §7.1; ADR-027A §"Decision" §4.d). | `PENDING` / **currently unsatisfied** unchanged. The Codex read-only audit on Hounfour PR #116 is **audit evidence**, not a 3-model Flatline pass and not a Bridgebuilder review. The Hounfour-side PR was reviewed under Hounfour's own conventions, not Straylight's pre-merge §4.d gate. ADR-027B-Fire itself is a second-class doc under ADR-026A0 §3 and does not need to satisfy §4.d for itself, but it cannot pre-satisfy §4.d for any first-class successor. | Any successor that fires an ADR-022E gate, that proposes any in-repo Straylight code consumption, or that proposes a runtime-allowlist delta must show **real 3-model Flatline (PASS or REVISE-with-resolution) AND real Bridgebuilder review on its own gate-firing PR**. Substrate-degradation findings on the successor are audit evidence the operator weighs; they are not a reason to bypass §4.d. |
| **§4.e ADR-022E gates remain held** | `HELD` for #1, #2, #3, #4, #5, #17, #18. | `HELD` unchanged for #1, #2, #3, #4, #5, #17, #18. See §4 below for per-gate analysis. | Any successor must explicitly enumerate which gates it fires and supply each gate's individual trigger evidence per ADR-022E's per-row trigger column. ADR-027B-Fire fires none of them. |

### 4. Mapping to ADR-022E gate inventory

For each ADR-022E gate ADR-027B contemplated, the post-#116
disposition and the reason it remains held:

| ADR-022E gate | Trigger column (verbatim spirit) | Hounfour PR #116 evidence | Disposition |
|---|---|---|---|
| **#1 — `EstateTransition` schema (canonical) and on-the-wire envelope** | Hounfour ships an `estate-transition.schema.json` (or equivalently named) under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.x/`, **and** a separate ADR adopts it under ADR-020C / ADR-022C. | Hounfour PR #116 ships **no** `estate-transition.schema.json` and **no** new domain `$id` under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.x/`. The `schemas/conformance-vector.schema.json` update is the *envelope* schema for conformance vectors, not an `EstateTransition` shape. | **HELD.** Trigger conjunction unsatisfied (no schema shipped; no adopting ADR). |
| **#2 — `EstateTransition` local implementation** | Either gate #1 unblocks (then adopt by alias), **or** a separate ADR explicitly authorizes a local `EstateTransition` type / schema / fixture. | Hounfour PR #116 does not unblock #1. ADR-027B-Fire authorizes no local `EstateTransition` type / schema / fixture. | **HELD.** |
| **#3 — `safeCanonicalize` JS-subpath adoption** | Hounfour ships a declared `./canonicalize` (or `./utilities`) subpath whose JS module exports `safeCanonicalize`, **and** a separate ADR adopts the subpath. | Hounfour PR #116 declares **no** new JS subpath. The audit explicitly verified that existing root / governance / schema exports were sufficient and that no new subpath / export is required. | **HELD.** |
| **#4 — `Challenge` adoption into the wedge's public surface** | A separate ADR cites the v8.6.0 `$id`, specifies the alias / re-export path, and pins a boundary preservation test. | Hounfour PR #116 ships no `Challenge` adoption authorization. ADR-027B-Fire pins no alias / re-export and authorizes no boundary preservation test for `Challenge`. | **HELD.** |
| **#5 — `AuditEvent` adoption from a Hounfour candidate** | A separate ADR explicitly adopts one of the v8.6.x candidates as the canonical `AuditEvent` shape (or Hounfour ships an `AuditEvent` schema under that name). | Hounfour PR #116 ships no `AuditEvent` schema and no `AuditEvent` adoption authorization. | **HELD.** |
| **#17 — Eleven exported-but-unconsumed Hounfour JS subpaths** | A documented, evidence-backed Straylight need + a separate ADR + a future implementation phase that explicitly cites the authorization. | Hounfour PR #116 declares no twelfth subpath. ADR-027B-Fire authorizes no consumption of any of the eleven. | **HELD.** |
| **#18 — Adoption of a Hounfour-named symbol into the wedge's public surface** | A separate ADR explicitly authorizes a public re-export and pins a boundary preservation test. | Hounfour PR #116 ships no Straylight-side public re-export change. ADR-027B-Fire authorizes no public re-export and pins no public-surface boundary preservation test. | **HELD.** |

The composition-contract artifacts named in §2 (the
architecture document, the conformance category, the soft
audit prefix, the five conformance vectors, the conformance
harness, and the conformance-vector envelope schema) do not
fall under any ADR-022E gate's trigger column. They are
**conformance evidence the wedge may use in *future* boundary-
preservation tests**, gated by a separate first-class
successor ADR that satisfies §4.d.

### 5. Codex audit evidence — what is accepted, what is not authority

ADR-027B-Fire accepts the following from the user's read-only
Codex audit, **as audit evidence the operator weighs**, not as
authorization:

- The Hounfour origin/main HEAD pin (`c06ef1ba`) at audit
  time and the empty `HEAD..origin/main` tree diff statement.
- The plain-reading characterization that Hounfour PR #116 is
  strict-additive composition over existing primitives.
- The list of artifacts in §2.
- The Hounfour-side validation summary: `npm test` (305
  files, 9,486 tests passed); the targeted recall / vector /
  vocabulary subset (701 tests passed); `npm run schema:check`;
  `npm run vectors:check`; `npm run schemas:validate`;
  `npm run check:class-policy-boundary`; `npm run semver:check`;
  `npm run check:release-integrity-parity`; `npm run typecheck`;
  `git diff --check ad108cb5..HEAD`.
- The deliberate omission of `npm run check:dist-parity` (the
  script writes to tracked `dist/`; the audit was read-only).
- The dedicated harness coverage statement (request-to-pack,
  pack-to-receipt, receipt-to-commitment, commitment_type,
  packed assertion item, admitted assertion, signatures-
  present, and `recall_scope === surface_context`).
- The class-vs-policy preservation statement (the harness
  deliberately does not verify hashes or signatures).

ADR-027B-Fire **does not accept** the following as authority:

- **Codex audit is not a 3-model Flatline pass.** ADR-027A
  §"Decision" §4.d / §6 / §8.h and ADR-026A0 §"Decision" §3
  / §6.Forbidden are dispositive: multi-model findings are
  audit evidence the operator weighs; they are not
  authorization for surface widening, an ADR-022E gate
  firing, an allowlist change, a runtime subpath addition,
  a tag / release / publish, or a sibling-repo edit.
- **Codex audit is not a Bridgebuilder review.** Same
  treatment.
- **The Hounfour-side review under Hounfour's own conventions
  is not Straylight's §4.d gate.** Hounfour-side review
  governs what Hounfour merges into Hounfour; Straylight's
  §4.d gate governs what Straylight merges into Straylight.
- **Persisted agent memory and long-context window dumps are
  not authority.** Per ADR-027A "What is *not* authority"
  and ADR-026A0 §"Decision" §6.Forbidden.

### 6. Pre-merge Flatline + Bridgebuilder posture for ADR-027B-Fire

ADR-027B-Fire is a Phase 28A docs-only evidence record under
ADR-026A0 §"Decision" §3. It tightens refusal by enumerating
which Hounfour PR #116 evidence rows have arrived; it does
not create authorization in the §3 first-class sense. Per
ADR-026A0 §"Decision" §3, the pre-merge real 3-model Flatline
+ Bridgebuilder requirement is therefore at **operator
discretion** for ADR-027B-Fire itself.

This operator-discretion posture is recorded explicitly so
that no future doc may cite ADR-027B-Fire as having
**satisfied** the §4.d gate. ADR-027B-Fire does not satisfy
§4.d. ADR-027B-Fire does not pre-satisfy §4.d for any
successor. ADR-027B-Fire does not waive §4.d. ADR-027B-Fire
does not move §4.d to operator-discretion for any first-class
successor.

The §4.d gate **remains currently unsatisfied** for any
future ADR-027B-Fire-FlipShape (or other first-class
successor) for as long as the Loa control-plane substrate is
degraded (cf. Phase 26F §7.1). Substrate-degradation findings
on the successor are audit evidence the operator weighs; they
are not a reason to bypass §4.d.

ADR-027B-Fire permits drafting a separate docs-only
successor proposal for conformance-vector-only,
soft-audit-prefix-only, or private-alias planning, but does
not authorize code or pre-satisfy that successor's §4.d
review gate.

### 7. Adjudication summary

| Question | Answer |
|---|---|
| Does the evidence fire ADR-027B-Fire fully, partially, or not yet? | **Not yet, in the gate-firing sense.** ADR-027B-Fire (this ADR) records that Hounfour PR #116 ships composition-contract evidence and that ADR-027B §"Decision" §2 §4.a substrate disposition narrows from `PENDING-FOR-V8.6.x-ADOPTION-TARGET` to `READY-AS-COMPOSITION-SUBSTRATE; PENDING-AS-SHAPE-ADOPTION`. It does **not** fire any ADR-022E gate; it does **not** satisfy §4.d; it does **not** authorize any in-repo Straylight code-bearing PR. The original ADR-027B `Hounfour return gate` therefore **remains structurally held** in its shape-adoption flavor. |
| Which ADR-027B readiness rows are satisfied? | §4.a is **substrate-narrowed** but not adoption-ready. §4.b and §4.c remain `READY` (unchanged by Hounfour PR #116 in isolation). §4.d remains `PENDING` / **currently unsatisfied**. §4.e remains `HELD`. |
| Which evidence comes from Hounfour PR #116 / `c06ef1ba`? | Per §2 — the architecture composition document, the conformance category, the soft audit prefix, the five conformance vectors, the conformance harness, the generated conformance-vector envelope schema update, and Hounfour-side CHANGELOG / release-integrity / dist artifacts per Hounfour's own conventions. |
| Which validation evidence is accepted? | Per §5 — the listed Hounfour-side validation runs are accepted as audit evidence. `check:dist-parity` was skipped (read-only audit constraint) and is therefore not accepted as having run. |
| Which evidence remains missing? | Per §3 last column — for any shape-adoption successor: a pinned `@x.y.z` + `$id` namespace + JSON Schema artifact path + JS subpath + TS export evidence; for any conformance-vector-only or soft-audit-prefix-only consumption successor: the exact import path, the explicit "no `$id` adoption / no runtime export" statement, and the boundary-preservation test plan. For both classes: a real 3-model Flatline + Bridgebuilder pass on the gate-firing PR (§4.d remains currently unsatisfied). |
| Pre-merge real 3-model Flatline + Bridgebuilder posture for this ADR | **Operator discretion** under ADR-026A0 §"Decision" §3 because ADR-027B-Fire is a second-class evidence record. The §4.d gate is **not** satisfied, **not** waived, and **not** pre-satisfied for any successor by this ADR. |
| ADR-022E gate dispositions | #1 **HELD**; #2 **HELD**; #3 **HELD**; #4 **HELD**; #5 **HELD**; #17 **HELD**; #18 **HELD**. See §4. |
| May a future Straylight private-alias adoption PR be proposed now? | **No, not under ADR-027B-Fire alone.** A private-alias *shape* adoption requires a successor ADR that fires at least one of #1, #4, #18 (and possibly #3 or #17 depending on the path), and that satisfies §4.d. A private-alias *conformance-vector-only* / *soft-audit-prefix-only* consumption (e.g., importing the five vectors as boundary-preservation test inputs, or re-using the `0xhoneyjar:straylight:` string as a constant) requires a separate first-class successor ADR — that successor must on its own pin the import path, the no-`$id`-adoption / no-runtime-export statement, the boundary-preservation test plan, the threat-model impact statement under T13–T18 + T9, the rollback, and the §4.d real Flatline + Bridgebuilder pass. ADR-027B-Fire pre-approves none of this. |
| What may the next Straylight coding phase be — if and only if a first-class successor fires the gate? | If, and only if, a first-class successor (e.g., ADR-027B-Fire-FlipShape, or an ADR-027B-Fire-Conformance-Consumption analogue) merges and satisfies §4.d, the next Straylight coding phase may be the in-repo private-alias slice the successor authorizes (and only in the form the successor authorizes). Without such a successor, no Phase 28-onwards code-bearing PR is authorized. |
| What remains explicitly forbidden | See §8 below. |

### 8. Explicit forbidden list

ADR-027B-Fire forbids each of the following as a consequence
of itself; reviewers may cite this section verbatim to refuse
a PR that treats ADR-027B-Fire as authorization for any of:

- **8.a — Runtime allowlist widening.** The runtime allowlist
  remains `{ handleRecallIntake, createDixieCapability,
  DixieCapabilityError, DixieCapability (type) }` per
  [ADR-026A](./ADR-026A-runtime-recall-intake-subpath.md)
  §"Decision" §3, Phase 26B, and ADR-027A §"Decision" §4.c.
- **8.b — Dixie endpoint changes.** No re-open of `loa-dixie`
  PR #102; no second Dixie endpoint; no second runtime subpath;
  no Phase 24E S2–S6 surface; no ADR-026D-equivalent successor
  authorized by ADR-027B-Fire (cf. ADR-027A §"Decision" §8.a–
  §8.d).
- **8.c — Finn runtime adoption.** ADR-022E gate #9 remains
  held. ADR-027B-Fire does not authorize any move of
  `handleRecallIntake` enforcement into Finn; that path is
  governed by [ADR-027C](./ADR-027C-finn-return-gate-readiness.md)
  and a separate first-class successor.
- **8.d — New public Straylight exports.** Root
  `@loa/straylight` and `@loa/straylight/host` remain
  `"types"`-only. No new public symbol, no new subpath, and no
  new public type re-export is authorized by ADR-027B-Fire.
- **8.e — Signature verification.** ADR-027B-Fire authorizes
  no signature verification path. The Hounfour conformance
  harness deliberately does not verify hashes or signatures
  per the audit; that posture is preserved.
- **8.f — Policy execution.** ADR-027B-Fire authorizes no
  policy-execution code; the class-vs-policy boundary at
  [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  is preserved.
- **8.g — Storage adapters.** ADR-022E gate #8 remains held;
  ADR-027B-Fire authorizes no storage adapter / persistence
  substrate change.
- **8.h — Audit-chain enforcement.** ADR-027B-Fire authorizes
  no audit-chain enforcement code; the soft audit prefix
  `0xhoneyjar:straylight:` is a string namespace, not an
  enforcement primitive.
- **8.i — Recall execution changes.** ADR-027B-Fire authorizes
  no change to the existing `executeRecall` pipeline or to
  any wedge runtime path.
- **8.j — Hounfour dependency bump.** ADR-027B-Fire authorizes
  no bump of `@0xhoneyjar/loa-hounfour` (no §4.a target-
  version pin is supplied; the existing pin in
  [`../../package.json`](../../package.json) /
  [`../../package-lock.json`](../../package-lock.json) is
  unchanged).
- **8.k — Threat-model edits.**
  [`../mvp/threat-model.md`](../mvp/threat-model.md) is not
  edited by ADR-027B-Fire. T13–T18 + the T9 amendment remain
  the canonical record.
- **8.l — Package-boundary edits.**
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  is not edited by ADR-027B-Fire. The runtime-subpath section
  remains the canonical record.
- **8.m — Sibling-repo edits.** No `loa-dixie`, `loa-finn`,
  `loa-hounfour`, `loa-freeside`, `loa`, or
  `freeside-characters` file is edited. No issue / comment /
  PR is filed.
- **8.n — Loa framework / control-plane / model-substrate
  edits.** Per ADR-027A §"Decision" §8.j; ADR-027B-Fire does
  not sequence Loa-side substrate hardening against
  Straylight phase work.
- **8.o — Tag / release / package publish.** Per ADR-027A
  §"Decision" §8.k.
- **8.p — Successor-ADR pre-approval.** No successor is
  pre-approved. A successor that fires an ADR-022E gate, that
  authorizes a Straylight code-bearing PR, or that proposes a
  runtime-allowlist delta is a first-class doc under
  ADR-026A0 §"Decision" §3 and must satisfy §4.d on its own.

### 9. Refusal rules

Reviewers may cite this section verbatim to refuse a
sibling-repo or in-repo PR that exceeds ADR-027B-Fire's
scope:

- **9.a** — No claim that ADR-027B-Fire fires any ADR-022E
  gate (#1–#5, #17, #18 all remain held).
- **9.b** — No claim that ADR-027B-Fire satisfies, waives,
  or pre-satisfies the §4.d pre-merge real 3-model Flatline +
  Bridgebuilder gate.
- **9.c** — No citation of Codex audit output, ChatGPT
  output, or any model finding as authorization for a
  Straylight surface widening, an ADR-022E gate firing, an
  allowlist change, a runtime subpath addition, a tag /
  release / publish, a sibling-repo edit, or a private-alias
  adoption PR.
- **9.d** — No re-open of `loa-dixie` PR #102 and no
  Phase 26E re-implementation in `loa-straylight`.
- **9.e** — No bump of `@0xhoneyjar/loa-hounfour` and no
  Hounfour-named symbol adoption into the wedge public
  surface.
- **9.f** — No claim that the conformance vectors, the soft
  audit prefix, or the conformance-vector envelope schema
  have been adopted into the wedge by virtue of
  ADR-027B-Fire merging.
- **9.g** — No Finn migration, Freeside wiring, production
  storage migration, signature verification, policy
  execution, audit-chain enforcement, storage adapter, or
  recall execution change.

### 10. Rollback

ADR-027B-Fire is docs-only and adds no runtime / test /
fixture / script / package change. Rollback is the
inverse-docs-only operation: delete this ADR; revert the
Phase 28A append-only sections in
[`../handoffs/README.md`](../handoffs/README.md) and
[`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md).
Rollback restores the post-Phase-27B baseline. Rollback does
not re-open `loa-dixie` PR #102, does not re-fire the
ADR-022E gate set (none of which were fired by this ADR), and
does not authorize any sibling-repo edit.

## Consequences

- The Hounfour PR #116 composition-contract evidence has a
  Straylight-side adjudication record. Reviewers can refuse a
  Hounfour-touching PR on the §4.a `PENDING-AS-SHAPE-ADOPTION`
  column or on the §4.d / §4.e remaining-held columns.
- The §4.a substrate disposition is narrowed but does not
  unblock any first-class successor on its own. A successor
  must still pin (or explicitly disclaim) target version,
  `$id`, JSON Schema artifact path, JS subpath, and TS
  export, and must still satisfy §4.d.
- The §4.d pre-merge real 3-model Flatline + Bridgebuilder
  gate **remains explicitly unsatisfied**. ADR-027B-Fire is
  not pre-cleared for any successor and does not waive the
  gate.
- ADR-022E gates #1, #2, #3, #4, #5, #17, and #18 all remain
  **held**. The Hounfour-named symbols `EstateTransition`,
  `Challenge`, `safeCanonicalize`, and `AuditEvent` are
  **not** adopted into the wedge by ADR-027B-Fire.
- The runtime subpath, runtime allowlist, root and host
  `"types"`-only postures, the threat model, and the package
  boundary are all unchanged.
- A future Straylight private-alias adoption PR (whether
  shape-adoption flavor or conformance-consumption flavor) is
  **not** authorized by ADR-027B-Fire alone; it requires a
  separate first-class successor ADR that satisfies §4.d.
- Codex / Flatline / Bridgebuilder / Cheval findings,
  persisted agent memory, and long-context window dumps remain
  formally audit evidence — not authority — for any future
  operator decision under ADR-026A0.

## Validation

ADR-027B-Fire adds no source / test / fixture / script /
package change; the working-tree surface is the entire
validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full Phase 28A working set
```

Expected:

- `git diff --name-only` lists exactly the two **modified**
  tracked files: `docs/handoffs/README.md` and
  `docs/handoffs/cross-repo-implementation-order.md`.
- `git ls-files --others --exclude-standard` lists exactly the
  one **untracked** new file: this ADR.
- `git status --short --untracked-files=all` lists all three
  Phase 28A files (two `M`, one `??`), plus any pre-existing
  local dirt outside the Phase 28A scope (which remains
  unstaged per the phase brief).

Plain `git diff --stat` reports tracked-file modifications
only and will **not** show the new ADR until it is staged;
ADR-027B-Fire does not stage it. `npm run typecheck`,
`npm test`, `npm run build`, and `npm pack --dry-run` remain
identical to the post-Phase-27B baseline by construction.

## Source files inspected

- [`./ADR-027B-hounfour-return-gate-readiness.md`](./ADR-027B-hounfour-return-gate-readiness.md)
  (canonical readiness inventory).
- [`./ADR-027A-post-dixie-return-gate.md`](./ADR-027A-post-dixie-return-gate.md)
  (canonical return-gate criteria).
- [`./ADR-027C-finn-return-gate-readiness.md`](./ADR-027C-finn-return-gate-readiness.md)
  (Finn-side readiness, unaffected by ADR-027B-Fire).
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
  (operator authority + Flatline rule).
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
  (runtime allowlist + subpath authorization).
- [`./ADR-026C-dixie-recall-intake-consumer-contract.md`](./ADR-026C-dixie-recall-intake-consumer-contract.md)
  (consumer contract).
- [`./ADR-026D-dixie-recall-intake-endpoint-authorization.md`](./ADR-026D-dixie-recall-intake-endpoint-authorization.md)
  (Phase 26E endpoint authorization).
- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
  (gate inventory).
- [`../handoffs/phase-27b-phase-28-coding-candidate.md`](../handoffs/phase-27b-phase-28-coding-candidate.md)
  (Phase 28 coding-candidate note).
- [`../handoffs/phase-27b-subpath-retirement-migration.md`](../handoffs/phase-27b-subpath-retirement-migration.md)
  (runtime-subpath retirement plan; gated by ADR-027C-Fire,
  not this ADR).
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md),
  [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md),
  [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
  (sibling-repo coordination).
- [`../handoffs/hounfour-schema-extraction-issue.md`](../handoffs/hounfour-schema-extraction-issue.md),
  [`../handoffs/hounfour-extraction-mapping.md`](../handoffs/hounfour-extraction-mapping.md),
  [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md),
  [`../handoffs/hounfour-rc-shadow-integration-checklist.md`](../handoffs/hounfour-rc-shadow-integration-checklist.md),
  [`../handoffs/hounfour-shadow-integration-findings.md`](../handoffs/hounfour-shadow-integration-findings.md),
  [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md),
  [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
  (Hounfour packets ADR-027B-Fire-FlipShape would still need
  to cite).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (T13–T18
  + T9 amendment) — read-only at decision time; not edited.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  (runtime allowlist) — read-only at decision time; not
  edited.
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  (load-bearing boundary preserved by Hounfour PR #116 per
  the audit).
- [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)
  (Phase 26F substrate-degradation record).
