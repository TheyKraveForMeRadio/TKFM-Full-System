#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== TKFM READY CHECK =="

echo
echo "[1/6] Security scan (Stripe keys in files)..."
node scripts/tkfm-launch-polish-remove-secrets.mjs || true

echo
echo "[2/6] Pass 3 runner (cleanup + nav normalize + health scan)..."
node scripts/tkfm-polish-pass3-run.mjs

echo
echo "[3/6] Full QA (localhost:5173 must be running)..."
node scripts/tkfm-release-qa.mjs --base http://localhost:5173

echo
echo "[4/6] Multipage build export (dist contains ALL pages)..."
scripts/tkfm-build-static-multipage.sh

echo
echo "[5/6] Create release zips..."
bash scripts/tkfm-make-release-zips.sh

echo
echo "[6/6] Promote latest as OFFICIAL + receipts..."
mkdir -p releases/archive

LATEST_DIST="$(ls -t releases/TKFM_V2_DIST_*.zip | head -n 1)"
LATEST_SRC="$(ls -t releases/TKFM_V2_FULL_SOURCE_*.zip | head -n 1)"

cp -f "$LATEST_DIST" releases/TKFM_V2_DIST_LATEST.zip
cp -f "$LATEST_SRC" releases/TKFM_V2_FULL_SOURCE_LATEST.zip

certutil -hashfile releases/TKFM_V2_DIST_LATEST.zip SHA256 > releases/TKFM_V2_DIST_LATEST.SHA256.txt
certutil -hashfile releases/TKFM_V2_FULL_SOURCE_LATEST.zip SHA256 > releases/TKFM_V2_FULL_SOURCE_LATEST.SHA256.txt

echo
echo "== READY DONE =="
ls -lh releases | tail -n 30
