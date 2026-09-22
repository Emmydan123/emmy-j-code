const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-only-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);
app.use(express.static(path.join(__dirname, '..')));

function clean(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  next();
}

function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Please log in first.' });
    }

    try {
      const [rows] = await db.query('SELECT account_type FROM users WHERE id = ? LIMIT 1', [req.session.userId]);
      const accountType = rows[0]?.account_type;
      if (!accountType || !roles.includes(accountType)) {
        return res.status(403).json({ error: 'You do not have permission for this area.' });
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Permission check failed.' });
    }
  };
}

const RANKS = [
  { name: 'Rookie', minXP: 0 },
  { name: 'Bronze', minXP: 500 },
  { name: 'Silver', minXP: 2000 },
  { name: 'Gold', minXP: 4000 },
  { name: 'Platinum', minXP: 7000 },
  { name: 'Diamond', minXP: 11000 },
  { name: 'Master', minXP: 16000 },
  { name: 'Grand Master', minXP: 22000, programmingUnlock: true },
  { name: 'Legend', minXP: 30000 },
];

function rankForXP(xp) {
  return [...RANKS].reverse().find((rank) => xp >= rank.minXP) || RANKS[0];
}

function rankIndex(name) {
  const index = RANKS.findIndex((rank) => rank.name === name);
  return index < 0 ? 0 : index;
}

const LEVEL_ORDER = { beginner: 1, intermediate: 2, advanced: 3 };
const LEVEL_LESSONS = {
  beginner: ['bf-01-02', 'bf-01-03', 'bf-01-04', 'bf-01-05', 'bf-01-06', 'bf-01-07', 'bf-01-08', 'bf-01-09', 'bf-01-10', 'bf-01-11', 'bf-01-12'],
  intermediate: ['im-01', 'im-02', 'im-03', 'im-04', 'im-05', 'im-06', 'im-07', 'im-08', 'im-09', 'im-10', 'im-11', 'im-12', 'im-13', 'im-14'],
  advanced: ['ad-01', 'ad-02', 'ad-03', 'ad-04', 'ad-05', 'ad-06', 'ad-07', 'ad-08'],
};

function gradeLevelFromScore(score) {
  if (score >= 80) return 'advanced';
  if (score >= 60) return 'intermediate';
  return 'beginner';
}

function isoDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(date);
}

async function touchActivity(userId) {
  const today = isoDate();
  const [rows] = await db.query('SELECT streak_days, last_active_date FROM user_stats WHERE user_id = ? LIMIT 1', [userId]);
  if (!rows.length) return;

  const last = rows[0].last_active_date;
  let streak = Number(rows[0].streak_days || 0);

  if (!last) {
    streak = 1;
  } else {
    const lastMs = new Date(`${String(last).slice(0, 10)}T00:00:00Z`).getTime();
    const todayMs = new Date(`${today}T00:00:00Z`).getTime();
    const diff = Math.round((todayMs - lastMs) / 86400000);
    if (diff === 1) streak += 1;
    else if (diff > 1) streak = 1;
  }

  await db.query('UPDATE user_stats SET streak_days = ?, last_active_date = ? WHERE user_id = ?', [streak, today, userId]);
}

async function refreshRank(userId) {
  const [rows] = await db.query('SELECT xp FROM user_stats WHERE user_id = ? LIMIT 1', [userId]);
  const rank = rankForXP(Number(rows[0]?.xp || 0));
  await db.query('UPDATE user_stats SET rank_name = ? WHERE user_id = ?', [rank.name, userId]);
  return rank;
}

async function awardAchievement(userId, code) {
  const [achievements] = await db.query('SELECT * FROM achievements WHERE code = ? LIMIT 1', [code]);
  if (!achievements.length) return false;

  const achievement = achievements[0];
  await db.query(
    `INSERT INTO user_achievements (user_id, achievement_id)
     SELECT ?, id FROM achievements WHERE code = ?
     ON CONFLICT (user_id, achievement_id) DO NOTHING`,
    [userId, code]
  );

  const [exists] = await db.query('SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_id = ? LIMIT 1', [userId, achievement.id]);
  if (!exists.length) return false;

  await db.query(
    'UPDATE user_stats SET xp = xp + ?, coins = coins + ? WHERE user_id = ?',
    [achievement.xp_reward, achievement.coins_reward, userId]
  );
  return true;
}

async function allLevelLessonsPassed(userId, level) {
  const ids = LEVEL_LESSONS[level] || [];
  if (!ids.length) return false;

  const [rows] = await db.query(
    `SELECT lesson_id FROM progress WHERE user_id = ? AND status = 'passed' AND lesson_id IN (${ids.map(() => '?').join(',')})`,
    [userId, ...ids]
  );

  return rows.length === ids.length;
}

const PAYMENT_INSTRUCTIONS =
  process.env.PROGRAMMING_PAYMENT_INSTRUCTIONS ||
  'Contact the Emmy J Code administrator for the current programming payment instructions. Do not send money to anyone claiming to represent Emmy J Code unless the payment details have been confirmed by the administrator.';

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, database: true });
  } catch (error) {
    console.error(error);
    res.status(503).json({ ok: false, database: false, error: 'Database connection failed.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { accountType, fullName, email, phone, country, username, password, profile_picture } = req.body;
  if (!['student', 'teacher'].includes(accountType) || !clean(fullName) || !clean(email) || !clean(username) || !password || password.length < 8) {
    return res.status(400).json({ error: 'Enter all required details. Password must be at least 8 characters.' });
  }

  try {
    const normalizedEmail = clean(email).toLowerCase();
    const normalizedUsername = clean(username);

    const [existing] = await db.query('SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1', [normalizedEmail, normalizedUsername]);
    if (existing.length) {
      return res.status(409).json({ error: 'Email or username is already in use.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const [insertResult] = await db.query(
      'INSERT INTO users (account_type, full_name, email, phone, country, username, password_hash, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [accountType, clean(fullName), normalizedEmail, clean(phone) || null, clean(country) || null, normalizedUsername, hash, clean(profile_picture) || null]
    );

    const userId = insertResult[0]?.id;
    await db.query('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);
    req.session.userId = userId;

    res.status(201).json({
      user: {
        id: userId,
        accountType,
        fullName: clean(fullName),
        email: normalizedEmail,
        username: normalizedUsername,
        profile_picture: clean(profile_picture) || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const identifier = clean(req.body.identifier);
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Enter your username/email and password.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1', [identifier.toLowerCase(), identifier]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Incorrect login details.' });
    }

    req.session.userId = rows[0].id;
    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        accountType: user.account_type,
        fullName: user.full_name,
        email: user.email,
        username: user.username,
        profile_picture: user.profile_picture,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, account_type, full_name, email, phone, country, username, profile_picture, preferred_language FROM users WHERE id = ? LIMIT 1',
    [req.session.userId]
  );

  if (!rows.length) {
    return res.status(401).json({ error: 'Session expired.' });
  }

  const user = rows[0];
  res.json({
    user: {
      id: user.id,
      accountType: user.account_type,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      username: user.username,
      profile_picture: user.profile_picture,
      preferredLanguage: user.preferred_language,
    },
  });
});

app.post('/api/onboarding', requireAuth, async (req, res) => {
  const answers = req.body.answers || {};
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    for (const [key, value] of Object.entries(answers)) {
      await conn.query(
        `INSERT INTO onboarding_answers (user_id, question_key, answer)
         VALUES (?, ?, ?)
         ON CONFLICT (user_id, question_key) DO UPDATE SET answer = EXCLUDED.answer`,
        [req.session.userId, key, JSON.stringify(value)]
      );
    }
    await conn.commit();
    res.json({ ok: true });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ error: 'Could not save onboarding.' });
  } finally {
    conn.release();
  }
});

app.get('/api/student/level', requireAuth, async (req, res) => {
  const [statsRows] = await db.query('SELECT learning_level, placement_completed, xp, coins, rank_name FROM user_stats WHERE user_id = ? LIMIT 1', [req.session.userId]);
  const level = statsRows[0]?.learning_level || 'beginner';
  const progress = {};

  for (const [name, ids] of Object.entries(LEVEL_LESSONS)) {
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS passed FROM progress WHERE user_id = ? AND status = 'passed' AND lesson_id IN (${ids.map(() => '?').join(',')})`,
      [req.session.userId, ...ids]
    );
    progress[name] = { passed: Number(countRows[0]?.passed || 0), total: ids.length };
  }

  res.json({
    level,
    placementCompleted: !!statsRows[0]?.placement_completed,
    progress,
    stats: statsRows[0] || { xp: 0, coins: 0, rank_name: 'Rookie' },
  });
});

app.post('/api/placement/submit', requireAuth, async (req, res) => {
  const score = Number(req.body.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return res.status(400).json({ error: 'Invalid placement score.' });
  }

  const level = gradeLevelFromScore(score);
  await db.query(
    'INSERT INTO placement_attempts (user_id, level_assigned, score, answers_json) VALUES (?, ?, ?, ?)',
    [req.session.userId, level, score, JSON.stringify(req.body.answers || {})]
  );
  await db.query('UPDATE user_stats SET learning_level = ?, placement_completed = 1 WHERE user_id = ?', [level, req.session.userId]);
  res.json({ ok: true, level, score });
});

app.post('/api/level-upgrade', requireAuth, async (req, res) => {
  const target = clean(req.body.targetLevel);
  const score = Number(req.body.score);

  if (!['intermediate', 'advanced'].includes(target) || !Number.isFinite(score) || score < 0 || score > 100) {
    return res.status(400).json({ error: 'Invalid upgrade assessment.' });
  }

  const [rows] = await db.query('SELECT learning_level FROM user_stats WHERE user_id = ? LIMIT 1', [req.session.userId]);
  const current = rows[0]?.learning_level || 'beginner';

  if (LEVEL_ORDER[target] !== LEVEL_ORDER[current] + 1) {
    return res.status(400).json({ error: 'Complete the current level before upgrading.' });
  }

  const passed = score >= 80;
  await db.query(
    'INSERT INTO level_upgrade_attempts (user_id, target_level, score, passed, answers_json) VALUES (?, ?, ?, ?, ?)',
    [req.session.userId, target, score, passed, JSON.stringify(req.body.answers || {})]
  );

  if (passed) {
    await db.query('UPDATE user_stats SET learning_level = ? WHERE user_id = ?', [target, req.session.userId]);
  }

  res.json({ passed, score, targetLevel: target });
});

app.get('/api/final-exam/status', requireAuth, async (req, res) => {
  const level = clean(req.query.level) || 'beginner';
  if (!LEVEL_LESSONS[level]) {
    return res.status(400).json({ error: 'Invalid level.' });
  }

  const ready = await allLevelLessonsPassed(req.session.userId, level);
  const [attempts] = await db.query(
    'SELECT score, passed, submitted_at FROM final_exam_attempts WHERE user_id = ? AND level = ? ORDER BY submitted_at DESC LIMIT 5',
    [req.session.userId, level]
  );
  res.json({ level, ready, attempts });
});

app.post('/api/final-exam/submit', requireAuth, async (req, res) => {
  const level = clean(req.body.level);
  const score = Number(req.body.score);
  if (!LEVEL_LESSONS[level] || !Number.isFinite(score) || score < 0 || score > 100) {
    return res.status(400).json({ error: 'Invalid final exam.' });
  }

  if (!(await allLevelLessonsPassed(req.session.userId, level))) {
    return res.status(403).json({ error: 'Pass every lesson in this level before taking the final exam.' });
  }

  const passed = score >= 80;
  await db.query(
    'INSERT INTO final_exam_attempts (user_id, level, score, passed, answers_json) VALUES (?, ?, ?, ?, ?)',
    [req.session.userId, level, score, passed, JSON.stringify(req.body.answers || {})]
  );

  let certificate = null;
  if (passed) {
    const type = level === 'beginner' ? 'Beginner Computer Skills' : level === 'intermediate' ? 'Intermediate Computer Operation' : 'Advanced IT Skills';
    const [existing] = await db.query('SELECT certificate_code, certificate_type, issued_at FROM certificates WHERE user_id = ? AND certificate_type = ? LIMIT 1', [req.session.userId, type]);
    if (existing.length) {
      certificate = existing[0];
    } else {
      const code = `EJC-${level.slice(0, 3).toUpperCase()}-${req.session.userId}-${Date.now().toString(36).toUpperCase()}`;
      const [result] = await db.query(
        'INSERT INTO certificates (user_id, certificate_code, certificate_type) VALUES (?, ?, ?) RETURNING certificate_code, certificate_type',
        [req.session.userId, code, type]
      );
      certificate = result[0] || { certificate_code: code, certificate_type: type };
    }
  }

  res.json({ passed, score, certificate });
});

app.get('/api/learning/notifications', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [req.session.userId]);
  res.json({ notifications: rows });
});

app.post('/api/learning/notifications/:id/read', requireAuth, async (req, res) => {
  await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [Number(req.params.id), req.session.userId]);
  res.json({ ok: true });
});

app.post('/api/learning/notifications/read-all', requireAuth, async (req, res) => {
  await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.session.userId]);
  res.json({ ok: true });
});

app.get('/api/learning/bookmarks', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT id, lesson_id, note, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC', [req.session.userId]);
  res.json({ bookmarks: rows });
});

app.post('/api/learning/bookmarks', requireAuth, async (req, res) => {
  const lessonId = clean(req.body.lessonId);
  if (!lessonId) return res.status(400).json({ error: 'Lesson is required.' });

  await db.query(
    `INSERT INTO bookmarks (user_id, lesson_id, note)
     VALUES (?, ?, ?)
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET note = EXCLUDED.note`,
    [req.session.userId, lessonId, clean(req.body.note) || null]
  );
  res.json({ ok: true });
});

app.delete('/api/learning/bookmarks/:lessonId', requireAuth, async (req, res) => {
  await db.query('DELETE FROM bookmarks WHERE user_id = ? AND lesson_id = ?', [req.session.userId, clean(req.params.lessonId)]);
  res.json({ ok: true });
});

app.get('/api/learning/notes/:lessonId', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT note, updated_at FROM learning_notes WHERE user_id = ? AND lesson_id = ? LIMIT 1', [req.session.userId, clean(req.params.lessonId)]);
  res.json({ note: rows[0] || null });
});

app.put('/api/learning/notes/:lessonId', requireAuth, async (req, res) => {
  const note = clean(req.body.note);
  if (!note) return res.status(400).json({ error: 'Note cannot be empty.' });

  await db.query(
    `INSERT INTO learning_notes (user_id, lesson_id, note)
     VALUES (?, ?, ?)
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET note = EXCLUDED.note`,
    [req.session.userId, clean(req.params.lessonId), note]
  );
  res.json({ ok: true });
});

app.get('/api/learning/revision', requireAuth, async (req, res) => {
  const [weak] = await db.query(
    `SELECT lesson_id, MAX(score) AS best_score, COUNT(*) AS attempts
     FROM quiz_attempts WHERE user_id = ? GROUP BY lesson_id HAVING MAX(score) < 80 ORDER BY best_score ASC LIMIT 20`,
    [req.session.userId]
  );
  const [recent] = await db.query(
    `SELECT lesson_id, MAX(score) AS best_score
     FROM quiz_attempts WHERE user_id = ? GROUP BY lesson_id ORDER BY MAX(submitted_at) DESC LIMIT 20`,
    [req.session.userId]
  );
  res.json({ weakTopics: weak, recentTopics: recent });
});

app.get('/api/learning/stats', requireAuth, async (req, res) => {
  const [[study]] = await db.query(
    `SELECT COALESCE(SUM(seconds_spent), 0) AS study_seconds, COUNT(DISTINCT lesson_id) AS lessons_touched
     FROM learning_activity WHERE user_id = ?`,
    [req.session.userId]
  );
  const [[bookmarks]] = await db.query('SELECT COUNT(*) AS count FROM bookmarks WHERE user_id = ?', [req.session.userId]);
  const [[notes]] = await db.query('SELECT COUNT(*) AS count FROM learning_notes WHERE user_id = ?', [req.session.userId]);

  res.json({
    stats: {
      ...study,
      bookmarks: Number(bookmarks.count || 0),
      notes: Number(notes.count || 0),
    },
  });
});

app.post('/api/learning/activity', requireAuth, async (req, res) => {
  const seconds = Math.min(3600, Math.max(0, Number(req.body.seconds) || 0));
  const lessonId = clean(req.body.lessonId) || null;
  const type = clean(req.body.activityType) || 'lesson';

  if (seconds) {
    await db.query('INSERT INTO learning_activity (user_id, lesson_id, activity_type, seconds_spent) VALUES (?, ?, ?, ?)', [req.session.userId, lessonId, type, seconds]);
  }

  res.json({ ok: true });
});

app.get('/api/progress', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT lesson_id, status, best_score, attempts, xp, coins, updated_at FROM progress WHERE user_id = ?', [req.session.userId]);
  const [stats] = await db.query('SELECT xp, coins, streak_days, rank_name FROM user_stats WHERE user_id = ? LIMIT 1', [req.session.userId]);
  res.json({ progress: rows, stats: stats[0] || { xp: 0, coins: 0, rank_name: 'Rookie' } });
});

app.post('/api/progress/lesson', requireAuth, async (req, res) => {
  const { lessonId, status = 'started', score = 0, xp = 0, coins = 0 } = req.body;
  if (!lessonId) return res.status(400).json({ error: 'lessonId required' });

  const passed = status === 'passed';
  const [existing] = await db.query('SELECT status, best_score, attempts, xp, coins FROM progress WHERE user_id = ? AND lesson_id = ? LIMIT 1', [req.session.userId, lessonId]);

  if (existing.length) {
    const row = existing[0];
    const nextStatus = row.status === 'passed' || passed ? 'passed' : 'started';
    const nextBest = Math.max(Number(row.best_score || 0), Number(score));
    const nextAttempts = Number(row.attempts || 0) + 1;
    const nextXp = Number(row.xp || 0) + Number(xp);
    const nextCoins = Number(row.coins || 0) + Number(coins);

    await db.query('UPDATE progress SET status = ?, best_score = ?, attempts = ?, xp = ?, coins = ?, updated_at = NOW() WHERE user_id = ? AND lesson_id = ?', [nextStatus, nextBest, nextAttempts, nextXp, nextCoins, req.session.userId, lessonId]);
  } else {
    await db.query('INSERT INTO progress (user_id, lesson_id, status, best_score, attempts, xp, coins) VALUES (?, ?, ?, ?, 1, ?, ?)', [req.session.userId, lessonId, status, Number(score), Number(xp), Number(coins)]);
  }

  if (passed) {
    await db.query('UPDATE user_stats SET xp = xp + ?, coins = coins + ? WHERE user_id = ?', [Number(xp), Number(coins), req.session.userId]);
  }

  res.json({ ok: true });
});

app.post('/api/quiz/submit', requireAuth, async (req, res) => {
  const { lessonId, score, answers } = req.body;
  if (!lessonId || typeof score !== 'number') return res.status(400).json({ error: 'Invalid quiz submission.' });

  const passed = score >= 80;
  const [old] = await db.query('SELECT status FROM progress WHERE user_id = ? AND lesson_id = ? LIMIT 1', [req.session.userId, lessonId]);
  const alreadyPassed = old[0]?.status === 'passed';

  await db.query('INSERT INTO quiz_attempts (user_id, lesson_id, score, passed, answers_json) VALUES (?, ?, ?, ?, ?)', [req.session.userId, lessonId, score, passed, JSON.stringify(answers || {})]);

  const [existing] = await db.query('SELECT status, best_score, attempts, xp, coins FROM progress WHERE user_id = ? AND lesson_id = ? LIMIT 1', [req.session.userId, lessonId]);
  if (existing.length) {
    const row = existing[0];
    const nextStatus = row.status === 'passed' || passed ? 'passed' : 'started';
    const nextBest = Math.max(Number(row.best_score || 0), Number(score));
    const nextAttempts = Number(row.attempts || 0) + 1;
    const nextXp = Number(row.xp || 0) + (alreadyPassed ? 0 : passed ? 100 : 0);
    const nextCoins = Number(row.coins || 0) + (alreadyPassed ? 0 : passed ? 20 : 0);

    await db.query('UPDATE progress SET status = ?, best_score = ?, attempts = ?, xp = ?, coins = ?, updated_at = NOW() WHERE user_id = ? AND lesson_id = ?', [nextStatus, nextBest, nextAttempts, nextXp, nextCoins, req.session.userId, lessonId]);
  } else {
    await db.query('INSERT INTO progress (user_id, lesson_id, status, best_score, attempts, xp, coins) VALUES (?, ?, ?, ?, 1, ?, ?)', [req.session.userId, lessonId, passed ? 'passed' : 'started', score, alreadyPassed ? 0 : passed ? 100 : 0, alreadyPassed ? 0 : passed ? 20 : 0]);
  }

  if (passed && !alreadyPassed) {
    await db.query('UPDATE user_stats SET xp = xp + 100, coins = coins + 20 WHERE user_id = ?', [req.session.userId]);
    await awardAchievement(req.session.userId, 'first-lesson');
    const [countRows] = await db.query("SELECT COUNT(*) AS total FROM progress WHERE user_id = ? AND status = 'passed'", [req.session.userId]);
    if (Number(countRows[0].total) >= 5) await awardAchievement(req.session.userId, 'five-lessons');
    if (Number(countRows[0].total) >= 10) await awardAchievement(req.session.userId, 'ten-lessons');
    if (Number(score) === 100) await awardAchievement(req.session.userId, 'perfect-score');
    if (Number(countRows[0].total) >= 12) await awardAchievement(req.session.userId, 'beginner-complete');
    await touchActivity(req.session.userId);
  }

  const rank = await refreshRank(req.session.userId);
  if (rank.name === 'Grand Master' || rank.name === 'Legend') {
    await awardAchievement(req.session.userId, 'grand-master');
  }

  res.json({
    passed,
    score,
    rewarded: passed && !alreadyPassed,
    xp: passed && !alreadyPassed ? 100 : 0,
    coins: passed && !alreadyPassed ? 20 : 0,
    rank: rank.name,
    programmingUnlocked: !!rank.programmingUnlock,
  });
});

app.get('/api/student/overview', requireAuth, async (req, res) => {
  const uid = req.session.userId;
  await touchActivity(uid);
  const rank = await refreshRank(uid);

  const [progressRows] = await db.query('SELECT lesson_id, status, best_score, attempts, updated_at FROM progress WHERE user_id = ?', [uid]);
  const [statsRows] = await db.query('SELECT xp, coins, streak_days, rank_name FROM user_stats WHERE user_id = ? LIMIT 1', [uid]);
  const [achievementRows] = await db.query(
    `SELECT a.code, a.name, a.description, a.icon, ua.earned_at
     FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = ? ORDER BY ua.earned_at DESC`,
    [uid]
  );
  const [certRows] = await db.query('SELECT certificate_code, certificate_type, issued_at FROM certificates WHERE user_id = ? ORDER BY issued_at DESC', [uid]);
  const passedLessonIds = progressRows.filter((entry) => entry.status === 'passed').map((entry) => entry.lesson_id);

  res.json({
    stats: statsRows[0] || { xp: 0, coins: 0, streak_days: 0, rank_name: rank.name },
    progress: progressRows,
    achievements: achievementRows,
    certificates: certRows,
    programmingUnlocked: !!rank.programmingUnlock,
    passedLessonIds,
  });
});

app.get('/api/student/achievements', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.code, a.name, a.description, a.icon, a.xp_reward, a.coins_reward, ua.earned_at
     FROM achievements a
     LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
     ORDER BY ua.earned_at IS NULL, a.id`,
    [req.session.userId]
  );
  res.json({ achievements: rows });
});

app.get('/api/student/leaderboard', requireAuth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.full_name, u.username, u.profile_picture, s.xp, s.rank_name
     FROM user_stats s
     JOIN users u ON u.id = s.user_id
     WHERE u.account_type = 'student'
     ORDER BY s.xp DESC, u.full_name ASC LIMIT 50`
  );
  res.json({ leaderboard: rows });
});

app.post('/api/student/certificate', requireAuth, async (req, res) => {
  const uid = req.session.userId;
  const [userRows] = await db.query('SELECT full_name FROM users WHERE id = ? LIMIT 1', [uid]);
  const [beginnerRows] = await db.query("SELECT COUNT(*) AS total FROM progress WHERE user_id = ? AND lesson_id LIKE 'bf-%' AND status = 'passed'", [uid]);

  if (Number(beginnerRows[0].total) < 12) {
    return res.status(400).json({ error: 'Complete the Beginner curriculum before requesting this certificate.' });
  }

  const [existing] = await db.query("SELECT certificate_code, certificate_type, issued_at FROM certificates WHERE user_id = ? AND certificate_type = 'Beginner Computer Skills' LIMIT 1", [uid]);
  if (existing.length) return res.json({ certificate: existing[0], name: userRows[0]?.full_name });

  const code = `EJC-BEG-${uid}-${Date.now().toString(36).toUpperCase()}`;
  await db.query('INSERT INTO certificates (user_id, certificate_code, certificate_type) VALUES (?, ?, ?)', [uid, code, 'Beginner Computer Skills']);
  res.status(201).json({ certificate: { certificate_code: code, certificate_type: 'Beginner Computer Skills' }, name: userRows[0]?.full_name });
});

app.get('/api/teacher/classes', requireRole('teacher'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.id, c.name, c.class_code, c.created_at, COUNT(cm.user_id) AS student_count
     FROM classes c LEFT JOIN class_members cm ON cm.class_id = c.id
     WHERE c.teacher_id = ?
     GROUP BY c.id ORDER BY c.created_at DESC`,
    [req.session.userId]
  );
  res.json({ classes: rows });
});

app.post('/api/teacher/classes', requireRole('teacher'), async (req, res) => {
  const name = clean(req.body.name);
  if (!name) return res.status(400).json({ error: 'Class name is required.' });

  let code = '';
  for (let i = 0; i < 10; i += 1) {
    code = 'EJC-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    const [existing] = await db.query('SELECT id FROM classes WHERE class_code = ? LIMIT 1', [code]);
    if (!existing.length) break;
  }

  const [result] = await db.query('INSERT INTO classes (teacher_id, name, class_code) VALUES (?, ?, ?) RETURNING id', [req.session.userId, name, code]);
  res.status(201).json({ class: { id: result[0]?.id, name, class_code: code, student_count: 0 } });
});

app.get('/api/teacher/classes/:id', requireRole('teacher'), async (req, res) => {
  const classId = Number(req.params.id);
  const [classRows] = await db.query('SELECT id, name, class_code FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1', [classId, req.session.userId]);
  if (!classRows.length) return res.status(404).json({ error: 'Class not found.' });

  const [students] = await db.query(
    `SELECT u.id, u.full_name, u.username, u.email, s.xp, s.rank_name,
            COUNT(CASE WHEN p.status = 'passed' THEN 1 END) AS passed_lessons,
            COALESCE(AVG(NULLIF(p.best_score, 0)), 0) AS average_score
     FROM class_members cm
     JOIN users u ON u.id = cm.user_id
     LEFT JOIN user_stats s ON s.user_id = u.id
     LEFT JOIN progress p ON p.user_id = u.id
     WHERE cm.class_id = ?
     GROUP BY u.id
     ORDER BY u.full_name`,
    [classId]
  );

  res.json({ class: classRows[0], students });
});

app.post('/api/teacher/classes/:id/students', requireRole('teacher'), async (req, res) => {
  const classId = Number(req.params.id);
  const username = clean(req.body.username);

  const [classRows] = await db.query('SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1', [classId, req.session.userId]);
  if (!classRows.length) return res.status(404).json({ error: 'Class not found.' });

  const [userRows] = await db.query("SELECT id, full_name, username FROM users WHERE username = ? AND account_type = 'student' LIMIT 1", [username]);
  if (!userRows.length) return res.status(404).json({ error: 'Student not found.' });

  await db.query('INSERT INTO class_members (class_id, user_id) VALUES (?, ?) ON CONFLICT (class_id, user_id) DO NOTHING', [classId, userRows[0].id]);
  res.json({ ok: true, student: userRows[0] });
});

app.get('/api/teacher/assignments', requireRole('teacher'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.id, a.title, a.lesson_id, a.due_date, c.name AS class_name, c.class_code
     FROM assignments a JOIN classes c ON c.id = a.class_id
     WHERE c.teacher_id = ? ORDER BY a.created_at DESC`,
    [req.session.userId]
  );
  res.json({ assignments: rows });
});

app.post('/api/teacher/assignments', requireRole('teacher'), async (req, res) => {
  const { classId, title, lessonId, dueDate } = req.body;
  if (!classId || !clean(title) || !clean(lessonId)) return res.status(400).json({ error: 'Class, title and lesson are required.' });

  const [classRows] = await db.query('SELECT id FROM classes WHERE id = ? AND teacher_id = ? LIMIT 1', [Number(classId), req.session.userId]);
  if (!classRows.length) return res.status(403).json({ error: 'Class not found.' });

  const [result] = await db.query('INSERT INTO assignments (class_id, title, lesson_id, due_date) VALUES (?, ?, ?, ?) RETURNING id', [Number(classId), clean(title), clean(lessonId), dueDate || null]);
  res.status(201).json({ assignment: { id: result[0]?.id } });
});

app.get('/api/teacher/reports', requireRole('teacher'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.id, c.name, COUNT(DISTINCT cm.user_id) AS students,
            COALESCE(ROUND(AVG(NULLIF(p.best_score, 0)), 1), 0) AS average_score,
            COUNT(CASE WHEN p.status = 'passed' THEN 1 END) AS passed_attempts
     FROM classes c
     LEFT JOIN class_members cm ON cm.class_id = c.id
     LEFT JOIN progress p ON p.user_id = cm.user_id
     WHERE c.teacher_id = ?
     GROUP BY c.id ORDER BY c.name`,
    [req.session.userId]
  );
  res.json({ reports: rows });
});

app.get('/api/admin/overview', requireRole('admin'), async (req, res) => {
  const [[users]] = await db.query("SELECT COUNT(*) AS total, SUM(CASE WHEN account_type = 'student' THEN 1 ELSE 0 END) AS students, SUM(CASE WHEN account_type = 'teacher' THEN 1 ELSE 0 END) AS teachers, SUM(CASE WHEN account_type = 'admin' THEN 1 ELSE 0 END) AS admins FROM users");
  const [[classes]] = await db.query('SELECT COUNT(*) AS total FROM classes');
  const [[attempts]] = await db.query('SELECT COUNT(*) AS total FROM quiz_attempts');
  const [[certs]] = await db.query('SELECT COUNT(*) AS total FROM certificates');
  res.json({ users, classes, attempts, certificates: certs });
});

app.get('/api/admin/users', requireRole('admin'), async (req, res) => {
  const [rows] = await db.query('SELECT id, account_type, full_name, email, username, country, created_at FROM users ORDER BY created_at DESC LIMIT 500');
  res.json({ users: rows });
});

app.get('/api/admin/activity', requireRole('admin'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT qa.id, u.full_name, u.username, qa.lesson_id, qa.score, qa.passed, qa.submitted_at
     FROM quiz_attempts qa JOIN users u ON u.id = qa.user_id ORDER BY qa.submitted_at DESC LIMIT 100`
  );
  res.json({ activity: rows });
});

app.get('/api/programming/access', requireAuth, async (req, res) => {
  const [[stats]] = await db.query('SELECT rank_name FROM user_stats WHERE user_id = ? LIMIT 1', [req.session.userId]);
  const rank = stats?.rank_name || 'Rookie';
  const eligibleRank = rankIndex(rank) >= rankIndex('Grand Master');

  const [[approved]] = await db.query("SELECT id FROM programming_payments WHERE user_id = ? AND status = 'approved' ORDER BY reviewed_at DESC LIMIT 1", [req.session.userId]);
  const [accessRows] = await db.query('SELECT user_id FROM programming_access WHERE user_id = ? LIMIT 1', [req.session.userId]);

  if (eligibleRank && approved && !accessRows.length) {
    await db.query('INSERT INTO programming_access (user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING', [req.session.userId]);
  }

  const unlocked = eligibleRank && !!approved;
  let reason = '';
  if (!eligibleRank) reason = 'Reach Grand Master rank or higher to meet the rank requirement.';
  else if (!approved) reason = 'Your rank requirement is met, but payment has not yet been approved.';

  res.json({
    unlocked,
    eligible: unlocked,
    rank,
    rankRequirementMet: eligibleRank,
    paymentApproved: !!approved,
    canSubmit: !approved,
    paymentInstructions: PAYMENT_INSTRUCTIONS,
    reason,
  });
});

app.post('/api/programming/payment', requireAuth, async (req, res) => {
  const method = clean(req.body.method);
  const reference = clean(req.body.reference);
  const amount = req.body.amount === '' || req.body.amount == null ? null : Number(req.body.amount);
  const note = clean(req.body.note) || null;

  if (!method || !reference) return res.status(400).json({ error: 'Payment method and payment reference are required.' });
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) return res.status(400).json({ error: 'Enter a valid amount.' });

  const [existing] = await db.query('SELECT id, status FROM programming_payments WHERE payment_reference = ? LIMIT 1', [reference]);
  if (existing.length) return res.status(409).json({ error: 'That payment reference has already been submitted.' });

  const [result] = await db.query('INSERT INTO programming_payments (user_id, payment_reference, payment_method, amount, note) VALUES (?, ?, ?, ?, ?) RETURNING id', [req.session.userId, reference, method, amount, note]);
  res.status(201).json({ ok: true, id: result[0]?.id, status: 'pending' });
});

app.get('/api/programming/payment-status', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT id, payment_reference, payment_method, amount, note, status, submitted_at, reviewed_at FROM programming_payments WHERE user_id = ? ORDER BY submitted_at DESC', [req.session.userId]);
  res.json({ payments: rows });
});

app.get('/api/admin/programming-payments', requireRole('admin'), async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.id, p.payment_reference, p.payment_method, p.amount, p.note, p.status, p.submitted_at, p.reviewed_at,
            u.full_name, u.username, u.email, s.rank_name
     FROM programming_payments p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN user_stats s ON s.user_id = u.id
     ORDER BY p.submitted_at DESC LIMIT 500`
  );
  res.json({ payments: rows });
});

app.post('/api/admin/programming-payments/:id/review', requireRole('admin'), async (req, res) => {
  const status = clean(req.body.status);
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected.' });

  const id = Number(req.params.id);
  const [result] = await db.query("UPDATE programming_payments SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ? AND status = 'pending'", [status, req.session.userId, id]);
  if (!result.affectedRows && !(typeof result.rowCount === 'number' && result.rowCount > 0)) {
    return res.status(404).json({ error: 'Pending payment not found.' });
  }

  if (status === 'approved') {
    const [[payment]] = await db.query('SELECT user_id FROM programming_payments WHERE id = ? LIMIT 1', [id]);
    const [[stats]] = await db.query('SELECT rank_name FROM user_stats WHERE user_id = ? LIMIT 1', [payment.user_id]);

    if (rankIndex(stats?.rank_name || 'Rookie') >= rankIndex('Grand Master')) {
      await db.query('INSERT INTO programming_access (user_id, unlocked_by) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET unlocked_by = EXCLUDED.unlocked_by', [payment.user_id, req.session.userId]);
    }
  }

  res.json({ ok: true, status });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Server error. Check the terminal for details.' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Emmy J Code running at http://${HOST}:${PORT}`);
});
