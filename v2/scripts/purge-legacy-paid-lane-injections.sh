#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/purge-legacy-paid-lane-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Purge legacy Paid Lane injected HTML/CSS blocks (keep singleton) =="
echo "Backup dir: $BK"
echo

# Targets: root HTML only (v2 folder)
files=()
while IFS= read -r -d '' f; do files+=("$f"); done < <(find . -maxdepth 1 -type f -name "*.html" -print0)

purged=0
for f in "${files[@]}"; do
  # Only touch likely affected pages
  if ! grep -qiE 'tkfmPaidLaneModal|tkfmPaidLaneModalStyles|tkfmPaidLaneModalHost|Paid Lane Submission' "$f"; then
    continue
  fi

  cp -p "$f" "$BK/$(basename "$f")"

  # Remove style block by id
  perl -0777 -i -pe 's/<style[^>]*id="tkfmPaidLaneModalStyles"[^>]*>.*?<\/style>\s*//gis' "$f" || true

  # Remove any modal DIV block by id (best effort non-greedy)
  perl -0777 -i -pe 's/<div[^>]*id="tkfmPaidLaneModal"[^>]*>.*?<\/div>\s*//gis' "$f" || true

  # Remove host div if present
  perl -0777 -i -pe 's/<div[^>]*id="tkfmPaidLaneModalHost"[^>]*>\s*<\/div>\s*//gis' "$f" || true

  # Remove any stray visible CSS blob lines (common corruption)
  # If a line contains ".card{background:rgba(2,6,23" AND it's outside <style>, remove it.
  # This script removes those lines anywhere as a last resort.
  awk '
    BEGIN{instyle=0}
    {line=$0}
    tolower(line) ~ /<style/ { instyle=1 }
    tolower(line) ~ /<\/style>/ { instyle=0 }
    {
      if (!instyle && line ~ /\.card\{background:rgba\(2,6,23/){ next }
      if (!instyle && line ~ /background-image:\s*radial-gradient/ && line !~ /{/){ next }
      print line
    }
  ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"

  echo "PURGED: $(basename "$f")"
  purged=$((purged+1))
done

echo
echo "DONE: purged $purged pages."
