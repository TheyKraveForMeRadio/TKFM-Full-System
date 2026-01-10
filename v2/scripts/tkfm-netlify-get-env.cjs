#!/usr/bin/env node
/* TKFM: read a Netlify env var value using Netlify CLI.
   Requires: netlify CLI logged in AND linked site.

   Usage:
     node scripts/tkfm-netlify-get-env.cjs TKFM_OWNER_KEY
*/
const { execSync } = require('child_process');

const name = (process.argv[2] || '').trim();
if (!name) {
  console.error('FAIL: env var name required');
  process.exit(2);
}

function tryCmd(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim();
  } catch (_) {
    return '';
  }
}

// 1) Try direct getter (newer CLIs support this)
let v = tryCmd(`netlify env:get ${name}`);
if (v) {
  process.stdout.write(v.trim());
  process.exit(0);
}

// 2) Try JSON list
const raw = tryCmd(`netlify env:list --json`);
if (!raw) {
  console.error('FAIL: could not read Netlify env. Ensure netlify CLI is logged in and site is linked.');
  process.exit(3);
}

let arr;
try { arr = JSON.parse(raw); } catch (e) {
  console.error('FAIL: netlify env:list --json returned non-JSON');
  process.exit(4);
}

const item = (arr || []).find(x => String(x.key || x.name || '') === name);
if (!item) {
  console.error('FAIL: env var not found in Netlify site: ' + name);
  process.exit(5);
}

// Netlify CLI shapes vary. Try common shapes:
let val = '';
if (typeof item.value === 'string') val = item.value;
if (!val && Array.isArray(item.values) && item.values.length) {
  // Prefer "production" if present, else first
  const prod = item.values.find(x => String(x.context || '').toLowerCase() === 'production');
  val = String((prod && prod.value) || item.values[0].value || '');
}
if (!val && item.scopes && item.scopes.production && item.scopes.production.value) val = String(item.scopes.production.value);

val = String(val || '').trim();
if (!val) {
  console.error('FAIL: env var exists but value is not readable (CLI may redact). Copy TKFM_OWNER_KEY from Netlify dashboard and use ./scripts/tkfm-set-owner-key.sh "KEY"');
  process.exit(6);
}

process.stdout.write(val);
