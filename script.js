// Firebase config и инициализация
const firebaseConfig = {
  apiKey: "AIzSyBpCysz2c3SnWOUTLpf2JburDdgujMaktc",
  authDomain: "courseworktsj.firebaseapp.com",
  projectId: "courseworktsj",
  storageBucket: "courseworktsj.firebasestorage.app",
  messagingSenderId: "578999928624",
  appId: "1:578999928624:web:dcffcb1c5d49bbd11faaf5"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.Telegram.WebApp.ready();

const form = document.getElementById('requestForm');
const submitBtn = document.getElementById('submitBtn');
const requestsList = document.getElementById('requestsList');
const notification = document.getElementById('notification');
const typeTranslations = {
  repair: 'Ремонт',
  complaint: 'Жалоба',
  advice: 'Предложение',
  other: 'Другое'
};
const statusTranslations = {
  new: 'Новая',
  in_progress: 'В работе',
  closed: 'Закрыта'
};

// --- Новые элементы для авторизации и переключения меню ---
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const userApp = document.getElementById('user-app');
const adminApp = document.getElementById('admin-app');
const allRequestsList = document.getElementById('allRequestsList');

// Для пользователя:
let currentUserId = null;
let unsubscribeUser = null;
let unsubscribeAdmin = null;

// =============== АВТОРИЗАЦИЯ ===============
authForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const login = document.getElementById('login').value.trim();
  const password = document.getElementById('password').value.trim();

  authError.textContent = '';

  if (login === '1' && password === '1') {
    // Обычный пользователь
    authContainer.classList.add('hidden');
    userApp.classList.remove('hidden');
    adminApp.classList.add('hidden');
    currentUserId = window.Telegram.WebApp.initDataUnsafe.user?.id || 'unknown';
    initUserApp();
  } else if (login === 'admin' && password === 'admin') {
    // Диспетчер
    authContainer.classList.add('hidden');
    userApp.classList.add('hidden');
    adminApp.classList.remove('hidden');
    initAdminApp();
  } else {
    authError.textContent = 'Неверный логин или пароль';
  }
});

// ================= ПОЛЬЗОВАТЕЛЬ ==================
function initUserApp() {
  // Логика вкладок (как раньше)
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-tab');
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(tab).classList.add('active');
      if (tab === 'listTab') {
        listenRequests();
      }
    });
  });

  // Отправка новой заявки
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = form.type.value;
    const description = form.description.value.trim();
    if (!description) {
      alert('Пожалуйста, введите описание.');
      form.description.focus();
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    try {
      await db.collection('requests').add({
        type,
        description,
        userId: currentUserId,
        status: 'new',
        comments: [],
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      form.reset();
      showNotification('Заявка успешно отправлена!');
      document.querySelector('[data-tab="listTab"]').click();
      listenRequests();
    } catch (error) {
      alert('Ошибка при отправке заявки: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить';
    }
  });

  // Подписка на заявки пользователя
  listenRequests();
}

// Подписка на заявки пользователя в реальном времени
function listenRequests() {
  if (unsubscribeUser) unsubscribeUser();
  unsubscribeUser = db.collection('requests')
    .where('userId', '==', currentUserId)
    .orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        requestsList.innerHTML = '<p>Заявок нет.</p>';
        return;
      }
      renderRequests(snapshot.docs, requestsList);
    });
}

// Рендер заявок (для пользователя)
function renderRequests(docs, container) {
  container.innerHTML = '';
  docs.forEach(doc => {
    const data = doc.data();
    const requestElement = document.createElement('div');
    requestElement.classList.add('request-item');
    requestElement.innerHTML = `
      <p><strong>Тип заявки:</strong> ${typeTranslations[data.type]}</p>
      <p><strong>Описание:</strong> ${data.description}</p>
      <p><strong>Статус:</strong> <span class="status">${statusTranslations[data.status] || data.status}</span></p>
      <div class="comments">
        ${data.comments.map(comment => `<p class="comment">${comment}</p>`).join('')}
      </div>
    `;
    container.appendChild(requestElement);
  });
}

function showNotification(message) {
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 4000);
}

// ============== ДИСПЕТЧЕР (ADMIN) ==================
function initAdminApp() {
  // Слушаем все заявки
  if (unsubscribeAdmin) unsubscribeAdmin();
  unsubscribeAdmin = db.collection('requests')
    .orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      if (snapshot.empty) {
        allRequestsList.innerHTML = '<p>Заявок нет.</p>';
        return;
      }
      renderAdminRequests(snapshot.docs);
    });
}

// Рендер всех заявок для диспетчера
function renderAdminRequests(docs) {
  allRequestsList.innerHTML = '';
  docs.forEach(doc => {
    const data = doc.data();
    const requestElement = document.createElement('div');
    requestElement.classList.add('request-item');
    requestElement.innerHTML = `
      <p><strong>Тип заявки:</strong> ${typeTranslations[data.type]}</p>
      <p><strong>Описание:</strong> ${data.description}</p>
      <label for="status-select-${doc.id}"><strong>Статус:</strong></label>
      <select class="status-select" data-id="${doc.id}" id="status-select-${doc.id}">
        <option value="new" ${data.status === 'new' ? 'selected' : ''}>Новая</option>
        <option value="in_progress" ${data.status === 'in_progress' ? 'selected' : ''}>В работе</option>
        <option value="closed" ${data.status === 'closed' ? 'selected' : ''}>Закрыта</option>
      </select>
      <div class="comments">
        ${data.comments.map(comment => `<p class="comment">${comment}</p>`).join('')}
      </div>
    `;
    allRequestsList.appendChild(requestElement);
  });

  // Добавляем обработчики на все селекты смены статуса
  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', async function() {
      const docId = this.getAttribute('data-id');
      const newStatus = this.value;
      try {
        await db.collection('requests').doc(docId).update({ status: newStatus });
      } catch (error) {
        alert('Ошибка при смене статуса: ' + error.message);
      }
    });
  });
}

// ЛОГАУТ для пользователя
document.getElementById('logout-user').addEventListener('click', () => {
  userApp.classList.add('hidden');
  adminApp.classList.add('hidden');
  authContainer.classList.remove('hidden');
  authForm.reset();
  authError.textContent = '';
  if (unsubscribeUser) unsubscribeUser();
});

// ЛОГАУТ для диспетчера
document.getElementById('logout-admin').addEventListener('click', () => {
  userApp.classList.add('hidden');
  adminApp.classList.add('hidden');
  authContainer.classList.remove('hidden');
  authForm.reset();
  authError.textContent = '';
  if (unsubscribeAdmin) unsubscribeAdmin();
});

// Функционал кнопки справка
document.getElementById('helpButton').onclick = function() {
  window.open('https://disk.yandex.ru/d/-hNkZ9EVyGhm-Q', '_blank');
};