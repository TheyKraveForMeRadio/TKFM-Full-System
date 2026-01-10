#!/usr/bin/env bash
set -euo pipefail

# TKFM: run Featured maintenance + normalize ids against a base URL.
# Works for localhost or production.
#
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-sync-owner-key-to-dotenv.sh
#   netlify dev --port 8888
#   ./scripts/tkfm-run-owner-maintenance-now.sh http://localhost:8888 250
#
# Or prod:
#   ./scripts/tkfm-run-owner-maintenance-now.sh https://www.tkfmradio.com 250

BASE="${1:-http://localhost:8888}"
KEEP="${2:-250}"

if echo "$BASE" | grep -q "localhost"; then
  ./scripts/tkfm-sync-owner-key-to-dotenv.sh . >/dev/null 2>&1 || true
fi

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"

if [ -z "${KEY}" ]; then
  echo "FAIL: set owner key first:"
  echo "  ./scripts/tkfm-set-owner-key.sh --clipboard"
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
