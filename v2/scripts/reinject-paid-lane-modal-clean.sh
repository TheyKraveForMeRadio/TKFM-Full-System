#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Re-inject Paid Lane modal correctly (AWK, safe) =="

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/reinject-paid-lane-$STAMP"
mkdir -p "$BK"

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)

ensure_script() {
  local f="$1"
  if ! grep -qi 'tkfm-paid-lane-submit\.js' "$f"; then
    awk '
      BEGIN{done=0}
      {
        if (!done && $0 ~ /<\/head>/i) { print "  <script src=\"/js/tkfm-paid-lane-submit.js\"></script>"; done=1 }
        print
      }
    ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  fi
}

replace_style() {
  local f="$1"
  awk '
    BEGIN{skip=0}
    /<!-- TKFM_PAID_LANE_MODAL_STYLES_START -->/ {skip=1; next}
    /<!-- TKFM_PAID_LANE_MODAL_STYLES_END -->/   {skip=0; next}
    skip==0 {print}
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"

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
}

ensure_host() {
  local f="$1"
  if ! grep -qi 'id="tkfmPaidLaneSubmitHost"' "$f"; then
    awk '
      BEGIN{done=0}
      {
        print
        if (!done && $0 ~ /<body[^>]*>/i) {
          print "  <div id=\"tkfmPaidLaneSubmitHost\" style=\"padding:12px 16px; max-width:1100px; margin:0 auto;\"></div>"
          done=1
        }
      }
    ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  fi
}

replace_modal() {
  local f="$1"
  awk '
    BEGIN{skip=0}
    /<!-- TKFM_PAID_LANE_MODAL_START -->/ {skip=1; next}
    /<!-- TKFM_PAID_LANE_MODAL_END -->/   {skip=0; next}
    skip==0 {print}
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"

  awk '
    BEGIN{done=0}
    {
      if (!done && $0 ~ /<\/body>/i) {
        while ((getline line < "scripts/__tkfm_paid_lane_modal.html") > 0) print line
        close("scripts/__tkfm_paid_lane_modal.html")
        done=1
      }
      print
    }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
}

for f in "${PAGES[@]}"; do
  [ -f "$f" ] || continue
  cp -p "$f" "$BK/$f"
  if ! grep -qi '<head' "$f" || ! grep -qi '<body' "$f"; then
    echo "SKIP: $f (missing <head> or <body>)"
    continue
  fi
  ensure_script "$f"
  replace_style "$f"
  ensure_host "$f"
  replace_modal "$f"
  echo "OK: reinjected $f"
done

echo "Backups: $BK"
