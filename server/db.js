const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'emmy_j_code',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function normalizeQueryResult(result) {
  const rows = Array.isArray(result.rows) ? result.rows : [];
  const normalized = rows.slice();
  normalized.rows = rows;
  normalized.fields = result.fields || [];
  normalized.rowCount = Number(result.rowCount ?? rows.length);
  normalized.affectedRows = Number(result.rowCount ?? rows.length);
  normalized.insertId = null;

  if (result.command === 'INSERT' && typeof result.rows !== 'undefined' && result.rows.length) {
    normalized.insertId = Number(result.rows[0]?.id ?? null);
  }

  if (result.command === 'INSERT' && normalized.insertId === null && typeof result.insertId !== 'undefined') {
    normalized.insertId = Number(result.insertId);
  }

  return normalized;
}

function replaceQuestionMarks(sql) {
  let idx = 1;
  return sql.replace(/\?/g, () => `$${idx++}`);
}

function wrapQuery(client) {
  return async function query(sql, params = []) {
    const normalized = replaceQuestionMarks(sql);
    const result = await client.query(normalized, params);
    return [normalizeQueryResult(result), result.fields || []];
  };
}

const db = {
  async query(sql, params = []) {
    const normalized = replaceQuestionMarks(sql);
    const result = await pool.query(normalized, params);
    return [normalizeQueryResult(result), result.fields || []];
  },
  async getConnection() {
    const client = await pool.connect();
    const wrapped = {
      query: wrapQuery(client),
      beginTransaction: async () => client.query('BEGIN'),
      commit: async () => client.query('COMMIT'),
      rollback: async () => client.query('ROLLBACK'),
      release: () => client.release(),
    };
    return wrapped;
  },
  async end() {
    await pool.end();
  },
};

module.exports = db;

