#!/usr/bin/env bash
set -euo pipefail

FILE="video-engine.html"
if [ ! -f "$FILE" ]; then
  echo "FAIL: $FILE not found (run from /v2)"; exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/video-engine-style-balance-$STAMP"
mkdir -p "$BK"
cp -p "$FILE" "$BK/$FILE"
echo "Backup: $BK/$FILE"

# Remove stray </style> tags that appear when not inside a <style> block.
# This fixes the exact symptom you have: style_open < style_close.
awk '
  BEGIN{depth=0}
  {
    line=$0
    low=line
    # crude case-insensitive checks
    gsub(/[A-Z]/, "", low)
  }

  # handle <style ...> (case-insensitive)
  tolower($0) ~ /<style(\s|>|$)/ {
    depth++
    print
    next
  }

  # handle </style>
  tolower($0) ~ /<\/style>/ {
    if (depth>0) { depth--; print }
    else { next }  # skip stray closing tag
    next
  }

  { print }
' "$FILE" > "$FILE.tmp"

mv "$FILE.tmp" "$FILE"

echo "OK: removed stray </style> tags (if any)."
echo "Now run: ./scripts/verify-video-engine-css.sh"
