#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist/js

# Copy ALL js/*.js (ensures new fix scripts ship)
if [ -d "js" ]; then
  cp -f js/*.js dist/js/ 2>/dev/null || true
fi

# Copy public/js too if present
if [ -d "public/js" ]; then
  cp -f public/js/*.js dist/js/ 2>/dev/null || true
fi

echo "OK: postbuild copied js/*.js into dist/js"
ls -la dist/js 2>/dev/null | head -n 50 || true
