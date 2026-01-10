#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify post-checkout deeplink router installed =="

fail=0

[ -f "js/tkfm-post-checkout-deeplink.js" ] || { echo "FAIL missing js/tkfm-post-checkout-deeplink.js"; fail=1; }
[ -f "post-checkout.html" ] || { echo "FAIL missing post-checkout.html"; fail=1; }

if [ -f "post-checkout.html" ]; then
  grep -qi "tkfm-post-checkout-deeplink\.js" post-checkout.html || { echo "FAIL post-checkout.html missing script include"; fail=1; }
fi

# Best-effort check: does create-checkout-session reference post-checkout?
if [ -f "netlify/functions/create-checkout-session.js" ]; then
  if grep -qi "post-checkout\.html" netlify/functions/create-checkout-session.js; then
    echo "OK   create-checkout-session.js references post-checkout.html"
  else
    echo "WARN create-checkout-session.js does NOT mention post-checkout.html"
    echo "     (If your success_url is different, update it to use /post-checkout.html?planId=... )"
  fi
else
  echo "WARN netlify/functions/create-checkout-session.js not found (cannot verify success_url)"
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL=$fail"
  exit 1
fi
