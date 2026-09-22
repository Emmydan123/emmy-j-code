USE emmy_j_code;
CREATE TABLE IF NOT EXISTS placement_attempts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 level_assigned ENUM('beginner','intermediate','advanced') NOT NULL,
 score DECIMAL(5,2) NOT NULL,
 answers_json JSON,
 submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_placement_user(user_id)
);
CREATE TABLE IF NOT EXISTS level_upgrade_attempts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 target_level ENUM('intermediate','advanced') NOT NULL,
 score DECIMAL(5,2) NOT NULL,
 passed TINYINT(1) NOT NULL DEFAULT 0,
 answers_json JSON,
 submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS final_exam_attempts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 level ENUM('beginner','intermediate','advanced') NOT NULL,
 score DECIMAL(5,2) NOT NULL,
 passed TINYINT(1) NOT NULL DEFAULT 0,
 answers_json JSON,
 submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_final_exam_user_level(user_id,level)
);
