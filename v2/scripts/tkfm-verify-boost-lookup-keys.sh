#!/usr/bin/env bash
set -euo pipefail

# TKFM: verify your frontend uses the lookup keys/plan ids we expect
# Safe: just greps files.

echo "== CHECK: buttons reference rotation_boost_7d / rotation_boost_30d =="
FOUND=0
for f in radio-hub.html rotation-boost.html featured-media.html owner-paid-lane-inbox.html pricing.html; do
  if [ -f "$f" ]; then
    if grep -q "rotation_boost_7d" "$f"; then
      echo "OK: found rotation_boost_7d in $f"; FOUND=1
    fi
    if grep -q "rotation_boost_30d" "$f"; then
      echo "OK: found rotation_boost_30d in $f"; FOUND=1
    fi
  fi
done

if [ "$FOUND" -eq 0 ]; then
  echo "WARN: did not find plan ids in common pages."
  echo "If your buttons use different ids, keep them — but set the Stripe LOOKUP KEYS to match those ids."
fi
