#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify auto post-checkout submit wiring =="

fail=0

if [ ! -f "js/tkfm-quick-checkout.js" ]; then
  echo "FAIL: missing js/tkfm-quick-checkout.js"
  fail=$((fail+1))
else
  if grep -q 'sessionStorage.setItem..tkfm_last_plan' "js/tkfm-quick-checkout.js"; then
    echo "OK   quick checkout stores last plan"
  else
    echo "FAIL quick checkout missing last plan storage"
    fail=$((fail+1))
  fi
fi

if [ ! -f "js/tkfm-post-checkout-deeplink.js" ]; then
  echo "FAIL: missing js/tkfm-post-checkout-deeplink.js"
  fail=$((fail+1))
else
  if grep -q 'sessionStorage.getItem..tkfm_last_plan' "js/tkfm-post-checkout-deeplink.js"; then
    echo "OK   post-checkout reads last plan"
  else
    echo "FAIL post-checkout missing last plan read"
    fail=$((fail+1))
  fi
fi

if [ ! -f "post-checkout.html" ]; then
  echo "FAIL: missing post-checkout.html"
  fail=$((fail+1))
else
  if grep -qi '/js/tkfm-post-checkout-deeplink\.js' "post-checkout.html"; then
    echo "OK   post-checkout loads deeplink script"
  else
    echo "FAIL post-checkout.html missing script include"
    fail=$((fail+1))
  fi
fi

# quick scan: pages with checkout markers should include quick-checkout OR tkfm-checkout should delegate
missing=0
for f in *.html; do
  [ -f "$f" ] || continue
  if grep -qiE 'data-plan=|data-feature=|js-checkout' "$f"; then
    if ! grep -qiE '/js/tkfm-quick-checkout\.js' "$f"; then
      echo "WARN missing quick-checkout include: $f"
      missing=$((missing+1))
    fi
  fi
done

echo
echo "RESULT fail=$fail warn_missing_root_pages=$missing"
[ "$fail" -eq 0 ] || exit 1
