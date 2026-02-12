const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Пул подключений к Postgres
// Локально: DATABASE_URL можно не задавать, тогда используется localhost
// На Render или другом хостинге: ОБЯЗАТЕЛЬНО задать DATABASE_URL
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'valentine',
      },
);

// Разрешаем запросы с GitHub Pages и локалки
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:5500', // пример локального статического сервера
      // сюда позже добавите точный URL GitHub Pages, например:
      // 'https://your-name.github.io',
    ],
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

  const at = new Date().toISOString();

  try {
    // Сохраняем в БД
    await pool.query(
      'INSERT INTO responses(answer, message, created_at) VALUES ($1, $2, $3)',
      [answer, message || '', at],
    );

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

app.listen(PORT, () => {
  console.log(`💘 Valentine server is running on http://localhost:${PORT}`);
});

