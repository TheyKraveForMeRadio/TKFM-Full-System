#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Engine CTA SMART LOCK =="

fail=0
for f in video-engine.html podcast-engine.html press-engine.html social-engine.html; do
  if [ ! -f "$f" ]; then
    echo "SKIP missing: $f"
    continue
  fi

  cta=$(grep -qi 'TKFM: ENGINE CTA BAR START' "$f" && echo 1 || echo 0)
  style=$(grep -qi 'tkfmPaidLaneCtaBarStyles' "$f" && echo 1 || echo 0)
  buy=$(grep -qiE 'js-checkout[^>]*data-plan="' "$f" && echo 1 || echo 0)
  sub=$(grep -qiE '\?submit=1&lane=' "$f" && echo 1 || echo 0)

  if [ "$cta" -eq 1 ] && [ "$style" -eq 1 ] && [ "$buy" -eq 1 ] && [ "$sub" -eq 1 ]; then
    lane=$(grep -oE 'data-plan="[^"]+"' "$f" | head -n1 | sed 's/^data-plan="//; s/"$//')
    echo "OK   $f  lane=$lane"
  else
    echo "FAIL $f  cta=$cta style=$style buy=$buy submit=$sub"
    fail=$((fail+1))
  fi
done

echo
echo "RESULT fail=$fail"
[ "$fail" -eq 0 ] || exit 1
