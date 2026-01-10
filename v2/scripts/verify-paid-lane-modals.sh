#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Paid Lane Modal verify =="
FAIL=0

check_file () {
  local f="$1"
  if [ ! -f "$f" ]; then
    echo "SKIP $f (missing)"
    return 0
  fi

  local a b c
  a="$(grep -qi 'tkfm-paid-lane-submit\.js' "$f" && echo 1 || echo 0)"
  b="$(grep -qi 'id="tkfmPaidLaneModal"' "$f" && echo 1 || echo 0)"
  c="$(grep -qi 'id="tkfmPaidLaneModalStyles"' "$f" && echo 1 || echo 0)"

  if [ "$a" = "1" ] && [ "$b" = "1" ] && [ "$c" = "1" ]; then
    echo "OK   $f  script=$a modal=$b style=$c"
  else
    echo "FAIL $f  script=$a modal=$b style=$c"
    FAIL=$((FAIL+1))
  fi
}

check_file "video-engine.html"
check_file "podcast-engine.html"
check_file "press-engine.html"
check_file "social-engine.html"
check_file "pricing.html"

echo
if [ "$FAIL" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL=$FAIL"
  exit 1
fi
