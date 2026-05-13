// Telegram webhook handler for @Alsat_Asia_bot
// Receives /start PHONE or /phone PHONE — stores phone→chat_id in Supabase
// Then frontend can send seller notifications directly via Bot API

const BOT_TOKEN = '8695550788:AAGHe6IfJBAtrD6FbGLet7_Rk6m7A9yCh7s';
const TG_API   = 'https://api.telegram.org/bot' + BOT_TOKEN;
const SB_URL   = 'https://duscyiyxfmsriyhwlbqx.supabase.co';
const SB_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';

async function sendMsg(chat_id, text) {
  await fetch(TG_API + '/sendMessage', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id, text})
  }).catch(() => {});
}

async function savePhone(phone, chat_id, username) {
  const r = await fetch(SB_URL + '/rest/v1/tg_users', {
    method: 'POST',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ phone, chat_id: String(chat_id), username: username || '' })
  });
  return r.ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const update = req.body;
  const msg = update && (update.message || update.edited_message);
  if (!msg) return res.status(200).json({ ok: true });

  const chat_id  = msg.chat.id;
  const from     = msg.from || {};
  const username = from.username || from.first_name || '';
  const text     = (msg.text || '').trim();

  // normalise phone
  function normPhone(raw) {
    let ph = raw.replace(/\D/g, '');
    if (ph.length === 11 && ph[0] === '8') ph = '7' + ph.slice(1);
    else if (ph.length === 10) ph = '7' + ph;
    return ph.length >= 11 ? ph : null;
  }

  let phone = null;
  if (text.startsWith('/start ')) phone = normPhone(text.slice(7));
  else if (/^\/phone\s+/i.test(text)) phone = normPhone(text.replace(/^\/phone\s+/i, ''));

  if (phone) {
    await savePhone(phone, chat_id, username);
    await sendMsg(chat_id,
      '✅ Готово! Номер +' + phone + ' подключён.

' +
      'Теперь при размещении объявления на alsat.asia вы получите уведомление здесь.'
    );
  } else if (text === '/start') {
    await sendMsg(chat_id,
      '👋 Привет! Я бот сайта Алсат — бесплатных объявлений Казахстана.

' +
      'Чтобы получать уведомления о своих объявлениях, отправьте:
' +
      '/phone 77XXXXXXXXXX

' +
      'Замените 77XXXXXXXXXX на ваш номер телефона (11 цифр).

' +
      '🔗 alsat.asia'
    );
  } else {
    await sendMsg(chat_id,
      '❓ Отправьте /phone 77XXXXXXXXXX чтобы подключить уведомления.'
    );
  }

  return res.status(200).json({ ok: true });
};
