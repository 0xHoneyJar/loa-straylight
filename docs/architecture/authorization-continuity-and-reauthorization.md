# Authorization Continuity, Expiry, and Reauthorization

_Status: architecture clarification._  
_Parent context: `docs/architecture/loa-straylight-product-system-architecture-spec.md` §9.2 Policy validation._  
_Origin: implementation-derived evidence from Autonomous Execution Control Plane lease expiry/requeue behavior during Phase 50A._

## Normative architecture clarification

Authority is evaluated at the time a transition is requested. Evidence that authority existed previously is not, by itself, evidence that the same authority exists now.

A permission assertion, prior policy decision, delegation, grant, or other authorization may remain permanently inspectable as historical estate state after its authority expires, is revoked, is suspended, is superseded, or otherwise ceases to apply. That historical record proves that the authorization existed under the conditions that governed it at that time. It **MUST NOT** silently authorize a new transition after those conditions cease to hold.

Therefore:

- expiration changes **forward authority** without rewriting prior validity;
- revocation changes **forward authority** without erasing the authorization or actions validly taken under it;
- suspension prevents further authorized use while preserving the historical record;
- a prior successful action does not confer authority for another action;
- a stored permission, signature, plan, model output, or previous authorization receipt cannot reactivate itself;
- continuation after authority has ceased requires a new governed authorization decision.

Reauthorization, renewal, or regrant **MAY** reference a previous authorization, but it is a new authority-bearing transition. It must be evaluated against the current estate state, current policy, current signer competence, current controller state, current environment frame, current risk, applicable revocations, and the scope of the requested transition.

Straylight does **not** require every authorization to have a short fixed lifetime. Temporal, conditional, event-bound, revocation-bound, or persistent authority are policy choices. The invariant is that whatever boundary policy declares **MUST** be enforced, and crossing that boundary **MUST NOT** happen merely because the actor previously possessed authority.

> **Authorization continuity must itself be authorized.**

Where continuity is allowed after such a boundary, the continuation itself must be authorized.

Receipts for an expired, revoked, or renewed authorization **SHOULD** make it possible to inspect:

- the prior authorization reference;
- the conditions under which it was valid;
- why its forward authority ceased;
- any attempted use after that point;
- the new authorization decision, if one exists;
- the competent signer or policy authority responsible for that decision;
- the resulting scope and conditions of renewed authority.

## Implementation-derived evidence

The Autonomous Execution Control Plane provides an early operational example of this shape: a work lease can be historically valid, expire without deleting its history, lose force for future lane transitions, and require fresh authorization before work may continue.

That behavior is useful architecture evidence, but it is **not** evidence that the current development workers are already governed by Straylight. ChatGPT, Claude, Codex, GitHub Actions, and other systems building Straylight remain external development actors unless and until an explicit integration places them under Straylight estate, policy, permission, and transition semantics.

The lesson is therefore about the desired authorization invariant, not about inheriting the current development-control-plane implementation as the future Straylight runtime.

## Architecture consequence

Future Straylight permission, delegation, controller-transfer, action-gateway, and commitment designs should distinguish at least:

1. the historical fact that authority was granted;
2. the interval or conditions under which it carried forward force;
3. the transition that ended or suspended that force;
4. any later transition that explicitly grants continuation.

No implementation should infer present authority solely from stored evidence of past authority.
