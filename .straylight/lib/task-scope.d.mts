// Type surface for tests/tooling. Runtime source of truth: task-scope.mjs
//
// Task-packet EFFECT SCOPE semantics. A positive result establishes ONLY the
// task-packet scope component of implementer authorization — never execution,
// model-launch, worktree, push, PR, event or lane-continuation authority. See
// the module header for the full conjunction and where each other component
// lives.

/** The one authorization component a positive result establishes. */
export declare const TASK_PACKET_SCOPE_COMPONENT: "task-packet-effect-scope";

/** The closed implementer effect vocabulary this module governs. */
export declare const IMPLEMENTER_EFFECTS: readonly ["modify-worktree", "open-pr"];

/** The closed refusal vocabulary. */
export declare const SCOPE_REFUSALS: readonly string[];

export type ImplementerEffect = (typeof IMPLEMENTER_EFFECTS)[number];

export type TaskScopeResult =
  | { ok: true; component: typeof TASK_PACKET_SCOPE_COMPONENT }
  | { ok: false; refusal: string; detail: string };

/**
 * Does this packet's declared scope permit this proposed implementer effect?
 *
 * Pure and total. Defines the semantics; performs no effect. The packet is
 * validated through validate.mjs#validateTaskPacket (the single task-packet
 * validator), so arbitrary JSON is refused. Reconstruction, actor
 * authentication, lane turn, admission epoch and lease remain owned
 * elsewhere and must be conjoined with this result by the caller.
 *
 * `may_open_pr` gates ONLY `open-pr`. Forbidden scope wins over allowed for
 * every path. One refused path refuses the whole determination.
 *
 * ONE canonical path language is applied to `allowed_paths` entries,
 * `forbidden_paths` entries and proposed changed paths alike: a structurally
 * valid packet string is NOT necessarily a canonical task-scope path, and
 * non-canonical input is refused rather than normalized. No pattern language
 * is implemented; syntax the protocol does not define may only reduce
 * permission or refuse the determination, never expand it.
 */
export declare function evaluateTaskPacketScopeComponent(input: {
  packet: unknown;
  changed_paths: unknown;
  requested_effect: unknown;
}): TaskScopeResult;
