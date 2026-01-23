#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FILES=("label-studio-hub.html" "label-home.html" "app-hub.html" "pricing.html" "radio-hub.html")
TAG='<script src="/js/tkfm-label-studio-create-cta.js"></script>'

echo "TKFM: Inject Create Studio CTA script into key pages (safe/idempotent)"
for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP: $f"
    continue
  fi
  if grep -q 'tkfm-label-studio-create-cta.js' "$f"; then
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
