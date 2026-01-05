#!/usr/bin/env bash
set -euo pipefail

# Verifies:
#  - function file exists
#  - interceptor js exists
#  - key pages include interceptor script

[ -f netlify/functions/create-boost-checkout-session.js ] || { echo "FAIL: missing netlify/functions/create-boost-checkout-session.js"; exit 2; }
[ -f js/tkfm-boost-checkout.js ] || { echo "FAIL: missing js/tkfm-boost-checkout.js"; exit 3; }

FILES=(rotation-boost.html dashboard.html radio-hub.html pricing.html index.html owner-paid-lane-inbox.html owner-boost-dashboard.html owner-boost-analytics.html owner-boost-checkout-debug.html)

MISS=0
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    if grep -q "/js/tkfm-boost-checkout.js" "$f"; then
      echo "OK: $f"
    else
      echo "FAIL: $f missing interceptor script"
      MISS=$((MISS+1))
    fi
  else
    echo "WARN: missing $f (skipping)"
  fi
done

if [ "$MISS" -gt 0 ]; then
  echo "FAIL: $MISS files missing interceptor"
  exit 4
fi

echo "DONE"
