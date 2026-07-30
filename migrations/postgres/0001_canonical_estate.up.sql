-- Straylight canonical estate store — migration 0001 (up).
--
-- Provider-neutral by construction (ADR-049Q §11.2, §11.6; P-2):
--   * ANSI/standard PostgreSQL DDL only. No CREATE EXTENSION, no
--     provider-managed role, no proprietary storage parameter, no
--     hosting-platform concept, and no connection/pooling/deployment
--     configuration. All of that lives at the adapter boundary
--     (ADR-049Q §11.3).
--   * No domain column, table, constraint, trigger, or comment names any
--     provider, host, cloud, or deployment. The schema below is the
--     Straylight domain model and nothing else.
--   * `jsonb` / `text` / `bigint` / `timestamptz` are core PostgreSQL
--     types available in every conforming PostgreSQL server. No
--     PostgreSQL-version-gated feature is used.
--
-- Semantic mapping to the unchanged StorageAdapter contract
-- (`src/straylight/storage/types.ts:33`; ADR-049Q §13.1(a), P-3):
--
--   upsert semantics (latest write wins by primary id)
--       actors, actor_estates, keyrings, estate_assertions
--   append-only, append-ordered, immutable
--       estate_transitions, transition_receipts, recall_receipts,
--       audit_events
--
-- Append-ordering is carried by `append_position` (a per-estate dense
-- sequence starting at 1), NOT by a global surrogate sequence and NOT by
-- `created_at`. Two reasons:
--   1. `created_at` is domain content supplied by the caller. The
--      existing MVP passes a fixed `now` in tests, so many rows share a
--      timestamp; ordering on it is not a total order.
--   2. A per-estate dense position makes "the append prefix is immutable"
--      and "there is exactly one child per chain position" expressible as
--      ordinary UNIQUE constraints the database itself enforces, rather
--      than as application invariants (P-3: integrity violations must
--      surface as errors, never silent drops).
--
-- Immutability is enforced by BEFORE UPDATE OR DELETE triggers on every
-- append-only table, so a direct `UPDATE`/`DELETE` from any client — the
-- adapter, psql, a restore script, an operator — is refused. This is a
-- database-level guarantee, not an adapter-level one (ADR-049Q §13.1(d)).

-- The `straylight_schema_migrations` ledger is owned by the RUNNER
-- (`src/straylight/storage/postgres/migrate.ts`), which creates it before
-- applying anything and never drops it. A migration file only records or
-- withdraws its own version row. If the ledger were created here, the
-- rollback → re-apply cycle required by ADR-049Q §13.1(f) would fail on
-- the second apply ("relation already exists"), so ledger ownership is
-- deliberately outside the versioned files.

-- ── immutability enforcement ────────────────────────────────────────────
--
-- One shared trigger function, attached to each append-only table. Raising
-- inside a BEFORE trigger aborts the statement AND the enclosing
-- transaction, so a mutation attempt can never partially apply.

CREATE FUNCTION straylight_refuse_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    'straylight: % on append-only table %.% is refused (immutable history)',
    TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

-- ── actors (upsert) ─────────────────────────────────────────────────────

CREATE TABLE actors (
  actor_id     text        PRIMARY KEY,
  payload      jsonb       NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── actor estates (upsert) ──────────────────────────────────────────────

CREATE TABLE actor_estates (
  estate_id    text        PRIMARY KEY,
  payload      jsonb       NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── keyrings (upsert) ───────────────────────────────────────────────────

CREATE TABLE keyrings (
  keyring_id   text        PRIMARY KEY,
  payload      jsonb       NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── estate assertions (upsert; status changes write a new version) ───────

CREATE TABLE estate_assertions (
  assertion_id text        PRIMARY KEY,
  estate_id    text        NOT NULL,
  payload      jsonb       NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX estate_assertions_estate_idx ON estate_assertions (estate_id);

-- ── estate transitions (append-only) ────────────────────────────────────

CREATE TABLE estate_transitions (
  transition_id   text   PRIMARY KEY,
  estate_id       text   NOT NULL,
  append_position bigint NOT NULL,
  payload         jsonb  NOT NULL,
  CONSTRAINT estate_transitions_position_positive
    CHECK (append_position >= 1),
  CONSTRAINT estate_transitions_estate_position_unique
    UNIQUE (estate_id, append_position)
);

CREATE INDEX estate_transitions_estate_order_idx
  ON estate_transitions (estate_id, append_position);

CREATE TRIGGER estate_transitions_immutable
  BEFORE UPDATE OR DELETE ON estate_transitions
  FOR EACH ROW EXECUTE FUNCTION straylight_refuse_mutation();

-- ── transition receipts (append-only) ───────────────────────────────────

CREATE TABLE transition_receipts (
  receipt_id      text   PRIMARY KEY,
  estate_id       text   NOT NULL,
  append_position bigint NOT NULL,
  payload         jsonb  NOT NULL,
  CONSTRAINT transition_receipts_position_positive
    CHECK (append_position >= 1),
  CONSTRAINT transition_receipts_estate_position_unique
    UNIQUE (estate_id, append_position)
);

CREATE INDEX transition_receipts_estate_order_idx
  ON transition_receipts (estate_id, append_position);

CREATE TRIGGER transition_receipts_immutable
  BEFORE UPDATE OR DELETE ON transition_receipts
  FOR EACH ROW EXECUTE FUNCTION straylight_refuse_mutation();

-- ── recall receipts (append-only) ───────────────────────────────────────
--
-- Recall receipts have no estate-scoped list accessor in the adapter
-- contract, but they are immutable artifacts, so they carry the same
-- append discipline. `estate_id` is denormalized from the payload for
-- export/restore comparison and per-estate positioning.

CREATE TABLE recall_receipts (
  receipt_id      text   PRIMARY KEY,
  estate_id       text   NOT NULL,
  append_position bigint NOT NULL,
  payload         jsonb  NOT NULL,
  CONSTRAINT recall_receipts_position_positive
    CHECK (append_position >= 1),
  CONSTRAINT recall_receipts_estate_position_unique
    UNIQUE (estate_id, append_position)
);

CREATE INDEX recall_receipts_estate_order_idx
  ON recall_receipts (estate_id, append_position);

CREATE TRIGGER recall_receipts_immutable
  BEFORE UPDATE OR DELETE ON recall_receipts
  FOR EACH ROW EXECUTE FUNCTION straylight_refuse_mutation();

-- ── audit events (append-only, hash-chained per estate) ─────────────────
--
-- Two chain guarantees are database-enforced, not adapter-enforced:
--
--   audit_events_estate_position_unique
--       exactly one event per (estate, position) — no duplicate append
--       position, so a concurrent racer cannot occupy a taken slot.
--   audit_events_estate_prev_unique
--       exactly one event per (estate, previous_audit_hash) — no two
--       children of the same chain tail, so a concurrent racer cannot
--       FORK the chain. A NULL previous_audit_hash (the genesis link)
--       would be exempt from a plain UNIQUE (NULLs never collide), so
--       genesis is normalized to the empty string in the dedicated
--       `previous_audit_hash_key` column while the nullable
--       `previous_audit_hash` column preserves the exact domain value
--       (undefined → NULL) for byte-faithful round-tripping.

CREATE TABLE audit_events (
  audit_event_id           text   PRIMARY KEY,
  estate_id                text   NOT NULL,
  append_position          bigint NOT NULL,
  audit_hash               text   NOT NULL,
  previous_audit_hash      text,
  previous_audit_hash_key  text   NOT NULL,
  payload                  jsonb  NOT NULL,
  CONSTRAINT audit_events_position_positive
    CHECK (append_position >= 1),
  CONSTRAINT audit_events_estate_position_unique
    UNIQUE (estate_id, append_position),
  CONSTRAINT audit_events_estate_prev_unique
    UNIQUE (estate_id, previous_audit_hash_key),
  -- The key column is the total-order-safe projection of the nullable
  -- domain column: NULL becomes '', everything else is identical. A row
  -- that disagrees is rejected, so the fork guarantee cannot be bypassed
  -- by writing an inconsistent pair.
  CONSTRAINT audit_events_prev_key_agrees
    CHECK (previous_audit_hash_key = COALESCE(previous_audit_hash, '')),
  -- Genesis (position 1) is the only link permitted to have no parent,
  -- and every later link MUST have one. This makes "the chain has exactly
  -- one root" a database fact.
  CONSTRAINT audit_events_genesis_shape
    CHECK (
      (append_position = 1 AND previous_audit_hash_key = '')
      OR
      (append_position > 1 AND previous_audit_hash_key <> '')
    )
);

CREATE INDEX audit_events_estate_order_idx
  ON audit_events (estate_id, append_position);

CREATE TRIGGER audit_events_immutable
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION straylight_refuse_mutation();

INSERT INTO straylight_schema_migrations (version) VALUES ('0001');
