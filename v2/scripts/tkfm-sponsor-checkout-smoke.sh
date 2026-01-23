#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:9999}"
FN="$BASE/.netlify/functions/create-checkout-session"

echo "== TKFM SPONSOR CHECKOUT SMOKE =="
echo "Functions base: $BASE"
echo

for k in sponsor_city_monthly sponsor_takeover_monthly; do
  echo "-- $k"
  # send both planId and lookup_key so any backend variant works
  curl -sS -X POST "$FN" \
    -H "content-type: application/json" \
    -d "{\"lookup_key\":\"$k\",\"planId\":\"$k\"}" | cat
  echo
  echo
done
