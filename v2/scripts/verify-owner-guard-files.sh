#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Verify owner guard + gate files exist =="
[ -f "js/tkfm-owner-guard.js" ] && echo "OK   js/tkfm-owner-guard.js" || (echo "FAIL missing js/tkfm-owner-guard.js"; exit 1)
[ -f "js/tkfm-owner-gate-no-redirect.js" ] && echo "OK   js/tkfm-owner-gate-no-redirect.js" || (echo "FAIL missing js/tkfm-owner-gate-no-redirect.js"; exit 1)
echo "OK"
