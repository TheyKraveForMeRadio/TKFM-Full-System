#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/remove-debug-copy-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Remove visible debug 'Fix applied' text + replace with pro customer copy (Video Engine) =="

FILE="video-engine.html"
if [ ! -f "$FILE" ]; then
  echo "SKIP: $FILE not found"
  exit 0
fi

cp -p "$FILE" "$BK/$FILE"

# Remove the exact debug block lines (safe)
# Any line containing these phrases will be removed.
grep -n "Fix applied" -n "$FILE" >/dev/null 2>&1 || true

awk '
  BEGIN{drop=0}
  {
    if ($0 ~ /Fix applied/ ||
        $0 ~ /Monthly Visuals Lane now uses live Stripe pricing/ ||
        $0 ~ /Button lookup key:/ ||
        $0 ~ /Prices render on the page by calling the new price-info function/ ) {
      next
    }
    print
  }
' "$FILE" > "$FILE.__tmp__" && mv "$FILE.__tmp__" "$FILE"

echo "DONE: removed debug lines from $FILE"
echo "Backup: $BK/$FILE"
