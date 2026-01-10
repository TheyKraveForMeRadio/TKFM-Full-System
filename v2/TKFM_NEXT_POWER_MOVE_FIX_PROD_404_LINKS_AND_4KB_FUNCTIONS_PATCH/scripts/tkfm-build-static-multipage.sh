#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== TKFM STATIC MULTIPAGE BUILD =="
echo "ROOT=$ROOT_DIR"

# Clean dist
rm -rf dist
mkdir -p dist

# Build Tailwind -> public/tailwind.css (existing pipeline)
# (This keeps your current pages working without Vite bundling.)
npm run tw:build

# Copy ALL root html pages
shopt -s nullglob
HTMLS=( *.html )
if [ ${#HTMLS[@]} -eq 0 ]; then
  echo "FAIL: no root *.html found" >&2
  exit 1
fi
for f in "${HTMLS[@]}"; do
  cp -f "$f" dist/
  echo "COPY: $f -> dist/" 
done

# Copy JS folder
if [ -d js ]; then
  rm -rf dist/js
  cp -R js dist/
  echo "COPY: js/ -> dist/js/"
fi

# Copy public assets (logos, tailwind.css, images, etc)
if [ -d public ]; then
  cp -R public/. dist/
  echo "COPY: public/. -> dist/"
fi

# Generate pretty-url redirects: /pricing -> /pricing.html
# Also supports trailing slash: /pricing/ -> /pricing.html
{
  echo "# TKFM multipage pretty URLs"
  echo "# generated=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo ""
  # index variants
  echo "/index /index.html 200"
  echo "/index/ /index.html 200"

  for f in dist/*.html; do
    b="$(basename "$f" .html)"
    [ "$b" = "index" ] && continue
    echo "/$b /$b.html 200"
    echo "/$b/ /$b.html 200"
  done
} > dist/_redirects

echo "WROTE: dist/_redirects"

echo "DONE: dist packed with ${#HTMLS[@]} pages"
