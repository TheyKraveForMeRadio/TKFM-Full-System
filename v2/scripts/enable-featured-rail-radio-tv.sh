#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Embed Featured Rail at TOP of radio-tv.html (instant featured) =="

F="radio-tv.html"
if [ ! -f "$F" ]; then
  echo "FAIL: radio-tv.html not found in this folder."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/featured-rail-radio-tv-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# 1) Ensure the script tag is in <head>
if ! grep -qiE 'tkfm-featured-rail\.js' "$F"; then
  awk -v INS='  <script src="/js/tkfm-featured-rail.js" defer></script>' '
    BEGIN{done=0}
    {
      if (!done && tolower($0) ~ /<\/head>/) { print INS; done=1; }
      print $0;
    }
  ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
  echo "OK: added /js/tkfm-featured-rail.js to <head>"
else
  echo "OK: featured rail script already present"
fi

# 2) Ensure host container exists at top of body (before TV screen)
if ! grep -qiE 'id="tkfmFeaturedRailHost"' "$F"; then
  awk '
    BEGIN{inserted=0}
    {
      print $0
      if (!inserted && tolower($0) ~ /<body[^>]*>/) {
        print ""
        print "  <!-- TKFM Featured Rail (shows Featured TV + Podcasts instantly) -->"
        print "  <div id=\"tkfmFeaturedRailHost\"></div>"
        print ""
        inserted=1
      }
    }
  ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
  echo "OK: added #tkfmFeaturedRailHost at top of <body>"
else
  echo "OK: featured rail host already present"
fi

echo "DONE: radio-tv.html patched."
echo "Backup: $BK/$F"
