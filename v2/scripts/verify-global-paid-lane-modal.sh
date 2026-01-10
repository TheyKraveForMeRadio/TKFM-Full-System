#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Verify GLOBAL paid lane modal singleton installed =="
FILES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)

fail=0
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue

  has_new=$(grep -qi 'tkfm-paid-lane-modal\.js' "$f" && echo 1 || echo 0)
  has_old=$(grep -qi 'tkfm-paid-lane-submit\.js' "$f" && echo 1 || echo 0)
  has_old_style=$(grep -qi 'id="tkfmPaidLaneModalStyles"' "$f" && echo 1 || echo 0)

  # Check for the visible blob signatures (outside style is hard; we just flag presence anywhere)
  blob=$(grep -qi 'background:#020617; background-image: radial-gradient' "$f" && echo 1 || echo 0)

  if [ "$has_new" -ne 1 ] || [ "$has_old" -ne 0 ] || [ "$has_old_style" -ne 0 ] || [ "$blob" -ne 0 ]; then
    echo "FAIL $f  new=$has_new oldSubmit=$has_old oldStyle=$has_old_style blobSig=$blob"
    fail=1
  else
    echo "OK   $f"
  fi
done

echo
if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL=1"
  exit 1
fi
