CREATE TABLE IF NOT EXISTS programming_payments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 payment_reference VARCHAR(120) NOT NULL,
 payment_method VARCHAR(80) NOT NULL,
 amount DECIMAL(12,2) NULL,
 note VARCHAR(500) NULL,
 status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
 submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 reviewed_at TIMESTAMP NULL,
 reviewed_by INT UNSIGNED NULL,
 UNIQUE KEY uq_payment_reference(payment_reference),
 INDEX idx_payment_user_status(user_id,status),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS programming_access (
 user_id BIGINT UNSIGNED PRIMARY KEY,
 unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 unlocked_by BIGINT UNSIGNED NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(unlocked_by) REFERENCES users(id) ON DELETE SET NULL
);
-- Optional environment variable: PROGRAMMING_PAYMENT_INSTRUCTIONS="Your confirmed payment instructions here"
