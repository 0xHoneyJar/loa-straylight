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
//
// ── THIS MODULE DOES NOT READ THE CONNECTION STRING (sequence-110, F-04) ──
//
// It carries one, checks that one was supplied, and hands it to `pg`. It does
// not parse it, normalize it, decode it, re-spell it, split its authority from
// its query, classify a parameter name, or fold a case. That is deliberate and
// it is the whole of the F-04 closure.
//
// The substrate had a redactor here — `redactConnectionString`, plus
// `parserPreprocess`, `parserView`, `isCredentialParameterName`,
// `CREDENTIAL_PARAMETERS`, `parserReadings`, `redactNormalizedQuery`,
// `redactAuthority` — which TRANSCRIBED `pg-connection-string`'s behaviour so a
// diagnostic could print a connection string with the credential taken out. The
// sequence-110 audit rejected it: a transcription is a SECOND parser, it is
// never faithful (the substrate's copy had no leading-slash socket handling and
// folded parameter-name case that the real parser preserves), and safe probes
// found it disagreeing with the authority it was imitating on UPPERCASE
// parameter keys and on socket forms. A redactor that disagrees with the parser
// about where the credential is, is a leak waiting for the right input.
//
// The remedy is not a better transcription. It is that NOTHING HERE DECIDES
// what is safe to print, because no credential-bearing raw material is printed
// at all: `host.ts` names its target from the structured identity `pg` ITSELF
// resolved for the connection it made, and emits no userinfo and no query text
// in any form. There is therefore no name list to get wrong, no case rule to
// disagree about, and no second URL construction to diverge — see
// `PostgresEstateHost.describeTarget` and `TargetIdentity` in `host.ts`.

export interface PostgresStoreConfig {
  /**
   * Standard PostgreSQL connection string, in the ordinary
   * `postgresql://<user>:<password>@<host>:<port>/<database>` form. Supplied by
   * the deployment; never defaulted, never committed.
   *
   * Treated as OPAQUE, CREDENTIAL-BEARING material: it is passed to `pg` and
   * to nothing else, and no code in this directory renders it, or any part of
   * it, into a message.
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
