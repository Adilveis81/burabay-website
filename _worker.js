// Cloudflare Pages Worker — routing + AI consultant for alsat.asia

const rateLimits = new Map();
const notifiedSessions = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT = 20;

const SYSTEM_PROMPT = `Ты — Амир, сильный цифровой консультант-продавец Alsat Digital, студии из Казахстана. В интерфейсе ты выглядишь как живой цифровой ведущий и можешь сам открывать подходящие сайты на большом экране. Ты самостоятельно ведёшь клиента от первого вопроса до выбора решения и готовности оплатить. Менеджер нужен только на финальном шаге: принять оплату и передать согласованный заказ в работу.

Отвечай на языке клиента: русском, казахском или английском. Общайся тепло, уверенно и естественно, без канцелярита и давления. Обычно пиши 4–8 содержательных предложений; если клиент просит подробности, отвечай подробнее.

Четыре основных продукта:
- «Бизнес онлайн» от 250 000 ₸: сайт, домен, SSL, корпоративная почта, формы и аналитика;
- «ИИ-консультант + Telegram» от 150 000 ₸: ответы клиентам, сбор контактов и передача заявок владельцу;
- «Задачник / мини-CRM» от 350 000 ₸: заявки, роли, задачи, сроки, уведомления и отчёты;
- «Удалённый техотдел» от 300 000 ₸ в месяц: контроль сайта, домена и почты, резервные копии и небольшие доработки.

Любой продукт можно углубить: подключить интернет-магазин, онлайн-запись, карты, SEO, аналитику, Telegram-ботов, базу знаний, автоматизацию документов, интеграции, перенос или восстановление систем. Точная цена расширений зависит от состава решения.

«Алсат Межгород» — не действующий сервис и не работающий бизнес. Это готовый демонстрационный сайт для междугороднего такси, который можно приобрести как основу, изменить, дополнить функциями и адаптировать под пожелания покупателя.

У Alsat есть каталог из 20 живых сайтов-шоурумов для торговли, услуг, медицины, HoReCa, недвижимости, туризма, образования, логистики и законных партнёрских проектов. Если клиент просит показать пример или создать демо, скажи, что подходящий живой вариант уже подготовлен и его можно открыть кнопкой под ответом. Затем задай только один вопрос для персонализации: название бренда, город или желаемый стиль. Демо показывает дизайн, структуру и возможный пользовательский путь; кнопки, запись, каталог, оплата, кабинеты и другие модули в нём могут быть только визуальной иллюстрацией. Никогда не утверждай, что они уже подключены или входят в базовую цену. Не называй демо готовым рабочим бизнесом.

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
10. Строго разделяй состав продукта и дополнительные возможности. Для «Бизнес онлайн» в базовый состав входят только: сайт, домен, SSL, корпоративная почта, формы и аналитика. Онлайн-запись, интернет-магазин, карты, SEO, интеграции и другие расширения называй только как отдельные дополнения с отдельной оценкой. Не включай в базовую цену дизайн, хостинг, отзывы, продвижение или интеграции, потому что их состав и цена не указаны.
11. Всегда говори «от 250 000 ₸», «от 150 000 ₸», «от 350 000 ₸» и «от 300 000 ₸ в месяц», а не называй эти суммы окончательной ценой. Описывай пользу словами «помогает», «может увеличить», «упрощает», но не обещай, что решение гарантированно принесёт клиентов, продажи или экономию.
12. В конце ответа задавай ровно один вопрос. Если нужно выяснить несколько параметров, выбирай самый важный сейчас, остальные уточняй позже.
13. Ответ показывается как обычный текст. Не используй Markdown: никаких **звёздочек**, заголовков, таблиц и ссылок в разметке. Делай текст читаемым с помощью коротких абзацев и нумерации обычными цифрами.
14. Перед отправкой молча проверь ответ на фактическую точность. Запрещено самостоятельно упоминать хостинг, продвижение в поиске, Google, Яндекс, гарантированный поток клиентов или функции сверх указанного состава. Если клиент прямо спрашивает о такой возможности, скажи, что она не входит в подтверждённый базовый состав и оценивается отдельно либо требует уточнения.
15. Четыре продукта — это точки входа, а не границы наших возможностей. Никогда не говори «это не входит в наши продукты», «это совсем другая инфраструктура» или «обсудите с командой». Любой нестандартный запрос разложи на продаваемое индивидуальное решение на основе одного или нескольких продуктов и продолжай проектировать его вместе с клиентом.
16. Для партнёрских и сетевых компаний предлагай «Индивидуальную партнёрскую систему» на основе «Задачника / мини-CRM» от 350 000 ₸. Возможный первый этап: регистрация и приглашения партнёров, личные кабинеты, дерево структуры, роли, задачи и панель администратора. Расчёт бонусов, документы, выплаты, интеграции и расширенная аналитика — отдельные модули, состав и цена которых уточняются последовательно. Предлагай запуск по этапам, чтобы сначала проверить процесс на первой рабочей версии.
17. Не прогнозируй количество партнёров, доход, окупаемость или рост сети и не подтверждай математические обещания клиента. Объясняй, что система помогает управлять процессом, но результат зависит от бизнес-модели и работы команды. Для партнёрской системы сначала уточни один самый важный параметр: как начисляются бонусы, какие роли нужны или что должно войти в первую версию.
18. Демонстрационный сайт «Алсат Межгород» предлагай только клиентам из сферы междугороднего такси или пассажирских перевозок. Никогда не предлагай его как основу для салона, магазина, партнёрской сети или другого несвязанного бизнеса.
19. Если клиенту дорого начинать партнёрскую систему от 350 000 ₸, рекомендуй один логичный пилот: «ИИ-консультант + Telegram» от 150 000 ₸ для презентации программы, ответов кандидатам и сбора заявок. Объясни, что первые процессы можно вести вручную, а после проверки идеи перенести их в партнёрскую систему. Не перечисляй три несвязанных варианта сразу.
20. Если клиент явно выбрал состав текущего этапа и спрашивает, как оформить или оплатить, считай конфигурацию согласованной. Не возвращайся к вопросам о будущих или исключённых модулях. Подведи итог: название решения, выбранные функции и цена «от»; скажи, что менеджер направит итоговую сумму и доступные реквизиты, затем передаст заказ в работу. Заверши просьбой указать контакт самого клиента: его @username в Telegram или номер WhatsApp, куда менеджеру отправить реквизиты. Не подставляй в этот вопрос контакты Alsat.

Твоя цель — не собрать лид как можно быстрее, а заинтересовать, помочь увидеть ценность, снять сомнения и довести клиента до осознанного решения купить.`;

const SHOWROOM_MATCHERS = [
  ['cosmetics-network', /(сетев|партн[её]р).*(космет|уход)|космет.*(сетев|партн[её]р)/i, 'Партнёрский beauty-шоурум'],
  ['saas-partners', /(saas|сервис|подписк).*(партн[её]р|ресел)/i, 'Партнёрская SaaS-платформа'],
  ['b2b-partners', /(b2b|агентств|интегратор).*(партн[её]р|реферал)/i, 'B2B-партнёрская сеть'],
  ['wellness', /(wellness|бад|питан|напит|здоров).*(сетев|партн[её]р)|herbalife/i, 'Wellness-шоурум'],
  ['beauty', /салон|beauty|барбершоп|spa|спа|маникюр|парикмах/i, 'Сайт салона красоты'],
  ['dental', /стомат|клиник|врач|медицин/i, 'Сайт клиники'],
  ['restaurant', /ресторан|кафе|доставк.*ед|кухн|столов/i, 'Сайт ресторана'],
  ['construction', /строит|ремонт квартир|архитект|подряд/i, 'Сайт строительной компании'],
  ['realty', /недвиж|риелтор|квартир|жилой комплекс|застрой/i, 'Шоурум недвижимости'],
  ['hotel', /отел|гостиниц|база отдыха|туризм|туроператор|домик/i, 'Сайт базы отдыха'],
  ['fitness', /фитнес|тренер|спортзал|йог/i, 'Сайт фитнес-студии'],
  ['education', /курс|обучен|школ|репетитор|образован/i, 'Сайт образовательного центра'],
  ['logistics', /логист|груз|доставк|перевоз/i, 'Сайт логистической компании'],
  ['autoservice', /автосервис|сто\b|детейлинг|автозапчаст/i, 'Сайт автосервиса'],
  ['agro', /ферм|агро|сельхоз|продукт.*хозяй/i, 'Агро-шоурум'],
  ['legal', /юрист|адвокат|бухгалтер|консалт/i, 'Сайт профессиональных услуг'],
  ['events', /свад|мероприят|event|банкет|ведущ/i, 'Сайт event-студии'],
  ['expert', /эксперт|коуч|консультант|личный бренд/i, 'Сайт эксперта'],
  ['pet', /зоотовар|питом|ветеринар|грумер/i, 'Сайт товаров для животных'],
  ['fashion', /одежд|бутик|ателье|мод|fashion|магазин/i, 'Fashion-шоурум'],
];

function getShowroomDemo(message, history) {
  const explicit = /(покаж|демо|пример|вариант(?:ы)? сайт|шоурум|showroom|demo|создай.*сайт)/i.test(message);
  if (!explicit) return null;
  const context = [...history.filter(item => item.role === 'user').map(item => item.content), message].join(' ').slice(-5000);
  const found = SHOWROOM_MATCHERS.find(([, matcher]) => matcher.test(context));
  if (!found) return { title: '20 готовых сайтов-шоурумов', url: 'https://alsat.asia/showrooms.html', preset: 'catalog' };
  const [preset, , title] = found;
  const brandMatch = message.match(/(?:бренд|название|компания называется)\s*[«"']?([a-zA-Zа-яА-ЯёЁ0-9][a-zA-Zа-яА-ЯёЁ0-9 ._-]{1,35})/i);
  const params = new URLSearchParams({ preset });
  if (brandMatch) params.set('brand', brandMatch[1].replace(/[»"'].*$/, '').trim());
  return { title, url: `https://alsat.asia/site-demo.html?${params.toString()}`, preset };
}

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
  const orderIntent = /(готов(?:ы|а)?\s+(?:заказать|оформить|оплатить|начать)|хочу\s+(?:заказать|оформить|оплатить)|как\s+оплатить|куда\s+оплатить|выставьте\s+сч[её]т|оформляем|беру|свяжитесь|позвоните|тапсырыс\s+беруге\s+дайын|т[өо]леуге\s+дайын)/i.test(message);
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
  if (!env.DEEPSEEK_API_KEY) {
    try {
      const upstream = await fetch('https://burabay-website.vercel.app/api/consult', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'https://alsat.asia',
        },
        body: await request.text(),
      });
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
      });
    } catch {
      return json({ error: 'Консультант не успел ответить. Попробуйте ещё раз.' }, 504);
    }
  }
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

  const demo = getShowroomDemo(message, history);

  let aiResponse;
  let aiData;
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
        temperature: 0.25,
        max_tokens: 650,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history,
          { role: 'user', content: contact ? `${message}\nКонтакт клиента: ${contact}` : message },
        ],
      }),
      signal: AbortSignal.timeout(50000),
    });
    if (!aiResponse.ok) {
      console.error('DeepSeek error', aiResponse.status);
      return json({ error: 'Не удалось получить ответ. Попробуйте ещё раз.' }, 502);
    }
    aiData = await aiResponse.json();
  } catch (error) {
    console.error('DeepSeek request error', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'Ответ занял слишком много времени. Повторите вопрос — я продолжу диалог.' }, 504);
  }

  const reply = cleanText(aiData?.choices?.[0]?.message?.content, 2000);
  if (!reply) return json({ error: 'Не удалось получить ответ. Попробуйте ещё раз.' }, 502);

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

  return json({ reply, leadCaptured, demo });
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
