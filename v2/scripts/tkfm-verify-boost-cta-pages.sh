#!/usr/bin/env bash
set -euo pipefail

# TKFM: Verify Boost CTA ids present in core pages
# Usage: ./scripts/tkfm-verify-boost-cta-pages.sh

need() { [ -f "$1" ] || { echo "FAIL: missing $1"; exit 2; }; }

for f in radio-hub.html owner-paid-lane-inbox.html owner-boost-dashboard.html owner-boost-analytics.html; do
  if [ -f "$f" ]; then
    if grep -q "rotation_boost_7d" "$f" && grep -q "rotation_boost_30d" "$f"; then
      echo "OK: $f has boost ids"
    else
      echo "FAIL: $f missing boost ids"
      exit 3
    fi
  else
    echo "WARN: $f missing (skipping)"
  fi
done

echo "DONE"
