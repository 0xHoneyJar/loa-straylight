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
 * Redact a connection string for diagnostics. Userinfo (which carries the
 * password) is replaced wholesale, so an error message or log line can name
 * the target without leaking a credential.
 */
export function redactConnectionString(connectionString: string): string {
  return connectionString.replace(/\/\/[^@/]*@/, '//<redacted>@');
}
