#!/usr/bin/env bash
set -euo pipefail

[ -f netlify/functions/boost-order-record.js ] || { echo "FAIL: missing netlify/functions/boost-order-record.js"; exit 2; }
[ -f netlify/functions/boost-orders-admin.js ] || { echo "FAIL: missing netlify/functions/boost-orders-admin.js"; exit 3; }
[ -f js/tkfm-boost-orders-admin.js ] || { echo "FAIL: missing js/tkfm-boost-orders-admin.js"; exit 4; }

if [ -f owner-boost-analytics.html ]; then
  grep -q "tkfmBoostOrdersRefresh" owner-boost-analytics.html || echo "WARN: owner-boost-analytics not wired yet (run ./scripts/tkfm-wire-boost-orders-into-analytics.sh .)"
  grep -q "/js/tkfm-boost-orders-admin.js" owner-boost-analytics.html || echo "WARN: owner-boost-analytics missing script include (run ./scripts/tkfm-wire-boost-orders-into-analytics.sh .)"
else
  echo "WARN: missing owner-boost-analytics.html (skipping)"
fi

if [ -f js/tkfm-post-checkout-boost.js ]; then
  grep -q "/.netlify/functions/boost-order-record" js/tkfm-post-checkout-boost.js || echo "WARN: post-checkout not patched to record orders (run ./scripts/tkfm-wire-post-checkout-record-order.sh .)"
else
  echo "WARN: missing js/tkfm-post-checkout-boost.js (skipping)"
fi

echo "OK"
