#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/remove-visible-css-blob-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Remove VISIBLE pasted CSS blob text from pages (fix 'CSS showing on page') =="
echo "Backup dir: $BK"
echo

FILES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)

for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  cp -p "$f" "$BK/$f"

  awk '
    BEGIN{in_style=0; in_script=0; in_stray=0}
    function trim(s){gsub(/^[ \t\r\n]+|[ \t\r\n]+$/,"",s); return s}

    {
      line=$0
      low=tolower(line)

      # Track style/script depth
      if (low ~ /<style\\b/) in_style++
      if (low ~ /<\\/style>/) { if (in_style>0) in_style-- }
      if (low ~ /<script\\b/) in_script++
      if (low ~ /<\\/script>/) { if (in_script>0) in_script-- }

      if (in_style==0 && in_script==0) {
        t=trim(line)

        # Start of a pasted CSS blob (outside <style>) — skip it
        if (in_stray==0) {
          if (index(line,"background:#020617; background-image: radial-gradient")>0) { in_stray=1; next }
          if (index(line,".card{background:rgba(2,6,23")>0) { in_stray=1; next }
          if (index(line,"#tkfmPaidLaneModal[data-open")>0) { in_stray=1; next }
          if (index(line,"#tkfmPaidLaneModalCard{")>0) { in_stray=1; next }
          if (index(line,".tkfmPLField{")>0) { in_stray=1; next }
        } else {
          # We are inside stray blob: skip until we hit a real tag line OR blank OR a known trailing word
          if (t=="") { in_stray=0; next }
          if (t=="Submit Now") { in_stray=0; next }
          if (line ~ /</) { in_stray=0; print line; next }
          next
        }
      }

      print line
    }
  ' "$f" > "$f.__tmp__"

  mv "$f.__tmp__" "$f"
  echo "CLEANED: $f"
done

echo
echo "DONE."
echo "Backups saved to: $BK"
