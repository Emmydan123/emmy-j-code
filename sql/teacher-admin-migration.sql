ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_account_type_check,
  ALTER COLUMN account_type TYPE VARCHAR(20),
  ADD CONSTRAINT users_account_type_check CHECK (account_type IN ('student','teacher','admin'));

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
