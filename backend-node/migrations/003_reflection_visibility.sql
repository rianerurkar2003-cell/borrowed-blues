-- Note: runMigrations() in src/db.js re-runs every file in this folder's
-- full contents on EVERY server boot (no applied-migrations tracking there,
-- unlike scripts/migrate.js's CLI tool) -- so unlike earlier files, which
-- only ever use CREATE TABLE IF NOT EXISTS, these ALTER TABLE ADD COLUMNs
-- must be made idempotent by hand via a throwaway stored procedure, since
-- MySQL/MariaDB's ADD COLUMN IF NOT EXISTS support is version-dependent and
-- the production server's exact version isn't known.
DROP PROCEDURE IF EXISTS _bb_migration_003;
CREATE PROCEDURE _bb_migration_003()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reflections' AND COLUMN_NAME = 'visibility'
  ) THEN
    ALTER TABLE reflections ADD COLUMN visibility ENUM('private','shared') NOT NULL DEFAULT 'private';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'therapist_profile' AND COLUMN_NAME = 'reply_window_text'
  ) THEN
    -- TODO(confirm): real figure owned by Anushka (spec section 9) -- this
    -- default only preserves the current live app's hardcoded copy as-is.
    ALTER TABLE therapist_profile ADD COLUMN reply_window_text VARCHAR(255) NOT NULL DEFAULT 'one to two working days';
  END IF;
END;
CALL _bb_migration_003();
DROP PROCEDURE _bb_migration_003;
