#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: prebuild clean =="

# Clean junk that should never affect build output
rm -rf backups 2>/dev/null || true
rm -rf .netlify 2>/dev/null || true

# If a previous build left dist, clear it so we don’t ship stale files
rm -rf dist 2>/dev/null || true

# Ensure public folders exist (vite copies these into dist)
mkdir -p public/js public/css public/src public/v2

echo "OK: clean complete"
