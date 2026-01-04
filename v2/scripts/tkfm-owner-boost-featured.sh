#!/usr/bin/env bash
set -euo pipefail

# TKFM: Owner CLI boost for a featured item by id
# Usage:
#   TKFM_OWNER_KEY=... ./scripts/tkfm-owner-boost-featured.sh http://localhost:8888 FEATURED_ID 7
#   TKFM_OWNER_KEY=... ./scripts/tkfm-owner-boost-featured.sh https://www.tkfmradio.com FEATURED_ID 30

BASE_URL="${1:-http://localhost:8888}"
ID="${2:-}"
DAYS="${3:-}"

KEY="${TKFM_OWNER_KEY:-}"

if [ -z "$KEY" ]; then
  echo "Missing TKFM_OWNER_KEY env."
  exit 1
fi

if [ -z "$ID" ] || [ -z "$DAYS" ]; then
  echo "Usage: TKFM_OWNER_KEY=... $0 BASE_URL FEATURED_ID DAYS"
  exit 1
fi

curl -sS -X POST "$BASE_URL/.netlify/functions/featured-media-boost" \
  -H "x-tkfm-owner-key: $KEY" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$ID\",\"days\":$DAYS}" | cat
echo
