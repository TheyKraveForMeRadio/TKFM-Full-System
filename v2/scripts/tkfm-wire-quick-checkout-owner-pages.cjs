#!/usr/bin/env node
/* TKFM: wire /js/tkfm-quick-checkout.js into owner pages (root)
   Targets:
     owner-boost-analytics.html
     owner-boost-dashboard.html
     owner-paid-lane-inbox.html
*/
const fs = require('fs');
const path = require('path');

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

const targets = [
  'owner-boost-analytics.html',
  'owner-boost-dashboard.html',
  'owner-paid-lane-inbox.html',
];

const SCRIPT = '  <script src="/js/tkfm-quick-checkout.js"></script>\n';

function patchFile(fp) {
  if (!fs.existsSync(fp)) {
    console.log(`SKIP: missing ${path.basename(fp)}`);
    return { ok: true, skipped: true };
  }
  let s = fs.readFileSync(fp, 'utf8');
  if (s.includes('/js/tkfm-quick-checkout.js')) {
    console.log(`OK: already wired ${path.basename(fp)}`);
    return { ok: true, already: true };
  }

  if (s.match(/<\/body>/i)) {
    s = s.replace(/<\/body>/i, `${SCRIPT}</body>`);
  } else {
    s += `\n${SCRIPT}`;
  }

  fs.writeFileSync(fp, s, 'utf8');
  console.log(`PATCHED: ${path.basename(fp)}`);
  return { ok: true };
}

for (const f of targets) {
  const fp = path.join(root, f);
  patchFile(fp);
}

process.exit(0);
