#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify RADIO-TV Featured Rail Stability =="

F="radio-tv.html"
[ -f "$F" ] || { echo "FAIL missing $F"; exit 1; }

h0=$(grep -qiE 'id="tkfmFeaturedRailHost"' "$F" && echo 1 || echo 0)
s1=$(grep -qiE 'tkfm-featured-rail-stability\.js' "$F" && echo 1 || echo 0)

echo "featuredHost=$h0 stabilityScript=$s1"
if [ "$h0" -eq 1 ] && [ "$s1" -eq 1 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
