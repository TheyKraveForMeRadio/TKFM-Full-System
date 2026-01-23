#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p releases/archive/old_zips

# Keep these in releases root:
# - *_LATEST.zip
# - *_LATEST.SHA256.txt
# - newest timestamped DIST + FULL_SOURCE zip (optional keep)
KEEP_NEWEST="${1:-1}"

# Move all timestamped zips to archive first
mv -f releases/TKFM_V2_DIST_202*.zip releases/archive/old_zips/ 2>/dev/null || true
mv -f releases/TKFM_V2_FULL_SOURCE_202*.zip releases/archive/old_zips/ 2>/dev/null || true

# Optionally keep newest timestamped pair back in releases root (so you see it next to LATEST)
if [ "$KEEP_NEWEST" = "1" ]; then
  NEW_DIST="$(ls -t releases/archive/old_zips/TKFM_V2_DIST_202*.zip 2>/dev/null | head -n 1 || true)"
  NEW_SRC="$(ls -t releases/archive/old_zips/TKFM_V2_FULL_SOURCE_202*.zip 2>/dev/null | head -n 1 || true)"
  if [ -n "$NEW_DIST" ]; then cp -f "$NEW_DIST" "releases/$(basename "$NEW_DIST")"; fi
  if [ -n "$NEW_SRC" ]; then cp -f "$NEW_SRC" "releases/$(basename "$NEW_SRC")"; fi
fi

echo "DONE ✅ releases pruned."
ls -lh releases | tail -n 40
