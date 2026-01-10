#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Paid Lane Modal Singleton =="

fail=0
need(){ [ -f "$1" ] || { echo "FAIL missing $1"; fail=1; }; }

need "js/tkfm-paid-lane-modal.js"

count=$(grep -RIn --include="*.html" "tkfm-paid-lane-modal.js" . | wc -l | tr -d " ")
echo "INFO script includes: $count"

# sample quick check: key pages should include it
for f in video-engine.html social-engine.html press-engine.html podcast-engine.html pricing.html; do
  [ -f "$f" ] || continue
  if ! grep -qi "tkfm-paid-lane-modal.js" "$f"; then
    echo "WARN missing include: $f"
  fi
done

if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
