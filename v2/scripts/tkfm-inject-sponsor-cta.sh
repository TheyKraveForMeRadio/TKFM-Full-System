#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

FILES=(
  "pricing.html"
  "radio-hub.html"
  "app-hub.html"
  "index.html"
)

TAG='<script src="/js/tkfm-sponsor-cta.js"></script>'

echo "TKFM: Inject Sponsor CTA script into common pages (safe, idempotent)"
echo

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP (missing): $f"
    continue
  fi

  if grep -q 'tkfm-sponsor-cta.js' "$f"; then
    echo "OK (already): $f"
    continue
  fi

  # Insert before closing </body> if present; else append at end.
  if grep -qi '</body>' "$f"; then
    awk -v tag="$TAG" 'BEGIN{done=0}
      {
        if(!done && tolower($0) ~ /<\/body>/){
          print "  " tag
          done=1
        }
        print $0
      }' "$f" > "$f.__tmp__"
    mv "$f.__tmp__" "$f"
    echo "PATCHED: $f (injected before </body>)"
  else
    printf "\n%s\n" "$TAG" >> "$f"
    echo "PATCHED: $f (appended)"
  fi
done

echo
echo "DONE. Verify: open pages on http://localhost:5173 and look for the Sponsor Read floating button."
