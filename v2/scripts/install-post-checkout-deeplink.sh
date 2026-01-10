#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/post-checkout-deeplink-$STAMP"
mkdir -p "$BK" js

echo "== TKFM: Post-checkout DeepLink + Auto-Submit Router =="
echo "Backup dir: $BK"
echo

# Backup & install JS
if [ -f "js/tkfm-post-checkout-deeplink.js" ]; then
  cp -p "js/tkfm-post-checkout-deeplink.js" "$BK/tkfm-post-checkout-deeplink.js"
fi

# If patch files exist (after unzip), they will be in js/ and root.
# Nothing else to do here for the JS.

# Install/replace post-checkout.html safely
if [ -f "post-checkout.html" ]; then
  cp -p "post-checkout.html" "$BK/post-checkout.html"
fi

# If the patch provided a fresh post-checkout.html, keep it as authoritative.
# But if user already has one, ensure it includes our script.
if [ -f "post-checkout.html" ]; then
  if ! grep -qi "tkfm-post-checkout-deeplink\.js" "post-checkout.html"; then
    awk '
      BEGIN{done=0}
      {
        if (!done && tolower($0) ~ /<\/body>/) {
          print "  <script src=\"/js/tkfm-post-checkout-deeplink.js\"></script>"
          done=1
        }
        print $0
      }
    ' post-checkout.html > post-checkout.html.__tmp__
    mv post-checkout.html.__tmp__ post-checkout.html
    echo "OK: injected router script into post-checkout.html"
  else
    echo "OK: post-checkout.html already includes router script"
  fi
else
  echo "FAIL: post-checkout.html missing after unzip."
  exit 1
fi

echo
echo "NOTE:"
echo "- Your Stripe success_url should point to /post-checkout.html?planId=<planId>&session_id={CHECKOUT_SESSION_ID}"
echo "- This router then sends buyer to the right engine with ?submit=1&lane=<planId>"
echo
echo "DONE."
