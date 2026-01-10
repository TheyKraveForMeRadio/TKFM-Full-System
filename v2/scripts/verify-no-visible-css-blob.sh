#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Verify no visible pasted CSS blob text remains =="

FILES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)
fail=0

for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue

  # Strip <style> blocks, then search for blob signatures
  stripped="$(awk '
    BEGIN{sd=0}
    {
      low=tolower($0)
      if (low ~ /<style\\b/) { sd++; next }
      if (low ~ /<\\/style>/) { if (sd>0) sd--; next }
      if (sd==0) print
    }
  ' "$f")"

  echo "$stripped" | grep -q "background:#020617; background-image: radial-gradient" && { echo "FAIL $f stray background blob"; fail=1; continue; }
  echo "$stripped" | grep -q "\\.card{background:rgba(2,6,23" && { echo "FAIL $f stray .card blob"; fail=1; continue; }
  echo "$stripped" | grep -q "#tkfmPaidLaneModal\\[data-open" && { echo "FAIL $f stray modal css blob"; fail=1; continue; }

  echo "OK   $f"
done

echo
if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL=1 (a page still has blob text)"
  exit 1
fi
