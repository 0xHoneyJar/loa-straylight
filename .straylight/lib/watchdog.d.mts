// Type surface for tests/tooling. Runtime source of truth: watchdog.mjs
export interface WatchdogAction {
  type: string;
  lane_id: string;
  dedupe_key: string;
  detail: string;
  event_type?: string;
  sequence?: number;
  prior_state?: string;
  requested_state?: string;
}
export interface ScanResult {
  ok: boolean;
  refusal?: string;
  detail?: string;
  actions: WatchdogAction[];
}
export declare function scan(
  lanes: Array<Record<string, any>>,
  policy: Record<string, any>,
  context?: { now?: string; pr_heads?: Record<string, string>; last_activity?: Record<string, string> }
): ScanResult;
