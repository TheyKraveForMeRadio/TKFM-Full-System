#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist

# Copy ALL root html pages into dist (so Netlify publish=dist always has them)
for f in *.html; do
  [ -f "$f" ] || continue
  cp -f "$f" "dist/$f"
done

echo "OK: copied root HTML into dist/"
ls -la dist/*.html | head -n 25
