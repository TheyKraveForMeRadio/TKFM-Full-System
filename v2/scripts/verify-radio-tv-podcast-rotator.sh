#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify RADIO-TV Podcast Rotator install =="

F="radio-tv.html"
[ -f "$F" ] || { echo "FAIL missing $F"; exit 1; }

s0=$(grep -qiE 'id="tkfmFeaturedRailHost"' "$F" && echo 1 || echo 0)
s1=$(grep -qiE 'tkfm-featured-podcast-player\.js' "$F" && echo 1 || echo 0)
s2=$(grep -qiE 'tkfm-featured-podcast-rotator\.js' "$F" && echo 1 || echo 0)

echo "featuredHost=$s0 playerEnhancer=$s1 rotator=$s2"
if [ "$s0" -eq 1 ] && [ "$s2" -eq 1 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
