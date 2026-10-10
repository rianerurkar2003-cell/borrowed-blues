CREATE TABLE IF NOT EXISTS client_profiles (
  user_id CHAR(36) PRIMARY KEY,
  preferred_name VARCHAR(255) NULL,
  pronouns VARCHAR(100) NULL,
  gender_text VARCHAR(100) NULL,
  age TINYINT NULL,                         -- TODO(confirm): Anushka may need this (spec S1)
  city VARCHAR(255) NULL,
  timezone VARCHAR(100) NULL,
  occupation VARCHAR(255) NULL,
  structure_mode ENUM('step','single','call') NULL,
  stage1_status ENUM('not_started','in_progress','done','deferred_to_call') NOT NULL DEFAULT 'not_started',
  stage3_status ENUM('not_started','in_progress','done','skipped','deferred_to_call') NOT NULL DEFAULT 'not_started',
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS consent_acknowledgements (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  section_key ENUM('sessions','fees','confidentiality','data','rights') NOT NULL,
  acknowledged_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_ca_user_version_section (user_id, consent_version, section_key),
  CONSTRAINT fk_ca_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS consent_signatures (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  typed_name VARCHAR(255) NOT NULL,
  signed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS emergency_contacts (
  user_id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  relationship VARCHAR(100) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_ec_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS intake_disclosures (
  user_id CHAR(36) PRIMARY KEY,
  mode ENUM('free','prompts','in_session') NULL,
  free_text TEXT NULL,
  prompt_answers JSON NULL,
  hopes JSON NULL,                          -- array of {id, text, created_at}
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_id_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- See 003_reflection_visibility.sql for why ALTER TABLE ADD COLUMN needs this
-- idempotent stored-procedure guard (runMigrations() re-runs every file's
-- full SQL on every server boot, no applied-migrations tracking there).
-- CREATE TABLE IF NOT EXISTS above needs no such guard -- it's inherently
-- idempotent under repeated full-file execution.
DROP PROCEDURE IF EXISTS _bb_migration_005;
CREATE PROCEDURE _bb_migration_005()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'therapist_profile' AND COLUMN_NAME = 'fee_text'
  ) THEN
    -- TODO(confirm): real fee copy, owned by Anushka
    ALTER TABLE therapist_profile ADD COLUMN fee_text VARCHAR(255) NOT NULL DEFAULT 'Fees are discussed and confirmed before your first session.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'therapist_profile' AND COLUMN_NAME = 'cancellation_window_text'
  ) THEN
    -- TODO(confirm): real cancellation policy, owned by Anushka
    ALTER TABLE therapist_profile ADD COLUMN cancellation_window_text VARCHAR(255) NOT NULL DEFAULT '24 hours notice is appreciated for cancellations.';
  END IF;
END;
CALL _bb_migration_005();
DROP PROCEDURE _bb_migration_005;
