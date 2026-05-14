// Cloudflare Pages Function — AI chat for alsat.asia website widget
// POST /api/chat

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
  const { message, history } = await request.json().catch(() => ({}));
  if (!message) return json({ error: 'No message' }, 400);

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: 'API key not configured' }, 500);

  const msgs = [];
  if (Array.isArray(history)) history.forEach(h => msgs.push({ role: h.role, content: h.content }));
  msgs.push({ role: 'user', content: message });

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system:
        'Ты — помощник сайта Алсат (alsat.asia), казахстанской доски объявлений. ' +
        'Помогай пользователям: размещение объявлений, поиск, категории, безопасность сделок. ' +
        'Отвечай коротко (не более 3 предложений). ' +
        'Отвечай на языке вопроса (русский, казахский, английский). ' +
        'Объявления бесплатны.',
      messages: msgs
    })
  }).catch(() => null);

  if (!r?.ok) {
    const err = r ? await r.text().catch(() => '') : 'fetch failed';
    return json({ error: err }, 502);
  }

  const data = await r.json().catch(() => null);
  const reply = data?.content?.[0]?.text || 'Извините, не удалось получить ответ.';
  return json({ reply });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}
