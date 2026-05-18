// Vitest global setup. Runs once before any test file is imported.
//
// Two responsibilities:
//
//   1. Pre-build `dist-types/` and `dist/` so test files exercising
//      `@loa/straylight/host` (Phase 24H) and
//      `@loa/straylight/runtime/recall-intake` (Phase 26B) can run in
//      parallel without racing on the build's `clean:dist` step.
//
//   2. Pre-compute `npm pack --dry-run --json` once and stash it under
//      `.vitest/pack-dry-run.json`. The `npm pack` lifecycle in npm@7+
//      unconditionally runs the `prepare` script (NOT controlled by
//      `--ignore-scripts`), and `prepare` is `npm run build` which
//      begins with `clean:dist`. Running `npm pack` *during* the test
//      run therefore wipes `dist/` and rebuilds it, racing with
//      subprocess imports in other test files that resolve through the
//      symlinked package's `dist/` directory. Pre-computing eliminates
//      the in-test race.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const REQUIRED = [
  resolve(ROOT, 'dist-types/src/straylight/index.d.ts'),
  resolve(ROOT, 'dist-types/src/straylight/host/index.d.ts'),
  resolve(
    ROOT,
    'dist-types/src/straylight/runtime/recall-intake/index.d.ts',
  ),
  resolve(ROOT, 'dist/src/straylight/runtime/recall-intake/index.js'),
];

const PACK_CACHE_DIR = resolve(ROOT, '.vitest');
const PACK_CACHE_FILE = resolve(PACK_CACHE_DIR, 'pack-dry-run.json');

export async function setup(): Promise<void> {
  if (!REQUIRED.every((p) => existsSync(p))) {
    execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'pipe' });
  }
  // Pre-compute npm pack output. This invocation is the LAST place
  // `clean:dist` + rebuild happens before tests start; once we return,
  // dist/ is in its post-build state and stays that way for the rest
  // of the test run.
  const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).toString('utf8');
  mkdirSync(PACK_CACHE_DIR, { recursive: true });
  writeFileSync(PACK_CACHE_FILE, output, 'utf8');
}

export async function teardown(): Promise<void> {
  // No-op. Build outputs persist across runs.
}
