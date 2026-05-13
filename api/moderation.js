// Moderation endpoint — checks ad content for spam/fraud via Claude Haiku
// POST { title, desc, phone, price, city, catLabel }
// Returns { ok: true, safe: true/false, reason: "..." }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { title, desc, phone, price, city, catLabel } = req.body || {};

  if (!title) {
    return res.status(400).json({ ok: false, error: 'title is required' });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // If no API key, pass through without moderation
    return res.status(200).json({ ok: true, safe: true, reason: 'moderation unavailable' });
  }

  const adText = [
    `Заголовок: ${title}`,
    desc   ? `Описание: ${desc}` : null,
    phone  ? `Телефон: ${phone}` : null,
    price  ? `Цена: ${price}` : null,
    city   ? `Город: ${city}` : null,
    catLabel ? `Категория: ${catLabel}` : null,
  ].filter(Boolean).join('\n');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system:
          'Ты модератор сайта объявлений Казахстана alsat.asia. ' +
          'Проверь объявление на спам, мошенничество, запрещённый контент. ' +
          'Отвечай ТОЛЬКО JSON: {"safe": true/false, "reason": "..."}',
        messages: [
          { role: 'user', content: adText }
        ],
      }),
    });

    if (!resp.ok) {
      // If Claude API fails, allow publishing
      console.error('Claude API error:', resp.status);
      return res.status(200).json({ ok: true, safe: true, reason: 'moderation service error' });
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text?.trim() || '';

    // Parse the JSON from Claude's response
    let result = { safe: true, reason: '' };
    try {
      // Extract JSON from the response (Claude may wrap it in markdown code blocks)
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      }
    } catch (e) {
      console.warn('Failed to parse moderation JSON:', text);
      // If we can't parse, assume safe
      result = { safe: true, reason: 'parse error' };
    }

    return res.status(200).json({
      ok: true,
      safe: result.safe !== false,  // default to safe if field missing
      reason: result.reason || '',
    });

  } catch (err) {
    console.error('Moderation error:', err);
    // On network/unexpected error, allow publishing
    return res.status(200).json({ ok: true, safe: true, reason: 'moderation unavailable' });
  }
};
