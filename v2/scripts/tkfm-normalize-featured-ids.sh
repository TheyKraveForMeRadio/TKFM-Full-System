#!/usr/bin/env bash
set -euo pipefail

# Requires netlify dev running on :8888
# Usage:
#   TKFM_OWNER_KEY=YOUR_OWNER_KEY ./scripts/tkfm-normalize-featured-ids.sh

if [ -z "${TKFM_OWNER_KEY:-}" ]; then
  echo "FAIL: set TKFM_OWNER_KEY env var"
  exit 2
fi

curl -sS -X POST "http://localhost:8888/.netlify/functions/featured-media-normalize-ids" \
  -H "x-tkfm-owner-key: ${TKFM_OWNER_KEY}" | cat
echo
