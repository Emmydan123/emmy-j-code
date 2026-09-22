CREATE TABLE IF NOT EXISTS placement_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  level_assigned VARCHAR(20) NOT NULL CHECK (level_assigned IN ('beginner','intermediate','advanced')),
  score DECIMAL(5,2) NOT NULL,
  answers_json JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_placement_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_placement_user ON placement_attempts(user_id);

CREATE TABLE IF NOT EXISTS level_upgrade_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  target_level VARCHAR(20) NOT NULL CHECK (target_level IN ('intermediate','advanced')),
  score DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  answers_json JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_upgrade_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS final_exam_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  score DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  answers_json JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_final_exam_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_final_exam_user_level ON final_exam_attempts(user_id, level);
