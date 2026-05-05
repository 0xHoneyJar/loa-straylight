// Phase 14 conformance — Freeside community / app surface handoff packet.
//
// Pins:
//   * the three Freeside handoff documents under docs/handoffs/ exist
//   * the surface-mapping table references all required community / bot /
//     admin / tenant / Discord / Telegram / REST / NATS surfaces
//   * the issue handoff includes an explicit non-goals section
//   * the boundary doc says Freeside must not treat bot memory as governed
//     recall
//   * the boundary doc says Freeside must not bypass recall receipts
//   * the boundary doc says Freeside must not expose private estate
//     material in public community surfaces
//   * the boundary doc says Freeside must not admit Discord / Telegram /
//     REST / NATS messages as canonical estate truth
//   * the boundary doc says Freeside must not apply community / bot /
//     admin actions without policy validation and a receipt / audit trail
//   * every Freeside fixture is parseable JSON
//   * every Freeside fixture contains case_name, expected_allowed,
//     reason, input, expected_output
//   * the helper script does not import from .loa, .claude, loa-freeside,
//     or any sibling repo
//
// These pins prove the handoff packet is internally consistent and
// does not silently introduce cross-repo coupling. They are NOT a
// substitute for any future loa-freeside community / app surface test
// pack; they only validate the in-repo handoff prep.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const HANDOFF_DIR = resolve(ROOT, 'docs/handoffs');
const ISSUE_DOC = resolve(HANDOFF_DIR, 'freeside-community-surface-issue.md');
const BOUNDARY_DOC = resolve(HANDOFF_DIR, 'freeside-community-surface-boundary.md');
const MAPPING_DOC = resolve(HANDOFF_DIR, 'freeside-surface-mapping.md');
const HELPER_SCRIPT = resolve(ROOT, 'scripts/export-freeside-community-surface-fixtures.ts');
const FIXTURE_DIR = resolve(ROOT, 'fixtures/freeside-community-surface');

function read(p: string): string {
  return readFileSync(p, 'utf8');
}

const REQUIRED_COMMUNITY_SURFACES = [
  'bot_recall_request',
  'bot_recall_response',
  'tenant_scoped_recall',
  'community_scoped_recall',
  'public_channel_redaction',
  'discord_environment_frame_routing',
  'telegram_environment_frame_routing',
  'rest_api_recall_routing',
  'feedback_signal_capture',
  'admin_capability_grant',
  'bot_action_with_receipt',
  'cross_tenant_recall_prevention',
  'challenge_revocation_awareness_community',
  'tenant_admin_estate_inspection',
] as const;

const REQUIRED_FIXTURES = [
  'bot-recall-public-discord.json',
  'bot-recall-public-telegram.json',
  'tenant-admin-recall.json',
  'denied-cross-tenant-recall.json',
  'denied-private-in-public-bot.json',
  'denied-bot-memory-as-recall.json',
  'feedback-signal-as-candidate.json',
  'admin-capability-grant.json',
  'bot-action-with-receipt.json',
  'revoked-forgotten-excluded-bot.json',
] as const;

describe('freeside handoff — handoff documents exist', () => {
  it('docs/handoffs/ directory exists', () => {
    expect(existsSync(HANDOFF_DIR)).toBe(true);
  });

  it.each([
    ['issue handoff', ISSUE_DOC],
    ['boundary doc', BOUNDARY_DOC],
    ['surface mapping', MAPPING_DOC],
  ])('%s document exists', (_label, path) => {
    expect(existsSync(path), `${path} should exist`).toBe(true);
  });

  it.each([
    ['issue handoff', ISSUE_DOC],
    ['boundary doc', BOUNDARY_DOC],
    ['surface mapping', MAPPING_DOC],
  ])('%s document is non-trivial (>1KB)', (_label, path) => {
    expect(read(path).length).toBeGreaterThan(1024);
  });
});

describe('freeside handoff — surface mapping references all required surfaces', () => {
  it('mapping document references every required community / bot / admin / tenant surface', () => {
    const src = read(MAPPING_DOC);
    for (const surface of REQUIRED_COMMUNITY_SURFACES) {
      expect(src.includes(surface), `mapping should reference ${surface}`).toBe(true);
    }
  });

  it('mapping document declares the required column headers', () => {
    const src = read(MAPPING_DOC);
    for (const header of [
      'Straylight primitive / operation',
      'Current Straylight local source',
      'Future Freeside community / app surface',
      'Required input',
      'Required output',
      'Fail-closed condition',
      'Receipt / provenance requirement',
      'Related Hounfour schema candidate',
      'Related Finn enforcement point',
      'Related Dixie BFF surface',
      'Notes',
    ]) {
      expect(src.includes(header), `mapping should include column: ${header}`).toBe(true);
    }
  });

  it('mapping document references at least one Hounfour schema id', () => {
    const src = read(MAPPING_DOC);
    expect(/straylight\.[a-z_]+\.v0/.test(src)).toBe(true);
  });

  it('mapping document references the Finn enforcement mapping', () => {
    const src = read(MAPPING_DOC);
    expect(/finn-enforcement-mapping\.md/.test(src)).toBe(true);
  });

  it('mapping document references the Dixie recall mapping', () => {
    const src = read(MAPPING_DOC);
    expect(/dixie-recall-mapping\.md/.test(src)).toBe(true);
  });
});

describe('freeside handoff — issue handoff includes explicit non-goals', () => {
  it('issue handoff includes an explicit non-goals section', () => {
    const src = read(ISSUE_DOC);
    expect(/##\s+Explicit non-goals/i.test(src)).toBe(true);
  });

  it('issue handoff non-goals forbid Freeside defining canonical schema', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Freeside MUST NOT.*(canonical|schema|define.*shape|schema authority)/is.test(src),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid Freeside performing runtime policy enforcement', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Freeside MUST NOT.*(runtime policy enforcement|bypass(es)? Finn|policy enforcement that bypasses)/is.test(
        src,
      ),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid bot memory as governed recall', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Freeside MUST NOT.*(bot memory|conversation buffer|governed recall|RAG)/is.test(src),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid Discord / Telegram messages as canonical estate truth', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Discord message.*(canonical|estate truth)|Discord.*Telegram.*event.*(canonical|truth|authoritative)|treat a Discord/is.test(
        src,
      ),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid recall without receipt', () => {
    const src = read(ISSUE_DOC);
    expect(/Freeside MUST NOT.*recall without receipt|No recall without receipt/is.test(src)).toBe(
      true,
    );
  });

  it('issue handoff non-goals forbid leaking private estate material', () => {
    const src = read(ISSUE_DOC);
    expect(
      /Freeside MUST NOT.*(actor_private|private estate|sealed)/is.test(src),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid community / bot / admin action without policy validation and receipt / audit trail', () => {
    const src = read(ISSUE_DOC);
    expect(
      /community \/ bot \/ admin action without policy validation|action without policy validation and a receipt|community.*action.*without policy/is.test(
        src,
      ),
    ).toBe(true);
  });

  it('issue handoff non-goals forbid reverse imports', () => {
    const src = read(ISSUE_DOC);
    expect(/(reverse imports|MUST NOT publish a package)/i.test(src)).toBe(true);
  });

  it('issue handoff is framed as a handoff, not completed integration', () => {
    const src = read(ISSUE_DOC);
    expect(
      /handoff packet|not Freeside integration|handoff prep|pre-integration|filing the issue is not part/i.test(
        src,
      ),
    ).toBe(true);
  });
});

describe('freeside handoff — boundary doc pins community / bot / admin rules', () => {
  it('boundary doc says Freeside must not define canonical schema semantics', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Freeside must not define canonical schema semantics/i.test(src)).toBe(true);
  });

  it('boundary doc says Freeside must not perform runtime policy enforcement that bypasses Finn / the wedge', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Freeside must not perform runtime policy enforcement that bypasses Finn/i.test(src),
    ).toBe(true);
  });

  it('boundary doc says Freeside must not treat bot memory as governed recall', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Freeside must not treat bot memory as governed recall/i.test(src)).toBe(true);
  });

  it('boundary doc says Freeside must not treat Discord / Telegram / REST / NATS messages as canonical estate truth', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Freeside must not treat Discord \/ Telegram \/ REST \/ NATS messages as canonical estate truth/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('boundary doc says Freeside must not bypass recall receipts', () => {
    const src = read(BOUNDARY_DOC);
    expect(/Freeside must not bypass recall receipts/i.test(src)).toBe(true);
  });

  it('boundary doc says Freeside must not expose private estate material in public community surfaces', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Freeside must not expose private estate material in public community surfaces/i.test(src),
    ).toBe(true);
  });

  it('boundary doc says Freeside must not treat challenged / revoked / forgotten assertions as ordinary active context', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Freeside must not treat challenged \/ revoked \/ forgotten assertions as ordinary active context/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('boundary doc says Freeside must not apply community / bot / admin actions without policy validation and a receipt / audit trail', () => {
    const src = read(BOUNDARY_DOC);
    expect(
      /Freeside must not apply community \/ bot \/ admin actions without policy validation and a receipt \/ audit trail/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('boundary doc says Freeside must fail closed on privacy / receipt failure', () => {
    const src = read(BOUNDARY_DOC);
    expect(/fail[- ]closed/i.test(src), 'boundary doc must mention fail-closed').toBe(true);
    expect(/recall/i.test(src), 'boundary doc must reference recall').toBe(true);
    expect(/receipt/i.test(src), 'boundary doc must reference receipt').toBe(true);
  });

  it('boundary doc references the wedge as the primitive lane owner', () => {
    const src = read(BOUNDARY_DOC);
    expect(/loa-straylight.*permanently|primitive lane.*loa-straylight/is.test(src)).toBe(true);
  });
});

describe('freeside handoff — fixtures are parseable and well-formed', () => {
  it('all required Freeside fixtures exist on disk', () => {
    const present = new Set(readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.json')));
    for (const f of REQUIRED_FIXTURES) {
      expect(present.has(f), `missing Freeside fixture: ${f}`).toBe(true);
    }
  });

  it.each(REQUIRED_FIXTURES)('%s parses as JSON', (filename) => {
    const path = resolve(FIXTURE_DIR, filename);
    const raw = read(path);
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it.each(REQUIRED_FIXTURES)(
    '%s contains case_name, expected_allowed, reason, input, expected_output',
    (filename) => {
      const path = resolve(FIXTURE_DIR, filename);
      const obj = JSON.parse(read(path)) as Record<string, unknown>;
      expect(typeof obj.case_name).toBe('string');
      expect((obj.case_name as string).length).toBeGreaterThan(0);
      expect(typeof obj.expected_allowed).toBe('boolean');
      expect(typeof obj.reason).toBe('string');
      expect((obj.reason as string).length).toBeGreaterThan(0);
      expect(obj.input).toBeDefined();
      expect(obj.expected_output).toBeDefined();
    },
  );

  it.each(REQUIRED_FIXTURES)('%s reason is non-trivial (>40 chars)', (filename) => {
    const path = resolve(FIXTURE_DIR, filename);
    const obj = JSON.parse(read(path)) as Record<string, unknown>;
    expect((obj.reason as string).length).toBeGreaterThan(40);
  });

  it('every fixture filename mentioned in the issue handoff exists', () => {
    const src = read(ISSUE_DOC);
    for (const f of REQUIRED_FIXTURES) {
      if (src.includes(f)) {
        expect(existsSync(resolve(FIXTURE_DIR, f)), `${f} mentioned but missing on disk`).toBe(
          true,
        );
      }
    }
    for (const f of REQUIRED_FIXTURES) {
      expect(src.includes(f), `issue handoff should reference ${f}`).toBe(true);
    }
  });
});

describe('freeside handoff — helper script and tests have no forbidden imports', () => {
  // Phase 14 must not introduce cross-repo coupling. The helper script,
  // this test file, and all three handoff documents MUST NOT import (or
  // suggest importing) from .loa, .claude, loa-freeside, or any sibling
  // repo.
  const FORBIDDEN_IMPORT_PATTERNS: { name: string; pattern: RegExp }[] = [
    { name: '.loa/', pattern: /from\s+['"][^'"]*\.loa\b/ },
    { name: '.claude/', pattern: /from\s+['"][^'"]*\.claude\b/ },
    { name: 'loa-freeside', pattern: /from\s+['"][^'"]*loa-freeside/ },
    { name: 'loa-dixie', pattern: /from\s+['"][^'"]*loa-dixie/ },
    { name: 'loa-finn', pattern: /from\s+['"][^'"]*loa-finn/ },
    { name: 'loa-hounfour', pattern: /from\s+['"][^'"]*loa-hounfour/ },
    { name: 'loa-eval', pattern: /from\s+['"][^'"]*loa-eval/ },
    { name: '@loa/freeside', pattern: /from\s+['"]@loa\/freeside/ },
    { name: '@loa/dixie', pattern: /from\s+['"]@loa\/dixie/ },
    { name: '@loa/finn', pattern: /from\s+['"]@loa\/finn/ },
    { name: '@loa/hounfour', pattern: /from\s+['"]@loa\/hounfour/ },
    { name: '@loa/eval', pattern: /from\s+['"]@loa\/eval/ },
  ];

  const CODE_FILES = [
    HELPER_SCRIPT,
    resolve(ROOT, 'tests/freeside-community-surface-handoff.test.ts'),
  ];

  it.each(CODE_FILES)('%s contains no forbidden imports', (file) => {
    const src = read(file);
    for (const { name, pattern } of FORBIDDEN_IMPORT_PATTERNS) {
      expect(pattern.test(src), `${file} imports from forbidden source: ${name}`).toBe(false);
    }
  });

  it('helper script imports only from node:* builtins or local repo files', () => {
    const src = read(HELPER_SCRIPT);
    const importPattern = /from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(src.matchAll(importPattern), (m) => m[1] ?? '');
    expect(matches.length, 'helper should declare at least one import').toBeGreaterThan(0);
    for (const spec of matches) {
      const isNodeBuiltin = spec.startsWith('node:');
      const isLocalRelative = spec.startsWith('./') || spec.startsWith('../');
      expect(
        isNodeBuiltin || isLocalRelative,
        `helper script imports must be node:* or relative; got: ${spec}`,
      ).toBe(true);
    }
  });

  it('helper script does not import from sibling repo packages', () => {
    const src = read(HELPER_SCRIPT);
    const importPattern = /from\s+['"]([^'"]+)['"]/g;
    const matches = Array.from(src.matchAll(importPattern), (m) => m[1] ?? '');
    for (const spec of matches) {
      expect(/^@loa\//.test(spec), `helper imports from @loa/ scope: ${spec}`).toBe(false);
      expect(/^loa-/.test(spec), `helper imports from loa- prefix: ${spec}`).toBe(false);
    }
  });

  it('helper script does not claim Freeside integration is complete', () => {
    const src = read(HELPER_SCRIPT);
    expect(
      /handoff prep, not Freeside integration|not Freeside integration|out of scope for Phase 14|not official Freeside fixtures/i.test(
        src,
      ),
    ).toBe(true);
  });

  it('handoff docs do not declare cross-repo runtime imports', () => {
    for (const doc of [ISSUE_DOC, BOUNDARY_DOC, MAPPING_DOC]) {
      const src = read(doc);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/freeside/m.test(src),
        `${doc} declares a runtime import from @loa/freeside`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/dixie/m.test(src),
        `${doc} declares a runtime import from @loa/dixie`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/finn/m.test(src),
        `${doc} declares a runtime import from @loa/finn`,
      ).toBe(false);
      expect(
        /^\s*import\s+[^;]*from\s+['"]@loa\/hounfour/m.test(src),
        `${doc} declares a runtime import from @loa/hounfour`,
      ).toBe(false);
    }
  });
});

describe('freeside handoff — npm script wiring and packet self-description', () => {
  it('package.json declares the freeside:surface script', () => {
    const pkg = JSON.parse(read(resolve(ROOT, 'package.json'))) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts?.['freeside:surface']).toBeDefined();
    expect(pkg.scripts?.['freeside:surface']).toContain(
      'export-freeside-community-surface-fixtures.ts',
    );
  });

  it('top-level README mentions the Phase 14 Freeside handoff packet', () => {
    const src = read(resolve(ROOT, 'README.md'));
    expect(/Phase 14/.test(src)).toBe(true);
    expect(
      /freeside:surface|freeside-community-surface|Freeside community/i.test(src),
    ).toBe(true);
  });

  it('top-level README does not claim Freeside integration is complete', () => {
    const src = read(resolve(ROOT, 'README.md'));
    expect(/Freeside integration complete/i.test(src)).toBe(false);
    expect(/integrates with Freeside/i.test(src)).toBe(false);
    expect(/depends on @loa\/freeside/i.test(src)).toBe(false);
  });

  it('handoff index README lists the Freeside community-surface packet', () => {
    const src = read(resolve(HANDOFF_DIR, 'README.md'));
    expect(/Freeside community/i.test(src)).toBe(true);
    expect(/freeside-community-surface-issue\.md/.test(src)).toBe(true);
    expect(/freeside-community-surface-boundary\.md/.test(src)).toBe(true);
    expect(/freeside-surface-mapping\.md/.test(src)).toBe(true);
  });

  it('handoff index README still lists the Hounfour, Finn, and Dixie packets', () => {
    const src = read(resolve(HANDOFF_DIR, 'README.md'));
    expect(/Hounfour schema extraction/i.test(src)).toBe(true);
    expect(/Finn runtime enforcement/i.test(src)).toBe(true);
    expect(/Dixie governed recall/i.test(src)).toBe(true);
  });
});
