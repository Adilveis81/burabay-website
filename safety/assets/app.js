(() => {
  'use strict';

  const translations = {
    ru: {
      navPlatform: 'Платформа', navCourses: 'Направления', navImplementation: 'Внедрение', navDemo: 'Получить демонстрацию',
      heroEyebrow: 'Для предприятий Казахстана', heroTitle: 'Обучение и контроль промышленной безопасности сотрудников в одной системе',
      heroLead: 'Назначайте курсы и инструктажи, контролируйте сроки, результаты и повторное обучение без разрозненных таблиц.',
      ctaDemo: 'Получить демонстрацию', ctaPrice: 'Рассчитать стоимость', point1: 'Единая история обучения',
      point2: 'Контроль сроков по подразделениям', point3: 'Доступ с компьютера и телефона'
    },
    kk: {
      navPlatform: 'Платформа', navCourses: 'Бағыттар', navImplementation: 'Енгізу', navDemo: 'Демонстрация алу',
      heroEyebrow: 'Қазақстан кәсіпорындары үшін', heroTitle: 'Қызметкерлерді өнеркәсіптік қауіпсіздікке оқыту және бақылау — бір жүйеде',
      heroLead: 'Курстар мен нұсқамаларды тағайындаңыз, мерзімдерді, нәтижелерді және қайталап оқытуды бөлек кестелерсіз бақылаңыз.',
      ctaDemo: 'Демонстрация алу', ctaPrice: 'Құнын есептеу', point1: 'Оқытудың бірыңғай тарихы',
      point2: 'Бөлімшелер бойынша мерзімдерді бақылау', point3: 'Компьютер мен телефоннан қолжетімді'
    }
  };

  const panels = {
    assign: ['Назначение обучения', 'Назначьте обязательный набор по роли и подразделению', 'Новый сотрудник получает нужные материалы по выбранной программе. Ответственный видит дату назначения и текущий статус.', ['Вводный инструктаж|100%', 'Электробезопасность|40%', 'Первая помощь|не начато']],
    progress: ['Прогресс и тесты', 'Понимайте, кто изучил материал и как прошёл проверку', 'Результаты собраны в карточке сотрудника. Ответственный может быстро найти незавершённое обучение и повторные попытки.', ['Пройдено материалов|7 из 9', 'Средний результат|86%', 'Ожидает проверки|1 тест']],
    deadlines: ['Сроки и уведомления', 'Работайте с приближающимися сроками заранее', 'Система выделяет записи, которые требуют внимания, и формирует список для ответственных. Периодичность задаётся по правилам компании.', ['Истекает за 30 дней|12', 'Просрочено|3', 'Назначено повторно|8']],
    reports: ['Отчёты и сертификаты', 'Формируйте внутреннюю картину по подразделениям', 'Фильтры помогают подготовить внутренний отчёт по сотрудникам, курсам, срокам и результатам. Сертификаты в демо имеют только внутренний статус.', ['Сотрудники|248', 'Подразделения|6', 'Внутренние сертификаты|219']],
    materials: ['Материалы компании', 'Используйте собственные инструкции и программы', 'В проектной версии материалы компании распределяются по направлениям и ролям. ИИ может помогать с объяснением и черновиками тестов, но не принимает юридически значимых решений.', ['Инструкции|24', 'Учебные модули|18', 'Черновики тестов|на проверке']]
  };

  function track(event, properties = {}) {
    const payload = { event, page: location.pathname, timestamp: new Date().toISOString(), ...properties };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    window.dispatchEvent(new CustomEvent('alsat:analytics', { detail: payload }));
  }

  document.querySelectorAll('[data-track]').forEach(element => {
    element.addEventListener('click', () => track(element.dataset.track, { label: element.textContent.trim().slice(0, 80) }));
  });

  const observed = new Set();
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const event = entry.target.dataset.trackView;
      if (entry.isIntersecting && event && !observed.has(event)) {
        observed.add(event); track(event); observer.unobserve(entry.target);
      }
    });
  }, { threshold: .45 }) : null;
  document.querySelectorAll('[data-track-view]').forEach(element => observer?.observe(element));

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  menuButton?.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
    const lang = button.dataset.lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = translations[lang]?.[element.dataset.i18n];
      if (value) element.textContent = value;
    });
    localStorage.setItem('alsat-safety-language', lang);
    track('language_change', { language: lang });
  }));
  const savedLanguage = localStorage.getItem('alsat-safety-language');
  if (savedLanguage === 'kk') document.querySelector('[data-lang="kk"]')?.click();

  const panelTitle = document.querySelector('#panel-title');
  const panelStep = document.querySelector('#panel-step');
  const panelCopy = document.querySelector('#panel-copy');
  const panelItems = document.querySelector('#panel-items');
  document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => {
    const panel = panels[button.dataset.panel];
    if (!panel) return;
    document.querySelectorAll('[data-panel]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active); item.setAttribute('aria-selected', String(active));
    });
    panelStep.textContent = panel[0]; panelTitle.textContent = panel[1]; panelCopy.textContent = panel[2];
    panelItems.replaceChildren(...panel[3].map(value => {
      const [label, result] = value.split('|');
      const li = document.createElement('li'); li.append(label);
      const strong = document.createElement('b'); strong.textContent = result; li.append(strong); return li;
    }));
    track('feature_view', { feature: button.dataset.panel });
  }));

  document.querySelectorAll('[data-intent]').forEach(link => link.addEventListener('click', () => {
    const input = document.querySelector('input[name="intent"]');
    if (input) input.value = link.dataset.intent;
  }));

  const form = document.querySelector('#lead-form');
  const status = document.querySelector('#form-status');
  const startedAt = document.querySelector('#started-at');
  if (startedAt) startedAt.value = String(Date.now());
  let started = false;
  form?.addEventListener('input', () => {
    if (!started) { started = true; track('lead_form_start'); }
  }, { once: true });

  function showStatus(message, type) {
    status.textContent = message; status.className = `form-status ${type}`; status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    status.className = 'form-status'; status.textContent = '';
    const interests = form.querySelectorAll('input[name="interests"]:checked');
    if (!form.checkValidity() || interests.length === 0) {
      form.reportValidity();
      if (interests.length === 0) showStatus('Выберите хотя бы одно направление обучения.', 'error');
      track('lead_form_error', { kind: 'validation' }); return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Отправляем…';
    const data = Object.fromEntries(new FormData(form).entries());
    data.interests = [...interests].map(input => input.value);
    try {
      const response = await fetch(form.action, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Не удалось подтвердить доставку заявки.');
      form.reset(); startedAt.value = String(Date.now());
      showStatus('Заявка доставлена. Мы свяжемся с вами по указанному контакту.', 'success');
      track('lead_form_success', { intent: data.intent || 'demo', industry: data.industry, employees: data.employees });
    } catch (error) {
      showStatus(error.message || 'Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.', 'error');
      track('lead_form_error', { kind: 'network' });
    } finally {
      button.disabled = false; button.textContent = 'Отправить заявку';
    }
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
