/* TKFM: wire Boost Analytics link into owner pages (robust + idempotent)
   Usage: node scripts/tkfm-wire-owner-boost-analytics-link.cjs .
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';

const targets = [
  path.join(ROOT, 'owner-boost-dashboard.html'),
  path.join(ROOT, 'owner-paid-lane-inbox.html'),
  path.join(ROOT, 'owner-featured-manager.html')
];

function read(p){ return fs.readFileSync(p,'utf8'); }
function write(p,s){ fs.writeFileSync(p,s,'utf8'); }

const LINK = `<a href="/owner-boost-analytics.html"><button class="btn" type="button">Boost Analytics</button></a>`;

function hasLink(s){
  return /owner-boost-analytics\.html/i.test(s);
}

function patchFlexToolbar(s){
  if (hasLink(s)) return { s, changed:false };

  // Prefer the top toolbar: look for the FIRST div style that includes display:flex and gap
  const re = /<div[^>]*style="[^"]*display\s*:\s*flex[^"]*gap\s*:\s*\d+px[^"]*"[^>]*>/i;
  const m = s.match(re);
  if (m && m.index != null) {
    const idx = m.index + m[0].length;
    const out = s.slice(0, idx) + `\n        ${LINK}` + s.slice(idx);
    return { s: out, changed:true };
  }

  // Next: insert after a known nav button link
  const re2 = /(<a[^>]+href="\/owner-(?:boost-dashboard|paid-lane-inbox|featured-manager)\.html"[^>]*>\s*<button[^>]*class="btn"[^>]*>[^<]+<\/button>\s*<\/a>)/i;
  if (re2.test(s)) {
    const out = s.replace(re2, `$1\n        ${LINK}`);
    return { s: out, changed:true };
  }

  // Fallback: append near end of body (still usable)
  const out = s.replace(/<\/body>/i, `\n  <div style="max-width:1200px;margin:0 auto;padding:0 16px 16px;">${LINK}</div>\n</body>`);
  return { s: out, changed:true };
}

for (const f of targets) {
  if (!fs.existsSync(f)) continue;
  const before = read(f);
  const res = patchFlexToolbar(before);
  if (res.changed) write(f, res.s);
  console.log((res.changed ? 'OK:' : 'OK (no-op):') + ' ' + path.basename(f) + (res.changed ? ' linked' : ' already linked'));
}
