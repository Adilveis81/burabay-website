/**
 * Alsat Digital — i18n (RU / KZ / EN)
 * Подключается в index.html как <script src="/lang.js" defer></script>
 */
(() => {
  // ─── Словарь ───────────────────────────────────────────────────────────
  const T = {
    ru: {
      // Nav
      nav_services: 'Услуги',
      nav_tasks: 'Задачники',
      nav_cases: 'Проекты',
      nav_process: 'Как работаем',
      nav_prices: 'Стоимость',
      nav_cta: 'Обсудить проект',
      nav_menu: 'Меню',

      // Marquee
      m1:'Сайты и приложения', m2:'Теплицы и фермы', m3:'Гаражи и дома',
      m4:'Строительство', m5:'Цеха и склады', m6:'ИИ и роботы', m7:'CRM и задачники',

      // Proof bar
      proof1_h:'100% онлайн', proof1_s:'Созвоны, согласования и запуск',
      proof2_h:'1 точка связи', proof2_s:'Без передачи между подрядчиками',
      proof3_h:'Понятные этапы', proof3_s:'Видно, что готово и что дальше',
      proof4_h:'После запуска', proof4_s:'Поддержка и развитие проекта',

      // Services
      services_eyebrow:'Четыре основных продукта',
      services_h2:'Выберите результат, а не набор технологий',
      services_p:'Начинаем с понятного решения под ключ. Затем его можно углублять и развивать по мере роста бизнеса.',
      s1_h3:'Бизнес онлайн',
      s1_p:'Сайт, домен, корпоративная почта, аналитика и основные площадки — всё необходимое для полноценного запуска компании в интернете.',
      s2_h3:'ИИ-консультант + Telegram',
      s2_p:'Помощник отвечает клиентам на сайте круглосуточно, уточняет задачу и передаёт готовую заявку владельцу в Telegram.',
      s3_h3:'Задачник / мини-CRM',
      s3_p:'Простой рабочий кабинет для клиентов, заявок, сотрудников и сроков — без перегруженной универсальной CRM.',
      s4_h3:'Удалённый техотдел',
      s4_p:'Берём на себя сайты, домены, почту, ботов, резервные копии и небольшие доработки вместо отдельного специалиста в штате.',
      depth_eyebrow:'Можно углубиться',
      depth_h3:'Дополняем основу нужными возможностями',
      depth_p:'Не обязательно заказывать всё сразу. Откройте направление, чтобы увидеть, какие функции можно подключить следующим этапом.',
      depth1:'Развитие присутствия в интернете',
      depth2:'ИИ, Telegram и документы',
      depth3:'Продажи и внутренние процессы',
      depth4:'Поддержка и безопасность',

      // Tasks
      tasks_eyebrow:'Задачники под процесс',
      tasks_h2:'Порядок вместо таблиц и сообщений',
      tasks_p:'Создадим простой рабочий кабинет, где заявки не теряются, сотрудники видят задачи, а руководитель — сроки и результат.',

      // Cases
      cases_eyebrow:'Готовые решения',
      cases_h2:'Посмотрите демонстрации перед заказом',
      cases_p:'Готовые сайты показывают возможную основу проекта. Их можно приобрести, изменить дизайн, дополнить функциями и адаптировать под задачи покупателя.',

      // Process
      proc_eyebrow:'Удалённая работа',
      proc_h2:'Понятный процесс без ежедневных созвонов',
      proc_p:'Вы участвуете только там, где нужно принять решение. Остальное берём на себя и показываем по этапам.',
      proc1_h3:'Короткий бриф', proc1_p:'Разбираемся, кому и что вы продаёте, какие процессы нужно упростить.',
      proc2_h3:'План и стоимость', proc2_p:'Фиксируем состав первой версии, сроки, цену и критерии готовности.',
      proc3_h3:'Разработка', proc3_p:'Показываем промежуточный результат по ссылке и собираем правки.',
      proc4_h3:'Запуск', proc4_p:'Подключаем домен, аналитику, передаём доступы и остаёмся на связи.',

      // Prices
      prices_eyebrow:'Ориентиры по стоимости',
      prices_h2:'Четыре понятных способа начать',
      prices_p:'Выбираем основной продукт, фиксируем первую версию и только затем добавляем необходимые возможности.',
      p1_name:'Запуск компании', p1_btn:'Обсудить запуск',
      p2_name:'Работает 24/7', p2_btn:'Подключить ИИ',
      p3_name:'Под процесс', p3_btn:'Описать задачу',
      p4_name:'По подписке', p4_btn:'Узнать условия',

      // FAQ
      faq_eyebrow:'Вопросы',
      faq_h2:'До начала работы',
      faq1_q:'Можно работать полностью удалённо?',
      faq1_a:'Да. Бриф, демонстрации, согласования и передача проекта проходят онлайн. Общаемся в Telegram, WhatsApp или по видеосвязи.',
      faq2_q:'Кому будут принадлежать сайт и домен?',
      faq2_a:'Вам. Домены и основные сервисы оформляем на данные владельца бизнеса, а после запуска передаём все доступы.',
      faq3_q:'Можно начать с небольшой версии?',
      faq3_a:'Это предпочтительный подход. Сначала запускаем функции, которые дают пользу, затем развиваем проект на основе обратной связи.',
      faq4_q:'Что нужно предоставить для старта?',
      faq4_a:'Краткое описание бизнеса, список услуг или товаров, контакты и примеры, которые вам нравятся. Если материалов нет, поможем собрать структуру и тексты.',

      // Contact
      contact_eyebrow:'Начать проект',
      contact_h2:'Расскажите, что нужно улучшить',
      contact_p:'Ответим, предложим первый рабочий вариант и назовём ориентир по срокам и стоимости.',
      form_name:'Ваше имя', form_name_ph:'Как к вам обращаться',
      form_phone:'Телефон или WhatsApp', form_phone_ph:'+7 ...',
      form_service:'Что нужно сделать', form_service_ph:'Выберите основной продукт',
      form_msg:'Коротко о задаче', form_msg_ph:'Например: нужен сайт компании и кабинет для обработки заявок',
      form_submit:'Отправить в WhatsApp →',
      form_note:'Форма откроет WhatsApp с готовым сообщением. Ничего не отправляется без вашего подтверждения.',

      // Footer
      footer:'© 2026 Alsat Digital · Казахстан · Работаем удалённо',

      // AI chat
      ai_greeting:'Здравствуйте, я Мансур. Могу не только подобрать решение, но и прямо здесь показать живой сайт для вашей ниши. Что вы хотите продавать или автоматизировать?',
      ai_placeholder:'Напишите вопрос…',
      ai_chip1:'Сколько стоит сайт?',
      ai_chip2:'Нужен задачник',
      ai_chip3:'Хочу Telegram-бота',
      ai_launcher:'Спросить Мансура',
      ai_fallback:'Нужен человек? Написать в WhatsApp',
      ai_online:'ИИ отвечает сейчас',
    },

    kz: {
      nav_services: 'Қызметтер',
      nav_tasks: 'Тапсырмашылар',
      nav_cases: 'Жобалар',
      nav_process: 'Жұмыс тәртібі',
      nav_prices: 'Баға',
      nav_cta: 'Жобаны талқылау',
      nav_menu: 'Мәзір',

      m1:'Сайттар мен қосымшалар', m2:'Жылыжайлар мен фермалар', m3:'Гараждар мен үйлер',
      m4:'Құрылыс', m5:'Цехтар мен қоймалар', m6:'ЖИ мен роботтар', m7:'CRM және тапсырмашылар',

      proof1_h:'100% онлайн', proof1_s:'Кеңесулер, келісімдер және іске қосу',
      proof2_h:'1 байланыс нүктесі', proof2_s:'Мердігерлер арасында берілімсіз',
      proof3_h:'Түсінікті кезеңдер', proof3_s:'Не дайын, не келеді — барлығы көрінеді',
      proof4_h:'Іске қосқаннан кейін', proof4_s:'Жобаны қолдау және дамыту',

      services_eyebrow:'Төрт негізгі өнім',
      services_h2:'Технологиялар жиынтығы емес, нәтиже таңдаңыз',
      services_p:'Түсінікті «кілттен» шешімнен бастаймыз. Содан кейін бизнестің өсуіне қарай тереңдетіп, дамытуға болады.',
      s1_h3:'Бизнесті онлайнға шығару',
      s1_p:'Сайт, домен, корпоративтік пошта, аналитика және негізгі алаңдар — компанияны интернетте толыққанды іске қосуға қажеттінің бәрі.',
      s2_h3:'ЖИ-кеңесші + Telegram',
      s2_p:'Көмекші тәулік бойы сайттағы клиенттерге жауап береді, тапсырманы нақтылайды және дайын өтінішті иесіне Telegram арқылы жібереді.',
      s3_h3:'Тапсырмашы / мини-CRM',
      s3_p:'Клиенттер, өтініштер, қызметкерлер мен мерзімдер үшін қарапайым жұмыс кабинеті — артық функциялары жоқ.',
      s4_h3:'Қашықтан техотдел',
      s4_p:'Сайттарды, домендерді, поштаны, боттарды, сақтық көшірмелерді және шағын өзгертулерді штаттық маманның орнына өз мойнымызға аламыз.',
      depth_eyebrow:'Тереңдетуге болады',
      depth_h3:'Негізді қажетті мүмкіндіктермен толықтырамыз',
      depth_p:'Бірден бәрін тапсырыс беру міндетті емес. Келесі кезеңде қандай функцияларды қосуға болатынын көру үшін бағытты ашыңыз.',
      depth1:'Интернеттегі болуды дамыту',
      depth2:'ЖИ, Telegram және құжаттар',
      depth3:'Сатылым және ішкі процестер',
      depth4:'Қолдау және қауіпсіздік',

      tasks_eyebrow:'Процеске арналған тапсырмашылар',
      tasks_h2:'Кестелер мен хабарламалардың орнына тәртіп',
      tasks_p:'Өтініштер жоғалмайтын, қызметкерлер тапсырмаларды, басшы мерзімдер мен нәтижені көретін қарапайым жұмыс кабинетін жасаймыз.',

      cases_eyebrow:'Дайын шешімдер',
      cases_h2:'Тапсырыс беруден бұрын демонстрацияларды қараңыз',
      cases_p:'Дайын сайттар жобаның мүмкін негізін көрсетеді. Оларды сатып алуға, дизайнын өзгертуге, функцияларын толықтыруға және тапсырыс берушінің міндеттеріне бейімдеуге болады.',

      proc_eyebrow:'Қашықтан жұмыс',
      proc_h2:'Күнделікті кеңесулерсіз түсінікті процесс',
      proc_p:'Сіз тек шешім қабылдау керек жерде қатысасыз. Қалғанын өз мойнымызға алып, кезеңдер бойынша көрсетеміз.',
      proc1_h3:'Қысқа бриф', proc1_p:'Кімге не сататыныңызды, қандай процестерді жеңілдету керектігін анықтаймыз.',
      proc2_h3:'Жоспар мен баға', proc2_p:'Бірінші нұсқаның құрамын, мерзімдерін, бағасын және дайындық критерийлерін бекітеміз.',
      proc3_h3:'Әзірлеу', proc3_p:'Аралық нәтижені сілтеме арқылы көрсетіп, түзетулерді жинаймыз.',
      proc4_h3:'Іске қосу', proc4_p:'Доменді, аналитиканы қосамыз, рұқсаттарды береміз және байланыста қаламыз.',

      prices_eyebrow:'Баға бағдарлары',
      prices_h2:'Бастаудың төрт түсінікті жолы',
      prices_p:'Негізгі өнімді таңдаймыз, бірінші нұсқаны бекітеміз, содан кейін ғана қажетті мүмкіндіктерді қосамыз.',
      p1_name:'Компанияны іске қосу', p1_btn:'Іске қосуды талқылау',
      p2_name:'Тәулік бойы жұмыс', p2_btn:'ЖИ қосу',
      p3_name:'Процеске арналған', p3_btn:'Тапсырманы сипаттау',
      p4_name:'Жазылым бойынша', p4_btn:'Шарттарды білу',

      faq_eyebrow:'Сұрақтар',
      faq_h2:'Жұмыс басталмай тұрып',
      faq1_q:'Толығымен қашықтан жұмыс істей аламыз ба?',
      faq1_a:'Иә. Бриф, демонстрациялар, келісімдер және жобаны тапсыру онлайн жүреді. Telegram, WhatsApp немесе бейнебайланыс арқылы сөйлесеміз.',
      faq2_q:'Сайт пен домен кімге тиесілі болады?',
      faq2_a:'Сізге. Домендер мен негізгі қызметтерді бизнес иесінің деректеріне ресімдейміз, іске қосқаннан кейін барлық рұқсаттарды береміз.',
      faq3_q:'Шағын нұсқадан бастай аламыз ба?',
      faq3_a:'Бұл қолайлы тәсіл. Алдымен пайда беретін функцияларды іске қосамыз, содан кейін кері байланыс негізінде жобаны дамытамыз.',
      faq4_q:'Бастау үшін не беру керек?',
      faq4_a:'Бизнесті қысқаша сипаттау, қызметтер немесе тауарлар тізімі, байланыс деректері және ұнайтын үлгілер. Материалдар жоқ болса, құрылым мен мәтіндерді жинауға көмектесеміз.',

      contact_eyebrow:'Жобаны бастау',
      contact_h2:'Нені жақсарту керектігін айтыңыз',
      contact_p:'Жауап беріп, бірінші жұмыс нұсқасын ұсынамыз және мерзімдер мен баға бойынша бағдар береміз.',
      form_name:'Сіздің атыңыз', form_name_ph:'Сізге қалай хабарласуға болады',
      form_phone:'Телефон немесе WhatsApp', form_phone_ph:'+7 ...',
      form_service:'Не істеу керек', form_service_ph:'Негізгі өнімді таңдаңыз',
      form_msg:'Тапсырма туралы қысқаша', form_msg_ph:'Мысалы: компания сайты және өтініштерді өңдеуге арналған кабинет керек',
      form_submit:'WhatsApp-қа жіберу →',
      form_note:'Форма дайын хабарламамен WhatsApp-ты ашады. Растамасаңыз ештеңе жіберілмейді.',

      footer:'© 2026 Alsat Digital · Қазақстан · Қашықтан жұмыс',

      ai_greeting:'Сәлеметсіздер ме, мен Мансурмын. Тек шешім ұсынып қана қоймаймын, осы жерде сіздің саланыздағы тірі сайтты да көрсете аламын. Не сатқыңыз немесе автоматтандырғыңыз келеді?',
      ai_placeholder:'Сұрағыңызды жазыңыз…',
      ai_chip1:'Сайт қанша тұрады?',
      ai_chip2:'Тапсырмашы керек',
      ai_chip3:'Telegram-бот қалаймын',
      ai_launcher:'Мансурға сұрау',
      ai_fallback:'Адам керек пе? WhatsApp-та жазыңыз',
      ai_online:'ЖИ қазір жауап береді',
    },

    en: {
      nav_services: 'Services',
      nav_tasks: 'Task boards',
      nav_cases: 'Projects',
      nav_process: 'How we work',
      nav_prices: 'Pricing',
      nav_cta: 'Discuss a project',
      nav_menu: 'Menu',

      m1:'Websites & apps', m2:'Greenhouses & farms', m3:'Garages & homes',
      m4:'Construction', m5:'Workshops & warehouses', m6:'AI & robotics', m7:'CRM & task boards',

      proof1_h:'100% online', proof1_s:'Calls, approvals and launch',
      proof2_h:'1 point of contact', proof2_s:'No handoffs between contractors',
      proof3_h:'Clear milestones', proof3_s:'See what\'s done and what\'s next',
      proof4_h:'After launch', proof4_s:'Project support and growth',

      services_eyebrow:'Four core products',
      services_h2:'Choose results, not a tech stack',
      services_p:'We start with a clear turnkey solution. Then it can be deepened and grown as your business scales.',
      s1_h3:'Business online',
      s1_p:'Website, domain, corporate email, analytics and key platforms — everything you need to properly launch your company online.',
      s2_h3:'AI consultant + Telegram',
      s2_p:'An assistant answers customers 24/7 on your site, clarifies requests and forwards ready leads to the owner via Telegram.',
      s3_h3:'Task board / mini-CRM',
      s3_p:'A simple workspace for clients, requests, staff and deadlines — without an overloaded all-purpose CRM.',
      s4_h3:'Remote tech department',
      s4_p:'We handle websites, domains, email, bots, backups and small improvements instead of an in-house specialist.',
      depth_eyebrow:'Go deeper',
      depth_h3:'We extend the foundation with the capabilities you need',
      depth_p:'No need to order everything at once. Open a category to see which features can be added in the next phase.',
      depth1:'Growing your online presence',
      depth2:'AI, Telegram and documents',
      depth3:'Sales and internal processes',
      depth4:'Support and security',

      tasks_eyebrow:'Task boards for your workflow',
      tasks_h2:'Order instead of spreadsheets and messages',
      tasks_p:'We\'ll build a simple workspace where requests don\'t get lost, staff see their tasks and the manager sees deadlines and results.',

      cases_eyebrow:'Ready-made solutions',
      cases_h2:'See demos before ordering',
      cases_p:'Ready-made websites show a possible project foundation. They can be purchased, redesigned, extended with features and adapted to the buyer\'s needs.',

      proc_eyebrow:'Remote work',
      proc_h2:'A clear process without daily calls',
      proc_p:'You\'re involved only where a decision needs to be made. We handle the rest and show progress at each stage.',
      proc1_h3:'Short brief', proc1_p:'We clarify who you sell to and what processes need to be simplified.',
      proc2_h3:'Plan & estimate', proc2_p:'We fix the scope, timeline, price and completion criteria for the first version.',
      proc3_h3:'Development', proc3_p:'We share progress via link and collect feedback.',
      proc4_h3:'Launch', proc4_p:'We connect domain, analytics, hand over access and stay in touch.',

      prices_eyebrow:'Pricing guidance',
      prices_h2:'Four clear ways to start',
      prices_p:'We choose a core product, lock in a first version, and only then add the capabilities you need.',
      p1_name:'Company launch', p1_btn:'Discuss launch',
      p2_name:'Works 24/7', p2_btn:'Connect AI',
      p3_name:'For your process', p3_btn:'Describe your task',
      p4_name:'Subscription', p4_btn:'Get terms',

      faq_eyebrow:'Questions',
      faq_h2:'Before we start',
      faq1_q:'Can we work fully remotely?',
      faq1_a:'Yes. Brief, demos, approvals and project handover all happen online. We communicate via Telegram, WhatsApp or video call.',
      faq2_q:'Who owns the website and domain?',
      faq2_a:'You do. Domains and main services are registered in the business owner\'s name and all access is handed over after launch.',
      faq3_q:'Can we start with a small version?',
      faq3_a:'That\'s the preferred approach. We launch the features that deliver value first, then grow the project based on feedback.',
      faq4_q:'What do we need to provide to start?',
      faq4_a:'A short business description, list of services or products, contacts and examples you like. If you have no materials, we\'ll help you build the structure and content.',

      contact_eyebrow:'Start a project',
      contact_h2:'Tell us what needs to improve',
      contact_p:'We\'ll respond, propose a first working version and give you a timeline and cost estimate.',
      form_name:'Your name', form_name_ph:'What should we call you',
      form_phone:'Phone or WhatsApp', form_phone_ph:'+7 ...',
      form_service:'What needs to be done', form_service_ph:'Select a core product',
      form_msg:'Brief description', form_msg_ph:'E.g. need a company website and a request management dashboard',
      form_submit:'Send via WhatsApp →',
      form_note:'The form will open WhatsApp with a ready message. Nothing is sent without your confirmation.',

      footer:'© 2026 Alsat Digital · Kazakhstan · Working remotely',

      ai_greeting:'Hello, I\'m Mansur. I can not only find the right solution for you, but also show you a live website for your niche right here. What do you want to sell or automate?',
      ai_placeholder:'Type your question…',
      ai_chip1:'How much does a website cost?',
      ai_chip2:'I need a task board',
      ai_chip3:'I want a Telegram bot',
      ai_launcher:'Ask Mansur',
      ai_fallback:'Need a human? Write on WhatsApp',
      ai_online:'AI is answering now',
    }
  };

  // ─── Текущий язык ──────────────────────────────────────────────────────
  const LANGS = ['ru', 'kz', 'en'];
  const LABELS = { ru: 'РУС', kz: 'ҚАЗ', en: 'ENG' };

  function getLang() {
    const stored = localStorage.getItem('alsat_lang');
    if (stored && LANGS.includes(stored)) return stored;
    const browser = (navigator.language || '').toLowerCase();
    if (browser.startsWith('kk') || browser.startsWith('kz')) return 'kz';
    if (!browser.startsWith('ru')) return 'en';
    return 'ru';
  }

  function setLang(lang) {
    localStorage.setItem('alsat_lang', lang);
    applyLang(lang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  // ─── Применить переводы ────────────────────────────────────────────────
  function applyLang(lang) {
    const t = T[lang];
    if (!t) return;

    document.documentElement.lang = lang === 'kz' ? 'kk' : lang;

    // Helpers
    const set = (el, text) => { if (el) el.textContent = text; };
    const setHTML = (el, html) => { if (el) el.innerHTML = html; };
    const q = (s) => document.querySelector(s);
    const qa = (s) => [...document.querySelectorAll(s)];

    // ── Навигация ──
    const navA = qa('#nav a');
    navA.forEach(a => {
      const href = a.getAttribute('href');
      if (href === '#services') set(a, t.nav_services);
      else if (href === '#tasks') set(a, t.nav_tasks);
      else if (href === '#cases') set(a, t.nav_cases);
      else if (href === '#process') set(a, t.nav_process);
      else if (href === '#prices') set(a, t.nav_prices);
      else if (href === '#contact') set(a, t.nav_cta);
    });
    set(q('#menuButton'), t.nav_menu);

    // ── Бегущая строка ──
    const spans = qa('.capability-track span');
    const texts = [t.m1,t.m2,t.m3,t.m4,t.m5,t.m6,t.m7];
    spans.forEach((s, i) => set(s, texts[i % texts.length]));

    // ── Proof bar ──
    const proofs = qa('.proof');
    const pd = [
      [t.proof1_h, t.proof1_s],[t.proof2_h, t.proof2_s],
      [t.proof3_h, t.proof3_s],[t.proof4_h, t.proof4_s]
    ];
    proofs.forEach((p, i) => {
      if (!pd[i]) return;
      const strong = p.querySelector('strong');
      const span = p.querySelector('span');
      set(strong, pd[i][0]);
      set(span, pd[i][1]);
    });

    // ── Services ──
    const svc = q('#services');
    if (svc) {
      set(svc.querySelector('.eyebrow'), t.services_eyebrow);
      set(svc.querySelector('.section-head h2'), t.services_h2);
      set(svc.querySelector('.section-head p'), t.services_p);
      const cards = svc.querySelectorAll('.service-card');
      const sd = [[t.s1_h3,t.s1_p],[t.s2_h3,t.s2_p],[t.s3_h3,t.s3_p],[t.s4_h3,t.s4_p]];
      cards.forEach((c, i) => {
        if (!sd[i]) return;
        set(c.querySelector('h3'), sd[i][0]);
        set(c.querySelector('p'), sd[i][1]);
      });
      const dh = svc.querySelector('.depth-head');
      if (dh) {
        set(dh.querySelector('.eyebrow'), t.depth_eyebrow);
        set(dh.querySelector('h3'), t.depth_h3);
        set(dh.querySelector('p'), t.depth_p);
      }
      const details = svc.querySelectorAll('.depth-card summary');
      [t.depth1,t.depth2,t.depth3,t.depth4].forEach((txt, i) => set(details[i], txt));
    }

    // ── Tasks ──
    const tasks = q('#tasks');
    if (tasks) {
      set(tasks.querySelector('.eyebrow'), t.tasks_eyebrow);
      set(tasks.querySelector('h2'), t.tasks_h2);
      set(tasks.querySelector('.lead'), t.tasks_p);
    }

    // ── Cases ──
    const cases = q('#cases');
    if (cases) {
      set(cases.querySelector('.eyebrow'), t.cases_eyebrow);
      set(cases.querySelector('.section-head h2'), t.cases_h2);
      set(cases.querySelector('.section-head p'), t.cases_p);
    }

    // ── Process ──
    const proc = q('#process');
    if (proc) {
      set(proc.querySelector('.eyebrow'), t.proc_eyebrow);
      set(proc.querySelector('.section-head h2'), t.proc_h2);
      set(proc.querySelector('.section-head p'), t.proc_p);
      const steps = proc.querySelectorAll('.process-step');
      const sd = [[t.proc1_h3,t.proc1_p],[t.proc2_h3,t.proc2_p],[t.proc3_h3,t.proc3_p],[t.proc4_h3,t.proc4_p]];
      steps.forEach((s, i) => {
        if (!sd[i]) return;
        set(s.querySelector('h3'), sd[i][0]);
        set(s.querySelector('p'), sd[i][1]);
      });
    }

    // ── Prices ──
    const prices = q('#prices');
    if (prices) {
      set(prices.querySelector('.eyebrow'), t.prices_eyebrow);
      set(prices.querySelector('.section-head h2'), t.prices_h2);
      set(prices.querySelector('.section-head p'), t.prices_p);
      const cards = prices.querySelectorAll('.price-card');
      const pd = [
        [t.p1_name,t.p1_btn],[t.p2_name,t.p2_btn],
        [t.p3_name,t.p3_btn],[t.p4_name,t.p4_btn]
      ];
      cards.forEach((c, i) => {
        if (!pd[i]) return;
        set(c.querySelector('.price-name'), pd[i][0]);
        set(c.querySelector('a'), pd[i][1]);
      });
    }

    // ── FAQ ──
    const faq = q('.faq');
    if (faq) {
      set(faq.querySelector('.eyebrow'), t.faq_eyebrow);
      set(faq.querySelector('h2'), t.faq_h2);
      const qs = faq.querySelectorAll('.question');
      const qd = [
        [t.faq1_q,t.faq1_a],[t.faq2_q,t.faq2_a],
        [t.faq3_q,t.faq3_a],[t.faq4_q,t.faq4_a]
      ];
      qs.forEach((q, i) => {
        if (!qd[i]) return;
        const btn = q.querySelector('button span:first-child');
        const ans = q.querySelector('.answer p');
        set(btn, qd[i][0]);
        set(ans, qd[i][1]);
      });
    }

    // ── Contact ──
    const contact = q('#contact');
    if (contact) {
      set(contact.querySelector('.eyebrow'), t.contact_eyebrow);
      set(contact.querySelector('.contact-copy h2'), t.contact_h2);
      set(contact.querySelector('.contact-copy > p'), t.contact_p);
      const lbl = (id) => contact.querySelector(`label[for="${id}"]`);
      const inp = (id) => contact.querySelector(`#${id}`);
      set(lbl('name'), t.form_name);   if (inp('name')) inp('name').placeholder = t.form_name_ph;
      set(lbl('phone'), t.form_phone); if (inp('phone')) inp('phone').placeholder = t.form_phone_ph;
      set(lbl('service'), t.form_service);
      const svc = inp('service');
      if (svc && svc.options[0]) svc.options[0].textContent = t.form_service_ph;
      set(lbl('message'), t.form_msg); if (inp('message')) inp('message').placeholder = t.form_msg_ph;
      set(contact.querySelector('.submit'), t.form_submit);
      set(contact.querySelector('.form-note'), t.form_note);
    }

    // ── Footer ──
    const foot = q('footer .footer-row > div:first-child');
    if (foot) foot.textContent = t.footer;
    const footLinks = qa('footer .footer-links a');
    if (footLinks[0]) footLinks[0].textContent = t.nav_services;
    if (footLinks[1]) footLinks[1].textContent = t.nav_cases;
    if (footLinks[2]) footLinks[2].textContent = t.nav_cta.split(' ')[0]; // "Контакты"

    // ── AI chat widget ──
    const firstMsg = q('#aiMessages .ai-message');
    set(firstMsg, t.ai_greeting);
    const inp2 = q('#aiInput');
    if (inp2) inp2.placeholder = t.ai_placeholder;
    const chips = qa('#aiChips .ai-chip');
    if (chips[0]) chips[0].textContent = t.ai_chip1;
    if (chips[1]) chips[1].textContent = t.ai_chip2;
    if (chips[2]) chips[2].textContent = t.ai_chip3;
    set(q('#aiLauncher span:last-child'), t.ai_launcher);
    set(q('.ai-fallback'), t.ai_fallback);
    const aiOnline = q('.ai-title span');
    set(aiOnline, t.ai_online);
  }

  // ─── Переключатель языков ─────────────────────────────────────────────
  function injectSwitcher() {
    const nav = document.querySelector('#nav');
    if (!nav) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'lang-switcher';
    wrapper.style.cssText = 'display:flex;gap:4px;margin-left:8px;';

    LANGS.forEach(lang => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-btn';
      btn.dataset.lang = lang;
      btn.textContent = LABELS[lang];
      btn.style.cssText = [
        'padding:5px 9px',
        'border-radius:8px',
        'font-size:11px',
        'font-weight:700',
        'letter-spacing:.04em',
        'border:1px solid rgba(184,213,240,.18)',
        'background:rgba(255,255,255,.04)',
        'color:#bdcad7',
        'cursor:pointer',
        'transition:all .2s',
      ].join(';');
      btn.addEventListener('click', () => setLang(lang));
      btn.addEventListener('mouseenter', () => {
        if (!btn.classList.contains('active')) {
          btn.style.color = 'white';
          btn.style.background = 'rgba(255,255,255,.09)';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (!btn.classList.contains('active')) {
          btn.style.color = '#bdcad7';
          btn.style.background = 'rgba(255,255,255,.04)';
        }
      });
      wrapper.appendChild(btn);
    });

    // Active style injection
    const style = document.createElement('style');
    style.textContent = `.lang-btn.active{color:#fff!important;background:rgba(92,184,255,.18)!important;border-color:rgba(92,184,255,.4)!important;}`;
    document.head.appendChild(style);

    nav.appendChild(wrapper);
  }

  // ─── Инициализация ─────────────────────────────────────────────────────
  function init() {
    injectSwitcher();
    const lang = getLang();
    setLang(lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
