#!/usr/bin/env bash
set -euo pipefail

# TKFM: Checkout QA through Netlify Dev (8888) and direct functions (9999)
cd "$(dirname "$0")/.."

echo "== Stripe mode (Netlify Dev / or Functions Serve) =="
curl -sS http://localhost:8888/.netlify/functions/debug-stripe-env | tr -d '\r' || true
echo
curl -sS http://localhost:9999/.netlify/functions/debug-stripe-env | tr -d '\r' || true
echo

echo "== Test create-checkout-session via 8888 (should be ok:true,url) =="
for k in ai_drops_starter_monthly label_studio_credits_25 podcast_interview; do
  echo "== $k =="
  curl -sS -H "content-type: application/json" -X POST \
    --data "{\"lookup_key\":\"$k\",\"planId\":\"$k\"}" \
    http://localhost:8888/.netlify/functions/create-checkout-session | tr -d '\r'
  echo
done

echo "== If any returned ok:false, re-run with -i to see status/body =="
