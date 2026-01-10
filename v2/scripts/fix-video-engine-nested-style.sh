#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: FIX video-engine.html nested <style> bug (this causes CSS '{ expected') =="

F="video-engine.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/video-engine-nested-style-fix-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# Remove only the broken injected style blocks (by id/markers), then inject clean ones before </head>.
awk '
  BEGIN{skip=0; mode=""; injected=0}
  {
    line=$0

    # Skip existing VIDEO THEME style block
    if (tolower(line) ~ /<style[^>]*id="tkfmvideoenginetheme"[^>]*>/) { skip=1; mode="theme"; next }
    if (skip==1 && mode=="theme" && tolower(line) ~ /<\/style>/) { skip=0; mode=""; next }
    if (skip==1 && mode=="theme") { next }

    # Skip existing MODAL style block by markers
    if (line ~ /TKFM_PAID_LANE_MODAL_STYLES_START/) { skip=1; mode="modal_marker"; next }
    if (skip==1 && mode=="modal_marker" && line ~ /TKFM_PAID_LANE_MODAL_STYLES_END/) { skip=0; mode=""; next }
    if (skip==1 && mode=="modal_marker") { next }

    # Skip any stray modal style tag block by id (in case it exists without markers)
    if (tolower(line) ~ /<style[^>]*id="tkfmpaidlanemodalstyles"[^>]*>/) { skip=1; mode="modal_id"; next }
    if (skip==1 && mode=="modal_id" && tolower(line) ~ /<\/style>/) { skip=0; mode=""; next }
    if (skip==1 && mode=="modal_id") { next }

    # Inject clean styles right before </head> once
    if (injected==0 && tolower(line) ~ /<\/head>/) {
      print "  <style id=\"tkfmVideoEngineTheme\">"
      while ((getline css < "scripts/__tkfm_video_engine_theme.css") > 0) print css
      close("scripts/__tkfm_video_engine_theme.css")
      print "  </style>"
      print ""
      print "  <!-- TKFM_PAID_LANE_MODAL_STYLES_START -->"
      print "  <style id=\"tkfmPaidLaneModalStyles\">"
      while ((getline css2 < "scripts/__tkfm_paid_lane_modal_styles.css") > 0) print css2
      close("scripts/__tkfm_paid_lane_modal_styles.css")
      print "  </style>"
      print "  <!-- TKFM_PAID_LANE_MODAL_STYLES_END -->"
      injected=1
    }

    print line
  }
' "$F" > "$F.tmp" && mv "$F.tmp" "$F"

echo "DONE: rebuilt style blocks in $F"
echo "Backup: $BK/$F"
