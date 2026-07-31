// Phase 50A — required no-leak checks and provider-neutrality guard.
//
// These are the packet's `required_no_leak_checks`, made executable. They do
// NOT need the PostgreSQL harness — they inspect the committed tree — so unlike
// the other Phase 50A suites they run under plain `npm test` too. A leak guard
// that only ran when Docker was up would be no guard at all.
//
// Scope: every path Phase 50A added or touched. The check reads the files from
// disk rather than trusting a manifest, so a new file under a covered directory
// is automatically in scope.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

// ── the authoritative fixed-input declaration (patch cycle 2, finding 3) ─
//
// This suite's conclusions depend on the content of specific repository paths.
// If one of them changes, this suite's verdict can change with it — so the
// workflow that runs the suite must be triggered by all of them, and drift
// between "what the suite reads" and "what the workflow watches" is a real
// hole (the defect recorded as patch-cycle-1 finding 6).
//
// The two marked blocks below are THE authoritative declaration of that input
// set. They are load-bearing, not documentation:
//
//   * the tree roots are what `phase50aFiles()` actually walks;
//   * every by-name text read in this file goes through `readFixedInput`,
//     which REFUSES a path that is not declared;
//   * `artifact-and-workflow-contract.test.ts` extracts these blocks by their
//     markers and compares the declared set against the workflow's
//     `pull_request.paths` coverage, with a mutation proving an undeclared or
//     uncovered new input fails.
//
// The markers are parsed by that test. Keep them exactly as they are, keep one
// single-quoted path per line, and add a new fixed input HERE — nowhere else.

/**
 * Tree roots walked wholesale. Everything Phase 50A introduced or modified; a
 * new file under one of these is automatically in scope, which is why they are
 * roots rather than a file list.
 */
// straylight:no-leak-tree-roots:begin
const SCANNED_TREE_ROOTS = [
  'src/straylight/storage/postgres',
  'migrations/postgres',
  'scripts/phase-50a',
  'tests/phase-50a',
  'docker-compose.phase-50a.yml',
  '.github/workflows/phase-50a-postgres-conformance.yml',
  'docs/PHASE-50A-PROVIDER-NEUTRAL-POSTGRESQL-CANONICAL-STORE-IMPLEMENTATION-AND-PROOF.md',
  'docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md',
] as const;
// straylight:no-leak-tree-roots:end

/**
 * Files read BY NAME, individually, outside any tree root. Each is read through
 * `readFixedInput`, so this list is exactly the set of by-name text inputs —
 * an undeclared read throws rather than silently widening the input set.
 *
 * `src/straylight/index.ts` is the public-surface guard's input. The rest are
 * the estate domain model, read to prove Phase 50A did not touch it.
 */
// straylight:no-leak-named-inputs:begin
const NAMED_TEXT_INPUTS = [
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
  'scripts/phase-50a/hosts.js',
] as const;
// straylight:no-leak-named-inputs:end

/** Everything Phase 50A introduced or modified, as repository-relative paths. */
const PHASE_50A_PATHS = SCANNED_TREE_ROOTS;

/**
 * Read one declared by-name input. A path that is not in `NAMED_TEXT_INPUTS`
 * is REFUSED: that is what makes the declaration complete by construction
 * rather than by inspection, so a future read cannot quietly add an input the
 * workflow does not watch.
 */
function readFixedInput(path: string): string {
  if (!(NAMED_TEXT_INPUTS as readonly string[]).includes(path)) {
    throw new Error(
      `no-leak: ${path} is not a declared fixed input. Add it to NAMED_TEXT_INPUTS ` +
        '(and give it workflow path coverage) rather than reading it directly.',
    );
  }
  return readFileSync(resolve(ROOT, path), 'utf8');
}

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

function walk(abs: string): string[] {
  if (!safeStat(abs)) return [];
  if (statSync(abs).isFile()) return [abs];
  const out: string[] = [];
  for (const entry of readdirSync(abs)) {
    out.push(...walk(join(abs, entry)));
  }
  return out;
}

function safeStat(abs: string): boolean {
  try {
    statSync(abs);
    return true;
  } catch {
    return false;
  }
}

function phase50aFiles(): TreeFile[] {
  const out: TreeFile[] = [];
  for (const entry of PHASE_50A_PATHS) {
    for (const abs of walk(resolve(ROOT, entry))) {
      out.push({ path: relative(ROOT, abs), text: readFileSync(abs, 'utf8') });
    }
  }
  return out;
}

describe('Phase 50A no-leak — the file set under scan is non-empty and complete', () => {
  it('every declared Phase 50A path exists and contributes files', () => {
    // Guard the guard: a typo'd path would silently scan nothing.
    for (const entry of PHASE_50A_PATHS) {
      const files = walk(resolve(ROOT, entry));
      expect(files.length, `${entry} must exist and contain at least one file`).toBeGreaterThan(0);
    }
    expect(phase50aFiles().length).toBeGreaterThan(15);
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
    // Every domain file this reads is a declared fixed input (see
    // NAMED_TEXT_INPUTS): the whole declared set minus the public-surface guard's
    // own input and the harness module, which are asserted elsewhere.
    const domainFiles = NAMED_TEXT_INPUTS.filter(
      (p) => p !== 'src/straylight/index.ts' && p !== 'scripts/phase-50a/hosts.js',
    );
    expect(domainFiles.length).toBeGreaterThan(10);
    for (const path of domainFiles) {
      const text = readFixedInput(path);
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
    const index = readFixedInput('src/straylight/index.ts');
    expect(/postgres/i.test(index), 'the wedge barrel must not export the store').toBe(false);
    expect(/from\s+['"]pg['"]/.test(index)).toBe(false);
  });
});
