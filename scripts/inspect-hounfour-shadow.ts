// Phase 17B -- Hounfour v8.5.x shadow inspector CLI.
//
// Usage:
//   npm run hounfour:shadow-inspect
//
// Calls the pure inspector library, prints a summary, and writes a
// JSON report to .run/hounfour-shadow-report.json. The report
// classifies each Straylight schema candidate (under
// fixtures/schema-candidates/) against the actually-shipped
// Hounfour v8.5.x schema surface (under
// node_modules/@0xhoneyjar/loa-hounfour/schemas/).
//
// This script:
//   * does NOT import from @0xhoneyjar/loa-hounfour at the JS module
//     boundary (subpath discipline preserved per delta #9; the
//     alias module src/straylight/hounfour-alias.ts is the only
//     place Hounfour names appear as JS imports)
//   * does NOT import from sibling repos
//   * does NOT import from .loa or .claude framework internals
//   * does NOT call any GitHub API or make network requests
//   * does NOT mutate any source / fixture / doc / test
//
// Exit code is 1 when the inspector surfaces any Hounfour-side
// blocker (e.g. a required v8.5.0 schema is missing, or a
// deferred-cycle-005 schema accidentally ships in v8.5.x).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  inspect,
  summarizeReport,
} from './inspect-hounfour-shadow.lib.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const REPORT_DIR = resolve(ROOT, '.run');
const REPORT_PATH = resolve(REPORT_DIR, 'hounfour-shadow-report.json');

try {
  const report = inspect();
  console.log(summarizeReport(report));

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
  console.log(`\nwrote ${REPORT_PATH}`);

  if (report.blockers.length > 0) {
    console.error(
      `\n${report.blockers.length} blocker(s) surfaced -- see report.`,
    );
    process.exitCode = 1;
  }
} catch (err) {
  console.error('hounfour:shadow-inspect failed:', err);
  process.exitCode = 1;
}
