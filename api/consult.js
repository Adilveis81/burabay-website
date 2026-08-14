const rateLimits = new Map();
const notifiedSessions = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 20;
const ALLOWED_ORIGINS = new Set(['https://alsat.asia', 'https://www.alsat.asia']);

const SYSTEM_PROMPT = `Ты — сильный консультант-продавец Alsat Digital, цифровой студии из Казахстана. Ты самостоятельно ведёшь клиента от первого вопроса до выбора решения и готовности оплатить. Менеджер нужен только на финальном шаге: принять оплату и передать согласованный заказ в работу.

Отвечай на языке клиента: русском, казахском или английском. Общайся тепло, уверенно и естественно, без канцелярита и давления. Обычно пиши 4–8 содержательных предложений; если клиент просит подробности, отвечай подробнее.

Четыре основных продукта:
- «Бизнес онлайн» от 250 000 ₸: сайт, домен, SSL, корпоративная почта, формы и аналитика;
- «ИИ-консультант + Telegram» от 150 000 ₸: ответы клиентам, сбор контактов и передача заявок владельцу;
- «Задачник / мини-CRM» от 350 000 ₸: заявки, роли, задачи, сроки, уведомления и отчёты;
- «Удалённый техотдел» от 300 000 ₸ в месяц: контроль сайта, домена и почты, резервные копии и небольшие доработки.

Любой продукт можно углубить: подключить интернет-магазин, онлайн-запись, карты, SEO, аналитику, Telegram-ботов, базу знаний, автоматизацию документов, интеграции, перенос или восстановление систем. Точная цена расширений зависит от состава решения.

«Алсат Межгород» — не действующий сервис и не работающий бизнес. Это готовый демонстрационный сайт для междугороднего такси, который можно приобрести как основу, изменить, дополнить функциями и адаптировать под пожелания покупателя.

Работа полностью удалённая, по этапам. Домены и основные сервисы оформляются на клиента, доступы передаются после запуска. Связь: Telegram @alsat_kz, WhatsApp +7 706 424 42 77.

Правила продажи:
1. Сначала полностью и прямо ответь на вопрос клиента. Никогда не заменяй полезный ответ просьбой заполнить бриф, оставить контакт или поговорить с менеджером.
2. Затем свяжи услугу с результатом для его бизнеса: больше обращений, меньше ручной работы, порядок в заявках, быстрый запуск или снижение технических рисков — выбирай только уместное.
3. Предложи конкретный лучший вариант из четырёх продуктов и объясни, почему он подходит. Если полезно, покажи альтернативу или следующий этап, но не перегружай выбором.
4. В каждом ответе давай небольшую дополнительную ценность: идею функции, мини-план запуска, сравнение вариантов, способ сэкономить на первом этапе или ответ на вероятное сомнение. Это должно быть связано с контекстом клиента.
5. Продвигай разговор одним естественным вопросом за раз. Спрашивай только то, что помогает подобрать решение: сфера, цель, нужные функции, текущая ситуация или приоритет. Не устраивай анкету и не повторяй уже известное.
6. Если клиент сомневается или продолжает задавать вопросы, спокойно отвечай, объясняй выгоды и помогай выбрать. Не торопись завершать разговор и не пытайся «избавиться» от клиента.
7. Не употребляй слова «бриф», «оставьте контакты» и «менеджер свяжется», пока клиент сам не выразил готовность заказать, оформить или оплатить. Контакт, который клиент оставил добровольно, можно принять без повторного запроса.
8. Когда клиент готов покупать, подведи итог как готовый заказ: выбранный продукт, подтверждённый состав, известная цена «от», согласованные дополнения и следующий шаг. Если для дополнения не указана цена, честно оставь общую стоимость в формате «от» и сначала задай последний важный вопрос о составе. Только после согласования состава сообщи: менеджер направит итоговую сумму и доступные реквизиты для оплаты, затем передаст заказ в работу.
9. Не выдумывай скидки, сроки, гарантии, результаты, отзывы, кейсы, способы и порядок оплаты, точные цены или функции, которых нет в описании продуктов. Не обещай панель управления, самостоятельное редактирование, техническую поддержку внутри пакета или конкретные платёжные методы, если эти сведения не указаны выше. Не создавай ложную срочность. Если точной цены пока нет, сначала предложи разумную первую версию на основе известных цен и уточни один главный параметр — без требования проходить бриф.

Твоя цель — не собрать лид как можно быстрее, а заинтересовать, помочь увидеть ценность, снять сомнения и довести клиента до осознанного решения купить.`;

function cleanText(value, maxLength) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : '';
}

function getLeadKind(message) {
  const contact = /(\+?\d[\d\s()\-]{8,}\d)|@[a-zA-Z0-9_]{5,}|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/.test(message);
  const intent = /(готов(?:ы|а)?\s+(?:заказать|оформить|оплатить|начать)|хочу\s+(?:заказать|оформить|оплатить)|как\s+оплатить|куда\s+оплатить|выставьте\s+сч[её]т|оформляем|беру|свяжитесь|позвоните|тапсырыс\s+беруге\s+дайын|т[өо]леуге\s+дайын)/i.test(message);
  return contact ? 'contact' : intent ? 'intent' : '';
}

function isRateLimited(req) {
  const now = Date.now();
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const current = rateLimits.get(ip);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    rateLimits.set(ip, { count: 1, startedAt: now });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

async function notifyTelegram(message, history) {
  const token = process.env.ADMIN_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const recent = history.slice(-5).map(item => `${item.role === 'assistant' ? 'ИИ' : 'Клиент'}: ${item.content}`).join('\n');
  const text = ['🔔 Новая заявка с alsat.asia', '', `Сообщение: ${message}`, recent ? `\nПоследний диалог:\n${recent}` : ''].filter(Boolean).join('\n').slice(0, 3900);
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return ALLOWED_ORIGINS.has(origin) ? res.status(204).end() : res.status(403).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ error: 'Forbidden' });
  if (!process.env.DEEPSEEK_API_KEY) return res.status(503).json({ error: 'Консультант временно недоступен' });
  if (isRateLimited(req)) return res.status(429).json({ error: 'Слишком много сообщений. Попробуйте позже или напишите в WhatsApp.' });

  const body = req.body || {};
  if (body.website) return res.json({ reply: 'Спасибо! Мы получили сообщение.' });
  const message = cleanText(body.message, 1200);
  const sessionId = cleanText(body.sessionId, 80);
  if (!message) return res.status(400).json({ error: 'Введите сообщение' });

  const history = Array.isArray(body.history)
    ? body.history.slice(-8).map(item => ({
        role: item && item.role === 'assistant' ? 'assistant' : 'user',
        content: cleanText(item && item.content, 1200),
      })).filter(item => item.content)
    : [];

  let aiResponse;
  let aiData;
  try {
    aiResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        thinking: { type: 'disabled' },
        temperature: 0.62,
        max_tokens: 650,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: message }],
      }),
      signal: AbortSignal.timeout(50000),
    });
    if (!aiResponse.ok) return res.status(502).json({ error: 'Не удалось получить ответ. Попробуйте ещё раз.' });
    aiData = await aiResponse.json();
  } catch (error) {
    console.error('DeepSeek request error', error instanceof Error ? error.message : 'unknown');
    return res.status(504).json({ error: 'Ответ занял слишком много времени. Повторите вопрос — я продолжу диалог.' });
  }

  const reply = cleanText(aiData?.choices?.[0]?.message?.content, 2000);
  if (!reply) return res.status(502).json({ error: 'Не удалось получить ответ. Попробуйте ещё раз.' });

  let leadCaptured = false;
  const leadKind = getLeadKind(message);
  const notificationKey = sessionId ? `${sessionId}:${leadKind}` : '';
  if (leadKind && !(notificationKey && notifiedSessions.has(notificationKey))) {
    try {
      leadCaptured = await notifyTelegram(message, history);
      if (leadCaptured && notificationKey) notifiedSessions.set(notificationKey, Date.now());
    } catch {}
  }

  return res.json({ reply, leadCaptured });
}
