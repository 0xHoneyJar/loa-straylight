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
 * EVERY `key=value` pair in the query string, whatever its key.
 *
 * The leading group captures the delimiter that introduces the pair — `?` or
 * `&` — so a FIRST, MIDDLE or LAST parameter is matched identically and the
 * delimiter is preserved rather than swallowed. The key runs to the `=`; the
 * value runs to the next `&` or `#`, so percent-encoded bytes inside it are
 * covered without being decoded.
 *
 * DELIBERATELY KEY-AGNOSTIC. The sequence-89 audit found the previous version
 * — which embedded the credential NAMES in this pattern — redacting on the RAW
 * spelling while `pg` decides on the DECODED one, so `?pass%77ord=` slipped
 * through. Which keys are credential-bearing is now decided by
 * `isCredentialParameterName` on the DECODED key, below; this pattern's only
 * job is to find the pairs.
 */
const QUERY_PARAM_RE = /([?&])([^=&#]*)=([^&#]*)/g;

/**
 * Decode a query-parameter NAME the way the connection parser does, or report
 * that it cannot be decoded.
 *
 * `pg-connection-string` builds a `URL` and reads `searchParams`, whose keys
 * are percent-DECODED (and whose `+` is a space). So `pass%77ord` arrives at
 * the parser as `password` and is honoured as the credential. A redactor that
 * matched the raw spelling therefore disagreed with the code that USES the
 * value — the divergence the audit demonstrated.
 *
 * Returns `null` when the name cannot be decoded (`decodeURIComponent` throws
 * on a malformed escape such as `%ZZ`). A name we cannot interpret is a name
 * we cannot clear, so the caller treats `null` as credential-bearing: unproven
 * FAILS CLOSED, the same rule `isProvablyCredentialFreeAuthority` follows.
 */
function decodeParameterName(rawName: string): string | null {
  try {
    return decodeURIComponent(rawName.replace(/\+/g, ' '));
  } catch {
    return null;
  }
}

/**
 * Is this raw query-parameter name credential-bearing, judged as the parser
 * judges it?
 *
 * The decision is made on the DECODED, case-folded name, so every encoding of
 * a credential name — `pass%77ord`, `%70assword`, `PASS%57ORD`,
 * `%70%61%73%73%77%6Frd` — resolves to the same answer as the plain spelling,
 * and no future encoding can diverge from what the parser honours. This is
 * why the fix is not another list of spellings: the list stays the six real
 * OPTION NAMES, and decoding does the work.
 */
function isCredentialParameterName(rawName: string): boolean {
  const decoded = decodeParameterName(rawName);
  if (decoded === null) return true; // undecodable ⇒ unproven ⇒ redact
  return CREDENTIAL_PARAMETERS.includes(decoded.toLowerCase());
}

/**
 * Redact a connection string for diagnostics.
 *
 * TWO credential channels, both closed:
 *
 *   1. URI USERINFO — `//user:password@host` — replaced wholesale;
 *   2. CREDENTIAL-BEARING QUERY PARAMETERS — `?password=…`, `?sslkey=…` and
 *      the other names above, in any case, HOWEVER ENCODED, at any position,
 *      however many.
 *
 * The sequence-83 audit found only (1) closed, so a connection string that
 * carried its password as a query parameter — a form `pg` accepts and
 * `pg-connection-string` parses — leaked verbatim into every error message and
 * log line built from `describeTarget()`.
 *
 * The sequence-89 audit then found (2) closed only for RAW spellings: the
 * pattern embedded the literal names, while the parser decides on the DECODED
 * key, so `?pass%77ord=<secret>` was honoured by `pg` as the password and left
 * verbatim by the redactor. The decision now runs through
 * `isCredentialParameterName`, which DECODES each key exactly as the parser
 * does before judging it — so the two cannot diverge, and no encoding trick
 * needs a new entry anywhere.
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
  // QUERY PARAMETERS. Every pair is examined; the DECODED key decides. The raw
  // key spelling is preserved in the output (so the diagnostic still shows which
  // parameter was hidden), and only the value is replaced.
  return out.replace(
    QUERY_PARAM_RE,
    (match, delimiter: string, rawName: string, _value: string) =>
      isCredentialParameterName(rawName) ? `${delimiter}${rawName}=${REDACTED}` : match,
  );
}
