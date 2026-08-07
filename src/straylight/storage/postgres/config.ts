// Connection configuration — the ONLY place deployment particulars live.
//
// ADR-049Q §11.3 / §9 clause 5: all connection, pooling, and deployment
// configuration lives at the adapter/deployment boundary, never in domain
// code. Nothing under `src/straylight/` outside this directory imports `pg`,
// reads an environment variable, or knows a host exists.
//
// The config surface is deliberately minimal and provider-neutral: a
// standard PostgreSQL connection string plus pool bounds. There is no
// provider name, no platform-specific field, no managed-service concept, and
// no credential default. A caller supplies a connection string or the store
// refuses to open — an absent configuration is never guessed.

export interface PostgresStoreConfig {
  /**
   * Standard PostgreSQL connection string, in the ordinary
   * `postgresql://<user>:<password>@<host>:<port>/<database>` form. Supplied by
   * the deployment; never defaulted, never committed.
   */
  connectionString: string;
  /** Maximum pooled connections. Default 4. */
  maxConnections?: number;
  /** Connection acquisition timeout in ms. Default 10_000. */
  connectionTimeoutMs?: number;
  /** Statement timeout in ms applied to every session. Default 30_000. */
  statementTimeoutMs?: number;
  /**
   * Schema versions the store requires to be applied before it will serve
   * any operation. Default: every version this build ships.
   */
  requiredSchemaVersions?: readonly string[];
}

/** The migration versions this build ships, in application order. */
export const SHIPPED_SCHEMA_VERSIONS: readonly string[] = ['0001'];

export interface ResolvedPostgresStoreConfig {
  connectionString: string;
  maxConnections: number;
  connectionTimeoutMs: number;
  statementTimeoutMs: number;
  requiredSchemaVersions: readonly string[];
}

export function resolveConfig(config: PostgresStoreConfig): ResolvedPostgresStoreConfig {
  if (typeof config.connectionString !== 'string' || config.connectionString.length === 0) {
    throw new Error(
      'PostgresStoreConfig.connectionString is required; the store never defaults a connection target',
    );
  }
  return {
    connectionString: config.connectionString,
    maxConnections: config.maxConnections ?? 4,
    connectionTimeoutMs: config.connectionTimeoutMs ?? 10_000,
    statementTimeoutMs: config.statementTimeoutMs ?? 30_000,
    requiredSchemaVersions: config.requiredSchemaVersions ?? SHIPPED_SCHEMA_VERSIONS,
  };
}

/**
 * Parameter names that carry a credential in a PostgreSQL connection URI.
 *
 * `password` is the ordinary one; the SSL key material and its passphrase are
 * credentials too, and `pgpassfile` names a file whose path can itself be
 * sensitive. Matched CASE-INSENSITIVELY, because the URI query is
 * case-preserving and `?PASSWORD=` leaks exactly as well as `?password=`.
 *
 * The list is deliberately about NAMES, not value shapes: a redactor that
 * guessed at "secret-looking" values would miss a short password and mangle a
 * long database name.
 */
const CREDENTIAL_PARAMETERS: readonly string[] = [
  'password',
  'passwd',
  'pgpassword',
  'pgpassfile',
  'sslpassword',
  'sslkey',
];

const REDACTED = '<redacted>';

/** Userinfo: everything between `//` and the `@` that ends the authority. */
const USERINFO_RE = /\/\/[^@/]*@/;

/**
 * The authority of a `//`-form URI: everything after `//` up to the first
 * `/`, `?` or `#`. Captured so a TRUNCATED authority — one that lost its `@`
 * — can be examined rather than assumed benign.
 */
const AUTHORITY_RE = /\/\/([^/?#]*)/;

/**
 * Is this authority PROVABLY a bare `host` or `host:port`, carrying no
 * credential?
 *
 * The distinction matters because `//user:password` and `//host:5432` are the
 * same shape once the `@` is gone — and `postgres://<user>:<password>`
 * (a truncated URI, which `new URL` refuses outright) would otherwise pass
 * through the userinfo rule untouched and leak verbatim.
 *
 * Proof is narrow and structural: no `@` to have delimited userinfo, and the
 * segment after the final colon OUTSIDE any IPv6 bracket group is empty or
 * all digits — i.e. a port. `[::1]:5432` and `[::1]` are recognized by
 * skipping past the closing bracket, so IPv6 hosts are not mistaken for
 * credentials. Anything else is UNPROVEN and therefore redacted: a
 * `host:name` that is not a port cannot be told from `user:password`, and on
 * the diagnostic path the safe answer is to say less.
 */
function isProvablyCredentialFreeAuthority(authority: string): boolean {
  if (authority.includes('@')) return false; // userinfo present — not this rule's case
  const closingBracket = authority.lastIndexOf(']');
  const afterHost = closingBracket >= 0 ? authority.slice(closingBracket + 1) : authority;
  const colon = afterHost.indexOf(':');
  if (colon < 0) return true; // bare host, or a bracketed IPv6 host with no port
  const port = afterHost.slice(colon + 1);
  return port.length === 0 || /^[0-9]+$/.test(port);
}

/**
 * One `key=value` pair whose key is credential-bearing, wherever it sits in
 * the query string. The leading group captures the delimiter that introduces
 * the pair — `?` or `&` — so a FIRST, MIDDLE or LAST parameter is matched
 * identically and the delimiter is preserved rather than swallowed. The value
 * runs to the next `&` or `#`, so percent-encoded bytes inside it are covered
 * without being decoded first.
 */
const CREDENTIAL_PARAM_RE = new RegExp(
  `([?&])(${CREDENTIAL_PARAMETERS.join('|')})=[^&#]*`,
  'gi',
);

/**
 * Redact a connection string for diagnostics.
 *
 * TWO credential channels, both closed:
 *
 *   1. URI USERINFO — `//user:password@host` — replaced wholesale;
 *   2. CREDENTIAL-BEARING QUERY PARAMETERS — `?password=…`, `?sslkey=…` and
 *      the other names above, in any case, at any position, however many.
 *
 * The sequence-83 audit found only (1) closed, so a connection string that
 * carried its password as a query parameter — a form `pg` accepts and
 * `pg-connection-string` parses — leaked verbatim into every error message and
 * log line built from `describeTarget()`.
 *
 * NON-SECRET DETAIL IS PRESERVED on purpose: scheme, host, port, database and
 * every non-credential parameter survive, so a diagnostic still names which
 * target it is talking about. A redactor that erased the whole string would be
 * safe and useless.
 *
 * FAILS CLOSED WITHOUT THROWING. This runs on the diagnostic path — inside
 * error construction — so throwing here would replace a useful error with a
 * confusing one, or mask it entirely. The implementation is therefore pure
 * string rewriting over the raw input: it never parses the URI, so malformed,
 * truncated, non-URI and empty-authority input is rewritten by the same rules
 * as valid input and no input shape can raise. A non-string argument (possible
 * from untyped JavaScript callers) is reported as its type rather than
 * interpolated.
 */
export function redactConnectionString(connectionString: string): string {
  if (typeof connectionString !== 'string') {
    return `${REDACTED} (non-string connection target: ${typeof connectionString})`;
  }
  let out = connectionString.replace(USERINFO_RE, `//${REDACTED}@`);
  // TRUNCATED AUTHORITY. When no `@` delimited the userinfo, the rule above
  // matched nothing — but `postgres://<user>:<password>` is a credential
  // pair all the same. Redact the whole authority unless it is PROVABLY a
  // bare host or host:port; unproven fails closed.
  if (!USERINFO_RE.test(connectionString)) {
    out = out.replace(AUTHORITY_RE, (match, authority: string) =>
      isProvablyCredentialFreeAuthority(authority) ? match : `//${REDACTED}`,
    );
  }
  return out.replace(CREDENTIAL_PARAM_RE, (_match, delimiter: string, name: string) =>
    `${delimiter}${name}=${REDACTED}`,
  );
}
