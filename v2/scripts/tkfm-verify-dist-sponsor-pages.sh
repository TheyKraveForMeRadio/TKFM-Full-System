#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "TKFM: Dist verification for Sponsor Read pages"
if [ ! -d "dist" ]; then
  echo "NO dist/ found. Run: npm run build"
  exit 1
fi

need=(
  "dist/sponsor-read-engine.html"
  "dist/sponsor-success.html"
  "dist/sponsor-cancel.html"
  "dist/owner-sponsor-ops.html"
)

ok=1
for p in "${need[@]}"; do
  if [ -f "$p" ]; then
    echo "OK: $p"
  else
    echo "MISSING: $p"
    ok=0
  fi
done

if [ "$ok" -eq 0 ]; then
  echo
  echo "If missing, your multipage postbuild copy isn't copying new root HTML files into dist."
  echo "Quick fix (run after build):"
  echo "  cp -f sponsor-read-engine.html sponsor-success.html sponsor-cancel.html owner-sponsor-ops.html dist/"
  exit 2
fi

echo
echo "ALL GOOD."
