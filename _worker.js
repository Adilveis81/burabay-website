// Cloudflare Pages Worker — routing + AI consultant for alsat.asia

const rateLimits = new Map();
const notifiedSessions = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 20;

const SYSTEM_PROMPT = `Ты — главный онлайн-консультант Alsat Digital, цифровой студии из Казахстана.
Отвечай на языке клиента: русском, казахском или английском. Пиши дружелюбно, уверенно и кратко: обычно 2–5 предложений.

Четыре основных продукта:
- «Бизнес онлайн» от 250 000 ₸: сайт, домен, SSL, корпоративная почта, формы и аналитика;
- «ИИ-консультант + Telegram» от 150 000 ₸: ответы клиентам, сбор контактов и передача заявок владельцу;
- «Задачник / мини-CRM» от 350 000 ₸: заявки, роли, задачи, сроки, уведомления и отчёты;
- «Удалённый техотдел» от 300 000 ₸ в месяц: контроль сайта, домена и почты, резервные копии и небольшие доработки.

Любой продукт можно углубить: подключить интернет-магазин, онлайн-запись, карты, SEO, аналитику, Telegram-ботов, базу знаний, автоматизацию документов, интеграции, перенос или восстановление систем. Точная цена расширений определяется после брифа.

«Алсат Межгород» — не действующий сервис и не работающий бизнес. Это готовый демонстрационный сайт для междугороднего такси, который можно приобрести как основу, изменить, дополнить функциями и адаптировать под пожелания покупателя.

Работа полностью удалённая, по этапам. Домены и основные сервисы оформляются на клиента, доступы передаются после запуска. Связь: Telegram @alsat_kz, WhatsApp +7 706 424 42 77.

Твоя задача — понять бизнес клиента, нужную услугу, желаемый срок и ориентир бюджета. Задавай не более одного уточняющего вопроса за ответ. Когда запрос понятен, предложи оставить имя и телефон/Telegram — менеджер свяжется лично. Не выдумывай сроки, скидки, гарантии, кейсы и точные цены сверх указанных данных. Для нестандартного проекта говори, что оценка будет после короткого брифа.`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function cleanText(value, maxLength) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : '';
}

function isRateLimited(request) {
  const now = Date.now();
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const current = rateLimits.get(ip);

  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateLimits.set(ip, { count: 1, startedAt: now });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT;
}

function getLeadKind(message, contact) {
  if (contact) return 'contact';
  const phoneOrHandle = /(\+?\d[\d\s()\-]{8,}\d)|@[a-zA-Z0-9_]{5,}|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(message);
  const orderIntent = /(заказать|заказываю|готов начать|свяжитесь|позвоните|оставлю номер|хочу сайт|нужен сайт|нужна crm|нужен бот|тапсырыс|байланыс)/i.test(message);
  if (phoneOrHandle) return 'contact';
  if (orderIntent) return 'intent';
  return '';
}

async function notifyTelegram(env, lead) {
  const token = env.ADMIN_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN;
  const chatId = env.ADMIN_CHAT_ID || env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const historyText = lead.history
    .slice(-5)
    .map(item => `${item.role === 'assistant' ? 'ИИ' : 'Клиент'}: ${item.content}`)
    .join('\n');
  const text = [
    '🔔 Новая заявка с alsat.asia',
    '',
    lead.contact ? `Контакт: ${lead.contact}` : 'Контакт: пока не указан',
    `Сообщение: ${lead.message}`,
    historyText ? `\nПоследний диалог:\n${historyText}` : '',
  ].filter(Boolean).join('\n').slice(0, 3900);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}

async function handleConsult(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Forbidden' }, 403);
  if (!env.DEEPSEEK_API_KEY) return json({ error: 'Консультант временно недоступен' }, 503);
  if (isRateLimited(request)) return json({ error: 'Слишком много сообщений. Попробуйте позже или напишите в WhatsApp.' }, 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Некорректный запрос' }, 400);
  }

  // Honeypot: legitimate clients never fill this field.
  if (body.website) return json({ reply: 'Спасибо! Мы получили сообщение.' });

  const message = cleanText(body.message, 1200);
  const contact = cleanText(body.contact, 180);
  const sessionId = cleanText(body.sessionId, 80);
  if (!message) return json({ error: 'Введите сообщение' }, 400);

  const history = Array.isArray(body.history)
    ? body.history.slice(-8).map(item => ({
        role: item && item.role === 'assistant' ? 'assistant' : 'user',
        content: cleanText(item && item.content, 1200),
      })).filter(item => item.content)
    : [];

  let aiResponse;
  try {
    aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        thinking: { type: 'disabled' },
        temperature: 0.45,
        max_tokens: 420,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: contact ? `${message}\nКонтакт клиента: ${contact}` : message },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (error) {
    console.error('DeepSeek network error', error);
    return json({ error: 'Консультант не успел ответить. Напишите нам в WhatsApp.' }, 504);
  }

  if (!aiResponse.ok) {
    console.error('DeepSeek error', aiResponse.status);
    return json({ error: 'Не удалось получить ответ. Напишите нам в WhatsApp.' }, 502);
  }

  const aiData = await aiResponse.json();
  const reply = cleanText(aiData?.choices?.[0]?.message?.content, 2000);
  if (!reply) return json({ error: 'Не удалось получить ответ. Напишите нам в WhatsApp.' }, 502);

  let leadCaptured = false;
  const leadKind = getLeadKind(message, contact);
  const notificationKey = sessionId ? `${sessionId}:${leadKind}` : '';
  const alreadyNotified = notificationKey && notifiedSessions.has(notificationKey);
  if (leadKind && !alreadyNotified) {
    try {
      leadCaptured = await notifyTelegram(env, { message, contact, history });
      if (leadCaptured && notificationKey) notifiedSessions.set(notificationKey, Date.now());
    } catch (error) {
      console.error('Telegram notification error', error);
    }
  }

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, timestamp] of notifiedSessions) {
    if (timestamp < cutoff) notifiedSessions.delete(key);
  }

  return json({ reply, leadCaptured });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname;

    if (url.pathname === '/api/consult') {
      return handleConsult(request, env);
    }

    const subdomainMap = {
      'kg.alsat.asia': '/kg.html',
      'uz.alsat.asia': '/uz.html',
      'tr.alsat.asia': '/tr.html',
      'az.alsat.asia': '/az.html',
    };

    const targetPath = subdomainMap[host];
    if (targetPath) {
      const newUrl = new URL(request.url);
      newUrl.pathname = targetPath;
      return env.ASSETS.fetch(new Request(newUrl.toString(), request));
    }

    if ((host === 'alsat.asia' || host === 'www.alsat.asia') && url.pathname === '/') {
      const noGeo = url.searchParams.get('nogeo');
      if (!noGeo) {
        const country = request.headers.get('CF-IPCountry') || '';
        const geoRedirect = {
          KG: 'https://kg.alsat.asia',
          UZ: 'https://uz.alsat.asia',
          TR: 'https://tr.alsat.asia',
          AZ: 'https://az.alsat.asia',
        };
        const redirectUrl = geoRedirect[country];
        if (redirectUrl) return Response.redirect(redirectUrl, 302);
      }
    }

    return env.ASSETS.fetch(request);
  },
};
