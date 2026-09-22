CREATE DATABASE IF NOT EXISTS emmy_j_code CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE emmy_j_code;

CREATE TABLE IF NOT EXISTS users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 account_type ENUM('student','teacher','admin') NOT NULL,
 full_name VARCHAR(150) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE,
 phone VARCHAR(40), country VARCHAR(100), username VARCHAR(80) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 avatar VARCHAR(255), preferred_language VARCHAR(20) DEFAULT 'en',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS onboarding_answers (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 question_key VARCHAR(80) NOT NULL,
 answer TEXT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_onboarding (user_id, question_key),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS progress (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 lesson_id VARCHAR(120) NOT NULL,
 status ENUM('started','passed') DEFAULT 'started',
 best_score DECIMAL(5,2) DEFAULT 0,
 attempts INT UNSIGNED DEFAULT 0,
 xp INT DEFAULT 0,
 coins INT DEFAULT 0,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_progress (user_id, lesson_id),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS quiz_attempts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 lesson_id VARCHAR(120) NOT NULL,
 score DECIMAL(5,2) NOT NULL,
 passed TINYINT(1) NOT NULL DEFAULT 0,
 answers_json JSON,
 submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_attempts_user_lesson (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS user_stats (
 user_id INT UNSIGNED PRIMARY KEY,
 xp INT NOT NULL DEFAULT 0,
 coins INT NOT NULL DEFAULT 0,
 streak_days INT NOT NULL DEFAULT 0,
 last_active_date DATE NULL,
 rank_name VARCHAR(50) NOT NULL DEFAULT 'Rookie',
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS achievements (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(80) NOT NULL UNIQUE,
 name VARCHAR(120) NOT NULL,
 description VARCHAR(255) NOT NULL,
 icon VARCHAR(20) DEFAULT '🏆',
 xp_reward INT NOT NULL DEFAULT 0,
 coins_reward INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS user_achievements (
 user_id INT UNSIGNED NOT NULL,
 achievement_id BIGINT UNSIGNED NOT NULL,
 earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(user_id,achievement_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS certificates (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL,
 certificate_code VARCHAR(80) NOT NULL UNIQUE,
 certificate_type VARCHAR(80) NOT NULL,
 issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT IGNORE INTO achievements(code,name,description,icon,xp_reward,coins_reward) VALUES
('first-lesson','First Steps','Pass your first lesson mastery test.','🌱',50,10),
('five-lessons','Five Lessons','Pass five lesson mastery tests.','📚',100,25),
('ten-lessons','Ten Lessons','Pass ten lesson mastery tests.','🔥',200,50),
('perfect-score','Perfect Score','Score 100% on a mastery test.','💯',75,20),
('beginner-complete','Beginner Complete','Pass every Beginner lesson in the current curriculum.','🎓',500,100),
('grand-master','Grand Master','Reach the Grand Master rank.','👑',500,100);

CREATE TABLE IF NOT EXISTS classes (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 teacher_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(150) NOT NULL,
 class_code VARCHAR(20) NOT NULL UNIQUE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
 INDEX idx_classes_teacher (teacher_id)
);
CREATE TABLE IF NOT EXISTS class_members (
 class_id BIGINT UNSIGNED NOT NULL,
 user_id INT UNSIGNED NOT NULL,
 joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(class_id,user_id),
 FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS assignments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 class_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(180) NOT NULL,
 lesson_id VARCHAR(120) NOT NULL,
 due_date DATE NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
 INDEX idx_assignments_class(class_id)
);
