const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

let lastResponse = null;

// Пул подключений к Postgres
// Локально: DATABASE_URL можно не задавать, тогда используется localhost
// На Render или другом хостинге: ОБЯЗАТЕЛЬНО задать DATABASE_URL
const parseBoolEnv = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return null;
};

const pgSslOverride = parseBoolEnv(process.env.PGSSL);
const shouldUsePgSsl = pgSslOverride ?? Boolean(process.env.DATABASE_URL);
const localPgHost = process.env.PGHOST || 'localhost';
const localPgPort = Number(process.env.PGPORT || 5432);
const localPgUser = process.env.PGUSER || 'postgres';
const localPgPassword = process.env.PGPASSWORD ?? (localPgHost === 'db' ? 'postgres' : '');
const localPgDatabase = process.env.PGDATABASE || 'valentine';

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: shouldUsePgSsl ? { rejectUnauthorized: false } : false,
      }
    : {
        host: localPgHost,
        port: localPgPort,
        user: localPgUser,
        password: localPgPassword,
        database: localPgDatabase,
      },
);

const CREATE_RESPONSES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS responses (
    id BIGSERIAL PRIMARY KEY,
    answer TEXT NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

let dbReady = false;
let dbInitPromise = null;
let dbInitError = null;

async function initializeDatabase() {
  if (dbReady) return true;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      await pool.query('SELECT 1');
      await pool.query(CREATE_RESPONSES_TABLE_SQL);
      dbReady = true;
      dbInitError = null;
      console.log('✅ Postgres connected and schema is ready');
      return true;
    } catch (error) {
      dbReady = false;
      dbInitError = error;
      console.error('❌ Failed to initialize Postgres:', error.message || error);
      return false;
    } finally {
      dbInitPromise = null;
    }
  })();

  return dbInitPromise;
}

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
);

// Разрешаем запросы с GitHub Pages и локалки (и из ALLOWED_ORIGINS)
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / server-to-server

      const isLocal =
        origin === 'http://localhost:3000' ||
        origin === 'http://127.0.0.1:5500';
      const isGithubPages = /^https?:\/\/[^/]+\.github\.io$/.test(origin);
      const isExplicitlyAllowed = allowedOrigins.has(origin);

      if (isLocal || isGithubPages || isExplicitlyAllowed) {
        return cb(null, true);
      }

      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
  }),
);

app.use(bodyParser.json());

// (Опционально) если хотите, чтобы Render тоже отдавал статику
app.use(express.static(path.join(__dirname, 'public')));

// API для сохранения ответа
app.post('/api/response', async (req, res) => {
  const { answer, message } = req.body || {};

  if (!answer) {
    return res.status(400).json({ error: 'answer is required' });
  }

  const isDbReady = await initializeDatabase();
  if (!isDbReady) {
    return res.status(503).json({ error: 'db_unavailable' });
  }

  try {
    // Сохраняем в БД
    const insertResult = await pool.query(
      'INSERT INTO responses(answer, message, created_at) VALUES ($1, $2, NOW()) RETURNING created_at',
      [answer, message || ''],
    );
    const insertedAt = insertResult.rows[0]?.created_at;
    const at = insertedAt instanceof Date
      ? insertedAt.toISOString()
      : new Date(insertedAt || Date.now()).toISOString();

    lastResponse = { answer, message: message || '', at };

    console.log('💌 Новый ответ на валентинку (в БД):', lastResponse);

    res.json({ status: 'ok' });
  } catch (e) {
    console.error('Ошибка при сохранении в Postgres:', e);
    res.status(500).json({ error: 'db_error' });
  }
});

// API, чтобы посмотреть последний ответ (опционально)
app.get('/api/last-response', (req, res) => {
  if (!lastResponse) {
    return res.json({ hasResponse: false });
  }
  res.json({ hasResponse: true, ...lastResponse });
});

app.get('/api/health', async (req, res) => {
  if (dbReady) {
    return res.json({ status: 'ok', db: 'ready' });
  }

  await initializeDatabase();

  if (dbReady) {
    return res.json({ status: 'ok', db: 'ready' });
  }

  return res.status(503).json({
    status: 'degraded',
    db: 'unavailable',
    reason: dbInitError?.message || 'db_not_ready',
  });
});

if (require.main === module) {
  initializeDatabase().finally(() => {
    app.listen(PORT, () => {
      console.log(`💘 Valentine server is running on http://localhost:${PORT}`);
    });
  });
}

module.exports = { app, pool };
