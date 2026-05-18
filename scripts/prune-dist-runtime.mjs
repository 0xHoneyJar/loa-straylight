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
// `from "..."` specifiers (relative-only) recursively and accumulate
// the closure. Then delete every `.js` file under `dist/` that is not
// in the closure. Empty directories are removed.

import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DIST = resolve(ROOT, 'dist');
const ENTRY = resolve(
  DIST,
  'src/straylight/runtime/recall-intake/index.js',
);

if (!existsSync(ENTRY)) {
  console.error(`prune-dist-runtime: entry missing at ${ENTRY}`);
  process.exit(1);
}

/** @param {string} abs */
function walkClosure(abs) {
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
    // Match `from "<path>"` and `import("<path>")` for relative
    // specifiers only. Bare specifiers (`node:crypto`, npm packages)
    // are not part of dist/.
    const importPattern = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g;
    let m;
    while ((m = importPattern.exec(text)) !== null) {
      const next = resolve(dirname(cur), m[1]);
      if (!seen.has(next)) stack.push(next);
    }
  }
  return seen;
}

const closure = walkClosure(ENTRY);

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

/** Recursively remove empty directories under DIST. */
/** @param {string} dir */
function pruneEmptyDirs(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const abs = resolve(dir, entry);
    if (statSync(abs).isDirectory()) {
      pruneEmptyDirs(abs);
    }
  }
  if (readdirSync(dir).length === 0 && dir !== DIST) {
    rmSync(dir, { recursive: true });
  }
}
pruneEmptyDirs(DIST);

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
