const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Простое хранилище последнего ответа (пока в памяти)
let lastResponse = null;

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
app.post('/api/response', (req, res) => {
  const { answer, message } = req.body || {};

  if (!answer) {
    return res.status(400).json({ error: 'answer is required' });
  }

  lastResponse = {
    answer,
    message: message || '',
    at: new Date().toISOString(),
  };

  // Можно посмотреть ответ прямо в консоли сервера
  // Например, при нажатии "Да!" здесь появится запись
  console.log('💌 Новый ответ на валентинку:', lastResponse);

  res.json({ status: 'ok' });
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

