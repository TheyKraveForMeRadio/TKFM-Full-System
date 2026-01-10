#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Sitewide Paid Lane Flow Lock =="

fail=0
need(){ [ -f "$1" ] || { echo "FAIL missing $1"; fail=1; }; }

need "js/tkfm-paid-lane-modal.js"
need "post-checkout.html"
need "js/tkfm-post-checkout-deeplink.js"

# Count how many pages include modal script
count=$(grep -RIn --include="*.html" "tkfm-paid-lane-modal.js" . | wc -l | tr -d " ")
echo "INFO modal script includes: $count"

# Quick check post-checkout script reference
grep -q "tkfm-post-checkout-deeplink.js" post-checkout.html || { echo "FAIL post-checkout missing router script"; fail=1; }

if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
