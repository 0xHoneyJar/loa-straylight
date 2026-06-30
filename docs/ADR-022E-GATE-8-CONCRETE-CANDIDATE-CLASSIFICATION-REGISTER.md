# ADR-022E Gate #8 Concrete Candidate Classification Register

## 1. Status

Phase: 49I  
Scope: docs-only concrete-candidate ranking / recommendation-preparation gate  
Artifact role: classification register  
Result: `CONCRETE_CANDIDATE_CLASSIFICATION_REGISTER_RECORDED`

This artifact records the Phase 49I candidate classifications permitted by Phase 49H. The Phase 49H elimination / hold boundary authorized later-gate status vocabulary without allowing final rejection or permanent elimination: `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-ELIMINATION-HOLD-BOUNDARY-GATE.md:11`. The Phase 49H recommendation-lane authorization authorized a later docs-only recommendation-preparation gate without authorizing host acceptance, adapter proposal, implementation, production wiring, or gate satisfaction: `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-LANE-AUTHORIZATION-GATE.md:11`.

## 2. Classification boundary

This register is the only canonical Phase 49I classification table.

The statuses below are current Phase 49I recommendation-preparation classifications only. They are not acceptance, host selection, production database selection, adapter proposal, implementation authorization, production wiring authorization, sibling PR authorization, gate #8 satisfaction, D.1(ii) resolution, D.1 satisfaction, D.2 start, or MVP-2 closure.

The ranking basis is recorded in the Phase 49I ranking gate: `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RANKING-GATE.md:12`. The preferred-candidate recommendation packet is recorded separately: `docs/ADR-022E-GATE-8-CONCRETE-CANDIDATE-RECOMMENDATION-PACKET.md:10`.

## 3. Canonical classification table

| Candidate | Phase 49I classification | Classification rationale |
| --- | --- | --- |
| `Railway PostgreSQL` | `PREFERRED_FOR_RECOMMENDATION_REQUEST` | Preferred for recommendation request at current docs-only decision-preparation grain because it combines PostgreSQL engine fit with a managed deployment-provider candidate shape while preserving later sibling-owner evidence, adapter authority, candidate-acceptance authority, and implementation authority blockers. |
| `Supabase Postgres` | `HELD_FOR_RESIDUAL_GAP` | Held because it remains a viable managed Postgres candidate, but product-surface and platform-boundary residuals, storage/auth coupling posture, sibling-owner evidence, adapter authority, and implementation authority remain unresolved. |
| `Neon Postgres` | `HELD_FOR_RESIDUAL_GAP` | Held because it remains a viable managed/serverless Postgres candidate, but serverless, branching, and recovery semantics require deeper candidate-specific boundary evidence, sibling-owner evidence, adapter authority, and implementation authority. |
| `PostgreSQL` | `NOT_PREFERRED_AT_CURRENT_GRAIN` | Not preferred at current grain because it is engine-only and cannot by itself provide deployment-provider or managed operational boundary posture without a paired provider. |
| `Self-hosted PostgreSQL on future Straylight-controlled infrastructure` | `NOT_PREFERRED_AT_CURRENT_GRAIN` | Not preferred at current grain because future infrastructure authority, operational ownership, topology, and recovery authority are not available at current grain. |

## 4. Non-final semantics

The preferred-for-recommendation-request classification is not acceptance.

The held-for-residual-gap classification is not rejection.

The not-preferred-at-current-grain classification is not final rejection.

No candidate is permanently eliminated by this register.

No candidate is accepted, selected as host, selected as production database, proposed for adapter implementation, authorized for implementation, authorized for production wiring, or authorized for sibling PRs by this register.

## 5. Blocked state preserved

This register preserves:

- gate #8 remains `OPEN / HELD`;
- gates #9/#10 remain held with `PARTIAL_RECORDED`;
- D.1(ii) remains unresolved;
- D.1 is not satisfied;
- D.2 is not started;
- MVP-2 remains open;
- concrete canonical-store physical host remains unselected;
- production database remains unselected;
- adapter remains unproposed;
- implementation remains unauthorized.

## 6. Scope and no-leak posture

This register adds no external evidence and no external URLs.

It contains no credentials, credential values, secrets, API keys, tokens, private keys, connection strings, deployment endpoints, ports, account identifiers, project identifiers, regions, topology, production wiring, deployment steps, commands, env-var values, API examples, curl examples, database URLs, pricing, or implementation details.

## 7. Return artifact

Return artifact: classification register recorded.

The canonical classifications appear only in section 3.

Next dependent artifacts may refer to this register, but must not duplicate the canonical mapping table.
