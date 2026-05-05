// Phase 6 — schema candidate exporter CLI.
//
// Usage:
//   npm run schema:candidates
//
// Writes the current-shape JSON examples to fixtures/schema-candidates/.
// All logic lives in ./export-schema-candidates.lib.ts so tests can import
// `buildCandidates` / `listCandidateFiles` without triggering disk writes.
//
// These are NOT canonical Hounfour schemas — they are local examples of
// current Straylight object shape, useful as pre-extraction review input.
// See docs/schema-candidates/README.md.

import { writeCandidateFiles } from './export-schema-candidates.lib.js';

try {
  const { outDir, written } = writeCandidateFiles();
  for (const p of written) console.log(`wrote ${p}`);
  console.log(`\n${written.length} schema-candidate fixtures written to ${outDir}`);
  console.log('reminder: these are CURRENT-SHAPE examples, not canonical Hounfour schemas.');
} catch (err) {
  console.error('schema-candidates export failed:', err);
  process.exitCode = 1;
}
