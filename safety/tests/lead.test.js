import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, validateLead } from '../functions/api/lead.js';

function valid(overrides = {}) {
  return { name: 'Алия', company: 'ТОО Демо', phone: '+7 700 000 00 00', contact: 'hse@example.kz', employees: '51–200', industry: 'Промышленность', interests: ['Охрана труда'], comment: 'Нужна демонстрация', consent: 'yes', startedAt: Date.now() - 5000, website: '', ...overrides };
}

test('accepts a complete lead', () => {
  const result = validateLead(valid());
  assert.equal(result.error, undefined);
  assert.equal(result.lead.company, 'ТОО Демо');
});

test('rejects honeypot and fast submissions', () => {
  assert.match(validateLead(valid({ website: 'spam.example' })).error, /защиты/);
  assert.match(validateLead(valid({ startedAt: Date.now() })).error, /Обновите/);
});

test('rejects invalid contacts and missing consent', () => {
  assert.match(validateLead(valid({ contact: 'не контакт' })).error, /email/);
  assert.match(validateLead(valid({ consent: '' })).error, /согласие/);
});

test('returns success only after Telegram confirms delivery', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const request = new Request('https://safety.alsat.asia/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://safety.alsat.asia' }, body: JSON.stringify(valid()) });
    const response = await onRequestPost({ request, env: { SITE_ORIGIN: 'https://safety.alsat.asia', TELEGRAM_BOT_TOKEN: 'test-only', TELEGRAM_CHAT_ID: 'test-only' } });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
  } finally { globalThis.fetch = originalFetch; }
});

test('does not claim success if notification fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 502 });
  try {
    const request = new Request('https://safety.alsat.asia/api/lead', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://safety.alsat.asia', 'CF-Connecting-IP': '198.51.100.42' }, body: JSON.stringify(valid()) });
    const response = await onRequestPost({ request, env: { SITE_ORIGIN: 'https://safety.alsat.asia', TELEGRAM_BOT_TOKEN: 'test-only', TELEGRAM_CHAT_ID: 'test-only' } });
    assert.equal(response.status, 502);
  } finally { globalThis.fetch = originalFetch; }
});
