#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: RADIO-TV Featured Rail Stability + Cache =="

F="radio-tv.html"
if [ ! -f "$F" ]; then
  echo "FAIL: radio-tv.html not found."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/radio-tv-featured-stability-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# Add stability script in <head> (after other scripts is fine)
if ! grep -qiE 'tkfm-featured-rail-stability\.js' "$F"; then
  awk -v INS='  <script src="/js/tkfm-featured-rail-stability.js" defer></script>' '
    BEGIN{done=0}
    {
      if (!done && tolower($0) ~ /<\/head>/) { print INS; done=1; }
      print $0;
    }
  ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
  echo "OK: added /js/tkfm-featured-rail-stability.js"
else
  echo "OK: stability script already present"
fi

# Ensure Featured host exists
if ! grep -qiE 'id="tkfmFeaturedRailHost"' "$F"; then
  echo "FAIL: tkfmFeaturedRailHost not found in radio-tv.html"
  echo "      Install the Featured Rail patch first."
  exit 1
fi

echo "DONE."
echo "Backup: $BK/$F"
