#!/usr/bin/env bash
set -euo pipefail

echo "== CHECK: tracking endpoint exists =="
[ -f netlify/functions/featured-media-track.js ] && echo "OK" || { echo "FAIL: missing netlify/functions/featured-media-track.js"; exit 2; }

echo "== CHECK: tracker js exists =="
[ -f js/tkfm-featured-track.js ] && echo "OK" || { echo "FAIL: missing js/tkfm-featured-track.js"; exit 3; }

echo "== CHECK: radio-hub includes tracker =="
if [ -f radio-hub.html ]; then
  grep -n "tkfm-featured-track.js" radio-hub.html >/dev/null 2>&1 && echo "OK" || { echo "FAIL: radio-hub missing tkfm-featured-track.js include"; exit 4; }
else
  echo "WARN: radio-hub.html not found"
fi

echo "== CHECK: featured loader emits REAL data-featured-id wiring =="
if [ -f js/tkfm-radio-tv-featured.js ]; then
  if grep -E "<[^>]*data-featured-id[[:space:]]*=" -n js/tkfm-radio-tv-featured.js >/dev/null 2>&1; then
    echo "OK (markup attribute)"
  elif grep -E "setAttribute\(\s*['\"]data-featured-id['\"]" -n js/tkfm-radio-tv-featured.js >/dev/null 2>&1; then
    echo "OK (DOM setAttribute)"
  else
    echo "FAIL: js/tkfm-radio-tv-featured.js still missing real featured id wiring"
    echo "      Run: ./scripts/tkfm-patch-featured-itid.sh ."
    exit 5
  fi
else
  echo "FAIL: js/tkfm-radio-tv-featured.js not found"
  exit 6
fi
