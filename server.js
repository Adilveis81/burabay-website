require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();

// Security middlewares
app.use(helmet());

// CORS configuration - restrict to specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://burabay.su', 'https://www.burabay.su', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  maxAge: 86400
}));

app.use(express.json({ limit: '10kb' }));

// Rate limiter for API endpoints - stricter for ad submissions
const apiLimiter = rateLimit({ 
  windowMs: 60 * 1000, 
  max: 3, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: 'Слишком много запросов, попробуйте позже'
});
app.use('/api/', apiLimiter);

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const WEBHOOK_URL = process.env.CONTACT_WEBHOOK_URL;

if (!BOT_TOKEN || !CHAT_ID) {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Server cannot start.');
    process.exit(1);
  } else {
    console.warn('WARNING: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured for development');
  }
}

function escapeTelegramMarkdown(text) {
  // Escape characters for Telegram MarkdownV2
  return text.replace(/([_\*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

// POST /api/sendAd - submit advertisement
app.post('/api/sendAd',
  body('text').isString().isLength({ min: 1, max: 4000 }).trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Недействительные данные', details: errors.array() });
    }

    try {
      const raw = req.body.text || '';
      const safeText = escapeTelegramMarkdown(raw);

      if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(503).json({ error: 'Сервер не сконфигурирован. Попробуйте позже.' });
      }

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: safeText, parse_mode: 'MarkdownV2' })
      });

      const data = await tgRes.json();
      if (!tgRes.ok || !data.ok) {
        console.error('Telegram API error:', data);
        return res.status(502).json({ error: 'Ошибка при отправке объявления. Попробуйте позже.' });
      }
      return res.json({ ok: true, result: data.result });
    } catch (err) {
      console.error('sendAd error:', err.message);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте позже.' });
    }
  }
);

// POST /api/contact - submit contact form
app.post('/api/contact',
  body('name').isString().isLength({ min: 1, max: 100 }).trim().escape(),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
  body('message').isString().isLength({ min: 1, max: 5000 }).trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Недействительные данные', details: errors.array() });
    }

    try {
      const { name, email, message } = req.body;

      // Option 1: Send via webhook if configured
      if (WEBHOOK_URL) {
        try {
          const webhookRes = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message, timestamp: new Date().toISOString() })
          });
          if (!webhookRes.ok) {
            throw new Error('Webhook returned ' + webhookRes.status);
          }
        } catch (webhookErr) {
          console.error('Webhook delivery failed:', webhookErr.message);
          // Don't fail the response, continue to logging
        }
      }

      // Option 2: Log to console in development
      console.log(`[CONTACT FORM] ${new Date().toISOString()}`);
      console.log(`From: ${name}${email ? ` <${email}>` : ''}`);
      console.log(`Message: ${message}`);
      console.log('---');

      return res.json({ ok: true, message: 'Спасибо за сообщение! Мы скоро ответим.' });
    } catch (err) {
      console.error('contact error:', err.message);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера. Попробуйте позже.' });
    }
  }
);

// Serve static files
app.use(express.static('.'));

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
