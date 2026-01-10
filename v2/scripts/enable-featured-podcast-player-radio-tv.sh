#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Add Featured Podcast Player enhancer to radio-tv.html =="

F="radio-tv.html"
if [ ! -f "$F" ]; then
  echo "FAIL: $F not found."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/featured-podcast-player-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# Ensure base featured rail script exists (from prior patch)
if ! grep -qiE 'tkfm-featured-rail\.js' "$F"; then
  echo "WARN: /js/tkfm-featured-rail.js not referenced. Add rail patch first."
fi

# Add enhancer script in head (after rail script ideally)
if ! grep -qiE 'tkfm-featured-podcast-player\.js' "$F"; then
  awk -v INS='  <script src="/js/tkfm-featured-podcast-player.js" defer></script>' '
    BEGIN{done=0}
    {
      if (!done && tolower($0) ~ /<\/head>/) { print INS; done=1; }
      print $0;
    }
  ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
  echo "OK: added /js/tkfm-featured-podcast-player.js to <head>"
else
  echo "OK: enhancer script already present"
fi

echo "DONE."
echo "Backup: $BK/$F"
