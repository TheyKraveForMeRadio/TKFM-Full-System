#!/usr/bin/env node
/**
 * TKFM: Wire Boost Status panel into dashboard.html and rotation-boost.html (idempotent)
 *
 * Adds:
 *  - a Boost Status section (div#tkfmBoostStatusPanel + div#tkfmBoostStatusOut)
 *  - script include: /js/tkfm-boost-status-ui.js
 *
 * Usage:
 *   node scripts/tkfm-wire-boost-status-ui.cjs .
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';

const TARGETS = [
  path.join(root, 'dashboard.html'),
  path.join(root, 'rotation-boost.html'),
];

const PANEL_MARK = '<!-- TKFM: BOOST STATUS PANEL -->';
const SCRIPT_SRC = '/js/tkfm-boost-status-ui.js';

const panelHtml = `${PANEL_MARK}
<section id="tkfmBoostStatusPanel" style="
  margin:20px auto; max-width:1100px;
  background: rgba(2,6,23,0.82);
  border: 1px solid rgba(168,85,247,0.28);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
">
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
    <div>
      <div style="letter-spacing:.12em;font-size:12px;color:#a855f7;text-transform:uppercase;">My Boost</div>
      <h2 style="margin:6px 0 0;font-size:20px;color:rgba(255,255,255,.92);">Boost Status</h2>
      <div style="margin-top:6px;color:rgba(255,255,255,.68);font-size:12px;line-height:1.4;">
        Shows active Boost entitlements and days left. Expires auto-clean.
      </div>
    </div>
    <a href="/rotation-boost.html" style="
      display:inline-flex;align-items:center;justify-content:center;gap:10px;
      padding:10px 12px;border-radius:14px;font-weight:900;text-decoration:none;
      background: linear-gradient(90deg, #a855f7, #ec4899); color:#020617;
      box-shadow: 0 10px 24px rgba(0,0,0,0.35);
    ">Buy / Submit Boost</a>
  </div>

  <div id="tkfmBoostStatusOut" style="margin-top:12px;"></div>
</section>
`;

function ensureScript(s){
  if (s.includes(SCRIPT_SRC)) return { s, changed:false };
  const lower = s.toLowerCase();
  const idx = lower.lastIndexOf('</body>');
  const tag = `\n<script src="${SCRIPT_SRC}"></script>\n`;
  if (idx !== -1) return { s: s.slice(0, idx) + tag + s.slice(idx), changed:true };
  return { s: s + tag, changed:true };
}

function injectPanel(s){
  if (s.includes(PANEL_MARK)) return { s, changed:false };
  const lower = s.toLowerCase();
  const idxMain = lower.lastIndexOf('</main>');
  const idxBody = lower.lastIndexOf('</body>');
  const insertAt = idxMain !== -1 ? idxMain : (idxBody !== -1 ? idxBody : s.length);
  return { s: s.slice(0, insertAt) + '\n' + panelHtml + '\n' + s.slice(insertAt), changed:true };
}

for (const fp of TARGETS){
  if (!fs.existsSync(fp)) {
    console.log('MISSING:', path.relative(root, fp));
    continue;
  }
  let s = fs.readFileSync(fp, 'utf8');
  let changed = false;

  const r1 = injectPanel(s); s = r1.s; changed = changed || r1.changed;
  const r2 = ensureScript(s); s = r2.s; changed = changed || r2.changed;

  if (changed) {
    fs.writeFileSync(fp, s, 'utf8');
    console.log('PATCHED:', path.relative(root, fp));
  } else {
    console.log('ALREADY:', path.relative(root, fp));
  }
}
