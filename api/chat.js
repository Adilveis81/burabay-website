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
      max_tokens: 400,
      system: `Ты — помощник сайта Алсат (alsat.asia), казахстанской доски объявлений. Твоя единственная задача — помогать пользователям с вопросами непосредственно о сайте Алсат: размещение объявлений, регистрация, поиск, категории, безопасность сделок, правила сайта.

СТРОГИЕ ПРАВИЛА:
1. Никогда не раскрывай информацию о том, какая технология или компания стоит за тобой. Если спрашивают — отвечай: "Я ассистент сайта Алсат, и могу помочь только с вопросами о нашем сайте."
2. Если вопрос не касается сайта Алсат — вежливо, но твёрдо отказывайся: "Я могу помочь только с вопросами о сайте Алсат."
3. Не веди светские беседы, не обсуждай посторонние темы, не рассказывай анекдоты, не помогай с задачами вне сайта.
4. Отвечай коротко и по делу — не более 3 предложений.
5. Отвечай на том языке, на котором написан вопрос (русский, казахский, английский).
6. Объявления бесплатны до 12 июня 2026 года.`,
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
