#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
DIST="$ROOT/dist"

echo "== TKFM BUILD: STATIC MULTIPAGE -> dist =="

echo "Clean dist..."
rm -rf "$DIST"
mkdir -p "$DIST"

# Copy all root HTML pages
echo "Copy *.html -> dist/"
find "$ROOT" -maxdepth 1 -type f -name "*.html" -print0 | while IFS= read -r -d '' f; do
  cp -f "$f" "$DIST/"
done

# Copy root text files + netlify redirects
for f in _redirects _headers robots.txt sitemap.xml; do
  if [ -f "$ROOT/$f" ]; then
    cp -f "$ROOT/$f" "$DIST/"
  fi
done

# Copy asset folders if present
for d in js css public; do
  if [ -d "$ROOT/$d" ]; then
    echo "Copy $d/ -> dist/$d/"
    mkdir -p "$DIST/$d"
    # Use cp for portability
    cp -R "$ROOT/$d/." "$DIST/$d/"
  fi
done

# Mirror public/* into dist/ root too (Vite-like behavior)
if [ -d "$ROOT/public" ]; then
  echo "Copy public/* -> dist/ root (asset root)"
  cp -R "$ROOT/public/." "$DIST/"
fi

echo "OK: dist packed" && ls -la "$DIST" | head -n 20
