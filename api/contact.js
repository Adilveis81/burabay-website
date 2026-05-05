const ALLOWED_ORIGINS = ['https://burabay.su', 'https://www.burabay.su', 'http://localhost:3000'];

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, whatsapp, telegram, message } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Имя обязательно' });
  }
  if (!whatsapp || typeof whatsapp !== 'string' || whatsapp.trim().length === 0) {
    return res.status(400).json({ error: 'WhatsApp обязателен' });
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Сообщение обязательно' });
  }
  if (name.length > 100 || message.length > 5000) {
    return res.status(400).json({ error: 'Текст слишком длинный' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(503).json({ error: 'Сервер не сконфигурирован. Попробуйте позже.' });
  }

  // Plain text — no MarkdownV2 to avoid escaping issues
  const tg = telegram ? `\nTelegram: ${telegram.trim()}` : '';
  const text = `✉️ Новое сообщение\n\nОт: ${name.trim()}\nWhatsApp: ${whatsapp.trim()}${tg}\n\n${message.trim()}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });
    const data = await tgRes.json();
    if (!tgRes.ok || !data.ok) {
      console.error('Telegram error:', data);
      return res.status(502).json({ error: 'Ошибка при отправке. Попробуйте позже.' });
    }
  } catch (err) {
    console.error('contact error:', err.message);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
  }

  return res.json({ ok: true, message: 'Спасибо за сообщение! Мы скоро ответим.' });
};
