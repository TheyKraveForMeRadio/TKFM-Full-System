#!/usr/bin/env bash
set -euo pipefail

# TKFM: run Featured maintenance + normalize ids against a base URL.
# Works for localhost or production.
#
# Usage:
#   TKFM_OWNER_KEY=YOUR_OWNER_KEY ./scripts/tkfm-run-owner-maintenance-now.sh [baseUrl] [keepMax]
#
# Examples:
#   TKFM_OWNER_KEY=... ./scripts/tkfm-run-owner-maintenance-now.sh http://localhost:8888 250
#   TKFM_OWNER_KEY=... ./scripts/tkfm-run-owner-maintenance-now.sh https://www.tkfmradio.com 250

BASE="${1:-http://localhost:8888}"
KEEP="${2:-250}"

if [ -z "${TKFM_OWNER_KEY:-}" ]; then
  echo "FAIL: set TKFM_OWNER_KEY env var"
  exit 2
fi

echo "== CLEANUP =="
curl -sS -X POST "${BASE}/.netlify/functions/featured-media-maintenance" \
  -H "Content-Type: application/json" \
  -H "x-tkfm-owner-key: ${TKFM_OWNER_KEY}" \
  --data "{\"keepMax\": ${KEEP}}" | cat
echo

echo "== NORMALIZE IDS =="
curl -sS -X POST "${BASE}/.netlify/functions/featured-media-normalize-ids" \
  -H "x-tkfm-owner-key: ${TKFM_OWNER_KEY}" | cat
echo
