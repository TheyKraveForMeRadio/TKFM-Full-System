#!/usr/bin/env bash
set -euo pipefail

# copy critical static js into dist so /js/... exists in production
mkdir -p dist/js

# prefer public/js if present
if [ -f "public/js/tkfm-owner-guard.js" ]; then
  cp -f public/js/tkfm-owner-guard.js dist/js/tkfm-owner-guard.js
fi
if [ -f "public/js/tkfm-owner-gate-no-redirect.js" ]; then
  cp -f public/js/tkfm-owner-gate-no-redirect.js dist/js/tkfm-owner-gate-no-redirect.js
fi

echo "OK: postbuild copied owner guard scripts into dist/js"
ls -la dist/js/tkfm-owner-guard.js dist/js/tkfm-owner-gate-no-redirect.js
