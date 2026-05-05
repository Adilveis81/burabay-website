const ALLOWED_ORIGINS = ['https://burabay.su', 'https://www.burabay.su', 'http://localhost:3000'];

function escapeMd(text) {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

function setCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function moderateWithAI(text) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      system: `Ты — модератор объявлений сайта burabay.su (Казахстан).
Проверь объявление. Отклони если содержит: спам, мошенничество, фишинг, незаконный контент (наркотики, оружие, контрафакт), оскорбления, 18+ материалы.
Верни ТОЛЬКО JSON без markdown: {"ok": true, "reason": "Объявление прошло проверку"} или {"ok": false, "reason": "краткая причина отклонения на русском"}`,
      messages: [{ role: 'user', content: `Объявление:\n${text}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.content?.find(b => b.type === 'text')?.text ?? '';
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

async function saveToRedis(ad) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['LPUSH', 'ads:list', ad.id],
      ['SET', `ads:${ad.id}`, JSON.stringify(ad)],
      ['LTRIM', 'ads:list', '0', '499'],
    ]),
  });
  if (!res.ok) console.error('Redis save error:', await res.text());
}

module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, category, city, title, description, price, name, phone, telegram } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Поле text обязательно' });
  }
  if (text.length > 4000) {
    return res.status(400).json({ error: 'Текст слишком длинный (макс. 4000 символов)' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(503).json({ error: 'Сервер не сконфигурирован. Попробуйте позже.' });
  }

  // AI moderation
  let moderation;
  try {
    moderation = await moderateWithAI(text.trim());
  } catch (err) {
    console.error('Moderation error:', err.message);
    moderation = { ok: true, reason: 'Модерация недоступна' };
  }

  if (!moderation.ok) {
    return res.status(422).json({
      error: `Объявление отклонено: ${moderation.reason}`,
      reason: moderation.reason,
    });
  }

  // Send to Telegram
  const message = `✅ Проверено AI\n\n${escapeMd(text.trim())}`;
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'MarkdownV2' }),
    });
    const data = await tgRes.json();
    if (!tgRes.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return res.status(502).json({ error: 'Ошибка при отправке объявления. Попробуйте позже.' });
    }
  } catch (err) {
    console.error('sendAd error:', err.message);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте позже.' });
  }

  // Save to Redis (non-blocking — don't fail the response if Redis is down)
  const ad = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    category: category || '',
    city: city || '',
    title: title || '',
    description: description || '',
    price: price || '',
    name: name || '',
    phone: phone || '',
    telegram: telegram || '',
  };
  saveToRedis(ad).catch(err => console.error('Redis async error:', err.message));

  return res.json({ ok: true });
};
