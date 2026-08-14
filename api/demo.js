const PRESETS = new Set(['fashion','beauty','dental','restaurant','construction','realty','hotel','fitness','education','logistics','autoservice','agro','legal','events','expert','pet','wellness','cosmetics-network','saas-partners','b2b-partners']);
const rateLimits = new Map();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 12;

function clean(value, max) {
  return typeof value === 'string'
    ? value.replace(/[<>\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}

function limited(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const item = rateLimits.get(ip);
  if (!item || now - item.startedAt > WINDOW_MS) {
    rateLimits.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  item.count += 1;
  return item.count > MAX_REQUESTS;
}

export default function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = origin === 'https://alsat.asia' || origin === 'https://www.alsat.asia';
  res.setHeader('Cache-Control', 'no-store');
  if (allowed) res.setHeader('Access-Control-Allow-Origin', origin);
  if (req.method === 'OPTIONS') return allowed ? res.status(204).end() : res.status(403).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  if (limited(req)) return res.status(429).json({ error: 'Слишком много демо-запросов. Попробуйте позже.' });

  const preset = clean(req.body?.preset, 32);
  if (!PRESETS.has(preset)) return res.status(400).json({ error: 'Неизвестный вариант шоурума' });
  const brand = clean(req.body?.brand, 40);
  const city = clean(req.body?.city, 40);
  const accent = /^#[0-9a-f]{6}$/i.test(req.body?.accent || '') ? req.body.accent : '';
  const params = new URLSearchParams({ preset });
  if (brand) params.set('brand', brand);
  if (city) params.set('city', city);
  if (accent) params.set('accent', accent);
  return res.status(200).json({
    url: `https://alsat.asia/site-demo.html?${params.toString()}`,
    expires: null,
    mode: 'safe-template',
  });
}
