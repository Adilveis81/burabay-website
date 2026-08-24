(() => {
  'use strict';
  const views = document.querySelectorAll('[data-view-content]');
  const navButtons = document.querySelectorAll('nav [data-view]');
  const sidebar = document.querySelector('#sidebar');
  const mobileMenu = document.querySelector('.mobile-menu');
  const role = document.querySelector('#role');
  const dialog = document.querySelector('#demo-dialog');
  const dialogTitle = document.querySelector('#dialog-title');

  function track(event, properties = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, page: 'demo_dashboard', timestamp: new Date().toISOString(), ...properties });
  }

  function showView(name) {
    views.forEach(view => view.classList.toggle('active', view.dataset.viewContent === name));
    navButtons.forEach(button => {
      const active = button.dataset.view === name;
      button.classList.toggle('active', active); button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    sidebar.classList.remove('open'); mobileMenu.setAttribute('aria-expanded', 'false');
    document.querySelector('#workspace').scrollTo?.({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', `#${name}`); track('demo_section_view', { section: name, role: role.value });
  }

  navButtons.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  mobileMenu.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open'); mobileMenu.setAttribute('aria-expanded', String(open));
  });
  role.addEventListener('change', () => {
    document.body.dataset.role = role.value; track('demo_role_change', { role: role.value });
    if (role.value === 'employee') showView('courses');
  });
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const labels = { assign: 'Назначение курса', employee: 'Добавление сотрудника', department: 'Добавление отдела', course: 'Создание курса', report: 'Формирование отчёта', repeat: 'Повторное обучение' };
    dialogTitle.textContent = `${labels[button.dataset.action] || 'Действие'} доступно в рабочей версии`;
    dialog.showModal(); track('demo_action', { action: button.dataset.action });
  }));
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.querySelector('#current-date').textContent = new Intl.DateTimeFormat('ru-KZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const initial = location.hash.slice(1);
  if ([...views].some(view => view.dataset.viewContent === initial)) showView(initial);
  else track('demo_open', { section: 'overview' });
})();
