#!/usr/bin/env node
// Phase 50A — launcher for the operator-runnable two-host proof.
//
// Delegates to `vite-node scripts/phase-50a/two-host-proof.ts` (the repository's
// existing pattern for TypeScript scripts) so `npm run phase-50a:proof` works
// the same way on every platform.

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const result = spawnSync(
  'npx',
  ['vite-node', 'scripts/phase-50a/two-host-proof.ts', ...process.argv.slice(2)],
  {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
);

if (result.error !== undefined) {
  process.stderr.write(`phase-50a: failed to launch the proof: ${result.error.message}\n`);
  process.exit(1);
}
process.exit(result.status ?? 1);
