#!/usr/bin/env node
/**
 * TKFM: Secret Scan (Node) — very low false positives
 *
 * Blocks:
 *  - Stripe secret keys anywhere: sk_live_... / sk_test_...
 *  - Hardcoded STRIPE_SECRET_KEY=sk_(live|test)_...
 *  - Hardcoded TKFM_OWNER_KEY=<long literal> (allows placeholders / env expansions)
 *
 * Usage:
 *  node scripts/tkfm-secret-scan.cjs
 *  node scripts/tkfm-secret-scan.cjs --staged
 */
const fs = require('fs');
const { execSync } = require('child_process');

const mode = process.argv.includes('--staged') ? 'staged' : 'tracked';

function git(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function listFiles() {
  const out = mode === 'staged' ? git('git diff --cached --name-only') : git('git ls-files');
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function isBinary(buf) {
  // if has NUL byte, treat as binary
  for (let i = 0; i < Math.min(buf.length, 8000); i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function stripQuotes(s) {
  let t = String(s || '').trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1);
  }
  return t.trim();
}

function isOwnerPlaceholder(v) {
  const t = String(v || '').trim().toLowerCase();
  if (!t) return true;
  const exact = new Set([
    'your_owner_key','your-owner-key','replace_me','replace','paste_here','changeme','example','dummy','test','placeholder'
  ]);
  if (exact.has(t)) return true;
  if (t.startsWith('xxx')) return true;
  if (t.startsWith('***')) return true;
  return false;
}

function redact(line) {
  return line
    .replace(/sk_live_[0-9A-Za-z]{10,}/g, m => m.slice(0, 12) + '…')
    .replace(/sk_test_[0-9A-Za-z]{10,}/g, m => m.slice(0, 12) + '…');
}

function findLineMatches(text, regex) {
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) hits.push({ line: i + 1, text: lines[i] });
  }
  return hits;
}

function scanOne(file) {
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch {
    return [];
  }
  if (isBinary(buf)) return [];
  const text = buf.toString('utf8');

  const issues = [];

  // Stripe keys anywhere
  if (/sk_live_[0-9A-Za-z]{10,}/.test(text)) {
    issues.push({ reason: 'Stripe live key', matches: findLineMatches(text, /sk_live_[0-9A-Za-z]{10,}/) });
  }
  if (/sk_test_[0-9A-Za-z]{10,}/.test(text)) {
    issues.push({ reason: 'Stripe test key', matches: findLineMatches(text, /sk_test_[0-9A-Za-z]{10,}/) });
  }

  // Hardcoded STRIPE_SECRET_KEY with actual key
  if (/^STRIPE_SECRET_KEY=sk_(live|test)_[0-9A-Za-z]{10,}\s*$/m.test(text)) {
    issues.push({ reason: 'Hardcoded STRIPE_SECRET_KEY=sk_...', matches: findLineMatches(text, /^STRIPE_SECRET_KEY=sk_(live|test)_[0-9A-Za-z]{10,}\s*$/m) });
  }

  // Hardcoded TKFM_OWNER_KEY long literal
  const ownerLines = text.match(/^TKFM_OWNER_KEY=.*$/gm) || [];
  for (const ln of ownerLines) {
    const rhs = stripQuotes(ln.replace(/^TKFM_OWNER_KEY=/, ''));
    if (!rhs) continue;

    // skip expansions
    if (rhs.includes('$(') || rhs.includes('${') || rhs.includes('$')) continue;
    if (isOwnerPlaceholder(rhs)) continue;

    if (rhs.length >= 20) {
      issues.push({ reason: 'Hardcoded TKFM_OWNER_KEY long literal', matches: findLineMatches(text, /^TKFM_OWNER_KEY=.*$/m) });
      break;
    }
  }

  return issues;
}

function main() {
  const files = listFiles();
  console.log('== TKFM SECRET SCAN ==');
  console.log(`Mode: ${mode}`);
  console.log(`Files: ${files.length}`);

  let any = false;

  for (const f of files) {
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) continue;
    const issues = scanOne(f);
    if (!issues.length) continue;

    any = true;
    for (const issue of issues) {
      console.log(`SECRET HIT: ${f}  (${issue.reason})`);
      for (const m of (issue.matches || []).slice(0, 3)) {
        console.log(`${m.line}:${redact(m.text)}`);
      }
    }
  }

  if (any) {
    console.log('FAIL: secret(s) detected. Remove them before commit/push.');
    process.exit(2);
  } else {
    console.log('OK: no secrets found');
  }
}

main();
