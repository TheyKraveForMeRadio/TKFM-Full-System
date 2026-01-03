#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM Featured API verify =="

if [[ ! -f "netlify/functions/media-feature-get.js" ]]; then
  echo "ERROR: netlify/functions/media-feature-get.js not found"
  exit 1
fi

echo "OK: media-feature-get.js exists"

echo "---- quick grep (params supported) ----"
grep -n "searchParams.get('type')" -n netlify/functions/media-feature-get.js || true
grep -n "searchParams.get('limit')" -n netlify/functions/media-feature-get.js || true
grep -n "searchParams.get('shuffle')" -n netlify/functions/media-feature-get.js || true
grep -n "searchParams.get('activeOnly')" -n netlify/functions/media-feature-get.js || true

echo ""
echo "RUN THESE IN A SEPARATE TERMINAL WHILE netlify dev IS RUNNING:"
echo "  curl -s http://localhost:8888/.netlify/functions/media-feature-get | head"
echo "  curl -s 'http://localhost:8888/.netlify/functions/media-feature-get?type=podcast&limit=10' | head"
echo "  curl -s 'http://localhost:8888/.netlify/functions/media-feature-get?shuffle=1&limit=5' | head"

echo ""
echo "Done."
