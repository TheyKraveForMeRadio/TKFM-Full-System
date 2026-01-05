#!/usr/bin/env bash
set -euo pipefail

echo "== CHECK: analytics endpoint + page exist =="
[ -f netlify/functions/featured-media-analytics-admin.js ] && echo "OK: function" || { echo "FAIL: missing function"; exit 2; }
[ -f owner-boost-analytics.html ] && echo "OK: page" || { echo "FAIL: missing page"; exit 3; }

echo "== CHECK: links wired into owner pages (if present) =="
for f in owner-boost-dashboard.html owner-paid-lane-inbox.html owner-featured-manager.html; do
  if [ -f "$f" ]; then
    if grep -Eq "owner-boost-analytics\.html" "$f"; then
      echo "OK: $f links analytics"
    else
      echo "WARN: $f does not link analytics (run ./scripts/tkfm-wire-owner-boost-analytics-link.sh .)"
    fi
  fi
done
