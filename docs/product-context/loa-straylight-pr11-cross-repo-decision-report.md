# Loa-Straylight Cross-Repo Decision And Verification Report

**Subject:** Current post-Phase-26E chain of authority from the original
Loa-Straylight PR #11 cross-repo handoff through the merged
`loa-dixie` Phase 26E recall-intake endpoint.

**Prepared for:** Future Loa-Straylight contributors, reviewers, and
operators who need to understand why the MVP path is now
Straylight-authorized, Dixie-implemented, and still bounded as a
pre-Finn exception.

**Current status snapshot:** 2026-05-20.

**Scope of this document:** Verification and reporting only. This
document does not implement Phase 26E, does not authorize any new
runtime surface, does not edit sibling repos, and does not change
Straylight package exports.

---

## 1. Current Executive Summary

Loa-Straylight PR #11 created the original Phase 15 cross-repo
coordination map:

```text
Hounfour -> Finn -> Dixie -> Freeside
```

That order remains the long-term architecture:

| Repo | Long-term lane |
|---|---|
| `loa-hounfour` | class/schema/conformance authority |
| `loa-finn` | eventual production runtime-enforcement owner |
| `loa-dixie` | governed recall / BFF / host-facing consumer |
| `loa-freeside` | later community/app/bot surface |
| `loa-straylight` | semantic wedge / governed continuity substrate |

The MVP now has one narrow exception:

```text
Straylight runtime recall-intake seam
  -> Dixie authorized endpoint implementation
  -> blocker-patched Phase 26E merge
  -> later Finn migration / retirement of the pre-Finn seam
```

The exception does not make Dixie semantic authority and does not make
Straylight's runtime subpath permanent. Dixie is the first bounded
consumer of a Straylight-governed recall seam. Finn remains the eventual
runtime-enforcement owner.

As of this report:

- `loa-straylight` `main` records the chain through **Phase 26D / PR
  #48**, which authorized exactly one future `loa-dixie` recall-intake
  endpoint PR.
- `loa-dixie` **Phase 26E / PR #102** is merged into `loa-dixie` `main`.
  It implements the authorized endpoint.
- The first Phase 26E implementation was blocked on **SKP-001 /
  SKP-002 / SKP-003**. The blocker-fix commit resolved all three:
  tenant-scoped store isolation, idempotency same-key atomicity, and
  pre-parse body-size enforcement.
- This Straylight-side document records verification and chain of
  authority only. It does not reimplement Phase 26E.

---

## 2. Source References

Primary Straylight records:

- Loa-Straylight PR #11 — `docs: add cross-repo handoff index`  
  https://github.com/0xHoneyJar/loa-straylight/pull/11
- Loa-Straylight PR #40 — Phase 25B Hounfour status intake  
  https://github.com/0xHoneyJar/loa-straylight/pull/40
- Loa-Straylight PR #41 — Phase 26A-0 operator authority rule  
  https://github.com/0xHoneyJar/loa-straylight/pull/41
- Loa-Straylight PR #42 — Phase 26A-1 Dixie endpoint threat model  
  https://github.com/0xHoneyJar/loa-straylight/pull/42
- Loa-Straylight PR #43 — release tagging discipline  
  https://github.com/0xHoneyJar/loa-straylight/pull/43
- Loa-Straylight PR #44 — Phase 26A-2 / ADR-026A runtime subpath authorization  
  https://github.com/0xHoneyJar/loa-straylight/pull/44
- Loa-Straylight PR #45 — Phase 26B runtime recall-intake implementation  
  https://github.com/0xHoneyJar/loa-straylight/pull/45
- Loa-Straylight PR #46 — Phase 26B-F runtime packaging hardening  
  https://github.com/0xHoneyJar/loa-straylight/pull/46
- Loa-Straylight PR #47 — Phase 26C Dixie recall-intake consumer contract  
  https://github.com/0xHoneyJar/loa-straylight/pull/47
- Loa-Straylight PR #48 — Phase 26D Dixie endpoint authorization  
  https://github.com/0xHoneyJar/loa-straylight/pull/48

Primary Dixie implementation record:

- Loa-Dixie PR #102 — Phase 26E Straylight recall-intake endpoint  
  https://github.com/0xHoneyJar/loa-dixie/pull/102

In-repo Straylight files that carry the current authority chain:

- [`../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md`](../handoffs/phase-26a2-runtime-recall-intake-subpath-authorization.md)
- [`../decisions/ADR-026A-runtime-recall-intake-subpath.md`](../decisions/ADR-026A-runtime-recall-intake-subpath.md)
- [`../handoffs/phase-26c-dixie-recall-intake-consumer-contract.md`](../handoffs/phase-26c-dixie-recall-intake-consumer-contract.md)
- [`../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md`](../decisions/ADR-026C-dixie-recall-intake-consumer-contract.md)
- [`../handoffs/phase-26d-dixie-recall-intake-endpoint-authorization.md`](../handoffs/phase-26d-dixie-recall-intake-endpoint-authorization.md)
- [`../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md`](../decisions/ADR-026D-dixie-recall-intake-endpoint-authorization.md)
- [`../handoffs/cross-repo-implementation-order.md`](../handoffs/cross-repo-implementation-order.md)
- [`../../README.md`](../../README.md)
- [`../mvp/package-boundary.md`](../mvp/package-boundary.md)

---

## 3. What PR #11 Still Means

PR #11 was the original Phase 15 cross-repo coordination packet. It
created a local Straylight index and ordering discipline for four
sibling-repo handoffs:

| Repo | Issue | Intended lane |
|---|---:|---|
| `loa-hounfour` | #70 | Schema / class-validation extraction |
| `loa-finn` | #159 | Runtime enforcement boundary |
| `loa-dixie` | #92 | Governed recall / BFF / provenance / inspection |
| `loa-freeside` | #203 | Community / app / bot surface |

PR #11 did not implement anything in Hounfour, Finn, Dixie, or
Freeside. It did not authorize runtime widening, dependency adoption,
endpoint creation, public-surface changes, or sibling-repo edits.

The clean reading remains:

```text
PR #11 created the map. It did not grant the keys.
```

Phase 26A through 26E did not erase PR #11. They narrowed it for one
MVP slice: Dixie may come before Finn only for the single
recall-intake endpoint path authorized by ADR-026D and implemented by
Dixie PR #102.

---

## 4. Straylight Authority And Contract Records

This section is the Straylight-side chain. It separates in-repo
authority and contract records from the Dixie implementation.

| Phase / PR | Record type | Current meaning |
|---|---|---|
| Phase 25B / PR #40 | Hounfour status intake | Hounfour substrate improved, but no Straylight adoption gate fired. No Hounfour dependency adoption, Challenge adoption, EstateTransition adoption, or runtime widening was authorized. |
| Phase 26A-0 / PR #41 | Operator-authority / Flatline rule | Established stable in-repo operator-authority evidence and resolved the original Flatline SKP-001 from the Phase 26A planning path. It did not authorize runtime work. |
| Phase 26A-1 / PR #42 | Threat-model prerequisites | Recorded T13-T18 and the T9 persistence-posture amendment for a future Dixie endpoint. It captured resource exhaustion, replay, concurrency, ingress, tenant, and persistence prerequisites. It did not authorize the endpoint. |
| PR #43 | Release tagging discipline | Disabled accidental automatic post-merge release tagging. Straylight release-consumption tags must be explicit and phase/ADR-authorized. |
| Phase 26A-2 / PR #44 | ADR-026A authorization | Authorized one future Straylight runtime subpath: `@loa/straylight/runtime/recall-intake`. It did not implement the subpath and did not authorize a Dixie endpoint. |
| Phase 26B / PR #45 | Straylight implementation | Implemented the authorized runtime subpath. Root `@loa/straylight` and `@loa/straylight/host` stayed `"types"`-only. |
| Phase 26B-F / PR #46 | Runtime packaging hardening | Hardened the Phase 26B runtime packaging notes, including cross-process capability replay and env-key rotation behavior. |
| Phase 26C / PR #47 | Consumer contract | Pinned what a future Dixie consumer must do to consume `@loa/straylight/runtime/recall-intake` correctly. It did not authorize a Dixie endpoint. |
| Phase 26D / PR #48 | Endpoint authorization | Authorized exactly one future sibling-repo PR in `loa-dixie` to add one recall-intake endpoint/adapter consuming the Straylight runtime subpath under ADR-026A and ADR-026C. It did not implement the endpoint. |

### 4.1 Phase 26B Runtime Surface

Phase 26B changed Straylight from purely type-only consumption to a
narrow, explicitly marked runtime exception:

```text
@loa/straylight/runtime/recall-intake
```

The runtime barrel exports exactly:

```text
handleRecallIntake
createDixieCapability
DixieCapabilityError
DixieCapability (type re-export)
```

It does not export broad wedge runtime values such as `executeRecall`,
`EstateStore`, `AuditLog`, `JsonlStorage`, `dispositionFor`,
`verifyChain`, `computeCommitmentRoot`, `validateRecallRequest`,
`evaluateCompetence`, `InMemoryStorage`, or
`createInMemoryRecallIntakeDeps`.

The concrete non-Dixie refusal mechanism is the Phase 26B HMAC +
closure-private brand gate bound to `STRAYLIGHT_RUNTIME_DIXIE_KEY`.
Callers mint capabilities through `createDixieCapability()` and pass
the capability as the fourth argument to `handleRecallIntake`. The gate
fails closed without the env key, with a spoofed object, across
env-key rotation, and across process serialization / rehydration.

### 4.2 Phase 26C Consumer Contract

Phase 26C records the obligations a future Dixie endpoint must satisfy:

- import only from `@loa/straylight/runtime/recall-intake`;
- do not deep-import Straylight internals;
- mint via `createDixieCapability()`;
- plant `STRAYLIGHT_RUNTIME_DIXIE_KEY` before minting;
- pass the capability to `handleRecallIntake`;
- do not trust metadata or package names as caller identity;
- do not serialize capabilities across processes;
- treat `runtime_seam:capability_*` denials as fail-closed seam
  refusals.

Phase 26C is a Straylight-side consumer-contract record. It proves
Straylight upholds its side through a consumer-shaped test, but it does
not implement or authorize a Dixie endpoint.

### 4.3 Phase 26D Endpoint Authorization

Phase 26D authorized exactly one future sibling-repo PR in `loa-dixie`
to add one recall-intake endpoint/adapter.

The authorization required the Dixie PR to:

- consume only `@loa/straylight/runtime/recall-intake`;
- use `createDixieCapability`, `handleRecallIntake`, and
  `DixieCapabilityError`;
- bind `STRAYLIGHT_RUNTIME_DIXIE_KEY`;
- satisfy ADR-026C consumer obligations;
- resolve or gate Phase 26A-1 endpoint prerequisites:
  body-size/resource controls, replay/idempotency semantics,
  concurrency / multi-instance posture, ingress validation,
  authoritative tenant resolution, and bounded persistence posture;
- ship tests for those behaviors before merge.

Phase 26D did not edit Dixie. It was the Straylight-side authorization
record that Dixie PR #102 later consumed.

---

## 5. Dixie Phase 26E Implementation

This section describes the sibling-repo implementation. It is not a
Straylight code change.

`loa-dixie` PR #102, **Implement Phase 26E Straylight recall-intake
endpoint**, is closed and merged. GitHub metadata inspected for this
report records:

| Field | Value |
|---|---|
| Repository | `0xHoneyJar/loa-dixie` |
| PR | #102 |
| State | closed / merged |
| Merged at | 2026-05-20 09:30:47 UTC |
| Merge commit | `f6ed3a6860843b63d38f25d8408bb8d24c39fe14` |
| Final head | `11864c094c9488978ae1b7c4981240f6ddab566e` |
| Changed files | 20 |

The PR body records that Dixie:

- bumped `@loa/straylight` to exact commit
  `00b17e586687ea199fef88837cf1a9407cd78ece`, the Straylight
  `main` commit that includes Phase 26D;
- added a conditional `POST /api/recall/intake` route;
- gated the route behind `DIXIE_RECALL_INTAKE_ENABLED=true`;
- required `STRAYLIGHT_RUNTIME_DIXIE_KEY` when enabled;
- imported Straylight runtime values only from
  `@loa/straylight/runtime/recall-intake`;
- minted capabilities through `createDixieCapability`;
- called `handleRecallIntake`;
- rejected cross-tenant body / caller / estate mismatches;
- enforced endpoint-local body, rate, store, idempotency, and
  concurrency guardrails;
- added unit and integration tests for the endpoint and guardrails.

Dixie PR #102 explicitly did not:

- edit `loa-straylight`;
- change Straylight package exports;
- add a new Straylight runtime subpath;
- change the Phase 26B HMAC/refusal mechanism;
- wire Finn, Hounfour adoption, or Freeside;
- add broad persistent recall storage;
- create tags, releases, or package publishing;
- claim production recall data is wired.

The bounded store in Dixie is an endpoint guardrail and consumer-contract
adapter. It is not production persistent assertion storage. ADR-022E
gate #8 remains held for real persistent assertion storage.

---

## 6. Post-Patch Blocker Verification

The first Phase 26E implementation was reviewed and blocked on three
blockers:

| Blocker | Issue | Patch resolution |
|---|---|---|
| SKP-001 | Tenant-scoped store isolation / shared `activeTenant` race | Replaced shared `activeTenant` state with tenant-scoped `BoundedEstateStore` views via `forTenant(...)`; foreign estate reads fail closed and foreign writes throw `BoundedStoreScopeViolationError`. |
| SKP-002 | Idempotency same-key atomicity / in-flight dedupe | Added in-flight `runOnce(...)` idempotency guard so concurrent same-key requests execute once and replay the same settled response. |
| SKP-003 | Body cap before JSON parse | Added streaming `readBodyWithCap(...)` so oversized no-`Content-Length` / chunked-style bodies are rejected before `JSON.parse`. |

The PR's post-patch blocker review recorded:

```text
SKP-001 -- RESOLVED
SKP-002 -- RESOLVED
SKP-003 -- RESOLVED
```

The blocker-fix validation recorded on Dixie PR #102:

```text
npm run typecheck -- clean
npm test          -- 2598 passed, 22 skipped, 0 failed
npm run build    -- clean
```

This satisfies the Phase 26E blocker-focused verification recorded in
the sibling PR. It does not create any new Straylight authorization.

---

## 7. Unresolved Tooling And Substrate Follow-Ups

The endpoint blockers above are resolved. The remaining items are
tooling, substrate, or non-blocking follow-ups and should not be
confused with unresolved Phase 26E endpoint blockers.

### 7.1 Flatline / Bridgebuilder substrate degradation

The post-patch PR comment records that the original 3-model
Flatline/Bridgebuilder gate could not complete cleanly because the
local Gemini/headless substrate was degraded. A 2-model Flatline found
the blockers, and the patch was reviewed blocker-by-blocker.

Follow-up:

```text
Track the degraded local Gemini/headless Flatline/Bridgebuilder
substrate separately from the Phase 26E endpoint implementation.
```

This is a process/tooling follow-up, not a reason to reimplement Phase
26E in Straylight.

### 7.2 Non-blocking Dixie follow-up candidates

Dixie PR #102 review comments also named non-blocking follow-ups:

- add a structural-conformance drift test between Dixie's
  `MinimalRecallStore` / bounded store surface and the live Straylight
  `EstateStore` surface on the next Straylight bump;
- preserve or document the intentional rate-limit-before-idempotency
  ordering so replay cannot bypass rate limits;
- remove or comment the unused `config.straylightRuntimeDixieKey`
  field if Dixie keeps reading the env directly through Straylight's
  capability constructor;
- keep real persistent assertion storage deferred behind ADR-022E gate
  #8 / a future storage phase.

None of those follow-ups widens Straylight's package surface or changes
the Phase 26B runtime seam.

---

## 8. What Remains True After Phase 26E

### 8.1 Straylight authority remains bounded

Straylight currently authorizes and implements only one runtime
exception:

```text
@loa/straylight/runtime/recall-intake
```

Root `@loa/straylight` and `@loa/straylight/host` remain type-only.
No broad runtime export is authorized.

### 8.2 Dixie has implementation, not semantic ownership

Dixie now implements the authorized endpoint. That means Dixie can
consume governed recall through the Straylight runtime seam.

Dixie still must not:

- become semantic authority;
- produce policy decisions;
- bypass Straylight/Finn policy;
- turn generic retrieval into governed recall;
- serve recall without receipts / denial reasons;
- claim production persistence has shipped;
- expand to other Phase 24E surfaces without separate authorization.

### 8.3 Finn remains the eventual runtime owner

The runtime subpath remains:

```text
experimental
pre-Finn
Dixie-only
not permanent
```

When ADR-022E gate #9 fires, a successor ADR must move runtime
enforcement to Finn, deprecate `@loa/straylight/runtime/recall-intake`
with a concrete window, retire the subpath, and restore Straylight to
its full type-only posture.

### 8.4 Hounfour and Freeside lanes remain unchanged

Hounfour remains schema/class/conformance authority. Phase 26E does not
authorize Hounfour adoption, dependency changes, Challenge adoption,
EstateTransition adoption, or canonicalization changes in Straylight.

Freeside remains downstream. Phase 26E does not authorize Discord,
Telegram, REST, NATS, community/admin, or bot-surface wiring.

---

## 9. Refusal Rules For Future Reviewers

Future PRs must not cite the Phase 26 chain as broader authorization
than it provides.

### PR #11 cannot be cited for

- sibling implementation;
- Hounfour adoption;
- Finn wiring;
- Dixie endpoint implementation by itself;
- Freeside wiring;
- runtime widening;
- package-surface changes;
- public anchor / onchain behavior.

### PR #44 / ADR-026A cannot be cited for

- any runtime subpath other than `@loa/straylight/runtime/recall-intake`;
- a Dixie endpoint;
- broad runtime exports;
- moving semantics to Dixie;
- skipping Finn migration;
- tags, releases, or package publishing.

### PR #45 / Phase 26B cannot be cited for

- adding more runtime exports;
- adding another runtime subpath;
- runtime-importing root `@loa/straylight` or `@loa/straylight/host`;
- weakening the HMAC + closure-private brand gate;
- converting the pre-Finn seam into a permanent owner.

### PR #47 / ADR-026C cannot be cited for

- endpoint authorization;
- sibling-repo edits;
- storage, replay, idempotency, or multi-instance behavior in Dixie;
- deployment authorization;
- widening the Straylight surface.

### PR #48 / ADR-026D cannot be cited for

- any Dixie endpoint other than recall-intake;
- any Phase 24E surface other than recall intake / response;
- Straylight package-surface changes;
- new Straylight runtime subpaths;
- Finn, Hounfour, Freeside, or Loa framework edits;
- production storage beyond endpoint-local guardrails;
- tags, releases, or package publishing.

### Dixie PR #102 cannot be cited for

- editing Straylight;
- claiming Straylight Phase 26E source changes exist;
- granting Dixie semantic authority;
- adding more Dixie surfaces;
- firing ADR-022E gate #8 or gate #9;
- satisfying the degraded Flatline/Bridgebuilder substrate follow-up.

---

## 10. Current Clean Mental Model

The current MVP proof path is:

```text
Straylight defines the semantic wedge.
Straylight exposes one experimental pre-Finn runtime seam.
Straylight records the Dixie consumer contract and endpoint authorization.
Dixie implements the one authorized recall-intake endpoint.
Dixie blocker fixes close the Phase 26E endpoint blockers.
Finn later absorbs production runtime enforcement.
Freeside remains later.
```

The MVP is not generic agent memory. It is:

```text
Can an agent inherit and use memory only through the currently admissible
frontier produced by governed transitions over an actor estate?
```

Phase 26E moves that proof forward by giving Dixie a merged,
guardrailed endpoint that consumes Straylight's authorized runtime seam.
It does not change the long-term role assignment.

---

## 11. One-Sentence Conclusion

PR #11 opened the cross-repo map; Phase 26A through 26D created and
bounded the Straylight authority chain; Dixie PR #102 has now merged
the authorized Phase 26E endpoint after resolving SKP-001, SKP-002, and
SKP-003; the remaining work is tooling/substrate follow-up and future
Finn/storage migration, not a Straylight-side reimplementation of
Phase 26E.
