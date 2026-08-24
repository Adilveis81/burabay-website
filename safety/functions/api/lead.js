const WINDOW_SECONDS = 60 * 60;
const MAX_REQUESTS = 5;
const memoryLimits = new Map();
const allowedEmployees = new Set(['до 50', '51–200', '201–500', '501–1000', 'более 1000']);
const allowedIndustries = new Set(['Промышленность', 'Строительство', 'Нефтегазовая', 'Горнодобывающая', 'Логистика', 'Подрядная организация', 'Другое']);
const allowedInterests = new Set(['Охрана труда', 'Промышленная безопасность', 'Пожарная безопасность', 'Другие программы']);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    }
  });
}

function clean(value, max) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}

export function validateLead(input, now = Date.now()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Некорректный формат заявки.' };
  if (clean(input.website, 100)) return { error: 'Заявка отклонена системой защиты.' };
  const startedAt = Number(input.startedAt);
  if (!Number.isFinite(startedAt) || now - startedAt < 2000 || now - startedAt > 24 * 60 * 60 * 1000) {
    return { error: 'Обновите страницу и заполните форму ещё раз.' };
  }

  const lead = {
    name: clean(input.name, 80), company: clean(input.company, 120), phone: clean(input.phone, 30),
    contact: clean(input.contact, 120), employees: clean(input.employees, 30), industry: clean(input.industry, 60),
    interests: Array.isArray(input.interests) ? [...new Set(input.interests.map(item => clean(item, 60)))].filter(Boolean) : [],
    comment: clean(input.comment, 1500), intent: input.intent === 'price' ? 'Расчёт стоимости' : 'Демонстрация'
  };
  if (lead.name.length < 2 || lead.company.length < 2) return { error: 'Укажите имя и компанию.' };
  if (!/^\+?[0-9()\s-]{10,25}$/.test(lead.phone)) return { error: 'Проверьте номер телефона.' };
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.contact);
  const isTelegram = /^@[A-Za-z0-9_]{5,32}$/.test(lead.contact);
  if (!isEmail && !isTelegram) return { error: 'Укажите корректный email или Telegram в формате @username.' };
  if (!allowedEmployees.has(lead.employees) || !allowedIndustries.has(lead.industry)) return { error: 'Выберите количество сотрудников и отрасль из списка.' };
  if (!lead.interests.length || lead.interests.some(item => !allowedInterests.has(item))) return { error: 'Выберите хотя бы одно направление.' };
  if (input.consent !== 'yes') return { error: 'Для отправки нужно согласие на обработку данных.' };
  return { lead };
}

async function rateLimited(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const key = `lead:${ip}:${bucket}`;
  if (env.LEADS_KV) {
    const count = Number(await env.LEADS_KV.get(key)) || 0;
    if (count >= MAX_REQUESTS) return true;
    await env.LEADS_KV.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS + 60 });
    return false;
  }
  const entry = memoryLimits.get(key) || 0;
  memoryLimits.set(key, entry + 1);
  if (memoryLimits.size > 1000) memoryLimits.clear();
  return entry >= MAX_REQUESTS;
}

async function storeLead(env, id, lead, status) {
  if (!env.LEADS_KV) return;
  await env.LEADS_KV.put(`submission:${id}`, JSON.stringify({ ...lead, deliveryStatus: status, updatedAt: new Date().toISOString() }), { expirationTtl: 90 * 24 * 60 * 60 });
}

async function notifyOwner(env, id, lead) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('notification_not_configured');
  const text = [
    '🦺 Новая B2B-заявка Alsat Safety', `Заявка: ${id}`, `Цель: ${lead.intent}`, '',
    `Имя: ${lead.name}`, `Компания: ${lead.company}`, `Телефон: ${lead.phone}`, `Email / Telegram: ${lead.contact}`,
    `Сотрудников: ${lead.employees}`, `Отрасль: ${lead.industry}`, `Направления: ${lead.interests.join(', ')}`,
    lead.comment ? `Комментарий: ${lead.comment}` : ''
  ].filter(Boolean).join('\n').slice(0, 3900);
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  });
  if (!response.ok) throw new Error('notification_failed');
  const result = await response.json().catch(() => null);
  if (!result?.ok) throw new Error('notification_rejected');
}

export async function onRequestPost({ request, env }) {
  const contentLength = Number(request.headers.get('content-length')) || 0;
  if (contentLength > 20_000) return json({ error: 'Заявка слишком большая.' }, 413);
  const origin = request.headers.get('origin');
  const expectedOrigin = env.SITE_ORIGIN || new URL(request.url).origin;
  if (origin && origin !== expectedOrigin) return json({ error: 'Источник запроса не разрешён.' }, 403);
  if (await rateLimited(request, env)) return json({ error: 'Слишком много попыток. Попробуйте через час.' }, 429);

  const input = await request.json().catch(() => null);
  const result = validateLead(input);
  if (result.error) return json({ error: result.error }, 400);

  const id = crypto.randomUUID();
  try {
    await storeLead(env, id, result.lead, 'pending');
    await notifyOwner(env, id, result.lead);
    await storeLead(env, id, result.lead, 'delivered');
    return json({ ok: true, id });
  } catch {
    await storeLead(env, id, result.lead, 'delivery_failed').catch(() => {});
    return json({ error: 'Не удалось подтвердить доставку. Попробуйте ещё раз или напишите на info@alsat.asia.' }, 502);
  }
}

export function onRequestGet() {
  return json({ ok: true, service: 'alsat-safety-leads' });
}
