export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { message, history } = req.body || {};
  if (!message) return res.status(400).json({ error: 'No message' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const msgs = [];
  if (Array.isArray(history)) {
    history.forEach(function(h) { msgs.push({ role: h.role, content: h.content }); });
  }
  msgs.push({ role: 'user', content: message });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: 'Ты дружелюбный помощник сайта Алсат (alsat.asia) — бесплатной доски объявлений Казахстана. Отвечай на том языке на котором пишет пользователь (русский/казахский/английский). Кратко и по делу. Помогай с вопросами о размещении объявлений, регистрации, безопасности сделок на сайте. Объявления сейчас бесплатны до 12 июня 2026 года.',
      messages: msgs
    })
  });

  if (!response.ok) {
    const err = await response.text();
    return res.status(502).json({ error: err });
  }
  const data = await response.json();
  const reply = data.content?.[0]?.text || 'Извините, не удалось получить ответ.';
  res.json({ reply });
}
