// Phase 31F — CLI entrypoint for the operator recall wedge demo.
//
// Documented operator command (the canonical, machine-parseable form):
//   npm run --silent demo:recall-wedge > /tmp/phase-31f-demo-output.json
//
// `--silent` is required when redirecting stdout to a file: without it,
// npm prints a two-line lifecycle banner ("> @loa/straylight@...
// demo:recall-wedge / > vite-node scripts/demo-recall-wedge-31f.ts")
// before the JSON, which breaks `JSON.parse` on the captured file.
//
// Demo logic lives in ./demo-recall-wedge-31f.lib.ts so the Phase 31F test
// can import buildRecallWedgeDemoReport without triggering CLI side effects.

import { buildRecallWedgeDemoReport } from './demo-recall-wedge-31f.lib.js';

try {
  const report = buildRecallWedgeDemoReport();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} catch (err) {
  console.error('demo failed:', err);
  process.exitCode = 1;
}
