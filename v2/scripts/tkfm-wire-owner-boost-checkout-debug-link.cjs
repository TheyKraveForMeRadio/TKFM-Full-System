#!/usr/bin/env node
/**
 * TKFM: Wire link to Owner Boost Checkout Debug into owner pages (idempotent).
 * Adds a small anchor near top nav areas (best-effort).
 *
 * Usage:
 *   node scripts/tkfm-wire-owner-boost-checkout-debug-link.cjs .
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';

const files = [
  'owner-boost-dashboard.html',
  'owner-paid-lane-inbox.html',
  'owner-boost-analytics.html',
  'owner-featured-manager.html',
  'owner-stripe-verifier.html',
];

const MARK = '<!-- TKFM: OWNER BOOST CHECKOUT DEBUG LINK -->';
const link = `${MARK}
<a href="/owner-boost-checkout-debug.html" style="
  display:inline-flex;align-items:center;gap:10px;
  margin:10px 0 0;
  padding:10px 14px;
  border-radius:14px;
  text-decoration:none;
  font-weight:900;
  color:#020617;
  background: linear-gradient(90deg,#22d3ee,#3b82f6);
  box-shadow: 0 10px 24px rgba(0,0,0,0.35);
">
  <span style="letter-spacing:.12em;font-size:12px;text-transform:uppercase;">Owner</span>
  <span style="font-size:14px;">Boost Checkout Debug</span>
</a>
`;

function patch(fp){
  if (!fs.existsSync(fp)) return { file: fp, status: 'missing' };
  let s = fs.readFileSync(fp,'utf8');
  if (s.includes(MARK)) return { file: fp, status: 'already' };

  const lower = s.toLowerCase();

  // Prefer after </header>
  const hdrClose = lower.indexOf('</header>');
  if (hdrClose !== -1){
    s = s.slice(0, hdrClose + 9) + '\n' + link + '\n' + s.slice(hdrClose + 9);
  } else {
    // After opening <body>
    const bi = lower.indexOf('<body');
    if (bi !== -1){
      const gt = lower.indexOf('>', bi);
      if (gt !== -1){
        s = s.slice(0, gt+1) + '\n' + link + '\n' + s.slice(gt+1);
      } else {
        s += '\n' + link + '\n';
      }
    } else {
      s += '\n' + link + '\n';
    }
  }

  fs.writeFileSync(fp, s, 'utf8');
  return { file: fp, status: 'patched' };
}

for (const f of files){
  const r = patch(path.join(root, f));
  console.log(`${r.status.toUpperCase()}: ${r.file}`);
}
