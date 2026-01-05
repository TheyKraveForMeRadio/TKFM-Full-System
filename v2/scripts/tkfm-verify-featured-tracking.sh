#!/usr/bin/env bash
set -euo pipefail

echo "== CHECK: tracking endpoint exists =="
[ -f netlify/functions/featured-media-track.js ] && echo "OK" || { echo "FAIL: missing featured-media-track.js"; exit 2; }

echo "== CHECK: tracker js exists =="
[ -f js/tkfm-featured-track.js ] && echo "OK" || { echo "FAIL: missing js/tkfm-featured-track.js"; exit 3; }

echo "== CHECK: radio-hub includes tracker == "
if [ -f radio-hub.html ]; then
  grep -n "tkfm-featured-track.js" radio-hub.html >/dev/null && echo "OK" || echo "WARN: radio-hub.html missing tracker include"
else
  echo "WARN: radio-hub.html not found"
fi

echo "== CHECK: featured loader emits REAL data-featured-id wiring == "
if [ -f js/tkfm-radio-tv-featured.js ]; then
  if grep -Eq "data-featured-id|dataset\.featuredId" js/tkfm-radio-tv-featured.js; then
    echo "OK"
  else
    echo "FAIL: js/tkfm-radio-tv-featured.js missing featured id wiring"
    echo "      Run: ./scripts/tkfm-force-featured-id-wiring.sh ."
    exit 4
  fi
else
  echo "WARN: js/tkfm-radio-tv-featured.js not found"
fi
