#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Paid lane submit modal smoke test =="
FAIL=0
PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)
for f in "${PAGES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP $f (missing)"
    continue
  fi
  s=$(grep -qi 'tkfm-paid-lane-submit\.js' "$f" && echo 1 || echo 0)
  m=$(grep -qi 'id="tkfmPaidLaneModal"' "$f" && echo 1 || echo 0)
  h=$(grep -qi 'id="tkfmPaidLaneSubmitHost"' "$f" && echo 1 || echo 0)
  if [ "$s" = "1" ] && [ "$m" = "1" ] && [ "$h" = "1" ]; then
    echo "OK   $f  script=$s modal=$m host=$h"
  else
    echo "FAIL $f  script=$s modal=$m host=$h"
    FAIL=$((FAIL+1))
  fi
done
echo
if [ "$FAIL" -gt 0 ]; then
  echo "RESULT FAIL=$FAIL"
  exit 1
fi
echo "RESULT FAIL=0"
