// Настройка имени человека, для которого валентинка
// Просто поменяйте эту строку на нужное имя:
const PERSON_NAME = 'Твоё имя здесь';

// Базовый URL backend-а
// ЛОКАЛЬНО (когда вы запускаете node server.js): оставьте пустую строку => запросы пойдут на тот же origin
// ДЛЯ GITHUB PAGES: замените на URL вашего Render-сервиса, например:
// const API_BASE = 'https://valentine-backend.onrender.com';
const API_BASE = '';

const nameEl = document.getElementById('person-name');
const btnYes = document.getElementById('btn-yes');
const btnMaybe = document.getElementById('btn-maybe');
const messageInput = document.getElementById('message');
const toast = document.getElementById('toast');
const overlay = document.getElementById('overlay');
const overlayClose = document.getElementById('overlay-close');

if (nameEl) {
  nameEl.textContent = PERSON_NAME;
}

function showToast(text) {
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('toast--visible');
  setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, 2600);
}

async function sendResponse(answer) {
  const message = messageInput?.value?.trim() || '';

  try {
    const url = `${API_BASE || ''}/api/response`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer, message }),
    });

    if (!res.ok) {
      throw new Error('Request failed');
    }
  } catch (e) {
    console.error(e);
    showToast('Кажется, что-то пошло не так. Но твой ответ я всё равно запомню в сердце 💗');
  }
}

btnYes?.addEventListener('click', async () => {
  await sendResponse('yes');
  overlay.classList.remove('hidden');
  setTimeout(() => {
    overlay.classList.add('overlay--visible');
  }, 10);
});

btnMaybe?.addEventListener('click', async () => {
  await sendResponse('maybe');
  showToast('Спасибо за честность. Я всё равно очень жду нашу встречу 💕');
});

overlayClose?.addEventListener('click', () => {
  overlay.classList.remove('overlay--visible');
  setTimeout(() => {
    overlay.classList.add('hidden');
  }, 220);
});

// Немного магии: лёгкое «дрожащее» движение кнопки "Да"
setInterval(() => {
  if (!btnYes) return;
  btnYes.style.transform = 'translateY(-1px) scale(1.02)';
  setTimeout(() => {
    btnYes.style.transform = '';
  }, 160);
}, 4500);

