import type { Hash, ID } from './types.js';
export interface IdOptions {
    prefix: string;
    salt?: string;
    hashLen?: number;
}
export declare function contentId(payload: unknown, opts: IdOptions): ID;
export declare function payloadHash(payload: unknown): Hash;
export declare function makeIdSource(seed: string): {
    next(prefix: string, payload?: unknown): ID;
    reset(): void;
};
