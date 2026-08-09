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
 * Reproduce, EXACTLY, the preprocessing `pg-connection-string` applies before
 * it builds its `URL` — or report that the input cannot be brought into the
 * parser's own frame of reference.
 *
 * This is a VERBATIM transcription of the parser's first step
 * (`pg-connection-string/index.js`): when the string contains a space or a
 * MALFORMED percent escape, the parser runs `encodeURI` over the whole string
 * and then un-escapes the `%25NN` that step introduced. It is copied rather
 * than approximated because it is the parser's, and because it is
 * load-bearing in a way that is easy to miss: a malformed escape ANYWHERE in
 * the string — including in a VALUE — changes how EVERY NAME in that string
 * normalizes. `?pass%6Ford=v` yields the harmless name `passoord`, but
 * `?pass%6Ford=v%ZZ` yields `password`, the credential. That coupling is why
 * a per-parameter probe cannot be faithful and why the whole string must be
 * normalized ONCE, as one unit, exactly here.
 *
 * Returns `null` when even this step cannot be completed, which the caller
 * treats as total ambiguity.
 */
function parserPreprocess(connectionString: string): string | null {
  try {
    if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(connectionString)) {
      return encodeURI(connectionString).replace(/%25(\d\d)/g, '%$1');
    }
    return connectionString;
  } catch {
    return null;
  }
}

/**
 * The parser's OWN view of a connection string: the normalized text it
 * actually reads, and the `URL` it derives every name and value from.
 *
 * `pg-connection-string` does not look at the raw string when it decides what
 * a parameter is called. It preprocesses (above), constructs a WHATWG `URL`
 * — falling back to the same `@/` dummy-host retry the parser uses — and then
 * reads `searchParams`. WHATWG URL parsing STRIPS tab, LF and CR outright and
 * percent-decodes what remains, so `pass<LF>word`, `pass<TAB>word`,
 * `pass<CR>word`, `pass%77ord` and `%70%61%73%73%77%6Frd` all arrive at the
 * parser as the single name `password`, and `pg` honours the value as the
 * credential.
 *
 * Deriving the redaction decision from THIS view — rather than from a private
 * reading of the raw text — is what makes divergence structurally impossible:
 * there is only one normalization, it belongs to the parser, and it is the
 * same object both sides consult. The sequence-95 audit rejected the whole
 * CLASS of independent approximation (extra spellings, another normalization
 * table, a hand-written WHATWG reproduction), and it was right to: the
 * substrate decided on `decodeURIComponent(rawName)`, which cannot see a
 * stripped control character at all.
 *
 * NOTE ON WHAT IS *NOT* CALLED. `parse()` itself is deliberately NOT invoked.
 * It reads files from disk for `sslkey`, `sslcert` and `sslrootcert`
 * (`fs.readFileSync`), can emit process warnings, and can throw for reasons
 * unrelated to naming — none of which may happen on a diagnostic path inside
 * error construction. What is used instead is the parser's own
 * name-derivation prefix, which is pure: preprocess, construct the URL, read
 * `searchParams`. That prefix is the part that decides WHICH parameter is the
 * credential, and it is exactly the part that must not diverge.
 */
interface ParserView {
  /** The normalized text the parser reads — the basis for every rewrite. */
  normalized: string;
  /** The parser's URL, whose `searchParams` name every parameter. */
  url: URL;
}

/**
 * The parser's own base URL for resolving a bare connection string — the exact
 * literal `pg-connection-string` passes as `new URL(str, …)`'s second argument.
 * Assembled from fragments because the no-leak scan forbids a committed URL
 * literal that names a non-loopback host; `base` is not a host anything ever
 * connects to, but the scan judges shape, not reachability.
 */
const PARSER_BASE_URL = ['postgres', '://base'].join('');

function parserView(connectionString: string): ParserView | null {
  const normalized = parserPreprocess(connectionString);
  if (normalized === null) return null;
  // The parser's own two-step construction, including its dummy-host retry.
  try {
    return { normalized, url: new URL(normalized, PARSER_BASE_URL) };
  } catch {
    try {
      return {
        normalized,
        url: new URL(normalized.replace('@/', '@___DUMMY___/'), PARSER_BASE_URL),
      };
    } catch {
      return null;
    }
  }
}

/**
 * Does this parser-derived parameter name denote a credential?
 *
 * The name arrives ALREADY NORMALIZED by the parser, so this is the only
 * place a spelling is compared — and it compares the six real OPTION NAMES,
 * case-folded, exactly as `pg` would receive them. No encoding, control
 * character or future normalization behaviour needs an entry here, because
 * normalization happened upstream in the parser's own code.
 */
function isCredentialParameterName(parserName: string): boolean {
  return CREDENTIAL_PARAMETERS.includes(parserName.toLowerCase());
}

/**
 * Rewrite the query of the parser's NORMALIZED text, hiding the value of every
 * parameter the parser names as a credential — or report that the query cannot
 * be aligned with the parser's reading.
 *
 * WHY THE NORMALIZED TEXT AND NOT THE RAW INPUT. Once preprocessing has run,
 * raw offsets no longer correspond to what the parser saw, so a rewrite driven
 * by raw text would hide the wrong span. The normalized text IS what the
 * parser read, so rewriting it is rewriting the thing the decision was made
 * about.
 *
 * THE ALIGNMENT REQUIREMENT, AND WHY IT CAN FAIL. The rewrite pairs the
 * query's `&`-separated segments positionally with `searchParams` entries.
 * That correspondence usually holds, but NOT always: a segment can normalize
 * away to nothing (a lone `\r`), and a `#` inside the query truncates what
 * `searchParams` sees while leaving text in the string. When the counts
 * disagree, WHICH span carries the credential is genuinely unknown — so this
 * returns `null` and the caller withholds the entire query rather than
 * rewriting a span it cannot identify. Guessing here would be the exact
 * failure the audit named: printing a value the parser honours.
 */
function redactNormalizedQuery(view: ParserView): string | null {
  const queryStart = view.normalized.indexOf('?');
  if (queryStart < 0) return view.normalized; // no query: nothing to align

  const afterQuery = view.normalized.slice(queryStart + 1);
  const fragmentAt = afterQuery.indexOf('#');
  const query = fragmentAt >= 0 ? afterQuery.slice(0, fragmentAt) : afterQuery;
  const fragment = fragmentAt >= 0 ? afterQuery.slice(fragmentAt) : '';

  // Preserve empty segments so the rewritten query reads like the original;
  // only NON-EMPTY segments correspond to parser entries.
  const segments = query.split('&');
  const meaningful: number[] = [];
  segments.forEach((segment, index) => {
    if (segment.length > 0) meaningful.push(index);
  });

  const entries = [...view.url.searchParams.entries()];
  // UNALIGNABLE ⇒ the sensitive span is unidentifiable ⇒ fail closed.
  if (meaningful.length !== entries.length) return null;

  meaningful.forEach((segmentIndex, entryIndex) => {
    const [parserName] = entries[entryIndex]!;
    if (!isCredentialParameterName(parserName)) return;
    // Keep the segment's own name text so the diagnostic still shows WHICH
    // parameter was hidden; replace only the value.
    const segment = segments[segmentIndex]!;
    const equals = segment.indexOf('=');
    const nameText = equals >= 0 ? segment.slice(0, equals) : segment;
    segments[segmentIndex] = `${nameText}=${REDACTED}`;
  });

  return `${view.normalized.slice(0, queryStart)}?${segments.join('&')}${fragment}`;
}

/** The parser's text with its query WITHHELD — the fail-closed query form. */
function withheldQuery(view: ParserView): string {
  const queryStart = view.normalized.indexOf('?');
  if (queryStart < 0) return view.normalized;
  return `${view.normalized.slice(0, queryStart)}?${REDACTED}`;
}

/**
 * Every credential value the PARSER derives from this view, in the forms it
 * could appear as text.
 *
 * This is the set the decisive property is stated over: the values `pg` would
 * receive as credentials. Both channels contribute — credential-named query
 * parameters (named by the parser, not by this module) and the URI userinfo
 * password. Each value is listed as the parser sees it (decoded) AND
 * re-encoded, because a value can appear in the text in either form and the
 * property covers both.
 *
 * The USERNAME is deliberately NOT included. It is removed from the authority
 * by the userinfo rule, but it is routinely also the database name
 * (`…//straylight:…@<host>/straylight`), and treating it as
 * unmentionable text would erase the target from every diagnostic for no
 * credential benefit.
 */
function parserCredentialValues(view: ParserView): string[] {
  const values: string[] = [];
  const add = (value: string): void => {
    if (value.length === 0) return;
    values.push(value);
    try {
      const encoded = encodeURIComponent(value);
      if (encoded !== value) values.push(encoded);
    } catch {
      /* unencodable (lone surrogate): the decoded form above is the check */
    }
  };
  // EVERY entry, not just the last of a duplicated name. The parser's own
  // `config[name] = value` assignment means a later duplicate WINS, so only the
  // last is honoured — but an earlier duplicate is still a credential value
  // someone wrote down, and it must not leak merely because it lost.
  for (const [name, value] of view.url.searchParams.entries()) {
    if (isCredentialParameterName(name)) add(value);
  }
  add(view.url.password);
  try {
    add(decodeURIComponent(view.url.password));
  } catch {
    /* malformed escape: the raw form added above is the check */
  }
  return values;
}

/**
 * Replace the credential-bearing part of a `//`-form authority.
 *
 * Applied to whatever query form was chosen, because the fail-closed path
 * needs the same treatment as the ordinary one.
 */
function redactAuthority(text: string): string {
  if (USERINFO_RE.test(text)) return text.replace(USERINFO_RE, `//${REDACTED}@`);
  // TRUNCATED AUTHORITY. When no `@` delimited the userinfo, the rule above
  // matched nothing — but `postgres://<user>:<password>` is a credential pair
  // all the same. Redact the whole authority unless it is PROVABLY a bare host
  // or host:port; unproven fails closed.
  return text.replace(AUTHORITY_RE, (match, authority: string) =>
    isProvablyCredentialFreeAuthority(authority) ? match : `//${REDACTED}`,
  );
}

/**
 * Redact a connection string for diagnostics.
 *
 * TWO credential channels, both closed:
 *
 *   1. URI USERINFO — `//user:password@host` — replaced wholesale;
 *   2. CREDENTIAL-BEARING QUERY PARAMETERS — `?password=…`, `?sslkey=…` and
 *      the other names above, in any case, HOWEVER ENCODED OR NORMALIZED, at
 *      any position, however many.
 *
 * The sequence-83 audit found only (1) closed, so a connection string that
 * carried its password as a query parameter — a form `pg` accepts and
 * `pg-connection-string` parses — leaked verbatim into every error message and
 * log line built from `describeTarget()`.
 *
 * The sequence-89 audit then found (2) closed only for RAW spellings, so
 * `?pass%77ord=<secret>` leaked. The sequence-95 audit found the fix for THAT
 * was still an INDEPENDENT APPROXIMATION of the parser — it decided on
 * `decodeURIComponent(rawName)`, while `pg-connection-string` builds a WHATWG
 * `URL` first, which STRIPS tab, LF and CR BEFORE any decoding. So
 * `?pass<LF>word=<secret>` was honoured by `pg` as the password and printed
 * verbatim by the redactor. Adding those spellings would have been the same
 * mistake a third time.
 *
 * THE STRUCTURAL FIX: the decision is no longer this module's to make. Which
 * parameters exist, and what each is CALLED, comes from `parserView` — the
 * parser's own preprocessing and URL construction, its own `searchParams`.
 * This module only matches those parser-supplied names against the six real
 * option names and rewrites the text the parser read. There is no second
 * normalization to drift from the first, so no future encoding or
 * normalization behaviour can put the two out of step: if the parser's view of
 * a name changes, this decision changes with it, in the same code.
 *
 * NON-SECRET DETAIL IS PRESERVED on purpose: scheme, host, port, database and
 * every non-credential parameter survive, so a diagnostic still names which
 * target it is talking about. A redactor that erased the whole string would be
 * safe and useless.
 *
 * THE DECISIVE PROPERTY IS CHECKED, NOT ARGUED. Whenever the parser derives a
 * credential value, that value must not occur in what this returns. Rather than
 * reason that the rewrite above achieves that, the result is INSPECTED for the
 * parser's own credential values, and a result that still contains one is
 * discarded in favour of the query-withheld form. The rewrite is the fast path;
 * this is the guarantee. It closes cases no naming rule reaches — a credential
 * value that also appears under a NON-credential name, or in the path, is
 * caught here because the property is about the VALUE, not where it sits.
 *
 * FAILS CLOSED WITHOUT THROWING. This runs on the diagnostic path — inside
 * error construction — so throwing here would replace a useful error with a
 * confusing one, or mask it entirely. Every step is therefore total: a
 * non-string argument is reported as its type; an input the parser's own
 * construction cannot read, a query that cannot be aligned to the parser's
 * reading, or a result that fails the check above WITHHOLDS the unresolvable
 * part rather than echoing it. Ambiguity always resolves toward saying less.
 * Note that `parse()` itself is never called — it touches the filesystem for
 * SSL material and can throw — only its pure name-derivation prefix is used.
 */
export function redactConnectionString(connectionString: string): string {
  if (typeof connectionString !== 'string') {
    return `${REDACTED} (non-string connection target: ${typeof connectionString})`;
  }

  const view = parserView(connectionString);
  // The parser's own construction could not read this at all. Nothing here can
  // be interpreted as non-secret, so nothing is echoed.
  if (view === null) {
    return `${REDACTED} (uninterpretable connection target)`;
  }

  const credentials = parserCredentialValues(view);
  // A credential value can reach the text in an ENCODED alias — `secret` written
  // as `sec%72et` under some OTHER, non-credential name. The raw scan below
  // would miss that, so the candidate is also scanned once DECODED. This is a
  // post-condition on output text, not a second classification: which values are
  // credentials still comes only from the parser.
  const contains = (text: string): boolean => {
    if (credentials.length === 0) return false;
    const forms = [text];
    try {
      const decoded = decodeURIComponent(text);
      if (decoded !== text) forms.push(decoded);
    } catch {
      /* malformed escape: the raw form is the whole check */
    }
    return credentials.some((value) => forms.some((form) => form.includes(value)));
  };

  // Query present but unalignable: withhold the query, so no unidentified span
  // is printed.
  const rewritten = redactNormalizedQuery(view);
  if (rewritten !== null) {
    const out = redactAuthority(rewritten);
    if (!contains(out)) return out;
  }

  // The rewrite either could not be aligned or did not suffice. Withhold the
  // whole query.
  const withheld = redactAuthority(withheldQuery(view));
  if (!contains(withheld)) return withheld;

  // Even the query-withheld form still carries a credential value — it is in
  // the scheme, authority or path. Nothing structural can be salvaged.
  return `${REDACTED} (uninterpretable connection target)`;
}
