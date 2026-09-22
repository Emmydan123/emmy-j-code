CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('student','teacher','admin')),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(40),
  country VARCHAR(100),
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture VARCHAR(255),
  preferred_language VARCHAR(20) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS onboarding_answers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  question_key VARCHAR(80) NOT NULL,
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, question_key),
  CONSTRAINT fk_onboarding_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  lesson_id VARCHAR(120) NOT NULL,
  status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started','passed')),
  best_score DECIMAL(5,2) DEFAULT 0,
  attempts INT DEFAULT 0,
  xp INT DEFAULT 0,
  coins INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, lesson_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER progress_updated_at
BEFORE UPDATE ON progress
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  lesson_id VARCHAR(120) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  answers_json JSONB,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_quiz_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_lesson ON quiz_attempts(user_id, lesson_id);

CREATE TABLE IF NOT EXISTS user_stats (
  user_id BIGINT PRIMARY KEY,
  xp INT NOT NULL DEFAULT 0,
  coins INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  last_active_date DATE NULL,
  rank_name VARCHAR(50) NOT NULL DEFAULT 'Rookie',
  learning_level VARCHAR(20) NOT NULL DEFAULT 'beginner',
  placement_completed BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_user_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS achievements (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(20) DEFAULT '🏆',
  xp_reward INT NOT NULL DEFAULT 0,
  coins_reward INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id BIGINT NOT NULL,
  achievement_id BIGINT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, achievement_id),
  CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certificates (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  certificate_code VARCHAR(80) NOT NULL UNIQUE,
  certificate_type VARCHAR(80) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_certificates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO achievements(code,name,description,icon,xp_reward,coins_reward)
VALUES
('first-lesson','First Steps','Pass your first lesson mastery test.','🌱',50,10),
('five-lessons','Five Lessons','Pass five lesson mastery tests.','📚',100,25),
('ten-lessons','Ten Lessons','Pass ten lesson mastery tests.','🔥',200,50),
('perfect-score','Perfect Score','Score 100% on a mastery test.','💯',75,20),
('beginner-complete','Beginner Complete','Pass every Beginner lesson in the current curriculum.','🎓',500,100),
('grand-master','Grand Master','Reach the Grand Master rank.','👑',500,100)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS classes (
  id BIGSERIAL PRIMARY KEY,
  teacher_id BIGINT NOT NULL,
  name VARCHAR(150) NOT NULL,
  class_code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

CREATE TABLE IF NOT EXISTS class_members (
  class_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(class_id, user_id),
  CONSTRAINT fk_class_members_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  CONSTRAINT fk_class_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assignments (
  id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL,
  title VARCHAR(180) NOT NULL,
  lesson_id VARCHAR(120) NOT NULL,
  due_date DATE NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_assignments_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
