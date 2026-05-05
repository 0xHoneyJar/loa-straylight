// Deterministic canonicalization + hashing helpers.
//
// MVP uses a small JCS-shaped serializer (sorted object keys, no whitespace,
// numbers via JSON.stringify). It is sufficient for fixture-grade determinism
// in a single-process Node runtime. It is NOT RFC 8785 conformant; production
// must replace this with a real JCS implementation.

import { createHash } from 'node:crypto';
import type { Hash } from './types.js';

export function canonicalize(value: unknown): string {
  return stringify(value);
}

export function sha256(value: unknown): Hash {
  const bytes = typeof value === 'string' ? value : canonicalize(value);
  const digest = createHash('sha256').update(bytes).digest('hex');
  return `sha256:${digest}`;
}

export function shortHash(h: Hash, n = 12): string {
  const idx = h.indexOf(':');
  const hex = idx >= 0 ? h.slice(idx + 1) : h;
  return hex.slice(0, n);
}

function stringify(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) {
      throw new Error(`canonicalize: non-finite number ${String(v)}`);
    }
    return JSON.stringify(v);
  }
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) {
    return '[' + v.map(stringify).join(',') + ']';
  }
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const k of keys) {
      const child = obj[k];
      if (child === undefined) continue;
      parts.push(JSON.stringify(k) + ':' + stringify(child));
    }
    return '{' + parts.join(',') + '}';
  }
  throw new Error(`canonicalize: unsupported value type ${typeof v}`);
}
