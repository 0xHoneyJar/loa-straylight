// The complete set of SQL statements the canonical store issues.
//
// Provider-neutral (ADR-049Q §11.2, §11.6; P-2): standard SQL only, no
// provider extension, no proprietary function, no deployment concept. Every
// statement is parameterized — no value is ever interpolated into SQL text.
//
// This module holds statement TEXT only, so the read/verify/persist logic
// beside it stays readable and every statement the store can issue is
// enumerable in one place.

// ── schema version ──────────────────────────────────────────────────────
//
// The ledger is owned by the RUNNER (`migrate.ts`), not by a versioned file,
// so rollback → re-apply works. Each row binds a version to the deterministic
// checksum of the migration content that was applied for it, and that binding
// is IMMUTABLE: a BEFORE UPDATE OR DELETE trigger refuses any change to the
// checksum of an existing row, so a stale or forged checksum cannot be written
// over a correct one through the ordinary SQL surface.

export const CREATE_MIGRATION_LEDGER = `
  CREATE TABLE IF NOT EXISTS straylight_schema_migrations (
    version    text        PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

// The checksum column is added separately (not folded into the CREATE above)
// so a ledger created by an earlier build gains the column rather than being
// left without it. Adding it as NULLable is deliberate: a pre-existing row has
// no recorded checksum, and a MISSING checksum must FAIL CLOSED at verification
// time rather than be silently backfilled from whatever content ships now.
export const ADD_MIGRATION_LEDGER_CHECKSUM = `
  ALTER TABLE straylight_schema_migrations
    ADD COLUMN IF NOT EXISTS content_checksum text
`;

// Immutability of the recorded binding. A ledger row's checksum is written once
// by the apply path; refusing UPDATE/DELETE of an existing checksum means a
// forged checksum cannot be swapped in to make changed migration content look
// applied. Withdrawal is still possible via the rollback path, which deletes
// the row through the same trigger's DELETE arm — so the trigger permits DELETE
// while refusing an in-place checksum rewrite.
export const CREATE_MIGRATION_LEDGER_IMMUTABILITY = `
  CREATE OR REPLACE FUNCTION straylight_refuse_checksum_rewrite() RETURNS trigger AS $$
  BEGIN
    IF OLD.content_checksum IS NOT NULL
       AND (NEW.content_checksum IS NULL OR NEW.content_checksum <> OLD.content_checksum) THEN
      RAISE EXCEPTION
        'straylight: the recorded migration checksum for version % is immutable', OLD.version
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql
`;

// DROP + CREATE rather than `CREATE OR REPLACE TRIGGER`: the latter is core but
// only from PostgreSQL 14, and the store commits to no version-gated feature
// (§11.2, P-2). The pair is idempotent and runs inside the caller's
// transaction, so a concurrent runner never observes the trigger absent.
export const DROP_MIGRATION_LEDGER_IMMUTABILITY = `
  DROP TRIGGER IF EXISTS straylight_schema_migrations_checksum_immutable
    ON straylight_schema_migrations
`;

export const ATTACH_MIGRATION_LEDGER_IMMUTABILITY = `
  CREATE TRIGGER straylight_schema_migrations_checksum_immutable
    BEFORE UPDATE ON straylight_schema_migrations
    FOR EACH ROW EXECUTE FUNCTION straylight_refuse_checksum_rewrite()
`;

export const SELECT_APPLIED_VERSIONS = `
  SELECT version FROM straylight_schema_migrations ORDER BY version ASC
`;

// Version + its recorded checksum. `content_checksum` is NULL for a row written
// by a build that predates checksum binding; the caller treats NULL as a
// verification FAILURE, never as "no opinion".
export const SELECT_APPLIED_MIGRATIONS = `
  SELECT version, content_checksum
    FROM straylight_schema_migrations ORDER BY version ASC
`;

// Record the checksum for the version the migration file itself just claimed.
// Runs inside the SAME transaction as the migration DDL, so a migration that
// fails partway leaves neither the DDL nor the checksum binding.
export const BIND_MIGRATION_CHECKSUM = `
  UPDATE straylight_schema_migrations
     SET content_checksum = $2
   WHERE version = $1 AND content_checksum IS NULL
`;

// ── snapshot load (per estate) ──────────────────────────────────────────
//
// Estate-scoped loads take the estate id; the actor/keyring loads follow
// from the estate's own references, so an unrelated estate's rows never
// enter a session's snapshot (the cross-estate isolation proof).

export const SELECT_ESTATE = `
  SELECT estate_id, payload FROM actor_estates WHERE estate_id = $1
`;

export const SELECT_ACTORS_FOR_ESTATE = `
  SELECT actor_id, payload FROM actors WHERE actor_id = ANY($1::text[])
`;

export const SELECT_KEYRINGS_FOR_ESTATE = `
  SELECT keyring_id, payload FROM keyrings WHERE keyring_id = ANY($1::text[])
`;

export const SELECT_ASSERTIONS = `
  SELECT assertion_id, estate_id, payload
    FROM estate_assertions
   WHERE estate_id = $1
   ORDER BY assertion_id ASC
`;

export const SELECT_TRANSITIONS = `
  SELECT transition_id, estate_id, append_position, payload
    FROM estate_transitions
   WHERE estate_id = $1
   ORDER BY append_position ASC
`;

export const SELECT_TRANSITION_RECEIPTS = `
  SELECT receipt_id, estate_id, append_position, payload
    FROM transition_receipts
   WHERE estate_id = $1
   ORDER BY append_position ASC
`;

export const SELECT_RECALL_RECEIPTS = `
  SELECT receipt_id, estate_id, append_position, payload
    FROM recall_receipts
   WHERE estate_id = $1
   ORDER BY append_position ASC
`;

export const SELECT_AUDIT_EVENTS = `
  SELECT audit_event_id, estate_id, append_position,
         audit_hash, previous_audit_hash, payload
    FROM audit_events
   WHERE estate_id = $1
   ORDER BY append_position ASC
`;

// ── whole-store load (export comparison / restore verification) ─────────

export const SELECT_ALL_ACTORS = `
  SELECT actor_id, payload FROM actors ORDER BY actor_id ASC
`;
export const SELECT_ALL_ESTATES = `
  SELECT estate_id, payload FROM actor_estates ORDER BY estate_id ASC
`;
export const SELECT_ALL_KEYRINGS = `
  SELECT keyring_id, payload FROM keyrings ORDER BY keyring_id ASC
`;
export const SELECT_ALL_ASSERTIONS = `
  SELECT assertion_id, estate_id, payload FROM estate_assertions
   ORDER BY assertion_id ASC
`;
export const SELECT_ALL_TRANSITIONS = `
  SELECT transition_id, estate_id, append_position, payload
    FROM estate_transitions ORDER BY estate_id ASC, append_position ASC
`;
export const SELECT_ALL_TRANSITION_RECEIPTS = `
  SELECT receipt_id, estate_id, append_position, payload
    FROM transition_receipts ORDER BY estate_id ASC, append_position ASC
`;
export const SELECT_ALL_RECALL_RECEIPTS = `
  SELECT receipt_id, estate_id, append_position, payload
    FROM recall_receipts ORDER BY estate_id ASC, append_position ASC
`;
export const SELECT_ALL_AUDIT_EVENTS = `
  SELECT audit_event_id, estate_id, append_position,
         audit_hash, previous_audit_hash, payload
    FROM audit_events ORDER BY estate_id ASC, append_position ASC
`;

export const SELECT_ALL_ESTATE_IDS = `
  SELECT estate_id FROM actor_estates ORDER BY estate_id ASC
`;

// ── per-estate serialization ────────────────────────────────────────────
//
// The estate row is locked FOR UPDATE, so two transactions touching the
// same estate serialize on it and the second one's snapshot is taken AFTER
// the first commits. This is what re-establishes the single-writer-
// equivalent ordering that the JSONL adapter merely assumed
// (`src/straylight/storage/jsonl.ts:15`-`:20`; P-12).
//
// Locking the ESTATE row (not a whole table) is what keeps different
// estates concurrent: two sessions on different estates never contend.

export const LOCK_ESTATE = `
  SELECT estate_id FROM actor_estates WHERE estate_id = $1 FOR UPDATE
`;

// A bootstrap session creates the estate row, so there is no row to lock
// yet. An advisory lock keyed by the estate id serializes those sessions
// against each other and against later row-lock sessions on the same
// estate — the estate-scoped mutex exists before the estate does.
// `hashtextextended` is a core PostgreSQL function, not an extension.
export const LOCK_ESTATE_ADVISORY = `
  SELECT pg_advisory_xact_lock(hashtextextended($1, 0))
`;

// ── immutable-prefix re-verification ────────────────────────────────────
//
// Before persisting, the host re-reads the append-only prefix state it
// loaded and requires it to be UNCHANGED. Under the estate lock this can
// only differ if the snapshot predates a committed writer, which is
// precisely the lost-update / non-prefix-history case that must fail
// closed rather than append onto a stale view.

export const COUNT_AND_TAIL_AUDIT = `
  SELECT count(*)::bigint AS row_count,
         max(append_position)::bigint AS max_position
    FROM audit_events WHERE estate_id = $1
`;
export const COUNT_TRANSITIONS = `
  SELECT count(*)::bigint AS row_count,
         max(append_position)::bigint AS max_position
    FROM estate_transitions WHERE estate_id = $1
`;
export const COUNT_TRANSITION_RECEIPTS = `
  SELECT count(*)::bigint AS row_count,
         max(append_position)::bigint AS max_position
    FROM transition_receipts WHERE estate_id = $1
`;
export const COUNT_RECALL_RECEIPTS = `
  SELECT count(*)::bigint AS row_count,
         max(append_position)::bigint AS max_position
    FROM recall_receipts WHERE estate_id = $1
`;

// ── writes ──────────────────────────────────────────────────────────────
//
// Upsert tables use ON CONFLICT DO UPDATE (latest write wins by primary id).
// Append-only tables use plain INSERT: no ON CONFLICT clause exists, so an
// id or position collision RAISES rather than being absorbed. Idempotent
// retry is handled explicitly against the existing row's canonical payload
// (`persist.ts`), never by a blanket DO NOTHING that would also swallow a
// genuine conflict.

export const UPSERT_ACTOR = `
  INSERT INTO actors (actor_id, payload, updated_at)
  VALUES ($1, $2::jsonb, now())
  ON CONFLICT (actor_id)
  DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
`;

export const UPSERT_ESTATE = `
  INSERT INTO actor_estates (estate_id, payload, updated_at)
  VALUES ($1, $2::jsonb, now())
  ON CONFLICT (estate_id)
  DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
`;

export const UPSERT_KEYRING = `
  INSERT INTO keyrings (keyring_id, payload, updated_at)
  VALUES ($1, $2::jsonb, now())
  ON CONFLICT (keyring_id)
  DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
`;

export const UPSERT_ASSERTION = `
  INSERT INTO estate_assertions (assertion_id, estate_id, payload, updated_at)
  VALUES ($1, $2, $3::jsonb, now())
  ON CONFLICT (assertion_id)
  DO UPDATE SET estate_id = EXCLUDED.estate_id,
                payload   = EXCLUDED.payload,
                updated_at = now()
`;

export const INSERT_TRANSITION = `
  INSERT INTO estate_transitions
    (transition_id, estate_id, append_position, payload)
  VALUES ($1, $2, $3, $4::jsonb)
`;

export const INSERT_TRANSITION_RECEIPT = `
  INSERT INTO transition_receipts
    (receipt_id, estate_id, append_position, payload)
  VALUES ($1, $2, $3, $4::jsonb)
`;

export const INSERT_RECALL_RECEIPT = `
  INSERT INTO recall_receipts
    (receipt_id, estate_id, append_position, payload)
  VALUES ($1, $2, $3, $4::jsonb)
`;

export const INSERT_AUDIT_EVENT = `
  INSERT INTO audit_events
    (audit_event_id, estate_id, append_position,
     audit_hash, previous_audit_hash, previous_audit_hash_key, payload)
  VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
`;

// ── existing-row lookups for idempotent retry ───────────────────────────
//
// Each statement selects EVERY durable column of its table, because
// idempotency is decided by complete-row equality (`persist.ts`), never by the
// canonical payload alone. A promoted enforcement column that the SELECT did
// not return would be a column the equality check could not see — which is
// precisely how a row with the right id and payload but the wrong estate,
// position, or chain link could be miscounted as an idempotent retry.

export const SELECT_TRANSITION_BY_ID = `
  SELECT transition_id, estate_id, append_position, payload
    FROM estate_transitions WHERE transition_id = $1
`;
export const SELECT_TRANSITION_RECEIPT_BY_ID = `
  SELECT receipt_id, estate_id, append_position, payload
    FROM transition_receipts WHERE receipt_id = $1
`;
export const SELECT_RECALL_RECEIPT_BY_ID = `
  SELECT receipt_id, estate_id, append_position, payload
    FROM recall_receipts WHERE receipt_id = $1
`;
export const SELECT_AUDIT_EVENT_BY_ID = `
  SELECT audit_event_id, estate_id, append_position,
         audit_hash, previous_audit_hash, previous_audit_hash_key, payload
    FROM audit_events WHERE audit_event_id = $1
`;
