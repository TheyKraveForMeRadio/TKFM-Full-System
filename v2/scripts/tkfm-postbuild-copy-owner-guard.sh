#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
PUBLIC_FILE="${ROOT_DIR}/public/js/tkfm-owner-guard.js"
LEGACY_FILE="${ROOT_DIR}/js/tkfm-owner-guard.js"
DEST_DIR="${DIST_DIR}/js"

if [ ! -d "${DIST_DIR}" ]; then
  echo "dist/ not found (nothing to copy)."
  exit 0
fi

mkdir -p "${DEST_DIR}"

# Prefer public/ version (works for Vite + deploy)
if [ -f "${PUBLIC_FILE}" ]; then
  cp -f "${PUBLIC_FILE}" "${DEST_DIR}/tkfm-owner-guard.js"
  echo "✅ Copied public/js/tkfm-owner-guard.js -> dist/js/"
elif [ -f "${LEGACY_FILE}" ]; then
  cp -f "${LEGACY_FILE}" "${DEST_DIR}/tkfm-owner-guard.js"
  echo "✅ Copied js/tkfm-owner-guard.js -> dist/js/"
else
  echo "❌ Missing owner guard source file (public/js or js)."
  exit 1
fi
