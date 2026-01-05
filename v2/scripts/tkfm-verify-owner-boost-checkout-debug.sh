#!/usr/bin/env bash
set -euo pipefail

[ -f owner-boost-checkout-debug.html ] || { echo "FAIL: missing owner-boost-checkout-debug.html"; exit 2; }

grep -q "rotation_boost_7d" owner-boost-checkout-debug.html || { echo "FAIL: debug page missing 7d key"; exit 3; }
grep -q "rotation_boost_30d" owner-boost-checkout-debug.html || { echo "FAIL: debug page missing 30d key"; exit 4; }
grep -q "/.netlify/functions/create-checkout-session" owner-boost-checkout-debug.html || { echo "FAIL: debug page missing endpoint"; exit 5; }

echo "OK: owner boost checkout debug page ready"
