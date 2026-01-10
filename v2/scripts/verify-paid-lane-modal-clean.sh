#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Verify stray text removed + modal installed =="

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)
FAIL=0

for f in "${PAGES[@]}"; do
  [ -f "$f" ] || continue

  stray1=$(grep -nF '#tkfmPaidLaneModal[data-open="1"]{display:block;}' "$f" || true)
  stray2=$(grep -nF 'background:#020617; background-image: radial-gradient' "$f" || true)

  has_style=$(grep -qi 'TKFM_PAID_LANE_MODAL_STYLES_START' "$f" && echo 1 || echo 0)
  has_modal=$(grep -qi 'TKFM_PAID_LANE_MODAL_START' "$f" && echo 1 || echo 0)
  has_js=$(grep -qi 'tkfm-paid-lane-submit\.js' "$f" && echo 1 || echo 0)

  if [ -n "$stray1" ] || [ -n "$stray2" ]; then
    echo "FAIL $f  stray_text=1  style=$has_style modal=$has_modal js=$has_js"
    FAIL=$((FAIL+1))
  else
    echo "OK   $f  stray_text=0  style=$has_style modal=$has_modal js=$has_js"
  fi
done

echo
echo "RESULT FAIL=$FAIL"
exit $FAIL
