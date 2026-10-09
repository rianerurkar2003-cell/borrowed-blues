-- See 003_reflection_visibility.sql for why this idempotent stored-procedure
-- pattern is required (runMigrations() re-runs every file's full SQL on
-- every server boot, no applied-migrations tracking there).
DROP PROCEDURE IF EXISTS _bb_migration_004;
CREATE PROCEDURE _bb_migration_004()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultation_requests' AND COLUMN_NAME = 'preferred_contact'
  ) THEN
    ALTER TABLE consultation_requests ADD COLUMN preferred_contact ENUM('email','phone_call') NOT NULL DEFAULT 'email';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultation_requests' AND COLUMN_NAME = 'preferred_language'
  ) THEN
    ALTER TABLE consultation_requests ADD COLUMN preferred_language VARCHAR(50) NOT NULL DEFAULT 'English';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultation_requests' AND COLUMN_NAME = 'is_adult'
  ) THEN
    ALTER TABLE consultation_requests ADD COLUMN is_adult TINYINT(1) NOT NULL DEFAULT 1;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'therapist_profile' AND COLUMN_NAME = 'languages'
  ) THEN
    ALTER TABLE therapist_profile ADD COLUMN languages JSON NULL;
  END IF;
  UPDATE therapist_profile SET languages = JSON_ARRAY('English','Hindi','Marathi') WHERE languages IS NULL;
  -- email is now optional (phone-only contact is allowed) -- MODIFY COLUMN is
  -- naturally idempotent (re-asserting the same definition errors on nothing),
  -- unlike ADD COLUMN, so no information_schema guard needed here.
  ALTER TABLE consultation_requests MODIFY COLUMN email VARCHAR(255) NULL;
END;
CALL _bb_migration_004();
DROP PROCEDURE _bb_migration_004;
