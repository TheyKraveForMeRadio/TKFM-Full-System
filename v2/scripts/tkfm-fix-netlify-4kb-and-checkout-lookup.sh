#!/usr/bin/env bash
set -euo pipefail

# TKFM NEXT POWER MOVE:
# 1) Force STRIPE_SECRET_KEY into Netlify (production/functions) to stop test/live mismatch
# 2) Ensure ALL Stripe Prices referenced by Netlify STRIPE_PRICE_* have lookup_key set (plan ids)
# 3) Prune STRIPE_PRICE_* env vars to get under 4KB limit (so functions deploy)
# 4) Deploy prod + verify functions are live (not 404)

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "FAIL: export STRIPE_SECRET_KEY=sk_live_... first"
  exit 2
fi
if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

echo "== STEP 0: Ensure site linked =="
netlify status >/dev/null 2>&1 || true
netlify link >/dev/null 2>&1 || true

echo "== STEP 1: Set STRIPE_SECRET_KEY in Netlify (production/functions) =="
./scripts/tkfm-netlify-env-set-safe.sh STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY" production functions

echo "== STEP 2: Ensure Stripe lookup keys from existing price envs =="
./scripts/tkfm-stripe-ensure-lookup-from-netlify-prices.sh

echo "== STEP 3: Prune Stripe price env vars to fix 4KB Lambda limit =="
./scripts/tkfm-netlify-prune-stripe-price-envs.sh

echo "== STEP 4: Audit env size (must be <= 4096) =="
./scripts/tkfm-netlify-env-audit-size.sh --context production --scope functions || true

echo "== STEP 5: Deploy PROD =="
netlify deploy --prod

echo "== STEP 6: Verify functions (expect 400/405, NOT 404) =="
curl -s -o /dev/null -w "create-checkout-session status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/create-checkout-session
curl -s -o /dev/null -w "featured-media-track status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/featured-media-track
