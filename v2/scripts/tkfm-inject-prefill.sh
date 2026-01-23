#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FILE="label-studio-create-ultimate.html"
if [ ! -f "$FILE" ]; then
  echo "Missing: $FILE"
  exit 1
fi

# Remove duplicates
grep -v 'tkfm-prefill-from-profile\\.js' "$FILE" > "$FILE.__tmp__"
mv "$FILE.__tmp__" "$FILE"

# Inject before pro mix lane (or before ultimate)
awk '
BEGIN{done=0}
{
  line=$0
  if(!done && (line ~ /tkfm-pro-mix-lane\\.js/ || line ~ /tkfm-label-studio-create-ultimate\\.js/)){
    print "  <script src=\\"/js/tkfm-prefill-from-profile.js\\"></script>"
    done=1
  }
  print line
}' "$FILE" > "$FILE.__tmp__" && mv "$FILE.__tmp__" "$FILE"

echo "OK: injected prefill script into $FILE"
