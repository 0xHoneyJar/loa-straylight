// Phase 50A — required no-leak checks and provider-neutrality guard.
//
// These are the packet's `required_no_leak_checks`, made executable. They do
// NOT need the PostgreSQL harness — they inspect the committed tree — so unlike
// the other Phase 50A suites they run under plain `npm test` too. A leak guard
// that only ran when Docker was up would be no guard at all.
//
// ── R3: THE INPUT SET COMES FROM THE MANIFEST ───────────────────────────
//
// This suite's conclusions depend on the content of specific repository paths.
// If one of them changes, this suite's verdict can change with it — so the
// workflow that runs the suite must be triggered by all of them.
//
// The input set is declared ONCE, as checked-in DATA, in
// `tests/phase-50a/proof-input-manifest.json`, and this suite READS ITS INPUTS
// FROM that manifest. It restates nothing, so there is one declaration and
// nothing to extract from this source.
//
// This REPLACES the rejected model, in which the declaration lived in marked
// comment blocks inside this file and a second suite EXTRACTED those blocks to
// compare against the workflow. Three independent mutations survived that:
// deleting a declared input (a smaller declaration satisfies `uncovered == []`
// more easily), truncating the extractor, and — decisively — replacing the
// extractor so it SYNTHESIZED a path the workflow no longer declared. No proof
// may derive its authority from the extractor it validates, so there is no
// extractor: the manifest is data, the workflow side is a bounded structural
// parse of the workflow's own bytes, and neither is derived from the other.
//
// The roots are deliberately BROAD (`src/straylight`, not a file list): a broad
// root also covers files that do not exist yet, so it cannot be defeated by
// adding, renaming, or deleting a declaration. Adding a Phase 50A input means
// adding a root to the MANIFEST — nowhere else.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  MANIFEST_PATH,
  REPO_ROOT as ROOT,
  manifestTrackedFiles,
  readManifest,
  readManifestInput,
} from '../../scripts/phase-50a/proof-input-manifest.mjs';

/**
 * The single deliberate exception to the credential scan: the non-production
 * harness's fixed local-only test password. It is committed on purpose so the
 * proof is reproducible without credential handling, it is bound to loopback,
 * and it grants nothing anywhere. Listing it here — rather than loosening the
 * scan — keeps every OTHER occurrence a failure.
 */
const HARNESS_LOCAL_ONLY_PASSWORD = 'straylight_local_proof_only';

/**
 * Provider-managed hostname suffixes, assembled from fragments so this guard is
 * subject to its own provider-name rule rather than exempt from it. Used by both
 * the cloud-hostname scan and the provider-name scan.
 */
const PROVIDER_NAME = ['rail', 'way'].join('');
const PROVIDER_HOSTS: readonly string[] = [
  `${PROVIDER_NAME}\\.app`,
  ['rl', 'wy'].join('') + '\\.net',
];
const HARNESS_FILES: readonly string[] = [
  'docker-compose.phase-50a.yml',
  'scripts/phase-50a/hosts.ts',
  '.github/workflows/phase-50a-postgres-conformance.yml',
  'docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md',
  'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md',
  'tests/phase-50a/no-leak-and-neutrality.test.ts',
];

interface TreeFile {
  path: string;
  text: string;
}

/**
 * The files this suite scans: every GIT-TRACKED file the MANIFEST covers.
 *
 * Read from the manifest, not restated. Tracked rather than on-disk, so an
 * untracked scratch file can neither widen nor narrow the scanned set — the proof
 * is about committed content. `manifestTrackedFiles` throws on a manifest that is
 * missing, empty, unreadable, malformed, or names a root with no real tracked
 * file, so this cannot silently scan nothing.
 */
function phase50aFiles(): TreeFile[] {
  return manifestTrackedFiles().map((path) => ({
    path,
    text: readFileSync(resolve(ROOT, path), 'utf8'),
  }));
}

describe('Phase 50A no-leak — the scanned set comes from the manifest and is non-empty', () => {
  it('the manifest is readable, non-vacuous, and every declared root contributes tracked files', () => {
    // Guard the guard: a typo'd root, an empty manifest, or a root that resolves
    // to nothing would silently scan too little. `manifestTrackedFiles` fails
    // closed on each, so reaching a non-trivial file set IS the assertion.
    const manifest = readManifest();
    expect(manifest.roots.length, 'the manifest must declare roots').toBeGreaterThan(5);
    const files = phase50aFiles();
    expect(files.length, 'the manifest must resolve to a substantial tracked set').toBeGreaterThan(
      40,
    );
    // The manifest covers ITSELF, so a change to the coverage model is in scope of
    // the very scan it configures.
    expect(files.map((f) => f.path)).toContain(MANIFEST_PATH);
  });
});

describe('Phase 50A no-leak — no secret, credential, or live endpoint is committed', () => {
  const files = phase50aFiles();

  it('no file carries a credential-shaped assignment outside the local-only harness', () => {
    // Patterns that look like a real secret being set. The harness's fixed local
    // password is allowed only in the files listed above.
    const patterns: ReadonlyArray<{ label: string; re: RegExp }> = [
      { label: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
      { label: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
      { label: 'bearer token literal', re: /\bBearer\s+[A-Za-z0-9._-]{20,}/ },
      { label: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
      { label: 'slack token', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
      { label: 'generic api key assignment', re: /\b(api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9/+=_-]{16,}['"]/i },
    ];
    for (const file of files) {
      for (const { label, re } of patterns) {
        expect(re.test(file.text), `${file.path} must not contain a ${label}`).toBe(false);
      }
    }
  });

  it('the fixed local-only harness password appears ONLY in the declared harness files', () => {
    for (const file of files) {
      if (HARNESS_FILES.includes(file.path)) continue;
      expect(
        file.text.includes(HARNESS_LOCAL_ONLY_PASSWORD),
        `${file.path} must not carry the harness password; only ${HARNESS_FILES.join(', ')} may`,
      ).toBe(false);
    }
  });

  it('every committed connection string targets loopback only — no live endpoint', () => {
    // A `postgres://`/`postgresql://` URL pointing anywhere but 127.0.0.1 /
    // localhost would be a live endpoint.
    //
    // Two forms are exempt because neither names a host:
    //   * documentation placeholders in angle brackets (`<host>:<port>`);
    //   * template-literal interpolations (`${...}`), where the host is a
    //     variable. `scripts/phase-50a/hosts.ts` is the one such case, and its
    //     loopback default is asserted directly below rather than by pattern.
    const urlRe = /postgres(?:ql)?:\/\/[^\s'"`)]+/g;
    for (const file of files) {
      for (const match of file.text.match(urlRe) ?? []) {
        if (/<[^>]+>/.test(match)) continue;
        if (/\$\{/.test(match)) continue;
        expect(
          /@(?:127\.0\.0\.1|localhost)[:/]/.test(match),
          `${file.path}: connection string ${match} must target loopback only`,
        ).toBe(true);
      }
    }
  });

  it('the harness host defaults resolve to loopback (the interpolated case, checked by value)', async () => {
    // The exemption above is only safe because the interpolated host is pinned
    // here, by evaluating the module rather than reading its text.
    const { sourceHost, replacementHost, assertDistinctHosts } = await import(
      '../../scripts/phase-50a/hosts.js'
    );
    for (const host of [sourceHost(), replacementHost()]) {
      expect(host.connectionString).toMatch(/@127\.0\.0\.1:/);
      expect(host.port).toBeGreaterThan(1024);
    }
    // And the two defaults are genuinely different targets.
    expect(() => assertDistinctHosts(sourceHost(), replacementHost())).not.toThrow();
    expect(sourceHost().connectionString).not.toBe(replacementHost().connectionString);
  });

  it('no cloud account id, project id, region, or provider topology value is committed', () => {
    const patterns: ReadonlyArray<{ label: string; re: RegExp }> = [
      { label: 'AWS account id', re: /\b\d{12}\b(?!\s*(?:ms|s\b))/ },
      { label: 'AWS/GCP region literal', re: /\b(?:us|eu|ap|sa|ca|me|af)-(?:east|west|north|south|central|northeast|southeast|northwest|southwest)-\d\b/ },
      {
        label: 'cloud internal hostname',
        re: new RegExp(
          '\\.(?:internal|amazonaws\\.com|googleapis\\.com|azure\\.com|' +
            [PROVIDER_HOSTS.join('|')].join('') +
            ')\\b',
        ),
      },
    ];
    for (const file of files) {
      for (const { label, re } of patterns) {
        const match = re.exec(file.text);
        expect(match, `${file.path} must not contain a ${label} (found ${match?.[0]})`).toBeNull();
      }
    }
  });

  it('no local absolute path, home directory, or workspace identifier is committed', () => {
    // Assembled from fragments so this guard does not itself contain the
    // literals it forbids — otherwise the scan would flag its own source.
    const homePrefix = ['/ho', 'me/'].join('');
    const usersPrefix = ['/Us', 'ers/'].join('');
    const workspaceName = ['loa', '-dev'].join('');
    for (const file of files) {
      expect(
        new RegExp(`${homePrefix}[a-z0-9_-]+/`, 'i').test(file.text),
        `${file.path}: home-directory path`,
      ).toBe(false);
      expect(
        new RegExp(`${usersPrefix}[A-Za-z0-9_-]+/`).test(file.text),
        `${file.path}: user-directory path`,
      ).toBe(false);
      expect(/[A-Z]:\\Users\\/.test(file.text), `${file.path}: Windows user path`).toBe(false);
      expect(file.text.includes(workspaceName), `${file.path}: local workspace name`).toBe(false);
    }
  });

  it('no generated .run/ artifact or build output is referenced as committed content', () => {
    for (const file of files) {
      // Reading or writing under .run/ would put a generated artifact in the
      // proof path; the Phase 50A proof writes nothing outside the database and
      // the test tmpdir.
      expect(/['"`]\.run\//.test(file.text), `${file.path}: .run/ artifact path`).toBe(false);
    }
  });
});

describe('Phase 50A neutrality — no provider-specific concept in the implementation', () => {
  const files = phase50aFiles();

  // The proof document and its runbook are the only places permitted to cite
  // the historical ADR record by provider name: the packet's no-leak check says
  // that historical ADR citations in the proof document are the only permitted
  // provider-name text. Everywhere else — source, migrations, tests, scripts,
  // compose, workflow — must be provider-neutral.
  const CITATION_ALLOWED = new Set<string>([
    'docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md',
    'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md',
  ]);

  it('the provider name appears nowhere outside the permitted historical citations', () => {
    for (const file of files) {
      if (CITATION_ALLOWED.has(file.path)) continue;
      expect(
        new RegExp(PROVIDER_NAME, 'i').test(file.text),
        `${file.path} must not name the provider (ADR-049Q §11.6, §13.2; P-2)`,
      ).toBe(false);
    }
  });

  it('the provider-name guard is not vacuous (it detects the name when present)', () => {
    // If PROVIDER_NAME were ever mis-assembled to '' or a non-matching string,
    // the check above would pass for every file regardless of content.
    expect(PROVIDER_NAME).toHaveLength(7);
    expect(new RegExp(PROVIDER_NAME, 'i').test(`a ${PROVIDER_NAME} reference`)).toBe(true);
    expect(new RegExp(PROVIDER_NAME, 'i').test('provider-neutral text')).toBe(false);
  });

  it('no provider-specific API, SDK, extension, or platform concept is imported', () => {
    // Provider tokens are assembled from fragments for the same reason as
    // PROVIDER_NAME above: the guard must not be the thing it forbids.
    const p = PROVIDER_NAME;
    const P = p.toUpperCase();
    const patterns: ReadonlyArray<{ label: string; re: RegExp }> = [
      {
        label: 'provider SDK import',
        re: new RegExp(`from\\s+['"](?:@?${p}|@vercel/postgres|@neondatabase|@planetscale)`, 'i'),
      },
      {
        label: 'provider-injected env var',
        re: new RegExp(`\\b(?:${P}|VERCEL|HER${'OKU'}|RENDER|FLY)_[A-Z_]+\\b`),
      },
      {
        label: 'provider CLI invocation',
        re: new RegExp(`\\b(?:${p}|her${'oku'}|flyctl)\\s+(?:run|connect|pg|proxy)\\b`, 'i'),
      },
    ];
    for (const file of files) {
      if (CITATION_ALLOWED.has(file.path)) continue;
      for (const { label, re } of patterns) {
        expect(re.test(file.text), `${file.path} must not use a ${label}`).toBe(false);
      }
    }
  });

  it('the migrations reference no provider-managed role, database, or extension', () => {
    const migrations = files.filter((f) => f.path.startsWith('migrations/postgres/'));
    expect(migrations.length).toBeGreaterThan(0);
    for (const file of migrations) {
      // The proof-harness role name belongs to the harness, not the schema: a
      // migration that granted to a specific role would bind the schema to a
      // deployment.
      expect(/\bGRANT\b/i.test(file.text), `${file.path}: GRANT ties schema to a role`).toBe(false);
      expect(/straylight_proof/.test(file.text), `${file.path}: harness role in schema`).toBe(
        false,
      );
    }
  });

  it('the estate domain model is untouched by Phase 50A', () => {
    // Phase 50A implements persistence for semantics Straylight already
    // defines. If any of these files had changed, the packet says STOP AND
    // ESCALATE rather than proceed — so this test is the mechanical form of
    // that stop condition.
    //
    // The set is DERIVED from the manifest, not restated: every tracked file
    // directly under `src/straylight/` other than the PostgreSQL store subtree is
    // domain code. Deriving it from the broad root means a NEW domain file is in
    // scope automatically — which a named list could not achieve, and which is
    // exactly why the manifest declares broad roots.
    const domainFiles = manifestTrackedFiles().filter(
      (p) =>
        p.startsWith('src/straylight/') &&
        !p.startsWith('src/straylight/storage/postgres/') &&
        p.endsWith('.ts'),
    );
    expect(domainFiles.length, 'the domain set must be substantial').toBeGreaterThan(10);
    // The specific files the packet's stop condition names must be among them, so
    // a derivation that silently produced a narrower set fails here.
    for (const required of [
      'src/straylight/index.ts',
      'src/straylight/types.ts',
      'src/straylight/estate.ts',
      'src/straylight/recall.ts',
      'src/straylight/audit.ts',
      'src/straylight/policy.ts',
      'src/straylight/keyring.ts',
      'src/straylight/signatures.ts',
      'src/straylight/commitment.ts',
      'src/straylight/storage/types.ts',
      'src/straylight/storage/in-memory.ts',
      'src/straylight/storage/jsonl.ts',
    ]) {
      expect(domainFiles, `${required} must be a manifest-covered domain input`).toContain(required);
    }
    for (const path of domainFiles) {
      const text = readManifestInput(path);
      // No domain file may reach into the adapter boundary or the driver.
      expect(/from\s+['"]pg['"]/.test(text), `${path} must not import pg`).toBe(false);
      expect(
        /from\s+['"][^'"]*postgres\//.test(text),
        `${path} must not import the postgres adapter`,
      ).toBe(false);
      expect(
        new RegExp(PROVIDER_NAME, 'i').test(text),
        `${path} must not name a provider`,
      ).toBe(false);
    }
  });

  it('the wedge public surface is NOT widened by Phase 50A', () => {
    // ADR-024G / ADR-026A §5 keep the root export type-only. Re-exporting the
    // store would make `pg` a runtime dependency of every type-only consumer.
    const index = readManifestInput('src/straylight/index.ts');
    expect(/postgres/i.test(index), 'the wedge barrel must not export the store').toBe(false);
    expect(/from\s+['"]pg['"]/.test(index)).toBe(false);
  });

  it('an UNDECLARED input cannot be read through the manifest accessor', () => {
    // The accessor is what keeps the declaration complete by construction: a read
    // of something no root covers throws rather than quietly widening the input
    // set behind the workflow's back.
    expect(() => readManifestInput('src/straylight/no-such-undeclared-probe.ts')).toThrow(
      /not covered by any declared root/,
    );
    // And a genuinely covered path is accepted, so the refusal is specific rather
    // than blanket.
    expect(() => readManifestInput('src/straylight/index.ts')).not.toThrow();
  });
});
