#!/usr/bin/env bash
set -euo pipefail

# TKFM: Boost Go-Live (one command)
# - verifies secret scan
# - verifies Stripe boost prices exist + sets Netlify env (auto-fix creates prices with lookup_key if needed)
# - runs Boost E2E smoke
# - prints exact prod checklist steps
#
# Usage:
#   ./scripts/tkfm-boost-go-live.sh
#

say () { printf "\n== %s ==\n" "$1"; }

say "STEP 0: Repo secret scan"
if [ -x "./scripts/tkfm-secret-scan.sh" ]; then
  ./scripts/tkfm-secret-scan.sh
else
  echo "WARN: scripts/tkfm-secret-scan.sh missing (skip)"
fi

say "STEP 1: Verify Stripe + Netlify Boost setup"
set +e
OUT="$(./scripts/tkfm-boost-autowire-to-netlify.sh 2>&1)"
CODE="$?"
set -e

if [ "$CODE" -ne 0 ]; then
  echo "$OUT"
  echo "WARN: autowire failed. Attempting Stripe price ensure/create with lookup_key..."
  if [ -x "./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh" ]; then
    ./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh
    ./scripts/tkfm-boost-autowire-to-netlify.sh
  else
    echo "FAIL: missing scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh"
    exit 2
  fi
else
  echo "$OUT"
fi

say "STEP 2: Boost E2E smoke"
if [ -x "./scripts/tkfm-boost-e2e-smoke.sh" ]; then
  ./scripts/tkfm-boost-e2e-smoke.sh
else
  echo "WARN: scripts/tkfm-boost-e2e-smoke.sh missing (skip)"
fi

say "STEP 3: GO-LIVE CHECKLIST (PROD)"
cat << 'EOF'
1) Netlify env (Site settings -> Environment):
   - STRIPE_SECRET_KEY (live)
   - STRIPE_WEBHOOK_SECRET (live webhook signing secret)  [if you use webhooks]
   - STRIPE_PRODUCT_ROTATION_BOOST
   - STRIPE_PRICE_ROTATION_BOOST_7D
   - STRIPE_PRICE_ROTATION_BOOST_30D
   - TKFM_OWNER_KEY

2) Restart deploy (push a commit) then test:
   - /rotation-boost.html
   - Click Buy Boost (7d) -> Stripe checkout opens
   - Complete purchase -> returns to /post-checkout.html?session_id=...
   - Post-checkout should auto-unlock and show submit immediately

3) Confirm Featured rail priority:
   - /radio-tv.html and /radio-hub.html Featured rail shows boosted items first

4) Confirm tracking:
   - impressions + clicks record via featured-media-track
   - owner stats/analytics load with owner key

5) Confirm revenue panel:
   - /owner-boost-analytics.html shows orders + revenue
EOF

say "DONE"
