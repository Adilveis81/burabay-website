// Cloudflare Pages Function — submit ad
// POST /api/sendAd
// Validates → AI moderates → saves to Supabase → notifies admin + seller

const SB_URL_DEFAULT = 'https://duscyiyxfmsriyhwlbqx.supabase.co';
const SB_KEY_DEFAULT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';
const BOT_DEFAULT    = '8695550788:AAGHe6IfJBAtrD6FbGLet7_Rk6m7A9yCh7s';
const ADMIN_BOT_DEFAULT  = '8656447295:AAFHpvCGKjhSeqXS9DPAjeRd7pkyf7krtSs';
const ADMIN_CHAT_DEFAULT = '1162752434';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const SB_URL    = env.SUPABASE_URL       || SB_URL_DEFAULT;
  const SB_KEY    = env.SUPABASE_KEY       || SB_KEY_DEFAULT;
  const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || BOT_DEFAULT;
  const ADMIN_BOT = env.ADMIN_BOT_TOKEN    || ADMIN_BOT_DEFAULT;
  const ADMIN_CHAT= env.ADMIN_CHAT_ID      || ADMIN_CHAT_DEFAULT;
  const API_KEY   = env.ANTHROPIC_API_KEY;

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Invalid body' }, 400);

  const { title, description, category, city, price, phone, photos } = body;
  if (!title?.trim() || !phone) {
    return json({ error: 'Заголовок и телефон обязательны' }, 400);
  }

  const sbH = { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };

  // ── AI moderation (fail-open) ────────────────────────────
  if (API_KEY) {
    try {
      const modR = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 128,
          system: 'Ты модератор объявлений. Отклони если: спам, мошенничество, незаконный контент, оскорбления, 18+. Верни ТОЛЬКО JSON без markdown: {"ok":true} или {"ok":false,"reason":"причина на русском"}',
          messages: [{ role: 'user', content: title + '\n' + (description || '') }]
        })
      });
      if (modR.ok) {
        const modData = await modR.json();
        const raw = (modData.content?.[0]?.text || '{}').replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(raw);
        if (parsed.ok === false) {
          return json({ error: 'Объявление отклонено: ' + (parsed.reason || 'нарушение правил') }, 422);
        }
      }
    } catch (_) { /* fail-open */ }
  }

  // ── Save to Supabase ─────────────────────────────────────
  const ph = String(phone).replace(/\D/g, '');
  const adData = {
    title: title.trim(),
    description: (description || '').trim(),
    cat_label: category || '',
    city: city || '',
    price: price ? Number(price) : null,
    phone: ph,
    photos: Array.isArray(photos) ? photos : [],
    status: 'active',
    created_at: new Date().toISOString()
  };

  const saveR = await fetch(SB_URL + '/rest/v1/ads', {
    method: 'POST',
    headers: { ...sbH, Prefer: 'return=representation' },
    body: JSON.stringify(adData)
  });

  if (!saveR.ok) {
    const err = await saveR.text().catch(() => '');
    return json({ error: 'Ошибка сохранения: ' + err }, 502);
  }

  const saved = await saveR.json().catch(() => []);
  const savedAd = Array.isArray(saved) ? saved[0] : saved;

  // ── Notify admin ─────────────────────────────────────────
  const priceStr = price ? Number(price).toLocaleString('ru-KZ') + ' ₸' : 'Договорная';
  fetch('https://api.telegram.org/bot' + ADMIN_BOT + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT,
      text: `🆕 *Новое объявление Алсат*\n\n📌 ${title.trim()}\n🏷 ${category || '–'} · ${city || '–'}\n💰 ${priceStr}\n📞 +${ph}`,
      parse_mode: 'Markdown'
    })
  }).catch(() => {});

  // ── Notify seller via bot (if phone registered) ──────────
  if (ph) {
    fetch(SB_URL + '/rest/v1/tg_users?phone=eq.' + encodeURIComponent(ph) + '&limit=1', { headers: sbH })
      .then(r => r.json())
      .then(rows => {
        if (!Array.isArray(rows) || !rows[0]) return;
        fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: rows[0].chat_id,
            text: `✅ Ваше объявление опубликовано на alsat.asia!\n\n📌 *${title.trim()}*\n🏷 ${category || ''} · ${city || ''}\n💰 ${priceStr}\n\n🔗 alsat.asia`,
            parse_mode: 'Markdown'
          })
        }).catch(() => {});
      }).catch(() => {});
  }

  return json({ ok: true, id: savedAd?.id });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}
