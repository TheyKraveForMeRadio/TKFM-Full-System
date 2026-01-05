#!/usr/bin/env bash
set -euo pipefail

# TKFM: Verify dashboard exists + has boost checkout ids + boost link
# Usage: ./scripts/tkfm-verify-dashboard.sh

[ -f dashboard.html ] || { echo "FAIL: missing dashboard.html"; exit 2; }

grep -q 'href="/rotation-boost.html"' dashboard.html || { echo "FAIL: dashboard missing rotation-boost link"; exit 3; }
grep -q 'data-plan="rotation_boost_7d"' dashboard.html || { echo "FAIL: dashboard missing 7d button"; exit 4; }
grep -q 'data-plan="rotation_boost_30d"' dashboard.html || { echo "FAIL: dashboard missing 30d button"; exit 5; }

echo "OK: dashboard wired"
