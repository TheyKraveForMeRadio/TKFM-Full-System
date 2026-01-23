#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== TKFM multipage build =="
echo "ROOT: $ROOT_DIR"

rm -rf dist
mkdir -p dist

echo "Running: npm run build"
npm run build

mkdir -p dist

echo "== Ensuring ALL root *.html pages are shipped into dist =="
shopt -s nullglob
for f in "$ROOT_DIR"/*.html; do
  bn="$(basename "$f")"
  cp -f "$f" "$ROOT_DIR/dist/$bn"
  echo " + $bn"
done
shopt -u nullglob

echo "== Copying required static files into dist (if present) =="
for rf in "_redirects" "robots.txt" "sitemap.xml" "manifest.webmanifest" "favicon.ico" "og-image.png"; do
  if [ -f "$ROOT_DIR/$rf" ]; then
    cp -f "$ROOT_DIR/$rf" "$ROOT_DIR/dist/$rf"
    echo " + $rf"
  fi
done

if [ -d "$ROOT_DIR/public" ]; then
  cp -R "$ROOT_DIR/public/." "$ROOT_DIR/dist/" 2>/dev/null || true
  echo " + public/* → dist/"
fi

if [ -d "$ROOT_DIR/js" ]; then
  mkdir -p "$ROOT_DIR/dist/js"
  cp -R "$ROOT_DIR/js/." "$ROOT_DIR/dist/js/" 2>/dev/null || true
  echo " + js/* → dist/js/"
fi

echo "== DONE: dist now contains ALL pages =="
