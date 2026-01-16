#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FILE="label-studio-hub.html"
TAG='<script src="/js/tkfm-studio-billing.js"></script>'

if [ ! -f "$FILE" ]; then
  echo "SKIP: $FILE missing"
  exit 0
fi

if grep -q 'tkfm-studio-billing.js' "$FILE"; then
  echo "OK: already injected"
  exit 0
fi

if grep -qi '</body>' "$FILE"; then
  awk -v tag="$TAG" 'BEGIN{done=0}
    {
      if(!done && tolower($0) ~ /<\/body>/){
        print "  " tag
        done=1
      }
      print $0
    }' "$FILE" > "$FILE.__tmp__"
  mv "$FILE.__tmp__" "$FILE"
  echo "PATCHED: injected before </body>"
else
  printf "\n%s\n" "$TAG" >> "$FILE"
  echo "PATCHED: appended"
fi
