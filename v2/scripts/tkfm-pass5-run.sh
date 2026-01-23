#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== TKFM PASS 5 RUN =="

echo
echo "[1/3] Build multipage dist..."
scripts/tkfm-build-static-multipage.sh

echo
echo "[2/3] Dist verify..."
node scripts/tkfm-dist-verify.mjs

echo
echo "[3/3] Dist smoke (serve dist + run QA)..."
node scripts/tkfm-dist-smoke.mjs --port 9090

echo
echo "== PASS 5 DONE =="
