#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
//  АЛСАТ GUARDIAN — Claude Opus emergency security agent
//  Активируется только при критических инцидентах.
//  Принимает автономные решения: бан, разблокировка, эскалация.
//  Запускать отдельно: node tg-guardian.js
// ═══════════════════════════════════════════════════════════════════════

const ADMIN_BOT   = process.env.ADMIN_BOT_TOKEN  || '8656447295:AAFHpvCGKjhSeqXS9DPAjeRd7pkyf7krtSs';
const ADMIN_CHAT  = process.env.ADMIN_CHAT_ID     || '1162752434';
const SB_URL      = process.env.SUPABASE_URL      || 'https://duscyiyxfmsriyhwlbqx.supabase.co';
const SB_KEY      = process.env.SUPABASE_KEY      || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1c2N5aXl4Zm1zcml5aHdsYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTMxMjYsImV4cCI6MjA5NDE2OTEyNn0.5A7EN-yzzbkNpPOQYIg8wpo0tcXa_NDDmBwclixpAgw';
const ANTHROPIC   = process.env.ANTHROPIC_API_KEY || '';

const TG_API = 'https://api.telegram.org/bot' + ADMIN_BOT;

// Thresholds that trigger Guardian
const GUARDIAN_TRIGGERS = {
  blockedPostsPerPhone:   2,   // same phone blocked 2+ times in 24h → investigate
  contactRequestsPerHour: 8,   // 8+ contact requests in 1h from same account → scraping?
  uniquePhonesPerHour:    15,  // 15+ unique phones harvested via /contact → data harvesting
  newPostsSpike:          20,  // 20+ new posts in 5 min → spam attack
};

const CHECK_INTERVAL_MS  = 5 * 60 * 1000;  // check every 5 minutes
const DAY_MS   = 24 * 60 * 60 * 1000;
const HOUR_MS  = 60 * 60 * 1000;

// ── helpers ───────────────────────────────────────────────────────────────────

function sbH() {
  return { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' };
}

async function tgAlert(text) {
  return fetch(TG_API + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: ADMIN_CHAT, text, parse_mode: 'Markdown' })
  }).catch(e => console.error('tgAlert error:', e.message));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function now() { return new Date().toLocaleString('ru-KZ', { timeZone: 'Asia/Almaty' }); }

// ── call Claude Opus with full incident context ───────────────────────────────

async function consultOpus(incident) {
  if (!ANTHROPIC) {
    console.warn('[guardian] No ANTHROPIC_API_KEY — cannot consult Opus');
    return null;
  }

  const prompt = `
Ты — автономный агент безопасности платформы Алсат (alsat.asia).
Платформа — агрегатор объявлений и попутчиков в Казахстане.
Ты получаешь критический инцидент и должен принять решение.

ИНЦИДЕНТ: ${incident.type}
СЕРЬЁЗНОСТЬ: ${incident.severity}
ДЕТАЛИ: ${JSON.stringify(incident.data, null, 2)}

ИСТОРИЯ НАРУШЕНИЙ ЗА 24 ЧАСА:
${JSON.stringify(incident.history, null, 2)}

ТВОИ ПОЛНОМОЧИЯ:
- ban_phone: заблокировать номер телефона навсегда
- temp_ban_phone: временная блокировка на N часов
- unblock: разблокировать (если это ложное срабатывание)
- warn_user: отправить предупреждение пользователю
- escalate_human: потребовать вмешательства человека (Адил)
- no_action: инцидент не критический, продолжать наблюдение

Ответь строго в формате JSON:
{
  "assessment": "твой анализ ситуации (2-3 предложения на русском)",
  "risk_level": "low|medium|high|critical",
  "decision": "ban_phone|temp_ban_phone|unblock|warn_user|escalate_human|no_action",
  "duration_hours": null,
  "reason": "обоснование решения",
  "notify_user": true/false,
  "user_message": "сообщение пользователю если notify_user=true"
}`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    })
  }).catch(e => { console.error('[guardian] Opus API error:', e.message); return null; });

  if (!r?.ok) return null;
  const d = await r.json().catch(() => null);
  const raw = d?.content?.[0]?.text?.trim() || '';
  try {
    return JSON.parse(raw);
  } catch(e) {
    // Try to extract JSON from response
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(e2) {} }
    return null;
  }
}

// ── execute Opus decision ─────────────────────────────────────────────────────

async function executeDecision(decision, incident) {
  const phone = incident.data?.phone;
  const actions = [];

  if (decision.decision === 'ban_phone' && phone) {
    await fetch(SB_URL + '/rest/v1/taxi_drivers?phone=eq.' + phone, {
      method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
      body: JSON.stringify({ blocked: true, block_reason: '[Guardian/Opus] ' + decision.reason })
    }).catch(() => {});
    await fetch(SB_URL + '/rest/v1/taxi_requests?phone=eq.' + phone, {
      method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
      body: JSON.stringify({ blocked: true, block_reason: '[Guardian/Opus] ' + decision.reason })
    }).catch(() => {});
    actions.push(`🚫 Номер +${phone} заблокирован навсегда`);
  }

  if (decision.decision === 'temp_ban_phone' && phone && decision.duration_hours) {
    const unbanAt = new Date(Date.now() + decision.duration_hours * HOUR_MS).toISOString();
    await fetch(SB_URL + '/rest/v1/taxi_drivers?phone=eq.' + phone, {
      method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' },
      body: JSON.stringify({ blocked: true, block_reason: `[Guardian/Opus] Temp ban until ${unbanAt}: ${decision.reason}` })
    }).catch(() => {});
    actions.push(`⏱ Номер +${phone} заблокирован на ${decision.duration_hours}ч`);
  }

  if (decision.decision === 'warn_user' && decision.notify_user && phone) {
    // Find chat_id by phone
    const r = await fetch(SB_URL + '/rest/v1/tg_users?phone=eq.' + phone + '&select=chat_id&limit=1', { headers: sbH() }).catch(() => null);
    const rows = await r?.json().catch(() => []) || [];
    if (rows[0]?.chat_id) {
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8695550788:AAGHe6IfJBAtrD6FbGLet7_Rk6m7A9yCh7s';
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: rows[0].chat_id, text: `⚠️ ${decision.user_message}`, parse_mode: 'Markdown' })
      }).catch(() => {});
      actions.push(`📨 Предупреждение отправлено пользователю`);
    }
  }

  return actions;
}

// ── threat detection ──────────────────────────────────────────────────────────

async function detectThreats() {
  const threats = [];
  const since24h = new Date(Date.now() - DAY_MS).toISOString();
  const since1h  = new Date(Date.now() - HOUR_MS).toISOString();
  const since5m  = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  try {
    // ── 1. Repeated blocks from same phone ────────────────────────────────────
    const [blockedDrv, blockedReq] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/taxi_drivers?blocked=eq.true&created_at=gte.${encodeURIComponent(since24h)}&select=phone,from_city,to_city,block_reason,created_at`, { headers: sbH() }).then(r=>r.json()).catch(()=>[]),
      fetch(`${SB_URL}/rest/v1/taxi_requests?blocked=eq.true&created_at=gte.${encodeURIComponent(since24h)}&select=phone,from_city,to_city,block_reason,created_at`, { headers: sbH() }).then(r=>r.json()).catch(()=>[]),
    ]);
    const allBlocked = [...blockedDrv, ...blockedReq];
    const phoneGroups = {};
    allBlocked.forEach(r => {
      if (!r.phone) return;
      phoneGroups[r.phone] = (phoneGroups[r.phone] || []);
      phoneGroups[r.phone].push(r);
    });
    for (const [phone, records] of Object.entries(phoneGroups)) {
      if (records.length >= GUARDIAN_TRIGGERS.blockedPostsPerPhone) {
        threats.push({
          type: 'REPEATED_VIOLATIONS',
          severity: records.length >= 4 ? 'critical' : 'high',
          data: { phone, violations: records.length, records: records.slice(0, 5) },
          history: records,
        });
      }
    }

    // ── 2. Contact request scraping (many contacts in 1h) ────────────────────
    const contactsLastHour = await fetch(
      `${SB_URL}/rest/v1/contact_requests?created_at=gte.${encodeURIComponent(since1h)}&select=requester_chat,requester_phone,target_phone,created_at`,
      { headers: sbH() }
    ).then(r=>r.json()).catch(()=>[]);

    const scraperGroups = {};
    contactsLastHour.forEach(c => {
      scraperGroups[c.requester_chat] = (scraperGroups[c.requester_chat] || []);
      scraperGroups[c.requester_chat].push(c);
    });
    for (const [chatId, reqs] of Object.entries(scraperGroups)) {
      const uniquePhones = new Set(reqs.map(r => r.target_phone)).size;
      if (reqs.length >= GUARDIAN_TRIGGERS.contactRequestsPerHour || uniquePhones >= GUARDIAN_TRIGGERS.uniquePhonesPerHour) {
        threats.push({
          type: 'CONTACT_HARVESTING',
          severity: 'critical',
          data: {
            chat_id: chatId,
            phone: reqs[0]?.requester_phone,
            requests_count: reqs.length,
            unique_phones: uniquePhones,
            sample: reqs.slice(0, 5)
          },
          history: reqs,
        });
      }
    }

    // ── 3. Post spam spike (many posts in 5 min) ──────────────────────────────
    const [newDrv5m, newReq5m] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/taxi_drivers?created_at=gte.${encodeURIComponent(since5m)}&select=id,phone`, { headers: sbH() }).then(r=>r.json()).catch(()=>[]),
      fetch(`${SB_URL}/rest/v1/taxi_requests?created_at=gte.${encodeURIComponent(since5m)}&select=id,phone`, { headers: sbH() }).then(r=>r.json()).catch(()=>[]),
    ]);
    const totalNew = newDrv5m.length + newReq5m.length;
    if (totalNew >= GUARDIAN_TRIGGERS.newPostsSpike) {
      const uniquePhones = new Set([...newDrv5m, ...newReq5m].map(r => r.phone)).size;
      threats.push({
        type: 'SPAM_ATTACK',
        severity: totalNew >= 50 ? 'critical' : 'high',
        data: {
          posts_in_5min: totalNew,
          unique_phones: uniquePhones,
          is_botnet: uniquePhones < totalNew / 2
        },
        history: { drivers: newDrv5m.slice(0, 10), requests: newReq5m.slice(0, 10) },
      });
    }

  } catch(e) {
    console.error('[guardian] detectThreats error:', e.message);
  }

  return threats;
}

// ── process a single threat ───────────────────────────────────────────────────

const processedIncidents = new Set(); // deduplicate within session

async function processThreat(threat) {
  // Deduplicate: same type + phone within 30 min
  const key = `${threat.type}_${threat.data?.phone || threat.data?.chat_id}_${Math.floor(Date.now() / (30 * 60 * 1000))}`;
  if (processedIncidents.has(key)) return;
  processedIncidents.add(key);

  console.log(`[guardian] 🚨 Threat detected: ${threat.type} (${threat.severity})`);

  // Notify owner immediately
  await tgAlert(
    `🛡 *GUARDIAN активирован*\n\n` +
    `📋 Инцидент: *${threat.type}*\n` +
    `🔴 Серьёзность: ${threat.severity}\n` +
    `📊 Данные: ${JSON.stringify(threat.data).substring(0, 200)}\n\n` +
    `🤖 Консультирую Claude Opus...`
  );

  // Consult Opus
  const decision = await consultOpus(threat);

  if (!decision) {
    await tgAlert(`⚠️ *GUARDIAN*: Opus недоступен. Требуется ручная проверка инцидента ${threat.type}`);
    return;
  }

  console.log(`[guardian] Opus decision: ${decision.decision} (risk: ${decision.risk_level})`);

  // Execute if not just observing
  let executedActions = [];
  if (decision.decision !== 'no_action' && decision.decision !== 'escalate_human') {
    executedActions = await executeDecision(decision, threat);
  }

  // Send full report
  const reportLines = [
    `🛡 *GUARDIAN — Решение принято*`,
    ``,
    `📋 *Инцидент:* ${threat.type}`,
    `🔴 *Риск (Opus):* ${decision.risk_level}`,
    ``,
    `🧠 *Анализ Opus:*`,
    `_${decision.assessment}_`,
    ``,
    `⚖️ *Решение:* \`${decision.decision}\``,
    `📝 *Обоснование:* ${decision.reason}`,
  ];

  if (executedActions.length > 0) {
    reportLines.push(``, `✅ *Выполнено:*`);
    executedActions.forEach(a => reportLines.push(`• ${a}`));
  }

  if (decision.decision === 'escalate_human') {
    reportLines.push(``, `🆘 *ТРЕБУЕТСЯ ВАШЕ ВМЕШАТЕЛЬСТВО*`);
    reportLines.push(`Opus считает ситуацию слишком сложной для автономного решения.`);
  }

  reportLines.push(``, `_${now()}_`);

  await tgAlert(reportLines.join('\n'));
}

// ── main loop ─────────────────────────────────────────────────────────────────

async function guardianLoop() {
  console.log(`[guardian] 🛡 Алсат Guardian запущен (Claude Opus ${new Date().toLocaleString('ru-KZ', { timeZone: 'Asia/Almaty' })})`);
  await tgAlert(`🛡 *Guardian запущен*\nМодель: Claude Opus 4-6\nПроверка каждые 5 минут\n_${now()}_`);

  while (true) {
    try {
      const threats = await detectThreats();
      if (threats.length > 0) {
        console.log(`[guardian] Found ${threats.length} threat(s)`);
        for (const threat of threats) {
          await processThreat(threat);
          await sleep(2000); // pause between processing multiple threats
        }
      } else {
        console.log(`[guardian] ✅ ${now()} — no threats`);
      }
    } catch(e) {
      console.error('[guardian] loop error:', e.message);
    }
    await sleep(CHECK_INTERVAL_MS);
  }
}

guardianLoop();
