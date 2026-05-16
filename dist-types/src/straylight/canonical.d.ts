import type { Hash } from './types.js';
export declare function canonicalize(value: unknown): string;
export declare function sha256(value: unknown): Hash;
export declare function shortHash(h: Hash, n?: number): string;
