#!/usr/bin/env bash
set -euo pipefail

# Run Featured maintenance locally (Netlify dev must be running)
# Usage:
#   TKFM_OWNER_KEY=... ./scripts/tkfm-run-featured-maintenance.sh [keepMax]
KEEP_MAX="${1:-250}"

OWNER_KEY="${TKFM_OWNER_KEY:-${TKFM_OWNER_KEY:-}}"

if [ -z "${OWNER_KEY}" ]; then
  echo "FAIL: set TKFM_OWNER_KEY env var"
  exit 2
fi

curl -sS -X POST "http://localhost:8888/.netlify/functions/featured-media-maintenance" \
  -H "Content-Type: application/json" \
  -H "x-tkfm-owner-key: ${OWNER_KEY}" \
  --data "{\"keepMax\": ${KEEP_MAX}}" | cat
echo
