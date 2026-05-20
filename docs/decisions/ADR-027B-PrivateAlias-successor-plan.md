# ADR-027B-PrivateAlias-successor-plan — Conformance-vector-only private-alias successor plan (Phase 28B)

## Status

Accepted-for-Phase-28B as a **plan, not as code authorization**.

ADR-027B-PrivateAlias-successor-plan is the **Phase 28B docs-only
successor proposal** that follows
[ADR-027B-Fire](./ADR-027B-Fire-hounfour-composition-contracts.md)
(Phase 28A). ADR-027B-Fire recorded that Hounfour PR #116
(`0xHoneyJar/loa-hounfour` origin/main `c06ef1ba`) shipped
**composition-contract evidence** — an architecture document, a
conformance category, the `0xhoneyjar:straylight:` soft audit
prefix, five `recall-wedge` conformance vectors, the Vitest
harness driving them, and a generated conformance-vector envelope
schema update — and **explicitly deferred** the question of
whether that evidence may yet authorize a *different*, *smaller*,
future Straylight code-bearing PR (a private-alias consumption of
the five conformance vectors, the soft audit prefix, or both as a
test-only / boundary-preservation construct) to a separate
first-class successor.

This ADR is that successor's **plan**. It chooses the **narrowest
safe** of the three tracks ADR-027B-Fire §6 contemplated, pins
the exact future Straylight code PR that would be authorized
**if and only if** this proposal's own first-class review gate is
satisfied, and clearly states that the gate **remains
unsatisfied** today.

ADR-027B-PrivateAlias-successor-plan is, on its own:

- a **first-class doc** under
  [ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md)
  (it would, if accepted on its own §4.d evidence, unblock a
  downstream code-bearing PR — therefore it is
  authorization-creating in the §3 first-class sense);
- but **not yet code-authorizing**, because its own §4.d
  pre-merge real 3-model Flatline + Bridgebuilder review gate is
  **currently unsatisfied** while the Loa control-plane
  substrate is degraded (cf. Phase 26F §7.1; ADR-027A §"Decision"
  §4.d; ADR-027B §"Decision" §2 §4.d row; ADR-027B-Fire
  §"Decision" §3 §4.d row).

ADR-027B-PrivateAlias-successor-plan does **not** authorize:

- any Hounfour shape adoption (ADR-022E gates #1, #2, #4, #5
  remain held — see §7 below);
- any Hounfour JS-subpath adoption beyond the existing
  `@0xhoneyjar/loa-hounfour/core` consumption already pinned by
  Phase 17B at [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  (ADR-022E gates #3 and #17 remain held);
- any new Hounfour-named symbol on the wedge's **public**
  surface (ADR-022E gate #18 remains held);
- a re-open of `loa-dixie` PR #102, a second Dixie endpoint, or
  any Phase 24E S2–S6 surface;
- a second runtime subpath, a runtime allowlist delta, a new
  public type re-export, or any change to
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md);
- Finn runtime adoption (ADR-022E gate #9 remains held; see
  [ADR-027C](./ADR-027C-finn-return-gate-readiness.md));
- Freeside wiring (ADR-022E gate #11 remains held);
- production storage migration (ADR-022E gate #8 remains held);
- a bump of `@0xhoneyjar/loa-hounfour` beyond the existing
  pinned posture;
- signature verification, policy execution, audit-chain
  enforcement, a storage adapter, recall execution changes, or
  any new Straylight runtime code;
- a new domain `$id` adoption;
- a tag, a release, a package publish, or a sibling-repo edit;
- any Loa framework / control-plane / model-substrate edit.

Per the hard constraints at the top of the Phase 28B brief and
[ADR-027B-Fire §"Decision" §1](./ADR-027B-Fire-hounfour-composition-contracts.md),
this ADR creates only the three Phase 28B files listed in
§"Decision" §1 and edits no other file. It does not commit, does
not push, does not stage, does not open a PR, does not file an
issue or comment, does not edit any sibling repo, does not edit
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) or
[`../mvp/threat-model.md`](../mvp/threat-model.md), and does not
edit any prior ADR or prior handoff except the two append-only
navigation updates listed in §"Decision" §1.

## Context

### Why Phase 28B exists

ADR-027B-Fire §"Adjudication summary" recorded:

> May a future Straylight private-alias adoption PR be proposed
> now? **No, not under ADR-027B-Fire alone.** A private-alias
> *shape* adoption requires a successor ADR that fires at least
> one of #1, #4, #18 (and possibly #3 or #17 depending on the
> path), and that satisfies §4.d. A private-alias *conformance-
> vector-only* / *soft-audit-prefix-only* consumption (e.g.,
> importing the five vectors as boundary-preservation test
> inputs, or re-using the `0xhoneyjar:straylight:` string as a
> constant) requires a separate first-class successor ADR — that
> successor must on its own pin the import path, the no-`$id`-
> adoption / no-runtime-export statement, the boundary-
> preservation test plan, the threat-model impact statement
> under T13–T18 + T9, the rollback, and the §4.d real Flatline +
> Bridgebuilder pass. ADR-027B-Fire pre-approves none of this.

ADR-027B-PrivateAlias-successor-plan is exactly that successor
proposal, in **plan** form: it makes every choice ADR-027B-Fire
required a successor to make and pins the exact code-bearing PR
that would be allowed if the §4.d gate is satisfied — but it
does **not** itself satisfy §4.d, and it does **not** authorize
the code now.

### What Hounfour PR #116 does and does not give the wedge

Per ADR-027B-Fire §"Decision" §2, Hounfour PR #116 ships:

| Artifact (per ADR-027B-Fire §2) | What it is | What it is *not* |
|---|---|---|
| `docs/architecture/recall-wedge-composition.md` | Architecture documentation explaining how the recall-wedge composes over existing Hounfour primitives. | Not a new Hounfour shape; not a new wedge contract. |
| `recall-wedge` conformance category | A taxonomy slot inside Hounfour's existing conformance-vector machinery. | Not a new domain `$id`; not a new JS subpath. |
| `0xhoneyjar:straylight:` soft audit prefix | A namespace string for soft-audit identifiers. | Not an audit-chain enforcement primitive; not a runtime authority. |
| Five `recall-wedge` conformance vectors | Test inputs covering request-to-pack, pack-to-receipt, receipt-to-commitment, commitment_type, packed assertion item, admitted assertion, signatures-present, and `recall_scope === surface_context`. | Not new shapes for the wedge to adopt; not production fixtures; not signed; not hash-verified. |
| `tests/vectors/recall-wedge-vectors.test.ts` (Hounfour-side) | Vitest harness driving the five vectors; deliberately does **not** verify hashes or signatures. | Not a Straylight test; not a runtime check; not a class-vs-policy collapse. |
| `schemas/conformance-vector.schema.json` (generated) update | The envelope schema for *conformance vectors themselves*. | Not a domain `$id` for any wedge primitive. |

ADR-027B-Fire §"Decision" §4 records that **none** of the
ADR-022E gates ADR-027B contemplated firing (#1, #2, #3, #4, #5,
#17, #18) have their trigger conjunctions satisfied by these
artifacts: the gate triggers all require a published shape, an
exact `$id`, an exact JS subpath, or an exact public re-export,
and Hounfour PR #116 supplies none of those.

The artifacts therefore do **not** advance shape adoption. They
**do** advance one narrow possibility: a Straylight-internal,
**test-only** consumption of the five conformance vectors as
boundary-preservation inputs that further pin the wedge's
existing class-vs-policy boundary
([`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md))
without changing the wedge's public surface, runtime, or
dependency posture.

### Three tracks ADR-027B-Fire deferred

ADR-027B-Fire §"Adjudication summary" and §"Decision" §6
contemplated three successor flavors:

1. **Conformance-vector-only consumption** — import the five
   vectors as Vitest inputs that exercise the wedge's existing
   class-validation seam (no shape adoption; no `$id` adoption;
   no runtime export; no public-surface change).
2. **Soft-audit-prefix-only consumption** — re-use the
   `0xhoneyjar:straylight:` string as a wedge-internal constant
   for the wedge's emitted soft-audit identifiers (no audit-
   chain enforcement; no signature verification; no policy
   execution).
3. **Private-alias shape adoption** — alias one or more
   Hounfour-published shapes (e.g., `Challenge`,
   `EstateTransition`, `safeCanonicalize`) into a private wedge
   alias module without re-exporting from the public surface.

Track 3 is **explicitly the same successor class ADR-027B-Fire
deferred for "shape adoption"**: it requires a target version
pin, an `$id` namespace, a JS subpath, and a TS export — none of
which Hounfour PR #116 supplies. Hounfour PR #116 ships
**no new domain `$id`**, **no new JS subpath**, **no new TS
public symbol**. Track 3 therefore cannot be authorized off
Hounfour PR #116 evidence at all; it would require a *different*
Hounfour-side artifact that PR #116 is not.

Track 2 (soft-audit-prefix-only) re-uses a string. Re-using a
string as a wedge-internal constant is permissible in principle
under ADR-026A0 §"Decision" §2 (additive / bounded), but: the
prefix is a *name* for an audit identifier, and any code that
binds the prefix to an actually-emitted identifier needs a
class-vs-policy treatment per
[`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
— specifically, the wedge must *not* implicitly turn a soft
prefix into an audit-chain enforcement primitive. Track 2 alone,
without track 1, has no obvious code-bearing slice that does not
also touch wedge runtime or audit emission.

Track 1 (conformance-vector-only) is the **narrowest** option:
the five vectors are JSON inputs; consuming them as Vitest
fixtures pins the wedge's existing seam; no `$id` is adopted
into the wedge public surface, no runtime export is added, and
the class-vs-policy boundary is preserved by construction
because the Hounfour-side harness — and any Straylight-side
mirror — deliberately does **not** verify hashes or signatures.

ADR-027B-PrivateAlias-successor-plan therefore selects **Track 1
(conformance-vector-only)** as the proposal, and §"Decision" §3
below records the exact in-repo shape that would result.

The name "PrivateAlias" in this ADR's filename refers to the
fact that any future Straylight slice that consumes the five
vectors does so under the **existing** private-alias seam at
[`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
(Phase 17B's pinned alias module) — **not** a new private alias
module, and **not** a new public symbol. The filename does not
commit to a Track 3 shape adoption; it explicitly disclaims
Track 3.

### Relationship to ADR-026A0 / ADR-027A / ADR-027B / ADR-027B-Fire

[ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md)
distinguishes:

- **First-class** — ADR + trigger that unblocks a downstream
  gate; boundary doc that widens a permitted surface; refusal-
  rule "no" → "yes" amendment;
- **Second-class** — status intake; corrigendum; refusal
  narrowing; evidence record (does not create authorization).

ADR-027B-PrivateAlias-successor-plan is **first class**: if it
were merged on its own §4.d evidence, it would unblock a
specific, named code-bearing PR (described in §"Decision" §3
below). Its merger is therefore subject to the full pre-merge
real 3-model Flatline + Bridgebuilder requirement on its own
PR, per ADR-026A0 §"Decision" §3 and §5.

ADR-027B-PrivateAlias-successor-plan does **not** inherit, claim,
or repackage ADR-027B-Fire's "operator-discretion" pre-merge
posture: ADR-027B-Fire was a second-class evidence lock, and
ADR-027B-Fire §"Decision" §6 explicitly states it does *not*
pre-satisfy §4.d for any successor. This ADR is the successor;
its §4.d is independent and **currently unsatisfied** (see §6
below).

### What is *not* authority

Pinned per
[ADR-027A §"Context" → "What is *not* authority"](./ADR-027A-post-dixie-return-gate.md),
[ADR-026A0 §"Decision" §6.Forbidden](./ADR-026A0-operator-authority-flatline-rule.md),
and [ADR-027B-Fire §"Context" → "What is *not* authority"](./ADR-027B-Fire-hounfour-composition-contracts.md):

- The user's read-only Codex audit on Hounfour PR #116
  (recorded as audit evidence by ADR-027B-Fire §"Decision" §2 /
  §5) is **audit evidence the operator weighs**; it is not
  authorization for this proposal.
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
  trigger. ADR-027B-PrivateAlias-successor-plan does not
  sequence Loa-side substrate hardening against Straylight phase
  work, does not treat substrate degradation as a reason to
  weaken §4.d, and does not treat substrate degradation as a
  reason to re-do or re-open `loa-dixie` PR #102.

## Decision

### 1. File set

ADR-027B-PrivateAlias-successor-plan establishes only:

- **New:** this ADR.
- **Append-only:**
  [`../handoffs/README.md`](../handoffs/README.md) — a Phase 28B
  index entry, in chronological order, after the Phase 28A
  entry.
- **Append-only:**
  [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
  — a narrow Phase 28B navigation pointer appended after the
  Phase 28A composition-contract evidence-lock pointer.

ADR-027B-PrivateAlias-successor-plan touches no other file. No
prior ADR is edited. No prior handoff is edited except the two
append-only updates above.

### 2. Successor track choice

ADR-027B-PrivateAlias-successor-plan **proposes Track 1 only**:
**conformance-vector-only consumption** of the five Hounfour PR
#116 conformance vectors as Vitest test inputs that further pin
the wedge's existing class-vs-policy boundary, behind the
existing private-alias seam at
[`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts).

Track 2 (soft-audit-prefix-only) is **not** proposed by this
ADR: it has no code-bearing slice that does not also touch
wedge runtime or audit emission, and any such slice would need
its own first-class successor.

Track 3 (private-alias **shape** adoption) is **not** proposed
by this ADR: Hounfour PR #116 ships no new `$id`, no new JS
subpath, and no new TS public symbol that would supply ADR-022E
gate #1 / #2 / #3 / #4 / #5 / #17 / #18 trigger evidence. Any
shape adoption successor must wait for a *different* Hounfour-
side artifact that PR #116 is not, **and** for that artifact's
own successor ADR.

### 3. The exact future Straylight code PR this proposal would authorize

If, and only if, the §4.d gate (§6 below) is satisfied for
**this** ADR, the future Straylight code PR it would authorize
is the following — bounded by every cell:

| Aspect | Bounded value |
|---|---|
| **Scope** | Add a Straylight-side Vitest harness that imports the five Hounfour PR #116 `recall-wedge` conformance vectors as JSON test inputs, and asserts the wedge's existing class-validation seam (per [`../../src/straylight/validators/`](../../src/straylight/validators/) and [`../../tests/class-vs-policy-validation.test.ts`](../../tests/class-vs-policy-validation.test.ts)) accepts/rejects them in the way the conformance category expects. **Class-validation only** — no hash verification, no signature verification, no policy execution, no audit-chain enforcement, mirroring the deliberate Hounfour-side omission per ADR-027B-Fire §"Decision" §2 / §5. |
| **Likely files (created or modified)** | One new Vitest test file under `tests/` (working name `tests/hounfour-recall-wedge-vectors.test.ts`); at most one new **pointer/manifest** file under `fixtures/hounfour-conformance/` that records, by Hounfour-side path, where each of the five vectors lives **inside the resolved `@0xhoneyjar/loa-hounfour` package**. **This ADR does not authorize copying the five Hounfour `recall-wedge` vector JSON files into the Straylight tree** by any mechanism (no `npm run` codegen step, no `cp` / build-time materialization, no inline literal embedding, no `import` of a vendored copy). Vendoring the JSON contents requires a separate first-class successor ADR with its own §4.d evidence; this proposal does not pre-approve such an ADR. |
| **Public-surface impact** | **None.** No symbol added to [`../../src/straylight/index.ts`](../../src/straylight/index.ts); no symbol added to [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts); no edit to [`../mvp/package-boundary.md`](../mvp/package-boundary.md); no `dist/` change; no `dist-types/` change; both generated trees must remain clean. |
| **Runtime-allowlist impact** | **None.** Allowlist remains `{ handleRecallIntake, createDixieCapability, DixieCapabilityError, DixieCapability (type) }` per [ADR-026A §"Decision" §3](./ADR-026A-runtime-recall-intake-subpath.md), Phase 26B / 26B-F, ADR-027A §"Decision" §4.c, and ADR-027B-Fire §"Decision" §3 §4.c row. |
| **Package / dependency treatment** | The existing `@0xhoneyjar/loa-hounfour` dependency in [`../../package.json`](../../package.json) (declared at `^8.6.0`) and [`../../package-lock.json`](../../package-lock.json) (resolved at `8.6.0`) is **left unchanged**. **No manifest delta** is permitted only if the five `recall-wedge` conformance vectors are **actually accessible from the already-resolved `@0xhoneyjar/loa-hounfour@8.6.0` package** through an existing supported access path (e.g., a path inside the installed `node_modules/@0xhoneyjar/loa-hounfour/` tree that the package's own `exports` map or shipped on-disk layout makes available). **Current evidence indicates this path is unavailable**: the installed `@0xhoneyjar/loa-hounfour@8.6.0` does **not** contain `vectors/conformance/recall-wedge`. The future code PR may **not** treat "the vectors exist on Hounfour `origin/main` / `c06ef1ba`" or "the vectors exist in package version `8.7.0` on Hounfour `origin/main`" as satisfying this rule — Hounfour `origin/main` is **not** a published, tagged, resolvable package release in the ADR-027A §"Decision" §4.a sense, and a `package.json`-internal version field on `origin/main` is **not** a registry-published tag. Per §"Decision" §8.b below, vector availability via an untagged Hounfour commit blocks the future PR. The future PR **must explicitly state** which posture it adopts: (i) "no manifest delta" (only if the rule above is genuinely met) **or** (ii) an exact-version pin to a published, tagged, resolvable Hounfour release that contains the vectors; and **must cite** the Hounfour-side tag, `$id` (n/a — not adopted), JS subpath (n/a — not adopted), and the on-disk path inside the resolved package of each consumed vector. No range widening (`^x.y.z` → `^x.(y+1).0` or similar) is permitted; only an exact-version pin to a citable tag. |
| **Private alias module treatment** | The existing Phase 17B private-alias module at [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts) is the **only** alias seam involved. It is **not modified** by this proposal: the future PR does not import any new symbol through it, does not re-export any new symbol, and does not widen its surface. Vector consumption is JSON / fixture import, not JS-symbol import. |
| **Tests** | One new Vitest file (working name above) covering the five conformance vectors. The tests deliberately exercise only the wedge's existing class-validation seam (mirroring Hounfour PR #116's class-validation-only harness per ADR-027B-Fire §"Decision" §5 and the class-vs-policy preservation statement); the tests deliberately do **not** verify hashes, signatures, or audit chains. |
| **Expected validation** | `npm run typecheck` clean; `npm test` passes (existing Phase 26B / 26B-F / 26C suites continue to pin the Straylight-side seam; the new test pins the conformance-vector consumption); `npm run build` clean and **byte-identical** to the post-Phase-28A baseline; `dist/` and `dist-types/` **must remain clean** (`git status --short -- dist dist-types` returns no entries); any `dist/` or `dist-types/` generated diff produced by the future PR is **out of scope** for Track 1 and requires a separate first-class authorizing ADR (this proposal does not pre-approve any such ADR); `npm pack --dry-run` shows the **published surface unchanged** (no new runtime subpath; no widened allowlist; no new public type re-export). |
| **Rollback** | Code-only rollback: revert the future PR; delete the new Vitest file (and the local fixtures pointer if any was added). Inverse-docs rollback for **this** ADR: delete this ADR and revert the two append-only Phase 28B sections in [`../handoffs/README.md`](../handoffs/README.md) and [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md). Rollback restores the post-Phase-28A baseline. Rollback does **not** re-open `loa-dixie` PR #102, does **not** re-fire any ADR-022E gate (none of which were fired), and does **not** authorize any sibling-repo edit. |

### 4. What is explicitly forbidden

ADR-027B-PrivateAlias-successor-plan forbids each of the
following as a consequence of itself; reviewers may cite this
section verbatim to refuse a PR that treats this ADR as
authorization for any of these:

- **4.a — Public export widening.** Root `@loa/straylight` and
  `@loa/straylight/host` remain `"types"`-only. No new public
  symbol, no new subpath, and no new public type re-export is
  authorized by this ADR.
- **4.b — Runtime allowlist widening.** The runtime allowlist
  remains `{ handleRecallIntake, createDixieCapability,
  DixieCapabilityError, DixieCapability (type) }` per ADR-026A
  §"Decision" §3, Phase 26B / 26B-F, ADR-027A §"Decision" §4.c,
  and ADR-027B-Fire §"Decision" §3 §4.c row.
- **4.c — Dixie endpoint changes.** No re-open of `loa-dixie`
  PR #102; no second Dixie endpoint; no second runtime subpath;
  no Phase 24E S2–S6 surface; no ADR-026D-equivalent successor
  authorized by this ADR (cf. ADR-027A §"Decision" §8.a–§8.d).
- **4.d — Finn runtime adoption.** ADR-022E gate #9 remains
  held. This ADR does not authorize any move of
  `handleRecallIntake` enforcement into Finn; that path is
  governed by [ADR-027C](./ADR-027C-finn-return-gate-readiness.md)
  and a separate first-class successor.
- **4.e — Signature verification.** This ADR authorizes no
  signature-verification path. The Hounfour conformance harness
  deliberately does not verify hashes or signatures per
  ADR-027B-Fire §"Decision" §2 / §5; that posture is preserved
  on the Straylight side by the future PR.
- **4.f — Policy execution.** This ADR authorizes no policy-
  execution code; the class-vs-policy boundary at
  [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  is preserved.
- **4.g — Storage adapters.** ADR-022E gate #8 remains held;
  this ADR authorizes no storage adapter / persistence
  substrate change.
- **4.h — Audit-chain enforcement.** This ADR authorizes no
  audit-chain enforcement code; the soft audit prefix
  `0xhoneyjar:straylight:` is treated as a string namespace,
  not an enforcement primitive — and Track 2 (soft-audit-
  prefix-only consumption) is **not** proposed by this ADR
  (see §2 above).
- **4.i — Recall execution changes.** This ADR authorizes no
  change to the existing `executeRecall` pipeline or to any
  wedge runtime path.
- **4.j — New Hounfour shape adoption.** ADR-022E gates #1, #2,
  #3, #4, #5, #17, #18 remain held. No `EstateTransition`,
  `Challenge`, `safeCanonicalize`, or `AuditEvent` adoption is
  authorized by this ADR.
- **4.k — New domain `$id` adoption.** No `$id` is adopted by
  this ADR or by the future PR; the wedge's public surface
  remains Straylight-named per
  [ADR-020C](./ADR-020C-straylight-schema-namespace-strategy.md)
  and [ADR-022A](./ADR-022A-straylight-semantic-home.md).
- **4.l — Threat-model edits.**
  [`../mvp/threat-model.md`](../mvp/threat-model.md) is **not**
  edited by this ADR. The future PR's threat-model impact
  statement (§5.b row below) is included **in the future PR's
  authorizing text**, not as a threat-model edit, and only if
  the future PR's authoring step decides one is required —
  which, by construction (test-only, no runtime, no public
  surface), it should not.
- **4.m — Package-boundary edits.**
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
  **not** edited by this ADR or by the future PR.
- **4.n — Sibling-repo edits.** No `loa-dixie`, `loa-finn`,
  `loa-hounfour`, `loa-freeside`, `loa`, or `freeside-
  characters` file is edited. No issue / comment / PR is filed
  by Phase 28B.
- **4.o — Loa framework / control-plane / model-substrate
  edits.** Per ADR-027A §"Decision" §8.j and ADR-027B-Fire
  §"Decision" §8.n; this ADR does not sequence Loa-side
  substrate hardening against Straylight phase work.
- **4.p — Tag / release / package publish.** Per ADR-027A
  §"Decision" §8.k and ADR-027B-Fire §"Decision" §8.o.
- **4.q — Successor pre-approval.** No further successor is
  pre-approved by this ADR. Track 2 (soft-audit-prefix-only)
  and Track 3 (shape adoption) each require their own
  first-class successor ADR with their own §4.d evidence.

### 5. Mapping to ADR-027A §4 / ADR-027B §2 / ADR-027B-Fire §3

| Row | Disposition under this proposal | Notes |
|---|---|---|
| **§4.a Upstream substrate evidence** | `READY-AS-COMPOSITION-SUBSTRATE; PENDING-AS-SHAPE-ADOPTION` (unchanged from ADR-027B-Fire §3 §4.a). The proposal **does not** narrow the row further; it only commits to consuming the **vectors** (composition substrate) and not to adopting any **shape** (which would require the `PENDING-AS-SHAPE-ADOPTION` half to flip). | The future PR cites Hounfour PR #116 / origin/main `c06ef1ba`, the on-disk path of each consumed vector, and the dependency posture (no manifest delta or exact-tag pin per §3 above). |
| **§4.b Threat-model impact statement** | `READY` unchanged. The future PR adds a Straylight-side test-only consumption; it adds no runtime, no authority, no signature verification, no policy execution, no audit-chain enforcement, no storage adapter, no recall execution, and no Dixie / Finn integration. T13–T18 + T9 are not impacted by a class-validation-only Vitest of JSON inputs read from the resolved `@0xhoneyjar/loa-hounfour` package. | The future PR explicitly states "no T13–T18 + T9 impact; class-vs-policy boundary preserved" and **does not edit** [`../mvp/threat-model.md`](../mvp/threat-model.md). |
| **§4.c Consumer-contract delta** | `READY` unchanged — **no allowlist delta**. The future PR adds no runtime export. | Reviewers may refuse any PR that cites this ADR while widening the allowlist. |
| **§4.d Pre-merge real 3-model Flatline + Bridgebuilder** | `PENDING` / **currently unsatisfied** for **this** ADR. See §6 below. The future PR also independently inherits §4.d on its own (it is a code-bearing PR; ADR-026A0 §3 first-class). | This proposal is **not** code-authorizing; this row is the reason. |
| **§4.e ADR-022E gates remain held** | `HELD` for #1, #2, #3, #4, #5, #17, #18. See §7 below for per-gate analysis. | This proposal fires **none** of the ADR-022E gates; that is by construction. |

### 6. §4.d posture — currently unsatisfied; what would satisfy it

ADR-027B-PrivateAlias-successor-plan is a §3 **first-class** doc
under [ADR-026A0 §"Decision" §3](./ADR-026A0-operator-authority-flatline-rule.md):
if accepted on its own §4.d evidence, it would unblock a
specific code-bearing PR (§3 above). It therefore inherits the
full pre-merge real 3-model Flatline + Bridgebuilder requirement
on its own merger, per ADR-026A0 §"Decision" §3 / §5.

**Current status:** §4.d is **PENDING / currently unsatisfied**.

The Loa control-plane substrate is degraded per Phase 26F §7.1
(recorded in
[`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)).
ADR-027A §"Decision" §4.d, ADR-027B §"Decision" §2 §4.d row, and
ADR-027B-Fire §"Decision" §3 §4.d row each pin that this
condition does **not** waive, weaken, or pre-satisfy §4.d for
any successor. Substrate-degradation findings on this proposal
are **audit evidence the operator weighs**; they are not a
reason to bypass §4.d.

**No alternate review route is proposed.** ADR-027B-PrivateAlias-
successor-plan does **not** propose:

- a "two-model" Flatline as a substitute for "real 3-model";
- a "Codex audit only" route as a substitute for Flatline +
  Bridgebuilder;
- a "ChatGPT advisory" route as a substitute for Flatline +
  Bridgebuilder;
- a "long-context window dump" route as a substitute for
  Flatline + Bridgebuilder;
- a "persisted memory recall" route as a substitute for
  Flatline + Bridgebuilder;
- a "teammate review without Flatline" route under
  ADR-026A0 §3 — the rule there permits the operator to
  *author* directly under the five-clause discipline, but the
  pre-merge Flatline + Bridgebuilder requirement is independent
  and applies to any change to source / package / runtime /
  test / dependency / public surface, and to any docs-only
  change that creates authorization (which this one does);
- a "self-Flatline" or "Claude-as-three-models" route — the
  three-model conjunction is the gate, and one model running
  three times is one model.

**What would satisfy §4.d** (and **only** what would satisfy
§4.d) for this proposal:

1. The Loa control-plane substrate hardening is completed
   sufficiently to run **real 3-model Flatline** (PASS or
   REVISE-with-resolution) **AND real Bridgebuilder review** on
   this ADR's PR; **and**
2. The Flatline + Bridgebuilder PR is opened against this ADR
   (and the two append-only navigation entries) with the
   substrate available; **and**
3. The Flatline verdict is PASS, or REVISE-with-resolution that
   is resolved on the same PR; **and**
4. The Bridgebuilder review is recorded as a PR comment on the
   same PR (per the Run Bridge constraints in
   `.claude/loa/CLAUDE.loa.md`).

If, and only if, all four steps complete, ADR-027B-PrivateAlias-
successor-plan may merge. **Until then, the proposal is
explicitly blocked from authorizing the future code PR**, and
reviewers may cite this section verbatim to refuse any PR that
treats this proposal as code-authorizing.

Even after this ADR merges, the **future Straylight code PR**
described in §3 above **independently inherits §4.d on its own**
under ADR-026A0 §"Decision" §3 (it is a source / test /
dependency change). This proposal does **not** pre-satisfy §4.d
for the future code PR.

### 7. ADR-022E gate impact

ADR-027B-PrivateAlias-successor-plan is conservative on
ADR-022E. The proposal fires **no ADR-022E gates**. Per-gate
analysis:

| Gate | Trigger column (verbatim spirit, per ADR-022E) | Hounfour PR #116 evidence | Disposition under this proposal |
|---|---|---|---|
| **#1 — `EstateTransition` schema (canonical) and on-the-wire envelope** | Hounfour ships an `estate-transition.schema.json` (or equivalently named) under `https://schemas.0xhoneyjar.com/loa-hounfour/8.6.x/`, **and** a separate ADR adopts it under ADR-020C / ADR-022C. | Hounfour PR #116 ships **no** `estate-transition.schema.json` and **no** new domain `$id`. | **HELD.** Trigger conjunction unsatisfied. |
| **#2 — `EstateTransition` local implementation** | Either gate #1 unblocks (then adopt by alias), **or** a separate ADR explicitly authorizes a local `EstateTransition` type / schema / fixture. | Gate #1 not unblocked; this ADR authorizes no local `EstateTransition` type / schema / fixture. | **HELD.** |
| **#3 — `safeCanonicalize` JS-subpath adoption** | Hounfour ships a declared `./canonicalize` (or `./utilities`) subpath whose JS module exports `safeCanonicalize`, **and** a separate ADR adopts the subpath. | Hounfour PR #116 declares **no** new JS subpath. | **HELD.** |
| **#4 — `Challenge` adoption into the wedge's public surface** | A separate ADR cites the v8.6.0 `$id`, specifies the alias / re-export path, and pins a boundary preservation test. | This ADR does not authorize public `Challenge` re-export and pins no public-surface boundary preservation test. The future PR's boundary preservation test pins **the absence of any public re-export**, not the presence of one. | **HELD.** |
| **#5 — `AuditEvent` adoption from a Hounfour candidate** | A separate ADR adopts a v8.6.x candidate (or Hounfour ships an `AuditEvent` schema). | Hounfour PR #116 ships no `AuditEvent` adoption authorization. | **HELD.** |
| **#17 — Eleven exported-but-unconsumed Hounfour JS subpaths** | Documented Straylight need + separate ADR + future implementation phase explicitly citing the authorization. | This ADR authorizes no consumption of any of the eleven. The future PR consumes **only** the existing Phase 17B `@0xhoneyjar/loa-hounfour/core` import path already pinned in [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts), and that consumption is unchanged in scope by the future PR. | **HELD.** |
| **#18 — Adoption of a Hounfour-named symbol into the wedge's public surface** | A separate ADR explicitly authorizes a public re-export and pins a boundary preservation test. | This ADR authorizes no public re-export. The future PR's boundary preservation test pins **the absence** of any public re-export. | **HELD.** |

**Be conservative — no gates fire.** None of the seven gates'
trigger conjunctions are satisfied by Hounfour PR #116's
composition-contract evidence in combination with this
proposal's narrowed scope. The proposal **does not** narrow
"HELD" to any other state for any of #1–#5, #17, #18.

### 8. Hounfour dependency posture

The existing `@0xhoneyjar/loa-hounfour` dependency in
[`../../package.json`](../../package.json) (declared at
`^8.6.0`) and [`../../package-lock.json`](../../package-lock.json)
(resolved at `8.6.0`) is treated as follows by this proposal:

- **8.a — This ADR makes no manifest change.**
  ADR-027B-PrivateAlias-successor-plan does not pin, bump,
  range-widen, range-narrow, or otherwise touch the dependency.
- **8.b — Release/tag blocker.** If the five `recall-wedge`
  conformance vectors are available **only** from Hounfour
  `origin/main` / commit `c06ef1ba`, from another untagged
  Hounfour commit, or from a `package.json` version field
  (e.g., `8.7.0`) inside an untagged Hounfour commit that has
  not been **published as a tagged, resolvable registry
  release**, the future code PR is **blocked**. The block is
  released only by **either**: (i) a published, tagged,
  resolvable `@0xhoneyjar/loa-hounfour` release that contains
  the vectors at a path the published package's own `exports`
  map or shipped on-disk layout makes available, after which
  the future PR may pin to that exact tag (no range widening;
  exact tag only); **or** (ii) a separate first-class
  successor ADR that authorizes vendoring the vector JSON
  contents into the Straylight tree under its own §4.d
  evidence. This proposal does **not** pre-approve any such
  vendoring ADR.
- **8.c — "No manifest delta" is narrow.** "No manifest delta"
  is permitted **only** when the five `recall-wedge`
  conformance vectors are actually accessible from the
  already-resolved `@0xhoneyjar/loa-hounfour@8.6.0` package
  through an existing supported access path. **Current evidence
  is that this path is unavailable**: the installed
  `@0xhoneyjar/loa-hounfour@8.6.0` does **not** contain
  `vectors/conformance/recall-wedge`. The future PR may **not**
  rely on Hounfour `origin/main` access, on a `package.json`
  version field inside an untagged Hounfour commit, or on
  "the vectors exist somewhere in the Hounfour repo" as
  evidence that this rule is met. Until §8.b is released, the
  "no manifest delta" posture is unavailable in practice.
- **8.d — Exact-tag pin is also narrow.** Pinning to a strictly
  later tagged release is permitted **only** to an exact tag,
  **only** if the conformance vectors are accessible **only**
  via that tag, **and only** if the Hounfour-side release is
  published, tagged, and resolvable in the ADR-027A §"Decision"
  §4.a sense. No range widening (`^x.y.z` → `^x.(y+1).0` or
  similar) is permitted.
- **8.e — Bumps for non-Track-1 reasons are forbidden.** The
  future code PR is *not* permitted to bump the dependency to
  satisfy a feature outside Track 1. Track 2 and Track 3 each
  require their own first-class successor ADR per §2 above;
  neither is authorized by this proposal, and neither may be
  smuggled in under cover of a Track 1 dependency pin.

### 9. What evidence from Hounfour PR #116 is used

Per ADR-027B-Fire §"Decision" §2 and §5, this proposal accepts
the following from Hounfour PR #116 / origin/main `c06ef1ba` as
**audit evidence the operator weighs**, not as authorization
(the canonical artifact is the merged Hounfour-side commit):

- **PR #116 / `c06ef1ba`** — the citable HEAD pin and empty
  `HEAD..origin/main` tree diff statement.
- **The recall-wedge composition document** at Hounfour-side
  `docs/architecture/recall-wedge-composition.md`.
- **The `recall-wedge` conformance category.**
- **The `0xhoneyjar:straylight:` soft audit prefix** — *as a
  string constant cited by ADR-027B-Fire §2*. This proposal
  does **not** propose Track 2 (soft-audit-prefix-only
  consumption) and therefore does **not** incorporate the
  prefix into wedge code.
- **The five `recall-wedge` conformance vectors** — covering
  request-to-pack, pack-to-receipt, receipt-to-commitment,
  commitment_type, packed assertion item, admitted assertion,
  signatures-present, and `recall_scope === surface_context`.
- **The Hounfour-side Vitest harness at `tests/vectors/recall-
  wedge-vectors.test.ts`** — class-vs-policy preservation
  reference (the Hounfour-side harness deliberately does not
  verify hashes or signatures; the future Straylight-side test
  preserves that posture).
- **The class-vs-policy separation statement** — the deliberate
  Hounfour-side omission of hash and signature verification per
  ADR-027B-Fire §"Decision" §2 / §5.
- **The Hounfour-side validation results** — `npm test` (305
  files, 9,486 tests), the targeted recall / vector / vocabulary
  subset (701 tests), `npm run schema:check`, `npm run vectors:
  check`, `npm run schemas:validate`, `npm run check:class-
  policy-boundary`, `npm run semver:check`, `npm run check:
  release-integrity-parity`, `npm run typecheck`, `git diff
  --check ad108cb5..HEAD`. The audit further records that
  `npm run check:dist-parity` was deliberately omitted (the
  script writes to tracked `dist/`; the audit was read-only)
  and is therefore not accepted as having run.

This proposal does **not** accept any of the above as
authorization for code: per §6, the only path to code
authorization is satisfying §4.d on this ADR's own PR, and the
future code PR (§3) inherits §4.d on its own as well.

### 10. What Codex must audit next

Per [ADR-027A §"Decision" §6](./ADR-027A-post-dixie-return-gate.md)
and [ADR-026A0 §"Decision" §6.Forbidden](./ADR-026A0-operator-authority-flatline-rule.md),
Codex output is **audit evidence the operator weighs**, not
authority. With that pinned, the next bounded read-only audit
items Codex (or any equivalent read-only audit lane) is
expected to produce are:

- **10.a — Vector accessibility audit.** For each of the five
  Hounfour PR #116 `recall-wedge` conformance vectors, identify
  whether the vector is accessible (i) inside the **already-
  resolved** `@0xhoneyjar/loa-hounfour@8.6.0` package, through
  an existing supported access path; (ii) only via a **later
  published, tagged, resolvable** Hounfour-side release; or
  (iii) only via a Hounfour-side commit not yet published
  under any tag (e.g., `origin/main` / `c06ef1ba`, or a
  `package.json` version field inside an untagged commit such
  as `8.7.0` on `origin/main`). Current evidence indicates
  outcome (iii). If (iii), §3's future code PR is **blocked**
  per §"Decision" §8.b above: the operator must wait for a
  published, tagged, resolvable release that contains the
  vectors, **or** a separate first-class successor ADR must be
  accepted that authorizes vendoring the vector JSON contents
  into the Straylight tree under its own §4.d evidence. This
  proposal does **not** authorize vendoring under §10.a alone;
  §10.a is read-only audit. The audit must cite paths and
  Hounfour-side commits.
- **10.b — Class-vs-policy boundary audit on the Straylight
  side.** Confirm by reading
  [`../../src/straylight/validators/`](../../src/straylight/validators/),
  [`../../tests/class-vs-policy-validation.test.ts`](../../tests/class-vs-policy-validation.test.ts),
  and
  [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  that no existing wedge code path verifies hashes or signatures
  in a way that the future PR's vector-driven test would
  inadvertently re-execute. The audit must cite specific
  validator files and assertion sites.
- **10.c — Public-surface non-impact audit.** Confirm by reading
  [`../../src/straylight/index.ts`](../../src/straylight/index.ts)
  and [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  that the future PR's described scope (one new Vitest file
  under `tests/`; zero or one fixture pointer file under
  `fixtures/hounfour-conformance/`) cannot widen
  `@loa/straylight` or `@loa/straylight/host` even if naively
  authored, and that the runtime allowlist remains the
  ADR-026A `{ handleRecallIntake, createDixieCapability,
  DixieCapabilityError, DixieCapability (type) }` set.
- **10.d — Phase 17B alias non-impact audit.** Confirm by
  reading [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  that the future PR's described scope does not cause the
  alias module to import a new symbol, re-export a new symbol,
  or widen its boundary. The audit must explicitly state that
  the alias module's `@0xhoneyjar/loa-hounfour/core` subpath
  consumption is unchanged.
- **10.e — `dist/` / `dist-types/` clean-tree audit.**
  Confirm that under the future PR's described scope,
  `npm run build` produces a `dist/` and `dist-types/` that
  remain **clean** against the post-Phase-28A baseline
  (`git status --short -- dist dist-types` returns no
  entries). Any `dist/` or `dist-types/` generated diff
  produced by the future PR is **out of scope for Track 1**
  and requires a separate first-class authorizing ADR; the
  audit must call out any such diff as a Track-1 scope
  violation rather than as an accepted "test-tooling output."
  The audit must explicitly state this expectation; it cannot
  itself run the build (read-only constraint).
- **10.f — Substrate-status audit.** For each of Flatline
  (3-model), Bridgebuilder, Cheval, and the model-routing
  substrate, record whether the substrate is currently
  available to run the §4.d gate on this ADR's PR. The audit
  must produce a yes/no answer per substrate, with a citation
  to the most recent in-repo substrate status record (e.g.,
  Phase 26F §7.1). If any answer is "no", the audit must
  explicitly state that this ADR remains blocked under §6.

Codex audit output on any of 10.a–10.f is **audit evidence the
operator weighs**, not authorization. It does not satisfy §4.d.
It does not pre-satisfy the future code PR's own §4.d. It does
not fire any ADR-022E gate. Reviewers may cite this section
verbatim to refuse a PR that treats Codex audit on 10.a–10.f as
authority.

### 11. Refusal rules

Reviewers may cite this section verbatim to refuse a sibling-
repo or in-repo PR that exceeds this proposal's scope:

- **11.a** — No claim that ADR-027B-PrivateAlias-successor-plan
  fires any ADR-022E gate (#1–#5, #17, #18 all remain held).
- **11.b** — No claim that ADR-027B-PrivateAlias-successor-plan
  satisfies, waives, or pre-satisfies the §4.d pre-merge real
  3-model Flatline + Bridgebuilder gate for itself or for the
  future code PR.
- **11.c** — No citation of Codex audit output, ChatGPT output,
  or any model finding as authorization for a Straylight
  surface widening, an ADR-022E gate firing, an allowlist
  change, a runtime subpath addition, a tag / release /
  publish, a sibling-repo edit, or a private-alias *shape*
  adoption PR.
- **11.d** — No re-open of `loa-dixie` PR #102 and no Phase
  26E re-implementation in `loa-straylight`.
- **11.e** — No bump of `@0xhoneyjar/loa-hounfour` outside the
  bounded posture of §8 above, and no Hounfour-named symbol
  adoption into the wedge public surface.
- **11.f** — No claim that the conformance vectors, the soft
  audit prefix, or the conformance-vector envelope schema have
  been adopted into the wedge by virtue of this proposal
  merging. The proposal authorizes a **test-only** Vitest of
  the five vectors **if and only if §4.d is satisfied** on the
  proposal's own PR; nothing else.
- **11.g** — No Track 2 (soft-audit-prefix-only) consumption
  under cover of this proposal; no Track 3 (shape adoption)
  under cover of this proposal. Each requires its own
  first-class successor ADR.
- **11.h** — No Finn migration, Freeside wiring, production
  storage migration, signature verification, policy execution,
  audit-chain enforcement, storage adapter, or recall execution
  change.
- **11.i** — No edit to [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  or [`../mvp/threat-model.md`](../mvp/threat-model.md) under
  cover of this proposal.
- **11.j** — No claim that Loa control-plane substrate
  degradation waives, weakens, or shortens the §4.d gate. Per
  §6, substrate degradation is a Loa-side concern; it is not a
  reason to bypass §4.d.

### 12. Rollback

ADR-027B-PrivateAlias-successor-plan is docs-only and adds no
runtime / test / fixture / script / package change. Rollback is
the inverse-docs-only operation: delete this ADR; revert the
two Phase 28B append-only sections in
[`../handoffs/README.md`](../handoffs/README.md) and
[`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md).
Rollback restores the post-Phase-28A baseline. Rollback does
**not** re-open `loa-dixie` PR #102, does **not** re-fire any
ADR-022E gate (none of which were fired), does **not** modify
the §3 future-code-PR shape (it ceases to be authorized at all,
because the authorizing ADR is rolled back), and does **not**
authorize any sibling-repo edit.

If this ADR has merged and §4.d is satisfied **after merge** but
**before** the future code PR opens, no special rollback is
required for this ADR; the future code PR is the next first-
class doc and inherits §4.d on its own.

If this ADR has merged, §4.d is satisfied, the future code PR
opens, **and** the future code PR is later rolled back, the
rollback is the inverse-code-only operation on the future PR
(revert the new Vitest file and any new fixture pointer file);
this ADR remains in place as a **plan whose downstream code is
deferred again**, which is functionally identical to the state
between this ADR's merge and the future code PR's merge.

## Consequences

- The Hounfour PR #116 composition-contract evidence has a
  **plan**-level Straylight-side successor record. Reviewers
  may refuse a PR that treats Hounfour PR #116 evidence as
  authorization for anything beyond Track 1, conformance-
  vector-only consumption, behind the existing Phase 17B
  alias seam.
- The §4.a substrate disposition narrowed by ADR-027B-Fire
  (`READY-AS-COMPOSITION-SUBSTRATE; PENDING-AS-SHAPE-ADOPTION`)
  is **not further narrowed** by this proposal. The proposal's
  Track 1 specifically does not require the `PENDING-AS-SHAPE-
  ADOPTION` half to flip.
- The §4.b and §4.c rows remain `READY` and unchanged. The
  future code PR's plan adds no runtime export, no allowlist
  delta, and no threat-model edit.
- The §4.d pre-merge real 3-model Flatline + Bridgebuilder
  gate **remains explicitly unsatisfied** for this proposal.
  This proposal is **not** code-authorizing today.
- ADR-022E gates #1, #2, #3, #4, #5, #17, and #18 all remain
  **HELD**. The Hounfour-named symbols `EstateTransition`,
  `Challenge`, `safeCanonicalize`, and `AuditEvent` are **not**
  adopted into the wedge by this proposal.
- The runtime subpath, runtime allowlist, root and host
  `"types"`-only postures, the threat model, and the package
  boundary are all unchanged.
- A future Track 2 (soft-audit-prefix-only) successor or Track
  3 (shape adoption) successor is **not** pre-approved; each
  requires its own first-class successor ADR with its own
  §4.d evidence.
- Codex / Flatline / Bridgebuilder / Cheval findings, persisted
  agent memory, and long-context window dumps remain formally
  audit evidence — not authority — for any future operator
  decision under ADR-026A0.

## Validation

ADR-027B-PrivateAlias-successor-plan adds no source / test /
fixture / script / package change; the working-tree surface is
the entire validation:

```bash
git diff --name-only                         # tracked-file modifications only
git ls-files --others --exclude-standard     # untracked new files
git status --short --untracked-files=all     # full Phase 28B working set
```

Expected:

- `git diff --name-only` lists exactly the two **modified**
  tracked files: `docs/handoffs/README.md` and
  `docs/handoffs/cross-repo-implementation-order.md`.
- `git ls-files --others --exclude-standard` lists exactly the
  one **untracked** new file: this ADR.
- `git status --short --untracked-files=all` lists all three
  Phase 28B files (two `M`, one `??`), plus any pre-existing
  local dirt outside the Phase 28B scope (which remains
  unstaged per the phase brief).

Plain `git diff --stat` reports tracked-file modifications only
and will **not** show the new ADR until it is staged; this ADR
does not stage it. `npm run typecheck`, `npm test`,
`npm run build`, and `npm pack --dry-run` remain identical to
the post-Phase-28A baseline by construction.

## Source files inspected

- [`./ADR-022E-phase-22-deferred-features.md`](./ADR-022E-phase-22-deferred-features.md)
  (gate inventory; per-gate trigger columns).
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
  (operator authority + Flatline rule; first-class vs second-
  class doc classes; §3 / §5 pre-merge requirement).
- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
  (runtime allowlist + subpath authorization; allowlist set
  pinned by §"Decision" §3).
- [`./ADR-027A-post-dixie-return-gate.md`](./ADR-027A-post-dixie-return-gate.md)
  (canonical return-gate criteria §4.a–§4.e; refusal rules
  §8; successor contract §9).
- [`./ADR-027B-hounfour-return-gate-readiness.md`](./ADR-027B-hounfour-return-gate-readiness.md)
  (canonical readiness inventory; §2 §4.a–§4.e rows the Phase
  28A evidence lock narrowed).
- [`./ADR-027B-Fire-hounfour-composition-contracts.md`](./ADR-027B-Fire-hounfour-composition-contracts.md)
  (Phase 28A composition-contract evidence lock; §"Decision"
  §2 artifact list; §3 mapping; §4 ADR-022E per-gate analysis;
  §5 Codex audit evidence; §6 second-class operator-discretion
  posture; §7 adjudication summary; §8 forbidden list; §9
  refusal rules; §10 rollback).
- [`./ADR-027C-finn-return-gate-readiness.md`](./ADR-027C-finn-return-gate-readiness.md)
  (Finn-side readiness, unaffected by this proposal).
- [`./ADR-020C-straylight-schema-namespace-strategy.md`](./ADR-020C-straylight-schema-namespace-strategy.md),
  [`./ADR-022A-straylight-semantic-home.md`](./ADR-022A-straylight-semantic-home.md),
  [`./ADR-022C-schema-dependency-direction.md`](./ADR-022C-schema-dependency-direction.md)
  (public surface remains Straylight-named; Hounfour referenced
  privately).
- [`../handoffs/phase-27b-phase-28-coding-candidate.md`](../handoffs/phase-27b-phase-28-coding-candidate.md)
  (Phase 28 coding-candidate note; identifies the candidate
  in-repo follow-up shape).
- [`../handoffs/phase-27b-subpath-retirement-migration.md`](../handoffs/phase-27b-subpath-retirement-migration.md)
  (runtime-subpath retirement plan; gated by ADR-027C-Fire,
  not this ADR).
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md),
  [`../handoffs/cross-repo-handoff-index.md`](../handoffs/cross-repo-handoff-index.md),
  [`../handoffs/cross-repo-no-go-sequence.md`](../handoffs/cross-repo-no-go-sequence.md)
  (sibling-repo coordination; long-term order unchanged).
- [`../handoffs/hounfour-schema-extraction-issue.md`](../handoffs/hounfour-schema-extraction-issue.md),
  [`../handoffs/hounfour-extraction-mapping.md`](../handoffs/hounfour-extraction-mapping.md),
  [`../handoffs/hounfour-response-intake.md`](../handoffs/hounfour-response-intake.md),
  [`../handoffs/hounfour-rc-shadow-integration-checklist.md`](../handoffs/hounfour-rc-shadow-integration-checklist.md),
  [`../handoffs/hounfour-shadow-integration-findings.md`](../handoffs/hounfour-shadow-integration-findings.md),
  [`../handoffs/hounfour-v850-shadow-review-packet.md`](../handoffs/hounfour-v850-shadow-review-packet.md),
  [`../handoffs/phase-21b-v86-schema-readiness-lock.md`](../handoffs/phase-21b-v86-schema-readiness-lock.md)
  (Hounfour packets a Track 3 successor would still need to
  cite — not cited as authorization here).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) (T13–T18
  + T9 amendment) — read-only at decision time; not edited.
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  (runtime allowlist) — read-only at decision time; not edited.
- [`../schema-candidates/class-vs-policy-boundary.md`](../schema-candidates/class-vs-policy-boundary.md)
  (load-bearing boundary preserved by Hounfour PR #116 and by
  the future code PR's class-validation-only scope).
- [`../../src/straylight/hounfour-alias.ts`](../../src/straylight/hounfour-alias.ts)
  (existing Phase 17B private-alias seam; unchanged in scope
  by this proposal).
- [`../../src/straylight/index.ts`](../../src/straylight/index.ts),
  [`../../src/straylight/host/index.ts`](../../src/straylight/host/index.ts)
  (public-surface barrels; unchanged in scope).
- [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json)
  (`@0xhoneyjar/loa-hounfour` declared `^8.6.0`, resolved
  `8.6.0`; unchanged in scope).
- [`../product-context/loa-straylight-pr11-cross-repo-decision-report.md`](../product-context/loa-straylight-pr11-cross-repo-decision-report.md)
  (Phase 26F §7.1 substrate-degradation record; reason §4.d
  remains currently unsatisfied).
