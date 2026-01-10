#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM NEXT POWER MOVE: FIX PROD 404 PAGES + FIX 4KB FUNCTIONS + FIX PRICE BUTTONS =="

# 0) sanity
netlify status >/dev/null

# 1) export Stripe price ids into a public JSON map (safe: price ids only)
./scripts/tkfm-netlify-export-stripe-prices-to-json.sh

# 2) patch quick-checkout to use the JSON map (if file exists)
QC="js/tkfm-quick-checkout.js"
if [ -f "$QC" ] && ! grep -q "tkfm-price-map.json" "$QC"; then
  echo "Patching $QC to load /tkfm-price-map.json ..."
  tmp="/tmp/tkfm_qc_patch.js"
  cat > "$tmp" <<'QCHEAD'
/* TKFM QUICK CHECKOUT (patched): loads /tkfm-price-map.json to avoid Netlify env bloat */
let __tkfmPriceMap = null;
async function __tkfmLoadPriceMap(){
  if (__tkfmPriceMap) return __tkfmPriceMap;
  try {
    const r = await fetch('/tkfm-price-map.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('map http '+r.status);
    __tkfmPriceMap = await r.json();
  } catch (e) {
    __tkfmPriceMap = null;
  }
  return __tkfmPriceMap;
}
QCHEAD
  cat "$QC" >> "$tmp"
  mv "$tmp" "$QC"
fi

# 3) delete STRIPE_PRICE_/STRIPE_PRODUCT_ from Netlify prod/functions (4KB fix)
./scripts/tkfm-netlify-delete-stripe-price-envs-prod-functions.sh

# 4) ensure Stripe secret is LIVE in production/functions
./scripts/tkfm-netlify-set-stripe-secret-production-functions.sh

# 5) rebuild static multipage to dist
npm run tw:build
bash ./scripts/tkfm-build-static-multipage.sh

# 6) deploy prod
netlify deploy --prod

# 7) verify
curl -s -o /dev/null -w "pricing.html status=%{http_code}\n" https://tkfmradio.com/pricing.html
curl -s -o /dev/null -w "radio-hub.html status=%{http_code}\n" https://tkfmradio.com/radio-hub.html
curl -s -o /dev/null -w "create-checkout-session status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/create-checkout-session

echo "DONE"
