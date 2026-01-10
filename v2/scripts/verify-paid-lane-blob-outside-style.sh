#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Verify NO stray Paid Lane blob in visible markup (ignores <style>/<script>) =="

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)
FAIL=0

for f in "${PAGES[@]}"; do
  [ -f "$f" ] || continue

  # Strip style/script blocks then grep
  stripped="$(awk '
    BEGIN{in_style=0; in_script=0}
    {
      line=$0
      if (line ~ /<style[^>]*>/i) in_style=1
      if (line ~ /<\/style>/i) {in_style=0; next}
      if (line ~ /<script[^>]*>/i) in_script=1
      if (line ~ /<\/script>/i) {in_script=0; next}
      if (in_style || in_script) next
      print
    }
  ' "$f")"

  echo "$stripped" | grep -F '#tkfmPaidLaneModal[data-open="1"]{display:block;}' >/dev/null 2>&1 && s1=1 || s1=0
  echo "$stripped" | grep -F 'background:#020617; background-image: radial-gradient' >/dev/null 2>&1 && s2=1 || s2=0
  echo "$stripped" | grep -E '^(TKFM|Paid Lane Submission|Submit Now)\s*$' >/dev/null 2>&1 && s3=1 || s3=0

  has_style=$(grep -qi 'TKFM_PAID_LANE_MODAL_STYLES_START' "$f" && echo 1 || echo 0)
  has_modal=$(grep -qi 'TKFM_PAID_LANE_MODAL_START' "$f" && echo 1 || echo 0)
  has_js=$(grep -qi 'tkfm-paid-lane-submit\.js' "$f" && echo 1 || echo 0)

  if [ "$s1" -eq 1 ] || [ "$s2" -eq 1 ] || [ "$s3" -eq 1 ]; then
    echo "FAIL $f  stray_visible=1  style=$has_style modal=$has_modal js=$has_js"
    FAIL=$((FAIL+1))
  else
    echo "OK   $f  stray_visible=0  style=$has_style modal=$has_modal js=$has_js"
  fi
done

echo
echo "RESULT FAIL=$FAIL"
exit $FAIL
