// Phase 19A conformance — Hounfour v8.5.x upstream-review packet.
//
// Pins (small, doc/index-focused only):
//   * the review packet exists and is non-trivial
//   * the packet contains a ready-to-copy GitHub comment for
//     Hounfour issue #70 (fenced markdown block referencing the
//     issue URL)
//   * the packet records the required Phase 17B + Phase 18
//     findings (package consumption works; resolves within
//     `^8.5.0`; the 15 net-new v8.5.x schemas are present;
//     `Challenge` and `EstateTransition` deferred to v8.6.0;
//     `audit-event-transition` is `DISCOVERY_NOTE`, not blocker;
//     `safeCanonicalize` subpath remains deferred under gate
//     `no-confirmed-subpath`)
//   * the packet records the required non-claims (no Finn / Dixie
//     / Freeside runtime wiring; no sibling-repo inspection or
//     fallback; alias boundary remains private)
//   * docs/handoffs/README.md references the packet
//   * docs/handoffs/cross-repo-handoff-index.md references the
//     packet
//
// These pins prove the Phase 19A coordination artifact is
// internally consistent and discoverable from the existing handoff
// indexes. They do NOT re-prove the Phase 17B + Phase 18 evidence
// (that lives in tests/hounfour-shadow-integration.test.ts).

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const HANDOFF_DIR = resolve(ROOT, 'docs/handoffs');
const PACKET_DOC = resolve(HANDOFF_DIR, 'hounfour-v850-shadow-review-packet.md');
const HANDOFF_README = resolve(HANDOFF_DIR, 'README.md');
const CROSS_REPO_INDEX = resolve(HANDOFF_DIR, 'cross-repo-handoff-index.md');

const PACKET_BASENAME = 'hounfour-v850-shadow-review-packet.md';
const ISSUE_70_URL = 'https://github.com/0xHoneyJar/loa-hounfour/issues/70';

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

describe('phase 19A — Hounfour v8.5.x upstream-review packet exists', () => {
  it('the review packet doc exists', () => {
    expect(existsSync(PACKET_DOC), `${PACKET_DOC} should exist`).toBe(true);
  });

  it('the review packet is non-trivial (>1KB)', () => {
    expect(read(PACKET_DOC).length).toBeGreaterThan(1024);
  });
});

describe('phase 19A — packet carries a ready-to-copy comment for Hounfour issue #70', () => {
  it('the packet has a heading announcing the ready-to-copy comment for issue #70', () => {
    const src = read(PACKET_DOC);
    expect(
      /##\s+Ready-to-copy comment for issue #70/i.test(src),
      'packet must carry a heading announcing the ready-to-copy comment for issue #70',
    ).toBe(true);
  });

  it('the packet links to the Hounfour issue #70 URL', () => {
    const src = read(PACKET_DOC);
    expect(
      src.includes(ISSUE_70_URL),
      `packet must reference ${ISSUE_70_URL}`,
    ).toBe(true);
  });

  it('the packet contains a fenced markdown block (the comment body)', () => {
    const src = read(PACKET_DOC);
    expect(
      /```markdown[\s\S]*?```/.test(src),
      'packet must include a fenced ```markdown ... ``` block carrying the comment body',
    ).toBe(true);
  });

  it('the fenced markdown block carries the Phase 17B + Phase 18 summary signal', () => {
    const src = read(PACKET_DOC);
    const blockMatch = src.match(/```markdown([\s\S]*?)```/);
    expect(blockMatch, 'expected exactly one ```markdown ... ``` block in the packet').not.toBe(
      null,
    );
    const block = blockMatch?.[1] ?? '';
    expect(
      /Straylight-side shadow-inspection update/i.test(block),
      'the ready-to-copy comment block must announce itself as a Straylight-side shadow-inspection update',
    ).toBe(true);
    expect(
      /@0xhoneyjar\/loa-hounfour@\^?8\.5\.0/i.test(block),
      'the ready-to-copy comment block must reference @0xhoneyjar/loa-hounfour@^8.5.0',
    ).toBe(true);
  });
});

describe('phase 19A — packet records the required Phase 17B + Phase 18 findings', () => {
  // Each pin is a regex against the packet text. The regex is
  // deliberately broad — Phase 19A is a summary, not a re-derivation
  // — but specific enough that a future edit removing the fact would
  // fail the pin.
  const REQUIRED_FACTS: { name: string; pattern: RegExp }[] = [
    {
      name: 'package consumption works (typecheck clean / npm test green)',
      pattern: /package consumption works/i,
    },
    {
      name: 'resolves within ^8.5.0 / v8.5.x line',
      pattern: /resolves within `?\^8\.5\.0`?/i,
    },
    {
      name: '15 net-new v8.5.0 schemas (delta #12) are present',
      pattern: /15 net-new v8\.5\.0 schemas/i,
    },
    {
      name: '`Challenge` deferred to v8.6.0 (delta #7)',
      pattern: /`?Challenge`?[\s\S]{0,400}(deferred to|v8\.6\.0|cycle-005)/i,
    },
    {
      name: '`EstateTransition` deferred to v8.6.0 (delta #8)',
      pattern: /`?EstateTransition`?[\s\S]{0,400}(deferred to|v8\.6\.0|cycle-005)/i,
    },
    {
      name: '`audit-event-transition` classified as DISCOVERY_NOTE, not blocker',
      pattern: /audit-event-transition[\s\S]{0,400}DISCOVERY_NOTE/i,
    },
    {
      name: '`safeCanonicalize` subpath deferred under gate `no-confirmed-subpath`',
      pattern: /safeCanonicalize[\s\S]{0,400}no-confirmed-subpath/i,
    },
  ];

  for (const { name, pattern } of REQUIRED_FACTS) {
    it(`packet records: ${name}`, () => {
      const src = read(PACKET_DOC);
      expect(pattern.test(src), `packet must record fact: ${name}`).toBe(true);
    });
  }

  const REQUIRED_NON_CLAIMS: { name: string; pattern: RegExp }[] = [
    {
      name: 'no Finn / Dixie / Freeside runtime wiring',
      pattern: /No Finn[\s\/]+Dixie[\s\/]+Freeside runtime wiring/i,
    },
    {
      name: 'no sibling-repo inspection or fallback',
      pattern: /No sibling-repo inspection[\s\S]{0,80}fork/i,
    },
    {
      name: 'Straylight alias boundary remains private (index.ts unchanged)',
      pattern: /alias boundary remains private/i,
    },
  ];

  for (const { name, pattern } of REQUIRED_NON_CLAIMS) {
    it(`packet records non-claim: ${name}`, () => {
      const src = read(PACKET_DOC);
      expect(pattern.test(src), `packet must record non-claim: ${name}`).toBe(true);
    });
  }
});

describe('phase 19A — handoff indexes link to the review packet', () => {
  it('docs/handoffs/README.md references the review packet', () => {
    const src = read(HANDOFF_README);
    expect(
      src.includes(PACKET_BASENAME),
      `${HANDOFF_README} must reference ${PACKET_BASENAME}`,
    ).toBe(true);
  });

  it('docs/handoffs/cross-repo-handoff-index.md references the review packet', () => {
    const src = read(CROSS_REPO_INDEX);
    expect(
      src.includes(PACKET_BASENAME),
      `${CROSS_REPO_INDEX} must reference ${PACKET_BASENAME}`,
    ).toBe(true);
  });
});
