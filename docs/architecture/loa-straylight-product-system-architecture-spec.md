# Loa-Straylight Deep Product + System Architecture Spec

_Status: engineering-facing product + system architecture spec._  
_Source doctrine: `Loa Straylight Readme.md` and `straylight-product-doctrine.md`._  
_Source evidence: `straylight-8-cluster-handoff-synthesis.md`, `straylight-repo-code-verification-backlog.md`, `straylight-repo-verification-report.md`, `straylight-to-loa-stack-responsibility-map.md`, `straylight-mvp-wedge.md`, `tech-stack-freeze.md`, and uploaded Loa repo zips._

## 0. Source hierarchy, confidence labels, and reading rules

### 0.1 Source hierarchy

This spec uses a strict hierarchy:

1. **Doctrine source of truth:** `Loa Straylight Readme.md` and `straylight-product-doctrine.md`.
2. **Pre-spec synthesis:** `straylight-8-cluster-handoff-synthesis.md`.
3. **Verification evidence:** `straylight-repo-code-verification-backlog.md`, `straylight-repo-verification-report.md`, `straylight-to-loa-stack-responsibility-map.md`, `tech-stack-freeze.md`, and uploaded Loa repo zips.
4. **MVP constraint artifact:** `straylight-mvp-wedge.md`.

Research handoffs and packet synthesis stress-test the doctrine. They do **not** redefine Straylight. Repo verification evidence defines what currently exists. It does **not** by itself assign Straylight primitive ownership.

### 0.2 Confidence labels used in this spec

| Label | Meaning |
|---|---|
| **Doctrine** | Required by README/doctrine. This is normative for Straylight. |
| **Confirmed current stack fact** | Verified in `straylight-repo-verification-report.md` or directly visible in uploaded repo code/docs. |
| **Partially confirmed substrate** | Adjacent capability exists, but it does not yet implement Straylight semantics. |
| **Recommendation** | Architecture decision proposed by this spec. It should be reviewed and implemented deliberately. |
| **Assumption** | Required to make the design coherent, but not yet verified or finalized. |
| **Open question** | Must be resolved before, during, or after MVP implementation depending on priority. |

### 0.3 Normative keywords

- **MUST** means required for Straylight correctness.
- **SHOULD** means recommended unless there is a specific engineering reason not to.
- **MAY** means optional.
- **MUST NOT** marks anti-collapse guardrails.

### 0.4 Core constraint

Loa-Straylight must be built **on top of the current Loa stack**. It must not replace the current repos, languages, deployment model, model-provider stack, bot surfaces, or workflow rail. The implementation should add a Straylight semantic/control-plane layer and thin integration surfaces where the current stack already has adjacent capabilities.

---

# 1. Executive summary

## 1.1 What Straylight is

Loa-Straylight is a governed continuity layer for persistent AI agents. It gives an actor a persistent **estate**: a state-of-record that exists before any session, outlives any session, and can only be read from or written to through signed, typed, validated, policy-authorized transitions.

Straylight is not memory storage. It is not RAG. It is not vector search. It is not long context. It is not a planning framework. It is not reflection. It is not a chatbot memory plugin. Those systems may exist underneath or beside Straylight, but they are not the primitive.

The primitive is:

```text
actor → estate → assertions → governed transitions → recall / action / challenge / revocation / commitment / audit
```

## 1.2 Why it exists

Persistent agents fail when they collapse everything they have ever seen, inferred, remembered, retrieved, or done into one undifferentiated memory substrate. If memory automatically becomes belief, and belief automatically becomes instruction, and instruction automatically becomes action, the agent is not continuous. It is contaminated.

Straylight separates the force chain:

```text
observation
  → memory
  → belief
  → instruction
  → plan
  → permission
  → action
  → commitment
  → permanence
```

Each promotion or demotion across that chain must be explicit, inspectable, authorized, and auditable.

## 1.3 What the target system adds

The target system adds first-class primitives for:

- actor estates;
- signed assertions;
- assertion classes and statuses;
- class validation;
- policy validation;
- keyring / signer competence;
- estate verbs: `admit`, `classify`, `link`, `challenge`, `inherit`, `forget`, `recall`;
- governed recall packs;
- challenge, demotion, revocation, forgetting, and appeal;
- audit receipts;
- optional hidden-estate / public-anchor commitments;
- feedback/evaluation as governed outcome-to-estate mutation.

## 1.4 What current Loa stack already provides

The uploaded repos provide strong substrate:

| Repo/system | Confirmed current role | Straylight interpretation |
|---|---|---|
| `loa` | Claude Code / agent-driven development framework with planning, review, audit, eval, provider adapters, project memory, and workflow audit/WAL-adjacent surfaces. | Workflow/spec/eval rail. Not estate runtime. |
| `loa-hounfour` | TypeBox / JSON Schema / constraint / governance protocol library with adjacent schemas for identity, lifecycle, audit, dispute, sanction, delegation, tool-call, permission-boundary, and state-machine material. | Schema/protocol/class-validation candidate. Missing exact Straylight schemas. |
| `loa-finn` | Runtime, model routing, tool/sandbox execution, WAL/event streams, audit, JWT/HMAC/auth, budgets/rate limits, circuit breakers, tracing, S3-anchor-adjacent audit, dNFT/persona modules. | Runtime/model-routing/action-gateway/audit candidate. Missing governed recall over actor estates. |
| `loa-dixie` | Governed BFF with soul memory, memory auth/context injection, mutation logs, hash-chained audit, outbox, NFT transfer handling, and TBA auth surfaces. | Recall/control-plane/BFF/provenance candidate. Missing Straylight `RecallPack` semantics. |
| `loa-freeside` | Multi-tenant Discord/Telegram/REST community infra with NATS, RLS tenant context, governed mutation service, hash-chained audit, budgets, model routing, admin/bot surfaces. | Community/bot/operator surface candidate. Must consume Straylight primitives, not define them. |

No uploaded repo currently proves complete Straylight primitive ownership. The stack should be extended, not renamed.

## 1.5 MVP recommendation

The first implementation wedge is **Straylight Recall Wedge**:

> Governed recall over a signed actor estate.

It proves continuity-under-authorization without building the full future system. It creates one actor estate, admits signed typed assertions, validates classes, checks policy, applies keyring competence, supports challenge/revocation/forgetting, generates governed recall packs, emits receipts, and optionally computes commitment roots.

The MVP success condition is not “the agent gives a good answer.” The success condition is:

> The system can prove which estate material was allowed to matter, which material was excluded, and why.

---

# 2. Problem statement

## 2.1 The core product problem

Most agent memory systems still behave as retrieval systems:

1. store messages or documents;
2. embed them;
3. retrieve similar chunks;
4. paste retrieved context into the next prompt.

This solves recall convenience. It does not solve continuity.

Persistent agents need to know what they are allowed to treat as fact, belief, instruction, permission, action basis, commitment, or permanent record. Generic retrieval cannot answer that. Similarity is not authority. Recency is not authority. A model summary is not authority. A user message is not automatically authority. A wallet signature is not automatically authority for every transition.

## 2.2 Failure modes Straylight must prevent

### 2.2.1 Memory contamination

Observed facts, inferred beliefs, reflections, identity impressions, relationship judgments, and behavioral policies get stored as one blob. Later, the agent treats interpretation as fact.

Example failure:

```text
Observed: "Bob asked for elevated Discord permissions before GitHub verification."
Bad inferred memory: "Bob is suspicious."
Bad future behavior: agent denies Bob future access or flags him as risky without evidence boundary.
```

Straylight fix: represent both as separate assertions with class, provenance, confidence/status, signer, and recall policy.

### 2.2.2 RAG-as-authority

A semantically similar but revoked, stale, private, or challenged assertion gets retrieved and placed into context.

Straylight fix: recall must filter by status, provenance, scope, privacy, risk, and authorization before context assembly.

### 2.2.3 Reflection becomes policy

A model reflection quietly becomes a behavioral instruction.

Straylight fix: reflection enters as a derived assertion. Promotion from reflection to identity, policy, permission, or action basis requires explicit transition and competent signer.

### 2.2.4 Tool outputs become instructions

External webpages, Discord messages, GitHub issues, API payloads, or tool outputs contain prompt-injection-like instructions and the agent treats them as governing instructions.

Straylight fix: tool output is an observation assertion. It cannot become instruction or permission without a governed transition.

### 2.2.5 Correct final answer, unsafe path

The final answer looks correct, but the path used private context, stale context, revoked permissions, excessive spend, or unsafe tool calls.

Straylight fix: recall receipts, runtime traces, policy decisions, model/tool provenance, and audit trails link the answer to the estate material and transitions used.

### 2.2.6 Cross-tenant leakage

Community A’s memory, permissions, or relationship records affect Community B.

Straylight fix: every assertion and recall request is scoped by actor, estate, tenant/community, environment frame, permission scope, and risk profile.

### 2.2.7 Ownership transfer leaks private estate state

A dNFT or agent identity transfers, and private memory either leaks to the new controller or remains usable by the old controller.

Straylight fix: inheritance, transfer, revocation, sealed retention, and previous-owner access are explicit estate transitions governed by keyring policy and audit.

---

# 3. Product thesis

## 3.1 Doctrine thesis

The future of agent memory is not bigger context. The future is governed continuity.

Loa-Straylight is the hidden estate architecture that makes persistent agents governable. It gives an agentic actor a state-of-record and forces every durable read/write/promotion/demotion through explicit primitive transitions.

## 3.2 Product category

Recommended category:

> **Governed estate control plane for persistent agent continuity.**

Alternative framing:

> **Continuity-under-authorization infrastructure for intent-era agents.**

This category matters because Straylight is not competing with vector databases, RAG pipelines, long-context models, chatbot memory, planning frameworks, or reflection loops. It governs whether and how their outputs may enter, mutate, or read the actor estate.

## 3.3 Product promise

For a persistent actor, Straylight answers:

- What assertions exist in the actor estate?
- Which assertions are active, contested, demoted, revoked, forgotten from recall, sealed, or superseded?
- Who signed them?
- Who was competent to sign them?
- What policy allowed or denied the transition?
- What can be recalled for this task, environment, and risk profile?
- What was excluded, redacted, or marked?
- Which transitions changed forward authority without rewriting history?
- Which commitments or receipts prove the state changed?

## 3.4 Product wedge

The first wedge is not autonomous agents. It is not dNFT marketplace. It is not social bots. It is not a full UI platform.

The first wedge is:

> A governed recall pack generated from signed actor-estate assertions with validation, policy, signer competence, status filtering, challenge/revocation awareness, and audit receipt output.

---

# 4. Non-goals

## 4.1 Product non-goals

Loa-Straylight must not become:

- chatbot memory plugin;
- generic RAG system;
- vector search layer;
- long-context prompt stuffing strategy;
- planning framework;
- reflection loop;
- tool history store;
- generic knowledge base;
- generic agent runtime;
- API wrapper around LLM providers;
- onchain memory storage system;
- ungoverned memory graph;
- automatic personalization layer;
- simple audit log;
- memory-type taxonomy without transition governance;
- full autonomous social-agent framework;
- full dNFT marketplace;
- full community UI platform.

## 4.2 Engineering non-goals for v1/MVP

MVP must not require:

- full graph memory;
- full vector store buildout;
- complete bitemporal UI;
- full public anchor protocol;
- full onchain settlement;
- full encryption/key custody implementation;
- full wallet/smart-account implementation;
- production dNFT transfer flow;
- full Freeside UI integration;
- full Discord/Telegram bot behavior changes;
- new model-provider stack;
- replacing existing Loa repos.

## 4.3 Anti-collapse rules

The implementation MUST NOT:

- call Loa project memory a Straylight estate;
- call Dixie soul memory a Straylight estate unless wrapped in assertion/status/policy semantics;
- call Finn audit logs Straylight receipts unless they record estate transitions and recall decisions;
- call Hounfour schemas Straylight schemas until exact Straylight object models exist;
- call Freeside tenant/community data Straylight estates until actor estate boundaries are implemented;
- let model output become authority;
- let schema validation substitute for policy validation;
- let signatures substitute for signer competence;
- let revocation become a UI label while still influencing recall;
- let public anchors reveal hidden estate contents.

---

# 5. Current-state architecture

## 5.1 Current stack overview

```text
+--------------------------------------------------------------------------------+
|                                      loa                                       |
|       Claude Code workflow / planning / review / eval / local memory rail      |
+--------------------------------------------------------------------------------+
        |                       |                          |
        v                       v                          v
+-------------------+   +--------------------+    +-----------------------------+
|   loa-hounfour    |   |      loa-finn      |    |          loa-dixie          |
| TypeBox / schemas |   | runtime / routing  |    | governed BFF / memory APIs  |
| constraints       |   | tools / WAL / audit|    | context / auth / audit      |
+-------------------+   +--------------------+    +-----------------------------+
             \               |                         /
              \              |                        /
               v             v                       v
              +------------------------------------------------+
              |                loa-freeside                    |
              | Discord / Telegram / REST / NATS / tenants     |
              | budgets / admin / community surfaces           |
              +------------------------------------------------+
```

## 5.2 Confirmed current stack facts

### `loa`

**Confirmed current stack fact:** `loa` is an agent-driven development framework with planning, review, audit, eval, persistent project memory, provider adapters, and workflow-oriented gates.

**Straylight interpretation:** workflow/spec/eval rail. It should not be treated as estate runtime.

**Existing evidence paths:**

- `loa-main/README.md`
- `loa-main/.claude/commands/{plan,review,audit,eval,gpt-review}.md`
- `loa-main/.claude/schemas/`
- `loa-main/.claude/protocols/{memory,structured-memory,trajectory-evaluation}.md`
- `loa-main/.claude/hooks/memory-inject.sh`
- `loa-main/.claude/hooks/memory-writer.sh`
- `loa-main/.claude/lib/persistence/wal/`
- `loa-main/.claude/lib/security/audit-logger.ts`
- `loa-main/.claude/adapters/loa_cheval/providers/`
- `loa-main/grimoires/`

### `loa-hounfour`

**Confirmed current stack fact:** `loa-hounfour` is a TypeBox / JSON Schema / constraint / governance protocol library with adjacent identity, lifecycle, capability, tool-call, audit, dispute, sanction, delegation, permission-boundary, state-machine, and hash/checkpoint material.

**Straylight interpretation:** schema/protocol/class-validation candidate.

**Current verified gap:** no canonical Straylight `ActorEstate`, `Assertion`, `SignedAssertion`, `RecallRequest`, `RecallPack`, `RecallReceipt`, `Keyring`, or exact Straylight class-validation/policy-validation split.

### `loa-finn`

**Confirmed current stack fact:** `loa-finn` is the strongest runtime substrate: model routing, tool/sandbox execution, gateway routes, WAL/event streams, audit, JWT/HMAC/auth, budgets/rate limits, circuit breakers, tracing, S3-anchor-adjacent audit, and dNFT/persona modules.

**Straylight interpretation:** runtime/model-routing/action-gateway/audit execution candidate.

**Current verified gap:** does not already implement governed recall over actor estates.

### `loa-dixie`

**Confirmed current stack fact:** `loa-dixie` has governed BFF, soul-memory/event-sourced memory, memory auth/context injection, freshness/context enrichment, mutation logs, hash-chained audit trail, outbox, NFT transfer handling, and TBA auth surfaces.

**Straylight interpretation:** recall/control-plane/BFF/provenance candidate.

**Current verified gap:** does not already implement Straylight `RecallPack` / `RecallReceipt` semantics.

### `loa-freeside`

**Confirmed current stack fact:** `loa-freeside` has multi-tenant community infra, Discord/Telegram/REST surfaces, NATS schema governance, worker consumers, RLS tenant context, governed mutation service, hash-chained audit service, budget/model routing, and Hounfour dependency.

**Straylight interpretation:** community/bot/operator surface candidate.

**Current verified gap:** does not already implement actor estates or Straylight transition semantics.

## 5.3 Current languages/frameworks

**Confirmed from uploaded repo manifests and file layout:**

| Area | Current verified / visible tech |
|---|---|
| Main service language | TypeScript / Node.js across Hounfour, Finn, Dixie, Freeside worker/ingestor surfaces. |
| Runtime APIs | Hono appears in Finn and Dixie; Express appears in Freeside root dependency; REST/gateway routes exist. |
| Schema layer | TypeBox and generated JSON Schema in Hounfour; Zod appears in Finn/Dixie. |
| Database / ORM | Drizzle appears in Finn; Freeside has Drizzle/migrations; Dixie has SQL migrations. |
| Events | NATS surfaces in Freeside and Dixie. |
| Tracing | OpenTelemetry visible in Finn/Dixie surfaces. |
| Chain/wallet interaction | `viem` visible in Finn/Dixie; signature verification surfaces exist in Freeside. |
| Workflow tooling | Claude Code / Loa `.claude` commands, Python adapters, provider adapters. |
| Rust | Freeside gateway includes Cargo/Rust surfaces. Hounfour includes vector runners in Go/Rust. |
| DevOps | Dockerfiles and Terraform exist in Finn, Dixie, Freeside; Freeside has substantial Terraform infra. |

## 5.4 Current storage/event/audit substrate

Current stack includes raw material:

- WAL and local audit-adjacent surfaces in `loa`.
- WAL/event/audit/persistence surfaces in `loa-finn`.
- mutation logs, audit trail, outbox, memory/context data in `loa-dixie`.
- tenant-scoped storage/migrations, NATS events, governed mutation service, hash-chained audit in `loa-freeside`.
- audit/checkpoint/hash schema material in `loa-hounfour`.

Current stack does **not** yet include a unified Straylight estate/assertion/receipt store.

## 5.5 Current model/provider layer

Current stack has provider adapters and routing surfaces across Loa/Finn/Freeside. Providers are invocation/provenance infrastructure only. A model response is never authority over estate state.

---

# 6. Target-state architecture

## 6.1 Target-state thesis

Target Straylight is a thin semantic/control-plane layer over the current Loa stack. It does not replace existing repos. It gives them a shared primitive vocabulary and enforcement flow.

```text
                          +-----------------------------+
                          |   Straylight semantic layer  |
                          | doctrine + primitives + APIs |
                          +---------------+-------------+
                                          |
         +--------------------------------+--------------------------------+
         |                                |                                |
         v                                v                                v
+------------------+           +------------------+             +------------------+
|  loa-hounfour    |           |    loa-finn      |             |    loa-dixie     |
| schemas/contracts|<--------->| runtime/enforce  |<----------->| recall/BFF/API   |
| class validation |           | audit/receipts   |             | provenance/query |
+------------------+           +------------------+             +------------------+
         ^                                ^                                ^
         |                                |                                |
         +---------------+----------------+----------------+---------------+
                         |                                 |
                         v                                 v
              +--------------------+             +---------------------+
              |   loa-freeside     |             |         loa         |
              | bot/community UX   |             | workflow/eval gate  |
              | tenant/event input |             | spec/review rail    |
              +--------------------+             +---------------------+
```

## 6.2 Required target components

### 6.2.1 Straylight semantic/control-plane layer

**Recommendation:** create a thin Straylight semantic module/package/repo. Name options:

- `loa-straylight` repo;
- `@0xhoneyjar/loa-straylight` package;
- `packages/straylight-core` inside an existing repo;
- `src/straylight/` namespace split across Hounfour/Finn/Dixie, with a formal compatibility contract.

**Preferred recommendation:** create a dedicated `loa-straylight` repo or package to own semantics, documentation, ADRs, compatibility contracts, and conformance fixtures, while implementation lives in current repos.

Reason: the responsibility map and tech freeze both show no current repo proves full Straylight primitive ownership. If Hounfour, Finn, Dixie, or Freeside silently becomes semantic owner, the architecture will confuse substrate with doctrine.

The semantic layer MUST define:

- primitive names and invariants;
- canonical state machine diagrams;
- conformance vectors;
- protocol compatibility versions;
- cross-repo integration requirements;
- source hierarchy rules;
- anti-collapse guardrails.

### 6.2.2 Hounfour Straylight schema namespace

**Recommendation:** add `loa-hounfour/src/straylight/` or equivalent package namespace containing schemas and validators for:

- `Actor`
- `ActorEstate`
- `Assertion`
- `SignedAssertion`
- `AssertionClass`
- `AssertionStatus`
- `ProvenanceRef`
- `SignatureEnvelope`
- `Keyring`
- `SignerCompetenceRule`
- `PolicyDecision`
- `Transition`
- `Challenge`
- `Demotion`
- `Revocation`
- `ForgetRecord`
- `RecallRequest`
- `RecallPack`
- `RecallReceipt`
- `AuditEvent`
- `CommitmentRoot`
- `PublicAnchorRecord`
- `FeedbackSignal`
- `EvaluationResult`

Hounfour should own class validation and schema conformance. It should not own runtime policy enforcement by itself.

### 6.2.3 Finn runtime enforcement module

**Recommendation:** add `loa-finn/src/straylight/` module for:

- policy evaluation execution;
- keyring/signer competence checks;
- transition enforcement;
- recall invocation and trace preservation;
- memory mutation as high-risk action;
- action gateway integration;
- audit receipt emission;
- model/tool/provider trace capture;
- optional commitment-root computation or handoff to commitment adapter.

Finn should fail closed when class validation or policy validation cannot be completed.

### 6.2.4 Dixie governed recall/control-plane API

**Recommendation:** add `loa-dixie/app/src/straylight/` module for:

- estate inspection BFF;
- recall request endpoint;
- recall pack assembly orchestration;
- provenance query surface;
- receipt lookup;
- operator/debug inspection;
- optional integration with Dixie memory/context services.

Dixie can be the initial API surface for MVP because it already has BFF, auth, memory, context, and audit-adjacent pieces. But Dixie must not treat current memory as Straylight estate until it is wrapped in assertion semantics.

### 6.2.5 Freeside community/bot adapters

**Recommendation:** Freeside integrates later as a consumer:

- community actor estate creation;
- tenant/community scoped recall;
- Discord/Telegram environment frames;
- admin permission grants;
- public channel redaction rules;
- event/feedback signal assertions;
- bot action receipts.

Freeside should not define Straylight primitives. It should use Hounfour schemas, Finn enforcement, and Dixie/Finn control-plane APIs.

### 6.2.6 Loa workflow/eval gates

**Recommendation:** add Straylight-aware workflow gates to `loa`:

- `/straylight-verify` or equivalent;
- Straylight artifact source hierarchy schema;
- spec readiness checklist;
- eval harness command for recall-pack fixtures;
- review gate that blocks implementation tasks if repo ownership claims lack evidence.

Loa should carry process discipline, not runtime authority.

## 6.3 Target-state data flow

### 6.3.1 Assertion admission

```text
external event / operator input / runtime observation / feedback signal
        |
        v
candidate assertion envelope
        |
        v
Hounfour class validation
        |
        v
Finn policy validation + keyring competence check
        |
        v
estate transition: admit_assertion
        |
        v
storage + audit event + optional commitment
```

### 6.3.2 Governed recall

```text
agent/session/control-plane requests context
        |
        v
RecallRequest(actor, task, environment, scope, risk, caller)
        |
        v
class/status/provenance prefilter
        |
        v
policy validation + keyring competence check
        |
        v
retrieval strategy under recall policy
        |
        v
RecallPack(included, marked, excluded, redacted)
        |
        v
RecallReceipt + audit event + optional root
        |
        v
model/runtime/session receives governed context
```

### 6.3.3 Feedback/evaluation to estate mutation

```text
action / answer / tool call / community event
        |
        v
feedback signal assertion
        |
        v
evaluation assertion / trajectory result
        |
        v
policy decision: ignore / mark / challenge / demote / promote / mutate estate
        |
        v
estate transition with audit receipt
```

Feedback is not analytics. Feedback is not automatically truth. Feedback only affects the estate if it becomes a governed assertion and passes policy.

---

# 7. Core primitives

## 7.1 Primitive list

| Primitive | Definition | Required for MVP? |
|---|---|---|
| Actor | Agentic entity that owns/references an estate. | Yes |
| Estate | Persistent governed state-of-record for an actor. | Yes |
| Assertion | Signed, typed, inspectable statement admitted into an estate. | Yes |
| AssertionClass | Class/category of assertion with schema and policy hooks. | Yes |
| AssertionStatus | Forward-authority and recall state of an assertion. | Yes |
| ProvenanceRef | Pointer to source/evidence/history. | Yes |
| SignatureEnvelope | Signature or development signature binding signer to assertion/transition. | Yes |
| Keyring | Competence map of signers to transition rights. | Yes |
| Policy | Rules deciding whether a structurally valid transition is allowed now. | Yes |
| Transition | Change in class, status, linkage, availability, authority, recall, or commitment. | Yes |
| Challenge | Assertion/transition contesting another assertion. | Yes |
| Demotion | Transition reducing authority or recall force without erasing history. | Yes |
| Revocation | Transition removing forward authority or active usability. | Yes |
| ForgetRecord | Transition making material unavailable to ordinary recall while preserving audit. | Yes |
| RecallRequest | Scoped read request against an estate. | Yes |
| RecallPack | Governed context output. | Yes |
| RecallReceipt | Audit object explaining recall decision. | Yes |
| AuditEvent | Append-only trace of transition, validation, policy, recall, or commitment. | Yes |
| CommitmentRoot | Hash/root over estate checkpoint, receipt, or transition bundle. | Optional MVP |
| PublicAnchorRecord | Public reference to hidden estate proof/root. | Optional MVP |
| FeedbackSignal | Outcome/feedback assertion candidate. | Optional MVP / v1.1 |
| EvaluationResult | Evaluated feedback/trajectory assertion. | Optional MVP / v1.1 |

## 7.2 Actor

### Definition

An actor is an agentic entity that can have a persistent, governed estate.

MVP actor types:

- `agent`
- `user`
- `community`
- `repo_assistant`
- `demo_dNFT_actor`

### Minimal schema

```ts
type Actor = {
  actor_id: string;
  actor_type: 'agent' | 'user' | 'community' | 'repo_assistant' | 'demo_dNFT_actor';
  estate_id: string;
  keyring_id: string;
  status: 'proposed' | 'active' | 'suspended' | 'revoked' | 'archived';
  controller_refs: string[];
  schema_version: string;
  created_at: string;
  updated_at: string;
  provenance_ref?: string;
};
```

## 7.3 Estate

### Definition

The estate is the actor’s persistent state-of-record. It is not rebuilt from context. It is referenced by sessions.

### Minimal schema

```ts
type ActorEstate = {
  estate_id: string;
  actor_id: string;
  schema_version: string;
  status: 'initialized' | 'active' | 'contested' | 'partially_revoked' | 'archived';
  assertion_index_ref: string;
  keyring_id: string;
  policy_id: string;
  state_root?: string;
  audit_log_ref: string;
  public_anchor_refs?: string[];
  created_at: string;
  updated_at: string;
};
```

## 7.4 Assertion

### Definition

Everything admitted into an estate is an assertion. Assertions are not automatically true, active, usable, or binding.

### MVP classes

```ts
type AssertionClass =
  | 'observation'
  | 'event'
  | 'claim'
  | 'assumption'
  | 'preference'
  | 'reflection'
  | 'identity'
  | 'relationship'
  | 'permission'
  | 'plan'
  | 'action_trace'
  | 'feedback_signal'
  | 'evaluation_result'
  | 'challenge'
  | 'revocation'
  | 'commitment';
```

### MVP statuses

```ts
type AssertionStatus =
  | 'proposed'
  | 'active'
  | 'contested'
  | 'demoted'
  | 'revoked'
  | 'forgotten_from_recall'
  | 'superseded'
  | 'sealed';
```

### Minimal schema

```ts
type Assertion = {
  assertion_id: string;
  estate_id: string;
  actor_id: string;
  assertion_class: AssertionClass;
  status: AssertionStatus;
  body: Record<string, unknown>;
  body_hash: string;
  schema_version: string;
  provenance: ProvenanceRef[];
  subject_refs?: string[];
  linked_assertion_refs?: string[];
  supersedes_refs?: string[];
  challenged_by_refs?: string[];
  revoked_by_ref?: string;
  confidence?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  privacy_scope?: 'public' | 'tenant' | 'actor_private' | 'sealed';
  recall_scope?: string[];
  signatures: SignatureEnvelope[];
  created_at: string;
  updated_at: string;
};
```

## 7.5 ProvenanceRef

```ts
type ProvenanceRef = {
  provenance_id: string;
  source_type:
    | 'operator_input'
    | 'runtime_observation'
    | 'tool_result'
    | 'model_output'
    | 'discord_event'
    | 'telegram_event'
    | 'repo_artifact'
    | 'onchain_event'
    | 'feedback_signal'
    | 'evaluation_result'
    | 'manual_review';
  source_uri?: string;
  source_hash?: string;
  observed_at: string;
  captured_by: string;
  evidence_summary?: string;
};
```

## 7.6 SignatureEnvelope

```ts
type SignatureEnvelope = {
  signature_id: string;
  signer_id: string;
  signer_type: 'actor_controller' | 'operator' | 'runtime' | 'reviewer' | 'policy_service' | 'admin' | 'wallet' | 'service_key';
  signature_type: 'ed25519' | 'secp256k1' | 'hmac' | 'dev_signature';
  signed_payload_hash: string;
  signature: string;
  signed_at: string;
  key_ref: string;
};
```

## 7.7 Transition

```ts
type EstateTransition = {
  transition_id: string;
  estate_id: string;
  actor_id: string;
  transition_type:
    | 'create_estate'
    | 'admit_assertion'
    | 'classify_assertion'
    | 'link_assertions'
    | 'challenge_assertion'
    | 'demote_assertion'
    | 'revoke_assertion'
    | 'forget_assertion_from_recall'
    | 'inherit_assertion'
    | 'recall_estate_context'
    | 'emit_receipt'
    | 'commit_root_optional'
    | 'record_feedback_signal'
    | 'record_evaluation_result';
  target_refs: string[];
  pre_state_root?: string;
  post_state_root?: string;
  requested_by: string;
  class_validation: ClassValidationResult;
  policy_decision: PolicyDecision;
  signatures: SignatureEnvelope[];
  audit_event_ref: string;
  created_at: string;
};
```

---

# 8. Estate/assertion lifecycle

## 8.1 Lifecycle state machine

```text
candidate input
   |
   v
proposed assertion
   |
   | class validation failed ------------------> rejected_candidate (not estate state)
   |
   v
class_validated
   |
   | policy denied ----------------------------> denied_transition receipt
   |
   v
admitted / active
   |
   +--> linked
   +--> contested
   +--> demoted
   +--> revoked
   +--> forgotten_from_recall
   +--> superseded
   +--> sealed
   +--> committed / anchored
```

## 8.2 Admission

Admission is the transition that turns a candidate into an estate assertion. It requires:

1. valid assertion schema;
2. valid actor and estate references;
3. valid provenance;
4. valid signature envelope;
5. policy decision allowing admission;
6. audit event recording admission.

Admission does not imply truth. It means the assertion is a legible citizen of the estate and was authorized to enter.

## 8.3 Classification

Classification assigns or changes assertion class. It requires class validation and policy validation.

Example: a raw operator note may be admitted as `claim`. It may later be classified as `preference` or `identity` only if policy permits the promotion.

## 8.4 Link

Linking creates explicit relationships among assertions. Links should carry link type:

```ts
type AssertionLinkType =
  | 'supports'
  | 'contradicts'
  | 'derived_from'
  | 'supersedes'
  | 'evidence_for'
  | 'challenge_to'
  | 'revokes'
  | 'recall_related'
  | 'same_subject'
  | 'caused_by'
  | 'evaluates';
```

Links are not merely graph edges. They influence policy, recall, challenge resolution, and audit.

## 8.5 Challenge

Challenge is a first-class assertion and transition. It contests another assertion’s force, not its historical existence.

A challenge must include:

- target assertion;
- challenge reason;
- challenger signer;
- evidence/provenance;
- requested effect: mark, demote, revoke, seal, forget from recall, or review;
- policy decision.

## 8.6 Demotion

Demotion reduces assertion force without deleting history.

Examples:

- active reflection → demoted reflection;
- active relationship judgment → contested/demoted;
- permission assertion → demoted pending reviewer confirmation.

Demoted assertions may still be visible in audit, but ordinary recall should exclude or mark them depending on policy.

## 8.7 Revocation

Revocation removes forward authority. It does not erase the original assertion.

Revoked assertions MUST NOT silently influence recall, action, identity mutation, policy, or commitments.

## 8.8 Forgetting

Forgetting in Straylight is not naive deletion. MVP should implement `forgotten_from_recall`:

- assertion remains auditable;
- ordinary recall excludes it;
- privileged audit recall may reference it by hash or sealed metadata;
- receipt records the forgetting transition.

## 8.9 Inheritance

Inheritance is a controlled transition that copies, references, or makes available estate material across actor, session, environment, version, or ownership boundaries.

MVP may implement only minimal `inherit_assertion` for demo actor continuity. Full dNFT sale/transfer inheritance is non-MVP.

## 8.10 Recall

Recall is a read transition against the estate. It emits a `RecallPack` and `RecallReceipt`.

Recall does not mutate assertion state by itself, except for audit/event counters if required. Any learning from recall outcome must become feedback/evaluation material later.

---

# 9. Validation and policy model

## 9.1 Class validation

Class validation answers:

> Is this object structurally legible for its claimed class?

It checks:

- schema version;
- required fields;
- field types;
- assertion class;
- actor identifier;
- estate identifier;
- signature envelope format;
- provenance references;
- timestamp structure;
- hash integrity;
- class-specific body shape.

Class validation MUST be deterministic and testable with conformance vectors.

Recommended owner: Hounfour Straylight schema namespace.

## 9.2 Policy validation

Policy validation answers:

> Is this structurally valid move allowed under current estate state?

It checks:

- whether the signer is recognized;
- whether the signer is competent for this transition;
- whether the transition is allowed from current assertion/estate status;
- whether quorum, timelock, delegation, or revocation rules apply;
- whether conflicting signatures exist;
- whether permissions are still active;
- whether risk scope requires stronger signer;
- whether environment frame permits this recall/action;
- whether private/sealed material can be used.

Recommended runtime owner: Finn. Recommended schema owner: Hounfour. Recommended BFF invocation surface: Dixie.

## 9.3 Required separation

A structurally valid assertion can still be unauthorized.

An authorized policy intent can still be invalid if the assertion payload fails class validation.

Therefore every transition must carry both:

```ts
type ClassValidationResult = {
  valid: boolean;
  schema_id: string;
  schema_version: string;
  errors: ValidationError[];
};

type PolicyDecision = {
  decision: 'allow' | 'deny' | 'needs_review' | 'allow_with_redaction' | 'allow_marked_only';
  policy_id: string;
  policy_version: string;
  signer_competence_result: SignerCompetenceResult;
  reasons: string[];
  required_next_actions?: string[];
  decided_at: string;
};
```

## 9.4 Policy files

MVP policy can be JSON/YAML.

Example:

```yaml
policy_id: default-agent-estate-policy
version: 0.1.0
rules:
  - id: admit-observation-runtime
    transition: admit_assertion
    assertion_class: observation
    allowed_signer_roles: [runtime, operator]
    max_risk: medium

  - id: identity-update-requires-reviewer
    transition: classify_assertion
    target_class: identity
    allowed_signer_roles: [operator, reviewer]
    require_provenance_count: 2
    deny_if_source_type: [model_output]

  - id: public-discord-recall
    transition: recall_estate_context
    environment_frame: public_discord
    exclude_statuses: [revoked, forgotten_from_recall, sealed]
    mark_statuses: [contested, demoted]
    exclude_privacy_scopes: [actor_private, sealed]
```

## 9.5 Failure behavior

Straylight MUST fail closed.

| Failure | Required behavior |
|---|---|
| Schema unknown | deny transition, emit denied receipt. |
| Signer unknown | deny transition, emit denied receipt. |
| Policy unavailable | deny high-risk transition; allow only explicitly low-risk read if configured. |
| Storage unavailable | deny mutation; recall may fail with audit event. |
| Audit unavailable | deny mutation. |
| Commitment unavailable | continue only if commitment is optional for that transition. |
| Recall filter error | do not produce partial unmarked recall pack unless policy explicitly permits degraded mode. |

---

# 10. Keyring / signer competence model

## 10.1 Doctrine requirement

Straylight must not assume one global admin, owner, or signer. Different transitions may require different competent signers.

A signature proves that a signer signed something. It does not prove that the signer was competent to authorize that transition.

## 10.2 MVP signer roles

| Role | Description | Typical transitions |
|---|---|---|
| `actor_controller` | Primary controller of actor estate. | create estate, approve high-risk changes, commit root. |
| `operator` | Technical maintainer/operator. | admit, classify, challenge, recall, revoke depending on policy. |
| `runtime` | Runtime service signer. | admit runtime observations/action traces, emit receipts. |
| `reviewer` | Human or service reviewer. | approve identity/policy-impacting changes, resolve challenges. |
| `policy_service` | Policy engine/service identity. | sign policy decisions, not raw truth. |
| `admin` | Tenant/community admin. | grant scoped permissions, request community recall. |
| `wallet` | Onchain/wallet signer. | anchor, commitment, actor ownership proofs. |

## 10.3 Keyring schema

```ts
type Keyring = {
  keyring_id: string;
  actor_id: string;
  estate_id: string;
  version: string;
  signer_entries: SignerEntry[];
  competence_rules: SignerCompetenceRule[];
  revoked_key_refs: string[];
  created_at: string;
  updated_at: string;
};

type SignerEntry = {
  signer_id: string;
  signer_type: 'actor_controller' | 'operator' | 'runtime' | 'reviewer' | 'policy_service' | 'admin' | 'wallet' | 'service_key';
  key_ref: string;
  status: 'active' | 'suspended' | 'revoked';
  valid_from: string;
  valid_until?: string;
  scopes: string[];
};

type SignerCompetenceRule = {
  rule_id: string;
  transition_type: EstateTransition['transition_type'];
  assertion_class?: AssertionClass;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  environment_frame?: string;
  required_signer_roles: string[];
  quorum?: number;
  timelock_seconds?: number;
  requires_human_review?: boolean;
};
```

## 10.4 Competence examples

### Runtime can admit observation, not identity

```text
runtime signer → admit observation: allowed
runtime signer → classify as identity: denied
```

### Wallet can prove controller but not automatically authorize every transition

```text
wallet signature → actor ownership proof: allowed
wallet signature → recall sealed private memory in public Discord: denied unless keyring policy grants that competence
```

### Admin can grant community bot capability but not mutate dNFT identity

```text
community admin → grant discord.read_channel: allowed
community admin → update dNFT identity assertion: denied
```

## 10.5 Key rotation and revocation

MVP must support:

- key status: active/suspended/revoked;
- transition denial if key revoked;
- audit event for keyring mutation;
- ability to reconstruct which key was valid at transition time.

Full decentralized key custody, smart-account delegation, and token-bound-account integrations may come later.

---

# 11. Governed recall model

## 11.1 Recall is not retrieval

Retrieval finds plausible context. Governed recall determines which estate material is allowed to matter now.

Recall MUST be scoped by:

- actor;
- estate;
- caller;
- task/intent;
- environment frame;
- permission scope;
- risk profile;
- privacy scope;
- assertion class;
- assertion status;
- provenance and confidence;
- challenge/revocation/forgetting state.

## 11.2 RecallRequest

```ts
type RecallRequest = {
  recall_request_id: string;
  actor_id: string;
  estate_id: string;
  requested_by: string;
  task: string;
  intent?: string;
  environment_frame:
    | 'private_operator'
    | 'private_chat'
    | 'public_discord'
    | 'public_telegram'
    | 'repo_workflow'
    | 'tool_action_precheck'
    | 'audit_review';
  risk_profile: 'low' | 'medium' | 'high' | 'critical';
  requested_classes?: AssertionClass[];
  excluded_classes?: AssertionClass[];
  include_statuses?: AssertionStatus[];
  mark_statuses?: AssertionStatus[];
  exclude_statuses?: AssertionStatus[];
  max_items?: number;
  freshness_window?: string;
  include_provenance?: boolean;
  include_receipt_detail: 'minimal' | 'standard' | 'debug';
  signature: SignatureEnvelope;
  created_at: string;
};
```

## 11.3 RecallPack

```ts
type RecallPack = {
  recall_pack_id: string;
  recall_request_id: string;
  actor_id: string;
  estate_id: string;
  included: RecallItem[];
  marked: RecallItem[];
  redacted: RedactionSummary[];
  excluded_summary: ExclusionSummary[];
  policy_decision: PolicyDecision;
  receipt_id: string;
  pack_hash: string;
  created_at: string;
};

type RecallItem = {
  assertion_id: string;
  assertion_class: AssertionClass;
  status: AssertionStatus;
  summary: string;
  body_ref?: string;
  provenance_refs: string[];
  confidence?: number;
  use_instruction: 'usable' | 'mark_as_contested' | 'use_as_background_only' | 'do_not_use_for_action';
};
```

## 11.4 RecallReceipt

```ts
type RecallReceipt = {
  receipt_id: string;
  recall_request_id: string;
  recall_pack_id: string;
  actor_id: string;
  estate_id: string;
  filters_applied: string[];
  included_assertion_ids: string[];
  marked_assertion_ids: string[];
  redacted_count: number;
  excluded_counts_by_reason: Record<string, number>;
  policy_decision_ref: string;
  requester_signature_ref: string;
  runtime_signature_ref?: string;
  pack_hash: string;
  receipt_hash: string;
  commitment_ref?: string;
  created_at: string;
};
```

## 11.5 Recall decision behavior

| Assertion condition | Default recall behavior |
|---|---|
| `active`, permitted, relevant | include. |
| `contested` | mark; include only if policy permits. |
| `demoted` | exclude or mark as background only. |
| `revoked` | exclude. |
| `forgotten_from_recall` | exclude from ordinary recall; audit-only reference possible. |
| `sealed` | exclude except privileged audit recall. |
| private scope in public frame | redact or exclude. |
| no provenance | exclude from high-risk recall. |
| model-output-only provenance | exclude from identity/policy/action uses unless reviewed. |

## 11.6 Retrieval backend policy

Vector search, keyword search, graph traversal, temporal filters, and relationship lookup are implementation strategies. They must operate underneath recall policy.

Correct order:

```text
policy/class/status/provenance prefilter → candidate retrieval → postfilter → pack assembly → receipt
```

Incorrect order:

```text
vector top-k → prompt injection → optional safety note
```

## 11.7 MVP recall examples

### Public Discord answer

Request:

```json
{
  "actor_id": "agent:satoshi-demo",
  "task": "answer user question in public Discord",
  "environment_frame": "public_discord",
  "risk_profile": "medium",
  "exclude_statuses": ["revoked", "forgotten_from_recall", "sealed"],
  "mark_statuses": ["contested", "demoted"],
  "include_receipt_detail": "standard"
}
```

Expected behavior:

- include public/tenant-safe active observations/preferences;
- exclude private relationship memory;
- exclude revoked identity claims;
- mark contested claims if included;
- emit receipt.

### Audit review

Request:

```json
{
  "actor_id": "agent:satoshi-demo",
  "task": "audit why the agent used a specific claim",
  "environment_frame": "audit_review",
  "risk_profile": "high",
  "include_statuses": ["active", "contested", "demoted", "revoked", "forgotten_from_recall"],
  "include_receipt_detail": "debug"
}
```

Expected behavior:

- include historical metadata and hashes;
- preserve privacy redaction where required;
- show transition chain;
- never make revoked material usable for normal action.

---

# 12. Challenge / demotion / revocation model

## 12.1 Design stance

Challenge, demotion, and revocation preserve continuity by changing forward authority without rewriting history.

The estate must be able to say:

```text
This existed.
This was challenged.
This was demoted.
This was revoked.
This is no longer active.
This was not erased.
```

## 12.2 ChallengeAssertion

```ts
type ChallengeAssertionBody = {
  target_assertion_id: string;
  challenge_type:
    | 'incorrect'
    | 'unsupported'
    | 'outdated'
    | 'privacy_violation'
    | 'cross_tenant_leakage'
    | 'identity_drift'
    | 'policy_violation'
    | 'poisoned_memory'
    | 'unsafe_tool_output';
  requested_effect: 'mark_contested' | 'demote' | 'revoke' | 'forget_from_recall' | 'seal' | 'human_review';
  evidence_refs: ProvenanceRef[];
  explanation: string;
};
```

## 12.3 Demotion

Demotion is appropriate when an assertion should remain visible but lose force.

Examples:

- low-confidence reflection;
- outdated preference;
- relationship interpretation based on weak evidence;
- non-current plan;
- old action recommendation.

## 12.4 Revocation

Revocation is appropriate when future use would be unsafe or unauthorized.

Examples:

- compromised permission;
- poisoned memory;
- false identity claim;
- superseded policy grant;
- unsafe tool capability;
- recalled material that should never have been active.

## 12.5 Appeal / review path

MVP should include a minimal appeal path:

```text
challenge_assertion → contested status → reviewer decision → demote/revoke/restore/keep_contested
```

Full social governance, DAO voting, external arbitration, and marketplace reputation are non-MVP.

## 12.6 Effects on recall

| Status | Normal recall | High-risk recall | Audit recall |
|---|---|---|---|
| active | include if relevant and permitted | include if provenance sufficient | include |
| contested | mark or exclude | exclude unless needed for dispute | include |
| demoted | background only or exclude | exclude | include |
| revoked | exclude | exclude | include as revoked metadata |
| forgotten_from_recall | exclude | exclude | include sealed/hash metadata if permitted |
| sealed | exclude | exclude | include only with privileged signer |

---

# 13. Public anchor / hidden estate model

## 13.1 Doctrine stance

The full estate may live offchain: private, encrypted, mutable, contextual, and permissioned. Public infrastructure may anchor identifiers, keys, roots, schema versions, signed permissions, commitment hashes, revocations, audit checkpoints, payment records, and verification proofs.

The chain does not need to store memory.

## 13.2 Target model

```text
Hidden estate offchain:
  assertions, bodies, provenance, private memory, relationships, traces, policies

Public anchors:
  actor id, controller key refs, schema version, estate root, receipt root,
  revocation root, commitment root, audit checkpoint hash
```

## 13.3 MVP commitment root

MVP should support optional local commitment root:

```ts
type CommitmentRoot = {
  commitment_id: string;
  actor_id: string;
  estate_id: string;
  commitment_type: 'estate_checkpoint' | 'recall_receipt' | 'transition_bundle' | 'revocation_checkpoint';
  root_hash: string;
  included_refs: string[];
  schema_version: string;
  created_by: string;
  signature: SignatureEnvelope;
  created_at: string;
  public_anchor_ref?: string;
};
```

This root can remain local in MVP. Onchain anchoring can be added later.

## 13.4 PublicAnchorRecord

```ts
type PublicAnchorRecord = {
  public_anchor_id: string;
  chain_id?: string;
  tx_hash?: string;
  anchor_type: 'actor_identifier' | 'controller_key' | 'estate_root' | 'receipt_root' | 'revocation_root' | 'audit_checkpoint';
  root_hash: string;
  schema_version: string;
  created_at: string;
};
```

## 13.5 Privacy rules

Public anchors MUST NOT expose:

- memory body;
- private relationship data;
- sealed assertions;
- raw model outputs;
- hidden reasoning;
- private operator notes;
- sensitive provenance contents.

Receipts exposed outside privileged operator scope should use counts, hashes, redaction summaries, and policy explanations rather than hidden estate bodies.

---

# 14. Audit and receipt model

## 14.1 Audit principle

If the estate cannot reconstruct why state changed, it has lost continuity.

Therefore every estate mutation and governed recall must produce auditable evidence.

## 14.2 AuditEvent

```ts
type AuditEvent = {
  audit_event_id: string;
  event_type:
    | 'class_validation'
    | 'policy_validation'
    | 'transition_requested'
    | 'transition_allowed'
    | 'transition_denied'
    | 'assertion_admitted'
    | 'assertion_classified'
    | 'assertion_linked'
    | 'assertion_challenged'
    | 'assertion_demoted'
    | 'assertion_revoked'
    | 'assertion_forgotten_from_recall'
    | 'recall_requested'
    | 'recall_pack_emitted'
    | 'commitment_created'
    | 'feedback_recorded'
    | 'evaluation_recorded';
  actor_id: string;
  estate_id: string;
  transition_id?: string;
  assertion_refs?: string[];
  request_hash?: string;
  result_hash?: string;
  signer_refs: string[];
  policy_decision_ref?: string;
  previous_audit_hash?: string;
  audit_hash: string;
  created_at: string;
};
```

## 14.3 Receipt classes

| Receipt | Purpose |
|---|---|
| `AdmissionReceipt` | proves candidate assertion passed class/policy and entered estate. |
| `DeniedTransitionReceipt` | proves transition was rejected and why. |
| `ChallengeReceipt` | proves a challenge was filed and status changed. |
| `RevocationReceipt` | proves forward authority was removed. |
| `ForgetReceipt` | proves ordinary recall exclusion. |
| `RecallReceipt` | proves what was included/excluded/marked/redacted during recall. |
| `CommitmentReceipt` | proves root was computed and optionally anchored. |
| `EvaluationReceipt` | proves feedback/evaluation decision path. |

## 14.4 Hash chaining

MVP should use hash-chained audit events where feasible. Existing Loa/Finn/Freeside/Dixie audit raw material should be reused, not replaced. The Straylight-specific requirement is that the audit event must refer to estate/assertion/transition/recall objects, not just generic runtime logs.

## 14.5 Receipt exposure levels

```ts
type ReceiptDetailLevel = 'public_minimal' | 'operator_standard' | 'debug_privileged';
```

| Level | Exposes |
|---|---|
| public_minimal | root hashes, timestamps, status, counts, public policy summary. |
| operator_standard | included/marked assertion IDs, exclusion reasons, provenance summaries. |
| debug_privileged | detailed transition chain, body refs, redaction details, policy traces. |

---

# 15. API/control-plane design

## 15.1 Design stance

APIs are not the product category. They are control-plane surfaces over the estate primitives. Every API must reduce back to primitive verbs: `admit`, `classify`, `link`, `challenge`, `inherit`, `forget`, `recall`.

## 15.2 MVP API surface

Recommended initial API namespace:

```text
/straylight/v0
```

Preferred first host: Dixie BFF for operator/control-plane APIs, with Finn runtime integration for policy/audit enforcement. Hounfour owns shared schemas. This is a recommendation, not a confirmed current implementation.

## 15.3 Endpoints

### Actor / estate

```http
POST /straylight/v0/actors
GET  /straylight/v0/actors/:actor_id
POST /straylight/v0/actors/:actor_id/estates
GET  /straylight/v0/estates/:estate_id
```

### Assertions

```http
POST /straylight/v0/estates/:estate_id/assertions
GET  /straylight/v0/assertions/:assertion_id
POST /straylight/v0/assertions/:assertion_id/classify
POST /straylight/v0/assertions/:assertion_id/link
```

### Challenge / revocation / forgetting

```http
POST /straylight/v0/assertions/:assertion_id/challenge
POST /straylight/v0/assertions/:assertion_id/demote
POST /straylight/v0/assertions/:assertion_id/revoke
POST /straylight/v0/assertions/:assertion_id/forget-from-recall
POST /straylight/v0/challenges/:challenge_id/resolve
```

### Recall

```http
POST /straylight/v0/recall
GET  /straylight/v0/recall-packs/:recall_pack_id
GET  /straylight/v0/recall-receipts/:receipt_id
```

### Policy / keyring

```http
GET  /straylight/v0/estates/:estate_id/keyring
POST /straylight/v0/estates/:estate_id/keyring/signers
POST /straylight/v0/estates/:estate_id/keyring/signers/:signer_id/revoke
GET  /straylight/v0/policies/:policy_id
POST /straylight/v0/policy/validate-transition
```

### Audit / commitment

```http
GET  /straylight/v0/audit/events/:audit_event_id
GET  /straylight/v0/estates/:estate_id/audit
POST /straylight/v0/commitments
GET  /straylight/v0/commitments/:commitment_id
```

### Feedback/evaluation extension

```http
POST /straylight/v0/feedback-signals
POST /straylight/v0/evaluations
POST /straylight/v0/evaluations/:evaluation_id/apply-decision
```

This extension may ship after the Recall Wedge unless needed for eval harness.

## 15.4 Example: admit assertion

Request:

```json
{
  "assertion_class": "observation",
  "body": {
    "text": "Operator says Satoshi demo agent should not use revoked identity claims in public Discord."
  },
  "provenance": [
    {
      "source_type": "operator_input",
      "observed_at": "2026-05-05T12:00:00Z",
      "captured_by": "operator:eileen"
    }
  ],
  "privacy_scope": "tenant",
  "risk_level": "medium",
  "signatures": [
    {
      "signer_id": "operator:eileen",
      "signature_type": "dev_signature",
      "signed_payload_hash": "sha256:...",
      "signature": "dev:...",
      "key_ref": "dev-key:eileen"
    }
  ]
}
```

Response:

```json
{
  "assertion_id": "asrt_01...",
  "status": "active",
  "class_validation": { "valid": true, "schema_id": "straylight.assertion.observation", "errors": [] },
  "policy_decision": { "decision": "allow", "reasons": ["operator competent to admit observation"] },
  "audit_event_id": "audit_01...",
  "receipt_id": "receipt_01..."
}
```

## 15.5 Example: recall

Request:

```json
{
  "actor_id": "agent:satoshi-demo",
  "estate_id": "estate:satoshi-demo",
  "task": "answer user question in public Discord",
  "environment_frame": "public_discord",
  "risk_profile": "medium",
  "requested_classes": ["observation", "preference", "identity", "relationship", "permission"],
  "exclude_statuses": ["revoked", "forgotten_from_recall", "sealed"],
  "mark_statuses": ["contested", "demoted"],
  "include_receipt_detail": "standard",
  "signature": { "signer_id": "operator:eileen", "signature_type": "dev_signature", "signed_payload_hash": "sha256:...", "signature": "dev:...", "key_ref": "dev-key:eileen" }
}
```

Response:

```json
{
  "recall_pack_id": "rpack_01...",
  "included": [
    {
      "assertion_id": "asrt_01...",
      "assertion_class": "preference",
      "status": "active",
      "summary": "Public Discord answers must exclude revoked identity claims.",
      "use_instruction": "usable"
    }
  ],
  "marked": [],
  "excluded_summary": [
    { "reason": "status_revoked", "count": 2 },
    { "reason": "privacy_scope_actor_private", "count": 3 }
  ],
  "receipt_id": "receipt_01...",
  "pack_hash": "sha256:..."
}
```

---

# 16. Repo responsibility map

## 16.1 Confirmed vs recommended responsibility

| Repo/system | Confirmed current role | Recommended Straylight role | Must not own |
|---|---|---|---|
| `loa` | Workflow/spec/eval/review framework with project memory and local audit/WAL-adjacent surfaces. | Workflow gate, spec/eval harness, repo-verification checklist, Straylight artifact source hierarchy. | Runtime estate state, production recall, policy authority, signer authority. |
| `loa-hounfour` | TypeBox/JSON Schema/constraint/governance protocol library. | Canonical Straylight schemas, class validation, conformance vectors, policy-decision vocabulary. | Runtime enforcement, storage, model execution, final policy decisions alone. |
| `loa-finn` | Runtime/model/tool/audit/auth/budget/tracing substrate. | Policy execution, keyring checks, transition enforcement, runtime audit receipts, model/tool/action trace. | Primitive doctrine source, class schema owner alone, community UX. |
| `loa-dixie` | Governed BFF, memory/auth/context/audit surfaces. | Operator/control-plane API, governed recall orchestration, provenance inspection, receipt lookup. | Model authority, ungoverned memory canonicalization, schema owner alone. |
| `loa-freeside` | Multi-tenant Discord/Telegram/REST/NATS/admin/budget/audit community infra. | Consumer/app surface for tenant/community actors, bot environment frames, feedback signal capture, admin grants. | Core primitive owner, hidden estate source of truth by itself. |
| Database/storage | Existing WAL/events/migrations/audit/mutation/JSONB/tenant scopes. | Store Straylight estate/assertion/transition/receipt objects using current DB patterns. | Define semantics without schema/policy layer. |
| Model providers | Existing provider adapters/routing. | Emit provenance into audit/receipts. | Authority over assertions, policies, permissions, identity, or commitments. |
| Discord/Telegram | Freeside bot surfaces. | Environment frames, input observations, feedback signals, action surfaces. | Estate authority or recall policy. |
| DevOps | CI/tests/Docker/Terraform/tracing/runbooks. | Add Straylight gates, tests, migrations, threat model, rollback/recovery. | Replace current deployment. |

## 16.2 Recommended integration contracts

### Hounfour → Finn

- Hounfour exports schemas and conformance vectors.
- Finn imports schemas for validation and uses policy-decision types.
- Finn emits runtime objects matching Hounfour schemas.

### Finn → Dixie

- Dixie calls Finn enforcement where policy/runtime state is required.
- Finn returns policy decisions, audit refs, and runtime receipts.
- Dixie exposes operator-friendly API responses.

### Dixie → Freeside

- Freeside calls Dixie/Finn for governed recall and estate inspection.
- Freeside passes tenant/community/environment frame and caller identity.
- Freeside never bypasses recall policy for public bot outputs.

### Loa → all repos

- Loa validates source hierarchy and spec readiness.
- Loa eval harness consumes Hounfour fixtures and Finn/Dixie outputs.
- Loa blocks implementation tasks that assign repo ownership without evidence.

## 16.3 Responsibility conflicts

| Conflict | Resolution |
|---|---|
| Hounfour has governance schemas; Finn has runtime policy. | Hounfour owns contract; Finn executes. |
| Dixie has memory/context APIs; Finn has runtime recall trace. | Dixie orchestrates BFF/control-plane; Finn signs/enforces/audits runtime transition. |
| Freeside has governed mutation service; Straylight has estate transitions. | Freeside consumes and emits events into Straylight; it should not define primitive semantics. |
| Loa has memory hooks; Straylight has actor estates. | Loa memory remains project memory; Straylight estate is separate. |
| Provider output may be useful for summaries; Straylight requires signed assertions. | Model output can propose assertion; it cannot authorize it. |

---

# 17. MVP implementation plan

## 17.1 MVP name

**Straylight Recall Wedge**

## 17.2 MVP objective

Demonstrate that an agent session can request a governed recall pack from a signed actor estate and receive only authorized estate context with an audit receipt.

## 17.3 MVP phase 0 — repo branch and source gate

**Goal:** prevent implementation drift before code starts.

Tasks:

1. Create implementation branch(es).
2. Add `/docs/product-context/loa-straylight/` or equivalent with:
   - doctrine summary;
   - source hierarchy;
   - spec file;
   - repo verification artifacts;
   - MVP wedge scope.
3. Add Loa workflow checklist: no research packet becomes implementation requirement unless mapped to primitive and repo evidence.

Acceptance:

- Loa workflow distinguishes doctrine, research, verification, spec, implementation.
- Engineering backlog references verification IDs and primitive IDs.

## 17.4 MVP phase 1 — Hounfour schemas and vectors

**Goal:** create canonical object contracts.

Add schemas:

- `Actor`
- `ActorEstate`
- `Assertion`
- `SignatureEnvelope`
- `Keyring`
- `PolicyDecision`
- `EstateTransition`
- `Challenge`
- `Revocation`
- `RecallRequest`
- `RecallPack`
- `RecallReceipt`
- `AuditEvent`
- optional `CommitmentRoot`

Add conformance vectors:

- valid observation admission;
- invalid missing provenance;
- valid reflection but not identity promotion;
- revoked assertion excluded from recall;
- private assertion excluded from public recall;
- contested assertion marked;
- unknown signer denied;
- signer valid but not competent denied.

Acceptance:

- `npm run schema:generate` or equivalent works.
- Tests prove class validation is separate from policy decision shape.
- No runtime enforcement is claimed in Hounfour.

## 17.5 MVP phase 2 — minimal storage and audit

**Goal:** persist estate state and audit transitions.

Recommended first implementation:

- Use existing DB layer in Dixie or Finn depending on chosen MVP host.
- Store assertions, transitions, receipts, audit events in existing migration style.
- Use JSONB payloads for v0 flexibility, but preserve typed IDs/status/class columns for filtering.

Minimal tables:

```sql
actor_estates(
  estate_id primary key,
  actor_id,
  status,
  keyring_id,
  policy_id,
  state_root,
  created_at,
  updated_at
)

estate_assertions(
  assertion_id primary key,
  estate_id,
  actor_id,
  assertion_class,
  status,
  body_hash,
  body_json,
  provenance_json,
  signatures_json,
  privacy_scope,
  risk_level,
  created_at,
  updated_at
)

estate_transitions(
  transition_id primary key,
  estate_id,
  actor_id,
  transition_type,
  target_refs_json,
  class_validation_json,
  policy_decision_json,
  signatures_json,
  pre_state_root,
  post_state_root,
  created_at
)

recall_receipts(
  receipt_id primary key,
  recall_request_id,
  recall_pack_id,
  estate_id,
  actor_id,
  pack_hash,
  receipt_hash,
  receipt_json,
  created_at
)

audit_events(
  audit_event_id primary key,
  event_type,
  estate_id,
  actor_id,
  transition_id,
  request_hash,
  result_hash,
  previous_audit_hash,
  audit_hash,
  event_json,
  created_at
)
```

Acceptance:

- Every mutation writes audit event.
- Audit hash chain works or has a documented local substitute.
- Existing stack audit utilities are reused where possible.

## 17.6 MVP phase 3 — Finn policy/keyring enforcement

**Goal:** fail closed for unauthorized transitions.

Implement:

- keyring loader;
- signer lookup;
- competence rule evaluator;
- policy decision engine;
- transition executor;
- denied transition receipts;
- audit event emission.

Acceptance:

- unknown signer denied;
- revoked key denied;
- valid signer without competence denied;
- runtime can admit observation but cannot mutate identity unless policy grants it;
- policy unavailable denies high-risk transition.

## 17.7 MVP phase 4 — Dixie recall API

**Goal:** expose governed recall pack control-plane endpoint.

Implement:

- `POST /straylight/v0/recall`;
- actor/estate lookup;
- class/status/provenance prefilter;
- policy validation;
- recall pack assembly;
- receipt emission;
- operator receipt lookup.

Acceptance:

- revoked material excluded;
- forgotten material excluded;
- private material excluded from public Discord frame;
- contested material marked or excluded by policy;
- receipt shows filters and exclusion counts;
- recall pack can be passed to agent runtime as model context.

## 17.8 MVP phase 5 — demo fixtures

Build one demo estate:

```text
actor: agent:satoshi-demo
estate: estate:satoshi-demo
```

Seed assertions:

- observed fact;
- inferred reflection;
- active preference;
- permission;
- relationship/context note;
- challenged claim;
- revoked identity-affecting reflection;
- private/sealed note;
- action trace;
- optional feedback signal.

Run recall scenarios:

1. private operator recall;
2. public Discord recall;
3. audit review recall;
4. tool action precheck recall.

Acceptance:

- each scenario emits different pack under same estate;
- excluded/marked behavior is explainable;
- no scenario depends on generic vector search as authority.

## 17.9 MVP phase 6 — optional commitment root

Implement local commitment root for:

- estate checkpoint;
- recall receipt;
- revocation checkpoint.

Do not ship public onchain anchor unless integration is already easy and low-risk.

Acceptance:

- root is reproducible;
- root does not reveal hidden estate;
- receipt links to root.

---

# 18. Migration path from current stack

## 18.1 Migration principle

Do not migrate existing memory into Straylight blindly. Existing memory, logs, traces, bot events, and project context should become candidate assertions only after classification and policy.

## 18.2 Migration stages

### Stage A — adjacency inventory

Inventory existing memory/audit/context objects in:

- Loa grimoires/project memory;
- Dixie soul memory/context stores;
- Finn conversations/runtime traces;
- Freeside community events and audit logs;
- Hounfour generated schemas and validators.

Classify each source as:

- candidate observation source;
- candidate provenance source;
- candidate action trace source;
- candidate policy source;
- candidate audit source;
- do-not-import.

### Stage B — candidate assertion adapter

For each source, write adapter outputting `CandidateAssertion` objects.

Rules:

- do not set active status by default;
- do not infer identity or permissions automatically;
- preserve source URI/hash/provenance;
- mark model-generated summaries as `reflection` or `claim`, not fact;
- require policy review for high-risk classes.

### Stage C — controlled import

Import small curated demo set only.

Acceptance:

- every imported assertion has provenance;
- every imported assertion has class/status;
- every imported assertion has admission receipt.

### Stage D — governed recall integration

Switch selected agent/session context assembly from ad hoc memory injection to `RecallPack` consumption.

Do not remove existing memory systems. Put Straylight in front of high-risk durable recall.

### Stage E — expand to Freeside/Dixie/Finn workflows

After MVP passes:

- Freeside public bot recall uses environment frame;
- Finn runtime logs model/tool/recall trace;
- Dixie exposes operator recall and receipt inspection;
- Loa eval harness checks conformance.

## 18.3 Migration anti-patterns

Do not:

- bulk-import all chat history as active memory;
- convert summaries into facts;
- treat old audit logs as complete Straylight receipts;
- merge tenant memories across Freeside communities;
- use vector IDs as assertion IDs;
- make every existing repo memory surface an estate.

---

# 19. Security/governance risks

## 19.1 Highest-risk areas

| Risk | Severity | Mitigation |
|---|---|---|
| Memory poisoning | Critical | typed assertions, provenance, challenge/revocation, recall filters. |
| Cross-tenant leakage | Critical | estate/tenant scoping, environment frames, policy validation. |
| Signer confusion | Critical | keyring competence checks; signature != authority. |
| RAG authority collapse | Critical | recall controller above retrieval; revoked/private filters before prompt assembly. |
| Tool/action escalation | Critical | permission→action boundary through Finn enforcement. |
| Revocation cosmetic only | High | revoked assertions must be excluded from ordinary recall/action. |
| Public anchor privacy leak | High | anchor hashes only, not estate contents. |
| Model output as authority | High | model output can propose assertions but cannot authorize transitions. |
| Incorrect repo ownership | High | source hierarchy + repo responsibility map + Loa verification gates. |
| Audit gap | High | deny mutation if audit unavailable. |
| Feedback as truth | Medium/High | feedback/evaluation assertions with policy before mutation. |
| Soft-fail ambiguity | Medium | evaluation status vocabulary and escalation rules. |

## 19.2 Threat model checklist

Before production use, create a threat model covering:

- prompt injection into stored assertions;
- prompt injection through tool outputs;
- malicious operator admitting false memory;
- compromised runtime signer;
- revoked key still accepted;
- public bot recalling private estate material;
- cross-tenant recall;
- onchain anchor metadata leak;
- audit-log tampering;
- stale recall from old estate root;
- model-provider output poisoning;
- feedback spam poisoning memory;
- identity drift from weak evidence.

## 19.3 Default-deny rules

MVP should deny by default when:

- assertion class unknown;
- signer unknown;
- signer revoked;
- signer not competent for transition;
- policy missing for high-risk transition;
- provenance missing for identity/policy/action-affecting class;
- requested recall frame is public and assertion privacy is private/sealed;
- assertion status is revoked/forgotten/sealed;
- audit event cannot be written for mutation.

---

# 20. Evaluation harness

## 20.1 Evaluation objective

The evaluation harness tests whether Straylight preserves continuity-under-authorization, not whether the agent sounds smart.

## 20.2 Eval suites

### Suite A — schema/class validation

- valid observation assertion passes;
- missing actor ID fails;
- invalid assertion class fails;
- malformed signature envelope fails;
- missing provenance fails for high-risk class;
- unknown schema version fails or warns depending on policy.

### Suite B — policy/signer competence

- valid signer competent for admission passes;
- valid signer not competent for identity mutation denied;
- revoked key denied;
- runtime signer cannot approve high-risk identity update;
- wallet signature alone cannot recall sealed private memory;
- admin signer scoped to tenant cannot mutate another tenant estate.

### Suite C — recall behavior

- active public assertion included;
- revoked assertion excluded;
- forgotten assertion excluded;
- sealed assertion excluded except audit frame;
- contested assertion marked;
- private assertion excluded in public Discord frame;
- cross-tenant assertion excluded;
- receipt records excluded counts.

### Suite D — challenge/revocation

- challenge creates contested status;
- demotion reduces recall force;
- revocation removes forward authority;
- appeal can restore or keep contested state;
- original assertion remains auditable;
- revoked assertion cannot become action basis.

### Suite E — audit/receipt

- every mutation emits audit event;
- recall emits receipt;
- receipt hash deterministic;
- hash chain detects tampering;
- denied transition emits receipt;
- optional commitment root reproducible.

### Suite F — feedback/evaluation seam

- feedback signal does not mutate memory automatically;
- noisy one-off feedback cannot update identity;
- evaluator soft fail does not silently approve transition;
- trajectory evaluation links to recall receipt;
- outcome-to-estate mutation requires policy.

## 20.3 Evaluation status vocabulary

Recommended statuses:

```ts
type EvalStatus =
  | 'pass'
  | 'warn'
  | 'soft_fail'
  | 'hard_fail'
  | 'retry_required'
  | 'human_review_required'
  | 'blocked';
```

This should map to Loa eval artifacts and Finn/Hounfour policy decisions.

## 20.4 Golden fixtures

Create fixtures:

- `valid_estate_minimal.json`
- `assertion_observation_valid.json`
- `assertion_reflection_model_output_only.json`
- `assertion_identity_requires_reviewer.json`
- `assertion_revoked_should_not_recall.json`
- `recall_public_discord_expected.json`
- `recall_audit_review_expected.json`
- `challenge_demote_revoke_flow.json`
- `unknown_signer_denied.json`
- `feedback_signal_no_mutation_without_policy.json`

## 20.5 CI gates

MVP CI should block if:

- schemas fail generation;
- conformance vectors fail;
- recall pack includes revoked/private/sealed material incorrectly;
- policy validation is skipped;
- audit write is skipped for mutation;
- model-provider output is treated as authority;
- repo responsibility map claims unverified ownership as fact.

---

# 21. Open questions

## 21.1 Blocks MVP implementation

1. Where should the first implementation module live: Dixie BFF, Finn runtime, Hounfour package, or a new thin Straylight package?
2. Which repo owns the first database migrations for `actor_estates`, `estate_assertions`, `estate_transitions`, `recall_receipts`, and `audit_events`?
3. Should MVP use cryptographic signatures, HMAC signatures, or deterministic dev signatures?
4. What is the minimum keyring policy language?
5. Does recall policy live in Finn, Dixie, or a shared package invoked by both?
6. What audit substrate should be reused first: Finn, Dixie, Freeside, or a local Straylight audit adapter?
7. Should optional commitment roots ship in MVP or v1.1?

## 21.2 Blocks production architecture

1. How will public anchors be implemented without leaking hidden estate content?
2. How will encryption and sealed material be handled?
3. How will key rotation and compromised signer recovery work?
4. How will dNFT transfer/inheritance preserve privacy and continuity?
5. How will cross-tenant Freeside recall be proven safe?
6. Which model-provider traces must be included in receipts?
7. What is the long-term source of truth for Straylight semantics: dedicated repo or Hounfour namespace?

## 21.3 Can wait until after MVP

1. Full graph memory / HippoRAG-like retrieval strategy.
2. Full UI for memory provenance inspection.
3. Full autonomous social-agent action system.
4. Marketplace / dNFT economy.
5. Onchain anchor automation.
6. Advanced personality salience and identity-delta scoring.
7. Full feedback/evaluation ledger.
8. Multi-agent shared estates.
9. External developer SDK.

---

# 22. Engineering backlog

## 22.1 Epic A — Straylight semantic home

### A1. Decide semantic package/repo

- **Type:** architecture decision
- **Priority:** P0
- **Description:** Decide whether Straylight semantics live in new `loa-straylight`, a package inside Hounfour, or a cross-repo shared package.
- **Acceptance:** ADR exists; repo responsibility map updated; no repo ownership ambiguity.

### A2. Create Straylight ADR set

- **Priority:** P0
- **Artifacts:**
  - ADR-001 Doctrine and Anti-Collapse Guardrails
  - ADR-002 Repo Responsibility Split
  - ADR-003 MVP Recall Wedge Scope
  - ADR-004 Public Anchor / Hidden Estate Boundary

## 22.2 Epic B — Hounfour schemas

### B1. Add Straylight schema namespace

- **Repo:** `loa-hounfour`
- **Priority:** P0
- **Files:** `src/straylight/schemas/*`
- **Objects:** Actor, Estate, Assertion, Transition, Keyring, RecallRequest, RecallPack, RecallReceipt, AuditEvent.
- **Acceptance:** schema generation and conformance tests pass.

### B2. Add class validation vectors

- **Repo:** `loa-hounfour`
- **Priority:** P0
- **Acceptance:** valid/invalid fixtures cover missing provenance, invalid signature, invalid class, unknown status, invalid transition.

### B3. Add policy-decision schema

- **Repo:** `loa-hounfour`
- **Priority:** P0
- **Acceptance:** policy decision can express allow/deny/needs_review/allow_with_redaction/allow_marked_only.

## 22.3 Epic C — storage and audit

### C1. Create MVP storage migrations

- **Repo:** likely `loa-dixie` or `loa-finn`; decision required.
- **Priority:** P0
- **Tables:** actor_estates, estate_assertions, estate_transitions, recall_receipts, audit_events.
- **Acceptance:** local migration works; fixture seed works.

### C2. Hash-chain audit adapter

- **Repo:** likely `loa-finn` or shared.
- **Priority:** P0
- **Acceptance:** audit events contain previous hash and detect tampering.

### C3. Optional commitment root adapter

- **Priority:** P1
- **Acceptance:** deterministic root for estate checkpoint and recall receipt.

## 22.4 Epic D — Finn runtime enforcement

### D1. Implement keyring loader and competence checker

- **Repo:** `loa-finn`
- **Priority:** P0
- **Acceptance:** unknown/revoked/incompetent signer denied.

### D2. Implement policy evaluator

- **Repo:** `loa-finn`
- **Priority:** P0
- **Acceptance:** policy decisions generated with reasons and audit refs.

### D3. Implement transition executor

- **Repo:** `loa-finn`
- **Priority:** P0
- **Acceptance:** admit/classify/link/challenge/demote/revoke/forget transitions produce receipts and audit events.

### D4. Implement runtime recall trace capture

- **Repo:** `loa-finn`
- **Priority:** P1
- **Acceptance:** runtime model/tool trace includes recall_pack_id and receipt_id.

## 22.5 Epic E — Dixie recall/control-plane API

### E1. Add Straylight API routes

- **Repo:** `loa-dixie`
- **Priority:** P0
- **Routes:** actor, estate, assertion, challenge, recall, receipt.
- **Acceptance:** operator can run full demo through API.

### E2. Implement recall pack assembly

- **Repo:** `loa-dixie` with Finn policy call
- **Priority:** P0
- **Acceptance:** public Discord frame excludes private/revoked/forgotten/sealed material and emits receipt.

### E3. Receipt inspection endpoint

- **Repo:** `loa-dixie`
- **Priority:** P1
- **Acceptance:** operator can inspect included/marked/excluded summary without hidden estate leak.

## 22.6 Epic F — Loa workflow/eval integration

### F1. Add Straylight verification gate

- **Repo:** `loa`
- **Priority:** P1
- **Acceptance:** command/checklist verifies doctrine/source hierarchy/repo evidence before implementation plan.

### F2. Add eval fixtures and recall conformance tests

- **Repo:** `loa` or shared eval folder
- **Priority:** P1
- **Acceptance:** CI/eval can run MVP recall fixtures and produce pass/warn/block result.

### F3. Add provider provenance check

- **Repo:** `loa` / `loa-finn`
- **Priority:** P2
- **Acceptance:** provider/model metadata can be included in receipts without becoming authority.

## 22.7 Epic G — Freeside integration

### G1. Define environment frames for bot surfaces

- **Repo:** `loa-freeside`
- **Priority:** P1
- **Frames:** public_discord, private_discord_admin, public_telegram, tenant_admin, community_dashboard.
- **Acceptance:** bot recall calls include environment frame and tenant scope.

### G2. Capture feedback signals as candidate assertions

- **Repo:** `loa-freeside`
- **Priority:** P2
- **Acceptance:** Discord/Telegram/social/economic feedback signals enter as candidate `feedback_signal`, not memory truth.

### G3. Governed capability grants

- **Repo:** `loa-freeside` + `loa-finn` + `loa-hounfour`
- **Priority:** P2
- **Acceptance:** community admin can grant scoped bot capability with policy and audit.

## 22.8 Epic H — Security and threat model

### H1. Straylight threat model

- **Priority:** P0 before production
- **Acceptance:** covers memory poisoning, cross-tenant leakage, signer compromise, public anchor leak, prompt injection, model output authority, feedback spam.

### H2. Default-deny tests

- **Priority:** P0
- **Acceptance:** test suite proves fail-closed behavior.

### H3. Redaction model

- **Priority:** P1
- **Acceptance:** receipt detail levels prevent hidden estate leakage.

---

# 23. Target file/module sketch

This is a recommended implementation sketch. It is not confirmed current structure.

## 23.1 `loa-hounfour`

```text
loa-hounfour-main/src/straylight/
  index.ts
  schemas/
    actor.ts
    estate.ts
    assertion.ts
    provenance.ts
    signature.ts
    keyring.ts
    policy-decision.ts
    transition.ts
    challenge.ts
    recall-request.ts
    recall-pack.ts
    recall-receipt.ts
    audit-event.ts
    commitment-root.ts
    feedback.ts
    evaluation.ts
  validators/
    class-validator.ts
    transition-shape-validator.ts
  vectors/
    valid-observation.json
    invalid-missing-provenance.json
    revoked-recall-exclusion.json
```

## 23.2 `loa-finn`

```text
loa-finn-main/src/straylight/
  policy/
    policy-engine.ts
    keyring-resolver.ts
    signer-competence.ts
  transitions/
    transition-executor.ts
    admit.ts
    classify.ts
    link.ts
    challenge.ts
    revoke.ts
    forget.ts
  recall/
    recall-runtime-client.ts
    recall-trace.ts
  audit/
    receipt-emitter.ts
    audit-chain.ts
    commitment-root.ts
  storage/
    estate-store.ts
    assertion-store.ts
```

## 23.3 `loa-dixie`

```text
loa-dixie-main/app/src/straylight/
  routes/
    actors.ts
    estates.ts
    assertions.ts
    challenges.ts
    recall.ts
    receipts.ts
    commitments.ts
  services/
    recall-assembler.ts
    provenance-reader.ts
    estate-reader.ts
    receipt-reader.ts
  middleware/
    environment-frame.ts
    caller-scope.ts
```

## 23.4 `loa-freeside`

```text
loa-freeside-main/themes/sietch/src/straylight/
  adapters/
    discord-environment-frame.ts
    telegram-environment-frame.ts
    community-actor.ts
  feedback/
    feedback-signal-capture.ts
  admin/
    capability-grant.ts
```

## 23.5 `loa`

```text
loa-main/.claude/commands/straylight-verify.md
loa-main/.claude/schemas/straylight-artifact-source.schema.json
loa-main/evals/straylight/
  recall-pack-fixtures/
  policy-fixtures/
  audit-fixtures/
```

---

# 24. Success criteria

## 24.1 MVP success criteria

MVP is successful when:

1. An actor estate can be created.
2. Signed assertions can be admitted.
3. Assertions have class/status/provenance/signature.
4. Class validation rejects invalid objects.
5. Policy validation rejects unauthorized transitions.
6. Keyring competence is enforced.
7. Assertions can be challenged, demoted, revoked, and forgotten from recall.
8. A governed recall pack can be generated for a specific task/environment/risk profile.
9. Revoked/private/sealed/forgotten material is excluded as expected.
10. Contested/demoted material is marked or excluded as expected.
11. Recall emits receipt.
12. Mutations emit audit events.
13. Optional commitment root can be computed without leaking hidden estate.
14. Eval fixtures prove the above.
15. Existing Loa stack remains intact.

## 24.2 Product success criteria

Product is on-track if operators can say:

- “This agent did not just remember something; it used authorized estate material.”
- “This assertion was active at the time of recall.”
- “This revoked assertion was excluded.”
- “This private assertion did not leak into public Discord.”
- “This identity-affecting reflection did not mutate identity without signer competence.”
- “This output has a receipt.”

## 24.3 Architecture success criteria

Architecture is on-track if:

- schema, runtime, recall, community surface, and workflow responsibilities are separated;
- repo ownership claims are evidence-backed;
- Straylight primitives remain first-class;
- existing repos are extended, not replaced;
- vector/RAG/retrieval remains implementation strategy under governed recall;
- model providers remain provenance, not authority;
- audit can reconstruct state transitions.

---

# 25. Final implementation stance

Loa-Straylight should be built as a thin primitive layer over the current Loa stack:

```text
Hounfour defines the contracts.
Finn enforces transitions and emits audit.
Dixie exposes recall/control-plane APIs.
Freeside supplies community/bot surfaces and tenant/event frames.
Loa gates workflow, verification, and evaluation.
A Straylight semantic home keeps the doctrine from being absorbed into the wrong repo.
```

The dangerous path is to build another memory product and call it Straylight. The correct path is to implement continuity-under-authorization: signed estate assertions, explicit transition authority, governed recall, challenge/revocation, receipts, and commitments.

The first wedge should prove only that.
