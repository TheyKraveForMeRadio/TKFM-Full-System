#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: RADIO-TV Featured Podcast Rotator (auto-pick + timer) =="

F="radio-tv.html"
if [ ! -f "$F" ]; then
  echo "FAIL: radio-tv.html not found."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/radio-tv-podcast-rotator-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# Ensure the player enhancer exists; if missing, warn (rotator depends on it)
if ! grep -qiE 'tkfm-featured-podcast-player\.js' "$F"; then
  echo "WARN: tkfm-featured-podcast-player.js not referenced in radio-tv.html"
  echo "      Install the podcast player patch first."
fi

# Inject rotator script in <head>
if ! grep -qiE 'tkfm-featured-podcast-rotator\.js' "$F"; then
  awk -v INS='  <script src="/js/tkfm-featured-podcast-rotator.js" defer></script>' '
    BEGIN{done=0}
    {
      if (!done && tolower($0) ~ /<\/head>/) { print INS; done=1; }
      print $0;
    }
  ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
  echo "OK: added /js/tkfm-featured-podcast-rotator.js"
else
  echo "OK: rotator script already present"
fi

echo "DONE."
echo "Backup: $BK/$F"
