#!/usr/bin/env node
// Phase 26B — prune dist/ to the runtime closure of the recall-intake
// barrel.
//
// Why this exists:
//   * `tsconfig.runtime.json` is narrowed to a single entry file
//     (`src/straylight/runtime/recall-intake/index.ts`) so tsc only
//     includes files reachable from that entry. tsc's include graph
//     follows `import type` references too — those files are pulled
//     into the compilation but the emitted JS never imports them at
//     runtime. tsc does not natively prune them from `dist/`.
//   * The package's `exports` map only exposes
//     `./runtime/recall-intake`. Keeping unreachable wedge JS in
//     `dist/` would (a) bloat the tarball and (b) leave files that
//     conflict with the ADR-026A §5 rule that root `.` and `./host`
//     remain `"types"`-only — the unused JS isn't reachable through
//     the exports map but still ships in the tarball.
//   * Pruning keeps `dist/` byte-equal to the runtime closure. The
//     committed `dist/` artifact thereby contains exactly the JS the
//     runtime subpath needs and nothing else.
//
// Algorithm: starting from the runtime barrel's emitted JS, walk
// relative-only specifiers recursively and accumulate the closure.
// Then delete every `.js` file under `dist/` that is not in the
// closure. Empty directories are removed.
//
// Phase 26B-F (W1): the walker MUST recognise every relative-import
// shape tsc can emit, including bare side-effect imports of the form
// `import "./polyfill.js"` (no `from`, no binding). Under-recognition
// here would silently delete a polyfill / side-effect module that the
// runtime closure depends on. The walker is exported and unit-tested
// in `tests/phase-26b-runtime-recall-intake.test.ts` so a future
// emit-shape regression cannot pass silently.

import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DIST = resolve(ROOT, 'dist');
const ENTRY = resolve(
  DIST,
  'src/straylight/runtime/recall-intake/index.js',
);

// Relative-import shapes the walker recognises. All four patterns
// match RELATIVE specifiers only (`./` or `../`); bare specifiers
// (`node:crypto`, `@scope/pkg`, `pkg`) are intentionally skipped
// because they are not part of `dist/` and never need pruning.
//
//   1. static `from`-bearing imports:
//        import x from './x.js'
//        import { x } from './x.js'
//        import * as x from './x.js'
//        import x, { y } from './x.js'
//      and re-export forms (handled by the same `from` token):
//        export * from './x.js'
//        export { x } from './x.js'
//        export { x as y } from './x.js'
//   2. dynamic ESM import:
//        import('./x.js')
//        await import('./x.js')
//   3. bare side-effect import (no binding, no `from`):
//        import './x.js';
//      tsc emits this shape for files imported solely for their
//      side effects (registering a polyfill, mutating a global,
//      etc.); under-recognition here is the W1 bug class.
//
// Each pattern is /g and captures the relative specifier in group 1.
// `\s` is used (not `[ \t]`) so newlines between tokens are tolerated.

/** @internal */
const STATIC_FROM_RE = /\bfrom\s+['"](\.[^'"\n]+)['"]/g;
/** @internal */
const DYNAMIC_IMPORT_RE = /\bimport\s*\(\s*['"](\.[^'"\n]+)['"]\s*\)/g;
/** @internal */
const BARE_SIDE_EFFECT_RE = /\bimport\s+['"](\.[^'"\n]+)['"]/g;

/**
 * Extract every relative-import specifier referenced by the given
 * source text. Pure function; deterministic; no I/O. Exported for
 * unit testing.
 *
 * @param {string} source - JS source text (typically a file under
 *   `dist/`).
 * @returns {string[]} relative specifiers, in insertion order, with
 *   duplicates collapsed. Bare specifiers are NOT returned.
 */
export function extractRelativeSpecifiers(source) {
  /** @type {Set<string>} */
  const seen = new Set();
  const collect = (re) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source)) !== null) {
      seen.add(m[1]);
    }
  };
  collect(STATIC_FROM_RE);
  collect(DYNAMIC_IMPORT_RE);
  collect(BARE_SIDE_EFFECT_RE);
  return [...seen];
}

/**
 * Walk the runtime closure starting at `abs`. Follows every relative
 * specifier returned by {@link extractRelativeSpecifiers}; resolves
 * each against the importer's directory. Bare specifiers (npm / node:)
 * are skipped — they are never under `dist/`.
 *
 * @param {string} abs - absolute path of the entry JS file.
 * @returns {Set<string>} absolute paths reachable from the entry.
 */
export function walkClosure(abs) {
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {string[]} */
  const stack = [abs];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (cur === undefined || seen.has(cur)) continue;
    if (!existsSync(cur)) continue;
    seen.add(cur);
    const text = readFileSync(cur, 'utf8');
    for (const spec of extractRelativeSpecifiers(text)) {
      const next = resolve(dirname(cur), spec);
      if (!seen.has(next)) stack.push(next);
    }
  }
  return seen;
}

/** @param {string} dir @returns {string[]} */
function listAllJs(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    const abs = resolve(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      out.push(...listAllJs(abs));
    } else if (entry.endsWith('.js') || entry.endsWith('.js.map')) {
      out.push(abs);
    }
  }
  return out;
}

/** Recursively remove empty directories under DIST. */
/** @param {string} dir @param {string} root */
function pruneEmptyDirs(dir, root) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const abs = resolve(dir, entry);
    if (statSync(abs).isDirectory()) {
      pruneEmptyDirs(abs, root);
    }
  }
  if (readdirSync(dir).length === 0 && dir !== root) {
    rmSync(dir, { recursive: true });
  }
}

function main() {
  if (!existsSync(ENTRY)) {
    process.stderr.write(
      `prune-dist-runtime: entry missing at ${ENTRY}\n`,
    );
    process.exit(1);
  }

  const closure = walkClosure(ENTRY);
  const all = listAllJs(DIST);
  const removed = [];
  for (const abs of all) {
    // .js.map files are kept iff their `.js` sibling is in the closure;
    // here we strip the `.map` suffix for the membership check.
    const jsAbs = abs.endsWith('.js.map') ? abs.slice(0, -4) : abs;
    if (!closure.has(jsAbs)) {
      rmSync(abs);
      removed.push(relative(ROOT, abs));
    }
  }

  pruneEmptyDirs(DIST, DIST);

  // Write to stderr so this script's output does not pollute the stdout
  // that callers like `npm pack --dry-run --json` capture (the `prepare`
  // lifecycle runs inside that pipe; stdout interleaves into the JSON
  // blob and breaks consumers that JSON.parse the result).
  const log = (msg) => process.stderr.write(`${msg}\n`);
  if (removed.length > 0) {
    log(`prune-dist-runtime: removed ${removed.length} file(s):`);
    for (const r of removed) log(`  - ${r}`);
  } else {
    log('prune-dist-runtime: nothing to prune');
  }
}

// Only run the side-effecting prune when this file is invoked directly
// as a script. When imported (e.g. by the Phase 26B-F walker guard
// test), `main()` is NOT called and the helpers above remain pure.
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main();
}
