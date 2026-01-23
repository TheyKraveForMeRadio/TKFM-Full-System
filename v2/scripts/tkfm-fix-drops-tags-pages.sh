#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FILES=("pricing.html" "radio-hub.html" "ai-drops-engine.html" "app-hub.html")
TAG='<script src="/js/tkfm-drops-tags-fix.js"></script>'

echo "TKFM: Inject drops/tags fix script into pages (safe/idempotent)"
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP: $f"
    continue
  fi
  if grep -q 'tkfm-drops-tags-fix.js' "$f"; then
    echo "OK: $f"
    continue
  fi
  if grep -qi '</body>' "$f"; then
    awk -v tag="$TAG" 'BEGIN{done=0}{ if(!done && tolower($0) ~ /<\/body>/){ print "  " tag; done=1 } print $0 }' "$f" > "$f.__tmp__"
    mv "$f.__tmp__" "$f"
    echo "PATCHED: $f"
  else
    printf "\n%s\n" "$TAG" >> "$f"
    echo "APPENDED: $f"
  fi
done
echo "DONE."
