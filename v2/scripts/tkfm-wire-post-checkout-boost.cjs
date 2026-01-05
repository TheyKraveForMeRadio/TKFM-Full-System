#!/usr/bin/env node
/**
 * TKFM: Ensure post-checkout.html includes tkfm-post-checkout-boost.js
 * If post-checkout.html missing, creates it from patch file content (already provided).
 *
 * Usage:
 *   node scripts/tkfm-wire-post-checkout-boost.cjs .
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';
const fp = path.join(root, 'post-checkout.html');

const MARK = '/js/tkfm-post-checkout-boost.js';

function ensureScript(s) {
  if (s.includes(MARK)) return { s, changed:false };
  const lower = s.toLowerCase();
  const headClose = lower.indexOf('</body>');
  const tag = `\n<script src="${MARK}"></script>\n`;
  if (headClose !== -1) {
    s = s.slice(0, headClose) + tag + s.slice(headClose);
    return { s, changed:true };
  }
  s += tag;
  return { s, changed:true };
}

if (fs.existsSync(fp)) {
  let s = fs.readFileSync(fp, 'utf8');
  const r = ensureScript(s);
  if (r.changed) {
    fs.writeFileSync(fp, r.s, 'utf8');
    console.log('PATCHED: post-checkout.html');
  } else {
    console.log('ALREADY: post-checkout.html');
  }
} else {
  console.log('MISSING: post-checkout.html (create by copying patch file into repo root)');
  // We do not auto-create here to avoid overwriting user content silently.
  // The patch includes a post-checkout.html file; unzip will place it if missing.
}
