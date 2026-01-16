#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TAG='<script src="/js/tkfm-functions-client.js"></script>'

FILES=(
  "index.html"
  "pricing.html"
  "radio-hub.html"
  "app-hub.html"
  "ai-drops-engine.html"
  "sponsor-read-engine.html"
)

echo "Injecting tkfm-functions-client.js (safe, idempotent)"
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP: $f"
    continue
  fi
  if grep -q 'tkfm-functions-client.js' "$f"; then
    echo "OK: $f"
    continue
  fi
  if grep -qi '</head>' "$f"; then
    awk -v tag="$TAG" 'BEGIN{done=0}
      {
        if(!done && tolower($0) ~ /<\/head>/){
          print "  " tag
          done=1
        }
        print $0
      }' "$f" > "$f.__tmp__"
    mv "$f.__tmp__" "$f"
    echo "PATCHED: $f"
  else
    printf "\n%s\n" "$TAG" >> "$f"
    echo "APPENDED: $f"
  fi
done

echo "DONE."
