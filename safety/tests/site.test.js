import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'kk.html', 'dashboard.html', 'courses/occupational-safety.html', 'courses/industrial-safety.html', 'industries/construction.html', 'industries/oil-gas.html'];

test('all local page assets and links exist', () => {
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="([^"#]+)"/g)].map(match => match[1]);
    for (const ref of refs) {
      if (/^(?:https?:|mailto:|data:)/.test(ref) || ref === 'api/lead') continue;
      assert.equal(existsSync(resolve(dirname(join(root, page)), ref)), true, `${page}: missing ${ref}`);
    }
  }
});

test('lead forms contain required fields and consent', () => {
  for (const page of ['index.html', 'kk.html']) {
    const html = readFileSync(join(root, page), 'utf8');
    for (const name of ['name', 'company', 'phone', 'contact', 'employees', 'industry', 'interests', 'consent', 'startedAt', 'website']) {
      assert.match(html, new RegExp(`name="${name}"`), `${page}: missing ${name}`);
    }
  }
});

test('project files contain no common secret formats', () => {
  const secretPattern = /(github_pat_[A-Za-z0-9_]+|sk-(?:or-v1-)?[A-Za-z0-9]{24,}|\d{8,12}:[A-Za-z0-9_-]{30,})/;
  const files = ['index.html', 'kk.html', 'dashboard.html', 'assets/app.js', 'assets/dashboard.js', 'functions/api/lead.js'];
  for (const file of files) assert.doesNotMatch(readFileSync(join(root, file), 'utf8'), secretPattern, file);
});
