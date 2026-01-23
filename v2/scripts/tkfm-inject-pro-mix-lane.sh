#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FILE="label-studio-create-ultimate.html"

if [ ! -f "$FILE" ]; then
  echo "Missing: $FILE"
  exit 1
fi

# Remove duplicates
grep -v 'tkfm-post-checkout-intent\.js' "$FILE" | grep -v 'tkfm-pro-mix-lane\.js' > "$FILE.__tmp__"
mv "$FILE.__tmp__" "$FILE"

# Inject before ultimate engine script
awk '
BEGIN{done=0}
{
  line=$0
  if(!done && line ~ /tkfm-label-studio-create-ultimate\.js/){
    print "  <script src=\"/js/tkfm-post-checkout-intent.js\"></script>"
    print "  <script src=\"/js/tkfm-pro-mix-lane.js\"></script>"
    done=1
  }
  print line
}' "$FILE" > "$FILE.__tmp__" && mv "$FILE.__tmp__" "$FILE"

echo "OK: injected Pro Mix lane scripts into $FILE"
