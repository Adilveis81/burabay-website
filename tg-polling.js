#!/usr/bin/env node
// Telegram bot — long polling mode (alsat.asia @Alsat_Asia_bot)
// Security: AI moderation · phone masking · rate limits · contact audit log

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN  || '8695550788:AAGHe6IfJBAtrD6FbGLet7_Rk6m7A9yCh7s';
const ADMIN_BOT  = process.env.ADMIN_BOT_TOKEN     || '8656447295:AAFHpvCGKjhSeqXS9DPAjeRd7pkyf7krtSs';
const ADMIN_CHAT = process.env.ADMIN_CHAT_ID        || '1162752434';
const SB_URL     = process.env.SUPABASE_URL         || 'https://duscyiyxfmsriyhwlbqx.supabase.co';
const SB_KEY     = process.env.SUPABASE_KEY         || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

const TG       = 'https://api.telegram.org/bot' + BOT_TOKEN;
const CHAT_LIMIT    = 5;
const HOUR_MS       = 60 * 60 * 1000;
const DAY_MS        = 24 * 60 * 60 * 1000;
const POST_LIMIT    = 3;   // max new posts per phone per 24h
const CONTACT_LIMIT = 10;  // max contact requests per driver per 24h

// Competitor names to block in ads
const COMPETITORS = ['indrive','indriver','yandex taxi','яндекс такси','blablacar','бла бла кар','uber','bolt','maxim','максим такси','wheely'];

let offset = 0;

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── alert channels ────────────────────────────────────────────────────────────
// ADMIN_CHAT = Адил (владелец)
// CLAUDE_CHAT = Claude (AI-агент, принимает решения по безопасности)
const CLAUDE_CHAT = process.env.CLAUDE_CHAT_ID || ADMIN_CHAT; // set env var to separate Claude's chat

async function adminAlert(text) {
  // notify owner (Адил)
  return fetch('https://api.telegram.org/bot' + ADMIN_BOT + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: 'Markdown' })
  }).catch(() => {});
}

// Security alerts go to Claude for autonomous decision-making
async function securityAlert(level, title, details, actions) {
  const icons = { critical: '🚨', high: '⚠️', medium: '🔶', info: 'ℹ️' };
  const icon = icons[level] || '🔶';
  const actionsText = actions && actions.length
    ? '\n\n*Доступные действия:*\n' + actions.map((a, i) => `${i + 1}. ${a.label}: \`${a.cmd}\``).join('\n')
    : '';
  const msg =
    `${icon} *[${level.toUpperCase()}] ${title}*\n\n` +
    details +
    actionsText +
    `\n\n_${new Date().toLocaleString('ru-KZ', { timeZone: 'Asia/Almaty' })}_`;

  // to Claude
  fetch('https://api.telegram.org/bot' + ADMIN_BOT + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CLAUDE_CHAT, text: msg, parse_mode: 'Markdown' })
  }).catch(() => {});

  // also to Адил for critical
  if (level === 'critical') {
    return adminAlert(msg);
  }
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

function shortId(uuid) {
  return (uuid || '').replace(/-/g, '').substring(0, 8);
}

// ── AI moderation ─────────────────────────────────────────────────────────────

async function moderateContent(fields) {
  if (!ANTHROPIC_KEY) return { ok: true }; // no key — fail open

  // Fast client-side checks first (no AI needed)
  const allText = Object.values(fields).filter(v => typeof v === 'string').join(' ').toLowerCase();

  // URL / link detection
  if (/https?:\/\/|www\.|\.ru\/|\.kz\/|\.com\/|t\.me\/(?!alsat)/.test(allText)) {
    return { ok: false, reason: 'Ссылки на внешние сайты запрещены' };
  }

  // Competitor detection
  const rival = COMPETITORS.find(c => allText.includes(c));
  if (rival) {
    return { ok: false, reason: `Реклама конкурентов запрещена (${rival})` };
  }

  // Phone numbers hidden in text (trying to bypass masking)
  const extraPhones = (allText.match(/[7-8]\d{9}/g) || []);
  if (extraPhones.length > 1) {
    return { ok: false, reason: 'Несколько номеров телефона в объявлении' };
  }

  // AI check for profanity, spam, off-topic
  const text = `Маршрут: ${fields.from_city||''} → ${fields.to_city||''}\nКомментарий: ${fields.comment || fields.desc || fields.car || ''}`;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system:
        'Ты модератор сайта попутчиков Казахстана alsat.asia. ' +
        'Проверь объявление на нарушения: нецензурная лексика (рус/каз/eng), оскорбления, угрозы, ' +
        'спам, бессмысленный текст, реклама сторонних сервисов. ' +
        'Ответь ТОЛЬКО JSON без пояснений: {"ok":true} или {"ok":false,"reason":"..."}',
      messages: [{ role: 'user', content: text }]
    })
  }).catch(() => null);

  if (!r?.ok) return { ok: true }; // AI недоступен — пропускаем
  const d = await r.json().catch(() => null);
  const raw = d?.content?.[0]?.text?.trim() || '{"ok":true}';
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch(e) {
    return { ok: true };
  }
}

// ── rate limiting ─────────────────────────────────────────────────────────────

async function checkPostingLimit(phone, table) {
  if (!phone) return true;
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const r = await fetch(
    `${SB_URL}/rest/v1/${table}?phone=eq.${phone}&created_at=gte.${encodeURIComponent(since)}&select=id`,
    { headers: sbH() }
  ).catch(() => null);
  if (!r?.ok) return true; // fail open
  const rows = await r.json().catch(() => []);
  return rows.length < POST_LIMIT;
}

async function checkContactLimit(chat_id) {
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const r = await fetch(
    `${SB_URL}/rest/v1/contact_requests?requester_chat=eq.${chat_id}&created_at=gte.${encodeURIComponent(since)}&select=id`,
    { headers: sbH() }
  ).catch(() => null);
  if (!r?.ok) return true;
  const rows = await r.json().catch(() => []);
  return rows.length < CONTACT_LIMIT;
}

// ── notification engine ───────────────────────────────────────────────────────

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
  if (!u || u.notify === false) return null;
  return u.chat_id;
}

async function notifyMatchingDrivers(req) {
  const from = (req.from_city||'').toLowerCase();
  const to   = (req.to_city||'').toLowerCase();
  const r = await fetch(
    SB_URL + '/rest/v1/taxi_drivers?select=id,phone,from_city,to_city,price,seats,car,exp&blocked=neq.true',
    { headers: sbH() }
  ).catch(() => null);
  if (!r?.ok) return;
  const drivers = await r.json().catch(() => []);
  const sid = shortId(req.id);

  for (const d of drivers) {
    if ((d.from_city||'').toLowerCase() !== from || (d.to_city||'').toLowerCase() !== to) continue;
    const chat_id = await phoneToChat(d.phone);
    if (!chat_id) continue;

    const date    = req.travel_date ? ` · 📅 ${req.travel_date}` : '';
    const comment = req.comment ? `\n💬 _${req.comment}_` : '';

    await tgSend(chat_id,
      `🧳 *Новый пассажир на ваш маршрут!*\n\n` +
      `🛣 ${req.from_city} → ${req.to_city}${date}\n` +
      `👥 Мест: ${req.seats || 1}\n` +
      `👤 ${req.name || 'Пассажир'}${comment}\n\n` +
      `📲 *Получить контакт:* /contact\\_req\\_${sid}\n` +
      `\n_Отключить уведомления: /off_`
    );
  }
}

async function notifyMatchingPassengers(driver) {
  const from = (driver.from_city||'').toLowerCase();
  const to   = (driver.to_city||'').toLowerCase();
  const r = await fetch(
    SB_URL + '/rest/v1/taxi_requests?select=id,phone,from_city,to_city,travel_date,seats,name,comment',
    { headers: sbH() }
  ).catch(() => null);
  if (!r?.ok) return;
  const requests = await r.json().catch(() => []);
  const sid = shortId(driver.id);

  for (const p of requests) {
    if ((p.from_city||'').toLowerCase() !== from || (p.to_city||'').toLowerCase() !== to) continue;
    const chat_id = await phoneToChat(p.phone);
    if (!chat_id) continue;

    const priceStr = driver.price ? Number(driver.price).toLocaleString('ru-KZ') + ' ₸/место' : '';

    await tgSend(chat_id,
      `🚗 *Новый водитель на ваш маршрут!*\n\n` +
      `🛣 ${driver.from_city} → ${driver.to_city}\n` +
      (driver.car ? `🚘 ${driver.car} · Стаж ${driver.exp || '?'}\n` : '') +
      (priceStr ? `💰 ${priceStr}\n` : '') +
      `👥 Мест: ${driver.seats || 4}\n\n` +
      `📲 *Получить контакт:* /contact\\_drv\\_${sid}\n` +
      `\n_Отключить уведомления: /off_`
    );
  }
}

async function checkNotifications() {
  try {
    // ── new passenger requests ──────────────────────────────
    const rPax = await fetch(
      SB_URL + '/rest/v1/taxi_requests?notified=eq.false&limit=10',
      { headers: sbH() }
    ).catch(() => null);
    if (rPax?.ok) {
      const reqs = await rPax.json().catch(() => []);
      for (const req of reqs) {

        // 1. rate limit check
        const withinLimit = await checkPostingLimit(req.phone, 'taxi_requests');
        if (!withinLimit) {
          console.log(`[mod] Rate limit: ${req.phone} posting too often`);
          await fetch(SB_URL + '/rest/v1/taxi_requests?id=eq.' + req.id, {
            method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
            body: JSON.stringify({ notified: true, blocked: true, block_reason: 'Превышен лимит публикаций (3 в сутки)' })
          }).catch(() => {});
          await securityAlert('high', 'Rate limit: пассажир',
            `📞 +${req.phone}\n🛣 ${req.from_city} → ${req.to_city}\n❗ Превышен лимит публикаций (3/сутки)`,
            [{ label: 'Разблокировать', cmd: `/unblock_req_${shortId(req.id)}` }, { label: 'Заблокировать навсегда', cmd: `/ban_${req.phone}` }]);
          continue;
        }

        // 2. AI moderation
        const mod = await moderateContent({ from_city: req.from_city, to_city: req.to_city, comment: req.comment, name: req.name });
        if (!mod.ok) {
          console.log(`[mod] Rejected passenger request ${req.id}: ${mod.reason}`);
          await fetch(SB_URL + '/rest/v1/taxi_requests?id=eq.' + req.id, {
            method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
            body: JSON.stringify({ notified: true, blocked: true, block_reason: mod.reason })
          }).catch(() => {});
          await securityAlert('high', 'Модерация отклонила: пассажир',
            `📞 +${req.phone}\n🛣 ${req.from_city} → ${req.to_city}\n💬 "${req.comment||''}"\n❗ ${mod.reason}`,
            [{ label: 'Одобрить вручную', cmd: `/approve_req_${shortId(req.id)}` }, { label: 'Бан', cmd: `/ban_${req.phone}` }]);
          // notify the passenger if they're in the bot
          const cid = await phoneToChat(req.phone);
          if (cid) await tgSend(cid, `⛔ Ваша заявка на маршрут *${req.from_city} → ${req.to_city}* отклонена модерацией.\n❗ Причина: ${mod.reason}`);
          continue;
        }

        // 3. notify matching drivers (WITHOUT phone)
        await notifyMatchingDrivers(req);
        await fetch(SB_URL + '/rest/v1/taxi_requests?id=eq.' + req.id, {
          method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
          body: JSON.stringify({ notified: true })
        }).catch(() => {});
      }
    }

    // ── new driver posts ─────────────────────────────────────
    const rDrv = await fetch(
      SB_URL + '/rest/v1/taxi_drivers?notified=eq.false&limit=10',
      { headers: sbH() }
    ).catch(() => null);
    if (rDrv?.ok) {
      const drvs = await rDrv.json().catch(() => []);
      for (const drv of drvs) {

        // 1. rate limit
        const withinLimit = await checkPostingLimit(drv.phone, 'taxi_drivers');
        if (!withinLimit) {
          console.log(`[mod] Rate limit driver: ${drv.phone}`);
          await fetch(SB_URL + '/rest/v1/taxi_drivers?id=eq.' + drv.id, {
            method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
            body: JSON.stringify({ notified: true, blocked: true, block_reason: 'Превышен лимит публикаций (3 в сутки)' })
          }).catch(() => {});
          await securityAlert('high', 'Rate limit: водитель',
            `📞 +${drv.phone}\n🛣 ${drv.from_city} → ${drv.to_city}\n❗ Превышен лимит публикаций (3/сутки)`,
            [{ label: 'Разблокировать', cmd: `/unblock_drv_${shortId(drv.id)}` }, { label: 'Бан', cmd: `/ban_${drv.phone}` }]);
          continue;
        }

        // 2. AI moderation
        const mod = await moderateContent({ from_city: drv.from_city, to_city: drv.to_city, comment: drv.desc, car: drv.car });
        if (!mod.ok) {
          console.log(`[mod] Rejected driver post ${drv.id}: ${mod.reason}`);
          await fetch(SB_URL + '/rest/v1/taxi_drivers?id=eq.' + drv.id, {
            method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
            body: JSON.stringify({ notified: true, blocked: true, block_reason: mod.reason })
          }).catch(() => {});
          await securityAlert('high', 'Модерация отклонила: водитель',
            `📞 +${drv.phone}\n🛣 ${drv.from_city} → ${drv.to_city}\n🚘 ${drv.car||''}\n💬 "${drv.desc||''}"\n❗ ${mod.reason}`,
            [{ label: 'Одобрить вручную', cmd: `/approve_drv_${shortId(drv.id)}` }, { label: 'Бан', cmd: `/ban_${drv.phone}` }]);
          const cid = await phoneToChat(drv.phone);
          if (cid) await tgSend(cid, `⛔ Ваше объявление водителя на маршрут *${drv.from_city} → ${drv.to_city}* отклонено модерацией.\n❗ Причина: ${mod.reason}`);
          continue;
        }

        // 3. notify matching passengers (WITHOUT phone)
        await notifyMatchingPassengers(drv);
        await fetch(SB_URL + '/rest/v1/taxi_drivers?id=eq.' + drv.id, {
          method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
          body: JSON.stringify({ notified: true })
        }).catch(() => {});
      }
    }
  } catch(e) {
    console.error('checkNotifications error:', e.message);
  }
}

// ── contact exchange (phone masking) ─────────────────────────────────────────

async function handleContactRequest(chat_id, type, sid) {
  // Check requester is registered
  const u = await getUser(chat_id);
  if (!u?.phone) {
    await tgSend(chat_id, '❌ Сначала зарегистрируйте номер телефона:\nОтправьте свой номер (+77XXXXXXXXX)');
    return;
  }

  // Rate limit on contact requests
  const canRequest = await checkContactLimit(chat_id);
  if (!canRequest) {
    await tgSend(chat_id, `⏳ Достигнут лимит запросов контактов (${CONTACT_LIMIT} в сутки). Попробуйте завтра.`);
    return;
  }

  let targetPhone = null;
  let targetChatId = null;
  let logData = {};

  if (type === 'req') {
    // Driver requesting passenger's phone
    // Find passenger request by shortId
    const r = await fetch(
      SB_URL + '/rest/v1/taxi_requests?select=id,phone,from_city,to_city,name&blocked=neq.true',
      { headers: sbH() }
    ).catch(() => null);
    if (!r?.ok) { await tgSend(chat_id, '❌ Ошибка сервера. Попробуйте позже.'); return; }
    const rows = await r.json().catch(() => []);
    const req = rows.find(x => shortId(x.id) === sid);
    if (!req) { await tgSend(chat_id, '❌ Заявка не найдена или уже устарела.'); return; }

    targetPhone  = req.phone;
    targetChatId = await phoneToChat(req.phone);
    logData = { type: 'driver_got_passenger', req_id: req.id,
      from_city: req.from_city, to_city: req.to_city };

    await tgSend(chat_id,
      `📞 *Контакт пассажира* (${req.name || 'пассажир'}, ${req.from_city} → ${req.to_city}):\n\n` +
      `+${req.phone}\n` +
      `💬 [WhatsApp](https://wa.me/${req.phone})\n\n` +
      `_Пожалуйста, звоните только по делу. Злоупотребление ведёт к блокировке._`
    );

    // Notify passenger that a driver requested their contact
    if (targetChatId) {
      await tgSend(targetChatId,
        `🚗 Водитель запросил ваш контакт по маршруту *${req.from_city} → ${req.to_city}*.\n\n` +
        `Они свяжутся с вами по номеру +${req.phone}.\n` +
        `Если беспокоит — напишите нам.`
      );
    }

  } else if (type === 'drv') {
    // Passenger requesting driver's phone
    const r = await fetch(
      SB_URL + '/rest/v1/taxi_drivers?select=id,phone,from_city,to_city,car&blocked=neq.true',
      { headers: sbH() }
    ).catch(() => null);
    if (!r?.ok) { await tgSend(chat_id, '❌ Ошибка сервера. Попробуйте позже.'); return; }
    const rows = await r.json().catch(() => []);
    const drv = rows.find(x => shortId(x.id) === sid);
    if (!drv) { await tgSend(chat_id, '❌ Объявление не найдено или уже устарело.'); return; }

    targetPhone  = drv.phone;
    targetChatId = await phoneToChat(drv.phone);
    logData = { type: 'passenger_got_driver', drv_id: drv.id,
      from_city: drv.from_city, to_city: drv.to_city };

    await tgSend(chat_id,
      `📞 *Контакт водителя* (${drv.car || ''}, ${drv.from_city} → ${drv.to_city}):\n\n` +
      `+${drv.phone}\n` +
      `💬 [WhatsApp](https://wa.me/${drv.phone})\n\n` +
      `_Пожалуйста, обращайтесь по делу. Злоупотребление ведёт к блокировке._`
    );

    if (targetChatId) {
      await tgSend(targetChatId,
        `🧳 Пассажир запросил ваш контакт по маршруту *${drv.from_city} → ${drv.to_city}*.\n` +
        `Они свяжутся по номеру +${drv.phone}.`
      );
    }
  }

  // Save contact request to audit log
  fetch(SB_URL + '/rest/v1/contact_requests', {
    method: 'POST',
    headers: { ...sbH(), Prefer: 'return=minimal' },
    body: JSON.stringify({
      requester_chat: String(chat_id),
      requester_phone: u.phone,
      target_phone: targetPhone,
      ...logData
    })
  }).catch(() => {});
}

// ── askHaiku (AI chat) ────────────────────────────────────────────────────────

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

// ── handle single message ─────────────────────────────────────────────────────

async function handleMessage(msg) {
  if (!msg?.text) return;
  const chat_id  = String(msg.chat.id);
  const username = msg.from?.username || msg.from?.first_name || '';
  const text     = msg.text.trim();

  console.log(`[${new Date().toISOString()}] @${username} (${chat_id}): ${text.substring(0, 60)}`);

  // ── /start ──────────────────────────────────────────────────────────────────
  if (text === '/start' || text.startsWith('/start ')) {
    await tgSend(chat_id,
      '👋 Привет! Я бот сайта *Алсат* — попутчики по Казахстану.\n\n' +
      '📱 Зарегистрируйте номер — получайте уведомления о попутках:\n`+77001234567`\n\n' +
      '🔗 alsat.asia\n/help — все команды'
    );
    return;
  }

  // ── /help ───────────────────────────────────────────────────────────────────
  if (text === '/help') {
    await tgSend(chat_id,
      '*Команды:*\n' +
      '/start — приветствие\n' +
      '/status — ваш аккаунт\n' +
      '/off — отключить уведомления\n' +
      '/on — включить уведомления\n\n' +
      'Введите номер телефона — привязать аккаунт.\n' +
      'Любой вопрос о попутках — отвечу (до 5 в час).'
    );
    return;
  }

  // ── /status ─────────────────────────────────────────────────────────────────
  if (text === '/status') {
    const u = await getUser(chat_id);
    if (u?.phone) {
      const st = u.notify === false ? '🔕 Отключены' : '🔔 Включены';
      await tgSend(chat_id,
        `✅ Телефон: *+${u.phone}*\nУведомления: ${st}\n\n/off — выкл, /on — вкл`
      );
    } else {
      await tgSend(chat_id, '❌ Телефон не привязан. Отправьте номер (+77XXXXXXXXX).');
    }
    return;
  }

  // ── /off ────────────────────────────────────────────────────────────────────
  if (text === '/off' || text === '/отписаться') {
    const u = await getUser(chat_id);
    if (!u?.phone) { await tgSend(chat_id, '❌ Сначала привяжите телефон.'); return; }
    await upsertUser(chat_id, { notify: false });
    await tgSend(chat_id, '🔕 Уведомления *отключены*. Включить: /on');
    return;
  }

  // ── /on ─────────────────────────────────────────────────────────────────────
  if (text === '/on' || text === '/подписаться') {
    const u = await getUser(chat_id);
    if (!u?.phone) { await tgSend(chat_id, '❌ Сначала привяжите телефон.'); return; }
    await upsertUser(chat_id, { notify: true });
    await tgSend(chat_id, '🔔 Уведомления *включены*! Отключить: /off');
    return;
  }

  // ── admin commands (only from ADMIN_CHAT or CLAUDE_CHAT) ────────────────────
  if (chat_id === ADMIN_CHAT || chat_id === CLAUDE_CHAT) {

    // /approve_req_XXXXXXXX — approve blocked passenger request
    const approveReq = text.match(/^\/approve_req_([a-f0-9]{8})$/i);
    if (approveReq) {
      const sid = approveReq[1].toLowerCase();
      const r = await fetch(SB_URL + '/rest/v1/taxi_requests?select=id,from_city,to_city&blocked=eq.true', { headers: sbH() }).catch(() => null);
      const rows = await r?.json().catch(() => []) || [];
      const req = rows.find(x => shortId(x.id) === sid);
      if (!req) { await tgSend(chat_id, '❌ Заявка не найдена'); return; }
      await fetch(SB_URL + '/rest/v1/taxi_requests?id=eq.' + req.id, {
        method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
        body: JSON.stringify({ blocked: false, notified: false, block_reason: null })
      }).catch(() => {});
      await tgSend(chat_id, `✅ Заявка ${req.from_city}→${req.to_city} одобрена, будет разослана.`);
      return;
    }

    // /approve_drv_XXXXXXXX — approve blocked driver post
    const approveDrv = text.match(/^\/approve_drv_([a-f0-9]{8})$/i);
    if (approveDrv) {
      const sid = approveDrv[1].toLowerCase();
      const r = await fetch(SB_URL + '/rest/v1/taxi_drivers?select=id,from_city,to_city&blocked=eq.true', { headers: sbH() }).catch(() => null);
      const rows = await r?.json().catch(() => []) || [];
      const drv = rows.find(x => shortId(x.id) === sid);
      if (!drv) { await tgSend(chat_id, '❌ Объявление не найдено'); return; }
      await fetch(SB_URL + '/rest/v1/taxi_drivers?id=eq.' + drv.id, {
        method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
        body: JSON.stringify({ blocked: false, notified: false, block_reason: null })
      }).catch(() => {});
      await tgSend(chat_id, `✅ Объявление ${drv.from_city}→${drv.to_city} одобрено.`);
      return;
    }

    // /ban_77XXXXXXXXX — permanently block a phone number
    const banMatch = text.match(/^\/ban_(7\d{10})$/);
    if (banMatch) {
      const phone = banMatch[1];
      await fetch(SB_URL + '/rest/v1/taxi_drivers?phone=eq.' + phone, {
        method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
        body: JSON.stringify({ blocked: true, block_reason: 'Manual ban by admin' })
      }).catch(() => {});
      await fetch(SB_URL + '/rest/v1/taxi_requests?phone=eq.' + phone, {
        method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
        body: JSON.stringify({ blocked: true, block_reason: 'Manual ban by admin' })
      }).catch(() => {});
      // notify the banned user
      const cid = await phoneToChat(phone);
      if (cid) await tgSend(cid, '🚫 Ваш аккаунт заблокирован за нарушение правил платформы.');
      await tgSend(chat_id, `🚫 Номер +${phone} заблокирован.`);
      return;
    }

    // /stats — platform statistics
    if (text === '/stats') {
      const [rDrv, rReq, rCon] = await Promise.all([
        fetch(SB_URL + '/rest/v1/taxi_drivers?select=id,blocked', { headers: sbH() }).then(r=>r.json()).catch(()=>[]),
        fetch(SB_URL + '/rest/v1/taxi_requests?select=id,blocked', { headers: sbH() }).then(r=>r.json()).catch(()=>[]),
        fetch(SB_URL + '/rest/v1/contact_requests?select=id', { headers: sbH() }).then(r=>r.json()).catch(()=>[]),
      ]);
      const drvTotal = rDrv.length, drvBlocked = rDrv.filter(x=>x.blocked).length;
      const reqTotal = rReq.length, reqBlocked = rReq.filter(x=>x.blocked).length;
      await tgSend(chat_id,
        `📊 *Статистика платформы*\n\n` +
        `🚗 Водители: ${drvTotal} (заблокировано: ${drvBlocked})\n` +
        `🧳 Пассажиры: ${reqTotal} (заблокировано: ${reqBlocked})\n` +
        `🤝 Обменов контактами: ${rCon.length}`
      );
      return;
    }
  }

  // ── /contact_req_XXXXXXXX or /contact_drv_XXXXXXXX ─────────────────────────
  const contactMatch = text.match(/^\/contact_(req|drv)_([a-f0-9]{8})$/i);
  if (contactMatch) {
    await handleContactRequest(chat_id, contactMatch[1].toLowerCase(), contactMatch[2].toLowerCase());
    return;
  }

  // ── phone registration ──────────────────────────────────────────────────────
  const phone = parsePhone(text);
  if (phone) {
    await upsertUser(chat_id, { phone, username, notify: true });
    await tgSend(chat_id,
      `✅ Номер *+${phone}* сохранён!\n\n` +
      `Вы будете получать уведомления о попутках на ваших маршрутах.\n\n` +
      `💬 Задайте вопрос — отвечу!`
    );
    adminAlert(`📲 Новый пользователь бота Алсат!\n📞 +${phone}\n👤 ${username ? '@' + username : 'chat_id: ' + chat_id}`).catch(() => {});
    return;
  }

  // ── AI chat with rate limit ─────────────────────────────────────────────────
  const user = await getUser(chat_id);
  const { ok, left, ts } = checkLimit(user?.rate_data);

  if (!ok) {
    await tgSend(chat_id, '⏳ Лимит 5 вопросов в час. Попробуйте через час!');
    return;
  }

  fetch(TG + '/sendChatAction', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, action: 'typing' })
  }).catch(() => {});

  const newTs  = [...ts, Date.now()];
  const answer = await askHaiku(text);
  upsertUser(chat_id, { username, rate_data: newTs }).catch(() => {});

  const leftAfter = left - 1;
  const hint  = leftAfter <= 2 ? `\n\n_Осталось вопросов: ${leftAfter} из 5 в час_` : '';
  const reply = answer ? answer + hint : 'Сервис временно недоступен. Попробуйте позже!';
  await tgSend(chat_id, reply);
}

// ── main polling loop ─────────────────────────────────────────────────────────

async function poll() {
  while (true) {
    try {
      const r = await fetch(
        TG + '/getUpdates?timeout=30&offset=' + offset +
        '&allowed_updates=' + encodeURIComponent(JSON.stringify(['message', 'edited_message'])),
        { signal: AbortSignal.timeout(40000) }
      );
      if (!r.ok) { console.error('getUpdates HTTP:', r.status); await sleep(5000); continue; }
      const d = await r.json();
      if (!d.ok) { console.error('getUpdates err:', JSON.stringify(d)); await sleep(5000); continue; }
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

// ── startup ───────────────────────────────────────────────────────────────────

async function start() {
  try {
    const r = await fetch(TG + '/deleteWebhook?drop_pending_updates=false');
    const d = await r.json();
    console.log(d.ok ? '✅ Webhook deleted — polling mode' : '⚠️ deleteWebhook: ' + JSON.stringify(d));
  } catch(e) { console.error('deleteWebhook error:', e.message); }

  console.log('🤖 @Alsat_Asia_bot started — security mode active');
  poll();

  // check new taxi matches + moderation every 2 minutes
  setInterval(() => {
    checkNotifications().catch(e => console.error('notify interval error:', e.message));
  }, 2 * 60 * 1000);

  // initial check after 10s
  setTimeout(() => checkNotifications().catch(() => {}), 10000);
}

start();
