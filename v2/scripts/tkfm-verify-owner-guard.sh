#!/usr/bin/env bash
set -euo pipefail

echo "== CHECK: owner guard scripts exist =="
[ -f js/tkfm-owner-guard.js ] && echo "OK: js/tkfm-owner-guard.js" || { echo "FAIL: missing js/tkfm-owner-guard.js"; exit 2; }
[ -f js/tkfm-owner-gate-no-redirect.js ] && echo "OK: js/tkfm-owner-gate-no-redirect.js" || { echo "FAIL: missing js/tkfm-owner-gate-no-redirect.js"; exit 3; }

echo "== CHECK: some owner pages include guard =="
FOUND=0
for f in owner-boost-dashboard.html owner-featured-manager.html owner-paid-lane-inbox.html owner-tracking-test.html owner-stripe-verifier.html; do
  if [ -f "$f" ]; then
    if grep -q "tkfm-owner-guard.js" "$f"; then
      echo "OK: $f includes owner guard"
      FOUND=1
    else
      echo "WARN: $f does NOT include owner guard"
    fi
  fi
done

[ "$FOUND" -eq 1 ] && echo "OK" || echo "WARN: no owner page checked includes guard yet"
