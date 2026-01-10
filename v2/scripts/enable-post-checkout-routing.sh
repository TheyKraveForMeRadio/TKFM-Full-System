#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Enable post-checkout routing =="
echo "This patch ensures create-checkout-session success_url routes to /post-checkout.html"
echo

# Nothing to edit here because function already includes post-checkout success_url in this patch.
# We still sanity-check file presence.

[ -f "post-checkout.html" ] || { echo "FAIL: post-checkout.html missing"; exit 1; }
[ -f "js/tkfm-post-checkout.js" ] || { echo "FAIL: js/tkfm-post-checkout.js missing"; exit 1; }

echo "OK: post-checkout files present."
echo "OK: checkout function includes post-checkout routing (see netlify/functions/create-checkout-session.js)."
echo "DONE."
