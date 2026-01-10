#!/usr/bin/env bash
set -euo pipefail

# TKFM: print sha fingerprints (no secret leak)
# Usage:
#   ./scripts/tkfm-print-owner-sha.sh http://localhost:8888

BASE="${1:-http://localhost:8888}"

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"

if [ -z "${KEY}" ]; then
  echo "FAIL: missing owner key"
  exit 2
fi

echo "== owner-auth-check =="
curl -sS "${BASE}/.netlify/functions/owner-auth-check" -H "x-tkfm-owner-key: ${KEY}" | cat
echo
