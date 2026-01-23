#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

FILES=("pricing.html" "radio-hub.html" "app-hub.html" "label-studio-hub.html" "label-home.html" "index.html")
TAG='<a class="btn ghost" style="text-decoration:none" href="/tkfm-catalog.html">Live Catalog</a>'

echo "TKFM: inject Live Catalog link (safe/idempotent)"
for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  if grep -q 'tkfm-catalog.html' "$f"; then
    echo "OK: $f"
    continue
  fi
  # Insert near first header actions if possible, else before </body>
  if grep -qi '</body>' "$f"; then
    awk -v tag="$TAG" 'BEGIN{done=0}{
      print $0
      if(!done && tolower($0) ~ /<\/body>/){
        print "<div style=\"padding:10px\">"
        print tag
        print "</div>"
        done=1
      }
    }' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
    echo "PATCHED: $f"
  else
    printf "\n%s\n" "$TAG" >> "$f"
    echo "APPENDED: $f"
  fi
done
