const ALLOWED_ORIGINS = ['https://burabay.su', 'https://www.burabay.su', 'http://localhost:3000'];

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Сообщение обязательно' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Сообщение слишком длинное' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI недоступен' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: 'Ты помощник сайта burabay.su — локальные объявления Акмолинской области Казахстана. Помогай пользователям: отвечай на вопросы о сайте, помогай составить объявление, отвечай на вопросы про регион. Отвечай кратко и дружелюбно на русском языке.',
        messages: [{ role: 'user', content: message.trim() }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic ${response.status}: ${err}`);
    }

    const data = await response.json();
    const reply = data.content?.find(b => b.type === 'text')?.text ?? 'Нет ответа';
    return res.json({ reply });
  } catch (err) {
    console.error('chat error:', err.message);
    return res.status(500).json({ error: 'Внутренняя ошибка. Попробуйте позже.' });
  }
};
