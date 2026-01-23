#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== TKFM PASS 4 RUN =="

echo
echo "[1/3] Multipage dist export..."
scripts/tkfm-build-static-multipage.sh

echo
echo "[2/3] Dist verify..."
node scripts/tkfm-dist-verify.mjs

echo
echo "[3/3] Prune releases (keep newest timestamped pair visible)..."
bash scripts/tkfm-release-prune.sh 1

echo
echo "== PASS 4 DONE =="
