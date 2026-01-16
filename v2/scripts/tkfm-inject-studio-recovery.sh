#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FILES=("label-studio-hub.html")
TAG='<script src="/js/tkfm-studio-recovery.js"></script>'

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP: $f"
    continue
  fi
  if grep -q 'tkfm-studio-recovery.js' "$f"; then
    echo "OK: already injected into $f"
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
