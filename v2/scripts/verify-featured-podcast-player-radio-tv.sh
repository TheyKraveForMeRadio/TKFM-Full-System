#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Featured Podcast Player enhancer =="

F="radio-tv.html"
[ -f "$F" ] || { echo "FAIL missing $F"; exit 1; }

s1=$(grep -qiE 'tkfm-featured-rail\.js' "$F" && echo 1 || echo 0)
s2=$(grep -qiE 'tkfm-featured-podcast-player\.js' "$F" && echo 1 || echo 0)
h=$(grep -qiE 'id="tkfmFeaturedRailHost"' "$F" && echo 1 || echo 0)

echo "railScript=$s1 enhancerScript=$s2 host=$h"
if [ "$s2" -eq 1 ] && [ "$h" -eq 1 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
