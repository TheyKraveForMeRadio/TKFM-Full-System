#!/usr/bin/env bash
set -euo pipefail

# TKFM: owner utility to prune expired boosts (requires owner key in env TKFM_OWNER_KEY or arg).
# Usage:
#   TKFM_OWNER_KEY=... ./scripts/tkfm-owner-prune-expired-boosts.sh http://localhost:8888
# or:
#   ./scripts/tkfm-owner-prune-expired-boosts.sh http://localhost:8888 YOUR_KEY

BASE_URL="${1:-http://localhost:8888}"
KEY="${2:-${TKFM_OWNER_KEY:-}}"

if [ -z "$KEY" ]; then
  echo "Missing key. Provide as 2nd arg or env TKFM_OWNER_KEY."
  exit 1
fi

curl -sS -X POST "$BASE_URL/.netlify/functions/boost-prune-expired" \
  -H "x-tkfm-owner-key: $KEY" \
  -H "Content-Type: application/json" \
  -d "{}" | cat
echo
