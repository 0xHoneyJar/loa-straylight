-- Straylight canonical estate store — migration 0001 (down / rollback).
--
-- ADR-049Q §13.1(f) and P-9: a rollback path must EXIST before a migration
-- is attempted, and it must be provider-neutral. This file is that path
-- for 0001.
--
-- Ordering: triggers go with their tables (DROP TABLE removes them), the
-- shared trigger function is dropped after every table that references it,
-- and the migration ledger row is removed last so a partially-rolled-back
-- state can never claim version 0001 is applied.
--
-- DESTRUCTIVE: dropping these tables discards canonical estate rows. The
-- runbook (docs/runbooks/phase-50a-postgresql-backup-restore-and-rollback.md)
-- requires an export BEFORE rollback for any database holding estate data.
-- Phase 50A exercises rollback in non-production only; it authorizes no
-- production migration and no production rollback (ADR-049Q §13.2, §13.3).

DROP TABLE IF EXISTS audit_events;
DROP TABLE IF EXISTS recall_receipts;
DROP TABLE IF EXISTS transition_receipts;
DROP TABLE IF EXISTS estate_transitions;
DROP TABLE IF EXISTS estate_assertions;
DROP TABLE IF EXISTS keyrings;
DROP TABLE IF EXISTS actor_estates;
DROP TABLE IF EXISTS actors;

DROP FUNCTION IF EXISTS straylight_refuse_mutation();

DELETE FROM straylight_schema_migrations WHERE version = '0001';
