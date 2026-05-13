// @Alsat_Asia_bot — interactive Telegram bot
// • /start            → welcome + ask phone
// • +7XXXXXXXXXX      → save phone, confirm
// • any other text    → Claude Haiku (5 msg/hour per user)

const BOT_TOKEN = '8695550788:AAGHe6IfJBAtrD6FbGLet7_Rk6m7A9yCh7s';
const TG_API    = 'https://api.telegram.org/bot' + BOT_TOKEN;
const SB_URL    = 'https://duscyiyxfmsriyhwlbqx.supabase.co';
const SB_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';

const CHAT_LIMIT  = 5;
const HOUR_MS     = 60 * 60 * 1000;

// ── helpers ──────────────────────────────────────────────────────────

async function tgSend(chat_id, text, extra = {}) {
  return fetch(TG_API + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'Markdown', ...extra })
  }).catch(() => {});
}

async function tgAction(chat_id, action = 'typing') {
  return fetch(TG_API + '/sendChatAction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, action })
  }).catch(() => {});
}

function sbHeaders() {
  return { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };
}

async function getUser(chat_id) {
  const r = await fetch(SB_URL + '/rest/v1/tg_users?chat_id=eq.' + encodeURIComponent(chat_id) + '&limit=1', {
    headers: sbHeaders()
  });
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function upsertUser(chat_id, fields) {
  return fetch(SB_URL + '/rest/v1/tg_users', {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ chat_id: String(chat_id), ...fields })
  });
}

// ── rate limiting ─────────────────────────────────────────────────────

function checkLimit(rateData) {
  const now = Date.now();
  const ts  = (Array.isArray(rateData) ? rateData : []).filter(t => now - t < HOUR_MS);
  return { ok: ts.length < CHAT_LIMIT, left: CHAT_LIMIT - ts.length, ts };
}

// ── phone normalisation ───────────────────────────────────────────────

function parsePhone(text) {
  const digits = text.replace(/\D/g, '');
  if (!digits) return null;
  let ph = digits;
  if (ph.length === 11 && ph[0] === '8') ph = '7' + ph.slice(1);
  else if (ph.length === 10)              ph = '7' + ph;
  return ph.length === 11 && ph[0] === '7' ? ph : null;
}

// ── Claude Haiku ──────────────────────────────────────────────────────

async function askHaiku(question) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system:
        'Ты помощник сайта Алсат — бесплатных объявлений Казахстана (alsat.asia). ' +
        'Отвечай кратко, дружелюбно, на русском языке. ' +
        'Помогай с вопросами о покупке, продаже, объявлениях, ценах, безопасных сделках. ' +
        'Если вопрос не про Алсат — всё равно помоги, но мягко направь к теме сайта.',
      messages: [{ role: 'user', content: question }]
    })
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.content?.[0]?.text?.trim() || null;
}

// ── main handler ──────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const update = req.body;
  const msg    = update?.message || update?.edited_message;
  if (!msg || !msg.text) return res.status(200).json({ ok: true });

  const chat_id  = String(msg.chat.id);
  const username = msg.from?.username || msg.from?.first_name || '';
  const text     = msg.text.trim();

  // ── /start ──
  if (text === '/start' || text.startsWith('/start ')) {
    await tgSend(chat_id,
      '👋 Привет! Я бот сайта *Алсат* — бесплатных объявлений Казахстана.\n\n' +
      '📱 *Для получения уведомлений о своих объявлениях* введите номер телефона в формате:\n' +
      '`+77001234567`\n\n' +
      '💬 Также я могу ответить на любые вопросы об объявлениях, покупках и продажах — просто напишите!\n\n' +
      '🔗 alsat\\.asia'
    );
    return res.status(200).json({ ok: true });
  }

  // ── phone number ──
  const phone = parsePhone(text);
  if (phone) {
    await upsertUser(chat_id, { phone, username });
    await tgSend(chat_id,
      '✅ Номер *+' + phone + '* сохранён\\!\n\n' +
      'Теперь при размещении объявления на alsat\\.asia вы получите уведомление здесь\\.\n\n' +
      '💬 Если есть вопросы — просто напишите мне\\!'
    );
    return res.status(200).json({ ok: true });
  }

  // ── AI chat with rate limit ──
  const user               = await getUser(chat_id);
  const { ok, left, ts }   = checkLimit(user?.rate_data);

  if (!ok) {
    await tgSend(chat_id,
      '⏳ Лимит 5 вопросов в час исчерпан\\. Попробуйте через час\\!'
    );
    return res.status(200).json({ ok: true });
  }

  // Save rate timestamp first (non-blocking save after reply)
  const newTs = [...ts, Date.now()];

  await tgAction(chat_id); // show "typing..."

  const answer = await askHaiku(text);

  if (!answer) {
    await tgSend(chat_id, 'Извините, сервис временно недоступен\\. Попробуйте позже\\!');
  } else {
    const leftAfter = left - 1;
    const hint = leftAfter <= 1
      ? '\n\n_Осталось вопросов: ' + leftAfter + ' из 5 в час_'
      : '';
    // escape answer for Markdown - send as plain text to avoid parse errors
    await fetch(TG_API + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: answer + hint })
    }).catch(() => {});
  }

  // Update rate data in background
  upsertUser(chat_id, { username, rate_data: newTs }).catch(() => {});

  return res.status(200).json({ ok: true });
};
