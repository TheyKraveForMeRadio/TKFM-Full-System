/* TKFM: Wire Featured tracking (impressions + clicks)

   1) Ensure radio-hub.html includes /js/tkfm-featured-track.js
   2) Patch js/tkfm-radio-tv-featured.js to emit data-featured-id attributes
      using scripts/tkfm-patch-radio-tv-featured-loader.cjs

   Usage:
     node scripts/tkfm-wire-featured-tracking.cjs .
*/
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.argv[2] || '.';

function read(p){ return fs.readFileSync(p, 'utf8'); }
function write(p, s){ fs.writeFileSync(p, s, 'utf8'); }

function ensureRadioHubIncludesTracker() {
  const f = path.join(ROOT, 'radio-hub.html');
  if (!fs.existsSync(f)) { console.log('SKIP: radio-hub.html not found'); return; }
  let s = read(f);
  if (s.includes('/js/tkfm-featured-track.js')) { console.log('OK: tracker already included in radio-hub.html'); return; }

  const tag = '\n  <script src="/js/tkfm-featured-track.js"></script>\n';
  if (s.match(/<\/body>/i)) s = s.replace(/<\/body>/i, tag + '</body>');
  else s += tag;

  write(f, s);
  console.log('OK: added tracker script to radio-hub.html');
}

function patchLoader() {
  const patcher = path.join(ROOT, 'scripts', 'tkfm-patch-radio-tv-featured-loader.cjs');
  if (!fs.existsSync(patcher)) {
    console.log('WARN: missing patcher script: ' + patcher);
    return;
  }
  const r = spawnSync(process.execPath, [patcher, ROOT], { stdio: 'inherit' });
  if (r.status !== 0) console.log('WARN: loader patcher returned non-zero (continuing)');
}

function main() {
  ensureRadioHubIncludesTracker();
  patchLoader();
}
main();
