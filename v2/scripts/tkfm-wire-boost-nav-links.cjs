#!/usr/bin/env node
/**
 * TKFM: Wire "Rotation Boost" nav/button into common pages (idempotent).
 * Inserts a small CTA link near top of <body> (after first <header> or after <body>).
 *
 * Usage:
 *   node scripts/tkfm-wire-boost-nav-links.cjs .
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';

const targets = [
  'index.html',
  'pricing.html',
  'radio-hub.html',
  'feature-engine.html',
  'social-engine.html',
  'dj-mixtape-hosting.html',
  'label-home.html',
  'label-hub.html',
  'dashboard.html',
];

const MARK = '<!-- TKFM: BOOST NAV LINK -->';
const link = `${MARK}
<a href="/rotation-boost.html" class="tkfm-boost-nav-link" style="
  position: relative;
  display:inline-flex;
  align-items:center;
  gap:10px;
  margin: 10px 0 0;
  padding: 10px 14px;
  border-radius: 14px;
  text-decoration:none;
  font-weight: 900;
  color: #020617;
  background: linear-gradient(90deg,#a855f7,#ec4899);
  box-shadow: 0 10px 24px rgba(0,0,0,0.35);
">
  <span style="letter-spacing:.12em; font-size:12px; text-transform:uppercase;">Paid Lane</span>
  <span style="font-size:14px;">Rotation Boost</span>
  <span style="opacity:.9; font-size:12px;">$99 / $299</span>
</a>
`;

function patch(fp) {
  if (!fs.existsSync(fp)) return { file: fp, status: 'missing' };
  let s = fs.readFileSync(fp, 'utf8');
  if (s.includes(MARK)) return { file: fp, status: 'already' };

  const lower = s.toLowerCase();

  // Prefer after </header>
  const hdrClose = lower.indexOf('</header>');
  if (hdrClose !== -1) {
    s = s.slice(0, hdrClose + 9) + '\n' + link + '\n' + s.slice(hdrClose + 9);
  } else {
    // Else after opening <body ...>
    const bi = lower.indexOf('<body');
    if (bi !== -1) {
      const gt = lower.indexOf('>', bi);
      if (gt !== -1) {
        s = s.slice(0, gt + 1) + '\n' + link + '\n' + s.slice(gt + 1);
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

for (const t of targets) {
  const r = patch(path.join(root, t));
  console.log(`${r.status.toUpperCase()}: ${r.file}`);
}
