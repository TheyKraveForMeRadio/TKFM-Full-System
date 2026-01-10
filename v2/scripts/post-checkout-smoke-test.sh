#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Post-checkout smoke test =="
base="${1:-http://localhost:8888}"

if [ ! -f "post-checkout.html" ]; then
  echo "FAIL post-checkout.html missing"
  exit 1
fi

grep -q "tkfm-post-checkout.js" post-checkout.html && echo "OK   post-checkout includes tkfm-post-checkout.js" || { echo "FAIL post-checkout missing js include"; exit 1; }

if [ -f "netlify/functions/create-checkout-session.js" ]; then
  grep -q "post-checkout.html" netlify/functions/create-checkout-session.js && echo "OK   create-checkout-session routes to post-checkout" || echo "WARN create-checkout-session missing post-checkout string (verify manually)"
fi

echo "OK   Try manual preview:"
echo "     $base/post-checkout.html?planId=video_monthly_visuals&session_id=TEST"
echo "DONE."
