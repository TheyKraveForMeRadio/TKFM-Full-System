#!/usr/bin/env bash
set -euo pipefail

# Requires netlify dev running on :8888
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-sync-owner-key-to-dotenv.sh
#   netlify dev --port 8888
#   ./scripts/tkfm-normalize-featured-ids.sh

./scripts/tkfm-sync-owner-key-to-dotenv.sh . >/dev/null 2>&1 || true

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"

if [ -z "${KEY}" ]; then
  echo "FAIL: set owner key first:"
  echo "  ./scripts/tkfm-set-owner-key.sh --clipboard"
  exit 2
fi

curl -sS -X POST "http://localhost:8888/.netlify/functions/featured-media-normalize-ids" \
  -H "x-tkfm-owner-key: ${KEY}" | cat
echo
