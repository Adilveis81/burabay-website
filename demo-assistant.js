(() => {
  if (window.__alsatDemoAssistant) return;
  window.__alsatDemoAssistant = true;

  const PERSONAS = {
    aliya: { name: 'Алия', image: 'aliya.jpg', accent: '#ff8da6', glow: '#ffb06b', role: 'AI-гид' },
    daniyar: { name: 'Данияр', image: 'daniyar.jpg', accent: '#48b8ff', glow: '#5978ff', role: 'AI-архитектор' },
    aida: { name: 'Аида', image: 'aida.jpg', accent: '#b77cff', glow: '#ff72c6', role: 'AI-креатор' },
    timur: { name: 'Тимур', image: 'timur.jpg', accent: '#38e0bd', glow: '#42a5ff', role: 'AI-консультант' },
  };

  const PRESETS = {
    fashion: ['Fashion Atelier', 'магазин одежды', 'aliya', ['Подобрать образ', 'Усилить продажи', 'Показать каталог']],
    beauty: ['Élan Beauty', 'салон красоты', 'aliya', ['Подобрать услугу', 'Онлайн-запись', 'Программа лояльности']],
    dental: ['Forma Dental', 'стоматология', 'daniyar', ['План лечения', 'Запись на приём', 'Автоматизация клиники']],
    restaurant: ['TERRA', 'ресторан', 'aida', ['Подобрать меню', 'Забронировать стол', 'Автоматизация заказов']],
    construction: ['MONOLITH', 'строительство', 'daniyar', ['Рассчитать проект', 'Контроль стройки', 'Показать этапы']],
    realty: ['NOVA Realty', 'недвижимость', 'daniyar', ['Подобрать объект', 'Оценить идею', 'Автоматизация заявок']],
    hotel: ['AQBULAQ', 'отель и туризм', 'aliya', ['Выбрать формат отдыха', 'Показать бронирование', 'Собрать маршрут']],
    fitness: ['PULSE', 'фитнес', 'timur', ['Подобрать программу', 'Записаться', 'Автоматизация клуба']],
    education: ['QADAM Lab', 'образование', 'aida', ['Подобрать курс', 'Пробный урок', 'Личный кабинет']],
    logistics: ['JETLINE', 'логистика', 'daniyar', ['Рассчитать маршрут', 'Контроль доставки', 'Автоматизация заявок']],
    autoservice: ['TORQUE', 'автосервис', 'timur', ['Записаться в сервис', 'Статус ремонта', 'Автоматизация СТО']],
    agro: ['DALA', 'агробизнес', 'aida', ['Открыть каталог', 'Оптовая заявка', 'Автоматизация хозяйства']],
    legal: ['PRINCIPLE', 'юридические услуги', 'timur', ['Разобрать задачу', 'Подобрать услугу', 'Автоматизация документов']],
    events: ['MOMENT', 'организация событий', 'aliya', ['Собрать концепцию', 'Рассчитать событие', 'Показать портфолио']],
    expert: ['AIDANA', 'экспертные услуги', 'aida', ['Разобрать цель', 'Подобрать формат', 'Упаковать экспертизу']],
    pet: ['WOOF!', 'товары для животных', 'aida', ['Подобрать товар', 'Повторный заказ', 'Автоматизация магазина']],
    wellness: ['VITA Circle', 'wellness-сообщество', 'aliya', ['Подобрать продукт', 'Путь партнёра', 'Автоматизация сети']],
    'cosmetics-network': ['LUMIÈRE', 'партнёрский beauty-бизнес', 'aliya', ['Открыть коллекцию', 'Кабинет партнёра', 'Развитие сети']],
    'saas-partners': ['NEXUS Cloud', 'партнёрская SaaS-платформа', 'timur', ['Показать платформу', 'Путь партнёра', 'Контроль сделок']],
    'b2b-partners': ['ALLIANCE', 'B2B-партнёрская сеть', 'daniyar', ['Разобрать процесс', 'Регистрация лидов', 'Контроль сети']],
  };

  const PATHS = {
    'demo-realty.html': ['NOVA Realty', 'недвижимость', 'daniyar', ['Подобрать объект', 'Показать сценарий', 'Автоматизация заявок']],
    'marketplace.html': ['Алсат Межгород', 'междугородние перевозки', 'timur', ['Добавить маршрут', 'Показать приложение', 'Автоматизация диспетчера']],
    'jalga_v2.html': ['Jalga', 'задачник и мини-CRM', 'aida', ['Создать процесс', 'Распределить роли', 'Автоматизация задач']],
    'aquarium.html': ['Digital Aquarium', 'интерактивная визуализация', 'aliya', ['Показать возможности', 'Изменить сцену', 'Создать свою версию']],
    'driver-app.html': ['Алсат Водитель', 'приложение для водителей', 'daniyar', ['Принять заказ', 'Показать маршрут', 'Автоматизация рейсов']],
    'stock-chart.html': ['Market Vision', 'финансовая аналитика', 'timur', ['Разобрать график', 'Настроить панель', 'Автоматизация отчётов']],
    'videoproductionpack.html': ['AI Video Studio', 'видеопроизводство', 'aida', ['Собрать ролик', 'Подобрать формат', 'Автоматизация контента']],
    'showroom.html': ['Alsat Experience', 'интерактивный шоурум', 'aliya', ['Запустить сцену', 'Показать эффекты', 'Создать шоурум']],
    'showrooms.html': ['Alsat Showrooms', 'каталог демонстраций', 'aida', ['Подобрать нишу', 'Сравнить варианты', 'Создать свой сайт']],
    'business.html': ['Alsat Business', 'цифровые услуги', 'timur', ['Подобрать решение', 'Автоматизировать бизнес', 'Оценить первый этап']],
    'index-v2-showroom.html': ['Alsat Showroom', 'цифровые проекты', 'daniyar', ['Показать проекты', 'Собрать решение', 'Обсудить автоматизацию']],
  };

  const params = new URLSearchParams(location.search);
  const preset = params.get('preset') || '';
  const page = location.pathname.split('/').pop() || '';
  const config = PRESETS[preset] || PATHS[page] || ['Alsat Demo', document.title || 'цифровой проект', ['marketplace.html', 'stock-chart.html'].includes(page) ? 'timur' : 'aida', ['Показать возможности', 'Адаптировать проект', 'Добавить автоматизацию']];
  const [fallbackTitle, niche, personaKey, suggestions] = config;
  const persona = PERSONAS[personaKey];
  const siteTitle = (params.get('brand') || fallbackTitle).slice(0, 70);
  const avatarUrl = `/demo-assistants/${persona.image}`;
  const history = [];

  const host = document.createElement('div');
  host.id = 'alsat-demo-assistant';
  host.style.setProperty('--da-accent', persona.accent);
  host.style.setProperty('--da-glow', persona.glow);
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host{all:initial;--kbd:0px}*{box-sizing:border-box}.launcher,.panel,button,input{font-family:Inter,Manrope,system-ui,-apple-system,sans-serif}.launcher{position:fixed;right:18px;bottom:calc(18px + var(--kbd));z-index:2147483000;display:flex;align-items:center;gap:10px;max-width:260px;padding:7px 14px 7px 7px;border:1px solid color-mix(in srgb,var(--da-accent) 48%,white 12%);border-radius:999px;background:rgba(7,13,27,.9);color:#fff;box-shadow:0 16px 60px rgba(0,0,0,.38),0 0 38px color-mix(in srgb,var(--da-accent) 30%,transparent);backdrop-filter:blur(18px);cursor:pointer;transition:.3s transform,.3s opacity}.launcher:hover{transform:translateY(-3px)}.launcher.hidden{opacity:0;pointer-events:none;transform:translateY(12px)}.launcher-photo{position:relative;width:52px;height:52px;flex:0 0 auto;border-radius:50%;padding:2px;background:linear-gradient(135deg,var(--da-accent),var(--da-glow));box-shadow:0 0 0 5px color-mix(in srgb,var(--da-accent) 13%,transparent)}.launcher-photo:before,.launcher-photo:after{content:"";position:absolute;inset:-7px;border:1px solid color-mix(in srgb,var(--da-accent) 55%,transparent);border-radius:50%;animation:daPulse 2.4s ease-out infinite}.launcher-photo:after{animation-delay:1.2s}.launcher img,.head img,.core img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}.launcher b{display:block;font-size:13px;line-height:1.2}.launcher small{display:block;margin-top:3px;color:#a8bfd8;font-size:10px;white-space:nowrap}.online{width:8px;height:8px;border-radius:50%;background:#48f0ad;box-shadow:0 0 12px #48f0ad;margin-left:2px}
      .panel{position:fixed;right:18px;bottom:calc(18px + var(--kbd));z-index:2147483001;width:min(410px,calc(100vw - 28px));height:min(670px,calc(100dvh - 36px));display:grid;grid-template-rows:auto 205px minmax(120px,1fr) auto auto;overflow:hidden;border:1px solid color-mix(in srgb,var(--da-accent) 36%,white 7%);border-radius:28px;background:linear-gradient(160deg,rgba(7,12,26,.975),rgba(12,19,39,.97));color:#eef7ff;box-shadow:0 32px 100px rgba(0,0,0,.52),0 0 70px color-mix(in srgb,var(--da-accent) 18%,transparent);backdrop-filter:blur(28px);opacity:0;pointer-events:none;transform:translateY(18px) scale(.97);transform-origin:bottom right;transition:.32s cubic-bezier(.2,.8,.2,1)}.panel.open{opacity:1;pointer-events:auto;transform:none}.head{height:66px;display:flex;align-items:center;gap:11px;padding:10px 13px;border-bottom:1px solid rgba(255,255,255,.08)}.head-photo{width:44px;height:44px;padding:2px;border-radius:50%;background:linear-gradient(135deg,var(--da-accent),var(--da-glow))}.head-copy{min-width:0;flex:1}.head b{display:block;font-size:13px}.head span{display:flex;align-items:center;gap:6px;margin-top:3px;color:#8da7c2;font-size:10px}.head span:before{content:"";width:6px;height:6px;border-radius:50%;background:#45eeb1;box-shadow:0 0 8px #45eeb1}.close{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.07);color:#d7e7f6;font-size:20px;cursor:pointer}.viz{position:relative;overflow:hidden;border-bottom:1px solid rgba(255,255,255,.08);background:radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--da-accent) 16%,transparent),transparent 66%)}canvas{position:absolute;inset:0;width:100%;height:100%}.orbit{position:absolute;left:50%;top:49%;width:120px;height:120px;transform:translate(-50%,-50%);border:1px solid color-mix(in srgb,var(--da-accent) 48%,transparent);border-radius:50%;animation:daSpin 16s linear infinite}.orbit:before,.orbit:after{content:"";position:absolute;inset:13px;border:1px dashed color-mix(in srgb,var(--da-glow) 42%,transparent);border-radius:50%;animation:daSpin 10s linear infinite reverse}.orbit:after{inset:-22px;border-style:solid;opacity:.42}.core{position:absolute;left:50%;top:49%;width:76px;height:76px;transform:translate(-50%,-50%);padding:3px;border-radius:50%;background:linear-gradient(135deg,var(--da-accent),var(--da-glow));box-shadow:0 0 45px color-mix(in srgb,var(--da-accent) 50%,transparent)}.viz-label{position:absolute;left:12px;top:10px;max-width:180px}.viz-label small{display:block;color:var(--da-accent);font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.viz-label b{display:block;margin-top:4px;font-size:12px}.nodes{position:absolute;inset:0;pointer-events:none}.node{position:absolute;max-width:128px;padding:6px 8px;border:1px solid color-mix(in srgb,var(--da-accent) 32%,white 6%);border-radius:10px;background:rgba(8,16,34,.78);box-shadow:0 8px 24px rgba(0,0,0,.24);font-size:9px;line-height:1.25;animation:daIn .45s both}.node:nth-child(1){left:12px;top:67px}.node:nth-child(2){right:12px;top:47px}.node:nth-child(3){left:18px;bottom:15px}.node:nth-child(4){right:14px;bottom:13px}.node i{font-style:normal;margin-right:4px}.node small{display:block;color:#7f9bb7;font-size:8px;margin-top:2px}.viz.thinking .core{animation:daThink 1.15s ease-in-out infinite}.viz.thinking .orbit{animation-duration:2.8s}
      .messages{overflow:auto;padding:14px 13px 6px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent}.msg{display:flex;gap:8px;margin-bottom:11px;animation:daIn .3s both}.msg.user{justify-content:flex-end}.msg img{width:27px;height:27px;object-fit:cover;border-radius:50%;flex:0 0 auto}.bubble{max-width:82%;padding:9px 11px;border:1px solid rgba(255,255,255,.08);border-radius:15px 15px 15px 4px;background:rgba(255,255,255,.065);color:#dceafa;font-size:11px;line-height:1.48;white-space:pre-wrap}.user .bubble{border-color:color-mix(in srgb,var(--da-accent) 30%,transparent);border-radius:15px 15px 4px 15px;background:color-mix(in srgb,var(--da-accent) 18%,#111b32);color:#fff}.typing:after{content:"•••";letter-spacing:3px;animation:daBlink 1s infinite}.quick{display:flex;gap:6px;overflow:auto;padding:7px 13px 9px;scrollbar-width:none}.quick button{flex:0 0 auto;padding:7px 9px;border:1px solid color-mix(in srgb,var(--da-accent) 24%,white 5%);border-radius:999px;background:rgba(255,255,255,.045);color:#bcd0e4;font-size:9px;cursor:pointer}.form{display:flex;gap:7px;padding:10px 11px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,.08);background:rgba(3,8,18,.7)}input{min-width:0;flex:1;height:39px;padding:0 13px;border:1px solid rgba(255,255,255,.11);border-radius:13px;outline:0;background:rgba(255,255,255,.055);color:#fff;font-size:11px}input:focus{border-color:var(--da-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--da-accent) 12%,transparent)}.send{width:39px;height:39px;border:0;border-radius:13px;background:linear-gradient(135deg,var(--da-accent),var(--da-glow));color:#07101e;font-size:17px;font-weight:900;cursor:pointer}.send:disabled{opacity:.45}
      @keyframes daPulse{to{transform:scale(1.32);opacity:0}}@keyframes daSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes daThink{50%{transform:translate(-50%,-50%) scale(1.07);filter:brightness(1.2)}}@keyframes daIn{from{opacity:0;transform:translateY(8px)}}@keyframes daBlink{50%{opacity:.25}}
      @media(max-width:700px){.launcher{right:10px;bottom:calc(10px + var(--kbd));max-width:220px}.launcher-photo{width:46px;height:46px}.panel{right:7px;bottom:calc(7px + var(--kbd));width:calc(100vw - 14px);height:min(74dvh,620px);border-radius:22px;grid-template-rows:auto 160px minmax(100px,1fr) auto auto}.node{max-width:105px;font-size:8px}.viz-label{top:7px}.head{height:58px}.head-photo{width:38px;height:38px}.core{width:64px;height:64px}.orbit{width:103px;height:103px}}
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
    </style>
    <button class="launcher" type="button" aria-label="Открыть ИИ-консультанта ${persona.name}">
      <span class="launcher-photo"><img src="${avatarUrl}" alt=""></span>
      <span><b>${persona.name} · ${persona.role}</b><small>Спросите про этот проект</small></span><i class="online"></i>
    </button>
    <section class="panel" role="dialog" aria-label="ИИ-консультант ${persona.name}">
      <header class="head"><span class="head-photo"><img src="${avatarUrl}" alt=""></span><span class="head-copy"><b>${persona.name} · ${siteTitle}</b><span>на связи · визуализация включена</span></span><button class="close" type="button" aria-label="Свернуть">×</button></header>
      <div class="viz"><canvas></canvas><div class="viz-label"><small>Live AI visualization</small><b>Возможности проекта</b></div><div class="orbit"></div><div class="core"><img src="${avatarUrl}" alt=""></div><div class="nodes"></div></div>
      <div class="messages"></div>
      <div class="quick">${suggestions.map(text => `<button type="button">${text}</button>`).join('')}</div>
      <form class="form"><input maxlength="1200" autocomplete="off" placeholder="Спросите ${persona.name}…"><button class="send" type="submit" aria-label="Отправить">↑</button></form>
    </section>`;

  const $ = selector => root.querySelector(selector);
  const launcher = $('.launcher');
  const panel = $('.panel');
  const messages = $('.messages');
  const input = $('input');
  const sendButton = $('.send');
  const viz = $('.viz');
  const vizTitle = $('.viz-label b');
  const nodes = $('.nodes');
  let busy = false;

  function setOpen(open) {
    panel.classList.toggle('open', open);
    launcher.classList.toggle('hidden', open);
    if (open && matchMedia('(pointer:fine)').matches) setTimeout(() => input.focus({ preventScroll: true }), 250);
  }

  function message(role, text, typing = false) {
    const row = document.createElement('div');
    row.className = `msg ${role}`;
    if (role !== 'user') row.innerHTML = `<img src="${avatarUrl}" alt=""><div class="bubble${typing ? ' typing' : ''}"></div>`;
    else row.innerHTML = '<div class="bubble"></div>';
    row.querySelector('.bubble').textContent = text;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row.querySelector('.bubble');
  }

  function initialNodes() {
    nodes.innerHTML = suggestions.slice(0, 4).map((label, index) => `<span class="node" style="animation-delay:${index * .08}s"><i>${['✦','◈','⌁','◎'][index]}</i>${label}<small>${['идея','интерфейс','процесс','результат'][index]}</small></span>`).join('');
  }

  function renderDiagram(spec) {
    if (!spec) return initialNodes();
    const list = spec.type === 'map' ? spec.branches : spec.nodes;
    if (!Array.isArray(list)) return initialNodes();
    vizTitle.textContent = spec.title || 'Схема решения';
    nodes.innerHTML = list.slice(0, 4).map((item, index) => `<span class="node" style="animation-delay:${index * .08}s"><i>${item.icon || '✦'}</i>${escapeHtml(item.label || '')}<small>${escapeHtml(item.sub || '')}</small></span>`).join('');
  }

  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  async function getDiagram(question) {
    try {
      const response = await fetch('/api/diagram', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: `${niche}: ${question}` }) });
      if (!response.ok) return null;
      return (await response.json()).spec || null;
    } catch { return null; }
  }

  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    sendButton.disabled = true;
    message('user', text);
    input.value = '';
    viz.classList.add('thinking');
    vizTitle.textContent = 'Собираю решение…';
    nodes.innerHTML = '';
    const pending = message('assistant', '', true);
    const diagramPromise = getDiagram(text);

    try {
      const response = await fetch('/api/amir', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-6), persona: personaKey, site: siteTitle, niche }),
      });
      pending.classList.remove('typing');
      if (!response.ok || !response.body) throw new Error('AI unavailable');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', answer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const chunk = JSON.parse(raw);
            const delta = chunk?.choices?.[0]?.delta?.content || chunk?.delta?.text || '';
            if (delta) { answer += delta; pending.textContent = answer.trim(); messages.scrollTop = messages.scrollHeight; }
          } catch {}
        }
      }
      if (!answer.trim()) pending.textContent = 'Я готов помочь с этим проектом. Уточните, какой результат для вас сейчас самый важный?';
      history.push({ role: 'user', content: text }, { role: 'assistant', content: answer.trim() });
      renderDiagram(await diagramPromise);
    } catch {
      pending.classList.remove('typing');
      pending.textContent = 'Связь с ИИ временно прервалась. Попробуйте отправить вопрос ещё раз.';
      initialNodes();
    } finally {
      viz.classList.remove('thinking');
      busy = false;
      sendButton.disabled = false;
    }
  }

  launcher.addEventListener('click', () => setOpen(true));
  $('.close').addEventListener('click', () => setOpen(false));
  $('.form').addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  root.querySelectorAll('.quick button').forEach(button => button.addEventListener('click', () => ask(button.textContent)));
  initialNodes();
  message('assistant', `Здравствуйте! Я ${persona.name}. Покажу, как работает «${siteTitle}», и прямо здесь соберу визуальную схему под вашу задачу. Что хотите улучшить или автоматизировать?`);

  const canvas = $('canvas');
  const context = canvas.getContext('2d');
  let particles = [];
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = rect.width * ratio; canvas.height = rect.height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: 28 }, () => ({ x: Math.random() * rect.width, y: Math.random() * rect.height, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, r: Math.random() * 1.7 + .4 }));
  }
  function animate() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    context.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      particle.x += particle.vx * (busy ? 2.2 : 1); particle.y += particle.vy * (busy ? 2.2 : 1);
      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;
      context.fillStyle = index % 2 ? persona.accent : persona.glow;
      context.globalAlpha = .36; context.beginPath(); context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2); context.fill();
      particles.slice(index + 1).forEach(other => {
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance < 64) { context.globalAlpha = (1 - distance / 64) * .12; context.strokeStyle = persona.accent; context.beginPath(); context.moveTo(particle.x, particle.y); context.lineTo(other.x, other.y); context.stroke(); }
      });
    });
    context.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  resizeCanvas();
  new ResizeObserver(resizeCanvas).observe(canvas);
  if (!matchMedia('(prefers-reduced-motion:reduce)').matches) requestAnimationFrame(animate);

  if (window.visualViewport) {
    const updateKeyboard = () => host.style.setProperty('--kbd', `${Math.max(0, innerHeight - visualViewport.height - visualViewport.offsetTop)}px`);
    visualViewport.addEventListener('resize', updateKeyboard);
    visualViewport.addEventListener('scroll', updateKeyboard);
  }
  if (matchMedia('(min-width:1000px) and (pointer:fine)').matches) setTimeout(() => setOpen(true), 1200);
})();
