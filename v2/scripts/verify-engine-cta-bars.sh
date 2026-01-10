#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Engine CTA Bars (Buy → Submit) =="

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html)

fail=0
for f in "${PAGES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP missing: $f"
    continue
  fi

  cta=$(grep -qi 'TKFM: ENGINE CTA BAR START' "$f" && echo 1 || echo 0)
  sty=$(grep -qi 'tkfmPaidLaneCtaBarStyles' "$f" && echo 1 || echo 0)
  buy=$(grep -qiE 'js-checkout[^>]*(data-plan=|data-feature=)' "$f" && echo 1 || echo 0)
  sub=$(grep -qiE '\?submit=1&lane=' "$f" && echo 1 || echo 0)

  if [ "$cta" -eq 1 ] && [ "$sty" -eq 1 ] && [ "$buy" -eq 1 ] && [ "$sub" -eq 1 ]; then
    echo "OK   $f"
  else
    echo "FAIL $f  cta=$cta style=$sty buy=$buy submit=$sub"
    fail=$((fail+1))
  fi
done

echo
echo "RESULT fail=$fail"
[ "$fail" -eq 0 ] || exit 1
