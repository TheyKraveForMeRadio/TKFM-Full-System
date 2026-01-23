#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Fixing /public/ asset paths in root HTML (safe replacement) =="
shopt -s nullglob
count=0
for f in *.html; do
  if grep -q "/public/" "$f"; then
    sed -i 's|/public/|/|g' "$f"
    echo " + $f"
    count=$((count+1))
  fi
done
shopt -u nullglob
echo "DONE ✅ patched $count html files."
