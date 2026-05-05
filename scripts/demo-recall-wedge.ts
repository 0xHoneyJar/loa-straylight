// CLI entrypoint for the Phase 4 Straylight Recall Wedge demo.
//
// Run via:  npm run demo:recall
//
// All demo logic lives in ./demo-recall-wedge.lib.ts so tests can import
// `runDemo` without triggering CLI side effects.

import { runDemo } from './demo-recall-wedge.lib.js';

try {
  runDemo();
} catch (err) {
  console.error('demo failed:', err);
  process.exitCode = 1;
}
