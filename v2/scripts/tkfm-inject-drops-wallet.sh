#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

TARGET="ai-drops-engine.html"

if [ ! -f "$TARGET" ]; then
  echo "ERROR: $TARGET not found in $(pwd)"
  exit 1
fi

mkdir -p js public/js
cp -f js/tkfm-drops-wallet.js public/js/tkfm-drops-wallet.js

if ! grep -q "TKFM_DROPS_WALLET_START" "$TARGET"; then
  perl -0777 -i -pe 's@(</body>)@<!-- TKFM_DROPS_WALLET_START -->\n<div style="max-width:1120px;margin:16px auto 0;color:#e5e7eb;padding:0 16px 40px">\n  <div style="border:1px solid rgba(34,211,238,.20);background:rgba(255,255,255,.03);border-radius:18px;padding:14px">\n    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">\n      <div style="font-weight:1000">Credits Wallet</div>\n      <div style="color:#94a3b8;font-size:12px">Credits: <b id="tkfmDropsCredits">0</b></div>\n    </div>\n    <div style="display:grid;gap:10px;margin-top:12px">\n      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">\n        <input id="tkfmDropName" placeholder="DJ / Station Name" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.22);background:rgba(2,6,23,.45);color:#e5e7eb" />\n        <input id="tkfmDropVibe" placeholder="Vibe (clean / hype / club)" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.22);background:rgba(2,6,23,.45);color:#e5e7eb" />\n        <select id="tkfmDropType" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.22);background:rgba(2,6,23,.45);color:#e5e7eb">\n          <option value="tag">DJ Tag</option>\n          <option value="id">Station ID</option>\n          <option value="sponsor">Sponsor Read</option>\n        </select>\n      </div>\n      <textarea id="tkfmDropOut" placeholder="Generate a script…" style="min-height:140px;padding:10px 12px;border-radius:12px;border:1px solid rgba(148,163,184,.22);background:rgba(2,6,23,.45);color:#e5e7eb"></textarea>\n      <div style="display:flex;gap:10px;flex-wrap:wrap">\n        <button id="tkfmDropGen" style="padding:10px 12px;border-radius:14px;border:1px solid rgba(34,211,238,.28);background:rgba(34,211,238,.12);color:#fff;font-weight:1000;cursor:pointer">Generate</button>\n        <button id="tkfmDropSave" style="padding:10px 12px;border-radius:14px;border:1px solid rgba(168,85,247,.28);background:rgba(168,85,247,.12);color:#fff;font-weight:1000;cursor:pointer">Save to History</button>\n        <button id="tkfmDropUse1" style="padding:10px 12px;border-radius:14px;border:1px solid rgba(250,204,21,.28);background:rgba(250,204,21,.12);color:#fff;font-weight:1000;cursor:pointer">Use 1 Credit</button>\n        <button id="tkfmDropClearHistory" style="padding:10px 12px;border-radius:14px;border:1px solid rgba(148,163,184,.22);background:rgba(255,255,255,.03);color:#fff;font-weight:1000;cursor:pointer">Clear History</button>\n      </div>\n      <div>\n        <div style="font-weight:1000;margin-top:10px">History</div>\n        <div id="tkfmDropsHistory"></div>\n      </div>\n    </div>\n  </div>\n</div>\n<!-- TKFM_DROPS_WALLET_END -->\n\n  <script src="/js/tkfm-drops-wallet.js?v=1"></script>\n$1@si' "$TARGET"
fi

echo "OK: Drops wallet injected into $TARGET"
