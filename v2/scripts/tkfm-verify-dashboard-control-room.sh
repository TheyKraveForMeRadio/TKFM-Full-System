#!/usr/bin/env bash
set -euo pipefail

[ -f dashboard.html ] || { echo "FAIL: missing dashboard.html"; exit 2; }

if grep -q "TKFM Control Room" dashboard.html; then
  echo "OK: dashboard title"
else
  echo "FAIL: dashboard missing title"
  exit 3
fi

if grep -q "/js/tkfm-boost-status-ui.js" dashboard.html; then
  echo "OK: boost status script included"
else
  echo "WARN: boost status script missing include (dashboard still works)"
fi

if [ -f scripts/tkfm-wire-dashboard-pill-links.sh ]; then
  echo "OK: wiring script exists"
else
  echo "FAIL: missing wiring script"
  exit 4
fi

echo "OK"
