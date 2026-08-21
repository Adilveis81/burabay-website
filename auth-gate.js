(() => {
  if (window.AlsatAuth) return;

  const SUPABASE_URL = 'https://duscyiyxfmsriyhwlbqx.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';
  const isTopLevel = window.top === window.self;
  let client = null;
  let session = null;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  window.AlsatAuth = {
    ready,
    getSession: async () => { await ready; return session; },
    getAccessToken: async () => { await ready; return session?.access_token || ''; },
    getHeaders: async () => {
      await ready;
      return session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {};
    },
    signOut: async () => { if (client) await client.auth.signOut(); location.reload(); },
  };

  function loadSupabase() {
    if (window.supabase?.createClient) return Promise.resolve();
    const sources = [
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
      'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    ];
    const trySource = index => new Promise((resolve, reject) => {
      if (!sources[index]) return reject(new Error('Не удалось загрузить модуль входа'));
      const script = document.createElement('script');
      script.src = sources[index];
      script.onload = () => window.supabase?.createClient ? resolve() : trySource(index + 1).then(resolve, reject);
      script.onerror = () => trySource(index + 1).then(resolve, reject);
      document.head.appendChild(script);
    });
    return trySource(0);
  }

  function createGate() {
    if (!isTopLevel || document.getElementById('alsat-auth-gate')) return null;
    const gate = document.createElement('div');
    gate.id = 'alsat-auth-gate';
    gate.innerHTML = `
      <style>
        html.alsat-auth-locked,html.alsat-auth-locked body{overflow:hidden!important}
        #alsat-auth-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:rgba(3,9,20,.72);backdrop-filter:blur(17px) saturate(1.25);font-family:Inter,Manrope,system-ui,-apple-system,sans-serif;color:#edf7ff}
        #alsat-auth-gate[hidden]{display:none}
        .alsat-auth-card{position:relative;width:min(520px,100%);overflow:hidden;padding:clamp(25px,5vw,44px);border:1px solid rgba(117,216,255,.3);border-radius:30px;background:linear-gradient(145deg,rgba(10,27,48,.97),rgba(8,15,31,.98));box-shadow:0 35px 110px rgba(0,0,0,.58),0 0 70px rgba(48,180,255,.14)}
        .alsat-auth-card:before{content:"";position:absolute;width:270px;height:270px;right:-100px;top:-130px;border-radius:50%;background:radial-gradient(circle,rgba(91,208,255,.35),transparent 68%);animation:alsatAuthGlow 5s ease-in-out infinite alternate}.alsat-auth-card>*{position:relative}
        .alsat-auth-brand{display:flex;align-items:center;gap:11px;margin-bottom:38px;font-weight:850;letter-spacing:-.02em}.alsat-auth-logo{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#5ed7ff,#75edc6);color:#06111f;font-size:20px}.alsat-auth-brand small{display:block;margin-top:2px;color:#87a6bd;font-size:9px;letter-spacing:.18em;text-transform:uppercase}
        .alsat-auth-kicker{margin:0 0 12px;color:#73e7c0;font-size:11px;font-weight:850;letter-spacing:.14em;text-transform:uppercase}.alsat-auth-card h1{margin:0;font-size:clamp(30px,7vw,48px);line-height:1.02;letter-spacing:-.05em}.alsat-auth-copy{margin:18px 0 0;color:#b5c9d9;font-size:15px;line-height:1.65}.alsat-auth-benefits{display:grid;gap:9px;margin:23px 0 27px;padding:0;list-style:none;color:#dcebf5;font-size:13px}.alsat-auth-benefits li:before{content:"✓";display:inline-grid;place-items:center;width:21px;height:21px;margin-right:9px;border-radius:50%;background:rgba(96,231,189,.12);color:#67e9c0;font-weight:900}
        .alsat-google{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;min-height:54px;border:0;border-radius:16px;background:#fff;color:#172033;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 14px 35px rgba(0,0,0,.25);transition:.2s transform,.2s box-shadow}.alsat-google:hover{transform:translateY(-2px);box-shadow:0 18px 42px rgba(0,0,0,.34)}.alsat-google:disabled{opacity:.65;cursor:wait;transform:none}.alsat-google-mark{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;border:1px solid #dfe5ec;color:#4285f4;font-size:16px;font-weight:900}
        .alsat-auth-privacy{margin:16px 0 0;color:#7895aa;font-size:11px;line-height:1.55;text-align:center}.alsat-auth-error{min-height:18px;margin:10px 0 0;color:#ff9b9b;font-size:12px;text-align:center}
        #alsat-auth-user{position:fixed;right:16px;top:14px;z-index:2147483001;display:flex;align-items:center;gap:8px;padding:6px 9px 6px 6px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(5,14,28,.88);box-shadow:0 10px 35px rgba(0,0,0,.28);backdrop-filter:blur(14px);color:#e8f3fb;font:600 11px Inter,system-ui;cursor:pointer}#alsat-auth-user img{width:28px;height:28px;border-radius:50%;object-fit:cover}#alsat-auth-user span{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        @keyframes alsatAuthGlow{to{transform:scale(1.18) translate(-14px,12px)}}
        @media(max-width:620px){#alsat-auth-gate{padding:12px}.alsat-auth-card{padding:25px 21px;border-radius:24px}.alsat-auth-brand{margin-bottom:28px}.alsat-auth-copy{font-size:14px}.alsat-auth-benefits{font-size:12px}.alsat-auth-privacy{font-size:10px}#alsat-auth-user{right:8px;top:8px}#alsat-auth-user span{display:none}}
        @media(prefers-reduced-motion:reduce){.alsat-auth-card:before{animation:none}}
      </style>
      <section class="alsat-auth-card" role="dialog" aria-modal="true" aria-labelledby="alsat-auth-title">
        <div class="alsat-auth-brand"><span class="alsat-auth-logo">A</span><span>Alsat<small>Digital systems</small></span></div>
        <p class="alsat-auth-kicker">Бесплатный доступ</p>
        <h1 id="alsat-auth-title">Откройте все возможности сайта</h1>
        <p class="alsat-auth-copy">Чтобы увидеть полный каталог предложений, живые демонстрационные проекты и ИИ-консультанта, пройдите бесплатную регистрацию через Google. Это занимает несколько секунд.</p>
        <ul class="alsat-auth-benefits"><li>Полный каталог услуг и шоурумов</li><li>5 бесплатных вопросов ИИ-консультанту</li><li>Персональные визуальные схемы решений</li></ul>
        <button class="alsat-google" type="button"><span class="alsat-google-mark">G</span><span>Продолжить с Google</span></button>
        <p class="alsat-auth-privacy">Мы получим только имя, email и фотографию профиля. Пароль Google сайту не передаётся.</p>
        <p class="alsat-auth-error" role="alert"></p>
      </section>`;
    document.documentElement.classList.add('alsat-auth-locked');
    document.body.appendChild(gate);
    return gate;
  }

  function directGoogleUrl(redirectTo) {
    const url = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
    url.searchParams.set('provider', 'google');
    url.searchParams.set('redirect_to', redirectTo);
    return url.toString();
  }

  function bindGoogleButton(gate) {
    if (!gate) return;
    const button = gate.querySelector('.alsat-google');
    const error = gate.querySelector('.alsat-auth-error');
    if (!button || button.dataset.authBound) return;
    button.dataset.authBound = '1';
    button.addEventListener('click', async () => {
      button.disabled = true;
      error.textContent = 'Открываю безопасный вход Google…';
      const redirectTo = `${location.origin}${location.pathname}${location.search}`;
      const fallbackUrl = directGoogleUrl(redirectTo);
      if (!client) {
        location.assign(fallbackUrl);
        return;
      }
      try {
        const authResult = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
        if (authResult.error) throw authResult.error;
      } catch {
        location.assign(fallbackUrl);
      }
    });
  }

  function showUser(user) {
    if (!isTopLevel || !user || document.getElementById('alsat-auth-user')) return;
    const meta = user.user_metadata || {};
    const chip = document.createElement('button');
    chip.id = 'alsat-auth-user';
    chip.type = 'button';
    chip.title = 'Выйти из аккаунта';
    const avatar = document.createElement('img');
    avatar.alt = '';
    avatar.referrerPolicy = 'no-referrer';
    avatar.src = meta.avatar_url || meta.picture || '/alsat-consultant-avatar.jpg';
    const name = document.createElement('span');
    name.textContent = meta.full_name || meta.name || user.email || 'Профиль';
    chip.append(avatar, name);
    chip.addEventListener('click', () => window.AlsatAuth.signOut());
    document.body.appendChild(chip);
  }

  async function registerLead(activeSession) {
    if (!activeSession?.access_token) return false;
    const response = await fetch('/api/auth/me', { headers: { authorization: `Bearer ${activeSession.access_token}` } });
    return response.ok;
  }

  async function init() {
    let gate;
    try {
      gate = createGate();
      bindGoogleButton(gate);
      await loadSupabase();
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      const result = await client.auth.getSession();
      session = result.data?.session || null;
      if (session && !(await registerLead(session))) {
        await client.auth.signOut();
        session = null;
      }
      resolveReady(session);

      if (session) {
        if (gate) gate.hidden = true;
        document.documentElement.classList.remove('alsat-auth-locked');
        showUser(session.user);
      }
    } catch (error) {
      resolveReady(null);
      const message = gate?.querySelector('.alsat-auth-error');
      if (message) message.textContent = 'Авторизация временно недоступна. Обновите страницу через минуту.';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
