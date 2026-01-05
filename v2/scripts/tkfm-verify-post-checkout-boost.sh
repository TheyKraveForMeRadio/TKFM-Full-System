#!/usr/bin/env bash
set -euo pipefail

[ -f netlify/functions/verify-boost-session.js ] || { echo "FAIL: missing verify-boost-session function"; exit 2; }
[ -f js/tkfm-post-checkout-boost.js ] || { echo "FAIL: missing js/tkfm-post-checkout-boost.js"; exit 3; }
[ -f post-checkout.html ] || { echo "FAIL: missing post-checkout.html"; exit 4; }
grep -q "/js/tkfm-post-checkout-boost.js" post-checkout.html || { echo "FAIL: post-checkout.html not wired to post-checkout boost js"; exit 5; }
echo "OK: post-checkout boost verified"
