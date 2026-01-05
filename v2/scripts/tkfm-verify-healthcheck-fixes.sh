#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"

need() { echo "FAIL: $1"; exit 2; }

for f in owner-boost-analytics.html owner-boost-dashboard.html owner-paid-lane-inbox.html; do
  if [ ! -f "$ROOT/$f" ]; then
    echo "WARN: missing $f (skip)"
    continue
  fi
  if ! grep -q '/js/tkfm-quick-checkout.js' "$ROOT/$f"; then
    need "$f missing /js/tkfm-quick-checkout.js"
  fi
done

if [ -f "$ROOT/post-checkout.html" ]; then
  if ! grep -q '/js/tkfm-post-checkout-deeplink.js' "$ROOT/post-checkout.html"; then
    need "post-checkout.html missing /js/tkfm-post-checkout-deeplink.js"
  fi
else
  echo "WARN: missing post-checkout.html (skip)"
fi

echo "OK: healthcheck missing-script issues fixed (best-effort)"
