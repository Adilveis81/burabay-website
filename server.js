const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Please set them in environment.');
}

app.post('/api/sendAd', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing text' });
    if (text.length > 4000) return res.status(400).json({ error: 'Text too long' });
    if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ error: 'Server not configured' });

    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' })
    });
    const data = await tgRes.json();
    if (!tgRes.ok || !data.ok) return res.status(502).json({ error: 'Telegram API error', details: data });
    return res.json({ ok: true, result: data.result });
  } catch (err) {
    console.error('sendAd error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

app.use(express.static('.'));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
