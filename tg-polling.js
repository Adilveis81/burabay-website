#!/usr/bin/env node
// Telegram bot — long polling mode (alsat.asia @Alsat_Asia_bot)
// Runs on Mac Mini / any server. No Cloudflare, no webhook needed.
// Usage: node tg-polling.js   (or: pm2 start tg-polling.js --name alsat-bot)

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN  || '8695550788:AAGHe6IfJBAtrD6FbGLet7_Rk6m7A9yCh7s';
const ADMIN_BOT  = process.env.ADMIN_BOT_TOKEN     || '8656447295:AAFHpvCGKjhSeqXS9DPAjeRd7pkyf7krtSs';
const ADMIN_CHAT = process.env.ADMIN_CHAT_ID        || '1162752434';
const SB_URL     = process.env.SUPABASE_URL         || 'https://duscyiyxfmsriyhwlbqx.supabase.co';
const SB_KEY     = process.env.SUPABASE_KEY         || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

const TG = 'https://api.telegram.org/bot' + BOT_TOKEN;
const CHAT_LIMIT = 5;
const HOUR_MS    = 60 * 60 * 1000;

let offset = 0;

// ── helpers ─────────────────────────────────────────────────────────────────

function sbH() {
  return { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };
}

async function tgSend(chat_id, text, extra = {}) {
  const r = await fetch(TG + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text, parse_mode: 'Markdown', ...extra })
  }).catch(e => { console.error('tgSend error:', e.message); return null; });
  return r;
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
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
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

// ── notification engine ──────────────────────────────────────────────────────

async function phoneToChat(phone) {
  if (!phone) return null;
  const ph = String(phone).replace(/\D/g, '');
  const r = await fetch(
    SB_URL + '/rest/v1/tg_users?phone=eq.' + ph + '&select=chat_id,notify&limit=1',
    { headers: sbH() }
  ).catch(() => null);
  if (!r?.ok) return null;
  const rows = await r.json().catch(() => []);
  const u = rows[0];
  if (!u) return null;
  if (u.notify === false) return null;
  return u.chat_id;
}

async function notifyMatchingDrivers(req) {
  const from = (req.from_city||'').toLowerCase();
  const to   = (req.to_city||'').toLowerCase();
  const r = await fetch(
    SB_URL + '/rest/v1/taxi_drivers?select=id,phone,telegram,whatsapp,from_city,to_city,price,seats,car,exp',
    { headers: sbH() }
  ).catch(() => null);
  if (!r?.ok) return;
  const drivers = await r.json().catch(() => []);
  for (const d of drivers) {
    if ((d.from_city||'').toLowerCase() !== from || (d.to_city||'').toLowerCase() !== to) continue;
    const chat_id = await phoneToChat(d.phone);
    if (!chat_id) continue;
    const date = req.travel_date ? ` · 📅 ${req.travel_date}` : '';
    const comment = req.comment ? `\n💬 _${req.comment}_` : '';
    await tgSend(chat_id,
      `🧳 *Новый пассажир на ваш маршрут!*\n\n` +
      `🛣 ${req.from_city} → ${req.to_city}${date}\n` +
      `👥 Мест: ${req.seats || 1}\n` +
      `👤 ${req.name || 'Пассажир'}${comment}\n\n` +
      `📞 +${req.phone}\n` +
      (req.whatsapp ? `💬 [WhatsApp](https://wa.me/${req.whatsapp})\n` : '') +
      (req.telegram ? `✈️ Telegram: ${req.telegram}\n` : '') +
      `\n_Отключить уведомления: /off_`
    );
  }
}

async function notifyMatchingPassengers(driver) {
  const from = (driver.from_city||'').toLowerCase();
  const to   = (driver.to_city||'').toLowerCase();
  const r = await fetch(
    SB_URL + '/rest/v1/taxi_requests?select=id,phone,telegram,whatsapp,from_city,to_city,travel_date,seats,name,comment',
    { headers: sbH() }
  ).catch(() => null);
  if (!r?.ok) return;
  const requests = await r.json().catch(() => []);
  for (const p of requests) {
    if ((p.from_city||'').toLowerCase() !== from || (p.to_city||'').toLowerCase() !== to) continue;
    const chat_id = await phoneToChat(p.phone);
    if (!chat_id) continue;
    const priceStr = driver.price ? Number(driver.price).toLocaleString('ru-KZ') + ' ₸ за место' : '';
    await tgSend(chat_id,
      `🚗 *Новый водитель на ваш маршрут!*\n\n` +
      `🛣 ${driver.from_city} → ${driver.to_city}\n` +
      (driver.car ? `🚘 ${driver.car} · Стаж ${driver.exp || '?'}\n` : '') +
      (priceStr ? `💰 ${priceStr}\n` : '') +
      `👥 Мест: ${driver.seats || 4}\n\n` +
      `📞 +${driver.phone}\n` +
      (driver.whatsapp ? `💬 [WhatsApp](https://wa.me/${driver.whatsapp})\n` : '') +
      (driver.telegram ? `✈️ Telegram: ${driver.telegram}\n` : '') +
      `\n_Отключить уведомления: /off_`
    );
  }
}

async function checkNotifications() {
  try {
    // new passenger requests → notify matching drivers
    const rPax = await fetch(
      SB_URL + '/rest/v1/taxi_requests?notified=eq.false&limit=10',
      { headers: sbH() }
    ).catch(() => null);
    if (rPax?.ok) {
      const reqs = await rPax.json().catch(() => []);
      for (const req of reqs) {
        await notifyMatchingDrivers(req);
        await fetch(SB_URL + '/rest/v1/taxi_requests?id=eq.' + req.id, {
          method: 'PATCH',
          headers: { ...sbH(), Prefer: 'return=minimal' },
          body: JSON.stringify({ notified: true })
        }).catch(() => {});
      }
    }

    // new driver posts → notify matching passengers
    const rDrv = await fetch(
      SB_URL + '/rest/v1/taxi_drivers?notified=eq.false&limit=10',
      { headers: sbH() }
    ).catch(() => null);
    if (rDrv?.ok) {
      const drvs = await rDrv.json().catch(() => []);
      for (const drv of drvs) {
        await notifyMatchingPassengers(drv);
        await fetch(SB_URL + '/rest/v1/taxi_drivers?id=eq.' + drv.id, {
          method: 'PATCH',
          headers: { ...sbH(), Prefer: 'return=minimal' },
          body: JSON.stringify({ notified: true })
        }).catch(() => {});
      }
    }
  } catch(e) {
    console.error('checkNotifications error:', e.message);
  }
}

// ── handle single message ────────────────────────────────────────────────────

async function handleMessage(msg) {
  if (!msg?.text) return;
  const chat_id  = String(msg.chat.id);
  const username = msg.from?.username || msg.from?.first_name || '';
  const text     = msg.text.trim();

  console.log(`[${new Date().toISOString()}] @${username} (${chat_id}): ${text.substring(0,60)}`);

  if (text === '/start' || text.startsWith('/start ')) {
    await tgSend(chat_id,
      '👋 Привет! Я бот сайта *Алсат* — бесплатных объявлений Казахстана.\n\n' +
      '📱 *Уведомления о своих объявлениях* — введите номер:\n`+77001234567`\n\n' +
      '💬 Задайте любой вопрос об объявлениях — отвечу!\n\n' +
      '🔗 alsat.asia'
    );
    return;
  }

  if (text === '/help') {
    await tgSend(chat_id,
      '*Команды:*\n' +
      '/start — приветствие\n' +
      '/help — эта справка\n' +
      '/status — статус вашего аккаунта\n' +
      '/off — отключить уведомления\n' +
      '/on — включить уведомления\n\n' +
      'Введите номер телефона — получайте уведомления о попутках.\n' +
      'Любой вопрос — отвечу (до 5 в час).'
    );
    return;
  }

  if (text === '/status') {
    const u = await getUser(chat_id);
    if (u?.phone) {
      const notifyState = u.notify === false ? '🔕 Отключены' : '🔔 Включены';
      await tgSend(chat_id,
        '✅ Ваш телефон: *+' + u.phone + '*\n' +
        'Уведомления: ' + notifyState + '\n\n' +
        'Команды: /off — отключить, /on — включить'
      );
    } else {
      await tgSend(chat_id, '❌ Телефон не привязан. Введите номер (+77XXXXXXXXX).');
    }
    return;
  }

  if (text === '/off' || text === '/отписаться') {
    const u = await getUser(chat_id);
    if (!u?.phone) {
      await tgSend(chat_id, '❌ Сначала привяжите телефон — введите номер (+77XXXXXXXXX).');
      return;
    }
    await upsertUser(chat_id, { notify: false });
    await tgSend(chat_id, '🔕 Уведомления о попутках *отключены*.\nВключить снова: /on');
    return;
  }

  if (text === '/on' || text === '/подписаться') {
    const u = await getUser(chat_id);
    if (!u?.phone) {
      await tgSend(chat_id, '❌ Сначала привяжите телефон — введите номер (+77XXXXXXXXX).');
      return;
    }
    await upsertUser(chat_id, { notify: true });
    await tgSend(chat_id, '🔔 Уведомления о попутках *включены*!\nОтключить: /off');
    return;
  }

  const phone = parsePhone(text);
  if (phone) {
    await upsertUser(chat_id, { phone, username });
    await tgSend(chat_id,
      '✅ Номер *+' + phone + '* сохранён!\n\n' +
      'Вы получите уведомление когда ваше объявление на alsat.asia будет опубликовано.\n\n' +
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
    return;
  }

  // AI chat
  const user = await getUser(chat_id);
  const { ok, left, ts } = checkLimit(user?.rate_data);

  if (!ok) {
    await tgSend(chat_id, '⏳ Лимит 5 вопросов в час исчерпан. Попробуйте через час!');
    return;
  }

  // typing indicator
  fetch(TG + '/sendChatAction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, action: 'typing' })
  }).catch(() => {});

  const newTs  = [...ts, Date.now()];
  const answer = await askHaiku(text);

  upsertUser(chat_id, { username, rate_data: newTs }).catch(() => {});

  const leftAfter = left - 1;
  const hint  = leftAfter <= 2 ? '\n\n_Осталось вопросов: ' + leftAfter + ' из 5 в час_' : '';
  const reply = answer
    ? answer + hint
    : 'Извините, сервис временно недоступен. Попробуйте позже!';

  await tgSend(chat_id, reply);
}

// ── main polling loop ────────────────────────────────────────────────────────

async function poll() {
  while (true) {
    try {
      const r = await fetch(
        TG + '/getUpdates?timeout=30&offset=' + offset +
        '&allowed_updates=' + encodeURIComponent(JSON.stringify(['message','edited_message'])),
        { signal: AbortSignal.timeout(40000) }
      );
      if (!r.ok) {
        console.error('getUpdates HTTP error:', r.status);
        await sleep(5000);
        continue;
      }
      const d = await r.json();
      if (!d.ok) {
        console.error('getUpdates error:', JSON.stringify(d));
        await sleep(5000);
        continue;
      }
      for (const upd of (d.result || [])) {
        offset = upd.update_id + 1;
        const msg = upd.message || upd.edited_message;
        if (msg) handleMessage(msg).catch(e => console.error('handleMessage error:', e.message));
      }
    } catch (e) {
      console.error('poll error:', e.message);
      await sleep(5000);
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── startup ──────────────────────────────────────────────────────────────────

async function start() {
  // Remove any existing webhook so polling works
  try {
    const r = await fetch(TG + '/deleteWebhook?drop_pending_updates=false');
    const d = await r.json();
    if (d.ok) console.log('✅ Webhook deleted — polling mode active');
    else console.log('⚠️  deleteWebhook:', JSON.stringify(d));
  } catch(e) {
    console.error('deleteWebhook error:', e.message);
  }

  console.log('🤖 @Alsat_Asia_bot started — long polling...');
  poll();

  // check for new taxi matches every 2 minutes
  setInterval(() => {
    checkNotifications().catch(e => console.error('notify interval error:', e.message));
  }, 2 * 60 * 1000);

  // initial check on startup
  setTimeout(() => checkNotifications().catch(() => {}), 10000);
}

start();
