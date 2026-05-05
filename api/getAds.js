const ALLOWED_ORIGINS = ['https://burabay.su', 'https://www.burabay.su', 'http://localhost:3000'];

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return res.status(503).json({ error: 'Redis не сконфигурирован' });

  try {
    // Get last 50 ad IDs from list
    const listRes = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['LRANGE', 'ads:list', '0', '49']),
    });
    const { result: ids } = await listRes.json();

    if (!ids || ids.length === 0) return res.json([]);

    // Fetch all ads in one pipeline
    const pipeline = ids.map(id => ['GET', `ads:${id}`]);
    const adsRes = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(pipeline),
    });
    const adsData = await adsRes.json();

    const ads = adsData
      .map(r => { try { return r.result ? JSON.parse(r.result) : null; } catch { return null; } })
      .filter(Boolean);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.json(ads);
  } catch (err) {
    console.error('getAds error:', err.message);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};
