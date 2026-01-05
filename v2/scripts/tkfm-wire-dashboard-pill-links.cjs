#!/usr/bin/env node
/**
 * TKFM: Wire a "Dashboard" pill link into core pages (safe, idempotent)
 *
 * Inserts right after <body>:
 *  <!-- TKFM: DASHBOARD PILL -->
 *  <a href="/dashboard.html" ...>Dashboard</a>
 *
 * Usage:
 *   node scripts/tkfm-wire-dashboard-pill-links.cjs .
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';

const targets = [
  'index.html',
  'pricing.html',
  'radio-hub.html',
  'radio-tv.html',
  'feature-engine.html',
  'social-engine.html',
  'dj-mixtape-hosting.html',
  'label-home.html',
  'label-hub.html',
  'rotation-boost.html',
  'artist-upload.html',
].map(f => path.join(root, f));

const MARK = '<!-- TKFM: DASHBOARD PILL -->';

const pill = `${MARK}
<a href="/dashboard.html" style="
  position:fixed; right:16px; bottom:16px; z-index:9999;
  display:inline-flex; align-items:center; justify-content:center;
  padding:10px 12px; border-radius:999px; text-decoration:none;
  font-weight:1000; letter-spacing:.02em; font-size:13px;
  color:#020617;
  background: linear-gradient(90deg,#22d3ee,#3b82f6);
  box-shadow: 0 14px 28px rgba(0,0,0,.40);
">Dashboard</a>
`;

function insertAfterBodyOpen(s){
  if (s.includes(MARK)) return { s, changed:false };
  const m = s.match(/<body[^>]*>/i);
  if (!m) return { s, changed:false, warn:'no <body>' };
  const idx = m.index + m[0].length;
  return { s: s.slice(0, idx) + '\n' + pill + '\n' + s.slice(idx), changed:true };
}

for (const fp of targets){
  if (!fs.existsSync(fp)) { console.log('MISSING:', path.basename(fp)); continue; }
  let s = fs.readFileSync(fp, 'utf8');
  const r = insertAfterBodyOpen(s);
  if (r.changed) {
    fs.writeFileSync(fp, r.s, 'utf8');
    console.log('PATCHED:', path.basename(fp));
  } else {
    console.log('ALREADY:', path.basename(fp));
  }
}
