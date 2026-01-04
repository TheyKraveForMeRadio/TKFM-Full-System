#!/usr/bin/env bash
set -euo pipefail

# Requires netlify dev running on :8888
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-normalize-featured-ids.sh
#
# Or:
#   TKFM_OWNER_KEY=... ./scripts/tkfm-normalize-featured-ids.sh

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs)"

if [ -z "${KEY}" ]; then
  echo "FAIL: set owner key first:"
  echo "  ./scripts/tkfm-set-owner-key.sh --clipboard"
  echo "  (or export TKFM_OWNER_KEY=...)"
  exit 2
fi

curl -sS -X POST "http://localhost:8888/.netlify/functions/featured-media-normalize-ids" \
  -H "x-tkfm-owner-key: ${KEY}" | cat
echo
