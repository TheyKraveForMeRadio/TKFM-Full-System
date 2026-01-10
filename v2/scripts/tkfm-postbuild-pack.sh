#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

if [[ ! -d "$DIST" ]]; then
  mkdir -p "$DIST"
fi

echo "== TKFM POSTBUILD PACK =="
echo "ROOT=$ROOT"
echo "DIST=$DIST"

# 1) Copy all root HTML pages into dist (Vite only builds index.html by default)
shopt -s nullglob
HTMLS=("$ROOT"/*.html)
if (( ${#HTMLS[@]} == 0 )); then
  echo "WARN: no root *.html files found to copy"
else
  for f in "${HTMLS[@]}"; do
    bn="$(basename "$f")"
    cp -f "$f" "$DIST/$bn"
  done
  echo "OK: copied ${#HTMLS[@]} html file(s) into dist/"
fi
shopt -u nullglob

# 2) Ensure legacy /js scripts ship (many pages reference /js/*.js)
if [[ -d "$ROOT/js" ]]; then
  mkdir -p "$DIST/js"
  # Copy without deleting dist assets produced by Vite
  cp -R "$ROOT/js/." "$DIST/js/"
  echo "OK: copied js/ -> dist/js/"
else
  echo "WARN: missing js/ folder"
fi

# 3) Ensure public assets exist in dist root (logos, images, etc.)
if [[ -d "$ROOT/public" ]]; then
  cp -R "$ROOT/public/." "$DIST/"
  echo "OK: copied public/ -> dist/"
else
  echo "WARN: missing public/ folder"
fi

# 4) Generate Netlify _redirects for extensionless URLs + SPA fallback
RED="$DIST/_redirects"
: > "$RED"

# Explicit extensionless redirects for each HTML file present in dist
shopt -s nullglob
for f in "$DIST"/*.html; do
  bn="$(basename "$f")"
  base="${bn%.html}"

  # Skip common fallbacks
  if [[ "$base" == "index" || "$base" == "404" ]]; then
    continue
  fi

  echo "/$base /$bn 200" >> "$RED"
  echo "/$base/ /$bn 200" >> "$RED"
done
shopt -u nullglob

# Keep the site from showing Netlify 404 on deep links
echo "/* /index.html 200" >> "$RED"

echo "OK: wrote $RED"
echo "DONE"
