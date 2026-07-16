// Type surface for tests/tooling. Runtime source of truth: markers.mjs
export declare const MARKERS: Readonly<{
  lane: string;
  event: string;
  taskPacket: string;
  audit: string;
  reducerResult: string;
  watchdogResult: string;
  mergeGuardResult: string;
}>;
export type ExtractResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: string };
export declare function extractPayload(body: unknown, marker: string): ExtractResult;
export declare function renderPayload(marker: string, value: unknown): string;
export declare function hasMarker(body: unknown, marker: string): boolean;
