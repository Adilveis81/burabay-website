(() => {
  if (window.AlsatAuth) return;
  const url = 'https://duscyiyxfmsriyhwlbqx.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';
  let client = null;
  let session = null;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  window.AlsatAuth = {
    ready,
    getHeaders: async () => { await ready; return session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}; },
  };
  const button = document.getElementById('authButton');
  function updateButton() {
    if (button) button.textContent = session ? 'Выйти' : 'Войти / Регистрация';
  }
  if (button) button.addEventListener('click', async () => {
    if (!client) { alert('Вход временно недоступен. Попробуйте позже.'); return; }
    button.disabled = true;
    try {
      if (session) {
        const { error } = await client.auth.signOut();
        if (error) throw error;
      } else {
        const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/` } });
        if (error) throw error;
      }
    } catch { alert('Не удалось выполнить вход. Попробуйте ещё раз.'); }
    finally { button.disabled = false; }
  });
  const script = document.createElement('script');
  script.src = '/vendor/supabase-2.112.3.min.js';
  script.onload = async () => {
    try {
      client = window.supabase.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const result = await client.auth.getSession();
      session = result.data?.session || null;
      client.auth.onAuthStateChange((_event, next) => { session = next; updateButton(); });
      updateButton();
    } catch { client = null; }
    finally { resolveReady(session); }
  };
  script.onerror = () => resolveReady(null);
  document.head.appendChild(script);
})();
