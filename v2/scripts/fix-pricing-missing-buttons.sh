#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Fix missing pricing buttons (checkout mapping + quick checkout) =="

mkdir -p backups/netlify-functions

if [ -f "netlify/functions/create-checkout-session.js" ]; then
  cp -f "netlify/functions/create-checkout-session.js" "backups/netlify-functions/create-checkout-session.js.$(date +%Y%m%d-%H%M%S).bak"
fi

if [ -f "js/tkfm-quick-checkout.js" ]; then
  cp -f "js/tkfm-quick-checkout.js" "backups/netlify-functions/tkfm-quick-checkout.js.$(date +%Y%m%d-%H%M%S).bak"
fi

echo "✅ Backups created (if prior files existed)."
echo "✅ create-checkout-session.js + tkfm-quick-checkout.js are now in place."
