const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const path = require('path');

const token = '7602273744:AAHPWp0dcPIBa4UEtkXpFHssJ96WlZI7_TE'; // Заменить на токен от @BotFather
const bot = new TelegramBot(token, { polling: true });
const chmPath = path.join(__dirname, 'help', 'проверка.chm');
const cloudLink = 'https://disk.yandex.ru/d/-hNkZ9EVyGhm-Q'; // Заменить на реальную ссылку
const webAppUrl = 'https://username.github.io/D24TSZH/index.html'; // Заменить на URL GitHub Pages

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Добро пожаловать в Диспетчер 24 для ТСЖ!', {
    reply_markup: {
      inline_keyboard: [[{ text: 'Открыть мини-приложение', web_app: { url: webAppUrl } }]]
    }
  });
});

// Обработка команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  if (process.platform === 'win32') {
    exec(`start "" "${chmPath}"`, (err) => {
      bot.sendMessage(chatId, err ? 'Ошибка открытия справки. Скачайте: ' + cloudLink : 'Открыт файл справки.');
    });
  } else {
    bot.sendMessage(chatId, 'Скачайте справку: ' + cloudLink);
  }
});

// Обработка команды /context
bot.onText(/\/context/, (msg) => {
  const chatId = msg.chat.id;
  const helpId = msg.text.split(' ')[1] || 'HELP_MAIN_MENU';
  if (process.platform === 'win32') {
    exec(`hh.exe -mapid ${helpId} "${chmPath}"`, (err) => {
      bot.sendMessage(chatId, err ? 'Ошибка контекстной справки. Скачайте: ' + cloudLink : `Справка для: ${helpId}`);
    });
  } else {
    bot.sendMessage(chatId, `Контекстная справка доступна в: ` + cloudLink);
  }
});

// Обработка данных от Web App
bot.on('message', (msg) => {
  if (msg.web_app_data) {
    const data = JSON.parse(msg.web_app_data.data);
    const chatId = msg.chat.id;
    if (data.command === '/help') {
      if (process.platform === 'win32') {
        exec(`start "" "${chmPath}"`, (err) => {
          bot.sendMessage(chatId, err ? 'Ошибка открытия справки. Скачайте: ' + cloudLink : 'Открыт файл справки.');
        });
      } else {
        bot.sendMessage(chatId, 'Скачайте справку: ' + cloudLink);
      }
    } else if (data.command === '/context') {
      const helpId = data.helpId || 'HELP_MAIN_MENU';
      if (process.platform === 'win32') {
        exec(`hh.exe -mapid ${helpId} "${chmPath}"`, (err) => {
          bot.sendMessage(chatId, err ? 'Ошибка контекстной справки. Скачайте: ' + cloudLink : `Справка для: ${helpId}`);
        });
      } else {
        bot.sendMessage(chatId, `Контекстная справка для ${helpId} доступна в: ` + cloudLink);
      }
    }
  }
});

console.log('Бот запущен...');