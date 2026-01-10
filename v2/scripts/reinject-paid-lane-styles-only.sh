#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Replace Paid Lane modal CSS block (formatted) =="

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/reinject-paid-lane-styles-$STAMP"
mkdir -p "$BK"

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)

for f in "${PAGES[@]}"; do
  [ -f "$f" ] || continue
  cp -p "$f" "$BK/$f"

  # remove existing marked style block
  awk '
    BEGIN{skip=0}
    /<!-- TKFM_PAID_LANE_MODAL_STYLES_START -->/ {skip=1; next}
    /<!-- TKFM_PAID_LANE_MODAL_STYLES_END -->/   {skip=0; next}
    skip==0 {print}
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"

  # insert fresh block before </head>
  awk '
    BEGIN{done=0}
    {
      if (!done && $0 ~ /<\/head>/i) {
        print "  <!-- TKFM_PAID_LANE_MODAL_STYLES_START -->"
        print "  <style id=\"tkfmPaidLaneModalStyles\">"
        while ((getline line < "scripts/__tkfm_paid_lane_modal_styles.css") > 0) print line
        close("scripts/__tkfm_paid_lane_modal_styles.css")
        print "  </style>"
        print "  <!-- TKFM_PAID_LANE_MODAL_STYLES_END -->"
        done=1
      }
      print
    }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"

  echo "OK: styles replaced $f"
done

echo "Backups: $BK"
