// Cloudflare Pages Function — @Alsat_Asia_bot webhook
// POST /api/tg  (set as Telegram webhook URL)
// GET  /api/tg  (health check)

const BOT_TOKEN_DEFAULT  = '8695550788:AAGHe6IfJBAtrD6FbGLet7_Rk6m7A9yCh7s';
const ADMIN_BOT_DEFAULT  = '8656447295:AAFHpvCGKjhSeqXS9DPAjeRd7pkyf7krtSs';
const ADMIN_CHAT_DEFAULT = '1162752434';
const SB_URL_DEFAULT     = 'https://duscyiyxfmsriyhwlbqx.supabase.co';
const SB_KEY_DEFAULT     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';

const CHAT_LIMIT = 5;
const HOUR_MS    = 60 * 60 * 1000;

export async function onRequestGet() {
  return json({ ok: true, service: 'alsat-tg-bot' });
}

export async function onRequestPost({ request, env }) {
  const BOT_TOKEN  = env.TELEGRAM_BOT_TOKEN  || BOT_TOKEN_DEFAULT;
  const ADMIN_BOT  = env.ADMIN_BOT_TOKEN     || ADMIN_BOT_DEFAULT;
  const ADMIN_CHAT = env.ADMIN_CHAT_ID       || ADMIN_CHAT_DEFAULT;
  const SB_URL     = env.SUPABASE_URL        || SB_URL_DEFAULT;
  const SB_KEY     = env.SUPABASE_KEY        || SB_KEY_DEFAULT;
  const TG_API     = 'https://api.telegram.org/bot' + BOT_TOKEN;

  const update = await request.json().catch(() => null);
  if (!update) return json({ ok: true });

  const msg = update?.message || update?.edited_message;
  if (!msg?.text) return json({ ok: true });

  const chat_id  = String(msg.chat.id);
  const username = msg.from?.username || msg.from?.first_name || '';
  const text     = msg.text.trim();

  // ── helpers ──────────────────────────────────────────────
  function sbH() {
    return { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };
  }

  async function tgSend(cid, txt, extra = {}) {
    return fetch(TG_API + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: cid, text: txt, parse_mode: 'Markdown', ...extra })
    }).catch(() => {});
  }

  async function getUser(cid) {
    const r = await fetch(SB_URL + '/rest/v1/tg_users?chat_id=eq.' + encodeURIComponent(cid) + '&limit=1', { headers: sbH() });
    const rows = await r.json().catch(() => []);
    return Array.isArray(rows) ? (rows[0] || null) : null;
  }

  async function upsertUser(cid, fields) {
    return fetch(SB_URL + '/rest/v1/tg_users', {
      method: 'POST',
      headers: { ...sbH(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ chat_id: String(cid), ...fields })
    }).catch(() => {});
  }

  function checkLimit(rateData) {
    const now = Date.now();
    const ts  = (Array.isArray(rateData) ? rateData : []).filter(t => now - t < HOUR_MS);
    return { ok: ts.length < CHAT_LIMIT, left: CHAT_LIMIT - ts.length, ts };
  }

  function parsePhone(t) {
    const d = t.replace(/\D/g, '');
    if (!d) return null;
    let ph = d;
    if (ph.length === 11 && ph[0] === '8') ph = '7' + ph.slice(1);
    else if (ph.length === 10) ph = '7' + ph;
    return ph.length === 11 && ph[0] === '7' ? ph : null;
  }

  async function askHaiku(question) {
    const key = env.ANTHROPIC_API_KEY;
    if (!key) return null;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system:
          'Ты помощник сайта Алсат — бесплатных объявлений Казахстана (alsat.asia). ' +
          'Отвечай кратко, дружелюбно. Помогай с покупкой, продажей, объявлениями, ценами, безопасными сделками. ' +
          'Отвечай на языке вопроса (русский / казахский / английский).',
        messages: [{ role: 'user', content: question }]
      })
    }).catch(() => null);
    if (!r?.ok) return null;
    const d = await r.json().catch(() => null);
    return d?.content?.[0]?.text?.trim() || null;
  }

  // ── /start ──────────────────────────────────────────────
  if (text === '/start' || text.startsWith('/start ')) {
    await tgSend(chat_id,
      '👋 Привет! Я бот сайта *Алсат* — бесплатных объявлений Казахстана.\n\n' +
      '📱 *Уведомления о своих объявлениях* — введите номер:\n`+77001234567`\n\n' +
      '💬 Задайте любой вопрос об объявлениях — отвечу!\n\n' +
      '🔗 alsat.asia'
    );
    return json({ ok: true });
  }

  // ── /help ────────────────────────────────────────────────
  if (text === '/help') {
    await tgSend(chat_id,
      '*Команды:*\n' +
      '/start — приветствие\n' +
      '/help — эта справка\n' +
      '/status — статус вашего аккаунта\n\n' +
      'Введите номер телефона — получайте уведомления о своих объявлениях.\n' +
      'Любой вопрос — отвечу (до 5 в час).'
    );
    return json({ ok: true });
  }

  // ── /status ──────────────────────────────────────────────
  if (text === '/status') {
    const u = await getUser(chat_id);
    if (u?.phone) {
      await tgSend(chat_id, '✅ Ваш телефон: *+' + u.phone + '*\nУведомления о новых объявлениях включены.');
    } else {
      await tgSend(chat_id, '❌ Телефон не привязан. Введите номер (+77XXXXXXXXX) чтобы получать уведомления.');
    }
    return json({ ok: true });
  }

  // ── phone number ─────────────────────────────────────────
  const phone = parsePhone(text);
  if (phone) {
    await upsertUser(chat_id, { phone, username });
    await tgSend(chat_id,
      '✅ Номер *+' + phone + '* сохранён!\n\n' +
      'Теперь вы получите уведомление здесь, когда ваше объявление на alsat.asia будет опубликовано.\n\n' +
      '💬 Есть вопросы — напишите!'
    );
    const link = username ? '@' + username : 'chat_id: ' + chat_id;
    fetch('https://api.telegram.org/bot' + ADMIN_BOT + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT,
        text: '📲 Новый пользователь бота Алсат!\n📞 +' + phone + '\n👤 ' + link,
        parse_mode: 'Markdown'
      })
    }).catch(() => {});
    return json({ ok: true });
  }

  // ── AI chat with rate limit ──────────────────────────────
  const user = await getUser(chat_id);
  const { ok, left, ts } = checkLimit(user?.rate_data);

  if (!ok) {
    await tgSend(chat_id, '⏳ Лимит 5 вопросов в час исчерпан. Попробуйте через час!');
    return json({ ok: true });
  }

  // typing indicator (fire-and-forget)
  fetch(TG_API + '/sendChatAction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, action: 'typing' })
  }).catch(() => {});

  const newTs  = [...ts, Date.now()];
  const answer = await askHaiku(text);

  // update rate data in parallel with reply
  upsertUser(chat_id, { username, rate_data: newTs }).catch(() => {});

  const leftAfter = left - 1;
  const hint = leftAfter <= 2 ? '\n\n_Осталось вопросов: ' + leftAfter + ' из 5 в час_' : '';
  const reply = answer
    ? answer + hint
    : 'Извините, сервис временно недоступен. Попробуйте позже!';

  await fetch(TG_API + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text: reply })
  }).catch(() => {});

  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
