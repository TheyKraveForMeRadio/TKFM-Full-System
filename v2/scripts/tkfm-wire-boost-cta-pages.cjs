#!/usr/bin/env node
/**
 * TKFM: Wire Rotation Boost CTA blocks into core pages (idempotent).
 * Inserts a marked block before </body> (or </main>, fallback).
 *
 * Usage:
 *   node scripts/tkfm-wire-boost-cta-pages.cjs .
 */
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';

const targets = [
  'radio-hub.html',
  'owner-paid-lane-inbox.html',
  'owner-boost-dashboard.html',
  'owner-boost-analytics.html',
];

const MARK_START = '<!-- TKFM: BOOST CTA START -->';
const MARK_END = '<!-- TKFM: BOOST CTA END -->';

const block = `${MARK_START}
<section class="tkfm-boost-cta" style="
  margin:24px auto; max-width:1100px;
  background: rgba(2,6,23,0.85);
  border: 1px solid rgba(168,85,247,0.35);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.35);
">
  <div style="display:flex; flex-wrap:wrap; gap:14px; align-items:flex-start; justify-content:space-between;">
    <div style="min-width:260px; flex:1;">
      <div style="letter-spacing:.12em; font-size:12px; color:#22d3ee; text-transform:uppercase;">Paid Lane</div>
      <h2 style="margin:6px 0 8px; font-size:26px; color:#a855f7; line-height:1.15;">Rotation Boost — Radio‑TV Featured</h2>
      <p style="margin:0; color:rgba(255,255,255,0.82); font-size:14px;">
        Priority placement on the <b>Radio‑TV Featured</b> rail. Perfect for single drops, videos, and rollout campaigns.
        <b>Submit immediately after checkout.</b>
      </p>
    </div>

    <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:flex-end;">
      <div style="width:260px; background: rgba(15,23,42,0.6); border:1px solid rgba(236,72,153,0.35); border-radius:16px; padding:14px;">
        <div style="display:flex; align-items:baseline; justify-content:space-between; gap:10px;">
          <div style="font-weight:800; color:#ec4899;">BOOST — 7 DAYS</div>
          <div style="font-weight:900; color:#facc15; font-size:20px;">$99</div>
        </div>
        <ul style="margin:10px 0 12px 18px; padding:0; color:rgba(255,255,255,0.82); font-size:13px; line-height:1.35;">
          <li>7‑day priority placement</li>
          <li>Single drops + new videos</li>
          <li>Instant submit after checkout</li>
        </ul>
        <button class="tkfm-checkout"
          data-plan="rotation_boost_7d"
          data-feature="rotation_boost_7d"
          style="width:100%; border:0; cursor:pointer; border-radius:12px; padding:10px 12px; font-weight:900;
            background: linear-gradient(90deg, #a855f7, #ec4899); color:#020617;">
          Buy Boost (7d)
        </button>
        <div style="margin-top:8px; font-size:11px; color:rgba(255,255,255,0.55);">
          Lookup key: <code style="color:#22d3ee;">rotation_boost_7d</code>
        </div>
      </div>

      <div style="width:260px; background: rgba(15,23,42,0.6); border:1px solid rgba(34,211,238,0.35); border-radius:16px; padding:14px;">
        <div style="display:flex; align-items:baseline; justify-content:space-between; gap:10px;">
          <div style="font-weight:800; color:#22d3ee;">BOOST — 30 DAYS</div>
          <div style="font-weight:900; color:#facc15; font-size:20px;">$299</div>
        </div>
        <ul style="margin:10px 0 12px 18px; padding:0; color:rgba(255,255,255,0.82); font-size:13px; line-height:1.35;">
          <li>30‑day priority placement</li>
          <li>Campaign + project rollouts</li>
          <li>Instant submit after checkout</li>
        </ul>
        <button class="tkfm-checkout"
          data-plan="rotation_boost_30d"
          data-feature="rotation_boost_30d"
          style="width:100%; border:0; cursor:pointer; border-radius:12px; padding:10px 12px; font-weight:900;
            background: linear-gradient(90deg, #22d3ee, #3b82f6); color:#020617;">
          Buy Boost (30d)
        </button>
        <div style="margin-top:8px; font-size:11px; color:rgba(255,255,255,0.55);">
          Lookup key: <code style="color:#22d3ee;">rotation_boost_30d</code>
        </div>
      </div>
    </div>
  </div>
</section>
${MARK_END}`;

function patchFile(fp) {
  if (!fs.existsSync(fp)) return { file: fp, status: 'missing' };
  let s = fs.readFileSync(fp, 'utf8');

  if (s.includes(MARK_START) && s.includes(MARK_END)) {
    return { file: fp, status: 'already' };
  }

  const insertBefore = (tag) => {
    const idx = s.toLowerCase().lastIndexOf(tag);
    if (idx === -1) return false;
    s = s.slice(0, idx) + '\n' + block + '\n' + s.slice(idx);
    return true;
  };

  // prefer before </main> if exists to keep layout consistent
  let ok = insertBefore('</main>');
  if (!ok) ok = insertBefore('</body>');
  if (!ok) ok = insertBefore('</html>');
  if (!ok) {
    // fallback append
    s += '\n' + block + '\n';
  }

  fs.writeFileSync(fp, s, 'utf8');
  return { file: fp, status: 'patched' };
}

const results = [];
for (const t of targets) {
  const fp = path.join(root, t);
  results.push(patchFile(fp));
}

for (const r of results) {
  console.log(`${r.status.toUpperCase()}: ${r.file}`);
}
