#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: FIX PROD (pages + functions) =="

# 1) Prune Stripe PRICE/PRODUCT env vars ONLY for production/functions
bash ./scripts/tkfm-netlify-prune-stripe-env-prod-functions.sh production functions || true

# 2) Build + pack multipage dist
bash ./scripts/tkfm-build-static-multipage.sh

# 3) Deploy prod
netlify deploy --prod

# 4) Verify key pages exist
for p in pricing.html radio-hub.html rotation-boost.html post-checkout.html; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://tkfmradio.com/$p" || true)
  echo "$p status=$code"
done

# Pretty URLs
for p in pricing radio-hub rotation-boost post-checkout; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://tkfmradio.com/$p" || true)
  echo "$p status=$code"
done

# Functions should be NOT 404
code=$(curl -s -o /dev/null -w "%{http_code}" https://tkfmradio.com/.netlify/functions/create-checkout-session || true)
echo "create-checkout-session status=$code"
code=$(curl -s -o /dev/null -w "%{http_code}" https://tkfmradio.com/.netlify/functions/featured-media-track || true)
echo "featured-media-track status=$code"

echo "DONE"
