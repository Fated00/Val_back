// Настройка имени человека, для которого валентинка
// Просто поменяйте эту строку на нужное имя:
const PERSON_NAME = 'Ксюшенька';

// Базовый URL backend-а
// ЛОКАЛЬНО (когда вы запускаете node server.js): оставьте пустую строку => запросы пойдут на тот же origin
// ДЛЯ GITHUB PAGES: замените на URL вашего Render-сервиса, например:
// const API_BASE = 'https://valentine-backend.onrender.com';
const API_BASE = 'https://ksentyz-3.onrender.com';

const nameEl = document.getElementById('person-name');
const btnYes = document.getElementById('btn-yes');
const btnMaybe = document.getElementById('btn-maybe');
const btnNo = document.getElementById('btn-no');
const messageInput = document.getElementById('message'); // на главной уже нет, но оставим защитно
const wishMessageInput = document.getElementById('wish-message');
const btnWishSend = document.getElementById('btn-wish-send');
const toast = document.getElementById('toast');
const noOverlay = document.getElementById('no-overlay');
const noCancel = document.getElementById('no-cancel');
const noConfirm = document.getElementById('no-confirm');
const maybeCountdownValue = document.getElementById('maybe-countdown-value');
const maybeCountdownLabel = document.getElementById('maybe-countdown-label');
const maybeCountdownRing = document.getElementById('maybe-countdown-ring');
const maybeContinueBtn = document.getElementById('maybe-continue');
let runawayFrameId = null;
let runawayLastTs = 0;
let runawayAngle = Math.random() * Math.PI * 2;
let runawayDirection = Math.random() > 0.5 ? 1 : -1;
let runawayRadiusPhase = Math.random() * Math.PI * 2;

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

async function sendResponse(answer, customMessage = null) {
  const message =
    customMessage !== null ? String(customMessage).trim() : (messageInput?.value?.trim() || '');

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
    return true;
  } catch (e) {
    console.error(e);
    showToast('Кажется, что-то пошло не так. Но твой ответ я всё равно запомню в сердце 💗');
    return false;
  }
}

btnYes?.addEventListener('click', async () => {
  await sendResponse('yes');
  window.location.href = 'yes.html';
});

btnMaybe?.addEventListener('click', async () => {
  await sendResponse('maybe');
  window.location.href = 'maybe.html';
});

btnNo?.addEventListener('click', () => {
  if (!noOverlay) return;
  noOverlay.classList.remove('hidden');
  setTimeout(() => {
    noOverlay.classList.add('overlay--visible');
    startRunawayMotion();
  }, 10);
});

noCancel?.addEventListener('click', () => {
  if (!noOverlay) return;
  noOverlay.classList.remove('overlay--visible');
  setTimeout(() => {
    noOverlay.classList.add('hidden');
  }, 220);
  stopRunawayMotion();
  resetRunawayButtonPosition();
});

function stopRunawayMotion() {
  if (!runawayFrameId) return;
  cancelAnimationFrame(runawayFrameId);
  runawayFrameId = null;
  runawayLastTs = 0;
}

function resetRunawayButtonPosition() {
  if (!noConfirm) return;
  noConfirm.style.left = '50%';
  noConfirm.style.top = '50%';
  noConfirm.style.transform = 'translate(-50%, -50%)';
}

function startRunawayMotion() {
  if (!noConfirm) return;
  stopRunawayMotion();
  runawayAngle = Math.random() * Math.PI * 2;
  runawayDirection = Math.random() > 0.5 ? 1 : -1;
  runawayRadiusPhase = Math.random() * Math.PI * 2;
  moveRunawayButton();

  const animate = (ts) => {
    if (!noOverlay?.classList.contains('overlay--visible')) {
      stopRunawayMotion();
      return;
    }

    if (!runawayLastTs) {
      runawayLastTs = ts;
    }
    const deltaMs = Math.min(34, ts - runawayLastTs);
    runawayLastTs = ts;

    const orbitSpeed = 0.003; // x2.5 быстрее
    const radiusSpeed = 0.00055; // rad/ms: медленная пульсация радиуса
    runawayAngle += runawayDirection * orbitSpeed * deltaMs;
    runawayRadiusPhase += radiusSpeed * deltaMs;

    if (Math.random() < 0.00045 * deltaMs) {
      runawayDirection *= -1;
    }

    moveRunawayButton();
    runawayFrameId = requestAnimationFrame(animate);
  };

  runawayFrameId = requestAnimationFrame(animate);
}

function moveRunawayButton() {
  if (!noConfirm || !noOverlay) return;

  const padding = 20;
  const overlayRect = noOverlay.getBoundingClientRect();
  const viewportWidth = overlayRect.width;
  const viewportHeight = overlayRect.height;
  if (viewportWidth <= 0 || viewportHeight <= 0) return;

  const btnWidth = noConfirm.offsetWidth || 120;
  const btnHeight = noConfirm.offsetHeight || 40;

  const centerX = overlayRect.left + viewportWidth / 2;
  const centerY = overlayRect.top + viewportHeight / 2;
  const minSide = Math.min(viewportWidth, viewportHeight);
  const arenaScale = 1.33;
  const minRadius = Math.max(80, minSide * 0.14) * arenaScale;
  const maxRadius = Math.max(minRadius + 30, Math.min(280, minSide * 0.28) * arenaScale);
  const radiusBlend = (Math.sin(runawayRadiusPhase) + 1) / 2;
  const radius = minRadius + radiusBlend * (maxRadius - minRadius);

  let centerBtnX = centerX + radius * Math.cos(runawayAngle);
  let centerBtnY = centerY + radius * Math.sin(runawayAngle);

  const halfW = btnWidth / 2;
  const halfH = btnHeight / 2;
  const minCenterX = overlayRect.left + padding + halfW;
  const maxCenterX = overlayRect.right - padding - halfW;
  const minCenterY = overlayRect.top + padding + halfH;
  const maxCenterY = overlayRect.bottom - padding - halfH;

  centerBtnX = Math.min(Math.max(centerBtnX, minCenterX), maxCenterX);
  centerBtnY = Math.min(Math.max(centerBtnY, minCenterY), maxCenterY);

  noConfirm.style.left = `${centerBtnX}px`;
  noConfirm.style.top = `${centerBtnY}px`;
  noConfirm.style.transform = 'translate(-50%, -50%)';
}

// Если всё-таки смогла нажать — сохраняем "no" и переходим на страницу
noConfirm?.addEventListener('click', async (e) => {
  e.stopPropagation();
  stopRunawayMotion();
  await sendResponse('no');
  window.location.href = 'no.html';
});

window.addEventListener('resize', () => {
  if (noOverlay?.classList.contains('overlay--visible')) {
    moveRunawayButton();
  }
});

function initMaybeCountdown() {
  if (!maybeCountdownValue || !maybeCountdownLabel || !maybeCountdownRing) {
    return;
  }

  const totalMs = 10_000;
  const startAt = performance.now();
  maybeContinueBtn?.setAttribute('disabled', 'true');

  const updateLabel = (secondsLeft) => {
    if (secondsLeft >= 8) {
      maybeCountdownLabel.textContent = 'Хорошо, просто подышим 10 секунд.';
      return;
    }
    if (secondsLeft >= 5) {
      maybeCountdownLabel.textContent = 'Вдох... выдох... решение любит спокойствие.';
      return;
    }
    if (secondsLeft >= 2) {
      maybeCountdownLabel.textContent = 'Почти всё. Слушай сердце, не спеши.';
      return;
    }
    maybeCountdownLabel.textContent = 'Последние секунды тишины.';
  };

  const tick = (now) => {
    const elapsed = Math.min(totalMs, now - startAt);
    const leftMs = totalMs - elapsed;
    const leftSeconds = Math.max(0, Math.ceil(leftMs / 1000));
    const progress = elapsed / totalMs;

    maybeCountdownValue.textContent = String(leftSeconds);
    maybeCountdownRing.style.setProperty('--progress', String(progress));
    updateLabel(leftSeconds);

    if (elapsed < totalMs) {
      requestAnimationFrame(tick);
      return;
    }

    maybeCountdownValue.textContent = '0';
    maybeCountdownLabel.textContent = 'Спасибо. Теперь можно выбрать без спешки.';
    if (maybeContinueBtn) {
      maybeContinueBtn.removeAttribute('disabled');
      maybeContinueBtn.classList.add('btn--ready');
    }
  };

  requestAnimationFrame(tick);
}

maybeContinueBtn?.addEventListener('click', () => {
  if (maybeContinueBtn.hasAttribute('disabled')) {
    return;
  }
  window.location.href = 'index.html';
});

btnWishSend?.addEventListener('click', async () => {
  const wish = wishMessageInput?.value?.trim() || '';
  if (!wish) {
    showToast('Напиши пожелание перед отправкой 💌');
    return;
  }

  btnWishSend.setAttribute('disabled', 'true');
  const sent = await sendResponse('yes', wish);
  btnWishSend.removeAttribute('disabled');

  if (!sent) {
    return;
  }

  showToast('Пожелание отправлено 💌');
  if (wishMessageInput) {
    wishMessageInput.value = '';
  }
});

initMaybeCountdown();

// Немного магии: лёгкое «дрожащее» движение кнопки "Да"
setInterval(() => {
  if (!btnYes) return;
  btnYes.style.transform = 'translateY(-1px) scale(1.02)';
  setTimeout(() => {
    btnYes.style.transform = '';
  }, 160);
}, 4500);
