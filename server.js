const TelegramBot = require('node-telegram-bot-api');

const token = '7602273744:AAHPWp0dcPIBa4UEtkXpFHssJ96WlZI7_TE';
const bot = new TelegramBot(token, { polling: true });
const webAppUrl = 'https://github.com/MrLamansh/Coursework-mini-app/blob/main/index.html';

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Добро пожаловать в Диспетчер 24 для ТСЖ!', {
        reply_markup: {
            inline_keyboard: [[{ text: 'Открыть мини-приложение', web_app: { url: webAppUrl } }]]
        }
    });
});

console.log('Бот запущен...');
