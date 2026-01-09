#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist

# Copy ALL root HTML pages into dist (so Netlify publish=dist always has them)
for f in *.html; do
  [ -f "$f" ] || continue
  cp -f "$f" "dist/$f"
done

# Copy Netlify config files into dist (so headers/redirects apply in production)
if [ -f "public/_headers" ]; then
  cp -f "public/_headers" "dist/_headers"
fi
if [ -f "_headers" ]; then
  cp -f "_headers" "dist/_headers"
fi
if [ -f "public/_redirects" ]; then
  cp -f "public/_redirects" "dist/_redirects"
fi
if [ -f "_redirects" ]; then
  cp -f "_redirects" "dist/_redirects"
fi

echo "OK: copied root HTML + _headers/_redirects into dist/"
ls -la dist/_headers 2>/dev/null || true
ls -la dist/_redirects 2>/dev/null || true
