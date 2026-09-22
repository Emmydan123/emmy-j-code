CREATE TABLE IF NOT EXISTS programming_payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  payment_reference VARCHAR(120) NOT NULL UNIQUE,
  payment_method VARCHAR(80) NOT NULL,
  amount DECIMAL(12,2) NULL,
  note VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ NULL,
  reviewed_by BIGINT NULL,
  CONSTRAINT fk_programming_payments_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_programming_payments_reviewer FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_payment_user_status ON programming_payments(user_id, status);

CREATE TABLE IF NOT EXISTS programming_access (
  user_id BIGINT PRIMARY KEY,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  unlocked_by BIGINT NULL,
  CONSTRAINT fk_programming_access_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_programming_access_unlocked_by FOREIGN KEY(unlocked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Optional environment variable: PROGRAMMING_PAYMENT_INSTRUCTIONS="Your confirmed payment instructions here"
