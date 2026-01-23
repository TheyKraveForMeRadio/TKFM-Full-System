#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p releases
TS="$(date +%Y%m%d_%H%M%S)"

# Build multipage dist (uses your existing exporter if present)
if [ -x scripts/tkfm-build-static-multipage.sh ]; then
  scripts/tkfm-build-static-multipage.sh
else
  npm run build
fi

# SOURCE ZIP (exclude node_modules/.git/releases)
tar -a -cf "releases/TKFM_V2_FULL_SOURCE_${TS}.zip" \
  --exclude "./node_modules" \
  --exclude "./.git" \
  --exclude "./releases" \
  --exclude "./.tkfm" \
  ./ || powershell.exe -NoProfile -Command \
  "Compress-Archive -Path . -DestinationPath ('releases/TKFM_V2_FULL_SOURCE_${TS}.zip') -Force"

# DIST ZIP (deploy pack)
tar -a -cf "releases/TKFM_V2_DIST_${TS}.zip" ./dist ./_redirects 2>/dev/null || powershell.exe -NoProfile -Command \
  "Compress-Archive -Path dist,_redirects -DestinationPath ('releases/TKFM_V2_DIST_${TS}.zip') -Force"

echo "DONE ✅"
ls -lh releases | tail -n 10
