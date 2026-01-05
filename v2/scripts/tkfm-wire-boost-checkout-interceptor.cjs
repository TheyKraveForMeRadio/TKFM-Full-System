#!/usr/bin/env node
/**
 * TKFM: Wire boost checkout interceptor script into pages (idempotent).
 * Inserts:
 *   <script defer src="/js/tkfm-boost-checkout.js"></script>
 * BEFORE tkfm-quick-checkout.js if present, else before </head>.
 *
 * Usage:
 *   node scripts/tkfm-wire-boost-checkout-interceptor.cjs .
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';

const files = [
  'rotation-boost.html',
  'dashboard.html',
  'radio-hub.html',
  'pricing.html',
  'index.html',
  'owner-paid-lane-inbox.html',
  'owner-boost-dashboard.html',
  'owner-boost-analytics.html',
  'owner-boost-checkout-debug.html',
];

const MARK = '<!-- TKFM: BOOST CHECKOUT INTERCEPTOR -->';
const TAG = `${MARK}\n<script defer src="/js/tkfm-boost-checkout.js"></script>\n`;

function patch(fp) {
  if (!fs.existsSync(fp)) return { file: fp, status: 'missing' };
  let s = fs.readFileSync(fp, 'utf8');
  if (s.includes(MARK) || s.includes('/js/tkfm-boost-checkout.js')) return { file: fp, status: 'already' };

  const lower = s.toLowerCase();
  const quickIdx = lower.indexOf('/js/tkfm-quick-checkout.js');
  if (quickIdx !== -1) {
    const scriptOpen = lower.lastIndexOf('<script', quickIdx);
    if (scriptOpen !== -1) {
      s = s.slice(0, scriptOpen) + TAG + s.slice(scriptOpen);
      fs.writeFileSync(fp, s, 'utf8');
      return { file: fp, status: 'patched' };
    }
  }

  const headClose = lower.indexOf('</head>');
  if (headClose !== -1) {
    s = s.slice(0, headClose) + TAG + s.slice(headClose);
    fs.writeFileSync(fp, s, 'utf8');
    return { file: fp, status: 'patched' };
  }

  // fallback append
  s += '\n' + TAG;
  fs.writeFileSync(fp, s, 'utf8');
  return { file: fp, status: 'patched' };
}

for (const f of files) {
  const r = patch(path.join(root, f));
  console.log(`${r.status.toUpperCase()}: ${r.file}`);
}
