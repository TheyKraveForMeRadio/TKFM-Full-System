#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Engine CTA Lane-Lock + Pro Copy =="

fail=0

check () {
  local f="$1"
  local plan="$2"
  if [ ! -f "$f" ]; then
    echo "SKIP missing: $f"
    return 0
  fi

  local cta style planhit submit
  cta=$(grep -qi 'TKFM: ENGINE CTA BAR START' "$f" && echo 1 || echo 0)
  style=$(grep -qi 'tkfmPaidLaneCtaBarStyles' "$f" && echo 1 || echo 0)
  planhit=$(grep -qi "data-plan=\"$plan\"" "$f" && echo 1 || echo 0)
  submit=$(grep -qi "\?submit=1&lane=$plan" "$f" && echo 1 || echo 0)

  if [ "$cta" -eq 1 ] && [ "$style" -eq 1 ] && [ "$planhit" -eq 1 ] && [ "$submit" -eq 1 ]; then
    echo "OK   $f  (lane=$plan)"
  else
    echo "FAIL $f  cta=$cta style=$style plan=$planhit submit=$submit  expected_lane=$plan"
    fail=$((fail+1))
  fi
}

check "video-engine.html"  "video_monthly_visuals"
check "podcast-engine.html" "podcast_monthly_boost"
check "press-engine.html"  "press_run_pack"
check "social-engine.html" "social_starter_monthly"

echo
echo "RESULT fail=$fail"
[ "$fail" -eq 0 ] || exit 1
