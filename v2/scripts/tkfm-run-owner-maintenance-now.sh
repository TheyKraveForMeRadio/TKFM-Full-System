#!/usr/bin/env bash
set -euo pipefail

# TKFM: run Featured maintenance + normalize ids against a base URL.
# Works for localhost or production.
#
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-run-owner-maintenance-now.sh http://localhost:8888 250
#   ./scripts/tkfm-run-owner-maintenance-now.sh https://www.tkfmradio.com 250
#
# Or:
#   TKFM_OWNER_KEY=... ./scripts/tkfm-run-owner-maintenance-now.sh ...

BASE="${1:-http://localhost:8888}"
KEEP="${2:-250}"

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs)"

if [ -z "${KEY}" ]; then
  echo "FAIL: set owner key first:"
  echo "  ./scripts/tkfm-set-owner-key.sh --clipboard"
  echo "  (or export TKFM_OWNER_KEY=...)"
  exit 2
fi

echo "== CLEANUP =="
curl -sS -X POST "${BASE}/.netlify/functions/featured-media-maintenance" \
  -H "Content-Type: application/json" \
  -H "x-tkfm-owner-key: ${KEY}" \
  --data "{\"keepMax\": ${KEEP}}" | cat
echo

echo "== NORMALIZE IDS =="
curl -sS -X POST "${BASE}/.netlify/functions/featured-media-normalize-ids" \
  -H "x-tkfm-owner-key: ${KEY}" | cat
echo
