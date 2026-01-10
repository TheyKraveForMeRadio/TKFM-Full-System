#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify RADIO-TV Featured CTA bar =="

F="radio-tv.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

s1=$(grep -qiE 'tkfm-radio-tv-cta-bar\.js' "$F" && echo 1 || echo 0)
s2=$(grep -qiE 'tkfm-quick-checkout\.js' "$F" && echo 1 || echo 0)
s3=$(grep -qiE 'tkfm-paid-lane-submit\.js' "$F" && echo 1 || echo 0)
h1=$(grep -qiE 'id="tkfmRadioTvCtaHost"' "$F" && echo 1 || echo 0)
h2=$(grep -qiE 'id="tkfmFeaturedRailHost"' "$F" && echo 1 || echo 0)

echo "ctaScript=$s1 quickCheckout=$s2 paidLane=$s3 ctaHost=$h1 featuredHost=$h2"
if [ "$s1" -eq 1 ] && [ "$s2" -eq 1 ] && [ "$s3" -eq 1 ] && [ "$h1" -eq 1 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
