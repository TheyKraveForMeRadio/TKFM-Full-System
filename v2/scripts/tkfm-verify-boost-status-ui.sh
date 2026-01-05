#!/usr/bin/env bash
set -euo pipefail

[ -f js/tkfm-boost-status-ui.js ] || { echo "FAIL: missing js/tkfm-boost-status-ui.js"; exit 2; }
[ -f scripts/tkfm-wire-boost-status-ui.sh ] || { echo "FAIL: missing scripts/tkfm-wire-boost-status-ui.sh"; exit 3; }
[ -f scripts/tkfm-wire-boost-status-ui.cjs ] || { echo "FAIL: missing scripts/tkfm-wire-boost-status-ui.cjs"; exit 4; }

if [ -f dashboard.html ]; then
  grep -q "TKFM: BOOST STATUS PANEL" dashboard.html || { echo "WARN: dashboard.html not wired (run ./scripts/tkfm-wire-boost-status-ui.sh .)"; }
  grep -q "/js/tkfm-boost-status-ui.js" dashboard.html || { echo "WARN: dashboard.html missing script include"; }
else
  echo "WARN: missing dashboard.html (skipping)"
fi

if [ -f rotation-boost.html ]; then
  grep -q "TKFM: BOOST STATUS PANEL" rotation-boost.html || { echo "WARN: rotation-boost.html not wired (run ./scripts/tkfm-wire-boost-status-ui.sh .)"; }
  grep -q "/js/tkfm-boost-status-ui.js" rotation-boost.html || { echo "WARN: rotation-boost.html missing script include"; }
else
  echo "WARN: missing rotation-boost.html (skipping)"
fi

echo "OK"
