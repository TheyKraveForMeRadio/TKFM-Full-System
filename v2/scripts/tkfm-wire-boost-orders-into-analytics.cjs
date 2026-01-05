#!/usr/bin/env node
/**
 * TKFM: Inject Boost Orders panel into owner-boost-analytics.html (idempotent).
 * Adds:
 *  - container divs + refresh button
 *  - script tag for /js/tkfm-boost-orders-admin.js
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';
const fp = path.join(root, 'owner-boost-analytics.html');

if (!fs.existsSync(fp)) {
  console.log('MISSING: owner-boost-analytics.html');
  process.exit(0);
}

let s = fs.readFileSync(fp, 'utf8');
const MARK = '<!-- TKFM: BOOST ORDERS PANEL -->';
if (s.includes(MARK)) {
  console.log('ALREADY: owner-boost-analytics.html');
  process.exit(0);
}

const panel = `${MARK}
<section style="
  margin:20px auto; max-width:1100px;
  background: rgba(2,6,23,0.82);
  border: 1px solid rgba(34,211,238,0.30);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
">
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
    <div>
      <div style="letter-spacing:.12em;font-size:12px;color:#22d3ee;text-transform:uppercase;">Revenue</div>
      <h2 style="margin:6px 0 0;font-size:20px;color:rgba(255,255,255,.92);">Boost Orders (Stripe)</h2>
      <div style="margin-top:6px;color:rgba(255,255,255,.68);font-size:12px;line-height:1.4;">
        Server-recorded orders (anti-fake). Totals + last 50 orders.
      </div>
    </div>
    <button id="tkfmBoostOrdersRefresh" style="
      border:0; cursor:pointer; border-radius:14px; padding:10px 12px; font-weight:900;
      background: linear-gradient(90deg, #22d3ee, #3b82f6); color:#020617;
      box-shadow: 0 10px 24px rgba(0,0,0,0.35);
    ">Refresh</button>
  </div>

  <div id="tkfmBoostOrdersTotals" style="margin-top:12px;"></div>

  <div style="margin-top:12px; border-radius:16px; border:1px solid rgba(148,163,184,.18); background: rgba(15,23,42,.55); overflow:auto;">
    <div id="tkfmBoostOrdersTable"></div>
  </div>

  <pre id="tkfmBoostOrdersOut" style="margin-top:12px; font-size:12px; color:rgba(255,255,255,.65);">Loading…</pre>
</section>
`;

function injectBefore(tag){
  const lower = s.toLowerCase();
  const idx = lower.lastIndexOf(tag);
  if (idx === -1) return false;
  s = s.slice(0, idx) + '\n' + panel + '\n' + s.slice(idx);
  return true;
}

let ok = injectBefore('</main>');
if (!ok) ok = injectBefore('</body>');
if (!ok) ok = injectBefore('</html>');
if (!ok) s += '\n' + panel + '\n';

// add script include
if (!s.includes('/js/tkfm-boost-orders-admin.js')) {
  const lower = s.toLowerCase();
  const headClose = lower.indexOf('</body>');
  const tag = `\n<script src="/js/tkfm-boost-orders-admin.js"></script>\n`;
  if (headClose !== -1) s = s.slice(0, headClose) + tag + s.slice(headClose);
  else s += tag;
}

fs.writeFileSync(fp, s, 'utf8');
console.log('PATCHED: owner-boost-analytics.html');
