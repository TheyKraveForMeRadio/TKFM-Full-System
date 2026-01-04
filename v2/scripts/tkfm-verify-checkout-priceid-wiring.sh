#!/usr/bin/env bash
set -euo pipefail

F="${1:-netlify/functions/create-checkout-session.js}"
if [ ! -f "$F" ]; then
  echo "MISSING: $F"
  exit 1
fi

echo "== CHECK: resolver present =="
grep -n "TKFM_STRIPE_LOOKUP_FALLBACK" "$F" && echo "OK" || { echo "FAIL"; exit 2; }

echo "== CHECK: resolver used =="
if grep -n "await tkfmResolvePriceId(planId)" "$F"; then
  echo "OK"
else
  echo "FAIL: resolver not used (search for priceId assignment and replace with await tkfmResolvePriceId(planId))"
  exit 3
fi
