CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('therapist','client') NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token VARCHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_prt_expires_at (expires_at),
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_attempts (
  identifier VARCHAR(255) PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME(3) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) PRIMARY KEY,
  client_id CHAR(36) NOT NULL,
  therapist_id CHAR(36) NOT NULL,
  date VARCHAR(10) NOT NULL,
  time VARCHAR(8) NOT NULL,
  duration_min INT NOT NULL DEFAULT 50,
  mode ENUM('online','in-person') NOT NULL DEFAULT 'online',
  status ENUM('scheduled','completed','cancelled','requested') NOT NULL,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_appt_therapist_date (therapist_id, date),
  KEY idx_appt_client_date (client_id, date),
  KEY idx_appt_status (status),
  CONSTRAINT fk_appt_client FOREIGN KEY (client_id) REFERENCES users(id),
  CONSTRAINT fk_appt_therapist FOREIGN KEY (therapist_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS session_notes (
  id CHAR(36) PRIMARY KEY,
  therapist_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  appointment_id CHAR(36) NULL,
  summary TEXT NOT NULL,
  homework TEXT NULL,
  resources JSON NULL,
  shared_with_client TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_sn_client_created (client_id, created_at DESC),
  KEY idx_sn_therapist_created (therapist_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS homework (
  id CHAR(36) PRIMARY KEY,
  therapist_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('checklist','writing','breathing','reading') NOT NULL DEFAULT 'writing',
  items JSON NULL,
  due_date VARCHAR(10) NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  completed_items JSON NOT NULL,
  client_notes TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_hw_client_created (client_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reflections (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  mood VARCHAR(64) NULL,
  is_draft TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_refl_user_created (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resources (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  kind ENUM('article','pdf','video','link') NOT NULL DEFAULT 'article',
  url VARCHAR(1024) NULL,
  body LONGTEXT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_res_public_category (is_public, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS consultation_requests (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NULL,
  reason TEXT NULL,
  preferred_time VARCHAR(255) NULL,
  status ENUM('new','accepted','declined') NOT NULL DEFAULT 'new',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_cr_status_created (status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS therapist_profile (
  slug VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  personal_note TEXT NOT NULL,
  approach TEXT NOT NULL,
  qualifications JSON NOT NULL,
  areas JSON NOT NULL,
  pillars JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
