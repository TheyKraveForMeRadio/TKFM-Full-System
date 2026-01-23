#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:5173}"
echo "== TKFM CHECKOUT BATCH SMOKE =="
echo "Base: ${BASE}"
node scripts/tkfm-checkout-batch-smoke.cjs "${BASE}"
