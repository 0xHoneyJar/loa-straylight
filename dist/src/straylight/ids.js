// Deterministic ID generation based on content hash + prefix.
//
// MVP IDs are content-addressed: derived from a canonicalized payload + a
// caller-supplied salt (typically a counter or timestamp source). Tests can
// pin the salt to keep fixtures stable.
import { sha256, shortHash } from './canonical.js';
export function contentId(payload, opts) {
    const h = sha256({ payload, salt: opts.salt ?? '' });
    return `${opts.prefix}_${shortHash(h, opts.hashLen ?? 12)}`;
}
export function payloadHash(payload) {
    return sha256(payload);
}
// Monotonic, deterministic ID source for a single test/run. Useful when
// callers don't have a natural salt. The seed is mixed into the hash so
// order-independent payloads still get distinct IDs.
export function makeIdSource(seed) {
    let n = 0;
    return {
        next(prefix, payload) {
            n += 1;
            return contentId(payload ?? { n }, { prefix, salt: `${seed}:${n}` });
        },
        reset() {
            n = 0;
        },
    };
}
