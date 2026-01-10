#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Repair video-engine.html CSS (sanitize <style> blocks, drop stray </style>) =="

F="video-engine.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/video-engine-style-sanitize-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# What this does:
# - Tracks whether we are inside a <style> block
# - If inside style: removes any accidental HTML/script/comment lines that break CSS parsing
# - If outside style: drops stray </style> that appear without a matching <style>
# - Keeps everything else unchanged

awk '
  BEGIN{
    in_style=0;
    style_depth=0;
    removed_html_in_style=0;
    removed_stray_close=0;
  }
  {
    line=$0;

    # Detect <style ...> open
    if (tolower(line) ~ /<style[^>]*>/) {
      in_style=1;
      style_depth++;
      print line;
      next;
    }

    # Detect </style> close
    if (tolower(line) ~ /<\/style>/) {
      if (in_style==1 && style_depth>0) {
        print line;
        style_depth--;
        if (style_depth==0) in_style=0;
      } else {
        # stray close outside style
        removed_stray_close++;
        next;
      }
      next;
    }

    if (in_style==1) {
      # If any HTML or script accidentally lands in CSS, drop it.
      # Common breakages: "<div ...", "<script ...", "<!--", "-->", "</body>", etc.
      if (line ~ /<\s*(div|script|body|head|html|meta|link|title|button|section|main|footer|header|nav)\b/i) { removed_html_in_style++; next; }
      if (line ~ /<!--|-->/) { removed_html_in_style++; next; }
      if (line ~ /TKFM_PAID_LANE_MODAL_(STYLES_START|STYLES_END|START|END)/) { removed_html_in_style++; next; }

      # Also drop the known pasted blob if it somehow ended up inside style
      if (index(line, "background:#020617; background-image: radial-gradient")>0) { removed_html_in_style++; next; }
      if (index(line, "#tkfmPaidLaneModal[data-open")>0) { removed_html_in_style++; next; }

      print line;
      next;
    }

    # outside style: keep normal line
    print line;
  }
  END{
    # nothing
  }
' "$F" > "$F.tmp" && mv "$F.tmp" "$F"

echo "DONE: sanitized $F"
echo "Backup: $BK/$F"
