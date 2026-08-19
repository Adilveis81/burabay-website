#!/usr/bin/env node
// Генератор токенов для платной консультации Alsat
// Запуск: node gen-token.js
// Или с кастомным сроком: node gen-token.js 3  (3 месяца)

const crypto = require('crypto');

// !! Поставь тот же секрет что в Cloudflare Pages → Settings → Variables → CONSULTATION_SECRET
const SECRET = process.env.CONSULTATION_SECRET || 'alsat-consult-secret-2026';
const MONTHS = parseInt(process.argv[2]) || 6;

const exp = Math.floor(Date.now() / 1000) + MONTHS * 30 * 24 * 3600;
const sig = crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex').slice(0, 16);
const token = `alsat_${exp}.${sig}`;
const link = `https://alsat.asia/amir?consultation=${token}`;
const expDate = new Date(exp * 1000).toLocaleDateString('ru-RU', {day:'2-digit',month:'long',year:'numeric'});

console.log('');
console.log('✅ Токен сгенерирован');
console.log(`   Истекает: ${expDate} (${MONTHS} мес.)`);
console.log('');
console.log('📎 Ссылка для клиента:');
console.log(`   ${link}`);
console.log('');
console.log('📋 Токен (если нужен отдельно):');
console.log(`   ${token}`);
console.log('');
