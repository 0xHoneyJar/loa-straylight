#!/usr/bin/env node
// Phase 50A — run the PostgreSQL proof suites with the opt-in engaged.
//
// `npm run phase-50a:test` routes through this launcher rather than setting an
// inline environment variable in the npm script, because inline `VAR=value`
// prefixes are POSIX-shell syntax and would not run on Windows `cmd`. The
// launcher sets the opt-in in the child environment portably.
//
// Under the opt-in the suites REQUIRE both harness instances and FAIL (never
// skip) when either is unreachable. Without it, plain `npm test` skips them
// and says so in an always-executed gate test. See tests/phase-50a/_support.ts.

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const extra = process.argv.slice(2);
const result = spawnSync(
  'npx',
  ['vitest', 'run', 'tests/phase-50a', ...extra],
  {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, STRAYLIGHT_PHASE_50A_POSTGRES: '1' },
  },
);

if (result.error !== undefined) {
  process.stderr.write(`phase-50a: failed to launch vitest: ${result.error.message}\n`);
  process.exit(1);
}
process.exit(result.status ?? 1);
