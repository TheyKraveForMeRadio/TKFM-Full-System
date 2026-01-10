#!/usr/bin/env bash
set -euo pipefail

# TKFM: Stripe key mode helper
# Prints: live | test | unknown
#
# Usage:
#   ./scripts/tkfm-stripe-mode.sh
#   STRIPE_SECRET_KEY=sk_live_... ./scripts/tkfm-stripe-mode.sh

k="${STRIPE_SECRET_KEY:-}"
if [[ "$k" == sk_live_* ]]; then
  echo "live"
elif [[ "$k" == sk_test_* ]]; then
  echo "test"
else
  echo "unknown"
fi
