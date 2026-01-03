#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:8888}"
EMAIL="${2:-test@example.com}"
PLAN="${3:-video_monthly_visuals}"

echo "== TKFM: Post-checkout routing smoke test =="
echo "BASE: $BASE"
echo "PLAN: $PLAN"
echo

# 1) Checkout endpoint returns url
OUT="$(curl -s "$BASE/.netlify/functions/create-checkout-session" -X POST -H "content-type: application/json" -d "{\"planId\":\"$PLAN\",\"email\":\"$EMAIL\"}")"
echo "$OUT" | head -c 220; echo

if echo "$OUT" | grep -q '"ok":true'; then
  echo "OK checkout session created."
else
  echo "FAIL checkout session."
  exit 1
fi

echo
echo "Now open this after you complete checkout:"
echo "$BASE/post-checkout.html?planId=$PLAN&session_id=MANUAL"
