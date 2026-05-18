# Phase 26C — Dixie recall-intake consumer contract (in-repo only)

> Status: Phase 26C is a **Straylight-side, in-repo
> consumer-contract record** for the runtime recall-intake
> subpath that ADR-026A authorized and Phase 26B implemented.
> Companion ADR:
> [`../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md`](../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md).
>
> Phase 26C does **not** authorize a Dixie endpoint, a Dixie
> adapter, a sibling-repo edit, a deployment, a Straylight
> package-surface change, a Straylight runtime-source change,
> a fixture / script / build change, a `dist/` or `dist-types/`
> commit, a Hounfour adoption flip, a Finn wiring step, a
> Freeside surface, a Loa framework edit, a tag, a release, or
> a package publish. The future Dixie endpoint, if and when it
> ships, remains independently gated by Phase 26A-1 T13–T18 +
> ADR-022E gate #10 + the operator-authority discipline pinned
> by ADR-026A0. ADR-022E gates and Phase 25A / 25B / 26A-0 /
> 26A-1 refusal rules **remain binding**.
>
> Phase 26C edits only:
>
> - this handoff (new),
> - the companion ADR-026C (new),
> - [`./README.md`](./README.md) (append-only Phase 26C entry,
>   in chronological order, after the Phase 26A-2 entry, before
>   the Phase 15 cross-repo-coordination section, in the existing
>   per-phase format),
> - [`../../tests/phase-26c-dixie-consumer-contract.test.ts`](../../tests/phase-26c-dixie-consumer-contract.test.ts)
>   (new).
>
> No prior ADR is edited. No prior handoff is edited other than
> the README append above. No file under
> [`../../src/`](../../src/),
> [`../../scripts/`](../../scripts/),
> [`../../fixtures/`](../../fixtures/),
> [`../../dist/`](../../dist/), or
> [`../../dist-types/`](../../dist-types/) is touched. No
> `package.json`, `package-lock.json`, `.npmrc`, `.gitignore`,
> `tsconfig*`, or `vitest.config.ts` is touched.
> [`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
> **not** edited (Phase 26B already added the runtime-subpath
> section). [`../mvp/threat-model.md`](../mvp/threat-model.md)
> is **not** edited (Phase 26A-1 already amended it). No
> `.loa.config.yaml`, [`../../.loa`](../../.loa),
> [`../../.claude/`](../../.claude/),
> [`../../.beads/`](../../.beads/),
> [`../../.run/`](../../.run/),
> [`../../.github/`](../../.github/),
> [`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/), or
> `node_modules/` is touched. No sibling repo is edited. No
> tag is cut, no Release is created, no PR or comment is
> filed, no package is published.

## Why Phase 26C exists

Phase 26B (PR #45 + Phase 26B-F PR #46) implemented the
ADR-026A runtime subpath at
`@loa/straylight/runtime/recall-intake`. The Phase 26B test
suite ([`../../tests/phase-26b-runtime-recall-intake.test.ts`](../../tests/phase-26b-runtime-recall-intake.test.ts))
pins the §10.a–§10.h invariants on the Straylight side: the
allowlist is exactly
`{ handleRecallIntake, createDixieCapability, DixieCapabilityError }`
plus the `DixieCapability` type re-export, root `.` and `./host`
remain `"types"`-only, no other runtime subpath resolves, the
HMAC + closure-private-brand gate fails closed against the four
ADR-026A §7 attack shapes, and the experimental / pre-Finn /
Dixie-only marker survives `tsc` emission and is recorded in
the README and `package-boundary.md`.

Phase 26B did **not** describe what a *consumer* of that
subpath would have to look like. Reviewers landing the eventual
Dixie endpoint (if and when separately authorized) need a
stable, in-repo, citable contract for the consumer shape so
that:

1. the consumer cannot drift into deep-importing internal
   modules under [`../../src/`](../../src/) or
   [`../../dist/`](../../dist/) — the package's `exports` map
   already blocks that, and Phase 26C records that the contract
   *depends* on the block;
2. the consumer cannot bypass the capability gate by passing a
   structurally-shaped object, by relying on package-name or
   caller-string trust, or by re-using a serialized capability
   across processes — Phase 26B's HMAC + closure-private brand
   already blocks that, and Phase 26C records that the contract
   *depends* on the block;
3. the consumer cannot consume the wedge through any other
   subpath — root `.` and `./host` remain `"types"`-only, and
   Phase 26C records that the contract *depends* on the block;
4. the consumer cannot escape the fail-closed default by
   omitting the `STRAYLIGHT_RUNTIME_DIXIE_KEY` environment
   binding — Phase 26C records that the contract *depends* on
   the block, and the Phase 26C test exercises the fail-closed
   path from a consumer-shaped fixture.

Phase 26C is a **Straylight-side** record. It describes
obligations *on* a future Dixie consumer; the obligations are
derived from Straylight's already-pinned seam shape. Phase 26C
is therefore not authorization (no surface widens) and not a
sibling-repo coordination step (no sibling repo is touched).

## What Phase 26C ships

| Document / artifact | Purpose |
|---|---|
| [`phase-26c-dixie-recall-intake-consumer-contract.md`](./phase-26c-dixie-recall-intake-consumer-contract.md) | This handoff: status banner, why Phase 26C exists, the eight-item consumer-contract obligations a future Dixie endpoint / adapter would have to satisfy if separately authorized, an explicit non-goal block (no Dixie endpoint, no sibling-repo edit, no package-surface change, no runtime-source change, no fixture/script change, no release/tag/publish, no Finn wiring, no Hounfour adoption, no Freeside surface, no persistent state change, no SKP-005 re-claim, no successor-ADR pre-approval), the companion test reference, the validation expectations, and cross-references. |
| [`../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md`](../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md) | Phase 26C decision-lock: Status (Accepted-for-Phase-26C; Straylight-side consumer-contract record; not authorization for any Dixie endpoint or sibling-repo edit), Context (why ADR-026C exists; why a Straylight-side, in-repo decision-lock is the right shape; what the Phase 26C consumer-shaped test proves), **Decision** (§1 file set, §2 contract subject, §3 consumer-contract obligations, §4 Straylight-side obligations the contract depends on, §5 Phase 26C test invariants, §6 explicit non-goals, §7 future-ADR contract reminder), Consequences, Source files inspected. |
| [`../../tests/phase-26c-dixie-consumer-contract.test.ts`](../../tests/phase-26c-dixie-consumer-contract.test.ts) | vitest suite that simulates a Dixie-shaped consumer flow against `@loa/straylight/runtime/recall-intake`. The simulation uses the same temp-fixture-symlink pattern Phase 24H and Phase 26B already use: a temp directory acts as the consumer's package root, `node_modules/@loa/straylight` is symlinked to the repo so consumer imports flow through the real `exports` map, and small consumer `.mjs` files exercise positive + negative shapes in fresh subprocesses. The test consumes the existing Phase 26B build outputs and the existing [`../../fixtures/index.ts`](../../fixtures/index.ts) builders; it does not edit `src/`, `scripts/`, `fixtures/`, `dist/`, or `dist-types/`. |

## Consumer-contract obligations (summary)

The full obligation list lives in ADR-026C §"Decision" §3. The
summary form, for index purposes:

| # | Obligation |
|---|---|
| 3.1 | Subpath-only import. Only `'@loa/straylight/runtime/recall-intake'`. Root and `./host` are `"types"`-only and **must not** be runtime-imported. |
| 3.2 | No deep import. No `'@loa/straylight/runtime/recall-intake/handle-recall-intake'`, no `.../dixie-capability`, no `.../runtime`, no `.../host/intake`, no `.../dist/...`, no `.../src/...`, no `.../dist-types/...`. The package's `exports` map blocks all of these. |
| 3.3 | Capability mint via the public constructor. Use `createDixieCapability()`; do not synthesise objects with `{ nonce, proof }` shape. |
| 3.4 | Env-key binding. Plant `STRAYLIGHT_RUNTIME_DIXIE_KEY` in process env before calling the constructor; the constructor refuses if the key is absent or empty (fail-closed default). |
| 3.5 | Capability passed to `handleRecallIntake`. Pass as the fourth argument on every call; do not cache across env-key rotations. |
| 3.6 | No metadata-trust. The seam ignores `package_name`, `caller_identity`, `user_agent`, version strings; do not rely on a `dixie`-named wrapper package; do not rely on caller-string identity. |
| 3.7 | No cross-process replay. Do not serialise + rehydrate a capability in another process; each process mints its own capability locally with its own env-key binding. |
| 3.8 | Fail-closed handling of `denied`. Treat `runtime_seam:capability_*` as non-recoverable at the seam; recover only by minting a fresh capability via `createDixieCapability()` (which itself respects 3.4). |

The contract is **descriptive on the consumer side**: it
documents what the future consumer would have to do. It is
**enforced on the Straylight side** by the Phase 26B HMAC +
closure-private-brand gate and by the package's `exports` map.
The Phase 26C test exercises that enforcement from a
consumer-shaped flow.

## Test invariants (summary)

The full list lives in ADR-026C §"Decision" §5. Summary:

| # | Invariant |
|---|---|
| 5.a | Subpath-only import resolves and exposes exactly the §3 allowlist. |
| 5.b | Root `'@loa/straylight'` import fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`. |
| 5.c | `'@loa/straylight/host'` import fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` and `'./host'` in the error. |
| 5.d | Each named deep-import path fails to resolve. |
| 5.e | Two-part invariant. (i) Pure package-consumer proof (subprocess): with env key planted, a consumer-shaped subprocess imports `'@loa/straylight/runtime/recall-intake'` through the real `exports` map and `createDixieCapability()` succeeds. The subprocess does NOT call `handleRecallIntake`, because `EstateStore` and the dependency objects (`tenantResolver`, `intakeLog`) are intentionally not public and constructing them from a pure package consumer would require widening the package surface or adding fixtures. (ii) Full served-path proof (in-repo seam test): the vitest process itself holds the env key, builds `EstateStore` + deps via existing in-repo helpers (not part of the package surface), mints a capability through the runtime barrel, calls `handleRecallIntake(store, req, deps, capability)` against a BFF-shaped payload, and observes `outcome: 'served'`. The seam-test portion proves the runtime barrel returns `served` under the call shape a consumer would use; it does not prove a pure package consumer can independently exercise the full served path. |
| 5.f | Subprocess with env key explicitly stripped: `createDixieCapability()` throws `DixieCapabilityError`; `handleRecallIntake` is never reached. |
| 5.g | Capability minted under one env key, used after rotation, returns `outcome: 'denied'` with `runtime_seam:proof_invalid`. |
| 5.h | Capability-shape spoofing (hand-rolled `{ nonce, proof, package_name, caller_identity }`) returns `outcome: 'denied'` with `runtime_seam:capability_unrecognized`. |
| 5.i | Capability serialized in process A and rehydrated in process B fails as `runtime_seam:capability_unrecognized` (different `WeakSet` instance). |
| 5.j | The capability constructor is reachable only from `@loa/straylight/runtime/recall-intake`; no other subpath exposes it. |

## What Phase 26C explicitly does NOT do

- No Dixie endpoint of any kind. No BFF route, no service, no
  adapter, no deployment.
- No sibling-repo edit (no `loa-dixie`, no `loa-finn`, no
  `loa-hounfour`, no `loa-freeside`, no other repo).
- No Straylight package-surface change. No `package.json` /
  `exports` map / runtime allowlist edit. No new subpath. No
  new exported runtime value.
- No Straylight runtime-source change. No edit under
  [`../../src/straylight/runtime/recall-intake/`](../../src/straylight/runtime/recall-intake/),
  no edit to the HMAC + closure-private-brand mechanism, no
  edit to the env-key binding.
- No fixture or script change. No edit under
  [`../../fixtures/`](../../fixtures/) or
  [`../../scripts/`](../../scripts/).
- No `dist/` or `dist-types/` commit. The Phase 26B build
  outputs are consumed; this phase neither commits new emit
  nor regenerates emit during validation in a way that
  changes the committed-artifact baseline.
- No `.github/` workflow edit, no `.loa.config.yaml` edit,
  no `.claude/` edit, no `.beads/` edit, no `.run/` edit, no
  `grimoires/` edit.
- No tag, no Release, no PR, no comment, no package publish,
  no Hounfour dependency bump.
- No relaxation of any ADR-022E gate, of any Phase 25A / 25B /
  26A-0 / 26A-1 refusal rule, or of the operator-authority
  discipline.
- No SKP-005 re-claim. SKP-005 closure was asserted by Phase
  26B's merge under a passing pre-merge real 3-model Flatline
  pass; Phase 26C does not re-open or alter that.
- No successor-ADR pre-approval. A future ADR-026B / ADR-026D /
  successor that retires, deprecates, widens, or narrows the
  runtime subpath is not pre-authorized by Phase 26C.

## Validate locally

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
git status --short -- dist dist-types
git diff --stat
git diff --name-only
git status --short
```

Expected:

- `npm run typecheck`: clean.
- `npm test`: passes; the new `phase-26c-dixie-consumer-contract`
  suite passes; the existing `phase-26b-runtime-recall-intake`
  suite still passes; no other test changes verdict.
- `npm run build`: clean; `dist-types/` and `dist/` are
  byte-identical to the post-Phase-26B-F baseline (Phase 26C
  does not change source under `src/`, so the build produces
  the same artifacts).
- `npm pack --dry-run`: shape unchanged from the
  post-Phase-26B-F tarball — same 43 files, same allowlist,
  same package size order, no new file under `dist/` or
  `dist-types/`.
- `git status --short -- dist dist-types`: empty (no committed
  artifact in either tree changes).
- `git diff --stat` shows only the **four** Phase 26C
  files: this handoff (new), ADR-026C (new), the README
  append, and the new test file.
- `git diff --name-only` matches that four-file set, plus any
  pre-existing local dirt outside the Phase 26C scope (which
  must remain unstaged per the phase brief).

## Cross-references

- ADR-026A — runtime recall-intake subpath authorization
  ([`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md)).
- ADR-026A0 — operator-authority Flatline rule
  ([`../decisions/ADR-026A0-operator-authority-flatline-rule.md`](../decisions/ADR-026A0-operator-authority-flatline-rule.md)).
- Phase 26A-1 — threat-model amendment for the future Dixie
  recall-intake endpoint
  ([`./phase-26a1-threat-model-dixie-endpoint.md`](./phase-26a1-threat-model-dixie-endpoint.md)).
- Phase 26A-2 — runtime recall-intake subpath authorization
  handoff
  ([`./phase-26a2-runtime-recall-intake-subpath-authorization.md`](./phase-26a2-runtime-recall-intake-subpath-authorization.md)).
- Phase 26B — runtime recall-intake subpath implementation
  (PR #45) and Phase 26B-F runtime packaging hardening
  (PR #46) on `main`.
- [`./dixie-recall-mapping.md`](./dixie-recall-mapping.md) —
  the existing Phase 12 Dixie BFF / API mapping (consumed by
  Phase 26C as background; not edited).
- [`./cross-repo-implementation-order.md`](./cross-repo-implementation-order.md)
  — the Phase 15 sibling-repo implementation order, with the
  Phase 26A-2 MVP-slice narrowing already appended (consumed
  by Phase 26C as background; not edited).
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  §"Runtime subpath — `./runtime/recall-intake`" — the
  pinned package-boundary record (consumed by Phase 26C as
  background; not edited).
- [`../mvp/threat-model.md`](../mvp/threat-model.md) — the
  threat model with the Phase 26A-1 T13–T18 + T9 amendments
  (consumed by Phase 26C as background; not edited).
