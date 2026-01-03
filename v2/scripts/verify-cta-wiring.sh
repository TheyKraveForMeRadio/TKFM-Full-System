#!/usr/bin/env bash
set -euo pipefail

echo "== radio-tv.html scripts =="
grep -n "tkfm-quick-checkout.js" -n radio-tv.html || true
grep -n "tkfm-featured-cta-injector.js" -n radio-tv.html || true

echo
echo "== checkout PRICE_MAP =="
if [ -f netlify/functions/create-checkout-session.js ]; then
  grep -n "video_creator_pass_monthly" -n netlify/functions/create-checkout-session.js || true
  grep -n "video_monthly_visuals" -n netlify/functions/create-checkout-session.js || true
  grep -n "podcast_interview" -n netlify/functions/create-checkout-session.js || true
else
  echo "missing netlify/functions/create-checkout-session.js"
fi

echo
echo "✅ verify complete"
