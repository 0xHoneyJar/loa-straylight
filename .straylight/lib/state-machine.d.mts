// Type surface for tests/tooling. Runtime source of truth: state-machine.mjs
export declare const STATES: readonly string[];
export declare const TERMINAL_STATES: readonly string[];
export declare const ROLES: readonly string[];
export declare const VERDICTS: readonly string[];
export declare const EVENT_TYPES: Readonly<
  Record<string, { role: string[]; from: string[] | "*"; to: string | null }>
>;
export declare const OPERATOR_DECISION_TARGETS: readonly string[];
export declare const NEXT_ACTOR: Readonly<Record<string, string>>;
export declare function isState(value: unknown): boolean;
export declare function isRole(value: unknown): boolean;
export declare function isTerminal(state: string): boolean;
export declare function isTransitionAllowed(state: string, eventType: string, role: string): boolean;
export declare function nextActorFor(state: string): string;
