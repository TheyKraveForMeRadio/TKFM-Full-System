#!/usr/bin/env bash
set -euo pipefail

# Ensure dist/js exists, then copy the owner guard so /js/tkfm-owner-guard.js is present on deploy.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
SRC_FILE="${ROOT_DIR}/js/tkfm-owner-guard.js"
DEST_DIR="${DIST_DIR}/js"

if [ ! -d "${DIST_DIR}" ]; then
  echo "dist/ not found (nothing to copy)."
  exit 0
fi

mkdir -p "${DEST_DIR}"

if [ -f "${SRC_FILE}" ]; then
  cp -f "${SRC_FILE}" "${DEST_DIR}/tkfm-owner-guard.js"
  echo "✅ Copied tkfm-owner-guard.js -> dist/js/"
else
  echo "❌ Missing source file: js/tkfm-owner-guard.js"
  exit 1
fi
