# ADR-026C — Dixie recall-intake consumer contract (Phase 26C)

## Status

Accepted-for-Phase-26C.

ADR-026C is the **Phase 26C consumer-contract decision-lock** for
the runtime recall-intake subpath that ADR-026A authorized and
Phase 26B implemented. It is a **Straylight-side** decision-lock:
it pins the contract that any future Dixie endpoint / adapter
**would have to satisfy** in order to consume
`@loa/straylight/runtime/recall-intake` correctly, and it pins
the in-repo test that proves Straylight enforces the contract on
its side.

ADR-026C does **not** authorize:

- a Dixie endpoint of any kind;
- an `@loa/dixie` BFF route, handler, or service surface;
- a sibling-repo edit (no `loa-dixie`, no `loa-finn`, no
  `loa-hounfour`, no `loa-freeside`, no other repo);
- a deployment, image, container, or rollout step;
- any Straylight package-surface change (no `package.json` /
  `exports` map / `runtime` allowlist edit; no new subpath; no
  new exported runtime value);
- any Straylight runtime-source change (no edit under
  [`../../src/straylight/runtime/recall-intake/`](../../src/straylight/runtime/recall-intake/),
  no edit to the HMAC + closure-private brand mechanism);
- storage, persistence, replay, idempotency, or
  multi-instance-coordination behavior;
- Finn wiring or any movement of runtime enforcement off the
  Phase 26B Straylight seam (ADR-022E gate #9 remains held);
- Hounfour adoption (no `move_to_hounfour` flip; no schema
  publication; no class-validator swap);
- Freeside surface wiring;
- Loa framework edits (no `.claude/`, no `.loa.config.yaml`,
  no hooks);
- a tag, a release, or a package publish.

The future Dixie endpoint, if and when it ships, remains
**independently gated** by Phase 26A-1 T13–T18, ADR-022E gate
#10, and the operator-authority discipline pinned by ADR-026A0.
ADR-026C does **not** relax any of those gates and does **not**
pre-approve a successor ADR.

ADR-026C edits no prior ADR. ADR-026C does **not** edit
[`../../package.json`](../../package.json),
[`../../package-lock.json`](../../package-lock.json),
[`../../tsconfig.json`](../../tsconfig.json),
[`../../tsconfig.build.json`](../../tsconfig.build.json),
[`../../tsconfig.runtime.json`](../../tsconfig.runtime.json),
[`../../vitest.config.ts`](../../vitest.config.ts),
[`../../.npmrc`](../../.npmrc),
[`../../.gitignore`](../../.gitignore),
[`../../.loa.config.yaml`](../../.loa.config.yaml), any file
under [`../../src/`](../../src/), any file under
[`../../scripts/`](../../scripts/), any file under
[`../../fixtures/`](../../fixtures/), any committed declaration
under [`../../dist-types/`](../../dist-types/), any emitted JS
under [`../../dist/`](../../dist/),
[`../mvp/package-boundary.md`](../mvp/package-boundary.md), or
[`../mvp/threat-model.md`](../mvp/threat-model.md). It cuts no
tag, pushes no tag, publishes no package, creates no GitHub
Release, files no GitHub issue / comment / PR, bumps no
Hounfour dependency, and does not touch
[`../../.loa`](../../.loa) /
[`../../.claude/`](../../.claude/) /
[`../../.beads/`](../../.beads/) /
[`../../.run/`](../../.run/) /
[`../../.github/`](../../.github/) /
[`../../grimoires/loa/a2a/`](../../grimoires/loa/a2a/) /
`node_modules/`.

ADR-026C sits on top of ADR-026A (runtime recall-intake subpath
authorization), the Phase 26B implementation (PR #45), the Phase
26B-F runtime-packaging hardening (PR #46), ADR-026A0
(operator-authority Flatline rule), the Phase 26A-1 threat-model
amendment, ADR-025A, ADR-025B, ADR-024A through ADR-024K, ADR-022A
through ADR-022E, and ADR-020A through ADR-020E, without
modifying any of them.

## Context

### Why ADR-026C exists

Phase 26B implemented the Phase 26A-2 / ADR-026A authorization:
`@loa/straylight/runtime/recall-intake` resolves at runtime,
exposes exactly the
`{ handleRecallIntake, createDixieCapability, DixieCapabilityError }`
allowlist, and fails closed against the four ADR-026A §7
attack shapes (direct ESM import without env key, forged caller
metadata, fake "dixie"-named wrapper package, dependency-object
spoofing). The Phase 26B test suite
([`../../tests/phase-26b-runtime-recall-intake.test.ts`](../../tests/phase-26b-runtime-recall-intake.test.ts))
pins the §10.a–§10.h invariants on the Straylight side.

Phase 26B did **not** describe what a *consumer* of that subpath
would have to look like. Reviewers landing the eventual Dixie
endpoint (if and when separately authorized) need a stable,
in-repo, citable contract for the consumer shape so that:

1. the consumer cannot drift into deep-importing internal
   modules under [`../../src/`](../../src/) or
   [`../../dist/`](../../dist/) — the package's `exports` map
   already blocks that, and ADR-026C records that the contract
   *depends* on the block;
2. the consumer cannot bypass the capability gate by passing a
   structurally-shaped object, by relying on package-name or
   caller-string trust, or by re-using a serialized capability
   across processes — Phase 26B's HMAC + closure-private brand
   already blocks that, and ADR-026C records that the contract
   *depends* on the block;
3. the consumer cannot consume the wedge through any other
   subpath — root `.` and `./host` remain `"types"`-only, and
   ADR-026C records that the contract *depends* on the block;
4. the consumer cannot escape the fail-closed default by
   omitting the `STRAYLIGHT_RUNTIME_DIXIE_KEY` environment
   binding — ADR-026C records that the contract *depends* on the
   block, and the Phase 26C test exercises the fail-closed path
   from a consumer-shaped fixture.

The ADR is therefore a **consumer-contract record**, not an
authorization record. It does not widen Straylight's surface;
it documents what the *already-authorized* surface obliges a
future consumer to do.

### Why a Straylight-side, in-repo decision-lock is the right shape

A consumer contract of this kind could in principle live in the
future Dixie repository. ADR-026C explicitly chooses to record
the contract on the Straylight side, in-repo, because:

- Straylight is the wedge owner; the runtime seam is
  Straylight's seam; the fail-closed defaults are Straylight's
  defaults. The contract describes obligations *on* the consumer
  but those obligations are derived from Straylight's seam shape.
- Recording the contract in `loa-straylight` lets the Phase 26C
  test (`tests/phase-26c-dixie-consumer-contract.test.ts`)
  prove the seam upholds its end of the contract under a
  consumer-shaped flow without ever editing
  [`loa-dixie`](https://github.com/0xHoneyJar/loa-dixie). The test
  simulates a Dixie-shaped consumer using the same
  temp-fixture-symlink pattern Phase 24H and Phase 26B already
  use — the consumer's ESM imports go through the real `exports`
  map, not through a relative path.
- A future Dixie PR can cite ADR-026C as the contract its
  endpoint must satisfy without a sibling-side coordination
  round trip. The future Dixie PR remains independently
  reviewable and remains independently gated.

### What the Phase 26C consumer-shaped test proves

The test exercises a **simulated** Dixie-shaped consumer. It
does not introduce a Dixie endpoint, a Dixie adapter, a Dixie
service, or any sibling-repo coupling. The simulation is local
to this repo: a temporary directory acts as the consumer's
package root; `node_modules/@loa/straylight` is a symlink to the
repo so the consumer's `import` statements resolve through the
real `exports` map; the consumer file is a small `.mjs` that
imports the runtime barrel and exercises positive + negative
shapes; the test asserts the runtime's responses.

The Phase 26C test does **not** prove anything about a Dixie
endpoint that does not yet exist. It proves only that the
Straylight seam upholds the consumer-contract obligations
listed in §"Decision" §3 below from a consumer's perspective.

## Decision

### 1. File set

ADR-026C establishes the following file set, and only this file
set:

- **New:** this ADR
  ([`./ADR-026C-dixie-recall-intake-consumer-contract.md`](./ADR-026C-dixie-recall-intake-consumer-contract.md)).
- **New:** the companion handoff
  ([`../handoffs/phase-26c-dixie-recall-intake-consumer-contract.md`](../handoffs/phase-26c-dixie-recall-intake-consumer-contract.md)).
- **Append-only:**
  [`../handoffs/README.md`](../handoffs/README.md) — a new Phase
  26C section in chronological order, following the existing
  per-phase format.
- **New:**
  [`../../tests/phase-26c-dixie-consumer-contract.test.ts`](../../tests/phase-26c-dixie-consumer-contract.test.ts)
  — vitest suite that simulates a Dixie-shaped consumer flow
  against `@loa/straylight/runtime/recall-intake`. The test does
  not edit, add, or remove any file in
  [`../../src/`](../../src/),
  [`../../scripts/`](../../scripts/),
  [`../../fixtures/`](../../fixtures/),
  [`../../dist/`](../../dist/), or
  [`../../dist-types/`](../../dist-types/); it consumes
  pre-existing fixture builders and the Phase 26B build outputs.

No prior ADR is edited. No prior handoff is edited except the
README append above.
[`../mvp/package-boundary.md`](../mvp/package-boundary.md) is
**not** edited by ADR-026C (Phase 26B already added the runtime
subpath section).
[`../mvp/threat-model.md`](../mvp/threat-model.md) is **not**
edited by ADR-026C (Phase 26A-1 already amended it).

### 2. The contract subject

The contract describes obligations on a **future Dixie endpoint
or adapter, if separately authorized**, that consumes
`@loa/straylight/runtime/recall-intake` from the published
Straylight package.

The phrase "Dixie consumer" in this ADR refers to that future
hypothetical consumer. ADR-026C does not authorize that
consumer, and the existence of this ADR is **not** evidence the
consumer has been built, planned, or pre-approved.

### 3. Consumer-contract obligations

A future Dixie consumer of `@loa/straylight/runtime/recall-intake`
**must**:

- **3.1 — Subpath-only import.** Import only from the bare
  specifier `'@loa/straylight/runtime/recall-intake'`. The
  consumer **must not** import from `'@loa/straylight'` (root)
  or `'@loa/straylight/host'`. Both root and `./host` are
  `"types"`-only under the package's `exports` map; runtime /
  value imports of either fail to resolve with
  `ERR_PACKAGE_PATH_NOT_EXPORTED` by design (ADR-024G + ADR-026A
  §"Decision" §5). The consumer **must not** rely on a runtime
  import from either subpath being available in any future
  Straylight release without a successor expanding ADR.
- **3.2 — No deep import.** The consumer **must not** deep-import
  any internal path under `'@loa/straylight/...'`, including but
  not limited to `'@loa/straylight/runtime/recall-intake/handle-recall-intake'`,
  `'@loa/straylight/runtime/recall-intake/dixie-capability'`,
  `'@loa/straylight/runtime'`, `'@loa/straylight/host/intake'`,
  `'@loa/straylight/dist/...'`, `'@loa/straylight/src/...'`, or
  `'@loa/straylight/dist-types/...'`. The package's `exports`
  map blocks all of these by design.
- **3.3 — Capability mint via the public constructor.** The
  consumer **must** obtain its capability by calling the
  public `createDixieCapability()` constructor exported from
  `@loa/straylight/runtime/recall-intake`. The consumer **must
  not** synthesise an object with `{ nonce, proof }` shape and
  pass it as a capability. The runtime seam recognises
  capabilities by membership in a closure-private `WeakSet`;
  hand-rolled objects fail with
  `runtime_seam:capability_unrecognized`.
- **3.4 — Env-key binding.** The consumer's deployment **must**
  plant `STRAYLIGHT_RUNTIME_DIXIE_KEY` in its own process
  environment before calling `createDixieCapability()`. The
  constructor refuses (throws `DixieCapabilityError`) if the
  env key is absent or empty. The consumer **must not** treat
  the absence of the env key as a fall-back-to-allow path; the
  constructor's refusal is the load-bearing fail-closed default.
- **3.5 — Capability passed to `handleRecallIntake`.** The
  consumer **must** pass the capability through to
  `handleRecallIntake(store, req, deps, capability)` as the
  fourth argument on every call. The consumer **must not**
  cache a capability across env-key rotations: when the
  deployment-bound key rotates, prior capabilities will fail
  with `runtime_seam:proof_invalid`, and the consumer must
  re-mint.
- **3.6 — No metadata-trust.** The consumer **must not** assume
  any caller-identity field (`package_name`, `caller_identity`,
  `user_agent`, version string, etc.) carries weight at the
  runtime seam. The seam consults no caller metadata; passing
  metadata-shaped fields alongside a missing or malformed
  capability does not change the verdict. The consumer **must
  not** publish a wrapper package named `dixie` or
  `@loa/dixie` and rely on name-based trust; the seam does not
  inspect package names.
- **3.7 — No cross-process replay.** The consumer **must not**
  serialise a capability (`JSON.stringify`, structured-clone,
  RPC marshal, etc.), transmit it to another process, and
  attempt to use it there. Capabilities are recognised by
  membership in the closure-private `WeakSet` of the *issuing*
  module instance; rehydrated objects in a fresh process are
  rejected as `runtime_seam:capability_unrecognized`. Each
  process **must** mint its own capability locally with its own
  env-key binding.
- **3.8 — Fail-closed handling of `denied`.** The consumer
  **must** treat a `RecallIntakeResponse` with `outcome:
  'denied'` and a `raw_reasons` entry of the shape
  `runtime_seam:capability_*` as a non-recoverable refusal at
  the seam. The consumer **must not** re-attempt with a new
  capability synthesised out-of-band; the only valid recovery
  is to mint a fresh capability through
  `createDixieCapability()` (which itself respects §3.4).

### 4. Straylight-side obligations the contract depends on

ADR-026C does **not** add new Straylight obligations beyond
what Phase 26B already implemented and ADR-026A already
authorized. The contract in §3 depends on the following
already-pinned obligations:

- the runtime barrel exports exactly the §3 allowlist (Phase
  26B test §10.e);
- root `.` and `./host` remain `"types"`-only (Phase 26B test
  §10.a, §10.b);
- no other runtime subpath resolves (Phase 26B test §10.d);
- the capability-gate mechanism is HMAC + closure-private
  brand, with the four-attack-shape coverage in ADR-026A §7
  (Phase 26B test §10.f and the gate's module header);
- the experimental / pre-Finn / Dixie-only marker is preserved
  in the JSDoc, the emitted `.d.ts`, the README, and
  [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
  (Phase 26B test §10.g, §10.h).

If a successor ADR widens any of those, the contract in §3
must be re-checked under the wider posture.

### 5. The Phase 26C test invariants

[`../../tests/phase-26c-dixie-consumer-contract.test.ts`](../../tests/phase-26c-dixie-consumer-contract.test.ts)
**must** assert, from a temp-fixture consumer that imports the
package through `node_modules/@loa/straylight` (symlinked to
the repo so imports flow through the real `exports` map):

- **5.a — Subpath-only.** The consumer can `await
  import('@loa/straylight/runtime/recall-intake')` and observes
  exactly the §3 allowlist value-export shape.
- **5.b — Root blocked.** The consumer's `await
  import('@loa/straylight')` fails with
  `ERR_PACKAGE_PATH_NOT_EXPORTED` (or equivalent), with
  `'@loa/straylight'` in the error.
- **5.c — Host blocked.** The consumer's `await
  import('@loa/straylight/host')` fails with
  `ERR_PACKAGE_PATH_NOT_EXPORTED`, with `'./host'` in the error.
- **5.d — Deep-import blocked.** Each of
  `'@loa/straylight/runtime/recall-intake/handle-recall-intake'`,
  `'@loa/straylight/runtime/recall-intake/dixie-capability'`,
  `'@loa/straylight/runtime'`,
  `'@loa/straylight/host/intake'`,
  `'@loa/straylight/dist/src/straylight/index.js'`,
  `'@loa/straylight/src/straylight/runtime/recall-intake/index.ts'`,
  fails to resolve.
- **5.e — Positive consumer flow with env key.** The §5.e
  invariant has two parts because `EstateStore` and the
  `handleRecallIntake` dependency objects (`tenantResolver`,
  `intakeLog`) are intentionally **not** public — they are not
  in the runtime allowlist and are unreachable through the
  package's `exports` map, so a pure package consumer cannot
  construct them. (i) **Pure package-consumer proof
  (subprocess):** a consumer-shaped subprocess with
  `STRAYLIGHT_RUNTIME_DIXIE_KEY` planted in its env
  `await import`s `'@loa/straylight/runtime/recall-intake'`
  through the real `exports` map and successfully calls
  `createDixieCapability()`. The subprocess does **not** call
  `handleRecallIntake`, because building its `store` + `deps`
  arguments would require widening the public package surface
  or adding fixtures, and the phase brief forbids both.
  (ii) **Full served-path proof (in-repo seam test):** the
  vitest process itself, holding the env key, constructs an
  `EstateStore` + dependency objects via the existing in-repo
  helpers (which are not part of the package surface), mints a
  capability through the runtime barrel, calls
  `handleRecallIntake(store, req, deps, capability)` against a
  BFF-shaped recall-intake payload (request + detail_level +
  caller, the existing Phase 26B `RecallIntakeRequest` shape),
  and observes `outcome: 'served'`. The seam-test portion is
  Straylight-side — it proves the runtime barrel returns
  `served` under the call shape a consumer would use, not that
  a pure package consumer can independently exercise the full
  served path.
- **5.f — Fail-closed without env key.** A consumer-shaped
  subprocess with the env key explicitly stripped fails at
  `createDixieCapability()` with
  `DixieCapabilityError` and never reaches
  `handleRecallIntake`.
- **5.g — Fail-closed across env-key rotation.** A capability
  minted under one env key, used in a subsequent
  `handleRecallIntake` call after the env key rotates, returns
  `outcome: 'denied'` with `raw_reasons` containing
  `runtime_seam:proof_invalid`.
- **5.h — Capability-shape spoofing fails.** A consumer-shaped
  subprocess that fabricates a `{ nonce, proof }` object with
  metadata fields (`package_name`, `caller_identity`, etc.)
  and passes it to `handleRecallIntake` observes
  `outcome: 'denied'` with
  `raw_reasons: ['runtime_seam:capability_unrecognized']`.
- **5.i — Cross-process replay fails.** A capability minted in
  process A and serialised + rehydrated in process B (a fresh
  subprocess that imports the runtime barrel from the same
  package) is rejected by process B's seam as
  `runtime_seam:capability_unrecognized` because process B's
  module instance owns a different `WeakSet` than process A.
- **5.j — No capability-shape in any other subpath.** The
  consumer cannot import `createDixieCapability` from any
  subpath other than `@loa/straylight/runtime/recall-intake`
  (covered indirectly by 5.b, 5.c, 5.d — recorded explicitly
  here so the contract is not silently undone by a future
  package-surface widening).

The test consumes the existing Phase 26B build outputs under
`dist/` and `dist-types/` (already produced by `npm run build`
via the vitest globalSetup hook) and the existing
[`../../fixtures/index.ts`](../../fixtures/index.ts) builders.
The test does not add, edit, or delete any fixture file. The
test does not edit
[`../../src/`](../../src/),
[`../../scripts/`](../../scripts/), or
[`../../package.json`](../../package.json).

### 6. What ADR-026C does NOT do

This list is exhaustive within the categories named:

- **6.a — No Dixie endpoint.** ADR-026C does not author, scope,
  authorize, schedule, or pre-approve a Dixie BFF route, a
  Dixie service, a Dixie adapter, a Dixie deployment, or any
  Dixie-side code change. The future Dixie endpoint, if it
  ever ships, is independently gated by Phase 26A-1 T13–T18 +
  ADR-022E gate #10 + operator-authority discipline (ADR-026A0).
- **6.b — No sibling-repo edit.** ADR-026C does not edit
  [`loa-dixie`](https://github.com/0xHoneyJar/loa-dixie),
  [`loa-finn`](https://github.com/0xHoneyJar/loa-finn),
  [`loa-hounfour`](https://github.com/0xHoneyJar/loa-hounfour),
  [`loa-freeside`](https://github.com/0xHoneyJar/loa-freeside),
  or any other repository.
- **6.c — No package-surface change.** ADR-026C does not edit
  [`../../package.json`](../../package.json),
  [`../../package-lock.json`](../../package-lock.json), or the
  `exports` map. The runtime allowlist
  (`handleRecallIntake`, `createDixieCapability`,
  `DixieCapabilityError`, `DixieCapability` as a type) is
  unchanged. No new subpath is added; no existing subpath is
  widened or narrowed.
- **6.d — No runtime-source change.** ADR-026C does not edit
  any file under [`../../src/`](../../src/). The HMAC +
  closure-private brand mechanism is unchanged. The
  capability constructor's fail-closed default is unchanged.
- **6.e — No fixture or script change.** ADR-026C does not add,
  edit, or remove any file under
  [`../../fixtures/`](../../fixtures/) or
  [`../../scripts/`](../../scripts/). The
  [`../../fixtures/index.ts`](../../fixtures/index.ts) builders
  are consumed by the Phase 26C test in-process; the
  consumer-fixture subprocesses inline a tiny payload builder
  for the BFF-shaped request and do not require a new fixture
  directory.
- **6.f — No release / tag / publish.** ADR-026C cuts no tag,
  pushes no tag, publishes no package, creates no GitHub
  Release, files no GitHub issue or comment or PR.
- **6.g — No Finn wiring, no Hounfour adoption, no Freeside
  surface.** ADR-022E gates remain held; the Phase 25A / 25B /
  26A-0 / 26A-1 refusal rules remain binding.
- **6.h — No persistent state change.** ADR-026C does not add
  a database, a queue, a cache, a state file under
  [`../../.run/`](../../.run/), an audit log, or any persistent
  storage.
- **6.i — No SKP-005 closure.** SKP-005 closure was asserted by
  Phase 26B's merge with a passing pre-merge Flatline pass.
  ADR-026C does not re-claim, re-open, or alter that closure.
- **6.j — No successor-ADR pre-approval.** A future ADR-026B,
  ADR-026D, or other successor that retires, deprecates,
  widens, or narrows the runtime subpath is not pre-authorized
  by ADR-026C. Such a successor must follow its own
  trigger-evidence + operator-authority + Flatline path per
  ADR-026A0 §"Decision" §5.

### 7. Future-ADR contract reminder

If a future ADR cites ADR-026C as evidence of consumer
readiness, that ADR must still:

- supply its own operator-authority trigger evidence per
  ADR-026A0 §"Decision" §5;
- supply its own threat-model leg (T9 / T13–T18 amendment as
  appropriate);
- supply its own independent trigger;
- pass its own pre-merge real 3-model Flatline pass.

ADR-026C is in-repo Straylight-side scope only. It is **not**
sufficient authorization for any sibling-repo PR, any
package-surface widening, any deployment, or any successor to
ADR-026A's runtime subpath authorization.

## Consequences

- The repo gains an in-repo, citable consumer-contract record
  that a future Dixie PR can point at as the contract its
  endpoint must satisfy. The future Dixie PR remains
  independently reviewable.
- The repo gains a Phase 26C test that proves Straylight
  upholds the consumer-contract obligations from a
  consumer-shaped flow. A future regression on the runtime
  seam (e.g. accidentally widening the allowlist, breaking
  the brand check, exposing a deep-import path) fails this
  test, not a downstream consumer.
- The repo's package surface, runtime-source files, fixtures,
  scripts, dist outputs, and CI workflows are unchanged.
- No sibling repo is edited; no deployment is authorized; no
  release is cut.

## Source files inspected

- [`./ADR-026A-runtime-recall-intake-subpath.md`](./ADR-026A-runtime-recall-intake-subpath.md)
- [`./ADR-026A0-operator-authority-flatline-rule.md`](./ADR-026A0-operator-authority-flatline-rule.md)
- [`../handoffs/phase-26a1-threat-model-dixie-endpoint.md`](../handoffs/phase-26a1-threat-model-dixie-endpoint.md)
- [`../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md`](../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md)
- [`../handoffs/dixie-recall-mapping.md`](../handoffs/dixie-recall-mapping.md)
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)
- [`../mvp/threat-model.md`](../mvp/threat-model.md)
- [`../../package.json`](../../package.json)
- [`../../src/straylight/runtime/recall-intake/index.ts`](../../src/straylight/runtime/recall-intake/index.ts)
- [`../../src/straylight/runtime/recall-intake/handle-recall-intake.ts`](../../src/straylight/runtime/recall-intake/handle-recall-intake.ts)
- [`../../src/straylight/runtime/recall-intake/dixie-capability.ts`](../../src/straylight/runtime/recall-intake/dixie-capability.ts)
- [`../../tests/phase-26b-runtime-recall-intake.test.ts`](../../tests/phase-26b-runtime-recall-intake.test.ts)
- [`../../tests/phase-24h-package-exports.test.ts`](../../tests/phase-24h-package-exports.test.ts)
- [`../../tests/phase-24h-type-only-consumption.test.ts`](../../tests/phase-24h-type-only-consumption.test.ts)
