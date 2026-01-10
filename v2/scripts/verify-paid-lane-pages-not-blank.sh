#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Verify pages are NOT blank + modal blocks exist =="

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)
FAIL=0
for f in "${PAGES[@]}"; do
  [ -f "$f" ] || continue
  lines="$(wc -l < "$f" | tr -d ' ')"
  has_body=$(grep -qi '<body' "$f" && echo 1 || echo 0)
  has_end=$(grep -qi '</html>' "$f" && echo 1 || echo 0)
  has_content=$(grep -qiE '<section|<main|class="card"|data-plan=|js-checkout' "$f" && echo 1 || echo 0)
  has_modal=$(grep -qi 'TKFM_PAID_LANE_MODAL_START' "$f" && echo 1 || echo 0)
  has_style=$(grep -qi 'TKFM_PAID_LANE_MODAL_STYLES_START' "$f" && echo 1 || echo 0)

  if [ "$has_body" = "1" ] && [ "$has_end" = "1" ] && [ "$has_content" = "1" ]; then
    echo "OK   $f  lines=$lines content=$has_content modal=$has_modal style=$has_style"
  else
    echo "FAIL $f  lines=$lines body=$has_body end=$has_end content=$has_content modal=$has_modal style=$has_style"
    FAIL=$((FAIL+1))
  fi
done

echo
echo "RESULT FAIL=$FAIL"
exit $FAIL
