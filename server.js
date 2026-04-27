require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors({ origin: true })); // consider restricting origin in production
app.use(express.json({ limit: '10kb' }));

// Rate limiter for API endpoints
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 6, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Please set them in environment.');
}

function escapeTelegramMarkdown(text) {
  // Escape characters for Telegram MarkdownV2
  return text.replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

app.post('/api/sendAd',
  body('text').isString().isLength({ min: 1, max: 4000 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const raw = req.body.text || '';
      const safeText = escapeTelegramMarkdown(raw);

      if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ error: 'Server not configured' });

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: safeText, parse_mode: 'MarkdownV2' })
      });

      const data = await tgRes.json();
      if (!tgRes.ok || !data.ok) return res.status(502).json({ error: 'Telegram API error', details: data });
      return res.json({ ok: true, result: data.result });
    } catch (err) {
      console.error('sendAd error', err);
      return res.status(500).json({ error: 'Internal error' });
    }
  }
);

// Serve static files
app.use(express.static('.'));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
