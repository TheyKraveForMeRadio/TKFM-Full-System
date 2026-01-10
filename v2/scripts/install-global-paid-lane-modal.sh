#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/global-paid-lane-modal-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Install GLOBAL paid-lane modal singleton (no HTML modal injection) =="
echo "Backup: $BK"
echo

FILES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)

for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  cp -p "$f" "$BK/$f"

  # Remove old injected modal/style blocks + host divs (safe, marker-based)
  #  - remove any <style id="tkfmPaidLaneModalStyles"> ... </style>
  #  - remove any <div id="tkfmPaidLaneModal..."> ... </div> (modal root)
  #  - remove tkfmPaidLaneModalHost
  #  - remove old script include tkfm-paid-lane-submit.js (we are replacing it)
  awk '
    BEGIN{skip=0; depth=0}
    {
      line=$0
      low=tolower(line)

      if (skip==0 && low ~ /<style[^>]*id=["'\"']tkfmpaidlanemodalstyles["'\"'][^>]*>/) { skip=1; depth=1; next }
      if (skip==1) {
        if (low ~ /<style\b/) depth++
        if (low ~ /<\/style>/) { depth--; if (depth<=0){ skip=0 } }
        next
      }

      # Remove modal root if present
      if (skip==0 && low ~ /<div[^>]*id=["'\"']tkfmpaidlanemodal["'\"'][^>]*>/) { skip=2; depth=1; next }
      if (skip==2) {
        if (low ~ /<div\b/) depth++
        if (low ~ /<\/div>/) { depth--; if (depth<=0){ skip=0 } }
        next
      }

      # Remove host placeholder divs
      if (low ~ /id=["'\"']tkfmpaidlanemodalhost["'\"']/) next

      # Remove old script include
      if (low ~ /tkfm-paid-lane-submit\.js/) next

      print line
    }
  ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"

  # Ensure new script is included in <head> (before </head>)
  if ! grep -qi 'tkfm-paid-lane-modal\.js' "$f"; then
    awk '
      BEGIN{done=0}
      {
        if (!done && tolower($0) ~ /<\/head>/) {
          print "    <script src=\"/js/tkfm-paid-lane-modal.js\" defer></script>"
          done=1
        }
        print $0
      }
    ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
  fi

  echo "OK: $f"
done

echo
echo "DONE. This removes the risky injected modal HTML/CSS from pages and uses one global JS modal."
