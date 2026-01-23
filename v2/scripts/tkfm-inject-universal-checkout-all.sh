#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TAG1='<script src="/js/tkfm-functions-client.js" defer></script>'
TAG2='<script src="/js/tkfm-universal-price.js" defer></script>'
TAG3='<script src="/js/tkfm-universal-checkout.js" defer></script>'

for f in *.html; do
  [ -f "$f" ] || continue
  if grep -q 'tkfm-universal-checkout.js' "$f"; then
    continue
  fi
  awk -v t1="$TAG1" -v t2="$TAG2" -v t3="$TAG3" 'BEGIN{done=0}{
    if(!done && tolower($0) ~ /<\/head>/){
      print "  " t1
      print "  " t2
      print "  " t3
      done=1
    }
    print $0
  }' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
done

echo "OK: injected universal checkout into all *.html (where missing)"
