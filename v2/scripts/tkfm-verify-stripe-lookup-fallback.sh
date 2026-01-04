#!/usr/bin/env bash
set -euo pipefail

F="${1:-netlify/functions/create-checkout-session.js}"
if [ ! -f "$F" ]; then
  echo "MISSING: $F"
  exit 1
fi

grep -n "TKFM_STRIPE_LOOKUP_FALLBACK" "$F" && echo "OK: resolver present" || { echo "FAIL: resolver missing"; exit 2; }

if grep -q "await tkfmResolvePriceId(planId)" "$F"; then
  echo "OK: resolver is used for planId (auto-wired)"
else
  echo "WARN: resolver present but not auto-wired."
  echo "      Search for PRICE_MAP[planId] and replace that assignment with:"
  echo "      const priceId = await tkfmResolvePriceId(planId);"
fi
