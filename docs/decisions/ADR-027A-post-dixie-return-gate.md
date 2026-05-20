# ADR-027A — Post-Dixie return gate (Phase 27A)

## Status

Accepted-for-Phase-27A.

ADR-027A is a **Straylight-side sequencing decision-lock** that
closes the Phase 26E/26F Dixie-first MVP exception and pins the
return-gate criteria a future ADR must satisfy before
Hounfour-side or Finn-side work resumes against Straylight.
ADR-027A **narrows refusal** rather than widening authorization:
it does not author code, does not file a sibling-repo PR, does
not flip a dependency, and does not fire any ADR-022E gate.

The companion handoff is
[`../handoffs/phase-27a-post-dixie-return-gate.md`](../handoffs/phase-27a-post-dixie-return-gate.md).
The post-Phase-26E verification record (frozen) is
[`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md).
The runtime-subpath baseline ADR-027A leaves unchanged is
ADR-026A; the consumer contract is ADR-026C; the bounded
Dixie-first authorization is ADR-026D; the operator-authority /
Flatline rule that governs how docs may create authorization is
ADR-026A0.

ADR-027A does **not** authorize:

- a re-open of `loa-dixie` PR #102 or any post-merge edit to
  Phase 26E;
- a re-implementation of Phase 26E in `loa-straylight`;
- a second Dixie endpoint, a second runtime subpath, or any
  Phase 24E S2–S6 surface;
- Hounfour adoption (ADR-022E gates #1–#5, #17, #18 remain
  held);
- Finn wiring (ADR-022E gate #9 remains held);
- Freeside wiring (ADR-022E gate #11 remains held);
- production storage migration (ADR-022E gate #8 remains held);
- any Straylight package-surface or runtime-source change;
- any Loa framework / control-plane / model-substrate
  (Bedrock / Flatline / Bridgebuilder / Cheval / Codex / GPT /
  Gemini / `.claude/` / `.loa.config.yaml` / hook / routing)
  edit;
- a tag, a release, a package publish, or a Hounfour
  dependency bump;
- any sibling-repo edit. ADR-027A is a Straylight-side record
  and authorizes no PR in `loa-dixie`, `loa-finn`,
  `loa-hounfour`, `loa-freeside`, `loa`, or any other repo.

ADR-027A edits no prior ADR. ADR-027A touches only the four
Phase 27A files listed in §"Decision" §1; it touches no file
under `src/`, `tests/`, `fixtures/`, `scripts/`, `dist/`,
`dist-types/`, no `package.json` / `package-lock.json` /
`tsconfig*` / `vitest.config.ts` / `.npmrc` / `.gitignore` /
`.loa.config.yaml`, no `.loa/` / `.claude/` / `.beads/` /
`.run/` / `.github/` / `.codex/` / `.agents/` / `.vitest/` /
`grimoires/`, no `node_modules/`,
`docs/mvp/package-boundary.md`, `docs/mvp/threat-model.md`, or
the frozen Phase 26F verification report. It cuts no tag,
publishes no package, files no issue / comment / PR.

## Context

The Phase 26 chain (Phase 26A-0 through Phase 26F on the
Straylight side, plus `loa-dixie` PR #102 as Phase 26E) is
complete for its bounded scope. That chain leaves three
unauthorized steps:

1. No Straylight-side closing record yet declares the Dixie-first
   MVP exception **closed**. Without that record, a future PR
   could cite Phase 26E/26F silence as precedent for a *second*
   Dixie-first slice ahead of Hounfour or Finn.
2. No Straylight-side record yet pins the **dependency gate**
   that must precede a return to Hounfour-side contract work
   reaching Straylight (post-v8.5.0 / v8.6.x adoption flip;
   `Challenge` / `EstateTransition` / `safeCanonicalize`
   adoption; class-validator swap; `move_to_hounfour` flip;
   `$id` namespace adoption; published-schema consumption).
3. No Straylight-side record yet pins the **dependency gate**
   that must precede a return to Finn-side runtime enforcement /
   audit / action-boundary work reaching Straylight (firing
   ADR-022E gate #9; deprecating
   `@loa/straylight/runtime/recall-intake`; retiring the runtime
   subpath; restoring Straylight to full type-only posture;
   moving `handleRecallIntake` enforcement into Finn).

ADR-027A answers all three.

### Relationship to ADR-026A0

ADR-026A0 §3 distinguishes **docs that create authorization**
(ADR + trigger that unblocks a downstream gate; boundary doc
that widens a permitted surface; "no" → "yes" refusal
amendment) from **docs that do not create authorization**
(status intake, corrigendum, narrowing).

ADR-027A is the **second class**: it tightens refusal rules and
adds new return-gate predicates. It does not fire an ADR-022E
gate, does not widen the runtime allowlist, and does not relax
any prior refusal. Per ADR-026A0 §3, the pre-merge Flatline +
Bridgebuilder requirement therefore applies at **operator
discretion** for ADR-027A itself.

The **future ADRs** ADR-027A's §4 / §5 contemplate (Hounfour
return-gate ADR; Finn return-gate ADR; subpath retirement ADR)
are unambiguously the **first class** — each fires a held gate
and widens a substantive surface — and each independently
inherits the full ADR-026A0 §3 source / package / runtime /
test / dependency / public-surface Flatline + Bridgebuilder
requirement. ADR-027A does not pre-satisfy that requirement and
does not pre-approve any successor.

### What is *not* authority

- Codex review, ChatGPT advisory output, headless generative
  review, Flatline multi-model verdicts, Bridgebuilder reviews,
  and Cheval delegation outputs are **audit evidence** the
  operator weighs under ADR-026A0; they are not authorization.
- Persisted agent memory (auto-memory, observations.jsonl,
  framework `.run/` / `.claude/` / `.beads/` / `grimoires/`,
  vector-store retrieval, long-context window dumps) is not
  authorization. Authority lives in merged ADRs, merged
  handoffs, and merged source — not in retrieved context.
- Degraded local Flatline / Bridgebuilder / Cheval / Bedrock /
  Codex / model-routing substrate (cf. Phase 26F §7.1) is a
  Loa-side control-plane concern, not a Straylight phase
  trigger. ADR-027A does not sequence Loa-side substrate
  hardening against Straylight phase work and does not treat
  substrate degradation as a reason to re-do Phase 26E,
  re-open `loa-dixie` PR #102, or widen Straylight surfaces.

## Decision

### 1. File set

ADR-027A establishes only:

- **New:** this ADR.
- **New:** the companion handoff
  ([`../handoffs/phase-27a-post-dixie-return-gate.md`](../handoffs/phase-27a-post-dixie-return-gate.md)).
- **Append-only:**
  [`../handoffs/README.md`](../handoffs/README.md) — a Phase 27A
  index entry, in chronological order, after the Phase 26D
  entry, before the Phase 15 cross-repo-coordination section.
- **Append-only:**
  [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — a narrow Phase 27A return-gate section appended after the
  Phase 26D narrowing.

### 2. Phase 26 chain — recorded complete

| Link | Artifact | Status |
|---|---|---|
| Phase 26A-0 | [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md) | Merged (PR #41). |
| Phase 26A-1 | [`../handoffs/phase-26a1-threat-model-dixie-endpoint.md`](../handoffs/phase-26a1-threat-model-dixie-endpoint.md) + [`../mvp/threat-model.md`](../mvp/threat-model.md) T13–T18 + T9 amendment | Merged (PR #42). |
| Phase 26A-2 | [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md) | Merged (PR #44). |
| Phase 26B | [`../../src/straylight/runtime/recall-intake/`](../../src/straylight/runtime/recall-intake/) | Merged (PR #45). Allowlist: `{ handleRecallIntake, createDixieCapability, DixieCapabilityError }` + `DixieCapability` type. |
| Phase 26B-F | [`../mvp/package-boundary.md`](../mvp/package-boundary.md) runtime-subpath section + [`../../README.md`](../../README.md) hardening | Merged (PR #46). |
| Phase 26C | [`./ADR-026C-dixie-recall-intake-consumer-contract.md`](./ADR-026C-dixie-recall-intake-consumer-contract.md) | Merged (PR #47). |
| Phase 26D | [`./ADR-026D-dixie-recall-intake-endpoint-authorization.md`](./ADR-026D-dixie-recall-intake-endpoint-authorization.md) | Merged (PR #48). |
| Phase 26E | `loa-dixie` PR #102 | Merged in `loa-dixie`. Not a Straylight code change. |
| Phase 26F | [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md) | Merged (PR #49). Frozen by §1 above. |

### 3. Dixie-first as a closed exception

- **3.a — One slice only.** The Dixie-first authorization
  applied to one recall-intake endpoint/adapter consuming the
  one authorized runtime subpath. It did not authorize a second
  Dixie endpoint, a second runtime subpath, a second pre-Finn
  slice, or any Phase 24E S2–S6 surface.
- **3.b — No precedent.** Phase 26E/26F establish no precedent
  for "Dixie ahead of Finn" or "Dixie ahead of Hounfour" on any
  subsequent slice. Each future slice requires its own
  ADR-026A0-grade trigger evidence, threat-model leg, consumer
  contract, and authorization ADR.
- **3.c — No semantic transfer.** Dixie remains the recall /
  BFF / provenance consumer (Phase 12 boundary). It did not
  become a semantic / class / runtime / policy-enforcement
  authority by implementing Phase 26E.
- **3.d — Long-term lane assignment unchanged (candidate /
  eventual).** The Phase 9 / 10 / 12 / 14 packets and ADR-022B
  / ADR-022E assign each lane as a **candidate or eventual
  owner**, not a present authority. None of the gates that
  would activate those lanes has been fired:
  - `loa-straylight` — semantic wedge / governed continuity
    substrate / control-plane records (currently active);
  - `loa-hounfour` — schema / protocol / class-validation
    **candidate**; lane activates only after a successor ADR
    fires the relevant ADR-022E gates (#1–#5, #17, #18) per
    §4 below;
  - `loa-finn` — runtime enforcement / audit / action-boundary
    **candidate**; lane activates only after a successor ADR
    fires ADR-022E gate #9 per §5 below;
  - `loa-dixie` — recall / BFF / provenance consumer; the
    Phase 26E endpoint is the bounded MVP slice and not a
    transfer of any other authority;
  - `loa-freeside` — community / app / bot surface
    **candidate**; lane activates only after ADR-022E gate
    #11 fires;
  - `loa` — workflow / spec / eval rail; control-plane only.
- **3.e — Pre-Finn seam is time-bounded.** The runtime subpath
  remains experimental / pre-Finn / Dixie-only / not permanent
  per ADR-026A §"Decision" §8 and the Phase 26F decision report
  §8.3. Retirement is gated by §5 below.

### 4. Hounfour return gate

A future PR may resume Hounfour-side contract work that reaches
Straylight only when **all** of the following are recorded by a
separate ADR:

- **4.a — Upstream substrate evidence.** The Hounfour upstream
  shape the future PR depends on is published, tagged, and
  resolvable (e.g., a specific
  `@0xhoneyjar/loa-hounfour@x.y.z` line; specific `$id`
  namespace; specific JS subpath); not pending; not
  pre-release-only; not draft. Cite Hounfour tag, `main` HEAD,
  and `$id` URL.
- **4.b — Threat-model impact statement.** State the impact
  under T13–T18 + the T9 persistence-posture amendment.
  Adoption flips that cross the class-vs-policy boundary
  ([`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md))
  must explicitly preserve the boundary or refuse.
- **4.c — Consumer-contract delta.** State whether the adoption
  flip changes any current Straylight consumer or runtime
  export. The runtime allowlist remains
  `{ handleRecallIntake, createDixieCapability,
  DixieCapabilityError, DixieCapability (type) }` until a
  future ADR explicitly amends it.
- **4.d — Pre-merge real Flatline + Bridgebuilder (currently
  unsatisfied gate).** Real 3-model Flatline (PASS or
  REVISE-with-resolution) AND real Bridgebuilder review per
  ADR-026A0 §"Decision" §3 / §5. While the Loa control-plane
  substrate is degraded (cf. Phase 26F §7.1), this gate is
  **unsatisfied** for any Hounfour-side adoption flip — it is
  not skipped, not deemed circular, and not pre-satisfied by
  this ADR. Substrate-degradation findings are audit evidence
  the operator weighs; they are not a reason to bypass the
  gate, to re-open `loa-dixie` PR #102, or to authorize new
  Straylight runtime work.
- **4.e — ADR-022E gates remain held.** Gates #1, #2, #3, #4,
  #5, #17, #18 remain held until each is independently fired
  by a successor ADR with its own trigger evidence. ADR-027A
  fires none of them.

### 5. Finn return gate

A future PR may resume Finn-side runtime enforcement / audit /
action-boundary work that reaches Straylight (firing ADR-022E
gate #9; deprecating `@loa/straylight/runtime/recall-intake`;
retiring the subpath; restoring Straylight to full type-only
posture; moving `handleRecallIntake` enforcement into Finn) only
when **all** of the following are recorded by a separate ADR:

- **5.a — Finn-side substrate evidence.** Finn package release,
  Finn enforcement boundary, Finn audit + receipt emission,
  Finn signer competence, and Finn keyring binding shipped or
  staged with citable evidence (Finn tag, Finn issue #159
  status, Finn enforcement-mapping closure). Cite the Phase 10
  packet
  ([`../handoffs/finn-runtime-enforcement-issue.md`](../handoffs/finn-runtime-enforcement-issue.md),
  [`../handoffs/finn-runtime-boundary.md`](../handoffs/finn-runtime-boundary.md),
  [`../handoffs/finn-enforcement-mapping.md`](../handoffs/finn-enforcement-mapping.md))
  and any Finn-side response.
- **5.b — Subpath retirement plan.** Document deprecation
  window, migration path for the Dixie consumer (PR #102
  endpoint), and test classes that prove the runtime seam
  continues to refuse the ADR-026A §7 attack shapes during and
  after migration. Preserve the ADR-026A0 operator-authority
  discipline.
- **5.c — Class-vs-policy preservation.** State how the Finn
  migration preserves the class-vs-policy boundary.
- **5.d — Threat-model continuity.** Preserve T13–T18 + T9
  persistence-posture coverage end-to-end through the
  migration (no temporary regression, no default-allow during
  cutover, no metadata-as-identity, no cross-process capability
  replay).
- **5.e — Pre-merge real Flatline + Bridgebuilder (currently
  unsatisfied gate).** Same as §4.d. While the substrate is
  degraded, this gate is unsatisfied for any Finn migration
  flip; it is not skipped, not circular, and not pre-satisfied
  by ADR-027A. Substrate-degradation findings are audit
  evidence, not authorization.
- **5.f — ADR-022E gate #9 remains held.** Until the successor
  ADR explicitly fires it. ADR-027A does not fire it.

### 6. Codex / Flatline / model findings as audit evidence

Pinned discipline for any future PR cited under §4 or §5:

- **6.a — Audit evidence, not authority.** Multi-model findings
  are evidence the operator weighs under ADR-026A0
  §"Decision" §3–§5. They do not authorize a Straylight surface
  widening, an ADR-022E gate firing, a sibling-repo edit, a
  runtime allowlist change, a runtime subpath addition, or a
  tag / release / publish.
- **6.b — Memory and long context are not authority.** Per the
  list in §"Context" → "What is *not* authority" above.
- **6.c — Substrate degradation is a separate concern.** Loa
  control-plane substrate hardening (Flatline / Bridgebuilder /
  Cheval / Bedrock / model routing) is separately-authorized
  work. ADR-027A does not sequence it against Straylight phase
  work and does not treat substrate degradation as a reason to
  re-do Phase 26E or widen Straylight surfaces.
- **6.d — Findings flow up to the operator.** A finding that
  disagrees with a merged ADR does not override the ADR; it is
  recorded as evidence the operator weighs in deciding whether
  to author a successor ADR.

### 7. Out of scope

ADR-027A does not authorize edits to local config
(`.loa.config.yaml`, `.env*`, `.npmrc`, `.gitignore`,
`tsconfig*`, `vitest.config.ts`, `package.json`,
`package-lock.json`); framework / control-plane state
(`.claude/`, `.loa/`, `.beads/`, `.run/`, `.codex/`, `.agents/`,
`.vitest/`, `.github/`, `grimoires/`, `node_modules/`, `dist/`,
`dist-types/`); model substrate (Bedrock / Flatline /
Bridgebuilder / Cheval / Codex / GPT / Gemini / headless /
model-routing config); or any sibling repo (`loa-dixie`,
`loa-finn`, `loa-hounfour`, `loa-freeside`, `loa`,
`freeside-characters`, or any other repo under `~/loa-dev/`).
Each remains separately-authorized work under its own ADR or
its own sibling-repo PR.

### 8. Refusal rules

Reviewers may cite this section verbatim to refuse a
sibling-repo or in-repo PR that exceeds ADR-027A's scope:

- **8.a** — No re-implementation of Phase 26E in Straylight.
- **8.b** — No re-open of `loa-dixie` PR #102.
- **8.c** — No second Dixie endpoint.
- **8.d** — No second runtime subpath.
- **8.e** — No Hounfour adoption (§4 must fire first).
- **8.f** — No Finn wiring (§5 must fire first).
- **8.g** — No Freeside wiring.
- **8.h** — No production storage migration.
- **8.i** — No Straylight package-surface change.
- **8.j** — No Loa framework / control-plane / model-substrate
  edits.
- **8.k** — No tag / release / package publish.
- **8.l** — No sibling-repo edit.
- **8.m** — No Phase-26-as-precedent for future Dixie-leading
  slices.
- **8.n** — No model-finding-as-authority and no
  memory-as-authority.
- **8.o** — No successor-ADR pre-approval. A successor that
  fires an ADR-022E gate, retires the runtime subpath, or
  authorizes a new sibling-repo PR is a §3-class
  authorization-creating doc under ADR-026A0; it must
  independently satisfy the full pre-merge real 3-model
  Flatline + Bridgebuilder requirement and is not pre-cleared
  by this ADR.

### 9. Successor-ADR contract reminder

A future ADR drawing on ADR-027A must cite **all** of: ADR-026A0
(operator-authority leg), Phase 26A-1 (threat-model
prerequisites leg), ADR-026A (runtime subpath authorization),
ADR-026C (consumer contract), ADR-026D (endpoint authorization),
the Phase 26F decision report, and ADR-027A (this ADR — return
gate).

The successor must supply on its own, or it remains refusable:

1. exact trigger evidence beyond ADR-027A's scope;
2. scope — exactly what surfaces / files / behaviors the
   successor authorizes (additive, citable);
3. threat-model impact statement under T13–T18 + T9 amendment;
4. its own consumer-contract delta or runtime-allowlist delta;
5. its own tests;
6. its own rollback;
7. its own pre-merge real 3-model Flatline + Bridgebuilder
   verdict (§4.d / §5.e: currently unsatisfied while substrate
   is degraded; the successor — not ADR-027A — must satisfy it
   when authoring time arrives).

ADR-027A is not sufficient authorization for any successor. A
successor's chain must reach back through ADR-027A to ADR-026A0
and to ADR-022E without a missing link.

### 10. Rollback

ADR-027A is docs-only and adds no runtime, no test, no fixture,
and no script. Rollback is the inverse-docs-only operation:
delete this ADR; delete the companion handoff; revert the Phase
27A append-only sections in
[`../handoffs/README.md`](../handoffs/README.md) and
[`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md).
Rollback restores the post-Phase-26F baseline. It does not
retroactively re-open the Dixie-first exception, does not
re-open `loa-dixie` PR #102, and does not authorize any
sibling-repo edit.

## Consequences

- The Phase 26 chain has a Straylight-side closing record. A
  future PR can no longer cite Phase 26E/26F silence as
  permission to lead a second Dixie-first slice.
- The next code-bearing PR against Straylight that touches
  Hounfour-adjacent or Finn-adjacent surfaces has a citable,
  additive-only return gate (§4 / §5). Reviewers can refuse
  mid-air changes that skip the gate.
- The pre-merge real 3-model Flatline + Bridgebuilder
  requirement is recorded as **currently unsatisfied** while
  the Loa substrate is degraded. ADR-027A does not pre-satisfy
  it for any future authorization-creating ADR.
- Codex / Flatline / Bridgebuilder / Cheval findings, persisted
  agent memory, and long-context window dumps are formally
  audit evidence — not authority — for any future operator
  decision under ADR-026A0.
- The runtime allowlist, the Phase 26B HMAC + closure-private
  brand mechanism, the env-key binding, and the
  `@loa/straylight/runtime/recall-intake` subpath are
  unchanged. Root `@loa/straylight` and `@loa/straylight/host`
  remain `"types"`-only.

## Validation

Because Phase 27A adds no source / test / fixture / script /
package change, the working-tree surface is the entire
validation:

```bash
git diff --name-only                                # tracked-file modifications only
git ls-files --others --exclude-standard            # untracked new files
git status --short --untracked-files=all            # full four-file working set
```

Expected:

- `git diff --name-only` lists exactly the two **modified**
  tracked files: `docs/handoffs/README.md` and
  `docs/handoffs/cross-repo-implementation-order.md`.
- `git ls-files --others --exclude-standard` lists exactly the
  two **untracked** new files: this ADR and the companion
  handoff.
- `git status --short --untracked-files=all` lists all four
  Phase 27A files (two `M`, two `??`), plus any pre-existing
  local dirt outside the Phase 27A scope.

Plain `git diff --stat` reports only the tracked-file
modifications and will **not** show the new ADR or handoff
until they are staged; ADR-027A does not stage them. The
post-Phase-26F `npm run typecheck`, `npm test`, `npm run
build`, and `npm pack --dry-run` baselines remain unchanged by
construction.

## Source files inspected

- ADR-026A, ADR-026A0, ADR-026C, ADR-026D, and the Phase 26A-1
  / 26B / 26B-F / 26C / 26D handoffs in
  [`./`](./) and [`../handoffs/`](../handoffs/).
- The Phase 9 / 10 / 12 / 14 sibling-repo packets and the
  Phase 15 cross-repo-coordination index in
  [`../handoffs/`](../handoffs/).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (T13–T18 +
  T9 amendment) and
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  (runtime allowlist).
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md).
- [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)
  (Phase 26F).
