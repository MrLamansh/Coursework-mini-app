 // Firebase config и инициализация
  const firebaseConfig =
  {
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

  const userId = window.Telegram.WebApp.initDataUnsafe.user?.id || 'unknown';

  const typeTranslations =
  {
    repair: 'Ремонт',
    complaint: 'Жалоба',
    advice: 'Предложение',
    other: 'Другое'
  };

  // Обработчик вкладок
  document.querySelectorAll('.tab-button').forEach(button =>
  {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-tab');
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      document.getElementById(tab).classList.add('active');

      if (tab === 'listTab') {
        listenRequests(); // Запуск подписки на заявки
      }
    });
  });

  form.addEventListener('submit', async (e) =>
  {
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

    try
    {
      // Добавление заявки в базу данных
      const docRef = await db.collection('requests').add(
      {
        type,
        description,
        userId,  // Добавляем userId, чтобы заявка была привязана к конкретному пользователю
        status: 'new',
        comments: [],
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      form.reset();
      showNotification('Заявка успешно отправлена!');
      // Переключаемся на вкладку "Мои заявки" и сразу обновляем список
      document.querySelector('[data-tab="listTab"]').click();

      // Обновляем список заявок, добавив только что отправленную заявку
      listenRequests();

    } catch (error) {
      alert('Ошибка при отправке заявки: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить';
    }
  });

  function showNotification(message)
  {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 4000);
  }

  // Переход на скачивание справки
  function showHelp()
  {
    // Перенаправление на URL для скачивания документации
     window.open('https://disk.yandex.ru/d/-hNkZ9EVyGhm-Q', '_blank');
}

  // Подписка на заявки пользователя (реальное время)
  function listenRequests() {
    console.log('Подключаем слушатель заявок...'); // Логируем, что мы начинаем слушать
    return db.collection('requests')
      .where('userId', '==', userId)  // Фильтруем заявки по userId
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        console.log('Получены данные:', snapshot.docs); // Логируем полученные данные
        if (snapshot.empty) {
          requestsList.innerHTML = '<p>Заявок нет.</p>';
          return;
        }
        renderRequests(snapshot.docs);  // Рендерим заявки
      });
  }

  // Функция для рендеринга списка заявок
  function renderRequests(docs)
  {
    console.log('Рендеринг заявок:', docs);
    requestsList.innerHTML = '';
    docs.forEach(doc => {
      const data = doc.data();
      const requestElement = document.createElement('div');
      requestElement.classList.add('request-item');
      requestElement.innerHTML = `
        <p><strong>Тип заявки:</strong> ${typeTranslations[data.type]}</p>
        <p><strong>Описание:</strong> ${data.description}</p>
        <p><strong>Статус:</strong> <span class="status">${data.status}</span></p>
        <div class="comments">
          ${data.comments.map(comment => `<p class="comment">${comment}</p>`).join('')}
        </div>
      `;
      requestsList.appendChild(requestElement);
    });
  }