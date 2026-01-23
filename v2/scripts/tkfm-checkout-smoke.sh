#!/usr/bin/env bash
set -euo pipefail

LOOKUP_KEY="${1:-}"
BASE_URL="${2:-http://localhost:9999}"

if [[ -z "${LOOKUP_KEY}" ]]; then
  echo "Usage: bash scripts/tkfm-checkout-smoke.sh <lookup_key> [baseUrl]"
  echo "Example: bash scripts/tkfm-checkout-smoke.sh creator_pass_monthly http://localhost:9999"
  exit 2
fi

node "$(cd "$(dirname "$0")/.." && pwd)/scripts/tkfm-checkout-smoke.js" "${LOOKUP_KEY}" "${BASE_URL}"
