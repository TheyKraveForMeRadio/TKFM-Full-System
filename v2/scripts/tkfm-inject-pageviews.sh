#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FILES=("index.html" "pricing.html" "radio-hub.html" "app-hub.html" "label-studio-hub.html" "label-studio-create-ultimate.html" "ai-drops-engine.html" "sponsor-on-air.html" "sponsor-read-engine.html")
TAG='<script src="/js/tkfm-pageviews.js"></script>'

echo "TKFM: inject pageview tracker"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  if grep -q 'tkfm-pageviews.js' "$f"; then
    echo "OK: $f"
    continue
  fi
  awk -v tag="$TAG" 'BEGIN{done=0}{
    if(!done && tolower($0) ~ /<\/body>/){
      print "  " tag
      done=1
    }
    print $0
  }' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
  echo "PATCHED: $f"
done

echo "DONE"
