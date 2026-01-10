#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Featured Rail embed (radio-tv.html) =="

F="radio-tv.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

s=$(grep -qiE 'tkfm-featured-rail\.js' "$F" && echo 1 || echo 0)
h=$(grep -qiE 'id="tkfmFeaturedRailHost"' "$F" && echo 1 || echo 0)
p=$(grep -qiE 'id="tvFrame"' "$F" && echo 1 || echo 0)

echo "script=$s host=$h tvFrame=$p"
if [ "$s" -eq 1 ] && [ "$h" -eq 1 ] && [ "$p" -eq 1 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
