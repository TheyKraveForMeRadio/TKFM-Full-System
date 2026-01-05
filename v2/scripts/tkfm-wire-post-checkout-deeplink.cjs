#!/usr/bin/env node
/* TKFM: wire /js/tkfm-post-checkout-deeplink.js into post-checkout.html */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const fp = path.join(root, 'post-checkout.html');

const SCRIPT = '  <script src="/js/tkfm-post-checkout-deeplink.js"></script>\n';

if (!fs.existsSync(fp)) {
  console.log('SKIP: missing post-checkout.html');
  process.exit(0);
}

let s = fs.readFileSync(fp, 'utf8');
if (s.includes('/js/tkfm-post-checkout-deeplink.js')) {
  console.log('OK: post-checkout already wired');
  process.exit(0);
}

if (s.match(/<\/body>/i)) {
  s = s.replace(/<\/body>/i, `${SCRIPT}</body>`);
} else {
  s += `\n${SCRIPT}`;
}

fs.writeFileSync(fp, s, 'utf8');
console.log('PATCHED: post-checkout.html');
process.exit(0);
